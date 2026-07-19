import { getDb, hashPassword, comparePassword, generateToken } from "../../lib/db.js";

function parseUser(row) {
  if (!row) return null;
  return { id: row.id, email: row.email, provider: row.provider };
}

export default async function handler(req, res) {
  if (!req.method || req.method === "OPTIONS") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const db = getDb();

  try {
    if (req.method === "POST" && req.body?.action === "logout") {
      await new Promise((resolve, reject) => {
        db.run("DELETE FROM subscriptions WHERE user_id = ?", [req.user.id], function (err) {
          if (err) return reject(err);
          resolve();
        });
      });

      return res.status(204).end();
    }

    if (req.method === "GET") {
      const user = await new Promise((resolve, reject) => {
        db.get("SELECT id, email, provider, created_at FROM users WHERE id = ?", [req.user.id], (err, row) => {
          if (err) return reject(err);
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
            if (err) return reject(err);
            resolve(row);
          }
        );
      });

      return res.status(200).json({
        user: { id: user.id, email: user.email, provider: user.provider },
        subscription: subscription ? { status: subscription.status, provider: subscription.provider } : null,
      });
    }

    if (req.method === "POST") {
      const { email, password, action } = req.body || {};

      if (!email || typeof email !== "string") {
        return res.status(400).json({ error: "email is required" });
      }

      const normalizedEmail = email.trim().toLowerCase();

      if (action === "register") {
        if (!password || typeof password !== "string" || password.length < 6) {
          return res.status(400).json({ error: "password must be at least 6 characters" });
        }

        const passwordHash = hashPassword(password);

        db.run(
          "INSERT INTO users (email, password_hash, provider) VALUES (?, ?, 'local')",
          [normalizedEmail, passwordHash],
          function (err) {
            if (err) {
              if (err.message.includes("UNIQUE constraint failed")) {
                return res.status(409).json({ error: "Email already registered" });
              }

              console.error("[api/auth] Database error:", err);
              return res.status(500).json({ error: "Server configuration error" });
            }

            const user = { id: this.lastID, email: normalizedEmail };
            const token = generateToken(user);

            return res.status(201).json({
              token,
              user: { id: user.id, email: user.email },
            });
          }
        );
        return;
      }

      if (!password || typeof password !== "string") {
        return res.status(400).json({ error: "password is required" });
      }

      db.get(
        "SELECT * FROM users WHERE email = ? AND provider = 'local'",
        [normalizedEmail],
        (err, row) => {
          if (err) {
            console.error("[api/auth] Database error:", err);
            return res.status(500).json({ error: "Server configuration error" });
          }

          if (!row) {
            return res.status(401).json({ error: "Invalid email or password" });
          }

          const isValid = comparePassword(password, row.password_hash);

          if (!isValid) {
            return res.status(401).json({ error: "Invalid email or password" });
          }

          const token = generateToken(row);

          return res.status(200).json({
            token,
            user: { id: row.id, email: row.email },
          });
        }
      );
      return;
    }

    return res.status(405).json({ error: "Method not allowed" });
  } catch (error) {
    console.error("[api/auth] Unexpected error:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
}
