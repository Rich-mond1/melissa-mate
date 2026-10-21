#!/usr/bin/env node
/* Curriculum DB test: 1-to-1 with src/skills, no drift, acyclic, report up to date, app untouched. */
const fs = require('fs'); const C = require('./lib/curriculum'); const E = require('./lib/load-engine')();
const db = C.load(); const r = C.validate(db, E); const errs = r.errs.slice();
const rep = C.render(db, E); if(!fs.existsSync(C.REPORT_PATH) || fs.readFileSync(C.REPORT_PATH, 'utf8') !== rep) errs.push('docs/CURRICULUM-GAPS.md is out of date: run node tools/curriculum-report.js');
errs.forEach(e => console.log('✗ ' + e)); console.log(errs.length ? '❌ CURRICULUM TEST FAILED (' + errs.length + ' problems)' : '✅ CURRICULUM TEST PASSED (' + r.mapped + ' skills mapped 1 to 1, ' + (r.count - r.mapped) + ' gaps, ' + r.conflicts.length + ' known order conflicts)');
process.exit(errs.length ? 1 : 0);
