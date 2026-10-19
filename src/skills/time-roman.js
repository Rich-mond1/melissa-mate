/* time-roman — Roman numerals I–XII on clock faces, and matching numerals to numbers. */
(function(){
  const ROM = ['', 'I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X', 'XI', 'XII'];
  const BUILD = ['', 'one I', '1 + 1', '1 + 1 + 1', 'the I is BEFORE the V, so take it away: 5 − 1', 'V is 5', 'the I is AFTER the V, so add it: 5 + 1', '5 + 1 + 1', '5 + 1 + 1 + 1', 'the I is BEFORE the X, so take it away: 10 − 1', 'X is 10', 'the I is AFTER the X, so add it: 10 + 1', '10 + 1 + 1'];
  const MAKE = ['', '1', '1 + 1', '1 + 1 + 1', '5 − 1', '5', '5 + 1', '5 + 1 + 1', '5 + 1 + 1 + 1', '10 − 1', '10', '10 + 1', '10 + 1 + 1'];
  const SW = { 4: 6, 6: 4, 9: 11, 11: 9 };
  function nx(h){ return (h % 12) + 1; }
  function pv(h){ return h === 1 ? 12 : h - 1; }
  function dig(h, m){ return h + ':' + pad2(m); }
  // independent decoder: Roman string -> number (subtractive rule)
  function parseRoman(s){
    const v = { I: 1, V: 5, X: 10 }; let t = 0;
    for(let i = 0; i < s.length; i++){ const a = v[s[i]], b = v[s[i + 1]] || 0; t += a < b ? -a : a; }
    return t;
  }
  function romanLabels(html){ const out = []; const re = /<text[^>]*>([IVX]+)<\/text>/g; let r; while((r = re.exec(html))) out.push(r[1]); return out; }
  // read time + check the drawn numerals really are I..XII in order
  function ck(html){
    const L = romanLabels(html);
    if(L.length !== 12) return 'no roman numerals drawn';
    for(let i = 0; i < 12; i++) if(parseRoman(L[i]) !== i + 1) return 'wrong numeral on face';
    const d = V.decodeClock(html); return K.time(d.h, d.m);
  }
  function rc(h, m, small){ return small ? V.smallClock(h, m, { roman: true }) : V.clock(h, m, { roman: true }); }
  function visualOpts(q){
    q.optionsAreVisual = true;
    q.decodeKey = function(){ for(let i = 0; i < q.options.length; i++){ if(ck(q.options[i].label) !== q.options[i].key) return 'option ' + i + ' picture does not match its key'; } return q.options[q.correct].key; };
    return q;
  }
  function wrongs(h, m, hard){
    const out = [], n = m / 5;
    if(hard && SW[h]) out.push({ h: SW[h], m: m, why: 'Careful: ' + ROM[h] + ' is ' + h + ' but ' + ROM[SW[h]] + ' is ' + SW[h] + '. ' + ROM[h] + ': ' + BUILD[h] + ' = ' + h + '.' });
    if(hard && m > 0 && SW[n]) out.push({ h: h, m: (SW[n] * 5) % 60, why: 'Careful: the long hand is on ' + ROM[n] + ' = ' + n + ', not ' + ROM[SW[n]] + '. ' + ROM[n] + ': ' + BUILD[n] + ' = ' + n + '. Then ' + n + ' × 5 = ' + m + '.' });
    if(m > 0) out.push({ h: h, m: n, why: 'The numeral tells you which NUMBER the hand is on; each number is worth 5 minutes. ' + n + ' × 5 = ' + m + ' minutes.' });
    if(m > 30) out.push({ h: nx(h), m: m, why: 'The short hand has not reached ' + ROM[nx(h)] + ' yet, so the hour is still ' + h + '.' });
    else out.push({ h: pv(h), m: m, why: 'The short hand has passed ' + ROM[h] + ', so the hour is ' + h + '.' });
    out.push({ h: (m / 5) || 12, m: (h % 12) * 5, why: 'It looks like the hands got swapped. The SHORT hand is the hour and the LONG hand is the minutes.' });
    shuffle([0, 5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 55]).forEach(function(mm){ out.push({ h: h, m: mm, why: 'Look at the LONG hand: it is not on the numeral for ' + mm + ' minutes.' }); });
    shuffle([0, 5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 55]).forEach(function(mm){ out.push({ h: nx(h), m: mm, why: 'Check the short hand and the long hand again.' }); });
    return out;
  }
  function toOpts(list){ return list.map(function(w){ return opt(K.time(w.h, w.m), dig(w.h, w.m), w.why); }); }
  function explainRead(h, m){
    const n = m / 5 || 12;
    return ex('Reading the Roman clock', [
      'The <b>short</b> hand is ' + (m > 30 ? 'nearly at ' + ROM[nx(h)] + ' but the hour is still' : 'on or just past') + ' <b>' + ROM[h] + '</b> (' + BUILD[h] + ' = <b>' + h + '</b>).',
      m === 0 ? 'The <b>long</b> hand points to <b>XII</b>: that is 0 minutes, an o’clock time.' : 'The <b>long</b> hand points to <b>' + ROM[n] + '</b> (' + n + '). ' + n + ' × 5 = <b>' + m + ' minutes</b>.',
      'The time is <b>' + dig(h, m) + '</b>. ✅'
    ]);
  }
  function numeralWrongs(n){
    const out = [];
    if(SW[n]) out.push({ v: SW[n], why: ROM[n] + ': ' + BUILD[n] + ' = ' + n + '. It is not ' + SW[n] + ' (that is ' + ROM[SW[n]] + ').' });
    if(n >= 6 && n !== 9 && n !== 10) out.push({ v: n - 2 * (n - (n >= 10 ? 10 : 5)), why: 'A small I AFTER a big letter means ADD: ' + BUILD[n] + ' = ' + n + '.' });
    out.push({ v: ROM[n].length, why: 'The number of letters is not the value. Work out what each letter is worth.' });
    [1, -1, 2, -2, 3, -3, 5, -5, 10].forEach(function(d){ out.push({ v: n + d, why: 'Add up the letters carefully: ' + ROM[n] + ': ' + BUILD[n] + '.' }); });
    return out;
  }
  const FULL = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12], EASY = [1, 2, 3, 5, 6, 7, 8, 10, 11, 12];

  function numeralToNumber(vals, hard){
    const n = pick(vals), shown = ROM[n];
    const wr = numeralWrongs(n).filter(function(w){ return w.v >= 1 && w.v <= 12; });
    return mcqNum({
      prompt: 'Which number is the Roman numeral ' + shown + '?', answer: n, wrong: wr, valid: function(v){ return v >= 1 && v <= 12; }, nearby: [1, -1, 2, -2, 3, -3, 4, 5],
      hint: 'I = 1, V = 5, X = 10. A small letter AFTER a big one adds; a small letter BEFORE a big one takes away.',
      explain: ex(shown + ' as a number', [shown + ' is made of the letters ' + shown.split('').join(', ') + '.', shown + ': ' + BUILD[n] + '.', 'So ' + shown + ' is <b>' + n + '</b>. ✅']),
      truth: parseRoman(shown)
    });
  }
  function numberToNumeral(vals, cnt){
    const n = pick(vals);
    const ds = [];
    if(SW[n]) ds.push({ v: SW[n], why: ROM[SW[n]] + ' is ' + SW[n] + '. For ' + n + ' you need ' + ROM[n] + ': ' + BUILD[n] + '.' });
    [-1, 1, -2, 2, 3, -3].forEach(function(d){ ds.push({ v: n + d, why: ROM[n + d] + ' is ' + (n + d) + ', not ' + n + '.' }); });
    FULL.forEach(function(v){ ds.push({ v: v, why: ROM[v] + ' is ' + v + ', not ' + n + '.' }); });
    return mcq({
      prompt: 'Which Roman numeral means ' + n + '?',
      correct: opt(K.num(n), ROM[n]), distractors: ds.filter(function(w){ return w.v >= 1 && w.v <= 12; }).map(function(w){ return opt(K.num(w.v), ROM[w.v], w.why); }), keepOrder: true, count: cnt,
      hint: 'Build it from I (1), V (5) and X (10). Count how many you need to make ' + n + '.',
      explain: ex('Writing ' + n + ' in Roman numerals', [(n === 1 || n === 5 || n === 10) ? n + ' is one of the three building blocks: I = 1, V = 5, X = 10.' : n + ' = ' + MAKE[n] + '.', n + ' is built as ' + ROM[n].split('').join(' ') + '.', 'The Roman numeral for ' + n + ' is <b>' + ROM[n] + '</b>. ✅']),
      truth: K.num(parseRoman(ROM[n]))
    });
  }

  registerSkill({
    id: 'time-roman', strand: 'time', name: 'Roman numeral clocks', emoji: '🏛️', year: 3, order: 540, prereq: ['time-quarters'],
    lesson: {
      title: 'Clocks with Roman numerals',
      steps: [
        { say: 'Some old clocks use <b>Roman numerals</b> instead of 1, 2, 3. There are only three building blocks: <b>I = 1</b>, <b>V = 5</b> and <b>X = 10</b>.', vis: { kind: 'clock', args: [3, 0, { roman: true }] } },
        { say: 'Small letters <b>after</b> a big one are <b>added</b>: VI = 5 + 1 = 6, VII = 7, XI = 10 + 1 = 11. Small letters <b>before</b> a big one are <b>taken away</b>: <b>IV</b> = 5 − 1 = 4 and <b>IX</b> = 10 − 1 = 9.', vis: { kind: 'clock', args: [4, 0, { roman: true }] } },
        { say: 'Reading the clock is the same as always. The short hand is on <b>VII</b> and the long hand points to <b>VI</b> (6). VI is the 6, so that is 30 minutes. It is <b>7:30</b>, half past 7.', vis: { kind: 'clock', args: [7, 30, { roman: true }] } },
        { say: 'Here the long hand is on <b>IX</b> (9). 9 × 5 = 45 minutes, so it is quarter to the next hour. The short hand is nearly at XII: it is <b>11:45</b>.', vis: { kind: 'clock', args: [11, 45, { roman: true }] },
          quiz: { prompt: 'The long hand points to IV. How many minutes past the hour is that?', options: [{ label: '20 minutes', ok: true }, { label: '30 minutes', ok: false }, { label: '4 minutes', ok: false }], right: 'Yes! IV is 4, and 4 × 5 = 20 minutes.', wrong: 'IV is 4 (5 − 1). Each number is worth 5 minutes: 4 × 5 = 20 minutes.' } }
      ]
    },
    trick: {
      title: 'I, V, X: small before = take away',
      say: 'Only learn <b>I = 1, V = 5, X = 10</b>. Then ask: is the small letter <b>before</b> or <b>after</b>? <b>After</b> means add (VI = 6). <b>Before</b> means take away (IV = 4). Remember: IV has the I in front, so it is one LESS than V.',
      vis: { kind: 'clock', args: [4, 20, { roman: true }] },
      example: '<b>IV</b> = 5 − 1 = 4 and <b>VI</b> = 5 + 1 = 6. <b>IX</b> = 10 − 1 = 9 and <b>XI</b> = 10 + 1 = 11.'
    },
    gen: {
      1: function(){
        const f = randInt(0, 3);
        if(f === 0 || f === 1){
          const h = randInt(1, 12), m = pick([0, 30]), vis = rc(h, m);
          return mcq({
            prompt: 'This clock uses Roman numerals. What time is it?', visual: vis,
            correct: opt(K.time(h, m), dig(h, m)), distractors: toOpts(wrongs(h, m, false)), keepOrder: true, count: 3,
            hint: 'Short hand = hour, long hand = minutes. Change the Roman numeral into a number first.',
            explain: explainRead(h, m),
            truth: K.time(h, m), decode: function(){ return ck(vis); }
          });
        }
        if(f === 2) return numeralToNumber(EASY, false);
        return numberToNumeral([2, 3, 5, 6, 7, 8, 10, 11, 12], 3);
      },
      2: function(){
        const f = randInt(0, 4);
        if(f === 0 || f === 1){
          const h = randInt(1, 12), m = pick([0, 5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 55]), vis = rc(h, m);
          return mcq({
            prompt: 'What time does this Roman numeral clock show?', visual: vis,
            correct: opt(K.time(h, m), dig(h, m)), distractors: toOpts(wrongs(h, m, false)), keepOrder: true,
            hint: 'Turn the numeral under the long hand into a number, then count in 5s. The short hand gives the hour.',
            explain: explainRead(h, m),
            truth: K.time(h, m), decode: function(){ return ck(vis); }
          });
        }
        if(f === 2) return numeralToNumber(FULL, false);
        if(f === 3) return numberToNumeral(FULL, 4);
        const h = randInt(1, 12), n = randInt(1, 11), m = n * 5, vis = rc(h, m);
        return mcqNum({
          prompt: 'The long hand is on the numeral ' + ROM[n] + '. How many minutes past the hour is it?', visual: vis, answer: m, fmt: function(v){ return v + (v === 1 ? ' minute' : ' minutes'); },
          wrong: [{ v: n, why: n + ' is the NUMBER on the clock. Each number is worth 5 minutes, so multiply by 5.' }, { v: 60 - m, why: 'That is the minutes still TO go. We want the minutes PAST the hour.' }],
          valid: function(v){ return v > 0 && v < 60; }, nearby: [5, -5, 10, -10, 15],
          hint: ROM[n] + ' is a number from 1 to 12. Change it into a number, then count in 5s.',
          explain: ex('Minutes from a numeral', [ROM[n] + ': ' + BUILD[n] + ' = ' + n + '.', n + ' × 5 = <b>' + m + '</b>.', 'It is <b>' + m + ' minutes</b> past the hour. ✅']),
          truth: parseRoman(ROM[n]) * 5, decode: function(){ return V.decodeClock(vis).m; }
        });
      },
      3: function(){
        const f = randInt(0, 6);
        if(f === 0 || f === 1){
          const h = pick([4, 6, 9, 11, 3, 5, 7, 8, 10, 12, 1, 2, 4, 6, 9, 11]), m = pick([20, 30, 45, 55, 0, 5, 10, 15, 25, 35, 40, 50, 20, 30, 45, 55]), vis = rc(h, m);
          return mcq({
            prompt: 'What time does this Roman numeral clock show?', visual: vis,
            correct: opt(K.time(h, m), dig(h, m)), distractors: toOpts(wrongs(h, m, true)), keepOrder: true,
            hint: 'Watch out for IV and VI, and for IX and XI! Work out each numeral as a number before you answer.',
            explain: explainRead(h, m),
            truth: K.time(h, m), decode: function(){ return ck(vis); }
          });
        }
        if(f === 2){
          const n = pick([4, 6, 9, 11]), h = randInt(1, 12), m = n * 5, vis = rc(h, m);
          return numeric({
            prompt: 'The long hand is on ' + ROM[n] + '. How many minutes past the hour is it? Type the number.', visual: vis, answer: m, unit: 'minutes',
            hint: 'Change ' + ROM[n] + ' into a number first (is the I before or after?). Then multiply by 5.',
            explain: ex('Minutes from ' + ROM[n], [ROM[n] + ': ' + BUILD[n] + ' = ' + n + '.', n + ' × 5 = <b>' + m + '</b>.', 'It is <b>' + m + '</b> minutes past the hour. ✅']),
            truth: parseRoman(ROM[n]) * 5, decode: function(){ return V.decodeClock(vis).m; },
            wrong: function(v){ return v === SW[n] * 5 ? ROM[n] + ' is ' + n + ', not ' + SW[n] + '. Look at where the I is.' : (v === n ? 'That is the number; each number is 5 minutes, so multiply by 5.' : ''); }
          });
        }
        if(f === 3){
          const n = pick([4, 6, 9, 11, 4, 6, 9, 11, 7, 8, 12]);
          return pick([0, 1]) ? numeralToNumber(FULL, true) : numberToNumeral([4, 6, 9, 11, 7, 8], 4);
        }
        if(f === 4){
          const h = pick([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12]), m = pick([5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 55, 0]);
          const wr = wrongs(h, m, true).map(function(w){ return opt(K.time(w.h, w.m), rc(w.h, w.m, true), 'That clock shows ' + dig(w.h, w.m) + '. ' + w.why); });
          const q = mcq({
            prompt: 'Which Roman numeral clock shows ' + dig(h, m) + '?', visual: '',
            correct: opt(K.time(h, m), rc(h, m, true)), distractors: wr, keepOrder: true, count: 3,
            hint: 'Short hand: ' + ROM[h] + ' is ' + h + '. Long hand: ' + m + ' minutes is the number ' + (m / 5 || 12) + '. Which numeral is that?',
            explain: ex('Finding ' + dig(h, m), [dig(h, m) + ': the hour is ' + h + ' and the minutes are ' + m + '.', 'The short hand is on or near <b>' + ROM[h] + '</b>. The long hand points to <b>' + ROM[m / 5 || 12] + '</b> (' + (m / 5 || 12) + ' × 5 = ' + (m || 60) + ').', 'Only one clock matches <b>' + dig(h, m) + '</b>. ✅']),
            truth: K.time(parseInt(dig(h, m), 10), +dig(h, m).split(':')[1])
          });
          return visualOpts(q);
        }
        if(f === 5){
          const vals = sample([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12], 4).sort(function(a, b){ return a - b; });
          const items = vals.map(function(v){ return { key: 'v' + v, label: ROM[v] }; });
          const sorted = vals.slice().sort(function(a, b){ return a - b; });
          return order({
            prompt: 'Put these Roman numerals in order, smallest first.', items: items,
            hint: 'Turn each numeral into a number first. IV and IX are smaller than you might think!',
            explain: ex('Ordering numerals', [vals.map(function(v){ return ROM[v] + ' = ' + v; }).join(', ') + '.', 'Smallest to largest: ' + vals.join(', ') + '.', 'So the order is ' + vals.map(function(v){ return ROM[v]; }).join(', ') + '. ✅']),
            truth: 'o:' + sorted.map(function(v){ return 'v' + v; }).join('|')
          });
        }
        // typed sum
        let a, b;
        do { a = pick([4, 6, 9, 11, 5, 7, 3, 2, 8]); b = pick([4, 6, 9, 2, 3, 5, 1, 8]); } while(a + b > 20 || (a !== 4 && a !== 9 && b !== 4 && b !== 9 && a !== 6 && a !== 11 && b !== 6 && b !== 11));
        return numeric({
          prompt: 'Work it out and type the answer: ' + ROM[a] + ' + ' + ROM[b] + ' = ?', visual: '', answer: a + b,
          hint: 'Change each Roman numeral into a number first, then add.',
          explain: ex('Adding Roman numerals', [ROM[a] + ' = ' + a + ' (' + BUILD[a] + ').', ROM[b] + ' = ' + b + ' (' + BUILD[b] + ').', a + ' + ' + b + ' = <b>' + (a + b) + '</b>. ✅']),
          truth: parseRoman(ROM[a]) + parseRoman(ROM[b]),
          wrong: function(v){ return (v === (SW[a] || a) + (SW[b] || b)) ? 'Check IV / VI and IX / XI — the I before a big letter takes away.' : ''; }
        });
      }
    }
  });
})();
