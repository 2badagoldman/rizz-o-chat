import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/api/public/errprobe")({
  server: {
    handlers: {
      GET: async () => {
        throw new Error("Server probe failure");
      },
    },
  },
});
