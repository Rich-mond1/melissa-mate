/* number-negative — Year 4: negative numbers in context (temperature), number lines through zero, ordering, counting back, differences. */
(function(){
  const NAMES = ['Ana', 'Marcus', 'Sophie', 'Ivan', 'Lucy', 'Diego', 'Ellen', 'Tom', 'Aisha', 'Kai', 'Mei', 'Leo'];
  const PLACES = ['Oslo', 'Helsinki', 'Moscow', 'Quebec', 'Reykjavik', 'Edinburgh', 'Warsaw', 'Denver'];
  function fm(v){ return v < 0 ? '−' + (-v) : String(v); }          // proper minus sign for display
  function lab(v){ return v < 0 ? '−' + (-v) : v; }
  function deg(v){ return fm(v) + '°C'; }
  /* independent truths: step along the number line one unit at a time */
  function stepBy(start, n, dir){ let x = start; for(let i = 0; i < n; i++) x += dir; return x; }
  function stepsBetween(a, b){ let n = 0, x = a; const d = b > a ? 1 : -1; while(x !== b){ x += d; n++; } return n; }
  function line(lo, hi, mark){ return V.numberLine({ min: lo, max: hi, minor: 1, major: hi - lo > 12 ? 5 : 1, width: 340, labels: lab, marks: mark === undefined ? [] : [{ value: mark }] }); }
  function readLine(html){ return Math.round(V.decodeNumberLine(html)); }
  function valid10(v){ return v >= -20 && v <= 20; }

  /* ---- tier 1 ---- */
  function qReadLine(){
    const n = randInt(-9, 9), vis = line(-10, 10, n);
    return mcqNum({
      prompt: 'Which number does the red dot show?', visual: vis, answer: n, fmt: fm,
      wrong: [{ v: -n, why: 'Check which side of zero the dot is on. Left of zero is negative.' }, { v: n + 1, why: 'Count the steps from zero again.' }, { v: n - 1, why: 'Count the steps from zero again.' }, { v: n + 2, why: 'Count the steps from zero again.' }],
      nearby: [1, -1, 2, -2, 3], valid: function(v){ return v >= -10 && v <= 10; }, count: 4, hint: 'Find 0, then count the steps. Left is negative, right is positive.',
      explain: ex('Reading the line', ['Zero is in the middle. The dot is ' + Math.abs(n) + ' step' + (Math.abs(n) === 1 ? '' : 's') + ' ' + (n < 0 ? 'to the LEFT, so it is negative' : n > 0 ? 'to the RIGHT, so it is positive' : 'on zero') + '.', 'It shows <b>' + fm(n) + '</b>. ✅']),
      truth: n, decode: function(){ return readLine(vis); }
    });
  }
  function qColder(){
    const a = randInt(-9, 9); let b; do { b = randInt(-9, 9); } while(b === a || Math.abs(b) === Math.abs(a));
    const cold = Math.min(a, b), warm = Math.max(a, b), askCold = chance(0.6), pa = pick(PLACES); let pb; do { pb = pick(PLACES); } while(pb === pa);
    const ans = askCold ? cold : warm, oth = askCold ? warm : cold, cityOf = {}; cityOf[a] = pa; cityOf[b] = pb;
    return mcq2({
      prompt: 'It is ' + deg(a) + ' in ' + pa + ' and ' + deg(b) + ' in ' + pb + '. Which temperature is <b>' + (askCold ? 'colder' : 'warmer') + '</b>?',
      correct: opt(K.num(ans), deg(ans), askCold ? 'Further below zero means colder.' : 'The one nearer the top of the thermometer is warmer.'),
      other: opt(K.num(oth), deg(oth), askCold ? (oth < 0 ? deg(oth) + ' is below zero but not as far below as ' + deg(ans) + '.' : 'A temperature above zero is warmer than one below zero.') : 'Further below zero is colder, not warmer.'),
      hint: 'On the number line, the smaller number is further LEFT. Colder = smaller.',
      explain: ex('Colder means smaller', [fm(cold) + ' is further left on the number line than ' + fm(warm) + ', so it is smaller and colder.', 'The ' + (askCold ? 'colder' : 'warmer') + ' temperature is <b>' + deg(ans) + '</b>. ✅']), truth: K.num(askCold ? Math.min(a, b) : Math.max(a, b))
    });
  }
  function qOneLess(){
    const n = randInt(-8, 3), less = chance(0.5), ans = less ? n - 1 : n + 1, vis = line(-10, 10);
    return mcqNum({
      prompt: 'What number is <b>1 ' + (less ? 'less' : 'more') + '</b> than <b>' + fm(n) + '</b>?', visual: vis, answer: ans, fmt: fm,
      wrong: [{ v: less ? n + 1 : n - 1, why: 'That goes the wrong way. ' + (less ? 'Less means move LEFT.' : 'More means move RIGHT.') }, { v: -ans, why: 'Keep the sign: start at ' + fm(n) + ' and take one step.' }, { v: n, why: 'Take one step ' + (less ? 'left' : 'right') + ' from ' + fm(n) + '.' }],
      nearby: [1, -1, 2, -2], valid: function(v){ return v >= -10 && v <= 10; }, count: 4, hint: (less ? 'Less: one step left' : 'More: one step right') + ' on the number line.',
      explain: ex('One step on the line', ['Start at ' + fm(n) + '.', (less ? 'One less is one step LEFT' : 'One more is one step RIGHT') + ': <b>' + fm(ans) + '</b>. ✅']), truth: stepBy(n, 1, less ? -1 : 1)
    });
  }
  /* ---- tier 2 ---- */
  function qOrder(){
    const set = {}; const nums = []; while(nums.length < 4){ const n = randInt(-9, 9); if(!set[n]){ set[n] = 1; nums.push(n); } }
    if(!nums.some(function(n){ return n < 0; })) nums[0] = -randInt(1, 9) === nums[1] ? -nums[1] - 1 : -randInt(1, 9);
    const uniq = {}; const cl = nums.filter(function(n){ if(uniq[n]) return false; uniq[n] = 1; return true; }); while(cl.length < 4){ const n = randInt(-9, 9); if(!uniq[n]){ uniq[n] = 1; cl.push(n); } }
    const asc = chance(0.5), sorted = cl.slice().sort(function(a, b){ return a - b; }), ord = asc ? sorted : sorted.slice().reverse();
    return order({ prompt: 'Put these numbers in order, <b>' + (asc ? 'smallest to largest' : 'largest to smallest') + '</b>. Tap them one at a time.', items: ord.map(function(n){ return { key: String(n), label: fm(n) }; }),
      hint: 'Picture the number line. The furthest left is the smallest.', explain: ex('Ordering with negatives', ['Further left on the number line = smaller.', 'In order: <b>' + ord.map(fm).join(', ') + '</b>. ✅']), truth: 'o:' + ord.join('|') });
  }
  function qCountBack(){
    const start = randInt(1, 6), k = randInt(start + 1, start + 5), ans = stepBy(start, k, -1);
    return mcqNum({
      prompt: 'Start at <b>' + start + '</b> and count back <b>' + k + '</b>. Where do you land?', visual: line(-10, 10), answer: ans, fmt: fm,
      wrong: [{ v: k - start, why: 'You stopped at zero. Counting back goes THROUGH zero into the negatives.' }, { v: -(k - start) + 1, why: 'Count the steps carefully: ' + start + ' steps to reach zero, then ' + (k - start) + ' more.' }, { v: start - k + 1, why: 'Count the steps again.' }, { v: start + k, why: 'Back means move LEFT, not right.' }],
      nearby: [1, -1, 2], valid: function(v){ return v >= -10 && v <= 10; }, count: 4, hint: 'It takes ' + start + ' steps to reach 0. Then keep going left.',
      explain: ex('Counting back through zero', [start + ' steps to reach 0.', k + ' − ' + start + ' = ' + (k - start) + ' more steps into the negatives.', 'You land on <b>' + fm(ans) + '</b>. ✅']), truth: stepBy(start, k, -1)
    });
  }
  function qGreater(){
    const a = -randInt(1, 9); let b; do { b = -randInt(1, 9); } while(b === a);
    const big = Math.max(a, b), small = Math.min(a, b);
    return mcq2({ prompt: 'Which is <b>greater</b>: <b>' + fm(a) + '</b> or <b>' + fm(b) + '</b>?', correct: opt(K.num(big), fm(big), 'Closer to zero is greater when both numbers are negative.'), other: opt(K.num(small), fm(small), fm(small) + ' is further left on the number line, so it is smaller.'),
      hint: 'Which one is further to the right on the number line?', explain: ex('Comparing negatives', [fm(big) + ' is nearer to zero, so it is further right.', 'The greater number is <b>' + fm(big) + '</b>. ✅']), truth: K.num(Math.max(a, b)) });
  }
  /* ---- tier 3 ---- */
  function qCountHard(){
    const up = chance(0.35);
    if(up){ const s0 = -randInt(2, 9), kk = randInt(-s0 + 1, -s0 + 8), ans = stepBy(s0, kk, 1);
      return mcqNum({ prompt: 'Start at <b>' + fm(s0) + '</b> and count on <b>' + kk + '</b>. Where do you land?', answer: ans, fmt: fm,
        wrong: [{ v: kk + s0 - 1, why: 'Count the steps again: ' + -s0 + ' to reach 0, then ' + (kk + s0) + ' more.' }, { v: s0 + kk + 1, why: 'Count the steps again: ' + -s0 + ' to reach 0, then ' + (kk + s0) + ' more.' }, { v: s0 - kk, why: 'On means move RIGHT, towards bigger numbers.' }, { v: -ans, why: 'Check which side of zero you end on.' }],
        nearby: [1, -1, 2, -2], valid: function(v){ return v >= -20 && v <= 20; }, count: 4, hint: 'It takes ' + -s0 + ' steps to reach 0, then keep counting up.',
        explain: ex('Counting on through zero', [-s0 + ' steps to reach 0.', kk + ' − ' + -s0 + ' = ' + (kk + s0) + ' more steps.', 'You land on <b>' + fm(ans) + '</b>. ✅']), truth: stepBy(s0, kk, 1) }); }
    const start = randInt(2, 9), k = randInt(start + 1, start + 9), ans = stepBy(start, k, -1);
    return mcqNum({ prompt: 'Start at <b>' + start + '</b> and count back <b>' + k + '</b>. Where do you land?', answer: ans, fmt: fm,
      wrong: [{ v: k - start, why: 'You stopped at zero. Counting back goes THROUGH zero into the negatives.' }, { v: ans + 1, why: 'Count the steps again: ' + start + ' to reach 0, then ' + (k - start) + ' more.' }, { v: ans - 1, why: 'Count the steps again: ' + start + ' to reach 0, then ' + (k - start) + ' more.' }, { v: start + k, why: 'Back means move LEFT, not right.' }],
      nearby: [1, -1, 2, -2], valid: function(v){ return v >= -20 && v <= 20; }, count: 4, hint: 'It takes ' + start + ' steps to reach 0, then keep counting back.',
      explain: ex('Counting back through zero', [start + ' steps to reach 0.', k + ' − ' + start + ' = ' + (k - start) + ' more steps.', 'You land on <b>' + fm(ans) + '</b>. ✅']), truth: stepBy(start, k, -1) });
  }
  function qRise(){
    const a = -randInt(2, 9), b = randInt(2, 9), who = pick(PLACES), up = chance(0.5), from = up ? a : b, to = up ? b : a;
    return numeric({ prompt: 'In ' + who + ' the temperature ' + (up ? 'rises' : 'falls') + ' from <b>' + deg(from) + '</b> to <b>' + deg(to) + '</b>. By how many degrees does it ' + (up ? 'rise' : 'fall') + '?', answer: stepsBetween(from, to), hint: 'Count the steps from ' + fm(from) + ' to 0, then from 0 to ' + fm(to) + '.',
      explain: ex('The difference across zero', [Math.abs(a) + ' degrees to reach 0, then ' + b + ' more.', Math.abs(a) + ' + ' + b + ' = <b>' + (Math.abs(a) + b) + '</b> degrees. ✅']), truth: stepsBetween(from, to),
      wrong: function(v){ return v === Math.abs(Math.abs(a) - b) ? 'You took one from the other. The temperature crosses zero, so ADD the two parts.' : ''; } });
  }
  function qFall(){
    const start = randInt(1, 8), drop = randInt(start + 1, start + 9), who = pick(PLACES), ans = stepBy(start, drop, -1);
    return mcqNum({ prompt: 'At noon it is <b>' + deg(start) + '</b> in ' + who + '. By midnight it has fallen by <b>' + drop + '</b> degrees. What is the temperature at midnight?', answer: ans, fmt: deg,
      wrong: [{ v: drop - start, why: 'The sign is missing: it fell BELOW zero, so the answer is negative.' }, { v: start - drop + 1, why: 'Count the steps again.' }, { v: start - drop - 1, why: 'Count the steps again.' }, { v: start + drop, why: 'Fallen means colder: move LEFT.' }],
      nearby: [1, -1, 2, -2], valid: function(v){ return v >= -20 && v <= 20; }, count: 4, hint: 'Count down ' + start + ' to reach 0, then keep going.',
      explain: ex('Falling below zero', [start + ' degrees to reach 0, then ' + (drop - start) + ' more.', 'Midnight: <b>' + deg(ans) + '</b>. ✅']), truth: stepBy(start, drop, -1) });
  }
  function qColdest(){
    const t = []; const used = {}; while(t.length < 4){ const n = randInt(-9, 6); if(!used[n]){ used[n] = 1; t.push(n); } }
    const names = shuffle(PLACES.slice()).slice(0, 4), cold = Math.min.apply(null, t), idx = t.indexOf(cold);
    return mcq({ prompt: 'Temperatures today: ' + t.map(function(v, i){ return names[i] + ' ' + deg(v); }).join(', ') + '. Which place is the <b>coldest</b>?', correct: opt('c:' + names[idx], names[idx]),
      distractors: names.map(function(nm, i){ return i === idx ? null : opt('c:' + nm, nm, deg(t[i]) + ' is warmer than ' + deg(cold) + '.'); }).filter(Boolean), keepOrder: true, count: 4,
      hint: 'The coldest is the smallest number, the one furthest below zero.', explain: ex('Finding the coldest', ['The smallest number is the coldest: <b>' + deg(cold) + '</b>.', 'That is ' + names[idx] + '. ✅']), truth: 'c:' + names[t.indexOf(Math.min.apply(null, t))] });
  }
  const NL = line(-5, 5, -3);
  registerSkill({
    id: 'number-negative', strand: 'number', name: 'Negative numbers', emoji: '🌡️', year: 4, order: 195, prereq: ['number-count-steps', 'number-compare-order'],
    lesson: { title: 'Numbers below zero', steps: [
      { say: 'Numbers can go <b>below zero</b>. On a number line, left of 0 is <b>negative</b>. A temperature of −3°C means 3 degrees below freezing.', vis: { kind: 'numberLine', args: [{ min: -5, max: 5, minor: 1, major: 1, width: 340, labels: lab, marks: [{ value: -3 }] }] } },
      { say: 'Further <b>left</b> means <b>smaller</b>. So −5 is smaller than −2, and any negative is smaller than 0. Colder means smaller.', vis: { kind: 'numberLine', args: [{ min: -5, max: 5, minor: 1, major: 1, width: 340, labels: lab, marks: [{ value: -5 }] }] },
        quiz: { prompt: 'Which is colder: −4°C or −1°C?', options: [{ label: '−4°C', ok: true }, { label: '−1°C', ok: false }], right: 'Yes! −4 is further left, so it is smaller.', wrong: '−4 is further below zero than −1, so it is colder.' } },
      { say: 'Counting back from 2: 1, 0, <b>−1, −2, −3</b>. You go through zero. To find a difference across zero, count to zero and then on: from −4 to 3 is 4 + 3 = <b>7</b>.', vis: { kind: 'numberLine', args: [{ min: -5, max: 5, minor: 1, major: 1, width: 340, labels: lab, marks: [{ value: -2 }] }] },
        quiz: { prompt: 'Start at 1 and count back 3. Where do you land?', options: [{ label: '−2', ok: true }, { label: '2', ok: false }, { label: '−3', ok: false }], right: 'Yes! 1, 0, −1, −2.', wrong: 'Count back: 1 → 0 → −1 → −2. You land on −2.' } }
    ] },
    trick: { title: 'Left is smaller', say: 'On a number line, <b>left is smaller</b> and <b>right is bigger</b>. Negatives live left of zero. To count or find a difference across zero, go <b>to zero first</b>, then keep going.', vis: { kind: 'numberLine', args: [{ min: -5, max: 5, minor: 1, major: 1, width: 340, labels: lab, marks: [{ value: 0 }] }] }, example: 'From −4 up to 3: 4 steps to zero + 3 more = <b>7</b>' },
    gen: {
      1: function(){ return pick([qReadLine, qReadLine, qColder, qOneLess])(); },
      2: function(){ return pick([qOrder, qCountBack, qCountBack, qGreater, qColder, qReadLine])(); },
      3: function(){ return pick([qCountHard, qRise, qRise, qFall, qColdest, qOrder])(); }
    }
  });
})();
