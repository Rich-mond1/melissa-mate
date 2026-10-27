#!/usr/bin/env node
/* MANAGE: parent can remove stars, friends and stickers by hand (undoable, blocked with sync). */
const path = require('path'); const B = require('./lib/browser'); let fails = 0, checks = 0;
const ok = (c, m) => { checks++; if(!c){ fails++; console.log('  ✗ ' + m); } };
(async () => {
  const b = await B.launchChromium(); const p = await (await b.newContext({ viewport: { width: 1180, height: 820 } })).newPage(); const errs = []; p.on('pageerror', e => errs.push(e.message)); p.on('dialog', d => d.accept());
  await p.goto('file://' + path.join(__dirname, '..', 'index.html')); await p.evaluate(() => localStorage.clear()); await p.reload(); await p.waitForTimeout(300);
  await p.evaluate(() => { window.__noGuard = true; S.starBalance = 120; S.met = FRIENDS.slice(0, 3).map(f => f.id); S.stickers = [0, 1, 2, 3].map(i => ({ id: i + '.0.0.common', base: '🐢', acc: '', bg: 0, rarity: 'common', n: 1, date: '2026-10-27', pet: '', v: 0 })); save(); go('parent'); }); await p.waitForTimeout(500);
  ok(await p.evaluate(() => /Quitar a mano/.test(document.body.innerText)), 'parent panel offers "Quitar a mano"');
  await p.evaluate(() => go('manage')); await p.waitForTimeout(500);
  ok(await p.evaluate(() => document.querySelectorAll('[data-act=mgFriend]').length === 3 && document.querySelectorAll('[data-act=mgSticker]').length === 4), 'one ✕ per friend (3) and per sticker (4)');
  await p.click('[data-act=mgStars][data-n="10"]'); ok(await p.evaluate(() => S.starBalance === 110), '−10 ⭐');
  await p.click('[data-act=mgStars][data-n=all]'); ok(await p.evaluate(() => S.starBalance === 0), 'remove all ⭐');
  const fid = await p.evaluate(() => S.met[1]); await p.click('[data-act=mgFriend][data-id="' + fid + '"]'); ok(await p.evaluate(f => S.met.length === 2 && S.met.indexOf(f) === -1, fid), 'one friend removed');
  await p.click('[data-act=mgSticker][data-i="0"]'); ok(await p.evaluate(() => S.stickers.length === 3 && S.stickers[0].id.startsWith('1.')), 'one sticker removed');
  ok(await p.evaluate(() => JSON.parse(localStorage.getItem(STATE_KEY)).stickers.length === 3), 'saved');
  ok(await p.evaluate(() => hasPrevious()), 'a copy was kept to undo');
  ok(errs.length === 0, 'no page errors ' + errs.join('|'));
  await b.close(); console.log(fails ? '\n❌ MANAGE TEST FAILED (' + fails + ' of ' + checks + ')' : '\n✅ MANAGE TEST PASSED (' + checks + ' checks)'); process.exit(fails ? 1 : 0);
})();
