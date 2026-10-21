#!/usr/bin/env node
/* TOUCH TEST: taps with NO synthetic click must still run each action EXACTLY once (iOS can swallow the click after a tap).
   Runs on touch-emulated Chromium with an iPad profile (always) and on real WebKit (iPad + iPhone profiles) when WebKit is installed
   (npx playwright install webkit). If WebKit is missing it says SKIPPED and NOT VERIFIED; use --require-webkit to make that a failure.
   Automated tests never replace docs/IPAD-CHECKLIST.md on the physical iPad. */
const path = require('path'); const B = require('./lib/browser');
const REQUIRE_WEBKIT = process.argv.includes('--require-webkit'); let fails = 0, checks = 0;
const ok = (c, m) => { checks++; if(!c){ fails++; console.log('  ✗ ' + m); } };
async function run(name, browser, ctxOpts, mode){
  mode = mode || 'normal';   // normal: browser makes the click · swallowed: the click never reaches the app (iOS bug) · late: the click arrives 250 ms late, on whatever is under the finger
  console.log('▶ ' + name + ' [' + mode + ']');
  const ctx = await browser.newContext(ctxOpts); const p = await ctx.newPage(); const errs = [];
  p.on('pageerror', e => errs.push(e.message)); p.on('console', m => { if(m.type() === 'error') errs.push('console: ' + m.text()); });
  await p.goto('file://' + path.join(__dirname, '..', 'index.html')); await p.evaluate(() => localStorage.clear()); await p.reload(); await p.waitForTimeout(500);
  if(mode !== 'normal') await p.evaluate(mode => { window.__replay = false; window.addEventListener('click', e => { if(window.__replay) return; e.stopImmediatePropagation(); e.preventDefault(); if(mode === 'late'){ const x = e.clientX, y = e.clientY; setTimeout(() => { const el = document.elementFromPoint(x, y); if(el){ window.__replay = true; el.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true, clientX: x, clientY: y })); window.__replay = false; } }, 250); } }, true); }, mode);
  await p.evaluate(() => { S.onboardingDone = true; S.placement.started = true; S.placement.done = true; window.__cnt = {}; ['strand', 'go', 'lquiz', 'lnext', 'pick', 'qnext', 'playRec', 'startSess', 'hint'].forEach(k => { const f = ACT[k]; if(f) ACT[k] = function(){ __cnt[k] = (__cnt[k] || 0) + 1; return f.apply(this, arguments); }; }); go('hub'); }); await p.waitForTimeout(800);
  const cnt = () => p.evaluate(() => JSON.parse(JSON.stringify(__cnt)));
  const tap = async (sel, idx = 0) => { const r = await p.evaluate(([sel, idx]) => { const e = document.querySelectorAll(sel)[idx]; if(!e) return null; e.scrollIntoView({ block: 'center' }); const r = e.getBoundingClientRect(); return [r.left + r.width / 2, r.top + r.height / 2]; }, [sel, idx]); if(!r) return false; await p.waitForTimeout(450); await p.touchscreen.tap(r[0], r[1]); await p.waitForTimeout(700); return true; };
  // hub -> strand screen
  ok(await tap('[data-act=strand]'), 'no strand button on the hub'); let c = await cnt();
  ok(c.strand === 1, 'strand tap ran ' + (c.strand || 0) + ' times (want 1)'); ok(await p.evaluate(() => scr.name) === 'strand', 'did not reach the strand screen');
  // lesson: two taps on Next advance exactly two steps
  await p.evaluate(() => { go('lesson', { id: 'data-tally-tables', i: 0 }); }); await p.waitForTimeout(500);
  const lesson0 = await p.evaluate(() => (__cnt.lnext || 0));
  ok(await tap('[data-act=lnext]'), 'no Next button (step 1)'); ok(await tap('[data-act=lnext]'), 'no Next button (step 2)'); c = await cnt();
  ok((c.lnext || 0) - lesson0 === 2, 'Next ran ' + ((c.lnext || 0) - lesson0) + ' times for 2 taps'); ok(await p.evaluate(() => scr.p.i) === 2, 'lesson is at step ' + await p.evaluate(() => scr.p.i) + ' (want 2): taps were swallowed or doubled');
  // lesson quiz option: runs once and shows feedback
  ok(await tap('[data-act=lquiz]', 0), 'no lesson quiz option'); c = await cnt(); ok(c.lquiz === 1, 'quiz option ran ' + (c.lquiz || 0) + ' times (want 1)');
  ok(await p.evaluate(() => !!(document.getElementById('lfb') && document.getElementById('lfb').innerText.length > 3)), 'quiz gave no feedback');
  // practice question: pick runs once and the question reacts
  await p.evaluate(() => { SESS = { kind: 'practice', skillId: 'data-tally-tables', items: [], idx: 0, credits: [], by: {}, seen: {} }; SESS.q = genQ('data-tally-tables', 1); startQ('data-tally-tables', 1); }); await p.waitForTimeout(700);
  ok(await tap('[data-act=pick]', 0), 'no answer button'); c = await cnt(); ok(c.pick === 1, 'answer tap ran ' + (c.pick || 0) + ' times (want 1)');
  ok(await p.evaluate(() => SESS.phase === 'fb' || SESS.tries === 1), 'answer tap did not register');
  ok(errs.length === 0, 'page errors: ' + errs.slice(0, 3).join(' | '));
  await ctx.close();
}
(async () => {
  const { defaultBrowserType, ...ipad } = B.devices['iPad (gen 7)'];
  const chrome = await B.launchChromium(); const padOpts = { ...ipad, viewport: { width: 810, height: 1080 } };
  for(const mode of ['normal', 'swallowed', 'late']) await run('CHROMIUM touch, iPad-sized', chrome, padOpts, mode);
  await run('CHROMIUM touch, phone-sized', chrome, { viewport: { width: 430, height: 932 }, hasTouch: true, isMobile: true }, 'swallowed'); await chrome.close();
  const wk = await B.launchWebkit();
  if(wk){ for(const mode of ['normal', 'swallowed', 'late']) await run('WEBKIT iPad (gen 7)', wk, B.devices['iPad (gen 7)'], mode); await run('WEBKIT iPhone 14 Pro Max', wk, B.devices['iPhone 14 Pro Max'], 'normal'); await wk.close(); }
  else { console.log('▶ WEBKIT: SKIPPED, not installed here (NOT VERIFIED on the iPad engine). Install: npx playwright install webkit'); if(REQUIRE_WEBKIT){ fails++; console.log('  ✗ --require-webkit given'); } }
  console.log(fails ? '\n❌ TOUCH TEST FAILED (' + fails + ' of ' + checks + ' checks)' : '\n✅ TOUCH TEST PASSED (' + checks + ' checks' + (wk ? '' : '; Chromium only') + ')'); process.exit(fails ? 1 : 0);
})().catch(e => { console.log('TOUCH TEST CRASH ' + e.stack); process.exit(1); });
