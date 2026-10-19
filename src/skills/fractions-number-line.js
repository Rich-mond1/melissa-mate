/* frac-number-line — fractions on a 0-1 number line (and 0-2 in tier 3, read as "one and two quarters").
   All lines use width 300 (or 240 for small option lines) so tick positions are exact and the decoders can read the
   denominator from the number of drawn ticks and the numerator from the marker position. */
(function(){
  const DENS = [2, 3, 4, 5, 6, 8, 10];
  const NAMES = { 2: ['half', 'halves'], 3: ['third', 'thirds'], 4: ['quarter', 'quarters'], 5: ['fifth', 'fifths'], 6: ['sixth', 'sixths'], 8: ['eighth', 'eighths'], 10: ['tenth', 'tenths'] };
  function F(n, d){ return fracHTML(n, d); }
  function fK(n, d){ return K.frac(n, d); }
  function words(n, d){ return numWord(n) + ' ' + NAMES[d][n === 1 ? 0 : 1]; }
  function mixedWords(w, n, d){ return (w ? numWord(w) + ' and ' : '') + words(n, d); }

  /* 0-1 line cut into d equal steps; dot/question mark at n/d (n === null: no marker); o.all prints every fraction */
  function line01(d, n, o){
    o = o || {};
    return V.numberLine({
      min: 0, max: 1, minor: 1 / d, major: o.all ? 1 / d : 1, width: o.width || 300,
      marks: n === null ? [] : [{ value: n / d, kind: o.dot ? 'dot' : 'q' }],
      labels: function(v){ const k = Math.round(v * d); return k === 0 ? '0' : k === d ? '1' : (o.all ? k + '/' + d : ''); }
    });
  }
  function line02(d, n, o){ // dot at 1 + n/d, whole numbers 0, 1, 2 labelled
    return V.numberLine({ min: 0, max: 2, minor: 1 / d, major: 1, width: 300, marks: [{ value: 1 + n / d, kind: (o && o.dot) ? 'dot' : 'q' }], labels: function(v){ return String(Math.round(v)); } });
  }
  /* read back from the DRAWING: steps in one whole = ticks, position of the marker */
  function readFrac(html, wholes){
    const den = (V.countTicks(html) - 1) / wholes;
    const v = V.decodeNumberLine(html);
    return { num: Math.round(v * den), den: den };
  }

  function readWrongs(n, d){
    const w = [];
    if(n + 1 < d) w.push({ n: n + 1, d: d, why: 'You counted the 0 mark as a step. Start counting the JUMPS from 0 (0 is zero jumps).' });
    w.push({ n: n, d: d + 1, why: 'You counted the tick marks (' + (d + 1) + '). Count the equal STEPS between 0 and 1: there are ' + d + '.' });
    w.push({ n: d - n, d: d, why: 'You counted from the 1 going backwards. Count the steps from 0 to the dot.' });
    if(n - 1 >= 1) w.push({ n: n - 1, d: d, why: 'Count the jumps again — you are one jump short.' });
    w.push({ n: 1, d: d, why: 'That is only one step from 0. Count every step up to the dot.' });
    const same = [], other = [];
    for(let k = 1; k < d; k++) same.push({ n: k, d: d, why: 'Count the steps from 0 to the dot carefully.' });
    shuffle(DENS).sort(function(a, b){ return Math.abs(a - d) - Math.abs(b - d); }).forEach(function(dd){ if(dd !== d) for(let k = 1; k < dd; k++) other.push({ n: k, d: dd, why: 'The line from 0 to 1 is cut into ' + d + ' steps, so the bottom number is ' + d + '.' }); });
    return w.concat(shuffle(same), other).filter(function(x){ return x.d >= 2 && x.n >= 1 && x.n < x.d; });
  }

  function readQ(d, n, all){
    const vis = line01(d, n, { all: all });
    return mcq({
      prompt: all ? 'The number line from 0 to 1 has ' + d + ' equal steps. Which fraction is the ? pointing to?' : 'The number line from 0 to 1 is cut into ' + d + ' equal steps. What fraction is the ? at?', visual: vis,
      correct: opt(fK(n, d), F(n, d)), keepOrder: true,
      distractors: readWrongs(n, d).map(function(x){ return opt(fK(x.n, x.d), F(x.n, x.d), x.why); }),
      hint: 'Count the JUMPS from 0 to the ?. The bottom number is how many equal steps are in the whole line from 0 to 1.',
      explain: ex('Reading the number line', [
        'The line from 0 to 1 has <b>' + d + '</b> equal steps, so each step is 1/' + d + '.',
        'From 0 to the ? there ' + (n === 1 ? 'is' : 'are') + ' <b>' + plural(n, 'step') + '</b>.',
        'So the ? is at <b>' + n + '/' + d + '</b>. ✅'
      ]),
      truth: fK(n * 2, d * 2),
      decode: function(){ const r = readFrac(vis, 1); return fK(r.num, r.den); }
    });
  }

  function typedQ(d, n){
    const vis = line01(d, n, {});
    return numeric({
      prompt: 'The number line from 0 to 1 is cut into ' + d + ' equal steps. The ? is at ?/' + d + '. Type the missing top number.', visual: vis, answer: n,
      hint: 'Count the jumps from 0 to the ?. That number goes on the top.',
      explain: ex('Counting the steps', ['The ? is <b>' + plural(n, 'step') + '</b> along from 0.', 'Each step is 1/' + d + ', so the fraction is ' + n + '/' + d + '.', 'The missing top number is <b>' + n + '</b>. ✅']),
      truth: n, decode: function(){ return readFrac(vis, 1).num; },
      wrong: function(v){ return v === n + 1 ? 'You counted the 0 mark as a step. Count the jumps instead.' : v === d - n ? 'You counted from the 1. Count the jumps from 0.' : v === d ? 'That is the bottom number. We want the top number: the steps from 0.' : ''; }
    });
  }

  function pictureQ(d, n){
    const ds = [];
    for(let k = 1; k < d; k++) if(k !== n) ds.push(opt(fK(k, d), line01(d, k, { width: 240 }), 'That dot is at ' + k + '/' + d + ', not ' + n + '/' + d + '.'));
    const q = mcq({
      prompt: 'Which number line has the ? at ' + n + '/' + d + '?', visual: '',
      correct: opt(fK(n, d), line01(d, n, { width: 240 })), distractors: shuffle(ds), count: Math.min(3, d - 1 >= 3 ? 3 : 2),
      hint: 'Each line is cut into ' + d + ' equal steps. Count ' + plural(n, 'step') + ' along from 0.',
      explain: ex('Placing ' + n + '/' + d, ['The line from 0 to 1 is cut into <b>' + d + '</b> equal steps.', 'The top number says to walk <b>' + plural(n, 'step') + '</b> from 0.', 'Only one line has its ? at <b>' + n + '/' + d + '</b>. ✅']),
      truth: fK(n * 3, d * 3)
    });
    q.optionsAreVisual = true;
    q.decodeKey = function(){
      for(let i = 0; i < q.options.length; i++){ const r = readFrac(q.options[i].label, 1); if(r.den !== d || fK(r.num, r.den) !== q.options[i].key) return 'option ' + i + ' picture does not match its key'; }
      return q.options[q.correct].key;
    };
    return q;
  }

  function mixedQ(d, n){
    const vis = line02(d, n);
    const val = function(w, k){ return K.num(w + k / d); };
    const list = [
      { w: 1, k: d - n, why: 'You counted back from the 2. Count the steps after the 1, going right.' },
      { w: 0, k: n, why: 'You forgot the whole one. The ? is PAST the 1, so it is one and a bit.' },
      { w: 2, k: n, why: 'The ? is between 1 and 2, so it is “one and…”, not “two and…”.' },
      { w: 1, k: n + 1, why: 'You counted the 1 as a step. Start counting steps AFTER the 1.' },
      { w: 1, k: n - 1, why: 'Count the steps after the 1 again — you are one short.' }
    ];
    for(let k = 1; k < d; k++) list.push({ w: 1, k: k, why: 'Count the steps after the 1 carefully: there are ' + n + '.' });
    const ds = list.filter(function(x){ return x.k >= 1 && x.k < d; }).map(function(x){ return opt(val(x.w, x.k), mixedWords(x.w, x.k, d), x.why); });
    return mcq({
      prompt: 'The number line goes from 0 to 2. Each whole is cut into ' + d + ' equal steps. What number is the ? at?', visual: vis,
      correct: opt(val(1, n), mixedWords(1, n, d)), distractors: ds, keepOrder: true, count: Math.min(4, new Set(ds.map(function(o){ return o.key; }).filter(function(k){ return k !== val(1, n); })).size + 1),
      hint: 'The ? is past the 1. First say how many wholes (1), then count the steps after the 1.',
      explain: ex('Reading past 1', [
        'The ? is just after the <b>1</b>, so we say “one and…”.',
        'After the 1 there ' + (n === 1 ? 'is' : 'are') + ' <b>' + plural(n, 'step') + '</b>, and each step is 1/' + d + ' (' + NAMES[d][1] + ').',
        'So the ? is at <b>' + mixedWords(1, n, d) + '</b>. ✅'
      ]),
      truth: K.num((d + n) / d),
      decode: function(){ const r = readFrac(vis, 2); return K.num(1 * 0 + r.num / r.den); }
    });
  }

  function ana(d, n){ // Ana says the ? is at a/d. Is she right?
    const right = chance(0.4);
    let a = right ? n : (chance(0.5) ? d - n : n + (chance(0.5) ? 1 : -1));
    if(!right && (a === n || a < 1 || a >= d)) a = n === 1 ? 2 : n - 1;
    const vis = line01(d, n, {});
    const nm = pick(['Ana', 'Marcus', 'Sophie', 'Ivan', 'Lucy', 'Diego', 'Aisha', 'Kai']);
    const yes = opt(K.bool(true), 'Yes', 'Count the jumps from 0 again: the ? is at ' + n + '/' + d + ', not ' + a + '/' + d + '.');
    const no = opt(K.bool(false), 'No', 'Count the jumps from 0 again: the ? really IS at ' + a + '/' + d + ', so ' + nm + ' is right.');
    return mcq2({
      prompt: nm + ' says the ? is at ' + a + '/' + d + '. Is ' + nm + ' right?', visual: vis,
      correct: right ? yes : no, other: right ? no : yes,
      hint: 'Count the jumps from 0 to the ? and compare with the top number.',
      explain: right
        ? ex('Checking', ['The line has <b>' + d + '</b> equal steps.', 'The ? is <b>' + plural(n, 'step') + '</b> from 0, so it is at ' + n + '/' + d + '.', 'Yes — ' + nm + ' is right. ✅'])
        : ex('Checking', ['The line has <b>' + d + '</b> equal steps.', 'The ? is <b>' + plural(n, 'step') + '</b> from 0, so it is at ' + n + '/' + d + ', not ' + a + '/' + d + '.', 'No — ' + nm + ' is not right. ✅']),
      truth: K.bool(n === a),
      decode: function(){ const r = readFrac(vis, 1); return K.bool(r.num === a && r.den === d); }
    });
  }

  registerSkill({
    id: 'frac-number-line', strand: 'fractions', name: 'Fractions on a number line', emoji: '📏', year: 3, order: 430, prereq: ['frac-nonunit'],
    lesson: {
      title: 'Fractions between 0 and 1',
      steps: [
        { say: 'Fractions live on number lines too! The space from <b>0</b> to <b>1</b> is one whole. Here it is cut into <b>4 equal steps</b>, so each step is <b>1/4</b>.', vis: { kind: 'numberLine', args: [{ min: 0, max: 1, minor: 0.25, major: 0.25, width: 300, marks: [], labels: function(v){ const k = Math.round(v * 4); return k === 0 ? '0' : k === 4 ? '1' : k + '/4'; } }] } },
        { say: 'Count the <b>steps</b> from 0 to the dot. The dot is <b>3</b> steps along, so it is at <b>3/4</b>.', vis: { kind: 'numberLine', args: [{ min: 0, max: 1, minor: 0.25, major: 1, width: 300, marks: [{ value: 0.75, kind: 'dot' }], labels: function(v){ return v < 0.5 ? '0' : '1'; } }] } },
        { say: 'Now the line is cut into <b>3</b> equal steps. The bottom number is <b>3</b> because there are 3 steps in the whole. Count the steps to the dot.', vis: { kind: 'numberLine', args: [{ min: 0, max: 1, minor: 1 / 3, major: 1, width: 300, marks: [{ value: 2 / 3, kind: 'dot' }], labels: function(v){ return v < 0.5 ? '0' : '1'; } }] },
          quiz: { prompt: 'Which fraction is the dot at?', options: [{ label: '2/3', ok: true }, { label: '3/2', ok: false }, { label: '1/3', ok: false }], right: 'Yes! 2 steps out of 3 is 2/3.', wrong: 'The dot is 2 steps from 0 and the whole line has 3 steps. So 2/3.' } },
        { say: 'Half way along is <b>1/2</b>. The nearer a dot is to 1, the bigger the fraction.', vis: { kind: 'numberLine', args: [{ min: 0, max: 1, minor: 0.5, major: 1, width: 300, marks: [{ value: 0.5, kind: 'dot' }], labels: function(v){ return v < 0.5 ? '0' : '1'; } }] } },
        { say: 'The line can go past 1! This dot is 1 whole and then 1 more step of a quarter. We read it as <b>“one and one quarter”</b>.', vis: { kind: 'numberLine', args: [{ min: 0, max: 2, minor: 0.25, major: 1, width: 300, marks: [{ value: 1.25, kind: 'dot' }], labels: function(v){ return String(Math.round(v)); } }] },
          quiz: { prompt: 'The dot is past 1. How do we read it?', options: [{ label: 'one and one quarter', ok: true }, { label: 'one quarter', ok: false }, { label: 'two and one quarter', ok: false }], right: 'Yes! One whole, and one more quarter.', wrong: 'The dot is past the 1 but not yet at the 2, so it is “one and one quarter”.' } }
      ]
    },
    trick: {
      title: 'Count the jumps, not the stops',
      say: 'Start at 0 and <b>count the jumps</b> (the gaps) to the dot. Do NOT count the tick marks, because the 0 mark is zero jumps! The number of jumps is the <b>top</b>. The jumps in the whole line is the <b>bottom</b>.',
      vis: { kind: 'numberLine', args: [{ min: 0, max: 1, minor: 0.2, major: 1, width: 300, marks: [{ value: 0.6, kind: 'dot' }], labels: function(v){ return v < 0.5 ? '0' : '1'; } }] },
      example: '3 jumps from 0, and 5 jumps in the whole line → <b>3/5</b>'
    },
    gen: {
      1: function(){
        const d = pick([2, 3, 4, 5]), n = randInt(1, d - 1);
        return readQ(d, n, chance(0.5));
      },
      2: function(){
        const r = randInt(0, 4);
        if(r <= 1){ const d = pick(DENS.filter(function(x){ return x >= 3; })), n = randInt(1, d - 1); return readQ(d, n, false); }
        if(r === 2){ const d = pick([3, 4, 5, 6, 8]); return pictureQ(d, randInt(1, d - 1)); }
        const d = pick([4, 5, 6, 8, 10]);
        return typedQ(d, randInt(1, d - 1));
      },
      3: function(){
        const r = randInt(0, 5);
        if(r <= 1){ const d = pick([2, 3, 4, 5, 6, 8]); return mixedQ(d, randInt(1, d - 1)); }
        if(r === 2){ const d = pick([5, 6, 8, 10]); return typedQ(d, randInt(2, d - 1)); }
        if(r === 3){ const d = pick([4, 5, 6, 8, 10]); return pictureQ(d, randInt(1, d - 1)); }
        if(r === 4){ const d = pick([4, 5, 6, 8, 10]); return ana(d, randInt(1, d - 1)); }
        const d = pick([6, 8, 10]); return readQ(d, randInt(2, d - 1), false);
      }
    }
  });
})();
