/* addsub-word — one- and two-step addition & subtraction word problems with bar models */
(function(){
  const NAMES = ['Ana', 'Marcus', 'Sophie', 'Ivan', 'Lucy', 'Diego', 'Ellen', 'Tom', 'Aisha', 'Kai', 'Mei', 'Leo'];
  const THINGS = ['stickers', 'marbles', 'shells', 'stars', 'beads', 'cards', 'conkers', 'feathers'];
  const ANIMALS = ['parrots', 'penguins', 'rabbits', 'monkeys', 'owls', 'lizards'];
  function dg(n, i){ return Math.floor(n / Math.pow(10, i)) % 10; }
  function swapSub(hi, lo){ let v = 0; for(let i = 2; i >= 0; i--) v = v * 10 + Math.abs(dg(hi, i) - dg(lo, i)); return v; }
  function wrongNum(wl){ return function(v){ for(let i = 0; i < wl.length; i++) if(wl[i].v === v) return wl[i].why; return ''; }; }
  function words(s){ return s.replace(/<[^>]*>/g, '').trim().split(/\s+/).length; }

  /* ---- bar model decoder: reads the drawn parts and total ---- */
  function barSolve(html){
    const parts = []; let m; const re = /class="bpart" data-v="([^"]*)"/g;
    while((m = re.exec(html))) parts.push(m[1]);
    const t = /<div style="text-align:center;font-weight:900;[^"]*">([^<]*)<\/div>/.exec(html);
    const total = t ? t[1] : '';
    let known = 0; parts.forEach(function(p){ if(p !== '?') known += parseInt(p, 10); });
    return total === '?' ? known : parseInt(total, 10) - known;
  }
  function barOp(html){ const t = /<div style="text-align:center;font-weight:900;[^"]*">([^<]*)<\/div>/.exec(html); return t && t[1] === '?' ? 'add' : 'sub'; }

  /* ---- one-step templates. Each returns {text, op, x, y, unit}. sentence is x op y ---- */
  function oneStep(kind, big, money){
    const nn = sample(NAMES, 2), N1 = nn[0], N2 = nn[1], th = pick(THINGS), an = pick(ANIMALS);
    let x, y, ans;
    if(kind === 'add'){
      if(big){ x = randInt(120, 640); y = randInt(110, 990 - x); } else { x = randInt(11, 58); y = randInt(11, 92 - x); }
      if(x % 10 === 0) x++; if(y % 10 === 0) y++;
      const tpls = money ? [
        function(){ return { t: 'A comic costs <b>' + x + 'p</b>. A rubber costs <b>' + y + 'p</b>. How much do they cost together?', clue: 'together' }; },
        function(){ return { t: N1 + ' spends <b>' + x + 'p</b> on a drink and <b>' + y + 'p</b> on a snack. How much is that in total?', clue: 'in total' }; }
      ] : [
        function(){ return { t: N1 + ' has <b>' + x + '</b> ' + th + '. ' + N2 + ' has <b>' + y + '</b>. How many ' + th + ' do they have altogether?', clue: 'altogether' }; },
        function(){ return { t: 'There are <b>' + x + '</b> ' + an + ' at the zoo. <b>' + y + '</b> more ' + an + ' arrive. How many ' + an + ' are there now?', clue: 'more arrive' }; },
        function(){ return { t: N1 + ' bakes <b>' + x + '</b> cupcakes on Saturday and <b>' + y + '</b> on Sunday. How many cupcakes is that altogether?', clue: 'altogether' }; },
        function(){ return { t: N1 + '’s team scores <b>' + x + '</b> points in match one and <b>' + y + '</b> in match two. How many points in total?', clue: 'in total' }; }
      ];
      const T = pick(tpls)();
      return { text: T.t, op: 'add', x: x, y: y, unit: money ? 'p' : '', clue: T.clue, word: 'join' };
    }
    if(big){ x = randInt(250, 990); y = randInt(111, x - 100); } else { x = randInt(31, 95); y = randInt(11, x - 10); }
    if(y % 10 === 0) y++;
    const tpls = money ? [
      function(){ return { t: 'A toy costs <b>' + x + 'p</b>. ' + N1 + ' has <b>' + y + 'p</b>. How much more money does ' + N1 + ' need?', clue: 'how much more', w: 'compare' }; },
      function(){ return { t: N1 + ' has <b>' + x + 'p</b> and spends <b>' + y + 'p</b>. How much money is left?', clue: 'left', w: 'takeaway' }; }
    ] : [
      function(){ return { t: N1 + ' has <b>' + x + '</b> ' + th + '. ' + N1 + ' gives <b>' + y + '</b> away. How many ' + th + ' are left?', clue: 'left', w: 'takeaway' }; },
      function(){ return { t: 'A hall has <b>' + x + '</b> seats. <b>' + y + '</b> seats are taken. How many seats are empty?', clue: 'empty', w: 'takeaway' }; },
      function(){ return { t: N1 + ' scores <b>' + x + '</b> points. ' + N2 + ' scores <b>' + y + '</b> points. How many more points does ' + N1 + ' score than ' + N2 + '?', clue: 'how many more', w: 'compare' }; },
      function(){ return { t: N1 + ' has <b>' + y + '</b> ' + th + ' and wants <b>' + x + '</b>. How many more ' + th + ' does ' + N1 + ' need?', clue: 'how many more', w: 'compare' }; },
      function(){ return { t: 'A unicorn stable has <b>' + x + '</b> bales of hay. <b>' + y + '</b> bales are eaten. How many bales are left?', clue: 'left', w: 'takeaway' }; }
    ];
    const T = pick(tpls)();
    return { text: T.t, op: 'sub', x: x, y: y, unit: money ? 'p' : '', clue: T.clue, word: T.w };
  }
  function barFor(p){ return p.op === 'add' ? V.barModel([{ value: p.x }, { value: p.y }], '?') : V.barModel([{ value: p.y }, { value: '?' }], p.x); }
  function ansOf(p){ return p.op === 'add' ? p.x + p.y : p.x - p.y; }       // correct: the operation the story needs
  function truthOf(p){ // independent: count up/down in tens and ones
    if(p.op === 'add'){ let t = p.x; for(let i = 0; i < Math.floor(p.y / 10); i++) t += 10; return t + p.y % 10; }
    let t = p.x; for(let i = 0; i < Math.floor(p.y / 10); i++) t -= 10; return t - p.y % 10;
  }
  function wrongsOne(p){
    const out = [], ans = ansOf(p), u = p.unit;
    if(p.op === 'add'){
      out.push({ v: Math.abs(p.x - p.y), why: 'You took away. But the story puts the amounts together ("' + p.clue + '"), so we add.' });
      const noCarry = (p.x % 10 + p.y % 10 >= 10) ? ans - 10 : null; if(noCarry) out.push({ v: noCarry, why: 'Good choice to add! But a carry was forgotten: the ones made 10 or more, so carry 1 ten.' });
      out.push({ v: ans + 10, why: 'Good choice to add! But the answer is 10 too big. Check the tens column.' });
    } else {
      out.push({ v: p.x + p.y, why: 'You added. But the story ("' + p.clue + '") asks us to take away or find the difference, so we subtract.' });
      const sw = swapSub(p.x, p.y); if(sw !== ans) out.push({ v: sw, why: 'Good choice to subtract! But the smaller digit was taken from the bigger one in a column. Exchange instead.' });
      out.push({ v: ans + 10, why: 'Good choice to subtract! But the answer is 10 too big. Check the tens column: did the next column go down by 1 after an exchange?' });
    }
    return out;
  }
  function explainOne(p){
    const sg = p.op === 'add' ? '+' : '−', ans = ansOf(p), u = p.unit;
    const idea = p.op === 'add' ? 'The story <b>joins</b> amounts together ("' + p.clue + '"), so we <b>add</b>.' : (p.word === 'compare' ? 'The story compares two amounts ("' + p.clue + '"), so we <b>subtract</b> (find the difference).' : 'The story <b>takes some away</b> ("' + p.clue + '"), so we <b>subtract</b>.');
    return ex('Solving the story', [idea, 'Bar model: ' + (p.op === 'add' ? 'two parts ' + p.x + ' and ' + p.y + ' make the whole.' : 'the whole is ' + p.x + ', one part is ' + p.y + ', the other part is the answer.') + ' The calculation is <b>' + p.x + ' ' + sg + ' ' + p.y + '</b>.', 'Work it out: ' + p.x + ' ' + sg + ' ' + p.y + ' = <b>' + ans + u + '</b>.', 'Check: ' + (p.op === 'add' ? ans + ' − ' + p.y + ' = ' + p.x : ans + ' + ' + p.y + ' = ' + p.x) + '. ✅']);
  }
  function hintOne(p){ return 'Read the story slowly. Is something joined together, or taken away / compared? Look at the bar model too.'; }
  function solveQ(p, showBar){
    const bar = barFor(p), u = p.unit, wl = wrongsOne(p);
    return mcqNum({ prompt: p.text, visual: showBar ? bar : '', answer: ansOf(p), wrong: wl, nearby: [10, -10, 1, -1, 2, -2, 20, -20], fmt: function(v){ return v + u; }, valid: function(v){ return v > 0 && v < 1100; },
      hint: hintOne(p), explain: explainOne(p), truth: truthOf(p), decode: showBar ? function(){ return barSolve(bar); } : undefined });
  }
  function typedOne(p, showBar){
    const bar = barFor(p), wl = wrongsOne(p);
    return numeric({ prompt: p.text + ' Type your answer.', visual: showBar ? bar : '', answer: ansOf(p), unit: p.unit, hint: hintOne(p), explain: explainOne(p), truth: truthOf(p),
      decode: showBar ? function(){ return barSolve(bar); } : undefined, wrong: wrongNum(wl) });
  }
  function chooseOp(p){ // two choices: add or subtract?
    const bar = barFor(p), sg = p.op === 'add' ? '+' : '−', other = p.op === 'add' ? '−' : '+';
    const right = p.x + ' ' + sg + ' ' + p.y, wrong = p.x + ' ' + other + ' ' + p.y;
    return mcq2({ prompt: p.text + '<br>Which sum solves it?', visual: bar,
      correct: opt(K.text(p.op), right), other: opt(K.text(p.op === 'add' ? 'sub' : 'add'), wrong, p.op === 'add' ? 'The story puts amounts together ("' + p.clue + '"). That needs adding, not taking away.' : 'The story takes away or compares ("' + p.clue + '"). That needs subtracting, not adding.'),
      hint: 'Look at the bar model. If the whole is a question mark, add the parts. If the whole is known, take the known part away.',
      explain: ex('Choosing the operation', [p.op === 'add' ? 'The bar model has a <b>?</b> for the whole, so we put the parts together: <b>add</b>.' : 'The whole is <b>' + p.x + '</b> and we need the missing part, so we <b>subtract</b>.', 'Clue words in the story: "' + p.clue + '".', 'The calculation is <b>' + right + '</b>. ✅']),
      truth: K.text(p.op === 'add' ? 'add' : 'sub'), decode: function(){ return K.text(barOp(bar)); } });
  }
  function sentenceWithAnswer(p){ // 3 options, each a full number sentence
    const sg = p.op === 'add' ? '+' : '−', other = p.op === 'add' ? '−' : '+', ans = ansOf(p);
    const fmt = function(op, v){ return p.x + ' ' + op + ' ' + p.y + ' = ' + v + p.unit; };
    const otherAns = p.op === 'add' ? Math.abs(p.x - p.y) : p.x + p.y;
    return mcq({ prompt: p.text + '<br>Which number sentence is correct for this story?',
      correct: opt(K.text('ok'), fmt(sg, ans)), keepOrder: true, count: 3,
      distractors: [opt(K.text('op'), fmt(other, otherAns), p.op === 'add' ? 'That sum takes away. The story puts the amounts together.' : 'That sum adds. The story takes away or compares.'),
        opt(K.text('slip'), fmt(sg, ans + 10), 'The right operation, but the answer is 10 too big. Check your carrying or exchanging.'),
        opt(K.text('slip2'), fmt(sg, ans - 10), 'The right operation, but the answer is 10 too small. Check your carrying or exchanging.')],
      hint: 'First decide: add or subtract? Then check the calculation.',
      explain: ex('Choosing the sentence', [explainStory(p), 'The calculation is ' + p.x + ' ' + sg + ' ' + p.y + ' = <b>' + ans + p.unit + '</b>.', 'So the correct sentence is <b>' + fmt(sg, ans) + '</b>. ✅']),
      truth: K.text(truthOf(p) === ans ? 'ok' : 'bad') });
  }
  function explainStory(p){ return p.op === 'add' ? 'The story joins amounts together ("' + p.clue + '"), so we <b>add</b>.' : 'The story takes away or compares ("' + p.clue + '"), so we <b>subtract</b>.'; }

  /* ---- two-step templates ---- */
  function twoStep(kind, money){
    const nn = sample(NAMES, 2), N1 = nn[0], N2 = nn[1], th = pick(THINGS), u = money ? 'p' : '';
    for(let i = 0; i < 600; i++){
      let a, b, c, ans, text, sent, steps;
      if(kind === 'A'){ // + then −
        a = randInt(120, 480); b = randInt(25, 190); c = randInt(25, 160);
        ans = a + b - c; if(b === c) continue;
        text = N1 + ' has <b>' + a + '</b> ' + th + '. ' + N1 + ' gets <b>' + b + '</b> more, then gives <b>' + c + '</b> away. How many ' + th + ' now?';
        sent = [['+', b], ['−', c]];
      } else if(kind === 'B'){ // − then −
        a = randInt(300, 900); b = randInt(25, 250); c = randInt(25, 250); ans = a - b - c; if(b === c) continue;
        text = 'A box holds <b>' + a + '</b> beads. <b>' + b + '</b> are red and <b>' + c + '</b> are blue. The rest are green. How many are green?';
        sent = [['−', b], ['−', c]];
      } else if(kind === 'C'){ // − then +
        a = randInt(200, 700); b = randInt(25, 190); c = randInt(25, 190); ans = a - b + c; if(b === c) continue;
        text = 'A bus has <b>' + a + '</b> people. <b>' + b + '</b> get off and <b>' + c + '</b> get on. How many people are on the bus now?';
        sent = [['−', b], ['+', c]];
      } else { // money − −
        a = randInt(300, 900); b = randInt(45, 290); c = randInt(25, 190); ans = a - b - c; if(b === c) continue;
        text = N1 + ' has <b>' + a + 'p</b>. A toy costs <b>' + b + 'p</b> and a sweet costs <b>' + c + 'p</b>. How much money is left?';
        sent = [['−', b], ['−', c]];
      }
      if(ans < 20 || ans > 999 || a % 10 === 0 || b % 10 === 0 || c % 10 === 0) continue;
      const mid = sent[0][0] === '+' ? a + b : a - b;
      return { a: a, b: b, c: c, ans: ans, mid: mid, text: text, sent: sent, kind: kind, u: kind === 'D' ? 'p' : '' };
    }
    throw new Error('word: no two-step');
  }
  function sentStr(a, s1, b, s2, c){ return a + ' ' + s1 + ' ' + b + ' ' + s2 + ' ' + c; }
  function twoTruth(q){ let t = q.a; q.sent.forEach(function(s){ t += (s[0] === '+' ? 1 : -1) * s[1]; }); return t; }
  function twoExplain(q){
    const s1 = q.sent[0][0], s2 = q.sent[1][0], u = q.u;
    return ex('A two-step story', ['<b>Step 1:</b> ' + q.a + ' ' + s1 + ' ' + q.b + ' = <b>' + q.mid + u + '</b>.', '<b>Step 2:</b> ' + q.mid + ' ' + s2 + ' ' + q.c + ' = <b>' + q.ans + u + '</b>.', 'The answer is <b>' + q.ans + u + '</b>. Check it is sensible: the story starts at ' + q.a + u + ' and in the end goes ' + (q.ans >= q.a ? 'up' : 'down') + ' by ' + Math.abs(q.ans - q.a) + u + '. ✅']);
  }
  function twoWrongs(q){
    const out = [{ v: q.mid, why: 'That is only the first step. There is a second step in the story!' }];
    const alt = q.a + (q.sent[0][0] === '+' ? q.b : -q.b) + (q.sent[1][0] === '+' ? -q.c : q.c);
    if(alt !== q.ans) out.push({ v: alt, why: 'The second amount was added when it should be taken away (or the other way round). Read the story again.' });
    out.push({ v: q.a + q.b + q.c, why: 'You added everything. Check which amounts are joined and which are taken away.' });
    return out;
  }

  registerSkill({
    id: 'addsub-word', strand: 'addsub', name: 'Add & subtract word problems', emoji: '📖', year: 3, order: 260, prereq: ['addsub-missing-inverse'],
    lesson: {
      title: 'Solving stories with bar models',
      steps: [
        { say: 'A <b>bar model</b> is a picture of a story. Ana has <b>45</b> stickers. Ben has <b>28</b>. How many altogether? The two parts join to make the whole, which is the <b>?</b>.', vis: { kind: 'barModel', args: [[{ value: 45 }, { value: 28 }], '?'] } },
        { say: 'Words like <b>altogether</b>, <b>in total</b> and <b>more arrive</b> (amounts joining) mean <b>add</b>. 45 + 28 = <b>73</b>.', vis: { kind: 'barModel', args: [[{ value: 45 }, { value: 28 }], 73] },
          quiz: { prompt: 'A zoo has 36 owls. 19 more owls arrive. Which sum do we use?', options: [{ label: '36 + 19', ok: true }, { label: '36 − 19', ok: false }], right: 'Yes! "More arrive" means the amounts join, so we add: 36 + 19 = 55.', wrong: 'More owls arrive, so there are more of them. We add: 36 + 19 = 55.' } },
        { say: 'The whole is <b>82</b>. Sam gives <b>35</b> away; the part left is the <b>?</b>. <b>Left</b> and <b>gives away</b> mean <b>subtract</b>: 82 − 35 = <b>47</b>. <b>How many more is needed?</b> finds a gap, so that is a subtraction too.', vis: { kind: 'barModel', args: [[{ value: 35 }, { value: '?' }], 82] } },
        { say: 'Some stories have <b>two steps</b>. A bus has 120 people. 30 get off, then 45 get on. Step 1: 120 − 30 = 90. Step 2: 90 + 45 = <b>135</b>. Do one step at a time!', vis: { kind: 'barModel', args: [[{ value: 90 }, { value: 30 }], 120] },
          quiz: { prompt: 'A box has 200 beads. 50 are lost, then 20 more are added. How many now?', options: [{ label: '170', ok: true }, { label: '130', ok: false }, { label: '270', ok: false }], right: 'Yes! 200 − 50 = 150, then 150 + 20 = 170.', wrong: 'Step 1: 200 − 50 = 150. Step 2: 150 + 20 = 170.' } }
      ]
    },
    trick: {
      title: 'Draw it, name it, solve it',
      say: '<b>1.</b> Draw a bar model. <b>2.</b> Is the <b>whole</b> missing? Add the parts. Is a <b>part</b> missing? Subtract. <b>3.</b> Solve, then ask: <b>does my answer make sense?</b>',
      vis: { kind: 'barModel', args: [[{ value: 35 }, { value: '?' }], 82] },
      example: 'Whole 82, part 35, other part ? → 82 − 35 = <b>47</b>'
    },
    gen: {
      1: function(){
        const f = randInt(0, 2);
        if(f === 0) return solveQ(oneStep(pick(['add', 'sub']), false, false), true);
        if(f === 1) return chooseOp(oneStep(pick(['add', 'sub']), false, false));
        return solveQ(oneStep(pick(['add', 'sub']), false, chance(0.35)), false);
      },
      2: function(){
        const f = randInt(0, 3);
        if(f === 0) return solveQ(oneStep(pick(['add', 'sub']), true, false), true);
        if(f === 1) return sentenceWithAnswer(oneStep(pick(['add', 'sub']), true, chance(0.3)));
        if(f === 2) return solveQ(oneStep(pick(['add', 'sub']), true, true), false);
        return solveQ(oneStep(pick(['add', 'sub']), chance(0.5), false), false);
      },
      3: function(){
        const f = randInt(0, 3);
        if(f === 0){ const q = twoStep(pick(['A', 'B', 'C']), false), wl = twoWrongs(q);
          return numeric({ prompt: q.text + ' Type your answer.', answer: q.ans, hint: 'Do the story one step at a time. Write the first answer down before you start the second step.', explain: twoExplain(q), truth: twoTruth(q), wrong: wrongNum(wl) }); }
        if(f === 1){ const q = twoStep('D', true), wl = twoWrongs(q);
          return numeric({ prompt: q.text + ' Type your answer.', unit: 'p', answer: q.ans, hint: 'Take the toy’s cost away first. Then take the sweet’s cost away from what is left.', explain: twoExplain(q), truth: twoTruth(q), wrong: wrongNum(wl) }); }
        if(f === 2){ // which number sentence solves it?
          const q = twoStep(pick(['A', 'B', 'C']), false), s1 = q.sent[0][0], s2 = q.sent[1][0];
          const flip = function(s){ return s === '+' ? '−' : '+'; };
          const correct = sentStr(q.a, s1, q.b, s2, q.c);
          const cand = [[s1, flip(s2)], [flip(s1), s2], [flip(s1), flip(s2)]].map(function(p){ return sentStr(q.a, p[0], q.b, p[1], q.c); });
          const val = function(sg1, sg2){ return q.a + (sg1 === '+' ? 1 : -1) * q.b + (sg2 === '+' ? 1 : -1) * q.c; };
          return mcq({ prompt: q.text + '<br>Which number sentence solves it?', correct: opt(K.text(correct), correct), keepOrder: true, count: 4,
            distractors: [[s1, flip(s2)], [flip(s1), s2], [flip(s1), flip(s2)]].filter(function(p){ return val(p[0], p[1]) !== q.ans; }).map(function(p){ return opt(K.text(sentStr(q.a, p[0], q.b, p[1], q.c)), sentStr(q.a, p[0], q.b, p[1], q.c), 'Read the story again. Does the ' + (p[0] !== s1 ? 'first' : 'second') + ' amount get added or taken away? This sentence has the wrong sign.'); }),
            hint: 'Decide for each amount: is it joined on (add) or taken off (subtract)? Keep the amounts in the order of the story.',
            explain: ex('Choosing the number sentence', ['First amount: <b>' + q.b + '</b> is ' + (s1 === '+' ? 'added' : 'taken away') + '.', 'Second amount: <b>' + q.c + '</b> is ' + (s2 === '+' ? 'added' : 'taken away') + '.', 'So the sentence is <b>' + correct + '</b>, which equals ' + q.ans + '. ✅']),
            truth: K.text(q.a + (s1 === '+' ? ' + ' : ' − ') + q.b + (s2 === '+' ? ' + ' : ' − ') + q.c) });
        }
        const p = oneStep(pick(['add', 'sub']), true, chance(0.4)); return typedOne(p, true);
      }
    }
  });
  /* exposed for the sample script only */
})();
