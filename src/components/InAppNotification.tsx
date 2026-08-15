import { useEffect, useRef, useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { X } from "lucide-react";
import crushLogo from "@/assets/crush-logo.png.asset.json";
import { useAuth } from "@/lib/auth";

/**
 * iOS-style in-app notification banner with an emotional call to action.
 *
 * Slides in from the top, looks like a real push notification (app icon,
 * bold title, one-line body, relative timestamp) and is fully tappable.
 */

type Nudge = {
  id: string;
  title: string;
  body: string;
  to: string;
  /** only show to signed-out visitors */
  guestOnly?: boolean;
};

const NUDGES: Nudge[] = [
  {
    id: "better-social-life",
    title: "You deserve a better social life",
    body: "Tap to claim your free trial 😏",
    to: "/upgrade",
  },
  {
    id: "someone-waiting",
    title: "Someone is waiting to hear from you",
    body: "She replied. Tap to read it 💬",
    to: "/chats",
  },
  {
    id: "lonely-night",
    title: "Don't spend tonight scrolling alone",
    body: "Real creators are online right now 🔥",
    to: "/discover",
  },
  {
    id: "first-message-free",
    title: "Your first message is free",
    body: "Say hi — she answers in seconds 😌",
    to: "/discover",
    guestOnly: true,
  },
  {
    id: "room-live",
    title: "A room just went live",
    body: "Jump in before it fills up 🎉",
    to: "/rooms",
  },
  {
    id: "unlock-friends",
    title: "She added you to her list",
    body: "Unlock with Crush Gold to keep talking 💎",
    to: "/upgrade",
  },
];

const SEEN_KEY = "crush:inapp:seen";
const LAST_KEY = "crush:inapp:last";
const FIRST_DELAY = 20_000;
const REPEAT_EVERY = 6 * 60_000;
const MIN_GAP = 4 * 60_000;
const MAX_PER_SESSION = 3;

const read = <T,>(key: string, fallback: T): T => {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
};

const write = (key: string, value: unknown) => {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    /* noop */
  }
};

export function InAppNotification() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [active, setActive] = useState<Nudge | null>(null);
  const [show, setShow] = useState(false);
  const shown = useRef(0);
  const hideTimer = useRef<number | undefined>(undefined);

  const dismiss = () => {
    setShow(false);
    window.setTimeout(() => setActive(null), 350);
  };

  useEffect(() => {
    if (typeof window === "undefined") return;

    const pick = () => {
      if (shown.current >= MAX_PER_SESSION) return;
      if (document.hidden) return;
      const last = Number(read<number>(LAST_KEY, 0));
      if (Date.now() - last < MIN_GAP) return;

      const seen = read<string[]>(SEEN_KEY, []);
      const pool = NUDGES.filter((n) => (user ? !n.guestOnly : true));
      const unseen = pool.filter((n) => !seen.includes(n.id));
      const candidates = unseen.length ? unseen : pool;
      const next = candidates[Math.floor(Math.random() * candidates.length)];
      if (!next) return;

      write(SEEN_KEY, [...seen, next.id].slice(-NUDGES.length));
      write(LAST_KEY, Date.now());
      shown.current += 1;
      setActive(next);
      requestAnimationFrame(() => setShow(true));

      window.clearTimeout(hideTimer.current);
      hideTimer.current = window.setTimeout(dismiss, 9000);
    };

    const first = window.setTimeout(pick, FIRST_DELAY);
    const interval = window.setInterval(pick, REPEAT_EVERY);
    return () => {
      window.clearTimeout(first);
      window.clearInterval(interval);
      window.clearTimeout(hideTimer.current);
    };
  }, [user?.id]);

  if (!active) return null;

  return (
    <div
      className="pointer-events-none fixed inset-x-0 top-0 z-[120] flex justify-center px-3 pt-[max(0.75rem,env(safe-area-inset-top))]"
      aria-live="polite"
    >
      <div
        role="button"
        tabIndex={0}
        onClick={() => {
          dismiss();
          navigate({ to: active.to });
        }}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            dismiss();
            navigate({ to: active.to });
          }
        }}
        className={`pointer-events-auto flex w-full max-w-md items-center gap-3 rounded-3xl border border-border/60 bg-background/70 p-3 shadow-2xl backdrop-blur-2xl transition-all duration-300 ease-out ${
          show ? "translate-y-0 opacity-100" : "-translate-y-6 opacity-0"
        }`}
      >
        <img
          src={crushLogo.url}
          alt="Crush"
          className="h-11 w-11 shrink-0 rounded-2xl object-cover"
        />
        <div className="min-w-0 flex-1">
          <div className="flex items-baseline gap-2">
            <p className="truncate text-[15px] font-bold leading-tight text-foreground">
              {active.title}
            </p>
            <span className="ml-auto shrink-0 text-[11px] text-muted-foreground">now</span>
          </div>
          <p className="truncate text-[14px] leading-tight text-muted-foreground">
            {active.body}
          </p>
        </div>
        <button
          type="button"
          aria-label="Dismiss notification"
          onClick={(e) => {
            e.stopPropagation();
            dismiss();
          }}
          className="shrink-0 rounded-full p-1.5 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
