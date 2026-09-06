import { useRef, useState } from "react";
import { uploadImages } from "@/lib/store";

/**
 * File picker that uploads images to the product-images bucket and returns URLs.
 * Manual URL inputs remain available elsewhere as an alternative.
 */
export function ImageUploader({
  urls,
  onChange,
  folder = "uploads",
  multiple = true,
  label = "Wybierz zdjęcia z urządzenia / galerii",
}: {
  urls: string[];
  onChange: (urls: string[]) => void;
  folder?: string;
  multiple?: boolean;
  label?: string;
}) {
  const ref = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");

  return (
    <div className="rounded-xl border border-dashed border-border bg-secondary/40 p-3">
      <input
        ref={ref}
        type="file"
        accept="image/*"
        multiple={multiple}
        className="hidden"
        onChange={async (e) => {
          const files = Array.from(e.target.files ?? []);
          if (!files.length) return;
          setBusy(true);
          setErr("");
          try {
            const added = await uploadImages(files, folder);
            onChange(multiple ? [...urls, ...added] : added.slice(0, 1));
          } catch {
            setErr("Nie udało się przesłać plików.");
          } finally {
            setBusy(false);
            if (ref.current) ref.current.value = "";
          }
        }}
      />
      <button
        type="button"
        disabled={busy}
        onClick={() => ref.current?.click()}
        className="rounded-lg border border-primary/60 px-3 py-2 text-xs font-bold uppercase tracking-wide text-primary disabled:opacity-50"
      >
        {busy ? "Przesyłanie..." : label}
      </button>
      {err ? <p className="mt-2 text-xs text-destructive">{err}</p> : null}
      {urls.length ? (
        <div className="mt-3 flex flex-wrap gap-2">
          {urls.map((u, i) => (
            <div key={`${u}-${i}`} className="relative h-16 w-16 overflow-hidden rounded-lg border border-border">
              <img src={u} alt="" className="h-full w-full object-cover" />
              <button
                type="button"
                aria-label="Usuń zdjęcie"
                onClick={() => onChange(urls.filter((_, idx) => idx !== i))}
                className="absolute right-0 top-0 flex h-5 w-5 items-center justify-center bg-surface-deep/85 text-[10px] text-destructive"
              >
                ✕
              </button>
            </div>
          ))}
        </div>
      ) : null}
    </div>
  );
}
