/* Curriculum DB: loader, drift checks against src/skills, and the generated gap report. The DB is data only: the app does not read it. */
const fs = require('fs'), path = require('path'); const loadEngine = require('./load-engine'); const root = loadEngine.root;
const DB_PATH = path.join(root, 'curriculum', 'curriculum.json'), REPORT_PATH = path.join(root, 'docs', 'CURRICULUM-GAPS.md');
const load = () => JSON.parse(fs.readFileSync(DB_PATH, 'utf8'));
function derive(E){ const out = {}; for(const s of E.SKILLS){ const types = new Set(); E.setSeed(2026); for(const k of [1,2,3]) for(let i = 0; i < 200; i++){ const g = s.gen[k]; types.add((typeof g === 'function' ? g() : g).type); }
  out[s.id] = { year: s.year, strand: s.strand, prereq: s.prereq.slice(), visuals: [...new Set(s.lesson.steps.map(x => x.vis && x.vis.kind).filter(Boolean))].sort(), questionTypes: [...types].sort(), hasTrick: !!s.trick }; } return out; }
function validate(db, E){
  const errs = [], warn = []; const eq = (a, b) => JSON.stringify(a) === JSON.stringify(b); const D = derive(E);
  ['schemaVersion','dbVersion','status','sources','masteryModel','units','objectives'].forEach(k => { if(db[k] === undefined) errs.push('missing top-level ' + k); });
  const units = new Map(); db.units.forEach(u => { if(units.has(u.id)) errs.push('duplicate unit ' + u.id); units.set(u.id, u); if(u.seq !== null && typeof u.seq !== 'number') errs.push('unit seq ' + u.id); if(!db.sources[u.seqSource]) errs.push('unit source ' + u.id); });
  const ids = new Set(), bySkill = new Map(), planned = new Set();
  db.objectives.forEach(o => { if(ids.has(o.id)) errs.push('duplicate objective ' + o.id); ids.add(o.id);
    ['id','status','year','unit','objective','prereq','methods','source','sourceStatus'].forEach(k => { if(o[k] === undefined || o[k] === '') errs.push(o.id + ': missing ' + k); });
    if(!units.has(o.unit)) errs.push(o.id + ': unknown unit ' + o.unit); (o.source || []).forEach(s => { if(!db.sources[s]) errs.push(o.id + ': unknown source ' + s); });
    if(o.skillId){ if(bySkill.has(o.skillId)) errs.push('skill mapped twice: ' + o.skillId); bySkill.set(o.skillId, o); if(o.status !== 'exists') errs.push(o.id + ': mapped but status ' + o.status); }
    else { if(o.status !== 'missing' || !o.plannedSkillId) errs.push(o.id + ': unmapped objective must be missing with plannedSkillId'); else { if(E.SKILLS.find(s => s.id === o.plannedSkillId)) errs.push(o.id + ': plannedSkillId already exists as a skill'); planned.add(o.plannedSkillId); } } });
  E.SKILLS.forEach(s => { const o = bySkill.get(s.id); if(!o){ errs.push('skill without objective: ' + s.id); return; } const d = D[s.id];
    if(o.year !== d.year) errs.push(s.id + ': year ' + o.year + ' vs code ' + d.year); if(o.strand !== d.strand) errs.push(s.id + ': strand differs');
    if(!eq(o.prereq, d.prereq)) errs.push(s.id + ': prereq differs from code'); if(!eq(o.visuals, d.visuals)) errs.push(s.id + ': visuals differ from code (' + d.visuals + ')');
    if(!eq(o.questionTypes, d.questionTypes)) errs.push(s.id + ': question types differ from code (' + d.questionTypes + ')'); if(o.hasTrick !== d.hasTrick) errs.push(s.id + ': hasTrick differs'); });
  [...bySkill.keys()].forEach(k => { if(!E.SKILLS.find(s => s.id === k)) errs.push('objective points to unknown skill ' + k); });
  const known = new Set([...bySkill.keys(), ...planned]); db.objectives.forEach(o => o.prereq.forEach(p => { if(!known.has(p)) errs.push(o.id + ': unknown prerequisite ' + p); }));
  const pid = o => o.skillId || o.plannedSkillId, byPid = new Map(db.objectives.map(o => [pid(o), o])); const state = {};
  (function dfs(){ const visit = id => { if(state[id] === 2) return; if(state[id] === 1){ errs.push('prerequisite cycle at ' + id); return; } state[id] = 1; (byPid.get(id) ? byPid.get(id).prereq : []).forEach(visit); state[id] = 2; }; byPid.forEach((_, id) => visit(id)); })();
  const conflicts = orderConflicts(db, units, byPid); const accepted = new Set(db.knownOrderConflicts || []);
  conflicts.forEach(c => { if(!accepted.has(c.key)) errs.push('school order puts ' + c.skill + ' (' + c.unit + ') before its prerequisite ' + c.prereq + ' (' + c.prereqUnit + ') - fix or add "' + c.key + '" to knownOrderConflicts'); });
  accepted.forEach(k => { if(!conflicts.find(c => c.key === k)) errs.push('stale knownOrderConflicts entry ' + k); });
  const mm = db.masteryModel.current, eng = fs.readFileSync(path.join(root, 'src/app/engine.js'), 'utf8'); const rd = /const REVIEW_DAYS = (\[[^\]]*\])/.exec(eng);
  if(!rd || !eq(JSON.parse(rd[1]), mm.reviewDays)) errs.push('masteryModel.reviewDays differs from engine.js');
  if(!/kind === 'guided'\)\{ if\(acc >= 0\.7/.test(eng) || !/kind === 'practice'\)\{ if\(acc >= 0\.8/.test(eng) || !/kind === 'challenge'\)\{ if\(acc >= 0\.8/.test(eng)) errs.push('mastery thresholds in engine.js no longer match masteryModel');
  const src = ['src/core.js','src/app/engine.js','src/app/ui1.js','src/app/ui2.js','src/app/pets.js','src/app/ui3.js','src/app/avatar.js'].map(f => fs.readFileSync(path.join(root, f), 'utf8')).join(''); if(/curriculum\.json|CURRICULUM/.test(src.replace(/\/\* SCHOOL-ORDER:BEGIN[\s\S]*?SCHOOL-ORDER:END \*\//, ''))) errs.push('the app must not read the curriculum DB at run time (it only carries the generated SCHOOL_SEQ block)');
  const ex = require('../curriculum-export'); const i = eng.indexOf(ex.BEGIN), j = eng.indexOf(ex.END); if(i < 0 || j < 0 || eng.slice(i, j + ex.END.length) !== ex.block(db)) errs.push('SCHOOL_SEQ block in engine.js is out of date: run node tools/curriculum-export.js');
  return { errs, conflicts, count: db.objectives.length, mapped: bySkill.size };
}
function orderConflicts(db, units, byPid){ const out = []; db.objectives.forEach(o => { const u = units.get(o.unit); if(u.seq === null) return; o.prereq.forEach(p => { const po = byPid.get(p); if(!po) return; const pu = units.get(po.unit); if(pu.seq !== null && pu.seq > u.seq) out.push({ skill: o.skillId || o.plannedSkillId, unit: o.unit, prereq: p, prereqUnit: po.unit, key: (o.skillId || o.plannedSkillId) + '<-' + p }); }); }); return out; }
function render(db, E){
  const D = derive(E), pid = o => o.skillId || o.plannedSkillId, byPid = new Map(db.objectives.map(o => [pid(o), o])); const units = new Map(db.units.map(u => [u.id, u]));
  const order = db.units.slice().sort((a, b) => (a.seq === null ? 1e9 : a.seq) - (b.seq === null ? 1e9 : b.seq)); const nxt = {}; db.objectives.forEach(o => o.prereq.forEach(p => (nxt[p] = nxt[p] || []).push(pid(o))));
  const L = []; L.push('# Curriculum map and gap report', '', '_Generated by `node tools/curriculum-report.js` from `curriculum/curriculum.json`. Do not edit by hand._', '', '**DB version:** ' + db.dbVersion + '  ', '**Status:** ' + db.status + '  ', '**Objectives:** ' + db.objectives.length + ' (' + db.objectives.filter(o => o.skillId).length + ' mapped to existing skills, ' + db.objectives.filter(o => !o.skillId).length + ' missing)', '');
  L.push('Everything is **pendiente de verificar**: the official school documents were not available, only a summary read by web extraction (no page numbers). Visuals and question types are read from the code, so they are verified; unit positions and objective wording are not.', '', '## Units in school order', '');
  order.forEach(u => { const os = db.objectives.filter(o => o.unit === u.id); L.push('### ' + (u.seq === null ? '–' : u.seq) + ' · ' + u.title + ' (Y' + u.year + ', position: ' + u.seqSource + ')', ''); if(u.note) L.push('_' + u.note + '_', '');
    L.push('| Objective | Skill | Status | Needs first | Leads to |', '| --- | --- | --- | --- | --- |'); os.forEach(o => L.push('| ' + o.objective + ' | ' + (o.skillId ? '`' + o.skillId + '`' : '_planned_ `' + o.plannedSkillId + '`') + ' | ' + o.status + (o.placementSource === 'inferred' ? ' (unit inferred)' : '') + ' | ' + (o.prereq.map(p => '`' + p + '`').join(', ') || '–') + ' | ' + ((nxt[pid(o)] || []).map(p => '`' + p + '`').join(', ') || '–') + ' |')); L.push(''); });
  const gaps = db.objectives.filter(o => !o.skillId); L.push('## Gaps (missing objectives)', '', '| Year | Planned skill | Objective | Note |', '| --- | --- | --- | --- |'); gaps.forEach(o => L.push('| ' + o.year + ' | `' + o.plannedSkillId + '` | ' + o.objective + ' | ' + (o.note || '') + ' |'));
  const { conflicts } = validate(db, E); L.push('', '## Where school order and app prerequisites disagree', '', conflicts.length ? 'The app asks for the prerequisite first, but the school teaches the unit earlier. Phase 3 must decide which wins when recommending:' : 'None.', ''); conflicts.forEach(c => L.push('- `' + c.skill + '` (' + c.unit + ') needs `' + c.prereq + '` (' + c.prereqUnit + ')'));
  L.push('', '## Coverage by year (existing skills)', '', '| Year | Skills |', '| --- | --- |'); [2, 3, 4].forEach(y => L.push('| Y' + y + ' | ' + db.objectives.filter(o => o.skillId && o.year === y).length + ' |')); return L.join('\n') + '\n';
}
module.exports = { load, validate, render, derive, DB_PATH, REPORT_PATH };
