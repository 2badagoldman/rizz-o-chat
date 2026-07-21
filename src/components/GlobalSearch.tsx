import { useEffect, useMemo, useState } from "react";
import { Link } from "@tanstack/react-router";
import { Search, X, Circle } from "lucide-react";
import { DEMO_HOSTS } from "@/lib/demo-hosts";
import { hostAvatarThumb } from "@/lib/host-avatars";

interface GlobalSearchProps {
  open: boolean;
  onClose: () => void;
}

export function GlobalSearch({ open, onClose }: GlobalSearchProps) {
  const [q, setQ] = useState("");

  useEffect(() => {
    if (!open) return;
    setQ("");
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [open, onClose]);

  const results = useMemo(() => {
    const term = q.trim().toLowerCase();
    if (!term) return DEMO_HOSTS.slice(0, 24);
    return DEMO_HOSTS.filter((h) =>
      h.name.toLowerCase().includes(term) ||
      h.handle.toLowerCase().includes(term) ||
      h.city.toLowerCase().includes(term) ||
      h.interests.some((i) => i.toLowerCase().includes(term)),
    ).slice(0, 40);
  }, [q]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[90] bg-black/60 backdrop-blur-sm"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label="Search hosts"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="mx-auto mt-16 flex max-h-[80vh] w-full max-w-[480px] flex-col overflow-hidden rounded-3xl border border-border bg-card shadow-2xl"
      >
        <div className="flex items-center gap-2 border-b border-border px-4 py-3">
          <Search className="h-4 w-4 text-muted-foreground" />
          <input
            autoFocus
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search by name, city, interest…"
            className="w-full bg-transparent text-sm outline-none placeholder:text-muted-foreground"
          />
          <button onClick={onClose} aria-label="Close search" className="rounded-full p-1 hover:bg-muted">
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-2">
          {results.length === 0 ? (
            <p className="p-6 text-center text-sm text-muted-foreground">
              No hosts match &ldquo;{q}&rdquo;.
            </p>
          ) : (
            <ul className="grid gap-1">
              {results.map((h) => (
                <li key={h.id}>
                  <Link
                    to="/host/$hostId"
                    params={{ hostId: h.id }}
                    onClick={onClose}
                    className="flex items-center gap-3 rounded-2xl p-2 transition hover:bg-muted"
                  >
                    <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-full">
                      <img
                        src={hostAvatarThumb(h.id)}
                        alt=""
                        loading="lazy"
                        className="h-full w-full object-cover"
                      />
                      {h.online ? (
                        <span className="absolute bottom-0 right-0 grid h-3.5 w-3.5 place-items-center rounded-full bg-card">
                          <Circle className="h-2 w-2 fill-success text-success" />
                        </span>
                      ) : null}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold">
                        {h.name}, {h.age} <span className="text-muted-foreground">· {h.handle}</span>
                      </p>
                      <p className="truncate text-[11px] text-muted-foreground">{h.city} · {h.interests.slice(0, 3).join(" · ")}</p>
                    </div>
                    <span className="whitespace-nowrap text-[11px] font-bold text-gradient-brand">
                      {h.id === "demo-jen" ? "Free" : `$${h.priceMonthly}/mo`}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
