/* time-five-minutes — read the clock to the nearest 5 minutes, with past/to words. */
(function(){
  const NW = { 5: 'five', 10: 'ten', 20: 'twenty', 25: 'twenty-five' };
  function nx(h){ return (h % 12) + 1; }
  function pv(h){ return h === 1 ? 12 : h - 1; }
  function dig(h, m){ return h + ':' + pad2(m); }
  function spoken(h, m){
    if(m === 0) return h + ' o’clock';
    if(m === 30) return 'half past ' + h;
    if(m === 15) return 'quarter past ' + h;
    if(m === 45) return 'quarter to ' + nx(h);
    if(m < 30) return NW[m] + ' past ' + h;
    return NW[60 - m] + ' to ' + nx(h);
  }
  // independent parser: words -> {h,m} (hour as an hour-hand time 1..12)
  function parseSpoken(s){
    const W = { five: 5, ten: 10, quarter: 15, twenty: 20, 'twenty-five': 25, half: 30 };
    let r = /^(\d+) o’clock$/.exec(s); if(r) return { h: +r[1], m: 0 };
    r = /^(.+) past (\d+)$/.exec(s); if(r) return { h: +r[2], m: W[r[1]] };
    r = /^(.+) to (\d+)$/.exec(s); if(r){ const hh = +r[2] - 1; return { h: hh === 0 ? 12 : hh, m: 60 - W[r[1]] }; }
    throw new Error('cannot parse ' + s);
  }
  function ck(html){ const d = V.decodeClock(html); return K.time(d.h, d.m); }
  function visualOpts(q){
    q.optionsAreVisual = true;
    q.decodeKey = function(){ for(let i = 0; i < q.options.length; i++){ if(ck(q.options[i].label) !== q.options[i].key) return 'option ' + i + ' picture does not match its key'; } return q.options[q.correct].key; };
    return q;
  }
  function countStr(m){ const a = []; for(let k = 5; k <= m; k += 5) a.push(k); return a.join(', '); }

  // misconception-first wrong times for a clock showing h:m (m multiple of 5, may be 0)
  function wrongs(h, m, digitMode){
    const out = [], n = m / 5;
    if(m > 0 && m < 30 && m !== 15) out.push({ h: h, m: 60 - m, why: 'The long hand is on the ' + n + ', which is ' + m + ' minutes PAST ' + h + ' (not ' + (60 - m) + ' minutes). Count in 5s from the 12.' });
    if(m === 15) out.push({ h: h, m: 45, why: 'Long hand on the 3 is quarter PAST, not quarter to. Quarter to is when it is on the 9.' });
    if(m > 30 && m !== 45) out.push({ h: nx(h), m: 60 - m, why: 'Careful! “' + spoken(h, m) + '” means ' + (60 - m) + ' minutes BEFORE ' + nx(h) + ', so it is ' + dig(h, m) + ', not ' + dig(nx(h), 60 - m) + '.' });
    if(m === 45) out.push({ h: nx(h), m: 15, why: 'Quarter to ' + nx(h) + ' is BEFORE ' + nx(h) + ' o’clock, so it is ' + dig(h, 45) + ', not ' + dig(nx(h), 15) + '.' });
    if(m > 30) out.push({ h: pv(h), m: m, why: 'For “to” times the short hand is nearly at the NEXT hour. Here it is nearly at ' + nx(h) + ', so say ' + nx(h) + ' for “to” — the hour hand has passed ' + h + '.' });
    else if(m > 0) out.push({ h: nx(h), m: m, why: 'The short hand has only just passed ' + h + ' — it has not reached ' + nx(h) + ' yet.' });
    if(m > 30) out.push({ h: nx(h), m: m, why: 'The short hand has not reached ' + nx(h) + ' yet, so the hour is still ' + h + '.' });
    else if(m > 0) out.push({ h: pv(h), m: m, why: 'The short hand is just past ' + h + ', not ' + pv(h) + '.' });
    if(digitMode && n !== 0 && m > 0) out.push({ h: h, m: n, why: 'That uses the number the long hand points to as the minutes. Each number is worth 5 minutes: ' + n + ' × 5 = ' + m + '.' });
    // hands swapped
    const sh = (m / 5) || 12, sm = (h % 12) * 5;
    out.push({ h: sh, m: sm, why: 'It looks like the hands got swapped. The SHORT hand is the hour and the LONG hand is the minutes.' });
    // deep fallback pool
    shuffle([0, 5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 55]).forEach(function(mm){ out.push({ h: h, m: mm, why: 'Look at the LONG hand and count in 5s from the 12 — it is not on that number.' }); });
    shuffle([0, 5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 55]).forEach(function(mm){ out.push({ h: nx(h), m: mm, why: 'Check both hands again: the short hand and the long hand.' }); });
    return out;
  }
  function toOpts(list, mode){
    return list.filter(function(w){ return !(mode === 'words' && (w.m % 5 !== 0)); }).map(function(w){
      return opt(K.time(w.h, w.m), mode === 'words' ? spoken(w.h, w.m) : dig(w.h, w.m), w.why);
    });
  }
  function explainRead(h, m){
    const n = m / 5, sp = spoken(h, m), dg = dig(h, m);
    const s1 = m > 30 ? 'The <b>short</b> hand is nearly at the ' + nx(h) + ' but has not reached it, so the hour is <b>' + h + '</b>.' : 'The <b>short</b> hand is on or just past the <b>' + h + '</b>.';
    const s2 = m === 0 ? 'The <b>long</b> hand points straight up at the 12: <b>0 minutes</b>.' : 'The <b>long</b> hand points to the <b>' + n + '</b>. Count in 5s: ' + countStr(m) + '. That is <b>' + m + ' minutes</b> past the hour.';
    const s3 = m === 0 ? 'So it is <b>' + sp + '</b>, written <b>' + dg + '</b>.'
      : m <= 30 ? m + ' minutes past ' + h + ' is <b>' + sp + '</b>, written <b>' + dg + '</b>.'
      : 'Past 30 we count back to the next hour: 60 − ' + m + ' = ' + (60 - m) + ' minutes TO ' + nx(h) + '. So it is <b>' + sp + '</b>, written <b>' + dg + '</b>.';
    return ex('Reading ' + sp, [s1, s2, s3]);
  }
  const T1M = [5, 10, 20, 25], T2M = [5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 55];

  registerSkill({
    id: 'time-five-minutes', strand: 'time', name: 'Clocks: five minutes past & to', emoji: '⏰', year: 3, order: 520, prereq: ['time-quarters'],
    lesson: {
      title: 'Counting in fives round the clock',
      steps: [
        { say: 'Every number on the clock is worth <b>5 minutes</b>. The 1 is 5 minutes, the 2 is 10 minutes, the 3 is 15 minutes. Count in 5s as the long hand goes round!', vis: { kind: 'clock', args: [3, 0] } },
        { say: 'The long hand points to the <b>4</b>. That is 4 × 5 = <b>20 minutes</b>. The short hand has just passed 4. We say <b>twenty past 4</b> and write <b>4:20</b>.', vis: { kind: 'clock', args: [4, 20] } },
        { say: 'On the <b>right</b> side of the clock we say <b>“past”</b>. This is <b>ten past 7</b>, written <b>7:10</b>.', vis: { kind: 'clock', args: [7, 10] } },
        { say: 'After half past we say <b>“to”</b> and use the <b>next hour</b>. The long hand is on the 10: that is 50 minutes, so <b>10 minutes to go</b>. The short hand is nearly at 7: <b>ten to 7</b>.', vis: { kind: 'clock', args: [6, 50] },
          quiz: { prompt: 'The clock says ten to 7. Which is the correct way to write it?', options: [{ label: '6:50', ok: true }, { label: '7:10', ok: false }, { label: '7:50', ok: false }], right: 'Yes! Ten to 7 is 10 minutes BEFORE 7, so 6:50.', wrong: 'Ten to 7 is 10 minutes before 7 o’clock. The hour is still 6, so it is 6:50.' } },
        { say: 'Try one more. The long hand is on the 7: 7 × 5 = 35 minutes. That is 25 minutes to the next hour, so it is <b>twenty-five to 9</b>, written <b>8:35</b>.', vis: { kind: 'clock', args: [8, 35] },
          quiz: { prompt: 'The long hand is on the 8 and the short hand is just before 3. What time is it?', options: [{ label: '2:40', ok: true }, { label: '3:40', ok: false }, { label: '2:08', ok: false }], right: 'Yes! 8 × 5 = 40 minutes, hour still 2: 2:40 (twenty to 3).', wrong: '8 × 5 = 40 minutes. The short hand has not reached 3, so the hour is 2: it is 2:40.' } }
      ]
    },
    trick: {
      title: 'Right is “past”, left is “to”',
      say: 'Draw a line down the middle of the clock. The <b>right</b> side is <b>“past”</b>. The <b>left</b> side is <b>“to”</b>. For “to” times, count the minutes you still need to reach the top and say the <b>next</b> hour. The hour hand is not at the next hour yet!',
      vis: { kind: 'clock', args: [6, 50] },
      example: 'Long hand on the 10 (left side) → 5 × 10 = 50 → 10 minutes to go → <b>ten to 7</b>, which is <b>6:50</b>.'
    },
    gen: {
      1: function(){
        const h = randInt(1, 12), m = pick(T1M), f = randInt(0, 2);
        const vis = V.clock(h, m);
        if(f === 0){
          return mcq({
            prompt: 'What time does the clock show?', visual: vis,
            correct: opt(K.time(h, m), dig(h, m)), distractors: toOpts(wrongs(h, m, true), 'digits'), keepOrder: true,
            hint: 'Short hand = hour. For the minutes, count in 5s from the 12 to where the long hand points.',
            explain: explainRead(h, m),
            truth: K.time(h, m), decode: function(){ return ck(vis); }
          });
        }
        if(f === 1){
          return mcqNum({
            prompt: 'The long hand points to the ' + (m / 5) + '. How many minutes past ' + h + ' is it?', visual: vis, answer: m, fmt: function(v){ return v + ' minutes'; },
            wrong: [{ v: m / 5, why: 'That is the NUMBER on the clock. Each number is worth 5 minutes, so multiply by 5.' }, { v: 60 - m, why: 'That counts the minutes still to go. “Past” counts from the top, the 12.' }],
            valid: function(v){ return v > 0 && v < 60 && v % 5 === 0 || v === m / 5; }, nearby: [5, -5, 10, -10, 15, 20],
            hint: 'Each number on the clock is 5 minutes. Count in 5s: 5, 10, 15 …',
            explain: ex('Counting in 5s', ['The long hand points to the <b>' + (m / 5) + '</b>.', 'Count in 5s: ' + countStr(m) + '.', 'It is <b>' + m + ' minutes</b> past ' + h + '. ✅']),
            truth: (m / 5) * 5, decode: function(){ return V.decodeClock(vis).m; }
          });
        }
        return mcq({
          prompt: 'Which words match the clock?', visual: vis,
          correct: opt(K.time(h, m), spoken(h, m)), distractors: toOpts(wrongs(h, m, false), 'words'), keepOrder: true, count: 3,
          hint: 'Count in 5s with the long hand. On the right side of the clock we say “past”.',
          explain: explainRead(h, m),
          truth: K.time(parseSpoken(spoken(h, m)).h, parseSpoken(spoken(h, m)).m), decode: function(){ return ck(vis); }
        });
      },
      2: function(){
        const h = randInt(1, 12), m = pick(T2M), f = randInt(0, 3);
        if(f === 0 || f === 1){
          const vis = V.clock(h, m), words = f === 0;
          return mcq({
            prompt: words ? 'Which words tell the time on the clock?' : 'What time does the clock show?', visual: vis,
            correct: opt(K.time(h, m), words ? spoken(h, m) : dig(h, m)), distractors: toOpts(wrongs(h, m, !words), words ? 'words' : 'digits'), keepOrder: true,
            hint: m > 30 ? 'The long hand is on the left side, so it is a “to” time. Count how many minutes are left to reach the top.' : 'Count in 5s from the 12 with the long hand. Right side = “past”.',
            explain: explainRead(h, m),
            truth: K.time(parseSpoken(spoken(h, m)).h, parseSpoken(spoken(h, m)).m), decode: function(){ return ck(vis); }
          });
        }
        const sp = spoken(h, m), w = wrongs(h, m, true);
        if(f === 2){ // words -> digits, no picture
          return mcq({
            prompt: 'Which time is “' + sp + '”?', visual: '',
            correct: opt(K.time(h, m), dig(h, m)), distractors: toOpts(w, 'digits'), keepOrder: true,
            hint: m > 30 ? '“To” means minutes BEFORE the next hour, so the hour in digits is one less than the number you say.' : '“Past” means minutes after the hour. The hour number stays the same.',
            explain: ex('Writing “' + sp + '”', [m <= 30 ? '“' + sp + '” means <b>' + m + ' minutes past ' + h + '</b>.' : '“' + sp + '” means <b>' + (60 - m) + ' minutes before ' + nx(h) + '</b>. That is one hour less than ' + nx(h) + ': hour <b>' + h + '</b>.', m <= 30 ? 'Hour ' + h + ', minutes ' + m + '.' : 'Minutes: 60 − ' + (60 - m) + ' = <b>' + m + '</b>.', 'So it is written <b>' + dig(h, m) + '</b>. ✅']),
            truth: K.time(parseSpoken(sp).h, parseSpoken(sp).m)
          });
        }
        // digits -> words
        return mcq({
          prompt: 'How do we say ' + dig(h, m) + '?', visual: '',
          correct: opt(K.time(h, m), sp), distractors: toOpts(w, 'words'), keepOrder: true,
          hint: m > 30 ? 'More than 30 minutes: say how many minutes are LEFT, then “to” the next hour.' : '30 minutes or fewer: say the minutes, then “past”, then the hour.',
          explain: ex('Saying ' + dig(h, m), [m <= 30 ? m + ' minutes is 30 or fewer, so we use “past”.' : m + ' minutes is more than 30, so use “to” and count what is left: 60 − ' + m + ' = ' + (60 - m) + '.', m <= 30 ? 'The hour stays <b>' + h + '</b>.' : 'The NEXT hour is <b>' + nx(h) + '</b>.', 'We say <b>' + sp + '</b>. ✅']),
          truth: K.time(parseSpoken(sp).h, parseSpoken(sp).m)
        });
      },
      3: function(){
        const h = randInt(1, 12), m = pick(T2M.concat([5, 10, 20, 25, 35, 40, 50, 55])), f = randInt(0, 4);
        const sp = spoken(h, m), ps = parseSpoken(sp);
        if(f === 0){
          return setclock({
            prompt: 'Set the clock to ' + sp + '.', hour: h, minute: m, step: 5, truthHour: ps.h, truthMinute: ps.m,
            hint: m > 30 ? 'A “to” time: the long hand goes to where there are only a few minutes left, and the short hand is nearly at the next hour.' : 'Put the long hand on the number for the minutes (count in 5s), then the short hand just past the hour.',
            explain: ex('Setting ' + sp, [sp + ' is written <b>' + dig(h, m) + '</b>.', 'Short hand: ' + (m > 30 ? 'nearly at ' + nx(h) + ' but not there yet' : 'on or just past ' + h) + '.', 'Long hand: on the <b>' + (m / 5 || 12) + '</b> (that is ' + m + ' minutes). ✅'])
          });
        }
        if(f === 1){
          const w = wrongs(h, m, false).map(function(x){ return opt(K.time(x.h, x.m), V.smallClock(x.h, x.m), x.why); });
          const q = mcq({
            prompt: 'Which clock shows ' + sp + '?', visual: '',
            correct: opt(K.time(h, m), V.smallClock(h, m)), distractors: w, keepOrder: true, count: 3,
            hint: 'Write it in digits first (' + (m > 30 ? 'for a “to” time, the hour is one less' : 'minutes first') + '), then look for the short and long hands.',
            explain: ex('Finding ' + sp, ['“' + sp + '” is written <b>' + dig(h, m) + '</b>.', 'The <b>short</b> hand is ' + (m > 30 ? 'nearly at ' + nx(h) : 'on or just past ' + h) + ' and the <b>long</b> hand points to the <b>' + (m / 5 || 12) + '</b>.', 'Only one clock matches: <b>' + dig(h, m) + '</b>. ✅']),
            truth: K.time(ps.h, ps.m)
          });
          return visualOpts(q);
        }
        if(f === 2){ // typed: minutes TO the next hour
          const mm = pick([35, 40, 50, 55, 35, 40]), vis = V.clock(h, mm);
          return numeric({
            prompt: 'How many minutes is it TO ' + nx(h) + ' o’clock?', visual: vis, answer: 60 - mm, unit: 'minutes',
            hint: 'Find the minutes past the hour (count in 5s), then see how many more make 60.',
            explain: ex('Minutes to the next hour', ['The long hand is on the ' + (mm / 5) + ': that is <b>' + mm + '</b> minutes past ' + h + '.', 'A whole hour is 60 minutes, so we need 60 − ' + mm + ' more.', 'It is <b>' + (60 - mm) + '</b> minutes to ' + nx(h) + '. ✅']),
            truth: 60 - mm, decode: function(){ return 60 - V.decodeClock(vis).m; },
            wrong: function(v){ return v === mm ? 'That is how many minutes PAST the hour. “To” needs the minutes still to go.' : ''; }
          });
        }
        if(f === 3){ // typed: fill the gap in digits
          const mm = pick([35, 40, 50, 55, 25, 20, 10, 5, 35, 40]), hh = randInt(1, 12), s2 = spoken(hh, mm), p2 = parseSpoken(s2);
          return numeric({
            prompt: '“' + s2 + '” is the same as ' + p2.h + ':__ . Type the missing minutes.', visual: '', answer: mm, truth: p2.m,
            hint: mm > 30 ? 'A “to” time: count the minutes left to the next hour, then work out 60 minus that.' : 'A “past” time: the minutes are just the number you say.',
            explain: ex('Filling the gap', [mm <= 30 ? '“' + s2 + '” means ' + mm + ' minutes past ' + hh + '.' : '“' + s2 + '” means ' + (60 - mm) + ' minutes before ' + nx(hh) + '.', mm <= 30 ? 'The minutes are <b>' + mm + '</b>.' : '60 − ' + (60 - mm) + ' = <b>' + mm + '</b> minutes past ' + hh + '.', 'It is ' + dig(hh, mm) + '. The missing minutes are <b>' + mm + '</b>. ✅']),
            wrong: function(v){ return v === 60 - mm ? 'That is the number you SAY. For “to” times subtract it from 60.' : ''; }
          });
        }
        const vis = V.clock(h, m);
        return mcq({
          prompt: 'Which is the same time as the clock?', visual: vis,
          correct: opt(K.time(h, m), sp + ' = ' + dig(h, m)), distractors: toOpts(wrongs(h, m, false), 'words').map(function(o, i){ const kk = o.key; const t = /t:(\d+)/.exec(kk); const tm = +t[1]; const hh = Math.floor(tm / 60) || 12, mi = tm % 60; return opt(kk, spoken(hh, mi) + ' = ' + dig(hh, mi), o.why); }), keepOrder: true,
          hint: 'Read the clock in digits first, then say it in words. Check BOTH match.',
          explain: explainRead(h, m),
          truth: K.time(ps.h, ps.m), decode: function(){ return ck(vis); }
        });
      }
    }
  });
})();
