import { createFileRoute } from "@tanstack/react-router";
import { siteOrigin, siteUrl } from "@/lib/siteUrl";
import { createProCheckout, stripeSecret } from "@/server/stripeClub";
import { userFromRequest } from "@/server/sessionUser";
import { resolveManagedClub } from "@/server/venueManagers";

export const Route = createFileRoute("/api/suscripcion/checkout")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const user = await userFromRequest(request);
        if (!user) return Response.json({ error: "Inicia sesión para suscribir tu sala." }, { status: 401 });
        const club = await resolveManagedClub(user);
        if (!club) {
          return Response.json({ error: "Tu cuenta no está vinculada como gerente de una sala." }, { status: 403 });
        }

        if (!stripeSecret()) {
          return Response.json({
            simulado: true,
            discotecaId: club.id,
            url: siteUrl("/suscripcion/exito?simulado=1"),
          });
        }

        try {
          const url = await createProCheckout(club.id, club.nombre, siteOrigin());
          return Response.json({ simulado: false, discotecaId: club.id, url });
        } catch (error) {
          const message = error instanceof Error ? error.message : "No se ha podido abrir el pago.";
          return Response.json({ error: message }, { status: 502 });
        }
      },
    },
  },
});
