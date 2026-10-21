/* MEASURE — length: read a ruler (cm, half-cm, mm), compare lengths, choose a sensible unit.
   Every ruler question decodes the DRAWN ruler (object width against the printed numbers). */
(function(){
  const OBJ = [['pencil', '✏️'], ['crayon', '🖍️'], ['ribbon', '🎀'], ['worm', '🪱'], ['leaf', '🍃'], ['key', '🔑'], ['paper clip', '📎'], ['feather', '🪶'], ['carrot', '🥕'], ['toothbrush', '🪥'], ['snake toy', '🐍'], ['straw', '🥤'], ['fish finger', '🐟'], ['sock', '🧦']];
  function cap(s){ return s.charAt(0).toUpperCase() + s.slice(1); }
  function pickObj(){ return pick(OBJ); }
  function twoObjs(){ const a = pickObj(); let b = pickObj(); while(b[0] === a[0]) b = pickObj(); return [a, b]; }
  function halfTxt(v){ return Number.isInteger(v) ? v + ' cm' : Math.floor(v) + '½ cm'; }   // 7 cm, 7½ cm
  function cmTxt(v){ return v + ' cm'; }
  function mmTxt(v){ return v + ' mm'; }
  function cmmm(mm){ return mm % 10 === 0 ? (mm / 10) + ' cm' : Math.floor(mm / 10) + ' cm ' + (mm % 10) + ' mm'; }
  function rd1(x){ return Math.round(x * 10) / 10; }
  function maxFor(len, extra){ return Math.min(13, Math.ceil(len) + (extra || 1)); }

  // a ruler whose object may start away from 0 (same class names as V.ruler, so the same style of decoding works)
  function rulerAt(start, len, o){
    o = o || {};
    const maxCm = Math.max(o.maxCm, Math.ceil(start + len - 1e-9)), x0 = 20, pxCm = Math.min(30, Math.floor(300 / maxCm));
    let s = '<rect x="10" y="44" width="' + (maxCm * pxCm + 20) + '" height="42" rx="4" fill="#FFE9A8" stroke="#1B1B2F" stroke-width="2"/>';
    for(let mm = 0; mm <= maxCm * 10; mm++){
      const x = x0 + mm * pxCm / 10, isCm = mm % 10 === 0, isHalf = mm % 5 === 0;
      s += '<line class="tk" x1="' + x.toFixed(2) + '" y1="44" x2="' + x.toFixed(2) + '" y2="' + (44 + (isCm ? 20 : (isHalf ? 14 : 8))) + '" stroke="#1B1B2F" stroke-width="' + (isCm ? 2 : 1) + '"/>';
      if(isCm) s += '<text class="lbl" data-v="' + (mm / 10) + '" x="' + x.toFixed(2) + '" y="80" text-anchor="middle" font-size="12" font-weight="800" fill="#1B1B2F">' + (mm / 10) + '</text>';
    }
    s += '<rect class="obj" x="' + (x0 + start * pxCm).toFixed(2) + '" y="8" width="' + (len * pxCm).toFixed(2) + '" height="26" rx="6" fill="var(--vis-a,#4F8FE8)" stroke="#1B1B2F" stroke-width="2"/>';
    s += '<text x="' + (x0 + (start + len / 2) * pxCm).toFixed(2) + '" y="27" text-anchor="middle" font-size="15" fill="#fff" font-weight="800">' + (o.emoji || '') + '</text>';
    const w = maxCm * pxCm + 40;
    return '<svg viewBox="0 0 ' + w + ' 92" width="' + Math.min(w, 340) + '" role="img" style="max-width:100%;height:auto;display:block;margin:0 auto" xmlns="http://www.w3.org/2000/svg" font-family="-apple-system,Segoe UI,Roboto,Arial,sans-serif">' + s + '</svg>';
  }
  function attr(tag, name){ const m = new RegExp(name + '="([^"]*)"').exec(tag); return m ? m[1] : null; }
  function tagsWith(html, cls){ return html.match(new RegExp('<[a-z]+[^>]*class="' + cls + '"[^>]*>', 'g')) || []; }
  function readAt(html){   // -> {start,end} in cm, read from where the object sits against the printed numbers
    const L = tagsWith(html, 'lbl').map(function(t){ return { v: parseFloat(attr(t, 'data-v')), x: parseFloat(attr(t, 'x')) }; });
    const o = tagsWith(html, 'obj')[0], ox = parseFloat(attr(o, 'x')), ow = parseFloat(attr(o, 'width'));
    const a = L[0], b = L[L.length - 1];
    function val(x){ return a.v + (x - a.x) / (b.x - a.x) * (b.v - a.v); }
    return { start: rd1(val(ox)), end: rd1(val(ox + ow)) };
  }
  function lenOf(html){ return rd1(V.decodeRuler(html)); }
  function stack(parts){   // several labelled rulers in one picture
    return '<div style="display:flex;flex-direction:column;gap:4px;align-items:center">' + parts.map(function(p){ return '<div style="font-weight:800;font-size:15px">' + p.label + '</div>' + p.svg; }).join('') + '</div>';
  }

  // sensible units: size in mm decides the unit (independent of the table's own "unit" field)
  const THINGS = [
    ['the thickness of a coin', 2], ['a grain of rice', 6], ['an ant', 4], ['a ladybird', 7],
    ['a pencil', 150], ['a school book', 250], ['your hand span', 180], ['a shoe', 200], ['a pencil case', 220], ['a snail', 60], ['a mobile phone', 140],
    ['a door', 2000], ['a classroom floor', 8000], ['a bus', 11000], ['a swimming pool', 25000], ['a football pitch', 100000], ['a tall tree', 15000], ['a playground', 40000],
    ['the way from London to Brighton', 80000000], ['a walk to school', 1200000], ['a long train journey', 250000000]
  ];
  function unitFor(mm){ return mm < 20 ? 'mm' : mm < 1000 ? 'cm' : mm < 1000000 ? 'm' : 'km'; }
  const UN = { mm: 'millimetres (mm)', cm: 'centimetres (cm)', m: 'metres (m)', km: 'kilometres (km)' };
  const UWHY = {
    mm: 'This is a tiny length, so we need the tiniest unit: millimetres.',
    cm: 'This is a small length, bigger than a few mm but much shorter than a metre: centimetres.',
    m: 'This is a long length, much more than a metre rule: metres.',
    km: 'This is a very long way — we use kilometres for journeys.'
  };
  function unitQ(tier){
    let pool = THINGS.filter(function(t){ return tier === 1 ? (t[1] >= 100 && t[1] <= 100000) && unitFor(t[1]) !== 'mm' : true; });
    const t = pick(pool);
    const u = unitFor(t[1]);
    const sets = { mm: ['mm', 'cm', 'm'], cm: ['mm', 'cm', 'm'], m: ['cm', 'm', 'km'], km: ['m', 'km', 'cm'] };
    const alts = sets[u].filter(function(x){ return x !== u; });
    const ds = alts.map(function(x){ return opt(K.text(x), UN[x], 'Not quite: ' + UN[x] + ' is not the best fit here. ' + UWHY[u]); });
    return mcq({
      prompt: 'Which unit is best for measuring ' + t[0] + '?', visual: '',
      correct: opt(K.text(u), UN[u]), distractors: ds, count: 3,
      hint: 'Picture it. A millimetre is tiny (a pinhead), a centimetre is a fingertip width, a metre is a big stride, a kilometre is a walk.',
      explain: ex('Choosing a unit', ['Think about how big ' + t[0] + ' is.', UWHY[u], 'The best unit is <b>' + UN[u] + '</b>. ✅']),
      truth: K.text(['mm', 'cm', 'm', 'km'][(t[1] >= 20) + (t[1] >= 1000) + (t[1] >= 1000000)])
    });
  }

  registerSkill({
    id: 'measure-length', strand: 'measure', name: 'Measuring length with a ruler', emoji: '📏', year: 3, order: 610, prereq: ['number-place-value'],
    lesson: {
      title: 'Using a ruler',
      steps: [
        { say: 'Put one end of the object on the <b>0</b>. Then read the number at the <b>other end</b>. This pencil ends at the 6, so it is <b>6 cm</b> long. (cm means centimetres.)', vis: { kind: 'ruler', args: [6, { emoji: '✏️' }] } },
        { say: 'Sometimes the end is <b>between</b> two numbers. The longer little line halfway is <b>half a centimetre</b>. This ribbon ends halfway after 7, so it is <b>7½ cm</b>.', vis: { kind: 'ruler', args: [7.5, { emoji: '🎀' }] } },
        { say: 'The tiny lines are <b>millimetres</b> (mm). There are <b>10 mm</b> in 1 cm. This leaf is 4 cm and 3 small marks: <b>4 cm 3 mm</b>, which is <b>43 mm</b>.', vis: { kind: 'ruler', args: [4.3, { emoji: '🍃' }] },
          quiz: { prompt: 'A key is 5 cm 2 mm long. How many millimetres is that?', options: [{ label: '52 mm', ok: true }, { label: '7 mm', ok: false }, { label: '502 mm', ok: false }], right: 'Yes! 5 cm = 50 mm, plus 2 mm makes 52 mm.', wrong: '5 cm is 5 × 10 = 50 mm. Then add the 2 extra mm: 52 mm.' } },
        { say: 'Pick a <b>sensible unit</b>: <b>mm</b> for tiny things, <b>cm</b> for pencils and books, <b>m</b> for rooms, <b>km</b> for long journeys.',
          vis: { kind: 'html', args: ['<div style="font:700 17px system-ui;line-height:1.7;text-align:center">🐜 ant → <b>mm</b><br>✏️ pencil → <b>cm</b><br>🚪 door → <b>m</b><br>🚌 bus trip → <b>km</b></div>'] },
          quiz: { prompt: 'Which unit would you use for the length of a classroom?', options: [{ label: 'metres (m)', ok: true }, { label: 'millimetres (mm)', ok: false }, { label: 'centimetres (cm)', ok: false }], right: 'Yes! A classroom is long, so we use metres.', wrong: 'A classroom is much longer than a pencil. Metres are the best unit.' } }
      ]
    },
    trick: {
      title: 'Start at zero, big marks then small',
      say: 'First check the object starts exactly at <b>0</b>. Then say the last <b>big number</b> you pass, then count the <b>small marks</b> after it. The long mark half-way between two big numbers is 5 mm, and every small mark is 1 mm.',
      vis: { kind: 'ruler', args: [9.4, { emoji: '🥕' }] },
      example: 'Last big number is <b>9</b>, then <b>4</b> small marks: <b>9 cm 4 mm</b> = 94 mm'
    },
    gen: {
      1: function(){ return pick([t1Read, t1Read, t1Read, t1Longer, t1Unit])(); },
      2: function(){ return pick([t2Half, t2Half, t2Longer, t2Diff, t2Nearest, t2Unit])(); },
      3: function(){ return pick([t3Mm, t3Mm, t3CmMm, t3Offset, t3OffsetHalf, t3DiffMm, t3Words])(); }
    }
  });

  /* ------------------------------ tier 1 ------------------------------ */
  function t1Read(){
    const len = randInt(2, 12), ob = pickObj(), mx = Math.min(13, len + randInt(1, 3));
    const vis = V.ruler(len, { emoji: ob[1], maxCm: mx });
    return mcqNum({
      prompt: 'How long is the ' + ob[0] + '?', visual: vis, answer: len, fmt: cmTxt,
      wrong: [
        { v: len + 1, why: 'The ' + ob[0] + ' starts at 0, not 1. Read the number at the END of the ' + ob[0] + '.' },
        { v: len - 1, why: 'Look again: the ' + ob[0] + ' reaches the ' + len + ', not the number before it.' },
        { v: mx, why: 'That is where the ruler ends, not where the ' + ob[0] + ' ends.' }
      ],
      nearby: [2, -2, 3, -3],
      valid: function(v){ return v > 0; },
      hint: 'The ' + ob[0] + ' starts at 0. Find the number just under the other end.',
      explain: ex('Reading the ruler', ['The ' + ob[0] + ' starts at <b>0</b>.', 'Its other end is exactly on the <b>' + len + '</b>.', 'So the ' + ob[0] + ' is <b>' + len + ' cm</b> long. ✅']),
      truth: (len + 5) - 5, decode: function(){ return lenOf(vis); }
    });
  }
  function t1Longer(){
    const o = twoObjs(), a = randInt(3, 11);
    let b; do { b = randInt(3, 11); } while(Math.abs(a - b) < 2);
    const mx = Math.min(13, Math.max(a, b) + 1);
    const va = V.ruler(a, { emoji: o[0][1], maxCm: mx }), vb = V.ruler(b, { emoji: o[1][1], maxCm: mx });
    const vis = stack([{ label: 'The ' + o[0][0], svg: va }, { label: 'The ' + o[1][0], svg: vb }]);
    const longer = a > b ? o[0] : o[1], shorter = a > b ? o[1] : o[0];
    return mcq2({
      prompt: 'Which is longer, the ' + o[0][0] + ' or the ' + o[1][0] + '?', visual: vis,
      correct: opt(K.text(longer[0]), 'The ' + longer[0]),
      other: opt(K.text(shorter[0]), 'The ' + shorter[0], 'Read both rulers: the ' + shorter[0] + ' is the shorter one (' + Math.min(a, b) + ' cm, not ' + Math.max(a, b) + ' cm).'),
      hint: 'Read each ruler at the end of the object. The bigger number is the longer object.',
      explain: ex('Comparing lengths', ['The ' + o[0][0] + ' is <b>' + a + ' cm</b>.', 'The ' + o[1][0] + ' is <b>' + b + ' cm</b>.', Math.max(a, b) + ' is more than ' + Math.min(a, b) + ', so <b>the ' + longer[0] + '</b> is longer. ✅']),
      truth: K.text([[a, o[0][0]], [b, o[1][0]]].sort(function(x, y){ return y[0] - x[0]; })[0][1]),
      decode: function(){ return K.text(lenOf(va) > lenOf(vb) ? o[0][0] : o[1][0]); }
    });
  }
  function t1Unit(){ return unitQ(1); }

  /* ------------------------------ tier 2 ------------------------------ */
  function halfWrongs(len){
    const f = Math.floor(len), half = !Number.isInteger(len);
    if(half) return [
      { v: f, why: 'The end is past the ' + f + ' — it is half way to ' + (f + 1) + '. Do not forget the half.' },
      { v: f + 1, why: 'The end has not reached ' + (f + 1) + ' yet. It is half way between ' + f + ' and ' + (f + 1) + '.' },
      { v: len + 1, why: 'Count from 0 and use the long half-way mark.' },
      { v: len - 1, why: 'Look at the end of the object again: it is after the ' + f + '.' }
    ];
    return [
      { v: len + 0.5, why: 'The end is exactly ON the number ' + len + ' — there is no extra half.' },
      { v: len - 0.5, why: 'The end is exactly on the number ' + len + ', not half way before it.' },
      { v: len + 1, why: 'The object starts at 0. Read the number at the end.' },
      { v: len - 1, why: 'Look again: the end reaches ' + len + '.' }
    ];
  }
  function t2Half(){
    const whole = randInt(2, 11), len = chance(0.75) ? whole + 0.5 : whole, ob = pickObj(), mx = Math.min(13, Math.ceil(len) + randInt(1, 2));
    const vis = V.ruler(len, { emoji: ob[1], maxCm: mx });
    const q = mcqNum({
      prompt: 'How long is the ' + ob[0] + '? Read to the nearest half centimetre.', visual: vis, answer: len, fmt: halfTxt,
      wrong: halfWrongs(len), nearby: [1.5, -1.5, 2, -2, 0.5, -0.5],
      valid: function(v){ return v > 0 && (v * 2) % 1 === 0; },
      hint: 'The longer small line between two numbers is half a centimetre.',
      explain: ex('Reading to the half cm', ['The ' + ob[0] + ' starts at <b>0</b>.', Number.isInteger(len) ? 'It ends exactly on the <b>' + len + '</b>.' : 'It passes the <b>' + Math.floor(len) + '</b> and stops at the long half-way mark.', 'So it is <b>' + halfTxt(len) + '</b> long. ✅']),
      truth: (len * 2) / 2, decode: function(){ return lenOf(vis); }
    });
    return q;
  }
  function t2Longer(){
    const o = twoObjs(), a = randInt(4, 12) + (chance(0.5) ? 0.5 : 0);
    let b; do { b = randInt(4, 12) + (chance(0.5) ? 0.5 : 0); } while(Math.abs(a - b) < 0.5 || Math.abs(a - b) > 2.5);
    const mx = Math.min(13, Math.ceil(Math.max(a, b)) + 1);
    const va = V.ruler(a, { emoji: o[0][1], maxCm: mx }), vb = V.ruler(b, { emoji: o[1][1], maxCm: mx });
    const vis = stack([{ label: 'The ' + o[0][0], svg: va }, { label: 'The ' + o[1][0], svg: vb }]);
    const longer = a > b ? o[0] : o[1], shorter = a > b ? o[1] : o[0];
    return mcq2({
      prompt: 'Which is longer, the ' + o[0][0] + ' or the ' + o[1][0] + '?', visual: vis,
      correct: opt(K.text(longer[0]), 'The ' + longer[0]),
      other: opt(K.text(shorter[0]), 'The ' + shorter[0], 'They are close! Read each to the half cm: the ' + shorter[0] + ' is ' + halfTxt(Math.min(a, b)) + ', the other is ' + halfTxt(Math.max(a, b)) + '.'),
      hint: 'Read each ruler carefully to the nearest half cm, then compare the two numbers.',
      explain: ex('Comparing lengths', ['The ' + o[0][0] + ' is <b>' + halfTxt(a) + '</b>.', 'The ' + o[1][0] + ' is <b>' + halfTxt(b) + '</b>.', halfTxt(Math.max(a, b)) + ' is longer than ' + halfTxt(Math.min(a, b)) + ', so <b>the ' + longer[0] + '</b> is longer. ✅']),
      truth: K.text(a * 2 > b * 2 ? o[0][0] : o[1][0]),
      decode: function(){ return K.text(lenOf(va) > lenOf(vb) ? o[0][0] : o[1][0]); }
    });
  }
  function t2Diff(){
    const o = twoObjs(), a = randInt(7, 13), b = randInt(2, a - 2);
    const mx = Math.min(13, a + 1);
    const va = V.ruler(a, { emoji: o[0][1], maxCm: mx }), vb = V.ruler(b, { emoji: o[1][1], maxCm: mx });
    const vis = stack([{ label: 'The ' + o[0][0], svg: va }, { label: 'The ' + o[1][0], svg: vb }]);
    const d = a - b;
    return mcqNum({
      prompt: 'How much longer is the ' + o[0][0] + ' than the ' + o[1][0] + '?', visual: vis, answer: d, fmt: cmTxt,
      wrong: [
        { v: a + b, why: '"How much longer" means find the DIFFERENCE — take away, do not add.' },
        { v: a, why: 'That is the length of the ' + o[0][0] + '. Take the other length away.' },
        { v: d + 1, why: 'Check your take-away: ' + a + ' − ' + b + '.' },
        { v: d - 1, why: 'Check your take-away: ' + a + ' − ' + b + '.' }
      ],
      nearby: [2, -2],
      valid: function(v){ return v > 0; },
      hint: 'Read both rulers, then take the shorter length away from the longer one.',
      explain: ex('How much longer?', ['The ' + o[0][0] + ' is <b>' + a + ' cm</b> and the ' + o[1][0] + ' is <b>' + b + ' cm</b>.', 'Difference: ' + a + ' − ' + b + '.', 'The ' + o[0][0] + ' is <b>' + d + ' cm</b> longer. ✅']),
      truth: (a + 10) - (b + 10), decode: function(){ return rd1(V.decodeRuler(va) - V.decodeRuler(vb)); }
    });
  }
  function t2Nearest(){
    const whole = randInt(2, 9), tenth = pick([1, 2, 3, 4, 6, 7, 8, 9]), len = whole + tenth / 10, ob = pickObj();
    const vis = V.ruler(len, { emoji: ob[1], maxCm: Math.min(11, whole + 2) });
    const ans = tenth > 5 ? whole + 1 : whole;
    return mcqNum({
      prompt: 'What is the length of the ' + ob[0] + ' to the nearest centimetre?', visual: vis, answer: ans, fmt: cmTxt,
      wrong: [
        { v: tenth > 5 ? whole : whole + 1, why: tenth > 5 ? 'The end is MORE than half way to ' + (whole + 1) + ' (past the long mark), so we round UP.' : 'The end is LESS than half way, so we round DOWN to ' + whole + '.' },
        { v: whole * 10 + tenth, why: 'That is in millimetres. The question asks for centimetres.' },
        { v: whole + 2, why: 'Look at the end of the ' + ob[0] + ' again.' },
        { v: whole - 1, why: 'Look at the end of the ' + ob[0] + ' again.' }
      ],
      nearby: [2, -2, 3],
      valid: function(v){ return v > 0; },
      hint: 'Find the whole cm just before the end. Is the end past the long half-way mark (5 mm)? If so, round up.',
      explain: ex('Nearest centimetre', ['The ' + ob[0] + ' ends ' + tenth + ' small mark' + (tenth === 1 ? '' : 's') + ' after the <b>' + whole + ' cm</b> mark.', tenth > 5 ? tenth + ' is more than 5, so it is closer to ' + (whole + 1) + '.' : tenth + ' is less than 5, so it is closer to ' + whole + '.', 'To the nearest cm it is <b>' + ans + ' cm</b>. ✅']),
      truth: Math.floor((whole * 10 + tenth + 5) / 10), decode: function(){ return Math.round(V.decodeRuler(vis)); }
    });
  }
  function t2Unit(){ return unitQ(2); }

  /* ------------------------------ tier 3 ------------------------------ */
  function t3Mm(){
    const whole = randInt(2, 9), tenth = randInt(1, 9), mm = whole * 10 + tenth, ob = pickObj();
    const vis = V.ruler(mm / 10, { emoji: ob[1], maxCm: Math.min(11, whole + 2) });
    return numeric({
      prompt: 'How many millimetres long is the ' + ob[0] + '?', visual: vis, answer: mm, unit: 'mm',
      hint: 'Count the whole cm first, then the little marks. 1 cm = 10 mm.',
      explain: ex('Millimetres', ['The ' + ob[0] + ' reaches <b>' + whole + ' cm</b> and ' + tenth + ' small mark' + (tenth === 1 ? '' : 's') + ' more: <b>' + whole + ' cm ' + tenth + ' mm</b>.', whole + ' cm = ' + whole + ' × 10 = ' + whole * 10 + ' mm.', whole * 10 + ' mm + ' + tenth + ' mm = <b>' + mm + ' mm</b>. ✅']),
      truth: whole * 10 + tenth, decode: function(){ return Math.round(V.decodeRuler(vis) * 10); },
      wrong: function(v){ return v === whole ? 'That is the whole cm. 1 cm = 10 mm, and do not forget the little marks.' : v === whole * 10 ? 'That is just the whole centimetres. Add the ' + tenth + ' extra mm.' : v === whole * 100 + tenth ? 'Careful: 1 cm is 10 mm, not 100 mm.' : ''; }
    });
  }
  function t3CmMm(){
    const whole = randInt(2, 9), tenth = randInt(1, 9), mm = whole * 10 + tenth, ob = pickObj();
    const vis = V.ruler(mm / 10, { emoji: ob[1], maxCm: Math.min(11, whole + 2) });
    const cands = [
      [tenth * 10 + whole, 'The numbers are the wrong way round. Whole centimetres come first, then the little mm marks.'],
      [(whole - 1) * 10 + (10 - tenth), 'You counted back from the next cm. Count the small marks forwards from ' + whole + '.'],
      [whole * 100 + tenth, 'Only 10 mm make 1 cm, so the mm part is just ' + tenth + '.'],
      [(whole + 1) * 10 + tenth, 'Look again at the last big number before the end.'],
      [whole * 10, 'You forgot the little marks after the ' + whole + '.'],
      [whole * 10 + (tenth + 2 <= 9 ? tenth + 2 : tenth - 2), 'Count the little marks carefully, one by one.']
    ];
    const ds = cands.map(function(c){ return opt(K.num(c[0]), c[0] >= 1000 ? Math.floor(c[0] / 10) + ' cm' : cmmm(c[0]), c[1]); });
    return mcq({
      prompt: 'How long is the ' + ob[0] + '? Choose the answer in cm and mm.', visual: vis,
      correct: opt(K.num(mm), cmmm(mm)), distractors: ds, keepOrder: true,
      hint: 'Say the last big number first (cm), then count the small marks after it (mm).',
      explain: ex('cm and mm', ['The last big number passed is <b>' + whole + '</b>, so ' + whole + ' cm.', 'Then ' + tenth + ' small mark' + (tenth === 1 ? '' : 's') + ': <b>' + tenth + ' mm</b>.', 'The ' + ob[0] + ' is <b>' + cmmm(mm) + '</b> long. ✅']),
      truth: K.num(whole * 10 + tenth), decode: function(){ return K.num(Math.round(V.decodeRuler(vis) * 10)); }
    });
  }
  function t3Offset(){
    const st = randInt(1, 6), len = randInt(3, 9), ob = pickObj();
    const vis = rulerAt(st, len, { emoji: ob[1], maxCm: Math.min(13, st + len + 1) });
    return numeric({
      prompt: 'The ' + ob[0] + ' does not start at 0! How long is it in cm?', visual: vis, answer: len, unit: 'cm',
      hint: 'Read where it starts and where it ends, then find the gap between the two numbers.',
      explain: ex('Not starting at zero', ['The ' + ob[0] + ' starts at <b>' + st + '</b> and ends at <b>' + (st + len) + '</b>.', 'Length = end − start = ' + (st + len) + ' − ' + st + '.', 'So it is <b>' + len + ' cm</b> long. ✅']),
      truth: (st + len + 10) - (st + 10), decode: function(){ const r = readAt(vis); return rd1(r.end - r.start); },
      wrong: function(v){ return v === st + len ? 'That is where it ENDS. It started at ' + st + ', so take ' + st + ' away.' : v === st ? 'That is where it starts. Work out the distance from start to end.' : ''; }
    });
  }
  function t3OffsetHalf(){
    const st = randInt(1, 5), len = randInt(2, 7) + 0.5, ob = pickObj();
    const vis = rulerAt(st, len, { emoji: ob[1], maxCm: Math.min(13, st + Math.ceil(len) + 1) });
    const r0 = st + len;
    return mcqNum({
      prompt: 'The ' + ob[0] + ' starts at ' + st + ' cm. How long is it?', visual: vis, answer: len, fmt: halfTxt,
      wrong: [
        { v: r0, why: 'That is where the ' + ob[0] + ' ENDS. Take away the start (' + st + ').' },
        { v: Math.floor(len), why: 'Do not forget the extra half centimetre.' },
        { v: Math.ceil(len), why: 'It is half way, not a whole cm more.' },
        { v: len + 1, why: 'Count the distance from ' + st + ' to the end carefully.' }
      ],
      nearby: [1, -1, 2, 0.5],
      valid: function(v){ return v > 0 && (v * 2) % 1 === 0; },
      hint: 'End number minus start number. The end is at a half-way mark.',
      explain: ex('Start and end', ['It starts at <b>' + st + '</b> and ends at <b>' + r0.toString().replace('.5', '½') + '</b>.', 'From ' + st + ' to ' + Math.floor(r0) + ' is ' + (Math.floor(r0) - st) + ' cm, plus the half.', 'The ' + ob[0] + ' is <b>' + halfTxt(len) + '</b> long. ✅']),
      truth: (r0 * 2 - st * 2) / 2, decode: function(){ const r = readAt(vis); return rd1(r.end - r.start); }
    });
  }
  function t3DiffMm(){
    const o = twoObjs();
    let a, b;
    do { a = randInt(35, 95); b = randInt(20, 80); } while(a - b < 6 || a - b > 40 || a % 10 === 0 || b % 10 === 0);
    const mx = 10;
    const va = V.ruler(a / 10, { emoji: o[0][1], maxCm: mx }), vb = V.ruler(b / 10, { emoji: o[1][1], maxCm: mx });
    const vis = stack([{ label: 'The ' + o[0][0], svg: va }, { label: 'The ' + o[1][0], svg: vb }]);
    const d = a - b;
    return numeric({
      prompt: 'How many millimetres longer is the ' + o[0][0] + ' than the ' + o[1][0] + '?', visual: vis, answer: d, unit: 'mm',
      hint: 'Change both lengths to mm (cm × 10, then add the extra mm), then take away.',
      explain: ex('Difference in mm', ['The ' + o[0][0] + ' is ' + cmmm(a) + ' = <b>' + a + ' mm</b>.', 'The ' + o[1][0] + ' is ' + cmmm(b) + ' = <b>' + b + ' mm</b>.', a + ' − ' + b + ' = <b>' + d + ' mm</b>. ✅']),
      truth: a - b, decode: function(){ return Math.round(V.decodeRuler(va) * 10) - Math.round(V.decodeRuler(vb) * 10); },
      wrong: function(v){ return v === a + b ? 'You added. "How much longer" means find the difference by taking away.' : ''; }
    });
  }
  function t3Words(){
    const nm = pick(['Ana', 'Marcus', 'Sophie', 'Ivan', 'Lucy', 'Diego', 'Ellen', 'Tom', 'Aisha', 'Kai', 'Mei', 'Leo']);
    const form = randInt(0, 2);
    if(form === 0){
      const a = randInt(8, 40), tot = 100, d = tot - a;
      return numeric({
        prompt: nm + ' has a 1 metre ribbon. ' + nm + ' cuts off ' + a + ' cm. How many cm of ribbon are left?', answer: d, unit: 'cm',
        hint: '1 metre is 100 cm. Take away the piece that was cut off.',
        explain: ex('Ribbon left', ['1 m = <b>100 cm</b>.', '100 cm − ' + a + ' cm.', 'There are <b>' + d + ' cm</b> left. ✅']), truth: 100 - a
      });
    }
    if(form === 1){
      const a = randInt(2, 6), b = randInt(15, 45), tot = a * b;
      return numeric({
        prompt: nm + ' lays ' + a + ' strips of paper end to end. Each strip is ' + b + ' cm long. How many cm is that altogether?', answer: tot, unit: 'cm',
        hint: 'Add ' + b + ' cm again and again, ' + a + ' times (or multiply).',
        explain: ex('Strips end to end', [a + ' strips, each ' + b + ' cm.', b + ' × ' + a + ' = ' + Array(a).fill(b).join(' + ') + '.', 'Altogether: <b>' + tot + ' cm</b>. ✅']), truth: Array(a).fill(b).reduce(function(x, y){ return x + y; }, 0)
      });
    }
    const a = randInt(8, 25), b = randInt(30, 70), d = b - a;
    return numeric({
      prompt: 'A pencil is ' + a + ' cm long. A ruler is ' + b + ' cm long. How many cm longer is the ruler?', answer: d, unit: 'cm',
      hint: 'Find the difference: take the shorter length away from the longer.',
      explain: ex('How much longer', ['Ruler: <b>' + b + ' cm</b>. Pencil: <b>' + a + ' cm</b>.', b + ' − ' + a + ' = ?', 'The ruler is <b>' + d + ' cm</b> longer. ✅']), truth: b - a,
      wrong: function(v){ return v === a + b ? 'You added. For "how much longer" take away.' : ''; }
    });
  }
})();
