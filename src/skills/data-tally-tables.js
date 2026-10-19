/* data-tally-tables: tally marks and frequency tables (Year 3 statistics) */
(function(){
  var INKC = 'var(--vis-ink,#1B1B2F)';
  var THEMES = [
    { intro: 'Children voted for their favourite pet.', things: 'children', labels: ['Dog','Cat','Fish','Rabbit','Hamster','Bird'], ask: function(l){ return 'How many children chose ' + l + '?'; } },
    { intro: 'Children voted for their favourite fruit.', things: 'children', labels: ['Apple','Banana','Grape','Pear','Plum','Mango'], ask: function(l){ return 'How many children chose ' + l + '?'; } },
    { intro: 'Ana tallied the weather each day for a month.', things: 'days', labels: ['Sunny','Rainy','Cloudy','Windy','Foggy'], ask: function(l){ return 'How many days were ' + l + '?'; } },
    { intro: 'Tom tallied the cars that drove past school.', things: 'cars', labels: ['Red','Blue','White','Black','Green','Silver'], ask: function(l){ return 'How many ' + l + ' cars were there?'; } },
    { intro: 'Mei spotted animals on a trip to the zoo.', things: 'animals', labels: ['Lion','Zebra','Monkey','Parrot','Camel','Panda'], ask: function(l){ return 'How many ' + l + 's did Mei spot?'; } },
    { intro: 'Leo tallied ice creams sold at the school fair.', things: 'ice creams', labels: ['Vanilla','Mint','Berry','Toffee','Choc'], ask: function(l){ return 'How many ' + l + ' ice creams were sold?'; } }
  ];
  function distinct(k, lo, hi){ var a = []; for(var v = lo; v <= hi; v++) a.push(v); return sample(a, k); }
  function theme(){ return pick(THEMES); }

  /* frequency table. rows [{label,n,mode:'tally'|'both'|'num'|'hide'}] */
  function table(rows){
    var hasT = rows.some(function(r){ return r.mode === 'tally' || r.mode === 'both'; });
    var hasN = rows.some(function(r){ return r.mode !== 'tally'; });
    var td = 'style="padding:4px 10px;border:2px solid ' + INKC + ';text-align:center"';
    var s = '<table class="ftable" style="border-collapse:collapse;margin:0 auto;color:' + INKC + ';background:#fff;font-weight:800"><tr><th ' + td + '>Choice</th>' + (hasT ? '<th ' + td + '>Tally</th>' : '') + (hasN ? '<th ' + td + '>Number</th>' : '') + '</tr>';
    rows.forEach(function(r){
      s += '<tr class="trow" data-label="' + r.label + '"><td ' + td + '>' + r.label + '</td>';
      if(hasT) s += '<td ' + td + '>' + ((r.mode === 'tally' || r.mode === 'both') ? V.tally(r.n) : '') + '</td>';
      if(hasN) s += '<td class="fc" ' + td + '>' + (r.mode === 'hide' ? '?' : (r.mode === 'tally' ? '' : r.n)) + '</td>';
      s += '</tr>';
    });
    return s + '</table>';
  }
  /* read every row back out of the DRAWING (tally marks counted, typed numbers read). hidden rows are omitted. */
  function decodeTable(html){
    var out = {};
    html.split('<tr class="trow"').slice(1).forEach(function(ch){
      var label = /data-label="([^"]*)"/.exec(ch)[1];
      var t = ch.indexOf('<svg') >= 0 ? V.decodeTally(ch) : null;
      var m = /class="fc"[^>]*>(\d+)</.exec(ch);
      var num = m ? parseInt(m[1], 10) : null;
      if(t !== null && num !== null && t !== num) out[label] = -999;
      else if(t !== null) out[label] = t;
      else if(num !== null) out[label] = num;
    });
    return out;
  }
  function sumOf(o, skip){ var s = 0; Object.keys(o).forEach(function(k){ if(k !== skip) s += o[k]; }); return s; }
  function bundles(n){ return Math.floor(n / 5); }
  function tallyWrongs(n){
    var g = bundles(n), rem = n % 5, w = [];
    if(g > 0){
      w.push({ v: n - g, why: 'You counted each crossed bundle as 4. The diagonal line counts too: a bundle is <b>5</b>.' });
      w.push({ v: g + rem, why: 'You counted each whole bundle as 1. A crossed bundle is worth <b>5</b>.' });
      w.push({ v: n + g, why: 'You counted the diagonal as an extra line. Four lines plus the diagonal make just <b>5</b> together.' });
    } else {
      w.push({ v: n + 1, why: 'Count each line once, one by one.' });
      w.push({ v: n - 1, why: 'You missed a line. Touch each line as you count.' });
    }
    return w;
  }
  function tallyExplain(n){
    var g = bundles(n), rem = n % 5, c = [];
    for(var i = 1; i <= g; i++) c.push(i * 5);
    for(var j = 1; j <= rem; j++) c.push(g * 5 + j);
    return ex('Counting the tally', [
      g > 0 ? ('Each crossed bundle is <b>5</b>. Count in fives: <b>' + c.slice(0, g).join(', ') + '</b>.') : 'There is no crossed bundle, so count the lines one by one.',
      rem > 0 ? ('Then count the single lines: <b>' + c.slice(g).join(', ') + '</b>.') : 'There are no single lines left over.',
      'The tally shows <b>' + n + '</b>. ✅'
    ]);
  }
  function numOptsPicture(n, count){
    var c = [n - bundles(n), bundles(n) + n % 5, n + 1, n - 1, n + 5, n - 5, n + 2, n - 2, n + 3];
    var ds = [];
    c.forEach(function(v, i){ if(v >= 1 && v !== n) ds.push(opt(K.num(v), V.tally(v), i < 2 && bundles(n) > 0 ? 'That tally shows ' + v + ', not ' + n + '. Count in fives!' : 'That tally shows ' + v + ', not ' + n + '.')); });
    var q = mcq({
      prompt: 'Which tally shows ' + n + '?', visual: '', correct: opt(K.num(n), V.tally(n)), distractors: ds, keepOrder: true, count: count || 3,
      hint: 'Work out how many crossed bundles of 5 you need, then add single lines.',
      explain: ex('Making ' + n, ['Bundles of 5 in ' + n + ': <b>' + bundles(n) + '</b>.', n % 5 ? 'Single lines left: <b>' + (n % 5) + '</b>.' : 'No single lines are left.', 'The picture with <b>' + n + '</b> is the right one. ✅']),
      truth: K.num(bundles(n) * 5 + n % 5)
    });
    q.optionsAreVisual = true;
    q.decodeKey = function(){ for(var i = 0; i < q.options.length; i++){ if(K.num(V.decodeTally(q.options[i].label)) !== q.options[i].key) return 'option ' + i + ' mismatch'; } return q.options[q.correct].key; };
    return q;
  }

  /* ---------------- generators ---------------- */
  function g1(){
    var f = pick(['read', 'read', 'which', 'gap']);
    if(f === 'read'){
      var n = randInt(2, 12), vis = V.tally(n);
      return mcqNum({
        prompt: 'How many tally marks are there?', visual: vis, answer: n, wrong: tallyWrongs(n), count: 3,
        hint: 'A crossed bundle is 5. Count in fives, then count the single lines.',
        explain: tallyExplain(n), truth: bundles(n) * 5 + n % 5, decode: function(){ return V.decodeTally(vis); }
      });
    }
    if(f === 'which') return numOptsPicture(randInt(3, 12), 3);
    var th = theme(), labs = sample(th.labels, 3), cs = distinct(3, 2, 12), hide = randInt(0, 2);
    var rows = labs.map(function(l, i){ return { label: l, n: cs[i], mode: i === hide ? 'hide' : 'both' }; });
    var vis2 = table(rows.map(function(r, i){ return i === hide ? { label: r.label, n: r.n, mode: 'hide' } : r; }));
    // hidden row shows its tally, number missing: draw tally too
    vis2 = vis2.replace('<td class="fc"', '<td class="fc"');
    var rows2 = rows.map(function(r, i){ return { label: r.label, n: r.n, mode: i === hide ? 'tally' : 'both' }; });
    var vis3 = table(rows2).replace(/(data-label="[^"]*">)/g, '$1');
    // show '?' in the number column of the row to complete
    var parts = vis3.split('<tr class="trow"'), j = hide + 1;
    parts[j] = parts[j].replace('<td class="fc"', '<td class="fc"').replace(/(class="fc"[^>]*>)(<\/td>)/, '$1?$2');
    var vis4 = parts.join('<tr class="trow"');
    var ans = cs[hide];
    return mcqNum({
      prompt: th.intro + ' Fill the gap: what number goes where the ? is?', visual: vis4, answer: ans, wrong: tallyWrongs(ans), count: 3,
      hint: 'Count the tally marks in that row, in fives. The number must match the tally.',
      explain: tallyExplain(ans), truth: cs[hide],
      decode: function(){ var d = decodeTable(vis4); return d[labs[hide]]; }
    });
  }

  function g2(){
    var th = theme(), k = 4, labs = sample(th.labels, k), cs = distinct(k, 3, 17);
    var rows = labs.map(function(l, i){ return { label: l, n: cs[i], mode: 'tally' }; });
    var vis = table(rows);
    function dec(){ return decodeTable(vis); }
    var f = pick(['one', 'total', 'most', 'least', 'more']);
    var i = randInt(0, k - 1), jx = (i + randInt(1, k - 1)) % k;
    if(f === 'one'){
      var n = cs[i];
      return mcqNum({ prompt: th.intro + ' ' + th.ask(labs[i]), visual: vis, answer: n, wrong: tallyWrongs(n),
        hint: 'Find the ' + labs[i] + ' row and count its tally marks in fives.', explain: tallyExplain(n), truth: cs[i], decode: function(){ return dec()[labs[i]]; } });
    }
    if(f === 'total'){
      var tot = cs.reduce(function(a, b){ return a + b; }, 0), bun = cs.reduce(function(a, b){ return a + bundles(b) + b % 5; }, 0);
      return mcqNum({ prompt: th.intro + ' How many ' + th.things + ' altogether?', visual: vis, answer: tot,
        wrong: [{ v: bun, why: 'You counted each bundle as 1. A crossed bundle is worth 5.' }, { v: tot - cs[k - 1], why: 'You left out the last row. Add all ' + k + ' rows.' }, { v: tot - cs.reduce(function(a, b){ return a + bundles(b); }, 0), why: 'You counted each bundle as 4 and missed the diagonals.' }],
        hint: 'Count each row first. Write the numbers down, then add them all.',
        explain: ex('Adding the rows', ['Count each row: <b>' + cs.join(', ') + '</b>.', 'Add them: ' + cs.join(' + ') + '.', 'Altogether: <b>' + tot + '</b>. ✅']),
        truth: sumOf(dec()), decode: function(){ return sumOf(dec()); }, nearby: [1, -1, 2, -2, 5, -5, 10, -10] });
    }
    if(f === 'most' || f === 'least'){
      var most = f === 'most', best = 0;
      cs.forEach(function(v, x){ if(most ? v > cs[best] : v < cs[best]) best = x; });
      var ds = labs.map(function(l, x){ return opt(K.text(l), l, 'The ' + l + ' row has ' + cs[x] + ' — ' + (most ? 'there is a longer tally than that.' : 'there is a shorter tally than that.')); });
      return mcq({ prompt: th.intro + ' Which has the ' + (most ? 'most' : 'fewest') + '?', visual: vis, correct: opt(K.text(labs[best]), labs[best]), distractors: ds, keepOrder: true,
        hint: 'Count every row first. Do not just pick the row that looks longest!',
        explain: ex('Comparing the rows', ['The counts are: ' + labs.map(function(l, x){ return l + ' <b>' + cs[x] + '</b>'; }).join(', ') + '.', (most ? 'The biggest' : 'The smallest') + ' number is <b>' + cs[best] + '</b>.', 'So <b>' + labs[best] + '</b> has the ' + (most ? 'most' : 'fewest') + '. ✅']),
        truth: (function(){ var d = dec(), bl = null; Object.keys(d).forEach(function(l){ if(bl === null || (most ? d[l] > d[bl] : d[l] < d[bl])) bl = l; }); return K.text(bl); })(),
        decode: function(){ var d = dec(), bl = null; Object.keys(d).forEach(function(l){ if(bl === null || (most ? d[l] > d[bl] : d[l] < d[bl])) bl = l; }); return K.text(bl); } });
    }
    var hi = cs[i] > cs[jx] ? i : jx, lo = hi === i ? jx : i, diff = cs[hi] - cs[lo];
    return mcqNum({ prompt: th.intro + ' How many more ' + th.things + ' for ' + labs[hi] + ' than ' + labs[lo] + '?', visual: vis, answer: diff,
      wrong: [{ v: cs[hi] + cs[lo], why: '“How many more” means take away, not add.' }, { v: cs[hi], why: 'That is just the ' + labs[hi] + ' count. Subtract the ' + labs[lo] + ' count.' }, { v: Math.abs(bundles(cs[hi]) + cs[hi] % 5 - bundles(cs[lo]) - cs[lo] % 5), why: 'You counted bundles as 1. Count in fives first.' }],
      hint: 'Count both rows, then find the difference: big number take away small number.',
      explain: ex('How many more?', [labs[hi] + ' has <b>' + cs[hi] + '</b>; ' + labs[lo] + ' has <b>' + cs[lo] + '</b>.', 'Subtract: ' + cs[hi] + ' − ' + cs[lo] + '.', 'The difference is <b>' + diff + '</b>. ✅']),
      truth: Math.abs(dec()[labs[i]] - dec()[labs[jx]]), decode: function(){ var d = dec(); return Math.abs(d[labs[i]] - d[labs[jx]]); } });
  }

  function g3(){
    var th = theme(), k = 4, labs = sample(th.labels, k), cs = distinct(k, 6, 29);
    var f = pick(['total', 'missing', 'bundles', 'check', 'two']);
    if(f === 'total'){
      var vis = table(labs.map(function(l, i){ return { label: l, n: cs[i], mode: 'tally' }; }));
      var tot = cs.reduce(function(a, b){ return a + b; }, 0);
      return numeric({ prompt: th.intro + ' How many ' + th.things + ' altogether? Type the number.', visual: vis, answer: tot,
        hint: 'Count each row in fives and write the number. Then add the ' + k + ' numbers.',
        explain: ex('Totalling the table', ['Count each row: <b>' + cs.join(', ') + '</b>.', 'Add: ' + cs.join(' + ') + '.', 'Altogether: <b>' + tot + '</b>. ✅']),
        truth: tot, decode: function(){ return sumOf(decodeTable(vis)); },
        wrong: function(v){ var b = cs.reduce(function(a, c){ return a + bundles(c) + c % 5; }, 0); return v === b ? 'You counted each bundle as 1. A bundle is 5.' : (v === tot - cs[k - 1] ? 'You left a row out.' : ''); } });
    }
    if(f === 'missing'){
      var hide = randInt(0, k - 1), tot2 = cs.reduce(function(a, b){ return a + b; }, 0);
      var rows = labs.map(function(l, i){ return { label: l, n: cs[i], mode: i === hide ? 'hide' : 'both' }; });
      var vis2 = table(rows.map(function(r){ return r.mode === 'hide' ? { label: r.label, n: r.n, mode: 'hide' } : r; }));
      return numeric({ prompt: th.intro + ' There were ' + tot2 + ' ' + th.things + ' altogether. How many go in the ? row?', visual: vis2, answer: cs[hide],
        hint: 'Add up the rows you can see, then take that away from ' + tot2 + '.',
        explain: ex('Finding the missing row', ['Add the rows you can see: <b>' + (tot2 - cs[hide]) + '</b>.', 'Take that from the total: ' + tot2 + ' − ' + (tot2 - cs[hide]) + '.', 'The ? row is <b>' + cs[hide] + '</b>. ✅']),
        truth: cs[hide], decode: function(){ return tot2 - sumOf(decodeTable(vis2)); },
        wrong: function(v){ return v === tot2 ? 'That is the total. The missing row is only part of it.' : ''; } });
    }
    if(f === 'bundles'){
      var n = randInt(10, 29), vis3 = V.tally(n);
      return numeric({ prompt: 'How many crossed bundles of 5 can you see?', visual: vis3, answer: bundles(n),
        hint: 'Each crossed bundle has a diagonal line through it. Count the diagonals.',
        explain: ex('Counting bundles', ['Each bundle is <b>5</b>, with a diagonal line.', 'The tally shows ' + n + ' marks, so ' + n + ' ÷ 5 gives ' + bundles(n) + ' full bundles' + (n % 5 ? ' and ' + (n % 5) + ' singles' : '') + '.', 'Bundles: <b>' + bundles(n) + '</b>. ✅']),
        truth: bundles(n), decode: function(){ return (vis3.match(/class="talx"/g) || []).length; },
        wrong: function(v){ return v === n ? 'That is the number of marks. The question asks for bundles of 5.' : ''; } });
    }
    if(f === 'check'){
      var i = randInt(0, k - 1), real = cs[i], wrongN = pick([real - bundles(real), bundles(real) + real % 5]);
      var good = chance(0.5), shown = good ? real : wrongN;
      var vis4 = table(labs.map(function(l, x){ return { label: l, n: x === i ? real : cs[x], mode: x === i ? 'tally' : 'tally' }; }));
      var rd = function(){ return decodeTable(vis4)[labs[i]]; };
      return mcq2({ prompt: 'Sam says there are ' + shown + ' in the ' + labs[i] + ' row. Is Sam right?', visual: vis4,
        correct: opt(K.bool(good), good ? 'Yes' : 'No'), other: opt(K.bool(!good), good ? 'No' : 'Yes', good ? 'Count again in fives: it really is ' + real + '.' : 'Sam made a tally mistake: the row shows ' + real + ', not ' + shown + '.'),
        hint: 'Count that row yourself in fives, then compare with Sam\'s number.',
        explain: ex('Checking Sam', ['Count the ' + labs[i] + ' row in fives.', 'It makes <b>' + real + '</b>.', 'Sam said ' + shown + ', so the answer is <b>' + (good ? 'Yes' : 'No') + '</b>. ✅']),
        truth: K.bool(real === shown), decode: function(){ return K.bool(rd() === shown); } });
    }
    var a = randInt(0, 1), b = a + 1, c = 2, d2 = 3;
    var vis5 = table(labs.map(function(l, x){ return { label: l, n: cs[x], mode: 'tally' }; }));
    var sumAB = cs[a] + cs[b], diff = Math.abs(sumAB - cs[c]);
    return numeric({ prompt: th.intro + ' How many more ' + th.things + ' chose ' + labs[a] + ' and ' + labs[b] + ' together than ' + labs[c] + '? (If ' + labs[c] + ' has more, give the difference.)', visual: vis5, answer: diff,
      hint: 'Step 1: add the ' + labs[a] + ' and ' + labs[b] + ' rows. Step 2: find the difference with ' + labs[c] + '.',
      explain: ex('Two steps', [labs[a] + ' + ' + labs[b] + ' = ' + cs[a] + ' + ' + cs[b] + ' = <b>' + sumAB + '</b>.', labs[c] + ' has <b>' + cs[c] + '</b>.', 'The difference is <b>' + diff + '</b>. ✅']),
      truth: Math.abs(cs[a] + cs[b] - cs[c]), decode: function(){ var dd = decodeTable(vis5); return Math.abs(dd[labs[a]] + dd[labs[b]] - dd[labs[c]]); } });
  }

  registerSkill({
    id: 'data-tally-tables', strand: 'data', name: 'Tally charts & tables', emoji: '📝', year: 3, order: 810, prereq: ['multdiv-2-5-10'],
    lesson: {
      title: 'Counting with tallies',
      steps: [
        { say: 'A <b>tally</b> is a quick way to count. We draw <b>one line</b> for each thing we count. This tally shows <b>3</b>.', vis: { kind: 'tally', args: [3] } },
        { say: 'After <b>4 lines</b>, the 5th goes <b>across</b> them like a gate. A crossed bundle is worth <b>5</b>. Here are 5 and 10.', vis: { kind: 'tally', args: [10] } },
        { say: 'To count a tally, <b>count in fives</b> for the bundles, then add the single lines. Here: 5, 10, 11, 12, 13.', vis: { kind: 'tally', args: [13] },
          quiz: { prompt: 'This tally has 1 bundle and 3 single lines. How many is that?', options: [{ label: '8', ok: true }, { label: '4', ok: false }, { label: '9', ok: false }], right: 'Yes! 5 and 3 more makes 8.', wrong: 'The bundle is worth 5, not 1 or 4. 5 + 3 = 8.' } },
        { say: 'A <b>frequency table</b> shows the tally and the number for each choice. The number must match the tally.', vis: { kind: 'html', args: [table([{ label: 'Dog', n: 7, mode: 'both' }, { label: 'Cat', n: 12, mode: 'both' }, { label: 'Fish', n: 4, mode: 'both' }])] } },
        { say: '<b>Altogether</b> means add every row. 7 + 12 + 4 = <b>23</b> children voted.', vis: { kind: 'html', args: [table([{ label: 'Dog', n: 7, mode: 'num' }, { label: 'Cat', n: 12, mode: 'num' }, { label: 'Fish', n: 4, mode: 'num' }])] },
          quiz: { prompt: 'Rows are 6, 9 and 5. How many altogether?', options: [{ label: '20', ok: true }, { label: '14', ok: false }, { label: '15', ok: false }], right: 'Yes! 6 + 9 + 5 = 20.', wrong: 'Add all three rows: 6 + 9 = 15, then 15 + 5 = 20.' } }
      ]
    },
    trick: {
      title: 'Fives first, then singles',
      say: 'Never count tally lines one by one! Say the <b>fives</b> first (5, 10, 15) and then add the <b>single lines</b> on the end. It is quick and you will not lose count.',
      vis: { kind: 'tally', args: [17] },
      example: '3 bundles = <b>15</b>, then 16, 17 → <b>17</b>'
    },
    gen: { 1: g1, 2: g2, 3: g3 }
  });
})();
