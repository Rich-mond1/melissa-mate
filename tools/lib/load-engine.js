/* Loads core + visuals + all skills + engine.js into one sandbox (same as engine-test.js) and returns the engine API. */
const fs = require('fs'), path = require('path'), vm = require('vm');
const root = path.join(__dirname, '..', '..');
module.exports = function loadEngine(){
  const files = ['src/core.js', 'src/visuals.js', ...fs.readdirSync(path.join(root, 'src/skills')).filter(f => f.endsWith('.js')).sort().map(f => 'src/skills/' + f), 'src/app/engine.js'];
  const code = files.map(f => fs.readFileSync(path.join(root, f), 'utf8').replace(/^'use strict';/m, '').replace(/if\(typeof module !== 'undefined'\) module\.exports = \{[\s\S]*?\};?\n?/g, '')).join('\n;\n');
  const sb = { console, Math, JSON, Object, Array, String, Number, Set, Map, RegExp, Error, isFinite, parseFloat, parseInt, Date }; vm.createContext(sb);
  vm.runInContext(code + '\n;this.E = { SKILLS, STATE_KEY, V3_KEY, defaultState, mergeState, migrateV3, importState, loadState, skillState, applySkillResult, recordError, openPack, checkBadges, updateStreak, addXp, ensureDaily, placementRecord, medalOf, totalMedals, strandProgress, strandsWithSkills, setSeed, todayStr, addDays };', sb);
  return sb.E;
};
module.exports.root = root;
