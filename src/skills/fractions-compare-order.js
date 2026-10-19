/* frac-compare-order — compare and order fractions with the same denominator, and unit fractions (1/2 > 1/4 > 1/8).
   Misconception targeted everywhere: "a bigger bottom number means a bigger fraction". */
(function(){
  function F(n, d){ return fracHTML(n, d); }
  function fK(n, d){ return K.frac(n, d); }
  const UNIT_DENS = [2, 3, 4, 5, 6, 8, 10];

  /* stacked bars, one per fraction, each labelled with its fraction; returns {html, bars} so decoders can read every bar */
  function barsVis(list){
    const bars = list.map(function(x){ return V.fractionBar(x[0], x[1]); });
    const html = '<div style="display:inline-block;max-width:100%">' + list.map(function(x, i){
      return '<div style="display:flex;align-items:center;gap:8px;margin:4px 0"><b style="font-size:18px;min-width:34px;text-align:center">' + F(x[0], x[1]) + '</b><div style="flex:1;min-width:0">' + bars[i] + '</div></div>';
    }).join('') + '</div>';
    return { html: html, bars: bars };
  }
  V.extra.fracBars = {
    render: function(list){ return barsVis(list).html; },
    verify: function(a, html){
      const parts = html.split('<svg').slice(1).map(function(x){ return '<svg' + x; });
      if(parts.length !== a[0].length) return 'fracBars draws ' + parts.length + ' bars';
      for(let i = 0; i < parts.length; i++){ const r = V.decodeFractionBar(parts[i]); if(r.num !== a[0][i][0] || r.den !== a[0][i][1]) return 'fracBars bar ' + i + ' draws ' + r.num + '/' + r.den; }
      return '';
    }
  };
  function barVal(html){ const r = V.decodeFractionBar(html); return { num: r.num, den: r.den }; }
  function bigger(a, b){ return a[0] * b[1] > b[0] * a[1]; }            // cross-multiplication
  function unit(a){ return a[0] === 1; }

  function whyWrong(win, lose, unitCase){
    return unitCase
      ? 'Careful: a BIGGER bottom number means the whole is cut into MORE pieces, so each piece is SMALLER. ' + lose[0] + '/' + lose[1] + ' is the smaller one.'
      : 'The parts are the same size, so the fraction with MORE parts coloured is bigger. ' + lose[0] + '/' + lose[1] + ' has fewer.';
  }

  function compareQ(a, b, wantBigger){
    const vis = barsVis([a, b]);
    const aWins = wantBigger ? bigger(a, b) : bigger(b, a);   // is `a` the answer?
    const win = aWins ? a : b, lose = aWins ? b : a;
    const unitCase = unit(a) && unit(b);
    const big = wantBigger ? win : lose, small = wantBigger ? lose : win;
    const why = unitCase
      ? (wantBigger ? 'A bigger bottom number means smaller pieces. ' + lose[0] + '/' + lose[1] + ' is the smaller fraction, not the bigger.' : 'A smaller bottom number means bigger pieces. ' + lose[0] + '/' + lose[1] + ' is the bigger fraction, not the smaller.')
      : (wantBigger ? 'The parts are the same size, so more parts coloured means bigger. ' + lose[0] + '/' + lose[1] + ' has fewer coloured.' : 'The parts are the same size, so fewer parts coloured means smaller. ' + lose[0] + '/' + lose[1] + ' has more coloured.');
    return mcq2({
      prompt: 'Which fraction is ' + (wantBigger ? 'bigger' : 'smaller') + '?', visual: vis.html,
      correct: opt(fK(win[0], win[1]), F(win[0], win[1])), other: opt(fK(lose[0], lose[1]), F(lose[0], lose[1]), why),
      hint: unitCase ? 'Look at the bars. Which bar has the ' + (wantBigger ? 'longer' : 'shorter') + ' coloured part?' : 'The bars are cut into the same size parts. Count the coloured parts.',
      explain: ex('Comparing ' + a[0] + '/' + a[1] + ' and ' + b[0] + '/' + b[1], [
        unitCase ? 'Both are unit fractions. ' + big[1] + ' is ' + (big[1] < small[1] ? 'a smaller' : 'a bigger') + ' number of pieces than ' + small[1] + ', so ' + (big[1] < small[1] ? 'the pieces are bigger.' : 'the pieces are smaller.') : 'Both bars are cut into <b>' + a[1] + '</b> equal parts, so we just compare the top numbers: ' + a[0] + ' and ' + b[0] + '.',
        'The coloured part of the bar for ' + big[0] + '/' + big[1] + ' is longer than for ' + small[0] + '/' + small[1] + '.',
        'The ' + (wantBigger ? 'bigger' : 'smaller') + ' fraction is <b>' + win[0] + '/' + win[1] + '</b>. ✅'
      ]),
      truth: fK(win[0] * 2, win[1] * 2),
      decode: function(){
        const va = barVal(vis.bars[0]), vb = barVal(vis.bars[1]);
        const aBig = va.num * vb.den > vb.num * va.den;
        const pickA = wantBigger ? aBig : !aBig;
        return pickA ? fK(va.num, va.den) : fK(vb.num, vb.den);
      }
    });
  }

  function sameDenPair(dmin, dmax){
    const d = randInt(dmin, dmax), n1 = randInt(1, d - 1); let n2 = randInt(1, d - 1); while(n2 === n1) n2 = randInt(1, d - 1);
    return [[n1, d], [n2, d]];
  }
  function unitPair(dens){
    const d1 = pick(dens); let d2 = pick(dens); while(d2 === d1) d2 = pick(dens);
    return [[1, d1], [1, d2]];
  }

  function orderQ(unitCase, count, desc){
    let fr;
    if(unitCase){ fr = sample(UNIT_DENS, count).map(function(d){ return [1, d]; }); }
    else { const d = randInt(count + 2, 10); fr = sample(Array.from({ length: d - 1 }, function(_, i){ return i + 1; }), count).map(function(n){ return [n, d]; }); }
    // correct order: ascending by value, or descending
    fr.sort(function(a, b){ return a[0] * b[1] - b[0] * a[1]; });
    if(desc) fr.reverse();
    const items = fr.map(function(x){ return { key: fK(x[0], x[1]), label: F(x[0], x[1]) }; });
    const txt = fr.map(function(x){ return x[0] + '/' + x[1]; }).join(', ');
    const sorted = fr.slice().sort(function(a, b){ return (a[0] / a[1]) - (b[0] / b[1]); });
    if(desc) sorted.reverse();
    return order({
      prompt: 'Put these fractions in order. Start with the ' + (desc ? 'BIGGEST' : 'SMALLEST') + '.', items: items,
      visual: '',
      hint: unitCase ? 'With 1 on top, a bigger bottom number means a smaller piece. Which has the biggest pieces?' : 'The bottom numbers are all the same, so just compare the top numbers.',
      explain: ex('Putting fractions in order', [
        unitCase ? 'Each fraction has 1 on top. The <b>bigger</b> the bottom number, the <b>smaller</b> each piece.' : 'Every fraction is cut into <b>' + fr[0][1] + '</b> equal parts, so the bigger the top number, the bigger the fraction.',
        'From ' + (desc ? 'biggest to smallest' : 'smallest to biggest') + ': ' + txt + '.',
        'The order is <b>' + fr.map(function(x){ return x[0] + '/' + x[1]; }).join(', ') + '</b>. ✅'
      ]),
      truth: 'o:' + sorted.map(function(x){ return fK(x[0], x[1]); }).join('|')
    });
  }

  function extremeQ(unitCase, wantBigger){
    let fr;
    if(unitCase) fr = sample(UNIT_DENS, 4).map(function(d){ return [1, d]; });
    else { const d = randInt(6, 10); fr = sample(Array.from({ length: d - 1 }, function(_, i){ return i + 1; }), 4).map(function(n){ return [n, d]; }); }
    const sortedV = fr.slice().sort(function(a, b){ return (a[0] / a[1]) - (b[0] / b[1]); });
    const win = wantBigger ? sortedV[3] : sortedV[0];
    const ds = fr.filter(function(x){ return x !== win; }).map(function(x){
      let why;
      if(unitCase) why = wantBigger ? '1/' + x[1] + ' is not the biggest. Remember: a bigger bottom number means smaller pieces.' : '1/' + x[1] + ' is not the smallest. Remember: a bigger bottom number means smaller pieces.';
      else why = wantBigger ? x[0] + '/' + x[1] + ' is not the biggest: it has fewer parts coloured than ' + win[0] + '/' + win[1] + '.' : x[0] + '/' + x[1] + ' is not the smallest: it has more parts coloured than ' + win[0] + '/' + win[1] + '.';
      return opt(fK(x[0], x[1]), F(x[0], x[1]), why);
    });
    const ordered = unitCase ? sortedV.slice().reverse() : sortedV;
    return mcq({
      prompt: 'Which is the ' + (wantBigger ? 'BIGGEST' : 'SMALLEST') + ' fraction?', visual: '',
      correct: opt(fK(win[0], win[1]), F(win[0], win[1])), distractors: ds, count: 4,
      hint: unitCase ? 'All of them have 1 on top. A bigger bottom number means the whole is cut into more, smaller pieces.' : 'The bottom numbers are the same, so compare the top numbers.',
      explain: ex('Finding the ' + (wantBigger ? 'biggest' : 'smallest'), [
        unitCase ? 'All the fractions have 1 on top, so look at the bottom numbers. More pieces means <b>smaller</b> pieces.' : 'All the fractions are cut into <b>' + fr[0][1] + '</b> equal parts, so compare the top numbers.',
        'From smallest to biggest: ' + sortedV.map(function(x){ return x[0] + '/' + x[1]; }).join(', ') + '.',
        'The ' + (wantBigger ? 'biggest' : 'smallest') + ' is <b>' + win[0] + '/' + win[1] + '</b>. ✅'
      ]),
      truth: fK(win[0] * 5, win[1] * 5)
    });
  }

  function greaterLessQ(){
    const d = randInt(4, 10), n1 = randInt(1, d - 1); let n2 = randInt(1, d - 1); while(n2 === n1) n2 = randInt(1, d - 1);
    const gt = n1 > n2;
    const G = opt('cmp:greater', 'greater than', 'Check the top numbers: ' + n1 + ' is smaller than ' + n2 + ', so ' + n1 + '/' + d + ' is the smaller fraction.');
    const L = opt('cmp:less', 'less than', 'Check the top numbers: ' + n1 + ' is bigger than ' + n2 + ', so ' + n1 + '/' + d + ' is the bigger fraction.');
    return mcq2({
      prompt: 'Is ' + F(n1, d) + ' greater than or less than ' + F(n2, d) + '?', visual: barsVis([[n1, d], [n2, d]]).html,
      correct: gt ? G : L, other: gt ? L : G,
      hint: 'Both fractions are in ' + NAMES_D(d) + ', so compare the top numbers: ' + n1 + ' and ' + n2 + '.',
      explain: ex('Comparing ' + n1 + '/' + d + ' and ' + n2 + '/' + d, ['Both are cut into <b>' + d + '</b> equal parts, so compare ' + n1 + ' and ' + n2 + '.', n1 + ' is ' + (gt ? 'bigger' : 'smaller') + ' than ' + n2 + '.', n1 + '/' + d + ' is <b>' + (gt ? 'greater than' : 'less than') + '</b> ' + n2 + '/' + d + '. ✅']),
      truth: n1 * 100 > n2 * 100 ? 'cmp:greater' : 'cmp:less',
      decode: function(){ const v = barsVis([[n1, d], [n2, d]]).bars.map(barVal); return v[0].num * v[1].den > v[1].num * v[0].den ? 'cmp:greater' : 'cmp:less'; }
    });
  }
  function NAMES_D(d){ return ({ 2: 'halves', 3: 'thirds', 4: 'quarters', 5: 'fifths', 6: 'sixths', 7: 'sevenths', 8: 'eighths', 9: 'ninths', 10: 'tenths' })[d]; }

  function trueFalseQ(){
    const p = unitPair([2, 3, 4, 5, 6, 8, 10]), a = p[0], b = p[1];
    const claimBig = chance(0.5) ? a : b, other = claimBig === a ? b : a;
    const isTrue = bigger(claimBig, other);
    const T = opt(K.bool(true), 'True', 'It IS true: with 1 on top, the smaller the bottom number the bigger the piece.');
    const Fa = opt(K.bool(false), 'False', 'It is false. A bigger bottom number means smaller pieces, so 1/' + (claimBig[1]) + ' is NOT bigger than 1/' + other[1] + '.');
    return mcq2({
      prompt: 'True or false? ' + F(claimBig[0], claimBig[1]) + ' is bigger than ' + F(other[0], other[1]) + '.', visual: '',
      correct: isTrue ? T : Fa, other: isTrue ? Fa : T,
      hint: 'Picture two bars. The bar cut into MORE pieces has smaller pieces.',
      explain: ex('True or false?', [
        '1/' + claimBig[1] + ' comes from cutting a whole into ' + claimBig[1] + ' pieces; 1/' + other[1] + ' comes from ' + other[1] + ' pieces.',
        'More pieces means each piece is smaller, so 1/' + (claimBig[1] > other[1] ? claimBig[1] : other[1]) + ' is the smaller fraction.',
        'The answer is <b>' + (isTrue ? 'True' : 'False') + '</b>. ✅'
      ]),
      truth: K.bool(claimBig[1] * 1 < other[1] * 1)
    });
  }

  function betweenQ(){
    const d = randInt(5, 10), a = randInt(1, d - 3), ans = a + 1;
    return numeric({
      prompt: 'A fraction with ' + d + ' on the bottom is bigger than ' + F(a, d) + ' and smaller than ' + F(a + 2, d) + '. What is its top number?', answer: ans,
      hint: 'The bottom numbers are the same, so look for the top number that is between ' + a + ' and ' + (a + 2) + '.',
      explain: ex('In between', ['All the fractions are in ' + NAMES_D(d) + ', so compare the top numbers.', 'The number between ' + a + ' and ' + (a + 2) + ' is <b>' + ans + '</b>.', 'So the fraction is ' + ans + '/' + d + ', and the top number is <b>' + ans + '</b>. ✅']),
      truth: (a + a + 2) / 2,
      wrong: function(v){ return v === a || v === a + 2 ? 'That is one of the fractions in the question. We need the one in between.' : v === d ? 'That is the bottom number. We want the top number.' : ''; }
    });
  }

  registerSkill({
    id: 'frac-compare-order', strand: 'fractions', name: 'Comparing and ordering fractions', emoji: '⚖️', year: 3, order: 470, prereq: ['frac-nonunit'],
    lesson: {
      title: 'Which fraction is bigger?',
      steps: [
        { say: 'When the bottom numbers are the <b>same</b>, the parts are the same size. So the fraction with <b>more parts coloured</b> is bigger. Here 3/5 is bigger than 2/5.', vis: { kind: 'fracBars', args: [[[3, 5], [2, 5]]] },
          quiz: { prompt: 'Which is bigger, 2/7 or 5/7?', options: [{ label: '2/7', ok: false }, { label: '5/7', ok: true }], right: 'Yes! The parts are the same size, and 5 parts is more than 2 parts.', wrong: 'Both are sevenths, so compare the top numbers: 5 is bigger than 2. So 5/7 is bigger.' } },
        { say: 'Now look at <b>unit fractions</b> (1 on top). Here is 1/2 and 1/4. Half a bar is much longer than a quarter of a bar.', vis: { kind: 'fracBars', args: [[[1, 2], [1, 4]]] } },
        { say: 'Surprise! The <b>bigger</b> the bottom number, the <b>smaller</b> the fraction. More pieces means each piece is smaller. So <b>1/2 > 1/4 > 1/8</b>.', vis: { kind: 'fracBars', args: [[[1, 2], [1, 4], [1, 8]]] },
          quiz: { prompt: 'Which is bigger, 1/3 or 1/6?', options: [{ label: '1/3', ok: true }, { label: '1/6', ok: false }], right: 'Yes! Thirds are bigger pieces than sixths.', wrong: 'A whole cut into 3 pieces gives bigger pieces than one cut into 6. So 1/3 is bigger.' } }
      ]
    },
    trick: {
      title: 'Pizza slices trick',
      say: 'Think of a pizza. If you share it between <b>2</b> people, each slice is big. If you share it between <b>8</b> people, each slice is tiny! A <b>bigger bottom number</b> means a <b>smaller</b> slice (when the top is 1).',
      vis: { kind: 'fractionCircle', args: [1, 8] },
      example: '1/2 > 1/4 > 1/8 — fewer people, bigger slices'
    },
    gen: {
      1: function(){
        const r = randInt(0, 2);
        if(r === 0){ const p = sameDenPair(3, 8); return compareQ(p[0], p[1], chance(0.6)); }
        const p = unitPair([2, 3, 4, 6, 8]);
        return compareQ(p[0], p[1], chance(0.6));
      },
      2: function(){
        const r = randInt(0, 5);
        if(r === 0) return orderQ(false, 3, false);
        if(r === 1) return extremeQ(false, chance(0.5));
        if(r === 2) return greaterLessQ();
        if(r === 3){ const p = unitPair(UNIT_DENS); return compareQ(p[0], p[1], chance(0.5)); }
        if(r === 4){ const p = sameDenPair(5, 10); return compareQ(p[0], p[1], chance(0.5)); }
        return orderQ(false, pick([3, 4]), chance(0.4));
      },
      3: function(){
        const r = randInt(0, 5);
        if(r === 0) return orderQ(true, pick([3, 4]), chance(0.5));
        if(r === 1) return extremeQ(true, chance(0.5));
        if(r === 2) return trueFalseQ();
        if(r === 3) return betweenQ();
        if(r === 4) return orderQ(false, pick([4, 5]), chance(0.5));
        return extremeQ(false, chance(0.5));
      }
    }
  });
})();
