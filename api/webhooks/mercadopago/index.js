import { getMPClient } from "../../mercadopago.js";
import { getDb } from "../../db.js";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const webhookSecret = process.env.MP_WEBHOOK_SECRET;
  if (!webhookSecret) {
    return res.status(500).json({ error: "MercadoPago configuration error: missing webhook secret" });
  }

  const signature = req.headers["x-signature"];
  const dataId = req.headers["x-data-id"];

  if (!signature || !dataId) {
    return res.status(400).json({ error: "Missing MercadoPago headers" });
  }

  try {
    const event = req.body;
    const db = getDb();

    if (event.type === "payment") {
      const payment = event.data;

      if (payment.status === "approved") {
        const userId = payment.metadata?.userId;
        if (!userId) {
          return res.status(200).json({ received: true });
        }

        db.run(
          `INSERT INTO subscriptions (user_id, status, provider, provider_subscription_id, current_period_end)
           VALUES (?, ?, ?, ?, ?)
           ON CONFLICT(user_id) DO UPDATE SET
             status = excluded.status,
             provider_subscription_id = excluded.provider_subscription_id,
             current_period_end = excluded.current_period_end,
             updated_at = datetime('now')`,
          [
            userId,
            "active",
            "mercadopago",
            payment.id,
            new Date().toISOString(),
          ]
        );
      } else if (payment.status === "cancelled" || payment.status === "refunded") {
        db.run(
          "UPDATE subscriptions SET status = 'canceled', updated_at = datetime('now') WHERE provider_subscription_id = ?",
          [payment.id]
        );
      }
    }

    return res.status(200).json({ received: true });
  } catch (error) {
    console.error("[api/webhooks/mercadopago] Unexpected error:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
}
