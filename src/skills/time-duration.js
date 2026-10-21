/* time-duration — time facts, how long between two times, "finishes at", timetables. */
(function(){
  const NAMES = ['Ana', 'Marcus', 'Sophie', 'Ivan', 'Lucy', 'Diego', 'Ellen', 'Tom', 'Aisha', 'Kai', 'Mei', 'Leo'];
  const SHOWS = ['Unicorn Club', 'Space Explorers', 'Cake Challenge', 'Puppy Patrol', 'Ocean Stories', 'Football Friends', 'Robot Workshop', 'Dino Detectives', 'Magic Garden', 'Pirate Cove'];
  const THINGS = ['film', 'cartoon', 'swimming lesson', 'football match', 'baking class', 'puppet show', 'art workshop', 'space talk'];
  const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
  const DAYS_IN = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];

  /* ---- time helpers. "t" = absolute minutes on a 12-hour dial (e.g. 3:40 = 220) ---- */
  function hOf(t){ return Math.floor(t / 60) % 12 || 12; }
  function dig(t){ return hOf(t) + ':' + pad2(t % 60); }
  function nrm(h, m){ const t = ((((h % 12) * 60 + m) % 720) + 720) % 720; return { h: Math.floor(t / 60) || 12, m: t % 60 }; }
  function durLabel(d){ const h = Math.floor(d / 60), r = d % 60; return (h ? plural(h, 'hour') : '') + (h && r ? ' ' : '') + (r ? plural(r, 'minute') : ''); }
  function ck(html){ const d = V.decodeClock(html); return K.time(d.h, d.m); }
  function clocksIn(html){ return html.split('<svg').slice(1).map(function(x){ return V.decodeClock('<svg' + x); }); }
  function tot(c){ return (c.h % 12) * 60 + c.m; }
  function durOfPair(html){ const c = clocksIn(html); let d = tot(c[1]) - tot(c[0]); if(d <= 0) d += 720; return d; }

  /* ---- a pair of clocks: start -> finish ---- */
  function pair(s, e){
    const a = nrm(Math.floor(s / 60), s % 60), b = nrm(Math.floor(e / 60), e % 60);
    function box(t, c){ return '<div style="text-align:center"><div style="font-weight:800;margin-bottom:2px">' + t + '</div>' + V.clock(c.h, c.m, { width: 128 }) + '</div>'; }
    return '<div class="clockpair" style="display:flex;align-items:center;justify-content:center;gap:4px;flex-wrap:wrap">' + box('Start', a) + '<div style="font-size:26px;font-weight:900">➜</div>' + box('Finish', b) + '</div>';
  }
  V.extra.clockPair = {
    render: function(h1, m1, h2, m2){ return pair(h1 * 60 + m1, h2 * 60 + m2); },
    verify: function(a, html){
      const c = clocksIn(html);
      if(c.length !== 2) return 'clockPair must draw two clocks';
      const w1 = nrm(a[0], a[1]), w2 = nrm(a[2], a[3]);
      return (c[0].h === w1.h && c[0].m === w1.m && c[1].h === w2.h && c[1].m === w2.m) ? '' : 'clockPair draws ' + c[0].h + ':' + c[0].m + ' / ' + c[1].h + ':' + c[1].m;
    }
  };

  /* ---- timetable ---- */
  function table(rows){
    let s = '<table class="timetable" style="border-collapse:collapse;margin:0 auto;font-weight:700;color:var(--vis-ink,#1B1B2F)"><caption style="font-weight:900;padding:4px">TV this afternoon (all times pm)</caption><tr style="background:#EEF1FB"><th style="border:2px solid #1B1B2F;padding:5px 9px;text-align:left">Programme</th><th style="border:2px solid #1B1B2F;padding:5px 9px">Starts</th><th style="border:2px solid #1B1B2F;padding:5px 9px">Ends</th></tr>';
    rows.forEach(function(r){
      s += '<tr class="ttrow" data-n="' + r.name + '"><td style="border:2px solid #1B1B2F;padding:5px 9px">' + r.name + '</td><td class="ts" style="border:2px solid #1B1B2F;padding:5px 9px;text-align:center">' + dig(r.s) + '</td><td class="te" style="border:2px solid #1B1B2F;padding:5px 9px;text-align:center">' + dig(r.e) + '</td></tr>';
    });
    return s + '</table>';
  }
  function readTable(html){ // -> [{name, s, e}] with s,e in minutes read from the printed cells
    const out = [], re = /<tr class="ttrow" data-n="([^"]*)"><td[^>]*>[^<]*<\/td><td class="ts"[^>]*>(\d+):(\d\d)<\/td><td class="te"[^>]*>(\d+):(\d\d)<\/td>/g; let r;
    while((r = re.exec(html))) out.push({ name: r[1], s: (+r[2] % 12) * 60 + (+r[3]), e: (+r[4] % 12) * 60 + (+r[5]) });
    return out;
  }
  function makeRows(durs, gapMax, step, base, gapMin){
    const names = sample(SHOWS, durs.length); let t = base; const rows = [];
    durs.forEach(function(d, i){ if(i > 0 && gapMax) t += step * randInt(gapMin || 0, gapMax); rows.push({ name: names[i], s: t, e: t + d }); t += d; });
    return rows;
  }

  /* ---- explanations ---- */
  function countOn(s, e){
    const d = e - s, sm = s % 60, em = e % 60, steps = [];
    if(Math.floor(s / 60) === Math.floor(e / 60)) steps.push('Count on from ' + dig(s) + ' to ' + dig(e) + ' in 5s: that is <b>' + plural(d, 'minute') + '</b>.');
    else if(sm === 0){
      const hrs = (e - s - em) / 60;
      steps.push(dig(s) + ' to ' + dig(s + hrs * 60) + ' is <b>' + plural(hrs, 'hour') + '</b>.');
      if(em) steps.push(dig(e - em) + ' to ' + dig(e) + ' is <b>' + plural(em, 'minute') + '</b>.');
    } else {
      const nxt = s + (60 - sm), mid = (e - em - nxt) / 60;
      steps.push('Jump to the next o’clock: ' + dig(s) + ' to ' + dig(nxt) + ' is <b>' + plural(60 - sm, 'minute') + '</b>.');
      if(mid > 0) steps.push(dig(nxt) + ' to ' + dig(nxt + mid * 60) + ' is <b>' + plural(mid, 'hour') + '</b>.');
      if(em) steps.push('Then ' + dig(e - em) + ' to ' + dig(e) + ' is <b>' + plural(em, 'minute') + '</b>.');
    }
    steps.push('All together: <b>' + durLabel(d) + '</b>. ✅');
    return steps;
  }
  function explainFinish(s, d){
    const e = s + d, sm = s % 60, hrs = Math.floor(d / 60), rem = d % 60, steps = ['Start at <b>' + dig(s) + '</b>.'];
    if(hrs) steps.push('Add ' + plural(hrs, 'hour') + ': ' + dig(s) + ' → ' + dig(s + hrs * 60) + '.');
    if(rem) steps.push('Add ' + plural(rem, 'minute') + ': ' + sm + ' + ' + rem + ' = ' + (sm + rem) + (sm + rem === 60 ? ', which reaches 60, so the hour moves on' : sm + rem > 60 ? ', which is more than 60, so the hour moves on' : '') + '. It ends at <b>' + dig(e) + '</b>. ✅');
    else steps.push('It ends at <b>' + dig(e) + '</b>. ✅');
    return steps;
  }
  function finishWrongs(s, d, minLevel){
    const e = s + d, sm = s % 60, rem = d % 60, out = [];
    function add(t, why){ const tt = ((t % 720) + 720) % 720; out.push({ t: tt, why: why }); }
    add(s - d, 'Finishing is LATER than starting, so we add the time on, not take it away.');
    if(rem && sm + rem >= 60) add(e - 60, 'The minutes reached 60 or more, so the hour must move on: ' + sm + ' + ' + rem + ' = ' + (sm + rem) + '.');
    if(rem && sm + rem < 60) add(e + 60, 'The minutes have not reached 60 yet, so the hour does not change.');
    if(rem) add(s + Math.floor(d / 60) * 60, 'You added the hours but forgot the ' + plural(rem, 'extra minute') + '.');
    add(e + 30, 'Check the adding again.'); add(e - 30, 'Check the adding again.');
    add(e + 60, 'Check the adding again.'); add(e - 60, 'Check the adding again.');
    add(e + 10, 'Check the adding again.'); add(e - 10, 'Check the adding again.');
    add(e + 5, 'Check the adding again.'); add(e - 5, 'Check the adding again.'); add(e + 15, 'Check the adding again.'); add(e - 15, 'Check the adding again.');
    return out.map(function(w){ return opt(K.time(hOf(w.t), w.t % 60), dig(w.t), w.why); });
  }
  function finishMcq(s, d, prompt, hint){
    const h = hOf(s), m = s % 60, vis = V.clock(h, m), e = s + d;
    return mcq({
      prompt: prompt, visual: vis, correct: opt(K.time(hOf(e), e % 60), dig(e)), distractors: finishWrongs(s, d), keepOrder: true,
      hint: hint, explain: ex('When does it finish?', explainFinish(s, d)),
      truth: (function(){ const tt = (h % 12) * 60 + m + d; return K.time(Math.floor(tt / 60) % 12 || 12, tt % 60); })(),
      decode: function(){ const c = V.decodeClock(vis), n = nrm(c.h, c.m + d); return K.time(n.h, n.m); }
    });
  }
  function durWrongs(s, e, T){
    const d = e - s, sm = s % 60, em = e % 60, sh = Math.floor(s / 60), eh = Math.floor(e / 60), out = [];
    if(T === 3){
      const dec = (eh % 12 || 12) * 100 + em - ((sh % 12 || 12) * 100 + sm);
      if(dec > 0 && dec < 600) out.push({ v: dec, why: 'You took the times away like ordinary numbers. Minutes only go up to 60, so count on in jumps instead.' });
      const sep = (eh - sh) * 60 + Math.abs(em - sm);
      out.push({ v: sep, why: 'You took the smaller minutes from the bigger. Count on to the next o’clock first instead.' });
      if(sm) out.push({ v: d - (60 - sm) + 0, why: 'You forgot the minutes up to the next o’clock (' + plural(60 - sm, 'minute') + ').' });
      if(em && eh > sh) out.push({ v: d - em, why: 'You forgot the last ' + plural(em, 'minute') + ' after the o’clock.' });
      out.push({ v: d + 10, why: 'Count the jumps again carefully.' }); out.push({ v: d - 10, why: 'Count the jumps again carefully.' });
    } else {
      out.push({ v: (eh - sh) * 60 + Math.abs(em - sm), why: 'You took the smaller minutes from the bigger. Count on from the start instead.' });
      out.push({ v: Math.round(d / 60) * 60 + (d % 60 === 30 ? 60 : 0), why: 'You rounded to whole hours. The extra half hour counts too.' });
      out.push({ v: (eh - sh) * 60, why: 'You counted only the hours and forgot the half hour.' });
      out.push({ v: d + 30, why: 'Count on carefully from the start, half hour by half hour.' }); out.push({ v: d - 30, why: 'Count on carefully from the start, half hour by half hour.' });
    }
    out.push({ v: d + 60, why: 'You counted one hour too many. Count the jumps again.' }); out.push({ v: d - 60, why: 'You counted one hour too few. Count the jumps again.' });
    out.push({ v: d + 5, why: 'Count the jumps again carefully.' }); out.push({ v: d - 5, why: 'Count the jumps again carefully.' });
    return out;
  }
  function durMcq(prompt, visual, d, wr, hint, explainSteps, truth, decode, count){
    const seen = {}, ds = [];
    wr.concat([{ v: d + 60 }, { v: d - 60 }, { v: d + 30 }, { v: d - 30 }, { v: d + 120 }, { v: d + 90 }, { v: d + 15 }, { v: d - 15 }, { v: d + 20 }, { v: d - 20 }]).forEach(function(w){
      if(w.v > 0 && w.v !== d && w.v <= 720 && !seen[w.v]){ seen[w.v] = 1; ds.push(opt(K.num(w.v), durLabel(w.v), w.why || 'Count on from the start again.')); }
    });
    return mcq({ prompt: prompt, visual: visual, correct: opt(K.num(d), durLabel(d)), distractors: ds, keepOrder: true, count: count || 4, hint: hint, explain: ex('How long?', explainSteps), truth: K.num(truth), decode: function(){ return K.num(decode()); } });
  }

  /* ---- facts ---- */
  const F1 = [
    { q: 'How many seconds are there in 1 minute?', a: 60, w: [{ v: 100, why: 'A minute is 60 seconds, not 100. Clocks count in 60s.' }, { v: 30, why: '30 seconds is only HALF a minute.' }, { v: 24, why: '24 is the number of hours in a day.' }], tr: function(){ return 6 * 10; }, ex: 'A minute has <b>60 seconds</b>. The second hand goes all the way round in 60 seconds.' },
    { q: 'How many minutes are there in 1 hour?', a: 60, w: [{ v: 100, why: 'An hour is 60 minutes, not 100.' }, { v: 30, why: '30 minutes is only HALF an hour.' }, { v: 24, why: '24 is the number of hours in a day.' }], tr: function(){ return 12 * 5; }, ex: 'The long hand goes round the clock once in an hour: 12 numbers × 5 = <b>60 minutes</b>.' },
    { q: 'How many hours are there in 1 day?', a: 24, w: [{ v: 12, why: 'The clock face shows 12, but a whole day goes round the clock TWICE: 12 + 12.' }, { v: 60, why: '60 is the number of minutes in an hour.' }, { v: 7, why: '7 is the number of days in a week.' }], tr: function(){ return 12 + 12; }, ex: 'The short hand goes round twice in a day (am and pm): 12 + 12 = <b>24 hours</b>.' },
    { q: 'How many days are there in 1 week?', a: 7, w: [{ v: 5, why: '5 is just the school days. A week has the weekend too.' }, { v: 12, why: '12 is the number of months in a year.' }, { v: 10, why: 'A week is 7 days, not 10.' }], tr: function(){ return 5 + 2; }, ex: 'Monday to Friday is 5 days, plus Saturday and Sunday: <b>7 days</b>.' },
    { q: 'How many months are there in 1 year?', a: 12, w: [{ v: 10, why: 'There are 12 months, January to December.' }, { v: 7, why: '7 is the number of days in a week.' }, { v: 52, why: '52 is the number of WEEKS in a year.' }], tr: function(){ return 4 * 3; }, ex: 'January to December is <b>12 months</b>.' },
    { q: 'How many minutes are there in half an hour?', a: 30, w: [{ v: 15, why: '15 minutes is a QUARTER of an hour.' }, { v: 60, why: '60 minutes is a WHOLE hour.' }, { v: 45, why: '45 minutes is three quarters of an hour.' }], tr: function(){ return 60 / 2; }, ex: 'An hour is 60 minutes, so half an hour is 60 ÷ 2 = <b>30 minutes</b>.' }
  ];
  const F2 = [
    { q: 'How many minutes are there in a quarter of an hour?', a: 15, w: [{ v: 25, why: 'A quarter is 1 out of 4 equal parts: 60 ÷ 4.' }, { v: 30, why: '30 minutes is HALF an hour.' }, { v: 45, why: '45 minutes is THREE quarters.' }], tr: function(){ return 3 * 5; }, ex: 'An hour is 60 minutes. A quarter is 60 ÷ 4 = <b>15 minutes</b>.' },
    { q: 'How many days are there in a normal year?', a: 365, w: [{ v: 366, why: '366 is a LEAP year, which comes only every 4 years.' }, { v: 360, why: 'It is a little more than 360: 365 days.' }, { v: 350, why: 'A year has 365 days.' }], tr: function(){ return 7 * 52 + 1; }, ex: 'A normal year has <b>365 days</b> (366 in a leap year).' },
    { q: 'How many hours are there in half a day?', a: 12, w: [{ v: 6, why: '6 hours is a QUARTER of a day.' }, { v: 24, why: '24 hours is a WHOLE day.' }, { v: 10, why: 'Half of 24 is 12.' }], tr: function(){ return 24 / 2; }, ex: 'A day is 24 hours, so half a day is 24 ÷ 2 = <b>12 hours</b>.' },
    { q: 'A fortnight is 2 weeks. How many days is that?', a: 14, w: [{ v: 12, why: '2 weeks is 7 + 7, not 6 + 6.' }, { v: 7, why: '7 is ONE week.' }, { v: 10, why: '10 would be 2 school weeks of 5 days. A week has 7 days.' }], tr: function(){ return 7 + 7; }, ex: 'One week is 7 days, so 2 weeks is 7 + 7 = <b>14 days</b>.' },
    { q: 'How many weeks are there in a year?', a: 52, w: [{ v: 12, why: '12 is the number of MONTHS in a year.' }, { v: 50, why: 'It is a little more than 50: 52 weeks.' }, { v: 365, why: '365 is the number of DAYS in a year.' }], tr: function(){ return 4 * 13; }, ex: 'A year has <b>52 weeks</b> (52 × 7 = 364 days, plus 1 spare day).' }
  ];
  function factQ(F){
    const f = pick(F);
    return mcqNum({
      prompt: f.q, answer: f.a, wrong: f.w, valid: function(v){ return v > 0; }, nearby: f.a > 100 ? [-5, 1, -10, 10] : [1, -1, 2, 5, 10, -10, 12],
      hint: 'Think about a clock, a calendar or a diary. Say what you already know: “there are … in a …”.',
      explain: ex('Time facts', [f.ex, 'So the answer is <b>' + f.a + '</b>. ✅']), truth: f.tr()
    });
  }
  function monthQ(){
    const i = randInt(0, 11), f = randInt(0, 1);
    const THIRTY = ['April', 'June', 'September', 'November'];
    if(f === 0){
      const nm = MONTHS[i], a = DAYS_IN[i], truth = nm === 'February' ? 28 : (THIRTY.indexOf(nm) >= 0 ? 30 : 31);
      return mcqNum({
        prompt: 'How many days are there in ' + nm + ' (in a normal year)?', answer: a,
        wrong: a === 28 ? [{ v: 30, why: 'February is the short month. It has only 28 days (29 in a leap year).' }, { v: 31, why: 'February is the short month. It has only 28 days.' }, { v: 29, why: '29 only happens in a LEAP year. A normal year has 28.' }]
          : [{ v: a === 30 ? 31 : 30, why: a === 30 ? nm + ' is one of the 30-day months: “30 days hath September, April, June and November”.' : nm + ' is one of the 31-day months.' }, { v: 28, why: '28 is February.' }, { v: 29, why: 'Only February can have 29 days, and only in a leap year.' }],
        valid: function(v){ return v >= 28 && v <= 31; }, nearby: [1, -1, 2, -2, 3],
        hint: 'Remember the rhyme: “30 days hath September, April, June and November. All the rest have 31, except February.”',
        explain: ex('Days in ' + nm, [a === 28 ? 'February is the short month.' : (a === 30 ? nm + ' is in the rhyme “30 days hath September, April, June and November”.' : nm + ' is NOT in the rhyme, so it has the long number of days.'), 'The answer is <b>' + a + '</b> days. ✅']), truth: truth
      });
    }
    const want = pick([28, 30, 30, 31]);
    const pool = MONTHS.filter(function(x, j){ return want === 28 ? j === 1 : (want === 30 ? DAYS_IN[j] === 30 : DAYS_IN[j] === 31); });
    const ans = pick(pool), others = MONTHS.filter(function(x, j){ return DAYS_IN[j] !== want; });
    const wrongWhy = function(x){ const dd = DAYS_IN[MONTHS.indexOf(x)]; return x + ' has ' + dd + ' days' + (x === 'February' ? ' (29 in a leap year).' : '.'); };
    return mcq({
      prompt: want === 28 ? 'Which month has only 28 days in a normal year?' : 'Which of these months has ' + want + ' days?',
      correct: opt(K.text(ans), ans), distractors: others.map(function(x){ return opt(K.text(x), x, wrongWhy(x)); }),
      hint: 'Use the rhyme or your knuckles: “30 days hath September, April, June and November. All the rest have 31, except February.”',
      explain: ex('Finding the month', [want === 28 ? 'February is the shortest month.' : 'Rhyme: 30 days hath September, April, June and November. All the others have 31, except February.', ans + ' has ' + want + ' days, so the answer is <b>' + ans + '</b>. ✅']),
      truth: K.text(MONTHS[DAYS_IN.map(function(x, j){ return x === want && MONTHS[j] === ans ? j : -1; }).filter(function(j){ return j >= 0; })[0]])
    });
  }
  function typedFact(){
    const f = randInt(0, 6);
    if(f === 0){ const n = randInt(2, 5); return numeric({ prompt: 'How many days are there in ' + n + ' weeks?', answer: n * 7, unit: 'days', hint: 'One week is 7 days. Count in 7s.', explain: ex('Weeks to days', ['1 week = 7 days.', n + ' weeks = ' + Array(n).fill(7).join(' + ') + '.', 'That is <b>' + n * 7 + '</b> days. ✅']), truth: 7 * n, wrong: function(v){ return v === n + 7 ? 'You added. Each week has 7 days, so multiply.' : ''; } }); }
    if(f === 1){ const n = randInt(2, 3); return numeric({ prompt: 'How many hours are there in ' + n + ' days?', answer: n * 24, unit: 'hours', hint: 'One day is 24 hours. Add 24 again for each day.', explain: ex('Days to hours', ['1 day = 24 hours.', n + ' days = ' + Array(n).fill(24).join(' + ') + '.', 'That is <b>' + n * 24 + '</b> hours. ✅']), truth: 24 * n }); }
    if(f === 2){ const n = randInt(2, 5); return numeric({ prompt: 'How many minutes are there in ' + n + ' hours?', answer: n * 60, unit: 'minutes', hint: 'One hour is 60 minutes. Count in 60s.', explain: ex('Hours to minutes', ['1 hour = 60 minutes.', n + ' hours = ' + Array(n).fill(60).join(' + ') + '.', 'That is <b>' + n * 60 + '</b> minutes. ✅']), truth: 60 * n }); }
    if(f === 3){ const n = randInt(2, 5); return numeric({ prompt: 'How many seconds are there in ' + n + ' minutes?', answer: n * 60, unit: 'seconds', hint: 'One minute is 60 seconds. Count in 60s.', explain: ex('Minutes to seconds', ['1 minute = 60 seconds.', n + ' minutes = ' + Array(n).fill(60).join(' + ') + '.', 'That is <b>' + n * 60 + '</b> seconds. ✅']), truth: 60 * n }); }
    if(f === 4){ const n = randInt(2, 4); return numeric({ prompt: 'How many months are there in ' + n + ' years?', answer: n * 12, unit: 'months', hint: 'One year is 12 months.', explain: ex('Years to months', ['1 year = 12 months.', n + ' years = ' + Array(n).fill(12).join(' + ') + '.', 'That is <b>' + n * 12 + '</b> months. ✅']), truth: 12 * n }); }
    if(f === 5){ // two consecutive months
      const i = randInt(0, 10), nm1 = MONTHS[i], nm2 = MONTHS[i + 1], a = DAYS_IN[i], b = DAYS_IN[i + 1];
      return numeric({ prompt: 'How many days are there in ' + nm1 + ' and ' + nm2 + ' together (a normal year)?', answer: a + b, unit: 'days', hint: 'Work out each month first (use the rhyme), then add.', explain: ex('Two months', [nm1 + ' has ' + a + ' days.', nm2 + ' has ' + b + ' days.', a + ' + ' + b + ' = <b>' + (a + b) + '</b> days. ✅']), truth: [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31].slice(i, i + 2).reduce(function(x, y){ return x + y; }, 0) });
    }
    const q = pick([[3, 45], [2, 30], [1, 15]]);
    return numeric({ prompt: 'How many minutes are there in ' + q[0] + ' quarter' + (q[0] > 1 ? 's' : '') + ' of an hour?', answer: q[1], unit: 'minutes', hint: 'A quarter of an hour is 15 minutes. Count in 15s.', explain: ex('Quarters of an hour', ['1 quarter of an hour = 15 minutes.', plural(q[0], 'quarter') + ' = ' + Array(q[0]).fill(15).join(' + ') + '.', 'That is <b>' + q[1] + '</b> minutes. ✅']), truth: 15 * q[0] });
  }

  registerSkill({
    id: 'time-duration', strand: 'time', name: 'How long? Durations & timetables', emoji: '⌛', year: 3, order: 560, prereq: ['time-five-minutes'],
    lesson: {
      title: 'How long does it last?',
      steps: [
        { say: 'To find <b>how long</b> something lasts, count on from the start time to the finish time. From 3 o’clock to 4 o’clock is 1 hour, and to 5 o’clock is 2 hours. So this film lasts <b>2 hours</b>.', vis: { kind: 'clockPair', args: [3, 0, 5, 0] } },
        { say: 'Handy time facts: <b>60 seconds</b> = 1 minute, <b>60 minutes</b> = 1 hour, <b>24 hours</b> = 1 day, <b>7 days</b> = 1 week, <b>12 months</b> = 1 year.', vis: { kind: 'html', args: ['<table style="border-collapse:collapse;margin:0 auto;font-weight:800;color:var(--vis-ink,#1B1B2F)"><tr><td style="border:2px solid #1B1B2F;padding:5px 10px">60 seconds</td><td style="border:2px solid #1B1B2F;padding:5px 10px">1 minute</td></tr><tr><td style="border:2px solid #1B1B2F;padding:5px 10px">60 minutes</td><td style="border:2px solid #1B1B2F;padding:5px 10px">1 hour</td></tr><tr><td style="border:2px solid #1B1B2F;padding:5px 10px">24 hours</td><td style="border:2px solid #1B1B2F;padding:5px 10px">1 day</td></tr><tr><td style="border:2px solid #1B1B2F;padding:5px 10px">7 days</td><td style="border:2px solid #1B1B2F;padding:5px 10px">1 week</td></tr><tr><td style="border:2px solid #1B1B2F;padding:5px 10px">12 months</td><td style="border:2px solid #1B1B2F;padding:5px 10px">1 year</td></tr></table>'] },
          quiz: { prompt: 'How many minutes are there in 1 hour?', options: [{ label: '60', ok: true }, { label: '100', ok: false }, { label: '24', ok: false }], right: 'Yes! 60 minutes make 1 hour.', wrong: 'An hour is 60 minutes (12 numbers × 5). Not 100, and 24 is the number of hours in a day.' } },
        { say: 'Half hours: from 3:30 to 4:00 is <b>30 minutes</b>. From 4:00 to 5:00 is <b>1 hour</b>. So 3:30 to 5:00 is <b>1 hour 30 minutes</b>.', vis: { kind: 'clockPair', args: [3, 30, 5, 0] } },
        { say: 'Across the hour, jump to the next o’clock first. A film starts at <b>3:40</b> and ends at <b>4:15</b>. The line counts minutes after 3 o’clock, and the dot is 3:40. Jump 20 minutes to 4:00, then 15 more: <b>35 minutes</b>.', vis: { kind: 'numberLine', args: [{ min: 0, max: 75, minor: 5, major: 15, width: 348, marks: [{ value: 40, kind: 'dot' }] }] },
          quiz: { prompt: 'A cartoon starts at 5:50 and ends at 6:20. How long is it?', options: [{ label: '30 minutes', ok: true }, { label: '70 minutes', ok: false }, { label: '40 minutes', ok: false }], right: 'Yes! 5:50 to 6:00 is 10 minutes, and 6:00 to 6:20 is 20 more: 30 minutes.', wrong: 'Jump to the o’clock: 5:50 to 6:00 is 10 minutes. Then 6:00 to 6:20 is 20. 10 + 20 = 30 minutes.' } },
        { say: '“Finishes at” problems: start at the start time and add on. A class starts at <b>4:20</b> and lasts <b>30 minutes</b>. 20 + 30 = 50 minutes past 4, so it finishes at <b>4:50</b>.', vis: { kind: 'clock', args: [4, 20] },
          quiz: { prompt: 'A show starts at 4:20 and lasts 30 minutes. When does it finish?', options: [{ label: '4:50', ok: true }, { label: '5:20', ok: false }, { label: '4:30', ok: false }], right: 'Yes! 4:20 + 30 minutes = 4:50.', wrong: 'Add 30 minutes to 4:20. 20 + 30 = 50, so it finishes at 4:50.' } }
      ]
    },
    trick: {
      title: 'Jump to the o’clock',
      say: 'Do not take the times away like normal numbers! <b>Count on in jumps</b>: first jump to the <b>next o’clock</b>, then jump the whole <b>hours</b>, then add the last <b>minutes</b>. Add the jumps up.',
      vis: { kind: 'clockPair', args: [3, 40, 4, 15] },
      example: '3:40 → 4:00 is <b>20</b> minutes. 4:00 → 4:15 is <b>15</b> minutes. 20 + 15 = <b>35 minutes</b>.'
    },
    gen: {
      1: function(){
        const f = randInt(0, 4);
        if(f <= 1){ // whole hours, pair of clocks
          const sh = randInt(1, 9), d = randInt(1, 4), s = sh * 60, e = s + d * 60, vis = pair(s, e), nm = pick(NAMES), th = pick(THINGS);
          return durMcq(nm + '’s ' + th + ' starts at the time on the first clock and ends at the time on the second clock. How long does it last?', vis, d * 60,
            [{ v: (d + 1) * 60, why: 'You counted the starting hour as well. Count the jumps (hours) between the clocks, not the numbers.' }, { v: (d - 1) * 60 > 0 ? (d - 1) * 60 : 0, why: 'You counted one hour too few. Count each hour from start to finish.' }, { v: ((e / 60) % 12 || 12) * 60, why: 'That is the finish time as hours. We need how long between the two clocks.' }, { v: sh * 60, why: 'That is the start time. We need how long between the clocks.' }],
            'Count on one hour at a time from the first clock to the second clock.', countOn(s, e), (function(){ const a = (sh % 12) * 60, b = ((sh + d) % 12) * 60; return ((b - a) + 720) % 720; })(),
            function(){ return durOfPair(vis); }, 3);
        }
        if(f === 2){
          const sh = randInt(1, 9), d = randInt(1, 4), nm = pick(NAMES), th = pick(THINGS), s = sh * 60;
          return finishMcq(s, d * 60, nm + '’s ' + th + ' starts at the time on the clock and lasts ' + plural(d, 'hour') + '. When does it finish?', 'Count on ' + d + ' hour' + (d > 1 ? 's' : '') + ' from the time on the clock, one hour at a time.');
        }
        if(f === 3) return factQ(F1);
        const rows = makeRows([pick([30, 60]), pick([30, 60]), pick([30, 60]), pick([30, 60])], 0, 0, randInt(1, 5) * 60 + pick([0, 30])), r = pick(rows), startQ = chance(0.5), html = table(rows);
        const w = [];
        rows.forEach(function(x){ if(x !== r){ w.push(opt(K.time(hOf(startQ ? x.s : x.e), (startQ ? x.s : x.e) % 60), dig(startQ ? x.s : x.e), 'That is when “' + x.name + '” ' + (startQ ? 'starts' : 'ends') + '. Find the row for “' + r.name + '”.')); if(startQ === false) w.push(opt(K.time(hOf(x.s), x.s % 60), dig(x.s), 'That is the START time of “' + x.name + '”.')); } });
        w.unshift(opt(K.time(hOf(startQ ? r.e : r.s), (startQ ? r.e : r.s) % 60), dig(startQ ? r.e : r.s), 'That is when “' + r.name + '” ' + (startQ ? 'ends' : 'starts') + '. Read the other column.'));
        return mcq({
          prompt: 'Look at the TV timetable. What time ' + (startQ ? 'does “' + r.name + '” start?' : 'does “' + r.name + '” finish?'), visual: html,
          correct: opt(K.time(hOf(startQ ? r.s : r.e), (startQ ? r.s : r.e) % 60), dig(startQ ? r.s : r.e)), distractors: w, keepOrder: true, count: 3,
          hint: 'Find the row with the programme name, then read the ' + (startQ ? '“Starts”' : '“Ends”') + ' column.',
          explain: ex('Reading the timetable', ['Find the row for “' + r.name + '”.', 'Read the “' + (startQ ? 'Starts' : 'Ends') + '” column.', 'It ' + (startQ ? 'starts' : 'finishes') + ' at <b>' + dig(startQ ? r.s : r.e) + '</b>. ✅']),
          truth: (function(){ const ro = rows.filter(function(x){ return x.name === r.name; })[0]; const t = startQ ? ro.s : ro.e; return K.time(Math.floor(t / 60) % 12 || 12, t % 60); })(),
          decode: function(){ const rr = readTable(html).filter(function(x){ return x.name === r.name; })[0]; const t = startQ ? rr.s : rr.e; return K.time(Math.floor(t / 60) || 12, t % 60); }
        });
      },
      2: function(){
        const f = randInt(0, 6);
        if(f <= 1){ // half hours, pair of clocks
          const sh = randInt(1, 8), sm = pick([0, 30]), d = pick([30, 60, 90, 120, 150, 180, 210]), s = sh * 60 + sm, e = s + d, vis = pair(s, e), nm = pick(NAMES), th = pick(THINGS);
          return durMcq(nm + '’s ' + th + ' starts at the first clock’s time and ends at the second clock’s time. How long does it last?', vis, d, durWrongs(s, e, 2),
            'Count on from the start: first to the next o’clock or half past, then the hours.', countOn(s, e),
            (function(){ const a = (sh % 12) * 60 + sm, b = (((e / 60) | 0) % 12) * 60 + e % 60; return ((b - a) + 720) % 720; })(), function(){ return durOfPair(vis); });
        }
        if(f === 2){
          const sh = randInt(1, 8), sm = pick([0, 30]), d = pick([30, 60, 90, 120, 150]), nm = pick(NAMES), th = pick(THINGS);
          return finishMcq(sh * 60 + sm, d, nm + '’s ' + th + ' starts at the time on the clock and lasts ' + durLabel(d) + '. When does it finish?', 'Add the hours first, then the extra half hour.');
        }
        if(f === 3) return factQ(F2);
        if(f === 4) return monthQ();
        const rows = makeRows([pick([30, 60, 90]), pick([30, 60, 90]), pick([30, 60]), pick([30, 60, 90])], 0, 0, randInt(1, 4) * 60 + pick([0, 30])), html = table(rows);
        if(f === 5){ // how long is the programme
          const r = pick(rows), d = r.e - r.s;
          return durMcq('Look at the TV timetable. How long is “' + r.name + '”?', html, d, durWrongs(r.s, r.e, 2), 'Read its start and end times, then count on from the start.', countOn(r.s, r.e), r.e - r.s,
            function(){ const rr = readTable(html).filter(function(x){ return x.name === r.name; })[0]; return rr.e - rr.s; });
        }
        const r = pick(rows), t = r.s + 30 * randInt(0, Math.floor((r.e - r.s) / 30) - 1) + (chance(0.5) ? 0 : 15), q = hOf(t) + ':' + pad2(t % 60);
        const ds = rows.filter(function(x){ return x !== r; }).map(function(x){ return opt(K.text(x.name), x.name, 'On at ' + q + ' it is not “' + x.name + '” (' + dig(x.s) + ' to ' + dig(x.e) + ').'); });
        return mcq({
          prompt: 'Look at the TV timetable. Which programme is on at ' + q + '?', visual: html, correct: opt(K.text(r.name), r.name), distractors: ds, keepOrder: false, count: 3,
          hint: 'Find the programme that has started but has not finished yet at ' + q + '.',
          explain: ex('What is on?', ['At ' + q + ' we need a programme that started at or before ' + q + ' and ends after it.', '“' + r.name + '” runs from ' + dig(r.s) + ' to ' + dig(r.e) + '.', 'So the answer is <b>' + r.name + '</b>. ✅']),
          truth: K.text(rows.filter(function(x){ return x.s <= t && t < x.e; })[0].name),
          decode: function(){ const tt = readTable(html).filter(function(x){ return x.s <= t && t < x.e; }); return K.text(tt[0].name); }
        });
      },
      3: function(){
        const f = randInt(0, 7);
        if(f <= 2){ // minutes across the hour: pair of clocks
          let sh, sm, d, s, e;
          do { sh = randInt(1, 8); sm = pick([5, 10, 15, 20, 25, 35, 40, 45, 50, 55]); d = pick([15, 20, 25, 30, 35, 40, 45, 50, 55, 65, 70, 75, 80, 85, 95, 110]); s = sh * 60 + sm; e = s + d; } while(Math.floor(s / 60) === Math.floor(e / 60));
          const vis = pair(s, e), nm = pick(NAMES), th = pick(THINGS);
          const truth = ((tot({ h: hOf(e), m: e % 60 }) - tot({ h: hOf(s), m: s % 60 })) + 720) % 720;
          if(f === 0){
            return numeric({
              prompt: nm + '’s ' + th + ' starts at the first clock’s time and ends at the second clock’s time. How many minutes does it last?', visual: vis, answer: d, unit: 'minutes',
              hint: 'Jump to the next o’clock first, then add the hours and the last minutes.',
              explain: ex('Counting on', countOn(s, e).concat(d >= 60 ? ['In minutes that is <b>' + d + '</b> minutes.'] : [])), truth: truth, decode: function(){ return durOfPair(vis); },
              wrong: function(v){ const w = durWrongs(s, e, 3).filter(function(x){ return x.v === v && x.why; })[0]; return w ? w.why : ''; }
            });
          }
          return durMcq(nm + '’s ' + th + ' starts at the first clock’s time and ends at the second clock’s time. How long does it last?', vis, d, durWrongs(s, e, 3),
            'Do not subtract like normal numbers. Jump to the next o’clock first.', countOn(s, e), truth, function(){ return durOfPair(vis); });
        }
        if(f === 3){ // finishes at, minutes
          const sh = randInt(1, 9), sm = pick([5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 55, 8, 12, 17, 22, 38, 43, 47, 52]), d = pick([15, 20, 25, 30, 35, 40, 45, 50, 55, 65, 70, 75, 80, 85, 95]), nm = pick(NAMES), th = pick(THINGS);
          return finishMcq(sh * 60 + sm, d, nm + '’s ' + th + ' starts at the time on the clock and lasts ' + durLabel(d) + '. When does it finish?', 'Add the hours first, then the minutes. If the minutes reach 60, the hour moves on.');
        }
        if(f === 4) return typedFact();
        if(f === 5) return chance(0.5) ? typedFact() : monthQ();
        const rows = makeRows([pick([20, 25, 30, 35, 40, 45, 50]), pick([20, 25, 30, 35, 40, 45, 50, 55]), pick([20, 25, 30, 35, 40, 45]), pick([25, 30, 35, 40, 45, 50])], 3, 5, randInt(1, 4) * 60 + pick([0, 5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 55]), 1), html = table(rows);
        if(f === 6){
          const r = pick(rows), d = r.e - r.s;
          return numeric({
            prompt: 'Look at the TV timetable. How many minutes long is “' + r.name + '”?', visual: html, answer: d, unit: 'minutes',
            hint: 'Read its start and end times, then jump to the next o’clock first if the hour changes.', explain: ex('Counting on', countOn(r.s, r.e).concat(d >= 60 ? ['In minutes that is <b>' + d + '</b> minutes.'] : [])), truth: r.e - r.s,
            decode: function(){ const rr = readTable(html).filter(function(x){ return x.name === r.name; })[0]; return rr.e - rr.s; },
            wrong: function(v){ const w = durWrongs(r.s, r.e, 3).filter(function(x){ return x.v === v; })[0]; return w ? w.why : ''; }
          });
        }
        // gap between two programmes (needs a real gap), or what time does the programme after X begin
        const i = randInt(0, 2), a = rows[i], b = rows[i + 1], gap = b.s - a.e;
        
        return numeric({
          prompt: 'Look at the TV timetable. How many minutes are there between the end of “' + a.name + '” and the start of “' + b.name + '”?', visual: html, answer: gap, unit: 'minutes',
          hint: 'Find when the first one ends and when the next one starts, then count on between those two times.',
          explain: ex('The gap', ['“' + a.name + '” ends at <b>' + dig(a.e) + '</b>.', '“' + b.name + '” starts at <b>' + dig(b.s) + '</b>.', 'Count on from ' + dig(a.e) + ' to ' + dig(b.s) + ': <b>' + gap + '</b> minutes. ✅']),
          truth: b.s - a.e,
          decode: function(){ const rr = readTable(html), x = rr.filter(function(z){ return z.name === a.name; })[0], y = rr.filter(function(z){ return z.name === b.name; })[0]; return y.s - x.e; },
          wrong: function(v){ return v === b.e - a.e ? 'That counts to the END of “' + b.name + '”. Stop at its start.' : ''; }
        });
      }
    }
  });
})();
