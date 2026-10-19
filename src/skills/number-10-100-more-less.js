/* number-10-100-more-less — find 10 or 100 more / less than a 3-digit number, including crossing hundreds. */
(function(){
  const nk = K.num;
  const NAMES = ['Ana', 'Marcus', 'Sophie', 'Ivan', 'Lucy', 'Diego', 'Ellen', 'Tom', 'Aisha', 'Kai', 'Mei', 'Leo'];
  /* independent truth: step up/down one jump at a time */
  function walk(n, step, more){
    let x = n;
    const reps = step === 10 ? 1 : 10;      // 100 = ten jumps of 10
    for(let i = 0; i < reps; i++) x = more ? x + 10 : x - 10;
    return x;
  }
  function word(more){ return more ? 'more' : 'less'; }

  /* misconception list for N, step (10|100), direction */
  function wrongsFor(n, step, more){
    const w = [], s = more ? 1 : -1, h = Math.floor(n / 100), t = Math.floor(n / 10) % 10, o = n % 10;
    if(step === 10){
      w.push({ v: n + s, why: 'You changed the ONES digit. For 10 ' + word(more) + ', change the TENS digit.' });
      w.push({ v: n + 100 * s, why: 'You changed the HUNDREDS digit. For 10 ' + word(more) + ', change the TENS digit.' });
      w.push({ v: n - 10 * s, why: 'That is 10 ' + (more ? 'LESS' : 'MORE') + ', the wrong way round.' });
      if(more && t === 9){ w.push({ v: h * 100 + o, why: 'The 9 tens turned into 0 tens, but you forgot to add 1 to the hundreds (10 tens = 1 hundred).' }); w.push({ v: Number('' + h + '10' + o), why: 'You cannot write 10 in the tens column. 10 tens make a new hundred.' }); }
      if(!more && t === 0){ w.push({ v: h * 100 + 90 + o, why: 'You changed the tens to 9, but you forgot to take 1 away from the hundreds.' }); w.push({ v: n - 100, why: 'You took away a whole hundred. Only 10 less is needed: 305 is 3 hundreds and 0 tens.' }); }
    } else {
      w.push({ v: n + 10 * s, why: 'You changed the TENS digit. For 100 ' + word(more) + ', change the HUNDREDS digit.' });
      w.push({ v: n + s, why: 'You changed the ONES digit. For 100 ' + word(more) + ', change the HUNDREDS digit.' });
      w.push({ v: n - 100 * s, why: 'That is 100 ' + (more ? 'LESS' : 'MORE') + ', the wrong way round.' });
      if(more && h === 9) w.push({ v: o + 10 * t, why: 'You dropped the hundreds. 9 hundreds + 1 hundred = 10 hundreds = 1 thousand.' });
    }
    return w;
  }
  function stepExplain(n, step, more, ans){
    const h = Math.floor(n / 100), t = Math.floor(n / 10) % 10;
    const steps = [];
    if(step === 10){
      steps.push('10 ' + word(more) + ' means the <b>tens</b> digit goes ' + (more ? 'up' : 'down') + ' by 1. The ones and hundreds stay the same unless we cross a boundary.');
      if(more && t === 9) steps.push('Here the tens digit is 9. 9 + 1 = 10 tens, and 10 tens make 1 hundred. So the hundreds go up by one and the tens become 0.');
      else if(!more && t === 0) steps.push('Here the tens digit is 0, so we cannot take 1 away. Break 1 hundred into 10 tens: the hundreds go down by one and we have 9 tens.');
      else steps.push('The tens digit is ' + t + ', so it becomes ' + (more ? t + 1 : t - 1) + '.');
    } else {
      steps.push('100 ' + word(more) + ' means the <b>hundreds</b> digit goes ' + (more ? 'up' : 'down') + ' by 1. The tens and ones stay the same.');
      if(more && h === 9) steps.push('Here the hundreds digit is 9. 9 hundreds + 1 hundred = 10 hundreds = 1 thousand.');
      else steps.push('The hundreds digit is ' + h + ', so it becomes ' + (more ? h + 1 : h - 1) + (ans < 100 ? ', and only the tens and ones are left.' : '.'));
    }
    steps.push(step + ' ' + word(more) + ' than ' + n + ' is <b>' + ans + '</b>. ✅');
    return steps;
  }

  function pickNumber(step, more, crossing){
    // returns N (100..999)
    if(step === 10){
      if(crossing){
        if(more){ return randInt(1, 9) * 100 + 90 + randInt(0, 9); }
        return randInt(2, 9) * 100 + randInt(0, 9);               // tens digit 0, e.g. 305
      }
      const h = randInt(1, 9), o = randInt(0, 9), t = more ? randInt(0, 8) : randInt(1, 9);
      return h * 100 + t * 10 + o;
    }
    if(crossing){
      return more ? randInt(900, 999) : randInt(110, 199);
    }
    return more ? randInt(100, 899) : randInt(200, 999);
  }

  function mcqMoreLess(step, more, crossing, count, withBlocks, story){
    let n = pickNumber(step, more, crossing);
    if(withBlocks && n >= 600) n -= 400;
    const ans = more ? n + step : n - step;
    let prompt = 'What is <b>' + step + ' ' + word(more) + '</b> than <b>' + n + '</b>?', vis = '';
    if(withBlocks && n < 1000 && Math.floor(n / 10) % 10 <= 9){
      vis = V.baseTen(Math.floor(n / 100), Math.floor(n / 10) % 10, n % 10);
      prompt = 'The blocks show a number. What is <b>' + step + ' ' + word(more) + '</b> than that number?';
    } else if(story){
      const nm = pick(NAMES);
      const items = pick(['stickers', 'marbles', 'beads', 'stars']);
      prompt = more ? nm + ' has <b>' + n + '</b> ' + items + ' and finds ' + step + ' more. How many ' + items + ' now?' : nm + ' has <b>' + n + '</b> ' + items + ' and gives away ' + step + '. How many ' + items + ' are left?';
    }
    return mcqNum({
      prompt: prompt, visual: vis, answer: ans, wrong: wrongsFor(n, step, more), count: count, nearby: [10, -10, 100, -100, 1, -1],
      hint: step === 10 ? 'Which digit is in the TENS place? That is the one that changes by 1. Watch out for 9 tens or 0 tens.' : 'Which digit is in the HUNDREDS place? That is the one that changes by 1. Watch out for 9 hundreds.',
      explain: ex(step + ' ' + word(more) + ' than ' + n, stepExplain(n, step, more, ans)),
      truth: walk(n, step, more), decode: vis ? function(){ const d = V.decodeBaseTen(vis); return more ? d + step : d - step; } : undefined
    });
  }

  registerSkill({
    id: 'number-10-100-more-less', strand: 'number', name: '10 or 100 more or less', emoji: '➕', year: 3, order: 130, prereq: ['number-place-value'],
    lesson: {
      title: 'Jumping by 10 and 100',
      steps: [
        { say: 'This is <b>234</b>: 2 hundreds, 3 tens, 4 ones. To get <b>10 more</b>, add <b>one purple stick</b>. Only the <b>tens</b> change.', vis: { kind: 'baseTen', args: [2, 3, 4] } },
        { say: 'Now there are 4 sticks: <b>244</b>. The 2 and the 4 stayed put. <b>10 less</b> works the same way, take one stick away.', vis: { kind: 'baseTen', args: [2, 4, 4] },
          quiz: { prompt: 'What is 10 more than 352?', options: [{ label: '353', ok: false }, { label: '362', ok: true }, { label: '452', ok: false }], right: 'Yes! The tens digit goes from 5 to 6.', wrong: 'For 10 more only the TENS digit changes: 5 tens becomes 6 tens, so 362.' } },
        { say: '<b>100 more</b> means one more <b>blue square</b>. Only the <b>hundreds</b> digit changes. <b>435</b> is 4 hundreds, so 100 more is 5 hundreds: <b>535</b>.', vis: { kind: 'baseTen', args: [5, 3, 5] },
          quiz: { prompt: 'What is 100 less than 718?', options: [{ label: '708', ok: false }, { label: '618', ok: true }, { label: '717', ok: false }], right: 'Yes! 7 hundreds becomes 6 hundreds.', wrong: '100 less changes the HUNDREDS digit: 7 becomes 6, so 618.' } },
        { say: 'Careful at the edges! <b>10 less than 300</b>: no tens to take away, so break a hundred into 10 tens. 2 hundreds and 9 tens = <b>290</b>. See the jump back on the line.', vis: { kind: 'numberLine', args: [{ min: 250, max: 350, minor: 10, major: 50, marks: [{ value: 290, kind: 'q' }] }] },
          quiz: { prompt: 'What is 10 less than 305?', options: [{ label: '295', ok: true }, { label: '205', ok: false }, { label: '315', ok: false }], right: 'Yes! 305 is 30 tens and 5. Take one ten and you get 295.', wrong: 'Break 1 hundred into 10 tens: 2 hundreds and 10 tens and 5. Take one ten: 295.' } },
        { say: 'Going up can cross a boundary too. <b>100 more than 950</b>: 9 hundreds + 1 hundred = 10 hundreds = <b>1050</b>. And <b>10 more than 395</b> is <b>405</b>.', vis: { kind: 'numberLine', args: [{ min: 900, max: 1100, minor: 50, major: 100, marks: [{ value: 1050, kind: 'q' }] }] },
          quiz: { prompt: 'What is 10 more than 395?', options: [{ label: '3105', ok: false }, { label: '305', ok: false }, { label: '405', ok: true }], right: 'Yes! 9 tens + 1 ten = 10 tens = 1 new hundred, so 405.', wrong: '9 tens + 1 ten makes 10 tens, which is one more hundred: 405.' } }
      ]
    },
    trick: {
      title: 'Spot the column',
      say: 'Ask: <b>“Which column moves?”</b> For <b>10</b> it is the <b>tens</b> column. For <b>100</b> it is the <b>hundreds</b> column. Only that digit changes by 1. If a 9 goes up it becomes 0 and passes 1 along. If a 0 goes down it becomes 9 and borrows 1.',
      vis: { kind: 'baseTen', args: [3, 0, 5] },
      example: '<b>10 less than 305</b>: tens column moves down. 0 tens cannot go down, so borrow: 2 hundreds, 9 tens, 5 ones = <b>295</b>.'
    },
    gen: {
      1: function(){
        const step = pick([10, 10, 100]), more = chance(0.5);
        return mcqMoreLess(step, more, false, 3, chance(0.5), false);
      },
      2: function(){
        const f = randInt(0, 4);
        const step = pick([10, 100]), more = chance(0.5);
        if(f <= 1) return mcqMoreLess(step, more, true, 4, false, false);
        if(f === 2) return mcqMoreLess(step, more, chance(0.4), 4, false, true);
        if(f === 3) return mcqMoreLess(step, more, false, 4, true, false);
        // fill the missing number in a sequence of tens or hundreds (counts across a boundary)
        const jump = pick([10, 100]), up = chance(0.5);
        const first = jump === 10 ? (up ? randInt(1, 9) * 100 + 70 + randInt(0, 9) : randInt(2, 9) * 100 + 20 + randInt(0, 9)) : (up ? randInt(1, 6) * 100 + randInt(0, 99) : randInt(5, 9) * 100 + randInt(0, 99));
        const seq = []; for(let i = 0; i < 5; i++) seq.push(up ? first + i * jump : first - i * jump);
        const gap = randInt(1, 3), ans = seq[gap];
        const shown = seq.map(function(v, i){ return i === gap ? '<b>?</b>' : String(v); }).join(', ');
        const w = [{ v: ans + (up ? 1 : -1) * (jump === 10 ? 100 : 10), why: 'You changed the wrong digit. We are counting in ' + jump + 's, so change the ' + (jump === 10 ? 'TENS' : 'HUNDREDS') + ' digit.' }, { v: ans + (up ? 1 : -1), why: 'You changed the ONES digit. We count in ' + jump + 's.' }, { v: ans + (up ? -1 : 1) * jump, why: 'You went the wrong way. Look at the other numbers: is the list going up or down?' }];
        return mcqNum({
          prompt: 'What number is missing?<br><b>' + shown + '</b>', answer: ans, wrong: w, nearby: [10, -10, 100, -100, 1],
          hint: 'Find the jump between two neighbours. Is it ' + (jump === 10 ? '10' : '100') + ' each time? Which way is the list going?',
          explain: ex('Counting in ' + jump + 's', ['Look at neighbours: ' + seq[0] + ' then ' + seq[1] + ' is a jump of ' + jump + (up ? ' up' : ' down') + '.', 'The number after ' + seq[gap - 1] + ' is ' + (up ? seq[gap - 1] + ' + ' : seq[gap - 1] + ' − ') + jump + ' = <b>' + ans + '</b>.', 'Check: ' + ans + (up ? ' + ' : ' − ') + jump + ' = ' + seq[gap + 1] + '. ✅']),
          truth: (seq[gap - 1] + seq[gap + 1]) / 2
        });
      },
      3: function(){
        const f = randInt(0, 4);
        if(f === 0 || f === 1){ // typed 10/100 more or less across a boundary
          const step = pick([10, 100]), more = chance(0.5);
          let n = pickNumber(step, more, true);
          if(chance(0.25)) n = step === 10 ? (more ? randInt(1, 9) * 100 + 90 + randInt(5, 9) : randInt(2, 9) * 100 + randInt(0, 4)) : n;
          const ans = more ? n + step : n - step;
          return numeric({
            prompt: 'Type the number that is <b>' + step + ' ' + word(more) + '</b> than <b>' + n + '</b>.', answer: ans,
            hint: 'Find the ' + (step === 10 ? 'tens' : 'hundreds') + ' digit. It goes ' + (more ? 'up' : 'down') + ' by 1. Careful if it is a ' + (more ? '9' : '0') + '!',
            explain: ex(step + ' ' + word(more) + ' than ' + n, stepExplain(n, step, more, ans)), truth: walk(n, step, more),
            wrong: function(v){ const t = n + (more ? 1 : -1) * (step === 10 ? 100 : 10); const o = n + (more ? 1 : -1); if(v === t) return 'You changed the ' + (step === 10 ? 'HUNDREDS' : 'TENS') + ' digit. For ' + step + ', change the ' + (step === 10 ? 'TENS' : 'HUNDREDS') + ' digit.'; if(v === o) return 'You changed the ONES digit.'; return ''; }
          });
        }
        if(f === 2){ // inverse: what was the number?
          const step = pick([10, 100]), more = chance(0.5);
          const start = step === 10 ? (more ? randInt(1, 9) * 100 + randInt(0, 9) : randInt(2, 9) * 100 + 90 + randInt(0, 9)) : randInt(110, 990);
          const orig = start, result = more ? orig + step : orig - step;
          const nm = pick(NAMES);
          const hasZeroEdge = step === 10 && (more ? Math.floor(result / 10) % 10 === 0 : Math.floor(result / 10) % 10 === 9);
          return numeric({
            prompt: nm + ' ' + (more ? 'added' : 'took away') + ' <b>' + step + '</b> ' + (more ? 'to' : 'from') + ' a number and got <b>' + result + '</b>. What was ' + nm + '’s number?', answer: orig,
            hint: 'Work backwards. Do the OPPOSITE: if ' + nm + ' ' + (more ? 'added, you take away' : 'took away, you add') + ' ' + step + '.',
            explain: ex('Working backwards', [nm + ' ' + (more ? 'added' : 'took away') + ' ' + step + ' and got ' + result + '.', 'To undo it, ' + (more ? 'take away ' : 'add ') + step + ' ' + (more ? 'from ' : 'to ') + result + '.', result + (more ? ' − ' : ' + ') + step + ' = <b>' + orig + '</b>. ✅']),
            truth: walk(result, step, !more),
            wrong: function(v){ return v === result + (more ? 1 : -1) * step ? 'That goes the same way again. You need the OPPOSITE: ' + (more ? 'take away.' : 'add.') : ''; }
          });
        }
        if(f === 3){ // who is right?
          const step = pick([10, 100]), more = chance(0.5), crossing = true;
          const n = pickNumber(step, more, crossing), right = more ? n + step : n - step;
          const w = wrongsFor(n, step, more).filter(function(x){ return x.v !== right && x.v > 0; });
          const picked = []; const seen = {};
          w.forEach(function(x){ if(!seen[x.v] && picked.length < 2){ seen[x.v] = 1; picked.push(x); } });
          const names = sample(NAMES, 3);
          const claims = [{ nm: names[0], v: right, ok: true }, { nm: names[1], v: picked[0].v, why: picked[0].why }, { nm: names[2], v: picked[1].v, why: picked[1].why }];
          const shownClaims = shuffle(claims);
          const text = shownClaims.map(function(c){ return c.nm + ' says ' + c.v + '.'; }).join(' ');
          const ds = claims.filter(function(c){ return !c.ok; }).map(function(c){ return opt(K.text(c.nm), c.nm, c.nm + ' said ' + c.v + '. ' + c.why); });
          // truth: the name whose claim equals the walked answer
          const walked = walk(n, step, more);
          const truthName = claims.filter(function(c){ return c.v === walked; })[0].nm;
          return mcq({
            prompt: 'What is <b>' + step + ' ' + word(more) + '</b> than <b>' + n + '</b>? ' + text + ' Who is right?', correct: opt(K.text(claims[0].nm), claims[0].nm), distractors: ds, count: 3, keepOrder: true,
            hint: 'Work it out yourself first: which digit moves? Then check each answer.',
            explain: ex('Checking the answers', stepExplain(n, step, more, right).concat([claims[0].nm + ' is right, the others changed the wrong digit or went the wrong way.'])), truth: K.text(truthName)
          });
        }
        // typed: missing number in a count of 10s / 100s crossing a boundary
        const jump = pick([10, 100]), up = chance(0.5);
        const first = jump === 10 ? (up ? randInt(1, 9) * 100 + 60 + randInt(0, 9) : randInt(2, 9) * 100 + 30 + randInt(0, 9)) : (up ? randInt(1, 6) * 100 + randInt(0, 99) : randInt(6, 9) * 100 + randInt(0, 99));
        const seq = []; for(let i = 0; i < 6; i++) seq.push(up ? first + i * jump : first - i * jump);
        const gap = randInt(2, 4);
        const shown = seq.map(function(v, i){ return i === gap ? '<b>?</b>' : String(v); }).join(', ');
        const ans = seq[gap];
        return numeric({
          prompt: 'What number is missing?<br><b>' + shown + '</b>', answer: ans,
          hint: 'Find the jump between two neighbours (10 or 100?). Is the list going up or down?',
          explain: ex('Counting in ' + jump + 's', ['The jump is ' + jump + (up ? ' up' : ' down') + ' each time.', seq[gap - 1] + (up ? ' + ' : ' − ') + jump + ' = <b>' + ans + '</b>.', 'Check: ' + ans + (up ? ' + ' : ' − ') + jump + ' = ' + seq[gap + 1] + '. ✅']),
          truth: (seq[gap - 1] + seq[gap + 1]) / 2
        });
      }
    }
  });
})();
