import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHome, renderChat, renderAbout, renderNotFound } from "../views.js";

vi.mock("../characters.js", () => ({
  CHARACTERS: [
    {
      id: "sherlock-holmes",
      name: "Sherlock Holmes",
      category: "Detective",
      tier: "Legendario",
      avatar: "https://example.com/avatar.png",
      primaryColor: "#2d6a4f",
      secondaryColor: "#40916c",
      description: "Detective consultor.",
      greeting: "Hola, Watson.",
      tags: ["detective"],
      systemPrompt: "Eres Sherlock Holmes...",
    },
    {
      id: "dracula",
      name: "Drácula",
      category: "Terror",
      tier: "Épico",
      avatar: "https://example.com/dracula.png",
      primaryColor: "#6a040f",
      secondaryColor: "#9d0208",
      description: "Vampiro transilvano.",
      greeting: "Bienvenido.",
      tags: ["vampiro"],
      systemPrompt: "Eres Drácula...",
    },
  ],
}));

vi.mock("../store.js", () => {
  let state = {
    route: "/home",
    characterId: null,
    theme: "light",
    messages: [],
  };
  return {
    store: {
      getState: vi.fn(() => ({ ...state, messages: [...state.messages] })),
      setState: vi.fn((updates) => {
        Object.assign(state, updates);
      }),
      subscribe: vi.fn(() => () => {}),
      clearHistory: vi.fn(),
    },
  };
});

beforeEach(() => {
  document.body.innerHTML = '<main id="app-main"></main>';
  vi.clearAllMocks();
  Object.defineProperty(navigator, "clipboard", {
    value: { writeText: vi.fn(() => Promise.resolve()) },
    configurable: true,
  });
});

describe("views", () => {
  describe("renderHome", () => {
    it("should render the banner container", () => {
      renderHome();

      const app = document.getElementById("app-main");
      expect(app.innerHTML).toContain("banner-container");
      expect(app.innerHTML).toContain("carousel-viewport");
    });

    it("should render all characters from CHARACTERS", () => {
      renderHome();

      const app = document.getElementById("app-main");
      expect(app.innerHTML).toContain("Sherlock Holmes");
      expect(app.innerHTML).toContain("Drácula");
    });

it("should render character cards with button", () => {
       renderHome();

       const app = document.getElementById("app-main");
       expect(app.querySelector(".card-3d")).not.toBeNull();
       expect(app.querySelectorAll(".btn-chat-3d").length).toBe(2);
       expect(app.querySelector(".btn-chat-3d").getAttribute("data-id")).toBe("sherlock-holmes");
     });
  });

  describe("renderChat", () => {
    it("should render chat interface for valid character", () => {
      renderChat("sherlock-holmes");

      const app = document.getElementById("app-main");
      expect(app.innerHTML).toContain("Sherlock Holmes");
      expect(app.innerHTML).toContain("chat-messages");
      expect(app.querySelector("#chat-form")).not.toBeNull();
    });

    it("should show greeting when no history", () => {
      renderChat("sherlock-holmes");

      const app = document.getElementById("app-main");
      const messagesContainer = document.getElementById("chat-messages");
      expect(messagesContainer.innerHTML).toContain("Hola, Watson.");
      expect(messagesContainer.innerHTML).toContain("Sherlock Holmes");
    });

    it("should submit message and call /api/chat", async () => {
      const mockFetch = vi.fn(() =>
        Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ text: "Respuesta simulada" }),
        })
      );
      global.fetch = mockFetch;

      renderChat("sherlock-holmes");

      const form = document.getElementById("chat-form");
      const input = document.getElementById("chat-input");
      input.value = "Mensaje de prueba";

      await form.dispatchEvent(new Event("submit", { bubbles: true, cancelable: true }));

      expect(input.value).toBe("");
      expect(mockFetch).toHaveBeenCalledWith(
        "/api/chat",
        expect.objectContaining({
          method: "POST",
          headers: { "Content-Type": "application/json" },
        })
      );

      const body = JSON.parse(mockFetch.mock.calls[0][1].body);
      expect(body.messages).toHaveLength(1);
      expect(body.messages[0].text).toBe("Mensaje de prueba");
    });

    it("should copy message text to clipboard when copy button is clicked", async () => {
      const mockWriteText = vi.fn(() => Promise.resolve());
      Object.defineProperty(navigator, "clipboard", {
        value: { writeText: mockWriteText },
        configurable: true,
      });

      renderChat("sherlock-holmes");

      const copyBtn = document.querySelector(".copy-btn");
      expect(copyBtn).not.toBeNull();

      copyBtn.click();

      expect(mockWriteText).toHaveBeenCalled();
    });
  });

  describe("renderAbout", () => {
    it("should render about view", () => {
      renderAbout();

      const app = document.getElementById("app-main");
      expect(app.innerHTML).toContain("Acerca del Proyecto");
      expect(app.innerHTML).toContain("Tecnologías");
      expect(app.innerHTML).toContain("Personajes disponibles");
    });

    it("should have back link to home", () => {
      renderAbout();

      const app = document.getElementById("app-main");
      expect(app.innerHTML).toContain("back-link");
    });
  });

  describe("renderNotFound", () => {
    it("should render not found view with message and back link", () => {
      renderNotFound();

      const app = document.getElementById("app-main");
      expect(app.innerHTML).toContain("404");
      expect(app.innerHTML).toContain("Página no encontrada");
      expect(app.innerHTML).toContain("Volver al inicio");
      expect(app.innerHTML).toContain("not-found-view");
    });
  });
});