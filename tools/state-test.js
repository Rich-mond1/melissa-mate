#!/usr/bin/env node
/* STATE SAFETY NET: nothing Melissa earned may be lost by load / save / export / import / migration.
   Runs the REAL engine against every tools/fixtures/state-v4-*.json (add a real export from the iPad there) plus v3, corrupt, future and hostile states. */
const fs = require('fs'), path = require('path'); const E = require('./lib/load-engine')();
const FIX = path.join(__dirname, 'fixtures'); let fails = 0, checks = 0;
const bad = m => { fails++; console.log('✗ ' + m); }; const ok = (c, m) => { checks++; if(!c) bad(m); };
const host = x => JSON.parse(JSON.stringify(x));                       // move objects into this realm so deepEqual is meaningful
const same = (a, b) => JSON.stringify(sortKeys(host(a))) === JSON.stringify(sortKeys(host(b)));
function sortKeys(o){ if(Array.isArray(o)) return o.map(sortKeys); if(o && typeof o === 'object'){ const r = {}; Object.keys(o).sort().forEach(k => r[k] = sortKeys(o[k])); return r; } return o; }
const storage = (init) => { const d = Object.assign({}, init || {}); return { d, getItem: k => (k in d ? d[k] : null), setItem: (k, v) => { d[k] = String(v); } }; };

// 1) every v4 fixture: nothing lost, stable under save/load/export/import
fs.readdirSync(FIX).filter(f => /^state-v4-.*\.json$/.test(f)).forEach(f => {
  const raw = fs.readFileSync(path.join(FIX, f), 'utf8'), src = JSON.parse(raw);
  const st = storage({ [E.STATE_KEY]: raw }); const S1 = E.loadState(st);
  ['totalStars', 'starBalance', 'xp', 'level', 'packs', 'goalReward', 'focus', 'theme', 'friend', 'name'].forEach(k => ok(same(S1[k], src[k]) || (src[k] === undefined), f + ': ' + k + ' changed on load (' + src[k] + ' -> ' + S1[k] + ')'));
  ok(S1.stickers.length === (src.stickers || []).length, f + ': stickers lost'); ok(S1.badges.length === (src.badges || []).length, f + ': badges lost');
  ok(S1.tricks.length === (src.tricks || []).length, f + ': tricks lost'); ok(S1.sessionLog.length === (src.sessionLog || []).length, f + ': session log lost');
  ok(S1.claims.length === (src.claims || []).length, f + ': prize claims lost'); ok(S1.rewards.length === (src.rewards || []).length, f + ': prizes lost');
  ok(same(S1.streak, src.streak), f + ': streak changed'); ok(same(S1.errors, src.errors || {}), f + ': error history changed');
  Object.keys(src.skills || {}).forEach(id => { ok(!!S1.skills[id], f + ': skill record lost ' + id); ['medal', 'box', 'seen', 'correct', 'due', 'last', 'wobbly', 'lessonDone'].forEach(k => ok(same(S1.skills[id] && S1.skills[id][k], src.skills[id][k]), f + ': ' + id + '.' + k + ' changed')); });
  ok(E.totalMedals(S1) === Object.keys(src.skills || {}).filter(id => E.SKILLS.some(s => s.id === id)).reduce((a, id) => a + (src.skills[id].medal || 0), 0), f + ': total medals differ');
  // save -> load cycle, and export -> import, must be a fixed point
  const st2 = storage(); st2.setItem(E.STATE_KEY, JSON.stringify(S1)); const S2 = E.loadState(st2); ok(same(S1, S2), f + ': save/load is not stable');
  const S3 = E.importState(JSON.parse(JSON.stringify(S1, null, 1))); ok(same(S1, S3), f + ': export/import is not stable');
  ok(same(E.mergeState(host(S1)), S1), f + ': mergeState is not idempotent');
});

// 2) v3 and v2 keys migrate; the old key is left untouched
{ const raw = fs.readFileSync(path.join(FIX, 'state-v3.json'), 'utf8'), src = JSON.parse(raw);
  for(const key of [E.V3_KEY, 'melissaMathState_v2']){
    const st = storage({ [key]: raw }); const S = E.loadState(st);
    ok(S.totalStars === 77 && S.starBalance === 40 && S.theme === 'dino' && S.stickers.length === 2 && S.streak.count === 2, key + ': v3 data lost on migration');
    ok(S.badges.indexOf('racha3') > -1 && S.badges.indexOf('unknown_old_badge') === -1, key + ': badge filtering wrong');
    ok(S.claims.length === 1 && S.rewards.length === 1 && S.sessionLog.length === 1 && S.prefs.likes[0] === 'contar', key + ': claims/prizes/log/prefs lost');
    ok(st.d[key] === raw, key + ': old data was modified'); ok(!(E.STATE_KEY in st.d), key + ': loadState must not write by itself');
  }
  ok(E.importState(src).totalStars === 77, 'importState(v3) does not migrate'); }

// 3) corrupt, empty and unreadable storage
{ const st = storage({ [E.STATE_KEY]: '{broken' }); const S = E.loadState(st);
  ok(S.totalStars === 0 && !S.onboardingDone, 'corrupt JSON must fall back to a blank state'); ok(st.d[E.STATE_KEY + '_backup'] === '{broken', 'corrupt JSON must be copied to _backup'); ok(st.d[E.STATE_KEY] === '{broken', 'corrupt original must not be deleted');
  ok(E.loadState(storage()).totalStars === 0, 'empty storage -> blank state');
  const boom = { getItem(){ throw new Error('denied'); }, setItem(){ throw new Error('denied'); } }; ok(E.loadState(boom).level === 1, 'unreadable storage -> blank state, no throw'); }

// 4) unknown / future / orphan data survives (KNOWN LIMITATION: v is always stamped 4; Phase 2 adds a separate dbVersion)
{ const src = host(E.mergeState(JSON.parse(fs.readFileSync(path.join(FIX, 'state-v4-progress.json'), 'utf8'))));
  src.v = 5; src.curriculum = { dbVersion: '2026.1' }; const probe = Object.keys(src.skills)[0]; src.skills[probe].futureField = 42; src.skills['retired-skill-id'] = { medal: 3, box: 4, seen: 9, correct: 8, credit: 8, lessonDone: true, last: '2026-10-01', due: '2026-10-20', wobbly: false, placed: false };
  const st = storage({ [E.STATE_KEY]: JSON.stringify(src) }); const S = E.loadState(st); const S2 = E.loadState((() => { const t = storage(); t.setItem(E.STATE_KEY, JSON.stringify(S)); return t; })());
  ok(S2.curriculum && S2.curriculum.dbVersion === '2026.1', 'unknown top-level field was dropped'); ok(S2.skills[probe].futureField === 42, 'unknown skill field was dropped'); ok(S2.skills['retired-skill-id'] && S2.skills['retired-skill-id'].medal === 3, 'orphan skill record was dropped');
  ok(S2.v === 4, 'characterisation: v is stamped 4 (if this changes, update the migration notes)');
  const base = E.mergeState(host(src)); delete base.skills['retired-skill-id']; ok(E.totalMedals(S) === E.totalMedals(base), 'orphan skill ids must not count as medals'); }

// 5) hostile states never throw and always come out well-formed (deterministic fuzz of mutated fixtures)
{ let seed = 12345; const rnd = n => { seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0; return seed % n; };
  const base = JSON.parse(fs.readFileSync(path.join(FIX, 'state-v4-progress.json'), 'utf8')); const junk = [null, undefined, NaN, -5, 1e12, 'x', '', [], {}, true, [1, 'a', null], { a: 1 }];
  const walk = (o, depth, out) => { if(o && typeof o === 'object' && depth < 3) Object.keys(o).forEach(k => { out.push([o, k]); walk(o[k], depth + 1, out); }); return out; };
  for(let i = 0; i < 400; i++){
    const s = JSON.parse(JSON.stringify(base)); const slots = walk(s, 0, []);
    for(let m = 0; m < 1 + rnd(6); m++){ const [o, k] = slots[rnd(slots.length)]; if(rnd(4) === 0) delete o[k]; else o[k] = junk[rnd(junk.length)]; }
    let S; try { S = E.loadState(storage({ [E.STATE_KEY]: JSON.stringify(s) })); S = E.importState(host(S)); E.totalMedals(S); E.SKILLS.forEach(k => E.strandProgress(S, k.strand)); } catch(e){ bad('fuzz #' + i + ' threw: ' + e.message); continue; }
    ok(['totalStars', 'starBalance', 'xp', 'packs'].every(k => Number.isFinite(S[k]) && S[k] >= 0) && S.level >= 1, 'fuzz #' + i + ': numbers not sane');
    ok(['stickers', 'badges', 'tricks', 'claims', 'rewards', 'sessionLog'].every(k => Array.isArray(S[k])) && S.rewards.length > 0, 'fuzz #' + i + ': lists not sane');
  } }

console.log(fails ? '\n❌ STATE TEST FAILED (' + fails + ' of ' + checks + ' checks)' : '\n✅ STATE TEST PASSED (' + checks + ' checks)');
process.exit(fails ? 1 : 0);
