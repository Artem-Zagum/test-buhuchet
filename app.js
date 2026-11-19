/* Тренажёр по курсу ДПО ВШЭ «Бухучёт, налогообложение и основы аудита».
   Telegram Mini App / обычная веб-страница. Вкладки: Теория, Тесты, Прогресс. */
(function () {
  'use strict';
  const TESTS = window.TESTS || [];
  const THEORY = window.THEORY || {};
  const tg = window.Telegram && window.Telegram.WebApp && window.Telegram.WebApp.initData !== undefined ? window.Telegram.WebApp : null;
  const PASS = 0.7, STAR = 0.9;

  /* ---------- структура курса: модули → темы (1 вебинар = 1 тема) ---------- */
  const MODULES = [
    {
      id: 'm1', n: 1, title: 'Экономика организаций (предприятий)',
      topics: TESTS.filter(t => /^p\d+$/.test(t.id)).map(t => t.id),
      checkpoints: [
        { id: 'cp1', title: 'Контрольная точка 1', parts: ['p1', 'p2', 'p3'], n: 20 },
        { id: 'cp2', title: 'Контрольная точка 2', parts: ['p4', 'p5', 'p6'], n: 20 },
        { id: 'cp3', title: 'Контрольная точка 3', parts: ['p7', 'p8', 'p9'], n: 20 },
        { id: 'cp4', title: 'Контрольная точка 4', parts: ['p10', 'p11', 'p12'], n: 20 },
      ],
      final: { id: 'final', title: 'Итоговый экзамен модуля', n: 40 },
    },
    {
      id: 'm2', n: 2, title: 'Налоги и налогообложение (часть 1)',
      topics: TESTS.filter(t => /^n\d+$/.test(t.id)).map(t => t.id),
      checkpoints: [
        { id: 'm2cp1', title: 'Контрольная точка 1', parts: ['n1', 'n2', 'n3'], n: 20 },
        { id: 'm2cp2', title: 'Контрольная точка 2', parts: ['n4', 'n5', 'n6'], n: 20 },
        { id: 'm2cp3', title: 'Контрольная точка 3', parts: ['n7', 'n8', 'n9'], n: 20 },
      ],
      final: { id: 'm2final', title: 'Итоговый экзамен модуля', n: 40 },
    },
    {
      id: 'm3', n: 3, title: 'Бухгалтерский финансовый учёт (часть 1)',
      topics: TESTS.filter(t => /^b\d+$/.test(t.id)).map(t => t.id),
      checkpoints: [
        { id: 'm3cp1', title: 'Контрольная точка 1', parts: ['b1', 'b2', 'b3'], n: 20 },
        { id: 'm3cp2', title: 'Контрольная точка 2', parts: ['b4', 'b5', 'b6'], n: 20 },
        { id: 'm3cp3', title: 'Контрольная точка 3', parts: ['b7', 'b8', 'b9'], n: 20 },
      ],
      final: { id: 'm3final', title: 'Итоговый экзамен модуля', n: 40 },
    },
  ].filter(m => m.topics.length);
  const SOON = [];
  const ALL_CP = [].concat(...MODULES.map(m => m.checkpoints.concat([m.final])));
  const LEVELS = [
    [0, 'Стажёр'], [300, 'Помощник бухгалтера'], [800, 'Бухгалтер'], [1600, 'Экономист'],
    [2700, 'Старший экономист'], [4000, 'Финансовый аналитик'], [5600, 'Главный бухгалтер'],
    [7500, 'Финансовый директор'], [10000, 'Аудитор-легенда'],
  ];

  /* ---------- иконки ---------- */
  const I = {
    book: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round"><path d="M4 5.5A2.5 2.5 0 0 1 6.5 3H20v15H6.5A2.5 2.5 0 0 0 4 20.5z"/><path d="M4 20.5A2.5 2.5 0 0 0 6.5 23H20v-5"/><path d="M8 7h8M8 11h6"/></svg>',
    test: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round"><rect x="5" y="3.5" width="14" height="18" rx="2.5"/><path d="M9 3.5h6v3H9z"/><path d="m8.5 13 2 2 4.5-4.5"/><path d="M9 18h6"/></svg>',
    chart: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round"><path d="M7 4h10v4a5 5 0 0 1-10 0z"/><path d="M7 6H4.5a2.5 2.5 0 0 0 2.6 3.2M17 6h2.5a2.5 2.5 0 0 1-2.6 3.2"/><path d="M12 13v4M8.5 21h7M9.5 17h5v4h-5z"/></svg>',
    back: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="m15 5-7 7 7 7"/></svg>',
    chev: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m9 5 7 7-7 7"/></svg>',
    bolt: '<svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M13 2 4 14h7l-1 8 9-12h-7z"/></svg>',
    check: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="m5 12.5 4.5 4.5L19 7.5"/></svg>',
    lock: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><rect x="5" y="11" width="14" height="10" rx="2.5"/><path d="M8 11V8a4 4 0 0 1 8 0v3"/></svg>',
  };

  /* ---------- состояние ---------- */
  const KEY = 'econ_tests_v1';
  const blank = () => ({ v: 1, upd: 0, xp: 0, tests: {}, cps: {}, days: [], ach: {}, answered: 0, correct: 0, fixed: 0, bestCombo: 0, read: {} });
  let S = load();
  function load() {
    try { const s = JSON.parse(localStorage.getItem(KEY)); if (s && s.v === 1) return Object.assign(blank(), s); } catch (e) {}
    return blank();
  }
  function save() {
    S.upd = Date.now();
    const str = JSON.stringify(S);
    try { localStorage.setItem(KEY, str); } catch (e) {}
    cloudSave(str);
  }
  const cloudOk = () => tg && tg.CloudStorage && tg.isVersionAtLeast && tg.isVersionAtLeast('6.9');
  function cloudSave(str) {
    if (!cloudOk()) return;
    try {
      const parts = str.match(/[\s\S]{1,3800}/g) || [];
      tg.CloudStorage.setItem('n', String(parts.length));
      parts.forEach((p, i) => tg.CloudStorage.setItem('p' + i, p));
    } catch (e) {}
  }
  function cloudLoad(cb) {
    if (!cloudOk()) return cb();
    try {
      tg.CloudStorage.getItem('n', (err, n) => {
        n = parseInt(n, 10);
        if (err || !n) return cb();
        const keys = Array.from({ length: n }, (_, i) => 'p' + i);
        tg.CloudStorage.getItems(keys, (e2, vals) => {
          try {
            if (!e2 && vals) {
              const remote = JSON.parse(keys.map(k => vals[k] || '').join(''));
              if (remote && remote.v === 1 && (remote.upd || 0) > (S.upd || 0)) {
                S = Object.assign(blank(), remote);
                try { localStorage.setItem(KEY, JSON.stringify(S)); } catch (e) {}
              }
            }
          } catch (e) {}
          cb();
        });
      });
    } catch (e) { cb(); }
  }

  /* ---------- утилиты ---------- */
  const $ = s => document.querySelector(s);
  // экранирование + неразрывные пробелы в числах (3 600 000 не переносится по частям)
  const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c])).replace(/(\d) (?=\d{3}(?!\d))/g, '$1\u00a0');
  const shuffle = a => { a = a.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };
  const dkey = d => d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
  const today = () => dkey(new Date());
  const pct = x => Math.round(x * 100) + '%';
  const testById = id => TESTS.find(t => t.id === id);
  const modById = id => MODULES.find(m => m.id === id);
  const modOfTopic = id => MODULES.find(m => m.topics.includes(id));
  const topicNum = id => { const m = modOfTopic(id); return m ? m.topics.indexOf(id) + 1 : 0; };
  const topicName = id => 'Тема ' + topicNum(id);
  const tstat = id => S.tests[id] || (S.tests[id] = { tries: 0, best: 0, last: null, wrong: [], hist: [] });
  const plural = (n, a, b, c) => { const m10 = n % 10, m100 = n % 100; return m10 === 1 && m100 !== 11 ? a : m10 >= 2 && m10 <= 4 && (m100 < 12 || m100 > 14) ? b : c; };
  const haptic = t => { try { tg && tg.HapticFeedback && (t === 'ok' || t === 'bad' ? tg.HapticFeedback.notificationOccurred(t === 'ok' ? 'success' : 'error') : tg.HapticFeedback.impactOccurred('light')); } catch (e) {} };
  function level(xp) {
    let i = 0; while (i + 1 < LEVELS.length && xp >= LEVELS[i + 1][0]) i++;
    const cur = LEVELS[i][0], next = LEVELS[i + 1] ? LEVELS[i + 1][0] : null;
    return { n: i + 1, name: LEVELS[i][1], cur, next, prog: next ? (xp - cur) / (next - cur) : 1 };
  }
  function streak() {
    const set = new Set(S.days); let n = 0; const d = new Date();
    if (!set.has(today())) d.setDate(d.getDate() - 1);
    while (set.has(dkey(d))) { n++; d.setDate(d.getDate() - 1); }
    return n;
  }
  const passed = id => (S.tests[id] && S.tests[id].best >= PASS);
  const starred = id => (S.tests[id] && S.tests[id].best >= STAR);
  const cpOpen = cp => cp.parts.every(passed);
  const cpPassed = cp => S.cps[cp.id] && S.cps[cp.id].best >= PASS;
  const finalOpen = m => m.checkpoints.every(cpPassed);
  const wrongCount = ids => ids.reduce((s, id) => s + ((S.tests[id] || { wrong: [] }).wrong.length), 0);
  const touchDay = () => { S.days.includes(today()) || S.days.push(today()); };

  /* ---------- Markdown → HTML для конспектов ---------- */
  function inline(s) {
    return esc(s).replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
  }
  function md(src) {
    const lines = src.replace(/\r/g, '').split('\n');
    let h = '', i = 0, hn = 0;
    const heads = [];
    while (i < lines.length) {
      const L = lines[i];
      if (!L.trim()) { i++; continue; }
      if (L.startsWith('## ')) { const id = 'h' + (hn++); heads.push([id, L.slice(3)]); h += `<h2 id="${id}">${inline(L.slice(3))}</h2>`; i++; continue; }
      if (L.startsWith('### ')) { h += `<h3>${inline(L.slice(4))}</h3>`; i++; continue; }
      if (L.startsWith('>')) {
        const buf = []; while (i < lines.length && lines[i].startsWith('>')) { buf.push(lines[i].replace(/^> ?/, '')); i++; }
        h += `<div class="note">${md(buf.join('\n')).html}</div>`; continue;
      }
      if (L.startsWith('|')) {
        const rows = []; while (i < lines.length && lines[i].startsWith('|')) { rows.push(lines[i]); i++; }
        const cells = r => r.replace(/^\||\|$/g, '').split('|').map(c => c.trim());
        let t = '<div class="tw"><table>';
        rows.forEach((r, k) => {
          if (/^\|[\s\-:|]+\|$/.test(r)) return;
          const tag = k === 0 ? 'th' : 'td';
          t += '<tr>' + cells(r).map(c => `<${tag}>${inline(c)}</${tag}>`).join('') + '</tr>';
        });
        h += t + '</table></div>'; continue;
      }
      const li = /^(\s*)(-|\d+\.)\s+(.*)$/;
      if (li.test(L)) {
        const ordered = /\d/.test(L.match(li)[2]);
        let out = ordered ? '<ol>' : '<ul>';
        let open = false, sub = null;
        while (i < lines.length && li.test(lines[i])) {
          const m = lines[i].match(li);
          if (m[1].length >= 2) { if (!sub) sub = []; sub.push(inline(m[3])); }
          else {
            if (sub) { out += '<ul>' + sub.map(x => `<li>${x}</li>`).join('') + '</ul>'; sub = null; }
            if (open) out += '</li>';
            out += `<li>${inline(m[3])}`; open = true;
          }
          i++;
        }
        if (sub) out += '<ul>' + sub.map(x => `<li>${x}</li>`).join('') + '</ul>';
        if (open) out += '</li>';
        h += out + (ordered ? '</ol>' : '</ul>'); continue;
      }
      const buf = []; while (i < lines.length && lines[i].trim() && !/^(##|>|\||\s*-\s|\s*\d+\.\s)/.test(lines[i])) { buf.push(lines[i]); i++; }
      h += `<p>${inline(buf.join(' '))}</p>`;
    }
    return { html: h, heads };
  }

  /* ---------- ачивки ---------- */
  const ACH = [
    { id: 'first', ic: '🚀', name: 'Первый шаг', d: 'Пройти любой тест до конца' },
    { id: 'read1', ic: '📖', name: 'Первая глава', d: 'Прочитать первый конспект' },
    { id: 'read6', ic: '📚', name: 'Книжный червь', d: 'Прочитать 6 конспектов' },
    { id: 'readall', ic: '🧠', name: 'Теоретик', d: 'Прочитать все конспекты модуля' },
    { id: 'pass1', ic: '✅', name: 'Зачёт', d: 'Набрать 70% в любом тесте' },
    { id: 'perfect', ic: '💎', name: 'Без единой ошибки', d: '100% в тесте по теме' },
    { id: 'perfect3', ic: '👑', name: 'Тройная корона', d: '100% в трёх разных тестах' },
    { id: 'combo10', ic: '🔥', name: 'В ударе', d: '10 правильных ответов подряд' },
    { id: 'combo25', ic: '☄️', name: 'Неудержимый', d: '25 правильных ответов подряд' },
    { id: 'streak3', ic: '📅', name: 'Три дня подряд', d: 'Заниматься 3 дня подряд' },
    { id: 'streak7', ic: '🗓️', name: 'Неделя дисциплины', d: 'Заниматься 7 дней подряд' },
    { id: 'half', ic: '🌗', name: 'Экватор', d: 'Сдать на 70%+ шесть тестов' },
    { id: 'all', ic: '🎓', name: 'Модуль закрыт', d: 'Сдать на 70%+ все тесты любого модуля' },
    { id: 'allstar', ic: '🌟', name: 'Отличник', d: '90%+ во всех тестах любого модуля' },
    { id: 'cp1', ic: '🧭', name: 'КТ-1 пройдена', d: 'Сдать контрольную точку 1 модуля 1' },
    { id: 'cp2', ic: '🗺️', name: 'КТ-2 пройдена', d: 'Сдать контрольную точку 2 модуля 1' },
    { id: 'cp3', ic: '⛰️', name: 'КТ-3 пройдена', d: 'Сдать контрольную точку 3 модуля 1' },
    { id: 'cp4', ic: '🏔️', name: 'КТ-4 пройдена', d: 'Сдать контрольную точку 4 модуля 1' },
    { id: 'final', ic: '🏆', name: 'Экзамен сдан', d: '80%+ на итоговом экзамене любого модуля' },
    { id: 'm2all', ic: '🧾', name: 'Налоговед', d: 'Сдать на 70%+ все тесты модуля «Налоги»' },
    { id: 'm2cps', ic: '⚖️', name: 'Знаток НК', d: 'Сдать все контрольные точки модуля «Налоги»' },
    { id: 'm2final', ic: '🏛️', name: 'Экзамен по налогам', d: '80%+ на итоговом экзамене модуля «Налоги»' },
    { id: 'm3all', ic: '📒', name: 'Бухгалтер-практик', d: 'Сдать на 70%+ все тесты модуля «Бухучёт»' },
    { id: 'm3cps', ic: '🧮', name: 'Мастер проводок', d: 'Сдать все контрольные точки модуля «Бухучёт»' },
    { id: 'm3final', ic: '📊', name: 'Экзамен по бухучёту', d: '80%+ на итоговом экзамене модуля «Бухучёт»' },
    { id: 'mods2', ic: '🧩', name: 'Два модуля', d: 'Сдать все тесты в двух модулях' },
    { id: 'mods3', ic: '🎖️', name: 'Три модуля', d: 'Сдать все тесты в трёх модулях' },
    { id: 'fix20', ic: '🛠️', name: 'Работа над ошибками', d: 'Исправить 20 ошибок' },
    { id: 'fix100', ic: '🧰', name: 'Мастер исправлений', d: 'Исправить 100 ошибок' },
    { id: 'q100', ic: '💯', name: 'Сотня', d: 'Ответить на 100 вопросов' },
    { id: 'q500', ic: '🏅', name: 'Пятьсот вопросов', d: 'Ответить на 500 вопросов' },
    { id: 'comeback', ic: '📈', name: 'Камбэк', d: 'Улучшить результат теста на 30+ п.п.' },
    { id: 'persist', ic: '🐢', name: 'Упорство', d: 'Пройти один тест 5 раз' },
    { id: 'owl', ic: '🦉', name: 'Ночная сова', d: 'Закончить тест после 23:00' },
    { id: 'lark', ic: '🐦', name: 'Жаворонок', d: 'Закончить тест до 8:00' },
  ];
  function unlock(id, fresh) { if (!S.ach[id]) { S.ach[id] = today(); fresh.push(id); S.xp += 50; } }
  function checkAch(ctx) {
    const fresh = [];
    const m1 = MODULES[0], m2 = modById('m2'), m3 = modById('m3');
    const closed = MODULES.filter(m => m.topics.length && m.topics.every(passed));
    if (ctx.kind === 'test' || ctx.kind === 'cp' || ctx.kind === 'final') unlock('first', fresh);
    const nr = Object.keys(S.read).length;
    if (nr >= 1) unlock('read1', fresh);
    if (nr >= 6) unlock('read6', fresh);
    if (MODULES.some(m => m.topics.every(id => S.read[id]))) unlock('readall', fresh);
    if (TESTS.some(t => passed(t.id))) unlock('pass1', fresh);
    const perf = TESTS.filter(t => S.tests[t.id] && S.tests[t.id].best >= 1).length;
    if (perf >= 1) unlock('perfect', fresh);
    if (perf >= 3) unlock('perfect3', fresh);
    if (S.bestCombo >= 10) unlock('combo10', fresh);
    if (S.bestCombo >= 25) unlock('combo25', fresh);
    const st = streak(); if (st >= 3) unlock('streak3', fresh); if (st >= 7) unlock('streak7', fresh);
    const np = TESTS.filter(t => passed(t.id)).length;
    if (np >= 6) unlock('half', fresh);
    if (closed.length) unlock('all', fresh);
    if (closed.length >= 2) unlock('mods2', fresh);
    if (closed.length >= 3) unlock('mods3', fresh);
    if (MODULES.some(m => m.topics.every(starred))) unlock('allstar', fresh);
    m1.checkpoints.forEach(cp => { if (cpPassed(cp)) unlock(cp.id, fresh); });
    if (MODULES.some(m => S.cps[m.final.id] && S.cps[m.final.id].best >= 0.8)) unlock('final', fresh);
    if (m2) {
      if (m2.topics.every(passed)) unlock('m2all', fresh);
      if (m2.checkpoints.every(cpPassed)) unlock('m2cps', fresh);
      if (S.cps.m2final && S.cps.m2final.best >= 0.8) unlock('m2final', fresh);
    }
    if (m3) {
      if (m3.topics.every(passed)) unlock('m3all', fresh);
      if (m3.checkpoints.every(cpPassed)) unlock('m3cps', fresh);
      if (S.cps.m3final && S.cps.m3final.best >= 0.8) unlock('m3final', fresh);
    }
    if (S.fixed >= 20) unlock('fix20', fresh);
    if (S.fixed >= 100) unlock('fix100', fresh);
    if (S.answered >= 100) unlock('q100', fresh);
    if (S.answered >= 500) unlock('q500', fresh);
    if (ctx.improve >= 0.3) unlock('comeback', fresh);
    if (TESTS.some(t => S.tests[t.id] && S.tests[t.id].tries >= 5)) unlock('persist', fresh);
    const h = new Date().getHours();
    if (ctx.kind && ctx.kind !== 'read' && h >= 23) unlock('owl', fresh);
    if (ctx.kind && ctx.kind !== 'read' && h < 8 && h >= 4) unlock('lark', fresh);
    return fresh;
  }
  function toast(html) {
    const t = document.createElement('div'); t.className = 'toast'; t.innerHTML = html;
    t.style.top = (14 + document.querySelectorAll('.toast').length * 64) + 'px'; document.body.appendChild(t);
    setTimeout(() => t.remove(), 3200);
  }
  function announce(fresh) {
    fresh.forEach((id, k) => { const a = ACH.find(x => x.id === id); setTimeout(() => toast(`<b>${a.ic} Новая ачивка!</b><br>${a.name}`), 400 + k * 900); });
  }

  /* ---------- навигация ---------- */
  // view: {tab, v, mod?, topic?}; у каждой вкладки свой стек
  const TABS = [['theory', I.book, 'Теория'], ['tests', I.test, 'Тесты'], ['progress', I.chart, 'Прогресс']];
  const stacks = { theory: [{ tab: 'theory', v: 'mods' }], tests: [{ tab: 'tests', v: 'mods' }], progress: [{ tab: 'progress', v: 'home' }] };
  let tab = 'theory', quiz = null, progTab = 'stats';
  const cur = () => stacks[tab][stacks[tab].length - 1];
  function push(view) { stacks[tab].push(Object.assign({ tab }, view)); render(); window.scrollTo(0, 0); }
  function pop() { if (stacks[tab].length > 1) stacks[tab].pop(); render(); window.scrollTo(0, 0); }
  function switchTab(t) {
    if (t === tab) { stacks[t].length = 1; } tab = t; render(); window.scrollTo(0, 0);
  }
  function inQuiz() { const c = cur(); return c.v === 'quiz'; }
  function confirmLeave() { return !quiz || quiz.i === 0 || quiz.done || window.confirm('Выйти из теста? Прогресс этой попытки не сохранится.'); }
  function goBack() {
    const c = cur();
    if (c.v === 'quiz') { if (!confirmLeave()) return; quiz = null; }
    if (c.v === 'result') { quiz = null; while (stacks[tab].length > 1 && ['result', 'quiz'].includes(cur().v)) stacks[tab].pop(); render(); return; }
    pop();
  }
  function renderNav() {
    const nav = $('#nav');
    if (inQuiz()) { nav.style.display = 'none'; return; }
    nav.style.display = 'flex';
    nav.innerHTML = TABS.map(([id, ic, n]) => `<button class="${tab === id ? 'on' : ''}" data-tab="${id}">${ic}<span>${n}</span></button>`).join('');
    nav.querySelectorAll('button').forEach(b => b.onclick = () => { haptic(); switchTab(b.dataset.tab); });
  }
  const backBtn = label => `<button class="back" data-act="back">${I.back}${esc(label)}</button>`;

  /* ---------- экраны ---------- */
  function render() {
    const c = cur(), app = $('#app');
    let h = '';
    if (c.v === 'mods') h = modsView();
    else if (c.v === 'topics') h = c.tab === 'theory' ? theoryTopicsView(c.mod) : testTopicsView(c.mod);
    else if (c.v === 'read') h = readView(c.topic);
    else if (c.v === 'quiz') h = quizView();
    else if (c.v === 'result') h = resultView();
    else if (c.v === 'home') h = progressView();
    app.innerHTML = h;
    bind();
    renderNav();
    if (tg && tg.BackButton) { stacks[tab].length > 1 ? tg.BackButton.show() : tg.BackButton.hide(); }
  }

  function modStats(m) {
    const read = m.topics.filter(id => S.read[id]).length;
    const pass = m.topics.filter(passed).length;
    return { read, pass, n: m.topics.length };
  }
  function modsView() {
    const isT = tab === 'theory';
    let h = `<h1>${isT ? 'Теория' : 'Тесты'}</h1><p class="lead">${isT ? 'Конспекты вебинаров по слайдам курса с актуальными на 2026 год цифрами' : 'Один тест на каждый вебинар, контрольные точки и итоговый экзамен'}</p><div class="list">`;
    MODULES.forEach(m => {
      const s = modStats(m), done = isT ? s.read : s.pass;
      h += `<div class="card item mod" data-mod="${m.id}"><div class="badge">${m.n}</div><div class="grow">
        <div class="small muted" style="font-weight:700;text-transform:uppercase;letter-spacing:.05em">Модуль ${m.n}</div>
        <b style="font-size:17px">${esc(m.title)}</b>
        <div class="small muted" style="margin:2px 0 8px">${s.n} ${plural(s.n, 'тема', 'темы', 'тем')} · ${isT ? `прочитано ${s.read}` : `сдано ${s.pass}`} из ${s.n}</div>
        <div class="bar"><i style="width:${done / s.n * 100}%"></i></div></div><span class="chev" style="color:#fff">${I.chev}</span></div>`;
    });
    SOON.forEach((t, k) => {
      h += `<div class="card item mod soon"><div class="badge">${MODULES.length + k + 1}</div><div class="grow"><b>${t}</b><div class="small">Появится, когда дойдём до этого модуля</div></div></div>`;
    });
    return h + '</div>';
  }

  function theoryTopicsView(mid) {
    const m = modById(mid), s = modStats(m);
    let h = backBtn('Модули') + `<div class="pill">Модуль ${m.n}</div><h1 style="margin-top:10px">${esc(m.title)}</h1>
      <p class="lead">Прочитано ${s.read} из ${s.n}. Выбери тему: каждая тема – один вебинар.</p><div class="list">`;
    m.topics.forEach((id, k) => {
      const t = testById(id), r = S.read[id];
      h += `<div class="card item" data-read="${id}"><div class="badge ${r ? 'done' : ''}">${r ? I.check : k + 1}</div><div class="grow">
        <b>Тема ${k + 1}</b><div class="muted small">${esc(t.subtitle)}</div></div><span class="chev">${I.chev}</span></div>`;
    });
    return h + '</div>';
  }

  function readView(id) {
    const m = modOfTopic(id), k = m.topics.indexOf(id), t = testById(id);
    const r = md(THEORY[id] || 'Конспект скоро появится.');
    const prev = m.topics[k - 1], next = m.topics[k + 1];
    let h = backBtn('Темы модуля') + `<div class="pill">Модуль ${m.n} · Тема ${k + 1}</div><h1 style="margin-top:10px;font-size:24px">${esc(t.subtitle)}</h1>`;
    if (r.heads.length > 2) h += `<div class="toc">${r.heads.map(([hid, txt]) => `<button data-toc="${hid}">${esc(txt)}</button>`).join('')}</div>`;
    h += `<div class="card md">${r.html}</div>
      <div class="list" style="margin-top:16px">
        ${S.read[id] ? `<div class="pill ok plain" style="justify-content:center;padding:10px">${'✓'} Конспект прочитан</div>` : `<button class="btn" data-mark="${id}">${I.check} Прочитано</button>`}
        <button class="btn sec" data-gotest="${id}">${I.test} Пройти тест по теме</button>
      </div>
      <div class="pager">${prev ? `<button class="btn ghost" data-swap="${prev}">← Тема ${k}</button>` : '<span></span>'}${next ? `<button class="btn ghost" data-swap="${next}">Тема ${k + 2} →</button>` : '<span></span>'}</div>`;
    return h;
  }

  function testTopicsView(mid) {
    const m = modById(mid), s = modStats(m);
    let h = backBtn('Модули') + `<div class="pill">Модуль ${m.n}</div><h1 style="margin-top:10px">${esc(m.title)}</h1>
      <p class="lead">Сдано ${s.pass} из ${s.n}. Зачёт — 70%, звезда — 90%.</p><div class="list">`;
    m.topics.forEach((id, k) => {
      const t = testById(id), st = S.tests[id];
      const cls = starred(id) ? 'star' : passed(id) ? 'done' : '';
      const mark = starred(id) ? '★' : passed(id) ? I.check : k + 1;
      h += `<div class="card item" data-start="${id}"><div class="badge ${cls}">${mark}</div><div class="grow"><b>Тема ${k + 1}</b><div class="muted small">${esc(t.subtitle)}</div>
        <div class="muted small">${t.questions.length} вопр.${st && st.tries ? ' · лучший ' + pct(st.best) + ' · попыток ' + st.tries : ''}</div></div><span class="chev">${I.chev}</span></div>`;
      const cp = m.checkpoints.find(c => c.parts[c.parts.length - 1] === id);
      if (cp) {
        const open = cpOpen(cp), done = cpPassed(cp), r = S.cps[cp.id];
        const nums = cp.parts.map(topicNum).join(', ');
        h += `<div class="card item cp ${open ? 'open' : ''}" ${open ? `data-cp="${cp.id}"` : ''}><div class="badge ${done ? 'star' : open ? '' : 'lock'}">${done ? '🏁' : open ? '🚩' : I.lock}</div>
          <div class="grow"><b>${cp.title}</b><div class="muted small">${open ? `${cp.n} вопросов вперемешку из тем ${nums}${r ? ' · лучший ' + pct(r.best) : ''}` : `Откроется, когда сдашь темы ${nums} на 70%+`}</div></div></div>`;
      }
    });
    const fo = finalOpen(m), fr = S.cps[m.final.id];
    h += `<div class="card item cp ${fo ? 'open' : ''}" ${fo ? `data-cp="${m.final.id}"` : ''}><div class="badge ${fr && fr.best >= .8 ? 'star' : fo ? '' : 'lock'}">${fo ? '🏆' : I.lock}</div><div class="grow"><b>${m.final.title}</b>
      <div class="muted small">${fo ? `${m.final.n} случайных вопросов со всего модуля, зачёт от 80%${fr ? ' · лучший ' + pct(fr.best) : ''}` : 'Откроется после всех контрольных точек'}</div></div></div></div>`;
    const w = wrongCount(m.topics);
    if (w) h += `<div style="margin-top:16px"><button class="btn sec" data-fix="${m.id}">Работа над ошибками (${w})</button></div>`;
    return h;
  }

  /* ---------- тест ---------- */
  function startQuiz(kind, id, qs, title) {
    quiz = { kind, id, title, qs: qs.map(q => ({ q, order: shuffle([0, 1, 2, 3]) })), i: 0, picked: null, ok: 0, combo: 0, maxCombo: 0, res: [], done: false };
    touchDay();
    if (tab !== 'tests') { tab = 'tests'; stacks.tests.length = 1; const m = modOfTopic(qs[0] && qs[0]._t); if (m) stacks.tests.push({ tab: 'tests', v: 'topics', mod: m.id }); }
    push({ v: 'quiz' });
  }
  const withRef = (tid, q, i) => Object.assign({ _t: tid, _i: i }, q);
  function startTest(id) {
    const t = testById(id);
    startQuiz('test', id, shuffle(t.questions.map((q, i) => withRef(id, q, i))), topicName(id));
  }
  function startCp(id) {
    const cp = ALL_CP.find(c => c.id === id), m = MODULES.find(mm => mm.final.id === id || mm.checkpoints.includes(cp));
    const parts = cp.parts || m.topics, pool = [];
    parts.forEach(tid => { const t = testById(tid); t && t.questions.forEach((q, i) => pool.push(withRef(tid, q, i))); });
    startQuiz(cp.parts ? 'cp' : 'final', id, shuffle(pool).slice(0, cp.n), cp.title);
  }
  function startMistakes(scope) {
    const m = modById(scope), ids = m ? m.topics : [scope], pool = [];
    ids.forEach(tid => { const t = testById(tid); (S.tests[tid] ? S.tests[tid].wrong : []).forEach(i => t && t.questions[i] && pool.push(withRef(tid, t.questions[i], i))); });
    if (!pool.length) return;
    startQuiz('fix', scope, shuffle(pool), 'Работа над ошибками');
  }

  function quizView() {
    const z = quiz, c = z.qs[z.i], q = c.q, L = 'АБВГ';
    let h = `<div class="top"><button class="back" data-act="quit">${I.back}Выйти</button>${z.combo >= 3 ? `<span class="pill gold plain">🔥 ${z.combo} подряд</span>` : ''}</div>
      <div class="card qcard"><div class="top"><span class="pill">Вопрос ${z.i + 1} из ${z.qs.length}</span><span class="pill plain" style="background:none;padding:0">${I.bolt} +10</span></div>
      <div class="bar" style="margin-top:12px;height:6px"><i style="width:${(z.i / z.qs.length) * 100}%"></i></div>
      <div class="muted small" style="margin-top:12px">${esc(z.title)}${z.kind !== 'test' ? ' · ' + esc(topicName(q._t)) : ''}</div>
      <div class="q">${esc(q.t)}</div>`;
    c.order.forEach((oi, k) => {
      let cls = '';
      if (z.picked !== null) { if (oi === q.a) cls = 'ok'; else if (oi === z.picked) cls = 'bad'; }
      h += `<button class="opt ${cls}" data-opt="${oi}" ${z.picked !== null ? 'disabled' : ''}><span class="l">${L[k]}</span><span>${esc(q.o[oi])}</span></button>`;
    });
    if (z.picked !== null) {
      const right = z.picked === q.a;
      h += `<div class="explain ${right ? 'ok' : 'bad'}"><b>${right ? 'Верно!' : 'Неверно.'}</b> ${esc(q.e)}${q.s ? `<div class="src">Источник: ${esc(q.s)}</div>` : ''}</div>
        <button class="btn" data-act="next">${z.i + 1 < z.qs.length ? 'Дальше' : 'Результат'}</button>`;
    }
    return h + '</div>';
  }
  function pick(oi) {
    const z = quiz; if (z.picked !== null) return;
    const q = z.qs[z.i].q; z.picked = oi; const right = oi === q.a;
    z.res.push(right);
    S.answered++; if (right) { S.correct++; z.ok++; z.combo++; z.maxCombo = Math.max(z.maxCombo, z.combo); S.xp += 10; } else z.combo = 0;
    S.bestCombo = Math.max(S.bestCombo, z.maxCombo);
    const ts = tstat(q._t);
    if (right) { const k = ts.wrong.indexOf(q._i); if (k >= 0) { ts.wrong.splice(k, 1); S.fixed++; } }
    else if (!ts.wrong.includes(q._i)) ts.wrong.push(q._i);
    haptic(right ? 'ok' : 'bad');
    render();
    const ex = document.querySelector('.explain'); ex && ex.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }
  function next() {
    const z = quiz;
    if (z.i + 1 < z.qs.length) { z.i++; z.picked = null; render(); window.scrollTo(0, 0); return; }
    z.done = true; finish();
  }
  function finish() {
    const z = quiz, score = z.ok / z.qs.length; let improve = 0, bonus = 0;
    if (z.kind === 'test') {
      const ts = tstat(z.id); improve = ts.tries ? score - ts.best : 0;
      ts.tries++; ts.last = score; ts.hist.push([today(), Math.round(score * 100)]); if (ts.hist.length > 30) ts.hist.shift();
      if (score > ts.best) { if (score >= STAR && ts.best < STAR) bonus += 100; else if (score >= PASS && ts.best < PASS) bonus += 50; ts.best = score; }
    } else if (z.kind === 'cp' || z.kind === 'final') {
      const r = S.cps[z.id] || (S.cps[z.id] = { tries: 0, best: 0 }); r.tries++;
      if (score > r.best) { if (score >= PASS && r.best < PASS) bonus += 150; r.best = score; }
    }
    if (score === 1 && z.qs.length >= 10) bonus += 100;
    S.xp += bonus; z.bonus = bonus;
    z.fresh = checkAch({ kind: z.kind, improve });
    save();
    stacks[tab][stacks[tab].length - 1] = { tab, v: 'result' };
    render(); window.scrollTo(0, 0);
    announce(z.fresh);
  }
  function resultView() {
    const z = quiz; if (!z) return '';
    const score = z.ok / z.qs.length;
    const verdict = score >= STAR ? ['Блестяще!', 'gold'] : score >= PASS ? ['Зачёт', 'ok'] : ['Пока не зачёт', 'bad'];
    let h = `<div class="muted small" style="text-align:center">${esc(z.title)}${z.kind === 'test' ? ' · ' + esc(testById(z.id).subtitle) : ''}</div><div class="big">${pct(score)}</div>
      <div style="text-align:center"><span class="pill ${verdict[1]}">${verdict[0]}</span> <span class="muted small">${z.ok} из ${z.qs.length} · серия ${z.maxCombo}</span></div>
      <div class="seg" style="justify-content:center;margin:16px 0">${z.res.map(r => `<i class="dot ${r ? 'ok' : 'bad'}"></i>`).join('')}</div>
      <div class="card" style="margin:10px 0">${I.bolt} +${z.ok * 10} XP за ответы${z.bonus ? ` · +${z.bonus} бонус` : ''}${z.fresh.length ? ` · +${z.fresh.length * 50} за ачивки` : ''}</div>`;
    if (z.fresh.length) h += `<div class="list" style="margin:10px 0">${z.fresh.map(id => { const a = ACH.find(x => x.id === id); return `<div class="card row"><span style="font-size:28px">${a.ic}</span><div><b>${a.name}</b><div class="muted small">${a.d}</div></div></div>`; }).join('')}</div>`;
    const wrongN = z.res.filter(r => !r).length;
    h += `<div class="list" style="margin-top:14px">`;
    if (z.kind === 'test') h += `<button class="btn" data-start="${z.id}">Пройти ещё раз</button>`;
    if (wrongN && z.kind === 'test') h += `<button class="btn sec" data-fix="${z.id}">Разобрать ошибки темы (${(S.tests[z.id] || { wrong: [] }).wrong.length})</button>`;
    if (z.kind === 'test' && THEORY[z.id]) h += `<button class="btn sec" data-toread="${z.id}">${I.book} Перечитать конспект</button>`;
    if (z.kind === 'fix' && wrongCount(TESTS.map(t => t.id))) h += `<button class="btn" data-fix="${z.id}">Ещё круг по ошибкам</button>`;
    if (z.kind === 'cp' || z.kind === 'final') h += `<button class="btn" data-cp="${z.id}">Попробовать снова</button>`;
    h += `<button class="btn ghost" data-act="back">К списку тем</button></div>`;
    return h;
  }

  /* ---------- прогресс ---------- */
  function progressView() {
    const lv = level(S.xp), st = streak();
    const ms = MODULES.map(modStats).reduce((a, b) => ({ read: a.read + b.read, pass: a.pass + b.pass, n: a.n + b.n }), { read: 0, pass: 0, n: 0 });
    let h = `<h1>Прогресс</h1>
      <div class="card mod" style="margin-top:14px"><div class="top"><div><div class="small muted" style="font-weight:700;text-transform:uppercase;letter-spacing:.05em">Уровень ${lv.n}</div><b style="font:700 20px Unbounded,Manrope,sans-serif">${lv.name}</b>
      <div class="small muted">${S.xp} XP${lv.next ? ' · до следующего ' + (lv.next - S.xp) : ' · максимум'}</div></div><span class="pill plain" style="background:rgba(255,255,255,.18);color:#fff">🔥 ${st} ${plural(st, 'день', 'дня', 'дней')}</span></div>
      <div class="bar" style="margin-top:12px"><i style="width:${lv.prog * 100}%"></i></div></div>
      <div class="hero"><div class="card"><b>${ms.read}/${ms.n}</b><span class="muted small">конспектов</span></div>
      <div class="card"><b>${ms.pass}/${ms.n}</b><span class="muted small">тестов сдано</span></div>
      <div class="card"><b>${Object.keys(S.ach).length}/${ACH.length}</b><span class="muted small">ачивок</span></div></div>
      <div class="tabs2" style="margin-top:18px">${[['stats', 'Статистика'], ['ach', 'Ачивки'], ['fix', 'Ошибки']].map(([k, n]) => `<button class="${progTab === k ? 'on' : ''}" data-ptab="${k}">${n}</button>`).join('')}</div>`;
    if (progTab === 'stats') h += statsBlock(lv);
    else if (progTab === 'ach') h += achBlock();
    else h += fixBlock();
    return h;
  }
  function statsBlock(lv) {
    let h = `<div class="hero" style="margin-top:0"><div class="card"><b>${S.answered}</b><span class="muted small">ответов</span></div><div class="card"><b>${S.answered ? pct(S.correct / S.answered) : '—'}</b><span class="muted small">точность</span></div><div class="card"><b>${S.bestCombo}</b><span class="muted small">лучшая серия</span></div></div>`;
    MODULES.forEach(m => {
      h += `<h2>Модуль ${m.n}</h2><div class="card"><table><tr><th>Тема</th><th>Конспект</th><th>Лучший</th><th>Попыток</th></tr>`;
      m.topics.forEach((id, k) => { const s = S.tests[id]; h += `<tr><td>${k + 1}</td><td>${S.read[id] ? '✓' : '—'}</td><td>${s && s.tries ? `<span class="pill plain ${s.best >= STAR ? 'gold' : s.best >= PASS ? 'ok' : 'bad'}">${pct(s.best)}</span>` : '—'}</td><td>${s ? s.tries : 0}</td></tr>`; });
      m.checkpoints.concat([m.final]).forEach(c => { const r = S.cps[c.id]; h += `<tr><td colspan="2">${c.title}</td><td>${r ? pct(r.best) : '—'}</td><td>${r ? r.tries : 0}</td></tr>`; });
      h += '</table></div>';
    });
    h += `<h2>Уровни</h2><div class="card small">${LEVELS.map((l, i) => `<div class="row" style="justify-content:space-between;padding:4px 0;${i + 1 === lv.n ? 'font-weight:800;color:var(--accent)' : ''}"><span>${i + 1}. ${l[1]}</span><span class="muted">${l[0]} XP</span></div>`).join('')}</div>
      <p class="muted small">XP: +10 за верный ответ, +50 за первый зачёт теста, +100 за первую «звезду» (90%+), +100 за идеальный тест, +150 за контрольную точку, +50 за каждую ачивку. Дни подряд считаются, когда ты читаешь конспект или проходишь тест.</p>
      <button class="btn ghost" data-act="reset">Сбросить прогресс</button>`;
    return h;
  }
  function achBlock() {
    const n = Object.keys(S.ach).length;
    return `<div class="muted small">Открыто ${n} из ${ACH.length}</div><div class="bar" style="margin:10px 0 16px"><i style="width:${n / ACH.length * 100}%"></i></div>
      <div class="ach">${ACH.map(a => `<div class="card ${S.ach[a.id] ? '' : 'off'}"><div class="ic">${a.ic}</div><b class="small">${a.name}</b><div class="muted small">${a.d}</div>${S.ach[a.id] ? `<div class="muted small" style="margin-top:4px">${S.ach[a.id].split('-').reverse().join('.')}</div>` : ''}</div>`).join('')}</div>`;
  }
  function fixBlock() {
    let h = `<p class="muted small" style="margin-top:0">Сюда попадает каждый вопрос, на который ты ответил неверно. Ответишь верно – вопрос уйдёт из списка. Исправлено всего: ${S.fixed}.</p>`;
    const total = wrongCount(TESTS.map(t => t.id));
    if (!total) return h + `<div class="card">Ошибок нет. Пройди тест, и если где-то ошибёшься, вопрос появится здесь.</div>`;
    MODULES.forEach(m => {
      const w = wrongCount(m.topics); if (!w) return;
      h += `<button class="btn" data-fix="${m.id}" style="margin-bottom:12px">Все ошибки модуля ${m.n} (${w})</button><div class="list">`;
      m.topics.forEach((id, k) => { const n = (S.tests[id] || { wrong: [] }).wrong.length; if (n) h += `<div class="card item" data-fix="${id}"><div class="badge" style="background:var(--bad-bg);color:var(--bad)">${n}</div><div class="grow"><b>Тема ${k + 1}</b><div class="muted small">${esc(testById(id).subtitle)}</div></div><span class="chev">${I.chev}</span></div>`; });
      h += '</div>';
    });
    return h;
  }

  /* ---------- обработчики ---------- */
  function markRead(id) {
    if (S.read[id]) return;
    S.read[id] = today(); S.xp += 20; touchDay();
    const fresh = checkAch({ kind: 'read' }); save(); render(); announce(fresh);
    toast(`<b>${I.bolt} +20 XP</b> за конспект`);
  }
  function bind() {
    const on = (sel, fn) => document.querySelectorAll(sel).forEach(e => e.onclick = () => fn(e));
    on('[data-mod]', e => push({ v: 'topics', mod: e.dataset.mod }));
    on('[data-read]', e => push({ v: 'read', topic: e.dataset.read }));
    on('[data-swap]', e => { stacks[tab][stacks[tab].length - 1].topic = e.dataset.swap; render(); window.scrollTo(0, 0); });
    on('[data-toc]', e => { const t = document.getElementById(e.dataset.toc); t && t.scrollIntoView({ behavior: 'smooth', block: 'start' }); });
    on('[data-mark]', e => markRead(e.dataset.mark));
    on('[data-gotest]', e => startTest(e.dataset.gotest));
    on('[data-toread]', e => { const id = e.dataset.toread, m = modOfTopic(id); quiz = null; tab = 'theory'; stacks.theory = [{ tab: 'theory', v: 'mods' }, { tab: 'theory', v: 'topics', mod: m.id }, { tab: 'theory', v: 'read', topic: id }]; while (stacks.tests.length > 1 && ['result', 'quiz'].includes(stacks.tests[stacks.tests.length - 1].v)) stacks.tests.pop(); render(); window.scrollTo(0, 0); });
    on('[data-start]', e => { if (cur().v === 'result') stacks[tab].pop(); startTest(e.dataset.start); });
    on('[data-cp]', e => { if (cur().v === 'result') stacks[tab].pop(); startCp(e.dataset.cp); });
    on('[data-fix]', e => { if (cur().v === 'result') stacks[tab].pop(); startMistakes(e.dataset.fix); });
    on('[data-opt]', e => pick(+e.dataset.opt));
    on('[data-ptab]', e => { progTab = e.dataset.ptab; render(); });
    on('[data-act]', e => {
      const a = e.dataset.act;
      if (a === 'next') next();
      else if (a === 'back') goBack();
      else if (a === 'quit') { if (confirmLeave()) { quiz = null; stacks[tab].pop(); render(); } }
      else if (a === 'reset') { if (window.confirm('Удалить весь прогресс, XP и ачивки?')) { S = blank(); save(); render(); } }
    });
  }

  /* ---------- старт ---------- */
  function boot() {
    if (tg) {
      try {
        tg.ready(); tg.expand();
        const theme = () => document.documentElement.setAttribute('data-theme', tg.colorScheme === 'dark' ? 'dark' : 'light');
        theme(); tg.onEvent && tg.onEvent('themeChanged', theme);
        tg.setHeaderColor && tg.isVersionAtLeast && tg.isVersionAtLeast('6.1') && tg.setHeaderColor('secondary_bg_color');
        tg.BackButton && tg.BackButton.onClick(goBack);
        tg.enableClosingConfirmation && tg.isVersionAtLeast && tg.isVersionAtLeast('6.2') && tg.enableClosingConfirmation();
      } catch (e) {}
    }
    render();
    cloudLoad(() => render());
  }
  boot();
})();
