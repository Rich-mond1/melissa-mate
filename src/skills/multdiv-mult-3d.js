/* multdiv-mult-3d — Year 4: 3-digit × 1-digit with formal short multiplication (carrying through ones, tens and hundreds). */
(function(){
  const COLH = ['O', 'T', 'H', 'Th'];
  const NAMES = ['Ana', 'Marcus', 'Sophie', 'Ivan', 'Lucy', 'Diego', 'Ellen', 'Tom', 'Aisha', 'Kai', 'Mei', 'Leo'];
  const THINGS = [['boxes', 'pencils'], ['bags', 'apples'], ['packs', 'stickers'], ['trays', 'cupcakes'], ['jars', 'marbles'], ['shelves', 'books'], ['baskets', 'strawberries'], ['tanks', 'fish']];
  function pos(v){ return v > 0; }
  function cellsOf(x, cols){ const s = String(x); const out = []; for(let i = 0; i < cols; i++){ const j = s.length - cols + i; out.push(j >= 0 ? s.charAt(j) : ''); } return out; }
  function mulTable(o){
    const cols = 4, A = cellsOf(o.a, cols), B = cellsOf(o.b, cols), td = 'width:40px;height:40px;padding:0;text-align:center;';
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
  function times(a, b){ let s = 0; for(let i = 0; i < b; i++) s += a; return s; }

  /* column method digit by digit: builds the workings (truth is always times(a,b)) */
  function colMul(a, b){
    const o = a % 10, t = Math.floor(a / 10) % 10, h = Math.floor(a / 100);
    const po = o * b, ro = po % 10, c1 = Math.floor(po / 10);
    const pt = t * b + c1, rt = pt % 10, c2 = Math.floor(pt / 10);
    const ph = h * b + c2, rh = ph % 10, rth = Math.floor(ph / 10);
    return { o: o, t: t, h: h, po: po, ro: ro, c1: c1, pt: pt, rt: rt, c2: c2, ph: ph, rh: rh, rth: rth };
  }
  /* mode: 'none' (no carry anywhere), 'one' (carry into tens only), 'two' (carries in tens and hundreds) */
  function pick3(mode, maxB){
    for(let k = 0; k < 800; k++){
      const h = randInt(1, mode === 'none' ? 3 : 9), t = randInt(1, 9), o = randInt(2, 9), b = randInt(2, maxB), a = 100 * h + 10 * t + o, m = colMul(a, b);
      const ok = mode === 'none' ? (m.po < 10 && m.pt < 10 && m.ph < 10) : mode === 'one' ? (m.c1 > 0 && m.c2 === 0 && m.ph < 10) : (m.c1 > 0 && m.c2 > 0);
      if(ok) return { a: a, b: b, m: m };
    }
    return { a: 213, b: 3, m: colMul(213, 3) };
  }
  function pickAny(maxB){ return pick3(pick(['one', 'two', 'two']), maxB); }
  function resultOf(c){ return String(c.a * c.b); }
  function workings(c){
    const m = c.m, st = [];
    st.push('<b>Ones:</b> ' + m.o + ' × ' + c.b + ' = ' + m.po + (m.c1 ? '. Write <b>' + m.ro + '</b>, carry <b>' + m.c1 + '</b> to the tens.' : '. Write <b>' + m.ro + '</b>.'));
    st.push('<b>Tens:</b> ' + m.t + ' × ' + c.b + ' = ' + m.t * c.b + (m.c1 ? ', plus the carried ' + m.c1 + ' = ' + m.pt : '') + '. Write <b>' + m.rt + '</b>' + (m.c2 ? ', carry <b>' + m.c2 + '</b> to the hundreds.' : '.'));
    st.push('<b>Hundreds:</b> ' + m.h + ' × ' + c.b + ' = ' + m.h * c.b + (m.c2 ? ', plus the carried ' + m.c2 + ' = ' + m.ph : '') + '. Write <b>' + m.ph + '</b>.');
    st.push(c.a + ' × ' + c.b + ' = <b>' + c.a * c.b + '</b>. ✅'); return st;
  }
  function wrongs(c){
    const m = c.m, w = [], correct = c.a * c.b;
    if(m.c1) w.push({ v: 100 * (m.h * c.b + m.c2) + 10 * ((m.t * c.b) % 10) + m.ro, why: 'The carry from the ones (' + m.c1 + ') was forgotten. Add it to the tens.' });
    if(m.c2) w.push({ v: 100 * (m.h * c.b) + 10 * m.rt + m.ro, why: 'The carry from the tens (' + m.c2 + ') was forgotten. Add it to the hundreds.' });
    w.push({ v: 100 * (m.h * c.b) + 10 * (m.t * c.b) + m.po, why: 'Each answer must be written in its own column. Carry the tens digit across instead of writing it in full.' });
    w.push({ v: m.t * c.b * 10 + m.po, why: 'The hundreds digit also has to be multiplied: ' + m.h + ' × ' + c.b + '.' });
    w.push({ v: c.a + c.b, why: 'You added. Multiplying means ' + c.b + ' groups of ' + c.a + '.' });
    return w.filter(function(x){ return x.v !== correct && x.v > 0; });
  }
  const NEAR = [1, -1, 10, -10, 100, -100, 20, -20, 2, -2];

  /* ---- tier 1: no carrying, one step at a time ---- */
  function qHundredsStep(){
    const c = pick3('none', 3), vis = mulTable({ a: c.a, b: c.b });
    return mcqNum({
      prompt: 'Look at the <b>hundreds digit</b>. What is ' + c.m.h + ' × ' + c.b + '? (That many hundreds.)', visual: vis, answer: c.m.h * c.b,
      wrong: [{ v: c.m.h + c.b, why: 'You added. Multiply: ' + c.b + ' groups of ' + c.m.h + '.' }, { v: c.m.t * c.b, why: 'That is the tens digit. This question is about the hundreds digit (' + c.m.h + ').' }, { v: c.m.o * c.b, why: 'That is the ones digit. This question is about the hundreds digit (' + c.m.h + ').' }],
      nearby: NEAR, valid: pos, count: 3, hint: 'The hundreds digit is ' + c.m.h + '. Count in ' + c.m.h + 's, ' + c.b + ' times.',
      explain: ex('The hundreds step', ['The hundreds digit is <b>' + c.m.h + '</b>.', c.m.h + ' × ' + c.b + ' = <b>' + c.m.h * c.b + '</b> hundreds. ✅']),
      truth: times(Math.floor(readA(vis) / 100), readB(vis)), decode: function(){ return times(Math.floor(readA(vis) / 100), readB(vis)); }
    });
  }
  function qReadFinished(){
    const c = pick3('none', 3), vis = mulTable({ a: c.a, b: c.b, res: resultOf(c) });
    return mcqNum({
      prompt: 'Here is a finished column multiplication. What is <b>' + c.a + ' × ' + c.b + '</b>?', visual: vis, answer: c.a * c.b, wrong: wrongs(c), nearby: NEAR, valid: pos, count: 3,
      hint: 'Read the answer row from left to right.',
      explain: ex('Reading the column', ['The answer row shows <b>' + resultOf(c) + '</b>.', 'Check: ' + c.m.o + ' × ' + c.b + ' = ' + c.m.po + ', ' + c.m.t + ' × ' + c.b + ' = ' + c.m.pt + ', ' + c.m.h + ' × ' + c.b + ' = ' + c.m.ph + '.', c.a + ' × ' + c.b + ' = <b>' + c.a * c.b + '</b>. ✅']),
      truth: times(c.a, c.b), decode: function(){ return parseInt(readRow(vis, 'dr'), 10); }
    });
  }
  function qSolveNone(){
    const c = pick3('none', 3), vis = mulTable({ a: c.a, b: c.b });
    return mcqNum({
      prompt: 'Use the column method. What is <b>' + c.a + ' × ' + c.b + '</b>?', visual: vis, answer: c.a * c.b, wrong: wrongs(c), nearby: NEAR, valid: pos, count: 4,
      hint: 'Multiply each digit by ' + c.b + ', starting with the ones.', explain: ex('Column multiplication', workings(c)),
      truth: times(readA(vis), readB(vis)), decode: function(){ return times(readA(vis), readB(vis)); }
    });
  }
  /* ---- tier 2: carrying ---- */
  function qCarryTens(){
    const c = pickAny(7), vis = mulTable({ a: c.a, b: c.b });
    return mcqNum({
      prompt: 'In <b>' + c.a + ' × ' + c.b + '</b> the ones give ' + c.m.o + ' × ' + c.b + ' = ' + c.m.po + '. You write ' + c.m.ro + '. How many do you <b>carry to the tens</b>?', visual: vis, answer: c.m.c1,
      wrong: [{ v: c.m.ro, why: c.m.ro + ' is what you WRITE. You carry the tens digit of ' + c.m.po + '.' }, { v: c.m.po, why: c.m.po + ' is the whole product. Write the ones digit, carry only the tens.' }, { v: c.b, why: c.b + ' is the multiplier, not the carry.' }],
      nearby: [1, -1, 2, 3, 4, 5], valid: pos, count: 4, hint: c.m.po + ' is made of tens and ones. The ones digit stays; the tens digit moves across.',
      explain: ex('Carrying', [c.m.o + ' × ' + c.b + ' = ' + c.m.po + ' = <b>' + c.m.c1 + '</b> ten' + (c.m.c1 > 1 ? 's' : '') + ' and ' + c.m.ro + ' ones.', 'Write <b>' + c.m.ro + '</b>, carry <b>' + c.m.c1 + '</b>. ✅']),
      truth: Math.floor((readA(vis) % 10) * readB(vis) / 10), decode: function(){ return Math.floor((readA(vis) % 10) * readB(vis) / 10); }
    });
  }
  function qCarryHundreds(){
    const c = pick3('two', 6), vis = mulTable({ a: c.a, b: c.b });
    return mcqNum({
      prompt: 'In <b>' + c.a + ' × ' + c.b + '</b> the tens step gives ' + c.m.t + ' × ' + c.b + ' + ' + c.m.c1 + ' = ' + c.m.pt + '. You write ' + c.m.rt + '. How many do you <b>carry to the hundreds</b>?', visual: vis, answer: c.m.c2,
      wrong: [{ v: c.m.rt, why: c.m.rt + ' is what you WRITE. You carry the tens digit of ' + c.m.pt + '.' }, { v: c.m.pt, why: c.m.pt + ' is the whole total. Write the ones digit, carry the rest.' }, { v: c.m.c1, why: c.m.c1 + ' was the carry from the ONES step. This time carry from the tens step.' }],
      nearby: [1, -1, 2, 3, 4, 5], valid: pos, count: 4, hint: c.m.pt + ' = tens and ones. The ones digit stays; the tens digit moves across.',
      explain: ex('Carrying again', [c.m.t + ' × ' + c.b + ' = ' + c.m.t * c.b + ', plus the carried ' + c.m.c1 + ' = ' + c.m.pt + '.', 'Write <b>' + c.m.rt + '</b>, carry <b>' + c.m.c2 + '</b> to the hundreds. ✅']),
      truth: Math.floor((times(Math.floor(readA(vis) / 10) % 10, readB(vis)) + Math.floor((readA(vis) % 10) * readB(vis) / 10)) / 10), decode: function(){ return Math.floor((times(Math.floor(readA(vis) / 10) % 10, readB(vis)) + Math.floor((readA(vis) % 10) * readB(vis) / 10)) / 10); }
    });
  }
  function qSolveCarry(){
    const c = pickAny(7), vis = mulTable({ a: c.a, b: c.b, carries: ['', '', '', ''] });
    return mcqNum({
      prompt: 'Use the column method. What is <b>' + c.a + ' × ' + c.b + '</b>?', visual: vis, answer: c.a * c.b, wrong: wrongs(c), nearby: NEAR, valid: pos, count: 4,
      hint: 'Ones first: multiply, write the ones digit, carry the rest. Then the tens, then the hundreds, adding each carry.', explain: ex('Column multiplication', workings(c)),
      truth: times(readA(vis), readB(vis)), decode: function(){ return times(readA(vis), readB(vis)); }
    });
  }
  function qWordCarry(){
    const c = pickAny(7), th = pick(THINGS), who = pick(NAMES);
    return mcqNum({
      prompt: who + ' has ' + c.b + ' ' + th[0] + '. Each one has ' + c.a + ' ' + th[1] + '. How many ' + th[1] + ' altogether?', answer: c.a * c.b, wrong: wrongs(c), nearby: NEAR, valid: pos, count: 4,
      hint: 'Think “' + c.b + ' groups of ' + c.a + '”. Use the column method.', explain: ex('Equal groups in a column', workings(c)), truth: times(c.a, c.b)
    });
  }
  /* ---- tier 3 ---- */
  function qTyped(){
    const c = pickAny(9);
    return numeric({
      prompt: 'Work out  <b>' + c.a + ' × ' + c.b + '</b>  using the column method.', answer: c.a * c.b,
      hint: 'Ones, then tens, then hundreds. Write the ones digit and carry the rest each time.', explain: ex('Column multiplication', workings(c)), truth: times(c.a, c.b),
      wrong: function(v){ return v === c.a + c.b ? 'You added. Multiply.' : (c.m.c1 && v === 100 * (c.m.h * c.b + c.m.c2) + 10 * ((c.m.t * c.b) % 10) + c.m.ro) ? 'You forgot the carry from the ones.' : (c.m.c2 && v === 100 * (c.m.h * c.b) + 10 * c.m.rt + c.m.ro) ? 'You forgot the carry from the tens.' : ''; }
    });
  }
  function qForgotCarry(){
    const c = pick3('two', 9), who = pick(NAMES), bad = 100 * (c.m.h * c.b) + 10 * c.m.rt + c.m.ro;
    return numeric({
      prompt: who + ' worked out ' + c.a + ' × ' + c.b + ' and got <b>' + bad + '</b>. ' + who + ' forgot to add the carry from the tens to the hundreds. What is the correct answer?', answer: c.a * c.b,
      hint: 'The tens step makes ' + c.m.pt + ': write ' + c.m.rt + ' and carry ' + c.m.c2 + ' to the hundreds.', explain: ex('Putting the carry back', workings(c)), truth: times(c.a, c.b),
      wrong: function(v){ return v === bad ? bad + ' is the answer without that carry. Add the carried ' + c.m.c2 + ' to the hundreds.' : ''; }
    });
  }
  function qMissingDigit(){
    const c = pickAny(9), res = resultOf(c), idx = randInt(0, res.length - 1), hid = res.split('').map(function(ch, i){ return i === idx ? '?' : ch; }).join(''), vis = mulTable({ a: c.a, b: c.b, res: hid });
    return numeric({
      prompt: 'One digit of the answer is hidden. Which digit is the <b>?</b>', visual: vis, answer: Number(res.charAt(idx)),
      hint: 'Work out ' + c.a + ' × ' + c.b + ' first, then look at the hidden place.', explain: ex('Finding the hidden digit', workings(c).slice(0, 3).concat(['The answer is <b>' + res + '</b>, so the hidden digit is <b>' + res.charAt(idx) + '</b>. ✅'])),
      truth: Number(String(times(readA(vis), readB(vis))).charAt(String(times(readA(vis), readB(vis))).length - readRow(vis, 'dr').length + readRow(vis, 'dr').indexOf('?'))), decode: function(){ const p = String(times(readA(vis), readB(vis))), r = readRow(vis, 'dr'); return Number(p.charAt(p.length - r.length + r.indexOf('?'))); }
    });
  }
  function qEstimate(){
    const c = pickAny(9), r100 = Math.round(c.a / 100) * 100, est = r100 * c.b, correct = c.a * c.b, who = pick(NAMES);
    const ds = [opt(K.num(Number(String(correct) + '0')), String(Number(String(correct) + '0')), 'That is ten times too big. ' + r100 + ' × ' + c.b + ' = ' + est + ' shows the answer is close to ' + est + '.')];
    wrongs(c).forEach(function(w){ if(w.v !== correct && !ds.some(function(d){ return d.key === K.num(w.v); })) ds.push(opt(K.num(w.v), String(w.v), w.why)); });
    [10, -10, 100, -100, 20, -20].forEach(function(d){ const v = correct + d; if(v > 0 && !ds.some(function(o){ return o.key === K.num(v); })) ds.push(opt(K.num(v), String(v), 'Check the column working again: ' + c.a + ' × ' + c.b + ' is not ' + v + '.')); });
    return mcq({
      prompt: who + ' estimates ' + c.a + ' × ' + c.b + ' by rounding to the nearest 100: ' + r100 + ' × ' + c.b + ' = ' + est + '. Which of these is the <b>exact</b> answer to ' + c.a + ' × ' + c.b + '?', correct: opt(K.num(correct), String(correct)), distractors: ds, keepOrder: true, count: 4,
      hint: 'Do the column method, then check it is close to the estimate ' + est + '.', explain: ex('Estimate and check', workings(c).slice(0, 3).concat([c.a + ' × ' + c.b + ' = <b>' + correct + '</b>, close to the estimate ' + est + '. ✅'])), truth: K.num(times(c.a, c.b))
    });
  }
  function qTwoStep(){
    const c = pickAny(7), th = pick(THINGS), who = pick(NAMES), k = randInt(2, 9), plus = chance(0.5);
    return numeric({
      prompt: who + ' has ' + c.b + ' ' + th[0] + ' with ' + c.a + ' ' + th[1] + ' in each. ' + (plus ? (k === 1 ? '1 more ' + singular(th[1]) + ' arrives.' : k + ' more ' + th[1] + ' arrive.') + ' How many ' + th[1] + ' now?' : nnoun(k, th[1]) + ' ' + isAre(k) + ' used. How many ' + th[1] + ' are left?'), answer: c.a * c.b + (plus ? k : -k),
      hint: 'Two steps. First ' + c.a + ' × ' + c.b + ' in a column. Then ' + (plus ? 'add ' : 'take away ') + k + '.', explain: ex('Two steps', ['Step 1: ' + c.a + ' × ' + c.b + ' = <b>' + c.a * c.b + '</b>.', 'Step 2: ' + c.a * c.b + (plus ? ' + ' : ' − ') + k + ' = <b>' + (c.a * c.b + (plus ? k : -k)) + '</b>. ✅']),
      truth: times(c.a, c.b) + (plus ? k : -k), wrong: function(v){ return v === c.a * c.b ? c.a * c.b + ' is only step 1. Now ' + (plus ? 'add ' : 'take away ') + k + '.' : ''; }
    });
  }
  const L1 = mulTable({ a: 213, b: 3, res: 639 }), L2 = mulTable({ a: 346, b: 2, res: 692, carries: ['', '', 1, ''] }), L3 = mulTable({ a: 275, b: 4, res: 1100, carries: ['', 3, 2, ''] });
  registerSkill({
    id: 'multdiv-mult-3d', strand: 'multdiv', name: 'Multiplying 3-digit numbers', emoji: '✖️', year: 4, order: 405, prereq: ['multdiv-formal-mult'],
    lesson: { title: '3-digit × 1-digit in a column', steps: [
      { say: 'The column method works for bigger numbers too: multiply <b>ones, then tens, then hundreds</b>. 213 × 3: 3×3 = 9, 1×3 = 3, 2×3 = 6. The answer is <b>639</b>.', vis: { kind: 'html', args: [L1] } },
      { say: '346 × 2. Ones: 6 × 2 = 12, write <b>2</b>, carry <b>1</b>. Tens: 4 × 2 = 8, add 1 = <b>9</b>. Hundreds: 3 × 2 = <b>6</b>. So 346 × 2 = <b>692</b>.', vis: { kind: 'html', args: [L2] },
        quiz: { prompt: 'In 346 × 2, the ones give 12. What do you carry?', options: [{ label: '1', ok: true }, { label: '2', ok: false }, { label: '12', ok: false }], right: 'Yes! Write 2, carry 1.', wrong: '12 is 1 ten and 2 ones. Write 2, carry 1.' } },
      { say: '275 × 4. Ones: 5×4 = 20, write 0 carry 2. Tens: 7×4 = 28, plus the 2 carried = 30, write 0 carry 3. Hundreds: 2×4 = 8, plus the 3 carried = 11. So <b>1,100</b>. Estimate: 300 × 4 = 1,200, close ✓', vis: { kind: 'html', args: [L3] },
        quiz: { prompt: 'About how big is 398 × 3? (Round 398 to 400.)', options: [{ label: 'About 1,200', ok: true }, { label: 'About 120', ok: false }, { label: 'About 12,000', ok: false }], right: 'Yes! 400 × 3 = 1,200.', wrong: '400 × 3 = 1,200, so 398 × 3 is a little less.' } }
    ] },
    trick: { title: 'Right to left, carry, estimate', say: 'Start on the <b>right</b>. At every column: multiply, add the carry, <b>write</b> the ones digit and <b>carry</b> the rest. Then <b>estimate</b> by rounding to check.', vis: { kind: 'html', args: [L2] }, example: '346 × 2 → 6×2 = 12 (write 2, carry 1) → 4×2+1 = 9 → 3×2 = 6 → <b>692</b> &nbsp; (estimate 300 × 2 = 600 ✓)' },
    gen: {
      1: function(){ return pick([qHundredsStep, qReadFinished, qSolveNone, qSolveNone])(); },
      2: function(){ return pick([qCarryTens, qCarryHundreds, qSolveCarry, qSolveCarry, qSolveCarry, qWordCarry])(); },
      3: function(){ return pick([qTyped, qTyped, qForgotCarry, qMissingDigit, qEstimate, qTwoStep])(); }
    }
  });
})();
