#!/usr/bin/env node
/* Phase 6 in a real browser: the 25-minute mission runs warm-up -> goal (lesson, guided) -> ... -> results, one sticker pack, state saved, adaptive hub text. */
const path = require('path'); const B = require('./lib/browser');
let fails = 0, checks = 0; const ok = (c, m) => { checks++; if(!c){ fails++; console.log('  ✗ ' + m); } }; const text = p => p.evaluate(() => document.body.innerText);
(async () => {
  const b = await B.launchChromium(); const ctx = await b.newContext({ viewport: { width: 810, height: 1080 } }); const p = await ctx.newPage(); const errs = [];
  p.on('pageerror', e => errs.push(e.message)); p.on('console', m => { if(m.type() === 'error') errs.push('console: ' + m.text()); });
  await p.goto('file://' + path.join(__dirname, '..', 'index.html')); await p.evaluate(() => { localStorage.clear(); }); await p.reload(); await p.evaluate(() => { window.__noGuard = true; });
  const setup = () => p.evaluate(() => { S = mergeState({ onboardingDone: true, placement: { done: true, strandIdx: 999 } }); ['number-place-value', 'number-compare-order', 'addsub-mental-3d'].forEach(id => { S.skills[id] = { medal: 1, box: 1, seen: 5, correct: 5, credit: 5, lessonDone: true, last: null, due: addDays(todayStr(), -1), wobbly: false, placed: false }; }); MISSION = null; save(); go('hub'); });
  const answerAll = async () => { for(let g = 0; g < 60; g++){ const n = await p.evaluate(() => scr.name); if(n !== 'question') return; await p.evaluate(() => { if(SESS.phase === 'ask'){ const q = SESS.q; if(q.type === 'order') submit('o:' + q.model.items.map(i => i.key).join('|')); else submit(q.correctKey); } }); await p.evaluate(() => ACT.qnext()); await p.waitForTimeout(15); } };
  const doLesson = async () => { for(let g = 0; g < 12; g++){ const n = await p.evaluate(() => scr.name); if(n !== 'lesson') return; await p.evaluate(() => { const sk = skillById(scr.p.id), st = sk.lesson.steps[scr.p.i]; if(st.quiz){ const k = st.quiz.options.findIndex(o => o.ok); document.querySelectorAll('.opt')[k].click(); } }); await p.evaluate(() => ACT.lnext()); await p.waitForTimeout(15); } };

  console.log('▶ hub offers the mission');
  await setup(); await p.waitForTimeout(200); let t = await text(p); ok(/Today.s mission/.test(t) && /about 25 min/.test(t), 'hub shows the mission button'); ok(/Quick round/.test(t), 'hub still has the quick round');
  console.log('▶ intro, warm-up first (reviews are due)');
  await p.click('[data-act=mission]'); await p.waitForTimeout(200); t = await text(p); ok(/Today.s goal/.test(t) && /About 25 minutes/.test(t), 'intro screen with the goal'); ok(await p.evaluate(() => !!MISSION), 'mission is active');
  await p.click('[data-act=missionNext]'); await p.waitForTimeout(250); ok(await p.evaluate(() => scr.name === 'question' && SESS.kind === 'review'), 'the first stage is the warm-up review');
  const packs0 = await p.evaluate(() => S.packs);
  await answerAll(); await p.waitForTimeout(250);
  ok(await p.evaluate(() => scr.name) === 'missionStep', 'a stage ends on the stage screen, got ' + await p.evaluate(() => scr.name)); t = await text(p); ok(/Keep going/.test(t) && /Next:/.test(t), 'stage screen offers the next stage');
  ok(await p.evaluate(p0 => S.packs === p0, packs0), 'no sticker pack after a stage inside a mission');
  console.log('▶ the goal block: lesson, then guided on the same skill');
  await p.click('[data-act=missionNext]'); await p.waitForTimeout(250);
  let name = await p.evaluate(() => scr.name), goal = await p.evaluate(() => MISSION.cur && MISSION.cur.kind), skill = await p.evaluate(() => MISSION.cur && MISSION.cur.skillId);
  if(name === 'lesson'){
    ok(goal === 'learn', 'lesson stage'); await doLesson(); await p.waitForTimeout(200); t = await text(p); ok(await p.evaluate(() => scr.name) === 'trick' && /Continue the mission/.test(t), 'after the lesson the trick screen continues the mission');
    await p.click('[data-act=missionLearnDone]'); await p.waitForTimeout(250);
    ok(await p.evaluate(sk => scr.name === 'question' && SESS.kind === 'guided' && SESS.skillId === sk, skill), 'guided practice follows on the same skill');
  } else { ok(['guided', 'practice', 'testout', 'challenge'].includes(await p.evaluate(() => SESS && SESS.kind)), 'a practice stage started, got ' + name); }
  console.log('▶ run to the end');
  for(let g = 0; g < 12; g++){
    await answerAll(); await p.waitForTimeout(200); name = await p.evaluate(() => scr.name);
    if(name === 'results') break;
    if(name === 'missionStep'){ const hasNext = await p.evaluate(() => !!document.querySelector('[data-act=missionNext]')); await p.evaluate(() => { const b = document.querySelector('[data-act=missionNext]') || document.querySelector('[data-act=missionEnd]'); b.click(); }); await p.waitForTimeout(250); if(!hasNext){ break; } }
    else if(name === 'lesson'){ await doLesson(); await p.evaluate(() => { const b = document.querySelector('[data-act=missionLearnDone]'); if(b) b.click(); }); await p.waitForTimeout(250); }
    else if(name === 'trick'){ await p.evaluate(() => { const b = document.querySelector('[data-act=missionLearnDone]'); if(b) b.click(); }); await p.waitForTimeout(250); }
  }
  name = await p.evaluate(() => scr.name); if(name === 'missionStep'){ await p.evaluate(() => document.querySelector('[data-act=missionEnd]').click()); await p.waitForTimeout(250); }
  t = await text(p); ok(await p.evaluate(() => scr.name) === 'results' && /Mission complete/.test(t), 'mission ends on a results screen that says so'); ok(/min ·/.test(t) && /stage/.test(t), 'results show minutes and stages');
  ok(await p.evaluate(() => MISSION === null), 'mission is over'); const st = await p.evaluate(() => ({ packs: S.packs, log: S.sessionLog.length, ev: S.evidence.length, kinds: S.sessionLog.map(l => l.kind) }));
  console.log('    stages: ' + st.kinds.join(' > ') + ' | evidence ' + st.ev); ok(st.log >= 2 && st.ev >= 8, 'sessions and evidence were saved: ' + JSON.stringify({ log: st.log, ev: st.ev })); ok(st.kinds[0] === 'review', 'the log starts with the warm-up: ' + st.kinds.join(','));
  ok(st.packs - packs0 >= 1 && st.packs - packs0 <= 1 + st.log, 'a sticker pack was earned for the mission: ' + (st.packs - packs0));
  await p.reload(); await p.waitForTimeout(300); ok(await p.evaluate(() => S.sessionLog.length) === st.log, 'saved state survives a reload'); ok(!/Continue today.s mission/.test(await text(p)), 'a reload ends the mission (it lives in memory only)');
  console.log('▶ stopping a mission, and going back to a prerequisite on the hub');
  await p.evaluate(() => { window.__noGuard = true; });
  await setup(); await p.evaluate(() => { ACT.mission(); }); await p.waitForTimeout(150); await p.evaluate(() => go('hub')); await p.waitForTimeout(200); t = await text(p); ok(/Continue today.s mission/.test(t) && /End mission/.test(t), 'hub offers to continue or end the mission');
  await p.click('[data-act=missionStop]'); await p.waitForTimeout(200); ok(await p.evaluate(() => MISSION === null) && /Today.s mission · about/.test(await text(p)), 'ending the mission returns to the normal hub');
  await p.evaluate(() => { const id = 'multdiv-formal-mult', pre = 'multdiv-2digit-partition'; S = mergeState({ onboardingDone: true, placement: { done: true, strandIdx: 999 }, focus: 'multdiv' }); SKILLS.filter(s => s.strand === 'multdiv' && s.id !== id && s.id !== pre).forEach(s => { S.skills[s.id] = { medal: 3, box: 3, seen: 30, correct: 30, credit: 30, lessonDone: true, last: null, due: '2099-01-01', wobbly: false, placed: false }; }); S.skills[pre] = { medal: 1, box: 1, seen: 5, correct: 5, credit: 5, lessonDone: true, last: null, due: '2099-01-01', wobbly: false, placed: false }; S.skills[id] = { medal: 0, box: 0, seen: 0, correct: 0, credit: 0, lessonDone: true, last: null, due: null, wobbly: false, placed: false };
    for(let i = 0; i < 2; i++) S.sessionLog.push({ date: todayStr(), kind: 'practice', strand: 'multdiv', skill: id, correct: 1, total: 6, credit: 0.2, mood: null }); save(); go('hub'); }); await p.waitForTimeout(200);
  t = await text(p); ok(/strengthen this first/.test(t), 'the hub says it is strengthening an earlier step first'); ok(/Quick round/.test(t) && /2-digit|partition|Multiplying/i.test(t) || /strengthen/.test(t), 'the quick round names the earlier skill');
  ok(errs.length === 0, 'page errors: ' + errs.join(' | ')); await b.close();
  console.log(fails ? '❌ MISSION UI TEST FAILED (' + fails + ' of ' + checks + ' checks)' : '✅ MISSION UI TEST PASSED (' + checks + ' checks)'); process.exit(fails ? 1 : 0);
})().catch(e => { console.log('❌ MISSION UI TEST CRASHED: ' + e.message); process.exit(1); });
