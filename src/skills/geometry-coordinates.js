/* GEOMETRY 7 — Coordinates in the first quadrant (Year 4 bridge). x = along the corridor, y = up the stairs. */
(function(){
  const S = 28;
  function ck(x, y){ return K.text('c:' + x + ',' + y); }
  function lab(x, y){ return '(' + x + ', ' + y + ')'; }
  // several points on the standard grid (decoded from the drawing, like V.decodeGrid)
  function gridPts(maxV, pts){
    const ox = 34, oy = 34 + maxV * S;
    const dots = pts.map(function(p){ return '<circle class="pt" cx="' + (ox + p[0] * S) + '" cy="' + (oy - p[1] * S) + '" r="8" fill="var(--vis-bad,#EB5757)" stroke="#fff" stroke-width="2"/>'; }).join('');
    return V.grid(maxV).replace('</svg>', dots + '</svg>');
  }
  function attr(tag, n){ const m = new RegExp(n + '="([^"]*)"').exec(tag); return m ? parseFloat(m[1]) : NaN; }
  function decodePts(html){
    const gx = (html.match(/<text[^>]*class="gx"[^>]*>/g) || []).map(function(t){ return { v: attr(t, 'data-v'), p: attr(t, 'x') }; });
    const gy = (html.match(/<text[^>]*class="gy"[^>]*>/g) || []).map(function(t){ return { v: attr(t, 'data-v'), p: attr(t, 'y') - 4 }; });
    return (html.match(/<circle[^>]*class="pt"[^>]*>/g) || []).map(function(t){
      const px = attr(t, 'cx'), py = attr(t, 'cy'), a = gx[0], b = gx[gx.length - 1], c = gy[0], d = gy[gy.length - 1];
      return { x: Math.round(a.v + (px - a.p) / (b.p - a.p) * (b.v - a.v)), y: Math.round(c.v + (py - c.p) / (d.p - c.p) * (d.v - c.v)) };
    });
  }
  V.extra.gridPts = { render: gridPts, verify: function(a, html){ const d = decodePts(html); if(d.length !== a[1].length) return 'point count'; for(let i = 0; i < d.length; i++) if(d[i].x !== a[1][i][0] || d[i].y !== a[1][i][1]) return 'point ' + i + ' at ' + d[i].x + ',' + d[i].y; return ''; } };

  function pointOpts(x, y, maxV, extraFirst){
    const out = [], seen = {};
    function add(px, py, why){ if(px < 0 || py < 0 || px > maxV || py > maxV) return; const k = ck(px, py); if(px === x && py === y) return; if(seen[k]) return; seen[k] = 1; out.push(opt(k, lab(px, py), why)); }
    (extraFirst || []).forEach(function(e){ add(e[0], e[1], e[2]); });
    add(y, x, 'You swapped the numbers. Go ALONG the corridor first (x), then UP the stairs (y): the first number is across.');
    add(x + 1, y, 'The dot is ' + plural(x, 'step') + ' along, not ' + (x + 1) + '. Count the steps along the bottom again.');
    add(x - 1, y, 'The dot is ' + plural(x, 'step') + ' along, not ' + (x - 1) + '. Count the steps along the bottom again.');
    add(x, y + 1, 'The dot is ' + plural(y, 'step') + ' up, not ' + (y + 1) + '. Count the steps up the side again.');
    add(x, y - 1, 'The dot is ' + plural(y, 'step') + ' up, not ' + (y - 1) + '. Count the steps up the side again.');
    for(let a = 0; a <= maxV; a++) for(let b = 0; b <= maxV; b++) add(a, b, 'Check both numbers: along first, then up.');
    return out;
  }
  function readQ(maxV, lo){
    const x = randInt(lo, maxV), y = randInt(lo, maxV), vis = V.grid(maxV, [x, y]);
    return mcq({
      prompt: 'What are the <b>coordinates</b> of the red dot? (Write them as (across, up).)', visual: vis,
      correct: opt(ck(x, y), lab(x, y)), distractors: pointOpts(x, y, maxV), keepOrder: true, count: 4,
      hint: 'Start at 0. Count the steps ALONG the bottom to be under the dot, then count the steps UP. Along first, then up.',
      explain: ex('Reading coordinates', ['From the corner (0), go <b>along</b> the bottom: <b>' + x + '</b> ' + (x === 1 ? 'step' : 'steps') + ' to be under the dot.', 'Then go <b>up</b>: <b>' + y + '</b> ' + (y === 1 ? 'step' : 'steps') + ' to reach it.', 'The coordinates are <b>' + lab(x, y) + '</b>. ✅']),
      truth: ck(x, y), decode: function(){ const d = V.decodeGrid(vis); return ck(d.x, d.y); }
    });
  }
  function oneCoordQ(maxV, typed){
    const x = randInt(0, maxV), y = randInt(1, maxV);
    if(x === y) return oneCoordQ(maxV, typed);
    const isX = chance(0.5), vis = V.grid(maxV, [x, y]), ans = isX ? x : y, other = isX ? y : x;
    const prompt = 'How many steps <b>' + (isX ? 'along' : 'up') + '</b> is the red dot? (This is the ' + (isX ? 'first' : 'second') + ' coordinate.)';
    const hint = isX ? 'Count along the bottom, starting from 0, until you are directly under the dot.' : 'Count up the side, starting from 0, until you are level with the dot.';
    const explain = ex('One coordinate at a time', [isX ? 'Go along the bottom until you are under the dot.' : 'Go up the side until you are level with the dot.', 'That takes <b>' + ans + '</b> step' + (ans === 1 ? '' : 's') + '.', 'The answer is <b>' + ans + '</b>. ✅']);
    const dec = function(){ const d = V.decodeGrid(vis); return isX ? d.x : d.y; };
    if(typed) return numeric({ prompt: prompt, visual: vis, answer: ans, hint: hint, explain: explain, truth: isX ? x : y, decode: dec, wrong: function(v){ return v === other ? 'That is the OTHER coordinate. ' + (isX ? 'Along' : 'Up') + ' is the ' + (isX ? 'first' : 'second') + ' number.' : ''; } });
    return mcqNum({ prompt: prompt, visual: vis, answer: ans, wrong: [{ v: other, why: 'That is the OTHER coordinate. You counted ' + (isX ? 'up' : 'along') + ' instead.' }], valid: function(v){ return v >= 0 && v <= maxV; }, count: 3, hint: hint, explain: explain, truth: isX ? x : y, decode: dec });
  }
  function plotQ(maxV, count){
    const x = randInt(1, maxV), y = randInt(1, maxV);
    if(x === y) return plotQ(maxV, count);
    const ds = pointOpts(x, y, maxV).map(function(o){ const m = /\((\d+), (\d+)\)/.exec(o.label); return opt(o.key, V.grid(maxV, [+m[1], +m[2]]), 'That dot is at ' + o.label + '. ' + (o.key === ck(y, x) ? 'You swapped the numbers.' : 'Count along first, then up.')); });
    const q = mcq({
      prompt: 'Which grid has a dot at <b>' + lab(x, y) + '</b>?', visual: '', correct: opt(ck(x, y), V.grid(maxV, [x, y])), distractors: ds, keepOrder: true, count: count,
      hint: 'Start at 0. Go ALONG ' + plural(x, 'step') + ', then UP ' + plural(y, 'step') + '. Check each grid for a dot in that place.',
      explain: ex('Plotting ' + lab(x, y), ['The first number, <b>' + x + '</b>, says how far to go along.', 'The second number, <b>' + y + '</b>, says how far to go up.', 'Only one grid has its dot at <b>' + lab(x, y) + '</b>. ✅']),
      truth: ck(x, y)
    });
    q.optionsAreVisual = true;
    q.decodeKey = function(){ for(let i = 0; i < q.options.length; i++){ const d = V.decodeGrid(q.options[i].label); if(ck(d.x, d.y) !== q.options[i].key) return 'option ' + i + ' picture does not match its key'; } return q.options[q.correct].key; };
    return q;
  }
  const MOV = { right: [1, 0], left: [-1, 0], up: [0, 1], down: [0, -1] };
  function moveQ(maxV, twoMoves){
    const sx = randInt(1, maxV - 1), sy = randInt(1, maxV - 1);
    const ms = [];
    if(twoMoves){
      const h = (sx > 1 && chance(0.5)) ? 'left' : 'right', v = (sy > 1 && chance(0.5)) ? 'down' : 'up';
      const nh = h === 'right' ? randInt(1, maxV - sx) : randInt(1, sx), nv = v === 'up' ? randInt(1, maxV - sy) : randInt(1, sy);
      ms.push([h, nh], [v, nv]);
    } else {
      const dirs = ['right', 'up']; if(sx > 1) dirs.push('left'); if(sy > 1) dirs.push('down');
      const d = pick(dirs), n = d === 'right' ? randInt(1, maxV - sx) : d === 'up' ? randInt(1, maxV - sy) : d === 'left' ? randInt(1, sx) : randInt(1, sy);
      ms.push([d, n]);
    }
    let ex_ = sx, ey = sy; ms.forEach(function(m){ ex_ += MOV[m[0]][0] * m[1]; ey += MOV[m[0]][1] * m[1]; });
    if(ex_ === sx && ey === sy) return moveQ(maxV, twoMoves);
    const vis = V.grid(maxV, [sx, sy]);
    const text = ms.map(function(m){ return m[1] + ' step' + (m[1] === 1 ? '' : 's') + ' <b>' + m[0] + '</b>'; }).join(' and ');
    const firsts = [];
    // misconceptions: only moved x / only moved y / swapped / moved the wrong way
    const onlyX = [sx + ms.reduce(function(t, m){ return t + MOV[m[0]][0] * m[1]; }, 0), sy], onlyY = [sx, sy + ms.reduce(function(t, m){ return t + MOV[m[0]][1] * m[1]; }, 0)];
    firsts.push([ey, ex_, 'You swapped the numbers. Right and left change the FIRST number; up and down change the SECOND.']);
    if(twoMoves){ firsts.push([onlyX[0], onlyX[1], 'You only did the sideways move. There is an up/down move to do as well.']); firsts.push([onlyY[0], onlyY[1], 'You only did the up/down move. There is a sideways move to do as well.']); }
    else firsts.push([sx + (MOV[ms[0][0]][1] !== 0 ? MOV[ms[0][0]][1] * ms[0][1] : 0), sy + (MOV[ms[0][0]][0] !== 0 ? MOV[ms[0][0]][0] * ms[0][1] : 0), 'Moving ' + ms[0][0] + ' changes the ' + (MOV[ms[0][0]][0] !== 0 ? 'FIRST' : 'SECOND') + ' number, not the other one.']);
    const ds = pointOpts(ex_, ey, maxV, firsts);
    return mcq({
      prompt: 'The red dot moves ' + text + '. What are its <b>new coordinates</b>?', visual: vis,
      correct: opt(ck(ex_, ey), lab(ex_, ey)), distractors: ds, keepOrder: true, count: 4,
      hint: 'First read where the dot starts. Right or left changes the first number (across). Up or down changes the second number (up).',
      explain: ex('Moving a point', ['The dot starts at <b>' + lab(sx, sy) + '</b>.', ms.map(function(m){ return 'Moving ' + m[1] + ' ' + m[0] + ' ' + (MOV[m[0]][0] !== 0 ? 'changes the first number' : 'changes the second number') + ' by ' + m[1] + '.'; }).join(' '), 'The new coordinates are <b>' + lab(ex_, ey) + '</b>. ✅']),
      truth: ck(sx + ms.reduce(function(t, m){ return t + MOV[m[0]][0] * m[1]; }, 0), sy + ms.reduce(function(t, m){ return t + MOV[m[0]][1] * m[1]; }, 0)),
      decode: function(){ const d = V.decodeGrid(vis); return ck(d.x + ms.reduce(function(t, m){ return t + MOV[m[0]][0] * m[1]; }, 0), d.y + ms.reduce(function(t, m){ return t + MOV[m[0]][1] * m[1]; }, 0)); }
    });
  }
  function cornerQ(){
    const maxV = 7, x1 = randInt(1, 4), x2 = randInt(x1 + 2, 7), y1 = randInt(1, 4), y2 = randInt(y1 + 2, 7);
    const pts = shuffle([[x1, y1], [x2, y1], [x2, y2]]), vis = gridPts(maxV, pts);
    const ds = pointOpts(x1, y2, maxV, [[x2, y2 - 0, null]].slice(0, 0).concat([[y2, x1, 'You swapped the numbers.'], [x1, y1, 'That corner is already on the picture.'], [x2, y1, 'That corner is already on the picture.'], [x2, y2, 'That corner is already on the picture.']]));
    return mcq({
      prompt: 'Three corners of a <b>rectangle</b> are shown. What are the coordinates of the <b>fourth</b> corner?', visual: vis,
      correct: opt(ck(x1, y2), lab(x1, y2)), distractors: ds, keepOrder: true, count: 4,
      hint: 'A rectangle has two corners on each straight line. The missing corner is level with one dot and directly above or below another.',
      explain: ex('Finding the fourth corner', ['The dots are at ' + pts.map(function(p){ return lab(p[0], p[1]); }).join(', ') + '.', 'The missing corner shares its <b>along</b> number with one dot and its <b>up</b> number with another.', 'That gives <b>' + lab(x1, y2) + '</b>. ✅']),
      truth: ck(x1, y2),
      decode: function(){
        const d = decodePts(vis), xs = d.map(function(p){ return p.x; }), ys = d.map(function(p){ return p.y; });
        const once = function(a){ return a.filter(function(v){ return a.filter(function(w){ return w === v; }).length === 1; })[0]; };
        return ck(once(xs), once(ys));
      }
    });
  }
  function stepsApartQ(){
    const maxV = 7, horiz = chance(0.5), fixed = randInt(1, 6), a = randInt(0, 5), b = randInt(a + 2, 7);
    const pts = horiz ? [[a, fixed], [b, fixed]] : [[fixed, a], [fixed, b]];
    const vis = gridPts(maxV, pts);
    return numeric({
      prompt: 'The two red dots are on the same ' + (horiz ? 'row' : 'column') + '. How many steps apart are they?', visual: vis, answer: b - a,
      hint: 'Count the steps from one dot to the other along the grid lines. Do not count the dot you start on.',
      explain: ex('Steps between two points', ['The dots are at ' + lab(pts[0][0], pts[0][1]) + ' and ' + lab(pts[1][0], pts[1][1]) + '.', 'Only the ' + (horiz ? 'first' : 'second') + ' number changes: from ' + a + ' to ' + b + '.', b + ' − ' + a + ' = <b>' + (b - a) + '</b> ' + ((b - a) === 1 ? 'step' : 'steps') + '. ✅']),
      truth: Math.max(b, a) - Math.min(a, b),
      decode: function(){ const d = decodePts(vis); return Math.abs(d[0].x - d[1].x) + Math.abs(d[0].y - d[1].y); },
      wrong: function(v){ return v === b - a + 1 ? 'You counted the starting dot too. Count the steps between the dots.' : ''; }
    });
  }

  registerSkill({
    id: 'geo-coordinates', strand: 'geometry', name: 'Coordinates on a grid', emoji: '📍', year: 4, order: 770, prereq: ['geo-lines'],
    lesson: {
      title: 'Where is the dot?',
      steps: [
        { say: 'We can say exactly where a dot is with two numbers called <b>coordinates</b>. We write them in brackets, like <b>(3, 2)</b>.', vis: { kind: 'grid', args: [5, [3, 2]] } },
        { say: 'Start at <b>0</b>. Go <b>along</b> the corridor first: <b>3</b> steps. Then go <b>up</b> the stairs: <b>2</b> steps. The dot is at <b>(3, 2)</b>.', vis: { kind: 'grid', args: [5, [3, 2]] },
          quiz: { prompt: 'The dot is 4 steps along and 1 step up. What are its coordinates?', options: [{ label: '(4, 1)', ok: true }, { label: '(1, 4)', ok: false }, { label: '(5, 1)', ok: false }], right: 'Yes! Along first (4), then up (1): (4, 1).', wrong: 'Along comes first. 4 along and 1 up is (4, 1).' } },
        { say: 'The order matters! <b>(2, 3)</b> is 2 along and 3 up. It is in a different place from (3, 2).', vis: { kind: 'grid', args: [5, [2, 3]] } },
        { say: 'To move a dot, change one number. Moving <b>right</b> makes the first number bigger. Moving <b>up</b> makes the second number bigger. From (2, 3), 2 steps right gives <b>(4, 3)</b>.', vis: { kind: 'grid', args: [5, [4, 3]] },
          quiz: { prompt: 'The dot at (2, 1) moves 3 steps right. Where is it now?', options: [{ label: '(5, 1)', ok: true }, { label: '(2, 4)', ok: false }, { label: '(3, 1)', ok: false }], right: 'Yes! Right changes the first number: 2 + 3 = 5.', wrong: 'Moving right changes the FIRST number: 2 + 3 = 5, so (5, 1).' } },
        { say: 'A dot can sit on a line of the grid too. This dot is 0 steps along and 3 steps up, so it is at <b>(0, 3)</b>.', vis: { kind: 'grid', args: [5, [0, 3]] } }
      ]
    },
    trick: {
      title: 'Along the corridor, up the stairs',
      say: 'Always go <b>along the corridor</b> first (the <b>first</b> number), then <b>up the stairs</b> (the <b>second</b> number). You cannot climb stairs before you walk to them! Coordinates are written (along, up).',
      vis: { kind: 'grid', args: [5, [4, 2]] },
      example: '4 along, 2 up → <b>(4, 2)</b>'
    },
    gen: {
      1: function(){
        const r = randInt(1, 3);
        if(r === 1) return oneCoordQ(5, false);
        return readQ(5, 1);
      },
      2: function(){
        const r = randInt(1, 4);
        if(r === 1) return readQ(7, 0);
        if(r === 2) return plotQ(5, 3);
        if(r === 3) return moveQ(6, false);
        return oneCoordQ(7, true);
      },
      3: function(){
        const r = randInt(1, 5);
        if(r === 1) return moveQ(7, true);
        if(r === 2) return cornerQ();
        if(r === 3) return stepsApartQ();
        if(r === 4) return plotQ(6, 4);
        return moveQ(7, true);
      }
    }
  });
})();
