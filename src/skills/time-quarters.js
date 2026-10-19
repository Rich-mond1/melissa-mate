/* REFERENCE SKILL #1 — copy this pattern. Shows: lesson, trick, 3 tiers, misconception distractors,
   decode from the DRAWING, picture-options, interactive set-the-clock. */
(function(){
  function digital(h, m){ return h + ':' + pad2(m); }
  function spoken(h, m){
    if(m === 0) return h + ' o’clock';
    if(m === 30) return 'half past ' + h;
    if(m === 15) return 'quarter past ' + h;
    if(m === 45) return 'quarter to ' + ((h % 12) + 1);
    return digital(h, m);
  }
  function nextHour(h){ return (h % 12) + 1; }
  function prevHour(h){ return h === 1 ? 12 : h - 1; }
  // read the answer back out of the drawn clock (hand tip coordinates) -> canonical key
  function clockKey(html){ const d = V.decodeClock(html); return K.time(d.h, d.m); }

  // distractor times for a clock (h:m); misconceptions first
  function clockWrongs(h, m, mins){
    const out = [];
    // 1) swapped the hands (read the long hand as the hour)
    if(m % 5 === 0){ let h2 = m / 5; if(h2 === 0) h2 = 12; let m2 = (h % 12) * 5; out.push({ h: h2, m: m2, why: 'It looks like the two hands got swapped. The SHORT hand tells the hour and the LONG hand tells the minutes.' }); }
    // 2) right minutes, neighbouring hour
    out.push({ h: nextHour(h), m: m, why: 'Check the short hand again — it is pointing at ' + h + ', not ' + nextHour(h) + '.' });
    out.push({ h: prevHour(h), m: m, why: m === 45 ? 'For quarter to, say the NEXT hour: the short hand is nearly at ' + nextHour(h) + '.' : 'Check the short hand again — it is pointing at ' + h + ', not ' + prevHour(h) + '.' });
    // 3) right hour, other minutes
    mins.forEach(function(mm){ if(mm !== m) out.push({ h: h, m: mm, why: 'Look at the LONG hand: it is not pointing to ' + mm + ' minutes.' }); });
    return out;
  }

  registerSkill({
    id: 'time-quarters', strand: 'time', name: 'O’clock, half past & quarters', emoji: '🕒', year: 3, order: 510, prereq: [],
    lesson: {
      title: 'Reading the clock',
      steps: [
        { say: 'A clock has two hands. The <b>short fat</b> hand shows the <b>hour</b>. The <b>long thin blue</b> hand shows the <b>minutes</b>.', vis: { kind: 'clock', args: [3, 0] } },
        { say: 'When the long hand points straight up to the <b>12</b>, it is an <b>o’clock</b> time. The short hand is on the 3, so it is <b>3 o’clock</b>.', vis: { kind: 'clock', args: [3, 0] } },
        { say: 'When the long hand points straight down to the <b>6</b>, half the clock has gone round. It is <b>half past</b>. This is <b>half past 3</b>, written <b>3:30</b>.', vis: { kind: 'clock', args: [3, 30] } },
        { say: 'Long hand on the <b>3</b> means <b>quarter past</b>. It is <b>quarter past 7</b>, written <b>7:15</b>.', vis: { kind: 'clock', args: [7, 15] } },
        { say: 'Long hand on the <b>9</b> means <b>quarter to</b> the NEXT hour. The short hand is nearly at the 5, so this is <b>quarter to 5</b>, written <b>4:45</b>.', vis: { kind: 'clock', args: [4, 45] },
          quiz: { prompt: 'The long hand points to the 9 and the short hand is just past the 9. What time is it?', options: [{ label: 'Quarter to 9', ok: false }, { label: 'Quarter to 10', ok: true }, { label: 'Quarter past 9', ok: false }], right: 'Yes! The short hand is just past the 9 and heading for the 10, so it is quarter to the NEXT hour: quarter to 10 (9:45).', wrong: 'Careful: the short hand has only just passed the 9, so it is still the 9 o’clock hour and is walking towards 10. It is quarter to 10 (9:45).' } }
      ]
    },
    trick: {
      title: 'The “next number” trick',
      say: 'For <b>quarter to</b>, always say the <b>NEXT</b> hour. Hour hand almost at 5 (just past the 4)? Then it is <b>quarter to 5</b>. Say it: “the hour hand is nearly there, so I say the number it is walking to”.',
      vis: { kind: 'clock', args: [4, 45] },
      example: '4:45 → hour hand is almost on 5 → <b>quarter to 5</b>'
    },
    gen: {
      1: function(){ // o'clock & half past, text options in digital form
        const h = randInt(1, 12), m = pick([0, 30]);
        const vis = V.clock(h, m);
        const ds = clockWrongs(h, m, [0, 30, 15, 45]).map(function(w){ return opt(K.time(w.h, w.m), digital(w.h, w.m), w.why); });
        return mcq({
          prompt: 'What time does the clock show?', visual: vis,
          correct: opt(K.time(h, m), digital(h, m)), distractors: ds, keepOrder: true,
          hint: 'Short fat hand = hour. Long thin hand = minutes. Is the long hand on the 12 or on the 6?',
          explain: ex('Reading ' + spoken(h, m), [
            'The <b>short</b> hand points at <b>' + h + '</b>, so the hour is ' + h + '.',
            'The <b>long</b> hand points ' + (m === 0 ? 'straight up at the <b>12</b>: that is <b>o’clock</b>.' : 'straight down at the <b>6</b>: that is <b>half past</b> (30 minutes).'),
            'So the time is <b>' + digital(h, m) + '</b> — we say “' + spoken(h, m) + '”. ✅'
          ]),
          truth: K.time(h, m), decode: function(){ return clockKey(vis); }
        });
      },
      2: function(){ // all four, answers in words (so she links words <-> picture)
        const h = randInt(1, 12), m = pick([0, 15, 30, 45]);
        const vis = V.clock(h, m);
        const wr = clockWrongs(h, m, [0, 15, 30, 45]);
        const ds = wr.map(function(w){ return opt(K.time(w.h, w.m), spoken(w.h, w.m), w.why); });
        return mcq({
          prompt: 'What time does the clock show?', visual: vis,
          correct: opt(K.time(h, m), spoken(h, m)), distractors: ds, keepOrder: true,
          hint: 'Long hand on 3 = quarter past, on 6 = half past, on 9 = quarter to. For quarter to, say the NEXT hour.',
          explain: ex('Reading the clock', [
            'The <b>short</b> hand is on (or just past) <b>' + h + '</b>.',
            'The <b>long</b> hand is on the <b>' + (m / 5) + '</b>, which is <b>' + m + ' minutes</b>.',
            'We say “<b>' + spoken(h, m) + '</b>” and write <b>' + digital(h, m) + '</b>. ✅'
          ]),
          truth: K.time(h, m), decode: function(){ return clockKey(vis); }
        });
      },
      3: function(){
        if(chance(0.5)){ // picture options: which clock shows ...?
          const h = randInt(1, 12), m = pick([0, 15, 30, 45]);
          const target = spoken(h, m);
          const wr = clockWrongs(h, m, [0, 15, 30, 45]);
          const ds = wr.map(function(w){ return opt(K.time(w.h, w.m), V.smallClock(w.h, w.m), w.why); });
          const q = mcq({
            prompt: 'Which clock shows ' + target + '?', visual: '',
            correct: opt(K.time(h, m), V.smallClock(h, m)), distractors: ds, keepOrder: true, count: 3,
            hint: 'Say the time as digits first (' + digital(h, m) + '), then look for the hands: short hand on ' + (m === 45 ? nextHour(h) + ' (almost)' : h) + ', long hand on the ' + (m / 5) + '.',
            explain: ex('Finding ' + target, [
              target + ' is written <b>' + digital(h, m) + '</b>.',
              'So the <b>short</b> hand ' + (m === 45 ? 'is nearly at the ' + nextHour(h) : 'is on ' + (m === 0 ? 'the ' + h : 'or just past the ' + h)) + ' and the <b>long</b> hand points to the <b>' + (m / 5) + '</b>.',
              'Only one picture matches: <b>' + digital(h, m) + '</b>. ✅'
            ]),
            truth: K.time(h, m), decode: function(){ return 'x'; }
          });
          q.optionsAreVisual = true;
          // decode: EVERY drawn option must show the time its key claims; then report the correct key
          q.decodeKey = function(){ for(let i = 0; i < q.options.length; i++){ if(clockKey(q.options[i].label) !== q.options[i].key) return 'option ' + i + ' picture does not match its key'; } return q.options[q.correct].key; };
          return q;
        }
        // interactive: set the hands
        const h = randInt(1, 12), m = pick([0, 15, 30, 45]);
        return setclock({
          prompt: 'Set the clock to ' + spoken(h, m) + '.', hour: h, minute: m, step: 15,
          hint: 'Move the short hand to the hour, then the long hand: 12 = o’clock, 3 = quarter past, 6 = half past, 9 = quarter to.',
          explain: ex('Setting ' + spoken(h, m), [
            spoken(h, m) + ' is written <b>' + digital(h, m) + '</b>.',
            'Short hand: ' + (m === 45 ? 'almost at the ' + nextHour(h) + ' (but it is still the ' + h + ' o’clock hour)' : 'on or just past the ' + h) + '.',
            'Long hand: on the <b>' + (m / 5) + '</b> (that is ' + m + ' minutes). ✅'
          ])
        });
      }
    }
  });
})();
