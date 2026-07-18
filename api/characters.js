import { getDb } from "./db.js";
import { CHARACTERS } from "../characters.js";

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

function getCharactersFromDb(db) {
  return new Promise((resolve, reject) => {
    db.all("SELECT * FROM characters WHERE is_active = 1", (err, rows) => {
      if (err) {
        return reject(err);
      }

      resolve(rows.map(parseRow));
    });
  });
}

export default async function handler(req, res) {
  const db = getDb();

  try {
    const characters = await getCharactersFromDb(db);

    if (!characters.length) {
      return res.status(200).json(CHARACTERS);
    }

    return res.status(200).json(characters);
  } catch (error) {
    console.error("[api/characters] Unexpected error:", error);
    return res.status(200).json(CHARACTERS);
  }
}
