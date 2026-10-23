#!/usr/bin/env node
/* Builds the single-file index.html and runs the pre-flight checks (syntax + action IDs). */
const fs = require('fs'), path = require('path'), cp = require('child_process');
const root = path.join(__dirname, '..'); const rd = f => fs.readFileSync(path.join(root, f), 'utf8');
const skillFiles = fs.readdirSync(path.join(root, 'src/skills')).filter(f => f.endsWith('.js')).sort();
const parts = ['src/core.js', 'src/visuals.js', ...skillFiles.map(f => 'src/skills/' + f), 'src/app/art2.js', 'src/app/avatar.js', 'src/app/engine.js', 'src/app/sync.js', 'src/app/pets.js', 'src/app/friends-art.js', 'src/app/ui1.js', 'src/app/ui2.js', 'src/app/ui3.js'];
const js = parts.map(f => '/* ===== ' + f + ' ===== */\n' + rd(f).replace(/^'use strict';\s*/m, '').replace(/if\(typeof module !== 'undefined'\) module\.exports = \{[\s\S]*?\};?\n?/g, '')).join('\n');
const icon = `(function(){try{var c=document.createElement('canvas');c.width=c.height=180;var x=c.getContext('2d');var g=x.createLinearGradient(0,0,180,180);g.addColorStop(0,'#9B51E0');g.addColorStop(1,'#F2A6D8');x.fillStyle=g;x.fillRect(0,0,180,180);x.font='100px serif';x.textAlign='center';x.textBaseline='middle';x.fillText('🧙‍♀️',90,98);var l=document.createElement('link');l.rel='apple-touch-icon';l.href=c.toDataURL('image/png');document.head.appendChild(l);var l2=document.createElement('link');l2.rel='icon';l2.href=l.href;document.head.appendChild(l2);}catch(e){}})();`;
const html = `<!DOCTYPE html>
<html lang="en"><head><meta charset="utf-8"><title>Matemagics</title>
<meta name="viewport" content="width=device-width,initial-scale=1,maximum-scale=1,user-scalable=no,viewport-fit=cover">
<meta name="apple-mobile-web-app-capable" content="yes"><meta name="mobile-web-app-capable" content="yes"><meta name="theme-color" content="#3a1f39">
<style>
${rd('src/styles.css')}
</style></head><body><div id="app"></div>
<script>
${js}
${icon}
</script></body></html>
`;
fs.writeFileSync(path.join(root, 'index.html'), html);
// 1) syntax
const m = /<script>\n([\s\S]*)<\/script>/.exec(html); const tmp = path.join(root, '.build-check.js'); fs.writeFileSync(tmp, m[1]);
try { cp.execSync('node --check ' + tmp, { stdio: 'pipe' }); console.log('✓ node --check OK'); } catch(e){ console.log('✗ SYNTAX ERROR\n' + e.stderr.toString()); fs.unlinkSync(tmp); process.exit(1); }
fs.unlinkSync(tmp);
// 2) every data-act used in the UI has a handler, every handler is used
const ui = rd('src/app/ui1.js') + rd('src/app/ui2.js') + rd('src/app/ui3.js');
const used = new Set([...ui.matchAll(/data-act="([A-Za-z]+)"/g)].map(x => x[1]));
const defined = new Set([...ui.matchAll(/^ACT\.([A-Za-z]+) *=/gm)].map(x => x[1]));
let bad = 0;
used.forEach(a => { if(!defined.has(a)){ console.log('✗ data-act without handler: ' + a); bad++; } });
defined.forEach(a => { if(!used.has(a)) console.log('· handler never referenced (ok if called from code): ' + a); });
// 3) every go('x') target is a screen
const screens = new Set([...ui.matchAll(/^SCREENS\.([A-Za-z]+) *=/gm)].map(x => x[1]));
[...ui.matchAll(/go\('([A-Za-z]+)(?::[^']*)?'/g)].map(x => x[1]).concat([...ui.matchAll(/data-to="([A-Za-z]+)/g)].map(x => x[1])).forEach(t => { if(!screens.has(t)){ console.log('✗ unknown screen: ' + t); bad++; } });
// 4) size
console.log((html.length / 1024).toFixed(0) + ' KB, ' + SKILL_COUNT() + ' skill files');
function SKILL_COUNT(){ return skillFiles.length; }
process.exit(bad ? 1 : 0);
