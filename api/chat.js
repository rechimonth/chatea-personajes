import { GoogleGenAI } from "@google/genai";
import { CHARACTERS } from "../characters.js";

const MAX_HISTORY = 20;

function getCharacter(characterId) {
  if (!characterId || typeof characterId !== "string") return null;
  return CHARACTERS.find((c) => c.id === characterId) || null;
}

function buildContents(messages, systemPrompt) {
  const contents = [];
  
  // Add system instruction
  contents.push({
    role: "user",
    parts: [{ text: systemPrompt }]
  });
  
  // Add message history (last user + recent history)
  messages.slice(-MAX_HISTORY).forEach((msg) => {
    contents.push({
      role: msg.role === "user" ? "user" : "model",
      parts: [{ text: msg.text }]
    });
  });
  
  return contents;
}

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { characterId, messages } = req.body || {};

    if (!characterId || typeof characterId !== "string") {
      return res.status(400).json({ error: "characterId is required" });
    }

    if (!Array.isArray(messages)) {
      return res.status(400).json({ error: "messages must be an array" });
    }

    const character = getCharacter(characterId);
    if (!character) {
      return res.status(404).json({ error: "Character not found" });
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      console.error("[api/chat] Missing GEMINI_API_KEY");
      return res.status(500).json({ error: "Server configuration error" });
    }

    const ai = new GoogleGenAI({ apiKey });
    
    const contents = buildContents(messages, `Instructions: ${character.systemPrompt}`);

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

    return res.status(200).json({ text: text.trim() });
  } catch (error) {
    console.error("[api/chat] Unexpected error:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
}