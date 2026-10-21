/* data-two-step: two-step questions from pictograms, bar charts and tables. Answers are recomputed from the DECODED drawing. */
(function(){
  var INKC = 'var(--vis-ink,#1B1B2F)';
  var THEMES = [
    { intro: 'The children collected stickers.', emoji: '⭐', things: 'stickers', yTitle: 'Stickers', who: ['Ana','Marcus','Sophie','Ivan','Lucy','Diego','Ellen','Tom'] },
    { intro: 'The children read books this term.', emoji: '📚', things: 'books', yTitle: 'Books', who: ['Aisha','Kai','Mei','Leo','Ana','Tom','Lucy','Ivan'] },
    { intro: 'Players scored goals this season.', emoji: '⚽', things: 'goals', yTitle: 'Goals', who: ['Diego','Ellen','Marcus','Sophie','Kai','Leo','Mei','Aisha'] },
    { intro: 'The friends picked apples at a farm.', emoji: '🍎', things: 'apples', yTitle: 'Apples', who: ['Tom','Ana','Lucy','Ivan','Kai','Mei','Ellen','Diego'] },
    { intro: 'The bakers sold cupcakes at a fair.', emoji: '🧁', things: 'cupcakes', yTitle: 'Cakes', who: ['Sophie','Leo','Aisha','Marcus','Tom','Ana','Ivan','Mei'] }
  ];
  function numTable(labs, vs, th){
    var td = 'style="padding:4px 12px;border:2px solid ' + INKC + ';text-align:center"';
    var s = '<table style="border-collapse:collapse;margin:0 auto;color:' + INKC + ';background:#fff;font-weight:800"><tr><th ' + td + '>Name</th><th ' + td + '>' + th.yTitle + '</th></tr>';
    labs.forEach(function(l, i){ s += '<tr class="trow" data-label="' + l + '"><td ' + td + '>' + l + '</td><td class="fc" ' + td + '>' + vs[i] + '</td></tr>'; });
    return s + '</table>';
  }
  function decTable(html){
    var out = {};
    html.split('<tr class="trow"').slice(1).forEach(function(ch){ out[/data-label="([^"]*)"/.exec(ch)[1]] = parseInt(/class="fc"[^>]*>(\d+)</.exec(ch)[1], 10); });
    return out;
  }
  /* source: kind 'pict' | 'bar' | 'table'. returns {vis, labs, vs (generator numbers), sc, kind, th, dec()} */
  function source(kind, k, lo, hi, tierHalf){
    var th = pick(THEMES), labs = sample(th.who, k), o = { th: th, labs: labs, kind: kind, sc: 1 };
    if(kind === 'pict'){
      var key = pick(tierHalf ? [2, 5, 10] : [2, 5]), pool = [];
      for(var c = lo; c <= hi; c++){ pool.push(c); if(tierHalf && key % 2 === 0 && c < hi) pool.push(c + 0.5); }
      var cs = sample(pool, k);
      o.sc = key; o.cs = cs; o.vs = cs.map(function(c){ return c * key; });
      o.vis = V.pictogram(labs.map(function(l, i){ return { label: l, count: cs[i], emoji: th.emoji }; }), key);
      o.dec = function(){ return V.decodePictogram(o.vis); };
    } else if(kind === 'bar'){
      var sc = pick([2, 5, 10]), pl = [];
      for(var v = lo; v <= hi; v++) pl.push(v * sc);
      o.sc = sc; o.vs = sample(pl, k);
      var mx = Math.max.apply(null, o.vs);
      o.vis = '<div style="text-align:center;font-weight:800;color:var(--vis-b,#9B51E0);margin-bottom:4px;font-size:14px">Each gridline goes up by ' + sc + '.</div>' + V.barChart(labs.map(function(l, i){ return { label: l, value: o.vs[i] }; }), { scale: sc, axisMax: Math.ceil(mx / sc) * sc, yTitle: th.yTitle });
      o.dec = function(){ return V.decodeBarChart(o.vis); };
    } else {
      var p2 = []; for(var w = lo * 2; w <= hi * 4; w++) p2.push(w);
      o.vs = sample(p2, k); o.vis = numTable(labs, o.vs, th); o.dec = function(){ return decTable(o.vis); };
    }
    return o;
  }
  function tell(o){ return o.kind === 'pict' ? 'pictogram' : (o.kind === 'bar' ? 'bar chart' : 'table'); }
  function scaleWrong(o, v, what){
    if(o.sc <= 1 || v % o.sc !== 0) return null;
    return { v: v / o.sc, why: o.kind === 'pict' ? 'You used the number of SYMBOLS. Multiply by the key (' + o.sc + ') first.' : 'You used gridline numbers. Each gridline is worth ' + o.sc + '.' };
  }
  function ds(o){ return o.dec(); }
  function sum(d, names){ var s = 0; names.forEach(function(n){ s += d[n]; }); return s; }
  function readStep(o, idx){ return o.labs[idx] + ' = <b>' + o.vs[idx] + '</b>'; }
  function wrongs(arr){ return arr.filter(function(x){ return x; }); }
  function sortedIdx(vs){ return vs.map(function(v, i){ return i; }).sort(function(a, b){ return vs[b] - vs[a]; }); }
  function hint1(o){ return o.kind === 'pict' ? 'Step 1: use the key to find each number. Step 2: do the sum.' : (o.kind === 'bar' ? 'Step 1: read each bar using the gridline scale. Step 2: do the sum.' : 'Step 1: find each number in the table. Step 2: do the sum.'); }
  function pickKind(){ return pick(['pict', 'bar', 'table']); }
  function numAns(o, idxs, expr, prompt, answer, wrongList, extraTruth, steps, nearby){
    return mcqNum({ prompt: prompt, visual: o.vis, answer: answer, wrong: wrongs(wrongList), hint: hint1(o),
      explain: ex('Two steps', steps), truth: extraTruth(ds(o)), decode: function(){ return extraTruth(ds(o)); }, nearby: nearby || [1, -1, 2, -2, 5, -5, 10, -10] });
  }

  function g1(){
    var o = source(pickKind(), 3, 2, 8, false), f = pick(['together', 'together', 'diff']), k = 3;
    var a = randInt(0, 2), b = (a + randInt(1, 2)) % 3, A = o.labs[a], B = o.labs[b], t = o.th.intro;
    if(f === 'together'){
      var ans = o.vs[a] + o.vs[b];
      return mcqNum({ prompt: t + ' How many ' + o.th.things + ' did ' + A + ' and ' + B + ' get altogether?', visual: o.vis, answer: ans, count: 3,
        wrong: wrongs([scaleWrong(o, ans), { v: o.vs[a], why: 'That is only ' + A + '. Add ' + B + ' too.' }, { v: Math.abs(o.vs[a] - o.vs[b]), why: '“Altogether” means add, not take away.' }]),
        hint: hint1(o), explain: ex('Two steps', ['Step 1: ' + readStep(o, a) + ' and ' + readStep(o, b) + '.', 'Step 2: add them: ' + o.vs[a] + ' + ' + o.vs[b] + '.', 'Altogether: <b>' + ans + '</b>. ✅']),
        truth: sum(ds(o), [A, B]), decode: function(){ return sum(ds(o), [A, B]); }, nearby: [o.sc, -o.sc, 2, -2, 10] });
    }
    var hi = o.vs[a] > o.vs[b] ? a : b, lo = hi === a ? b : a, diff = o.vs[hi] - o.vs[lo];
    return mcqNum({ prompt: t + ' How many more ' + o.th.things + ' did ' + o.labs[hi] + ' get than ' + o.labs[lo] + '?', visual: o.vis, answer: diff, count: 3,
      wrong: wrongs([scaleWrong(o, diff), { v: o.vs[hi] + o.vs[lo], why: '“How many more” means take away, not add.' }, { v: o.vs[hi], why: 'That is just one total. Subtract the other.' }]),
      hint: hint1(o), explain: ex('Two steps', ['Step 1: ' + readStep(o, hi) + ' and ' + readStep(o, lo) + '.', 'Step 2: subtract: ' + o.vs[hi] + ' − ' + o.vs[lo] + '.', 'The difference: <b>' + diff + '</b>. ✅']),
      truth: Math.abs(ds(o)[A] - ds(o)[B]), decode: function(){ var d = ds(o); return Math.abs(d[A] - d[B]); }, nearby: [o.sc, -o.sc, 2, -2, 10] });
  }

  function g2(){
    var o = source(pickKind(), 4, 2, 7, true), f = pick(['together', 'vs', 'gone', 'range', 'added']), k = 4;
    var order = sortedIdx(o.vs), t = o.th.intro;
    if(f === 'together'){
      var p = sample([0, 1, 2, 3], 3), a = p[0], b = p[1], c = p[2], ans = o.vs[a] + o.vs[b] + o.vs[c];
      return mcqNum({ prompt: t + ' How many ' + o.th.things + ' did ' + o.labs[a] + ', ' + o.labs[b] + ' and ' + o.labs[c] + ' get altogether?', visual: o.vis, answer: ans,
        wrong: wrongs([scaleWrong(o, ans), { v: ans - o.vs[c], why: 'You left ' + o.labs[c] + ' out. Add all three.' }, { v: ans - o.vs[a] + o.vs[b] - o.vs[b], why: 'Check that you included every one of the three.' }]),
        hint: hint1(o), explain: ex('Two steps', ['Step 1: ' + readStep(o, a) + ', ' + readStep(o, b) + ', ' + readStep(o, c) + '.', 'Step 2: add them all.', 'Altogether: <b>' + ans + '</b>. ✅']),
        truth: sum(ds(o), [o.labs[a], o.labs[b], o.labs[c]]), decode: function(){ return sum(ds(o), [o.labs[a], o.labs[b], o.labs[c]]); }, nearby: [o.sc, -o.sc, 2, -2, 10] });
    }
    if(f === 'vs'){
      var big = order[0], mid = order[1], sm = order[3], other = order[2];
      var ans2 = o.vs[big] + o.vs[mid] - o.vs[sm];
      if(!(o.vs[big] + o.vs[mid] > o.vs[sm])) return g2();
      return mcqNum({ prompt: t + ' How many more did ' + o.labs[big] + ' and ' + o.labs[mid] + ' get together than ' + o.labs[sm] + '?', visual: o.vis, answer: ans2,
        wrong: wrongs([scaleWrong(o, ans2), { v: o.vs[big] - o.vs[sm], why: 'You forgot to add ' + o.labs[mid] + ' in step 1.' }, { v: o.vs[big] + o.vs[mid] + o.vs[sm], why: 'You added all three. After adding the first two, you take away the third.' }]),
        hint: 'Step 1: add the two together. Step 2: subtract the other one.',
        explain: ex('Two steps', ['Step 1: ' + o.labs[big] + ' + ' + o.labs[mid] + ' = ' + o.vs[big] + ' + ' + o.vs[mid] + ' = <b>' + (o.vs[big] + o.vs[mid]) + '</b>.', 'Step 2: ' + o.labs[sm] + ' = ' + o.vs[sm] + ', so subtract: ' + (o.vs[big] + o.vs[mid]) + ' − ' + o.vs[sm] + '.', 'Answer: <b>' + ans2 + '</b>. ✅']),
        truth: ds(o)[o.labs[big]] + ds(o)[o.labs[mid]] - ds(o)[o.labs[sm]], decode: function(){ var d = ds(o); return d[o.labs[big]] + d[o.labs[mid]] - d[o.labs[sm]]; }, nearby: [o.sc, -o.sc, 2, -2, 10] });
    }
    if(f === 'gone'){
      var tot = o.vs.reduce(function(a, b){ return a + b; }, 0), give = pick([5, 6, 8, 10]);
      return mcqNum({ prompt: t + ' All the ' + o.th.things + ' are put in one pile. Then ' + give + ' are given away. How many are left?', visual: o.vis, answer: tot - give,
        wrong: wrongs([{ v: tot, why: 'You found the total but forgot to take away ' + give + '.' }, { v: tot + give, why: '“Given away” means take away, not add.' }, scaleWrong(o, tot - give)]),
        hint: 'Step 1: find the total of all the rows. Step 2: take away ' + give + '.',
        explain: ex('Two steps', ['Step 1: add every row: ' + o.vs.join(' + ') + ' = <b>' + tot + '</b>.', 'Step 2: take away ' + give + ': ' + tot + ' − ' + give + '.', 'Left: <b>' + (tot - give) + '</b>. ✅']),
        truth: (function(){ var d = ds(o), s = 0; Object.keys(d).forEach(function(l){ s += d[l]; }); return s - give; })(), decode: function(){ var d = ds(o), s = 0; Object.keys(d).forEach(function(l){ s += d[l]; }); return s - give; }, nearby: [1, -1, 2, -2, 5, -5, 10] });
    }
    if(f === 'range'){
      var hi = order[0], lo = order[3], d2 = o.vs[hi] - o.vs[lo];
      return mcqNum({ prompt: t + ' How many more ' + o.th.things + ' did the person with the MOST get than the person with the FEWEST?', visual: o.vis, answer: d2,
        wrong: wrongs([scaleWrong(o, d2), { v: o.vs[hi] + o.vs[lo], why: '“How many more” means subtract.' }, { v: o.vs[order[0]] - o.vs[order[1]], why: 'You compared the top two. Compare the most with the fewest.' }]),
        hint: 'Step 1: spot the biggest and the smallest. Step 2: subtract.',
        explain: ex('Two steps', ['Step 1: most = <b>' + o.vs[hi] + '</b> (' + o.labs[hi] + '), fewest = <b>' + o.vs[lo] + '</b> (' + o.labs[lo] + ').', 'Step 2: subtract: ' + o.vs[hi] + ' − ' + o.vs[lo] + '.', 'The difference: <b>' + d2 + '</b>. ✅']),
        truth: (function(){ var d = ds(o), vals = Object.keys(d).map(function(l){ return d[l]; }); return Math.max.apply(null, vals) - Math.min.apply(null, vals); })(),
        decode: function(){ var d = ds(o), vals = Object.keys(d).map(function(l){ return d[l]; }); return Math.max.apply(null, vals) - Math.min.apply(null, vals); }, nearby: [o.sc, -o.sc, 2, -2, 10] });
    }
    var a2 = randInt(0, 3), add = pick([4, 5, 6, 8]), b2 = (a2 + randInt(1, 3)) % 4, ans3 = o.vs[a2] + add + o.vs[b2];
    return mcqNum({ prompt: t + ' ' + o.labs[a2] + ' gets ' + add + ' more ' + (add === 1 ? singular(o.th.things) : o.th.things) + '. How many do ' + o.labs[a2] + ' and ' + o.labs[b2] + ' have now, altogether?', visual: o.vis, answer: ans3,
      wrong: wrongs([{ v: o.vs[a2] + o.vs[b2], why: 'You forgot the ' + add + ' more.' }, { v: o.vs[a2] + add, why: 'That is only ' + o.labs[a2] + '. Add ' + o.labs[b2] + ' too.' }, scaleWrong(o, ans3)]),
      hint: 'Step 1: add the extra ' + add + ' to the first person. Step 2: add the other person.',
      explain: ex('Two steps', ['Step 1: ' + o.labs[a2] + ' now has ' + o.vs[a2] + ' + ' + add + ' = <b>' + (o.vs[a2] + add) + '</b>.', 'Step 2: add ' + readStep(o, b2) + '.', 'Altogether: <b>' + ans3 + '</b>. ✅']),
      truth: ds(o)[o.labs[a2]] + add + ds(o)[o.labs[b2]], decode: function(){ var d = ds(o); return d[o.labs[a2]] + add + d[o.labs[b2]]; }, nearby: [1, -1, 2, -2, 5, -5, 10] });
  }

  function g3(){
    var kind = pickKind(), o = source(kind, 5, 2, kind === 'pict' ? 7 : 6, true), t = o.th.intro;
    var order = sortedIdx(o.vs), f = pick(['mostafter', 'mostafter', 'vs', 'least2', 'twopairs', 'gone']);
    if(f === 'mostafter'){
      var cur = order[0], x = order[1 + randInt(0, 2)], gap = o.vs[cur] - o.vs[x];
      var n = chance(0.5) ? gap + randInt(1, 5) : Math.max(1, gap - randInt(1, 4));
      if(n === gap || n <= 0) return g3();
      var winner = o.vs[x] + n > o.vs[cur] ? x : cur;
      var cands = o.labs.map(function(l, i){ return opt(K.text(l), l, i === x ? o.labs[x] + ' has ' + o.vs[x] + ' + ' + n + ' = ' + (o.vs[x] + n) + ', which is ' + (winner === cur ? 'still less than ' + o.vs[cur] + '.' : 'not the biggest.') : (i === cur ? o.labs[cur] + ' has ' + o.vs[cur] + ' now' + (winner === x ? ', but ' + o.labs[x] + ' will have more.' : ' — check the new total for ' + o.labs[x] + '.') : o.labs[i] + ' is smaller than the others.')); });
      var fm = function(d){ var best = null, tot = {}; Object.keys(d).forEach(function(l){ tot[l] = d[l] + (l === o.labs[x] ? n : 0); if(best === null || tot[l] > tot[best]) best = l; }); return K.text(best); };
      return mcq({ prompt: t + ' ' + o.labs[x] + ' gets ' + n + ' more ' + (n === 1 ? singular(o.th.things) : o.th.things) + '. Who has the most now?', visual: o.vis, correct: opt(K.text(o.labs[winner]), o.labs[winner]), distractors: cands, keepOrder: true,
        hint: 'Step 1: add the extra ' + n + ' to ' + o.labs[x] + '’s number. Step 2: compare everyone.',
        explain: ex('Two steps', ['Step 1: ' + o.labs[x] + ' = ' + o.vs[x] + ' + ' + n + ' = <b>' + (o.vs[x] + n) + '</b>.', 'Step 2: the biggest other number is ' + o.labs[cur] + ' with <b>' + o.vs[cur] + '</b>.', 'So <b>' + o.labs[winner] + '</b> has the most now. ✅']),
        truth: fm(ds(o)), decode: function(){ return fm(ds(o)); } });
    }
    if(f === 'vs'){
      var a = order[0], b = order[1], c = order[4], ans = o.vs[a] + o.vs[b] - o.vs[c];
      return numeric({ prompt: t + ' How many more did ' + o.labs[a] + ' and ' + o.labs[b] + ' get together than ' + o.labs[c] + '? Type the number.', visual: o.vis, answer: ans,
        hint: 'Step 1: add the first two. Step 2: subtract the third.',
        explain: ex('Two steps', ['Step 1: ' + o.vs[a] + ' + ' + o.vs[b] + ' = <b>' + (o.vs[a] + o.vs[b]) + '</b>.', 'Step 2: ' + (o.vs[a] + o.vs[b]) + ' − ' + o.vs[c] + '.', 'Answer: <b>' + ans + '</b>. ✅']),
        truth: ds(o)[o.labs[a]] + ds(o)[o.labs[b]] - ds(o)[o.labs[c]], decode: function(){ var d = ds(o); return d[o.labs[a]] + d[o.labs[b]] - d[o.labs[c]]; },
        wrong: function(v){ return v === o.vs[a] + o.vs[b] ? 'You added the first two but then forgot to subtract ' + o.labs[c] + '.' : (o.sc > 1 && v * o.sc === ans ? 'You forgot to use the ' + (kind === 'pict' ? 'key' : 'scale') + '.' : ''); } });
    }
    if(f === 'least2'){
      var l1 = order[4], l2 = order[3], ans2 = o.vs[l1] + o.vs[l2];
      return numeric({ prompt: t + ' How many ' + o.th.things + ' do the TWO smallest amounts make altogether?', visual: o.vis, answer: ans2,
        hint: 'Step 1: find the two smallest rows. Step 2: add them.',
        explain: ex('Two steps', ['Step 1: the two smallest are ' + o.labs[l1] + ' (<b>' + o.vs[l1] + '</b>) and ' + o.labs[l2] + ' (<b>' + o.vs[l2] + '</b>).', 'Step 2: add: ' + o.vs[l1] + ' + ' + o.vs[l2] + '.', 'Altogether: <b>' + ans2 + '</b>. ✅']),
        truth: (function(){ var d = ds(o), v = Object.keys(d).map(function(l){ return d[l]; }).sort(function(p, q){ return p - q; }); return v[0] + v[1]; })(),
        decode: function(){ var d = ds(o), v = Object.keys(d).map(function(l){ return d[l]; }).sort(function(p, q){ return p - q; }); return v[0] + v[1]; },
        wrong: function(v){ return v === o.vs[l1] + o.vs[order[0]] ? 'That uses the smallest and the biggest. Use the two smallest.' : ''; } });
    }
    if(f === 'twopairs'){
      var p = sample([0, 1, 2, 3, 4], 4), s1 = o.vs[p[0]] + o.vs[p[1]], s2 = o.vs[p[2]] + o.vs[p[3]];
      if(s1 === s2) return g3();
      var ans3 = Math.abs(s1 - s2), bigPair = s1 > s2 ? [p[0], p[1], p[2], p[3]] : [p[2], p[3], p[0], p[1]];
      return numeric({ prompt: t + ' How many more do ' + o.labs[bigPair[0]] + ' and ' + o.labs[bigPair[1]] + ' have together than ' + o.labs[bigPair[2]] + ' and ' + o.labs[bigPair[3]] + ' together?', visual: o.vis, answer: ans3,
        hint: 'Work out each pair’s total first. Then find the difference between the two totals.',
        explain: ex('Three small steps', ['Pair 1: ' + o.vs[bigPair[0]] + ' + ' + o.vs[bigPair[1]] + ' = <b>' + Math.max(s1, s2) + '</b>.', 'Pair 2: ' + o.vs[bigPair[2]] + ' + ' + o.vs[bigPair[3]] + ' = <b>' + Math.min(s1, s2) + '</b>.', 'Subtract: ' + Math.max(s1, s2) + ' − ' + Math.min(s1, s2) + ' = <b>' + ans3 + '</b>. ✅']),
        truth: (function(){ var d = ds(o); return d[o.labs[bigPair[0]]] + d[o.labs[bigPair[1]]] - d[o.labs[bigPair[2]]] - d[o.labs[bigPair[3]]]; })(),
        decode: function(){ var d = ds(o); return d[o.labs[bigPair[0]]] + d[o.labs[bigPair[1]]] - d[o.labs[bigPair[2]]] - d[o.labs[bigPair[3]]]; },
        wrong: function(v){ return v === Math.max(s1, s2) ? 'That is the bigger pair’s total. Now subtract the other pair.' : ''; } });
    }
    var tot = o.vs.reduce(function(a, b){ return a + b; }, 0), share = pick([5, 10, 15]);
    var ansG = tot - share;
    return numeric({ prompt: t + ' All the ' + o.th.things + ' are put together, then ' + share + ' are given away. How many are left?', visual: o.vis, answer: ansG,
      hint: 'Step 1: add all five rows. Step 2: take away ' + share + '.',
      explain: ex('Two steps', ['Step 1: ' + o.vs.join(' + ') + ' = <b>' + tot + '</b>.', 'Step 2: ' + tot + ' − ' + share + '.', 'Left: <b>' + ansG + '</b>. ✅']),
      truth: (function(){ var d = ds(o), s = 0; Object.keys(d).forEach(function(l){ s += d[l]; }); return s - share; })(), decode: function(){ var d = ds(o), s = 0; Object.keys(d).forEach(function(l){ s += d[l]; }); return s - share; },
      wrong: function(v){ return v === tot ? 'That is the total before giving ' + share + ' away.' : ''; } });
  }

  var LP = [{ label: 'Ana', count: 3, emoji: '⭐' }, { label: 'Tom', count: 5, emoji: '⭐' }, { label: 'Kai', count: 2, emoji: '⭐' }];
  var LB = [{ label: 'Ana', value: 30 }, { label: 'Tom', value: 50 }, { label: 'Kai', value: 20 }];
  registerSkill({
    id: 'data-two-step', strand: 'data', name: 'Two-step chart questions', emoji: '🧩', year: 3, order: 840, prereq: ['data-bar-charts'],
    lesson: {
      title: 'Two steps from a chart',
      steps: [
        { say: 'Some questions need <b>two steps</b>. Step 1: <b>read the chart</b>. Step 2: <b>do the sum</b>. Here the key says one star = 10.', vis: { kind: 'pictogram', args: [LP, 10] } },
        { say: 'Ana has 3 stars = <b>30</b>. Tom has 5 stars = <b>50</b>. Kai has 2 stars = <b>20</b>. Reading each row is step 1.', vis: { kind: 'pictogram', args: [LP, 10] },
          quiz: { prompt: 'Key: one star = 10. How many does Tom have (5 stars)?', options: [{ label: '50', ok: true }, { label: '5', ok: false }, { label: '15', ok: false }], right: 'Yes! 5 stars × 10 = 50.', wrong: 'Each star is worth 10, so 5 stars is 50.' } },
        { say: '“How many <b>altogether</b> did Ana and Kai get?” Step 1: Ana 30, Kai 20. Step 2: <b>add</b>: 30 + 20 = <b>50</b>.', vis: { kind: 'pictogram', args: [LP, 10] },
          quiz: { prompt: 'Ana has 30 and Tom has 50. How many altogether?', options: [{ label: '80', ok: true }, { label: '20', ok: false }, { label: '8', ok: false }], right: 'Yes! 30 + 50 = 80.', wrong: '“Altogether” means add: 30 + 50 = 80.' } },
        { say: '“How many <b>more</b>?” Step 1: read both. Step 2: <b>subtract</b>. A bar chart works the same way. Tom 50, Ana 30: 50 − 30 = <b>20</b>.', vis: { kind: 'barChart', args: [LB, { scale: 10, axisMax: 50, yTitle: 'Stars' }] },
          quiz: { prompt: 'Tom has 50 and Kai has 20. How many more has Tom?', options: [{ label: '30', ok: true }, { label: '70', ok: false }, { label: '2', ok: false }], right: 'Yes! 50 − 20 = 30.', wrong: '“How many more” means subtract: 50 − 20 = 30.' } },
        { say: 'Some questions add a new twist: “If Kai gets <b>35</b> more, who has the most?” Step 1: Kai is 20 + 35 = <b>55</b>. Step 2: compare: 55 beats 50. <b>Kai</b> wins!', vis: { kind: 'barChart', args: [LB, { scale: 10, axisMax: 50, yTitle: 'Stars' }] },
          quiz: { prompt: 'Ana (30) gets 25 more. Tom has 50. Who has the most now?', options: [{ label: 'Ana', ok: true }, { label: 'Tom', ok: false }, { label: 'They are equal', ok: false }], right: 'Yes! 30 + 25 = 55, which beats 50.', wrong: '30 + 25 = 55. That is more than Tom’s 50.' } }
      ]
    },
    trick: {
      title: 'Read, then ask “what is it asking?”',
      say: 'Do the <b>reading step</b> first and write the numbers down. Then look for the <b>clue word</b>: <b>altogether</b> = add, <b>how many more</b> = subtract, <b>left</b> = take away.',
      vis: null,
      example: 'Ana 30, Tom 50 → “how many <b>more</b>?” → 50 − 30 = <b>20</b>'
    },
    gen: { 1: g1, 2: g2, 3: g3 }
  });
})();
