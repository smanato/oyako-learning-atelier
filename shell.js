const pageBase = document.body.dataset.base || ".";
const currentPage = document.body.dataset.page || "home";

const icons = `
  <svg class="sprite" aria-hidden="true">
    <symbol id="i-home" viewBox="0 0 24 24"><path d="m3.5 11 8.5-7 8.5 7v8.2a1.3 1.3 0 0 1-1.3 1.3H5a1.3 1.3 0 0 1-1.5-1.3z"/><path d="M9 20.5v-7h6v7"/></symbol>
    <symbol id="i-book" viewBox="0 0 24 24"><path d="M5 4.5A2.5 2.5 0 0 1 7.5 2H20v17H7.5A2.5 2.5 0 0 0 5 21.5z"/><path d="M5 4.5v17"/><path d="M9 7h6"/></symbol>
    <symbol id="i-camera" viewBox="0 0 24 24"><path d="M4 8.5A2.5 2.5 0 0 1 6.5 6h1.8l1.4-2h4.6l1.4 2h1.8A2.5 2.5 0 0 1 20 8.5v8A2.5 2.5 0 0 1 17.5 19h-11A2.5 2.5 0 0 1 4 16.5z"/><circle cx="12" cy="12.5" r="3.4"/></symbol>
    <symbol id="i-chat" viewBox="0 0 24 24"><path d="M4 7a3 3 0 0 1 3-3h10a3 3 0 0 1 3 3v5.5a3 3 0 0 1-3 3H10l-5 4v-4.7A3 3 0 0 1 4 12.5z"/><path d="M8 8.5h8M8 11.5h5"/></symbol>
    <symbol id="i-copy" viewBox="0 0 24 24"><rect x="8" y="8" width="11" height="11" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v1"/></symbol>
    <symbol id="i-menu" viewBox="0 0 24 24"><path d="M4 7h16M4 12h16M4 17h16"/></symbol>
    <symbol id="i-play" viewBox="0 0 24 24"><path d="m8 5 11 7-11 7z"/></symbol>
    <symbol id="i-search" viewBox="0 0 24 24"><circle cx="11" cy="11" r="7"/><path d="m16.5 16.5 4 4"/></symbol>
    <symbol id="i-shield" viewBox="0 0 24 24"><path d="M12 3 20 6v5.5c0 5-3.4 8.4-8 10-4.6-1.6-8-5-8-10V6z"/><path d="m8.5 12 2.2 2.2 4.8-5"/></symbol>
    <symbol id="i-tool" viewBox="0 0 24 24"><path d="m14.5 5 4.5 4.5-9.8 9.8-4.8.9.9-4.8z"/><path d="m13 6.5 4.5 4.5"/></symbol>
    <symbol id="i-video" viewBox="0 0 24 24"><rect x="4" y="6" width="12" height="12" rx="2"/><path d="m16 10 4-2.5v9L16 14"/></symbol>
  </svg>
`;

const navItems = [
  { page: "home", href: "index.html", icon: "i-home", label: "ホーム", description: "今日の入口" },
  { page: "library", href: "library.html", icon: "i-camera", label: "教材を見る", description: "実践コンテンツ" },
  { page: "start", href: "start.html", icon: "i-play", label: "はじめてガイド", description: "最初の使い方" },
  { page: "rescue", href: "rescue.html", icon: "i-chat", label: "悩み別レスキュー", description: "困りごとから探す" },
  { page: "questions", href: "questions.html", icon: "i-book", label: "質問解決策", description: "回答から作成" },
  { page: "prompts", href: "prompts.html", icon: "i-copy", label: "プロンプト集", description: "コピーして使う" },
  { page: "tools", href: "tools.html", icon: "i-tool", label: "ツール設定", description: "AIの選び方" },
  { page: "live", href: "live.html", icon: "i-video", label: "Zoom・質問", description: "ライブと相談" },
  { page: "rules", href: "rules.html", icon: "i-shield", label: "ルール・安心", description: "使い方と解約" }
];
const currentNavItem = navItems.find((item) => item.page === currentPage) || navItems[0];

function withBase(path) {
  return `${pageBase}/${path}`.replace("././", "./");
}

document.body.insertAdjacentHTML("afterbegin", icons);

const sidebar = document.querySelector("[data-shell-sidebar]");
if (sidebar) {
  sidebar.innerHTML = `
    <a class="brand" href="${withBase("index.html")}" aria-label="AI教育ラボ Members">
      <span class="brand__mark">AI</span>
      <span class="brand__text">
        <strong>AI教育ラボ</strong>
        <small>Members Portal</small>
      </span>
    </a>

    <nav class="side-nav">
      ${navItems
        .map(
          (item) => `
            <a class="${item.page === currentPage ? "is-active" : ""}" href="${withBase(item.href)}" data-page="${item.page}">
              <svg><use href="#${item.icon}"></use></svg>
              <span class="side-nav__text">
                <strong>${item.label}</strong>
                <small>${item.description}</small>
              </span>
            </a>
          `
        )
        .join("")}
    </nav>

    <section class="member-ticket" aria-label="今日の入口">
      <figure>
        <img src="${withBase("assets/generated/empty-state.png")}" alt="質問やアーカイブが蓄積していく会員サイトのイメージ">
      </figure>
      <p>Member Area</p>
      <strong>今日の5分</strong>
      <small>写真/PDFを1つ入れて、ヒントと確認クイズに変換。</small>
      <button type="button" data-open-prompt="pdfTutor">プロンプトを開く</button>
    </section>
  `;
}

const topbar = document.querySelector("[data-shell-topbar]");
if (topbar) {
  topbar.innerHTML = `
    <button class="icon-button menu-button" type="button" aria-label="メニューを開く">
      <svg><use href="#i-menu"></use></svg>
    </button>
    <div class="page-title">
      <p>AI教育ラボ Members / ${currentNavItem.description}</p>
      <h1>${currentNavItem.label}</h1>
    </div>
    <label class="search-box">
      <svg><use href="#i-search"></use></svg>
      <input type="search" placeholder="悩み・教科・ツールで検索" data-search>
    </label>
  `;
}
