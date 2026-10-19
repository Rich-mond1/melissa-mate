/* MEASURE — converting units with whole numbers: m<->cm, cm<->mm, km<->m, kg<->g, l<->ml.
   "Kilo means a thousand". Misconception targeted: multiplying by 10 instead of 100 (and 100 instead of 1000). */
(function(){
  const NAMES = ['Ana', 'Marcus', 'Sophie', 'Ivan', 'Lucy', 'Diego', 'Ellen', 'Tom', 'Aisha', 'Kai', 'Mei', 'Leo'];
  const C = {
    mcm: { big: 'm', small: 'cm', f: 100, bigName: 'metre', smallName: 'centimetre' },
    cmmm: { big: 'cm', small: 'mm', f: 10, bigName: 'centimetre', smallName: 'millimetre' },
    kmm: { big: 'km', small: 'm', f: 1000, bigName: 'kilometre', smallName: 'metre' },
    kgg: { big: 'kg', small: 'g', f: 1000, bigName: 'kilogram', smallName: 'gram' },
    lml: { big: 'l', small: 'ml', f: 1000, bigName: 'litre', smallName: 'millilitre' }
  };
  const KEYS = Object.keys(C);
  const FACTORS = [10, 100, 1000];
  function lab(unit){ return function(v){ return v + ' ' + unit; }; }
  function sum(a){ return a.reduce(function(x, y){ return x + y; }, 0); }
  function times(n, f){ return sum(Array(n).fill(f)); }        // independent: repeated addition
  function zerosWord(f){ return f === 10 ? 'one zero' : f === 100 ? 'two zeros' : 'three zeros'; }
  function why(f, mode, c){   // reason for confusing the factor
    if(mode === 'mult') return 'You multiplied by ' + f + '. There are ' + c.f + ' ' + c.small + ' in 1 ' + c.big + ', so multiply by ' + c.f + '.';
    return 'You divided by ' + f + '. There are ' + c.f + ' ' + c.small + ' in 1 ' + c.big + ', so divide by ' + c.f + '.';
  }
  function fact(c){ return '1 ' + c.big + ' = ' + c.f + ' ' + c.small; }
  const ZERO = { 10: 'adds one zero', 100: 'adds two zeros', 1000: 'adds three zeros' };

  // big -> small:  n big = ? small
  function up(c, n, tier){
    const a = times(n, c.f);
    const wrong = FACTORS.filter(function(f){ return f !== c.f; }).map(function(f){ return { v: n * f, why: why(f, 'mult', c) }; });
    wrong.push({ v: n + c.f, why: 'You added ' + n + ' and ' + c.f + '. To change units you MULTIPLY by ' + c.f + '.' });
    wrong.push({ v: n, why: 'You did not change the number. ' + fact(c) + ', so ' + n + ' ' + c.big + ' is many more ' + c.small + '.' });
    return mcqNum({
      prompt: n + ' ' + c.big + ' = ? ' + c.small, answer: n * c.f, fmt: lab(c.small), wrong: wrong,
      nearby: [c.f, -c.f, 10, -10, 100, -100],
      valid: function(v){ return v > 0 && Number.isInteger(v); },
      hint: fact(c) + '. A bigger unit changes into a smaller unit, so you need MORE of them.',
      explain: ex(c.big + ' to ' + c.small, [fact(c)+ '.', n + ' × ' + c.f + ' ' + '(the number ' + ZERO[c.f] + '): ' + Array(n).fill(c.f).join(' + ') + ' = ' + a + '.', n + ' ' + c.big + ' = <b>' + a + ' ' + c.small + '</b>. ✅']),
      truth: a
    });
  }
  // small -> big:  n*f small = ? big
  function down(c, n){
    const v = n * c.f;
    const wrong = FACTORS.filter(function(f){ return f !== c.f; }).map(function(f){ return { v: v / f, why: why(f, 'div', c) }; });
    wrong.push({ v: v, why: 'You did not change the number. A smaller unit changes into a bigger unit, so you need FEWER of them: divide by ' + c.f + '.' });
    wrong.push({ v: v * 10, why: 'You made the number bigger. Going from ' + c.small + ' to ' + c.big + ' needs FEWER, so divide.' });
    wrong.push({ v: v - c.f, why: 'You took ' + c.f + ' away. To change units you DIVIDE by ' + c.f + '.' });
    return mcqNum({
      prompt: v + ' ' + c.small + ' = ? ' + c.big, answer: n, fmt: lab(c.big), wrong: wrong,
      nearby: [1, -1, 10, -10, 2, -2],
      valid: function(x){ return x > 0 && Number.isInteger(x); },
      hint: fact(c) + '. Count how many lots of ' + c.f + ' fit into ' + v + '.',
      explain: ex(c.small + ' to ' + c.big, [fact(c) + ', so divide by ' + c.f + '.', v + ' ÷ ' + c.f + ' (cross off ' + zerosWord(c.f) + ') = ' + n + '.', v + ' ' + c.small + ' = <b>' + n + ' ' + c.big + '</b>. ✅']),
      truth: (v - v % c.f) / c.f
    });
  }

  registerSkill({
    id: 'measure-units', strand: 'measure', name: 'Changing units: m, cm, mm, kg, g…', emoji: '🔁', year: 3, order: 640, prereq: ['multdiv-2-5-10'],
    lesson: {
      title: 'Changing between units',
      steps: [
        { say: 'On a ruler, every <b>centimetre</b> has <b>10 millimetres</b> in it. This line is 3 cm. That is 3 × 10 = <b>30 mm</b>.', vis: { kind: 'ruler', args: [3] } },
        { say: 'A <b>metre</b> is a long stride. <b>1 m = 100 cm</b>. So 2 m = 100 cm + 100 cm = <b>200 cm</b>.', vis: { kind: 'html', args: ['<div style="font:800 20px system-ui;text-align:center;line-height:1.8">1 m = 100 cm<br>2 m = 200 cm<br>3 m = 300 cm</div>'] },
          quiz: { prompt: 'How many centimetres are in 4 metres?', options: [{ label: '400 cm', ok: true }, { label: '40 cm', ok: false }, { label: '104 cm', ok: false }], right: 'Yes! 4 × 100 = 400 cm.', wrong: '1 m is 100 cm, so 4 m is 4 × 100 = 400 cm. (Not times 10!)' } },
        { say: '<b>Kilo</b> means <b>a thousand</b>. So <b>1 kg = 1000 g</b>. The needle at the end of this scale is 1000 g, which is 1 kg.', vis: { kind: 'dial', args: [1000, 1000, { major: 250, minor: 50, unit: 'g' }] } },
        { say: '<b>1 litre = 1000 ml</b>. A full 1 litre jug holds 1000 ml. 2 litres would be 2 × 1000 = <b>2000 ml</b>.', vis: { kind: 'jug', args: [1000, 1000, { major: 250, minor: 50, unit: 'ml' }] },
          quiz: { prompt: 'How many millilitres are in 3 litres?', options: [{ label: '3000 ml', ok: true }, { label: '300 ml', ok: false }, { label: '30 ml', ok: false }], right: 'Yes! 3 × 1000 = 3000 ml.', wrong: '1 litre = 1000 ml, so 3 litres = 3 × 1000 = 3000 ml.' } },
        { say: 'Big unit → small unit: <b>multiply</b> (you get MORE of them). Small unit → big unit: <b>divide</b> (you get FEWER). 500 cm ÷ 100 = <b>5 m</b>.', vis: { kind: 'html', args: ['<div style="font:800 18px system-ui;text-align:center;line-height:1.8">m → cm : × 100<br>cm → m : ÷ 100<br>kg → g : × 1000<br>g → kg : ÷ 1000</div>'] } }
      ]
    },
    trick: {
      title: 'Kilo means a thousand!',
      say: '<b>Kilo</b> = 1000 (kilo-gram, kilo-metre). <b>Milli</b> = 1000 of them in a whole (milli-litre). <b>Centi</b> = 100 (centi-metre). Only <b>cm → mm</b> is ×10. Multiplying? The number grows by that many zeros.',
      vis: { kind: 'html', args: ['<div style="font:700 17px system-ui;text-align:center;line-height:1.7">kilo = 1000 · centi = 100 · milli = 1000<br><b>1 km = 1000 m · 1 kg = 1000 g · 1 l = 1000 ml<br>1 m = 100 cm · 1 cm = 10 mm</b></div>'] },
      example: '4 kg = 4 × 1000 = <b>4000 g</b> (add three zeros)'
    },
    gen: {
      1: function(){ return pick([t1Ruler, t1Fact, t1Fact, t1Basic, t1Basic, t1Basic])(); },
      2: function(){ return pick([t2Up, t2Up, t2Down, t2Down, t2Mixed, t2Mixed, t2Compare])(); },
      3: function(){ return pick([t3Typed, t3Typed, t3Down, t3Place, t3Order, t3Words, t3Compare])(); }
    }
  });

  /* ------------------------------ tier 1 ------------------------------ */
  function t1Ruler(){
    const n = randInt(2, 9), vis = V.ruler(n, { emoji: '📏', maxCm: n + 1 }), c = C.cmmm;
    return mcqNum({
      prompt: 'This line is ' + n + ' cm long. How many millimetres is that?', visual: vis, answer: n * 10, fmt: lab('mm'),
      wrong: [
        { v: n, why: 'You did not change the number. Every cm has 10 mm in it.' },
        { v: n * 100, why: 'You multiplied by 100. There are only 10 mm in 1 cm.' },
        { v: n + 10, why: 'You added 10. Each centimetre is 10 mm, so multiply: ' + n + ' × 10.' }
      ],
      nearby: [10, -10, 20, 100],
      valid: function(v){ return v > 0; },
      hint: 'Look at the ruler: each centimetre has 10 little marks (10 mm). How many centimetres are there?',
      explain: ex('cm to mm', ['1 cm = 10 mm.', n + ' cm is ' + n + ' lots of 10: ' + Array(n).fill(10).join(' + ') + '.', 'So ' + n + ' cm = <b>' + (n * 10) + ' mm</b>. ✅']),
      truth: times(n, 10), decode: function(){ return Math.round(V.decodeRuler(vis)) * 10; }
    });
  }
  function t1Fact(){
    const c = C[pick(KEYS)];
    const nm = { 'm': 'metre', 'cm': 'centimetre', 'km': 'kilometre', 'kg': 'kilogram', 'l': 'litre' };
    return mcqNum({
      prompt: 'How many ' + c.smallName + 's are in 1 ' + c.bigName + '?', answer: c.f, fmt: lab(c.small),
      wrong: FACTORS.filter(function(f){ return f !== c.f; }).map(function(f){ return { v: f, why: 'Not quite: ' + fact(c) + '.' + (c.f === 1000 ? ' Remember: kilo means a thousand.' : '') }; }).concat([{ v: 1, why: 'There are many more small units in one big unit.' }, { v: 10000, why: 'That is too many. ' + fact(c) + '.' }]),
      nearby: [1000, 100, 10],
      valid: function(v){ return v > 0; },
      hint: c.f === 1000 ? 'Think: kilo means a thousand. Is the answer for ' + c.big + ' a thousand?' : 'A ' + c.bigName + ' is much bigger than a ' + c.smallName + '. How many fit in?',
      explain: ex('A key fact', [fact(c) + '.', c.f === 1000 ? '“Kilo” and “milli” both come from the number a thousand.' : (c.f === 100 ? '“Centi” is about a hundred.' : 'A centimetre is split into 10 tiny millimetres.'), 'So there are <b>' + c.f + ' ' + c.small + '</b>. ✅']),
      truth: Math.pow(10, String(c.f).length - 1)
    });
  }
  function t1Basic(){
    const c = C[pick(KEYS)], n = randInt(2, 5);
    return up(c, n, 1);
  }

  /* ------------------------------ tier 2 ------------------------------ */
  function t2Up(){
    const c = C[pick(KEYS)], n = c.f === 10 ? randInt(11, 95) : randInt(2, 9);
    return up(c, n, 2);
  }
  function t2Down(){
    const c = C[pick(KEYS)], n = c.f === 10 ? randInt(3, 90) : randInt(2, 9);
    return down(c, n);
  }
  function t2Mixed(){
    const c = C[pick(['mcm', 'kgg', 'lml', 'kmm'])], n = randInt(1, 9), k = c.f === 100 ? randInt(1, 19) * 5 : randInt(1, 9) * 100;
    const v = n * c.f + k;
    return mcqNum({
      prompt: n + ' ' + c.big + ' ' + k + ' ' + c.small + ' = ? ' + c.small, answer: v, fmt: lab(c.small),
      wrong: [
        { v: n + k, why: 'You added the two numbers. First turn the ' + n + ' ' + c.big + ' into ' + c.small + '.' },
        { v: n * (c.f / 10) + k, why: 'You multiplied by ' + (c.f / 10) + '. ' + fact(c) + ', so ' + n + ' ' + c.big + ' = ' + (n * c.f) + ' ' + c.small + '.' },
        { v: n * c.f * 10 + k, why: 'That is too big. ' + n + ' ' + c.big + ' is only ' + (n * c.f) + ' ' + c.small + '.' },
        { v: n * c.f, why: 'You forgot to add the extra ' + k + ' ' + c.small + '.' }
      ],
      nearby: [10, -10, 100, -100, 50],
      valid: function(x){ return x > 0 && Number.isInteger(x); },
      hint: 'Change the big unit into small units first (' + fact(c) + '), then add the extra ' + c.small + '.',
      explain: ex('Two units in one', [fact(c) + ', so ' + n + ' ' + c.big + ' = ' + n + ' × ' + c.f + ' = <b>' + (n * c.f) + ' ' + c.small + '</b>.', 'Now add the extra: ' + (n * c.f) + ' + ' + k + ' = ?', n + ' ' + c.big + ' ' + k + ' ' + c.small + ' = <b>' + v + ' ' + c.small + '</b>. ✅']),
      truth: times(n, c.f) + k
    });
  }
  // compare two measures in different units
  const CMP = { mcm: [['m', 100], ['cm', 1]], kmm: [['km', 1000], ['m', 1]], kgg: [['kg', 1000], ['g', 1]], lml: [['l', 1000], ['ml', 1]] };
  const CMP_WORD = { mcm: ['longer', 'shorter'], kmm: ['longer', 'shorter'], kgg: ['heavier', 'lighter'], lml: ['more', 'less'] };
  function compareQ(tier){
    const key = pick(['mcm', 'mcm', 'kgg', 'lml', 'kmm']), c = C[key], w = CMP_WORD[key];
    const n = randInt(1, 6);
    let m;
    const near = chance(0.5);
    do { m = near ? n * c.f + pick([-1, 1]) * (c.f === 100 ? pick([10, 20, 25, 50]) : pick([100, 200, 250, 500])) : randInt(1, 9) * (c.f === 100 ? 50 : 500) + (tier === 3 ? (c.f === 100 ? 20 : 250) : 0); } while(m <= 0 || m === n * c.f);
    if(m > 6000 && c.f === 1000) m = m - 3000;
    const A = n + ' ' + c.big, B = m + ' ' + c.small;
    const aSmall = n * c.f, bigger = aSmall > m ? A : B, smaller = aSmall > m ? B : A;
    const biggerNum = Math.max(n, m), pickWord = chance(0.5) ? 0 : 1;
    const target = pickWord === 0 ? bigger : smaller;
    const other = pickWord === 0 ? smaller : bigger;
    return mcq2({
      prompt: 'Which is ' + w[pickWord] + ': ' + A + ' or ' + B + '?',
      correct: opt(K.text(target), target),
      other: opt(K.text(other), other, 'Change them to the same unit first. ' + A + ' = ' + aSmall + ' ' + c.small + ', and ' + B + ' is ' + m + ' ' + c.small + '. Do not just compare ' + n + ' and ' + m + '.'),
      hint: 'You cannot compare a ' + c.big + ' number with a ' + c.small + ' number. Change one to the other unit first.',
      explain: ex('Comparing different units', ['Change ' + A + ' into ' + c.small + ': ' + n + ' × ' + c.f + ' = <b>' + aSmall + ' ' + c.small + '</b>.', 'Compare ' + aSmall + ' ' + c.small + ' with ' + m + ' ' + c.small + '. ' + (aSmall > m ? aSmall + ' is bigger.' : m + ' is bigger.'), 'The ' + w[pickWord] + ' one is <b>' + target + '</b>. ✅']),
      truth: K.text([[times(n, c.f), A], [m, B]].sort(function(x, y){ return pickWord === 0 ? y[0] - x[0] : x[0] - y[0]; })[0][1])
    });
  }
  function t2Compare(){ return compareQ(2); }

  /* ------------------------------ tier 3 ------------------------------ */
  function t3Typed(){
    const c = C[pick(['mcm', 'kgg', 'lml', 'kmm'])], n = randInt(1, 9);
    const form = randInt(0, 1);
    let k = form === 0 ? (c.f === 100 ? randInt(1, 9) * 5 + 10 : randInt(1, 9) * 100 + pick([0, 50])) : (c.f === 100 ? randInt(1, 9) : pick([20, 40, 60, 80, 5, 25, 75]));
    if(form === 1 && c.f === 1000) k = pick([20, 40, 50, 60, 80, 5, 25, 75]);
    const v = n * c.f + k;
    return numeric({
      prompt: n + ' ' + c.big + ' ' + k + ' ' + c.small + ' = ? ' + c.small, answer: v, unit: c.small,
      hint: fact(c) + '. Change the ' + n + ' ' + c.big + ' first, then add ' + k + '. Mind the place value!',
      explain: ex('Two units', [n + ' ' + c.big + ' = ' + n + ' × ' + c.f + ' = <b>' + (n * c.f) + ' ' + c.small + '</b>.', 'Add the extra ' + k + ' ' + c.small + ': ' + (n * c.f) + ' + ' + k + '.', 'Total: <b>' + v + ' ' + c.small + '</b>. ✅']),
      truth: times(n, c.f) + k,
      wrong: function(x){ return x === n + k ? 'You added the two numbers. Change ' + c.big + ' into ' + c.small + ' first.' : x === n * 10 + k || x === n * c.f / 10 + k ? 'You multiplied by ' + (c.f / 10) + '. ' + fact(c) + '.' : (x === n * 10 * c.f + k) ? 'That is too big: ' + n + ' ' + c.big + ' is ' + (n * c.f) + ' ' + c.small + '.' : x === n * c.f ? 'Do not forget to add the extra ' + k + ' ' + c.small + '.' : x === Number(String(n) + String(k)) ? 'Place value! The ' + k + ' needs the right number of digits: ' + n + ' ' + c.big + ' = ' + (n * c.f) + ' ' + c.small + '.' : ''; }
    });
  }
  function t3Down(){
    const c = C[pick(['mcm', 'kgg', 'lml', 'kmm'])], n = randInt(1, 9), r = c.f === 100 ? randInt(1, 19) * 5 : randInt(1, 9) * 100 - (chance(0.5) ? 50 : 0);
    const v = n * c.f + r;
    return numeric({
      prompt: v + ' ' + c.small + ' = ' + n + ' ' + c.big + ' and ? ' + c.small, answer: r, unit: c.small,
      hint: fact(c) + '. How many whole ' + c.big + ' fit into ' + v + '? What is left over?',
      explain: ex('Splitting up', ['Whole ' + c.big + ': ' + n + ' × ' + c.f + ' = ' + (n * c.f) + ' ' + c.small + ' fit into ' + v + '.', 'What is left: ' + v + ' − ' + (n * c.f) + '.', v + ' ' + c.small + ' = ' + n + ' ' + c.big + ' and <b>' + r + ' ' + c.small + '</b>. ✅']),
      truth: v % c.f,
      wrong: function(x){ return x === n ? 'That is the number of ' + c.big + '. The question asks how many ' + c.small + ' are left over.' : ''; }
    });
  }
  function t3Place(){
    const c = C[pick(['mcm', 'kgg', 'lml'])], n = randInt(1, 6), k = pick([5, 8, 4, 9, 6, 7, 2]);
    const v = n * c.f + k;
    const ds = [
      { v: Number(String(n) + String(k)), why: '' },
      { v: n * c.f / 10 + k, why: 'You multiplied by ' + (c.f / 10) + ', not ' + c.f + '.' },
      { v: n * c.f + k * 10, why: 'The extra ' + k + ' ' + c.small + ' is just ' + k + ', not ' + (k * 10) + '.' },
      { v: n + k, why: 'You added the two numbers. Change ' + c.big + ' into ' + c.small + ' first.' },
      { v: n * c.f, why: 'You forgot the extra ' + k + ' ' + c.small + '.' },
      { v: n * c.f + k * 100, why: 'The extra ' + k + ' ' + c.small + ' is just ' + k + '.' }
    ];
    ds[0].why = 'Place value! ' + n + ' ' + c.big + ' is ' + (n * c.f) + ' ' + c.small + ', so the ' + k + ' goes in the units place, with zeros before it.';
    return mcqNum({
      prompt: 'How many ' + c.small + ' is ' + n + ' ' + c.big + ' ' + k + ' ' + c.small + '?', answer: v, fmt: lab(c.small), wrong: ds,
      nearby: [10, -10, 100],
      valid: function(x){ return x > 0 && Number.isInteger(x); },
      hint: 'Write ' + n + ' ' + c.big + ' as ' + c.small + ' first. Then the ' + k + ' goes on the end — think about the zeros.',
      explain: ex('Mind the zeros', [n + ' ' + c.big + ' = ' + (n * c.f) + ' ' + c.small + '.', 'Add ' + k + ': ' + (n * c.f) + ' + ' + k + ' (the ' + k + ' sits in the units column).', 'The answer is <b>' + v + ' ' + c.small + '</b>. ✅']),
      truth: times(n, c.f) + k
    });
  }
  function t3Order(){
    const key = pick(['mcm', 'kgg', 'lml']), c = C[key];
    const n = 4;
    // four distinct amounts in mixed units, each worth a different number of small units
    let items;
    do {
      items = [];
      for(let i = 0; i < n; i++){
        const useBig = chance(0.5);
        const bigN = randInt(1, 4);
        const smallN = useBig ? bigN * c.f : (c.f === 100 ? randInt(2, 40) * 10 : randInt(1, 40) * 100 + 50 * randInt(0, 1));
        const label = useBig ? bigN + ' ' + c.big : smallN + ' ' + c.small;
        items.push({ v: smallN, label: label });
      }
    } while(new Set(items.map(function(i){ return i.v; })).size < n || items.some(function(i){ return i.v > 6000; }));
    const sorted = []; const rest = items.slice();   // selection sort: take the smallest each time (independent of Array.sort)
    while(rest.length){ let mi = 0; for(let i = 1; i < rest.length; i++) if(rest[i].v < rest[mi].v) mi = i; sorted.push(rest.splice(mi, 1)[0]); }
    const word = key === 'mcm' || key === 'kmm' ? 'shortest' : key === 'kgg' ? 'lightest' : 'smallest amount';
    const q = order({
      prompt: 'Put these in order, starting with the ' + word + '.',
      items: sorted.map(function(i){ return { key: 'v' + i.v, label: i.label }; }),
      hint: 'Change every amount into ' + c.small + ' first (' + fact(c) + '). Then the biggest number is the biggest amount.',
      explain: ex('Ordering mixed units', ['Change all to ' + c.small + ': ' + sorted.map(function(i){ return i.label + ' = ' + i.v + ' ' + c.small; }).join('; ') + '.', 'Now put the numbers in order: ' + sorted.map(function(i){ return i.v; }).join(' < ') + '.', 'The order is <b>' + sorted.map(function(i){ return i.label; }).join(', ') + '</b>. ✅']),
      truth: 'o:' + items.slice().sort(function(a, b){ return a.v - b.v; }).map(function(i){ return 'v' + i.v; }).join('|')
    });
    return q;
  }
  function t3Words(){
    const nm = pick(NAMES), form = randInt(0, 3);
    if(form === 0){
      const n = randInt(2, 4), k = pick([20, 30, 35, 40, 45, 60]);
      return numeric({
        prompt: nm + ' has a rope that is ' + n + ' m long. ' + nm + ' cuts off ' + k + ' cm. How many cm of rope are left?', answer: n * 100 - k, unit: 'cm',
        hint: 'Change the metres into cm first. Then take away.',
        explain: ex('Rope left', [n + ' m = ' + n + ' × 100 = <b>' + (n * 100) + ' cm</b>.', (n * 100) + ' − ' + k + ' = ?', 'There are <b>' + (n * 100 - k) + ' cm</b> left. ✅']),
        truth: times(n, 100) - k
      });
    }
    if(form === 1){
      const n = randInt(2, 4), k = pick([200, 250, 300, 400, 500, 600]);
      return numeric({
        prompt: nm + ' has a ' + n + ' kg bag of flour and uses ' + k + ' g. How many grams of flour are left?', answer: n * 1000 - k, unit: 'g',
        hint: 'Change kilograms into grams first (1 kg = 1000 g). Then take away.',
        explain: ex('Flour left', [n + ' kg = ' + n + ' × 1000 = <b>' + (n * 1000) + ' g</b>.', (n * 1000) + ' − ' + k + ' = ?', 'There are <b>' + (n * 1000 - k) + ' g</b> left. ✅']),
        truth: times(n, 1000) - k
      });
    }
    if(form === 2){
      const n = randInt(2, 5), a = pick([200, 250, 300, 500]);
      return numeric({
        prompt: nm + ' drinks ' + a + ' ml of juice from a ' + n + ' litre bottle. How many ml of juice are left?', answer: n * 1000 - a, unit: 'ml',
        hint: 'Change litres into millilitres first (1 litre = 1000 ml).',
        explain: ex('Juice left', [n + ' litres = ' + n + ' × 1000 = <b>' + (n * 1000) + ' ml</b>.', (n * 1000) + ' − ' + a + ' = ?', 'There are <b>' + (n * 1000 - a) + ' ml</b> left. ✅']),
        truth: times(n, 1000) - a
      });
    }
    const n = randInt(2, 9), k = randInt(2, 6);
    return numeric({
      prompt: nm + ' walks ' + n + ' km to the park and then ' + k + ' km home. How many metres is that altogether?', answer: (n + k) * 1000, unit: 'm',
      hint: 'Add the kilometres, then change to metres (1 km = 1000 m).',
      explain: ex('Total distance in metres', [n + ' km + ' + k + ' km = <b>' + (n + k) + ' km</b>.', '1 km = 1000 m, so ' + (n + k) + ' × 1000.', 'That is <b>' + ((n + k) * 1000) + ' m</b>. ✅']),
      truth: times(n + k, 1000)
    });
  }
  function t3Compare(){ return compareQ(3); }
})();
