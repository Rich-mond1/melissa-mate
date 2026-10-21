/* addsub-missing-inverse — missing number problems, inverse operations as a check, estimating by rounding */
(function(){
  const NAMES = ['Ana', 'Marcus', 'Sophie', 'Ivan', 'Lucy', 'Diego', 'Ellen', 'Tom', 'Aisha', 'Kai', 'Mei', 'Leo'];
  function dg(n, i){ return Math.floor(n / Math.pow(10, i)) % 10; }
  function r10(n){ return Math.floor((n + 5) / 10) * 10; }
  function r100(n){ return Math.floor((n + 50) / 100) * 100; }
  function rnd(a, b){ let x = randInt(a, b); while(x % 10 === 0) x = randInt(a, b); return x; }
  function wrongNum(wl){ return function(v){ for(let i = 0; i < wl.length; i++) if(wl[i].v === v) return wl[i].why; return ''; }; }
  function swapSub(hi, lo){ let v = 0; for(let i = 2; i >= 0; i--) v = v * 10 + Math.abs(dg(hi, i) - dg(lo, i)); return v; }

  /* ---- missing number equations. m = the missing number, k = the known number ---- */
  const FORMS = {
    A: { text: function(k, m){ return '<b>' + k + ' + □ = ' + (k + m) + '</b>'; }, test: function(x, k, m){ return k + x === k + m; } },
    B: { text: function(k, m){ return '<b>□ + ' + k + ' = ' + (k + m) + '</b>'; }, test: function(x, k, m){ return x + k === k + m; } },
    C: { text: function(k, m){ return '<b>' + (k + m) + ' − □ = ' + k + '</b>'; }, test: function(x, k, m){ return (k + m) - x === k; } },
    D: { text: function(k, m){ return '<b>□ − ' + k + ' = ' + m + '</b>'; }, test: function(x, k, m){ return x - k === m; } }
  };
  /* for form D the missing number is the start amount: m_missing = k + m; handle with `ans` */
  function solveTruth(form, k, m, ans){ // search for the number that makes the sentence true
    for(let x = 0; x < 2000; x++){
      if(form === 'D'){ if(x - k === m) return x; } else if(FORMS[form].test(x, k, m)) return x;
    }
    return -1;
  }
  function eqExplain(form, k, m, ans, total){
    const t = total;
    if(form === 'A' || form === 'B') return ex('Finding the missing number', ['The whole is <b>' + t + '</b> and one part is <b>' + k + '</b>.', 'Use the inverse (opposite): ' + t + ' − ' + k + ' = <b>' + ans + '</b>.', 'Check: ' + k + ' + ' + ans + ' = ' + t + '. ✅']);
    if(form === 'C') return ex('Finding the missing number', ['We start with <b>' + t + '</b> and take away □ to leave <b>' + k + '</b>.', 'So □ is the part taken away: ' + t + ' − ' + k + ' = <b>' + ans + '</b>.', 'Check: ' + t + ' − ' + ans + ' = ' + k + '. ✅']);
    return ex('Finding the missing number', ['Some number, take away <b>' + k + '</b>, leaves <b>' + m + '</b>.', 'Use the inverse (adding back): ' + m + ' + ' + k + ' = <b>' + ans + '</b>.', 'Check: ' + ans + ' − ' + k + ' = ' + m + '. ✅']);
  }
  function eqWrongs(form, k, m, ans, total){
    const out = [];
    if(form === 'D'){
      if(m - k > 0) out.push({ v: m - k, why: 'You took ' + k + ' away from ' + m + '. But ' + k + ' was already taken away to GET ' + m + ': add it back instead.' });
      out.push({ v: k, why: 'That is the number given in the sum. The missing number is the one you start with.' });
      out.push({ v: m, why: 'That is what is left over. The missing number is what you started with, before taking ' + k + ' away.' });
    } else if(form === 'C'){
      out.push({ v: total + k, why: 'You added. Something was TAKEN AWAY from ' + total + ', so the missing number is ' + total + ' − ' + k + '.' });
      out.push({ v: k, why: 'That is what is left after taking away. We want the amount that was taken away.' });
      out.push({ v: total, why: 'That is the starting amount. We want the amount that was taken away.' });
    } else {
      out.push({ v: total + k, why: 'You added the two numbers. The ' + total + ' is the TOTAL, so take ' + k + ' away from it.' });
      out.push({ v: k, why: 'That is the number already in the sum. The missing number is the other part.' });
      out.push({ v: total, why: 'That is the total. The missing number is only one part of it.' });
    }
    const sw = form === 'D' ? 0 : swapSub(total, k);
    if(sw > 0 && sw !== ans) out.push({ v: sw, why: 'You took the smaller digit from the bigger digit in each column. Use the inverse and exchange when you need to.' });
    return out;
  }
  function eqQ(form, k, m, lim, typed){
    const total = k + m, ans = form === 'D' ? k + m : m, wl = eqWrongs(form, k, m, ans, total);
    const eqTotal = form === 'D' ? m : total;
    const prompt = (typed ? 'Find the missing number: ' : 'Which number goes in the box? ') + FORMS[form].text(k, m) + (typed ? '. Type your answer.' : '');
    const hint = form === 'D' ? 'Work backwards: what do you get if you ADD ' + k + ' back on to ' + m + '?' : (form === 'C' ? 'Something is taken away from ' + total + ' to leave ' + k + '. How much was it?' : 'The total is ' + total + '. Take away the part you know to find the part you do not.');
    const explain = eqExplain(form, k, form === 'D' ? m : m, ans, form === 'D' ? m : total);
    const truth = solveTruth(form, k, m);
    if(typed) return numeric({ prompt: prompt, answer: ans, hint: hint, explain: explain, truth: truth, wrong: wrongNum(wl) });
    return mcqNum({ prompt: prompt, answer: ans, wrong: wl, nearby: [10, -10, 1, -1, 2, -2, 20, -20], valid: function(v){ return v > 0 && v < lim; }, hint: hint, explain: explain, truth: truth });
  }

  /* ---- bar model decoder (reads the drawn parts and total) ---- */
  function barRead(html){
    const parts = []; let m; const re = /class="bpart" data-v="([^"]*)"/g;
    while((m = re.exec(html))) parts.push(m[1]);
    const t = /<div style="text-align:center;font-weight:900;[^"]*">([^<]*)<\/div>/.exec(html);
    return { parts: parts, total: t ? t[1] : '' };
  }
  function barMissing(html){ const b = barRead(html), tot = parseInt(b.total, 10); let known = 0; b.parts.forEach(function(p){ if(p !== '?') known += parseInt(p, 10); }); return tot - known; }

  /* ---- inverse facts ---- */
  function inverseQ(typed, big){
    const addFirst = chance(0.5), a = big ? randInt(101, 489) : randInt(21, 69), b = big ? randInt(101, 489) : randInt(21, 69), s = a + b;
    const useA = chance(0.5), known = useA ? a : b, ans = useA ? b : a;
    let fact, ask, why1, wl;
    if(addFirst){
      fact = a + ' + ' + b + ' = ' + s; ask = s + ' − ' + known;
      wl = [{ v: known, why: 'That is one of the numbers in the fact. Subtract it from the total: ' + s + ' − ' + known + '.' }, { v: s + known, why: 'You added. The inverse of adding is taking away.' }, { v: s, why: 'That is the total. Take ' + known + ' away from it.' }];
      const q = typed ? numeric : mcqNum;
      const expl = ex('Using the inverse', ['The fact is <b>' + fact + '</b>. Adding and taking away are opposites.', 'So ' + s + ' − ' + known + ' must give the other number: <b>' + ans + '</b>.', 'Check: ' + ans + ' + ' + known + ' = ' + s + '. ✅']);
      const hint = 'Subtraction undoes addition. Which number is left when you take ' + known + ' out of ' + s + '?';
      const pr = 'We know that <b>' + fact + '</b>.<br>So what is <b>' + ask + '</b>?' + (typed ? ' Type your answer.' : '');
      if(typed) return numeric({ prompt: pr, answer: ans, hint: hint, explain: expl, truth: (a + b) - known, wrong: wrongNum(wl) });
      return mcqNum({ prompt: pr, answer: ans, wrong: wl, nearby: [10, -10, 1, -1, 2, -2], valid: function(v){ return v > 0 && v < 1000; }, hint: hint, explain: expl, truth: (a + b) - known });
    }
    const hi = s, lo = known; // fact: hi − lo = other
    const d = ans;
    fact = hi + ' − ' + lo + ' = ' + d;
    const askAdd = chance(0.5);
    if(askAdd){ // d + lo = hi
      const pr = 'We know that <b>' + fact + '</b>.<br>So what is <b>' + d + ' + ' + lo + '</b>?' + (typed ? ' Type your answer.' : '');
      const wl2 = [{ v: hi - lo, why: 'You took away again. The inverse of taking away is adding: ' + d + ' + ' + lo + '.' }, { v: d, why: 'That is one of the numbers in the fact. Add the two numbers together.' }, { v: hi + lo, why: 'That is not the answer: use the fact to see where ' + d + ' + ' + lo + ' lands.' }];
      const expl = ex('Using the inverse', ['The fact is <b>' + fact + '</b>. Adding undoes taking away.', 'So ' + d + ' + ' + lo + ' takes us back to the start: <b>' + hi + '</b>.', 'Check: ' + hi + ' − ' + lo + ' = ' + d + '. ✅']);
      const hint = 'Adding undoes taking away. Where do you end up if you put ' + lo + ' back?';
      if(typed) return numeric({ prompt: pr, answer: hi, hint: hint, explain: expl, truth: d + lo, wrong: wrongNum(wl2) });
      return mcqNum({ prompt: pr, answer: hi, wrong: wl2, nearby: [10, -10, 1, -1, 2, -2], valid: function(v){ return v > 0 && v < 1000; }, hint: hint, explain: expl, truth: d + lo });
    }
    const pr = 'We know that <b>' + fact + '</b>.<br>So what is <b>' + hi + ' − ' + d + '</b>?' + (typed ? ' Type your answer.' : '');
    const wl3 = [{ v: d, why: 'That is one of the numbers in the fact. Take ' + d + ' away from ' + hi + '.' }, { v: hi, why: 'That is the number you start from. Take ' + d + ' away from it.' }, { v: hi + d, why: 'You added. The question is a subtraction.' }];
    const expl = ex('Using the inverse', ['The fact is <b>' + fact + '</b>. A subtraction fact gives TWO subtractions.', 'Take away the other number: ' + hi + ' − ' + d + ' = <b>' + lo + '</b>.', 'Check: ' + d + ' + ' + lo + ' = ' + hi + '. ✅']);
    const hint = 'In a subtraction fact, the answer and the number taken away swap places.';
    if(typed) return numeric({ prompt: pr, answer: lo, hint: hint, explain: expl, truth: hi - d, wrong: wrongNum(wl3) });
    return mcqNum({ prompt: pr, answer: lo, wrong: wl3, nearby: [10, -10, 1, -1, 2, -2], valid: function(v){ return v > 0 && v < 1000; }, hint: hint, explain: expl, truth: hi - d });
  }

  /* ---- estimating ---- */
  function estQ(typed, hundreds){
    const isAdd = chance(0.6), rr = hundreds ? r100 : r10, unit = hundreds ? 100 : 10, word = hundreds ? 'hundred' : 'ten';
    let a, b;
    for(let i = 0; i < 400; i++){
      a = hundreds ? randInt(121, 889) : randInt(21, 98); b = hundreds ? randInt(121, 889) : randInt(21, 98);
      if(!isAdd && a <= b + (hundreds ? 150 : 15)) { const t = a; a = Math.max(a, b); b = Math.min(t, b); }
      if(!isAdd && a - b < (hundreds ? 150 : 15)) continue;
      if(a % unit === 0 || b % unit === 0) continue;
      if(rr(a) === a || rr(b) === b) continue;
      if(isAdd && a + b > 1500) continue;
      const est = isAdd ? rr(a) + rr(b) : rr(a) - rr(b);
      if(est < unit) continue;
      break;
    }
    const exact = isAdd ? a + b : a - b, est = isAdd ? rr(a) + rr(b) : rr(a) - rr(b), sg = isAdd ? ' + ' : ' − ';
    const down = isAdd ? Math.floor(a / unit) * unit + Math.floor(b / unit) * unit : Math.floor(a / unit) * unit - Math.floor(b / unit) * unit;
    const up = isAdd ? Math.ceil(a / unit) * unit + Math.ceil(b / unit) * unit : Math.ceil(a / unit) * unit - Math.ceil(b / unit) * unit;
    const wl = [{ v: exact, why: 'That is the exact answer. An estimate uses the ROUNDED numbers (to the nearest ' + word + ').' }];
    if(down !== est) wl.push({ v: down, why: 'You rounded both numbers down. Round to the NEAREST ' + word + ': look at the digit on the right (5 or more rounds up).' });
    if(up !== est) wl.push({ v: up, why: 'You rounded both numbers up. Round to the NEAREST ' + word + ': a digit less than 5 rounds down.' });
    wl.push({ v: (isAdd ? rr(a) + b : rr(a) - b), why: 'You rounded only one number. Round BOTH numbers first.' });
    const expl = ex('Estimating', ['Round to the nearest ' + word + ': ' + a + ' → <b>' + rr(a) + '</b> and ' + b + ' → <b>' + rr(b) + '</b>.', 'Now work out ' + rr(a) + sg + rr(b) + ' = <b>' + est + '</b>.', 'The exact answer is ' + exact + ', so <b>' + est + '</b> is a good estimate. ✅']);
    const hint = 'Round each number to the nearest ' + word + ' first (5 or more rounds up), then do the easy sum.';
    const pr = 'Estimate <b>' + a + sg + b + '</b> by rounding each number to the nearest <b>' + word + '</b>.' + (typed ? ' Type your estimate.' : '');
    const truth = (Math.round(a / unit) * unit) + (isAdd ? 1 : -1) * (Math.round(b / unit) * unit);
    if(typed) return numeric({ prompt: pr, answer: est, hint: hint, explain: expl, truth: truth, wrong: wrongNum(wl) });
    return mcqNum({ prompt: pr, answer: est, wrong: wl, nearby: [unit, -unit, 2 * unit, -2 * unit], valid: function(v){ return v > 0; }, hint: hint, explain: expl, truth: truth });
  }

  function sensibleQ(){
    const isAdd = chance(0.5), n = pick(NAMES);
    let a, b;
    for(let i = 0; i < 400; i++){
      a = randInt(231, 889); b = randInt(121, 689);
      if(!isAdd){ if(a - b < 150) continue; }
      if(isAdd && a + b > 1400) continue;
      if(a % 10 === 0 || b % 10 === 0) continue;
      break;
    }
    const exact = isAdd ? a + b : a - b, est = isAdd ? r100(a) + r100(b) : r100(a) - r100(b), sg = isAdd ? ' + ' : ' − ';
    const wl = [];
    if(!isAdd) wl.push({ v: a + b, why: 'That is what you get if you ADD. The sum is a subtraction, so the answer must be smaller than ' + a + '.' });
    else wl.push({ v: Math.abs(a - b), why: 'That is what you get if you SUBTRACT. This is an addition, so the answer must be bigger than both numbers.' });
    [300, -300, 400, -400, 500, -500, 600].forEach(function(d){ wl.push({ v: exact + d, why: 'Too ' + (d > 0 ? 'big' : 'small') + '! Rounded, the sum is about ' + est + ', and this is far away from it.' }); });
    const truth = est + ((a - r100(a)) + (isAdd ? 1 : -1) * (b - r100(b)));
    return mcqNum({ prompt: n + ' works out <b>' + a + sg + b + '</b>. Which answer is <b>sensible</b>? (Round each number to the nearest 100 to check.)', answer: exact,
      wrong: wl.filter(function(w){ return w.v > 0 && Math.abs(w.v - est) >= 250 && w.v !== exact; }), nearby: [], valid: function(v){ return v > 0 && Math.abs(v - est) >= 250; },
      hint: 'Round both numbers to the nearest 100 and do the easy sum. Which answer is closest to it?',
      explain: ex('Is it sensible?', ['Round: ' + a + ' → <b>' + r100(a) + '</b> and ' + b + ' → <b>' + r100(b) + '</b>.', r100(a) + sg + r100(b) + ' = <b>' + est + '</b>, so the answer should be close to ' + est + '.', 'The exact answer is <b>' + exact + '</b>, which is very close to the estimate. ✅']),
      truth: truth });
  }

  function checkQ(){
    const n = pick(NAMES), a = randInt(301, 899), b = randInt(111, 289);
    if(a - b < 40) return checkQ();
    const real = a - b, right = chance(0.5);
    const off = pick([10, -10, 100, -100, 20, -20]);
    const claim = right ? real : real + off;
    if(claim < 10) return checkQ();
    const q = mcq2({ prompt: n + ' says <b>' + a + ' − ' + b + ' = ' + claim + '</b>. Use an <b>addition</b> to check. Is ' + n + ' right?',
      correct: opt(K.bool(right), right ? 'Yes' : 'No'), other: opt(K.bool(!right), right ? 'No' : 'Yes', right ? 'Check by adding: ' + claim + ' + ' + b + ' = ' + (claim + b) + ', which IS ' + a + '. So the answer is right.' : 'Check by adding: ' + claim + ' + ' + b + ' = ' + (claim + b) + ', which is NOT ' + a + '. So the answer is wrong.'),
      hint: 'To check a subtraction, add the answer to the number that was taken away. You should get back to the start.',
      explain: ex('Checking with the inverse', ['Add the answer and the number taken away: ' + claim + ' + ' + b + ' = <b>' + (claim + b) + '</b>.', (claim + b === a ? 'That is the number we started with (' + a + ')' : 'That is NOT the number we started with (' + a + ')') + '.', 'So the answer is <b>' + (right ? 'Yes' : 'No') + '</b>' + (right ? ': ' + n + ' is right. ✅' : ': ' + n + ' made a mistake. The correct answer is ' + real + '. ✅')]),
      truth: K.bool(claim + b === a) });
    return q;
  }

  registerSkill({
    id: 'addsub-missing-inverse', strand: 'addsub', name: 'Missing numbers & checking', emoji: '🔍', year: 3, order: 250, prereq: ['addsub-difference'],
    lesson: {
      title: 'Missing numbers and inverse checks',
      steps: [
        { say: 'A missing number sum has a <b>□</b> to fill. Here the whole is <b>91</b> and one part is <b>36</b>. The other part is the missing number.', vis: { kind: 'barModel', args: [[{ value: 36 }, { value: '?' }], 91] } },
        { say: 'To find a missing part, <b>take away</b> the part you know from the whole: 91 − 36 = <b>55</b>. So <b>36 + □ = 91</b> has the answer <b>55</b>.', vis: { kind: 'barModel', args: [[{ value: 36 }, { value: 55 }], 91] },
          quiz: { prompt: 'What number goes in the box? □ + 24 = 70', options: [{ label: '46', ok: true }, { label: '94', ok: false }, { label: '56', ok: false }], right: 'Yes! 70 − 24 = 46, and 46 + 24 = 70.', wrong: 'The 70 is the whole. Take the part you know away: 70 − 24 = 46.' } },
        { say: 'Adding and taking away are <b>inverses</b> (opposites). If <b>47 + 38 = 85</b>, then <b>85 − 38 = 47</b> and <b>85 − 47 = 38</b>. One fact gives you more!', vis: { kind: 'barModel', args: [[{ value: 47 }, { value: 38 }], 85] } },
        { say: 'Use the inverse to <b>check</b> your work. Is 523 − 187 = 336 right? Add back: 336 + 187 = 523. Yes! The check lands on the start number.',
          vis: { kind: 'html', args: ['<div style="font:800 22px system-ui;text-align:center;color:var(--vis-ink,#1B1B2F)">523 − 187 = 336<br>336 + 187 = 523 ✔</div>'] },
          quiz: { prompt: 'If 62 + 29 = 91, what is 91 − 29?', options: [{ label: '62', ok: true }, { label: '120', ok: false }, { label: '29', ok: false }], right: 'Yes! Taking away 29 undoes adding 29, so we are back at 62.', wrong: 'Subtraction undoes addition. 91 − 29 takes us back to 62.' } },
        { say: 'To <b>round</b> to the nearest <b>ten</b>, look at the <b>ones</b> digit. For the nearest <b>hundred</b>, look at the <b>tens</b> digit. <b>5 or more: round up. 4 or less: round down.</b> So 38 → 40, and 463 → 500.', vis: { kind: 'numberLine', args: [{ min: 30, max: 50, minor: 1, major: 10, marks: [{ value: 38 }] }] },
          quiz: { prompt: 'Round 67 to the nearest ten.', options: [{ label: '70', ok: true }, { label: '60', ok: false }, { label: '67', ok: false }], right: 'Yes! The ones digit is 7, which is 5 or more, so round up to 70.', wrong: 'Look at the ones digit: 7 is 5 or more, so round UP to 70.' } },
        { say: 'Now <b>estimate</b>: round each number first, then do the easy sum. 38 → 40 and 53 → 50, so 38 + 53 is about <b>90</b>. The exact answer, 91, is close, so it is sensible. ✅', vis: { kind: 'numberLine', args: [{ min: 30, max: 70, minor: 1, major: 10, marks: [{ value: 38 }, { value: 53, color: 'var(--vis-b,#9B51E0)' }] }] },
          quiz: { prompt: 'Estimate 62 + 29 by rounding each number to the nearest ten.', options: [{ label: '90', ok: true }, { label: '80', ok: false }, { label: '91', ok: false }], right: 'Yes! 62 → 60 and 29 → 30, and 60 + 30 = 90.', wrong: 'Round both numbers first: 62 → 60 and 29 → 30. Then 60 + 30 = 90.' } }
      ]
    },
    trick: {
      title: 'Undo it!',
      say: 'To find a missing number, <b>do the opposite</b>. Missing part of a total? <b>Take away</b>. Missing start number after taking away? <b>Add back</b>. Then <b>check</b> by putting your answer in the box.',
      vis: { kind: 'barModel', args: [[{ value: 36 }, { value: 55 }], 91] },
      example: '□ + 36 = 91 → 91 − 36 = <b>55</b> → check: 55 + 36 = 91 ✔'
    },
    gen: {
      1: function(){
        const f = randInt(0, 2);
        if(f === 0){ // bar model: missing part
          const k = rnd(11, 59), m = rnd(11, 90 - k), total = k + m, left = chance(0.5);
          const vis = V.barModel(left ? [{ value: '?' }, { value: k }] : [{ value: k }, { value: '?' }], total);
          const wl = eqWrongs('A', k, m, m, total);
          return mcqNum({ prompt: 'The bar model shows a whole and two parts. What is the <b>missing part</b>?', visual: vis, answer: m, wrong: wl, nearby: [10, -10, 1, -1, 2, -2], valid: function(v){ return v > 0 && v < 100; },
            hint: 'The top box is the whole. Take the part you know away from the whole.',
            explain: eqExplain('A', k, m, m, total), truth: solveTruth('A', k, m), decode: function(){ return barMissing(vis); } });
        }
        if(f === 1) return inverseQ(false, false);
        const k = rnd(11, 59), m = rnd(11, 90 - k);
        return eqQ(pick(['A', 'B']), k, m, 100, false);
      },
      2: function(){
        const f = randInt(0, 3);
        if(f === 0){ const form = pick(['A', 'B', 'C', 'D']), k = rnd(12, 88), m = rnd(12, 88); return eqQ(form, k, m, 200, false); }
        if(f === 1) return inverseQ(false, chance(0.4));
        if(f === 2) return estQ(false, false);
        // which addition checks?
        const a = randInt(52, 98), b = randInt(21, a - 11), d = a - b, n = pick(NAMES);
        const labelOf = function(x, y, z){ return x + ' + ' + y + ' = ' + z; };
        return mcq({ prompt: n + ' works out <b>' + a + ' − ' + b + ' = ' + d + '</b>. Which addition checks the answer?',
          correct: opt(K.text('chk'), labelOf(d, b, a)), keepOrder: true, count: 3,
          distractors: [opt(K.text('add-total'), labelOf(a, b, a + b), 'This adds the two numbers from the subtraction. To check, add the ANSWER (' + d + ') and the number taken away (' + b + ').'), opt(K.text('add-ans'), labelOf(d, a, d + a), 'Check by adding the answer and the number taken away, and see if you get back to ' + a + '.'), opt(K.text('add-diff'), labelOf(a, d, a + d), 'Adding the start number again does not check anything. Add the answer and the number taken away.')],
          hint: 'Subtraction is undone by addition. Add the answer to the number that was taken away. You should land on the start number.',
          explain: ex('The check', ['The subtraction is <b>' + a + ' − ' + b + ' = ' + d + '</b>.', 'To undo it, add back what was taken away: <b>' + d + ' + ' + b + '</b>.', 'It lands on ' + (d + b) + ', the number we started with. So the check is <b>' + labelOf(d, b, a) + '</b>. ✅']),
          truth: K.text(d + b === a ? 'chk' : 'x') });
      },
      3: function(){
        const f = randInt(0, 4);
        if(f === 0){ const form = pick(['A', 'B', 'C', 'D']), k = rnd(101, 489), m = rnd(101, 489); return eqQ(form, k, m, 2000, true); }
        if(f === 1) return sensibleQ();
        if(f === 2) return checkQ();
        if(f === 3) return estQ(true, true);
        return inverseQ(true, true);
      }
    }
  });
})();
