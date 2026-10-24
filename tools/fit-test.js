#!/usr/bin/env node
/* FIT TEST: after answering, the Next button (and the question) must be reachable WITHOUT scrolling on iPad-sized screens.
   Measures every skill x tier x several questions, in the answered ("feedback") state, with a wrong-answer explanation. */
const path = require('path'); const Bw = require('./lib/browser');
const SIZES = (process.env.FIT_SIZES || '1024x680,1180x720,820x1000,768x900,390x700').split(',').map(s => s.split('x').map(Number));
const N = +(process.env.FIT_N || 3); let fails = 0, checks = 0; const bad = [];
(async () => {
  const b = await Bw.launchChromium();
  for(const [W, H] of SIZES){
    const p = await (await b.newContext({ viewport: { width: W, height: H } })).newPage(); const errs = [];
    p.on('pageerror', e => errs.push(e.message));
    await p.goto('file://' + path.join(__dirname, '..', 'index.html')); await p.evaluate(() => localStorage.clear()); await p.reload(); await p.waitForTimeout(300);
    await p.evaluate(() => { window.__noGuard = true; S.onboardingDone = true; S.placement.done = true; });
    const res = await p.evaluate(async ([N, H]) => {
      const out = []; const wait = ms => new Promise(r => setTimeout(r, ms));
      for(const sk of SKILLS){ for(const tier of [1, 2, 3]){ for(let n = 0; n < N; n++){
        SESS = { kind: 'practice', skillId: sk.id, items: [{ skillId: sk.id, tier }], idx: 0, credits: [], by: {}, seen: {}, run: 0 };
        const q = genQ(sk.id, tier); if(!q) break; SESS.q = q; startQ(sk.id, tier);
        // wrong-answer feedback = the tallest state: mascot + explanation
        const wrong = q.type === 'mcq' ? q.options.findIndex(o => o.key !== q.correctKey) : -1;
        if(wrong >= 0){ try{ ACT.pick({ k: wrong }); ACT.pick({ k: q.options.findIndex(o => o.key === q.correctKey) }); }catch(e){} }
        if(SESS.phase !== 'fb'){ SESS.phase = 'fb'; SESS.fbHTML = petFB(false, '<div class="feedback">Not quite, Melissa!</div>') + explainHTML(q); go('question'); }
        await wait(90);
        const nb = document.querySelector('[data-act=qnext]'); if(!nb) continue;
        const r = nb.getBoundingClientRect(); const app = document.getElementById('app');
        const fbEl = document.querySelector('.feedback'), cor = document.querySelector('.opt.correct'); const fbR = fbEl && fbEl.getBoundingClientRect(), cR = cor && cor.getBoundingClientRect(); const seen = (!fbR || (fbR.bottom <= r.top && fbR.top >= 0)) && (!cR || (cR.bottom <= r.top && cR.top >= 0));
        out.push({ seen, id: sk.id, tier, type: q.type, bottom: Math.round(r.bottom), top: Math.round(r.top), vis: r.top >= 0 && r.bottom <= innerHeight + 0.5, scrollH: app.scrollHeight, H: innerHeight });
      } } }
      return out;
    }, [N, H]);
    const over = res.filter(r => !r.vis); checks += res.length; fails += over.length;
    const hid = res.filter(r => !r.seen); console.log(W + 'x' + H + ': ' + res.length + ' screens, Next hidden below the fold: ' + over.length + ' | feedback/correct answer needs a scroll: ' + hid.length + (over.length ? ' (worst +' + Math.max(...over.map(o => o.bottom - o.H)) + 'px)' : ''));
    over.slice(0, 6).forEach(o => console.log('   ' + o.id + ' t' + o.tier + ' ' + o.type + ' bottom=' + o.bottom + ' of ' + o.H));
    if(errs.length){ fails++; console.log('   console errors: ' + errs.slice(0, 2).join(' | ')); }
    await p.context().close();
  }
  await b.close(); console.log(fails ? '\nFIT: ' + fails + ' PROBLEMS in ' + checks + ' screens' : '\nFIT: all ' + checks + ' screens fit'); process.exit(fails ? 1 : 0);
})();
