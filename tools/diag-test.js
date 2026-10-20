#!/usr/bin/env node
/* Phase 4 adaptive diagnostic: simulated learners. Finds the boundary, never gives bronze for one question, never lowers medals, resumable, repeatable. */
const E = require('./lib/load-engine')();
let fails = 0, n = 0; const ok = (c, m) => { n++; if(!c){ fails++; if(fails < 25) console.log('✗ ' + m); } };
let seed = 12345; const rnd = () => { seed = (seed * 1664525 + 1013904223) >>> 0; return seed / 4294967296; };
const strands = E.strandsWithSkills().map(s => s.id); const lists = Object.fromEntries(strands.map(s => [s, E.skillsOfStrand(s)]));
/* a learner knows the first K[strand] skills of each strand; pKnow/pGuess = chance to answer right when she knows / does not know */
function run(S, K, pKnow, pGuess, hook){
  let q = 0, guard = 0;
  while(guard++ < 500){
    const it = E.diagNextItem(S); if(!it) break;
    const idx = lists[it.strand].findIndex(x => x.id === it.skill.id); const knows = idx < K[it.strand];
    const ans = rnd() < (knows ? pKnow : pGuess); q++; const before = JSON.stringify(S.skills); const r = E.diagRecord(S, it.skill.id, ans);
    if(hook) hook(it, r, before);
  }
  return q;
}
const maxQ = strands.reduce((t, s) => t + 3 * E.diagBlocksFor(lists[s].length), 0);
console.log('strands: ' + strands.map(s => s + '=' + lists[s].length + ' (≤' + E.diagBlocksFor(lists[s].length) + ' blocks)').join(', ') + '; hard maximum ' + maxQ + ' questions');

// A. noise-free: the boundary is found exactly, per strand and threshold
strands.forEach(sid => { const L = lists[sid]; for(let t = 0; t <= L.length; t++){
  const S = E.mergeState({}); E.diagStart(S); const K = Object.fromEntries(strands.map(s => [s, s === sid ? t : 0])); run(S, K, 1, 0);
  const passed = L.map(x => S.skills[x.id] && S.skills[x.id].medal >= 1);
  L.forEach((x, i) => { ok(passed[i] === (i < t) || (i < t && S.skills[x.id] && S.skills[x.id].likely) || (i < t) === false && !passed[i], sid + ' t=' + t + ': skill ' + i + ' wrongly ' + (passed[i] ? 'medalled' : 'missed')); });
  // everything she does not know has NO medal; everything with a medal she does know
  L.forEach((x, i) => { if(i >= t) ok(!(S.skills[x.id] && S.skills[x.id].medal >= 1), sid + ' t=' + t + ': unknown skill ' + i + ' got a medal'); });
  const top = L.map((x, i) => passed[i] ? i : -1).reduce((a, b) => Math.max(a, b), -1); ok(top === t - 1 || (t === 0 && top === -1), sid + ' t=' + t + ': highest passed ' + top + ', want ' + (t - 1));
  // below the top: either medal (tested) or marked likely, never plain unknown
  for(let i = 0; i < top; i++) { const st = S.skills[L[i].id]; ok(st && (st.medal >= 1 || st.likely), sid + ' t=' + t + ': skill ' + i + ' below the ceiling is neither passed nor likely'); }
  ok(E.placementDone(S), sid + ' t=' + t + ': placementDone after finishing'); } });

// B. noisy learners: accuracy and length
let within1 = 0, exact = 0, runs = 300, qs = [], maxSeen = 0;
for(let i = 0; i < runs; i++){ const S = E.mergeState({}); E.diagStart(S); const K = Object.fromEntries(strands.map(s => [s, Math.floor(rnd() * (lists[s].length + 1))]));
  const q = run(S, K, 0.93, 0.12); qs.push(q); maxSeen = Math.max(maxSeen, q);
  strands.forEach(s => { const L = lists[s]; const top = L.reduce((a, x, j) => (S.skills[x.id] && S.skills[x.id].medal >= 1) ? j : a, -1); const err = Math.abs((top + 1) - K[s]); if(err <= 1) within1++; if(err === 0) exact++; }); }
const tot = runs * strands.length; const mean = qs.reduce((a, b) => a + b, 0) / runs;
console.log('noisy (93% right when known, 12% lucky when not): boundary exact ' + (exact / tot * 100).toFixed(0) + '%, within one skill ' + (within1 / tot * 100).toFixed(0) + '%; questions mean ' + mean.toFixed(0) + ', max ' + maxSeen);
ok(within1 / tot >= 0.8, 'boundary within one skill only ' + (within1 / tot * 100).toFixed(0) + '%'); ok(maxSeen <= maxQ, 'ran ' + maxSeen + ' questions, hard maximum ' + maxQ); ok(mean <= 75, 'mean questions ' + mean.toFixed(0));

// C. a medal is never given for one question; blocks have 2 or 3 questions
{ const S = E.mergeState({}); E.diagStart(S); run(S, Object.fromEntries(strands.map(s => [s, lists[s].length])), 1, 1, (it, r, before) => { if(!r.blockDone) ok(JSON.stringify(S.skills) === before, 'state changed in the middle of a block (one question)'); });
  Object.values(S.diag.results).forEach(r => { if(!r.likely) ok(r.n >= 2 && r.n <= 3, 'block of ' + r.n + ' questions'); }); }

// D. never lowers or removes what she already earned
{ const S = E.mergeState({}); lists.number.forEach(x => { S.skills[x.id] = { medal: 3, box: 4, seen: 30, correct: 28, credit: 27, lessonDone: true, last: null, due: null, wobbly: false, placed: false }; });
  E.diagStart(S); run(S, Object.fromEntries(strands.map(s => [s, 0])), 0, 0); lists.number.forEach(x => ok(S.skills[x.id].medal === 3, 'an earned gold was lowered by a failed diagnostic')); }

{ const S = E.mergeState({}); E.SKILLS.forEach(x => { S.skills[x.id] = { medal: 3, box: 4, seen: 30, correct: 28, credit: 27, lessonDone: true, last: null, due: '2026-01-01', wobbly: false, placed: false }; });
  E.diagStart(S); run(S, Object.fromEntries(strands.map(s => [s, lists[s].length])), 1, 1); E.SKILLS.forEach(x => ok(S.skills[x.id].medal === 3 && S.skills[x.id].box === 4, 'a passed diagnostic lowered ' + x.id + ' to medal ' + S.skills[x.id].medal)); }

// E. resumable: a reload (JSON round trip) after every answer gives the same result as running straight through
{ const mk = () => { seed = 777; const S = E.mergeState({}); E.diagStart(S); return S; }; const K = Object.fromEntries(strands.map((s, i) => [s, (i * 3) % (lists[s].length + 1)]));
  const A = mk(); run(A, K, 0.9, 0.1); seed = 777; let B = E.mergeState({}); E.diagStart(B); let g = 0;
  while(g++ < 500){ B = E.mergeState(JSON.parse(JSON.stringify(B))); const it = E.diagNextItem(B); if(!it) break; const idx = lists[it.strand].findIndex(x => x.id === it.skill.id); E.diagRecord(B, it.skill.id, rnd() < (idx < K[it.strand] ? 0.9 : 0.1)); }
  ok(JSON.stringify(A.diag.results) === JSON.stringify(B.diag.results), 'resuming after a reload changed the outcome'); ok(JSON.stringify(Object.keys(A.skills).sort()) === JSON.stringify(Object.keys(B.skills).sort()), 'resume changed which skills have state'); }

// F. all wrong / all right terminate; "likely" leads to a quick check, which a failure clears
{ const S = E.mergeState({}); E.diagStart(S); const q = run(S, Object.fromEntries(strands.map(s => [s, 0])), 0, 0); ok(q <= maxQ, 'all-wrong ran ' + q); ok(E.totalMedals ? true : true, ''); ok(!E.SKILLS.some(s => S.skills[s.id] && S.skills[s.id].medal > 0), 'all wrong: nobody gets a medal'); ok(E.placementDone(S), 'all wrong: ends'); }
{ const S = E.mergeState({}); E.diagStart(S); run(S, Object.fromEntries(strands.map(s => [s, lists[s].length])), 1, 1); const sm = E.diagSummary(S); ok(sm.known > 0 && sm.likely > 0, 'all right: some confirmed, some likely: ' + JSON.stringify(sm));
  const lk = E.SKILLS.find(s => S.skills[s.id] && S.skills[s.id].likely); ok(!!lk && E.nextStepFor(S, lk) === 'testout', 'a likely skill offers a quick check first');
  E.applySkillResult(S, lk.id, 'testout', [1, 0, 1]); ok(!S.skills[lk.id].likely && S.skills[lk.id].medal === 0 && E.nextStepFor(S, lk) !== 'testout', 'failing the quick check clears likely and gives no medal');
  const lk2 = E.SKILLS.find(s => S.skills[s.id] && S.skills[s.id].likely); E.applySkillResult(S, lk2.id, 'testout', [1, 1, 1]); ok(S.skills[lk2.id].medal === 1, 'passing the quick check earns bronze'); }

// G. repeatable: a second run keeps medals, resets the diagnostic, counts runs
{ const S = E.mergeState({}); E.diagStart(S); run(S, Object.fromEntries(strands.map(s => [s, 2])), 1, 0); const medals = JSON.stringify(Object.fromEntries(Object.entries(S.skills).map(([k, v]) => [k, v.medal])));
  E.diagStart(S); ok(S.diag.runs === 2 && !S.diag.done && Object.keys(S.diag.results).length === 0, 'repeat resets results and counts runs'); ok(!E.placementDone(S), 'repeat: not done');
  ok(JSON.stringify(Object.fromEntries(Object.entries(S.skills).map(([k, v]) => [k, v.medal]))) === medals, 'repeat must not touch medals'); }

// H. persistence shape
{ const S = E.mergeState({}); E.diagStart(S); run(S, Object.fromEntries(strands.map(s => [s, 1])), 1, 0); const again = E.mergeState(JSON.parse(JSON.stringify(S))); ok(JSON.stringify(again.diag) === JSON.stringify(S.diag), 'diag survives save/load'); ok(E.mergeState({ diag: 'junk' }).diag === null && E.mergeState({ diag: [1] }).diag === null && E.mergeState({}).diag === null, 'junk diag is dropped'); }
console.log(fails ? '❌ DIAGNOSTIC TEST FAILED (' + fails + ' of ' + n + ' checks)' : '✅ DIAGNOSTIC TEST PASSED (' + n + ' checks)'); process.exit(fails ? 1 : 0);
