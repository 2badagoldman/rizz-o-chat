import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Download, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/export-portraits")({
  head: () => ({
    meta: [
      { title: "Export Portraits — Crush" },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  component: ExportPortraitsPage,
});

// Eagerly bundle every image in src/assets/elite so this page can list and zip them.
const eliteModules = import.meta.glob("/src/assets/elite/*.{jpg,jpeg,png,webp}", {
  eager: true,
  query: "?url",
  import: "default",
}) as Record<string, string>;

interface EliteImage {
  filename: string;
  url: string;
}

function naturalSort(a: string, b: string) {
  return a.localeCompare(b, undefined, { numeric: true, sensitivity: "base" });
}

function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 30_000);
}

function ExportPortraitsPage() {
  const images = useMemo<EliteImage[]>(
    () =>
      Object.entries(eliteModules)
        .map(([path, url]) => ({
          filename: path.split("/").pop() ?? path,
          url,
        }))
        .sort((a, b) => naturalSort(a.filename, b.filename)),
    [],
  );

  const [zipping, setZipping] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const handleDownloadAll = async () => {
    setZipping(true);
    setError(null);
    setProgress(0);
    try {
      const { default: JSZip } = await import("jszip");
      const zip = new JSZip();
      let done = 0;
      await Promise.all(
        images.map(async (img) => {
          const res = await fetch(img.url);
          if (!res.ok) throw new Error(`Failed to fetch ${img.filename}`);
          const blob = await res.blob();
          zip.file(img.filename, blob);
          done += 1;
          setProgress(done);
        }),
      );
      const blob = await zip.generateAsync({ type: "blob", compression: "STORE" });
      downloadBlob(blob, "elite-portraits.zip");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Download failed");
    } finally {
      setZipping(false);
    }
  };

  return (
    <div className="min-h-screen bg-background px-4 py-8">
      <div className="mx-auto max-w-6xl">
        <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Export Portraits</h1>
            <p className="text-sm text-muted-foreground">
              {images.length} images from src/assets/elite
            </p>
          </div>
          <Button onClick={handleDownloadAll} disabled={zipping || images.length === 0}>
            {zipping ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Zipping {progress}/{images.length}…
              </>
            ) : (
              <>
                <Download className="mr-2 h-4 w-4" />
                Download all ({images.length})
              </>
            )}
          </Button>
        </div>

        {error && (
          <p className="mb-4 rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive">
            {error}
          </p>
        )}

        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
          {images.map((img) => (
            <figure
              key={img.filename}
              className="overflow-hidden rounded-lg border border-border bg-card"
            >
              <img
                src={img.url}
                alt={img.filename}
                loading="lazy"
                className="aspect-[3/4] w-full object-cover"
              />
              <figcaption className="truncate px-2 py-1.5 text-center text-xs text-muted-foreground">
                {img.filename}
              </figcaption>
            </figure>
          ))}
        </div>
      </div>
    </div>
  );
}
