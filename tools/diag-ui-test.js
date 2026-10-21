#!/usr/bin/env node
/* The adaptive diagnostic through the real screens: a new player finishes it, progress survives a reload mid-way, "repeat" keeps medals, an old quest in progress keeps the old flow. */
const path = require('path'); const B = require('./lib/browser'); let fails = 0, checks = 0; const ok = (c, m) => { checks++; if(!c){ fails++; console.log('  ✗ ' + m); } };
(async () => {
  const b = await B.launchChromium(); const ctx = await b.newContext({ viewport: { width: 810, height: 1080 } }); const p = await ctx.newPage(); const errs = [];
  p.on('pageerror', e => errs.push(e.message)); p.on('console', m => { if(m.type() === 'error') errs.push('console: ' + m.text()); });
  const open = async (seed) => { await p.goto('file://' + path.join(__dirname, '..', 'index.html')); await p.evaluate(s => { localStorage.clear(); if(s) localStorage.setItem('melissaMathState_v4', JSON.stringify(s)); }, seed || null); await p.reload(); await p.waitForTimeout(250); };
  const answer = (right, max) => p.evaluate(async ([right, max]) => { let n = 0; while(SESS && SESS.kind === 'placement' && n < max){ if(SESS.phase === 'ask'){ const q = SESS.q; if(right) submit(q.correctKey); else ACT.idk(); n++; } else if(SESS.phase === 'fb') ACT.qnext(); else break; } return n; }, [right, max]);
  console.log('▶ new player, answers right: finishes, medals only where tested');
  await open(); await p.evaluate(() => { ACT.startPlacement(); ACT.placementGo(); }); await p.waitForTimeout(300);
  const n1 = await answer(true, 150); await p.waitForTimeout(300); const r1 = await p.evaluate(() => ({ scr: scr.name, done: S.diag && S.diag.done, pd: S.placement.done, medals: Object.values(S.skills).filter(s => s.medal > 0).length, likely: Object.values(S.skills).filter(s => s.likely).length, ev: S.evidence.filter(e => e.k === 'placement').length, saved: !!JSON.parse(localStorage.getItem('melissaMathState_v4')).diag.done }));
  ok(r1.scr === 'placementDone' && r1.done && r1.pd, 'must end on placementDone: ' + JSON.stringify(r1)); ok(r1.medals > 0 && r1.likely > 0, 'some medals and some likely: ' + JSON.stringify(r1)); ok(r1.ev === n1, 'one evidence record per diagnostic answer (' + r1.ev + ' vs ' + n1 + ')'); ok(r1.saved, 'finished diagnostic is saved'); ok(n1 <= 87, 'asked ' + n1);
  console.log('▶ hub offers a quick check for a likely skill');
  await p.evaluate(() => go('hub')); await p.waitForTimeout(300); const rec = await p.evaluate(() => { const r = recommend(S); return r && r.step; }); ok(!!rec, 'something is recommended');
  const lk = await p.evaluate(() => { const s = SKILLS.find(x => S.skills[x.id] && S.skills[x.id].likely); return s && s.id; }); ok(!!lk, 'a likely skill exists');
  if(lk){ await p.evaluate(id => { S.focus = SKILLS.find(x => x.id === id).strand; }, lk); const r = await p.evaluate(() => recommend(S)); ok(!!r, 'focus recommendation'); await p.evaluate(id => openSkillStep(skillById(id), 'testout'), lk); await p.waitForTimeout(300); ok(await p.evaluate(() => SESS && SESS.kind === 'testout'), 'quick check starts a testout session'); await p.evaluate(() => { SESS = null; go('hub'); }); }
  console.log('▶ reload in the middle keeps going from the same block');
  await open(); await p.evaluate(() => { ACT.startPlacement(); ACT.placementGo(); }); await p.waitForTimeout(300); await answer(true, 3); await p.evaluate(() => save());
  const mid = await p.evaluate(() => JSON.stringify({ r: S.diag.results, c: S.diag.cur })); await p.reload(); await p.waitForTimeout(300);
  ok(await p.evaluate(() => JSON.stringify({ r: S.diag.results, c: S.diag.cur })) === mid, 'diagnostic state changed over a reload'); await p.evaluate(() => { go('placementIntro'); }); await p.waitForTimeout(200); await p.evaluate(() => ACT.placementGo()); await p.waitForTimeout(300);
  ok(await p.evaluate(() => scr.name === 'question' && S.diag && !S.diag.done), 'continues the quest after reload');
  console.log('▶ all "I don\'t know": ends, no medals');
  await open(); await p.evaluate(() => { ACT.startPlacement(); ACT.placementGo(); }); await p.waitForTimeout(300); await answer(false, 150); await p.waitForTimeout(300);
  ok(await p.evaluate(() => scr.name === 'placementDone' && !Object.values(S.skills).some(s => s.medal > 0)), 'all unknown: ends with no medals');
  console.log('▶ repeat keeps medals and starts a fresh diagnostic');
  await open(); await p.evaluate(() => { ACT.startPlacement(); ACT.placementGo(); }); await p.waitForTimeout(300); await answer(true, 150); const m1 = await p.evaluate(() => totalMedals(S));
  await p.evaluate(() => { window.confirm = () => true; ACT.redoPlacement(); }); await p.waitForTimeout(200); await p.evaluate(() => ACT.placementGo()); await p.waitForTimeout(300); await answer(false, 150); await p.waitForTimeout(300);
  ok(await p.evaluate(() => S.diag.runs === 2 && S.diag.done) && await p.evaluate(() => totalMedals(S)) === m1, 'second run counted, medals unchanged (' + m1 + ')');
  console.log('▶ an old quest already under way carries on as the adaptive diagnostic');
  await open({ v: 4, onboardingDone: true, placement: { done: false, started: true, strandIdx: 1, asked: 1, misses: 0, queue: [], results: { 'number-place-value': 1 } }, skills: {} }); await p.evaluate(() => ACT.placementGo()); await p.waitForTimeout(300);
  ok(await p.evaluate(() => !!S.diag && !S.diag.done && scr.name === 'question' && S.diag.strands[strandsWithSkills()[0].id] && S.diag.strands[strandsWithSkills()[0].id].done), 'old quest migrated: first land stays finished, questions are adaptive');
  ok(errs.length === 0, 'page errors: ' + errs.join(' | ')); await b.close();
  console.log(fails ? '❌ DIAGNOSTIC UI TEST FAILED (' + fails + ' of ' + checks + ' checks)' : '✅ DIAGNOSTIC UI TEST PASSED (' + checks + ' checks)'); process.exit(fails ? 1 : 0);
})().catch(e => { console.log('❌ DIAGNOSTIC UI TEST CRASHED: ' + e.message); process.exit(1); });
