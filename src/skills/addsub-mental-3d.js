/* addsub-mental-3d — add and subtract ones, tens and hundreds to/from a 3-digit number, in your head */
(function(){
  const UNIT = { o: 1, t: 10, h: 100 }, UNAME = { o: 'ones', t: 'tens', h: 'hundreds' }, USING = { o: 'one', t: 'ten', h: 'hundred' };
  function dg(n, k){ return k === 'o' ? n % 10 : (k === 't' ? Math.floor(n / 10) % 10 : Math.floor(n / 100) % 10); }

  /* correct answers use direct arithmetic; truth is recomputed by counting up/down one unit at a time */
  function stepTruth(c){ let x = c.a; for(let i = 0; i < c.d; i++) x = c.op === '+' ? x + c.u : x - c.u; return x; }

  function genCase(o){
    for(let i = 0; i < 600; i++){
      const k = pick(o.kinds), op = pick(o.ops), d = randInt(1, 9), u = UNIT[k];
      const a = randInt(o.min || 100, o.max || 999), amt = d * u;
      const ans = op === '+' ? a + amt : a - amt;
      if(ans < (o.minAns || 100) || ans > 999) continue;
      const dig = dg(a, k);
      const cross = op === '+' ? dig + d > 9 : dig - d < 0;
      if(o.cross === true && !cross) continue;
      if(o.cross === false && cross) continue;
      if(k === 'h' && cross) continue;
      if(cross && op === '-' && a % (u * 10) === 0) continue;
      if(o.chain && !(k === 'o' && dg(a, 't') === (op === '+' ? 9 : 0))) continue;
      if(a % 100 === 0 || (k === 'o' && a % 10 === 0)) continue;
      return { a: a, op: op, k: k, d: d, u: u, amt: amt, ans: ans, cross: cross };
    }
    throw new Error('mental: no case');
  }
  function uw(d, k){ return d === 1 ? USING[k] : UNAME[k]; }
  function sym(op){ return op === '+' ? '+' : '−'; }
  function sentence(c){ return c.a + ' ' + sym(c.op) + ' ' + c.amt; }

  function wrongList(c){
    const out = [], a = c.a, ans = c.ans, other = ['o', 't', 'h'].filter(function(k){ return k !== c.k; });
    other.forEach(function(k){
      const v = c.op === '+' ? a + c.d * UNIT[k] : a - c.d * UNIT[k];
      out.push({ v: v, why: 'You changed the ' + UNAME[k] + ' digit. But ' + c.amt + ' is ' + c.d + ' ' + uw(c.d, c.k) + ', so the ' + UNAME[c.k] + ' digit changes.' });
    });
    out.push({ v: c.op === '+' ? a - c.amt : a + c.amt, why: 'You ' + (c.op === '+' ? 'took away' : 'added') + ' instead of ' + (c.op === '+' ? 'adding' : 'taking away') + '. Look at the sign again.' });
    if(c.cross){
      if(c.op === '+') out.unshift({ v: ans - c.u * 10, why: 'You forgot the carried ' + (c.k === 'o' ? 'ten' : 'hundred') + '. When you go past ' + (c.k === 'o' ? '9 ones' : '9 tens') + ' the next digit goes up by 1.' });
      else out.unshift({ v: ans + c.u * 10, why: 'You forgot to take 1 from the next digit. Going below 0 ' + UNAME[c.k] + ' means the ' + (c.k === 'o' ? 'tens' : 'hundreds') + ' digit goes down by 1.' });
    }
    return out;
  }
  const NEAR = [10, -10, 100, -100, 1, -1, 2, -2, 20, -20];
  function valid3(v){ return v >= 10 && v < 1000; }

  function explainCase(c){
    const a = c.a, d = c.d, t = [];
    const nm = UNAME[c.k], nxt = c.k === 'o' ? 'tens' : 'hundreds';
    if(!c.cross){
      const dig = dg(a, c.k), nd = c.op === '+' ? dig + d : dig - d;
      t.push('<b>' + c.amt + '</b> is ' + d + ' ' + uw(d, c.k) + ', so only the <b>' + nm + '</b> digit changes.');
      t.push('The ' + nm + ' digit is ' + dig + '. ' + dig + ' ' + sym(c.op) + ' ' + d + ' = <b>' + nd + '</b>.');
      t.push(a + ' ' + sym(c.op) + ' ' + c.amt + ' = <b>' + c.ans + '</b>. ✅');
    } else if(c.k === 'o'){
      const B = 10, s1 = c.op === '+' ? B - a % B : a % B, s2 = c.amt - s1, mid = c.op === '+' ? a + s1 : a - s1;
      t.push(c.op === '+' ? 'Make a ten first: ' + a + ' + ' + s1 + ' = <b>' + mid + '</b>.' : 'Go back to the ten first: ' + a + ' − ' + s1 + ' = <b>' + mid + '</b>.');
      t.push('You have used ' + s1 + ' of the ' + c.amt + '. That leaves ' + c.amt + ' − ' + s1 + ' = <b>' + s2 + '</b> to go.');
      t.push(mid + ' ' + sym(c.op) + ' ' + s2 + ' = <b>' + c.ans + '</b>. ✅');
    } else {
      const dig = dg(a, 't');
      if(c.op === '+'){
        t.push('Look at the tens: ' + dig + ' tens + ' + d + ' ' + uw(d, 't') + ' = <b>' + (dig + d) + ' tens</b>.');
        t.push((dig + d) + ' tens is 1 hundred and ' + (dig + d - 10) + ' tens, so the hundreds go up by 1 and the tens digit is ' + (dig + d - 10) + '.');
      } else {
        t.push('We cannot take ' + d + ' ' + uw(d, 't') + ' from ' + dig + ' tens. Swap 1 hundred for 10 tens: ' + (dig + 10) + ' tens.');
        t.push((dig + 10) + ' tens − ' + d + ' ' + uw(d, 't') + ' = <b>' + (dig + 10 - d) + ' tens</b>, and the hundreds digit goes down by 1.');
      }
      t.push(a + ' ' + sym(c.op) + ' ' + c.amt + ' = <b>' + c.ans + '</b>. ✅');
    }
    return ex(a + ' ' + sym(c.op) + ' ' + c.amt, t);
  }
  function hintCase(c){
    if(c.cross && c.k === 'o') return c.op === '+' ? 'Make a ten first: how many more to reach the next ten? Then add what is left over.' : 'Count back to the ten first, then take away what is left over.';
    if(c.cross) return 'Think in ' + UNAME[c.k] + ': what happens when the ' + UNAME[c.k] + ' digit goes past 9 (or below 0)?';
    return 'Which digit is worth ' + c.amt + '? Only that digit changes — the others stay the same.';
  }
  function nlFor(c){
    const lo = Math.min(c.a, c.ans), hi = Math.max(c.a, c.ans);
    if(c.k === 'o') return V.numberLine({ min: Math.floor(lo / 10) * 10, max: Math.ceil(hi / 10) * 10, minor: 1, major: 5, marks: [{ value: c.a }] });
    return V.numberLine({ min: Math.floor(lo / 100) * 100, max: Math.ceil(hi / 100) * 100, minor: 10, major: 50, marks: [{ value: c.a }] });
  }
  function nlStart(html){ return Math.round(V.decodeNumberLine(html)); }
  function wordsOf(c){
    if(chance(0.5)) return 'What is <b>' + sentence(c) + '</b>?';
    return 'What number is <b>' + c.amt + ' ' + (c.op === '+' ? 'more' : 'less') + '</b> than <b>' + c.a + '</b>?';
  }
  function numQ(c, prompt, visual, decode){
    const q = mcqNum({ prompt: prompt, visual: visual, answer: c.ans, wrong: wrongList(c), nearby: NEAR, valid: valid3,
      hint: hintCase(c), explain: explainCase(c), truth: stepTruth(c), decode: decode });
    return q;
  }

  registerSkill({
    id: 'addsub-mental-3d', strand: 'addsub', name: 'Add & subtract 1s, 10s, 100s', emoji: '🧮', year: 3, order: 210, prereq: ['number-place-value'],
    lesson: {
      title: 'Adding and taking away in your head',
      steps: [
        { say: 'Every 3-digit number is made of <b>hundreds</b>, <b>tens</b> and <b>ones</b>. This is <b>346</b>: 3 hundreds, 4 tens and 6 ones.', vis: { kind: 'baseTen', args: [3, 4, 6] } },
        { say: 'To add <b>20</b>, add 2 tens. Only the <b>tens</b> change: 4 tens + 2 tens = 6 tens. So <b>346 + 20 = 366</b>. The hundreds and ones stay the same.', vis: { kind: 'baseTen', args: [3, 6, 6] } },
        { say: 'Here is <b>512</b>. To take away <b>300</b>, we remove 3 hundreds. Only the <b>hundreds</b> change: 5 − 3 = 2.', vis: { kind: 'baseTen', args: [5, 1, 2] },
          quiz: { prompt: 'What is 512 − 300?', options: [{ label: '212', ok: true }, { label: '482', ok: false }, { label: '509', ok: false }], right: 'Yes! Only the hundreds change: 5 − 3 = 2, so 212.', wrong: 'Take 3 HUNDREDS from the hundreds digit (5 − 3 = 2). The tens and ones stay: 212.' } },
        { say: 'What if the ones go past 9? Try <b>285 + 7</b>. Jump to the next ten first: 285 + 5 = 290. Then add the 2 left over: 290 + 2 = <b>292</b>.', vis: { kind: 'numberLine', args: [{ min: 280, max: 300, minor: 1, major: 5, marks: [{ value: 285 }] }] } },
        { say: 'Use the same trick for <b>396 + 7</b>. Jump to the next hundred first. How far is it from 396 to 400?', vis: { kind: 'numberLine', args: [{ min: 390, max: 410, minor: 1, major: 5, marks: [{ value: 396 }] }] },
          quiz: { prompt: 'What is 396 + 7?', options: [{ label: '403', ok: true }, { label: '393', ok: false }, { label: '413', ok: false }], right: 'Yes! 396 + 4 = 400, then 400 + 3 = 403.', wrong: 'Jump to 400 first (that is 4), then add the 3 left over: 400 + 3 = 403.' } }
      ]
    },
    trick: {
      title: 'Make a ten (or a hundred)',
      say: 'When you cross a tens or hundreds line, <b>jump to the line first</b>. Then add what is left over. It is much easier than doing it all in one go!',
      vis: { kind: 'numberLine', args: [{ min: 70, max: 90, minor: 1, major: 5, marks: [{ value: 78 }] }] },
      example: '78 + 5 → 78 + 2 = 80 → 80 + 3 = <b>83</b>'
    },
    gen: {
      1: function(){ // blocks + no crossing
        const c = genCase({ kinds: ['o', 't', 'h'], ops: ['+', '-'], cross: false, min: 110, max: 899 });
        const vis = V.baseTen(Math.floor(c.a / 100), Math.floor(c.a / 10) % 10, c.a % 10);
        return numQ(c, 'Here is ' + c.a + ' in blocks. ' + wordsOf(c), vis, function(){ return V.decodeBaseTen(vis) + (c.op === '+' ? c.amt : -c.amt); });
      },
      2: function(){
        const f = randInt(0, 3);
        if(f === 0){ // number line, crossing a ten or hundred
          const c = genCase({ kinds: ['o', 't'], ops: ['+', '-'], cross: true });
          const vis = nlFor(c);
          return numQ(c, 'The dot shows ' + c.a + '. ' + wordsOf(c), vis, function(){ return nlStart(vis) + (c.op === '+' ? c.amt : -c.amt); });
        }
        if(f === 1){ // plain, crossing
          const c = genCase({ kinds: ['o', 't'], ops: ['+', '-'], cross: true });
          return numQ(c, wordsOf(c), '', null);
        }
        if(f === 2){ // plain, no crossing, any column
          const c = genCase({ kinds: ['o', 't', 'h'], ops: ['+', '-'], cross: false });
          return numQ(c, wordsOf(c), '', null);
        }
        // missing number: a + □ = result (find the small amount)
        const c = genCase({ kinds: ['o', 't'], ops: ['+'], cross: chance(0.6) });
        return mcqNum({ prompt: 'Fill the gap: <b>' + c.a + ' + □ = ' + c.ans + '</b>', answer: c.amt,
          wrong: [{ v: c.ans + c.a, why: 'You added the two numbers. The gap is how much to ADD to ' + c.a + ' to reach ' + c.ans + '.' }, { v: c.amt / 10 >= 1 ? c.amt / 10 : c.amt * 10, why: 'Check the place value. Is the jump in ones, tens or hundreds?' }],
          nearby: c.amt >= 10 ? [10, -10, 1, -1, 20, -20] : [1, -1, 2, -2, 3, -3, 10], valid: function(v){ return v > 0 && v < 100; },
          hint: 'Count on from ' + c.a + ' to ' + c.ans + '. Which digits are different?',
          explain: ex('Finding the gap', ['Start at <b>' + c.a + '</b> and count on to <b>' + c.ans + '</b>.', 'Take away: ' + c.ans + ' − ' + c.a + ' = <b>' + c.amt + '</b>.', 'Check: ' + c.a + ' + ' + c.amt + ' = ' + c.ans + '. ✅']),
          truth: stepTruth({ a: c.a, op: '+', d: c.d, u: c.u }) - c.a });
      },
      3: function(){
        const f = randInt(0, 3);
        if(f === 0){ // typed, chain crossing (399+... style)
          const c = genCase({ kinds: ['o'], ops: ['+', '-'], cross: true, chain: true });
          const w = wrongList(c);
          return numeric({ prompt: wordsOf(c) + ' Type your answer.', answer: c.ans, hint: hintCase(c), explain: explainCase(c), truth: stepTruth(c),
            wrong: function(v){ for(let i = 0; i < w.length; i++) if(w[i].v === v) return w[i].why; return ''; } });
        }
        if(f === 1){ // typed, tens crossing hundreds or mixed
          const c = genCase({ kinds: ['o', 't', 'h'], ops: ['+', '-'], cross: null });
          const w = wrongList(c);
          return numeric({ prompt: wordsOf(c) + ' Type your answer.', answer: c.ans, hint: hintCase(c), explain: explainCase(c), truth: stepTruth(c),
            wrong: function(v){ for(let i = 0; i < w.length; i++) if(w[i].v === v) return w[i].why; return ''; } });
        }
        if(f === 2){ // how much to make the next hundred
          let a = randInt(101, 989);
          while(a % 100 === 0 || a % 100 > 95) a = randInt(101, 989);
          const target = (Math.floor(a / 100) + 1) * 100, ans = 100 - a % 100;
          const s1 = a % 10 === 0 ? 0 : 10 - a % 10, mid = a + s1;
          return numeric({ prompt: 'What must you add to <b>' + a + '</b> to make <b>' + target + '</b>?', answer: ans,
            hint: 'Jump to the next ten first, then jump from there to ' + target + '.',
            explain: ex('Making ' + target, s1 ? [a + ' + ' + s1 + ' = <b>' + mid + '</b> (the next ten).', mid + ' + ' + (target - mid) + ' = <b>' + target + '</b>.', s1 + ' + ' + (target - mid) + ' = <b>' + ans + '</b>. ✅'] : [a + ' is on a tens line already.', a + ' + ' + ans + ' = <b>' + target + '</b>.', 'The answer is <b>' + ans + '</b>. ✅']),
            truth: target - a, wrong: function(v){ return v === a % 100 ? 'That is the part you already have. You need the part still missing to reach ' + target + '.' : ''; } });
        }
        // two steps
        for(let i = 0; i < 200; i++){
          const a = randInt(150, 850), k1 = pick(['h', 't']), k2 = pick(['t', 'o']);
          if(k1 === k2) continue;
          const x = randInt(1, 6) * UNIT[k1], y = randInt(1, 9) * UNIT[k2];
          const op1 = pick(['+', '-']), op2 = pick(['+', '-']);
          const mid = op1 === '+' ? a + x : a - x, ans = op2 === '+' ? mid + y : mid - y;
          if(ans < 100 || ans > 999 || mid < 100 || mid > 999 || a % 10 === 0) continue;
          let t = a; // truth: apply as signed list
          [[op1, x], [op2, y]].forEach(function(p){ t += (p[0] === '+' ? 1 : -1) * p[1]; });
          return numeric({ prompt: 'Work out <b>' + a + ' ' + sym(op1) + ' ' + x + ' ' + sym(op2) + ' ' + y + '</b> in two steps.', answer: ans,
            hint: 'Do the first jump, write the answer down, then do the second jump.',
            explain: ex('Two jumps', ['First: ' + a + ' ' + sym(op1) + ' ' + x + ' = <b>' + mid + '</b>.', 'Second: ' + mid + ' ' + sym(op2) + ' ' + y + ' = <b>' + ans + '</b>.', 'So the answer is <b>' + ans + '</b>. ✅']),
            truth: t, wrong: function(v){ return v === mid ? 'That is only the first step. Do the second jump too.' : ''; } });
        }
        throw new Error('mental: no two-step case');
      }
    }
  });
})();
