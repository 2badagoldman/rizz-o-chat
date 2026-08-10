import { useEffect, useState } from "react";
import { BellRing, BellOff, Radio } from "lucide-react";
import { LIVE_ALERTS_PREF, liveAlertsEnabled } from "./LiveHostAlerts";
import { useAuth } from "@/lib/auth";

/**
 * Web opt-in for "a creator is live now" device notifications.
 * Native shells use push instead, so this only shows in the browser.
 */
export function LiveAlertsCard() {
  const { user } = useAuth();
  const [supported, setSupported] = useState(false);
  const [permission, setPermission] = useState<NotificationPermission>("default");
  const [on, setOn] = useState(true);

  useEffect(() => {
    if (typeof window === "undefined" || !("Notification" in window)) return;
    setSupported(true);
    setPermission(Notification.permission);
    setOn(liveAlertsEnabled());
  }, []);

  if (!user || !supported) return null;

  const enable = async () => {
    const result = await Notification.requestPermission();
    setPermission(result);
    if (result === "granted") {
      localStorage.setItem(LIVE_ALERTS_PREF, "1");
      setOn(true);
      new Notification("You're all set", {
        body: "We'll ping you when a creator is live and waiting to chat.",
      });
    }
  };

  const toggle = () => {
    const next = !on;
    localStorage.setItem(LIVE_ALERTS_PREF, next ? "1" : "0");
    setOn(next);
  };

  return (
    <section className="mt-6 rounded-2xl border border-border bg-card p-5 shadow-card">
      <div className="flex items-start gap-3">
        <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-primary/10 text-primary">
          {permission === "granted" && on ? <BellRing className="h-5 w-5" /> : permission === "denied" ? <BellOff className="h-5 w-5" /> : <Radio className="h-5 w-5" />}
        </span>
        <div className="min-w-0 flex-1">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
            Live now alerts
          </h2>
          <p className="mt-1 text-[13px] leading-relaxed text-muted-foreground">
            {permission === "denied"
              ? "Alerts are blocked for Crush. Turn notifications back on in your browser settings to hear when a creator is live."
              : permission === "granted"
                ? "You'll get a nudge with her photo when a creator comes online — max 3 a day."
                : "Get a nudge like “Jen is live now — come say hi”, with her photo, when a creator comes online."}
          </p>
          {permission === "granted" ? (
            <button type="button" onClick={toggle} className="btn-brand mt-3 inline-flex">
              {on ? "Pause live alerts" : "Turn live alerts back on"}
            </button>
          ) : permission === "default" ? (
            <button type="button" onClick={enable} className="btn-brand mt-3 inline-flex">
              Turn on live alerts
            </button>
          ) : null}
        </div>
      </div>
    </section>
  );
}
