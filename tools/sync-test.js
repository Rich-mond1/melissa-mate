#!/usr/bin/env node
/* SYNC TEST: two (or three) simulated devices talk to a fake private GitHub repo. Nothing earned may be lost or double counted, syncing must be repeatable
   (idempotent), the token must never be inside the progress, and offline / bad-token / wrong-repo / stale-file cases must fail safely. */
const L = require('./lib/load-engine'); const E = L(); let fails = 0, checks = 0;
const ok = (c, m) => { checks++; if(!c){ fails++; console.log('  ✗ ' + m); } };
const host = x => JSON.parse(JSON.stringify(x));
function sk(o){ if(Array.isArray(o)) return o.map(sk); if(o && typeof o === 'object'){ const r = {}; Object.keys(o).sort().forEach(k => r[k] = sk(o[k])); return r; } return o; }
const J = x => JSON.stringify(sk(host(x)));
const crypto = require('crypto');
// ---------- fake GitHub contents API ----------
function fakeRepo(){
  const files = {}; const log = { fail: null, calls: 0, stale: 0 };
  const sha = c => crypto.createHash('sha1').update(c).digest('hex');
  const res = (status, body, text) => ({ ok: status >= 200 && status < 300, status, json: async () => body, text: async () => text !== undefined ? text : JSON.stringify(body) });
  L.fetchImpl = async (url, o) => {
    log.calls++; o = o || {};
    if(log.fail === 'offline') throw new TypeError('Failed to fetch');
    if(log.fail) return res(log.fail, { message: 'x' });
    const m = /repos\/([^/]+\/[^/]+)\/contents\/(.*)$/.exec(url); if(!m) return res(404, {});
    if(m[1] !== 'Rich-mond1/matemagics-sync') return res(404, { message: 'Not Found' });
    if(!/^Bearer tok/.test(o.headers.Authorization)) return res(401, { message: 'Bad credentials' });
    const path = m[2];
    if((o.method || 'GET') === 'GET'){
      if(path === 'devices'){ const names = Object.keys(files); if(!names.length) return res(404, { message: 'Not Found' }); return res(200, names.map(n => ({ name: n.split('/')[1], path: n, type: 'file', sha: sha(files[n]) }))); }
      if(!(path in files)) return res(404, { message: 'Not Found' }); return res(200, null, files[path]);
    }
    const b = JSON.parse(o.body); const content = Buffer.from(b.content, 'base64').toString('utf8');
    if(log.stale > 0){ log.stale--; return res(409, { message: 'conflict' }); }
    if(path in files && b.sha !== sha(files[path])) return res(409, { message: 'sha mismatch' });
    if(!(path in files) && b.sha) return res(422, { message: 'no sha expected' });
    files[path] = content; return res(200, { content: { sha: sha(content) } });
  };
  return { files, log };
}
const cfgOf = (id, name) => ({ repo: 'Rich-mond1/matemagics-sync', token: 'tok_SECRET_123', deviceId: id, deviceName: name });
function Device(id, name, state){ const d = { cfg: cfgOf(id, name), S: E.mergeState(host(state)), meta: E.syncNewMeta(id, name), now: Date.parse('2026-10-23T10:00:00Z') };
  d.sync = async (opts) => { d.now += 60000; const r = await E.syncRun(d.cfg, d.S, d.meta, d.now, opts); d.S = r.state; d.meta = r.meta; return r; }; return d; }
const base = () => E.mergeState({ onboardingDone: true, name: 'Melissa' });
const skill = (medal, box, seen, extra) => Object.assign({ medal, box, seen, correct: seen, credit: seen, lessonDone: false, last: '2026-10-22', due: '2026-10-24', wobbly: false, placed: true }, extra || {});
function mk(over){ const s = base(); Object.assign(s, over); return s; }
const stick = (id, n) => ({ id, pet: '', v: 0, base: '🐢', acc: '', bg: 1, rarity: 'common', n: n || 1, date: '2026-10-21', legacy: false });

(async () => {
  // ---------- 1. first sync of two different profiles: nothing lost ----------
  { const R = fakeRepo();
    const A = Device('ipad', 'iPad', mk({ totalStars: 32, starBalance: 32, xp: 40, skills: { 'number-place-value': skill(1, 1, 2), 'addsub-bonds': skill(2, 3, 20, { triedOut: true, goldFrom: '2026-10-22' }) }, stickers: [stick('a.1')], tricks: ['t1'], badges: ['first'], owned: ['bg:sunset'],
      streak: { count: 1, lastPlayDate: '2026-10-22' }, errors: { 'x||why': { skill: 'x', why: 'why', n: 1, last: '2026-10-20' } } }));
    const B = Device('phone', 'Teléfono', mk({ totalStars: 178, starBalance: 117, xp: 516, packs: 1, skills: { 'number-place-value': skill(1, 2, 2), 'frac-read': skill(1, 2, 2), 'addsub-bonds': skill(1, 1, 3) }, stickers: [stick('a.1', 2), stick('b.2')], tricks: ['t2'], badges: ['first', 'medals5'], owned: ['top:overalls'],
      streak: { count: 3, lastPlayDate: '2026-10-23' }, errors: { 'x||why': { skill: 'x', why: 'why', n: 3, last: '2026-10-23' } } }));
    await A.sync(); const rB = await B.sync(); await A.sync();
    for(const D of [A, B]){ const S = D.S;
      ok(S.totalStars === 210 && S.starBalance === 149, 'stars should be 210/149, got ' + S.totalStars + '/' + S.starBalance);
      ok(S.xp === 556 && S.packs === 1, 'xp/packs ' + S.xp + '/' + S.packs); ok(S.level === E.levelFromXp(556), 'level not derived from xp');
      ok(S.skills['addsub-bonds'].medal === 2 && S.skills['addsub-bonds'].triedOut && S.skills['addsub-bonds'].goldFrom === '2026-10-22', 'best addsub-bonds record lost');
      ok(S.skills['number-place-value'].box === 2, 'place-value box should be 2'); ok(!!S.skills['frac-read'], 'frac-read lost');
      ok(S.stickers.length === 2 && S.stickers.filter(x => x.id === 'a.1')[0].n === 2, 'stickers not united'); ok(S.tricks.length === 2 && S.badges.length === 2 && S.owned.length === 2, 'tricks/badges/owned not united');
      ok(S.streak.count === 3 && S.streak.lastPlayDate === '2026-10-23', 'streak should be the newest'); ok(S.errors['x||why'].n === 3 && S.errors['x||why'].last === '2026-10-23', 'errors not merged'); }
    ok(J(A.S.skills) === J(B.S.skills), 'skills differ between devices after sync');
    // repeatable: syncing again and again changes nothing
    const snap = J(A.S); for(let i = 0; i < 3; i++){ await B.sync(); await A.sync(); }
    ok(J(A.S) === snap, 'syncing again changed the iPad state (not idempotent)'); ok(B.S.totalStars === 210 && B.S.starBalance === 149, 'phone stars drifted after repeats');
    // the token is only in the config, never in progress or in the remote files
    ok(!JSON.stringify(host(A.S)).includes('SECRET') && !Object.values(R.files).some(f => f.includes('SECRET')), 'token leaked into progress or repo files');
    ok(Object.keys(R.files).sort().join() === 'devices/ipad.json,devices/phone.json', 'each device must write only its own file: ' + Object.keys(R.files));
  }
  // ---------- 2. play and spend on both devices in parallel ----------
  { const R = fakeRepo(); const A = Device('ipad', 'iPad', mk({ totalStars: 100, starBalance: 100 })); const B = Device('phone', 'Teléfono', mk({ totalStars: 10, starBalance: 10 }));
    await A.sync(); await B.sync(); await A.sync();                       // both now 110/110
    ok(A.S.totalStars === 110 && B.S.totalStars === 110, 'initial total should be 110');
    A.S.totalStars += 20; A.S.starBalance += 20 - 50; A.S.owned.push('hat:crown');          // iPad: earns 20, buys a hat for 50
    B.S.totalStars += 7; B.S.starBalance += 7; B.S.xp += 30;                                   // phone: earns 7 and 30 xp
    await A.sync(); await B.sync(); await A.sync();
    ok(A.S.totalStars === 137 && B.S.totalStars === 137, 'total stars after parallel play ' + A.S.totalStars + '/' + B.S.totalStars);
    ok(A.S.starBalance === 87 && B.S.starBalance === 87, 'balance after parallel play ' + A.S.starBalance + '/' + B.S.starBalance);
    ok(A.S.xp === 30 && B.S.xp === 30, 'xp not summed'); ok(B.S.owned.includes('hat:crown'), 'purchase did not reach the phone');
    // both spend more than exists: balance is clamped at 0, never negative, never above total
    A.S.starBalance -= 80; B.S.starBalance -= 80; await A.sync(); await B.sync(); await A.sync();
    ok(A.S.starBalance >= 0 && A.S.starBalance <= A.S.totalStars && A.S.starBalance === B.S.starBalance, 'overspending broke the balance: ' + A.S.starBalance); }
  // ---------- 3. look and grown-up settings: the newest change wins, the first tie is explicit ----------
  { const R = fakeRepo(); const A = Device('ipad', 'iPad', mk({ theme: 'dino', shopMult: 1 })); const B = Device('phone', 'Teléfono', mk({ theme: 'rainbow', shopMult: 3 }));
    await A.sync(); const r1 = await B.sync({ onTie: 'remote' });
    ok(r1.notes.lookTie && r1.notes.setTie, 'a first-time difference must be reported as a tie'); ok(B.S.theme === 'dino' && B.S.shopMult === 1, 'onTie remote should adopt the iPad look');
    await A.sync(); ok(A.S.theme === 'dino', 'iPad kept its own look');
    B.S.theme = 'unicorn'; B.S.shopMult = 5; await B.sync(); await A.sync(); ok(A.S.theme === 'unicorn' && A.S.shopMult === 5, 'newer look / price multiplier did not reach the iPad');
    A.S.shopMult = 2; await A.sync(); await B.sync(); ok(B.S.shopMult === 2 && B.S.theme === 'unicorn', 'newest settings should win and the look stay'); }
  // ---------- 4. a third device and a device that joins late ----------
  { const R = fakeRepo(); const A = Device('ipad', 'iPad', mk({ totalStars: 50, starBalance: 50 })); const B = Device('phone', 'P', mk({ totalStars: 5, starBalance: 5 })); const C = Device('tablet', 'T', mk({ totalStars: 1, starBalance: 1 }));
    await A.sync(); await B.sync(); await C.sync(); await A.sync(); await B.sync();
    ok([A, B, C].every(d => d.S.totalStars === 56), 'three devices should total 56: ' + [A, B, C].map(d => d.S.totalStars)); }
  // ---------- 5. failures are safe ----------
  { const R = fakeRepo(); const A = Device('ipad', 'iPad', mk({ totalStars: 9, starBalance: 9 })); const before = JSON.stringify(host(A.S));
    R.log.fail = 'offline'; let e = null; try { await A.sync(); } catch(x){ e = x; } ok(e && e.kind === 'offline', 'offline should raise kind=offline'); ok(JSON.stringify(host(A.S)) === before, 'offline changed the state');
    R.log.fail = 401; e = null; try { await A.sync(); } catch(x){ e = x; } ok(e && e.kind === 'token', '401 should raise kind=token');
    R.log.fail = null; A.cfg.token = 'bad'; e = null; try { await A.sync(); } catch(x){ e = x; } ok(e && e.kind === 'token', 'bad token should raise kind=token'); A.cfg.token = 'tok_SECRET_123';
    A.cfg.repo = 'Rich-mond1/other'; e = null; try { await A.sync(); } catch(x){ e = x; } ok(e && e.kind === 'repo', 'wrong repo should raise kind=repo'); A.cfg.repo = 'Rich-mond1/matemagics-sync';
    R.log.stale = 1; e = null; try { await A.sync(); } catch(x){ e = x; } ok(!e && Object.keys(R.files).length === 1, 'a stale file (409) should be retried once and succeed: ' + (e && e.message));
    // junk in the repo is ignored, not crashing
    R.files['devices/junk.json'] = '{not json'; R.files['devices/old.json'] = JSON.stringify({ v: 2, state: {} }); R.files['devices/evil.json'] = JSON.stringify({ v: 1, deviceId: 'evil', own: { earned: 'x' }, state: {} });
    e = null; let r; try { r = await A.sync(); } catch(x){ e = x; } ok(!e, 'junk files must be ignored: ' + (e && e.message)); ok(A.S.totalStars === 9, 'junk files changed the stars: ' + A.S.totalStars); }
  // ---------- 6. the real exports from Melissa's two devices ----------
  { const fs = require('fs'), path = require('path'); const f = path.join(__dirname, 'fixtures');
    const names = fs.readdirSync(f).filter(x => /^state-v4-(progress|real).*\.json$/.test(x));
    if(names.length >= 2){ const R = fakeRepo(); const a = JSON.parse(fs.readFileSync(path.join(f, names[0]))), b = JSON.parse(fs.readFileSync(path.join(f, names[1])));
      const A = Device('ipad', 'iPad', a), B = Device('phone', 'P', b); const ea = A.S.totalStars, eb = B.S.totalStars;
      await A.sync(); await B.sync(); await A.sync(); ok(A.S.totalStars === ea + eb && B.S.totalStars === ea + eb, 'real fixtures: total stars should be the sum');
      ok(Object.keys(A.S.skills).length >= Math.max(Object.keys(a.skills || {}).length, Object.keys(b.skills || {}).length), 'real fixtures: skills lost'); } }
  console.log(fails ? '❌ SYNC TEST FAILED (' + fails + ' of ' + checks + ')' : '✅ SYNC TEST PASSED (' + checks + ' checks)'); process.exit(fails ? 1 : 0);
})();
