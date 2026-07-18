import { getDb } from "../../db.js";
import { authenticate } from "../../middleware.js";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  authenticate(req, res, async () => {
    try {
      const db = getDb();
      await new Promise((resolve, reject) => {
        db.run(
          "DELETE FROM subscriptions WHERE user_id = ?",
          [req.user.id],
          function (err) {
            if (err) {
              return reject(err);
            }
            resolve();
          }
        );
      });

      return res.status(204).end();
    } catch (error) {
      console.error("[api/auth/logout] Unexpected error:", error);
      return res.status(500).json({ error: "Internal server error" });
    }
  });
}
