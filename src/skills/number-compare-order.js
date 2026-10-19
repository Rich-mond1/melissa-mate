/* number-compare-order — compare 3-digit numbers (<, >, =) and put them in order. */
(function(){
  const nk = K.num;
  const LT = '&lt; less than', GT = '&gt; greater than', EQ = '= equal to';
  const SYM = { lt: { k: 'lt', label: LT }, gt: { k: 'gt', label: GT }, eq: { k: 'eq', label: EQ } };
  function val(h, t, o){ return h * 100 + t * 10 + o; }
  function H(n){ return Math.floor(n / 100); }
  function T(n){ return Math.floor(n / 10) % 10; }
  function O(n){ return n % 10; }
  /* independent comparison: 3-digit numbers compare like text */
  function relText(a, b){ const x = String(a), y = String(b); return x === y ? 'eq' : (x < y ? 'lt' : 'gt'); }
  function symChar(k){ return k === 'lt' ? '&lt;' : (k === 'gt' ? '&gt;' : '='); }

  /* pair builders: [a, b, kind, whyWrong] */
  function pairDiffHundreds(){
    let a, b;
    do { a = randInt(100, 999); b = randInt(100, 999); } while(H(a) === H(b));
    return [a, b, 'h'];
  }
  function pairSameHundreds(){
    const h = randInt(1, 9); let t1, t2, o1, o2;
    do { t1 = randInt(0, 9); t2 = randInt(0, 9); } while(t1 === t2);
    o1 = randInt(0, 9); o2 = randInt(0, 9);
    if(chance(0.6)){ // trap: the ones point the other way
      if(t1 < t2){ o1 = randInt(5, 9); o2 = randInt(0, 4); } else { o1 = randInt(0, 4); o2 = randInt(5, 9); }
    }
    return [val(h, t1, o1), val(h, t2, o2), 't'];
  }
  function pairSameHT(){
    const h = randInt(1, 9), t = randInt(0, 9); let o1, o2;
    do { o1 = randInt(0, 9); o2 = randInt(0, 9); } while(o1 === o2);
    return [val(h, t, o1), val(h, t, o2), 'o'];
  }
  function pairSwap(){ // 409 vs 490 : same digits, tens and ones swapped
    const h = randInt(1, 9); let t, o;
    do { t = randInt(0, 9); o = randInt(0, 9); } while(t === o);
    return [val(h, t, o), val(h, o, t), 't'];
  }
  function whyFor(a, b, kind){
    if(kind === 'h') return 'Look at the HUNDREDS first: the hundreds digits are ' + H(a) + ' and ' + H(b) + '. The hundreds decide.';
    if(kind === 't') return 'The hundreds are the same, so look at the TENS next: the tens digits are ' + T(a) + ' and ' + T(b) + '. The tens decide, even if the ones are bigger.';
    return 'The hundreds and tens are the same, so the ONES decide: ' + O(a) + ' against ' + O(b) + '.';
  }
  function compareExplain(a, b, kind, k){
    const steps = [];
    if(kind === 'h') steps.push('Start with the hundreds digits: <b>' + H(a) + '</b> and <b>' + H(b) + '</b>. They are different, so they decide.');
    else if(kind === 't') steps.push('The hundreds are both <b>' + H(a) + '</b>. Move to the tens: <b>' + T(a) + '</b> and <b>' + T(b) + '</b>. They are different, so they decide.');
    else if(kind === 'e') steps.push('Compare the hundreds, the tens and the ones: every digit matches.');
    else steps.push('The hundreds are both <b>' + H(a) + '</b> and the tens are both <b>' + T(a) + '</b>. Look at the ones: <b>' + O(a) + '</b> and <b>' + O(b) + '</b>.');
    steps.push(k === 'eq' ? 'The two numbers are exactly the same.' : (k === 'lt' ? a + ' is the smaller number.' : a + ' is the bigger number.'));
    return steps;
  }

  /* symbol question: "409 [] 490" */
  function qSymbol(pair, three){
    const a = pair[0], b = pair[1], kind = pair[2];
    const k = k0(a, b);
    const ds = [];
    ['lt', 'gt', 'eq'].forEach(function(x){ if(x !== k && (three || x !== 'eq')) ds.push(opt(K.text(x), SYM[x].label, x === 'eq' ? 'These two numbers are different, so they cannot be equal.' : whyFor(a, b, kind))); });
    const st = compareExplain(a, b, kind, k);
    st.push('So the symbol is <b>' + SYM[k].label + '</b>: ' + a + ' ' + symChar(k) + ' ' + b + '. ✅');
    return mcq({
      prompt: 'Which symbol goes in the box?<br><b>' + a + ' ▢ ' + b + '</b>', correct: opt(K.text(k), SYM[k].label), distractors: ds, keepOrder: true, count: three ? 3 : 2,
      hint: 'Compare the hundreds first. If they match, compare the tens, then the ones. The open mouth &gt; or &lt; faces the BIGGER number.',
      explain: ex('Comparing ' + a + ' and ' + b, st), truth: K.text(relText(a, b))
    });
  }
  function k0(a, b){ return a === b ? 'eq' : (a < b ? 'lt' : 'gt'); }

  /* which number is greater / smaller (two numbers) */
  function qWhichOne(pair, wantBigger){
    const a = pair[0], b = pair[1], kind = pair[2];
    const big = Math.max(a, b), small = Math.min(a, b), ans = wantBigger ? big : small, oth = wantBigger ? small : big;
    const k = wantBigger ? 'greater' : 'smaller';
    return mcq2({
      prompt: 'Which number is <b>' + k + '</b>?', correct: opt(nk(ans), String(ans)), other: opt(nk(oth), String(oth), whyFor(a, b, kind)),
      hint: 'Compare the hundreds first. If they are the same, compare the tens, then the ones.',
      explain: ex('Comparing ' + a + ' and ' + b, compareExplain(a, b, kind, a < b ? 'lt' : 'gt').slice(0, 1).concat(['So <b>' + ans + '</b> is the ' + k + ' number. ✅'])),
      truth: nk(Number([String(a), String(b)].sort()[wantBigger ? 1 : 0]))
    });
  }

  /* greatest / smallest of three */
  function qOfThree(wantBigger){
    const base = randInt(1, 8) * 100;
    const set = new Set(); const arr = [];
    const mode = randInt(0, 1);
    while(arr.length < 3){
      const v = mode === 0 ? randInt(100, 999) : base + randInt(0, 99);
      if(!set.has(v)){ set.add(v); arr.push(v); }
    }
    const sorted = arr.slice().sort(function(x, y){ return x - y; });
    const ans = wantBigger ? sorted[2] : sorted[0];
    const word = wantBigger ? 'greatest' : 'smallest';
    const ds = arr.filter(function(v){ return v !== ans; }).map(function(v){ return opt(nk(v), String(v), v + ' is not the ' + word + '. Compare the ' + (mode === 0 ? 'hundreds' : 'tens') + ' first.'); });
    const txt = shuffle(arr).join(', ');
    return mcq({
      prompt: 'Which is the <b>' + word + '</b> number?<br><b>' + txt + '</b>', correct: opt(nk(ans), String(ans)), distractors: ds, count: 3, keepOrder: true,
      hint: 'Compare the hundreds of all three first. If two are the same, look at their tens.',
      explain: ex('Finding the ' + word, ['Smallest to biggest, the numbers go <b>' + sorted.join(', ') + '</b>.', 'So the ' + word + ' is <b>' + ans + '</b>. ✅']),
      truth: nk(Number(arr.map(String).sort()[wantBigger ? 2 : 0]))
    });
  }

  /* partition compared with a number: 300 + 40 + 6 [] 346 */
  function qPartition(){
    const h = randInt(1, 9), t = randInt(0, 9), o = randInt(0, 9);
    const n = val(h, t, o);
    const mode = randInt(0, 3);
    let hh = h, tt = t, oo = o;
    if(mode === 1) { tt = t === 9 ? 8 : t + 1; }
    else if(mode === 2) { const s = tt; tt = oo; oo = s; }
    else if(mode === 3) { hh = h === 9 ? 8 : h + 1; }
    const left = hh * 100 + tt * 10 + oo;
    const parts = [hh * 100]; if(tt) parts.push(tt * 10); if(oo) parts.push(oo);
    const k = k0(left, n);
    const ds = ['lt', 'gt', 'eq'].filter(function(x){ return x !== k; }).map(function(x){ return opt(K.text(x), SYM[x].label, x === 'eq' ? 'Add the parts up: ' + parts.join(' + ') + ' = ' + left + ', which is not ' + n + '.' : 'Add the parts first: ' + parts.join(' + ') + ' = ' + left + '. Then compare ' + left + ' with ' + n + '.'); });
    return mcq({
      prompt: 'Which symbol goes in the box?<br><b>' + parts.join(' + ') + ' ▢ ' + n + '</b>', correct: opt(K.text(k), SYM[k].label), distractors: ds, keepOrder: true, count: 3,
      hint: 'Add the parts to make one number first. Then compare the two numbers, hundreds first.',
      explain: ex('Comparing a sum with ' + n, [parts.join(' + ') + ' = <b>' + left + '</b>.', 'Now compare ' + left + ' and ' + n + (left === n ? ': they are exactly the same.' : '.'), 'The symbol is <b>' + SYM[k].label + '</b>: ' + left + ' ' + symChar(k) + ' ' + n + '. ✅']),
      truth: K.text(relText(Number(parts.reduce(function(s, x){ return s + x; }, 0)), n))
    });
  }

  /* ordering with the interactive 'order' type */
  function qOrder(hard){
    let nums;
    const kind = hard ? randInt(0, 2) : randInt(0, 1);
    const count = hard && chance(0.35) ? 4 : 3;
    if(kind === 0 || !hard && kind === 0){ // different hundreds
      const hs = sample([1, 2, 3, 4, 5, 6, 7, 8, 9], count);
      nums = hs.map(function(h){ return val(h, randInt(0, 9), randInt(0, 9)); });
    } else if(kind === 1){ // permutations of the same digits (traps)
      const ds = sample([0, 1, 2, 3, 4, 5, 6, 7, 8, 9], 3);
      const perms = [[0, 1, 2], [0, 2, 1], [1, 0, 2], [1, 2, 0], [2, 0, 1], [2, 1, 0]];
      const set = {}; nums = [];
      shuffle(perms).forEach(function(p){ const v = val(ds[p[0]], ds[p[1]], ds[p[2]]); if(ds[p[0]] !== 0 && !set[v] && nums.length < count){ set[v] = 1; nums.push(v); } });
      if(nums.length < count) return qOrder(hard);
    } else { // same hundreds, different tens
      const h = randInt(1, 9), ts = sample([0, 1, 2, 3, 4, 5, 6, 7, 8, 9], count);
      nums = ts.map(function(t){ return val(h, t, randInt(0, 9)); });
    }
    const asc = chance(0.5);
    const sortedAsc = nums.map(String).sort();      // text order = number order for 3-digit numbers
    const inOrder = asc ? sortedAsc : sortedAsc.slice().reverse();
    const items = inOrder.map(function(s){ return { key: s, label: s }; });
    const exRaw = asc ? sortedAsc : inOrder;
    return order({
      prompt: 'Put these numbers in order, <b>' + (asc ? 'smallest to largest' : 'largest to smallest') + '</b>. Tap them one at a time.', items: items,
      hint: 'Find the ' + (asc ? 'smallest' : 'largest') + ' first. Compare the hundreds, then the tens, then the ones.',
      explain: ex('Putting numbers in order', ['Compare the hundreds first. If two match, compare the tens, then the ones.', 'From ' + (asc ? 'smallest to largest' : 'largest to smallest') + ' they go: <b>' + inOrder.join(', ') + '</b>. ✅']),
      truth: 'o:' + inOrder.join('|')
    });
  }

  /* typed: digit puzzle */
  function qDigitPuzzle(){
    const h = randInt(1, 9), tm = randInt(1, 8);
    let o, om; do { o = randInt(0, 9); om = randInt(0, 9); } while(o === om);
    const gt = chance(0.5);
    const mid = val(h, tm, om);
    const pattern = h + '▢' + o;
    // brute force the answer
    const goodDigits = [];
    for(let d = 0; d <= 9; d++){ const v = val(h, d, o); if(gt ? v > mid : v < mid) goodDigits.push(d); }
    const ans = gt ? goodDigits[0] : goodDigits[goodDigits.length - 1];
    const word = gt ? 'smallest' : 'greatest';
    const formula = gt ? (o > om ? tm : tm + 1) : (o < om ? tm : tm - 1);
    const st = [
      'The hundreds are both ' + h + ', so the TENS decide first.',
      gt ? 'Try ' + tm + ' in the tens: ' + h + tm + o + ' ' + (o > om ? 'is bigger than' : 'is not bigger than') + ' ' + mid + ' ' + (o > om ? '(the ones ' + o + ' beat ' + om + ').' : '(the ones ' + o + ' do not beat ' + om + ').') : 'Try ' + tm + ' in the tens: ' + h + tm + o + ' ' + (o < om ? 'is smaller than' : 'is not smaller than') + ' ' + mid + ' ' + (o < om ? '(the ones ' + o + ' are less than ' + om + ').' : '(the ones ' + o + ' are not less than ' + om + ').'),
      'So the ' + word + ' digit that works is <b>' + ans + '</b>. ✅'
    ];
    return numeric({
      prompt: 'What is the <b>' + word + '</b> digit that makes this true?<br><b>' + pattern + ' ' + (gt ? '&gt;' : '&lt;') + ' ' + mid + '</b>', answer: ans,
      hint: 'The hundreds match, so look at the tens. Try the tens digit from ' + mid + ' first. Does it work with the ones?',
      explain: ex('The missing digit', st), truth: ans === formula ? ans : -999,
      wrong: function(v){ return v === tm ? 'Try ' + h + v + o + ' against ' + mid + ': check the ones digit too.' : ''; }
    });
  }

  /* typed: smallest / greatest number from digits */
  function qDigitsNumber(){
    const useZero = chance(0.55), wantBig = chance(0.5);
    let ds;
    do { ds = sample([0, 1, 2, 3, 4, 5, 6, 7, 8, 9], 3); } while((ds.indexOf(0) >= 0) !== useZero);
    // brute force over arrangements
    const perms = [[0, 1, 2], [0, 2, 1], [1, 0, 2], [1, 2, 0], [2, 0, 1], [2, 1, 0]];
    const all = perms.map(function(p){ return [ds[p[0]], ds[p[1]], ds[p[2]]]; }).filter(function(a){ return a[0] !== 0; }).map(function(a){ return val(a[0], a[1], a[2]); });
    const ans = wantBig ? Math.max.apply(null, all) : Math.min.apply(null, all);
    const sortedDs = ds.slice().sort(function(a, b){ return a - b; });
    let built;
    if(wantBig) built = sortedDs.slice().reverse(); else { built = sortedDs.slice(); if(built[0] === 0){ built[0] = built[1]; built[1] = 0; } }
    const word = wantBig ? 'greatest' : 'smallest';
    const naive = Number(sortedDs.join(''));
    return numeric({
      prompt: 'Use the digits <b>' + shuffle(ds).join(', ') + '</b> once each. Make the <b>' + word + '</b> 3-digit number you can.', answer: ans,
      hint: wantBig ? 'Put the biggest digit in the hundreds place, then the next biggest in the tens.' : 'Put the smallest digit you can in the hundreds place, then the next smallest in the tens. A 3-digit number cannot start with 0.',
      explain: ex('Making the ' + word + ' number', wantBig ? ['The place with the most value is the hundreds, so give it the biggest digit.', 'Then the next biggest, then the last.', 'The ' + word + ' number is <b>' + ans + '</b>. ✅'] : ['The hundreds place matters most, so it needs the smallest digit' + (useZero ? ' that is not 0 (a 3-digit number cannot start with 0)' : '') + '.', 'Then put the next smallest in the tens, and the last in the ones.', 'The ' + word + ' number is <b>' + ans + '</b>. ✅']),
      truth: Number(built.join('')),
      wrong: function(v){ return (!wantBig && useZero && v === naive) ? 'That starts with 0, so it is only a 2-digit number. Put the smallest digit that is not 0 in the hundreds.' : ''; }
    });
  }

  /* which number lies between */
  function qBetween(){
    const h = randInt(1, 9);
    const a = val(h, randInt(0, 4), randInt(0, 9)), b = a + randInt(25, 49);
    const x = randInt(a + 1, b - 1);
    const lowWhy = 'That is smaller than ' + a + ', so it is not between the two numbers.';
    const opts = [opt(nk(a - 1), String(a - 1), lowWhy), opt(nk(b + 1), String(b + 1), 'That is bigger than ' + b + ', so it is not between the two numbers.'), opt(nk(a), String(a), 'Between means not the same as ' + a + '. It must be bigger than ' + a + '.'), opt(nk(b), String(b), 'Between means not the same as ' + b + '. It must be smaller than ' + b + '.')];
    const ds2 = opts;
    return mcq({
      prompt: 'Which number is <b>between</b> ' + a + ' and ' + b + '?', correct: opt(nk(x), String(x)), distractors: ds2, keepOrder: false, count: 4,
      hint: 'The number must be bigger than ' + a + ' and smaller than ' + b + '. Test each choice against both.',
      explain: ex('Between ' + a + ' and ' + b, [x + ' is bigger than ' + a + ' ✔ and smaller than ' + b + ' ✔.', 'The other choices are too small, too big, or one of the end numbers.', 'So the answer is <b>' + x + '</b>. ✅']),
      truth: nk([a, x, b].map(String).sort()[1] === String(x) ? x : -1)
    });
  }

  registerSkill({
    id: 'number-compare-order', strand: 'number', name: 'Comparing & ordering', emoji: '🐊', year: 3, order: 120, prereq: ['number-place-value'],
    lesson: {
      title: 'Which number is bigger?',
      steps: [
        { say: 'On a number line, numbers get <b>bigger</b> as you go <b>right</b>. Here <b>409</b> is to the left of <b>490</b>, so 409 is the smaller number.', vis: { kind: 'numberLine', args: [{ min: 400, max: 500, minor: 10, major: 50, marks: [{ value: 409 }, { value: 490, color: '#9B51E0' }] }] } },
        { say: 'To compare, start at the <b>hundreds</b>, the most important column. <b>345</b> has 3 hundreds, <b>253</b> has only 2. So <b>345 is bigger</b>.', vis: { kind: 'baseTen', args: [3, 4, 5] },
          quiz: { prompt: 'Which is bigger, 472 or 389?', options: [{ label: '472', ok: true }, { label: '389', ok: false }], right: 'Yes! 4 hundreds beat 3 hundreds.', wrong: 'Look at the hundreds first: 4 hundreds is more than 3 hundreds, so 472 is bigger.' } },
        { say: 'Same hundreds? Look at the <b>tens</b>. <b>409</b> and <b>490</b> both have 4 hundreds. Tens: 0 and 9. So <b>490 is bigger</b>, even though 409 has a 9 at the end!', vis: { kind: 'baseTen', args: [4, 0, 9] },
          quiz: { prompt: 'Which is smaller, 538 or 583?', options: [{ label: '538', ok: true }, { label: '583', ok: false }], right: 'Yes! Tens: 3 is less than 8.', wrong: 'Same hundreds, so compare tens: 3 tens is less than 8 tens, so 538 is smaller.' } },
        { say: 'The symbols <b>&lt;</b> and <b>&gt;</b> are like a hungry crocodile. Its mouth opens towards the <b>bigger</b> number. 409 &lt; 490, and 490 &gt; 409. If they are the same, we write <b>=</b>.', vis: { kind: 'numberLine', args: [{ min: 400, max: 500, minor: 10, major: 50, marks: [{ value: 409 }, { value: 490, color: '#9B51E0' }] }] },
          quiz: { prompt: 'Which symbol goes in the box? 620 ▢ 602', options: [{ label: '&lt; (less than)', ok: false }, { label: '&gt; (greater than)', ok: true }, { label: '= (equal to)', ok: false }], right: 'Yes! Tens: 2 is more than 0, so 620 &gt; 602.', wrong: 'Same hundreds, so compare tens: 2 tens is more than 0 tens. 620 is bigger, so 620 &gt; 602.' } },
        { say: 'To <b>put numbers in order</b>, find the smallest first, then the next one. Order <b>325, 253, 235</b> from smallest: 235, 253, 325.', vis: { kind: 'numberLine', args: [{ min: 200, max: 400, minor: 10, major: 50, marks: [{ value: 235 }, { value: 253, color: '#9B51E0' }, { value: 325, color: '#F2994A' }] }] },
          quiz: { prompt: 'Which is the smallest: 614, 641 or 461?', options: [{ label: '614', ok: false }, { label: '641', ok: false }, { label: '461', ok: true }], right: 'Yes! 4 hundreds is the least.', wrong: '461 has only 4 hundreds, the other two have 6. So 461 is the smallest.' } }
      ]
    },
    trick: {
      title: 'Hunt for the first difference',
      say: 'Line the numbers up and read them <b>from the left</b>. Cross out every column where the digits match. The <b>first column that is different</b> decides which number is bigger. The crocodile’s mouth opens to the bigger one!',
      vis: { kind: 'baseTen', args: [4, 9, 0] },
      example: '<b>409</b> and <b>490</b>: the 4s match, so skip them. First difference: tens, 0 and 9. 9 is more, so <b>490 &gt; 409</b>.'
    },
    gen: {
      1: function(){
        switch(randInt(0, 3)){
          case 0: return qWhichOne(pairDiffHundreds(), true);
          case 1: return qWhichOne(pairDiffHundreds(), false);
          case 2: return qSymbol(pairDiffHundreds(), false);
          default: return qOfThreeDiffHundreds();
        }
      },
      2: function(){
        switch(randInt(0, 5)){
          case 0: return qSymbol(pickTrap(), true);
          case 1: return qSymbol(pickTrap(), true);
          case 2: return qWhichOne(pickTrap(), chance(0.5));
          case 3: return qOfThree(chance(0.5));
          case 4: return qPartition();
          default: return qOrder(false);
        }
      },
      3: function(){
        switch(randInt(0, 6)){
          case 0: return qOrder(true);
          case 1: return qOrder(true);
          case 2: return qDigitPuzzle();
          case 3: return qDigitsNumber();
          case 4: return qBetween();
          case 5: return qSymbol(chance(0.25) ? [345, 345, 'e'] : pickTrap(), true);
          default: return qPartition();
        }
      }
    }
  });

  function pickTrap(){
    const r = randInt(0, 3);
    if(r === 0) return pairSwap();
    if(r === 1) return pairSameHT();
    return pairSameHundreds();
  }
  function qOfThreeDiffHundreds(){
    const hs = sample([1, 2, 3, 4, 5, 6, 7, 8, 9], 3), arr = hs.map(function(h){ return val(h, randInt(0, 9), randInt(0, 9)); });
    const wantBigger = chance(0.5);
    const sorted = arr.slice().sort(function(x, y){ return x - y; });
    const ans = wantBigger ? sorted[2] : sorted[0], word = wantBigger ? 'greatest' : 'smallest';
    const ds = arr.filter(function(v){ return v !== ans; }).map(function(v){ return opt(nk(v), String(v), v + ' is not the ' + word + '. Compare the hundreds: ' + arr.map(H).join(', ') + '.'); });
    return mcq({
      prompt: 'Which is the <b>' + word + '</b> number?<br><b>' + shuffle(arr).join(', ') + '</b>', correct: opt(nk(ans), String(ans)), distractors: ds, count: 3, keepOrder: true,
      hint: 'Look at the hundreds digit of each number. Which has the ' + (wantBigger ? 'most' : 'fewest') + ' hundreds?',
      explain: ex('Finding the ' + word, ['The hundreds are ' + arr.map(H).join(', ') + '.', 'The ' + word + ' is the one with ' + (wantBigger ? 'the most' : 'the fewest') + ' hundreds: <b>' + ans + '</b>. ✅']),
      truth: nk(Number(arr.map(String).sort()[wantBigger ? 2 : 0]))
    });
  }
})();
