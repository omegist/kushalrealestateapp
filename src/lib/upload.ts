import { supabase } from "@/integrations/supabase/client";

/**
 * Downscales/re-compresses an image in the browser before upload, so a
 * phone photo (often 4-8 MB) doesn't eat into R2's free tier at full size.
 * - Only touches images (never videos).
 * - Only kicks in above MAX_DIMENSION or MIN_SIZE_TO_COMPRESS, so small
 *   images are left untouched.
 * - Caps the longest side at 1920px (plenty for full-screen mobile viewing)
 *   and re-encodes as JPEG at 85% quality — visually lossless for photos,
 *   typically 70-90% smaller than an original phone photo.
 */
const MAX_DIMENSION = 1920;
const JPEG_QUALITY = 0.85;
const MIN_SIZE_TO_COMPRESS = 300 * 1024; // 300 KB

async function compressImage(file: File): Promise<File> {
  if (!file.type.startsWith("image/") || file.type === "image/gif") return file; // don't touch GIFs (breaks animation)
  if (file.size < MIN_SIZE_TO_COMPRESS) return file;

  try {
    const bitmap = await createImageBitmap(file);
    let { width, height } = bitmap;
    if (width <= MAX_DIMENSION && height <= MAX_DIMENSION) {
      bitmap.close();
      return file; // already small enough
    }

    const scale = MAX_DIMENSION / Math.max(width, height);
    width = Math.round(width * scale);
    height = Math.round(height * scale);

    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext("2d");
    if (!ctx) { bitmap.close(); return file; }
    ctx.drawImage(bitmap, 0, 0, width, height);
    bitmap.close();

    const blob: Blob | null = await new Promise((resolve) =>
      canvas.toBlob(resolve, "image/jpeg", JPEG_QUALITY),
    );
    if (!blob) return file;

    // Only use the compressed version if it's actually smaller.
    if (blob.size >= file.size) return file;

    const newName = file.name.replace(/\.\w+$/, "") + ".jpg";
    return new File([blob], newName, { type: "image/jpeg" });
  } catch {
    // Any failure (unsupported format, browser quirk, etc.) — just upload the original.
    return file;
  }
}

/**
 * Uploads a single file straight to Cloudflare R2 and returns its public URL.
 *
 * Flow:
 *   0. If it's an image, downscale/compress it in the browser first.
 *   1. Ask the CORE `sign-upload` Edge Function (admin-only) for a presigned
 *      R2 PUT URL. The user's admin session is attached automatically.
 *   2. PUT the file directly to R2 (nothing large passes through our server).
 *   3. Build the public URL from VITE_R2_PUBLIC_URL + the returned key.
 *
 * @param file     the File from an <input type="file">
 * @param folder   logical folder in the bucket, e.g. "properties" | "banners" | "team" | "videos"
 * @param onProgress optional 0..100 progress callback
 */
export async function uploadToR2(
  file: File,
  folder: string,
  onProgress?: (percent: number) => void,
): Promise<string> {
  const publicBase = import.meta.env.VITE_R2_PUBLIC_URL as string | undefined;
  if (!publicBase || publicBase.startsWith("PASTE_")) {
    throw new Error("R2 is not configured yet (VITE_R2_PUBLIC_URL missing in .env).");
  }

  const uploadFile = await compressImage(file);

  // 1) Get a presigned URL from the Edge Function.
  const { data, error } = await supabase.functions.invoke("sign-upload", {
    body: { filename: uploadFile.name, folder },
  });
  if (error) throw new Error(error.message || "Could not get an upload URL.");
  const { uploadUrl, key } = (data ?? {}) as { uploadUrl?: string; key?: string };
  if (!uploadUrl || !key) throw new Error("Upload URL response was invalid.");

  // 2) PUT the file to R2 with progress (XHR gives us upload progress events).
  await new Promise<void>((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open("PUT", uploadUrl, true);
    xhr.setRequestHeader("Content-Type", uploadFile.type || "application/octet-stream");
    xhr.upload.onprogress = (e) => {
      if (e.lengthComputable && onProgress) onProgress(Math.round((e.loaded / e.total) * 100));
    };
    xhr.onload = () =>
      xhr.status >= 200 && xhr.status < 300
        ? resolve()
        : reject(new Error(`Upload failed (${xhr.status}). ${xhr.responseText || ""}`));
    xhr.onerror = () => reject(new Error("Network error during upload."));
    xhr.send(uploadFile);
  });

  // 3) Public URL for displaying the file.
  return `${publicBase.replace(/\/+$/, "")}/${key}`;
}