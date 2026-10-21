/* number-decimals — Year 4: tenths and hundredths as decimals, hundred square, place value, comparing, ordering, money. */
(function(){
  const NAMES = ['Ana', 'Marcus', 'Sophie', 'Ivan', 'Lucy', 'Diego', 'Ellen', 'Tom', 'Aisha', 'Kai', 'Mei', 'Leo'];
  /* all arithmetic is in HUNDREDTHS (whole numbers); dec() only formats */
  function dec(h){ const w = Math.floor(h / 100), f = h % 100; if(f === 0) return String(w); const fs = (f < 10 ? '0' : '') + f; return w + '.' + fs.replace(/0$/, ''); }
  function val(h){ return Math.round(h) / 100; }                 // numeric value for typed answers
  /* the picture: a 10 × 10 square; shaded cells are <rect class="hs">, unshaded <rect class="hu"> */
  function hundredRender(n, byColumns){
    let s = '';
    for(let i = 0; i < 100; i++){
      const r = Math.floor(i / 10), c = i % 10, shaded = byColumns ? (c < Math.floor(n / 10)) || (c === Math.floor(n / 10) && r < n % 10) : i < n;
      s += '<rect class="' + (shaded ? 'hs' : 'hu') + '" x="' + (6 + c * 20) + '" y="' + (6 + r * 20) + '" width="20" height="20" fill="' + (shaded ? '#8EC5FF' : '#FFFFFF') + '" stroke="#1B1B2F" stroke-width="1.2"/>';
    }
    return '<svg viewBox="0 0 212 212" width="190" role="img" style="max-width:100%;height:auto;display:block;margin:0 auto" xmlns="http://www.w3.org/2000/svg">' + s + '<rect x="6" y="6" width="200" height="200" fill="none" stroke="#1B1B2F" stroke-width="2.5"/></svg>';
  }
  function hundredDecode(html){ return (html.match(/class="hs"/g) || []).length; }
  V.extra.hundred = { render: hundredRender, verify: function(a, html){ return hundredDecode(html) === a[0] && (html.match(/<rect class="h[su]"/g) || []).length === 100 ? '' : 'hundred square draws ' + hundredDecode(html) + ' not ' + a[0]; } };
  function hq(n, col){ return hundredRender(n, col); }
  function lineTenths(t){ return V.numberLine({ min: 0, max: 1, minor: 0.1, major: 0.5, width: 320, labels: function(v){ return v === 0 ? '0' : v === 1 ? '1' : '0.5'; }, marks: [{ value: t / 10 }] }); }

  /* ---- tier 1 ---- */
  function qReadSquare(){
    const col = chance(0.5), n = col ? randInt(1, 9) * 10 : randInt(1, 99), vis = hq(n, col && n % 10 === 0);
    return mcqNum({ prompt: 'The whole square is <b>1</b>. What decimal is shaded?', visual: vis, answer: n, fmt: dec,
      wrong: [{ v: n % 10 === 0 ? n / 10 : Math.floor(n / 10) + (n % 10) * 10, why: n % 10 === 0 ? 'There are ' + n + ' shaded squares out of 100, which is ' + dec(n) + ', not ' + dec(n / 10) + '.' : 'Count the shaded squares: ' + n + ' out of 100 is ' + dec(n) + '.' }, { v: n * 10 > 99 ? n + 100 : n * 10, why: 'That is too big. The whole square is 1, and ' + n + ' hundredths is ' + dec(n) + '.' }, { v: n + 10, why: 'Count the shaded squares again.' }, { v: n - 1 > 0 ? n - 1 : n + 2, why: 'Count the shaded squares again.' }],
      nearby: [1, -1, 10, -10, 5, -5], valid: function(v){ return v > 0 && v <= 120; }, count: 4, hint: 'Count the shaded squares. Each square is one hundredth (0.01).',
      explain: ex('Reading the hundred square', ['There are <b>' + n + '</b> shaded squares out of 100.', n + ' hundredths = <b>' + dec(n) + '</b>. ✅']), truth: n, decode: function(){ return hundredDecode(vis); } });
  }
  function qFracToDec(){
    const den = pick([10, 100]), num = den === 10 ? randInt(1, 9) : randInt(1, 99), h = den === 10 ? num * 10 : num, f = num + '/' + den;
    return mcqNum({ prompt: 'Which decimal is the same as <b>' + num + '⁄' + den + '</b>?', answer: h, fmt: dec,
      wrong: [{ v: den === 10 ? num : num * 10 > 99 ? num + 10 : num * 10, why: den === 10 ? num + '⁄10 is ' + num + ' tenths = ' + dec(h) + ', not ' + dec(num) + '.' : num + '⁄100 is ' + num + ' hundredths = ' + dec(h) + '.' }, { v: den === 10 ? h / 10 || h + 5 : h + 10, why: 'Tenths are the first digit after the point; hundredths are the second.' }, { v: h + 1, why: 'Say it as ' + num + ' ' + (den === 10 ? 'tenths' : 'hundredths') + ' and write it in the matching place.' }, { v: h > 10 ? h - 10 : h + 20, why: 'Say it as ' + num + ' ' + (den === 10 ? 'tenths' : 'hundredths') + '.' }],
      nearby: [1, -1, 10, -10, 5], valid: function(v){ return v > 0 && v <= 120; }, count: 4, hint: 'Tenths go in the first place after the point, hundredths in the second.',
      explain: ex('Fractions as decimals', [num + '⁄' + den + ' means ' + num + ' ' + (den === 10 ? 'tenths' : 'hundredths') + '.', den === 10 ? '1 tenth = 0.1, so ' + num + ' tenths = <b>' + dec(h) + '</b>. ✅' : '1 hundredth = 0.01, so ' + num + ' hundredths = <b>' + dec(h) + '</b>. ✅']), truth: num * (100 / den) });
  }
  function qDigitValue(){
    const t = randInt(1, 9), u = randInt(1, 9), n = 10 * t + u, askT = chance(0.5), ans = askT ? t * 10 : u, d = askT ? t : u;
    return mcqNum({ prompt: 'In <b>' + dec(n) + '</b>, what is the value of the digit <b>' + d + '</b> in the ' + (askT ? 'tenths' : 'hundredths') + ' place?', answer: ans, fmt: dec,
      wrong: [{ v: askT ? u : t * 10, why: askT ? 'That is the other digit (' + u + ' hundredths). The tenths digit is ' + t + '.' : 'That is the tenths digit. The hundredths digit is ' + u + '.' }, { v: askT ? t : u * 10, why: askT ? t + ' is in the tenths place: ' + t + ' tenths = ' + dec(t * 10) + '.' : u + ' is in the hundredths place: ' + dec(u) + '.' }, { v: ans === 100 ? 90 : ans * 10 > 99 ? ans + 10 : ans * 10, why: 'Check the place: tenths are 0.1, hundredths are 0.01.' }],
      nearby: [1, -1, 10, -10], valid: function(v){ return v > 0 && v <= 120; }, count: 4, hint: 'First place after the point = tenths. Second place = hundredths.',
      explain: ex('Decimal place value', [dec(n) + ' has <b>' + t + ' tenths</b> and <b>' + u + ' hundredths</b>.', 'The ' + d + ' in the ' + (askT ? 'tenths' : 'hundredths') + ' place is worth <b>' + dec(ans) + '</b>. ✅']), truth: askT ? Math.floor(n / 10) * 10 : n % 10 });
  }
  /* ---- tier 2 ---- */
  function qCompare(){
    const a = randInt(1, 99); let b; do { b = randInt(1, 99); } while(b === a);
    const big = Math.max(a, b), sm = Math.min(a, b), askBig = chance(0.5);
    return mcq2({ prompt: 'Which is <b>' + (askBig ? 'greater' : 'smaller') + '</b>: <b>' + dec(a) + '</b> or <b>' + dec(b) + '</b>?', correct: opt(K.num(askBig ? big : sm), dec(askBig ? big : sm), 'Compare tenths first, then hundredths.'), other: opt(K.num(askBig ? sm : big), dec(askBig ? sm : big), 'Compare the tenths digit first. More digits does not mean a bigger number.'),
      hint: 'Compare the tenths first. If they match, compare the hundredths.', explain: ex('Comparing decimals', ['Line them up by place: ' + dec(a) + ' and ' + dec(b) + ' as hundredths are ' + a + ' and ' + b + '.', 'The ' + (askBig ? 'greater' : 'smaller') + ' one is <b>' + dec(askBig ? big : sm) + '</b>. ✅']), truth: K.num(askBig ? Math.max(a, b) : Math.min(a, b)) });
  }
  function qOrder(){
    const set = {}; const nums = []; while(nums.length < 4){ const n = randInt(1, 99); if(!set[n]){ set[n] = 1; nums.push(n); } }
    const asc = chance(0.5), sorted = nums.slice().sort(function(x, y){ return x - y; }), ord = asc ? sorted : sorted.slice().reverse();
    return order({ prompt: 'Put these decimals in order, <b>' + (asc ? 'smallest to largest' : 'largest to smallest') + '</b>. Tap them one at a time.', items: ord.map(function(n){ return { key: String(n), label: dec(n) }; }),
      hint: 'Compare the tenths first. 0.4 is bigger than 0.35 because 4 tenths is more than 3 tenths.', explain: ex('Ordering decimals', ['Compare the tenths digit first, then the hundredths.', 'In order: <b>' + ord.map(dec).join(', ') + '</b>. ✅']), truth: 'o:' + ord.join('|') });
  }
  function qLine(){
    const t = randInt(1, 9), vis = lineTenths(t);
    return mcqNum({ prompt: 'Which decimal does the red dot show?', visual: vis, answer: t * 10, fmt: dec,
      wrong: [{ v: t, why: 'The dot is at ' + t + ' tenths = ' + dec(t * 10) + ', not ' + dec(t) + ' (that is ' + t + ' hundredths).' }, { v: (10 - t) * 10, why: 'Count the steps from 0, not from 1.' }, { v: t * 10 + 10, why: 'Count the steps from 0 again.' }, { v: t * 10 - 10 > 0 ? t * 10 - 10 : t * 10 + 20, why: 'Count the steps from 0 again.' }],
      nearby: [10, -10, 5], valid: function(v){ return v > 0 && v <= 120; }, count: 4, hint: 'There are 10 equal steps from 0 to 1. Each step is 0.1.',
      explain: ex('Tenths on a line', ['0 to 1 is split into 10 equal steps. Each step is 0.1.', 'The dot is ' + nnoun(t, 'steps') + ' along: <b>' + dec(t * 10) + '</b>. ✅']), truth: t * 10, decode: function(){ return Math.round(V.decodeNumberLine(vis) * 100); } });
  }
  function qMoney(){
    const p = randInt(105, 899), pounds = Math.floor(p / 100), pence = p % 100;
    return mcqNum({ prompt: '<b>' + p + 'p</b> is how many pounds? (£1 = 100p)', answer: p, fmt: function(v){ return '£' + (Math.floor(v / 100)) + '.' + (v % 100 < 10 ? '0' : '') + (v % 100); },
      wrong: [{ v: pounds * 100 + (pence < 10 ? pence * 10 : Math.floor(pence / 10)), why: 'Pence need two digits after the point: ' + pence + 'p is £0.' + (pence < 10 ? '0' : '') + pence + '.' }, { v: pence * 100 + pounds, why: 'Pounds come before the point, pence after.' }, { v: p + 100, why: 'Divide the pence by 100 to get pounds.' }, { v: p - 100, why: 'Divide the pence by 100 to get pounds.' }],
      nearby: [1, -1, 10, -10], valid: function(v){ return v > 100; }, count: 4, hint: '100p make £1. The pounds go before the point, the leftover pence after it.',
      explain: ex('Pence to pounds', [p + 'p = ' + nnoun(pounds, 'pounds') + ' and ' + pence + ' pence.', 'As pounds: <b>£' + pounds + '.' + (pence < 10 ? '0' : '') + pence + '</b>. ✅']), truth: pounds * 100 + pence });
  }
  /* ---- tier 3: typed ---- */
  function qHundredthsTyped(){
    const n = randInt(11, 99);
    return numeric({ prompt: 'How many <b>hundredths</b> are in <b>' + dec(n) + '</b>? Type the number.', answer: n, hint: dec(n) + ' = ' + n + '⁄100.',
      explain: ex('Counting hundredths', [dec(n) + ' = ' + Math.floor(n / 10) + (Math.floor(n / 10) === 1 ? ' tenth' : ' tenths') + ' and ' + (n % 10) + (n % 10 === 1 ? ' hundredth.' : ' hundredths.'), 'One tenth is 10 hundredths, so that is <b>' + n + '</b> hundredths. ✅']), truth: Math.floor(n / 10) * 10 + n % 10 });
  }
  function qTenthMore(){
    const t = randInt(1, 8), more = chance(0.5), n = t * 10 + (chance(0.5) ? randInt(1, 9) : 0), ans = more ? n + 10 : n - 10;
    if(ans <= 0) return qTenthMore();
    return numeric({ prompt: 'What is <b>0.1 ' + (more ? 'more' : 'less') + '</b> than <b>' + dec(n) + '</b>? Type the answer.', answer: val(ans), hint: '0.1 is one tenth. Only the tenths digit changes.',
      explain: ex('One tenth ' + (more ? 'more' : 'less'), ['Only the tenths digit changes by 1.', dec(n) + (more ? ' + 0.1 = ' : ' − 0.1 = ') + '<b>' + dec(ans) + '</b>. ✅']), truth: (more ? n + 10 : n - 10) / 100 });
  }
  function qAddTenths(){
    const a = randInt(1, 8), b = randInt(1, 9 - 0), sum = a + b, who = pick(NAMES);
    return numeric({ prompt: who + ' adds <b>' + dec(a * 10) + ' + ' + dec(b * 10) + '</b>. What is the total? Type it.', answer: val(sum * 10), hint: 'Add the tenths: ' + a + ' tenths + ' + b + ' tenths. If you get 10 tenths, that makes 1.',
      explain: ex('Adding tenths', [a + ' tenths + ' + b + ' tenths = ' + sum + ' tenths.', sum >= 10 ? sum + ' tenths = ' + (sum === 10 ? '1' : '1 and ' + (sum - 10) + ' tenths') + ', which is <b>' + dec(sum * 10) + '</b>. ✅' : '<b>' + dec(sum * 10) + '</b>. ✅']), truth: (a * 10 + b * 10) / 100 });
  }
  function qMissingTo1(){
    const n = randInt(1, 9) * 10 + (chance(0.5) ? randInt(1, 9) : 0), ans = 100 - n;
    return numeric({ prompt: 'Type the missing number:  <b>' + dec(n) + ' + ▢ = 1</b>', answer: val(ans), hint: 'How much more do you need to reach 1? Think in hundredths: 100 − ' + n + '.',
      explain: ex('Making 1', [dec(n) + ' is ' + n + ' hundredths. 1 is 100 hundredths.', '100 − ' + n + ' = ' + ans + ' hundredths = <b>' + dec(ans) + '</b>. ✅', 'Check: ' + dec(n) + ' + ' + dec(ans) + ' = 1.']), truth: (100 - n) / 100 });
  }
  function qMoneyTyped(){
    const p = randInt(2, 9), c = randInt(5, 95), tot = p * 100 + c;
    return numeric({ prompt: 'A toy costs <b>£' + p + '.' + (c < 10 ? '0' : '') + c + '</b>. How many <b>pence</b> is that? Type the number.', answer: tot, hint: '£1 = 100p. Multiply the pounds by 100 and add the pence.',
      explain: ex('Pounds to pence', [p + ' pounds = ' + p * 100 + 'p.', p * 100 + ' + ' + c + ' = <b>' + tot + 'p</b>. ✅']), truth: p * 100 + c });
  }
  const T1 = hq(30, true), T2 = hq(45, false);
  registerSkill({
    id: 'number-decimals', strand: 'number', name: 'Tenths, hundredths and decimals', emoji: '🔸', year: 4, order: 205, prereq: ['frac-tenths', 'number-place-value'],
    lesson: { title: 'Decimals: tenths and hundredths', steps: [
      { say: 'This square is split into <b>100</b> small squares. 30 are shaded: that is <b>30 hundredths</b>, or <b>3 tenths</b>, written <b>0.3</b>.', vis: { kind: 'hundred', args: [30] } },
      { say: '<b>One tenth = 0.1</b> and <b>one hundredth = 0.01</b>. The first digit after the decimal point is tenths; the second is hundredths. 45 squares shaded = 4 tenths + 5 hundredths = <b>0.45</b>.', vis: { kind: 'hundred', args: [45] },
        quiz: { prompt: 'What decimal is 7 hundredths?', options: [{ label: '0.07', ok: true }, { label: '0.7', ok: false }, { label: '7.0', ok: false }], right: 'Yes! Hundredths use the SECOND place: 0.07.', wrong: '7 tenths is 0.7. 7 hundredths is 0.07.' } },
      { say: 'To compare decimals, look at the <b>tenths first</b>. 0.4 is greater than 0.35, because 4 tenths is more than 3 tenths. £2.45 means 2 pounds and 45 pence; 245p is the same money.', vis: { kind: 'hundred', args: [40] },
        quiz: { prompt: 'Which is greater: 0.6 or 0.58?', options: [{ label: '0.6', ok: true }, { label: '0.58', ok: false }], right: 'Yes! 6 tenths beats 5 tenths.', wrong: '0.6 = 60 hundredths, and 0.58 = 58 hundredths. So 0.6 is greater.' } }
    ] },
    trick: { title: 'Tenths then hundredths', say: 'After the point, the <b>first</b> digit is <b>tenths</b> and the <b>second</b> is <b>hundredths</b>. Compare <b>tenths first</b>. 10 hundredths make 1 tenth, and 10 tenths make 1.', vis: { kind: 'hundred', args: [25] }, example: '0.25 = 2 tenths + 5 hundredths = 25 hundredths &nbsp;·&nbsp; <b>0.4 &gt; 0.35</b>' },
    gen: {
      1: function(){ return pick([qReadSquare, qReadSquare, qFracToDec, qDigitValue])(); },
      2: function(){ return pick([qCompare, qCompare, qOrder, qLine, qMoney, qDigitValue, qFracToDec])(); },
      3: function(){ return pick([qHundredthsTyped, qTenthMore, qTenthMore, qAddTenths, qMissingTo1, qMoneyTyped, qOrder])(); }
    }
  });
})();
