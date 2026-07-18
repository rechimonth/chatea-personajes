import { getDb, comparePassword, generateToken } from "../../db.js";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { email, password } = req.body || {};

    if (!email || typeof email !== "string") {
      return res.status(400).json({ error: "email is required" });
    }

    if (!password || typeof password !== "string") {
      return res.status(400).json({ error: "password is required" });
    }

    const db = getDb();
    const normalizedEmail = email.trim().toLowerCase();

    db.get(
      "SELECT * FROM users WHERE email = ? AND provider = 'local'",
      [normalizedEmail],
      (err, row) => {
        if (err) {
          console.error("[api/auth/login] Database error:", err);
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
  } catch (error) {
    console.error("[api/auth/login] Unexpected error:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
}
