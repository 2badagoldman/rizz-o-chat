import { useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Flag, Ban, MoreVertical, X, Check } from "lucide-react";
import {
  REPORT_REASONS,
  submitReport,
  blockUser,
  unblockUser,
  isBlockedPair,
} from "@/lib/safety.functions";

/**
 * In-app report + block control. Required for user-generated content on the
 * App Store (Guideline 1.2) and Google Play. Rendered in profile and chat
 * headers so abuse can always be reported from where it happens.
 */
export function SafetyMenu({
  userId,
  name,
  context = "profile",
  className = "",
}: {
  userId?: string | null;
  name: string;
  context?: string;
  className?: string;
}) {
  const [open, setOpen] = useState(false);
  const [sheet, setSheet] = useState<"report" | null>(null);
  const [reason, setReason] = useState<string>(REPORT_REASONS[0]);
  const [details, setDetails] = useState("");
  const [sent, setSent] = useState(false);
  const [busy, setBusy] = useState(false);

  const qc = useQueryClient();
  const doReport = useServerFn(submitReport);
  const doBlock = useServerFn(blockUser);
  const doUnblock = useServerFn(unblockUser);
  const checkBlocked = useServerFn(isBlockedPair);

  const { data: blockState } = useQuery({
    queryKey: ["is-blocked", userId],
    queryFn: () => checkBlocked({ data: { userId: userId! } }),
    enabled: Boolean(userId) && open,
  });
  const blocked = Boolean(blockState?.blocked);

  async function toggleBlock() {
    if (!userId) return;
    setBusy(true);
    try {
      if (blocked) await doUnblock({ data: { userId } });
      else await doBlock({ data: { userId } });
      await qc.invalidateQueries({ queryKey: ["is-blocked", userId] });
      setOpen(false);
    } catch (e) {
      alert(e instanceof Error ? e.message : "Something went wrong");
    } finally {
      setBusy(false);
    }
  }

  async function send() {
    setBusy(true);
    try {
      await doReport({
        data: { reportedUserId: userId ?? null, reportedHandle: name, reason, details, context },
      });
      setSent(true);
    } catch (e) {
      alert(e instanceof Error ? e.message : "Could not send report");
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <button
        onClick={() => setOpen((v) => !v)}
        aria-label={`Safety options for ${name}`}
        className={`grid h-9 w-9 place-items-center rounded-full border border-border bg-card/70 text-muted-foreground ${className}`}
      >
        <MoreVertical className="h-4 w-4" />
      </button>

      {open ? (
        <div className="fixed inset-0 z-[80] flex items-end justify-center bg-black/50 p-4 sm:items-center" onClick={() => setOpen(false)}>
          <div
            className="w-full max-w-sm rounded-3xl border border-border bg-card p-4 shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-3 flex items-center justify-between">
              <p className="text-sm font-bold">{name}</p>
              <button onClick={() => setOpen(false)} aria-label="Close" className="rounded-full p-1 text-muted-foreground">
                <X className="h-4 w-4" />
              </button>
            </div>

            {sheet === null ? (
              <div className="space-y-2">
                <button
                  onClick={() => { setSheet("report"); setSent(false); }}
                  className="flex w-full items-center gap-3 rounded-2xl border border-border px-4 py-3 text-left text-sm font-semibold"
                >
                  <Flag className="h-4 w-4 text-primary" /> Report {name}
                </button>
                <button
                  onClick={toggleBlock}
                  disabled={!userId || busy}
                  className="flex w-full items-center gap-3 rounded-2xl border border-border px-4 py-3 text-left text-sm font-semibold disabled:opacity-50"
                >
                  <Ban className="h-4 w-4 text-destructive" />
                  {blocked ? `Unblock ${name}` : `Block ${name}`}
                </button>
                <p className="px-1 pt-1 text-[11px] leading-relaxed text-muted-foreground">
                  Reports are reviewed within 24 hours. Blocking hides this person and stops
                  messages in both directions.
                </p>
              </div>
            ) : sent ? (
              <div className="py-6 text-center">
                <Check className="mx-auto h-8 w-8 text-primary" />
                <p className="mt-3 text-sm font-semibold">Report sent</p>
                <p className="mt-1 text-xs text-muted-foreground">
                  Our moderation team reviews every report within 24 hours.
                </p>
                <button onClick={() => setOpen(false)} className="btn-brand mt-5 inline-flex">Done</button>
              </div>
            ) : (
              <div className="space-y-3">
                <label className="block text-xs font-semibold text-muted-foreground">Reason</label>
                <select
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  className="w-full rounded-2xl border border-border bg-background px-3 py-2 text-sm"
                >
                  {REPORT_REASONS.map((r) => (
                    <option key={r} value={r}>{r}</option>
                  ))}
                </select>
                <textarea
                  value={details}
                  onChange={(e) => setDetails(e.target.value)}
                  rows={3}
                  placeholder="Add any details (optional)"
                  className="w-full rounded-2xl border border-border bg-background px-3 py-2 text-sm"
                />
                <div className="flex gap-2">
                  <button onClick={() => setSheet(null)} className="flex-1 rounded-2xl border border-border py-2 text-sm font-semibold">
                    Back
                  </button>
                  <button onClick={send} disabled={busy} className="btn-brand flex-1 justify-center disabled:opacity-50">
                    {busy ? "Sending…" : "Send report"}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      ) : null}
    </>
  );
}
