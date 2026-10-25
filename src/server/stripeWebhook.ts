import { setClubPlan } from "@/server/clubSubscriptions";
import { stripeClient, stripeWebhookSecret } from "@/server/stripeClub";

/** Confirma el pago de Stripe y deja la sala con suscripcionActiva. */
export async function handleStripeWebhook(request: Request): Promise<Response> {
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
    const clubId = session.metadata?.["discotecaId"] ?? session.metadata?.["clubId"] ?? session.client_reference_id ?? "";
    if (clubId) {
      const club = await setClubPlan(clubId, true);
      if (!club) return Response.json({ error: "No se ha guardado la sala." }, { status: 500 });
    }
  }

  if (event.type === "customer.subscription.deleted") {
    const subscription = event.data.object;
    const clubId = subscription.metadata?.["discotecaId"] ?? subscription.metadata?.["clubId"] ?? "";
    if (clubId) {
      const club = await setClubPlan(clubId, false);
      if (!club) return Response.json({ error: "No se ha guardado la sala." }, { status: 500 });
    }
  }

  return Response.json({ received: true });
}
