/* LOGIC 3 — Puzzles. Magic squares and triangles, balance scales, missing digits, who-is-who deduction.
   Every puzzle is re-solved BY BRUTE FORCE from the drawing (decoder) and must have exactly one solution. */
(function(){
  const INK = 'var(--vis-ink,#1B1B2F)';
  function r2(n){ return Math.round(n * 100) / 100; }
  function attr(tag, name){ const m = new RegExp(' ' + name + '="([^"]*)"').exec(tag); return m ? m[1] : null; }
  function wrapSvg(w, h, inner, width){
    return '<svg viewBox="0 0 ' + w + ' ' + h + '" width="' + (width || w) + '" role="img" style="max-width:100%;height:auto;display:block;margin:0 auto" xmlns="http://www.w3.org/2000/svg" font-family="-apple-system,Segoe UI,Roboto,Arial,sans-serif">' + inner + '</svg>';
  }
  function range(a, b){ const o = []; for(let i = a; i <= b; i++) o.push(i); return o; }
  const NAMES = ['Ana', 'Marcus', 'Sophie', 'Ivan', 'Lucy', 'Diego', 'Ellen', 'Tom', 'Aisha', 'Kai', 'Mei', 'Leo'];
  function allPerms(n){
    const out = [];
    (function rec(cur, left){ if(!left.length){ out.push(cur); return; } left.forEach(function(x, i){ rec(cur.concat([x]), left.slice(0, i).concat(left.slice(i + 1))); }); })([], range(0, n - 1));
    return out;
  }

  /* ================================================================== MAGIC SQUARE (3x3) */
  const CS = 56;
  function magicSVG(o){ // o.cells 3x3 of number | letter ; o.total number|null
    let s = '';
    for(let r = 0; r < 3; r++) for(let c = 0; c < 3; c++){
      const v = o.cells[r][c], blank = typeof v === 'string';
      s += '<rect class="mc" x="' + (6 + c * CS) + '" y="' + (6 + r * CS) + '" width="' + CS + '" height="' + CS + '" fill="' + (blank ? '#FFF3C4' : ((r + c) % 2 ? '#E6D4FF' : '#CFE1FF')) + '" stroke="' + INK + '" stroke-width="3"/>';
      s += '<text class="mt" x="' + (6 + c * CS + CS / 2) + '" y="' + (6 + r * CS + CS / 2 + 9) + '" text-anchor="middle" font-size="26" font-weight="900" fill="' + (blank ? '#EB5757' : INK) + '">' + v + '</text>';
    }
    if(o.total !== null && o.total !== undefined) s += '<text class="msum" x="' + (6 + 1.5 * CS) + '" y="' + (6 + 3 * CS + 24) + '" text-anchor="middle" font-size="16" font-weight="800" fill="' + INK + '">Total: ' + o.total + '</text>';
    return wrapSvg(12 + 3 * CS, 6 + 3 * CS + (o.total !== null && o.total !== undefined ? 34 : 10), s, 12 + 3 * CS + 20);
  }
  function decodeMagic(html){
    const rects = (html.match(/<rect class="mc"[^>]*>/g) || []).map(function(t){ return { x: parseFloat(attr(t, 'x')), w: parseFloat(attr(t, 'width')), y: parseFloat(attr(t, 'y')) }; });
    const xs = Array.from(new Set(rects.map(function(r){ return r.x; }))).sort(function(a, b){ return a - b; }), ys = Array.from(new Set(rects.map(function(r){ return r.y; }))).sort(function(a, b){ return a - b; });
    const cells = ys.map(function(){ return xs.map(function(){ return null; }); });
    const re = /<text class="mt" x="([\d.]+)" y="([\d.]+)"[^>]*>([^<]*)<\/text>/g; let m;
    while((m = re.exec(html))){
      const cx = parseFloat(m[1]), cy = parseFloat(m[2]) - 9; let ci = 0, ri = 0;
      xs.forEach(function(x, i){ if(cx > x) ci = i; }); ys.forEach(function(y, i){ if(cy > y) ri = i; });
      cells[ri][ci] = /^\d+$/.test(m[3]) ? parseInt(m[3], 10) : m[3];
    }
    const tm = /Total: (\d+)/.exec(html);
    return { cells: cells, total: tm ? parseInt(tm[1], 10) : null };
  }
  const LINES = [[[0, 0], [0, 1], [0, 2]], [[1, 0], [1, 1], [1, 2]], [[2, 0], [2, 1], [2, 2]], [[0, 0], [1, 0], [2, 0]], [[0, 1], [1, 1], [2, 1]], [[0, 2], [1, 2], [2, 2]], [[0, 0], [1, 1], [2, 2]], [[0, 2], [1, 1], [2, 0]]];
  /* all ways to fill the lettered cells so that EVERY line adds to total; returns [{A:..,B:..}] */
  function solveMagic(cells, total){
    const letters = []; cells.forEach(function(row){ row.forEach(function(v){ if(typeof v === 'string' && letters.indexOf(v) < 0) letters.push(v); }); });
    const sols = [];
    (function rec(i, asg){
      if(i === letters.length){
        const g = cells.map(function(row){ return row.map(function(v){ return typeof v === 'string' ? asg[v] : v; }); });
        if(LINES.every(function(L){ return L.reduce(function(t, p){ return t + g[p[0]][p[1]]; }, 0) === total; })) sols.push(Object.assign({}, asg));
        return;
      }
      for(let v = 0; v <= total; v++){ asg[letters[i]] = v; rec(i + 1, asg); }
    })(0, {});
    return sols;
  }
  V.extra.lgMagic = {
    render: function(o){ return magicSVG(o); },
    verify: function(args, html){ const d = decodeMagic(html); return JSON.stringify(d.cells) === JSON.stringify(args[0].cells) && d.total === (args[0].total === undefined ? null : args[0].total) ? '' : 'magic square mismatch'; }
  };
  const LOSHU = [[8, 1, 6], [3, 5, 7], [4, 9, 2]];
  function rot(a){ return [[a[2][0], a[1][0], a[0][0]], [a[2][1], a[1][1], a[0][1]], [a[2][2], a[1][2], a[0][2]]]; }
  function symm(g, k){ let a = g.map(function(r){ return r.slice(); }); for(let i = 0; i < k % 4; i++) a = rot(a); if(k >= 4) a = a.map(function(r){ return r.slice().reverse(); }); return a; }
  function magicGrid(m, t){ return symm(LOSHU, randInt(0, 7)).map(function(r){ return r.map(function(v){ return v * m + t; }); }); }

  function magicQ(o){
    for(let tries = 0; tries < 100; tries++){
      const m = pick(o.ms), t = randInt(o.tMin, o.tMax), g = magicGrid(m, t), S = 15 * m + 3 * t;
      const cells = g.map(function(r){ return r.slice(); });
      let blanks;
      if(o.blanks === 2){
        const r1 = randInt(0, 2), c1 = randInt(0, 2); let r2_ = randInt(0, 2), c2 = randInt(0, 2);
        if(r1 === r2_ || c1 === c2) continue;
        blanks = [[r1, c1, 'A'], [r2_, c2, 'B']];
      } else blanks = [[randInt(0, 2), randInt(0, 2), o.ask === 'total' ? '?' : '?']];
      blanks.forEach(function(b){ cells[b[0]][b[1]] = b[2]; });
      const sols = solveMagic(cells, S);
      if(sols.length !== 1) continue;
      const showTotal = o.ask !== 'total';
      const vis = magicSVG({ cells: cells, total: showTotal ? S : null });
      const target = blanks[randInt(0, blanks.length - 1)], r = target[0], c = target[1], letter = target[2];
      const ans = g[r][c];
      const a1 = g[r][(c + 1) % 3], a2 = g[r][(c + 2) % 3];
      const decodeVal = function(){
        const d = decodeMagic(vis); let tot = d.total;
        if(tot === null){ d.cells.forEach(function(row){ if(tot === null && row.every(function(v){ return typeof v === 'number'; })) tot = row.reduce(function(x, y){ return x + y; }, 0); }); }
        if(o.ask === 'total') return tot;
        const ss = solveMagic(d.cells, tot); return ss.length === 1 ? ss[0][letter] : NaN;
      };
      if(o.ask === 'total'){
        // total shown nowhere: find a complete row
        const full = cells.some(function(row){ return row.every(function(v){ return typeof v === 'number'; }); });
        if(!full) continue;
        const rowDone = cells.filter(function(row){ return row.every(function(v){ return typeof v === 'number'; }); })[0];
        return mcqNum({
          prompt: 'In a magic square every row, column and diagonal adds up to the SAME total. What is the total here?', visual: vis, answer: S, count: 4,
          wrong: [{ v: S - 3, why: 'Add up a whole row of THREE numbers, then check with another.' }, { v: S + 3, why: 'Add up a whole row of THREE numbers, then check with another.' }, { v: rowDone[0] + rowDone[1], why: 'That is only two numbers. A row has three.' }],
          hint: 'Find a row, column or diagonal that has no ? box. Add its three numbers.',
          explain: ex('Finding the magic total', ['Find a line with all three numbers showing: <b>' + rowDone.join(' + ') + '</b>.', rowDone.join(' + ') + ' = <b>' + S + '</b>.', 'Every line must give the same total, so the magic total is <b>' + S + '</b>. ✅']),
          truth: g[0][0] + g[0][1] + g[0][2], decode: decodeVal
        });
      }
      const ask = o.blanks === 2 ? 'What number goes in box ' + letter + '?' : 'What number goes in the ? box?';
      const prompt = 'In this magic square every row, column and diagonal adds up to ' + S + '. ' + ask;
      const explain = ex('Using a line that adds to ' + S, [
        'Pick the row with the ' + (o.blanks === 2 ? 'box ' + letter : '?') + (o.blanks === 2 ? ' (the other box is in a different row).' : '.'),
        'The other two numbers are <b>' + a1 + '</b> and <b>' + a2 + '</b>: ' + a1 + ' + ' + a2 + ' = ' + (a1 + a2) + '.',
        S + ' − ' + (a1 + a2) + ' = <b>' + ans + '</b>. ✅'
      ]);
      const hint = 'Look at the row that holds the box. The three numbers must make ' + S + '. How much is still needed after the two you can see?';
      if(o.typed){
        return numeric({ prompt: prompt, visual: vis, answer: ans, hint: hint, explain: explain, truth: S - a1 - a2, decode: decodeVal,
          wrong: function(v){ return v === (o.blanks === 2 ? g[blanks.filter(function(b){ return b[2] !== letter; })[0][0]][blanks.filter(function(b){ return b[2] !== letter; })[0][1]] : -1) ? 'That is the number for the OTHER box.' : (v === S - a1 || v === S - a2 ? 'You took away only one number. Take away both.' : ''); } });
      }
      return mcqNum({ prompt: prompt, visual: vis, answer: ans, count: o.count || 4,
        wrong: [{ v: S - a1, why: 'You took away only one of the two numbers. Take away both.' }, { v: S - a2, why: 'You took away only one of the two numbers. Take away both.' }, { v: a1 + a2, why: 'That is the two numbers added. Take them away from ' + S + ' instead.' }, { v: ans + 1, why: 'Check: the row must add to exactly ' + S + '.' }, { v: ans - 1, why: 'Check: the row must add to exactly ' + S + '.' }],
        hint: hint, explain: explain, truth: S - a1 - a2, decode: decodeVal });
    }
    throw new Error('magicQ failed');
  }

  /* ================================================================== MAGIC TRIANGLE */
  const TPTS = { A: [150, 34], B: [34, 206], C: [266, 206] };
  function triPositions(){ // index 0..5 : A, d(AB), B, e(BC), C, f(CA)
    const A = TPTS.A, B = TPTS.B, C = TPTS.C;
    const mid = function(p, q){ return [(p[0] + q[0]) / 2, (p[1] + q[1]) / 2]; };
    return [A, mid(A, B), B, mid(B, C), C, mid(C, A)];
  }
  function triSVG(vals, S){ // vals: 6 entries number | '?'
    const P = triPositions(); let s = '';
    s += '<polygon points="' + [P[0], P[2], P[4]].map(function(p){ return p.join(','); }).join(' ') + '" fill="#F4F6FD" stroke="' + INK + '" stroke-width="3"/>';
    P.forEach(function(p, i){
      const blank = typeof vals[i] === 'string';
      s += '<circle cx="' + p[0] + '" cy="' + p[1] + '" r="22" fill="' + (blank ? '#FFF3C4' : '#fff') + '" stroke="' + INK + '" stroke-width="3"/>';
      s += '<text class="tv" x="' + r2(p[0]) + '" y="' + r2(p[1] + 8) + '" text-anchor="middle" font-size="22" font-weight="900" fill="' + (blank ? '#EB5757' : INK) + '">' + vals[i] + '</text>';
    });
    s += '<text class="tsum" x="150" y="170" text-anchor="middle" font-size="13" font-weight="800" fill="' + INK + '">Each side adds up to ' + S + '</text>';
    return wrapSvg(300, 236, s, 280);
  }
  function decodeTri(html){
    const re = /<text class="tv" x="([\d.]+)" y="([\d.]+)"[^>]*>([^<]*)<\/text>/g, nodes = []; let m;
    while((m = re.exec(html))) nodes.push({ x: parseFloat(m[1]), y: parseFloat(m[2]) - 8, v: /^\d+$/.test(m[3]) ? parseInt(m[3], 10) : m[3] });
    const sm = /adds up to (\d+)/.exec(html), S = sm ? parseInt(sm[1], 10) : NaN;
    const sides = [];
    for(let i = 0; i < nodes.length; i++) for(let j = i + 1; j < nodes.length; j++) for(let k = j + 1; k < nodes.length; k++){
      const a = nodes[i], b = nodes[j], c = nodes[k];
      if(Math.abs((b.x - a.x) * (c.y - a.y) - (b.y - a.y) * (c.x - a.x)) < 0.5) sides.push([i, j, k]);
    }
    return { nodes: nodes, sides: sides, S: S };
  }
  function triMissing(d){
    const bi = d.nodes.findIndex(function(n){ return typeof n.v === 'string'; });
    const vals = d.sides.filter(function(sd){ return sd.indexOf(bi) >= 0; }).map(function(sd){ return d.S - sd.filter(function(i){ return i !== bi; }).reduce(function(t, i){ return t + d.nodes[i].v; }, 0); });
    return vals.length && vals.every(function(v){ return v === vals[0]; }) && d.sides.length === 3 ? vals[0] : NaN;
  }
  V.extra.lgTriangle = {
    render: function(vals, S){ return triSVG(vals, S); },
    verify: function(args, html){ const d = decodeTri(html); return JSON.stringify(d.nodes.map(function(n){ return n.v; })) === JSON.stringify(args[0]) && d.S === args[1] && d.sides.length === 3 ? '' : 'triangle mismatch'; }
  };
  function triQ(o){
    for(let tries = 0; tries < 3000; tries++){
      const a = randInt(o.lo, o.hi), b = randInt(o.lo, o.hi), c = randInt(o.lo, o.hi);
      const S = randInt(o.sLo, o.sHi), d = S - a - b, e = S - b - c, f = S - c - a;
      const six = [a, d, b, e, c, f];
      if(new Set(six).size !== 6 || six.some(function(v){ return v < o.lo || v > o.max; })) continue;
      const bi = o.corner === undefined ? randInt(0, 5) : (o.corner ? pick([0, 2, 4]) : pick([1, 3, 5]));
      const vals = six.slice(); vals[bi] = '?';
      const vis = triSVG(vals, S);
      // exactly one value fits (all three sides must add to S)
      let fits = 0, fitV = -1;
      for(let v = 0; v <= 60; v++){ const t = six.slice(); t[bi] = v; if(t[0] + t[1] + t[2] === S && t[2] + t[3] + t[4] === S && t[4] + t[5] + t[0] === S){ fits++; fitV = v; } }
      if(fits !== 1 || fitV !== six[bi]) continue;
      const sidesIdx = [[0, 1, 2], [2, 3, 4], [4, 5, 0]].filter(function(sd){ return sd.indexOf(bi) >= 0; })[0];
      const others = sidesIdx.filter(function(i){ return i !== bi; }).map(function(i){ return six[i]; });
      const ans = six[bi];
      const prompt = 'In this magic triangle each side adds up to ' + S + '. What number goes in the ? circle?';
      const explain = ex('Using one side', [
        'Choose a side that has the ? circle. The other two numbers on it are <b>' + others[0] + '</b> and <b>' + others[1] + '</b>.',
        others[0] + ' + ' + others[1] + ' = ' + (others[0] + others[1]) + '.',
        S + ' − ' + (others[0] + others[1]) + ' = <b>' + ans + '</b>. ✅'
      ]);
      const hint = 'Pick a side with the ? circle on it. The three numbers on that side must add to ' + S + '.';
      const decode = function(){ return triMissing(decodeTri(vis)); };
      if(o.typed) return numeric({ prompt: prompt, visual: vis, answer: ans, hint: hint, explain: explain, truth: S - others[0] - others[1], decode: decode, wrong: function(v){ return v === others[0] + others[1] ? 'That is the two numbers added. Take them away from ' + S + '.' : ''; } });
      return mcqNum({ prompt: prompt, visual: vis, answer: ans, count: 4, valid: function(v){ return v >= 1; },
        wrong: [{ v: others[0] + others[1], why: 'That is the two numbers added. Take them away from ' + S + ' instead.' }, { v: S - others[0], why: 'You took away only one number. Take away both.' }, { v: S - others[1], why: 'You took away only one number. Take away both.' }],
        hint: hint, explain: explain, truth: S - others[0] - others[1], decode: decode });
    }
    throw new Error('triQ failed');
  }

  /* ================================================================== BALANCE SCALES */
  function scalesSVG(L, Rr, tilt){ // L,R arrays of number | '?' ; tilt 'L' (left heavier) | 'R' | 'level'
    const ty = tilt === 'L' ? 16 : tilt === 'R' ? -16 : 0;
    const lx = 62, rx = 298, ly = 46 + ty, ry = 46 - ty; let s = '';
    s += '<rect x="170" y="160" width="20" height="10" rx="3" fill="' + INK + '"/><rect x="176" y="46" width="8" height="118" fill="' + INK + '"/>';
    s += '<line class="beam" x1="' + lx + '" y1="' + ly + '" x2="' + rx + '" y2="' + ry + '" stroke="' + INK + '" stroke-width="7" stroke-linecap="round"/><circle cx="180" cy="46" r="9" fill="#F2C94C" stroke="' + INK + '" stroke-width="3"/>';
    [[lx, ly, L], [rx, ry, Rr]].forEach(function(side){
      const px = side[0], py = side[1], items = side[2], plateY = py + 74;
      s += '<line x1="' + px + '" y1="' + py + '" x2="' + (px - 48) + '" y2="' + plateY + '" stroke="' + INK + '" stroke-width="2"/><line x1="' + px + '" y1="' + py + '" x2="' + (px + 48) + '" y2="' + plateY + '" stroke="' + INK + '" stroke-width="2"/>';
      s += '<path d="M' + (px - 56) + ' ' + plateY + ' L' + (px + 56) + ' ' + plateY + ' Q' + px + ' ' + (plateY + 22) + ' ' + (px - 56) + ' ' + plateY + ' Z" fill="#CFE1FF" stroke="' + INK + '" stroke-width="3"/>';
      const w = 34, gap = 3, tot = items.length * (w + gap) - gap;
      items.forEach(function(v, i){
        const bx = px - tot / 2 + i * (w + gap), unk = typeof v === 'string';
        s += '<rect class="wt" x="' + r2(bx) + '" y="' + (plateY - 32) + '" width="' + w + '" height="32" rx="5" fill="' + (unk ? '#FFD6D6' : '#E6D4FF') + '" stroke="' + INK + '" stroke-width="2.5"/>';
        s += '<text class="wl" x="' + r2(bx + w / 2) + '" y="' + (plateY - 11) + '" text-anchor="middle" font-size="' + (unk ? 20 : 14) + '" font-weight="900" fill="' + (unk ? '#EB5757' : INK) + '">' + (unk ? '?' : v + 'g') + '</text>';
      });
    });
    return wrapSvg(360, 190, s, 360);
  }
  function decodeScales(html){
    const bm = /<line class="beam" x1="[\d.-]+" y1="([\d.-]+)" x2="[\d.-]+" y2="([\d.-]+)"/.exec(html);
    const diff = parseFloat(bm[1]) - parseFloat(bm[2]); // left end lower on screen (bigger y) => left heavier
    const tilt = diff > 3 ? 'L' : diff < -3 ? 'R' : 'level';
    const L = [], Rr = [], re = /<text class="wl" x="([\d.]+)"[^>]*>([^<]*)<\/text>/g; let m;
    while((m = re.exec(html))){ const v = m[2] === '?' ? '?' : parseInt(m[2], 10); (parseFloat(m[1]) < 180 ? L : Rr).push(v); }
    return { tilt: tilt, L: L, R: Rr };
  }
  function sumKnown(a){ return a.filter(function(v){ return v !== '?'; }).reduce(function(t, v){ return t + v; }, 0); }
  function cntUnk(a){ return a.filter(function(v){ return v === '?'; }).length; }
  /* when level: sumL + x*cL = sumR + x*cR */
  function scalesSolve(d){
    const cL = cntUnk(d.L), cR = cntUnk(d.R);
    if(d.tilt !== 'level' || cL === cR) return NaN;
    return (sumKnown(d.R) - sumKnown(d.L)) / (cL - cR);
  }
  V.extra.lgScales = {
    render: function(L, Rr, tilt){ return scalesSVG(L, Rr, tilt); },
    verify: function(args, html){ const d = decodeScales(html); return JSON.stringify(d.L) === JSON.stringify(args[0]) && JSON.stringify(d.R) === JSON.stringify(args[1]) && d.tilt === args[2] ? '' : 'scales mismatch'; }
  };
  function heavierQ(){
    for(let tries = 0; tries < 80; tries++){
      const nl = randInt(1, 3), nr = randInt(1, 3);
      const L = range(1, nl).map(function(){ return randInt(1, 12); }), Rr = range(1, nr).map(function(){ return randInt(1, 12); });
      const sl = L.reduce(function(a, b){ return a + b; }, 0), sr = Rr.reduce(function(a, b){ return a + b; }, 0);
      if(sl === sr && chance(0.6)) continue;
      const tilt = sl > sr ? 'L' : sl < sr ? 'R' : 'level';
      const vis = scalesSVG(L, Rr, tilt);
      const names = { L: 'The left side', R: 'The right side', level: 'They weigh the same' };
      const ds = ['L', 'R', 'level'].filter(function(k){ return k !== tilt; }).map(function(k){ return opt(K.text(k), names[k], k === 'level' ? 'The scales are tipping, so the two sides are NOT the same.' : (tilt === 'level' ? 'The scales are level, so neither side is heavier.' : 'The heavier side goes DOWN. ' + names[k] + ' is up in the air, so it is lighter.')); });
      return mcq({
        prompt: 'Which side is heavier?', visual: vis, correct: opt(K.text(tilt), names[tilt]), distractors: ds, keepOrder: true, count: 3,
        hint: 'Add up the weights on each side. Or look: the heavier side goes down.',
        explain: ex('Comparing the two sides', ['Left side: ' + L.join(' + ') + ' = <b>' + sl + 'g</b>.', 'Right side: ' + Rr.join(' + ') + ' = <b>' + sr + 'g</b>.', tilt === 'level' ? 'Both are ' + sl + 'g, so <b>They weigh the same</b>. ✅' : (sl > sr ? '<b>The left side</b>' : '<b>The right side</b>') + ' is heavier, so it goes down. ✅']),
        truth: K.text(sl > sr ? 'L' : sl < sr ? 'R' : 'level'),
        decode: function(){ const d = decodeScales(vis); return K.text(d.tilt); }
      });
    }
    throw new Error('heavierQ failed');
  }
  function balanceQ(o){
    for(let tries = 0; tries < 100; tries++){
      const x = randInt(o.xLo, o.xHi), kind = pick(o.kinds);
      let L, Rr;
      if(kind === 'a'){ const a = randInt(1, 15); L = [x, a]; Rr = [x + a]; }                        // ? + a = b
      else if(kind === 'b'){ const k = pick([2, 3]); L = range(1, k).map(function(){ return x; }); Rr = [k * x]; }  // k blocks = c
      else if(kind === 'c'){ const a = randInt(1, 12), b = randInt(1, 12); L = [x, a, b]; Rr = [x + a + b + 0]; }
      else if(kind === 'd'){ const a = randInt(2, 14); L = [x, x, a]; Rr = [x, x + a]; if(2 * x + a === x + x + a) { /* same count? no */ } L = [x, x, a]; Rr = [x + x + a - x]; }
      else { const k = pick([2, 3]), a = randInt(2, 15); L = range(1, k).map(function(){ return x; }).concat([a]); Rr = [k * x + a]; } // k blocks + a = b
      if(kind === 'e' && false) continue;
      // build with two unknown sides: L: 2?+a , R: ?+b  (b = ? + a)
      if(kind === 'd'){ const a2 = randInt(2, 14); L = [x, x, a2]; Rr = [x, x + a2]; }
      // the '?' blocks: replace every x that is a block with '?'
      function mark(arr, known){ return arr; }
      const draw = function(arr, blockCount){ return arr; };
      let LL, RR;
      if(kind === 'a'){ LL = ['?', L[1]]; RR = [Rr[0]]; }
      else if(kind === 'b'){ LL = L.map(function(){ return '?'; }); RR = Rr; }
      else if(kind === 'c'){ LL = ['?', L[1], L[2]]; RR = Rr; }
      else if(kind === 'd'){ LL = ['?', '?', L[2]]; RR = ['?', Rr[1]]; }
      else { LL = L.map(function(v, i){ return i < L.length - 1 ? '?' : v; }); RR = Rr; }
      // keep the right-hand weights as numbers; rewrite RR for kind d so that  x*2 + a = x + b  -> b = x + a
      if(kind === 'd'){ RR = ['?', L[2] + x]; }
      if(RR.some(function(v){ return v !== '?' && v > 60; }) || LL.length > 4 || RR.length > 4) continue;
      const vis = scalesSVG(LL, RR, 'level');
      const dec = function(){ return scalesSolve(decodeScales(vis)); };
      // brute-force: exactly one block weight makes it balance
      let fit = 0, fx = -1;
      for(let v = 1; v <= 80; v++){ if(sumKnown(LL) + v * cntUnk(LL) === sumKnown(RR) + v * cntUnk(RR)){ fit++; fx = v; } }
      if(fit !== 1 || fx !== x) continue;
      const cL = cntUnk(LL), cR = cntUnk(RR);
      const nBlocks = cL + cR;
      let steps;
      if(cR === 0){
        const diff = sumKnown(RR) - sumKnown(LL);
        steps = ['The scales are <b>level</b>, so both sides weigh the same.', 'Left: ' + (cL === 1 ? 'the ? block' : cL + ' ? blocks') + (sumKnown(LL) ? ' + ' + sumKnown(LL) + 'g' : '') + '. Right: ' + sumKnown(RR) + 'g.', sumKnown(LL) ? 'Take ' + sumKnown(LL) + 'g away from ' + sumKnown(RR) + 'g: ' + sumKnown(RR) + ' − ' + sumKnown(LL) + ' = ' + diff + 'g for ' + (cL === 1 ? 'the block' : 'all ' + cL + ' blocks') + '.' : 'All ' + cL + ' blocks weigh ' + diff + 'g together.'];
        if(cL > 1) steps.push(diff + ' ÷ ' + cL + ' = <b>' + x + 'g</b> for one block. ✅'); else steps.push('So the ? block weighs <b>' + x + 'g</b>. ✅');
      } else {
        steps = ['The scales are <b>level</b>. Left has ' + cL + ' ? blocks and ' + sumKnown(LL) + 'g. Right has ' + cR + ' ? block' + (cR === 1 ? '' : 's') + ' and ' + sumKnown(RR) + 'g.', 'Take one ? block off BOTH sides. They still balance: the left now has ' + (cL - 1) + ' block' + (cL - 1 === 1 ? '' : 's') + ' and ' + sumKnown(LL) + 'g, the right has ' + sumKnown(RR) + 'g.', (cL - 1) + ' block' + (cL - 1 === 1 ? '' : 's') + ' + ' + sumKnown(LL) + 'g = ' + sumKnown(RR) + 'g, so the block weighs ' + sumKnown(RR) + ' − ' + sumKnown(LL) + ' = <b>' + x + 'g</b>. ✅'];
      }
      const same = nBlocks > 1 ? ' All the ? blocks weigh the same.' : '';
      const prompt = 'The scales are level.' + same + ' How much does one ? block weigh?';
      const hint = 'Level means both sides weigh the same. Take away the same weight from both sides until only the ? block is left.';
      if(o.typed) return numeric({ prompt: prompt, visual: vis, answer: x, unit: 'g', hint: hint, explain: ex('Balancing the scales', steps), truth: x, decode: dec,
        wrong: function(v){ return v === sumKnown(RR) ? 'That is the whole weight on the other side. Part of it is balanced by other weights.' : (v === sumKnown(RR) - sumKnown(LL) && cL > 1 ? 'That is the weight of ALL the blocks. Share it between them.' : ''); } });
      return mcqNum({ prompt: prompt, visual: vis, answer: x, count: 4, fmt: function(v){ return v + 'g'; }, valid: function(v){ return v >= 1; },
        wrong: [{ v: sumKnown(RR), why: 'That is the whole weight on the other side. Some of it is balanced by other weights.' }, { v: sumKnown(RR) + sumKnown(LL), why: 'Take the small weights AWAY from the total, do not add.' }, { v: cL > 1 && cR === 0 ? sumKnown(RR) - sumKnown(LL) : x + 2, why: cL > 1 && cR === 0 ? 'That is the weight of ALL the blocks together. Share it out.' : 'Put your answer back on the scales to check.' }],
        hint: hint, explain: ex('Balancing the scales', steps), truth: x, decode: dec });
    }
    throw new Error('balanceQ failed');
  }

  /* ================================================================== MISSING DIGITS */
  function numHTML(digs){ // digs: array of digit chars or {box:'A'}
    return '<span class="mn" style="display:inline-flex;gap:3px">' + digs.map(function(d){
      return typeof d === 'object' ? '<span class="dbx" data-l="' + d.box + '" style="display:inline-block;min-width:34px;padding:2px 4px;text-align:center;border:3px dashed #EB5757;border-radius:8px;background:#FFF3C4;color:#EB5757">' + d.show + '</span>' : '<span class="dg">' + d + '</span>';
    }).join('') + '</span>';
  }
  function sumHTML(a, op, b, c){
    return '<div class="msumq" style="display:flex;align-items:center;justify-content:center;gap:10px;flex-wrap:wrap;font:900 30px system-ui;color:' + INK + '">' + numHTML(a) + '<span class="op">' + op + '</span>' + numHTML(b) + '<span class="op">=</span>' + numHTML(c) + '</div>';
  }
  function decodeSum(html){
    const nums = []; const re = /<span class="mn"[^>]*>([\s\S]*?)<\/span><\/span>|<span class="mn"[^>]*>((?:<span class="(?:dg|dbx)"[^>]*>[^<]*<\/span>)+)<\/span>/g; let m;
    const reN = /<span class="mn"[^>]*>((?:<span class="(?:dg|dbx)"[^>]*>[^<]*<\/span>)+)<\/span>/g;
    while((m = reN.exec(html))){
      const digs = []; const rd = /<span class="(dg|dbx)"([^>]*)>([^<]*)<\/span>/g; let k;
      while((k = rd.exec(m[1]))) digs.push(k[1] === 'dg' ? parseInt(k[3], 10) : { box: attr(' ' + k[2], 'data-l') });
      nums.push(digs);
    }
    const ops = []; const ro = /<span class="op">([^<]*)<\/span>/g; let o;
    while((o = ro.exec(html))) ops.push(o[1]);
    return { nums: nums, op: ops[0] };
  }
  function solveSum(d){
    const labels = []; d.nums.forEach(function(n){ n.forEach(function(x){ if(typeof x === 'object' && labels.indexOf(x.box) < 0) labels.push(x.box); }); });
    const sols = [];
    (function rec(i, asg){
      if(i === labels.length){
        const vals = d.nums.map(function(n){ if(n.length > 1){ const first = typeof n[0] === 'object' ? asg[n[0].box] : n[0]; if(first === 0) return NaN; } return parseInt(n.map(function(x){ return typeof x === 'object' ? asg[x.box] : x; }).join(''), 10); });
        const ok = d.op === '+' ? vals[0] + vals[1] === vals[2] : d.op === '−' ? vals[0] - vals[1] === vals[2] : vals[0] * vals[1] === vals[2];
        if(ok) sols.push(Object.assign({}, asg));
        return;
      }
      for(let v = 0; v <= 9; v++){ asg[labels[i]] = v; rec(i + 1, asg); }
    })(0, {});
    return sols;
  }
  V.extra.lgSum = {
    render: function(a, op, b, c){ return sumHTML(a, op, b, c); },
    verify: function(args, html){ const d = decodeSum(html); return JSON.stringify(d.nums) === JSON.stringify([args[0], args[2], args[3]].map(function(n){ return n.map(function(x){ return typeof x === 'object' ? { box: x.box } : x; }); })) && d.op === args[1] ? '' : 'sum mismatch'; }
  };
  function digitsOf(n){ return String(n).split('').map(Number); }
  /* template: place boxes into operands (never the answer) */
  function sumQ(o){
    for(let tries = 0; tries < 200; tries++){
      const op = o.ops ? pick(o.ops) : '+';
      let a, b, c;
      if(op === '+'){ a = randInt(o.lo, o.hi); b = randInt(o.lo, o.hi); c = a + b; }
      else if(op === '−'){ a = randInt(o.lo + 10, o.hi); b = randInt(o.lo, a - 1); c = a - b; if(c < 1) continue; }
      else { a = randInt(2, 9); b = randInt(2, 9); c = a * b; }
      if(op === '×' && o.noTimes) continue;
      const D = [digitsOf(a), digitsOf(b), digitsOf(c)];
      const boxes = o.boxes;
      // choose box cells inside operands a and b
      const cells = []; D.slice(0, 2).forEach(function(dg, ni){ dg.forEach(function(_, di){ cells.push([ni, di]); }); });
      let picked;
      if(boxes === 1) picked = [pick(cells)];
      else {
        picked = sample(cells, 2);
        // boxes must sit in different columns (counted from the right) unless in the same number
        const col = function(p){ return D[p[0]].length - 1 - p[1]; };
        if(o.mode === 'columns' && (picked[0][0] === picked[1][0] || col(picked[0]) === col(picked[1]))) continue;
        if(o.mode === 'same' && picked[0][0] !== picked[1][0]) continue;
        if(op !== '+' && o.mode === 'columns') continue;
      }
      const letters = ['A', 'B'];
      const shown = D.map(function(dg, ni){ return dg.map(function(x, di){ const k = picked.findIndex(function(p){ return p[0] === ni && p[1] === di; }); return k >= 0 ? { box: letters[k], show: boxes === 1 ? '?' : letters[k] } : x; }); });
      const vis = sumHTML(shown[0], op, shown[1], shown[2]);
      const d0 = decodeSum(vis), sols = solveSum(d0);
      if(sols.length !== 1) continue;
      const ask = boxes === 1 ? 0 : randInt(0, 1);
      const letter = letters[ask], p = picked[ask], ans = D[p[0]][p[1]];
      if(sols[0][letter] !== ans) continue;
      const decode = function(){ const ss = solveSum(decodeSum(vis)); return ss.length === 1 ? ss[0][letter] : NaN; };
      const prompt = boxes === 1 ? 'Which digit is hiding in the ? box?' : 'Two digits are hiding. Which digit is box ' + letter + '?';
      const full = a + ' ' + op + ' ' + b + ' = ' + c;
      // explanation
      let steps;
      const hasOne = picked.length === 1 || picked[0][0] === picked[1][0];
      if(hasOne){
        const n = picked[0][0]; const other = n === 0 ? b : a;
        const val = n === 0 ? a : b;
        const calc = op === '+' ? (n === 0 ? c + ' − ' + b + ' = ' + a : c + ' − ' + a + ' = ' + b) : op === '−' ? (n === 0 ? c + ' + ' + b + ' = ' + a : a + ' − ' + c + ' = ' + b) : c + ' ÷ ' + other + ' = ' + val;
        steps = ['Use the <b>opposite</b> (inverse) calculation to find the whole hidden number.', calc + ', so the hidden number is <b>' + val + '</b>.', 'Its digits are ' + digitsOf(val).join(' and ') + ', so ' + (boxes === 1 ? 'the box' : 'box ' + letter) + ' is <b>' + ans + '</b>. ✅'];
      } else {
        // column addition, ones first
        const A = D[0].slice().reverse(), B = D[1].slice().reverse(), C = D[2].slice().reverse(); let carry = 0; steps = ['Work from the <b>ones</b> column on the right, and remember any carry.'];
        const names = ['Ones', 'Tens', 'Hundreds'];
        for(let i = 0; i < Math.max(A.length, B.length); i++){
          const x = A[i] === undefined ? 0 : A[i], y = B[i] === undefined ? 0 : B[i], tot = x + y + carry;
          const hid = picked.some(function(q){ return D[q[0]].length - 1 - q[1] === i; });
          const hv = picked.filter(function(q){ return D[q[0]].length - 1 - q[1] === i; });
          steps.push(names[i] + ': ' + x + ' + ' + y + (carry ? ' + ' + carry + ' carried' : '') + ' = ' + tot + (tot >= 10 ? ' → write ' + (tot % 10) + ', carry 1' : ' → write ' + tot) + (hid ? ' &nbsp;so the hidden digit here is <b>' + hv.map(function(q){ return D[q[0]][q[1]]; }).join('</b> and <b>') + '</b>.' : '.'));
          carry = tot >= 10 ? 1 : 0;
        }
        steps.push('The sum is ' + full + ', so ' + 'box ' + letter + ' is <b>' + ans + '</b>. ✅');
      }
      const hint = o.mode === 'columns' ? 'Start with the ones column. What must the hidden digit be to make the answer end in the right digit? Watch for a carry.' : (boxes === 1 || o.mode === 'same' ? 'Use the opposite calculation to find the whole number first, then read its digits.' : 'Try the ones column first.');
      if(o.typed) return numeric({ prompt: prompt, visual: vis, answer: ans, hint: hint, explain: ex('Finding the digit', steps), truth: (function(){ let t = -1; for(let v = 0; v <= 9; v++){ const dd = D.map(function(x){ return x.slice(); }); if(solveSumWith(shown, letter, v, op)) t = v; } return t; })(), decode: decode });
      return mcqNum({ prompt: prompt, visual: vis, answer: ans, count: 4, valid: function(v){ return v >= 0 && v <= 9; }, nearby: [1, -1, 2, -2, 3, -3, 4, -4, 5, -5],
        wrong: [{ v: ans + 1, why: 'Put it back in and check: do the calculation again — remember any carry or borrow.' }, { v: ans - 1, why: 'Put it back in and check: do the calculation again — remember any carry or borrow.' }],
        hint: hint, explain: ex('Finding the digit', steps), truth: (function(){ let t = -1; for(let v = 0; v <= 9; v++) if(solveSumWith(shown, letter, v, op)) t = v; return t; })(), decode: decode });
    }
    throw new Error('sumQ failed');
  }
  /* independent check: does giving `letter` the value v leave the sum solvable? (tries the other box too) */
  function solveSumWith(shown, letter, v, op){
    const labels = []; shown.forEach(function(n){ n.forEach(function(x){ if(typeof x === 'object' && labels.indexOf(x.box) < 0) labels.push(x.box); }); });
    const others = labels.filter(function(l){ return l !== letter; });
    const tryAll = function(asg){
      const vals = shown.map(function(n){ if(n.length > 1){ const f = typeof n[0] === 'object' ? asg[n[0].box] : n[0]; if(f === 0) return NaN; } return Number(n.map(function(x){ return typeof x === 'object' ? asg[x.box] : x; }).join('')); });
      return op === '+' ? vals[0] + vals[1] === vals[2] : op === '−' ? vals[0] - vals[1] === vals[2] : vals[0] * vals[1] === vals[2];
    };
    if(!others.length) { const a = {}; a[letter] = v; return tryAll(a); }
    for(let w = 0; w <= 9; w++){ const a = {}; a[letter] = v; a[others[0]] = w; if(tryAll(a)) return true; }
    return false;
  }

  /* ================================================================== WHO IS WHO (deduction) */
  const SETS = [
    { word: 'pet', items: [{ n: 'cat', e: '🐱' }, { n: 'dog', e: '🐶' }, { n: 'rabbit', e: '🐰' }, { n: 'fish', e: '🐟' }, { n: 'hamster', e: '🐹' }], has: 'has the', ask: 'Who has the ' },
    { word: 'fruit', items: [{ n: 'apple', e: '🍎' }, { n: 'banana', e: '🍌' }, { n: 'grapes', e: '🍇' }, { n: 'orange', e: '🍊' }, { n: 'strawberry', e: '🍓' }], has: 'has the', ask: 'Who has the ' },
    { word: 'sport', items: [{ n: 'football', e: '⚽' }, { n: 'swimming', e: '🏊' }, { n: 'tennis', e: '🎾' }, { n: 'cycling', e: '🚲' }, { n: 'skating', e: '⛸️' }], has: 'plays', ask: 'Who plays ' }
  ];
  function cluesHTML(names, items, clues, cap){
    let s = '<div class="clues" data-names="' + names.join(',') + '" data-items="' + items.map(function(i){ return i.n; }).join(',') + '" style="max-width:340px;margin:0 auto;text-align:left;color:' + INK + ';font-weight:700">';
    s += '<div style="text-align:center;font-weight:900;margin-bottom:6px">' + names.join(' • ') + (items.length ? '<br><span style="font-size:22px">' + items.map(function(i){ return i.e; }).join(' ') + '</span>' : '') + '</div><ol style="margin:0;padding-left:22px">';
    clues.forEach(function(c){ s += '<li class="clue" data-t="' + c.t + '" data-a="' + c.a + '" data-b="' + c.b + '" style="margin:5px 0">' + c.text + '</li>'; });
    return s + '</ol></div>';
  }
  function decodeClues(html){
    const names = /data-names="([^"]*)"/.exec(html)[1].split(','), items = (/data-items="([^"]*)"/.exec(html)[1] || '').split(',').filter(function(x){ return x; });
    const clues = []; const re = /<li class="clue" data-t="(\w+)" data-a="([^"]*)" data-b="([^"]*)"/g; let m;
    while((m = re.exec(html))) clues.push({ t: m[1], a: m[2], b: m[3] });
    return { names: names, items: items, clues: clues };
  }
  /* solutions: for matching puzzles, perm[i] = item index of names[i]; for ordering puzzles, perm[i] = rank of names[i] (0 = first) */
  function okClue(c, d, perm){
    const ni = d.names.indexOf(c.a);
    if(c.t === 'pos') return perm[ni] === d.items.indexOf(c.b);
    if(c.t === 'neg') return perm[ni] !== d.items.indexOf(c.b);
    return perm[ni] < perm[d.names.indexOf(c.b)];   // gt: a comes before b
  }
  function solutions(d, clues){
    return allPerms(d.names.length).filter(function(p){ return (clues || d.clues).every(function(c){ return okClue(c, d, p); }); });
  }
  V.extra.lgClues = {
    render: function(names, items, clues){ return cluesHTML(names, items, clues); },
    verify: function(args, html){ const d = decodeClues(html); return JSON.stringify(d.clues) === JSON.stringify(args[2].map(function(c){ return { t: c.t, a: c.a, b: c.b }; })) && d.names.join() === args[0].join() ? '' : 'clues mismatch'; }
  };
  function clueText(c, set){
    const emo = {}; set.items.forEach(function(i){ emo[i.n] = i.e; });
    if(c.t === 'pos') return '<b>' + c.a + '</b> ' + set.has + ' ' + emo[c.b] + ' <b>' + c.b + '</b>.';
    return '<b>' + c.a + '</b> ' + (set.has === 'plays' ? 'does not play' : 'does not have the') + ' ' + emo[c.b] + ' <b>' + c.b + '</b>.';
  }
  function whoQ(o){
    for(let tries = 0; tries < 300; tries++){
      const set = pick(SETS), names = sample(NAMES, 3), items = sample(set.items, 3);
      const sol = shuffle([0, 1, 2]);   // sol[i] = item index of names[i]
      const d0 = { names: names, items: items.map(function(i){ return i.n; }), clues: [] };
      const trueClues = [];
      names.forEach(function(nm, i){ items.forEach(function(it, j){ trueClues.push({ t: sol[i] === j ? 'pos' : 'neg', a: nm, b: it.n }); }); });
      const pool = o.kinds ? trueClues.filter(function(c){ return o.kinds.indexOf(c.t) >= 0; }) : trueClues;
      const clues = sample(pool, o.k);
      if(o.minPos !== undefined && clues.filter(function(c){ return c.t === 'pos'; }).length < o.minPos) continue;
      if(o.maxPos !== undefined && clues.filter(function(c){ return c.t === 'pos'; }).length > o.maxPos) continue;
      const sols = solutions(d0, clues);
      if(sols.length !== 1) continue;
      // minimal: no clue is wasted
      let minimal = true; clues.forEach(function(_, i){ if(solutions(d0, clues.filter(function(__, j){ return j !== i; })).length < 2) minimal = false; });
      if(!minimal) continue;
      const withText = clues.map(function(c){ return { t: c.t, a: c.a, b: c.b, text: clueText(c, set) }; });
      const vis = cluesHTML(names, items, withText);
      const askWho = chance(0.5), ti = randInt(0, 2);
      let correct, ds, prompt, truthKey, decode;
      if(askWho){
        const item = items[ti], holder = names[sol.indexOf(ti)];
        prompt = set.ask + item.e + ' ' + item.n + '?';
        correct = opt(K.text(holder), holder);
        ds = names.filter(function(n){ return n !== holder; }).map(function(n){ return opt(K.text(n), n, n + ' has the ' + items[sol[names.indexOf(n)]].n + ' (use the clues again) — so ' + n + ' cannot have the ' + item.n + '.'); });
        truthKey = K.text(names.filter(function(n, i){ return items[sol[i]].n === item.n; })[0]);
        decode = function(){ const d = decodeClues(vis), ss = solutions(d); return ss.length === 1 ? K.text(d.names[ss[0].indexOf(d.items.indexOf(item.n))]) : 'none'; };
        prompt = 'Who ' + (set.has === 'plays' ? 'plays ' : 'has the ') + item.e + ' ' + item.n + '?';
      } else {
        const who = names[ti], it = items[sol[ti]];
        prompt = (set.has === 'plays' ? 'What does ' + who + ' play?' : 'Which ' + set.word + ' does ' + who + ' have?');
        correct = opt(K.text(it.n), it.e + ' ' + it.n);
        ds = items.filter(function(x){ return x.n !== it.n; }).map(function(x){ return opt(K.text(x.n), x.e + ' ' + x.n, 'The ' + x.n + ' belongs to ' + names[sol.map(function(s){ return items[s].n; }).indexOf(x.n)] + ', not ' + who + '.'); });
        truthKey = K.text(items[sol[names.indexOf(who)]].n);
        decode = function(){ const d = decodeClues(vis), ss = solutions(d); return ss.length === 1 ? K.text(d.items[ss[0][d.names.indexOf(who)]]) : 'none'; };
      }
      const steps = ['Make a little table: each person gets exactly <b>one</b> ' + set.word + ', and nobody shares.'];
      clues.forEach(function(c, i){ steps.push('Clue ' + (i + 1) + ': ' + (c.t === 'pos' ? c.a + (set.has === 'plays' ? ' plays ' : ' has the ') + c.b + ', so tick it. Nobody else can ' + (set.has === 'plays' ? 'play ' : 'have the ') + c.b + ' and ' + c.a + ' has nothing else.' : c.a + (set.has === 'plays' ? ' does NOT play ' : ' does NOT have the ') + c.b + ', so cross it out.')); });
      steps.push('Only one way fits all the clues: ' + names.map(function(n, i){ return n + ' – ' + items[sol[i]].n; }).join(', ') + '. So the answer is <b>' + (askWho ? names[sol.indexOf(ti)] : items[sol[ti]].e + ' ' + items[sol[ti]].n) + '</b>. ✅');
      return mcq({
        prompt: prompt, visual: vis, correct: correct, distractors: ds, count: 3,
        hint: 'Make a table with the names down the side and the ' + set.word + 's along the top. Tick what the clues say and cross out what they rule out.',
        explain: ex('Strategy: tick and cross out', steps), truth: truthKey, decode: decode
      });
    }
    throw new Error('whoQ failed');
  }

  function rankQ(o){
    for(let tries = 0; tries < 200; tries++){
      const names = sample(NAMES, 3), word = pick([['taller', 'tallest', 'shortest'], ['older', 'oldest', 'youngest'], ['faster', 'fastest', 'slowest'], ['heavier', 'heaviest', 'lightest']]);
      const order = shuffle([0, 1, 2]);       // order[i] = rank of names[i], 0 = top
      const byRank = [0, 1, 2].map(function(r){ return names[order.indexOf(r)]; });
      const trueC = []; for(let i = 0; i < 3; i++) for(let j = 0; j < 3; j++) if(order[i] < order[j]) trueC.push({ t: 'gt', a: names[i], b: names[j] });
      const clues = sample(trueC, o.k);
      const d0 = { names: names, items: [], clues: clues };
      if(solutions(d0).length !== 1) continue;
      let minimal = true; clues.forEach(function(_, i){ if(solutions(d0, clues.filter(function(__, j){ return j !== i; })).length < 2) minimal = false; });
      if(!minimal) continue;
      const vis = cluesHTML(names, [], clues.map(function(c){ return { t: c.t, a: c.a, b: c.b, text: '<b>' + c.a + '</b> is ' + word[0] + ' than <b>' + c.b + '</b>.' }; }));
      const kind = pick(['top', 'bottom', 'middle']), rk = kind === 'top' ? 0 : kind === 'bottom' ? 2 : 1;
      const ans = byRank[rk];
      const decode = function(){ const d = decodeClues(vis), ss = solutions(d); return ss.length === 1 ? K.text(d.names[ss[0].indexOf(rk)]) : 'none'; };
      return mcq({
        prompt: kind === 'middle' ? 'Who is in the middle?' : 'Who is the ' + (kind === 'top' ? word[1] : word[2]) + '?', visual: vis,
        correct: opt(K.text(ans), ans), count: 3,
        distractors: names.filter(function(n){ return n !== ans; }).map(function(n){ return opt(K.text(n), n, n + ' is number ' + (byRank.indexOf(n) + 1) + ' in the line-up (' + byRank.join(', ') + ').'); }),
        hint: 'Draw a line-up. Put the person from each clue "' + word[0] + ' than" before the other. Join the clues together.',
        explain: ex('Strategy: draw a line-up', clues.map(function(c, i){ return 'Clue ' + (i + 1) + ': ' + c.a + ' comes before ' + c.b + ' (' + c.a + ' is ' + word[0] + ').'; }).concat(['Joining the clues gives the order: <b>' + byRank.join(', ') + '</b> (' + word[1] + ' first).', (kind === 'middle' ? 'The one in the middle' : 'The ' + (kind === 'top' ? word[1] : word[2])) + ' is <b>' + ans + '</b>. ✅'])),
        truth: K.text(byRank[kind === 'top' ? 0 : kind === 'bottom' ? 2 : 1]), decode: decode
      });
    }
    throw new Error('rankQ failed');
  }

  /* ================================================================== the skill */
  registerSkill({
    id: 'logic-puzzles', strand: 'logic', name: 'Puzzles and brain teasers', emoji: '🧩', year: 3, order: 930, prereq: ['logic-patterns'],
    lesson: {
      title: 'Puzzle power',
      steps: [
        { say: 'In a <b>magic square</b> every row, every column and both corner-to-corner lines add up to the <b>same total</b>. Here the total is <b>15</b>. Try the top row: 8 + 1 + 6 = 15.', vis: { kind: 'lgMagic', args: [{ cells: [[8, 1, 6], [3, 5, 7], [4, 9, 2]], total: 15 }] } },
        { say: 'Now one number is hiding. Use a line that has the <b>?</b>. The middle row is 3 + ? + 7. It must make 15, so ? is 15 − 3 − 7.', vis: { kind: 'lgMagic', args: [{ cells: [[8, 1, 6], [3, '?', 7], [4, 9, 2]], total: 15 }] },
          quiz: { prompt: 'What number goes in the ? box?', options: [{ label: '5', ok: true }, { label: '10', ok: false }, { label: '4', ok: false }], right: 'Yes! 3 + 7 = 10, and 15 − 10 = 5.', wrong: '3 + 7 = 10. We need 15 altogether, so 15 − 10 = 5.' } },
        { say: 'Scales that are <b>level</b> have the same weight on both sides. Here 5g + ? balances 12g. Take away the 5g from both sides: the ? block weighs 12 − 5 = <b>7g</b>.', vis: { kind: 'lgScales', args: [['?', 5], [12], 'level'] },
          quiz: { prompt: 'The scales balance: ? + 3g on one side, 10g on the other. How much is ?', options: [{ label: '7g', ok: true }, { label: '13g', ok: false }, { label: '10g', ok: false }], right: 'Yes! 10 − 3 = 7g.', wrong: 'Take the 3g away from 10g: 10 − 3 = 7g.' } },
        { say: 'In a <b>missing digit</b> puzzle, start with the <b>opposite</b> calculation. 3? + 25 = 61, so the hidden number is 61 − 25 = 36. The hidden digit is <b>6</b>.', vis: { kind: 'lgSum', args: [[3, { box: 'A', show: '?' }], '+', [2, 5], [6, 1]] } },
        { say: '<b>Who is who?</b> Tick what the clues say and cross out what they rule out. Ana has the cat, and Marcus does not have the dog. So Marcus has the fish and Sophie has the dog.', vis: { kind: 'lgClues', args: [['Ana', 'Marcus', 'Sophie'], [{ n: 'cat', e: '🐱' }, { n: 'dog', e: '🐶' }, { n: 'fish', e: '🐟' }], [{ t: 'pos', a: 'Ana', b: 'cat', text: '<b>Ana</b> has the 🐱 <b>cat</b>.' }, { t: 'neg', a: 'Marcus', b: 'dog', text: '<b>Marcus</b> does not have the 🐶 <b>dog</b>.' }]] },
          quiz: { prompt: 'Who has the dog?', options: [{ label: 'Sophie', ok: true }, { label: 'Marcus', ok: false }, { label: 'Ana', ok: false }], right: 'Yes! Ana has the cat, Marcus has the fish, so Sophie has the dog.', wrong: 'Ana has the cat. Marcus does not have the dog, so he has the fish. That leaves the dog for Sophie.' } }
      ]
    },
    trick: {
      title: 'Always check back',
      say: 'Every puzzle has a way to <b>check</b>. Magic square: add up the line. Scales: put the weight back and see if both sides match. Missing digit: do the whole sum again. Who is who: read every clue again with your answer.',
      vis: { kind: 'lgMagic', args: [{ cells: [[8, 1, 6], [3, 5, 7], [4, 9, 2]], total: 15 }] },
      example: 'You say ? is 5. Check: <b>3 + 5 + 7 = 15</b> ✅ — the same total as every other line.'
    },
    gen: {
      1: function(){
        const f = randInt(0, 4);
        if(f === 0) return magicQ({ ms: [1], tMin: 0, tMax: 0, blanks: 1, count: 3 });
        if(f === 1) return heavierQ();
        if(f === 2) return balanceQ({ kinds: ['a', 'b'], xLo: 2, xHi: 10 });
        if(f === 3) return sumQ({ boxes: 1, ops: ['+', '−', '×'], lo: 11, hi: 60 });
        return whoQ({ k: 2, minPos: 1, maxPos: 1 });
      },
      2: function(){
        const f = randInt(0, 6);
        if(f === 0) return magicQ({ ms: [1, 2], tMin: 0, tMax: 12, blanks: 1 });
        if(f === 1) return magicQ({ ms: [1], tMin: 0, tMax: 10, blanks: 1, ask: 'total' });
        if(f === 2) return triQ({ lo: 1, hi: 6, max: 6, sLo: 9, sHi: 12 });
        if(f === 3) return balanceQ({ kinds: ['b', 'c', 'e'], xLo: 3, xHi: 15 });
        if(f === 4) return sumQ({ boxes: 2, mode: 'same', ops: ['+', '−'], lo: 11, hi: 75 });
        if(f === 5) return whoQ({ k: 3, minPos: 0, maxPos: 1 });
        return rankQ({ k: 2 });
      },
      3: function(){
        const f = randInt(0, 6);
        if(f === 0) return magicQ({ ms: [1, 2, 3], tMin: 2, tMax: 25, blanks: 2, typed: true });
        if(f === 1) return triQ({ lo: 2, hi: 14, max: 22, sLo: 18, sHi: 36, typed: true });
        if(f === 2) return balanceQ({ kinds: ['d', 'e'], xLo: 3, xHi: 18, typed: true });
        if(f === 3) return sumQ({ boxes: 2, mode: 'columns', ops: ['+'], lo: 100, hi: 480, typed: true });
        if(f === 4) return whoQ({ k: 3, kinds: ['neg'] });
        if(f === 5) return rankQ({ k: 2 });
        return sumQ({ boxes: 2, mode: 'same', ops: ['+', '−'], lo: 101, hi: 700, typed: true });
      }
    }
  });
})();
