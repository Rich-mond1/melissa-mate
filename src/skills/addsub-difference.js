/* addsub-difference — find the difference by counting on (bridging through 10 or 100); how many more; change */
(function(){
  const NAMES = ['Ana', 'Marcus', 'Sophie', 'Ivan', 'Lucy', 'Diego', 'Ellen', 'Tom', 'Aisha', 'Kai', 'Mei', 'Leo'];
  const THINGS = ['stickers', 'marbles', 'shells', 'stars', 'beads', 'cards', 'points', 'books'];
  const ITEMS = ['pencil', 'rubber', 'toy car', 'balloon', 'bag of sweets', 'unicorn sticker', 'bouncy ball', 'notebook', 'badge'];
  function dg(n, i){ return Math.floor(n / Math.pow(10, i)) % 10; }

  /* the counting-on jumps from lo to hi: [[from,to],...] */
  function jumps(lo, hi){
    const js = []; let x = lo;
    function go(t){ if(t > x && t <= hi){ js.push([x, t]); x = t; } }
    if(x % 10 !== 0 || (x >= 100 && x % 100 !== 0)){
      if(x >= 100 && Math.ceil(x / 100) * 100 <= hi) go(Math.ceil(x / 100) * 100);
      else go(Math.ceil(x / 10) * 10);
    }
    if(hi - x >= 100) go(x + Math.floor((hi - x) / 100) * 100);
    if(hi - x >= 10) go(x + Math.floor((hi - x) / 10) * 10);
    go(hi);
    return js;
  }
  function jumpSum(js){ return js.reduce(function(t, j){ return t + (j[1] - j[0]); }, 0); }
  function jumpText(js){ let s = '<b>' + js[0][0] + '</b>'; js.forEach(function(j){ s += ' → <b>' + j[1] + '</b> (+' + (j[1] - j[0]) + ')'; }); return s; }
  function explainDiff(lo, hi, intro){
    const js = jumps(lo, hi), parts = js.map(function(j){ return j[1] - j[0]; });
    return ex(intro || 'Difference between ' + lo + ' and ' + hi, [
      'Count on from the <b>smaller</b> number, using friendly stops: ' + jumpText(js) + '.',
      'Add the jumps: ' + parts.join(' + ') + ' = <b>' + (hi - lo) + '</b>.',
      'Check: ' + lo + ' + ' + (hi - lo) + ' = ' + hi + '. ✅'
    ]);
  }
  function swapSub(hi, lo){ let v = 0; for(let i = 2; i >= 0; i--) v = v * 10 + Math.abs(dg(hi, i) - dg(lo, i)); return v; }
  function wrongList(lo, hi){
    const ans = hi - lo, js = jumps(lo, hi), out = [];
    out.push({ v: ans + 1, why: 'You counted the starting number too. Count the JUMPS, not the numbers you land on.' });
    out.push({ v: ans - 1, why: 'Close! You missed one. Add up all the jumps carefully.' });
    const sw = swapSub(hi, lo);
    if(sw !== ans) out.push({ v: sw, why: 'You took the smaller digit from the bigger digit in each column. Counting on from the smaller number avoids this.' });
    if(js.length > 1) out.push({ v: ans - (js[0][1] - js[0][0]), why: 'You left out the first jump (the one up to the next ten or hundred).' });
    if(lo + hi < 1000) out.push({ v: lo + hi, why: 'You added the two numbers. The difference is how far apart they are.' });
    return out;
  }
  const NEAR = [10, -10, 2, -2, 3, -3, 5, -5, 20, -20];

  function nlRange(lo, hi){
    const span = hi - lo; let major, minor;
    if(span <= 30){ major = 5; minor = 1; } else if(span <= 120){ major = 20; minor = 10; } else { major = 100; minor = span <= 400 ? 10 : 50; }
    let min = Math.floor(lo / major) * major, max = Math.ceil(hi / major) * major;
    if(max === min) max = min + major;
    return { min: min, max: max, minor: minor, major: major };
  }
  function nlVis(lo, hi, extra){
    const r = nlRange(lo, hi);
    return V.numberLine({ min: r.min, max: r.max, minor: r.minor, major: r.major, marks: [{ value: lo }, { value: hi, color: 'var(--vis-b,#9B51E0)' }] });
  }
  function marksOf(html){
    const L = []; let m; const re = /<text class="lbl" data-v="([^"]*)" x="([^"]*)"/g;
    while((m = re.exec(html))) L.push({ v: parseFloat(m[1]), x: parseFloat(m[2]) });
    const out = []; const re2 = /<circle class="mark" cx="([^"]*)"/g, a = L[0], b = L[L.length - 1];
    while((m = re2.exec(html))) out.push(Math.round(a.v + (parseFloat(m[1]) - a.x) / (b.x - a.x) * (b.v - a.v)));
    return out;
  }
  function diffOf(html){ const mk = marksOf(html); return Math.abs(mk[1] - mk[0]); }
  function pairGen(lmin, lmax, smin, smax, o){
    o = o || {};
    for(let i = 0; i < 1000; i++){
      const lo = randInt(lmin, lmax), s = randInt(smin, smax), hi = lo + s;
      if(hi > 999 && !o.big) continue;
      if(o.crossTen && Math.floor(lo / 10) === Math.floor(hi / 10)) continue;
      if(o.crossHundred && Math.floor(lo / 100) === Math.floor(hi / 100)) continue;
      if(lo % 10 === 0 || hi % 10 === 0) continue;
      return { lo: lo, hi: hi };
    }
    throw new Error('difference: no pair');
  }
  function numQ(p, prompt, visual, hint, intro){
    return mcqNum({ prompt: prompt, visual: visual, answer: jumpSum(jumps(p.lo, p.hi)), wrong: wrongList(p.lo, p.hi), nearby: NEAR, valid: function(v){ return v >= 1 && v < 1000; },
      hint: hint || 'Count on from the smaller number. Stop at the next ten (or hundred) first, then jump to the bigger number.',
      explain: explainDiff(p.lo, p.hi, intro), truth: p.hi - p.lo, decode: visual ? function(){ return diffOf(visual); } : undefined });
  }
  function wrongNum(wl){ return function(v){ for(let i = 0; i < wl.length; i++) if(wl[i].v === v) return wl[i].why; return ''; }; }
  function twoNames(){ const s = sample(NAMES, 2); return s; }

  function moreStory(p, big){
    const n = twoNames(), th = pick(THINGS);
    return n[0] + ' has <b>' + p.lo + '</b> ' + th + '. ' + n[1] + ' has <b>' + p.hi + '</b>. How many more ' + th + ' does ' + n[1] + ' have?';
  }
  function changeQ(price, pay, typed){
    const n = pick(NAMES), it = pick(ITEMS), payTxt = pay === 100 ? 'a £1 coin (100p)' : (pay === 200 ? 'a £2 coin (200p)' : 'a £5 note (500p)');
    const prompt = n + ' buys a ' + it + ' for <b>' + price + 'p</b> and pays with ' + payTxt + '. How much change?' + (typed ? ' Answer in pence.' : '');
    const ans = jumpSum(jumps(price, pay)), js = jumps(price, pay);
    const exp = ex('Change from ' + pay + 'p', ['Count on from the price up to ' + pay + 'p: ' + jumpText(js) + '.', 'Add the jumps: ' + js.map(function(j){ return j[1] - j[0]; }).join(' + ') + ' = <b>' + ans + 'p</b>.', 'Check: ' + price + 'p + ' + ans + 'p = ' + pay + 'p. ✅']);
    const vis = pay === 100 || pay === 200 ? nlVis(price, pay) : '';
    const hint = 'Count on from the price to the amount paid. Stop at the next 10p (or £1) on the way.';
    const wl = wrongList(price, pay).filter(function(w){ return w.v !== pay + price; }).concat([{ v: price, why: 'That is the price. The change is how much more is needed to reach what was paid.' }]);
    if(typed) return numeric({ prompt: prompt, visual: vis, answer: ans, unit: 'p', hint: hint, explain: exp, truth: pay - price, decode: vis ? function(){ return diffOf(vis); } : undefined, wrong: wrongNum(wl) });
    return mcqNum({ prompt: prompt, visual: vis, answer: ans, wrong: wl, nearby: [10, -10, 1, -1, 5, -5, 20], fmt: function(v){ return v + 'p'; }, valid: function(v){ return v >= 1 && v < 200; },
      hint: hint, explain: exp, truth: pay - price, decode: vis ? function(){ return diffOf(vis); } : undefined });
  }

  registerSkill({
    id: 'addsub-difference', strand: 'addsub', name: 'Find the difference', emoji: '↔️', year: 3, order: 240, prereq: ['addsub-sub-column'],
    lesson: {
      title: 'Counting on to find the difference',
      steps: [
        { say: 'The <b>difference</b> is how far apart two numbers are. Start at the smaller number, <b>47</b>, and count on to the bigger number, <b>53</b>.', vis: { kind: 'numberLine', args: [{ min: 45, max: 55, minor: 1, major: 5, marks: [{ value: 47 }, { value: 53, color: 'var(--vis-b,#9B51E0)' }] }] } },
        { say: 'Stop at the next ten to make it easy. <b>47 → 50</b> is a jump of 3. <b>50 → 53</b> is a jump of 3. Add the jumps: 3 + 3 = <b>6</b>. The difference is 6.', vis: { kind: 'numberLine', args: [{ min: 45, max: 55, minor: 1, major: 5, marks: [{ value: 47 }, { value: 53, color: 'var(--vis-b,#9B51E0)' }] }] },
          quiz: { prompt: 'What is the difference between 28 and 34?', options: [{ label: '6', ok: true }, { label: '7', ok: false }, { label: '5', ok: false }], right: 'Yes! 28 → 30 is 2, then 30 → 34 is 4. 2 + 4 = 6.', wrong: 'Count on: 28 → 30 is 2, then 30 → 34 is 4. 2 + 4 = 6.' } },
        { say: 'It works for change too! A toy costs <b>63p</b>. You pay <b>100p</b>. Count on: 63 → 70 is 7. 70 → 100 is 30. Change = 7 + 30 = <b>37p</b>.', vis: { kind: 'numberLine', args: [{ min: 60, max: 100, minor: 10, major: 20, marks: [{ value: 63 }, { value: 100, color: 'var(--vis-b,#9B51E0)' }] }] } },
        { say: 'With bigger numbers, stop at the next <b>hundred</b>. From <b>286</b> to <b>412</b>: 286 → 300 is 14. 300 → 400 is 100. 400 → 412 is 12. Total: 14 + 100 + 12 = <b>126</b>.', vis: { kind: 'numberLine', args: [{ min: 200, max: 600, minor: 10, major: 100, marks: [{ value: 286 }, { value: 412, color: 'var(--vis-b,#9B51E0)' }] }] },
          quiz: { prompt: 'Sam has 72 stickers. Maya has 91. How many more has Maya?', options: [{ label: '19', ok: true }, { label: '29', ok: false }, { label: '20', ok: false }], right: 'Yes! 72 → 80 is 8, then 80 → 91 is 11. 8 + 11 = 19.', wrong: 'Count on from 72: 72 → 80 is 8, then 80 → 91 is 11. 8 + 11 = 19.' } }
      ]
    },
    trick: {
      title: 'Count on, don’t take away',
      say: 'To find the difference, <b>count on</b> from the smaller number in friendly jumps: first to the next <b>ten</b> (or <b>hundred</b>), then the big jump, then the last little jump. Add the jumps up!',
      vis: { kind: 'numberLine', args: [{ min: 60, max: 100, minor: 10, major: 20, marks: [{ value: 63 }, { value: 100, color: 'var(--vis-b,#9B51E0)' }] }] },
      example: '100 − 63 → 63 → 70 (+7) → 100 (+30) → 7 + 30 = <b>37</b>'
    },
    gen: {
      1: function(){
        const f = randInt(0, 2);
        if(f === 0){ const p = pairGen(11, 88, 3, 11, { crossTen: true }); return numQ(p, 'What is the <b>difference</b> between <b>' + p.lo + '</b> and <b>' + p.hi + '</b>? Count on along the line.', nlVis(p.lo, p.hi)); }
        if(f === 1){ const p = pairGen(11, 88, 3, 11, { crossTen: true }); return numQ(p, moreStory(p), nlVis(p.lo, p.hi), 'Start at the smaller number and count on to the bigger one.', 'How many more?'); }
        const p = pairGen(11, 88, 3, 11, { crossTen: true }), first = Math.ceil(p.lo / 10) * 10 - p.lo, vis = nlVis(p.lo, p.hi);
        return mcqNum({ prompt: 'Counting on from <b>' + p.lo + '</b> to <b>' + p.hi + '</b>. How big is the <b>first jump</b>, to the next ten?', visual: vis, answer: first,
          wrong: [{ v: p.hi - p.lo, why: 'That is the whole difference. The first jump only goes as far as the next ten.' }, { v: p.lo % 10, why: 'That is the ones digit of ' + p.lo + '. We need how many MORE to reach the next ten.' }, { v: 10 - first, why: 'That is the part of the ten you have already. The jump is the part still missing.' }],
          nearby: [1, -1, 2, -2, 3], valid: function(v){ return v >= 1 && v <= 10; },
          hint: 'What is the next ten after ' + p.lo + '? How far is it from ' + p.lo + '?',
          explain: ex('The first jump', ['The next ten after ' + p.lo + ' is <b>' + (Math.ceil(p.lo / 10) * 10) + '</b>.', Math.ceil(p.lo / 10) * 10 + ' − ' + p.lo + ' = <b>' + first + '</b>.', 'So the first jump is <b>' + first + '</b>. ✅']),
          truth: jumps(p.lo, p.hi)[0][1] - p.lo, decode: function(){ const mk = marksOf(vis); return Math.ceil(mk[0] / 10) * 10 - mk[0]; } });
      },
      2: function(){
        const f = randInt(0, 3);
        if(f === 0){ const p = pairGen(21, 78, 14, 55, { crossTen: true }); return numQ(p, 'What is the <b>difference</b> between <b>' + p.lo + '</b> and <b>' + p.hi + '</b>?', nlVis(p.lo, p.hi)); }
        if(f === 1){ return changeQ(randInt(11, 97), 100, false); }
        if(f === 2){ const p = pairGen(251, 889, 6, 39, { crossHundred: true }); return numQ(p, 'What is the <b>difference</b> between <b>' + p.lo + '</b> and <b>' + p.hi + '</b>? Stop at ' + (Math.ceil(p.lo / 100) * 100) + ' on the way.', nlVis(p.lo, p.hi), 'Jump to the next hundred first, then count on to the bigger number.'); }
        const p = pairGen(23, 89, 12, 60, { crossTen: true }); return numQ(p, moreStory(p), '', 'Count on from the smaller number to the bigger one.', 'How many more?');
      },
      3: function(){
        const f = randInt(0, 4);
        if(f === 0){ const p = pairGen(121, 689, 85, 300, { crossHundred: true }), vis = nlVis(p.lo, p.hi), wl = wrongList(p.lo, p.hi);
          return numeric({ prompt: 'Find the <b>difference</b> between <b>' + p.lo + '</b> and <b>' + p.hi + '</b>. Type your answer.', visual: vis, answer: jumpSum(jumps(p.lo, p.hi)), hint: 'Count on from ' + p.lo + ': first to the next ten or hundred, then the big jump, then the last bit.',
            explain: explainDiff(p.lo, p.hi), truth: p.hi - p.lo, decode: function(){ return diffOf(vis); }, wrong: wrongNum(wl) }); }
        if(f === 1) return changeQ(randInt(101, 197), 200, true);
        if(f === 2) return changeQ(randInt(201, 497), 500, true);
        if(f === 3){ const p = pairGen(121, 689, 85, 300, { crossHundred: true }), wl = wrongList(p.lo, p.hi), n = twoNames(), th = pick(THINGS);
          return numeric({ prompt: n[0] + ' has <b>' + p.lo + '</b> ' + th + '. ' + n[1] + ' has <b>' + p.hi + '</b>. How many more ' + th + ' does ' + n[1] + ' have? Type your answer.', answer: jumpSum(jumps(p.lo, p.hi)),
            hint: 'Count on from the smaller number. Use the next hundred as a stop.', explain: explainDiff(p.lo, p.hi, 'How many more?'), truth: p.hi - p.lo, wrong: wrongNum(wl) }); }
        const p = pairGen(121, 689, 85, 300, { crossHundred: true }), first = jumps(p.lo, p.hi)[0], n = pick(NAMES);
        return numeric({ prompt: n + ' counts on from <b>' + p.lo + '</b> to <b>' + p.hi + '</b>. The first jump goes to <b>' + first[1] + '</b>. How big is that jump?', answer: first[1] - first[0],
          hint: 'How far is it from ' + p.lo + ' up to ' + first[1] + '?', explain: ex('The first jump', [p.lo + ' → ' + first[1] + ' is ' + first[1] + ' − ' + p.lo + ' = <b>' + (first[1] - first[0]) + '</b>.', 'Then ' + n + ' still has to go from ' + first[1] + ' to ' + p.hi + '.', 'The first jump is <b>' + (first[1] - first[0]) + '</b>. ✅']),
          truth: first[1] - p.lo, wrong: function(v){ return v === p.hi - p.lo ? 'That is the whole difference. The question asks only for the FIRST jump.' : ''; } });
      }
    }
  });
})();
