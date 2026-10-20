#!/usr/bin/env node
/* Simulates learners through the whole curriculum with the REAL engine: no dead ends, no unreachable skills,
   medals progress, spaced review works, placement terminates. */
const fs = require('fs'), path = require('path'), vm = require('vm'); const root = path.join(__dirname, '..');
const files = ['src/core.js', 'src/visuals.js', ...fs.readdirSync(path.join(root, 'src/skills')).filter(f => f.endsWith('.js')).sort().map(f => 'src/skills/' + f), 'src/app/engine.js'];
const code = files.map(f => fs.readFileSync(path.join(root, f), 'utf8').replace(/^'use strict';/m, '').replace(/if\(typeof module !== 'undefined'\) module\.exports = \{[\s\S]*?\};?\n?/g, '')).join('\n;\n');
const sb = { console, Math, JSON, Object, Array, String, Number, Set, Map, RegExp, Error, isFinite, parseFloat, parseInt, Date }; vm.createContext(sb);
vm.runInContext(code + '\n;this.E = { goldWaiting, PET_VARIANTS, mergeState, rollSticker, SKILLS, STRANDS, defaultState, skillsOfStrand, isUnlocked, recommend, buildItems, applySkillResult, placementNextItem, placementRecord, placementDone, dueSkills, addDays, todayStr, medalOf, totalMedals, openPack, setSeed, mergeState, migrateV3, rng };', sb);
const E = sb.E; let fails = 0; const bad = m => { fails++; console.log('✗ ' + m); };
// pet stickers: 27 distinct, ids well-formed, legacy/garbage sanitised
{ const seenP = new Set(); let n = 0; for(let i = 0; i < 30000; i++){ const r = E.rollSticker([]); if(r.sticker.pet){ n++; seenP.add(r.sticker.id); if(!/^pet:(ginger|bimba|duck):[0-8]$/.test(r.sticker.id)) bad('bad pet id ' + r.sticker.id); } }
  if(seenP.size !== 27) bad('pet stickers unique=' + seenP.size + ' (want 27)'); if(n / 30000 < 0.06 || n / 30000 > 0.10) bad('pet rate ' + n / 30000);
  const ms = E.mergeState({ stickers: [{ id: 'pet:duck', pet: 'duck', base: '' }, { id: 'q', pet: 'bimba', v: 99, base: '' }] });
  if(ms.stickers[0].id !== 'pet:duck:0' || ms.stickers[1].id !== 'pet:bimba:0') bad('pet migration ' + JSON.stringify(ms.stickers.map(s => s.id))); }
E.setSeed(7);
const ids = new Set(E.SKILLS.map(s => s.id));
E.SKILLS.forEach(s => s.prereq.forEach(p => { if(!ids.has(p)) bad(s.id + ' unknown prereq ' + p); }));
E.SKILLS.forEach(s => { if(!E.STRANDS.some(t => t.id === s.strand)) bad(s.id + ' unknown strand ' + s.strand); });
// prereq cycle / reachability
const seen = new Set(); let prog = true; while(prog){ prog = false; E.SKILLS.forEach(s => { if(!seen.has(s.id) && s.prereq.every(p => seen.has(p))){ seen.add(s.id); prog = true; } }); }
E.SKILLS.forEach(s => { if(!seen.has(s.id)) bad(s.id + ' is unreachable (prereq cycle)'); });
// simulate learners
function learner(p, label){
  const S = E.defaultState(); let day = 0; const start = new Date(2026, 0, 1);
  const dstr = d => { const x = new Date(start.getTime() + d * 86400000); return x.getFullYear() + '-' + String(x.getMonth() + 1).padStart(2, '0') + '-' + String(x.getDate()).padStart(2, '0'); };
  let steps = 0;
  for(day = 0; day < 400; day++){
    const today = dstr(day);
    for(let sess = 0; sess < 3; sess++){
      const due = E.dueSkills(S, today); let kind, id;
      if(due.length && sess === 0){ kind = 'review'; }
      else { const r = E.recommend(S); if(!r) { kind = null; break; } id = r.skill.id; kind = r.step === 'learn' ? 'guided' : r.step; if(r.step === 'learn') S.skills[id] = Object.assign(S.skills[id] || { medal: 0, box: 0, seen: 0, correct: 0, credit: 0, lessonDone: false, last: null, due: null, wobbly: false }, { lessonDone: true }); }
      const items = E.buildItems(S, kind, id); if(!items.length){ continue; }
      const by = {}; items.forEach(it => { (by[it.skillId] = by[it.skillId] || []).push(Math.random() < p ? 1 : (Math.random() < 0.5 ? 0.6 : 0)); });
      Object.keys(by).forEach(k => E.applySkillResult(S, k, kind, by[k], today)); steps++;
    }
    if(!E.recommend(S) && E.dueSkills(S, today).length === 0 && E.goldWaiting(S).length === 0) break;   // gold now waits for a review on a later day
  }
  const gold = E.SKILLS.filter(s => E.medalOf(S, s.id) >= 3).length;
  console.log(label + ' p=' + p + ': finished day ' + day + ', gold ' + gold + '/' + E.SKILLS.length + ', medals ' + E.totalMedals(S));
  return { day, gold };
}
const strong = learner(0.92, 'strong'); if(strong.gold < E.SKILLS.length) bad('strong learner never reaches gold everywhere');
const mid = learner(0.75, 'medium'); if(mid.gold < E.SKILLS.length * 0.8) bad('medium learner stuck: gold ' + mid.gold);
const weak = learner(0.55, 'weak'); if(weak.gold < 1) bad('weak learner cannot earn anything');
// placement terminates for all-correct and all-wrong
[1, 0].forEach(c => { const S = E.defaultState(); let n = 0; while(E.placementNextItem(S) && n < 500){ const it = E.placementNextItem(S); E.placementRecord(S, it.skill.id, c); n++; } if(n >= 500) bad('placement did not terminate'); else console.log('placement all-' + (c ? 'right' : 'wrong') + ': ' + n + ' questions'); });
// migration keeps stars and stickers
const m = E.migrateV3({ strands: {}, totalStars: 50, starBalance: 20, stickers: ['🦄'], theme: 'ocean', onboardingDone: true });
if(m.starBalance !== 20 || m.stickers.length !== 1 || m.theme !== 'ocean') bad('migration');
// packs are unlimited
const S2 = E.defaultState(); S2.packs = 2000; let ok = 0; for(let i = 0; i < 2000; i++) if(E.openPack(S2)) ok++; if(ok !== 2000) bad('packs ran out'); else console.log('2000 packs opened, ' + S2.stickers.length + ' unique');
console.log(fails ? '❌ ENGINE TEST FAILED (' + fails + ')' : '✅ ENGINE TEST PASSED');
process.exit(fails ? 1 : 0);
