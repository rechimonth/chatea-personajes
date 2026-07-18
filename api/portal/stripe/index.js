import { getStripeClient } from "../../stripe.js";
import { authenticate } from "../../middleware.js";
import { getDb } from "../../db.js";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  authenticate(req, res, async () => {
    try {
      const db = getDb();

      const subscription = await new Promise((resolve, reject) => {
        db.get(
          "SELECT * FROM subscriptions WHERE user_id = ? AND provider = 'stripe' ORDER BY created_at DESC LIMIT 1",
          [req.user.id],
          (err, row) => {
            if (err) {
              return reject(err);
            }
            resolve(row);
          }
        );
      });

      if (!subscription) {
        return res.status(404).json({ error: "No active subscription found" });
      }

      const stripe = getStripeClient();

      const session = await stripe.billingPortal.sessions.create({
        customer: subscription.provider_subscription_id,
        return_url: `${process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:5173"}/`,
      });

      return res.status(200).json({ url: session.url });
    } catch (error) {
      console.error("[api/portal/stripe] Unexpected error:", error);
      return res.status(500).json({ error: "Internal server error" });
    }
  });
}
