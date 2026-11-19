/* Экономика предприятия — тренажёр. Telegram Mini App / обычная веб-страница. */
(function () {
  'use strict';
  const TESTS = window.TESTS || [];
  const tg = window.Telegram && window.Telegram.WebApp && window.Telegram.WebApp.initData !== undefined ? window.Telegram.WebApp : null;
  const PASS = 0.7, STAR = 0.9;
  const CHECKPOINTS = [
    { id: 'cp1', title: 'Контрольная точка 1', parts: [1, 2, 3], n: 20 },
    { id: 'cp2', title: 'Контрольная точка 2', parts: [4, 5, 6], n: 20 },
    { id: 'cp3', title: 'Контрольная точка 3', parts: [7, 8, 9], n: 20 },
    { id: 'cp4', title: 'Контрольная точка 4', parts: [10, 11, 12], n: 20 },
  ];
  const FINAL = { id: 'final', title: 'Итоговый экзамен', n: 40 };
  const LEVELS = [
    [0, 'Стажёр'], [300, 'Помощник бухгалтера'], [800, 'Бухгалтер'], [1600, 'Экономист'],
    [2700, 'Старший экономист'], [4000, 'Финансовый аналитик'], [5600, 'Главный бухгалтер'],
    [7500, 'Финансовый директор'], [10000, 'Аудитор-легенда'],
  ];

  /* ---------- состояние ---------- */
  const KEY = 'econ_tests_v1';
  const blank = () => ({ v: 1, upd: 0, xp: 0, tests: {}, cps: {}, days: [], ach: {}, answered: 0, correct: 0, fixed: 0, bestCombo: 0 });
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
  // Telegram CloudStorage: значения до 4096 символов, режем на куски
  function cloudSave(str) {
    if (!tg || !tg.CloudStorage || !tg.isVersionAtLeast || !tg.isVersionAtLeast('6.9')) return;
    try {
      const parts = str.match(/[\s\S]{1,3800}/g) || [];
      tg.CloudStorage.setItem('n', String(parts.length));
      parts.forEach((p, i) => tg.CloudStorage.setItem('p' + i, p));
    } catch (e) {}
  }
  function cloudLoad(cb) {
    if (!tg || !tg.CloudStorage || !tg.isVersionAtLeast || !tg.isVersionAtLeast('6.9')) return cb();
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
  const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const shuffle = a => { a = a.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };
  const today = () => { const d = new Date(); return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0'); };
  const pct = x => Math.round(x * 100) + '%';
  const testById = id => TESTS.find(t => t.id === id);
  const tstat = id => S.tests[id] || (S.tests[id] = { tries: 0, best: 0, last: null, wrong: [], hist: [] });
  const haptic = t => { try { tg && tg.HapticFeedback && (t === 'ok' || t === 'bad' ? tg.HapticFeedback.notificationOccurred(t === 'ok' ? 'success' : 'error') : tg.HapticFeedback.impactOccurred('light')); } catch (e) {} };
  function level(xp) {
    let i = 0; while (i + 1 < LEVELS.length && xp >= LEVELS[i + 1][0]) i++;
    const cur = LEVELS[i][0], next = LEVELS[i + 1] ? LEVELS[i + 1][0] : null;
    return { n: i + 1, name: LEVELS[i][1], cur, next, prog: next ? (xp - cur) / (next - cur) : 1 };
  }
  function streak() {
    const set = new Set(S.days); let n = 0; const d = new Date();
    if (!set.has(today())) d.setDate(d.getDate() - 1);
    for (;;) { const k = d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0'); if (set.has(k)) { n++; d.setDate(d.getDate() - 1); } else break; }
    return n;
  }
  const passed = id => (S.tests[id] && S.tests[id].best >= PASS);
  const starred = id => (S.tests[id] && S.tests[id].best >= STAR);
  const cpOpen = cp => cp.parts.every(p => passed('p' + p));
  const cpPassed = cp => S.cps[cp.id] && S.cps[cp.id].best >= PASS;
  const finalOpen = () => CHECKPOINTS.every(cpPassed);

  /* ---------- ачивки ---------- */
  const ACH = [
    { id: 'first', ic: '🚀', name: 'Первый шаг', d: 'Пройти любой тест до конца' },
    { id: 'pass1', ic: '✅', name: 'Зачёт', d: 'Набрать 70% в любом тесте' },
    { id: 'perfect', ic: '💎', name: 'Без единой ошибки', d: '100% в тесте по вебинару' },
    { id: 'perfect3', ic: '👑', name: 'Тройная корона', d: '100% в трёх разных тестах' },
    { id: 'combo10', ic: '🔥', name: 'В ударе', d: '10 правильных ответов подряд' },
    { id: 'combo25', ic: '☄️', name: 'Неудержимый', d: '25 правильных ответов подряд' },
    { id: 'streak3', ic: '📅', name: 'Три дня подряд', d: 'Заниматься 3 дня подряд' },
    { id: 'streak7', ic: '🗓️', name: 'Неделя дисциплины', d: 'Заниматься 7 дней подряд' },
    { id: 'half', ic: '🌗', name: 'Экватор', d: 'Сдать на 70%+ шесть тестов' },
    { id: 'all', ic: '🎓', name: 'Весь курс', d: 'Сдать на 70%+ все 12 тестов' },
    { id: 'allstar', ic: '🌟', name: 'Отличник', d: '90%+ во всех 12 тестах' },
    { id: 'cp1', ic: '🧭', name: 'КТ-1 пройдена', d: 'Сдать контрольную точку 1' },
    { id: 'cp2', ic: '🗺️', name: 'КТ-2 пройдена', d: 'Сдать контрольную точку 2' },
    { id: 'cp3', ic: '⛰️', name: 'КТ-3 пройдена', d: 'Сдать контрольную точку 3' },
    { id: 'cp4', ic: '🏔️', name: 'КТ-4 пройдена', d: 'Сдать контрольную точку 4' },
    { id: 'final', ic: '🏆', name: 'Экзамен сдан', d: '80%+ на итоговом экзамене' },
    { id: 'fix20', ic: '🛠️', name: 'Работа над ошибками', d: 'Исправить 20 ошибок' },
    { id: 'fix100', ic: '🧰', name: 'Мастер исправлений', d: 'Исправить 100 ошибок' },
    { id: 'q100', ic: '💯', name: 'Сотня', d: 'Ответить на 100 вопросов' },
    { id: 'q500', ic: '📚', name: 'Пятьсот вопросов', d: 'Ответить на 500 вопросов' },
    { id: 'comeback', ic: '📈', name: 'Камбэк', d: 'Улучшить результат теста на 30+ п.п.' },
    { id: 'persist', ic: '🐢', name: 'Упорство', d: 'Пройти один тест 5 раз' },
    { id: 'owl', ic: '🦉', name: 'Ночная сова', d: 'Закончить тест после 23:00' },
    { id: 'lark', ic: '🐦', name: 'Жаворонок', d: 'Закончить тест до 8:00' },
  ];
  function unlock(id, fresh) { if (!S.ach[id]) { S.ach[id] = today(); fresh.push(id); S.xp += 50; } }
  function checkAch(ctx) {
    const fresh = [];
    const ids = TESTS.map(t => t.id);
    if (ctx.kind === 'test' || ctx.kind === 'cp' || ctx.kind === 'final') unlock('first', fresh);
    if (ids.some(passed)) unlock('pass1', fresh);
    const perf = ids.filter(id => S.tests[id] && S.tests[id].best >= 1).length;
    if (perf >= 1) unlock('perfect', fresh);
    if (perf >= 3) unlock('perfect3', fresh);
    if (S.bestCombo >= 10) unlock('combo10', fresh);
    if (S.bestCombo >= 25) unlock('combo25', fresh);
    const st = streak(); if (st >= 3) unlock('streak3', fresh); if (st >= 7) unlock('streak7', fresh);
    const np = ids.filter(passed).length;
    if (np >= 6) unlock('half', fresh);
    if (ids.length && np === ids.length) unlock('all', fresh);
    if (ids.length && ids.every(starred)) unlock('allstar', fresh);
    CHECKPOINTS.forEach(cp => { if (cpPassed(cp)) unlock(cp.id, fresh); });
    if (S.cps.final && S.cps.final.best >= 0.8) unlock('final', fresh);
    if (S.fixed >= 20) unlock('fix20', fresh);
    if (S.fixed >= 100) unlock('fix100', fresh);
    if (S.answered >= 100) unlock('q100', fresh);
    if (S.answered >= 500) unlock('q500', fresh);
    if (ctx.improve >= 0.3) unlock('comeback', fresh);
    if (ids.some(id => S.tests[id] && S.tests[id].tries >= 5)) unlock('persist', fresh);
    const h = new Date().getHours();
    if (ctx.kind && h >= 23) unlock('owl', fresh);
    if (ctx.kind && h < 8 && h >= 4) unlock('lark', fresh);
    return fresh;
  }
  function toast(html) {
    const t = document.createElement('div'); t.className = 'toast'; t.innerHTML = html; document.body.appendChild(t);
    setTimeout(() => t.remove(), 3200);
  }

  /* ---------- навигация ---------- */
  let screen = 'home', quiz = null;
  const stack = [];
  function go(s, push = true) { if (push && screen !== s) stack.push(screen); screen = s; render(); window.scrollTo(0, 0); }
  function back() { if (quiz && screen === 'quiz') { if (!confirmLeave()) return; quiz = null; } screen = stack.pop() || 'home'; render(); }
  function confirmLeave() { return quiz.i === 0 || quiz.done || window.confirm('Выйти из теста? Прогресс этой попытки не сохранится.'); }
  function renderNav() {
    const nav = $('#nav');
    if (screen === 'quiz') { nav.style.display = 'none'; return; }
    nav.style.display = 'flex';
    const tabs = [['home', '🏠', 'Курс'], ['mistakes', '🛠️', 'Ошибки'], ['stats', '📊', 'Статистика'], ['ach', '🏅', 'Ачивки']];
    nav.innerHTML = tabs.map(([id, ic, n]) => `<button class="${screen === id ? 'on' : ''}" data-tab="${id}"><span>${ic}</span>${n}</button>`).join('');
    nav.querySelectorAll('button').forEach(b => b.onclick = () => { stack.length = 0; go(b.dataset.tab, false); });
    if (tg && tg.BackButton) { stack.length ? tg.BackButton.show() : tg.BackButton.hide(); }
  }

  /* ---------- экраны ---------- */
  function render() {
    const app = $('#app');
    if (tg && tg.BackButton) { (screen === 'quiz' || stack.length) ? tg.BackButton.show() : tg.BackButton.hide(); }
    if (screen === 'home') app.innerHTML = homeView();
    else if (screen === 'quiz') app.innerHTML = quizView();
    else if (screen === 'mistakes') app.innerHTML = mistakesView();
    else if (screen === 'stats') app.innerHTML = statsView();
    else if (screen === 'ach') app.innerHTML = achView();
    else if (screen === 'result') app.innerHTML = resultView();
    bind();
    renderNav();
  }

  function homeView() {
    const lv = level(S.xp), st = streak();
    const np = TESTS.filter(t => passed(t.id)).length;
    let h = `<h1>Экономика предприятия</h1><div class="muted small">ДПО ВШЭ · 12 вебинаров · тест после каждого</div>
    <div class="card" style="margin-top:14px"><div class="top"><div><b>Уровень ${lv.n}: ${lv.name}</b><div class="muted small">${S.xp} XP${lv.next ? ' · до следующего ' + (lv.next - S.xp) : ''}</div></div><span class="pill gold">🔥 ${st} дн.</span></div>
    <div class="bar" style="margin-top:10px"><i style="width:${lv.prog * 100}%"></i></div></div>
    <div class="hero"><div class="card"><b>${np}/${TESTS.length}</b><span class="muted small">тестов сдано</span></div>
    <div class="card"><b>${S.answered ? pct(S.correct / S.answered) : '—'}</b><span class="muted small">точность</span></div>
    <div class="card"><b>${Object.keys(S.ach).length}/${ACH.length}</b><span class="muted small">ачивок</span></div></div>
    <h2>Маршрут курса</h2><div class="list">`;
    TESTS.forEach((t, i) => {
      const s = S.tests[t.id];
      const cls = starred(t.id) ? 'star' : passed(t.id) ? 'done' : '';
      const mark = starred(t.id) ? '★' : passed(t.id) ? '✓' : (i + 1);
      h += `<div class="card item" data-start="${t.id}"><div class="badge ${cls}">${mark}</div><div class="grow"><b>${esc(t.title)}</b><div class="muted small">${esc(t.subtitle)}</div>
      <div class="muted small">${t.questions.length} вопр.${s && s.tries ? ' · лучший ' + pct(s.best) + ' · попыток ' + s.tries : ''}</div></div></div>`;
      const cp = CHECKPOINTS.find(c => c.parts[c.parts.length - 1] === i + 1);
      if (cp) {
        const open = cpOpen(cp), done = cpPassed(cp), r = S.cps[cp.id];
        h += `<div class="card item cp ${open ? 'open' : ''}" ${open ? `data-cp="${cp.id}"` : ''}><div class="badge ${done ? 'star' : open ? '' : 'lock'}">${done ? '🏁' : open ? '🚩' : '🔒'}</div>
        <div class="grow"><b>${cp.title}</b><div class="muted small">${open ? `${cp.n} вопросов вперемешку из частей ${cp.parts.join(', ')}${r ? ' · лучший ' + pct(r.best) : ''}` : `Откроется, когда сдашь части ${cp.parts.join(', ')} на 70%+`}</div></div></div>`;
      }
    });
    const fo = finalOpen(), fr = S.cps.final;
    h += `<div class="card item cp ${fo ? 'open' : ''}" ${fo ? 'data-cp="final"' : ''}><div class="badge ${fr && fr.best >= .8 ? 'star' : fo ? '' : 'lock'}">${fo ? '🏆' : '🔒'}</div><div class="grow"><b>${FINAL.title}</b>
    <div class="muted small">${fo ? `${FINAL.n} случайных вопросов со всего курса, зачёт от 80%${fr ? ' · лучший ' + pct(fr.best) : ''}` : 'Откроется после всех четырёх контрольных точек'}</div></div></div>`;
    h += `</div><p class="muted small" style="margin-top:18px">Зачёт — 70%, звезда — 90%. Вопросы и варианты каждый раз перемешиваются. Ошибки копятся во вкладке «Ошибки».</p>`;
    return h;
  }

  function startQuiz(kind, id, qs, title) {
    quiz = { kind, id, title, qs: qs.map(q => ({ q, order: shuffle([0, 1, 2, 3]) })), i: 0, picked: null, ok: 0, combo: 0, maxCombo: 0, res: [], done: false };
    S.days.includes(today()) || S.days.push(today());
    go('quiz');
  }
  function startTest(id) {
    const t = testById(id);
    startQuiz('test', id, shuffle(t.questions.map((q, i) => Object.assign({ _t: id, _i: i }, q))), t.title);
  }
  function startCp(id) {
    let pool = [], n, title;
    if (id === 'final') { TESTS.forEach(t => t.questions.forEach((q, i) => pool.push(Object.assign({ _t: t.id, _i: i }, q)))); n = FINAL.n; title = FINAL.title; }
    else { const cp = CHECKPOINTS.find(c => c.id === id); cp.parts.forEach(p => { const t = testById('p' + p); t && t.questions.forEach((q, i) => pool.push(Object.assign({ _t: t.id, _i: i }, q))); }); n = cp.n; title = cp.title; }
    startQuiz(id === 'final' ? 'final' : 'cp', id, shuffle(pool).slice(0, n), title);
  }
  function startMistakes(id) {
    const pool = [];
    TESTS.forEach(t => { if (id && t.id !== id) return; (S.tests[t.id] ? S.tests[t.id].wrong : []).forEach(i => t.questions[i] && pool.push(Object.assign({ _t: t.id, _i: i }, t.questions[i]))); });
    if (!pool.length) return;
    startQuiz('fix', id || 'all', shuffle(pool), 'Работа над ошибками');
  }

  function quizView() {
    const z = quiz, cur = z.qs[z.i], q = cur.q, L = 'АБВГ';
    let h = `<div class="top"><button class="link" data-act="quit">✕ Выйти</button><span class="muted small">${z.i + 1} / ${z.qs.length}</span>${z.combo >= 3 ? `<span class="pill gold">🔥 ${z.combo}</span>` : '<span></span>'}</div>
    <div class="bar"><i style="width:${(z.i / z.qs.length) * 100}%"></i></div>
    <div class="muted small" style="margin-top:12px">${esc(z.title)}${z.kind !== 'test' ? ' · ' + esc((testById(q._t) || {}).title || '') : ''}</div>
    <div class="q">${esc(q.t)}</div>`;
    cur.order.forEach((oi, k) => {
      let cls = '';
      if (z.picked !== null) { if (oi === q.a) cls = 'ok'; else if (oi === z.picked) cls = 'bad'; }
      h += `<button class="opt ${cls}" data-opt="${oi}" ${z.picked !== null ? 'disabled' : ''}><b>${L[k]}.</b> ${esc(q.o[oi])}</button>`;
    });
    if (z.picked !== null) {
      const right = z.picked === q.a;
      h += `<div class="explain ${right ? 'ok' : 'bad'}"><b>${right ? 'Верно!' : 'Неверно.'}</b> ${esc(q.e)}${q.s ? `<div class="src">Источник: ${esc(q.s)}</div>` : ''}</div>
      <button class="btn" data-act="next">${z.i + 1 < z.qs.length ? 'Дальше' : 'Результат'}</button>`;
    }
    return h;
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
    go('result', false);
    z.fresh.forEach((id, k) => { const a = ACH.find(x => x.id === id); setTimeout(() => toast(`<b>${a.ic} Новая ачивка!</b><br>${a.name}`), 400 + k * 900); });
  }
  function resultView() {
    const z = quiz, score = z.ok / z.qs.length;
    const verdict = score >= STAR ? ['Блестяще!', 'gold'] : score >= PASS ? ['Зачёт', 'ok'] : ['Пока не зачёт', 'bad'];
    let h = `<div class="muted small">${esc(z.title)}</div><div class="big">${pct(score)}</div>
    <div style="text-align:center"><span class="pill ${verdict[1]}">${verdict[0]}</span> <span class="muted small">${z.ok} из ${z.qs.length} · серия ${z.maxCombo}</span></div>
    <div class="seg" style="justify-content:center;margin:14px 0">${z.res.map(r => `<i class="dot ${r ? 'ok' : 'bad'}"></i>`).join('')}</div>
    <div class="card" style="margin:10px 0">+${z.ok * 10} XP за ответы${z.bonus ? ` · +${z.bonus} бонус` : ''}${z.fresh.length ? ` · +${z.fresh.length * 50} за ачивки` : ''}</div>`;
    if (z.fresh.length) h += `<div class="list" style="margin:10px 0">${z.fresh.map(id => { const a = ACH.find(x => x.id === id); return `<div class="card row"><span style="font-size:26px">${a.ic}</span><div><b>${a.name}</b><div class="muted small">${a.d}</div></div></div>`; }).join('')}</div>`;
    const wrongN = z.res.filter(r => !r).length;
    h += `<div class="list" style="margin-top:14px">`;
    if (z.kind === 'test') h += `<button class="btn" data-start="${z.id}">Пройти ещё раз</button>`;
    if (wrongN && z.kind === 'test') h += `<button class="btn sec" data-fix="${z.id}">Разобрать ошибки (${(S.tests[z.id] || { wrong: [] }).wrong.length})</button>`;
    if (z.kind === 'fix' && Object.values(S.tests).some(t => t.wrong.length)) h += `<button class="btn" data-fix="${z.id === 'all' ? '' : z.id}">Ещё круг по ошибкам</button>`;
    if (z.kind === 'cp' || z.kind === 'final') h += `<button class="btn" data-cp="${z.id}">Попробовать снова</button>`;
    h += `<button class="btn ghost" data-act="home">К маршруту курса</button></div>`;
    return h;
  }

  function mistakesView() {
    const total = TESTS.reduce((s, t) => s + ((S.tests[t.id] || { wrong: [] }).wrong.length), 0);
    let h = `<h1>Работа над ошибками</h1><div class="muted small">Сюда попадает каждый вопрос, на который ты ответил неверно. Ответил верно — вопрос уходит из списка. Исправлено всего: ${S.fixed}.</div>`;
    if (!total) return h + `<div class="card" style="margin-top:16px">Ошибок нет. Пройди тест, и если где-то ошибёшься, вопрос появится здесь.</div>`;
    h += `<div style="margin:16px 0"><button class="btn" data-fix="">Все ошибки вперемешку (${total})</button></div><div class="list">`;
    TESTS.forEach(t => { const w = (S.tests[t.id] || { wrong: [] }).wrong.length; if (w) h += `<div class="card item" data-fix="${t.id}"><div class="badge" style="background:var(--bad-bg);color:var(--bad)">${w}</div><div class="grow"><b>${esc(t.title)}</b><div class="muted small">${esc(t.subtitle)}</div></div></div>`; });
    return h + '</div>';
  }

  function statsView() {
    const lv = level(S.xp);
    let h = `<h1>Статистика</h1>
    <div class="hero"><div class="card"><b>${S.answered}</b><span class="muted small">ответов</span></div><div class="card"><b>${S.answered ? pct(S.correct / S.answered) : '—'}</b><span class="muted small">точность</span></div><div class="card"><b>${S.bestCombo}</b><span class="muted small">лучшая серия</span></div></div>
    <div class="hero"><div class="card"><b>${S.xp}</b><span class="muted small">XP · ур. ${lv.n}</span></div><div class="card"><b>${streak()}</b><span class="muted small">дней подряд</span></div><div class="card"><b>${S.days.length}</b><span class="muted small">дней занятий</span></div></div>
    <h2>По вебинарам</h2><div class="card"><table><tr><th>Тест</th><th>Лучший</th><th>Последний</th><th>Попыток</th></tr>`;
    TESTS.forEach(t => { const s = S.tests[t.id]; h += `<tr><td>${esc(t.title)}</td><td>${s && s.tries ? `<span class="pill ${s.best >= STAR ? 'gold' : s.best >= PASS ? 'ok' : 'bad'}">${pct(s.best)}</span>` : '—'}</td><td>${s && s.last !== null && s.tries ? pct(s.last) : '—'}</td><td>${s ? s.tries : 0}</td></tr>`; });
    h += `</table></div><h2>Контрольные точки</h2><div class="card"><table><tr><th></th><th>Лучший</th><th>Попыток</th></tr>`;
    CHECKPOINTS.concat([FINAL]).forEach(c => { const r = S.cps[c.id]; h += `<tr><td>${c.title}</td><td>${r ? pct(r.best) : '—'}</td><td>${r ? r.tries : 0}</td></tr>`; });
    h += `</table></div><h2>Уровни</h2><div class="card small">${LEVELS.map((l, i) => `<div class="row" style="justify-content:space-between;padding:3px 0;${i + 1 === lv.n ? 'font-weight:700;color:var(--accent)' : ''}"><span>${i + 1}. ${l[1]}</span><span class="muted">${l[0]} XP</span></div>`).join('')}</div>
    <p class="muted small">XP: +10 за верный ответ, +50 за первый зачёт теста, +100 за первую «звезду» (90%+), +100 за идеальный тест, +150 за контрольную точку, +50 за каждую ачивку.</p>
    <button class="btn ghost" data-act="reset">Сбросить прогресс</button>`;
    return h;
  }

  function achView() {
    const n = Object.keys(S.ach).length;
    return `<h1>Ачивки</h1><div class="muted small">Открыто ${n} из ${ACH.length}</div><div class="bar" style="margin:10px 0 16px"><i style="width:${n / ACH.length * 100}%"></i></div>
    <div class="ach">${ACH.map(a => `<div class="card ${S.ach[a.id] ? '' : 'off'}"><div class="ic">${a.ic}</div><b class="small">${a.name}</b><div class="muted small">${a.d}</div>${S.ach[a.id] ? `<div class="muted small">${S.ach[a.id].split('-').reverse().join('.')}</div>` : ''}</div>`).join('')}</div>`;
  }

  function bind() {
    document.querySelectorAll('[data-start]').forEach(e => e.onclick = () => startTest(e.dataset.start));
    document.querySelectorAll('[data-cp]').forEach(e => e.onclick = () => startCp(e.dataset.cp));
    document.querySelectorAll('[data-fix]').forEach(e => e.onclick = () => startMistakes(e.dataset.fix));
    document.querySelectorAll('[data-opt]').forEach(e => e.onclick = () => pick(+e.dataset.opt));
    document.querySelectorAll('[data-act]').forEach(e => e.onclick = () => {
      const a = e.dataset.act;
      if (a === 'next') next();
      else if (a === 'quit') { if (confirmLeave()) { quiz = null; stack.length = 0; go('home', false); } }
      else if (a === 'home') { quiz = null; stack.length = 0; go('home', false); }
      else if (a === 'reset') { if (window.confirm('Удалить весь прогресс, XP и ачивки?')) { S = blank(); save(); render(); } }
    });
  }

  /* ---------- старт ---------- */
  function boot() {
    if (tg) {
      try {
        tg.ready(); tg.expand();
        document.documentElement.setAttribute('data-theme', tg.colorScheme === 'dark' ? 'dark' : 'light');
        tg.onEvent && tg.onEvent('themeChanged', () => document.documentElement.setAttribute('data-theme', tg.colorScheme === 'dark' ? 'dark' : 'light'));
        tg.BackButton && tg.BackButton.onClick(() => { if (screen === 'quiz') { if (confirmLeave()) { quiz = null; stack.length = 0; go('home', false); } } else back(); });
        tg.enableClosingConfirmation && tg.isVersionAtLeast && tg.isVersionAtLeast('6.2') && tg.enableClosingConfirmation();
      } catch (e) {}
    }
    render();
    cloudLoad(() => render());
  }
  boot();
})();
