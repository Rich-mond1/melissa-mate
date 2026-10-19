/* frac-equivalent — equivalent fractions with fraction walls (halves/quarters/eighths, thirds/sixths, fifths/tenths).
   Registers V.extra.fracWall: stacked bars of equal length, row i = [shadedParts, totalParts]; the decoder reads each
   row's parts and its shaded WIDTH from the drawing. */
(function(){
  function F(n, d){ return fracHTML(n, d); }
  function fK(n, d){ return K.frac(n, d); }
  const INK = 'var(--vis-ink,#1B1B2F)', BLUE = 'var(--vis-a,#4F8FE8)', PURP = 'var(--vis-b,#9B51E0)';
  const W = 300, X0 = 4, RH = 38, GAP = 6;

  function wallRender(rows, labels){
    let s = '';
    rows.forEach(function(r, i){
      const n = r[0], d = r[1], w = (W - 8) / d, y = 6 + i * (RH + GAP);
      for(let j = 0; j < d; j++){
        s += '<rect class="wseg ' + (j < n ? 'on' : 'off') + '" data-row="' + i + '" x="' + (Math.round((X0 + j * w) * 100) / 100) + '" y="' + y + '" width="' + (Math.round(w * 100) / 100) + '" height="' + RH + '" fill="' + (j < n ? (i % 2 ? PURP : BLUE) : '#fff') + '" stroke="' + INK + '" stroke-width="2.5"/>';
        if(labels) s += '<text class="wl" x="' + (Math.round((X0 + j * w + w / 2) * 100) / 100) + '" y="' + (y + RH / 2 + 5) + '" text-anchor="middle" font-size="' + (d >= 8 ? 11 : 14) + '" font-weight="800" fill="' + (j < n ? '#fff' : INK) + '">' + (d === 1 ? '1' : '1/' + d) + '</text>';
      }
    });
    const h = rows.length * (RH + GAP) + 6;
    return '<svg viewBox="0 0 ' + W + ' ' + h + '" width="' + W + '" role="img" style="max-width:100%;height:auto;display:block;margin:0 auto" xmlns="http://www.w3.org/2000/svg">' + s + '</svg>';
  }
  /* -> [{num, den, width}] where width = shaded fraction of the full bar length, measured from the rectangles */
  V.decodeFracWall = function(html){
    const rows = [];
    const re = /<rect class="wseg (on|off)" data-row="(\d+)" x="[\d.]+" y="[\d.]+" width="([\d.]+)"/g;
    let m;
    while((m = re.exec(html)) !== null){
      const i = +m[2]; rows[i] = rows[i] || { num: 0, den: 0, width: 0 };
      rows[i].den++;
      if(m[1] === 'on'){ rows[i].num++; rows[i].width += parseFloat(m[3]) / (W - 8); }
    }
    return rows;
  };
  V.extra.fracWall = {
    render: wallRender,
    verify: function(a, html){
      const r = V.decodeFracWall(html);
      for(let i = 0; i < a[0].length; i++){
        if(!r[i] || r[i].num !== a[0][i][0] || r[i].den !== a[0][i][1]) return 'fracWall row ' + i + ' draws ' + (r[i] ? r[i].num + '/' + r[i].den : 'nothing');
        if(Math.abs(r[i].width - a[0][i][0] / a[0][i][1]) > 0.01) return 'fracWall row ' + i + ' shaded width is wrong';
      }
      return '';
    }
  };

  const FAMS = [[2, 4, 8], [3, 6], [5, 10]];
  function eqPair(){
    const fam = pick(FAMS), d = pick(fam.slice(0, -1)), e = pick(fam.filter(function(x){ return x > d && x % d === 0; }));
    const n = randInt(1, d - 1), k = e / d;
    return { n: n, d: d, m: n * k, e: e, k: k };
  }
  const NAMES = ['Ana', 'Marcus', 'Sophie', 'Ivan', 'Lucy', 'Diego', 'Ellen', 'Tom', 'Aisha', 'Kai', 'Mei', 'Leo'];
  const FOOD = ['pizza', 'chocolate bar', 'sandwich', 'cake', 'pancake'];

  function eqExplain(p){
    return ex(p.n + '/' + p.d + ' = ' + p.m + '/' + p.e, [
      'Cut every ' + (p.d === 2 ? 'half' : 'part') + ' of ' + p.n + '/' + p.d + ' into <b>' + p.k + '</b> smaller equal parts.',
      'The top and bottom are both multiplied by ' + p.k + ': ' + p.n + ' × ' + p.k + ' = <b>' + p.m + '</b> and ' + p.d + ' × ' + p.k + ' = <b>' + p.e + '</b>.',
      'So ' + p.n + '/' + p.d + ' = <b>' + p.m + '/' + p.e + '</b> (same size). ✅'
    ]);
  }

  function missingTopQ(p, withWall, hideAnswerRow){
    const vis = wallRender([[p.n, p.d], [hideAnswerRow ? 0 : p.m, p.e]], false);
    const dec = hideAnswerRow ? undefined : function(){ return V.decodeFracWall(vis)[1].num; };
    return mcqNum({
      prompt: F(p.n, p.d) + ' = ?/' + p.e + '. What is the missing top number?', visual: withWall ? vis : '', answer: p.m,
      wrong: [
        { v: p.n, why: 'You copied the top number. When the bottom becomes ' + p.e + ', the top changes too: multiply it by ' + p.k + '.' },
        { v: p.n + p.k, why: 'You added ' + p.k + '. Equivalent fractions come from MULTIPLYING top and bottom by the same number.' },
        { v: p.e - p.d + p.n, why: 'You added the same amount to the top as to the bottom. We must multiply, not add.' },
        { v: p.e, why: 'That is the bottom number. The top number is ' + p.n + ' × ' + p.k + '.' }
      ],
      count: Math.min(4, p.e - 1), nearby: [1, -1, 2, -2, 3, 4], valid: function(v){ return v >= 1 && v < p.e; },
      hint: 'The bottom number went from ' + p.d + ' to ' + p.e + ' (× ' + p.k + '). Do the same to the top number.',
      explain: eqExplain(p), truth: (p.n * p.e) / p.d, decode: dec
    });
  }

  function whichEqualQ(p, withWall){
    const vis = wallRender([[p.n, p.d], [0, p.e]], false);
    const ds = [
      opt(fK(p.n, p.e), F(p.n, p.e), 'You changed the bottom number but not the top. Both must be multiplied by ' + p.k + '.'),
      opt(fK(p.n + p.k, p.e), F(p.n + p.k, p.e), 'You ADDED ' + p.k + ' to the top. Equivalent fractions come from multiplying.'),
      opt(fK(p.n + 1, p.e), F(p.n + 1, p.e), 'Close, but not the same size. Multiply the top by ' + p.k + ' exactly.'),
      opt(fK(p.m, p.e + p.d), F(p.m, p.e + p.d), 'You added the bottom numbers. The bottom is ' + p.d + ' × ' + p.k + ' = ' + p.e + '.')
    ];
    FAMS.forEach(function(f){ f.forEach(function(dd){ for(let k = 1; k < dd; k++) ds.push(opt(fK(k, dd), F(k, dd), 'That is a different size from ' + p.n + '/' + p.d + '.')); }); });
    return mcq({
      prompt: 'Which fraction is equal to ' + F(p.n, p.d) + '?', visual: withWall ? vis : '',
      correct: opt(fK(p.m, p.e), F(p.m, p.e)), distractors: ds.filter(function(o){ return o.key !== fK(p.n, p.d); }), keepOrder: true,
      hint: 'Multiply the top AND the bottom of ' + p.n + '/' + p.d + ' by the same number.',
      explain: eqExplain(p), truth: fK(p.n * p.k, p.d * p.k)
    });
  }

  function sameSizeQ(){
    const p = eqPair(), same = chance(0.5);
    let m = p.m;
    if(!same){ m = (p.m > 1 && chance(0.5)) ? p.m - 1 : p.m + 1; if(m >= p.e) m = p.m - 1; }
    const vis = wallRender([[p.n, p.d], [m, p.e]], false);
    const yes = opt(K.bool(true), 'Yes', 'The two bars are the same length, so they ARE the same amount.');
    const no = opt(K.bool(false), 'No', 'Look at the shaded lengths: they are different, so the fractions are not equal.');
    return mcq2({
      prompt: 'Are ' + F(p.n, p.d) + ' and ' + F(m, p.e) + ' the same amount?', visual: vis,
      correct: same ? yes : no, other: same ? no : yes,
      hint: 'Compare how far the colour goes along each bar. Do both bars end at the same place?',
      explain: same
        ? ex('Same size', ['Both bars are the same length, and the colour stops at the same place.', p.n + ' × ' + p.k + ' = ' + p.m + ' and ' + p.d + ' × ' + p.k + ' = ' + p.e + '.', 'Yes — ' + p.n + '/' + p.d + ' = ' + p.m + '/' + p.e + '. ✅'])
        : ex('Not the same size', ['The colour stops in different places on the two bars.', p.n + '/' + p.d + ' = ' + p.m + '/' + p.e + ', but ' + m + '/' + p.e + ' is not that.', 'No — ' + p.n + '/' + p.d + ' and ' + m + '/' + p.e + ' are not equal. ✅']),
      truth: K.bool(m * p.d === p.n * p.e),
      decode: function(){ const r = V.decodeFracWall(vis); return K.bool(Math.abs(r[0].width - r[1].width) < 0.01); }
    });
  }

  function typedMissing(){
    const p = eqPair(), r = randInt(0, 2);
    if(r === 0){
      return numeric({
        prompt: p.n + '/' + p.d + ' = ?/' + p.e + '. Type the missing top number.', answer: p.m,
        hint: 'The bottom number is multiplied by ' + p.k + ' to get ' + p.e + '. Do the same to the top number.', explain: eqExplain(p), truth: (p.n * p.e) / p.d,
        wrong: function(v){ return v === p.n ? 'You copied the top number. It must change too: × ' + p.k + '.' : v === p.n + p.k ? 'You added. Equivalent fractions use multiplying.' : ''; }
      });
    }
    if(r === 1){
      return numeric({
        prompt: '?/' + p.d + ' = ' + p.m + '/' + p.e + '. Type the missing top number.', answer: p.n,
        hint: 'The bottom number went from ' + p.d + ' up to ' + p.e + ' by × ' + p.k + '. Go backwards: divide the top number ' + p.m + ' by ' + p.k + '.',
        explain: ex('Going backwards', [p.e + ' ÷ ' + p.k + ' = ' + p.d + ', so divide the top number by ' + p.k + ' too.', p.m + ' ÷ ' + p.k + ' = <b>' + p.n + '</b>.', p.n + '/' + p.d + ' = ' + p.m + '/' + p.e + ', so the missing number is <b>' + p.n + '</b>. ✅']),
        truth: (p.m * p.d) / p.e,
        wrong: function(v){ return v === p.m ? 'You copied the top number. Divide it by ' + p.k + ' because the bottom was divided by ' + p.k + '.' : ''; }
      });
    }
    return numeric({
      prompt: p.n + '/' + p.d + ' = ' + p.m + '/?. Type the missing bottom number.', answer: p.e,
      hint: 'The top number was multiplied by ' + p.k + ' to get ' + p.m + '. Do the same to the bottom number ' + p.d + '.',
      explain: ex('Finding the bottom', [p.n + ' × ' + p.k + ' = ' + p.m + ', so multiply the bottom by ' + p.k + ' too.', p.d + ' × ' + p.k + ' = <b>' + p.e + '</b>.', p.n + '/' + p.d + ' = ' + p.m + '/' + p.e + ', so the missing number is <b>' + p.e + '</b>. ✅']),
      truth: (p.d * p.m) / p.n,
      wrong: function(v){ return v === p.d ? 'You copied the bottom number. It must change too: × ' + p.k + '.' : v === p.d + p.k ? 'You added. Equivalent fractions use multiplying.' : ''; }
    });
  }

  function notEqualQ(){
    // halves family: 1/2 = 2/4 = 4/8 ; two are equal to 1/2, one is not
    const base = [1, 2], eqs = [[2, 4], [4, 8]];
    const odds = [[1, 4], [3, 4], [3, 8], [1, 8], [5, 8], [2, 8], [2, 8]].filter(function(o){ return fK(o[0], o[1]) !== fK(1, 2); });
    const odd = pick(odds);
    const ds = eqs.map(function(e){ return opt('eq:' + e[0] + '/' + e[1], F(e[0], e[1]), e[0] + '/' + e[1] + ' IS equal to 1/2. We want the one that is NOT.'); });
    return mcq({
      prompt: 'Which of these is NOT equal to ' + F(1, 2) + '?', visual: wallRender([[1, 2], [2, 4], [4, 8]], true),
      correct: opt(fK(odd[0], odd[1]), F(odd[0], odd[1])), distractors: ds, count: 3, keepOrder: true,
      hint: 'On the wall, 1/2 covers half of the bar. Which fraction does NOT cover half?',
      explain: ex('The odd one out', ['1/2 = 2/4 = 4/8: they all cover exactly half of the bar.', odd[0] + '/' + odd[1] + ' does not cover half.', 'So <b>' + odd[0] + '/' + odd[1] + '</b> is NOT equal to 1/2. ✅']),
      truth: fK(odd[0] * 2, odd[1] * 2)
    });
  }

  function whoAteQ(){
    const p = eqPair(), same = chance(0.5), nm = pick(NAMES); let nm2 = pick(NAMES); while(nm2 === nm) nm2 = pick(NAMES);
    let m = p.m;
    if(!same){ m = (p.m > 1 && chance(0.5)) ? p.m - 1 : p.m + 1; if(m >= p.e) m = p.m - 1; }
    // top bar = nm eats p.n/p.d ; bottom bar = nm2 eats m/p.e
    const vis = wallRender([[p.n, p.d], [m, p.e]], false);
    const lhs = p.n * p.e, rhs = m * p.d;                 // compare by cross-multiplying
    const ans = lhs === rhs ? 'same' : (lhs > rhs ? 'a' : 'b');
    const food = pick(FOOD);
    const optA = opt('who:a', nm, ans === 'b' ? 'Not quite — ' + nm + ' ate less. A bigger bottom number does not mean a bigger fraction.' : 'Not quite — look at how far each colour goes.');
    const optB = opt('who:b', nm2, ans === 'a' ? 'Not quite — ' + nm2 + ' ate less. Look at how far each colour goes.' : 'Not quite — ' + nm2 + ' did not eat more. Look at how far each colour goes.');
    const optS = opt('who:same', 'They ate the same', 'Look carefully: the two colours stop in different places, so the amounts are different.');
    const key = ans === 'same' ? optS : ans === 'a' ? optA : optB;
    const others = [optA, optB, optS].filter(function(o){ return o !== key; });
    const hi = lhs > rhs ? nm : nm2;
    return mcq({
      prompt: nm + ' eats ' + F(p.n, p.d) + ' of a ' + food + '. ' + nm2 + ' eats ' + F(m, p.e) + ' of the same ' + food + '. Who eats more?', visual: vis,
      correct: key, distractors: others, count: 3, keepOrder: true,
      hint: 'Look at the two bars. The top one is ' + nm + '\'s and the bottom one is ' + nm2 + '\'s. Whose colour goes further?',
      explain: ans === 'same'
        ? ex('Same amount', [p.n + '/' + p.d + ' = ' + p.m + '/' + p.e + ' (× ' + p.k + ' on the top and bottom).', 'Both bars are coloured to the same place.', '<b>They ate the same</b> amount. ✅'])
        : ex('Comparing', ['Look at the colour on each bar: ' + nm + ' has ' + p.n + '/' + p.d + ' and ' + nm2 + ' has ' + m + '/' + p.e + '.', p.n + '/' + p.d + ' = ' + p.m + '/' + p.e + ', so compare ' + p.m + '/' + p.e + ' with ' + m + '/' + p.e + '.', '<b>' + hi + '</b> eats more. ✅']),
      truth: ans === 'same' ? 'who:same' : ans === 'a' ? 'who:a' : 'who:b',
      decode: function(){ const r = V.decodeFracWall(vis), a = r[0].width, b = r[1].width; return Math.abs(a - b) < 0.01 ? 'who:same' : (a > b ? 'who:a' : 'who:b'); }
    });
  }

  registerSkill({
    id: 'frac-equivalent', strand: 'fractions', name: 'Equivalent fractions', emoji: '🧱', year: 3, order: 460, prereq: ['frac-nonunit'],
    lesson: {
      title: 'Same amount, different numbers',
      steps: [
        { say: 'Look at these two bars. They are the same length. <b>1/2</b> covers exactly the same amount as <b>2/4</b>! We say they are <b>equivalent fractions</b>: 1/2 = 2/4.', vis: { kind: 'fracWall', args: [[[1, 2], [2, 4]], true] } },
        { say: 'This is a <b>fraction wall</b>. Every row is the same length. Half of the wall is also 2 quarters and 4 eighths: <b>1/2 = 2/4 = 4/8</b>.', vis: { kind: 'fracWall', args: [[[1, 2], [2, 4], [4, 8]], true] },
          quiz: { prompt: 'Which fraction is equal to 1/2?', options: [{ label: '4/8', ok: true }, { label: '3/8', ok: false }, { label: '1/4', ok: false }], right: 'Yes! 4/8 covers half of the wall.', wrong: 'Look at the wall: 1/2 lines up with 2/4 and 4/8. The others stop in different places.' } },
        { say: 'Thirds and sixths work the same way. Cut each third in two and you get 2 sixths. So <b>1/3 = 2/6</b>.', vis: { kind: 'fracWall', args: [[[1, 3], [2, 6]], true] } },
        { say: 'Fifths and tenths too. Each fifth is 2 tenths, so <b>2/5 = 4/10</b>. The top and bottom were both multiplied by 2.', vis: { kind: 'fracWall', args: [[[2, 5], [4, 10]], true] },
          quiz: { prompt: '2/5 = ?/10. What is the missing number?', options: [{ label: '4', ok: true }, { label: '2', ok: false }, { label: '7', ok: false }], right: 'Yes! 2 × 2 = 4, so 2/5 = 4/10.', wrong: 'The bottom went 5 × 2 = 10, so the top goes 2 × 2 = 4.' } },
        { say: 'Equivalent means the <b>same size</b>, not the same numbers. Multiply the top and the bottom by the <b>same number</b> and the fraction stays the same size: 3/4 = 6/8.', vis: { kind: 'fracWall', args: [[[3, 4], [6, 8]], false] } }
      ]
    },
    trick: {
      title: 'Do the same to the top and the bottom',
      say: 'To make an equivalent fraction, <b>multiply the top AND the bottom by the same number</b>. Never add! Whatever you do to the bottom, do to the top.',
      vis: { kind: 'fracWall', args: [[[3, 4], [6, 8]], false] },
      example: '3/4 → × 2 on top and bottom → <b>6/8</b>'
    },
    gen: {
      1: function(){
        const p = eqPair(), r = randInt(0, 2);
        if(r === 0) return missingTopQ(p, true, false);
        if(r === 1) return sameSizeQ();
        return missingTopQ(p, true, false);
      },
      2: function(){
        const r = randInt(0, 3), p = eqPair();
        if(r === 0) return whichEqualQ(p, true);
        if(r === 1) return missingTopQ(p, !chance(0.5), true);
        if(r === 2) return sameSizeQ();
        return whichEqualQ(p, false);
      },
      3: function(){
        const r = randInt(0, 4);
        if(r === 0) return notEqualQ();
        if(r === 1) return whoAteQ();
        if(r === 2) return whichEqualQ(eqPair(), false);
        return typedMissing();
      }
    }
  });
})();
