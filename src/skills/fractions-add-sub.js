/* frac-add-sub — add and subtract fractions with the same denominator, within one whole (2/7 + 3/7, 5/8 - 2/8).
   Registers V.extra.fracMix: ONE bar of d parts. Addition: first a parts blue, next b parts purple. Subtraction: a parts
   coloured, the last b of them crossed out. The decoder counts the parts of each class from the drawing. */
(function(){
  function F(n, d){ return fracHTML(n, d); }
  function fK(n, d){ return K.frac(n, d); }
  const INK = 'var(--vis-ink,#1B1B2F)', BLUE = 'var(--vis-a,#4F8FE8)', PURP = 'var(--vis-b,#9B51E0)';

  function mixRender(a, b, d, mode){
    const Wd = 300, H = 52, seg = (Wd - 8) / d;
    let s = '';
    for(let i = 0; i < d; i++){
      let cls, fill;
      if(mode === 'add'){ cls = i < a ? 'add1' : i < a + b ? 'add2' : 'off'; fill = i < a ? BLUE : i < a + b ? PURP : '#fff'; }
      else { cls = i < a - b ? 'keep' : i < a ? 'x' : 'off'; fill = i < a ? BLUE : '#fff'; }
      const x = Math.round((4 + i * seg) * 100) / 100, w = Math.round(seg * 100) / 100;
      s += '<rect class="mseg ' + cls + '" x="' + x + '" y="6" width="' + w + '" height="' + (H - 12) + '" fill="' + fill + '" stroke="' + INK + '" stroke-width="2.5"/>';
      if(cls === 'x') s += '<line class="xl" x1="' + (x + 4) + '" y1="10" x2="' + (x + w - 4) + '" y2="' + (H - 10) + '" stroke="#EB5757" stroke-width="3.5"/><line class="xl" x1="' + (x + w - 4) + '" y1="10" x2="' + (x + 4) + '" y2="' + (H - 10) + '" stroke="#EB5757" stroke-width="3.5"/>';
    }
    return '<svg viewBox="0 0 ' + Wd + ' ' + H + '" width="' + Wd + '" role="img" style="max-width:100%;height:auto;display:block;margin:0 auto" xmlns="http://www.w3.org/2000/svg">' + s + '</svg>';
  }
  /* -> {mode, a, b, den}: add = (blue parts, purple parts); sub = (coloured parts incl. crossed, crossed parts) */
  V.decodeFracMix = function(html){
    const c = function(cls){ return (html.match(new RegExp('class="mseg ' + cls + '"', 'g')) || []).length; };
    const add1 = c('add1'), add2 = c('add2'), keep = c('keep'), x = c('x'), off = c('off');
    if(add1 + add2 > 0 || (keep + x === 0)) return { mode: 'add', a: add1, b: add2, den: add1 + add2 + off };
    return { mode: 'sub', a: keep + x, b: x, den: keep + x + off };
  };
  V.extra.fracMix = {
    render: mixRender,
    verify: function(args, html){ const r = V.decodeFracMix(html); return (r.mode === args[3] && r.a === args[0] && r.b === args[1] && r.den === args[2]) ? '' : 'fracMix draws ' + r.mode + ' ' + r.a + ',' + r.b + ' of ' + r.den; }
  };
  function mixResult(html){ const r = V.decodeFracMix(html); return { num: r.mode === 'add' ? r.a + r.b : r.a - r.b, den: r.den }; }

  const NAMES = ['Ana', 'Marcus', 'Sophie', 'Ivan', 'Lucy', 'Diego', 'Ellen', 'Tom', 'Aisha', 'Kai', 'Mei', 'Leo'];
  const DN = { 3: 'thirds', 4: 'quarters', 5: 'fifths', 6: 'sixths', 7: 'sevenths', 8: 'eighths', 9: 'ninths', 10: 'tenths' };
  function two(){ const a = pick(NAMES); let b = pick(NAMES); while(b === a) b = pick(NAMES); return [a, b]; }

  function pool(d, skipKeys, why){
    const out = [];
    for(let k = 1; k < d; k++) out.push(opt(fK(k, d), F(k, d), why));
    return shuffle(out);
  }
  function addExplain(a, b, d){
    return ex(a + '/' + d + ' + ' + b + '/' + d, [
      'Both fractions are in <b>' + DN[d] + '</b>, so the parts are the same size. The bottom number stays <b>' + d + '</b>.',
      'Add the top numbers: ' + a + ' + ' + b + ' = <b>' + (a + b) + '</b>.',
      a + '/' + d + ' + ' + b + '/' + d + ' = <b>' + (a + b) + '/' + d + '</b>. ✅'
    ]);
  }
  function subExplain(a, b, d){
    return ex(a + '/' + d + ' − ' + b + '/' + d, [
      'Both fractions are in <b>' + DN[d] + '</b>, so the bottom number stays <b>' + d + '</b>.',
      'Take away the top numbers: ' + a + ' − ' + b + ' = <b>' + (a - b) + '</b>.',
      a + '/' + d + ' − ' + b + '/' + d + ' = <b>' + (a - b) + '/' + d + '</b>. ✅'
    ]);
  }

  function addWrongs(a, b, d){
    const w = [
      opt(fK(a + b, 2 * d), F(a + b, 2 * d), 'You added the bottom numbers too. The parts stay the same size (' + DN[d] + '), so the bottom stays ' + d + '.'),
      opt(fK(a + b, a + b + 1), F(a + b, a + b + 1), 'The bottom number is the size of the parts (' + d + '). It does not change when we add.'),
      opt(fK(Math.abs(a - b) || 1, d), F(Math.abs(a - b) || 1, d), 'You took away instead of adding.'),
      opt(fK(a, d), F(a, d), 'That is only the first amount. Add the second one too.'),
      opt(fK(b, d), F(b, d), 'That is only the second amount. Add the first one too.')
    ];
    if(a * b < d) w.push(opt(fK(a * b, d), F(a * b, d), 'You multiplied. We ADD the top numbers.'));
    return w.filter(function(o){ return !/f:\d+\/1$/.test(o.key) && !/f:\d+\/0/.test(o.key); }).concat(pool(d, null, 'Add the top numbers carefully: ' + a + ' + ' + b + '.'));
  }
  function subWrongs(a, b, d){
    const w = [];
    if(a + b < d) w.push(opt(fK(a + b, d), F(a + b, d), 'You added instead of taking away.'));
    w.push(opt(fK(a, d), F(a, d), 'That is what you started with. You still need to take ' + b + ' away.'));
    w.push(opt(fK(b, d), F(b, d), 'That is the amount taken away, not what is left.'));
    if(d - b >= 2) w.push(opt(fK(a - b, d - b), F(a - b, d - b), 'You took the bottom numbers away too. The parts stay the same size, so the bottom stays ' + d + '.'));
    w.push(opt(fK(a - b, d + 1), F(a - b, d + 1), 'The bottom number is the size of the parts. It does not change.'));
    return w.filter(function(o){ return !/f:\d+\/1$/.test(o.key); }).concat(pool(d, null, 'Take away the top numbers carefully: ' + a + ' − ' + b + '.'));
  }

  function pictureAdd(a, b, d){
    const vis = mixRender(a, b, d, 'add');
    return mcq({
      prompt: 'The bar shows ' + F(a, d) + ' (blue) and ' + F(b, d) + ' (purple). What is ' + F(a, d) + ' + ' + F(b, d) + '?', visual: vis,
      correct: opt(fK(a + b, d), F(a + b, d)), distractors: addWrongs(a, b, d), keepOrder: true,
      hint: 'The parts are all ' + DN[d] + '. Count the coloured parts, or add the top numbers. The bottom number stays the same.',
      explain: addExplain(a, b, d),
      truth: fK((a + b) * 3, d * 3),
      decode: function(){ const r = mixResult(vis); return fK(r.num, r.den); }
    });
  }
  function pictureSub(a, b, d){
    const vis = mixRender(a, b, d, 'sub');
    return mcq({
      prompt: 'The bar shows ' + F(a, d) + ' with ' + plural(b, 'part') + ' crossed out. What is ' + F(a, d) + ' − ' + F(b, d) + '?', visual: vis,
      correct: opt(fK(a - b, d), F(a - b, d)), distractors: subWrongs(a, b, d), keepOrder: true,
      hint: 'Count the coloured parts that are NOT crossed out. Or take ' + b + ' away from ' + a + '. The bottom number stays the same.',
      explain: subExplain(a, b, d),
      truth: fK((a - b) * 3, d * 3),
      decode: function(){ const r = mixResult(vis); return fK(r.num, r.den); }
    });
  }
  function wordAdd(a, b, d, withPic){
    const nm = two(), food = pick(['pizza', 'chocolate bar', 'cake', 'pie']);
    const vis = withPic ? mixRender(a, b, d, 'add') : '';
    return mcq({
      prompt: nm[0] + ' eats ' + F(a, d) + ' of a ' + food + '. ' + nm[1] + ' eats ' + F(b, d) + ' of the same ' + food + '. What fraction did they eat altogether?', visual: vis,
      correct: opt(fK(a + b, d), F(a + b, d)), distractors: addWrongs(a, b, d), keepOrder: true,
      hint: 'Add the top numbers. The bottom number stays ' + d + ' because the parts are all ' + DN[d] + '.', explain: addExplain(a, b, d),
      truth: fK((a + b) * 2, d * 2),
      decode: withPic ? function(){ const r = mixResult(vis); return fK(r.num, r.den); } : undefined
    });
  }
  function wordSub(a, b, d, withPic){
    const nm = pick(NAMES), item = pick(['jug', 'tank', 'bottle']);
    const form = pick([
      'A ' + item + ' is ' + F(a, d) + ' full of juice. ' + nm + ' drinks ' + F(b, d) + ' of the ' + item + '. What fraction is left?',
      nm + ' has ' + F(a, d) + ' of a ribbon. ' + nm + ' cuts off ' + F(b, d) + ' of it. What fraction of the ribbon is left?'
    ]);
    const vis = withPic ? mixRender(a, b, d, 'sub') : '';
    return mcq({
      prompt: form, visual: vis,
      correct: opt(fK(a - b, d), F(a - b, d)), distractors: subWrongs(a, b, d), keepOrder: true,
      hint: 'Take away the top numbers: ' + a + ' − ' + b + '. The bottom number stays ' + d + '.', explain: subExplain(a, b, d),
      truth: fK((a - b) * 2, d * 2),
      decode: withPic ? function(){ const r = mixResult(vis); return fK(r.num, r.den); } : undefined
    });
  }

  function topNumQ(isAdd, a, b, d, withPic){
    const vis = withPic ? mixRender(a, b, d, isAdd ? 'add' : 'sub') : '';
    const ans = isAdd ? a + b : a - b;
    return mcqNum({
      prompt: F(a, d) + (isAdd ? ' + ' : ' − ') + F(b, d) + ' = ?/' + d + '. What is the missing top number?', visual: vis, answer: ans,
      wrong: isAdd
        ? [{ v: a * b, why: 'You multiplied. We ADD the top numbers.' }, { v: Math.abs(a - b), why: 'You took away instead of adding.' }, { v: a + b + d, why: 'You added the bottom number too. Only the top numbers are added.' }]
        : [{ v: a + b, why: 'You added instead of taking away.' }, { v: a, why: 'That is where you started. You still need to take ' + b + ' away.' }, { v: b, why: 'That is the amount taken away, not what is left.' }],
      nearby: [1, -1, 2, -2, 3], valid: function(v){ return v >= 1 && v <= d; },
      hint: 'The bottom number stays ' + d + '. ' + (isAdd ? 'Add' : 'Take away') + ' the top numbers: ' + a + (isAdd ? ' + ' : ' − ') + b + '.',
      explain: isAdd ? addExplain(a, b, d) : subExplain(a, b, d),
      truth: isAdd ? (a * 10 + b * 10) / 10 : (a * 10 - b * 10) / 10,
      decode: withPic ? function(){ return mixResult(vis).num; } : undefined
    });
  }

  function typedTop(isAdd, a, b, d){
    const ans = isAdd ? a + b : a - b;
    return numeric({
      prompt: F(a, d) + (isAdd ? ' + ' : ' − ') + F(b, d) + ' = ?/' + d + '. Type the missing top number.', answer: ans,
      hint: 'The parts are all ' + DN[d] + ', so the bottom stays ' + d + '. ' + (isAdd ? 'Add' : 'Take away') + ' the top numbers.',
      explain: isAdd ? addExplain(a, b, d) : subExplain(a, b, d), truth: isAdd ? a + b : a - b,
      wrong: function(v){ return isAdd ? (v === a * b ? 'You multiplied. We ADD the top numbers.' : v === Math.abs(a - b) ? 'You took away instead of adding.' : '') : (v === a + b ? 'You added instead of taking away.' : v === b ? 'That is the amount taken away, not what is left.' : ''); }
    });
  }
  function typedBottom(a, b, d){
    return numeric({
      prompt: F(a, d) + ' + ' + F(b, d) + ' = ' + (a + b) + '/?. Type the missing bottom number.', answer: d,
      hint: 'The parts are the same size before and after adding. Does the size of the parts change?',
      explain: ex('The bottom stays the same', ['Both fractions are in ' + DN[d] + ', so each part is 1/' + d + '.', 'Adding does not change the size of the parts, so the bottom number stays <b>' + d + '</b>.', a + '/' + d + ' + ' + b + '/' + d + ' = ' + (a + b) + '/<b>' + d + '</b>. ✅']),
      truth: (d * 10) / 10,
      wrong: function(v){ return v === 2 * d ? 'You added the bottom numbers (' + d + ' + ' + d + '). The parts stay the same size, so the bottom stays ' + d + '.' : ''; }
    });
  }
  function missingQ(){
    const d = randInt(5, 10), isAdd = chance(0.5);
    if(isAdd){
      const total = randInt(3, d - 1), a = randInt(1, total - 1), b = total - a, hideFirst = chance(0.5);
      const known = hideFirst ? b : a, ans = hideFirst ? a : b;
      return numeric({
        prompt: hideFirst ? '?/' + d + ' + ' + known + '/' + d + ' = ' + total + '/' + d + '. Type the missing top number.' : known + '/' + d + ' + ?/' + d + ' = ' + total + '/' + d + '. Type the missing top number.', answer: ans,
        hint: 'The bottom stays ' + d + '. What do you add to ' + known + ' to make ' + total + '?',
        explain: ex('Finding the missing part', ['The bottom number stays <b>' + d + '</b>, so just look at the top numbers.', known + ' + ? = ' + total + ', so ? = ' + total + ' − ' + known + ' = <b>' + ans + '</b>.', 'Check: ' + ans + ' + ' + known + ' = ' + total + '. The missing number is <b>' + ans + '</b>. ✅']),
        truth: total - known,
        wrong: function(v){ return v === total + known ? 'You added. The total is already ' + total + ', so take ' + known + ' away.' : v === total ? 'That is the total. We want the missing part.' : ''; }
      });
    }
    const a = randInt(3, d - 1), b = randInt(1, a - 1), left = a - b;
    return numeric({
      prompt: a + '/' + d + ' − ?/' + d + ' = ' + left + '/' + d + '. Type the missing top number.', answer: b,
      hint: 'The bottom stays ' + d + '. What do you take away from ' + a + ' to leave ' + left + '?',
      explain: ex('Finding what was taken away', ['The bottom number stays <b>' + d + '</b>, so just look at the top numbers.', a + ' − ? = ' + left + ', so ? = ' + a + ' − ' + left + ' = <b>' + b + '</b>.', 'Check: ' + a + ' − ' + b + ' = ' + left + '. The missing number is <b>' + b + '</b>. ✅']),
      truth: a - left,
      wrong: function(v){ return v === left ? 'That is what is left. We want the amount taken away.' : v === a + left ? 'You added. Think: what do I take from ' + a + ' to get ' + left + '?' : ''; }
    });
  }
  function wholeQ(){
    const d = pick([4, 5, 6, 8, 10]), a = randInt(1, d - 1), ans = d - a;
    return numeric({
      prompt: F(a, d) + ' + ?/' + d + ' makes one whole. Type the missing top number.', answer: ans,
      visual: mixRender(a, 0, d, 'add'),
      hint: 'One whole is ' + d + '/' + d + '. How many ' + DN[d] + ' are still missing?',
      explain: ex('Making one whole', ['One whole is <b>' + d + '/' + d + '</b>.', 'We have ' + a + '/' + d + ', so we need ' + d + ' − ' + a + ' = <b>' + ans + '</b> more.', a + '/' + d + ' + ' + ans + '/' + d + ' = ' + d + '/' + d + ' = 1 whole. The missing number is <b>' + ans + '</b>. ✅']),
      truth: (d * d - a * d) / d, decode: function(){ const r = V.decodeFracMix(mixRender(a, 0, d, 'add')); return r.den - r.a; },
      wrong: function(v){ return v === d ? 'That is the bottom number. We want the number of ' + DN[d] + ' still needed.' : v === a ? 'That is the number we already have.' : ''; }
    });
  }
  function leftQ(){
    const d = pick([6, 8, 9, 10]), a = randInt(1, Math.floor((d - 2) / 2) + 1), b = randInt(1, d - 1 - a), left = d - a - b;
    const nm = two(), food = pick(['pizza', 'chocolate bar', 'cake']);
    return numeric({
      prompt: nm[0] + ' eats ' + F(a, d) + ' of a ' + food + ' and ' + nm[1] + ' eats ' + F(b, d) + '. How many ' + DN[d] + ' are LEFT?', answer: left,
      hint: 'Step 1: add what they ate. Step 2: take it away from the whole (' + d + '/' + d + ').',
      explain: ex('Two steps', ['They ate ' + a + '/' + d + ' + ' + b + '/' + d + ' = <b>' + (a + b) + '/' + d + '</b>.', 'The whole ' + food + ' is ' + d + '/' + d + ', so ' + d + ' − ' + (a + b) + ' = <b>' + left + '</b>.', left + ' ' + DN[d] + ' are left. ✅']),
      truth: d - (a + b),
      wrong: function(v){ return v === a + b ? 'That is how many they ATE. We want how many are left.' : ''; }
    });
  }

  function sums(dMin, dMax){
    const d = randInt(dMin, dMax), total = randInt(3, d - 1), a = randInt(1, total - 1);
    return [a, total - a, d];
  }
  function diffs(dMin, dMax){
    const d = randInt(dMin, dMax), a = randInt(3, d - 1), b = randInt(1, a - 1);
    return [a, b, d];
  }

  registerSkill({
    id: 'frac-add-sub', strand: 'fractions', name: 'Adding and subtracting fractions', emoji: '➕', year: 3, order: 480, prereq: ['frac-nonunit'],
    lesson: {
      title: 'Same size parts',
      steps: [
        { say: 'When two fractions have the <b>same bottom number</b>, the parts are the same size, so we can add them! Blue is <b>2/7</b> and purple is <b>3/7</b>. Together that is <b>5</b> sevenths.', vis: { kind: 'fracMix', args: [2, 3, 7, 'add'] } },
        { say: 'Only add the <b>top</b> numbers: 2 + 3 = 5. The <b>bottom stays 7</b>, because the parts are still sevenths. So <b>2/7 + 3/7 = 5/7</b>.', vis: { kind: 'fracMix', args: [2, 3, 7, 'add'] } },
        { say: 'Your turn! Blue is 1/5 and purple is 3/5. Add the top numbers and keep the bottom number the same.', vis: { kind: 'fracMix', args: [1, 3, 5, 'add'] },
          quiz: { prompt: 'The bar shows 1/5 + 3/5. What is the answer?', options: [{ label: '4/5', ok: true }, { label: '4/10', ok: false }, { label: '3/5', ok: false }], right: 'Yes! 1 + 3 = 4 and the bottom stays 5.', wrong: 'Add the tops: 1 + 3 = 4. The bottom stays 5 because the parts are still fifths. So 4/5.' } },
        { say: 'To <b>take away</b>, cross parts out. We start with <b>5/8</b> and take away <b>2/8</b>. Crossed-out parts do not count. <b>3</b> parts are left: <b>5/8 − 2/8 = 3/8</b>.', vis: { kind: 'fracMix', args: [5, 2, 8, 'sub'] },
          quiz: { prompt: 'What is 5/8 − 2/8?', options: [{ label: '3/8', ok: true }, { label: '7/8', ok: false }, { label: '3/0', ok: false }], right: 'Yes! 5 − 2 = 3 and the bottom stays 8.', wrong: 'Take away the tops: 5 − 2 = 3. The bottom stays 8. So 3/8.' } },
        { say: 'Adding can fill up a whole bar! <b>3/8 + 5/8 = 8/8</b>, and 8/8 is <b>one whole</b>. In this skill our answers stay within one whole.', vis: { kind: 'fracMix', args: [3, 5, 8, 'add'] } }
      ]
    },
    trick: {
      title: 'Add the apples',
      say: 'Think of the bottom number as the <b>name</b> of the parts, like “apples”. 2 sevenths + 3 sevenths is like 2 apples + 3 apples = 5 apples. The <b>name stays the same</b>, only the top number changes!',
      vis: { kind: 'fracMix', args: [2, 3, 7, 'add'] },
      example: '2/7 + 3/7 → 2 + 3 = 5 → <b>5/7</b> (bottom stays 7)'
    },
    gen: {
      1: function(){
        const r = randInt(0, 3);
        if(r <= 1){ const s = sums(4, 8); return pictureAdd(s[0], s[1], s[2]); }
        const t = diffs(4, 8);
        return pictureSub(t[0], t[1], t[2]);
      },
      2: function(){
        const r = randInt(0, 5);
        if(r === 0){ const s = sums(5, 10); return wordAdd(s[0], s[1], s[2], chance(0.3)); }
        if(r === 1){ const t = diffs(5, 10); return wordSub(t[0], t[1], t[2], chance(0.3)); }
        if(r === 2){ const s = sums(5, 10); return topNumQ(true, s[0], s[1], s[2], chance(0.4)); }
        if(r === 3){ const t = diffs(5, 10); return topNumQ(false, t[0], t[1], t[2], chance(0.4)); }
        if(r === 4){ const s = sums(6, 10); return pictureAdd(s[0], s[1], s[2]); }
        const t = diffs(6, 10); return pictureSub(t[0], t[1], t[2]);
      },
      3: function(){
        const r = randInt(0, 7);
        if(r === 0){ const s = sums(6, 10); return typedTop(true, s[0], s[1], s[2]); }
        if(r === 1){ const t = diffs(6, 10); return typedTop(false, t[0], t[1], t[2]); }
        if(r === 2){ const s = sums(5, 10); return typedBottom(s[0], s[1], s[2]); }
        if(r === 3 || r === 4) return missingQ();
        if(r === 5) return wholeQ();
        if(r === 6) return leftQ();
        const s = sums(6, 10); return wordAdd(s[0], s[1], s[2], false);
      }
    }
  });
})();
