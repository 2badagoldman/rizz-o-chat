import { useCallback, useEffect, useState } from "react";

/**
 * Debug-only overlay that finds elements wider than the viewport (the usual
 * cause of horizontal scrolling on phones) and outlines them.
 *
 * Enable with `?overflow=1` on any URL, or press Ctrl/Cmd + Shift + O.
 * The choice is remembered in localStorage under `crush.debug.overflow`.
 */

const STORAGE_KEY = "crush.debug.overflow";
const MARK = "data-overflow-flagged";

export type OverflowHit = {
  label: string;
  right: number;
  width: number;
};

/** True when some ancestor clips this element horizontally (carousel, marquee, hero glow, etc.). */
function isClipped(el: HTMLElement, doc: Document): boolean {
  let p = el.parentElement;
  while (p && p !== doc.documentElement) {
    const s = doc.defaultView?.getComputedStyle(p);
    if (s && s.overflowX !== "visible") return true;
    p = p.parentElement;
  }
  return false;
}

export function scanOverflow(doc: Document = document): OverflowHit[] {
  const limit = doc.documentElement.clientWidth;
  const hits: OverflowHit[] = [];
  const nodes = doc.body?.querySelectorAll<HTMLElement>("*") ?? [];
  nodes.forEach((el) => {
    el.removeAttribute(MARK);
    const style = doc.defaultView?.getComputedStyle(el);
    if (!style || style.position === "fixed" || style.display === "none" || style.visibility === "hidden") return;
    // Decorative layers can't create scroll and aren't interactive — skip them.
    if (style.pointerEvents === "none" || el.getAttribute("aria-hidden") === "true") return;
    const r = el.getBoundingClientRect();
    if (r.width === 0 || r.height === 0) return;
    if (r.right <= limit + 1 && r.left >= -1) return;
    if (isClipped(el, doc)) return;
    // Ignore children of an already-flagged ancestor to keep the list readable.
    if (el.parentElement?.closest(`[${MARK}]`)) return;
    el.setAttribute(MARK, "true");
    const id = el.id ? `#${el.id}` : "";
    const cls = typeof el.className === "string" && el.className ? `.${el.className.trim().split(/\s+/).slice(0, 3).join(".")}` : "";
    hits.push({
      label: `${el.tagName.toLowerCase()}${id}${cls}`,
      right: Math.round(r.right),
      width: Math.round(r.width),
    });
  });
  return hits;
}

export function clearOverflowMarks(doc: Document = document) {
  doc.querySelectorAll(`[${MARK}]`).forEach((el) => el.removeAttribute(MARK));
}

export function OverflowInspector() {
  const [enabled, setEnabled] = useState(false);
  const [hits, setHits] = useState<OverflowHit[]>([]);
  const [open, setOpen] = useState(true);
  const [viewport, setViewport] = useState(0);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const fromUrl = params.get("overflow");
    if (fromUrl === "1") {
      localStorage.setItem(STORAGE_KEY, "1");
      setEnabled(true);
    } else if (fromUrl === "0") {
      localStorage.removeItem(STORAGE_KEY);
    } else {
      setEnabled(localStorage.getItem(STORAGE_KEY) === "1");
    }
  }, []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.shiftKey && e.key.toLowerCase() === "o") {
        e.preventDefault();
        setEnabled((v) => {
          const next = !v;
          if (next) localStorage.setItem(STORAGE_KEY, "1");
          else localStorage.removeItem(STORAGE_KEY);
          return next;
        });
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const run = useCallback(() => {
    setViewport(document.documentElement.clientWidth);
    setHits(scanOverflow());
  }, []);

  useEffect(() => {
    if (!enabled) {
      clearOverflowMarks();
      setHits([]);
      return;
    }
    run();
    const t = window.setInterval(run, 1200);
    window.addEventListener("resize", run);
    return () => {
      window.clearInterval(t);
      window.removeEventListener("resize", run);
      clearOverflowMarks();
    };
  }, [enabled, run]);

  if (!enabled) return null;

  const docWidth = typeof document !== "undefined" ? document.documentElement.scrollWidth : 0;
  const scrolls = docWidth > viewport + 1;

  return (
    <>
      <style>{`[${MARK}]{outline:2px dashed #ff2d55 !important;outline-offset:-2px;background-image:linear-gradient(45deg,rgba(255,45,85,.16) 25%,transparent 25%,transparent 50%,rgba(255,45,85,.16) 50%,rgba(255,45,85,.16) 75%,transparent 75%) !important;background-size:12px 12px !important;}`}</style>
      <div
        className="fixed bottom-20 left-2 z-[9999] max-w-[min(92vw,360px)] rounded-xl border border-border bg-background/95 p-3 text-xs shadow-2xl backdrop-blur"
        role="status"
      >
        <div className="flex items-center justify-between gap-2">
          <button type="button" className="font-semibold" onClick={() => setOpen((v) => !v)}>
            Overflow QA · {hits.length} {hits.length === 1 ? "hit" : "hits"}
          </button>
          <div className="flex items-center gap-2">
            <button type="button" className="underline" onClick={run}>
              rescan
            </button>
            <button
              type="button"
              className="underline"
              onClick={() => {
                localStorage.removeItem(STORAGE_KEY);
                setEnabled(false);
              }}
            >
              off
            </button>
          </div>
        </div>
        {open && (
          <div className="mt-2 space-y-1">
            <p className="text-muted-foreground">
              viewport {viewport}px · document {docWidth}px {scrolls ? "· scrolls horizontally" : "· no h-scroll"}
            </p>
            {hits.length === 0 ? (
              <p className="text-muted-foreground">No elements exceed the viewport on this screen.</p>
            ) : (
              <ul className="max-h-48 space-y-1 overflow-auto">
                {hits.slice(0, 30).map((h, i) => (
                  <li key={`${h.label}-${i}`} className="font-mono leading-tight">
                    <span className="text-primary">{h.right - viewport}px over</span> · {h.label} ({h.width}px)
                  </li>
                ))}
              </ul>
            )}
            <p className="text-[10px] text-muted-foreground">Toggle with Ctrl/Cmd + Shift + O · full sweep at /qa/overflow</p>
          </div>
        )}
      </div>
    </>
  );
}

export default OverflowInspector;
