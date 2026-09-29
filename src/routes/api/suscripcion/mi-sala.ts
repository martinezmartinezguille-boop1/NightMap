import { createFileRoute } from "@tanstack/react-router";
import { allActiveClubIds } from "@/server/clubSubscriptions";
import { userFromRequest } from "@/server/sessionUser";
import { resolveManagedClub } from "@/server/venueManagers";

export const Route = createFileRoute("/api/suscripcion/mi-sala")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const user = await userFromRequest(request);
        if (!user) return Response.json({ error: "Inicia sesión." }, { status: 401 });
        const club = await resolveManagedClub(user);
        if (!club) return Response.json({ discotecaId: null });
        const active = new Set(await allActiveClubIds());
        return Response.json({
          discotecaId: club.id,
          nombre: club.nombre,
          ciudad: club.ciudad,
          suscripcionActiva: active.has(club.id) || club.suscripcionActiva || club.plan === "pro",
        });
      },
    },
  },
});
