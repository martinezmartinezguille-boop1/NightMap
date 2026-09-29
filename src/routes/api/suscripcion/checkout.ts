import { createFileRoute } from "@tanstack/react-router";
import { officialClubById } from "@/lib/clubPlans";
import { createProCheckout, stripeSecret } from "@/server/stripeClub";

export const Route = createFileRoute("/api/suscripcion/checkout")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const body: unknown = await request.json().catch(() => null);
        const clubId = body && typeof body === "object" && "clubId" in body ? body.clubId : "";
        if (typeof clubId !== "string" || !clubId) {
          return Response.json({ error: "Falta la sala." }, { status: 400 });
        }
        const club = officialClubById(clubId);
        if (!club) return Response.json({ error: "Esa sala no está en la base oficial." }, { status: 404 });

        if (!stripeSecret()) {
          const origin = new URL(request.url).origin;
          return Response.json({
            simulado: true,
            url: `${origin}/suscripcion/exito?club=${encodeURIComponent(club.id)}&simulado=1`,
          });
        }

        try {
          const url = await createProCheckout(club.id, club.nombre, new URL(request.url).origin);
          return Response.json({ simulado: false, url });
        } catch (error) {
          const message = error instanceof Error ? error.message : "No se ha podido abrir el pago.";
          return Response.json({ error: message }, { status: 502 });
        }
      },
    },
  },
});
