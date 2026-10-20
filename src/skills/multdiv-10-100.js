/* multdiv-10-100 — multiply and divide whole numbers by 10 and 100 (Year 4 bridge): digits move, they do not "get a zero stuck on". */
(function(){
  const NAMES = ['Ana', 'Marcus', 'Sophie', 'Ivan', 'Lucy', 'Diego', 'Ellen', 'Tom', 'Aisha', 'Kai', 'Mei', 'Leo'];
  /* independent truths: repeated addition and counting groups */
  function times(n, k){ let s = 0; for(let i = 0; i < k; i++) s += n; return s; }
  function share(n, k){ let q = 0; while(q * k < n) q++; return q * k === n ? q : -1; }
  function dig(n){ return String(n).length; }
  function pl(k){ return k === 10 ? 'tens' : 'hundreds'; }

  function mulWrongs(n, k){
    const ans = n * k, w = [];
    w.push({ v: n + k, why: 'Multiplying by ' + k + ' makes it ' + k + ' times BIGGER, not ' + k + ' more. Each digit moves ' + (k === 10 ? 'one place' : 'two places') + ' left.' });
    w.push({ v: k === 10 ? n * 100 : n * 10, why: k === 10 ? 'That moves the digits TWO places (×100). For ×10 they move ONE place.' : 'That moves the digits only ONE place (×10). For ×100 they move TWO places.' });
    w.push({ v: n * 1000, why: 'Too many zeros. Count the places the digits move.' });
    w.push({ v: n * k + k, why: 'Just ' + n + ' × ' + k + ' = ' + ans + '. Nothing is added afterwards.' });
    w.push({ v: n, why: 'Multiplying by ' + k + ' changes the number: it becomes ' + k + ' times bigger.' });
    return w;
  }
  function divWrongs(n, k){
    const ans = n / k, w = [];
    w.push({ v: n - k, why: 'Dividing by ' + k + ' makes it ' + k + ' times SMALLER, not ' + k + ' less. Each digit moves ' + (k === 10 ? 'one place' : 'two places') + ' right.' });
    w.push({ v: k === 10 ? n / 100 : n / 10, why: k === 10 ? 'That is ÷100. For ÷10 the digits move ONE place.' : 'That is ÷10. For ÷100 the digits move TWO places.' });
    w.push({ v: n * k, why: 'That multiplies. Dividing makes the number smaller.' });
    w.push({ v: ans * 10, why: 'Check: ' + ans * 10 + ' × ' + k + ' is not ' + n + '.' });
    w.push({ v: ans + 1, why: 'Check: ' + (ans + 1) + ' × ' + k + ' = ' + (ans + 1) * k + ', not ' + n + '.' });
    return w;
  }
  function pickMul(k){ return k === 10 ? randInt(2, 99) : randInt(2, 99); }
  function pickDiv(k){ return randInt(2, k === 10 ? 99 : 99) * k; }

  /* ---- tier 1: pictures ---- */
  function qTensFlats(){
    const t = randInt(2, 9), vis = V.baseTen(0, t, 0), n = t * 10;
    return mcqNum({
      prompt: 'This picture shows <b>' + n + '</b>. Swap every ten-rod for a hundred-flat. That makes the number <b>10 times bigger</b>. What number is it now?', visual: vis, answer: n * 10,
      wrong: [{ v: n + 10, why: '10 times bigger is not 10 more. Each rod (10) becomes a flat (100).' }, { v: t * 100 / 10, why: 'That is the same number. Each ten (10) becomes a hundred (100).' }, { v: t * 1000, why: 'Too big. ' + t + ' flats make ' + t * 100 + '.' }, { v: n * 100, why: 'Too big. Each rod becomes ONE flat (100).' }],
      nearby: [100, -100, 10], valid: function(v){ return v > 0; }, count: 3, hint: 'One flat is 100. How many flats do you get?',
      explain: ex('×10 moves digits one place left', [n + ' is <b>' + t + ' tens</b>.', 'Swap each ten (10) for a hundred (100): <b>' + t + ' hundreds</b>.', n + ' × 10 = <b>' + n * 10 + '</b>. ✅']),
      truth: times(t * 10, 10), decode: function(){ return times(V.decodeBaseTen(vis), 10); }
    });
  }
  function qFlatsTens(){
    const h = randInt(2, 9), vis = V.baseTen(h, 0, 0), n = h * 100;
    return mcqNum({
      prompt: 'This picture shows <b>' + n + '</b>. Swap every hundred-flat for ten-rods. That makes the number <b>10 times smaller</b>. What number is it now?', visual: vis, answer: n / 10,
      wrong: [{ v: n - 10, why: '10 times smaller is not 10 less. Each flat (100) becomes a rod (10).' }, { v: n / 100, why: 'Too small. Each flat becomes ONE rod (10).' }, { v: h, why: h + ' is the number of flats. Each flat becomes a rod worth 10.' }, { v: n * 10, why: 'That is bigger. Dividing makes the number smaller.' }],
      nearby: [10, -10, 100], valid: function(v){ return v > 0; }, count: 3, hint: 'One rod is 10. How many rods do you get?',
      explain: ex('÷10 moves digits one place right', [n + ' is <b>' + h + ' hundreds</b>.', 'Swap each hundred (100) for a ten (10): <b>' + h + ' tens</b>.', n + ' ÷ 10 = <b>' + n / 10 + '</b>. ✅']),
      truth: share(n, 10), decode: function(){ return share(V.decodeBaseTen(vis), 10); }
    });
  }
  /* ---- tier 1/2: choose ---- */
  function qMul(){
    const k = pick([10, 10, 100]), n = pickMul(k);
    return mcqNum({
      prompt: 'What is <b>' + n + ' × ' + k + '</b>?', answer: n * k, wrong: mulWrongs(n, k), nearby: [10, -10, 100], valid: function(v){ return v > 0; }, count: 4,
      hint: 'Every digit moves ' + (k === 10 ? 'ONE place' : 'TWO places') + ' to the left.',
      explain: ex('Multiplying by ' + k, ['Each digit moves <b>' + (k === 10 ? 'one place' : 'two places') + ' left</b>.', 'Zeros fill the empty places.', n + ' × ' + k + ' = <b>' + n * k + '</b>. ✅']), truth: times(n, k)
    });
  }
  function qDiv(){
    const k = pick([10, 10, 100]), n = pickDiv(k);
    return mcqNum({
      prompt: 'What is <b>' + n + ' ÷ ' + k + '</b>?', answer: n / k, wrong: divWrongs(n, k), nearby: [1, -1, 10], valid: function(v){ return v > 0; }, count: 4,
      hint: 'Every digit moves ' + (k === 10 ? 'ONE place' : 'TWO places') + ' to the right.',
      explain: ex('Dividing by ' + k, ['Each digit moves <b>' + (k === 10 ? 'one place' : 'two places') + ' right</b>.', n + ' ÷ ' + k + ' = <b>' + n / k + '</b>. ✅', 'Check: ' + n / k + ' × ' + k + ' = ' + n + '.']), truth: share(n, k)
    });
  }
  function qWhichPlaces(){
    const k = pick([10, 100]), mul = chance(0.5), n = mul ? pickMul(k) : pickDiv(k) , places = k === 10 ? 1 : 2;
    return mcqNum({
      prompt: 'When you ' + (mul ? 'multiply' : 'divide') + ' by <b>' + k + '</b>, how many places do the digits move ' + (mul ? 'left' : 'right') + '?', answer: places,
      wrong: [{ v: k, why: k + ' is the number you multiply by. We count the PLACES the digits move.' }, { v: places === 1 ? 2 : 1, why: 'Count the zeros in ' + k + ': ' + (k === 10 ? 'one zero = one place' : 'two zeros = two places') + '.' }, { v: 3, why: 'Count the zeros in ' + k + '.' }],
      nearby: [1, -1], valid: function(v){ return v > 0; }, count: 3, hint: 'Count the zeros in ' + k + '.',
      explain: ex('Zeros tell the places', [k + ' has <b>' + places + ' zero' + (places > 1 ? 's' : '') + '</b>.', 'So digits move <b>' + places + ' place' + (places > 1 ? 's' : '') + '</b> ' + (mul ? 'left' : 'right') + '. ✅']), truth: String(k).length - 1
    });
  }
  /* ---- tier 3: typed ---- */
  function qTypedMul(){
    const k = pick([10, 100]), n = randInt(3, 99) + (chance(0.3) ? 100 * randInt(1, 9) : 0);
    return numeric({ prompt: 'Type the answer:  <b>' + n + ' × ' + k + '</b>', answer: n * k, hint: 'Move every digit ' + (k === 10 ? 'ONE place' : 'TWO places') + ' left. Fill the gaps with zeros.',
      explain: ex('Multiplying by ' + k, [n + ' × ' + k + ': each digit moves ' + (k === 10 ? 'one' : 'two') + ' place' + (k === 10 ? '' : 's') + ' left.', 'Answer: <b>' + n * k + '</b>. ✅']), truth: times(n, k),
      wrong: function(v){ return v === n + k ? 'That adds ' + k + '. Multiplying by ' + k + ' makes it ' + k + ' times bigger.' : v === n * (k === 10 ? 100 : 10) ? 'You moved the digits the wrong number of places.' : ''; } });
  }
  function qTypedDiv(){
    const k = pick([10, 100]), q = randInt(3, 99) + (chance(0.3) ? 100 * randInt(1, 9) : 0), n = q * k;
    return numeric({ prompt: 'Type the answer:  <b>' + n + ' ÷ ' + k + '</b>', answer: q, hint: 'Move every digit ' + (k === 10 ? 'ONE place' : 'TWO places') + ' right.',
      explain: ex('Dividing by ' + k, [n + ' ÷ ' + k + ': each digit moves ' + (k === 10 ? 'one' : 'two') + ' place' + (k === 10 ? '' : 's') + ' right.', 'Answer: <b>' + q + '</b>. ✅', 'Check: ' + q + ' × ' + k + ' = ' + n + '.']), truth: share(n, k),
      wrong: function(v){ return v === n - k ? 'That takes away ' + k + '. Dividing by ' + k + ' makes it ' + k + ' times smaller.' : v === n / (k === 10 ? 100 : 10) && v > 0 ? 'You moved the digits the wrong number of places.' : ''; } });
  }
  function qMissing(){
    const k = pick([10, 100]), q = randInt(3, 60), n = q * k, left = chance(0.5);
    if(left) return numeric({ prompt: 'Type the missing number:  <b>▢ × ' + k + ' = ' + n + '</b>', answer: q, hint: 'Which number is ' + k + ' times smaller than ' + n + '?',
      explain: ex('Use the opposite', ['Multiplying by ' + k + ' and dividing by ' + k + ' undo each other.', n + ' ÷ ' + k + ' = <b>' + q + '</b>. ✅', 'Check: ' + q + ' × ' + k + ' = ' + n + '.']), truth: share(n, k) });
    return numeric({ prompt: 'Type the missing number:  <b>▢ ÷ ' + k + ' = ' + q + '</b>', answer: n, hint: 'Which number is ' + k + ' times bigger than ' + q + '?',
      explain: ex('Use the opposite', ['Dividing by ' + k + ' and multiplying by ' + k + ' undo each other.', q + ' × ' + k + ' = <b>' + n + '</b>. ✅', 'Check: ' + n + ' ÷ ' + k + ' = ' + q + '.']), truth: times(q, k) });
  }
  function qWord(){
    const who = pick(NAMES), n = randInt(3, 40), k = pick([10, 100]);
    const items = k === 10 ? 'a box holds 10 pencils' : 'a crate holds 100 books';
    const thing = k === 10 ? 'pencils' : 'books';
    return numeric({ prompt: who + ' has ' + n + ' full ' + (k === 10 ? 'boxes' : 'crates') + '. Each ' + items + '. How many ' + thing + ' is that altogether?', answer: n * k, hint: 'Multiply the number of ' + (k === 10 ? 'boxes' : 'crates') + ' by ' + k + '.',
      explain: ex('Groups of ' + k, [n + ' groups of ' + k + ' = ' + n + ' × ' + k + '.', 'Digits move ' + (k === 10 ? 'one' : 'two') + ' place' + (k === 10 ? '' : 's') + ' left: <b>' + n * k + '</b>. ✅']), truth: times(n, k) });
  }
  registerSkill({
    id: 'multdiv-10-100', strand: 'multdiv', name: 'Times and divide by 10 and 100', emoji: '🔟', year: 4, order: 395, prereq: ['multdiv-2-5-10', 'number-place-value'],
    lesson: { title: 'Multiplying and dividing by 10 and 100', steps: [
      { say: '<b>40</b> is <b>4 tens</b>. If you swap every ten-rod for a hundred-flat you get <b>4 hundreds = 400</b>. So 40 × 10 = 400. The number is 10 times bigger.', vis: { kind: 'baseTen', args: [0, 4, 0] } },
      { say: 'The digits do not “get a zero stuck on”. They <b>move one place to the left</b> when you × 10, and <b>two places</b> when you × 100. Empty places are filled with 0.', vis: { kind: 'baseTen', args: [4, 0, 0] },
        quiz: { prompt: 'What is 35 × 10?', options: [{ label: '350', ok: true }, { label: '45', ok: false }, { label: '3,500', ok: false }], right: 'Yes! Digits move one place left.', wrong: '35 × 10: the 3 and 5 each move one place left: 350.' } },
      { say: 'Dividing is the opposite. ÷ 10 moves digits <b>one place right</b>; ÷ 100 moves them <b>two places right</b>. 600 ÷ 100 = <b>6</b>, because 6 hundreds is 6.', vis: { kind: 'baseTen', args: [6, 0, 0] },
        quiz: { prompt: 'What is 520 ÷ 10?', options: [{ label: '52', ok: true }, { label: '510', ok: false }, { label: '5,200', ok: false }], right: 'Yes! 52 tens = 520.', wrong: 'Digits move one place right: 520 becomes 52.' } }
    ] },
    trick: { title: 'Count the zeros', say: '× or ÷ by <b>10</b> moves digits <b>1</b> place. × or ÷ by <b>100</b> moves digits <b>2</b> places. Multiply goes <b>left</b> (bigger), divide goes <b>right</b> (smaller).', vis: { kind: 'baseTen', args: [0, 3, 0] }, example: '47 × 100 = <b>4,700</b> &nbsp;·&nbsp; 4,700 ÷ 100 = <b>47</b>' },
    gen: {
      1: function(){ return pick([qTensFlats, qFlatsTens, qWhichPlaces, qMul])(); },
      2: function(){ return pick([qMul, qMul, qDiv, qDiv, qWhichPlaces])(); },
      3: function(){ return pick([qTypedMul, qTypedDiv, qTypedMul, qTypedDiv, qMissing, qMissing, qWord])(); }
    }
  });
})();
