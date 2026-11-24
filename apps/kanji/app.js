const state = {
  settings: null,
  levels: [],
  learners: [],
  items: [],
  totalItems: 0,
  units: [],
  summary: null,
  reviewQueue: [],
  currentLearnerId: localStorage.getItem('kanji.currentLearner') || '',
  selectedLevel: localStorage.getItem('kanji.selectedLevel') || 'all',
  selectedUnits: readStoredUnits(),
  selectedItemIds: readStoredItemIds(),
  selectableItems: [],
  testLimit: localStorage.getItem('kanji.testLimit') || '10',
  view: 'dashboard',
  session: null,
  report: null,
  itemPickSearch: '',
  itemSearch: ''
};

const testLimitOptions = [
  { id: '10', label: '10問' },
  { id: '20', label: '20問' },
  { id: '50', label: '50問' },
  { id: 'all', label: '全部' }
];

function readStoredUnits() {
  try {
    const value = JSON.parse(localStorage.getItem('kanji.selectedUnits') || '[]');
    return Array.isArray(value) ? value.filter(Boolean) : [];
  } catch {
    return [];
  }
}

function readStoredItemIds() {
  try {
    const value = JSON.parse(localStorage.getItem('kanji.selectedItemIds') || '[]');
    return Array.isArray(value) ? value.filter(Boolean) : [];
  } catch {
    return [];
  }
}

const RECENT_KEY = 'kanji.recentItemIds';
const RECENT_BUFFER = 80;

function readRecentIds() {
  try {
    const value = JSON.parse(localStorage.getItem(RECENT_KEY) || '[]');
    return Array.isArray(value) ? value : [];
  } catch {
    return [];
  }
}

function pushRecentIds(ids) {
  if (!Array.isArray(ids) || !ids.length) return;
  const prev = readRecentIds();
  const merged = [...ids, ...prev.filter((id) => !ids.includes(id))].slice(0, RECENT_BUFFER);
  try {
    localStorage.setItem(RECENT_KEY, JSON.stringify(merged));
  } catch {}
}

function shuffleArray(array) {
  const arr = array.slice();
  for (let i = arr.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

// 直近に出した問題は後ろに回す。ただし候補が少ない時は気にしない。
function buildSessionQueue(items, limit, { honorRecent = true } = {}) {
  if (!Array.isArray(items) || !items.length) return [];
  const cap = Math.max(1, Number(limit) || items.length);
  if (!honorRecent || items.length <= cap) {
    const queue = shuffleArray(items).slice(0, cap);
    pushRecentIds(queue.map((q) => q.id));
    return queue;
  }
  const recent = new Set(readRecentIds());
  const fresh = items.filter((item) => !recent.has(item.id));
  const stale = items.filter((item) => recent.has(item.id));
  const queue = shuffleArray(fresh).concat(shuffleArray(stale)).slice(0, cap);
  pushRecentIds(queue.map((q) => q.id));
  return queue;
}

const titles = {
  dashboard: 'ホーム',
  study: '学習編',
  test: 'テスト編',
  flashcards: '復習カード',
  admin: '教材管理',
  report: '成績'
};

const $ = (selector) => document.querySelector(selector);
const $$ = (selector) => [...document.querySelectorAll(selector)];

function toast(message) {
  const box = $('#toast');
  box.textContent = message;
  box.hidden = false;
  clearTimeout(toast.timer);
  toast.timer = setTimeout(() => {
    box.hidden = true;
  }, 2600);
}

function escapeHtml(value) {
  return String(value ?? '').replace(/[&<>"']/g, (char) => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#039;'
  }[char]));
}

function currentLearner() {
  return state.learners.find((learner) => learner.id === state.currentLearnerId) || state.learners[0] || null;
}

function loadBootstrap() {
  const data = window.KanjiDB.getBootstrap({
    learnerId: state.currentLearnerId,
    level: state.selectedLevel,
    units: state.selectedUnits,
    itemIds: state.selectedItemIds
  });
  state.settings = data.settings;
  state.levels = data.levels || [];
  state.learners = data.learners;
  state.items = data.items;
  state.selectableItems = data.selectableItems || data.items;
  state.totalItems = data.totalItems || data.items.length;
  state.units = data.units;
  state.selectedUnits = state.selectedUnits.filter((unit) => state.units.includes(unit));
  const selectableIds = new Set(state.selectableItems.map((item) => item.id));
  state.selectedItemIds = state.selectedItemIds.filter((id) => selectableIds.has(id));
  if (!state.currentLearnerId && data.learners[0]) state.currentLearnerId = data.learners[0].id;
  if (!state.learners.some((learner) => learner.id === state.currentLearnerId) && state.learners[0]) {
    state.currentLearnerId = state.learners[0].id;
  }
  state.summary = data.summary;
  state.reviewQueue = data.reviewQueue;
  localStorage.setItem('kanji.currentLearner', state.currentLearnerId || '');
  localStorage.setItem('kanji.selectedLevel', state.selectedLevel || 'all');
  localStorage.setItem('kanji.selectedUnits', JSON.stringify(state.selectedUnits));
  localStorage.setItem('kanji.selectedItemIds', JSON.stringify(state.selectedItemIds));
  if (!state.session && (state.view === 'test' || state.view === 'study' || state.view === 'flashcards')) {
    switchView('dashboard');
    return;
  }
  render();
}

function switchView(view) {
  const previousView = state.view;
  state.view = view;
  $('#viewTitle').textContent = titles[view];
  $$('.nav-item').forEach((button) => button.classList.toggle('is-active', button.dataset.view === view));
  $$('.view').forEach((section) => section.classList.toggle('is-active', section.id === `view-${view}`));
  if (previousView !== view) requestAnimationFrame(() => window.scrollTo(0, 0));
  if (view === 'report') loadReport();
  if (view === 'study' && state.session?.mode !== 'study') prepareStudy();
  if (view === 'test' && state.session?.mode !== 'test') prepareTest(false);
  if (view === 'flashcards' && state.session?.mode !== 'flashcards') prepareFlashcards();
}

function render() {
  renderLearnerSelect();
  renderLevelTabs();
  renderScopePicker();
  renderTestLimitTabs();
  renderDashboard();
  renderAdmin();
  if (state.view === 'report') renderReport();
  if (state.session?.mode === 'study') renderStudy();
  if (state.session?.mode === 'test') renderTest();
  if (state.session?.mode === 'flashcards') renderFlashcards();
}

function currentLevelLabel() {
  const found = state.levels.find((level) => level.id === state.selectedLevel);
  return found?.label || 'すべて';
}

function currentScopeLabel() {
  if (state.selectedItemIds.length) return `${state.selectedItemIds.length}問を選択`;
  if (!state.selectedUnits.length) return '全範囲';
  if (state.selectedUnits.length === 1) return state.selectedUnits[0];
  return `${state.selectedUnits.length}単元を選択`;
}

function currentScopeStatLabel() {
  if (state.selectedItemIds.length) return '選択中の問題';
  return `${currentScopeLabel()}の問題`;
}

function readingGuideHtml(item) {
  const parts = [];
  if (item.onReading) parts.push(`<span class="tag blue">音 ${escapeHtml(item.onReading)}</span>`);
  if (item.kunReading) parts.push(`<span class="tag green">訓 ${escapeHtml(item.kunReading)}</span>`);
  return parts.length ? `<div class="reading-guide">${parts.join('')}</div>` : '';
}

// 参考単語（同じ漢字を使う他の言葉）を表示する。
function refWordsHtml(item) {
  if (!item.refWords) return '';
  const words = String(item.refWords).split(/[・、,\s]+/).filter(Boolean);
  if (!words.length) return '';
  return `
    <div class="ref-words">
      <span class="ref-words-label">参考単語</span>
      <div class="ref-words-list">
        ${words.map((w) => `<span class="ref-word">${escapeHtml(w)}</span>`).join('')}
      </div>
    </div>
  `;
}

// 出題側（問題面）に出す例文。答えは必ず伏せ字にする。
function questionExampleText(item) {
  if (!item.example) return '';
  return maskAnswerInText(item.example, item.answer);
}

// 答え合わせ側に出す例文。答えを入れた完成文を優先する。
function answerExampleText(item) {
  if (item.exampleAnswer) return item.exampleAnswer;
  return item.example || '';
}

// テンプレの {} や、文中に含まれる答えの文字列を伏せ字にする。
function maskAnswerInText(text, answer) {
  const str = String(text || '');
  if (!str) return '';
  if (str.includes('{}')) return str.replace('{}', '〇〇');
  return answer ? str.split(answer).join('〇〇') : str;
}

function renderLevelTabs() {
  const root = $('#levelTabs');
  if (!root) return;
  root.innerHTML = (state.levels.length ? state.levels : [{ id: 'all', label: 'すべて', short: '全' }]).map((level) => `
    <button class="level-tab ${level.id === state.selectedLevel ? 'is-active' : ''}" data-level="${level.id}" type="button">
      <span>${escapeHtml(level.short || level.label)}</span>
      ${escapeHtml(level.label)}
      ${level.kyu ? `<em class="level-kyu">${escapeHtml(level.kyu)}</em>` : ''}
    </button>
  `).join('');
}

function renderScopePicker() {
  const root = $('#unitTabs');
  const summary = $('#scopeSummary');
  const selectedRoot = $('#selectedKanjiList');
  const searchInput = $('#kanjiSearchInput');
  const resultsRoot = $('#kanjiSearchResults');
  if (!root || !summary || !selectedRoot || !searchInput || !resultsRoot) return;
  const selected = new Set(state.selectedUnits);
  summary.textContent = `${currentScopeLabel()} / ${state.items.length}問`;
  const allActive = selected.size === 0;
  const unitButtons = state.units.map((unit) => `
    <button class="unit-tab ${selected.has(unit) ? 'is-active' : ''}" data-unit-scope="${escapeHtml(unit)}" type="button">
      ${escapeHtml(unit)}
    </button>
  `).join('');
  root.innerHTML = `
    <button class="unit-tab all ${allActive ? 'is-active' : ''}" data-scope-all type="button">全範囲</button>
    ${unitButtons || '<span class="hint">この学年の単元はまだありません。</span>'}
  `;
  if (searchInput.value !== state.itemPickSearch) searchInput.value = state.itemPickSearch;

  const selectedIds = new Set(state.selectedItemIds);
  const selectedItems = state.selectedItemIds
    .map((id) => state.selectableItems.find((item) => item.id === id) || state.items.find((item) => item.id === id))
    .filter(Boolean);
  selectedRoot.innerHTML = selectedItems.length ? selectedItems.map((item) => `
    <button class="selected-kanji-chip" data-remove-kanji="${escapeHtml(item.id)}" type="button" title="選択解除">
      <strong>${escapeHtml(item.answer)}</strong>
      <span>${escapeHtml(item.reading)}</span>
      <em>×</em>
    </button>
  `).join('') : '<span class="hint">漢字を選ぶと、その問題だけを出題します。</span>';

  const query = state.itemPickSearch.trim();
  const source = state.selectableItems.length ? state.selectableItems : state.items;
  const matches = query
    ? source.filter((item) => [item.answer, item.reading, item.onReading, item.kunReading, item.unit, item.prompt, item.example].join(' ').includes(query))
    : [];
  resultsRoot.innerHTML = query ? (
    matches.length ? matches.slice(0, 18).map((item) => `
      <article class="kanji-result ${selectedIds.has(item.id) ? 'is-selected' : ''}">
        <button class="kanji-result-main" data-pick-kanji="${escapeHtml(item.id)}" type="button">
          <span class="kanji-result-char">${escapeHtml(item.answer)}</span>
          <span>
            <strong>${escapeHtml(item.reading)}</strong>
            <small>${escapeHtml(item.unit)}</small>
            <em>${escapeHtml(item.prompt || item.example || '')}</em>
          </span>
        </button>
      </article>
    `).join('') : '<div class="empty small-empty">該当する漢字がありません。</div>'
  ) : '';
}

function renderTestLimitTabs() {
  const root = $('#testLimitTabs');
  if (!root) return;
  root.innerHTML = testLimitOptions.map((option) => `
    <button class="limit-tab ${option.id === state.testLimit ? 'is-active' : ''}" data-test-limit="${option.id}" type="button">
      ${escapeHtml(option.label)}
    </button>
  `).join('');
}

function sessionLimit(count) {
  if (state.testLimit === 'all') return count;
  const limit = Number(state.testLimit);
  return Number.isFinite(limit) ? Math.min(count, limit) : Math.min(count, 10);
}

function scrollToWorkbench() {
  requestAnimationFrame(() => {
    document.querySelector('.view.is-active .workbench')?.scrollIntoView({ block: 'start' });
  });
}

function renderLearnerSelect() {
  const select = $('#learnerSelect');
  select.innerHTML = state.learners.map((learner) => `
    <option value="${learner.id}" ${learner.id === state.currentLearnerId ? 'selected' : ''}>
      ${escapeHtml(learner.name)}
    </option>
  `).join('');
}

function dailyLineText() {
  const s = window.KanjiDB.dailyStats(state.currentLearnerId);
  const learner = (state.learners || []).find((l) => l.id === state.currentLearnerId);
  const d = new Date();
  const day = (d.getMonth() + 1) + '/' + d.getDate();
  return day + ' ' + s.today.count + '問（正解' + s.today.correct + '） 連続' + s.streak + '日'
    + (learner && learner.name ? ' ' + learner.name : '');
}

function copyDailyLine() {
  const text = dailyLineText();
  const done = () => {
    const el = document.getElementById('dailyCopyMsg');
    if (el) { el.textContent = 'コピーしました：' + text; setTimeout(() => { el.textContent = ''; }, 6000); }
  };
  if (navigator.clipboard && navigator.clipboard.writeText) {
    navigator.clipboard.writeText(text).then(done, done);
  } else {
    const ta = document.createElement('textarea');
    ta.value = text; ta.style.position = 'fixed'; ta.style.opacity = '0';
    document.body.appendChild(ta); ta.select();
    try { document.execCommand('copy'); } catch (e) {}
    document.body.removeChild(ta);
    done();
  }
}

// 毎日つづけるための記録（2026-11-24）
function renderDailyCard() {
  const grid = document.getElementById('statGrid');
  if (!grid || !window.KanjiDB.dailyStats) return;
  let card = document.getElementById('dailyCard');
  if (!card) {
    card = document.createElement('div');
    card.id = 'dailyCard';
    card.className = 'daily-card';
    grid.parentNode.insertBefore(card, grid);
  }
  const s = window.KanjiDB.dailyStats(state.currentLearnerId);
  card.innerHTML = `
    <div class="daily-head">
      <p class="eyebrow">TODAY</p>
      <strong>${s.today.count ? 'きょうは もうやったね！' : 'きょうの分は まだです'}</strong>
    </div>
    <div class="daily-nums">
      <div><span>今日</span><strong>${s.today.count}<small>問</small></strong></div>
      <div><span>正解</span><strong>${s.today.correct}<small>問</small></strong></div>
      <div><span>連続</span><strong>${s.streak}<small>日</small></strong></div>
      <div><span>7日で</span><strong>${s.week.count}<small>問</small></strong></div>
    </div>
    <button class="button small secondary" id="copyDailyLine" type="button">今日の記録を1行でコピー</button>
    <p class="daily-msg" id="dailyCopyMsg"></p>
  `;
}

function renderDashboard() {
  renderDailyCard();
  const summary = state.summary || {};
  const accuracy = summary.accuracy == null ? '-' : `${summary.accuracy}%`;
  $('#statGrid').innerHTML = [
    { label: currentScopeStatLabel(), value: summary.totalItems ?? state.items.length, unit: '問', icon: '冊', tone: 'ink' },
    { label: '未着手', value: summary.untried ?? 0, unit: '問', icon: '新', tone: 'blue' },
    { label: '復習待ち', value: summary.review ?? 0, unit: '問', icon: '要', tone: 'red' },
    { label: '直近正答率', value: accuracy, unit: '', icon: '率', tone: 'green' }
  ].map((stat) => `
    <div class="stat-card tone-${stat.tone}">
      <div class="stat-icon" aria-hidden="true">${stat.icon}</div>
      <span>${stat.label}</span>
      <strong>${stat.value}${stat.unit}</strong>
    </div>
  `).join('');

  $('#queueList').innerHTML = state.reviewQueue.length ? state.reviewQueue.slice(0, 8).map((item) => `
    <article class="queue-row">
      <div class="queue-kanji" aria-hidden="true">${escapeHtml(item.answer)}</div>
      <div>
        <strong>${escapeHtml(item.reading)}</strong>
        <div class="queue-prompt">${escapeHtml(item.prompt || item.example || '')}</div>
        ${readingGuideHtml(item)}
        <div class="meta">
          <span class="tag">${escapeHtml(item.unit)}</span>
          <span class="tag">${escapeHtml(item.level || '未設定')}</span>
          ${item.progress?.status === 'review' ? '<span class="tag red">間違い復習</span>' : '<span class="tag blue">出題予定</span>'}
        </div>
      </div>
      <button class="button small icon-button" data-single-test="${item.id}" type="button" title="出題" aria-label="出題">
        <span aria-hidden="true">→</span>
      </button>
    </article>
  `).join('') : '<div class="empty">今すぐ復習すべき問題はありません。新しい問題を登録するか、通常テストを始めてください。</div>';

  const currentMode = state.settings?.gradeMode || 'normal';
  const modeOptions = [
    { id: 'study', label: '学習', hint: '甘め: まずは楽しく' },
    { id: 'normal', label: '通常', hint: '標準: 家庭学習' },
    { id: 'strict', label: 'テスト', hint: '厳しめ: 塾チェック' }
  ];
  const modeHint = modeOptions.find((m) => m.id === currentMode)?.hint || '';

  $('#settingsBox').innerHTML = `
    <div class="settings-list">
      <div class="setting-card grade-mode-card">
        <div class="setting-head">
          <strong>採点の厳しさ</strong>
          <small>${escapeHtml(modeHint)}</small>
        </div>
        <div class="grade-mode-tabs">
          ${modeOptions.map((option) => `
            <button class="grade-mode-tab ${option.id === currentMode ? 'is-active' : ''}" data-grade-mode="${option.id}" type="button">
              ${escapeHtml(option.label)}
            </button>
          `).join('')}
        </div>
      </div>
      <label class="range-row setting-card">
        <span>
          <strong>合格ライン</strong><br>
          <small>${state.settings?.passScore ?? 72} 点以上</small>
        </span>
        <input id="passScoreRange" type="range" min="55" max="90" value="${state.settings?.passScore ?? 72}">
      </label>
      <label class="switch-row setting-card">
        <span>
          <strong>即時リトライ</strong><br>
          <small>間違いを後ろに追加</small>
        </span>
        <input class="toggle-input" id="repeatWrongToggle" type="checkbox" ${state.settings?.repeatWrongImmediately ? 'checked' : ''}>
      </label>
    </div>
  `;
}

function filteredItems() {
  const q = state.itemSearch.trim();
  if (!q) return state.items;
  return state.items.filter((item) => [item.level, item.unit, item.reading, item.onReading, item.kunReading, item.answer, item.prompt, item.example].join(' ').includes(q));
}

function renderAdmin() {
  $('#learnerList').innerHTML = state.learners.map((learner) => `
    <article class="learner-row">
      <div>
        <strong>${escapeHtml(learner.name)}</strong>
        <div class="hint">${escapeHtml(learner.note || 'メモなし')}</div>
      </div>
      <button class="button small" data-select-learner="${learner.id}" type="button">選択</button>
    </article>
  `).join('');

  const items = filteredItems();
  $('#itemsTable').innerHTML = items.length ? items.map((item) => `
    <article class="item-row">
      <div class="item-kanji" aria-hidden="true">${escapeHtml(item.answer)}</div>
      <div class="item-main">
        <div class="item-unit">${escapeHtml(item.unit)}</div>
        <strong>${escapeHtml(item.reading)}</strong>
        <div class="item-prompt">${escapeHtml(item.prompt || item.example || '')}</div>
        ${readingGuideHtml(item)}
      </div>
      <button class="button small icon-button danger-soft" data-delete-item="${item.id}" type="button" title="削除" aria-label="削除">
        <span aria-hidden="true">×</span>
      </button>
    </article>
  `).join('') : '<div class="empty">問題がありません。塾テキストから読み・正解・例文を貼り付けてください。</div>';
}

function persistSettings(patch) {
  state.settings = window.KanjiDB.updateSettings({ ...state.settings, ...patch });
  loadBootstrap();
  toast('採点設定を保存しました');
}

function prepareStudy() {
  const learner = currentLearner();
  if (!learner) return toast('先に生徒を追加してください');
  const data = window.KanjiDB.getReview(learner.id, {
    onlyWrong: false,
    level: state.selectedLevel || 'all',
    units: state.selectedUnits,
    itemIds: state.selectedItemIds
  });
  const sourceItems = data.items.length ? data.items : state.items;
  const queue = buildSessionQueue(sourceItems, sessionLimit(sourceItems.length));
  if (!queue.length) return toast('学習できる問題がありません');
  state.summary = data.summary;
  state.session = {
    mode: 'study',
    queue,
    index: 0,
    startedAt: Date.now(),
    currentGrade: null,
    grading: false,
    savedStrokes: [],
    wrongSeen: 0,
    passSeen: 0,
    finished: false
  };
  switchView('study');
  renderStudy();
  scrollToWorkbench();
}

function prepareTest(onlyWrong) {
  const learner = currentLearner();
  if (!learner) return toast('先に生徒を追加してください');
  const data = window.KanjiDB.getReview(learner.id, {
    onlyWrong: Boolean(onlyWrong),
    level: state.selectedLevel || 'all',
    units: state.selectedUnits,
    itemIds: state.selectedItemIds
  });
  const sourceItems = data.items.length ? data.items : (onlyWrong ? [] : state.items);
  if (!sourceItems.length) {
    toast(onlyWrong ? '間違い復習の問題はありません' : '出題できる問題がありません');
    return;
  }
  const queue = buildSessionQueue(sourceItems, sessionLimit(sourceItems.length)).map((item) => ({ ...item, retry: 0 }));
  state.summary = data.summary;
  state.session = {
    mode: 'test',
    queue,
    availableCount: sourceItems.length,
    limit: state.testLimit,
    index: 0,
    startedAt: Date.now(),
    currentGrade: null,
    grading: false,
    finished: false,
    wrongSeen: 0,
    passSeen: 0
  };
  switchView('test');
  renderTest();
  scrollToWorkbench();
}

function prepareFlashcards() {
  const learner = currentLearner();
  if (!learner) return toast('先に生徒を追加してください');
  const data = window.KanjiDB.getReview(learner.id, {
    onlyWrong: true,
    level: state.selectedLevel || 'all',
    units: state.selectedUnits,
    itemIds: state.selectedItemIds
  });
  const sourceItems = data.items;
  const queue = buildSessionQueue(sourceItems, sessionLimit(sourceItems.length)).map((item) => ({ ...item, retry: 0 }));
  state.summary = data.summary;
  state.session = {
    mode: 'flashcards',
    queue,
    availableCount: sourceItems.length,
    limit: state.testLimit,
    index: 0,
    startedAt: Date.now(),
    showAnswer: false,
    submitting: false,
    finished: !queue.length,
    empty: !queue.length,
    wrongSeen: 0,
    passSeen: 0
  };
  switchView('flashcards');
  if (!queue.length) toast('復習カードはまだありません。間違えた問題がここに集まります');
  renderFlashcards();
  scrollToWorkbench();
}

function singleItemSession(itemId) {
  const item = state.items.find((row) => row.id === itemId);
  if (!item) return;
  state.session = {
    mode: 'test',
    queue: [{ ...item, retry: 0 }],
    index: 0,
    startedAt: Date.now(),
    currentGrade: null,
    grading: false,
    finished: false,
    wrongSeen: 0,
    passSeen: 0
  };
  switchView('test');
  renderTest();
  scrollToWorkbench();
}

function sessionProgressHtml(session) {
  const total = session.queue.length || 1;
  const current = Math.min(session.index + 1, total);
  const completedCurrent = session.mode === 'test' && session.currentGrade ? 1 : 0;
  const percent = Math.round(((session.index + completedCurrent) / total) * 100);
  return `
    <div class="progress-box">
      <p class="eyebrow">Progress</p>
      <h3><span>${current}</span> / ${total}</h3>
      <div class="meter" aria-hidden="true"><span style="width:${percent}%"></span></div>
      <div class="meta">
        <span class="tag blue">正解 ${session.passSeen || 0}</span>
        <span class="tag red">再出題 ${session.wrongSeen || 0}</span>
      </div>
    </div>
  `;
}

function renderStudy() {
  const root = $('#studyWorkbench');
  const session = state.session?.mode === 'study' ? state.session : null;
  if (!session || session.finished) {
    root.innerHTML = finishedHtml('学習編が終わりました', '覚えた漢字はテスト編で確認できます。');
    return;
  }

  const item = session.queue[session.index];
  if (!item) {
    session.finished = true;
    renderStudy();
    return;
  }

  const grade = session.currentGrade;
  const gradeButtonClass = grade ? 'button secondary full' : 'button primary full hero-action';
  const nextButtonClass = grade ? 'button primary full hero-action' : 'button secondary full';
  root.innerHTML = `
    <div class="session-shell study-shell">
      <div class="question-panel">
        <div class="prompt-card">
          <p class="eyebrow">${escapeHtml(item.unit)}</p>
          <div class="reading">${escapeHtml(item.reading)}</div>
          <p class="prompt-text">${escapeHtml(item.prompt || '読みを見て、送り仮名までふくめて漢字を書きます。')}</p>
          ${readingGuideHtml(item)}
        </div>
        <div class="study-focus-card">
          <div class="study-focus-main">
            <p class="eyebrow">正解</p>
            <strong>${escapeHtml(item.answer)}</strong>
            <span class="study-focus-reading">${escapeHtml(item.reading)}</span>
          </div>
          ${item.onReading || item.kunReading ? `
            <div class="study-yomi">
              ${item.onReading ? `<div class="study-yomi-row"><span class="yomi-badge on">音</span><b>${escapeHtml(item.onReading)}</b></div>` : ''}
              ${item.kunReading ? `<div class="study-yomi-row"><span class="yomi-badge kun">訓</span><b>${escapeHtml(item.kunReading)}</b></div>` : ''}
            </div>
          ` : ''}
          ${refWordsHtml(item)}
          ${answerExampleText(item) ? `<p class="study-example">例文: ${escapeHtml(answerExampleText(item))}</p>` : ''}
        </div>
        ${studyPadHtml(session)}
      </div>
      <aside class="side-panel study-side">
        ${sessionProgressHtml(session)}
        ${grade ? gradeHtml(grade, item) : `
          <div class="feedback-box calm">
            <p class="eyebrow">Study Check</p>
            <h3>書いたら採点できます。</h3>
          </div>
        `}
        <div class="study-action-card">
          <button class="${gradeButtonClass}" data-study-grade type="button" ${session.grading || session.submitting ? 'disabled' : ''}>
            <span aria-hidden="true">○</span>${session.grading ? '採点中' : grade ? 'もう一度採点' : '採点する'}
          </button>
          <button class="${nextButtonClass}" data-study-pass type="button" ${session.submitting ? 'disabled' : ''}>
            <span aria-hidden="true">→</span>次の漢字へ
          </button>
          <button class="button ghost full" data-prev-item type="button" ${session.index <= 0 ? 'disabled' : ''}>
            <span aria-hidden="true">←</span>前の問題へ
          </button>
          <button class="button secondary full" data-study-repeat type="button" ${session.submitting ? 'disabled' : ''}>
            <span aria-hidden="true">↻</span>もう一回出す
          </button>
          <button class="button ghost full" id="endSession" type="button">終了</button>
        </div>
      </aside>
    </div>
  `;
  mountPad('studyPad', session.savedStrokes);
}

function studyPadHtml(session) {
  const disabled = session?.submitting || session?.grading ? 'disabled' : '';
  const hasGrade = Boolean(session?.currentGrade);
  return `
    <div class="pad-shell study-pad-shell">
      <div class="pad-toolbar">
        <strong>練習キャンバス</strong>
        <div class="pad-actions">
          <button class="button small" data-pad-undo="studyPad" type="button"><span aria-hidden="true">↶</span>一画戻す</button>
          <button class="button small" data-pad-clear="studyPad" type="button"><span aria-hidden="true">⌫</span>消す</button>
          <button class="button small primary" data-study-grade type="button" ${disabled}><span aria-hidden="true">○</span>${hasGrade ? '再採点' : '採点'}</button>
        </div>
      </div>
      <canvas class="writing-pad" id="studyPad" width="960" height="520"></canvas>
      <div class="study-bottom-actions">
        <button class="button primary full" data-study-grade type="button" ${disabled}><span aria-hidden="true">○</span>${session?.grading ? '採点中' : hasGrade ? 'もう一度採点' : '採点する'}</button>
        <button class="${hasGrade ? 'button primary full' : 'button secondary full'}" data-study-pass type="button" ${disabled}><span aria-hidden="true">→</span>次の漢字へ</button>
        <button class="button ghost full" data-prev-item type="button" ${session?.index <= 0 ? 'disabled' : ''}><span aria-hidden="true">←</span>前の問題へ</button>
        <button class="button secondary full" data-study-repeat type="button" ${disabled}><span aria-hidden="true">↻</span>もう一回出す</button>
      </div>
    </div>
  `;
}

function padHtml(id, label) {
  return `
    <div class="pad-shell">
      <div class="pad-toolbar">
        <strong>${label}</strong>
        <div class="pad-actions">
          <button class="button small" data-pad-undo="${id}" type="button"><span aria-hidden="true">↶</span>一画戻す</button>
          <button class="button small" data-pad-clear="${id}" type="button"><span aria-hidden="true">⌫</span>消す</button>
        </div>
      </div>
      <canvas class="writing-pad" id="${id}" width="960" height="520"></canvas>
    </div>
  `;
}

function renderTest() {
  const root = $('#testWorkbench');
  const session = state.session?.mode === 'test' ? state.session : null;
  if (!session || session.finished) {
    root.innerHTML = finishedHtml('テスト完了', '間違えた問題は復習待ちに残ります。ホームから「間違いだけ」を押すと再開できます。');
    return;
  }

  const item = session.queue[session.index];
  if (!item) {
    session.finished = true;
    loadBootstrap();
    renderTest();
    return;
  }

  const grade = session.currentGrade;
  root.innerHTML = `
    <div class="session-shell">
      <div class="question-panel">
        <div class="prompt-card">
          <p class="eyebrow">${escapeHtml(item.unit)}</p>
          <div class="reading">${escapeHtml(item.reading)}</div>
          <p class="prompt-text">${escapeHtml(item.prompt || '読みを見て、送り仮名までふくめて漢字で書いてください。')}</p>
          ${questionExampleText(item) ? `<p class="prompt-example">例文: ${escapeHtml(questionExampleText(item))}</p>` : ''}
        </div>
        ${padHtml('testPad', '解答キャンバス')}
      </div>
      <aside class="side-panel">
        ${sessionProgressHtml(session)}
        ${grade ? gradeHtml(grade, item) : `
          <div class="feedback-box calm">
            <p class="eyebrow">Test</p>
            <h3>書けたら採点します。</h3>
          </div>
        `}
        ${grade ? '<button class="button primary full" id="nextTestItem" type="button"><span aria-hidden="true">→</span>次へ</button>' : `<button class="button primary full hero-action" id="gradeButton" type="button" ${session.grading ? 'disabled' : ''}><span aria-hidden="true">○</span>${session.grading ? '採点中' : '採点する'}</button>`}
        <button class="button ghost full" data-prev-item type="button" ${session.index <= 0 ? 'disabled' : ''}><span aria-hidden="true">←</span>前の問題へ</button>
        <button class="button ghost full" id="endSession" type="button">終了</button>
      </aside>
    </div>
  `;
  mountPad('testPad', session.savedStrokes);
}

function renderFlashcards() {
  const root = $('#flashcardWorkbench');
  if (!root) return;
  const session = state.session?.mode === 'flashcards' ? state.session : null;
  if (!session) {
    root.innerHTML = flashcardFinishedHtml('復習カードを始めます', 'ホームの「復習カード」から、間違えた問題だけを短く確認できます。', true);
    return;
  }

  if (session.empty) {
    root.innerHTML = flashcardFinishedHtml('復習カードはありません', '間違えた問題が出ると、ここに自動でカード化されます。', true);
    return;
  }

  if (session.finished) {
    root.innerHTML = flashcardFinishedHtml('復習カード完了', '「覚えた」にした問題は定着へ進み、「もう一回」にした問題は同じ回の後ろに戻しました。');
    return;
  }

  const item = session.queue[session.index];
  if (!item) {
    session.finished = true;
    renderFlashcards();
    return;
  }

  const showAnswer = Boolean(session.showAnswer);
  const promptText = item.prompt || '読みを見て、答えの漢字を思い出してください。';
  root.innerHTML = `
    <div class="session-shell flashcard-shell">
      <div class="flashcard-stage">
        <div class="flashcard-topline">
          <div class="meta">
            <span class="tag">${escapeHtml(item.unit)}</span>
            <span class="tag blue">${escapeHtml(item.level || '未設定')}</span>
            ${item.progress?.wrong ? `<span class="tag red">間違い ${item.progress.wrong}回</span>` : ''}
            ${item.retry ? `<span class="tag red">もう一回 ${item.retry}回目</span>` : ''}
          </div>
          <span class="flashcard-count">${Math.min(session.index + 1, session.queue.length)} / ${session.queue.length}</span>
        </div>
        <article class="flashcard-card ${showAnswer ? 'is-back' : ''}">
          <div class="flashcard-label">${showAnswer ? 'Answer' : 'Question'}</div>
          ${showAnswer ? `
            <div class="flashcard-answer-grid">
              <div class="flashcard-answer">${escapeHtml(item.answer)}</div>
            </div>
            <div class="flashcard-back-copy">
              <strong>${escapeHtml(item.reading)}</strong>
              ${readingGuideHtml(item)}
              ${refWordsHtml(item)}
              ${answerExampleText(item) ? `<small>例文: ${escapeHtml(answerExampleText(item))}</small>` : ''}
            </div>
          ` : `
            <div class="flashcard-reading">${escapeHtml(item.reading)}</div>
            <p class="flashcard-prompt">${escapeHtml(promptText)}</p>
            ${questionExampleText(item) ? `<div class="flashcard-example">例文: ${escapeHtml(questionExampleText(item))}</div>` : ''}
          `}
        </article>
        <div class="flashcard-actions">
          <button class="button ${showAnswer ? 'ghost' : 'primary hero-action'}" data-flip-card type="button">
            <span aria-hidden="true">${showAnswer ? '◐' : '○'}</span>${showAnswer ? '問題に戻る' : '答えを見る'}
          </button>
          <button class="button danger hero-action" data-card-repeat type="button" ${!showAnswer || session.submitting ? 'disabled' : ''}>
            <span aria-hidden="true">↻</span>もう一回
          </button>
          <button class="button primary hero-action" data-card-pass type="button" ${!showAnswer || session.submitting ? 'disabled' : ''}>
            <span aria-hidden="true">✓</span>覚えた
          </button>
        </div>
        ${padHtml('flashcardPad', '練習メモ（※採点はされません）')}
      </div>
      <aside class="side-panel flashcard-side">
        ${sessionProgressHtml(session)}
        <div class="feedback-box calm">
          <p class="eyebrow">Flashcard</p>
          <h3>${showAnswer ? '覚えていたか選びます。' : '頭の中で答えてから確認します。'}</h3>
          <p>${showAnswer ? '不安なら「もう一回」。できたら「覚えた」で次に進みます。' : '手書きせずに、移動時間でも苦手だけを高速チェックできます。'}</p>
        </div>
        <button class="button ghost full" data-prev-item type="button" ${session.index <= 0 ? 'disabled' : ''}>
          <span aria-hidden="true">←</span>前のカードへ
        </button>
        <button class="button ghost full" id="endSession" type="button">終了</button>
      </aside>
    </div>
  `;
  mountPad('flashcardPad', session.savedStrokes);
}

function gradeHtml(grade, item) {
  const passed = grade.passed;
  return `
    <div class="feedback-box ${passed ? 'pass' : 'fail'}">
      <p class="eyebrow">${grade.gradingMethod === 'self' ? '自分で採点' : '形の目安'}</p>
      <div class="score-mark">
        <strong>${passed ? '○' : '×'}</strong>
        <span>${grade.score}<small>点</small></span>
      </div>
      <p>${escapeHtml(grade.feedback || '')}</p>
      <div class="answer-reveal">
        <strong>${escapeHtml(item.answer)}</strong>
      </div>
      ${grade.attemptId ? `
      <div class="self-grade">
        <p class="self-grade-note">点数は目安です。書いた字とお手本を見くらべて、どちらかを押してください。</p>
        <div class="self-grade-buttons">
          <button class="button small ${passed ? 'primary' : 'secondary'}" data-verdict="ok" data-attempt="${grade.attemptId}" type="button">○ 書けていた</button>
          <button class="button small ${passed ? 'secondary' : 'danger'}" data-verdict="ng" data-attempt="${grade.attemptId}" type="button">× まちがい</button>
        </div>
      </div>` : ''}
    </div>
  `;
}

function flashcardFinishedHtml(title, text, empty = false) {
  return `
    <div class="panel flashcard-done-panel">
      <p class="eyebrow">${empty ? 'Ready' : 'Finished'}</p>
      <h2>${title}</h2>
      <p class="hint">${text}</p>
      <div class="quick-actions">
        <button class="button primary" data-view-jump="dashboard" type="button"><span aria-hidden="true">⌂</span>ホームへ</button>
        <button class="button gold" id="startFlashcardsAgain" type="button"><span aria-hidden="true">□</span>復習カードを開く</button>
        <button class="button danger" id="startWrongTestAgain" type="button"><span aria-hidden="true">!</span>間違いだけテスト</button>
      </div>
    </div>
  `;
}

function finishedHtml(title, text) {
  return `
    <div class="panel">
      <p class="eyebrow">Finished</p>
      <h2>${title}</h2>
      <p class="hint">${text}</p>
      <div class="quick-actions">
        <button class="button primary" data-view-jump="dashboard" type="button"><span aria-hidden="true">⌂</span>ホームへ</button>
        <button class="button danger" id="startWrongTestAgain" type="button"><span aria-hidden="true">!</span>間違いだけ続ける</button>
      </div>
    </div>
  `;
}

class WritingPad {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.strokes = [];
    this.current = null;
    this.resize();
    this.bind();
    this.redraw();
  }

  resize() {
    const rect = this.canvas.getBoundingClientRect();
    const dpr = Math.max(1, window.devicePixelRatio || 1);
    this.canvas.width = Math.round(rect.width * dpr);
    this.canvas.height = Math.round(rect.height * dpr);
    this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    this.width = rect.width;
    this.height = rect.height;
  }

  bind() {
    this.canvas.addEventListener('pointerdown', (event) => {
      event.preventDefault();
      document.body.classList.add('is-writing');
      this.canvas.setPointerCapture(event.pointerId);
      this.current = [this.point(event)];
      this.redraw();
    });
    this.canvas.addEventListener('pointermove', (event) => {
      if (!this.current) return;
      event.preventDefault();
      this.current.push(this.point(event));
      this.redraw();
    });
    const finish = (event) => {
      event?.preventDefault?.();
      if (this.current?.length) this.strokes.push(this.current);
      this.current = null;
      document.body.classList.remove('is-writing');
      this.redraw();
    };
    this.canvas.addEventListener('pointerup', finish);
    this.canvas.addEventListener('pointercancel', finish);
    ['touchstart', 'touchmove', 'touchend', 'touchcancel'].forEach((type) => {
      this.canvas.addEventListener(type, (event) => event.preventDefault(), { passive: false });
    });
    this.canvas.addEventListener('contextmenu', (event) => event.preventDefault());
  }

  point(event) {
    const rect = this.canvas.getBoundingClientRect();
    return { x: event.clientX - rect.left, y: event.clientY - rect.top };
  }

  clear() {
    this.strokes = [];
    this.current = null;
    this.redraw();
  }

  undo() {
    this.strokes.pop();
    this.redraw();
  }

  redraw() {
    const ctx = this.ctx;
    ctx.clearRect(0, 0, this.width, this.height);
    ctx.save();
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.strokeStyle = '#202124';
    ctx.lineWidth = Math.max(9, Math.min(16, this.width / 48));
    [...this.strokes, this.current].filter(Boolean).forEach((stroke) => {
      ctx.beginPath();
      stroke.forEach((point, index) => {
        if (index === 0) ctx.moveTo(point.x, point.y);
        else ctx.lineTo(point.x, point.y);
      });
      ctx.stroke();
    });
    ctx.restore();
  }
}

function cloneStrokes(strokes) {
  return (strokes || []).map((stroke) => stroke.map((point) => ({ ...point })));
}

function mountPad(id, strokes = []) {
  const canvas = document.getElementById(id);
  if (!canvas) return;
  state.pad = new WritingPad(canvas);
  if (strokes.length) {
    state.pad.strokes = cloneStrokes(strokes);
    state.pad.redraw();
  }
}

function allPoints(strokes) {
  return strokes.flat();
}

function strokeBounds(strokes) {
  const points = allPoints(strokes);
  if (!points.length) return null;
  const xs = points.map((p) => p.x);
  const ys = points.map((p) => p.y);
  return {
    minX: Math.min(...xs),
    minY: Math.min(...ys),
    maxX: Math.max(...xs),
    maxY: Math.max(...ys)
  };
}

function offscreen(width, height) {
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  return canvas;
}

function drawNormalizedStrokes(strokes, width, height) {
  const canvas = offscreen(width, height);
  const ctx = canvas.getContext('2d');
  ctx.fillStyle = '#fff';
  ctx.fillRect(0, 0, width, height);
  const bounds = strokeBounds(strokes);
  if (!bounds) return canvas;
  const pad = 18;
  const sourceW = Math.max(1, bounds.maxX - bounds.minX);
  const sourceH = Math.max(1, bounds.maxY - bounds.minY);
  const scale = Math.min((width - pad * 2) / sourceW, (height - pad * 2) / sourceH);
  const offsetX = (width - sourceW * scale) / 2 - bounds.minX * scale;
  const offsetY = (height - sourceH * scale) / 2 - bounds.minY * scale;
  ctx.strokeStyle = '#000';
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  ctx.lineWidth = 12;
  strokes.forEach((stroke) => {
    ctx.beginPath();
    stroke.forEach((point, index) => {
      const x = point.x * scale + offsetX;
      const y = point.y * scale + offsetY;
      if (index === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    });
    ctx.stroke();
  });
  return canvas;
}

function drawTarget(answer, width, height) {
  const canvas = offscreen(width, height);
  const ctx = canvas.getContext('2d');
  ctx.fillStyle = '#fff';
  ctx.fillRect(0, 0, width, height);
  ctx.fillStyle = '#000';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  const count = Math.max(1, [...answer].length);
  const fontSize = count <= 1 ? 210 : Math.min(150, Math.floor(width / (count * 0.8)));
  ctx.font = `700 ${fontSize}px "BIZ UDPMincho", "Yu Mincho", serif`;
  ctx.fillText(answer, width / 2, height / 2 + fontSize * 0.04);
  return canvas;
}

function toMask(canvas, cols = 64, rows = 40) {
  const small = offscreen(cols, rows);
  const ctx = small.getContext('2d');
  ctx.drawImage(canvas, 0, 0, cols, rows);
  const data = ctx.getImageData(0, 0, cols, rows).data;
  const mask = new Uint8Array(cols * rows);
  for (let i = 0; i < cols * rows; i += 1) {
    const r = data[i * 4];
    const g = data[i * 4 + 1];
    const b = data[i * 4 + 2];
    mask[i] = (r + g + b) / 3 < 205 ? 1 : 0;
  }
  return { mask, cols, rows };
}

function dilate(maskObj, radius = 1) {
  const { mask, cols, rows } = maskObj;
  const out = new Uint8Array(mask.length);
  for (let y = 0; y < rows; y += 1) {
    for (let x = 0; x < cols; x += 1) {
      const idx = y * cols + x;
      if (!mask[idx]) continue;
      for (let dy = -radius; dy <= radius; dy += 1) {
        for (let dx = -radius; dx <= radius; dx += 1) {
          const nx = x + dx;
          const ny = y + dy;
          if (nx >= 0 && nx < cols && ny >= 0 && ny < rows) out[ny * cols + nx] = 1;
        }
      }
    }
  }
  return { mask: out, cols, rows };
}

function count(mask) {
  return mask.reduce((sum, bit) => sum + bit, 0);
}

function intersection(a, b) {
  let total = 0;
  for (let i = 0; i < a.length; i += 1) if (a[i] && b[i]) total += 1;
  return total;
}

function maskBounds(maskObj) {
  const { mask, cols, rows } = maskObj;
  let minX = cols;
  let minY = rows;
  let maxX = -1;
  let maxY = -1;
  for (let y = 0; y < rows; y += 1) {
    for (let x = 0; x < cols; x += 1) {
      if (!mask[y * cols + x]) continue;
      minX = Math.min(minX, x);
      minY = Math.min(minY, y);
      maxX = Math.max(maxX, x);
      maxY = Math.max(maxY, y);
    }
  }
  if (maxX < 0) return null;
  return { minX, minY, maxX, maxY, width: maxX - minX + 1, height: maxY - minY + 1 };
}

function maskCenter(maskObj) {
  const { mask, cols, rows } = maskObj;
  let sx = 0;
  let sy = 0;
  let total = 0;
  for (let y = 0; y < rows; y += 1) {
    for (let x = 0; x < cols; x += 1) {
      if (mask[y * cols + x]) {
        sx += x;
        sy += y;
        total += 1;
      }
    }
  }
  return total ? { cx: sx / total / cols, cy: sy / total / rows, total } : null;
}

const LOW_STROKE_KANJI = new Set([
  '一','二','三','四','五','六','七','八','九','十',
  '人','入','大','小','上','下','中','口','日','月','火','水','木','金','土',
  '川','山','子','女','力','刀','工','士','千','干','弓','刃','刈','刊','刑',
  '丁','九','七','二','八','九','匹','匂','勺','凡','也','已','弔','屯',
  '心','戸','戈','支','互','井','与','夕','寸','才','円','元','文','方',
  '父','分','切','区','少','王','犬','化','仁','介','今','内','双','反','友',
  '及','収','匠','卯','卞','厄','叉','只','尺','屯','幻','弁','戸','支',
  '比','片','牙','牛','犯','玉','瓦','甘','生','用','田','由','甲','申','白',
  '皮','皿','目','矛','矢','石','示','禾','穴','立','瓜','末','本'
]);

function isLowStrokeItem(item) {
  const expected = Number(item?.expectedStrokes);
  if (Number.isFinite(expected) && expected > 0) return expected <= 3;
  if (!item?.answer) return false;
  const chars = [...item.answer];
  return chars.length === 1 && LOW_STROKE_KANJI.has(chars[0]);
}

const GRADE_PROFILES = {
  study:  { passScore: 60, coverage: 0.46, precision: 0.40, areaMin: 0.35, areaMax: 2.5, size: 0.20, center: 0.50, aspect: 0.50 },
  normal: { passScore: 72, coverage: 0.55, precision: 0.48, areaMin: 0.45, areaMax: 2.1, size: 0.25, center: 0.55, aspect: 0.55 },
  strict: { passScore: 80, coverage: 0.60, precision: 0.52, areaMin: 0.50, areaMax: 1.9, size: 0.30, center: 0.60, aspect: 0.60 }
};

function gradeProfile(settings, isLow) {
  const mode = settings?.gradeMode && GRADE_PROFILES[settings.gradeMode] ? settings.gradeMode : 'normal';
  const base = { ...GRADE_PROFILES[mode] };
  if (Number.isFinite(Number(settings?.passScore))) base.passScore = Number(settings.passScore);
  if (!isLow) return base;
  return {
    passScore: Math.max(40, base.passScore - 6),
    coverage: Math.max(0.30, base.coverage - 0.10),
    precision: Math.max(0.32, base.precision - 0.06),
    areaMin: Math.max(0.20, base.areaMin - 0.10),
    areaMax: base.areaMax + 0.4,
    size: Math.max(0.15, base.size - 0.05),
    center: Math.max(0.40, base.center - 0.05),
    aspect: Math.max(0.40, base.aspect - 0.05)
  };
}

function buildSingleFeedback({ char, signals, gates, passed }) {
  if (passed) return signals.aspectScore > 0.7 ? `「${char}」の形がきれいに整っています。` : `「${char}」よく書けています。`;
  if (signals.coverage < 0.45) return `「${char}」の線や部品が足りないかも。正解の字と見比べましょう。`;
  if (signals.precision < 0.40) return '余分な線がはみ出ているかも。中央にすっきり書いてみましょう。';
  if (signals.areaRatio > 2.2) return '線の量が多すぎます。重ね書きを減らしましょう。';
  if (signals.areaRatio < 0.45) return '線の量が少ないです。書き足りない部品がないか確認しましょう。';
  if (signals.centerScore < 0.55) return '字が中央からずれています。マスの真ん中に書いてください。';
  if (signals.aspectScore < 0.55) return '縦横のバランスが合っていません。';
  if (signals.sizeScore < 0.30) return 'マスいっぱいに大きく書いてみてください。';
  if (gates && gates.strokeMatch === false && signals.expectedStrokes) {
    return `画数が違うかも（書いた数 ${signals.strokeCount} / 目安 ${signals.expectedStrokes}画）。`;
  }
  return 'あと少しです。形と位置を整えてみましょう。';
}

function buildCompoundFeedback(charScores, passed) {
  if (passed) return '熟語のすべての文字が正解に近い形で書けています。';
  const missing = charScores.filter((c) => c.missing);
  if (missing.length) {
    return `${missing.map((c) => `「${c.char}」`).join('・')} がまだ書けていません。`;
  }
  const failed = charScores.filter((c) => !c.passed);
  if (failed.length) {
    const worst = failed.reduce((a, b) => (a.score < b.score ? a : b));
    return `${failed.map((c) => `「${c.char}」`).join('・')} の形がまだ違うようです（${worst.char}: ${worst.score}点）。`;
  }
  return 'もう少し正確に書いてみましょう。';
}

function gradeSingleChar(char, strokes, { settings = {}, expectedStrokes = null, item = null } = {}) {
  const width = 320;
  const height = 220;
  const userCanvas = drawNormalizedStrokes(strokes, width, height);
  const targetCanvas = drawTarget(char, width, height);
  const user = toMask(userCanvas);
  const target = toMask(targetCanvas);
  const userDilated = dilate(user, 2);
  const targetDilated = dilate(target, 2);
  const userCount = count(user.mask);
  const targetCount = count(target.mask);
  const coverage = targetCount ? intersection(target.mask, userDilated.mask) / targetCount : 0;
  const precision = userCount ? intersection(user.mask, targetDilated.mask) / userCount : 0;
  const areaRatio = targetCount ? userCount / targetCount : 0;
  const areaScore = areaRatio > 0 ? Math.max(0, 1 - Math.abs(Math.log(areaRatio)) / Math.log(3)) : 0;
  const ub = maskBounds(user);
  const tb = maskBounds(target);
  const sizeScore = ub && tb
    ? Math.max(0, 1 - (Math.abs(ub.width - tb.width) / Math.max(tb.width, 1) + Math.abs(ub.height - tb.height) / Math.max(tb.height, 1)) / 2)
    : 0;
  const aspectScore = ub && tb
    ? Math.max(0, 1 - Math.abs((ub.width / Math.max(1, ub.height)) - (tb.width / Math.max(1, tb.height))) / 1.6)
    : 0;
  const userCenter = maskCenter(user);
  const targetCenter = maskCenter(target);
  const centerScore = userCenter && targetCenter
    ? Math.max(0, 1 - Math.hypot(userCenter.cx - targetCenter.cx, userCenter.cy - targetCenter.cy) / 0.4)
    : 0;
  const expected = Number(expectedStrokes) || (Number(item?.expectedStrokes) || null);
  const strokeScore = expected
    ? Math.max(0.45, 1 - Math.abs(strokes.length - expected) / Math.max(expected, 8))
    : 0.86;

  const isLow = isLowStrokeItem(item || { answer: char, expectedStrokes: expected });
  const profile = gradeProfile(settings, isLow);

  const score = Math.round(100 * (
    coverage * 0.40 +
    precision * 0.24 +
    sizeScore * 0.10 +
    areaScore * 0.10 +
    centerScore * 0.08 +
    aspectScore * 0.04 +
    strokeScore * 0.04
  ));

  const gates = {
    coverage: coverage >= profile.coverage,
    precision: precision >= profile.precision,
    area: areaRatio >= profile.areaMin && areaRatio <= profile.areaMax,
    size: sizeScore >= profile.size,
    center: centerScore >= profile.center,
    aspect: aspectScore >= profile.aspect
  };
  if (isLow && expected) gates.strokeMatch = Math.abs(strokes.length - expected) <= 1;

  const passed = score >= profile.passScore && Object.values(gates).every((value) => value !== false);
  const signals = {
    coverage: Number(coverage.toFixed(3)),
    precision: Number(precision.toFixed(3)),
    areaRatio: Number(areaRatio.toFixed(3)),
    areaScore: Number(areaScore.toFixed(3)),
    sizeScore: Number(sizeScore.toFixed(3)),
    centerScore: Number(centerScore.toFixed(3)),
    aspectScore: Number(aspectScore.toFixed(3)),
    strokeScore: Number(strokeScore.toFixed(3)),
    strokeCount: strokes.length,
    expectedStrokes: expected,
    isLowStroke: isLow,
    pointCount: allPoints(strokes).length
  };
  const feedback = buildSingleFeedback({ char, signals, gates, passed });

  return { char, score, passed, recognition: char, feedback, signals, gates };
}

function splitStrokesForCompound(strokes, charCount) {
  const all = strokeBounds(strokes);
  if (!all || charCount <= 1) return [strokes];
  const slotW = (all.maxX - all.minX) / charCount;
  const slots = Array.from({ length: charCount }, () => []);
  strokes.forEach((stroke) => {
    const center = stroke.reduce((sum, p) => sum + p.x, 0) / stroke.length;
    let idx = slotW > 0 ? Math.floor((center - all.minX) / slotW) : 0;
    if (idx < 0) idx = 0;
    if (idx >= charCount) idx = charCount - 1;
    slots[idx].push(stroke);
  });
  return slots;
}

function calculateClientGrade(item, pad) {
  const strokes = pad?.strokes || [];
  const pointCount = allPoints(strokes).length;
  if (pointCount < 8) {
    return {
      score: 0,
      passed: false,
      recognition: '',
      feedback: 'まだほとんど書かれていません。大きく書いてから採点してください。',
      signals: { pointCount, strokeCount: strokes.length }
    };
  }

  const settings = state.settings || {};
  const chars = [...(item.answer || '')];
  const isCompound = chars.length >= 2;

  if (!isCompound) {
    return gradeSingleChar(item.answer, strokes, { settings, expectedStrokes: item.expectedStrokes, item });
  }

  const slots = splitStrokesForCompound(strokes, chars.length);
  const charScores = chars.map((char, idx) => {
    const charStrokes = slots[idx] || [];
    if (!charStrokes.length || allPoints(charStrokes).length < 4) {
      return {
        char,
        score: 0,
        passed: false,
        missing: true,
        signals: { strokeCount: charStrokes.length, pointCount: allPoints(charStrokes).length },
        feedback: `「${char}」がまだ書かれていません。`
      };
    }
    return gradeSingleChar(char, charStrokes, { settings });
  });

  const valid = charScores.filter((c) => !c.missing);
  const avg = valid.length ? valid.reduce((sum, c) => sum + c.score, 0) / valid.length : 0;
  const min = valid.length ? Math.min(...valid.map((c) => c.score)) : 0;
  const allPassed = charScores.every((c) => c.passed);
  const score = Math.round(avg * 0.7 + min * 0.3);
  const profile = gradeProfile(settings, false);
  const passed = allPassed && score >= profile.passScore && min >= Math.max(45, profile.passScore - 18);
  const feedback = buildCompoundFeedback(charScores, passed);

  return {
    score,
    passed,
    recognition: item.answer,
    feedback,
    signals: {
      compound: true,
      avgScore: Math.round(avg),
      minScore: Math.round(min),
      charScores: charScores.map((c) => ({ char: c.char, score: c.score, passed: c.passed, missing: Boolean(c.missing) })),
      strokeCount: strokes.length,
      pointCount
    }
  };
}

function gradeCurrent() {
  const session = state.session;
  const item = session?.queue[session.index];
  if (!session || !item || session.grading) return;
  session.savedStrokes = cloneStrokes(state.pad?.strokes || []);
  session.grading = true;
  const clientGrade = calculateClientGrade(item, state.pad);
  try {
    const finalGrade = {
      provider: 'shape',
      score: clientGrade.score,
      passed: clientGrade.passed,
      recognition: clientGrade.recognition,
      feedback: clientGrade.feedback
    };
    session.currentGrade = finalGrade;
    const savedAttempt = window.KanjiDB.recordAttempt({
      learnerId: state.currentLearnerId,
      itemId: item.id,
      mode: 'test',
      score: finalGrade.score,
      passed: finalGrade.passed,
      recognition: finalGrade.recognition,
      feedback: finalGrade.feedback,
      strokeCount: clientGrade.signals?.strokeCount || 0,
      gradingMethod: 'shape',
      durationMs: Date.now() - session.startedAt
    });
    finalGrade.attemptId = savedAttempt && savedAttempt.attempt ? savedAttempt.attempt.id : null;
    if (finalGrade.passed) session.passSeen += 1;
    else {
      session.wrongSeen += 1;
      if (state.settings?.repeatWrongImmediately) {
        session.queue.push({ ...item, retry: (item.retry || 0) + 1 });
      }
    }
  } catch (error) {
    toast(error.message);
  } finally {
    session.grading = false;
    renderTest();
  }
}

function gradeStudyCurrent() {
  const session = state.session;
  const item = session?.queue[session.index];
  if (!session || !item || session.grading || session.submitting) return;
  const strokes = cloneStrokes(state.pad?.strokes || []);
  const clientGrade = calculateClientGrade(item, { strokes });
  session.savedStrokes = strokes;
  session.grading = true;
  renderStudy();
  try {
    session.currentGrade = {
      provider: 'shape',
      score: clientGrade.score,
      passed: clientGrade.passed,
      recognition: clientGrade.recognition,
      feedback: clientGrade.feedback
    };
  } catch (error) {
    toast(error.message);
  } finally {
    session.grading = false;
    renderStudy();
  }
}

function nextTestItem() {
  const session = state.session;
  if (!session) return;
  session.index += 1;
  session.currentGrade = null;
  session.savedStrokes = [];
  session.startedAt = Date.now();
  if (session.index >= session.queue.length) session.finished = true;
  renderTest();
}

function previousSessionItem() {
  const session = state.session;
  if (!session || session.index <= 0) return;
  session.index -= 1;
  session.currentGrade = null;
  session.showAnswer = false;
  session.savedStrokes = [];
  session.startedAt = Date.now();
  if (session.mode === 'study') renderStudy();
  else if (session.mode === 'flashcards') renderFlashcards();
  else renderTest();
}

function rememberStudy(passed) {
  const session = state.session;
  const item = session?.queue[session.index];
  if (!session || !item || session.submitting) return;
  const grade = session.currentGrade;
  const strokes = cloneStrokes(session.savedStrokes?.length ? session.savedStrokes : state.pad?.strokes || []);
  const finalPassed = passed && grade ? grade.passed : passed;
  const score = grade && passed ? grade.score : (passed ? 80 : 30);
  const feedback = grade?.feedback || (passed ? '学習編で次へ進みました' : '学習編でもう一回にしました');
  session.submitting = true;
  renderStudy();
  try {
    window.KanjiDB.recordAttempt({
      learnerId: state.currentLearnerId,
      itemId: item.id,
      mode: 'study',
      score,
      passed: finalPassed,
      recognition: grade?.recognition || item.answer,
      feedback,
      strokeCount: strokes.length,
      gradingMethod: grade?.provider || 'self',
      durationMs: Date.now() - session.startedAt
    });
    if (finalPassed) session.passSeen += 1;
    else {
      session.wrongSeen += 1;
      session.queue.push(item);
    }
    session.index += 1;
    session.startedAt = Date.now();
    session.currentGrade = null;
    session.savedStrokes = [];
    session.submitting = false;
    if (session.index >= session.queue.length) session.finished = true;
    renderStudy();
  } catch (error) {
    session.submitting = false;
    toast(error.message);
    renderStudy();
  }
}

function answerFlashcard(passed) {
  const session = state.session;
  const item = session?.queue[session.index];
  if (!session || session.mode !== 'flashcards' || !item || session.submitting) return;
  session.submitting = true;
  try {
    window.KanjiDB.recordAttempt({
      learnerId: state.currentLearnerId,
      itemId: item.id,
      mode: 'flashcard',
      score: passed ? 88 : 25,
      passed,
      recognition: item.answer,
      feedback: passed ? '復習カードで覚えた' : '復習カードでもう一回にした',
      strokeCount: 0,
      gradingMethod: 'flashcard',
      durationMs: Date.now() - session.startedAt
    });
    if (passed) session.passSeen += 1;
    else {
      session.wrongSeen += 1;
      session.queue.push({ ...item, retry: (item.retry || 0) + 1 });
    }
    session.index += 1;
    session.startedAt = Date.now();
    session.showAnswer = false;
    session.submitting = false;
    session.savedStrokes = [];
    if (session.index >= session.queue.length) {
      session.finished = true;
      loadBootstrap();
      return;
    }
    renderFlashcards();
  } catch (error) {
    session.submitting = false;
    toast(error.message);
    renderFlashcards();
  }
}

function loadReport() {
  const learner = currentLearner();
  if (!learner) return;
  state.report = window.KanjiDB.getReports(learner.id, { level: state.selectedLevel || 'all', units: state.selectedUnits, itemIds: state.selectedItemIds });
  renderReport();
}

function renderReport() {
  const root = $('#reportGrid');
  const report = state.report;
  if (!report) {
    root.innerHTML = '<div class="empty">成績を読み込み中です。</div>';
    return;
  }
  const byUnit = Object.entries(report.byUnit || {});
  root.innerHTML = `
    <div class="panel">
      <p class="eyebrow">Summary</p>
      <h2>${escapeHtml(currentLearner()?.name || '')} / ${escapeHtml(currentLevelLabel())} / ${escapeHtml(currentScopeLabel())}</h2>
      <div class="stat-grid" style="margin-top:14px">
        <div class="stat-card"><span>挑戦済み</span><strong>${report.summary.attempted}問</strong></div>
        <div class="stat-card"><span>復習待ち</span><strong>${report.summary.review}問</strong></div>
        <div class="stat-card"><span>定着中</span><strong>${report.summary.mastered}問</strong></div>
        <div class="stat-card"><span>直近正答率</span><strong>${report.summary.accuracy ?? '-'}%</strong></div>
      </div>
    </div>
    <div class="panel">
      <p class="eyebrow">Weak Points</p>
      <h2>間違いが多い漢字</h2>
      <div class="queue-list" style="margin-top:14px">
        ${report.weak.length ? report.weak.map(({ item, progress }) => `
          <article class="weak-row">
            <div>
              <strong>${escapeHtml(item.answer)}</strong>
              <div>${escapeHtml(item.reading)} / ${escapeHtml(item.unit)}</div>
            </div>
            <span class="tag red">${progress.wrong}回</span>
          </article>
        `).join('') : '<div class="empty">まだ苦手問題はありません。</div>'}
      </div>
    </div>
    <div class="panel" style="grid-column:1 / -1">
      <p class="eyebrow">Units</p>
      <h2>単元別の進み具合</h2>
      <div class="bar-list" style="margin-top:14px">
        ${byUnit.map(([unit, row]) => {
          const percent = row.total ? Math.round(row.mastered / row.total * 100) : 0;
          return `
            <div class="bar-row">
              <header><strong>${escapeHtml(unit)}</strong><span>${row.mastered}/${row.total} 定着 / 間違い ${row.wrong}</span></header>
              <div class="bar"><span style="width:${percent}%"></span></div>
            </div>
          `;
        }).join('')}
      </div>
    </div>
  `;
}

function downloadCsv() {
  const csv = window.KanjiDB.exportItemsCsv({ level: state.selectedLevel || 'all', units: state.selectedUnits, itemIds: state.selectedItemIds });
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = 'kanji_items.csv';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

function bindEvents() {
  document.addEventListener('click', (event) => {
    const verdict = event.target.closest('[data-verdict]');
    if (verdict) {
      const passed = verdict.dataset.verdict === 'ok';
      const res = window.KanjiDB.setVerdict(verdict.dataset.attempt, passed);
      if (res && state.session && state.session.currentGrade) {
        const was = state.session.currentGrade.passed;
        state.session.currentGrade.passed = passed;
        state.session.currentGrade.gradingMethod = 'self';
        state.session.currentGrade.feedback = passed ? '自分で「書けていた」にしました' : '自分で「まちがい」にしました';
        if (was !== passed) {
          if (passed) { state.session.passSeen += 1; state.session.wrongSeen = Math.max(0, state.session.wrongSeen - 1); }
          else { state.session.wrongSeen += 1; state.session.passSeen = Math.max(0, state.session.passSeen - 1); }
        }
        loadBootstrap();
      }
      return;
    }

    const copyDaily = event.target.closest('#copyDailyLine');
    if (copyDaily) { copyDailyLine(); return; }

    const nav = event.target.closest('[data-view]');
    if (nav) switchView(nav.dataset.view);

    const levelButton = event.target.closest('[data-level]');
    if (levelButton) {
      state.selectedLevel = levelButton.dataset.level;
      state.selectedUnits = [];
      state.selectedItemIds = [];
      state.itemPickSearch = '';
      state.session = null;
      state.report = null;
      loadBootstrap();
      if (state.view === 'report') loadReport();
    }

    if (event.target.closest('[data-scope-all]')) {
      state.selectedUnits = [];
      state.selectedItemIds = [];
      state.session = null;
      state.report = null;
      loadBootstrap();
      if (state.view === 'report') loadReport();
    }

    const unitButton = event.target.closest('[data-unit-scope]');
    if (unitButton) {
      const unit = unitButton.dataset.unitScope;
      state.selectedUnits = state.selectedUnits.includes(unit)
        ? state.selectedUnits.filter((row) => row !== unit)
        : state.selectedUnits.concat(unit);
      state.selectedItemIds = [];
      state.session = null;
      state.report = null;
      loadBootstrap();
      if (state.view === 'report') loadReport();
    }

    const pickKanji = event.target.closest('[data-pick-kanji]');
    if (pickKanji) {
      const id = pickKanji.dataset.pickKanji;
      state.selectedItemIds = state.selectedItemIds.includes(id)
        ? state.selectedItemIds.filter((row) => row !== id)
        : state.selectedItemIds.concat(id);
      state.session = null;
      state.report = null;
      loadBootstrap();
      if (state.view === 'report') loadReport();
    }

    const removeKanji = event.target.closest('[data-remove-kanji]');
    if (removeKanji) {
      state.selectedItemIds = state.selectedItemIds.filter((id) => id !== removeKanji.dataset.removeKanji);
      state.session = null;
      state.report = null;
      loadBootstrap();
      if (state.view === 'report') loadReport();
    }

    const limitButton = event.target.closest('[data-test-limit]');
    if (limitButton) {
      state.testLimit = limitButton.dataset.testLimit;
      localStorage.setItem('kanji.testLimit', state.testLimit);
      renderTestLimitTabs();
    }

    const modeButton = event.target.closest('[data-grade-mode]');
    if (modeButton) {
      const nextMode = modeButton.dataset.gradeMode;
      if (state.settings?.gradeMode !== nextMode) {
        persistSettings({ gradeMode: nextMode });
      }
    }

    const jump = event.target.closest('[data-view-jump]');
    if (jump) switchView(jump.dataset.viewJump);

    if (event.target.closest('#refreshButton') || event.target.closest('#reloadQueue')) loadBootstrap();
    if (event.target.closest('#startStudy')) prepareStudy();
    if (event.target.closest('#startDueTest')) prepareTest(false);
    if (event.target.closest('#startWrongTest') || event.target.closest('#startWrongTestAgain')) prepareTest(true);
    if (event.target.closest('#startFlashcards') || event.target.closest('#startFlashcardsAgain')) prepareFlashcards();
    if (event.target.closest('#gradeButton')) gradeCurrent();
    if (event.target.closest('[data-study-grade]')) gradeStudyCurrent();
    if (event.target.closest('#nextTestItem')) nextTestItem();
    if (event.target.closest('[data-prev-item]')) previousSessionItem();
    if (event.target.closest('#endSession')) {
      if (state.session) {
        state.session.finished = true;
        if (state.session.mode === 'study') renderStudy();
        else if (state.session.mode === 'flashcards') renderFlashcards();
        else renderTest();
      }
      loadBootstrap();
    }
    if (event.target.closest('[data-study-pass]')) rememberStudy(true);
    if (event.target.closest('[data-study-repeat]')) rememberStudy(false);
    if (event.target.closest('[data-flip-card]') && state.session?.mode === 'flashcards') {
      state.session.savedStrokes = cloneStrokes(state.pad?.strokes || []);
      state.session.showAnswer = !state.session.showAnswer;
      renderFlashcards();
    }
    if (event.target.closest('[data-card-pass]')) answerFlashcard(true);
    if (event.target.closest('[data-card-repeat]')) answerFlashcard(false);

    const single = event.target.closest('[data-single-test]');
    if (single) singleItemSession(single.dataset.singleTest);

    const selectLearner = event.target.closest('[data-select-learner]');
    if (selectLearner) {
      state.currentLearnerId = selectLearner.dataset.selectLearner;
      loadBootstrap();
      toast('生徒を切り替えました');
    }

    const deleteItem = event.target.closest('[data-delete-item]');
    if (deleteItem && confirm('この問題を削除しますか？')) {
      try {
        window.KanjiDB.deleteItem(deleteItem.dataset.deleteItem);
        loadBootstrap();
        toast('問題を削除しました');
      } catch (error) {
        toast(error.message);
      }
    }

    const exportButton = event.target.closest('#exportItemsButton');
    if (exportButton) {
      event.preventDefault();
      downloadCsv();
    }

    const undo = event.target.closest('[data-pad-undo]');
    if (undo) state.pad?.undo();
    const clear = event.target.closest('[data-pad-clear]');
    if (clear) {
      state.pad?.clear();
      if (state.session?.mode === 'study') {
        state.session.currentGrade = null;
        state.session.savedStrokes = [];
        renderStudy();
      }
    }
  });

  $('#learnerSelect').addEventListener('change', (event) => {
    state.currentLearnerId = event.target.value;
    state.session = null;
    loadBootstrap();
    if (state.view === 'report') loadReport();
  });

  $('#importForm').addEventListener('submit', (event) => {
    event.preventDefault();
    const unit = $('#importUnit').value;
    const text = $('#importText').value;
    try {
      const level = state.selectedLevel && state.selectedLevel !== 'all' ? state.selectedLevel : undefined;
      const result = window.KanjiDB.importItems({ unit, text, level });
      if (result.count && state.selectedUnits.length) {
        state.selectedUnits = [...new Set(state.selectedUnits.concat(unit))];
      }
      $('#importText').value = '';
      $('#importUnit').value = '';
      $('#importFile').value = '';
      loadBootstrap();
      toast(`${result.count}問を追加しました`);
    } catch (error) {
      toast(error.message);
    }
  });

  $('#importFile').addEventListener('change', async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    try {
      $('#importText').value = await file.text();
      toast('ファイル内容を貼り付け欄に読み込みました');
    } catch (error) {
      toast('ファイルを読み込めませんでした');
    }
  });

  $('#learnerForm').addEventListener('submit', (event) => {
    event.preventDefault();
    const name = $('#learnerName').value;
    const note = $('#learnerNote').value;
    try {
      const learner = window.KanjiDB.addLearner({ name, note });
      state.currentLearnerId = learner.id;
      $('#learnerName').value = '';
      $('#learnerNote').value = '';
      loadBootstrap();
      toast('生徒を追加しました');
    } catch (error) {
      toast(error.message);
    }
  });

  $('#itemSearch').addEventListener('input', (event) => {
    state.itemSearch = event.target.value;
    renderAdmin();
  });

  $('#kanjiSearchInput').addEventListener('input', (event) => {
    state.itemPickSearch = event.target.value;
    renderScopePicker();
  });

  document.addEventListener('input', (event) => {
    if (event.target.id === 'passScoreRange') {
      const value = Number(event.target.value);
      state.settings.passScore = value;
      renderDashboard();
      clearTimeout(bindEvents.scoreTimer);
      bindEvents.scoreTimer = setTimeout(() => persistSettings({ passScore: value }), 450);
    }
  });

  document.addEventListener('change', (event) => {
    if (event.target.id === 'repeatWrongToggle') persistSettings({ repeatWrongImmediately: event.target.checked });
  });

  document.addEventListener('touchmove', (event) => {
    if (document.body.classList.contains('is-writing')) event.preventDefault();
  }, { passive: false });

  window.addEventListener('resize', () => {
    if (state.pad) {
      const strokes = state.pad.strokes;
      state.pad.resize();
      state.pad.strokes = strokes;
      state.pad.redraw();
    }
  });
}

bindEvents();
try {
  loadBootstrap();
} catch (error) {
  toast(error.message);
}
