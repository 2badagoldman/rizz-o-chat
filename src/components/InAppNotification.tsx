import { useEffect, useRef, useState } from "react";
import { Bell, X } from "lucide-react";
import crushLogo from "@/assets/crush-logo.png.asset.json";
import { useAuth } from "@/lib/auth";

/**
 * Device-level (OS) notification — the same kind YouTube pops on a desktop or
 * a phone home screen. Fires at most once per day, plays a soft "love" chime,
 * and deep-links back into the app when tapped.
 *
 * The only in-app UI is a one-time, dismissible opt-in card asking for
 * notification permission (browsers require a user gesture to prompt).
 */

type Nudge = {
  id: string;
  title: string;
  body: string;
  to: string;
  guestOnly?: boolean;
};

const NUDGES: Nudge[] = [
  {
    id: "better-social-life",
    title: "You deserve a better social life 💘",
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
    title: "She added you to her list 💌",
    body: "Unlock with Crush Gold to keep talking 💎",
    to: "/upgrade",
  },
];

const SEEN_KEY = "crush:notif:seen";
const LAST_KEY = "crush:notif:last-day";
const ASK_KEY = "crush:notif:ask-dismissed";
const FIRST_DELAY = 15_000;
const CHECK_EVERY = 5 * 60_000;

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

const today = () => new Date().toISOString().slice(0, 10);

/** Soft, warm two-note chime (no asset needed). */
function playLoveChime() {
  try {
    const Ctx =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext?: typeof AudioContext })
        .webkitAudioContext;
    if (!Ctx) return;
    const ctx = new Ctx();
    const now = ctx.currentTime;
    const notes = [
      { f: 659.25, t: 0 }, // E5
      { f: 880.0, t: 0.16 }, // A5
    ];
    notes.forEach(({ f, t }) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "sine";
      osc.frequency.value = f;
      gain.gain.setValueAtTime(0.0001, now + t);
      gain.gain.exponentialRampToValueAtTime(0.12, now + t + 0.05);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + t + 0.9);
      osc.connect(gain).connect(ctx.destination);
      osc.start(now + t);
      osc.stop(now + t + 1);
    });
    window.setTimeout(() => ctx.close().catch(() => {}), 1600);
  } catch {
    /* noop */
  }
}

export function InAppNotification() {
  const { user } = useAuth();
  const [askVisible, setAskVisible] = useState(false);
  const fired = useRef(false);

  const supported =
    typeof window !== "undefined" && "Notification" in window;

  // Show the opt-in card only when permission hasn't been decided yet.
  useEffect(() => {
    if (!supported) return;
    if (Notification.permission !== "default") return;
    if (read<boolean>(ASK_KEY, false)) return;
    const t = window.setTimeout(() => setAskVisible(true), 8000);
    return () => window.clearTimeout(t);
  }, [supported]);

  // Daily device notification.
  useEffect(() => {
    if (!supported) return;

    const fire = () => {
      if (fired.current) return;
      if (Notification.permission !== "granted") return;
      if (read<string>(LAST_KEY, "") === today()) return;

      const seen = read<string[]>(SEEN_KEY, []);
      const pool = NUDGES.filter((n) => (user ? !n.guestOnly : true));
      const unseen = pool.filter((n) => !seen.includes(n.id));
      const candidates = unseen.length ? unseen : pool;
      const next = candidates[Math.floor(Math.random() * candidates.length)];
      if (!next) return;

      try {
        const n = new Notification(next.title, {
          body: next.body,
          icon: crushLogo.url,
          badge: crushLogo.url,
          tag: "crush-daily",
          silent: true, // we play our own soft chime
        });
        n.onclick = () => {
          window.focus();
          window.location.href = next.to;
          n.close();
        };
      } catch {
        return;
      }

      playLoveChime();
      fired.current = true;
      write(SEEN_KEY, [...seen, next.id].slice(-NUDGES.length));
      write(LAST_KEY, today());
    };

    const first = window.setTimeout(fire, FIRST_DELAY);
    const interval = window.setInterval(fire, CHECK_EVERY);
    return () => {
      window.clearTimeout(first);
      window.clearInterval(interval);
    };
  }, [supported, user?.id]);

  const enable = async () => {
    setAskVisible(false);
    write(ASK_KEY, true);
    try {
      const result = await Notification.requestPermission();
      if (result === "granted") playLoveChime();
    } catch {
      /* noop */
    }
  };

  if (!askVisible) return null;

  return (
    <div
      className="pointer-events-none fixed inset-x-0 top-0 z-[120] flex justify-center px-3 pt-[max(0.75rem,env(safe-area-inset-top))]"
      aria-live="polite"
    >
      <div className="pointer-events-auto flex w-full max-w-md items-center gap-3 rounded-3xl border border-border/60 bg-background/80 p-3 shadow-2xl backdrop-blur-2xl">
        <img
          src={crushLogo.url}
          alt="Crush"
          className="h-11 w-11 shrink-0 rounded-2xl object-cover"
        />
        <div className="min-w-0 flex-1">
          <p className="truncate text-[15px] font-bold leading-tight text-foreground">
            Get notified when she replies
          </p>
          <p className="truncate text-[13px] leading-tight text-muted-foreground">
            One soft ping a day. Nothing more 💘
          </p>
        </div>
        <button
          type="button"
          onClick={enable}
          className="shrink-0 rounded-full bg-primary px-3 py-1.5 text-[13px] font-semibold text-primary-foreground"
        >
          <span className="flex items-center gap-1">
            <Bell className="h-3.5 w-3.5" /> Allow
          </span>
        </button>
        <button
          type="button"
          aria-label="Dismiss"
          onClick={() => {
            setAskVisible(false);
            write(ASK_KEY, true);
          }}
          className="shrink-0 rounded-full p-1.5 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
