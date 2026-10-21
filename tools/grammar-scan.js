#!/usr/bin/env node
/* GRAMMAR SCAN: generates questions for every skill/tier and flags number/noun disagreement ("1 pencils", "2 apple"), "a 1", "1 more things" etc.
   node tools/grammar-scan.js [--n 400] [--list]  — exit 1 when anything is found. */
const fs = require('fs'), path = require('path'), vm = require('vm'); const root = path.join(__dirname, '..');
const args = process.argv.slice(2), N = +(args[args.indexOf('--n') + 1] || 400), LIST = args.includes('--list');
const files = ['src/core.js', 'src/visuals.js', ...fs.readdirSync(path.join(root, 'src/skills')).filter(f => f.endsWith('.js')).sort().map(f => 'src/skills/' + f)];
const sb = { console, Math, JSON, Object, Array, String, Number, Set, Map, RegExp, Error, isFinite, parseFloat, parseInt }; vm.createContext(sb);
vm.runInContext(files.map(f => fs.readFileSync(path.join(root, f), 'utf8').replace(/^'use strict';/m, '')).join('\n;\n') + '\n;this.__X = { SKILLS, makeQuestion, setSeed, stripTags };', sb);
const { SKILLS, makeQuestion, setSeed, stripTags } = sb.__X;
// plural-looking nouns that are legitimately singular after 1, or are not nouns at all
const OK = new Set(['plus', 'minus', 'times', 'less', 'across', 'always', 'sometimes', 'perhaps', 'thus', 'bus', 'gas', 'glass', 'grass', 'cross', 'dress', 'class', 'lens', 'is', 'was', 'has', 'this', 'its', 'yes', 'as', 'us', 'does', 'goes', 'makes', 'needs', 'gets', 'wants', 'cats’', 'shows', 'says', 'passes', 'fits', 'goes', 'matches', 'costs', 'means', 'makes', 'looks', 'comes', 'takes', 'gives', 'leaves', 'uses', 'hundreds', 'tens', 'ones', 'thousands', 'quarters', 'halves', 'thirds', 'fifths', 'sixths', 'eighths', 'tenths', 'fourths', 'sevenths', 'ninths', 'twelfths', 'hundredths', 'seconds', 'minutes', 'hours', 'metres', 'cm', 'mm', 'km', 'kg', 'g', 'ml', 'l']);
const found = {}; let total = 0;
const SKIP = /there are|we are|ones \d+ (are|do)|sticker books|Pattern \d+ uses|After the \d|From 0 to 1/;   // legitimate: the number is a label or a digit, not a count
function check(text, where){
  const t = stripTags(String(text)).replace(/\s+/g, ' ');
  let m; const re = /\b(?:1|one|1\.0)\s+([a-zA-Z’']+)/g;
  while((m = re.exec(t))){ const w = m[1].toLowerCase(); if(/s$/.test(w) && !/(ss|us|is)$/.test(w) && !OK.has(w) && w.length > 3){ const k = w + ' :: ' + where, ex = t.slice(Math.max(0, m.index - 20), m.index + 45); if(!SKIP.test(ex)) (found[k] = found[k] || []).push(ex); } }
  const re2 = /\b(?:[2-9]|1[0-9]|[2-9]\d)\s+([a-zA-Z]+)\b/g;
  while((m = re2.exec(t))){ const w = m[1].toLowerCase(); if(!/s$/.test(w) && /^(pencil|apple|sweet|sticker|book|cake|biscuit|marble|toy|bag|ball|flower|child|stamp|card|cookie|shell|balloon|bead|cube|block|pen|bird|dog|cat|egg|bun|pie|pizza|banana|pear|stone|button|bottle|cup|plate|shelf|page|chapter|lesson|player|team|row|column|tile)$/.test(w)){ const k = w + ' (singular after number) :: ' + where, ex = t.slice(Math.max(0, m.index - 20), m.index + 45); if(!SKIP.test(ex)) (found[k] = found[k] || []).push(ex); } }
  const z = /\b(?:has|have|with|buys|bought|gives|gave|got|ate|eats|takes|took|wants|needs|pays|paid|more|each)\s+(?:0|zero)\s+[a-z]+/i.exec(t); if(z && !/^geo-|explain/.test(where) && !/0 (?:pence|p\b)/.test(z[0])) (found['zero-quantity story :: ' + where] = found['zero-quantity story :: ' + where] || []).push(t.slice(Math.max(0, z.index - 20), z.index + 50));
  const re3 = /(?<![\d./])\b(?:1|one)\s+(?:more\s+)?(?:\w+\s+){0,2}(are|were)\b/g;
  while((m = re3.exec(t))){ const k = 'verb agreement (1 are/were/have) :: ' + where; { const ex = t.slice(Math.max(0, m.index - 25), m.index + 45); if(!SKIP.test(ex)) (found[k] = found[k] || []).push(ex); } }
}
SKILLS.forEach(sk => { for(let tier = 1; tier <= 3; tier++){ setSeed(1000 + tier); for(let i = 0; i < N; i++){ let q; try { q = makeQuestion(sk, tier); } catch(e){ continue; } if(!q) continue; total++; check(q.prompt, sk.id + ' t' + tier); (q.options || []).forEach(o => check(o.label || '', sk.id + ' opt')); if(q.explain) check(q.explain, sk.id + ' explain'); if(q.explanation) check(q.explanation, sk.id + ' explain'); } } });
const keys = Object.keys(found).sort();
keys.forEach(k => console.log((LIST ? '' : '') + '✗ ' + k + '  ×' + found[k].length + '  e.g. “' + found[k][0] + '”'));
console.log(keys.length ? '\n❌ GRAMMAR SCAN: ' + keys.length + ' pattern(s) in ' + total + ' questions' : '\n✅ GRAMMAR SCAN PASSED (' + total + ' questions)'); process.exit(keys.length ? 1 : 0);
