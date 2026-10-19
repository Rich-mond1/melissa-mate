/* number-count-steps — counting in steps of 4, 8, 50, 100 (and 3, 6 as a bridge): missing terms, next number, rules. */
(function(){
  const nk = K.num;
  const NAMES = ['Ana', 'Marcus', 'Sophie', 'Ivan', 'Lucy', 'Diego', 'Ellen', 'Tom', 'Aisha', 'Kai', 'Mei', 'Leo'];

  function lineWidth(max){ return max >= 1000 ? 440 : (max >= 100 ? 400 : 330); }
  /* ten equal jumps of `step`, starting at `min`; the ? sits at jump number idx (0..10) */
  function stepLine(min, step, idx, hide){
    const max = min + 10 * step, mv = min + idx * step;
    return V.numberLine({ min: min, max: max, minor: step, major: step, width: lineWidth(max), marks: [{ value: mv, kind: hide ? 'q' : 'dot' }], labels: function(v){ return (hide && v === mv) ? '' : v; } });
  }
  function termsText(seq, gap){
    return seq.map(function(v, i){ return i === gap ? '<b>?</b>' : String(v); }).join(', ');
  }
  function stepsExplain(seq, gap, step, up){
    let i = 0; while(i === gap || i + 1 === gap) i++;
    const p = seq[i], q = seq[i + 1];
    const st = ['Find the jump between two neighbours you can see: ' + p + ' and ' + q + ' are <b>' + step + '</b> apart, so we count ' + (up ? 'on' : 'back') + ' in ' + step + 's.'];
    if(gap > 0) st.push('The number after ' + seq[gap - 1] + ' is ' + seq[gap - 1] + (up ? ' + ' : ' − ') + step + ' = <b>' + seq[gap] + '</b>.');
    else st.push('The number before ' + seq[1] + ' is ' + seq[1] + (up ? ' − ' : ' + ') + step + ' = <b>' + seq[gap] + '</b>.');
    if(gap < seq.length - 1) st.push('Check: ' + seq[gap] + (up ? ' + ' : ' − ') + step + ' = ' + seq[gap + 1] + '. ✅');
    else st.push('The missing number is <b>' + seq[gap] + '</b>. ✅');
    return st;
  }
  function wrongsSeq(ans, step, up){
    const s = up ? 1 : -1, w = [];
    w.push({ v: ans + s, why: 'You counted on by 1. The jump is ' + step + ' every time.' });
    w.push({ v: ans - s * (step > 10 ? 10 : 1), why: 'Not quite. Add (or take away) exactly ' + step + ' from the number before.' });
    w.push({ v: ans + s * step, why: 'You jumped one step too far. Check which number comes next.' });
    w.push({ v: ans - s * step, why: 'You went the wrong way. Is the list going up or down?' });
    if(step !== 10) w.push({ v: ans - s * step + s * 10, why: 'That looks like counting in 10s. Look at the jump: it is ' + step + '.' });
    if(step % 2 === 0) w.push({ v: ans - s * step / 2, why: 'That is only half a jump from the number before. The jump is ' + step + '.' });
    return w;
  }
  function makeSeq(start, step, len, up){
    const seq = []; for(let i = 0; i < len; i++) seq.push(up ? start + i * step : start - i * step);
    return seq;
  }
  /* independent: neighbours (or the two known terms) give the missing term */
  function truthGap(seq, gap){
    const n = seq.length;
    if(gap === 0) return 2 * seq[1] - seq[2];
    if(gap === n - 1) return 2 * seq[n - 2] - seq[n - 3];
    return (seq[gap - 1] + seq[gap + 1]) / 2;
  }
  /* start values for each step */
  function startFor(step, up, len){
    const span = step * (len - 1);
    if(step === 4) return up ? 4 * randInt(0, 10) : 4 * randInt(Math.ceil(span / 4), 24);
    if(step === 8) return up ? 8 * randInt(0, 8) : 8 * randInt(Math.ceil(span / 8), 12);
    if(step === 3) return up ? 3 * randInt(0, 12) : 3 * randInt(Math.ceil(span / 3), 16);
    if(step === 6) return up ? 6 * randInt(0, 10) : 6 * randInt(Math.ceil(span / 6), 14);
    if(step === 50) return up ? 50 * randInt(0, 12) : 50 * randInt(Math.ceil(span / 50), 18);
    return up ? 100 * randInt(0, 6) : 100 * randInt(Math.ceil(span / 100), 9);
  }

  function qLine(steps, startMin, count){
    const step = pick(steps), idx = randInt(1, 9);
    const min = startMin ? step * randInt(0, step === 100 ? 5 : (step === 50 ? 10 : 8)) : 0;
    const vis = stepLine(min, step, idx, true), ans = min + idx * step;
    const w = [{ v: ans - step, why: 'That is the number BEFORE the ?. Count one more jump of ' + step + '.' }, { v: ans + step, why: 'That is the number AFTER the ?. Count carefully: one jump of ' + step + ' at a time.' }, { v: ans + (step === 4 ? 1 : (step === 8 ? 2 : (step === 50 ? -10 : 10))), why: 'The line goes up in jumps of ' + step + ', so every labelled number is ' + step + ' more than the one before.' }];
    return mcqNum({
      prompt: 'The number line counts in <b>' + step + 's</b>. What number is the <b>?</b>?', visual: vis, answer: ans, wrong: w, count: count, nearby: [step * 2, -step * 2, 2, -2, 10, -10],
      hint: 'Look at the number just before the ?. Add ' + step + ' to it. Or count the jumps from the start.',
      explain: ex('Counting in ' + step + 's', ['Each jump on the line is <b>' + step + '</b>.', 'The number before the ? is ' + (ans - step) + '. ' + (ans - step) + ' + ' + step + ' = <b>' + ans + '</b>.', 'Check: the number after the ? is ' + (ans + step) + ', which is ' + step + ' more. ✅']),
      truth: ((ans - step) + (ans + step)) / 2, decode: function(){ return V.decodeNumberLine(vis); }
    });
  }
  function qNextText(steps, up, count, len, startFn){
    const step = pick(steps), l = len || 4;
    const seq = makeSeq(startFn ? startFn(step, up, l + 1) : startFor(step, up, l + 1), step, l + 1, up);
    const ans = seq[l], shown = '';
    return mcqNum({
      prompt: 'What comes <b>next</b>?<br><b>' + seq.slice(0, l).join(', ') + ', ?</b>', answer: ans, wrong: wrongsSeq(ans, step, up), count: count, nearby: [step, -step, 2 * step, 1, -1],
      hint: 'Subtract two neighbours to find the jump. Then ' + (up ? 'add it to' : 'take it away from') + ' the last number.',
      explain: ex('Counting ' + (up ? 'on' : 'back') + ' in ' + step + 's', ['The jump: ' + Math.max(seq[1], seq[0]) + ' and ' + Math.min(seq[1], seq[0]) + ' are <b>' + step + '</b> apart.', seq[l - 1] + (up ? ' + ' : ' − ') + step + ' = <b>' + ans + '</b>.', 'So the next number is <b>' + ans + '</b>. ✅']),
      truth: 2 * seq[l - 1] - seq[l - 2]
    });
  }
  function qGap(steps, up, count, len){
    const step = pick(steps), l = len || 5;
    const seq = makeSeq(startFor(step, up, l), step, l, up);
    const gap = randInt(1, l - 2), ans = seq[gap];
    return mcqNum({
      prompt: 'Which number is missing?<br><b>' + termsText(seq, gap) + '</b>', answer: ans, wrong: wrongsSeq(ans, step, up), count: count, nearby: [step, -step, 2 * step, 1, -1],
      hint: 'Subtract two neighbours that you can see. That is the jump. Then use it to find the missing number.',
      explain: ex('Finding the missing number', stepsExplain(seq, gap, step, up)),
      truth: truthGap(seq, gap)
    });
  }
  function qRule(){
    const step = pick([4, 8, 50, 100, 3, 6, 5, 10]);
    const seq = makeSeq(startFor(step, true, 5), step, 5, true);
    const lab = function(s){ return 'Counting in ' + s + 's'; };
    const pool = [step * 2, Math.round(step / 2), step + 1, step - 1, step + 2, 10, 5, 2, 3, 4, 8, 50, 100, 6].filter(function(x){ return x >= 2 && x !== step; });
    const ds = pool.map(function(s){ return opt(K.text(lab(s)), lab(s), 'Look at the gap between neighbours: ' + seq[1] + ' − ' + seq[0] + ' = ' + step + ', not ' + s + '.'); });
    return mcq({
      prompt: 'How is this sequence counting?<br><b>' + seq.join(', ') + '</b>', correct: opt(K.text(lab(step)), lab(step)), distractors: ds, keepOrder: true, count: 4,
      hint: 'Pick two numbers that sit next to each other and subtract the smaller from the bigger.',
      explain: ex('Finding the rule', [seq[1] + ' − ' + seq[0] + ' = ' + (seq[1] - seq[0]) + ' and ' + seq[2] + ' − ' + seq[1] + ' = ' + (seq[2] - seq[1]) + '.', 'The jump is the same every time: <b>' + step + '</b>.', 'So the rule is <b>' + lab(step) + '</b>. ✅']),
      truth: K.text(lab(seq[1] - seq[0]))
    });
  }

  /* ---------- tier 3 ---------- */
  function numGap(steps, up){
    const step = pick(steps), l = 5;
    const seq = makeSeq(startFor(step, up, l), step, l, up);
    const gap = randInt(0, l - 1), ans = seq[gap];
    return numeric({
      prompt: 'Type the missing number.<br><b>' + termsText(seq, gap) + '</b>', answer: ans,
      hint: gap === 0 ? 'Subtract two neighbours to find the jump. The missing number is BEFORE the second number, so go the opposite way from the counting direction.' : 'Subtract two neighbours to find the jump. Then count ' + (up ? 'on' : 'back') + ' from the number before the gap.',
      explain: ex('Finding the missing number', stepsExplain(seq, gap, step, up)), truth: truthGap(seq, gap),
      wrong: function(v){ return v === ans + 1 || v === ans - 1 ? 'Close! The jump is ' + step + ' each time, not 1.' : ''; }
    });
  }
  function numNth(){
    const step = pick([3, 4, 6, 8, 50]), n = randInt(5, 9), nm = pick(NAMES);
    const ans = step * n;
    let t = 0; for(let i = 0; i < n; i++) t += step;     // independent: add up the jumps one by one
    const first = [1, 2, 3].map(function(i){ return step * i; }).join(', ');
    return numeric({
      prompt: nm + ' counts in <b>' + step + 's</b> from 0: ' + first + ', … What is the <b>' + n + 'th</b> number ' + nm + ' says?', answer: ans,
      hint: 'Write the numbers out one at a time and keep count: 1st, 2nd, 3rd… Or use the ' + step + ' times table.',
      explain: ex('The ' + n + 'th number', ['Count in ' + step + 's: ' + [1, 2, 3, 4, 5, 6, 7, 8, 9].slice(0, n).map(function(i){ return step * i; }).join(', ') + '.', 'The ' + n + 'th number is <b>' + ans + '</b>.', 'Quick check: ' + n + ' × ' + step + ' = ' + ans + '. ✅']), truth: t,
      wrong: function(v){ return (v === ans - step || v === ans + step) ? 'You are one number out. Count your numbers again: the ' + n + 'th one is exactly ' + n + ' jumps from 0.' : ''; }
    });
  }
  function numLine(){
    const step = pick([3, 6, 8, 4]), idx = randInt(2, 9), min = step * randInt(0, 4);
    const vis = stepLine(min, step, idx, true), ans = min + idx * step;
    return numeric({
      prompt: 'The number line counts in <b>' + step + 's</b>. Type the number the <b>?</b> stands for.', visual: vis, answer: ans,
      hint: 'Look at the labelled number next to the ?. The jump is ' + step + '.',
      explain: ex('Counting in ' + step + 's', ['Each jump is <b>' + step + '</b>.', (ans - step) + ' + ' + step + ' = <b>' + ans + '</b>.', 'Check: ' + ans + ' + ' + step + ' = ' + (ans + step) + ', the next label. ✅']),
      truth: ((ans - step) + (ans + step)) / 2, decode: function(){ return V.decodeNumberLine(vis); },
      wrong: function(v){ return (v === ans - step || v === ans + step) ? 'That is the number next to the ?. Add or take away one jump of ' + step + '.' : ''; }
    });
  }
  function qWillSay(){
    const step = pick([3, 4, 6, 8, 50, 100]), nm = pick(NAMES), inSeq = chance(0.5);
    const m = step >= 50 ? randInt(2, 9) : randInt(3, 12);
    let n = step * m;
    if(!inSeq){ const offs = step === 50 ? [10, 25, 40] : (step === 100 ? [10, 50, 90] : [1, 2, step - 1].filter(function(x){ return x >= 1 && x < step; })); n = n + pick(offs); }
    const first = [1, 2, 3].map(function(i){ return step * i; }).join(', ');
    const near = Math.floor(n / step) * step;
    return mcq2({
      prompt: nm + ' counts in <b>' + step + 's</b> from 0: ' + first + ', … Will ' + nm + ' say the number <b>' + n + '</b>?',
      correct: opt(K.bool(inSeq), inSeq ? 'Yes' : 'No'), other: opt(K.bool(!inSeq), inSeq ? 'No' : 'Yes', inSeq ? n + ' is in the ' + step + 's count: ' + m + ' jumps of ' + step + ' land on it.' : 'Count on from ' + near + ': ' + near + ' + ' + step + ' = ' + (near + step) + '. ' + n + ' is skipped.'),
      hint: 'Count in ' + step + 's until you reach or pass ' + n + '. Do you land exactly on it?',
      explain: ex('Will we say ' + n + '?', inSeq ? ['Count in ' + step + 's: ' + first + ', … ' + (m * step) + '.', n + ' = ' + m + ' × ' + step + '.', '<b>Yes</b>, ' + nm + ' says ' + n + '. ✅'] : ['Count in ' + step + 's: … ' + near + ', ' + (near + step) + ', …', n + ' is between ' + near + ' and ' + (near + step) + ', so it is skipped.', '<b>No</b>, ' + nm + ' does not say ' + n + '. ✅']),
      truth: K.bool(n % step === 0)
    });
  }
  function qWhichSeq(){
    const step = pick([3, 4, 6, 8, 50]), start = startFor(step, true, 5);
    const good = makeSeq(start, step, 5, true);
    const cands = [];
    [step + 1, step - 1, step + 2, step * 2].forEach(function(s){ if(s > 1 && s !== step) cands.push(makeSeq(start, s, 5, true)); });
    const bad1 = good.slice(); bad1[2] += (step > 10 ? 10 : 1); cands.unshift(bad1);
    const bad2 = good.slice(); bad2[3] -= 1; cands.unshift(bad2);
    const lab = function(a){ return a.join(', '); };
    const ds = cands.map(function(a){
      let why = 'The jumps are not all ' + step + ': ';
      const diffs = a.slice(1).map(function(x, i){ return x - a[i]; });
      why += diffs.join(', ') + '. Counting in ' + step + 's needs the same jump of ' + step + ' every time.';
      return opt(K.text(lab(a)), lab(a), why);
    });
    const opts = [opt(K.text(lab(good)), lab(good))].concat(ds.slice(0, 3));
    const q = mcq({
      prompt: 'Which sequence counts in <b>' + step + 's</b>?', correct: opts[0], distractors: ds, keepOrder: false, count: 4,
      hint: 'Check the jump between every pair of neighbours. They must ALL be ' + step + '.',
      explain: ex('Checking the jumps', ['In ' + lab(good) + ' every jump is <b>' + step + '</b>.', 'The other sequences have a jump that is different somewhere.', 'The answer is <b>' + lab(good) + '</b>. ✅']),
      truth: 'pending'
    });
    // independent truth: the only option whose neighbours ALL differ by `step`
    let truthKey = null;
    q.options.forEach(function(o){ const a = o.label.split(', ').map(Number); if(a.slice(1).every(function(x, i){ return x - a[i] === step; })) truthKey = o.key; });
    q.truthKey = truthKey;
    return q;
  }

  registerSkill({
    id: 'number-count-steps', strand: 'number', name: 'Counting in steps', emoji: '🪜', year: 3, order: 140, prereq: ['number-place-value'],
    lesson: {
      title: 'Counting in jumps',
      steps: [
        { say: 'Counting in <b>4s</b> means jumping <b>4</b> each time: 4, 8, 12, 16, 20… Each jump on the number line is the same size. The dot is on <b>12</b>.', vis: { kind: 'numberLine', args: [{ min: 0, max: 40, minor: 4, major: 4, width: 330, marks: [{ value: 12 }] }] } },
        { say: 'Counting in <b>8s</b> is like counting in 4s but taking <b>two</b> jumps at once: 8, 16, 24, 32, 40… The dot is on <b>32</b>.', vis: { kind: 'numberLine', args: [{ min: 0, max: 80, minor: 8, major: 8, width: 330, marks: [{ value: 32 }] }] },
          quiz: { prompt: 'Count in 8s: 16, 24, ?', options: [{ label: '28', ok: false }, { label: '32', ok: true }, { label: '30', ok: false }], right: 'Yes! 24 + 8 = 32.', wrong: 'Jump 8 from 24: 24 + 8 = 32.' } },
        { say: 'Counting in <b>50s</b>: 50, 100, 150, 200… Two jumps of 50 make 100. The dot is on <b>350</b>, halfway between 300 and 400.', vis: { kind: 'numberLine', args: [{ min: 0, max: 500, minor: 50, major: 100, width: 400, marks: [{ value: 350 }] }] },
          quiz: { prompt: 'Count in 50s: 150, 200, ?', options: [{ label: '210', ok: false }, { label: '250', ok: true }, { label: '300', ok: false }], right: 'Yes! 200 + 50 = 250.', wrong: 'Jump 50 from 200: 200 + 50 = 250.' } },
        { say: 'Counting in <b>100s</b>: 100, 200, 300… Only the <b>hundreds</b> digit changes. The dot is on <b>600</b>.', vis: { kind: 'numberLine', args: [{ min: 0, max: 1000, minor: 100, major: 100, width: 440, marks: [{ value: 600 }] }] },
          quiz: { prompt: 'Count in 100s: 400, 500, ?', options: [{ label: '510', ok: false }, { label: '600', ok: true }, { label: '501', ok: false }], right: 'Yes! 500 + 100 = 600.', wrong: 'The hundreds digit goes up by 1: 500 becomes 600.' } },
        { say: 'Not sure what the jump is? <b>Subtract two neighbours</b>. In 24, 32, 40, 48 the jump is 32 − 24 = <b>8</b>. Then use it to find missing numbers.', vis: null,
          quiz: { prompt: 'What is the jump in 12, 16, 20, 24?', options: [{ label: '2', ok: false }, { label: '4', ok: true }, { label: '12', ok: false }], right: 'Yes! 16 − 12 = 4. We are counting in 4s.', wrong: 'Subtract two neighbours: 16 − 12 = 4.' } }
      ]
    },
    trick: {
      title: 'Find the jump',
      say: 'Pick any two numbers that sit <b>next to each other</b> and <b>subtract</b>. The answer is the jump! And remember: the <b>8s are the 4s doubled</b>, and the <b>50s</b> are half of the <b>100s</b>.',
      vis: { kind: 'numberLine', args: [{ min: 0, max: 80, minor: 8, major: 8, width: 330, marks: [{ value: 24 }] }] },
      example: '<b>8, 16, ?, 32</b>: 16 − 8 = 8 is the jump. So ? = 16 + 8 = <b>24</b>, and 24 + 8 = 32 fits. ✅'
    },
    gen: {
      1: function(){
        switch(randInt(0, 2)){
          case 0: return qLine([4, 50, 100], false, 3);
          case 1: return qLine([4, 50, 100], false, 3);
          default: return qNextText([4, 50, 100], true, 3, 4, function(step){ return step * randInt(0, 3); });
        }
      },
      2: function(){
        switch(randInt(0, 5)){
          case 0: return qLine([4, 8, 50, 100], true, 4);
          case 1: return qGap([4, 8, 50, 100], chance(0.65), 4);
          case 2: return qGap([4, 8, 50, 100], chance(0.65), 4);
          case 3: return qNextText([4, 8, 50, 100], chance(0.7), 4);
          case 4: return qRule();
          default: return qNextText([4, 8, 50, 100], false, 4);
        }
      },
      3: function(){
        switch(randInt(0, 6)){
          case 0: return numGap([3, 4, 6, 8, 50, 100], chance(0.6));
          case 1: return numGap([3, 4, 6, 8, 50, 100], chance(0.5));
          case 2: return numNth();
          case 3: return numLine();
          case 4: return qWillSay();
          case 5: return qWhichSeq();
          default: return numGap([3, 6, 8, 50], false);
        }
      }
    }
  });
})();
