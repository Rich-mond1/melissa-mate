/* GEOMETRY 4 — Turns: quarter / half / three-quarter / full turns, clockwise / anticlockwise, compass directions.
   Registers its own picture kind V.extra.turnCompass (a compass with a start arrow, optional turn arcs and an optional end arrow)
   and a decoder that reads the arrow tips and the arc segments from the drawing. */
(function(){
  const DIRS = ['N', 'E', 'S', 'W'];
  const DNAME = { N: 'North', E: 'East', S: 'South', W: 'West' };
  const TNAME = { 1: 'a quarter turn', 2: 'a half turn', 3: 'a three-quarter turn', 4: 'a full turn' };
  const TSHORT = { 1: 'quarter', 2: 'half', 3: 'three-quarter', 4: 'full' };
  const CX = 100, CY = 92, RA = 27;
  function f2(n){ return (Math.round(n * 100) / 100).toString(); }
  function pt(theta, r){ const a = theta * Math.PI / 180; return [CX + r * Math.sin(a), CY - r * Math.cos(a)]; }
  function arrow(theta, cls, color){
    const tip = pt(theta, 46), base = pt(theta, 34), l = pt(theta - 90, 0), a = theta * Math.PI / 180;
    const nx = Math.cos(a), ny = Math.sin(a); // perpendicular
    return '<line class="' + cls + '" x1="' + CX + '" y1="' + CY + '" x2="' + f2(tip[0]) + '" y2="' + f2(tip[1]) + '" stroke="' + color + '" stroke-width="8" stroke-linecap="round"/>' +
      '<polygon points="' + f2(pt(theta, 58)[0]) + ',' + f2(pt(theta, 58)[1]) + ' ' + f2(base[0] + nx * 10) + ',' + f2(base[1] + ny * 10) + ' ' + f2(base[0] - nx * 10) + ',' + f2(base[1] - ny * 10) + '" fill="' + color + '"/>';
  }
  function renderTurn(start, quarters, cw, showEnd){
    const t0 = DIRS.indexOf(start) * 90, sgn = cw ? 1 : -1;
    let s = '<circle cx="' + CX + '" cy="' + CY + '" r="64" fill="#fff" stroke="#C9CEE0" stroke-width="2"/>';
    DIRS.forEach(function(d, i){
      const p = pt(i * 90, 78);
      s += '<text x="' + f2(p[0]) + '" y="' + f2(p[1] + 6) + '" text-anchor="middle" font-size="18" font-weight="900" fill="var(--vis-ink,#1B1B2F)">' + d + '</text>';
      const a = pt(i * 90, 64), b = pt(i * 90, 56);
      s += '<line x1="' + f2(a[0]) + '" y1="' + f2(a[1]) + '" x2="' + f2(b[0]) + '" y2="' + f2(b[1]) + '" stroke="#C9CEE0" stroke-width="3"/>';
    });
    if(showEnd) s += arrow(t0 + sgn * quarters * 90, 'tend', 'var(--vis-warm,#F2994A)');
    s += arrow(t0, 'tstart', 'var(--vis-a,#4F8FE8)');
    for(let k = 0; k < quarters; k++){
      const a1 = pt(t0 + sgn * k * 90, RA), a2 = pt(t0 + sgn * (k + 1) * 90, RA);
      s += '<path class="tarc" d="M' + f2(a1[0]) + ' ' + f2(a1[1]) + ' A' + RA + ' ' + RA + ' 0 0 ' + (cw ? 1 : 0) + ' ' + f2(a2[0]) + ' ' + f2(a2[1]) + '" fill="none" stroke="var(--vis-bad,#EB5757)" stroke-width="4"/>';
    }
    if(quarters > 0){ // little arrow-head on the arc, pointing the way we turn
      const th = t0 + sgn * quarters * 90, e = pt(th, RA), a = th * Math.PI / 180;
      const tx = sgn * Math.cos(a), ty = sgn * Math.sin(a), nx = -ty, ny = tx; // tangent (direction of turning) in screen coords
      s += '<polygon points="' + f2(e[0] + tx * 9) + ',' + f2(e[1] + ty * 9) + ' ' + f2(e[0] - tx * 3 + nx * 6) + ',' + f2(e[1] - ty * 3 + ny * 6) + ' ' + f2(e[0] - tx * 3 - nx * 6) + ',' + f2(e[1] - ty * 3 - ny * 6) + '" fill="var(--vis-bad,#EB5757)"/>';
    }
    s += '<circle cx="' + CX + '" cy="' + CY + '" r="5" fill="var(--vis-ink,#1B1B2F)"/>';
    return '<svg viewBox="0 0 200 184" width="200" role="img" style="max-width:100%;height:auto;display:block;margin:0 auto" xmlns="http://www.w3.org/2000/svg" font-family="-apple-system,Segoe UI,Roboto,Arial,sans-serif">' + s + '</svg>';
  }
  function attr(tag, name){ const m = new RegExp(name + '="([^"]*)"').exec(tag); return m ? m[1] : null; }
  function dirIndex(tag){
    const dx = parseFloat(attr(tag, 'x2')) - parseFloat(attr(tag, 'x1')), dy = parseFloat(attr(tag, 'y2')) - parseFloat(attr(tag, 'y1'));
    let th = Math.atan2(dx, -dy) * 180 / Math.PI; if(th < 0) th += 360;
    return Math.round(th / 90) % 4;
  }
  // reads: where the blue arrow points, where the orange arrow points (or null), and the signed number of quarter turns drawn as arcs
  function decodeTurn(html){
    const st = /<line[^>]*class="tstart"[^>]*>/.exec(html), en = /<line[^>]*class="tend"[^>]*>/.exec(html);
    const arcs = html.match(/<path[^>]*class="tarc"[^>]*>/g) || [];
    let turn = 0, bad = false;
    arcs.forEach(function(t){
      const n = attr(t, 'd').match(/-?\d+(?:\.\d+)?/g).map(Number); // x1 y1 rx ry rot large sweep x2 y2
      let a1 = Math.atan2(n[0] - CX, -(n[1] - CY)) * 180 / Math.PI, a2 = Math.atan2(n[7] - CX, -(n[8] - CY)) * 180 / Math.PI;
      let d = a2 - a1; while(d > 180) d -= 360; while(d <= -180) d += 360;
      const sweepCw = n[6] === 1;
      if(Math.abs(Math.abs(d) - 90) > 2 || (d > 0) !== sweepCw) bad = true;
      turn += sweepCw ? 1 : -1;
    });
    return { start: st ? DIRS[dirIndex(st[0])] : null, end: en ? DIRS[dirIndex(en[0])] : null, turn: bad ? 99 : turn };
  }
  V.extra.turnCompass = {
    render: renderTurn,
    verify: function(a, html){
      const d = decodeTurn(html), want = (a[2] ? 1 : -1) * a[1];
      if(d.start !== a[0]) return 'compass start arrow points ' + d.start + ' not ' + a[0];
      if(d.turn !== want) return 'compass arcs show ' + d.turn + ' quarter turns not ' + want;
      const endWant = DIRS[(((DIRS.indexOf(a[0]) + want) % 4) + 4) % 4];
      if(a[3] && d.end !== endWant) return 'orange arrow points ' + d.end + ' not ' + endWant;
      if(!a[3] && d.end !== null) return 'unexpected end arrow';
      return '';
    }
  };

  const ACTORS = ['The robot', 'The toy car', 'The unicorn', 'The spaceship', 'The little dragon', 'The snail'];
  const PRON = { 'The robot': 'It', 'The toy car': 'It', 'The unicorn': 'It', 'The spaceship': 'It', 'The little dragon': 'It', 'The snail': 'It' };
  function cwWord(cw){ return cw ? 'clockwise' : 'anticlockwise'; }
  function endDir(start, q, cw){ return DIRS[(((DIRS.indexOf(start) + (cw ? q : -q)) % 4) + 4) % 4]; }
  // independent arithmetic with a lookup table (used for the TRUTH of the direction questions)
  const NEXT_CW = { N: 'E', E: 'S', S: 'W', W: 'N' }, NEXT_ACW = { N: 'W', W: 'S', S: 'E', E: 'N' };
  function walk(start, q, cw){ let d = start; for(let i = 0; i < q; i++) d = (cw ? NEXT_CW : NEXT_ACW)[d]; return d; }
  function R(start, q, cw, showEnd){ return renderTurn(start, q, cw, showEnd); }
  function dirOpts(start, answerDir, steps, cwFirst){
    // distractors for "which way now?": every other direction with a reason
    return DIRS.filter(function(d){ return d !== answerDir; }).map(function(d){
      const needCw = (DIRS.indexOf(d) - DIRS.indexOf(start) + 4) % 4;
      let why;
      if(d === start) why = 'That is where it started. It has turned, so it must be pointing somewhere new.';
      else if(d === steps.wrongWay) why = 'You turned the wrong way round. ' + (steps.cw ? 'The question says clockwise, which is the way clock hands go.' : 'The question says anticlockwise, which is the opposite way to clock hands.');
      else why = DNAME[d] + ' is ' + TNAME[needCw] + ' clockwise from ' + DNAME[start] + ', but the turn in the question is different.';
      return opt(K.text(d), DNAME[d], why);
    });
  }
  function cap(s){ return s.charAt(0).toUpperCase() + s.slice(1); }

  /* ---- question builders ---- */
  function whichTurnQ(maxQ, allowAcw, count){
    const q = randInt(1, maxQ), cw = allowAcw ? chance(0.5) : true, start = pick(DIRS), showEnd = q < 4;
    const vis = R(start, q, cw, showEnd);
    const names = [1, 2, 3, 4].filter(function(n){ return n <= maxQ; });
    const ds = names.filter(function(n){ return n !== q; }).map(function(n){ return opt(K.text(TSHORT[n]), TNAME[n], 'The red arc covers ' + q + ' quarter' + (q === 1 ? '' : 's') + ' of the circle, not ' + n + '. ' + cap(TNAME[n]) + ' is ' + n + ' right angle' + (n === 1 ? '' : 's') + '.'); });
    return mcq({
      prompt: 'The arrow spins round the circle, following the red curve. What turn is it?', visual: vis, correct: opt(K.text(TSHORT[q]), TNAME[q]), distractors: ds, keepOrder: true, count: count,
      hint: 'A quarter turn is 1 right angle, a half turn is 2, a three-quarter turn is 3 and a full turn is 4. Count how many quarters of the circle the red curve covers.',
      explain: ex('Reading the turn', ['The circle is split into 4 quarters by North, East, South and West.', 'The red curve goes past <b>' + q + '</b> of them' + (showEnd ? ' (from the blue arrow to the orange arrow)' : ' and ends back where it started') + '.', q + ' quarter' + (q === 1 ? '' : 's') + ' is <b>' + TNAME[q] + '</b>. ✅']),
      truth: K.text(['', 'quarter', 'half', 'three-quarter', 'full'][q]),
      decode: function(){ const d = decodeTurn(vis); if(d.start !== start) return 'start?'; if(showEnd && d.end !== walk(start, q, cw)) return 'end?'; return K.text(TSHORT[Math.abs(d.turn)]); }
    });
  }
  function rotationQ(){
    const q = randInt(1, 3), cw = chance(0.5), start = pick(DIRS), vis = R(start, q, cw, true);
    return mcq2({
      prompt: 'Which way does the arrow turn: <b>clockwise</b> (the way clock hands go) or <b>anticlockwise</b>?', visual: vis,
      correct: opt(K.text(cwWord(cw)), cwWord(cw)),
      other: opt(K.text(cwWord(!cw)), cwWord(!cw), cw ? 'Anticlockwise goes the opposite way to a clock. Here the arrow goes the same way as the clock hands.' : 'Clockwise is the way clock hands go: from 12 round to 3. This arrow goes the opposite way.'),
      hint: 'Picture the hands of a clock. They go from 12 to 3 to 6. Does the red curve go that way round?',
      explain: ex('Clockwise or anticlockwise?', ['Clock hands go from the top, to the right, to the bottom, to the left.', 'The red curve starts at ' + DNAME[start] + ' and goes to ' + DNAME[endDir(start, 1, cw)] + ' first.', cw ? 'North → East → South → West is the way clock hands go, so it is <b>clockwise</b>. ✅' : 'North → West → South → East is the opposite way, so it is <b>anticlockwise</b>. ✅']),
      truth: K.text(walk(start, 1, true) === walk(start, 1, cw) ? 'clockwise' : 'anticlockwise'),
      decode: function(){ const d = decodeTurn(vis); return K.text(d.turn > 0 ? 'clockwise' : 'anticlockwise'); }
    });
  }
  function dirQ(maxQ, allowAcw){
    const q = randInt(1, maxQ), cw = allowAcw ? chance(0.5) : true, start = pick(DIRS), who = pick(ACTORS);
    const vis = R(start, 0, true, false), ans = endDir(start, q, cw);
    return mcq({
      prompt: who + ' faces <b>' + DNAME[start] + '</b>. ' + PRON[who] + ' makes <b>' + TNAME[q] + '</b> <b>' + cwWord(cw) + '</b>. Which way does ' + PRON[who].toLowerCase() + ' face now?', visual: vis,
      correct: opt(K.text(ans), DNAME[ans]), distractors: dirOpts(start, ans, { cw: cw, wrongWay: endDir(start, q, !cw) }), keepOrder: true, count: 4,
      hint: 'Start at the blue arrow. Each quarter turn moves you to the next letter. Clockwise goes N → E → S → W; anticlockwise goes N → W → S → E.',
      explain: ex('Turning step by step', ['Start facing <b>' + DNAME[start] + '</b>. ' + cap(TNAME[q]) + ' is ' + q + ' quarter' + (q === 1 ? '' : 's') + '.', cw ? 'Clockwise goes N → E → S → W → N.' : 'Anticlockwise goes N → W → S → E → N.', 'After ' + q + ' step' + (q === 1 ? '' : 's') + ' we are facing <b>' + DNAME[ans] + '</b>. ✅']),
      truth: K.text(walk(start, q, cw)), decode: function(){ return K.text(walk(decodeTurn(vis).start, q, cw)); }
    });
  }
  function twoStepQ(){
    const start = pick(DIRS), who = pick(ACTORS);
    const q1 = randInt(1, 2), cw1 = chance(0.5), q2 = randInt(1, 2), cw2 = chance(0.5);
    const vis = R(start, 0, true, false), mid = endDir(start, q1, cw1), ans = endDir(mid, q2, cw2);
    return mcq({
      prompt: who + ' faces <b>' + DNAME[start] + '</b>. First ' + PRON[who].toLowerCase() + ' makes ' + TNAME[q1] + ' ' + cwWord(cw1) + '. Then ' + PRON[who].toLowerCase() + ' makes ' + TNAME[q2] + ' ' + cwWord(cw2) + '. Which way does ' + PRON[who].toLowerCase() + ' face at the end?', visual: vis,
      correct: opt(K.text(ans), DNAME[ans]),
      distractors: DIRS.filter(function(d){ return d !== ans; }).map(function(d){ return opt(K.text(d), DNAME[d], d === mid ? DNAME[d] + ' is where it faced after the FIRST turn. There is a second turn still to do.' : (d === start ? 'That is where it started. The two turns do not cancel out here.' : 'Do the first turn, write down where you are, then do the second turn from there.')); }), keepOrder: true, count: 4,
      hint: 'Do one turn at a time. After the first turn, write down which way you face. Then start the second turn from there.',
      explain: ex('Two turns', ['Start: <b>' + DNAME[start] + '</b>. First turn (' + cwWord(cw1) + ', ' + q1 + ' quarter' + (q1 === 1 ? '' : 's') + '): now facing <b>' + DNAME[mid] + '</b>.', 'Second turn (' + cwWord(cw2) + ', ' + q2 + ' quarter' + (q2 === 1 ? '' : 's') + ') from ' + DNAME[mid] + ': now facing <b>' + DNAME[ans] + '</b>.', 'So at the end it faces <b>' + DNAME[ans] + '</b>. ✅']),
      truth: K.text(walk(walk(start, q1, cw1), q2, cw2)), decode: function(){ const s = decodeTurn(vis).start; return K.text(walk(walk(s, q1, cw1), q2, cw2)); }
    });
  }
  function rightAnglesPicQ(){
    const q = randInt(1, 4), cw = chance(0.5), start = pick(DIRS), vis = R(start, q, cw, q < 4);
    return mcqNum({
      prompt: 'The arrow turns round the circle, following the red curve. How many <b>right angles</b> is that?', visual: vis, answer: q,
      wrong: [{ v: q + 1, why: 'Count the quarters the red curve covers again: it covers ' + q + ', not ' + (q + 1) + '.' }, { v: q - 1, why: 'The red curve covers ' + plural(q, 'quarter') + ', not ' + (q - 1) + '.' }, { v: 2 * q, why: 'Each quarter is one right angle. Do not double the number.' }],
      valid: function(v){ return v >= 1 && v <= 8; }, count: 3,
      hint: 'Each quarter of the circle (N to E, E to S, S to W, W to N) is one right angle. How many quarters does the red curve go through?',
      explain: ex('Counting right angles in a turn', ['One quarter turn is one right angle.', 'The red curve covers <b>' + q + '</b> quarter' + (q === 1 ? '' : 's') + '.', 'So the turn is <b>' + q + '</b> right angle' + (q === 1 ? '' : 's') + '. ✅']),
      truth: ({ 90: 1, 180: 2, 270: 3, 360: 4 })[q * 90], decode: function(){ return Math.abs(decodeTurn(vis).turn); }
    });
  }
  function howManyRAQ(){
    const q = randInt(1, 4);
    return mcqNum({
      prompt: 'How many <b>right angles</b> make <b>' + TNAME[q] + '</b>?', visual: '', answer: q,
      wrong: [{ v: q === 4 ? 2 : q * 2, why: 'A quarter turn is 1 right angle, so ' + TNAME[q] + ' is ' + plural(q, 'quarter') + ', not ' + (q * 2) + '.' }, { v: q + 1, why: 'Each quarter turn is one right angle. ' + cap(TNAME[q]) + ' is ' + plural(q, 'quarter') + '.' }, { v: q - 1, why: 'Each quarter turn is one right angle. ' + cap(TNAME[q]) + ' is ' + plural(q, 'quarter') + '.' }],
      valid: function(v){ return v >= 1 && v <= 8; }, count: 4,
      hint: 'A quarter turn is the same as one right angle (a square corner). A full turn is all the way round.',
      explain: ex('Turns and right angles', ['A full turn is all the way round: <b>4</b> right angles.', cap(TNAME[q]) + ' is <b>' + q + '</b> out of 4 quarters.', 'So it is <b>' + q + '</b> right angle' + (q === 1 ? '' : 's') + '. ✅']),
      truth: 360 / 90 * (q / 4)
    });
  }
  function fromToQ(allowAcw){
    const start = pick(DIRS), q = randInt(1, 3), cw = allowAcw ? chance(0.5) : true;
    const vis = R(start, 0, true, false).replace('</svg>', '') // blue arrow only, then add the orange arrow ourselves
    ;
    const both = renderTurn(start, q, cw, true).replace(/<path class="tarc"[^>]*\/>/g, '').replace(/<polygon points="[^"]*" fill="var\(--vis-bad,#EB5757\)"\/>/, '');
    const q2 = mcq({
      prompt: 'The blue arrow turns <b>' + cwWord(cw) + '</b> until it points the same way as the orange arrow. What turn is it?', visual: both,
      correct: opt(K.text(TSHORT[q]), TNAME[q]), distractors: [1, 2, 3].filter(function(n){ return n !== q; }).map(function(n){ return opt(K.text(TSHORT[n]), TNAME[n], 'Count the steps ' + cwWord(cw) + ' from the blue arrow to the orange arrow: it takes ' + q + ', not ' + n + '.' + (n === 4 - q ? ' ' + cap(TNAME[n]) + ' is how far it is the OTHER way round.' : '')); }), keepOrder: true, count: 3,
      hint: 'Start at the blue arrow and step round ' + cwWord(cw) + ' one quarter at a time until you reach the orange arrow. Count the steps.',
      explain: ex('From blue to orange', ['The blue arrow points <b>' + DNAME[start] + '</b>. The orange arrow points <b>' + DNAME[endDir(start, q, cw)] + '</b>.', 'Going ' + cwWord(cw) + ' we pass ' + q + ' quarter' + (q === 1 ? '' : 's') + '.', 'So it is <b>' + TNAME[q] + '</b>. ✅']),
      truth: K.text(TSHORT[q]),
      decode: function(){ const d = decodeTurn(both); const si = DIRS.indexOf(d.start), ei = DIRS.indexOf(d.end); const n = cw ? (ei - si + 4) % 4 : (si - ei + 4) % 4; return K.text(TSHORT[n]); }
    });
    return q2;
  }
  function sameEndQ(){
    const start = pick(DIRS), q = randInt(1, 3), cw = chance(0.5);
    const both = renderTurn(start, q, cw, true);
    const endD = endDir(start, q, cw);
    const combos = [];
    [1, 2, 3].forEach(function(n){ [true, false].forEach(function(c){ if(!(n === q && c === cw)) combos.push({ n: n, c: c }); }); });
    const label = function(o){ return TNAME[o.n] + ' ' + cwWord(o.c); };
    const good = combos.filter(function(o){ return endDir(start, o.n, o.c) === endD; });
    const bad = combos.filter(function(o){ return endDir(start, o.n, o.c) !== endD; });
    const target = good[0];
    const ds = shuffle(bad).map(function(o){ return opt(K.text(label(o)), label(o), 'That ends at ' + DNAME[endDir(start, o.n, o.c)] + ', not at ' + DNAME[endD] + '. Check where it stops.'); });
    return mcq({
      prompt: 'The blue arrow makes <b>' + TNAME[q] + ' ' + cwWord(cw) + '</b> and stops at the orange arrow. Which other turn from the blue arrow stops at the <b>same place</b>?', visual: both,
      correct: opt(K.text(label(target)), label(target)), distractors: ds, count: 4,
      hint: 'Try each turn from the blue arrow, one quarter at a time, and see where it stops. Going the other way round, the turns add up to 4 quarters.',
      explain: ex('Two ways to the same place', ['The orange arrow points <b>' + DNAME[endD] + '</b>.', 'The two ways round always make a full turn (4 quarters): ' + q + ' + ' + (4 - q) + ' = 4.', 'So <b>' + label(target) + '</b> stops at ' + DNAME[endD] + ' too. ✅']),
      truth: K.text(label(good[0])), decode: function(){ const d = decodeTurn(both); const e = d.end; return K.text(label(combos.filter(function(o){ return endDir(d.start, o.n, o.c) === e; })[0])); }
    });
  }
  function sumTurnsQ(){
    const a = randInt(1, 3), b = randInt(1, 4 - a), who = pick(ACTORS), cwv = chance(0.5);
    const tot = a + b;
    const ds = [1, 2, 3, 4].filter(function(n){ return n !== tot; }).map(function(n){ return opt(K.text(TSHORT[n]), TNAME[n], a + ' quarter' + (a === 1 ? '' : 's') + ' + ' + b + ' quarter' + (b === 1 ? '' : 's') + ' makes ' + plural(tot, 'quarter') + ', not ' + n + '.'); });
    return mcq({
      prompt: who + ' makes ' + TNAME[a] + ' ' + cwWord(cwv) + ', then ' + TNAME[b] + ' more, the same way round. What turn is that <b>altogether</b>?', visual: '',
      correct: opt(K.text(TSHORT[tot]), TNAME[tot]), distractors: ds, keepOrder: true, count: 4,
      hint: 'Count the quarters. A quarter turn is 1, a half turn is 2, a three-quarter turn is 3.',
      explain: ex('Adding turns', [cap(TNAME[a]) + ' is <b>' + a + '</b> quarter' + (a === 1 ? '' : 's') + '.', cap(TNAME[b]) + ' is <b>' + b + '</b> quarter' + (b === 1 ? '' : 's') + '.', a + ' + ' + b + ' = ' + plural(tot, 'quarter') + ', which is <b>' + TNAME[tot] + '</b>. ✅']),
      truth: K.text(['', 'quarter', 'half', 'three-quarter', 'full'][(a * 90 + b * 90) / 90])
    });
  }
  function countRAQ(){
    const kinds = [{ n: 2, t: 'half turns', per: 2 }, { n: 1, t: 'full turn', per: 4 }, { n: 2, t: 'full turns', per: 4 }, { n: 3, t: 'half turns', per: 2 }, { n: 3, t: 'quarter turns', per: 1 }];
    const k = pick(kinds), mix = chance(0.5);
    if(mix){
      const h = randInt(1, 3), qq = randInt(1, 3), ans = h * 2 + qq;
      return numeric({
        prompt: 'A spinner makes <b>' + h + ' half turn' + (h === 1 ? '' : 's') + '</b> and then <b>' + qq + ' quarter turn' + (qq === 1 ? '' : 's') + '</b>. How many <b>right angles</b> has it turned through altogether?', visual: '', answer: ans,
        hint: 'A half turn is 2 right angles and a quarter turn is 1 right angle. Work out each part, then add.',
        explain: ex('Counting right angles', [h + ' half turn' + (h === 1 ? '' : 's') + ' = ' + h + ' × 2 = <b>' + (h * 2) + '</b> right angles.', qq + ' quarter turn' + (qq === 1 ? '' : 's') + ' = <b>' + qq + '</b> right angle' + (qq === 1 ? '' : 's') + '.', h * 2 + ' + ' + qq + ' = <b>' + ans + '</b>. ✅']),
        truth: (180 * h + 90 * qq) / 90, wrong: function(v){ return v === h + qq ? 'A half turn is 2 right angles, not 1.' : ''; }
      });
    }
    const ans = k.n * k.per;
    return numeric({
      prompt: 'A dancer makes <b>' + k.n + ' ' + k.t + '</b>. How many <b>right angles</b> is that?', visual: '', answer: ans,
      hint: 'Think about how many right angles are in ONE ' + k.t.replace(/s$/, '') + ' first (a quarter turn = 1, half = 2, full = 4). Then multiply.',
      explain: ex('Right angles in turns', ['One ' + k.t.replace(/s$/, '') + ' is <b>' + k.per + '</b> right angle' + (k.per === 1 ? '' : 's') + '.', k.n + ' of them: ' + k.n + ' × ' + k.per + '.', k.n + ' × ' + k.per + ' = <b>' + ans + '</b>. ✅']),
      truth: ({ 'half turns': 180, 'full turn': 360, 'full turns': 360, 'quarter turns': 90 })[k.t] / 90 * k.n, wrong: function(v){ return v === k.n ? 'That is the number of turns, not the number of right angles.' : ''; }
    });
  }

  registerSkill({
    id: 'geo-turns', strand: 'geometry', name: 'Turns and directions', emoji: '🔄', year: 3, order: 740, prereq: ['geo-angles'],
    lesson: {
      title: 'Spin and turn',
      steps: [
        { say: 'A <b>turn</b> is when something spins round. The <b>blue arrow</b> is facing <b>North</b>. The compass letters are <b>N</b> (North), <b>E</b> (East), <b>S</b> (South) and <b>W</b> (West).', vis: { kind: 'turnCompass', args: ['N', 0, true, false] } },
        { say: 'A <b>quarter turn</b> is <b>1 right angle</b>. Turn the arrow a quarter turn the way clock hands go (<b>clockwise</b>) and it points <b>East</b>.', vis: { kind: 'turnCompass', args: ['N', 1, true, true] } },
        { say: 'A <b>half turn</b> is <b>2 right angles</b>. The arrow ends up facing the opposite way: <b>South</b>. A <b>three-quarter turn</b> is <b>3 right angles</b>: it points <b>West</b>.', vis: { kind: 'turnCompass', args: ['N', 2, true, true] },
          quiz: { prompt: 'How many right angles are in a half turn?', options: [{ label: '1', ok: false }, { label: '2', ok: true }, { label: '4', ok: false }], right: 'Yes! A half turn is two quarter turns: 2 right angles.', wrong: 'A quarter turn is 1 right angle, so a half turn (two quarters) is 2 right angles.' } },
        { say: 'A <b>full turn</b> is <b>4 right angles</b>. The arrow goes all the way round and ends up where it started, pointing <b>North</b> again!', vis: { kind: 'turnCompass', args: ['N', 4, true, false] } },
        { say: '<b>Anticlockwise</b> means the opposite way to clock hands. A quarter turn anticlockwise from North points <b>West</b>.', vis: { kind: 'turnCompass', args: ['N', 1, false, true] },
          quiz: { prompt: 'Facing North, you make a quarter turn anticlockwise. Which way do you face?', options: [{ label: 'East', ok: false }, { label: 'West', ok: true }, { label: 'South', ok: false }], right: 'Yes! Anticlockwise goes N → W.', wrong: 'Anticlockwise is the opposite way to clock hands, so from North a quarter turn goes to West.' } }
      ]
    },
    trick: {
      title: 'Use the clock',
      say: 'Think of a <b>clock</b>! North is the <b>12</b>, East is the <b>3</b>, South is the <b>6</b> and West is the <b>9</b>. <b>Clockwise</b> goes 12 → 3 → 6 → 9, so N → E → S → W. Anticlockwise goes the other way.',
      vis: { kind: 'turnCompass', args: ['N', 1, true, true] },
      example: 'Facing East (the 3), a half turn clockwise is 2 steps: 3 → 6 → 9, so you face <b>West</b>'
    },
    gen: {
      1: function(){
        const r = randInt(1, 4);
        if(r === 1) return whichTurnQ(3, false, 3);
        if(r === 2) return rotationQ();
        return dirQ(2, false);
      },
      2: function(){
        const r = randInt(1, 6);
        if(r === 1) return whichTurnQ(4, true, 4);
        if(r === 2 || r === 3) return dirQ(3, true);
        if(r === 4) return rightAnglesPicQ();
        if(r === 5) return howManyRAQ();
        return fromToQ(false);
      },
      3: function(){
        const r = randInt(1, 6);
        if(r === 1) return twoStepQ();
        if(r === 2) return countRAQ();
        if(r === 3) return fromToQ(true);
        if(r === 4) return sumTurnsQ();
        if(r === 5) return sameEndQ();
        return countRAQ();
      }
    }
  });
})();
