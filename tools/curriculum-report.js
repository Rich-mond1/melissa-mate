#!/usr/bin/env node
const fs = require('fs'); const C = require('./lib/curriculum'); const E = require('./lib/load-engine')();
fs.writeFileSync(C.REPORT_PATH, C.render(C.load(), E)); console.log('wrote docs/CURRICULUM-GAPS.md');
