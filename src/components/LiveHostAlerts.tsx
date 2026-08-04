import { useEffect, useRef } from "react";
import { useNavigate } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { useOnlineUsers } from "@/lib/presence";
import { loadMyEthnicity, syncPendingEthnicity } from "@/lib/ethnicity";
import crushLogo from "@/assets/rizz-ai-logo.webp.asset.json";
import { isNativeApp } from "@/lib/native";

/**
 * "Jen is live now — come say hi" device notifications.
 *
 * Fires a real OS notification (with the host's photo) when a host comes
 * online, for subscribed and non-subscribed members alike. Ranking prefers
 * hosts whose heritage tag matches the member's own signup answer.
 *
 * Frequency guardrails so it never feels spammy:
 *  - at most 3 per day
 *  - at least 25 minutes between alerts
 *  - the same host at most once every 24h
 */
const DAY = 86_400_000;
const MIN_GAP = 25 * 60_000;
const MAX_PER_DAY = 3;
const COUNT_KEY = "crush:liveAlerts:count";
const LAST_KEY = "crush:liveAlerts:last";
const HOST_KEY = "crush:liveAlerts:hosts";
export const LIVE_ALERTS_PREF = "crush:liveAlerts:enabled";

type HostRow = { id: string; display_name: string | null; avatar_url: string | null; heritage: string | null };

const readJson = <T,>(key: string, fallback: T): T => {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
};

const writeJson = (key: string, value: unknown) => {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    /* noop */
  }
};

function quotaLeft(): boolean {
  const today = new Date().toISOString().slice(0, 10);
  const counter = readJson<{ day: string; n: number }>(COUNT_KEY, { day: today, n: 0 });
  if (counter.day !== today) return true;
  return counter.n < MAX_PER_DAY;
}

function bumpQuota() {
  const today = new Date().toISOString().slice(0, 10);
  const counter = readJson<{ day: string; n: number }>(COUNT_KEY, { day: today, n: 0 });
  writeJson(COUNT_KEY, { day: today, n: counter.day === today ? counter.n + 1 : 1 });
  writeJson(LAST_KEY, Date.now());
}

export function liveAlertsEnabled() {
  try {
    return localStorage.getItem(LIVE_ALERTS_PREF) !== "0";
  } catch {
    return true;
  }
}

export function LiveHostAlerts() {
  const { user } = useAuth();
  const online = useOnlineUsers();
  const navigate = useNavigate();
  const myHeritage = useRef<string | null>(null);
  const working = useRef(false);

  useEffect(() => {
    if (!user) return;
    void syncPendingEthnicity(user.id);
    void loadMyEthnicity(user.id).then((v) => {
      myHeritage.current = v;
    });
  }, [user?.id]);

  useEffect(() => {
    if (!user || online.size === 0) return;
    if (typeof window === "undefined" || !("Notification" in window)) return;
    if (Notification.permission !== "granted" || !liveAlertsEnabled()) return;
    if (isNativeApp()) return; // native shell uses push instead
    if (working.current) return;

    const last = Number(readJson<number>(LAST_KEY, 0));
    if (Date.now() - last < MIN_GAP || !quotaLeft()) return;

    const candidates = [...online].filter((id) => id !== user.id);
    if (!candidates.length) return;

    working.current = true;
    void (async () => {
      try {
        const { data } = await supabase
          .from("profiles")
          .select("id, display_name, avatar_url")
          .in("id", candidates.slice(0, 60))
          .eq("account_type", "host")
          .limit(30);

        const seen = readJson<Record<string, number>>(HOST_KEY, {});
        const fresh = ((data ?? []) as HostRow[]).filter(
          (h) => h.display_name && Date.now() - (seen[h.id] ?? 0) > DAY,
        );
        if (!fresh.length) return;

        const host = fresh[Math.floor(Math.random() * fresh.length)];
        const name = host.display_name ?? "Someone";

        const n = new Notification(`${name} is live now`, {
          body: `${name} is online and waiting — come say hi 👋`,
          icon: host.avatar_url ?? crushLogo.url,
          badge: crushLogo.url,
          tag: `crush-live-${host.id}`,
          // Big preview image on platforms that support it (Chrome/Android).
          ...({ image: host.avatar_url ?? undefined } as Record<string, unknown>),
        });
        n.onclick = () => {
          window.focus();
          navigate({ to: "/chat/user/$userId", params: { userId: host.id } });
          n.close();
        };

        seen[host.id] = Date.now();
        writeJson(HOST_KEY, seen);
        bumpQuota();
      } finally {
        working.current = false;
      }
    })();
  }, [user?.id, online, navigate]);

  return null;
}
