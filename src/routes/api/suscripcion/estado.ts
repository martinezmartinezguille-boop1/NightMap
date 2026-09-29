import { createFileRoute } from "@tanstack/react-router";
import { allActiveClubIds } from "@/server/clubSubscriptions";
import { activeSubscriptionClubIds } from "@/server/stripeClub";

export const Route = createFileRoute("/api/suscripcion/estado")({
  server: {
    handlers: {
      GET: async () => {
        const ids = new Set(await allActiveClubIds());
        try {
          for (const id of await activeSubscriptionClubIds()) ids.add(id);
        } catch {
          // Sin Stripe, el estado sale de la base de datos.
        }
        return Response.json({ activas: [...ids] });
      },
    },
  },
});
