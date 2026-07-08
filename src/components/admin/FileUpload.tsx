import { useRef, useState } from "react";
import { Upload, X, Loader2, ImageIcon, Film } from "lucide-react";
import { toast } from "sonner";
import { uploadToR2 } from "@/lib/upload";

type Kind = "image" | "video";

type CommonProps = {
  /** R2 folder to store in, e.g. "properties" | "banners" | "team" | "videos". */
  folder: string;
  /** What kind of media — controls preview + default accept. */
  kind?: Kind;
  /** Override the accept attribute (defaults from `kind`). */
  accept?: string;
};

type SingleProps = CommonProps & {
  multiple?: false;
  value: string;
  onChange: (url: string) => void;
};

type MultiProps = CommonProps & {
  multiple: true;
  value: string[];
  onChange: (urls: string[]) => void;
};

type Props = SingleProps | MultiProps;

function Preview({ url, kind }: { url: string; kind: Kind }) {
  if (kind === "video") {
    return <video src={url} className="h-full w-full object-cover" muted playsInline />;
  }
  return <img src={url} alt="" className="h-full w-full object-cover" />;
}

export function FileUpload(props: Props) {
  const { folder, kind = "image", accept } = props;
  const acceptAttr = accept ?? (kind === "video" ? "video/*" : "image/*");
  const inputRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [progress, setProgress] = useState(0);

  const uploadOne = async (file: File) => {
    setBusy(true);
    setProgress(0);
    try {
      return await uploadToR2(file, folder, setProgress);
    } finally {
      setBusy(false);
      setProgress(0);
    }
  };

  const onPick = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []);
    if (e.target) e.target.value = ""; // allow re-picking the same file later
    if (files.length === 0) return;

    try {
      if (props.multiple) {
        const urls: string[] = [];
        for (const f of files) urls.push(await uploadOne(f));
        props.onChange([...props.value, ...urls]);
        toast.success(`${urls.length} file${urls.length > 1 ? "s" : ""} uploaded`);
      } else {
        const url = await uploadOne(files[0]);
        props.onChange(url);
        toast.success("File uploaded");
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Upload failed");
    }
  };

  const Dropzone = (
    <button
      type="button"
      onClick={() => inputRef.current?.click()}
      disabled={busy}
      className="flex w-full flex-col items-center justify-center gap-1.5 rounded-lg border border-dashed border-border bg-background px-4 py-5 text-xs font-600 text-muted-foreground transition hover:border-gold hover:text-foreground disabled:opacity-60"
    >
      {busy ? (
        <>
          <Loader2 className="h-5 w-5 animate-spin text-gold" />
          Uploading… {progress}%
        </>
      ) : (
        <>
          {kind === "video" ? <Film className="h-5 w-5" /> : <Upload className="h-5 w-5" />}
          Choose {kind === "video" ? "a video" : props.multiple ? "images" : "an image"} from device
        </>
      )}
    </button>
  );

  return (
    <div>
      <input ref={inputRef} type="file" accept={acceptAttr} multiple={!!props.multiple} onChange={onPick} className="hidden" />

      {!props.multiple ? (
        // ---- Single file ----
        props.value ? (
          <div className="flex items-center gap-3">
            <div className="relative h-20 w-28 shrink-0 overflow-hidden rounded-lg border border-border bg-secondary">
              <Preview url={props.value} kind={kind} />
            </div>
            <div className="flex flex-col gap-1.5">
              <button type="button" onClick={() => inputRef.current?.click()} disabled={busy} className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-card px-3 py-1.5 text-xs font-600 text-foreground disabled:opacity-60">
                {busy ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Upload className="h-3.5 w-3.5" />}
                {busy ? `Uploading ${progress}%` : "Replace"}
              </button>
              <button type="button" onClick={() => props.onChange("")} className="inline-flex items-center gap-1.5 text-xs font-600 text-destructive">
                <X className="h-3.5 w-3.5" /> Remove
              </button>
            </div>
          </div>
        ) : (
          Dropzone
        )
      ) : (
        // ---- Multiple files (gallery) ----
        <div className="space-y-2.5">
          {props.value.length > 0 && (
            <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
              {props.value.map((url, i) => (
                <div key={url + i} className="group relative aspect-square overflow-hidden rounded-lg border border-border bg-secondary">
                  <Preview url={url} kind={kind} />
                  <button
                    type="button"
                    onClick={() => props.onChange(props.value.filter((_, idx) => idx !== i))}
                    className="absolute right-1 top-1 flex h-6 w-6 items-center justify-center rounded-full bg-black/60 text-white opacity-0 transition group-hover:opacity-100"
                    aria-label="Remove image"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                  <span className="absolute bottom-1 left-1 rounded bg-black/60 px-1.5 text-[10px] font-600 text-white">{i + 1}</span>
                </div>
              ))}
            </div>
          )}
          {Dropzone}
          <p className="flex items-center gap-1 text-[10px] text-muted-foreground">
            <ImageIcon className="h-3 w-3" /> Order shown = display order. Remove and re-add to reorder.
          </p>
        </div>
      )}
    </div>
  );
}
