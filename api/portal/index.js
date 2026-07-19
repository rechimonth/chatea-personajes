import { authenticate } from "../../lib/middleware.js";
import { getStripeClient } from "../../lib/stripe.js";
import { getMPClient } from "../../lib/mercadopago.js";
import { getDb } from "../../lib/db.js";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  authenticate(req, res, async () => {
    try {
      const provider = req.body?.provider || "stripe";
      const db = getDb();

      const subscription = await new Promise((resolve, reject) => {
        db.get(
          "SELECT * FROM subscriptions WHERE user_id = ? AND provider = ? ORDER BY created_at DESC LIMIT 1",
          [req.user.id, provider],
          (err, row) => {
            if (err) return reject(err);
            resolve(row);
          }
        );
      });

      if (!subscription) {
        return res.status(404).json({ error: "No active subscription found" });
      }

      if (provider === "mercadopago") {
        return res.status(200).json({
          url: "https://www.mercadopago.com.ar/terms-of-service",
          message: "Manage subscription in your MercadoPago account",
        });
      }

      const stripe = getStripeClient();

      const session = await stripe.billingPortal.sessions.create({
        customer: subscription.provider_subscription_id,
        return_url: `${process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:5173"}/`,
      });

      return res.status(200).json({ url: session.url });
    } catch (error) {
      console.error("[api/portal] Unexpected error:", error);
      return res.status(500).json({ error: "Internal server error" });
    }
  });
}
