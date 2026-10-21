/* number-roman-100 — Year 4: Roman numerals to 100 (I V X L C), subtractive rule, reading and writing. */
(function(){
  const NAMES = ['Ana', 'Marcus', 'Sophie', 'Ivan', 'Lucy', 'Diego', 'Ellen', 'Tom', 'Aisha', 'Kai', 'Mei', 'Leo'];
  const VAL = [[100, 'C'], [90, 'XC'], [50, 'L'], [40, 'XL'], [10, 'X'], [9, 'IX'], [5, 'V'], [4, 'IV'], [1, 'I']];
  function toRoman(n){ let s = ''; VAL.forEach(function(p){ while(n >= p[0]){ s += p[1]; n -= p[0]; } }); return s; }
  /* independent route: digit-wise lookup tables (the generator above is greedy) */
  const TENS = ['', 'X', 'XX', 'XXX', 'XL', 'L', 'LX', 'LXX', 'LXXX', 'XC', 'C'], ONES = ['', 'I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX'];
  function toRomanTable(n){ if(n === 100) return 'C'; return TENS[Math.floor(n / 10)] + ONES[n % 10]; }
  function parseRoman(s){
    const v = { I: 1, V: 5, X: 10, L: 50, C: 100 }; let t = 0;
    for(let i = 0; i < s.length; i++){ const a = v[s[i]], b = v[s[i + 1]] || 0; t += a < b ? -a : a; }
    return t;
  }
  function rk(s){ return 'r:' + s; }
  function additive(n){ /* the tempting wrong form: no subtraction */ let s = ''; [[100, 'C'], [50, 'L'], [10, 'X'], [5, 'V'], [1, 'I']].forEach(function(p){ while(n >= p[0]){ s += p[1]; n -= p[0]; } }); return s; }

  const KEY = '<table style="border-collapse:collapse;margin:0 auto;font:800 24px ui-monospace,Menlo,monospace;color:var(--vis-ink,#1B1B2F)"><tr>' + [['I', 1], ['V', 5], ['X', 10], ['L', 50], ['C', 100]].map(function(p){ return '<td style="padding:6px 12px;text-align:center;border:2px solid var(--vis-ink,#1B1B2F)">' + p[0] + '<div style="font-size:15px;color:var(--vis-b,#9B51E0)">' + p[1] + '</div></td>'; }).join('') + '</tr></table>';
  function qRomanToNum(maxN){
    const n = randInt(2, maxN), r = toRoman(n), w = [];
    const sw = r.split('').reverse().join('');
    if(sw !== r && parseRoman(sw) !== n) w.push({ v: parseRoman(sw), why: /IV|IX|XL|XC/.test(r) ? 'The order matters. A small numeral BEFORE a bigger one is taken away: ' + r + ' = ' + n + '.' : 'The order matters. A small numeral AFTER a bigger one is added on: ' + r + ' = ' + n + '.' });
    const add = r.split('').reduce(function(a, c){ return a + ({ I: 1, V: 5, X: 10, L: 50, C: 100 })[c]; }, 0);
    if(add !== n) w.push({ v: add, why: 'You added every symbol. When a smaller one comes BEFORE a bigger one it is subtracted.' });
    return mcqNum({
      prompt: 'Which number is the Roman numeral <b>' + r + '</b>?', answer: n, wrong: w, nearby: [1, -1, 10, -10, 2, -2, 5, -5, 4], valid: function(v){ return v > 0 && v <= 100; }, count: 4,
      hint: 'Read the symbols: I = 1, V = 5, X = 10, L = 50, C = 100. A smaller one before a bigger one is taken away.',
      explain: ex('Reading a Roman numeral', [r + ' = ' + (function(){ const v = { I: 1, V: 5, X: 10, L: 50, C: 100 }; const parts = []; for(let i = 0; i < r.length; i++){ const a = v[r[i]], b = v[r[i + 1]] || 0; if(a < b){ parts.push('(' + v[r[i + 1]] + ' − ' + a + ')'); i++; } else parts.push(a); } return parts.join(' + '); })() + ' = <b>' + n + '</b>. ✅']), truth: parseRoman(r)
    });
  }
  function qNumToRoman(maxN){
    const n = randInt(2, maxN), r = toRoman(n), cands = [], seen = {}; seen[r] = 1;
    function add(s, why){ if(s && !seen[s] && parseRoman(s) !== n){ seen[s] = 1; cands.push(opt(rk(s), s, why)); } }
    const ad = additive(n); if(ad !== r) add(ad, 'Roman numerals never repeat a symbol 4 times. Use the subtraction rule (like IV for 4, IX for 9, XL for 40, XC for 90).');
    add(r.split('').reverse().join(''), 'The order matters: ' + (r.length > 1 ? 'a smaller numeral before a bigger one means subtract.' : 'check the symbol.'));
    [1, -1, 10, -10, 5, -5, 2].forEach(function(d){ const m = n + d; if(m > 0 && m <= 100) add(toRoman(m), toRoman(m) + ' is ' + m + ', not ' + n + '.'); });
    return mcq({
      prompt: 'Which Roman numeral is the number <b>' + n + '</b>?', correct: opt(rk(r), r), distractors: cands, keepOrder: true, count: 4,
      hint: 'Build it from I = 1, V = 5, X = 10, L = 50, C = 100. Use IV, IX, XL, XC for 4, 9, 40, 90.',
      explain: ex('Writing a Roman numeral', [(function(){ const t = Math.floor(n / 10) * 10, o = n % 10; if (!o) return n + ' = ' + t + ' → ' + toRoman(t); if (!t) return n + ' → ' + toRoman(o); return n + ' = ' + t + ' + ' + o + ' → ' + toRoman(t) + ' and ' + toRoman(o); })() + '.', 'Together: <b>' + r + '</b>. ✅']), truth: rk(toRomanTable(n))
    });
  }
  function qTypedToNum(){
    const n = randInt(20, 100), r = toRoman(n);
    return numeric({ prompt: 'Type the number for the Roman numeral  <b>' + r + '</b>', answer: n, hint: 'L = 50, X = 10, V = 5, I = 1. Smaller before bigger means subtract.',
      explain: ex('Reading a Roman numeral', [r + ' = <b>' + n + '</b>. ✅']), truth: parseRoman(r),
      wrong: function(v){ return v === r.split('').reduce(function(a, c){ return a + ({ I: 1, V: 5, X: 10, L: 50, C: 100 })[c]; }, 0) && v !== n ? 'You added everything. A smaller numeral BEFORE a bigger one is subtracted.' : ''; } });
  }
  function qOrderRoman(){
    const nums = []; const seen = {}; while(nums.length < 4){ const n = randInt(3, 99); if(!seen[n]){ seen[n] = 1; nums.push(n); } }
    const asc = chance(0.5), sorted = nums.slice().sort(function(a, b){ return a - b; }), ord = asc ? sorted : sorted.slice().reverse();
    return order({ prompt: 'Put these Roman numerals in order, <b>' + (asc ? 'smallest to largest' : 'largest to smallest') + '</b>. Tap them one at a time.', items: ord.map(function(n){ return { key: toRoman(n), label: toRoman(n) }; }),
      hint: 'Work out the value of each one first.', explain: ex('Ordering Roman numerals', ['Values: ' + ord.map(function(n){ return toRoman(n) + ' = ' + n; }).join(', ') + '.', 'In order: <b>' + ord.map(toRoman).join(', ') + '</b>. ✅']), truth: 'o:' + ord.map(toRomanTable).join('|') });
  }
  function qAddRoman(){
    const a = randInt(3, 40), b = randInt(2, 30), r = toRoman(a) + ' + ' + toRoman(b);
    return numeric({ prompt: 'Work out  <b>' + r + '</b>  Type your answer as a normal number.', answer: a + b, hint: 'Change each Roman numeral to a number, then add.',
      explain: ex('Roman sums', [toRoman(a) + ' = ' + a + ' and ' + toRoman(b) + ' = ' + b + '.', a + ' + ' + b + ' = <b>' + (a + b) + '</b> (in Roman: ' + toRoman(a + b) + '). ✅']), truth: parseRoman(toRoman(a)) + parseRoman(toRoman(b)) });
  }
  function qWhichIsWrong(){
    const n = pick([4, 9, 14, 19, 24, 29, 34, 39, 40, 44, 49, 90, 94, 99]), bad = additive(n), good = toRoman(n);
    return mcq2({ prompt: 'One of these is the correct Roman numeral for <b>' + n + '</b>. Which one?', correct: opt(rk(good), good, 'Yes: subtraction is used so no symbol repeats 4 times.'), other: opt(rk(bad), bad, 'Roman numerals do not use the same symbol 4 times in a row. Use the subtraction rule.'),
      hint: 'Do not repeat a symbol 4 times: use IV, IX, XL or XC.', explain: ex('The subtraction rule', [n + ' is written <b>' + good + '</b>.', 'Writing ' + bad + ' would repeat a symbol too many times. ✅']), truth: rk(toRomanTable(n)) });
  }
  function qYearWord(){
    const who = pick(NAMES), n = randInt(12, 99), r = toRoman(n);
    return numeric({ prompt: who + ' sees the page number <b>' + r + '</b> in an old book. What page number is that? Type it.', answer: n, hint: 'Change the Roman numeral to a number.', explain: ex('Reading a Roman numeral', [r + ' = <b>' + n + '</b>. ✅']), truth: parseRoman(r) });
  }
  registerSkill({
    id: 'number-roman-100', strand: 'number', name: 'Roman numerals to 100', emoji: '🏛️', year: 4, order: 185, prereq: ['time-roman'],
    lesson: { title: 'Roman numerals up to 100', steps: [
      { say: 'Roman numerals use letters: <b>I = 1, V = 5, X = 10, L = 50, C = 100</b>. Put them side by side to add: XVI = 10 + 5 + 1 = <b>16</b>.', vis: { kind: 'html', args: [KEY] } },
      { say: 'A smaller numeral <b>before</b> a bigger one is <b>taken away</b>: IV = 5 − 1 = <b>4</b>, IX = <b>9</b>, XL = 50 − 10 = <b>40</b>, XC = 100 − 10 = <b>90</b>. We never write the same symbol four times.',
        quiz: { prompt: 'Which Roman numeral is 9?', options: [{ label: 'IX', ok: true }, { label: 'VIIII', ok: false }, { label: 'XI', ok: false }], right: 'Yes! 10 − 1 = 9.', wrong: 'IX means 10 − 1 = 9. XI is 11.' } },
      { say: 'To write a number, say its tens and ones: <b>47</b> = 40 + 7 = <b>XL</b> + <b>VII</b> = <b>XLVII</b>. To read one, go left to right and watch for a small numeral before a big one.',
        quiz: { prompt: 'What is XLII?', options: [{ label: '42', ok: true }, { label: '62', ok: false }, { label: '38', ok: false }], right: 'Yes! XL = 40, II = 2.', wrong: 'XL = 40 (50 − 10), then II = 2. So 42.' } }
    ] },
    trick: { title: 'Tens then ones', say: 'Write the <b>tens</b> first, then the <b>ones</b>. Use <b>IV, IX, XL, XC</b> for 4, 9, 40, 90. Never write the same symbol 4 times.', example: '68 = 60 + 8 = LX + VIII = <b>LXVIII</b> &nbsp;·&nbsp; 94 = XC + IV = <b>XCIV</b>' },
    gen: {
      1: function(){ return pick([function(){ return qRomanToNum(39); }, function(){ return qNumToRoman(39); }, function(){ return qRomanToNum(19); }])(); },
      2: function(){ return pick([function(){ return qRomanToNum(100); }, function(){ return qNumToRoman(100); }, qWhichIsWrong, qOrderRoman])(); },
      3: function(){ return pick([qTypedToNum, qTypedToNum, qAddRoman, qOrderRoman, qYearWord, qWhichIsWrong])(); }
    }
  });
})();
