#!/usr/bin/env node
/* PALM TEST: a hand resting on one answer while a finger taps another must select the TAPPED answer, once (Chromium multi-touch emulation).
   Regression for: "she tapped the right answer but another one got selected". Runs 12 different questions, palm on a wrong option, tap on the correct one. */
const B = require('./lib/browser'); const path = require('path');
(async () => {
  const { defaultBrowserType, ...ipad } = B.devices['iPad (gen 7)']; const br = await B.launchChromium();
  const ctx = await br.newContext({ ...ipad, viewport: { width: 810, height: 1080 } }); const p = await ctx.newPage(); const cdp = await ctx.newCDPSession(p);
  await p.goto('file://' + path.join(__dirname, '..', 'index.html')); await p.evaluate(() => localStorage.clear()); await p.reload(); await p.waitForTimeout(400);
  let fails = 0, n = 0;
  for(let i = 0; i < 12; i++){
    const info = await p.evaluate(i => {
      S.onboardingDone = true; S.placement.started = true; S.placement.done = true;
      SESS = { kind: 'practice', skillId: null, items: [], idx: 0, credits: [], by: {}, seen: {} }; const ids = SKILLS.map(s => s.id); let q = null, id = null;
      for(let k = 0; k < ids.length && !q; k++){ id = ids[(i * 7 + k) % ids.length]; const t = genQ(id, 1 + i % 3); if(t && t.type === 'mcq' && t.options.length > 2) q = t; }
      SESS = { kind: 'practice', skillId: id, items: [], idx: 0, credits: [], by: {}, seen: {} }; SESS.q = q; startQ(id, 1);
      window.__log = []; if(!window.__wrapped){ const o = ACT.pick; ACT.pick = function(d){ __log.push(+d.k); return o(d); }; window.__wrapped = 1; }
      const qq = SESS.q; const ci = qq.options.findIndex(o => o.key === qq.correctKey); const wi = qq.options.findIndex(o => o.key !== qq.correctKey);
      const c = e => { const el = document.querySelectorAll('.opt')[e]; el.scrollIntoView({ block: 'center' }); const r = el.getBoundingClientRect(); return { x: r.left + r.width / 2, y: r.top + r.height / 2 }; };
      return { ci, wi, W: c(wi), C: c(ci) };
    }, i);
    await p.waitForTimeout(450);
    const pos = await p.evaluate(([ci, wi]) => { const f = e => { const r = document.querySelectorAll('.opt')[e].getBoundingClientRect(); return { x: r.left + r.width / 2, y: r.top + r.height / 2 }; }; return { W: f(wi), C: f(ci) }; }, [info.ci, info.wi]);
    const T = (type, pts) => cdp.send('Input.dispatchTouchEvent', { type, touchPoints: pts });
    const palm = { x: pos.W.x, y: pos.W.y, id: 1 }, fin = { x: pos.C.x, y: pos.C.y, id: 2 };
    await T('touchStart', [palm]); await p.waitForTimeout(800); await T('touchStart', [palm, fin]); await p.waitForTimeout(60);
    await T('touchEnd', [palm]); await p.waitForTimeout(250); await T('touchEnd', []); await p.waitForTimeout(300);
    const log = await p.evaluate(() => __log); n++;
    if(!(log.length === 1 && log[0] === info.ci)){ fails++; console.log('  ✗ question ' + i + ': picks ' + JSON.stringify(log) + ', wanted [' + info.ci + ']'); }
  }
  await br.close();
  if(fails){ console.log('❌ PALM TEST FAILED (' + fails + '/' + n + ')'); process.exit(1); }
  console.log('✅ PALM TEST PASSED (' + n + ' questions: resting hand + tap picks the tapped answer once)');
})();
