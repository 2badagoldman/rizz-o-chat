import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { saveRefCode } from "@/lib/ref-code";

export const Route = createFileRoute("/r/$code")({
  head: () => ({ meta: [{ name: "robots", content: "noindex, nofollow" }, { title: "Crush" }] }),
  component: RefLanding,
});

function RefLanding() {
  const { code } = Route.useParams();
  const navigate = useNavigate();

  useEffect(() => {
    const clean = (code ?? "").toUpperCase();
    saveRefCode(clean, "link");
    void import("@/lib/analytics").then((m) =>
      m.track("ref_visit", { metadata: { code: clean } }),
    );
    const t = setTimeout(() => navigate({ to: "/", replace: true }), 250);
    return () => clearTimeout(t);
  }, [code, navigate]);

  return (
    <div className="flex min-h-screen items-center justify-center px-6 text-center">
      <p className="text-sm text-muted-foreground">Opening Crush…</p>
    </div>
  );
}
