#!/usr/bin/env node
/* MATEMAGICS AUDITOR
   node tools/audit.js [--n 1500] [--skill id] [--strand name] [--quiet]
   For EVERY skill and EVERY tier it generates N questions with seeded RNG and
   checks: independent answer recompute, picture decode, option uniqueness,
   explanation consistency, variety, answer-position balance, lessons & tricks.
   Exit code 1 on any failure.                                                  */
const fs = require('fs'), path = require('path'), vm = require('vm');
const args = process.argv.slice(2); const get = (f, d) => { const i = args.indexOf(f); return i >= 0 ? args[i + 1] : d; };
const FILES = get('--files', null);
const N = +get('--n', 1500), ONLY = get('--skill', null), STRAND = get('--strand', null), QUIET = args.includes('--quiet');
const root = path.join(__dirname, '..');
const files = ['src/core.js', 'src/visuals.js'];
const skillDir = path.join(root, 'src/skills');
fs.readdirSync(skillDir).filter(f => f.endsWith('.js') && (!FILES || f.startsWith(FILES))).sort().forEach(f => files.push('src/skills/' + f));
// load everything into ONE shared sandbox so skills see core+visuals globals exactly as in the browser
const code = files.map(f => fs.readFileSync(path.join(root, f), 'utf8').replace(/^'use strict';/m, '')).join('\n;\n');
const sandbox = { console, Math, JSON, Object, Array, String, Number, Set, Map, RegExp, Error, isFinite, parseFloat, parseInt, module: undefined };
vm.createContext(sandbox);
vm.runInContext(code + '\n;this.__X = { SKILLS, makeQuestion, validateQuestion, validateSkillDef, setSeed, V, stripTags };', sandbox, { filename: 'bundle.js' });
const { SKILLS, makeQuestion, validateSkillDef, setSeed, V, stripTags } = sandbox.__X;

let failures = 0; const report = [];
function fail(where, msg){ failures++; report.push('✗ ' + where + ' :: ' + msg); }

const ids = new Set();
let list = SKILLS.filter(s => (!ONLY || s.id === ONLY) && (!STRAND || s.strand === STRAND));
list.forEach(sk => {
  if(ids.has(sk.id)) fail(sk.id, 'duplicate id'); ids.add(sk.id);
  validateSkillDef(sk, V).forEach(e => fail(sk.id + ' [definition]', e));
  if(!FILES) sk.prereq.forEach(p => { if(!SKILLS.some(s => s.id === p)) fail(sk.id, 'unknown prereq ' + p); });
  [1, 2, 3].forEach(tier => {
    setSeed(1000 + tier * 7919 + sk.id.length * 31);
    const seenErr = {}; let made = 0, none = 0; const prompts = new Set(), posCount = [0, 0, 0, 0], optCounts = {};
    const optSigs = new Set();
    for(let i = 0; i < N; i++){
      let q = null;
      // call gen directly (no retry) so EVERY invalid output is counted, not hidden by the retry
      try { q = sk.gen[tier](); q.skill = sk.id; q.tier = tier; }
      catch(e){ const k = 'THROW ' + e.message.slice(0, 90); seenErr[k] = (seenErr[k] || 0) + 1; none++; continue; }
      const errs = sandbox.__X.validateQuestion(q);
      if(errs.length){ errs.forEach(e => { const k = e.replace(/\d+/g, '#').slice(0, 140); seenErr[k] = (seenErr[k] || { c: 0, ex: e }); seenErr[k].c++; }); none++; continue; }
      made++;
      prompts.add(stripTags(q.prompt).slice(0, 80) + '|' + q.correctKey);
      if(q.type === 'mcq'){ posCount[q.correct]++; optSigs.add(q.options.map(o => o.key).sort().join(',')); }
      if(q.type === 'mcq' && q.options.length === 4) optCounts[4] = (optCounts[4] || 0) + 1;
    }
    Object.keys(seenErr).forEach(k => { const v = seenErr[k]; fail(sk.id + ' tier ' + tier, (typeof v === 'number' ? v + 'x ' + k : v.c + 'x ' + v.ex)); });
    if(made < N * 0.995) fail(sk.id + ' tier ' + tier, 'only ' + made + '/' + N + ' questions were valid (need >= 99.5%)');
    // variety: tiers must not be a handful of repeats
    const minVar = tier === 1 ? 8 : (tier === 2 ? 20 : 25);
    if(prompts.size < minVar) fail(sk.id + ' tier ' + tier, 'low variety: ' + prompts.size + ' distinct question/answer pairs (need >= ' + minVar + ')');
    // answer position balance for 4-option mcq
    const tot = posCount.reduce((a, b) => a + b, 0);
    if(tot > 200){ const n4 = optCounts[4] || 0; if(n4 > tot * 0.8){ posCount.forEach((c, p) => { const share = c / tot; if(share < 0.15 || share > 0.36) fail(sk.id + ' tier ' + tier, 'correct answer is in slot ' + (p + 1) + ' ' + Math.round(share * 100) + '% of the time (expected ~25%)'); }); } }
  });
});
if(!QUIET || failures){ report.slice(0, 120).forEach(r => console.log(r)); if(report.length > 120) console.log('… ' + (report.length - 120) + ' more'); }
console.log('\nSkills audited: ' + list.length + '   questions per tier: ' + N + '   total checked: ' + (list.length * 3 * N).toLocaleString());
console.log(failures ? '❌ AUDIT FAILED — ' + failures + ' problem(s)' : '✅ AUDIT PASSED — 0 problems');
process.exit(failures ? 1 : 0);
