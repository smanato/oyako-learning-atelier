/* 漢検チャレンジ（2026-11-26）
   ねらい：開いたら「きょうやること」が決まっていて、押すだけで終わる。
   出題は漢検の形に寄せる（読み・例文の穴うめ・書き取り）。
   漢字のデータと進み具合は、となりの漢字アプリ（../kanji/）と同じものを使う。 */
(function () {
  "use strict";
  var $ = function (id) { return document.getElementById(id); };
  var PLAN_KEY = 'kanken.plan.v1';

  /* ---------------- 級とデータ ---------------- */
  var LEVELS = [
    { key:'10', name:'10級', about:'小1修了', cum:80,   units:['小1'] },
    { key:'9',  name:'9級',  about:'小2修了', cum:240,  units:['小1','小2'] },
    { key:'8',  name:'8級',  about:'小3修了', cum:440,  units:['小1','小2','小3'] },
    { key:'7',  name:'7級',  about:'小4修了', cum:642,  units:['小1','小2','小3','小4'] },
    { key:'6',  name:'6級',  about:'小5修了', cum:835,  units:['小1','小2','小3','小4','小5'] },
    { key:'5',  name:'5級',  about:'小6修了', cum:1026, units:['小1','小2','小3','小4','小5','小6'] },
    { key:'4',  name:'4級',  about:'中学在学', cum:1339, units:['小1','小2','小3','小4','小5','小6','中1'] },
    { key:'3',  name:'3級',  about:'中学卒業', cum:1623, units:['小1','小2','小3','小4','小5','小6','中1','中2'] },
    { key:'j2', name:'準2級', about:'高校在学', cum:1951, units:['小1','小2','小3','小4','小5','小6','中1','中2','中3'] },
    { key:'2',  name:'2級',  about:'高校卒業', cum:2136, units:['小1','小2','小3','小4','小5','小6','中1','中2','中3'] }
  ];
  var LEARNED = [
    { key:'0',  name:'まだ ほとんど書けない', cum:0 },
    { key:'g1', name:'小1まで（80字）',   cum:80 },
    { key:'g2', name:'小2まで（240字）',  cum:240 },
    { key:'g3', name:'小3まで（440字）',  cum:440 },
    { key:'g4', name:'小4まで（642字）',  cum:642 },
    { key:'g5', name:'小5まで（835字）',  cum:835 },
    { key:'g6', name:'小6まで（1026字）', cum:1026 },
    { key:'k4', name:'4級の範囲まで（1339字）', cum:1339 },
    { key:'k3', name:'3級の範囲まで（1623字）', cum:1623 }
  ];
  var EXAMS = [
    { key:'2027-02-14', date:'2027-02-14', name:'2027年2月14日(日)' },
    { key:'2027-06-20', date:'2027-06-20', name:'2027年6月20日(日)' },
    { key:'2027-10-17', date:'2027-10-17', name:'2027年10月17日(日)' },
    { key:'custom', date:'', name:'じぶんで決める（CBT・オンライン）' }
  ];
  // 単元のならび。この順に「習う順」とみなす。
  var UNIT_ORDER = [
    '小1 配当漢字','小2 配当漢字','小3 配当漢字','小4 配当漢字','小5 配当漢字','小6 配当漢字',
    '中1 常用漢字 1','中1 常用漢字 2','中1 常用漢字 3','中1 常用漢字 4','中1 常用漢字 5',
    '中2 常用漢字 1','中2 常用漢字 2','中2 常用漢字 3','中2 常用漢字 4','中2 常用漢字 5',
    '中3 常用漢字 1','中3 常用漢字 2','中3 常用漢字 3','中3 常用漢字 4','中3 常用漢字 5'
  ];
  function unitRank(unit) {
    var i = UNIT_ORDER.indexOf(unit);
    return i < 0 ? 999 : i;
  }
  function levelOf(key) { return LEVELS.filter(function (l) { return l.key === key; })[0] || LEVELS[3]; }
  function learnedOf(key) { return LEARNED.filter(function (l) { return l.key === key; })[0] || LEARNED[0]; }

  /* ---------------- 日付の道具 ---------------- */
  function ymd(d) {
    return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
  }
  function parseYmd(s) { var p = String(s).split('-'); return new Date(Number(p[0]), Number(p[1]) - 1, Number(p[2])); }
  function today() { var d = new Date(); d.setHours(0, 0, 0, 0); return d; }
  function daysBetween(a, b) { return Math.round((b - a) / 86400000); }
  var WD = ['日', '月', '火', '水', '木', '金', '土'];

  /* ---------------- 計画 ---------------- */
  function readPlan() {
    try { return JSON.parse(localStorage.getItem(PLAN_KEY)) || null; } catch (e) { return null; }
  }
  function writePlan(p) {
    try { localStorage.setItem(PLAN_KEY, JSON.stringify(p)); } catch (e) {}
  }

  // きょう出す「新しい字」の数を決める。
  // 本番までの平日のうち、最後の2週間（10日ぶん）は復習にとっておく。
  function perDayNew(plan, remainNew) {
    var exam = parseYmd(plan.examDate);
    var t = today();
    var weekdays = 0;
    for (var d = new Date(t.getTime()); d < exam; d.setDate(d.getDate() + 1)) {
      var w = d.getDay();
      if (w >= 1 && w <= 5) weekdays += 1;
    }
    var usable = Math.max(1, weekdays - 10);
    if (remainNew <= 0) return 0;
    return Math.max(1, Math.ceil(remainNew / usable));
  }

  /* ---------------- 状態 ---------------- */
  var state = {
    plan: null,
    learnerId: null,
    items: [],        // 対象の級に入る問題（習う順）
    progress: {},     // itemId -> 進み具合
    quiz: null
  };

  function loadData() {
    var boot = window.KanjiDB.getBootstrap({ learnerId: state.learnerId });
    state.learnerId = state.learnerId || (boot.learners[0] && boot.learners[0].id);
    var rep = window.KanjiDB.getReports(state.learnerId, {});
    state.progress = {};
    (rep.progressRows || []).forEach(function (row) {
      var it = row.item || row;
      var pr = row.progress || row;
      if (it && it.id) state.progress[it.id] = pr;
    });
    var lv = levelOf(state.plan.level);
    var all = boot.items.filter(function (it) {
      return lv.units.some(function (u) { return String(it.unit || '').indexOf(u + ' ') === 0; });
    });
    all.sort(function (a, b) {
      var r = unitRank(a.unit) - unitRank(b.unit);
      return r !== 0 ? r : String(a.id).localeCompare(String(b.id));
    });
    state.items = all;
  }

  function prog(id) { return state.progress[id] || { attempts: 0, correct: 0, status: 'new', dueAt: null, box: 0 }; }

  // 「もう書ける」ぶんを先頭から外した、これから覚える並び
  function studyPool() {
    var skip = learnedOf(state.plan.learned).cum;
    return state.items.slice(Math.min(skip, Math.max(0, state.items.length - 1)));
  }

  /* ---------------- きょうのミッション ---------------- */
  function buildMission() {
    var pool = studyPool();
    var fresh = pool.filter(function (it) { return prog(it.id).attempts === 0; });
    var need = perDayNew(state.plan, fresh.length);
    var dow = new Date().getDay();
    if (dow === 6) need = Math.ceil(need / 2);   // 土はひかえめ
    if (dow === 0) need = 0;                      // 日はおやすみ
    var newItems = fresh.slice(0, need);

    // ふくしゅう：期限がきたもの（新しく出す字はのぞく）
    var now = Date.now();
    var ids = {};
    newItems.forEach(function (it) { ids[it.id] = true; });
    var due = pool.filter(function (it) {
      if (ids[it.id]) return false;
      var p = prog(it.id);
      return p.attempts > 0 && (!p.dueAt || new Date(p.dueAt).getTime() <= now);
    });
    due.sort(function (a, b) {
      var pa = prog(a.id), pb = prog(b.id);
      if (pa.status === 'review' && pb.status !== 'review') return -1;
      if (pb.status === 'review' && pa.status !== 'review') return 1;
      return new Date(pa.dueAt || 0) - new Date(pb.dueAt || 0);
    });
    var reviewItems = due.slice(0, dow === 0 ? 10 : 14);

    // 問題をならべる：新しい字は「読み」→「書き」、ふくしゅうは形をかえる
    var qs = [];
    newItems.forEach(function (it) {
      qs.push({ item: it, kind: 'read' });
      qs.push({ item: it, kind: 'write' });
    });
    reviewItems.forEach(function (it, i) {
      var kinds = ['read', 'cloze', 'write'];
      qs.push({ item: it, kind: kinds[i % kinds.length] });
    });
    return { newCount: newItems.length, reviewCount: reviewItems.length, questions: qs };
  }

  /* ---------------- 問題を作る ---------------- */
  function shuffle(a) {
    for (var i = a.length - 1; i > 0; i--) {
      var j = Math.floor(Math.random() * (i + 1));
      var t = a[i]; a[i] = a[j]; a[j] = t;
    }
    return a;
  }
  function others(item, n, pick) {
    var same = state.items.filter(function (x) { return x.unit === item.unit && x.id !== item.id; });
    var pool = same.length >= n + 3 ? same : state.items.filter(function (x) { return x.id !== item.id; });
    var out = [], seen = {};
    seen[pick(item)] = true;
    shuffle(pool.slice()).some(function (x) {
      var v = pick(x);
      if (!v || seen[v]) return false;
      seen[v] = true; out.push(v);
      return out.length >= n;
    });
    return out;
  }
  function clozeText(item) {
    var ex = String(item.example || '');
    if (ex.indexOf('{}') >= 0) return ex.replace('{}', '<b class="blank">＿＿</b>');
    if (ex.indexOf('〇〇') >= 0) return ex.replace('〇〇', '<b class="blank">＿＿</b>');
    return '';
  }
  function makeQuestion(q) {
    var it = q.item;
    if (q.kind === 'read') {
      var ch = shuffle([it.reading].concat(others(it, 3, function (x) { return x.reading; })));
      return { kind: 'read', label: 'よみ', body: '<p class="big-word">' + esc(it.answer) + '</p>'
        + (it.prompt ? '<p class="sub">' + esc(it.prompt) + '</p>' : ''),
        choices: ch, answer: it.reading, item: it };
    }
    if (q.kind === 'cloze') {
      var text = clozeText(it);
      if (!text) return makeQuestion({ item: it, kind: 'read' });
      var ch2 = shuffle([it.answer].concat(others(it, 3, function (x) { return x.answer; })));
      return { kind: 'cloze', label: 'れい文の あなうめ', body: '<p class="sentence">' + text + '</p>'
        + '<p class="sub">よみ：' + esc(it.reading) + '</p>',
        choices: ch2, answer: it.answer, item: it };
    }
    return { kind: 'write', label: 'かきとり', body: '<p class="big-read">' + esc(it.reading) + '</p>'
      + (clozeText(it) ? '<p class="sentence small">' + clozeText(it) + '</p>' : '')
      + '<p class="sub">' + esc(it.prompt || 'かん字で 書いてね') + '</p>',
      answer: it.answer, item: it };
  }
  function esc(s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }

  /* ---------------- 画面きりかえ ---------------- */
  var SCREENS = ['setup', 'home', 'quiz', 'done', 'settings'];
  function show(name) {
    SCREENS.forEach(function (s) { $('s-' + s).classList.toggle('hidden', s !== name); });
    window.scrollTo(0, 0);
  }

  /* ---------------- ホーム ---------------- */
  function renderHome() {
    loadData();
    var m = buildMission();
    state.mission = m;
    var d = new Date();
    $('home-date').textContent = (d.getMonth() + 1) + '月' + d.getDate() + '日（' + WD[d.getDay()] + '）';
    $('m-new').textContent = m.newCount;
    $('m-review').textContent = m.reviewCount;
    $('m-total').textContent = m.questions.length;
    $('b-start').disabled = m.questions.length === 0;

    var stats = window.KanjiDB.dailyStats(state.learnerId);
    $('h-streak').textContent = stats.streak;
    var doneToday = stats.today.count > 0;
    $('m-done').classList.toggle('hidden', !doneToday);
    $('b-start').textContent = m.questions.length === 0 ? 'きょうは おやすみ' : (doneToday ? 'もう一度やる' : 'はじめる');

    var exam = parseYmd(state.plan.examDate);
    var left = daysBetween(today(), exam);
    $('h-until').textContent = left >= 0 ? left : '—';
    $('h-until-label').textContent = left >= 0 ? '日後が けんてい' : 'けんていは おわりました';

    var lv = levelOf(state.plan.level);
    var pool = studyPool();
    var fresh = pool.filter(function (it) { return prog(it.id).attempts === 0; }).length;
    var learnedCount = pool.length - fresh;
    $('h-plan').textContent = lv.name + '（' + lv.about + '）／ のこり ' + fresh + ' 字 ・ やった ' + learnedCount + ' 字';

    renderCalendar(stats.days || {});
    renderGauge(pool);
  }

  function renderCalendar(days) {
    var now = new Date();
    var y = now.getFullYear(), mo = now.getMonth();
    var first = new Date(y, mo, 1);
    var last = new Date(y, mo + 1, 0).getDate();
    var html = '<div class="cal-head">' + (mo + 1) + '月</div><div class="cal-grid">';
    WD.forEach(function (w) { html += '<span class="cal-w">' + w + '</span>'; });
    for (var i = 0; i < first.getDay(); i++) html += '<span></span>';
    for (var dnum = 1; dnum <= last; dnum++) {
      var key = ymd(new Date(y, mo, dnum));
      var got = days[key];
      var isToday = key === ymd(today());
      var cls = 'cal-d' + (got ? ' on' : '') + (isToday ? ' now' : '');
      html += '<span class="' + cls + '">' + dnum + (got ? '<i>●</i>' : '') + '</span>';
    }
    html += '</div>';
    $('cal').innerHTML = html;
  }

  // 合格予想点：いま「定着」している割合を200点に換算（ざっくりの目安）
  function renderGauge(pool) {
    var total = pool.length || 1;
    var good = pool.filter(function (it) {
      var p = prog(it.id);
      return p.status === 'mastering' || (p.correct > 0 && p.status !== 'review');
    }).length;
    var score = Math.round(good / total * 200);
    $('g-score').textContent = score + '点';
    $('g-fill').style.width = Math.min(100, score / 200 * 100) + '%';
    $('g-fill').classList.toggle('pass', score >= 140);
  }

  /* ---------------- クイズ ---------------- */
  function startQuiz() {
    var m = state.mission && state.mission.questions.length ? state.mission : buildMission();
    if (!m.questions.length) return;
    state.quiz = { list: m.questions.slice(), index: 0, correct: 0, combo: 0, best: 0, answered: 0, current: null, strokes: [] };
    show('quiz');
    nextQuestion();
  }
  function nextQuestion() {
    var q = state.quiz;
    if (q.index >= q.list.length) { finishQuiz(); return; }
    q.current = makeQuestion(q.list[q.index]);
    q.strokes = [];
    $('q-count').textContent = (q.index + 1) + '/' + q.list.length;
    $('q-bar').style.width = (q.index / q.list.length * 100) + '%';
    $('q-kind').textContent = q.current.label;
    $('q-body').innerHTML = q.current.body;
    $('q-feedback').classList.add('hidden');
    $('q-answer').classList.add('hidden');
    $('q-combo').classList.toggle('hidden', q.combo < 2);
    $('q-combo').textContent = q.combo >= 2 ? '🔥 ' + q.combo + 'れんぞく せいかい！' : '';

    if (q.current.kind === 'write') {
      $('q-choices').innerHTML = '';
      $('q-choices').classList.add('hidden');
      $('q-write').classList.remove('hidden');
      clearCanvas();
    } else {
      $('q-write').classList.add('hidden');
      $('q-choices').classList.remove('hidden');
      $('q-choices').innerHTML = q.current.choices.map(function (c) {
        return '<button class="choice" data-choice="' + esc(c) + '" type="button">' + esc(c) + '</button>';
      }).join('');
    }
  }
  function answerChoice(value) {
    var q = state.quiz;
    if (!q || !q.current || q.locked) return;
    q.locked = true;
    var ok = value === q.current.answer;
    [].forEach.call($('q-choices').querySelectorAll('.choice'), function (b) {
      if (b.dataset.choice === q.current.answer) b.classList.add('is-ok');
      else if (b.dataset.choice === value) b.classList.add('is-ng');
      b.disabled = true;
    });
    finishOne(ok, ok ? 'せいかい！' : 'こたえは「' + q.current.answer + '」');
  }
  function finishOne(ok, message) {
    var q = state.quiz;
    q.answered += 1;
    if (ok) { q.correct += 1; q.combo += 1; q.best = Math.max(q.best, q.combo); }
    else q.combo = 0;
    window.KanjiDB.recordAttempt({
      learnerId: state.learnerId,
      itemId: q.current.item.id,
      mode: 'test',
      score: ok ? 90 : 20,
      passed: ok,
      recognition: q.current.answer,
      feedback: q.current.label + (ok ? '／せいかい' : '／まちがい'),
      gradingMethod: q.current.kind === 'write' ? 'self' : 'choice',
      durationMs: 0
    });
    var fb = $('q-feedback');
    fb.className = 'feedback ' + (ok ? 'ok' : 'ng');
    fb.innerHTML = (ok ? '<b>○</b>' : '<b>×</b>') + '<span>' + esc(message) + '</span>';
    fb.classList.remove('hidden');
    setTimeout(function () {
      q.locked = false;
      q.index += 1;
      nextQuestion();
    }, ok ? 750 : 1600);
  }
  function finishQuiz() {
    var q = state.quiz;
    var stats = window.KanjiDB.dailyStats(state.learnerId);
    $('d-count').textContent = q.answered;
    $('d-correct').textContent = q.correct;
    $('d-streak').textContent = stats.streak;
    $('d-stamp').textContent = q.correct === q.answered && q.answered > 0 ? '🏆' : '💮';
    $('d-title').textContent = q.correct === q.answered && q.answered > 0 ? 'ぜんぶ せいかい！' : 'きょうの分、おわり！';
    $('copy-msg2').textContent = '';
    show('done');
  }

  /* ---------------- 手書き ---------------- */
  var ctx = null;
  function canvasSetup() {
    var c = $('q-canvas');
    ctx = c.getContext('2d');
    var drawing = false, last = null;
    function pos(e) {
      var r = c.getBoundingClientRect();
      return { x: (e.clientX - r.left) * c.width / r.width, y: (e.clientY - r.top) * c.height / r.height };
    }
    c.addEventListener('pointerdown', function (e) {
      drawing = true; last = pos(e); state.quiz && state.quiz.strokes.push([last]);
      c.setPointerCapture(e.pointerId); e.preventDefault();
    });
    c.addEventListener('pointermove', function (e) {
      if (!drawing) return;
      var p = pos(e);
      ctx.strokeStyle = '#2f2c28'; ctx.lineWidth = 12; ctx.lineCap = 'round'; ctx.lineJoin = 'round';
      ctx.beginPath(); ctx.moveTo(last.x, last.y); ctx.lineTo(p.x, p.y); ctx.stroke();
      last = p;
      var s = state.quiz && state.quiz.strokes[state.quiz.strokes.length - 1];
      if (s) s.push(p);
      e.preventDefault();
    });
    ['pointerup', 'pointercancel', 'pointerleave'].forEach(function (t) {
      c.addEventListener(t, function () { drawing = false; });
    });
  }
  function clearCanvas() {
    var c = $('q-canvas');
    ctx.clearRect(0, 0, c.width, c.height);
    ctx.strokeStyle = '#e7dfd0'; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(c.width / 2, 0); ctx.lineTo(c.width / 2, c.height); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(0, c.height / 2); ctx.lineTo(c.width, c.height / 2); ctx.stroke();
    if (state.quiz) state.quiz.strokes = [];
  }
  function redraw() {
    var c = $('q-canvas');
    clearCanvas();
    var strokes = state.quiz ? state.quiz.strokes : [];
    ctx.strokeStyle = '#2f2c28'; ctx.lineWidth = 12; ctx.lineCap = 'round'; ctx.lineJoin = 'round';
    strokes.forEach(function (s) {
      if (s.length < 2) return;
      ctx.beginPath(); ctx.moveTo(s[0].x, s[0].y);
      s.slice(1).forEach(function (p) { ctx.lineTo(p.x, p.y); });
      ctx.stroke();
    });
  }

  /* ---------------- コピー ---------------- */
  function dailyLine() {
    var s = window.KanjiDB.dailyStats(state.learnerId);
    var d = new Date();
    var name = state.plan.name ? ' ' + state.plan.name : '';
    return (d.getMonth() + 1) + '/' + d.getDate() + ' ' + s.today.count + '問（正解' + s.today.correct + '） 連続' + s.streak + '日'
      + ' ' + levelOf(state.plan.level).name + name;
  }
  function copyLine(msgId) {
    var text = dailyLine();
    var done = function () {
      $(msgId).textContent = 'コピーしました：' + text;
      setTimeout(function () { $(msgId).textContent = ''; }, 6000);
    };
    if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(text).then(done, done);
    else {
      var ta = document.createElement('textarea');
      ta.value = text; ta.style.position = 'fixed'; ta.style.opacity = '0';
      document.body.appendChild(ta); ta.select();
      try { document.execCommand('copy'); } catch (e) {}
      document.body.removeChild(ta); done();
    }
  }

  /* ---------------- 設定のUI ---------------- */
  function fillSelect(sel, rows, value, label, selected) {
    sel.innerHTML = rows.map(function (r) {
      return '<option value="' + value(r) + '"' + (value(r) === selected ? ' selected' : '') + '>' + label(r) + '</option>';
    }).join('');
  }
  function fillPlanSelects(prefix, plan) {
    fillSelect($(prefix + '-level'), LEVELS, function (r) { return r.key; },
      function (r) { return r.name + '（' + r.about + '・' + r.cum + '字）'; }, plan ? plan.level : '7');
    fillSelect($(prefix + '-learned'), LEARNED, function (r) { return r.key; },
      function (r) { return r.name; }, plan ? plan.learned : 'g2');
    fillSelect($(prefix + '-exam'), EXAMS, function (r) { return r.key; },
      function (r) { return r.name; }, plan ? (plan.examKey || '2027-02-14') : '2027-02-14');
  }
  function planFrom(prefix, nameId) {
    var examKey = $(prefix + '-exam').value;
    var exam = EXAMS.filter(function (e) { return e.key === examKey; })[0];
    var date = exam.key === 'custom' ? $(prefix + '-custom').value : exam.date;
    if (!date) return null;
    return {
      name: nameId ? ($(nameId).value || '').trim() : (state.plan ? state.plan.name : ''),
      level: $(prefix + '-level').value,
      learned: $(prefix + '-learned').value,
      examKey: examKey,
      examDate: date
    };
  }

  /* ---------------- 起動 ---------------- */
  function boot() {
    if (!window.KanjiDB) { document.body.innerHTML = '<p style="padding:20px">データを読めませんでした。ページを開きなおしてください。</p>'; return; }
    var b = window.KanjiDB.getBootstrap({});
    state.learnerId = b.learners[0] && b.learners[0].id;
    state.plan = readPlan();
    canvasSetup();

    fillPlanSelects('f', state.plan);
    fillPlanSelects('s', state.plan);

    if (state.plan && state.plan.examDate) { renderHome(); show('home'); }
    else show('setup');
  }

  /* ---------------- ボタン ---------------- */
  document.addEventListener('click', function (e) {
    var ch = e.target.closest('[data-choice]');
    if (ch) { answerChoice(ch.dataset.choice); return; }
    var self = e.target.closest('[data-self]');
    if (self) {
      var ok = self.dataset.self === 'ok';
      finishOne(ok, ok ? 'よく書けました！' : 'もう一度 出てくるよ');
      return;
    }
  });
  ['f-exam', 's-exam'].forEach(function (id) {
    $(id).addEventListener('change', function () {
      var wrap = id === 'f-exam' ? 'f-custom-wrap' : 's-custom-wrap';
      $(wrap).classList.toggle('hidden', $(id).value !== 'custom');
    });
  });
  $('b-start-plan').addEventListener('click', function () {
    var p = planFrom('f', 'f-name');
    if (!p) { $('setup-msg').textContent = 'けんていの日をえらんでね。'; return; }
    state.plan = p; writePlan(p);
    renderHome(); show('home');
  });
  $('b-save-plan').addEventListener('click', function () {
    var p = planFrom('s', null);
    if (!p) { $('save-msg').textContent = 'けんていの日をえらんでください。'; return; }
    state.plan = p; writePlan(p);
    $('save-msg').textContent = '保存しました。';
    renderHome();
  });
  $('b-start').addEventListener('click', startQuiz);
  $('b-quit').addEventListener('click', function () { renderHome(); show('home'); });
  $('b-home').addEventListener('click', function () { renderHome(); show('home'); });
  $('b-settings').addEventListener('click', function () { fillPlanSelects('s', state.plan); show('settings'); });
  $('b-back').addEventListener('click', function () { renderHome(); show('home'); });
  $('b-copy').addEventListener('click', function () { copyLine('copy-msg'); });
  $('b-copy2').addEventListener('click', function () { copyLine('copy-msg2'); });
  $('b-reveal').addEventListener('click', function () {
    $('q-answer-text').textContent = state.quiz.current.answer;
    $('q-answer').classList.remove('hidden');
  });
  $('b-clear').addEventListener('click', clearCanvas);
  $('b-undo').addEventListener('click', function () {
    if (state.quiz && state.quiz.strokes.length) { state.quiz.strokes.pop(); redraw(); }
  });

  boot();
})();
