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
  const [tab, setTab] = useState<"account" | "photos" | "dms" | "rooms">("account");

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
          ["account", "Account & recovery"],
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
        {tab === "account" ? (
          <AccountPanel hostId={hostId} />
        ) : tab === "photos" ? (

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

type AccountRecord = Awaited<ReturnType<typeof getHostAccountRecord>>;

function AccountPanel({ hostId }: { hostId: string }) {
  const fetchAccount = useServerFn(getHostAccountRecord);
  const mintLink = useServerFn(generateHostRecoveryLink);
  const [rec, setRec] = useState<AccountRecord | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [link, setLink] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    setErr(null);
    fetchAccount({ data: { hostId } })
      .then(setRec)
      .catch((e) => setErr(String((e as Error).message ?? e)));
  }, [hostId, fetchAccount]);

  async function makeLink() {
    setBusy(true);
    try {
      const r = await mintLink({
        data: { hostId, redirectTo: `${window.location.origin}/reset-password` },
      });
      setLink(r.url);
      toast.success(`Recovery link ready for ${r.email}`);
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setBusy(false);
    }
  }

  if (err) return <p className="text-sm text-destructive">{err}</p>;
  if (!rec) return <p className="text-sm text-muted-foreground">Loading account record…</p>;

  const a = rec.account;
  const fmt = (v?: string | null) => (v ? new Date(v).toLocaleString() : "—");

  return (
    <div className="space-y-4">
      <section className="rounded-2xl border border-border bg-card p-4">
        <h3 className="text-sm font-semibold">Sign-in identifiers</h3>
        <dl className="mt-3 grid gap-x-6 gap-y-2 text-sm sm:grid-cols-2">
          <Row label="Email" value={a?.email ?? "—"} mono />
          <Row label="Phone" value={a?.phone || "—"} mono />
          <Row label="Sign-in methods" value={(a?.providers ?? []).join(", ") || "password"} />
          <Row label="Account created" value={fmt(a?.created_at)} />
          <Row label="Last sign-in" value={fmt(a?.last_sign_in_at)} />
          <Row label="Email confirmed" value={fmt(a?.email_confirmed_at)} />
          <Row label="Phone confirmed" value={fmt(a?.phone_confirmed_at)} />
          <Row label="Suspended until" value={fmt(a?.banned_until)} />
        </dl>
      </section>

      <section className="rounded-2xl border border-primary/30 bg-gradient-brand-soft p-4">
        <h3 className="flex items-center gap-1.5 text-sm font-semibold">
          <KeyRound className="h-4 w-4" /> Password recovery
        </h3>
        <p className="mt-1 text-xs text-muted-foreground">
          Passwords are stored as one-way salted hashes, so no one — including you — can read a
          member&apos;s password. To get a locked-out host back in, mint a one-time reset link below and
          send it to the email on file. The link expires after a single use.
        </p>
        <button
          onClick={makeLink}
          disabled={busy}
          className="mt-3 rounded-xl bg-primary px-3 py-2 text-xs font-semibold text-primary-foreground disabled:opacity-60"
        >
          {busy ? "Generating…" : "Generate reset link"}
        </button>
        {link && (
          <div className="mt-3 flex items-start gap-2 rounded-xl border border-border bg-card p-2">
            <code className="min-w-0 flex-1 break-all text-[11px]">{link}</code>
            <button
              onClick={() => {
                navigator.clipboard.writeText(link);
                toast.success("Copied");
              }}
              className="shrink-0 rounded-lg border border-border px-2 py-1 text-[11px] font-semibold"
            >
              <Copy className="mr-1 inline h-3 w-3" />Copy
            </button>
          </div>
        )}
      </section>

      <section className="rounded-2xl border border-border bg-card p-4">
        <h3 className="text-sm font-semibold">Audience &amp; activity</h3>
        <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-4">
          <Stat label="Active friends" value={rec.activeMembers} />
          <Stat label="Total members" value={rec.totalMembers} />
          <Stat label="Direct messages" value={rec.dmMessageCount} />
          <Stat label="Room messages" value={rec.roomMessageCount} />
        </div>
        {rec.lists.length > 0 && (
          <ul className="mt-3 space-y-1 text-xs text-muted-foreground">
            {rec.lists.map((l) => (
              <li key={l.id}>
                {l.title ?? "Friends list"} — ${(Number(l.price_cents ?? 0) / 100).toFixed(2)} ·{" "}
                {l.subscriber_count ?? 0} subscribers · {l.active ? "active" : "inactive"}
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="rounded-2xl border border-border bg-card p-4">
        <h3 className="text-sm font-semibold">Who they chat with</h3>
        {rec.chatPartners.length === 0 ? (
          <p className="mt-2 text-xs text-muted-foreground">No direct conversations yet.</p>
        ) : (
          <ul className="mt-3 divide-y divide-border/60">
            {rec.chatPartners.map((p) => (
              <li key={p.id} className="flex items-center justify-between py-1.5 text-sm">
                <Link to="/admin/hosts/$hostId" params={{ hostId: p.id }} className="truncate hover:underline">
                  {p.name}
                </Link>
                <span className="shrink-0 text-[11px] text-muted-foreground">
                  {p.messages} msgs · last {new Date(p.last).toLocaleDateString()}
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}

function Row({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div className="flex items-baseline justify-between gap-3 border-b border-border/50 pb-1">
      <dt className="text-xs text-muted-foreground">{label}</dt>
      <dd className={"truncate text-right " + (mono ? "font-mono text-xs" : "text-xs")}>{value}</dd>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-xl border border-border bg-background p-3">
      <p className="text-[10px] uppercase tracking-wider text-muted-foreground">{label}</p>
      <p className="mt-0.5 text-lg font-semibold">{value}</p>
    </div>
  );
}
