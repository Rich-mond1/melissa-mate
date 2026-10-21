/* multdiv-remainders — Year 3 (school calculation policy: division with remainders): what is left over when sharing is not exact, written "q remainder r". */
(function(){
  const NAMES = ['Ana', 'Marcus', 'Sophie', 'Ivan', 'Lucy', 'Diego', 'Ellen', 'Tom', 'Aisha', 'Kai', 'Mei', 'Leo'];
  const ITEMS = [['sweets', 'bags'], ['stickers', 'packs'], ['marbles', 'jars'], ['biscuits', 'plates'], ['pencils', 'pots'], ['cupcakes', 'trays'], ['stars', 'boxes'], ['strawberries', 'baskets']];
  const DIVS = [2, 3, 4, 5, 8, 10];
  function pos(v){ return v > 0; }
  function nonneg(v){ return v >= 0; }
  /* independent source of truth: repeated subtraction (the questions are BUILT from n = d × q + r) */
  function divmod(n, d){ let q = 0; while(n >= d){ n -= d; q++; } return { q: q, r: n }; }
  function countIn(d, q){ const out = []; for(let i = 1; i <= q; i++) out.push(i === q ? '<b>' + d * i + '</b>' : String(d * i)); return out.join(', '); }
  function make(maxQ, forceRem){
    const d = pick(DIVS), q = randInt(2, maxQ), r = (forceRem || chance(0.85)) ? randInt(1, d - 1) : 0;
    return { d: d, q: q, r: r, n: d * q + r };
  }
  function steps(m){
    const full = m.d * m.q;
    return ['Count in <b>' + m.d + 's</b> until the next one would be too big: ' + countIn(m.d, m.q) + '. That is <b>' + m.q + '</b> full groups.', m.n + ' − ' + full + ' = <b>' + m.r + '</b> left over.', m.n + ' ÷ ' + m.d + ' = <b>' + m.q + ' remainder ' + m.r + '</b>. ✅'];
  }
  function lbl(q, r){ return r === 0 ? String(q) : q + ' remainder ' + r; }

  /* ---------- tier 1: pictures of the FULL groups; the leftovers are only in the story ---------- */
  function qFullGroups(){
    const m = make(5, true), it = pick(ITEMS), vis = V.groups(m.q, m.d);
    return mcqNum({
      prompt: 'There are ' + m.n + ' ' + it[0] + '. They go into ' + it[1] + ' of ' + m.d + '. The picture shows the FULL ' + it[1] + '. How many full ' + it[1] + ' are there?', visual: vis, answer: m.q,
      wrong: [{ v: m.q + 1, why: 'The ' + m.r + ' left over do not fill another ' + it[1].replace(/s$/, '') + ', so they do not count.' }, { v: m.d, why: m.d + ' is how many are in each. Count the full groups in the picture.' }, { v: m.n, why: m.n + ' is how many ' + it[0] + ' there are altogether. Count the full groups.' }, { v: m.q - 1, why: 'Count the groups in the picture again.' }],
      nearby: [1, -1, 2], valid: pos, count: 3,
      hint: 'Each ring is one full group of ' + m.d + '. Count the rings.',
      explain: ex('Full groups', ['Each full group holds <b>' + m.d + '</b>.', 'Count in ' + m.d + 's: ' + countIn(m.d, m.q) + '. That is <b>' + m.q + '</b> full groups.', 'There are ' + m.q + ' full ' + it[1] + ' and ' + m.r + ' left over. ✅']),
      truth: divmod(m.n, m.d).q, decode: function(){ return V.decodeGroups(vis).groups; }
    });
  }
  function qLeftOver(){
    const m = make(5, true), it = pick(ITEMS), vis = V.groups(m.q, m.d);
    return mcqNum({
      prompt: 'There are ' + m.n + ' ' + it[0] + '. The picture shows the full ' + it[1] + ' of ' + m.d + '. How many ' + it[0] + ' are left over?', visual: vis, answer: m.r,
      wrong: [{ v: m.d, why: m.d + ' is how many fit in a full group. The left over ones are fewer than that.' }, { v: m.q, why: m.q + ' is the number of full groups, not the number left over.' }, { v: m.d - m.r, why: 'That is how many MORE you would need to fill another group. The question asks how many are left over.' }, { v: m.r + 1, why: 'Count again: ' + m.n + ' − ' + m.d * m.q + ' = ' + m.r + '.' }],
      nearby: [1, -1, 2], valid: pos, count: 3,
      hint: 'Count how many ' + it[0] + ' are in the full groups. Take that away from ' + m.n + '.',
      explain: ex('Left over', ['The picture has ' + m.q + ' full groups of ' + m.d + ': ' + countIn(m.d, m.q) + ' ' + it[0] + '.', m.n + ' − ' + m.d * m.q + ' = <b>' + m.r + '</b>.', nnoun(m.r, it[0]) + ' ' + isAre(m.r) + ' left over. ✅']),
      truth: m.n - V.decodeGroups(vis).total, decode: function(){ return m.n - V.decodeGroups(vis).total; }
    });
  }
  function qFitsExactly(){
    const m = make(5, false), exact = m.r === 0, it = pick(ITEMS);
    return mcq2({
      prompt: m.n + ' ' + it[0] + ' go into ' + it[1] + ' of ' + m.d + '. Will there be some left over?', correct: opt(K.bool(!exact), exact ? 'No, none left over' : 'Yes, some left over'), other: opt(K.bool(exact), exact ? 'Yes, some left over' : 'No, none left over', exact ? m.d + ' × ' + m.q + ' = ' + m.n + ' exactly, so nothing is left.' : 'Count in ' + m.d + 's: ' + countIn(m.d, m.q) + '. It skips over ' + m.n + ', so some are left over.'),
      hint: 'Count in ' + m.d + 's. Do you land exactly on ' + m.n + '?',
      explain: ex('Exact or not?', ['Count in ' + m.d + 's: ' + countIn(m.d, m.q) + (exact ? '.' : ', then the next is ' + m.d * (m.q + 1) + '.'), exact ? 'We land exactly on <b>' + m.n + '</b>, so nothing is left over.' : 'We never land on ' + m.n + ', so <b>' + m.r + '</b> ' + isAre(m.r) + ' left over.', exact ? m.n + ' ÷ ' + m.d + ' = ' + m.q + '. ✅' : m.n + ' ÷ ' + m.d + ' = ' + m.q + ' remainder ' + m.r + '. ✅']),
      truth: K.bool(divmod(m.n, m.d).r !== 0)
    });
  }

  /* ---------- tier 2: recall and meaning ---------- */
  function qChooseAnswer(){
    const m = make(8, true), good = lbl(m.q, m.r), ds = [];
    const add = function(q, r, why){ const l = r === 0 ? String(q) : q + ' remainder ' + r; if(l !== good && !ds.some(function(d){ return d.label === l; }) && q >= 0) ds.push(opt(K.text(l), l, why)); };
    add(m.q + 1, 0, 'You rounded up. The ' + m.r + ' left over do not make another full group, so we write them as a remainder.');
    if(m.d - m.r !== m.r) add(m.q, m.d - m.r, 'You found how many MORE are needed to make another group. The remainder is what is LEFT: ' + m.n + ' − ' + m.d * m.q + ' = ' + m.r + '.');
    if(m.r !== m.q) add(m.r, m.q, 'You swapped the two numbers. The number of full groups comes first (' + m.q + '), then the remainder (' + m.r + ').');
    add(m.q - 1, m.r + m.d, 'A remainder of ' + (m.r + m.d) + ' is too big: another group of ' + m.d + ' fits. The remainder must be smaller than ' + m.d + '.');
    add(m.q, m.r + 1, 'Check the subtraction: ' + m.n + ' − ' + m.d * m.q + ' = ' + m.r + ', not ' + (m.r + 1) + '.');
    add(m.q + 1, m.r, 'There are only ' + m.q + ' full groups. Count in ' + m.d + 's: ' + countIn(m.d, m.q) + '.');
    return mcq({
      prompt: 'What is <b>' + m.n + ' ÷ ' + m.d + '</b>?', correct: opt(K.text(good), good), distractors: ds, keepOrder: true, count: 4,
      hint: 'Count in ' + m.d + 's without going over ' + m.n + '. How many jumps? What is left?',
      explain: ex('Dividing with a remainder', steps(m)), truth: K.text(lbl(divmod(m.n, m.d).q, divmod(m.n, m.d).r))
    });
  }
  function qRemainderOnly(){
    const m = make(8, true);
    return mcqNum({
      prompt: 'What is the <b>remainder</b> when ' + m.n + ' is divided by ' + m.d + '?', answer: m.r,
      wrong: [{ v: m.q, why: m.q + ' is the number of full groups. The remainder is what is left over.' }, { v: m.d - m.r, why: 'That is how many more you need to make another group. The remainder is what is left: ' + m.n + ' − ' + m.d * m.q + '.' }, { v: m.d, why: 'A remainder is always smaller than ' + m.d + ', the number you divide by.' }, { v: m.r + 1, why: 'Check: ' + m.n + ' − ' + m.d * m.q + ' = ' + m.r + '.' }],
      nearby: [1, -1, 2, -2, 3, 4, 5, 6], valid: pos, count: 4,
      hint: 'Find the biggest number in the ' + m.d + ' times table that fits into ' + m.n + '. Then see how many are left.',
      explain: ex('Finding the remainder', steps(m)), truth: divmod(m.n, m.d).r
    });
  }
  function qWordFull(){
    const m = make(8, true), it = pick(ITEMS), who = pick(NAMES), askLeft = chance(0.5);
    return mcqNum({
      prompt: who + ' has ' + m.n + ' ' + it[0] + ' and puts ' + m.d + ' in each of the ' + it[1] + '. ' + (askLeft ? 'How many ' + it[0] + ' are left over?' : 'How many ' + it[1] + ' can ' + who + ' fill?'), answer: askLeft ? m.r : m.q,
      wrong: askLeft ? [{ v: m.q, why: m.q + ' is the number of full ' + it[1] + '. The question asks how many are left over.' }, { v: m.d - m.r, why: 'That is how many more are needed to fill another one. We want the ones left over.' }, { v: m.r + 1, why: 'Check: ' + m.n + ' − ' + m.d * m.q + ' = ' + m.r + '.' }]
        : [{ v: m.q + 1, why: 'The ' + m.r + ' left over cannot fill another one, so only ' + m.q + ' are filled.' }, { v: m.r, why: m.r + ' is how many are left over. The question asks how many are filled.' }, { v: m.d, why: m.d + ' is how many go in each. Count how many ' + it[1] + ' you can fill.' }],
      nearby: [1, -1, 2, -2, 3, 4, 5, 6], valid: pos, count: 4,
      hint: 'Count in ' + m.d + 's without going over ' + m.n + '.', explain: ex(askLeft ? 'What is left over' : 'Full ' + it[1], steps(m)), truth: askLeft ? m.n - m.d * divmod(m.n, m.d).q : divmod(m.n, m.d).q
    });
  }
  function qNearestFact(){
    const m = make(8, true), good = m.d + ' × ' + m.q + ' = ' + m.d * m.q, ds = [];
    [[m.q + 1, 'It is bigger than ' + m.n + '. For a remainder we need the nearest fact that does NOT go over.'], [m.q - 1, 'It is true, but not the nearest. A bigger fact still fits into ' + m.n + '.'], [m.q + 2, 'It is bigger than ' + m.n + ', so it goes over.']].forEach(function(c){
      if(c[0] >= 1){ const l = m.d + ' × ' + c[0] + ' = ' + m.d * c[0]; if(l !== good) ds.push(opt(K.text(l), l, c[1])); }
    });
    return mcq({
      prompt: 'To work out <b>' + m.n + ' ÷ ' + m.d + '</b>, count in ' + m.d + 's. Which fact in the ' + m.d + ' times table is the <b>biggest one that is not more than</b> ' + m.n + '?', correct: opt(K.text(good), good), distractors: ds, keepOrder: true, count: 4,
      hint: 'All the facts are true. Pick the one that is closest to ' + m.n + ' but not bigger than ' + m.n + '.',
      explain: ex('Nearest fact', ['Count in ' + m.d + 's: ' + countIn(m.d, m.q) + ', then ' + m.d * (m.q + 1) + ' is too big.', 'The nearest fact without going over ' + m.n + ' is <b>' + good + '</b>.', m.n + ' − ' + m.d * m.q + ' = ' + m.r + ', so ' + m.n + ' ÷ ' + m.d + ' = ' + m.q + ' remainder ' + m.r + '. ✅']),
      truth: K.text(m.d + ' × ' + divmod(m.n, m.d).q + ' = ' + m.d * divmod(m.n, m.d).q)
    });
  }

  /* ---------- tier 3: typed answers, reasoning ---------- */
  function qTypedRem(){
    const m = make(10, true);
    return numeric({
      prompt: 'What is the remainder when <b>' + m.n + '</b> is divided by <b>' + m.d + '</b>?', answer: m.r,
      hint: 'Find the biggest number in the ' + m.d + ' times table that is not more than ' + m.n + '. Take it away from ' + m.n + '.',
      explain: ex('Finding the remainder', steps(m)), truth: divmod(m.n, m.d).r,
      wrong: function(v){ return v === m.q ? m.q + ' is the number of full groups. The remainder is what is left over.' : v === m.d - m.r ? 'That is how many more you need for another group. The remainder is what is LEFT.' : v >= m.d ? 'A remainder is always smaller than ' + m.d + ', otherwise another group would fit.' : ''; }
    });
  }
  function qTypedFull(){
    const m = make(10, true), it = pick(ITEMS), who = pick(NAMES);
    return numeric({
      prompt: who + ' has ' + m.n + ' ' + it[0] + '. ' + who + ' fills ' + it[1] + ' that each hold ' + m.d + '. How many are filled completely?', answer: m.q,
      hint: 'Count in ' + m.d + 's without going over ' + m.n + '.', explain: ex('Full ' + it[1], steps(m)), truth: divmod(m.n, m.d).q,
      wrong: function(v){ return v === m.q + 1 ? 'The ' + m.r + ' left over cannot fill another one.' : v === m.r ? m.r + ' is the number left over, not the number filled.' : ''; }
    });
  }
  function qBoxesNeeded(){
    const m = make(8, true), it = pick(ITEMS), who = pick(NAMES);
    return numeric({
      prompt: who + ' has ' + m.n + ' ' + it[0] + ' to put away. Each of the ' + it[1] + ' holds ' + m.d + '. How many ' + it[1] + ' are needed to hold ALL of them?', answer: m.q + 1,
      hint: 'First find how many full ones. Then think about the ones left over: they still need somewhere to go!',
      explain: ex('Do not forget the left over ones', ['Full ' + it[1] + ': ' + countIn(m.d, m.q) + ' → <b>' + m.q + '</b> full, with <b>' + m.r + '</b> left over.', 'The ' + m.r + ' left over still need a home, so we need <b>one more</b>.', m.q + ' + 1 = <b>' + (m.q + 1) + '</b> ' + it[1] + '. ✅']),
      truth: divmod(m.n, m.d).q + (divmod(m.n, m.d).r > 0 ? 1 : 0),
      wrong: function(v){ return v === m.q ? m.q + ' leaves ' + nnoun(m.r, it[0]) + ' with nowhere to go. Do they need another one?' : ''; }
    });
  }
  function qClaim(){
    const m = make(8, true), who = pick(NAMES), kind = randInt(0, 2);
    let q = m.q, r = m.r, why = '';
    if(kind === 1){ q = m.q - 1; r = m.r + m.d; why = 'A remainder of ' + r + ' is bigger than ' + m.d + ', so another group of ' + m.d + ' fits. It should be ' + m.q + ' remainder ' + m.r + '.'; }
    else if(kind === 2){ r = m.r === 1 ? 2 : m.r - 1; why = 'Check the subtraction: ' + m.n + ' − ' + m.d * m.q + ' = ' + m.r + ', not ' + r + '.'; }
    const right = kind === 0, claim = m.n + ' ÷ ' + m.d + ' = ' + q + ' remainder ' + r;
    return mcq2({
      prompt: who + ' says <b>' + claim + '</b>. Is ' + who + ' right?', correct: opt(K.bool(right), right ? 'Yes, that is right' : 'No, that is wrong'), other: opt(K.bool(!right), right ? 'No, that is wrong' : 'Yes, that is right', right ? 'Check: ' + q + ' × ' + m.d + ' = ' + q * m.d + ' and ' + q * m.d + ' + ' + r + ' = ' + m.n + '. It works!' : why),
      hint: 'Check by multiplying: groups × ' + m.d + ', then add the remainder. Do you get back ' + m.n + '? Is the remainder smaller than ' + m.d + '?',
      explain: ex('Checking a division', ['Check: <b>' + q + ' × ' + m.d + ' + ' + r + '</b> = ' + (q * m.d + r) + '.', right ? 'It makes ' + m.n + ' and ' + r + ' is smaller than ' + m.d + ', so it is right.' : why, right ? 'So ' + who + ' is right. ✅' : 'The right answer is ' + m.n + ' ÷ ' + m.d + ' = ' + m.q + ' remainder ' + m.r + '. ✅']),
      truth: K.bool(divmod(m.n, m.d).q === q && divmod(m.n, m.d).r === r)
    });
  }
  function qWhichHasRem(){
    const d = pick([4, 5, 8]), target = randInt(1, d - 1);
    const mk = function(rem){ const q = randInt(2, 9); return { n: d * q + rem, q: q, r: rem }; };
    const good = mk(target); const ds = [], used = {}; used[good.n] = 1;
    shuffle(Array.from({ length: d }, function(_, i){ return i; }).filter(function(x){ return x !== target; })).slice(0, 3).forEach(function(rem){
      let c, tries = 0; do { c = mk(rem); tries++; } while(used[c.n] && tries < 30); used[c.n] = 1;
      ds.push(opt(K.text(c.n + ' ÷ ' + d), c.n + ' ÷ ' + d, c.n + ' ÷ ' + d + ' = ' + lbl(c.q, c.r) + (c.r === 0 ? ' (nothing left over)' : '') + ', not remainder ' + target + '.'));
    });
    const gl = good.n + ' ÷ ' + d;
    return mcq({
      prompt: 'Which division has a remainder of <b>' + target + '</b>?', correct: opt(K.text(gl), gl), distractors: ds, keepOrder: false, count: 4,
      hint: 'Work out each one: count in ' + d + 's and see how many are left over.',
      explain: ex('Checking each one', ['Count in ' + d + 's for each number and see what is left.', good.n + ' − ' + d * good.q + ' = <b>' + target + '</b>.', good.n + ' ÷ ' + d + ' = ' + good.q + ' remainder ' + target + '. ✅']),
      truth: K.text(good.n + ' ÷ ' + d)
    });
  }
  function qNoRemainder(){
    const d = pick([3, 4, 5, 8]), q = randInt(3, 9), m = d * q, ds = [];
    shuffle(Array.from({ length: d - 1 }, function(_, i){ return i + 1; })).slice(0, 3).forEach(function(rem){ const x = m + (chance(0.5) ? rem : rem - d); if(x > 0 && x % d !== 0 && !ds.some(function(o){ return o.key === K.num(x); })) ds.push(opt(K.num(x), String(x), x + ' ÷ ' + d + ' = ' + divmod(x, d).q + ' remainder ' + divmod(x, d).r + ', so something is left over.')); });
    for(let k = 1; ds.length < 3 && k < 30; k++){ const x = m + k; if(x % d !== 0 && !ds.some(function(o){ return o.key === K.num(x); })) ds.push(opt(K.num(x), String(x), x + ' ÷ ' + d + ' = ' + divmod(x, d).q + ' remainder ' + divmod(x, d).r + ', so something is left over.')); }
    return mcq({
      prompt: 'Which of these numbers divides by <b>' + d + '</b> with <b>nothing</b> left over?', correct: opt(K.num(m), String(m)), distractors: ds, keepOrder: false, count: 4,
      hint: 'Which number is in the ' + d + ' times table? Count in ' + d + 's.',
      explain: ex('No remainder', ['Count in ' + d + 's: ' + countIn(d, q) + '.', '<b>' + m + '</b> is in the ' + d + ' times table (' + q + ' × ' + d + ' = ' + m + ').', m + ' ÷ ' + d + ' = ' + q + ' with nothing left over. ✅']),
      truth: K.num(divmod(m, d).r === 0 ? m : -1)
    });
  }

  registerSkill({
    id: 'multdiv-remainders', strand: 'multdiv', name: 'Division with remainders', emoji: '🍪', year: 3, order: 355, prereq: ['multdiv-division-facts'],
    lesson: {
      title: 'When sharing is not exact',
      steps: [
        { say: 'Sometimes things do <b>not</b> share out exactly. 13 sweets go into bags of <b>4</b>. The picture shows <b>3 full bags</b>: that uses 12 sweets, and <b>1 sweet is left over</b>.', vis: { kind: 'groups', args: [3, 4] } },
        { say: 'Count in <b>4s</b> along the line: 4, 8, 12. The next jump is 16, which is <b>too far</b>. So 3 jumps fit into 13. 13 − 12 = <b>1</b> left over.', vis: { kind: 'numberLine', args: [{ min: 0, max: 16, minor: 4, major: 4, width: 336, marks: [{ value: 13, kind: 'dot' }] }] },
          quiz: { prompt: 'How many full groups of 4 fit into 13?', options: [{ label: '4', ok: false }, { label: '3', ok: true }, { label: '1', ok: false }], right: 'Yes! 3 × 4 = 12 fits. 4 × 4 = 16 is too big.', wrong: 'Count in 4s: 4, 8, 12 — then 16 is too big. So 3 full groups.' } },
        { say: 'We write it like this: <b>13 ÷ 4 = 3 remainder 1</b>. The <b>3</b> is the number of full groups. The <b>remainder</b> is what is left over.', vis: { kind: 'groups', args: [3, 4] },
          quiz: { prompt: '17 ÷ 5 = 3 remainder ?', options: [{ label: '2', ok: true }, { label: '3', ok: false }, { label: '12', ok: false }], right: 'Yes! 3 × 5 = 15 and 17 − 15 = 2.', wrong: '3 × 5 = 15. Then 17 − 15 = 2 left over.' } },
        { say: 'The remainder is <b>always smaller</b> than the number you divide by. If you divide by 4 and 4 are left, that is another full group! So the remainder can only be 0, 1, 2 or 3.', vis: { kind: 'groups', args: [2, 4] },
          quiz: { prompt: 'You divide by 3. Which of these can NOT be the remainder?', options: [{ label: '1', ok: false }, { label: '2', ok: false }, { label: '3', ok: true }], right: 'Yes! With 3 left over you could make one more group of 3.', wrong: 'If 3 are left over, they make another group of 3. The remainder must be smaller than 3.' } }
      ]
    },
    trick: {
      title: 'The nearest fact that fits',
      say: 'To divide with a remainder: find the <b>nearest fact in the table that does not go over</b>. Take it away from the number. What is left is the <b>remainder</b>. Check: groups × number + remainder gives you back the start.',
      vis: { kind: 'numberLine', args: [{ min: 0, max: 25, minor: 5, major: 5, width: 348, marks: [{ value: 23, kind: 'dot' }] }] },
      example: '23 ÷ 5 → 5 × 4 = 20 (5 × 5 = 25 is too big) → 23 − 20 = 3 → <b>4 remainder 3</b> &nbsp; (4 × 5 + 3 = 23 ✓)'
    },
    gen: {
      1: function(){ return pick([qFullGroups, qFullGroups, qLeftOver, qLeftOver, qFitsExactly])(); },
      2: function(){ return pick([qChooseAnswer, qChooseAnswer, qRemainderOnly, qWordFull, qNearestFact, qFitsExactly])(); },
      3: function(){ return pick([qTypedRem, qTypedRem, qTypedFull, qBoxesNeeded, qBoxesNeeded, qClaim, qClaim, qWhichHasRem, qNoRemainder])(); }
    }
  });
})();
