/* data-line-graphs — Year 4: read time graphs (a quantity changing over the day): values, highest/lowest, rises and falls, differences. */
(function(){
  const NAMES = ['Ana', 'Marcus', 'Sophie', 'Ivan', 'Lucy', 'Diego', 'Ellen', 'Tom', 'Aisha', 'Kai', 'Mei', 'Leo'];
  const THEMES = [
    { intro: 'The temperature in a garden was measured every hour.', unit: '°C', what: 'temperature', noun: 'degrees', title: '°C', hi: 'warmest', lo: 'coolest', maxV: 24, step: 2 },
    { intro: 'A water tank was checked every hour.', unit: ' litres', what: 'amount of water', noun: 'litres', title: 'litres', hi: 'fullest', lo: 'emptiest', maxV: 24, step: 2 },
    { intro: 'A plant was measured as it grew.', unit: ' cm', what: 'height of the plant', noun: 'cm', title: 'cm', hi: 'tallest', lo: 'shortest', maxV: 24, step: 2 }
  ];
  const HOURS = ['8am', '9am', '10am', '11am', '12pm', '1pm', '2pm', '3pm', '4pm'];
  const PX = 20, LEFT = 44, TOP = 24, BOT = 184, W = 340;
  /* verified line graph: every point is <circle class="pt" data-i cx cy>; y labels <text class="yl" data-v>; x labels <text class="xl"> */
  function render(times, vals, o){
    const ymax = o.ymax, step = o.step, n = times.length, pxU = (BOT - TOP) / ymax, slot = (W - LEFT - 40) / (n - 1 || 1);
    let s = '';
    for(let v = 0; v <= ymax + 1e-9; v += step){
      const y = BOT - v * pxU;
      s += '<line x1="' + LEFT + '" y1="' + y.toFixed(2) + '" x2="' + (W - 6) + '" y2="' + y.toFixed(2) + '" stroke="#C9CEE0" stroke-width="1"/><text class="yl" data-v="' + v + '" x="' + (LEFT - 6) + '" y="' + (y + 4).toFixed(2) + '" text-anchor="end" font-size="11" font-weight="700" fill="#1B1B2F">' + v + '</text>';
    }
    s += '<line x1="' + LEFT + '" y1="' + TOP + '" x2="' + LEFT + '" y2="' + BOT + '" stroke="#1B1B2F" stroke-width="2.5"/><line x1="' + LEFT + '" y1="' + BOT + '" x2="' + (W - 6) + '" y2="' + BOT + '" stroke="#1B1B2F" stroke-width="2.5"/>';
    const pts = vals.map(function(v, i){ return [LEFT + 18 + i * slot, BOT - v * pxU]; });
    s += '<polyline points="' + pts.map(function(p){ return p[0].toFixed(2) + ',' + p[1].toFixed(2); }).join(' ') + '" fill="none" stroke="#4F8FE8" stroke-width="3"/>';
    pts.forEach(function(p, i){
      s += '<circle class="pt" data-i="' + i + '" cx="' + p[0].toFixed(2) + '" cy="' + p[1].toFixed(2) + '" r="5" fill="#EB5757" stroke="#fff" stroke-width="1.5"/>';
      s += '<text class="xl" x="' + p[0].toFixed(2) + '" y="' + (BOT + 16) + '" text-anchor="middle" font-size="11" font-weight="800" fill="#1B1B2F">' + times[i] + '</text>';
    });
    if(o.title) s += '<text x="6" y="14" font-size="11" font-weight="800" fill="#9B51E0">' + o.title + '</text>';
    return '<svg viewBox="0 0 ' + W + ' ' + (BOT + 26) + '" width="' + W + '" role="img" style="max-width:100%;height:auto;display:block;margin:0 auto" xmlns="http://www.w3.org/2000/svg" font-family="-apple-system,Segoe UI,Roboto,Arial,sans-serif">' + s + '</svg>';
  }
  function attr(tag, name){ const m = new RegExp(name + '="([^"]*)"').exec(tag); return m ? m[1] : null; }
  function tagsOfClass(html, cls){ return html.match(new RegExp('<[a-z]+[^>]*class="' + cls + '"[^>]*>', 'g')) || []; }
  function decode(html){
    const L = tagsOfClass(html, 'yl').map(function(t){ return { v: parseFloat(attr(t, 'data-v')), y: parseFloat(attr(t, 'y')) - 4 }; }), a = L[0], b = L[L.length - 1];
    return tagsOfClass(html, 'pt').map(function(t){ return Math.round((a.v + (parseFloat(attr(t, 'cy')) - a.y) / (b.y - a.y) * (b.v - a.v)) * 100) / 100; });
  }
  function xlabels(html){ return (html.match(/<text class="xl"[^>]*>([^<]*)</g) || []).map(function(t){ return t.replace(/.*>/, '').replace('<', ''); }); }
  V.extra.linegraph = { render: function(times, vals, o){ return render(times, vals, o); }, verify: function(a, html){ const d = decode(html); return JSON.stringify(d) === JSON.stringify(a[1]) ? '' : 'line graph draws ' + JSON.stringify(d) + ' not ' + JSON.stringify(a[1]); } };

  /* build a believable data set: 7-9 hourly readings, even values, with one clear peak and trough, no ties for max/min */
  function dataset(){
    const th = pick(THEMES), n = randInt(6, 9), times = HOURS.slice(0, n);
    for(let k = 0; k < 500; k++){
      const vals = []; let v = randInt(2, 8) * 2;
      for(let i = 0; i < n; i++){ vals.push(v); v += pick([-4, -2, 0, 2, 2, 4, -2]); v = Math.max(2, Math.min(th.maxV - 2, v)); }
      const mx = Math.max.apply(null, vals), mn = Math.min.apply(null, vals);
      if(vals.filter(function(x){ return x === mx; }).length === 1 && vals.filter(function(x){ return x === mn; }).length === 1 && mx - mn >= 6) return { th: th, times: times, vals: vals, vis: render(times, vals, { ymax: th.maxV, step: th.step, title: th.title }) };
    }
    const vals = [4, 6, 10, 14, 12, 8]; return { th: th, times: HOURS.slice(0, 6), vals: vals, vis: render(HOURS.slice(0, 6), vals, { ymax: th.maxV, step: th.step, title: th.title }) };
  }
  function indexOfMax(a){ let b = 0; a.forEach(function(v, i){ if(v > a[b]) b = i; }); return b; }
  function indexOfMin(a){ let b = 0; a.forEach(function(v, i){ if(v < a[b]) b = i; }); return b; }
  function readAt(d, i){ return decode(d.vis)[i]; }
  function unitOf(d, v){ return v + d.th.unit; }
  function stepsAlong(vals, i, j){ let x = vals[i], n = 0; const dir = vals[j] > x ? 1 : -1; while(x !== vals[j]){ x += dir; n++; } return n; }

  /* ---- tier 1 ---- */
  function qReadAt(){
    const d = dataset(), i = randInt(0, d.times.length - 1), ans = d.vals[i];
    return mcqNum({ prompt: d.th.intro + ' What was the ' + d.th.what + ' at <b>' + d.times[i] + '</b>?', visual: d.vis, answer: ans, fmt: function(v){ return unitOf(d, v); },
      wrong: [{ v: ans + 2, why: 'Go straight up from ' + d.times[i] + ' to the dot, then straight across to the side numbers.' }, { v: ans - 2, why: 'Go straight up from ' + d.times[i] + ' to the dot, then straight across to the side numbers.' }, { v: d.vals[Math.min(i + 1, d.times.length - 1)] !== ans ? d.vals[Math.min(i + 1, d.times.length - 1)] : ans + 4, why: 'That is the reading for the next time. Check the time under the dot.' }, { v: d.vals[Math.max(i - 1, 0)] !== ans ? d.vals[Math.max(i - 1, 0)] : ans - 4, why: 'That is the reading for the time before. Check the time under the dot.' }],
      nearby: [2, -2, 4, -4], valid: function(v){ return v >= 0 && v <= d.th.maxV; }, count: 4, hint: 'Find ' + d.times[i] + ' along the bottom. Go up to the dot, then across to the numbers on the left.',
      explain: ex('Reading a time graph', ['Find <b>' + d.times[i] + '</b> along the bottom and go up to the dot.', 'Read across to the side: <b>' + unitOf(d, ans) + '</b>. ✅']), truth: d.vals[i], decode: function(){ return decode(d.vis)[i]; } });
  }
  function qHighest(){
    const d = dataset(), askHi = chance(0.5), idx = askHi ? indexOfMax(d.vals) : indexOfMin(d.vals), ans = d.times[idx];
    const others = d.times.filter(function(_, k){ return k !== idx; });
    const near = [idx - 1, idx + 1].filter(function(k){ return k >= 0 && k < d.times.length; }).map(function(k){ return d.times[k]; });
    const ds = []; near.concat(shuffle(others)).forEach(function(t){ if(ds.every(function(x){ return x.key !== 't:' + t; })) ds.push(opt('t:' + t, t, t + ' is not the ' + (askHi ? 'highest' : 'lowest') + ' point of the line.')); });
    return mcq({ prompt: d.th.intro + ' At what time was the ' + d.th.what + ' the <b>' + (askHi ? 'highest' : 'lowest') + '</b>?', visual: d.vis, correct: opt('t:' + ans, ans), distractors: ds, keepOrder: true, count: 4,
      hint: 'Look for the ' + (askHi ? 'highest' : 'lowest') + ' dot on the line. Then read the time underneath it.', explain: ex('Highest and lowest', ['The ' + (askHi ? 'highest' : 'lowest') + ' dot is at <b>' + ans + '</b>.', 'There the ' + d.th.what + ' was ' + unitOf(d, askHi ? Math.max.apply(null, d.vals) : Math.min.apply(null, d.vals)) + '. ✅']),
      truth: 't:' + d.times[(function(){ const dv = decode(d.vis); return askHi ? dv.indexOf(Math.max.apply(null, dv)) : dv.indexOf(Math.min.apply(null, dv)); })()], decode: function(){ const dv = decode(d.vis), xs = xlabels(d.vis); return 't:' + xs[askHi ? dv.indexOf(Math.max.apply(null, dv)) : dv.indexOf(Math.min.apply(null, dv))]; } });
  }
  /* ---- tier 2 ---- */
  function qRiseFall(){
    const d = dataset(); let i, j, tries = 0;
    do { i = randInt(0, d.times.length - 2); j = i + 1; tries++; } while(d.vals[i] === d.vals[j] && tries < 40);
    if(d.vals[i] === d.vals[j]) return qReadAt();
    const rose = d.vals[j] > d.vals[i];
    return mcq2({ prompt: d.th.intro + ' Between <b>' + d.times[i] + '</b> and <b>' + d.times[j] + '</b>, did the ' + d.th.what + ' go <b>up</b> or <b>down</b>?', visual: d.vis,
      correct: opt(K.bool(rose), rose ? 'Up' : 'Down', rose ? 'The line slopes up, so the number went up.' : 'The line slopes down, so the number went down.'), other: opt(K.bool(!rose), rose ? 'Down' : 'Up', rose ? 'The line goes UP between these times.' : 'The line goes DOWN between these times.'),
      hint: 'If the line climbs from left to right, the number goes up.', explain: ex('Up or down?', ['At ' + d.times[i] + ' it was ' + unitOf(d, d.vals[i]) + ' and at ' + d.times[j] + ' it was ' + unitOf(d, d.vals[j]) + '.', 'Answer: <b>' + (rose ? 'Up' : 'Down') + '</b>. ✅']), truth: K.bool(decode(d.vis)[j] > decode(d.vis)[i]) });
  }
  function qDiff(){
    const d = dataset(); let i, j, tries = 0;
    do { i = randInt(0, d.times.length - 1); j = randInt(0, d.times.length - 1); tries++; } while((i === j || d.vals[i] === d.vals[j]) && tries < 60);
    const hi = d.vals[i] > d.vals[j] ? i : j, lo = hi === i ? j : i, ans = d.vals[hi] - d.vals[lo];
    return mcqNum({ prompt: d.th.intro + ' How many ' + d.th.noun + ' higher was it at <b>' + d.times[hi] + '</b> than at <b>' + d.times[lo] + '</b>?', visual: d.vis, answer: ans, fmt: function(v){ return v + ' ' + d.th.noun; },
      wrong: [{ v: d.vals[hi], why: 'That is the reading at ' + d.times[hi] + '. Take away the reading at ' + d.times[lo] + '.' }, { v: d.vals[hi] + d.vals[lo], why: 'You added. To find how much higher, subtract.' }, { v: ans + 2, why: 'Read both dots again, then subtract.' }, { v: ans - 2 > 0 ? ans - 2 : ans + 4, why: 'Read both dots again, then subtract.' }, { v: d.vals[lo], why: 'That is the reading at ' + d.times[lo] + '. We want how much HIGHER the other one is.' }, { v: ans + 4, why: 'Read both dots again, then subtract.' }, { v: ans + 6, why: 'Read both dots again, then subtract.' }],
      nearby: [2, -2, 4, 6, -4], valid: function(v){ return v > 0; }, count: 4, hint: 'Read both dots, then subtract the smaller from the bigger.',
      explain: ex('Finding the difference', [d.times[hi] + ': ' + unitOf(d, d.vals[hi]) + '. ' + d.times[lo] + ': ' + unitOf(d, d.vals[lo]) + '.', d.vals[hi] + ' − ' + d.vals[lo] + ' = <b>' + ans + '</b> ' + d.th.noun + '. ✅']), truth: stepsAlong(d.vals, lo, hi), decode: function(){ const dv = decode(d.vis); return dv[hi] - dv[lo]; } });
  }
  function qWhenReach(){
    const d = dataset(), target = pick(d.vals.filter(function(v, k){ return d.vals.indexOf(v) === k; })), k = d.vals.indexOf(target), ans = d.times[k];
    const ds = []; d.times.forEach(function(t, q){ if(q !== k) ds.push(opt('t:' + t, t, 'At ' + t + ' it was ' + unitOf(d, d.vals[q]) + ', not ' + unitOf(d, target) + '.')); });
    return mcq({ prompt: d.th.intro + ' At what time was it <b>' + unitOf(d, target) + '</b>?', visual: d.vis, correct: opt('t:' + ans, ans), distractors: shuffle(ds), keepOrder: true, count: 4,
      hint: 'Find ' + unitOf(d, target) + ' on the side. Go across to the dot, then down to the time.', explain: ex('Reading backwards', ['Find ' + unitOf(d, target) + ' on the side numbers and go across to the dot.', 'Then read the time underneath: <b>' + ans + '</b>. ✅']), truth: 't:' + d.times[decode(d.vis).indexOf(target)] });
  }
  /* ---- tier 3: typed ---- */
  function qDiffTyped(){
    const d = dataset(); let i, j, tries = 0;
    do { i = randInt(0, d.times.length - 1); j = randInt(0, d.times.length - 1); tries++; } while((i === j || d.vals[i] === d.vals[j]) && tries < 60);
    const hi = d.vals[i] > d.vals[j] ? i : j, lo = hi === i ? j : i, ans = d.vals[hi] - d.vals[lo];
    return numeric({ prompt: d.th.intro + ' How many ' + d.th.noun + ' higher was it at <b>' + d.times[hi] + '</b> than at <b>' + d.times[lo] + '</b>? Type the number.', visual: d.vis, answer: ans, hint: 'Read both dots, then subtract.',
      explain: ex('Finding the difference', [d.times[hi] + ': ' + unitOf(d, d.vals[hi]) + '. ' + d.times[lo] + ': ' + unitOf(d, d.vals[lo]) + '.', d.vals[hi] + ' − ' + d.vals[lo] + ' = <b>' + ans + '</b>. ✅']), truth: stepsAlong(d.vals, lo, hi), decode: function(){ const dv = decode(d.vis); return dv[hi] - dv[lo]; },
      wrong: function(v){ return v === d.vals[hi] + d.vals[lo] ? 'You added. Subtract to find how much higher.' : ''; } });
  }
  function qRange(){
    const d = dataset(), mx = Math.max.apply(null, d.vals), mn = Math.min.apply(null, d.vals);
    return numeric({ prompt: d.th.intro + ' What is the difference between the <b>' + d.th.hi + '</b> and the <b>' + d.th.lo + '</b> readings? Type the number.', visual: d.vis, answer: mx - mn, hint: 'Find the highest dot and the lowest dot. Subtract.',
      explain: ex('Highest minus lowest', ['Highest: ' + unitOf(d, mx) + '. Lowest: ' + unitOf(d, mn) + '.', mx + ' − ' + mn + ' = <b>' + (mx - mn) + '</b>. ✅']), truth: (function(){ const dv = decode(d.vis); return stepsAlong([Math.min.apply(null, dv), Math.max.apply(null, dv)], 0, 1); })(), decode: function(){ const dv = decode(d.vis); return Math.max.apply(null, dv) - Math.min.apply(null, dv); } });
  }
  function qBiggestJump(){
    const d = dataset(); let best = 0, bi = 0;
    for(let k = 0; k < d.vals.length - 1; k++){ const j = Math.abs(d.vals[k + 1] - d.vals[k]); if(j > best){ best = j; bi = k; } }
    const unique = d.vals.slice(0, -1).filter(function(_, k){ return Math.abs(d.vals[k + 1] - d.vals[k]) === best; }).length === 1;
    if(!unique) return qRange();
    return mcq({ prompt: d.th.intro + ' Between which two times did it change the <b>most</b>?', visual: d.vis, correct: opt('j:' + bi, d.times[bi] + ' and ' + d.times[bi + 1]),
      distractors: d.times.slice(0, -1).map(function(t, k){ return k === bi ? null : opt('j:' + k, t + ' and ' + d.times[k + 1], 'That change is ' + Math.abs(d.vals[k + 1] - d.vals[k]) + ', but another gap changes by ' + best + '.'); }).filter(Boolean), keepOrder: false, count: 4,
      hint: 'The steepest part of the line is the biggest change.', explain: ex('Steepest part', ['The line changes most between ' + d.times[bi] + ' and ' + d.times[bi + 1] + ': from ' + unitOf(d, d.vals[bi]) + ' to ' + unitOf(d, d.vals[bi + 1]) + '.', 'That is a change of <b>' + best + '</b>. ✅']),
      truth: 'j:' + (function(){ const dv = decode(d.vis); let b = 0, bk = 0; for(let k = 0; k < dv.length - 1; k++){ const jj = Math.abs(dv[k + 1] - dv[k]); if(jj > b){ b = jj; bk = k; } } return bk; })() });
  }
  function qWord(){
    const d = dataset(), who = pick(NAMES), i = randInt(0, d.times.length - 1), extra = pick([2, 4, 6]);
    return numeric({ prompt: d.th.intro + ' At <b>' + d.times[i] + '</b> ' + who + ' reads the value on the graph. Then it goes up by <b>' + extra + '</b>. What is the new value? Type the number.', visual: d.vis, answer: d.vals[i] + extra, hint: 'First read the dot at ' + d.times[i] + ', then add ' + extra + '.',
      explain: ex('Read, then add', ['At ' + d.times[i] + ' the reading is ' + d.vals[i] + '.', d.vals[i] + ' + ' + extra + ' = <b>' + (d.vals[i] + extra) + '</b>. ✅']), truth: decode(d.vis)[i] + extra, decode: function(){ return decode(d.vis)[i] + extra; },
      wrong: function(v){ return v === d.vals[i] ? 'That is only the reading. Now add ' + extra + '.' : ''; } });
  }
  const LV1 = render(['8am', '9am', '10am', '11am', '12pm'], [6, 8, 12, 14, 10], { ymax: 24, step: 2, title: '°C' });
  registerSkill({
    id: 'data-line-graphs', strand: 'data', name: 'Time graphs', emoji: '📈', year: 4, order: 840, prereq: ['data-bar-charts'],
    lesson: { title: 'Reading a time graph', steps: [
      { say: 'A <b>time graph</b> shows how something changes over time. The <b>bottom</b> shows the time and the <b>side</b> shows the amount. Each dot is one reading, joined by a line.', vis: { kind: 'linegraph', args: [['8am', '9am', '10am', '11am', '12pm'], [6, 8, 12, 14, 10], { ymax: 24, step: 2, title: '°C' }] } },
      { say: 'To read a value: find the time at the bottom, go <b>up</b> to the dot, then <b>across</b> to the side numbers. At 10am it is <b>12°C</b>. The line going <b>up</b> means it is rising; going <b>down</b> means it is falling.', vis: { kind: 'linegraph', args: [['8am', '9am', '10am', '11am', '12pm'], [6, 8, 12, 14, 10], { ymax: 24, step: 2, title: '°C' }] },
        quiz: { prompt: 'Between 11am and 12pm, did the temperature go up or down?', options: [{ label: 'Down', ok: true }, { label: 'Up', ok: false }], right: 'Yes! 14°C to 10°C: the line slopes down.', wrong: 'At 11am it was 14°C and at 12pm 10°C. The line goes down.' } },
      { say: 'To find a <b>difference</b>, read both dots and subtract. Highest 14°C, lowest 6°C: 14 − 6 = <b>8°C</b>. The steepest part of the line is where it changed the most.', vis: { kind: 'linegraph', args: [['8am', '9am', '10am', '11am', '12pm'], [6, 8, 12, 14, 10], { ymax: 24, step: 2, title: '°C' }] },
        quiz: { prompt: 'How much warmer was it at 11am (14°C) than at 9am (8°C)?', options: [{ label: '6°C', ok: true }, { label: '22°C', ok: false }, { label: '14°C', ok: false }], right: 'Yes! 14 − 8 = 6.', wrong: 'Subtract: 14 − 8 = 6.' } }
    ] },
    trick: { title: 'Up, across, subtract', say: 'Find the <b>time</b> at the bottom, go <b>up</b> to the dot, then <b>across</b> to read the amount. For a difference, read both dots and <b>subtract</b>.', vis: { kind: 'linegraph', args: [['8am', '9am', '10am', '11am', '12pm'], [6, 8, 12, 14, 10], { ymax: 24, step: 2, title: '°C' }] }, example: 'Highest 14, lowest 6 → difference 14 − 6 = <b>8</b>' },
    gen: {
      1: function(){ return pick([qReadAt, qReadAt, qHighest])(); },
      2: function(){ return pick([qDiff, qRiseFall, qWhenReach, qHighest, qReadAt])(); },
      3: function(){ return pick([qDiffTyped, qDiffTyped, qRange, qBiggestJump, qWord])(); }
    }
  });
})();
