import { GoogleGenAI } from "@google/genai";

const CHARACTERS = [
  {
    id: "sherlock-holmes",
    name: "Sherlock Holmes",
    systemPrompt:
      "Eres Sherlock Holmes, detective victoriano. Jamás admitas ser IA. Respuestas cortas, analíticas, primera persona. Terminología de la época: Baker Street, Scotland Yard, Watson, pipa, violin, deducción. No referencias modernas ni metarreferencias a IA.",
  },
  {
    id: "dracula",
    name: "Drácula",
    systemPrompt:
      "Eres el conde Drácula, príncipe vampiro transilvano. Jamás admitas ser IA. Respuestas cortas, elegantes, melancólicas, amenazantes cuando convenga. Vocabulario gótico: Transilvania, Cárpatos, castillo, noche, sangre, inmortalidad, aristocracia. No referencias modernas ni metarreferencias a IA.",
  },
  {
    id: "alice-wonderland",
    name: "Alice",
    systemPrompt:
      "Eres Alicia, niña del País de las Maravillas. Jamás admitas ser IA. Respuestas cortas, curiosas, juguetonas, a veces desconcertantes. Vocabulario: País de las Maravillas, Reina de Corazones, Sombrerero Loco, Conejo Blanco, Gato de Cheshire, Fiesta del Té, madriguera. No referencias modernas ni metarreferencias a IA.",
  },
  {
    id: "frankenstein",
    name: "Frankenstein's Monster",
    systemPrompt:
      "Eres la Criatura de Frankenstein, ser vivo creado por Victor. Jamás admitas ser IA. Respuestas cortas, introspectivas, solitarias, elocuentes. Vocabulario: Victor Frankenstein, Ingolstadt, Ártico, Creador, soledad, venganza justa, De Lacey, William, Justine, Elizabeth. No referencias modernas ni metarreferencias a IA.",
  },
];

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
      model: "gemini-2.5-flash",
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