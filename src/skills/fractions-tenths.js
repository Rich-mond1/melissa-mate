/* frac-tenths — tenths: a bar of 10 parts, counting in tenths, dividing by 10, tenths on a number line.
   Bridge to 0.1 only in tier 3 ("we can also write 1/10 as 0.1"). */
(function(){
  function F(n, d){ return fracHTML(n, d); }
  function fK(n, d){ return K.frac(n, d); }
  const NAMES = ['Ana', 'Marcus', 'Sophie', 'Ivan', 'Lucy', 'Diego', 'Ellen', 'Tom', 'Aisha', 'Kai', 'Mei', 'Leo'];
  const THINGS = ['stickers', 'marbles', 'shells', 'sweets', 'football cards', 'beads', 'stamps', 'pencils'];
  const TENTHS = ['', 'one tenth', 'two tenths', 'three tenths', 'four tenths', 'five tenths', 'six tenths', 'seven tenths', 'eight tenths', 'nine tenths'];

  function line10(n, o){ // 0-1 line with 10 steps; only 0 and 1 labelled; marker at n/10
    o = o || {};
    return V.numberLine({ min: 0, max: 1, minor: 0.1, major: 1, width: 300, marks: [{ value: n / 10, kind: o.dot ? 'dot' : 'q' }], labels: function(v){ return v < 0.5 ? '0' : '1'; } });
  }
  function readTenths(html){ return { num: Math.round(V.decodeNumberLine(html) * (V.countTicks(html) - 1)), den: V.countTicks(html) - 1 }; }

  /* distractors for "which fraction" with tenths */
  function fracWrongs(n, why1){
    const w = [
      { n: 10 - n, d: 10, why: 'That counts the WHITE parts (or reads from the other end). Count from 0 / count the coloured parts.' },
      { n: n, d: 9, why: 'The bar has 10 equal parts, so the bottom number is 10, not 9.' },
      { n: 10, d: n, why: 'You flipped it. The top number is the parts we have, the bottom is 10.' },
      { n: 1, d: 10, why: 'That is only ONE tenth. Count every one.' }
    ];
    const pool = [];
    for(let k = 1; k < 10; k++) pool.push({ n: k, d: 10, why: why1 });
    return w.concat(shuffle(pool)).filter(function(x){ return x.d >= 2 && x.n >= 1 && x.n < x.d || (x.n > x.d && x.d >= 2); });
  }

  function barQ(n){
    const vis = V.fractionBar(n, 10);
    return mcq({
      prompt: 'The bar is cut into 10 equal parts. What fraction is coloured?', visual: vis,
      correct: opt(fK(n, 10), F(n, 10)), distractors: fracWrongs(n, 'Count the coloured parts again. The top number is how many are coloured.').map(function(x){ return opt(fK(x.n, x.d), F(x.n, x.d), x.why); }), keepOrder: true,
      hint: 'There are 10 parts in all (bottom number). Count only the coloured ones for the top number.',
      explain: ex('Reading tenths', ['The bar has <b>10</b> equal parts, so the bottom number is 10 (tenths).', '<b>' + plural(n, 'part') + '</b> ' + (n === 1 ? 'is' : 'are') + ' coloured.', 'So ' + TENTHS[n] + ' is coloured: <b>' + n + '/10</b>. ✅']),
      truth: fK(n * 3, 30),
      decode: function(){ const r = V.decodeFractionBar(vis); return fK(r.num, r.den); }
    });
  }
  function wholeQ(){
    const vis = V.fractionBar(10, 10);
    return mcqNum({
      prompt: 'The whole bar is coloured. How many tenths make one whole?', visual: vis, answer: 10,
      wrong: [{ v: 1, why: 'One whole, yes — but we are counting TENTHS. There are 10 of them.' }, { v: 9, why: 'Count every part: there are 10, not 9.' }, { v: 100, why: 'That is too many. A whole is cut into 10 equal parts.' }],
      nearby: [1, -1, 2, 5, -5],
      hint: 'Count all the coloured parts in the bar.',
      explain: ex('Tenths in a whole', ['The bar is cut into <b>10</b> equal parts.', 'All of them are coloured, so that is 10/10.', '<b>10</b> tenths make one whole. ✅']),
      truth: 10, decode: function(){ return V.decodeFractionBar(vis).den; }
    });
  }
  function countQ(tier){
    const down = tier === 3 && chance(0.4);
    const len = 5, start = down ? randInt(5, 9) : randInt(1, 5);
    const seq = []; for(let i = 0; i < len; i++) seq.push(down ? start - i : start + i);
    const hole = tier === 1 ? len - 1 : randInt(1, len - 2);
    const m = seq[hole];
    const shown = seq.map(function(k, i){ return i === hole ? '?' : F(k, 10); });
    const ds = [];
    [[m + 1, 'You skipped a tenth.'], [m - 1, 'You went the wrong way — or repeated a tenth.'], [m + 2, 'That jumps too far. Count on one tenth at a time.'], [m - 2, 'That is too small. Count on one tenth at a time.']].forEach(function(x){
      if(x[0] >= 1 && x[0] <= 9) ds.push(opt(fK(x[0], 10), F(x[0], 10), x[1]));
    });
    for(let k = 1; k <= 9; k++) ds.push(opt(fK(k, 10), F(k, 10), 'Check the pattern: each fraction changes by one tenth.'));
    return mcq({
      prompt: (down ? 'Count back in tenths. ' : 'Count on in tenths. ') + 'What is the missing fraction?', visual: '<div style="font-size:22px;font-weight:800;text-align:center;line-height:2">' + shown.join(' , ') + '</div>',
      correct: opt(fK(m, 10), F(m, 10)), distractors: ds, keepOrder: true,
      hint: 'The bottom number stays 10. The top number goes ' + (down ? 'down' : 'up') + ' by 1 each time.',
      explain: ex('Counting in tenths', ['The bottom number stays <b>10</b> because every part is a tenth.', 'The top number goes ' + (down ? 'down' : 'up') + ' by 1: ' + seq.join(', ') + '.', 'The missing fraction is <b>' + m + '/10</b>. ✅']),
      truth: fK(m * 7, 70)
    });
  }
  function lineQ(n){
    const vis = line10(n);
    return mcq({
      prompt: 'The number line from 0 to 1 is cut into 10 equal steps. What fraction is the ? at?', visual: vis,
      correct: opt(fK(n, 10), F(n, 10)), keepOrder: true,
      distractors: [
        n + 1 < 10 ? opt(fK(n + 1, 10), F(n + 1, 10), 'You counted the 0 mark as a step. Count the jumps from 0.') : null,
        opt(fK(10 - n, 10), F(10 - n, 10), 'You counted from the 1. Count the steps from 0.'),
        opt(fK(n, 11), F(n, 11), 'You counted the tick marks. There are 10 equal steps, so the bottom is 10.'),
        n - 1 >= 1 ? opt(fK(n - 1, 10), F(n - 1, 10), 'Count the jumps again — you are one short.') : null
      ].filter(Boolean).concat([1, 2, 3, 4, 6, 7, 8, 9].map(function(k){ return opt(fK(k, 10), F(k, 10), 'Count the jumps from 0 to the ? carefully.'); })),
      hint: 'Count the jumps from 0 to the ?. Each jump is one tenth.',
      explain: ex('Tenths on the line', ['From 0 to 1 there are <b>10</b> equal steps, so each step is 1/10.', 'The ? is <b>' + plural(n, 'step') + '</b> from 0.', 'It is at <b>' + n + '/10</b> (' + TENTHS[n] + '). ✅']),
      truth: fK(n * 5, 50),
      decode: function(){ const r = readTenths(vis); return fK(r.num, r.den); }
    });
  }
  function lineTyped(n){
    const vis = line10(n);
    return numeric({
      prompt: 'The ? is at ?/10 on this number line. Type the missing top number.', visual: vis, answer: n,
      hint: 'Count the jumps from 0 to the ?. Each jump is one tenth.',
      explain: ex('Counting tenths', ['Each step is 1/10.', 'The ? is <b>' + plural(n, 'step') + '</b> from 0.', 'It is at ' + n + '/10, so the missing number is <b>' + n + '</b>. ✅']),
      truth: n, decode: function(){ return readTenths(vis).num; },
      wrong: function(v){ return v === n + 1 ? 'You counted the 0 mark. Count the jumps instead.' : v === 10 - n ? 'You counted from the 1. Count from 0.' : ''; }
    });
  }

  function divExplain(n, per, total){
    return ex(n + '/10 of ' + total, [
      'The bottom number is <b>10</b>, so share ' + total + ' into 10 equal groups: ' + total + ' ÷ 10 = <b>' + per + '</b> in each group.',
      n === 1 ? 'The top number is 1, so take 1 group: <b>' + per + '</b>.' : 'The top number is ' + n + ', so take ' + n + ' groups: ' + n + ' × ' + per + ' = <b>' + (n * per) + '</b>.',
      n + '/10 of ' + total + ' is <b>' + (n * per) + '</b>. ✅'
    ]);
  }
  function groupsQ(per){
    const total = per * 10, vis = V.groups(10, per);
    return mcqNum({
      prompt: total + ' counters are shared equally into 10 groups. How many counters are in each group? (That is 1/10 of ' + total + '.)', visual: vis, answer: per,
      wrong: [{ v: 10, why: 'That is the number of groups. We want how many are IN each group.' }, { v: total, why: 'That is all the counters. Share them into 10 groups.' }],
      nearby: [1, -1, 2, -2, 3],
      hint: 'Count the counters in just ONE group. Or divide ' + total + ' by 10.',
      explain: divExplain(1, per, total),
      truth: total / 10, decode: function(){ return V.decodeGroups(vis).per; }
    });
  }
  function divWordQ(n, per, typed){
    const total = per * 10, a = pick(NAMES), t = pick(THINGS);
    const prompt = pick([
      a + ' has ' + total + ' ' + t + '. ' + a + ' gives ' + F(n, 10) + ' of them away. How many ' + t + ' does ' + a + ' give away?',
      'A box has ' + total + ' ' + t + '. ' + F(n, 10) + ' of them are gold. How many are gold?'
    ]);
    const ans = n * per;
    if(typed) return numeric({
      prompt: prompt, answer: ans, hint: 'Divide ' + total + ' by 10 to find 1/10. Then multiply by the top number.', explain: divExplain(n, per, total), truth: (total * n) / 10,
      wrong: function(v){ return (n > 1 && v === per) ? 'You found 1/10 (' + per + '). Now multiply by the top number ' + n + '.' : v === total * 10 ? 'You multiplied by 10. Dividing by 10 makes the number smaller.' : v === 10 ? 'That is the bottom number, not the answer.' : ''; }
    });
    const wr = [{ v: total * 10, why: 'You multiplied by 10. Finding a tenth means DIVIDING by 10.' }, { v: 10, why: 'That is the bottom number of the fraction, not the answer.' }];
    if(n > 1) wr.unshift({ v: per, why: 'You found 1/10 (' + per + '). Now multiply by the top number ' + n + '.' });
    wr.push({ v: total, why: 'That is the whole amount. A fraction of it is smaller.' }, { v: total - 10, why: 'You took 10 away. To find a tenth, divide by 10.' });
    return mcqNum({
      prompt: prompt, answer: ans, wrong: wr, nearby: [1, -1, 2, -2, 5, 10],
      hint: 'Divide ' + total + ' by 10 to find 1/10' + (n > 1 ? ', then multiply by ' + n + '.' : '.'),
      explain: divExplain(n, per, total), truth: (total * n) / 10
    });
  }
  function divSumQ(per, typed){
    const total = per * 10;
    const base = { prompt: 'What is ' + total + ' ÷ 10?', hint: 'Dividing by 10 moves every digit one place smaller. Cover the 0 at the end of ' + total + '.',
      explain: ex(total + ' ÷ 10', ['Dividing by 10 makes the number 10 times smaller.', 'Cover the last 0 of ' + total + ' and you are left with <b>' + per + '</b>.', 'Check: ' + per + ' × 10 = ' + total + '. So ' + total + ' ÷ 10 = <b>' + per + '</b>. ✅']), truth: total / 10 };
    if(typed) return numeric(Object.assign({ answer: per, wrong: function(v){ return v === total * 10 ? 'You multiplied. ÷ means share into 10 groups, which makes the number smaller.' : v === total - 10 ? 'You took 10 away. Divide by 10 instead.' : ''; } }, base));
    return mcqNum(Object.assign({ answer: per, wrong: [{ v: total * 10, why: 'You multiplied by 10. ÷ 10 makes the number smaller.' }, { v: total - 10, why: 'You took 10 away. Divide by 10 instead.' }, { v: total / 5, why: 'That is dividing by 5 (or halving the number of groups). We divide by 10.' }], nearby: [1, -1, 2, -2, 10] }, base));
  }
  function decimalQ(){
    const vis = line10(1, {});
    const ds = [
      opt(K.num(0.01), '0.01', 'That is one HUNDREDTH. One tenth is 0.1.'),
      opt(K.num(1), '1.0', 'That is one whole (the same as 1). One tenth is a small part of a whole.'),
      opt(K.num(10), '10', 'That is ten wholes! One tenth is less than 1.'),
      opt(K.num(1.1), '1.1', 'That is one whole and one tenth. We want just ONE tenth.')
    ];
    return mcq({
      prompt: 'The ? is at 1/10. We can also write 1/10 as a decimal. Which one is it?', visual: vis,
      correct: opt(K.num(0.1), '0.1'), distractors: ds, count: 4, keepOrder: false,
      hint: 'Decimals use a point to show parts of a whole. One tenth is the first place after the point.',
      explain: ex('1/10 as a decimal', ['The ? is one step from 0 on a line cut into 10 steps, so it is at 1/10.', 'The first place after the decimal point shows <b>tenths</b>.', 'So 1/10 can also be written as <b>0.1</b>. ✅']),
      truth: K.num(1 / 10),
      decode: function(){ const r = readTenths(vis); return K.num(r.num / r.den); }
    });
  }
  function leftQ(){
    const per = randInt(3, 9), total = per * 10, a = pick(NAMES), t = pick(THINGS);
    return numeric({
      prompt: a + ' has ' + total + ' ' + t + ' and gives away ' + F(1, 10) + ' of them. How many are left?', answer: total - per,
      hint: 'First find 1/10 of ' + total + ' (divide by 10). Then take it away from ' + total + '.',
      explain: ex('Two steps', ['1/10 of ' + total + ' = ' + total + ' ÷ 10 = <b>' + per + '</b>.', 'Take it away: ' + total + ' − ' + per + ' = <b>' + (total - per) + '</b>.', (total - per) + ' ' + t + ' are left. ✅']),
      truth: total * 9 / 10,
      wrong: function(v){ return v === per ? 'That is the number given away. The question asks how many are LEFT.' : ''; }
    });
  }

  registerSkill({
    id: 'frac-tenths', strand: 'fractions', name: 'Tenths', emoji: '🔟', year: 3, order: 450, prereq: ['frac-number-line', 'frac-of-quantity'],
    lesson: {
      title: 'Counting in tenths',
      steps: [
        { say: 'A <b>tenth</b> is one of <b>10 equal parts</b>. We write it <b>1/10</b>. This bar has 10 equal parts and 1 of them is coloured.', vis: { kind: 'fractionBar', args: [1, 10] } },
        { say: 'We can count in tenths: 1/10, 2/10, 3/10… The bottom number stays <b>10</b> and the top number goes up. Here 3 parts are coloured: <b>3/10</b>, “three tenths”.', vis: { kind: 'fractionBar', args: [3, 10] },
          quiz: { prompt: 'What fraction of this bar is coloured?', options: [{ label: '3/10', ok: true }, { label: '7/10', ok: false }, { label: '3/7', ok: false }], right: 'Yes! 3 coloured parts out of 10 is 3/10.', wrong: 'The bar has 10 parts (bottom) and 3 are coloured (top). So 3/10.' } },
        { say: 'When all <b>10</b> tenths are coloured we have the whole bar. <b>10/10 = 1 whole</b>.', vis: { kind: 'fractionBar', args: [10, 10] } },
        { say: 'Tenths on a number line: the space from 0 to 1 is cut into <b>10</b> equal steps. The dot is <b>4</b> steps from 0, so it is at <b>4/10</b>.', vis: { kind: 'numberLine', args: [{ min: 0, max: 1, minor: 0.1, major: 1, width: 300, marks: [{ value: 0.4, kind: 'dot' }], labels: function(v){ return v < 0.5 ? '0' : '1'; } }] } },
        { say: 'To find <b>1/10</b> of a number, <b>divide by 10</b>. Share 40 counters into 10 equal groups: there are <b>4</b> in each group. So 1/10 of 40 = 4.', vis: { kind: 'groups', args: [10, 4] },
          quiz: { prompt: 'What is 1/10 of 40?', options: [{ label: '4', ok: true }, { label: '10', ok: false }, { label: '400', ok: false }], right: 'Yes! 40 ÷ 10 = 4.', wrong: 'A tenth means divide by 10: 40 ÷ 10 = 4. It gets smaller, not bigger.' } }
      ]
    },
    trick: {
      title: 'Cover the zero',
      say: 'To divide a number that ends in 0 by 10, just <b>cover the last 0</b>! The digits that are left are your answer. This works because every digit moves one place smaller.',
      vis: { kind: 'groups', args: [10, 3] },
      example: '30 ÷ 10 → cover the 0 → <b>3</b>, so 1/10 of 30 = 3'
    },
    gen: {
      1: function(){
        const r = randInt(0, 4);
        if(r === 0) return wholeQ();
        if(r === 1) return countQ(1);
        if(r === 2) return groupsQ(randInt(1, 4));
        return barQ(pick([1, 2, 3, 4, 6, 7, 8, 9]));
      },
      2: function(){
        const r = randInt(0, 5);
        if(r === 0) return barQ(randInt(1, 9));
        if(r === 1) return countQ(2);
        if(r === 2) return lineQ(randInt(1, 9));
        if(r === 3) return divSumQ(randInt(2, 9), false);
        return divWordQ(1, randInt(2, 9), false);
      },
      3: function(){
        const r = randInt(0, 6);
        if(r === 0) return decimalQ();
        if(r === 1) return divWordQ(randInt(2, 9), randInt(2, 9), true);
        if(r === 2) return divSumQ(randInt(3, 10), true);
        if(r === 3) return lineTyped(randInt(2, 9));
        if(r === 4) return leftQ();
        if(r === 5) return countQ(3);
        return divWordQ(1, randInt(3, 10), true);
      }
    }
  });
})();
