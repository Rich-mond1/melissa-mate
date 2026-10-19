/* number-place-value — hundreds, tens and ones of 3-digit numbers (base-ten blocks). */
(function(){
  const nk = K.num;
  function val(h, t, o){ return h * 100 + t * 10 + o; }
  function join3(h, t, o){ return Number('' + h + t + o); }          // independent: glue the digits together
  function dg(n){ return [Math.floor(n / 100), Math.floor(n / 10) % 10, n % 10]; }
  const PL = ['hundreds', 'tens', 'ones'];
  const PL1 = ['hundreds', 'tens', 'ones'];
  const BLOCKS_HINT = 'Big blue squares are hundreds, purple sticks are tens and yellow cubes are ones. Count each kind, then write them side by side: hundreds, tens, ones.';

  /* wrong answers for "blocks -> number" */
  function blockWrongs(h, t, o){
    const w = [];
    w.push({ v: o * 100 + t * 10 + h, why: 'You read the blocks backwards. Hundreds come FIRST, then tens, then ones.' });
    w.push({ v: t * 100 + h * 10 + o, why: 'Hundreds first, then tens, then ones. You mixed up the hundreds and the tens.' });
    w.push({ v: h + t + o, why: 'You added up the digits. Instead, write them side by side: ' + plural(h, 'hundred') + ', ' + plural(t, 'ten') + ', ' + plural(o, 'one') + '.' });
    if(t === 0) w.push({ v: h * 10 + o, why: 'No purple sticks means 0 tens. Write a 0 in the tens place to hold it.' });
    if(o === 0) w.push({ v: h * 10 + t, why: 'No yellow cubes means 0 ones. Write a 0 in the ones place to hold it.' });
    w.push({ v: val(h, t + 1, o), why: 'Count the purple sticks again, there are ' + t + ' of them.' });
    w.push({ v: val(h, t, o + 1), why: 'Count the yellow cubes again, there are ' + o + ' of them.' });
    return w;
  }

  /* 1: blocks -> number (tier 1 & 2) */
  function qBlocksToNumber(maxH, maxT, maxO, zeroChance, count){
    let h = randInt(1, maxH), t = randInt(0, maxT), o = randInt(0, maxO);
    if(chance(zeroChance)){ if(chance(0.5)) t = 0; else o = 0; }
    const n = val(h, t, o), vis = V.baseTen(h, t, o);
    return mcqNum({
      prompt: 'What number do the blocks show?', visual: vis, answer: n, wrong: blockWrongs(h, t, o), count: count, nearby: [10, -10, 1, -1, 100, -100],
      hint: BLOCKS_HINT,
      explain: ex('Reading the blocks', [
        '<b>' + h + '</b> big blue ' + (h === 1 ? 'square' : 'squares') + ' = <b>' + h + '</b> hundred' + (h === 1 ? '' : 's') + ' = ' + (h * 100) + '.',
        '<b>' + t + '</b> purple ' + (t === 1 ? 'stick' : 'sticks') + ' = <b>' + t + '</b> ten' + (t === 1 ? '' : 's') + ' = ' + (t * 10) + '.',
        '<b>' + o + '</b> yellow ' + (o === 1 ? 'cube' : 'cubes') + ' = <b>' + o + '</b> one' + (o === 1 ? '' : 's') + '.',
        'Write the digits side by side: <b>' + n + '</b>. ✅'
      ]),
      truth: join3(h, t, o), decode: function(){ return V.decodeBaseTen(vis); }
    });
  }

  /* 2: count one kind of block (tier 1) */
  function qCountKind(){
    const h = randInt(1, 3), t = randInt(0, 7), o = randInt(0, 8), idx = randInt(0, 2);
    const vis = V.baseTen(h, t, o), d = [h, t, o][idx];
    const kind = ['big blue squares (hundreds)', 'purple sticks (tens)', 'yellow cubes (ones)'][idx];
    const wrong = [];
    [0, 1, 2].forEach(function(i){ if(i !== idx) wrong.push({ v: [h, t, o][i], why: 'That is how many ' + PL[i] + ' there are. Look at the ' + PL[idx] + ' instead.' }); });
    if(idx !== 2) wrong.push({ v: d * (idx === 0 ? 100 : 10), why: 'That is the VALUE. We want to know how many blocks there are, so just count them.' });
    return mcqNum({
      prompt: 'How many ' + kind + ' can you see?', visual: vis, answer: d, wrong: wrong, count: 3, nearby: [1, -1, 2, -2],
      hint: 'Count only the ' + PL[idx] + ': ' + (idx === 0 ? 'the big blue squares' : idx === 1 ? 'the purple sticks' : 'the yellow cubes') + '. Touch each one as you count.',
      explain: ex('Counting the ' + PL[idx], ['Look only at the ' + kind + '.', 'Count them one by one: there are <b>' + d + '</b>.', 'So the number of ' + PL[idx] + ' is <b>' + d + '</b>. ✅']),
      truth: Number(String(h * 100 + t * 10 + o)[idx]),
      decode: function(){ return Number(String(V.decodeBaseTen(vis)).padStart(3, '0')[idx]); }
    });
  }

  /* 3: number -> which blocks (tier 1) */
  function qWhichBlocks(){
    const h = randInt(1, 4), t = randInt(0, 7), o = randInt(0, 7);
    const n = val(h, t, o);
    const cands = [[h, o, t], [t || 1, h, o], [o || 1, t, h], [h + 1, t, o], [h, t + 1, o], [h, t, o + 1], [h, t + 2, o], [h, t, o + 2], [Math.max(h - 1, 1), t, o], [h, Math.max(t - 1, 0), o]];
    const seen = {}; seen[nk(n)] = 1;
    const ds = [];
    cands.forEach(function(c){
      if(c[0] < 1 || c[0] > 5 || c[1] > 9 || c[2] > 9) return;
      const v = val(c[0], c[1], c[2]), key = nk(v);
      if(seen[key]) return; seen[key] = 1;
      ds.push(opt(key, V.baseTen(c[0], c[1], c[2]), 'That picture shows ' + v + ', not ' + n + '. Check each kind of block: ' + plural(dg(n)[0], 'hundred') + ', ' + plural(dg(n)[1], 'ten') + ', ' + plural(dg(n)[2], 'one') + '.'));
    });
    const q = mcq({
      prompt: 'Which blocks show <b>' + n + '</b>?', visual: '', correct: opt(nk(n), V.baseTen(h, t, o)), distractors: ds, keepOrder: true, count: 3,
      hint: 'Split ' + n + ' into hundreds, tens and ones first. Then look for a picture with that many of each.',
      explain: ex('Finding ' + n + ' in blocks', [n + ' has <b>' + h + '</b> hundred' + (h === 1 ? '' : 's') + ', <b>' + t + '</b> ten' + (t === 1 ? '' : 's') + ' and <b>' + o + '</b> one' + (o === 1 ? '' : 's') + '.', 'So we need ' + h + ' blue ' + (h === 1 ? 'square' : 'squares') + ', ' + t + ' purple ' + (t === 1 ? 'stick' : 'sticks') + ' and ' + o + ' yellow ' + (o === 1 ? 'cube' : 'cubes') + '.', 'Only one picture matches: that is <b>' + n + '</b>. ✅']),
      truth: nk(join3(h, t, o))
    });
    q.optionsAreVisual = true;
    q.decodeKey = function(){ for(let i = 0; i < q.options.length; i++){ if(nk(V.decodeBaseTen(q.options[i].label)) !== q.options[i].key) return 'option ' + i + ' picture does not match its key'; } return q.options[q.correct].key; };
    return q;
  }

  /* value of a digit (all digits different, none zero, so "the 7" is unambiguous) */
  function distinctNumber(){
    let h, t, o; do { h = randInt(1, 9); t = randInt(1, 9); o = randInt(1, 9); } while(h === t || t === o || h === o);
    return [h, t, o];
  }
  function valueOfDigitParts(){
    const ds = distinctNumber(), idx = randInt(0, 2), n = val(ds[0], ds[1], ds[2]), d = ds[idx];
    const ans = d * [100, 10, 1][idx];
    const truth = Number(String(d) + '0'.repeat(2 - idx));
    return { ds: ds, idx: idx, n: n, d: d, ans: ans, truth: truth };
  }
  function valueExplain(p){
    return ex('The value of the ' + p.d + ' in ' + p.n, [
      p.n + ' = <b>' + p.ds[0] + '</b> hundreds + <b>' + p.ds[1] + '</b> tens + <b>' + p.ds[2] + '</b> ones.',
      'The ' + p.d + ' is in the <b>' + PL[p.idx] + '</b> place.',
      p.idx === 2 ? p.d + ' ones is just <b>' + p.d + '</b>.' : p.d + ' ' + PL[p.idx] + ' = ' + p.d + ' × ' + (p.idx === 0 ? 100 : 10) + ' = <b>' + p.ans + '</b>. ✅'
    ]);
  }
  function valueWrongs(p){
    const w = [];
    if(p.idx !== 2) w.push({ v: p.d, why: 'That is the digit itself. But the ' + p.d + ' sits in the ' + PL[p.idx] + ' place, so it is worth more.' });
    [0, 1, 2].forEach(function(i){ if(i !== p.idx) w.push({ v: p.d * [100, 10, 1][i], why: 'You used the wrong column. The ' + p.d + ' is in the ' + PL[p.idx] + ' column.' }); });
    [0, 1, 2].forEach(function(i){ if(i !== p.idx) w.push({ v: p.ds[i] * [100, 10, 1][i], why: 'That is the value of the ' + p.ds[i] + ', not the ' + p.d + '.' }); });
    return w;
  }
  function qValueMcq(count){
    const p = valueOfDigitParts();
    return mcqNum({
      prompt: 'What is the value of the <b>' + p.d + '</b> in <b>' + p.n + '</b>?', answer: p.ans, wrong: valueWrongs(p), count: count, nearby: [10, -10, 100, -100, 1],
      hint: 'First find which column the ' + p.d + ' is in: hundreds, tens or ones. Then ask how much one of that column is worth.',
      explain: valueExplain(p), truth: p.truth
    });
  }

  function partsText(h, t, o){
    const a = [];
    if(h) a.push(h * 100); if(t) a.push(t * 10); if(o) a.push(o);
    return a.join(' + ');
  }

  registerSkill({
    id: 'number-place-value', strand: 'number', name: 'Hundreds, tens and ones', emoji: '🧱', year: 3, order: 110, prereq: [],
    lesson: {
      title: 'Building numbers with blocks',
      steps: [
        { say: 'Let’s build numbers! A big <b>blue square</b> is <b>100</b> (one hundred). A <b>purple stick</b> is <b>10</b> (one ten). A <b>yellow cube</b> is <b>1</b> (one one).', vis: { kind: 'baseTen', args: [1, 1, 1] } },
        { say: 'Here are <b>2</b> hundreds, <b>4</b> tens and <b>3</b> ones. 200 + 40 + 3 = <b>243</b>. The digits sit in columns: hundreds, tens, ones.', vis: { kind: 'baseTen', args: [2, 4, 3] } },
        { say: 'A digit’s <b>value</b> depends on its column. In <b>374</b> the 7 is in the tens column, so it means <b>7 tens = 70</b>, not just 7.', vis: { kind: 'baseTen', args: [3, 7, 4] },
          quiz: { prompt: 'What is the value of the 7 in 374?', options: [{ label: '7', ok: false }, { label: '70', ok: true }, { label: '700', ok: false }], right: 'Yes! 7 tens is 70.', wrong: 'The 7 is in the TENS column. 7 tens = 70.' } },
        { say: 'No sticks? Then there are <b>0 tens</b>. We write a <b>0</b> to hold the place, so 3 hundreds and 5 ones is <b>305</b>, not 35.', vis: { kind: 'baseTen', args: [3, 0, 5] },
          quiz: { prompt: 'The blocks show 305. How many tens are there?', options: [{ label: '0 tens', ok: true }, { label: '3 tens', ok: false }, { label: '5 tens', ok: false }], right: 'Yes! Zero tens, so the zero holds the tens place.', wrong: 'Look for purple sticks: there are none! So 0 tens.' } },
        { say: 'You can swap blocks. <b>10 tens</b> make <b>1 hundred</b>. So <b>2 hundreds and 13 tens</b> is the same as 2 hundreds + 1 hundred + 3 tens = <b>330</b>.', vis: { kind: 'baseTen', args: [2, 13, 0] },
          quiz: { prompt: 'Which number is 2 hundreds and 13 tens?', options: [{ label: '213', ok: false }, { label: '330', ok: true }, { label: '2130', ok: false }], right: 'Yes! 13 tens = 130, and 200 + 130 = 330.', wrong: '13 tens is 130. 200 + 130 = 330.' } }
      ]
    },
    trick: {
      title: 'Digit, then zeros',
      say: 'To find a digit’s value, write the digit and add as many <b>zeros</b> as there are columns to its <b>right</b>. A digit in the tens column has <b>one</b> zero after it. A digit in the hundreds column has <b>two</b>.',
      vis: { kind: 'baseTen', args: [3, 7, 4] },
      example: 'In 374 the 7 has one column to its right, so <b>7 + one zero = 70</b>. The 3 has two columns to its right: <b>300</b>.'
    },
    gen: {
      1: function(){
        switch(randInt(0, 2)){
          case 0: return qBlocksToNumber(3, 6, 6, 0.25, 3);
          case 1: return qCountKind();
          default: return qWhichBlocks();
        }
      },
      2: function(){
        switch(randInt(0, 3)){
          case 0: return qBlocksToNumber(5, 9, 9, 0.35, 4);
          case 1: return qValueMcq(4);
          case 2: { // partition -> number
            let h = randInt(1, 9), t = randInt(0, 9), o = randInt(0, 9);
            if(chance(0.4)){ if(chance(0.5)) t = 0; else o = 0; }
            if(t === 0 && o === 0) o = randInt(1, 9);
            const n = val(h, t, o), parts = partsText(h, t, o);
            const w = [];
            if(t === 0) w.push({ v: h * 10 + o, why: 'There are no tens, so a 0 must hold the tens place: ' + n + ', not ' + (h * 10 + o) + '.' });
            if(o === 0) w.push({ v: h * 10 + t, why: 'There are no ones, so a 0 must hold the ones place: ' + n + ', not ' + (h * 10 + t) + '.' });
            if(t !== 0 && o !== 0){ w.push({ v: o * 100 + t * 10 + h, why: 'You wrote the digits backwards. The hundreds digit goes first.' }); w.push({ v: h + t + o, why: 'You added the digits. Write them side by side instead.' }); w.push({ v: Number('' + h + '0' + t + '0' + o), why: 'You wrote the zeros as well. Just write the digit for each column.' }); }
            else { w.push({ v: Number('' + h + '0' + (t || o)), why: 'Careful, there is one missing column to hold with a 0, not two.' }); w.push({ v: h + t + o, why: 'You added the digits. Write them side by side instead.' }); w.push({ v: t === 0 ? h * 100 + o * 10 : h * 100 + t, why: 'The ' + (t === 0 ? o : t) + ' is in the wrong column. Check hundreds, tens, ones.' }); }
            return mcqNum({
              prompt: 'What number is <b>' + parts + '</b>?', answer: n, wrong: w, nearby: [10, -10, 100, -100, 1],
              hint: 'Put each part in its own column. If a column is missing, put a 0 there.',
              explain: ex('Putting ' + parts + ' together', ['The hundreds part is <b>' + h * 100 + '</b>, so the hundreds digit is ' + h + '.', t ? 'The tens part is <b>' + t * 10 + '</b>, so the tens digit is ' + t + '.' : 'There is <b>no tens part</b>, so the tens digit is <b>0</b>.', o ? 'The ones part is <b>' + o + '</b>, so the ones digit is ' + o + '.' : 'There is <b>no ones part</b>, so the ones digit is <b>0</b>.', 'Together: <b>' + n + '</b>. ✅']),
              truth: join3(h, t, o)
            });
          }
          default: { // which digit is in a place
            const ds = distinctNumber(), idx = randInt(0, 2), n = val(ds[0], ds[1], ds[2]), d = ds[idx];
            const w = [];
            [0, 1, 2].forEach(function(i){ if(i !== idx) w.push({ v: ds[i], why: 'That digit is in the ' + PL[i] + ' place. The ' + PL[idx] + ' digit is ' + d + '.' }); });
            return mcqNum({
              prompt: 'Which digit is in the <b>' + PL[idx] + '</b> place of <b>' + n + '</b>?', answer: d, wrong: w, count: 3, nearby: [1, -1, 2, -2],
              hint: 'Say the number in columns: hundreds, tens, ones. Which column is the ' + PL[idx] + '?',
              explain: ex('Digits in ' + n, ['Hundreds: <b>' + ds[0] + '</b>, tens: <b>' + ds[1] + '</b>, ones: <b>' + ds[2] + '</b>.', 'The ' + PL[idx] + ' digit is <b>' + d + '</b>. ✅']),
              truth: Number(String(n)[idx])
            });
          }
        }
      },
      3: function(){
        switch(randInt(0, 4)){
          case 0: { // typed value of a digit
            const p = valueOfDigitParts();
            return numeric({
              prompt: 'What is the <b>value</b> of the <b>' + p.d + '</b> in <b>' + p.n + '</b>? Type the number.', answer: p.ans,
              hint: 'Which column is the ' + p.d + ' in? Write the digit and add the zeros for the columns to its right.',
              explain: valueExplain(p), truth: p.truth,
              wrong: function(v){ if(v === p.d && p.idx !== 2) return 'That is just the digit. It sits in the ' + PL[p.idx] + ' column, so it is worth more.'; const i = [100, 10, 1].indexOf(v / p.d); return i >= 0 ? 'Wrong column: the ' + p.d + ' is in the ' + PL[p.idx] + ' place.' : ''; }
            });
          }
          case 1: { // partition another way, typed
            const h = randInt(3, 9), t = randInt(0, 9), o = randInt(0, 9), n = val(h, t, o), X = chance(0.7) ? h - 1 : h - 2;
            const ans = t + 10 * (h - X);
            return numeric({
              prompt: n + ' = ' + X + ' hundreds + <b>?</b> tens + ' + o + ' ones. What number goes in the gap?', answer: ans,
              hint: 'Taking a hundred out of ' + n + ' leaves less in the hundreds. Remember that 1 hundred is the same as 10 tens.',
              explain: ex('Partitioning ' + n + ' another way', [n + ' = ' + h + ' hundreds + ' + t + ' tens + ' + o + ' ones.', 'We only use ' + X + ' hundreds, so ' + (h - X) + ' hundred' + (h - X === 1 ? '' : 's') + ' (' + (h - X) * 100 + ') turn into ' + (h - X) * 10 + ' tens.', t + ' tens + ' + (h - X) * 10 + ' tens = <b>' + ans + '</b> tens.', X * 100 + ' + ' + ans * 10 + ' + ' + o + ' = ' + n + '. ✅']),
              truth: (n - X * 100 - o) / 10,
              wrong: function(v){ return v === t ? 'That is the tens digit. But the hundred you took out turns into 10 more tens.' : (v === t + 1 ? 'One hundred is 10 tens, not 1 ten.' : ''); }
            });
          }
          case 2: { // how many tens altogether
            const h = randInt(1, 9), t = randInt(0, 9), n = val(h, t, 0), ans = h * 10 + t;
            return numeric({
              prompt: 'How many tens are there altogether in <b>' + n + '</b>?', answer: ans,
              hint: 'Each hundred is worth 10 tens. How many tens do the hundreds give? Then add the tens.',
              explain: ex('Tens in ' + n, [h + ' hundreds = ' + h + ' × 10 = <b>' + h * 10 + '</b> tens.', 'Plus ' + plural(t, 'more ten') + '.', h * 10 + ' + ' + t + ' = <b>' + ans + '</b> tens. ✅']),
              truth: Number(String(n).slice(0, -1)),
              wrong: function(v){ return v === t ? 'That is only the tens digit. The hundreds turn into tens too.' : (v === h ? 'That is the hundreds digit. 1 hundred = 10 tens.' : ''); }
            });
          }
          case 3: { // same as?
            const h = randInt(2, 9), t = randInt(0, 8), o = randInt(0, 9), n = val(h, t, o);
            const lab = function(x, T, y){ return x + ' hundred' + (x === 1 ? '' : 's') + ' + ' + T + ' tens + ' + y + ' ones'; };
            const useTensOnly = chance(0.25);
            const X = useTensOnly ? 0 : h - 1, T = useTensOnly ? h * 10 + t : t + 10;
            const cands = [[X, t, o, 'Moving a hundred out means adding 10 tens, not leaving the tens alone.'], [X, t + 1, o, 'One hundred is 10 tens, not 1 ten.'], [h, t + 10, o, 'You kept all the hundreds AND added 10 more tens.'], [X, t + 100, o, 'One hundred is 10 tens, not 100 tens.'], [h - 2, t + 10, o, 'Taking out 2 hundreds needs 20 more tens.'], [X, T, o + 10, 'The ones are still ' + o + '. They do not change.'], [X, T + 1, o, 'Count again: the total in tens is off by one.'], [X, T - 1, o, 'Count again: the total in tens is off by one.']];
            const ds = cands.filter(function(c){ return c[0] >= 0 && c[2] >= 0; }).map(function(c){ return opt(nk(val(c[0], c[1], c[2])), lab(c[0], c[1], c[2]), c[3]); });
            const corr = lab(X, T, o);
            return mcq({
              prompt: 'Which is the same as <b>' + n + '</b>?', correct: opt(nk(val(X, T, o)), corr), distractors: ds, keepOrder: true,
              hint: 'Work out the value of each choice: hundreds × 100 + tens × 10 + ones. Which one makes ' + n + '?',
              explain: ex(n + ' in a different way', ['The right choice is <b>' + corr + '</b>.', X * 100 + ' + ' + T * 10 + ' + ' + o + ' = <b>' + n + '</b>. ✅', 'The other choices make a different number.']),
              truth: nk(n)
            });
          }
          default: { // blocks with more than 9 tens sticks
            const h = randInt(1, 3), t = randInt(10, 13), o = randInt(0, 9), n = val(h, t, o), vis = V.baseTen(h, t, o);
            const w = [
              { v: Number('' + h + t + o), why: 'You wrote the digits side by side, but ' + t + ' sticks is too many for one column. Work out each value first: ' + t + ' tens = ' + t * 10 + '.' },
              { v: val(h, t % 10, o), why: 'Ten of the sticks can be swapped for 1 hundred. You missed that.' },
              { v: val(h, t + 1, o), why: 'Count the sticks again, there are ' + t + '.' },
              { v: h * 100 + t + o, why: 'Each stick is 10, not 1. ' + t + ' sticks = ' + t * 10 + '.' }
            ];
            return mcqNum({
              prompt: 'What number do these blocks show? Careful: there are lots of purple sticks!', visual: vis, answer: n, wrong: w, nearby: [10, -10, 100, -100],
              hint: 'Count the value of each kind: hundreds × 100, tens × 10, ones × 1. Then add them up.',
              explain: ex('Blocks with lots of tens', [plural(h, 'hundred') + ' = <b>' + h * 100 + '</b>.', t + ' tens = ' + t + ' × 10 = <b>' + t * 10 + '</b>.', o + ' ones = <b>' + o + '</b>.', h * 100 + ' + ' + t * 10 + ' + ' + o + ' = <b>' + n + '</b>. ✅']),
              truth: Number('' + (h + 1) + (t - 10) + o),
              decode: function(){ return V.decodeBaseTen(vis); }
            });
          }
        }
      }
    }
  });
})();
