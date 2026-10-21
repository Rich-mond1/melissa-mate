#!/usr/bin/env node
/* Builds a printable review sheet for a maths teacher: for every skill, the objective, the lesson text, the trick and 2 sample questions per tier with the right answer and the explanation the child sees.
   Usage: node tools/make-review-sheet.js [out.html]   (default: teacher-review.html in the current directory; not committed on purpose) */
const fs = require('fs'), path = require('path'); const E = require('./lib/load-engine')();
const db = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'curriculum', 'curriculum.json'), 'utf8')); const obj = {}; db.objectives.forEach(o => { obj[o.skillId] = o; });
const out = process.argv[2] || 'teacher-review.html'; const esc = s => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;');
E.setSeed(2026);
const TIER = { 1: 'Tier 1 · guided (picture / choose)', 2: 'Tier 2 · practice', 3: 'Tier 3 · challenge (typed or harder)' };
function qHTML(q){
  let h = '<div class="q"><div class="p">' + q.prompt + '</div>' + (q.visual ? '<div class="v">' + q.visual + '</div>' : '');
  if(q.type === 'mcq') h += '<ol type="A">' + q.options.map((o, i) => '<li' + (i === q.correct ? ' class="ok"' : '') + '>' + (q.optionsAreVisual ? '<span class="ov">' + o.label + '</span>' : o.label) + (i === q.correct ? ' ✓' : '') + '</li>').join('') + '</ol>';
  else if(q.type === 'num') h += '<p class="ans">Typed answer: <b>' + q.answer + (q.unit ? ' ' + q.unit : '') + '</b></p>';
  else h += '<p class="ans">Interactive (' + q.type + '): correct = <b>' + esc(q.correctKey) + '</b></p>';
  return h + '<p class="why"><b>Explanation shown to the child:</b> ' + (q.explain && q.explain.html ? q.explain.html : (typeof q.explain === 'string' ? q.explain : '')) + '</p>' + (q.hint ? '<p class="hint"><b>Hint:</b> ' + q.hint + '</p>' : '') + '</div>';
}
let body = '', toc = ''; let nQ = 0;
E.strandsWithSkills().forEach(str => {
  toc += '<h3>' + str.icon + ' ' + esc(str.name) + '</h3><ul>';
  body += '<h2 id="s-' + str.id + '">' + str.icon + ' ' + esc(str.name) + '</h2>';
  E.skillsOfStrand(str.id).forEach(sk => {
    const o = obj[sk.id] || {}; toc += '<li><a href="#' + sk.id + '">' + sk.emoji + ' ' + esc(sk.name) + '</a> <small>Y' + sk.year + '</small></li>';
    body += '<section id="' + sk.id + '"><h3>' + sk.emoji + ' ' + esc(sk.name) + ' <small>Year ' + sk.year + '</small></h3><p class="meta"><b>Objective:</b> ' + esc(o.objective || '') + ' · <b>Comes after:</b> ' + (sk.prereq.length ? sk.prereq.map(esc).join(', ') : 'nothing') + '</p>';
    body += '<details><summary>Lesson text (' + sk.lesson.steps.length + ' steps) and trick</summary><ol>' + sk.lesson.steps.map(s => '<li>' + s.say + (s.quiz ? '<br><i>Quick check:</i> ' + s.quiz.prompt + ' → ' + s.quiz.options.filter(x => x.ok).map(x => '<b>' + x.label + '</b>').join('') : '') + '</li>').join('') + '</ol><p><b>Trick — ' + esc(sk.trick.title) + ':</b> ' + sk.trick.say + '</p></details>';
    [1, 2, 3].forEach(t => { body += '<h4>' + TIER[t] + '</h4>'; for(let i = 0; i < 2; i++){ const q = sk.gen[t](); body += qHTML(q); nQ++; } });
    body += '<p class="cm">Teacher comment: ______________________________________________</p></section>';
  });
  toc += '</ul>';
});
const css = 'body{font-family:system-ui,Arial,sans-serif;max-width:900px;margin:24px auto;padding:0 16px;color:#222;line-height:1.4}h1{font-size:26px}h2{border-top:4px solid #7B4FC4;padding-top:14px;margin-top:36px;page-break-before:always}h3 small,li small{font-weight:400;color:#777}section{border:1px solid #ddd;border-radius:12px;padding:12px 16px;margin:16px 0;page-break-inside:avoid-page}.q{border-left:4px solid #C8CEEA;padding:4px 12px;margin:8px 0}.p{font-weight:700}.v svg{max-width:340px;height:auto}.ok{color:#0a7a3d;font-weight:700}.ov svg{width:90px;height:90px}.why{background:#F4F6FF;padding:6px 10px;border-radius:8px}.hint{color:#666}.meta{color:#555}h4{margin:14px 0 4px;color:#5b3fa8}.cm{margin-top:12px;color:#888}.toc{columns:2}@media print{.toc{columns:2;font-size:11px}}';
const intro = '<h1>Matemagics — question bank for teacher review</h1><p>This is a maths practice app for a Year 3 child (UK, 8 years old) that bridges into Year 4. It was written by a parent with an AI assistant, and the content has <b>not</b> been checked by a teacher. Every skill below shows the objective it targets, the lesson text, the “trick”, and two sample questions for each of three difficulty tiers, with the correct answer marked and the explanation the child sees.</p><p><b>What I would be grateful to know:</b> (1) is the objective at the right year group? (2) is the order of skills sensible? (3) is the vocabulary and the method the same as in school? (4) anything misleading, too easy or too hard? Please write on the sheet or send notes by skill name.</p><p><small>' + E.SKILLS.length + ' skills · sample questions are random and change every time the app runs; ' + nQ + ' shown here. Curriculum map and unit order are the parent’s reading of the school’s documents and are marked “unverified” in the data.</small></p><h2 style="page-break-before:avoid;border:0">Contents</h2><div class="toc">' + toc + '</div>';
fs.writeFileSync(out, '<!doctype html><html lang="en"><head><meta charset="utf-8"><title>Matemagics — teacher review</title><style>' + css + '</style></head><body>' + intro + body + '</body></html>');
const bad = /undefined|NaN|\[object/.test(fs.readFileSync(out, 'utf8')); console.log(out + ': ' + (fs.statSync(out).size / 1e6).toFixed(1) + ' MB, ' + E.SKILLS.length + ' skills, ' + nQ + ' questions' + (bad ? '  ⚠ contains undefined/NaN/[object]' : ''));
