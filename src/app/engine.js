/* =====================================================================
   MATEMAGICS v4 — ENGINE (no DOM): state, migration, mastery, planning,
   placement, scoring, stickers, badges. Unit-tested in tools/engine-test.js
   ===================================================================== */
'use strict';

const STRANDS = [
  { id: 'number',    name: 'Number Land',          es: 'Números y valor posicional',   icon: '🔢', color: '#4F8FE8' },
  { id: 'addsub',    name: 'Add & Take-away Town', es: 'Sumas y restas',               icon: '➕', color: '#27AE60' },
  { id: 'multdiv',   name: 'Times Table Tower',    es: 'Multiplicar y dividir',        icon: '✖️', color: '#9B51E0' },
  { id: 'fractions', name: 'Fraction Forest',      es: 'Fracciones',                   icon: '🍕', color: '#F2994A' },
  { id: 'time',      name: 'Clock Cove',           es: 'La hora y el tiempo',          icon: '🕒', color: '#EB5757' },
  { id: 'measure',   name: 'Measure Mountain',     es: 'Medidas, dinero y perímetro',  icon: '📏', color: '#2D9CDB' },
  { id: 'geometry',  name: 'Shape City',           es: 'Geometría',                    icon: '🔺', color: '#BB6BD9' },
  { id: 'data',      name: 'Data Bay',             es: 'Datos y gráficos',             icon: '📊', color: '#00A6A6' },
  { id: 'logic',     name: 'Puzzle Palace',        es: 'Lógica y problemas',           icon: '🧩', color: '#E0A800' }
];
function strandMeta(id){ for(let i = 0; i < STRANDS.length; i++) if(STRANDS[i].id === id) return STRANDS[i]; return { id: id, name: id, es: id, icon: '⭐', color: '#888' }; }

const THEMES = {
  space:   { label: 'Space',     emoji: '🚀', mascot: '👩‍🚀', c1: '#0B1026', c2: '#4F8FE8' },
  unicorn: { label: 'Unicorn',   emoji: '🦄', mascot: '🦄',   c1: '#3a1f39', c2: '#9B51E0' },
  dino:    { label: 'Dinosaurs', emoji: '🦖', mascot: '🦕',   c1: '#0f2a1a', c2: '#27AE60' },
  ocean:   { label: 'Ocean',     emoji: '🐬', mascot: '🐠',   c1: '#04213a', c2: '#2D9CDB' },
  rainbow: { label: 'Rainbow',   emoji: '🌈', mascot: '⭐',   c1: '#2d1b4a', c2: '#F2994A' }
};
const LIKES = [
  { id: 'contar', label: 'Counting and numbers', emoji: '🔢' }, { id: 'formas', label: 'Shapes and drawings', emoji: '🔺' },
  { id: 'acertijos', label: 'Mysteries and riddles', emoji: '🕵️' }, { id: 'dinero', label: 'Money and shops', emoji: '💰' },
  { id: 'carreras', label: 'Racing against the clock', emoji: '⏱️' }, { id: 'rompecabezas', label: 'Puzzles and patterns', emoji: '🧩' }
];
const DISLIKES = [
  { id: 'multiplicar', label: 'Multiplying', emoji: '🧮' }, { id: 'fracciones', label: 'Fractions', emoji: '🍕' },
  { id: 'problemas_largos', label: 'Long word problems', emoji: '📖' }, { id: 'esperar', label: 'Waiting my turn', emoji: '⏳' },
  { id: 'dificil', label: 'Hard questions', emoji: '😖' }, { id: 'escribir', label: 'Writing a lot', emoji: '✍️' }
];
const PRAISE = ['Great job!', 'You got it!', 'You are a star!', 'Excellent!', 'Perfect!', 'Way to go!', 'Awesome!', 'Brilliant!', 'Superb!', 'Nailed it!', 'Maths magic!'];
const ENCOURAGE = ['Almost there!', 'Good try!', 'Nearly!', 'Great thinking — one small slip.', 'Mistakes help your brain grow!'];
const DEFAULT_REWARDS = [
  { id: 'snack', emoji: '🥨', title: 'A healthy snack you choose', cost: 30 },
  { id: 'icecream', emoji: '🍦', title: 'An ice cream cone — you pick the flavour', cost: 60 },
  { id: 'tv', emoji: '📺', title: 'You choose the TV show at dinner', cost: 80 },
  { id: 'popcorn', emoji: '🍿', title: 'Popcorn night', cost: 110 },
  { id: 'movie', emoji: '🎬', title: 'You choose the weekend movie', cost: 150 }
];
const PACK_COST = 15;
const REVIEW_DAYS = [0, 1, 2, 4, 7, 14, 30];     // spaced-repetition gaps by box 0..6
const LEVEL_TITLES = ['Number Sprout', 'Counting Cadet', 'Puzzle Pal', 'Maths Explorer', 'Number Ninja', 'Brain Builder', 'Maths Wizard', 'Grand Mathemagician', 'Legend of Numbers'];

/* ---------- dates ---------- */
function todayStr(d){ d = d || new Date(); return d.getFullYear() + '-' + pad2(d.getMonth() + 1) + '-' + pad2(d.getDate()); }
function addDays(str, n){ const p = str.split('-'); const d = new Date(+p[0], +p[1] - 1, +p[2] + n); return todayStr(d); }
function daysBetween(a, b){ const pa = a.split('-'), pb = b.split('-'); return Math.round((new Date(+pb[0], +pb[1] - 1, +pb[2]) - new Date(+pa[0], +pa[1] - 1, +pa[2])) / 86400000); }

/* ---------- state ---------- */
const STATE_KEY = 'melissaMathState_v4', V3_KEY = 'melissaMathState_v3', V2_KEY = 'melissaMathState_v2';
function defaultState(){
  return {
    v: 4, name: 'Melissa', onboardingDone: false, theme: 'unicorn',
    prefs: { likes: [], dislikes: [], voice: false, sound: true },
    placement: { done: false, started: false, strandIdx: 0, asked: 0, misses: 0, queue: [], results: {}, paid: 0 },
    skills: {}, errors: {}, evidence: [], diag: null,
    totalStars: 0, starBalance: 0, xp: 0, level: 1,
    stickers: [], packs: 0, tricks: [], badges: [],
    claims: [], rewards: DEFAULT_REWARDS.map(function(r){ return Object.assign({}, r); }), goalReward: null,
    timer: { mode: 'free', minutes: 20, debtSeconds: 0 },
    streak: { count: 0, lastPlayDate: null },
    sessionLog: [], daily: { date: null, warmup: false, learn: false, boss: false, claimed: false, rounds: 0 },
    focus: null, legacy: null, friend: 'ginger', lastBackup: null, avatar: defaultAvatar(), owned: [], met: [], welcomeGift: false, petAcc: {}, shopMult: 1, shopCat: {}, notes: [], puzzleCur: 0, puzzleBase: 0
  };
}
/* ---------- evidence (one dated record per answered question; capped so localStorage stays small) ---------- */
const EVIDENCE_CAP = 800;
function cleanEvidence(a){
  if(!Array.isArray(a)) return [];
  return a.filter(function(e){ return e && typeof e === 'object' && /^\d{4}-\d{2}-\d{2}$/.test(e.d) && typeof e.s === 'string' && (e.c === 'f' || e.c === 'a' || e.c === 'x'); })
    .map(function(e){ return { d: e.d, s: e.s, k: String(e.k || ''), t: Math.min(3, Math.max(0, Number(e.t) | 0)), c: e.c, h: e.h ? 1 : 0, r: Math.min(2, Math.max(0, Number(e.r) | 0)), ms: Math.min(90000, Math.max(0, Number(e.ms) | 0)), w: String(e.w || '').slice(0, 80) }; })
    .slice(-EVIDENCE_CAP);
}
/* c: 'f' right first time without help, 'a' right but with a hint or a second try, 'x' not right. w: why she went wrong (first wrong answer), if any. */
function recordEvidence(state, e){
  if(!Array.isArray(state.evidence)) state.evidence = [];
  state.evidence.push({ d: e.d, s: e.s, k: String(e.k || ''), t: e.t | 0, c: e.c, h: e.h ? 1 : 0, r: Math.min(2, e.r | 0), ms: Math.min(90000, Math.max(0, e.ms | 0)), w: String(e.w || '').slice(0, 80) });
  if(state.evidence.length > EVIDENCE_CAP) state.evidence.splice(0, state.evidence.length - (EVIDENCE_CAP - 100));
}
const LEVEL_NAMES = ['Not started', 'Learning', 'Practising', 'Secure', 'Mastered'];
/* Five levels derived from medals + evidence. Secure needs silver AND recent independent answers; Mastered = gold (which needs a review passed on a later day). */
function masteryLevel(state, id){
  const st = state.skills[id]; if(!st || !(st.seen > 0 || st.medal > 0)) return 0;
  if(st.medal >= 3) return 4;
  if(st.medal === 2){
    const ev = (state.evidence || []).filter(function(e){ return e.s === id && e.k !== 'placement'; }).slice(-10);
    if(ev.length < 5) return 3;
    return ev.filter(function(e){ return e.c === 'f'; }).length / ev.length >= 0.7 ? 3 : 2;
  }
  return st.medal === 1 ? 2 : 1;
}
/* The same mistake, same skill, 3+ times in the last 14 days. */
function repeatedErrors(state, today, minN){
  today = today || todayStr(); minN = minN || 3; const g = {};
  (state.evidence || []).forEach(function(e){ if(!e.w || daysBetween(e.d, today) > 14 || daysBetween(e.d, today) < 0) return; const k = e.s + '||' + e.w; g[k] = g[k] || { skill: e.s, why: e.w, n: 0, last: e.d }; g[k].n++; if(e.d > g[k].last) g[k].last = e.d; });
  return Object.keys(g).map(function(k){ return g[k]; }).filter(function(x){ return x.n >= minN; }).sort(function(a, b){ return b.n - a.n; });
}
function goldWaiting(state){ return SKILLS.filter(function(s){ const st = state.skills[s.id]; return st && st.goldFrom && st.medal === 2; }); }
/* ---------- parent metrics: coverage, accuracy, fluency and mastery are four DIFFERENT things ---------- */
const BACKUP_DAYS = 7;          // a reminder appears when the last backup is older than this and there is progress to lose
function medianOf(a){ if(!a.length) return null; const b = a.slice().sort(function(x, y){ return x - y; }); const m = b.length >> 1; return b.length % 2 ? b[m] : (b[m - 1] + b[m]) / 2; }
function evWindow(state, today, from, to){ return (state.evidence || []).filter(function(e){ const d = daysBetween(e.d, today); return e.k !== 'placement' && d >= from && d < to; }); }
function accOf(list){
  const n = list.length, f = list.filter(function(e){ return e.c === 'f'; }).length, a = list.filter(function(e){ return e.c === 'a'; }).length;
  return { n: n, indep: n ? f / n : null, helped: n ? a / n : null, correct: n ? (f + a) / n : null };
}
function parentMetrics(state, today){
  today = today || todayStr();
  const lv = {}; [0, 1, 2, 3, 4].forEach(function(k){ lv[k] = 0; });
  const byYear = {}, byStrand = [];
  SKILLS.forEach(function(sk){ const L = masteryLevel(state, sk.id); lv[L]++; const y = byYear[sk.year] = byYear[sk.year] || { total: 0, tried: 0, bronze: 0, secure: 0 }; y.total++; if(L >= 1) y.tried++; if(medalOf(state, sk.id) >= 1) y.bronze++; if(L >= 3) y.secure++; });
  strandsWithSkills().forEach(function(str){ const list = skillsOfStrand(str.id); byStrand.push({ id: str.id, total: list.length, bronze: list.filter(function(s){ return medalOf(state, s.id) >= 1; }).length, secure: list.filter(function(s){ return masteryLevel(state, s.id) >= 3; }).length }); });
  const w1 = evWindow(state, today, 0, 7), w0 = evWindow(state, today, 7, 14), w14 = evWindow(state, today, 0, 14);
  const okMs = w14.filter(function(e){ return e.c === 'f' && e.ms > 0; }).map(function(e){ return e.ms; });
  const fluency = { n: okMs.length, medianSec: okMs.length ? Math.round(medianOf(okMs) / 100) / 10 : null, fastShare: okMs.length ? okMs.filter(function(x){ return x <= 15000; }).length / okMs.length : null };
  const days = {}; w1.forEach(function(e){ days[e.d] = 1; });
  const per = {}; w1.forEach(function(e){ (per[e.s] = per[e.s] || []).push(e); });
  const skillsWeek = Object.keys(per).map(function(id){ const a = accOf(per[id]); return { id: id, n: a.n, indep: a.indep, correct: a.correct }; }).filter(function(x){ return x.n >= 4; });
  const strong = skillsWeek.slice().sort(function(a, b){ return (b.indep - a.indep) || (b.n - a.n); }).slice(0, 3), weak = skillsWeek.slice().sort(function(a, b){ return (a.indep - b.indep) || (b.n - a.n); }).filter(function(x){ return x.indep < 0.7; }).slice(0, 3);
  const minutes = Math.round(w1.reduce(function(a, e){ return a + Math.min(90000, e.ms || 0); }, 0) / 60000);
  const wobbly = SKILLS.filter(function(s){ return state.skills[s.id] && state.skills[s.id].wobbly; }).map(function(s){ return s.id; });
  const stuck = SKILLS.filter(function(s){ return struggling(state, s.id); }).map(function(s){ return s.id; });
  const hasProgress = (state.evidence || []).length >= 30 || state.sessionLog.filter(function(l){ return l.kind !== 'legacy'; }).length >= 3;
  const since = state.lastBackup ? daysBetween(state.lastBackup, today) : null;
  return {
    coverage: { total: SKILLS.length, tried: SKILLS.length - lv[0], bronze: SKILLS.filter(function(s){ return medalOf(state, s.id) >= 1; }).length, byYear: byYear, byStrand: byStrand },
    levels: lv,
    accuracy: { week: accOf(w1), prev: accOf(w0) },
    fluency: fluency,
    week: { days: Object.keys(days).length, questions: w1.length, minutes: minutes, strong: strong, weak: weak },
    attention: { wobbly: wobbly, stuck: stuck, repeated: repeatedErrors(state, today), gold: goldWaiting(state).map(function(s){ return s.id; }) },
    stars: starEconomy(state),
    backup: { last: state.lastBackup || null, daysAgo: since, overdue: hasProgress && (since === null || since >= BACKUP_DAYS), hasProgress: hasProgress }
  };
}
/* star economy: how fast she earns, how much she has spent, how long until the cheapest thing she does not own yet */
function starEconomy(state){
  const days = {}; (state.sessionLog || []).forEach(function(l){ if(l.kind !== 'legacy') days[l.date] = 1; });
  const active = Object.keys(days).length, earned = state.totalStars || 0, balance = state.starBalance || 0, spent = Math.max(0, earned - balance);
  let cheapest = null; Object.keys(AV_ITEMS).forEach(function(slot){ AV_ITEMS[slot].forEach(function(r){ if(r[2] > 0 && !avOwns(state, slot, r[0]) && !avLocked(state, slot, r[0])){ const pr = avPrice(state, slot, r[0]); if(cheapest === null || pr < cheapest) cheapest = pr; } }); });
  const perDay = active ? earned / active : null;
  const wait = (cheapest === null || balance >= cheapest) ? 0 : (perDay ? Math.ceil((cheapest - balance) / perDay) : null);
  return { earned: earned, spent: spent, balance: balance, activeDays: active, perDay: perDay === null ? null : Math.round(perDay * 10) / 10, owned: (state.owned || []).length, cheapest: cheapest, daysToCheapest: wait };
}
function pct0(x){ return x === null || x === undefined ? '—' : Math.round(x * 100) + '%'; }
/* the weekly summary as plain Spanish text (copied or shared from the parent panel) */
function summaryText(state, today){
  today = today || todayStr(); const m = parentMetrics(state, today), nm = function(id){ const s = skillById(id); return s ? s.name : id; };
  const L = ['Resumen semanal de Matemagics · ' + today, ''];
  L.push('Actividad: ' + m.week.days + ' día(s), ' + m.week.questions + ' preguntas, unos ' + m.week.minutes + ' min.');
  L.push('Acierto sin ayuda (a la primera y sin pista): ' + pct0(m.accuracy.week.indep) + (m.accuracy.prev.n ? ' (semana anterior ' + pct0(m.accuracy.prev.indep) + ')' : '') + '. Correctas contando las que necesitaron pista o segundo intento: ' + pct0(m.accuracy.week.correct) + '.');
  if(m.fluency.n) L.push('Rapidez: mitad de las respuestas correctas en ' + m.fluency.medianSec + ' s o menos; ' + pct0(m.fluency.fastShare) + ' en 15 s o menos (incluye el tiempo de leer).');
  L.push('Cobertura: ' + m.coverage.bronze + ' de ' + m.coverage.total + ' habilidades con al menos bronce. Dominio: ' + m.levels[3] + ' asentadas, ' + m.levels[4] + ' dominadas.');
  if(m.week.strong.length) L.push('Mejor esta semana: ' + m.week.strong.map(function(x){ return nm(x.id) + ' (' + pct0(x.indep) + ')'; }).join(', ') + '.');
  if(m.week.weak.length) L.push('A reforzar: ' + m.week.weak.map(function(x){ return nm(x.id) + ' (' + pct0(x.indep) + ')'; }).join(', ') + '.');
  if(m.attention.repeated.length) L.push('Mismo error repetido: ' + m.attention.repeated.slice(0, 3).map(function(e){ return nm(e.skill) + ' — ' + e.why + ' (' + e.n + ' veces)'; }).join('; ') + '.');
  if(m.stars.activeDays) L.push('Estrellas: ' + m.stars.earned + ' ganadas, ' + m.stars.spent + ' gastadas, ' + m.stars.balance + ' disponibles' + (m.stars.perDay !== null ? ' (unas ' + m.stars.perDay + ' por día de juego)' : '') + '.');
  if(m.attention.stuck.length) L.push('Atascada (dos sesiones seguidas bajas): ' + m.attention.stuck.map(nm).join(', ') + '. La app propone repasar el paso anterior.');
  if(m.attention.gold.length) L.push('Oro pendiente de repaso: ' + m.attention.gold.map(nm).join(', ') + '.');
  return L.join('\n');
}
function skillState(state, id){
  if(!state.skills[id]) state.skills[id] = { medal: 0, box: 0, seen: 0, correct: 0, credit: 0, lessonDone: false, last: null, due: null, wobbly: false, placed: false };
  return state.skills[id];
}
/* ---------- notes from the grown-ups: Melissa opens them with her avatar and her mascot, answers with a button, the grown-up sees the answer ---------- */
const NOTE_REPLIES = [
  { id: 'love', emoji: '❤️', text: 'I love you!' }, { id: 'party', emoji: '🎉', text: 'Yay! Thank you!' }, { id: 'hug', emoji: '🤗', text: 'Big hug!' },
  { id: 'try', emoji: '⭐', text: 'I will try my best!' }, { id: 'done', emoji: '💪', text: 'I did it!' }, { id: 'laugh', emoji: '😂', text: 'Ha ha ha!' }
];
const NOTES_CAP = 60;
function noteReplyById(id){ for(let i = 0; i < NOTE_REPLIES.length; i++) if(NOTE_REPLIES[i].id === id) return NOTE_REPLIES[i]; return null; }
function cleanNotes(a){
  if(!Array.isArray(a)) return [];
  const seen = {}, out = [];
  a.forEach(function(n){
    if(!n || typeof n !== 'object' || typeof n.text !== 'string' || !n.text.trim() || !n.id) return;
    const id = String(n.id).slice(0, 40); if(seen[id]) return; seen[id] = 1;
    out.push({ id: id, text: n.text.trim().slice(0, 300), from: String(n.from || '').trim().slice(0, 24), when: n.when === 'mission' ? 'mission' : 'now',
      date: /^\d{4}-\d{2}-\d{2}$/.test(String(n.date)) ? String(n.date) : '', read: !!n.read, reply: noteReplyById(n.reply) ? String(n.reply) : '', replyAt: n.reply && noteReplyById(n.reply) && typeof n.replyAt === 'string' ? n.replyAt.slice(0, 30) : '', del: !!n.del });
  });
  return out.sort(function(a, b){ return a.date < b.date ? -1 : a.date > b.date ? 1 : (a.id < b.id ? -1 : 1); }).slice(-NOTES_CAP);
}
function addNote(state, text, from, when, now, rnd){
  text = String(text || '').trim(); if(!text) return null;
  const n = { id: 'n' + (now || Date.now()).toString(36) + Math.floor((rnd || Math.random)() * 1679616).toString(36), text: text.slice(0, 300), from: String(from || '').trim().slice(0, 24), when: when === 'mission' ? 'mission' : 'now', date: todayStr(), read: false, reply: '', replyAt: '', del: false };
  state.notes = cleanNotes((state.notes || []).concat([n])); return n;
}
/* notes she should see now: unread, not deleted, and (for "after the mission" ones) only once today's mission is done */
function notesDue(state){
  const d = state.daily && state.daily.date === todayStr() && state.daily.boss;
  return (state.notes || []).filter(function(n){ return !n.del && !n.read && (n.when === 'now' || d); });
}
function noteById(state, id){ const l = state.notes || []; for(let i = 0; i < l.length; i++) if(l[i].id === id) return l[i]; return null; }
function answerNote(state, id, replyId, now){
  const n = noteById(state, id), r = noteReplyById(replyId); if(!n || n.del || !r) return null;
  n.read = true; n.reply = r.id; n.replyAt = new Date(now || Date.now()).toISOString(); return n;
}
function mergeState(loaded){
  const d = defaultState(); const L = loaded || {};
  const m = Object.assign({}, d, L);
  m.prefs = Object.assign({}, d.prefs, L.prefs || {});
  m.placement = Object.assign({}, d.placement, L.placement || {});
  m.timer = Object.assign({}, d.timer, L.timer || {});
  m.streak = Object.assign({}, d.streak, L.streak || {});
  m.daily = Object.assign({}, d.daily, L.daily || {});
  m.skills = L.skills || {}; m.errors = L.errors || {};
  m.evidence = cleanEvidence(L.evidence);
  m.placement.paid = Math.max(0, Math.min(40, Number(m.placement.paid) | 0)); m.welcomeGift = !!L.welcomeGift;
  m.owned = cleanOwned(L.owned); m.avatar = cleanAvatar(L.avatar, m.owned); m.met = cleanMet(L.met);
  m.petAcc = cleanPetAcc(L.petAcc, m.owned); m.shopMult = SHOP_MULTS.indexOf(Number(L.shopMult)) > -1 ? Number(L.shopMult) : 1; m.shopCat = cleanShopCat(L.shopCat); m.notes = cleanNotes(L.notes); m.puzzleCur = Math.max(0, Math.min(500, Number(L.puzzleCur) | 0));
  m.puzzleBase = isFinite(Number(L.puzzleBase)) && L.puzzleBase !== null && L.puzzleBase !== '' ? Math.max(0, Math.round(Number(L.puzzleBase))) : Math.max(0, Math.round(Number(L.totalStars) || 0));   // a save from before the puzzle: it starts from the stars she already has, never as a gift
  m.lastBackup = (typeof L.lastBackup === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(L.lastBackup)) ? L.lastBackup : null;
  m.diag = (L.diag && typeof L.diag === 'object' && !Array.isArray(L.diag) && L.diag.strands && L.diag.results) ? L.diag : null;
  const petV = function(v){ v = Number(v) | 0; return v >= 0 && v < PET_VARIANTS ? v : 0; };
  const num = function(x, dflt){ x = Number(x); return isFinite(x) ? x : (dflt || 0); };
  const objs = function(a){ return Array.isArray(a) ? a.filter(function(x){ return x && typeof x === 'object'; }) : []; };
  m.friend = (MASCOT_IDS.indexOf(L.friend) > -1 && avOwns(m, 'pet', L.friend)) ? L.friend : 'ginger';
  m.stickers = objs(L.stickers).filter(function(s){ return typeof s.base === 'string'; }).map(function(s){ return { id: (PET_IDS.indexOf(s.pet) > -1 ? 'pet:' + s.pet + ':' + petV(s.v) : String(s.id)), pet: PET_IDS.indexOf(s.pet) > -1 ? s.pet : '', v: petV(s.v), base: String(s.base), acc: String(s.acc || ''), bg: num(s.bg) | 0, rarity: RARITIES.indexOf(s.rarity) > -1 ? s.rarity : 'common', n: Math.max(1, num(s.n, 1) | 0), date: s.date ? String(s.date) : null, legacy: !!s.legacy }; });
  m.tricks = Array.isArray(L.tricks) ? L.tricks.map(String) : []; m.badges = Array.isArray(L.badges) ? L.badges.map(String) : [];
  m.claims = objs(L.claims).map(function(c){ return { id: String(c.id || ''), title: String(c.title || ''), emoji: String(c.emoji || ''), cost: num(c.cost), date: c.date ? String(c.date) : '' }; });
  m.sessionLog = objs(L.sessionLog).filter(function(l){ return typeof l.date === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(l.date); }).map(function(l){ return { date: l.date, kind: String(l.kind || 'practice'), strand: String(l.strand || ''), skill: l.skill ? String(l.skill) : null, correct: num(l.correct), total: num(l.total), credit: num(l.credit), mood: l.mood ? String(l.mood) : null }; });
  ['totalStars', 'starBalance', 'xp', 'packs'].forEach(function(k){ m[k] = Math.max(0, num(L[k])); });
  m.level = Math.max(1, num(L.level, 1) | 0); m.streak.count = Math.max(0, num(m.streak.count) | 0);
  m.rewards = (Array.isArray(L.rewards) && L.rewards.filter(Boolean).length) ? L.rewards.filter(Boolean).map(function(r){ return { id: String(r.id), emoji: String(r.emoji || '🎁'), title: String(r.title || 'Prize'), cost: Math.max(1, parseInt(r.cost, 10) || 10) }; }) : d.rewards;
  m.v = 4;
  if(m.placement.started && !m.placement.done && !m.diag) migrateQuestToDiag(m);   // a quest left half-done by the old version carries on as the adaptive diagnostic
  return m;
}
/* v3 -> v4: keep everything she earned. Old stickers become collectables; stars, prizes, timer, streak stay. */
function migrateV3(old){
  const m = mergeState({});
  m.name = 'Melissa'; m.theme = THEMES[old.theme] ? old.theme : 'unicorn';
  m.prefs = Object.assign(m.prefs, { likes: (old.preferences && old.preferences.likes) || [], dislikes: (old.preferences && old.preferences.dislikes) || [] });
  m.totalStars = old.totalStars || 0; m.starBalance = typeof old.starBalance === 'number' ? old.starBalance : m.totalStars;
  m.stickers = (old.stickers || []).map(function(e){ return { id: 'L:' + e, base: e, acc: '', bg: 0, rarity: 'common', n: 1, date: null, legacy: true }; });
  m.claims = Array.isArray(old.claims) ? old.claims : []; if(Array.isArray(old.rewards) && old.rewards.length) m.rewards = old.rewards;
  const clean = mergeState({ rewards: m.rewards, claims: m.claims }); m.rewards = clean.rewards; m.claims = clean.claims;
  m.timer = Object.assign(m.timer, old.timer || {}); m.streak = Object.assign(m.streak, old.streak || {});
  m.badges = (old.badges || []).filter(function(b){ return ['racha3', 'racha7', 'estrellas50', 'estrellas150', 'stickers10', 'primer_dia'].indexOf(b) !== -1; });
  m.sessionLog = (old.sessionLog || []).map(function(l){ return { date: l.date, kind: 'legacy', strand: l.strand, skill: null, correct: l.correct, total: l.total, credit: l.total ? l.correct / l.total : 0, mood: l.mood || null }; });
  m.legacy = { migratedFrom: 3, date: todayStr() };
  m.onboardingDone = !!old.onboardingDone;       // she keeps her theme; placement still runs (new skill map)
  return m;
}
/* Which loader an imported file goes through (kept pure so the tests can exercise the real import path). */
function importState(o){ return o.v === 4 ? mergeState(o) : (o.strands ? migrateV3(o) : mergeState(o)); }
function loadState(storage){
  try {
    const raw = storage.getItem(STATE_KEY);
    if(raw) return mergeState(JSON.parse(raw));
    const v3 = storage.getItem(V3_KEY) || storage.getItem(V2_KEY);
    if(v3){ const parsed = JSON.parse(v3); if(parsed && parsed.strands) return migrateV3(parsed); }
  } catch(e){ try { const raw = storage.getItem(STATE_KEY); if(raw) storage.setItem(STATE_KEY + '_backup', raw); } catch(e2){} }
  return defaultState();
}

/* ---------- catalogue helpers (SKILLS comes from core.js) ---------- */
function skillsOfStrand(id){ return SKILLS.filter(function(s){ return s.strand === id; }).sort(function(a, b){ return a.order - b.order; }); }
function strandsWithSkills(){ return STRANDS.filter(function(s){ return skillsOfStrand(s.id).length > 0; }); }
function isUnlocked(state, sk){ if(state.skills[sk.id] && state.skills[sk.id].medal >= 1) return true; return sk.prereq.every(function(p){ const ps = state.skills[p]; return ps && ps.medal >= 1; }); }
function medalOf(state, id){ return state.skills[id] ? state.skills[id].medal : 0; }
function strandProgress(state, strandId){
  const list = skillsOfStrand(strandId); if(!list.length) return 0;
  return Math.round(list.reduce(function(t, s){ return t + medalOf(state, s.id); }, 0) / (list.length * 3) * 100);
}
function totalMedals(state){ return SKILLS.reduce(function(t, s){ return t + medalOf(state, s.id); }, 0); }

/* ---------- levels / xp ---------- */
function xpForLevel(n){ return 60 * n * (n - 1) / 2 + 40 * (n - 1); }          // cumulative xp to reach level n
function levelFromXp(xp){ let n = 1; while(xp >= xpForLevel(n + 1)) n++; return n; }
function levelTitle(n){ return LEVEL_TITLES[Math.min(LEVEL_TITLES.length - 1, Math.floor((n - 1) / 2))]; }

/* SCHOOL-ORDER:BEGIN (generated by tools/curriculum-export.js from curriculum/curriculum.json - do not edit) */
const SCHOOL_SEQ = {"addsub-add-column":5,"addsub-bonds":0,"addsub-difference":9,"addsub-mental-3d":2,"addsub-missing-inverse":9,"addsub-sub-column":9,"addsub-word":9,"data-bar-charts":14,"data-line-graphs":20,"data-pictograms":14,"data-tally-tables":14,"data-two-step":14,"frac-add-sub":11,"frac-compare-order":11,"frac-equivalent":11,"frac-nonunit":11,"frac-number-line":11,"frac-of-quantity":11,"frac-read":11,"frac-tenths":11,"geo-2d-shapes":10,"geo-3d-shapes":10,"geo-angles":7,"geo-coordinates":20,"geo-lines":7,"geo-symmetry":20,"geo-turns":7,"logic-patterns":null,"logic-puzzles":null,"logic-sorting":null,"logic-strategies":null,"measure-area":20,"measure-capacity":13,"measure-length":6,"measure-mass":13,"measure-money":13,"measure-perimeter":6,"measure-units":13,"multdiv-10-100":20,"multdiv-2-5-10":3,"multdiv-2digit-partition":8.5,"multdiv-3":4,"multdiv-4":3,"multdiv-6-9":8,"multdiv-8":3,"multdiv-arrays-groups":8.5,"multdiv-bridge-tables":20,"multdiv-division-facts":8.5,"multdiv-doubles-halves":0,"multdiv-formal-mult":8.5,"multdiv-mult-3d":20,"multdiv-remainders":8.5,"multdiv-word":8.5,"number-10-100-more-less":1,"number-4-digit":20,"number-compare-order":1,"number-count-steps":1,"number-decimals":20,"number-line-3digit":1,"number-negative":20,"number-place-value":1,"number-pv-counters":1,"number-roman-100":20,"number-round":20,"number-round-1000":20,"time-24h-ampm":12,"time-duration":12,"time-facts":12,"time-five-minutes":12,"time-minutes":12,"time-quarters":12,"time-roman":12};   // unit position in the school sequence; null = reasoning stream that runs alongside every unit
/* SCHOOL-ORDER:END */

/* ---------- planning ---------- */
function dueSkills(state, today){
  today = today || todayStr(); const out = [];
  SKILLS.forEach(function(s){ const st = state.skills[s.id]; if(st && st.medal >= 1 && st.due && st.due <= today) out.push(s); });
  out.sort(function(a, b){ const A = state.skills[a.id], B = state.skills[b.id]; if(A.wobbly !== B.wobbly) return A.wobbly ? -1 : 1; return A.due < B.due ? -1 : (A.due > B.due ? 1 : 0); });
  return out;
}
/* Which step is next for this skill? */
function nextStepFor(state, sk){
  const st = skillState(state, sk.id);
  if((st.likely || sk.year === 2) && !st.triedOut && st.medal === 0 && !st.lessonDone) return 'testout';   // the diagnostic thinks she knows it: offer a quick check first
  if(!st.lessonDone && st.medal === 0) return 'learn';
  if(st.medal === 0) return 'guided';
  if(st.medal === 1) return 'practice';
  if(st.medal === 2) return 'challenge';
  return 'review';
}
function openSkills(state){
  return SKILLS.filter(function(s){ const st = state.skills[s.id]; return isUnlocked(state, s) && medalOf(state, s.id) < 3 && !(st && st.goldFrom); });
}
/* Recommendation follows the SCHOOL ORDER (unit position), then the lowest medal inside the unit, then the skill order.
   Reasoning skills (seq null) run alongside: one in every 6 sessions. A skill still locked behind a prerequisite is never offered, so a prerequisite can outrank the school order. */
const STREAM_EVERY = 6;
/* ---------- adaptive rules ---------- */
const BACKOFF_ACC = 0.5;        // two sessions in a row below this on one skill: go back to its weakest prerequisite
const GATE_SILVER = 0.8;        // Year 4 content opens when this share of the Year 3 skills is at least silver (and none is wobbly)
function struggling(state, id){
  const log = state.sessionLog.filter(function(l){ return l.skill === id && ['guided', 'practice', 'challenge'].indexOf(l.kind) > -1; });
  return log.length >= 2 && log.slice(-2).every(function(l){ return l.credit < BACKOFF_ACC; });
}
function weakestPrereq(state, sk){
  const c = (sk.prereq || []).map(skillById).filter(function(p){ return p && isUnlocked(state, p) && medalOf(state, p.id) < 2 && !(state.skills[p.id] && state.skills[p.id].goldFrom); });
  c.sort(function(a, b){ return (medalOf(state, a.id) - medalOf(state, b.id)) || (a.order - b.order); });
  return c[0] || null;
}
function yearGateOpen(state){
  const y3 = SKILLS.filter(function(s){ return s.year === 3; }); if(!y3.length) return true;
  const silver = y3.filter(function(s){ return medalOf(state, s.id) >= 2; }).length;
  return silver / y3.length >= GATE_SILVER && !y3.some(function(s){ return state.skills[s.id] && state.skills[s.id].wobbly; });
}
/* the ordered list of skills to work on (best first); the first entry already includes the "go back to a prerequisite" rule */
function rankOpen(state){
  let open = openSkills(state); if(!open.length) return [];
  if(!yearGateOpen(state)){ const y3 = open.filter(function(s){ return s.year < 4; }); if(y3.length) open = y3; }   // depth before Year 4
  if(state.focus){ const f = open.filter(function(s){ return s.strand === state.focus; }); if(f.length) open = f; }
  const cmp = function(a, b){ return (SCHOOL_SEQ[a.id] - SCHOOL_SEQ[b.id]) || (medalOf(state, a.id) - medalOf(state, b.id)) || (a.order - b.order); };
  const main = open.filter(function(s){ return SCHOOL_SEQ[s.id] !== null; }).sort(cmp);
  const stream = open.filter(function(s){ return SCHOOL_SEQ[s.id] === null; }).sort(function(a, b){ return (medalOf(state, a.id) - medalOf(state, b.id)) || (a.order - b.order); });
  let ranked = main.concat(stream);
  if(main[0] && stream[0]){
    const log = state.sessionLog.filter(function(l){ return ['guided', 'practice', 'challenge', 'testout'].indexOf(l.kind) > -1; }); let since = 0;
    for(let i = log.length - 1; i >= 0; i--){ const sk = skillById(log[i].skill); if(sk && SCHOOL_SEQ[sk.id] === null) break; since++; }
    if(since >= STREAM_EVERY) ranked = stream.concat(main);
  }
  const first = ranked[0], pre = struggling(state, first.id) ? weakestPrereq(state, first) : null;
  if(pre){ ranked = [pre].concat(ranked.filter(function(s){ return s.id !== pre.id; })); ranked.backoffFrom = first.id; }
  return ranked;
}
function recommend(state){
  const r = rankOpen(state); if(!r.length) return null;
  const out = { skill: r[0], step: nextStepFor(state, r[0]) };
  if(r.backoffFrom) out.backoffFrom = r.backoffFrom;
  return out;
}

/* ---------- the 25-minute mission (retrieval -> goal -> explanation -> practice -> reasoning -> feedback) ----------
   The next stage is always decided from the CURRENT state, so a failed quick check or a lesson changes what comes next.
   m = { elapsed: seconds so far, budget: seconds, done: [{kind, skillId, acc}] } */
const MISSION_SECONDS = 25 * 60, MISSION_MAX_STAGES = 9;
function nextMissionStage(state, m){
  const budget = m.budget || MISSION_SECONDS, done = m.done || [];
  if(done.length >= MISSION_MAX_STAGES) return null;
  const warmed = done.some(function(d){ return d.kind === 'review'; });
  if(!warmed && dueSkills(state).length) return { kind: 'review', skillId: null, label: 'Warm-up: remember' };
  const blockDone = done.filter(function(d){ return d.kind !== 'review'; });
  if(blockDone.length && m.elapsed >= budget) return null;
  if(!blockDone.length && m.elapsed >= budget * 2) return null;
  const last = blockDone[blockDone.length - 1];
  if(last){
    const sk = skillById(last.skillId);
    if(last.kind === 'learn') { const st = nextStepFor(state, sk); if(st !== 'learn') return { kind: st, skillId: sk.id, label: STEP_NAME[st] }; }
    if(last.kind === 'testout' && last.acc < 0.99){ const st = nextStepFor(state, sk); if(st !== 'testout') return { kind: st === 'learn' ? 'learn' : st, skillId: sk.id, label: STEP_NAME[st] }; }
    if(['practice', 'challenge'].indexOf(last.kind) > -1 && last.acc >= 0.6 && !done.some(function(d){ return d.kind === 'think' && d.skillId === sk.id; })) return { kind: 'think', skillId: sk.id, label: 'Think hard' };
  }
  /* a new block: the best skill not worked on yet in this mission */
  const used = {}; done.forEach(function(d){ if(d.skillId) used[d.skillId] = 1; });
  const ranked = rankOpen(state).filter(function(s){ return !used[s.id]; });
  for(let i = 0; i < ranked.length; i++){
    const st = nextStepFor(state, ranked[i]);
    if(st === 'review') continue;
    return { kind: st, skillId: ranked[i].id, label: STEP_NAME[st] };
  }
  return null;
}
const STEP_NAME = { learn: 'Learn it', guided: 'Guided', practice: 'Practice', challenge: 'Challenge', testout: 'Quick check', think: 'Think hard', review: 'Review' };

/* ---------- sessions ---------- */
const SESSION_LEN = { guided: 4, practice: 6, challenge: 5, testout: 3, think: 3 };
function buildItems(state, kind, skillId){
  const items = [];
  if(kind === 'review'){
    const today = todayStr();
    dueSkills(state).slice(0, 3).forEach(function(s){ const m = medalOf(state, s.id), gf = state.skills[s.id].goldFrom;
      if(gf && gf < today && m === 2){ for(let i = 0; i < 3; i++) items.push({ skillId: s.id, tier: 3 }); }   // the gold review: 3 questions at challenge level
      else for(let i = 0; i < 2; i++) items.push({ skillId: s.id, tier: m >= 3 ? 3 : 2 }); });   // 2 questions per skill: one answer is too little evidence to move a review box
    return items;
  }
  const tier = { guided: 1, practice: 2, challenge: 3, testout: 2, think: 3 }[kind];
  for(let i = 0; i < SESSION_LEN[kind]; i++) items.push({ skillId: skillId, tier: tier });
  return items;
}
/* Scoring of ONE question. tries: 0 = first try; hint: used hint */
function questionCredit(correct, tries, hint){ if(!correct) return 0; return (tries === 0 && !hint) ? 1 : 0.6; }
function sessionStars(credits){
  const n = credits.length; if(!n) return 0;
  const sum = credits.reduce(function(a, b){ return a + b; }, 0);
  let stars = Math.round(sum * 1.5);
  if(sum === n) stars += 3;           // perfect: all first-try
  return stars;
}
/* Apply a finished session for one skill. Returns {before, after, medalUp, wobblyCleared} */
function applySkillResult(state, skillId, kind, credits, today){
  today = today || todayStr();
  const st = skillState(state, skillId);
  const n = credits.length; const sum = credits.reduce(function(a, b){ return a + b; }, 0); const acc = n ? Math.round(sum / n * 1e6) / 1e6 : 0;
  st.likely = false;
  const before = { medal: st.medal, box: st.box, wobbly: st.wobbly, goldFrom: st.goldFrom || null };
  st.seen += n; st.correct += credits.filter(function(c){ return c > 0; }).length; st.credit += sum; st.last = today;
  const bump = function(){ st.box = Math.min(6, st.box + 1); };
  if(kind === 'guided'){ if(acc >= 0.7){ st.medal = Math.max(st.medal, 1); st.box = Math.max(st.box, 1); } }
  else if(kind === 'practice'){ if(acc >= 0.8 && st.medal >= 1){ st.medal = Math.max(st.medal, 2); bump(); } else if(acc >= 0.7 && st.medal === 0){ st.medal = 1; st.box = Math.max(st.box, 1); } }
  else if(kind === 'challenge'){ if(acc >= 0.8 && st.medal >= 3) bump(); else if(acc >= 0.8 && st.medal === 2){ st.goldFrom = st.goldFrom || today; bump(); } else if(acc >= 0.8 && st.medal === 1){ st.medal = 2; bump(); } }   // gold is NOT awarded here: it needs a review passed on a later day
  else if(kind === 'testout'){ st.triedOut = true; if(acc >= 0.99){ st.medal = Math.max(st.medal, 1); st.box = Math.max(st.box, 1); st.placed = true; } }
  else if(kind === 'review'){ if(acc >= 0.8){ bump(); st.wobbly = false; if(st.goldFrom && st.medal === 2 && st.goldFrom < today){ st.medal = 3; st.goldFrom = null; } } else if(acc < 0.5){ st.box = Math.max(0, st.box - 1); st.wobbly = true; } }
  if(kind !== 'review' && acc >= 0.8) st.wobbly = false;
  if(kind !== 'review' && kind !== 'think' && acc < 0.5 && st.medal >= 1) st.wobbly = true;   // a hard 'think' block never makes a skill wobbly
  // schedule next review
  if(st.medal >= 1) st.due = addDays(today, REVIEW_DAYS[Math.min(st.box, REVIEW_DAYS.length - 1)] || 1);
  if(st.goldFrom && st.medal === 2) st.due = addDays(today, 1);
  if(st.medal >= 3) st.goldFrom = null;
  return { before: before, after: { medal: st.medal, box: st.box, wobbly: st.wobbly }, medalUp: st.medal > before.medal, goldPending: !!st.goldFrom && !before.goldFrom, wobblyCleared: before.wobbly && !st.wobbly, acc: acc };
}
function recordError(state, skillId, why, today){
  if(!why) return;
  const key = skillId + '||' + why;
  const e = state.errors[key] || { skill: skillId, why: why, n: 0, last: null };
  e.n++; e.last = today || todayStr(); state.errors[key] = e;
  const keys = Object.keys(state.errors);
  if(keys.length > 220){ keys.sort(function(a, b){ return state.errors[a].n - state.errors[b].n; }); keys.slice(0, 40).forEach(function(k){ delete state.errors[k]; }); }
}
function topErrors(state, n){
  return Object.keys(state.errors).map(function(k){ return state.errors[k]; }).sort(function(a, b){ return b.n - a.n || (a.last < b.last ? 1 : -1); }).slice(0, n || 6);
}
function updateStreak(state, today){
  today = today || todayStr();
  if(state.streak.lastPlayDate === today) return;
  if(state.streak.lastPlayDate){ const d = daysBetween(state.streak.lastPlayDate, today); state.streak.count = d === 1 ? state.streak.count + 1 : 1; }
  else state.streak.count = 1;
  state.streak.lastPlayDate = today;
}
function addXp(state, amount){
  const before = state.level; state.xp += amount; state.level = levelFromXp(state.xp);
  return state.level > before ? state.level : 0;
}
function ensureDaily(state, today){
  today = today || todayStr();
  if(state.daily.date !== today) state.daily = { date: today, warmup: false, learn: false, boss: false, claimed: false, rounds: 0 };
  return state.daily;
}

/* ---------- placement ("Explorer's Quest") ---------- */
function placementOrder(){ return strandsWithSkills().map(function(s){ return s.id; }); }
function placementNextItem(state){
  const P = state.placement; const order = placementOrder();
  while(P.strandIdx < order.length){
    const list = skillsOfStrand(order[P.strandIdx]);
    // the next unasked skill of this strand
    if(P.asked < list.length && P.misses < 2 && P.asked < 4) return { strand: order[P.strandIdx], skill: list[P.asked] };
    P.strandIdx++; P.asked = 0; P.misses = 0;
  }
  return null;
}
function placementRecord(state, skillId, credit){
  const P = state.placement; P.asked++; P.results[skillId] = credit;
  if(credit >= 1){ const st = skillState(state, skillId); st.medal = Math.max(st.medal, 1); st.box = Math.max(st.box, 1); st.placed = true; st.due = addDays(todayStr(), 1); P.misses = 0; }
  else { P.misses++; }
}
function placementDone(state){ if(state.diag) return state.diag.done ? true : diagNextItem(state) === null; return placementNextItem(state) === null; }
/* Explorer's Quest rewards: a welcome gift (so there is something to spend in "Me" from day one) and +3 stars for every land finished. */
const WELCOME_STARS = 20, LAND_STARS = 3;
function claimWelcome(state){ if(state.welcomeGift) return 0; state.welcomeGift = true; state.starBalance += WELCOME_STARS; state.totalStars += WELCOME_STARS; return WELCOME_STARS; }
function questLands(state){
  const total = placementOrder().length; let done = 0;
  if(state.diag){ const st = state.diag.strands || {}; Object.keys(st).forEach(function(k){ if(st[k] && st[k].done) done++; }); if(state.diag.done) done = total; }
  else { placementNextItem(state); done = Math.min(total, state.placement.strandIdx); }
  return { done: Math.min(done, total), total: total };
}
/* pays any land finished but not yet paid. Idempotent. Returns the stars just paid. */
function questPay(state){
  const L = questLands(state), due = Math.max(0, L.done - (state.placement.paid || 0)); if(!due) return 0;
  state.placement.paid = L.done; const st = due * LAND_STARS; state.starBalance += st; state.totalStars += st; return st;
}
function placementSummary(state){
  const known = [], learn = [];
  strandsWithSkills().forEach(function(str){
    skillsOfStrand(str.id).forEach(function(s){
      if(state.placement.results[s.id] === undefined) return;
      (state.placement.results[s.id] >= 1 ? known : learn).push(s);
    });
  });
  return { known: known, learn: learn };
}

/* ---------- adaptive diagnostic (Year 2 -> Year 3): short blocks, floor and ceiling by binary search per strand ----------
   A block = 2 questions at tier 2 (a 3rd only if they split). Pass = 2 right (independent, no hints in a diagnostic). One question never earns bronze.
   Per strand the skills are in teaching order; we search for the highest skill she passes. Untested skills below it are marked "likely" (no medal: a quick check is offered). */
function diagBlocksFor(n){ return Math.min(4, Math.ceil(Math.log(n + 1) / Math.LN2)); }
function diagStart(state){
  const prev = state.diag && state.diag.runs ? state.diag.runs : 0;
  state.diag = { v: 1, runs: prev + 1, startedOn: todayStr(), doneOn: null, done: false, cur: null, strands: {}, results: {} };
  state.placement.started = true; state.placement.done = false;
  return state.diag;
}
/* A quest left half-done by the old (fixed) version carries on as the adaptive diagnostic: finished lands stay finished (their medals and stars are already hers), the land in progress starts again. */
function migrateQuestToDiag(state){
  const P = state.placement, order = placementOrder(); placementNextItem(state);
  const done = Math.min(P.strandIdx, order.length);
  state.diag = { v: 1, runs: 1, startedOn: todayStr(), doneOn: null, done: false, cur: null, strands: {}, results: {} };
  for(let i = 0; i < done; i++){
    const id = order[i], list = skillsOfStrand(id); let low = -1;
    list.forEach(function(sk, idx){ const c = P.results[sk.id]; if(c === undefined) return; state.diag.results[sk.id] = { n: 2, ok: c >= 1 ? 2 : 0, pass: c >= 1 }; if(c >= 1) low = Math.max(low, idx); });
    state.diag.strands[id] = { lowPass: low, highFail: Math.min(list.length, low + 1), blocks: 1, done: false };
    diagStrandCheck(state, id);
  }
  return state.diag;
}
function diagActive(state){ return !!(state.diag && !state.diag.done); }
function diagStrand(state, id){
  const D = state.diag, n = skillsOfStrand(id).length;
  if(!D.strands[id]) D.strands[id] = { lowPass: -1, highFail: n, blocks: 0, done: false };
  return D.strands[id];
}
function diagStrandCheck(state, id){      // close the strand when the boundary is pinned down or its budget is spent
  const st = diagStrand(state, id), list = skillsOfStrand(id);
  if(st.highFail - st.lowPass <= 1 || st.blocks >= diagBlocksFor(list.length)){
    st.done = true;
    for(let i = 0; i <= st.lowPass - 1; i++){ const sk = list[i]; if(state.diag.results[sk.id]) continue; state.diag.results[sk.id] = { n: 0, ok: 0, pass: false, likely: true };
      const ss = skillState(state, sk.id); if(ss.medal === 0 && !ss.lessonDone) ss.likely = true; }
  }
  return st.done;
}
function diagNextItem(state){
  const D = state.diag; if(!D || D.done) return null;
  if(D.cur){ const sk = SKILLS.filter(function(x){ return x.id === D.cur.skillId; })[0]; if(sk) return { strand: sk.strand, skill: sk }; D.cur = null; }
  const order = placementOrder();
  for(let i = 0; i < order.length; i++){
    const id = order[i], list = skillsOfStrand(id), st = diagStrand(state, id);
    if(st.done || diagStrandCheck(state, id)) continue;
    const idx = Math.floor((st.lowPass + st.highFail) / 2);
    D.cur = { skillId: list[idx].id, idx: idx, asked: 0, right: 0 };
    return { strand: id, skill: list[idx] };
  }
  D.done = true; D.doneOn = todayStr(); state.placement.done = true;
  return null;
}
/* Record one diagnostic answer. Returns {blockDone, pass} (pass only when blockDone). */
function diagRecord(state, skillId, correct, today){
  today = today || todayStr(); const D = state.diag, c = D && D.cur;
  if(!c || c.skillId !== skillId) return { blockDone: false };
  c.asked++; if(correct) c.right++;
  let pass = null;
  if(c.asked >= 2){ if(c.right === c.asked) pass = true; else if(c.right === 0) pass = false; else if(c.asked >= 3) pass = c.right >= 2; }
  if(pass === null) return { blockDone: false };
  const sk = SKILLS.filter(function(x){ return x.id === skillId; })[0], st = diagStrand(state, sk.strand);
  D.results[skillId] = { n: c.asked, ok: c.right, pass: pass }; st.blocks++;
  if(pass){ st.lowPass = Math.max(st.lowPass, c.idx);
    const ss = skillState(state, skillId); ss.medal = Math.max(ss.medal, 1); ss.box = Math.max(ss.box, 1); ss.placed = true; ss.likely = false; if(!ss.due) ss.due = addDays(today, 1); }
  else st.highFail = Math.min(st.highFail, c.idx);
  D.cur = null; diagStrandCheck(state, sk.strand);
  return { blockDone: true, pass: pass };
}
function diagSummary(state){
  const D = state.diag || { results: {} }; let known = 0, likely = 0, learn = 0, tested = 0;
  SKILLS.forEach(function(s){ const r = D.results[s.id]; if(!r) return; if(r.likely) likely++; else { tested++; if(r.pass) known++; else learn++; } });
  return { known: known, likely: likely, learn: learn, tested: tested };
}

/* ---------- stickers (endless: creature × accessory × background × rarity) ---------- */
const CREATURES = ['🦄', '🐶', '🐱', '🐰', '🦊', '🐻', '🐼', '🐨', '🐯', '🦁', '🐮', '🐷', '🐸', '🐵', '🐧', '🦉', '🦋', '🐢', '🐙', '🐬', '🐳', '🦖', '🦕', '🐝', '🐞', '🦩', '🦜', '🐘', '🦒', '🐹', '🐲', '🦔',
  '🦥', '🦦', '🐿️', '🦘', '🦓', '🐊', '🦈', '🐠', '🐡', '🦑', '🦀', '🦞', '🐌', '🦗', '🐛', '🦚', '🦢', '🦆', '🐓', '🐥', '🐴', '🐑', '🦙', '🐐', '🦌', '🐫', '🦛', '🦏', '🐅', '🐆', '🦇', '🦎'];   // new ones go at the END: sticker ids use the list position
const ACCESSORIES = ['', '👑', '🎩', '🕶️', '🎀', '⭐', '🌈', '💎', '🎈', '🪄', '🌸', '🎧', '🧢', '🍀', '🔮', '🍭', '🎵', '❄️', '🔥', '🍓'];
const STICKER_BGS = [['#FFD1DC', '#FFB3C7'], ['#C7E9FF', '#9AD0FF'], ['#D4F5D0', '#A8E6A3'], ['#FFF1B8', '#FFE27A'], ['#E6D4FF', '#C9A8FF'], ['#FFD9B3', '#FFB87A'], ['#C8F7F0', '#8EE9DB'], ['#FFC9C9', '#FF9E9E'], ['#D9E2FF', '#B5C6FF'], ['#F5D0FE', '#E9A2FB'], ['#E0F7B5', '#C3EA7A'], ['#FFE5EC', '#FFC2D1']];
const RARITIES = ['common', 'rare', 'epic', 'legendary'];
function rollRarity(){ const r = rng(); return r < 0.62 ? 'common' : (r < 0.88 ? 'rare' : (r < 0.98 ? 'epic' : 'legendary')); }
const PET_IDS = ['ginger', 'bimba', 'duck'];
const PET_VARIANTS = 9;   // images per pet (variant 0 = mascot) -> 27 collectible pet stickers
/* ---------- puzzle: every 5 stars she earns turns over one piece of a picture; 12 pieces = a finished picture and a sticker pack ---------- */
const PUZZLE_TILES = 12, PUZZLE_STEP = 5, PUZZLE_PICS = 6, PUZZLE_ORDER = [5, 2, 9, 0, 7, 11, 3, 8, 1, 6, 10, 4];
function puzzleInfo(state){
  const cur = Math.max(0, Number(state.puzzleCur) | 0), per = PUZZLE_TILES * PUZZLE_STEP, into = Math.max(0, (Number(state.totalStars) || 0) - (Number(state.puzzleBase) || 0) - cur * per);
  const tiles = Math.min(PUZZLE_TILES, Math.floor(into / PUZZLE_STEP));
  return { cur: cur, pic: cur % PUZZLE_PICS, tiles: tiles, complete: tiles >= PUZZLE_TILES, toNext: tiles >= PUZZLE_TILES ? 0 : PUZZLE_STEP - (into % PUZZLE_STEP), shown: PUZZLE_ORDER.slice(0, tiles) };
}
function puzzleCollect(state){ if(!puzzleInfo(state).complete) return false; state.puzzleCur = (state.puzzleCur | 0) + 1; state.packs = (state.packs | 0) + 1; return true; }
/* the animal album: which creatures she has found at least once (as a sticker) */
function albumStats(state){
  const have = {}; (state.stickers || []).forEach(function(s){ if(s.base) have[s.base] = 1; });
  return { have: CREATURES.filter(function(c){ return have[c]; }).length, total: CREATURES.length, owned: have };
}
function rollSticker(owned){
  let s = null;
  if(chance(0.08)){   // a pet friend sticker (the family pets, always legendary; 27 different pictures)
    const pet = pick(PET_IDS), v = randInt(0, PET_VARIANTS - 1);
    const ps = { id: 'pet:' + pet + ':' + v, pet: pet, v: v, base: '', acc: '', bg: randInt(0, STICKER_BGS.length - 1), rarity: 'legendary', n: 1, date: todayStr() };
    return { sticker: ps, dupe: owned.some(function(o){ return o.id === ps.id; }) };
  }
  for(let t = 0; t < 12; t++){
    const rarity = rollRarity();
    const base = pick(CREATURES);
    let acc = '';
    if(rarity === 'rare' || rarity === 'epic') acc = pick(ACCESSORIES.slice(1));
    else if(rarity === 'legendary') acc = '👑';
    else if(chance(0.4)) acc = pick(ACCESSORIES.slice(1));
    const bg = randInt(0, STICKER_BGS.length - 1);
    s = { id: CREATURES.indexOf(base) + '.' + ACCESSORIES.indexOf(acc) + '.' + bg + '.' + rarity, base: base, acc: acc, bg: bg, rarity: rarity, n: 1, date: todayStr() };
    if(!owned.some(function(o){ return o.id === s.id; })) return { sticker: s, dupe: false };
  }
  return { sticker: s, dupe: true };
}
/* Opens one pack: adds to the album; duplicates add a count and a few stars so it never feels empty. Always succeeds => never "runs out". */
function openPack(state){
  if(state.packs < 1) return null;
  state.packs--;
  const r = rollSticker(state.stickers);
  if(r.dupe){ const ex = state.stickers.filter(function(o){ return o.id === r.sticker.id; })[0]; ex.n = (ex.n || 1) + 1; state.starBalance += 3; state.totalStars += 3; return { sticker: ex, dupe: true, bonusStars: 3 }; }
  state.stickers.push(r.sticker);
  return { sticker: r.sticker, dupe: false, bonusStars: 0 };
}

/* ---------- badges ---------- */
const BADGES = [
  { id: 'first', label: 'First adventure', emoji: '🌟', test: function(s){ return s.sessionLog.filter(function(l){ return l.kind !== 'legacy'; }).length >= 1; } },
  { id: 'streak3', label: '3-day streak', emoji: '🔥', test: function(s){ return s.streak.count >= 3; } },
  { id: 'streak7', label: '7-day streak', emoji: '🔥', test: function(s){ return s.streak.count >= 7; } },
  { id: 'streak14', label: '14-day streak', emoji: '🌋', test: function(s){ return s.streak.count >= 14; } },
  { id: 'stars100', label: '100 stars', emoji: '⭐', test: function(s){ return s.totalStars >= 100; } },
  { id: 'stars300', label: '300 stars', emoji: '🌠', test: function(s){ return s.totalStars >= 300; } },
  { id: 'medals5', label: '5 medals', emoji: '🥉', test: function(s){ return totalMedals(s) >= 5; } },
  { id: 'medals20', label: '20 medals', emoji: '🥈', test: function(s){ return totalMedals(s) >= 20; } },
  { id: 'medals50', label: '50 medals', emoji: '🥇', test: function(s){ return totalMedals(s) >= 50; } },
  { id: 'gold1', label: 'First gold', emoji: '🏅', test: function(s){ return SKILLS.some(function(k){ return medalOf(s, k.id) >= 3; }); } },
  { id: 'tricks5', label: '5 magic tricks', emoji: '🎩', test: function(s){ return s.tricks.length >= 5; } },
  { id: 'tricks15', label: '15 magic tricks', emoji: '🪄', test: function(s){ return s.tricks.length >= 15; } },
  { id: 'stickers10', label: '10 stickers', emoji: '🌈', test: function(s){ return s.stickers.length >= 10; } },
  { id: 'stickers50', label: '50 stickers', emoji: '🦄', test: function(s){ return s.stickers.length >= 50; } },
  { id: 'comeback', label: 'Comeback kid', emoji: '💪', test: function(s){ return !!s.comeback; } },
  { id: 'perfect', label: 'Perfect round', emoji: '💯', test: function(s){ return !!s.hadPerfect; } }
];
STRANDS.forEach(function(st){
  BADGES.push({ id: 'master_' + st.id, label: st.name + ' Master', emoji: '🏆', test: function(s){ const l = skillsOfStrand(st.id); return l.length > 0 && l.every(function(k){ return medalOf(s, k.id) >= 3; }); } });
});
function checkBadges(state){
  const fresh = [];
  BADGES.forEach(function(b){ if(state.badges.indexOf(b.id) === -1 && b.test(state)){ state.badges.push(b.id); fresh.push(b); } });
  return fresh;
}

if(typeof module !== 'undefined') module.exports = { PUZZLE_TILES, PUZZLE_STEP, PUZZLE_PICS, PUZZLE_ORDER, puzzleInfo, puzzleCollect, albumStats, CREATURES, NOTE_REPLIES, noteReplyById, cleanNotes, addNote, notesDue, noteById, answerNote, migrateQuestToDiag, starEconomy, WELCOME_STARS, LAND_STARS, claimWelcome, questLands, questPay, parentMetrics, summaryText, BACKUP_DAYS, struggling, weakestPrereq, yearGateOpen, rankOpen, nextMissionStage, MISSION_SECONDS, BACKOFF_ACC, GATE_SILVER, diagStart, diagActive, diagNextItem, diagRecord, diagSummary, diagBlocksFor, cleanEvidence, recordEvidence, masteryLevel, repeatedErrors, goldWaiting, LEVEL_NAMES, EVIDENCE_CAP, PET_IDS, PET_VARIANTS, STRANDS, THEMES, strandMeta, PRAISE, ENCOURAGE, PACK_COST, REVIEW_DAYS, defaultState, mergeState, migrateV3, importState, loadState, skillState, skillsOfStrand, strandsWithSkills, isUnlocked, medalOf, strandProgress, totalMedals, xpForLevel, levelFromXp, levelTitle, dueSkills, nextStepFor, recommend, buildItems, questionCredit, sessionStars, applySkillResult, recordError, topErrors, updateStreak, addXp, ensureDaily, placementNextItem, placementRecord, placementDone, placementSummary, openPack, rollSticker, checkBadges, todayStr, addDays, daysBetween, STICKER_BGS, CREATURES, ACCESSORIES, BADGES, STATE_KEY, V3_KEY };
