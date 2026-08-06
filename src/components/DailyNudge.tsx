import { useEffect } from "react";
import { useNavigate } from "@tanstack/react-router";
import { liveAlertsEnabled } from "./LiveHostAlerts";
import crushLogo from "@/assets/rizz-ai-logo.webp.asset.json";

/**
 * One "Come online to chat" device notification per day, with the Crush
 * name + logo — the same style as other social apps' daily nudge.
 */
const KEY = "crush:dailyNudge:day";
const BODY = "Come online to chat 💬🎉😃";

export function DailyNudge() {
  const navigate = useNavigate();

  useEffect(() => {
    if (typeof window === "undefined" || !("Notification" in window)) return;
    if (Notification.permission !== "granted" || !liveAlertsEnabled()) return;

    const today = new Date().toISOString().slice(0, 10);
    let last: string | null = null;
    try {
      last = localStorage.getItem(KEY);
    } catch {
      return;
    }
    if (last === today) return;

    const timer = window.setTimeout(() => {
      try {
        const n = new Notification("Crush", {
          body: BODY,
          icon: crushLogo.url,
          badge: crushLogo.url,
          tag: "crush-daily-nudge",
        });
        n.onclick = () => {
          window.focus();
          navigate({ to: "/chats" });
          n.close();
        };
        localStorage.setItem(KEY, today);
      } catch {
        /* noop */
      }
    }, 4000);

    return () => window.clearTimeout(timer);
  }, [navigate]);

  return null;
}
