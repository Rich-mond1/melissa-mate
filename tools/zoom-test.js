#!/usr/bin/env node
/* NO-ZOOM: a pinched/zoomed page makes iPad taps land on the wrong key. Pinch is blocked and a zoomed page snaps back. */
const path = require('path'); const B = require('./lib/browser'); let fails = 0, checks = 0;
const ok = (c, m) => { checks++; if(!c){ fails++; console.log('  ✗ ' + m); } };
(async () => {
  for(const eng of ['chromium', 'webkit']){
    const b = eng === 'webkit' ? await B.launchWebkit() : await B.launchChromium(); if(!b){ console.log('  (' + eng + ' not installed, skipped)'); continue; }
    const ctx = await b.newContext({ viewport: { width: 1180, height: 820 }, hasTouch: true, isMobile: eng === 'chromium' }); const p = await ctx.newPage(); const errs = []; p.on('pageerror', e => errs.push(e.message));
    await p.goto('file://' + path.join(__dirname, '..', 'index.html')); await p.evaluate(() => localStorage.clear()); await p.reload(); await p.waitForTimeout(300);
    const r = await p.evaluate(() => {
      const out = {}; ['gesturestart', 'gesturechange', 'gestureend'].forEach(t => { const e = new Event(t, { cancelable: true, bubbles: true }); document.body.dispatchEvent(e); out[t] = e.defaultPrevented; });
      let multi = null; try { const mk = n => new Touch({ identifier: n, target: document.body, clientX: 100 + n * 50, clientY: 100 }); const e = new TouchEvent('touchmove', { cancelable: true, bubbles: true, touches: [mk(1), mk(2)], changedTouches: [mk(1)] }); document.body.dispatchEvent(e); multi = e.defaultPrevented; const e1 = new TouchEvent('touchmove', { cancelable: true, bubbles: true, touches: [mk(1)], changedTouches: [mk(1)] }); document.body.dispatchEvent(e1); out.single = e1.defaultPrevented; } catch(x){ multi = 'n/a'; }
      out.multi = multi; out.hasUnzoom = typeof window.unzoom === 'function'; out.meta = document.querySelector('meta[name=viewport]').content; return out;
    });
    ok(r.gesturestart && r.gesturechange && r.gestureend, eng + ': pinch gestures are cancelled');
    ok(r.multi === true || r.multi === 'n/a', eng + ': two-finger move is cancelled (' + r.multi + ')'); ok(r.single !== true, eng + ': one-finger scroll is NOT blocked');
    ok(r.hasUnzoom, eng + ': unzoom() exists'); ok(/maximum-scale=1/.test(r.meta), eng + ': viewport meta kept');
    // a normal page is not touched, and the meta is restored after an unzoom
    const idle = await p.evaluate(() => window.unzoom()); ok(idle === false, eng + ': unzoom does nothing at scale 1');
    // headless browsers cannot really pinch-zoom, so fake a zoomed visual viewport and check the snap-back logic (the real effect needs the iPad)
    const sim = await p.evaluate(async () => {
      Object.defineProperty(window.visualViewport, 'scale', { get: () => 1.65, configurable: true });
      const orig = document.querySelector('meta[name=viewport]').content; const did = window.unzoom();
      const during = document.querySelector('meta[name=viewport]').content; const again = window.unzoom();   // second call while resetting must be ignored
      await new Promise(r => setTimeout(r, 400)); const after = document.querySelector('meta[name=viewport]').content;
      delete window.visualViewport.scale; return { orig, did, during, again, after };
    });
    ok(sim.did === true && sim.again === false, eng + ': unzoom runs once on a zoomed page');
    ok(/minimum-scale=1/.test(sim.during), eng + ': viewport is forced to scale 1 while resetting');
    ok(sim.after === sim.orig, eng + ': original viewport meta restored');
    ok(errs.length === 0, eng + ': console clean ' + errs.join('|')); await b.close();
  }
  console.log(fails ? '\nZOOM: ' + fails + ' FAILED of ' + checks : '\nZOOM: all ' + checks + ' checks pass'); process.exit(fails ? 1 : 0);
})();
