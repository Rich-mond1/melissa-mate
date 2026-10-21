#!/usr/bin/env node
/* Phase 7: parent metrics (coverage / accuracy / fluency / mastery kept apart), weekly summary text, backup reminder, import confirmation + undo, in a real browser. */
const path = require('path'), fs = require('fs'); const E = require('./lib/load-engine')(); const B = require('./lib/browser');
let fails = 0, checks = 0; const ok = (c, m) => { checks++; if(!c){ fails++; console.log('  ✗ ' + m); } }; const text = p => p.evaluate(() => document.body.innerText);
const today = E.todayStr(), ago = n => E.addDays(today, -n);
const ev = (id, c, d, o) => Object.assign({ d: ago(d), s: id, k: 'practice', t: 2, c: c, h: c === 'a' ? 1 : 0, r: 0, ms: 8000, w: '' }, o || {});
console.log('▶ engine: the four measures are different things');
{ const S = E.mergeState({ onboardingDone: true });
  E.SKILLS.slice(0, 5).forEach(s => { S.skills[s.id] = { medal: 1, box: 1, seen: 5, correct: 5, credit: 5, lessonDone: true, last: null, due: null, wobbly: false, placed: false }; });
  const id = E.SKILLS[0].id; S.evidence = []; for(let i = 0; i < 6; i++) S.evidence.push(ev(id, 'f', 1)); for(let i = 0; i < 3; i++) S.evidence.push(ev(id, 'a', 2)); for(let i = 0; i < 1; i++) S.evidence.push(ev(id, 'x', 3));
  S.evidence.push(ev(id, 'f', 1, { k: 'placement' }));   // placement answers are not evidence of independent accuracy
  S.evidence.push(ev(id, 'f', 20));                      // outside both windows
  let m = E.parentMetrics(S, today);
  ok(m.accuracy.week.n === 10, 'week has the 10 answers (placement and old ones excluded), got ' + m.accuracy.week.n);
  ok(Math.abs(m.accuracy.week.indep - 0.6) < 1e-9 && Math.abs(m.accuracy.week.helped - 0.3) < 1e-9 && Math.abs(m.accuracy.week.correct - 0.9) < 1e-9, 'independent 60%, helped 30%, correct 90%: ' + JSON.stringify(m.accuracy.week));
  ok(m.coverage.bronze === 5 && m.coverage.total === E.SKILLS.length && m.levels[2] === 5 && m.levels[0] === E.SKILLS.length - 5, 'coverage and levels count skills, not answers');
  ok(m.fluency.n === 6 && m.fluency.medianSec === 8 && m.fluency.fastShare === 1, 'fluency uses only independent correct answers: ' + JSON.stringify(m.fluency));
  ok(m.week.days === 3 && m.week.questions === 10 && m.week.minutes === 1, 'week: days, questions, minutes: ' + JSON.stringify([m.week.days, m.week.questions, m.week.minutes]));
  ok(m.coverage.byYear[3] && m.coverage.byYear[3].total > 0, 'coverage by year');
  const sum = E.summaryText(S, today); ok(/Acierto sin ayuda/.test(sum) && /60%/.test(sum) && /90%/.test(sum) && /Cobertura: 5 de/.test(sum), 'summary text states both rates and the coverage'); ok(!/undefined|NaN|null/.test(sum), 'summary text has no undefined/NaN/null');
  // slow answers
  S.evidence = [ev(id, 'f', 1, { ms: 30000 }), ev(id, 'f', 1, { ms: 12000 }), ev(id, 'f', 1, { ms: 20000 })]; m = E.parentMetrics(S, today); ok(m.fluency.medianSec === 20 && Math.abs(m.fluency.fastShare - 1 / 3) < 1e-9, 'median of an odd list, fast share');
  S.evidence = []; m = E.parentMetrics(S, today); ok(m.accuracy.week.indep === null && m.fluency.n === 0 && m.week.questions === 0, 'empty evidence gives nulls, not zeros'); ok(!/undefined|NaN|null/.test(E.summaryText(S, today)), 'empty summary is clean');
  S.evidence = []; for(let i = 0; i < 6; i++) S.evidence.push(ev(id, 'x', 1)); for(let i = 0; i < 5; i++) S.evidence.push(ev(E.SKILLS[1].id, 'f', 1)); m = E.parentMetrics(S, today);
  ok(m.week.weak.length === 1 && m.week.weak[0].id === id && m.week.strong[0].id === E.SKILLS[1].id, 'strongest and weakest skills of the week'); }
console.log('▶ engine: backup reminder');
{ const S = E.mergeState({ onboardingDone: true }); ok(!E.parentMetrics(S, today).backup.overdue, 'a new player with no progress is not nagged');
  for(let i = 0; i < 40; i++) S.evidence.push(ev(E.SKILLS[0].id, 'f', 1)); let b = E.parentMetrics(S, today).backup; ok(b.overdue && b.last === null, 'progress and never a backup: reminder');
  S.lastBackup = ago(3); b = E.parentMetrics(S, today).backup; ok(!b.overdue && b.daysAgo === 3, 'backup 3 days ago: no reminder');
  S.lastBackup = ago(E.BACKUP_DAYS); b = E.parentMetrics(S, today).backup; ok(b.overdue, 'backup 7 days ago: reminder');
  ok(E.mergeState({ lastBackup: 'tomorrow-ish' }).lastBackup === null && E.mergeState({ lastBackup: '2026-10-20' }).lastBackup === '2026-10-20', 'lastBackup is validated on load'); }
console.log('▶ the real export still loads and reports sensibly');
{ const o = JSON.parse(fs.readFileSync(path.join(__dirname, 'fixtures', 'state-v4-real-2026-10-20.json'), 'utf8')); const S = E.mergeState(o); const m = E.parentMetrics(S, '2026-10-20'); ok(m.coverage.bronze === 21, 'real state: 21 bronze skills, got ' + m.coverage.bronze); ok(!/undefined|NaN|null/.test(E.summaryText(S, '2026-10-20')), 'real state summary is clean'); }
(async () => {
  const b = await B.launchChromium(); const ctx = await b.newContext({ viewport: { width: 810, height: 1080 }, permissions: ['clipboard-read', 'clipboard-write'] }); const p = await ctx.newPage(); const errs = [];
  p.on('pageerror', e => errs.push(e.message)); p.on('console', m => { if(m.type() === 'error') errs.push('console: ' + m.text()); });
  await p.goto('file://' + path.join(__dirname, '..', 'index.html')); await p.evaluate(() => { localStorage.clear(); window.__noGuard = true; }); await p.reload(); await p.evaluate(() => { window.__noGuard = true; });
  const seed = () => p.evaluate(() => { S = mergeState({ onboardingDone: true, placement: { done: true, strandIdx: 999 } }); ['number-place-value', 'number-compare-order'].forEach(id => { S.skills[id] = { medal: 1, box: 1, seen: 8, correct: 8, credit: 8, lessonDone: true, last: null, due: null, wobbly: false, placed: false }; });
    for(let i = 0; i < 40; i++) recordEvidence(S, { d: addDays(todayStr(), -(i % 5)), s: 'number-place-value', k: 'practice', t: 2, c: i % 4 === 0 ? 'a' : 'f', h: i % 4 === 0, r: 0, ms: 9000, w: '' }); S.sessionLog.push({ date: todayStr(), kind: 'practice', strand: 'number', skill: 'number-place-value', correct: 5, total: 6, credit: 0.9, mood: 'happy' }); save(); });
  console.log('▶ hub shows a backup dot and the panel explains it');
  await seed(); await p.evaluate(() => go('hub')); await p.waitForTimeout(150); ok(/Grown-ups\s*●/.test(await text(p)), 'hub shows a dot on Grown-ups when a backup is overdue');
  await p.evaluate(() => go('parent')); await p.waitForTimeout(200); let t = await text(p);
  ok(/no hay ninguna copia/.test(t) && /solo existe en este iPad/.test(t), 'panel says there is no backup'); ok(/Cobertura/.test(t) && /Precisión y rapidez/.test(t) && /Dominio/.test(t) && /Esta semana/.test(t), 'four separate sections are present');
  ok(/Acierto sin ayuda/.test(t) && !/aciertos a la primera/.test(t), 'the misleading label “aciertos a la primera” is gone'); ok(!/undefined|NaN|\[object/.test(t), 'no undefined/NaN in the panel');
  console.log('▶ exporting records the date and clears the reminder');
  await p.evaluate(() => { URL.createObjectURL = () => 'blob:x'; HTMLAnchorElement.prototype.click = function(){}; }); await p.evaluate(() => ACT.export()); await p.waitForTimeout(100);
  ok(await p.evaluate(() => S.lastBackup === todayStr()), 'lastBackup set on export'); await p.evaluate(() => render()); t = await text(p); ok(/Última copia: \d{4}-\d{2}-\d{2}/.test(t) && /hace 0 días/.test(t), 'panel shows the date'); ok(!/solo existe en este iPad/.test(t), 'reminder gone'); await p.evaluate(() => go('hub')); await p.waitForTimeout(100); ok(!/Grown-ups\s*●/.test(await text(p)), 'dot gone from the hub');
  console.log('▶ copy summary');
  await p.evaluate(() => go('parent')); await p.waitForTimeout(150); await p.evaluate(() => ACT.copySummary()); await p.waitForTimeout(250); const clip = await p.evaluate(() => navigator.clipboard.readText().catch(() => 'ERR')); ok(/Resumen semanal de Matemagics/.test(clip) && /Acierto sin ayuda/.test(clip), 'clipboard has the summary: ' + clip.slice(0, 60));
  console.log('▶ import asks first, keeps an undo copy');
  const file = JSON.stringify({ v: 4, level: 9, skills: {}, sessionLog: [], evidence: [] }); let dialogs = [];
  p.on('dialog', d => { dialogs.push(d.message()); d.dismiss(); }); await p.evaluate(f => { const blob = new File([f], 'x.json', { type: 'application/json' }); onImport(blob); }, file); await p.waitForTimeout(250);
  ok(dialogs.length === 1 && /SUSTITUIR/.test(dialogs[0]) && /nivel/.test(dialogs[0]), 'import shows a confirmation that describes both states: ' + (dialogs[0] || '').slice(0, 80)); ok(await p.evaluate(() => S.level) !== 9, 'declining the confirmation keeps the current progress'); ok(!(await p.evaluate(() => hasPrevious())), 'nothing is stored when the import is declined');
  p.removeAllListeners('dialog'); p.on('dialog', d => d.accept()); const before = await p.evaluate(() => JSON.stringify(S)); await p.evaluate(f => onImport(new File([f], 'x.json', { type: 'application/json' })), file); await p.waitForTimeout(300);
  ok(await p.evaluate(() => S.level) === 9, 'accepting replaces the progress'); ok(await p.evaluate(() => hasPrevious()), 'a copy of the previous state was kept'); await p.evaluate(() => go('parent')); await p.waitForTimeout(150); ok(/Deshacer importación/.test(await text(p)), 'panel offers to undo');
  await p.evaluate(() => ACT.undoImport()); await p.waitForTimeout(250); ok(await p.evaluate(b0 => JSON.parse(b0).evidence.length === S.evidence.length && S.level !== 9, before), 'undo brings the previous progress back');
  console.log('▶ invalid files and delete');
  await p.evaluate(() => onImport(new File(['not json'], 'x.json'))); await p.waitForTimeout(200); ok(await p.evaluate(() => S.level) !== 9, 'invalid file changes nothing'); await p.evaluate(() => onImport(new File(['[1,2]'], 'x.json'))); await p.waitForTimeout(200); ok(await p.evaluate(() => Array.isArray(S) === false), 'an array file is refused');
  dialogs = []; p.removeAllListeners('dialog'); p.on('dialog', d => { dialogs.push(d.message()); d.dismiss(); }); await p.evaluate(() => ACT.reset()); await p.waitForTimeout(150); ok(dialogs.length === 1 && /BORRAR|Borrar/.test(dialogs[0]) && /copia/.test(dialogs[0]), 'delete asks first and mentions the backup: ' + (dialogs[0] || '').slice(0, 80)); ok(await p.evaluate(() => S.evidence.length) > 0, 'declining delete keeps everything');
  p.removeAllListeners('dialog'); p.on('dialog', d => d.accept()); await p.evaluate(() => ACT.reset()); await p.waitForTimeout(250); ok(await p.evaluate(() => S.evidence.length === 0 && hasPrevious()), 'after confirming, progress is gone but an internal copy exists for undo');
  ok(errs.length === 0, 'page errors: ' + errs.join(' | ')); await b.close();
  console.log(fails ? '❌ PARENT TEST FAILED (' + fails + ' of ' + checks + ' checks)' : '✅ PARENT TEST PASSED (' + checks + ' checks)'); process.exit(fails ? 1 : 0);
})().catch(e => { console.log('❌ PARENT TEST CRASHED: ' + e.message); process.exit(1); });
