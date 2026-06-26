const THEME_STORAGE_KEY = "chatapp_theme";

const THEME_COLORS = {
  light: {
    bgPrimary: "#ffffff",
    bgSecondary: "#f3f4f6",
    bgCard: "#ffffff",
    textPrimary: "#111827",
    textSecondary: "#6b7280",
    borderColor: "#e5e7eb",
    shadowCard: "0 4px 24px rgba(0, 0, 0, 0.08)",
    inputBg: "#ffffff",
    bubbleUser: "#f3f4f6",
    bubbleCharacter: "#ffffff",
    overlay: "rgba(255, 255, 255, 0.9)",
  },
  dark: {
    bgPrimary: "#0f0f0f",
    bgSecondary: "#1a1a1a",
    bgCard: "#1e1e1e",
    textPrimary: "#ffffff",
    textSecondary: "#a1a1a1",
    borderColor: "#2a2a2a",
    shadowCard: "0 4px 24px rgba(0, 0, 0, 0.4)",
    inputBg: "#1a1a1a",
    bubbleUser: "rgba(255, 255, 255, 0.05)",
    bubbleCharacter: "#1e1e1e",
    overlay: "rgba(15, 15, 15, 0.9)",
  },
};

function getSystemTheme() {
  if (typeof window === "undefined") return "light";
  return window.matchMedia("(prefers-color-scheme: dark)").matches
    ? "dark"
    : "light";
}

function loadTheme() {
  try {
    const stored = window.localStorage.getItem(THEME_STORAGE_KEY);
    if (stored === "light" || stored === "dark") return stored;
  } catch {
    // ignore
  }
  return getSystemTheme();
}

function saveTheme(theme) {
  try {
    window.localStorage.setItem(THEME_STORAGE_KEY, theme);
  } catch {
    // ignore
  }
}

function applyTheme(theme) {
  const root = document.documentElement;
  const colors = THEME_COLORS[theme] || THEME_COLORS.light;

  root.setAttribute("data-theme", theme);

  root.style.setProperty("--bg-primary", colors.bgPrimary);
  root.style.setProperty("--bg-secondary", colors.bgSecondary);
  root.style.setProperty("--bg-card", colors.bgCard);
  root.style.setProperty("--text-primary", colors.textPrimary);
  root.style.setProperty("--text-secondary", colors.textSecondary);
  root.style.setProperty("--border-color", colors.borderColor);
  root.style.setProperty("--shadow-card", colors.shadowCard);
  root.style.setProperty("--input-bg", colors.inputBg);
  root.style.setProperty("--bubble-user", colors.bubbleUser);
  root.style.setProperty("--bubble-character", colors.bubbleCharacter);
  root.style.setProperty("--overlay", colors.overlay);
}

function getTheme() {
  return document.documentElement.getAttribute("data-theme") || "light";
}

function toggleTheme() {
  const current = getTheme();
  const next = current === "dark" ? "light" : "dark";
  applyTheme(next);
  saveTheme(next);
  return next;
}

function initTheme() {
  const theme = loadTheme();
  applyTheme(theme);
  saveTheme(theme);

  if (typeof window !== "undefined") {
    window.matchMedia("(prefers-color-scheme: dark)").addEventListener("change", (e) => {
      const stored = window.localStorage.getItem(THEME_STORAGE_KEY);
      if (!stored) {
        applyTheme(e.matches ? "dark" : "light");
        saveTheme(e.matches ? "dark" : "light");
      }
    });
  }
}

export { initTheme, toggleTheme, getTheme, applyTheme, saveTheme, loadTheme, THEME_COLORS };
