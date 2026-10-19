/* number-line-3digit — read and place 3-digit numbers on number lines with different scales. */
(function(){
  const nk = K.num;

  function S(min, max, minor, major){ return { min: min, max: max, minor: minor, major: major }; }
  function hundredScale(minor, major){ const m = randInt(0, 8) * 100; return S(m, m + 100, minor, major); }
  function nLabels(s){ return Math.floor((s.max - s.min) / s.major) + 1; }
  function widthFor(s, base){
    const d = String(s.max).length;
    return Math.max(base || 320, 40 + nLabels(s) * (d * 8 + 6));
  }
  function line(s, value, kind, o){
    o = o || {};
    return V.numberLine({
      min: s.min, max: s.max, minor: s.minor, major: s.major, width: o.width || widthFor(s),
      marks: [{ value: value, kind: kind || 'dot' }],
      labels: (o.hideLabel && kind === 'q') ? function(v){ return v === value ? '' : v; } : undefined
    });
  }
  function readValue(html){ return Math.round(V.decodeNumberLine(html)); }
  function ticksOf(s){ const a = []; for(let v = s.min; v <= s.max + 1e-9; v += s.minor) a.push(v); return a; }
  /* tick values that are NOT labelled and not the ends (or labelled when allowLabelled) */
  function pickTick(s, allowLabelled){
    const c = ticksOf(s).filter(function(v){ return v > s.min && v < s.max && (allowLabelled || (v - s.min) % s.major !== 0); });
    return pick(c);
  }
  function lowerLabel(s, v){ return s.min + Math.floor((v - s.min) / s.major) * s.major; }

  function readWrongs(s, v){
    const w = [], lo = lowerLabel(s, v), hi = lo + s.major, k = (v - lo) / s.minor;
    if(s.minor > 1 && k > 0 && lo !== v) w.push({ v: lo + k, why: 'You counted each little step as 1. On this line each little step is worth ' + s.minor + '.' });
    if(lo !== v) w.push({ v: lo, why: 'That is the labelled number just BEFORE the dot. The dot is ' + k + ' little step' + (k === 1 ? '' : 's') + ' further on.' });
    if(hi !== v && hi <= s.max) w.push({ v: hi, why: 'That is the next labelled number. The dot has not got there yet.' });
    w.push({ v: v + s.minor, why: 'That is one little step too far.' });
    w.push({ v: v - s.minor, why: 'That is one little step too few.' });
    w.push({ v: v + 2 * s.minor, why: 'Count the little steps again from the labelled number.' });
    return w;
  }
  function readExplain(s, v){
    const lo = lowerLabel(s, v), k = (v - lo) / s.minor, per = s.major / s.minor;
    const st = [];
    if(lo === v){ st.push('The dot sits right on the labelled number <b>' + v + '</b>. ✅'); return st; }
    st.push('Two labels are <b>' + s.major + '</b> apart and the small spaces between them number <b>' + per + '</b>. So each small step is ' + s.major + ' ÷ ' + per + ' = <b>' + s.minor + '</b>.');
    st.push('The dot is <b>' + k + '</b> small step' + (k === 1 ? '' : 's') + ' after ' + lo + '.');
    st.push(lo + ' + ' + k + ' × ' + s.minor + ' = <b>' + v + '</b>. ✅');
    return st;
  }

  /* what number is the dot/? at ? (mcq or typed) */
  function qRead(s, v, o){
    o = o || {};
    const kind = o.q ? 'q' : 'dot';
    const vis = line(s, v, kind, { hideLabel: o.hide });
    const common = {
      prompt: (o.q ? 'What number is the <b>?</b> on this number line?' : 'What number is the dot pointing at?'), visual: vis, answer: v,
      hint: 'Find the labelled number just before the dot. Work out how much each little step is worth, then count the steps.',
      explain: ex('Reading the number line', readExplain(s, v)), truth: ticksOf(s)[Math.round((v - s.min) / s.minor)], decode: function(){ return readValue(vis); }
    };
    if(o.typed){
      common.prompt += ' Type the number.';
      common.truth = (function(){ return Number(String(v)); })();
      common.wrong = function(x){ const w = readWrongs(s, v).filter(function(y){ return y.v === x; })[0]; return w ? w.why : ''; };
      return numeric(common);
    }
    common.wrong = readWrongs(s, v); common.count = o.count || 4; common.nearby = [s.minor, -s.minor, 2 * s.minor, -2 * s.minor, 10, -10];
    return mcqNum(common);
  }

  /* which line shows N ? (picture options) */
  function qPickLine(s, count){
    const v = pickTick(s, true);
    const cands = [v - s.minor, v + s.minor, v - 2 * s.minor, v + 2 * s.minor, s.min + s.max - v, lowerLabel(s, v), lowerLabel(s, v) + (v - lowerLabel(s, v)) / s.minor].filter(function(x){ return x > s.min && x < s.max && x !== v; });
    const seen = {}; seen[nk(v)] = 1; const ds = [];
    cands.forEach(function(x){
      if(seen[nk(x)]) return; seen[nk(x)] = 1;
      ds.push(opt(nk(x), line(s, x, 'dot', { width: 300 }), 'That dot is at ' + x + ', not ' + v + '. Work out the step size, then count from a label.'));
    });
    ticksOf(s).forEach(function(x){ if(x > s.min && x < s.max && !seen[nk(x)]){ seen[nk(x)] = 1; ds.push(opt(nk(x), line(s, x, 'dot', { width: 300 }), 'That dot is at ' + x + ', not ' + v + '.')); } });
    const q = mcq({
      prompt: 'Which number line has the dot at <b>' + v + '</b>?', correct: opt(nk(v), line(s, v, 'dot', { width: 300 })), distractors: ds, keepOrder: true, count: count,
      hint: 'Work out how much each small step is worth. Then find ' + v + ' by counting from a labelled number.',
      explain: ex('Finding ' + v, readExplain(s, v).length > 1 ? readExplain(s, v).slice(0, 2).concat(['So the dot for <b>' + v + '</b> is in this place. ✅']) : ['The labelled number <b>' + v + '</b> has the dot right on it. ✅']),
      truth: nk(v)
    });
    q.optionsAreVisual = true;
    q.decodeKey = function(){ for(let i = 0; i < q.options.length; i++){ if(nk(readValue(q.options[i].label)) !== q.options[i].key) return 'option ' + i + ' picture does not match its key'; } return q.options[q.correct].key; };
    return q;
  }

  /* which labelled/tick number is the dot nearest to ? */
  function qNearest(s, typed){
    const ts = ticksOf(s), k = randInt(0, ts.length - 2), lo = ts[k], hi = ts[k + 1];
    const fr = pick([0.1, 0.2, 0.3]), off = Math.round(fr * s.minor);
    const nearLow = chance(0.5), v = nearLow ? lo + off : hi - off;
    const near = nearLow ? lo : hi, far = nearLow ? hi : lo;
    const vis = line(s, v, 'dot');
    const ds = [opt(nk(far), String(far), 'That tick is further away. The dot is only ' + off + ' from ' + near + ' but ' + (s.minor - off) + ' from ' + far + '.')];
    const beyond = nearLow ? lo - s.minor : hi + s.minor;
    if(beyond >= s.min && beyond <= s.max) ds.push(opt(nk(beyond), String(beyond), 'That tick is on the other side, much further away.'));
    const extra = nearLow ? hi + s.minor : lo - s.minor;
    if(extra >= s.min && extra <= s.max) ds.push(opt(nk(extra), String(extra), 'That tick is too far away. Look at the two ticks right next to the dot.'));
    ds.push(opt(nk(v), String(v), 'The dot is between ticks. Pick the tick it is closest to.'));
    ds.push(opt(nk(near + (nearLow ? -2 : 2) * s.minor), String(near + (nearLow ? -2 : 2) * s.minor), 'That is far from the dot.'));
    return mcq({
      prompt: 'Which tick mark is the dot <b>nearest</b> to?', visual: vis, correct: opt(nk(near), String(near)), distractors: ds, keepOrder: true, count: 3,
      hint: 'The dot sits between two ticks. Which tick is it closer to? Ignore the one that is further away.',
      explain: ex('Finding the nearest tick', ['The dot sits between <b>' + lo + '</b> and <b>' + hi + '</b>.', 'It is closer to <b>' + near + '</b> than to ' + far + '.', 'So the nearest tick is <b>' + near + '</b>. ✅']),
      truth: nk(Math.abs(v - lo) < Math.abs(v - hi) ? lo : hi),
      decode: function(){ const d = readValue(vis); return nk(s.min + Math.round((d - s.min) / s.minor) * s.minor); }
    });
  }

  /* how much is each little step worth ? */
  function qStepSize(s){
    const vis = line(s, pickTick(s, true), 'dot');
    const per = s.major / s.minor;
    const w = [{ v: s.major, why: 'That is the gap between two LABELS. The little steps between them are smaller.' }, { v: per, why: 'That is how many little steps fit between two labels, not what each is worth.' }, { v: per + 1, why: 'You counted the ticks. Count the SPACES between ticks instead.' }, { v: 1, why: 'Not every line goes up in 1s. Work it out from the labels.' }];
    return mcqNum({
      prompt: 'Look at the labels and the small ticks. How much is <b>one small step</b> worth?', visual: vis, answer: s.minor, wrong: w, count: 4, nearby: [10, 5, 20, 2],
      hint: 'Take two labels that are next to each other. Count the SPACES between them (not the ticks), then share the gap between the labels equally.',
      explain: ex('Working out the step', ['Two labels are <b>' + s.major + '</b> apart.', 'There are <b>' + per + '</b> small spaces between them.', s.major + ' ÷ ' + per + ' = <b>' + s.minor + '</b>. Each small step is worth ' + s.minor + '. ✅']),
      truth: (s.max - s.min) / (V.countTicks(vis) - 1)
    });
  }

  /* exactly halfway between two labels */
  function qHalfway(){
    const major = pick([100, 100, 20, 10]);
    let lo, s;
    if(major === 100){ lo = randInt(0, 8) * 100; s = S(lo >= 100 ? lo - 100 : 0, lo + 200 <= 1000 ? lo + 200 : 1000, 50, 100); }
    else { lo = (major === 20 ? randInt(0, 4) * 20 : randInt(0, 9) * 10) + randInt(0, 8) * 100; s = S(Math.floor(lo / 100) * 100, Math.floor(lo / 100) * 100 + 100, major / 2, major); }
    const hi = lo + major, mid = lo + major / 2;
    if((lo - s.min) % s.major !== 0 || hi > s.max) return qHalfway();
    const vis = line(s, mid, 'dot');
    const w = [{ v: lo, why: 'That is the left label. The dot is halfway to the next one.' }, { v: hi, why: 'That is the right label. The dot is halfway, not there yet.' }, { v: lo - major / 2, why: 'That is on the wrong side of ' + lo + '. Halfway is between ' + lo + ' and ' + hi + '.' }, { v: lo + major / 5, why: 'Halfway is half of the gap between labels: half of ' + major + ' is ' + major / 2 + '.' }];
    return mcqNum({
      prompt: 'The dot is exactly <b>halfway</b> between ' + lo + ' and ' + hi + '. What number is it?', visual: vis, answer: mid, wrong: w, count: 4, nearby: [10, -10, 5, -5],
      hint: 'Halfway means half of the gap. How big is the gap between the two labels? What is half of that?',
      explain: ex('Halfway', ['The gap from ' + lo + ' to ' + hi + ' is <b>' + major + '</b>.', 'Half of ' + major + ' is <b>' + major / 2 + '</b>.', lo + ' + ' + major / 2 + ' = <b>' + mid + '</b>. ✅']),
      truth: (lo + hi) / 2, decode: function(){ return readValue(vis); }
    });
  }

  registerSkill({
    id: 'number-line-3digit', strand: 'number', name: 'Number lines to 1000', emoji: '📏', year: 3, order: 150, prereq: ['number-place-value'],
    lesson: {
      title: 'Reading number lines',
      steps: [
        { say: 'Every number line has <b>labels</b> (the big numbers). This one goes up in <b>10s</b>: 0, 10, 20… The dot is on <b>70</b>.', vis: { kind: 'numberLine', args: [{ min: 0, max: 100, minor: 10, major: 10, width: 370, marks: [{ value: 70 }] }] } },
        { say: 'This line goes from 0 to 1000 in <b>100s</b>. The dot is on <b>400</b>. Always check how the labels count before you read a dot.', vis: { kind: 'numberLine', args: [{ min: 0, max: 1000, minor: 100, major: 100, width: 460, marks: [{ value: 400 }] }] } },
        { say: 'Sometimes only some ticks have labels. Here the labels are 100, 150, 200 and the small ticks are <b>10</b> apart. The dot is <b>3 small steps</b> after 100: <b>130</b>.', vis: { kind: 'numberLine', args: [{ min: 100, max: 200, minor: 10, major: 50, marks: [{ value: 130 }] }] },
          quiz: { prompt: 'The labels 100 and 150 have 5 small spaces between them. How much is each small step?', options: [{ label: '5', ok: false }, { label: '10', ok: true }, { label: '50', ok: false }], right: 'Yes! 50 ÷ 5 = 10.', wrong: 'The gap between the labels is 50. Share it between 5 spaces: 50 ÷ 5 = 10.' } },
        { say: 'Now read this one. Labels are 300, 350, 400. Each small step is 10. The dot is 6 small steps after 300, so it is on <b>360</b>.', vis: { kind: 'numberLine', args: [{ min: 300, max: 400, minor: 10, major: 50, marks: [{ value: 360 }] }] },
          quiz: { prompt: 'The dot is 6 small steps after 300 and each step is 10. What number is it?', options: [{ label: '306', ok: false }, { label: '360', ok: true }, { label: '350', ok: false }], right: 'Yes! 6 × 10 = 60, and 300 + 60 = 360.', wrong: 'Each step is 10, not 1. 6 steps = 60, and 300 + 60 = 360.' } },
        { say: 'If the dot is <b>between</b> two ticks, find the tick it is <b>nearest</b> to. This dot is nearer to <b>60</b> than to 70.', vis: { kind: 'numberLine', args: [{ min: 0, max: 100, minor: 10, major: 10, width: 370, marks: [{ value: 63 }] }] },
          quiz: { prompt: 'Which tick is the dot nearest to?', options: [{ label: '60', ok: true }, { label: '70', ok: false }, { label: '50', ok: false }], right: 'Yes! It is only a tiny bit past 60.', wrong: 'The dot is just past 60. It is much closer to 60 than to 70.' } }
      ]
    },
    trick: {
      title: 'Count the spaces, not the lines',
      say: 'To find the size of a small step, <b>count the spaces</b> between two labels, not the ticks. Then <b>share</b> the gap between the labels by the number of spaces.',
      vis: { kind: 'numberLine', args: [{ min: 100, max: 200, minor: 10, major: 50, marks: [{ value: 170 }] }] },
      example: 'Labels <b>100</b> and <b>150</b> are 50 apart with <b>5 spaces</b>: 50 ÷ 5 = <b>10</b> each. The dot is 7 steps after 100: 100 + 70 = <b>170</b>.'
    },
    gen: {
      1: function(){
        switch(randInt(0, 3)){
          case 0: { const s = pick([S(0, 100, 10, 10), S(0, 1000, 100, 100), hundredScale(10, 20)]); const v = pickTick(s, true); return qRead(s, v, { q: false, count: 3 }); }
          case 1: { const s = pick([S(0, 100, 10, 10), S(0, 1000, 100, 100), hundredScale(10, 20)]); const v = pickTick(s, true); return qRead(s, v, { q: true, hide: true, count: 3 }); }
          case 2: { const s = pick([S(0, 100, 10, 10), S(0, 1000, 100, 100)]); return qPickLine(s, 3); }
          default: { const s = S(0, 100, 10, 10); const v = pickTick(s, true); return qRead(s, v, { q: false, count: 3 }); }
        }
      },
      2: function(){
        const sc = [S(0, 100, 10, 50), S(0, 1000, 50, 100), hundredScale(10, 50), S(0, 500, 50, 100), S(0, 200, 20, 100), S(0, 100, 5, 10), hundredScale(10, 20), S(0, 1000, 100, 500)];
        switch(randInt(0, 5)){
          case 0: case 1: { const s = pick(sc); return qRead(s, pickTick(s, false), { q: chance(0.4), count: 4 }); }
          case 2: return qPickLine(hundredScale(10, 50), 3);
          case 3: return qHalfway();
          case 4: { const s = pick([S(0, 100, 10, 10), hundredScale(10, 50), S(0, 500, 50, 100)]); return qNearest(s, false); }
          default: { const s = pick([hundredScale(10, 50), S(0, 100, 10, 50), S(0, 1000, 100, 500), S(0, 200, 20, 100)]); return qStepSize(s); }
        }
      },
      3: function(){
        const sparse = [hundredScale(10, 100), S(0, 1000, 100, 500), S(0, 100, 10, 100), S(0, 1000, 50, 500), S(0, 200, 20, 100), hundredScale(10, 50), S(0, 500, 50, 500)];
        switch(randInt(0, 7)){
          case 0: case 1: case 2: case 3: { const s = pick(sparse); return qRead(s, pickTick(s, false), { typed: true }); }
          case 4: { const s = pick([S(0, 1000, 50, 500), S(0, 1000, 100, 500), hundredScale(10, 100), S(0, 500, 50, 500), S(0, 1000, 100, 1000)]); return qNearest(s, false); }
          case 5: { const s = pick([hundredScale(10, 100), S(0, 1000, 100, 500), S(0, 200, 20, 100), S(0, 1000, 50, 500)]); return qPickLine(s, 3); }
          case 6: { const s = pick([hundredScale(10, 100), S(0, 1000, 100, 500), S(0, 200, 20, 100), S(0, 100, 10, 50)]); return qStepSize(s); }
          default: return qHalfway();
        }
      }
    }
  });
})();
