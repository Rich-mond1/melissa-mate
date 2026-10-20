#!/usr/bin/env node
/* Phase 3 rules: gold needs a review passed on a later day; evidence log; five levels; repeated errors; old progress is never lost. */
const E = require('./lib/load-engine')(); const fs = require('fs'), path = require('path');
let fails = 0, n = 0; const ok = (c, m) => { n++; if(!c){ fails++; console.log('✗ ' + m); } };
const D1 = '2026-03-02', D2 = '2026-03-03', D3 = '2026-03-10';
const fresh = (id, st) => { const S = E.mergeState({}); S.skills[id] = Object.assign({ medal: 0, box: 0, seen: 0, correct: 0, credit: 0, lessonDone: true, last: null, due: null, wobbly: false, placed: false }, st); return S; };
const ID = 'multdiv-3'; const good = [1, 1, 1, 1, 1], bad = [0, 0, 0, 0, 0];

// 1. challenge at silver does NOT give gold; it waits for a review on a later day
let S = fresh(ID, { medal: 2, box: 2, seen: 20 }); let r = E.applySkillResult(S, ID, 'challenge', good, D1); let st = S.skills[ID];
ok(st.medal === 2 && !r.medalUp, 'challenge pass at silver must not award gold'); ok(r.goldPending === true && st.goldFrom === D1, 'goldFrom must be set'); ok(st.due === D2, 'review must be due the next day, got ' + st.due);
ok(E.goldWaiting(S).length === 1, 'goldWaiting lists the skill');
// 2. same-day review gives nothing
E.applySkillResult(S, ID, 'review', [1, 1, 1], D1); ok(S.skills[ID].medal === 2 && S.skills[ID].goldFrom === D1, 'same-day review must not award gold');
// 3. next-day failed review keeps it waiting
S = fresh(ID, { medal: 2, box: 2, seen: 20 }); E.applySkillResult(S, ID, 'challenge', good, D1); E.applySkillResult(S, ID, 'review', [1, 0, 1], D2);
ok(S.skills[ID].medal === 2 && S.skills[ID].goldFrom === D1, '2/3 review (0.67) must not award gold'); ok(S.skills[ID].due === E.addDays(D2, 1), 'failed review still due tomorrow');
// 4. next-day passed review gives gold
r = E.applySkillResult(S, ID, 'review', good.slice(0, 3), D3); ok(S.skills[ID].medal === 3 && r.medalUp, 'a later-day passed review awards gold'); ok(!S.skills[ID].goldFrom, 'goldFrom cleared');
ok(E.goldWaiting(S).length === 0, 'no longer waiting');
// 5. failing the challenge changes nothing; bronze challenge still gives silver; existing gold stays gold
S = fresh(ID, { medal: 2, box: 2 }); E.applySkillResult(S, ID, 'challenge', bad, D1); ok(S.skills[ID].medal === 2 && !S.skills[ID].goldFrom, 'failed challenge: no gold, no pending');
S = fresh(ID, { medal: 1, box: 1 }); E.applySkillResult(S, ID, 'challenge', good, D1); ok(S.skills[ID].medal === 2 && !S.skills[ID].goldFrom, 'challenge at bronze gives silver (unchanged rule)');
S = fresh(ID, { medal: 3, box: 3 }); E.applySkillResult(S, ID, 'challenge', good, D1); ok(S.skills[ID].medal === 3 && !S.skills[ID].goldFrom, 'existing gold is kept');
S = fresh(ID, { medal: 3, box: 3 }); E.applySkillResult(S, ID, 'review', [0, 0, 0], D1); ok(S.skills[ID].medal === 3, 'a bad review never removes a medal she already has');
// 6. planning: pending skill is not re-offered as a challenge; the gold review has 3 questions at tier 3
S = fresh(ID, { medal: 2, box: 2, seen: 20 }); E.applySkillResult(S, ID, 'challenge', good, D1);
const rec = E.recommend(S); ok(!rec || rec.skill.id !== ID, 'recommend must not offer a challenge again for a pending-gold skill');
const realToday = E.todayStr(); S.skills[ID].goldFrom = E.addDays(realToday, -1); S.skills[ID].due = realToday;
const items = E.buildItems(S, 'review').filter(i => i.skillId === ID); ok(items.length === 3 && items.every(i => i.tier === 3), 'gold review = 3 questions at tier 3, got ' + JSON.stringify(items));
S.skills[ID].goldFrom = realToday; const items2 = E.buildItems(S, 'review').filter(i => i.skillId === ID); ok(items2.length === 2, 'same-day review of a pending skill is a normal 2-question item, got ' + items2.length);
// 6b. reviews: 2 questions per ordinary skill, at most 3 skills
S = E.mergeState({}); ['number-place-value', 'addsub-mental-3d', 'multdiv-2-5-10', 'time-quarters'].forEach(id => { S.skills[id] = { medal: 1, box: 1, seen: 5, correct: 5, credit: 5, lessonDone: true, last: null, due: E.addDays(realToday, -1), wobbly: false, placed: false }; });
{ const it = E.buildItems(S, 'review'); ok(it.length === 6 && new Set(it.map(i => i.skillId)).size === 3, 'review = 3 skills x 2 questions, got ' + it.length); }
// 6c. school order drives the recommendation
{ const SS = () => { const x = E.mergeState({ onboardingDone: true }); x.placement.done = true; return x; }; const gold = (x, ids) => ids.forEach(id => { x.skills[id] = { medal: 3, box: 3, seen: 30, correct: 30, credit: 30, lessonDone: true, last: null, due: '2099-01-01', wobbly: false, placed: false }; });
  let x = SS(); { const r = E.recommend(x); ok(r.skill.id === 'addsub-bonds' && E.nextStepFor(x, r.skill) === 'testout', 'fresh player starts with the Year 2 base as a quick check, got ' + r.skill.id + '/' + E.nextStepFor(x, r.skill)); }
  { const y = SS(); y.skills['addsub-bonds'] = { medal: 0, box: 0, seen: 3, correct: 1, credit: 1, lessonDone: false, last: null, due: null, wobbly: false, placed: false, triedOut: true }; ok(E.nextStepFor(y, E.SKILLS.find(k => k.id === 'addsub-bonds')) === 'learn', 'a failed quick check leads to the lesson, not a second quick check'); }
  gold(x, ['addsub-bonds', 'multdiv-doubles-halves']);
  ok(E.recommend(x).skill.id === 'number-place-value', 'after the Year 2 base the school starts at place value, got ' + E.recommend(x).skill.id);
  gold(x, ['number-place-value', 'number-compare-order', 'number-10-100-more-less', 'number-count-steps', 'number-line-3digit', 'addsub-mental-3d', 'multdiv-2-5-10', 'multdiv-4', 'multdiv-8', 'multdiv-3']);
  ok(E.recommend(x).skill.id === 'addsub-add-column', 'after units 1-4 the school goes to column addition, got ' + E.recommend(x).skill.id);
  x.focus = 'time'; ok(E.recommend(x).skill.strand === 'time', 'her chosen focus area is respected'); x.focus = null;
  let bad2 = 0; for(let t = 0; t < 300; t++){ const y = SS(); E.SKILLS.forEach(s => { const r = Math.random(); if(r < 0.5) gold(y, [s.id]); else if(r < 0.65) y.skills[s.id] = { medal: 1, box: 1, seen: 5, correct: 5, credit: 5, lessonDone: true, last: null, due: null, wobbly: false, placed: false }; });
    const rec2 = E.recommend(y); if(!rec2) continue; const open = E.SKILLS.filter(s => E.isUnlocked(y, s) && E.medalOf(y, s.id) < 3); const sq = id => E.SCHOOL_SEQ[id];
    if(sq(rec2.skill.id) !== null && open.some(s => sq(s.id) !== null && sq(s.id) < sq(rec2.skill.id))) bad2++; }
  ok(bad2 === 0, 'recommendation skipped an earlier school unit in ' + bad2 + ' random states');
  const z = SS(); const log = (id, k) => z.sessionLog.push({ date: E.todayStr(), kind: k || 'practice', strand: E.SKILLS.find(s => s.id === id).strand, skill: id, correct: 4, total: 5, credit: 0.8, mood: null });
  ok(E.recommend(z).skill.strand !== 'logic', 'stream not offered at the start'); for(let i = 0; i < 6; i++) log('number-place-value'); ok(E.recommend(z).skill.strand === 'logic', 'after 6 sessions a reasoning skill is offered');
  log('logic-patterns'); ok(E.recommend(z).skill.strand !== 'logic', 'not offered again right after a reasoning session'); }

// 7. evidence: record, cap, sanitise, old states
S = E.mergeState({}); ok(Array.isArray(S.evidence) && S.evidence.length === 0, 'fresh state has evidence []'); ok(E.mergeState({ v: 4, skills: {}, totalStars: 5 }).evidence.length === 0, 'old v4 state without evidence loads');
for(let i = 0; i < 1000; i++) E.recordEvidence(S, { d: D1, s: ID, k: 'practice', t: 2, c: 'f', h: false, r: 0, ms: 3000, w: '' });
ok(S.evidence.length <= E.EVIDENCE_CAP && S.evidence.length >= E.EVIDENCE_CAP - 100, 'evidence stays capped, got ' + S.evidence.length);
const dirty = E.mergeState({ evidence: [null, 5, { d: 'x', s: 'a', c: 'f' }, { d: D1, s: ID, c: 'z' }, { d: D1, s: ID, c: 'a', k: 'practice', t: 99, r: 9, ms: -5, w: 'x'.repeat(500), h: 1 }, 'str'] });
ok(dirty.evidence.length === 1 && dirty.evidence[0].t === 3 && dirty.evidence[0].r === 2 && dirty.evidence[0].ms === 0 && dirty.evidence[0].w.length === 80, 'garbage evidence is cleaned: ' + JSON.stringify(dirty.evidence));
const again = E.mergeState(JSON.parse(JSON.stringify(dirty))); ok(JSON.stringify(again.evidence) === JSON.stringify(dirty.evidence), 'evidence merge is idempotent');
// 8. five levels
const lv = (st, ev) => { const T = fresh(ID, st); (ev || []).forEach(c => E.recordEvidence(T, { d: D1, s: ID, k: 'practice', t: 2, c, w: '' })); return E.masteryLevel(T, ID); };
ok(E.masteryLevel(E.mergeState({}), ID) === 0, 'level 0 not started'); ok(lv({ seen: 3 }) === 1, 'level 1 learning'); ok(lv({ medal: 1, seen: 8 }) === 2, 'level 2 practising');
ok(lv({ medal: 2, seen: 20 }) === 3, 'level 3 silver with little evidence'); ok(lv({ medal: 2, seen: 20 }, 'ffffffffff'.split('')) === 3, 'level 3 silver, independent');
ok(lv({ medal: 2, seen: 20 }, 'aaaaaaaxxx'.split('')) === 2, 'silver but mostly helped -> level 2'); ok(lv({ medal: 3, seen: 30 }) === 4, 'level 4 gold');
// 9. repeated errors
S = E.mergeState({}); const today = E.todayStr();
[0, 1, 2].forEach(i => E.recordEvidence(S, { d: E.addDays(today, -i), s: ID, k: 'practice', t: 2, c: 'a', w: 'Added instead of multiplied' })); E.recordEvidence(S, { d: today, s: ID, k: 'practice', t: 2, c: 'x', w: 'Other' });
let re = E.repeatedErrors(S, today); ok(re.length === 1 && re[0].n === 3 && re[0].why === 'Added instead of multiplied', 'same error 3 times is flagged'); ok(E.repeatedErrors(S, E.addDays(today, 30)).length === 0, 'old errors expire after 14 days');
// 10. the real fixtures: loading never changes medals; gold stays gold
const dir = path.join(__dirname, 'fixtures'); fs.readdirSync(dir).filter(f => /^state-v4.*\.json$/.test(f)).forEach(f => { const o = JSON.parse(fs.readFileSync(path.join(dir, f), 'utf8')); const m = E.mergeState(JSON.parse(JSON.stringify(o)));
  Object.keys(o.skills || {}).forEach(id => { ok(m.skills[id].medal === o.skills[id].medal, f + ': medal changed for ' + id); ok(!m.skills[id].goldFrom, f + ': loading must not invent pending gold'); }); });
console.log(fails ? '❌ MASTERY TEST FAILED (' + fails + ' of ' + n + ' checks)' : '✅ MASTERY TEST PASSED (' + n + ' checks)'); process.exit(fails ? 1 : 0);
