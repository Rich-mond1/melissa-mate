/* number-round-1000 — round 3- and 4-digit numbers to the nearest 1000 (Year 4), with number-line support. */
(function(){
  const NAMES = ['Ana', 'Marcus', 'Sophie', 'Ivan', 'Lucy', 'Diego', 'Ellen', 'Tom', 'Aisha', 'Kai', 'Mei', 'Leo'];
  function r1000(n){ return Math.floor((n + 500) / 1000) * 1000; }
  function down(n){ return Math.floor(n / 1000) * 1000; }
  /* independent check by DISTANCE (halfway goes up) */
  function nearest(n){ const lo = down(n), hi = lo + 1000; return (hi - n) <= (n - lo) ? hi : lo; }
  function pickN(){ let n; do { n = randInt(1100, 9899); } while(n % 1000 === 0 || n % 1000 === 500 && chance(0.5)); return n; }
  function lineFor(n){ const lo = down(n); return V.numberLine({ min: lo, max: lo + 1000, minor: 100, major: 500, width: 340, marks: [{ value: n }] }); }
  function readLine(html){ return Math.round(V.decodeNumberLine(html)); }
  function wrongs(n){
    const lo = down(n), hi = lo + 1000, ans = r1000(n), other = ans === lo ? hi : lo, h = Math.floor(n / 100) % 10, w = [];
    if(h === 5) w.push({ v: lo, why: 'Halfway rounds UP. A hundreds digit of 5 or more means go up to ' + hi + '.' });
    w.push({ v: other, why: 'The hundreds digit is ' + h + ', which is ' + (ans === hi ? '5 or more, so we round UP to ' + hi : '4 or less, so we stay DOWN at ' + lo) + '.' });
    w.push({ v: Math.floor((n + 50) / 100) * 100, why: 'That is rounding to the nearest 100. This question asks for the nearest 1000.' });
    w.push({ v: Math.floor((n + 5) / 10) * 10, why: 'That is rounding to the nearest 10. This question asks for the nearest 1000.' });
    w.push({ v: ans + 1000, why: 'Too far. Only ' + lo + ' and ' + hi + ' are next to ' + n + '.' });
    w.push({ v: ans - 1000, why: 'Too far. Only ' + lo + ' and ' + hi + ' are next to ' + n + '.' });
    w.push({ v: n, why: 'Rounding means finding a tidier number. ' + n + ' is not a multiple of 1000.' });
    w.push({ v: ans + 500, why: 'A rounded thousand ends in 000, not 500.' });
    w.push({ v: ans + 100, why: 'A rounded thousand ends in 000.' });
    return w;
  }
  function explain(n){
    const lo = down(n), hi = lo + 1000, ans = r1000(n), h = Math.floor(n / 100) % 10;
    return ex('Rounding to the nearest 1000', ['The two thousands next to ' + n + ' are <b>' + lo + '</b> and <b>' + hi + '</b>.', 'Look at the <b>hundreds</b> digit: it is ' + h + '.', h >= 5 ? '5 or more, so round <b>up</b> to <b>' + hi + '</b>. ✅' : '4 or less, so stay <b>down</b> at <b>' + lo + '</b>. ✅']);
  }
  function qLine(){
    const n = pickN(), vis = lineFor(n), ans = r1000(n), lo = down(n), hi = lo + 1000;
    return mcqNum({
      prompt: 'The arrow shows a number between ' + lo + ' and ' + hi + '. Which thousand is it <b>closest</b> to?', visual: vis, answer: ans,
      wrong: [{ v: ans === lo ? hi : lo, why: 'Look at which end of the line the arrow is nearer to.' }, { v: ans + 500, why: 'Rounding to the nearest 1000 gives a thousand, not a number ending in 500.' }, { v: ans - 1000, why: 'That is too far away.' }, { v: ans + 1000, why: 'That is too far away.' }, { v: ans + 100, why: 'A rounded thousand ends in 000.' }, { v: ans === lo ? lo + 500 : hi - 500, why: 'That is the halfway mark, not a thousand.' }],
      nearby: [1000, -1000, 100, 500], valid: function(v){ return v > 0; }, count: 3, hint: 'Is the arrow in the first half or the second half of the line?',
      explain: ex('Closest thousand', ['The arrow is at about ' + n + '.', 'It is nearer to <b>' + ans + '</b> than to ' + (ans === lo ? hi : lo) + '. ✅']),
      truth: nearest(n), decode: function(){ return nearest(readLine(vis)); }
    });
  }
  function qMcq(){
    const n = pickN();
    return mcqNum({ prompt: 'Round <b>' + n + '</b> to the nearest 1000.', answer: r1000(n), wrong: wrongs(n), nearby: [1000, -1000], valid: function(v){ return v > 0; }, count: 4, hint: 'Look at the hundreds digit. 5 or more goes up.', explain: explain(n), truth: nearest(n) });
  }
  function qBetween(){
    const n = pickN(), lo = down(n);
    return mcqNum({ prompt: n + ' is between which two thousands?', answer: lo,
      wrong: [{ v: lo + 1000, why: 'That is the upper thousand. ' + n + ' is above ' + lo + '.' }, { v: lo - 1000, why: 'Too low. ' + n + ' is above ' + lo + '.' }, { v: lo + 100, why: 'We need thousands. ' + lo + ' and ' + (lo + 1000) + ' are neighbouring thousands.' }],
      nearby: [1000, -1000], valid: function(v){ return v > 0; }, count: 3, hint: 'Look at the thousands digit and the one after it.',
      explain: ex('Neighbouring thousands', [n + ' has ' + Math.floor(n / 1000) + ' thousands.', 'It sits between <b>' + lo + '</b> and <b>' + (lo + 1000) + '</b>. The first of these is the answer. ✅']), truth: Math.floor(n / 1000) * 1000 });
  }
  function qTyped(){
    const n = pickN();
    return numeric({ prompt: 'Type the answer: round <b>' + n + '</b> to the nearest 1000.', answer: r1000(n), hint: 'Look at the hundreds digit. 5 or more goes up.', explain: explain(n), truth: nearest(n),
      wrong: function(v){ return v === down(n) + (r1000(n) === down(n) ? 1000 : -1000) && v > 0 ? 'Check the hundreds digit: ' + Math.floor(n / 100) % 10 + '.' : ''; } });
  }
  function qBoundary(){
    const t = randInt(1, 8) * 1000, up = chance(0.5), n = t + (up ? 500 : 499);
    return numeric({ prompt: 'Round <b>' + n + '</b> to the nearest 1000.', answer: nearest(n),
      hint: 'Halfway between two thousands is ' + (t + 500) + '. Is ' + n + ' at or past halfway?',
      explain: ex('Right at the halfway point', [n + ' has ' + Math.floor(n / 100) % 10 + ' hundreds.', up ? 'Exactly halfway (500) rounds <b>up</b> to <b>' + (t + 1000) + '</b>. ✅' : '499 is just below halfway, so it rounds <b>down</b> to <b>' + t + '</b>. ✅']), truth: nearest(n),
      wrong: function(v){ return v === (up ? t : t + 1000) ? (up ? 'Halfway always rounds UP.' : '499 has not reached halfway.') : ''; } });
  }
  function qWord(){
    const n = pickN(), who = pick(NAMES), things = pick(['visitors came to the museum', 'people watched the match', 'books are in the library', 'steps were taken by the walkers']);
    return numeric({ prompt: n + ' ' + things + '. ' + who + ' says “about how many, to the nearest 1000?” Type the number.', answer: nearest(n), hint: 'Round the number to the nearest 1000.', explain: explain(n), truth: nearest(n) });
  }
  function qMost(){
    const lo = randInt(1, 8) * 1000, below = lo + randInt(1, 499), above = lo + randInt(501, 999), pickLow = chance(0.5);
    const who = pick(NAMES);
    return mcq2({ prompt: who + ' rounded to the nearest 1000 and got <b>' + (pickLow ? lo : lo + 1000) + '</b>. Which number could ' + who + ' have started with?',
      correct: opt(K.num(pickLow ? below : above), String(pickLow ? below : above), (pickLow ? below : above) + ' rounds to ' + (pickLow ? lo : lo + 1000) + '.'),
      other: opt(K.num(pickLow ? above : below), String(pickLow ? above : below), (pickLow ? above : below) + ' rounds to ' + (pickLow ? lo + 1000 : lo) + ', not ' + (pickLow ? lo : lo + 1000) + '.'),
      hint: 'Round each choice and see which gives the answer.',
      explain: ex('Working backwards', ['Round each number to the nearest 1000.', (pickLow ? below : above) + ' → <b>' + nearest(pickLow ? below : above) + '</b>. ✅']), truth: K.num([below, above].filter(function(c){ return nearest(c) === (pickLow ? lo : lo + 1000); })[0]) });
  }
  registerSkill({
    id: 'number-round-1000', strand: 'number', name: 'Round to 1000', emoji: '🎯', year: 4, order: 175, prereq: ['number-round'],
    lesson: { title: 'Rounding to the nearest 1000', steps: [
      { say: 'To round to the nearest <b>1000</b>, find the two thousands on each side. For 3,400 they are <b>3,000</b> and <b>4,000</b>.', vis: { kind: 'numberLine', args: [{ min: 3000, max: 4000, minor: 100, major: 500, width: 340, marks: [{ value: 3400 }] }] } },
      { say: 'Look at the <b>hundreds</b> digit. <b>4 or less → down. 5 or more → up.</b> 3,400 has 4 hundreds, so it goes down to <b>3,000</b>.', vis: { kind: 'numberLine', args: [{ min: 3000, max: 4000, minor: 100, major: 500, width: 340, marks: [{ value: 3400 }] }] },
        quiz: { prompt: 'Round 6,700 to the nearest 1000.', options: [{ label: '7,000', ok: true }, { label: '6,000', ok: false }, { label: '6,700', ok: false }], right: 'Yes! 7 hundreds → round up.', wrong: 'The hundreds digit is 7 (5 or more), so go up to 7,000.' } },
      { say: 'Exactly halfway rounds <b>up</b>. 4,500 → <b>5,000</b>. But 4,499 is below halfway, so it goes down to 4,000.', vis: { kind: 'numberLine', args: [{ min: 4000, max: 5000, minor: 100, major: 500, width: 340, marks: [{ value: 4500 }] }] },
        quiz: { prompt: 'Round 8,499 to the nearest 1000.', options: [{ label: '8,000', ok: true }, { label: '9,000', ok: false }, { label: '8,500', ok: false }], right: 'Yes! 4 hundreds → down.', wrong: 'The hundreds digit is 4, so go down to 8,000.' } }
    ] },
    trick: { title: 'Peek at the hundreds', say: 'To round to the nearest 1000, only the <b>hundreds</b> digit matters. <b>5 or more: up. 4 or less: down.</b>', vis: { kind: 'numberLine', args: [{ min: 2000, max: 3000, minor: 100, major: 500, width: 340, marks: [{ value: 2600 }] }] }, example: '2,600 → hundreds digit 6 → up → <b>3,000</b>' },
    gen: {
      1: function(){ return pick([qLine, qLine, qBetween, qMcq])(); },
      2: function(){ return pick([qMcq, qMcq, qLine, qBetween, qMost])(); },
      3: function(){ return pick([qTyped, qTyped, qBoundary, qWord, qMost])(); }
    }
  });
})();
