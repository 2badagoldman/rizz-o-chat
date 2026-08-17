import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Link, useNavigate } from "@tanstack/react-router";
import { Heart, X, RotateCcw, Circle, MessageCircle } from "lucide-react";
import { DEMO_HOSTS, tierLabel, isFreeHost, type DemoHost } from "@/lib/demo-hosts";
import { hostAvatarMed } from "@/lib/host-avatars";

import { LIKES_KEY, PASS_KEY, readIds, writeIds } from "@/lib/swipe-likes";

function shuffle<T>(arr: readonly T[], seed: number): T[] {
  const a = arr.slice();
  let s = seed || 1;
  for (let i = a.length - 1; i > 0; i--) {
    s = (s * 1664525 + 1013904223) % 4294967296;
    const j = s % (i + 1);
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export type SwipeDeckProps = {
  /** Full page mode shows a taller card and richer detail. */
  full?: boolean;
  /** Optional pre-filtered pool (defaults to all demo creators). */
  pool?: DemoHost[];
};

export function SwipeDeck({ full = false, pool }: SwipeDeckProps) {
  const navigate = useNavigate();
  // Seed stays deterministic for SSR + hydration, then randomises on the client.
  const [seed, setSeed] = useState(1);
  useEffect(() => {
    setSeed(Math.floor(Math.random() * 1e9) + 1);
  }, []);

  const [index, setIndex] = useState(0);
  const [likes, setLikes] = useState<string[]>([]);
  const [dx, setDx] = useState(0);
  const [flying, setFlying] = useState<"left" | "right" | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const dragging = useRef(false);
  const startX = useRef(0);

  const deck = useMemo(() => shuffle(pool ?? DEMO_HOSTS, seed), [pool, seed]);

  useEffect(() => {
    setLikes(readIds(LIKES_KEY));
  }, []);

  const current = deck[index % deck.length];
  const next = deck[(index + 1) % deck.length];

  const commit = useCallback(
    (dir: "left" | "right") => {
      if (flying || !current) return;
      setFlying(dir);
      const key = dir === "right" ? LIKES_KEY : PASS_KEY;
      const stored = readIds(key);
      if (!stored.includes(current.id)) {
        const updated = [...stored, current.id];
        writeIds(key, updated);
        if (dir === "right") setLikes(updated);
      } else if (dir === "right") {
        setLikes(stored);
      }
      if (dir === "right") {
        setToast(`${current.name} saved to Prospects you like`);
        window.setTimeout(() => setToast(null), 1800);
      }
      window.setTimeout(() => {
        setFlying(null);
        setDx(0);
        setIndex((i) => i + 1);
      }, 300);
    },
    [current, flying],
  );


  const onPointerDown = (e: React.PointerEvent) => {
    if (flying) return;
    dragging.current = true;
    startX.current = e.clientX;
    (e.target as HTMLElement).setPointerCapture?.(e.pointerId);
  };
  const onPointerMove = (e: React.PointerEvent) => {
    if (!dragging.current) return;
    setDx(e.clientX - startX.current);
  };
  const onPointerUp = () => {
    if (!dragging.current) return;
    dragging.current = false;
    if (dx > 90) commit("right");
    else if (dx < -90) commit("left");
    else setDx(0);
  };

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight") commit("right");
      if (e.key === "ArrowLeft") commit("left");
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [commit]);

  if (!current) return null;

  const offset = flying ? (flying === "right" ? 720 : -720) : dx;
  const rotate = offset / 22;
  const likeOpacity = Math.min(1, Math.max(0, offset / 90));
  const nopeOpacity = Math.min(1, Math.max(0, -offset / 90));

  return (
    <div className="select-none">
      <div className={`relative w-full ${full ? "aspect-[3/4] max-h-[76vh]" : "aspect-[3/4] max-h-[62vh]"}`}>
        {/* card underneath so the deck reads as a stack */}
        <article
          key={`under-${next.id}`}
          className="absolute inset-0 scale-[0.95] overflow-hidden rounded-[2rem] border border-border bg-card opacity-70"
          aria-hidden
        >
          <img
            src={hostAvatarMed(next.id)}
            alt=""
            loading="lazy"
            decoding="async"
            className="h-full w-full object-cover"
          />
        </article>

        <article
          key={current.id}
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
          onPointerCancel={onPointerUp}
          style={{
            transform: `translateX(${offset}px) rotate(${rotate}deg)`,
            transition: dragging.current ? "none" : "transform 280ms cubic-bezier(.22,.61,.36,1), opacity 280ms ease-out",
            opacity: flying ? 0 : 1,
            touchAction: "pan-y",
          }}
          className="absolute inset-0 cursor-grab overflow-hidden rounded-[2rem] border border-border bg-card shadow-xl active:cursor-grabbing"
        >

          <img
            src={hostAvatarMed(current.id)}
            alt={`${current.name}, ${current.age} — ${current.city}`}
            draggable={false}
            className="h-full w-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/10 to-transparent" />

          <div className="absolute inset-x-3 top-3 flex items-center justify-between">
            <span className="rounded-full bg-black/45 px-2.5 py-1 text-[10px] font-semibold text-white backdrop-blur">
              {tierLabel(current.tier)}
            </span>
            {current.online ? (
              <span className="flex items-center gap-1 rounded-full bg-black/45 px-2.5 py-1 text-[10px] font-semibold text-white backdrop-blur">
                <Circle className="h-2 w-2 fill-success text-success" /> Online
              </span>
            ) : null}
          </div>

          <span
            style={{ opacity: likeOpacity }}
            className="pointer-events-none absolute left-4 top-14 rotate-[-12deg] rounded-xl border-2 border-success px-3 py-1 text-lg font-black uppercase tracking-widest text-success"
          >
            Like
          </span>
          <span
            style={{ opacity: nopeOpacity }}
            className="pointer-events-none absolute right-4 top-14 rotate-[12deg] rounded-xl border-2 border-destructive px-3 py-1 text-lg font-black uppercase tracking-widest text-destructive"
          >
            Nope
          </span>

          <div className="absolute inset-x-4 bottom-4 text-white">
            <p className="text-xl font-bold leading-tight">
              {current.name}, {current.age}
            </p>
            <p className="text-xs opacity-90">
              {current.city}
              {isFreeHost(current.id) ? " · Free to chat" : ""}
            </p>
            {full ? (
              <p className="mt-1 line-clamp-2 text-[11px] opacity-85">{current.teaser ?? current.bio}</p>
            ) : null}
            <Link
              to="/host/$hostId"
              params={{ hostId: current.id }}
              onPointerDown={(e) => e.stopPropagation()}
              className="mt-2 inline-flex items-center gap-1 rounded-full bg-white/15 px-3 py-1 text-[11px] font-semibold backdrop-blur transition hover:bg-white/25"
            >
              View profile
            </Link>
          </div>
        </article>
      </div>

      <div className="mt-4 flex items-center justify-center gap-4">
        <button
          type="button"
          onClick={() => commit("left")}
          aria-label="Pass on this creator"
          className="grid h-14 w-14 place-items-center rounded-full border border-border bg-card text-destructive shadow-md transition active:scale-90"
        >
          <X className="h-6 w-6" />
        </button>
        <button
          type="button"
          onClick={() => setIndex((i) => (i > 0 ? i - 1 : i))}
          aria-label="Go back one creator"
          className="grid h-11 w-11 place-items-center rounded-full border border-border bg-card text-muted-foreground transition active:scale-90"
        >
          <RotateCcw className="h-4 w-4" />
        </button>
        <button
          type="button"
          onClick={() => navigate({ to: "/chat/$hostId", params: { hostId: current.id } })}
          aria-label={`Chat with ${current.name}`}
          className="grid h-11 w-11 place-items-center rounded-full border border-border bg-card text-primary transition active:scale-90"
        >
          <MessageCircle className="h-4 w-4" />
        </button>
        <button
          type="button"
          onClick={() => commit("right")}
          aria-label="Like this creator"
          className="grid h-14 w-14 place-items-center rounded-full bg-gradient-brand text-white shadow-glow transition active:scale-90"
        >
          <Heart className="h-6 w-6" />
        </button>
      </div>

      <p className="mt-3 text-center text-[11px] text-muted-foreground">
        Swipe right to like, left to pass ·{" "}
        <Link to="/chats" className="font-semibold text-primary underline-offset-2 hover:underline">
          {likes.length} in Prospects you like
        </Link>
      </p>

      {toast ? (
        <div className="pointer-events-none fixed inset-x-0 bottom-24 z-50 flex justify-center px-4">
          <span className="rounded-full bg-gradient-brand px-4 py-2 text-xs font-semibold text-white shadow-glow">
            {toast}
          </span>
        </div>
      ) : null}
    </div>
  );
}
