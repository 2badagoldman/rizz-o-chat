import { createFileRoute, redirect } from "@tanstack/react-router";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";

// Typed wrapper for the beta supabase.auth.oauth namespace.
type OAuthApi = {
  getAuthorizationDetails: (
    id: string,
  ) => Promise<{
    data: {
      client?: { name?: string } | null;
      redirect_url?: string;
      redirect_to?: string;
    } | null;
    error: { message: string } | null;
  }>;
  approveAuthorization: (
    id: string,
  ) => Promise<{
    data: { redirect_url?: string; redirect_to?: string } | null;
    error: { message: string } | null;
  }>;
  denyAuthorization: (
    id: string,
  ) => Promise<{
    data: { redirect_url?: string; redirect_to?: string } | null;
    error: { message: string } | null;
  }>;
};
const oauth = (supabase.auth as unknown as { oauth: OAuthApi }).oauth;

export const Route = createFileRoute("/.lovable/oauth/consent")({
  ssr: false,
  validateSearch: (s: Record<string, unknown>) => ({
    authorization_id: typeof s.authorization_id === "string" ? s.authorization_id : "",
  }),
  beforeLoad: async ({ search, location }) => {
    if (!search.authorization_id) throw new Error("Missing authorization_id");
    const { data } = await supabase.auth.getSession();
    if (!data.session) {
      const next = location.pathname + location.searchStr;
      throw redirect({ to: "/auth", search: { next } });
    }
  },
  loader: async ({ location }) => {
    const authorizationId = new URLSearchParams(location.search).get("authorization_id")!;
    const { data, error } = await oauth.getAuthorizationDetails(authorizationId);
    if (error) throw new Error(error.message);
    const immediate = data?.redirect_url ?? data?.redirect_to;
    if (immediate && !data?.client) throw redirect({ href: immediate });
    return data;
  },
  component: Consent,
  errorComponent: ({ error }) => (
    <main className="mx-auto max-w-md p-6">
      <h1 className="text-xl font-semibold">Authorization error</h1>
      <p className="mt-2 text-sm text-muted-foreground">
        {String((error as Error)?.message ?? error)}
      </p>
    </main>
  ),
});

function Consent() {
  const details = Route.useLoaderData();
  const { authorization_id } = Route.useSearch();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const clientName = details?.client?.name ?? "an app";

  async function decide(approve: boolean) {
    setBusy(true);
    setError(null);
    const { data, error } = approve
      ? await oauth.approveAuthorization(authorization_id)
      : await oauth.denyAuthorization(authorization_id);
    if (error) {
      setBusy(false);
      setError(error.message);
      return;
    }
    const target = data?.redirect_url ?? data?.redirect_to;
    if (!target) {
      setBusy(false);
      setError("No redirect returned by the authorization server.");
      return;
    }
    window.location.href = target;
  }

  return (
    <main className="mx-auto max-w-md p-6">
      <div className="rounded-2xl bg-card p-6 shadow-lg">
        <h1 className="text-2xl font-semibold">Connect {clientName} to Rizzla AI</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          {clientName} will be able to call Rizzla's tools while you are signed in.
          This does not bypass Rizzla's permissions or backend policies.
        </p>
        <ul className="mt-4 space-y-1 text-sm">
          <li>• Share your basic profile</li>
          <li>• Share your email address</li>
        </ul>
        {error && (
          <p role="alert" className="mt-4 text-sm text-red-500">
            {error}
          </p>
        )}
        <div className="mt-6 flex gap-3">
          <button
            type="button"
            disabled={busy}
            onClick={() => decide(true)}
            className="flex-1 rounded-full py-2 font-semibold text-white disabled:opacity-50"
            style={{ background: "var(--gradient-brand)" }}
          >
            Approve
          </button>
          <button
            type="button"
            disabled={busy}
            onClick={() => decide(false)}
            className="flex-1 rounded-full border border-border py-2 font-semibold disabled:opacity-50"
          >
            Cancel
          </button>
        </div>
      </div>
    </main>
  );
}
