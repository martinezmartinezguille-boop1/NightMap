import { createFileRoute } from "@tanstack/react-router";
import { setClubPlan } from "@/server/clubSubscriptions";
import { userFromRequest } from "@/server/sessionUser";
import { paidClubId, stripeSecret } from "@/server/stripeClub";
import { resolveManagedClub } from "@/server/venueManagers";

export const Route = createFileRoute("/api/suscripcion/activar")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const body: unknown = await request.json().catch(() => null);
        const sessionId =
          body && typeof body === "object" && "sessionId" in body && typeof body.sessionId === "string" ? body.sessionId : "";
        const simulado = body && typeof body === "object" && "simulado" in body && body.simulado === true;

        let id = "";
        if (sessionId) {
          id = (await paidClubId(sessionId)) ?? "";
          if (!id) return Response.json({ error: "El pago de Stripe no está confirmado." }, { status: 402 });
        } else if (simulado) {
          if (stripeSecret()) {
            return Response.json({ error: "El pago simulado solo vale sin claves de Stripe." }, { status: 403 });
          }
          const user = await userFromRequest(request);
          const club = user ? await resolveManagedClub(user) : null;
          if (!club) return Response.json({ error: "Tu cuenta no está vinculada como gerente de una sala." }, { status: 403 });
          id = club.id;
        }

        if (!id) return Response.json({ error: "No hay un pago válido." }, { status: 400 });
        const club = await setClubPlan(id, true);
        if (!club) return Response.json({ error: "No se ha podido activar la sala." }, { status: 404 });
        return Response.json({ id: club.id, discotecaId: club.id, suscripcionActiva: true, plan: "pro" });
      },
    },
  },
});
