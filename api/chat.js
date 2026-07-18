import { GoogleGenAI } from "@google/genai";
import { CHARACTERS } from "../characters.js";
import { getDb } from "./db.js";
import { authenticate } from "./middleware.js";
import { getRelevantMemories, saveMemory, extractImportantInformation } from "./memory-engine.js";
import { getCorsOrigin } from "./cors.js";

const MAX_MEMORIES = 8;

const MAX_HISTORY = 20;
const MAX_REQUESTS_PER_MINUTE = 10;
const WINDOW_SIZE_MS = 60 * 1000;

const rateLimitMap = new Map();

function checkRateLimit(clientIp) {
  if (!clientIp) return false;

  const now = Date.now();
  let timestamps = rateLimitMap.get(clientIp);

  if (!timestamps) {
    timestamps = [];
    rateLimitMap.set(clientIp, timestamps);
  }

  const recent = timestamps.filter((ts) => now - ts < WINDOW_SIZE_MS);

  if (recent.length >= MAX_REQUESTS_PER_MINUTE) {
    const retryAfter = Math.ceil((recent[0] + WINDOW_SIZE_MS - now) / 1000);
    return { limited: true, retryAfter };
  }

  recent.push(now);
  rateLimitMap.set(clientIp, recent);

  return { limited: false, retryAfter: 0 };
}

function getCharacter(characterId) {
  if (!characterId || typeof characterId !== "string") return null;
  return CHARACTERS.find((c) => c.id === characterId) || null;
}

function buildContents(messages, systemPrompt) {
  const contents = [];

  contents.push({
    role: "user",
    parts: [{ text: systemPrompt }],
  });

  messages.slice(-MAX_HISTORY).forEach((msg) => {
    contents.push({
      role: msg.role === "user" ? "user" : "model",
      parts: [{ text: msg.text }],
    });
  });

  return contents;
}

export function resetRateLimit() {
  rateLimitMap.clear();
}

export default async function handler(req, res) {
  const reqOrigin = req.headers.origin || "";
  const corsOrigin = getCorsOrigin(reqOrigin);

  if (corsOrigin) {
    res.setHeader("Access-Control-Allow-Origin", corsOrigin);
    res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  }

  if (req.method === "OPTIONS") {
    if (!corsOrigin) {
      return res.status(403).json({ error: "Origin not allowed" });
    }
    return res.status(204).end();
  }

  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  if (!corsOrigin) {
    return res.status(403).json({ error: "Origin not allowed" });
  }

  const clientIp = req.headers["x-forwarded-for"] || req.connection.remoteAddress;

  const rateLimit = checkRateLimit(clientIp);
  if (rateLimit.limited) {
    console.error(`[api/chat] Rate limit exceeded for IP: ${clientIp}`);
    res.setHeader("Retry-After", String(rateLimit.retryAfter));
    return res.status(429).json({ error: "Too many requests. Please try again later." });
  }

  authenticate(req, res, async () => {
    try {
      const apiKey = process.env.GEMINI_API_KEY;
      if (!apiKey) {
        console.error("[api/chat] Missing GEMINI_API_KEY");
        return res.status(500).json({ error: "Server configuration error" });
      }

      let { characterId, messages } = req.body || {};

      if (!characterId || typeof characterId !== "string") {
        return res.status(400).json({ error: "characterId is required" });
      }

      if (!Array.isArray(messages)) {
        return res.status(400).json({ error: "messages must be an array" });
      }

      if (messages.length > MAX_HISTORY) {
        console.error(`[api/chat] Truncating messages from ${messages.length} to ${MAX_HISTORY}`);
        messages = messages.slice(-MAX_HISTORY);
      }

      const character = getCharacter(characterId);
      if (!character) {
        return res.status(404).json({ error: "Character not found" });
      }

      const db = getDb();

      const subscription = await new Promise((resolve, reject) => {
        db.get(
          "SELECT * FROM subscriptions WHERE user_id = ? AND status = 'active' AND current_period_end > datetime('now') ORDER BY created_at DESC LIMIT 1",
          [req.user.id],
          (err, row) => {
            if (err) {
              return reject(err);
            }
            resolve(row);
          }
        );
      });

      if (character.priceTier === "premium" && !subscription) {
        return res.status(402).json({ error: "Premium subscription required", code: "premium_required" });
      }

      const today = new Date().toISOString().slice(0, 10);
      const usage = await new Promise((resolve, reject) => {
        db.get(
          "SELECT * FROM usage_logs WHERE user_id = ? AND character_id = ? AND date = ?",
          [req.user.id, characterId, today],
          (err, row) => {
            if (err) {
              return reject(err);
            }
            resolve(row);
          }
        );
      });

      if (!subscription) {
        const currentCount = usage ? usage.message_count : 0;

        if (currentCount >= 10) {
          return res.status(402).json({ error: "Daily limit reached", code: "daily_limit_reached" });
        }
      }

      const ai = new GoogleGenAI({ apiKey });

      let systemPrompt = `Instructions: ${character.systemPrompt}`;

      try {
        const memories = await getRelevantMemories(db, req.user.id, characterId, MAX_MEMORIES);
        if (memories && memories.length > 0) {
          const memoryLines = memories
            .slice(0, MAX_MEMORIES)
            .map((m) => `- ${m.memory}`)
            .join("\n");
          systemPrompt += `\n\nLo que ya sabes de este usuario (úsalo de forma natural, sin mencionar esta lista):\n${memoryLines}`;
        }
      } catch (memErr) {
        console.error("[api/chat] Failed to load memories:", memErr);
      }

      const contents = buildContents(messages, systemPrompt);

      const response = await ai.models.generateContent({
        model: "gemini-3.1-flash-lite",
        contents,
        config: {
          temperature: 0.7,
          maxOutputTokens: 256,
        },
      });

      const text = response.candidates?.[0]?.content?.parts?.[0]?.text ||
        "Lo siento, no pude generar una respuesta.";

      if (usage) {
        db.run(
          "UPDATE usage_logs SET message_count = message_count + 1, created_at = datetime('now') WHERE id = ?",
          [usage.id]
        );
      } else {
        db.run(
          "INSERT INTO usage_logs (user_id, character_id, date, message_count) VALUES (?, ?, ?, 1)",
          [req.user.id, characterId, today]
        );
      }

      const lastUserMessage = [...messages].reverse().find((m) => m.role === "user");
      if (lastUserMessage && typeof lastUserMessage.text === "string") {
        try {
          const extracted = extractImportantInformation(lastUserMessage.text);
          for (const item of extracted) {
            await saveMemory(
              db,
              req.user.id,
              characterId,
              item.memory,
              item.category,
              item.importance
            );
          }
        } catch (memErr) {
          console.error("[api/chat] Failed to save memory:", memErr);
        }
      }

      return res.status(200).json({ text: text.trim() });
    } catch (error) {
      console.error("[api/chat] Unexpected error:", error);
      return res.status(500).json({ error: "Internal server error" });
    }
  });
}
