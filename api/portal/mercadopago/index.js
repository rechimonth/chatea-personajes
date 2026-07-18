import { authenticate } from "../../middleware.js";
import { getMPClient } from "../../mercadopago.js";
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
          "SELECT * FROM subscriptions WHERE user_id = ? AND provider = 'mercadopago' ORDER BY created_at DESC LIMIT 1",
          [req.user.id],
          (err, row) => {
            if (err) return reject(err);
            resolve(row);
          }
        );
      });

      if (!subscription) {
        return res.status(404).json({ error: "No active subscription found" });
      }

      const mp = getMPClient();

      return res.status(200).json({
        url: "https://www.mercadopago.com.ar/terms-of-service",
        message: "Manage subscription in your MercadoPago account",
      });
    } catch (error) {
      console.error("[api/portal/mercadopago] Unexpected error:", error);
      return res.status(500).json({ error: "Internal server error" });
    }
  });
}
