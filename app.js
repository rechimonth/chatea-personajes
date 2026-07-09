import { renderHome, renderChat, renderAbout, renderNotFound } from "./views.js";
import { store } from "./store.js";
import { initTheme, toggleTheme, getTheme } from "./theme.js";
import { Router } from "./router.js";

const appMain = document.getElementById("app-main");
const themeToggle = document.getElementById("theme-toggle");

async function detectAssetRoot() {
  const candidates = ["/img", "/public/img"];
  for (const base of candidates) {
    try {
      const response = await fetch(`${base}/background-light.png`, { method: "HEAD" });
      if (response.ok) return base;
    } catch {
      // ignore and try next candidate
    }
  }
  return "/img";
}

const assetRoot = await detectAssetRoot();
const normalizedAssetRoot = assetRoot.replace(/\/$/, "");
window.ASSET_ROOT = normalizedAssetRoot;

const root = document.documentElement;
root.style.setProperty("--asset-root", normalizedAssetRoot);
root.style.setProperty("--background-light-url", `url('${normalizedAssetRoot}/background-light.png')`);
root.style.setProperty("--background-dark-url", `url('${normalizedAssetRoot}/background-mystical.png')`);

initTheme();

function updateThemeButton() {
  if (!themeToggle) return;
  const theme = getTheme();
  themeToggle.setAttribute("aria-label", theme === "dark" ? "Cambiar a modo claro" : "Cambiar a modo oscuro");
  themeToggle.classList.toggle("active", theme === "dark");
}

store.subscribe(() => {
  updateThemeButton();
});

if (themeToggle) {
  themeToggle.addEventListener("click", () => {
    const newTheme = toggleTheme();
    store.setState({ theme: newTheme });
  });
}

function normalizePath(path) {
  const sanitized = path || "/";
  return sanitized.length > 1 ? sanitized.replace(/\/$/, "") : sanitized;
}

const router = new Router();

router.addRoute("/", () => {
  document.title = "Chatea con tu personaje favorito";
  renderHome(assetRoot);
});

router.addRoute("/about", () => {
  document.title = "Acerca de Chatea Personajes";
  renderAbout();
});

router.addRoute("/chat", ({ id }) => {
  if (id) {
    document.title = "Chat";
    renderChat(id, assetRoot);
  } else {
    document.title = "Chatea con tu personaje favorito";
    renderHome(assetRoot);
  }
});

router.addRoute("/404", () => {
  document.title = "404 - No encontrado";
  renderNotFound();
});

function handleChatClick(e) {
  const button = e.target.closest(".btn-chat-3d");
  if (!button) return;

  const id = button.getAttribute("data-id");
  if (id) {
    router.navigate(`/chat?id=${id}`);
  }
}

function handleDataLinkClick(e) {
  const link = e.target.closest("a[data-link]");
  if (!link) return;

  const href = link.getAttribute("href");
  if (!href || /^(https?:|mailto:|#)/i.test(href)) return;

  e.preventDefault();
  router.navigate(href);
}

window.router = router;

appMain.addEventListener("click", handleChatClick);
appMain.addEventListener("click", handleDataLinkClick);
document.addEventListener("click", handleDataLinkClick);

updateThemeButton();
router.init();
