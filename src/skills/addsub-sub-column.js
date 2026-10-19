/* addsub-sub-column — column subtraction up to 3 digits, with exchanging (borrowing), including zeros */
(function(){
  const COLN = ['ones', 'tens', 'hundreds'], COLH = ['O', 'T', 'H'], SING = ['one', 'ten', 'hundred'];
  const NAMES = ['Ana', 'Marcus', 'Sophie', 'Ivan', 'Lucy', 'Diego', 'Ellen', 'Tom', 'Aisha', 'Kai', 'Mei', 'Leo'];
  function dg(n, i){ return Math.floor(n / Math.pow(10, i)) % 10; }
  function cap(s){ return s.charAt(0).toUpperCase() + s.slice(1); }
  function cellsOf(x, cols){ const s = String(x); const out = []; for(let i = 0; i < cols; i++){ const j = s.length - cols + i; out.push(j >= 0 ? s.charAt(j) : ''); } return out; }

  /* exchange state: the digits of a AFTER all exchanges, just before subtracting each column */
  function exchState(a, b){
    const cur = [dg(a, 0), dg(a, 1), dg(a, 2)], bd = [dg(b, 0), dg(b, 1), dg(b, 2)], changed = [false, false, false], events = [];
    for(let i = 0; i < 3; i++){
      if(cur[i] < bd[i]){
        let j = i + 1; while(j < 3 && cur[j] === 0) j++;
        for(let k = j; k > i; k--){ cur[k] -= 1; cur[k - 1] += 10; changed[k] = true; changed[k - 1] = true; events.push({ from: k, col: i }); }
      }
    }
    return { cur: cur, changed: changed, events: events, exchanges: events.length };
  }
  function colSub(a, b){ // builds `correct` column by column
    const st = exchState(a, b); let v = 0;
    for(let i = 2; i >= 0; i--) v = v * 10 + (st.cur[i] - dg(b, i));
    return v;
  }

  function colTable(o){
    const cols = o.cols || Math.max(String(o.a).length, 2), A = cellsOf(o.a, cols), B = cellsOf(o.b, cols), R = o.res === undefined || o.res === null ? null : cellsOf(o.res, cols);
    const td = 'width:42px;height:40px;padding:0;text-align:center;', INK = 'var(--vis-ink,#1B1B2F)';
    let s = '<table class="colsum" style="border-collapse:collapse;margin:0 auto;font:800 28px ui-monospace,Menlo,monospace;color:' + INK + '">';
    s += '<tr><td style="width:28px"></td>';
    for(let i = 0; i < cols; i++) s += '<td style="' + td + 'height:20px;font-size:13px;color:var(--vis-b,#9B51E0)">' + COLH[cols - 1 - i] + '</td>';
    s += '</tr>';
    if(o.exch){
      s += '<tr><td></td>';
      for(let i = 0; i < cols; i++) s += '<td class="dx" style="' + td + 'height:28px;font-size:18px;color:var(--vis-bad,#EB5757)">' + (o.exch[cols - 1 - i] === null || o.exch[cols - 1 - i] === undefined ? '' : o.exch[cols - 1 - i]) + '</td>';
      s += '</tr>';
    }
    s += '<tr><td></td>';
    for(let i = 0; i < cols; i++) s += '<td class="da" style="' + td + '">' + A[i] + '</td>';
    s += '</tr><tr><td style="font-size:26px">−</td>';
    for(let i = 0; i < cols; i++) s += '<td class="db" style="' + td + '">' + B[i] + '</td>';
    s += '</tr><tr><td style="border-top:3px solid ' + INK + '"></td>';
    for(let i = 0; i < cols; i++) s += '<td class="dr" style="' + td + 'border-top:3px solid ' + INK + ';color:var(--vis-a,#4F8FE8)">' + (R ? R[i] : (A[i] !== '' ? '?' : '')) + '</td>';
    return s + '</tr></table>';
  }
  function exchRow(a, b){ const st = exchState(a, b); return [0, 1, 2].map(function(i){ return st.changed[i] ? st.cur[i] : null; }); }
  function readRow(html, cls){ const re = new RegExp('<td class="' + cls + '"[^>]*>([^<]*)</td>', 'g'); let m, out = ''; while((m = re.exec(html))) out += m[1]; return out; }
  function readDiff(html){ return parseInt(readRow(html, 'da'), 10) - parseInt(readRow(html, 'db'), 10); }

  /* wrong methods */
  function wrongSwap(a, b){ let v = 0; for(let i = 2; i >= 0; i--) v = v * 10 + Math.abs(dg(a, i) - dg(b, i)); return v; }
  function wrongNoReduce(a, b){ let v = 0; for(let i = 2; i >= 0; i--){ let x = dg(a, i); const y = dg(b, i); if(x < y) x += 10; v = v * 10 + (x - y); } return v; }
  const WHY = {
    swap: 'You took the smaller digit from the bigger one in each column. The top digit must stay on top: if it is too small, exchange 1 from the next column.',
    noReduce: 'You exchanged, but forgot to make the next column 1 smaller. If you take 1 ten (or hundred) away to swap it, it is gone from that column.',
    add: 'You added instead of taking away. Look at the minus sign.'
  };
  function wrongList(a, b){
    const ans = a - b, out = [];
    [['swap', wrongSwap(a, b)], ['noReduce', wrongNoReduce(a, b)]].forEach(function(p){ if(p[1] !== ans) out.push({ v: p[1], why: WHY[p[0]] }); });
    out.push({ v: a + b, why: WHY.add });
    return out;
  }
  const NEAR = [10, -10, 100, -100, 1, -1, 20, -20];

  function subExplain(a, b){
    const L = Math.max(String(a).length, 1), steps = [], cur = [dg(a, 0), dg(a, 1), dg(a, 2)], bd = [dg(b, 0), dg(b, 1), dg(b, 2)];
    for(let i = 0; i < Math.min(3, Math.max(String(a).length, String(b).length)); i++){
      let t = '<b>' + cap(COLN[i]) + ':</b> ';
      if(cur[i] < bd[i]){
        t += cur[i] + ' − ' + bd[i] + ' will not work (too small), so exchange. ';
        let j = i + 1; while(j < 3 && cur[j] === 0) j++;
        for(let k = j; k > i; k--){ cur[k] -= 1; cur[k - 1] += 10; t += 'Swap 1 ' + SING[k] + ' for 10 ' + COLN[k - 1] + '. '; }
        t += 'Now ' + cur[i] + ' − ' + bd[i] + ' = <b>' + (cur[i] - bd[i]) + '</b>.';
      } else t += cur[i] + ' − ' + bd[i] + ' = <b>' + (cur[i] - bd[i]) + '</b>.';
      steps.push(t);
    }
    steps.push('The answer is <b>' + (a - b) + '</b>. Check: ' + (a - b) + ' + ' + b + ' = ' + a + ' ✅');
    return ex(a + ' − ' + b, steps);
  }

  function gen(o){
    for(let i = 0; i < 1500; i++){
      const a = randInt(o.amin, o.amax), b = randInt(o.bmin, o.bmax);
      if(b >= a || a - b < (o.minDiff || 5)) continue;
      const st = exchState(a, b);
      if(o.ex && o.ex.indexOf(st.exchanges) === -1) continue;
      if(o.noZero && (dg(a, 0) === 0 || dg(a, 1) === 0 || (a >= 100 && dg(a, 2) === 0))) continue;
      if(o.zeroMid && !(dg(a, 1) === 0 && dg(a, 0) < dg(b, 0) && dg(a, 0) > 0 && dg(b, 1) > 0)) continue;
      if(o.zeroTen && !(dg(a, 1) === 0 && dg(a, 0) === 0 && dg(b, 0) > 0)) continue;
      if(o.oneEx && !(dg(a, 0) < dg(b, 0) && dg(a, 1) >= dg(b, 1) && (a < 100 || dg(a, 2) >= dg(b, 2)))) continue;
      if(o.b0 && (dg(b, 0) === 0)) continue;
      return { a: a, b: b, ans: a - b, st: st };
    }
    throw new Error('sub-column: no numbers');
  }
  function tbl(c, withEx){ return colTable({ a: c.a, b: c.b, exch: withEx ? exchRow(c.a, c.b) : null }); }
  function mcqSub(c, prompt, withEx, hint){
    const vis = tbl(c, withEx);
    return mcqNum({ prompt: prompt, visual: vis, answer: colSub(c.a, c.b), wrong: wrongList(c.a, c.b), nearby: NEAR, valid: function(v){ return v >= 1 && v < 1000; },
      hint: hint || 'Start with the ones. If the top digit is smaller than the bottom digit, exchange 1 from the next column.',
      explain: subExplain(c.a, c.b), truth: c.a - c.b, decode: function(){ return readDiff(vis); } });
  }
  function wrongNum(wl){ return function(v){ for(let i = 0; i < wl.length; i++) if(wl[i].v === v) return wl[i].why; return ''; }; }

  registerSkill({
    id: 'addsub-sub-column', strand: 'addsub', name: 'Column subtraction', emoji: '➖', year: 3, order: 230, prereq: ['addsub-add-column'],
    lesson: {
      title: 'Taking away in columns',
      steps: [
        { say: 'In <b>52 − 27</b> the top number is the one we take away FROM. Start with the ones: <b>2 − 7</b>. We cannot take 7 from 2, so we must <b>exchange</b>.', vis: { kind: 'html', args: [colTable({ a: 52, b: 27 })] } },
        { say: 'Swap <b>1 ten</b> for <b>10 ones</b>. The 5 tens become <b>4 tens</b>, and the 2 ones become <b>12 ones</b>. Look at the little red numbers.', vis: { kind: 'html', args: [colTable({ a: 52, b: 27, exch: exchRow(52, 27) })] } },
        { say: 'Now it works: ones <b>12 − 7 = 5</b>. Tens: <b>4 − 2 = 2</b>. The answer is <b>25</b>. Check by adding: 25 + 27 = 52 ✅', vis: { kind: 'html', args: [colTable({ a: 52, b: 27, exch: exchRow(52, 27), res: 25 })] },
          quiz: { prompt: 'In 74 − 38, the ones need an exchange. How many ones do we have after swapping 1 ten?', options: [{ label: '14 ones', ok: true }, { label: '10 ones', ok: false }, { label: '4 ones', ok: false }], right: 'Yes! 4 ones + 10 ones = 14 ones, and the tens go down to 6.', wrong: 'We keep the 4 ones and add 10 more: 14 ones. The 7 tens become 6 tens.' } },
        { say: 'Careful with a <b>zero</b>! In <b>402 − 158</b> the tens digit is 0, so it has nothing to give. Swap 1 hundred for 10 tens first. Then swap 1 ten for 10 ones. Now: 3 hundreds, 9 tens, 12 ones.', vis: { kind: 'html', args: [colTable({ a: 402, b: 158, exch: exchRow(402, 158) })] },
          quiz: { prompt: 'What is 402 − 158?', options: [{ label: '244', ok: true }, { label: '354', ok: false }, { label: '356', ok: false }], right: 'Yes! 12 − 8 = 4, 9 − 5 = 4, 3 − 1 = 2: 244.', wrong: 'Exchange twice (hundred → tens → ones), then take away: 12 − 8 = 4, 9 − 5 = 4, 3 − 1 = 2. So 244.' } }
      ]
    },
    trick: {
      title: 'Top number too small? Exchange!',
      say: 'Ask in every column: <b>is the top digit big enough?</b> If not, take <b>1</b> from the column on the left and give the column <b>10</b>. Then <b>check by adding</b> your answer to the bottom number.',
      vis: { kind: 'html', args: [colTable({ a: 83, b: 46, exch: exchRow(83, 46) })] },
      example: '83 − 46 → 3 is too small → 7 tens and 13 ones → 13 − 6 = 7, 7 − 4 = 3 → <b>37</b> (check: 37 + 46 = 83)'
    },
    gen: {
      1: function(){
        const f = randInt(0, 2);
        if(f === 0){ const c = gen({ amin: 31, amax: 95, bmin: 12, bmax: 88, oneEx: true, minDiff: 6 }); return mcqSub(c, 'Work out <b>' + c.a + ' − ' + c.b + '</b>. The red numbers show the exchange.', true, 'Use the red numbers: take away column by column, starting with the ones.'); }
        if(f === 1){ // how many ones after exchange
          const c = gen({ amin: 31, amax: 95, bmin: 12, bmax: 88, oneEx: true, minDiff: 6 });
          const vis = tbl(c, false), right = c.a % 10 + 10;
          return mcqNum({ prompt: 'To work out <b>' + c.a + ' − ' + c.b + '</b>, we exchange 1 ten. How many <b>ones</b> do we have after the exchange?', visual: vis, answer: right,
            wrong: [{ v: c.a % 10, why: 'That is how many ones there were before. The exchange gives 10 more ones.' }, { v: 10, why: 'The exchange gives 10 ones, but we still have the ' + plural(c.a % 10, 'one', 'ones') + ' we started with.' }, { v: Math.floor(c.a / 10) - 1, why: 'That is how many TENS are left. We want the ones.' }],
            nearby: [1, -1, 2, -2, 10], valid: function(v){ return v >= 1 && v < 30; },
            hint: 'You keep the ones you already have and add the 10 ones from the exchanged ten.',
            explain: ex('Exchanging a ten', ['The ones digit is <b>' + (c.a % 10) + '</b> and ' + (c.a % 10) + ' − ' + (c.b % 10) + ' will not work.', 'Swap 1 ten for 10 ones: ' + (c.a % 10) + ' + 10 = <b>' + right + '</b> ones.', 'Now ' + right + ' − ' + (c.b % 10) + ' = ' + (right - c.b % 10) + '. ✅']),
            truth: 10 + (c.a - Math.floor(c.a / 10) * 10), decode: function(){ return parseInt(readRow(vis, 'da').slice(-1), 10) + 10; } });
        }
        // what do we do?
        const c = gen({ amin: 31, amax: 95, bmin: 12, bmax: 88, oneEx: true, minDiff: 6 });
        const vis = tbl(c, false), x = c.a % 10, y = c.b % 10;
        return mcq({ prompt: 'In <b>' + c.a + ' − ' + c.b + '</b>, the ones column is ' + x + ' − ' + y + '. What should we do?', visual: vis,
          correct: opt(K.text('exchange'), 'Exchange 1 ten for 10 ones'), keepOrder: true, count: 3,
          distractors: [opt(K.text('swap'), 'Do ' + y + ' − ' + x + ' instead', 'You cannot flip the numbers. The top number is what we take away FROM, so we need to exchange.'),
            opt(K.text('skip'), 'Ignore the ones and do the tens', 'Every column needs an answer. Exchange 1 ten for 10 ones so the ones can be subtracted.'),
            opt(K.text('add'), 'Add 10 to the tens', 'We swap 1 ten for 10 ONES. The tens column gets 1 smaller, not bigger.')],
          hint: 'Can you take ' + y + ' away from ' + x + '? What can the tens column give?',
          explain: ex('Exchanging', [x + ' − ' + y + ' will not work: ' + x + ' is too small.', 'So <b>exchange 1 ten for 10 ones</b>: the tens go down by 1 and the ones become ' + (x + 10) + '.', 'Then ' + (x + 10) + ' − ' + y + ' = ' + (x + 10 - y) + '. ✅']),
          truth: K.text(x < y ? 'exchange' : 'no'), decode: function(){ const A = readRow(vis, 'da'), B = readRow(vis, 'db'); return K.text(parseInt(A.slice(-1), 10) < parseInt(B.slice(-1), 10) ? 'exchange' : 'no'); } });
      },
      2: function(){
        const f = randInt(0, 3);
        if(f === 0){ const c = gen({ amin: 231, amax: 985, bmin: 112, bmax: 876, ex: [1], noZero: true, minDiff: 11 }); return mcqSub(c, 'Work out <b>' + c.a + ' − ' + c.b + '</b> in columns.'); }
        if(f === 1){ const c = gen({ amin: 231, amax: 985, bmin: 112, bmax: 876, ex: [2], noZero: true, minDiff: 11 }); return mcqSub(c, 'Work out <b>' + c.a + ' − ' + c.b + '</b>. You will need to exchange twice.'); }
        if(f === 2){ const c = gen({ amin: 231, amax: 985, bmin: 12, bmax: 98, ex: [1, 2], noZero: true, minDiff: 20, b0: true }); return mcqSub(c, 'Work out <b>' + c.a + ' − ' + c.b + '</b>. Line up the ones carefully!', false, 'The 2-digit number has no hundreds. Ones go under ones, tens under tens.'); }
        // spot the mistake
        const c = gen({ amin: 321, amax: 985, bmin: 112, bmax: 876, ex: [1, 2], noZero: true, minDiff: 20 });
        const sw = wrongSwap(c.a, c.b), nr = wrongNoReduce(c.a, c.b);
        const useSwap = chance(0.5), shown = useSwap ? sw : nr, name = pick(NAMES);
        if(shown === c.ans || sw === nr) return mcqSub(c, 'Work out <b>' + c.a + ' − ' + c.b + '</b> in columns.');
        const vis = colTable({ a: c.a, b: c.b, res: shown });
        const labSwap = 'The smaller digit was taken from the bigger digit in a column', labNo = 'An exchange was made, but the next column was not made 1 smaller';
        return mcq({ prompt: name + ' worked out <b>' + c.a + ' − ' + c.b + '</b> and got <b>' + shown + '</b>. What went wrong?', visual: vis,
          correct: opt(K.text(useSwap ? 'swap' : 'noreduce'), useSwap ? labSwap : labNo), count: 3, keepOrder: true,
          distractors: [opt(K.text(useSwap ? 'noreduce' : 'swap'), useSwap ? labNo : labSwap, 'That mistake would give ' + (useSwap ? nr : sw) + ', not ' + shown + '.'),
            opt(K.text('added'), 'The numbers were added instead of subtracted', 'Adding would give ' + (c.a + c.b) + '. Look again at what happened in the columns.')],
          hint: 'Work out the right answer, then find the column where ' + name + '’s digit is different.',
          explain: ex('Finding the mistake', ['The right answer is <b>' + c.ans + '</b>, but ' + name + ' got ' + shown + '.', useSwap ? 'In a column where the top digit was too small, ' + name + ' did the bigger digit minus the smaller one instead of exchanging.' : name + ' added 10 to a column but forgot to take 1 away from the next column.', 'So: <b>' + (useSwap ? labSwap : labNo).toLowerCase() + '</b>. ✅']),
          truth: K.text(useSwap ? 'swap' : 'noreduce'), decode: function(){ const a = parseInt(readRow(vis, 'da'), 10), b = parseInt(readRow(vis, 'db'), 10), r = parseInt(readRow(vis, 'dr'), 10); return K.text(wrongSwap(a, b) === r ? 'swap' : (wrongNoReduce(a, b) === r ? 'noreduce' : 'x')); } });
      },
      3: function(){
        const f = randInt(0, 4);
        if(f === 0 || f === 1){ // typed, zero in the middle (or double zero)
          const c = f === 0 ? gen({ amin: 301, amax: 909, bmin: 112, bmax: 897, zeroMid: true, minDiff: 20 }) : gen({ amin: 300, amax: 900, bmin: 111, bmax: 899, zeroTen: true, minDiff: 20 });
          const vis = tbl(c, chance(0.3)), wl = wrongList(c.a, c.b);
          return numeric({ prompt: 'Work out <b>' + c.a + ' − ' + c.b + '</b>. Watch out for the zero! Type your answer.', visual: vis, answer: colSub(c.a, c.b),
            hint: 'The ' + (dg(c.a, 1) === 0 ? 'tens digit is 0, so it has nothing to give. Exchange from the hundreds first.' : 'zero cannot give anything. Exchange from the hundreds first.'),
            explain: subExplain(c.a, c.b), truth: c.a - c.b, decode: function(){ return readDiff(vis); }, wrong: wrongNum(wl) });
        }
        if(f === 2){ // typed, no picture, two exchanges
          const c = gen({ amin: 321, amax: 985, bmin: 143, bmax: 898, ex: [2], noZero: true, minDiff: 30 }), wl = wrongList(c.a, c.b);
          return numeric({ prompt: 'Work out <b>' + c.a + ' − ' + c.b + '</b>. Use columns on paper if you like. Type your answer.', answer: colSub(c.a, c.b),
            hint: 'Ones first. Exchange whenever the top digit is smaller than the bottom digit.', explain: subExplain(c.a, c.b), truth: c.a - c.b, wrong: wrongNum(wl) });
        }
        if(f === 3){ // hidden digit
          for(let i = 0; i < 500; i++){
            const c = gen({ amin: 231, amax: 985, bmin: 112, bmax: 876, ex: [1, 2], noZero: true, minDiff: 20 });
            const pos = randInt(0, 2), which = pick(['a', 'b']);
            const x = which === 'a' ? c.a : c.b, s = String(x);
            const shown = s.substr(0, 2 - pos) + '?' + s.substr(3 - pos), hiddenDigit = parseInt(s.charAt(2 - pos), 10);
            const vis = colTable({ a: which === 'a' ? shown : c.a, b: which === 'b' ? shown : c.b, res: c.ans });
            return numeric({ prompt: 'One digit is hidden by a <b>?</b>. Which digit is it?', visual: vis, answer: hiddenDigit,
              hint: 'Use the answer to find the hidden number. Remember: top number − bottom number = answer.',
              explain: ex('Finding the hidden digit', which === 'a' ? ['Top − bottom = answer, so top = ' + c.b + ' + ' + c.ans + ' = <b>' + c.a + '</b>.', 'The ' + COLN[pos] + ' digit of ' + c.a + ' is <b>' + hiddenDigit + '</b>.', 'Check: ' + c.a + ' − ' + c.b + ' = ' + c.ans + '. ✅'] : ['Bottom = top − answer, so bottom = ' + c.a + ' − ' + c.ans + ' = <b>' + c.b + '</b>.', 'The ' + COLN[pos] + ' digit of ' + c.b + ' is <b>' + hiddenDigit + '</b>.', 'Check: ' + c.a + ' − ' + c.b + ' = ' + c.ans + '. ✅']),
              truth: Math.floor(x / Math.pow(10, pos)) % 10,
              decode: function(){ const A = readRow(vis, 'da'), B = readRow(vis, 'db'), R = parseInt(readRow(vis, 'dr'), 10); const row = which === 'a' ? A : B; const p = row.length - 1 - row.indexOf('?'); const val = which === 'a' ? parseInt(B, 10) + R : parseInt(A, 10) - R; return Math.floor(val / Math.pow(10, p)) % 10; },
              wrong: function(v){ return v > 9 ? 'A digit is just one number from 0 to 9.' : ''; } });
          }
        }
        // which column first?
        const c = gen({ amin: 301, amax: 909, bmin: 112, bmax: 897, zeroMid: true, minDiff: 20 });
        const vis = tbl(c, false);
        return mcq({ prompt: 'In <b>' + c.a + ' − ' + c.b + '</b>, the ones need an exchange but the tens digit is 0. What happens first?', visual: vis,
          correct: opt(K.text('h2t'), 'Swap 1 hundred for 10 tens'), keepOrder: true, count: 3,
          distractors: [opt(K.text('t2o'), 'Swap 1 ten for 10 ones', 'There is no ten to swap — the tens digit is 0! First get some tens from the hundreds.'),
            opt(K.text('zero'), 'Write 0 and carry on', 'A zero cannot just be skipped. The ones still need an exchange, and the tens have nothing to give yet.'),
            opt(K.text('flip'), 'Take ' + (c.a % 10) + ' from ' + (c.b % 10) + ' instead', 'The top number is always what we take away FROM.')],
          hint: 'You can only swap a ten for ones if you HAVE a ten. Where can you get tens from?',
          explain: ex('Zero in the middle', ['The ones column needs help, but the tens digit is <b>0</b>.', 'So first swap <b>1 hundred for 10 tens</b>. The hundreds go down by 1.', 'Then swap 1 ten for 10 ones: you now have ' + plural(dg(c.a, 2) - 1, 'hundred') + ', 9 tens and ' + (c.a % 10 + 10) + ' ones. ✅']),
          truth: K.text(dg(c.a, 1) === 0 ? 'h2t' : 'no'), decode: function(){ const A = readRow(vis, 'da'); return K.text(A.charAt(1) === '0' ? 'h2t' : 'no'); } });
      }
    }
  });
})();
