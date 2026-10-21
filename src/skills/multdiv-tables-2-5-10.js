/* multdiv-2-5-10 — Year 3: the 2, 5 and 10 times tables (arrays, skip counting, doubles, add-a-zero, half of ten). */
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
  function qEnds(){
    const n = randInt(2, 12), p = P(5, n), d = p % 10, o = d === 0 ? 5 : 0;
    const rule = 'Counting in 5s, the last digit goes 5, 0, 5, 0 … An odd number of fives ends in 5. An even number of fives ends in 0.';
    return mcq2({
      prompt: 'Will the answer to <b>5 × ' + n + '</b> end in 0 or in 5?', correct: opt(K.num(d), String(d)), other: opt(K.num(o), String(o), rule),
      hint: 'Count in 5s and watch the last digit: 5, 10, 15, 20 … is it 5, 0, 5, 0?',
      explain: ex('Does it end in 0 or 5?', ['Count in 5s, ' + n + ' times: ' + skipHTML(5, n) + '.', 'The last digit of ' + p + ' is <b>' + d + '</b>.', n + ' is ' + (n % 2 === 0 ? 'even, so an even number of fives ends in 0' : 'odd, so an odd number of fives ends in 5') + '. ✅']),
      truth: K.num(n % 2 === 0 ? 0 : 5)
    });
  }
  function qDouble(){
    const n = randInt(3, 12), p = P(2, n);
    return mcqNum({
      prompt: 'What is double <b>' + n + '</b>?', answer: p,
      wrong: [{ v: n + 2, why: 'You added 2. Double means the number twice: ' + n + ' + ' + n + '.' }, { v: n * n, why: 'You multiplied ' + n + ' by itself. Double means ' + n + ' + ' + n + '.' }, { v: n, why: 'That is the same number. Double means you have it twice.' }, { v: 2 * n + 1, why: 'Very close! Double ' + n + ' is ' + n + ' + ' + n + ', which is even.' }],
      nearby: [1, -1, 2, -2], valid: pos, count: 4,
      hint: 'Double means “the same number again”. Add the number to itself.',
      explain: ex('Doubling ' + n, ['Double means two lots of ' + n + '.', n + ' + ' + n + ' = <b>' + p + '</b>.', 'It is the same as 2 × ' + n + ' = ' + p + '. ✅']),
      truth: n + n
    });
  }
  function qHalfTen(){
    const n = randInt(2, 12), down = chance(0.5);
    if(down){
      const ten = P(10, n), p = P(5, n);
      return numeric({
        prompt: 'You know that 10 × ' + n + ' = ' + ten + '. Use it to work out <b>5 × ' + n + '</b>.', answer: p,
        hint: '5 is half of 10, so the answer to 5 × ' + n + ' is half of ' + ten + '.',
        explain: ex('Half of the 10s', ['10 × ' + n + ' = ' + ten + '.', '5 is half of 10, so take <b>half</b> of ' + ten + '.', 'Half of ' + ten + ' is <b>' + p + '</b>, so 5 × ' + n + ' = ' + p + '. ✅']),
        truth: ten / 2, wrong: function(v){ return v === ten ? ten + ' is the answer to 10 × ' + n + '. Fives are only HALF as big.' : ''; }
      });
    }
    const five = P(5, n), p = P(10, n);
    return numeric({
      prompt: 'You know that 5 × ' + n + ' = ' + five + '. Use it to work out <b>10 × ' + n + '</b>.', answer: p,
      hint: '10 is double 5, so the answer to 10 × ' + n + ' is double ' + five + '.',
      explain: ex('Double the 5s', ['5 × ' + n + ' = ' + five + '.', '10 is double 5, so <b>double</b> ' + five + '.', 'Double ' + five + ' is <b>' + p + '</b>, so 10 × ' + n + ' = ' + p + '. ✅']),
      truth: five * 2, wrong: function(v){ return v === five ? five + ' is the answer to 5 × ' + n + '. Tens are DOUBLE the fives.' : ''; }
    });
  }

  const cfg = {
    tables: [2, 5, 10], n1: [2, 5], n2: [2, 10], n3: [2, 12],
    hintTip: 'Tricks: 10s add a zero, 2s are doubles, 5s end in 0 or 5.',
    step: function(t, n){
      if(t === 2) return 'Trick: 2 × means <b>double</b>. Double ' + n + ' is ' + n + ' + ' + n + ' = <b>' + (n + n) + '</b>.';
      if(t === 5) return 'Trick: 10 × ' + n + ' = ' + (10 * n) + ', and <b>half</b> of ' + (10 * n) + ' is <b>' + (5 * n) + '</b>. (5s always end in 0 or 5.)';
      return 'Trick: put a <b>0</b> on the end of ' + n + ' to make <b>' + (10 * n) + '</b>.';
    },
    extra2: [qEnds, qDouble, qEnds],
    extra3: [qHalfTen, qHalfTen, qEnds]
  };

  registerSkill({
    id: 'multdiv-2-5-10', strand: 'multdiv', name: 'The 2, 5 and 10 times tables', emoji: '✖️', year: 3, order: 310, prereq: ['number-place-value'],
    lesson: {
      title: 'Counting in equal jumps',
      steps: [
        { say: 'Times tables are <b>equal jumps</b>. The frog jumps in <b>5s</b>: 5, 10, 15. After <b>3 jumps</b> it is on <b>15</b>. That is <b>3 × 5 = 15</b>.', vis: { kind: 'numberLine', args: [{ min: 0, max: 20, minor: 5, major: 5, marks: [{ value: 15, kind: 'dot' }] }] } },
        { say: 'A times fact can be a picture too. This array has <b>4 rows</b> and <b>5 dots</b> in each row. Count in 5s: 5, 10, 15, 20. So <b>4 × 5 = 20</b>.', vis: { kind: 'array', args: [4, 5] } },
        { say: 'The <b>10 times table</b> is the easiest: each digit moves <b>one place to the left</b>, into the tens, and 0 fills the ones. Here are <b>3 groups of 10</b>, so <b>3 × 10 = 30</b>. And 7 × 10 = 70.', vis: { kind: 'groups', args: [3, 10] },
          quiz: { prompt: 'What is 6 × 10?', options: [{ label: '16', ok: false }, { label: '60', ok: true }, { label: '610', ok: false }], right: 'Yes! The 6 moves one place to the left, into the tens, so 6 × 10 = 60.', wrong: '6 × 10 means 6 tens. The 6 moves one place to the left, into the tens, with 0 ones: it is 60.' } },
        { say: 'The <b>2 times table</b> is all about <b>doubles</b>. Here are <b>6 groups of 2</b>. Double 6 is 6 + 6 = 12, so <b>6 × 2 = 12</b>.', vis: { kind: 'groups', args: [6, 2] } },
        { say: 'Every number in the <b>5 times table</b> ends in <b>0 or 5</b>: 5, 10, 15, 20, 25, 30, 35 … Count in 5s on the line. The dot is on <b>35</b>.', vis: { kind: 'numberLine', args: [{ min: 0, max: 50, minor: 5, major: 5, marks: [{ value: 35, kind: 'dot' }] }] },
          quiz: { prompt: 'Which number is in the 5 times table?', options: [{ label: '42', ok: false }, { label: '35', ok: true }, { label: '28', ok: false }], right: 'Yes! 35 ends in 5, and 7 × 5 = 35.', wrong: 'Numbers in the 5 times table end in 0 or 5. Only 35 does: 7 × 5 = 35.' } }
      ]
    },
    trick: {
      title: 'Add a zero, double it, halve it',
      say: '<b>10s:</b> each digit moves one place to the left (7 × 10 = 70). <b>2s:</b> double the number. <b>5s:</b> they end in 0 or 5, and 5 × is <b>half</b> of 10 ×. Here is 2 × 7: double 7 makes 14.',
      vis: { kind: 'array', args: [2, 7] },
      example: '2 × 7 = double 7 = <b>14</b> &nbsp;•&nbsp; 10 × 7 = <b>70</b> &nbsp;•&nbsp; 5 × 7 = half of 70 = <b>35</b>'
    },
    gen: buildGens(cfg)
  });
})();
