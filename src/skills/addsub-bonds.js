/* addsub-bonds — Year 2 foundation: number bonds to 10, 20 and 100, and "make ten". Offered as a quick check first (Year 2 skills are verified, not re-taught). */
(function(){
  const NAMES = ['Ana', 'Marcus', 'Sophie', 'Ivan', 'Lucy', 'Diego', 'Ellen', 'Tom', 'Aisha', 'Kai', 'Mei', 'Leo'];
  const ITEMS = ['stickers', 'marbles', 'beads', 'stars', 'pencils', 'shells'];
  function pos(v){ return v > 0; }
  /* counting on from a until total: independent source of truth for "what must I add" */
  function countOn(a, total){ let k = 0; for(let x = a; x < total; x++) k++; return k; }
  function readBar(html){ const parts = []; const re = /class="bpart" data-v="([^"]*)"/g; let m; while((m = re.exec(html))) parts.push(m[1]); const t = /background:#FFF3C4">([^<]*)</.exec(html); return { parts: parts, total: t ? t[1] : null }; }
  function bar(a, total){ return V.barModel([{ value: a }, { value: '?' }], total); }
  const NEAR = [1, -1, 2, -2, 10, -10];

  function qPic10(){
    const a = randInt(1, 9), total = 10, vis = bar(a, total);
    return mcqNum({
      prompt: 'The whole is ' + total + '. One part is ' + a + '. What is the other part?', visual: vis, answer: total - a,
      wrong: [{ v: a, why: 'You gave the same number. The two parts are different here: ' + a + ' and ?.' }, { v: total, why: total + ' is the whole. We want the other PART.' }, { v: total - a + 1, why: 'Close! Check: ' + a + ' + ' + (total - a + 1) + ' = ' + (a + total - a + 1) + ', not ' + total + '.' }, { v: total - a - 1, why: 'Close! Check: ' + a + ' + ' + (total - a - 1) + ' = ' + (total - 1) + ', not ' + total + '.' }],
      nearby: NEAR, valid: pos, count: 3,
      hint: 'Count on from ' + a + ' to ' + total + '. How many steps?',
      explain: ex('Number bonds to 10', ['The two parts must add up to <b>' + total + '</b>.', 'Count on from ' + a + ' to ' + total + ': that is <b>' + (total - a) + '</b> more.', a + ' + ' + (total - a) + ' = ' + total + '. ✅']),
      truth: countOn(a, total), decode: function(){ const r = readBar(vis); return Number(r.total) - Number(r.parts[0]); }
    });
  }
  function qRecall(total){
    const a = randInt(1, total - 1), b = total - a, left = chance(0.5), who = pick(NAMES), it = pick(ITEMS);
    if(chance(0.35)) return mcqNum({
      prompt: who + ' has ' + nnoun(a, it) + ' and wants ' + total + '. How many more does ' + who + ' need?', answer: b,
      wrong: [{ v: a, why: a + ' is how many ' + who + ' already has.' }, { v: total, why: total + ' is the target, not the number still needed.' }, { v: b + 1, why: 'Check: ' + a + ' + ' + (b + 1) + ' = ' + (a + b + 1) + '.' }, { v: b - 1, why: 'Check: ' + a + ' + ' + (b - 1) + ' = ' + (a + b - 1) + '.' }],
      nearby: NEAR, valid: pos, count: 4, hint: 'Count on from ' + a + ' up to ' + total + '.',
      explain: ex('How many more?', [who + ' has ' + a + ' and needs ' + total + '.', 'Count on from ' + a + ' to ' + total + ': <b>' + b + '</b> more.', a + ' + ' + b + ' = ' + total + '. ✅']), truth: countOn(a, total)
    });
    return mcqNum({
      prompt: left ? 'What number goes in the box?  <b>▢ + ' + a + ' = ' + total + '</b>' : 'What number goes in the box?  <b>' + a + ' + ▢ = ' + total + '</b>', answer: b,
      wrong: [{ v: a, why: 'You wrote the number that is already there. Find the missing one.' }, { v: total, why: total + ' is the answer to the whole sum, not the missing number.' }, { v: b + 1, why: 'Check: ' + a + ' + ' + (b + 1) + ' = ' + (a + b + 1) + '.' }, { v: b - 1, why: 'Check: ' + a + ' + ' + (b - 1) + ' = ' + (a + b - 1) + '.' }],
      nearby: NEAR, valid: pos, count: 4, hint: 'Count on from ' + a + ' to ' + total + '.',
      explain: ex('Missing number', ['Count on from ' + a + ' to ' + total + '.', 'You need <b>' + b + '</b> more.', a + ' + ' + b + ' = ' + total + ' and ' + b + ' + ' + a + ' = ' + total + '. ✅']), truth: countOn(a, total)
    });
  }
  /* make ten: 8 + 6 -> 8 + 2 = 10, then 10 + 4 */
  function qMakeTenGap(){
    const a = randInt(6, 9), b = randInt(11 - a + 1, 9) , need = 10 - a;
    return mcqNum({
      prompt: 'Let’s work out <b>' + a + ' + ' + b + '</b> in two easy steps: first fill up to a full ten (<b>' + a + ' + ? = 10</b>), then add what is left of ' + b + '. <b>Step 1:</b> what number goes in place of the ?', answer: need,
      wrong: [{ v: b, why: b + ' is the other number. First find how many to ADD to ' + a + ' to reach 10.' }, { v: 10, why: '10 is where you are heading. How many steps from ' + a + '?' }, { v: need + 1, why: 'Count on from ' + a + ': ' + (need + 1) + ' steps goes past 10.' }, { v: a, why: a + ' is the number you start with.' }],
      nearby: [1, -1, 2, 3, 4], valid: pos, count: 4, hint: 'Count on from ' + a + ' to 10.',
      explain: ex('Make ten', [a + ' + <b>' + need + '</b> = 10.', 'So split ' + b + ' into ' + need + ' and ' + (b - need) + '.', a + ' + ' + b + ' = 10 + ' + (b - need) + ' = <b>' + (a + b) + '</b>. ✅']), truth: countOn(a, 10)
    });
  }
  function qMakeTenSum(){
    const a = randInt(6, 9), b = randInt(11 - a + 1, 9), need = 10 - a, s = a + b;
    return mcqNum({
      prompt: 'Let’s work out <b>' + a + ' + ' + b + '</b> by making ten. Split ' + b + ' into ' + need + ' and ' + (b - need) + '. First <b>' + a + ' + ' + need + ' = 10</b>. Then <b>10 + ' + (b - need) + ' = ?</b> What is ' + a + ' + ' + b + '?', answer: s,
      wrong: [{ v: 10 + b, why: 'You added all of ' + b + ' to 10. Only ' + (b - need) + ' of it is left after making ten.' }, { v: s + 1, why: 'Close! Count again: 10 + ' + (b - need) + '.' }, { v: s - 1, why: 'Close! Count again: 10 + ' + (b - need) + '.' }, { v: 10 + need, why: 'You stopped too early. After making 10, add the rest: ' + (b - need) + '.' }],
      nearby: [1, -1, 2, -2], valid: pos, count: 4, hint: 'After making 10, how much of ' + b + ' is left to add?',
      explain: ex('Make ten', [a + ' + ' + need + ' = 10 (we used ' + need + ' of the ' + b + ').', b + ' − ' + need + ' = ' + (b - need) + ' is left.', '10 + ' + (b - need) + ' = <b>' + s + '</b>. ✅']), truth: (a + need) + (b - need)
    });
  }
  function qPairs(total){
    const a = randInt(2, total - 2), good = a + ' + ' + (total - a), ds = [];
    shuffle([1, -1, 2, -2, 3, -3, 10, -10]).forEach(function(d){ const b = total - a + d; if(b > 0 && b !== total - a && ds.length < 5) ds.push(opt(K.text(a + ' + ' + b), a + ' + ' + b, a + ' + ' + b + ' = ' + (a + b) + ', not ' + total + '.')); });
    return mcq({
      prompt: 'Which pair of numbers makes <b>' + total + '</b>?', correct: opt(K.text(good), good), distractors: ds, keepOrder: false, count: 4,
      hint: 'Add each pair. Which one makes exactly ' + total + '?',
      explain: ex('Checking the pairs', ['Add each pair of numbers.', good + ' = <b>' + total + '</b>.', 'The others make more or less than ' + total + '. ✅']), truth: K.text(a + ' + ' + countOn(a, total))
    });
  }
  /* ---- tier 3: 20 and 100, typed ---- */
  function qTyped20(){
    const a = randInt(2, 18), b = 20 - a;
    return numeric({
      prompt: 'Type the missing number:  <b>' + (chance(0.5) ? a + ' + ▢ = 20' : '▢ + ' + a + ' = 20') + '</b>', answer: b,
      hint: 'Count on from ' + a + ' to 20, or use the bond to 10 first.',
      explain: ex('Bonds to 20', ['Count on from ' + a + ' to 20' + (a < 10 ? ': first to 10 (' + (10 - a) + '), then ' + 10 + ' more.' : ': first to the next ten if you like, then on to 20.'), 'That is <b>' + b + '</b> more.', 'Check: ' + a + ' + ' + b + ' = 20. ✅']), truth: countOn(a, 20),
      wrong: function(v){ return v + a !== 20 ? 'Check by adding: ' + a + ' + ' + v + ' = ' + (a + v) + ', not 20.' : ''; }
    });
  }
  function qTens100(){
    const a = randInt(1, 9) * 10, b = 100 - a;
    return numeric({
      prompt: 'Type the missing number:  <b>' + a + ' + ▢ = 100</b>', answer: b,
      hint: 'Think of tens: ' + a / 10 + ' tens and how many more tens make 10 tens?',
      explain: ex('Bonds to 100 (tens)', [a / 10 + ' tens + ' + b / 10 + ' tens = 10 tens.', '10 tens is <b>100</b>, so the missing number is <b>' + b + '</b>.', a + ' + ' + b + ' = 100. ✅']), truth: countOn(a, 100),
      wrong: function(v){ return v + a !== 100 ? 'Check by adding: ' + a + ' + ' + v + ' = ' + (a + v) + ', not 100.' : ''; }
    });
  }
  function qTyped100(){
    let a; do { a = randInt(11, 89); } while(a % 10 === 0);
    const b = 100 - a, ones = a % 10, tens = (a - ones) / 10;
    return numeric({
      prompt: 'Type the missing number:  <b>' + a + ' + ▢ = 100</b>', answer: b,
      hint: 'First make the next ten, then count the tens to 100.',
      explain: ex('Bonds to 100', [a + ' + ' + (10 - ones) + ' = ' + (a + 10 - ones) + ' (the next ten).', (a + 10 - ones) + ' + ' + (100 - a - 10 + ones) + ' = 100.', (10 - ones) + ' + ' + (100 - a - 10 + ones) + ' = <b>' + b + '</b>. ✅']), truth: countOn(a, 100),
      wrong: function(v){ return v === 100 - a + 10 ? 'Check: ' + a + ' + ' + v + ' = ' + (a + v) + '. That is 10 too many.' : v + a !== 100 ? 'Check by adding: ' + a + ' + ' + v + ' = ' + (a + v) + ', not 100.' : ''; }
    });
  }
  function qPairs100(){
    const a = randInt(1, 9) * 10 + randInt(1, 9), good = a + ' + ' + (100 - a), ds = [];
    shuffle([10, -10, 1, -1, 2, -2, 9, -9]).forEach(function(d){ const b = 100 - a + d; if(b > 0 && ds.length < 5) ds.push(opt(K.text(a + ' + ' + b), a + ' + ' + b, a + ' + ' + b + ' = ' + (a + b) + ', not 100.')); });
    return mcq({
      prompt: 'Which pair of numbers makes <b>100</b>?', correct: opt(K.text(good), good), distractors: ds, keepOrder: false, count: 4,
      hint: 'Add the ones first: they should make 10 (or 0). Then the tens.',
      explain: ex('Checking the pairs', ['Add each pair.', good + ' = <b>100</b>.', 'The others are a little too small or too big. ✅']), truth: K.text(a + ' + ' + countOn(a, 100))
    });
  }
  function qWord100(){
    const a = randInt(11, 89), b = 100 - a, who = pick(NAMES), it = pick(ITEMS), left = chance(0.5);
    return numeric({
      prompt: left ? who + ' has 100 ' + it + ' and gives ' + a + ' away. How many ' + it + ' are left?' : who + ' has ' + a + ' ' + it + '. How many more does ' + who + ' need to have 100?', answer: b,
      hint: 'Count on from ' + a + ' to 100: ones to the next ten, then tens.',
      explain: ex('Bonds to 100 in a story', [left ? '100 − ' + a + ' is the same as: what do I add to ' + a + ' to make 100?' : 'We need what is missing from ' + a + ' to reach 100.', 'Next ten, then tens: <b>' + b + '</b>.', a + ' + ' + b + ' = 100. ✅']), truth: countOn(a, 100),
      wrong: function(v){ return v === a ? a + ' is the number in the story. Find the bond to 100.' : v + a !== 100 ? 'Check by adding: ' + a + ' + ' + v + ' = ' + (a + v) + ', not 100.' : ''; }
    });
  }

  registerSkill({
    id: 'addsub-bonds', strand: 'addsub', name: 'Number bonds and making ten', emoji: '🔟', year: 2, order: 205, prereq: [],
    lesson: {
      title: 'Pairs that make 10, 20 and 100',
      steps: [
        { say: 'A <b>number bond</b> is a pair of numbers that make another number. Here 10 is made of <b>6</b> and <b>4</b>: 6 + 4 = 10.', vis: { kind: 'barModel', args: [[{ value: 6 }, { value: 4 }], 10] } },
        { say: 'To find the missing part, <b>count on</b>. The whole is 10 and one part is 7. From 7 to 10 is <b>3</b> steps, so the bond is 7 + 3 = 10.', vis: { kind: 'numberLine', args: [{ min: 0, max: 10, minor: 1, major: 5, marks: [{ value: 7, kind: 'dot' }] }] },
          quiz: { prompt: '4 + ▢ = 10', options: [{ label: '5', ok: false }, { label: '6', ok: true }, { label: '14', ok: false }], right: 'Yes! 4 + 6 = 10.', wrong: 'Count on from 4 to 10: 6 steps. 4 + 6 = 10.' } },
        { say: '<b>Make ten</b> helps with sums like 8 + 5. 8 needs <b>2</b> to make 10. Split 5 into 2 and 3. 8 + 2 = 10, then 10 + 3 = <b>13</b>.', vis: { kind: 'barModel', args: [[{ value: 8 }, { value: 5 }], 13] },
          quiz: { prompt: '9 + 4: 9 needs 1 to make 10. What is 9 + 4?', options: [{ label: '13', ok: true }, { label: '14', ok: false }, { label: '12', ok: false }], right: 'Yes! 9 + 1 = 10, then 10 + 3 = 13.', wrong: 'Split 4 into 1 and 3. 9 + 1 = 10, then 10 + 3 = 13.' } },
        { say: 'Bonds to <b>100</b> work with tens: 3 tens + 7 tens = 10 tens = 100. So <b>30 + 70 = 100</b>. For 37 + ? make the next ten (3), then count the tens (60): <b>63</b>.', vis: { kind: 'numberLine', args: [{ min: 0, max: 100, minor: 10, major: 50, marks: [{ value: 70, kind: 'dot' }] }] },
          quiz: { prompt: '40 + ▢ = 100', options: [{ label: '60', ok: true }, { label: '50', ok: false }, { label: '140', ok: false }], right: 'Yes! 4 tens + 6 tens = 10 tens.', wrong: '4 tens + 6 tens = 10 tens = 100, so 40 + 60 = 100.' } }
      ]
    },
    trick: {
      title: 'Make the next ten',
      say: 'To join two numbers, <b>make the next ten first</b>, then add what is left. For bonds to 100: ones make 10, tens make 10 tens.',
      vis: { kind: 'barModel', args: [[{ value: 7 }, { value: 6 }], 13] },
      example: '7 + 6 → 7 + 3 = 10 → 10 + 3 = <b>13</b> &nbsp;·&nbsp; 37 + ? = 100 → 37 + 3 = 40 → 40 + 60 → <b>63</b>'
    },
    gen: {
      1: function(){ return pick([qPic10, qPic10, function(){ return qRecall(10); }, function(){ return qPairs(10); }])(); },
      2: function(){ return pick([function(){ return qRecall(20); }, function(){ return qRecall(10); }, qMakeTenGap, qMakeTenSum, qMakeTenSum, function(){ return qPairs(20); }])(); },
      3: function(){ return pick([qTyped20, qTens100, qTyped100, qTyped100, qPairs100, qWord100, qWord100])(); }
    }
  });
})();
