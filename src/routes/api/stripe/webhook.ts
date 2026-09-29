import { createFileRoute } from "@tanstack/react-router";
import { setClubPlan } from "@/server/clubSubscriptions";
import { stripeClient, stripeWebhookSecret } from "@/server/stripeClub";

export const Route = createFileRoute("/api/stripe/webhook")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const stripe = stripeClient();
        const secret = stripeWebhookSecret();
        if (!stripe || !secret) {
          return Response.json({ error: "Stripe no está configurado." }, { status: 503 });
        }

        const signature = request.headers.get("stripe-signature");
        if (!signature) return Response.json({ error: "Falta la firma." }, { status: 400 });

        let event;
        try {
          event = stripe.webhooks.constructEvent(await request.text(), signature, secret);
        } catch {
          return Response.json({ error: "Firma no válida." }, { status: 400 });
        }

        if (event.type === "checkout.session.completed") {
          const session = event.data.object;
          const clubId = session.metadata?.["clubId"] ?? session.client_reference_id ?? "";
          if (clubId) setClubPlan(clubId, true);
        }

        if (event.type === "customer.subscription.deleted") {
          const subscription = event.data.object;
          const clubId = subscription.metadata?.["clubId"] ?? "";
          if (clubId) setClubPlan(clubId, false);
        }

        return Response.json({ received: true });
      },
    },
  },
});
