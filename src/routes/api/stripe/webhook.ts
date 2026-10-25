import { createFileRoute } from "@tanstack/react-router";
import { handleStripeWebhook } from "@/server/stripeWebhook";

export const Route = createFileRoute("/api/stripe/webhook")({
  server: {
    handlers: {
      POST: async ({ request }) => handleStripeWebhook(request),
    },
  },
});
