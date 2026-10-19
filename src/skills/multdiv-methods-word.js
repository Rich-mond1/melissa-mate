/* multdiv-word — multiplication & division word problems: equal groups, sharing, grouping, scaling, correspondence, two-step. */
(function(){
  const NAMES = ['Ana', 'Marcus', 'Sophie', 'Ivan', 'Lucy', 'Diego', 'Ellen', 'Tom', 'Aisha', 'Kai', 'Mei', 'Leo'];
  const GROUPS = [['bags', 'sweets'], ['boxes', 'pencils'], ['plates', 'biscuits'], ['trays', 'cupcakes'], ['pots', 'crayons'], ['vases', 'flowers'], ['baskets', 'apples'], ['packs', 'stickers'], ['nests', 'eggs'], ['bowls', 'strawberries'], ['jars', 'marbles'], ['tanks', 'goldfish']];
  const SHARE = [['friends', 'sweets'], ['children', 'stickers'], ['unicorns', 'carrots'], ['dogs', 'biscuits'], ['astronauts', 'snacks'], ['ponies', 'apples'], ['players', 'oranges']];
  const PACK = [['eggs', 'boxes'], ['sweets', 'bags'], ['pencils', 'pots'], ['cupcakes', 'trays'], ['stickers', 'packs'], ['apples', 'baskets'], ['flowers', 'vases'], ['marbles', 'jars']];
  const THINGS = ['stickers', 'marbles', 'cards', 'shells', 'stars', 'books', 'pencils', 'coins'];
  const BUY = [['bags', 'sweets'], ['boxes', 'pencils'], ['packs', 'stickers'], ['trays', 'cupcakes'], ['baskets', 'apples'], ['jars', 'marbles']];

  function words(s){ return String(s).replace(/<[^>]*>/g, ' ').split(/\s+/).filter(Boolean).length; }
  function fit(fn){ let q; for(let i = 0; i < 60; i++){ q = fn(); if(words(q.prompt) <= 25) return q; } return q; }
  function addUp(v, t){ let s = 0; for(let i = 0; i < t; i++) s += v; return s; }                    // independent check for ×
  function countOut(n, d){ let c = 0, x = n; while(x > 0){ x -= d; c++; } return c; }                // independent check for ÷ (repeated subtraction)
  function S(a, op, b, why){ const v = op === '×' ? a * b : op === '÷' ? a / b : op === '+' ? a + b : a - b; return { l: a + ' ' + op + ' ' + b, v: v, why: why }; }
  function nz(v){ return v >= 1; }
  function barDecode(html){
    const parts = (html.match(/class="bpart" data-v="[^"]*"/g) || []).map(function(s){ return /data-v="([^"]*)"/.exec(s)[1]; });
    const tm = /text-align:center;font-weight:900;border:3px solid[^>]*>([^<]*)</.exec(html);
    return { parts: parts, total: tm ? tm[1] : null };
  }

  /* ---------- problem builders: every kind returns the same shape ---------- */
  function build(kind, tier){
    const nm = sample(NAMES, 3), A = nm[0], B = nm[1], C = nm[2];
    let P;
    if(kind === 'mult'){
      let g, p;
      if(tier === 1){ g = randInt(2, 4); p = pick([2, 3, 4, 5, 10]); } else { g = pick([2, 3, 4, 5, 8]); p = pick([2, 3, 4, 5, 8, 10]); }
      if(g === 2 && p === 2) p = 3;
      const pr = pick(GROUPS), cont = pr[0], thing = pr[1], ans = g * p;
      const text = chance(0.5) ? 'There are ' + g + ' ' + cont + '. Each one has ' + p + ' ' + thing + '. How many ' + thing + ' are there altogether?' : A + ' fills ' + g + ' ' + cont + ' with ' + p + ' ' + thing + ' in each. How many ' + thing + ' is that?';
      P = { kind: kind, op: 'Multiply', text: text, ans: ans, truth: addUp(p, g), g: g, p: p,
        sentOk: S(g, '×', p),
        sentBad: [S(g, '+', p, 'That adds the numbers. ' + g + ' ' + cont + ' with ' + p + ' in each are equal groups, so multiply.'), S(Math.max(g, p), '−', Math.min(g, p), 'Taking away does not fit. Equal groups are joined together, so multiply.'), S(p, '÷', g, 'Dividing is for sharing. Here we know the size of each group and want the total.'), S(g, '×', g, 'That uses ' + g + ' twice. There are ' + g + ' ' + cont + ' and ' + p + ' ' + thing + ' in each.')],
        wrongs: [{ v: g + p, why: 'You added ' + g + ' + ' + p + '. Equal groups means multiply: ' + g + ' groups of ' + p + '.' }, { v: ans - p, why: 'That is one group short. There are ' + g + ' groups of ' + p + '.' }, { v: ans + p, why: 'That is one group too many. There are only ' + g + ' groups.' }, { v: p, why: 'That is just ONE group. There are ' + g + ' groups of ' + p + '.' }],
        title: 'Equal groups', hint: 'Are the groups equal? Then you need to find the total of ALL the groups. Which operation joins equal groups?',
        why: g + ' ' + cont + ', each with ' + p + ' ' + thing + ': these are equal groups, so we multiply.',
        steps: [g + ' ' + cont + ' with ' + p + ' ' + thing + ' in each: <b>equal groups</b>, so we multiply.', g + ' × ' + p + ' = <b>' + ans + '</b> (or ' + p + ' added ' + g + ' times).', 'There are <b>' + ans + '</b> ' + thing + ' altogether. ✅'],
        vis: V.groups(g, p), visDecode: function(h){ return V.decodeGroups(h).total; },
        bar: V.barModel(new Array(g).fill(0).map(function(){ return { value: p }; }), '?'), barDecode: function(h){ const d = barDecode(h); return d.parts.length * parseInt(d.parts[0], 10); } };
    } else if(kind === 'share'){
      let g, r;
      if(tier === 1){ g = randInt(2, 4); r = randInt(2, 5); } else { do { g = pick([2, 3, 4, 5, 8, 10]); r = randInt(2, 10); } while(g * r > 60); }
      const pr = pick(SHARE), who = pr[0], thing = pr[1], n = g * r;
      const text = chance(0.5) ? n + ' ' + thing + ' are shared equally between ' + g + ' ' + who + '. How many does each one get?' : A + ' shares ' + n + ' ' + thing + ' equally between ' + g + ' ' + who + '. How many does each one get?';
      P = { kind: kind, op: 'Divide', text: text, ans: r, truth: countOut(n, g), g: g, n: n,
        sentOk: S(n, '÷', g),
        sentBad: [S(n, '×', g, 'Multiplying would make MORE than ' + n + '. Sharing makes smaller groups, so divide.'), S(n, '+', g, 'Adding makes a bigger number. Sharing equally is dividing.'), S(n, '−', g, 'Taking ' + g + ' away is not the same as sharing between ' + g + '. Sharing equally is dividing.'), S(g, '÷', n, 'The big number goes first: ' + n + ' shared between ' + g + ' is ' + n + ' ÷ ' + g + '.')],
        wrongs: [{ v: g, why: 'That is how many ' + who + ' there are. We want how many each one gets.' }, { v: n - g, why: 'You took ' + g + ' away. Sharing equally between ' + g + ' means dividing by ' + g + '.' }, { v: n + g, why: 'You added. Sharing equally is dividing.' }, { v: r + 1, why: 'Check by multiplying: ' + g + ' × ' + (r + 1) + ' = ' + g * (r + 1) + ', which is too many.' }, { v: r - 1, why: 'Check by multiplying: ' + g + ' × ' + (r - 1) + ' = ' + g * (r - 1) + ', which leaves some over.' }],
        title: 'Sharing equally', hint: 'Sharing equally into groups: is the answer bigger or smaller than the big number? Which operation makes smaller groups?',
        why: n + ' ' + thing + ' shared equally between ' + g + ' ' + who + ': sharing is dividing.',
        steps: [n + ' ' + thing + ' shared equally between ' + g + ': <b>sharing</b>, so we divide.', n + ' ÷ ' + g + ' = ? Think: ' + g + ' × ? = ' + n + '. ' + g + ' × ' + r + ' = ' + n + '.', 'Each one gets <b>' + r + '</b>. ✅'],
        vis: V.dots(n), visDecode: function(h){ return V.decodeDots(h) / g; },
        bar: V.barModel(new Array(g).fill(0).map(function(){ return { value: '?' }; }), n), barDecode: function(h){ const d = barDecode(h); return parseInt(d.total, 10) / d.parts.length; } };
    } else if(kind === 'group'){
      let p, r;
      if(tier === 1){ p = randInt(2, 5); r = randInt(2, 5); } else { do { p = pick([2, 3, 4, 5, 8, 10]); r = randInt(2, 10); } while(p * r > 60); }
      const pr = pick(PACK), thing = pr[0], cont = pr[1], n = p * r;
      const text = chance(0.5) ? n + ' ' + thing + ' go into ' + cont + ' of ' + p + '. How many ' + cont + ' are needed?' : A + ' packs ' + n + ' ' + thing + ' into ' + cont + ' of ' + p + '. How many ' + cont + ' does ' + A + ' need?';
      P = { kind: kind, op: 'Divide', text: text, ans: r, truth: countOut(n, p), p: p, n: n,
        sentOk: S(n, '÷', p),
        sentBad: [S(n, '×', p, 'Multiplying would make a much bigger number. We are splitting ' + n + ' into groups of ' + p + ': divide.'), S(n, '+', p, 'Adding makes a bigger number. Putting things into groups is dividing.'), S(n, '−', p, 'Taking ' + p + ' away once is not enough. How many groups of ' + p + ' fit in ' + n + '? Divide.'), S(p, '÷', n, 'The big number goes first: ' + n + ' ÷ ' + p + '.')],
        wrongs: [{ v: p, why: 'That is how many go in each one. We want how many ' + cont + '.' }, { v: n - p, why: 'You took ' + p + ' away once. Count how many groups of ' + p + ' fit into ' + n + ': divide.' }, { v: n + p, why: 'You added. Putting things into groups is dividing.' }, { v: r + 1, why: 'Check: ' + (r + 1) + ' × ' + p + ' = ' + (r + 1) * p + ', which is more than ' + n + '.' }, { v: r - 1, why: 'Check: ' + (r - 1) + ' × ' + p + ' = ' + (r - 1) * p + ', which is less than ' + n + '.' }],
        title: 'Making groups', hint: 'You know the size of each group and want to know HOW MANY groups. How many groups of ' + p + ' fit into the total?',
        why: n + ' ' + thing + ' put into ' + cont + ' of ' + p + ': making groups is dividing.',
        steps: [n + ' ' + thing + ' go into ' + cont + ' of ' + p + ': we are <b>making groups</b>, so we divide.', n + ' ÷ ' + p + ' = ? Think: ' + p + ' × ? = ' + n + '. ' + p + ' × ' + r + ' = ' + n + '.', 'We need <b>' + r + '</b> ' + cont + '. ✅'] };
    } else if(kind === 'scale'){
      let k, t;
      do { k = randInt(2, 10); t = pick([2, 3, 4, 5, 10]); } while(k * t > 60 || k === t);
      const thing = pick(THINGS), ans = k * t;
      P = { kind: kind, op: 'Multiply', text: A + ' has ' + k + ' ' + thing + '. ' + B + ' has ' + t + ' times as many. How many ' + thing + ' does ' + B + ' have?', ans: ans, truth: addUp(k, t), k: k, t: t,
        sentOk: S(k, '×', t),
        sentBad: [S(k, '+', t, '“' + t + ' times as many” does not mean add ' + t + '. It means ' + t + ' lots of ' + k + ': multiply.'), S(Math.max(k, t), '−', Math.min(k, t), 'Taking away would make fewer. “Times as many” makes more: multiply.'), S(k, '÷', t, 'Dividing would make fewer. “Times as many” makes MORE: multiply.'), S(t, '×', t, 'That uses ' + t + ' twice. ' + B + ' has ' + t + ' lots of ' + k + '.')],
        wrongs: [{ v: k + t, why: 'You added ' + t + '. “' + t + ' times as many” means ' + t + ' lots of ' + k + ': multiply.' }, { v: ans - k, why: 'That is one lot of ' + k + ' too few. ' + B + ' has ' + t + ' lots of ' + k + '.' }, { v: ans + k, why: 'That is one lot of ' + k + ' too many. ' + B + ' has ' + t + ' lots of ' + k + '.' }, { v: t, why: 'That is how many times. ' + B + ' has ' + t + ' lots of ' + k + '.' }],
        title: 'Times as many', hint: '“' + t + ' times as many” means ' + t + ' lots of ' + A + '’s amount. Think of ' + t + ' bars the same size.',
        why: B + ' has ' + t + ' times as many as ' + A + ': ' + t + ' lots of ' + k + '.',
        steps: [A + ' has <b>' + k + '</b>. ' + B + ' has ' + t + ' times as many, so ' + t + ' lots of ' + k + '.', t + ' × ' + k + ' = <b>' + ans + '</b> (or ' + k + ' added ' + t + ' times).', B + ' has <b>' + ans + '</b> ' + thing + '. ✅'] };
    } else if(kind === 'scaleBack'){
      let k, t;
      do { k = randInt(2, 10); t = pick([2, 3, 4, 5, 10]); } while(k * t > 60);
      const thing = pick(THINGS), n = k * t;
      P = { kind: kind, op: 'Divide', text: B + ' has ' + n + ' ' + thing + '. That is ' + t + ' times as many as ' + A + ' has. How many does ' + A + ' have?', ans: k, truth: countOut(n, t), k: k, t: t, n: n,
        sentOk: S(n, '÷', t),
        sentBad: [S(n, '×', t, 'Multiplying would make ' + A + ' have MORE than ' + B + '. ' + A + ' has fewer, so divide.'), S(n, '−', t, 'Taking away ' + t + ' is not the same as “' + t + ' times as many”. Divide.'), S(n, '+', t, 'Adding would make ' + A + ' have more than ' + B + '. Divide.'), S(t, '÷', n, 'The big number goes first: ' + n + ' ÷ ' + t + '.')],
        wrongs: [{ v: n * t, why: 'You multiplied. ' + A + ' has FEWER than ' + B + ', so divide.' }, { v: n - t, why: 'You took ' + t + ' away. “' + t + ' times as many” means ' + B + ' has ' + t + ' equal lots of ' + A + '’s amount. Divide by ' + t + '.' }, { v: t, why: 'That is how many times. We want ' + A + '’s amount: ' + n + ' ÷ ' + t + '.' }, { v: n + t, why: 'You added. ' + A + ' has fewer than ' + B + '. Divide.' }, { v: k + 1, why: 'Check: ' + t + ' × ' + (k + 1) + ' = ' + t * (k + 1) + ', not ' + n + '.' }],
        title: 'Times as many (backwards)', hint: B + ' has ' + t + ' equal lots of what ' + A + ' has. Split ' + B + '’s number into ' + t + ' equal lots.',
        why: B + ' has ' + t + ' times as many as ' + A + ': divide to go backwards.',
        steps: [B + '’s ' + n + ' is ' + t + ' equal lots of ' + A + '’s amount, so we <b>divide</b>.', n + ' ÷ ' + t + ' = ? Think: ' + t + ' × ? = ' + n + '. ' + t + ' × ' + k + ' = ' + n + '.', A + ' has <b>' + k + '</b>. ✅'] };
    } else { // corr
      const lo = tier === 3 ? 3 : 2, hi = tier === 3 ? 6 : 5;
      let a = randInt(lo, hi), b = randInt(lo, hi); if(a === b) b = b === hi ? lo : b + 1;
      const ans = a * b;
      const T = [
        A + ' has ' + a + ' T-shirts and ' + b + ' pairs of shorts. How many different outfits can ' + A + ' make?',
        A + ' has ' + a + ' hats and ' + b + ' scarves. How many ways can ' + A + ' wear one hat and one scarf?',
        'An ice cream van has ' + a + ' flavours and ' + b + ' toppings. How many different ice creams have one flavour and one topping?',
        'A café has ' + a + ' kinds of bread and ' + b + ' fillings. How many different sandwiches can you make?',
        'A pizza shop has ' + a + ' crusts and ' + b + ' toppings. How many different pizzas have one crust and one topping?'
      ];
      let count = 0; for(let i = 0; i < a; i++) for(let j = 0; j < b; j++) count++;
      P = { kind: kind, op: 'Multiply', text: pick(T), ans: ans, truth: count, a: a, b: b,
        sentOk: S(a, '×', b),
        sentBad: [S(a, '+', b, 'Adding only counts the items. Each one can go with EVERY one of the others, so multiply.'), S(Math.max(a, b), '−', Math.min(a, b), 'Taking away does not fit. We are putting things together in pairs: multiply.'), S(a, '×', a, 'That uses ' + a + ' twice. Multiply the two different numbers: ' + a + ' and ' + b + '.'), S(b, '×', b, 'That uses ' + b + ' twice. Multiply the two different numbers: ' + a + ' and ' + b + '.')],
        wrongs: [{ v: a + b, why: 'You added. Each of the ' + a + ' can go with EVERY one of the ' + b + ', so multiply.' }, { v: ans - a, why: 'That misses one whole set. Each of the ' + a + ' goes with ' + b + ' others: ' + a + ' × ' + b + '.' }, { v: ans + a, why: 'That is too many. Each of the ' + a + ' goes with ' + b + ' others: ' + a + ' × ' + b + '.' }, { v: a * (b - 1), why: 'You missed one of the ' + b + '. Every one of them can be used.' }, { v: Math.max(a, b), why: 'That is just one of the numbers. Count every pair.' }],
        title: 'Every pair', hint: 'Pick the first item. How many choices go with it? Then do the same for each of the others.',
        why: 'each of the ' + a + ' goes with each of the ' + b + ': we multiply.',
        steps: ['The first one can go with <b>' + b + '</b> different partners. There are <b>' + a + '</b> first ones.', a + ' groups of ' + b + ' is ' + a + ' × ' + b + ' = <b>' + ans + '</b>. (Draw an array: ' + a + ' rows, ' + b + ' columns!)', 'There are <b>' + ans + '</b> different pairs. ✅'] };
    }
    P.A = A; P.B = B; P.C = C;
    return P;
  }

  /* ---------- question formats built from a problem ---------- */
  function solveQ(P, opts){
    opts = opts || {};
    const q = mcqNum({
      prompt: P.text, visual: opts.visual || '', answer: P.ans, wrong: P.wrongs, valid: nz,
      hint: P.hint, explain: ex(P.title, P.steps), truth: P.truth, decode: opts.decode, count: opts.count
    });
    return q;
  }
  function sentenceQ(P, count){
    const ok = P.sentOk, bad = P.sentBad.filter(function(b){ return b.v !== P.ans && b.l !== ok.l; });
    const shown = [ok].concat(bad);
    const good = shown.filter(function(x){ return x.v === P.ans; });
    return mcq({
      prompt: P.text + ' Which number sentence solves it?',
      correct: opt(K.text(ok.l), ok.l), distractors: bad.map(function(b){ return opt(K.text(b.l), b.l, b.why); }), keepOrder: true, count: count,
      hint: P.hint,
      explain: ex('Choosing the number sentence', ['<b>' + P.why + '</b>', 'So the number sentence is <b>' + ok.l + '</b>.', ok.l + ' = <b>' + P.ans + '</b>. ✅']),
      truth: K.text(good.length === 1 ? good[0].l : 'bad')
    });
  }
  function opQ(P){
    const other = P.op === 'Multiply' ? 'Divide' : 'Multiply';
    return mcq2({
      prompt: P.text + ' Do you multiply or divide?',
      correct: opt(K.text(P.op), P.op), other: opt(K.text(other), other, other === 'Divide' ? 'Dividing would make the answer smaller. Here we are joining equal groups or finding “times as many”, so the answer gets bigger: multiply.' : 'Multiplying would make the answer bigger. Here we are sharing or making groups, so the answer gets smaller: divide.'),
      hint: P.hint,
      explain: ex('Multiply or divide?', ['<b>' + P.why + '</b>', 'So the right choice is <b>' + P.op + '</b>.', 'Working it out gives ' + P.ans + '. ✅']),
      truth: K.text(P.kind === 'mult' || P.kind === 'scale' || P.kind === 'corr' ? 'Multiply' : 'Divide')
    });
  }
  function checkQ(P){
    const right = chance(0.5), others = P.wrongs.filter(function(w){ return w.v !== P.ans && w.v >= 1; });
    const claim = right ? P.ans : pick(others).v, yes = 'Yes', no = 'No';
    const w = P.wrongs.filter(function(x){ return x.v === claim; })[0];
    return mcq2({
      prompt: P.text + ' ' + P.C + ' says ' + claim + '. Is that right?',
      correct: opt(K.bool(right), right ? yes : no), other: opt(K.bool(!right), right ? no : yes, right ? 'Work it out again: ' + P.steps[1].replace(/<[^>]*>/g, '') + ' So ' + P.C + ' is right.' : (w ? w.why : 'Work it out again.')),
      hint: 'Work the problem out yourself first, then compare with ' + P.C + '’s answer.',
      explain: ex('Checking an answer', [P.steps[0], P.steps[1], 'The answer is ' + P.ans + ', so the answer to “Is that right?” is <b>' + (right ? yes : no) + '</b>. ✅']),
      truth: K.bool(claim === P.truth)
    });
  }

  /* ---------- tier 3 two-step problems (typed) ---------- */
  function twoStep(){
    const nm = sample(NAMES, 3), A = nm[0], B = nm[1], k = randInt(1, 6);
    if(k === 1){ // groups, then some taken away
      const pr = pick(BUY), cont = pr[0], thing = pr[1], g = randInt(2, 5), p = pick([2, 3, 4, 5, 8]), tot = g * p, e = randInt(2, Math.min(9, tot - 1)), ans = tot - e;
      return numeric({
        prompt: A + ' buys ' + g + ' ' + cont + ' of ' + p + ' ' + thing + '. ' + A + ' gives away ' + e + '. How many ' + thing + ' are left?', answer: ans,
        hint: 'Step 1: how many ' + thing + ' in all? Step 2: take away the ones given away.',
        explain: ex('Two steps', ['Step 1: ' + g + ' × ' + p + ' = <b>' + tot + '</b> ' + thing + '.', 'Step 2: ' + tot + ' − ' + e + ' = <b>' + ans + '</b>.', A + ' has <b>' + ans + '</b> left. ✅']),
        truth: addUp(p, g) - e,
        wrong: function(v){ return v === tot ? 'That is how many ' + A + ' bought. Now take away the ' + e + ' given away.' : (v === g + p - e ? 'You added ' + g + ' + ' + p + ' for the first step. Multiply: ' + g + ' × ' + p + '.' : (v === tot + e ? 'You added ' + e + '. “Gives away” means take away.' : '')); }
      });
    }
    if(k === 2){ // groups plus extras
      const pr = pick(BUY), cont = pr[0], thing = pr[1], g = randInt(2, 5), p = pick([2, 3, 4, 5, 8]), x = randInt(2, 9), tot = g * p, ans = tot + x;
      return numeric({
        prompt: A + ' has ' + g + ' ' + cont + ' of ' + p + ' ' + thing + ' and ' + x + ' more ' + thing + '. How many ' + thing + ' altogether?', answer: ans,
        hint: 'Step 1: find the total in the ' + cont + '. Step 2: add the extra ones.',
        explain: ex('Two steps', ['Step 1: ' + g + ' × ' + p + ' = <b>' + tot + '</b>.', 'Step 2: ' + tot + ' + ' + x + ' = <b>' + ans + '</b>.', A + ' has <b>' + ans + '</b> ' + thing + ' altogether. ✅']),
        truth: addUp(p, g) + x,
        wrong: function(v){ return v === tot ? 'That leaves out the ' + x + ' extra ones. Add them on.' : (v === g + p + x ? 'You added all three numbers. First multiply ' + g + ' × ' + p + ', then add ' + x + '.' : (v === p * (g + x) ? 'The ' + x + ' extra are single ones, not whole ' + cont + '. Add ' + x + ' at the end.' : '')); }
      });
    }
    if(k === 3){ // share then add
      const pr = pick(SHARE), who = pr[0], thing = pr[1], g = pick([2, 3, 4, 5]), r = randInt(2, 8), n = g * r, c = randInt(2, 6), ans = r + c;
      return numeric({
        prompt: n + ' ' + thing + ' are shared equally between ' + g + ' ' + who + '. Each one already had ' + c + '. How many does each one have now?', answer: ans,
        hint: 'Step 1: share equally (divide). Step 2: add what each one already had.',
        explain: ex('Two steps', ['Step 1: ' + n + ' ÷ ' + g + ' = <b>' + r + '</b> each.', 'Step 2: ' + r + ' + ' + c + ' = <b>' + ans + '</b>.', 'Each one now has <b>' + ans + '</b>. ✅']),
        truth: countOut(n, g) + c,
        wrong: function(v){ return v === r ? 'That is what each one is GIVEN. They already had ' + c + ' too, so add it.' : (v === n + c ? 'You did not share first. Divide ' + n + ' by ' + g + ' before adding.' : (v === n / g * c ? 'Add the ' + c + ' they already had; do not multiply.' : '')); }
      });
    }
    if(k === 4){ // money
      const price = pick([3, 4, 5, 8]), q = randInt(3, 9), pay = price * q < 50 ? pick([50, 100]) : 100;
      if(price * q >= pay) return twoStep();
      const item = pick(['sweet', 'sticker', 'pencil', 'balloon']), cost = price * q, ans = pay - cost;
      return numeric({
        prompt: 'A ' + item + ' costs ' + price + 'p. ' + A + ' buys ' + q + ' and pays with ' + (pay === 50 ? 'a 50p coin' : 'a £1 coin') + '. How many pence change does ' + A + ' get?', answer: ans, unit: 'p',
        hint: 'Step 1: find the cost of all of them (multiply). Step 2: take it away from ' + pay + 'p.',
        explain: ex('Two steps', ['Step 1: ' + q + ' × ' + price + 'p = <b>' + cost + 'p</b>.', 'Step 2: ' + pay + 'p − ' + cost + 'p = <b>' + ans + 'p</b>.', A + ' gets <b>' + ans + 'p</b> change. ✅']),
        truth: pay - addUp(price, q),
        wrong: function(v){ return v === cost ? 'That is how much ' + A + ' spends. The change is what is left from ' + pay + 'p.' : (v === pay - price ? 'That is the change for just ONE. ' + A + ' buys ' + q + '.' : (v === pay + cost ? 'You added. Change is what is left over, so subtract.' : '')); }
      });
    }
    if(k === 5){ // times as many, then combine
      let kk, t; do { kk = randInt(2, 8); t = pick([2, 3, 4, 5]); } while(kk * (t + 1) > 60);
      const thing = pick(THINGS), more = chance(0.5), ans = more ? kk * (t - 1) : kk * (t + 1);
      return numeric({
        prompt: A + ' has ' + kk + ' ' + thing + '. ' + B + ' has ' + t + ' times as many. ' + (more ? 'How many more does ' + B + ' have than ' + A + '?' : 'How many do they have altogether?'), answer: ans,
        hint: 'Step 1: how many does ' + B + ' have? (' + t + ' times as many). Step 2: ' + (more ? 'find the difference.' : 'add the two amounts.'),
        explain: ex('Two steps', ['Step 1: ' + B + ' has ' + t + ' × ' + kk + ' = <b>' + t * kk + '</b>.', more ? 'Step 2: ' + t * kk + ' − ' + kk + ' = <b>' + ans + '</b>.' : 'Step 2: ' + kk + ' + ' + t * kk + ' = <b>' + ans + '</b>.', more ? B + ' has <b>' + ans + '</b> more. ✅' : 'Together they have <b>' + ans + '</b>. ✅']),
        truth: more ? addUp(kk, t) - kk : kk + addUp(kk, t),
        wrong: function(v){ return v === t * kk ? 'That is only ' + B + '’s ' + thing + '. ' + (more ? 'Take away ' + A + '’s ' + kk + '.' : 'Add ' + A + '’s ' + kk + ' as well.') : (v === kk + t ? 'You added ' + t + '. “' + t + ' times as many” means multiply.' : ''); }
      });
    }
    // k === 6: boxes with rows
    const r = randInt(2, 4), c = randInt(2, 5), b = randInt(2, 4), per = r * c, ans = per * b;
    return numeric({
      prompt: 'A box of chocolates has ' + r + ' rows of ' + c + '. ' + A + ' buys ' + b + ' boxes. How many chocolates is that?', answer: ans,
      hint: 'Step 1: how many chocolates in ONE box (an array: rows × in each row)? Step 2: how many boxes?',
      explain: ex('Two steps', ['Step 1: one box has ' + r + ' × ' + c + ' = <b>' + per + '</b> chocolates.', 'Step 2: ' + b + ' boxes: ' + b + ' × ' + per + ' = <b>' + ans + '</b>.', A + ' has <b>' + ans + '</b> chocolates. ✅']),
      truth: addUp(addUp(c, r), b),
      wrong: function(v){ return v === per ? 'That is one box. ' + A + ' buys ' + b + ' boxes.' : (v === r + c + b ? 'You added. Multiply: rows × in each row, then × boxes.' : (v === per + b ? 'You added ' + b + '. ' + b + ' boxes means ' + b + ' lots of ' + per + '.' : '')); }
    });
  }

  /* ---------- tier 3 story matching ---------- */
  function storyQ(){
    const nm = sample(NAMES, 2), A = nm[0], B = nm[1], thing = pick(['sweets', 'stickers', 'marbles', 'pencils']), cont = pick(['bags', 'boxes', 'pots']);
    if(chance(0.5)){ // which story is n ÷ g ?
      const g = pick([2, 3, 4, 5]), r = randInt(3, 9), n = g * r;
      const stories = [
        { l: A + ' shares ' + n + ' ' + thing + ' equally between ' + g + ' friends.', op: '÷', a: n, b: g, why: '' },
        { l: A + ' has ' + g + ' ' + cont + ' with ' + n + ' ' + thing + ' in each.', op: '×', a: g, b: n, why: 'That story is about equal groups and finding a total: g × n, not ' + n + ' ÷ ' + g + '.' },
        { l: A + ' has ' + n + ' ' + thing + ' and gets ' + g + ' more.', op: '+', a: n, b: g, why: 'Getting more is adding, not dividing.' },
        { l: A + ' has ' + n + ' ' + thing + ' and loses ' + g + '.', op: '−', a: n, b: g, why: 'Losing some is taking away, not dividing.' }
      ];
      stories[1].why = 'That story is about equal groups and finding a total: ' + g + ' × ' + n + ', not ' + n + ' ÷ ' + g + '.';
      const good = stories.filter(function(s){ return s.op === '÷' && s.a === n && s.b === g; });
      const label = n + ' ÷ ' + g;
      return mcq({
        prompt: 'Which story can be solved with ' + label + '?',
        correct: opt(K.text(stories[0].l), stories[0].l), distractors: stories.slice(1).map(function(s){ return opt(K.text(s.l), s.l, s.why); }), keepOrder: true, count: 4,
        hint: label + ' means splitting ' + n + ' into ' + g + ' equal parts. Which story is about sharing equally?',
        explain: ex('Matching a story', [label + ' means sharing ' + n + ' equally between ' + g + '.', '“<b>' + stories[0].l.replace(/\.$/, '') + '</b>” is a sharing story, and ' + label + ' = ' + r + '.', 'The other stories add, take away or find a total. ✅']),
        truth: K.text(good.length === 1 ? good[0].l : 'bad')
      });
    }
    const g = pick([2, 3, 4, 5, 6]), p = pick([3, 4, 5, 8]), tot = g * p;
    const stories = [
      { l: A + ' has ' + g + ' ' + cont + ' with ' + p + ' ' + thing + ' in each.', op: '×', a: g, b: p, why: '' },
      { l: A + ' shares ' + p + ' ' + thing + ' equally between ' + g + ' friends.', op: '÷', a: p, b: g, why: 'Sharing is dividing, not multiplying: ' + p + ' ÷ ' + g + '.' },
      { l: A + ' has ' + g + ' ' + thing + ' and gets ' + p + ' more.', op: '+', a: g, b: p, why: 'Getting more is adding: ' + g + ' + ' + p + '.' },
      { l: A + ' has ' + p + ' ' + thing + ' and gives away ' + g + '.', op: '−', a: p, b: g, why: 'Giving away is taking away: ' + p + ' − ' + g + '.' }
    ];
    const good = stories.filter(function(s){ return s.op === '×' && s.a === g && s.b === p; });
    const label = g + ' × ' + p;
    return mcq({
      prompt: 'Which story can be solved with ' + label + '?',
      correct: opt(K.text(stories[0].l), stories[0].l), distractors: stories.slice(1).map(function(s){ return opt(K.text(s.l), s.l, s.why); }), keepOrder: true, count: 4,
      hint: label + ' means ' + g + ' groups of ' + p + '. Which story has equal groups?',
      explain: ex('Matching a story', [label + ' means ' + g + ' groups of ' + p + '.', '“<b>' + stories[0].l.replace(/\.$/, '') + '</b>” is an equal groups story, and ' + label + ' = ' + tot + '.', 'The other stories divide, add or take away. ✅']),
      truth: K.text(good.length === 1 ? good[0].l : 'bad')
    });
  }

  registerSkill({
    id: 'multdiv-word', strand: 'multdiv', name: 'Multiplying & dividing stories', emoji: '📖', year: 3, order: 390, prereq: ['multdiv-arrays-groups'],
    lesson: {
      title: 'Which operation? Read, picture, choose',
      steps: [
        { say: 'Some stories are about <b>equal groups</b>. “<b>4 bags</b> with <b>5 sweets</b> in each bag.” We want the total, so we <b>multiply</b>: 4 × 5 = <b>20</b> sweets.', vis: { kind: 'groups', args: [4, 5] },
          quiz: { prompt: '6 boxes have 3 pencils in each box. How many pencils altogether?', options: [{ label: '9', ok: false }, { label: '18', ok: true }, { label: '2', ok: false }], right: 'Yes! Equal groups: 6 × 3 = 18.', wrong: '6 boxes of 3 is equal groups, so multiply: 6 × 3 = 18. (Not 6 + 3.)' } },
        { say: '“<b>12 sweets</b> are <b>shared equally</b> between <b>3 friends</b>.” Deal them out one at a time. Everyone gets <b>4</b>. Sharing is <b>dividing</b>: 12 ÷ 3 = <b>4</b>.', vis: { kind: 'dots', args: [12] },
          quiz: { prompt: '20 stickers are shared equally between 4 friends. How many does each friend get?', options: [{ label: '24', ok: false }, { label: '16', ok: false }, { label: '5', ok: true }], right: 'Yes! 20 ÷ 4 = 5, because 4 × 5 = 20.', wrong: 'Sharing makes smaller groups, so divide: 20 ÷ 4 = 5.' } },
        { say: '“<b>12 sweets</b> go into <b>bags of 3</b>. How many bags?” Now we know the size of each group, and we count the groups. It is <b>dividing</b> again: 12 ÷ 3 = <b>4</b> bags.', vis: { kind: 'groups', args: [4, 3] },
          quiz: { prompt: '15 eggs go into boxes of 5. How many boxes are needed?', options: [{ label: '3', ok: true }, { label: '10', ok: false }, { label: '75', ok: false }], right: 'Yes! 15 ÷ 5 = 3 boxes.', wrong: 'How many groups of 5 fit into 15? 15 ÷ 5 = 3.' } },
        { say: '“Mei has <b>5</b> stickers. Leo has <b>3 times as many</b>.” Draw 3 bars the same size as Mei’s. Leo has <b>3 × 5 = 15</b>. It does <b>not</b> mean 5 + 3!', vis: { kind: 'barModel', args: [[{ value: 5 }, { value: 5 }, { value: 5 }], 'Leo: ?'] },
          quiz: { prompt: 'Kai has 4 marbles. Zoe has 2 times as many. How many has Zoe?', options: [{ label: '6', ok: false }, { label: '8', ok: true }, { label: '2', ok: false }], right: 'Yes! 2 lots of 4 is 2 × 4 = 8.', wrong: '“2 times as many” means 2 lots of 4: 2 × 4 = 8 (not 4 + 2).' } },
        { say: '“Ana has <b>2</b> T-shirts and <b>3</b> pairs of shorts. How many <b>outfits</b>?” Every T-shirt goes with every pair of shorts. An <b>array</b> shows it: 2 × 3 = <b>6</b>.', vis: { kind: 'array', args: [2, 3] },
          quiz: { prompt: '3 hats and 4 scarves. How many different ways to wear one hat and one scarf?', options: [{ label: '7', ok: false }, { label: '12', ok: true }, { label: '34', ok: false }], right: 'Yes! 3 × 4 = 12.', wrong: 'Every hat goes with every scarf: 3 rows of 4. 3 × 4 = 12 (not 3 + 4).' } },
        { say: 'Some stories have <b>two steps</b>. “3 bags with 4 sweets in each. Tom eats 2.” <b>Step 1:</b> 3 × 4 = 12. <b>Step 2:</b> 12 − 2 = <b>10</b>.', vis: { kind: 'barModel', args: [[{ value: 4 }, { value: 4 }, { value: 4 }], '12'] },
          quiz: { prompt: '3 bags with 4 sweets in each. Tom eats 2 sweets. How many are left?', options: [{ label: '14', ok: false }, { label: '12', ok: false }, { label: '10', ok: true }], right: 'Yes! 12 − 2 = 10.', wrong: 'Step 1: 3 × 4 = 12. Step 2: eating means take away, 12 − 2 = 10.' } }
      ]
    },
    trick: {
      title: 'Name the story, then choose',
      say: 'Ask: <b>what is happening?</b> Equal groups or “times as many”: <b>multiply</b>. Sharing, or putting into groups of: <b>divide</b>. Every one goes with every one: <b>multiply</b>. Then check: does the answer make sense? Sharing makes it <b>smaller</b>.',
      vis: { kind: 'groups', args: [3, 5] },
      example: '“24 sweets shared between 4 friends” → sharing → <b>24 ÷ 4 = 6</b>. Check: 4 × 6 = 24 ✅'
    },
    gen: {
      1: function(){
        return fit(function(){
          const f = randInt(1, 6);
          if(f === 1){ const P = build('mult', 1); return solveQ(P, { visual: P.vis, decode: function(){ return P.visDecode(P.vis); } }); }
          if(f === 2){ const P = build('share', 1); return solveQ(P, { visual: P.vis, decode: function(){ return P.visDecode(P.vis); } }); }
          if(f === 3){ return sentenceQ(build(pick(['mult', 'share', 'group']), 1), 3); }
          if(f === 4){ return opQ(build(pick(['mult', 'share', 'group']), 1)); }
          if(f === 5){ const P = build('mult', 1); return solveQ(P, { visual: P.bar, decode: function(){ return P.barDecode(P.bar); } }); }
          const P = build('share', 1); return solveQ(P, { visual: P.bar, decode: function(){ return P.barDecode(P.bar); } });
        });
      },
      2: function(){
        return fit(function(){
          const f = randInt(1, 6), kinds = ['mult', 'share', 'group', 'scale', 'corr', 'scaleBack'];
          if(f === 1 || f === 2) return solveQ(build(pick(kinds), 2));
          if(f === 3) return sentenceQ(build(pick(kinds), 2), 4);
          if(f === 4) return opQ(build(pick(kinds), 2));
          if(f === 5) return checkQ(build(pick(kinds), 2));
          return solveQ(build(pick(['mult', 'share', 'group', 'scale', 'corr']), 2));
        });
      },
      3: function(){
        return fit(function(){
          const f = randInt(1, 6);
          if(f === 1 || f === 2) return twoStep();
          if(f === 3){
            const P = build('scaleBack', 3);
            return numeric({ prompt: P.text, answer: P.ans, hint: P.hint, explain: ex(P.title, P.steps), truth: P.truth,
              wrong: function(v){ const w = P.wrongs.filter(function(x){ return x.v === v; })[0]; return w ? w.why : ''; } });
          }
          if(f === 4){
            const P = build('corr', 3);
            return numeric({ prompt: P.text, answer: P.ans, hint: P.hint, explain: ex(P.title, P.steps), truth: P.truth,
              wrong: function(v){ const w = P.wrongs.filter(function(x){ return x.v === v; })[0]; return w ? w.why : ''; } });
          }
          if(f === 5) return storyQ();
          const P = build(pick(['share', 'group', 'mult']), 3);
          return numeric({ prompt: P.text, answer: P.ans, hint: P.hint, explain: ex(P.title, P.steps), truth: P.truth,
            wrong: function(v){ const w = P.wrongs.filter(function(x){ return x.v === v; })[0]; return w ? w.why : ''; } });
        });
      }
    }
  });
})();
