import Stripe from "stripe";

export const PRO_AMOUNT_CENTS = 1000;

export function stripeSecret(): string {
  return process.env["STRIPE_SECRET_KEY"] ?? "";
}

export function stripeWebhookSecret(): string {
  return process.env["STRIPE_WEBHOOK_SECRET"] ?? "";
}

export function stripeClient(): Stripe | null {
  const key = stripeSecret();
  if (!key) return null;
  return new Stripe(key);
}

export async function createProCheckout(clubId: string, clubName: string, origin: string): Promise<string> {
  const stripe = stripeClient();
  if (!stripe) throw new Error("Falta STRIPE_SECRET_KEY");
  const session = await stripe.checkout.sessions.create({
    mode: "subscription",
    client_reference_id: clubId,
    metadata: { discotecaId: clubId, clubId },
    subscription_data: { metadata: { discotecaId: clubId, clubId } },
    line_items: [
      {
        quantity: 1,
        price_data: {
          currency: "eur",
          unit_amount: PRO_AMOUNT_CENTS,
          recurring: { interval: "month" },
          product_data: {
            name: `NightMap Pro · ${clubName}`,
            description: "Pin dorado en el mapa y avisos destacados en el tablón.",
          },
        },
      },
    ],
    success_url: `${origin}/suscripcion/exito?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${origin}/`,
  });
  if (!session.url) throw new Error("Stripe no ha devuelto la página de pago.");
  return session.url;
}

export async function activeSubscriptionClubIds(): Promise<string[]> {
  const stripe = stripeClient();
  if (!stripe) return [];
  const ids: string[] = [];
  let startingAfter = "";
  for (let page = 0; page < 5; page += 1) {
    const list = await stripe.subscriptions.list({
      status: "active",
      limit: 100,
      ...(startingAfter ? { starting_after: startingAfter } : {}),
    });
    for (const subscription of list.data) {
      const id = subscription.metadata?.["discotecaId"] ?? subscription.metadata?.["clubId"] ?? "";
      if (id) ids.push(id);
    }
    const last = list.data[list.data.length - 1];
    if (!list.has_more || !last) break;
    startingAfter = last.id;
  }
  return ids;
}

export async function paidClubId(sessionId: string): Promise<string | null> {
  const stripe = stripeClient();
  if (!stripe) return null;
  const session = await stripe.checkout.sessions.retrieve(sessionId);
  const clubId = session.metadata?.["discotecaId"] ?? session.metadata?.["clubId"] ?? session.client_reference_id ?? "";
  const paid = session.payment_status === "paid" || session.status === "complete";
  if (!paid || session.mode !== "subscription" || !clubId) return null;
  return clubId;
}
