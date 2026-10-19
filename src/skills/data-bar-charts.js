/* data-bar-charts: reading bar charts with scales of 1, 2, 5 and 10 */
(function(){
  var THEMES = [
    { intro: 'Children voted for their favourite pet.', yTitle: 'Votes', labs: ['Dog','Cat','Fish','Bird','Mouse','Horse'], things: 'children', ask: function(l){ return 'How many children chose ' + l + '?'; } },
    { intro: 'A class voted for a fruit for snack time.', yTitle: 'Votes', labs: ['Apple','Pear','Plum','Grape','Melon','Mango'], things: 'children', ask: function(l){ return 'How many children chose ' + l + '?'; } },
    { intro: 'These children read books in the holidays.', yTitle: 'Books', labs: ['Ana','Tom','Kai','Mei','Leo','Ivan'], things: 'books', ask: function(l){ return 'How many books did ' + l + ' read?'; } },
    { intro: 'The team scored goals in five matches.', yTitle: 'Goals', labs: ['Mon','Tue','Wed','Thu','Fri','Sat'], things: 'goals', ask: function(l){ return 'How many goals were scored on ' + l + '?'; } },
    { intro: 'Pupils chose a club to join.', yTitle: 'Pupils', labs: ['Art','Chess','Choir','Swim','Dance','Judo'], things: 'pupils', ask: function(l){ return 'How many pupils joined ' + l + '?'; } },
    { intro: 'The shop sold cakes this week.', yTitle: 'Cakes', labs: ['Lemon','Choc','Berry','Carrot','Ginger','Plain'], things: 'cakes', ask: function(l){ return 'How many ' + l + ' cakes were sold?'; } }
  ];
  function caption(g, L){
    var t = (L === g) ? 'Each gridline goes up by ' + g + '.' : 'Each gridline goes up by ' + g + '. Numbers are shown every ' + L + '.';
    return '<div style="text-align:center;font-weight:800;color:var(--vis-b,#9B51E0);margin-bottom:4px;font-size:14px">' + t + '</div>';
  }
  /* g gridline step, L label step, values multiples of `step` between lo..hi */
  function build(k, g, L, lo, hi, step){
    var th = pick(THEMES), labs = sample(th.labs, k), pool = [];
    for(var v = lo; v <= hi; v += step) pool.push(v);
    var vs = sample(pool, k), mx = Math.max.apply(null, vs), axisMax = Math.ceil(mx / L) * L;
    var items = labs.map(function(l, i){ return { label: l, value: vs[i] }; });
    var vis = caption(g, L) + V.barChart(items, { scale: g, labelEvery: L, axisMax: axisMax, yTitle: th.yTitle });
    return { th: th, labs: labs, vs: vs, g: g, L: L, vis: vis };
  }
  function dec(o){ return V.decodeBarChart(o.vis); }
  function readWrongs(o, i){
    var v = o.vs[i], g = o.g, w = [];
    if(v % o.L !== 0){
      var lo = Math.floor(v / o.L) * o.L;
      w.push({ v: lo, why: 'That is the nearest NUMBER on the side. The bar top is on an unnumbered gridline, so count on from it.' });
      w.push({ v: lo + o.L, why: 'The bar stops BEFORE that number. Look at which gridline the top touches.' });
    }
    if(g > 1) w.push({ v: v / g, why: 'You counted the gridlines. Read the NUMBER at the side: each line goes up by ' + g + '.' });
    w.push({ v: v + g, why: 'You read one gridline too high. Follow the top of the bar straight across to the side.' });
    w.push({ v: v - g, why: 'You read one gridline too low. Follow the top of the bar straight across to the side.' });
    return w;
  }
  function readExplain(o, i){
    var v = o.vs[i];
    return ex('Reading the bar', [
      'Find the <b>' + o.labs[i] + '</b> bar and look at the <b>top</b>.',
      'Follow across to the side. Each gridline goes up by <b>' + o.g + '</b>' + (v % o.L ? ', and the top is on a line with no number, so count on from the number below' : '') + '.',
      'The bar shows <b>' + v + '</b>. ✅'
    ]);
  }
  function two(k){ var i = randInt(0, k - 1); return [i, (i + randInt(1, k - 1)) % k]; }
  function argBest(arr, most){ var b = 0; arr.forEach(function(v, i){ if(most ? v > arr[b] : v < arr[b]) b = i; }); return b; }
  function extreme(d, most){ var b = null; Object.keys(d).forEach(function(l){ if(b === null || (most ? d[l] > d[b] : d[l] < d[b])) b = l; }); return K.text(b); }

  function g1(){
    var sc = pick([1, 1, 2]), o = build(3, sc, sc, sc, sc * 8, sc), k = 3, f = pick(['read', 'read', 'tall', 'ab']), i = randInt(0, k - 1);
    if(f === 'read') return mcqNum({ prompt: o.th.intro + ' ' + o.th.ask(o.labs[i]), visual: o.vis, answer: o.vs[i], wrong: readWrongs(o, i), count: 3,
      hint: 'Put your finger on the top of the bar and slide it left to the numbers.', explain: readExplain(o, i),
      truth: o.vs[i], decode: function(){ return dec(o)[o.labs[i]]; }, nearby: [o.g, -o.g, 2 * o.g] });
    if(f === 'tall'){
      var best = argBest(o.vs, true), ds = o.labs.map(function(l, x){ return opt(K.text(l), l, 'The ' + l + ' bar is shorter than the ' + o.labs[best] + ' bar.'); });
      return mcq({ prompt: o.th.intro + ' Which bar is the tallest?', visual: o.vis, correct: opt(K.text(o.labs[best]), o.labs[best]), distractors: ds, keepOrder: true, count: 3,
        hint: 'The tallest bar reaches the highest number.', explain: ex('Tallest bar', ['The bars show ' + o.labs.map(function(l, x){ return l + ' <b>' + o.vs[x] + '</b>'; }).join(', ') + '.', 'The biggest number is ' + o.vs[best] + '.', '<b>' + o.labs[best] + '</b> is the tallest. ✅']),
        truth: extreme(dec(o), true), decode: function(){ return extreme(dec(o), true); } });
    }
    var p = two(k), a = p[0], b = p[1], hi = o.vs[a] > o.vs[b] ? a : b;
    return mcq2({ prompt: o.th.intro + ' Which got more: ' + o.labs[a] + ' or ' + o.labs[b] + '?', visual: o.vis, correct: opt(K.text(o.labs[hi]), o.labs[hi]), other: opt(K.text(o.labs[hi === a ? b : a]), o.labs[hi === a ? b : a], 'That bar is shorter, so it shows less.'),
      hint: 'The taller bar shows the bigger number.', explain: ex('Comparing', [o.labs[a] + ' = <b>' + o.vs[a] + '</b>, ' + o.labs[b] + ' = <b>' + o.vs[b] + '</b>.', 'The bigger number is ' + o.vs[hi] + '.', '<b>' + o.labs[hi] + '</b> got more. ✅']),
      truth: (function(){ var d = dec(o); return K.text(d[o.labs[a]] > d[o.labs[b]] ? o.labs[a] : o.labs[b]); })(), decode: function(){ var d = dec(o); return K.text(d[o.labs[a]] > d[o.labs[b]] ? o.labs[a] : o.labs[b]); } });
  }

  function g2(){
    var sc = pick([2, 5, 5, 10]), k = 4, o = build(k, sc, sc, sc, sc * 8, sc), f = pick(['read', 'read', 'diff', 'most', 'total', 'scale']), i = randInt(0, k - 1);
    if(f === 'scale'){
      var ds = [1, 2, 5, 10].map(function(x){ return opt(K.num(x), x, x === 1 ? 'Look at the numbers at the side: they jump by more than 1.' : 'Check the numbers at the side. See how far it is from one number to the next.'); });
      return mcq({ prompt: 'Look at the numbers up the side. How much does each gridline go up by?', visual: o.vis, correct: opt(K.num(sc), sc), distractors: ds, keepOrder: true,
        hint: 'Subtract two neighbouring numbers on the side, like the second one take away the first one.',
        explain: ex('Finding the scale', ['Look at the side numbers: 0, ' + sc + ', ' + (2 * sc) + '…', 'From one to the next you go up by ' + sc + '.', 'Each gridline goes up by <b>' + sc + '</b>. ✅']),
        truth: K.num((function(){ var yl = o.vis.match(/class="yl" data-v="(\d+)"/g); return parseInt(/data-v="(\d+)"/.exec(yl[1])[1], 10) - parseInt(/data-v="(\d+)"/.exec(yl[0])[1], 10); })()),
        decode: function(){ var yl = o.vis.match(/class="yl" data-v="(\d+)"/g); return K.num(parseInt(/data-v="(\d+)"/.exec(yl[1])[1], 10) - parseInt(/data-v="(\d+)"/.exec(yl[0])[1], 10)); } });
    }
    if(f === 'read') return mcqNum({ prompt: o.th.intro + ' ' + o.th.ask(o.labs[i]), visual: o.vis, answer: o.vs[i], wrong: readWrongs(o, i),
      hint: 'Check the scale first. Then follow the top of the bar across to the numbers.', explain: readExplain(o, i),
      truth: o.vs[i], decode: function(){ return dec(o)[o.labs[i]]; }, nearby: [sc, -sc, 2 * sc, -2 * sc] });
    if(f === 'most'){
      var most = chance(0.5), best = argBest(o.vs, most), ds2 = o.labs.map(function(l, x){ return opt(K.text(l), l, l + ' has ' + o.vs[x] + ' — ' + (most ? 'another bar is taller.' : 'another bar is shorter.')); });
      return mcq({ prompt: o.th.intro + ' Which bar is the ' + (most ? 'tallest' : 'shortest') + '?', visual: o.vis, correct: opt(K.text(o.labs[best]), o.labs[best]), distractors: ds2, keepOrder: true,
        hint: 'Compare the bar tops against the numbers at the side.', explain: ex('Comparing bars', ['The values are ' + o.labs.map(function(l, x){ return l + ' <b>' + o.vs[x] + '</b>'; }).join(', ') + '.', 'The ' + (most ? 'biggest' : 'smallest') + ' is ' + o.vs[best] + '.', '<b>' + o.labs[best] + '</b>. ✅']),
        truth: extreme(dec(o), most), decode: function(){ return extreme(dec(o), most); } });
    }
    if(f === 'total'){
      var tot = o.vs.reduce(function(a, b){ return a + b; }, 0);
      return mcqNum({ prompt: o.th.intro + ' How many ' + o.th.things + ' altogether?', visual: o.vis, answer: tot,
        wrong: [{ v: tot / sc, why: 'You added up gridline numbers, not the values. Read each bar against the side numbers.' }, { v: tot - o.vs[k - 1], why: 'You missed a bar out. Add all ' + k + ' bars.' }, { v: tot + sc, why: 'Check one of your bar readings.' }],
        hint: 'Read every bar first, then add them all.', explain: ex('Adding the bars', ['Read each bar: <b>' + o.vs.join(', ') + '</b>.', 'Add: ' + o.vs.join(' + ') + '.', 'Altogether <b>' + tot + '</b>. ✅']),
        truth: (function(){ var d = dec(o), s = 0; Object.keys(d).forEach(function(l){ s += d[l]; }); return s; })(), decode: function(){ var d = dec(o), s = 0; Object.keys(d).forEach(function(l){ s += d[l]; }); return s; }, nearby: [sc, -sc, 2 * sc, -2 * sc] });
    }
    var p = two(k), a = p[0], b = p[1], hi = o.vs[a] > o.vs[b] ? a : b, lo = hi === a ? b : a, diff = o.vs[hi] - o.vs[lo];
    return mcqNum({ prompt: o.th.intro + ' How many more for ' + o.labs[hi] + ' than ' + o.labs[lo] + '?', visual: o.vis, answer: diff,
      wrong: [{ v: o.vs[hi] + o.vs[lo], why: '“How many more” is a take away, not an add.' }, { v: diff / sc, why: 'You counted gridlines between the bars. Each gridline is worth ' + sc + '.' }, { v: o.vs[hi], why: 'That is just one bar. Subtract the other bar.' }],
      hint: 'Read both bars, then subtract the smaller from the bigger.', explain: ex('How many more?', [o.labs[hi] + ' = <b>' + o.vs[hi] + '</b>, ' + o.labs[lo] + ' = <b>' + o.vs[lo] + '</b>.', 'Subtract: ' + o.vs[hi] + ' − ' + o.vs[lo] + '.', 'The difference is <b>' + diff + '</b>. ✅']),
      truth: Math.abs(dec(o)[o.labs[a]] - dec(o)[o.labs[b]]), decode: function(){ var d = dec(o); return Math.abs(d[o.labs[a]] - d[o.labs[b]]); }, nearby: [sc, -sc, 2 * sc, -2 * sc] });
  }

  function g3(){
    var variant = pick([{ g: 5, L: 10, step: 5, lo: 5, hi: 50 }, { g: 1, L: 2, step: 1, lo: 1, hi: 15 }, { g: 10, L: 10, step: 5, lo: 5, hi: 55 }, { g: 2, L: 2, step: 1, lo: 1, hi: 15 }]);
    // variant 3 (g=10, step 5) puts bars BETWEEN gridlines; variant 4 likewise (g=2, odd values)
    var k = 5, o = build(k, variant.g, variant.L, variant.lo, variant.hi, variant.step), f = pick(['read', 'read', 'total', 'diff', 'which', 'count']), i = randInt(0, k - 1);
    if(f === 'read') return numeric({ prompt: o.th.intro + ' ' + o.th.ask(o.labs[i]) + ' Type the number.', visual: o.vis, answer: o.vs[i],
      hint: 'Check the scale caption above the chart. If the top of the bar is between gridlines, work out the halfway value.', explain: readExplain(o, i),
      truth: o.vs[i], decode: function(){ return dec(o)[o.labs[i]]; },
      wrong: function(x){ var r = readWrongs(o, i).filter(function(w){ return w.v === x; })[0]; return r ? r.why : ''; } });
    if(f === 'total'){
      var tot = o.vs.reduce(function(a, b){ return a + b; }, 0);
      return numeric({ prompt: o.th.intro + ' How many ' + o.th.things + ' altogether?', visual: o.vis, answer: tot,
        hint: 'Read all five bars carefully, write each number down, then add.', explain: ex('Adding the bars', ['Read each bar: <b>' + o.vs.join(', ') + '</b>.', 'Add them all together.', 'Altogether <b>' + tot + '</b>. ✅']),
        truth: (function(){ var d = dec(o), s = 0; Object.keys(d).forEach(function(l){ s += d[l]; }); return s; })(), decode: function(){ var d = dec(o), s = 0; Object.keys(d).forEach(function(l){ s += d[l]; }); return s; },
        wrong: function(x){ return x === tot - o.vs[k - 1] ? 'You missed one bar out.' : ''; } });
    }
    if(f === 'which'){
      var tv = o.vs[i], ds = o.labs.map(function(l, x){ return opt(K.text(l), l, 'The ' + l + ' bar shows ' + o.vs[x] + ', not ' + tv + '.'); });
      return mcq({ prompt: o.th.intro + ' Which bar shows ' + tv + '?', visual: o.vis, correct: opt(K.text(o.labs[i]), o.labs[i]), distractors: ds, keepOrder: true,
        hint: 'Find ' + tv + ' on the side, then look along the gridline for a bar whose top touches it.',
        explain: ex('Finding ' + tv, ['Find ' + tv + ' on the side (count on from a number if it has no label).', 'Slide across to the bar that stops there.', 'It is the <b>' + o.labs[i] + '</b> bar. ✅']),
        truth: (function(){ var d = dec(o), r = null; Object.keys(d).forEach(function(l){ if(d[l] === tv) r = l; }); return K.text(r); })(), decode: function(){ var d = dec(o), r = null; Object.keys(d).forEach(function(l){ if(d[l] === tv) r = l; }); return K.text(r); } });
    }
    if(f === 'count'){
      var sorted = o.vs.slice().sort(function(a, b){ return a - b; }), thr = sorted[2] + (variant.step > 1 ? Math.floor(variant.step / 2) : 0) + (variant.step === 1 ? 0 : 0);
      thr = sorted[1] + 1; while(o.vs.indexOf(thr) >= 0) thr++;
      var cnt = o.vs.filter(function(v){ return v > thr; }).length;
      return numeric({ prompt: o.th.intro + ' How many bars show more than ' + thr + '?', visual: o.vis, answer: cnt,
        hint: 'Find ' + thr + ' on the side. Count the bars that go higher than that.',
        explain: ex('Bars above ' + thr, ['Find ' + thr + ' on the side.', 'Bars taller than that: ' + o.labs.filter(function(l, x){ return o.vs[x] > thr; }).join(', ') + '.', 'There ' + (cnt === 1 ? 'is' : 'are') + ' <b>' + cnt + '</b> ' + (cnt === 1 ? 'bar' : 'bars') + '. ✅']),
        truth: cnt, decode: function(){ var d = dec(o); return Object.keys(d).filter(function(l){ return d[l] > thr; }).length; } });
    }
    var p = two(k), a = p[0], b = p[1], hi = o.vs[a] > o.vs[b] ? a : b, lo = hi === a ? b : a, diff = o.vs[hi] - o.vs[lo];
    return numeric({ prompt: o.th.intro + ' How many more for ' + o.labs[hi] + ' than ' + o.labs[lo] + '?', visual: o.vis, answer: diff,
      hint: 'Read both bars with care, then subtract.', explain: ex('How many more?', [o.labs[hi] + ' = <b>' + o.vs[hi] + '</b> and ' + o.labs[lo] + ' = <b>' + o.vs[lo] + '</b>.', 'Subtract: ' + o.vs[hi] + ' − ' + o.vs[lo] + '.', 'The difference is <b>' + diff + '</b>. ✅']),
      truth: Math.abs(dec(o)[o.labs[a]] - dec(o)[o.labs[b]]), decode: function(){ var d = dec(o); return Math.abs(d[o.labs[a]] - d[o.labs[b]]); },
      wrong: function(x){ return x === o.vs[hi] + o.vs[lo] ? '“How many more” means subtract.' : ''; } });
  }

  function lessonChart(items, g, L, mx){ return { kind: 'barChart', args: [items, { scale: g, labelEvery: L, axisMax: mx, yTitle: 'Votes' }] }; }
  var I1 = [{ label: 'Dog', value: 6 }, { label: 'Cat', value: 4 }, { label: 'Fish', value: 2 }];
  var I5 = [{ label: 'Dog', value: 30 }, { label: 'Cat', value: 20 }, { label: 'Fish', value: 45 }];
  registerSkill({
    id: 'data-bar-charts', strand: 'data', name: 'Bar charts', emoji: '📊', year: 3, order: 830, prereq: ['data-pictograms'],
    lesson: {
      title: 'Reading bar charts',
      steps: [
        { say: 'A <b>bar chart</b> uses bars to show numbers. The <b>taller</b> the bar, the <b>bigger</b> the number. Each bar has a name underneath.', vis: lessonChart(I1, 1, 1, 6) },
        { say: 'To read a bar, look at its <b>top</b>. Slide straight across to the <b>numbers</b> on the side. The Dog bar reaches <b>6</b>.', vis: lessonChart(I1, 1, 1, 6),
          quiz: { prompt: 'Look at the chart. How many votes for Cat?', options: [{ label: '4', ok: true }, { label: '6', ok: false }, { label: '2', ok: false }], right: 'Yes! The top of the Cat bar is on 4.', wrong: 'Slide across from the top of the Cat bar. It stops at 4.' } },
        { say: 'Always check the <b>scale</b>! Here the numbers go up in <b>10s</b> but there is a gridline halfway too. Each gridline goes up by <b>5</b>.', vis: lessonChart(I5, 5, 10, 50) },
        { say: 'Fish stops on the gridline between 40 and 50. That line has no number, so count on: 40 + 5 = <b>45</b>. Dog stops on <b>30</b> and Cat on <b>20</b>.', vis: lessonChart(I5, 5, 10, 50),
          quiz: { prompt: 'Each gridline goes up by 5. A bar stops on the line just above 30. What is the value?', options: [{ label: '35', ok: true }, { label: '31', ok: false }, { label: '40', ok: false }], right: 'Yes! 30 + 5 = 35.', wrong: 'The next gridline above 30 is 30 + 5 = 35.' } },
        { say: 'To compare two bars, <b>read both</b> then <b>subtract</b>. Fish 45, Cat 20: 45 − 20 = <b>25</b> more.', vis: lessonChart(I5, 5, 10, 50),
          quiz: { prompt: 'Dog is 30 and Cat is 20. How many more is Dog?', options: [{ label: '10', ok: true }, { label: '50', ok: false }, { label: '2', ok: false }], right: 'Yes! 30 − 20 = 10.', wrong: 'Take away: 30 − 20 = 10.' } }
      ]
    },
    trick: {
      title: 'Check the scale, then count on',
      say: 'Before you read a bar, find out <b>how much each gridline is worth</b> (look at two neighbouring numbers). If the bar stops on a line with no number, <b>count on</b> from the number below.',
      vis: lessonChart(I5, 5, 10, 50),
      example: 'Bar above 40, one gridline up, lines go up by 5 → 40 + 5 = <b>45</b>'
    },
    gen: { 1: g1, 2: g2, 3: g3 }
  });
})();
