import { authenticate } from "../../lib/middleware.js";
import { getStripeClient, getStripePriceId } from "../../lib/stripe.js";
import { getMPClient, getMPPublicKey, getMPPlanId } from "../../lib/mercadopago.js";
import { getDb } from "../../lib/db.js";

export default async function handler(req, res) {
  const reqOrigin = req.headers.origin || "";
  const allowedOrigins = [
    "https://chatea-personajes.vercel.app",
    "http://localhost:5173",
    "http://127.0.0.1:5173",
  ];
  const corsOrigin = allowedOrigins.includes(reqOrigin) ? reqOrigin : null;

  if (corsOrigin) {
    res.setHeader("Access-Control-Allow-Origin", corsOrigin);
    res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
  }

  if (req.method === "OPTIONS") {
    if (!corsOrigin) {
      return res.status(403).json({ error: "Origin not allowed" });
    }
    return res.status(204).end();
  }

  console.error("[api/checkout] method=" + req.method + " origin=" + reqOrigin + " url=" + req.url);

  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  authenticate(req, res, async () => {
    try {
      const provider = req.body?.provider || "stripe";
      const db = getDb();

      if (provider === "mercadopago") {
        const planId = getMPPlanId();
        const publicKey = getMPPublicKey();

        if (!planId) {
          return res.status(500).json({ error: "MercadoPago configuration error: missing plan ID" });
        }

        const mp = getMPClient();

        const customer = await mp.customers.create({
          email: req.user.email,
          metadata: { userId: String(req.user.id) },
        });

        const subscription = await mp.subscriptions.create({
          plan_id: planId,
          payer: {
            email: req.user.email,
          },
          back_url: `${process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:5173"}/success`,
        });

        db.run(
          `INSERT INTO subscriptions (user_id, status, provider, provider_subscription_id, current_period_end)
           VALUES (?, ?, ?, ?, ?)`,
          [
            req.user.id,
            "pending",
            "mercadopago",
            subscription.id,
            new Date().toISOString(),
          ]
        );

        return res.status(200).json({
          url: subscription.init_point,
          publicKey,
          subscriptionId: subscription.id,
        });
      }

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
      console.error("[api/checkout] Unexpected error:", error);
      return res.status(500).json({ error: "Internal server error" });
    }
  });
}
