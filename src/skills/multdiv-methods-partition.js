/* multdiv-2digit-partition — multiply a 2-digit number by a single digit by partitioning into tens and ones.
   Working is shown in an HTML area-model grid (V.extra.areaModel) that is decoded back from the drawing. */
(function(){
  const INKC = 'var(--vis-ink,#1B1B2F)';
  /* hide: 'none' | 'tens' (tens box = ?) | 'ones' (ones box = ?) | 'cells' (both boxes + total = ?) | 'total' (boxes shown, total = ?) | 'm' (multiplier = ?) */
  function areaModel(tens, ones, m, hide){
    hide = hide || 'none';
    const tc = tens * m, oc = ones * m, tot = tc + oc;
    const hT = hide === 'tens' || hide === 'cells', hO = hide === 'ones' || hide === 'cells', hTot = hide !== 'none' && hide !== 'm', hM = hide === 'm';
    function td(cls, txt, bg){ return '<td class="' + cls + '" style="border:3px solid ' + INKC + ';padding:10px 16px;min-width:56px;text-align:center;font-weight:900;font-size:20px;color:#1B1B2F;background:' + bg + '">' + txt + '</td>'; }
    let s = '<table class="areamodel" style="border-collapse:collapse;margin:0 auto"><tr><td style="padding:6px 10px;text-align:center;font-weight:900;font-size:20px;color:' + INKC + '">×</td>';
    s += td('am-h', tens, '#CFE1FF') + td('am-h', ones, '#E6D4FF') + '</tr><tr>';
    s += td('am-m', hM ? '?' : m, '#FFF3C4') + td('am-c', hT ? '?' : tc, '#EEF1FB') + td('am-c', hO ? '?' : oc, '#EEF1FB') + '</tr>';
    s += '<tr><td style="padding:6px 10px;text-align:right;font-weight:900;font-size:15px;color:' + INKC + '">total</td><td colspan="2" class="am-t" style="border:3px solid ' + INKC + ';padding:8px;text-align:center;font-weight:900;font-size:20px;color:#1B1B2F;background:#D5F5DC">' + (hTot ? '?' : tot) + '</td></tr></table>';
    return s;
  }
  function grab(html, cls){
    const re = new RegExp('class="' + cls + '"[^>]*>([^<]*)<', 'g'), out = []; let x;
    while((x = re.exec(html)) !== null) out.push(x[1]);
    return out;
  }
  function num(s){ return s === '?' ? null : parseInt(s, 10); }
  V.decodeAreaModel = function(html){
    const h = grab(html, 'am-h').map(num), mm = grab(html, 'am-m').map(num), c = grab(html, 'am-c').map(num), t = grab(html, 'am-t').map(num);
    return { tens: h[0], ones: h[1], m: mm[0], cellT: c[0], cellO: c[1], total: t[0] };
  };
  V.extra.areaModel = {
    render: areaModel,
    verify: function(a, html){
      const d = V.decodeAreaModel(html);
      if(d.tens !== a[0] || d.ones !== a[1]) return 'areaModel headers read ' + d.tens + ' and ' + d.ones;
      if(a[3] !== 'm' && d.m !== a[2]) return 'areaModel multiplier reads ' + d.m;
      if(d.cellT !== null && d.cellT !== a[0] * a[2]) return 'areaModel tens box reads ' + d.cellT;
      if(d.cellO !== null && d.cellO !== a[1] * a[2]) return 'areaModel ones box reads ' + d.cellO;
      if(d.total !== null && d.total !== (a[0] + a[1]) * a[2]) return 'areaModel total reads ' + d.total;
      return '';
    }
  };

  function tn(k){ return k + (k === 1 ? ' ten' : ' tens'); }
  function split(n){ return { t: n - (n % 10), o: n % 10 }; }
  function pickN(minT, maxT, minO, maxO){ return randInt(minT, maxT) * 10 + randInt(minO, maxO); }
  function nonZero(v){ return v >= 1; }

  /* the standard set of wrong answers for n × m, with reasons */
  function commonWrongs(n, m){
    const s = split(n), tdig = s.t / 10, out = [];
    out.push({ v: tdig * m + s.o * m, why: 'You multiplied the tens digit (' + tdig + ') but forgot it is really ' + s.t + '. ' + s.t + ' × ' + m + ' = ' + s.t * m + ', not ' + tdig * m + '.' });
    out.push({ v: s.t * m + s.o, why: 'You forgot to multiply the ones. ' + s.o + ' × ' + m + ' = ' + s.o * m + ' — multiply BOTH parts.' });
    out.push({ v: s.t + s.o * m, why: 'You forgot to multiply the tens. ' + s.t + ' × ' + m + ' = ' + s.t * m + ' — multiply BOTH parts.' });
    out.push({ v: n + m, why: 'You added ' + n + ' + ' + m + '. We need ' + n + ' × ' + m + ': split ' + n + ' into ' + s.t + ' and ' + s.o + ', multiply each, then add.' });
    out.push({ v: s.t * m + s.o * m + 10, why: 'Check your adding: ' + s.t * m + ' + ' + s.o * m + ' = ' + n * m + '. The tens and ones must be lined up.' });
    out.push({ v: s.t * m + s.o * m - 10, why: 'Check your adding: ' + s.t * m + ' + ' + s.o * m + ' = ' + n * m + '.' });
    out.push({ v: s.t * m, why: 'That is only the tens part. Add the ones part (' + s.o + ' × ' + m + ' = ' + s.o * m + ') as well.' });
    return out;
  }
  function workSteps(n, m){
    const s = split(n);
    return [
      'Split <b>' + n + '</b> into <b>' + s.t + '</b> and <b>' + s.o + '</b>.',
      'Multiply each part: ' + s.t + ' × ' + m + ' = <b>' + s.t * m + '</b> and ' + s.o + ' × ' + m + ' = <b>' + s.o * m + '</b>.',
      'Add: ' + s.t * m + ' + ' + s.o * m + ' = <b>' + n * m + '</b>. So ' + n + ' × ' + m + ' = ' + n * m + '. ✅'
    ];
  }
  /* independent recompute: repeated addition of n, m times */
  function repeated(n, m){ let t = 0; for(let i = 0; i < m; i++) t += n; return t; }

  registerSkill({
    id: 'multdiv-2digit-partition', strand: 'multdiv', name: 'Multiplying 2-digit numbers', emoji: '🧱', year: 3, order: 380, prereq: ['multdiv-arrays-groups', 'number-place-value', 'multdiv-3', 'multdiv-4'],
    lesson: {
      title: 'Split, multiply, add',
      steps: [
        { say: 'Big numbers are easier in small pieces. <b>23</b> is <b>2 tens</b> and <b>3 ones</b>, which is <b>20 + 3</b>. We call this <b>partitioning</b>.', vis: { kind: 'baseTen', args: [0, 2, 3] } },
        { say: 'To work out <b>23 × 4</b>, draw a grid. Put <b>20</b> and <b>3</b> along the top and <b>4</b> on the side. Each box is a small multiplication. Start with the ones: <b>3 × 4</b>.', vis: { kind: 'areaModel', args: [20, 3, 4, 'cells'] },
          quiz: { prompt: 'What is 3 × 4, for the ones box?', options: [{ label: '7', ok: false }, { label: '12', ok: true }, { label: '34', ok: false }], right: 'Yes! 3 × 4 = 12.', wrong: '3 groups of 4 is 4 + 4 + 4 = 12. (Do not add 3 + 4.)' } },
        { say: 'Now the tens box: <b>20 × 4</b>. 2 tens × 4 = 8 tens = <b>80</b>. Then <b>add the two boxes</b>: 80 + 12 = <b>92</b>. So <b>23 × 4 = 92</b>.', vis: { kind: 'areaModel', args: [20, 3, 4, 'none'] },
          quiz: { prompt: 'Add the two boxes: 80 + 12 = ?', options: [{ label: '92', ok: true }, { label: '82', ok: false }, { label: '20', ok: false }], right: 'Yes! 80 + 12 = 92.', wrong: '80 + 12: 80 + 10 = 90, then 90 + 2 = 92.' } },
        { say: 'Let us try <b>34 × 2</b>. Split 34 into <b>30</b> and <b>4</b>. The tens box is <b>30 × 2</b>. Remember: 3 tens × 2 = 6 tens, which is <b>60</b>, not 6!', vis: { kind: 'areaModel', args: [30, 4, 2, 'cells'] },
          quiz: { prompt: 'What goes in the tens box: 30 × 2?', options: [{ label: '6', ok: false }, { label: '60', ok: true }, { label: '32', ok: false }], right: 'Yes! 30 × 2 = 60. And 4 × 2 = 8, so 60 + 8 = 68.', wrong: '3 tens × 2 = 6 tens = 60. The tens digit stays a tens digit.' } },
        { say: 'Sometimes the ones box is big. For <b>47 × 3</b>: 40 × 3 = <b>120</b> and 7 × 3 = <b>21</b>. Do not worry, just add them: 120 + 21.', vis: { kind: 'areaModel', args: [40, 7, 3, 'total'] },
          quiz: { prompt: 'Add the boxes: 120 + 21 = ?', options: [{ label: '141', ok: true }, { label: '127', ok: false }, { label: '151', ok: false }], right: 'Yes! 120 + 21 = 141, so 47 × 3 = 141.', wrong: '120 + 20 = 140, then add 1 more = 141.' } },
        { say: 'Your turn: <b>15 × 5</b>. Split 15 into 10 and 5. Multiply each part by 5, then add.', vis: { kind: 'areaModel', args: [10, 5, 5, 'cells'] },
          quiz: { prompt: 'What is 15 × 5? (10 × 5 and 5 × 5, then add)', options: [{ label: '75', ok: true }, { label: '55', ok: false }, { label: '25', ok: false }], right: 'Yes! 50 + 25 = 75.', wrong: '10 × 5 = 50 and 5 × 5 = 25. Then 50 + 25 = 75.' } }
      ]
    },
    trick: {
      title: 'Split, multiply, add — then double-check',
      say: '<b>Split</b> the number into tens and ones. <b>Multiply</b> each part. <b>Add</b> the two answers. To check ×4, <b>double and double again</b>: double 23 is 46, double 46 is 92. Same answer!',
      vis: { kind: 'areaModel', args: [20, 3, 4, 'none'] },
      example: '23 × 4 = (20 × 4) + (3 × 4) = 80 + 12 = <b>92</b>. Check: 23 → 46 → <b>92</b> ✅'
    },
    gen: {
      1: function(){
        const f = randInt(1, 5);
        const m = pick([2, 3, 4, 5]);
        if(f === 1){ // missing ones box
          const maxO = Math.max(1, Math.floor(9 / m)), n = pickN(1, 4, 1, maxO), s = split(n), vis = areaModel(s.t, s.o, m, 'ones');
          return mcqNum({
            prompt: 'Work out ' + n + ' × ' + m + '. Split ' + n + ' into ' + s.t + ' and ' + s.o + '. What goes in the ? box?', visual: vis, answer: s.o * m,
            wrong: [{ v: s.o + m, why: 'You added ' + s.o + ' + ' + m + '. Each box is a multiplication: ' + s.o + ' × ' + m + '.' }, { v: s.o, why: 'That is the number on top. Multiply it by ' + m + '.' }, { v: s.t * m, why: 'That is the answer for the tens box. The ? box is the ones: ' + s.o + ' × ' + m + '.' }],
            valid: nonZero,
            hint: 'The ? box is under the ' + s.o + '. Multiply the number on the side (' + m + ') by ' + s.o + '.',
            explain: ex('The ones box', ['The ? box is under <b>' + s.o + '</b>, with <b>' + m + '</b> on the side.', s.o + ' × ' + m + ' = <b>' + s.o * m + '</b>.', 'So <b>' + s.o * m + '</b> goes in the ? box. ✅']),
            truth: repeated(s.o, m), decode: function(){ const d = V.decodeAreaModel(vis); return d.ones * d.m; }
          });
        }
        if(f === 2){ // choose the partition
          const n = pickN(1, 9, 1, 9), s = split(n), tdig = s.t / 10;
          const cands = [
            { a: s.t, b: s.o, why: '' },
            { a: tdig, b: s.o, why: 'That uses ' + tdig + ' for the tens. But the tens digit stands for ' + s.t + '.' },
            { a: s.t * 10, b: s.o, why: 'That makes the tens part too big: ' + n + ' has ' + tn(tdig) + ', which is ' + s.t + '.' },
            { a: s.o * 10, b: tdig, why: 'The digits are the wrong way round. The tens digit of ' + n + ' is ' + tdig + '.' },
            { a: s.t + 10, b: s.o, why: 'The tens part is ' + s.t + ' (' + tn(tdig) + '), not ' + (s.t + 10) + '.' },
            { a: s.t, b: s.o + 1, why: 'The ones digit of ' + n + ' is ' + s.o + '.' }
          ];
          const lab = function(c){ return c.a + ' + ' + c.b; };
          const good = cands.filter(function(c){ return c.a + c.b === n && c.a % 10 === 0 && c.b < 10; }).filter(function(c, i, arr){ return arr.findIndex(function(d){ return lab(d) === lab(c); }) === i; });
          const label = s.t + ' + ' + s.o;
          return mcq({
            prompt: 'Which shows ' + n + ' split into tens and ones?',
            correct: opt(K.text(label), label), distractors: cands.slice(1).filter(function(c){ return c.a + c.b !== n || c.a % 10 !== 0; }).map(function(c){ return opt(K.text(lab(c)), lab(c), c.why); }), keepOrder: true, count: 4,
            hint: 'The tens digit is worth ten times as much. ' + n + ' has ' + tn(tdig) + ' and ' + plural(s.o, 'one') + '.',
            explain: ex('Partitioning ' + n, [n + ' has <b>' + tdig + '</b> ' + (tdig === 1 ? 'ten' : 'tens') + ' and <b>' + s.o + '</b> ones.', tn(tdig) + ' is <b>' + s.t + '</b>.', 'So ' + n + ' = <b>' + label + '</b>. ✅']),
            truth: K.text(good.length === 1 ? lab(good[0]) : 'bad')
          });
        }
        if(f === 3){ // add the two boxes
          const maxO = Math.max(1, Math.floor(9 / m)), n = pickN(1, 4, 1, maxO), s = split(n), vis = areaModel(s.t, s.o, m, 'total');
          return mcqNum({
            prompt: 'Add the two boxes to find ' + n + ' × ' + m + '.', visual: vis, answer: n * m,
            wrong: [{ v: s.t * m, why: 'That is only the tens box. Add the ones box too.' }, { v: s.o * m, why: 'That is only the ones box. Add the tens box too.' }, { v: (s.t / 10) * m + s.o * m, why: 'You used ' + (s.t / 10) * m + ' for the tens box, but the box says ' + s.t * m + '. Add the numbers in the boxes.' }],
            valid: nonZero,
            hint: 'Read the number in each box, then add them together.',
            explain: ex('Adding the boxes', ['The tens box says <b>' + s.t * m + '</b> and the ones box says <b>' + s.o * m + '</b>.', s.t * m + ' + ' + s.o * m + ' = <b>' + n * m + '</b>.', 'So ' + n + ' × ' + m + ' = <b>' + n * m + '</b>. ✅']),
            truth: repeated(n, m), decode: function(){ const d = V.decodeAreaModel(vis); return d.cellT + d.cellO; }
          });
        }
        if(f === 4){ // fill the working line
          const maxO = Math.max(1, Math.floor(9 / m)), n = pickN(1, 4, 1, maxO), s = split(n);
          return mcqNum({
            prompt: n + ' × ' + m + ' = (' + s.t + ' × ' + m + ') + (' + s.o + ' × ' + m + ') = ? + ' + s.o * m + '. What is the missing number?', answer: s.t * m,
            wrong: [{ v: (s.t / 10) * m, why: 'You forgot the zero. ' + s.t + ' is ' + tn(s.t / 10) + ', so ' + s.t + ' × ' + m + ' = ' + s.t * m + '.' }, { v: s.t + m, why: 'You added. The bracket says ' + s.t + ' × ' + m + '.' }, { v: s.t * m * 10, why: 'That is ten times too big. ' + s.t / 10 + ' × ' + m + ' = ' + tn(s.t / 10 * m) + ', so ' + s.t * m + '.' }],
            valid: nonZero,
            hint: 'The missing number is the first bracket: ' + s.t + ' × ' + m + '. Think of ' + tn(s.t / 10) + ' times ' + m + '.',
            explain: ex('The tens part', [s.t + ' is ' + tn(s.t / 10) + '.', tn(s.t / 10) + ' × ' + m + ' = ' + tn(s.t / 10 * m) + ' = <b>' + s.t * m + '</b>.', 'So the missing number is <b>' + s.t * m + '</b>. ✅']),
            truth: (s.t / 10 * m) * 10
          });
        }
        // f === 5: tens facts
        const t = randInt(2, 5), mm = pick([2, 3, 4, 5]);
        return mcqNum({
          prompt: 'What is ' + t * 10 + ' × ' + mm + '?', answer: t * 10 * mm,
          wrong: [{ v: t * mm, why: 'You forgot the zero. ' + tn(t) + ' × ' + mm + ' = ' + tn(t * mm) + ', which is ' + t * mm * 10 + '.' }, { v: t * mm * 100, why: 'That is ten times too big. ' + tn(t) + ' × ' + mm + ' = ' + tn(t * mm) + ' = ' + t * mm * 10 + '.' }, { v: t * 10 + mm, why: 'You added. Multiply: ' + tn(t) + ' × ' + mm + '.' }],
          valid: nonZero,
          hint: 'Say it as tens: ' + tn(t) + ' × ' + mm + ' = how many tens? Then write it as a number.',
          explain: ex('Multiplying tens', [t * 10 + ' is ' + tn(t) + '.', t + ' × ' + mm + ' = ' + t * mm + ', so ' + tn(t * mm) + '.', tn(t * mm) + ' is <b>' + t * mm * 10 + '</b>. ✅']),
          truth: repeated(t * 10, mm)
        });
      },
      2: function(){
        const f = randInt(1, 5);
        const m = pick([2, 3, 4, 5, 8]);
        if(f === 1){ // full question, blank grid
          const n = pickN(1, 6, 3, 9), s = split(n), vis = areaModel(s.t, s.o, m, 'cells');
          return mcqNum({
            prompt: 'Work out ' + n + ' × ' + m + '. Use the grid.', visual: vis, answer: n * m, wrong: commonWrongs(n, m), valid: nonZero,
            hint: 'Fill the tens box (' + s.t + ' × ' + m + ') and the ones box (' + s.o + ' × ' + m + '), then add them.',
            explain: ex('Using the grid', workSteps(n, m)), truth: repeated(n, m),
            decode: function(){ const d = V.decodeAreaModel(vis); return (d.tens + d.ones) * d.m; }
          });
        }
        if(f === 2){ // choose the right working
          const n = pickN(1, 6, 2, 9), s = split(n), tdig = s.t / 10, target = n * m;
          const cands = [
            { l: s.t + ' × ' + m + ' + ' + s.o + ' × ' + m, v: s.t * m + s.o * m, why: '' },
            { l: tdig + ' × ' + m + ' + ' + s.o + ' × ' + m, v: tdig * m + s.o * m, why: 'The tens digit ' + tdig + ' is really ' + s.t + '. Use ' + s.t + ' × ' + m + '.' },
            { l: s.t + ' × ' + m + ' + ' + s.o, v: s.t * m + s.o, why: 'The ones must be multiplied too: ' + s.o + ' × ' + m + '.' },
            { l: s.t + ' + ' + s.o + ' × ' + m, v: s.t + s.o * m, why: 'The tens must be multiplied too: ' + s.t + ' × ' + m + '.' },
            { l: n + ' + ' + m, v: n + m, why: 'That adds. We want to multiply each part: ' + s.t + ' × ' + m + ' and ' + s.o + ' × ' + m + '.' },
            { l: s.t + ' × ' + s.o + ' + ' + m, v: s.t * s.o + m, why: 'That multiplies the tens by the ones. Multiply each part by ' + m + ' instead.' }
          ];
          const good = [cands[0]].concat(cands.slice(1).filter(function(c){ return c.v !== target; })).filter(function(c){ return c.v === target; });
          const label = cands[0].l;
          return mcq({
            prompt: 'Which working is right for ' + n + ' × ' + m + '?',
            correct: opt(K.text(label), label), distractors: cands.slice(1).filter(function(c){ return c.v !== target; }).map(function(c){ return opt(K.text(c.l), c.l, c.why); }), keepOrder: true, count: 4,
            hint: 'Split ' + n + ' into ' + s.t + ' and ' + s.o + '. BOTH parts get multiplied by ' + m + '.',
            explain: ex('Good working', ['Split ' + n + ' into <b>' + s.t + '</b> and <b>' + s.o + '</b>.', 'Multiply BOTH parts by ' + m + ': <b>' + label + '</b>.', s.t * m + ' + ' + s.o * m + ' = ' + target + '. ✅']),
            truth: K.text(good.length === 1 ? good[0].l : 'bad')
          });
        }
        if(f === 3){ // fill a blank in the working line
          const n = pickN(1, 7, 2, 9), s = split(n), askT = chance(0.5);
          const ans = askT ? s.t * m : s.o * m;
          const line = n + ' × ' + m + ' = (' + s.t + ' × ' + m + ') + (' + s.o + ' × ' + m + ') = ' + (askT ? '?' : s.t * m) + ' + ' + (askT ? s.o * m : '?');
          const wr = askT
            ? [{ v: s.t / 10 * m, why: 'You forgot the zero. ' + s.t + ' × ' + m + ' = ' + s.t * m + ' (' + tn(s.t / 10) + ' × ' + m + ').' }, { v: s.t + m, why: 'You added. The bracket says ' + s.t + ' × ' + m + '.' }, { v: s.o * m, why: 'That is the other bracket. The ? comes from ' + s.t + ' × ' + m + '.' }]
            : [{ v: s.o + m, why: 'You added. The bracket says ' + s.o + ' × ' + m + '.' }, { v: s.t * m, why: 'That is the other bracket. The ? comes from ' + s.o + ' × ' + m + '.' }, { v: s.o, why: 'You did not multiply. ' + s.o + ' × ' + m + ' = ' + s.o * m + '.' }];
          return mcqNum({
            prompt: 'Find the missing number: ' + line, answer: ans, wrong: wr, valid: nonZero,
            hint: 'Find the bracket that matches the ?. ' + (askT ? 'It is the first bracket: ' + s.t + ' × ' + m + '.' : 'It is the second bracket: ' + s.o + ' × ' + m + '.'),
            explain: ex('Filling the gap', [askT ? 'The ? is the tens part: ' + s.t + ' × ' + m + '.' : 'The ? is the ones part: ' + s.o + ' × ' + m + '.', (askT ? tn(s.t / 10) + ' × ' + m + ' = ' + tn(s.t / 10 * m) + ' = ' : (s.o + ' × ' + m + ' = ')) + '<b>' + ans + '</b>.', 'The missing number is <b>' + ans + '</b>, and the total is ' + n * m + '. ✅']),
            truth: askT ? (s.t / 10 * m) * 10 : repeated(s.o, m)
          });
        }
        if(f === 4){ // tens box missing in a grid
          const n = pickN(2, 7, 2, 9), s = split(n), vis = areaModel(s.t, s.o, m, 'tens');
          return mcqNum({
            prompt: 'What goes in the ? box for ' + n + ' × ' + m + '?', visual: vis, answer: s.t * m,
            wrong: [{ v: s.t / 10 * m, why: 'You forgot the zero. The top says ' + s.t + ', not ' + s.t / 10 + '. ' + s.t + ' × ' + m + ' = ' + s.t * m + '.' }, { v: s.t + m, why: 'You added. Each box is a multiplication: ' + s.t + ' × ' + m + '.' }, { v: s.o * m, why: 'That is the ones box. The ? is under ' + s.t + '.' }, { v: s.t / 10 * m * 100, why: 'That is ten times too big. ' + tn(s.t / 10) + ' × ' + m + ' = ' + tn(s.t / 10 * m) + '.' }],
            valid: nonZero,
            hint: 'The ? is under ' + s.t + '. Multiply ' + s.t + ' by ' + m + '. Think of ' + tn(s.t / 10) + ' × ' + m + '.',
            explain: ex('The tens box', [s.t + ' is ' + tn(s.t / 10) + '.', tn(s.t / 10) + ' × ' + m + ' = ' + tn(s.t / 10 * m) + ' = <b>' + s.t * m + '</b>.', 'So <b>' + s.t * m + '</b> goes in the ? box. ✅']),
            truth: repeated(s.t, m), decode: function(){ const d = V.decodeAreaModel(vis); return d.tens * d.m; }
          });
        }
        // f === 5: add the two boxes with a carry
        let n, s;
        do { n = pickN(2, 7, 4, 9); s = split(n); } while(s.o * m < 10);
        const vis = areaModel(s.t, s.o, m, 'total');
        return mcqNum({
          prompt: 'The grid shows ' + n + ' × ' + m + '. What is the total?', visual: vis, answer: n * m,
          wrong: [{ v: s.t * m + (s.o * m) % 10, why: 'You lost the tens from ' + s.o * m + '. Add the whole box: ' + s.t * m + ' + ' + s.o * m + '.' }, { v: s.t * m, why: 'That is only the tens box. Add the ones box too.' }, { v: s.o * m, why: 'That is only the ones box. Add the tens box too.' }, { v: s.t * m + s.o * m + 10, why: 'Check your adding: ' + s.t * m + ' + ' + s.o * m + ' = ' + n * m + '.' }],
          valid: nonZero,
          hint: 'Read both boxes. Add the tens box and the ones box. Add the tens first, then the ones.',
          explain: ex('Adding the boxes', ['The boxes say <b>' + s.t * m + '</b> and <b>' + s.o * m + '</b>.', s.t * m + ' + ' + s.o * m + ' = <b>' + n * m + '</b>.', 'So ' + n + ' × ' + m + ' = <b>' + n * m + '</b>. ✅']),
          truth: repeated(n, m), decode: function(){ const d = V.decodeAreaModel(vis); return d.cellT + d.cellO; }
        });
      },
      3: function(){
        const f = randInt(1, 6);
        const m = chance(0.2) ? 6 : pick([2, 3, 4, 5, 8]);
        if(f === 1){ // typed, with blank grid
          const n = pickN(2, 9, 2, 9), s = split(n), vis = areaModel(s.t, s.o, m, 'cells');
          return numeric({
            prompt: 'Work out ' + n + ' × ' + m + '. Use the grid to help.', visual: vis, answer: n * m,
            hint: 'Tens box: ' + s.t + ' × ' + m + '. Ones box: ' + s.o + ' × ' + m + '. Then add the two boxes.',
            explain: ex('Using the grid', workSteps(n, m)), truth: repeated(n, m),
            decode: function(){ const d = V.decodeAreaModel(vis); return (d.tens + d.ones) * d.m; },
            wrong: function(v){ return commonWrongsWhy(n, m, v); }
          });
        }
        if(f === 2){ // typed, no grid
          const n = pickN(2, 9, 2, 9), s = split(n);
          return numeric({
            prompt: 'Work out ' + n + ' × ' + m + '. Split the number to help.', answer: n * m,
            hint: 'Split ' + n + ' into ' + s.t + ' and ' + s.o + '. Multiply each by ' + m + ', then add.',
            explain: ex('Split, multiply, add', workSteps(n, m)), truth: repeated(n, m),
            wrong: function(v){ return commonWrongsWhy(n, m, v); }
          });
        }
        if(f === 3){ // single digit first
          const n = pickN(2, 9, 2, 9), s = split(n);
          return numeric({
            prompt: 'Work out ' + m + ' × ' + n + '.', answer: n * m,
            hint: 'Multiplying works in any order. Think ' + n + ' × ' + m + ', then split ' + n + ' into ' + s.t + ' and ' + s.o + '.',
            explain: ex('Flip, split, add', [m + ' × ' + n + ' is the same as ' + n + ' × ' + m + '.', 'Split ' + n + ': ' + s.t + ' × ' + m + ' = <b>' + s.t * m + '</b> and ' + s.o + ' × ' + m + ' = <b>' + s.o * m + '</b>.', s.t * m + ' + ' + s.o * m + ' = <b>' + n * m + '</b>. ✅']),
            truth: repeated(n, m), wrong: function(v){ return commonWrongsWhy(n, m, v); }
          });
        }
        if(f === 4){ // missing multiplier from the grid
          const mm = pick([2, 3, 4, 5, 8]), n = pickN(2, 7, 2, 9), s = split(n), vis = areaModel(s.t, s.o, mm, 'm');
          return numeric({
            prompt: 'The same number multiplies both parts of ' + n + '. What is the missing number on the side?', visual: vis, answer: mm,
            hint: 'Look at the tens box. What do you multiply ' + s.t + ' by to get ' + s.t * mm + '?',
            explain: ex('Working backwards', ['The tens box says <b>' + s.t * mm + '</b> and the top says <b>' + s.t + '</b>.', s.t * mm + ' ÷ ' + s.t + ' = <b>' + mm + '</b> (check: ' + s.t + ' × ' + mm + ' = ' + s.t * mm + ').', 'The missing number is <b>' + mm + '</b>. ✅']),
            truth: mm, decode: function(){ const d = V.decodeAreaModel(vis); return d.cellT / d.tens; },
            wrong: function(v){ return v === s.t * mm ? 'That is the number in the tens box. We want the number on the side.' : (v === s.o * mm ? 'That is the number in the ones box. We want the number on the side.' : ''); }
          });
        }
        if(f === 5){ // which is bigger
          let a, b, ma, mb, tries = 0;
          do { a = pickN(2, 8, 1, 9); b = pickN(2, 8, 1, 9); ma = pick([2, 3, 4, 5, 8]); mb = pick([2, 3, 4, 5, 8]); tries++; } while(a * ma === b * mb || ma === mb || a === b || Math.abs(a * ma - b * mb) < 4 || (tries < 500 && Math.abs(a * ma - b * mb) > 0.2 * Math.max(a * ma, b * mb)));
          const la = a + ' × ' + ma, lb = b + ' × ' + mb, bigA = a * ma > b * mb, big = bigA ? la : lb, small = bigA ? lb : la;
          const sa = split(a), sb = split(b);
          return mcq2({
            prompt: 'Which is bigger: ' + la + ' or ' + lb + '?',
            correct: opt(K.text(big), big), other: opt(K.text(small), small, 'Work both out. ' + la + ' = ' + a * ma + ' and ' + lb + ' = ' + b * mb + ', so ' + big + ' is bigger.'),
            hint: 'Work out both. Split each number into tens and ones, multiply, add. Then compare.',
            explain: ex('Comparing', [la + ': ' + sa.t * ma + ' + ' + sa.o * ma + ' = <b>' + a * ma + '</b>.', lb + ': ' + sb.t * mb + ' + ' + sb.o * mb + ' = <b>' + b * mb + '</b>.', '<b>' + big + '</b> is the bigger one. ✅']),
            truth: K.text(repeated(a, ma) > repeated(b, mb) ? la : lb)
          });
        }
        // f === 6: spot the mistake
        let n, shown, types;
        for(let tries = 0; tries < 200; tries++){
          n = pickN(2, 8, 2, 9);
          const s = split(n), tdig = s.t / 10, correct = n * m;
          types = [
            { key: 'noones', label: 'He forgot to multiply the ones', val: s.t * m + s.o, why: '' },
            { key: 'notens', label: 'He forgot to multiply the tens', val: s.t + s.o * m },
            { key: 'digit', label: 'He used ' + tdig + ' instead of ' + s.t + ' for the tens', val: tdig * m + s.o * m },
            { key: 'add', label: 'He added ' + n + ' + ' + m + ' instead of multiplying', val: n + m }
          ];
          const vals = types.map(function(t){ return t.val; });
          if(new Set(vals).size === 4 && vals.indexOf(correct) === -1) break;
        }
        const pickT = pick(types), s2 = split(n);
        const whyOf = {
          noones: 'He did ' + s2.t + ' × ' + m + ' = ' + s2.t * m + ' but then added ' + s2.o + ' instead of ' + s2.o + ' × ' + m + ' = ' + s2.o * m + '.',
          notens: 'He did ' + s2.o + ' × ' + m + ' = ' + s2.o * m + ' but added ' + s2.t + ' instead of ' + s2.t + ' × ' + m + ' = ' + s2.t * m + '.',
          digit: 'He did ' + s2.t / 10 + ' × ' + m + ' = ' + s2.t / 10 * m + ' for the tens, but it should be ' + s2.t + ' × ' + m + ' = ' + s2.t * m + '.',
          add: 'He added instead of multiplying. ' + n + ' × ' + m + ' = ' + n * m + '.'
        };
        shown = pickT.val;
        const trueT = types.filter(function(t){ return t.val === shown; });
        return mcq({
          prompt: 'Leo says ' + n + ' × ' + m + ' = ' + shown + '. What mistake did Leo make?',
          correct: opt(K.text(pickT.label), pickT.label), distractors: types.filter(function(t){ return t.key !== pickT.key; }).map(function(t){ return opt(K.text(t.label), t.label, 'If Leo had done that, he would have got ' + t.val + ', not ' + shown + '.'); }), keepOrder: true, count: 4,
          hint: 'Work out the right answer first (' + s2.t + ' × ' + m + ' and ' + s2.o + ' × ' + m + '). Then see how Leo got ' + shown + '.',
          explain: ex('Spotting the mistake', ['The right answer is ' + s2.t * m + ' + ' + s2.o * m + ' = <b>' + n * m + '</b>.', whyOf[pickT.key], 'So the mistake was: <b>' + pickT.label + '</b>. ✅']),
          truth: K.text(trueT.length === 1 ? trueT[0].label : 'bad')
        });
      }
    }
  });

  function commonWrongsWhy(n, m, v){
    const w = commonWrongs(n, m).filter(function(x){ return x.v === v; })[0];
    return w ? w.why : '';
  }
})();
