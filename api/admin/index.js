import { getDb } from "../../lib/db.js";
import { authenticate } from "../../lib/middleware.js";

function getAdminEmail() {
  return (process.env.ADMIN_EMAIL || "").toLowerCase();
}

function isAdmin(user) {
  const adminEmail = getAdminEmail();
  if (!adminEmail) return false;
  return (user.email || "").toLowerCase() === adminEmail;
}

function parseRow(row) {
  if (!row) return null;

  return {
    id: row.id,
    name: row.name,
    category: row.category,
    tier: row.tier,
    avatar: row.avatar,
    primaryColor: row.primary_color,
    secondaryColor: row.secondary_color,
    description: row.description,
    greeting: row.greeting,
    tags: JSON.parse(row.tags || "[]"),
    systemPrompt: row.system_prompt,
    priceTier: row.price_tier,
    isActive: Boolean(row.is_active),
  };
}

function getAllCharacters(db) {
  return new Promise((resolve, reject) => {
    db.all("SELECT * FROM characters ORDER BY created_at DESC", (err, rows) => {
      if (err) {
        return reject(err);
      }
      resolve(rows.map(parseRow));
    });
  });
}

function getCharacterById(db, id) {
  return new Promise((resolve, reject) => {
    db.get("SELECT * FROM characters WHERE id = ?", [id], (err, row) => {
      if (err) {
        return reject(err);
      }
      resolve(parseRow(row));
    });
  });
}

function createCharacter(db, data) {
  return new Promise((resolve, reject) => {
    const sql = `
      INSERT INTO characters
        (id, name, category, tier, avatar, primary_color, secondary_color, description, greeting, tags, system_prompt, price_tier)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;
    db.run(
      sql,
      [
        data.id,
        data.name,
        data.category,
        data.tier,
        data.avatar,
        data.primaryColor,
        data.secondaryColor,
        data.description,
        data.greeting,
        JSON.stringify(data.tags || []),
        data.systemPrompt,
        data.priceTier || "free",
      ],
      function (err) {
        if (err) {
          return reject(err);
        }
        resolve(getCharacterById(db, String(this.lastID)));
      }
    );
  });
}

function updateCharacter(db, id, data) {
  return new Promise((resolve, reject) => {
    const fields = [];
    const values = [];

    if (data.name !== undefined) {
      fields.push("name = ?");
      values.push(data.name);
    }
    if (data.category !== undefined) {
      fields.push("category = ?");
      values.push(data.category);
    }
    if (data.tier !== undefined) {
      fields.push("tier = ?");
      values.push(data.tier);
    }
    if (data.avatar !== undefined) {
      fields.push("avatar = ?");
      values.push(data.avatar);
    }
    if (data.primaryColor !== undefined) {
      fields.push("primary_color = ?");
      values.push(data.primaryColor);
    }
    if (data.secondaryColor !== undefined) {
      fields.push("secondary_color = ?");
      values.push(data.secondaryColor);
    }
    if (data.description !== undefined) {
      fields.push("description = ?");
      values.push(data.description);
    }
    if (data.greeting !== undefined) {
      fields.push("greeting = ?");
      values.push(data.greeting);
    }
    if (data.tags !== undefined) {
      fields.push("tags = ?");
      values.push(JSON.stringify(data.tags));
    }
    if (data.systemPrompt !== undefined) {
      fields.push("system_prompt = ?");
      values.push(data.systemPrompt);
    }
    if (data.priceTier !== undefined) {
      fields.push("price_tier = ?");
      values.push(data.priceTier);
    }
    if (data.isActive !== undefined) {
      fields.push("is_active = ?");
      values.push(data.isActive ? 1 : 0);
    }

    if (!fields.length) {
      return resolve(getCharacterById(db, id));
    }

    fields.push("updated_at = datetime('now')");
    values.push(id);

    const sql = `UPDATE characters SET ${fields.join(", ")} WHERE id = ?`;

    db.run(sql, values, function (err) {
      if (err) {
        return reject(err);
      }
      resolve(getCharacterById(db, id));
    });
  });
}

function deleteCharacter(db, id) {
  return new Promise((resolve, reject) => {
    db.run("DELETE FROM characters WHERE id = ?", [id], function (err) {
      if (err) {
        return reject(err);
      }
      resolve({ deleted: this.changes > 0 });
    });
  });
}

export default async function handler(req, res) {
  if (!getAdminEmail()) {
    return res.status(500).json({ error: "Admin configuration error" });
  }

  authenticate(req, res, async () => {
    if (!isAdmin(req.user)) {
      return res.status(403).json({ error: "Forbidden" });
    }

    const db = getDb();

    try {
      if (req.method === "GET") {
        const characters = await getAllCharacters(db);
        return res.status(200).json(characters);
      }

      if (req.method === "POST") {
        const data = req.body || {};
        if (!data.id || !data.name) {
          return res.status(400).json({ error: "id and name are required" });
        }
        const character = await createCharacter(db, data);
        return res.status(201).json(character);
      }

      const id = req.query?.id;
      if (!id) {
        return res.status(400).json({ error: "id is required" });
      }

      if (req.method === "PUT") {
        const character = await updateCharacter(db, String(id), req.body || {});
        if (!character) {
          return res.status(404).json({ error: "Character not found" });
        }
        return res.status(200).json(character);
      }

      if (req.method === "DELETE") {
        const result = await deleteCharacter(db, String(id));
        if (!result.deleted) {
          return res.status(404).json({ error: "Character not found" });
        }
        return res.status(200).json({ deleted: true });
      }

      return res.status(405).json({ error: "Method not allowed" });
    } catch (error) {
      console.error("[api/admin] Unexpected error:", error);
      return res.status(500).json({ error: "Internal server error" });
    }
  });
}
