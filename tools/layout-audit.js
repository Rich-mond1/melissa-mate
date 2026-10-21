#!/usr/bin/env node
/* LAYOUT AUDIT (what the logic audit cannot see): renders real questions in real Chromium at phone widths and flags
   overlapping text, text half-covering shapes, content wider than its card, clipped/scrolling visuals, low-contrast text,
   option labels that overflow. Usage: node tools/layout-audit.js [--n 10] [--widths 360,430] [--skill id] [--shots dir] */
const { chromium } = require('playwright'); const path = require('path'), fs = require('fs');
const arg = (k, d) => { const i = process.argv.indexOf('--' + k); return i > -1 ? process.argv[i + 1] : d; };
const N = +arg('n', 8), WIDTHS = arg('widths', '360,430').split(',').map(Number), ONLY = arg('skill', null), SHOTS = arg('shots', null);
const CHECK = function(){
  const out = []; const card = document.querySelector('.qcard,.lesson-card,.trickcard'); if(!card) return ['no card'];
  const cr = card.getBoundingClientRect();
  const inter = (a, b) => { const w = Math.min(a.right, b.right) - Math.max(a.left, b.left), h = Math.min(a.bottom, b.bottom) - Math.max(a.top, b.top); return (w > 0 && h > 0) ? w * h : 0; };
  const area = r => Math.max(0, r.width) * Math.max(0, r.height);
  const lum = c => { const m = c.match(/[\d.]+/g).map(Number); const f = v => { v /= 255; return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4); }; return 0.2126 * f(m[0]) + 0.7152 * f(m[1]) + 0.0722 * f(m[2]); };
  const alpha = c => { const m = c.match(/[\d.]+/g); return m.length > 3 ? +m[3] : 1; };
  const bgOf = el => { for(let e = el; e && e.nodeType === 1; e = e.parentNode){ const cs = getComputedStyle(e); const b = cs.backgroundColor; if(b && alpha(b) > 0.5) return b; } return 'rgb(255,255,255)'; };
  const contrast = (a, b) => { const l1 = lum(a), l2 = lum(b); return (Math.max(l1, l2) + 0.05) / (Math.min(l1, l2) + 0.05); };
  const vis = card.querySelector('.qvis') || document.createElement('div');
  // 1. content wider than the card / clipped visual
  card.querySelectorAll('*').forEach(function(el){
    if(el.closest('.opts') && false) return; const r = el.getBoundingClientRect(); if(!r.width || !r.height) return;
    if(r.right > cr.right + 1.5 || r.left < cr.left - 1.5) { if(!(el.closest('.qvis') && vis.scrollWidth > vis.clientWidth + 1)) out.push('OVERFLOW-CARD ' + el.tagName + ' ' + (el.textContent || '').slice(0, 20)); }
  });
  if(vis && vis.scrollWidth > vis.clientWidth + 1) out.push('VIS-SCROLLS ' + vis.scrollWidth + '>' + vis.clientWidth);
  // overflow:hidden clipping of text/emoji inside visuals
  card.querySelectorAll('.qvis *').forEach(function(el){
    if(el.children.length || !(el.textContent || '').trim()) return; const cs = getComputedStyle(el.parentElement); const r = el.getBoundingClientRect();
    for(let p = el.parentElement; p && p !== card; p = p.parentElement){ const s = getComputedStyle(p); if(/hidden|clip/.test(s.overflow + s.overflowX) && p.tagName !== 'svg' && !p.classList.contains('half')){ const pr = p.getBoundingClientRect(); if(r.right > pr.right + 1.5 || r.bottom > pr.bottom + 1.5 || r.left < pr.left - 1.5) { out.push('CLIPPED ' + el.tagName + ' ' + el.textContent.trim().slice(0, 15)); break; } } }
  });
  // 2. SVG: text vs text, text vs shapes
  card.querySelectorAll('svg').forEach(function(svg){
    const texts = [...svg.querySelectorAll('text')].filter(t => (t.textContent || '').trim()), shapes = [...svg.querySelectorAll('circle,rect,ellipse,polygon,path')].filter(s => { const r = s.getBoundingClientRect(); return r.width > 4 && r.height > 4; });
    const sr = svg.getBoundingClientRect();
    texts.forEach(function(t, i){
      const tr = t.getBoundingClientRect(); const ta = area(tr); if(!ta) return;
      if(tr.right > sr.right + 2 || tr.left < sr.left - 2 || tr.top < sr.top - 2 || tr.bottom > sr.bottom + 2) out.push('TEXT-OUTSIDE-SVG "' + t.textContent.trim().slice(0, 20) + '"');
      for(let j = i + 1; j < texts.length; j++){ const o = texts[j].getBoundingClientRect(); const ov = inter(tr, o); if(ov > 0.2 * Math.min(ta, area(o))) out.push('TEXT-OVERLAP "' + t.textContent.trim().slice(0, 14) + '" x "' + texts[j].textContent.trim().slice(0, 14) + '"'); }
      shapes.forEach(function(s){
        if(s.contains(t) || t.contains(s)) return; const r = s.getBoundingClientRect(); const ov = inter(tr, r);
        const frac = ov / ta; if(frac > 0.12 && frac < 0.85){ const sh = s.tagName; const big = area(r) > 8 * ta; if(!big) out.push('TEXT-HALF-OVER-SHAPE "' + t.textContent.trim().slice(0, 18) + '" ' + sh); }
      });
      const vb = svg.viewBox && svg.viewBox.baseVal; if(vb && vb.width){ const eff = parseFloat(getComputedStyle(t).fontSize) * sr.width / vb.width; if(eff < 8) out.push('TINY-TEXT "' + t.textContent.trim().slice(0, 12) + '" ' + eff.toFixed(1) + 'px'); }
      // contrast
      const fill = getComputedStyle(t).fill; if(fill && fill.indexOf('rgb') === 0){ let bg = 'rgb(255,255,255)'; const mid = { x: (tr.left + tr.right) / 2, y: (tr.top + tr.bottom) / 2 }; const under = document.elementsFromPoint(mid.x, mid.y).filter(e => e !== t && e.closest('svg') === svg && /^(circle|rect|ellipse|polygon|path)$/.test(e.tagName)); if(under[0]){ const f = getComputedStyle(under[0]).fill; if(f && f.indexOf('rgb') === 0 && alpha(f) > 0.5) bg = f; } if(contrast(fill, bg) < 2.2) out.push('LOW-CONTRAST-SVG "' + t.textContent.trim().slice(0, 14) + '" ' + fill + ' on ' + bg); }
    });
  });
  // 3. HTML text contrast + option overflow
  card.querySelectorAll('*').forEach(function(el){
    if(el.closest('svg')) return; const own = [...el.childNodes].some(n => n.nodeType === 3 && n.textContent.trim()); if(!own) return;
    const c = getComputedStyle(el).color, b = bgOf(el); if(contrast(c, b) < 2.5) out.push('LOW-CONTRAST "' + el.textContent.trim().slice(0, 14) + '" ' + c + ' on ' + b);
    if(el.scrollWidth > el.clientWidth + 2 && getComputedStyle(el).display !== 'inline' && !el.classList.contains('half')) out.push('TEXT-OVERFLOW "' + el.textContent.trim().slice(0, 16) + '"');
  });
  const sp = card.querySelector('.speak'); if(sp){ const sr2 = sp.getBoundingClientRect(); const rg = document.createRange();
    card.querySelectorAll('.qprompt, .lesson-say, .qvis *').forEach(function(el){ [...el.childNodes].forEach(function(n){ if(n.nodeType !== 3 || !n.textContent.trim()) return; rg.selectNodeContents(n); [...rg.getClientRects()].forEach(function(r){ if(inter(r, sr2) > 0.1 * area(r)) out.push('SPEAKER-COVERS-TEXT "' + n.textContent.trim().slice(0, 14) + '"'); }); }); });
    card.querySelectorAll('.qvis svg').forEach(function(sv){ if(inter(sv.getBoundingClientRect(), sr2) > 0) out.push('SPEAKER-OVER-VISUAL'); }); }
  // 4. page-level horizontal scroll
  const app = document.querySelector('#app'); if(app.scrollWidth > app.clientWidth + 1) out.push('PAGE-HSCROLL ' + app.scrollWidth + '>' + app.clientWidth);
  return out;
};
(async () => {
  const b = await chromium.launch({ executablePath: process.env.CHROME_PATH || '/opt/pw-browsers/chromium' });
  const html = 'file://' + path.join(__dirname, '..', 'index.html'); const found = new Map(); let rendered = 0; const errs = [];
  for(const W of WIDTHS){
    const p = await (await b.newContext({ viewport: { width: W, height: 800 }, deviceScaleFactor: 1 })).newPage(); p.on('pageerror', e => errs.push(e.message));
    await p.goto(html); await p.evaluate(() => { localStorage.clear(); }); await p.reload(); await p.evaluate(() => { S.onboardingDone = true; S.placement.started = true; S.placement.done = true; speak = function(){}; });
    const ids = await p.evaluate(() => SKILLS.map(s => s.id));
    for(const id of ids){ if(ONLY && id !== ONLY) continue;
      for(const tier of [1, 2, 3]){
        await p.evaluate(([id]) => { SESS = { kind: 'practice', skillId: id, items: [], idx: 0, credits: [], by: {}, seen: {} }; }, [id]);
        for(let k = 0; k < N; k++){
          const ok = await p.evaluate(([id, tier]) => { const q = genQ(id, tier); if(!q) return false; SESS.q = q; startQ(id, tier); return true; }, [id, tier]); if(!ok) continue;
          rendered++; const probs = await p.evaluate(CHECK);
          const seenSig = new Set();
          if(process.env.DBG && probs.length && !global.dbgd){ global.dbgd = 1; console.log('DBG', id, tier, W, JSON.stringify(probs.slice(0,3)), (await p.evaluate(() => { const c = document.querySelector('.qcard').getBoundingClientRect(); const bad = [...document.querySelectorAll('.qcard *')].filter(e => { const r = e.getBoundingClientRect(); return r.width && (r.right > c.right + 1.5 || r.left < c.left - 1.5); }).slice(0, 3).map(e => e.tagName + ' ' + JSON.stringify(e.getBoundingClientRect()) + ' ' + (e.outerHTML || '').slice(0, 200)); return 'card ' + JSON.stringify(c) + '\n' + bad.join('\n') + '\nOPTS ' + (document.querySelector('.opts') ? document.querySelector('.opts').className + ' w=' + document.querySelector('.opts').getBoundingClientRect().width : ''); }))); }
          probs.forEach(pr => { const key = id + ' t' + tier + ' ' + pr.replace(/"[^"]*"/g, '"…"').replace(/\d+>\d+/, ''); if(seenSig.has(key)) return; seenSig.add(key); const e = found.get(key) || { n: 0, ex: pr, widths: new Set() }; e.n++; e.widths.add(W); if(!e.shot && SHOTS){ e.shot = true; e.need = true; } found.set(key, e); });
          if(SHOTS && probs.length){ const e = [...found.entries()].find(([k]) => k.startsWith(id + ' t' + tier)); if(e && !e[1].saved){ e[1].saved = true; fs.mkdirSync(SHOTS, { recursive: true }); await p.screenshot({ path: path.join(SHOTS, id + '_t' + tier + '_' + W + '_' + (e[1].n) + '.png') }); } }
        }
      }
    }
    // lessons + magic tricks (every step of every skill)
    for(const id of ids){ if(ONLY && id !== ONLY) continue;
      const nSteps = await p.evaluate(id => skillById(id).lesson.steps.length, id);
      const targets = []; for(let i = 0; i < nSteps; i++) targets.push(['lesson', i]); targets.push(['trick', 0]);
      for(const [kind, i] of targets){
        await p.evaluate(([id, kind, i]) => { go(kind, kind === 'lesson' ? { id: id, i: i } : { id: id }); }, [id, kind, i]);
        const probs = await p.evaluate(CHECK); probs.forEach(pr => { const key = id + ' ' + kind + (kind === 'lesson' ? ' step' + (i + 1) : '') + ' ' + pr.replace(/"[^"]*"/g, '"…"').replace(/\d+>\d+/, ''); const e = found.get(key) || { n: 0, ex: pr, widths: new Set() }; e.n++; e.widths.add(W); found.set(key, e); }); rendered++;
        if(SHOTS && probs.length){ fs.mkdirSync(SHOTS, { recursive: true }); await p.screenshot({ path: path.join(SHOTS, id + '_' + kind + (i + 1) + '_' + W + '.png') }); }
      }
    }
    await p.context().close();
  }
  // ---- app screens (hub, trophies, stickers, parent...): text contrast + horizontal overflow, with realistic data
  { const p = await (await b.newContext({ viewport: { width: 390, height: 800 } })).newPage(); p.on('pageerror', e => errs.push(e.message));
    await p.goto(html); await p.evaluate(() => localStorage.clear()); await p.reload();
    await p.evaluate(() => { S.onboardingDone = true; S.placement.started = true; S.placement.done = true; speak = function(){}; S.starBalance = 99; S.packs = 3; S.tricks = [SKILLS[0].id, SKILLS[1].id]; S.badges = [BADGES[0].id, BADGES[1].id];
      S.stickers = [{ id: 'pet:duck:3', pet: 'duck', v: 3, base: '', acc: '', bg: 2, rarity: 'legendary', n: 2, date: '2026-10-19' }, { id: '1.1.1.rare', base: '🦊', acc: '🎩', bg: 1, rarity: 'rare', n: 1, date: '2026-10-19' }];
      SKILLS.slice(0, 6).forEach(s => { skillState(S, s.id).medal = 2; }); });
    const targets = await p.evaluate(() => { const t = ['welcome', 'placementIntro', 'hub', 'stickers', 'rewards', 'trophies', 'timeup', 'parentPin', 'parent', 'placementDone', 'me', 'friends']; STRANDS.forEach(s => t.push('strand:' + s.id)); SKILLS.forEach(s => t.push('skill:' + s.id)); return t; });
    const SCAN = function(){
      const out = []; const app = document.querySelector('#app'); const vw = document.documentElement.clientWidth;
      const alpha = c => { const m = c.match(/[\d.]+/g); return m.length > 3 ? +m[3] : 1; };
      const lum = c => { const m = c.match(/[\d.]+/g).map(Number); const f = v => { v /= 255; return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4); }; return 0.2126 * f(m[0]) + 0.7152 * f(m[1]) + 0.0722 * f(m[2]); };
      const cr = (a, b) => { const x = lum(a), y = lum(b); return (Math.max(x, y) + 0.05) / (Math.min(x, y) + 0.05); };
      if(app.scrollWidth > app.clientWidth + 1) out.push('PAGE-HSCROLL');
      app.querySelectorAll('*').forEach(function(el){
        const r0 = el.getBoundingClientRect(); if(!r0.width || !r0.height) return; const host = el.closest ? el.closest('svg') : null; const r = (host && host !== el && getComputedStyle(host).overflow !== 'visible') ? host.getBoundingClientRect() : r0; /* inside an <svg> the outer svg clips (overflow hidden), so judge the svg box */ if(r.right > vw + 1.5 || r.left < -1.5) out.push('OFF-SCREEN ' + el.tagName + ' ' + (el.textContent || '').trim().slice(0, 16));
        if(el.closest('svg') || ![...el.childNodes].some(n => n.nodeType === 3 && n.textContent.trim())) return;
        const cs = getComputedStyle(el); if(cs.visibility === 'hidden' || +cs.opacity === 0) return; if(!/[A-Za-z0-9]/.test(el.textContent)) return;
        let bg = null, op = 1; for(let e = el; e && e.nodeType === 1; e = e.parentElement){ const s = getComputedStyle(e); op *= +s.opacity; if(alpha(s.backgroundColor) > 0.75){ bg = s.backgroundColor; break; } }
        const col = cs.color; if(!bg){ for(let e = el; e && e !== app; e = e.parentElement){ if(getComputedStyle(e).backgroundImage !== 'none') return; } bg = 'rgb(110,70,130)'; if(cr(col, bg) < 2.0) out.push('LOW-CONTRAST "' + el.textContent.trim().slice(0, 18) + '" ' + col + ' on gradient'); return; }
        if(cr(col, bg) < 2.2) out.push('LOW-CONTRAST "' + el.textContent.trim().slice(0, 18) + '" ' + col + ' on ' + bg);
      });
      return out;
    };
    for(const tg of targets){ const pr = await p.evaluate(([tg, SCAN]) => { window.__noGuard = true; try{ go(tg); }catch(e){ return ['ERR ' + e.message]; } return (new Function('return ' + SCAN))()(); }, [tg, SCAN.toString()]);
      pr.forEach(x => { const key = 'screen ' + tg.split(':')[0] + ' ' + x.replace(/"[^"]*"/, '"…"'); const e = found.get(key) || { n: 0, ex: x + ' (' + tg + ')', widths: new Set([390]) }; e.n++; found.set(key, e); }); rendered++; }
    await p.context().close(); }
  await b.close();
  console.log('rendered ' + rendered + ' question screens at widths ' + WIDTHS.join('/'));
  const rows = [...found.entries()].sort(); rows.forEach(([k, e]) => console.log('✗ ' + k + '  [' + e.n + '× w=' + [...e.widths].join('/') + ']  e.g. ' + e.ex));
  if(errs.length) console.log('page errors:', errs.slice(0, 3));
  console.log(rows.length || errs.length ? '❌ LAYOUT AUDIT: ' + rows.length + ' distinct problems' : '✅ LAYOUT AUDIT PASSED'); process.exit(rows.length || errs.length ? 1 : 0);
})();
