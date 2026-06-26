const API_TIMEOUT = 30000;
const MAX_RETRIES = 2;
const RETRY_DELAY = 1000;

function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function postWithRetry(url, body, attempt = 1) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), API_TIMEOUT);

  try {
    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      const errorBody = await response.json().catch(() => ({}));
      throw new Error(errorBody.error || `HTTP ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    clearTimeout(timeoutId);

    if (attempt < MAX_RETRIES && (error.name === "AbortError" || error.message.includes("fetch"))) {
      await delay(RETRY_DELAY);
      return postWithRetry(url, body, attempt + 1);
    }

    throw error;
  }
}

export async function sendMessage(characterId, messages) {
  if (!characterId || typeof characterId !== "string") {
    throw new Error("[service] characterId is required");
  }

  if (!Array.isArray(messages)) {
    throw new Error("[service] messages must be an array");
  }

  const truncated = messages.slice(-20);

  try {
    const data = await postWithRetry("/api/chat", {
      characterId,
      messages: truncated,
    });

    if (typeof data.text !== "string") {
      throw new Error("[service] Invalid response format: text missing");
    }

    return {
      text: data.text.trim(),
      characterId,
      timestamp: Date.now(),
    };
  } catch (error) {
    console.error("[service] sendMessage failed:", error);
    throw new Error(error.message || "Error al enviar mensaje");
  }
}
