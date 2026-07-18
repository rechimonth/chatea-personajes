import { getDb, hashPassword, comparePassword, generateToken } from "../../db.js";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { email, password } = req.body || {};

    if (!email || typeof email !== "string") {
      return res.status(400).json({ error: "email is required" });
    }

    if (!password || typeof password !== "string" || password.length < 6) {
      return res.status(400).json({ error: "password must be at least 6 characters" });
    }

    const db = getDb();

    const normalizedEmail = email.trim().toLowerCase();
    const passwordHash = hashPassword(password);

    db.run(
      "INSERT INTO users (email, password_hash, provider) VALUES (?, ?, 'local')",
      [normalizedEmail, passwordHash],
      function (err) {
        if (err) {
          if (err.message.includes("UNIQUE constraint failed")) {
            return res.status(409).json({ error: "Email already registered" });
          }

          console.error("[api/auth/register] Database error:", err);
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
  } catch (error) {
    console.error("[api/auth/register] Unexpected error:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
}
