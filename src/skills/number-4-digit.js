/* number-4-digit — 4-digit numbers: place value, partitioning, comparing, ordering, 1000 more/less (Year 4 bridge). */
(function(){
  const NAMES = ['Ana', 'Marcus', 'Sophie', 'Ivan', 'Lucy', 'Diego', 'Ellen', 'Tom', 'Aisha', 'Kai', 'Mei', 'Leo'];
  const PLACE = ['ones', 'tens', 'hundreds', 'thousands'];
  function build(th, h, t, o){ return th * 1000 + h * 100 + t * 10 + o; }
  function digits(n){ return String(n).split('').map(Number); }
  function rnd4(){ return build(randInt(1, 9), randInt(0, 9), randInt(0, 9), randInt(0, 9)); }
  function rnd4nz(){ return build(randInt(1, 9), randInt(1, 9), randInt(1, 9), randInt(1, 9)); }
  /* place a digit by position counting from the right, independent of string tricks */
  function digitAt(n, p){ let x = n; for(let i = 0; i < p; i++) x = (x - x % 10) / 10; return x % 10; }

  function qDigitValue(){
    const n = rnd4nz(), p = randInt(0, 3), d = digitAt(n, p), val = d * Math.pow(10, p);
    const w = [];
    w.push({ v: d, why: 'That is the digit itself. In the ' + PLACE[p] + ' place it is worth ' + val + '.' });
    [0, 1, 2, 3].forEach(function(q){ if(q !== p) w.push({ v: d * Math.pow(10, q), why: 'The ' + d + ' is in the ' + PLACE[p] + ' place, so it is worth ' + val + ', not ' + d * Math.pow(10, q) + '.' }); });
    return mcqNum({
      prompt: 'In <b>' + n + '</b>, what is the value of the digit <b>' + d + '</b> in the <b>' + PLACE[p] + '</b> place?', answer: val, wrong: w, nearby: [], valid: function(v){ return v > 0; }, count: 4,
      hint: 'Which column is it in? Ones, tens, hundreds or thousands?',
      explain: ex('Value of a digit', ['Read the columns from the right: ones, tens, hundreds, <b>thousands</b>.', 'In ' + n + ' the ' + PLACE[p] + ' digit is ' + d + '.', 'Its value is <b>' + val + '</b>. ✅']), truth: digitAt(n, p) * Math.pow(10, p)
    });
  }
  function qPartitionMcq(){
    const th = randInt(1, 9), h = randInt(1, 9), t = randInt(1, 9), o = randInt(1, 9), n = build(th, h, t, o);
    return mcqNum({
      prompt: '<b>' + th * 1000 + ' + ' + h * 100 + ' + ' + t * 10 + ' + ' + o + '</b> is the same as which number?', answer: n,
      wrong: [{ v: build(th, t, h, o), why: 'The hundreds and tens are swapped. ' + h + ' hundreds is ' + h * 100 + '.' }, { v: build(h, th, t, o), why: 'The thousands digit is ' + th + ' (that is ' + th * 1000 + ').' }, { v: build(th, h, o, t), why: 'The tens digit is ' + t + ' and the ones digit is ' + o + '.' }, { v: build(th, h, t, o) + 1000, why: 'Check the thousands: ' + th * 1000 + '.' }],
      nearby: [1, -1, 10, 100], valid: function(v){ return v > 999 && v < 10000; }, count: 4, hint: 'Write each part in its own column: thousands, hundreds, tens, ones.',
      explain: ex('Partitioning', [th * 1000 + ' is ' + th + ' thousands, ' + h * 100 + ' is ' + h + ' hundreds, ' + t * 10 + ' is ' + t + ' tens, ' + o + ' is ' + o + ' ones.', 'Together: <b>' + n + '</b>. ✅']), truth: th * 1000 + h * 100 + t * 10 + o
    });
  }
  function qZero(){
    const th = randInt(1, 9), h = randInt(1, 9), o = randInt(1, 9), n = build(th, h, 0, o);
    return mcqNum({
      prompt: 'Which number is <b>' + th + ' thousands, ' + h + ' hundreds, 0 tens and ' + o + ' ones</b>?', answer: n,
      wrong: [{ v: build(th, h, o, 0), why: 'There are 0 tens, so the tens digit is 0 and the ones digit is ' + o + '.' }, { v: build(th, h, 0, 0) * 10 + o, why: 'You wrote one digit too many. A zero fills the empty tens place.' }, { v: build(th, 0, h, o), why: 'The hundreds digit is ' + h + ' and the tens digit is 0.' }, { v: th * 100 + h * 10 + o, why: 'That is only 3 digits. We need a zero for the 0 tens.' }],
      nearby: [1, -1, 10, 100], valid: function(v){ return v > 0; }, count: 4, hint: 'Use 0 as a placeholder for an empty column.',
      explain: ex('Zero as a placeholder', ['Thousands ' + th + ', hundreds ' + h + ', tens 0, ones ' + o + '.', 'The 0 holds the tens place: <b>' + n + '</b>. ✅']), truth: digitAt(n, 3) * 1000 + digitAt(n, 2) * 100 + digitAt(n, 1) * 10 + digitAt(n, 0)
    });
  }
  function qLine(){
    const base = randInt(1, 9) * 1000, n = base + randInt(1, 9) * 100, vis = V.numberLine({ min: base, max: base + 1000, minor: 100, major: 500, width: 340, marks: [{ value: n }] });
    return mcqNum({
      prompt: 'Which number does the arrow point to?', visual: vis, answer: n,
      wrong: [{ v: n + 100, why: 'Count the small steps from ' + base + ': each one is 100.' }, { v: n - 100, why: 'Count the small steps from ' + base + ': each one is 100.' }, { v: base + (n - base) / 10, why: 'Each small step is 100, not 10.' }, { v: base + 1000 - (n - base), why: 'Count from the LEFT end (' + base + ').' }],
      nearby: [100, -100, 200], valid: function(v){ return v >= base && v <= base + 1000; }, count: 4, hint: 'The line starts at ' + base + ' and goes up in steps of 100.',
      explain: ex('Reading the line', ['The left end is ' + base + ' and each small step is 100.', 'The arrow is ' + nnoun((n - base) / 100, 'steps') + ' along.', base + ' + ' + (n - base) + ' = <b>' + n + '</b>. ✅']),
      truth: n, decode: function(){ return Math.round(V.decodeNumberLine(vis)); }
    });
  }
  function qCompare(){
    const a = rnd4(); let b;
    const mode = randInt(0, 2);
    if(mode === 0) b = build(digitAt(a, 3), digitAt(a, 2), digitAt(a, 1) === 9 ? 8 : digitAt(a, 1) + 1, digitAt(a, 0));
    else if(mode === 1) b = build(digitAt(a, 3), digitAt(a, 2) === 9 ? 8 : digitAt(a, 2) + 1, digitAt(a, 1), digitAt(a, 0));
    else b = build(digitAt(a, 3) === 9 ? 8 : digitAt(a, 3) + 1, digitAt(a, 2), digitAt(a, 1), digitAt(a, 0));
    const askBig = chance(0.5), big = Math.max(a, b), small = Math.min(a, b), ans = askBig ? big : small, oth = askBig ? small : big;
    return mcq2({
      prompt: 'Which number is <b>' + (askBig ? 'greater' : 'smaller') + '</b>?', correct: opt(K.num(ans), String(ans), 'Compare the thousands first, then the hundreds, then the tens, then the ones.'), other: opt(K.num(oth), String(oth), 'Compare digit by digit from the left. Find the first column that is different.'),
      hint: 'Start with the thousands digit. If they match, move to the hundreds.',
      explain: ex('Comparing 4-digit numbers', ['Compare from the left: thousands, hundreds, tens, ones.', 'The first different column decides.', '<b>' + ans + '</b> is ' + (askBig ? 'greater' : 'smaller') + ' than ' + oth + '. ✅']), truth: K.num(askBig ? Math.max(a, b) : Math.min(a, b))
    });
  }
  function qOrder(){
    const th = randInt(1, 8), nums = []; const seen = {};
    while(nums.length < 4){ const n = build(chance(0.6) ? th : randInt(1, 9), randInt(0, 9), randInt(0, 9), randInt(0, 9)); if(!seen[n]){ seen[n] = 1; nums.push(n); } }
    const asc = chance(0.5), sorted = nums.slice().sort(function(x, y){ return x - y; }), inOrder = asc ? sorted : sorted.slice().reverse();
    return order({
      prompt: 'Put these numbers in order, <b>' + (asc ? 'smallest to largest' : 'largest to smallest') + '</b>. Tap them one at a time.', items: inOrder.map(function(n){ return { key: String(n), label: String(n) }; }),
      hint: 'Find the ' + (asc ? 'smallest' : 'largest') + ' first. Compare thousands, then hundreds, then tens, then ones.',
      explain: ex('Ordering 4-digit numbers', ['Compare the thousands first. If two match, compare the hundreds, then the tens, then the ones.', 'From ' + (asc ? 'smallest to largest' : 'largest to smallest') + ': <b>' + inOrder.join(', ') + '</b>. ✅']), truth: 'o:' + inOrder.join('|')
    });
  }
  function qMoreLess(){
    const n = build(randInt(1, 8), randInt(0, 9), randInt(0, 9), randInt(0, 9)), step = pick([1000, 1000, 100, 10]), more = chance(0.5), ans = more ? n + step : n - step, nm = {1000: 'a thousand', 100: 'a hundred', 10: 'ten'}[step];
    return numeric({
      prompt: 'Type the number that is <b>' + (step === 1000 ? '1000' : step === 100 ? '100' : '10') + ' ' + (more ? 'more' : 'less') + '</b> than <b>' + n + '</b>.', answer: ans,
      hint: 'Only one digit changes: the ' + (step === 1000 ? 'thousands' : step === 100 ? 'hundreds' : 'tens') + ' digit goes ' + (more ? 'up' : 'down') + ' by 1.',
      explain: ex(step + ' ' + (more ? 'more' : 'less'), ['Change the ' + (step === 1000 ? 'thousands' : step === 100 ? 'hundreds' : 'tens') + ' digit by 1, ' + (more ? 'up' : 'down') + '.', n + (more ? ' + ' : ' − ') + step + ' = <b>' + ans + '</b>. ✅']), truth: more ? n + step : n - step,
      wrong: function(v){ return v === (more ? n - step : n + step) ? 'That is ' + step + ' ' + (more ? 'less' : 'more') + '. Read the question again.' : v === (more ? n + 1000 : n - 1000) && step !== 1000 ? 'That changes the thousands digit. Which digit should change?' : ''; }
    });
  }
  function qBuildTyped(){
    const th = randInt(1, 9), h = randInt(0, 9), t = randInt(0, 9), o = randInt(0, 9), n = build(th, h, t, o);
    return numeric({
      prompt: 'Type the number:  <b>' + th * 1000 + ' + ' + h * 100 + ' + ' + t * 10 + ' + ' + o + '</b>', answer: n, hint: 'Put each part in its own column. Use 0 for empty columns.',
      explain: ex('Partitioning', ['Thousands ' + th + ', hundreds ' + h + ', tens ' + t + ', ones ' + o + '.', 'Together: <b>' + n + '</b>. ✅']), truth: th * 1000 + h * 100 + t * 10 + o
    });
  }
  function qWhichDigit(){
    const n = rnd4nz(), p = randInt(0, 3), d = digitAt(n, p);
    return numeric({
      prompt: 'Which digit is in the <b>' + PLACE[p] + '</b> place of <b>' + n + '</b>? Type it.', answer: d, hint: 'Count columns from the right: ones, tens, hundreds, thousands.',
      explain: ex('Reading the columns', [n + ' has thousands ' + digitAt(n, 3) + ', hundreds ' + digitAt(n, 2) + ', tens ' + digitAt(n, 1) + ', ones ' + digitAt(n, 0) + '.', 'The ' + PLACE[p] + ' digit is <b>' + d + '</b>. ✅']), truth: digits(n)[3 - p]
    });
  }
  function qWord(){
    const who = pick(NAMES), n = build(randInt(2, 8), randInt(0, 9), randInt(0, 9), randInt(0, 9)), more = chance(0.5), thing = pick(['stickers', 'cards', 'beads', 'coins']);
    return numeric({
      prompt: who + ' has ' + n + ' ' + thing + '. A friend gives ' + who + ' <b>1000 ' + (more ? 'more' : 'fewer') + '</b>' + (more ? '' : ' to keep') + '. ' + (more ? 'How many does ' + who + ' have now?' : 'How many are left?'), answer: more ? n + 1000 : n - 1000,
      hint: 'Change only the thousands digit.', explain: ex('1000 ' + (more ? 'more' : 'less'), ['Only the thousands digit changes.', n + (more ? ' + 1000 = ' : ' − 1000 = ') + '<b>' + (more ? n + 1000 : n - 1000) + '</b>. ✅']), truth: more ? n + 1000 : n - 1000
    });
  }
  registerSkill({
    id: 'number-4-digit', strand: 'number', name: '4-digit numbers', emoji: '🔢', year: 4, order: 165, prereq: ['number-place-value', 'number-compare-order'],
    lesson: { title: 'Numbers up to 9,999', steps: [
      { say: 'After <b>999</b> comes <b>1,000</b>: ten hundreds make one <b>thousand</b>. A 4-digit number has columns: <b>thousands, hundreds, tens, ones</b>.', vis: { kind: 'baseTen', args: [9, 9, 9] } },
      { say: '<b>5,284</b> = 5,000 + 200 + 80 + 4. The 5 is in the thousands place, so it is worth <b>5,000</b>. A <b>0</b> holds an empty column: in 5,<b>0</b>84 there are <b>0 hundreds</b>.',
        quiz: { prompt: 'What is the value of the 7 in 3,742?', options: [{ label: '700', ok: true }, { label: '7', ok: false }, { label: '7,000', ok: false }], right: 'Yes! 7 is in the hundreds place.', wrong: 'Columns from the right: 2 ones, 4 tens, 7 hundreds, 3 thousands. The 7 is worth 700.' } },
      { say: 'To compare, start at the <b>left</b>. 4,512 and 4,498: thousands match (4), then hundreds: 5 is more than 4. So <b>4,512 is greater</b>.',
        quiz: { prompt: 'Which is greater: 6,310 or 6,301?', options: [{ label: '6,310', ok: true }, { label: '6,301', ok: false }], right: 'Yes! Tens: 1 is more than 0.', wrong: 'Thousands and hundreds match. Tens: 1 is more than 0, so 6,310 is greater.' } }
    ] },
    trick: { title: 'Start at the left', say: 'To <b>compare or order</b> big numbers, start at the <b>left</b> and find the first column that is different. For 1000 more or less, change <b>only the thousands digit</b>.', example: '4,512 vs 4,498 → hundreds 5 &gt; 4 → <b>4,512 is greater</b>' },
    gen: {
      1: function(){ return pick([qDigitValue, qLine, qLine, qPartitionMcq, qZero])(); },
      2: function(){ return pick([qDigitValue, qCompare, qCompare, qOrder, qZero, qPartitionMcq, qLine])(); },
      3: function(){ return pick([qBuildTyped, qMoreLess, qMoreLess, qWhichDigit, qOrder, qWord])(); }
    }
  });
})();
