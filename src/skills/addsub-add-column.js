/* addsub-add-column — column addition up to 3 digits (answers up to about 1200), with carrying */
(function(){
  const COLN = ['ones', 'tens', 'hundreds', 'thousands'], COLH = ['O', 'T', 'H', 'Th'];
  function dg(n, i){ return Math.floor(n / Math.pow(10, i)) % 10; }
  function cap(s){ return s.charAt(0).toUpperCase() + s.slice(1); }

  /* ---- the column picture (an HTML table). a and b may be numbers or strings (a '?' marks a hidden digit) ---- */
  function cellsOf(x, cols){ const s = String(x); const out = []; for(let i = 0; i < cols; i++){ const j = s.length - cols + i; out.push(j >= 0 ? s.charAt(j) : ''); } return out; }
  function colTable(o){
    const cols = o.cols, A = cellsOf(o.a, cols), B = cellsOf(o.b, cols);
    const R = o.res === undefined || o.res === null ? null : cellsOf(o.res, cols);
    const td = 'width:42px;height:40px;padding:0;text-align:center;';
    let s = '<table class="colsum" style="border-collapse:collapse;margin:0 auto;font:800 28px ui-monospace,Menlo,monospace;color:var(--vis-ink,#1B1B2F)">';
    s += '<tr><td style="width:28px"></td>';
    for(let i = 0; i < cols; i++) s += '<td style="' + td + 'height:20px;font-size:13px;color:var(--vis-b,#9B51E0)">' + COLH[cols - 1 - i] + '</td>';
    s += '</tr><tr><td class="op" style="font-size:26px"></td>';
    for(let i = 0; i < cols; i++) s += '<td class="da" style="' + td + '">' + A[i] + '</td>';
    s += '</tr><tr><td class="op" style="font-size:26px">+</td>';
    for(let i = 0; i < cols; i++) s += '<td class="db" style="' + td + '">' + B[i] + '</td>';
    s += '</tr><tr><td style="border-top:3px solid var(--vis-ink,#1B1B2F)"></td>';
    for(let i = 0; i < cols; i++) s += '<td class="dr" style="' + td + 'border-top:3px solid var(--vis-ink,#1B1B2F);color:var(--vis-a,#4F8FE8)">' + (R ? R[i] : (i === cols - 1 || A[i] !== '' || B[i] !== '' ? '?' : '')) + '</td>';
    s += '</tr>';
    if(o.carries){
      s += '<tr><td></td>';
      for(let i = 0; i < cols; i++) s += '<td class="dc" style="' + td + 'height:28px;font-size:17px;color:var(--vis-bad,#EB5757)">' + (o.carries[i] || '') + '</td>';
      s += '</tr>';
    }
    return s + '</table>';
  }
  function readRow(html, cls){ const re = new RegExp('<td class="' + cls + '"[^>]*>([^<]*)</td>', 'g'); let m, out = ''; while((m = re.exec(html))) out += m[1]; return out; }
  function readSum(html){ return parseInt(readRow(html, 'da'), 10) + parseInt(readRow(html, 'db'), 10); }

  /* ---- column addition by columns (this builds `correct`; truth is a + b) ---- */
  function colAdd(a, b, mode){
    const L = Math.max(String(a).length, String(b).length) + 1;
    let carry = 0, stash = 0, out = [], carries = [];
    for(let i = 0; i < L; i++){
      let s = dg(a, i) + dg(b, i) + carry;
      if(mode === 'wrongCol' && i === 2) s += stash;
      carries[i] = s >= 10 ? 1 : 0;
      out.push(s % 10);
      carry = s >= 10 ? 1 : 0;
      if(mode === 'none') carry = 0;
      if(mode === 'dropOnes' && i === 0) carry = 0;
      if(mode === 'dropTens' && i === 1) carry = 0;
      if(mode === 'wrongCol' && i === 0){ stash = carry; carry = 0; }
    }
    let v = 0; for(let i = L - 1; i >= 0; i--) v = v * 10 + out[i];
    return { value: v, carries: carries };
  }
  function carryFlags(a, b){ const c = colAdd(a, b, 'ok').carries; return { o: c[0] === 1, t: c[1] === 1, h: c[2] === 1 }; }

  const WHY = {
    none: 'You forgot to carry. When a column makes 10 or more, write the ones digit and carry the 1 to the next column.',
    dropOnes: 'You forgot to carry the 1 from the ones column into the tens column.',
    dropTens: 'You forgot to carry the 1 from the tens column into the hundreds column.',
    wrongCol: 'The carry went into the wrong column. A carry always goes into the very next column on the LEFT.',
    both: 'You wrote both digits of a column total (like 12) in one column. Only ONE digit fits: write the ones digit and carry the rest.',
    align: 'It looks like the smaller number was lined up on the left. Ones must go under ones, tens under tens.'
  };
  function wrongList(a, b){
    const ans = a + b, out = [];
    ['dropOnes', 'dropTens', 'none', 'wrongCol'].forEach(function(m){ const v = colAdd(a, b, m).value; if(v !== ans) out.push({ v: v, why: WHY[m] }); });
    if(String(a).length === 2 && String(b).length === 2 && a % 10 + b % 10 >= 10) out.unshift({ v: parseInt(String(dg(a, 1) + dg(b, 1)) + String(a % 10 + b % 10), 10), why: WHY.both });
    if(String(a).length !== String(b).length){ const lo = Math.min(a, b), hi = Math.max(a, b); out.unshift({ v: hi + lo * 10, why: WHY.align }); }
    return out;
  }
  const NEAR = [10, -10, 100, -100, 1, -1, 20, -20];

  function addExplain(a, b){
    const L = Math.max(String(a).length, String(b).length), steps = [];
    let carry = 0;
    for(let i = 0; i < L; i++){
      const x = dg(a, i), y = dg(b, i), s = x + y + carry;
      let t = '<b>' + cap(COLN[i]) + ':</b> ' + x + ' + ' + y + (carry ? ' + ' + carry + ' (carried)' : '') + ' = <b>' + s + '</b>';
      if(s >= 10 && i < L - 1) t += ' → write <b>' + (s % 10) + '</b>, carry <b>1</b> to the ' + COLN[i + 1] + '.';
      else if(s >= 10) t += ' → write <b>' + s + '</b>: the extra 1 goes in the ' + COLN[i + 1] + ' place.';
      else t += ' → write <b>' + s + '</b>.';
      steps.push(t); carry = s >= 10 ? 1 : 0;
    }
    steps.push('The answer is <b>' + (a + b) + '</b>. ✅');
    return ex(a + ' + ' + b, steps);
  }

  /* number generators */
  function gen(o){
    for(let i = 0; i < 800; i++){
      const a = randInt(o.amin, o.amax), b = randInt(o.bmin, o.bmax), f = carryFlags(a, b), ans = a + b;
      if(ans > (o.maxSum || 999) || (o.minSum && ans < o.minSum)) continue;
      if(o.o !== undefined && o.o !== f.o) continue;
      if(o.t !== undefined && o.t !== f.t) continue;
      if(o.nCarry !== undefined && (f.o + f.t + f.h) !== o.nCarry) continue;
      if(o.nCarryMin !== undefined && (f.o + f.t + f.h) < o.nCarryMin) continue;
      if(a % 10 === 0 || b % 10 === 0) continue;
      return { a: a, b: b, ans: ans, f: f };
    }
    throw new Error('add-column: no numbers');
  }
  function colsFor(c){ return String(c.ans).length; }
  function truthOf(c){ return K.num(c.a + c.b); } // independent of colAdd
  function numFromRows(html){ return readSum(html); }

  function mcqAdd(c, prompt, hint, showCarries){
    const vis = colTable({ a: c.a, b: c.b, cols: colsFor(c), carries: null });
    const wr = wrongList(c.a, c.b);
    const q = mcqNum({ prompt: prompt, visual: vis, answer: colAdd(c.a, c.b, 'ok').value, wrong: wr, nearby: NEAR, valid: function(v){ return v >= 10 && v < 2000; },
      hint: hint || 'Start with the ones column. Write the ones digit of each column total and carry the 1.',
      explain: addExplain(c.a, c.b), truth: c.a + c.b, decode: function(){ return numFromRows(vis); } });
    return q;
  }

  registerSkill({
    id: 'addsub-add-column', strand: 'addsub', name: 'Column addition', emoji: '➕', year: 3, order: 220, prereq: ['addsub-mental-3d'],
    lesson: {
      title: 'Adding in columns',
      steps: [
        { say: 'Write the numbers under each other: <b>ones under ones</b>, <b>tens under tens</b>. Always start on the right, with the <b>ones</b>.', vis: { kind: 'html', args: [colTable({ a: 47, b: 35, cols: 2 })] } },
        { say: 'Ones: 7 + 5 = <b>12</b>. That is 1 ten and 2 ones. Write the <b>2</b> in the ones place and <b>carry</b> the 1 ten. We put the small carry under the line, in the tens column.', vis: { kind: 'html', args: [colTable({ a: 47, b: 35, cols: 2, res: '?2', carries: ['1', ''] })] } },
        { say: 'Tens: 4 + 3 = 7, and add the carried 1: 7 + 1 = <b>8</b>. Write 8 in the tens place. So 47 + 35 = <b>82</b>.', vis: { kind: 'html', args: [colTable({ a: 47, b: 35, cols: 2, res: 82, carries: ['1', ''] })] },
          quiz: { prompt: 'In the ones column, 8 + 6 = 14. What do you write and carry?', options: [{ label: 'Write 4, carry 1', ok: true }, { label: 'Write 14, carry nothing', ok: false }, { label: 'Write 1, carry 4', ok: false }], right: 'Yes! Write the 4 (ones) and carry the 1 (ten) to the next column.', wrong: '14 is 1 ten and 4 ones. The 4 stays in the ones place; the 1 ten is carried to the tens column.' } },
        { say: 'With three digits you may carry twice. Ones: 8 + 7 = 15, write 5, carry 1. Tens: 5 + 6 + 1 = 12, write 2, carry 1. Hundreds: 3 + 2 + 1 = 6.', vis: { kind: 'html', args: [colTable({ a: 358, b: 267, cols: 3, res: 625, carries: ['1', '1', ''] })] },
          quiz: { prompt: 'What is 358 + 267?', options: [{ label: '625', ok: true }, { label: '515', ok: false }, { label: '525', ok: false }], right: 'Yes! 358 + 267 = 625, carrying twice.', wrong: 'Carry from the ones AND from the tens. 358 + 267 = 625.' } }
      ]
    },
    trick: {
      title: 'Write the ones, carry the tens',
      say: 'When a column makes <b>10 or more</b>: write the <b>ones</b> digit underneath and carry the <b>tens</b> digit to the next column. Then <b>add the carry first</b> in that column, so you never forget it!',
      vis: { kind: 'html', args: [colTable({ a: 68, b: 57, cols: 3, res: 125, carries: ['1', '1', ''] })] },
      example: '68 + 57 → 8 + 7 = 15 (write 5, carry 1) → 6 + 5 + 1 = 12 → <b>125</b>'
    },
    gen: {
      1: function(){
        const f = randInt(0, 2);
        if(f === 0){ // 2-digit + 2-digit, carry in the ones
          const c = gen({ amin: 12, amax: 78, bmin: 12, bmax: 78, o: true, t: false, maxSum: 99 });
          return mcqAdd(c, 'Work out <b>' + c.a + ' + ' + c.b + '</b> in columns.');
        }
        if(f === 1){ // what is the tens digit?
          const c = gen({ amin: 12, amax: 78, bmin: 12, bmax: 78, o: true, t: false, maxSum: 99 });
          const vis = colTable({ a: c.a, b: c.b, cols: 2, res: '?' + (c.ans % 10), carries: ['1', ''] });
          const right = Math.floor(c.ans / 10), noCarry = dg(c.a, 1) + dg(c.b, 1);
          return mcqNum({ prompt: 'The ones column is done. What <b>tens digit</b> goes in the answer?', visual: vis, answer: right,
            wrong: [{ v: noCarry, why: 'You forgot the carried 1. Add it in: ' + dg(c.a, 1) + ' + ' + dg(c.b, 1) + ' + 1.' }, { v: right + 1, why: 'The carry is only 1 ten. Count again: ' + dg(c.a, 1) + ' + ' + dg(c.b, 1) + ' + 1.' }, { v: c.ans % 10, why: 'That is the ones digit. We need the tens digit.' }],
            nearby: [1, -1, 2, -2, 3, -3, 4, -4, 5, -5], valid: function(v){ return v >= 0 && v <= 9; },
            hint: 'Add the two tens digits, then add the 1 that was carried.',
            explain: ex('The tens column', ['Tens: <b>' + dg(c.a, 1) + '</b> + <b>' + dg(c.b, 1) + '</b> = ' + noCarry + '.', 'Add the carried 1: ' + noCarry + ' + 1 = <b>' + right + '</b>.', 'So the tens digit is <b>' + right + '</b> and the answer is ' + c.ans + '. ✅']),
            truth: Math.floor((c.a + c.b) / 10), decode: function(){ return Math.floor(readSum(vis) / 10); } });
        }
        const c = gen({ amin: 110, amax: 640, bmin: 110, bmax: 340, nCarry: 0, maxSum: 899 }); // no carrying at all
        return mcqAdd(c, 'Work out <b>' + c.a + ' + ' + c.b + '</b> in columns. No carrying needed!', 'Add each column on its own, starting with the ones.');
      },
      2: function(){
        const f = randInt(0, 3);
        if(f === 0){ const c = gen({ amin: 120, amax: 790, bmin: 120, bmax: 790, nCarryMin: 1, maxSum: 999 }); return mcqAdd(c, 'Work out <b>' + c.a + ' + ' + c.b + '</b> in columns.'); }
        if(f === 1){ const c = gen({ amin: 120, amax: 880, bmin: 12, bmax: 98, nCarryMin: 1, maxSum: 999 }); return mcqAdd(c, 'Work out <b>' + c.a + ' + ' + c.b + '</b>. Line up the ones carefully!', 'The 2-digit number has no hundreds. Ones go under ones, tens under tens.'); }
        if(f === 2){ const c = gen({ amin: 150, amax: 750, bmin: 150, bmax: 250, o: true, t: false, maxSum: 999 }); return mcqAdd(c, 'Work out <b>' + c.a + ' + ' + c.b + '</b>. There is a carry from the ones.'); }
        // spot the mistake
        const c = gen({ amin: 250, amax: 750, bmin: 150, bmax: 250, o: true, t: true, maxSum: 999 });
        const modes = [['dropOnes', 'The carry from the ones to the tens was forgotten'], ['dropTens', 'The carry from the tens to the hundreds was forgotten'], ['none', 'No carries were used at all']];
        const m = pick(modes.slice(0, 2)), wrongVal = colAdd(c.a, c.b, m[0]).value;
        const name = pick(['Ana', 'Marcus', 'Sophie', 'Ivan', 'Lucy', 'Diego', 'Ellen', 'Tom', 'Aisha', 'Kai', 'Mei', 'Leo']);
        const vis = colTable({ a: c.a, b: c.b, cols: 3, res: wrongVal });
        const other = modes.filter(function(x){ return x[0] !== m[0] && x[0] !== 'none'; })[0];
        return mcq({ prompt: name + ' worked out <b>' + c.a + ' + ' + c.b + '</b> and got <b>' + wrongVal + '</b>. What went wrong?', visual: vis,
          correct: opt(K.text(m[0]), m[1]), count: 3, keepOrder: true,
          distractors: [opt(K.text(other[0]), other[1], 'Check each column again: that mistake would give ' + colAdd(c.a, c.b, other[0]).value + ', not ' + wrongVal + '.'),
            opt(K.text('lined'), 'The numbers were lined up the wrong way', 'Both numbers have three digits, so they are lined up fine. Look for a forgotten carry.')],
          hint: 'Work out the right answer in columns, then see which column is different from ' + name + '’s.',
          explain: ex('Finding the mistake', ['The right answer is <b>' + (c.a + c.b) + '</b>, but ' + name + ' got ' + wrongVal + '.', m[0] === 'dropOnes' ? 'The ones column made ' + (c.a % 10 + c.b % 10) + ', so 1 ten should be carried into the tens column. ' + name + ' left it out.' : 'The tens column made 10 or more, so 1 hundred should be carried into the hundreds column. ' + name + ' left it out.', 'So: <b>' + m[1].toLowerCase() + '</b>. ✅']),
          truth: K.text(m[0]), decode: function(){ const a = parseInt(readRow(vis, 'da'), 10), b = parseInt(readRow(vis, 'db'), 10), r = parseInt(readRow(vis, 'dr'), 10); return K.text(colAdd(a, b, 'dropOnes').value === r ? 'dropOnes' : (colAdd(a, b, 'dropTens').value === r ? 'dropTens' : 'x')); } });
      },
      3: function(){
        const f = randInt(0, 3);
        if(f === 0 || f === 1){ // typed, picture or not
          const c = gen({ amin: 250, amax: 890, bmin: 250, bmax: 890, nCarryMin: 2, maxSum: 1250, minSum: 400 });
          const withPic = f === 0, vis = withPic ? colTable({ a: c.a, b: c.b, cols: colsFor(c) }) : '';
          const wl = wrongList(c.a, c.b);
          return numeric({ prompt: 'Work out <b>' + c.a + ' + ' + c.b + '</b>.' + (withPic ? '' : ' Use columns on paper if you like.') + ' Type your answer.', visual: vis, answer: colAdd(c.a, c.b, 'ok').value,
            hint: 'Ones first. Carry each time a column makes 10 or more — you may carry twice.', explain: addExplain(c.a, c.b), truth: c.a + c.b,
            decode: withPic ? function(){ return readSum(vis); } : undefined,
            wrong: function(v){ for(let i = 0; i < wl.length; i++) if(wl[i].v === v) return wl[i].why; return ''; } });
        }
        // hidden digit
        for(let i = 0; i < 500; i++){
          const c = gen({ amin: 150, amax: 790, bmin: 150, bmax: 790, nCarryMin: 1, maxSum: 999 });
          const pos = randInt(0, 2), which = pick(['a', 'b']);
          const x = which === 'a' ? c.a : c.b, y = which === 'a' ? c.b : c.a;
          const s = String(x), hiddenDigit = parseInt(s.charAt(2 - pos), 10);
          const shown = s.substr(0, 2 - pos) + '?' + s.substr(3 - pos);
          const vis = colTable({ a: which === 'a' ? shown : c.a, b: which === 'b' ? shown : c.b, cols: colsFor(c), res: c.ans });
          return numeric({ prompt: 'One digit is hidden by a <b>?</b>. Which digit is it?', visual: vis, answer: hiddenDigit,
            hint: 'Work out the hidden number from the answer: answer take away the other number. Then look at the ' + COLN[pos] + ' digit.',
            explain: ex('Finding the hidden digit', ['The answer is <b>' + c.ans + '</b> and the other number is <b>' + y + '</b>.', 'So the hidden number is ' + c.ans + ' − ' + y + ' = <b>' + x + '</b>.', 'The ' + COLN[pos] + ' digit of ' + x + ' is <b>' + hiddenDigit + '</b>. ✅']),
            truth: Math.floor((c.ans - y) / Math.pow(10, pos)) % 10,
            decode: function(){ const A = readRow(vis, 'da'), B = readRow(vis, 'db'), R = parseInt(readRow(vis, 'dr'), 10); const row = which === 'a' ? A : B, known = parseInt(which === 'a' ? B : A, 10); const p = row.length - 1 - row.indexOf('?'); return Math.floor((R - known) / Math.pow(10, p)) % 10; },
            wrong: function(v){ return v > 9 ? 'A digit is just one number from 0 to 9.' : ''; } });
        }
        throw new Error('add-column: hidden digit failed');
      }
    }
  });
})();
