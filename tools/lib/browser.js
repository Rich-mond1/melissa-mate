/* Launches Chromium from wherever this machine keeps it, then falls back to Playwright's own download. WebKit is optional (null when not installed). */
const fs = require('fs'); const pw = require('playwright');
const CANDIDATES = [process.env.PLAYWRIGHT_CHROMIUM_PATH, '/opt/pw-browsers/chromium', '/opt/pw-browsers/chromium-1194/chrome-linux/chrome'].filter(Boolean);
exports.launchChromium = async function(){
  if(process.env.USE_WEBKIT){ const w = await exports.launchWebkit(); if(w) return w; }   // USE_WEBKIT=1 runs any UI test on the iPad/Safari engine
  for(const p of CANDIDATES){ if(fs.existsSync(p) && fs.statSync(p).isFile()){ try { return await pw.chromium.launch({ executablePath: p, args: ['--no-sandbox'] }); } catch(e){} } }
  return pw.chromium.launch({ args: ['--no-sandbox'] });
};
exports.launchWebkit = async function(){ try { return await pw.webkit.launch(); } catch(e){ return null; } };
exports.devices = pw.devices;
