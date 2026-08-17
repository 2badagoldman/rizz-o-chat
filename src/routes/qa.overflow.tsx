import { createFileRoute } from "@tanstack/react-router";
import { useCallback, useRef, useState } from "react";
import { scanOverflow, type OverflowHit } from "@/components/OverflowInspector";

export const Route = createFileRoute("/qa/overflow")({
  head: () => ({
    meta: [
      { title: "Overflow QA — Crush internal layout checker" },
      { name: "description", content: "Internal QA sweep that loads every key Crush screen at phone and tablet widths and reports horizontal overflow." },
      { name: "robots", content: "noindex, nofollow" },
      { property: "og:title", content: "Overflow QA — Crush internal layout checker" },
      { property: "og:description", content: "Internal QA sweep for horizontal overflow across Crush screens." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: OverflowQaPage,
});

const ROUTES = [
  "/",
  "/discover",
  "/swipe",
  "/chats",
  "/profile",
  "/upgrade",
  "/coins",
  "/rooms",
  "/voice-notes",
  "/legal",
  "/auth",
];

const WIDTHS = [320, 375, 430, 768, 1024];

type Result = {
  route: string;
  width: number;
  scrollWidth: number;
  hits: OverflowHit[];
  error?: string;
};

function OverflowQaPage() {
  const frameRef = useRef<HTMLIFrameElement | null>(null);
  const [results, setResults] = useState<Result[]>([]);
  const [running, setRunning] = useState(false);
  const [current, setCurrent] = useState<string>("");

  const check = useCallback((route: string, width: number) => {
    return new Promise<Result>((resolve) => {
      const frame = frameRef.current;
      if (!frame) return resolve({ route, width, scrollWidth: 0, hits: [], error: "no frame" });
      frame.style.width = `${width}px`;
      const done = () => {
        frame.removeEventListener("load", done);
        window.setTimeout(() => {
          try {
            const doc = frame.contentDocument!;
            resolve({
              route,
              width,
              scrollWidth: doc.documentElement.scrollWidth,
              hits: scanOverflow(doc),
            });
          } catch (e) {
            resolve({ route, width, scrollWidth: 0, hits: [], error: String(e) });
          }
        }, 900);
      };
      frame.addEventListener("load", done);
      frame.src = `${route}${route.includes("?") ? "&" : "?"}overflow=0`;
    });
  }, []);

  const runSweep = useCallback(async () => {
    setRunning(true);
    setResults([]);
    for (const route of ROUTES) {
      for (const width of WIDTHS) {
        setCurrent(`${route} @ ${width}px`);
        // eslint-disable-next-line no-await-in-loop
        const res = await check(route, width);
        setResults((prev) => [...prev, res]);
      }
    }
    setCurrent("");
    setRunning(false);
  }, [check]);

  const failing = results.filter((r) => r.hits.length > 0 || r.scrollWidth > r.width + 1);

  return (
    <div className="mx-auto w-full max-w-5xl px-4 py-8">
      <h1 className="text-2xl font-semibold">Overflow QA</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        Loads each key screen at phone/tablet widths and flags anything wider than the viewport. Press Ctrl/Cmd + Shift + O on any
        page to toggle the live overlay instead.
      </p>

      <div className="mt-4 flex flex-wrap items-center gap-3">
        <button
          type="button"
          onClick={runSweep}
          disabled={running}
          className="rounded-full bg-primary px-5 py-2 text-sm font-semibold text-primary-foreground disabled:opacity-60"
        >
          {running ? "Scanning…" : "Run sweep"}
        </button>
        {current && <span className="text-xs text-muted-foreground">{current}</span>}
        {!running && results.length > 0 && (
          <span className="text-sm">
            {failing.length === 0 ? "All clean ✅" : `${failing.length} of ${results.length} checks overflow`}
          </span>
        )}
      </div>

      <div className="mt-6 space-y-2">
        {results.map((r) => {
          const bad = r.hits.length > 0 || r.scrollWidth > r.width + 1;
          return (
            <div
              key={`${r.route}-${r.width}`}
              className={`rounded-lg border p-3 text-sm ${bad ? "border-destructive/60 bg-destructive/5" : "border-border"}`}
            >
              <div className="flex items-center justify-between gap-3">
                <span className="font-medium">
                  {r.route} <span className="text-muted-foreground">@ {r.width}px</span>
                </span>
                <span className={bad ? "text-destructive" : "text-muted-foreground"}>
                  {r.error ? r.error : bad ? `doc ${r.scrollWidth}px · ${r.hits.length} elements` : "clean"}
                </span>
              </div>
              {r.hits.length > 0 && (
                <ul className="mt-2 space-y-1 font-mono text-xs text-muted-foreground">
                  {r.hits.slice(0, 8).map((h, i) => (
                    <li key={i}>
                      +{h.right - r.width}px · {h.label} ({h.width}px)
                    </li>
                  ))}
                </ul>
              )}
            </div>
          );
        })}
      </div>

      <iframe
        ref={frameRef}
        title="overflow probe"
        className="mt-8 h-[720px] rounded-xl border border-border"
        style={{ width: 375 }}
      />
    </div>
  );
}
