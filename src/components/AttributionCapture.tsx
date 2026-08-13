import { useEffect, useRef } from "react";
import { useServerFn } from "@tanstack/react-start";
import { useAuth } from "@/lib/auth";
import { attachAttribution } from "@/lib/attribution.functions";
import { getRefCode, getRefSource, saveRefCode } from "@/lib/ref-code";

const DONE_KEY = "rizzla:ref_attached";

/** Captures ?ref=CODE anywhere in the app and attaches it once the user signs up. */
export function AttributionCapture() {
  const { user, loading } = useAuth();
  const attach = useServerFn(attachAttribution);
  const ran = useRef(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const ref = new URLSearchParams(window.location.search).get("ref");
    if (ref) saveRefCode(ref, "query");
  }, []);

  useEffect(() => {
    if (loading || !user || ran.current) return;
    const code = getRefCode();
    if (!code) return;
    try {
      if (localStorage.getItem(DONE_KEY) === code) return;
    } catch {}
    ran.current = true;
    void (async () => {
      try {
        await attach({ data: { code, source: getRefSource() ?? undefined } });
        localStorage.setItem(DONE_KEY, code);
      } catch {
        ran.current = false;
      }
    })();
  }, [user, loading, attach]);

  return null;
}
