/* multdiv-formal-mult — Years 3-4 (school calculation policy: grid method -> formal short multiplication): 2-digit × 1-digit in a column, with carrying. */
(function(){
  const COLH = ['O', 'T', 'H'];
  const NAMES = ['Ana', 'Marcus', 'Sophie', 'Ivan', 'Lucy', 'Diego', 'Ellen', 'Tom', 'Aisha', 'Kai', 'Mei', 'Leo'];
  const THINGS = [['boxes', 'pencils'], ['bags', 'apples'], ['packs', 'stickers'], ['trays', 'cupcakes'], ['jars', 'marbles'], ['shelves', 'books'], ['baskets', 'strawberries'], ['tanks', 'fish']];
  function pos(v){ return v > 0; }
  function cellsOf(x, cols){ const s = String(x); const out = []; for(let i = 0; i < cols; i++){ const j = s.length - cols + i; out.push(j >= 0 ? s.charAt(j) : ''); } return out; }
  /* the column picture: 2-digit number, the multiplier in the ones column, an optional result row (a '?' hides a digit) and optional carries */
  function mulTable(o){
    const cols = 3, A = cellsOf(o.a, cols), B = cellsOf(o.b, cols), td = 'width:42px;height:40px;padding:0;text-align:center;';
    const R = o.res === undefined || o.res === null ? null : cellsOf(o.res, cols);
    let s = '<table class="colmul" style="border-collapse:collapse;margin:0 auto;font:800 28px ui-monospace,Menlo,monospace;color:var(--vis-ink,#1B1B2F)"><tr><td style="width:28px"></td>';
    for(let i = 0; i < cols; i++) s += '<td style="' + td + 'height:20px;font-size:13px;color:var(--vis-b,#9B51E0)">' + COLH[cols - 1 - i] + '</td>';
    s += '</tr><tr><td class="op"></td>'; for(let i = 0; i < cols; i++) s += '<td class="da" style="' + td + '">' + A[i] + '</td>';
    s += '</tr><tr><td class="op" style="font-size:26px">×</td>'; for(let i = 0; i < cols; i++) s += '<td class="db" style="' + td + '">' + B[i] + '</td>';
    s += '</tr><tr><td style="border-top:3px solid var(--vis-ink,#1B1B2F)"></td>';
    for(let i = 0; i < cols; i++) s += '<td class="dr" style="' + td + 'border-top:3px solid var(--vis-ink,#1B1B2F);color:var(--vis-a,#4F8FE8)">' + (R ? R[i] : '') + '</td>';
    s += '</tr>';
    if(o.carries){ s += '<tr><td></td>'; for(let i = 0; i < cols; i++) s += '<td class="dc" style="' + td + 'height:28px;font-size:17px;color:var(--vis-bad,#EB5757)">' + (o.carries[i] || '') + '</td>'; s += '</tr>'; }
    return s + '</table>';
  }
  function readRow(html, cls){ const re = new RegExp('<td class="' + cls + '"[^>]*>([^<]*)</td>', 'g'); let m, out = ''; while((m = re.exec(html))) out += m[1]; return out; }
  function readA(html){ return parseInt(readRow(html, 'da'), 10); }
  function readB(html){ return parseInt(readRow(html, 'db'), 10); }

  /* column method, digit by digit (this builds the workings; truth is always a × b) */
  function colMul(a, b){
    const o = a % 10, t = Math.floor(a / 10), po = o * b, ro = po % 10, c1 = Math.floor(po / 10), pt = t * b + c1;
    return { o: o, t: t, po: po, ro: ro, c1: c1, pt: pt, rt: pt % 10, rh: Math.floor(pt / 10) };
  }
  function pick2(noCarry, maxB, bigTens){
    for(let k = 0; k < 400; k++){
      const t = randInt(1, bigTens ? 9 : 4), o = randInt(noCarry ? 2 : 1, 9), b = randInt(2, maxB), m = colMul(10 * t + o, b);
      if(noCarry ? (m.po < 10 && m.pt < 10) : (m.c1 > 0 && (bigTens || m.pt < 10))) return { a: 10 * t + o, b: b, m: m };
    }
    return { a: 24, b: 3, m: colMul(24, 3) };
  }
  function resultOf(c){ return String(c.m.rh > 0 ? c.m.rh : '') + String(c.m.rt) + String(c.m.ro); }
  function workings(c){
    const m = c.m, st = ['<b>Ones first:</b> ' + m.o + ' × ' + c.b + ' = ' + m.po + (m.c1 ? '. Write <b>' + m.ro + '</b> in the ones and carry <b>' + m.c1 + '</b> to the tens.' : '. Write <b>' + m.ro + '</b> in the ones.')];
    st.push('<b>Then the tens:</b> ' + m.t + ' tens × ' + c.b + ' = ' + m.t * c.b + (m.c1 ? ', and add the carried ' + m.c1 + ': ' + m.pt + '.' : '.') + ' Write <b>' + m.pt + '</b> in the tens' + (m.rh ? ' and hundreds.' : '.'));
    st.push(c.a + ' × ' + c.b + ' = <b>' + c.a * c.b + '</b>. ✅'); return st;
  }
  function wrongs(c){
    const m = c.m, w = [], t = m.t, correct = c.a * c.b;
    if(m.c1){
      w.push({ v: 10 * (t * c.b) + m.ro, why: 'You forgot the carried ' + m.c1 + '. Add it to the tens: ' + t * c.b + ' + ' + m.c1 + ' = ' + m.pt + '.' });
      w.push({ v: 10 * (t * c.b) + m.ro + m.c1, why: 'The carried ' + m.c1 + ' is worth ' + m.c1 + ' TENS, so it is added in the tens column, not the ones.' });
      w.push({ v: Number(String(t * c.b) + String(m.po)), why: 'You wrote both products side by side. Write only the ones digit (' + m.ro + ') and carry the rest.' });
      w.push({ v: m.po, why: m.po + ' is only the ones: ' + m.o + ' × ' + c.b + '. The tens still need multiplying.' });
    } else {
      w.push({ v: 10 * t * c.b, why: 'You forgot the ones. ' + m.o + ' × ' + c.b + ' = ' + m.po + ' must be added.' });
      w.push({ v: m.po, why: 'That is only the ones. The tens still need multiplying.' });
    }
    w.push({ v: c.a + c.b, why: 'You added. Multiplying means ' + c.b + ' groups of ' + c.a + '.' });
    return w.filter(function(x){ return x.v !== correct && x.v > 0; });
  }
  const NEAR = [1, -1, 2, -2, 10, -10, 20, -20, 100, -100];

  /* ---------- tier 1: no carrying; one step at a time ---------- */
  function qOnesStep(){
    const c = pick2(true, 4), vis = mulTable({ a: c.a, b: c.b });
    return mcqNum({
      prompt: 'Start with the <b>ones</b>. What is ' + c.m.o + ' × ' + c.b + '?', visual: vis, answer: c.m.po,
      wrong: [{ v: c.m.o + c.b, why: 'You added. Multiplying means ' + c.b + ' groups of ' + c.m.o + '.' }, { v: c.m.t * c.b, why: 'That is the tens: ' + c.m.t + ' × ' + c.b + '. We start with the ones, ' + c.m.o + ' × ' + c.b + '.' }, { v: c.a, why: c.a + ' is the whole top number. Multiply only the ones digit.' }],
      nearby: NEAR, valid: pos, count: 3,
      hint: 'Look at the digit in the ones column (' + c.m.o + '). Count in ' + c.m.o + 's, ' + c.b + ' times.',
      explain: ex('The ones step', ['In the ones column the top digit is <b>' + c.m.o + '</b>.', c.m.o + ' × ' + c.b + ' = <b>' + c.m.po + '</b>.', 'Write ' + c.m.po + ' in the ones column (no carrying needed). ✅']),
      truth: (c.a % 10) * c.b, decode: function(){ return (readA(vis) % 10) * readB(vis); }
    });
  }
  function qTensStep(){
    const c = pick2(true, 4), vis = mulTable({ a: c.a, b: c.b, res: '?' + c.m.ro });
    return mcqNum({
      prompt: 'The ones are done. Now multiply the <b>tens digit</b>: ' + c.m.t + ' × ' + c.b + ' = how many tens?', visual: vis, answer: c.m.t * c.b,
      wrong: [{ v: c.m.t + c.b, why: 'You added. Multiply: ' + c.b + ' groups of ' + c.m.t + ' tens.' }, { v: 10 * c.m.t * c.b, why: 'That is the value in ones. The question asks for how many TENS.' }, { v: c.m.po, why: 'That is the ones step again. Now do the tens digit.' }],
      nearby: NEAR, valid: pos, count: 3,
      hint: 'Look at the tens digit (' + c.m.t + '). Count in ' + c.m.t + 's, ' + c.b + ' times.',
      explain: ex('The tens step', ['The tens digit is <b>' + c.m.t + '</b>.', c.m.t + ' × ' + c.b + ' = <b>' + c.m.t * c.b + '</b> tens.', 'So the answer is ' + c.m.t * c.b + ' tens and ' + c.m.ro + ' ones: <b>' + c.a * c.b + '</b>. ✅']),
      truth: Math.floor(c.a / 10) * c.b, decode: function(){ return Math.floor(readA(vis) / 10) * readB(vis); }
    });
  }
  function qReadFinished(){
    const c = pick2(true, 4), vis = mulTable({ a: c.a, b: c.b, res: resultOf(c) });
    return mcqNum({
      prompt: 'Here is a finished column multiplication. What is <b>' + c.a + ' × ' + c.b + '</b>?', visual: vis, answer: c.a * c.b,
      wrong: wrongs(c), nearby: NEAR, valid: pos, count: 3,
      hint: 'Read the digits of the answer row from left to right.',
      explain: ex('Reading the column', ['The answer row shows <b>' + resultOf(c) + '</b>.', 'Check: ' + c.m.o + ' × ' + c.b + ' = ' + c.m.po + ' and ' + c.m.t + ' tens × ' + c.b + ' = ' + c.m.pt + ' tens.', c.a + ' × ' + c.b + ' = <b>' + c.a * c.b + '</b>. ✅']),
      truth: c.a * c.b, decode: function(){ return parseInt(readRow(vis, 'dr'), 10); }
    });
  }

  /* ---------- tier 2: carrying ---------- */
  function qCarryAmount(){
    const c = pick2(false, 6, false), vis = mulTable({ a: c.a, b: c.b });
    return mcqNum({
      prompt: 'In <b>' + c.a + ' × ' + c.b + '</b>, the ones give ' + c.m.o + ' × ' + c.b + ' = ' + c.m.po + '. You write ' + c.m.ro + ' in the ones. How many tens do you <b>carry</b>?', visual: vis, answer: c.m.c1,
      wrong: [{ v: c.m.ro, why: c.m.ro + ' is the digit you WRITE in the ones. The tens digit of ' + c.m.po + ' is what you carry.' }, { v: c.m.po, why: c.m.po + ' is the whole ones product. Write the ones digit and carry only the tens.' }, { v: c.b, why: c.b + ' is the multiplier, not the carry.' }],
      nearby: [1, -1, 2, 3, 4], valid: pos, count: 4,
      hint: c.m.po + ' is made of tens and ones. The ones digit stays; the tens digit moves across.',
      explain: ex('Carrying', [c.m.o + ' × ' + c.b + ' = ' + c.m.po + ', which is <b>' + c.m.c1 + ' ten' + (c.m.c1 > 1 ? 's' : '') + '</b> and <b>' + c.m.ro + ' ones</b>.', 'Write <b>' + c.m.ro + '</b> in the ones column.', 'Carry the <b>' + c.m.c1 + '</b> to the tens column. ✅']),
      truth: Math.floor(((c.a % 10) * c.b) / 10), decode: function(){ return Math.floor(((readA(vis) % 10) * readB(vis)) / 10); }
    });
  }
  function qSolveCarry(){
    const c = pick2(false, 6, false), vis = mulTable({ a: c.a, b: c.b, carries: ['', '', ''] });
    return mcqNum({
      prompt: 'Use the column method. What is <b>' + c.a + ' × ' + c.b + '</b>?', visual: vis, answer: c.a * c.b,
      wrong: wrongs(c), nearby: NEAR, valid: pos, count: 4,
      hint: 'Ones first: multiply, write the ones digit and carry the tens. Then multiply the tens and add the carry.',
      explain: ex('Column multiplication', workings(c)),
      truth: c.a * c.b, decode: function(){ return readA(vis) * readB(vis); }
    });
  }
  function qWordCarry(){
    const c = pick2(false, 6, false), th = pick(THINGS), who = pick(NAMES);
    return mcqNum({
      prompt: who + ' has ' + c.b + ' ' + th[0] + '. Each one has ' + c.a + ' ' + th[1] + '. How many ' + th[1] + ' altogether?', answer: c.a * c.b,
      wrong: wrongs(c), nearby: NEAR, valid: pos, count: 4,
      hint: 'Think “' + c.b + ' groups of ' + c.a + '”. Use the column method.',
      explain: ex('Equal groups in a column', workings(c)), truth: c.a * c.b
    });
  }
  function qStepOrder(){
    const keys = ['a', 'b', 'c', 'd'], labels = ['Multiply the ones', 'Write the ones digit and carry the tens', 'Multiply the tens', 'Add the carry'];
    return order({
      prompt: 'Tap the cards in the right order for column multiplication.',
      items: keys.map(function(k, i){ return { key: k, label: labels[i] }; }),
      hint: 'You always start on the right, with the ones.',
      explain: ex('The steps', ['<b>1.</b> Multiply the ones. <b>2.</b> Write the ones digit and carry the tens.', '<b>3.</b> Multiply the tens. <b>4.</b> Add the carry you brought across.', 'Always start on the right, with the ones. ✅']),
      truth: 'o:' + keys.join('|')
    });
  }

  /* ---------- tier 3: typed, bigger numbers, reasoning ---------- */
  function qTyped(){
    const c = pick2(false, 9, true);
    return numeric({
      prompt: 'Work out  <b>' + c.a + ' × ' + c.b + '</b>  using the column method.', answer: c.a * c.b,
      hint: 'Ones first (' + c.m.o + ' × ' + c.b + '), carry the tens, then the tens digit and add the carry.',
      explain: ex('Column multiplication', workings(c)), truth: c.a * c.b,
      wrong: function(v){ return v === 10 * (c.m.t * c.b) + c.m.ro ? 'You forgot the carried ' + c.m.c1 + '. Add it to the tens.' : v === c.a + c.b ? 'You added. Multiply.' : ''; }
    });
  }
  function qForgotCarry(){
    const c = pick2(false, 9, true), who = pick(NAMES), bad = 10 * (c.m.t * c.b) + c.m.ro;
    return numeric({
      prompt: who + ' worked out ' + c.a + ' × ' + c.b + ' and got <b>' + bad + '</b>. ' + who + ' forgot to add the carry. What is the correct answer?', answer: c.a * c.b,
      hint: 'The ones product ' + c.m.o + ' × ' + c.b + ' = ' + c.m.po + ' carries ' + c.m.c1 + '. Add it to the tens step.',
      explain: ex('Putting the carry back', workings(c)), truth: c.a * c.b,
      wrong: function(v){ return v === bad ? bad + ' is the answer without the carry. Add the carried ' + c.m.c1 + ' tens.' : ''; }
    });
  }
  function qMissingDigit(){
    const c = pick2(false, 9, true), res = resultOf(c), idx = randInt(0, res.length - 1), hid = res.split('').map(function(ch, i){ return i === idx ? '?' : ch; }).join('');
    const vis = mulTable({ a: c.a, b: c.b, res: hid });
    return numeric({
      prompt: 'One digit of the answer is hidden. Which digit is the <b>?</b>', visual: vis, answer: Number(res.charAt(idx)),
      hint: 'Work out ' + c.a + ' × ' + c.b + ' first, then look at the hidden place.',
      explain: ex('Finding the hidden digit', workings(c).slice(0, 2).concat(['The answer is <b>' + res + '</b>, so the hidden digit is <b>' + res.charAt(idx) + '</b>. ✅'])),
      truth: Number(String(readA(vis) * readB(vis)).charAt(String(readA(vis) * readB(vis)).length - res.length + idx)), decode: function(){ const p = String(readA(vis) * readB(vis)); const r = readRow(vis, 'dr'); return Number(p.charAt(p.length - r.length + r.indexOf('?'))); }
    });
  }
  function qEstimate(){
    const c = pick2(false, 9, true), r10 = Math.round(c.a / 10) * 10, est = r10 * c.b, correct = c.a * c.b, who = pick(NAMES);
    const ds = [opt(K.num(Number(String(correct) + '0')), String(Number(String(correct) + '0')), 'That is ten times too big. ' + r10 + ' × ' + c.b + ' = ' + est + ' tells you the answer is close to ' + est + '.')];
    wrongs(c).forEach(function(w){ if(w.v !== correct && !ds.some(function(d){ return d.key === K.num(w.v); })) ds.push(opt(K.num(w.v), String(w.v), w.why)); });
    [10, -10, 20, -20, 1, -1].forEach(function(d){ const v = correct + d; if(v > 0 && !ds.some(function(o){ return o.key === K.num(v); })) ds.push(opt(K.num(v), String(v), 'Check the column working again: ' + c.a + ' × ' + c.b + ' is not ' + v + '.')); });
    if(Math.round(correct / 10) > 0) ds.push(opt(K.num(Math.round(correct / 10)), String(Math.round(correct / 10)), 'That is ten times too small. ' + est + ' is the estimate.'));
    return mcq({
      prompt: who + ' estimates ' + c.a + ' × ' + c.b + ' by rounding: ' + r10 + ' × ' + c.b + ' = ' + est + '. Which of these is the <b>exact</b> answer to ' + c.a + ' × ' + c.b + '?', correct: opt(K.num(correct), String(correct)), distractors: ds, keepOrder: true, count: 4,
      hint: 'Do the column method, then check that it is close to the estimate ' + est + '.',
      explain: ex('Estimate and check', workings(c).slice(0, 2).concat([c.a + ' × ' + c.b + ' = <b>' + correct + '</b>, which is close to the estimate ' + est + '. ✅'])), truth: K.num(c.a * c.b)
    });
  }
  function qTwoStep(){
    const c = pick2(false, 7, true), th = pick(THINGS), who = pick(NAMES), k = randInt(2, 9), plus = chance(0.5);
    return numeric({
      prompt: who + ' has ' + c.b + ' ' + th[0] + ' with ' + c.a + ' ' + th[1] + ' in each. ' + (plus ? k + ' more ' + th[1] + ' arrive. How many ' + th[1] + ' now?' : k + ' ' + th[1] + ' are used. How many ' + th[1] + ' are left?'), answer: c.a * c.b + (plus ? k : -k),
      hint: 'Two steps. First ' + c.a + ' × ' + c.b + ' in a column. Then ' + (plus ? 'add ' : 'take away ') + k + '.',
      explain: ex('Two steps', ['Step 1: ' + c.a + ' × ' + c.b + ' = <b>' + c.a * c.b + '</b> (ones ' + c.m.o + ' × ' + c.b + ' = ' + c.m.po + ', carry ' + c.m.c1 + ').', 'Step 2: ' + c.a * c.b + (plus ? ' + ' : ' − ') + k + ' = <b>' + (c.a * c.b + (plus ? k : -k)) + '</b>. ✅']),
      truth: c.a * c.b + (plus ? k : -k), wrong: function(v){ return v === c.a * c.b ? c.a * c.b + ' is only step 1. Now ' + (plus ? 'add ' : 'take away ') + k + '.' : ''; }
    });
  }

  const lessonTable1 = mulTable({ a: 23, b: 3, res: 69 }), lessonTable2 = mulTable({ a: 27, b: 4, res: 108, carries: ['', 2, ''] }), lessonTable3 = mulTable({ a: 38, b: 4, res: 152, carries: ['', 3, ''] });
  registerSkill({
    id: 'multdiv-formal-mult', strand: 'multdiv', name: 'Multiplying in a column', emoji: '✖️', year: 3, order: 385, prereq: ['multdiv-2digit-partition'],
    lesson: {
      title: 'From the grid to the column',
      steps: [
        { say: 'You can split 23 into <b>20 + 3</b>. 20 × 3 = 60 and 3 × 3 = 9, so 23 × 3 = <b>69</b>. The column method does the same sum in a neat, short way.', vis: { kind: 'baseTen', args: [0, 2, 3] } },
        { say: 'Write 23 with 3 underneath. Start with the <b>ones</b>: 3 × 3 = <b>9</b>. Then the <b>tens</b>: 2 × 3 = <b>6</b>. The answer is <b>69</b>.', vis: { kind: 'html', args: [lessonTable1] },
          quiz: { prompt: 'In 23 × 3, what is 3 × 3 (the ones step)?', options: [{ label: '6', ok: false }, { label: '9', ok: true }, { label: '33', ok: false }], right: 'Yes! 3 × 3 = 9 goes in the ones column.', wrong: 'The ones digit is 3 and the multiplier is 3. 3 × 3 = 9.' } },
        { say: 'Now 27 × 4. Ones: 7 × 4 = 28. Write the <b>8</b> and <b>carry the 2</b> (2 tens) to the tens column. Tens: 2 × 4 = 8, and add the carried 2: <b>10</b>. So 27 × 4 = <b>108</b>.', vis: { kind: 'html', args: [lessonTable2] },
          quiz: { prompt: 'In 27 × 4, the ones give 28. What do you carry?', options: [{ label: '8', ok: false }, { label: '2', ok: true }, { label: '28', ok: false }], right: 'Yes! Write 8, carry 2.', wrong: '28 is 2 tens and 8 ones. Write the 8 and carry the 2.' } },
        { say: 'Check with an <b>estimate</b>. 38 is nearly 40, and 40 × 4 = 160. The column gives 38 × 4 = <b>152</b>. That is close to 160, so it makes sense!', vis: { kind: 'html', args: [lessonTable3] },
          quiz: { prompt: 'About how big is 29 × 3? (Round 29 to 30.)', options: [{ label: 'About 9', ok: false }, { label: 'About 90', ok: true }, { label: 'About 900', ok: false }], right: 'Yes! 30 × 3 = 90, so 29 × 3 is a bit less than 90.', wrong: '30 × 3 = 90, so 29 × 3 is a bit less than 90.' } }
      ]
    },
    trick: {
      title: 'Ones first, write, carry, tens, add',
      say: 'Always start on the <b>right</b>. Multiply the ones, <b>write</b> the ones digit and <b>carry</b> the tens. Then multiply the tens and <b>add the carry</b>. Finish by estimating to check.',
      vis: { kind: 'html', args: [lessonTable2] },
      example: '27 × 4 → 7 × 4 = 28 (write 8, carry 2) → 2 × 4 = 8, 8 + 2 = 10 → <b>108</b> &nbsp; (estimate 30 × 4 = 120 ✓)'
    },
    gen: {
      1: function(){ return pick([qOnesStep, qOnesStep, qTensStep, qTensStep, qReadFinished])(); },
      2: function(){ return pick([qCarryAmount, qCarryAmount, qSolveCarry, qSolveCarry, qSolveCarry, qWordCarry, qStepOrder])(); },
      3: function(){ return pick([qTyped, qTyped, qForgotCarry, qForgotCarry, qMissingDigit, qEstimate, qTwoStep, qTwoStep, qStepOrder])(); }
    }
  });
})();
