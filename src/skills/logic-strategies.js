/* LOGIC 4 — Problem-solving strategies: draw a bar model, work backwards, make a list, trial and improvement.
   Every explanation names the strategy. Pictures (bar models, number machines, picture sets, digit cards) are decoded. */
(function(){
  const INK = 'var(--vis-ink,#1B1B2F)';
  const NAMES = ['Ana', 'Marcus', 'Sophie', 'Ivan', 'Lucy', 'Diego', 'Ellen', 'Tom', 'Aisha', 'Kai', 'Mei', 'Leo'];
  function attr(tag, name){ const m = new RegExp(' ' + name + '="([^"]*)"').exec(tag); return m ? m[1] : null; }
  function range(a, b){ const o = []; for(let i = a; i <= b; i++) o.push(i); return o; }

  /* ------------------------------------------------------------ bar model decoding */
  function barHTML(parts, total){
    return V.barModel(parts.map(function(v){ return typeof v === 'object' ? { value: v.value, flex: v.flex || 1 } : { value: v, flex: v }; }), total);
  }
  function decodeBar(html){
    const tm = /<div class="barmodel"[^>]*><div[^>]*>([^<]*)<\/div>/.exec(html);
    const total = tm ? (/^\d+$/.test(tm[1]) ? parseInt(tm[1], 10) : tm[1]) : null;
    const parts = (html.match(/<div class="bpart"[^>]*>/g) || []).map(function(t){ const v = attr(t, 'data-v'); return /^\d+$/.test(v) ? parseInt(v, 10) : v; });
    return { total: total, parts: parts };
  }
  /* value of one '?' part (all '?' parts equal) or of the total */
  function solveBar(d){
    const known = d.parts.filter(function(v){ return typeof v === 'number'; }).reduce(function(t, v){ return t + v; }, 0);
    const unk = d.parts.filter(function(v){ return typeof v !== 'number'; }).length;
    if(typeof d.total !== 'number') return unk === 0 ? NaN : (unk === 0 ? NaN : known);
    return unk ? (d.total - known) / unk : NaN;
  }
  const CTX = [['stickers', 'sticker'], ['marbles', 'marble'], ['shells', 'shell'], ['football cards', 'football card'], ['beads', 'bead'], ['stars', 'star']];

  function barQ(o){
    for(let tries = 0; tries < 80; tries++){
      const kind = pick(o.kinds), ctx = pick(CTX), nm = sample(NAMES, 3), th = ctx[0];
      let prompt, parts, total, ans, wrong, steps, hint, shownTotal;
      if(kind === 'whole'){
        const a = randInt(o.lo, o.hi), b = randInt(o.lo, o.hi); ans = a + b;
        prompt = nm[0] + ' has ' + a + ' ' + th + '. ' + nm[1] + ' has ' + b + '. How many ' + th + ' do they have altogether?';
        parts = [a, b]; shownTotal = '?';
        wrong = [{ v: Math.abs(a - b), why: 'You took one amount away from the other. Together means the two bars joined: ADD.' }, { v: ans + 10, why: 'Check the tens when you add.' }, { v: ans - 10, why: 'Check the tens when you add.' }];
        steps = ['Draw one long bar for the <b>whole</b>. It is made of two parts: <b>' + a + '</b> and <b>' + b + '</b>.', 'The whole is the parts joined together, so add: ' + a + ' + ' + b + '.', 'The answer is <b>' + ans + '</b>. ✅'];
        hint = 'Draw a bar split in two parts. We know both parts. What is the whole?';
      } else if(kind === 'part'){
        const a = randInt(o.lo, o.hi), b = randInt(o.lo, o.hi); const T = a + b; ans = b;
        prompt = nm[0] + ' has ' + T + ' ' + th + '. ' + a + ' of them are red. How many are NOT red?';
        parts = [a, '?']; shownTotal = T;
        wrong = [{ v: T + a, why: 'The whole bar is ' + T + ', so the missing part must be SMALLER than ' + T + '. Take away.' }, { v: a, why: 'That is the red part. We want the other part.' }, { v: ans + 10, why: 'Check the tens when you take away.' }];
        steps = ['Draw a bar for all <b>' + T + '</b>. One part is <b>' + a + '</b> (red). The other part is the ? we want.', 'The missing part is the whole take away the known part: ' + T + ' − ' + a + '.', 'The answer is <b>' + ans + '</b>. ✅'];
        hint = 'Draw a bar for the whole. Shade one part. Which part is missing?';
      } else if(kind === 'three'){
        const a = randInt(o.lo, o.hi), b = randInt(o.lo, o.hi), c = randInt(o.lo, o.hi); const T = a + b + c; ans = c;
        prompt = nm[0] + ' has ' + a + ' ' + th + ', ' + nm[1] + ' has ' + b + ' and ' + nm[2] + ' has some. Together they have ' + T + '. How many does ' + nm[2] + ' have?';
        parts = [a, b, '?']; shownTotal = T;
        wrong = [{ v: T - a, why: 'You only took away one of the known parts. Take away BOTH ' + a + ' and ' + b + '.' }, { v: T - b, why: 'You only took away one of the known parts. Take away BOTH.' }, { v: a + b, why: 'That is the two known parts added. The missing part is what is LEFT of ' + T + '.' }];
        steps = ['Draw one bar for the whole <b>' + T + '</b> with three parts: <b>' + a + '</b>, <b>' + b + '</b> and ?.', 'The two known parts make ' + a + ' + ' + b + ' = ' + (a + b) + '.', T + ' − ' + (a + b) + ' = <b>' + ans + '</b>. ✅'];
        hint = 'Draw a bar split in three parts. Add the two parts you know, then see how much is left of the total.';
      } else { // equal parts + difference
        const x = randInt(o.lo, o.hi), d = randInt(2, 12); const T = 2 * x + d; ans = x;
        prompt = nm[0] + ' and ' + nm[1] + ' have ' + T + ' ' + th + ' altogether. ' + nm[1] + ' has ' + d + ' more than ' + nm[0] + '. How many does ' + nm[0] + ' have?';
        parts = ['?', '?', d]; shownTotal = T;
        wrong = [{ v: T - d, why: 'That is what is left after the ' + d + ' extra, but it is for BOTH people. Share it into 2 equal parts.' }, { v: x + d, why: 'That is ' + nm[1] + '’s amount. The question asks about ' + nm[0] + '.' }, { v: Math.round(T / 2), why: 'You shared the total equally, but ' + nm[1] + ' has ' + d + ' more.' }];
        steps = ['Draw a bar: two equal parts (one each) and a small extra part of <b>' + d + '</b> that only ' + nm[1] + ' has. Total <b>' + T + '</b>.', 'Take the extra away: ' + T + ' − ' + d + ' = ' + (T - d) + '. This is split into 2 equal parts.', (T - d) + ' ÷ 2 = <b>' + x + '</b>. ' + nm[0] + ' has ' + x + '. ✅'];
        hint = 'Draw a bar with two equal parts and one extra bit. Take the extra bit away first, then share what is left into 2.';
      }
      if(ans < 1) continue;
      const vis = barHTML(parts.map(function(p){ return p === '?' ? { value: '?', flex: Math.max(ans, 3) } : p; }), shownTotal);
      const decode = function(){ return solveBar(decodeBar(vis)); };
      // for the 'whole' kind the unknown is the TOTAL
      const dec = kind === 'whole' ? function(){ const d = decodeBar(vis); return d.parts.reduce(function(t, v){ return t + v; }, 0); } : decode;
      const ex_ = ex('Strategy: draw a bar model', steps);
      if(o.typed) return numeric({ prompt: prompt, visual: vis, answer: ans, hint: hint, explain: ex_, truth: kind === 'whole' ? parts[0] + parts[1] : (kind === 'part' ? shownTotal - parts[0] : (kind === 'three' ? shownTotal - parts[0] - parts[1] : (shownTotal - parts[2]) / 2)), decode: dec,
        wrong: function(v){ const w = wrong.filter(function(x){ return x.v === v; })[0]; return w ? w.why : ''; } });
      return mcqNum({ prompt: prompt, visual: vis, answer: ans, wrong: wrong, count: o.count || 4, hint: hint, explain: ex_,
        truth: kind === 'whole' ? parts[0] + parts[1] : (kind === 'part' ? shownTotal - parts[0] : (kind === 'three' ? shownTotal - parts[0] - parts[1] : (shownTotal - parts[2]) / 2)), decode: dec });
    }
    throw new Error('barQ failed');
  }

  /* ------------------------------------------------------------ number machine (work backwards) */
  const SYM = { add: '+', sub: '−', mul: '×', div: '÷' };
  function flowHTML(start, ops, end){
    const box = 'padding:8px 12px;border:3px solid ' + INK + ';border-radius:10px;font:900 22px system-ui;min-width:44px;text-align:center;';
    let s = '<div class="flow" style="display:flex;flex-wrap:wrap;gap:6px;align-items:center;justify-content:center;color:' + INK + '">';
    s += '<span class="fv" style="' + box + 'background:#FFF3C4;color:#EB5757">' + start + '</span>';
    ops.forEach(function(o){ s += '<span style="font:900 22px system-ui">→</span><span class="fs" data-op="' + o.k + '" data-n="' + o.n + '" style="' + box + 'background:#E6D4FF">' + SYM[o.k] + ' ' + o.n + '</span>'; });
    s += '<span style="font:900 22px system-ui">→</span><span class="fv" style="' + box + 'background:#CFE1FF">' + end + '</span></div>';
    return s;
  }
  function decodeFlow(html){
    const vals = []; const rv = /<span class="fv"[^>]*>([^<]*)<\/span>/g; let m;
    while((m = rv.exec(html))) vals.push(/^\d+$/.test(m[1]) ? parseInt(m[1], 10) : m[1]);
    const ops = (html.match(/<span class="fs"[^>]*>/g) || []).map(function(t){ return { k: attr(t, 'data-op'), n: parseInt(attr(t, 'data-n'), 10) }; });
    return { start: vals[0], end: vals[1], ops: ops };
  }
  function applyOp(o, v){ return o.k === 'add' ? v + o.n : o.k === 'sub' ? v - o.n : o.k === 'mul' ? v * o.n : v / o.n; }
  function undoOp(o, v){ return o.k === 'add' ? v - o.n : o.k === 'sub' ? v + o.n : o.k === 'mul' ? v / o.n : v * o.n; }
  V.extra.lgFlow = {
    render: function(start, ops, end){ return flowHTML(start, ops, end); },
    verify: function(args, html){ const d = decodeFlow(html); return JSON.stringify(d.ops) === JSON.stringify(args[1]) && d.end === args[2] && String(d.start) === String(args[0]) ? '' : 'flow mismatch'; }
  };
  function verb(o){ return o.k === 'add' ? 'adds ' + o.n : o.k === 'sub' ? 'takes away ' + o.n : o.k === 'mul' ? (o.n === 2 ? 'doubles it' : 'multiplies it by ' + o.n) : (o.n === 2 ? 'halves it' : 'divides it by ' + o.n); }
  function undoWords(o, v, w){
    const sym = { add: ' − ', sub: ' + ', mul: ' ÷ ', div: ' × ' }[o.k];
    const what = o.k === 'add' ? 'adding ' + o.n : o.k === 'sub' ? 'taking away ' + o.n : o.k === 'mul' ? (o.n === 2 ? 'doubling' : 'multiplying by ' + o.n) : (o.n === 2 ? 'halving' : 'dividing by ' + o.n);
    return 'Undo ' + what + ': ' + v + sym + o.n + ' = <b>' + w + '</b>.';
  }
  function backQ(o){
    for(let tries = 0; tries < 200; tries++){
      const nOps = o.nOps, s0 = randInt(o.lo, o.hi), nm = pick(NAMES);
      const ops = [];
      for(let i = 0; i < nOps; i++){
        const k = pick(o.kinds[i] || o.kinds[o.kinds.length - 1]);
        const n = k === 'add' || k === 'sub' ? randInt(2, o.maxAdd) : (k === 'mul' ? pick(o.muls || [2, 3]) : pick([2, 3, 4]));
        ops.push({ k: k, n: n });
      }
      let v = s0, ok = true; const path = [s0];
      ops.forEach(function(op){ if(!ok) return; v = applyOp(op, v); if(!(Number.isInteger(v) && v >= 1 && v <= 150)) ok = false; path.push(v); });
      if(!ok) continue;
      if(nOps === 2 && ops[0].k === ops[1].k && (ops[0].k === 'add' || ops[0].k === 'sub')) continue;
      const end = v, vis = flowHTML('?', ops, end);
      const prompt = nm + ' thinks of a number. ' + ops.map(function(op, i){ return (i ? 'Then ' : '') + nm + ' ' + verb(op) + '.'; }).join(' ') + ' The answer is ' + end + '. What number did ' + nm + ' think of?';
      const steps = ['Start at the <b>end</b> (' + end + ') and go <b>backwards</b>, using the opposite of each step.'];
      let cur = end;
      for(let i = ops.length - 1; i >= 0; i--){ const nx = undoOp(ops[i], cur); steps.push(undoWords(ops[i], cur, nx)); cur = nx; }
      steps.push('Check by going forwards: ' + path.join(' → ') + '. The start number was <b>' + s0 + '</b>. ✅');
      const fwd = ops.reduce(function(a, op){ return applyOp(op, a); }, end);
      let wrongOrder = end; ops.forEach(function(op){ wrongOrder = undoOp(op, wrongOrder); });
      const wrong = [{ v: fwd, why: 'That does the SAME steps to the answer. To go BACK, use the opposite steps.' }];
      if(nOps > 1) wrong.push({ v: wrongOrder, why: 'You undid the steps in the wrong order. Start from the LAST step and work back.' });
      ops.forEach(function(op){ wrong.push({ v: end - (op.k === 'add' || op.k === 'sub' ? op.n : 0) * (op.k === 'add' ? 1 : -1), why: 'You undid only one of the steps.' }); });
      const decode = function(){ const d = decodeFlow(vis); let c = d.end; for(let i = d.ops.length - 1; i >= 0; i--) c = undoOp(d.ops[i], c); return c; };
      const hint = 'Work BACKWARDS. Start at ' + end + ' and undo the steps, last one first, using the opposite operation.';
      if(o.typed) return numeric({ prompt: prompt, visual: vis, answer: s0, hint: hint, explain: ex('Strategy: work backwards', steps), truth: s0, decode: decode,
        wrong: function(w){ return w === fwd ? 'That does the same steps again. Use the OPPOSITE steps, going back.' : (nOps > 1 && w === wrongOrder ? 'Undo the LAST step first.' : ''); } });
      return mcqNum({ prompt: prompt, visual: vis, answer: s0, count: o.count || 4, wrong: wrong, hint: hint, explain: ex('Strategy: work backwards', steps), truth: s0, decode: decode, valid: function(x){ return x >= 1 && Number.isInteger(x); } });
    }
    throw new Error('backQ failed');
  }

  /* ------------------------------------------------------------ make a list: picture sets */
  function setsHTML(groups){
    let s = '<div class="sets" style="display:flex;flex-direction:column;gap:6px;align-items:center;color:' + INK + '">';
    groups.forEach(function(g){
      s += '<div class="sg" style="display:flex;align-items:center;gap:6px;flex-wrap:wrap;justify-content:center"><b style="min-width:64px;text-align:right">' + g.label + '</b>';
      for(let i = 0; i < g.n; i++) s += '<span class="si" style="font-size:28px">' + g.emoji + '</span>';
      s += '</div>';
    });
    return s + '</div>';
  }
  function decodeSets(html){
    return html.split('<div class="sg"').slice(1).map(function(ch){ return (ch.match(/<span class="si"/g) || []).length; });
  }
  V.extra.lgSets = {
    render: function(groups){ return setsHTML(groups); },
    verify: function(args, html){ return JSON.stringify(decodeSets(html)) === JSON.stringify(args[0].map(function(g){ return g.n; })) ? '' : 'sets mismatch'; }
  };
  const COMBO = [
    { a: ['👕', 'tops', 'top'], b: ['🩳', 'pairs of shorts', 'pair of shorts'], c: ['🧢', 'caps', 'cap'], what: 'outfit', pl: 'outfits', story: function(n, A, B){ return n + ' has ' + A + ' tops and ' + B + ' pairs of shorts. ' + n + ' wears one top and one pair of shorts.'; }, q: 'How many different outfits can ' },
    { a: ['🥪', 'sandwiches', 'sandwich'], b: ['🥤', 'drinks', 'drink'], c: ['🍎', 'snacks', 'snack'], what: 'lunch', pl: 'lunches', story: function(n, A, B){ return 'A café has ' + A + ' sandwiches and ' + B + ' drinks. A lunch is one sandwich and one drink.'; }, q: 'How many different lunches can ' },
    { a: ['🍦', 'ice cream flavours', 'flavour'], b: ['🍪', 'toppings', 'topping'], c: ['🥣', 'tubs', 'tub'], what: 'treat', pl: 'treats', story: function(n, A, B){ return 'At the ice cream shop there are ' + A + ' flavours and ' + B + ' toppings. A treat is one flavour with one topping.'; }, q: 'How many different treats can ' },
    { a: ['🎩', 'hats', 'hat'], b: ['🧣', 'scarves', 'scarf'], c: ['🥕', 'noses', 'nose'], what: 'snowman', pl: 'snowmen', story: function(n, A, B){ return n + ' is dressing a snowman. There are ' + A + ' hats and ' + B + ' scarves. The snowman wears one hat and one scarf.'; }, q: 'How many different snowmen can ' }
  ];
  function comboQ(o){
    for(let tries = 0; tries < 40; tries++){
      const cx = pick(COMBO), nm = pick(NAMES), A = randInt(o.lo, o.hi), B = randInt(o.lo, o.hi), three = o.three, Cn = three ? randInt(2, 3) : 0;
      if(A === B && chance(0.6)) continue;
      const groups = [{ label: cx.a[1].split(' ').slice(-1)[0], emoji: cx.a[0], n: A }, { label: cx.b[1].split(' ').slice(-1)[0], emoji: cx.b[0], n: B }];
      if(three) groups.push({ label: cx.c[1], emoji: cx.c[0], n: Cn });
      let count = 0; for(let i = 0; i < A; i++) for(let j = 0; j < B; j++) count += three ? Cn : 1;
      const ans = three ? A * B * Cn : A * B;
      const vis = setsHTML(groups);
      let story = three ? (nm + ' can pick one of ' + A + ' ' + cx.a[1] + ', one of ' + B + ' ' + cx.b[1] + ' and one of ' + Cn + ' ' + cx.c[1] + '.') : cx.story(nm, A, B);
      const prompt = story + ' ' + (three ? 'How many different ways can ' + nm + ' choose?' : cx.q + nm + ' make?');
      const first = three ? '' : 'Take the first ' + cx.a[2] + ': it can go with each of the ' + B + ' ' + cx.b[1] + ', so that is ' + B + ' ' + cx.pl + '.';
      const steps = three
        ? ['<b>Make a list</b>, one choice at a time. Pair each of the ' + A + ' ' + cx.a[1] + ' with each of the ' + B + ' ' + cx.b[1] + ': ' + A + ' × ' + B + ' = ' + A * B + ' pairs.', 'Each pair can go with any of the ' + Cn + ' ' + cx.c[1] + ': ' + A * B + ' × ' + Cn + '.', 'There are <b>' + ans + '</b> different ways. ✅']
        : ['Strategy: <b>make a list</b>. ' + first, 'Do the same for each of the ' + A + ' ' + cx.a[1] + ': ' + A + ' groups of ' + B + '.', A + ' × ' + B + ' = <b>' + ans + '</b> different ' + (cx.pl || cx.what + 's') + '. ✅'];
      const decode = function(){ return decodeSets(vis).reduce(function(t, n){ return t * n; }, 1); };
      const hint = 'Make an organised list: take the first one and pair it with every choice from the other group. Then do the next one.';
      const wrong = [{ v: A + B + (three ? Cn : 0), why: 'That adds the numbers. Each choice from one group goes with EVERY choice from the other, so multiply.' }, { v: three ? A * B + Cn : A * B - 1, why: 'You missed some. Check every pairing.' }, { v: three ? A * B : A * (B + 1), why: 'Check your list: it needs every choice from ALL the groups.' }];
      if(o.typed) return numeric({ prompt: prompt, visual: vis, answer: ans, hint: hint, explain: ex('Strategy: make a list', steps), truth: count, decode: decode, wrong: function(v){ const w = wrong.filter(function(x){ return x.v === v; })[0]; return w ? w.why : ''; } });
      return mcqNum({ prompt: prompt, visual: vis, answer: ans, count: o.count || 4, wrong: wrong, hint: hint, explain: ex('Strategy: make a list', steps), truth: count, decode: decode });
    }
    throw new Error('comboQ failed');
  }

  function handshakeQ(o){
    const n = randInt(o.lo, o.hi), who = sample(NAMES, Math.min(n, 5)), people = [{ label: 'friends', emoji: '🧑', n: n }];
    let pairs = 0; for(let i = 0; i < n; i++) for(let j = i + 1; j < n; j++) pairs++;
    let ans = 0; for(let k = n - 1; k >= 1; k--) ans += k;
    const vis = setsHTML(people);
    const lines = [];
    if(n <= 5){ for(let i = 0; i < n - 1; i++){ const row = []; for(let j = i + 1; j < n; j++) row.push(who[i] + '–' + who[j]); lines.push(who[i] + ': ' + row.join(', ') + ' (' + row.length + ')'); } }
    const sumTxt = range(1, n - 1).reverse().join(' + ');
    const steps = n <= 5 ? ['Strategy: <b>make a list</b>. Call the friends ' + who.slice(0, n).join(', ') + '. Go through them in order and never repeat a pair.'].concat(lines).concat([sumTxt + ' = <b>' + ans + '</b> handshakes. ✅'])
      : ['Strategy: <b>make a list</b> (in your head). The first friend shakes ' + (n - 1) + ' hands. The next has already shaken one, so ' + (n - 2) + ' more, and so on.', sumTxt + ' = <b>' + ans + '</b> handshakes. ✅'];
    const prompt = n + ' friends meet. Every friend shakes hands with each of the other friends once. How many handshakes are there?';
    const hint = 'Make a list. The first person shakes with everyone else. The next person only needs the people who are left, and so on.';
    const decode = function(){ const c = decodeSets(vis)[0]; let t = 0; for(let i = 0; i < c; i++) for(let j = i + 1; j < c; j++) t++; return t; };
    if(o.typed) return numeric({ prompt: prompt, visual: vis, answer: ans, hint: hint, explain: ex('Strategy: make a list', steps), truth: pairs, decode: decode, wrong: function(v){ return v === n * (n - 1) ? 'That counts every handshake twice (A shaking hands with B is the same handshake as B shaking hands with A).' : ''; } });
    return mcqNum({ prompt: prompt, visual: vis, answer: ans, count: 4, hint: hint, explain: ex('Strategy: make a list', steps), truth: pairs, decode: decode,
      wrong: [{ v: n * (n - 1), why: 'That counts every handshake twice. A shaking B is the same handshake as B shaking A.' }, { v: n, why: 'That is the number of friends. Each friend shakes several hands.' }, { v: n * (n - 1) / 2 + 1, why: 'Check your list again — you counted one too many.' }, { v: n - 1, why: 'That is how many hands ONE friend shakes. Everyone shakes hands.' }] });
  }

  function cardsQ(o){
    for(let tries = 0; tries < 60; tries++){
      const k = o.k, digs = sample(range(1, 9), k).sort(function(a, b){ return a - b; });
      const vis = '<div class="dcards" style="display:flex;gap:8px;justify-content:center">' + digs.map(function(d){ return '<span class="dc" style="min-width:44px;padding:10px;text-align:center;font:900 26px system-ui;border:3px solid ' + INK + ';border-radius:10px;background:#FFF3C4;color:' + INK + '">' + d + '</span>'; }).join('') + '</div>';
      const list = []; digs.forEach(function(a){ digs.forEach(function(b){ if(a !== b) list.push(a * 10 + b); }); });
      const ans = k * (k - 1), lines = digs.map(function(a){ return 'Starting with ' + a + ': ' + digs.filter(function(b){ return b !== a; }).map(function(b){ return a * 10 + b; }).join(', ') + ' (' + (k - 1) + ')'; });
      const prompt = 'Lucy has ' + k + ' digit cards: ' + digs.join(', ') + '. She makes 2-digit numbers using two DIFFERENT cards. How many different numbers can she make?';
      const steps = ['Strategy: <b>make a list</b>, in order. Put each card in the tens place in turn.'].concat(lines).concat([k + ' groups of ' + (k - 1) + ' = <b>' + ans + '</b> numbers. ✅']);
      const decode = function(){ const d = ((vis.match(/<span class="dc"[^>]*>(\d)<\/span>/g) || []).map(function(t){ return parseInt(/>(\d)</.exec(t)[1], 10); })); let c = 0; d.forEach(function(a, i){ d.forEach(function(b, j){ if(i !== j) c++; }); }); return c; };
      const hint = 'Make a list. Put the first card in the tens place and pair it with each other card. Then do the next card.';
      const wrong = [{ v: k, why: 'That is just the number of cards. Each card can go in the tens place with several partners.' }, { v: k * k, why: 'That lets a card pair with ITSELF (like 22). The cards must be different.' }, { v: k * (k - 1) / 2, why: '12 and 21 are different numbers, so count both.' }];
      if(o.typed) return numeric({ prompt: prompt, visual: vis, answer: ans, hint: hint, explain: ex('Strategy: make a list', steps), truth: list.length, decode: decode, wrong: function(v){ const w = wrong.filter(function(x){ return x.v === v; })[0]; return w ? w.why : ''; } });
      return mcqNum({ prompt: prompt, visual: vis, answer: ans, count: 4, wrong: wrong, hint: hint, explain: ex('Strategy: make a list', steps), truth: list.length, decode: decode });
    }
    throw new Error('cardsQ failed');
  }

  /* ------------------------------------------------------------ trial and improvement */
  function trialSumDiffQ(o){
    for(let tries = 0; tries < 100; tries++){
      const small = randInt(o.lo, o.hi), d = pick(o.diffs), big = small + d, S = small + big;
      if(small < 1) continue;
      let sols = []; for(let a = 1; a < S; a++){ const b = S - a; if(a - b === d) sols.push(a); }
      if(sols.length !== 1) continue;
      const askBig = chance(0.6), ans = askBig ? big : small, nm = sample(NAMES, 2), ctx = pick(CTX);
      const prompt = nm[0] + ' and ' + nm[1] + ' have ' + S + ' ' + ctx[0] + ' altogether. ' + nm[0] + ' has ' + d + ' more than ' + nm[1] + '. How many does ' + (askBig ? nm[0] : nm[1]) + ' have?';
      const cands = [big + 4, big + 2, big - 2, big - 1].filter(function(g){ return g >= 1 && g <= S - 1 && 2 * g - S > 0 && g !== big; }).slice(0, 2);
      const steps = ['Strategy: <b>trial and improvement</b>. Make a guess, check it, then improve it.'];
      cands.forEach(function(g){ const df = 2 * g - S; steps.push('Try ' + g + ' and ' + (S - g) + ': they add to ' + S + ' ✅ but the difference is ' + df + ' — ' + (df > d ? 'too big, so make the numbers closer together.' : 'too small, so make them further apart.')); });
      steps.push('Try <b>' + big + '</b> and <b>' + small + '</b>: they add to ' + S + ' ✅ and the difference is ' + d + ' ✅. So ' + nm[0] + ' has ' + big + ' and ' + nm[1] + ' has ' + small + '. The answer is <b>' + ans + '</b>. ✅');
      const hint = 'Guess two numbers that add to ' + S + '. Check the difference. Is it too big or too small? Change your guess.';
      const wrong = [{ v: askBig ? small : big, why: 'That is the other person’s amount. Read the question again: who is it asking about?' }, { v: Math.round(S / 2), why: 'That is half of ' + S + ' — the two would be equal. One has ' + d + ' MORE.' }, { v: askBig ? big + d : small + d, why: 'Check: the two numbers must add to ' + S + '.' }];
      if(o.typed) return numeric({ prompt: prompt, visual: '', answer: ans, hint: hint, explain: ex('Trial and improvement', steps), truth: askBig ? sols[0] : S - sols[0], wrong: function(v){ const w = wrong.filter(function(x){ return x.v === v; })[0]; return w ? w.why : ''; } });
      return mcqNum({ prompt: prompt, answer: ans, count: 4, wrong: wrong, hint: hint, explain: ex('Trial and improvement', steps), truth: askBig ? sols[0] : S - sols[0] });
    }
    throw new Error('trialSumDiffQ failed');
  }
  function trialProductQ(o){
    for(let tries = 0; tries < 100; tries++){
      const a = randInt(2, o.hi), b = randInt(a, o.hi), P = a * b, S = a + b;
      let sols = []; for(let x = 1; x <= P; x++) if(P % x === 0 && x <= P / x && x + P / x === S) sols.push(x);
      if(sols.length !== 1 || a === b) continue;
      const askBig = chance(0.5), ans = askBig ? b : a;
      const pairs = []; for(let x = 1; x <= P; x++) if(P % x === 0 && x <= P / x) pairs.push([x, P / x]);
      const steps = ['Strategy: <b>trial and improvement</b> with a list. Find pairs that multiply to ' + P + ':', pairs.map(function(p){ return p[0] + ' × ' + p[1] + ' (add to ' + (p[0] + p[1]) + ')'; }).join(', ') + '.', 'Only <b>' + a + '</b> and <b>' + b + '</b> add to ' + S + '. The ' + (askBig ? 'bigger' : 'smaller') + ' number is <b>' + ans + '</b>. ✅'];
      const prompt = 'Two numbers multiply to make ' + P + ' and add to make ' + S + '. What is the ' + (askBig ? 'bigger' : 'smaller') + ' number?';
      const hint = 'Try pairs of numbers that multiply to ' + P + '. Check which pair adds to ' + S + '.';
      const wrong = [{ v: askBig ? a : b, why: 'That is the other number. Read which one is asked.' }, { v: S - 1, why: 'The numbers must multiply to ' + P + ' as well as add to ' + S + '.' }];
      if(o.typed) return numeric({ prompt: prompt, visual: '', answer: ans, hint: hint, explain: ex('Trial and improvement', steps), truth: askBig ? P / sols[0] : sols[0], wrong: function(v){ const w = wrong.filter(function(x){ return x.v === v; })[0]; return w ? w.why : ''; } });
      return mcqNum({ prompt: prompt, answer: ans, count: 4, wrong: wrong, hint: hint, explain: ex('Trial and improvement', steps), truth: askBig ? P / sols[0] : sols[0] });
    }
    throw new Error('trialProductQ failed');
  }

  /* ------------------------------------------------------------ naming the strategies */
  const STRAT = [
    { name: 'Draw a bar model', def: 'Draw a bar split into parts to show the whole and the parts' },
    { name: 'Work backwards', def: 'Start from the answer and undo each step with the opposite operation' },
    { name: 'Make a list', def: 'Write down every possible choice in an organised way so none are missed' },
    { name: 'Trial and improvement', def: 'Try a number, check it, then change it to get closer' }
  ];
  function stratQ(forward){
    const t = pick(STRAT), others = STRAT.filter(function(s){ return s !== t; });
    if(forward){
      return mcq({
        prompt: 'Which problem-solving strategy is this? “' + t.def + '.”', correct: opt(K.text(t.name), t.name),
        distractors: others.map(function(s){ return opt(K.text(s.name), s.name, 'That strategy means: ' + s.def.toLowerCase() + '.'); }), count: 4,
        hint: 'Think about what you actually DO in the strategy: draw, undo, list or guess-and-check.',
        explain: ex('Naming the strategy', ['The sentence says: ' + t.def.toLowerCase() + '.', 'That is the strategy called <b>' + t.name + '</b>. ✅']),
        truth: K.text(STRAT.filter(function(s){ return s.def === t.def; })[0].name)
      });
    }
    return mcq({
      prompt: 'What does the strategy “' + t.name + '” mean?', correct: opt(K.text(t.def), t.def),
      distractors: others.map(function(s){ return opt(K.text(s.def), s.def, 'That describes “' + s.name + '”, a different strategy.'); }), count: 4,
      hint: 'Picture yourself using the strategy. What would you be doing?',
      explain: ex('Understanding the strategy', ['<b>' + t.name + '</b> means: ' + t.def.toLowerCase() + '.', 'The other choices describe different strategies. ✅']),
      truth: K.text(STRAT.filter(function(s){ return s.name === t.name; })[0].def)
    });
  }

  /* ------------------------------------------------------------ the skill */
  registerSkill({
    id: 'logic-strategies', strand: 'logic', name: 'Problem-solving strategies', emoji: '🧠', year: 3, order: 940, prereq: ['logic-patterns'],
    lesson: {
      title: 'Four super strategies',
      steps: [
        { say: 'Strategy 1: <b>draw a bar model</b>. Ana has 14 stickers and Leo has 9. A bar split into two parts shows 14 and 9. The whole is the parts joined: 14 + 9 = <b>23</b>.', vis: { kind: 'barModel', args: [[{ label: 'Ana', value: 14, flex: 14 }, { label: 'Leo', value: 9, flex: 9 }], '?'] } },
        { say: 'Strategy 2: <b>work backwards</b>. “I think of a number and add 7. I get 20.” Start at 20 and do the opposite: 20 − 7 = <b>13</b>.', vis: { kind: 'lgFlow', args: ['?', [{ k: 'add', n: 7 }], 20] },
          quiz: { prompt: 'I think of a number and take away 5. I get 12. What was my number?', options: [{ label: '17', ok: true }, { label: '7', ok: false }, { label: '12', ok: false }], right: 'Yes! Go backwards: the opposite of taking away is adding, 12 + 5 = 17.', wrong: 'Go backwards from 12. The opposite of taking away 5 is adding 5: 12 + 5 = 17.' } },
        { say: 'Strategy 3: <b>make a list</b>. Lucy has 3 tops and 2 pairs of shorts. Each top goes with both shorts: 2 outfits, three times. 3 × 2 = <b>6 outfits</b>.', vis: { kind: 'lgSets', args: [[{ label: 'tops', emoji: '👕', n: 3 }, { label: 'shorts', emoji: '🩳', n: 2 }]] } },
        { say: 'Strategy 4: <b>trial and improvement</b>. Two numbers add to 20 and differ by 4. Try 14 and 6: difference 8, too big. Try 12 and 8: difference 4. That works! The bar shows 12 and 8 making 20.', vis: { kind: 'barModel', args: [[{ label: 'big', value: 12, flex: 12 }, { label: 'small', value: 8, flex: 8 }], 20] },
          quiz: { prompt: 'Two numbers add to 10 and differ by 2. Which pair is right?', options: [{ label: '6 and 4', ok: true }, { label: '7 and 3', ok: false }, { label: '5 and 5', ok: false }], right: 'Yes! 6 + 4 = 10 and 6 − 4 = 2.', wrong: 'Check each pair: it must add to 10 AND differ by 2. Only 6 and 4 does both.' } }
      ]
    },
    trick: {
      title: 'Read the story, pick the tool',
      say: 'Parts and a total? <b>Draw a bar model</b>. “I think of a number…”? <b>Work backwards</b>. “How many different…?” <b>Make a list</b>. Two clues about two numbers? <b>Trial and improvement</b>. Then always check your answer.',
      vis: { kind: 'lgFlow', args: ['?', [{ k: 'mul', n: 2 }, { k: 'add', n: 3 }], 17] },
      example: '“I think of a number, double it, add 3 and get 17.” Backwards: 17 − 3 = 14, then 14 ÷ 2 = <b>7</b>.'
    },
    gen: {
      1: function(){
        const f = randInt(0, 4);
        if(f === 0) return barQ({ kinds: ['whole', 'part'], lo: 5, hi: 30, count: 3 });
        if(f === 1) return backQ({ nOps: 1, kinds: [['add', 'sub']], lo: 3, hi: 30, maxAdd: 12, count: 3 });
        if(f === 2) return comboQ({ lo: 2, hi: 4, count: 3 });
        if(f === 3) return stratQ(true);
        return trialSumDiffQ({ lo: 2, hi: 9, diffs: [2, 4], count: 3 });
      },
      2: function(){
        const f = randInt(0, 6);
        if(f === 0) return barQ({ kinds: ['three', 'part', 'whole'], lo: 8, hi: 40 });
        if(f === 1) return backQ({ nOps: 2, kinds: [['add', 'sub'], ['add', 'sub', 'mul']], lo: 3, hi: 25, maxAdd: 15, muls: [2] });
        if(f === 2) return handshakeQ({ lo: 3, hi: 5 });
        if(f === 3) return cardsQ({ k: 3 });
        if(f === 4) return trialSumDiffQ({ lo: 5, hi: 30, diffs: [2, 4, 6, 8, 10] });
        if(f === 5) return comboQ({ lo: 3, hi: 6 });
        return stratQ(false);
      },
      3: function(){
        const f = randInt(0, 6);
        if(f === 0) return barQ({ kinds: ['equal'], lo: 8, hi: 40, typed: true });
        if(f === 1) return backQ({ nOps: 2, kinds: [['mul', 'div', 'add', 'sub'], ['add', 'sub']], lo: 3, hi: 20, maxAdd: 20, muls: [2, 3, 4], typed: true });
        if(f === 2) return comboQ({ lo: 2, hi: 4, three: true, typed: true });
        if(f === 3) return handshakeQ({ lo: 6, hi: 9, typed: true });
        if(f === 4) return cardsQ({ k: 4, typed: true });
        if(f === 5) return trialProductQ({ hi: 12, typed: true });
        return trialSumDiffQ({ lo: 10, hi: 60, diffs: [4, 6, 8, 12, 14, 16], typed: true });
      }
    }
  });
})();
