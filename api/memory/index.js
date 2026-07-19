import { authenticate } from "../../lib/middleware.js";
import { getDb } from "../../lib/db.js";
import { getAllowedOrigins, getCorsOrigin } from "../../lib/cors.js";
import {
  saveMemory,
  getRelevantMemories,
  listMemories,
  updateMemory,
  deleteMemory,
  mergeSimilarMemories,
  extractImportantInformation,
} from "../../lib/memory-engine.js";

function getQuery(reqUrl) {
  try {
    return new URL(reqUrl, "http://localhost").searchParams;
  } catch {
    return new URLSearchParams();
  }
}

export default async function handler(req, res) {
  const reqOrigin = req.headers.origin || "";
  const corsOrigin = getCorsOrigin(reqOrigin);

  if (corsOrigin) {
    res.setHeader("Access-Control-Allow-Origin", corsOrigin);
    res.setHeader("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
  }

  if (req.method === "OPTIONS") {
    if (!corsOrigin) {
      return res.status(403).json({ error: "Origin not allowed" });
    }
    return res.status(204).end();
  }

  return authenticate(req, res, async () => {
    try {
      const db = getDb();
      const url = req.url || "";
      const params = getQuery(url);

      if (req.method === "GET") {
        const characterId = params.get("characterId");
        if (!characterId) {
          return res.status(400).json({ error: "characterId is required" });
        }

        const memories = await listMemories(db, req.user.id, characterId);
        return res.status(200).json({ memories });
      }

      if (req.method === "POST") {
        const body = req.body || {};
        const { characterId, memory, category, importance, merge } = body;

        if (!characterId || typeof characterId !== "string") {
          return res.status(400).json({ error: "characterId is required" });
        }

        if (merge) {
          const merged = await mergeSimilarMemories(db, req.user.id, characterId);
          return res.status(200).json({ merged });
        }

        if (!memory || typeof memory !== "string") {
          return res.status(400).json({ error: "memory is required" });
        }

        const extracted = extractImportantInformation(memory);
        const finalMemory = extracted[0]?.memory || memory.trim();
        const finalCategory = category || extracted[0]?.category || "general";
        const finalImportance =
          typeof importance === "number" ? importance : extracted[0]?.importance || 1;

        const id = await saveMemory(
          db,
          req.user.id,
          characterId,
          finalMemory,
          finalCategory,
          finalImportance
        );

        return res.status(201).json({ id, memory: finalMemory, category: finalCategory, importance: finalImportance });
      }

      if (req.method === "PUT") {
        const id = Number(params.get("id"));
        if (!id) {
          return res.status(400).json({ error: "id is required" });
        }

        const body = req.body || {};
        const ok = await updateMemory(db, id, {
          memory: body.memory,
          category: body.category,
          importance: body.importance,
        });

        if (!ok) {
          return res.status(400).json({ error: "No valid fields to update" });
        }

        return res.status(200).json({ updated: true });
      }

      if (req.method === "DELETE") {
        const id = Number(params.get("id"));
        if (!id) {
          return res.status(400).json({ error: "id is required" });
        }

        await deleteMemory(db, id);
        return res.status(200).json({ deleted: true });
      }

      return res.status(405).json({ error: "Method not allowed" });
    } catch (error) {
      console.error("[api/memory] Unexpected error:", error);
      return res.status(500).json({ error: "Internal server error" });
    }
  });
}

export { getRelevantMemories };
