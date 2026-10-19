#!/usr/bin/env node
/* SAFETY TEST in a real browser: storage failure warning, backup by Export / Share, import of a saved file, corrupt state at boot. */
const path = require('path'), fs = require('fs'); const B = require('./lib/browser');
const FIX = path.join(__dirname, 'fixtures'); let fails = 0, checks = 0; const ok = (c, m) => { checks++; if(!c){ fails++; console.log('  ✗ ' + m); } };
const toasts = p => p.evaluate(() => [...document.querySelectorAll('.toast')].map(t => t.textContent));
(async () => {
  const b = await B.launchChromium(); const ctx = await b.newContext({ viewport: { width: 810, height: 1080 }, acceptDownloads: true }); const p = await ctx.newPage(); const errs = [];
  p.on('pageerror', e => errs.push(e.message)); p.on('console', m => { if(m.type() === 'error') errs.push('console: ' + m.text()); });
  const open = async (seed) => { await p.goto('file://' + path.join(__dirname, '..', 'index.html')); await p.evaluate(s => { localStorage.clear(); if(s) localStorage.setItem('melissaMathState_v4', s); }, seed || null); await p.reload(); await p.waitForTimeout(600); };

  console.log('▶ storage failure warns once, keeps working in memory, recovers');
  await open(fs.readFileSync(path.join(FIX, 'state-v4-progress.json'), 'utf8')); await p.evaluate(() => go('hub')); await p.waitForTimeout(300);
  await p.evaluate(() => { window.__realSet = Storage.prototype.setItem; Storage.prototype.setItem = function(){ throw new DOMException('quota', 'QuotaExceededError'); }; ACT.setFocus({ id: 'number' }); ACT.setFocus({ id: 'time' }); ACT.setFocus({ id: 'data' }); });
  let t = await toasts(p); ok(t.filter(x => /can.t be saved/.test(x)).length === 1, 'want exactly 1 warning for 3 failed saves, got ' + JSON.stringify(t));
  ok(await p.evaluate(() => S.focus) === 'data', 'state must keep working in memory after a failed save');
  await p.evaluate(() => { Storage.prototype.setItem = window.__realSet; ACT.setFocus({ id: 'time' }); });
  ok(await p.evaluate(() => JSON.parse(localStorage.getItem('melissaMathState_v4')).focus) === 'time', 'save must work again once storage recovers');
  await p.waitForTimeout(2800); await p.evaluate(() => { Storage.prototype.setItem = function(){ throw new Error('again'); }; ACT.setFocus({ id: 'number' }); });
  t = await toasts(p); ok(t.filter(x => /can.t be saved/.test(x)).length === 1, 'warning must come back after a recovery'); await p.evaluate(() => { Storage.prototype.setItem = window.__realSet; });

  console.log('▶ Export downloads the whole state; Import restores it');
  await open(fs.readFileSync(path.join(FIX, 'state-v4-progress.json'), 'utf8')); await p.evaluate(() => go('parent')); await p.waitForTimeout(400);
  const [dl] = await Promise.all([p.waitForEvent('download', { timeout: 5000 }).catch(() => null), p.evaluate(() => ACT.export())]);
  ok(!!dl, 'Export produced no download'); let exported = null;
  if(dl){ ok(/^matemagics-\d{4}-\d{2}-\d{2}\.json$/.test(dl.suggestedFilename()), 'odd file name ' + dl.suggestedFilename()); exported = fs.readFileSync(await dl.path(), 'utf8'); const o = JSON.parse(exported); const live = await p.evaluate(() => JSON.stringify(S)); ok(JSON.stringify(o) === live, 'exported file differs from live state'); }
  await open(); await p.evaluate(() => go('parent')); await p.waitForTimeout(300);
  if(exported){ const tmp = path.join(require('os').tmpdir(), 'matemagics-import-test.json'); fs.writeFileSync(tmp, exported); await p.setInputFiles('#imp', tmp); await p.waitForTimeout(600);
    const after = await p.evaluate(() => ({ stars: S.totalStars, medals: totalMedals(S), saved: JSON.parse(localStorage.getItem('melissaMathState_v4')).totalStars })); const src = JSON.parse(exported);
    ok(after.stars === src.totalStars && after.saved === src.totalStars, 'import did not restore/save the stars'); ok(after.medals > 0, 'import restored no medals'); }

  console.log('▶ Share sheet (Plan B for Export)');
  await open(fs.readFileSync(path.join(FIX, 'state-v4-progress.json'), 'utf8')); await p.evaluate(() => go('parent')); await p.waitForTimeout(300);
  ok(await p.evaluate(() => !!document.querySelector('[data-act=share]')), 'no Share button in the grown-ups area');
  await p.evaluate(() => { window.__shared = []; Object.defineProperty(navigator, 'canShare', { value: d => !!(d && d.files && d.files.length), configurable: true }); Object.defineProperty(navigator, 'share', { value: async d => { window.__shared.push({ n: d.files[0].name, t: d.files[0].type, text: await d.files[0].text() }); }, configurable: true }); ACT.share(); }); await p.waitForTimeout(400);
  const sh = await p.evaluate(() => window.__shared); ok(sh.length === 1, 'share called ' + sh.length + ' times'); if(sh.length){ ok(/^matemagics-\d{4}-\d{2}-\d{2}\.json$/.test(sh[0].n) && sh[0].t === 'application/json', 'bad shared file ' + sh[0].n + ' ' + sh[0].t); ok(JSON.parse(sh[0].text).totalStars === require(path.join(FIX, 'state-v4-progress.json')).totalStars, 'shared file has the wrong state'); }
  await p.evaluate(() => { Object.defineProperty(navigator, 'share', { value: async () => { const e = new Error('cancelled'); e.name = 'AbortError'; throw e; }, configurable: true }); ACT.share(); }); await p.waitForTimeout(300);
  ok((await toasts(p)).length === 0, 'cancelling the share sheet must not show an error: ' + JSON.stringify(await toasts(p)));
  await p.waitForTimeout(2800); await p.evaluate(() => { Object.defineProperty(navigator, 'canShare', { value: undefined, configurable: true }); ACT.share(); }); await p.waitForTimeout(300);
  ok((await toasts(p)).some(x => /usa Exportar/.test(x)), 'unsupported share must say to use Exportar');

  console.log('▶ corrupt saved state at boot');
  await open('{broken'); const boot = await p.evaluate(() => ({ scr: scr.name, backup: localStorage.getItem('melissaMathState_v4_backup'), text: document.getElementById('app').innerText.length }));
  ok(boot.scr === 'welcome' && boot.text > 20, 'app must start on the welcome screen with corrupt data, got ' + boot.scr); ok(boot.backup === '{broken', 'corrupt data must be kept in _backup');
  ok(errs.length === 0, 'page errors: ' + errs.slice(0, 3).join(' | ')); await b.close();
  console.log(fails ? '\n❌ SAFETY TEST FAILED (' + fails + ' of ' + checks + ' checks)' : '\n✅ SAFETY TEST PASSED (' + checks + ' checks)'); process.exit(fails ? 1 : 0);
})().catch(e => { console.log('SAFETY TEST CRASH ' + e.stack); process.exit(1); });
