const THEME_STORAGE_KEY = "chatapp_theme";

const THEME_COLORS = {
  light: {
    bgPrimary: "#f5f0e6",
    bgSecondary: "#ece5d8",
    bgCard: "#f7f2ea",
    textPrimary: "#2b2416",
    textSecondary: "#6b5d4a",
    borderColor: "rgba(218, 189, 115, 0.55)",
    shadowCard: "0 4px 24px rgba(139, 105, 20, 0.12)",
    inputBg: "rgba(245, 240, 230, 0.85)",
    bubbleUser: "rgba(139, 105, 20, 0.14)",
    bubbleCharacter: "rgba(247, 242, 234, 0.92)",
    overlay: "rgba(245, 240, 230, 0.94)",
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
