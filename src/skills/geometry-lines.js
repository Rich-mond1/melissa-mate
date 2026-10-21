/* GEOMETRY 5 — Lines: horizontal, vertical, parallel, perpendicular. */
(function(){
  /* single line picture: V.extra.oneLine(orientation, variant) */
  const SLANTS = [35, -35, 55, -55, 40, -50];
  function f2(n){ return (Math.round(n * 100) / 100).toString(); }
  function renderOne(orient, variant){
    let x1, y1, x2, y2;
    if(orient === 'horizontal'){ x1 = 25; y1 = 80; x2 = 175; y2 = 80; }
    else if(orient === 'vertical'){ x1 = 100; y1 = 10; x2 = 100; y2 = 150; }
    else { const a = SLANTS[(variant || 0) % SLANTS.length] * Math.PI / 180; x1 = 100 - 70 * Math.cos(a); y1 = 80 + 70 * Math.sin(a); x2 = 100 + 70 * Math.cos(a); y2 = 80 - 70 * Math.sin(a); }
    return '<svg viewBox="0 0 200 160" width="200" role="img" style="max-width:100%;height:auto;display:block;margin:0 auto" xmlns="http://www.w3.org/2000/svg"><line class="ln1" x1="' + f2(x1) + '" y1="' + f2(y1) + '" x2="' + f2(x2) + '" y2="' + f2(y2) + '" stroke="var(--vis-a,#4F8FE8)" stroke-width="7" stroke-linecap="round"/></svg>';
  }
  function attr(tag, name){ const m = new RegExp(name + '="([^"]*)"').exec(tag); return m ? parseFloat(m[1]) : NaN; }
  function decodeOne(html){
    const t = /<line[^>]*class="ln1"[^>]*>/.exec(html)[0];
    const dx = attr(t, 'x2') - attr(t, 'x1'), dy = attr(t, 'y2') - attr(t, 'y1');
    if(Math.abs(dy) < 0.5) return 'horizontal';
    if(Math.abs(dx) < 0.5) return 'vertical';
    return 'slanting';
  }
  V.extra.oneLine = { render: renderOne, verify: function(a, html){ return decodeOne(html) === a[0] ? '' : 'line draws ' + decodeOne(html) + ' not ' + a[0]; } };

  function cap(s){ return s.charAt(0).toUpperCase() + s.slice(1); }
  // my own polygon point reader (for side names)
  function ptsOf(html){ const m = /class="poly" points="([^"]*)"/.exec(html); return m[1].trim().split(/\s+/).map(function(p){ return p.split(',').map(Number); }); }

  const OBJL = {
    horizontal: ['the horizon where the sea meets the sky', 'a shelf on the wall', 'the top of a table', 'the floor of a room', 'a flat bridge over a river'],
    vertical: ['a flagpole', 'the edge of a door', 'a lamp post', 'the side of a tall building', 'a straight tree trunk'],
    slanting: ['a ski slope', 'a leaning ladder', 'a playground slide', 'a ramp', 'the roof of a house']
  };
  const OBJP = {
    parallel: ['railway tracks', 'the stripes of a zebra crossing', 'the two long sides of a ruler', 'the rungs of a ladder', 'the lines on lined paper'],
    perpendicular: ['the corner of a book', 'a plus sign (+)', 'the hands of a clock at 3 o’clock', 'where a wall meets the floor', 'the post and the crossbar of a football goal'],
    neither: ['the hands of a clock at 2 o’clock', 'the hands of a clock at 5 o’clock', 'the two sides of the letter V', 'a ladder leaning on a wall']
  };
  function catOf(table, item){ return Object.keys(table).filter(function(k){ return table[k].indexOf(item) >= 0; })[0]; }
  const PLAB = { parallel: 'parallel', perpendicular: 'perpendicular', neither: 'neither' };
  const PEXP = { parallel: 'side by side, the same distance apart, never meeting', perpendicular: 'crossing or meeting at a right angle (a square corner)', neither: 'not parallel and not at a right angle' };

  function orientQ(count){
    const o = pick(['horizontal', 'vertical', 'slanting']), vis = renderOne(o, randInt(0, 5));
    const ds = ['horizontal', 'vertical', 'slanting'].filter(function(x){ return x !== o; }).map(function(x){ return opt(K.text(x), x, x === 'slanting' ? 'A slanting line leans over. This one does not lean.' : (x === 'horizontal' ? 'Horizontal lines lie flat, like the horizon. This one does not lie flat.' : 'Vertical lines stand straight up, like a flagpole. This one does not stand up straight.')); });
    return mcq({
      prompt: 'Is this line <b>horizontal</b>, <b>vertical</b> or <b>slanting</b>?', visual: vis, correct: opt(K.text(o), o), distractors: ds, keepOrder: true, count: count,
      hint: 'Horizontal lines go side to side, like the horizon. Vertical lines go straight up and down, like a flagpole. Slanting lines lean over.',
      explain: ex('Which way does the line go?', [o === 'horizontal' ? 'The line goes <b>side to side</b>, flat like the horizon.' : (o === 'vertical' ? 'The line goes <b>straight up and down</b>, like a flagpole.' : 'The line <b>leans over</b>: it is not flat and not straight up.'), 'So the line is <b>' + o + '</b>. ✅']),
      truth: K.text(o), decode: function(){ return K.text(decodeOne(vis)); }
    });
  }
  function objLineQ(){
    const o = pick(['horizontal', 'vertical']);
    const items = {}; ['horizontal', 'vertical', 'slanting'].forEach(function(c){ items[c] = pick(OBJL[c]); });
    const ds = ['horizontal', 'vertical', 'slanting'].filter(function(c){ return c !== o; }).map(function(c){ return opt(K.text(items[c]), items[c], cap(items[c]) + ' is ' + c + (c === 'slanting' ? ' (it leans over)' : '') + '. You want the ' + o + ' one.'); });
    const q = mcq({
      prompt: 'Which one is a <b>' + o + '</b> line?', visual: '', correct: opt(K.text(items[o]), items[o]), distractors: ds, count: 3,
      hint: o === 'horizontal' ? 'Horizontal = flat, side to side, like the horizon.' : 'Vertical = straight up and down, like a flagpole.',
      explain: ex('Lines around us', [o === 'horizontal' ? 'Horizontal lines are <b>flat</b>, going side to side.' : 'Vertical lines go <b>straight up and down</b>.', 'The answer is <b>' + items[o] + '</b>: it is ' + o + '.', 'The others are not ' + o + '. ✅']),
      truth: 'pending'
    });
    const ok2 = q.options.filter(function(x){ return Object.keys(OBJL).some(function(c){ return c === o && OBJL[c].some(function(it){ return K.text(it) === x.key; }); }); });
    q.truthKey = ok2.length === 1 ? ok2[0].key : 'fits:' + ok2.length;
    return q;
  }
  function pairQ(seeds, kinds, count){
    const kind = pick(kinds), seed = pick(seeds), vis = V.linePair(kind, seed);
    const ds = kinds.filter(function(x){ return x !== kind; }).map(function(x){ return opt(K.text(x), PLAB[x], 'These lines are ' + PEXP[kind] + '. ' + (x === 'neither' ? 'A pair that is neither parallel nor perpendicular is not side by side and does not meet at a right angle.' : cap(PLAB[x]) + ' lines are ' + PEXP[x] + '.')); });
    return mcq({
      prompt: 'Look at the two lines. Are they <b>' + kinds.map(function(k){ return PLAB[k]; }).join('</b>, <b>').replace(/, ([^,]*)$/, ' or $1') + '</b>?', visual: vis,
      correct: opt(K.text(kind), PLAB[kind]), distractors: ds, keepOrder: true, count: count,
      hint: 'Parallel lines never meet. Perpendicular lines make a square corner (a right angle). If the lines are neither of these, say neither.',
      explain: ex('Looking at a pair of lines', ['Do the lines stay the same distance apart? ' + (kind === 'parallel' ? '<b>Yes</b>.' : 'No.'), 'Do they cross at a square corner? ' + (kind === 'perpendicular' ? '<b>Yes</b>.' : 'No.'), 'So the lines are <b>' + PLAB[kind] + '</b>. ✅']),
      truth: K.text(kind), decode: function(){ return K.text(V.decodeLinePair(vis)); }
    });
  }
  function objPairQ(){
    const target = pick(['parallel', 'perpendicular']);
    const items = {}; Object.keys(OBJP).forEach(function(c){ items[c] = pick(OBJP[c]); });
    const ds = Object.keys(OBJP).filter(function(c){ return c !== target; }).map(function(c){ return opt(K.text(items[c]), items[c], cap(items[c]) + (/^(railway tracks|the stripes|the two |the rungs|the lines|the hands|the post and)/.test(items[c]) ? ' are ' : ' is ') + PLAB[c] + ': ' + PEXP[c] + '.'); });
    const q = mcq({
      prompt: 'Which one shows <b>' + PLAB[target] + '</b> lines?', visual: '', correct: opt(K.text(items[target]), items[target]), distractors: ds, count: 3,
      hint: target === 'parallel' ? 'Parallel lines run side by side and never meet, like train tracks.' : 'Perpendicular lines meet at a right angle, like the corner of a book.',
      explain: ex('Lines around us', ['A pair that is <b>' + PLAB[target] + '</b> is ' + PEXP[target] + '.', 'The answer is <b>' + items[target] + '</b>: it fits that.', 'The other two do not. ✅']),
      truth: 'pending'
    });
    const ok = q.options.filter(function(x){ return OBJP[target].some(function(it){ return K.text(it) === x.key; }); });
    q.truthKey = ok.length === 1 ? ok[0].key : 'fits:' + ok.length;
    return q;
  }

  const SH = ['triangle_right', 'square', 'rectangle', 'parallelogram', 'trapezium', 'kite', 'pentagon', 'hexagon', 'octagon', 'triangle_equilateral'];
  const SHN = { triangle_right: 'right-angled triangle', square: 'square', rectangle: 'rectangle', parallelogram: 'parallelogram', trapezium: 'trapezium', kite: 'kite', pentagon: 'pentagon', hexagon: 'hexagon', octagon: 'octagon', triangle_equilateral: 'equilateral triangle' };
  // hand-counted: pairs of parallel sides, right angles
  const HAND = { triangle_right: { pp: 0, ra: 1 }, square: { pp: 2, ra: 4 }, rectangle: { pp: 2, ra: 4 }, parallelogram: { pp: 2, ra: 0 }, trapezium: { pp: 1, ra: 0 }, kite: { pp: 0, ra: 0 }, pentagon: { pp: 0, ra: 0 }, hexagon: { pp: 3, ra: 0 }, octagon: { pp: 4, ra: 0 }, triangle_equilateral: { pp: 0, ra: 0 } };
  function art(n){ return /^[aeiou]/.test(n) ? 'an ' + n : 'a ' + n; }

  function parallelCountQ(pool){
    const sh = pick(pool), vis = V.shape2D(sh), n = V.decodePolygon(vis).parallelPairs;
    return numeric({
      prompt: 'How many <b>pairs of parallel sides</b> does this shape have?', visual: vis, answer: n,
      hint: 'Parallel sides run side by side and would never meet, even if you made them longer. Look for sides that point the same way.',
      explain: ex('Finding parallel sides', ['Look for sides that run side by side, like railway tracks.', 'Match them up in pairs.', 'This ' + SHN[sh] + ' has <b>' + n + '</b> pair' + (n === 1 ? '' : 's') + ' of parallel sides. ✅']),
      truth: HAND[sh].pp, decode: function(){ return V.decodePolygon(vis).parallelPairs; },
      wrong: function(v){ return v === n * 2 ? 'You counted the sides. A PAIR is two sides that go together, so count pairs.' : ''; }
    });
  }
  function perpCountQ(){
    const sh = pick(['square', 'rectangle', 'triangle_right', 'kite', 'parallelogram', 'trapezium', 'pentagon', 'hexagon']), vis = V.shape2D(sh), n = V.decodePolygon(vis).rightAngles;
    return numeric({
      prompt: 'Two sides that meet at a right angle are <b>perpendicular</b>. How many pairs of perpendicular sides does this shape have?', visual: vis, answer: n,
      hint: 'Each right angle (square corner) is where one pair of perpendicular sides meets. Check every corner.',
      explain: ex('Finding perpendicular sides', ['Check every corner: is it a square corner?', 'Each square corner is one pair of perpendicular sides.', 'This ' + SHN[sh] + ' has <b>' + n + '</b>. ✅']),
      truth: HAND[sh].ra, decode: function(){ return V.decodePolygon(vis).rightAngles; }
    });
  }
  function horizCountQ(){
    const HV = { rectangle: [2, 2], square: [2, 2], triangle_right: [1, 1], trapezium: [2, 0], parallelogram: [2, 0], kite: [0, 0], pentagon: [1, 0] };
    const sh = pick(Object.keys(HV)), isH = chance(0.5), vis = V.shape2D(sh);
    const pts = ptsOf(vis); let n = 0;
    for(let i = 0; i < pts.length; i++){ const a = pts[i], b = pts[(i + 1) % pts.length]; if(isH ? Math.abs(a[1] - b[1]) < 0.5 : Math.abs(a[0] - b[0]) < 0.5) n++; }
    return numeric({
      prompt: 'How many <b>' + (isH ? 'horizontal' : 'vertical') + '</b> sides does this shape have? (' + (isH ? 'Horizontal sides go flat, side to side.' : 'Vertical sides go straight up and down.') + ')', visual: vis, answer: n,
      hint: (isH ? 'Look for sides that lie flat, like the horizon.' : 'Look for sides that stand straight up, like a flagpole.') + ' Slanting sides do not count.',
      explain: ex('Counting ' + (isH ? 'horizontal' : 'vertical') + ' sides', [isH ? 'Horizontal sides lie flat.' : 'Vertical sides stand straight up.', 'Slanting sides do not count.', 'This ' + SHN[sh] + ' has <b>' + n + '</b>. ✅']),
      truth: HV[sh][isH ? 0 : 1]
    });
  }
  function sideQ(){
    const OPTS = { rectangle: ['top', 'left'], square: ['top', 'left'], parallelogram: ['top', 'left'], trapezium: ['top'] };
    const sh = pick(Object.keys(OPTS)), ask = pick(OPTS[sh]), vis = V.shape2D(sh), pts = ptsOf(vis);
    const sides = pts.map(function(a, i){ const b = pts[(i + 1) % pts.length]; return { i: i, mx: (a[0] + b[0]) / 2, my: (a[1] + b[1]) / 2, dx: b[0] - a[0], dy: b[1] - a[1] }; });
    const by = function(f){ return sides.slice().sort(f)[0].i; };
    const idx = { top: by(function(a, b){ return a.my - b.my; }), bottom: by(function(a, b){ return b.my - a.my; }), left: by(function(a, b){ return a.mx - b.mx; }), right: by(function(a, b){ return b.mx - a.mx; }) };
    const names = ['top', 'bottom', 'left', 'right'].filter(function(n){ return n !== ask; });
    const par = function(i, j){ return Math.abs(sides[i].dx * sides[j].dy - sides[i].dy * sides[j].dx) < 0.01 * Math.hypot(sides[i].dx, sides[i].dy) * Math.hypot(sides[j].dx, sides[j].dy); };
    const partner = names.filter(function(n){ return par(idx[ask], idx[n]); });
    const want = ask === 'top' ? 'bottom' : 'right';
    const ds = names.filter(function(n){ return n !== want; }).map(function(n){ return opt(K.text(n), 'the ' + n + ' side', 'The ' + n + ' side is not parallel to the ' + ask + ' side: it ' + (par(idx[ask], idx[n]) ? 'is' : 'meets it at a corner or leans a different way') + '.'); });
    return mcq({
      prompt: 'Which side of this shape is <b>parallel</b> to the <b>' + ask + '</b> side?', visual: vis, correct: opt(K.text(want), 'the ' + want + ' side'), distractors: ds, count: 3, keepOrder: true,
      hint: 'Parallel sides run side by side. Which side points exactly the same way as the ' + ask + ' side and would never meet it?',
      explain: ex('Finding the parallel side', ['The ' + ask + ' side points one way.', 'The side that runs side by side with it, the same way, is the <b>' + want + ' side</b>.', 'The other sides meet it at corners, so they are not parallel. ✅']),
      truth: K.text(ask === 'top' ? 'bottom' : 'right'), decode: function(){ return partner.length === 1 ? K.text(partner[0]) : 'partners:' + partner.length; }
    });
  }
  const PROPS = [
    { text: 'has <b>no parallel sides</b>', pred: function(h){ return h.pp === 0; } },
    { text: 'has <b>exactly one</b> pair of parallel sides', pred: function(h){ return h.pp === 1; } },
    { text: 'has <b>3 pairs</b> of parallel sides', pred: function(h){ return h.pp === 3; } },
    { text: 'has parallel sides <b>and</b> a right angle', pred: function(h){ return h.pp >= 1 && h.ra >= 1; } },
    { text: 'has parallel sides but <b>no</b> right angles', pred: function(h){ return h.pp >= 1 && h.ra === 0; } }
  ];
  function shapePropQ(){
    const prop = pick(PROPS), fit = SH.filter(function(n){ return prop.pred(HAND[n]); }), non = SH.filter(function(n){ return !prop.pred(HAND[n]); });
    const target = pick(fit);
    const ds = shuffle(non).map(function(n){ return opt(K.text(n), V.shape2D(n, { width: 120 }), 'This ' + SHN[n] + ' has ' + HAND[n].pp + ' pair' + (HAND[n].pp === 1 ? '' : 's') + ' of parallel sides and ' + HAND[n].ra + ' right angle' + (HAND[n].ra === 1 ? '' : 's') + ', so it does not fit.'); });
    const q = mcq({
      prompt: 'Which shape ' + prop.text + '?', visual: '', correct: opt(K.text(target), V.shape2D(target, { width: 120 })), distractors: ds, count: 3,
      hint: 'Check one picture at a time. Look for sides that run side by side (parallel) and for square corners (right angles).',
      explain: ex('Checking each shape', ['The clue: the shape ' + prop.text.replace(/<\/?b>/g, '') + '.', 'The ' + SHN[target] + ' has ' + HAND[target].pp + ' pair' + (HAND[target].pp === 1 ? '' : 's') + ' of parallel sides and ' + HAND[target].ra + ' right angle' + (HAND[target].ra === 1 ? '' : 's') + '.', 'That fits, and the other pictures do not. ✅']),
      truth: 'pending'
    });
    const ok = q.options.filter(function(o){ return prop.pred(HAND[o.key.slice(2)]); });
    q.truthKey = ok.length === 1 ? ok[0].key : 'fits:' + ok.length;
    q.optionsAreVisual = true;
    q.decodeKey = function(){
      const found = [];
      for(let i = 0; i < q.options.length; i++){
        const d = V.decodePolygon(q.options[i].label), nm = q.options[i].key.slice(2);
        if(d.parallelPairs !== HAND[nm].pp || d.rightAngles !== HAND[nm].ra) return 'option ' + i + ' picture does not match its key';
        if(prop.pred({ pp: d.parallelPairs, ra: d.rightAngles })) found.push(q.options[i].key);
      }
      return found.length === 1 ? found[0] : 'fits:' + found.length;
    };
    return q;
  }
  function pairPicQ(){
    const kind = pick(['parallel', 'perpendicular', 'neither']), seeds = shuffle([0, 1, 2]);
    const kinds = ['parallel', 'perpendicular', 'neither'];
    const vis = {}; kinds.forEach(function(k, i){ vis[k] = V.linePair(k, seeds[i]); });
    const q = mcq({
      prompt: 'Which pair of lines is <b>' + PLAB[kind] + '</b>?', visual: '', correct: opt(K.text(kind), vis[kind]),
      distractors: kinds.filter(function(k){ return k !== kind; }).map(function(k){ return opt(K.text(k), vis[k], 'That pair is ' + PLAB[k] + ': ' + PEXP[k] + '.'); }),
      count: 3, hint: 'Parallel = side by side, never meet. Perpendicular = meet at a square corner. Check each picture.',
      explain: ex('Picking a pair of lines', ['A pair that is <b>' + PLAB[kind] + '</b> is ' + PEXP[kind] + '.', 'Look at each picture and test it.', 'Only one picture matches. ✅']),
      truth: K.text(kind)
    });
    q.optionsAreVisual = true;
    q.decodeKey = function(){ let f = null; for(let i = 0; i < q.options.length; i++){ const d = V.decodeLinePair(q.options[i].label); if(K.text(d) !== q.options[i].key) return 'option ' + i + ' picture does not match its key'; if(d === kind) f = q.options[i].key; } return f; };
    return q;
  }
  function pairInShapeQ(){ // is the top side parallel to the bottom side? yes/no style through numeric chunk avoided; use perpendicular check on a corner
    const sh = pick(['rectangle', 'square', 'triangle_right', 'parallelogram', 'trapezium', 'kite']), vis = V.shape2D(sh);
    const hasPerp = HAND[sh].ra > 0;
    return mcq2({
      prompt: 'Does this shape have any <b>perpendicular</b> sides? (Sides that meet at a right angle.)', visual: vis,
      correct: opt(K.bool(hasPerp), hasPerp ? 'Yes' : 'No'),
      other: opt(K.bool(!hasPerp), hasPerp ? 'No' : 'Yes', hasPerp ? 'Look for a square corner. Where two sides meet at a square corner, they are perpendicular.' : 'None of the corners are square, so no sides are perpendicular.'),
      hint: 'Check each corner. Is any of them a perfect square corner?',
      explain: ex('Perpendicular sides', ['Perpendicular sides meet at a right angle (a square corner).', 'This ' + SHN[sh] + ' has ' + HAND[sh].ra + ' right angle' + (HAND[sh].ra === 1 ? '' : 's') + '.', hasPerp ? 'So the answer is <b>Yes</b>. ✅' : 'So the answer is <b>No</b>. ✅']),
      truth: K.bool(HAND[sh].ra > 0), decode: function(){ return K.bool(V.decodePolygon(vis).rightAngles > 0); }
    });
  }

  registerSkill({
    id: 'geo-lines', strand: 'geometry', name: 'Parallel and perpendicular lines', emoji: '📏', year: 3, order: 750, prereq: ['geo-2d-shapes'],
    lesson: {
      title: 'Lines that go places',
      steps: [
        { say: 'A <b>horizontal</b> line goes flat, from side to side, like the <b>horizon</b> where the sea meets the sky.', vis: { kind: 'oneLine', args: ['horizontal'] } },
        { say: 'A <b>vertical</b> line goes straight up and down, like a <b>flagpole</b>.', vis: { kind: 'oneLine', args: ['vertical'] },
          quiz: { prompt: 'A lamp post stands straight up. Is it horizontal or vertical?', options: [{ label: 'Horizontal', ok: false }, { label: 'Vertical', ok: true }, { label: 'Neither', ok: false }], right: 'Yes! Straight up and down is vertical.', wrong: 'Straight up and down is vertical. Horizontal lines lie flat.' } },
        { say: '<b>Parallel</b> lines run side by side, always the same distance apart. They <b>never meet</b>, like railway tracks.', vis: { kind: 'linePair', args: ['parallel', 0] } },
        { say: '<b>Perpendicular</b> lines meet at a <b>right angle</b>, a square corner, like a plus sign.', vis: { kind: 'linePair', args: ['perpendicular', 0] },
          quiz: { prompt: 'Two lines meet at a square corner. What are they?', options: [{ label: 'Parallel', ok: false }, { label: 'Perpendicular', ok: true }, { label: 'Horizontal', ok: false }], right: 'Yes! A square corner means perpendicular.', wrong: 'Lines that meet at a right angle are perpendicular. Parallel lines never meet.' } },
        { say: 'Shapes have them too! A rectangle has <b>2 pairs of parallel sides</b>. Where two sides meet at a red square corner, they are <b>perpendicular</b>.', vis: { kind: 'shape2D', args: ['rectangle', { marks: true }] },
          quiz: { prompt: 'How many pairs of parallel sides does a rectangle have?', options: [{ label: '1', ok: false }, { label: '2', ok: true }, { label: '4', ok: false }], right: 'Yes! Top and bottom, and left and right: 2 pairs.', wrong: 'Top and bottom are one pair, left and right are the other: 2 pairs.' } }
      ]
    },
    trick: {
      title: 'Spot the words inside the words',
      say: 'Look at the word pa<b>ral<u>l</u>el</b>: the two <b>l</b>s stand side by side like parallel lines! And <b>horizontal</b> hides the word <b>horizon</b>, which lies flat. <b>Perpendicular</b> lines make a perfect plus sign.',
      vis: { kind: 'linePair', args: ['parallel', 0] },
      example: 'Railway tracks: <b>parallel</b>. The horizon: <b>horizontal</b>. A plus sign: <b>perpendicular</b>.'
    },
    gen: {
      1: function(){
        const r = randInt(1, 4);
        if(r === 1) return orientQ(3);
        if(r === 2) return objLineQ();
        if(r === 3) return pairQ([0], ['parallel', 'perpendicular'], 2);
        return orientQ(3);
      },
      2: function(){
        const r = randInt(1, 5);
        if(r === 1) return pairQ([0, 1, 2], ['parallel', 'perpendicular', 'neither'], 3);
        if(r === 2) return parallelCountQ(['rectangle', 'square', 'trapezium', 'parallelogram', 'kite', 'pentagon', 'triangle_equilateral']);
        if(r === 3) return objPairQ();
        if(r === 4) return horizCountQ();
        return pairQ([0, 1, 2], ['parallel', 'perpendicular', 'neither'], 3);
      },
      3: function(){
        const r = randInt(1, 6);
        if(r === 1) return pairPicQ();
        if(r === 2) return shapePropQ();
        if(r === 3) return parallelCountQ(SH);
        if(r === 4) return perpCountQ();
        if(r === 5) return sideQ();
        return pairInShapeQ();
      }
    }
  });
})();
