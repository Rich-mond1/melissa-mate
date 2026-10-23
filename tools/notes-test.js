#!/usr/bin/env node
/* NOTES + CATEGORY PRICES: notes from the grown-ups (add / due / answer / clean / sync) and a different price multiplier per group (clothes, accessories, scenes, pet, boxes). */
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

console.log('▶ price per category');
let s = E.mergeState({ starBalance: 1000, totalStars: 1000, shopMult: 2, shopCat: { clothes: 8, box: 5, pet: 99, nonsense: 3 } });
ok(J(s.shopCat) === J({ box: 5, clothes: 8 }), 'invalid categories / multipliers dropped: ' + J(s.shopCat));
ok(E.slotCat('top') === 'clothes' && E.slotCat('hat') === 'acc' && E.slotCat('bg') === 'scene' && E.slotCat('phat') === 'pet', 'slots map to their group');
const topCost = E.avItem('top', 'hoodie').cost, hatCost = E.avItem('hat', 'crown').cost, bgCost = E.avItem('bg', 'sunset').cost, petCost = E.avItem('phat', 'pcrown').cost;
ok(E.avPrice(s, 'top', 'hoodie') === topCost * 8, 'clothes follow their own x8');
ok(E.avPrice(s, 'hat', 'crown') === hatCost * 2 && E.avPrice(s, 'bg', 'sunset') === bgCost * 2 && E.avPrice(s, 'phat', 'pcrown') === petCost * 2, 'groups without their own value follow the general x2');
ok(E.boxPrice(s) === E.BOX_COST * 5, 'box has its own price');
const before = s.starBalance; ok(E.avBuy(s, 'top', 'hoodie') === 'ok' && s.starBalance === before - topCost * 8, 'buying charges the group price');
ok(E.SHOP_MULTS.join() === '1,2,3,5,8' && E.mergeState({ shopMult: 8 }).shopMult === 8 && E.mergeState({ shopMult: 7 }).shopMult === 1, 'x8 is allowed, x7 is not');
ok(E.mergeState({}).shopCat && Object.keys(E.mergeState({}).shopCat).length === 0 && E.mergeState({ shopCat: [1, 2] }).shopCat && Object.keys(E.mergeState({ shopCat: [1, 2] }).shopCat).length === 0, 'default is empty, arrays are ignored');
ok(E.starEconomy(Object.assign(E.mergeState({}), { shopCat: { clothes: 8, acc: 8, scene: 8, pet: 8 } })).cheapest > E.starEconomy(E.mergeState({})).cheapest, 'star economy follows the groups');
const rt = E.importState(JSON.parse(JSON.stringify(s))); ok(J(rt.shopCat) === J(s.shopCat), 'export / import keeps the group prices');

console.log('▶ notes');
ok(E.addNote(E.mergeState({}), '   ', 'Papá', 'now', 1) === null, 'empty message refused');
s = E.mergeState({}); const n1 = E.addNote(s, '  Great job today!  ', 'Papá', 'now', 1000, () => 0.5);
ok(n1 && n1.text === 'Great job today!' && n1.from === 'Papá' && !n1.read && s.notes.length === 1, 'note added and trimmed');
const n2 = E.addNote(s, 'x'.repeat(500), 'y'.repeat(60), 'weird', 2000, () => 0.1); ok(n2.text.length === 300 && E.noteById(s, n2.id).from.length === 24 && E.noteById(s, n2.id).when === 'now', 'long text / name cut, unknown "when" becomes now');
ok(E.notesDue(s).length === 2, 'both "now" notes are due');
const nm = E.addNote(s, 'After your mission: ice cream!', 'Mamá', 'mission', 3000, () => 0.2); ok(E.notesDue(s).length === 2, '"after mission" is held back');
s.daily = { date: E.todayStr(), warmup: true, learn: true, boss: true, claimed: false, rounds: 3 }; ok(E.notesDue(s).length === 3, 'mission done: it is released');
s.daily.date = '2000-01-01'; ok(E.notesDue(s).length === 2, 'a mission done on another day does not count');
ok(E.answerNote(s, n1.id, 'nope') === null && !E.noteById(s, n1.id).read && E.answerNote(s, 'zzz', 'love') === null, 'unknown reply / note refused');
ok(E.answerNote(s, n1.id, 'love', 5000) && E.noteById(s, n1.id).reply === 'love' && E.noteById(s, n1.id).read && E.notesDue(s).length === 1, 'answering marks it read and gives the grown-up the answer');
E.noteById(s, n2.id).del = true; ok(E.notesDue(s).length === 0, 'deleted notes never show');
const c = E.cleanNotes([{ id: 'a', text: 'hi', reply: 'bogus', replyAt: 'x', date: 'bad' }, { id: 'a', text: 'dup' }, { id: 'b', text: '' }, null, 5, { text: 'no id' }]);
ok(c.length === 1 && c[0].reply === '' && c[0].replyAt === '' && c[0].date === '', 'junk dropped: duplicates, empty, no id, bogus reply');
const many = []; for(let i = 0; i < 100; i++) many.push({ id: 'n' + String(i).padStart(3, '0'), text: 't' + i, date: '2026-10-23' }); ok(E.cleanNotes(many).length === 60 && E.cleanNotes(many)[59].id === 'n099', 'capped at 60, newest kept');
ok(J(E.importState(JSON.parse(JSON.stringify(s))).notes) === J(s.notes), 'export / import keeps notes and answers');
ok(E.NOTE_REPLIES.length === 6 && E.NOTE_REPLIES.every(r => r.id && r.emoji && r.text), 'six ready-made answers');

console.log('▶ animal album');
ok(E.CREATURES.length === 64 && new Set(E.CREATURES).size === 64 && E.CREATURES[31] === '🦔' && E.CREATURES[0] === '🦄', 'creature list grew at the end only (old sticker ids keep their meaning)');
ok(E.albumStats(E.mergeState({})).have === 0 && E.albumStats(E.mergeState({ stickers: [{ id: 'x', base: '🦥', acc: '', bg: 0, rarity: 'common', n: 1, date: '2026-10-23', pet: '', v: 0 }, { id: 'y', base: '🦥', acc: '👑', bg: 1, rarity: 'rare', n: 1, date: '2026-10-23', pet: '', v: 0 }] })).have === 1, 'album counts each animal once');
console.log('▶ puzzle');
const zi = (ts, cur) => E.puzzleInfo(E.mergeState({ totalStars: ts, puzzleCur: cur || 0, puzzleBase: 0 }));
ok(zi(0).tiles === 0 && zi(0).toNext === 5 && zi(4).tiles === 0 && zi(4).toNext === 1 && zi(5).tiles === 1 && zi(59).tiles === 11 && !zi(59).complete && zi(60).complete && zi(60).tiles === 12 && zi(60).toNext === 0, 'one piece per 5 stars, 12 pieces make a picture');
ok(zi(60, 1).tiles === 0 && zi(125, 1).tiles === 12 && zi(125, 1).pic === 1 && zi(1000, 7).pic === 1, 'next picture starts from its own stars; pictures repeat after the last one');
ok(J(zi(25).shown) === J(E.PUZZLE_ORDER.slice(0, 5)) && new Set(E.PUZZLE_ORDER).size === 12, 'pieces turn over in a fixed scattered order');
s = E.mergeState({ totalStars: 59, puzzleBase: 0 }); ok(E.puzzleCollect(s) === false && s.puzzleCur === 0 && s.packs === 0, 'cannot collect an unfinished picture');
s.totalStars = 60; ok(E.puzzleCollect(s) === true && s.puzzleCur === 1 && s.packs === 1 && E.puzzleCollect(s) === false && s.packs === 1, 'collecting gives one pack, once');
ok(E.mergeState({ puzzleCur: -3 }).puzzleCur === 0 && E.mergeState({ puzzleCur: 'x' }).puzzleCur === 0 && E.mergeState({ puzzleCur: 9999 }).puzzleCur === 500 && E.importState(JSON.parse(JSON.stringify(s))).puzzleCur === 1, 'puzzle progress is validated and survives export / import');
ok(zi(0).tiles === 0, 'sanity');
{ const old = E.mergeState({ totalStars: 178 }); const z = E.puzzleInfo(old); ok(old.puzzleBase === 178 && z.tiles === 0 && !z.complete && z.toNext === 5, 'a save from before the puzzle starts at 0 pieces, not with the old stars as a gift');
  old.totalStars = 188; ok(E.puzzleInfo(old).tiles === 2, 'only stars earned from now on turn pieces over'); ok(E.mergeState(JSON.parse(JSON.stringify(old))).puzzleBase === 178, 'the starting point is kept when saved and loaded'); }
console.log('▶ notes and prices travel between devices');
(async () => {
  const R = fakeRepo(); const A = Device('ipad', 'iPad', base()), P = Device('phone', 'Phone', base());
  await A.sync(); await P.sync();
  const na = E.addNote(A.S, 'Hola Melissa', 'Papá', 'now', 1, () => 0.3); await A.sync(); await P.sync();
  ok(P.S.notes.length === 1 && P.S.notes[0].text === 'Hola Melissa', 'a note written on one device appears on the other');
  E.answerNote(P.S, na.id, 'party', Date.parse('2026-10-23T11:00:00Z')); await P.sync(); await A.sync();
  ok(A.S.notes[0].reply === 'party' && A.S.notes[0].read, 'her answer reaches the grown-up device');
  const nb = E.addNote(A.S, 'Segundo', 'Mamá', 'now', 2, () => 0.4); E.addNote(P.S, 'Tercero', 'Camino', 'now', 3, () => 0.5);
  await A.sync(); await P.sync(); await A.sync(); ok(A.S.notes.length === 3 && P.S.notes.length === 3 && J(A.S.notes) === J(P.S.notes), 'notes written at the same time on both devices are all kept');
  E.noteById(A.S, na.id).del = true; await A.sync(); await P.sync(); ok(E.noteById(P.S, na.id).del === true && E.noteById(P.S, na.id).reply === 'party', 'a deleted note stays deleted on the other device');
  await A.sync(); await A.sync(); ok(A.S.notes.length === 3, 'syncing again changes nothing');
  A.S.shopCat = { clothes: 8 }; await A.sync(); await P.sync(); ok(J(P.S.shopCat) === J({ clothes: 8 }), 'group prices set on one device reach the other');
  P.now = A.now + 600000; P.S.shopCat = {}; await P.sync(); await A.sync(); ok(J(A.S.shopCat) === J({}), 'newest price setting wins (cleared on the phone)');
  A.S.puzzleCur = 2; P.S.puzzleCur = 1; await A.sync(); await P.sync(); await A.sync(); ok(A.S.puzzleCur === 2 && P.S.puzzleCur === 2, 'puzzle progress: the furthest picture wins on both devices');
  const old = E.mergeState({ notes: undefined, shopCat: undefined }); ok(old.notes.length === 0 && Object.keys(old.shopCat).length === 0, 'a device file from before this version still loads');
  ok(!J(R.files).includes('tok_SECRET'), 'token is still never in the repo');

  console.log('▶ screens');
  const path = require('path'), Bw = require('./lib/browser'); const b = await Bw.launchChromium(); const ctx = await b.newContext({ viewport: { width: 390, height: 844 } }); const p = await ctx.newPage(); const errs = [];
  p.on('pageerror', e => errs.push(e.message)); p.on('console', m => { if(m.type() === 'error') errs.push('console: ' + m.text()); });
  await p.goto('file://' + path.join(__dirname, '..', 'index.html')); await p.evaluate(() => localStorage.clear()); await p.reload(); await p.waitForTimeout(300); await p.evaluate(() => { window.__noGuard = true; });
  await p.evaluate(() => { S = mergeState({ onboardingDone: true, placement: { done: true, started: true }, diag: { v: 1, done: true, strands: {}, results: {} }, starBalance: 100, totalStars: 100 }); save(); go('parent'); });
  await p.waitForTimeout(150);
  const txt = () => p.evaluate(() => document.body.innerText);
  let t = await txt(); ok(/Mensajes para Melissa/.test(t) && /Precio por tipo/.test(t) && /Ropa y pelo/.test(t) && /Cajas sorpresa/.test(t), 'grown-ups panel shows notes and group prices');
  await p.click('[data-act=shopCat][data-c=clothes][data-v="8"]'); ok(await p.evaluate(() => S.shopCat.clothes === 8 && catMult(S, 'clothes') === 8), 'tapping x8 on clothes sets it');
  await p.click('[data-act=shopCat][data-c=clothes][data-v="0"]'); ok(await p.evaluate(() => !('clothes' in S.shopCat)), 'tapping = goes back to the general price');
  await p.click('[data-act=noteSend]'); ok(await p.evaluate(() => S.notes.length === 0), 'empty message is not sent');
  await p.fill('#nt-from', 'Papá'); await p.fill('#nt-text', 'Estoy muy orgulloso de ti 💛 <b>x</b>'); await p.click('[data-act=noteSend]');
  ok(await p.evaluate(() => S.notes.length === 1 && S.notes[0].text.includes('<b>x</b>') && !document.querySelector('.card b[data-x]')), 'message is saved');
  ok(await p.evaluate(() => !document.body.innerHTML.includes('<b>x</b>') && document.body.innerText.includes('Aún sin abrir')), 'message text is escaped and shown as unread');
  await p.evaluate(() => go('hub')); await p.waitForTimeout(150); t = await txt(); if(!/A message for you/.test(t)) console.log(JSON.stringify(await p.evaluate(() => [scr.name, S.notes, notesDue(S).length])), t.slice(0, 200)); ok(/A message for you/.test(t) && /Papá left you a message/.test(t), 'hub shows the message card');
  await p.click('[data-act=noteOpen]'); await p.waitForTimeout(150); t = await txt();
  ok(/Estoy muy orgulloso de ti/.test(t) && /From\s+Papá/.test(t), 'note screen shows the text and who it is from');
  ok(await p.evaluate(() => !!document.querySelector('.nscene .nme svg') && !!document.querySelector('.nscene .npet .pw img') && document.querySelectorAll('[data-act=noteReply]').length === 6), 'she sees herself, her mascot and six answers');
  await p.click('[data-act=noteReply][data-r=love]'); await p.waitForTimeout(200); t = await txt();
  ok(/I love you!/.test(t) && /loves your answer/.test(t) && await p.evaluate(() => !!document.querySelector('.nscene .bubble') && !!document.querySelector('.npet.hop')), 'after answering: her bubble and her mascot reacting');
  ok(await p.evaluate(() => S.notes[0].read && S.notes[0].reply === 'love' && notesDue(S).length === 0), 'answer saved, nothing pending');
  await p.click('[data-act=go][data-to=hub]'); await p.waitForTimeout(150); ok(!/A message for you/.test(await txt()), 'the hub card is gone once answered');
  await p.evaluate(() => go('parent')); await p.waitForTimeout(150); t = await txt(); ok(/I love you!/.test(t) && await p.evaluate(() => !!document.querySelector('.prow .nscene.small svg')), 'grown-up sees her answer with her avatar and mascot');
  await p.evaluate(() => { addNote(S, 'Después de la misión', 'Mamá', 'mission'); save(); go('hub'); }); await p.waitForTimeout(150); ok(!/A message for you/.test(await txt()), '"after the mission" note is not shown yet');
  await p.evaluate(() => { ensureDaily(S); S.daily.boss = true; save(); go('hub'); }); await p.waitForTimeout(150); ok(/Mamá left you a message/.test(await txt()), '…and appears once today’s mission is done');
  await p.evaluate(() => go('parent')); await p.click('[data-act=noteDel]'); ok(await p.evaluate(() => S.notes.filter(n => !n.del).length === 1), 'grown-up can delete a note');
  await p.evaluate(() => go('note', { id: 'ghost' })); await p.waitForTimeout(100); ok(await p.evaluate(() => scr.name === 'hub'), 'a missing note goes back to the hub');
  console.log('▶ puzzle screen');
  const art = await p.evaluate(() => { let bad = 0; for(let i = 0; i < PUZZLE_PICS; i++){ const d = new DOMParser().parseFromString(puzzleSVG(i, [0, 5]), 'image/svg+xml'); if(d.querySelector('parsererror')) bad++; } return bad; });
  ok(art === 0, 'all pictures are valid SVG');
  await p.evaluate(() => { S.totalStars = 27; S.puzzleBase = 0; S.puzzleCur = 0; save(); go('hub'); }); await p.waitForTimeout(120); ok(/Puzzle 5\/12/.test(await txt()), 'hub shows puzzle progress');
  await p.evaluate(() => go('puzzle')); await p.waitForTimeout(120); t = await txt(); ok(/5 \/ 12 pieces/.test(t) && /3 ⭐ more/.test(t) && await p.evaluate(() => !!document.querySelector('svg.puz') && !document.querySelector('[data-act=puzzleCollect]')), 'puzzle screen: pieces and stars to the next one');
  await p.screenshot({ path: '/tmp/puzzle-partial.png' });
  await p.evaluate(() => { S.totalStars = 60; S.puzzleBase = 0; S.packs = 0; save(); go('puzzle'); }); await p.waitForTimeout(120); ok(/finished it/.test(await txt()), 'finished picture offers the sticker pack');
  await p.click('[data-act=puzzleCollect]'); await p.waitForTimeout(150); ok(await p.evaluate(() => S.puzzleCur === 1 && S.packs === 1) && /0 \/ 12 pieces/.test(await txt()), 'collecting moves to the next picture');
  console.log('▶ mascot reacts to answers');
  await p.evaluate(() => { for(let i = 0; i < 30; i++){ startSession('practice', 'logic-sorting'); if(SESS.q && SESS.q.type === 'mcq') break; } });
  await p.waitForTimeout(400); ok(await p.evaluate(() => SESS.q.type === 'mcq' && !document.querySelector('.petfb')), 'no mascot reaction before she answers');
  await p.evaluate(() => { const q = SESS.q; const c = q.options.findIndex(o => o.key === q.correctKey); document.querySelector('[data-act=pick][data-k="' + c + '"]').click(); }); await p.waitForTimeout(250);
  ok(await p.evaluate(() => !!document.querySelector('.petfb.ok .pfp .pw img') && !!document.querySelector('.petfb.ok .feedback.ok') && SESS.run === 1), 'right answer: the mascot celebrates beside the praise');
  await p.evaluate(() => { SESS.run = 2; ACT.qnext && 0; });
  await p.evaluate(() => { for(let i = 0; i < 30; i++){ startSession('practice', 'logic-sorting'); if(SESS.q && SESS.q.type === 'mcq') break; } }); await p.waitForTimeout(400);
  for(let i = 0; i < 8 && !(await p.evaluate(() => SESS.phase === 'fb')); i++){ await p.evaluate(() => { if(SESS.phase === 'fb') return; const q = SESS.q; const ks = [...document.querySelectorAll('[data-act=pick]:not([disabled])')].map(b => Number(b.dataset.k)).filter(k => q.options[k].key !== q.correctKey); if(ks.length) document.querySelector('[data-act=pick][data-k="' + ks[0] + '"]').click(); }); await p.waitForTimeout(400); }
  await p.waitForTimeout(300);
  ok(await p.evaluate(() => !!document.querySelector('.petfb') && !document.querySelector('.petfb.ok') && !!document.querySelector('.petfb.no .pfp .pw img') && SESS.run === 0), 'wrong answer: the mascot stays with her and the streak resets');
  ok(errs.length === 0, 'no console errors: ' + errs.join(' | ')); await b.close();
  console.log(fails ? '\n❌ NOTES TEST FAILED (' + fails + ' of ' + checks + ')' : '\n✅ NOTES TEST PASSED (' + checks + ' checks)'); process.exit(fails ? 1 : 0);
})();
