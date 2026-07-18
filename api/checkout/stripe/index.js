import { getStripeClient, getStripePriceId } from "../../stripe.js";
import { authenticate } from "../../middleware.js";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  authenticate(req, res, async () => {
    try {
      const priceId = getStripePriceId();

      if (!priceId) {
        return res.status(500).json({ error: "Stripe configuration error: missing price ID" });
      }

      const stripe = getStripeClient();

      const session = await stripe.checkout.sessions.create({
        mode: "subscription",
        payment_method_types: ["card"],
        line_items: [
          {
            price: priceId,
            quantity: 1,
          },
        ],
        success_url: `${process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:5173"}/success?session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:5173"}/`,
        customer_email: req.user.email,
        metadata: {
          userId: String(req.user.id),
        },
      });

      return res.status(200).json({ url: session.url, sessionId: session.id });
    } catch (error) {
      console.error("[api/checkout/stripe] Unexpected error:", error);
      return res.status(500).json({ error: "Internal server error" });
    }
  });
}
