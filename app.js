import { renderHome, renderChat, renderAbout } from "./views.js";
import { store } from "./store.js";
import { initTheme, toggleTheme, getTheme } from "./theme.js";

const appMain = document.getElementById("app-main");
const themeToggle = document.getElementById("theme-toggle");

initTheme();

function updateThemeButton() {
  if (!themeToggle) return;
  const theme = getTheme();
  themeToggle.setAttribute("aria-label", theme === "dark" ? "Cambiar a modo claro" : "Cambiar a modo oscuro");
  themeToggle.classList.toggle("active", theme === "dark");
}

store.subscribe((state) => {
  updateThemeButton();
});

if (themeToggle) {
  themeToggle.addEventListener("click", () => {
    const newTheme = toggleTheme();
    store.setState({ theme: newTheme });
  });
}

function handleClick(e) {
  const button = e.target.closest(".btn-chat-3d");
  if (!button) return;

  const id = button.getAttribute("data-id");
  if (id) {
    window.history.pushState({}, "", `/chat?id=${id}`);
    renderChat(id);
  }
}

function normalizePath(path) {
  return path.length > 1 ? path.replace(/\/$/, "") : path;
}

function handleRoute() {
  const params = new URLSearchParams(window.location.search);
  const characterId = params.get("id");
  let path = window.location.pathname;
  const normalized = normalizePath(path);

  if (path !== normalized) {
    window.history.replaceState({}, "", normalized + window.location.search);
    path = normalized;
  }

  if (path === "/about") {
    renderAbout();
  } else if (characterId) {
    renderChat(characterId);
  } else {
    renderHome();
  }
}

appMain.addEventListener("click", handleClick);
window.addEventListener("popstate", handleRoute);

updateThemeButton();
handleRoute();
