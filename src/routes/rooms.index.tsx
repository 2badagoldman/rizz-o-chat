import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { AppShell } from "@/components/AppShell";
import { useAuth } from "@/lib/auth";
import { listPublicRooms, joinPublicRoom } from "@/lib/rooms.functions";
import { MapPin, Plus, Users, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { pageHead } from "@/lib/seo";

export const Route = createFileRoute("/rooms/")({
  head: () => pageHead({
    path: "/rooms",
    title: "Rooms near you \u2014 Rizz Social",
    description: "Join live chat rooms near you. Meet hosts and members in city rooms across the US on Rizz Social.",
  })}
        </ul>
      )}
    </AppShell>
  );
}
