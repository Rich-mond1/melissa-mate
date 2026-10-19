/* MEASURE — capacity / volume: read measuring jugs in ml and litres, compare, "how much more to fill?"
   Every jug question decodes the WATER LEVEL from the drawing. */
(function(){
  const NAMES = ['Ana', 'Marcus', 'Sophie', 'Ivan', 'Lucy', 'Diego', 'Ellen', 'Tom', 'Aisha', 'Kai', 'Mei', 'Leo'];
  const LIQ = ['water', 'orange juice', 'milk', 'lemonade', 'apple juice', 'soup'];
  const ML_THINGS = [['a teaspoon', 5], ['a cup of tea', 200], ['a glass of water', 250], ['a small carton of juice', 200], ['a can of fizzy drink', 330], ['a spoon of medicine', 5], ['a yoghurt pot', 150], ['a small bottle of water', 500]];
  const L_THINGS = [['a bucket', 10000], ['a bath', 150000], ['a fish tank', 60000], ['a paddling pool', 400000], ['a big bottle of lemonade', 2000], ['a washing-up bowl', 8000], ['a watering can', 9000]];
  function mlTxt(v){ return v + ' ml'; }
  function lTxt(v){ if(v === 0.5) return '½ litre'; if(v === 1) return '1 litre'; return Math.floor(v) + (Number.isInteger(v) ? '' : '½') + ' litres'; }
  function cap(s){ return s.charAt(0).toUpperCase() + s.slice(1); }
  function dj(html, step){ return Math.round(V.decodeJug(html) / step) * step; }   // water level -> value, snapped to the scale
  function jug(val, sc, small){ const h = V.jug(val, sc.max, { major: sc.major, minor: sc.minor, unit: sc.unit }); return small ? h.replace(' width="200"', ' width="118"') : h; }
  function jugRow(parts){
    return '<div style="display:flex;flex-wrap:wrap;justify-content:center;gap:6px">' + parts.map(function(p){
      return '<div style="text-align:center;font-weight:800;width:170px">' + p.label + '<div style="width:170px">' + p.svg + '</div></div>'; }).join('') + '</div>';
  }
  const S1 = { max: 500, major: 100, minor: 100, unit: 'ml' };
  const S_H = { max: 500, major: 100, minor: 50, unit: 'ml' };
  const S_Q = { max: 1000, major: 250, minor: 50, unit: 'ml' };
  const S_2 = { max: 1000, major: 200, minor: 100, unit: 'ml' };
  const S_F = { max: 500, major: 100, minor: 20, unit: 'ml' };
  const S_L = { max: 2, major: 1, minor: 0.5, unit: 'l' };

  function readSteps(val, sc){
    const lab = Math.floor(val / sc.major + 1e-9) * sc.major, ticks = Math.round((val - lab) / sc.minor), gaps = Math.round(sc.major / sc.minor);
    if(ticks === 0) return ['The water level is exactly on the labelled line <b>' + lab + ' ml</b>.'];
    return ['The water level is just above the labelled line <b>' + lab + ' ml</b>.',
      'Between ' + lab + ' and ' + (lab + sc.major) + ' there are ' + gaps + ' little steps: ' + sc.major + ' ÷ ' + gaps + ' = <b>' + sc.minor + ' ml</b> each.',
      'The level is ' + ticks + ' mark' + (ticks === 1 ? '' : 's') + ' up: ' + lab + ' + ' + ticks + ' × ' + sc.minor + ' = <b>' + val + ' ml</b>.'];
  }
  function prompt1(){ return pick(['How much water is in the jug?', 'What amount does the jug show?', 'Read the jug. How much is in it?']); }
  function unitQ(){
    const useL = chance(0.5), t = useL ? pick(L_THINGS) : pick(ML_THINGS);
    const u = t[1] >= 1000 ? 'l' : 'ml', other = u === 'l' ? 'ml' : 'l';
    const NM = { ml: 'millilitres (ml)', l: 'litres (l)' };
    return mcq2({
      prompt: 'Which unit is best for how much ' + t[0] + ' holds?', visual: '',
      correct: opt(K.text(u), NM[u]),
      other: opt(K.text(other), NM[other], u === 'l' ? 'It holds a lot of liquid. In ml the number would be enormous — we use litres.' : 'It holds only a little. In litres the number would be tiny — we use millilitres.'),
      hint: 'A teaspoon holds about 5 ml. A big bottle of lemonade holds 2 litres. Is this bigger or smaller than a big bottle?',
      explain: ex('Millilitres or litres?', [cap(t[0]) + (u === 'l' ? ' holds a lot of liquid.' : ' holds only a little liquid.'), u === 'l' ? 'Big amounts are measured in litres.' : 'Small amounts are measured in millilitres.', 'The best unit is <b>' + NM[u] + '</b>. ✅']),
      truth: K.text(Math.floor(t[1] / 1000) > 0 ? 'l' : 'ml')
    });
  }

  registerSkill({
    id: 'measure-capacity', strand: 'measure', name: 'Capacity: millilitres and litres', emoji: '🥛', year: 3, order: 630, prereq: ['number-place-value'],
    lesson: {
      title: 'Reading measuring jugs',
      steps: [
        { say: 'A measuring jug shows how much liquid is inside. Look at the <b>top of the water</b> and see which line it touches. This jug has <b>300 ml</b> (300 millilitres).', vis: { kind: 'jug', args: [300, 500, { major: 100, minor: 100, unit: 'ml' }] } },
        { say: 'Sometimes the water is <b>between</b> two numbered lines. The little line half way is worth 50. The water is half way between 300 and 400, so it is <b>350 ml</b>.', vis: { kind: 'jug', args: [350, 500, { major: 100, minor: 50, unit: 'ml' }] } },
        { say: 'Big amounts use <b>litres</b>. <b>1 litre = 1000 ml</b>. This jug is full to 1000 ml, so it holds <b>1 litre</b>.', vis: { kind: 'jug', args: [1000, 1000, { major: 250, minor: 50, unit: 'ml' }] },
          quiz: { prompt: 'How many millilitres are in 1 litre?', options: [{ label: '1000 ml', ok: true }, { label: '100 ml', ok: false }, { label: '10 ml', ok: false }], right: 'Yes! 1 litre = 1000 ml. “Milli” means a thousandth.', wrong: '1 litre is 1000 ml.' } },
        { say: 'This jug is in <b>litres</b>. The water is half way between 1 and 2, so it holds <b>1½ litres</b>.', vis: { kind: 'jug', args: [1.5, 2, { major: 1, minor: 0.5, unit: 'l' }] } },
        { say: 'To find <b>how much more</b> is needed, count up from the water to the line you want. Water at 200 ml, want 500 ml: 500 − 200 = <b>300 ml</b> more.', vis: { kind: 'jug', args: [200, 500, { major: 100, minor: 100, unit: 'ml' }] },
          quiz: { prompt: 'The jug has 200 ml. How much more water fills it to 500 ml?', options: [{ label: '300 ml', ok: true }, { label: '200 ml', ok: false }, { label: '700 ml', ok: false }], right: 'Yes! 200 + 300 = 500, so 300 ml more.', wrong: 'Count up from 200 to 500: 200 → 300 → 400 → 500. That is 300 ml.' } }
      ]
    },
    trick: {
      title: 'Count up to the line',
      say: 'To find <b>how much more</b>, do not take away — <b>count up</b>. Start at the water line, jump to the next <b>100</b>, then jump to the line you want. Add your jumps.',
      vis: { kind: 'jug', args: [350, 500, { major: 100, minor: 50, unit: 'ml' }] },
      example: '350 ml → 400 ml is <b>50</b>, 400 ml → 500 ml is <b>100</b>. 50 + 100 = <b>150 ml</b> more'
    },
    gen: {
      1: function(){ return pick([t1Read, t1Read, t1Read, t1More, t1Compare, t1Unit])(); },
      2: function(){ return pick([t2Half, t2Q, t2Q, t2Hundreds, t2Litres, t2More, t2Diff, t2Unit])(); },
      3: function(){ return pick([t3Fine, t3Fine, t3Q, t3Pic, t3Pic, t3To1L, t3LitresToMl, t3Words])(); }
    }
  });

  /* ------------------------------ tier 1 ------------------------------ */
  function t1Read(){
    const sc = S1, val = randInt(1, 4) * 100, vis = jug(val, sc);
    return mcqNum({
      prompt: prompt1(), visual: vis, answer: val, fmt: mlTxt,
      wrong: [
        { v: val + 100, why: 'The water has not reached the ' + (val + 100) + ' line. Look at the TOP of the water.' },
        { v: val - 100, why: 'The water is higher than the ' + (val - 100) + ' line. It reaches ' + val + '.' },
        { v: val / 10, why: 'The line says ' + val + ' ml. Keep the zeros.' },
        { v: val + 50, why: 'There is no half-way line here. The water is right on ' + val + '.' }
      ],
      nearby: [200, -200, 300],
      valid: function(v){ return v > 0; },
      hint: 'Look at the top edge of the water. Which numbered line is it on? The unit is ml.',
      explain: ex('Reading the jug', ['Find the <b>top of the water</b>.', 'It touches the line numbered <b>' + val + '</b>.', 'The unit is ml, so the jug holds <b>' + val + ' ml</b>. ✅']),
      truth: val - 0, decode: function(){ return dj(vis, 50); }
    });
  }
  function t1More(){
    const sc = S1, target = 500, val = randInt(1, 4) * 100, d = target - val, nm = pick(NAMES), vis = jug(val, sc), liq = pick(LIQ);
    return mcqNum({
      prompt: nm + ' has ' + liq + ' in a jug. How much more is needed to fill the jug to 500 ml?', visual: vis, answer: d, fmt: mlTxt,
      wrong: [
        { v: val, why: 'That is how much is ALREADY in the jug. Find how much MORE is needed.' },
        { v: target + val, why: 'You added. To find how much more, count UP from the water to 500.' },
        { v: d + 100, why: 'Count the steps again: from the water line up to 500.' },
        { v: d - 100, why: 'Count the steps again: from the water line up to 500.' }
      ],
      nearby: [200, -200],
      valid: function(v){ return v > 0; },
      hint: 'Read the jug, then count up in 100s until you reach 500.',
      explain: ex('How much more?', ['The jug has <b>' + val + ' ml</b>.', 'Count up in 100s from ' + val + ' to 500: that is ' + (d / 100) + ' jump' + (d === 100 ? '' : 's') + ' of 100.', 'So <b>' + d + ' ml</b> more is needed. ✅']),
      truth: (target / 100 - val / 100) * 100, decode: function(){ return target - dj(vis, 50); }
    });
  }
  function t1Compare(){
    const sc = S1, a = randInt(1, 4) * 100; let b; do { b = randInt(1, 4) * 100; } while(b === a);
    const l = sample(LIQ, 2), va = jug(a, sc), vb = jug(b, sc);
    const vis = jugRow([{ label: 'Jug A: ' + l[0], svg: va }, { label: 'Jug B: ' + l[1], svg: vb }]);
    const more = a > b ? 'Jug A' : 'Jug B', less = a > b ? 'Jug B' : 'Jug A';
    return mcq2({
      prompt: 'Which jug holds MORE liquid, Jug A or Jug B?', visual: vis,
      correct: opt(K.text(more), more),
      other: opt(K.text(less), less, less + ' has ' + Math.min(a, b) + ' ml, which is less than ' + Math.max(a, b) + ' ml.'),
      hint: 'Read each jug in ml. The bigger number means more liquid.',
      explain: ex('Comparing jugs', ['Jug A has <b>' + a + ' ml</b>.', 'Jug B has <b>' + b + ' ml</b>.', Math.max(a, b) + ' is more than ' + Math.min(a, b) + ', so <b>' + more + '</b> holds more. ✅']),
      truth: K.text([['Jug A', a], ['Jug B', b]].sort(function(x, y){ return y[1] - x[1]; })[0][0]),
      decode: function(){ return K.text(dj(va, 50) > dj(vb, 50) ? 'Jug A' : 'Jug B'); }
    });
  }
  function t1Unit(){ return unitQ(); }

  /* ------------------------------ tier 2 ------------------------------ */
  function t2Half(){
    const sc = S_H, val = randInt(1, 9) * 50, vis = jug(val, sc), lab = Math.floor(val / 100) * 100, onLab = val % 100 === 0;
    return mcqNum({
      prompt: prompt1(), visual: vis, answer: val, fmt: mlTxt,
      wrong: [
        { v: onLab ? val + 50 : lab, why: onLab ? 'The water is exactly on ' + val + ', not half way past it.' : 'The water is above ' + lab + ' — it is on the little half-way line.' },
        { v: onLab ? val - 50 : lab + 100, why: onLab ? 'The water is exactly on ' + val + '.' : 'The water has not reached ' + (lab + 100) + ' yet. It is half way.' },
        { v: val + 100, why: 'Look again at the top of the water.' },
        { v: val - 100, why: 'Look again at the top of the water.' },
        { v: onLab ? val + 5 : lab + 5, why: 'The little line half way is worth 50, not 5.' }
      ],
      nearby: [150, -150],
      valid: function(v){ return v > 0 && v < 500; },
      hint: 'Find the last numbered line the water has passed. The little line half way is 50 more.',
      explain: ex('Reading to the half-way line', readSteps(val, sc).concat(['The jug holds <b>' + val + ' ml</b>. ✅'])),
      truth: val * 3 / 3, decode: function(){ return dj(vis, 50); }
    });
  }
  function t2Q(){
    const sc = S_Q; let val; do { val = randInt(1, 19) * 50; } while(val % 250 === 0 && chance(0.6));
    const vis = jug(val, sc), lab = Math.floor(val / 250) * 250, ticks = (val - lab) / 50;
    return mcqNum({
      prompt: prompt1(), visual: vis, answer: val, fmt: mlTxt,
      wrong: [
        { v: ticks > 0 ? lab + ticks * 10 : val + 10, why: 'Each little mark is 50 ml, not 10 ml. Count in 50s.' },
        { v: ticks > 0 ? lab : val + 50, why: ticks > 0 ? 'The water is above ' + lab + '. Count the little marks after it (50 ml each).' : 'The water is exactly on a numbered line.' },
        { v: ticks > 0 ? lab + ticks * 100 : val - 50, why: 'Each little mark is 50 ml, not 100 ml.' },
        { v: val + 50, why: 'Count the little marks again — one too many.' },
        { v: val - 50, why: 'Count the little marks again — one too few.' }
      ],
      nearby: [100, -100, 250],
      valid: function(v){ return v > 0 && v < 1000; },
      hint: 'The numbered lines go up in 250s. There are 5 little steps between them: share 250 between 5.',
      explain: ex('Reading the jug', ticks === 0 ? ['The water is exactly on the numbered line <b>' + val + ' ml</b>.', 'The jug holds <b>' + val + ' ml</b>. ✅'] : ['The water is above the numbered line <b>' + lab + '</b>.', 'Between ' + lab + ' and ' + (lab + 250) + ' there are 5 steps: 250 ÷ 5 = <b>50 ml</b> each.', ticks + ' mark' + (ticks === 1 ? '' : 's') + ' up: ' + lab + ' + ' + ticks + ' × 50 = <b>' + val + ' ml</b>. ✅']),
      truth: lab + ticks * 50, decode: function(){ return dj(vis, 50); }
    });
  }
  function t2Hundreds(){
    const sc = S_2, val = randInt(1, 9) * 100, vis = jug(val, sc), onLab = val % 200 === 0;
    return mcqNum({
      prompt: prompt1(), visual: vis, answer: val, fmt: mlTxt,
      wrong: [
        { v: onLab ? val + 100 : val - 100, why: onLab ? 'The water is on the numbered line ' + val + '.' : 'The numbers go up in 200s. The water is on the little line BETWEEN ' + (val - 100) + ' and ' + (val + 100) + '.' },
        { v: onLab ? val - 100 : val + 100, why: onLab ? 'The water is on the numbered line ' + val + '.' : 'The water is on the little line half way between the two numbered lines, so ' + val + ' ml.' },
        { v: val + 200, why: 'Look again at the top of the water.' },
        { v: val - 200, why: 'Look again at the top of the water.' },
        { v: val / 10, why: 'Keep the zeros: ' + val + ' ml.' }
      ],
      nearby: [300, -300, 50],
      valid: function(v){ return v > 0 && v < 1000; },
      hint: 'The numbers go up in 200s, but there is a little line half way. Each little step is worth 100.',
      explain: ex('Reading in 100s', onLab ? ['The water is exactly on the numbered line <b>' + val + '</b>.', 'The jug holds <b>' + val + ' ml</b>. ✅'] : ['The numbered lines are ' + (val - 100) + ' and ' + (val + 100) + '.', 'The water is on the little line half way between them: ' + (val - 100) + ' + 100.', 'The jug holds <b>' + val + ' ml</b>. ✅']),
      truth: (val / 100) * 100, decode: function(){ return dj(vis, 100); }
    });
  }
  function t2Litres(){
    const sc = S_L, val = pick([0.5, 1, 1.5]), vis = jug(val, sc);
    const f = Math.floor(val);
    const ws = [
      { v: val === 1 ? 2 : (val === 0.5 ? 1 : 2), why: 'The water has not reached that line.' },
      { v: val === 1 ? 0.5 : (val === 0.5 ? 0 : 1), why: 'Look at the top of the water again.' },
      { v: val === 1.5 ? 1 : val + 0.5, why: val === 1.5 ? 'The water is past 1 litre — half way to 2.' : 'The little line half way is worth ½ litre.' },
      { v: 1.5, why: 'Look again at the top of the water.' }, { v: 0.5, why: 'Look again at the top of the water.' }, { v: 2, why: 'Look again at the top of the water.' }, { v: 1, why: 'Look again at the top of the water.' }
    ].filter(function(w){ return w.v > 0; });
    return mcqNum({
      prompt: 'This jug is marked in litres. ' + prompt1(), visual: vis, answer: val, fmt: lTxt,
      wrong: ws, nearby: [0.5, -0.5, 1, -1],
      valid: function(v){ return v > 0 && v <= 2 && (v * 2) % 1 === 0; },
      hint: 'The numbered lines are whole litres. The little line half way between is ½ litre.',
      explain: ex('Reading litres', [val === 1 ? 'The water is exactly on the line <b>1</b>.' : (val === 0.5 ? 'The water is on the little line before 1: <b>half a litre</b>.' : 'The water is past <b>1</b> and on the little half-way line.'), 'The jug is marked in litres (l).', 'The jug holds <b>' + lTxt(val) + '</b>. ✅']),
      truth: val * 2 / 2, decode: function(){ return dj(vis, 0.5); }
    });
  }
  function t2More(){
    const sc = S_H, target = 500; let val; do { val = randInt(1, 8) * 50; } while(target - val < 50);
    const nm = pick(NAMES), vis = jug(val, sc), d = target - val, liq = pick(LIQ);
    return mcqNum({
      prompt: nm + ' wants 500 ml of ' + liq + '. How much more must ' + nm + ' pour in?', visual: vis, answer: d, fmt: mlTxt,
      wrong: [
        { v: val, why: 'That is how much is already in the jug. Find how much MORE.' },
        { v: target + val, why: 'You added. Count UP from the water to 500.' },
        { v: d + 50, why: 'Check your counting up: ' + val + ' to 500.' },
        { v: d - 50, why: 'Check your counting up: ' + val + ' to 500.' }
      ],
      nearby: [100, -100],
      valid: function(v){ return v > 0; },
      hint: 'Read the jug. Then count up from the water level to 500: first to the next 100, then on to 500.',
      explain: ex('How much more?', ['The jug has <b>' + val + ' ml</b>.', val % 100 === 0 ? 'Count up from ' + val + ' to 500: ' + d + ' ml.' : 'Count up: ' + val + ' → ' + (val + 50) + ' is 50, then ' + (val + 50) + ' → 500 is ' + (target - val - 50) + '.', '500 − ' + val + ' = <b>' + d + ' ml</b> more. ✅']),
      truth: (target + 500) - (val + 500), decode: function(){ return target - dj(vis, 50); }
    });
  }
  function t2Diff(){
    const sc = S_H; let a, b; do { a = randInt(3, 9) * 50; b = randInt(1, 7) * 50; } while(a - b < 50);
    const l = sample(LIQ, 2), va = jug(a, sc), vb = jug(b, sc);
    const vis = jugRow([{ label: 'Jug A: ' + l[0], svg: va }, { label: 'Jug B: ' + l[1], svg: vb }]);
    const d = a - b;
    return mcqNum({
      prompt: 'How many ml more is in Jug A than in Jug B?', visual: vis, answer: d, fmt: mlTxt,
      wrong: [
        { v: a + b, why: '"How many more" means find the DIFFERENCE. Take away, do not add.' },
        { v: a, why: 'That is how much is in Jug A. Take Jug B\'s amount away.' },
        { v: d + 50, why: 'Check your take-away: ' + a + ' − ' + b + '.' },
        { v: d - 50, why: 'Check your take-away: ' + a + ' − ' + b + '.' }
      ],
      nearby: [100, -100],
      valid: function(v){ return v > 0; },
      hint: 'Read both jugs in ml, then take the smaller number away from the bigger one.',
      explain: ex('How many more?', ['Jug A has <b>' + a + ' ml</b>. Jug B has <b>' + b + ' ml</b>.', 'Difference: ' + a + ' − ' + b + '.', 'Jug A has <b>' + d + ' ml</b> more. ✅']),
      truth: (a + 100) - (b + 100), decode: function(){ return dj(va, 50) - dj(vb, 50); }
    });
  }
  function t2Unit(){ return unitQ(); }

  /* ------------------------------ tier 3 ------------------------------ */
  function t3Fine(){
    const sc = S_F; let val; do { val = randInt(6, 24) * 20; } while(val % 100 === 0 || val > 480);
    const vis = jug(val, sc), lab = Math.floor(val / 100) * 100, ticks = (val - lab) / 20;
    return numeric({
      prompt: 'The jug is marked in millilitres. How many millilitres of water are in it?', visual: vis, answer: val, unit: 'ml',
      hint: 'Count the little steps between two numbered lines. Share 100 between them to find what one little step is worth.',
      explain: ex('Between the lines', ['The water is above the numbered line <b>' + lab + '</b>.', 'Between ' + lab + ' and ' + (lab + 100) + ' there are 5 little steps: 100 ÷ 5 = <b>20 ml</b> each.', ticks + ' mark' + (ticks === 1 ? '' : 's') + ' up: ' + lab + ' + ' + ticks + ' × 20 = <b>' + val + ' ml</b>. ✅']),
      truth: lab + ticks * 20, decode: function(){ return dj(vis, 20); },
      wrong: function(v){ return v === lab ? 'That is the last numbered line. Count the little marks after it (20 ml each).' : v === lab + ticks * 10 ? 'Each little mark is 20 ml, not 10 ml.' : v === lab + ticks * 5 ? 'Each little mark is 20 ml, not 5 ml.' : ''; }
    });
  }
  function t3Q(){
    const sc = S_Q; let val; do { val = randInt(1, 19) * 50; } while(val % 250 === 0);
    const vis = jug(val, sc), lab = Math.floor(val / 250) * 250, ticks = (val - lab) / 50;
    return numeric({
      prompt: 'How many millilitres are in the jug?', visual: vis, answer: val, unit: 'ml',
      hint: 'The numbered lines go up in 250s with 5 steps between. What is one little step worth?',
      explain: ex('Between the lines', ['The water is above the numbered line <b>' + lab + '</b>.', 'Between ' + lab + ' and ' + (lab + 250) + ' there are 5 steps: 250 ÷ 5 = <b>50 ml</b> each.', ticks + ' mark' + (ticks === 1 ? '' : 's') + ' up: ' + lab + ' + ' + ticks + ' × 50 = <b>' + val + ' ml</b>. ✅']),
      truth: lab + ticks * 50, decode: function(){ return dj(vis, 50); },
      wrong: function(v){ return v === lab ? 'That is the last numbered line. Count the little marks after it.' : v === lab + ticks * 10 ? 'Each little mark is 50 ml, not 10 ml.' : ''; }
    });
  }
  function t3Pic(){
    const sc = S_Q, small = true; let val; do { val = randInt(1, 19) * 50; } while(val % 250 === 0);
    const lab = Math.floor(val / 250) * 250, ticks = (val - lab) / 50;
    const cands = [lab + ticks * 10, lab + (ticks > 0 ? ticks - 1 : 0) * 50, val + 50, val - 50, lab + 250, lab, val + 100, val - 100, val + 200, val - 200]
      .filter(function(v){ return v > 0 && v < 1000 && v !== val && v % 50 === 0; });
    const ds = cands.map(function(v){ return opt(K.num(v), jug(v, sc, small), 'That jug shows ' + v + ' ml, not ' + val + ' ml.'); });
    const q = mcq({
      prompt: 'Which jug has ' + val + ' ml of water in it?', visual: '',
      correct: opt(K.num(val), jug(val, sc, small)), distractors: ds, count: 3,
      hint: 'Work out where ' + val + ' ml sits: after the ' + lab + ' line, count on the little steps of 50.',
      explain: ex('Finding ' + val + ' ml', [val + ' ml is ' + lab + ' + ' + ticks + ' × 50 (each little step is 50 ml).', 'So the water must be ' + ticks + ' mark' + (ticks === 1 ? '' : 's') + ' above the ' + lab + ' line.', 'Only one jug matches: <b>' + val + ' ml</b>. ✅']),
      truth: K.num(lab + ticks * 50)
    });
    q.optionsAreVisual = true;
    q.decodeKey = function(){ for(let i = 0; i < q.options.length; i++) if(K.num(dj(q.options[i].label, 50)) !== q.options[i].key) return 'option ' + i + ' picture does not match its key'; return q.options[q.correct].key; };
    return q;
  }
  function t3To1L(){
    const sc = S_Q; let val; do { val = randInt(2, 17) * 50; } while(val === 500 && chance(0.5));
    const nm = pick(NAMES), vis = jug(val, sc), d = 1000 - val;
    return numeric({
      prompt: nm + ' needs 1 litre of ' + pick(LIQ) + '. How many more millilitres must ' + nm + ' pour into the jug?', visual: vis, answer: d, unit: 'ml',
      hint: '1 litre = 1000 ml. Read the jug first, then count up to 1000.',
      explain: ex('Filling to 1 litre', ['The jug has <b>' + val + ' ml</b>.', '1 litre = 1000 ml. Count up: ' + val + ' → ' + (Math.ceil(val / 100) * 100) + ' (' + (Math.ceil(val / 100) * 100 - val) + ' ml) → 1000 (' + (1000 - Math.ceil(val / 100) * 100) + ' ml).', 'Total needed: 1000 − ' + val + ' = <b>' + d + ' ml</b>. ✅']),
      truth: (1000 - 50) - (val - 50), decode: function(){ return 1000 - dj(vis, 50); },
      wrong: function(v){ return v === val ? 'That is how much is already in the jug. Find how much MORE is needed.' : v === 1 - val / 1000 ? 'Use millilitres: 1 litre = 1000 ml.' : ''; }
    });
  }
  function t3LitresToMl(){
    const sc = S_L, val = pick([0.5, 1, 1.5]), vis = jug(val, sc), ml = val * 1000;
    return numeric({
      prompt: 'The jug is marked in litres. How many millilitres are in the jug?', visual: vis, answer: ml, unit: 'ml',
      hint: 'First read the litres. Then use 1 litre = 1000 ml (½ litre = 500 ml).',
      explain: ex('Litres to millilitres', ['The jug holds <b>' + lTxt(val) + '</b>.', '1 litre = 1000 ml' + (Number.isInteger(val) ? '.' : ', and ½ litre = 500 ml.'), Number.isInteger(val) ? val + ' × 1000 = <b>' + ml + ' ml</b>. ✅' : (Math.floor(val) ? Math.floor(val) * 1000 + ' + 500 = ' : '') + '<b>' + ml + ' ml</b>. ✅']),
      truth: val * 10 * 100, decode: function(){ return dj(vis, 0.5) * 1000; },
      wrong: function(v){ return v === val * 100 ? '1 litre is 1000 ml, not 100 ml.' : ''; }
    });
  }
  function t3Words(){
    const nm = pick(NAMES), liq = pick(LIQ), form = randInt(0, 2);
    if(form === 0){
      const n = randInt(2, 4), a = pick([150, 200, 250]), tot = n * a;
      return numeric({
        prompt: nm + ' has a 1 litre bottle of ' + liq + ' and fills ' + n + ' cups with ' + a + ' ml in each. How many ml are left in the bottle?', answer: 1000 - tot, unit: 'ml',
        hint: 'Step 1: how much was poured out in total? Step 2: take it from 1000 ml.',
        explain: ex('Two steps', ['Poured out: ' + n + ' × ' + a + ' = <b>' + tot + ' ml</b>.', '1 litre = 1000 ml.', '1000 − ' + tot + ' = <b>' + (1000 - tot) + ' ml</b> left. ✅']),
        truth: 1000 - Array(n).fill(a).reduce(function(x, y){ return x + y; }, 0)
      });
    }
    if(form === 1){
      const a = pick([200, 250, 125, 100, 500]);
      return numeric({
        prompt: nm + ' fills glasses from a 1 litre jug. Each glass holds ' + a + ' ml. How many glasses can ' + nm + ' fill?', answer: 1000 / a, unit: 'glasses',
        hint: '1 litre = 1000 ml. How many lots of ' + a + ' fit into 1000?',
        explain: ex('How many glasses?', ['1 litre = <b>1000 ml</b>.', 'Count in ' + a + 's up to 1000: ' + Array(1000 / a).fill(0).map(function(_, i){ return a * (i + 1); }).join(', ') + '.', 'That is <b>' + (1000 / a) + '</b> glasses. ✅']),
        truth: 10 * 100 / a
      });
    }
    const a = pick([250, 300, 350, 400, 450]), b = pick([150, 200, 250, 300, 350]);
    return numeric({
      prompt: nm + ' pours ' + a + ' ml of ' + liq + ' and ' + b + ' ml of water into a jug. How many ml are in the jug now?', answer: a + b, unit: 'ml',
      hint: 'Add the two amounts together.',
      explain: ex('Adding amounts', ['First: <b>' + a + ' ml</b>. Second: <b>' + b + ' ml</b>.', a + ' + ' + b + ' = ?', 'The jug has <b>' + (a + b) + ' ml</b>. ✅']),
      truth: (a + 50) + (b - 50)
    });
  }
})();
