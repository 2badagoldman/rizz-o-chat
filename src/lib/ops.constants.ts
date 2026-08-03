export type ManagerId = "health" | "payments" | "compliance" | "content" | "engagement";

export const MANAGERS: ReadonlyArray<{ id: ManagerId; label: string; blurb: string }> = [
  { id: "health", label: "Health Manager", blurb: "Database, auth, storage and AI reachability." },
  { id: "payments", label: "Payments Manager", blurb: "Reconciles checkouts, flags failed or stuck payments." },
  { id: "compliance", label: "Compliance Manager", blurb: "Tracks 18+ verification deadlines and overdue accounts." },
  { id: "content", label: "Content Janitor", blurb: "Clears expired stories and prunes old analytics." },
  { id: "engagement", label: "Engagement Manager", blurb: "Watches live stories, rooms and chat activity." },
];
