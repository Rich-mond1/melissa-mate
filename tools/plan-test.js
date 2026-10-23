#!/usr/bin/env node
/* MY PLAN: what the Explorer's Quest found tricky + wobbly skills, ordered, with progress. Logic + hub card + plan screen. */
const path = require('path'); const E = require('./lib/load-engine')(); let fails = 0, checks = 0;
const ok = (c, m) => { checks++; if(!c){ fails++; console.log('  ✗ ' + m); } };
const FAIL = ['number-compare-order', 'number-10-100-more-less', 'addsub-sub-column', 'multdiv-3', 'multdiv-8', 'measure-units', 'geo-2d-shapes', 'geo-angles', 'data-tally-tables', 'data-pictograms', 'logic-puzzles', 'logic-strategies'];
function mk(){
  const s = E.mergeState({ onboardingDone: true, name: 'Melissa' });
  const res = {}; E.STRANDS.forEach(() => {}); E.skillsOfStrand('number').concat(E.skillsOfStrand('addsub'), E.skillsOfStrand('multdiv')).forEach(k => res[k.id] = 1);
  FAIL.forEach(id => res[id] = 0);
  s.placement.done = true; s.placement.started = true; s.placement.strandIdx = 9; s.placement.queue = []; s.placement.asked = 0; s.placement.misses = 0; s.placement.results = res; s.diag = null;
  ['number-place-value', 'addsub-add-column', 'multdiv-2-5-10', 'multdiv-4', 'logic-patterns', 'time-minutes'].forEach(id => { const st = E.skillState(s, id); s.skills[id] = st; st.medal = 1; });
  return s;
}
(async () => {
  // ---- logic ----
  let s = mk(), p = E.questPlan(s); const ids = p.items.map(x => x.id);
  ok(p.total === 12 && p.done === 0, 'plan has the 12 failed skills, none done: ' + p.total + '/' + p.done);
  ok(FAIL.every(id => ids.indexOf(id) > -1), 'every failed skill is in the plan');
  ok(ids.indexOf('addsub-sub-column') < ids.indexOf('measure-units') && ids.indexOf('multdiv-8') < ids.indexOf('geo-2d-shapes'), 'core number skills come before new topics');
  ok(ids.indexOf('data-tally-tables') < ids.indexOf('logic-strategies') && ids.indexOf('geo-2d-shapes') < ids.indexOf('logic-puzzles'), 'logic goes last');
  ok(p.next && p.next.unlocked && p.next.id === 'number-compare-order', 'next is the first UNLOCKED core skill: ' + (p.next && p.next.id));
  ok(p.items.every(x => x.unlocked === E.isUnlocked(s, E.skillsOfStrand(E.STRANDS.find(t => E.skillsOfStrand(t.id).some(k => k.id === x.id)).id).find(k => k.id === x.id))), 'unlocked flag matches isUnlocked');
  // wobbly skill goes first, as "refresh"
  s.skills['time-minutes'].wobbly = true; p = E.questPlan(s);
  ok(p.items[0].id === 'time-minutes' && p.items[0].why === 'refresh', 'wobbly skill is first, why=refresh');
  ok(p.total === 13, 'wobbly adds one item: ' + p.total);
  // a wobbly skill stops showing once recovered
  s.skills['time-minutes'].wobbly = false; ok(E.questPlan(s).total === 12, 'recovered skill leaves the plan');
  // silver = done, moves to the bottom, counted
  const a = E.skillState(s, 'number-compare-order'); s.skills['number-compare-order'] = a; a.medal = 2; p = E.questPlan(s);
  ok(p.done === 1 && p.items[p.items.length - 1].id === 'number-compare-order' && p.items[p.items.length - 1].done, 'silver counts as done and sinks');
  ok(p.next && p.next.id === 'number-10-100-more-less', 'next moves on: ' + (p.next && p.next.id));
  // bronze is NOT done
  a.medal = 1; ok(E.questPlan(s).done === 0, 'bronze is not done');
  // finishing all
  FAIL.forEach(id => { const st = E.skillState(s, id); s.skills[id] = st; st.medal = 2; }); p = E.questPlan(s);
  ok(p.done === p.total && p.next === null, 'all done -> next null');
  // no quest results, no wobbly -> empty
  const e = E.mergeState({ onboardingDone: true, name: 'M' }); ok(E.questPlan(e).total === 0 && E.questPlan(e).next === null, 'new profile: empty plan');
  // diag-style results
  const d = E.mergeState({ onboardingDone: true, name: 'M' }); d.diag = { done: true, strands: {}, results: { 'multdiv-3': { n: 2, ok: 0, pass: false }, 'multdiv-4': { n: 2, ok: 2, pass: true }, 'multdiv-8': { n: 0, ok: 0, pass: false, likely: false } } };
  ok(E.questPlan(d).items.map(x => x.id).join() === 'multdiv-3', 'diag: only asked-and-failed skills: ' + E.questPlan(d).items.map(x => x.id));
  // survives mergeState round trip (it is derived, state has no new field)
  ok(JSON.stringify(E.questPlan(E.mergeState(JSON.parse(JSON.stringify(mk()))))) === JSON.stringify(E.questPlan(mk())), 'plan is stable through save/load');
  // ---- UI ----
  const Bw = require('./lib/browser'); const b = await Bw.launchChromium();
  for(const W of [390, 820]){
    const pg = await (await b.newContext({ viewport: { width: W, height: 900 } })).newPage(); const errs = [];
    pg.on('pageerror', x => errs.push(x.message)); pg.on('console', m => { if(m.type() === 'error') errs.push(m.text()); });
    await pg.goto('file://' + path.join(__dirname, '..', 'index.html')); await pg.evaluate(() => localStorage.clear()); await pg.reload(); await pg.waitForTimeout(300);
    await pg.evaluate(x => { window.__noGuard = true; S = mergeState(x); S.welcomeGift = true; save(); go('hub'); }, mk()); await pg.waitForTimeout(250);
    const hub = await pg.evaluate(() => ({ t: document.body.innerText, card: !!document.querySelector('.plancard'), pill: (document.querySelector('.plancard .pill') || {}).textContent, btn: (document.querySelector('.plancard [data-act=skill]') || {}).textContent, ow: document.documentElement.scrollWidth > innerWidth + 1 }));
    ok(hub.card && hub.pill === '0/12', W + ' hub: plan card 0/12: ' + hub.pill);
    ok(/Next: .*Comparing/.test(hub.btn || ''), W + ' hub: next button names the skill: ' + hub.btn);
    ok(!hub.ow, W + ' hub: no horizontal overflow');
    ok(!/undefined|NaN|\[object/.test(hub.t), W + ' hub: no leaks');
    await pg.click('.plancard [data-act=skill]'); await pg.waitForTimeout(250);
    ok(await pg.evaluate(() => /Comparing/.test(document.body.innerText)), W + ': next button opens that skill');
    await pg.evaluate(() => go('hub')); await pg.waitForTimeout(200); await pg.waitForTimeout(400);
    await pg.click('.plancard [data-to=plan]'); await pg.waitForTimeout(250);
    const pl = await pg.evaluate(() => ({ t: document.body.innerText, n: document.querySelectorAll('.node').length, lock: document.querySelectorAll('.node.locked').length, ow: document.documentElement.scrollWidth > innerWidth + 1, imgs: [...document.images].filter(i => !i.complete || !i.naturalWidth).length }));
    ok(pl.n === 12, W + ' plan: 12 rows: ' + pl.n); ok(pl.lock === 2, W + ' plan: 2 locked (angles, pictograms): ' + pl.lock);
    ok(/0 of 12 done/.test(pl.t) && !/undefined|NaN|\[object/.test(pl.t), W + ' plan: header + no leaks'); ok(!pl.ow, W + ' plan: no overflow');
    // a finished plan shows the celebration and no Next button
    await pg.evaluate(() => { FAIL_IDS = null; const pl = questPlan(S); pl.items.forEach(it => { const st = skillState(S, it.id); S.skills[it.id] = st; st.medal = 2; }); save(); go('hub'); }); await pg.waitForTimeout(250);
    const fin = await pg.evaluate(() => ({ pill: document.querySelector('.plancard .pill').textContent, t: document.querySelector('.plancard').innerText, nx: !!document.querySelector('.plancard [data-act=skill]') }));
    ok(fin.pill === '12/12' && /amazing/.test(fin.t) && !fin.nx, W + ' hub: finished plan celebrates, no Next: ' + fin.pill);
    ok(errs.length === 0, W + ' console clean: ' + errs.join('|'));
    await pg.context().close();
  }
  await b.close();
  console.log(fails ? '\nPLAN: ' + fails + ' FAILED of ' + checks : '\nPLAN: all ' + checks + ' checks pass'); process.exit(fails ? 1 : 0);
})();
