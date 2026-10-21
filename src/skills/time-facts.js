/* time-facts — seconds in a minute, days in each month, days in a year and a leap year (Year 3 statutory: know the number of seconds in a minute and the number of days in each month, year and leap year). */
(function(){
  const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
  const NAMES = ['Ana', 'Marcus', 'Sophie', 'Ivan', 'Lucy', 'Diego', 'Ellen', 'Tom'];
  /* independent truth: ask the calendar itself (Date), never a hand-typed table */
  function daysIn(mi, leap){ return new Date(leap ? 2024 : 2025, mi + 1, 0).getDate(); }
  function isLeap(y){ return new Date(y, 1, 29).getMonth() === 1; }
  function daysInYear(y){ return Math.round((Date.UTC(y + 1, 0, 1) - Date.UTC(y, 0, 1)) / 86400000); }
  const MS = { sec: 1000, min: 60000, hour: 3600000, day: 86400000, week: 7 * 86400000 };
  function ratio(big, small){ return MS[big] / MS[small]; }

  /* ---- picture: the 12 months with their days (V.extra.monthstrip) ---- */
  function strip(leap, hi){
    let s = '<svg viewBox="0 0 360 200" class="vis" role="img" aria-label="Calendar: days in each month">';
    for(let i = 0; i < 12; i++){
      const x = 6 + (i % 4) * 88, y = 6 + Math.floor(i / 4) * 66, on = hi === i;
      s += '<g class="mo" data-m="' + i + '"><rect x="' + x + '" y="' + y + '" width="82" height="58" rx="10" fill="' + (on ? '#FFE27A' : '#EEF1FB') + '" stroke="' + (on ? '#E8A33D' : '#C8CEEA') + '" stroke-width="' + (on ? 3 : 1.5) + '"/>' +
        '<text x="' + (x + 41) + '" y="' + (y + 22) + '" text-anchor="middle" font-size="14" font-weight="800" fill="#3a2a55">' + MONTHS[i].slice(0, 3) + '</text>' +
        '<text class="dd" x="' + (x + 41) + '" y="' + (y + 47) + '" text-anchor="middle" font-size="22" font-weight="900" fill="' + (leap && i === 1 ? '#C2185B' : '#2B3A67') + '">' + daysIn(i, leap) + '</text></g>';
    }
    return s + '</svg>';
  }
  function stripDecode(html){ const out = {}, re = /<g class="mo" data-m="(\d+)">[\s\S]*?<text class="dd"[^>]*>(\d+)<\/text>/g; let r; while((r = re.exec(html))) out[+r[1]] = +r[2]; return out; }
  V.extra.monthstrip = { render: strip, verify: function(a, html){ const d = stripDecode(html); for(let i = 0; i < 12; i++) if(d[i] !== daysIn(i, !!a[0])) return 'calendar draws ' + d[i] + ' for month ' + i; return (html.match(/class="mo"/g) || []).length === 12 ? '' : 'calendar must have 12 months'; } };

  /* ---- tier 1 ---- */
  function qUnit(){
    const T = [
      { big: 'minute', small: 'second', a: ratio('min', 'sec'), hint: 'Think of the clock: the second hand goes all the way round in one minute.' },
      { big: 'hour', small: 'minute', a: ratio('hour', 'min'), hint: 'The long hand goes all the way round the clock in one hour.' },
      { big: 'day', small: 'hour', a: ratio('day', 'hour'), hint: 'A day is one full day and night: 12 hours of day and 12 of night.' },
      { big: 'week', small: 'day', a: ratio('week', 'day'), hint: 'Monday, Tuesday, Wednesday … count the days of the week.' }
    ];
    const t = pick(T), sm = t.small, bg = t.big;
    return mcqNum({
      prompt: 'How many <b>' + sm + 's</b> are there in <b>1 ' + bg + '</b>?', answer: t.a,
      wrong: [{ v: 100, why: 'It is not 100 — time does not use tens. 1 ' + bg + ' = ' + t.a + ' ' + sm + 's.' }, { v: 12, why: '12 is the number of months in a year. 1 ' + bg + ' = ' + t.a + ' ' + sm + 's.' }, { v: 30, why: '30 is half of 60, and only half a ' + bg + '.' }, { v: 10, why: 'Time does not count in tens. 1 ' + bg + ' = ' + t.a + ' ' + sm + 's.' }],
      nearby: [1, -1, 6, -6, 10, -10], valid: function(v){ return v > 0 && v <= 100; }, count: 4, hint: t.hint,
      explain: ex('Units of time', ['<b>1 ' + bg + ' = ' + t.a + ' ' + sm + 's</b>.', 'Remember it: 60 seconds = 1 minute, 60 minutes = 1 hour, 24 hours = 1 day, 7 days = 1 week. ✅'])
    });
  }
  function qYearUnit(){
    const T = [{ q: 'How many <b>months</b> are there in a year?', a: new Set(Array.from({ length: 366 }, function(_, i){ return new Date(2025, 0, 1 + i).getMonth(); })).size, w: [{ v: 52, why: '52 is the number of WEEKS in a year.' }, { v: 365, why: '365 is the number of DAYS in a year.' }, { v: 10, why: 'Count them: January to December is 12.' }], u: 'months' },
      { q: 'How many <b>days</b> are there in a normal year?', a: daysInYear(2025), w: [{ v: 360, why: 'Close, but a year has 365 days (366 in a leap year).' }, { v: 366, why: '366 is for a LEAP year. A normal year has 365.' }, { v: 12, why: '12 is the number of months.' }], u: 'days' },
      { q: 'How many <b>days</b> are there in a <b>leap year</b>?', a: daysInYear(2024), w: [{ v: 365, why: '365 is a normal year. A leap year has ONE extra day: 366.' }, { v: 367, why: 'Only one extra day, so 366.' }, { v: 364, why: 'It is one MORE than 365, not one fewer.' }], u: 'days' },
      { q: 'How many <b>weeks</b> are there in a year (about)?', a: Math.floor(365 / 7), w: [{ v: 12, why: '12 is the number of months.' }, { v: 365, why: '365 is the number of days.' }, { v: 50, why: 'Close: 365 ÷ 7 is just over 52.' }], u: 'weeks' }];
    const t = pick(T);
    return mcqNum({ prompt: t.q, answer: t.a, wrong: t.w, nearby: [1, -1, 2, -2, 10, -10], valid: function(v){ return v > 0; }, count: 4,
      hint: t.u === 'months' ? 'Say the months in order: January, February … December.' : 'Normal year 365 days; leap year 366 days; 52 weeks; 12 months.',
      explain: ex('Time in a year', ['<b>12 months</b> · <b>52 weeks</b> · <b>365 days</b> in a normal year · <b>366 days</b> in a leap year.', 'So the answer is <b>' + t.a + '</b> ' + t.u + '. ✅']) });
  }
  function qReadMonth(){
    const mi = randInt(0, 11), leap = mi === 1 && chance(0.5), vis = strip(leap, mi);
    return mcqNum({
      prompt: 'Look at the calendar. How many days does <b>' + MONTHS[mi] + '</b>' + (leap ? ' have in a <b>leap year</b>' : ' have') + '?', visual: vis, answer: daysIn(mi, leap),
      wrong: [{ v: 30, why: 'Look at the yellow box for ' + MONTHS[mi] + ': it says ' + daysIn(mi, leap) + '.' }, { v: 31, why: 'Look at the yellow box for ' + MONTHS[mi] + ': it says ' + daysIn(mi, leap) + '.' }, { v: 28, why: 'Look at the yellow box for ' + MONTHS[mi] + ': it says ' + daysIn(mi, leap) + '.' }, { v: 29, why: 'Look at the yellow box for ' + MONTHS[mi] + ': it says ' + daysIn(mi, leap) + '.' }],
      nearby: [1, -1, 2, -2], valid: function(v){ return v >= 27 && v <= 32; }, count: 4, hint: 'Find ' + MONTHS[mi].slice(0, 3) + ' in the yellow box and read the big number.',
      explain: ex('Reading the calendar', ['The yellow box is <b>' + MONTHS[mi] + '</b>.', 'The big number says <b>' + daysIn(mi, leap) + '</b> days. ✅']), truth: daysIn(mi, leap),
      decode: function(){ return stripDecode(vis)[mi]; }
    });
  }
  /* ---- tier 2 ---- */
  function qWhichMonth(){
    const want = pick([30, 31, 28]), pool = MONTHS.map(function(m, i){ return { m: m, d: daysIn(i, false) }; });
    const right = pick(pool.filter(function(x){ return x.d === want; })), others = pool.filter(function(x){ return x.d !== want; });
    return mcq({
      prompt: 'Which month has <b>' + want + ' days</b>' + (want === 28 ? ' in a normal year' : '') + '?', correct: opt(K.text(right.m), right.m),
      distractors: shuffle(others).slice(0, 5).map(function(x){ return opt(K.text(x.m), x.m, x.m + ' has ' + x.d + ' days' + (x.m === 'February' ? ' (29 in a leap year)' : '') + '.'); }), count: 4,
      hint: want === 28 ? 'Only one month is shorter than all the others.' : 'Remember the rhyme: “Thirty days hath September, April, June and November.”',
      explain: ex('Days in each month', ['<b>30 days:</b> April, June, September, November.', '<b>28 days</b> (29 in a leap year): February. <b>31 days:</b> all the others.', right.m + ' has <b>' + want + '</b> days. ✅']), truth: K.text(right.m)
    });
  }
  function qLeapPick(){
    const base = randInt(2004, 2096), leapY = base - (base % 4), keep = [leapY];
    const cand = [leapY + 1, leapY + 2, leapY + 3, leapY - 1, leapY - 2, leapY - 3, leapY + 5, leapY - 5].filter(function(y){ return y > 2000 && y < 2100 && !isLeap(y); });
    const ds = shuffle(cand).slice(0, 3);
    return mcq({
      prompt: 'Which of these years is a <b>leap year</b>?', correct: opt(K.num(leapY), String(leapY)),
      distractors: ds.map(function(y){ return opt(K.num(y), String(y), y + ' is not a leap year: February has only 28 days. Leap years come every 4 years (e.g. 2024, 2028).'); }), count: 4,
      hint: 'A leap year comes every 4 years. 2024 was a leap year, then 2028, 2032 …',
      explain: ex('Leap years', ['A leap year has <b>366 days</b>: February gets an extra day (29).', 'They come <b>every 4 years</b>: …, 2024, 2028, 2032 …', leapY + ' is in that pattern. ✅']), truth: K.num(isLeap(leapY) ? leapY : -1)
    });
  }
  function qLeapFeb(){
    const y = pick([2024, 2028, 2032, 2036]), leapQ = chance(0.5), yy = leapQ ? y : y + pick([1, 2, 3]), a = isLeap(yy) ? 29 : 28;
    return mcqNum({
      prompt: 'How many days does <b>February</b> have in the year <b>' + yy + '</b>?<br><small>(Leap years: 2024, 2028, 2032, 2036 …)</small>', answer: a,
      wrong: [{ v: a === 29 ? 28 : 29, why: a === 29 ? yy + ' is a leap year, so February has an EXTRA day: 29.' : yy + ' is not a leap year, so February has 28 days.' }, { v: 30, why: 'February is the shortest month: 28 or 29 days.' }, { v: 31, why: 'February is the shortest month: 28 or 29 days.' }],
      nearby: [1, -1], valid: function(v){ return v >= 27 && v <= 31; }, count: 3, hint: 'Is ' + yy + ' in the list of leap years?',
      explain: ex('February', [yy + (isLeap(yy) ? ' <b>is</b> a leap year' : ' is <b>not</b> a leap year') + '.', 'February has <b>' + a + '</b> days. ✅'])
    });
  }
  function qLongest(){
    const pairs = [[0, 1], [3, 6], [8, 11], [2, 3], [1, 10], [6, 7], [4, 5], [9, 8]], p = pick(pairs), a = daysIn(p[0], false), b = daysIn(p[1], false);
    if(a === b) return qWhichMonth();
    const ask = chance(0.5) ? 'more' : 'fewer', ans = ask === 'more' ? (a > b ? p[0] : p[1]) : (a < b ? p[0] : p[1]);
    return mcq2({
      prompt: 'Which month has <b>' + ask + ' days</b> (in a normal year): <b>' + MONTHS[p[0]] + '</b> or <b>' + MONTHS[p[1]] + '</b>?', correct: opt(K.text(MONTHS[ans]), MONTHS[ans]),
      other: opt(K.text(MONTHS[ans === p[0] ? p[1] : p[0]]), MONTHS[ans === p[0] ? p[1] : p[0]], MONTHS[p[0]] + ' has ' + a + ' days and ' + MONTHS[p[1]] + ' has ' + b + '.'),
      hint: 'Work out how many days each month has, then compare.', explain: ex('Comparing months', [MONTHS[p[0]] + ' = <b>' + a + '</b> days, ' + MONTHS[p[1]] + ' = <b>' + b + '</b> days.', MONTHS[ans] + ' has ' + ask + ' days. ✅']), truth: K.text(MONTHS[ans])
    });
  }
  /* ---- tier 3: typed ---- */
  function qConvert(){
    const T = [['minutes', 'seconds', 'min', 'sec', 2, 6], ['hours', 'minutes', 'hour', 'min', 2, 5], ['days', 'hours', 'day', 'hour', 2, 4], ['weeks', 'days', 'week', 'day', 2, 8]];
    const t = pick(T), n = randInt(t[4], t[5]), k = ratio(t[2], t[3]), a = n * k;
    return numeric({
      prompt: 'Type the answer: how many <b>' + t[1] + '</b> are there in <b>' + n + ' ' + t[0] + '</b>?', answer: a,
      hint: '1 ' + t[2].replace('min', 'minute').replace('sec', 'second') + ' = ' + k + ' ' + t[1] + '. So multiply ' + k + ' by ' + n + '.',
      explain: ex('Changing units of time', ['1 ' + t[0].slice(0, -1) + ' = ' + k + ' ' + t[1] + '.', n + ' × ' + k + ' = <b>' + a + '</b> ' + t[1] + '. ✅']),
      wrong: function(v){ return v === k ? 'That is for ONE ' + t[0].slice(0, -1) + '. Multiply by ' + n + '.' : v === n + k ? 'You added. Changing units is a multiplication: ' + n + ' × ' + k + '.' : ''; }
    });
  }
  function qTwoMonths(){
    let i = randInt(0, 11), j = randInt(0, 11); if(i === j) j = (i + 5) % 12; const vis = strip(false, -1), a = daysIn(i, false) + daysIn(j, false);
    return numeric({
      prompt: 'Use the calendar. How many days are there in <b>' + MONTHS[i] + '</b> and <b>' + MONTHS[j] + '</b> together?', visual: vis, answer: a,
      hint: 'Read each month, then add the two numbers.', explain: ex('Adding months', [MONTHS[i] + ' = <b>' + daysIn(i, false) + '</b> days, ' + MONTHS[j] + ' = <b>' + daysIn(j, false) + '</b> days.', daysIn(i, false) + ' + ' + daysIn(j, false) + ' = <b>' + a + '</b>. ✅']),
      decode: function(){ const d = stripDecode(vis); return d[i] + d[j]; },
      wrong: function(v){ return v === daysIn(i, false) || v === daysIn(j, false) ? 'That is just one month. Add both.' : ''; }
    });
  }
  function qDaysLeft(){
    const mi = pick([0, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11]), day = randInt(5, 27), who = pick(NAMES), left = Math.round((new Date(2025, mi + 1, 1) - new Date(2025, mi, day + 1)) / 86400000);
    return numeric({
      prompt: 'Today is <b>' + day + ' ' + MONTHS[mi] + '</b>. How many days are left until the <b>end of ' + MONTHS[mi] + '</b>?', answer: left,
      hint: MONTHS[mi] + ' has ' + daysIn(mi, false) + ' days. Take away the days already gone.', explain: ex('Days left in the month', [MONTHS[mi] + ' has <b>' + daysIn(mi, false) + '</b> days.', daysIn(mi, false) + ' − ' + day + ' = <b>' + left + '</b>. ✅']),
      wrong: function(v){ return v === daysIn(mi, false) ? 'That is the whole month. Subtract today’s date.' : v === left + 1 ? 'Check: ' + daysIn(mi, false) + ' − ' + day + ' = ' + left + '.' : ''; }
    });
  }
  function qFourYears(){
    const a = daysInYear(2025) * 3 + daysInYear(2024);
    return numeric({
      prompt: 'Three years have 365 days and one leap year has 366. How many days is that <b>altogether</b>?', answer: a, truth: (Date.UTC(2025, 0, 1) - Date.UTC(2021, 0, 1)) / 86400000,
      hint: 'Do 3 × 365 first, then add 366.', explain: ex('Four years with a leap year', ['3 × 365 = <b>1095</b>.', '1095 + 366 = <b>' + a + '</b>. ✅']),
      wrong: function(v){ return v === 4 * 365 ? 'You gave all four years 365 days. One of them is a leap year with 366.' : ''; }
    });
  }

  registerSkill({
    id: 'time-facts', strand: 'time', name: 'Time facts: seconds, months, leap years', emoji: '📅', year: 3, order: 565, prereq: ['time-minutes'],
    lesson: {
      title: 'Facts about time',
      steps: [
        { say: 'Some time facts are worth knowing by heart. <b>60 seconds = 1 minute</b>, and <b>60 minutes = 1 hour</b>. The long hand goes once round the clock in one hour.', vis: { kind: 'clock', args: [3, 0] },
          quiz: { prompt: 'How many seconds are there in 1 minute?', options: [{ label: '60', ok: true }, { label: '100', ok: false }, { label: '30', ok: false }], right: 'Yes! 60 seconds = 1 minute.', wrong: 'Time counts in 60s: 60 seconds make 1 minute.' } },
        { say: '<b>24 hours = 1 day</b>, <b>7 days = 1 week</b>, <b>12 months = 1 year</b>, and a normal year has <b>365 days</b> (52 weeks and 1 day).', vis: { kind: 'monthstrip', args: [false] },
          quiz: { prompt: 'How many months are there in a year?', options: [{ label: '12', ok: true }, { label: '10', ok: false }, { label: '52', ok: false }], right: 'Yes! 12 months.', wrong: 'Count the boxes on the calendar: there are 12 months.' } },
        { say: 'Months have different lengths. <b>30 days</b>: April, June, September, November. <b>31 days</b>: the rest. <b>February</b> is the short one: <b>28</b> days.', vis: { kind: 'monthstrip', args: [false] },
          quiz: { prompt: 'Which month has 28 days in a normal year?', options: [{ label: 'February', ok: true }, { label: 'April', ok: false }, { label: 'March', ok: false }], right: 'Yes! February is the shortest month.', wrong: 'Look for the box with 28: it is February.' } },
        { say: 'Every <b>4 years</b> there is a <b>leap year</b>: February gets one extra day, so it has <b>29</b> days and the year has <b>366</b> days. 2024 and 2028 are leap years.', vis: { kind: 'monthstrip', args: [true] },
          quiz: { prompt: 'How many days are there in a leap year?', options: [{ label: '366', ok: true }, { label: '365', ok: false }, { label: '364', ok: false }], right: 'Yes! One extra day: 366.', wrong: 'A leap year has ONE extra day: 365 + 1 = 366.' } }
      ]
    },
    trick: {
      title: 'The month rhyme',
      say: '“<b>Thirty days hath September, April, June and November.</b> All the rest have thirty-one, except February: 28 days, and 29 in a leap year.”',
      vis: { kind: 'monthstrip', args: [false] },
      example: 'Leap years come every 4 years: 2024 → 2028 → 2032 &nbsp;·&nbsp; Leap year = <b>366</b> days'
    },
    gen: {
      1: function(){ return pick([qUnit, qUnit, qYearUnit, qReadMonth, qReadMonth])(); },
      2: function(){ return pick([qWhichMonth, qWhichMonth, qLeapPick, qLeapFeb, qLongest, qYearUnit])(); },
      3: function(){ return pick([qConvert, qConvert, qTwoMonths, qDaysLeft, qDaysLeft, qFourYears])(); }
    }
  });
})();
