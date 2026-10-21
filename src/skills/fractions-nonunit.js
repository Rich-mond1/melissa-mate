/* frac-nonunit — fractions with a numerator bigger than 1: bars, circles and sets of counters.
   Registers a small picture kind V.extra.fracSet (counters, some coloured) with a geometry decoder. */
(function(){
  const DENS = [2, 3, 4, 5, 6, 8, 10];
  const NAMES = { 2: ['half', 'halves'], 3: ['third', 'thirds'], 4: ['quarter', 'quarters'], 5: ['fifth', 'fifths'], 6: ['sixth', 'sixths'], 8: ['eighth', 'eighths'], 10: ['tenth', 'tenths'] };
  function F(n, d){ return fracHTML(n, d); }
  function fK(n, d){ return K.frac(n, d); }
  function words(n, d){ return numWord(n) + ' ' + NAMES[d][n === 1 ? 0 : 1]; }

  /* ---- picture kind: a tray of counters, `s` coloured out of `t` ---- */
  const FINK = 'var(--vis-ink,#1B1B2F)', FBLUE = 'var(--vis-a,#4F8FE8)';
  function fracSetRender(s, t){
    const per = t > 5 ? Math.ceil(t / 2) : t, rows = Math.ceil(t / per), gap = 34;
    let inner = '';
    for(let i = 0; i < t; i++){
      inner += '<circle class="ctr ' + (i < s ? 'on' : 'off') + '" cx="' + (22 + (i % per) * gap) + '" cy="' + (22 + Math.floor(i / per) * gap) + '" r="13" fill="' + (i < s ? FBLUE : '#fff') + '" stroke="' + FINK + '" stroke-width="2.5"/>';
    }
    const w = per * gap + 10, h = rows * gap + 10;
    return '<svg viewBox="0 0 ' + w + ' ' + h + '" width="' + w + '" role="img" style="max-width:100%;height:auto;display:block;margin:0 auto" xmlns="http://www.w3.org/2000/svg">' + inner + '</svg>';
  }
  V.decodeFracSet = function(html){
    const c = html.match(/<circle[^>]*class="ctr (on|off)"/g) || [];
    return { num: c.filter(function(x){ return /ctr on/.test(x); }).length, den: c.length };
  };
  V.extra.fracSet = {
    render: fracSetRender,
    verify: function(a, html){ const r = V.decodeFracSet(html); return (r.num === a[0] && r.den === a[1]) ? '' : 'fracSet draws ' + r.num + '/' + r.den; }
  };

  function picOf(kind, n, d){ return kind === 'bar' ? V.fractionBar(n, d) : kind === 'circle' ? V.fractionCircle(n, d) : fracSetRender(n, d); }
  function readPic(html){
    if(/class="seg /.test(html)) return V.decodeFractionBar(html);
    if(/class="wedge /.test(html)) return V.decodeFractionCircle(html);
    return V.decodeFracSet(html);
  }

  /* misconception list for "name the fraction"; deep fallback pool so de-duplication by value never starves the options */
  function wrongsFor(n, d, unit, asWords){
    const w = [
      { n: d, d: n, why: 'You flipped it. The top number is how many ' + unit + ' are coloured, the bottom is ALL the ' + unit + '.' },
      { n: d - n, d: d, why: 'That counts the WHITE ' + unit + '. The top number counts the coloured ones.' },
      { n: 1, d: d, why: 'That is only ONE ' + unit.replace(/s$/, '') + '. Count every coloured one for the top number.' },
      { n: n, d: d - n, why: 'You compared coloured with white. The bottom number must count ALL the ' + unit + ', coloured and white.' }
    ];
    const same = [], other = [];
    for(let k = 1; k < d; k++) same.push({ n: k, d: d, why: 'Count the coloured ' + unit + ' carefully: there ' + isAre(n) + ' ' + n + ', not ' + k + '.' });
    shuffle(DENS).sort(function(a, b){ return Math.abs(a - d) - Math.abs(b - d); }).forEach(function(dd){ if(dd !== d) for(let k = 1; k < dd; k++) other.push({ n: k, d: dd, why: 'Count ALL the ' + unit + ' for the bottom number: there are ' + d + '.' }); });
    return w.concat(shuffle(same), shuffle(other)).filter(function(x){
      if(x.d < 2 || x.n < 1 || x.n === x.d) return false;
      if(asWords) return x.n < x.d && !!NAMES[x.d];
      return true;
    });
  }

  function nameQ(kind, n, d, asWords){
    const vis = picOf(kind, n, d);
    const what = kind === 'bar' ? 'the bar' : kind === 'circle' ? 'the pizza' : 'the counters';
    const unit = kind === 'bar' ? 'parts' : kind === 'circle' ? 'slices' : 'counters';
    const lab = asWords ? words : F;
    const ds = wrongsFor(n, d, unit, asWords).map(function(x){ return opt(fK(x.n, x.d), lab(x.n, x.d), x.why); });
    return mcq({
      prompt: asWords ? 'Which words describe the coloured part of ' + what + '?' : 'What fraction of ' + what + (kind === 'set' ? ' are' : ' is') + ' coloured?', visual: vis,
      correct: opt(fK(n, d), lab(n, d)), distractors: ds, keepOrder: true,
      hint: 'Count ALL the ' + unit + ' first (bottom number). Then count only the coloured ones (top number).',
      explain: ex('Naming the fraction', [
        'Count <b>all</b> the ' + unit + ': <b>' + d + '</b>. That is the bottom number' + (asWords ? ', so we say ' + NAMES[d][1] + '.' : '.'),
        'Count the <b>coloured</b> ' + unit + ': <b>' + n + '</b>. That is the top number.',
        'So <b>' + (asWords ? words(n, d) : n + '/' + d) + '</b> of ' + what + (kind === 'set' ? ' are' : ' is') + ' coloured' + (asWords ? ' (' + n + '/' + d + ')' : '') + '. ✅'
      ]),
      truth: fK(n * 2, d * 2),
      decode: function(){ const r = readPic(vis); return fK(r.num, r.den); }
    });
  }

  function compQ(kind, n, d){
    const vis = picOf(kind, n, d);
    const what = kind === 'bar' ? 'bar' : kind === 'circle' ? 'pizza' : 'counters';
    const unit = kind === 'bar' ? 'parts' : kind === 'circle' ? 'slices' : 'counters';
    const w = d - n;
    const list = [
      { n: n, d: d, why: 'That is the COLOURED part. The question asks about the white part.' },
      { n: w, d: n, why: 'The bottom number must count ALL the ' + unit + ', not only the coloured ones.' },
      { n: 1, d: d, why: 'That is only one ' + unit.replace(/s$/, '') + '. Count all the white ones.' },
      { n: d, d: w, why: 'You flipped it. The top number is how many white ' + unit + ', the bottom is ALL of them.' }
    ].concat(wrongsFor(n, d, unit, false));
    const ds = list.filter(function(x){ return x.d >= 2 && x.n >= 1 && x.n !== x.d; }).map(function(x){ return opt(fK(x.n, x.d), F(x.n, x.d), x.why); });
    return mcq({
      prompt: 'What fraction of the ' + what + (kind === 'set' ? ' are' : ' is') + ' NOT coloured?', visual: vis,
      correct: opt(fK(w, d), F(w, d)), distractors: ds, keepOrder: true,
      hint: 'Count the WHITE ' + unit + ' for the top number. The bottom number is still ALL the ' + unit + '.',
      explain: ex('The white part', [
        'There are <b>' + d + '</b> ' + unit + ' altogether, so the bottom number is ' + d + '.',
        '<b>' + n + '</b> ' + isAre(n) + ' coloured, so ' + d + ' − ' + n + ' = <b>' + w + '</b> ' + isAre(w) + ' NOT coloured.',
        'The white part is <b>' + w + '/' + d + '</b>. ✅'
      ]),
      truth: fK(d * d - n * d, d * d),
      decode: function(){ const r = readPic(vis); return fK(r.den - r.num, r.den); }
    });
  }

  function shadeQ(n, d){
    return shade({
      prompt: 'Colour ' + n + '/' + d + ' of the bar.', den: d, num: n,
      hint: 'The bottom number (' + d + ') says how many equal parts the bar has. Tap exactly ' + n + ' of them.',
      explain: ex('Colouring ' + n + '/' + d, ['The bar is cut into <b>' + d + '</b> equal parts.', 'The top number <b>' + n + '</b> says how many parts to colour.', 'Colour <b>' + plural(n, 'part') + '</b> and leave ' + (d - n) + ' white. ✅'])
    });
  }

  function typedQ(kind, n, d){
    const vis = picOf(kind, n, d);
    const unit = kind === 'bar' ? 'parts' : kind === 'circle' ? 'slices' : 'counters';
    const what = kind === 'bar' ? 'bar' : kind === 'circle' ? 'pizza' : 'row of counters';
    const w = d - n;
    return numeric({
      prompt: (kind === 'set' ? 'There are ' + d + ' counters. ' + n + '/' + d + ' of them are coloured.' : 'The ' + what + ' is split into ' + d + ' equal ' + unit + '. ' + n + '/' + d + ' of it is coloured.') + ' How many ' + unit + ' are NOT coloured?', visual: vis, answer: w,
      hint: 'Count the white ' + unit + ' in the picture, or take the coloured ones away from ' + d + '.',
      explain: ex('Counting the white ' + unit, ['There are <b>' + d + '</b> ' + unit + ' altogether.', '<b>' + n + '</b> are coloured.', d + ' − ' + n + ' = <b>' + plural(w, unit.replace(/s$/, '')) + '</b> ' + (w === 1 ? 'is' : 'are') + ' white. ✅']),
      truth: w, decode: function(){ const r = readPic(vis); return r.den - r.num; },
      wrong: function(v){ return v === n ? 'That is the number of COLOURED ' + unit + '. We want the white ones.' : v === d ? 'That is ALL the ' + unit + '.' : ''; }
    });
  }

  function oddQ(){
    const d = randInt(4, 9), n = randInt(2, d - 2);
    const cands = [[n + 1, d], [n - 1, d], [n, d + 1], [n, d - 1], [d - n, d]].filter(function(c){ return c[0] >= 1 && c[0] < c[1] && c[1] <= 10 && fK(c[0], c[1]) !== fK(n, d); });
    const odd = pick(cands);
    const kinds = shuffle(['bar', 'circle', 'set']);
    const shown = kinds.map(function(k){ return opt('shown:' + k, picOf(k, n, d), 'That picture DOES show ' + n + '/' + d + '. We want the one that does NOT.'); });
    const oddKind = pick(kinds);
    const q = mcq({
      prompt: 'Three of these pictures show ' + n + '/' + d + '. Which picture does NOT?', visual: '',
      correct: opt(fK(odd[0], odd[1]), picOf(oddKind, odd[0], odd[1])), distractors: shown, count: 4, keepOrder: true,
      hint: 'For each picture count ALL the parts (bottom number) and then the coloured parts (top number). Look for the one that is not ' + n + '/' + d + '.',
      explain: ex('Finding the odd one out', [
        n + '/' + d + ' means <b>' + d + '</b> equal parts with <b>' + n + '</b> coloured.',
        'Three pictures match that. One picture shows <b>' + odd[0] + '/' + odd[1] + '</b> instead.',
        'That picture is the one that does NOT show ' + n + '/' + d + '. ✅'
      ]),
      truth: fK(odd[0] * 3, odd[1] * 3)
    });
    q.optionsAreVisual = true;
    const target = fK(n, d);
    q.decodeKey = function(){
      let found = null;
      for(let i = 0; i < q.options.length; i++){
        const r = readPic(q.options[i].label), k = fK(r.num, r.den);
        if(k === target){ if(q.options[i].key.indexOf('shown:') !== 0) return 'shown option has a wrong key'; }
        else { if(found !== null) return 'two odd pictures'; found = k; if(q.options[i].key !== k) return 'odd option key does not match picture'; }
      }
      return found;
    };
    return q;
  }

  registerSkill({
    id: 'frac-nonunit', strand: 'fractions', name: 'Fractions with more than one part', emoji: '🍰', year: 3, order: 420, prereq: ['frac-read'],
    lesson: {
      title: 'More than one part',
      steps: [
        { say: 'A <b>unit fraction</b> has 1 on top, like 1/4. Now we can take MORE parts! Here <b>3</b> of the <b>4</b> equal parts are coloured. That is <b>3/4</b>, said “three quarters”.', vis: { kind: 'fractionBar', args: [3, 4] } },
        { say: 'The <b>top</b> number counts the parts we have. The <b>bottom</b> number says how many equal parts make the whole. This pizza shows <b>2/3</b>: 2 slices out of 3.', vis: { kind: 'fractionCircle', args: [2, 3] } },
        { say: 'Fractions work for groups of things too. There are <b>5</b> counters and <b>3</b> are coloured. So <b>3/5</b> of the counters are coloured.', vis: { kind: 'fracSet', args: [3, 5] } },
        { say: 'Your turn! Look at the counters. Count them all, then count the coloured ones.', vis: { kind: 'fracSet', args: [2, 5] },
          quiz: { prompt: 'What fraction of the counters is coloured?', options: [{ label: '2/5', ok: true }, { label: '5/2', ok: false }, { label: '3/5', ok: false }], right: 'Yes! 2 coloured out of 5 counters is 2/5.', wrong: 'There are 5 counters altogether (bottom) and 2 coloured (top). So 2/5.' } },
        { say: 'The white part is a fraction too! 3 parts are coloured and <b>1</b> is white, so the white part is <b>1/4</b>. Coloured + white make the whole bar: 3/4 + 1/4 = 4/4.', vis: { kind: 'fractionBar', args: [3, 4] },
          quiz: { prompt: 'This bar has 5 parts and 3 are coloured. What fraction is white?', options: [{ label: '3/5', ok: false }, { label: '2/5', ok: true }, { label: '2/3', ok: false }], right: 'Yes! 5 − 3 = 2 white parts out of 5, so 2/5.', wrong: 'White parts: 5 − 3 = 2. The bottom number is still all 5 parts. So 2/5.' } }
      ]
    },
    trick: {
      title: 'Top = I have, bottom = all',
      say: 'Say a fraction like counting: <b>3/5</b> is “<b>three</b> lots of <b>one fifth</b>”. The <b>bottom</b> number tells you the size of each part. The <b>top</b> number tells you how many of them you have.',
      vis: { kind: 'fractionBar', args: [3, 5] },
      example: '3/5 → 5 equal parts, colour 3 → “three fifths”'
    },
    gen: {
      1: function(){
        const d = pick([3, 4, 5, 6]), n = randInt(2, d - 1);
        if(chance(0.25)) return shadeQ(n, d);
        return nameQ(pick(['bar', 'bar', 'circle', 'set']), n, d, false);
      },
      2: function(){
        const d = pick([4, 5, 6, 8, 10]), n = randInt(2, d - 1), r = randInt(0, 4);
        if(r === 0) return shadeQ(n, d);
        if(r === 1) return nameQ(pick(['bar', 'circle']), n, d, true);
        return nameQ(pick(['bar', 'circle', 'set']), n, d, false);
      },
      3: function(){
        const r = randInt(0, 5);
        if(r <= 1) return oddQ();
        if(r === 2){ const d = pick([5, 6, 8, 10]); return shadeQ(randInt(2, d - 1), d); }
        let d = pick([5, 6, 7, 8, 9, 10]), n = randInt(2, d - 1);
        if(2 * n === d) n = n + 1;
        const kind = pick(['bar', 'circle', 'set']);
        if(r === 3) return compQ(kind, n, d);
        if(r === 4) return typedQ(kind, n, d);
        if(!NAMES[d]){ d = pick([5, 6, 8, 10]); n = randInt(2, d - 1); if(2 * n === d) n = n + 1; }
        return nameQ(kind, n, d, true);
      }
    }
  });
})();
