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
    prefs: { likes: [], dislikes: [], voice: true, sound: true },
    placement: { done: false, started: false, strandIdx: 0, asked: 0, misses: 0, queue: [], results: {} },
    skills: {}, errors: {},
    totalStars: 0, starBalance: 0, xp: 0, level: 1,
    stickers: [], packs: 0, tricks: [], badges: [],
    claims: [], rewards: DEFAULT_REWARDS.map(function(r){ return Object.assign({}, r); }), goalReward: null,
    timer: { mode: 'free', minutes: 20, debtSeconds: 0 },
    streak: { count: 0, lastPlayDate: null },
    sessionLog: [], daily: { date: null, warmup: false, learn: false, boss: false, claimed: false },
    focus: null, legacy: null
  };
}
function skillState(state, id){
  if(!state.skills[id]) state.skills[id] = { medal: 0, box: 0, seen: 0, correct: 0, credit: 0, lessonDone: false, last: null, due: null, wobbly: false, placed: false };
  return state.skills[id];
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
  m.stickers = Array.isArray(L.stickers) ? L.stickers : []; m.tricks = L.tricks || []; m.badges = L.badges || []; m.claims = L.claims || [];
  m.sessionLog = L.sessionLog || [];
  m.rewards = (Array.isArray(L.rewards) && L.rewards.length) ? L.rewards.map(function(r){ return { id: String(r.id), emoji: String(r.emoji || '🎁'), title: String(r.title || 'Prize'), cost: Math.max(1, parseInt(r.cost, 10) || 10) }; }) : d.rewards;
  m.v = 4;
  return m;
}
/* v3 -> v4: keep everything she earned. Old stickers become collectables; stars, prizes, timer, streak stay. */
function migrateV3(old){
  const m = mergeState({});
  m.name = 'Melissa'; m.theme = THEMES[old.theme] ? old.theme : 'unicorn';
  m.prefs = Object.assign(m.prefs, { likes: (old.preferences && old.preferences.likes) || [], dislikes: (old.preferences && old.preferences.dislikes) || [] });
  m.totalStars = old.totalStars || 0; m.starBalance = typeof old.starBalance === 'number' ? old.starBalance : m.totalStars;
  m.stickers = (old.stickers || []).map(function(e){ return { id: 'L:' + e, base: e, acc: '', bg: 0, rarity: 'common', n: 1, date: null, legacy: true }; });
  m.claims = old.claims || []; if(Array.isArray(old.rewards) && old.rewards.length) m.rewards = old.rewards;
  m.timer = Object.assign(m.timer, old.timer || {}); m.streak = Object.assign(m.streak, old.streak || {});
  m.badges = (old.badges || []).filter(function(b){ return ['racha3', 'racha7', 'estrellas50', 'estrellas150', 'stickers10', 'primer_dia'].indexOf(b) !== -1; });
  m.sessionLog = (old.sessionLog || []).map(function(l){ return { date: l.date, kind: 'legacy', strand: l.strand, skill: null, correct: l.correct, total: l.total, credit: l.total ? l.correct / l.total : 0, mood: l.mood || null }; });
  m.legacy = { migratedFrom: 3, date: todayStr() };
  m.onboardingDone = !!old.onboardingDone;       // she keeps her theme; placement still runs (new skill map)
  return m;
}
function loadState(storage){
  try {
    const raw = storage.getItem(STATE_KEY);
    if(raw) return mergeState(JSON.parse(raw));
    const v3 = storage.getItem(V3_KEY) || storage.getItem(V2_KEY);
    if(v3){ const parsed = JSON.parse(v3); if(parsed && parsed.strands) return migrateV3(parsed); }
  } catch(e){}
  return defaultState();
}

/* ---------- catalogue helpers (SKILLS comes from core.js) ---------- */
function skillsOfStrand(id){ return SKILLS.filter(function(s){ return s.strand === id; }).sort(function(a, b){ return a.order - b.order; }); }
function strandsWithSkills(){ return STRANDS.filter(function(s){ return skillsOfStrand(s.id).length > 0; }); }
function isUnlocked(state, sk){ return sk.prereq.every(function(p){ const ps = state.skills[p]; return ps && ps.medal >= 1; }); }
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
  if(!st.lessonDone && st.medal === 0) return 'learn';
  if(st.medal === 0) return 'guided';
  if(st.medal === 1) return 'practice';
  if(st.medal === 2) return 'challenge';
  return 'review';
}
function recommend(state){
  // prefer the strand she is weakest in (lowest progress) among strands that have an unlocked, unfinished skill; honour her chosen focus
  const cand = [];
  strandsWithSkills().forEach(function(str){
    const list = skillsOfStrand(str.id);
    const open = list.filter(function(s){ return isUnlocked(state, s) && medalOf(state, s.id) < 3; });
    if(open.length){
      // earliest by order with the lowest medal
      open.sort(function(a, b){ return (medalOf(state, a.id) - medalOf(state, b.id)) || (a.order - b.order); });
      cand.push({ strand: str.id, skill: open[0], progress: strandProgress(state, str.id) });
    }
  });
  if(!cand.length) return null;
  if(state.focus){ const f = cand.filter(function(c){ return c.strand === state.focus; })[0]; if(f) return { skill: f.skill, step: nextStepFor(state, f.skill) }; }
  // weakest strand, but prefer one she has not touched today
  const today = todayStr();
  cand.sort(function(a, b){
    const ta = state.sessionLog.some(function(l){ return l.date === today && l.strand === a.strand; }) ? 1 : 0;
    const tb = state.sessionLog.some(function(l){ return l.date === today && l.strand === b.strand; }) ? 1 : 0;
    return (ta - tb) || (a.progress - b.progress);
  });
  return { skill: cand[0].skill, step: nextStepFor(state, cand[0].skill) };
}

/* ---------- sessions ---------- */
const SESSION_LEN = { guided: 4, practice: 6, challenge: 5, testout: 3 };
function buildItems(state, kind, skillId){
  const items = [];
  if(kind === 'review'){
    dueSkills(state).slice(0, 4).forEach(function(s){ const m = medalOf(state, s.id); items.push({ skillId: s.id, tier: m >= 3 ? 3 : 2 }); });
    return items;
  }
  const tier = { guided: 1, practice: 2, challenge: 3, testout: 2 }[kind];
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
  const n = credits.length; const sum = credits.reduce(function(a, b){ return a + b; }, 0); const acc = n ? sum / n : 0;
  const before = { medal: st.medal, box: st.box, wobbly: st.wobbly };
  st.seen += n; st.correct += credits.filter(function(c){ return c > 0; }).length; st.credit += sum; st.last = today;
  const bump = function(){ st.box = Math.min(6, st.box + 1); };
  if(kind === 'guided'){ if(acc >= 0.7){ st.medal = Math.max(st.medal, 1); st.box = Math.max(st.box, 1); } }
  else if(kind === 'practice'){ if(acc >= 0.8 && st.medal >= 1){ st.medal = Math.max(st.medal, 2); bump(); } else if(acc >= 0.7 && st.medal === 0){ st.medal = 1; st.box = Math.max(st.box, 1); } }
  else if(kind === 'challenge'){ if(acc >= 0.8 && st.medal >= 2){ st.medal = 3; bump(); } else if(acc >= 0.8 && st.medal === 1){ st.medal = 2; bump(); } }
  else if(kind === 'testout'){ if(acc >= 0.99){ st.medal = Math.max(st.medal, 1); st.box = Math.max(st.box, 1); st.placed = true; } }
  else if(kind === 'review'){ if(acc >= 0.8){ bump(); st.wobbly = false; } else if(acc < 0.5){ st.box = Math.max(0, st.box - 1); st.wobbly = true; } }
  if(kind !== 'review' && acc >= 0.8) st.wobbly = false;
  if(kind !== 'review' && acc < 0.5 && st.medal >= 1) st.wobbly = true;
  // schedule next review
  if(st.medal >= 1) st.due = addDays(today, REVIEW_DAYS[Math.min(st.box, REVIEW_DAYS.length - 1)] || 1);
  return { before: before, after: { medal: st.medal, box: st.box, wobbly: st.wobbly }, medalUp: st.medal > before.medal, wobblyCleared: before.wobbly && !st.wobbly, acc: acc };
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
  if(state.daily.date !== today) state.daily = { date: today, warmup: false, learn: false, boss: false, claimed: false };
  return state.daily;
}

/* ---------- placement ("Explorer's Quest") ---------- */
function placementOrder(){ return strandsWithSkills().map(function(s){ return s.id; }); }
function placementNextItem(state){
  const P = state.placement; const order = placementOrder();
  while(P.strandIdx < order.length){
    const list = skillsOfStrand(order[P.strandIdx]);
    // the next unasked skill of this strand
    if(P.asked < list.length && P.misses < 2 && P.asked < 5) return { strand: order[P.strandIdx], skill: list[P.asked] };
    P.strandIdx++; P.asked = 0; P.misses = 0;
  }
  return null;
}
function placementRecord(state, skillId, credit){
  const P = state.placement; P.asked++; P.results[skillId] = credit;
  if(credit >= 1){ const st = skillState(state, skillId); st.medal = Math.max(st.medal, 1); st.box = Math.max(st.box, 1); st.placed = true; st.due = addDays(todayStr(), 1); P.misses = 0; }
  else { P.misses++; }
}
function placementDone(state){ return placementNextItem(state) === null; }
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

/* ---------- stickers (endless: creature × accessory × background × rarity) ---------- */
const CREATURES = ['🦄', '🐶', '🐱', '🐰', '🦊', '🐻', '🐼', '🐨', '🐯', '🦁', '🐮', '🐷', '🐸', '🐵', '🐧', '🦉', '🦋', '🐢', '🐙', '🐬', '🐳', '🦖', '🦕', '🐝', '🐞', '🦩', '🦜', '🐘', '🦒', '🐹', '🐲', '🦔'];
const ACCESSORIES = ['', '👑', '🎩', '🕶️', '🎀', '⭐', '🌈', '💎', '🎈', '🪄', '🌸', '🎧', '🧢', '🍀'];
const STICKER_BGS = [['#FFD1DC', '#FFB3C7'], ['#C7E9FF', '#9AD0FF'], ['#D4F5D0', '#A8E6A3'], ['#FFF1B8', '#FFE27A'], ['#E6D4FF', '#C9A8FF'], ['#FFD9B3', '#FFB87A'], ['#C8F7F0', '#8EE9DB'], ['#FFC9C9', '#FF9E9E'], ['#D9E2FF', '#B5C6FF'], ['#F5D0FE', '#E9A2FB'], ['#E0F7B5', '#C3EA7A'], ['#FFE5EC', '#FFC2D1']];
const RARITIES = ['common', 'rare', 'epic', 'legendary'];
function rollRarity(){ const r = rng(); return r < 0.62 ? 'common' : (r < 0.88 ? 'rare' : (r < 0.98 ? 'epic' : 'legendary')); }
function rollSticker(owned){
  let s = null;
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

if(typeof module !== 'undefined') module.exports = { STRANDS, THEMES, strandMeta, PRAISE, ENCOURAGE, PACK_COST, REVIEW_DAYS, defaultState, mergeState, migrateV3, loadState, skillState, skillsOfStrand, strandsWithSkills, isUnlocked, medalOf, strandProgress, totalMedals, xpForLevel, levelFromXp, levelTitle, dueSkills, nextStepFor, recommend, buildItems, questionCredit, sessionStars, applySkillResult, recordError, topErrors, updateStreak, addXp, ensureDaily, placementNextItem, placementRecord, placementDone, placementSummary, openPack, rollSticker, checkBadges, todayStr, addDays, daysBetween, STICKER_BGS, CREATURES, ACCESSORIES, BADGES, STATE_KEY, V3_KEY };
