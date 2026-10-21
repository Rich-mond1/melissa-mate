/* GEOMETRY 2 — 3D shapes: faces, edges, vertices. Counts come from the hand-checked V.FACTS3D table; the drawing is decoded from its SVG structure. */
(function(){
  const NAMES = ['cube', 'cuboid', 'square-based pyramid', 'triangular prism', 'cylinder', 'cone', 'sphere'];
  // independent hand-count (f = flat faces, c = curved surfaces, e = edges, v = vertices)
  const H = {
    cube: { f: 6, c: 0, e: 12, v: 8 }, cuboid: { f: 6, c: 0, e: 12, v: 8 }, 'square-based pyramid': { f: 5, c: 0, e: 8, v: 5 }, 'triangular prism': { f: 5, c: 0, e: 9, v: 6 },
    cylinder: { f: 2, c: 1, e: 2, v: 0 }, cone: { f: 1, c: 1, e: 1, v: 1 }, sphere: { f: 0, c: 1, e: 0, v: 0 }
  };
  NAMES.forEach(function(n){ const t = V.FACTS3D[n], h = H[n]; if(!t || t.flat !== h.f || t.curved !== h.c || t.edges !== h.e || t.vertices !== h.v) throw new Error('3D table disagrees with hand count for ' + n); });
  const DESC = {
    cube: 'has 6 square faces', cuboid: 'has 6 rectangle faces', 'square-based pyramid': 'has a square base and 4 triangle faces that meet at a point',
    'triangular prism': 'has 2 triangle ends and 3 rectangle faces', cylinder: 'has 2 flat circle ends and a curved side', cone: 'has 1 flat circle face, a curved side and a point', sphere: 'is round all over, with no flat faces'
  };
  const OBJ = {
    cube: ['a dice', 'a sugar cube', 'a small square gift box with equal sides'],
    cuboid: ['a cereal box', 'a brick', 'a shoe box', 'a tissue box'],
    cylinder: ['a tin of beans', 'a drinks can', 'a drum', 'a round candle'],
    cone: ['a party hat', 'an ice-cream cone', 'a traffic cone', 'a wizard’s hat'],
    sphere: ['a marble', 'a basketball', 'a bouncy ball', 'a globe'],
    'square-based pyramid': ['an Egyptian pyramid', 'a pyramid in Egypt'],
    'triangular prism': ['a camping tent', 'a tent with triangle ends']
  };
  const PROPN = { f: 'flat faces', e: 'edges', v: 'vertices' };
  const POLY = ['cube', 'cuboid', 'square-based pyramid', 'triangular prism'];
  const SING = { f: 'flat face', e: 'edge', v: 'vertex' };
  function propN(p, n){ return n === 1 ? SING[p] : PROPN[p]; }
  function art(n){ return /^[aeiou]/.test(n) ? 'an ' + n : 'a ' + n; }
  function cap(s){ return s.charAt(0).toUpperCase() + s.slice(1); }
  function artB(n){ return (/^[aeiou]/.test(n) ? 'An ' : 'A ') + '<b>' + n + '</b>'; }
  function cnt(n, one, many){ return n === 0 ? 'no ' + (many || one + 's') : n + ' ' + (n === 1 ? one : (many || one + 's')); }

  // read the shape's name from the structure of the drawing (circle / closed path / polygons and their proportions)
  function kind3D(html){
    if(/<circle/.test(html)) return 'sphere';
    if(/<path/.test(html)) return /Z"/.test(html) ? 'cone' : 'cylinder';
    const polys = (html.match(/<polygon points="[^"]*"/g) || []).map(function(t){ return t.slice(17, -1).trim().split(/\s+/).map(function(p){ return p.split(',').map(Number); }); });
    if(polys.length === 4) return 'triangular prism';
    if(polys.length === 3 && polys.some(function(p){ return p.length === 3; })) return 'square-based pyramid';
    if(polys.length === 3){
      const p = polys[0], xs = p.map(function(a){ return a[0]; }), ys = p.map(function(a){ return a[1]; });
      const w = Math.max.apply(null, xs) - Math.min.apply(null, xs), h = Math.max.apply(null, ys) - Math.min.apply(null, ys);
      return Math.abs(w / h - 1) < 0.05 ? 'cube' : 'cuboid';
    }
    return '?';
  }
  V.extra.geoShape3D = { render: function(name){ return V.shape3D(name); }, verify: function(args, html){ return kind3D(html) === args[0] ? '' : 'shape3D draws ' + kind3D(html) + ' not ' + args[0]; } };

  // a cube IS a special cuboid, so never offer them as rivals in 'which is a...' questions
  function others(target){ return NAMES.filter(function(n){ return n !== target && !(target === 'cube' && n === 'cuboid'); }); }
  function whyShape(x, target){ return cap(art(x)) + ' ' + DESC[x] + '. This shape ' + DESC[target] + '.'; }

  function nameQ(pool, count){
    const target = pick(pool), vis = V.shape3D(target);
    const ds = shuffle(others(target).filter(function(n){ return pool.indexOf(n) >= 0; })).map(function(x){ return opt(K.text(x), x, whyShape(x, target)); });
    return mcq({
      prompt: 'What is the name of this 3D shape?', visual: vis, correct: opt(K.text(target), target), distractors: ds, count: count,
      hint: 'Look at the faces. Are they flat or curved? Are there circles, squares or triangles?',
      explain: ex('Naming the 3D shape', ['Look at the faces: ' + (H[target].c ? 'there ' + (H[target].c === 1 ? 'is a curved surface' : 'are curved surfaces') + '.' : 'they are all flat.'), 'This shape has <b>' + cnt(H[target].f, 'flat face') + '</b>.', artB(target) + ' ' + DESC[target] + '. ✅']),
      truth: K.text(target), decode: function(){ return K.text(kind3D(vis)); }
    });
  }
  function objQ(pool, count){
    const target = pick(pool), obj = pick(OBJ[target]);
    const ds = shuffle(others(target).filter(function(n){ return pool.indexOf(n) >= 0; })).map(function(x){ return opt(K.text(x), x, cap(art(x)) + ' ' + DESC[x] + ', but ' + obj + ' ' + DESC[target].replace(/^has/, 'has').replace(/^is/, 'is') + '.'); });
    return mcq({
      prompt: 'Which 3D shape is <b>' + obj + '</b>?', visual: '', correct: opt(K.text(target), target), distractors: ds, count: count,
      hint: 'Picture the object in your hands. Is it round all over? Does it have flat sides? Pointy corners?',
      explain: ex('Shapes in real life', ['Think about ' + obj + '.', 'It ' + DESC[target].replace(/^has /, 'has ').replace(/^is /, 'is ') + '.', 'That is ' + art(target).replace(target, '<b>' + target + '</b>') + '. ✅']),
      truth: K.text(Object.keys(OBJ).filter(function(k){ return OBJ[k].indexOf(obj) >= 0; })[0])
    });
  }
  function pictureQ(pool, count){
    const target = pick(pool);
    const ds = shuffle(others(target).filter(function(n){ return pool.indexOf(n) >= 0 && !(target === 'cuboid' && n === 'cube'); })).map(function(x){ return opt(K.text(x), V.shape3D(x), 'That picture shows ' + art(x) + ': it ' + DESC[x] + '. ' + cap(art(target)) + ' ' + DESC[target] + '.'); });
    const q = mcq({
      prompt: 'Which picture shows ' + art(target) + '?', visual: '', correct: opt(K.text(target), V.shape3D(target)), distractors: ds, count: count,
      hint: 'Think about what ' + art(target) + ' is like: ' + (H[target].c ? 'does it have a curved surface?' : 'its faces are all flat.') + ' Then check each picture.',
      explain: ex('Finding ' + art(target), [cap(art(target)).replace(target, '<b>' + target + '</b>') + ' ' + DESC[target] + '.', 'Check each picture against that.', 'Only one matches: the <b>' + target + '</b>. ✅']),
      truth: K.text(target)
    });
    q.optionsAreVisual = true;
    q.decodeKey = function(){ for(let i = 0; i < q.options.length; i++) if(K.text(kind3D(q.options[i].label)) !== q.options[i].key) return 'option ' + i + ' picture does not match its key'; return q.options[q.correct].key; };
    return q;
  }

  /* counting questions */
  const HINTP = { f: 'A face is a flat surface you could put a sticker on. Count them all: top, bottom and the sides.', e: 'An edge is where two faces meet. Count top edges, bottom edges, then the edges going up and down.', v: 'A vertex is a corner, where edges meet. Count the corners on the top, then the bottom.' };
  function countQ(pool, props){
    const name = pick(pool), vis = V.shape3D(name), p = H[name].c > 0 ? 'f' : pick(props);
    const a = V.FACTS3D[name][{ f: 'flat', e: 'edges', v: 'vertices' }[p]];
    const wrong = [];
    ['f', 'e', 'v'].forEach(function(o){ if(o !== p && H[name].c === 0) wrong.push({ v: V.FACTS3D[name][{ f: 'flat', e: 'edges', v: 'vertices' }[o]], why: 'That is the number of ' + PROPN[o] + '. The question asks about ' + PROPN[p] + '.' }); });
    return mcqNum({
      prompt: 'How many <b>' + PROPN[p] + '</b> does ' + art(name) + ' have?', visual: vis, answer: a, wrong: wrong, nearby: [1, -1, 2, -2, 3, 4, -4], valid: function(v){ return v >= 0 && v <= 14; },
      hint: HINTP[p],
      explain: ex('Counting ' + PROPN[p], [HINTP[p].split('.')[0] + '.', 'On ' + art(name) + ' we count <b>' + a + '</b>.', 'So ' + art(name) + ' has <b>' + a + '</b> ' + (a === 1 ? PROPN[p].replace('faces', 'face').replace('edges', 'edge').replace('vertices', 'vertex') : PROPN[p]) + '. ✅']),
      truth: H[name][p], decode: function(){ return V.FACTS3D[kind3D(vis)][{ f: 'flat', e: 'edges', v: 'vertices' }[p]]; }
    });
  }
  function whichHasQ(pool, props, count){
    const p = pick(props);
    if(p !== 'f') pool = pool.filter(function(n){ return H[n].c === 0; });
    const target = pick(pool), val = H[target][p];
    const clue = p === 'f' ? cnt(val, 'flat face') : p === 'e' ? cnt(val, 'edge') : cnt(val, 'vertex', 'vertices');
    const ds = shuffle(pool.filter(function(n){ return H[n][p] !== val; })).map(function(x){ return opt(K.text(x), x, cap(art(x)) + ' has ' + cnt(H[x][p], p === 'f' ? 'flat face' : p === 'e' ? 'edge' : 'vertex', p === 'v' ? 'vertices' : undefined) + ', not ' + val + '.'); });
    const q = mcq({
      prompt: 'Which 3D shape has <b>' + clue + '</b>?', visual: '', correct: opt(K.text(target), target), distractors: ds, count: Math.min(count, ds.length + 1),
      hint: 'Picture each shape and count its ' + PROPN[p] + '. Rule out the ones that have a different number.',
      explain: ex('Counting ' + PROPN[p], [cap(art(target)) + ' has <b>' + clue + '</b>.', 'The others have different numbers, e.g. ' + art(ds[0].key.slice(2)) + ' has ' + cnt(H[ds[0].key.slice(2)][p], p === 'f' ? 'flat face' : p === 'e' ? 'edge' : 'vertex', p === 'v' ? 'vertices' : undefined) + '.', 'So the answer is the <b>' + target + '</b>. ✅']),
      truth: 'pending'
    });
    const fits = q.options.filter(function(o){ return H[o.key.slice(2)][p] === val; });
    q.truthKey = fits.length === 1 ? fits[0].key : 'fits:' + fits.length;
    return q;
  }

  function clueText(n, kind){
    if(kind === 'f') return n === 0 ? 'no flat faces' : cnt(n, 'flat face');
    if(kind === 'c') return n === 0 ? 'no curved surface' : cnt(n, 'curved surface');
    if(kind === 'e') return cnt(n, 'edge');
    return cnt(n, 'vertex', 'vertices');
  }
  function riddleQ(){
    const five = ['square-based pyramid', 'triangular prism', 'cylinder', 'cone', 'sphere'];
    const target = pick(five);
    let kinds = null;
    for(let t = 0; t < 40 && !kinds; t++){
      const k = H[target].c > 0 ? ['f', 'c'] : sample(['f', 'c', 'e', 'v'], randInt(2, 3));
      const fit = five.filter(function(n){ return k.every(function(x){ return H[n][x] === H[target][x]; }); });
      if(fit.length === 1) kinds = k;
    }
    kinds = kinds || (H[target].c > 0 ? ['f', 'c'] : ['f', 'c', 'e', 'v']);
    const clues = kinds.map(function(k){ return clueText(H[target][k], k); });
    const ds = shuffle(NAMES.filter(function(n){ return n !== target && kinds.some(function(k){ return H[n][k] !== H[target][k]; }); })).map(function(x){
      const bad = kinds.filter(function(k){ return H[x][k] !== H[target][k]; })[0];
      if(H[x].c > 0 && (bad === 'e' || bad === 'v')) return opt(K.text(x), x, cap(art(x)) + ' has a curved surface, but the riddle says ' + clueText(H[target].c, 'c') + '.');
      return opt(K.text(x), x, cap(art(x)) + ' has ' + clueText(H[x][bad], bad) + ', but the riddle says ' + clueText(H[target][bad], bad) + '.');
    });
    const q = mcq({
      prompt: 'I am a 3D shape. I have <b>' + clues.join('</b>, <b>').replace(/, ([^,]*)$/, ' and $1') + '</b>. What shape am I?', visual: '',
      correct: opt(K.text(target), target), distractors: ds, count: 4,
      hint: 'Use one clue at a time to cross shapes out. Which shapes have a curved surface? Which have vertices?',
      explain: ex('Solving the riddle', clues.map(function(c, i){ return 'Clue ' + (i + 1) + ': <b>' + c + '</b>. Shapes that fit: ' + NAMES.filter(function(n){ return H[n][kinds[i]] === H[target][kinds[i]]; }).join(', ') + '.'; }).concat(['Only the <b>' + target + '</b> fits every clue. ✅'])),
      truth: 'pending'
    });
    const fits = q.options.filter(function(o){ return kinds.every(function(k){ return V.FACTS3D[o.key.slice(2)][{ f: 'flat', c: 'curved', e: 'edges', v: 'vertices' }[k]] === H[target][k] || false; }); });
    q.truthKey = fits.length === 1 ? fits[0].key : 'fits:' + fits.length;
    return q;
  }
  function sumQ(){
    const a = pick(NAMES), b = pick(NAMES), p = (H[a].c > 0 || H[b].c > 0) ? 'f' : pick(['e', 'v', 'f']);
    const vis = '<div style="display:flex;gap:6px;justify-content:center;flex-wrap:wrap">' + V.shape3D(a) + V.shape3D(b) + '</div>';
    const ans = H[a][p] + H[b][p];
    const key = { f: 'flat', e: 'edges', v: 'vertices' }[p];
    return numeric({
      prompt: 'How many <b>' + PROPN[p] + '</b> do these two shapes have <b>altogether</b>?', visual: vis, answer: ans,
      hint: 'Count the ' + PROPN[p] + ' of the first shape, then of the second shape, then add.',
      explain: ex('Two shapes', [cap(art(a)) + ' has <b>' + H[a][p] + '</b> ' + propN(p, H[a][p]) + '.', cap(art(b)) + ' has <b>' + H[b][p] + '</b> ' + propN(p, H[b][p]) + '.', H[a][p] + ' + ' + H[b][p] + ' = <b>' + ans + '</b>. ✅']),
      truth: H[b][p] + H[a][p], decode: function(){ return vis.split('<svg').slice(1).reduce(function(t, s){ return t + V.FACTS3D[kind3D('<svg' + s)][key]; }, 0); },
      wrong: function(v){ return v === H[a][p] || v === H[b][p] ? 'That is only one of the shapes. Add both.' : ''; }
    });
  }
  function multiQ(){
    const name = pick(['cube', 'cuboid', 'square-based pyramid', 'triangular prism']), p = pick(['f', 'e', 'v']), m = randInt(2, 4);
    const vis = V.shape3D(name), key = { f: 'flat', e: 'edges', v: 'vertices' }[p];
    const ans = m * H[name][p];
    const nm = name === 'square-based pyramid' ? 'pyramid' : name === 'triangular prism' ? 'prism' : name;
    return numeric({
      prompt: 'Ellen has <b>' + m + '</b> of these shapes. How many <b>' + PROPN[p] + '</b> do they have altogether?', visual: vis, answer: ans,
      hint: 'First count the ' + PROPN[p] + ' on ONE shape. Then think: ' + m + ' lots of that number.',
      explain: ex('Counting lots of shapes', ['One ' + nm + ' has <b>' + V.FACTS3D[kind3D(vis)][key] + '</b> ' + PROPN[p] + '.', m + ' shapes: ' + m + ' × ' + V.FACTS3D[kind3D(vis)][key] + '.', m + ' × ' + H[name][p] + ' = <b>' + ans + '</b>. ✅']),
      truth: H[name][p] * m, decode: function(){ return V.FACTS3D[kind3D(vis)][key] * m; },
      wrong: function(v){ return v === H[name][p] ? 'That is just ONE shape. Ellen has ' + m + '.' : ''; }
    });
  }
  function cubeQ(){
    const others3 = ['cuboid', 'square-based pyramid', 'triangular prism', 'cylinder'];
    const askCube = chance(0.6);
    if(askCube){
      const ds = [opt(K.text('cuboid'), V.shape3D('cuboid'), 'That is a cuboid. Its faces are rectangles, not all the same size.')].concat(shuffle(others3.slice(1)).map(function(x){ return opt(K.text(x), V.shape3D(x), 'That picture shows ' + art(x) + ', which ' + DESC[x] + '.'); }));
      const q = mcq({
        prompt: 'Which picture shows a <b>cube</b>? (All its faces are the same size square.)', visual: '', correct: opt(K.text('cube'), V.shape3D('cube')), distractors: ds, keepOrder: true, count: 3,
        hint: 'A cube is the same length in every direction, like a dice. A cuboid is longer one way, like a cereal box.',
        explain: ex('Cube or cuboid?', ['A <b>cube</b> has 6 faces that are all the <b>same</b> square.', 'A cuboid is stretched in one direction, so its faces are rectangles.', 'The picture where the front is a perfect square is the <b>cube</b>. ✅']),
        truth: K.text('cube')
      });
      q.optionsAreVisual = true;
      q.decodeKey = function(){ for(let i = 0; i < q.options.length; i++) if(K.text(kind3D(q.options[i].label)) !== q.options[i].key) return 'option ' + i + ' picture does not match its key'; return q.options[q.correct].key; };
      return q;
    }
    const target = pick(['cube', 'cuboid']), vis = V.shape3D(target);
    return mcq2({
      prompt: 'Is this shape a cube? (A cube has 6 faces that are all the same square.)', visual: vis,
      correct: opt(K.bool(target === 'cube'), target === 'cube' ? 'Yes, it is a cube' : 'No, it is a cuboid'),
      other: opt(K.bool(target !== 'cube'), target === 'cube' ? 'No, it is a cuboid' : 'Yes, it is a cube', target === 'cube' ? 'Look at the front face: it is a square, and the sides are equal. That is a cube.' : 'The front face is a rectangle, not a square, so it is stretched. That is a cuboid.'),
      hint: 'Compare the length of the edges. Are they all the same, like on a dice?',
      explain: ex('Cube or cuboid?', ['Look at the front face of the shape.', target === 'cube' ? 'It is a perfect <b>square</b>, and the edges are all equal.' : 'It is a <b>rectangle</b>: longer than it is tall.', target === 'cube' ? 'So it <b>is a cube</b>: Yes, it is a cube. ✅' : 'So it is a cuboid, not a cube: No, it is a cuboid. ✅']),
      truth: K.bool(kind3D(V.shape3D(target)) === 'cube'), decode: function(){ return K.bool(kind3D(vis) === 'cube'); }
    });
  }
  function tfQ(){
    const name = pick(NAMES.filter(function(n){ return n !== 'cuboid'; })), p = H[name].c > 0 ? 'f' : pick(['f', 'e', 'v']);
    const vis = V.shape3D(name), key = { f: 'flat', e: 'edges', v: 'vertices' }[p];
    const real = H[name][p];
    const isTrue = chance(0.5);
    let shown = real;
    if(!isTrue){ const alt = [real + 1, real + 2, real - 1, 12 - real, 8, 6].filter(function(x){ return x >= 0 && x !== real && x <= 12; }); shown = pick(alt); }
    const singular = { f: 'flat face', e: 'edge', v: 'vertex' }[p], pl = { f: 'flat faces', e: 'edges', v: 'vertices' }[p];
    const stmt = cap(art(name)) + ' has ' + shown + ' ' + (shown === 1 ? singular : pl) + '.';
    return mcq2({
      prompt: 'True or false? <b>' + stmt + '</b>', visual: vis,
      correct: opt(K.bool(isTrue), isTrue ? 'True' : 'False'),
      other: opt(K.bool(!isTrue), isTrue ? 'False' : 'True', isTrue ? 'Count again: ' + art(name) + ' really does have ' + real + ' ' + (real === 1 ? singular : pl) + '.' : 'Count again: ' + art(name) + ' has ' + real + ' ' + (real === 1 ? singular : pl) + ', not ' + shown + '.'),
      hint: 'Count the ' + pl + ' on the picture yourself, then compare with the number in the sentence.',
      explain: ex('Checking a statement', ['Count the ' + pl + ' on ' + art(name) + ': there are <b>' + real + '</b>.', 'The sentence says <b>' + shown + '</b>.', isTrue ? 'They match, so the statement is <b>True</b>. ✅' : 'They do not match, so the statement is <b>False</b>. ✅']),
      truth: K.bool(V.FACTS3D[name][key] === shown), decode: function(){ return K.bool(V.FACTS3D[kind3D(vis)][key] === shown); }
    });
  }

  registerSkill({
    id: 'geo-3d-shapes', strand: 'geometry', name: '3D shapes: faces, edges, vertices', emoji: '🧊', year: 3, order: 720, prereq: ['geo-2d-shapes'],
    lesson: {
      title: 'Solid shapes',
      steps: [
        { say: 'A <b>3D shape</b> is solid, like something you can hold. A <b>face</b> is a flat surface. An <b>edge</b> is where two faces meet. A <b>vertex</b> is a corner. A <b>cube</b> has <b>6 faces</b>.', vis: { kind: 'geoShape3D', args: ['cube'] },
          quiz: { prompt: 'A cube has 8 corners. What do we call a corner of a 3D shape?', options: [{ label: 'A vertex', ok: true }, { label: 'An edge', ok: false }, { label: 'A face', ok: false }], right: 'Yes! One corner is a vertex, and many corners are vertices.', wrong: 'A corner is a vertex. A face is flat and an edge is a line where two faces meet.' } },
        { say: 'A cube has <b>6 faces</b>, <b>12 edges</b> and <b>8 vertices</b>. A <b>cuboid</b> has the very same numbers, but its faces are rectangles. Think of a cereal box.', vis: { kind: 'geoShape3D', args: ['cuboid'] } },
        { say: 'A <b>square-based pyramid</b> has <b>5 faces</b> (a square and 4 triangles), <b>8 edges</b> and <b>5 vertices</b>. A <b>triangular prism</b> has <b>5 faces</b>, <b>9 edges</b> and <b>6 vertices</b>.', vis: { kind: 'geoShape3D', args: ['square-based pyramid'] },
          quiz: { prompt: 'How many vertices does a square-based pyramid have?', options: [{ label: '4', ok: false }, { label: '5', ok: true }, { label: '8', ok: false }], right: 'Yes! 4 corners round the bottom and 1 at the top: 5.', wrong: 'Count the 4 corners of the square base, then add the 1 at the top: 5 vertices.' } },
        { say: 'Some shapes have <b>curved</b> surfaces. A <b>cylinder</b> has 2 flat circles and 1 curved side. A <b>cone</b> has 1 flat circle, 1 curved side and 1 vertex. A <b>sphere</b> is round all over, with no flat faces.', vis: { kind: 'geoShape3D', args: ['cylinder'] } },
        { say: 'Look around you! A dice is a <b>cube</b>, a tin of beans is a <b>cylinder</b>, a party hat is a <b>cone</b> and a ball is a <b>sphere</b>.', vis: { kind: 'geoShape3D', args: ['cone'] },
          quiz: { prompt: 'What shape is a tin of beans?', options: [{ label: 'Cylinder', ok: true }, { label: 'Cone', ok: false }, { label: 'Sphere', ok: false }], right: 'Yes! Two flat circles and a curved side: a cylinder.', wrong: 'A tin has two flat circle ends and a curved side. That is a cylinder.' } }
      ]
    },
    trick: {
      title: 'Count in groups',
      say: 'To count a <b>pyramid</b>: the base has <b>4</b> corners, plus <b>1</b> on top = <b>5</b> vertices. To count a <b>prism</b>: the two triangle ends have <b>3</b> corners each = <b>6</b>. Count the top and bottom first, then add the middle!',
      vis: { kind: 'geoShape3D', args: ['triangular prism'] },
      example: 'Triangular prism edges: 3 on one end + 3 on the other end + 3 joining them = <b>9</b>'
    },
    gen: {
      1: function(){
        const r = randInt(1, 3);
        if(r === 1) return nameQ(['cube', 'cuboid', 'cylinder', 'cone', 'sphere'], 3);
        if(r === 2) return objQ(['cube', 'cuboid', 'cylinder', 'cone', 'sphere'], 3);
        return pictureQ(['cube', 'cuboid', 'cylinder', 'cone', 'sphere'], 3);
      },
      2: function(){
        const r = randInt(1, 4);
        if(r === 1) return countQ(['cube', 'cuboid', 'square-based pyramid', 'triangular prism'], ['f', 'e', 'v']);
        if(r === 2) return countQ(['cylinder', 'cone', 'sphere'], ['f', 'v']);
        if(r === 3) return whichHasQ(NAMES, ['f', 'e', 'v'], 4);
        return objQ(NAMES.filter(function(n){ return n !== 'cuboid' || chance(0.8); }), 4);
      },
      3: function(){
        const r = randInt(1, 6);
        if(r === 1) return riddleQ();
        if(r === 2) return sumQ();
        if(r === 3) return multiQ();
        if(r === 4) return cubeQ();
        if(r === 5) return tfQ();
        return pictureQ(NAMES, 4);
      }
    }
  });
})();
