import { saveTheme, loadTheme } from "./theme.js";

const STORAGE_THEME = "chatapp_theme";
const STORAGE_TOKEN = "chatapp_token";

function getHistoryKey(characterId) {
  return `chatapp_history_${characterId}`;
}

function createInitialState() {
  return {
    route: "/home",
    characterId: null,
    theme: "light",
    messages: [],
    dailyMessages: 0,
    token: null,
    user: null,
    subscription: null,
    authLoaded: false,
  };
}

let state = createInitialState();
const listeners = new Set();

function notify() {
  const snapshot = Object.freeze({ ...state, messages: [...state.messages] });
  listeners.forEach((fn) => {
    try {
      fn(snapshot);
    } catch (error) {
      console.error("[Store] Listener error:", error);
    }
  });
}

function loadFromStorage() {
  try {
    state.theme = loadTheme();
  } catch (error) {
    console.warn("[Store] Could not load theme:", error);
  }

  try {
    const raw = window.localStorage.getItem(STORAGE_TOKEN);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed && parsed.token) {
        state.token = parsed.token;
        state.user = parsed.user || null;
      }
    }
  } catch (error) {
    console.warn("[Store] Could not load auth:", error);
  }
}

function saveThemeToStorage() {
  try {
    saveTheme(state.theme);
  } catch (error) {
    console.warn("[Store] Could not save theme:", error);
  }
}

function saveAuthToStorage() {
  try {
    if (state.token) {
      window.localStorage.setItem(STORAGE_TOKEN, JSON.stringify({ token: state.token, user: state.user }));
    } else {
      window.localStorage.removeItem(STORAGE_TOKEN);
    }
  } catch (error) {
    console.warn("[Store] Could not save auth:", error);
  }
}

function loadMessages(characterId) {
  if (!characterId) return [];
  try {
    const raw = window.localStorage.getItem(getHistoryKey(characterId));
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) return parsed;
    }
  } catch (error) {
    console.warn("[Store] Could not load messages for", characterId, error);
  }
  return [];
}

function saveMessages() {
  if (!state.characterId) return;
  try {
    window.localStorage.setItem(
      getHistoryKey(state.characterId),
      JSON.stringify(state.messages)
    );
  } catch (error) {
    console.warn("[Store] Could not save messages for", state.characterId, error);
  }
}

function setState(updates) {
  if (typeof updates !== "object" || updates === null) {
    throw new Error("[Store] setState expects an object.");
  }

  const prevCharacterId = state.characterId;
  const nextCharacterId =
    "characterId" in updates ? updates.characterId : prevCharacterId;

  Object.assign(state, updates);

  if (
    prevCharacterId !== null &&
    nextCharacterId !== null &&
    prevCharacterId !== nextCharacterId
  ) {
    state.messages = loadMessages(nextCharacterId);
  } else if (nextCharacterId && state.messages.length === 0) {
    const loaded = loadMessages(nextCharacterId);
    if (loaded.length > 0) {
      state.messages = loaded;
    }
  }

  if ("theme" in updates) {
    saveThemeToStorage();
  }

  if ("messages" in updates && state.characterId) {
    saveMessages();
  }

  if ("token" in updates || "user" in updates || "subscription" in updates) {
    saveAuthToStorage();
  }

  if (
    "characterId" in updates &&
    nextCharacterId &&
    prevCharacterId !== nextCharacterId &&
    "messages" in updates === false
  ) {
    const loaded = loadMessages(nextCharacterId);
    if (loaded.length > 0) {
      state.messages = loaded;
    }
  }

  notify();
}

function getState() {
  return Object.freeze({ ...state, messages: [...state.messages] });
}

function subscribe(fn) {
  if (typeof fn !== "function") {
    throw new Error("[Store] subscribe expects a function.");
  }
  listeners.add(fn);
  return () => listeners.delete(fn);
}

function resetDaily() {
  state.dailyMessages = 0;
  notify();
}

function incrementDaily() {
  state.dailyMessages += 1;
  notify();
}

function clearHistory(characterId) {
  if (!characterId) return;
  try {
    window.localStorage.removeItem(getHistoryKey(characterId));
  } catch (error) {
    console.warn("[Store] Could not clear history for", characterId, error);
  }
  if (state.characterId === characterId) {
    state.messages = [];
    notify();
  }
}

function login(token, user) {
  setState({
    token,
    user,
    subscription: null,
    authLoaded: false,
  });
}

function logout() {
  setState({
    token: null,
    user: null,
    subscription: null,
    authLoaded: true,
  });
}

function setSubscription(subscription) {
  setState({ subscription });
}

function setAuthLoaded(loaded) {
  setState({ authLoaded: loaded });
}

async function fetchAuthStatus() {
  if (!state.token) {
    setAuthLoaded(true);
    return;
  }

  try {
    const response = await fetch("/api/auth", {
      headers: {
        Authorization: `Bearer ${state.token}`,
      },
    });

    if (!response.ok) {
      logout();
      return;
    }

    const data = await response.json();
    setState({
      user: data.user,
      subscription: data.subscription,
      authLoaded: true,
    });
  } catch (error) {
    console.error("[Store] fetchAuthStatus failed:", error);
    setAuthLoaded(true);
  }
}

loadFromStorage();

export const store = {
  getState,
  setState,
  subscribe,
  notify,
  resetDaily,
  incrementDaily,
  clearHistory,
  login,
  logout,
  setSubscription,
  fetchAuthStatus,
  setAuthLoaded,
};
