import { useServerFn } from "@tanstack/react-start";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Ban } from "lucide-react";
import { listMyBlocks, unblockUser } from "@/lib/safety.functions";
import { supabase } from "@/integrations/supabase/client";
import { useEffect, useState } from "react";

/** Lets members review and undo blocks — required by App Store safety review. */
export function BlockedAccounts() {
  const qc = useQueryClient();
  const fetchBlocks = useServerFn(listMyBlocks);
  const doUnblock = useServerFn(unblockUser);
  const [names, setNames] = useState<Record<string, string>>({});

  const { data: blocks } = useQuery({
    queryKey: ["my-blocks"],
    queryFn: () => fetchBlocks({ data: {} }),
  });

  useEffect(() => {
    const ids = (blocks ?? []).map((b) => b.blocked_id);
    if (!ids.length) return;
    supabase
      .from("profiles")
      .select("id, display_name")
      .in("id", ids)
      .then(({ data }) => {
        const map: Record<string, string> = {};
        for (const p of data ?? []) map[p.id] = p.display_name ?? "Member";
        setNames(map);
      });
  }, [blocks]);

  return (
    <div className="rounded-[14px] border border-border bg-card p-4">
      <h3 className="flex items-center gap-2 text-sm font-bold">
        <Ban className="h-4 w-4 text-destructive" /> Blocked accounts
      </h3>
      {!blocks?.length ? (
        <p className="mt-2 text-xs text-muted-foreground">
          You haven&apos;t blocked anyone. Use the menu on any profile or chat to block or report.
        </p>
      ) : (
        <ul className="mt-3 space-y-2">
          {blocks.map((b) => (
            <li key={b.blocked_id} className="flex items-center justify-between gap-3 text-sm">
              <span className="truncate">{names[b.blocked_id] ?? "Member"}</span>
              <button
                onClick={async () => {
                  await doUnblock({ data: { userId: b.blocked_id } });
                  await qc.invalidateQueries({ queryKey: ["my-blocks"] });
                }}
                className="shrink-0 rounded-full border border-border px-3 py-1 text-xs font-semibold"
              >
                Unblock
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
