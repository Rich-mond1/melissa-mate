/* multdiv-3 — Year 3: the 3 times table (double plus one more group; digit check). */
(function(){
  /* ---- shared helpers: this block is repeated in every multdiv-tables file so each file stays self-contained ---- */
  const LOOK = [];                                   // times-table lookup built by REPEATED ADDITION (the answer source)
  for(let i = 0; i <= 12; i++){ LOOK[i] = [0]; for(let j = 1; j <= 12; j++) LOOK[i][j] = LOOK[i][j - 1] + i; }
  function P(a, b){ return LOOK[a][b]; }
  const NAMES = ['Ana', 'Marcus', 'Sophie', 'Ivan', 'Lucy', 'Diego', 'Ellen', 'Tom', 'Aisha', 'Kai', 'Mei', 'Leo'];
  const THINGS = [['bags', 'apples'], ['boxes', 'crayons'], ['plates', 'biscuits'], ['trays', 'cupcakes'], ['shelves', 'books'], ['tanks', 'fish'],
    ['pots', 'pencils'], ['packs', 'stickers'], ['jars', 'marbles'], ['baskets', 'strawberries'], ['stables', 'unicorns'], ['rockets', 'astronauts']];
  const SHARE_ITEMS = ['stickers', 'marbles', 'beads', 'grapes', 'sweets', 'stars'];
  function pos(v){ return v > 0; }
  function digitSum(n){ return String(n).split('').reduce(function(s, d){ return s + Number(d); }, 0); }
  function skipHTML(t, k){ const out = []; for(let i = 1; i <= k; i++) out.push(i === k ? '<b>' + LOOK[t][i] + '</b>' : String(LOOK[t][i])); return out.join(', '); }
  function pairOrder(t, n){ return chance(0.5) ? [t, n] : [n, t]; }
  function range(r){ return randInt(r[0], r[1]); }
  function eqn(a, b, c){ return a + ' × ' + b + ' = ' + c; }
  function seqBox(inner){ return '<div style="font:800 24px/1.4 system-ui;text-align:center;color:var(--vis-ink,#1B1B2F);letter-spacing:1px">' + inner + '</div>'; }
  const CONF = { '7,8': [54, '54 is 6 × 9. Remember the pattern 5, 6, 7, 8: that is 56 = 7 × 8.'], '6,9': [56, '56 is 7 × 8. Do not swap them over: 6 × 9 is a different fact.'] };

  /* typical wrong answers for "a groups of b" (a × b) */
  function factWrongs(a, b){
    const p = P(a, b), w = [];
    const cf = CONF[Math.min(a, b) + ',' + Math.max(a, b)];
    if(cf) w.push({ v: cf[0], why: cf[1] });
    const w2 = [
      { v: a + b, why: 'You added ' + a + ' + ' + b + '. Multiplying means ' + a + ' groups of ' + b + ', so you keep adding the group again and again.' },
      { v: p + b, why: 'That is ' + (a + 1) + ' × ' + b + ': one group too many. You need exactly ' + a + ' groups of ' + b + '.' },
      { v: p - b, why: 'That is ' + (a - 1) + ' × ' + b + ': one group too few. You need ' + a + ' groups of ' + b + '.' },
      { v: p + a, why: 'That is ' + a + ' × ' + (b + 1) + ': you went one step too far when counting on.' },
      { v: p - a, why: 'That is ' + a + ' × ' + (b - 1) + ': you stopped one step too soon when counting on.' }
    ];
    return w.concat(chance(0.5) ? shuffle(w2) : [w2[0]].concat(shuffle(w2.slice(1))));
  }
  function factExplain(cfg, a, b, t, n){
    const p = P(a, b), st = [];
    if(a === t && b === n && a !== b) st.push('Swap the numbers: <b>' + b + ' × ' + a + '</b> has the same answer as ' + a + ' × ' + b + '. So count in <b>' + t + 's</b>, ' + n + ' times: ' + skipHTML(t, n) + '.');
    else st.push('Count in <b>' + t + 's</b>, ' + n + ' times: ' + skipHTML(t, n) + '.');
    const tr = cfg.step ? cfg.step(t, n) : '';
    if(tr) st.push(tr);
    st.push('So ' + a + ' × ' + b + ' = <b>' + p + '</b>. ✅');
    return ex('Working out ' + a + ' × ' + b, st);
  }
  function factHint(cfg, t, n){ return 'Count in ' + t + 's, ' + n + ' times, and keep track on your fingers.' + (cfg.hintTip ? ' ' + cfg.hintTip : ''); }

  /* ---------- TIER 1 formats: pictures where the answer can be counted ---------- */
  function qArray(cfg){
    const t = pick(cfg.tables), n = range(cfg.n1), rowsAreN = t > 8 ? true : chance(0.5);
    const r = rowsAreN ? n : t, c = rowsAreN ? t : n, p = P(r, c), vis = V.array(r, c);
    const variant = randInt(0, 2);
    const prompt = variant === 0 ? 'How many dots are in this array?' : variant === 1 ? 'This array has ' + r + ' rows. How many dots are there altogether?' : 'Count the dots in the array. Try skip counting!';
    return mcqNum({
      prompt: prompt, visual: vis, answer: p, wrong: factWrongs(r, c), nearby: [1, -1, 2, -2, 10, -10], valid: pos, count: 3,
      hint: 'Count the dots in ONE row. Then count on in that number for each row going down.',
      explain: ex('Counting an array', ['The array has <b>' + r + ' rows</b> and each row has <b>' + c + ' dots</b>.', 'Count in ' + c + 's, once for each row: ' + skipHTML(c, r) + '.', 'So ' + r + ' × ' + c + ' = <b>' + p + '</b> dots altogether. ✅']),
      truth: r * c, decode: function(){ return V.decodeArray(vis).total; }
    });
  }
  function qGroups(cfg){
    const t = pick(cfg.tables), n = range(cfg.n1), p = P(n, t), vis = V.groups(n, t);
    const th = pick(THINGS);
    return mcqNum({
      prompt: chance(0.5) ? 'There are ' + n + ' groups with ' + t + ' dots in each group. How many dots altogether?' : 'How many dots are there in all ' + n + ' groups?', visual: vis, answer: p,
      wrong: factWrongs(n, t), nearby: [1, -1, 2, -2, 10, -10], valid: pos, count: 3,
      hint: 'Count the dots in one group. Then count on in that number for each group.',
      explain: ex('Equal groups', ['There are <b>' + n + ' groups</b> and each group has <b>' + t + ' dots</b>.', 'Count in ' + t + 's, ' + n + ' times: ' + skipHTML(t, n) + '.', 'So ' + n + ' × ' + t + ' = <b>' + p + '</b> dots. ✅']),
      truth: n * t, decode: function(){ return V.decodeGroups(vis).total; }
    });
  }
  function qLine(cfg){
    const t = pick(cfg.tables), k = randInt(2, 6), N = Math.min(8, k + randInt(1, 2)), m = P(t, k);
    const vis = V.numberLine({ min: 0, max: P(t, N), minor: t, major: t, marks: [{ value: m, kind: 'q' }], labels: function(v){ return v === m ? '' : v; } });
    return mcqNum({
      prompt: 'Count in ' + t + 's from 0. What number is the red ? on the number line?', visual: vis, answer: m,
      wrong: [{ v: m - t + 1, why: 'You counted on by 1. Every jump on this line is ' + t + '.' }, { v: m + t, why: 'That is one jump too far.' }, { v: m - t, why: 'That is one jump too few.' }, { v: k + t, why: 'You added ' + k + ' + ' + t + '. Count the jumps in ' + t + 's instead.' }],
      nearby: [1, -1, 2, -2], valid: pos, count: 3,
      hint: 'Start at 0 and count the jumps: each one adds ' + t + '. How many jumps to reach the ?',
      explain: ex('Counting in ' + t + 's', ['Each jump on the line is <b>' + t + '</b>.', 'Count the jumps: ' + skipHTML(t, k) + '.', 'The ? is at <b>' + m + '</b> after ' + k + ' jumps. ✅']),
      truth: t * k, decode: function(){ return Math.round(V.decodeNumberLine(vis)); }
    });
  }
  /* "Which number sentence matches the array?" (tier 1-2): options are statements, only ONE ordering ever shown */
  function qArrayStmt(cfg){
    let t, n, r, c;
    do { t = pick(cfg.tables); n = range(cfg.n1); const rowsAreN = t > 8 ? true : chance(0.5); r = rowsAreN ? n : t; c = rowsAreN ? t : n; } while(r + c === P(r, c));
    const p = P(r, c), vis = V.array(r, c);
    const good = eqn(r, c, p);
    const ds = [
      { l: r + ' + ' + c + ' = ' + (r + c), why: 'That adds the rows and the dots in a row. An array is multiplying: ' + r + ' rows of ' + c + '.' },
      { l: eqn(r, c, p + c), why: 'Count again: ' + r + ' × ' + c + ' is not ' + (p + c) + '. That is one row too many.' },
      { l: eqn(r, c, p - c), why: 'Count again: ' + r + ' × ' + c + ' is not ' + (p - c) + '. That is one row too few.' },
      { l: eqn(r, c, p + r), why: 'Count again: the array has ' + p + ' dots, not ' + (p + r) + '.' },
      { l: eqn(r, c, p - r), why: 'Count again: the array has ' + p + ' dots, not ' + (p - r) + '.' }
    ].filter(function(d){ return d.l !== good; }).map(function(d){ return opt(K.text(d.l), d.l, d.why); });
    return mcq({
      prompt: 'Which number sentence matches this array?', visual: vis, correct: opt(K.text(good), good), distractors: ds, keepOrder: true, count: 3,
      hint: 'Count the rows, then the dots in one row. The sentence says rows × dots in a row = total.',
      explain: ex('Matching the array', ['Count the rows: <b>' + r + '</b>. Count the dots in each row: <b>' + c + '</b>.', 'Count in ' + c + 's, ' + r + ' times: ' + skipHTML(c, r) + '.', 'The number sentence is <b>' + good + '</b>. ✅']),
      truth: K.text(r + ' × ' + c + ' = ' + r * c),
      decode: function(){ const d = V.decodeArray(vis); return K.text(d.rows + ' × ' + d.cols + ' = ' + d.total); }
    });
  }

  /* ---------- TIER 2 formats: recall with misconception options ---------- */
  function qRecall(cfg, rg, count){
    const t = pick(cfg.tables), n = range(rg), o = pairOrder(t, n), a = o[0], b = o[1], p = P(a, b);
    return mcqNum({
      prompt: 'What is ' + a + ' × ' + b + '?', answer: p, wrong: factWrongs(a, b), nearby: [1, -1, 2, -2, 10, -10], valid: pos, count: count || 4,
      hint: factHint(cfg, t, n), explain: factExplain(cfg, a, b, t, n), truth: a * b
    });
  }
  function qWord(cfg, rg){
    const t = pick(cfg.tables), n = range(rg), th = pick(THINGS), who = pick(NAMES), p = P(n, t);
    const prompt = chance(0.5) ? who + ' has ' + n + ' ' + th[0] + ' with ' + t + ' ' + th[1] + ' in each. How many ' + th[1] + ' altogether?' : 'There are ' + n + ' ' + th[0] + '. Each one has ' + t + ' ' + th[1] + '. How many ' + th[1] + ' in all?';
    const st = ['There are <b>' + n + ' ' + th[0] + '</b>, each with <b>' + t + ' ' + th[1] + '</b>. That is ' + n + ' groups of ' + t + '.', 'Count in ' + t + 's, ' + n + ' times: ' + skipHTML(t, n) + '.'];
    const tr = cfg.step ? cfg.step(t, n) : '';
    if(tr) st.push(tr);
    st.push(n + ' × ' + t + ' = <b>' + p + '</b> ' + th[1] + '. ✅');
    return mcqNum({
      prompt: prompt, answer: p, wrong: factWrongs(n, t), nearby: [1, -1, 2, -2, 10, -10], valid: pos, count: 4,
      hint: 'Think “' + n + ' groups of ' + t + '”. Count in ' + t + 's, ' + n + ' times.' + (cfg.hintTip ? ' ' + cfg.hintTip : ''),
      explain: ex('Equal groups', st), truth: t * n
    });
  }
  function qSeqGap(cfg){
    const t = pick(cfg.tables), start = randInt(1, 7), h = randInt(1, 3), terms = [];
    for(let i = 0; i < 5; i++) terms.push(P(t, start + i));
    const m = terms[h], prev = terms[h - 1], next = terms[h + 1];
    const shown = terms.map(function(v, i){ return i === h ? '<span style="display:inline-block;min-width:46px;border-bottom:4px solid var(--vis-bad,#EB5757);color:var(--vis-bad,#EB5757)">?</span>' : String(v); }).join(', ');
    return mcqNum({
      prompt: 'Which number is missing from the counting pattern?', visual: seqBox(shown), answer: m,
      wrong: [{ v: prev + 1, why: 'You counted on by 1. In this pattern each number goes up by ' + t + '.' }, { v: next, why: next + ' is already in the pattern, after the gap.' }, { v: prev, why: prev + ' is already in the pattern, before the gap.' }, { v: next - 1, why: 'You went back one from the next number. Go back ' + t + '.' }],
      nearby: [1, -1, 2, -2], valid: pos, count: 4,
      hint: 'Each number is ' + t + ' more than the one before. Add ' + t + ' to the number just before the gap.',
      explain: ex('Counting in ' + t + 's', ['The pattern goes up by <b>' + t + '</b> each time.', prev + ' + ' + t + ' = <b>' + m + '</b>.', 'Check: ' + m + ' + ' + t + ' = ' + next + ', which matches the next number. ✅']),
      truth: t * (start + h)
    });
  }
  function qInTable(cfg, rg){
    const t = pick(cfg.tables), k = randInt(rg[0], rg[1]), m = P(t, k);
    const ds = [];
    shuffle([1, -1, 2, -2, 3, -3, 4, -4, 5, -5, 7, -7]).forEach(function(d){
      const x = m + d;
      if(x > 0 && x % t !== 0){ const lo = x - (x % t); ds.push(opt(K.num(x), String(x), x + ' is not in the ' + t + ' times table. Counting in ' + t + 's goes ' + lo + ', ' + (lo + t) + ': it jumps right over ' + x + '.')); }
    });
    return mcq({
      prompt: 'Which of these numbers is in the ' + t + ' times table?', correct: opt(K.num(m), String(m)), distractors: ds, keepOrder: true, count: 4,
      hint: 'Count in ' + t + 's and see which number you land on.' + (cfg.hintTip ? ' ' + cfg.hintTip : ''),
      explain: ex('Counting in ' + t + 's', ['Count in ' + t + 's: ' + skipHTML(t, k) + '.', 'We land on <b>' + m + '</b> after ' + k + ' jumps, so ' + k + ' × ' + t + ' = ' + m + '.', 'The other numbers are skipped over. ✅']),
      truth: K.num(t * k)
    });
  }
  /* "Warm-up": two numbers, which is in the table (speed-friendly, 2 choices) */
  function qEitherOr(cfg, rg){
    const t = pick(cfg.tables), k = randInt(rg[0], rg[1]), m = P(t, k);
    let x, tries = 0;
    do { x = m + pick([1, -1, 2, -2, 3, -3]); tries++; } while((x <= 0 || x % t === 0) && tries < 40);
    if(x <= 0 || x % t === 0) x = m + 1 + (t === 1 ? 1 : 0);
    const lo = x - (x % t);
    return mcq2({
      prompt: 'Only one of these is in the ' + t + ' times table. Which one?', correct: opt(K.num(m), String(m)), other: opt(K.num(x), String(x), x + ' is not in the ' + t + ' times table. Counting in ' + t + 's goes ' + lo + ', ' + (lo + t) + '.'),
      hint: 'Count in ' + t + 's. Which number do you say out loud?',
      explain: ex('Is it in the table?', ['Count in ' + t + 's: ' + skipHTML(t, k) + '.', '<b>' + m + '</b> is on the list (' + k + ' × ' + t + ' = ' + m + ').', x + ' is not on the list. ✅']),
      truth: K.num(k * t)
    });
  }

  /* ---------- TIER 3 formats: typed answers, missing factors, division, reasoning ---------- */
  function qMissing(cfg, rg){
    const t = pick(cfg.tables), n = range(rg), p = P(t, n), left = chance(0.5);
    const sentence = left ? '▢ × ' + t + ' = ' + p : t + ' × ▢ = ' + p;
    return numeric({
      prompt: 'What number goes in the box?  <b>' + sentence + '</b>', answer: n,
      hint: 'Count in ' + t + 's until you reach ' + p + '. How many jumps did you make?',
      explain: ex('Finding the missing factor', ['Count in ' + t + 's until you reach ' + p + ': ' + skipHTML(t, n) + '.', 'It takes <b>' + n + '</b> jumps of ' + t + ' to get to ' + p + '.', 'Check: ' + n + ' × ' + t + ' = ' + p + ' and ' + t + ' × ' + n + ' = ' + p + ', so the box is <b>' + n + '</b>. ✅']),
      truth: p / t,
      wrong: function(v){ return v === p ? p + ' is the whole answer. The question asks for the missing number in the box.' : v === p - t ? 'You took away ' + t + '. Ask instead: how many ' + t + 's make ' + p + '?' : (v === n + 1 || v === n - 1) ? 'So close! Check it: ' + v + ' × ' + t + ' = ' + v * t + ', not ' + p + '.' : ''; }
    });
  }
  function qDiv(cfg, rg){
    const t = pick(cfg.tables), n = range(rg), p = P(t, n), form = randInt(0, 2), who = pick(NAMES), it = pick(SHARE_ITEMS);
    let prompt;
    if(form === 0) prompt = 'What is <b>' + p + ' ÷ ' + t + '</b>?';
    else if(form === 1) prompt = p + ' ' + it + ' are shared equally between ' + t + ' friends. How many does each friend get?';
    else prompt = who + ' puts ' + p + ' ' + it + ' into groups of ' + t + '. How many groups are there?';
    return numeric({
      prompt: prompt, answer: n,
      hint: 'Think of the ' + t + ' times table backwards: ' + t + ' × what makes ' + p + '?',
      explain: ex('Dividing by ' + t, ['Ask: <b>' + t + ' × ? = ' + p + '</b>. Count in ' + t + 's: ' + skipHTML(t, n) + '.', 'We reach ' + p + ' after <b>' + n + '</b> jumps, so ' + p + ' ÷ ' + t + ' = ' + n + '.', 'Check by multiplying: ' + n + ' × ' + t + ' = ' + p + '. ✅']),
      truth: p / t,
      wrong: function(v){ return v === p * t ? 'You multiplied. Dividing means sharing or grouping, so the answer is smaller than ' + p + '.' : v === p - t ? 'You subtracted ' + t + '. Dividing asks how many ' + t + 's fit into ' + p + '.' : (v === n + 1 || v === n - 1) ? 'So close! Check: ' + v + ' × ' + t + ' = ' + v * t + ', not ' + p + '.' : ''; }
    });
  }
  function qNotIn(cfg, rg){
    const t = pick(cfg.tables), ks = shuffle([2, 3, 4, 5, 6, 7, 8, 9, 10]).slice(0, 3);
    let nm, tries = 0;
    do { nm = P(t, pick(ks)) + pick([1, -1, 2, -2, 3, -3]); tries++; } while((nm <= 0 || nm % t === 0) && tries < 60);
    if(nm <= 0 || nm % t === 0) nm = P(t, ks[0]) + 1;
    const lo = nm - (nm % t);
    const ds = ks.map(function(k){ return opt(K.num(P(t, k)), String(P(t, k)), P(t, k) + ' IS in the ' + t + ' times table (' + k + ' × ' + t + ' = ' + P(t, k) + '). Look for the one that is NOT.'); });
    const vals = ks.map(function(k){ return t * k; }).concat([nm]);
    return mcq({
      prompt: 'Which of these is NOT in the ' + t + ' times table?', correct: opt(K.num(nm), String(nm)), distractors: ds, keepOrder: true, count: 4,
      hint: 'Three of these are in the ' + t + ' times table. Count in ' + t + 's to check each one.',
      explain: ex('Finding the odd one out', ['Counting in ' + t + 's goes ... ' + lo + ', ' + (lo + t) + ' ...', '<b>' + nm + '</b> is between ' + lo + ' and ' + (lo + t) + ', so it is skipped.', 'The other three numbers are all on the ' + t + 's list. ✅']),
      truth: K.num(vals.filter(function(v){ return v % t !== 0; })[0])
    });
  }
  function qWhichWrong(cfg, rg){
    const t = pick(cfg.tables), ns = shuffle([2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].filter(function(x){ return x >= 2 && x <= Math.max(rg[1], 6); })).slice(0, 4);
    const items = ns.map(function(n){ const o = pairOrder(t, n); return { a: o[0], b: o[1], c: t * n }; });
    const bad = items[0], ds0 = [t, -t, 1, -1, 2, -2, 10, -10];
    let delta = pick(ds0), guard = 0;
    while(bad.c + delta <= 0 && guard++ < 20) delta = pick(ds0);
    bad.c += delta;
    const label = function(it){ return eqn(it.a, it.b, it.c); };
    const goodOpts = items.slice(1).map(function(it){ return opt(K.text(label(it)), label(it), 'That one is right: ' + label(it) + '. Look for the one that is wrong.'); });
    const truthItem = items.filter(function(it){ return it.a * it.b !== it.c; })[0];
    return mcq({
      prompt: 'One of these facts is WRONG. Which one?', correct: opt(K.text(label(bad)), label(bad)), distractors: goodOpts, keepOrder: true, count: 4,
      hint: 'Check each fact by counting in ' + t + 's. Which one does not match?',
      explain: ex('Spotting the mistake', ['Check each one by counting in ' + t + 's.', 'The wrong one is <b>' + label(bad) + '</b>.', 'It should be ' + bad.a + ' × ' + bad.b + ' = <b>' + P(bad.a, bad.b) + '</b>. ✅']),
      truth: K.text(eqn(truthItem.a, truthItem.b, truthItem.c))
    });
  }
  function qChain(cfg, rg){
    const t = pick(cfg.tables), n = randInt(Math.max(3, rg[0]), Math.max(4, rg[1] - 1)), up = chance(0.5), p = P(t, n);
    const m = up ? n + 1 : n - 1, ans = up ? p + t : p - t;
    const ws = up ? [{ v: p + 1, why: 'You added just 1. One more group of ' + t + ' means adding ' + t + '.' }, { v: p + n, why: 'You added ' + n + ', the other number. Add one more group: ' + t + '.' }, { v: p - t, why: 'That goes the wrong way. ' + m + ' groups is MORE than ' + n + ' groups.' }, { v: p + 2 * t, why: 'That is two groups more. You only need one more.' }]
      : [{ v: p - 1, why: 'You took away just 1. One group fewer means taking away ' + t + '.' }, { v: p - n, why: 'You took away ' + n + ', the other number. Take away one group: ' + t + '.' }, { v: p + t, why: 'That goes the wrong way. ' + m + ' groups is FEWER than ' + n + ' groups.' }, { v: p - 2 * t, why: 'That is two groups fewer. You only need one fewer.' }];
    return mcqNum({
      prompt: 'You know that ' + t + ' × ' + n + ' = ' + p + '. Use it to work out ' + t + ' × ' + m + '.', answer: ans, wrong: ws, nearby: [1, -1, 2, -2], valid: pos, count: 4,
      hint: m + ' groups is ' + (up ? 'one more' : 'one fewer') + ' group than ' + n + ' groups. How big is one group?',
      explain: ex('Using a fact you know', [t + ' × ' + n + ' = ' + p + ' is ' + n + ' groups of ' + t + '.', 'For ' + t + ' × ' + m + ' we need ' + (up ? '<b>one more</b>' : '<b>one fewer</b>') + ' group of ' + t + '.', p + (up ? ' + ' : ' − ') + t + ' = <b>' + ans + '</b>. ✅']),
      truth: t * m
    });
  }
  function qPicture(cfg){
    const t = pick(cfg.tables), n = randInt(2, 4), useGroups = t <= 8 && chance(0.5);
    const mk = useGroups ? function(x, y){ return V.groups(x, y); } : function(x, y){ return V.array(x, y); };
    const dec = useGroups ? function(h){ const d = V.decodeGroups(h); return d.groups + 'x' + d.per; } : function(h){ const d = V.decodeArray(h); return d.rows + 'x' + d.cols; };
    const key = function(x, y){ return K.text(x + 'x' + y); };
    const cands = [];
    if(t !== n) cands.push([t, n, 'That shows ' + t + (useGroups ? ' groups of ' : ' rows of ') + n + ', so the numbers are swapped over.']);
    cands.push([n + 1, t, 'That has one ' + (useGroups ? 'group' : 'row') + ' too many.']);
    if(n > 1) cands.push([n - 1, t, 'That has one ' + (useGroups ? 'group' : 'row') + ' too few.']);
    cands.push([n, t + 1, 'Each ' + (useGroups ? 'group' : 'row') + ' has one too many dots.']);
    cands.push([n, t - 1, 'Each ' + (useGroups ? 'group' : 'row') + ' has one too few dots.']);
    const ds = cands.map(function(c){ return opt(key(c[0], c[1]), mk(c[0], c[1]), c[2]); });
    const q = mcq({
      prompt: useGroups ? 'Which picture shows ' + n + ' groups of ' + t + ' dots?' : 'Which array shows ' + n + ' rows of ' + t + ' dots?', visual: '',
      correct: opt(key(n, t), mk(n, t)), distractors: ds, keepOrder: true, count: 3,
      hint: 'Check two things: ' + (useGroups ? 'how many groups there are, and how many dots are in each group.' : 'how many rows there are, and how many dots are in each row.'),
      explain: ex('Finding the picture', [n + (useGroups ? ' groups' : ' rows') + ' of ' + t + ' dots means ' + n + ' × ' + t + '.', 'Count the ' + (useGroups ? 'groups' : 'rows') + ' in each picture, then the dots in each one.', 'Only one picture matches: ' + n + ' × ' + t + ' = <b>' + P(n, t) + '</b> dots. ✅']),
      truth: key(n, t)
    });
    q.optionsAreVisual = true;
    q.decodeKey = function(){ for(let i = 0; i < q.options.length; i++){ const r = dec(q.options[i].label); if(K.text(r) !== q.options[i].key) return 'option ' + i + ' picture does not match its key'; } return q.options[q.correct].key; };
    return q;
  }
  function qTwoStep(cfg, rg){
    const t = pick(cfg.tables), n = range(rg), th = pick(THINGS), who = pick(NAMES), p = P(n, t), minus = chance(0.5), k = randInt(1, Math.min(9, p - 2));
    const ans = minus ? p - k : p + k;
    const prompt = who + ' has ' + n + ' ' + th[0] + ' with ' + t + ' ' + th[1] + ' in each. ' + (minus ? 'Then ' + k + ' ' + isAre(k) + ' taken away. How many ' + th[1] + ' are left?' : 'Then ' + k + ' more ' + (k === 1 ? 'is' : 'are') + ' added. How many ' + th[1] + ' now?');
    return numeric({
      prompt: prompt, answer: ans,
      hint: 'Two steps. First find ' + n + ' groups of ' + t + '. Then ' + (minus ? 'take away ' : 'add ') + k + '.',
      explain: ex('Two steps', ['Step 1: ' + n + ' × ' + t + ' — count in ' + t + 's: ' + skipHTML(t, n) + '.', 'Step 2: ' + p + (minus ? ' − ' : ' + ') + k + ' = <b>' + ans + '</b>.', 'So there are ' + ans + ' ' + th[1] + (minus ? ' left' : ' now') + '. ✅']),
      truth: n * t + (minus ? -k : k),
      wrong: function(v){ return v === p ? p + ' is only step 1. Now ' + (minus ? 'take away ' : 'add ') + k + '.' : v === (minus ? p + k : p - k) ? 'That goes the wrong way. ' + (minus ? 'Take away' : 'Add') + ' ' + k + ' to ' + p + '.' : ''; }
    });
  }
  function weighted(list){ const out = []; list.forEach(function(e){ for(let i = 0; i < (e[1] || 1); i++) out.push(e[0]); }); return out; }
  function qTypedFact(cfg, rg){
    const t = pick(cfg.tables), n = range(rg), o = pairOrder(t, n), a = o[0], b = o[1], p = P(a, b);
    return numeric({
      prompt: 'Type the answer:  <b>' + a + ' × ' + b + ' = ?</b>', answer: p,
      hint: factHint(cfg, t, n), explain: factExplain(cfg, a, b, t, n), truth: a * b,
      wrong: function(v){ return v === a + b ? 'You added ' + a + ' + ' + b + '. Multiplying means ' + a + ' groups of ' + b + '.' : v === p + t ? 'That is one group too many.' : v === p - t ? 'That is one group too few.' : ''; }
    });
  }
  /* assemble the three tiers from the shared formats + the skill's own special-trick questions */
  function buildGens(cfg){
    const f = function(fn){ return function(){ return fn(); }; };
    const L1 = weighted([
      [f(function(){ return qArray(cfg); }), 2], [f(function(){ return qGroups(cfg); }), 2], [f(function(){ return qLine(cfg); }), 2], [f(function(){ return qArrayStmt(cfg); }), 1]
    ]).concat(cfg.extra1 || []);
    const L2 = weighted([
      [f(function(){ return qRecall(cfg, cfg.n2, chance(0.3) ? 3 : 4); }), 4], [f(function(){ return qWord(cfg, cfg.n2); }), 2], [f(function(){ return qSeqGap(cfg); }), 1],
      [f(function(){ return qInTable(cfg, [2, 10]); }), 1], [f(function(){ return qEitherOr(cfg, [2, 10]); }), 1], [f(function(){ return qArrayStmt(cfg); }), 1]
    ]).concat(cfg.extra2 || []);
    const L3 = weighted([
      [f(function(){ return qMissing(cfg, cfg.n3); }), 3], [f(function(){ return qDiv(cfg, cfg.n3); }), 3], [f(function(){ return qTypedFact(cfg, cfg.n3); }), 2],
      [f(function(){ return qNotIn(cfg, cfg.n3); }), 1], [f(function(){ return qWhichWrong(cfg, cfg.n3); }), 1], [f(function(){ return qChain(cfg, cfg.n3); }), 1],
      [f(function(){ return qPicture(cfg); }), 1], [f(function(){ return qTwoStep(cfg, cfg.n3); }), 1]
    ]).concat(cfg.extra3 || []);
    return { 1: function(){ return pick(L1)(); }, 2: function(){ return pick(L2)(); }, 3: function(){ return pick(L3)(); } };
  }

  /* ---- skill-specific questions ---- */
  function qPlusOne(){
    const n = randInt(2, 12), two = P(2, n), p = P(3, n);
    return mcqNum({
      prompt: '3 groups is one group more than 2 groups. You know <b>2 × ' + n + ' = ' + two + '</b>. So <b>3 × ' + n + ' = ' + two + ' + ?</b> What do we add?', answer: n,
      wrong: [{ v: 3, why: '3 is the table number. You need to add one more GROUP, and each group is ' + n + '.' }, { v: 2, why: 'You need one more group of ' + n + ', not 2.' }, { v: two, why: two + ' is what you already have. Add one more ' + n + '.' }, { v: p, why: p + ' is the final answer to 3 × ' + n + '. The question asks what to ADD.' }],
      nearby: [1, -1, 2, -2], valid: pos, count: 4,
      hint: '3 groups is 2 groups plus one more group. How big is one group?',
      explain: ex('Double plus one more', ['2 × ' + n + ' = ' + two + ' (that is 2 groups of ' + n + ').', 'For 3 groups we need <b>one more group of ' + n + '</b>.', two + ' + <b>' + n + '</b> = ' + p + ', so 3 × ' + n + ' = ' + p + '. ✅']),
      truth: (3 * n) - (2 * n)
    });
  }
  function qDigitPick(){
    const k = randInt(4, 33), ds = [];
    let m = 0; for(let i = 0; i < k; i++) m += 3;
    shuffle([1, -1, 2, -2, 4, -4, 5, -5, 7, -7, 8, -8]).forEach(function(d){
      const x = m + d;
      if(x >= 12 && x <= 99 && x % 3 !== 0) ds.push(opt(K.num(x), String(x), 'The digits of ' + x + ' add up to ' + String(x).split('').join(' + ') + ' = ' + digitSum(x) + '. That is not in the 3 times table, so ' + x + ' is not either.'));
    });
    return mcq({
      prompt: 'Add up the digits. Which of these numbers is in the 3 times table?', correct: opt(K.num(m), String(m)), distractors: ds, keepOrder: true, count: 4,
      hint: 'Add the two digits together. If the total is in the 3 times table (3, 6, 9, 12 …), so is the number.',
      explain: ex('The digit check', ['The digits of <b>' + m + '</b> add up to ' + String(m).split('').join(' + ') + ' = <b>' + digitSum(m) + '</b>.', digitSum(m) + ' is in the 3 times table, so ' + m + ' is too.', 'Check: ' + k + ' × 3 = ' + m + '. ✅']),
      truth: K.num(3 * k)
    });
  }
  function qDigitTF(){
    const n = randInt(4, 12), p = P(3, n), good = chance(0.4), claim = good ? p : p + pick([1, -1, 2, -2]), who = pick(NAMES);
    const sums = String(claim).split('').join(' + ') + ' = ' + digitSum(claim);
    return mcq2({
      prompt: who + ' says that 3 × ' + n + ' = ' + claim + '. Use the digit check. Is ' + who + ' right?',
      correct: opt(K.bool(good), good ? 'Yes, that is right' : 'No, that is wrong'), other: opt(K.bool(!good), good ? 'No, that is wrong' : 'Yes, that is right', good ? 'The digits of ' + claim + ' add up to ' + digitSum(claim) + ', which IS in the 3 times table, so it passes the check.' : 'Try the digit check: ' + sums + '. That is not in the 3 times table.'),
      hint: 'Add the digits of ' + claim + '. Is the total in the 3 times table?',
      explain: ex('Checking with digits', ['The digits of ' + claim + ' add up: ' + sums + '.', good ? digitSum(claim) + ' is in the 3 times table, and ' + claim + ' = 3 × ' + n + '.' : digitSum(claim) + ' is NOT in the 3 times table, so ' + claim + ' cannot be in it.', good ? 'So ' + who + ' is right: 3 × ' + n + ' = ' + claim + '. ✅' : 'The real answer is 3 × ' + n + ' = ' + p + ', so No, ' + who + ' is wrong. ✅']),
      truth: K.bool(claim === 3 * n)
    });
  }

  const cfg = {
    tables: [3], n1: [2, 6], n2: [2, 10], n3: [2, 12],
    hintTip: 'Trick: double the number, then add one more.',
    step: function(t, n){
      const p = 3 * n;
      return 'Trick: double ' + n + ' = ' + (2 * n) + ', then add one more ' + n + ': ' + (2 * n) + ' + ' + n + ' = <b>' + p + '</b>.' + (p >= 10 ? ' Digit check: ' + String(p).split('').join(' + ') + ' = ' + digitSum(p) + ', in the 3 times table ✓' : '');
    },
    extra2: [qPlusOne, qPlusOne, qDigitPick],
    extra3: [qDigitTF, qDigitPick, qPlusOne]
  };

  registerSkill({
    id: 'multdiv-3', strand: 'multdiv', name: 'The 3 times table', emoji: '3️⃣', year: 3, order: 320, prereq: ['multdiv-2-5-10'],
    lesson: {
      title: 'Counting in 3s',
      steps: [
        { say: 'The <b>3 times table</b> counts in <b>3s</b>: 3, 6, 9, 12, 15, 18. The frog has made <b>4 jumps</b> of 3 and lands on <b>12</b>. So <b>4 × 3 = 12</b>.', vis: { kind: 'numberLine', args: [{ min: 0, max: 18, minor: 3, major: 3, width: 336, marks: [{ value: 12, kind: 'dot' }] }] } },
        { say: 'This array has <b>3 rows</b> with <b>5 dots</b> in each row. Count in 5s: 5, 10, 15. So <b>3 × 5 = 15</b>. Turn it on its side and 5 × 3 = 15 too!', vis: { kind: 'array', args: [3, 5] } },
        { say: 'Here is a handy way to remember: <b>3 groups = 2 groups + 1 more group</b>. For 3 × 4: 2 × 4 = 8, and one more 4 makes <b>12</b>.', vis: { kind: 'groups', args: [3, 4] },
          quiz: { prompt: '2 × 6 = 12. So what is 3 × 6?', options: [{ label: '15', ok: false }, { label: '18', ok: true }, { label: '16', ok: false }], right: 'Yes! 12 + one more 6 = 18.', wrong: 'Add one more group of 6 to 12: 12 + 6 = 18.' } },
        { say: 'Look at the numbers: 12, 21, 24, 27. Add the <b>digits</b>: 1 + 2 = 3, 2 + 1 = 3, 2 + 4 = 6, 2 + 7 = 9. The digits of every number in the 3 times table add up to a number in the 3 times table!', vis: { kind: 'numberLine', args: [{ min: 0, max: 30, minor: 3, major: 3, width: 348, marks: [{ value: 21, kind: 'dot' }] }] },
          quiz: { prompt: 'Which number is in the 3 times table?', options: [{ label: '25', ok: false }, { label: '27', ok: true }, { label: '29', ok: false }], right: 'Yes! 2 + 7 = 9, and 9 is in the 3 times table. So 27 is too: 9 × 3 = 27.', wrong: 'Add the digits. 2 + 7 = 9 is in the 3 times table, so 27 is too. The digits of 25 add to 7 and of 29 add to 11, which are not.' } }
      ]
    },
    trick: {
      title: 'Double plus one more',
      say: 'For <b>3 ×</b> any number: <b>double</b> it, then <b>add the number once more</b>. Afterwards, check with the digits: they should add up to a number in the 3 times table.',
      vis: { kind: 'groups', args: [3, 7] },
      example: '3 × 7 → double 7 = 14 → add 7 = <b>21</b> &nbsp; (2 + 1 = 3 ✓)'
    },
    gen: buildGens(cfg)
  });
})();
