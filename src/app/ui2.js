/* =====================================================================
   MATEMAGICS v4 — UI part 2: sessions, placement, results, stickers, prizes,
   trophies, grown-ups area, boot
   ===================================================================== */

/* ---------------- timer ---------------- */
function usedToday(){ const u = S.timer.used; return (u && u.date === todayStr()) ? u.sec : 0; }
function addUsed(sec){ const t = todayStr(); if(!S.timer.used || S.timer.used.date !== t) S.timer.used = { date: t, sec: 0 }; S.timer.used.sec += sec; }
function timeIsUp(){ return S.timer.mode === 'limit' && usedToday() >= S.timer.minutes * 60; }

/* ---------------- session control ---------------- */
function startSession(kind, skillId){
  if(timeIsUp()) return go('timeup');
  const items = buildItems(S, kind, skillId);
  if(!items.length){ toast('Nothing to review right now — great memory! 🧠'); return go('hub'); }
  SESS = { kind: kind, skillId: skillId || null, items: items, idx: 0, credits: [], by: {}, seen: {}, firstSkill: skillId || items[0].skillId };
  nextQuestion();
}
ACT.startReview = function(){ startSession('review', null); };
ACT.placementGo = function(){
  if(placementDone(S)) return finishPlacement();
  S.placement.started = true; save();
  SESS = { kind: 'placement', items: [], idx: 0, credits: [], by: {}, seen: {} };
  nextQuestion();
};
function genQ(skillId, tier){
  const sk = skillById(skillId); let q = null;
  for(let i = 0; i < 8; i++){
    q = makeQuestion(sk, tier);
    if(!q) continue;
    const sig = stripTags(q.prompt) + '|' + q.correctKey;
    if(!SESS.seen[sig]){ SESS.seen[sig] = 1; return q; }
    q = null;
  }
  return null;
}
function nextQuestion(){
  if(SESS.kind === 'placement'){
    const it = placementNextItem(S);
    if(!it) return finishPlacement();
    SESS.cur = it; SESS.q = genQ(it.skill.id, 2) || genQ(it.skill.id, 1);
    if(!SESS.q){ placementRecord(S, it.skill.id, 0); return nextQuestion(); }
    return startQ(it.skill.id, 2);
  }
  if(SESS.idx >= SESS.items.length) return finishSession();
  if(SESS.idx > 0 && timeIsUp()){ SESS.items.length = SESS.idx; return finishSession(); }
  const it = SESS.items[SESS.idx]; SESS.q = genQ(it.skillId, it.tier);
  if(!SESS.q){ SESS.items.splice(SESS.idx, 1); return nextQuestion(); }
  startQ(it.skillId, it.tier);
}
function startQ(skillId, tier){
  const q = SESS.q;
  SESS.skillId_ = skillId; SESS.tries = 0; SESS.hint = false; SESS.phase = 'ask'; SESS.chosen = []; SESS.fb = null;
  SESS.numStr = ''; SESS.sel = 0; SESS.t0 = Date.now();
  if(q.type === 'setclock'){ SESS.clk = { h: 12, m: 0 }; }
  if(q.type === 'order'){ SESS.pool = shuffle(q.model.items.slice()); if(SESS.pool.map(function(i){ return i.key; }).join() === q.model.items.map(function(i){ return i.key; }).join()) SESS.pool.reverse(); SESS.picked = []; }
  go('question');
  speak(q.prompt);
}

/* ---------------- question screen ---------------- */
function sessionDots(){
  if(SESS.kind === 'placement') return '<div class="progress"><i class="cur"></i></div>';
  return '<div class="progress">' + SESS.items.map(function(_, k){
    let c = ''; if(k < SESS.credits.length) c = SESS.credits[k] >= 1 ? 'ok' : (SESS.credits[k] > 0 ? 'half' : 'bad'); else if(k === SESS.idx) c = 'cur';
    return '<i class="' + c + '"></i>'; }).join('') + '</div>';
}
SCREENS.question = function(){
  const q = SESS.q; const sk = skillById(SESS.skillId_); const placing = SESS.kind === 'placement'; const fb = SESS.phase === 'fb';
  let h = '<div class="topbar"><button class="icon-btn" data-act="quit">✕</button><h2 class="white grow center">' +
    (placing ? '🗺️ ' + esc(strandMeta(sk.strand).name) : esc(sk.emoji + ' ' + (SESS.kind === 'review' ? 'Brain boost' : sk.name))) + '</h2><span class="pill nobtn">' + (placing ? '#' + (S.placement.asked + 1) : (SESS.idx + 1) + '/' + SESS.items.length) + '</span></div>' + sessionDots();
  h += '<div class="card qcard">' + (q.visual ? '<div class="qvis">' + q.visual + '</div>' : '') + '<div class="qprompt">' + q.prompt + '</div><button class="speak" data-act="sayq">🔊</button>';
  const lock = fb;
  if(q.type === 'mcq'){
    h += '<div class="opts' + (q.optionsAreVisual ? ' vis' : '') + '">' + q.options.map(function(o, k){
      const isChosen = SESS.chosen.indexOf(o.key) > -1; let cls = 'opt' + (q.optionsAreVisual ? ' vis' : '');
      if(fb && o.key === q.correctKey) cls += ' correct'; else if(isChosen) cls += ' wrong';
      return '<button class="' + cls + '" data-act="pick" data-k="' + k + '"' + (lock || isChosen ? ' disabled' : '') + '>' + o.label + '</button>'; }).join('') + '</div>';
  } else if(q.type === 'num'){
    h += '<div class="numdisplay">' + (SESS.numStr === '' ? '<span style="opacity:.3">?</span>' : esc(SESS.numStr)) + (q.unit ? '<span class="unit"> ' + esc(q.unit) + '</span>' : '') + '</div>' +
      '<div class="keypad">' + ['1', '2', '3', '4', '5', '6', '7', '8', '9', '.', '0', '⌫'].map(function(k){ return '<button data-act="key" data-k="' + k + '"' + (lock ? ' disabled' : '') + '>' + k + '</button>'; }).join('') + '</div>' +
      '<div class="gap"></div><button class="btn block" data-act="check"' + (lock || SESS.numStr === '' ? ' disabled' : '') + '>Check ✓</button>';
  } else if(q.type === 'shade'){
    const m = q.model; let segs = '';
    for(let i = 0; i < m.den; i++) segs += '<button class="seg' + (i < SESS.sel ? ' on' : '') + '" data-act="seg" data-k="' + i + '"' + (lock ? ' disabled' : '') + ' aria-label="part ' + (i + 1) + '"></button>';
    h += '<div class="seglist">' + segs + '</div><div class="gap"></div><button class="btn block" data-act="check"' + (lock || SESS.sel === 0 ? ' disabled' : '') + '>Check ✓</button>';
  } else if(q.type === 'setclock'){
    h += '<div class="qvis">' + V.clock(SESS.clk.h, SESS.clk.m, { roman: q.model.roman }) + '</div>' +
      '<div class="clockctl"><button class="btn small" data-act="clk" data-d="h-"' + (lock ? ' disabled' : '') + '>Hour −</button><button class="btn small" data-act="clk" data-d="h+"' + (lock ? ' disabled' : '') + '>Hour +</button>' +
      '<button class="btn small" data-act="clk" data-d="m-"' + (lock ? ' disabled' : '') + '>Minutes −</button><button class="btn small" data-act="clk" data-d="m+"' + (lock ? ' disabled' : '') + '>Minutes +</button></div>' +
      '<div class="gap"></div><button class="btn block" data-act="check"' + (lock ? ' disabled' : '') + '>Check ✓</button>';
  } else if(q.type === 'order'){
    const n = q.model.items.length; let slots = '';
    for(let i = 0; i < n; i++) slots += '<div class="slot' + (SESS.picked[i] ? ' filled' : '') + '">' + (SESS.picked[i] ? SESS.picked[i].label : '') + '</div>';
    h += '<div class="slots">' + slots + '</div><div class="chips">' + SESS.pool.map(function(it){
      const used = SESS.picked.some(function(p){ return p.key === it.key; });
      return '<button class="chip' + (used ? ' used' : '') + '" data-act="ochip" data-key="' + esc(it.key) + '"' + (used || lock ? ' disabled' : '') + '>' + it.label + '</button>'; }).join('') + '</div>' +
      '<div class="row"><button class="btn small" style="background:#e9ebf7;color:var(--ink)" data-act="oundo"' + (lock ? ' disabled' : '') + '>↩ Undo</button><button class="btn grow" data-act="check"' + (lock || SESS.picked.length < n ? ' disabled' : '') + '>Check ✓</button></div>';
  }
  if(SESS.hint && !fb) h += '<div class="hint-text">💡 ' + q.hint + '</div>';
  if(SESS.fb && !fb) h += '<div class="feedback">' + SESS.fb + '</div>';
  if(fb) h += SESS.fbHTML;
  h += '</div>';
  if(fb) h += '<div class="gap"></div><button class="btn block" data-act="qnext">' + (placing ? 'Next →' : (SESS.idx + 1 >= SESS.items.length ? 'Finish ✨' : 'Next →')) + '</button>';
  else if(!placing && !SESS.hint) h += '<div class="gap"></div><button class="btn small block" style="background:#ffffff40;color:#fff" data-act="hint">💡 Give me a hint</button>';
  if(placing && !fb) h += '<div class="gap"></div><button class="btn small block" style="background:#ffffff40;color:#fff" data-act="idk">I don’t know yet</button>';
  R(h);
};
ACT.sayq = function(){ speak(SESS.q.prompt); };
ACT.quit = function(){
  if(SESS.kind === 'placement'){ save(); SESS = null; return go('hub'); }
  if(SESS.credits.length >= 1){ const st = sessionStars(SESS.credits); S.starBalance += st; S.totalStars += st; toast('Saved ' + st + ' ⭐ — finish the whole round to win medals!'); }
  save(); SESS = null; go('hub');
};
ACT.hint = function(){ SESS.hint = true; render(); };
ACT.pick = function(d){ const o = SESS.q.options[+d.k]; submit(o.key); };
ACT.key = function(d){
  if(SESS.phase !== 'ask') return;
  let s = SESS.numStr;
  if(d.k === '⌫') s = s.slice(0, -1); else if(d.k === '.'){ if(s.indexOf('.') === -1) s = (s === '' ? '0' : s) + '.'; } else if(s.length < 7) s += d.k;
  SESS.numStr = s; render();
};
ACT.seg = function(d){ const k = +d.k; SESS.sel = (SESS.sel === k + 1) ? k : k + 1; render(); };
ACT.clk = function(d){
  const st = SESS.q.model.step || 5, c = SESS.clk;
  if(d.d === 'h+') c.h = c.h % 12 + 1; else if(d.d === 'h-') c.h = c.h === 1 ? 12 : c.h - 1;
  else if(d.d === 'm+') c.m = (c.m + st) % 60; else if(d.d === 'm-') c.m = (c.m - st + 60) % 60;
  render();
};
ACT.ochip = function(d){ const it = SESS.pool.filter(function(i){ return i.key === d.key; })[0]; if(it && SESS.picked.indexOf(it) === -1) SESS.picked.push(it); render(); };
ACT.oundo = function(){ SESS.picked.pop(); render(); };
ACT.check = function(){
  const q = SESS.q; if(SESS.phase !== 'ask') return;
  if(q.type === 'num'){ const v = parseFloat(SESS.numStr); if(!isFinite(v)) return; submit(K.num(v)); }
  else if(q.type === 'shade') submit(K.num(SESS.sel));
  else if(q.type === 'setclock') submit(K.time(SESS.clk.h, SESS.clk.m));
  else if(q.type === 'order') submit('o:' + SESS.picked.map(function(i){ return i.key; }).join('|'));
};
ACT.idk = function(){ if(!SESS || SESS.phase !== 'ask') return; SESS.tries = 9; SESS.fbSkip = true; endQuestion(0, false, true); };

function submit(resp){
  if(SESS.phase !== 'ask') return;
  const q = SESS.q; const ok = resp === q.correctKey;
  if(ok) return endQuestion(questionCredit(true, SESS.tries, SESS.hint), true);
  const why = (q.wrongWhy && q.wrongWhy(resp)) || '';
  recordError(S, SESS.skillId_, why || 'Mixed up the answer');
  SESS.tries++;
  if(SESS.kind === 'placement' || SESS.tries >= 2) return endQuestion(0, false);
  SESS.chosen.push(resp);
  if(q.type === 'num') SESS.numStr = '';
  if(q.type === 'shade') SESS.sel = 0;
  if(q.type === 'order') SESS.picked = [];
  SESS.fb = '🤔 Not quite. ' + (why ? why + ' ' : '') + '<b>Try once more!</b>';
  render();
}
function endQuestion(credit, ok, skipped){
  const q = SESS.q; const sk = skillById(SESS.skillId_);
  addUsed(Math.min(90, Math.round((Date.now() - SESS.t0) / 1000)));
  SESS.credits.push(credit);
  (SESS.by[sk.id] = SESS.by[sk.id] || []).push(credit);
  SESS.phase = 'fb';
  if(SESS.kind === 'placement'){
    placementRecord(S, sk.id, credit >= 1 ? 1 : 0); save();
    SESS.fbHTML = '<div class="feedback ' + (ok ? 'ok' : '') + '">' + (skipped ? 'No problem — I will teach you this one. 🌱' : (ok ? 'Got it! ✅' : 'Thanks! I will help you with this one. 🌱')) + '</div>';
    if(skipped){ ACT.qnext(); return; } render(); return;
  }
  if(ok){
    const praise = (credit >= 1 ? pick(PRAISE).replace(/[.!]$/, '') : 'You worked it out') + ', ' + nick() + '!';
    SESS.fbHTML = '<div class="feedback ok">✅ ' + praise + '</div>';
  } else {
    SESS.fbHTML = '<div class="feedback">' + pick(ENCOURAGE).replace(/[.!]$/, '') + ', ' + nick() + '!</div>' + explainHTML(q);
  }
  render();
}
function explainHTML(q){
  const ans = q.type === 'mcq' ? q.options[q.correct].label : (q.type === 'num' ? q.answer + (q.unit ? ' ' + q.unit : '') : '');
  return (ans ? '<div class="explain"><div class="eh">The answer is <b>' + ans + '</b></div>' : '<div class="explain">') + q.explain + '</div>';
}
ACT.qnext = function(){
  if(!SESS || SESS.phase !== 'fb') return;
  SESS.phase = 'done';
  if(SESS.kind === 'placement') return nextQuestion();
  SESS.idx++; nextQuestion();
};

/* ---------------- placement finish ---------------- */
function finishPlacement(){
  S.placement.done = true; S.daily.warmup = false; save();
  const sum = placementSummary(S);
  go('placementDone', { known: sum.known.length, learn: sum.learn.length });
}
SCREENS.placementDone = function(p){
  R('<div class="center white"><div class="mascot pop big">' + friendImg() + '</div><h1>Quest complete!</h1></div><div class="gap"></div><div class="card center">' +
    '<p class="qprompt">You already know <b>' + p.known + '</b> skills! 🌟</p><p style="margin-top:8px">And I found <b>' + p.learn + '</b> new adventures to learn together.</p><div class="gap"></div>' +
    '<p class="muted">Your map is ready. Little by little we will fill it with gold medals.</p><div class="gap"></div><button class="btn block" data-act="go" data-to="hub">Open my map 🗺️</button></div>');
  confetti();
};

/* ---------------- finish a session ---------------- */
function finishSession(early){
  if(!SESS.credits.length){ SESS = null; toast('No questions this time — try again!'); return go('hub'); }
  const today = todayStr(); const kind = SESS.kind;
  if(S.streak.lastPlayDate && daysBetween(S.streak.lastPlayDate, today) >= 3) S.comeback = true;
  updateStreak(S, today);
  const credits = SESS.credits; const acc = Math.round(credits.reduce(function(a, b){ return a + b; }, 0) / credits.length * 1e6) / 1e6;
  const info = { kind: kind, stars: 0, medals: [], wobblyCleared: 0, packs: 0, newBadges: [], levelUp: 0, acc: acc, n: credits.length, perfect: false, next: null };
  Object.keys(SESS.by).forEach(function(id){
    const sk = skillById(id); const cr = SESS.by[id];
    const r = applySkillResult(S, id, kind, cr, today);
    if(r.medalUp) info.medals.push({ name: sk.name, medal: r.after.medal });
    if(r.wobblyCleared) info.wobblyCleared++;
    S.sessionLog.push({ date: today, kind: kind, strand: sk.strand, skill: id, correct: cr.filter(function(c){ return c > 0; }).length, total: cr.length, credit: cr.reduce(function(a, b){ return a + b; }, 0) / cr.length, mood: null });
  });
  if(S.sessionLog.length > 500) S.sessionLog = S.sessionLog.slice(-400);
  info.stars = kind === 'testout' ? (acc >= 0.99 ? 5 : 0) : sessionStars(credits);
  info.perfect = credits.length >= 4 && acc === 1;
  if(info.perfect) S.hadPerfect = true;
  S.totalStars += info.stars; S.starBalance += info.stars;
  info.levelUp = addXp(S, info.stars * 3 + 5);
  if(acc >= 0.6 && kind !== 'testout'){ S.packs++; info.packs++; }
  if(info.medals.length){ S.packs++; info.packs++; }
  ensureDaily(S, today);
  S.daily.warmup = true;
  S.daily.rounds = (S.daily.rounds || 0) + 1; if(S.daily.rounds >= 3) S.daily.boss = true;
  info.newBadges = checkBadges(S);
  info.next = recommend(S);
  info.logIdx = S.sessionLog.length - Object.keys(SESS.by).length;
  save();
  SESS = null;
  go('results', info);
}
SCREENS.results = function(p){
  const good = p.acc >= 0.8;
  let h = '<div class="center white"><div class="mascot pop big">' + friendImg() + '</div><div class="bubble">' + (p.perfect ? '💯 Purrfect!' : (good ? '🌟 ' + pick(PRAISE).replace(/[.!]$/, '') + ', ' + nick() + '!' : '💪 Mistakes help your brain grow!')) + '</div><h1 style="margin-top:10px">' + (p.kind === 'testout' ? (p.acc >= 0.99 ? 'You really know it!' : 'Not yet — let’s learn it') : (p.perfect ? 'Perfect round!' : (good ? 'Great round!' : 'Good effort!'))) + '</h1></div><div class="gap"></div>';
  h += '<div class="card center"><p class="qprompt">⭐ +' + p.stars + ' stars</p>' +
    (p.medals.length ? p.medals.map(function(m){ return '<p style="margin-top:8px;font-weight:900">' + ['', '🥉', '🥈', '🥇'][m.medal] + ' New medal: ' + esc(m.name) + '</p>'; }).join('') : '') +
    (p.wobblyCleared ? '<p style="margin-top:8px;font-weight:900">💪 You fixed a wobbly skill!</p>' : '') +
    (p.packs ? '<p style="margin-top:8px;font-weight:900">✨ ' + p.packs + ' sticker pack' + (p.packs > 1 ? 's' : '') + ' earned!</p>' : '') +
    (p.levelUp ? '<p style="margin-top:8px;font-weight:900">🚀 Level up! You are now Level ' + p.levelUp + ' — ' + levelTitle(p.levelUp) + '</p>' : '') +
    (p.newBadges.length ? '<div class="badgeline">' + p.newBadges.map(function(b){ return '<span class="badge">' + b.emoji + ' ' + b.label + '</span>'; }).join('') + '</div>' : '') +
    '<div class="gap"></div><p class="muted">How did that feel?</p><div class="row" style="justify-content:center;gap:16px"><button class="icon-btn" style="font-size:30px" data-act="mood" data-v="happy">😀</button><button class="icon-btn" style="font-size:30px" data-act="mood" data-v="ok">😐</button><button class="icon-btn" style="font-size:30px" data-act="mood" data-v="hard">😟</button></div><div id="moodfb"></div></div><div class="gap"></div>';
  if(S.packs) h += '<button class="btn block good" data-act="go" data-to="stickers">✨ Open a sticker pack</button><div class="gap"></div>';
  if(p.next) h += '<button class="btn block" data-act="playRec">▶ Next: ' + esc(p.next.skill.name) + '</button><div class="gap"></div>';
  h += '<button class="btn block small" style="background:#ffffffcc;color:var(--ink)" data-act="go" data-to="hub">Home</button>';
  R(h);
  if(p.stars > 0 || p.medals.length) confetti(p.medals.length ? 70 : 30);
};
ACT.mood = function(d){
  for(let i = S.sessionLog.length - 1; i >= 0 && i >= S.sessionLog.length - 6; i--) if(S.sessionLog[i].date === todayStr() && !S.sessionLog[i].mood) S.sessionLog[i].mood = d.v;
  save(); const f = document.getElementById('moodfb'); if(f) f.innerHTML = '<p class="muted" style="margin-top:8px">Thanks for telling me! 💜</p>';
};
SCREENS.timeup = function(){
  R('<div class="center white"><div class="mascot big">' + friendImg() + '</div><h1>That’s enough for today!</h1></div><div class="gap"></div><div class="card center"><p class="qprompt">Your brain has worked hard. Come back tomorrow to keep your streak! 🔥</p><div class="gap"></div><button class="btn block" data-act="go" data-to="hub">Home</button><div class="gap"></div><button class="btn small block" style="background:#e9ebf7;color:var(--ink)" data-act="go" data-to="parentPin">Grown-up: add time</button></div>');
};

/* ---------------- stickers ---------------- */
SCREENS.stickers = function(){
  const order = { legendary: 0, epic: 1, rare: 2, common: 3 };
  const list = S.stickers.slice().sort(function(a, b){ return order[a.rarity] - order[b.rarity]; });
  const counts = { common: 0, rare: 0, epic: 0, legendary: 0 }; S.stickers.forEach(function(s){ counts[s.rarity]++; });
  let h = topbar('🌈 Stickers') + '<div class="card center"><p class="qprompt">' + S.stickers.length + ' different stickers</p><p class="muted">⚪ ' + counts.common + ' · 🔵 ' + counts.rare + ' · 🟣 ' + counts.epic + ' · 🟡 ' + counts.legendary + '</p><div class="gap"></div>' +
    (S.packs ? '<button class="btn block good" data-act="openPack">✨ Open a pack (' + S.packs + ' ready)</button>' : '<p class="muted">Finish rounds and win medals to earn packs. There are thousands of stickers — you can never run out!</p>') +
    '<div class="gap"></div><button class="btn block small" ' + (S.starBalance >= PACK_COST ? '' : 'disabled ') + 'data-act="buyPack">Buy a pack · ' + PACK_COST + ' ⭐</button></div><div class="gap"></div>';
  h += '<div class="sgrid">' + list.map(function(s){ return stickerHTML(s); }).join('') + '</div>';
  R(h);
};
ACT.buyPack = function(){ if(S.starBalance < PACK_COST) return; S.starBalance -= PACK_COST; S.packs++; save(); ACT.openPack(); };
ACT.openPack = function(){
  const r = openPack(S); if(!r) return;
  checkBadges(S); save(); go('reveal', { s: r.sticker, dupe: r.dupe, bonus: r.bonusStars });
};
SCREENS.reveal = function(p){
  R('<div class="center white" style="padding-top:20px"><h2>' + (p.dupe ? 'You found another one!' : 'NEW sticker!') + '</h2><div class="gap2"></div>' + stickerHTML(p.s, true) +
    '<div class="gap"></div><span class="rarity">' + p.s.rarity + '</span>' + (p.dupe ? '<p style="margin-top:10px;font-weight:900">+' + p.bonus + ' ⭐ bonus (you now have ×' + p.s.n + ')</p>' : '') + '</div><div class="gap2"></div>' +
    (S.packs ? '<button class="btn block good" data-act="openPack">✨ Open another (' + S.packs + ' left)</button><div class="gap"></div>' : '') +
    '<button class="btn block small" style="background:#ffffffcc;color:var(--ink)" data-act="go" data-to="stickers">My album</button>');
  confetti(p.s.rarity === 'legendary' ? 120 : (p.s.rarity === 'epic' ? 70 : 30));
};

/* ---------------- prizes ---------------- */
SCREENS.rewards = function(){
  let h = topbar('🎁 Prizes') + '<p class="white center">Pick a goal and collect ⭐ to get it!</p>';
  S.rewards.forEach(function(r){
    const can = S.starBalance >= r.cost;
    h += '<div class="reward-card' + (can ? '' : ' locked') + '"><span class="rc-emoji">' + esc(r.emoji) + '</span><div class="rc-body"><div class="rc-title">' + esc(r.title) + '</div><div class="rc-cost">' + r.cost + ' ⭐' + (S.goalReward === r.id ? ' · 🎯 my goal' : '') + '</div></div>' +
      (can ? '<button class="btn small good" data-act="claim" data-id="' + esc(r.id) + '">Get it!</button>' : '<button class="btn small" style="background:#e9ebf7;color:var(--ink)" data-act="setGoal" data-id="' + esc(r.id) + '">' + (S.goalReward === r.id ? 'Goal ✓' : 'Make goal') + '</button>') + '</div>';
  });
  R(h);
};
ACT.setGoal = function(d){ S.goalReward = d.id; save(); render(); };
ACT.claim = function(d){
  const r = S.rewards.filter(function(x){ return x.id === d.id; })[0]; if(!r || S.starBalance < r.cost) return;
  S.starBalance -= r.cost; S.claims.push({ id: r.id, title: r.title, emoji: r.emoji, cost: r.cost, date: todayStr() });
  if(S.goalReward === r.id) S.goalReward = null; save(); confetti(80); toast('Show this to a grown-up: ' + r.title); render();
};

/* ---------------- trophies ---------------- */
SCREENS.trophies = function(){
  let h = topbar('🏆 Trophies') + '<div class="card center"><p class="qprompt">' + totalMedals(S) + ' medals · ' + S.tricks.length + ' magic tricks</p></div><div class="gap"></div>';
  h += '<div class="card"><h3>Badges</h3><div class="badgeline" style="justify-content:flex-start">' + BADGES.map(function(b){ const on = S.badges.indexOf(b.id) > -1; return '<span class="badge" style="' + (on ? 'background:#F2C94C;color:#3a2a00' : 'opacity:.45') + '">' + (on ? b.emoji : '🔒') + ' ' + b.label + '</span>'; }).join('') + '</div></div><div class="gap"></div>';
  h += '<div class="card"><h3>My magic tricks</h3>' + (S.tricks.length ? S.tricks.map(function(id){ const sk = skillById(id); return sk ? '<div class="prow" style="background:#EEF1FB;color:var(--ink)" data-act="trick" data-id="' + id + '"><span>🎩 ' + esc(sk.trick.title) + '</span><span>→</span></div>' : ''; }).join('') : '<p class="muted">Finish a lesson to unlock your first trick!</p>') + '</div>';
  R(h);
};

/* ---------------- grown-ups ---------------- */
SCREENS.parentPin = function(){
  const a = randInt(6, 9), b = randInt(6, 9); SESS_PIN = a * b;
  R(topbar('👪 Grown-ups') + '<div class="card center"><p class="qprompt">Solo para adultos: ¿cuánto es ' + a + ' × ' + b + '?</p><div class="gap"></div><input class="input" id="pin" inputmode="numeric" style="text-align:center;font-size:24px"><div class="gap"></div><button class="btn block" data-act="pinOk">Entrar</button></div>');
};
let SESS_PIN = 0;
ACT.pinOk = function(){ const v = parseInt(document.getElementById('pin').value, 10); if(v === SESS_PIN) go('parent'); else { toast('Respuesta incorrecta'); go('parentPin'); } };

function pct(x){ return Math.round(x * 100) + '%'; }
function windowStats(from, to){
  const t = todayStr(); let c = 0, n = 0;
  S.sessionLog.forEach(function(l){ if(l.kind === 'legacy' || l.kind === 'review' || l.kind === 'testout' || l.kind === 'placement') return; const d = daysBetween(l.date, t); if(d >= from && d < to){ c += l.credit * l.total; n += l.total; } });
  return { n: n, acc: n ? c / n : 0 };
}
SCREENS.parent = function(){
  const t = todayStr();
  const w1 = windowStats(0, 7), w0 = windowStats(7, 14);
  const rev = S.sessionLog.filter(function(l){ return l.kind === 'review'; }); const revN = rev.reduce(function(a, l){ return a + l.total; }, 0), revC = rev.reduce(function(a, l){ return a + l.credit * l.total; }, 0);
  const wob = SKILLS.filter(function(s){ return S.skills[s.id] && S.skills[s.id].wobbly; });
  const gold = SKILLS.filter(function(s){ return medalOf(S, s.id) >= 3; }).length;
  const days = {}; S.sessionLog.forEach(function(l){ if(l.kind !== 'legacy' && daysBetween(l.date, t) < 14) days[l.date] = 1; });
  let verdict;
  if(w1.n < 15) verdict = 'Aún hay pocos datos esta semana (' + w1.n + ' preguntas). Con 3–4 sesiones se verá la tendencia.';
  else if(w0.n >= 15 && w1.acc > w0.acc + 0.05) verdict = '📈 Mejora: aciertos a la primera ' + pct(w0.acc) + ' → ' + pct(w1.acc) + ' respecto a la semana anterior.';
  else if(w0.n >= 15 && w1.acc < w0.acc - 0.08) verdict = '⚠️ Baja de ' + pct(w0.acc) + ' a ' + pct(w1.acc) + ': probablemente está avanzando a temas más difíciles; revisa “Dónde se atasca”.';
  else verdict = '✅ Estable: ' + pct(w1.acc) + ' de aciertos a la primera en ' + w1.n + ' preguntas.';
  const mood = { happy: 0, ok: 0, hard: 0 }; S.sessionLog.slice(-20).forEach(function(l){ if(l.mood) mood[l.mood]++; });
  let h = topbar('👪 Panel de padres');
  h += '<div class="card"><h3>¿Está aprendiendo de verdad?</h3><p style="margin:6px 0">' + verdict + '</p>' +
    '<div class="prow" style="background:#EEF1FB;color:var(--ink)"><span>Repasos superados (días después)</span><b>' + (revN ? pct(revC / revN) + ' de ' + revN : 'sin datos aún') + '</b></div>' +
    '<div class="prow" style="background:#EEF1FB;color:var(--ink)"><span>Habilidades en oro / tambaleantes</span><b>' + gold + ' / ' + wob.length + '</b></div>' +
    '<div class="prow" style="background:#EEF1FB;color:var(--ink)"><span>Días jugados (últimos 14)</span><b>' + Object.keys(days).length + '</b></div>' +
    '<div class="prow" style="background:#EEF1FB;color:var(--ink)"><span>Ánimo (últimas sesiones) 😀/😐/😟</span><b>' + mood.happy + ' / ' + mood.ok + ' / ' + mood.hard + '</b></div>' +
    '<p class="muted" style="margin-top:8px">Un repaso superado días después de aprender algo es la mejor señal de que se ha fijado, no solo memorizado.</p></div><div class="gap"></div>';
  h += '<div class="card"><h3>Resumen</h3><div class="prow" style="background:#EEF1FB;color:var(--ink)"><span>Nivel</span><b>' + S.level + ' · ' + levelTitle(S.level) + '</b></div><div class="prow" style="background:#EEF1FB;color:var(--ink)"><span>Racha</span><b>🔥 ' + S.streak.count + '</b></div><div class="prow" style="background:#EEF1FB;color:var(--ink)"><span>Estrellas (total / disponibles)</span><b>' + S.totalStars + ' / ' + S.starBalance + '</b></div><div class="prow" style="background:#EEF1FB;color:var(--ink)"><span>Medallas · trucos · stickers</span><b>' + totalMedals(S) + ' · ' + S.tricks.length + ' · ' + S.stickers.length + '</b></div><div class="prow" style="background:#EEF1FB;color:var(--ink)"><span>Tiempo hoy</span><b>' + Math.round(usedToday() / 60) + ' min</b></div></div><div class="gap"></div>';
  h += '<div class="card"><h3>Por área</h3>' + strandsWithSkills().map(function(s){ const p = strandProgress(S, s.id); return '<div class="prow" style="background:#EEF1FB;color:var(--ink)"><span>' + s.icon + ' ' + s.es + '</span><span class="pbar"><i style="width:' + p + '%"></i></span><b>' + p + '%</b></div>'; }).join('') + '</div><div class="gap"></div>';
  const errs = topErrors(S, 8);
  h += '<div class="card"><h3>Dónde se atasca</h3>' + (errs.length ? errs.map(function(e){ const sk = skillById(e.skill); return '<div class="prow" style="background:#FFF4E5;color:var(--ink);align-items:flex-start"><span><b>' + esc(sk ? sk.name : e.skill) + '</b><br><small>' + esc(stripTags(e.why)) + '</small></span><b>×' + e.n + '</b></div>'; }).join('') : '<p class="muted">Aún sin errores registrados.</p>') + '<p class="muted" style="margin-top:6px">Son los errores típicos que más repite, con la explicación que ella ve.</p></div><div class="gap"></div>';
  const recent = S.sessionLog.filter(function(l){ return l.kind !== 'legacy'; }).slice(-10).reverse();
  h += '<div class="card"><h3>Últimas sesiones</h3>' + (recent.length ? recent.map(function(l){ const sk = skillById(l.skill); return '<div class="prow" style="background:#EEF1FB;color:var(--ink)"><span>' + esc(l.date.slice(5)) + ' · ' + esc(KIND_ES[l.kind] || l.kind) + ' · ' + esc(sk ? sk.name : '') + '</span><b>' + l.correct + '/' + l.total + ' ' + ({ happy: '😀', ok: '😐', hard: '😟' }[l.mood] || '') + '</b></div>'; }).join('') : '<p class="muted">Todavía nada.</p>') + '</div><div class="gap"></div>';
  h += '<div class="card"><h3>Premios canjeados</h3>' + (S.claims.length ? S.claims.slice(-8).reverse().map(function(c){ return '<div class="prow" style="background:#EEF1FB;color:var(--ink)"><span>' + (c.date || '') + ' · ' + esc(c.emoji || '') + ' ' + esc(c.title) + '</span><b>' + c.cost + '⭐</b></div>'; }).join('') : '<p class="muted">Ninguno aún.</p>') + '</div><div class="gap"></div>';
  h += '<div class="card"><h3>Ajustes</h3>' +
    '<p class="muted">Tiempo diario</p><div class="row" style="flex-wrap:wrap"><button class="seg-btn' + (S.timer.mode === 'free' ? ' on' : '') + '" data-act="tmode" data-v="free" style="background:#e9ebf7;color:var(--ink)">Libre</button><button class="seg-btn' + (S.timer.mode === 'limit' ? ' on' : '') + '" data-act="tmode" data-v="limit" style="background:#e9ebf7;color:var(--ink)">Límite</button>' +
    (S.timer.mode === 'limit' ? '<input class="input" type="number" min="5" max="120" value="' + S.timer.minutes + '" data-chg="tmin" style="width:80px"> min <button class="seg-btn" style="background:#e9ebf7;color:var(--ink)" data-act="plus10">+10 min hoy</button>' : '') + '</div>' +
    '<p class="muted" style="margin-top:10px">Voz (lee en inglés)</p><button class="seg-btn' + (S.prefs.voice ? ' on' : '') + '" style="background:#e9ebf7;color:var(--ink)" data-act="voice">' + (S.prefs.voice ? 'Activada' : 'Desactivada') + '</button>' +
    '<p class="muted" style="margin-top:10px">Área de enfoque (la app prioriza esta área)</p><div class="chips"><button class="chip' + (!S.focus ? ' picked' : '') + '" data-act="setFocus" data-id="">Automático</button>' + strandsWithSkills().map(function(s){ return '<button class="chip' + (S.focus === s.id ? ' picked' : '') + '" style="font-size:15px" data-act="setFocus" data-id="' + s.id + '">' + s.icon + ' ' + s.es + '</button>'; }).join('') + '</div>' +
    '<p class="muted" style="margin-top:10px">Premios (nombre y coste en ⭐)</p>' + S.rewards.map(function(r, i){ return '<div class="row" style="margin-top:6px"><input class="input" value="' + esc(r.emoji) + '" data-chg="remoji" data-i="' + i + '" style="width:54px"><input class="input grow" value="' + esc(r.title) + '" data-chg="rtitle" data-i="' + i + '"><input class="input" type="number" value="' + r.cost + '" data-chg="rcost" data-i="' + i + '" style="width:74px"><button class="icon-btn" data-act="rdel" data-i="' + i + '">🗑️</button></div>'; }).join('') +
    '<button class="seg-btn" style="background:#e9ebf7;color:var(--ink);margin-top:8px" data-act="radd">+ Añadir premio</button>' +
    '<p class="muted" style="margin-top:14px">Datos</p><div class="row" style="flex-wrap:wrap"><button class="seg-btn" style="background:#e9ebf7;color:var(--ink)" data-act="export">⬇ Exportar</button><label class="seg-btn" style="background:#e9ebf7;color:var(--ink)">⬆ Importar<input type="file" accept="application/json" id="imp" style="display:none"></label><button class="seg-btn" style="background:#e9ebf7;color:var(--ink)" data-act="redoPlacement">Repetir diagnóstico</button><button class="seg-btn" style="background:#FFD1D1;color:#7a0000" data-act="reset">Borrar todo</button></div></div>';
  R(h);
};
ACT.tmode = function(d){ S.timer.mode = d.v; save(); render(); };
ACT.plus10 = function(){ addUsed(-600); if(S.timer.used.sec < 0) S.timer.used.sec = 0; save(); toast('+10 min'); render(); };
ACT.voice = function(){ S.prefs.voice = !S.prefs.voice; save(); render(); };
ACT.setFocus = function(d){ S.focus = d.id || null; save(); render(); };
ACT.radd = function(){ S.rewards.push({ id: 'r' + Date.now(), emoji: '🎁', title: 'Nuevo premio', cost: 50 }); save(); render(); };
ACT.rdel = function(d){ S.rewards.splice(+d.i, 1); save(); render(); };
ACT.redoPlacement = function(){ if(!confirm('¿Repetir el diagnóstico? Se conservan medallas, estrellas y stickers.')) return; S.placement = defaultState().placement; save(); go('placementIntro'); };
ACT.reset = function(){ if(!confirm('¿Borrar TODO el progreso? No se puede deshacer.')) return; if(!confirm('Seguro: se perderán estrellas, stickers y medallas.')) return; try { localStorage.removeItem(STATE_KEY); } catch(e){} S = defaultState(); save(); go('welcome'); };
ACT.export = function(){
  const blob = new Blob([JSON.stringify(S, null, 1)], { type: 'application/json' }); const a = document.createElement('a');
  a.href = URL.createObjectURL(blob); a.download = 'matemagics-' + todayStr() + '.json'; document.body.appendChild(a); a.click(); a.remove();
};
function onChange(el){
  const k = el.dataset.chg, i = +el.dataset.i;
  if(k === 'tmin') S.timer.minutes = Math.max(5, Math.min(120, parseInt(el.value, 10) || 20));
  else if(k === 'remoji') S.rewards[i].emoji = el.value.slice(0, 4) || '🎁';
  else if(k === 'rtitle') S.rewards[i].title = el.value.slice(0, 60) || 'Premio';
  else if(k === 'rcost') S.rewards[i].cost = Math.max(1, parseInt(el.value, 10) || 10);
  save();
}
function onImport(file){
  const fr = new FileReader();
  fr.onload = function(){ try { const o = JSON.parse(fr.result); if(!o || typeof o !== 'object') throw 0; S = o.v === 4 ? mergeState(o) : (o.strands ? migrateV3(o) : mergeState(o)); save(); toast('Progreso importado'); go('hub'); } catch(e){ toast('Archivo no válido'); } };
  fr.readAsText(file);
}

/* ---------------- boot ---------------- */
function boot(){
  load(); applyTheme();
  document.addEventListener('click', function(e){
    const el = e.target.closest('[data-act]'); if(!el || el.disabled) return;
    if(!window.__noGuard && Date.now() - LAST_GO < 350 && el.dataset.act !== 'say') return;   // ignore double-taps that land on the next screen
    const f = ACT[el.dataset.act]; if(f) f(el.dataset, el);
  });
  document.addEventListener('change', function(e){
    if(e.target.dataset && e.target.dataset.chg) onChange(e.target);
    else if(e.target.id === 'imp' && e.target.files[0]) onImport(e.target.files[0]);
  });
  document.addEventListener('visibilitychange', function(){ if(document.hidden) stopSpeak(); });
  if(!S.onboardingDone) go('welcome');
  else if(!S.placement.started) go('placementIntro');
  else go('hub');
}
if(typeof document !== 'undefined') document.addEventListener('DOMContentLoaded', boot);
