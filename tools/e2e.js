#!/usr/bin/env node
/* END-TO-END: real Chromium, real clicks. For EVERY skill and tier it answers questions rightly and wrongly
   THROUGH THE DOM and checks that the UI accepts exactly the right answer and nothing else. */
const { chromium } = require('playwright'); const path = require('path');
const ONLY = process.argv.includes('--skill') ? process.argv[process.argv.indexOf('--skill') + 1] : null;
const PER = +(process.argv.includes('--per') ? process.argv[process.argv.indexOf('--per') + 1] : 6);
let fails = 0; const log = m => { fails++; console.log('✗ ' + m); };
(async () => {
  const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome', args: ['--no-sandbox'] }).catch(() => chromium.launch({ args: ['--no-sandbox'] }));
  const ctx = await b.newContext({ viewport: { width: 414, height: 800 } }); const page = await ctx.newPage();
  page.on('pageerror', e => log('PAGE ERROR ' + e.message)); page.on('console', m => { if(m.type() === 'error') log('CONSOLE ' + m.text()); });
  await page.goto('file://' + path.join(__dirname, '..', 'index.html'));
  const txt = () => page.evaluate(() => document.getElementById('app').innerText);
  const badText = async w => { const t = await txt(); if(/undefined|NaN|\[object|null\b/.test(t)) log('bad text on ' + w + ': ' + (t.match(/.{0,30}(undefined|NaN|\[object|null\b).{0,30}/) || [''])[0]); };

  // ---- onboarding + placement
  await page.evaluate(() => { window.__noGuard = true; });
  await page.click('[data-act=startPlacement]'); await page.click('[data-act=placementGo]');
  await page.evaluate(() => { window.__ans = function(right){
    const q = SESS.q, click = s => { const e = document.querySelector(s); if(!e) throw new Error('missing ' + s); e.click(); };
    if(q.type === 'mcq'){ const idx = right ? q.correct : q.options.findIndex((o, i) => i !== q.correct && SESS.chosen.indexOf(o.key) === -1); click('[data-k="' + idx + '"].opt'); }
    else if(q.type === 'num'){ let v = q.answer; if(!right) v = v + 1; String(v).split('').forEach(c => click('.keypad [data-k="' + c + '"]')); click('[data-act=check]'); }
    else if(q.type === 'shade'){ let n = q.model.num; if(!right) n = n === q.model.den ? n - 1 : n + 1; if(n < 1) n = 1; click('.seg[data-k="' + (n - 1) + '"]'); click('[data-act=check]'); }
    else if(q.type === 'setclock'){ const v = +q.correctKey.slice(2); let h = Math.floor(v / 60) || 12, m = v % 60; if(!right) h = h % 12 + 1; let g = 0; while(SESS.clk.h !== h && g++ < 13) click('[data-d="h+"]'); g = 0; while(SESS.clk.m !== m && g++ < 61) click('[data-d="m+"]'); click('[data-act=check]'); }
    else if(q.type === 'order'){ let ks = q.correctKey.slice(2).split('|'); if(!right) ks = ks.slice().reverse(); ks.forEach(k => { const e = [...document.querySelectorAll('.chip')].find(c => c.dataset.key === k && !c.disabled); if(!e) throw new Error('chip ' + k); e.click(); }); click('[data-act=check]'); }
    return q.type;
  }; });
  let pq = 0;
  while((await page.evaluate(() => scr.name)) === 'question' && pq++ < 400){
    const right = pq % 3 !== 0;
    try { await page.evaluate(r => window.__ans(r), right); } catch(e){ log('placement answer: ' + e.message.slice(0, 100)); break; }
    const ok = await page.evaluate(() => !!document.querySelector('.feedback.ok'));
    if(ok !== right) log('PLACEMENT: expected ' + (right ? 'accept' : 'reject') + ' but UI ' + (ok ? 'accepted' : 'rejected') + ' :: ' + (await page.evaluate(() => stripTags(SESS.q.prompt).slice(0, 60))));
    await badText('placement');
    await page.click('[data-act=qnext]');
  }
  const scrAfter = await page.evaluate(() => scr.name); if(scrAfter !== 'placementDone') log('placement did not finish: ' + scrAfter);
  console.log('placement questions answered: ' + pq);
  await page.click('[data-act=go]'); // to hub
  await badText('hub');

  // ---- every skill x tier, real clicks
  const ids = await page.evaluate(() => SKILLS.map(s => s.id)); let nq = 0;
  for(const id of ids){
    if(ONLY && id !== ONLY) continue;
    // lesson walkthrough
    await page.evaluate(i => go('lesson', { id: i, i: 0 }), id);
    const steps = await page.evaluate(i => skillById(i).lesson.steps.length, id);
    for(let s = 0; s < steps; s++){
      await badText('lesson ' + id);
      const qz = await page.evaluate(() => { const e = document.querySelector('.opt'); return !!e; });
      if(qz){ // wrong first, then right
        const info = await page.evaluate(() => { const q = skillById(scr.p.id).lesson.steps[scr.p.i].quiz; return q.options.map(o => o.ok); });
        const wrong = info.findIndex(o => !o), right = info.findIndex(o => o);
        if(wrong > -1){ await page.evaluate(k => document.querySelector('.opt[data-k="' + k + '"]').click(), wrong); if(await page.evaluate(() => !document.getElementById('lnext').disabled)) log(id + ' lesson: wrong quiz answer unlocked Next'); }
        await page.evaluate(k => document.querySelector('.opt[data-k="' + k + '"]').click(), right);
        if(await page.evaluate(() => document.getElementById('lnext').disabled)) log(id + ' lesson: right quiz answer did not unlock Next');
      }
      await page.evaluate(() => document.querySelector('[data-act=lnext]').click());
    }
    await badText('trick ' + id);
    for(const kind of ['guided', 'practice', 'challenge']){
      await page.evaluate(([k, i]) => startSession(k, i), [kind, id]);
      for(let n = 0; n < PER; n++){
        if((await page.evaluate(() => scr.name)) !== 'question') break;
        const where = id + '/' + kind;
        const plan = ['R', 'W', 'WR', 'WW', 'R', 'W'][n % 6]; nq++;
        const info = await page.evaluate(() => ({ p: stripTags(SESS.q.prompt).slice(0, 70), t: SESS.q.type }));
        for(let a = 0; a < plan.length; a++){
          const right = plan[a] === 'R';
          try { await page.evaluate(r => window.__ans(r), right); } catch(e){ if(/data-k="-1"/.test(e.message)) break; log(where + ' [' + info.t + '] cannot answer via UI: ' + e.message.slice(0, 90) + ' :: ' + info.p); break; }
          const st = await page.evaluate(() => ({ ok: !!document.querySelector('.feedback.ok'), phase: SESS.phase, tries: SESS.tries, try: /Try once more/.test(document.getElementById('app').innerText), expl: !!document.querySelector('.explain') }));
          if(right && !st.ok) log(where + ' RIGHT answer rejected [' + info.t + '] ' + info.p);
          if(!right && st.ok) log(where + ' WRONG answer ACCEPTED [' + info.t + '] ' + info.p);
          if(!right && a === 0 && plan.length > 1 && !st.try) log(where + ' first wrong did not offer retry ' + info.p);
          if(!right && a === plan.length - 1 && plan.length === 2 && !st.expl) log(where + ' second wrong did not show explanation ' + info.p);
        }
        await badText(where);
        if(await page.evaluate(() => SESS && SESS.phase === 'fb')) await page.evaluate(() => document.querySelector('[data-act=qnext]').click());
        else { // still asking (single wrong): answer right to move on
          await page.evaluate(() => window.__ans(true)); await page.evaluate(() => document.querySelector('[data-act=qnext]').click());
        }
      }
      if((await page.evaluate(() => scr.name)) === 'question') await page.evaluate(() => finishSession(true));
      await badText('results ' + id);
    }
  }
  console.log('questions answered through the UI: ' + nq);

  // ---- stickers never run out
  const before = await page.evaluate(() => { S.packs = 400; return S.stickers.length; });
  for(let i = 0; i < 300; i++) await page.evaluate(() => { const r = openPack(S); if(!r || !r.sticker) throw new Error('pack failed'); });
  const after = await page.evaluate(() => S.stickers.length); console.log('stickers ' + before + ' -> ' + after + ' after 300 packs'); if(after < before + 150) log('too many duplicates, album grows too slowly');
  // ---- every screen renders
  for(const s of ['hub', 'stickers', 'rewards', 'trophies', 'parentPin', 'parent', 'timeup', 'placementIntro', 'welcome']){ await page.evaluate(n => go(n), s); await badText(s); }
  for(const st of await page.evaluate(() => STRANDS.map(s => s.id))){ await page.evaluate(i => go('strand', { id: i }), st); await badText('strand ' + st); }
  for(const id of ids){ await page.evaluate(i => go('skill', { id: i }), id); await badText('skill ' + id); }
  // ---- reward claim, daily, timer
  await page.evaluate(() => { S.starBalance = 500; go('rewards'); }); await page.click('[data-act=claim]'); if(await page.evaluate(() => S.starBalance >= 500)) log('claim did not charge stars');
  // ---- v3 -> v4 migration
  const ctx2 = await b.newContext(); const p2 = await ctx2.newPage(); await p2.addInitScript(() => { if(!localStorage.getItem('melissaMathState_v3') && !localStorage.getItem('melissaMathState_v4')) localStorage.setItem('melissaMathState_v3', JSON.stringify({ strands: {}, totalStars: 77, starBalance: 40, stickers: ['🦄', '🐶'], theme: 'dino', onboardingDone: true, streak: { count: 4, lastPlayDate: '2026-01-01' }, claims: [], timer: { mode: 'free', minutes: 20, debtSeconds: 0 } })); });
  await p2.goto('file://' + path.join(__dirname, '..', 'index.html'));
  const mig = await p2.evaluate(() => ({ stars: S.starBalance, tot: S.totalStars, st: S.stickers.length, th: S.theme, scr: scr.name }));
  if(mig.stars !== 40 || mig.tot !== 77 || mig.st !== 2 || mig.th !== 'dino') log('migration lost data ' + JSON.stringify(mig)); else console.log('migration ok ' + JSON.stringify(mig));
  await page.screenshot({ path: path.join(require('os').tmpdir(), 'matemagics-e2e-last.png') });
  await b.close();
  console.log(fails ? '❌ E2E FAILED — ' + fails + ' problem(s)' : '✅ E2E PASSED');
  process.exit(fails ? 1 : 0);
})().catch(e => { console.log('E2E CRASH ' + e.stack); process.exit(1); });
