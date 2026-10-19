/* data-pictograms: reading pictograms with keys of 1, 2, 5, 10 and half symbols */
(function(){
  var THEMES = [
    { intro: 'The children collected stickers.', emoji: '⭐', things: 'stickers', who: ['Ana','Marcus','Sophie','Ivan','Lucy','Diego','Ellen','Tom'] },
    { intro: 'The children read books in May.', emoji: '📚', things: 'books', who: ['Aisha','Kai','Mei','Leo','Ana','Tom','Lucy','Ivan'] },
    { intro: 'Players scored goals this season.', emoji: '⚽', things: 'goals', who: ['Diego','Ellen','Marcus','Sophie','Kai','Leo','Mei','Aisha'] },
    { intro: 'The friends picked apples at the farm.', emoji: '🍎', things: 'apples', who: ['Tom','Ana','Lucy','Ivan','Kai','Mei','Ellen','Diego'] },
    { intro: 'The bakers sold cupcakes at a fair.', emoji: '🧁', things: 'cupcakes', who: ['Sophie','Leo','Aisha','Marcus','Tom','Ana','Ivan','Mei'] },
    { intro: 'The class gathered shells on the beach.', emoji: '🐚', things: 'shells', who: ['Lucy','Diego','Kai','Ellen','Aisha','Ivan','Sophie','Leo'] }
  ];
  var DAYS = ['Mon','Tue','Wed','Thu','Fri'];
  function halfOk(key){ return key % 2 === 0; }
  function countPool(key, lo, hi){
    var a = [];
    for(var c = lo; c <= hi; c++){ a.push(c); if(halfOk(key) && key > 1 && c < hi) a.push(c + 0.5); }
    return a;
  }
  function build(k, key, lo, hi){
    var th = pick(THEMES), labs = sample(th.who, k), cs = sample(countPool(key, lo, hi), k);
    var rows = labs.map(function(l, i){ return { label: l, count: cs[i], emoji: th.emoji }; });
    return { th: th, labs: labs, cs: cs, key: key, rows: rows, vis: V.pictogram(rows, key) };
  }
  function val(o, i){ return o.cs[i] * o.key; }
  function dec(o){ return V.decodePictogram(o.vis); }
  function keyLine(key){ return 'Key: one symbol = ' + key; }
  function readWrongs(c, key){
    var w = [], whole = Math.floor(c), hasHalf = c !== whole;
    if(key > 1) w.push({ v: c, why: 'You counted the symbols but forgot the key! Each symbol is worth ' + key + ', so multiply.' });
    if(hasHalf){
      w.push({ v: whole * key, why: 'You forgot the half symbol. It is worth half of ' + key + ', which is ' + (key / 2) + '.' });
      w.push({ v: Math.ceil(c) * key, why: 'The half symbol is only HALF of ' + key + ', not a whole ' + key + '.' });
    }
    w.push({ v: (whole + (hasHalf ? 1 : 0) + 1) * key, why: 'Count the symbols again carefully, then multiply by ' + key + '.' });
    w.push({ v: (c * key) + key, why: 'That is one symbol too many.' });
    w.push({ v: (c * key) - key, why: 'That is one symbol too few.' });
    return w;
  }
  function readExplain(o, i){
    var c = o.cs[i], key = o.key, whole = Math.floor(c), hasHalf = c !== whole, v = c * key, st = [];
    st.push('Look at the key first: one symbol = <b>' + key + '</b>.');
    st.push(o.labs[i] + ' has <b>' + whole + '</b> whole symbol' + (whole === 1 ? '' : 's') + (hasHalf ? ' and a <b>half</b> symbol (worth ' + (key / 2) + ')' : '') + '.');
    st.push(key === 1 ? 'Each is worth 1, so the answer is <b>' + v + '</b>. ✅' : whole + ' × ' + key + (hasHalf ? ' + ' + (key / 2) : '') + ' = <b>' + v + '</b>. ✅');
    return ex('Reading the pictogram', st);
  }
  function who(o, i){ return o.labs[i]; }
  function pickRows(k){ var i = randInt(0, k - 1), j = (i + randInt(1, k - 1)) % k; return [i, j]; }

  function g1(){
    var key = pick([1, 2, 2]), k = 3, o = build(k, key, 1, key === 1 ? 7 : 5), f = pick(['read', 'read', 'most', 'key']);
    o.cs = o.cs.map(Math.floor); o.rows = o.labs.map(function(l, i){ return { label: l, count: o.cs[i], emoji: o.th.emoji }; });
    // ensure distinct whole counts for 'most'
    if(new Set(o.cs).size < k) { o.cs = [1, 3, 4].map(function(x){ return x; }); o.rows = o.labs.map(function(l, i){ return { label: l, count: o.cs[i], emoji: o.th.emoji }; }); }
    o.vis = V.pictogram(o.rows, key);
    var i = randInt(0, k - 1);
    if(f === 'read'){
      var v = val(o, i);
      return mcqNum({ prompt: o.th.intro + ' How many ' + o.th.things + ' did ' + who(o, i) + ' get?', visual: o.vis, answer: v, wrong: readWrongs(o.cs[i], key), count: 3,
        hint: key === 1 ? 'Count the symbols in that row. Each one is worth 1.' : 'Read the key. Each symbol is worth ' + key + ', so count in ' + key + 's.',
        explain: readExplain(o, i), truth: o.cs[i] * key, decode: function(){ return dec(o)[who(o, i)]; } });
    }
    if(f === 'key'){
      return mcqNum({ prompt: 'Look at the key. How many ' + o.th.things + ' does ONE symbol stand for?', visual: o.vis, answer: key, count: 3,
        wrong: [{ v: 1, why: 'Look at the key at the bottom: it tells you what one symbol is worth.' }, { v: 2, why: 'Read the key again.' }, { v: 5, why: 'Read the key again.' }],
        hint: 'The key is at the bottom of the picture. It says symbol = a number.',
        explain: ex('Reading the key', ['The key says: one symbol = <b>' + key + '</b>.', 'So each symbol stands for ' + key + ' ' + o.th.things + '.', 'Answer: <b>' + key + '</b>. ✅']),
        truth: key, decode: function(){ return parseFloat(/=\s*([\d.]+)\s*</.exec(o.vis)[1]); } });
    }
    var best = 0; o.cs.forEach(function(c, x){ if(c > o.cs[best]) best = x; });
    var ds = o.labs.map(function(l, x){ return opt(K.text(l), l, l + ' has fewer symbols than ' + o.labs[best] + '.'); });
    return mcq({ prompt: o.th.intro + ' Who got the most ' + o.th.things + '?', visual: o.vis, correct: opt(K.text(o.labs[best]), o.labs[best]), distractors: ds, keepOrder: true, count: 3,
      hint: 'The longest row has the most. Count the symbols in each row.',
      explain: ex('Finding the most', ['Count the symbols: ' + o.labs.map(function(l, x){ return l + ' <b>' + o.cs[x] + '</b>'; }).join(', ') + '.', 'The biggest is ' + o.cs[best] + '.', '<b>' + o.labs[best] + '</b> got the most. ✅']),
      truth: (function(){ var d = dec(o), b = null; Object.keys(d).forEach(function(l){ if(b === null || d[l] > d[b]) b = l; }); return K.text(b); })(),
      decode: function(){ var d = dec(o), b = null; Object.keys(d).forEach(function(l){ if(b === null || d[l] > d[b]) b = l; }); return K.text(b); } });
  }

  function g2(){
    var key = pick([2, 5, 10, 10]), k = 4, o = build(k, key, 2, key === 10 ? 6 : 8), f = pick(['read', 'read', 'most', 'least', 'more', 'half']);
    var i = randInt(0, k - 1);
    if(f === 'half'){
      var b = build(k, pick([2, 10]), 2, 5); b.cs = b.cs.map(function(c){ return Math.floor(c) + 0.5; });
      b.rows = b.labs.map(function(l, x){ return { label: l, count: b.cs[x], emoji: b.th.emoji }; }); b.vis = V.pictogram(b.rows, b.key);
      return mcqNum({ prompt: 'The key says one symbol = ' + b.key + '. How many does a HALF symbol stand for?', visual: b.vis, answer: b.key / 2, count: 4,
        wrong: [{ v: b.key, why: 'A half symbol is worth half of ' + b.key + ', not a whole ' + b.key + '.' }, { v: b.key * 2, why: 'That is double. Half means share into 2 equal parts.' }, { v: 1, why: 'Half of ' + b.key + ' is ' + (b.key / 2) + '.' }, { v: b.key / 2 + 1, why: 'Halve ' + b.key + ' carefully.' }],
        hint: 'Half means split into 2 equal parts. Halve the number in the key.',
        explain: ex('Half a symbol', ['One whole symbol = <b>' + b.key + '</b>.', 'Half of ' + b.key + ' is ' + b.key + ' ÷ 2.', 'A half symbol is worth <b>' + (b.key / 2) + '</b>. ✅']),
        truth: b.key / 2, decode: function(){ return parseFloat(/=\s*([\d.]+)\s*</.exec(b.vis)[1]) / 2; }, nearby: [1, -1, 2, 3, 5] });
    }
    if(f === 'read'){
      var v = val(o, i);
      return mcqNum({ prompt: o.th.intro + ' How many ' + o.th.things + ' did ' + who(o, i) + ' get?', visual: o.vis, answer: v, wrong: readWrongs(o.cs[i], key),
        hint: 'Read the key. Count the whole symbols in ' + key + 's. Is there a half symbol to add?',
        explain: readExplain(o, i), truth: o.cs[i] * key, decode: function(){ return dec(o)[who(o, i)]; }, nearby: [key, -key, 1, -1, 2 * key] });
    }
    if(f === 'most' || f === 'least'){
      var most = f === 'most', best = 0; o.cs.forEach(function(c, x){ if(most ? c > o.cs[best] : c < o.cs[best]) best = x; });
      var ds = o.labs.map(function(l, x){ return opt(K.text(l), l, l + ' has ' + (o.cs[x] * key) + ' — ' + (most ? 'some row has more.' : 'some row has fewer.')); });
      var pick1 = function(d){ var b = null; Object.keys(d).forEach(function(l){ if(b === null || (most ? d[l] > d[b] : d[l] < d[b])) b = l; }); return K.text(b); };
      return mcq({ prompt: o.th.intro + ' Who got the ' + (most ? 'most' : 'fewest') + ' ' + o.th.things + '?', visual: o.vis, correct: opt(K.text(o.labs[best]), o.labs[best]), distractors: ds, keepOrder: true,
        hint: 'Compare the number of symbols in each row. Every symbol is worth the same.',
        explain: ex('Comparing rows', ['Each symbol is worth ' + key + '. The totals are: ' + o.labs.map(function(l, x){ return l + ' <b>' + (o.cs[x] * key) + '</b>'; }).join(', ') + '.', 'The ' + (most ? 'biggest' : 'smallest') + ' is ' + (o.cs[best] * key) + '.', '<b>' + o.labs[best] + '</b> got the ' + (most ? 'most' : 'fewest') + '. ✅']),
        truth: pick1(dec(o)), decode: function(){ return pick1(dec(o)); } });
    }
    var pr = pickRows(k), a = pr[0], c = pr[1], hi = o.cs[a] > o.cs[c] ? a : c, lo = hi === a ? c : a, diff = (o.cs[hi] - o.cs[lo]) * key;
    return mcqNum({ prompt: o.th.intro + ' How many more ' + o.th.things + ' did ' + who(o, hi) + ' get than ' + who(o, lo) + '?', visual: o.vis, answer: diff,
      wrong: [{ v: o.cs[hi] - o.cs[lo], why: 'You found the difference in SYMBOLS. Now multiply by the key (' + key + ').' }, { v: (o.cs[hi] + o.cs[lo]) * key, why: '“How many more” means subtract, not add.' }, { v: o.cs[hi] * key, why: 'That is only ' + who(o, hi) + '’s total. Take away ' + who(o, lo) + '’s total.' }],
      hint: 'Work out each person’s total using the key, then subtract.',
      explain: ex('How many more?', [who(o, hi) + ' has ' + (o.cs[hi] * key) + '; ' + who(o, lo) + ' has ' + (o.cs[lo] * key) + '.', 'Subtract: ' + (o.cs[hi] * key) + ' − ' + (o.cs[lo] * key) + '.', 'Difference: <b>' + diff + '</b>. ✅']),
      truth: Math.abs(dec(o)[who(o, a)] - dec(o)[who(o, c)]), decode: function(){ var d = dec(o); return Math.abs(d[who(o, a)] - d[who(o, c)]); }, nearby: [key, -key, 1, -1, 2 * key] });
  }

  function g3(){
    var key = pick([2, 5, 10]), k = 5, o = build(k, key, 2, key === 10 ? 7 : 9), f = pick(['read', 'total', 'more', 'inverse', 'which']);
    var i = randInt(0, k - 1);
    if(f === 'read'){
      var v = val(o, i);
      return numeric({ prompt: o.th.intro + ' How many ' + o.th.things + ' did ' + who(o, i) + ' get? Type the number.', visual: o.vis, answer: v,
        hint: 'Check the key. Count the whole symbols in ' + key + 's. Look for a half symbol at the end of the row.',
        explain: readExplain(o, i), truth: o.cs[i] * key, decode: function(){ return dec(o)[who(o, i)]; },
        wrong: function(x){ return x === o.cs[i] ? 'That is the number of symbols. Multiply by the key (' + key + ').' : (x === Math.floor(o.cs[i]) * key && o.cs[i] % 1 ? 'You missed the half symbol.' : ''); } });
    }
    if(f === 'total'){
      var tot = o.cs.reduce(function(a, b){ return a + b; }, 0) * key;
      return numeric({ prompt: o.th.intro + ' How many ' + o.th.things + ' altogether?', visual: o.vis, answer: tot,
        hint: 'Count all the symbols in every row (half symbols too!), then multiply by the key.',
        explain: ex('Totalling', ['Row totals: ' + o.labs.map(function(l, x){ return '<b>' + (o.cs[x] * key) + '</b>'; }).join(' + ') + '.', 'Add them up.', 'Altogether: <b>' + tot + '</b>. ✅']),
        truth: (function(){ var d = dec(o), s = 0; Object.keys(d).forEach(function(l){ s += d[l]; }); return s; })(), decode: function(){ var d = dec(o), s = 0; Object.keys(d).forEach(function(l){ s += d[l]; }); return s; },
        wrong: function(x){ return x === tot / key ? 'You added up the symbols only. Multiply by ' + key + '.' : ''; } });
    }
    if(f === 'more'){
      var pr = pickRows(k), a = pr[0], c = pr[1], hi = o.cs[a] > o.cs[c] ? a : c, lo = hi === a ? c : a, diff = (o.cs[hi] - o.cs[lo]) * key;
      return numeric({ prompt: o.th.intro + ' How many more ' + o.th.things + ' did ' + who(o, hi) + ' get than ' + who(o, lo) + '?', visual: o.vis, answer: diff,
        hint: 'Find both totals using the key, then subtract the smaller from the bigger.',
        explain: ex('How many more?', [who(o, hi) + ': ' + (o.cs[hi] * key) + '. ' + who(o, lo) + ': ' + (o.cs[lo] * key) + '.', 'Subtract: ' + (o.cs[hi] * key) + ' − ' + (o.cs[lo] * key) + '.', 'Difference: <b>' + diff + '</b>. ✅']),
        truth: Math.abs(dec(o)[who(o, a)] - dec(o)[who(o, c)]), decode: function(){ var d = dec(o); return Math.abs(d[who(o, a)] - d[who(o, c)]); },
        wrong: function(x){ return x === (o.cs[hi] - o.cs[lo]) ? 'That is the difference in symbols. Multiply by ' + key + '.' : ''; } });
    }
    if(f === 'inverse'){
      var n = randInt(2, 9), tv = n * key, i2 = i;
      return numeric({ prompt: 'Using this key, how many whole symbols would you draw to show ' + tv + ' ' + o.th.things + '?', visual: o.vis, answer: n,
        hint: 'Each symbol is worth ' + key + '. How many ' + key + 's make ' + tv + '?',
        explain: ex('Drawing symbols', ['One symbol = <b>' + key + '</b>.', tv + ' ÷ ' + key + ' = ?', 'You need <b>' + n + '</b> symbols. ✅']),
        truth: tv / key, decode: function(){ return tv / parseFloat(/=\s*([\d.]+)\s*</.exec(o.vis)[1]); },
        wrong: function(x){ return x === tv ? 'That is the number of ' + o.th.things + ', not the number of symbols.' : ''; } });
    }
    // which: pick who got a stated number
    var target = val(o, i), ds = o.labs.map(function(l, x){ return opt(K.text(l), l, l + ' has ' + (o.cs[x] * key) + ', not ' + target + '.'); });
    return mcq({ prompt: o.th.intro + ' Who got ' + target + ' ' + o.th.things + '?', visual: o.vis, correct: opt(K.text(o.labs[i]), o.labs[i]), distractors: ds, keepOrder: true,
      hint: 'Use the key to turn the symbols into a number for each row, then find ' + target + '.',
      explain: ex('Finding ' + target, ['Each symbol is worth ' + key + '.', 'Row totals: ' + o.labs.map(function(l, x){ return l + ' ' + (o.cs[x] * key); }).join(', ') + '.', '<b>' + o.labs[i] + '</b> got ' + target + '. ✅']),
      truth: (function(){ var d = dec(o), r = null; Object.keys(d).forEach(function(l){ if(d[l] === target) r = l; }); return K.text(r); })(),
      decode: function(){ var d = dec(o), r = null; Object.keys(d).forEach(function(l){ if(d[l] === target) r = l; }); return K.text(r); } });
  }

  var L1 = V.pictogram([{ label: 'Ana', count: 3, emoji: '⭐' }, { label: 'Tom', count: 5, emoji: '⭐' }], 1);
  registerSkill({
    id: 'data-pictograms', strand: 'data', name: 'Pictograms', emoji: '🖼️', year: 3, order: 820, prereq: ['data-tally-tables'],
    lesson: {
      title: 'Reading pictograms',
      steps: [
        { say: 'A <b>pictogram</b> uses little pictures to show numbers. Each row has a name and a line of symbols. Here Ana has <b>3</b> stars.', vis: { kind: 'pictogram', args: [[{ label: 'Ana', count: 3, emoji: '⭐' }, { label: 'Tom', count: 5, emoji: '⭐' }], 1] } },
        { say: 'The <b>key</b> tells you what ONE symbol is worth. Always read it first! Now one star = <b>2</b>, so Ana’s 3 stars are worth <b>6</b>.', vis: { kind: 'pictogram', args: [[{ label: 'Ana', count: 3, emoji: '⭐' }, { label: 'Tom', count: 5, emoji: '⭐' }], 2] } },
        { say: 'Count in <b>twos</b>: 2, 4, 6. Tom has 5 symbols: 2, 4, 6, 8, 10. So Tom has <b>10</b>.', vis: { kind: 'pictogram', args: [[{ label: 'Ana', count: 3, emoji: '⭐' }, { label: 'Tom', count: 5, emoji: '⭐' }], 2] },
          quiz: { prompt: 'The key says one symbol = 5. A row has 4 symbols. How many is that?', options: [{ label: '20', ok: true }, { label: '4', ok: false }, { label: '9', ok: false }], right: 'Yes! 4 symbols × 5 = 20.', wrong: 'Each symbol is worth 5. Count in fives: 5, 10, 15, 20.' } },
        { say: 'A <b>half symbol</b> is worth <b>half</b> of the key. If one star = 10, a half star = <b>5</b>. Lucy has 2 stars and a half: 10, 20, then 25.', vis: { kind: 'pictogram', args: [[{ label: 'Lucy', count: 2.5, emoji: '⭐' }, { label: 'Kai', count: 4, emoji: '⭐' }], 10] },
          quiz: { prompt: 'Key: one symbol = 10. A row has 3 symbols and a half symbol. How many?', options: [{ label: '35', ok: true }, { label: '30', ok: false }, { label: '40', ok: false }], right: 'Yes! 30 and 5 more is 35.', wrong: 'Three symbols make 30. The half symbol adds 5 (half of 10). 30 + 5 = 35.' } },
        { say: 'To compare, work out each total with the key. Lucy has <b>25</b>, Kai has <b>40</b>. Kai has <b>15 more</b>: 40 − 25.', vis: { kind: 'pictogram', args: [[{ label: 'Lucy', count: 2.5, emoji: '⭐' }, { label: 'Kai', count: 4, emoji: '⭐' }], 10] },
          quiz: { prompt: 'Lucy has 25 and Kai has 40. How many more has Kai?', options: [{ label: '15', ok: true }, { label: '65', ok: false }, { label: '1', ok: false }], right: 'Yes! 40 − 25 = 15.', wrong: '“How many more” means subtract: 40 − 25 = 15.' } }
      ]
    },
    trick: {
      title: 'Key first, then count in jumps',
      say: 'Before anything else, <b>read the key</b>. Then count the symbols in <b>jumps of the key</b>. For a half symbol, add half a jump at the end.',
      vis: { kind: 'pictogram', args: [[{ label: 'Mei', count: 3.5, emoji: '⭐' }], 10] },
      example: 'Key 10: 10, 20, 30, then half a jump (+5) = <b>35</b>'
    },
    gen: { 1: g1, 2: g2, 3: g3 }
  });
})();
