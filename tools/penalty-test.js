/* Guess detector + parent penalty: pure-engine checks. */
const E = require('./lib/load-engine')(); let bad = 0; const ok = (c, m) => { if(!c){ bad++; console.log('  ✗ ' + m); } else console.log('  ✓ ' + m); };
ok(E.looksLikeGuess([1200]) === 1, 'answer in 1.2 s = guess');
ok(E.looksLikeGuess([9000]) === 0, 'answer in 9 s = not a guess');
ok(E.looksLikeGuess([9000, 1500]) === 1, 'quick re-tap after a wrong answer = guess');
ok(E.looksLikeGuess([9000, 6000]) === 0, 'thoughtful second try = not a guess');
ok(E.looksLikeGuess([]) === 0, 'no taps = not a guess');
const s = E.mergeState({}); const t = E.todayStr();
s.evidence = [];
for(let i = 0; i < 4; i++) E.recordEvidence(s, { d: t, s: 'geo-symmetry', k: 'practice', t: 1, c: 'f', r: 0, ms: 1500, g: 1 });
for(let i = 0; i < 4; i++) E.recordEvidence(s, { d: t, s: 'number-line-3digit', k: 'practice', t: 1, c: 'f', r: 0, ms: 12000, g: 0 });
E.recordEvidence(s, { d: t, s: 'geo-symmetry', k: 'placement', t: 1, c: 'f', r: 0, ms: 800, g: 1 });
const g = E.guessReport(s, t, 7);
ok(g.n === 8 && g.g === 4 && g.pct === 50, 'report counts practice only: 4 of 8 = 50% (got ' + g.g + '/' + g.n + ')');
ok(g.skills.length === 1 && g.skills[0].id === 'geo-symmetry', 'flags only the skill that is guessed');
ok(E.mergeState(JSON.parse(JSON.stringify(s))).evidence.filter(e => e.g).length === 5, 'g flag survives save/merge');
const p = E.mergeState({ starBalance: 444, totalStars: 770, met: ['a', 'b', 'c', 'd', 'e', 'f'].map((x, i) => E.FRIENDS[i].id), stickers: [] });
p.stickers = Array.from({ length: 9 }, (_, i) => ({ id: i + '.0.0.common', base: '🐢', acc: '', bg: 0, rarity: 'common', n: 1, date: t, pet: '', v: 0 }));
const r = E.applyPenalty(p, { stars: true, friends: 1 / 3, stickers: 1 / 3 }, Math.random);
ok(p.starBalance === 0 && r.stars === 444, 'all spendable stars removed');
ok(p.totalStars === 770, 'lifetime star total kept');
ok(r.friends.length === 2 && p.met.length === 4 && r.friends.every(x => p.met.indexOf(x) === -1), '1/3 of 6 friends removed (2)');
ok(r.stickers === 3 && p.stickers.length === 6, '1/3 of 9 stickers removed (3)');
const p2 = E.mergeState({ starBalance: 5, met: [E.FRIENDS[0].id, E.FRIENDS[1].id, E.FRIENDS[2].id] }); E.applyPenalty(p2, { friends: 1 / 2 }, Math.random);
ok(p2.met.length === 1 && p2.starBalance === 5, 'half of 3 friends rounds up to 2 removed; stars untouched when not asked');
const e0 = E.mergeState({ starBalance: 1, met: [] }); E.applyPenalty(e0, { stars: true, friends: 0.5, stickers: 0.5 }, Math.random); ok(e0.met.length === 0 && e0.stickers.length === 0, 'empty collections are fine');

// ---- removals travel between two synced devices (tombstones) ----
{
  const now0 = Date.now(), A = E.mergeState({ met: [E.FRIENDS[0].id, E.FRIENDS[1].id, E.FRIENDS[2].id], starBalance: 10, totalStars: 10 }); A.stickers = [0, 1].map(i => ({ id: i + '.0.0.common', base: '🐢', acc: '', bg: 0, rarity: 'common', n: 1, date: '2026-10-27', pet: '', v: 0 }));
  let mA = E.syncNewMeta('A', 'iPad'), mB = E.syncNewMeta('B', 'phone');
  const rA0 = E.syncMerge(A, mA, [], now0); mA = rA0.meta; const rB0 = E.syncMerge(E.mergeState({}), mB, [E.syncPayload(rA0.state, mA, now0)], now0 + 1); mB = rB0.meta;
  ok(rB0.state.met.length === 3 && rB0.state.stickers.length === 2, 'device B starts with everything from A');
  // grown-up removes on A
  const a1 = JSON.parse(JSON.stringify(rA0.state)); E.removeFriend(a1, E.FRIENDS[1].id, now0 + 10); E.removeSticker(a1, '0.0.0.common', now0 + 10); a1.starBalance = 0;
  const rA1 = E.syncMerge(a1, mA, [E.syncPayload(rB0.state, mB, now0 + 2)], now0 + 20); mA = rA1.meta;
  ok(rA1.state.met.indexOf(E.FRIENDS[1].id) === -1 && rA1.state.stickers.length === 1, 'removal is not undone by the other device\'s old copy');
  const rB1 = E.syncMerge(rB0.state, mB, [E.syncPayload(rA1.state, mA, now0 + 21)], now0 + 30); mB = rB1.meta;
  ok(rB1.state.met.length === 2 && rB1.state.met.indexOf(E.FRIENDS[1].id) === -1, 'friend removal reaches device B');
  ok(rB1.state.stickers.length === 1 && rB1.state.stickers[0].id === '1.0.0.common', 'sticker removal reaches device B');
  ok(rB1.state.starBalance === 0, 'star removal reaches device B (' + rB1.state.starBalance + ')');
  // she earns the same friend again later: not removed again
  const b2 = JSON.parse(JSON.stringify(rB1.state)); b2.met.push(E.FRIENDS[1].id); E.goneBack(b2, 'm:' + E.FRIENDS[1].id); b2.gone['m:' + E.FRIENDS[1].id].at = now0 + 100;
  const rA2 = E.syncMerge(rA1.state, mA, [E.syncPayload(b2, mB, now0 + 101)], now0 + 110);
  ok(rA2.state.met.indexOf(E.FRIENDS[1].id) > -1, 'a friend she meets again after the removal stays');
  ok(Object.keys(E.cleanGone({ 'x:1': { at: 1, on: true }, 'm:ok': { at: 5, on: 1 }, 'm:bad': { at: 'zz' } })).join() === 'm:ok', 'cleanGone keeps only valid entries');
}
console.log(bad ? '\n❌ PENALTY TEST FAILED (' + bad + ')' : '\n✅ PENALTY TEST PASSED'); process.exit(bad ? 1 : 0);
