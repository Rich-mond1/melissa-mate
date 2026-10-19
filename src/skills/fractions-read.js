/* REFERENCE SKILL #2 — fractions. Shows: stacked fraction labels, K.frac keys (equivalent fractions can never both
   appear as options), picture decode, numeric typed answer, shade-it interactive, mcqNum for number answers. */
(function(){
  const DENS = [2, 3, 4, 5, 6, 8, 10];
  function frac(n, d){ return fracHTML(n, d); }
  function fKey(n, d){ return K.frac(n, d); }

  registerSkill({
    id: 'frac-read', strand: 'fractions', name: 'Reading fractions', emoji: '🍕', year: 3, order: 410, prereq: [],
    lesson: {
      title: 'What is a fraction?',
      steps: [
        { say: 'A fraction is a <b>part of a whole</b>. This bar is split into <b>4 equal parts</b>. Equal means every part is the same size.', vis: { kind: 'fractionBar', args: [0, 4] } },
        { say: 'The <b>bottom</b> number (denominator) says how many equal parts there are altogether. The <b>top</b> number (numerator) says how many parts are coloured.', vis: { kind: 'fractionBar', args: [3, 4] } },
        { say: '3 parts are coloured out of 4 equal parts. We write <b>3/4</b> and say “three quarters”.', vis: { kind: 'fractionBar', args: [3, 4] },
          quiz: { prompt: 'This bar has 5 equal parts and 2 are coloured. Which fraction is it?', options: [{ label: '2/5', ok: true }, { label: '5/2', ok: false }, { label: '3/5', ok: false }], right: 'Yes! 2 coloured out of 5 equal parts is 2/5.', wrong: 'Top number = coloured parts (2). Bottom number = all the parts (5). So 2/5.' } },
        { say: 'A fraction can be shown on a circle too, like a pizza! Here <b>1</b> slice out of <b>8</b> is coloured: <b>1/8</b>.', vis: { kind: 'fractionCircle', args: [1, 8] } }
      ]
    },
    trick: {
      title: 'Count the cuts',
      say: 'To find the <b>bottom</b> number, count ALL the parts (coloured and white). To find the <b>top</b> number, count only the coloured ones. Bottom = all. Top = some.',
      vis: { kind: 'fractionBar', args: [2, 6] },
      example: '6 parts altogether, 2 coloured → <b>2/6</b>'
    },
    gen: {
      1: function(){ // read a shaded bar, unit and simple fractions
        const d = pick([2, 3, 4, 5, 6]), n = randInt(1, d - 1);
        const vis = V.fractionBar(n, d);
        const wrongs = [
          { n: d, d: n, why: 'You flipped it. The top number is the coloured parts, the bottom is ALL the parts.' },
          { n: d - n, d: d, why: 'That counts the WHITE parts. The top number counts the coloured ones.' },
          { n: n, d: n + 1 + (d > 2 ? 0 : 1), why: 'Count all the parts for the bottom number — coloured AND white.' }
        ];
        for(let k = 1; k < d; k++) wrongs.push({ n: k, d: d, why: 'Count the coloured parts carefully.' });
        // deep fallback pool: de-duplication by VALUE must never starve the options
        [2, 3, 4, 5, 6, 8].forEach(function(dd){ for(let k = 1; k < dd; k++) wrongs.push({ n: k, d: dd, why: 'Count all the parts for the bottom number, then the coloured ones for the top.' }); });
        const ds = wrongs.filter(function(w){ return w.d >= 2 && w.n >= 1; }).map(function(w){ return opt(fKey(w.n, w.d), frac(w.n, w.d), w.why); });
        return mcq({
          prompt: 'What fraction of the bar is coloured?', visual: vis,
          correct: opt(fKey(n, d), frac(n, d)), distractors: ds, keepOrder: true,
          hint: 'Count ALL the equal parts first (bottom number). Then count just the coloured ones (top number).',
          explain: ex('Reading the bar', [
            'Count <b>all</b> the equal parts: <b>' + d + '</b>. That is the bottom number.',
            'Count the <b>coloured</b> parts: <b>' + n + '</b>. That is the top number.',
            'The fraction is <b>' + n + '/' + d + '</b>. ✅'
          ]),
          truth: fKey(n, d),
          decode: function(){ const r = V.decodeFractionBar(vis); return fKey(r.num, r.den); }
        });
      },
      2: function(){ // circles, bigger denominators; or typed numerator
        const d = pick(DENS.filter(function(x){ return x >= 3; })), n = randInt(1, d - 1);
        if(chance(0.5)){
          const vis = V.fractionCircle(n, d);
          const ds = [opt(fKey(d, n), frac(d, n), 'You flipped it. The top number is the coloured parts.'), opt(fKey(d - n, d), frac(d - n, d), 'That counts the WHITE parts.')];
          for(let k = 1; k < d; k++) ds.push(opt(fKey(k, d), frac(k, d), 'Count the coloured slices carefully.'));
          // always keep a deep fallback pool so de-duplication by VALUE can never starve the options
          shuffle(DENS).forEach(function(dd){ for(let k = 1; k < dd; k++) ds.push(opt(fKey(k, dd), frac(k, dd), 'Count the slices again: the bottom number is ALL the slices.')); });
          return mcq({
            prompt: 'What fraction of the pizza is coloured?', visual: vis,
            correct: opt(fKey(n, d), frac(n, d)), distractors: ds.filter(function(o){ return !/f:\d+\/1$/.test(o.key); }), keepOrder: true,
            hint: 'Count all the slices for the bottom number, then the coloured slices for the top number.',
            explain: ex('Reading the pizza', [
              'There are <b>' + d + '</b> equal slices altogether — that is the bottom number.',
              '<b>' + plural(n, 'slice') + '</b> ' + (n === 1 ? 'is' : 'are') + ' coloured — that is the top number.',
              'So <b>' + n + '/' + d + '</b> of the pizza is coloured. ✅'
            ]),
            truth: fKey(n, d), decode: function(){ const r = V.decodeFractionCircle(vis); return fKey(r.num, r.den); }
          });
        }
        const vis = V.fractionBar(n, d);
        return numeric({
          prompt: 'The bar is split into ' + d + ' equal parts. How many parts are coloured?', visual: vis, answer: n,
          hint: 'Just count the coloured parts — that number goes on the TOP of the fraction.',
          explain: ex('Counting coloured parts', ['The bar has <b>' + d + '</b> equal parts.', 'Counting the coloured ones gives <b>' + n + '</b>.', 'So the fraction is ' + n + '/' + d + ' and the answer is <b>' + n + '</b>. ✅']),
          truth: n, decode: function(){ return V.decodeFractionBar(vis).num; },
          wrong: function(v){ return v === d - n ? 'That is the number of WHITE parts.' : ''; }
        });
      },
      3: function(){ // shade it yourself, or "which picture shows n/d"
        const d = pick(DENS), n = randInt(1, d - 1);
        if(chance(0.5)){
          return shade({
            prompt: 'Colour ' + n + '/' + d + ' of the bar.', den: d, num: n,
            hint: 'The bottom number (' + d + ') says how many equal parts there are. Tap exactly ' + n + ' of them.',
            explain: ex('Colouring ' + n + '/' + d, ['The bar is cut into <b>' + d + '</b> equal parts.', 'The top number <b>' + n + '</b> says how many to colour.', 'Colour <b>' + plural(n, 'part') + '</b> and leave the other ' + (d - n) + ' white. ✅'])
          });
        }
        const picks = [];
        const seen = {}; seen[fKey(n, d)] = 1;
        const cands = [];
        for(let k = 1; k < d; k++) cands.push([k, d]);
        DENS.forEach(function(dd){ for(let k = 1; k < dd; k++) cands.push([k, dd]); });
        const ds = [];
        shuffle(cands).forEach(function(c){ const key = fKey(c[0], c[1]); if(!seen[key]){ seen[key] = 1; ds.push(opt(key, V.fractionBar(c[0], c[1]), 'That picture shows ' + c[0] + '/' + c[1] + ', not ' + n + '/' + d + '.')); } });
        const q = mcq({
          prompt: 'Which picture shows ' + n + '/' + d + '?', visual: '',
          correct: opt(fKey(n, d), V.fractionBar(n, d)), distractors: ds, count: 3,
          hint: 'The bottom number is how many equal parts the bar has. The top number is how many are coloured.',
          explain: ex('Finding ' + n + '/' + d, ['<b>' + d + '</b> on the bottom means the bar has ' + d + ' equal parts.', '<b>' + n + '</b> on the top means ' + n + ' of them are coloured.', 'Only one bar has ' + d + ' parts with ' + n + ' coloured: that is <b>' + n + '/' + d + '</b>. ✅']),
          truth: fKey(n, d)
        });
        q.optionsAreVisual = true;
        q.decodeKey = function(){ for(let i = 0; i < q.options.length; i++){ const r = V.decodeFractionBar(q.options[i].label); if(fKey(r.num, r.den) !== q.options[i].key) return 'option ' + i + ' picture does not match its key'; } return q.options[q.correct].key; };
        return q;
      }
    }
  });
})();
