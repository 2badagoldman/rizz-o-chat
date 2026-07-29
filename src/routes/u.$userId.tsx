import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery } from "@tanstack/react-query";
import { AppShell } from "@/components/AppShell";
import { ArrowLeft, MessageCircle } from "lucide-react";
import { useAuth } from "@/lib/auth";
import { OnlineDot, useIsOnline } from "@/lib/presence";
import { getPublicProfile } from "@/lib/people.functions";
import { SafetyMenu } from "@/components/SafetyMenu";
import { pageHead } from "@/lib/seo";


export const Route = createFileRoute("/u/$userId")({
  head: ({ params }) => ({
    ...pageHead({
      path: `/u/${params.userId}`,
      title: "Member profile — Crush",
      description: "View a Crush member profile and start chatting.",
      type: "profile",
      noindex: true,
    }),
  }),

  component: PublicProfilePage,
});

function PublicProfilePage() {
  const { userId } = Route.useParams();
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const fetchProfile = useServerFn(getPublicProfile);
  const online = useIsOnline(userId);

  const { data: profile, isLoading } = useQuery({
    queryKey: ["public-profile", userId],
    queryFn: () => fetchProfile({ data: { userId } }),
    enabled: Boolean(user),
  });

  if (loading) return <AppShell hideNav><div className="pt-20 text-center text-sm text-muted-foreground">Loading…</div></AppShell>;

  if (!user) {
    return (
      <AppShell hideNav>
        <div className="pt-20 text-center">
          <p className="text-sm text-muted-foreground">Sign in to view profiles on Crush.</p>
          <button onClick={() => navigate({ to: "/auth" })} className="btn-brand mt-5 inline-flex">Sign in</button>
        </div>
      </AppShell>
    );
  }

  const name = profile?.display_name ?? "Member";

  return (
    <AppShell hideNav>
      <header className="flex items-center gap-3 pt-3 pb-2">
        <button
          onClick={() => navigate({ to: "/chat/user/$userId", params: { userId } })}
          aria-label="Back to chat"
          className="rounded-full border border-border p-2"
        >

          <ArrowLeft className="h-4 w-4" />
        </button>
        <h1 className="text-base font-semibold">Profile</h1>
        {profile && profile.id !== user.id ? (
          <SafetyMenu userId={profile.id} name={name} context="profile" className="ml-auto" />
        ) : null}
      </header>


      {isLoading ? (
        <div className="pt-16 text-center text-sm text-muted-foreground">Loading profile…</div>
      ) : !profile ? (
        <div className="mt-10 rounded-2xl border border-border bg-card p-6 text-center text-sm text-muted-foreground">
          This profile isn&apos;t available.
        </div>
      ) : (
        <div className="mt-2 rounded-3xl border border-border bg-card/80 p-6 text-center backdrop-blur">
          <div className="relative mx-auto h-28 w-28">
            {profile.avatar_url ? (
              <img src={profile.avatar_url} alt={name} className="h-28 w-28 rounded-full object-cover shadow-glow" />
            ) : (
              <div className="grid h-28 w-28 place-items-center rounded-full bg-gradient-brand text-3xl font-bold text-white">
                {name.slice(0, 1).toUpperCase()}
              </div>
            )}
            <OnlineDot online={online} className="absolute bottom-1 right-1 h-5 w-5" />
          </div>
          <h2 className="mt-4 text-xl font-bold">{name}</h2>
          <p className="mt-1 text-xs text-muted-foreground">
            {profile.account_type === "host" ? "Host" : "Member"}
            {online ? " · Online now" : ""}
          </p>
          {profile.bio ? (
            <p className="mx-auto mt-4 max-w-md whitespace-pre-wrap text-sm text-muted-foreground">{profile.bio}</p>
          ) : (
            <p className="mt-4 text-sm text-muted-foreground">No bio yet.</p>
          )}

          {profile.id !== user.id ? (
            <button
              onClick={() => navigate({ to: "/chat/user/$userId", params: { userId: profile.id } })}
              className="btn-brand mt-6 inline-flex items-center gap-2"
            >
              <MessageCircle className="h-4 w-4" /> Message {name}
            </button>
          ) : (
            <button onClick={() => navigate({ to: "/profile" })} className="btn-brand mt-6 inline-flex">
              Edit my profile
            </button>
          )}
        </div>
      )}
    </AppShell>
  );
}
