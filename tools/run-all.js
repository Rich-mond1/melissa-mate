#!/usr/bin/env node
/* ONE COMMAND: node tools/run-all.js [--full]   (npm test / npm run test:full)
   Quick (default, a few minutes): audit n=300 · e2e 2 per skill/tier · layout n=4 at 360/390/430.
   Full (before merging to main): audit n=3000 (504,000 questions) · e2e 6 per skill/tier · layout n=20 at 360/390/430.
   Also fails if the committed index.html is not exactly what src/ builds. */
const fs = require('fs'), path = require('path'), cp = require('child_process'); const root = path.join(__dirname, '..'); const FULL = process.argv.includes('--full');
const indexPath = path.join(root, 'index.html'); const before = fs.existsSync(indexPath) ? fs.readFileSync(indexPath, 'utf8') : '';
const steps = [
  ['build', 'node tools/build.js'],
  ['audit', 'node tools/audit.js --quiet --n ' + (FULL ? 3000 : 300)],
  ['engine', 'node tools/engine-test.js'],
  ['state', 'node tools/state-test.js'],
  ['mastery', 'node tools/mastery-test.js'],
  ['mission', 'node tools/mission-test.js'],
  ['diag', 'node tools/diag-test.js'],
  ['curric', 'node tools/curriculum-test.js'],
  ['clarity', 'node tools/clarity-scan.js --n ' + (FULL ? 600 : 250)],
  ['textmath', 'node tools/text-math-check.js --n ' + (FULL ? 600 : 250)],
  ['textlint', 'node tools/text-lint.js'],
  ['grammar', 'node tools/grammar-scan.js --n ' + (FULL ? 800 : 300)],
  ['e2e', 'node tools/e2e.js --per ' + (FULL ? 6 : 2)],
  ['layout', 'node tools/layout-audit.js --n ' + (FULL ? 20 : 4) + ' --widths 360,390,430'],
  ['touch', 'node tools/touch-test.js'],
  ['gold', 'node tools/gold-ui-test.js'],
  ['diagui', 'node tools/diag-ui-test.js'],
  ['missionui', 'node tools/mission-ui-test.js'],
  ['parent', 'node tools/parent-test.js'],
  ['avatar', 'node tools/avatar-test.js'],
  ['wardrobe', 'node tools/wardrobe-test.js'],
  ['safety', 'node tools/safety-test.js']
];
const rows = []; let failed = 0;
for(const [name, cmd] of steps){
  const t0 = Date.now(); const r = cp.spawnSync(cmd, { cwd: root, shell: true, encoding: 'utf8', maxBuffer: 1 << 28 }); const sec = ((Date.now() - t0) / 1000).toFixed(0);
  const out = (r.stdout || '') + (r.stderr || ''); const okRun = r.status === 0; if(!okRun) failed++;
  rows.push(name.padEnd(8) + (okRun ? '✅ pass' : '❌ FAIL') + '  ' + sec + 's  ' + ((out.trim().split('\n').filter(l => /PASSED|FAILED|SKIPPED|KB,/.test(l)).pop()) || '').trim());
  if(!okRun) console.log('--- ' + name + ' output (tail) ---\n' + out.trim().split('\n').slice(-25).join('\n') + '\n');
  if(name === 'build'){ const after = fs.readFileSync(indexPath, 'utf8'); if(before && before !== after){ failed++; rows.push('index   ❌ FAIL  index.html was OUT OF DATE with src/ (it has just been rebuilt: commit it)'); } else rows.push('index   ✅ pass  index.html is exactly what src/ builds'); }
}
console.log('\n' + rows.join('\n') + '\n\n' + (failed ? '❌ ' + failed + ' STEP(S) FAILED' : '✅ ALL GREEN (' + (FULL ? 'full' : 'quick') + ')') + (fs.existsSync(path.join(root, 'node_modules')) || true ? '' : ''));
console.log('Reminder: WebKit/iPad is only covered if "touch" did not say SKIPPED. Before merging to main also do docs/IPAD-CHECKLIST.md on the real iPad.');
process.exit(failed ? 1 : 0);
