/* GEOMETRY 1 — 2D shapes. Every shape is NAMED by reading the drawn points (sides, right angles, equal sides, parallel pairs). */
(function(){
  const ALL = ['equilateral triangle', 'isosceles triangle', 'right-angled triangle', 'scalene triangle', 'square', 'rectangle', 'rhombus', 'parallelogram', 'trapezium', 'kite', 'pentagon', 'hexagon', 'octagon', 'circle'];
  const SHAPEKEY = { 'equilateral triangle': 'triangle_equilateral', 'isosceles triangle': 'triangle_isosceles', 'right-angled triangle': 'triangle_right', 'scalene triangle': 'triangle_scalene' };
  // hand-counted corners (independent of any drawing)
  const LITN = { triangle: 3, 'equilateral triangle': 3, 'isosceles triangle': 3, 'right-angled triangle': 3, 'scalene triangle': 3, square: 4, rectangle: 4, rhombus: 4, parallelogram: 4, trapezium: 4, kite: 4, pentagon: 5, hexagon: 6, octagon: 8 };
  const LITRA = { 'right-angled triangle': 1, square: 4, rectangle: 4 };
  const DEF = {
    triangle: 'has 3 sides', 'equilateral triangle': 'has 3 equal sides', 'isosceles triangle': 'has exactly 2 equal sides', 'right-angled triangle': 'has 1 right angle', 'scalene triangle': 'has 3 sides that are all different',
    square: 'has 4 equal sides and 4 right angles', rectangle: 'has 4 sides and 4 right angles', rhombus: 'has 4 equal sides and no right angles', parallelogram: 'has 2 pairs of parallel sides and no right angles',
    trapezium: 'has 4 sides and just 1 pair of parallel sides', kite: 'has 2 pairs of equal sides that sit next to each other', pentagon: 'has 5 sides', hexagon: 'has 6 sides', octagon: 'has 8 sides', circle: 'has no straight sides and no corners'
  };

  // NOTE: V.SHAPES.rhombus in visuals.js is really a square turned 45 degrees (4 right angles), so the rhombus is drawn here from its own points.
  const RHOMBUS = [[100, 25], [170, 85], [100, 145], [30, 85]];
  function draw(name, o){
    if(name === 'circle') return V.circle(o);
    if(name === 'rhombus') return V.polygon(RHOMBUS, o);
    if(name === 'triangle') return V.shape2D(pick(['triangle_equilateral', 'triangle_isosceles', 'triangle_scalene', 'triangle_right']), o);
    return V.shape2D(SHAPEKEY[name] || name, o);
  }
  function art(n){ return /^[aeiou]/.test(n) ? 'an ' + n : 'a ' + n; }
  function artB(n){ return (/^[aeiou]/.test(n) ? 'An ' : 'A ') + '<b>' + n + '</b>'; }
  function cap(s){ return s.charAt(0).toUpperCase() + s.slice(1); }
  function basic(n){ return /triangle$/.test(n) ? 'triangle' : n; }

  // facts read straight from the drawn polygon points (my own measurements)
  function polyFacts(html){
    const m = /class="poly" points="([^"]*)"/.exec(html);
    if(!m){ if(/class="circ"/.test(html)) return { circle: true, n: 0, ra: 0, pp: 0, adj: 0, eqMax: 0, allEq: false }; return null; }
    const pts = m[1].trim().split(/\s+/).map(function(p){ return p.split(',').map(Number); });
    const n = pts.length, len = [], vec = [];
    for(let i = 0; i < n; i++){ const a = pts[i], b = pts[(i + 1) % n]; vec.push([b[0] - a[0], b[1] - a[1]]); len.push(Math.hypot(b[0] - a[0], b[1] - a[1])); }
    let ra = 0;
    for(let i = 0; i < n; i++){ const u = vec[(i + n - 1) % n], v = vec[i]; if(Math.abs(u[0] * v[0] + u[1] * v[1]) / (len[(i + n - 1) % n] * len[i]) < 0.01) ra++; }
    let pp = 0;
    for(let i = 0; i < n; i++) for(let j = i + 1; j < n; j++) if(Math.abs(vec[i][0] * vec[j][1] - vec[i][1] * vec[j][0]) / (len[i] * len[j]) < 0.004) pp++;
    let adj = 0; for(let i = 0; i < n; i++) if(Math.abs(len[i] - len[(i + 1) % n]) <= 1.5) adj++;
    let eqMax = 1; for(let i = 0; i < n; i++){ let c = 0; for(let j = 0; j < n; j++) if(Math.abs(len[i] - len[j]) <= 1.5) c++; if(c > eqMax) eqMax = c; }
    return { circle: false, n: n, ra: ra, pp: pp, adj: adj, eqMax: eqMax, allEq: eqMax === n };
  }
  // the same facts, but from the library decoders (a different code path)
  function decFacts(html){
    if(V.decodeCircle(html)) return { circle: true, n: 0, ra: 0, pp: 0, eqMax: 0, allEq: false };
    const d = V.decodePolygon(html);
    return { circle: false, n: d.vertices, ra: d.rightAngles, pp: d.parallelPairs, eqMax: d.equalSides, allEq: d.allEqual };
  }
  // one exact name for a drawn shape
  function nameOf(f){
    if(f.circle) return 'circle';
    if(f.n === 3){ if(f.ra === 1) return 'right-angled triangle'; if(f.allEq) return 'equilateral triangle'; if(f.eqMax === 2) return 'isosceles triangle'; return 'scalene triangle'; }
    if(f.n === 4){
      if(f.ra === 4) return f.allEq ? 'square' : 'rectangle';
      if(f.allEq) return 'rhombus';
      if(f.pp === 2) return 'parallelogram';
      if(f.pp === 1) return 'trapezium';
      if(f.adj === undefined || f.adj >= 2 || f.eqMax === 2) return 'kite';
      return 'quadrilateral';
    }
    if(f.n === 5) return 'pentagon'; if(f.n === 6) return 'hexagon'; if(f.n === 8) return 'octagon';
    return 'polygon';
  }
  // "is this name TRUE of this shape?" using the loose (inclusive) maths meaning, so a distractor can never also be right
  const IS = {
    triangle: function(f){ return f.n === 3; },
    'equilateral triangle': function(f){ return f.n === 3 && f.allEq; },
    'isosceles triangle': function(f){ return f.n === 3 && f.eqMax >= 2; },
    'right-angled triangle': function(f){ return f.n === 3 && f.ra >= 1; },
    'scalene triangle': function(f){ return f.n === 3 && f.eqMax === 1; },
    square: function(f){ return f.n === 4 && f.ra === 4 && f.allEq; },
    rectangle: function(f){ return f.n === 4 && f.ra === 4; },
    rhombus: function(f){ return f.n === 4 && f.allEq; },
    parallelogram: function(f){ return f.n === 4 && f.pp >= 2; },
    trapezium: function(f){ return f.n === 4 && f.pp >= 1; },
    kite: function(f){ return f.n === 4 && (f.allEq || f.adj >= 2); },
    pentagon: function(f){ return f.n === 5; }, hexagon: function(f){ return f.n === 6; }, octagon: function(f){ return f.n === 8; },
    circle: function(f){ return !!f.circle; }
  };
  const FACT = {}; ALL.forEach(function(n){ FACT[n] = polyFacts(draw(n)); }); FACT.triangle = FACT['equilateral triangle'];

  function describe(f){
    if(f.circle) return 'has no straight sides and no corners';
    return 'has ' + f.n + ' sides' + (f.allEq ? ' (all equal)' : '') + ', ' + (f.ra ? f.ra + ' right angle' + (f.ra > 1 ? 's' : '') : 'no right angles') + ' and ' + (f.pp ? f.pp + ' pair' + (f.pp > 1 ? 's' : '') + ' of parallel sides' : 'no parallel sides');
  }
  function sidesOf(n){ return FACT[n] ? FACT[n].n : 3; }
  function closeFirst(names, n){ return shuffle(names).sort(function(a, b){ return Math.abs(sidesOf(a) - n) - Math.abs(sidesOf(b) - n); }); }
  function whyName(x, f){ return cap(art(x)) + ' ' + DEF[x] + ', but this shape ' + describe(f) + '.'; }
  function explainName(target, f){
    const steps = [];
    steps.push(f.circle ? 'It has <b>no straight sides</b> and <b>no corners</b>: it is one smooth curved line.' : 'Count the straight sides: <b>' + f.n + '</b>. A shape has as many corners as sides: <b>' + f.n + '</b>.');
    if(!f.circle && f.n === 4) steps.push('Look at the corners: <b>' + (f.ra ? f.ra + ' right angles' : 'no right angles') + '</b>. Are all 4 sides the same length? <b>' + (f.allEq ? 'Yes' : 'No') + '</b>.');
    else if(!f.circle && f.n === 3) steps.push('Look closely: <b>' + (f.ra ? 'it has a right angle' : 'no right angles') + '</b>, and the number of equal sides is <b>' + (f.allEq ? '3' : (f.eqMax === 2 ? '2' : 'none')) + '</b>.');
    steps.push(artB(target) + ' ' + DEF[target] + '. So this is ' + art(target).replace(target, '<b>' + target + '</b>') + '. ✅');
    return ex('Naming the shape', steps);
  }

  /* ----- generic builders ----- */
  function nameQ(targets, cands, count, hint){
    const target = pick(targets), vis = draw(target), f = polyFacts(vis);
    const wrongs = closeFirst(cands.filter(function(x){ return !IS[x](f); }), f.n);
    const ds = wrongs.map(function(x){ return opt(K.text(x), x, whyName(x, f)); });
    return mcq({
      prompt: 'What is the name of this shape?', visual: vis,
      correct: opt(K.text(target), target), distractors: ds, keepOrder: true, count: count, hint: hint,
      explain: explainName(target, f),
      truth: K.text(basic(nameOf(polyFacts(vis)))), decode: function(){ return K.text(cands.indexOf('triangle') >= 0 ? basic(nameOf(decFacts(vis))) : nameOf(decFacts(vis))); }
    });
  }
  function picKey(html, basicNames){ const nm = nameOf(decFacts(html)); return K.text(basicNames ? basic(nm) : nm); }

  // property question: "Which shape <text>?" with names or with pictures. Distractors are CHECKED against the property.
  function propQ(props, pool, asPics, count, hintTxt){
    const prop = pick(props);
    const matching = pool.filter(function(n){ return prop.pred(FACT[n]); });
    const non = pool.filter(function(n){ return !prop.pred(FACT[n]); });
    const target = pick(matching);
    const dn = closeFirst(non, FACT[target].n);
    const ds = dn.map(function(x){
      return opt(K.text(x), asPics ? draw(x, { width: 120 }) : x, cap(art(x)) + ' ' + describe(FACT[x]) + '. That does not match: the clue says the shape ' + prop.text + '.');
    });
    const q = mcq({
      prompt: 'Which shape ' + prop.text + '?', visual: '',
      correct: opt(K.text(target), asPics ? draw(target, { width: 120 }) : target), distractors: ds, keepOrder: true, count: count,
      hint: hintTxt || 'Check each shape against the clue, one at a time. Cross out any shape that does not fit.',
      explain: ex('Checking the clue', [
        'The clue says the shape <b>' + prop.text + '</b>.',
        artB(target) + ' ' + describe(FACT[target]) + ' — that fits the clue.',
        'The others do not fit. For example, ' + art(dn[0]) + ' ' + describe(FACT[dn[0]]) + '.',
        'So the answer is the <b>' + target + '</b>. ✅'
      ]),
      truth: 'pending'
    });
    function nameOfKey(k){ return k.slice(2); }
    // independent recompute: draw each option, measure it, and see which one fits the clue
    const fits = q.options.filter(function(o){ return prop.pred(polyFacts(draw(nameOfKey(o.key)))); });
    q.truthKey = fits.length === 1 ? fits[0].key : 'fits:' + fits.length;
    if(asPics){
      q.optionsAreVisual = true;
      q.decodeKey = function(){
        const found = [];
        for(let i = 0; i < q.options.length; i++){
          const o = q.options[i];
          if(picKey(o.label, false) !== o.key) return 'option ' + i + ' picture does not match its key';
          if(prop.pred(decFacts(o.label))) found.push(o.key);
        }
        return found.length === 1 ? found[0] : 'fits:' + found.length;
      };
    } else {
      q.decodeKey = function(){
        const found = [];
        q.options.forEach(function(o){ if(prop.pred(decFacts(draw(nameOfKey(o.key))))) found.push(o.key); });
        return found.length === 1 ? found[0] : 'fits:' + found.length;
      };
    }
    return q;
  }

  const T1 = ['triangle', 'square', 'rectangle', 'pentagon', 'hexagon', 'octagon', 'circle'];
  const P2 = [
    { text: 'has 3 sides', pred: function(f){ return f.n === 3; } },
    { text: 'has 5 sides', pred: function(f){ return f.n === 5; } },
    { text: 'has 6 sides', pred: function(f){ return f.n === 6; } },
    { text: 'has 8 sides', pred: function(f){ return f.n === 8; } },
    { text: 'has no corners and no straight sides', pred: function(f){ return !!f.circle; } },
    { text: 'has 4 right angles', pred: function(f){ return f.ra === 4; } },
    { text: 'has 4 equal sides and 4 right angles', pred: function(f){ return f.n === 4 && f.allEq && f.ra === 4; } },
    { text: 'has 4 equal sides and no right angles', pred: function(f){ return f.n === 4 && f.allEq && f.ra === 0; } }
  ];
  const P3 = [
    { text: 'has 4 sides and just 1 pair of parallel sides', pred: function(f){ return f.n === 4 && f.pp === 1; } },
    { text: 'has 4 sides and no parallel sides', pred: function(f){ return f.n === 4 && f.pp === 0; } },
    { text: 'has 2 pairs of parallel sides, no right angles and sides that are not all equal', pred: function(f){ return f.n === 4 && f.pp === 2 && f.ra === 0 && !f.allEq; } },
    { text: 'has 4 right angles but sides that are not all equal', pred: function(f){ return f.n === 4 && f.ra === 4 && !f.allEq; } },
    { text: 'has 3 equal sides', pred: function(f){ return f.n === 3 && f.allEq; } },
    { text: 'is a triangle with exactly 2 equal sides', pred: function(f){ return f.n === 3 && f.eqMax === 2; } },
    { text: 'has 1 right angle', pred: function(f){ return f.ra === 1; } },
    { text: 'has 3 pairs of parallel sides', pred: function(f){ return f.pp === 3; } },
    { text: 'has 4 equal sides and no right angles', pred: function(f){ return f.n === 4 && f.allEq && f.ra === 0; } },
    { text: 'has more than 5 sides', pred: function(f){ return f.n > 5; } },
    { text: 'has no right angles and no parallel sides', pred: function(f){ return !f.circle && f.ra === 0 && f.pp === 0; } }
  ];
  const POOL2 = ['right-angled triangle', 'square', 'rectangle', 'rhombus', 'parallelogram', 'trapezium', 'kite', 'pentagon', 'hexagon', 'octagon', 'circle'];

  V.extra.geoShape = {
    render: function(name, o){ return draw(name, o); },
    verify: function(args, html){ const n = nameOf(decFacts(html)); return (n === args[0] || basic(n) === args[0]) ? '' : 'shape draws ' + n + ' not ' + args[0]; }
  };

  registerSkill({
    id: 'geo-2d-shapes', strand: 'geometry', name: '2D shapes and their sides', emoji: '🔷', year: 3, order: 710, prereq: [],
    lesson: {
      title: 'Shape detectives',
      steps: [
        { say: 'A <b>2D shape</b> is flat, like a drawing. We describe it by its <b>sides</b> (straight lines) and <b>corners</b> (where two sides meet). This <b>triangle</b> has <b>3 sides</b> and <b>3 corners</b>.', vis: { kind: 'geoShape', args: ['isosceles triangle'] } },
        { say: 'A <b>right angle</b> is a square corner. The red marks show them. A <b>rectangle</b> has <b>4 sides</b> and <b>4 right angles</b>. A <b>square</b> is special: all 4 sides are <b>equal</b> too.', vis: { kind: 'geoShape', args: ['square', { marks: true }] },
          quiz: { prompt: 'A shape has 4 equal sides and 4 right angles. What is it?', options: [{ label: 'Square', ok: true }, { label: 'Pentagon', ok: false }, { label: 'Triangle', ok: false }], right: 'Yes! 4 equal sides and 4 square corners: a square.', wrong: 'Count again: 4 sides and 4 square corners make a square.' } },
        { say: 'More sides, more names! A <b>pentagon</b> has <b>5</b> sides, a <b>hexagon</b> has <b>6</b> and an <b>octagon</b> has <b>8</b>. This one is a <b>hexagon</b>.', vis: { kind: 'geoShape', args: ['hexagon'] },
          quiz: { prompt: 'How many sides does an octagon have?', options: [{ label: '5', ok: false }, { label: '6', ok: false }, { label: '8', ok: true }], right: 'Yes! Octagon = 8 sides, like an octopus has 8 arms.', wrong: 'An octagon has 8 sides. Pentagon is 5 and hexagon is 6.' } },
        { say: 'A <b>circle</b> has <b>no straight sides</b> and <b>no corners</b>. It is one smooth curved line.', vis: { kind: 'geoShape', args: ['circle'] } },
        { say: 'A <b>rhombus</b> is a pushed-over square: <b>4 equal sides</b> but <b>no right angles</b>. A <b>parallelogram</b> has two pairs of sides that run side by side (parallel).', vis: { kind: 'geoShape', args: ['rhombus'] },
          quiz: { prompt: 'Which shape has 4 equal sides but no right angles?', options: [{ label: 'Rhombus', ok: true }, { label: 'Rectangle', ok: false }, { label: 'Pentagon', ok: false }], right: 'Yes! The rhombus: 4 equal sides, no square corners.', wrong: 'A rectangle has right angles and a pentagon has 5 sides. Only the rhombus fits.' } },
        { say: 'A <b>trapezium</b> has just <b>one pair</b> of parallel sides (the top and bottom here). A <b>kite</b> has two pairs of equal sides that sit <b>next to each other</b>.', vis: { kind: 'geoShape', args: ['trapezium'] } }
      ]
    },
    trick: {
      title: 'Names hide numbers',
      say: 'Shape names hide a number! <b>Tri</b> = 3 (tricycle). <b>Quad</b> = 4 (quad bike). <b>Pent</b> = 5. <b>Hex</b> = 6. <b>Oct</b> = 8 (an octopus has 8 arms!). Count the sides, then say the name.',
      vis: { kind: 'geoShape', args: ['octagon'] },
      example: '8 sides → <b>oct</b>agon, like <b>oct</b>opus (8 arms)'
    },
    gen: {
      1: function(){
        const r = randInt(1, 4);
        if(r === 1 || r === 2) return nameQ(T1, T1, 3, 'Count the straight sides first. Does the shape have any corners at all?');
        if(r === 3){ // count sides or corners
          const name = pick(['equilateral triangle', 'isosceles triangle', 'square', 'rectangle', 'pentagon', 'hexagon', 'octagon']);
          const what = pick(['sides', 'corners']);
          const vis = draw(name), n = LITN[name];
          return mcqNum({
            prompt: 'How many ' + (what === 'sides' ? 'straight sides' : 'corners') + ' does this shape have?', visual: vis, answer: n,
            wrong: [{ v: n + 1, why: 'That is one too many. Put a dot on your starting ' + (what === 'sides' ? 'side' : 'corner') + ' so you do not count it twice.' }, { v: n - 1, why: 'That is one too few. Count every ' + (what === 'sides' ? 'side' : 'corner') + ' once, going round the shape.' }],
            valid: function(v){ return v >= 3 && v <= 10; }, count: 3,
            hint: 'Touch each ' + (what === 'sides' ? 'side' : 'corner') + ' with your finger as you count, going round the shape.',
            explain: ex('Counting the ' + what, ['Start at one ' + (what === 'sides' ? 'side' : 'corner') + ' and go round the shape.', 'Count every ' + (what === 'sides' ? 'side' : 'corner') + ' once.', 'There are <b>' + n + '</b> of them. (Every shape has the same number of sides and corners.) ✅']),
            truth: LITN[name], decode: function(){ const d = V.decodePolygon(vis); return what === 'sides' ? d.sides : d.vertices; }
          });
        }
        // which picture is a ...?
        const target = pick(T1);
        const tv = draw(target, { width: 120 }), tf = polyFacts(tv);
        const ds = shuffle(T1).filter(function(x){ return !IS[target](FACT[x]) && !IS[x](tf); }).map(function(x){ return opt(K.text(x), draw(x, { width: 120 }), 'That picture shows ' + art(x) + ', which ' + DEF[x] + '. A ' + target + ' ' + DEF[target] + '.'); });
        const q = mcq({
          prompt: 'Which picture shows ' + art(target) + '?', visual: '', correct: opt(K.text(target), tv), distractors: ds, count: 3,
          hint: 'Say what a ' + target + ' is like, then count the sides on each picture.',
          explain: ex('Finding ' + art(target), [artB(target) + ' ' + DEF[target] + '.', 'Count the sides on each picture and look for corners.', 'Only one picture fits: ' + art(target).replace(target, '<b>' + target + '</b>') + '. ✅']),
          truth: K.text(target)
        });
        q.optionsAreVisual = true;
        q.decodeKey = function(){ for(let i = 0; i < q.options.length; i++) if(picKey(q.options[i].label, true) !== q.options[i].key) return 'option ' + i + ' picture does not match its key'; return q.options[q.correct].key; };
        return q;
      },
      2: function(){
        const r = randInt(1, 4);
        if(r === 1 || r === 2) return nameQ(['rectangle', 'square', 'rhombus', 'parallelogram', 'trapezium', 'kite', 'pentagon', 'hexagon', 'octagon'], ['rectangle', 'square', 'rhombus', 'parallelogram', 'trapezium', 'kite', 'pentagon', 'hexagon', 'octagon', 'circle'], 4,
          'Count the sides first. For 4-sided shapes, check for right angles (square corners) and whether all the sides are equal.');
        if(r === 3){ // typed: right angles
          const name = pick(ALL.filter(function(n){ return n !== 'circle'; }));
          const vis = draw(name), f = polyFacts(vis), n = f.ra;
          return numeric({
            prompt: 'How many <b>right angles</b> (square corners) does this shape have?', visual: vis, answer: n,
            hint: 'A right angle looks like the corner of a book. Check each corner of the shape: does it look square?',
            explain: ex('Counting right angles', ['Go round the shape and check every corner.', 'A right angle is an exact square corner, like the corner of a page.', 'This shape has <b>' + n + '</b> right angle' + (n === 1 ? '' : 's') + '. ✅']),
            truth: LITRA[name] || 0, decode: function(){ return V.decodePolygon(vis).rightAngles; },
            wrong: function(v){ return v === f.n ? 'That is the number of corners. Only the square-looking corners are right angles.' : ''; }
          });
        }
        return propQ(P2, POOL2, false, 4);
      },
      3: function(){
        const r = randInt(1, 5);
        if(r === 1) return propQ(P3.concat(P2.slice(5)), ALL, false, 4);
        if(r === 2) return propQ(P3.concat(P2.slice(4)), ALL, true, 3, 'Check the clue against each picture in turn. Count sides and corners first, then look at the equal sides.');
        if(r === 3){ // triangle types
          const target = pick(['equilateral triangle', 'isosceles triangle', 'right-angled triangle', 'scalene triangle']);
          const vis = draw(target), f = polyFacts(vis);
          const tri = ['equilateral triangle', 'isosceles triangle', 'right-angled triangle', 'scalene triangle'];
          const ds = shuffle(tri).filter(function(x){ return !IS[x](f); }).map(function(x){ return opt(K.text(x), x, whyName(x, f)); });
          return mcq({
            prompt: 'What kind of triangle is this?', visual: vis, correct: opt(K.text(target), target), distractors: ds, count: 3, keepOrder: true,
            hint: 'Look for a square corner first. Then compare the lengths of the three sides.',
            explain: ex('Sorting triangles', ['Right angles: <b>' + f.ra + '</b>. Equal sides: <b>' + (f.allEq ? 'all 3' : (f.eqMax === 2 ? '2' : 'none')) + '</b>.', 'An <b>equilateral</b> has 3 equal sides, an <b>isosceles</b> has 2, a <b>scalene</b> has none, a <b>right-angled</b> triangle has a square corner.', 'This is a <b>' + target + '</b>. ✅']),
            truth: K.text(nameOf(polyFacts(vis))), decode: function(){ return K.text(nameOf(decFacts(vis))); }
          });
        }
        if(r === 4){ // two shapes, total corners
          const names = ['equilateral triangle', 'square', 'rectangle', 'pentagon', 'hexagon', 'octagon', 'rhombus', 'trapezium'];
          const a = pick(names), b = pick(names);
          const va = draw(a, { width: 120 }), vb = draw(b, { width: 120 });
          const vis = '<div style="display:flex;gap:8px;justify-content:center;flex-wrap:wrap">' + va + vb + '</div>';
          const ans = LITN[a] + LITN[b];
          return numeric({
            prompt: 'How many corners do these two shapes have <b>altogether</b>?', visual: vis, answer: ans,
            hint: 'Count the corners of the first shape, then the corners of the second shape, and add them.',
            explain: ex('Two shapes', ['The first shape is ' + art(a) + ': <b>' + LITN[a] + '</b> corners.', 'The second shape is ' + art(b) + ': <b>' + LITN[b] + '</b> corners.', LITN[a] + ' + ' + LITN[b] + ' = <b>' + ans + '</b> corners altogether. ✅']),
            truth: LITN[b] + LITN[a], decode: function(){ return vis.split('<svg').slice(1).reduce(function(t, s){ return t + V.decodePolygon('<svg' + s).vertices; }, 0); },
            wrong: function(v){ return v === LITN[a] || v === LITN[b] ? 'That is only one of the shapes. Add the corners of both.' : ''; }
          });
        }
        // spec question: pictures of triangles/quads - which has no right angles
        return propQ([{ text: 'has no right angles', pred: function(f){ return !f.circle && f.ra === 0; } }, { text: 'has a right angle', pred: function(f){ return f.ra >= 1; } }], ['right-angled triangle', 'square', 'rectangle', 'rhombus', 'kite', 'pentagon', 'trapezium', 'parallelogram'], true, 4, 'A right angle is a square corner. Look at every corner of each picture.');
      }
    }
  });
})();
