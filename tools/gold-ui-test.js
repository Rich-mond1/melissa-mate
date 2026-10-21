#!/usr/bin/env node
/* Phase 3 in a real browser: finishing a challenge shows "gold is almost yours" (no medal), a later-day review shows the gold medal, the parent panel lists pending gold and repeated errors, evidence is saved. */
const path = require('path'), fs = require('fs'); const B = require('./lib/browser');
let fails = 0, checks = 0; const ok = (c, m) => { checks++; if(!c){ fails++; console.log('  ✗ ' + m); } }; const text = p => p.evaluate(() => document.body.innerText);
(async () => {
  const b = await B.launchChromium(); const ctx = await b.newContext({ viewport: { width: 810, height: 1080 } }); const p = await ctx.newPage(); const errs = [];
  p.on('pageerror', e => errs.push(e.message)); p.on('console', m => { if(m.type() === 'error') errs.push('console: ' + m.text()); });
  await p.goto('file://' + path.join(__dirname, '..', 'index.html')); await p.evaluate(() => { localStorage.clear(); }); await p.reload();
  const ID = 'multdiv-3';
  await p.evaluate(id => { S = mergeState({ onboardingDone: true, placement: { done: true } }); S.skills[id] = { medal: 2, box: 2, seen: 20, correct: 18, credit: 17, lessonDone: true, last: null, due: null, wobbly: false, placed: false }; save(); }, ID);
  console.log('▶ challenge pass: no gold yet, message shown');
  await p.evaluate(id => { SESS = { kind: 'challenge', skillId: id, items: [], idx: 0, credits: [1,1,1,1,1], by: {}, seen: {} }; SESS.by[id] = [1,1,1,1,1]; finishSession(); }, ID); await p.waitForTimeout(300);
  let t = await text(p); ok(/Gold is almost yours/.test(t), 'results must say gold is almost yours'); ok(!/New medal/.test(t), 'no new medal on the challenge itself');
  ok(await p.evaluate(id => S.skills[id].medal === 2 && !!S.skills[id].goldFrom, ID), 'state: still silver with goldFrom set');
  console.log('▶ parent panel lists it; repeated errors warn');
  await p.evaluate(id => { for(let i = 0; i < 3; i++) recordEvidence(S, { d: todayStr(), s: id, k: 'practice', t: 2, c: 'a', w: 'Added instead of multiplied' }); go('parent'); }, ID); await p.waitForTimeout(300);
  t = await text(p); ok(/Oro pendiente de repaso/.test(t) && /espera repaso/.test(t), 'parent panel must list pending gold'); ok(/Mismo error repetido/.test(t) && /Added instead of multiplied/.test(t), 'parent panel must flag the repeated error');
  console.log('▶ a review on a later day wins gold');
  await p.evaluate(id => { S.skills[id].goldFrom = addDays(todayStr(), -1); S.skills[id].due = todayStr(); const items = buildItems(S, 'review'); SESS = { kind: 'review', skillId: null, items: items, idx: 0, credits: [1,1,1], by: {}, seen: {} }; SESS.by[id] = [1,1,1]; window.__n = items.filter(i => i.skillId === id).length; finishSession(); }, ID); await p.waitForTimeout(300);
  ok(await p.evaluate(() => window.__n) === 3, 'gold review must have 3 questions'); t = await text(p); ok(/New medal/.test(t) && /🥇/.test(t), 'results must show the new gold medal'); ok(await p.evaluate(id => S.skills[id].medal === 3 && !S.skills[id].goldFrom, ID), 'state: gold, nothing pending');
  console.log('▶ evidence is saved and survives reload');
  await p.evaluate(() => { SESS = { kind: 'practice', skillId: 'number-place-value', items: [{ skillId: 'number-place-value', tier: 2 }], idx: 0, credits: [], by: {}, seen: {} }; nextQuestion(); }); await p.waitForTimeout(300);
  const before = await p.evaluate(() => S.evidence.length); await p.evaluate(() => { const q = SESS.q; submit(q.correctKey); }); const after = await p.evaluate(() => ({ n: S.evidence.length, last: S.evidence[S.evidence.length - 1] }));
  ok(after.n === before + 1 && after.last.c === 'f' && after.last.s === 'number-place-value' && after.last.t === 2, 'one evidence record per answer: ' + JSON.stringify(after.last));
  await p.evaluate(() => { SESS.phase = 'fb'; ACT.qnext(); }); await p.waitForTimeout(300); await p.evaluate(() => { if(SESS) finishSession(); }); await p.waitForTimeout(200);
  await p.reload(); await p.waitForTimeout(300); ok(await p.evaluate(() => S.evidence.length) > 0, 'evidence must survive a reload');
  ok(errs.length === 0, 'page errors: ' + errs.join(' | ')); await b.close();
  console.log(fails ? '❌ GOLD UI TEST FAILED (' + fails + ' of ' + checks + ' checks)' : '✅ GOLD UI TEST PASSED (' + checks + ' checks)'); process.exit(fails ? 1 : 0);
})().catch(e => { console.log('❌ GOLD UI TEST CRASHED: ' + e.message); process.exit(1); });
