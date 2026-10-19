/* number-round — round to the nearest 10 and 100 (Year 4 bridge), with number-line support. */
(function(){
  const nk = K.num;
  const NAMES = ['Ana', 'Marcus', 'Sophie', 'Ivan', 'Lucy', 'Diego', 'Ellen', 'Tom', 'Aisha', 'Kai', 'Mei', 'Leo'];

  /* the rule applied by digits (used to BUILD answers) */
  function r10(n){ return Math.floor((n + 5) / 10) * 10; }
  function r100(n){ return Math.floor((n + 50) / 100) * 100; }
  function rnd(n, to){ return to === 10 ? r10(n) : r100(n); }
  /* independent check by DISTANCE (halfway goes up) */
  function nearest(n, to){
    const lo = Math.floor(n / to) * to, hi = lo + to;
    return (hi - n) <= (n - lo) ? hi : lo;
  }
  function down(n, to){ return Math.floor(n / to) * to; }
  function pl(to){ return to === 10 ? 'ten' : 'hundred'; }

  function lineFor(n, to){
    const lo = down(n, to);
    if(to === 10) return V.numberLine({ min: lo, max: lo + 10, minor: 1, major: 5, width: 340, marks: [{ value: n }] });
    return V.numberLine({ min: lo, max: lo + 100, minor: 10, major: 50, width: 340, marks: [{ value: n }] });
  }
  function readLine(html){ return Math.round(V.decodeNumberLine(html)); }

  function roundWrongs(n, to){
    const lo = down(n, to), hi = lo + to, ans = rnd(n, to), other = ans === lo ? hi : lo, w = [];
    const dg = to === 10 ? n % 10 : Math.floor(n / 10) % 10;
    const where = to === 10 ? 'ones' : 'tens';
    if(ans === hi && dg === 5) w.push({ v: lo, why: 'Halfway rounds UP. A ' + where + ' digit of 5 or more means go up to ' + hi + '.' });
    w.push({ v: other, why: ans === hi ? 'The ' + where + ' digit is ' + dg + ', which is 5 or more, so we round UP to ' + hi + '.' : 'The ' + where + ' digit is ' + dg + ', which is 4 or less, so we stay DOWN at ' + lo + '.' });
    if(to === 10 && n >= 100) w.push({ v: r100(n), why: 'That is rounding to the nearest 100. This question asks for the nearest 10.' });
    if(to === 100){ w.push({ v: r10(n), why: 'That is rounding to the nearest 10. This question asks for the nearest 100.' }); if(n % 10 >= 5 && dg < 5) w.push({ v: hi, why: 'You looked at the ONES digit. To round to the nearest 100, look at the TENS digit.' }); }
    w.push({ v: ans + to, why: 'That is too far away. Only the two ' + (to === 10 ? 'tens' : 'hundreds') + ' next to ' + n + ' are possible: ' + lo + ' and ' + hi + '.' });
    w.push({ v: ans - to, why: 'That is too far away. Only the two ' + (to === 10 ? 'tens' : 'hundreds') + ' next to ' + n + ' are possible: ' + lo + ' and ' + hi + '.' });
    w.push({ v: n, why: 'Rounding means finding a tidier number. ' + n + ' is not a multiple of ' + to + '.' });
    return w;
  }
  function roundExplain(n, to){
    const lo = down(n, to), hi = lo + to, ans = rnd(n, to);
    const dg = to === 10 ? n % 10 : Math.floor(n / 10) % 10, where = to === 10 ? 'ones' : 'tens';
    const st = ['Rounding to the nearest ' + to + ' means choosing between <b>' + lo + '</b> and <b>' + hi + '</b>.', 'Look at the ' + where + ' digit: it is <b>' + dg + '</b>.'];
    if(dg >= 5) st.push(dg === 5 ? '5 is halfway, and halfway rounds UP. So ' + n + ' rounds up to <b>' + ans + '</b>. ✅' : dg + ' is 5 or more, so go UP. ' + n + ' rounds to <b>' + ans + '</b>. ✅');
    else st.push(dg + ' is 4 or less, so stay DOWN. ' + n + ' rounds to <b>' + ans + '</b>. ✅');
    return st;
  }
  function randNum(to, o){
    o = o || {};
    // two-digit or three-digit, ones digit (for 10s) / tens digit (for 100s) chosen to avoid or include halfway
    let n;
    if(to === 10){
      const hi = o.big ? randInt(10, 99) : randInt(1, 9), ones = o.noHalf ? pick([1, 2, 3, 4, 6, 7, 8, 9]) : randInt(0, 9);
      n = (o.big ? hi : randInt(1, 9)) * 10 + ones;
      if(o.big && chance(0.7)) n = randInt(1, 99) * 10 + ones;   // up to 3 digits
    } else {
      const h = randInt(1, 9), t = o.noHalf ? pick([0, 1, 2, 3, 4, 6, 7, 8, 9]) : randInt(0, 9), ones = randInt(0, 9);
      n = h * 100 + t * 10 + ones;
    }
    if(n < 11) n += 10;
    if(n > 994) n -= 100;
    return n;
  }

  /* Q formats */
  function qRoundLine(to, count, noHalf){
    const n = (function(){ let x; do { x = to === 10 ? randInt(11, 98) : randInt(110, 990); } while((to === 10 ? x % 10 : x % 100) === 0 || (noHalf && (to === 10 ? x % 10 === 5 : x % 100 === 50))); return x; })();
    const vis = lineFor(n, to), lo = down(n, to), ans = rnd(n, to);
    return mcqNum({
      prompt: 'Round <b>' + n + '</b> to the nearest <b>' + to + '</b>. Use the number line.', visual: vis, answer: ans, wrong: roundWrongs(n, to), count: count, nearby: [to, -to, 2 * to, -2 * to],
      hint: 'On the line, which end is the dot closer to? The left end is ' + lo + ' and the right end is ' + (lo + to) + '. Halfway rounds up.',
      explain: ex('Rounding ' + n, roundExplain(n, to).concat(['On the number line the dot is ' + (ans === lo ? 'closer to the left end.' : 'closer to the right end (or exactly halfway, which rounds up).')])),
      truth: nearest(n, to), decode: function(){ const d = readLine(vis); return nearest(d, to); }
    });
  }
  function qCloser(){
    const n = randInt(11, 98); if(n % 10 === 5) return qCloser();
    const lo = down(n, 10), hi = lo + 10, vis = lineFor(n, 10), near = nearest(n, 10), far = near === lo ? hi : lo;
    return mcq2({
      prompt: 'Is <b>' + n + '</b> closer to <b>' + lo + '</b> or to <b>' + hi + '</b>?', visual: vis, correct: opt(nk(near), String(near)), other: opt(nk(far), String(far), 'Look at the dot: it is ' + (Math.abs(n - far)) + ' steps from ' + far + ' but only ' + Math.abs(n - near) + ' from ' + near + '.'),
      hint: 'Count the little steps from the dot to each end. The smaller number of steps wins.',
      explain: ex('Closer to which ten?', [n + ' is ' + Math.abs(n - near) + ' away from ' + near + '.', n + ' is ' + Math.abs(n - far) + ' away from ' + far + '.', 'Fewer steps to <b>' + near + '</b>, so it is closer to ' + near + '. ✅']),
      truth: nk(n - lo < hi - n ? lo : hi), decode: function(){ const d = readLine(vis); return nk(nearest(d, 10)); }
    });
  }
  function qRoundPlain(to, count, big){
    const n = randNum(to, { big: big });
    const ans = rnd(n, to);
    return mcqNum({
      prompt: 'Round <b>' + n + '</b> to the nearest <b>' + to + '</b>.', answer: ans, wrong: roundWrongs(n, to), count: count, nearby: [to, -to, 2 * to],
      hint: 'Find the ' + (to === 10 ? 'ones' : 'tens') + ' digit. 5 or more, raise the score. 4 or less, let it rest.',
      explain: ex('Rounding ' + n, roundExplain(n, to)), truth: nearest(n, to)
    });
  }
  function qWhichRounds(to){
    const target = to === 10 ? randInt(2, 98) * 10 : randInt(2, 9) * 100;
    const half = to / 2;
    const inside = target + randInt(-half, half - 1);
    const outs = [target - half - 1, target + half, target - half - 2, target + half + 3, target - to + 2, target + to - 2, target - half - 5].filter(function(v){ return v > 0 && v !== inside && nearest(v, to) !== target; });
    const whyFor = function(v){ return v + ' rounds to ' + nearest(v, to) + (v === target + half ? ' because halfway rounds UP, so it goes up away from ' + target : '') + ', not ' + target + '.'; };
    const ds = outs.map(function(v){ return opt(nk(v), String(v), whyFor(v)); });
    return mcq({
      prompt: 'Which of these numbers rounds to <b>' + target + '</b> when rounded to the nearest <b>' + to + '</b>?', correct: opt(nk(inside), String(inside)), distractors: ds, keepOrder: false, count: 4,
      hint: 'Numbers that round to ' + target + ' are not too far from it. Test each choice with the 5-or-more rule.',
      explain: ex('Which number rounds to ' + target + '?', [inside + ' is within ' + half + ' of ' + target + ': it rounds to <b>' + target + '</b>.', 'The other numbers round to something else.', 'The answer is <b>' + inside + '</b>. ✅']),
      truth: nk([inside].concat(outs).filter(function(v){ return nearest(v, to) === target; })[0])
    });
  }
  /* typed */
  function numRound(){
    const to = pick([10, 100]);
    let n = randNum(to, { big: true });
    if(chance(0.25)) n = to === 10 ? randInt(95, 99) * 10 + randInt(5, 9) : randInt(95, 99) * 10 + randInt(0, 9);   // 950-999 -> 1000
    if(n > 999) n = 999;
    const ans = rnd(n, to);
    return numeric({
      prompt: 'Round <b>' + n + '</b> to the nearest <b>' + to + '</b>. Type the answer.', answer: ans,
      hint: 'Look at the ' + (to === 10 ? 'ones' : 'tens') + ' digit. 5 or more, raise the score. 4 or less, let it rest.' + (n >= 950 ? ' Careful with the 9s!' : ''),
      explain: ex('Rounding ' + n, roundExplain(n, to).concat(ans === 1000 ? ['9 hundreds go up by one hundred: that makes 1000.'] : [])), truth: nearest(n, to),
      wrong: function(v){ return v === down(n, to) && ans !== v ? 'You rounded DOWN, but the ' + (to === 10 ? 'ones' : 'tens') + ' digit is 5 or more, so go UP.' : (v === rnd(n, to === 10 ? 100 : 10) ? 'That rounds to the wrong place. Read the question: nearest ' + to + '.' : ''); }
    });
  }
  function numSmallestGreatest(){
    const to = pick([10, 100]), smallest = chance(0.5), target = to === 10 ? randInt(2, 90) * 10 : randInt(2, 9) * 100;
    const half = to / 2;
    // search for the answer by testing every whole number near the target
    let found = null;
    if(smallest){ for(let v = target - to; v <= target + to; v++) if(nearest(v, to) === target){ found = v; break; } }
    else { for(let v = target + to; v >= target - to; v--) if(nearest(v, to) === target){ found = v; break; } }
    const formula = smallest ? target - half : target + half - 1;
    return numeric({
      prompt: 'What is the <b>' + (smallest ? 'smallest' : 'greatest') + '</b> whole number that rounds to <b>' + target + '</b> when rounded to the nearest <b>' + to + '</b>?', answer: formula,
      hint: smallest ? 'Halfway rounds UP. So how far below ' + target + ' can you go before the number rounds down to the next ' + pl(to) + ' below?' : 'Just before the halfway point, numbers still round DOWN to ' + target + '. What is the last whole number before that?',
      explain: ex('The ' + (smallest ? 'smallest' : 'greatest') + ' number', smallest ? ['Halfway between ' + (target - to) + ' and ' + target + ' is ' + (target - half) + '.', 'Halfway rounds UP, so <b>' + (target - half) + '</b> already rounds to ' + target + '.', 'One less would round down. The smallest is <b>' + (target - half) + '</b>. ✅'] : ['Halfway between ' + target + ' and ' + (target + to) + ' is ' + (target + half) + '.', 'Halfway rounds UP, so ' + (target + half) + ' goes to ' + (target + to) + '.', 'One less, <b>' + (target + half - 1) + '</b>, still rounds down to ' + target + '. The greatest is <b>' + (target + half - 1) + '</b>. ✅']),
      truth: found,
      wrong: function(v){ return smallest ? (v === target - half + 1 || v === target - half - 1 ? 'Close, but check the halfway number ' + (target - half) + ': does it round up to ' + target + '?' : '') : (v === target + half ? target + half + ' is exactly halfway, so it rounds UP to ' + (target + to) + '.' : ''); }
    });
  }
  function qWhoIsRight(){
    const to = pick([10, 100]);
    let n; do { n = to === 10 ? randInt(11, 98) * 10 + 5 : randInt(1, 9) * 100 + 50 + pick([0, 0, randInt(0, 9)]); } while(n % to === 0);
    if(n % 10 !== 5 && to === 10) n = Math.floor(n / 10) * 10 + 5;
    const ans = rnd(n, to), lo = down(n, to), hi = lo + to;
    const names = sample(NAMES, 3);
    const claims = [{ nm: names[0], v: ans, why: '' }, { nm: names[1], v: ans === hi ? lo : hi, why: ans === hi ? 'Halfway rounds UP, not down.' : 'That is the wrong way.' }, { nm: names[2], v: rnd(n, to === 10 ? 100 : 10), why: 'That is the wrong place. We round to the nearest ' + to + '.' }];
    const text = shuffle(claims).map(function(c){ return c.nm + ' says ' + c.v + '.'; }).join(' ');
    const ds = claims.slice(1).map(function(c){ return opt(K.text(c.nm), c.nm, c.nm + ' said ' + c.v + '. ' + c.why); });
    const truthName = claims.filter(function(c){ return c.v === nearest(n, to); })[0].nm;
    return mcq({
      prompt: 'Round <b>' + n + '</b> to the nearest <b>' + to + '</b>. ' + text + ' Who is right?', correct: opt(K.text(claims[0].nm), claims[0].nm), distractors: ds, keepOrder: true, count: 3,
      hint: 'Look at the ' + (to === 10 ? 'ones' : 'tens') + ' digit. Is it 5 or more?',
      explain: ex('Checking the answers', roundExplain(n, to).slice(0, 2).concat([claims[0].nm + ' is right: ' + n + ' rounds to <b>' + ans + '</b>. ✅'])), truth: K.text(truthName)
    });
  }

  registerSkill({
    id: 'number-round', strand: 'number', name: 'Rounding to 10 and 100', emoji: '🎯', year: 4, order: 160, prereq: ['number-place-value'],
    lesson: {
      title: 'Rounding to the nearest 10',
      steps: [
        { say: '<b>Rounding</b> swaps a number for a tidier one that is <b>nearest</b>. Here <b>43</b> is between 40 and 50. It is closer to <b>40</b>, so 43 rounds to <b>40</b>.', vis: { kind: 'numberLine', args: [{ min: 40, max: 50, minor: 1, major: 5, width: 340, marks: [{ value: 43 }] }] } },
        { say: 'What about <b>45</b>? It is exactly <b>halfway</b>. In maths we always round <b>halfway up</b>. So 45 rounds to <b>50</b>.', vis: { kind: 'numberLine', args: [{ min: 40, max: 50, minor: 1, major: 5, width: 340, marks: [{ value: 45 }] }] } },
        { say: 'You don’t need a line! Look at the <b>ones</b> digit. <b>5 or more: go up. 4 or less: stay down.</b> In 67 the ones digit is 7, so it goes up to <b>70</b>.', vis: { kind: 'numberLine', args: [{ min: 60, max: 70, minor: 1, major: 5, width: 340, marks: [{ value: 67 }] }] },
          quiz: { prompt: 'Round 82 to the nearest 10.', options: [{ label: '80', ok: true }, { label: '90', ok: false }, { label: '82', ok: false }], right: 'Yes! The ones digit is 2, which is 4 or less, so stay down at 80.', wrong: 'The ones digit is 2, which is 4 or less. Stay down: 80.' } },
        { say: 'To round to the nearest <b>100</b>, look at the <b>tens</b> digit. <b>370</b> has 7 tens, so it goes up to <b>400</b>. The line shows 370 is nearer 400 than 300.', vis: { kind: 'numberLine', args: [{ min: 300, max: 400, minor: 10, major: 50, width: 340, marks: [{ value: 370 }] }] },
          quiz: { prompt: 'Round 349 to the nearest 100.', options: [{ label: '300', ok: true }, { label: '350', ok: false }, { label: '400', ok: false }], right: 'Yes! The tens digit is 4, so stay down at 300. The 9 does not matter.', wrong: 'Look at the TENS digit: 4 is 4 or less, so stay down at 300.' } },
        { say: 'Rounding <b>746</b> to the nearest 10: look at the ones digit, 6, so go up to <b>750</b>. To the nearest 100: look at the tens digit, 4, so stay down at <b>700</b>.', vis: null,
          quiz: { prompt: 'Round 746 to the nearest 100.', options: [{ label: '700', ok: true }, { label: '800', ok: false }, { label: '750', ok: false }], right: 'Yes! Tens digit 4 means stay down: 700.', wrong: 'For the nearest 100 we look at the TENS digit (4), not the ones. Stay down: 700.' } }
      ]
    },
    trick: {
      title: '5 or more, raise the score',
      say: 'Look at the digit <b>one place to the right</b> of the place you are rounding to. <b>5 or more: raise the score</b> (round up). <b>4 or less: let it rest</b> (stay down). Then fill the digits after with zeros.',
      vis: { kind: 'numberLine', args: [{ min: 300, max: 400, minor: 10, major: 50, width: 340, marks: [{ value: 350 }] }] },
      example: '<b>746</b> to the nearest 100: the tens digit is 4. 4 or less, let it rest → <b>700</b>. To the nearest 10: the ones digit is 6. Raise the score → <b>750</b>.'
    },
    gen: {
      1: function(){
        switch(randInt(0, 2)){
          case 0: return qRoundLine(10, 3, true);
          case 1: return qCloser();
          default: return qRoundLine(10, 3, true);
        }
      },
      2: function(){
        switch(randInt(0, 5)){
          case 0: return qRoundPlain(10, 4, true);
          case 1: return qRoundLine(100, 4, false);
          case 2: return qRoundPlain(100, 4, false);
          case 3: return qWhichRounds(10);
          case 4: return qRoundLine(10, 4, false);
          default: return qRoundPlain(10, 4, true);
        }
      },
      3: function(){
        switch(randInt(0, 5)){
          case 0: return numRound();
          case 1: return numRound();
          case 2: return numSmallestGreatest();
          case 3: return qWhoIsRight();
          case 4: return qWhichRounds(100);
          default: return numRound();
        }
      }
    }
  });
})();
