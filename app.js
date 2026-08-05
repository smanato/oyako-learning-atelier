const content = window.AI_EDU_LAB_CONTENT || {};
const prompts = content.prompts || {};
const promptTitle = document.querySelector("[data-prompt-title]");
const promptBody = document.querySelector("[data-prompt-body]");
const toast = document.querySelector(".toast[data-toast]");
const requestedPrompt = new URLSearchParams(window.location.search).get("prompt");
let activePrompt =
  requestedPrompt && prompts[requestedPrompt] ? requestedPrompt : content.defaultPrompt || Object.keys(prompts)[0] || "";
let toastTimer;
let subjectPromptCodeBlocks = [];
let testPrepPromptCodeBlocks = [];

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

async function copyTextToClipboard(text, successMessage = "コピーしました") {
  if (!text) {
    showToast("コピーする本文がありません");
    return;
  }

  try {
    await navigator.clipboard.writeText(text);
    showToast(successMessage);
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
    showToast(copied ? successMessage : "コピーできない場合は本文を選択してください");
  }
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

function renderToolSetups() {
  const container = document.querySelector("[data-content-tool-setups]");
  if (!container || !Array.isArray(content.toolSetups) || !content.toolSetups.length) {
    return;
  }
  const renderList = (title, items) => {
    if (!Array.isArray(items) || !items.length) {
      return "";
    }
    return `
      <section class="tool-setup-card__panel">
        <b>${escapeHtml(title)}</b>
        <ol>
          ${items.map((item) => `<li>${escapeHtml(item)}</li>`).join("")}
        </ol>
      </section>
    `;
  };
  container.innerHTML = content.toolSetups
    .map(
      (item) => `
        <article class="tool-setup-card" data-tags="${escapeHtml(item.tags)}">
          <div class="tool-setup-card__intro">
            <span>${escapeHtml(item.badge)}</span>
            <h3>${escapeHtml(item.title)}</h3>
            <p>${escapeHtml(item.bestFor)}</p>
            <div class="tool-setup-card__actions">
              ${
                item.promptKey
                  ? `<button type="button" data-open-prompt="${escapeHtml(item.promptKey)}">関連プロンプト</button>`
                  : ""
              }
              ${
                item.officialUrl
                  ? `<a href="${escapeHtml(item.officialUrl)}" target="_blank" rel="noreferrer">${escapeHtml(item.officialLabel || "公式ヘルプ")}</a>`
                  : ""
              }
            </div>
          </div>
          <div class="tool-setup-card__body">
            ${renderList("初期設定", item.setupSteps)}
            ${renderList("最初の使い方", item.firstUse)}
            ${renderList("安全ルール", item.safety)}
            ${renderList("親の確認ポイント", item.parentCheck)}
          </div>
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

function renderAgePromptTracks() {
  const container = document.querySelector("[data-content-age-prompts]");
  if (!container || !Array.isArray(content.agePromptTracks) || !content.agePromptTracks.length) {
    return;
  }
  container.innerHTML = content.agePromptTracks
    .map(
      (track) => `
        <article class="age-track" data-tags="${escapeHtml(`${track.stage} ${track.range} ${track.theme}`)}">
          <figure>
            <img src="${escapeHtml(track.image)}" alt="${escapeHtml(track.stage)}向けプロンプト">
          </figure>
          <div class="age-track__body">
            <div class="age-track__head">
              <span>${escapeHtml(track.range)}</span>
              <h3>${escapeHtml(track.stage)}</h3>
              <p>${escapeHtml(track.theme)}</p>
            </div>
            <ul class="age-track__outcomes">
              ${(track.outcomes || []).map((item) => `<li>${escapeHtml(item)}</li>`).join("")}
            </ul>
            <div class="age-track__prompts">
              ${(track.promptKeys || [])
                .map((key) => {
                  const prompt = prompts[key];
                  if (!prompt) {
                    return "";
                  }
                  return `<button type="button" data-open-prompt="${escapeHtml(key)}">${escapeHtml(prompt.title)}</button>`;
                })
                .join("")}
            </div>
          </div>
        </article>
      `
    )
    .join("");
}

function renderMasterPromptDocs() {
  const list = document.querySelector("[data-content-master-prompts]");
  const toc = document.querySelector("[data-content-master-prompt-toc]");
  if (!Array.isArray(content.masterPromptDocs) || !content.masterPromptDocs.length) {
    return;
  }
  const docs = content.masterPromptDocs;
  if (toc) {
    toc.innerHTML = docs
      .map(
        (doc) => `
          <a href="#${escapeHtml(doc.id)}">
            <span>${escapeHtml(doc.category)}</span>
            <b>${escapeHtml(doc.title)}</b>
          </a>
        `
      )
      .join("");
  }
  if (!list) {
    return;
  }
  const renderTags = (items) => (Array.isArray(items) ? items.map((item) => `<li>${escapeHtml(item)}</li>`).join("") : "");
  list.innerHTML = docs
    .map(
      (doc) => `
        <article class="master-doc-card" id="${escapeHtml(doc.id)}" data-tags="${escapeHtml(
          `${doc.category} ${doc.title} ${doc.lead} ${doc.tools} ${(doc.useCases || []).join(" ")} ${(doc.outputs || []).join(" ")}`
        )}">
          <header class="master-doc-card__head">
            <span>${escapeHtml(doc.category)}</span>
            <h3>${escapeHtml(doc.title)}</h3>
            <p>${escapeHtml(doc.lead)}</p>
          </header>
          <div class="master-doc-card__meta">
            <section>
              <b>向いているAI</b>
              <p>${escapeHtml(doc.tools)}</p>
            </section>
            <section>
              <b>使う場面</b>
              <ul>${renderTags(doc.useCases)}</ul>
            </section>
            <section>
              <b>作れるもの</b>
              <ul>${renderTags(doc.outputs)}</ul>
            </section>
          </div>
          <div class="master-doc-card__prompt">
            <div class="master-doc-card__prompt-head">
              <b>Prompt</b>
              <button type="button" data-copy-master-prompt="${escapeHtml(doc.id)}">
                <svg><use href="#i-copy"></use></svg>
                全文コピー
              </button>
            </div>
            <pre>${escapeHtml(doc.body)}</pre>
          </div>
        </article>
      `
    )
    .join("");
}

function parseSubjectMarkdown(markdown, idPrefix = "subject-heading") {
  const fence = "```";
  const lines = markdown.replace(/\r\n/g, "\n").split("\n");
  const blocks = [];
  let paragraph = [];
  let list = [];
  let quote = [];
  let inCode = false;
  let codeLang = "";
  let codeLines = [];

  const flushParagraph = () => {
    if (paragraph.length) {
      blocks.push({ type: "paragraph", text: paragraph.join(" ") });
      paragraph = [];
    }
  };
  const flushList = () => {
    if (list.length) {
      blocks.push({ type: "list", items: list });
      list = [];
    }
  };
  const flushQuote = () => {
    if (quote.length) {
      blocks.push({ type: "quote", text: quote.join(" ") });
      quote = [];
    }
  };
  const flushText = () => {
    flushParagraph();
    flushList();
    flushQuote();
  };

  lines.forEach((line) => {
    if (line.startsWith(fence)) {
      if (inCode) {
        blocks.push({ type: "code", lang: codeLang || "text", text: codeLines.join("\n") });
        codeLines = [];
        codeLang = "";
        inCode = false;
      } else {
        flushText();
        inCode = true;
        codeLang = line.slice(fence.length).trim();
      }
      return;
    }

    if (inCode) {
      codeLines.push(line);
      return;
    }

    const heading = line.match(/^(#{1,3})\s+(.+)$/);
    if (heading) {
      flushText();
      blocks.push({ type: "heading", level: heading[1].length, text: heading[2].trim() });
      return;
    }

    if (/^-{3,}\s*$/.test(line.trim())) {
      flushText();
      blocks.push({ type: "rule" });
      return;
    }

    if (!line.trim()) {
      flushText();
      return;
    }

    const listItem = line.match(/^\s*[-*]\s+(.+)$/);
    if (listItem) {
      flushParagraph();
      flushQuote();
      list.push(listItem[1].trim());
      return;
    }

    const quoteLine = line.match(/^>\s?(.+)$/);
    if (quoteLine) {
      flushParagraph();
      flushList();
      quote.push(quoteLine[1].trim());
      return;
    }

    flushList();
    flushQuote();
    paragraph.push(line.trim());
  });

  if (inCode) {
    blocks.push({ type: "code", lang: codeLang || "text", text: codeLines.join("\n") });
  }
  flushText();

  let headingIndex = 0;
  return blocks.map((block) => {
    if (block.type !== "heading") {
      return block;
    }
    headingIndex += 1;
    return {
      ...block,
      id: `${idPrefix}-${headingIndex}`
    };
  });
}

function renderSubjectPromptDocs() {
  const markdown = content.subjectPromptMarkdown || "";
  const container = document.querySelector("[data-content-subject-prompts]");
  const toc = document.querySelector("[data-content-subject-prompt-toc]");
  const stats = document.querySelector("[data-subject-prompt-stats]");
  if (!markdown || !container) {
    return;
  }

  const blocks = parseSubjectMarkdown(markdown);
  const headings = blocks.filter((block) => block.type === "heading");
  const codeBlocks = blocks.filter((block) => block.type === "code");
  subjectPromptCodeBlocks = codeBlocks.map((block) => block.text);

  if (stats) {
    const meta = content.subjectPromptMeta || {};
    stats.innerHTML = `
      <article><b>${escapeHtml(meta.codeBlockCount || codeBlocks.length)}</b><span>コピー可能なプロンプト</span></article>
      <article><b>${escapeHtml(meta.headingCount || headings.length)}</b><span>見出し</span></article>
      <article><b>${escapeHtml(meta.lineCount || markdown.split("\n").length)}</b><span>Markdown行</span></article>
      <article><b>全文</b><span>割愛なしで掲載</span></article>
    `;
  }

  if (toc) {
    toc.innerHTML = headings
      .filter((heading) => heading.level <= 2)
      .map(
        (heading) => `
          <a class="subject-docs__toc-link subject-docs__toc-link--level-${escapeHtml(heading.level)}" href="#${escapeHtml(heading.id)}">
            <span>${escapeHtml(heading.level === 1 ? "Prompt" : "Guide")}</span>
            <b>${escapeHtml(heading.text)}</b>
          </a>
        `
      )
      .join("");
  }

  let codeIndex = -1;
  let openSection = false;
  const html = blocks
    .map((block) => {
      if (block.type === "heading") {
        const tag = `h${Math.min(block.level + 1, 4)}`;
        const sectionBreak =
          block.level === 1
            ? `${openSection ? "</article>" : ""}<article class="subject-section" data-tags="${escapeHtml(block.text)}">`
            : "";
        if (block.level === 1) {
          openSection = true;
        }
        return `${sectionBreak}<${tag} id="${escapeHtml(block.id)}">${escapeHtml(block.text)}</${tag}>`;
      }
      if (block.type === "paragraph") {
        return `<p>${escapeHtml(block.text)}</p>`;
      }
      if (block.type === "list") {
        return `<ul>${block.items.map((item) => `<li>${escapeHtml(item)}</li>`).join("")}</ul>`;
      }
      if (block.type === "quote") {
        return `<blockquote>${escapeHtml(block.text)}</blockquote>`;
      }
      if (block.type === "rule") {
        return `<hr>`;
      }
      if (block.type === "code") {
        codeIndex += 1;
        return `
          <div class="subject-code-block">
            <div class="subject-code-block__head">
              <span>${escapeHtml(block.lang || "text")}</span>
              <button type="button" data-copy-subject-code="${codeIndex}">
                <svg><use href="#i-copy"></use></svg>
                このプロンプトをコピー
              </button>
            </div>
            <pre>${escapeHtml(block.text)}</pre>
          </div>
        `;
      }
      return "";
    })
    .join("");

  container.innerHTML = `${html}${openSection ? "</article>" : ""}`;
}

function renderTestPrepPromptDocs() {
  const testPrepContent = window.AI_EDU_LAB_TEST_PREP_CONTENT || {};
  const markdown = testPrepContent.testPrepPromptMarkdown || "";
  const container = document.querySelector("[data-content-test-prep-prompts]");
  const toc = document.querySelector("[data-content-test-prep-prompt-toc]");
  const stats = document.querySelector("[data-test-prep-prompt-stats]");
  if (!markdown || !container) {
    return;
  }

  const blocks = parseSubjectMarkdown(markdown, "test-prep-heading");
  const headings = blocks.filter((block) => block.type === "heading");
  const codeBlocks = blocks.filter((block) => block.type === "code");
  testPrepPromptCodeBlocks = codeBlocks.map((block) => block.text);

  if (stats) {
    const meta = testPrepContent.testPrepPromptMeta || {};
    stats.innerHTML = `
      <article><b>${escapeHtml(meta.codeBlockCount || codeBlocks.length)}</b><span>コピー可能なプロンプト</span></article>
      <article><b>${escapeHtml(meta.headingCount || headings.length)}</b><span>見出し</span></article>
      <article><b>${escapeHtml(meta.lineCount || markdown.split("\n").length)}</b><span>Markdown行</span></article>
      <article><b>ミス予報型</b><span>テスト本番で点を落とさない</span></article>
    `;
  }

  if (toc) {
    toc.innerHTML = headings
      .filter((heading) => heading.level <= 2)
      .map(
        (heading) => `
          <a class="subject-docs__toc-link subject-docs__toc-link--level-${escapeHtml(heading.level)}" href="#${escapeHtml(heading.id)}">
            <span>${escapeHtml(heading.level === 1 ? "Section" : "Prompt")}</span>
            <b>${escapeHtml(heading.text)}</b>
          </a>
        `
      )
      .join("");
  }

  let codeIndex = -1;
  let openSection = false;
  const html = blocks
    .map((block) => {
      if (block.type === "heading") {
        const tag = `h${Math.min(block.level + 1, 4)}`;
        const sectionBreak =
          block.level === 1
            ? `${openSection ? "</article>" : ""}<article class="subject-section" data-tags="${escapeHtml(block.text)}">`
            : "";
        if (block.level === 1) {
          openSection = true;
        }
        return `${sectionBreak}<${tag} id="${escapeHtml(block.id)}">${escapeHtml(block.text)}</${tag}>`;
      }
      if (block.type === "paragraph") {
        return `<p>${escapeHtml(block.text)}</p>`;
      }
      if (block.type === "list") {
        return `<ul>${block.items.map((item) => `<li>${escapeHtml(item)}</li>`).join("")}</ul>`;
      }
      if (block.type === "quote") {
        return `<blockquote>${escapeHtml(block.text)}</blockquote>`;
      }
      if (block.type === "rule") {
        return `<hr>`;
      }
      if (block.type === "code") {
        codeIndex += 1;
        return `
          <div class="subject-code-block">
            <div class="subject-code-block__head">
              <span>${escapeHtml(block.lang || "text")}</span>
              <button type="button" data-copy-test-prep-code="${codeIndex}">
                <svg><use href="#i-copy"></use></svg>
                このプロンプトをコピー
              </button>
            </div>
            <pre>${escapeHtml(block.text)}</pre>
          </div>
        `;
      }
      return "";
    })
    .join("");

  container.innerHTML = `${html}${openSection ? "</article>" : ""}`;
}

function renderLiveArchives() {
  const container = document.querySelector("[data-content-live-archives]");
  if (!container || !Array.isArray(content.liveArchives) || !content.liveArchives.length) {
    return;
  }
  container.innerHTML = content.liveArchives
    .map(
      (item) => `
        <article class="live-archive-card" data-tags="${escapeHtml(item.tags || item.title)}">
          <div class="live-archive-card__video">
            <iframe
              src="https://www.youtube.com/embed/${escapeHtml(item.youtubeId)}"
              title="${escapeHtml(item.title)}"
              loading="lazy"
              referrerpolicy="strict-origin-when-cross-origin"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
              allowfullscreen
            ></iframe>
          </div>
          <div class="live-archive-card__body">
            ${item.date ? `<p class="eyebrow">${escapeHtml(item.date)}</p>` : ""}
            <h3>${escapeHtml(item.title)}</h3>
            ${item.description ? `<p>${escapeHtml(item.description)}</p>` : ""}
            <a class="secondary secondary--light compact" href="https://youtu.be/${escapeHtml(item.youtubeId)}" target="_blank" rel="noreferrer">
              <svg><use href="#i-play"></use></svg>
              YouTubeで開く
            </a>
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

function safeMaterialHref(value) {
  const href = String(value ?? "").trim();
  if (!href) {
    return "";
  }
  return /^(\.{0,2}\/|https?:\/\/)/.test(href) ? href : "";
}

function renderMaterialCard(item) {
  const fileHref = safeMaterialHref(item.file);
  const urlHref = safeMaterialHref(item.url);
  const href = fileHref || urlHref;
  const isExternal = !fileHref && Boolean(urlHref);
  const meta = [item.fileType, item.fileSize]
    .filter(Boolean)
    .map((value) => `<span>${escapeHtml(value)}</span>`)
    .join("");
  const linkAttrs = isExternal ? 'target="_blank" rel="noreferrer"' : "download";
  const label = item.buttonLabel || (isExternal ? "資料を開く" : "ダウンロード");

  return `
    <article class="material-card" data-tags="${escapeHtml(item.tags || item.title)}">
      <div class="material-card__head">
        ${item.badge ? `<span class="material-card__badge">${escapeHtml(item.badge)}</span>` : ""}
        ${item.date ? `<time class="material-card__date">${escapeHtml(item.date)}</time>` : ""}
      </div>
      <h4>${escapeHtml(item.title)}</h4>
      ${item.description ? `<p>${escapeHtml(item.description)}</p>` : ""}
      ${meta ? `<div class="material-card__meta">${meta}</div>` : ""}
      ${
        href
          ? `<a class="material-card__action" href="${escapeHtml(href)}" ${linkAttrs}>
              <svg><use href="#i-download"></use></svg>
              ${escapeHtml(label)}
            </a>`
          : ""
      }
    </article>
  `;
}

function renderMaterials() {
  const container = document.querySelector("[data-content-materials]");
  if (!container) {
    return;
  }
  const items = Array.isArray(content.materials) ? content.materials : [];
  if (!items.length) {
    return;
  }

  const groups = [];
  items.forEach((item) => {
    const name = item.category || "資料";
    let group = groups.find((entry) => entry.name === name);
    if (!group) {
      group = { name, items: [] };
      groups.push(group);
    }
    group.items.push(item);
  });

  container.innerHTML = groups
    .map(
      (group) => `
        <section class="material-group">
          <h3 class="material-group__title">${escapeHtml(group.name)}</h3>
          <div class="material-grid">
            ${group.items.map(renderMaterialCard).join("")}
          </div>
        </section>
      `
    )
    .join("");
}

function renderContent() {
  renderPromptCards();
  renderModules();
  renderRescueItems();
  renderTools();
  renderToolSetups();
  renderQuestionSolutions();
  renderAgePromptTracks();
  renderMasterPromptDocs();
  renderSubjectPromptDocs();
  renderTestPrepPromptDocs();
  renderLiveArchives();
  renderTimeline();
  renderMaterials();
}

function filterCards(value) {
  const query = value.trim().toLowerCase();
  document.querySelectorAll(".menu-card, .prompt-feature-card, .age-track, .rescue-card, .module-card, .tool-card, .tool-setup-card, .solution-card, .master-doc-card, .subject-section, .live-archive-card, .material-card, .prompt-cards button").forEach((card) => {
    const text = `${card.textContent} ${card.dataset.tags || ""}`.toLowerCase();
    card.classList.toggle("is-hidden", Boolean(query) && !text.includes(query));
  });
}

renderContent();

document.addEventListener("click", (event) => {
  const subjectCopyAllTrigger = event.target.closest("[data-copy-subject-all]");
  if (subjectCopyAllTrigger) {
    copyTextToClipboard(content.subjectPromptMarkdown || "", "教科別プロンプト全文をコピーしました");
    return;
  }

  const subjectCodeCopyTrigger = event.target.closest("[data-copy-subject-code]");
  if (subjectCodeCopyTrigger) {
    const index = Number(subjectCodeCopyTrigger.dataset.copySubjectCode);
    copyTextToClipboard(subjectPromptCodeBlocks[index] || "", "教科別プロンプトをコピーしました");
    return;
  }

  const testPrepCopyAllTrigger = event.target.closest("[data-copy-test-prep-all]");
  if (testPrepCopyAllTrigger) {
    const md = (window.AI_EDU_LAB_TEST_PREP_CONTENT && window.AI_EDU_LAB_TEST_PREP_CONTENT.testPrepPromptMarkdown) || "";
    copyTextToClipboard(md, "テスト対策プロンプト全文をコピーしました");
    return;
  }

  const testPrepCodeCopyTrigger = event.target.closest("[data-copy-test-prep-code]");
  if (testPrepCodeCopyTrigger) {
    const index = Number(testPrepCodeCopyTrigger.dataset.copyTestPrepCode);
    copyTextToClipboard(testPrepPromptCodeBlocks[index] || "", "テスト対策プロンプトをコピーしました");
    return;
  }

  const masterCopyTrigger = event.target.closest("[data-copy-master-prompt]");
  if (masterCopyTrigger) {
    const doc = (content.masterPromptDocs || []).find((item) => item.id === masterCopyTrigger.dataset.copyMasterPrompt);
    copyTextToClipboard(doc?.body || "", "最強プロンプトをコピーしました");
    return;
  }

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
  copyTextToClipboard(text, "プロンプトをコピーしました");
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
