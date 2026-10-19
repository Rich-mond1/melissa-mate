/* LOGIC 1 — Patterns. Repeating shape patterns, growing number patterns, matchstick patterns, odd-one-out numbers.
   Pictures are generated from the rule and decoded from the DRAWING (shape geometry + fill, number cards, stick lines). */
(function(){
  const INK = 'var(--vis-ink,#1B1B2F)';
  function r2(n){ return Math.round(n * 100) / 100; }
  function attr(tag, name){ const m = new RegExp(' ' + name + '="([^"]*)"').exec(tag); return m ? m[1] : null; }
  const NAMES = ['Ana', 'Marcus', 'Sophie', 'Ivan', 'Lucy', 'Diego', 'Ellen', 'Tom', 'Aisha', 'Kai', 'Mei', 'Leo'];

  /* ---------------------------------------------------------------- shape tokens */
  const TOK = {
    'red circle': { shape: 'circle', fill: '#EB5757' },
    'blue square': { shape: 'square', fill: '#4F8FE8' },
    'green triangle': { shape: 'triangle', fill: '#27AE60' },
    'yellow star': { shape: 'star', fill: '#F2C94C' },
    'purple diamond': { shape: 'diamond', fill: '#9B51E0' },
    'orange triangle': { shape: 'triangle', fill: '#F2994A' }
  };
  const TOKNAMES = Object.keys(TOK);
  const COLOUR = {}; TOKNAMES.forEach(function(n){ COLOUR[TOK[n].fill] = n.split(' ')[0]; });

  function itemSVG(name, cx, cy, r){
    const t = TOK[name];
    const st = ' fill="' + t.fill + '" stroke="' + INK + '" stroke-width="2.5" stroke-linejoin="round"/>';
    if(t.shape === 'circle') return '<circle class="pi" cx="' + cx + '" cy="' + cy + '" r="' + r + '"' + st;
    if(t.shape === 'square') return '<rect class="pi" x="' + r2(cx - r) + '" y="' + r2(cy - r) + '" width="' + r2(2 * r) + '" height="' + r2(2 * r) + '" rx="3"' + st;
    let pts = [];
    if(t.shape === 'triangle') pts = [[cx, cy - r], [cx + r * 1.0, cy + r * 0.85], [cx - r * 1.0, cy + r * 0.85]];
    else if(t.shape === 'diamond') pts = [[cx, cy - r * 1.1], [cx + r * 0.85, cy], [cx, cy + r * 1.1], [cx - r * 0.85, cy]];
    else for(let i = 0; i < 10; i++){ const a = -Math.PI / 2 + i * Math.PI / 5, rr = i % 2 ? r * 0.45 : r * 1.1; pts.push([cx + rr * Math.cos(a), cy + rr * Math.sin(a)]); }
    return '<polygon class="pi" points="' + pts.map(function(p){ return r2(p[0]) + ',' + r2(p[1]); }).join(' ') + '"' + st;
  }
  function wrapSvg(w, h, inner, width){
    return '<svg viewBox="0 0 ' + w + ' ' + h + '" width="' + (width || w) + '" role="img" style="max-width:100%;height:auto;display:block;margin:0 auto" xmlns="http://www.w3.org/2000/svg" font-family="-apple-system,Segoe UI,Roboto,Arial,sans-serif">' + inner + '</svg>';
  }
  /* names: array of token names, null = hidden slot drawn as a dashed "?" box */
  function rowSVG(names, o){
    o = o || {};
    const sp = 46, W = names.length * sp + 8, H = 50; let s = '';
    names.forEach(function(nm, i){
      const cx = 4 + sp / 2 + i * sp, cy = 25;
      if(nm === null) s += '<rect class="pq" x="' + (cx - 19) + '" y="6" width="38" height="38" rx="8" fill="#fff" stroke="' + INK + '" stroke-width="2.5" stroke-dasharray="5 4"/><text x="' + cx + '" y="34" text-anchor="middle" font-size="24" font-weight="900" fill="#EB5757">?</text>';
      else s += itemSVG(nm, cx, cy, 16);
    });
    return wrapSvg(W, H, s, o.width || W);
  }
  function decodeRow(html){
    const re = /<(circle|rect|polygon)\b[^>]*class="(pi|pq)"[^>]*>/g, out = []; let m;
    while((m = re.exec(html))){
      const tag = m[0];
      if(m[2] === 'pq'){ out.push(null); continue; }
      let shape;
      if(m[1] === 'circle') shape = 'circle'; else if(m[1] === 'rect') shape = 'square';
      else { const n = attr(tag, 'points').trim().split(/\s+/).length; shape = n === 3 ? 'triangle' : n === 4 ? 'diamond' : n === 10 ? 'star' : '?'; }
      out.push(COLOUR[attr(tag, 'fill')] + ' ' + shape);
    }
    return out;
  }
  function minPeriod(seq){
    for(let p = 1; p < seq.length; p++){ let ok = true; for(let i = p; i < seq.length; i++) if(seq[i] !== seq[i - p]){ ok = false; break; } if(ok) return p; }
    return seq.length;
  }
  /* seq has exactly one null: smallest repeat length consistent with the visible items that can fill it */
  function inferMissing(seq){
    const m = seq.indexOf(null);
    for(let p = 1; p < seq.length; p++){
      const map = {}; let ok = true;
      for(let i = 0; i < seq.length; i++){ if(seq[i] === null) continue; const r = i % p; if(map[r] === undefined) map[r] = seq[i]; else if(map[r] !== seq[i]){ ok = false; break; } }
      if(ok && map[m % p] !== undefined) return map[m % p];
    }
    return '?';
  }
  V.extra.lgRow = {
    render: function(names){ return rowSVG(names); },
    verify: function(args, html){ return JSON.stringify(decodeRow(html)) === JSON.stringify(args[0]) ? '' : 'pattern row does not match'; }
  };

  /* ---------------------------------------------------------------- number cards */
  function seqHTML(vals){
    let s = '<div class="nseq" style="display:flex;flex-wrap:wrap;gap:8px;justify-content:center;align-items:center">';
    vals.forEach(function(v, i){
      if(v === null) s += '<span class="nq" style="min-width:46px;padding:8px 6px;text-align:center;font:900 22px system-ui;border:3px dashed ' + INK + ';border-radius:10px;background:#fff;color:#EB5757">?</span>';
      else s += '<span class="nc" style="min-width:46px;padding:8px 6px;text-align:center;font:900 22px system-ui;border:3px solid ' + INK + ';border-radius:10px;background:' + (i % 2 ? '#E6D4FF' : '#CFE1FF') + ';color:' + INK + '">' + v + '</span>';
    });
    return s + '</div>';
  }
  function decodeSeq(html){
    const re = /<span class="(nc|nq)"[^>]*>([^<]*)<\/span>/g, out = []; let m;
    while((m = re.exec(html))) out.push(m[1] === 'nq' ? null : parseInt(m[2], 10));
    return out;
  }
  /* value for the one hidden slot: constant jump, or two jumps taking turns (hidden slot at the end) */
  function inferSeq(vals){
    const m = vals.indexOf(null);
    if(m === vals.length - 1){
      const v = vals.slice(0, -1), d = [];
      for(let i = 0; i + 1 < v.length; i++) d.push(v[i + 1] - v[i]);
      if(d.every(function(x){ return x === d[0]; })) return v[v.length - 1] + d[0];
      if(d.length >= 3 && d.every(function(x, i){ return x === d[i % 2]; })) return v[v.length - 1] + d[d.length % 2];
      return NaN;
    }
    let a = -1, b = -1;
    for(let i = 0; i < vals.length; i++) if(vals[i] !== null){ if(a < 0) a = i; else if(b < 0) b = i; }
    const d = (vals[b] - vals[a]) / (b - a);
    for(let i = 0; i < vals.length; i++) if(vals[i] !== null && Math.abs(vals[a] + d * (i - a) - vals[i]) > 1e-9) return NaN;
    return vals[a] + d * (m - a);
  }
  function jump(vals){ const v = vals.filter(function(x){ return x !== null; }); const d = v[1] - v[0]; for(let i = 1; i < v.length; i++) if(v[i] - v[i - 1] !== d) return NaN; return d; }
  V.extra.lgNums = {
    render: function(vals){ return seqHTML(vals); },
    verify: function(args, html){ return JSON.stringify(decodeSeq(html)) === JSON.stringify(args[0]) ? '' : 'number cards do not match'; }
  };
  function arith(start, step, n){ const a = []; for(let i = 0; i < n; i++) a.push(start + step * i); return a; }
  function ruleText(d){ return d > 0 ? 'Add ' + d + ' each time' : 'Take away ' + (-d) + ' each time'; }

  /* ---------------------------------------------------------------- matchstick figures */
  function sticksSVG(kind, ns){
    let x0 = 26, s = '';
    ns.forEach(function(n, fi){
      const w = 30, h = 26, top = 10; let wid;
      function L(x1, y1, x2, y2){ s += '<line class="stick" data-fig="' + fi + '" x1="' + r2(x0 + x1) + '" y1="' + r2(y1) + '" x2="' + r2(x0 + x2) + '" y2="' + r2(y2) + '" stroke="#9B51E0" stroke-width="5" stroke-linecap="round"/>'; }
      if(kind === 'squares'){
        for(let i = 0; i < n; i++){ L(i * w, top, (i + 1) * w, top); L(i * w, top + w, (i + 1) * w, top + w); }
        for(let i = 0; i <= n; i++) L(i * w, top, i * w, top + w);
        wid = n * w;
      } else {
        const vy = function(i){ return i % 2 === 0 ? top + h : top; };
        for(let i = 0; i <= n; i++) L(i * w / 2, vy(i), (i + 1) * w / 2, vy(i + 1));
        for(let i = 0; i < n; i++) L(i * w / 2, vy(i), (i + 2) * w / 2, vy(i + 2));
        wid = (n + 1) * w / 2;
      }
      s += '<text x="' + r2(x0 + wid / 2) + '" y="' + (top + (kind === 'squares' ? w : h) + 24) + '" text-anchor="middle" font-size="13" font-weight="800" fill="' + INK + '">Pattern ' + (fi + 1) + '</text>';
      x0 += wid + 30;
    });
    return wrapSvg(Math.max(x0 + 6, 100), kind === 'squares' ? 80 : 76, s, Math.max(x0 + 6, 100));
  }
  function decodeSticks(html){
    const c = {};
    (html.match(/<line class="stick"[^>]*>/g) || []).forEach(function(t){ const f = attr(t, 'data-fig'); c[f] = (c[f] || 0) + 1; });
    return Object.keys(c).sort(function(a, b){ return a - b; }).map(function(k){ return c[k]; });
  }
  function stickFormula(kind, n){ return kind === 'squares' ? 3 * n + 1 : 2 * n + 1; }
  V.extra.lgSticks = {
    render: function(kind, ns){ return sticksSVG(kind, ns); },
    verify: function(args, html){ return JSON.stringify(decodeSticks(html)) === JSON.stringify(args[1].map(function(n){ return stickFormula(args[0], n); })) ? '' : 'stick counts do not match'; }
  };
  /* figure N from the drawn first three figures */
  function sticksAt(counts, N){ return counts[0] + (N - 1) * (counts[1] - counts[0]); }
  function sticksOK(counts){ return counts.length === 3 && counts[2] - counts[1] === counts[1] - counts[0]; }

  /* ---------------------------------------------------------------- repeating shape patterns */
  const TPL = { AB: [0, 1], AAB: [0, 0, 1], ABB: [0, 1, 1], ABC: [0, 1, 2], AABB: [0, 0, 1, 1], ABAC: [0, 1, 0, 2], AABC: [0, 0, 1, 2], ABCD: [0,1, 2, 3] };
  function mkUnit(tplKey){
    const t = TPL[tplKey], kinds = {}; t.forEach(function(i){ kinds[i] = 1; });
    const toks = sample(TOKNAMES, Object.keys(kinds).length);
    return t.map(function(i){ return toks[i]; });
  }
  function repeatSeq(unit, n){ const o = []; for(let i = 0; i < n; i++) o.push(unit[i % unit.length]); return o; }
  function tokOpt(name, why){ return opt(K.text(name), rowSVG([name], { width: 56 }), why); }
  function finishVisual(q, mainHtml, ansFn){
    q.optionsAreVisual = true;
    q.decodeKey = function(){
      for(let i = 0; i < q.options.length; i++){ const d = decodeRow(q.options[i].label); if(d.length !== 1 || K.text(d[0]) !== q.options[i].key) return 'option ' + i + ' picture does not match its key'; }
      return K.text(ansFn(decodeRow(mainHtml)));
    };
    return q;
  }
  function unitText(unit){ return unit.map(function(n){ return '<b>' + n + '</b>'; }).join(', '); }
  function pools(wrongList){
    const ds = wrongList.filter(function(w){ return w.name; }).map(function(w){ return tokOpt(w.name, w.why); });
    shuffle(TOKNAMES).forEach(function(n){ ds.push(tokOpt(n, 'That shape does not come here. Find the bit that repeats and carry it on in order.')); });
    return ds;
  }

  function nextQ(tpls, count, extraLen){
    for(let tries = 0; tries < 80; tries++){
      const tk = pick(tpls), unit = mkUnit(tk), L = unit.length;
      const n = L * 2 + randInt(0, extraLen === undefined ? L - 1 : Math.min(extraLen, L - 1));
      const shown = repeatSeq(unit, n), full = repeatSeq(unit, n + 1);
      const correct = full[n], truthName = unit[n % L];
      if(minPeriod(shown) !== L) continue;
      const withGap = shown.concat([null]);
      if(inferMissing(withGap) !== truthName) continue;
      const vis = rowSVG(withGap);
      const q = mcq({
        prompt: pick(['What comes next in the pattern?', 'Which shape comes next?', 'The pattern keeps going. What is the next shape?']), visual: vis,
        correct: tokOpt(correct), keepOrder: true, count: count,
        distractors: pools([
          { name: shown[n - 1], why: 'That is the shape that was just before the gap. The pattern would not repeat that one here.' },
          { name: unit[(n + 1) % L], why: 'That shape comes AFTER the missing one. You skipped a shape.' },
          { name: unit[0], why: 'The pattern only starts again at the beginning after the whole repeating part is finished.' }
        ]),
        hint: 'Find the repeating part: where does the first shape come again? Then carry it on.',
        explain: ex('Carrying the pattern on', [
          'The part that repeats is: ' + unitText(unit) + '.',
          'The pattern has gone round ' + (Math.floor(n / L)) + (Math.floor(n / L) === 1 ? ' time' : ' times') + (n % L ? ' and has done ' + (n % L) + ' more shape' + (n % L === 1 ? '' : 's') + '.' : ' exactly.'),
          'So the next shape is the ' + (n % L + 1 === 1 ? 'first' : (n % L + 1) + (n % L + 1 === 2 ? 'nd' : n % L + 1 === 3 ? 'rd' : 'th')) + ' one of the repeat: <b>' + truthName + '</b>. ✅'
        ]),
        truth: K.text(truthName)
      });
      return finishVisual(q, vis, function(row){ return inferMissing(row); });
    }
    throw new Error('nextQ failed');
  }

  function gapQ(tpls, count){
    for(let tries = 0; tries < 80; tries++){
      const tk = pick(tpls), unit = mkUnit(tk), L = unit.length;
      const n = L * 2 + randInt(1, L);
      const m = randInt(1, n - 2);
      const full = repeatSeq(unit, n), shown = full.slice(); shown[m] = null;
      const truthName = unit[m % L];
      if(minPeriod(full) !== L || inferMissing(shown) !== truthName) continue;
      const vis = rowSVG(shown);
      const q = mcq({
        prompt: pick(['One shape is hiding behind the ? box. Which shape is it?', 'Which shape is missing from the pattern?']), visual: vis,
        correct: tokOpt(full[m]), keepOrder: true, count: count,
        distractors: pools([
          { name: full[(m + 1) % n], why: 'That is the shape AFTER the gap. Look at the shapes on BOTH sides of the box.' },
          { name: full[(m + n - 1) % n], why: 'That is the shape BEFORE the gap. The same shape does not come twice here.' }
        ]),
        hint: 'Find a place where the pattern repeats and look at what is in the same spot in the other repeat.',
        explain: ex('Finding the missing shape', [
          'The repeating part is: ' + unitText(unit) + '.',
          'The box is shape number <b>' + (m + 1) + '</b> in the row, which is number ' + (m % L + 1) + ' of the repeat.',
          'Number ' + (m % L + 1) + ' of the repeat is <b>' + truthName + '</b>. ✅'
        ]),
        truth: K.text(truthName)
      });
      return finishVisual(q, vis, function(row){ return inferMissing(row); });
    }
    throw new Error('gapQ failed');
  }

  function nthShapeQ(){
    for(let tries = 0; tries < 80; tries++){
      const unit = mkUnit(pick(['AB', 'AAB', 'ABB', 'ABC', 'AABB', 'ABAC', 'AABC'])), L = unit.length;
      const n = L * 2 + randInt(0, 1), N = randInt(9, 22);
      const shown = repeatSeq(unit, n);
      if(minPeriod(shown) !== L || N <= n) continue;
      const full = repeatSeq(unit, N), correct = full[N - 1], truthName = unit[(N - 1) % L];
      const vis = rowSVG(shown);
      const wrongs = [
        { name: unit[N % L], why: 'You counted one shape too far. Count the shapes again: you need number ' + N + ', not ' + (N + 1) + '.' },
        { name: unit[(N - 2 + L) % L], why: 'You stopped one shape too early. You need number ' + N + '.' },
        { name: shown[n - 1], why: 'That is just the last shape in the picture. The pattern carries on from there.' }
      ];
      const q = mcq({
        prompt: 'The pattern carries on and on. What is the ' + N + 'th shape?', visual: vis,
        correct: tokOpt(correct), keepOrder: true, count: 4, distractors: pools(wrongs),
        hint: 'Count how many shapes are in ONE repeat. Then jump along in whole repeats and count on the rest.',
        explain: ex('The ' + N + 'th shape', [
          'One repeat has <b>' + L + '</b> shapes: ' + unitText(unit) + '.',
          N + ' = ' + Math.floor((N - 1) / L) + ' whole repeat' + (Math.floor((N - 1) / L) === 1 ? '' : 's') + ' (that is ' + Math.floor((N - 1) / L) * L + ' shapes) and ' + (((N - 1) % L) + 1) + ' more.',
          'The ' + (((N - 1) % L) + 1) + (((N - 1) % L) + 1 === 1 ? 'st' : ((N - 1) % L) + 1 === 2 ? 'nd' : ((N - 1) % L) + 1 === 3 ? 'rd' : 'th') + ' shape of the repeat is <b>' + truthName + '</b>. ✅'
        ]),
        truth: K.text(truthName)
      });
      return finishVisual(q, vis, function(row){ const p = minPeriod(row); return row[(N - 1) % p]; });
    }
    throw new Error('nthShapeQ failed');
  }

  function countShapeQ(){
    for(let tries = 0; tries < 80; tries++){
      const unit = mkUnit(pick(['AB', 'AAB', 'ABB', 'ABC', 'AABB'])), L = unit.length;
      const n = L * 2 + randInt(0, 1), N = pick([10, 12, 14, 15, 16, 18, 20]);
      const shown = repeatSeq(unit, n);
      if(minPeriod(shown) !== L) continue;
      const target = pick(unit);
      let cnt = 0; const long = repeatSeq(unit, N); long.forEach(function(x){ if(x === target) cnt++; });
      const vis = rowSVG(shown);
      const perUnit = unit.filter(function(x){ return x === target; }).length;
      return numeric({
        prompt: 'The pattern keeps going for ' + N + ' shapes. How many ' + target + 's will there be?', visual: vis, answer: cnt,
        hint: 'How many ' + target + 's are in ONE repeat? Then see how many whole repeats fit into ' + N + '.',
        explain: ex('Counting the ' + target + 's', [
          'One repeat has <b>' + L + '</b> shapes and <b>' + perUnit + '</b> of them ' + (perUnit === 1 ? (/^[aeiou]/.test(target) ? 'is an ' : 'is a ') : 'are ') + target + (perUnit === 1 ? '' : 's') + '.',
          N + ' shapes is ' + Math.floor(N / L) + ' whole repeats' + (N % L ? ' plus ' + (N % L) + ' extra shapes (' + unit.slice(0, N % L).join(', ') + ')' : '') + '.',
          'Altogether there are <b>' + cnt + '</b> ' + target + (cnt === 1 ? '' : 's') + '. ✅'
        ]),
        truth: (function(){ const p = minPeriod(decodeRow(vis)), row = decodeRow(vis); let c = 0; for(let i = 0; i < N; i++) if(row[i % p] === target) c++; return c; })(),
        decode: function(){ const row = decodeRow(vis), p = minPeriod(row); let c = 0; for(let i = 0; i < N; i++) if(row[i % p] === target) c++; return c; },
        wrong: function(v){ return v === Math.floor(N / L) * perUnit ? 'You counted only the whole repeats. There are some extra shapes at the end too.' : (v === Math.ceil(N / L) * perUnit ? 'The last repeat is not finished, so it may have fewer.' : ''); }
      });
    }
    throw new Error('countShapeQ failed');
  }

  /* ---------------------------------------------------------------- number patterns */
  function numNextQ(o){
    const step = pick(o.steps), down = o.down && chance(0.4), sg = down ? -1 : 1;
    const n = randInt(o.nMin, o.nMax);
    const start = down ? randInt(step * n + (o.floor || 0), step * n + (o.floor || 0) + 25) : randInt(o.startMin, o.startMax);
    const vals = arith(start, sg * step, n), last = vals[n - 1], ans = last + sg * step;
    const vis = seqHTML(vals.concat([null]));
    const stepWhy = function(s2){ return 'Look at the jump between two numbers. It is ' + step + ' each time, not ' + s2 + '.'; };
    return mcqNum({
      prompt: pick(['What number comes next?', 'Carry on the pattern. What is the next number?']), visual: vis, answer: ans, count: o.count,
      fmt: String,
      wrong: [
        { v: last + sg * (step + 1), why: stepWhy(step + 1) },
        { v: step > 1 ? last + sg * (step - 1) : -1, why: stepWhy(step - 1) },
        { v: last - sg * step, why: down ? 'The numbers are going DOWN, so take away.' : 'The numbers are going UP, so add.' },
        { v: last, why: 'That is the number before the box. The pattern changes every time.' },
        { v: ans + 10, why: 'Careful with the tens: adding ' + step + ' to ' + last + ' only changes the tens if you cross a ten.' }
      ],
      hint: 'Find the jump between the first two numbers. Check it works for the next pair too. Then jump again.',
      explain: ex('Carry on the pattern', [
        'Look at the jumps: ' + vals[0] + ' → ' + vals[1] + ' is ' + (down ? '<b>take away ' : '<b>add ') + step + '</b>.',
        'It is the same every time, so the rule is <b>' + ruleText(sg * step) + '</b>.',
        last + (down ? ' − ' : ' + ') + step + ' = <b>' + ans + '</b>. ✅'
      ]),
      truth: start + sg * step * n,
      decode: function(){ return inferSeq(decodeSeq(vis)); }
    });
  }

  function numGapQ(o){
    const step = pick(o.steps), n = randInt(5, 6), m = randInt(1, n - 2);
    const start = randInt(o.startMin, o.startMax);
    const vals = arith(start, step, n), shown = vals.slice(); const ans = vals[m]; shown[m] = null;
    const vis = seqHTML(shown);
    const build = function(){
      return {
        prompt: pick(['Which number is hiding in the box?', 'Find the missing number in the pattern.']), visual: vis, answer: ans,
        hint: 'Work out the jump from two numbers that are next to each other, then use it to fill the box.',
        explain: ex('Finding the missing number', [
          'Two neighbours jump by <b>' + step + '</b>: ' + (m + 2 < n ? vals[m + 1] + ' and ' + vals[m + 2] : vals[m - 2] + ' and ' + vals[m - 1]) + ' are ' + step + ' apart.',
          'The box comes after <b>' + vals[m - 1] + '</b>, so ' + vals[m - 1] + ' + ' + step + ' = <b>' + ans + '</b>.',
          'Check: ' + ans + ' + ' + step + ' = ' + vals[m + 1] + ' ✅'
        ]),
        truth: start + step * m, decode: function(){ return inferSeq(decodeSeq(vis)); }
      };
    };
    const b = build();
    if(o.typed) return numeric(Object.assign(b, { wrong: function(v){ return v === vals[m - 1] + step + 1 || v === vals[m + 1] - step - 1 ? 'Close! Check that the jump from ' + vals[m - 1] + ' and the jump to ' + vals[m + 1] + ' are both ' + step + '.' : ''; } }));
    b.wrong = [
      { v: vals[m - 1] + step + 1, why: 'The jump is ' + step + ', not ' + (step + 1) + '.' },
      { v: step > 1 ? vals[m - 1] + step - 1 : -1, why: 'The jump is ' + step + ', not ' + (step - 1) + '.' },
      { v: vals[m + 1] + step, why: 'That is the number AFTER the next one. The missing number is between its neighbours.' },
      { v: vals[m - 1], why: 'That is the number before the box.' }
    ];
    b.count = o.count; b.fmt = String;
    return mcqNum(b);
  }

  function ruleQ(count){
    const step = randInt(2, 9), down = chance(0.35), sg = down ? -1 : 1, n = randInt(4, 5);
    const start = down ? randInt(step * n, step * n + 20) : randInt(1, 30);
    const vals = arith(start, sg * step, n), vis = seqHTML(vals);
    const lab = ruleText(sg * step);
    const ds = [
      opt(K.text(ruleText(-sg * step)), ruleText(-sg * step), down ? 'The numbers are getting smaller, so we take away.' : 'The numbers are getting bigger, so we add.'),
      opt(K.text(ruleText(sg * (step + 1))), ruleText(sg * (step + 1)), 'Check the jump again: from ' + vals[0] + ' to ' + vals[1] + ' is ' + step + ', not ' + (step + 1) + '.'),
      opt(K.text(ruleText(sg * (step - 1))), ruleText(sg * (step - 1)), 'Check the jump again: from ' + vals[0] + ' to ' + vals[1] + ' is ' + step + ', not ' + (step - 1) + '.'),
      opt(K.text(ruleText(sg * (step + 2))), ruleText(sg * (step + 2)), 'That jump is too big.'),
      opt(K.text(ruleText(sg * (step - 2 > 0 ? step - 2 : step + 3))), ruleText(sg * (step - 2 > 0 ? step - 2 : step + 3)), 'That jump is not the one in the pattern.')
    ];
    return mcq({
      prompt: 'What is the rule for this pattern?', visual: vis, correct: opt(K.text(lab), lab), distractors: ds, keepOrder: true, count: count,
      hint: 'Do the numbers go up or down? Then find the jump between the first two numbers and check the next pair.',
      explain: ex('Finding the rule', [
        'The numbers go ' + (down ? '<b>down</b>' : '<b>up</b>') + ': ' + vals.join(', ') + '.',
        vals[0] + ' → ' + vals[1] + ' jumps by ' + step + ', and so does every other pair.',
        'The rule is <b>' + lab + '</b>. ✅'
      ]),
      truth: K.text(ruleText((vals[n - 1] - vals[0]) / (n - 1))),
      decode: function(){ return K.text(ruleText(jump(decodeSeq(vis)))); }
    });
  }

  /* exactly ONE number breaks the rule: every other number must fit one constant jump */
  function fitsWithout(vals, skip){
    const pts = []; vals.forEach(function(v, i){ if(i !== skip) pts.push([i, v]); });
    const d = (pts[1][1] - pts[0][1]) / (pts[1][0] - pts[0][0]);
    if(!Number.isInteger(d) || d === 0) return false;
    return pts.every(function(p){ return pts[0][1] + d * (p[0] - pts[0][0]) === p[1]; });
  }
  function oddNumberQ(o){
    for(let tries = 0; tries < 100; tries++){
      const step = pick(o.steps), down = o.down && chance(0.3), sg = down ? -1 : 1, n = o.n;
      const start = down ? randInt(step * n, step * n + 20) : randInt(o.startMin, o.startMax);
      const vals = arith(start, sg * step, n), idx = randInt(o.idxMin === undefined ? 1 : o.idxMin, n - 1);
      const wrongVal = vals[idx] + pick([-3, -2, -1, 1, 2, 3, o.big || 5, -(o.big || 5)]);
      if(wrongVal < 0 || vals.indexOf(wrongVal) >= 0) continue;
      const shown = vals.slice(); shown[idx] = wrongVal;
      let fitting = 0; for(let s = 0; s < n; s++) if(fitsWithout(shown, s)) fitting++;
      if(fitting !== 1 || fitsWithout(shown, -1)) continue;
      const vis = seqHTML(shown);
      const ds = shown.map(function(v, i){ return i === idx ? null : opt(K.num(v), String(v), 'That number does fit the rule (' + ruleText(sg * step).toLowerCase() + '). Look for the one that breaks it.'); }).filter(function(x){ return x; });
      return mcq({
        prompt: pick(['One number does not fit the pattern. Which one is it?', 'Which number is the odd one out in this pattern?', 'Someone made a mistake in this pattern. Which number is wrong?']), visual: vis,
        correct: opt(K.num(wrongVal), String(wrongVal)), distractors: ds, count: 4,
        hint: 'Find the jump that most of the numbers share. Then look for the number that breaks it.',
        explain: ex('Spotting the mistake', [
          'Most jumps are <b>' + ruleText(sg * step).toLowerCase() + '</b>.',
          'In the right pattern, number ' + (idx + 1) + ' would be <b>' + vals[idx] + '</b>.',
          'But the pattern shows <b>' + wrongVal + '</b>, so ' + wrongVal + ' is the wrong one. ✅'
        ]),
        truth: K.num(vals[idx] + (wrongVal - vals[idx])),
        decode: function(){ const got = decodeSeq(vis); let f = -1; for(let s = 0; s < got.length; s++) if(fitsWithout(got, s)) f = s; return f < 0 ? 'none' : K.num(got[f]); }
      });
    }
    throw new Error('oddNumberQ failed');
  }

  function alternatingQ(){
    for(let tries = 0; tries < 60; tries++){
      const a = randInt(1, 9), b = randInt(1, 9); if(a === b) continue;
      const n = randInt(5, 6), start = randInt(1, 30), vals = [start];
      for(let i = 1; i < n; i++) vals.push(vals[i - 1] + (i % 2 ? a : b));
      const ans = vals[n - 1] + (n % 2 ? a : b), lastJ = vals[n - 1] - vals[n - 2];
      const vis = seqHTML(vals.concat([null]));
      return numeric({
        prompt: pick(['The jumps take turns. What number comes next?', 'Two different jumps take turns. What is the next number?']), visual: vis, answer: ans,
        hint: 'Look at the jumps one by one: +' + a + ' then something else, then back again. Which jump is next?',
        explain: ex('Two jumps taking turns', [
          'The jumps are <b>+' + a + '</b> and <b>+' + b + '</b>, taking turns.',
          'The last jump was +' + lastJ + ', so the next jump is <b>+' + (n % 2 ? a : b) + '</b>.',
          vals[n - 1] + ' + ' + (n % 2 ? a : b) + ' = <b>' + ans + '</b>. ✅'
        ]),
        truth: start + Math.ceil(n / 2) * a + Math.floor(n / 2) * b,
        decode: function(){ return inferSeq(decodeSeq(vis)); },
        wrong: function(v){ return v === vals[n - 1] + lastJ ? 'That repeats the same jump as last time. The jumps take turns, so use the OTHER jump.' : ''; }
      });
    }
    throw new Error('alternatingQ failed');
  }

  function nthNumberQ(){
    const step = randInt(2, 9), start = randInt(1, 20), n = 4, N = randInt(8, 12);
    const vals = arith(start, step, n), vis = seqHTML(vals);
    const ans = start + (N - 1) * step;
    return numeric({
      prompt: 'The pattern keeps going. What is the ' + N + 'th number?', visual: vis, answer: ans,
      hint: 'The rule is the same jump each time. From the first number you need ' + (N - 1) + ' jumps to reach number ' + N + '.',
      explain: ex('The ' + N + 'th number', [
        'The jump is <b>' + step + '</b> each time, starting at ' + start + '.',
        'To reach number ' + N + ' you make <b>' + (N - 1) + '</b> jumps: ' + (N - 1) + ' × ' + step + ' = ' + (N - 1) * step + '.',
        start + ' + ' + (N - 1) * step + ' = <b>' + ans + '</b>. ✅'
      ]),
      truth: (function(){ let v = start; for(let i = 1; i < N; i++) v += step; return v; })(),
      decode: function(){ const g = decodeSeq(vis); return g[0] + (N - 1) * jump(g); },
      wrong: function(v){ return v === ans + step ? 'That is number ' + (N + 1) + '. You made one jump too many.' : (v === ans - step ? 'That is number ' + (N - 1) + '. You stopped one jump early.' : ''); }
    });
  }

  /* ---------------------------------------------------------------- matchsticks */
  function sticksQ(tier){
    const kind = pick(['squares', 'triangles']), ns = [1, 2, 3];
    const vis = sticksSVG(kind, ns);
    const thing = kind === 'squares' ? 'square' : 'triangle';
    const N = tier === 2 ? pick([4, 5]) : randInt(6, 10);
    const c = ns.map(function(n){ return stickFormula(kind, n); });
    const ans = c[0] + (N - 1) * (c[1] - c[0]);
    const d = c[1] - c[0];
    const decodeAns = function(){ const cs = decodeSticks(vis); return sticksOK(cs) ? sticksAt(cs, N) : NaN; };
    const explain = ex('Matchstick pattern', [
      'Pattern 1 uses <b>' + c[0] + '</b> sticks. Each new ' + thing + ' adds <b>' + d + '</b> more sticks (they share a stick).',
      'To get to pattern ' + N + ' we add ' + d + ' a total of ' + (N - 1) + ' times: ' + (N - 1) + ' × ' + d + ' = ' + (N - 1) * d + '.',
      c[0] + ' + ' + (N - 1) * d + ' = <b>' + ans + '</b> sticks. ✅'
    ]);
    const hint = 'Count the sticks in each pattern. How many MORE does each new ' + thing + ' need?';
    if(tier === 2){
      return mcqNum({
        prompt: 'How many sticks do you need to make pattern ' + N + ' (' + N + ' ' + thing + 's in a row)?', visual: vis, answer: ans, count: 4,
        wrong: [
          { v: (kind === 'squares' ? 4 : 3) * N, why: 'That counts every ' + thing + ' as if it had its own sticks. But neighbouring ' + thing + 's share a stick!' },
          { v: ans - d, why: 'That is the number for pattern ' + (N - 1) + '. Add one more ' + thing + '.' },
          { v: ans + d, why: 'That is pattern ' + (N + 1) + '. You added one jump too many.' },
          { v: c[2] + N, why: 'Each new ' + thing + ' needs ' + d + ' more sticks, not 1.' }
        ],
        hint: hint, explain: explain, truth: stickFormula(kind, N), decode: decodeAns
      });
    }
    const variant = chance(0.35);
    if(variant){ // reverse: how many shapes with S sticks
      const total = stickFormula(kind, N), who = pick(NAMES);
      let best = 0; for(let k = 1; k < 40; k++) if(stickFormula(kind, k) <= total) best = k;
      return numeric({
        prompt: who + ' has ' + total + ' matchsticks. How many ' + thing + 's can ' + who + ' make in a row, like this pattern?', visual: vis, answer: N,
        hint: 'Take away the first stick that starts it off. Then see how many sticks each ' + thing + ' needs.',
        explain: ex('Working backwards', [
          'Pattern 1 has ' + c[0] + ' sticks and each new ' + thing + ' adds ' + d + '.',
          total + ' − ' + c[0] + ' = ' + (total - c[0]) + ' sticks left to share out in groups of ' + d + '.',
          (total - c[0]) + ' ÷ ' + d + ' = ' + (N - 1) + ' more ' + thing + 's, plus the first one makes <b>' + N + '</b> ' + thing + 's. ✅'
        ]),
        truth: best, decode: function(){ const cs = decodeSticks(vis); return sticksOK(cs) ? (total - cs[0]) / (cs[1] - cs[0]) + 1 : NaN; },
        wrong: function(v){ return v === N - 1 ? 'The first ' + thing + ' is special — it needs ' + c[0] + ' sticks, then every other one adds ' + d + '.' : (v === Math.floor(total / c[0]) ? 'You shared sticks equally between separate ' + thing + 's, but in a row neighbours share.' : ''); }
      });
    }
    return numeric({
      prompt: 'How many sticks do you need to make pattern ' + N + ' (' + N + ' ' + thing + 's in a row)?', visual: vis, answer: ans,
      hint: hint, explain: explain, truth: stickFormula(kind, N), decode: decodeAns,
      wrong: function(v){ return v === (kind === 'squares' ? 4 : 3) * N ? 'Neighbouring ' + thing + 's share a stick, so you need fewer than that.' : (v === ans - d ? 'That is the answer for pattern ' + (N - 1) + '.' : ''); }
    });
  }

  /* ---------------------------------------------------------------- the skill */
  registerSkill({
    id: 'logic-patterns', strand: 'logic', name: 'Patterns and rules', emoji: '🔷', year: 3, order: 910, prereq: [],
    lesson: {
      title: 'Spot the pattern, find the rule',
      steps: [
        { say: 'A <b>pattern</b> is something that repeats in the same order again and again. Look: red circle, blue square, red circle, blue square…', vis: { kind: 'lgRow', args: [['red circle', 'blue square', 'red circle', 'blue square', 'red circle', 'blue square']] } },
        { say: 'To carry a pattern on, find the part that <b>repeats</b>. Here it is <b>red circle, blue square</b>. After the blue square, the repeat starts again.', vis: { kind: 'lgRow', args: [['red circle', 'blue square', 'red circle', 'blue square', 'red circle', null]] },
          quiz: { prompt: 'What goes in the box?', options: [{ label: 'Blue square', ok: true }, { label: 'Red circle', ok: false }, { label: 'Green triangle', ok: false }], right: 'Yes! The repeat is red circle, blue square. After a red circle comes a blue square.', wrong: 'The repeat is red circle, blue square. The last shape before the box is a red circle, so a blue square comes next.' } },
        { say: 'Number patterns have a <b>rule</b> too. Look at the <b>jump</b> between the numbers. 3, 6, 9, 12: each time we <b>add 3</b>.', vis: { kind: 'lgNums', args: [[3, 6, 9, 12, null]] } },
        { say: 'Patterns can <b>grow</b>. Pattern 1 has 4 sticks. Pattern 2 has 7 sticks. Pattern 3 has 10. Every new square adds <b>3 more sticks</b>.', vis: { kind: 'lgSticks', args: ['squares', [1, 2, 3]] },
          quiz: { prompt: 'How many sticks will pattern 4 need?', options: [{ label: '13', ok: true }, { label: '12', ok: false }, { label: '16', ok: false }], right: 'Yes! 10 + 3 = 13 sticks.', wrong: 'Pattern 3 has 10 sticks, and each new square adds 3. So 10 + 3 = 13.' } }
      ]
    },
    trick: {
      title: 'Find the jump, check the jump',
      say: 'For number patterns, <b>subtract two neighbours</b> to find the jump. Then <b>check</b> it with another pair. For shapes, find where the <b>first shape comes back</b>: everything before it is the repeat.',
      vis: { kind: 'lgNums', args: [[4, 9, 14, 19, null]] },
      example: '4 → 9 is +5, 9 → 14 is +5 ✅ So the rule is <b>add 5</b> and the next number is 19 + 5 = <b>24</b>.'
    },
    gen: {
      1: function(){
        const f = randInt(0, 2);
        if(f === 0) return nextQ(['AB', 'AAB', 'ABB'], 3, 1);
        if(f === 1) return gapQ(['AB', 'ABC'], 3);
        return numNextQ({ steps: [1, 2, 5, 10], down: false, nMin: 4, nMax: 5, startMin: 0, startMax: 20, count: 3 });
      },
      2: function(){
        const f = randInt(0, 6);
        if(f === 0) return nextQ(['ABC', 'AABB', 'AAB', 'ABB'], 4);
        if(f === 1) return gapQ(['ABC', 'AABB', 'AAB'], 4);
        if(f === 2) return numNextQ({ steps: [2, 3, 4, 5, 6, 7, 8, 9], down: true, nMin: 4, nMax: 5, startMin: 1, startMax: 40, count: 4 });
        if(f === 3) return ruleQ(4);
        if(f === 4) return numGapQ({ steps: [2, 3, 4, 5, 6, 7, 8, 9], startMin: 1, startMax: 40, count: 4 });
        if(f === 5) return oddNumberQ({ steps: [2, 3, 4, 5, 10], n: 6, startMin: 1, startMax: 30, big: 5, down: true });
        return sticksQ(2);
      },
      3: function(){
        const f = randInt(0, 6);
        if(f === 0) return sticksQ(3);
        if(f === 1) return nthNumberQ();
        if(f === 2) return alternatingQ();
        if(f === 3) return nthShapeQ();
        if(f === 4) return countShapeQ();
        if(f === 5) return numGapQ({ steps: [3, 4, 6, 7, 8, 9, 11, 12], startMin: 10, startMax: 90, typed: true });
        return oddNumberQ({ steps: [3, 4, 6, 7, 8, 9], n: 7, startMin: 5, startMax: 80, big: 4, down: true, idxMin: 0 });
      }
    }
  });
})();
