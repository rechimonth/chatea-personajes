import { getDb } from "../../db.js";
import { authenticate } from "../../middleware.js";

export default async function handler(req, res) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  authenticate(req, res, async () => {
    try {
      const db = getDb();

      const user = await new Promise((resolve, reject) => {
        db.get("SELECT id, email, provider, created_at FROM users WHERE id = ?", [req.user.id], (err, row) => {
          if (err) {
            return reject(err);
          }
          resolve(row);
        });
      });

      if (!user) {
        return res.status(401).json({ error: "User not found" });
      }

      const subscription = await new Promise((resolve, reject) => {
        db.get(
          "SELECT * FROM subscriptions WHERE user_id = ? AND status = 'active' ORDER BY created_at DESC LIMIT 1",
          [req.user.id],
          (err, row) => {
            if (err) {
              return reject(err);
            }
            resolve(row);
          }
        );
      });

      return res.status(200).json({
        user: { id: user.id, email: user.email, provider: user.provider },
        subscription: subscription
          ? { status: subscription.status, provider: subscription.provider }
          : null,
      });
    } catch (error) {
      console.error("[api/auth/me] Unexpected error:", error);
      return res.status(500).json({ error: "Internal server error" });
    }
  });
}
