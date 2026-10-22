/* multdiv-6-9 — Year 3 (school unit "3, 6 and 9 relationships"): the 6 times table as double the 3s, the 9 times table as 10s take away one, with digit and even/odd checks. */
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
  /* missing factor as multiple choice (tier 2): the product is on offer as the tempting wrong answer, as in the school test "▢ × 5 = 35" */
  function qMissingMcq(cfg, rg){
    const t = pick(cfg.tables), n = range(rg), p = P(t, n), left = chance(0.5);
    const sentence = left ? '▢ × ' + t + ' = ' + p : t + ' × ▢ = ' + p;
    return mcqNum({
      prompt: 'Which number goes in the box?  <b>' + sentence + '</b>', answer: n,
      wrong: [{ v: p, why: p + ' is the whole answer, the number AFTER the = sign. The box is how many ' + t + 's make ' + p + '.' }, { v: p - t, why: 'You took away ' + t + '. Ask instead: how many ' + t + 's make ' + p + '?' }, { v: n + 1, why: 'So close! Check it: ' + (n + 1) + ' × ' + t + ' = ' + (n + 1) * t + ', not ' + p + '.' }, { v: n - 1, why: 'So close! Check it: ' + (n - 1) + ' × ' + t + ' = ' + (n - 1) * t + ', not ' + p + '.' }, { v: p + t, why: 'That is too big. Count in ' + t + 's up to ' + p + ' and stop there.' }],
      nearby: [1, -1, 2, -2], valid: pos, count: 3,
      hint: 'Count in ' + t + 's until you reach ' + p + '. How many jumps did you make?',
      explain: ex('Finding the missing factor', ['Count in ' + t + 's until you reach ' + p + ': ' + skipHTML(t, n) + '.', 'It takes <b>' + n + '</b> jumps of ' + t + ' to get to ' + p + '.', 'Check: ' + n + ' × ' + t + ' = ' + p + ', so the box is <b>' + n + '</b>. ✅']),
      truth: p / t
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
      wrong: function(v){ return v === p ? p + ' is only step 1. Now ' + (minus ? 'take away ' : 'add ') + k + '.' : v === (minus ? p + k : p - k) ? (minus ? 'You added ' + k + ' to ' + p + ', but this step takes ' + k + ' away.' : 'You took ' + k + ' away from ' + p + ', but this step adds ' + k + '.') : ''; }
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
      [f(function(){ return qInTable(cfg, [2, 10]); }), 1], [f(function(){ return qEitherOr(cfg, [2, 10]); }), 1], [f(function(){ return qArrayStmt(cfg); }), 1], [f(function(){ return qMissingMcq(cfg, cfg.n2); }), 2]
    ]).concat(cfg.extra2 || []);
    const L3 = weighted([
      [f(function(){ return qMissing(cfg, cfg.n3); }), 3], [f(function(){ return qDiv(cfg, cfg.n3); }), 3], [f(function(){ return qTypedFact(cfg, cfg.n3); }), 2],
      [f(function(){ return qNotIn(cfg, cfg.n3); }), 1], [f(function(){ return qWhichWrong(cfg, cfg.n3); }), 1], [f(function(){ return qChain(cfg, cfg.n3); }), 1],
      [f(function(){ return qPicture(cfg); }), 1], [f(function(){ return qTwoStep(cfg, cfg.n3); }), 1]
    ]).concat(cfg.extra3 || []);
    return { 1: function(){ return pick(L1)(); }, 2: function(){ return pick(L2)(); }, 3: function(){ return pick(L3)(); } };
  }

  /* ---- skill-specific questions ---- */
  /* 6 is double 3: use a 3 times table fact (or halve a 6 fact) */
  function q6Double(){
    const n = randInt(2, 12), three = P(3, n), six = P(6, n), up = chance(0.65);
    if(up) return mcqNum({
      prompt: '6 is double 3. You know <b>3 × ' + n + ' = ' + three + '</b>. Double it to find <b>6 × ' + n + ' = ?</b>', answer: six,
      wrong: [{ v: three, why: three + ' is the answer for 3 groups. 6 is DOUBLE 3, so double ' + three + '.' }, { v: three + n, why: 'That is 4 × ' + n + '. 6 groups is double the 3 groups.' }, { v: three + 6, why: 'You added 6. Doubling means ' + three + ' + ' + three + '.' }, { v: six + n, why: 'That is 7 × ' + n + ': one group too many.' }],
      nearby: [1, -1, 2, -2, 10, -10], valid: pos, count: 4,
      hint: '6 is double 3, so 6 groups is double 3 groups. Double ' + three + '.',
      explain: ex('Double the 3s', ['3 × ' + n + ' = ' + three + ' (3 groups of ' + n + ').', '6 groups is <b>double</b> that: ' + three + ' + ' + three + '.', three + ' + ' + three + ' = <b>' + six + '</b>, so 6 × ' + n + ' = ' + six + '. ✅']),
      truth: 2 * (n * 3)
    });
    return mcqNum({
      prompt: '6 × ' + n + ' = ' + six + '. Use <b>half</b> of it to work out 3 × ' + n + '.', answer: three,
      wrong: [{ v: six, why: six + ' is the answer for 6 groups. 3 is HALF of 6, so halve ' + six + '.' }, { v: six - n, why: 'That is 5 × ' + n + '. Halve ' + six + ' instead.' }, { v: six - 3, why: 'You took away 3. Halving means splitting ' + six + ' into 2 equal parts.' }, { v: three + n, why: 'That is 4 × ' + n + '. Halve ' + six + '.' }],
      nearby: [1, -1, 2, -2], valid: pos, count: 4,
      hint: '3 is half of 6. Split ' + six + ' into two equal parts.',
      explain: ex('Half of the 6s', ['6 × ' + n + ' = ' + six + '.', '3 is half of 6, so 3 × ' + n + ' is <b>half</b> of ' + six + '.', 'Half of ' + six + ' = <b>' + three + '</b>. ✅']),
      truth: (n * 6) / 2
    });
  }
  /* 9 is 10 take away 1 */
  function q9Ten(){
    const n = randInt(2, 12), ten = 10 * n, nine = P(9, n), sub = chance(0.55);
    if(sub) return mcqNum({
      prompt: '9 groups is one group fewer than 10 groups. You know <b>10 × ' + n + ' = ' + ten + '</b>. So <b>9 × ' + n + ' = ' + ten + ' − ?</b> What do we take away?', answer: n,
      wrong: [{ v: 9, why: '9 is the table number. 9 groups is one group fewer than 10 groups, and each group is ' + n + '.' }, { v: 10, why: '10 would take away 10 groups… you only need to take away ONE group of ' + n + '.' }, { v: 1, why: 'You take away one GROUP, and one group is ' + n + ', not 1.' }, { v: ten, why: ten + ' is what you start with. Take away one group of ' + n + '.' }],
      nearby: [1, -1, 2], valid: pos, count: 4,
      hint: '9 groups is 10 groups take away one group. How big is one group?',
      explain: ex('Ten take away one', ['10 × ' + n + ' = ' + ten + ' (10 groups of ' + n + ').', '9 groups is one group fewer, so take away <b>' + n + '</b>.', ten + ' − ' + n + ' = <b>' + nine + '</b>, so 9 × ' + n + ' = ' + nine + '. ✅']),
      truth: ten - (9 * n)
    });
    return mcqNum({
      prompt: 'What is <b>9 × ' + n + '</b>? Try: 10 × ' + n + ' = ' + ten + ', then take away ' + n + '.', answer: nine,
      wrong: [{ v: ten, why: ten + ' is 10 × ' + n + '. Now take away ' + n + '.' }, { v: ten + n, why: 'You added ' + n + '. 9 is LESS than 10, so take away.' }, { v: ten - 1, why: 'You took away 1. Take away one whole group: ' + n + '.' }, { v: ten - 9, why: 'You took away 9. Take away ' + n + ' instead.' }],
      nearby: [1, -1, 2, -2, 10, -10], valid: pos, count: 4,
      hint: 'Take ' + n + ' away from ' + ten + '.',
      explain: ex('Ten take away one', [ten + ' − ' + n + ' = <b>' + nine + '</b>.', 'Check the digits: ' + String(nine).split('').join(' + ') + ' = ' + digitSum(nine) + (nine < 100 ? ', which is 9 ✓' : '') + '.', '9 × ' + n + ' = ' + nine + '. ✅']),
      truth: n * 10 - n
    });
  }
  /* digits of a 9 times table answer (up to 90) add up to 9 */
  function q9Digits(){
    const k = randInt(2, 10), m = P(9, k), ds = [];
    shuffle([1, -1, 2, -2, 3, -3, 4, -4, 5, -5, 7, -7, 8, -8, 9, -9]).forEach(function(d){
      const x = m + d;
      if(x >= 12 && x <= 99 && x % 9 !== 0) ds.push(opt(K.num(x), String(x), 'The digits of ' + x + ' add up to ' + String(x).split('').join(' + ') + ' = ' + digitSum(x) + ', not 9. So ' + x + ' is not in the 9 times table.'));
    });
    return mcq({
      prompt: 'Add up the digits. Which of these numbers is in the 9 times table?', correct: opt(K.num(m), String(m)), distractors: ds, keepOrder: true, count: 4,
      hint: 'In the 9 times table, the two digits always add up to 9. Try each number.',
      explain: ex('The digits make 9', ['The digits of <b>' + m + '</b> add up: ' + String(m).split('').join(' + ') + ' = <b>' + digitSum(m) + '</b>.', 'Every answer in the 9 times table up to 90 has digits that add up to 9.', 'Check: ' + k + ' × 9 = ' + m + '. ✅']),
      truth: K.num(9 * k)
    });
  }
  function q9TF(){
    const n = randInt(3, 10), p = P(9, n), good = chance(0.4), claim = good ? p : p + pick([1, -1, 2, -2, 3, -3, 4, -4])   /* never ±9: 27 → 36 still passes the digit check, so the check could not catch it */, who = pick(NAMES);
    const sums = String(claim).split('').join(' + ') + ' = ' + digitSum(claim);
    return mcq2({
      prompt: who + ' says 9 × ' + n + ' = ' + claim + '. <b>Digit check:</b> in the 9 times table, the digits of the answer add up to 9. Is ' + who + ' right?',
      correct: opt(K.bool(claim === 9 * n), claim === 9 * n ? 'Yes, that is right' : 'No, that is wrong'), other: opt(K.bool(claim !== 9 * n), claim === 9 * n ? 'No, that is wrong' : 'Yes, that is right', claim === 9 * n ? 'The digits of ' + claim + ' add up to ' + digitSum(claim) + ', so it passes the check.' : 'Try the digit check: ' + sums + '. In the 9 times table the digits add up to 9, so this does not pass.'),
      hint: 'Add the digits of ' + claim + '. Do they make 9?',
      explain: ex('Checking with digits', ['The digits of ' + claim + ' add up: ' + sums + '.', claim === 9 * n ? 'They make 9, and ' + claim + ' = 9 × ' + n + '.' : 'They do not make 9, so ' + claim + ' is not in the 9 times table.', claim === 9 * n ? 'So ' + who + ' is right. ✅' : 'The real answer is 9 × ' + n + ' = ' + p + ', so ' + who + ' is wrong. ✅']),
      truth: K.bool(claim === 9 * n)
    });
  }
  /* a number in the 6 times table is even AND in the 3 times table */
  function q6Even(){
    const k = randInt(3, 12), m = P(6, k), ds = [];
    shuffle([3, -3, 9, -9, 15, -15, 1, -1, 2, -2, 4, -4, 6, -6]).forEach(function(d){
      const x = m + d;
      if(x > 6 && x <= 72 && x % 6 !== 0){
        const odd = x % 2 === 1, in3 = x % 3 === 0;
        ds.push(opt(K.num(x), String(x), odd ? x + ' is odd. Every number in the 6 times table is even.' : (in3 ? x + ' is not in the 6 times table.' : x + ' is even, but it is not in the 3 times table (' + String(x).split('').join(' + ') + ' = ' + digitSum(x) + '), so it cannot be in the 6 times table.')));
      }
    });
    return mcq({
      prompt: 'Which of these numbers is in the 6 times table?', correct: opt(K.num(m), String(m)), distractors: ds, keepOrder: false, count: 4,
      hint: 'A number in the 6 times table is even AND in the 3 times table.',
      explain: ex('Even and in the 3s', ['Numbers in the 6 times table are <b>even</b> and also in the <b>3 times table</b>.', '<b>' + m + '</b> is even, and its digits add up to ' + digitSum(m) + ', which is in the 3 times table.', 'Check: ' + k + ' × 6 = ' + m + '. ✅']),
      truth: K.num(6 * k)
    });
  }

  const cfg = {
    tables: [6, 9], n1: [2, 6], n2: [2, 10], n3: [2, 12],
    hintTip: 'Trick: 6s are double the 3s; 9s are 10s take away one.',
    step: function(t, n){
      if(t === 6) return 'Trick: 3 × ' + n + ' = ' + (3 * n) + ', and 6 is double 3, so double it: ' + (3 * n) + ' + ' + (3 * n) + ' = <b>' + (6 * n) + '</b>.';
      const p = 9 * n;
      return 'Trick: 10 × ' + n + ' = ' + (10 * n) + ', take away ' + n + ': ' + (10 * n) + ' − ' + n + ' = <b>' + p + '</b>.' + (p < 100 && p >= 10 ? ' Digit check: ' + String(p).split('').join(' + ') + ' = ' + digitSum(p) + ' ✓' : '');
    },
    extra2: [q6Double, q9Ten, q9Digits, q6Even],
    extra3: [q6Double, q9Ten, q9TF, q9Digits, q6Even]
  };

  registerSkill({
    id: 'multdiv-6-9', strand: 'multdiv', name: 'The 6 and 9 times tables', emoji: '6️⃣', year: 3, order: 345, prereq: ['multdiv-3'],
    lesson: {
      title: 'Using the 3s to find the 6s and 9s',
      steps: [
        { say: 'The <b>6 times table</b> counts in <b>6s</b>: 6, 12, 18, 24, 30. The frog has made <b>4 jumps</b> of 6 and lands on <b>24</b>. So <b>4 × 6 = 24</b>.', vis: { kind: 'numberLine', args: [{ min: 0, max: 36, minor: 6, major: 6, width: 348, marks: [{ value: 24, kind: 'dot' }] }] } },
        { say: '<b>6 is double 3.</b> You know 3 × 4 = 12. Double it: 12 + 12 = 24. So <b>6 × 4 = 24</b>. The 6s are just the 3s, doubled!', vis: { kind: 'array', args: [6, 4] },
          quiz: { prompt: '3 × 5 = 15. What is 6 × 5?', options: [{ label: '20', ok: false }, { label: '30', ok: true }, { label: '21', ok: false }], right: 'Yes! Double 15 is 30.', wrong: 'Double 15: 15 + 15 = 30.' } },
        { say: 'The <b>9 times table</b>: <b>9 is 10 take away 1</b>. For 9 × 4, do 10 × 4 = 40 and take away one group of 4: 40 − 4 = <b>36</b>.', vis: { kind: 'groups', args: [4, 9] },
          quiz: { prompt: '10 × 6 = 60. What is 9 × 6?', options: [{ label: '66', ok: false }, { label: '54', ok: true }, { label: '56', ok: false }], right: 'Yes! 60 − 6 = 54.', wrong: 'Take away one group of 6 from 60: 60 − 6 = 54.' } },
        { say: 'Look at the 9s: 18, 27, 36, 45, 54. Add the <b>digits</b> of each: 1 + 8 = 9, 2 + 7 = 9, 3 + 6 = 9. The digits always add up to <b>9</b>!', vis: { kind: 'numberLine', args: [{ min: 0, max: 90, minor: 9, major: 9, width: 348, marks: [{ value: 54, kind: 'dot' }] }] },
          quiz: { prompt: 'Which number is in the 9 times table?', options: [{ label: '64', ok: false }, { label: '63', ok: true }, { label: '65', ok: false }], right: 'Yes! 6 + 3 = 9, and 7 × 9 = 63.', wrong: 'Add the digits. 6 + 3 = 9, so 63 is in the 9 times table. 64 and 65 add up to 10 and 11.' } }
      ]
    },
    trick: {
      title: 'Double the 3s, and ten take away one',
      say: 'For <b>6 ×</b>: find the 3s fact and <b>double</b> it. For <b>9 ×</b>: do <b>10 ×</b> and take away the number once. The answers to the 9s always have digits that add up to 9.',
      vis: { kind: 'groups', args: [3, 9] },
      example: '6 × 7 → 3 × 7 = 21 → double = <b>42</b> &nbsp;·&nbsp; 9 × 7 → 70 − 7 = <b>63</b> (6 + 3 = 9 ✓)'
    },
    gen: buildGens(cfg)
  });
})();
