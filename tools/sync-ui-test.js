#!/usr/bin/env node
/* SYNC UI TEST: the parent-panel button, in two real browsers (iPad-sized and phone-sized) that talk to one fake private GitHub repo (network is intercepted: nothing leaves this machine). */
const path = require('path'), crypto = require('crypto'); const B = require('./lib/browser');
let fails = 0, checks = 0; const ok = (c, m) => { checks++; if(!c){ fails++; console.log('  ✗ ' + m); } };
const files = {}; const sha = c => crypto.createHash('sha1').update(c).digest('hex'); let TOKEN_OK = true;
const CORS = { 'access-control-allow-origin': '*', 'access-control-allow-headers': '*', 'access-control-allow-methods': '*' };
async function handler(route){
  const req = route.request(); if(req.method() === 'OPTIONS') return route.fulfill({ status: 204, headers: CORS });
  const m = /repos\/([^/]+\/[^/]+)\/contents\/(.*)$/.exec(req.url()); const json = (st, b) => route.fulfill({ status: st, headers: Object.assign({ 'content-type': 'application/json' }, CORS), body: JSON.stringify(b) });
  if(!m || m[1] !== 'Rich-mond1/matemagics-sync') return json(404, { message: 'Not Found' });
  if(!TOKEN_OK) return json(401, { message: 'Bad credentials' });
  const p = decodeURIComponent(m[2]);
  if(req.method() === 'GET'){
    if(p === 'devices'){ const n = Object.keys(files); return n.length ? json(200, n.map(x => ({ name: x.split('/')[1], path: x, type: 'file', sha: sha(files[x]) }))) : json(404, { message: 'Not Found' }); }
    return p in files ? route.fulfill({ status: 200, headers: Object.assign({ 'content-type': 'text/plain' }, CORS), body: files[p] }) : json(404, { message: 'Not Found' });
  }
  const b = JSON.parse(req.postData()); const c = Buffer.from(b.content, 'base64').toString('utf8');
  if(p in files && b.sha !== sha(files[p])) return json(409, {}); if(!(p in files) && b.sha) return json(422, {});
  files[p] = c; return json(200, { content: { sha: sha(c) } });
}
async function open(browser, opts, name){
  const ctx = await browser.newContext(opts); await ctx.route('https://api.github.com/**', handler); const p = await ctx.newPage(); const errs = []; p.on('pageerror', e => errs.push(e.message));
  await p.goto('file://' + path.join(__dirname, '..', 'index.html')); await p.evaluate(() => localStorage.clear()); await p.reload(); await p.waitForTimeout(400);
  return { ctx, p, errs, name };
}
const seed = (p, o) => p.evaluate(o => { S = mergeState(Object.assign({ onboardingDone: true }, o)); S.placement.started = true; S.placement.done = true; save(); go('parent'); }, o);
async function enable(d, devName){
  await d.p.evaluate(() => { document.getElementById('sy-token'); }); 
  await d.p.fill('#sy-token', 'github_pat_FAKE_TOKEN_1234567890abcdef'); await d.p.fill('#sy-name', devName); await d.p.click('[data-act=syncSave]'); await d.p.waitForTimeout(1200);
}
(async () => {
  const browser = await B.launchChromium(); const { defaultBrowserType, ...ipad } = B.devices['iPad (gen 7)']; const { defaultBrowserType: _d, ...phone } = B.devices['iPhone 13'];
  const A = await open(browser, { ...ipad, viewport: { width: 810, height: 1080 } }, 'ipad'), P = await open(browser, phone, 'phone');
  await seed(A.p, { totalStars: 40, starBalance: 40, theme: 'dino' }); await seed(P.p, { totalStars: 100, starBalance: 70, theme: 'dino' });
  ok(await A.p.evaluate(() => /Sincronizar dispositivos/.test(document.body.innerText)), 'the sync card is not in the parent panel');
  // bad input is refused with a message, nothing stored
  await A.p.fill('#sy-token', 'short'); await A.p.fill('#sy-name', 'iPad'); await A.p.click('[data-act=syncSave]'); await A.p.waitForTimeout(300);
  ok(await A.p.evaluate(() => !localStorage.getItem(SYNC_KEY)), 'a too-short token must not be stored');
  await enable(A, 'iPad de casa'); await enable(P, 'Teléfono de Camino');
  ok(await A.p.evaluate(() => !!JSON.parse(localStorage.getItem(SYNC_KEY)).cfg.token), 'iPad: config not stored'); ok(Object.keys(files).length === 2, 'both devices should have written their own file: ' + Object.keys(files));
  await A.p.evaluate(() => ACT.syncNow()); await A.p.waitForTimeout(1200);
  for(const d of [A, P]){ const st = await d.p.evaluate(() => ({ t: S.totalStars, b: S.starBalance })); ok(st.t === 140 && st.b === 110, d.name + ': stars should be 140/110, got ' + st.t + '/' + st.b); }
  ok(await P.p.evaluate(() => /Teléfono de Camino/.test(document.body.innerText) && /Última sincronización/.test(document.body.innerText)), 'phone: panel does not show the sync status');
  // the token never reaches the progress
  for(const d of [A, P]){ ok(await d.p.evaluate(() => !JSON.stringify(S).includes('FAKE_TOKEN') && !localStorage.getItem(STATE_KEY).includes('FAKE_TOKEN')), d.name + ': token leaked into the progress'); }
  ok(!Object.values(files).some(f => f.includes('FAKE_TOKEN')), 'token leaked into the repo');
  // the iPad earns and buys, the phone earns: after both sync they agree
  await A.p.evaluate(() => { S.totalStars += 10; S.starBalance += 10 - 25; S.owned.push('hat:crown'); save(); }); await P.p.evaluate(() => { S.totalStars += 5; S.starBalance += 5; save(); });
  await A.p.evaluate(() => ACT.syncNow()); await A.p.waitForTimeout(900); await P.p.evaluate(() => ACT.syncNow()); await P.p.waitForTimeout(900); await A.p.evaluate(() => ACT.syncNow()); await A.p.waitForTimeout(900);
  const fin = await Promise.all([A, P].map(d => d.p.evaluate(() => ({ t: S.totalStars, b: S.starBalance, hat: S.owned.includes('hat:crown') }))));
  ok(fin.every(x => x.t === 155 && x.b === 100 && x.hat), 'after play on both: 155/100 + hat on both, got ' + JSON.stringify(fin));
  // protections while syncing is on
  const before = await A.p.evaluate(() => JSON.stringify(S)); await A.p.evaluate(() => { window.confirm = () => true; ACT.reset(); }); await A.p.waitForTimeout(300);
  ok(await A.p.evaluate(b => JSON.stringify(S) === b, before), 'reset must be blocked while syncing is on');
  // offline: shows a clear message and keeps the progress
  await P.ctx.setOffline(true); await P.p.evaluate(() => { S.totalStars += 3; S.starBalance += 3; save(); ACT.syncNow(); }); await P.p.waitForTimeout(800);
  const off = await P.p.evaluate(() => ({ txt: document.body.innerText, t: S.totalStars })); ok(/Sin conexi/.test(off.txt), 'offline: no clear message'); ok(off.t === 158, 'offline: progress lost');
  await P.ctx.setOffline(false); await P.p.evaluate(() => { SYNC_LAST_AUTO = 0; ACT.syncNow(); }); await P.p.waitForTimeout(1000);
  await A.p.evaluate(() => ACT.syncNow()); await A.p.waitForTimeout(900); ok(await A.p.evaluate(() => S.totalStars) === 158, 'the offline gains must reach the iPad once online again');
  // wrong token: clear message, progress intact
  TOKEN_OK = false; await A.p.evaluate(() => ACT.syncNow()); await A.p.waitForTimeout(800); ok(await A.p.evaluate(() => /token/i.test(document.body.innerText) && S.totalStars === 158), 'bad token: message missing or progress changed'); TOKEN_OK = true;
  // off: the config disappears, progress stays
  await A.p.evaluate(() => { window.confirm = () => true; ACT.syncOff(); }); await A.p.waitForTimeout(300); ok(await A.p.evaluate(() => !localStorage.getItem(SYNC_KEY) && S.totalStars === 158), 'turning sync off must remove the config and keep the progress');
  ok(A.errs.length + P.errs.length === 0, 'page errors: ' + A.errs.concat(P.errs).slice(0, 3).join(' | '));
  await browser.close(); console.log(fails ? '❌ SYNC UI TEST FAILED (' + fails + ' of ' + checks + ')' : '✅ SYNC UI TEST PASSED (' + checks + ' checks)'); process.exit(fails ? 1 : 0);
})();
