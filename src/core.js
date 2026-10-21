/* =====================================================================
   MATEMAGICS v4 — CORE
   Runs unchanged in the browser and in Node (tools/audit.js).
   Everything a skill needs: RNG, text helpers, question builders,
   the skill registry and the validator that guards every question.
   ===================================================================== */
'use strict';

/* ---------- Seedable RNG (seed only used by the auditor; app uses Math.random) ---------- */
let _seed = null;
function setSeed(s){ _seed = (s === null || s === undefined) ? null : (s >>> 0); }
function rng(){
  if(_seed === null) return Math.random();
  _seed = (Math.imul(_seed, 1664525) + 1013904223) >>> 0;
  return _seed / 4294967296;
}
function randInt(a, b){ return a + Math.floor(rng() * (b - a + 1)); }
function pick(arr){ return arr[Math.floor(rng() * arr.length)]; }
function chance(p){ return rng() < p; }
function shuffle(arr){
  const a = arr.slice();
  for(let i = a.length - 1; i > 0; i--){ const j = Math.floor(rng() * (i + 1)); const t = a[i]; a[i] = a[j]; a[j] = t; }
  return a;
}
function sample(arr, n){ return shuffle(arr).slice(0, n); }

/* ---------- Text helpers ---------- */
function pad2(n){ return (n < 10 ? '0' : '') + n; }
function plural(n, one, many){ return n + ' ' + (n === 1 ? one : (many || one + 's')); }
/* number + a noun given in its PLURAL form, agreeing with the number: nnoun(1, 'pencils') = '1 pencil', nnoun(3, 'pencils') = '3 pencils'. isAre(n) = 'is' | 'are'. */
function singular(w){ w = String(w); if(/[^aeiou]ies$/.test(w)) return w.slice(0, -3) + 'y'; if(/(ches|shes|sses|xes)$/.test(w)) return w.slice(0, -2); return w.replace(/s$/, ''); }
function nnoun(n, w){ return n + ' ' + (n === 1 ? singular(w) : w); }
function isAre(n){ return n === 1 ? 'is' : 'are'; }
function gcd(a, b){ return b === 0 ? a : gcd(b, a % b); }
function stripTags(s){ return String(s).replace(/<\/span><span class="fd">/g, '/').replace(/<[^>]*>/g, '').replace(/&[a-z]+;/g, ' ').replace(/\s+/g, ' ').trim(); }
function money(pence){ return pence >= 100 ? '£' + (pence / 100).toFixed(2) : pence + 'p'; }
function numWord(n){
  const w = ['zero','one','two','three','four','five','six','seven','eight','nine','ten','eleven','twelve'];
  return (n >= 0 && n <= 12) ? w[n] : String(n);
}
/* Stacked fraction for option labels / text: fracHTML(3,4). stripTags() reads it back as "3/4". */
function fracHTML(n, d){ return '<span class="frac"><span class="fn">' + n + '</span><span class="fd">' + d + '</span></span>'; }
/* Explanation builder: title + array of steps -> HTML. Use <b> for the key numbers. */
function ex(title, steps){
  let html = '<div class="eh">🧠 ' + title + '</div>';
  steps.forEach(function(s){ html += '<div class="step">' + s + '</div>'; });
  return html;
}

/* ---------- Canonical keys ----------
   Every answer has a KEY. Two options with the same key mean the same thing,
   so the engine will never offer both (this is what stops "2/4" next to "1/2"
   or two clock faces showing the same time). */
const K = {
  num:  function(n){ return 'n:' + (Math.round(n * 1e6) / 1e6); },
  frac: function(n, d){ const g = gcd(Math.abs(n), d) || 1; return 'f:' + (n / g) + '/' + (d / g); },
  time: function(h, m){ return 't:' + ((((h % 12) * 60 + m) % 720 + 720) % 720); },       // 12-hour clock position
  time24: function(h, m){ return 'T:' + (h * 60 + m); },
  text: function(s){ return 's:' + String(s).toLowerCase().trim(); },
  bool: function(b){ return 'b:' + (b ? 'yes' : 'no'); }
};

/* ---------- Skill registry ---------- */
const SKILLS = [];
function registerSkill(def){
  const need = ['id','strand','name','emoji','year','lesson','trick','gen'];
  need.forEach(function(k){ if(def[k] === undefined) throw new Error('Skill ' + (def.id || '?') + ' missing "' + k + '"'); });
  if(SKILLS.some(function(s){ return s.id === def.id; })) throw new Error('Duplicate skill id ' + def.id);
  [1,2,3].forEach(function(t){ if(typeof def.gen[t] !== 'function') throw new Error('Skill ' + def.id + ' missing gen[' + t + ']'); });
  def.prereq = def.prereq || [];
  def.order = def.order || 0;
  SKILLS.push(def);
  return def;
}
function skillById(id){ for(let i = 0; i < SKILLS.length; i++) if(SKILLS[i].id === id) return SKILLS[i]; return null; }

/* =====================================================================
   QUESTION BUILDERS
   Every question is a plain object:
   { type:'mcq'|'num'|'shade'|'setclock'|'order',
     prompt, visual(html), hint, explain(html),
     options:[{key,label}], correct(index)          <- mcq only
     answer(number)                                  <- num only
     model:{...}                                     <- interactive types
     correctKey                                      <- canonical key of the right answer
     truthKey                                        <- SAME answer recomputed independently from the raw data
     decodeKey()                                     <- (optional) reads the answer back out of the DRAWN visual
     wrongWhy(respKey)->string                       <- targeted feedback for a typical mistake
     skill, tier }
   The validator (validateQuestion) refuses anything inconsistent.
   ===================================================================== */

/* opt(): build an option. label may contain HTML (e.g. a drawn clock) */
function opt(key, label, why){ return { key: key, label: String(label), why: why || '' }; }

/* mcq: one correct option + distractors. Distractors whose KEY equals the correct key,
   or another distractor, are silently dropped. Throws when fewer than (count-1) remain. */
function mcq(o){
  const count = o.count || 4;
  const correct = o.correct;
  const seen = {}; seen[correct.key] = true;
  const ds = [];
  (o.distractors || []).forEach(function(d){
    if(d && !seen[d.key]){ seen[d.key] = true; ds.push(d); }
  });
  if(ds.length < count - 1) throw new Error('mcq: not enough distinct distractors for "' + o.prompt + '" (' + ds.length + ')');
  // keepOrder: take misconception distractors first (in the order given); otherwise random
  const finalDs = o.keepOrder ? ds.slice(0, count - 1) : shuffle(ds).slice(0, count - 1);
  const opts = shuffle([correct].concat(finalDs));
  const whys = {};
  opts.forEach(function(x){ if(x.why) whys[x.key] = x.why; });
  return {
    type: 'mcq', prompt: o.prompt, visual: o.visual || '', hint: o.hint || '', explain: o.explain || '',
    options: opts, correct: opts.findIndex(function(x){ return x.key === correct.key; }),
    correctKey: correct.key, truthKey: o.truth, decodeKey: o.decode || null,
    wrongWhy: function(respKey){ return whys[respKey] || ''; },
    optionsAreVisual: !!o.optionsAreVisual, model: o.model || null
  };
}

/* Convenience for number answers: builds the options from a list of
   {v, why} wrong values (misconceptions first) followed by generic nearby values. */
function mcqNum(o){
  const fmt = o.fmt || String;
  const nearby = (o.nearby || [1,-1,2,-2,3,-3,5,-5,10,-10]).map(function(d){ return o.answer + d; });
  const wrongs = (o.wrong || []).concat(nearby.map(function(v){ return { v: v }; }));
  const ok = o.valid || function(v){ return v >= 0; };
  const ds = [];
  wrongs.forEach(function(w){
    if(w.v !== o.answer && ok(w.v) && isFinite(w.v)) ds.push(opt(K.num(w.v), fmt(w.v), w.why));
  });
  return mcq({
    prompt: o.prompt, visual: o.visual, hint: o.hint, explain: o.explain,
    correct: opt(K.num(o.answer), fmt(o.answer)),
    distractors: ds, count: o.count || 4, keepOrder: true,
    truth: K.num(o.truth === undefined ? o.answer : o.truth), decode: o.decode ? function(){ const r = o.decode(); return typeof r === 'number' ? K.num(r) : r; } : undefined, model: o.model
  });
}

/* Two-choice / true-false style question */
function mcq2(o){
  return mcq({ prompt: o.prompt, visual: o.visual, hint: o.hint, explain: o.explain,
    correct: o.correct, distractors: [o.other], count: 2, truth: o.truth, decode: o.decode, model: o.model });
}

/* Typed number answer (keypad). */
function numeric(o){
  return {
    type: 'num', prompt: o.prompt, visual: o.visual || '', hint: o.hint || '', explain: o.explain || '',
    answer: o.answer, unit: o.unit || '', correctKey: K.num(o.answer), truthKey: K.num(o.truth === undefined ? o.answer : o.truth),
    decodeKey: o.decode ? function(){ const r = o.decode(); return typeof r === 'number' ? K.num(r) : r; } : null, model: o.model || null,
    wrongWhy: function(respKey){ const v = parseFloat(String(respKey).slice(2)); return (o.wrong && o.wrong(v)) || ''; }
  };
}

/* Interactive: shade `num` of `den` equal parts. UI draws the bar from model.den. */
function shade(o){
  return {
    type: 'shade', prompt: o.prompt, visual: o.visual || '', hint: o.hint || '', explain: o.explain || '',
    model: { den: o.den, num: o.num, shape: o.shape || 'bar' },
    correctKey: K.num(o.num), truthKey: K.num(o.truth === undefined ? o.num : o.truth), decodeKey: null,
    wrongWhy: function(respKey){ const v = parseFloat(String(respKey).slice(2)); return v > o.num ? 'That is too many parts — the top number says how many to colour.' : 'That is not enough parts coloured yet.'; }
  };
}

/* Interactive: set the clock hands to h:m. */
function setclock(o){
  return {
    type: 'setclock', prompt: o.prompt, visual: o.visual || '', hint: o.hint || '', explain: o.explain || '',
    model: { hour: o.hour, minute: o.minute, roman: !!o.roman, step: o.step || 5 },
    correctKey: K.time(o.hour, o.minute), truthKey: K.time(o.truthHour === undefined ? o.hour : o.truthHour, o.truthMinute === undefined ? o.minute : o.truthMinute), decodeKey: null,
    wrongWhy: function(){ return 'Check the SHORT hand for the hour and the LONG hand for the minutes.'; }
  };
}

/* Interactive: tap items into the right order. items are given IN CORRECT ORDER,
   the UI shuffles them. item = {key,label}. The correct answer key is the keys joined with '|'. */
function order(o){
  const keys = o.items.map(function(i){ return i.key; });
  return {
    type: 'order', prompt: o.prompt, visual: o.visual || '', hint: o.hint || '', explain: o.explain || '',
    model: { items: o.items }, correctKey: 'o:' + keys.join('|'), truthKey: o.truth, decodeKey: null,
    wrongWhy: function(){ return 'Not quite in order yet — look at which one is smallest and start there.'; }
  };
}

/* =====================================================================
   VALIDATION — runs in the auditor on thousands of samples AND in the app
   on every question before the child sees it.
   Returns an array of error strings (empty = OK).
   ===================================================================== */
function validateQuestion(q){
  const errs = [];
  const bad = /undefined|NaN|\[object|null\b/;
  if(!q || typeof q !== 'object') return ['not an object'];
  if(['mcq','num','shade','setclock','order'].indexOf(q.type) === -1) errs.push('bad type ' + q.type);
  if(!q.prompt || stripTags(q.prompt).length < 5) errs.push('empty prompt');
  if(bad.test(q.prompt + ' ' + q.explain + ' ' + q.hint + ' ' + q.visual)) errs.push('text contains undefined/NaN/null: ' + stripTags(q.prompt).slice(0, 60));
  if(!q.hint || stripTags(q.hint).length < 8) errs.push('missing hint');
  if(!q.explain || stripTags(q.explain).length < 30) errs.push('missing/short explanation');
  if(q.truthKey === undefined || q.truthKey === null) errs.push('no truthKey (answer not recomputed independently)');
  else if(q.truthKey !== q.correctKey) errs.push('ANSWER MISMATCH: engine says ' + q.correctKey + ' but independent recompute says ' + q.truthKey + ' :: ' + stripTags(q.prompt).slice(0, 70));
  if(q.decodeKey){
    let d; try { d = q.decodeKey(); } catch(e){ d = 'THROW ' + e.message; }
    if(d !== q.correctKey) errs.push('VISUAL MISMATCH: picture shows ' + d + ' but answer is ' + q.correctKey + ' :: ' + stripTags(q.prompt).slice(0, 70));
  }
  if(q.type === 'mcq'){
    const keys = q.options.map(function(o){ return o.key; });
    const labels = q.options.map(function(o){ return stripTags(o.label) || o.label; });
    if(q.options.length < 2 || q.options.length > 4) errs.push('option count ' + q.options.length);
    if(new Set(keys).size !== keys.length) errs.push('two options mean the same thing (duplicate key)');
    if(!q.optionsAreVisual && new Set(labels).size !== labels.length) errs.push('duplicate option labels');
    if(!(q.correct >= 0 && q.correct < q.options.length)) errs.push('correct index out of range');
    else if(q.options[q.correct].key !== q.correctKey) errs.push('correct index does not point at the correct key');
    if(keys.filter(function(k){ return k === q.correctKey; }).length !== 1) errs.push('correct answer must appear exactly once');
    if(!q.optionsAreVisual){
      const lab = stripTags(q.options[q.correct] ? q.options[q.correct].label : '');
      const exTxt = stripTags(q.explain);
      if(lab && lab.length <= 14 && exTxt.indexOf(lab) === -1) errs.push('explanation never states the answer "' + lab + '"');
    }
  }
  if(q.type === 'num'){
    if(!isFinite(q.answer)) errs.push('numeric answer not finite');
    const exTxt = stripTags(q.explain);
    if(exTxt.indexOf(String(q.answer)) === -1) errs.push('explanation never states the answer "' + q.answer + '"');
  }
  if(q.type === 'shade'){
    const m = q.model;
    if(!(m.den >= 2 && m.den <= 12 && m.num >= 0 && m.num <= m.den)) errs.push('bad shade model');
  }
  if(q.type === 'setclock'){
    const m = q.model;
    if(!(m.hour >= 1 && m.hour <= 12 && m.minute >= 0 && m.minute < 60)) errs.push('bad clock model');
  }
  if(q.type === 'order'){
    const ks = q.model.items.map(function(i){ return i.key; });
    if(new Set(ks).size !== ks.length) errs.push('order items repeat');
    if(ks.length < 3 || ks.length > 5) errs.push('order needs 3-5 items');
  }
  return errs;
}

/* Generate a validated question for a skill/tier. Retries on invalid output so
   the child never sees a broken question; reports through onBad (used by the auditor). */
function makeQuestion(skill, tier, onBad){
  for(let i = 0; i < 25; i++){
    let q;
    try { q = skill.gen[tier](); } catch(e){ if(onBad) onBad(skill.id, tier, 'THROW ' + e.message); continue; }
    q.skill = skill.id; q.tier = tier;
    const errs = validateQuestion(q);
    if(errs.length === 0) return q;
    if(onBad) onBad(skill.id, tier, errs.join(' ; '));
  }
  return null;
}

if(typeof module !== 'undefined') module.exports = { fracHTML, setSeed, rng, randInt, pick, chance, shuffle, sample, pad2, plural, singular, nnoun, isAre, gcd, stripTags, money, numWord, ex, K,
  SKILLS, registerSkill, skillById, opt, mcq, mcqNum, mcq2, numeric, shade, setclock, order, validateQuestion, makeQuestion };

/* =====================================================================
   LESSON VALIDATION  (lessons are data: steps with {say, vis, quiz?})
   skill.lesson = { title, steps:[ { say:'html', vis:{kind,args}|null, quiz?:{prompt, options:[{label, ok:true|false}], right:'feedback', wrong:'feedback'} } ] }
   skill.trick  = { title, say:'html', vis:{kind,args}|null, example:'html' }
   ===================================================================== */
function validateSkillDef(sk, V){
  const errs = [];
  const bad = /undefined|NaN|\[object/;
  if(!/^[a-z0-9-]+$/.test(sk.id)) errs.push('id must be kebab-case');
  if(!sk.name || sk.name.length > 40) errs.push('name missing/too long');
  if([3,4].indexOf(sk.year) === -1 && sk.year !== 2) errs.push('year must be 2 (review), 3 or 4 (bridge)');
  const L = sk.lesson;
  if(!L || !L.title || !Array.isArray(L.steps)) errs.push('lesson needs title and steps');
  else {
    if(L.steps.length < 3 || L.steps.length > 6) errs.push('lesson needs 3-6 steps (has ' + L.steps.length + ')');
    L.steps.forEach(function(st, i){
      const t = stripTags(st.say || '');
      if(t.length < 20 || t.length > 360) errs.push('lesson step ' + (i + 1) + ': text length ' + t.length + ' (aim for 20-360 chars, short sentences for an 8 year old)');
      if(bad.test(st.say || '')) errs.push('lesson step ' + (i + 1) + ' text has undefined/NaN');
      if(st.vis){
        try { const e = V.verify(st.vis); if(e) errs.push('lesson step ' + (i + 1) + ' picture wrong: ' + e); } catch(e){ errs.push('lesson step ' + (i + 1) + ' vis throws: ' + e.message); }
      }
      if(st.quiz){
        const oks = (st.quiz.options || []).filter(function(o){ return o.ok; }).length;
        if(oks !== 1) errs.push('lesson quiz ' + (i + 1) + ' needs exactly 1 ok option');
        if(!st.quiz.options || st.quiz.options.length < 2 || st.quiz.options.length > 4) errs.push('lesson quiz ' + (i + 1) + ' needs 2-4 options');
        if(!st.quiz.right || !st.quiz.wrong) errs.push('lesson quiz ' + (i + 1) + ' needs right/wrong feedback');
      }
    });
    if(!L.steps.some(function(s){ return s.vis; })) errs.push('lesson must contain at least one picture');
    if(!L.steps.some(function(s){ return s.quiz; })) errs.push('lesson must contain at least one quiz step (learn by doing)');
  }
  const T = sk.trick;
  if(!T || !T.title || !T.say || stripTags(T.say).length < 30) errs.push('trick needs title and say (>=30 chars)');
  else {
    if(!T.example || stripTags(T.example).length < 8) errs.push('trick needs a worked example');
    if(bad.test(T.say + ' ' + T.example)) errs.push('trick text has undefined/NaN');
    if(T.vis){ try { const e = V.verify(T.vis); if(e) errs.push('trick picture wrong: ' + e); } catch(e){ errs.push('trick vis throws: ' + e.message); } }
  }
  return errs;
}
if(typeof module !== 'undefined') module.exports.validateSkillDef = validateSkillDef;
