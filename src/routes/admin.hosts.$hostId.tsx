import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import {
  getHostDetail,
  setHostVerification,
  getHostAccountRecord,
  generateHostRecoveryLink,
} from "@/lib/admin-data.functions";
import { ArrowLeft, Check, Clock, X, MessageSquare, Users as UsersIcon, KeyRound, Copy } from "lucide-react";
import { toast } from "sonner";


export const Route = createFileRoute("/admin/hosts/$hostId")({
  head: () => ({ meta: [
      { name: "robots", content: "noindex, nofollow" },{ title: "Host review — Crush Admin" }] }),
  component: AdminHostDetail,
});

type Detail = Awaited<ReturnType<typeof getHostDetail>>;

function AdminHostDetail() {
  const { hostId } = Route.useParams();
  const fetchDetail = useServerFn(getHostDetail);
  const setStatus = useServerFn(setHostVerification);
  const [detail, setDetail] = useState<Detail | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [tab, setTab] = useState<"photos" | "dms" | "rooms">("photos");

  const load = () => {
    setErr(null);
    fetchDetail({ data: { hostId } })
      .then(setDetail)
      .catch((e) => setErr(String((e as Error).message ?? e)));
  };
  useEffect(load, [hostId]);

  async function decide(next: "verified" | "rejected" | "pending") {
    try {
      await setStatus({ data: { hostId, status: next } });
      toast.success(`Marked ${next}`);
      setDetail((d) => (d ? { ...d, profile: { ...d.profile, verification_status: next } } : d));
    } catch (e) {
      toast.error((e as Error).message);
    }
  }

  if (err) return <p className="text-sm text-destructive">{err}</p>;
  if (!detail) return <p className="text-sm text-muted-foreground">Loading host…</p>;

  const p = detail.profile;
  const status = p.verification_status ?? "pending";
  const statusCls =
    status === "verified" ? "bg-emerald-500/15 text-emerald-600" :
    status === "rejected" ? "bg-destructive/15 text-destructive" :
    "bg-yellow-500/15 text-yellow-700";

  return (
    <div className="mx-auto max-w-6xl">
      <div className="mb-4 flex items-center justify-between gap-3">
        <Link to="/admin/hosts" className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground">
          <ArrowLeft className="h-3.5 w-3.5" /> All hosts
        </Link>
        <div className="flex gap-1.5">
          <button onClick={() => decide("verified")} className="rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-3 py-1.5 text-xs font-semibold text-emerald-600 hover:bg-emerald-500/20">
            <Check className="mr-1 inline h-3.5 w-3.5" />Approve
          </button>
          <button onClick={() => decide("pending")} className="rounded-lg border border-yellow-500/30 bg-yellow-500/10 px-3 py-1.5 text-xs font-semibold text-yellow-700 hover:bg-yellow-500/20">
            <Clock className="mr-1 inline h-3.5 w-3.5" />Pending
          </button>
          <button onClick={() => decide("rejected")} className="rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-1.5 text-xs font-semibold text-destructive hover:bg-destructive/20">
            <X className="mr-1 inline h-3.5 w-3.5" />Reject
          </button>
        </div>
      </div>

      {/* Header */}
      <div className="flex items-start gap-4 rounded-2xl border border-border bg-card p-4">
        <div className="h-20 w-20 shrink-0 overflow-hidden rounded-2xl bg-gradient-brand-soft">
          {detail.avatarSignedUrl ? (
            <img loading="lazy" decoding="async" src={detail.avatarSignedUrl} alt="" className="h-full w-full object-cover" />
          ) : (
            <div className="grid h-full w-full place-items-center text-2xl font-bold text-primary">
              {(p.display_name ?? "?").slice(0, 1).toUpperCase()}
            </div>
          )}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="truncate text-xl font-bold">{p.display_name ?? "—"}</h1>
            <span className={"rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider " + statusCls}>{status}</span>
            <span className="rounded-full bg-muted px-2 py-0.5 text-[10px] uppercase tracking-wider text-muted-foreground">
              {p.gender ?? "—"} · {p.platform_tier ?? "free"}
            </span>
          </div>
          <p className="mt-1 text-xs text-muted-foreground">
            ID {p.id.slice(0, 8)} · joined {new Date(p.created_at).toLocaleDateString()}
          </p>
          {p.bio ? <p className="mt-2 text-sm leading-relaxed">{p.bio}</p> : <p className="mt-2 text-xs italic text-muted-foreground">No bio provided.</p>}
        </div>
      </div>

      {/* Tabs */}
      <div className="mt-5 flex gap-1 border-b border-border text-xs font-semibold">
        {([
          ["photos", `Photos & video (${detail.media.length})`],
          ["dms", `Direct chats (${detail.messages.length})`],
          ["rooms", `Room chats (${detail.roomMessages.length})`],
        ] as const).map(([id, label]) => (
          <button
            key={id}
            onClick={() => setTab(id)}
            className={
              "px-3 py-2 " +
              (tab === id ? "border-b-2 border-primary text-primary" : "text-muted-foreground hover:text-foreground")
            }
          >
            {label}
          </button>
        ))}
      </div>

      <div className="mt-4">
        {tab === "photos" ? (
          detail.media.length === 0 ? (
            <p className="text-sm text-muted-foreground">No uploads yet.</p>
          ) : (
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
              {detail.media.map((m) => (
                <div key={m.id} className="overflow-hidden rounded-xl border border-border bg-card">
                  <div className="aspect-square bg-muted">
                    {m.signedUrl ? (
                      m.media_type === "video" ? (
                        <video src={m.signedUrl} className="h-full w-full object-cover" muted playsInline controls />
                      ) : (
                        <img loading="lazy" decoding="async" src={m.signedUrl} alt="" className="h-full w-full object-cover" />
                      )
                    ) : (
                      <div className="grid h-full place-items-center text-xs text-muted-foreground">No preview</div>
                    )}
                  </div>
                  <div className="p-2">
                    <p className="truncate text-[11px] text-muted-foreground">{new Date(m.created_at).toLocaleString()}</p>
                    {m.caption ? <p className="mt-0.5 line-clamp-2 text-xs">{m.caption}</p> : null}
                  </div>
                </div>
              ))}
            </div>
          )
        ) : tab === "dms" ? (
          <MessagesList
            rows={detail.messages.map((m) => ({
              id: m.id,
              outbound: m.sender_id === hostId,
              counterpart: detail.names[(m.sender_id === hostId ? m.recipient_id : m.sender_id) ?? ""] ?? "—",
              body: m.body,
              created_at: m.created_at,
            }))}
            empty="No direct messages yet."
          />
        ) : (
          <MessagesList
            rows={detail.roomMessages.map((m) => ({
              id: m.id,
              outbound: m.sender_id === hostId,
              counterpart:
                (m as { host_rooms?: { name?: string } }).host_rooms?.name
                  ? `Room · ${(m as { host_rooms: { name: string } }).host_rooms.name}`
                  : "Room",

              body: m.body,
              created_at: m.created_at,
              icon: "room" as const,
            }))}
            empty="No room messages yet."
          />
        )}
      </div>
    </div>
  );
}

function MessagesList({
  rows,
  empty,
}: {
  rows: Array<{ id: string; outbound: boolean; counterpart: string; body: string; created_at: string; icon?: "room" }>;
  empty: string;
}) {
  if (rows.length === 0) return <p className="text-sm text-muted-foreground">{empty}</p>;
  return (
    <ul className="space-y-2">
      {rows.map((r) => (
        <li key={r.id} className="rounded-xl border border-border bg-card p-3">
          <div className="flex items-center justify-between text-[11px] text-muted-foreground">
            <span className="inline-flex items-center gap-1">
              {r.icon === "room" ? <UsersIcon className="h-3 w-3" /> : <MessageSquare className="h-3 w-3" />}
              {r.outbound ? "Host → " : "→ Host from "} <span className="font-semibold text-foreground">{r.counterpart}</span>
            </span>
            <span>{new Date(r.created_at).toLocaleString()}</span>
          </div>
          <p className="mt-1 whitespace-pre-wrap text-sm leading-relaxed">{r.body}</p>
        </li>
      ))}
    </ul>
  );
}
