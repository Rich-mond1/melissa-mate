/* GEOMETRY 3 — Angles: right angles, smaller / bigger than a right angle, acute & obtuse (Year 4 bridge at tier 3). */
(function(){
  const LAB = { smaller: 'smaller than a right angle', right: 'a right angle', bigger: 'bigger than a right angle' };
  const CATS = ['smaller', 'right', 'bigger'];
  function degCat(d){ return d < 90 ? 'smaller' : (d > 90 ? 'bigger' : 'right'); }
  function art(n){ return /^[aeiou]/.test(n) ? 'an ' + n : 'a ' + n; }
  function degIn(cat, far){
    if(cat === 'right') return 90;
    const lo = far ? 20 : 30, hi = far ? 60 : 75;
    return cat === 'smaller' ? 5 * randInt(lo / 5, hi / 5) : 5 * randInt((180 - hi) / 5, (180 - lo) / 5);
  }
  function wrongWhy(cat, picked){
    if(picked === 'right') return 'It is not exactly the corner of a book. Check the little square: a right angle is marked with one.';
    return picked === 'smaller' ? 'Compare with the corner of a page: this angle is wider than that corner, so it is not smaller.' : 'Compare with the corner of a page: this angle is narrower than that corner, so it is not bigger.';
  }
  function whyCmp(cat){
    return function(picked){
      if(picked === 'right') return 'A right angle is exactly a square corner. This angle is ' + (cat === 'smaller' ? 'narrower' : 'wider') + ' than a square corner.';
      if(picked === 'smaller') return 'This angle opens wider than a square corner, so it is not smaller than a right angle.';
      return 'This angle opens narrower than a square corner, so it is not bigger than a right angle.';
    };
  }
  const ENV = {
    right: ['the corner of a book', 'the corner of a door', 'the corner of a window', 'a corner of a chessboard', 'the corner of a piece of paper', 'the hands of a clock at 3 o’clock', 'the hands of a clock at 9 o’clock', 'the corner of a square tile', 'a corner of a football pitch'],
    smaller: ['the tip of a slice of pizza (the pizza is cut into 8)', 'the hands of a clock at 2 o’clock', 'the hands of a clock at 1 o’clock', 'the pointy corner of a sandwich cut corner to corner', 'a corner of a triangle road sign (all 3 corners the same)'],
    bigger: ['the hands of a clock at 4 o’clock', 'the hands of a clock at 5 o’clock', 'a corner of a stop sign (an octagon)', 'a corner of a honeycomb cell (a hexagon)']
  };
  const ENVDEG = { 'the corner of a book': 90, 'the corner of a door': 90, 'the corner of a window': 90, 'a corner of a chessboard': 90, 'the corner of a piece of paper': 90, 'the hands of a clock at 3 o’clock': 90, 'the hands of a clock at 9 o’clock': 90, 'the corner of a square tile': 90, 'a corner of a football pitch': 90,
    'the tip of a slice of pizza (the pizza is cut into 8)': 45, 'the hands of a clock at 2 o’clock': 60, 'the hands of a clock at 1 o’clock': 30, 'the pointy corner of a sandwich cut corner to corner': 45, 'a corner of a triangle road sign (all 3 corners the same)': 60,
    'the hands of a clock at 4 o’clock': 120, 'the hands of a clock at 5 o’clock': 150, 'a corner of a stop sign (an octagon)': 135, 'a corner of a honeycomb cell (a hexagon)': 120 };
  const SHAPES = ['triangle_right', 'square', 'rectangle', 'parallelogram', 'trapezium', 'kite', 'pentagon', 'hexagon', 'triangle_equilateral', 'triangle_isosceles', 'triangle_scalene'];
  const LITRA = { triangle_right: 1, square: 4, rectangle: 4 };
  const SHNAME = { triangle_right: 'right-angled triangle', square: 'square', rectangle: 'rectangle', parallelogram: 'parallelogram', trapezium: 'trapezium', kite: 'kite', pentagon: 'pentagon', hexagon: 'hexagon', triangle_equilateral: 'equilateral triangle', triangle_isosceles: 'isosceles triangle', triangle_scalene: 'scalene triangle' };

  function compareQ(far, count){
    const cat = pick(CATS), deg = degIn(cat, far), vis = V.angle(deg);
    const why = whyCmp(cat);
    const ds = CATS.filter(function(c){ return c !== cat; }).map(function(c){ return opt(K.text(c), LAB[c], why(c)); });
    return mcq({
      prompt: 'Compare this angle with a right angle. Is it smaller than, bigger than, or a right angle?', visual: vis, correct: opt(K.text(cat), LAB[cat]), distractors: ds, count: count || 3,
      hint: 'Picture the corner of a book. Does this angle open wider than that corner, narrower, or exactly the same? A right angle has a little square.',
      explain: ex('Comparing with a right angle', ['A right angle is the square corner of a book (it has a little square mark).', cat === 'right' ? 'This angle has the little square and fits the corner exactly.' : 'This angle opens ' + (cat === 'smaller' ? '<b>narrower</b>' : '<b>wider</b>') + ' than a square corner.', 'So it is <b>' + LAB[cat] + '</b>. ✅']),
      truth: K.text(deg < 90 ? 'smaller' : (deg > 90 ? 'bigger' : 'right')), decode: function(){ return K.text(degCat(V.decodeAngle(vis))); }
    });
  }
  function isRightQ(){
    const right = chance(0.5), deg = right ? 90 : degIn(pick(['smaller', 'bigger']), true), vis = V.angle(deg);
    return mcq2({
      prompt: 'Is this angle a <b>right angle</b>?', visual: vis, correct: opt(K.bool(right), right ? 'Yes' : 'No'),
      other: opt(K.bool(!right), right ? 'No' : 'Yes', right ? 'Look for the little square mark in the corner: it shows a right angle.' : 'A right angle is exactly a square corner. This one is ' + (deg < 90 ? 'narrower' : 'wider') + '.'),
      hint: 'A right angle is a perfect square corner, like the corner of a page. Is this angle exactly that shape?',
      explain: ex('Right angle or not?', ['A right angle is a square corner, marked with a little square.', right ? 'This angle has the square mark and matches a page corner exactly.' : 'This angle is ' + (deg < 90 ? '<b>narrower</b>' : '<b>wider</b>') + ' than a page corner.', right ? 'So the answer is <b>Yes</b>. ✅' : 'So the answer is <b>No</b>. ✅']),
      truth: K.bool(deg === 90), decode: function(){ return K.bool(V.decodeAngle(vis) === 90); }
    });
  }
  function envQ(cats, count){
    const target = pick(cats);
    const pickItem = function(c){ return pick(ENV[c]); };
    const correctItem = pickItem(target);
    const ds = CATS.filter(function(c){ return c !== target; }).map(function(c){ const it = pickItem(c); return opt(K.text(it), it, 'This one is ' + LAB[c] + ' (about ' + ENVDEG[it] + ' degrees). Picture it next to the corner of a book.'); });
    const q = mcq({
      prompt: 'Which one has an angle that is <b>' + LAB[target] + '</b>?', visual: '', correct: opt(K.text(correctItem), correctItem), distractors: ds, count: count || 3,
      hint: 'Think of the corner of a book as your measuring tool. Which one fits it exactly, is narrower, or is wider?',
      explain: ex('Angles around us', ['A right angle is the square corner of a book.', 'Compare each one with that corner.', 'So the answer is <b>' + correctItem + '</b>: its angle is ' + LAB[target] + '. ✅']),
      truth: 'pending'
    });
    const fits = q.options.filter(function(o){ return degCat(ENVDEG[Object.keys(ENVDEG).filter(function(k){ return K.text(k) === o.key; })[0]]) === target; });
    q.truthKey = fits.length === 1 ? fits[0].key : 'fits:' + fits.length;
    return q;
  }
  function angleOptsQ(askCat){
    const degs = {};
    CATS.forEach(function(c){ degs[c] = degIn(c, false); });
    const q = mcq({
      prompt: 'Which angle is <b>' + LAB[askCat] + '</b>?', visual: '',
      correct: opt(K.text(askCat), V.angle(degs[askCat])),
      distractors: CATS.filter(function(c){ return c !== askCat; }).map(function(c){ return opt(K.text(c), V.angle(degs[c]), 'This angle is ' + LAB[c] + '. Compare it with the corner of a book.'); }),
      count: 3, hint: 'Imagine the corner of a book in each picture. Which angle fits it exactly, is narrower, or is wider?',
      explain: ex('Picking the angle', ['Compare every angle with a square corner.', 'One is exactly square (it has the little square mark), one is narrower, one is wider.', 'The one that is <b>' + LAB[askCat] + '</b> is the right picture. ✅']),
      truth: K.text(askCat)
    });
    q.optionsAreVisual = true;
    q.decodeKey = function(){
      let found = null;
      for(let i = 0; i < q.options.length; i++){
        const c = degCat(V.decodeAngle(q.options[i].label));
        if(K.text(c) !== q.options[i].key) return 'option ' + i + ' picture does not match its key';
        if(c === askCat) found = q.options[i].key;
      }
      return found;
    };
    return q;
  }
  function rightCountQ(){
    const sh = pick(SHAPES), vis = V.shape2D(sh), n = V.decodePolygon(vis).rightAngles;
    return numeric({
      prompt: 'How many <b>right angles</b> does this shape have?', visual: vis, answer: n,
      hint: 'Check every corner against the corner of a book. A right angle looks exactly square.',
      explain: ex('Counting right angles', ['Go round the shape, one corner at a time.', 'Count only the corners that are exactly square.', 'This ' + SHNAME[sh] + ' has <b>' + n + '</b> right angle' + (n === 1 ? '' : 's') + '. ✅']),
      truth: LITRA[sh] || 0, decode: function(){ return V.decodePolygon(vis).rightAngles; },
      wrong: function(v){ return v === V.decodePolygon(vis).sides ? 'That is the number of corners. Only the square corners count.' : ''; }
    });
  }
  const CLOCKH = [1, 2, 3, 4, 5, 9, 10, 11];
  function clockQ(bridge){
    const h = pick(CLOCKH), vis = V.clock(h, 0);
    const deg = Math.min(30 * h, 360 - 30 * h), cat = degCat(deg);
    const labs = bridge ? { smaller: 'acute (smaller than a right angle)', right: 'right angle', bigger: 'obtuse (bigger than a right angle)' } : LAB;
    const ds = CATS.filter(function(c){ return c !== cat; }).map(function(c){ return opt(K.text(c), labs[c], 'At ' + h + ' o’clock the hands make a ' + deg + ' degree angle. That is ' + LAB[cat] + ', not ' + LAB[c] + '.'); });
    return mcq({
      prompt: 'It is ' + h + ' o’clock. Look at the small angle between the two hands. Is it ' + (bridge ? 'acute, right or obtuse?' : 'smaller than, bigger than, or a right angle?'), visual: vis,
      correct: opt(K.text(cat), labs[cat]), distractors: ds, count: 3,
      hint: 'At 3 o’clock the hands make a perfect square corner. Is ' + h + ' o’clock closer together than that, or further apart?',
      explain: ex('Angle between clock hands', ['Each hour on a clock is one twelfth of a turn, so the hands at ' + h + ' o’clock are ' + Math.min(h, 12 - h) + ' hour-gaps apart.', 'At 3 o’clock there are 3 gaps and the angle is a right angle.', Math.min(h, 12 - h) === 3 ? 'Here there are 3 gaps too.' : 'Here there are ' + (Math.min(h, 12 - h) < 3 ? 'fewer' : 'more') + ' gaps.', 'So the angle is <b>' + labs[cat] + '</b>' + (bridge ? ' (Year 4 words: acute = smaller, obtuse = bigger)' : '') + '. ✅']),
      truth: K.text(degCat(Math.min(30 * h, 360 - 30 * h))), decode: function(){ const d = V.decodeClock(vis); const hh = d.h % 12; return K.text(degCat(Math.min(30 * hh, 360 - 30 * hh))); }
    });
  }
  function acuteQ(){
    const cat = pick(CATS), deg = degIn(cat, false), vis = V.angle(deg);
    const labs = { smaller: 'acute angle', right: 'right angle', bigger: 'obtuse angle' };
    const ds = CATS.filter(function(c){ return c !== cat; }).map(function(c){ return opt(K.text(c), labs[c], 'The word ' + (c === 'smaller' ? 'acute' : (c === 'bigger' ? 'obtuse' : 'right')) + ' means ' + LAB[c] + '. This angle is ' + LAB[cat] + '.'); });
    return mcq({
      prompt: '<b>Year 4 words:</b> acute means smaller than a right angle, obtuse means bigger than a right angle (but less than a straight line). What type of angle is this?', visual: vis,
      correct: opt(K.text(cat), labs[cat]), distractors: ds, count: 3,
      hint: 'First decide: is it smaller than, the same as, or bigger than a square corner? Then pick the matching word.',
      explain: ex('Acute, right or obtuse? (a Year 4 bridge question)', ['Compare with a right angle (a square corner).', 'This angle is <b>' + LAB[cat] + '</b>.', 'Smaller = acute, exactly square = right angle, bigger = obtuse. So it is <b>' + art(labs[cat]) + '</b>. ✅']),
      truth: K.text(degCat(deg)), decode: function(){ return K.text(degCat(V.decodeAngle(vis))); }
    });
  }
  function biggestQ(){
    const base = [20, 35, 50, 65, 80, 100, 115, 130, 145, 160];
    const ds3 = sample(base, 3).sort(function(a, b){ return a - b; });
    const askBig = chance(0.5);
    const ans = askBig ? ds3[2] : ds3[0];
    const q = mcq({
      prompt: 'Which angle is the <b>' + (askBig ? 'biggest' : 'smallest') + '</b>? (The ' + (askBig ? 'biggest angle opens the widest' : 'smallest angle opens the least') + '.)', visual: '',
      correct: opt(K.num(ans), V.angle(ans)),
      distractors: ds3.filter(function(d){ return d !== ans; }).map(function(d){ return opt(K.num(d), V.angle(d), 'This angle opens ' + (askBig ? 'less' : 'more') + ' than the one you want. Compare how far apart the two arms are.'); }),
      count: 3, hint: 'Look at how far apart the two arms are. The more they open, the bigger the angle.',
      explain: ex('Comparing three angles', ['Look at how wide each angle opens.', 'The arms are furthest ' + (askBig ? 'apart' : 'together') + ' in one picture.', 'The ' + (askBig ? 'biggest' : 'smallest') + ' angle is the one that opens ' + (askBig ? 'widest' : 'least') + '. ✅']),
      truth: K.num(askBig ? Math.max.apply(null, ds3) : Math.min.apply(null, ds3))
    });
    q.optionsAreVisual = true;
    q.decodeKey = function(){
      const ds = q.options.map(function(o){ return V.decodeAngle(o.label); });
      for(let i = 0; i < ds.length; i++) if(K.num(ds[i]) !== q.options[i].key) return 'option ' + i + ' picture does not match its key';
      return K.num(askBig ? Math.max.apply(null, ds) : Math.min.apply(null, ds));
    };
    return q;
  }
  function mostQ(){
    const pool0 = ['triangle_right', 'parallelogram', 'trapezium', 'kite', 'pentagon', 'hexagon', 'triangle_equilateral', 'triangle_isosceles', 'triangle_scalene'];
    const target = pick(['square', 'rectangle', 'triangle_right']);
    const rest = shuffle(pool0.filter(function(n){ return n !== 'triangle_right' || target !== 'triangle_right'; }).filter(function(n){ return n !== target; }));
    const other = rest.slice(0, 2);
    const names = [target].concat(other);
    const q = mcq({
      prompt: 'Which shape has the <b>most right angles</b>?', visual: '', correct: opt(K.text(target), V.shape2D(target, { width: 120 })),
      distractors: other.map(function(n){ return opt(K.text(n), V.shape2D(n, { width: 120 }), 'This ' + SHNAME[n] + ' has ' + (LITRA[n] || 0) + ' right angle' + ((LITRA[n] || 0) === 1 ? '' : 's') + '. Count the square corners on every picture.'); }),
      count: 3, hint: 'Count the square corners on each picture. Which picture has the most?',
      explain: ex('Most right angles', ['Count the square corners on each shape: ' + names.map(function(n){ return SHNAME[n] + ' ' + (LITRA[n] || 0); }).join(', ') + '.', 'The biggest number is <b>' + (LITRA[target] || 0) + '</b>.', 'So the ' + SHNAME[target] + ' has the most right angles. ✅']),
      truth: K.text(names.slice().sort(function(a, b){ return (LITRA[b] || 0) - (LITRA[a] || 0); })[0])
    });
    q.optionsAreVisual = true;
    q.decodeKey = function(){
      const counts = q.options.map(function(o){ return V.decodePolygon(o.label).rightAngles; });
      const mx = Math.max.apply(null, counts);
      if(counts.filter(function(c){ return c === mx; }).length !== 1) return 'no single winner';
      return q.options[counts.indexOf(mx)].key;
    };
    return q;
  }
  function twoShapesQ(){
    const a = pick(SHAPES), b = pick(SHAPES);
    const vis = '<div style="display:flex;gap:8px;justify-content:center;flex-wrap:wrap">' + V.shape2D(a, { width: 120 }) + V.shape2D(b, { width: 120 }) + '</div>';
    const ans = (LITRA[a] || 0) + (LITRA[b] || 0);
    return numeric({
      prompt: 'How many <b>right angles</b> are there in these two shapes <b>altogether</b>?', visual: vis, answer: ans,
      hint: 'Count the square corners in the first shape, then in the second, and add.',
      explain: ex('Two shapes', ['The ' + SHNAME[a] + ' has <b>' + (LITRA[a] || 0) + '</b> right angle' + ((LITRA[a] || 0) === 1 ? '' : 's') + '.', 'The ' + SHNAME[b] + ' has <b>' + (LITRA[b] || 0) + '</b>.', (LITRA[a] || 0) + ' + ' + (LITRA[b] || 0) + ' = <b>' + ans + '</b>. ✅']),
      truth: (LITRA[b] || 0) + (LITRA[a] || 0), decode: function(){ return vis.split('<svg').slice(1).reduce(function(t, s){ return t + V.decodePolygon('<svg' + s).rightAngles; }, 0); }
    });
  }

  registerSkill({
    id: 'geo-angles', strand: 'geometry', name: 'Right angles and angles', emoji: '📐', year: 3, order: 730, prereq: ['geo-2d-shapes'],
    lesson: {
      title: 'Angles',
      steps: [
        { say: 'An <b>angle</b> is made where two lines meet. A <b>right angle</b> is a perfect square corner, like the corner of a book. We mark it with a little <b>square</b>.', vis: { kind: 'angle', args: [90] } },
        { say: 'This angle is <b>smaller than a right angle</b>. The arms are closer together than a square corner.', vis: { kind: 'angle', args: [45] } },
        { say: 'This angle is <b>bigger than a right angle</b>. The arms open wider than a square corner.', vis: { kind: 'angle', args: [135] },
          quiz: { prompt: 'Is this angle smaller than, bigger than, or a right angle?', options: [{ label: 'Smaller than a right angle', ok: false }, { label: 'A right angle', ok: false }, { label: 'Bigger than a right angle', ok: true }], right: 'Yes! It opens wider than a square corner.', wrong: 'It opens wider than a square corner, so it is bigger than a right angle.' } },
        { say: 'Shapes have angles at their corners. The red squares show the <b>right angles</b>. This rectangle has <b>4 right angles</b>.', vis: { kind: 'shape2D', args: ['rectangle', { marks: true }] },
          quiz: { prompt: 'How many right angles does a square have?', options: [{ label: '2', ok: false }, { label: '4', ok: true }, { label: '0', ok: false }], right: 'Yes! A square has 4 square corners.', wrong: 'Every corner of a square is a square corner, so a square has 4 right angles.' } },
        { say: 'Right angles are everywhere: book corners, doors, windows. The hands of a clock at <b>3 o’clock</b> make a right angle too.', vis: { kind: 'clock', args: [3, 0] } },
        { say: '<b>Year 4 sneak peek:</b> an angle smaller than a right angle is called <b>acute</b>. An angle bigger than a right angle (but less than a straight line) is called <b>obtuse</b>.', vis: { kind: 'angle', args: [135] } }
      ]
    },
    trick: {
      title: 'The paper-corner test',
      say: 'Make your own right-angle tester! Fold a piece of paper twice to make a <b>square corner</b>. Put it in the corner of any angle. Fits exactly? <b>Right angle</b>. Paper sticks out? The angle is <b>smaller</b>. Gap left? It is <b>bigger</b>.',
      vis: { kind: 'angle', args: [90] },
      example: 'Paper corner fits exactly in the corner of a door → <b>right angle</b>'
    },
    gen: {
      1: function(){
        const r = randInt(1, 4);
        if(r === 1 || r === 2) return compareQ(true, 3);
        if(r === 3) return isRightQ();
        return envQ(['right'], 3);
      },
      2: function(){
        const r = randInt(1, 5);
        if(r === 1) return compareQ(false, 3);
        if(r === 2) return angleOptsQ(pick(CATS));
        if(r === 3) return rightCountQ();
        if(r === 4) return clockQ(false);
        return envQ(['smaller', 'bigger', 'right'], 3);
      },
      3: function(){
        const r = randInt(1, 6);
        if(r === 1) return acuteQ();
        if(r === 2) return clockQ(true);
        if(r === 3) return mostQ();
        if(r === 4) return twoShapesQ();
        if(r === 5) return biggestQ();
        return rightCountQ();
      }
    }
  });
})();
