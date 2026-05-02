const content = window.AI_EDU_LAB_CONTENT || {};
const prompts = content.prompts || {};
const promptTitle = document.querySelector("[data-prompt-title]");
const promptBody = document.querySelector("[data-prompt-body]");
const toast = document.querySelector(".toast[data-toast]");
const requestedPrompt = new URLSearchParams(window.location.search).get("prompt");
let activePrompt =
  requestedPrompt && prompts[requestedPrompt] ? requestedPrompt : content.defaultPrompt || Object.keys(prompts)[0] || "";
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
  document.querySelectorAll("[data-open-prompt]").forEach((trigger) => {
    trigger.classList.toggle("is-selected", trigger.dataset.openPrompt === activePrompt);
  });
}

function openPrompt(key) {
  if (promptTitle && promptBody) {
    setPrompt(key);
    document.querySelector("#prompts")?.scrollIntoView({ behavior: "smooth", block: "start" });
    if (prompts[key]) {
      const url = new URL(window.location.href);
      url.searchParams.set("prompt", key);
      window.history.replaceState(null, "", url);
    }
    return;
  }

  const target = new URL("./prompts.html", window.location.href);
  target.searchParams.set("prompt", key);
  window.location.href = target.href;
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

function renderQuestionSolutions() {
  const container = document.querySelector("[data-content-question-solutions]");
  if (!container || !Array.isArray(content.questionSolutions) || !content.questionSolutions.length) {
    return;
  }
  const renderMiniList = (title, items) => {
    if (!Array.isArray(items) || !items.length) {
      return "";
    }
    return `
      <section>
        <b>${escapeHtml(title)}</b>
        <ul class="solution-list">
          ${items.map((item) => `<li>${escapeHtml(item)}</li>`).join("")}
        </ul>
      </section>
    `;
  };
  const renderPlan = (items) => {
    if (!Array.isArray(items) || !items.length) {
      return "";
    }
    return `
      <section class="solution-card__wide solution-card__plan">
        <b>7日間の実行プラン</b>
        <ol>
          ${items.map((item) => `<li>${escapeHtml(item)}</li>`).join("")}
        </ol>
      </section>
    `;
  };
  container.innerHTML = content.questionSolutions
    .map(
      (item) => `
        <article class="solution-card" data-tags="${escapeHtml(item.tags)}">
          <div class="solution-card__top">
            <span>${escapeHtml(item.badge)}</span>
            <h3>${escapeHtml(item.title)}</h3>
            <p>${escapeHtml(item.question)}</p>
          </div>
          <div class="solution-card__body">
            <section>
              <b>見立て</b>
              <p>${escapeHtml(item.insight)}</p>
            </section>
            ${
              item.deepRead
                ? `<section class="solution-card__wide"><b>深掘り</b><p>${escapeHtml(item.deepRead)}</p></section>`
                : ""
            }
            ${
              item.misread
                ? `<section><b>親がハマりやすい誤解</b><p>${escapeHtml(item.misread)}</p></section>`
                : ""
            }
            <section>
              <b>解決策</b>
              <p>${escapeHtml(item.solution)}</p>
            </section>
            <section>
              <b>今日やること</b>
              <ol>
                ${(item.steps || []).map((step) => `<li>${escapeHtml(step)}</li>`).join("")}
              </ol>
            </section>
            ${
              item.aiWorkflow
                ? `<section><b>AIでの進め方</b><ol>${item.aiWorkflow.map((step) => `<li>${escapeHtml(step)}</li>`).join("")}</ol></section>`
                : ""
            }
            ${
              item.parentScript
                ? `<section><b>親の声かけ例</b><p>${escapeHtml(item.parentScript)}</p></section>`
                : ""
            }
            ${
              item.ifStuck
                ? `<section><b>うまくいかない時</b><p>${escapeHtml(item.ifStuck)}</p></section>`
                : ""
            }
            ${renderMiniList("回答から見えたサイン", item.signals)}
            ${renderMiniList("根本原因候補", item.rootCauses)}
            ${renderMiniList("見分ける質問", item.diagnosisQuestions)}
            ${renderPlan(item.sevenDayPlan)}
            ${renderMiniList("AIに渡す入力欄", item.aiInputs)}
            ${renderMiniList("作る成果物", item.outputArtifacts)}
            ${renderMiniList("見る指標", item.measure)}
            ${
              item.risk
                ? `<section class="solution-card__wide solution-card__caution"><b>注意ライン</b><p>${escapeHtml(item.risk)}</p></section>`
                : ""
            }
          </div>
          <div class="solution-card__footer">
            <small>${escapeHtml(item.tool)}</small>
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

function renderTimeline() {
  const container = document.querySelector("[data-content-timeline]");
  if (!container || !Array.isArray(content.timeline) || !content.timeline.length) {
    return;
  }
  container.innerHTML = content.timeline
    .map((item) => {
      const marker = item.date || item.label || "";
      const markerHtml = marker ? `<time>${escapeHtml(marker)}</time>` : "";
      const className = marker ? "" : ' class="no-date"';
      return `<li${className}>${markerHtml}<span>${escapeHtml(item.title)}</span></li>`;
    })
    .join("");
}

function renderContent() {
  renderPromptCards();
  renderModules();
  renderRescueItems();
  renderTools();
  renderQuestionSolutions();
  renderTimeline();
}

function filterCards(value) {
  const query = value.trim().toLowerCase();
  document.querySelectorAll(".menu-card, .prompt-feature-card, .rescue-card, .module-card, .tool-card, .solution-card, .prompt-cards button").forEach((card) => {
    const text = `${card.textContent} ${card.dataset.tags || ""}`.toLowerCase();
    card.classList.toggle("is-hidden", Boolean(query) && !text.includes(query));
  });
}

renderContent();

document.addEventListener("click", (event) => {
  const promptTrigger = event.target.closest("[data-open-prompt]");
  if (promptTrigger) {
    openPrompt(promptTrigger.dataset.openPrompt);
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

setPrompt(activePrompt);
