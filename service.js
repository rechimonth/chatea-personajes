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

function getAuthHeaders() {
  const token = window.localStorage.getItem("chatapp_token");
  const parsed = token ? JSON.parse(token) : null;
  const authToken = parsed?.token;

  if (!authToken) return {};

  return {
    Authorization: `Bearer ${authToken}`,
  };
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

    if (error.message.includes("Daily limit reached") || error.message.includes("premium_required")) {
      showDailyLimitModal();
    }

    throw new Error(error.message || "Error al enviar mensaje");
  }
}

export async function getMemories(characterId) {
  if (!characterId || typeof characterId !== "string") {
    throw new Error("[service] characterId is required");
  }

  try {
    const response = await fetch(
      `/api/memory?characterId=${encodeURIComponent(characterId)}`,
      {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          ...getAuthHeaders(),
        },
      }
    );

    if (response.status === 401) {
      return [];
    }

    if (!response.ok) {
      const errorBody = await response.json().catch(() => ({}));
      throw new Error(errorBody.error || `HTTP ${response.status}`);
    }

    const data = await response.json();
    return Array.isArray(data.memories) ? data.memories : [];
  } catch (error) {
    console.error("[service] getMemories failed:", error);
    return [];
  }
}

export async function saveMemory(characterId, memory, category, importance) {
  if (!characterId || typeof characterId !== "string") {
    throw new Error("[service] characterId is required");
  }

  if (!memory || typeof memory !== "string") {
    throw new Error("[service] memory is required");
  }

  try {
    const response = await fetch("/api/memory", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...getAuthHeaders(),
      },
      body: JSON.stringify({ characterId, memory, category, importance }),
    });

    if (!response.ok) {
      const errorBody = await response.json().catch(() => ({}));
      throw new Error(errorBody.error || `HTTP ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error("[service] saveMemory failed:", error);
    throw new Error(error.message || "Error al guardar memoria");
  }
}

export async function updateMemory(id, updates = {}) {
  if (!id) {
    throw new Error("[service] id is required");
  }

  try {
    const response = await fetch(`/api/memory?id=${encodeURIComponent(id)}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        ...getAuthHeaders(),
      },
      body: JSON.stringify(updates),
    });

    if (!response.ok) {
      const errorBody = await response.json().catch(() => ({}));
      throw new Error(errorBody.error || `HTTP ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error("[service] updateMemory failed:", error);
    throw new Error(error.message || "Error al actualizar memoria");
  }
}

export async function deleteMemory(id) {
  if (!id) {
    throw new Error("[service] id is required");
  }

  try {
    const response = await fetch(`/api/memory?id=${encodeURIComponent(id)}`, {
      method: "DELETE",
      headers: {
        ...getAuthHeaders(),
      },
    });

    if (!response.ok) {
      const errorBody = await response.json().catch(() => ({}));
      throw new Error(errorBody.error || `HTTP ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error("[service] deleteMemory failed:", error);
    throw new Error(error.message || "Error al eliminar memoria");
  }
}

function showDailyLimitModal() {
  const modal = document.getElementById("daily-limit-modal");
  if (!modal) return;

  modal.hidden = false;

  const closeBtn = document.getElementById("modal-close");
  const upgradeBtn = document.getElementById("modal-upgrade");

  const hide = () => {
    modal.hidden = true;
  };

  if (closeBtn) {
    closeBtn.onclick = hide;
  }

  if (upgradeBtn) {
    upgradeBtn.onclick = async () => {
      hide();
      try {
        const data = await startCheckout();
        if (data?.url) {
          window.location.href = data.url;
        }
      } catch (err) {
        console.error("[service] upgrade from modal failed:", err);
        alert(err.message || "Error al iniciar el pago");
      }
    };
  }
}

export async function startCheckout() {
  try {
    const response = await fetch("/api/checkout", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...getAuthHeaders(),
      },
      body: JSON.stringify({ provider: "stripe" }),
    });

    if (!response.ok) {
      const errorBody = await response.json().catch(() => ({}));
      throw new Error(errorBody.error || `HTTP ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error("[service] startCheckout failed:", error);
    throw new Error(error.message || "Error al iniciar el pago");
  }
}

export async function openCustomerPortal() {
  try {
    const response = await fetch("/api/portal", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...getAuthHeaders(),
      },
      body: JSON.stringify({ provider: "stripe" }),
    });

    if (!response.ok) {
      const errorBody = await response.json().catch(() => ({}));
      throw new Error(errorBody.error || `HTTP ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error("[service] openCustomerPortal failed:", error);
    throw new Error(error.message || "Error al abrir el portal de pagos");
  }
}

export async function startCheckoutMP() {
  try {
    const response = await fetch("/api/checkout", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...getAuthHeaders(),
      },
      body: JSON.stringify({ provider: "mercadopago" }),
    });

    if (!response.ok) {
      const errorBody = await response.json().catch(() => ({}));
      throw new Error(errorBody.error || `HTTP ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error("[service] startCheckoutMP failed:", error);
    throw new Error(error.message || "Error al iniciar el pago con MercadoPago");
  }
}

export async function openCustomerPortalMP() {
  try {
    const response = await fetch("/api/portal", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...getAuthHeaders(),
      },
      body: JSON.stringify({ provider: "mercadopago" }),
    });

    if (!response.ok) {
      const errorBody = await response.json().catch(() => ({}));
      throw new Error(errorBody.error || `HTTP ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error("[service] openCustomerPortalMP failed:", error);
    throw new Error(error.message || "Error al abrir el portal de pagos de MercadoPago");
  }
}
