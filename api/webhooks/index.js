import { getStripeClient, getStripeWebhookSecret } from "../../stripe.js";
import { getMPClient } from "../../mercadopago.js";
import { getDb } from "../../db.js";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const provider = (req.query?.provider || "stripe").toString().toLowerCase();
  const db = getDb();

  try {
    if (provider === "mercadopago") {
      const webhookSecret = process.env.MP_WEBHOOK_SECRET;
      if (!webhookSecret) {
        return res.status(500).json({ error: "MercadoPago configuration error: missing webhook secret" });
      }

      const signature = req.headers["x-signature"];
      const dataId = req.headers["x-data-id"];

      if (!signature || !dataId) {
        return res.status(400).json({ error: "Missing MercadoPago headers" });
      }

      const event = req.body;

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
    }

    const webhookSecret = getStripeWebhookSecret();

    if (!webhookSecret) {
      return res.status(500).json({ error: "Stripe configuration error: missing webhook secret" });
    }

    const stripe = getStripeClient();
    const sig = req.headers["stripe-signature"];

    if (!sig) {
      return res.status(400).json({ error: "Missing stripe-signature header" });
    }

    let event;

    try {
      event = stripe.webhooks.constructEvent(req.body, sig, webhookSecret);
    } catch (error) {
      console.error("[api/webhooks] Webhook signature verification failed:", error);
      return res.status(400).json({ error: "Invalid webhook signature" });
    }

    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object;
        const userId = session.metadata?.userId;

        if (!userId) {
          console.error("[api/webhooks] Missing userId in session metadata");
          return res.status(200).json({ received: true });
        }

        const subscription = await stripe.subscriptions.retrieve(session.subscription);

        await new Promise((resolve, reject) => {
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
              subscription.status,
              "stripe",
              subscription.id,
              new Date(subscription.current_period_end * 1000).toISOString(),
            ],
            function (err) {
              if (err) {
                return reject(err);
              }
              resolve();
            }
          );
        });

        console.log(`[api/webhooks] Subscription created for user ${userId}`);
        break;
      }

      case "customer.subscription.deleted": {
        const subscription = event.data.object;

        await new Promise((resolve, reject) => {
          db.run(
            "UPDATE subscriptions SET status = 'canceled', updated_at = datetime('now') WHERE provider_subscription_id = ?",
            [subscription.id],
            function (err) {
              if (err) {
                return reject(err);
              }
              resolve();
            }
          );
        });

        console.log(`[api/webhooks] Subscription ${subscription.id} canceled`);
        break;
      }

      case "customer.subscription.updated": {
        const subscription = event.data.object;

        await new Promise((resolve, reject) => {
          db.run(
            "UPDATE subscriptions SET status = ?, current_period_end = ?, updated_at = datetime('now') WHERE provider_subscription_id = ?",
            [
              subscription.status,
              new Date(subscription.current_period_end * 1000).toISOString(),
              subscription.id,
            ],
            function (err) {
              if (err) {
                return reject(err);
              }
              resolve();
            }
          );
        });

        console.log(`[api/webhooks] Subscription ${subscription.id} updated`);
        break;
      }

      default:
        console.log(`[api/webhooks] Unhandled event type: ${event.type}`);
    }

    return res.status(200).json({ received: true });
  } catch (error) {
    console.error("[api/webhooks] Unexpected error:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
}
