/**
 * The first name a member actually signed up with.
 *
 * Creators calling someone by the wrong name kills the illusion instantly, so
 * whenever a member is signed in we prefer the name on their account over any
 * name guessed from chat or left behind in local storage by a previous visitor.
 */
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { saveMemberName } from "@/lib/member-memory";
import { saveVisitorName } from "@/lib/visitor-name";

/** "Sam Carter" -> "Sam"; emails/handles are never spoken out loud. */
export function firstNameOf(raw: string | null | undefined): string {
  const value = (raw ?? "").trim();
  if (!value || value.includes("@")) return "";
  const first = value.split(/[\s._-]+/)[0] ?? "";
  const clean = first.replace(/[^\p{L}\p{N}'-]/gu, "").slice(0, 24);
  if (clean.length < 2) return "";
  // Placeholder display names like "Crush 4821" are not real names.
  if (/^crush$/i.test(clean)) return "";
  return clean.charAt(0).toUpperCase() + clean.slice(1);
}

/**
 * Signed in -> their signup first name (and it becomes the confirmed name every
 * AI creator uses). Signed out -> empty string, so she keeps saying "you" until
 * the visitor types a name themselves.
 */
export function useSignupFirstName(): string {
  const { user } = useAuth();
  const [name, setName] = useState("");

  useEffect(() => {
    if (!user) {
      setName("");
      return;
    }
    let alive = true;

    const meta = user.user_metadata as Record<string, unknown> | undefined;
    const fromMeta =
      firstNameOf(meta?.["display_name"] as string) ||
      firstNameOf(meta?.["full_name"] as string) ||
      firstNameOf(meta?.["name"] as string);
    if (fromMeta) {
      setName(fromMeta);
      saveMemberName(fromMeta);
      saveVisitorName(fromMeta);
    }

    void supabase
      .from("profiles")
      .select("display_name")
      .eq("id", user.id)
      .maybeSingle()
      .then(({ data }) => {
        if (!alive) return;
        const fromProfile = firstNameOf(data?.display_name);
        if (!fromProfile) return;
        setName(fromProfile);
        // Their account name is authoritative — she never calls them anything else.
        saveMemberName(fromProfile);
        saveVisitorName(fromProfile);
      });

    return () => {
      alive = false;
    };
  }, [user]);

  return name;
}
