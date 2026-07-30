import { useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { Link } from "@tanstack/react-router";
import { ShieldOff, ShieldAlert } from "lucide-react";
import { toast } from "sonner";
import { listRestricted, setRestriction } from "@/lib/restrictions.functions";

type Row = {
  memberId: string;
  reason: string | null;
  createdAt: string;
  profile: { id: string; display_name: string | null; avatar_url: string | null } | null;
};

/**
 * The host's restricted group: these members can still text, but can no
 * longer send photos or video.
 */
export function RestrictedGroupPanel() {
  const load = useServerFn(listRestricted);
  const save = useServerFn(setRestriction);
  const [rows, setRows] = useState<Row[]>([]);
  const [busy, setBusy] = useState(true);

  useEffect(() => {
    load({})
      .then((r) => setRows(r as Row[]))
      .catch(() => {})
      .finally(() => setBusy(false));
  }, [load]);

  const remove = async (memberId: string) => {
    try {
      await save({ data: { memberId, restricted: false } });
      setRows((r) => r.filter((x) => x.memberId !== memberId));
      toast.success("Restriction removed.");
    } catch (e) {
      toast.error((e as Error).message);
    }
  };

  return (
    <section className="mt-6 rounded-2xl border border-border bg-card/80 p-4">
      <h2 className="flex items-center gap-2 text-sm font-semibold">
        <ShieldAlert className="h-4 w-4 text-amber-500" /> Restricted group
      </h2>
      <p className="mt-1 text-xs text-muted-foreground">
        Members here can keep chatting with you in text, but they can&apos;t send photos or video.
        Add someone from their chat using the shield button.
      </p>

      {busy ? (
        <p className="mt-3 text-xs text-muted-foreground">Loading…</p>
      ) : rows.length === 0 ? (
        <p className="mt-3 text-xs text-muted-foreground">No one is restricted right now.</p>
      ) : (
        <ul className="mt-3 space-y-2">
          {rows.map((r) => (
            <li key={r.memberId} className="flex items-center gap-3 rounded-xl border border-border bg-background/60 p-2">
              <div className="h-9 w-9 shrink-0 overflow-hidden rounded-full bg-gradient-brand grid place-items-center text-xs font-bold text-white">
                {r.profile?.avatar_url ? (
                  <img src={r.profile.avatar_url} alt="" className="h-full w-full object-cover" />
                ) : (
                  (r.profile?.display_name ?? "?").slice(0, 1).toUpperCase()
                )}
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium">{r.profile?.display_name ?? "Member"}</p>
                <p className="truncate text-[11px] text-muted-foreground">
                  {r.reason || "Text-only since "}{r.reason ? "" : new Date(r.createdAt).toLocaleDateString()}
                </p>
              </div>
              <Link
                to="/chat/user/$userId"
                params={{ userId: r.memberId }}
                className="rounded-full border border-border px-3 py-1 text-[11px]"
              >
                Open chat
              </Link>
              <button
                onClick={() => remove(r.memberId)}
                className="inline-flex items-center gap-1 rounded-full border border-amber-500/50 bg-amber-500/10 px-3 py-1 text-[11px] font-semibold text-amber-600"
              >
                <ShieldOff className="h-3 w-3" /> Unrestrict
              </button>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
