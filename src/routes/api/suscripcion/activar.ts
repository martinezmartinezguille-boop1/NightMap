import { createFileRoute } from "@tanstack/react-router";
import { setClubPlan } from "@/server/clubSubscriptions";
import { paidClubId, stripeSecret } from "@/server/stripeClub";

export const Route = createFileRoute("/api/suscripcion/activar")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const body: unknown = await request.json().catch(() => null);
        const clubId = body && typeof body === "object" && "clubId" in body && typeof body.clubId === "string" ? body.clubId : "";
        const sessionId =
          body && typeof body === "object" && "sessionId" in body && typeof body.sessionId === "string" ? body.sessionId : "";
        const simulado = body && typeof body === "object" && "simulado" in body && body.simulado === true;

        let id = "";
        if (sessionId) {
          id = (await paidClubId(sessionId)) ?? "";
          if (!id || (clubId && clubId !== id)) {
            return Response.json({ error: "El pago de Stripe no está confirmado." }, { status: 402 });
          }
        } else if (simulado) {
          if (stripeSecret()) {
            return Response.json({ error: "El pago simulado solo vale sin claves de Stripe." }, { status: 403 });
          }
          id = clubId;
        }

        if (!id) return Response.json({ error: "No hay un pago válido." }, { status: 400 });
        const club = setClubPlan(id, true);
        if (!club) return Response.json({ error: "No se ha podido activar la sala." }, { status: 404 });
        return Response.json({ id: club.id, suscripcionActiva: true, plan: "pro" });
      },
    },
  },
});
