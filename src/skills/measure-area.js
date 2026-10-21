/* measure-area — Year 4: area by counting squares, rectangle area = length × width, missing sides, area vs perimeter, L-shapes. */
(function(){
  const NAMES = ['Ana', 'Marcus', 'Sophie', 'Ivan', 'Lucy', 'Diego', 'Ellen', 'Tom', 'Aisha', 'Kai', 'Mei', 'Leo'];
  const CELL = 26;
  /* a verified square-grid picture: every unit square is a <rect class="sq">; decoded by counting them and reading their positions */
  function sqRender(rows, cols, cells){
    const keep = cells || null; let s = '';
    for(let r = 0; r < rows; r++) for(let c = 0; c < cols; c++){
      if(keep && !keep.some(function(k){ return k[0] === r && k[1] === c; })) continue;
      s += '<rect class="sq" x="' + (8 + c * CELL) + '" y="' + (8 + r * CELL) + '" width="' + CELL + '" height="' + CELL + '" fill="#8EC5FF" stroke="#1B1B2F" stroke-width="1.5"/>';
    }
    return svgWrapLocal(cols * CELL + 16, rows * CELL + 16, s);
  }
  function svgWrapLocal(w, h, inner){ return '<svg viewBox="0 0 ' + w + ' ' + h + '" width="' + Math.min(w, 340) + '" role="img" style="max-width:100%;height:auto;display:block;margin:0 auto" xmlns="http://www.w3.org/2000/svg">' + inner + '</svg>'; }
  function sqDecode(html){
    const re = /<rect class="sq" x="(\d+)" y="(\d+)"/g, xs = {}, ys = {}; let m, n = 0;
    while((m = re.exec(html))){ xs[m[1]] = 1; ys[m[2]] = 1; n++; }
    return { count: n, cols: Object.keys(xs).length, rows: Object.keys(ys).length };
  }
  V.extra.sqgrid = { render: sqRender, verify: function(a, html){ const d = sqDecode(html); const want = a[2] ? a[2].length : a[0] * a[1]; return d.count === want ? '' : 'sqgrid draws ' + d.count + ' not ' + want; } };
  function sq(rows, cols, cells){ return sqRender(rows, cols, cells); }
  /* labelled rectangle as plain SVG with side labels (area picture is the grid; the labelled one is just a shape) */
  function rectLabelled(w, h, unit, hideW, hideH){
    const sc = Math.min(18, Math.floor(260 / w), Math.floor(130 / h)), pw = w * sc, ph = h * sc;
    const lw = hideW ? '?' : w + ' ' + unit, lh = hideH ? '?' : h + ' ' + unit;
    return '<svg viewBox="0 0 ' + (pw + 120) + ' ' + (ph + 50) + '" width="' + Math.min(pw + 120, 340) + '" role="img" style="max-width:100%;height:auto;display:block;margin:0 auto" xmlns="http://www.w3.org/2000/svg" font-family="-apple-system,Segoe UI,Roboto,Arial,sans-serif"><rect x="70" y="10" width="' + pw + '" height="' + ph + '" fill="#8EC5FF" stroke="#1B1B2F" stroke-width="2"/><text class="lw" x="' + (70 + pw / 2) + '" y="' + (ph + 36) + '" text-anchor="middle" font-size="16" font-weight="800" fill="#1B1B2F">' + lw + '</text><text class="lh" x="' + (64) + '" y="' + (10 + ph / 2 + 5) + '" text-anchor="end" font-size="16" font-weight="800" fill="#1B1B2F">' + lh + '</text></svg>';
  }
  function labelOf(html, cls){ const m = new RegExp('class="' + cls + '"[^>]*>([^<]*)<').exec(html); return m ? m[1] : ''; }
  function readNum(s){ const m = /^(\d+)/.exec(s); return m ? Number(m[1]) : NaN; }
  function times(a, b){ let s = 0; for(let i = 0; i < b; i++) s += a; return s; }
  function rect(){ return { w: randInt(3, 9), h: randInt(2, 7) }; }
  function lShape(){
    /* an L made of a big rectangle with a rectangular corner removed; returns the cells and the area by counting */
    const R = randInt(4, 6), C = randInt(4, 7), cr = randInt(1, R - 2), cc = randInt(1, C - 2), cells = [];
    for(let r = 0; r < R; r++) for(let c = 0; c < C; c++) if(!(r < cr && c >= C - cc)) cells.push([r, c]);
    return { R: R, C: C, cr: cr, cc: cc, cells: cells };
  }

  /* ---- tier 1 ---- */
  function qCountGrid(){
    const r = randInt(2, 5), c = randInt(2, 7), vis = sq(r, c);
    return mcqNum({
      prompt: 'Each square is <b>1 square unit</b>. What is the <b>area</b> of this rectangle?', visual: vis, answer: r * c,
      wrong: [{ v: 2 * (r + c), why: 'That is the perimeter (distance round the edge). Area is the number of squares inside.' }, { v: r + c, why: 'You added the sides. Area counts all the squares inside: ' + r + ' rows of ' + c + '.' }, { v: r * c + c, why: 'Count the rows carefully: there are ' + r + ' rows of ' + c + '.' }, { v: r * c - 1, why: 'Count again: ' + r + ' rows of ' + c + ' squares.' }],
      nearby: [1, -1, 2, -2, 4], valid: function(v){ return v > 0; }, count: 4, hint: 'Count the squares in one row, then use equal rows.',
      explain: ex('Area by counting squares', ['There are <b>' + r + ' rows</b> with <b>' + c + ' squares</b> in each row.', r + ' × ' + c + ' = <b>' + r * c + '</b> square units. ✅']),
      truth: times(c, r), decode: function(){ const d = sqDecode(vis); return d.count; }
    });
  }
  function qRowsCols(){
    const r = randInt(2, 5), c = randInt(2, 7), vis = sq(r, c);
    return mcqNum({
      prompt: 'How many squares are in <b>one row</b>?', visual: vis, answer: c,
      wrong: [{ v: r, why: r + ' is the number of rows. We want the squares in ONE row.' }, { v: r * c, why: r * c + ' is all the squares. We want just one row.' }, { v: c + 1, why: 'Count along one row again.' }],
      nearby: [1, -1, 2], valid: function(v){ return v > 0; }, count: 3, hint: 'Count the squares along the top.',
      explain: ex('Rows and columns', ['Count along the top row: <b>' + c + '</b> squares.', 'There are ' + r + ' rows, so the area is ' + r + ' × ' + c + ' = ' + r * c + '. ✅']),
      truth: sqDecode(vis).cols, decode: function(){ return sqDecode(vis).cols; }
    });
  }
  /* ---- tier 2 ---- */
  function qFormula(){
    const g = rect(), vis = rectLabelled(g.w, g.h, 'cm', false, false);
    return mcqNum({
      prompt: 'What is the <b>area</b> of this rectangle?', visual: vis, answer: g.w * g.h, fmt: function(v){ return v + ' cm²'; },
      wrong: [{ v: 2 * (g.w + g.h), why: 'That is the perimeter. Area = length × width.' }, { v: g.w + g.h, why: 'You added the sides. Area = length × width.' }, { v: g.w * g.h + g.w, why: 'Area is exactly ' + g.w + ' × ' + g.h + '.' }],
      nearby: [1, -1, 2, -2, 4, -4], valid: function(v){ return v > 0; }, count: 4, hint: 'Multiply the length by the width.',
      explain: ex('Area of a rectangle', ['Area = length × width.', g.w + ' × ' + g.h + ' = <b>' + g.w * g.h + ' cm²</b>. ✅']),
      truth: times(g.w, g.h), decode: function(){ return times(readNum(labelOf(vis, 'lw')), readNum(labelOf(vis, 'lh'))); }
    });
  }
  function qPerimOrArea(){
    let g; do { g = rect(); } while(g.w * g.h === 2 * (g.w + g.h));
    const askArea = chance(0.5), area = g.w * g.h, per = 2 * (g.w + g.h), vis = rectLabelled(g.w, g.h, 'cm', false, false);
    return mcq2({
      prompt: 'Here is a rectangle. Which number is its <b>' + (askArea ? 'area' : 'perimeter') + '</b>?', visual: vis,
      correct: opt(K.num(askArea ? area : per), (askArea ? area : per) + (askArea ? ' cm²' : ' cm'), askArea ? 'Area is length × width.' : 'Perimeter is the distance round the edge.'),
      other: opt(K.num(askArea ? per : area), (askArea ? per : area) + (askArea ? ' cm' : ' cm²'), askArea ? 'That is the perimeter, the distance round the edge.' : 'That is the area, the space inside.'),
      hint: askArea ? 'Area = the space inside: length × width.' : 'Perimeter = all the way round: add the four sides.',
      explain: ex('Area or perimeter?', ['Area = ' + g.w + ' × ' + g.h + ' = <b>' + area + ' cm²</b> (the space inside).', 'Perimeter = ' + g.w + ' + ' + g.h + ' + ' + g.w + ' + ' + g.h + ' = <b>' + per + ' cm</b> (round the edge).', 'The ' + (askArea ? 'area' : 'perimeter') + ' is <b>' + (askArea ? area : per) + '</b>. ✅']),
      truth: K.num(askArea ? times(g.w, g.h) : g.w + g.h + g.w + g.h), decode: function(){ const w = readNum(labelOf(vis, 'lw')), h = readNum(labelOf(vis, 'lh')); return K.num(askArea ? times(w, h) : w + h + w + h); }
    });
  }
  function qLShapeCount(){
    const L = lShape(), vis = sq(L.R, L.C, L.cells);
    return mcqNum({
      prompt: 'Each square is 1 square unit. What is the area of this shape?', visual: vis, answer: L.cells.length,
      wrong: [{ v: L.R * L.C, why: 'That counts the missing corner too. Only count the squares that are drawn.' }, { v: L.cells.length + L.cr * L.cc, why: 'You counted the missing corner as well.' }, { v: 2 * (L.R + L.C), why: 'That is not the area: count the squares inside the shape.' }],
      nearby: [1, -1, 2, -2], valid: function(v){ return v > 0; }, count: 4, hint: 'Count the squares row by row, or work out the big rectangle and take away the missing corner.',
      explain: ex('Area of an L-shape', ['The big rectangle would be ' + L.R + ' × ' + L.C + ' = ' + L.R * L.C + ' squares.', 'The missing corner is ' + L.cr + ' × ' + L.cc + ' = ' + nnoun(L.cr * L.cc, 'squares') + '.', L.R * L.C + ' − ' + L.cr * L.cc + ' = <b>' + L.cells.length + '</b>. ✅']),
      truth: L.R * L.C - L.cr * L.cc, decode: function(){ return sqDecode(vis).count; }
    });
  }
  /* ---- tier 3 ---- */
  function qTyped(){
    const g = rect(), vis = rectLabelled(g.w, g.h, 'cm', false, false);
    return numeric({ prompt: 'Type the area of this rectangle in square centimetres (cm²).', visual: vis, answer: g.w * g.h, hint: 'Area = length × width.',
      explain: ex('Area of a rectangle', [g.w + ' × ' + g.h + ' = <b>' + g.w * g.h + ' cm²</b>. ✅']), truth: times(g.w, g.h), decode: function(){ return times(readNum(labelOf(vis, 'lw')), readNum(labelOf(vis, 'lh'))); },
      wrong: function(v){ return v === 2 * (g.w + g.h) ? 'That is the perimeter. Multiply instead.' : v === g.w + g.h ? 'You added. Multiply the length by the width.' : ''; } });
  }
  function qMissingSide(){
    const g = rect(), area = g.w * g.h, vis = rectLabelled(g.w, g.h, 'cm', false, true), who = pick(NAMES);
    return numeric({ prompt: 'This rectangle has an area of <b>' + area + ' cm²</b>. One side is ' + g.w + ' cm. How long is the other side in cm?', visual: vis, answer: g.h,
      hint: 'What number times ' + g.w + ' makes ' + area + '? Divide ' + area + ' by ' + g.w + '.', explain: ex('Missing side', ['Area = length × width, so ' + g.w + ' × ▢ = ' + area + '.', area + ' ÷ ' + g.w + ' = <b>' + g.h + ' cm</b>. ✅', 'Check: ' + g.w + ' × ' + g.h + ' = ' + area + '.']), truth: (function(){ let q = 0; while(q * g.w < area) q++; return q; })(),
      wrong: function(v){ return v === area - g.w ? 'You subtracted. Divide the area by the known side.' : ''; } });
  }
  function qLShapeTyped(){
    const L = lShape(), vis = sq(L.R, L.C, L.cells);
    return numeric({ prompt: 'Each square is 1 square unit. Type the area of this shape.', visual: vis, answer: L.cells.length, hint: 'Big rectangle minus the missing corner, or count row by row.',
      explain: ex('Area of an L-shape', [L.R + ' × ' + L.C + ' = ' + L.R * L.C + ', minus the corner ' + L.cr + ' × ' + L.cc + ' = ' + L.cr * L.cc + '.', L.R * L.C + ' − ' + L.cr * L.cc + ' = <b>' + L.cells.length + '</b>. ✅']), truth: L.R * L.C - L.cr * L.cc, decode: function(){ return sqDecode(vis).count; } });
  }
  function qWord(){
    const g = { w: randInt(4, 12), h: randInt(3, 9) }, who = pick(NAMES), what = pick(['a rug', 'a garden bed', 'a poster', 'a pool cover']);
    return numeric({ prompt: who + ' has ' + what + ' that is ' + g.w + ' m long and ' + g.h + ' m wide. What is its area in square metres (m²)?', answer: g.w * g.h, hint: 'Area = length × width.',
      explain: ex('Area in a story', [g.w + ' × ' + g.h + ' = <b>' + g.w * g.h + ' m²</b>. ✅']), truth: times(g.w, g.h),
      wrong: function(v){ return v === 2 * (g.w + g.h) ? 'That is the perimeter. Area is length × width.' : ''; } });
  }
  registerSkill({
    id: 'measure-area', strand: 'measure', name: 'Area', emoji: '🟦', year: 4, order: 660, prereq: ['measure-perimeter', 'multdiv-arrays-groups'],
    lesson: { title: 'Area: the space inside', steps: [
      { say: '<b>Area</b> is how much space is <b>inside</b> a shape. We count unit squares. This rectangle has 3 rows of 4 squares, so the area is 3 × 4 = <b>12 square units</b>.', vis: { kind: 'sqgrid', args: [3, 4] } },
      { say: 'For any rectangle: <b>area = length × width</b>. A rectangle 6 cm by 4 cm has area 6 × 4 = <b>24 cm²</b>. (cm² means square centimetres.)', vis: { kind: 'sqgrid', args: [4, 6] },
        quiz: { prompt: 'A rectangle is 5 cm long and 3 cm wide. What is its area?', options: [{ label: '15 cm²', ok: true }, { label: '8 cm²', ok: false }, { label: '16 cm²', ok: false }], right: 'Yes! 5 × 3 = 15.', wrong: 'Area = length × width = 5 × 3 = 15 cm².' } },
      { say: '<b>Perimeter</b> goes round the edge (add the sides). <b>Area</b> fills the inside (multiply). For an L-shape, count all the squares, or take the missing corner away from the big rectangle.', vis: { kind: 'sqgrid', args: [3, 4, [[0, 0], [0, 1], [1, 0], [1, 1], [2, 0], [2, 1], [2, 2], [2, 3]]] },
        quiz: { prompt: 'Which one do you MULTIPLY to find: perimeter or area?', options: [{ label: 'Area', ok: true }, { label: 'Perimeter', ok: false }], right: 'Yes! Area = length × width.', wrong: 'Perimeter is adding round the edge. Area is length × width.' } }
    ] },
    trick: { title: 'Inside = multiply', say: '<b>Area</b> is the space <b>inside</b>: <b>length × width</b>, measured in square units. <b>Perimeter</b> is the distance <b>round</b> the edge: add the sides.', vis: { kind: 'sqgrid', args: [3, 5] }, example: '5 cm by 3 cm → area 5 × 3 = <b>15 cm²</b>, perimeter 5+3+5+3 = <b>16 cm</b>' },
    gen: {
      1: function(){ return pick([qCountGrid, qCountGrid, qRowsCols, qFormula])(); },
      2: function(){ return pick([qFormula, qFormula, qPerimOrArea, qPerimOrArea, qLShapeCount])(); },
      3: function(){ return pick([qTyped, qMissingSide, qMissingSide, qLShapeTyped, qWord, qPerimOrArea])(); }
    }
  });
})();
