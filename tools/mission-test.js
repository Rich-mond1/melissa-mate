#!/usr/bin/env node
/* Phase 6 (engine): adaptive rules (go back to a prerequisite, depth before Year 4) and the 25-minute mission planner. */
const E = require('./lib/load-engine')();
let fails = 0, checks = 0; const ok = (c, m) => { checks++; if(!c){ fails++; console.log('  ✗ ' + m); } };
const today = E.todayStr();
const fresh = () => { const x = E.mergeState({ onboardingDone: true }); x.placement.done = true; return x; };
const set = (x, id, o) => { x.skills[id] = Object.assign({ medal: 0, box: 0, seen: 0, correct: 0, credit: 0, lessonDone: false, last: null, due: null, wobbly: false, placed: false }, o || {}); };
const skill = id => E.SKILLS.find(s => s.id === id);
const log = (x, id, kind, credit) => x.sessionLog.push({ date: today, kind: kind, strand: skill(id).strand, skill: id, correct: 0, total: 5, credit: credit, mood: null });

console.log('▶ going back to a prerequisite');
{ const x = fresh(); const sk = 'multdiv-formal-mult', pre = 'multdiv-2digit-partition';
  E.SKILLS.filter(s => s.strand === 'multdiv' && s.id !== sk && s.id !== pre).forEach(s => set(x, s.id, { medal: 3, lessonDone: true }));
  set(x, pre, { medal: 1, lessonDone: true }); set(x, sk, { medal: 0, lessonDone: true }); x.focus = 'multdiv';
  ok(E.rankOpen(x)[0].id === sk, 'setup: the struggling skill is first in school order, got ' + E.rankOpen(x)[0].id);
  ok(!E.struggling(x, sk), 'no history is not struggling');
  log(x, sk, 'practice', 0.3); ok(!E.struggling(x, sk), 'one weak session is not struggling');
  log(x, sk, 'practice', 0.4); ok(E.struggling(x, sk), 'two weak sessions in a row are struggling');
  ok(E.weakestPrereq(x, skill(sk)).id === pre, 'weakest prerequisite found');
  const r = E.recommend(x); ok(r.skill.id === pre && r.backoffFrom === sk, 'recommend goes back to the prerequisite, got ' + r.skill.id + ' from ' + r.backoffFrom);
  log(x, sk, 'practice', 0.9); ok(!E.struggling(x, sk) && E.recommend(x).skill.id === sk, 'a good session ends the back-off');
  const y = fresh(); E.SKILLS.filter(s => s.strand === 'multdiv' && s.id !== sk && s.id !== pre).forEach(s => set(y, s.id, { medal: 3, lessonDone: true })); set(y, pre, { medal: 2, lessonDone: true }); set(y, sk, { medal: 0, lessonDone: true }); y.focus = 'multdiv'; log(y, sk, 'guided', 0.2); log(y, sk, 'guided', 0.2);
  ok(E.recommend(y).skill.id === sk, 'a prerequisite that is already silver is not a reason to go back');
  const z = fresh(); z.focus = 'multdiv'; E.SKILLS.filter(s => s.strand === 'multdiv').forEach(s => set(z, s.id, { medal: 3, lessonDone: true })); set(z, sk, { medal: 0, lessonDone: true }); log(z, sk, 'practice', 0.1); log(z, sk, 'practice', 0.1);
  ok(E.recommend(z).skill.id === sk, 'with a gold prerequisite nothing changes'); }

console.log('▶ depth before Year 4');
{ const x = fresh(); const isY4 = s => s.year === 4;
  ok(!E.yearGateOpen(x), 'a new player has not earned Year 4 yet');
  ok(E.rankOpen(x).every(s => !isY4(s)), 'no Year 4 skill is offered before Year 3 is solid');
  { const b = fresh(); E.SKILLS.forEach(s => set(b, s.id, { medal: 1, lessonDone: true })); ok(E.SKILLS.some(isY4) && E.SKILLS.filter(isY4).every(s => E.isUnlocked(b, s)), 'setup: every Year 4 skill is unlocked'); ok(!E.yearGateOpen(b) && E.rankOpen(b).every(s => !isY4(s)), 'Year 4 stays out of the ranking while Year 3 is only bronze'); }
  const y3 = E.SKILLS.filter(s => s.year === 3), n = Math.ceil(y3.length * E.GATE_SILVER);
  y3.slice(0, n - 1).forEach(s => set(x, s.id, { medal: 2, lessonDone: true })); ok(!E.yearGateOpen(x), 'just under the threshold stays closed');
  set(x, y3[n - 1].id, { medal: 2, lessonDone: true }); ok(E.yearGateOpen(x), 'at the threshold the gate opens');
  set(x, y3[0].id, { medal: 2, lessonDone: true, wobbly: true }); ok(!E.yearGateOpen(x), 'a wobbly Year 3 skill closes the gate');
  set(x, y3[0].id, { medal: 2, lessonDone: true, wobbly: false });
  { const g = fresh(); E.SKILLS.filter(s => s.year < 4).forEach(s => set(g, s.id, { medal: 2, lessonDone: true })); ok(E.yearGateOpen(g) && E.rankOpen(g).some(isY4), 'gate open: Year 4 skills are in the ranking'); }
  const all = fresh(); E.SKILLS.filter(s => s.year < 4).forEach(s => set(all, s.id, { medal: 3, lessonDone: true }));
  ok(E.rankOpen(all).length > 0 && E.rankOpen(all).every(isY4), 'when only Year 4 is left it is offered: ' + E.rankOpen(all).length); }

console.log('▶ think blocks never hurt a skill');
{ const x = fresh(); set(x, 'multdiv-3', { medal: 2, box: 2, lessonDone: true });
  const it = E.buildItems(x, 'think', 'multdiv-3'); ok(it.length === 3 && it.every(i => i.tier === 3 && i.skillId === 'multdiv-3'), 'think = 3 questions at tier 3');
  const r = E.applySkillResult(x, 'multdiv-3', 'think', [0, 0, 0], today); ok(x.skills['multdiv-3'].medal === 2 && !x.skills['multdiv-3'].wobbly && !r.medalUp, 'a failed think block changes neither medal nor wobbly');
  E.applySkillResult(x, 'multdiv-3', 'think', [1, 1, 1], today); ok(x.skills['multdiv-3'].medal === 2 && !x.skills['multdiv-3'].goldFrom, 'a perfect think block never awards gold or sets goldFrom'); }

console.log('▶ the mission planner');
function simulate(x, accFor, secondsPerStage){
  const m = { elapsed: 0, budget: E.MISSION_SECONDS, done: [] }, stages = [];
  for(let g = 0; g < 30; g++){
    const st = E.nextMissionStage(x, m); if(!st) break; stages.push(st);
    let acc = null;
    if(st.kind === 'learn'){ skillLearn(x, st.skillId); } else {
      acc = accFor(st); const n = st.kind === 'review' ? 6 : { guided: 4, practice: 6, challenge: 5, testout: 3, think: 3 }[st.kind];
      if(st.kind === 'review'){ E.dueSkills(x).slice(0, 3).forEach(s => E.applySkillResult(x, s.id, 'review', [acc, acc], today)); }
      else { E.applySkillResult(x, st.skillId, st.kind, Array(n).fill(acc), today); log(x, st.skillId, st.kind, acc); }
    }
    m.done.push({ kind: st.kind, skillId: st.skillId, acc: acc }); m.elapsed += secondsPerStage;
  }
  return { stages: stages, m: m };
}
function skillLearn(x, id){ const st = E.skillState(x, id); st.lessonDone = true; }
{ const x = fresh(); const r = simulate(x, () => 0.9, 240);
  ok(r.stages.length >= 2 && r.stages.length <= 9, 'a mission has between 2 and 9 stages, got ' + r.stages.length);
  ok(r.stages[0].kind !== 'review', 'no warm-up when nothing is due');
  const learnIdx = r.stages.findIndex(s => s.kind === 'learn'); ok(learnIdx === -1 || r.stages[learnIdx + 1] && r.stages[learnIdx + 1].kind === 'guided' && r.stages[learnIdx + 1].skillId === r.stages[learnIdx].skillId, 'a lesson is followed by guided practice on the same skill');
  ok(r.m.elapsed >= E.MISSION_SECONDS || r.stages.length >= 9 || E.nextMissionStage(x, r.m) === null, 'the mission ends by time or by stage cap');
  ok(r.stages.every((s, i) => s.kind !== 'think' || (['practice', 'challenge'].includes(r.stages[i - 1].kind) && r.stages[i - 1].skillId === s.skillId)), 'think only follows practice or challenge on the same skill');
  ok(r.stages.filter(s => s.kind === 'think').length === new Set(r.stages.filter(s => s.kind === 'think').map(s => s.skillId)).size, 'one think block per skill'); }
{ const x = fresh(); E.SKILLS.slice(0, 6).forEach(s => set(x, s.id, { medal: 1, box: 1, lessonDone: true, due: E.addDays(today, -1) }));
  const r = simulate(x, () => 0.9, 240); ok(r.stages[0].kind === 'review', 'due reviews come first (retrieval)'); ok(r.stages.filter(s => s.kind === 'review').length === 1, 'exactly one warm-up'); }
{ const x = fresh(); const r = simulate(x, () => 0.9, 1500); ok(r.stages.length >= 1 && r.stages.length <= 2, 'a very slow child still gets a goal block but the mission stops by time, got ' + r.stages.length); }
{ const x = fresh(); E.SKILLS.forEach(s => set(x, s.id, { medal: 1, box: 1, lessonDone: true })); const r = simulate(x, () => 0.2, 240); ok(r.stages.some(s => s.kind === 'practice'), 'setup: practice stages are planned'); ok(r.stages.every(s => s.kind !== 'think'), 'no think block after a weak session'); ok(r.stages.length >= 2, 'a weak child still gets a full plan'); const y = fresh(); E.SKILLS.forEach(s => set(y, s.id, { medal: 1, box: 1, lessonDone: true })); const q = simulate(y, () => 0.9, 240); ok(q.stages.some(s => s.kind === 'think'), 'a strong child gets think blocks'); }
{ const x = fresh(); const sk = E.recommend(x).skill; const m = { elapsed: 0, budget: 1500, done: [{ kind: 'testout', skillId: sk.id, acc: 0.5 }] }; E.skillState(x, sk.id).triedOut = true; const nx = E.nextMissionStage(x, m); ok(nx && nx.skillId === sk.id && ['learn', 'guided'].includes(nx.kind), 'after a failed quick check the same skill is taught, got ' + (nx && nx.kind)); }
{ const x = fresh(); const done = []; let acc = 1; for(let k = 0; k < 40; k++){ const nx = E.nextMissionStage(x, { elapsed: 0, budget: 1500, done: done }); if(!nx) break; done.push({ kind: nx.kind, skillId: nx.skillId, acc: nx.kind === 'learn' ? null : acc }); if(nx.kind === 'learn') skillLearn(x, nx.skillId); }
  ok(done.length <= 9, 'the stage cap holds even if time never advances, got ' + done.length); }

console.log(fails ? '❌ MISSION TEST FAILED (' + fails + ' of ' + checks + ' checks)' : '✅ MISSION TEST PASSED (' + checks + ' checks)'); process.exit(fails ? 1 : 0);
