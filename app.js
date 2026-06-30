import { renderHome, renderChat, renderAbout } from "./views.js";
import { store } from "./store.js";
import { initTheme, toggleTheme, getTheme } from "./theme.js";

const appMain = document.getElementById("app-main");
const themeToggle = document.getElementById("theme-toggle");
const searchInput = document.querySelector(".search-input");

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

if (searchInput) {
  searchInput.addEventListener("input", (e) => {
    const query = e.target.value.toLowerCase();
    const cards = document.querySelectorAll(".card-3d");
    cards.forEach((card) => {
      const name = card.querySelector(".card-name")?.textContent.toLowerCase() || "";
      const category = card.querySelector(".card-category-label")?.textContent.toLowerCase() || "";
      const match = name.includes(query) || category.includes(query);
      card.closest(".item").style.opacity = match ? "1" : "0.4";
      card.closest(".item").style.filter = match ? "brightness(1)" : "brightness(0.5)";
    });
  });
}

function handleClick(e) {
  const button = e.target.closest(".btn-chat");
  if (!button) return;

  const id = button.getAttribute("data-id");
  if (id) {
    window.history.pushState({}, "", `/chat?id=${id}`);
    renderChat(id);
  }
}

function handleRoute() {
  const params = new URLSearchParams(window.location.search);
  const characterId = params.get("id");
  const path = window.location.pathname;

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
