import { createFileRoute } from "@tanstack/react-router";
import { userFromRequest } from "@/server/sessionUser";
import { resolveManagedClub } from "@/server/venueManagers";

export const Route = createFileRoute("/api/suscripcion/mi-sala")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const user = await userFromRequest(request);
        if (!user) return Response.json({ error: "Inicia sesión." }, { status: 401 });
        const club = resolveManagedClub(user);
        if (!club) return Response.json({ discotecaId: null });
        return Response.json({
          discotecaId: club.id,
          nombre: club.nombre,
          ciudad: club.ciudad,
          suscripcionActiva: club.suscripcionActiva || club.plan === "pro",
        });
      },
    },
  },
});
