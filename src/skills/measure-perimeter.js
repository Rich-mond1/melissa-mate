/* MEASURE — perimeter of rectangles and simple polygons.
   New picture kind V.extra.perim: a shape DRAWN TO SCALE with labelled sides. The decoder reads the polygon's points and the
   side labels from the SVG, works out the scale, and measures the perimeter from the geometry (so unlabelled sides are checked too). */
(function(){
  const NAMES = ['Ana', 'Marcus', 'Sophie', 'Ivan', 'Lucy', 'Diego', 'Ellen', 'Tom', 'Aisha', 'Kai', 'Mei', 'Leo'];

  /* ---------------- the picture: render + decode ---------------- */
  function attr(tag, name){ const m = new RegExp(name + '="([^"]*)"').exec(tag); return m ? m[1] : null; }
  function tagsWith(html, cls){ return html.match(new RegExp('<[a-z]+[^>]*class="' + cls + '"[^>]*>', 'g')) || []; }
  function f2(x){ return (Math.round(x * 100) / 100).toString(); }
  function perimSvg(spec){
    const pts = spec.pts, n = pts.length, unit = spec.unit || 'cm';
    let minx = Infinity, maxx = -Infinity, miny = Infinity, maxy = -Infinity;
    pts.forEach(function(p){ minx = Math.min(minx, p[0]); maxx = Math.max(maxx, p[0]); miny = Math.min(miny, p[1]); maxy = Math.max(maxy, p[1]); });
    const W = 260, H = 200, padX = 50, padY = 34;
    const sc = Math.min((W - 2 * padX) / ((maxx - minx) || 1), (H - 2 * padY) / ((maxy - miny) || 1), 40);
    const ox = (W - (maxx - minx) * sc) / 2 - minx * sc, oy = (H - (maxy - miny) * sc) / 2 - miny * sc;
    const P = pts.map(function(p){ return [p[0] * sc + ox, p[1] * sc + oy]; });
    let a2 = 0; for(let i = 0; i < n; i++){ const a = P[i], b = P[(i + 1) % n]; a2 += a[0] * b[1] - b[0] * a[1]; }
    const sgn = a2 > 0 ? 1 : -1;
    let s = '<polygon class="poly" points="' + P.map(function(p){ return f2(p[0]) + ',' + f2(p[1]); }).join(' ') + '" fill="#CFE1FF" stroke="var(--vis-ink,#1B1B2F)" stroke-width="4" stroke-linejoin="round"/>';
    P.forEach(function(p){ s += '<circle cx="' + f2(p[0]) + '" cy="' + f2(p[1]) + '" r="4" fill="var(--vis-warm,#F2C94C)" stroke="var(--vis-ink,#1B1B2F)" stroke-width="1.5"/>'; });
    Object.keys(spec.labels || {}).forEach(function(k){
      const i = +k, a = P[i], b = P[(i + 1) % n], dx = b[0] - a[0], dy = b[1] - a[1], len = Math.hypot(dx, dy);
      const nx = sgn * dy / len, ny = -sgn * dx / len, off = 11 + Math.abs(nx) * 20;
      const x = (a[0] + b[0]) / 2 + nx * off, y = (a[1] + b[1]) / 2 + ny * (11 + Math.abs(ny) * 4) + 5;
      s += '<text class="sl" data-i="' + i + '" data-v="' + spec.labels[k] + '" x="' + f2(x) + '" y="' + f2(y) + '" text-anchor="middle" font-size="15" font-weight="800" fill="var(--vis-ink,#1B1B2F)">' + spec.labels[k] + ' ' + unit + '</text>';
    });
    return '<svg viewBox="0 0 ' + W + ' ' + H + '" width="' + W + '" role="img" style="max-width:100%;height:auto;display:block;margin:0 auto" xmlns="http://www.w3.org/2000/svg" font-family="-apple-system,Segoe UI,Roboto,Arial,sans-serif">' + s + '</svg>';
  }
  function decodePerim(html){   // -> {perimeter, sides:[lengths in units]} measured from the drawing; perimeter NaN if labels disagree with the geometry
    const poly = tagsWith(html, 'poly')[0];
    const pts = attr(poly, 'points').trim().split(/\s+/).map(function(p){ return p.split(',').map(Number); });
    const n = pts.length, px = [];
    for(let i = 0; i < n; i++){ const a = pts[i], b = pts[(i + 1) % n]; px.push(Math.hypot(b[0] - a[0], b[1] - a[1])); }
    const L = tagsWith(html, 'sl').map(function(t){ return { i: +attr(t, 'data-i'), v: +attr(t, 'data-v') }; });
    if(!L.length) return { perimeter: NaN, sides: [] };
    const scs = L.map(function(l){ return px[l.i] / l.v; });
    const lo = Math.min.apply(null, scs), hi = Math.max.apply(null, scs);
    if(hi / lo > 1.02) return { perimeter: NaN, sides: [] };       // a label that does not match its side
    const sc = scs.reduce(function(x, y){ return x + y; }, 0) / scs.length;
    const sides = px.map(function(x){ return Math.round(x / sc * 100) / 100; });
    return { perimeter: Math.round(sides.reduce(function(x, y){ return x + y; }, 0) * 100) / 100, sides: sides };
  }
  V.extra.perim = {
    render: function(spec){ return perimSvg(spec); },
    verify: function(args, html){ const d = decodePerim(html); return Math.abs(d.perimeter - args[1]) < 0.011 ? '' : 'perim picture measures ' + d.perimeter + ' not ' + args[1]; }
  };
  V.decodePerim = decodePerim;   // exposed for other strands/tools

  /* ---------------- shapes (unit coordinates; side i runs from point i to point i+1) ---------------- */
  function rect(w, h, all, unit){ return { pts: [[0, 0], [w, 0], [w, h], [0, h]], labels: all ? { 0: w, 1: h, 2: w, 3: h } : { 0: w, 1: h }, unit: unit || 'cm' }; }
  function square(s, all, unit){ return { pts: [[0, 0], [s, 0], [s, s], [0, s]], labels: all ? { 0: s, 1: s, 2: s, 3: s } : { 0: s }, unit: unit || 'cm' }; }
  const TRIPLES = [[3, 4, 5], [6, 8, 10], [5, 12, 13]];
  function rtri(t, unit){ return { pts: [[0, 0], [t[0], 0], [0, -t[1]]], labels: { 0: t[0], 1: t[2], 2: t[1] }, unit: unit || 'cm' }; }                // sides a, hyp, b
  function itri(t, unit){ return { pts: [[0, 0], [2 * t[0], 0], [t[0], -t[1]]], labels: { 0: 2 * t[0], 1: t[2], 2: t[2] }, unit: unit || 'cm' }; }       // base, leg, leg
  function para(a, unit, all){ return { pts: [[0, 0], [a, 0], [a + 3, -4], [3, -4]], labels: all ? { 0: a, 1: 5, 2: a, 3: 5 } : { 0: a, 1: 5 }, unit: unit || 'cm' }; }
  function trap(b, unit){ return { pts: [[0, 0], [b, 0], [b - 3, -4], [3, -4]], labels: { 0: b, 1: 5, 2: b - 6, 3: 5 }, unit: unit || 'cm' }; }
  function reg(n, s, unit){
    const R = s / (2 * Math.sin(Math.PI / n)), pts = [];
    for(let i = 0; i < n; i++){ const a = -Math.PI / 2 + i * 2 * Math.PI / n; pts.push([R * Math.cos(a), R * Math.sin(a)]); }
    return { pts: pts, labels: { 0: s }, unit: unit || 'cm' };
  }
  function lshape(W, H, w1, h1, unit, all){
    const lab = all === false ? { 0: W, 5: H } : { 0: W, 1: h1, 2: W - w1, 3: H - h1, 4: w1, 5: H };
    return { pts: [[0, 0], [W, 0], [W, h1], [w1, h1], [w1, H], [0, H]], labels: lab, unit: unit || 'cm' };
  }
  const SHAPE_NAME = { 3: 'triangle', 5: 'pentagon', 6: 'hexagon', 8: 'octagon' };
  function amt(u){ return function(v){ return v + ' ' + u; }; }
  function add(list){ return list.join(' + '); }
  function sum(a){ return a.reduce(function(x, y){ return x + y; }, 0); }
  function measured(vis){ return Math.round(decodePerim(vis).perimeter); }
  function measuredSide(vis, i){ return Math.round(decodePerim(vis).sides[i]); }
  function capital(s){ return s.charAt(0).toUpperCase() + s.slice(1); }
  const UN = { cm: 'cm', m: 'm' };

  registerSkill({
    id: 'measure-perimeter', strand: 'measure', name: 'Perimeter', emoji: '🔲', year: 3, order: 650, prereq: ['number-place-value'],
    lesson: {
      title: 'Perimeter: all the way round',
      steps: [
        { say: 'The <b>perimeter</b> is the distance <b>all the way round</b> the edge of a shape. Imagine walking round it. Add every side: 5 + 3 + 5 + 3 = <b>16 cm</b>.', vis: { kind: 'perim', args: [rect(5, 3, true), 16] } },
        { say: 'A rectangle has <b>two pairs</b> of equal sides. If you see only two labels, the sides across from them are the <b>same</b>. So 6 + 4 + 6 + 4 = <b>20 cm</b>.', vis: { kind: 'perim', args: [rect(6, 4, false), 20] },
          quiz: { prompt: 'A rectangle is 7 cm long and 2 cm wide. What is its perimeter?', options: [{ label: '18 cm', ok: true }, { label: '9 cm', ok: false }, { label: '14 cm', ok: false }], right: 'Yes! 7 + 2 + 7 + 2 = 18 cm.', wrong: 'Add ALL four sides: 7 + 2 + 7 + 2 = 18 cm. (9 cm only counts two sides.)' } },
        { say: 'Any shape works the same way: add up <b>every side</b>. This triangle has sides 3, 4 and 5: 3 + 4 + 5 = <b>12 cm</b>.', vis: { kind: 'perim', args: [rtri(TRIPLES[0]), 12] } },
        { say: 'If all the sides are <b>equal</b>, multiply! This hexagon has <b>6</b> sides of 4 cm. 6 × 4 = <b>24 cm</b>.', vis: { kind: 'perim', args: [reg(6, 4), 24] },
          quiz: { prompt: 'A pentagon has 5 equal sides of 3 cm. What is the perimeter?', options: [{ label: '15 cm', ok: true }, { label: '8 cm', ok: false }, { label: '12 cm', ok: false }], right: 'Yes! 5 × 3 = 15 cm.', wrong: '5 sides, each 3 cm: 5 × 3 = 15 cm.' } }
      ]
    },
    trick: {
      title: 'Walk round and tick each side',
      say: 'Put your finger on one corner and <b>walk round the edge</b>, saying each side. Do not stop until you are back at the start! For a rectangle: add the length and the width, then <b>double</b> it.',
      vis: { kind: 'perim', args: [rect(7, 4, false), 22] },
      example: '7 + 4 = 11, and double 11 is <b>22 cm</b>'
    },
    gen: {
      1: function(){ return pick([t1Rect, t1Rect, t1Square, t1Tri, t1Tri, t1Meaning])(); },
      2: function(){ return pick([t2Rect, t2Rect, t2Rect, t2Regular, t2Para, t2Story, t2Square])(); },
      3: function(){ return pick([t3L, t3L, t3Missing, t3Missing, t3Compare, t3Trap, t3Story, t3LHard])(); }
    }
  });

  function wrongsRect(w, h, u){
    return [
      { v: w + h, why: 'You added only two sides. A rectangle has FOUR sides: add them all.' },
      { v: w * h, why: 'You multiplied — that finds the area (the space inside). Perimeter means adding the sides all the way round.' },
      { v: 2 * w + h, why: 'You missed one side. Add all four: two lengths and two widths.' },
      { v: w + 2 * h, why: 'You missed one side. Add all four: two lengths and two widths.' }
    ];
  }

  /* ------------------------------ tier 1 ------------------------------ */
  function t1Rect(){
    let w, h; do { w = randInt(3, 9); h = randInt(2, 6); } while(w === h || w * h === 2 * (w + h));
    const vis = V.extra.perim.render(rect(w, h, true)), P = 2 * (w + h);
    return mcqNum({
      prompt: 'What is the perimeter of this rectangle?', visual: vis, answer: P, fmt: amt('cm'), wrong: wrongsRect(w, h),
      nearby: [2, -2, 4, -4],
      valid: function(v){ return v > 0; },
      hint: 'Perimeter = all the way round. Add all four sides together.',
      explain: ex('Adding all the sides', ['The four sides are ' + w + ', ' + h + ', ' + w + ' and ' + h + ' cm.', add([w, h, w, h]) + ' = ?', 'The perimeter is <b>' + P + ' cm</b>. ✅']),
      truth: sum([w, h, w, h]), decode: function(){ return measured(vis); }
    });
  }
  function t1Square(){
    const s = randInt(2, 8), vis = V.extra.perim.render(square(s, true)), P = 4 * s;
    return mcqNum({
      prompt: 'What is the perimeter of this square?', visual: vis, answer: P, fmt: amt('cm'),
      wrong: [
        { v: s * s, why: 'You multiplied the side by itself — that is the area. Perimeter adds the four sides.' },
        { v: 2 * s, why: 'You added only two sides. A square has four.' },
        { v: 3 * s, why: 'You missed one side. A square has FOUR sides.' }
      ],
      nearby: [4, -4, 2, -2, 1],
      valid: function(v){ return v > 0 && v !== s * s || v === s * s && false; },
      hint: 'A square has four sides. Add them all.',
      explain: ex('Perimeter of a square', ['All four sides are ' + s + ' cm.', add([s, s, s, s]) + ' = ?', 'The perimeter is <b>' + P + ' cm</b>. ✅']),
      truth: s + s + s + s, decode: function(){ return measured(vis); }
    });
  }
  function t1Tri(){
    const t = pick(TRIPLES.slice(0, 2).concat(TRIPLES.slice(0, 2))), isIso = chance(0.5);
    const spec = isIso ? itri(t) : rtri(t), vis = V.extra.perim.render(spec);
    const sides = isIso ? [2 * t[0], t[2], t[2]] : [t[0], t[2], t[1]], P = sum(sides);
    const nm = isIso ? 'triangle' : 'triangle';
    const mx = Math.max.apply(null, sides), mn = Math.min.apply(null, sides);
    return mcqNum({
      prompt: 'What is the perimeter of this triangle?', visual: vis, answer: P, fmt: amt('cm'),
      wrong: [
        { v: P - mx, why: 'You missed out the longest side. A triangle has THREE sides to add.' },
        { v: P - mn, why: 'You missed one side. Add all three.' },
        { v: sides[0] + sides[1], why: 'You added only two sides. A triangle has three.' },
        { v: P + sides[0], why: 'One side was counted twice. Add each side once.' }
      ],
      nearby: [2, -2, 3, -3],
      valid: function(v){ return v > 0; },
      hint: 'Add the three side lengths. Check you used every side once.',
      explain: ex('Adding the sides', ['The three sides are ' + sides.join(', ') + ' cm.', add(sides) + ' = ?', 'The perimeter is <b>' + P + ' cm</b>. ✅']),
      truth: sides[2] + sides[1] + sides[0], decode: function(){ return measured(vis); }
    });
  }
  function t1Meaning(){
    const w = randInt(3, 8), h = randInt(2, 5) + (w === 2 ? 1 : 0), vis = V.extra.perim.render(rect(w, h === w ? h + 1 : h, true));
    const ok = 'The distance all the way round the edge';
    const ds = [
      opt(K.text('inside'), 'The space inside the shape', 'That is the AREA. Perimeter is the edge, not the inside.'),
      opt(K.text('long'), 'The length of the longest side', 'Perimeter uses ALL the sides, not just one.'),
      opt(K.text('corners'), 'The number of corners', 'Perimeter is a distance, not a count of corners.')
    ];
    return mcq({
      prompt: 'What does the perimeter of a shape mean?', visual: vis,
      correct: opt(K.text('round'), ok), distractors: ds, count: 3, keepOrder: true,
      hint: 'Think of a fence round a field, or walking round the edge of a playground.',
      explain: ex('What is perimeter?', ['Imagine walking round the <b>outside edge</b> of the shape.', 'The distance you walk is the perimeter.', 'So perimeter is <b>' + ok.toLowerCase() + '</b>. ✅']),
      truth: K.text('round')
    });
  }

  /* ------------------------------ tier 2 ------------------------------ */
  function t2Rect(){
    const u = chance(0.7) ? 'cm' : 'm';
    let w, h; do { w = randInt(4, 12); h = randInt(2, 8); } while(w === h || w * h === 2 * (w + h) || w - h < 1);
    const vis = V.extra.perim.render(rect(w, h, false, u)), P = 2 * (w + h);
    return mcqNum({
      prompt: 'What is the perimeter of this rectangle?', visual: vis, answer: P, fmt: amt(u), wrong: wrongsRect(w, h),
      nearby: [2, -2, 4, -4, 6],
      valid: function(v){ return v > 0; },
      hint: 'Only two sides are labelled. The sides across from them are equal. Add all four sides.',
      explain: ex('Perimeter of a rectangle', ['The side across from ' + w + ' ' + u + ' is also ' + w + ' ' + u + '. The side across from ' + h + ' ' + u + ' is also ' + h + ' ' + u + '.', add([w, h, w, h]) + ' = ?', 'The perimeter is <b>' + P + ' ' + u + '</b>. ✅']),
      truth: (w + h) * 2, decode: function(){ return measured(vis); }
    });
  }
  function t2Square(){
    const u = chance(0.7) ? 'cm' : 'm', s = randInt(3, 12), vis = V.extra.perim.render(square(s, false, u)), P = 4 * s;
    return mcqNum({
      prompt: 'This square has 4 equal sides. What is its perimeter?', visual: vis, answer: P, fmt: amt(u),
      wrong: [
        { v: s * s, why: 'You multiplied — that is the area. Perimeter adds the sides: ' + s + ' + ' + s + ' + ' + s + ' + ' + s + '.' },
        { v: 2 * s, why: 'A square has FOUR equal sides, so you need all four.' },
        { v: 3 * s, why: 'You missed one side. A square has four.' },
        { v: s + 4, why: 'You added the side and the number of sides. Multiply instead: 4 sides of ' + s + '.' }
      ],
      nearby: [4, -4, 8],
      valid: function(v){ return v > 0 && v !== P; },
      hint: 'Only one side is labelled, but all four sides are the same. 4 lots of the side.',
      explain: ex('Perimeter of a square', ['All 4 sides are ' + s + ' ' + u + '.', '4 × ' + s + ' = ' + add([s, s, s, s]) + '.', 'The perimeter is <b>' + P + ' ' + u + '</b>. ✅']),
      truth: s * 2 * 2, decode: function(){ return measured(vis); }
    });
  }
  function t2Regular(){
    const n = pick([3, 5, 6, 8]), s = randInt(2, 9), vis = V.extra.perim.render(reg(n, s)), P = n * s;
    return mcqNum({
      prompt: 'All the sides of this ' + SHAPE_NAME[n] + ' are the same length. What is its perimeter?', visual: vis, answer: P, fmt: amt('cm'),
      wrong: [
        { v: n + s, why: 'You added the number of sides and the length. Multiply: ' + n + ' sides of ' + s + ' cm.' },
        { v: (n - 1) * s, why: 'You missed one side. A ' + SHAPE_NAME[n] + ' has ' + n + ' sides.' },
        { v: (n + 1) * s, why: 'You counted one side too many. A ' + SHAPE_NAME[n] + ' has ' + n + ' sides.' },
        { v: 2 * s, why: 'You added only two sides. Count all ' + n + '.' }
      ],
      nearby: [s, -s, 2, -2],
      valid: function(v){ return v > 0; },
      hint: 'Count the sides first. Then there are that many lots of ' + s + ' cm.',
      explain: ex('Equal sides', ['A ' + SHAPE_NAME[n] + ' has <b>' + n + ' sides</b>, each ' + s + ' cm.', n + ' × ' + s + (n <= 6 ? ' = ' + add(Array(n).fill(s)) : '') + ' = ?', 'The perimeter is <b>' + P + ' cm</b>. ✅']),
      truth: sum(Array(n).fill(s)), decode: function(){ return measured(vis); }
    });
  }
  function t2Para(){
    const a = randInt(6, 12), vis = V.extra.perim.render(para(a)), P = 2 * (a + 5);
    return mcqNum({
      prompt: 'Opposite sides of this shape are equal. What is its perimeter?', visual: vis, answer: P, fmt: amt('cm'),
      wrong: [
        { v: a + 5, why: 'You added only two sides. This shape has four sides.' },
        { v: a * 5, why: 'You multiplied — that is not the perimeter. Add all the sides.' },
        { v: 2 * a + 5, why: 'You missed one slanted side.' },
        { v: a + 10, why: 'You missed one of the long sides.' }
      ],
      nearby: [2, -2, 4],
      valid: function(v){ return v > 0; },
      hint: 'The two labelled sides each have an equal partner on the other side. Add all four.',
      explain: ex('Perimeter', ['The sides are ' + a + ', 5, ' + a + ' and 5 cm.', add([a, 5, a, 5]) + ' = ?', 'The perimeter is <b>' + P + ' cm</b>. ✅']),
      truth: (a + 5) * 2, decode: function(){ return measured(vis); }
    });
  }
  const STORY = [
    ['a rabbit run', 'a fence', 'How long is the fence?'], ['a picture', 'ribbon for a frame', 'How much ribbon is needed?'],
    ['a garden', 'a path edge', 'How long is the path edge?'], ['a playground', 'a rope', 'How long is the rope?'],
    ['a card', 'a gold border', 'How long is the border?'], ['a pond', 'a safety fence', 'How long is the fence?']
  ];
  function t2Story(){
    const st = pick(STORY), nm = pick(NAMES), m = chance(0.5), u = m ? 'm' : 'cm';
    let w, h; do { w = m ? randInt(5, 15) : randInt(10, 30); h = m ? randInt(3, 9) : randInt(5, 18); } while(w === h || w - h < 2 || w * h === 2 * (w + h));
    const vis = V.extra.perim.render(rect(w, h, false, u)), P = 2 * (w + h);
    return mcqNum({
      prompt: nm + ' goes all the way round ' + st[0] + ' with ' + st[1] + '. The shape is a rectangle, drawn here. ' + st[2], visual: vis, answer: P, fmt: amt(u),
      wrong: wrongsRect(w, h).concat([{ v: w + h + w + h + w, why: 'One side was counted twice.' }]),
      nearby: [2, -2, 4, -4, 10],
      valid: function(v){ return v > 0; },
      hint: '“All the way round” means perimeter. Add the length and width, then double it.',
      explain: ex('Going all the way round', ['“All the way round” means the perimeter.', add([w, h, w, h]) + ' = ?', nm + ' needs <b>' + P + ' ' + u + '</b>. ✅']),
      truth: w + w + h + h, decode: function(){ return measured(vis); }
    });
  }

  /* ------------------------------ tier 3 ------------------------------ */
  function t3L(){
    const u = chance(0.7) ? 'cm' : 'm';
    const W = randInt(6, 12), H = randInt(5, 9), w1 = randInt(2, W - 3), h1 = randInt(2, H - 2), P = 2 * (W + H);
    const spec = lshape(W, H, w1, h1, u), vis = V.extra.perim.render(spec);
    const sides = [W, h1, W - w1, H - h1, w1, H];
    return numeric({
      prompt: 'This L-shape has its side lengths marked. What is its perimeter in ' + (u === 'cm' ? 'centimetres' : 'metres') + '?', visual: vis, answer: P, unit: u,
      hint: 'Walk all the way round the edge. There are SIX sides — add every one.',
      explain: ex('Perimeter of an L-shape', ['Walk round and add all six sides: ' + sides.join(', ') + ' ' + u + '.', add(sides) + ' = ?', 'The perimeter is <b>' + P + ' ' + u + '</b>. ✅']),
      truth: W + W + H + H, decode: function(){ return measured(vis); },
      wrong: function(v){ return v === W + H ? 'You added only two sides. Add all six.' : v === sum(sides) - sides[2] || v === sum(sides) - sides[3] ? 'You missed a side. Go all the way round: there are six.' : v === W * H ? 'You multiplied — that is not the perimeter.' : ''; }
    });
  }
  function t3LHard(){
    const u = 'cm', W = randInt(7, 12), H = randInt(6, 9), w1 = randInt(2, W - 4), h1 = randInt(2, H - 3), P = 2 * (W + H);
    const spec = lshape(W, H, w1, h1, u, false), vis = V.extra.perim.render(spec);
    return numeric({
      prompt: 'Only the top and the left side of this L-shape are marked. What is the perimeter in cm?', visual: vis, answer: P, unit: 'cm',
      hint: 'Think of the notch: the "steps" in the edge together are as long as the missing top and side. Can you imagine the rectangle around it?',
      explain: ex('A clever way', ['Imagine a big rectangle ' + W + ' cm by ' + H + ' cm around the L-shape.', 'The steps cut into the corner, but the edge still goes the same total distance across and down.', 'So the perimeter is 2 × (' + W + ' + ' + H + ') = <b>' + P + ' cm</b>. ✅']),
      truth: (W + H) * 2, decode: function(){ return measured(vis); },
      wrong: function(v){ return v === W + H ? 'That is only half way round. Double it.' : ''; }
    });
  }
  function t3Missing(){
    const u = chance(0.7) ? 'cm' : 'm';
    let w, h; do { w = randInt(6, 14); h = randInt(2, 9); } while(w <= h + 1);
    const P = 2 * (w + h), vis = V.extra.perim.render({ pts: [[0, 0], [w, 0], [w, h], [0, h]], labels: { 0: w }, unit: u });
    return numeric({
      prompt: 'The perimeter of this rectangle is ' + P + ' ' + u + '. The top side is ' + w + ' ' + u + '. How long is the right-hand side?', visual: vis, answer: h, unit: u,
      hint: 'The top and bottom are both ' + w + ' ' + u + '. Take them away from the perimeter, then share what is left between the two other sides.',
      explain: ex('Finding a missing side', ['Top and bottom together: ' + w + ' + ' + w + ' = ' + (2 * w) + ' ' + u + '.', 'The two short sides share what is left: ' + P + ' − ' + (2 * w) + ' = ' + (P - 2 * w) + ' ' + u + '.', 'One short side: ' + (P - 2 * w) + ' ÷ 2 = <b>' + h + ' ' + u + '</b>. ✅']),
      truth: (P / 2) - w, decode: function(){ return measuredSide(vis, 1); },
      wrong: function(v){ return v === P - 2 * w ? 'That is BOTH short sides together. Share it between the two.' : v === P - w ? 'You took away only one long side.' : ''; }
    });
  }
  function t3Compare(){
    let a, b, c, d, PA, PB;
    do { a = randInt(3, 11); b = randInt(2, 7); c = randInt(3, 11); d = randInt(2, 7); PA = 2 * (a + b); PB = 2 * (c + d); } while(Math.abs(PA - PB) < 4 || a === b || c === d || a < b || c < d);
    const u = 'cm', sA = rect(a, b, false, u), sB = rect(c, d, false, u);
    const va = V.extra.perim.render(sA), vb = V.extra.perim.render(sB);
    const vis = '<div style="display:flex;flex-wrap:wrap;justify-content:center;gap:4px"><div style="text-align:center;font-weight:800;width:260px;max-width:100%">Shape A' + va + '</div><div style="text-align:center;font-weight:800;width:260px;max-width:100%">Shape B' + vb + '</div></div>';
    const big = PA > PB ? 'Shape A' : 'Shape B', small = PA > PB ? 'Shape B' : 'Shape A';
    return mcq2({
      prompt: 'Which rectangle has the longer perimeter?', visual: vis,
      correct: opt(K.text(big), big),
      other: opt(K.text(small), small, 'Work out both perimeters: A is ' + PA + ' cm and B is ' + PB + ' cm. ' + small + ' is the smaller.'),
      hint: 'Find the perimeter of each rectangle (double length + width), then compare.',
      explain: ex('Comparing perimeters', ['A: ' + a + ' + ' + b + ' + ' + a + ' + ' + b + ' = <b>' + PA + ' cm</b>.', 'B: ' + c + ' + ' + d + ' + ' + c + ' + ' + d + ' = <b>' + PB + ' cm</b>.', (PA > PB ? PA + ' is more than ' + PB : PB + ' is more than ' + PA) + ', so <b>' + big + '</b> has the longer perimeter. ✅']),
      truth: K.text([['Shape A', a + b + a + b], ['Shape B', c + d + c + d]].sort(function(x, y){ return y[1] - x[1]; })[0][0]),
      decode: function(){ return K.text(measured(va) > measured(vb) ? 'Shape A' : 'Shape B'); }
    });
  }
  function t3Trap(){
    const b = randInt(9, 14), vis = V.extra.perim.render(trap(b)), top = b - 6, P = b + 5 + top + 5;
    return numeric({
      prompt: 'What is the perimeter of this shape in cm?', visual: vis, answer: P, unit: 'cm',
      hint: 'It has four sides, and all four are labelled. Add them all.',
      explain: ex('Perimeter of a trapezium', ['The four sides are ' + b + ', 5, ' + top + ' and 5 cm.', add([b, 5, top, 5]) + ' = ?', 'The perimeter is <b>' + P + ' cm</b>. ✅']),
      truth: 5 + 5 + b + top, decode: function(){ return measured(vis); },
      wrong: function(v){ return v === P - top || v === P - b ? 'You missed out one of the sides. Add all four.' : v === 2 * (b + 5) ? 'The top is not the same as the bottom here. Use ' + top + ' cm for the top.' : ''; }
    });
  }
  function t3Story(){
    const nm = pick(NAMES), form = randInt(0, 2);
    if(form === 0){
      let w, h; do { w = randInt(8, 25); h = randInt(4, 14); } while(w - h < 3);
      const vis = V.extra.perim.render(rect(w, h, false, 'm')), P = 2 * (w + h), cost = 3;
      return numeric({
        prompt: nm + ' runs once all the way round this field. How many metres does ' + nm + ' run?', visual: vis, answer: P, unit: 'm',
        hint: 'Once all the way round = the perimeter. Add all four sides.',
        explain: ex('Running round the field', ['The field is a rectangle: ' + w + ' m and ' + h + ' m, twice each.', add([w, h, w, h]) + ' = ?', nm + ' runs <b>' + P + ' m</b>. ✅']),
        truth: w + w + h + h, decode: function(){ return measuredSide(vis, 0) * 2 + measuredSide(vis, 1) * 2; }
      });
    }
    if(form === 1){
      const s = randInt(5, 14), laps = randInt(2, 3), vis = V.extra.perim.render(square(s, false, 'm')), P = 4 * s;
      return numeric({
        prompt: nm + ' walks ' + laps + ' times round this square pond. How many metres does ' + nm + ' walk altogether?', visual: vis, answer: laps * P, unit: 'm',
        hint: 'Step 1: the perimeter of the square. Step 2: multiply by the number of times round (' + laps + ').',
        explain: ex('Two steps', ['Perimeter of the square: 4 × ' + s + ' = <b>' + P + ' m</b>.', laps + ' times round: ' + laps + ' × ' + P + '.', nm + ' walks <b>' + (laps * P) + ' m</b>. ✅']),
        truth: sum(Array(laps).fill(P)), decode: function(){ return laps * 4 * measuredSide(vis, 0); },
        wrong: function(v){ return v === P ? 'That is only ONE time round. ' + nm + ' walks ' + laps + ' times round.' : ''; }
      });
    }
    const n = pick([5, 6, 8]), s = randInt(3, 9), vis = V.extra.perim.render(reg(n, s)), P = n * s;
    return numeric({
      prompt: nm + ' sticks a ribbon along every side of this ' + SHAPE_NAME[n] + ' (all sides equal). How many cm of ribbon does ' + nm + ' need?', visual: vis, answer: P, unit: 'cm',
      hint: 'Count the sides, then multiply by the length of one side.',
      explain: ex('Ribbon round a ' + SHAPE_NAME[n], ['A ' + SHAPE_NAME[n] + ' has <b>' + n + '</b> equal sides of ' + s + ' cm.', n + ' × ' + s + ' = ?', nm + ' needs <b>' + P + ' cm</b>. ✅']),
      truth: sum(Array(n).fill(s)), decode: function(){ return measured(vis); },
      wrong: function(v){ return v === n + s ? 'You added the number of sides and the length. Multiply them.' : v === (n - 1) * s ? 'You missed one side.' : ''; }
    });
  }
})();
