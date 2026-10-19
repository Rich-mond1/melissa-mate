/* MEASURE — mass: read kitchen-scale dials in g and kg (between-the-marks values), compare, choose g or kg.
   Every dial question decodes the NEEDLE angle from the drawing. */
(function(){
  const NAMES = ['Ana', 'Marcus', 'Sophie', 'Ivan', 'Lucy', 'Diego', 'Ellen', 'Tom', 'Aisha', 'Kai', 'Mei', 'Leo'];
  const FOODS = ['apples', 'flour', 'sugar', 'raisins', 'oats', 'rice', 'butter', 'potatoes', 'carrots', 'pasta', 'pears', 'cheese'];
  const GRAM_THINGS = [['a paper clip', 1], ['a feather', 2], ['a pencil', 8], ['a slice of bread', 40], ['an egg', 60], ['a chocolate bar', 100], ['an apple', 150], ['a mobile phone', 170], ['a tennis ball', 58]];
  const KG_THINGS = [['a bag of potatoes', 2500], ['a watermelon', 3000], ['a cat', 4000], ['a bag of rice', 5000], ['a school bag full of books', 6000], ['a big pumpkin', 8000], ['a bicycle', 12000], ['a suitcase', 15000], ['a washing machine', 70000]];
  function gTxt(v){ return v + ' g'; }
  function kgTxt(v){ return Number.isInteger(v) ? v + ' kg' : (v < 1 ? '' : Math.floor(v)) + '½ kg'; }
  function cap(s){ return s.charAt(0).toUpperCase() + s.slice(1); }
  function dv(html, step){ return Math.round(V.decodeDial(html) / step) * step; }   // needle angle -> value, snapped to the scale step
  function rd(v){ return Math.round(v * 1000) / 1000; }
  function dial(val, sc){ return V.dial(val, sc.max, { major: sc.major, minor: sc.minor, unit: sc.unit }); }

  const S_T1 = { max: 500, major: 100, minor: 100, unit: 'g' };
  const S_HALF = { max: 500, major: 100, minor: 50, unit: 'g' };
  const S_K = { max: 1000, major: 250, minor: 50, unit: 'g' };
  const S_FINE = { max: 500, major: 100, minor: 10, unit: 'g' };
  const S_KG = { max: 5, major: 1, minor: 0.5, unit: 'kg' };

  // how to read between labelled numbers, as explanation lines
  function readSteps(val, sc){
    const lab = Math.floor(val / sc.major + 1e-9) * sc.major, ticks = Math.round((val - lab) / sc.minor), gaps = Math.round(sc.major / sc.minor);
    const out = [];
    if(ticks === 0){ out.push('The needle points exactly at the labelled number <b>' + lab + '</b>.'); return out; }
    out.push('The needle is just after the labelled number <b>' + lab + '</b>.');
    out.push('Between ' + lab + ' and ' + (lab + sc.major) + ' there are ' + gaps + ' little steps, so each little mark is ' + sc.major + ' ÷ ' + gaps + ' = <b>' + sc.minor + ' g</b>.');
    out.push('The needle is ' + ticks + ' mark' + (ticks === 1 ? '' : 's') + ' further: ' + lab + ' + ' + ticks + ' × ' + sc.minor + ' = <b>' + val + ' g</b>.');
    return out;
  }

  registerSkill({
    id: 'measure-mass', strand: 'measure', name: 'Mass: grams and kilograms', emoji: '⚖️', year: 3, order: 620, prereq: ['number-place-value'],
    lesson: {
      title: 'Reading the kitchen scales',
      steps: [
        { say: 'Kitchen scales have a <b>needle</b>. It points to a number. This needle points to <b>300</b>, and the dial says <b>g</b>. So the mass is <b>300 g</b> (300 grams).', vis: { kind: 'dial', args: [300, 500, { major: 100, minor: 100, unit: 'g' }] } },
        { say: 'Sometimes the needle stops on a <b>little mark</b>. Here, each little mark is <b>50 g</b>. The needle is half way between 300 and 400, so it shows <b>350 g</b>.', vis: { kind: 'dial', args: [350, 500, { major: 100, minor: 50, unit: 'g' }] } },
        { say: 'Heavy things use <b>kilograms</b> (kg). <b>1 kg = 1000 g</b>. The needle at 500 g is <b>half a kilogram</b>.', vis: { kind: 'dial', args: [500, 1000, { major: 250, minor: 50, unit: 'g' }] },
          quiz: { prompt: 'How many grams make 1 kilogram?', options: [{ label: '1000 g', ok: true }, { label: '100 g', ok: false }, { label: '10 g', ok: false }], right: 'Yes! “Kilo” means a thousand, so 1 kg = 1000 g.', wrong: 'Kilo means a THOUSAND. 1 kg = 1000 g.' } },
        { say: 'This scale is in <b>kg</b>. The needle is half way between 2 and 3, so it shows <b>2½ kg</b>, or 2 kg and a half.', vis: { kind: 'dial', args: [2.5, 5, { major: 1, minor: 0.5, unit: 'kg' }] },
          quiz: { prompt: 'What does the scale show?', options: [{ label: '2½ kg', ok: true }, { label: '3 kg', ok: false }, { label: '2 kg', ok: false }], right: 'Yes! Half way between 2 and 3 is 2½ kg.', wrong: 'The needle is half way between 2 and 3, so it is 2½ kg.' } }
      ]
    },
    trick: {
      title: 'What is one little mark worth?',
      say: 'Before you read the needle, find what <b>one little mark</b> is worth. Look at two labelled numbers, count the little steps between them, and share: the gap ÷ the steps. Then start at the last label and count on.',
      vis: { kind: 'dial', args: [270, 500, { major: 100, minor: 10, unit: 'g' }] },
      example: '200 to 300 has 10 steps → each mark is <b>10 g</b>. Needle 7 marks after 200: 200 + 70 = <b>270 g</b>'
    },
    gen: {
      1: function(){ return pick([t1Read, t1Read, t1Read, t1Heavier, t1Unit])(); },
      2: function(){ return pick([t2Half, t2Half, t2K, t2K, t2Kg, t2Diff, t2Unit])(); },
      3: function(){ return pick([t3Fine, t3Fine, t3K, t3More, t3KgToG, t3Words])(); }
    }
  });

  function scenePrompt(){ return pick(['What mass do the kitchen scales show?', 'How heavy is the food on the scales?', 'What does the needle show?']); }
  function unitQ(tier){
    const useKg = chance(0.5);
    const t = useKg ? pick(KG_THINGS) : pick(GRAM_THINGS);
    const u = t[1] >= 1000 ? 'kg' : 'g', other = u === 'kg' ? 'g' : 'kg';
    const NM = { g: 'grams (g)', kg: 'kilograms (kg)' };
    return mcq2({
      prompt: 'Which unit is best for the mass of ' + t[0] + '?', visual: '',
      correct: opt(K.text(u), NM[u]),
      other: opt(K.text(other), NM[other], u === 'kg' ? 'It is heavy — in grams the number would be huge. Heavy things use kilograms.' : 'It is light — in kilograms the number would be tiny. Light things use grams.'),
      hint: 'A paper clip is about 1 g. A bag of sugar is 1 kg. Is this thing lighter or heavier than a bag of sugar?',
      explain: ex('Grams or kilograms?', [cap(t[0]) + (u === 'kg' ? ' is heavier than a bag of sugar (1 kg).' : ' is much lighter than a bag of sugar (1 kg).'), u === 'kg' ? 'Heavy things are measured in kilograms.' : 'Light things are measured in grams.', 'The best unit is <b>' + NM[u] + '</b>. ✅']),
      truth: K.text(Math.floor(t[1] / 1000) > 0 ? 'kg' : 'g')
    });
  }

  /* ------------------------------ tier 1 ------------------------------ */
  function t1Read(){
    const sc = S_T1, val = randInt(1, 4) * 100, food = pick(FOODS);
    const vis = dial(val, sc);
    return mcqNum({
      prompt: scenePrompt(), visual: vis, answer: val, fmt: gTxt,
      wrong: [
        { v: val + 100, why: 'The needle has not reached ' + (val + 100) + ' yet. It points at ' + val + '.' },
        { v: val - 100, why: 'The needle has gone past ' + (val - 100) + '. It points at ' + val + '.' },
        { v: val / 10, why: 'The dial reads ' + val + ' g. Do not drop the zeros.' },
        { v: val + 50, why: 'There is no half-way mark here. The needle is right on ' + val + '.' }
      ],
      nearby: [200, -200, 300],
      valid: function(v){ return v > 0; },
      hint: 'Follow the needle to the closest number printed on the dial. The dial says g, for grams.',
      explain: ex('Reading the dial', ['Look at where the red needle points.', 'It points exactly at <b>' + val + '</b>.', 'The dial says g, so the mass is <b>' + val + ' g</b>. ✅']),
      truth: val - 0, decode: function(){ return dv(vis, 50); }
    });
  }
  function t1Heavier(){
    const sc = S_T1;
    const a = randInt(1, 4) * 100; let b; do { b = randInt(1, 4) * 100; } while(b === a);
    const o = [['apples', '🍎'], ['pears', '🍐'], ['carrots', '🥕'], ['oranges', '🍊'], ['potatoes', '🥔'], ['lemons', '🍋']]; const p = sample(o, 2);
    const va = dial(a, sc), vb = dial(b, sc);
    const vis = '<div style="display:flex;flex-wrap:wrap;justify-content:center;gap:6px"><div style="text-align:center;font-weight:800;width:170px">' + p[0][1] + ' A: ' + p[0][0] + '<div style="width:170px">' + va + '</div></div><div style="text-align:center;font-weight:800;width:170px">' + p[1][1] + ' B: ' + p[1][0] + '<div style="width:170px">' + vb + '</div></div></div>';
    const heavier = a > b ? p[0][0] : p[1][0], lighter = a > b ? p[1][0] : p[0][0];
    return mcq2({
      prompt: 'Which is heavier, the ' + p[0][0] + ' (A) or the ' + p[1][0] + ' (B)?', visual: vis,
      correct: opt(K.text(heavier), 'The ' + heavier),
      other: opt(K.text(lighter), 'The ' + lighter, 'Read both dials: the ' + lighter + ' show ' + Math.min(a, b) + ' g, which is less than ' + Math.max(a, b) + ' g.'),
      hint: 'Read each needle in grams. The bigger number means heavier.',
      explain: ex('Which is heavier?', ['The ' + p[0][0] + ' show <b>' + a + ' g</b>.', 'The ' + p[1][0] + ' show <b>' + b + ' g</b>.', Math.max(a, b) + ' g is more than ' + Math.min(a, b) + ' g, so <b>The ' + heavier + '</b> is heavier. ✅']),
      truth: K.text([[a, p[0][0]], [b, p[1][0]]].sort(function(x, y){ return y[0] - x[0]; })[0][1]),
      decode: function(){ return K.text(dv(va, 50) > dv(vb, 50) ? p[0][0] : p[1][0]); }
    });
  }
  function t1Unit(){ return unitQ(1); }

  /* ------------------------------ tier 2 ------------------------------ */
  function t2Half(){
    const sc = S_HALF, val = randInt(1, 9) * 50;
    const vis = dial(val, sc), lab = Math.floor(val / 100) * 100;
    return mcqNum({
      prompt: scenePrompt(), visual: vis, answer: val, fmt: gTxt,
      wrong: [
        { v: val % 100 === 50 ? lab : val + 50, why: val % 100 === 50 ? 'The needle is on the little half-way mark AFTER ' + lab + ', not on ' + lab + '.' : 'Check the number the needle points to.' },
        { v: val % 100 === 50 ? lab + 100 : val - 50, why: val % 100 === 50 ? 'The needle has not reached ' + (lab + 100) + ' yet. It is half way.' : 'Check the number the needle points to.' },
        { v: val + 100, why: 'Look again: the needle is not that far round.' },
        { v: val - 100, why: 'Look again: the needle has gone further than that.' },
        { v: val % 100 === 50 ? lab + 5 : val + 5, why: 'The little mark between two labels is worth 50 g, not 5 g.' }
      ],
      nearby: [150, -150, 200],
      valid: function(v){ return v > 0; },
      hint: 'Find the last number the needle has passed. If it is on the little mark half way to the next number, add 50 g.',
      explain: ex('Reading to the half-way mark', readSteps(val, sc).concat(['The scale shows <b>' + val + ' g</b>. ✅'])),
      truth: (val / 50) * 50, decode: function(){ return dv(vis, 50); }
    });
  }
  function t2K(){
    const sc = S_K; let val; do { val = randInt(1, 19) * 50; } while(val % 250 === 0 && chance(0.5));
    const vis = dial(val, sc), lab = Math.floor(val / 250) * 250, ticks = (val - lab) / 50;
    const ws = [
      { v: ticks > 0 ? lab + ticks * 10 : val + 10, why: 'Each little mark is 50 g, not 10 g. Count in 50s from ' + lab + '.' },
      { v: ticks > 0 ? lab : val + 50, why: ticks > 0 ? 'The needle has passed ' + lab + '. Count on the little marks (50 g each).' : 'The needle is right on a label.' },
      { v: ticks > 0 ? lab + ticks * 100 : val - 50, why: 'Each little mark is 50 g, not 100 g.' },
      { v: val + 50, why: 'Count the little marks again — one too many.' },
      { v: val - 50, why: 'Count the little marks again — one too few.' }
    ];
    return mcqNum({
      prompt: scenePrompt(), visual: vis, answer: val, fmt: gTxt,
      wrong: ws, nearby: [100, -100, 250, -250],
      valid: function(v){ return v > 0 && v < 1000; },
      hint: 'The labels go up in 250s. Count the little steps between two labels and share 250 between them.',
      explain: ex('Reading the dial', readSteps(val, sc).slice(0, 1).concat(ticks === 0 ? [] : ['Between ' + lab + ' and ' + (lab + 250) + ' there are 5 little steps, so each mark is 250 ÷ 5 = <b>50 g</b>.', 'The needle is ' + ticks + ' mark' + (ticks === 1 ? '' : 's') + ' further: ' + lab + ' + ' + ticks + ' × 50 = <b>' + val + ' g</b>.']).concat(['The scale shows <b>' + val + ' g</b>. ✅'])),
      truth: lab + ticks * 50, decode: function(){ return dv(vis, 50); }
    });
  }
  function t2Kg(){
    const sc = S_KG, val = randInt(1, 9) / 2, vis = dial(val, sc), f = Math.floor(val);
    const ws = Number.isInteger(val) ? [
      { v: val + 0.5, why: 'The needle is exactly on ' + val + ', not half way past it.' },
      { v: val - 0.5, why: 'The needle is exactly on ' + val + '.' },
      { v: val + 1, why: 'The needle has not reached ' + (val + 1) + ' yet.' },
      { v: val - 1, why: 'The needle is past ' + (val - 1) + '.' }
    ] : [
      { v: f, why: 'The needle is past the ' + f + ' — it is half way to ' + (f + 1) + '.' },
      { v: f + 1, why: 'The needle has not reached ' + (f + 1) + '. It is half way.' },
      { v: val + 1, why: 'Look again at where the needle stops.' },
      { v: val - 1, why: 'Look again at where the needle stops.' }
    ];
    return mcqNum({
      prompt: 'This scale is in kilograms. ' + scenePrompt(), visual: vis, answer: val, fmt: kgTxt,
      wrong: ws, nearby: [1.5, -1.5, 2, 0.5, -0.5],
      valid: function(v){ return v > 0 && v < 5 && (v * 2) % 1 === 0; },
      hint: 'The long marks have numbers (kg). The little mark half way between two numbers is half a kilogram.',
      explain: ex('Reading kilograms', [Number.isInteger(val) ? 'The needle points exactly at <b>' + val + '</b>.' : 'The needle has passed <b>' + f + '</b> and stops at the little half-way mark.', 'The dial says kg.', 'The scale shows <b>' + kgTxt(val) + '</b>. ✅']),
      truth: (val * 2) / 2, decode: function(){ return dv(vis, 0.5); }
    });
  }
  function t2Diff(){
    const sc = S_HALF; let a, b, p;
    // realistic masses (g, in 50s): [name, emoji, lowest, highest]
    const FR = [['lemon', '🍋', 50, 100], ['banana', '🍌', 100, 200], ['apple', '🍎', 100, 200], ['orange', '🍊', 150, 250], ['pear', '🍐', 150, 250], ['avocado', '🥑', 150, 250], ['potato', '🥔', 150, 300], ['coconut', '🥥', 350, 450], ['small cabbage', '🥬', 350, 450]];
    do {
      p = sample(FR, 2);
      a = randInt(p[0][2] / 50, p[0][3] / 50) * 50; b = randInt(p[1][2] / 50, p[1][3] / 50) * 50;
    } while(a - b < 50);
    const va = dial(a, sc), vb = dial(b, sc);
    const vis = '<div style="display:flex;flex-wrap:wrap;justify-content:center;gap:6px"><div style="text-align:center;font-weight:800;width:170px">' + p[0][1] + ' ' + p[0][0] + '<div style="width:170px">' + va + '</div></div><div style="text-align:center;font-weight:800;width:170px">' + p[1][1] + ' ' + p[1][0] + '<div style="width:170px">' + vb + '</div></div></div>';
    const d = a - b;
    return mcqNum({
      prompt: 'How many grams heavier is the ' + p[0][0] + ' than the ' + p[1][0] + '?', visual: vis, answer: d, fmt: gTxt,
      wrong: [
        { v: a + b, why: '"How much heavier" means find the DIFFERENCE. Take away, do not add.' },
        { v: a, why: 'That is the mass of the ' + p[0][0] + '. Take the other mass away.' },
        { v: d + 50, why: 'Check your take-away: ' + a + ' − ' + b + '.' },
        { v: d - 50, why: 'Check your take-away: ' + a + ' − ' + b + '.' }
      ],
      nearby: [100, -100, 150, -150, 200, 250, 300],
      valid: function(v){ return v > 0; },
      hint: 'Read both scales in grams, then take the smaller number from the bigger one.',
      explain: ex('How much heavier?', ['The ' + p[0][0] + ' is <b>' + a + ' g</b>. The ' + p[1][0] + ' is <b>' + b + ' g</b>.', 'Difference: ' + a + ' − ' + b + '.', 'The ' + p[0][0] + ' is <b>' + d + ' g</b> heavier. ✅']),
      truth: (a - 100) - (b - 100), decode: function(){ return dv(va, 50) - dv(vb, 50); }
    });
  }
  function t2Unit(){ return unitQ(2); }

  /* ------------------------------ tier 3 ------------------------------ */
  function t3Fine(){
    const sc = S_FINE; let val; do { val = randInt(11, 49) * 10; } while(val % 50 === 0);
    const vis = dial(val, sc), lab = Math.floor(val / 100) * 100, ticks = (val - lab) / 10;
    return numeric({
      prompt: 'The scale is in grams. How many grams does it show?', visual: vis, answer: val, unit: 'g',
      hint: 'Each little mark is 10 g. Start at the last labelled number the needle passed, then count the little marks.',
      explain: ex('Between the labels', readSteps(val, sc).concat(['The scale shows <b>' + val + ' g</b>. ✅'])),
      truth: lab + ticks * 10, decode: function(){ return dv(vis, 10); },
      wrong: function(v){ return v === lab ? 'That is the last labelled number. The needle is ' + ticks + ' little marks further.' : v === lab + 100 ? 'The needle has not reached ' + (lab + 100) + ' yet.' : v === lab + ticks ? 'Each little mark is 10 g, not 1 g.' : v === lab + ticks * 5 ? 'Each little mark is 10 g, not 5 g.' : ''; }
    });
  }
  function t3K(){
    const sc = S_K; let val; do { val = randInt(1, 19) * 50; } while(val % 250 === 0);
    const vis = dial(val, sc), lab = Math.floor(val / 250) * 250, ticks = (val - lab) / 50;
    return numeric({
      prompt: 'How many grams does the scale show?', visual: vis, answer: val, unit: 'g',
      hint: 'Labels go up in 250s, with 5 little steps between them. Work out what one little step is worth.',
      explain: ex('Between the labels', ['The needle has passed the label <b>' + lab + '</b>.', 'Between ' + lab + ' and ' + (lab + 250) + ' there are 5 little steps, so each mark is 250 ÷ 5 = <b>50 g</b>.', 'The needle is ' + ticks + ' mark' + (ticks === 1 ? '' : 's') + ' further: ' + lab + ' + ' + ticks + ' × 50 = <b>' + val + ' g</b>. ✅']),
      truth: lab + ticks * 50, decode: function(){ return dv(vis, 50); },
      wrong: function(v){ return v === lab ? 'That is the last label. Count the little marks after it (50 g each).' : v === lab + ticks * 10 ? 'Each little mark is 50 g, not 10 g.' : v === lab + ticks * 100 ? 'Each little mark is 50 g, not 100 g.' : ''; }
    });
  }
  function t3More(){
    const sc = S_K, target = pick([500, 1000, 1000]); let val; do { val = randInt(2, 19) * 50; } while(val >= target || target - val < 100);
    const nm = pick(NAMES), food = pick(FOODS);
    const vis = dial(val, sc), d = target - val;
    return numeric({
      prompt: nm + ' needs ' + target + ' g of ' + food + ' (' + (target === 1000 ? '1 kg' : 'half a kilogram') + '). How many more grams does ' + nm + ' need to add?', visual: vis, answer: d, unit: 'g',
      hint: 'First read the scale. Then count on (or take away) to reach ' + target + ' g.',
      explain: ex('How many more?', ['The scale shows <b>' + val + ' g</b>.', 'Needed: ' + target + ' g. So ' + target + ' − ' + val + '.', (val % 100 === 0 ? 'Count on from ' + val + ' to ' + target + ': that is ' + d + ' g.' : 'Count on: ' + val + ' → ' + Math.ceil(val / 100) * 100 + ' (' + (Math.ceil(val / 100) * 100 - val) + ' g) → ' + target + ' (' + (target - Math.ceil(val / 100) * 100) + ' g).') + ' You need <b>' + d + ' g</b> more. ✅']),
      truth: (target - 50) - (val - 50), decode: function(){ return target - dv(vis, 50); },
      wrong: function(v){ return v === val ? 'That is how much is ALREADY on the scale. Find how much more is needed.' : ''; }
    });
  }
  function t3KgToG(){
    const sc = S_KG, val = randInt(1, 9) / 2, vis = dial(val, sc), g = val * 1000;
    return numeric({
      prompt: 'The scale shows kilograms. How many grams is that?', visual: vis, answer: g, unit: 'g',
      hint: 'First read the kilograms. Then remember 1 kg = 1000 g.',
      explain: ex('Kilograms to grams', ['The needle shows <b>' + kgTxt(val) + '</b>.', '1 kg = 1000 g' + (Number.isInteger(val) ? '.' : ', and ½ kg = 500 g.'), Number.isInteger(val) ? val + ' × 1000 = <b>' + g + ' g</b>. ✅' : val < 1 ? 'Half of 1000 g is 500 g, so ½ kg = <b>' + g + ' g</b>. ✅' : Math.floor(val) + ' kg = ' + Math.floor(val) * 1000 + ' g, plus 500 g = <b>' + g + ' g</b>. ✅']),
      truth: val * 10 * 100, decode: function(){ return dv(vis, 0.5) * 1000; },
      wrong: function(v){ return v === val * 100 ? '1 kg is 1000 g, not 100 g.' : v === val ? 'That is the kilograms. Multiply by 1000 to get grams.' : ''; }
    });
  }
  function t3Words(){
    const nm = pick(NAMES), food = pick(FOODS), form = randInt(0, 2);
    if(form === 0){
      const a = pick([150, 200, 250, 300, 350, 400, 450, 600, 650, 750]);
      return numeric({
        prompt: nm + ' has a 1 kg bag of ' + food + '. ' + nm + ' uses ' + a + ' g. How many grams are left?', answer: 1000 - a, unit: 'g',
        hint: '1 kg is 1000 g. Take away the amount used.',
        explain: ex('How much is left?', ['1 kg = <b>1000 g</b>.', '1000 − ' + a + ' = ?', 'There are <b>' + (1000 - a) + ' g</b> left. ✅']),
        truth: 1000 - a, wrong: function(v){ return v === 1 - a ? 'Change the 1 kg into grams first (1000 g).' : ''; }
      });
    }
    if(form === 1){
      const n = randInt(3, 6), a = pick([150, 200, 250, 300, 125]);
      return numeric({
        prompt: nm + ' buys ' + n + ' bags of ' + food + '. Each bag has a mass of ' + a + ' g. What is the total mass in grams?', answer: n * a, unit: 'g',
        hint: 'Add ' + a + ' g again and again, ' + n + ' times, or multiply.',
        explain: ex('Lots of the same mass', [n + ' bags of ' + a + ' g.', a + ' × ' + n + ' = ' + Array(n).fill(a).join(' + ') + '.', 'Total mass: <b>' + (n * a) + ' g</b>. ✅']),
        truth: Array(n).fill(a).reduce(function(x, y){ return x + y; }, 0)
      });
    }
    const a = pick([200, 250, 300, 350, 400]), b = pick([150, 200, 250, 300, 450]), food2 = pick(FOODS.filter(function(f){ return f !== food; }));
    return numeric({
      prompt: nm + ' puts ' + a + ' g of ' + food + ' and ' + b + ' g of ' + food2 + ' in a bowl. How many grams is that altogether?', answer: a + b, unit: 'g',
      hint: 'Add the two masses together.',
      explain: ex('Adding masses', ['First: <b>' + a + ' g</b>. Second: <b>' + b + ' g</b>.', a + ' + ' + b + ' = ?', 'Altogether: <b>' + (a + b) + ' g</b>. ✅']),
      truth: (a + 50) + (b - 50)
    });
  }
})();
