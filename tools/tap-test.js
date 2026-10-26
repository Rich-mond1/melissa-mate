#!/usr/bin/env node
/* TAP AUTHORITY: the key the finger STARTED on is the key that is pressed. If iOS sends the click to another key (palm / second finger), that click is ignored.
   Uses synthetic touch + click events, so it can fake the misdirected click that a real iPad produces. Also checks the tap log. */
const path = require('path'); const B = require('./lib/browser'); let fails = 0, checks = 0;
const ok = (c, m) => { checks++; if(!c){ fails++; console.log('  ✗ ' + m); } };
(async () => {
  for(const eng of ['chromium']){   // WebKit desktop has no Touch constructor (iOS-only API); iPad taps are covered by touch-test/palm-test
    const b = eng === 'webkit' ? await B.launchWebkit() : await B.launchChromium(); if(!b){ console.log('  (' + eng + ' not installed, skipped)'); continue; }
    const p = await (await b.newContext({ viewport: { width: 1180, height: 820 }, hasTouch: true })).newPage(); const errs = []; p.on('pageerror', e => errs.push(e.message));
    await p.goto('file://' + path.join(__dirname, '..', 'index.html')); await p.evaluate(() => localStorage.clear()); await p.reload(); await p.waitForTimeout(300);
    await p.evaluate(() => { S.onboardingDone = true; S.placement.done = true; SESS = { kind: 'practice', skillId: 'multdiv-doubles-halves', items: [{ skillId: 'multdiv-doubles-halves', tier: 3 }], idx: 0, credits: [], by: {}, seen: {}, run: 0 };
      for(let i = 0; i < 300; i++){ const q = genQ('multdiv-doubles-halves', 3); if(q && q.type === 'num'){ SESS.q = q; startQ('multdiv-doubles-halves', 3); break; } } });
    await p.waitForTimeout(500);
    // helper run inside the page: a finger tap on key `a`, and the click iOS delivers to key `c` (c = a for a normal tap)
    const tap = (a, c, gap) => p.evaluate(async ([a, c, gap]) => {
      const key = k => [...document.querySelectorAll('.keypad button')].find(x => x.dataset.k === k); const wait = ms => new Promise(r => setTimeout(r, ms));
      const mk = (el, id) => new Touch({ identifier: id, target: el, clientX: 10, clientY: 10 }); const ea = key(a); window.__noGuard = true;
      const id = Math.floor(Math.random() * 1e6);
      ea.dispatchEvent(new TouchEvent('touchstart', { bubbles: true, cancelable: true, touches: [mk(ea, id)], targetTouches: [mk(ea, id)], changedTouches: [mk(ea, id)] })); await wait(40);
      ea.dispatchEvent(new TouchEvent('touchend', { bubbles: true, cancelable: true, touches: [], targetTouches: [], changedTouches: [mk(ea, id)] })); await wait(10);
      if(c !== null) key(c).dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true }));
      await wait(gap || 250); return SESS.numStr; }, [a, c, gap]);
    const clear = async () => { await p.evaluate(() => { SESS.numStr = ''; render(); }); await p.waitForTimeout(100); };
    await clear(); ok(await tap('5', '5') === '5', eng + ': normal tap types the key');
    await clear(); ok(await tap('5', '8') === '5', eng + ': click sent to the wrong key (8) is ignored, 5 is typed once');
    await clear(); ok(await tap('⌫', '9') === '', eng + ': delete tap with a click on 9 does NOT type 9');
    await clear(); ok(await tap('7', null) === '7', eng + ': touch with no click at all still types (fallback)');
    await clear(); let s = ''; for(const k of ['1', '2', '3']) s = await tap(k, k, 200); ok(s === '123', eng + ': three taps 200 ms apart = 123 (' + s + ')');
    await clear(); await p.waitForTimeout(700); await p.evaluate(() => { const k = [...document.querySelectorAll('.keypad button')].find(x => x.dataset.k === '4'); k.dispatchEvent(new MouseEvent('click', { bubbles: true })); }); await p.waitForTimeout(200);
    ok(await p.evaluate(() => SESS.numStr) === '4', eng + ': a plain mouse click (no touch) still works');
    const log = await p.evaluate(() => window.tapLog()); ok(log.some(x => x.e === 'click-redirected' && x.to === 'key:8'), eng + ': the redirected click is in the tap log'); ok(log.length <= 40 && log.every(x => x.e && x.t), eng + ': log is bounded and well-formed (' + log.length + ')');
    await p.evaluate(() => { ACT.export && 0; }); const json = await p.evaluate(() => JSON.stringify(Object.assign({}, S, { _tapLog: window.tapLog() }))); const re = await p.evaluate(j => { const m = mergeState(JSON.parse(j)); return { has: '_tapLog' in m }; }, json);
    ok(re.has === false, eng + ': _tapLog is dropped when a backup is loaded (not part of the progress)');
    ok(errs.length === 0, eng + ': console clean ' + errs.join('|')); await b.close();
  }
  console.log(fails ? '\nTAP: ' + fails + ' FAILED of ' + checks : '\nTAP: all ' + checks + ' checks pass'); process.exit(fails ? 1 : 0);
})();
