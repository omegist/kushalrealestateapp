import { supabase } from "@/integrations/supabase/client";

/**
 * Uploads a single file straight to Cloudflare R2 and returns its public URL.
 *
 * Flow:
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

  // 1) Get a presigned URL from the Edge Function.
  const { data, error } = await supabase.functions.invoke("sign-upload", {
    body: { filename: file.name, folder },
  });
  if (error) throw new Error(error.message || "Could not get an upload URL.");
  const { uploadUrl, key } = (data ?? {}) as { uploadUrl?: string; key?: string };
  if (!uploadUrl || !key) throw new Error("Upload URL response was invalid.");

  // 2) PUT the file to R2 with progress (XHR gives us upload progress events).
  await new Promise<void>((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open("PUT", uploadUrl, true);
    xhr.setRequestHeader("Content-Type", file.type || "application/octet-stream");
    xhr.upload.onprogress = (e) => {
      if (e.lengthComputable && onProgress) onProgress(Math.round((e.loaded / e.total) * 100));
    };
    xhr.onload = () =>
      xhr.status >= 200 && xhr.status < 300
        ? resolve()
        : reject(new Error(`Upload failed (${xhr.status}). ${xhr.responseText || ""}`));
    xhr.onerror = () => reject(new Error("Network error during upload."));
    xhr.send(file);
  });

  // 3) Public URL for displaying the file.
  return `${publicBase.replace(/\/+$/, "")}/${key}`;
}
