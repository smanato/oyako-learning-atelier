(function () {
  const STORAGE_KEY = 'kanji.lab.db.v1';
  const { BANK_VERSION, LEVELS, buildQuestionBank } = window.KanjiBank;
  const GRADING_VERSION = '2026-05-07-strict-scope-v2';

  const nowIso = () => new Date().toISOString();

  function makeId(prefix) {
    const bytes = new Uint8Array(6);
    (window.crypto || window.msCrypto).getRandomValues(bytes);
    const hex = [...bytes].map((b) => b.toString(16).padStart(2, '0')).join('');
    return `${prefix}_${hex}`;
  }

  const seedItems = [
    { level: '小4', unit: '小4 熟語サンプル', reading: 'どくしょ', answer: '読書', prompt: '休日に本を読むこと。', example: '読書の時間を決める。', expectedStrokes: 24 },
    { level: '小4', unit: '小4 熟語サンプル', reading: 'としょかん', answer: '図書館', prompt: '本を借りたり読んだりする場所。', example: '図書館で調べる。', expectedStrokes: 31 },
    { level: '小4', unit: '小4 熟語サンプル', reading: 'きぼう', answer: '希望', prompt: 'こうなってほしいと願うこと。', example: '将来への希望を持つ。', expectedStrokes: 18 },
    { level: '小4', unit: '小4 熟語サンプル', reading: 'どりょく', answer: '努力', prompt: '目標に向かって力を尽くすこと。', example: '毎日の努力が実る。', expectedStrokes: 14 },
    { level: '小4', unit: '小4 熟語サンプル', reading: 'けっか', answer: '結果', prompt: 'ものごとの終わりに出る答え。', example: 'テストの結果を見る。', expectedStrokes: 23 },
    { level: '小4', unit: '小4 熟語サンプル', reading: 'げんいん', answer: '原因', prompt: 'そうなったもと。', example: '失敗の原因を考える。', expectedStrokes: 17 },
    { level: '小5', unit: '小5 熟語サンプル', reading: 'かんさつ', answer: '観察', prompt: 'よく見て調べること。', example: '植物を観察する。', expectedStrokes: 31 },
    { level: '小5', unit: '小5 熟語サンプル', reading: 'せつめい', answer: '説明', prompt: 'わかるように話すこと。', example: '理由を説明する。', expectedStrokes: 23 },
    { level: '小5', unit: '小5 熟語サンプル', reading: 'けんこう', answer: '健康', prompt: '体や心の調子がよいこと。', example: '健康に気をつける。', expectedStrokes: 22 },
    { level: '小5', unit: '小5 熟語サンプル', reading: 'れきし', answer: '歴史', prompt: '昔から今までの出来事の流れ。', example: '日本の歴史を学ぶ。', expectedStrokes: 19 },
    { level: '小6', unit: '小6 熟語サンプル', reading: 'せいこう', answer: '成功', prompt: '目的を達成すること。', example: '実験に成功する。', expectedStrokes: 11 },
    { level: '小6', unit: '小6 熟語サンプル', reading: 'せきにん', answer: '責任', prompt: '自分が引き受けて果たすべきこと。', example: '責任を持って行動する。', expectedStrokes: 17 }
  ];

  function levelFromUnit(unit) {
    const text = String(unit || '').trim();
    const match = text.match(/小[1-6]|小学[1-6]年|中学[1-3]年|中[1-3]|中学/);
    if (!match) return '未設定';
    if (match[0].startsWith('小学')) return `小${match[0].match(/[1-6]/)[0]}`;
    if (match[0].startsWith('中学') && /[1-3]/.test(match[0])) return `中${match[0].match(/[1-3]/)[0]}`;
    if (/^中[1-3]$/.test(match[0])) return match[0];
    if (match[0].startsWith('中')) return '中1';
    return match[0];
  }

  function juniorLevelForOldIndex(index) {
    if (index < 370) return '中1';
    if (index < 740) return '中2';
    return '中3';
  }

  function juniorIndexForOldIndex(index) {
    if (index < 370) return index;
    if (index < 740) return index - 370;
    return Math.max(0, index - 740);
  }

  function oldJuniorIndex(item, fallbackIndex) {
    const idMatch = String(item.id || '').match(/^bank_中学_(\d+)$/);
    if (idMatch) return Number(idMatch[1]) - 1;
    if (Number.isFinite(item.order) && item.order > 1026) return item.order - 1027;
    return Math.max(0, fallbackIndex - 1026);
  }

  function makeSeedItems() {
    const standard = buildQuestionBank();
    const samples = seedItems.map((item, index) => ({
      id: `sample_${String(index + 1).padStart(3, '0')}`,
      order: standard.length + index + 1,
      tags: ['熟語'],
      createdAt: nowIso(),
      updatedAt: nowIso(),
      ...item
    }));
    return standard.map((item, index) => ({
      ...item,
      order: index + 1,
      createdAt: nowIso(),
      updatedAt: nowIso()
    })).concat(samples);
  }

  const defaultDb = () => ({
    version: 1,
    createdAt: nowIso(),
    settings: {
      appName: 'Kanji Handwriting Lab',
      bankVersion: BANK_VERSION,
      gradingVersion: GRADING_VERSION,
      strictness: 'balanced',
      gradeMode: 'normal',
      passScore: 72,
      repeatWrongImmediately: true,
      requireTwoPasses: true
    },
    learners: [
      {
        id: 'learner_demo',
        name: 'デモ生徒',
        note: 'まずはこの生徒で動作確認できます',
        createdAt: nowIso()
      }
    ],
    items: makeSeedItems(),
    attempts: [],
    progress: {}
  });

  function migrateDb(db) {
    let changed = false;
    db.settings = db.settings || {};
    db.items = Array.isArray(db.items) ? db.items : [];
    db.learners = Array.isArray(db.learners) ? db.learners : defaultDb().learners;
    db.attempts = Array.isArray(db.attempts) ? db.attempts : [];
    db.progress = db.progress || {};

    delete db.settings.aiGrading;
    delete db.settings.aiModel;
    if (!['study', 'normal', 'strict'].includes(db.settings.gradeMode)) {
      db.settings.gradeMode = 'normal';
      changed = true;
    }
    if (db.settings.gradingVersion !== GRADING_VERSION) {
      db.settings.passScore = Math.max(Number(db.settings.passScore) || 0, 72);
      db.settings.strictness = 'strict';
      db.settings.gradingVersion = GRADING_VERSION;
      changed = true;
    }

    db.items = db.items.map((item, index) => {
      if (!item.level) changed = true;
      const rawLevel = item.level || levelFromUnit(item.unit);
      const oldIndex = rawLevel === '中学' ? oldJuniorIndex(item, index) : null;
      const level = rawLevel === '中学' ? juniorLevelForOldIndex(oldIndex) : rawLevel;
      const juniorIndex = rawLevel === '中学' ? juniorIndexForOldIndex(oldIndex) : null;
      const reading = item.answer === '引' && level === '小2' && item.reading === 'いん' ? 'ひく' : item.reading;
      if (reading !== item.reading || rawLevel !== level) changed = true;
      return {
        ...item,
        level,
        order: Number.isFinite(item.order) ? item.order : index + 1,
        reading: normalizeText(reading),
        onReading: normalizeText(item.onReading),
        kunReading: normalizeText(item.kunReading),
        unit: rawLevel === '中学' ? `${level} 常用漢字 ${Math.floor(juniorIndex / 90) + 1}` : item.unit,
        prompt: reading !== item.reading
          ? '読み「ひく」に合う、小2で習う漢字を一字で書く。'
          : rawLevel === '中学'
            ? `読み「${normalizeText(reading)}」に合う、${level}相当で扱う常用漢字を一字で書く。`
            : item.prompt,
        tags: Array.isArray(item.tags) ? item.tags : [],
        createdAt: item.createdAt || nowIso(),
        updatedAt: item.updatedAt || nowIso()
      };
    });

    if (db.settings.bankVersion !== BANK_VERSION) {
      // 旧バージョンの組み込み問題（一字だけ等）は作り直すため、いったん削除する。
      // ユーザーが追加した教材（item_ / sample_ 以外）はそのまま残す。
      const purgedIds = new Set(
        db.items.filter((item) => /^bank_/.test(String(item.id))).map((item) => item.id)
      );
      if (purgedIds.size) {
        db.items = db.items.filter((item) => !purgedIds.has(item.id));
        Object.keys(db.progress).forEach((key) => {
          const itemId = key.slice(key.indexOf(':') + 1);
          if (purgedIds.has(itemId)) delete db.progress[key];
        });
      }
      const existing = new Set(db.items.map((item) => item.id));
      const existingLevelAnswer = new Set(db.items.map((item) => `${item.level}:${item.answer}:${item.reading}`));
      const startOrder = db.items.length + 1;
      const toAdd = makeSeedItems()
        .filter((item) => !existing.has(item.id) && !existingLevelAnswer.has(`${item.level}:${item.answer}:${item.reading}`))
        .map((item, index) => ({ ...item, order: startOrder + index }));
      db.items.push(...toAdd);
      db.settings.bankVersion = BANK_VERSION;
      changed = true;
    }

    return { db, changed };
  }

  function readDb() {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      const fresh = defaultDb();
      writeDb(fresh);
      return fresh;
    }
    let parsed;
    try {
      parsed = JSON.parse(raw);
    } catch (e) {
      console.warn('[db] 破損したストレージを初期化します', e);
      const fresh = defaultDb();
      writeDb(fresh);
      return fresh;
    }
    const { db, changed } = migrateDb(parsed);
    if (changed) writeDb(db);
    return db;
  }

  function writeDb(db) {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(db));
    } catch (e) {
      console.warn('[db] ストレージへの書き込みに失敗', e);
    }
    return db;
  }

  function normalizeText(value) {
    return String(value || '').trim();
  }

  function sanitizeItem(input, index = 0) {
    return {
      id: input.id || makeId('item'),
      order: Number.isFinite(input.order) ? input.order : index,
      level: normalizeText(input.level) || levelFromUnit(input.unit),
      unit: normalizeText(input.unit) || '未分類',
      baseChar: normalizeText(input.baseChar),
      reading: normalizeText(input.reading),
      onReading: normalizeText(input.onReading),
      kunReading: normalizeText(input.kunReading),
      refWords: normalizeText(input.refWords),
      answer: normalizeText(input.answer),
      prompt: normalizeText(input.prompt),
      example: normalizeText(input.example),
      exampleAnswer: normalizeText(input.exampleAnswer),
      expectedStrokes: Number(input.expectedStrokes) || null,
      tags: Array.isArray(input.tags) ? input.tags.map(normalizeText).filter(Boolean) : [],
      createdAt: input.createdAt || nowIso(),
      updatedAt: nowIso()
    };
  }

  function parseImportText(text, defaultUnit = '塾テキスト') {
    const rows = String(text || '')
      .split(/\r?\n/)
      .map((line) => line.trim())
      .filter((line) => line && !line.startsWith('#'));

    return rows.map((line, index) => {
      const parts = line.includes('\t') ? line.split('\t') : line.split(',');
      const trimmed = parts.map((part) => part.trim());

      if (trimmed.length >= 5) {
        return sanitizeItem({
          unit: trimmed[0] || defaultUnit,
          level: levelFromUnit(trimmed[0] || defaultUnit),
          reading: trimmed[1],
          answer: trimmed[2],
          prompt: trimmed[3],
          example: trimmed[4],
          expectedStrokes: trimmed[5],
          onReading: trimmed[6],
          kunReading: trimmed[7]
        }, index + 1);
      }

      if (trimmed.length === 4) {
        return sanitizeItem({
          unit: defaultUnit,
          level: levelFromUnit(defaultUnit),
          reading: trimmed[0],
          answer: trimmed[1],
          prompt: trimmed[2],
          example: trimmed[3]
        }, index + 1);
      }

      return sanitizeItem({
        unit: defaultUnit,
        level: levelFromUnit(defaultUnit),
        reading: trimmed[0],
        answer: trimmed[1],
        prompt: trimmed[2] || '',
        example: ''
      }, index + 1);
    }).filter((item) => item.reading && item.answer);
  }

  function progressKey(learnerId, itemId) {
    return `${learnerId}:${itemId}`;
  }

  function getProgress(db, learnerId, itemId) {
    const key = progressKey(learnerId, itemId);
    if (!db.progress[key]) {
      db.progress[key] = {
        learnerId,
        itemId,
        attempts: 0,
        correct: 0,
        wrong: 0,
        streak: 0,
        box: 0,
        status: 'new',
        dueAt: nowIso(),
        lastScore: null,
        lastAttemptAt: null
      };
    }
    return db.progress[key];
  }

  function nextDueDate(box) {
    const minutes = [0, 45, 24 * 60, 3 * 24 * 60, 7 * 24 * 60, 14 * 24 * 60, 30 * 24 * 60];
    const delay = minutes[Math.max(0, Math.min(box, minutes.length - 1))];
    return new Date(Date.now() + delay * 60 * 1000).toISOString();
  }

  function recordAttempt(input) {
    const db = readDb();
    const attempt = {
      id: makeId('attempt'),
      learnerId: input.learnerId,
      itemId: input.itemId,
      mode: input.mode || 'test',
      score: Math.max(0, Math.min(100, Math.round(Number(input.score) || 0))),
      passed: Boolean(input.passed),
      recognition: normalizeText(input.recognition),
      feedback: normalizeText(input.feedback),
      durationMs: Number(input.durationMs) || 0,
      strokeCount: Number(input.strokeCount) || 0,
      gradingMethod: input.gradingMethod || 'shape',
      createdAt: nowIso()
    };

    db.attempts.unshift(attempt);
    db.attempts = db.attempts.slice(0, 2500);

    const progress = getProgress(db, attempt.learnerId, attempt.itemId);
    // 直前の状態を控えておく（人が○×を付け直したとき、きれいに戻すため）
    attempt.prev = JSON.parse(JSON.stringify(progress));
    applyAttempt(progress, attempt);

    writeDb(db);
    return { attempt, progress };
  }

  // 1回の解答を、進み具合に反映する
  function applyAttempt(progress, attempt) {
    progress.attempts += 1;
    progress.lastScore = attempt.score;
    progress.lastAttemptAt = attempt.createdAt;

    if (attempt.passed) {
      progress.correct += 1;
      progress.streak += 1;
      progress.box = Math.min(6, progress.box + 1);
      progress.status = progress.streak >= 2 ? 'mastering' : 'learning';
      progress.dueAt = nextDueDate(progress.box);
    } else {
      progress.wrong += 1;
      progress.streak = 0;
      progress.box = 0;
      progress.status = 'review';
      progress.dueAt = nowIso();
    }
  }

  // 人が○×を付け直す（2026-11-24）。自動採点は形の重なりを見ているだけなので、最後は人が決める。
  function setVerdict(attemptId, passed) {
    const db = readDb();
    const attempt = db.attempts.find((a) => a.id === attemptId);
    if (!attempt) return null;
    // その問題の「いちばん新しい解答」だけ直せる
    const newest = db.attempts.find((a) => a.learnerId === attempt.learnerId && a.itemId === attempt.itemId);
    if (!newest || newest.id !== attempt.id) return null;
    const key = progressKey(attempt.learnerId, attempt.itemId);
    if (Boolean(attempt.passed) !== Boolean(passed)) {
      if (attempt.prev) db.progress[key] = JSON.parse(JSON.stringify(attempt.prev));
      const progress = getProgress(db, attempt.learnerId, attempt.itemId);
      attempt.passed = Boolean(passed);
      attempt.gradingMethod = 'self';
      applyAttempt(progress, attempt);
      writeDb(db);
      return { attempt, progress };
    }
    attempt.gradingMethod = 'self';
    writeDb(db);
    return { attempt, progress: getProgress(db, attempt.learnerId, attempt.itemId) };
  }

  // 日ごとの記録（2026-11-24）。毎日続けるための「今日・連続・今週」。
  function dayKeyOf(d) {
    return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
  }
  function dailyStats(learnerId) {
    const db = readDb();
    const byDay = {};
    db.attempts.filter((a) => a.learnerId === learnerId).forEach((a) => {
      const k = dayKeyOf(new Date(a.createdAt));
      if (!byDay[k]) byDay[k] = { count: 0, correct: 0 };
      byDay[k].count += 1;
      if (a.passed) byDay[k].correct += 1;
    });
    const todayKey = dayKeyOf(new Date());
    // 連続日数。今日まだやっていなければ、昨日までを数える
    let streak = 0;
    const d = new Date();
    if (!byDay[todayKey]) d.setDate(d.getDate() - 1);
    while (streak < 400) {
      if (!byDay[dayKeyOf(d)]) break;
      streak += 1;
      d.setDate(d.getDate() - 1);
    }
    // 直近7日
    const week = { count: 0, correct: 0 };
    const w = new Date();
    for (let i = 0; i < 7; i += 1) {
      const got = byDay[dayKeyOf(w)];
      if (got) { week.count += got.count; week.correct += got.correct; }
      w.setDate(w.getDate() - 1);
    }
    return { today: byDay[todayKey] || { count: 0, correct: 0 }, streak, week, days: byDay };
  }

  function normalizeUnits(units) {
    if (!units) return [];
    if (Array.isArray(units)) return units.map(normalizeText).filter(Boolean);
    return String(units).split('|').map(normalizeText).filter(Boolean);
  }

  function normalizeIds(ids) {
    if (!ids) return [];
    if (Array.isArray(ids)) return ids.map(normalizeText).filter(Boolean);
    return String(ids).split('|').map(normalizeText).filter(Boolean);
  }

  function filterItemsByScope(items, { level = 'all', units = [], itemIds = [] } = {}) {
    const selectedUnits = normalizeUnits(units);
    const selectedIds = normalizeIds(itemIds);
    return items.filter((item) => {
      const levelOk = !level || level === 'all' || item.level === level;
      const unitOk = selectedIds.length || !selectedUnits.length || selectedUnits.includes(item.unit);
      const itemOk = !selectedIds.length || selectedIds.includes(item.id);
      return levelOk && unitOk && itemOk;
    });
  }

  function summarizeLearner(db, learnerId, scope = {}) {
    const itemIds = new Set(filterItemsByScope(db.items, scope).map((item) => item.id));
    const progress = Object.values(db.progress).filter((row) => row.learnerId === learnerId && itemIds.has(row.itemId));
    const attemptedRows = progress.filter((row) => row.attempts > 0);
    const now = new Date();
    const mastered = attemptedRows.filter((row) => row.status === 'mastering').length;
    const review = attemptedRows.filter((row) => row.status === 'review' || new Date(row.dueAt) <= now).length;
    const attempted = new Set(attemptedRows.map((row) => row.itemId)).size;
    const recentAttempts = db.attempts.filter((a) => a.learnerId === learnerId && itemIds.has(a.itemId)).slice(0, 20);
    const accuracy = recentAttempts.length
      ? Math.round(recentAttempts.filter((a) => a.passed).length / recentAttempts.length * 100)
      : null;

    return {
      totalItems: itemIds.size,
      attempted,
      untried: Math.max(0, itemIds.size - attempted),
      mastered,
      review,
      accuracy,
      recentAttempts
    };
  }

  function reviewItems(db, learnerId, onlyWrong = false, scope = {}) {
    const now = new Date();
    return filterItemsByScope(db.items, scope)
      .map((item) => ({ item, progress: getProgress(db, learnerId, item.id) }))
      .filter(({ progress }) => {
        if (onlyWrong) return progress.status === 'review' || (progress.wrong > 0 && progress.status !== 'mastering');
        return progress.status === 'new' || progress.status === 'review' || new Date(progress.dueAt) <= now;
      })
      .sort((a, b) => {
        const priority = (row) => (row.progress.status === 'review' ? 0 : row.progress.status === 'new' ? 1 : 2);
        return priority(a) - priority(b) || new Date(a.progress.dueAt) - new Date(b.progress.dueAt) || a.item.order - b.item.order;
      })
      .map(({ item, progress }) => ({ ...item, progress }));
  }

  function getBootstrap({ learnerId, level = 'all', units = [], itemIds = [] } = {}) {
    const db = readDb();
    const useLearnerId = learnerId || db.learners[0]?.id;
    const levelItems = filterItemsByScope(db.items, { level });
    const selectableItems = filterItemsByScope(db.items, { level, units });
    const scopedItems = filterItemsByScope(db.items, { level, units, itemIds });
    return {
      settings: db.settings,
      levels: LEVELS,
      learners: db.learners,
      items: scopedItems,
      selectableItems,
      totalItems: db.items.length,
      units: [...new Set(levelItems.map((item) => item.unit))],
      selectedUnits: normalizeUnits(units),
      selectedItemIds: normalizeIds(itemIds),
      summary: useLearnerId ? summarizeLearner(db, useLearnerId, { level, units, itemIds }) : null,
      reviewQueue: useLearnerId ? reviewItems(db, useLearnerId, false, { level, units, itemIds }).slice(0, 30) : []
    };
  }

  function getReview(learnerId, { onlyWrong = false, level = 'all', units = [], itemIds = [] } = {}) {
    const db = readDb();
    if (!db.learners.some((l) => l.id === learnerId)) {
      throw new Error('生徒が見つかりません');
    }
    return {
      items: reviewItems(db, learnerId, onlyWrong, { level, units, itemIds }),
      summary: summarizeLearner(db, learnerId, { level, units, itemIds })
    };
  }

  function getReports(learnerId, { level = 'all', units = [], itemIds = [] } = {}) {
    const db = readDb();
    const summary = summarizeLearner(db, learnerId, { level, units, itemIds });
    const items = filterItemsByScope(db.items, { level, units, itemIds });
    const progressRows = items.map((item) => ({
      item,
      progress: getProgress(db, learnerId, item.id)
    }));
    const weak = progressRows
      .filter((row) => row.progress.wrong > 0 || row.progress.status === 'review')
      .sort((a, b) => b.progress.wrong - a.progress.wrong || a.item.order - b.item.order)
      .slice(0, 20);
    const byUnit = {};
    progressRows.forEach(({ item, progress }) => {
      if (!byUnit[item.unit]) byUnit[item.unit] = { total: 0, tried: 0, mastered: 0, wrong: 0 };
      byUnit[item.unit].total += 1;
      if (progress.attempts) byUnit[item.unit].tried += 1;
      if (progress.status === 'mastering') byUnit[item.unit].mastered += 1;
      byUnit[item.unit].wrong += progress.wrong;
    });
    return { summary, weak, byUnit, attempts: db.attempts.filter((a) => a.learnerId === learnerId).slice(0, 100) };
  }

  function addItem(input) {
    const db = readDb();
    const item = sanitizeItem({ ...input, id: makeId('item'), order: db.items.length + 1 }, db.items.length + 1);
    if (!item.reading || !item.answer) throw new Error('読みと正解漢字は必須です');
    db.items.push(item);
    writeDb(db);
    return item;
  }

  function updateItem(id, patch) {
    const db = readDb();
    const index = db.items.findIndex((item) => item.id === id);
    if (index < 0) throw new Error('問題が見つかりません');
    const updated = sanitizeItem({ ...db.items[index], ...patch, id: db.items[index].id }, db.items[index].order);
    db.items[index] = updated;
    writeDb(db);
    return updated;
  }

  function deleteItem(id) {
    const db = readDb();
    const before = db.items.length;
    db.items = db.items.filter((item) => item.id !== id);
    Object.keys(db.progress).forEach((key) => {
      if (key.endsWith(`:${id}`)) delete db.progress[key];
    });
    db.attempts = db.attempts.filter((attempt) => attempt.itemId !== id);
    writeDb(db);
    return { deleted: before - db.items.length };
  }

  function importItems({ text, unit = '塾テキスト', level } = {}) {
    const db = readDb();
    const items = parseImportText(text, unit);
    const startOrder = db.items.length + 1;
    const imported = items.map((item, index) => ({
      ...item,
      level: level || item.level,
      id: makeId('item'),
      order: startOrder + index,
      createdAt: nowIso(),
      updatedAt: nowIso()
    }));
    db.items.push(...imported);
    writeDb(db);
    return { count: imported.length, items: imported };
  }

  function addLearner({ name, note }) {
    const db = readDb();
    const trimmed = String(name || '').trim();
    if (!trimmed) throw new Error('名前は必須です');
    const learner = {
      id: makeId('learner'),
      name: trimmed,
      note: String(note || '').trim(),
      createdAt: nowIso()
    };
    db.learners.push(learner);
    writeDb(db);
    return learner;
  }

  function updateSettings(patch) {
    const db = readDb();
    const passScore = Number(patch.passScore);
    const gradeMode = ['study', 'normal', 'strict'].includes(patch.gradeMode) ? patch.gradeMode : db.settings.gradeMode || 'normal';
    db.settings = {
      ...db.settings,
      ...patch,
      gradeMode,
      passScore: Number.isFinite(passScore) ? Math.max(40, Math.min(95, passScore)) : db.settings.passScore
    };
    delete db.settings.aiGrading;
    delete db.settings.aiModel;
    writeDb(db);
    return db.settings;
  }

  function exportItemsCsv({ level = 'all', units = [], itemIds = [] } = {}) {
    const db = readDb();
    const items = filterItemsByScope(db.items, { level, units, itemIds });
    const header = ['level', 'unit', 'reading', 'answer', 'prompt', 'example', 'expectedStrokes', 'onReading', 'kunReading'];
    const escape = (value) => `"${String(value ?? '').replace(/"/g, '""')}"`;
    const rows = [header.join(',')].concat(items.map((item) => header.map((key) => escape(item[key])).join(',')));
    return `﻿${rows.join('\n')}`;
  }

  window.KanjiDB = {
    BANK_VERSION,
    LEVELS,
    getBootstrap,
    getReview,
    getReports,
    addItem,
    updateItem,
    deleteItem,
    importItems,
    addLearner,
    updateSettings,
    recordAttempt,
    setVerdict,
    dailyStats,
    exportItemsCsv
  };
})();
