import { CHARACTERS } from "./characters.js";
import { store } from "./store.js";

const listeners = new Set();

function escapeHTML(str = "") {
  const div = document.createElement("div");
  div.textContent = str;
  return div.innerHTML;
}

function getApp() {
  const el = document.getElementById("app-main");
  if (!el) throw new Error("#app-main not found");
  return el;
}

function tagsHTML(tags = []) {
  return tags.map(tag => `<span class="tag">${escapeHTML(tag)}</span>`).join("");
}

function cardHTML(character) {
  const gradient = `linear-gradient(135deg, ${character.primaryColor}, ${character.secondaryColor})`;
  const assetPrefix = getAssetPrefix();

  return `
    <article class="character-card" style="--primary: ${character.primaryColor}; --secondary: ${character.secondaryColor}">
      <div class="card-avatar" style="background: ${gradient}">
        <img src="${assetPrefix}/${character.avatar}" alt="${escapeHTML(character.name)}" loading="lazy" />
      </div>
      <div class="card-body">
        <div class="card-title-row">
          <h2>${escapeHTML(character.name)}</h2>
          <span class="card-tier">${escapeHTML(character.tier)}</span>
        </div>
        <span class="card-category">${escapeHTML(character.category)}</span>
        <p class="card-description">${escapeHTML(character.description)}</p>
        <div class="card-tags">
          ${tagsHTML(character.tags)}
        </div>
      </div>
      <div class="card-footer">
        <button class="btn-chat" data-id="${character.id}" aria-label="Chatear con ${escapeHTML(character.name)}">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
          </svg>
          Chatear
        </button>
      </div>
    </article>
  `;
}

function getAssetPrefix(assetRoot = window.ASSET_ROOT || "/img") {
  return assetRoot.replace(/\/?$/, "");
}

function setHomeHeaderVisible(visible) {
  const header = document.querySelector(".home-header");
  if (!header) return;
  header.style.display = visible ? "" : "none";
}

export function renderHome(assetRoot = window.ASSET_ROOT || "/img") {
  const app = getApp();
  setHomeHeaderVisible(true);
  const assetPrefix = getAssetPrefix(assetRoot);
  
  app.innerHTML = `
    <div class="home-header">
      <h1 class="home-title">Chatea con tu Personaje Favorito</h1>
      <p class="home-subtitle">Explora mundos literarios clásicos y mantén conversaciones naturales con personajes icónicos impulsados por inteligencia artificial</p>
    </div>
    <div class="banner-container">
      <div class="carousel-viewport">
        <div class="carousel-track" id="carousel-track">
          ${CHARACTERS.map((char, index) => {
            const imageSrc = `${assetPrefix}/${char.avatar}`;
            return `
            <div class="card-3d" data-id="${char.id}">
              <img src="${imageSrc}" alt="${escapeHTML(char.name)}" class="card-image" loading="lazy" />
              <div class="card-overlay">
                <div class="card-overlay-content">
                  <h3 class="card-name">${escapeHTML(char.name)}</h3>
                  <button class="btn-chat-3d" data-id="${char.id}" aria-label="Chatear con ${escapeHTML(char.name)}">CHATEAR</button>
                </div>
              </div>
            </div>
          `;
          }).join("")}
        </div>
        <button class="carousel-nav prev" id="carousel-prev" aria-label="Anterior">
          &larr;
        </button>
        <button class="carousel-nav next" id="carousel-next" aria-label="Siguiente">
          &rarr;
        </button>
        <div class="pagination" id="pagination">
          ${CHARACTERS.map((_, i) => `<div class="pagination-dot ${i === 0 ? 'active' : ''}" data-index="${i}"></div>`).join("")}
        </div>
      </div>
    </div>
  `;

  const track = document.getElementById("carousel-track");
  const viewport = document.querySelector(".carousel-viewport");
  const cards = document.querySelectorAll(".card-3d");
  const dots = document.querySelectorAll(".pagination-dot");
  const prevBtn = document.getElementById("carousel-prev");
  const nextBtn = document.getElementById("carousel-next");
  
  let activeIndex = 0;

  function updateCarousel({ smooth = true } = {}) {
    cards.forEach((card, i) => {
      card.classList.toggle("active", i === activeIndex);
    });
    dots.forEach((dot, i) => {
      dot.classList.toggle("active", i === activeIndex);
    });
    const activeCard = cards[activeIndex];
    if (activeCard) {
      let scrolled = false;
      if (viewport) {
        try {
          if (typeof activeCard.scrollIntoView === "function") {
            activeCard.scrollIntoView({ behavior: smooth ? "smooth" : "auto", inline: "center", block: "nearest" });
            scrolled = true;
          }
        } catch {
          scrolled = false;
        }

        if (!scrolled) {
          const cardRect = activeCard.getBoundingClientRect();
          const viewportRect = viewport.getBoundingClientRect();
          const offset = cardRect.left - viewportRect.left - (viewportRect.width - cardRect.width) / 2;
          viewport.scrollLeft += smooth ? offset : Math.round(offset);
        }
      }
    }
  }

  function initCarousel() {
    if (viewport) {
      viewport.scrollLeft = 0;
    }
    window.requestAnimationFrame(() => updateCarousel({ smooth: false }));
  }

  if (prevBtn) {
    prevBtn.addEventListener("click", () => {
      activeIndex = (activeIndex - 1 + CHARACTERS.length) % CHARACTERS.length;
      updateCarousel();
    });

    prevBtn.addEventListener("keydown", (e) => {
      if (e.key === "ArrowLeft" || e.key === "ArrowUp") {
        e.preventDefault();
        activeIndex = (activeIndex - 1 + CHARACTERS.length) % CHARACTERS.length;
        updateCarousel();
      }
    });
  }

  if (nextBtn) {
    nextBtn.addEventListener("click", () => {
      activeIndex = (activeIndex + 1) % CHARACTERS.length;
      updateCarousel();
    });

    nextBtn.addEventListener("keydown", (e) => {
      if (e.key === "ArrowRight" || e.key === "ArrowDown") {
        e.preventDefault();
        activeIndex = (activeIndex + 1) % CHARACTERS.length;
        updateCarousel();
      }
    });
  }

  dots.forEach((dot) => {
    dot.addEventListener("click", () => {
      activeIndex = parseInt(dot.dataset.index);
      updateCarousel();
    });
  });

  initCarousel();

  /* Search functionality */
  const searchForm = document.querySelector('.search-form');
  const searchInput = document.querySelector('.search-input');
  const searchBtn = searchForm?.querySelector('button[type="submit"], button');

  const LOCAL_CHARACTERS = [
    { id: 'dracula', name: 'Drácula' },
    { id: 'frankenstein', name: 'Criatura' },
    { id: 'sherlock-holmes', name: 'Sherlock' },
    { id: 'alice-wonderland', name: 'Alicia' },
  ];

  function normalizeText(str = '') {
    return str
      .trim()
      .toLowerCase()
      .normalize('NFD')
      .replace(/\p{Diacritic}/gu, '');
  }

  function levenshtein(a = '', b = '') {
    // Distancia simple para tolerar errores leves.
    if (a === b) return 0;
    if (!a.length) return b.length;
    if (!b.length) return a.length;

    const matrix = Array.from({ length: a.length + 1 }, () => new Array(b.length + 1).fill(0));
    for (let i = 0; i <= a.length; i++) matrix[i][0] = i;
    for (let j = 0; j <= b.length; j++) matrix[0][j] = j;

    for (let i = 1; i <= a.length; i++) {
      for (let j = 1; j <= b.length; j++) {
        const cost = a[i - 1] === b[j - 1] ? 0 : 1;
        matrix[i][j] = Math.min(
          matrix[i - 1][j] + 1,
          matrix[i][j - 1] + 1,
          matrix[i - 1][j - 1] + cost
        );
      }
    }

    return matrix[a.length][b.length];
  }

  function getMatchingCharacters(queryRaw = '') {
    const query = normalizeText(queryRaw);
    if (!query) return [];

    // Coincidencia flexible: incluye o distancia pequeña.
    const scored = LOCAL_CHARACTERS.map((c) => {
      const nameN = normalizeText(c.name);
      const includes = nameN.includes(query) || query.includes(nameN);
      const distance = levenshtein(query, nameN);

      // Heurística: si incluye -> mejor score.
      const score = includes ? -100 : distance;
      return { ...c, score, distance };
    });

    scored.sort((x, y) => x.score - y.score);

    // Filtrado: distancia permitida según longitud.
    return scored.filter((c) => {
      const nameN = normalizeText(c.name);
      const maxDist = Math.max(1, Math.floor(Math.min(query.length, nameN.length) / 3));
      const includes = normalizeText(c.name).includes(normalizeText(queryRaw)) || normalizeText(queryRaw).includes(normalizeText(c.name));
      return includes || c.distance <= maxDist;
    });
  }

  function removeSuggestions() {
    const existing = document.getElementById('search-suggestions');
    if (existing) existing.remove();
  }

  function showTooltip(message) {
    removeTooltip();

    const tooltip = document.createElement('div');
    tooltip.id = 'search-error-tooltip';
    tooltip.className = 'search-error-tooltip';
    tooltip.textContent = message;

    const target = searchBtn || searchInput;
    const rect = target?.getBoundingClientRect();

    if (rect) {
      tooltip.style.position = 'fixed';
      tooltip.style.left = `${rect.left + rect.width / 2}px`;
      tooltip.style.top = `${rect.top - 10}px`;
      tooltip.style.transform = 'translate(-50%, -100%)';
    }

    document.body.appendChild(tooltip);
    window.setTimeout(() => removeTooltip(), 3000);
  }

  function removeTooltip() {
    const t = document.getElementById('search-error-tooltip');
    if (t) t.remove();
  }

  function renderSuggestions(list) {
    removeSuggestions();
    if (!list.length) return;

    const wrapper = document.createElement('div');
    wrapper.id = 'search-suggestions';
    wrapper.className = 'search-suggestions';

    // Contenedor anclado al input (no al body) para que sea estable.
    const inputRect = searchInput?.getBoundingClientRect();
    if (inputRect) {
      wrapper.style.position = 'fixed';
      wrapper.style.left = `${inputRect.left}px`;
      wrapper.style.top = `${inputRect.bottom + 6}px`;
      wrapper.style.width = `${inputRect.width}px`;
      wrapper.style.zIndex = '1000';
    }

    list.slice(0, 6).forEach((c) => {
      const item = document.createElement('button');
      item.type = 'button';
      item.className = 'search-suggestion-item';
      item.textContent = c.name;
      item.addEventListener('click', () => {
        searchInput.value = c.name;
        removeSuggestions();
      });
      wrapper.appendChild(item);
    });

    document.body.appendChild(wrapper);
  }

  function clearCardFilter() {
    const cards = document.querySelectorAll('.card-3d');
    cards.forEach((card) => {
      card.style.display = '';
    });
    const existing = document.querySelector('.no-results');
    if (existing) existing.remove();
  }

  function filterCardsByQuery(queryRaw) {
    const query = normalizeText(queryRaw);
    const cards = document.querySelectorAll('.card-3d');
    if (!query) return clearCardFilter();

    let visibleCount = 0;
    cards.forEach((card, index) => {
      const char = CHARACTERS[index];
      if (!char) return;

      const haystack = normalizeText(char.name + ' ' + char.category + ' ' + char.description + ' ' + char.tags.join(' '));
      const match = haystack.includes(query);

      card.style.display = match ? '' : 'none';
      if (match) visibleCount++;
    });

    const existing = document.querySelector('.no-results');
    if (existing) existing.remove();

    if (visibleCount === 0) {
      const noResults = document.createElement('div');
      noResults.className = 'no-results';
      noResults.textContent = 'No se encontraron personajes.';
      const track = document.getElementById('carousel-track');
      if (track) track.insertAdjacentElement('afterend', noResults);
    }
  }

  let searchOutsideHandler = null;

  if (searchForm && searchInput) {
    if (searchOutsideHandler) {
      document.removeEventListener('click', searchOutsideHandler);
    }

    searchInput.addEventListener('input', () => {
      const q = searchInput.value;
      const matches = getMatchingCharacters(q);

      if (normalizeText(q).length) {
        renderSuggestions(matches);
        const el = document.getElementById('search-suggestions');
        if (el) el.classList.add('show');
      } else {
        removeSuggestions();
      }

      filterCardsByQuery(q);
    });


    searchOutsideHandler = (e) => {
      const t = e.target;
      if (!t) return;
      const isInside = t.closest('#search-suggestions') || t.closest('.search-form');
      if (!isInside) removeSuggestions();
    };

    document.addEventListener('click', searchOutsideHandler);

    searchForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const raw = searchInput.value.trim();
      const matches = getMatchingCharacters(raw);

      if (!raw) {
        clearCardFilter();
        return;
      }

      if (matches.length) {
        const charId = matches[0].id;
        if (charId) {
          window.history.pushState({}, '', `/chat?id=${charId}`);
          window.dispatchEvent(new PopStateEvent('popstate'));
        } else {
          clearCardFilter();
        }
        removeTooltip();
        removeSuggestions();
        return;
      }

      showTooltip('El personaje no existe');
    });
  }


  document.querySelectorAll(".btn-chat-3d").forEach((btn) => {
    btn.addEventListener("click", (e) => {
      const id = e.target.dataset.id;
      if (id) {
        window.history.pushState({}, "", `/chat?id=${id}`);
        window.dispatchEvent(new PopStateEvent("popstate"));
      }
    });
  });
}

function scrollToBottom(element) {
  if (!element) return;
  requestAnimationFrame(() => {
    element.scrollTop = element.scrollHeight;
  });
}

function renderMessageBubble(message, character, isUser = false) {
  const time = new Date(message.timestamp).toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  });
  const assetPrefix = getAssetPrefix();

  const avatarHTML = isUser
    ? `<div class="bubble-avatar bubble-avatar-user">Tú</div>`
    : `<div class="bubble-avatar" style="background: linear-gradient(135deg, ${character.primaryColor}, ${character.secondaryColor})">
        <img src="${assetPrefix}/${character.avatar}" alt="${escapeHTML(character.name)}" />
       </div>`;

  const nameHTML = isUser
    ? `<span class="bubble-name">Tú</span>`
    : `<span class="bubble-name" style="color: ${character.primaryColor}">${escapeHTML(character.name)}</span>`;

  const copyButton = !isUser
    ? `<button class="copy-btn" data-text="${escapeHTML(message.text)}" title="Copiar respuesta" aria-label="Copiar respuesta">
        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="14" height="14" x="8" y="8" rx="2" ry="2"/><path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"/></svg>
       </button>`
    : "";

  return `
    <div class="chat-bubble ${isUser ? "chat-bubble-user" : "chat-bubble-character"}" role="region" aria-label="${isUser ? "Tu mensaje" : escapeHTML(character.name)}">
      ${avatarHTML}
      <div class="bubble-content">
        <div class="bubble-header">
          ${nameHTML}
          <span class="bubble-time">${time}</span>
        </div>
        <p class="bubble-text">${escapeHTML(message.text)}</p>
        <div class="bubble-actions">
          ${copyButton}
        </div>
      </div>
    </div>
  `;
}

function renderTypingIndicator(character) {
  const assetPrefix = getAssetPrefix();

  return `
    <div class="chat-bubble chat-bubble-character typing-indicator" id="typing-indicator" role="status" aria-label="${escapeHTML(character.name)} está escribiendo...">
      <div class="bubble-avatar" style="background: linear-gradient(135deg, ${character.primaryColor}, ${character.secondaryColor})">
        <img src="${assetPrefix}/${character.avatar}" alt="${escapeHTML(character.name)}" />
      </div>
      <div class="bubble-content">
        <span class="bubble-name" style="color: ${character.primaryColor}">${escapeHTML(character.name)}</span>
        <div class="typing-dots">
          <span></span><span></span><span></span>
        </div>
      </div>
    </div>
  `;
}

function renderChat(characterId, assetRoot = window.ASSET_ROOT || "/img") {
  setHomeHeaderVisible(false);
  const assetPrefix = getAssetPrefix(assetRoot);
  const character = CHARACTERS.find((c) => c.id === characterId);
  if (!character) return;

  const gradient = `linear-gradient(135deg, ${character.primaryColor}, ${character.secondaryColor})`;

  const history = store.getState().messages || [];
  const welcomeMessage = {
    role: "character",
    text: character.greeting,
    timestamp: Date.now(),
  };

  let messagesHTML = "";

  if (history.length === 0) {
    messagesHTML = renderMessageBubble(welcomeMessage, character, false);
  } else {
    const allMessages = [welcomeMessage, ...history];
    messagesHTML = allMessages
      .map((msg) => renderMessageBubble(msg, character, msg.role === "user"))
      .join("");
  }

getApp().innerHTML = `
    <div class="chat-view">
      <div class="chat-view-header">
        <a href="/" class="back-link" data-link>
          <span class="back-icon">&lt;</span>
          Volver
        </a>
        <button class="clear-history-btn" id="clear-history-btn" aria-label="Borrar historial">
          Borrar historial
        </button>
      </div>

      <div class="chat-header">
        <div class="chat-avatar" style="background: ${gradient}">
          <img src="${assetPrefix}/${character.avatar}" alt="${escapeHTML(character.name)}" />
        </div>
        <div class="chat-header-info">
          <h1 class="chat-character-name">${escapeHTML(character.name)}</h1>
          <span class="chat-character-meta">${escapeHTML(character.category)} · ${escapeHTML(character.tier)}</span>
        </div>
      </div>

      <div class="chat-description">
        <p>${escapeHTML(character.description)}</p>
      </div>

      <div class="chat-messages" id="chat-messages">
        ${messagesHTML}
        <div id="messages-container"></div>
      </div>

      <form id="chat-form" class="chat-form" autocomplete="off">
        <div class="chat-input-wrapper">
          <input
            type="text"
            id="chat-input"
            placeholder="Escribe un mensaje..."
            class="chat-input"
          />
          <button type="submit" class="chat-send-btn" style="background: ${gradient}" aria-label="Enviar mensaje">
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="22" x2="11" y1="2" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>
          </button>
        </div>
      </form>
    </div>
  `;

  const messagesContainer = document.getElementById("messages-container");
  const chatMessages = document.getElementById("chat-messages");
  const chatForm = document.getElementById("chat-form");
  const chatInput = document.getElementById("chat-input");

  if (chatMessages && history.length > 0) {
    messagesContainer.innerHTML = history
      .map((msg) => renderMessageBubble(msg, character, msg.role === "user"))
      .join("");
    scrollToBottom(chatMessages);
  }

  if (!chatForm) return;

  chatForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    const text = chatInput.value.trim();
    if (!text) return;

    chatInput.value = "";
    chatInput.disabled = true;

    const userMessage = {
      role: "user",
      text,
      timestamp: Date.now(),
    };

    const updatedMessages = [...(store.getState().messages || []), userMessage];

    store.setState({
      characterId,
      messages: updatedMessages,
      route: "/chat",
    });

    if (messagesContainer) {
      messagesContainer.insertAdjacentHTML(
        "beforeend",
        renderMessageBubble(userMessage, character, true)
      );
    }
    scrollToBottom(chatMessages);

    const typingHtml = renderTypingIndicator(character);
    if (messagesContainer) {
      messagesContainer.insertAdjacentHTML("beforeend", typingHtml);
    }
    const typingIndicator = document.getElementById("typing-indicator");
    scrollToBottom(chatMessages);

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
body: JSON.stringify({
           messages: updatedMessages,
           characterId,
         }),
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const data = await response.json();

      if (typingIndicator) {
        typingIndicator.remove();
      }

      const botMessage = {
        role: "character",
        text: data.text || "Lo siento, no pude procesar tu solicitud.",
        timestamp: Date.now(),
      };

      const finalMessages = [...updatedMessages, botMessage];

      store.setState({
        characterId,
        messages: finalMessages,
        route: "/chat",
      });

      if (messagesContainer) {
        messagesContainer.insertAdjacentHTML(
          "beforeend",
          renderMessageBubble(botMessage, character, false)
        );
      }
      scrollToBottom(chatMessages);
    } catch (error) {
      console.error("[renderChat] Error calling /api/chat:", error);

      if (typingIndicator) {
        typingIndicator.remove();
      }

      const errorMessage = {
        role: "character",
        text: "Lo siento, hubo un error de conexión. Por favor, intenta de nuevo más tarde.",
        timestamp: Date.now(),
      };

      const finalMessages = [...updatedMessages, errorMessage];

      store.setState({
        characterId,
        messages: finalMessages,
        route: "/chat",
      });

      if (messagesContainer) {
        messagesContainer.insertAdjacentHTML(
          "beforeend",
          renderMessageBubble(errorMessage, character, false)
        );
      }
      scrollToBottom(chatMessages);
    } finally {
      chatInput.disabled = false;
      chatInput.focus();
    }
  });

  if (chatInput) {
    chatInput.focus();
  }

  if (chatMessages) {
    chatMessages.addEventListener("click", (e) => {
      const copyBtn = e.target.closest(".copy-btn");
      if (copyBtn) {
        const text = copyBtn.getAttribute("data-text");
        if (text) {
          navigator.clipboard.writeText(text);
          copyBtn.classList.add("copied");
          setTimeout(() => copyBtn.classList.remove("copied"), 1500);
        }
        return;
      }
    });
  }

  const clearHistoryBtn = document.getElementById("clear-history-btn");
  if (clearHistoryBtn) {
    clearHistoryBtn.addEventListener("click", () => {
      if (confirm("¿Borrar todo el historial de conversación?")) {
        store.clearHistory(characterId);
        renderChat(characterId);
      }
    });
  }
}

export { renderChat, renderAbout, renderNotFound };

function renderNotFound() {
  const app = getApp();
  app.innerHTML = `
    <div class="not-found-view">
      <h1>404</h1>
      <p>Página no encontrada</p>
      <a href="/" class="back-link" data-link>
        <span class="back-icon">&lt;</span>
        Volver al inicio
      </a>
    </div>
  `;
}

function renderAbout() {
  setHomeHeaderVisible(false);
  const app = getApp();
  app.innerHTML = `
    <div class="about-view">
      <a href="/" class="back-link" data-link>
        <span class="back-icon">&lt;</span>
        Volver
      </a>
      <div class="about-content">
        <h1>Acerca del Proyecto</h1>
        <p class="about-description">
          ChateaIA es una Single Page Application que permite conversar con personajes icónicos 
          usando inteligencia artificial de Google Gemini. El proyecto demuestra integración segura 
          de APIs con Vercel Serverless Functions.
        </p>
        <div class="tech-stack">
          <h2>Tecnologías</h2>
          <ul>
            <li>Vanilla JavaScript (ES Modules)</li>
            <li>Vite como bundler</li>
            <li>Vercel Serverless Functions</li>
            <li>CSS Variables &amp; Grid/Flexbox</li>
            <li>Vitest para testing</li>
          </ul>
        </div>
        <div class="characters-info">
          <h2>Personajes disponibles</h2>
          <p>Sherlock Holmes • Drácula • Alicia • La Criatura de Frankenstein</p>
        </div>
      </div>
    </div>
  `;
}
