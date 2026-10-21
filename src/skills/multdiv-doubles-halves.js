/* multdiv-doubles-halves — Year 2 foundation: doubling and halving, near doubles. Offered as a quick check first (Year 2 skills are verified, not re-taught). */
(function(){
  const NAMES = ['Ana', 'Marcus', 'Sophie', 'Ivan', 'Lucy', 'Diego', 'Ellen', 'Tom', 'Aisha', 'Kai', 'Mei', 'Leo'];
  const ITEMS = ['stickers', 'marbles', 'beads', 'stars', 'pencils', 'shells', 'sweets', 'grapes'];
  function pos(v){ return v > 0; }
  const NEAR = [1, -1, 2, -2, 10, -10];
  /* halving by sharing out one at a time (independent truth for "half of m") */
  function shareOut(m){ let a = 0, b = 0; for(let i = 0; i < m; i++){ if(i % 2 === 0) a++; else b++; } return a === b ? a : -1; }

  function qDoublePic(){
    const n = randInt(2, 10), vis = V.groups(2, n);
    return mcqNum({
      prompt: 'There are two equal groups of ' + n + '. This is <b>double ' + n + '</b>. How many are there altogether?', visual: vis, answer: n + n,
      wrong: [{ v: n, why: n + ' is just one group. Double means TWO groups.' }, { v: n + 1, why: 'Double ' + n + ' is ' + n + ' + ' + n + ', not one more.' }, { v: n + 2, why: 'You added 2. Double means add the number to itself.' }, { v: 2 * n + 1, why: 'Count again: ' + n + ' + ' + n + ' makes ' + 2 * n + '.' }],
      nearby: NEAR, valid: pos, count: 3, hint: 'Count one group, then count the second group on from there.',
      explain: ex('Doubling', ['There are <b>2 groups of ' + n + '</b>.', n + ' + ' + n + ' = <b>' + 2 * n + '</b>.', 'Double ' + n + ' is ' + 2 * n + '. ✅']),
      truth: n * 2, decode: function(){ const g = V.decodeGroups(vis); return g.groups * g.per; }
    });
  }
  function qHalfPic(){
    const n = randInt(2, 10), m = 2 * n, vis = V.groups(2, n), who = pick(NAMES), it = pick(ITEMS);
    return mcqNum({
      prompt: m + ' ' + it + ' are shared equally between 2 friends. The picture shows the shares. How many does each friend get? (This is <b>half</b> of ' + m + '.)', visual: vis, answer: n,
      wrong: [{ v: m, why: m + ' is all of them. Half is each friend’s share.' }, { v: 2, why: '2 is the number of friends. Count the dots in ONE group.' }, { v: n + 1, why: 'Count the dots in one group again.' }, { v: n - 1, why: 'Count the dots in one group again.' }],
      nearby: NEAR, valid: pos, count: 3, hint: 'Count the dots in ONE of the two groups.',
      explain: ex('Halving', ['Sharing ' + m + ' between 2 gives 2 equal groups.', 'Each group has <b>' + n + '</b>.', 'Half of ' + m + ' is ' + n + ', because ' + n + ' + ' + n + ' = ' + m + '. ✅']),
      truth: shareOut(m), decode: function(){ return V.decodeGroups(vis).per; }
    });
  }
  function qDoubleRecall(){
    const n = randInt(6, 20), d = n + n;
    return mcqNum({
      prompt: 'What is <b>double ' + n + '</b>?', answer: d,
      wrong: [{ v: n + 2, why: 'You added 2. Double means ' + n + ' + ' + n + '.' }, { v: d + 1, why: 'Close, but ' + n + ' + ' + n + ' = ' + d + '.' }, { v: d - 1, why: 'Close, but ' + n + ' + ' + n + ' = ' + d + '.' }, { v: d + 10, why: 'Check the tens: ' + n + ' + ' + n + ' = ' + d + '.' }, { v: n, why: n + ' is the number you started with.' }],
      nearby: NEAR, valid: pos, count: 4, hint: 'Add the number to itself.',
      explain: ex('Doubling', ['Double means add the number to itself.', n + ' + ' + n + ' = <b>' + d + '</b>.', 'Check: half of ' + d + ' is ' + n + '. ✅']), truth: n * 2
    });
  }
  function qHalfRecall(){
    const h = randInt(4, 20), m = 2 * h;
    return mcqNum({
      prompt: 'What is <b>half of ' + m + '</b>?', answer: h,
      wrong: [{ v: m - 2, why: 'You took away 2. Half means split into 2 equal parts.' }, { v: 2 * m, why: 'That is double ' + m + '. Half is smaller.' }, { v: h + 1, why: 'Check: ' + (h + 1) + ' + ' + (h + 1) + ' = ' + 2 * (h + 1) + ', not ' + m + '.' }, { v: h - 1, why: 'Check: ' + (h - 1) + ' + ' + (h - 1) + ' = ' + 2 * (h - 1) + ', not ' + m + '.' }, { v: m / 2 + 10, why: 'Check the tens: half of ' + m + ' is ' + h + '.' }],
      nearby: NEAR, valid: pos, count: 4, hint: 'Which number added to itself makes ' + m + '?',
      explain: ex('Halving', ['Half means split into 2 equal parts.', h + ' + ' + h + ' = ' + m + ', so half of ' + m + ' is <b>' + h + '</b>.', 'Check: double ' + h + ' = ' + m + '. ✅']), truth: shareOut(m)
    });
  }
  function qNearDouble(){
    const n = randInt(4, 12), up = chance(0.7), other = up ? n + 1 : n - 1, s = n + other;
    return mcqNum({
      prompt: 'Double ' + n + ' is ' + 2 * n + '. So <b>' + n + ' + ' + other + '</b> = ?', answer: s,
      wrong: [{ v: 2 * n, why: 'Double ' + n + ' is ' + 2 * n + ', but ' + n + ' + ' + other + ' is ' + (up ? 'one more' : 'one less') + '.' }, { v: up ? s + 1 : s - 1, why: 'Only ' + (up ? 'add' : 'take away') + ' one from the double.' }, { v: up ? s - 2 : s + 2, why: 'Go ' + (up ? 'up' : 'down') + ' from the double, not the other way.' }, { v: n + other + 10, why: 'Check the tens: ' + 2 * n + (up ? ' + 1' : ' − 1') + '.' }],
      nearby: [1, -1, 2, -2], valid: pos, count: 4, hint: other + ' is ' + (up ? 'one more' : 'one less') + ' than ' + n + '. So the answer is ' + (up ? 'one more' : 'one less') + ' than the double.',
      explain: ex('Near doubles', [n + ' + ' + n + ' = ' + 2 * n + ' (the double).', other + ' is ' + (up ? '<b>one more</b>' : '<b>one less</b>') + ' than ' + n + ', so the answer is ' + (up ? 'one more' : 'one less') + ': ' + 2 * n + (up ? ' + 1' : ' − 1') + ' = <b>' + s + '</b>. ✅']), truth: other + n
    });
  }
  function qOddEven(){
    const m = randInt(5, 29), even = m % 2 === 0, who = pick(NAMES), it = pick(ITEMS);
    return mcq2({
      prompt: who + ' has ' + m + ' ' + it + ' and shares them equally between 2 friends. Is there an equal share with none left over?', correct: opt(K.bool(even), even ? 'Yes, they share equally' : 'No, one is left over'), other: opt(K.bool(!even), even ? 'No, one is left over' : 'Yes, they share equally', even ? m + ' is even: ' + m / 2 + ' + ' + m / 2 + ' = ' + m + '.' : m + ' is odd, so one is left over after sharing.'),
      hint: 'Even numbers end in 0, 2, 4, 6 or 8. They halve exactly.',
      explain: ex('Even or odd?', [m + ' ends in ' + (m % 10) + ', so it is ' + (even ? '<b>even</b>' : '<b>odd</b>') + '.', even ? 'Half of ' + m + ' is ' + m / 2 + ', with none left over.' : 'Share ' + m + ' between 2: each gets ' + (m - 1) / 2 + ' and 1 is left over.', even ? 'So they share equally. ✅' : 'So one is left over. ✅']), truth: K.bool(shareOut(m) !== -1)
    });
  }
  /* ---- tier 3: two-digit, typed ---- */
  function qDoubleTyped(){
    const t = randInt(1, 4), o = randInt(1, 9), n = 10 * t + o;
    return numeric({
      prompt: 'Type the answer:  <b>double ' + n + '</b>', answer: 2 * n,
      hint: 'Split ' + n + ' into ' + 10 * t + ' and ' + o + '. Double each part, then put them together.',
      explain: ex('Doubling a 2-digit number', ['Split ' + n + ' into <b>' + 10 * t + '</b> and <b>' + o + '</b>.', 'Double ' + 10 * t + ' = ' + 20 * t + ' and double ' + o + ' = ' + 2 * o + '.', 'Put them together: ' + 20 * t + ' + ' + 2 * o + ' = <b>' + 2 * n + '</b>. ✅']), truth: n + n,
      wrong: function(v){ return v === 20 * t + o ? 'You doubled the tens but not the ones. Double both parts.' : v === 2 * o + 10 * t ? 'You doubled the ones but not the tens. Double both parts.' : ''; }
    });
  }
  function qHalfTyped(){
    const t = randInt(1, 4), o = pick([2, 4, 6, 8]), m = 20 * t + 2 * o - 0, h = m / 2;
    return numeric({
      prompt: 'Type the answer:  <b>half of ' + m + '</b>', answer: h,
      hint: 'Split ' + m + ' into tens and ones that you can halve: ' + 20 * t + ' and ' + 2 * o + '.',
      explain: ex('Halving a 2-digit number', ['Split ' + m + ' into <b>' + 20 * t + '</b> and <b>' + 2 * o + '</b>.', 'Half of ' + 20 * t + ' = ' + 10 * t + ' and half of ' + 2 * o + ' = ' + o + '.', 'Put them together: ' + 10 * t + ' + ' + o + ' = <b>' + h + '</b>. ✅']), truth: shareOut(m),
      wrong: function(v){ return v === m - 2 ? 'You took away 2. Half means splitting into 2 equal parts.' : v === 2 * m ? 'That is double. Half is smaller.' : ''; }
    });
  }
  function qInverse(){
    const n = randInt(6, 45), d = 2 * n, half = chance(0.5), who = pick(NAMES);
    if(half) return numeric({
      prompt: 'Double a number is <b>' + d + '</b>. What is the number?', answer: n,
      hint: 'Halving undoes doubling. What is half of ' + d + '?',
      explain: ex('Halving undoes doubling', ['Doubling and halving are opposites.', 'Half of ' + d + ' is <b>' + n + '</b>.', 'Check: double ' + n + ' = ' + d + '. ✅']), truth: shareOut(d),
      wrong: function(v){ return v === 2 * d ? 'That is double ' + d + '. We need the number that was doubled to make ' + d + '.' : ''; }
    });
    return numeric({
      prompt: who + ' thinks of a number and halves it. The answer is <b>' + n + '</b>. What number did ' + who + ' think of?', answer: d,
      hint: 'Doubling undoes halving. What is double ' + n + '?',
      explain: ex('Doubling undoes halving', ['Halving and doubling are opposites.', 'Double ' + n + ' is <b>' + d + '</b>.', 'Check: half of ' + d + ' = ' + n + '. ✅']), truth: n + n,
      wrong: function(v){ return v === n ? n + ' is the answer after halving. Go backwards: double it.' : ''; }
    });
  }
  function qWordDouble(){
    const n = randInt(12, 45), who = pick(NAMES), who2 = pick(NAMES.filter(function(x){ return x !== who; })), it = pick(ITEMS), dbl = chance(0.5);
    return numeric({
      prompt: dbl ? who + ' has ' + n + ' ' + it + '. ' + who2 + ' has double that many. How many ' + it + ' does ' + who2 + ' have?' : who + ' has ' + 2 * n + ' ' + it + '. ' + who2 + ' has half as many. How many ' + it + ' does ' + who2 + ' have?', answer: dbl ? 2 * n : n,
      hint: dbl ? 'Double means add the number to itself.' : 'Half means split into 2 equal parts.',
      explain: ex(dbl ? 'Double in a story' : 'Half in a story', [dbl ? 'Double ' + n + ' = ' + n + ' + ' + n + '.' : 'Half of ' + 2 * n + ': ' + n + ' + ' + n + ' = ' + 2 * n + '.', 'So ' + who2 + ' has <b>' + (dbl ? 2 * n : n) + '</b> ' + it + '.', 'Check by doing the opposite. ✅']), truth: dbl ? n + n : shareOut(2 * n),
      wrong: function(v){ return v === (dbl ? n : 2 * n) ? 'That is the other number in the story. ' + (dbl ? 'Double it.' : 'Halve it.') : ''; }
    });
  }

  registerSkill({
    id: 'multdiv-doubles-halves', strand: 'multdiv', name: 'Doubles and halves', emoji: '👯', year: 2, order: 305, prereq: [],
    lesson: {
      title: 'Doubling and halving',
      steps: [
        { say: '<b>Double</b> means two equal groups. Double 6 is 6 + 6 = <b>12</b>. Here are two groups of 6 dots.', vis: { kind: 'groups', args: [2, 6] } },
        { say: '<b>Half</b> means sharing into 2 equal groups. Half of 12 is <b>6</b>, because 6 + 6 = 12. Halving is the opposite of doubling.', vis: { kind: 'groups', args: [2, 6] },
          quiz: { prompt: 'What is half of 14?', options: [{ label: '7', ok: true }, { label: '12', ok: false }, { label: '28', ok: false }], right: 'Yes! 7 + 7 = 14.', wrong: 'Which number added to itself makes 14? 7 + 7 = 14.' } },
        { say: '<b>Near doubles</b>: 7 + 8 is a double with one more. Double 7 = 14, and 8 is one more than 7, so 7 + 8 = <b>15</b>.', vis: { kind: 'groups', args: [2, 7] },
          quiz: { prompt: 'Double 6 is 12. What is 6 + 7?', options: [{ label: '13', ok: true }, { label: '14', ok: false }, { label: '12', ok: false }], right: 'Yes! One more than the double: 13.', wrong: '7 is one more than 6, so the answer is one more than 12: 13.' } },
        { say: 'For bigger numbers, <b>split into tens and ones</b>. Double 36: double 30 = 60, double 6 = 12, so 60 + 12 = <b>72</b>. Half of 72: half of 70 = 35, half of 2 = 1, so <b>36</b>.', vis: { kind: 'baseTen', args: [0, 3, 6] },
          quiz: { prompt: 'What is double 24?', options: [{ label: '48', ok: true }, { label: '44', ok: false }, { label: '28', ok: false }], right: 'Yes! 40 + 8 = 48.', wrong: 'Double 20 = 40 and double 4 = 8. 40 + 8 = 48.' } }
      ]
    },
    trick: {
      title: 'Split, double, join',
      say: 'To double a big number, <b>split it into tens and ones</b>, double each part, then <b>join</b> them. Halving works the same way, and halving undoes doubling.',
      vis: { kind: 'baseTen', args: [0, 4, 7] },
      example: 'Double 47 → 40 and 7 → 80 and 14 → 80 + 14 = <b>94</b> &nbsp;·&nbsp; Half of 94 = <b>47</b>'
    },
    gen: {
      1: function(){ return pick([qDoublePic, qDoublePic, qHalfPic, qHalfPic, qDoubleRecall])(); },
      2: function(){ return pick([qDoubleRecall, qDoubleRecall, qHalfRecall, qHalfRecall, qNearDouble, qNearDouble, qOddEven])(); },
      3: function(){ return pick([qDoubleTyped, qDoubleTyped, qHalfTyped, qHalfTyped, qInverse, qWordDouble, qWordDouble])(); }
    }
  });
})();
