/* time-minutes — read the clock to the nearest minute; add minutes to a time. */
(function(){
  function nx(h){ return (h % 12) + 1; }
  function pv(h){ return h === 1 ? 12 : h - 1; }
  function dig(h, m){ return h + ':' + pad2(m); }
  function norm(h, m){ const t = ((((h % 12) * 60 + m) % 720) + 720) % 720; return { h: Math.floor(t / 60) || 12, m: t % 60 }; }
  function ck(html){ const d = V.decodeClock(html); return K.time(d.h, d.m); }
  function visualOpts(q){
    q.optionsAreVisual = true;
    q.decodeKey = function(){ for(let i = 0; i < q.options.length; i++){ if(ck(q.options[i].label) !== q.options[i].key) return 'option ' + i + ' picture does not match its key'; } return q.options[q.correct].key; };
    return q;
  }
  function countStr(m){ const k = Math.floor(m / 5), a = []; for(let i = 1; i <= k; i++) a.push(i * 5); return a.join(', '); }
  function ticksStr(m){ const k = Math.floor(m / 5) * 5, r = m % 5, a = []; for(let i = 1; i <= r; i++) a.push(k + i); return a.join(', '); }

  function wrongs(h, m){
    const out = [], k = Math.floor(m / 5), r = m % 5;
    if(r > 0) out.push({ h: h, m: k * 5, why: 'That forgets the little ticks! After the ' + k + ' (' + k * 5 + ' minutes) there are ' + r + ' more tick marks to count.' });
    if(r > 1 && k * 5 + r * 5 < 60) out.push({ h: h, m: k * 5 + r * 5, why: 'The little ticks are worth 1 minute each, not 5. Count the numbers in 5s, then the ticks in 1s.' });
    if(m < 59) out.push({ h: h, m: m + 1, why: 'Almost! You went one tick too far. Count the ticks again carefully.' });
    if(m > 1) out.push({ h: h, m: m - 1, why: 'Almost! You stopped one tick too soon. Count the ticks again carefully.' });
    const sw = (m % 10) * 10 + Math.floor(m / 10);
    if(m >= 10 && sw < 60 && sw !== m) out.push({ h: h, m: sw, why: 'The digits are the wrong way round. Say the minutes slowly: ' + countStr(m) + (r ? ', then ' + ticksStr(m) : '') + '.' });
    if(m > 30) out.push({ h: nx(h), m: m, why: 'The short hand has not reached ' + nx(h) + ' yet. The hour is the number it has just passed: ' + h + '.' });
    else out.push({ h: pv(h), m: m, why: 'The short hand has already passed ' + h + ', so the hour is ' + h + '.' });
    if(m > 30) out.push({ h: nx(h), m: 60 - m, why: 'That mixes up “past” and “to”. The long hand shows ' + m + ' minutes PAST ' + h + '.' });
    shuffle([5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 55, 1, 2, 3, 4, 6, 7, 8, 9, 11, 12, 13, 14, 16, 17, 18, 19, 21, 22, 23, 24, 26, 27, 28, 29, 31, 32, 33, 34, 36, 37, 38, 39]).forEach(function(mm){ out.push({ h: h, m: mm, why: 'Count the long hand again: numbers in 5s, then the little ticks in 1s.' }); });
    return out;
  }
  function toOpts(list){ return list.map(function(w){ return opt(K.time(w.h, w.m), dig(w.h, w.m), w.why); }); }
  function explainRead(h, m){
    const k = Math.floor(m / 5), r = m % 5;
    const s1 = 'The <b>short</b> hand has just passed the <b>' + h + '</b>' + (m > 30 ? ' (it is now nearly at the ' + nx(h) + ', but the hour is still ' + h + ')' : '') + '.';
    const s2 = k === 0 ? 'The <b>long</b> hand has gone ' + r + ' ticks past the 12: <b>' + r + ' minutes</b>.'
      : r === 0 ? 'The <b>long</b> hand is on the <b>' + k + '</b>. Count in 5s: ' + countStr(m) + '. That is <b>' + m + ' minutes</b>.'
      : 'The <b>long</b> hand is ' + r + ' tick' + (r > 1 ? 's' : '') + ' after the <b>' + k + '</b>. Count in 5s: ' + countStr(m) + (k > 1 ? ' (' + k * 5 + ')' : '') + '. Then in 1s: ' + ticksStr(m) + '. That is <b>' + m + ' minutes</b>.';
    return ex('Reading ' + dig(h, m), [s1, s2, 'So the time is <b>' + dig(h, m) + '</b>' + (m > 30 ? ' — that is ' + (60 - m) + ' minutes to ' + nx(h) : '') + '. ✅']);
  }
  function laterWrongs(h, m, d){
    const ts = m + d, c = ts >= 60, out = [];
    const right = norm(h, ts);
    if(c){
      out.push({ h: h, m: ts - 60, why: 'The minutes went past 60, so the hour must move on! ' + m + ' + ' + d + ' = ' + ts + ' minutes = 1 hour ' + (ts - 60) + ' minutes.' });
      out.push({ h: nx(nx(h)), m: ts - 60, why: 'Only ONE hour is added when we pass 60 minutes, not two.' });
    } else {
      out.push({ h: nx(h), m: ts, why: 'We have not reached 60 minutes, so the hour does not change. ' + m + ' + ' + d + ' = ' + ts + '.' });
    }
    if(right.m + 5 < 60) out.push({ h: right.h, m: right.m + 5, why: 'Check the adding: ' + m + ' + ' + d + '.' });
    if(right.m - 5 >= 0) out.push({ h: right.h, m: right.m - 5, why: 'Check the adding: ' + m + ' + ' + d + '.' });
    const back = norm(h, m - d);
    out.push({ h: back.h, m: back.m, why: 'LATER means adding minutes, not taking them away.' });
    [10, -10, 15, -15, 20, -20, 1, -1].forEach(function(x){ const n2 = norm(right.h, right.m + x); out.push({ h: n2.h, m: n2.m, why: 'Check the adding: ' + m + ' + ' + d + '.' }); });
    return out;
  }

  registerSkill({
    id: 'time-minutes', strand: 'time', name: 'Clocks: to the minute', emoji: '⏱️', year: 3, order: 530, prereq: ['time-five-minutes'],
    lesson: {
      title: 'Every tick is one minute',
      steps: [
        { say: 'Look at the tiny tick marks. There are <b>60</b> of them round the clock. Each tick is <b>1 minute</b>. Between two numbers there are 5 minutes.', vis: { kind: 'clock', args: [3, 0] } },
        { say: 'First count in <b>5s</b> to the last number. The long hand has passed the 4, so that is <b>20</b> minutes. The hour hand has just passed 4.', vis: { kind: 'clock', args: [4, 20] } },
        { say: 'Now count the little ticks in <b>1s</b>. Three ticks past the 4: 20, <b>21, 22, 23</b>. So the time is <b>4:23</b>, or 23 minutes past 4.', vis: { kind: 'clock', args: [4, 23] } },
        { say: 'Past 30, you can also count back to the top. Here the long hand is 3 ticks after the 9 (45): <b>48 minutes</b>. That is 12 minutes to 8. It is <b>7:48</b>.', vis: { kind: 'clock', args: [7, 48] },
          quiz: { prompt: 'The long hand is 2 ticks after the 7, and the short hand has just passed 10. What time is it?', options: [{ label: '10:37', ok: true }, { label: '10:27', ok: false }, { label: '10:07', ok: false }], right: 'Yes! 7 × 5 = 35, plus 2 ticks = 37. It is 10:37.', wrong: 'Count in 5s to the 7: 35. Then add 2 ticks: 37. So 10:37.' } },
        { say: 'What time is it <b>5 minutes later</b>? Add 5 to the minutes. If you go past 60, the hour moves on! 4:57 + 5 minutes = <b>5:02</b>.', vis: { kind: 'clock', args: [4, 57] },
          quiz: { prompt: 'It is 4:57. What is the time 5 minutes later?', options: [{ label: '5:02', ok: true }, { label: '4:62', ok: false }, { label: '4:02', ok: false }], right: 'Yes! 57 + 5 = 62, which is 1 hour and 2 minutes. 5:02!', wrong: '57 + 5 = 62. That is past 60, so the hour moves on to 5 and we have 2 minutes: 5:02.' } }
      ]
    },
    trick: {
      title: 'Count in 5s, then in 1s',
      say: 'Do not count every tick from the top! <b>Jump in 5s</b> to the last number the long hand has passed, then <b>count on in 1s</b> for the ticks. 5, 10, 15, 20, 25, 30 … 31, 32, 33.',
      vis: { kind: 'clock', args: [6, 33] },
      example: '6:33 → long hand just after the 6 → 5, 10, 15, 20, 25, 30, then 31, 32, <b>33</b> minutes.'
    },
    gen: {
      1: function(){
        const h = randInt(1, 12), k = randInt(0, 5), r = randInt(1, 4), m = k * 5 + r, f = randInt(0, 2);
        const vis = V.clock(h, m);
        if(f === 0){
          return mcq({
            prompt: 'What time does the clock show?', visual: vis,
            correct: opt(K.time(h, m), dig(h, m)), distractors: toOpts(wrongs(h, m)), keepOrder: true, count: 3,
            hint: 'Count in 5s to the last number the long hand passed, then count the little ticks in 1s.',
            explain: explainRead(h, m),
            truth: K.time(h, (m - r) + r), decode: function(){ return ck(vis); }
          });
        }
        if(f === 1){
          return mcqNum({
            prompt: 'How many minutes past ' + h + ' is it?', visual: vis, answer: m, fmt: function(v){ return v + (v === 1 ? ' minute' : ' minutes'); },
            wrong: [{ v: k * 5, why: 'You forgot the little ticks after the number. Add them in 1s.' }, { v: k * 5 + r * 5, why: 'The little ticks are 1 minute each, not 5.' }, { v: m + 1, why: 'One tick too far. Count again.' }, { v: m - 1, why: 'One tick too few. Count again.' }],
            valid: function(v){ return v > 0 && v < 60; }, nearby: [2, -2, 3, -3, 5, -5, 10],
            hint: 'Count in 5s to the number, then add the ticks after it.',
            explain: ex('Minutes past ' + h, ['Long hand has passed the <b>' + k + '</b>' + (k === 0 ? ' (the 12)' : '') + (k ? ': counting in 5s gives ' + k * 5 + ' minutes' : '') + '.', 'Then <b>' + r + '</b> tick' + (r > 1 ? 's' : '') + ' more: ' + ticksStr(m) + '.', 'So it is <b>' + m + ' minutes</b> past ' + h + '. ✅']),
            truth: (m - r) + r, decode: function(){ return V.decodeClock(vis).m; }
          });
        }
        const sp = m + ' minutes past ' + h;
        return mcq({
          prompt: 'Which words match the clock?', visual: vis,
          correct: opt(K.time(h, m), sp), distractors: wrongs(h, m).filter(function(w){ return w.m < 30 || w.m === m; }).map(function(w){ return opt(K.time(w.h, w.m), w.m + ' minutes past ' + w.h, w.why); }), keepOrder: true, count: 3,
          hint: 'Count in 5s, then in 1s. Say the minutes, then “past”, then the hour.',
          explain: explainRead(h, m).replace('So the time is', 'In words: <b>' + sp + '</b>. The time is'),
          truth: K.time(h, parseInt(sp, 10)), decode: function(){ return ck(vis); }
        });
      },
      2: function(){
        const h = randInt(1, 12), m = pick([1, 2, 3, 4, 6, 7, 8, 9, 11, 12, 13, 14, 16, 17, 18, 19, 21, 22, 23, 24, 26, 27, 28, 29, 31, 32, 33, 34, 36, 37, 38, 39, 41, 42, 43, 44, 46, 47, 48, 49, 51, 52, 53, 54, 56, 57, 58, 59]), f = randInt(0, 3);
        if(f <= 1){
          const vis = V.clock(h, m);
          return mcq({
            prompt: 'What time does the clock show?', visual: vis,
            correct: opt(K.time(h, m), dig(h, m)), distractors: toOpts(wrongs(h, m)), keepOrder: true,
            hint: 'Short hand: which hour has it just passed? Long hand: count in 5s, then in 1s.',
            explain: explainRead(h, m),
            truth: K.time(h, Math.floor(m / 5) * 5 + (m % 5)), decode: function(){ return ck(vis); }
          });
        }
        if(f === 2){
          const mm = pick([31, 32, 33, 34, 36, 37, 38, 39, 41, 42, 43, 44, 46, 47, 48, 49, 51, 52, 53, 54, 56, 57, 58, 59]), vis = V.clock(h, mm);
          return mcqNum({
            prompt: 'How many minutes is it until ' + nx(h) + ' o’clock?', visual: vis, answer: 60 - mm, fmt: function(v){ return v + (v === 1 ? ' minute' : ' minutes'); },
            wrong: [{ v: mm, why: 'That is the minutes PAST ' + h + '. We need the minutes still to go until ' + nx(h) + ': take it away from 60.' }, { v: 50 - mm + 10 + 1, why: 'Check your take-away: 60 minus the minutes past.' }],
            valid: function(v){ return v > 0 && v < 60; }, nearby: [1, -1, 2, -2, 10, -10, 5, -5],
            hint: 'Read the minutes past the hour first. A whole hour is 60 minutes.',
            explain: ex('Minutes until ' + nx(h), ['Reading the clock: <b>' + dig(h, mm) + '</b>, so ' + mm + ' minutes past ' + h + '.', 'One hour is 60 minutes: 60 − ' + mm + ' = <b>' + (60 - mm) + '</b>.', 'It is <b>' + (60 - mm) + ' minutes</b> until ' + nx(h) + '. ✅']),
            truth: 60 - mm, decode: function(){ return 60 - V.decodeClock(vis).m; }
          });
        }
        const mm = randInt(1, 49), vis = V.clock(h, mm), t = norm(h, mm + 5), d = 5;
        return mcq({
          prompt: 'What time will it be 5 minutes later?', visual: vis,
          correct: opt(K.time(t.h, t.m), dig(t.h, t.m)), distractors: laterWrongs(h, mm, d).map(function(w){ return opt(K.time(w.h, w.m), dig(w.h, w.m), w.why); }), keepOrder: true,
          hint: 'Read the time on the clock first. Then add 5 to the minutes.',
          explain: ex('5 minutes later', ['The clock shows <b>' + dig(h, mm) + '</b>.', 'Add 5 minutes: ' + mm + ' + 5 = ' + (mm + 5) + '.', '5 minutes later it is <b>' + dig(t.h, t.m) + '</b>. ✅']),
          truth: (function(){ const tot = (h % 12) * 60 + mm + 5; return K.time(Math.floor(tot / 60) % 12 || 12, tot % 60); })(),
          decode: function(){ const dd = V.decodeClock(vis), n2 = norm(dd.h, dd.m + 5); return K.time(n2.h, n2.m); }
        });
      },
      3: function(){
        const h = randInt(1, 12), m = randInt(1, 59), f = randInt(0, 4), vis = V.clock(h, m);
        if(f === 0){
          const d = pick([5, 10, 15, 20, 25, 30, 35, 40, 45]), mm = randInt(10, 59), t = norm(h, mm + d), v2 = V.clock(h, mm);
          return mcq({
            prompt: 'What time will it be ' + d + ' minutes later?', visual: v2,
            correct: opt(K.time(t.h, t.m), dig(t.h, t.m)), distractors: laterWrongs(h, mm, d).map(function(w){ return opt(K.time(w.h, w.m), dig(w.h, w.m), w.why); }), keepOrder: true,
            hint: 'Read the clock, add the minutes, and if the total goes past 60, take 60 off and move the hour on.',
            explain: ex(d + ' minutes later', ['The clock shows <b>' + dig(h, mm) + '</b>.', mm + ' + ' + d + ' = ' + (mm + d) + ' minutes' + (mm + d >= 60 ? '. That is past 60, so it is the next hour and ' + (mm + d - 60) + ' minutes.' : ', still the same hour.'), 'The time is <b>' + dig(t.h, t.m) + '</b>. ✅']),
            truth: (function(){ const tot = (h % 12) * 60 + mm + d; return K.time(Math.floor(tot / 60) % 12 || 12, tot % 60); })(),
            decode: function(){ const dd = V.decodeClock(v2), n2 = norm(dd.h, dd.m + d); return K.time(n2.h, n2.m); }
          });
        }
        if(f === 1){
          return numeric({
            prompt: 'How many minutes past ' + h + ' is it? Type the number.', visual: vis, answer: m, unit: 'minutes',
            hint: 'Count in 5s to the last number the long hand passed, then add the little ticks.',
            explain: explainRead(h, m).replace('So the time is', 'The minutes are <b>' + m + '</b>. The time is'),
            truth: Math.floor(m / 5) * 5 + m % 5, decode: function(){ return V.decodeClock(vis).m; },
            wrong: function(v){ return v === Math.floor(m / 5) * 5 ? 'That misses the little ticks after the number.' : (v === 60 - m ? 'That is the minutes still TO go. We want the minutes PAST.' : ''); }
          });
        }
        if(f === 2){
          const mm = randInt(31, 59), v2 = V.clock(h, mm);
          return numeric({
            prompt: 'How many minutes until ' + nx(h) + ' o’clock? Type the number.', visual: v2, answer: 60 - mm, unit: 'minutes',
            hint: 'Read the minutes past the hour, then see how many more make 60.',
            explain: ex('Minutes until ' + nx(h), ['The clock shows <b>' + dig(h, mm) + '</b>.', 'Count on to 60: from ' + mm + ' to 60 is 60 − ' + mm + ' = <b>' + (60 - mm) + '</b>.', 'It is <b>' + (60 - mm) + '</b> minutes until ' + nx(h) + '. ✅']),
            truth: 60 - mm, decode: function(){ return 60 - V.decodeClock(v2).m; },
            wrong: function(v){ return v === mm ? 'That is the minutes PAST the hour. Use 60 minus it.' : ''; }
          });
        }
        if(f === 3){
          const d = pick([5, 10, 15, 20, 25, 30, 40, 45]), mm = randInt(1, 59), t = norm(h, mm + d), tot = (h % 12) * 60 + mm + d;
          return numeric({
            prompt: 'It is ' + dig(h, mm) + '. After ' + d + ' more minutes, how many minutes past the hour will it be?', visual: '', answer: t.m, unit: 'minutes',
            hint: 'Add the minutes. If the total is 60 or more, take 60 off.',
            explain: ex('Adding minutes', [mm + ' + ' + d + ' = ' + (mm + d) + '.', mm + d >= 60 ? 'That is more than 60, so take away 60: ' + (mm + d) + ' − 60 = <b>' + t.m + '</b>.' : 'That is under 60, so no hour is added.', 'It will be <b>' + dig(t.h, t.m) + '</b>, which is <b>' + t.m + '</b> minutes past the hour. ✅']),
            truth: tot % 60,
            wrong: function(v){ return v === mm + d ? 'You did not take 60 off. 60 minutes is a whole hour.' : ''; }
          });
        }
        // which clock shows h:m ?
        const wr = wrongs(h, m).map(function(w){ return opt(K.time(w.h, w.m), V.smallClock(w.h, w.m), 'That clock shows ' + dig(w.h, w.m) + ', not ' + dig(h, m) + '. ' + w.why); });
        const q = mcq({
          prompt: 'Which clock shows ' + dig(h, m) + '?', visual: '',
          correct: opt(K.time(h, m), V.smallClock(h, m)), distractors: wr, keepOrder: true, count: 3,
          hint: 'Find the minutes first: ' + (m % 5 === 0 ? 'count in 5s' : 'count in 5s then add the ticks') + '. Then check the short hand has just passed ' + h + '.',
          explain: ex('Finding ' + dig(h, m), [dig(h, m) + ' means ' + m + ' minutes past ' + h + '.', 'The long hand: ' + countStr(m) + (m % 5 ? ', then ' + ticksStr(m) : '') + '.', 'The short hand has just passed ' + h + '. Only one clock matches: <b>' + dig(h, m) + '</b>. ✅']),
          truth: K.time(h, parseInt(dig(h, m).split(':')[1], 10))
        });
        return visualOpts(q);
      }
    }
  });
})();
