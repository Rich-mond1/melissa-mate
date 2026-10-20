/* =====================================================================
   MATEMAGICS v4 — UI part 1: helpers, onboarding, hub, map, skill page, lesson
   ===================================================================== */
let S = defaultState();
let scr = { name: 'boot', p: {} };
let SESS = null;
let MISSION = null;   // the 25-minute mission in progress (memory only: closing the app ends it)
const $app = function(){ return document.getElementById('app'); };
const esc = function(s){ return String(s).replace(/[&<>"']/g, function(c){ return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); };

let SAVE_FAILED = false;   // warn once per failure streak, not on every tap
function save(){
  try { localStorage.setItem(STATE_KEY, JSON.stringify(S)); SAVE_FAILED = false; }
  catch(e){ if(!SAVE_FAILED){ SAVE_FAILED = true; try { toast('⚠️ Progress can’t be saved on this device. Ask a grown-up!'); } catch(e2){} } }
}
function load(){ try { S = loadState(localStorage); } catch(e){ S = defaultState(); } ensureDaily(S); }

function applyTheme(){
  const t = THEMES[S.theme] || THEMES.unicorn; const r = document.documentElement.style;
  r.setProperty('--bg1', t.c1); r.setProperty('--bg2', t.c2);
}
function mascot(){ return friendImg(); }
function friendImg(){ const k = PETS[S.friend] ? S.friend : 'ginger'; return '<img class="pet" alt="' + esc(PET_NAMES[k]) + '" src="' + PETS[k][0] + '">'; }
function friendSays(txt){ return '<div class="center white"><div class="mascot pop big">' + friendImg() + '</div><div class="bubble">' + txt + '</div></div>'; }
function speak(html, manual){
  if(!manual || !window.speechSynthesis) return;   // voice only when the child taps 🔊 (auto-speech can hang iOS Safari)
  try { if(speechSynthesis.speaking || speechSynthesis.pending) speechSynthesis.cancel(); const u = new SpeechSynthesisUtterance(stripTags(html).replace(/\s+/g, ' ')); u.lang = 'en-GB'; u.rate = 0.92; speechSynthesis.speak(u); } catch(e){}
}
function stopSpeak(){ try { if(window.speechSynthesis && (speechSynthesis.speaking || speechSynthesis.pending)) speechSynthesis.cancel(); } catch(e){} }
function toast(msg){
  const t = document.createElement('div'); t.className = 'toast'; t.textContent = msg; document.body.appendChild(t);
  setTimeout(function(){ t.remove(); }, 2600);
}
function confetti(n){
  const cols = ['#F2C94C', '#EB5757', '#4F8FE8', '#27AE60', '#BB6BD9', '#F2994A'];
  for(let i = 0; i < (n || 40); i++){
    const c = document.createElement('i'); c.className = 'confetti';
    c.style.left = Math.random() * 100 + 'vw'; c.style.background = cols[i % cols.length];
    c.style.animationDelay = Math.random() * 0.6 + 's'; c.style.transform = 'rotate(' + Math.random() * 360 + 'deg)';
    document.body.appendChild(c); setTimeout(function(){ c.remove(); }, 3200);
  }
}
let LAST_GO = 0;
function go(name, p){ LAST_GO = Date.now(); if(name.indexOf(':') > -1){ const a = name.split(':'); name = a[0]; p = { id: a[1] }; } stopSpeak(); scr = { name: name, p: p || {} }; render(); }
let LAST_Q = null;   // re-drawing the SAME question (pick / hint / I-find-this-tricky) must not jump back to the top
function R(html){ const a = $app(); const keep = scr.name === 'question' && typeof SESS !== 'undefined' && SESS && SESS.q && SESS.q === LAST_Q; const st = a.scrollTop;
  a.innerHTML = '<div class="wrap">' + html + '</div>'; a.scrollTop = keep ? st : 0; LAST_Q = (scr.name === 'question' && SESS) ? SESS.q : null; }
const NICKS = ['Meli', 'Bebei', 'Titi', 'Titus']; let NICK_I = 0;
function nick(){ const n = NICKS[NICK_I % NICKS.length]; NICK_I++; return n; }   // Melissa's nicknames, rotating as she goes
function topbar(title, back){
  return '<div class="topbar"><button class="icon-btn" data-act="go" data-to="' + (back || 'hub') + '" aria-label="Back">←</button><h2 class="white grow center">' + title + '</h2><span class="pill">⭐ ' + S.starBalance + '</span></div>';
}
function medalsHTML(n){ return '<span class="medals">' + [1, 2, 3].map(function(i){ return '<span class="medal' + (n >= i ? ' on' : '') + '">' + ['🥉', '🥈', '🥇'][i - 1] + '</span>'; }).join('') + '</span>'; }
const STEP_LABEL = { learn: 'Learn it', guided: 'Guided', practice: 'Practice', challenge: 'Challenge', review: 'Review', testout: 'Quick check', think: 'Think hard' };
const KIND_ES = { guided: 'Guiada', practice: 'Práctica', challenge: 'Reto', review: 'Repaso', testout: 'Prueba', placement: 'Diagnóstico', legacy: 'Antigua' };

/* ---------------- sticker drawing ---------------- */
function stickerHTML(s, big){
  const bg = STICKER_BGS[s.bg % STICKER_BGS.length] || STICKER_BGS[0];
  const face = (s.pet && PETS[s.pet]) ? '<img class="pet" alt="' + esc(PET_NAMES[s.pet]) + '" src="' + (PETS[s.pet][s.v] || PETS[s.pet][0]) + '">' : esc(s.base);
  return '<div class="sticker ' + (RARITIES.indexOf(s.rarity) > -1 ? s.rarity : 'common') + (big ? ' big' : '') + '" style="background:linear-gradient(145deg,' + bg[0] + ',' + bg[1] + ')">' + face + (s.acc ? '<span class="acc">' + esc(s.acc) + '</span>' : '') + (s.n > 1 ? '<span class="cnt">×' + (Number(s.n) | 0) + '</span>' : '') + '</div>';
}

/* ---------------- render dispatcher ---------------- */
function render(){
  applyTheme();
  const f = SCREENS[scr.name]; if(!f){ go('hub'); return; }
  f(scr.p);
}
const SCREENS = {};
const ACT = {};

/* ---------------- onboarding ---------------- */
SCREENS.welcome = function(){
  R('<div class="center white"><div class="mascot pop big" data-act="cycleFriend">' + friendImg() + '</div><h1>Hi ' + nick() + '!</h1><p class="subtitle">Welcome to <b>Matemagics</b> — your own maths adventure. You choose the world. You collect the magic.</p></div>' +
    '<div class="gap2"></div><div class="card"><h3>1. Pick your world</h3><div class="chips">' +
    Object.keys(THEMES).map(function(k){ return '<button class="chip' + (S.theme === k ? ' picked' : '') + '" data-act="theme" data-v="' + k + '">' + THEMES[k].emoji + ' ' + THEMES[k].label + '</button>'; }).join('') + '</div>' +
    '<h3>2. I like…</h3><div class="chips">' + LIKES.map(function(l){ return '<button class="chip' + (S.prefs.likes.indexOf(l.id) > -1 ? ' picked' : '') + '" data-act="pref" data-k="likes" data-v="' + l.id + '">' + l.emoji + ' ' + l.label + '</button>'; }).join('') + '</div>' +
    '<h3>3. My maths friend</h3><div class="chips">' + PET_IDS.map(function(k){ return '<button class="chip' + (S.friend === k ? ' picked' : '') + '" data-act="friend" data-v="' + k + '">' + PET_NAMES[k] + '</button>'; }).join('') + '</div>' +
    '<h3>4. I find these tricky</h3><div class="chips">' + DISLIKES.map(function(l){ return '<button class="chip' + (S.prefs.dislikes.indexOf(l.id) > -1 ? ' picked' : '') + '" data-act="pref" data-k="dislikes" data-v="' + l.id + '">' + l.emoji + ' ' + l.label + '</button>'; }).join('') + '</div>' +
    '<p class="muted">Nothing here is a test. It just helps your maths friend plan fun things for you.</p></div>' +
    '<div class="gap"></div><button class="btn block" data-act="startPlacement">Let’s go! 🚀</button>');
};
ACT.friend = function(d){ if(PETS[d.v]) S.friend = d.v; save(); render(); };
ACT.cycleFriend = function(){ const i = PET_IDS.indexOf(S.friend); S.friend = PET_IDS[(i + 1) % PET_IDS.length]; save(); render(); toast('Hi! I am ' + PET_NAMES[S.friend] + ' 💜'); };
ACT.theme = function(d){ S.theme = d.v; save(); applyTheme(); render(); };
ACT.pref = function(d){ const a = S.prefs[d.k]; const i = a.indexOf(d.v); if(i > -1) a.splice(i, 1); else a.push(d.v); save(); render(); };
ACT.startPlacement = function(){ S.onboardingDone = true; save(); go('placementIntro'); };

SCREENS.placementIntro = function(){
  const P = S.placement;
  R('<div class="center white"><div class="mascot pop">🗺️</div><h1>Explorer’s Quest</h1></div><div class="gap"></div>' +
    '<div class="card center"><p class="qprompt">I want to find out which parts of maths you already know, so I never bore you — and never lose you.</p><div class="gap"></div>' +
    '<p>A few questions in every land. <b>Not sure? Tap “I don’t know yet”</b> — that is a great answer. It just means I will teach you that part.</p><div class="gap"></div>' +
    '<button class="btn block" data-act="placementGo">' + (P.started ? 'Continue the quest' : 'Start the quest') + '</button></div>' +
    (P.started ? '<div class="gap"></div><button class="btn small block" data-act="go" data-to="hub" style="background:#ffffff40;color:#fff">Later</button>' : ''));
};

/* ---------------- hub ---------------- */
function liveStreak(){ return (S.streak.lastPlayDate && daysBetween(S.streak.lastPlayDate, todayStr()) <= 1) ? S.streak.count : 0; }
function dailyDone(){ const d = S.daily; return (d.warmup ? 1 : 0) + (d.learn ? 1 : 0) + (d.boss ? 1 : 0); }
SCREENS.hub = function(){
  if(!S.placement.done && !placementDone(S)){ /* quest unfinished */ }
  ensureDaily(S);
  const lvl = S.level, a = xpForLevel(lvl), b = xpForLevel(lvl + 1), pct = Math.round((S.xp - a) / (b - a) * 100);
  const rec = recommend(S), due = dueSkills(S);
  const goal = S.goalReward ? S.rewards.filter(function(r){ return r.id === S.goalReward; })[0] : null;
  const d = S.daily;
  let h = '<div class="hero"><div class="mascot" data-act="cycleFriend">' + mascot() + '</div><div class="grow"><b style="font-size:20px">' + nick() + ' · Lv ' + lvl + '</b><div style="font-size:13px;font-weight:800;opacity:.9">' + levelTitle(lvl) + '</div><div class="xpbar" style="margin-top:6px"><i style="width:' + pct + '%"></i></div></div>' +
    '<div style="text-align:right;font-weight:900">⭐ ' + S.starBalance + '<br>🔥 ' + liveStreak() + '</div></div>';
  if(!placementDone(S)) h += '<div class="card quest" style="margin-top:12px"><h3>🗺️ Finish your Explorer’s Quest</h3><p class="muted">So I can build your own map.</p><div class="gap"></div><button class="btn block" data-act="placementGo">Continue quest</button></div>';
  else {
    h += '<div class="gap"></div>';
    if(MISSION) h += '<button class="btn block" data-act="missionNext" style="font-size:20px">🚀 Continue today’s mission</button><div class="gap"></div><button class="btn small block" style="background:#ffffffcc;color:var(--ink)" data-act="missionStop">End mission</button><div class="gap"></div>';
    else if(rec) h += '<button class="btn block" data-act="mission" style="font-size:20px">🚀 Today’s mission · about 25 min</button><div class="gap"></div>';
    if(rec) h += '<button class="btn block' + (MISSION ? ' small' : '') + '" data-act="playRec"' + (MISSION ? ' style="background:#ffffffcc;color:var(--ink)"' : ' style="font-size:20px;background:#ffffffcc;color:var(--ink)"') + '>▶ Quick round — ' + (rec.step === 'learn' ? 'Learn' : STEP_LABEL[rec.step]) + ': ' + esc(rec.skill.name) + (rec.backoffFrom ? ' (let’s strengthen this first)' : '') + '</button>';
    if(due.length) h += '<div class="gap"></div><button class="btn good block" data-act="startReview">🧠 Brain boost — ' + due.length + ' to remember</button>';
    h += '<div class="gap"></div><div class="card quest"><h3>📅 Today’s quest <span class="pill">' + dailyDone() + '/3</span></h3>' +
      '<div class="task' + (d.warmup ? ' done' : '') + '"><span class="chk">' + (d.warmup ? '✓' : '') + '</span>Play one round</div>' +
      '<div class="task' + (d.learn ? ' done' : '') + '"><span class="chk">' + (d.learn ? '✓' : '') + '</span>Learn something new</div>' +
      '<div class="task' + (d.boss ? ' done' : '') + '"><span class="chk">' + (d.boss ? '✓' : '') + '</span>Play three rounds</div>' +
      (dailyDone() === 3 && !d.claimed ? '<div class="gap"></div><button class="btn good block" data-act="claimDaily">🎁 Claim daily gift</button>' : '') + '</div>';
  }
  if(goal){ const need = Math.max(0, goal.cost - S.starBalance); h += '<div class="goal"><span style="font-size:30px">' + esc(goal.emoji) + '</span><div class="grow"><b>My goal: ' + esc(goal.title) + '</b><div style="font-size:13px">' + (need ? need + ' more ⭐' : 'You can get it now! 🎉') + '</div></div></div>'; }
  h += '<h2 class="white" style="margin-top:18px">My maths world</h2>';
  strandsWithSkills().forEach(function(str){
    const p = strandProgress(S, str.id), n = skillsOfStrand(str.id).length;
    h += '<div class="region" data-act="strand" data-id="' + str.id + '"><div class="em" style="background:' + str.color + '22">' + str.icon + '</div><div class="grow"><b>' + str.name + '</b><div class="sub">' + n + ' skills</div></div><div class="ring" style="--p:' + p + '"><span>' + p + '%</span></div></div>';
  });
  h += '<div class="menu-grid"><button data-act="go" data-to="stickers"><span class="em">🌈</span>Stickers' + (S.packs ? ' ✨' + S.packs : '') + '</button><button data-act="go" data-to="rewards"><span class="em">🎁</span>Prizes</button><button data-act="go" data-to="trophies"><span class="em">🏆</span>Trophies</button><button data-act="go" data-to="parentPin"><span class="em">👪</span>Grown-ups' + (parentMetrics(S, todayStr()).backup.overdue ? ' <span title="backup" style="color:#E8A33D">●</span>' : '') + '</button></div>';
  R(h);
};
ACT.go = function(d){ go(d.to); };
ACT.strand = function(d){ go('strand', { id: d.id }); };
ACT.playRec = function(){
  const r = recommend(S); if(!r) return toast(goldWaiting(S).length ? 'Gold is waiting — come back tomorrow for a Brain boost! 🥇' : 'You finished everything! 🎉');
  openSkillStep(r.skill, r.step);
};
function openSkillStep(sk, step){
  if(step === 'learn') return go('lesson', { id: sk.id, i: 0 });
  startSession(step, sk.id);
}
ACT.claimDaily = function(){
  ensureDaily(S);
  if(S.daily.claimed || dailyDone() < 3) return;
  S.daily.claimed = true; S.starBalance += 10; S.totalStars += 10; S.packs += 1; save(); confetti(); toast('+10 ⭐ and a sticker pack!'); render();
};

/* ---------------- map: strand -> skills ---------------- */
SCREENS.strand = function(p){
  const str = strandMeta(p.id); const list = skillsOfStrand(p.id);
  let h = topbar(str.icon + ' ' + str.name) + '<p class="white center" style="margin-bottom:6px">' + str.es + '</p>';
  list.forEach(function(sk){
    const st = skillState(S, sk.id), un = isUnlocked(S, sk), m = st.medal;
    const dueNow = st.due && st.due <= todayStr() && m >= 1;
    h += '<div class="node' + (un ? '' : ' locked') + '" data-act="skill" data-id="' + sk.id + '"><div class="em">' + (un ? sk.emoji : '🔒') + '</div><div class="grow"><b>' + esc(sk.name) + (sk.year === 4 ? '<span class="tag y4">Year 4 ⭐</span>' : '') + (st.wobbly ? '<span class="tag wobbly">wobbly</span>' : (dueNow ? '<span class="tag wobbly">review</span>' : '')) + '</b><div class="sub">' + (un ? (m === 3 ? 'Gold! Mastered' : (m === 0 ? (st.lessonDone ? 'Ready to practise' : 'New!') : 'Keep going')) : 'Learn the first steps to open this') + '</div></div>' + medalsHTML(m) + '</div>';
  });
  R(h);
};
ACT.skill = function(d){ go('skill', { id: d.id }); };

SCREENS.skill = function(p){
  const sk = skillById(p.id); const st = skillState(S, sk.id); const un = isUnlocked(S, sk); const str = strandMeta(sk.strand);
  const nxt = nextStepFor(S, sk);
  let h = topbar(sk.emoji + ' ' + esc(sk.name), 'strand:' + sk.strand);
  h += '<div class="card center"><div>' + medalsHTML(st.medal) + '</div><p class="muted" style="margin-top:6px">' + (st.seen ? 'You answered ' + st.seen + ' questions here' + (st.seen ? ' — ' + Math.round(st.credit / st.seen * 100) + '% first-try power' : '') : 'Brand new for you!') + '</p></div>';
  if(!un){
    const miss = sk.prereq.filter(function(x){ return !(S.skills[x] && S.skills[x].medal >= 1); }).map(function(x){ const s2 = skillById(x); return s2 ? s2.name : x; });
    h += '<div class="card"><p>🔒 First learn: <b>' + miss.map(esc).join(', ') + '</b></p><div class="gap"></div><button class="btn block" data-act="testout" data-id="' + sk.id + '">I already know this! Try the quick test</button></div>';
    return R(h);
  }
  h += '<div class="gap"></div>';
  h += '<button class="btn block' + (nxt === 'learn' ? '' : ' small') + '" data-act="lesson" data-id="' + sk.id + '">📖 ' + (st.lessonDone ? 'Watch the lesson again' : 'Learn it first') + '</button><div class="gap"></div>';
  if(S.tricks.indexOf(sk.id) > -1) h += '<button class="btn block good" data-act="trick" data-id="' + sk.id + '">🎩 My magic trick</button><div class="gap"></div>';
  h += ['guided', 'practice', 'challenge'].map(function(k){ return '<button class="btn block' + (nxt === k ? '' : ' small') + '" style="margin-bottom:8px' + (nxt === k ? '' : ';background:#ffffffcc;color:var(--ink)') + '" data-act="startSess" data-k="' + k + '" data-id="' + sk.id + '">' + { guided: '🌱 Guided (easy start)', practice: '🏃 Practice', challenge: '⚡ Challenge' }[k] + '</button>'; }).join('');
  R(h);
};
ACT.lesson = function(d){ if(timeIsUp()) return go('timeup'); go('lesson', { id: d.id, i: 0 }); };
ACT.startSess = function(d){ startSession(d.k, d.id); };
ACT.testout = function(d){ startSession('testout', d.id); };
ACT.trick = function(d){ go('trick', { id: d.id }); };

/* ---------------- lesson ---------------- */
SCREENS.lesson = function(p){
  const sk = skillById(p.id); const L = sk.lesson; const i = p.i; const st = L.steps[i]; const last = i === L.steps.length - 1;
  let h = '<div class="topbar"><button class="icon-btn" data-act="go" data-to="skill:' + sk.id + '">←</button><h2 class="white grow center">' + esc(L.title) + '</h2></div>' +
    '<div class="progress">' + L.steps.map(function(_, k){ return '<i class="' + (k < i ? 'ok' : (k === i ? 'cur' : '')) + '"></i>'; }).join('') + '</div>' +
    '<div class="card lesson-card">' + (st.vis ? '<div class="qvis">' + V.render(st.vis) + '</div>' : '') +
    '<div class="lesson-say">' + st.say + '</div><button class="speak" data-act="say">🔊</button>';
  if(st.quiz){
    h += '<div class="gap"></div><p class="qprompt">' + st.quiz.prompt + '</p><div class="opts">' + st.quiz.options.map(function(o, k){ return '<button class="opt" data-act="lquiz" data-k="' + k + '">' + o.label + '</button>'; }).join('') + '</div><div id="lfb"></div></div>';
    h += '<div class="gap"></div><button class="btn block" id="lnext" data-act="lnext" disabled>' + (last ? 'Finish ✨' : 'Next →') + '</button>';
  } else {
    h += '</div><div class="gap"></div><button class="btn block" data-act="lnext">' + (last ? 'Finish ✨' : 'Next →') + '</button>';
  }
  R(h); speak(st.say);
};
ACT.say = function(){ const sk = skillById(scr.p.id); speak(sk.lesson.steps[scr.p.i].say, true); };
ACT.lquiz = function(d, el){
  const sk = skillById(scr.p.id); const q = sk.lesson.steps[scr.p.i].quiz; const o = q.options[+d.k];
  const fb = document.getElementById('lfb'); if(!fb) return;
  if(o.ok){
    document.querySelectorAll('.opt').forEach(function(b){ b.disabled = true; }); el.classList.add('correct');
    fb.innerHTML = '<div class="feedback ok">✅ ' + q.right + '</div>'; document.getElementById('lnext').disabled = false;
  } else {
    el.disabled = true; el.style.opacity = .4; fb.innerHTML = '<div class="feedback">💡 ' + q.wrong + '</div>';
  }
};
ACT.lnext = function(){
  ensureDaily(S);
  const sk = skillById(scr.p.id); const i = scr.p.i;
  if(i < sk.lesson.steps.length - 1) return go('lesson', { id: sk.id, i: i + 1 });
  const st = skillState(S, sk.id); const first = !st.lessonDone; st.lessonDone = true;
  if(first){ S.daily.learn = true; S.starBalance += 3; S.totalStars += 3; addXp(S, 10); }
  if(S.tricks.indexOf(sk.id) === -1) S.tricks.push(sk.id);
  checkBadges(S); save(); go('trick', { id: sk.id, after: first });
};
SCREENS.trick = function(p){
  const sk = skillById(p.id); const T = sk.trick;
  R('<div class="center white"><div class="mascot pop">🎩</div><h2>' + (p.after ? 'You unlocked a magic trick!' : 'Magic trick') + '</h2></div><div class="gap"></div>' +
    '<div class="card trickcard"><h3>' + esc(T.title) + '</h3>' + (T.vis ? '<div class="qvis">' + V.render(T.vis) + '</div>' : '') + '<div class="lesson-say">' + T.say + '</div><div class="gap"></div><div class="explain">' + T.example + '</div></div><div class="gap"></div>' +
    (MISSION && MISSION.cur && MISSION.cur.kind === 'learn' && MISSION.cur.skillId === sk.id ? '<button class="btn block" data-act="missionLearnDone">Continue the mission 🚀</button><div class="gap"></div>' : (p.after ? '<button class="btn block" data-act="startSess" data-k="guided" data-id="' + sk.id + '">Try it now! 🌱</button><div class="gap"></div>' : '')) +
    '<button class="btn block small" style="background:#ffffffcc;color:var(--ink)" data-act="go" data-to="skill:' + sk.id + '">Back to ' + esc(sk.name) + '</button>');
  speak(T.title + '. ' + T.say);
};
