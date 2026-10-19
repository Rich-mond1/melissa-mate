/* time-24h-ampm — am/pm and the 24-hour clock. All answer keys are K.time24 (minutes since midnight). */
(function(){
  const NAMES = ['Ana', 'Marcus', 'Sophie', 'Ivan', 'Lucy', 'Diego', 'Ellen', 'Tom', 'Aisha', 'Kai', 'Mei', 'Leo'];
  function t12(h, m, ap){ return h + ':' + pad2(m) + ' ' + ap; }
  function t24(h, m){ return pad2(h) + ':' + pad2(m); }
  function to24(h12, ap){ return ap === 'pm' ? (h12 % 12) + 12 : h12 % 12; }
  // independent parsers: display text -> minutes since midnight
  function parse12(s){ const r = /^(\d{1,2}):(\d{2}) (am|pm)$/.exec(s); if(!r) throw new Error('bad 12h ' + s); return ((+r[1] % 12) * 60 + (+r[2])) + (r[3] === 'pm' ? 720 : 0); }
  function parse24(s){ const r = /^(\d{2}):(\d{2})$/.exec(s); if(!r) throw new Error('bad 24h ' + s); return (+r[1]) * 60 + (+r[2]); }
  function key(total){ return 'T:' + total; }
  function o12(h, m, ap, why){ const l = t12(h, m, ap); return opt(key(parse12(l)), l, why); }
  function o24(h, m, why){ const l = t24(h, m); return opt(key(parse24(l)), l, why); }
  function dec(html){
    const r = />\s*(\d{1,2}):(\d{2})(?:\s*(am|pm))?\s*</.exec(html); if(!r) return 'bad picture';
    let h = +r[1]; if(r[3]) h = (h % 12) + (r[3] === 'pm' ? 12 : 0);
    return K.time24(h, +r[2]);
  }
  const MINS = [0, 5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 55];

  // wrong 24-hour answers for a 12-hour time
  function wrong24(h12, m, ap){
    const h = to24(h12, ap), out = [];
    if(h12 === 12){
      if(ap === 'pm'){
        out.push(o24(0, m, '12 pm is NOON (the middle of the day), not midnight. At noon the 24-hour clock shows 12.'));
        out.push(o24(24, m, 'Do not add 12 to the 12! At noon the 24-hour clock shows 12:' + pad2(m) + '. There is no 24:' + pad2(m) + '.'));
        out.push(o24(13, m, '13:' + pad2(m) + ' is 1:' + pad2(m) + ' pm. At noon it shows 12.'));
      } else {
        out.push(o24(12, m, '12 am is MIDNIGHT, the start of the day. 12:' + pad2(m) + ' on the 24-hour clock is noon.'));
        out.push(o24(24, m, 'There is no 24:' + pad2(m) + ' on a clock. After 23:59 the 24-hour clock goes back to 00:00.'));
        out.push(o24(1, m, '12 am is 00 on the 24-hour clock, not 01.'));
      }
    } else if(ap === 'pm'){
      out.push(o24(h12, m, 'That is ' + t12(h12, m, 'am') + ', in the MORNING. For pm, add 12 to the hour: ' + h12 + ' + 12 = ' + h + '.'));
      if(h12 + 10 < 24) out.push(o24(h12 + 10, m, 'Add 12 to the hour, not 10: ' + h12 + ' + 12 = ' + h + '.'));
      out.push(o24(h - 1, m, 'Check the adding: ' + h12 + ' + 12 = ' + h + '.'));
      if(h + 1 < 24) out.push(o24(h + 1, m, 'Check the adding: ' + h12 + ' + 12 = ' + h + '.'));
    } else {
      out.push(o24(h + 12, m, t12(h12, m, 'am') + ' is in the morning, so the hour does NOT change. ' + t24(h12, m) + ' is the morning time.'));
      out.push(o24(h12 + 10 < 24 ? h12 + 10 : h12 + 1, m, 'am times keep the same hour. Do not add anything.'));
      if(h > 1) out.push(o24(h - 1, m, 'am times keep the same hour: ' + h12 + ' stays ' + h12 + '.'));
      out.push(o24(h + 1, m, 'am times keep the same hour: ' + h12 + ' stays ' + h12 + '.'));
    }
    [-2, 2, -3, 3, 1, -1].forEach(function(d){ const hh = (h + d + 24) % 24; out.push(o24(hh, m, 'Check the hour again.')); });
    MINS.forEach(function(mm){ if(mm !== m) out.push(o24(h, mm, 'Check the minutes: they do not change between the two clocks.')); });
    return out;
  }
  // wrong 12-hour answers for a 24-hour time
  function wrong12(h, m){
    const out = [], h12 = h % 12 || 12, ap = h < 12 ? 'am' : 'pm', op = ap === 'am' ? 'pm' : 'am';
    if(h === 12){
      out.push(o12(12, m, 'am', '12:' + pad2(m) + ' is NOON, which is 12 pm. 12 am is midnight.'));
      out.push(o12(1, m, 'pm', 'Only take 12 away from times AFTER 12:59. At 12:' + pad2(m) + ' the 12-hour clock also shows 12.'));
      out.push(o12(11, m, 'am', '12:' + pad2(m) + ' is just after 11:' + pad2(m) + ' am. It is noon, 12 pm.'));
    } else if(h === 0){
      out.push(o12(12, m, 'pm', '00:' + pad2(m) + ' is just after MIDNIGHT, so it is am. 12 pm is noon.'));
      out.push(o12(1, m, 'am', '00 is 12 on the 12-hour clock (midnight). 1 am is 01:' + pad2(m) + '.'));
      out.push(o12(11, m, 'pm', '11 pm is 23:' + pad2(m) + ', just BEFORE midnight.'));
    } else if(h > 12){
      out.push(o12(h12, m, 'am', 'The hour is right, but 13:00 or later is the afternoon or evening: pm, not am.'));
      if(h - 10 >= 1) out.push(o12(h - 10, m, 'pm', 'Take 12 away from the hour, not 10: ' + h + ' − 12 = ' + h12 + '.'));
      if(h12 < 12) out.push(o12(h12 + 1, m, 'pm', 'Check the take-away: ' + h + ' − 12 = ' + h12 + '.'));
      out.push(o12(h12 - 1 < 1 ? 12 : h12 - 1, m, 'pm', 'Check the take-away: ' + h + ' − 12 = ' + h12 + '.'));
    } else {
      out.push(o12(h12, m, 'pm', t24(h, m) + ' is before 12:00, so it is the morning: am.'));
      out.push(o12(h12 + 1 > 12 ? 1 : h12 + 1, m, 'am', 'In the morning the hour stays the same. ' + t24(h, m) + ' → ' + h12 + '.'));
      out.push(o12(h12 - 1 < 1 ? 12 : h12 - 1, m, 'am', 'In the morning the hour stays the same. ' + t24(h, m) + ' → ' + h12 + '.'));
    }
    [1, -1, 2, -2].forEach(function(d){ const hh = ((h12 - 1 + d + 12) % 12) + 1; out.push(o12(hh, m, ap, 'Check the hour again.')); out.push(o12(hh, m, op, 'Check the hour and am/pm again.')); });
    MINS.forEach(function(mm){ if(mm !== m) out.push(o12(h12, mm, ap, 'Check the minutes: they stay the same.')); });
    return out;
  }
  function expl12to24(h12, m, ap){
    const h = to24(h12, ap), a = t12(h12, m, ap), b = t24(h, m);
    if(h12 === 12) return ex('Converting ' + a, ap === 'pm'
      ? ['12 pm is <b>noon</b>, the middle of the day.', 'Noon is the one time we do NOT add 12: the 24-hour clock shows <b>12</b>.', a + ' is <b>' + b + '</b>. ✅']
      : ['12 am is <b>midnight</b>, the very start of the day.', 'On the 24-hour clock the day starts at <b>00:00</b>.', a + ' is <b>' + b + '</b>. ✅']);
    if(ap === 'pm') return ex('Converting ' + a, [a + ' is in the <b>afternoon or evening</b> (pm).', 'Add 12 to the hour: ' + h12 + ' + 12 = <b>' + h + '</b>.', 'The minutes stay the same, so ' + a + ' is <b>' + b + '</b>. ✅']);
    return ex('Converting ' + a, [a + ' is in the <b>morning</b> (am).', 'In the morning the hour stays <b>' + h12 + '</b>. The 24-hour clock writes two digits: ' + pad2(h12) + '.', a + ' is <b>' + b + '</b>. ✅']);
  }
  function expl24to12(h, m){
    const h12 = h % 12 || 12, ap = h < 12 ? 'am' : 'pm', a = t24(h, m), b = t12(h12, m, ap);
    if(h === 0) return ex('Converting ' + a, ['00 on the 24-hour clock means <b>midnight</b>.', 'Midnight is 12 on a 12-hour clock, and it is am (the day has just begun).', a + ' is <b>' + b + '</b>. ✅']);
    if(h === 12) return ex('Converting ' + a, ['12 on the 24-hour clock means <b>noon</b>.', 'After noon is pm, and the hour stays 12.', a + ' is <b>' + b + '</b>. ✅']);
    if(h > 12) return ex('Converting ' + a, [h + ' is more than 12, so it is <b>pm</b>.', 'Take 12 away: ' + h + ' − 12 = <b>' + h12 + '</b>.', a + ' is <b>' + b + '</b>. ✅']);
    return ex('Converting ' + a, [h + ' is less than 12, so it is the <b>morning</b> (am).', 'The hour stays <b>' + h12 + '</b>.', a + ' is <b>' + b + '</b>. ✅']);
  }
  const EVENTS = [
    { w: 'wakes up', h: 7, m: 0 }, { w: 'has breakfast', h: 7, m: 30 }, { w: 'starts school', h: 8, m: 45 }, { w: 'has morning break', h: 10, m: 15 },
    { w: 'goes swimming', h: 9, m: 0 }, { w: 'watches the sunrise', h: 6, m: 20 }, { w: 'gets home from school', h: 15, m: 30 }, { w: 'has tea', h: 17, m: 45 },
    { w: 'goes to bed', h: 20, m: 0 }, { w: 'has football practice', h: 16, m: 15 }, { w: 'goes to a birthday party', h: 14, m: 0 }, { w: 'watches the fireworks', h: 19, m: 30 },
    { w: 'reads a bedtime story', h: 19, m: 45 }, { w: 'has a snack after school', h: 15, m: 15 }
  ];

  registerSkill({
    id: 'time-24h-ampm', strand: 'time', name: 'am, pm & the 24-hour clock', emoji: '🌗', year: 3, order: 550, prereq: ['time-five-minutes'],
    lesson: {
      title: 'am, pm and the 24-hour clock',
      steps: [
        { say: 'A day has <b>24 hours</b>, so the clock goes round <b>twice</b>. <b>am</b> is the morning, from midnight to noon. <b>pm</b> is from noon to midnight. This is <b>7:30 am</b>, breakfast time!', vis: { kind: 'digital', args: [7, 30, { ampm: 'am' }] } },
        { say: 'After school it is <b>3:15 pm</b>. It is the afternoon, so we write <b>pm</b>.', vis: { kind: 'digital', args: [3, 15, { ampm: 'pm' }] } },
        { say: 'The <b>24-hour clock</b> does not use am or pm. It keeps counting after 12: 13, 14, 15 … For <b>pm</b>, <b>add 12</b>: 3 + 12 = 15, so 3:15 pm is <b>15:15</b>.', vis: { kind: 'digital', args: [15, 15, { h24: true }] } },
        { say: 'For <b>am</b> times the hour stays the same. We write two digits, so 8:05 am is <b>08:05</b>.', vis: { kind: 'digital', args: [8, 5, { h24: true }] },
          quiz: { prompt: 'What is 6:45 pm on the 24-hour clock?', options: [{ label: '18:45', ok: true }, { label: '06:45', ok: false }, { label: '16:45', ok: false }], right: 'Yes! pm means add 12: 6 + 12 = 18, so 18:45.', wrong: 'pm means add 12 to the hour: 6 + 12 = 18. So 6:45 pm is 18:45.' } },
        { say: 'Two special times: <b>12:00</b> is <b>noon</b> (12 pm) and <b>00:00</b> is <b>midnight</b> (12 am). To go back from 24-hour time, take 12 away: <b>19:30</b> is 7:30 pm.', vis: { kind: 'digital', args: [19, 30, { h24: true }] },
          quiz: { prompt: 'What is 17:20 on a 12-hour clock?', options: [{ label: '5:20 pm', ok: true }, { label: '5:20 am', ok: false }, { label: '7:20 pm', ok: false }], right: 'Yes! 17 − 12 = 5, and it is after noon, so 5:20 pm.', wrong: '17 is more than 12, so it is pm. Take 12 away: 17 − 12 = 5. So 5:20 pm.' } }
      ]
    },
    trick: {
      title: 'Add 12, take away 12',
      say: 'Going <b>to</b> 24-hour time: if it is <b>pm</b>, <b>add 12</b>. Going <b>back</b>: if the hour is <b>bigger than 12</b>, <b>take 12 away</b> and say pm. Morning times stay the same. Only noon (12:00) and midnight (00:00) are special.',
      vis: { kind: 'digital', args: [17, 40, { h24: true }] },
      example: '5:40 pm → 5 + 12 = 17 → <b>17:40</b>. And 17:40 → 17 − 12 = 5 → <b>5:40 pm</b>.'
    },
    gen: {
      1: function(){
        const f = randInt(0, 2);
        if(f === 0){ // am or pm for an event
          const ev = pick(EVENTS), nm = pick(NAMES), ap = ev.h < 12 ? 'am' : 'pm', h12 = ev.h % 12 || 12;
          const txt = h12 + ':' + pad2(ev.m);
          const ok = mcq2({
            prompt: nm + ' ' + ev.w + ' at ' + txt + '. Is that am or pm?',
            correct: opt(K.text(ap), ap, ''), other: opt(K.text(ap === 'am' ? 'pm' : 'am'), ap === 'am' ? 'pm' : 'am', ap === 'am' ? 'This is early in the day, before noon, so it is the morning: am.' : 'This is after noon, in the afternoon or evening, so it is pm.'),
            hint: 'am is the morning (before lunchtime). pm is the afternoon, evening and night. When does this happen in a day?',
            explain: ex('am or pm?', [nm + ' ' + ev.w + (ap === 'am' ? ' in the <b>morning</b>.' : ' in the <b>afternoon or evening</b>.'), 'Morning is <b>am</b>. Afternoon, evening and night are <b>pm</b>.', 'So ' + txt + ' is ' + txt + ' <b>' + ap + '</b>. ✅']),
            truth: K.text(ev.h >= 12 ? 'pm' : 'am')
          });
          return ok;
        }
        if(f === 1){ // 12-hour am -> 24-hour, picture
          const h12 = randInt(1, 11), m = pick(MINS), vis = V.digital(h12, m, { ampm: 'am' }), lab = t24(h12, m), a = t12(h12, m, 'am');
          const ds = [o24(h12 + 12, m, a + ' is in the MORNING. In the morning the hour does not change, so do not add 12.'), o24(h12 + 10 < 24 ? h12 + 10 : h12 + 1, m, 'am times keep the same hour. Do not add anything.')];
          wrong24(h12, m, 'am').forEach(function(x){ ds.push(x); });
          return mcq({
            prompt: 'The clock says ' + a + '. What is that on the 24-hour clock?', visual: vis,
            correct: o24(h12, m), distractors: ds.filter(function(o){ return !/^(00|12|24):/.test(o.label); }), keepOrder: true, count: 3,
            hint: 'It is the morning (am). Do the hours change for morning times?',
            explain: expl12to24(h12, m, 'am'),
            truth: key(parse12(a)), decode: function(){ return dec(vis); }
          });
        }
        // 24-hour picture -> am or pm
        const h = pick([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23]), m = pick(MINS), vis = V.digital(h, m, { h24: true }), lab = t24(h, m), ap = h < 12 ? 'am' : 'pm';
        return mcq2({
          prompt: 'The 24-hour clock says ' + lab + '. Is that am or pm?', visual: vis,
          correct: opt(K.text(ap), ap), other: opt(K.text(ap === 'am' ? 'pm' : 'am'), ap === 'am' ? 'pm' : 'am', ap === 'am' ? lab + ' starts with ' + pad2(h) + ', which is less than 12: the morning.' : lab + ' starts with ' + h + ', which is more than 12: after noon.'),
          hint: 'On the 24-hour clock, the hours 13, 14, 15 … come after midday.',
          explain: ex('Is ' + lab + ' am or pm?', ['Look at the hour: <b>' + h + '</b>.', h < 12 ? h + ' is less than 12, so it is before noon.' : h + ' is more than 12, so it is after noon.', 'So ' + lab + ' is <b>' + ap + '</b>. ✅']),
          truth: K.text(dec(vis) === 'bad picture' ? 'x' : (Math.floor(+dec(vis).slice(2) / 60) < 12 ? 'am' : 'pm')), decode: function(){ return K.text(Math.floor(+dec(vis).slice(2) / 60) < 12 ? 'am' : 'pm'); }
        });
      },
      2: function(){
        const f = randInt(0, 3);
        const h12 = randInt(1, 11), m = pick(MINS), ap = pick(['am', 'pm', 'pm']);
        if(f === 0){
          const a = t12(h12, m, ap), h = to24(h12, ap);
          return mcq({
            prompt: 'Write ' + a + ' as a 24-hour time.', correct: o24(h, m), distractors: wrong24(h12, m, ap), keepOrder: true,
            hint: ap === 'pm' ? 'It is pm, in the afternoon or evening. What do you add to the hour?' : 'It is am, in the morning. Does the hour change?',
            explain: expl12to24(h12, m, ap), truth: key(parse12(a))
          });
        }
        if(f === 1){
          const h = pick([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23]), a = t24(h, m);
          return mcq({
            prompt: 'What is ' + a + ' on a 12-hour clock?', correct: o12(h % 12 || 12, m, h < 12 ? 'am' : 'pm'), distractors: wrong12(h, m), keepOrder: true,
            hint: 'Is the hour more than 12? If so it is pm and you take 12 away. If not, it is am.',
            explain: expl24to12(h, m), truth: key(parse24(a))
          });
        }
        if(f === 2){
          const h = pick([13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 8, 9, 10, 11, 7, 6]), vis = V.digital(h, m, { h24: true });
          return mcq({
            prompt: 'The clock shows a 24-hour time. Which is the same time on a 12-hour clock?', visual: vis,
            correct: o12(h % 12 || 12, m, h < 12 ? 'am' : 'pm'), distractors: wrong12(h, m), keepOrder: true,
            hint: 'Look at the hour. More than 12 means pm, so take 12 away.',
            explain: expl24to12(h, m), truth: key(parse24(t24(h, m))), decode: function(){ return dec(vis); }
          });
        }
        const vis = V.digital(h12, m, { ampm: ap }), a = t12(h12, m, ap), h = to24(h12, ap);
        return mcq({
          prompt: 'The clock shows a 12-hour time. Which is the same time on a 24-hour clock?', visual: vis,
          correct: o24(h, m), distractors: wrong24(h12, m, ap), keepOrder: true,
          hint: ap === 'pm' ? 'The clock says pm. Add 12 to the hour.' : 'The clock says am. Morning times keep the same hour.',
          explain: expl12to24(h12, m, ap), truth: key(parse12(a)), decode: function(){ return dec(vis); }
        });
      },
      3: function(){
        const f = randInt(0, 6), m = pick(MINS);
        if(f === 0){ // 12 am / 12 pm / 11 / 1 edge
          const h12 = pick([12, 12, 12, 11, 1]), ap = pick(['am', 'pm']), a = t12(h12, m, ap), h = to24(h12, ap);
          return mcq({
            prompt: 'Write ' + a + ' as a 24-hour time.', correct: o24(h, m), distractors: wrong24(h12, m, ap), keepOrder: true,
            hint: h12 === 12 ? 'Careful with 12! 12 pm is noon and 12 am is midnight. What does the 24-hour clock show at those times?' : 'pm means add 12, am means keep the hour.',
            explain: expl12to24(h12, m, ap), truth: key(parse12(a))
          });
        }
        if(f === 1){
          const h = pick([0, 12, 0, 12, 23, 1, 13]), a = t24(h, m);
          return mcq({
            prompt: 'What is ' + a + ' on a 12-hour clock?', correct: o12(h % 12 || 12, m, h < 12 ? 'am' : 'pm'), distractors: wrong12(h, m), keepOrder: true,
            hint: h === 0 || h === 12 ? 'Is this midnight or noon? Midnight is the start of the day (am), noon is the middle (pm).' : 'Take 12 away from hours more than 12, and say pm.',
            explain: expl24to12(h, m), truth: key(parse24(a))
          });
        }
        if(f === 2){ // typed: 24-hour hour
          const h12 = randInt(1, 12), ap = pick(['am', 'pm']), a = t12(h12, m, ap), h = to24(h12, ap);
          return numeric({
            prompt: 'Write ' + a + ' as a 24-hour time. Type just the HOUR part (the number before the colon).', answer: h, unit: 'hours',
            hint: h12 === 12 ? 'Careful: 12 is special! Is this noon or midnight?' : (ap === 'pm' ? 'pm: add 12 to the hour.' : 'am: the hour stays the same.'),
            explain: expl12to24(h12, m, ap), truth: Math.floor(parse12(a) / 60),
            wrong: function(v){ return (ap === 'pm' && v === h12) ? 'For pm you must add 12.' : (h12 === 12 && v === 24 ? 'There is no 24:' + pad2(m) + '. After 23:59 the clock goes to 00:00.' : ''); }
          });
        }
        if(f === 3){ // typed: 12-hour hour
          const h = pick([13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 0, 12]), a = t24(h, m);
          return numeric({
            prompt: 'Write ' + a + ' on a 12-hour clock. Type just the HOUR number (not am or pm).', answer: h % 12 || 12, unit: 'hours',
            hint: h === 0 || h === 12 ? 'Midnight and noon both show 12 on a 12-hour clock.' : 'The hour is more than 12, so take 12 away.',
            explain: expl24to12(h, m), truth: Math.floor(parse24(a) / 60) % 12 || 12,
            wrong: function(v){ return v === h - 10 ? 'Take 12 away, not 10.' : (v === h && h > 12 ? 'The hour is more than 12, so take 12 away.' : ''); }
          });
        }
        if(f === 4){ // which is later
          let h12, ap, h2, m2, tot1, tot2;
          do { h12 = randInt(1, 12); ap = pick(['am', 'pm']); h2 = randInt(0, 23); m2 = pick(MINS); tot1 = to24(h12, ap) * 60 + m; tot2 = h2 * 60 + m2; } while(Math.abs(tot1 - tot2) < 20 || Math.abs(tot1 - tot2) > 300);
          const a = t12(h12, m, ap), b = t24(h2, m2), later = tot1 > tot2 ? a : b, other = tot1 > tot2 ? b : a;
          const ma = key(parse12(a)), mb = key(parse24(b));
          return mcq2({
            prompt: 'Which time is LATER in the day: ' + a + ' or ' + b + '?',
            correct: opt(tot1 > tot2 ? ma : mb, later), other: opt(tot1 > tot2 ? mb : ma, other, 'Change both times to the same kind of clock first. ' + other + ' comes earlier in the day.'),
            hint: 'Change one time so both are 24-hour times (or both 12-hour with am/pm), then compare.',
            explain: ex('Which is later?', [a + ' on the 24-hour clock is <b>' + t24(to24(h12, ap), m) + '</b>.', 'Now compare ' + t24(to24(h12, ap), m) + ' and ' + b + '.', 'The later one is <b>' + later + '</b>. ✅']),
            truth: key(Math.max(parse12(a), parse24(b))) });
        }
        // f 5 or 6: 12-hour pic -> 24-hour with edge cases, or 24h pic -> 12h
        if(f === 5){
          const h12 = pick([12, 12, 11, 10, 9, 8]), ap = pick(['am', 'pm']), vis = V.digital(h12, m, { ampm: ap }), a = t12(h12, m, ap), h = to24(h12, ap);
          return mcq({
            prompt: 'Which 24-hour time is the same as the clock?', visual: vis, correct: o24(h, m), distractors: wrong24(h12, m, ap), keepOrder: true,
            hint: h12 === 12 ? '12 is special. Think: is this noon or midnight?' : 'pm: add 12. am: keep the hour.',
            explain: expl12to24(h12, m, ap), truth: key(parse12(a)), decode: function(){ return dec(vis); }
          });
        }
        const h = pick([0, 12, 0, 12, 22, 23, 20, 21]), vis = V.digital(h, m, { h24: true });
        return mcq({
          prompt: 'Which 12-hour time is the same as the clock?', visual: vis, correct: o12(h % 12 || 12, m, h < 12 ? 'am' : 'pm'), distractors: wrong12(h, m), keepOrder: true,
          hint: h === 0 || h === 12 ? 'Is it just after midnight or just after noon?' : 'More than 12 means pm. Take 12 away.',
          explain: expl24to12(h, m), truth: key(parse24(t24(h, m))), decode: function(){ return dec(vis); }
        });
      }
    }
  });
})();
