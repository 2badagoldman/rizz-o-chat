import { useEffect, useState } from "react";
import { Bell, BellOff, BellRing } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { useNativePlatform } from "@/hooks/useNative";
import { registerPushNotifications } from "@/lib/native";

/**
 * Push notification opt-in. Only rendered inside the native iOS/Android
 * shells — on web it renders nothing, so the deployed site is unchanged.
 */
export function PushNotificationsCard() {
  const platform = useNativePlatform();
  const { user } = useAuth();
  const [state, setState] = useState<"idle" | "working" | "on" | "denied">("idle");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (platform === "web" || !user) return;
    let active = true;
    void (async () => {
      const { data } = await supabase
        .from("push_devices")
        .select("id")
        .eq("user_id", user.id)
        .limit(1);
      if (active && data && data.length > 0) setState("on");
    })();
    return () => {
      active = false;
    };
  }, [platform, user]);

  if (platform === "web" || !user) return null;

  const enable = async () => {
    setError(null);
    setState("working");
    const result = await registerPushNotifications(async (token, tokenPlatform) => {
      const { error: err } = await supabase
        .from("push_devices")
        .upsert(
          { user_id: user.id, token, platform: tokenPlatform, last_seen_at: new Date().toISOString() },
          { onConflict: "token" },
        );
      if (err) setError(err.message);
    });
    if (result === "granted") setState("on");
    else if (result === "denied") setState("denied");
    else {
      setState("idle");
      setError("Notifications aren't available on this device.");
    }
  };

  return (
    <section className="mt-6 rounded-2xl border border-border bg-card p-5 shadow-card">
      <div className="flex items-start gap-3">
        <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-primary/10 text-primary">
          {state === "on" ? <BellRing className="h-5 w-5" /> : state === "denied" ? <BellOff className="h-5 w-5" /> : <Bell className="h-5 w-5" />}
        </span>
        <div className="min-w-0 flex-1">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
            Notifications
          </h2>
          <p className="mt-1 text-[13px] leading-relaxed text-muted-foreground">
            {state === "on"
              ? "You'll get a push when someone messages you, joins your Friends List or sends a gift."
              : state === "denied"
                ? "Notifications are turned off for Rizzla. Enable them in your device Settings to hear about new messages."
                : "Get a push when someone messages you, joins your Friends List or sends a gift."}
          </p>
          {state !== "on" && state !== "denied" ? (
            <button
              type="button"
              onClick={enable}
              disabled={state === "working"}
              className="btn-brand mt-3 inline-flex disabled:opacity-50"
            >
              {state === "working" ? "Enabling…" : "Turn on notifications"}
            </button>
          ) : null}
          {error ? <p className="mt-2 text-xs text-destructive">{error}</p> : null}
        </div>
      </div>
    </section>
  );
}
