#!/usr/bin/env node
/* NEW-CONTENT AUDIT: everything that is not a maths skill and is shown to Melissa: friends (text + art), note replies, puzzle names and pictures, the animal album,
   and every screen that shows them. Checks wording rules, the maths claims inside friend lines, art files, and real screens in a browser (no "undefined", no overflow,
   images load, no console errors). */
const fs = require('fs'), path = require('path'); const root = path.join(__dirname, '..'); const E = require('./lib/load-engine')(); const B = require('./lib/browser');
let fails = 0, checks = 0; const ok = (c, m) => { checks++; if(!c){ fails++; console.log('  ✗ ' + m); } };
const src = f => fs.readFileSync(path.join(root, f), 'utf8');
function wording(text, where){
  const t = String(text);
  ok(t.trim() === t && !/\s{2}/.test(t), where + ': stray spaces');
  ok(/^[A-Z“"0-9\p{Extended_Pictographic}]/u.test(t), where + ': should start with a capital: ' + t.slice(0, 20));
  ok(/[.!?✨”"]$|[\p{Extended_Pictographic}]$/u.test(t) || t.length < 30, where + ': should end with punctuation: ' + t.slice(-20));
  ok(!/undefined|NaN|null|\[object|<\/?[a-z]/i.test(t), where + ': leaked code or markup: ' + t);
  t.split(/(?<=[.!?])\s+/).forEach(s => ok(s.split(/\s+/).length <= 22, where + ': sentence too long for an 8-year-old: ' + s));
  ok(!/\b(?!ha\b)(\w+) \1\b/i.test(t), where + ': repeated word: ' + t);
}
console.log('▶ friends: data');
const ids = E.FRIENDS.map(f => f.id); ok(ids.length === 26 && new Set(ids).size === 26, '26 unique friends');
const art = src('src/app/friends-art.js'); const artIds = [...art.matchAll(/^ "([a-z]+)": "data:image\/webp;base64,/gm)].map(m => m[1]);
ok(ids.every(i => artIds.includes(i)) && artIds.length === ids.length, 'every friend has art and no art is orphaned: ' + artIds.filter(a => !ids.includes(a)).join(','));
const names = E.FRIENDS.map(f => f.name); ok(new Set(names).size === names.length, 'friend names are unique');
E.FRIENDS.forEach(f => { ['name', 'theme', 'line'].forEach(k => ok(typeof f[k] === 'string' && f[k].length > 2, f.id + ' has ' + k)); wording(f.line, 'friend ' + f.id + ' line'); ok(f.name.length <= 20 && f.theme.length <= 40, f.id + ': name/theme fit on a card'); });
console.log('▶ friends: the maths said in their lines is true');
const L = id => E.FRIENDS.find(f => f.id === id).line;
ok(/15 minutes/.test(L('tilly')) && 60 / 4 === 15, 'Tilly: a quarter of an hour is 15 minutes');
ok(/0 to 9/.test(L('rocco')), 'Rocco: digits are 0 to 9');
ok(/8, 16, 24, 32/.test(L('coral')) && 8 * 2 === 16 && 8 * 3 === 24 && 8 * 4 === 32 && /Eight arms/.test(L('coral')), 'Coral: eight arms, counting in eights');
ok(/6 sides/.test(L('bea')), 'Bea: hexagons have 6 sides');
ok(/8 equal slices/.test(L('zara')) && /eat 2/.test(L('zara')) && 8 - 2 === 6, 'Zara: 8 slices, eat 2 leaves 6 (6/8)');
ok(/3 pups|Three pups/.test(L('pups')) && /3 × 1/.test(L('pups')), 'Pups line is consistent');
ok(/1, 2, 3, 4/.test(L('starbeat')), 'Star Beat counts 1 to 4');
ok(/6 arms/.test(L('nevia')), 'Nevia: snowflakes have 6 arms');
ok(/5, 10, 15, 20/.test(L('hopper')) && 20 + 5 === 25, 'Hopper: counting in fives');
ok(/4 dancers/.test(L('mochi')) && /2 light sticks/.test(L('mochi')) && 4 * 2 === 8 && /= 8/.test(L('mochi')), 'Mochi: 4 x 2 = 8');
ok(/3 eyes/.test(L('zippy')) && /2 antennae/.test(L('zippy')) && 3 + 2 === 5 && /5 things/.test(L('zippy')), 'Zippy: 3 + 2 = 5');
ok(/5 flavours/.test(L('gus')) && /2 cones/.test(L('gus')) && 5 * 2 === 10 && /10 treats/.test(L('gus')), 'Gus: 5 x 2 = 10');
ok(/Double 7 is 14/.test(L('willow')) && 7 * 2 === 14, 'Willow: double 7 is 14');
ok(/1 metre is 100 centimetres/.test(L('mira')), 'Mira: 1 m = 100 cm');
ok(/3, 6, 9, 12/.test(L('juno')) && 3 * 4 === 12, 'Juno: counting in threes');
ok(/47/.test(L('orbit')) && /50/.test(L('orbit')) && Math.round(47 / 10) * 10 === 50, 'Orbit: 47 rounds to 50');
ok(/20/.test(L('lola')) && /30/.test(L('lola')) && 10 * 2 === 20 && 10 * 3 === 30, 'Lola: lines of 10');
ok(/quarter past 7/.test(L('sunny')) && /15 minutes/.test(L('sunny')) && 60 / 4 === 15, 'Sunny: quarter hour is 15 minutes');
console.log('▶ note replies, puzzle, album');
E.NOTE_REPLIES.forEach(r => { wording(r.text, 'reply ' + r.id); ok(r.text.length <= 24, r.id + ': fits on a button'); });
const pn = /PUZZLE_NAMES = \[(.*?)\];/s.exec(src('src/app/ui3.js')); const puz = pn ? [...pn[1].matchAll(/'([^']+)'/g)].map(m => m[1]) : [];
ok(puz.length === E.PUZZLE_PICS && new Set(puz).size === puz.length, 'one unique name per puzzle picture'); puz.forEach(n => ok(/^[A-Z]/.test(n) && n.length < 30, 'puzzle name: ' + n));
ok(E.CREATURES.length === new Set(E.CREATURES).size, 'no repeated animal in the album');
ok(E.CREATURES.every(c => !/[\u0000-\u007f]/.test(c)), 'album animals are all emoji');
(async () => {
  console.log('▶ screens in a real browser');
  const b = await B.launchChromium(); const errs = [];
  for(const vp of [{ width: 390, height: 844 }, { width: 820, height: 1180 }]){
    const p = await (await b.newContext({ viewport: vp })).newPage(); p.on('pageerror', e => errs.push(e.message)); p.on('console', m => { if(m.type() === 'error') errs.push('console: ' + m.text()); });
    await p.goto('file://' + path.join(root, 'index.html')); await p.evaluate(() => localStorage.clear()); await p.reload(); await p.waitForTimeout(250); await p.evaluate(() => { window.__noGuard = true; });
    const screens = await p.evaluate(() => {
      S = mergeState({ onboardingDone: true, placement: { done: true, started: true }, diag: { v: 1, done: true, strands: {}, results: {} }, starBalance: 60, totalStars: 100, puzzleBase: 0, packs: 2 }); save();
      S.met = FRIENDS.map(f => f.id); addNote(S, 'Estoy muy orgulloso de ti 💛', 'Papá', 'now'); const n2 = addNote(S, 'Another note', 'Mamá', 'now'); answerNote(S, n2.id, 'party');
      S.stickers = CREATURES.slice(0, 40).map((c, i) => ({ id: i + '.0.0.common', base: c, acc: '', bg: 0, rarity: 'common', n: 1, date: '2026-10-23', pet: '', v: 0 }));
      const list = ['hub', 'friends', 'stickers', 'parent', 'puzzle']; FRIENDS.forEach(f => list.push('friendMeet:' + f.id)); list.push('note:' + S.notes[0].id); return list; });
    const res = [];
    for(const s of screens){
      await p.evaluate(s => { if(s.startsWith('note:')){ go('note', { id: s.slice(5) }); } else go(s); }, s); await p.waitForTimeout(90);
      res.push(await p.evaluate(s => {
        const a = document.querySelector('#app'), t = a.innerText, out = [];
        if(/undefined|NaN|\[object|null\b/.test(t)) out.push('LEAK: ' + (t.match(/.{0,20}(undefined|NaN|\[object|null\b).{0,20}/) || [''])[0]);
        if(a.scrollWidth > a.clientWidth + 1) out.push('HSCROLL');
        a.querySelectorAll('img').forEach(i => { if(!i.complete || !i.naturalWidth) out.push('BROKEN-IMG ' + (i.alt || i.src.slice(0, 30))); });
        a.querySelectorAll('button,[data-act]').forEach(e => { const r = e.getBoundingClientRect(); if(r.width && r.right > document.documentElement.clientWidth + 1) out.push('OFF-SCREEN ' + (e.textContent || '').trim().slice(0, 20)); });
        return { s, out }; }, s));
    }
    res.forEach(r => ok(r.out.length === 0, vp.width + 'px ' + r.s + ': ' + r.out.join(' | ')));
    // every friend picture and puzzle picture really paints something
    const paint = await p.evaluate(async () => { const bad = []; for(const f of FRIENDS){ const im = new Image(); im.src = FRIEND_IMG[f.id]; await im.decode().catch(() => {}); if(im.naturalWidth !== 300 || im.naturalHeight !== 300) bad.push(f.id + ' ' + im.naturalWidth + 'x' + im.naturalHeight); } return bad; });
    ok(paint.length === 0, vp.width + 'px friend art is 300x300 and decodes: ' + paint.join(','));
  }
  ok(errs.length === 0, 'no console errors: ' + errs.slice(0, 3).join(' | ')); await b.close();
  console.log(fails ? '\n❌ NEW-CONTENT AUDIT FAILED (' + fails + ' of ' + checks + ')' : '\n✅ NEW-CONTENT AUDIT PASSED (' + checks + ' checks)'); process.exit(fails ? 1 : 0);
})();
