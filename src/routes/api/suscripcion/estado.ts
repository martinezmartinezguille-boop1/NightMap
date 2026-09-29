import { createFileRoute } from "@tanstack/react-router";
import { activeClubIds } from "@/server/clubSubscriptions";

export const Route = createFileRoute("/api/suscripcion/estado")({
  server: {
    handlers: {
      GET: () => Response.json({ activas: activeClubIds() }),
    },
  },
});
