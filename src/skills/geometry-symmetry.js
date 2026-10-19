/* GEOMETRY 6 — Line symmetry (Year 4 bridge). Registers V.extra.symShape: a shape with a dashed vertical line.
   Its decoder reads the shape's points and the dashed line from the drawing and tests whether the mirror image of every corner lands on a corner. */
(function(){
  function f2(n){ return (Math.round(n * 100) / 100).toString(); }
  const HEX = V.regularPoints(6, 100, 85, 68, 0).map(function(p){ return [Math.round(p[0] * 100) / 100, Math.round(p[1] * 100) / 100]; });
  // hand-labelled: shapes whose mirror line is x = 100
  const SYMP = {
    house: [[100, 18], [160, 62], [160, 140], [40, 140], [40, 62]],
    triangle: [[100, 20], [160, 140], [40, 140]],
    kite: [[100, 16], [150, 60], [100, 150], [50, 60]],
    diamond: [[100, 22], [165, 85], [100, 148], [35, 85]],
    rectangle: [[40, 45], [160, 45], [160, 125], [40, 125]],
    hexagon: HEX,
    cross: [[80, 20], [120, 20], [120, 65], [165, 65], [165, 105], [120, 105], [120, 150], [80, 150], [80, 105], [35, 105], [35, 65], [80, 65]],
    arrow: [[100, 15], [150, 70], [120, 70], [120, 150], [80, 150], [80, 70], [50, 70]],
    trapezium: [[70, 40], [130, 40], [170, 130], [30, 130]],
    tshape: [[40, 30], [160, 30], [160, 65], [118, 65], [118, 140], [82, 140], [82, 65], [40, 65]]
  };
  const ASYMP = {
    rtriangle: [[40, 30], [40, 140], [170, 140]],
    parallelogram: [[60, 40], [170, 40], [140, 130], [30, 130]],
    lshape: [[50, 25], [90, 25], [90, 110], [160, 110], [160, 145], [50, 145]],
    scalene: [[30, 140], [170, 140], [120, 24]],
    flag: [[40, 20], [160, 45], [40, 85], [40, 150], [28, 150], [28, 20]],
    skewhouse: [[100, 18], [160, 95], [160, 140], [40, 140], [40, 62]],
    stairs: [[40, 140], [40, 100], [80, 100], [80, 60], [120, 60], [120, 25], [160, 25], [160, 140]],
    skewkite: [[86, 16], [150, 60], [100, 150], [50, 60]]
  };
  const CLEAR_ASYM = ['rtriangle', 'parallelogram', 'lshape', 'scalene', 'flag', 'stairs'];
  const NEAR_ASYM = ['skewhouse', 'skewkite', 'stairs', 'scalene', 'lshape'];
  const SIMPLE_SYM = ['triangle', 'rectangle', 'kite', 'house', 'diamond', 'arrow'];
  const SNAME = { house: 'house shape', triangle: 'triangle', kite: 'kite', diamond: 'diamond', rectangle: 'rectangle', hexagon: 'hexagon', cross: 'cross', arrow: 'arrow', trapezium: 'trapezium', tshape: 'T shape',
    rtriangle: 'right-angled triangle', parallelogram: 'parallelogram', lshape: 'L shape', scalene: 'lopsided triangle', flag: 'flag', skewhouse: 'lopsided house', stairs: 'staircase', skewkite: 'lopsided kite' };
  function lf(s){ return s.charAt(0).toLowerCase() + s.slice(1); }
  function pointsOf(name){ return SYMP[name] || ASYMP[name]; }
  function isSymHand(name, dx){ return !!SYMP[name] && dx === 0; }

  function renderSym(name, dx, width){
    const pts = pointsOf(name), ax = 100 + (dx || 0);
    const s = '<polygon class="sp" points="' + pts.map(function(p){ return f2(p[0]) + ',' + f2(p[1]); }).join(' ') + '" fill="#CFE1FF" stroke="var(--vis-ink,#1B1B2F)" stroke-width="4" stroke-linejoin="round"/>' +
      '<line class="axis" x1="' + f2(ax) + '" y1="6" x2="' + f2(ax) + '" y2="164" stroke="var(--vis-bad,#EB5757)" stroke-width="3" stroke-dasharray="7 5"/>';
    return '<svg viewBox="0 0 200 170" width="' + (width || 190) + '" role="img" style="max-width:100%;height:auto;display:block;margin:0 auto" xmlns="http://www.w3.org/2000/svg">' + s + '</svg>';
  }
  function readSym(html){
    const m = /class="sp" points="([^"]*)"/.exec(html), a = /<line[^>]*class="axis"[^>]*>/.exec(html);
    const pts = m[1].trim().split(/\s+/).map(function(p){ return p.split(',').map(Number); });
    const ax = parseFloat(/x1="([^"]*)"/.exec(a[0])[1]);
    return { pts: pts, ax: ax };
  }
  // do the mirror images of all corners land on corners (and the same number of corners)?
  function unmatched(pts, ax){
    const out = [];
    pts.forEach(function(p){
      const mx = 2 * ax - p[0];
      if(!pts.some(function(q){ return Math.abs(q[0] - mx) < 1.5 && Math.abs(q[1] - p[1]) < 1.5; })) out.push(p);
    });
    return out;
  }
  function decodeSym(html){ const r = readSym(html); return unmatched(r.pts, r.ax).length === 0; }
  V.extra.symShape = { render: renderSym, verify: function(a, html){ const want = isSymHand(a[0], a[1] || 0), got = decodeSym(html); return want === got ? '' : 'symShape draws symmetric=' + got + ' not ' + want; } };

  function why(name, dx){
    const r = readSym(renderSym(name, dx)), um = unmatched(r.pts, r.ax);
    if(!um.length) return 'Fold along the dashed line: every corner on one side has a matching corner on the other side, so the two halves fit exactly.';
    if(dx) return 'The dashed line is not in the middle of the shape, so the two halves are different sizes and do not fit.';
    const side = um[0][0] < r.ax ? 'left' : 'right';
    return 'Fold along the dashed line: a corner on the ' + side + ' side has no matching corner on the other side, so the halves do not fit.';
  }
  function pickCase(wantSym, mode){ // returns {name, dx}
    if(wantSym) return { name: pick(mode === 'simple' ? SIMPLE_SYM : Object.keys(SYMP)), dx: 0 };
    if(mode === 'moved' || (mode !== 'clear' && chance(0.35))) return { name: pick(['rectangle', 'house', 'kite', 'triangle', 'diamond', 'trapezium']), dx: pick([-34, -26, 26, 34]) };
    return { name: pick(mode === 'near' ? NEAR_ASYM : CLEAR_ASYM), dx: 0 };
  }

  function yesNoQ(mode){
    const sym = chance(0.5), c = pickCase(sym, mode === 'moved' ? 'moved' : (mode === 'simple' ? 'simple' : mode));
    const c2 = (!sym && mode === 'simple') ? pickCase(false, 'clear') : c;
    const vis = renderSym(c2.name, c2.dx), isSym = isSymHand(c2.name, c2.dx);
    return mcq2({
      prompt: pick(['This ', 'Look at this ']) + '<b>' + SNAME[c2.name] + '</b>' + (c2.dx ? '' : '') + '. Is the dashed line a <b>line of symmetry</b>? (Do the two halves match, like a mirror?)', visual: vis,
      correct: opt(K.bool(isSym), isSym ? 'Yes' : 'No'),
      other: opt(K.bool(!isSym), isSym ? 'No' : 'Yes', why(c2.name, c2.dx)),
      hint: 'Imagine folding the paper along the dashed line. Would every corner on one side land exactly on a corner on the other side?',
      explain: ex('Fold test', ['Think about folding the shape on the dashed line.', why(c2.name, c2.dx), isSym ? 'So the dashed line <b>is</b> a line of symmetry: <b>Yes</b>. ✅' : 'So the dashed line is <b>not</b> a line of symmetry: <b>No</b>. ✅']),
      truth: K.bool((function(){ const r = unmatched(pointsOf(c2.name), 100 + c2.dx); return r.length === 0; })()), decode: function(){ return K.bool(decodeSym(vis)); }
    });
  }
  function picOptsQ(asked, mode, total){ // asked: 'sym' (which IS symmetrical) | 'notsym' (which is NOT)
    const nSym = asked === 'sym' ? 1 : total - 1, nAsym = total - nSym;
    const used = {};
    const symCases = [], asyCases = [];
    for(let t = 0; t < 60 && symCases.length < nSym; t++){ const c = pickCase(true, mode === 'near' ? 'all' : 'simple'); if(!used[c.name]){ used[c.name] = 1; symCases.push(c); } }
    for(let t = 0; t < 60 && asyCases.length < nAsym; t++){ const c = pickCase(false, mode); const k = c.name + ':' + c.dx; if(!used[k] && !used[c.name]){ used[k] = 1; used[c.name] = 1; asyCases.push(c); } }
    const label = function(c){ return renderSym(c.name, c.dx, 120); };
    const key = function(c){ return K.text(c.name + (c.dx ? ':' + c.dx : '')); };
    const target = asked === 'sym' ? symCases[0] : asyCases[0], others = asked === 'sym' ? asyCases : symCases;
    const q = mcq({
      prompt: 'Which shape is <b>' + (asked === 'sym' ? 'symmetrical' : 'NOT symmetrical') + '</b> about its dashed line?', visual: '',
      correct: opt(key(target), label(target)),
      distractors: others.map(function(c){ return opt(key(c), label(c), asked === 'sym' ? why(c.name, c.dx) : 'This one IS symmetrical: ' + why(c.name, c.dx).replace(/^Fold along the dashed line: /, '')); }),
      count: total, hint: 'Fold each shape along its dashed line in your head. Look for the shape where the two halves do not match.',
      explain: ex('Checking each fold', ['Fold every shape along its dashed line.', 'The ' + (asked === 'sym' ? 'matching one' : 'odd one out') + ' is the ' + SNAME[target.name] + ': ' + lf(why(target.name, target.dx).replace(/^Fold along the dashed line: /, '')), 'So that picture is the answer. ✅']),
      truth: 'pending'
    });
    const cases = symCases.concat(asyCases), byKey = {}; cases.forEach(function(c){ byKey[key(c)] = c; });
    const hits = q.options.filter(function(o){ const c = byKey[o.key]; return unmatched(pointsOf(c.name), 100 + c.dx).length === 0 === (asked === 'sym'); });
    q.truthKey = hits.length === 1 ? hits[0].key : 'fits:' + hits.length;
    q.optionsAreVisual = true;
    q.decodeKey = function(){ const f = q.options.filter(function(o){ return decodeSym(o.label) === (asked === 'sym'); }); return f.length === 1 ? f[0].key : 'fits:' + f.length; };
    return q;
  }
  function halfDotsQ(){
    const n = randInt(2, 9), vis = V.dots(n);
    return numeric({
      prompt: 'These dots are on <b>one side</b> of a mirror line. The pattern is symmetrical, so the other side has the same dots. How many dots are in the <b>whole</b> pattern?', visual: vis, answer: n * 2,
      hint: 'The other side is an exact mirror copy, so it has the same number of dots. Add the two sides together.',
      explain: ex('Mirror pattern', ['One side has <b>' + n + '</b> dots.', 'The mirror side has the same: <b>' + n + '</b> dots.', n + ' + ' + n + ' = <b>' + (n * 2) + '</b> dots altogether. ✅']),
      truth: 2 * n, decode: function(){ return V.decodeDots(vis) * 2; }, wrong: function(v){ return v === n ? 'That is only ONE side. The mirror copy has dots too.' : ''; }
    });
  }
  function distanceQ(){
    const n = randInt(2, 6), who = pick(['A corner of a shape', 'The tip of a wing', 'A star on a butterfly']), apart = chance(0.5);
    if(!apart) return numeric({
      prompt: 'A shape is symmetrical about a dashed line. ' + who + ' is <b>' + n + ' cm</b> to the left of the line. How many cm to the <b>right</b> of the line is its matching point?', visual: '', answer: n,
      hint: 'A mirror image is the same distance from the line, just on the other side.',
      explain: ex('Same distance', ['Matching points are the same distance from the mirror line.', 'One is ' + n + ' cm to the left, so the other is <b>' + n + '</b> cm to the right.', 'The answer is <b>' + n + '</b>. ✅']), truth: n
    });
    return numeric({
      prompt: 'A shape is symmetrical about a dashed line. ' + who + ' is <b>' + n + ' cm</b> to the left of the line, and its matching point is on the right. How far apart are the two points?', visual: '', answer: 2 * n,
      hint: 'The matching point is the same distance from the line on the other side. Add the two distances.',
      explain: ex('Distance apart', ['Left point to line: <b>' + n + '</b> cm.', 'Line to right point: <b>' + n + '</b> cm too.', n + ' + ' + n + ' = <b>' + (2 * n) + '</b> cm apart. ✅']), truth: n + n,
      wrong: function(v){ return v === n ? 'That is only the distance on one side. Add the other side too.' : ''; }
    });
  }

  registerSkill({
    id: 'geo-symmetry', strand: 'geometry', name: 'Lines of symmetry', emoji: '🦋', year: 4, order: 760, prereq: ['geo-2d-shapes'],
    lesson: {
      title: 'Mirror, mirror',
      steps: [
        { say: 'A shape is <b>symmetrical</b> if you can fold it along a line and the two halves <b>match exactly</b>. The dashed line is the <b>line of symmetry</b>. Like a butterfly’s wings!', vis: { kind: 'symShape', args: ['kite', 0] } },
        { say: 'To check, look at the corners. Every corner on the left needs a <b>partner</b> on the right, the <b>same distance</b> from the line and at the same height.', vis: { kind: 'symShape', args: ['house', 0] } },
        { say: 'This triangle is <b>not</b> symmetrical about the dashed line. The corner on the left has no partner on the right, so the halves would not fit.', vis: { kind: 'symShape', args: ['rtriangle', 0] },
          quiz: { prompt: 'Would the two halves of this triangle match if you folded it on the dashed line?', options: [{ label: 'Yes', ok: false }, { label: 'No', ok: true }], right: 'Right! The halves are different, so it is not symmetrical.', wrong: 'The left half is much taller than the right half. They would not match.' } },
        { say: 'The line has to be in the right place! This rectangle is symmetrical about a line down its <b>middle</b>, but this dashed line is off to one side, so the halves are <b>different sizes</b>.', vis: { kind: 'symShape', args: ['rectangle', 34] },
          quiz: { prompt: 'Is this dashed line a line of symmetry?', options: [{ label: 'Yes', ok: false }, { label: 'No', ok: true }], right: 'Yes, you spotted it: the line is not in the middle, so it is not.', wrong: 'The left part is bigger than the right part. The line is not in the middle.' } },
        { say: '<b>Year 4 idea:</b> if you know one half of a symmetrical picture, you can draw the other half. Each point goes the <b>same distance</b> from the line on the other side. 3 dots on one side means <b>6 dots</b> in the whole pattern.', vis: { kind: 'symShape', args: ['arrow', 0] } }
      ]
    },
    trick: {
      title: 'The fold test',
      say: 'Pretend to <b>fold</b> the picture along the dashed line, or stand a small <b>mirror</b> on it. Does the mirror make the whole shape? Then it is symmetrical. Or <b>pair up the corners</b>: if any corner has no partner, it is not symmetrical.',
      vis: { kind: 'symShape', args: ['house', 0] },
      example: 'House: the top is in the middle, and the left and right corners are pairs → <b>symmetrical</b>'
    },
    gen: {
      1: function(){
        const r = randInt(1, 3);
        if(r === 1 || r === 2) return yesNoQ('simple');
        return picOptsQ('sym', 'clear', 3);
      },
      2: function(){
        const r = randInt(1, 4);
        if(r === 1) return yesNoQ('all');
        if(r === 2) return yesNoQ('moved');
        if(r === 3) return picOptsQ('notsym', 'clear', 3);
        return picOptsQ('sym', 'clear', 3);
      },
      3: function(){
        const r = randInt(1, 5);
        if(r === 1) return picOptsQ('notsym', 'near', 4);
        if(r === 2) return halfDotsQ();
        if(r === 3) return distanceQ();
        if(r === 4) return yesNoQ('near');
        return picOptsQ('notsym', 'near', 4);
      }
    }
  });
})();
