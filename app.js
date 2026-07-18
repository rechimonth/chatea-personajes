import { renderHome, renderChat, renderAbout, renderNotFound, renderLogin, renderRegister, renderSuccess, renderCancel, renderAdmin } from "./views.js";
import { store } from "./store.js";
import { initTheme, toggleTheme, getTheme } from "./theme.js";
import { Router } from "./router.js";
import { startCheckout, startCheckoutMP } from "./service.js";

const appMain = document.getElementById("app-main");
const themeToggle = document.getElementById("theme-toggle");
const authLoginBtn = document.getElementById("auth-login");
const authLogoutBtn = document.getElementById("auth-logout");
const upgradeBtn = document.getElementById("upgrade-btn");

function detectAssetRootSync() {
  return "/img";
}

const normalizedAssetRoot = detectAssetRootSync().replace(/\/$/, "");
window.ASSET_ROOT = normalizedAssetRoot;

const root = document.documentElement;
root.style.setProperty("--asset-root", normalizedAssetRoot);
root.style.setProperty("--background-light-url", `url('${normalizedAssetRoot}/background-light.png')`);
root.style.setProperty("--background-dark-url", `url('${normalizedAssetRoot}/background-mystical.png')`);

initTheme();

const assetRoot = window.ASSET_ROOT || normalizedAssetRoot;

function updateThemeButton() {
  if (!themeToggle) return;
  const theme = getTheme();
  themeToggle.setAttribute("aria-label", theme === "dark" ? "Cambiar a modo claro" : "Cambiar a modo oscuro");
  themeToggle.classList.toggle("active", theme === "dark");
}

function updateAuthButtons() {
  const state = store.getState();
  const isLoggedIn = Boolean(state.token && state.user);
  const isPremium = Boolean(state.subscription && state.subscription.status === "active");

  if (authLoginBtn) {
    authLoginBtn.hidden = isLoggedIn;
  }

  if (authLogoutBtn) {
    authLogoutBtn.hidden = !isLoggedIn;
    authLogoutBtn.textContent = state.user ? `Cerrar sesion (${state.user.email})` : "Cerrar sesion";
  }

  if (upgradeBtn) {
    if (isPremium) {
      upgradeBtn.textContent = "Premium";
      upgradeBtn.disabled = true;
      upgradeBtn.classList.add("upgrade-btn--ghost");
    } else {
      upgradeBtn.textContent = "Upgrade a Premium";
      upgradeBtn.disabled = false;
      upgradeBtn.classList.remove("upgrade-btn--ghost");
    }
  }
}

store.subscribe(() => {
  updateThemeButton();
  updateAuthButtons();
});

if (themeToggle) {
  themeToggle.addEventListener("click", () => {
    const newTheme = toggleTheme();
    store.setState({ theme: newTheme });
  });
}

if (authLogoutBtn) {
  authLogoutBtn.addEventListener("click", async () => {
    try {
      await fetch("/api/auth/logout", { method: "POST" });
    } catch (error) {
      console.error("[app] Logout failed:", error);
    } finally {
      store.logout();
      router.navigate("/");
    }
  });
}

if (upgradeBtn) {
  upgradeBtn.addEventListener("click", async () => {
    try {
      const data = await startCheckout();
      if (data?.url) {
        window.location.href = data.url;
      }
    } catch (error) {
      console.error("[app] Stripe upgrade failed, trying MercadoPago:", error);
      
      try {
        const mpData = await startCheckoutMP();
        if (mpData?.url) {
          window.location.href = mpData.url;
        }
      } catch (mpError) {
        console.error("[app] MP upgrade failed:", mpError);
        alert("Error al iniciar el pago. Por favor, intenta más tarde.");
      }
    }
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

router.addRoute("/login", () => {
  document.title = "Iniciar sesion";
  renderLogin(assetRoot);
});

router.addRoute("/register", () => {
  document.title = "Crear cuenta";
  renderRegister(assetRoot);
});

router.addRoute("/success", () => {
  document.title = "Pago exitoso";
  renderSuccess();
});

router.addRoute("/cancel", () => {
  document.title = "Pago cancelado";
  renderCancel();
});

router.addRoute("/admin", () => {
  document.title = "Admin - Personajes";
  renderAdmin();
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
  if (href || /^(https?:|mailto:|#)/i.test(href)) return;

  e.preventDefault();
  router.navigate(href);
}

window.router = router;

appMain.addEventListener("click", handleChatClick);
appMain.addEventListener("click", handleDataLinkClick);
document.addEventListener("click", handleDataLinkClick);

updateThemeButton();

store.fetchAuthStatus();

router.init();
