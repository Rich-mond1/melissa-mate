#!/usr/bin/env node
/* COOLDOWN: after a wrong answer the buttons rest 4 s and the hint opens by itself, so she reads instead of tapping on. */
const path = require('path'); const B = require('./lib/browser'); let fails = 0, checks = 0;
const ok = (c, m) => { checks++; if(!c){ fails++; console.log('  ✗ ' + m); } };
(async () => {
  const b = await B.launchChromium(); const ctx = await b.newContext({ viewport: { width: 1180, height: 820 } }); const p = await ctx.newPage(); const errs = []; p.on('pageerror', e => errs.push(e.message));
  await p.goto('file://' + path.join(__dirname, '..', 'index.html')); await p.evaluate(() => localStorage.clear()); await p.reload(); await p.waitForTimeout(300);
  await p.evaluate(() => { for(let i = 0; i < 40; i++){ startSession('practice', 'logic-sorting'); if(SESS.q && SESS.q.type === 'mcq' && SESS.q.options.length >= 3) break; } }); await p.waitForTimeout(600);
  const wrong = await p.evaluate(() => { const q = SESS.q; return q.options.findIndex(o => o.key !== q.correctKey); });
  await p.click('button[data-act=pick][data-k="' + wrong + '"]'); await p.waitForTimeout(150);
  const s1 = await p.evaluate(() => ({ hint: SESS.hint, tries: SESS.tries, phase: SESS.phase, dis: [...document.querySelectorAll('button[data-act=pick]')].every(x => x.disabled), hintShown: !!document.querySelector('.hint-text'), msg: (document.querySelector('.feedback') || {}).textContent || '' }));
  ok(s1.tries === 1 && s1.phase === 'ask', 'first wrong answer gives one more try');
  ok(s1.dis, 'all answer buttons are locked right after a wrong answer');
  ok(s1.hint && s1.hintShown, 'the hint opens by itself');
  ok(/Look again/.test(s1.msg), 'message tells her to look again');
  // a forced tap during the rest is ignored
  const right = await p.evaluate(() => SESS.q.options.findIndex(o => o.key === SESS.q.correctKey));
  await p.evaluate(k => ACT.pick({ k: String(k) }), right); await p.waitForTimeout(100);
  ok(await p.evaluate(() => SESS.phase === 'ask' && SESS.tries === 1), 'a tap during the 4 s rest does nothing');
  await p.waitForTimeout(4200);
  const s2 = await p.evaluate(() => ({ en: [...document.querySelectorAll('button[data-act=pick]')].filter(x => !x.disabled).length }));
  ok(s2.en >= 1, 'buttons come back after 4 s');
  await p.click('button[data-act=pick][data-k="' + right + '"]'); await p.waitForTimeout(150);
  ok(await p.evaluate(() => SESS.phase === 'fb' && SESS.credits[0] === 0.6), 'right answer on the second try still counts 0.6');
  ok(errs.length === 0, 'no page errors ' + errs.join('|'));
  await b.close(); console.log(fails ? '\n❌ COOLDOWN TEST FAILED (' + fails + ' of ' + checks + ')' : '\n✅ COOLDOWN TEST PASSED (' + checks + ' checks)'); process.exit(fails ? 1 : 0);
})();
