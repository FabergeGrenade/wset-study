/* WSET Level 2 study app. Plain JS, no build step. Progress lives in localStorage. */
'use strict';

const LO = {
  1: { short: 'Vineyard', full: 'Environment and grape growing', n: 5 },
  2: { short: 'Winemaking', full: 'Winemaking and bottle ageing', n: 4 },
  3: { short: 'Principal grapes', full: 'The principal grape varieties', n: 19 },
  4: { short: 'Regional grapes', full: 'Regionally important varieties', n: 12 },
  5: { short: 'Sparkling, fortified', full: 'Sparkling and fortified wines', n: 6 },
  6: { short: 'Service, food', full: 'Storage, service and food', n: 4 },
};
const LOS = [1, 2, 3, 4, 5, 6];
const KEY = 'wset2-progress';
const DAY = 86400000;
const GRADES = [[85, 'Distinction'], [70, 'Merit'], [55, 'Pass'], [45, 'Fail'], [0, 'Fail unclassified']];

let DATA = { questions: [], cards: [], workbook: { chapters: [] } };
let Q = {}, C = {}, SEC = {};
let S; // persisted state
let session = null; // current drill (in memory)
let cardRun = null; // current flashcard session (in memory)
let timerId = null;

/* ---------- utilities ---------- */
const $ = (sel) => document.querySelector(sel);
const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const dateKey = (t) => { const d = new Date(t); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`; };
const todayKey = () => dateKey(Date.now());
const startOfToday = () => { const d = new Date(); d.setHours(0, 0, 0, 0); return d.getTime(); };
function shuffle(a) { a = a.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; }
const pct = (a, b) => (b ? Math.round((100 * a) / b) : 0);
const grade = (p) => GRADES.find(([min]) => p >= min)[1];
const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
function daysUntil(dateStr) {
  const [y, m, d] = dateStr.split('-').map(Number);
  return Math.round((new Date(y, m - 1, d).getTime() - startOfToday()) / DAY);
}
function fmtDate(dateStr, opts = { weekday: 'short', day: 'numeric', month: 'short' }) {
  const [y, m, d] = dateStr.split('-').map(Number);
  return new Date(y, m - 1, d).toLocaleDateString('en-GB', opts);
}
const l1 = (item) => (item && item.l1 && S.settings.showL1 ? ' <span class="badge-l1" title="Also in Level 1">L1</span>' : '');
function toast(msg) {
  const el = document.createElement('div'); el.className = 'toast'; el.textContent = msg;
  document.body.appendChild(el); setTimeout(() => el.remove(), 2600);
}
const ICON = {
  close: '<svg aria-hidden="true" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><path d="M6 6l12 12M18 6L6 18"/></svg>',
  back: '<svg aria-hidden="true" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><path d="M15 5l-7 7 7 7"/></svg>',
  gear: '<svg aria-hidden="true" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><circle cx="12" cy="12" r="3"/><path d="M12 2v3M12 19v3M4.2 4.2l2.1 2.1M17.7 17.7l2.1 2.1M2 12h3M19 12h3M4.2 19.8l2.1-2.1M17.7 6.3l2.1-2.1"/></svg>',
  tick: '<svg role="img" aria-label="Correct answer" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#1D6FA3" stroke-width="2.8"><path d="M5 12.5l4.5 4.5L19 7"/></svg>',
  cross: '<svg role="img" aria-label="Wrong answer" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#B23A0A" stroke-width="2.8"><path d="M6 6l12 12M18 6L6 18"/></svg>',
};

/* ---------- state ---------- */
function blankState() {
  return {
    v: 1, ans: [], cardEv: [], done: {}, mocks: [], flags: {}, activeMock: null, lastExport: null,
    settings: { mockFeedback: 'end', examDate: '2026-12-07', floorQ: 20, floorC: 20, showL1: true },
  };
}
function load() {
  try {
    const raw = localStorage.getItem(KEY);
    const st = raw ? JSON.parse(raw) : blankState();
    const b = blankState();
    for (const k of Object.keys(b)) if (st[k] === undefined) st[k] = b[k];
    st.settings = { ...b.settings, ...st.settings };
    return st;
  } catch (e) { console.error(e); return blankState(); }
}
function save() {
  try { localStorage.setItem(KEY, JSON.stringify(S)); }
  catch (e) { toast('Could not save progress: storage is full or blocked.'); }
}

/* ---------- derived progress ---------- */
function eventsByQ(before = Infinity) {
  const m = {};
  for (const e of S.ans) if (e.t < before) (m[e.q] ||= []).push(e);
  for (const k in m) m[k].sort((a, b) => a.t - b.t);
  return m;
}
// A question is in the mistakes pile if it was ever answered wrongly and, since the last wrong answer,
// has not been answered correctly on two different days.
function mistakeInfo(before = Infinity) {
  const by = eventsByQ(before); const pile = {};
  for (const q in by) {
    if (!Q[q]) continue;
    const ev = by[q]; let lastWrong = -1;
    ev.forEach((e, i) => { if (!e.ok) lastWrong = i; });
    if (lastWrong < 0) continue;
    const days = new Set(ev.slice(lastWrong + 1).filter((e) => e.ok).map((e) => dateKey(e.t)));
    if (days.size < 2) pile[q] = days.size;
  }
  return pile;
}
function loStats(lo, last = 30) {
  const ids = new Set(DATA.questions.filter((q) => q.lo === lo).map((q) => q.id));
  const ev = S.ans.filter((e) => ids.has(e.q)).sort((a, b) => b.t - a.t).slice(0, last);
  const right = ev.filter((e) => e.ok).length;
  const seen = new Set(S.ans.filter((e) => ids.has(e.q)).map((e) => e.q)).size;
  return { n: ev.length, right, p: ev.length ? right / ev.length : null, seen, total: ids.size };
}
function predicted() {
  const st = LOS.map((lo) => ({ lo, ...loStats(lo) }));
  const missing = st.filter((s) => s.n < 10);
  if (missing.length) return { locked: true, missing };
  let mean = 0, varr = 0;
  for (const s of st) {
    const w = LO[s.lo].n; mean += w * s.p;
    varr += w * w * s.p * (1 - s.p) / s.n + w * s.p * (1 - s.p);
  }
  const sd = Math.sqrt(varr);
  const lo = Math.max(0, Math.round(mean - 1.28 * sd)), hi = Math.min(50, Math.round(mean + 1.28 * sd));
  const m = Math.round(mean);
  return { locked: false, mark: m, lo, hi, grade: grade(pct(m, 50)) };
}
function cardStatus(before = Infinity) {
  const by = {};
  for (const e of S.cardEv) if (e.t < before) (by[e.c] ||= []).push(e);
  const st = {};
  for (const c of DATA.cards) {
    const ev = (by[c.id] || []).sort((a, b) => a.t - b.t);
    if (!ev.length) { st[c.id] = { s: 'new', last: 0 }; continue; }
    let lastMiss = -1; ev.forEach((e, i) => { if (!e.k) lastMiss = i; });
    const days = new Set(ev.slice(lastMiss + 1).filter((e) => e.k).map((e) => dateKey(e.t)));
    const last = ev[ev.length - 1];
    st[c.id] = { s: days.size >= 2 ? 'known' : (last.k ? 'learning' : 'missed'), last: last.t };
  }
  return st;
}
function daily() {
  const t0 = startOfToday();
  const days = Math.max(1, daysUntil(S.settings.examDate));
  const seenBefore = new Set(S.ans.filter((e) => e.t < t0).map((e) => e.q));
  const unseen = DATA.questions.filter((q) => !seenBefore.has(q.id)).length;
  const pile = Object.keys(mistakeInfo(t0)).length;
  const tq = Math.max(S.settings.floorQ, Math.ceil((unseen + pile) / days));
  const cs = cardStatus(t0);
  const notKnown = DATA.cards.filter((c) => cs[c.id].s !== 'known').length;
  const tc = Math.max(S.settings.floorC, Math.ceil(notKnown / days));
  const dq = S.ans.filter((e) => e.t >= t0).length;
  const dc = S.cardEv.filter((e) => e.t >= t0).length;
  return { tq, tc, dq, dc };
}
function seenCount() { const m = {}; for (const e of S.ans) m[e.q] = (m[e.q] || 0) + 1; return m; }
function pickLeastSeen(ids, n) {
  const seen = seenCount();
  return shuffle(ids).sort((a, b) => (seen[a] || 0) - (seen[b] || 0)).slice(0, n);
}
function record(q, ok, mock) { S.ans.push({ q, t: Date.now(), ok, ...(mock ? { m: mock } : {}) }); }

/* ---------- routing ---------- */
const routes = {
  home: viewHome, practise: viewPractise, q: viewDrill, mock: viewMock, result: viewResult,
  cards: viewCards, cardrun: viewCardRun, workbook: viewWorkbook, wb: viewSection,
  stats: viewStats, settings: viewSettings, flags: viewFlags,
};
function go(path) { if (location.hash === '#/' + path) render(); else location.hash = '#/' + path; }
function render() {
  clearInterval(timerId); timerId = null;
  const [name, ...rest] = (location.hash.replace(/^#\//, '') || 'home').split('/');
  const view = routes[name] || viewHome;
  const focus = ['q', 'mock', 'cardrun'].includes(name);
  document.body.classList.toggle('focus', focus);
  const tab = { home: 'home', settings: 'home', practise: 'practise', result: 'practise', flags: 'stats', cards: 'cards', workbook: 'workbook', wb: 'workbook', stats: 'stats' }[name];
  document.querySelectorAll('#tabs a').forEach((a) => a.classList.toggle('on', a.dataset.tab === tab));
  $('#app').innerHTML = view(...rest.map(decodeURIComponent));
  if (!focus) window.scrollTo(0, 0);
  if (name === 'mock') startTimer();
}
window.addEventListener('hashchange', render);

/* ---------- actions (event delegation) ---------- */
const act = {};
document.addEventListener('click', (ev) => {
  const el = ev.target.closest('[data-act]');
  if (!el) return;
  ev.preventDefault();
  const fn = act[el.dataset.act];
  if (fn) fn(el.dataset.arg, el);
});
document.addEventListener('change', (ev) => {
  const el = ev.target.closest('[data-change]');
  if (el && act[el.dataset.change]) act[el.dataset.change](el.value, el);
});

/* ---------- HOME ---------- */
function viewHome() {
  const days = daysUntil(S.settings.examDate);
  const pr = predicted();
  const d = daily();
  const pile = Object.keys(mistakeInfo()).length;
  const st = LOS.map((lo) => ({ lo, ...loStats(lo) }));
  const scored = st.filter((s) => s.n >= 5);
  const weakest = scored.length ? scored.reduce((a, b) => (b.p < a.p ? b : a)).lo : null;
  const totalDone = Math.min(d.dq, d.tq) + Math.min(d.dc, d.tc);
  const exportOld = (S.ans.length || S.cardEv.length) && (!S.lastExport || Date.now() - S.lastExport > 3 * DAY);
  const am = S.activeMock;
  const courseDays = ['2026-11-23', '2026-11-30', S.settings.examDate];
  return `<div class="stack">
  <div class="hero stack" style="gap:6px">
    <div class="row between"><span class="muted small">Exam ${esc(fmtDate(S.settings.examDate))} · course ${courseDays.slice(0, 2).map((x) => fmtDate(x, { day: 'numeric', month: 'short' })).join(', ')}</span>
      <button class="iconbtn" style="background:rgba(255,255,255,.18);color:#fff;margin:-6px -8px 0 0" data-act="nav" data-arg="settings" aria-label="Settings">${ICON.gear}</button></div>
    <div class="row between" style="align-items:flex-end">
      <div style="font-size:40px;font-weight:700;line-height:1.05;white-space:nowrap">${days > 0 ? days + (days === 1 ? ' day' : ' days') : days === 0 ? 'Exam day' : 'Done'}</div>
      <a href="#/stats" style="color:#fff;text-decoration:none;text-align:right" aria-label="Predicted score">
        <div class="muted small">Predicted</div>
        ${pr.locked ? '<div style="font-size:18px;font-weight:700">Not yet</div>'
          : `<div style="font-size:26px;font-weight:700;line-height:1.1">${pr.mark}/50</div><span class="pill">${pr.grade}</span>`}
      </a>
    </div>
  </div>
  ${am ? `<div class="card row between"><div><h3>Mock exam in progress</h3><p class="muted small">${Object.keys(am.picks).length} of ${am.qs.length} answered</p></div><a class="btn small" href="#/mock">Resume</a></div>` : ''}
  <div class="card stack" style="gap:12px">
    <div class="row between"><h2>Today</h2><span class="muted small">${d.dq}/${d.tq} questions · ${d.dc}/${d.tc} cards</span></div>
    <div class="bar"><i style="width:${pct(totalDone, d.tq + d.tc)}%"></i></div>
    <div class="row">
      <button class="btn grow" data-act="continueToday">${d.dq >= d.tq && d.dc >= d.tc ? 'Target met. Keep going?' : 'Keep going'}</button>
      <button class="btn ghost" data-act="startMistakes" ${pile ? '' : 'disabled'}>${pile} mistake${pile === 1 ? '' : 's'}</button>
    </div>
  </div>
  ${exportOld ? `<div class="notice">Your progress is only saved on this device. ${S.lastExport ? 'Last export ' + Math.floor((Date.now() - S.lastExport) / DAY) + ' days ago.' : 'You have not exported it yet.'} <a href="#/settings">Export now</a></div>` : ''}
  <p class="muted small" style="padding-left:4px">Your topics · score over last 30 answers</p>
  <div class="grid2">${st.map((s) => `<button class="tile lo${s.lo}${s.lo === weakest ? ' weak' : ''}" data-act="startLo" data-arg="${s.lo}">
      <span class="k">LO${s.lo} · ${LO[s.lo].n} Q${s.lo === weakest ? ' · weakest' : ''}</span>
      <span class="t">${LO[s.lo].short}</span>
      <span class="v">${!s.total ? '<span style="font-size:14px;font-weight:500">No questions yet</span>' : s.n >= 5 ? Math.round(s.p * 100) + '%' : `<span style="font-size:14px;font-weight:500">${s.n ? s.n + ' answered' : 'Not started'}</span>`}</span></button>`).join('')}
  </div>
  ${nextSectionHint()}
</div>`;
}
function nextSectionHint() {
  for (const ch of DATA.workbook.chapters) for (const s of ch.sections) if (s.html && !S.done[s.id])
    return `<a class="card row between" style="text-decoration:none" href="#/wb/${s.id}"><span>Next in workbook: ${esc(s.id)} ${esc(s.title)}${l1(s)}</span><span class="muted">›</span></a>`;
  return '';
}
act.nav = (p) => go(p);
act.continueToday = () => {
  const d = daily();
  if (d.dq < d.tq || d.dc >= d.tc) {
    const pile = Object.keys(mistakeInfo());
    const ids = pile.length >= 5 ? shuffle(pile).slice(0, 10) : pickLeastSeen(DATA.questions.map((q) => q.id), 10);
    startDrill(ids, 'Today’s practice', null);
  } else startCards('all');
};
act.startMistakes = () => {
  const ids = Object.keys(mistakeInfo());
  if (!ids.length) return toast('No mistakes to revisit.');
  startDrill(shuffle(ids).slice(0, 20), 'Revisit mistakes', null);
};
act.startLo = (lo) => {
  lo = Number(lo);
  const ids = DATA.questions.filter((q) => q.lo === lo).map((q) => q.id);
  if (!ids.length) return toast(`No ${LO[lo].short} questions yet. They arrive in Phase 1.`);
  startDrill(pickLeastSeen(ids, 10), `LO${lo} · ${LO[lo].short}`, lo);
};

/* ---------- PRACTISE ---------- */
let drillLen = 10;
function viewPractise() {
  const pile = Object.keys(mistakeInfo()).length;
  const avail = LOS.map((lo) => DATA.questions.filter((q) => q.lo === lo).length);
  const full = LOS.every((lo, i) => avail[i] >= LO[lo].n);
  const n = LOS.reduce((s, lo, i) => s + Math.min(avail[i], LO[lo].n), 0);
  const secs = [];
  for (const ch of DATA.workbook.chapters) for (const s of ch.sections) {
    const k = DATA.questions.filter((q) => q.sec === s.id).length;
    if (k) secs.push({ ...s, lo: ch.lo, k });
  }
  return `<div class="stack">
  <h1>Practise</h1>
  <div class="card stack" style="gap:10px">
    <div class="row between"><h2>Mock exam</h2><span class="muted small">${full ? '50 Q · 60 min' : `${n} Q · ${Math.round(60 * n / 50)} min`}</span></div>
    ${full ? '<p class="muted small">Weighted like the real paper. No marking until you submit (change this in Settings).</p>'
      : `<p class="muted small">Partial mock: the bank doesn’t cover every outcome yet, so this uses the outcomes that have questions, at their real exam weighting, with time scaled to match.</p>`}
    ${S.activeMock ? '<a class="btn" href="#/mock">Resume mock in progress</a>' : `<button class="btn" data-act="startMock" ${n ? '' : 'disabled'}>Start mock exam</button>`}
  </div>
  <div class="card row between"><div><h2>Revisit mistakes</h2><p class="muted small">${pile} waiting. A question leaves after two right answers on different days.</p></div>
    <button class="btn small" data-act="startMistakes" ${pile ? '' : 'disabled'}>Start</button></div>
  <div class="card stack" style="gap:12px">
    <h2>Topic drill</h2>
    <div class="seg" role="group" aria-label="Drill length">${[10, 20, 0].map((v) => `<button data-act="drillLen" data-arg="${v}" aria-pressed="${drillLen === v}">${v || 'All'}</button>`).join('')}</div>
    <div class="grid2">${LOS.map((lo, i) => `<button class="tile lo${lo}" data-act="drillLo" data-arg="${lo}" ${avail[i] ? '' : 'disabled style="opacity:.5"'}><span class="k">LO${lo} · ${avail[i]} questions</span><span class="t">${LO[lo].short}</span></button>`).join('')}</div>
    <h3 style="margin-top:6px">By section</h3>
    <div class="list">${secs.map((s) => `<button data-act="drillSec" data-arg="${s.id}"><span class="row"><span class="dot lo${s.lo}"></span>${esc(s.id)} ${esc(s.title)}${l1(s)}</span><span class="sub">${s.k} Q</span></button>`).join('')}</div>
  </div>
</div>`;
}
act.drillLen = (v) => { drillLen = Number(v); render(); };
act.drillLo = (lo) => {
  lo = Number(lo); const ids = DATA.questions.filter((q) => q.lo === lo).map((q) => q.id);
  startDrill(pickLeastSeen(ids, drillLen || ids.length), `LO${lo} · ${LO[lo].short}`, lo);
};
act.drillSec = (id) => {
  const ids = DATA.questions.filter((q) => q.sec === id).map((q) => q.id);
  startDrill(pickLeastSeen(ids, drillLen || ids.length), `${id} ${SEC[id]?.title || ''}`, SEC[id]?.lo);
};

/* ---------- DRILL ---------- */
function startDrill(ids, title, lo) {
  if (!ids.length) return toast('No questions available.');
  session = { title, lo, qs: ids, i: 0, order: Object.fromEntries(ids.map((q) => [q, shuffle([0, 1, 2, 3])])), picks: {} };
  go('q');
}
function headColour(q, fallbackLo) { return `var(--lo${q?.lo || fallbackLo || 3})`; }
function optionsHtml(q, order, pick, reveal, actName) {
  return `<div class="opts">${order.map((oi, pos) => {
    const L = 'ABCD'[pos]; let cls = 'opt', mark = '';
    if (reveal) {
      if (oi === q.a) { cls += ' right'; mark = `<span class="mark">${ICON.tick}</span>`; }
      else if (oi === pick) { cls += ' wrong'; mark = `<span class="mark">Yours ${ICON.cross}</span>`; }
      else cls += ' dim';
    } else if (oi === pick) cls += ' sel';
    return `<button class="${cls}" data-act="${actName}" data-arg="${oi}" ${reveal && actName === 'drillPick' ? 'disabled' : ''}><span class="L">${L}</span><span class="grow">${esc(q.o[oi])}</span>${mark}</button>`;
  }).join('')}</div>`;
}
function explainHtml(q) {
  return `<div class="explain"><p>${esc(q.ex)}</p><p class="muted small">Book p. ${esc(q.p)}${SEC[q.sec] ? ` · <a href="#/wb/${q.sec}">Workbook ${esc(q.sec)}</a>` : ''}</p></div>`;
}
function viewDrill() {
  if (!session) { setTimeout(() => go('practise')); return ''; }
  const s = session;
  if (s.i >= s.qs.length) return drillSummary();
  const q = Q[s.qs[s.i]]; const pick = s.picks[q.id]; const reveal = pick !== undefined;
  return `<div class="qhead on-colour" style="background:${headColour(q, s.lo)}">
    <div class="row between"><button class="iconbtn" data-act="endDrill" aria-label="End drill">${ICON.close}</button>
      <span class="small" style="font-weight:500">LO${q.lo} · ${esc(LO[q.lo].short)}${l1(q)}</span><span style="font-weight:700">${s.i + 1}/${s.qs.length}</span></div>
    <div class="bar"><i style="width:${pct(s.i + (reveal ? 1 : 0), s.qs.length)}%"></i></div>
    <div class="qtext">${esc(q.q)}</div></div>
  ${optionsHtml(q, s.order[q.id], pick, reveal, 'drillPick')}
  ${reveal ? explainHtml(q) + `<div class="actions"><button class="btn ghost" data-act="flagQ" data-arg="${q.id}">${S.flags[q.id] ? 'Flagged' : 'Flag'}</button><button class="btn" data-act="drillNext">${s.i + 1 < s.qs.length ? 'Next question' : 'See results'}</button></div>` : ''}`;
}
act.drillPick = (oi) => {
  const s = session; const q = Q[s.qs[s.i]];
  if (s.picks[q.id] !== undefined) return;
  s.picks[q.id] = Number(oi); record(q.id, Number(oi) === q.a); save(); render();
};
act.drillNext = () => { session.i++; render(); window.scrollTo(0, 0); };
act.endDrill = () => { if (Object.keys(session?.picks || {}).length && session.i < session.qs.length) session.i = session.qs.length; else session = null; session ? render() : go('practise'); };
function drillSummary() {
  const s = session; const done = s.qs.filter((id) => s.picks[id] !== undefined);
  const right = done.filter((id) => s.picks[id] === Q[id].a).length;
  const wrong = done.filter((id) => s.picks[id] !== Q[id].a);
  return `<div class="stack"><div class="hero"><div class="muted small">${esc(s.title)}</div><div style="font-size:40px;font-weight:700">${right}/${done.length}</div><div class="muted small">${pct(right, done.length)}% right</div></div>
  ${wrong.length ? `<div class="card"><h3>To revisit</h3><div class="list">${wrong.map((id) => `<div class="item"><span>${esc(Q[id].q)}<br><span class="sub">Answer: ${esc(Q[id].o[Q[id].a])} · p. ${esc(Q[id].p)}</span></span></div>`).join('')}</div></div>` : ''}
  <div class="row"><button class="btn ghost grow" data-act="drillDone">Done</button>${wrong.length ? '<button class="btn grow" data-act="drillRetry">Retry wrong ones</button>' : ''}</div></div>`;
}
act.drillDone = () => { session = null; go('practise'); };
act.drillRetry = () => { const s = session; const ids = s.qs.filter((id) => s.picks[id] !== undefined && s.picks[id] !== Q[id].a); startDrill(shuffle(ids), 'Retry: ' + s.title, s.lo); };
act.flagQ = (id) => { if (S.flags[id]) delete S.flags[id]; else S.flags[id] = Date.now(); save(); toast(S.flags[id] ? 'Flagged for checking against the book.' : 'Flag removed.'); render(); };

/* ---------- MOCK ---------- */
act.startMock = () => {
  const qs = [];
  for (const lo of LOS) qs.push(...pickLeastSeen(DATA.questions.filter((q) => q.lo === lo).map((q) => q.id), LO[lo].n));
  if (!qs.length) return;
  S.activeMock = {
    id: uid(), qs: shuffle(qs), i: 0, picks: {}, flagged: {}, order: Object.fromEntries(qs.map((q) => [q, shuffle([0, 1, 2, 3])])),
    startedAt: Date.now(), durMs: Math.round(60 * qs.length / 50) * 60000, usedMs: 0, runFrom: Date.now(), pausedEver: false,
    feedback: S.settings.mockFeedback, full: qs.length === 50,
  };
  save(); go('mock');
};
function mockRemaining(m) { return m.durMs - m.usedMs - (m.runFrom ? Date.now() - m.runFrom : 0); }
const mmss = (ms) => { const s = Math.max(0, Math.ceil(ms / 1000)); return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`; };
function viewMock() {
  const m = S.activeMock;
  if (!m) { setTimeout(() => go('practise')); return ''; }
  if (!m.runFrom) { m.runFrom = Date.now(); m.lastSeen = m.runFrom; save(); }
  if (mockRemaining(m) <= 0) { setTimeout(() => submitMock(true)); return ''; }
  const q = Q[m.qs[m.i]]; const pick = m.picks[q.id];
  const reveal = m.feedback === 'each' && pick !== undefined;
  const answered = Object.keys(m.picks).length;
  return `<div class="qhead on-colour" style="background:${headColour(q)}">
    <div class="row between"><button class="iconbtn" data-act="pauseMock" aria-label="Pause mock">${ICON.close}</button>
      <span class="small" style="font-weight:500">Mock · ${answered}/${m.qs.length} answered</span><span id="clock" style="font-weight:700;font-variant-numeric:tabular-nums">${mmss(mockRemaining(m))}</span></div>
    <div class="row between small"><span>Question ${m.i + 1} of ${m.qs.length}</span><span>LO${q.lo}${l1(q)}</span></div>
    <div class="qtext">${esc(q.q)}</div></div>
  ${optionsHtml(q, m.order[q.id], pick, reveal, 'mockPick')}
  ${reveal ? explainHtml(q) : ''}
  <div class="actions">
    <button class="btn ghost" data-act="mockPrev" ${m.i ? '' : 'disabled'} aria-label="Previous question">${ICON.back}</button>
    <button class="btn ghost" data-act="mockFlag">${m.flagged[q.id] ? 'Unflag' : 'Flag'}</button>
    <button class="btn" data-act="mockNext">${m.i + 1 < m.qs.length ? (pick === undefined ? 'Skip' : 'Next') : 'Review'}</button>
  </div>
  <div class="card stack" style="margin-top:18px;gap:10px">
    <div class="row between"><h3>All questions</h3><span class="muted small">dark = answered, orange edge = flagged</span></div>
    <div class="navgrid">${m.qs.map((id, i) => `<button data-act="mockJump" data-arg="${i}" class="${m.picks[id] !== undefined ? 'ans' : ''} ${m.flagged[id] ? 'flag' : ''} ${i === m.i ? 'cur' : ''}" aria-label="Question ${i + 1}">${i + 1}</button>`).join('')}</div>
    <button class="btn ghost" data-act="submitMock">Submit${answered < m.qs.length ? ` (${m.qs.length - answered} unanswered)` : ''}</button>
  </div>`;
}
function startTimer() {
  timerId = setInterval(() => {
    const m = S.activeMock; if (!m) return;
    const r = mockRemaining(m); const el = $('#clock'); if (el) el.textContent = mmss(r);
    m.lastSeen = Date.now(); if (Math.floor(r / 1000) % 15 === 0) save();
    if (r <= 0) { clearInterval(timerId); submitMock(true); }
  }, 1000);
}
act.mockPick = (oi) => {
  const m = S.activeMock; const id = m.qs[m.i];
  if (m.feedback === 'each' && m.picks[id] !== undefined) return;
  m.picks[id] = Number(oi); save(); render();
};
act.mockNext = () => { const m = S.activeMock; if (m.i + 1 < m.qs.length) m.i++; else { const u = m.qs.findIndex((id) => m.picks[id] === undefined); if (u >= 0) m.i = u; else return act.submitMock(); } save(); render(); window.scrollTo(0, 0); };
act.mockPrev = () => { const m = S.activeMock; if (m.i) m.i--; save(); render(); };
act.mockJump = (i) => { S.activeMock.i = Number(i); save(); render(); window.scrollTo(0, 0); };
act.mockFlag = () => { const m = S.activeMock; const id = m.qs[m.i]; if (m.flagged[id]) delete m.flagged[id]; else m.flagged[id] = 1; save(); render(); };
act.pauseMock = () => {
  const m = S.activeMock; m.usedMs += Date.now() - m.runFrom; m.runFrom = null; m.pausedEver = true; save();
  toast('Mock paused. The timer has stopped.'); go('home');
};
act.submitMock = () => {
  const m = S.activeMock; const un = m.qs.filter((id) => m.picks[id] === undefined).length;
  if (un && !confirm(`${un} question${un === 1 ? ' is' : 's are'} unanswered. Submit anyway?`)) return;
  submitMock(false);
};
function submitMock(timedOut) {
  const m = S.activeMock; if (!m) return;
  const byLo = {}; let right = 0;
  for (const id of m.qs) {
    const q = Q[id]; const ok = m.picks[id] === q.a; if (ok) right++;
    (byLo[q.lo] ||= [0, 0]); byLo[q.lo][1]++; if (ok) byLo[q.lo][0]++;
    record(id, ok, m.id);
  }
  S.mocks.push({ id: m.id, t: Date.now(), right, total: m.qs.length, byLo, items: m.qs.map((id) => [id, m.picks[id] ?? null]), paused: m.pausedEver, full: m.full, timedOut });
  S.activeMock = null; save();
  if (timedOut) toast('Time is up. Your mock was submitted.');
  go('result/' + m.id);
}
function viewResult(id) {
  const r = S.mocks.find((x) => x.id === id);
  if (!r) return '<p>Result not found.</p>';
  const p = pct(r.right, r.total);
  return `<div class="stack">
  <div class="hero"><div class="muted small">${r.full ? 'Mock exam' : 'Partial mock'} · ${new Date(r.t).toLocaleDateString('en-GB')}${r.paused ? ' · paused' : ''}${r.timedOut ? ' · timed out' : ''}</div>
    <div style="font-size:44px;font-weight:700">${r.right}/${r.total}</div><div class="row"><span class="pill">${grade(p)}</span><span class="muted small">${p}%. Pass is 55%.</span></div></div>
  <div class="grid2">${Object.entries(r.byLo).map(([lo, [a, b]]) => `<div class="tile lo${lo}" style="cursor:default"><span class="k">LO${lo}</span><span class="t">${LO[lo].short}</span><span class="v">${a}/${b}</span></div>`).join('')}</div>
  <h2>Every question</h2>
  ${r.items.map(([qid, pick], i) => { const q = Q[qid]; if (!q) return ''; const ok = pick === q.a; return `<div class="card stack" style="gap:8px">
    <div class="row between small"><span class="muted">Q${i + 1} · LO${q.lo}</span><span style="color:${ok ? 'var(--right)' : 'var(--wrong-ink)'};font-weight:700">${ok ? 'Right' : pick === null ? 'Not answered' : 'Wrong'}</span></div>
    <p style="font-weight:500">${esc(q.q)}</p>
    ${!ok && pick !== null ? `<p class="small">Your answer: <span style="color:var(--wrong-ink)">${esc(q.o[pick])}</span></p>` : ''}
    <p class="small">Right answer: <b>${esc(q.o[q.a])}</b></p>
    <p class="small muted">${esc(q.ex)} Book p. ${esc(q.p)}.</p>
    <button class="btn ghost small" style="align-self:flex-start" data-act="flagQ" data-arg="${q.id}">${S.flags[q.id] ? 'Flagged' : 'Flag as wrong'}</button></div>`; }).join('')}
  <a class="btn" href="#/practise">Done</a></div>`;
}

/* ---------- FLASHCARDS ---------- */
let cardDeck = 'all';
function viewCards() {
  const cs = cardStatus();
  const count = (f) => { const list = DATA.cards.filter(f); return { n: list.length, known: list.filter((c) => cs[c.id].s === 'known').length }; };
  const decks = [{ id: 'all', label: 'All cards', f: () => true }];
  for (const lo of LOS) decks.push({ id: 'lo' + lo, label: `LO${lo} · ${LO[lo].short}`, f: (c) => c.lo === lo, lo });
  for (const ch of DATA.workbook.chapters) for (const s of ch.sections) decks.push({ id: 's' + s.id, label: `${s.id} ${s.title}`, f: (c) => c.sec === s.id, lo: ch.lo });
  const rows = decks.map((d) => ({ ...d, ...count(d.f) })).filter((d) => d.n);
  return `<div class="stack"><h1>Flashcards</h1>
  <p class="muted small">Tap a card to flip it, then say whether you knew it. Cards you miss come back sooner. A card counts as known after two “knew it” answers on different days.</p>
  <div class="card"><div class="list">${rows.map((d) => `<button data-act="startCards" data-arg="${d.id}"><span class="row">${d.lo ? `<span class="dot lo${d.lo}"></span>` : ''}${esc(d.label)}</span><span class="sub">${d.known}/${d.n} known</span></button>`).join('') || '<div class="item muted">No cards yet.</div>'}</div></div></div>`;
}
act.startCards = (deck) => startCards(deck);
function startCards(deck) {
  cardDeck = deck;
  const f = deck === 'all' ? () => true : deck.startsWith('lo') ? (c) => c.lo === Number(deck.slice(2)) : (c) => c.sec === deck.slice(1);
  const cs = cardStatus();
  const rank = { missed: 0, new: 1, learning: 2, known: 3 };
  const list = shuffle(DATA.cards.filter(f)).sort((a, b) => rank[cs[a.id].s] - rank[cs[b.id].s] || cs[a.id].last - cs[b.id].last);
  if (!list.length) return toast('No cards in this deck yet.');
  cardRun = { queue: list.slice(0, 20).map((c) => c.id), flipped: false, done: 0, knew: 0 };
  go('cardrun');
}
function viewCardRun() {
  const r = cardRun;
  if (!r) { setTimeout(() => go('cards')); return ''; }
  if (!r.queue.length) return `<div class="stack"><div class="hero"><div class="muted small">Session done</div><div style="font-size:40px;font-weight:700">${r.knew}/${r.done}</div><div class="muted small">first-time “knew it”</div></div>
    <div class="row"><a class="btn ghost grow" href="#/cards">Decks</a><button class="btn grow" data-act="startCards" data-arg="${esc(cardDeck)}">Another 20</button></div></div>`;
  const c = C[r.queue[0]];
  return `<div class="qhead on-colour" style="background:var(--lo${c.lo})">
    <div class="row between"><button class="iconbtn" data-act="endCards" aria-label="End session">${ICON.close}</button><span class="small" style="font-weight:500">LO${c.lo} · ${esc(LO[c.lo].short)}${l1(c)}</span><span style="font-weight:700">${r.queue.length} left</span></div></div>
  <div class="flash" style="margin-top:18px">${r.flipped
    ? `<button class="face back" data-act="flip"><span style="font-weight:700;font-size:20px">${esc(c.f)}</span><span>${esc(c.b)}</span><span class="hint">Book p. ${esc(c.p)}</span></button>`
    : `<button class="face" data-act="flip">${esc(c.f)}<span class="hint">Tap to flip</span></button>`}</div>
  ${r.flipped ? `<div class="actions"><button class="btn ghost" style="flex:1" data-act="cardAns" data-arg="0">Didn’t know</button><button class="btn" data-act="cardAns" data-arg="1">Knew it</button></div>` : ''}`;
}
act.flip = () => { cardRun.flipped = !cardRun.flipped; render(); };
act.cardAns = (k) => {
  const r = cardRun; const id = r.queue.shift(); const knew = k === '1';
  S.cardEv.push({ c: id, t: Date.now(), k: knew }); save();
  r.seen ||= {}; if (!r.seen[id]) { r.seen[id] = 1; r.done++; if (knew) r.knew++; }
  if (!knew) r.queue.splice(Math.min(3, r.queue.length), 0, id);
  r.flipped = false; render();
};
act.endCards = () => { cardRun = null; go('cards'); };

/* ---------- WORKBOOK ---------- */
function viewWorkbook() {
  return `<div class="stack"><h1>Workbook</h1>
  <p class="muted small">Short notes in my own words, with the textbook pages each one covers. Read one, then test yourself on it.</p>
  ${DATA.workbook.chapters.map((ch) => {
    const n = ch.sections.length, d = ch.sections.filter((s) => S.done[s.id]).length;
    return `<div class="card"><div class="row between" style="margin-bottom:4px"><h2 class="row"><span class="dot lo${ch.lo}"></span>${esc(ch.title)}</h2><span class="muted small">${d}/${n}</span></div>
    <div class="list">${ch.sections.map((s) => `<a href="#/wb/${s.id}"><span>${esc(s.id)} ${esc(s.title)}${l1(s)}${s.html ? '' : ' <span class="sub">· coming soon</span>'}</span><span>${S.done[s.id] ? '<span class="tick" aria-label="Finished">✓</span>' : '<span class="muted">›</span>'}</span></a>`).join('')}</div></div>`;
  }).join('')}</div>`;
}
function viewSection(id) {
  const s = SEC[id];
  if (!s) return '<p>Section not found.</p>';
  const k = DATA.questions.filter((q) => q.sec === id).length;
  return `<div class="stack">
  <div class="row"><a class="iconbtn" href="#/workbook" aria-label="Back to workbook">${ICON.back}</a><span class="muted small">LO${s.lo} · Book p. ${esc(s.pages)}</span></div>
  <h1>${esc(s.id)} ${esc(s.title)}${l1(s)}</h1>
  <div class="wb">${s.html || '<p class="muted">This section hasn’t been written yet.</p>'}</div>
  <div class="row"><button class="btn grow" data-act="drillSecTen" data-arg="${id}" ${k ? '' : 'disabled'}>Test yourself${k ? ` (${Math.min(10, k)})` : ''}</button>
    <button class="btn ghost grow" data-act="toggleDone" data-arg="${id}">${S.done[id] ? 'Finished ✓' : 'Mark as finished'}</button></div></div>`;
}
act.drillSecTen = (id) => { const ids = DATA.questions.filter((q) => q.sec === id).map((q) => q.id); startDrill(pickLeastSeen(ids, 10), `${id} ${SEC[id].title}`, SEC[id].lo); };
act.toggleDone = (id) => { if (S.done[id]) delete S.done[id]; else S.done[id] = Date.now(); save(); render(); };

/* ---------- STATS ---------- */
function viewStats() {
  const st = LOS.map((lo) => ({ lo, ...loStats(lo) }));
  const scored = st.filter((s) => s.n >= 5);
  const weakest = scored.length ? scored.reduce((a, b) => (b.p < a.p ? b : a)).lo : null;
  const pr = predicted();
  const secs = DATA.workbook.chapters.flatMap((c) => c.sections);
  const flagged = Object.keys(S.flags).length;
  return `<div class="stack"><h1>Stats</h1>
  <div class="card stack" style="gap:8px"><h2>Predicted exam score</h2>
    ${pr.locked ? `<p class="small">Shown once you have answered at least 10 questions in every learning outcome. Still needed: ${pr.missing.map((m) => `LO${m.lo} (${m.n}/10${m.total ? '' : ', no questions in the app yet'})`).join(', ')}.</p>`
      : `<div style="font-size:36px;font-weight:700">${pr.mark}/50 <span class="pill" style="background:var(--ink);color:#fff;vertical-align:middle">${pr.grade}</span></div><p class="small muted">Likely range ${pr.lo} to ${pr.hi}. Based on your last 30 answers in each outcome, weighted like the real paper.</p>`}
    <p class="small muted">This is an estimate from practice questions I wrote, not WSET’s. It is only as good as how closely they match the real paper.</p></div>
  <div class="card"><h2 style="margin-bottom:6px">Score per learning outcome</h2><div class="list">${st.map((s) => `<div class="item"><span class="row"><span class="dot lo${s.lo}"></span><span>LO${s.lo} ${LO[s.lo].short}${s.lo === weakest ? ' <b>· weakest</b>' : ''}<br><span class="sub">${s.seen}/${s.total} questions seen</span></span></span><span style="font-weight:700">${s.p === null ? '–' : Math.round(s.p * 100) + '%'}</span></div>`).join('')}</div></div>
  <div class="card stack" style="gap:8px"><h2>Mock exam history</h2>${mockChart()}
    <div class="list">${S.mocks.slice().reverse().map((r) => `<a href="#/result/${r.id}"><span>${new Date(r.t).toLocaleDateString('en-GB')}${r.full ? '' : ' · partial'}${r.paused ? ' · paused' : ''}</span><span class="sub">${r.right}/${r.total} · ${pct(r.right, r.total)}%</span></a>`).join('') || '<div class="item muted small">No mocks yet.</div>'}</div></div>
  <div class="card"><h2 style="margin-bottom:6px">Workbook</h2><div class="list">${DATA.workbook.chapters.map((ch) => `<div class="item"><span class="row"><span class="dot lo${ch.lo}"></span>${esc(ch.title)}</span><span class="sub">${ch.sections.filter((s) => S.done[s.id]).length}/${ch.sections.length}</span></div>`).join('')}</div>
    <p class="small muted" style="margin-top:6px">${secs.filter((s) => S.done[s.id]).length} of ${secs.length} sections finished.</p></div>
  <a class="card row between" style="text-decoration:none" href="#/flags"><span>Questions flagged as possibly wrong</span><span class="sub">${flagged}</span></a></div>`;
}
function mockChart() {
  const ms = S.mocks; if (!ms.length) return '';
  const W = 320, H = 160, L = 30, R = 8, T = 8, B = 20;
  const x = (i) => L + (ms.length === 1 ? (W - L - R) / 2 : (i * (W - L - R)) / (ms.length - 1));
  const y = (p) => T + (H - T - B) * (1 - p / 100);
  const lines = [[55, 'Pass'], [70, 'Merit'], [85, 'Dist.']].map(([p, l]) => `<line x1="${L}" x2="${W - R}" y1="${y(p)}" y2="${y(p)}" stroke="#C5CDD6" stroke-dasharray="3 3"/><text x="2" y="${y(p) + 4}">${l}</text>`).join('');
  const pts = ms.map((r, i) => [x(i), y(pct(r.right, r.total))]);
  return `<svg class="chart" viewBox="0 0 ${W} ${H}" width="100%" role="img" aria-label="Mock scores over time">${lines}
    <polyline fill="none" stroke="#16202A" stroke-width="2" points="${pts.map((p) => p.join(',')).join(' ')}"/>
    ${pts.map(([a, b], i) => `<circle cx="${a}" cy="${b}" r="4" fill="#16202A"><title>${pct(ms[i].right, ms[i].total)}%</title></circle>`).join('')}
    <text x="${L}" y="${H - 4}">${new Date(ms[0].t).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}</text>
    ${ms.length > 1 ? `<text x="${W - R}" y="${H - 4}" text-anchor="end">${new Date(ms[ms.length - 1].t).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}</text>` : ''}</svg>`;
}
function viewFlags() {
  const ids = Object.keys(S.flags).filter((id) => Q[id]);
  return `<div class="stack"><div class="row"><a class="iconbtn" href="#/stats" aria-label="Back">${ICON.back}</a><h1>Flagged questions</h1></div>
  <p class="muted small">Check each against the book page. Tell Claude which ones are wrong so they can be fixed in the bank.</p>
  ${ids.map((id) => { const q = Q[id]; return `<div class="card stack" style="gap:6px"><span class="muted small">${q.id} · LO${q.lo} · p. ${esc(q.p)}</span><p style="font-weight:500">${esc(q.q)}</p><p class="small">Answer given: <b>${esc(q.o[q.a])}</b></p><p class="small muted">${esc(q.ex)}</p><button class="btn ghost small" style="align-self:flex-start" data-act="flagQ" data-arg="${id}">Remove flag</button></div>`; }).join('') || '<p class="muted">Nothing flagged.</p>'}</div>`;
}

/* ---------- SETTINGS, EXPORT, IMPORT ---------- */
function viewSettings() {
  const st = S.settings;
  return `<div class="stack"><div class="row"><a class="iconbtn" href="#/home" aria-label="Back">${ICON.back}</a><h1>Settings</h1></div>
  <div class="card stack">
    <div class="stack" style="gap:6px"><span class="small muted">Mock exam feedback</span>
      <div class="seg" role="group"><button data-act="set" data-arg="mockFeedback=end" aria-pressed="${st.mockFeedback === 'end'}">At the end</button><button data-act="set" data-arg="mockFeedback=each" aria-pressed="${st.mockFeedback === 'each'}">After each question</button></div></div>
    <label class="field">Exam date<input type="date" value="${st.examDate}" data-change="setExam"></label>
    <div class="grid2"><label class="field">Daily questions (minimum)<input type="number" min="0" max="200" value="${st.floorQ}" data-change="setFloorQ"></label>
      <label class="field">Daily cards (minimum)<input type="number" min="0" max="200" value="${st.floorC}" data-change="setFloorC"></label></div>
    <div class="stack" style="gap:6px"><span class="small muted">Level 1 badge on foundation material</span>
      <div class="seg" role="group"><button data-act="set" data-arg="showL1=1" aria-pressed="${st.showL1}">Show</button><button data-act="set" data-arg="showL1=0" aria-pressed="${!st.showL1}">Hide</button></div></div>
  </div>
  <div class="card stack"><h2>Move progress between devices</h2>
    <p class="small muted">Progress is saved only in this browser. Export it here, then import it on your other device. Importing merges: nothing already there is lost.${S.lastExport ? ' Last export: ' + new Date(S.lastExport).toLocaleString('en-GB') + '.' : ''}</p>
    <button class="btn" data-act="exportFile">Export progress file</button>
    <button class="btn ghost" data-act="exportCode">Copy progress as a code</button>
    <label class="btn ghost" style="cursor:pointer">Import progress file<input type="file" accept=".json,application/json" data-change="importFile" style="display:none"></label>
    <label class="field">Or paste a code<textarea id="importCode" placeholder="Paste the code here"></textarea></label>
    <button class="btn ghost" data-act="importCode">Import code</button>
  </div>
  <div class="card stack"><h2>Reset</h2><p class="small muted">Deletes all progress on this device. Export first if you want to keep it.</p><button class="btn ghost" data-act="reset">Reset all progress</button></div>
  <p class="small muted">Question bank: ${DATA.questions.length} questions, ${DATA.cards.length} cards. Version ${esc(DATA.version || '')}.</p></div>`;
}
act.set = (kv) => { const [k, v] = kv.split('='); S.settings[k] = k === 'showL1' ? v === '1' : v; save(); render(); };
act.setExam = (v) => { if (v) { S.settings.examDate = v; save(); toast('Exam date saved.'); } };
act.setFloorQ = (v) => { S.settings.floorQ = Math.max(0, Number(v) || 0); save(); };
act.setFloorC = (v) => { S.settings.floorC = Math.max(0, Number(v) || 0); save(); };
function exportPayload() { const { activeMock, settings, lastExport, ...rest } = S; return { app: 'wset2', v: 1, exportedAt: Date.now(), state: rest }; }
act.exportFile = async () => {
  const json = JSON.stringify(exportPayload());
  const name = `wset-progress-${todayKey()}.json`;
  const file = new File([json], name, { type: 'application/json' });
  try {
    if (navigator.canShare && navigator.canShare({ files: [file] })) { await navigator.share({ files: [file], title: 'WSET progress' }); }
    else { const a = document.createElement('a'); a.href = URL.createObjectURL(file); a.download = name; a.click(); setTimeout(() => URL.revokeObjectURL(a.href), 5000); }
    S.lastExport = Date.now(); save(); toast('Progress exported.'); render();
  } catch (e) { if (e.name !== 'AbortError') toast('Export failed: ' + e.message); }
};
async function gz(str) {
  if (!window.CompressionStream) return 'J' + btoa(unescape(encodeURIComponent(str)));
  const buf = await new Response(new Blob([str]).stream().pipeThrough(new CompressionStream('gzip'))).arrayBuffer();
  let bin = ''; new Uint8Array(buf).forEach((b) => (bin += String.fromCharCode(b)));
  return 'G' + btoa(bin);
}
async function ungz(code) {
  code = code.trim();
  if (code[0] === 'J') return decodeURIComponent(escape(atob(code.slice(1))));
  if (code[0] !== 'G') throw new Error('Not a progress code');
  const bytes = Uint8Array.from(atob(code.slice(1)), (c) => c.charCodeAt(0));
  return await new Response(new Blob([bytes]).stream().pipeThrough(new DecompressionStream('gzip'))).text();
}
act.exportCode = async () => {
  const code = await gz(JSON.stringify(exportPayload()));
  try { await navigator.clipboard.writeText(code); S.lastExport = Date.now(); save(); toast(`Code copied (${Math.round(code.length / 1024)} KB). Paste it on your other device.`); render(); }
  catch { const t = $('#importCode'); t.value = code; t.select(); toast('Copy the code from the box below.'); }
};
function mergeIn(payload) {
  if (!payload || payload.app !== 'wset2' || !payload.state) throw new Error('This is not a WSET progress file.');
  const o = payload.state; let added = 0;
  const ak = new Set(S.ans.map((e) => e.q + '|' + e.t));
  for (const e of o.ans || []) if (!ak.has(e.q + '|' + e.t)) { S.ans.push(e); added++; }
  const ck = new Set(S.cardEv.map((e) => e.c + '|' + e.t));
  for (const e of o.cardEv || []) if (!ck.has(e.c + '|' + e.t)) { S.cardEv.push(e); added++; }
  for (const [k, t] of Object.entries(o.done || {})) if (!S.done[k] || S.done[k] < t) S.done[k] = t;
  const mk = new Set(S.mocks.map((m) => m.id));
  for (const m of o.mocks || []) if (!mk.has(m.id)) { S.mocks.push(m); added++; }
  S.mocks.sort((a, b) => a.t - b.t);
  for (const [k, t] of Object.entries(o.flags || {})) if (!S.flags[k]) S.flags[k] = t;
  save(); return added;
}
act.importFile = async (_, el) => {
  const f = el.files[0]; if (!f) return;
  try { const n = mergeIn(JSON.parse(await f.text())); toast(`Imported. ${n} new records merged.`); render(); }
  catch (e) { toast('Import failed: ' + e.message); }
};
act.importCode = async () => {
  try { const n = mergeIn(JSON.parse(await ungz($('#importCode').value))); toast(`Imported. ${n} new records merged.`); render(); }
  catch (e) { toast('Import failed: ' + e.message); }
};
act.reset = () => {
  if (!confirm('Delete all progress on this device?')) return;
  if (!confirm('Really delete it? This cannot be undone.')) return;
  const keep = S.settings; S = blankState(); S.settings = keep; save(); toast('Progress reset.'); go('home');
};

/* ---------- boot ---------- */
async function boot() {
  S = load();
  try {
    const [qs, cs, wb] = await Promise.all(['questions', 'cards', 'workbook'].map((n) => fetch(`data/${n}.json`).then((r) => { if (!r.ok) throw new Error(n); return r.json(); })));
    DATA = { questions: qs.questions, cards: cs.cards, workbook: wb, version: qs.version };
  } catch (e) {
    $('#app').innerHTML = '<p class="loading">Could not load the question bank. Open the app once with signal so it can be saved for offline use.</p>';
    return;
  }
  Q = Object.fromEntries(DATA.questions.map((q) => [q.id, q]));
  C = Object.fromEntries(DATA.cards.map((c) => [c.id, c]));
  for (const ch of DATA.workbook.chapters) for (const s of ch.sections) SEC[s.id] = { ...s, lo: ch.lo };
  const m = S.activeMock;
  if (m && m.runFrom) { // the app was closed mid-mock: stop the clock at the moment it was last seen
    m.usedMs += Math.max(0, (m.lastSeen || m.runFrom) - m.runFrom); m.runFrom = null; m.pausedEver = true; save();
  }
  render();
}
// Switching apps briefly doesn't pause the mock (like a real exam), but we note when the page was last
// visible so that, if Android closes the app in the background, the clock stops at that point.
document.addEventListener('visibilitychange', () => {
  const m = S && S.activeMock;
  if (document.hidden && m && m.runFrom) { m.lastSeen = Date.now(); save(); }
});
if ('serviceWorker' in navigator) window.addEventListener('load', () => navigator.serviceWorker.register('sw.js').catch(() => {}));
boot();
