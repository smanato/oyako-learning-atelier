const content = window.AI_EDU_LAB_CONTENT || {};
const prompts = content.prompts || {};
const promptTitle = document.querySelector("[data-prompt-title]");
const promptBody = document.querySelector("[data-prompt-body]");
const toast = document.querySelector(".toast[data-toast]");
let activePrompt = content.defaultPrompt || Object.keys(prompts)[0] || "";
let toastTimer;

function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function setPrompt(key) {
  const fallbackKey = content.defaultPrompt || Object.keys(prompts)[0];
  const prompt = prompts[key] || prompts[fallbackKey];
  if (!prompt) {
    return;
  }
  activePrompt = prompts[key] ? key : fallbackKey;
  if (promptTitle) {
    promptTitle.textContent = prompt.title;
  }
  if (promptBody) {
    promptBody.textContent = prompt.body;
  }
}

function showToast(message) {
  if (!toast) {
    return;
  }
  toast.textContent = message;
  toast.classList.add("is-visible");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toast.classList.remove("is-visible"), 2200);
}

function renderPromptCards() {
  const container = document.querySelector("[data-content-prompt-cards]");
  if (!container || !Array.isArray(content.promptCards) || !content.promptCards.length) {
    return;
  }
  container.innerHTML = content.promptCards
    .map(
      (item) => `
        <button type="button" data-category="${escapeHtml(item.category || "study")}" data-open-prompt="${escapeHtml(item.key)}">
          ${escapeHtml(item.label || prompts[item.key]?.title || item.key)}
        </button>
      `
    )
    .join("");
}

function renderModules() {
  const container = document.querySelector("[data-content-modules]");
  if (!container || !Array.isArray(content.modules) || !content.modules.length) {
    return;
  }
  container.innerHTML = content.modules
    .map(
      (item) => `
        <article class="module-card ${item.featured ? "module-card--wide" : ""}" data-tags="${escapeHtml(item.tags)}">
          <figure>
            <img src="${escapeHtml(item.image)}" alt="${escapeHtml(item.alt || item.title)}">
          </figure>
          <div class="module-card__body">
            <span>${escapeHtml(item.badge)}</span>
            <h3>${escapeHtml(item.title)}</h3>
            <p>${escapeHtml(item.description)}</p>
            ${
              item.promptKey
                ? `<button type="button" data-open-prompt="${escapeHtml(item.promptKey)}">${escapeHtml(item.buttonLabel || "プロンプトを開く")}</button>`
                : ""
            }
          </div>
        </article>
      `
    )
    .join("");
}

function renderRescueItems() {
  const container = document.querySelector("[data-content-rescue]");
  if (!container || !Array.isArray(content.rescueItems) || !content.rescueItems.length) {
    return;
  }
  container.innerHTML = content.rescueItems
    .map(
      (item) => `
        <article class="rescue-card ${item.dark ? "rescue-card--dark" : ""}" data-tags="${escapeHtml(item.tags)}">
          <img src="${escapeHtml(item.image)}" alt="${escapeHtml(item.alt || item.title)}">
          <span>${escapeHtml(item.badge)}</span>
          <h3>${escapeHtml(item.title)}</h3>
          <p>${escapeHtml(item.description)}</p>
          ${
            item.promptKey
              ? `<button type="button" data-open-prompt="${escapeHtml(item.promptKey)}">${escapeHtml(item.buttonLabel || "開く")}</button>`
              : ""
          }
        </article>
      `
    )
    .join("");
}

function renderTools() {
  const container = document.querySelector("[data-content-tools]");
  if (!container || !Array.isArray(content.tools) || !content.tools.length) {
    return;
  }
  container.innerHTML = content.tools
    .map(
      (item) => `
        <article class="tool-card" data-tags="${escapeHtml(item.tags)}">
          <b>${escapeHtml(item.title)}</b>
          <span>${escapeHtml(item.description)}</span>
        </article>
      `
    )
    .join("");
}

function renderTimeline() {
  const container = document.querySelector("[data-content-timeline]");
  if (!container || !Array.isArray(content.timeline) || !content.timeline.length) {
    return;
  }
  container.innerHTML = content.timeline
    .map(
      (item) => `
        <li><time>${escapeHtml(item.date)}</time><span>${escapeHtml(item.title)}</span></li>
      `
    )
    .join("");
}

function renderContent() {
  renderPromptCards();
  renderModules();
  renderRescueItems();
  renderTools();
  renderTimeline();
}

function filterCards(value) {
  const query = value.trim().toLowerCase();
  document.querySelectorAll(".menu-card, .rescue-card, .module-card, .tool-card").forEach((card) => {
    const text = `${card.textContent} ${card.dataset.tags || ""}`.toLowerCase();
    card.classList.toggle("is-hidden", Boolean(query) && !text.includes(query));
  });
}

renderContent();

document.addEventListener("click", (event) => {
  const promptTrigger = event.target.closest("[data-open-prompt]");
  if (promptTrigger) {
    setPrompt(promptTrigger.dataset.openPrompt);
    document.querySelector("#prompts")?.scrollIntoView({ behavior: "smooth", block: "start" });
    return;
  }

  const toastTrigger = event.target.closest("[data-toast-message]");
  if (toastTrigger) {
    showToast(toastTrigger.dataset.toastMessage || "開きます");
  }
});

document.querySelector("[data-copy-prompt]")?.addEventListener("click", async () => {
  const text = prompts[activePrompt]?.body || "";
  if (!text) {
    showToast("コピーするプロンプトがありません");
    return;
  }

  try {
    await navigator.clipboard.writeText(text);
    showToast("プロンプトをコピーしました");
  } catch {
    const textarea = document.createElement("textarea");
    textarea.value = text;
    textarea.setAttribute("readonly", "");
    textarea.style.position = "fixed";
    textarea.style.opacity = "0";
    document.body.appendChild(textarea);
    textarea.select();
    const copied = document.execCommand("copy");
    textarea.remove();
    showToast(copied ? "プロンプトをコピーしました" : "コピーできない場合は本文を選択してください");
  }
});

document.querySelectorAll("[data-prompt-tab]").forEach((button) => {
  button.addEventListener("click", () => {
    const tab = button.dataset.promptTab;
    document.querySelectorAll("[data-prompt-tab]").forEach((item) => item.classList.toggle("is-active", item === button));
    document.querySelectorAll(".prompt-cards [data-category]").forEach((card) => {
      card.classList.toggle("is-hidden", tab !== "all" && card.dataset.category !== tab);
    });
  });
});

document.querySelector("[data-search]")?.addEventListener("input", (event) => {
  filterCards(event.target.value);
});

document.querySelector("[data-filter='all']")?.addEventListener("click", () => {
  const search = document.querySelector("[data-search]");
  if (search) {
    search.value = "";
  }
  filterCards("");
});

document.querySelectorAll(".side-nav a").forEach((link) => {
  link.addEventListener("click", () => {
    document.querySelectorAll(".side-nav a").forEach((item) => item.classList.toggle("is-active", item === link));
    document.querySelector(".sidebar")?.classList.remove("is-open");
  });
});

document.querySelector(".menu-button")?.addEventListener("click", () => {
  document.querySelector(".sidebar")?.classList.toggle("is-open");
});

document.addEventListener("click", (event) => {
  const sidebar = document.querySelector(".sidebar");
  const menu = document.querySelector(".menu-button");
  if (!sidebar?.classList.contains("is-open")) {
    return;
  }
  if (sidebar.contains(event.target) || menu?.contains(event.target)) {
    return;
  }
  sidebar.classList.remove("is-open");
});

const sections = Array.from(document.querySelectorAll("main [id]"));
const navLinks = Array.from(document.querySelectorAll(".side-nav a"));

if ("IntersectionObserver" in window) {
  const observer = new IntersectionObserver(
    (entries) => {
      const visible = entries
        .filter((entry) => entry.isIntersecting)
        .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
      if (!visible) {
        return;
      }
      navLinks.forEach((link) => {
        link.classList.toggle("is-active", link.getAttribute("href") === `#${visible.target.id}`);
      });
    },
    { rootMargin: "-20% 0px -68% 0px", threshold: [0.08, 0.22, 0.4] }
  );

  sections.forEach((section) => observer.observe(section));
}

setPrompt(activePrompt);
