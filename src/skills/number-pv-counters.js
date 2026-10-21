/* number-pv-counters — place value counters on a chart (Hundreds | Tens | Ones): read, build, exchange, zero as placeholder. */
(function(){
  const NAMES = ['Ana', 'Marcus', 'Sophie', 'Ivan', 'Lucy', 'Diego', 'Ellen', 'Tom', 'Aisha', 'Kai', 'Mei', 'Leo'];
  const COL = [{ cls: 'c100', name: 'Hundreds', short: 'H', val: 100, fill: '#8EC5FF' }, { cls: 'c10', name: 'Tens', short: 'T', val: 10, fill: '#C9A7F2' }, { cls: 'c1', name: 'Ones', short: 'O', val: 1, fill: '#FFD479' }];
  /* every counter is <circle class="c100|c10|c1" data-v="100|10|1">; decode = sum of the values of the counters drawn */
  function render(h, t, o){
    const cnt = [h, t, o], rows = Math.max(1, Math.ceil(Math.max(h, t, o) / 3)), cw = 96, ch = 24 + rows * 30 + 8;
    let s = '';
    COL.forEach(function(c, k){
      const x0 = 8 + k * cw;
      s += '<rect x="' + x0 + '" y="4" width="' + (cw - 6) + '" height="' + (ch + 20) + '" rx="8" fill="#F6F7FD" stroke="#1B1B2F" stroke-width="2"/><text x="' + (x0 + (cw - 6) / 2) + '" y="22" text-anchor="middle" font-size="14" font-weight="800" fill="#1B1B2F">' + c.name + '</text>';
      for(let i = 0; i < cnt[k]; i++){
        const cx = x0 + 20 + (i % 3) * 28, cy = 48 + Math.floor(i / 3) * 30;
        s += '<circle class="' + c.cls + '" data-v="' + c.val + '" cx="' + cx + '" cy="' + cy + '" r="12" fill="' + c.fill + '" stroke="#1B1B2F" stroke-width="2"/><text x="' + cx + '" y="' + (cy + 4) + '" text-anchor="middle" font-size="10" font-weight="800" fill="#1B1B2F">' + c.val + '</text>';
      }
    });
    return '<svg viewBox="0 0 ' + (8 + 3 * cw) + ' ' + (ch + 28) + '" width="300" role="img" style="max-width:100%;height:auto;display:block;margin:0 auto" xmlns="http://www.w3.org/2000/svg" font-family="-apple-system,Segoe UI,Roboto,Arial,sans-serif">' + s + '</svg>';
  }
  function decode(html){ const re = /<circle class="c(?:100|10|1)" data-v="(\d+)"/g; let m, t = 0; while((m = re.exec(html))) t += Number(m[1]); return t; }
  function countIn(html, cls){ return (html.match(new RegExp('<circle class="' + cls + '"', 'g')) || []).length; }
  V.extra.counters = { render: render, verify: function(a, html){ return decode(html) === a[0] * 100 + a[1] * 10 + a[2] ? '' : 'counters draw ' + decode(html); } };
  function times(a, b){ let s = 0; for(let i = 0; i < b; i++) s += a; return s; }
  function digits(n){ return [Math.floor(n / 100), Math.floor(n / 10) % 10, n % 10]; }

  /* ---- tier 1 ---- */
  function qRead(){
    const h = randInt(1, 6), t = randInt(1, 6), o = randInt(1, 6), n = h * 100 + t * 10 + o, vis = render(h, t, o);
    return mcqNum({ prompt: 'Which number do the counters show?', visual: vis, answer: n,
      wrong: [{ v: o * 100 + t * 10 + h, why: 'The columns are Hundreds, Tens, Ones from LEFT to right. Check which column each group is in.' }, { v: h * 100 + o * 10 + t, why: 'The tens column is the middle one.' }, { v: h + t + o, why: h + t + o + ' is the number of counters. Each counter has a value: ' + h + ' hundreds, ' + t + ' tens, ' + o + ' ones.' }, { v: n + 10, why: 'Count the counters in each column again.' }],
      nearby: [1, -1, 10, -10, 100, -100], valid: function(v){ return v > 0 && v < 1000; }, count: 4, hint: 'Count the counters in each column and say what each column is worth.',
      explain: ex('Reading counters', [h + ' hundreds counters = ' + h * 100 + '.', t + ' tens counters = ' + t * 10 + '.', o + ' ones counters = ' + o + '.', h * 100 + ' + ' + t * 10 + ' + ' + o + ' = <b>' + n + '</b>. ✅']), truth: h * 100 + t * 10 + o, decode: function(){ return decode(vis); } });
  }
  function qCountColumn(){
    const h = randInt(1, 6), t = randInt(1, 6), o = randInt(1, 6), vis = render(h, t, o), k = randInt(0, 2), nm = COL[k].name.toLowerCase(), ans = [h, t, o][k];
    return mcqNum({ prompt: 'How many <b>' + nm + '</b> counters are on the chart?', visual: vis, answer: ans,
      wrong: [{ v: [h, t, o][(k + 1) % 3], why: 'That is the number in a different column. Look at the ' + COL[k].name + ' column.' }, { v: ans * COL[k].val, why: 'That is the VALUE of those counters. The question asks how many counters.' }, { v: h + t + o, why: 'That is every counter. Count only the ' + nm + ' column.' }],
      nearby: [1, -1, 2], valid: function(v){ return v > 0; }, count: 3, hint: 'Look at the ' + COL[k].name + ' column only and count its counters.',
      explain: ex('Counting one column', ['The ' + COL[k].name + ' column has <b>' + ans + '</b> counters. ✅']), truth: countIn(vis, COL[k].cls), decode: function(){ return countIn(vis, COL[k].cls); } });
  }
  function qValueColumn(){
    const h = randInt(1, 5), t = randInt(1, 5), o = randInt(1, 5), vis = render(h, t, o), k = randInt(0, 1), ans = [h, t, o][k] * COL[k].val;
    return mcqNum({ prompt: 'What is the <b>total value</b> of the ' + COL[k].name.toLowerCase() + ' counters?', visual: vis, answer: ans,
      wrong: [{ v: [h, t, o][k], why: 'That is how many counters there are. Each ' + COL[k].name.toLowerCase().slice(0, -1) + ' counter is worth ' + COL[k].val + '.' }, { v: [h, t, o][k] * COL[(k + 1) % 3].val, why: 'Check the value of one counter in this column: ' + COL[k].val + '.' }, { v: ans + COL[k].val, why: 'Count the counters again.' }],
      nearby: [10, -10, 100], valid: function(v){ return v > 0; }, count: 4, hint: 'Each counter in this column is worth ' + COL[k].val + '. Count them and multiply.',
      explain: ex('Value of a column', [[h, t, o][k] + ' counters × ' + COL[k].val + ' = <b>' + ans + '</b>. ✅']), truth: times(COL[k].val, countIn(vis, COL[k].cls)), decode: function(){ return times(COL[k].val, countIn(vis, COL[k].cls)); } });
  }
  /* ---- tier 2: zero and exchange ---- */
  function qZero(){
    const h = randInt(1, 8), o = randInt(1, 8), t = 0, n = h * 100 + o, vis = render(h, t, o);
    return mcqNum({ prompt: 'Which number do the counters show? (An empty column means <b>0</b>.)', visual: vis, answer: n,
      wrong: [{ v: h * 10 + o, why: 'The tens column is empty, so there is a 0 in the tens place: ' + n + '.' }, { v: o * 100 + h, why: 'Hundreds are on the left.' }, { v: h * 100 + o * 10, why: 'The ones counters are worth ' + o + ', not ' + o * 10 + '.' }, { v: n + 100, why: 'Count the hundreds counters again.' }],
      nearby: [1, -1, 10, 100], valid: function(v){ return v > 0 && v < 1000; }, count: 4, hint: 'A column with no counters is worth 0. Write 0 in that place.',
      explain: ex('Zero as a placeholder', [h + ' hundreds, <b>0 tens</b>, ' + o + ' ones.', 'The 0 holds the tens place: <b>' + n + '</b>. ✅']), truth: h * 100 + o, decode: function(){ return decode(vis); } });
  }
  function qExchange(){
    const kind = randInt(0, 1), t = kind === 0 ? randInt(1, 6) : randInt(11, 14) - 10, o = 10 + randInt(0, 4), h = randInt(1, 5), n = h * 100 + t * 10 + o;
    /* picture: 10+ ones counters in the ones column: exchange 10 ones for 1 ten */
    const vis = render(h, t, o), ones = o;
    const newT = t + 1, newO = o - 10;
    return mcqNum({ prompt: 'There are ' + ones + ' ones counters, which is too many for one column. Swap <b>10 ones</b> for <b>1 ten</b>. How many tens counters are there <b>now</b>?', visual: vis, answer: newT,
      wrong: [{ v: t, why: 'That is the number before the swap. Swapping 10 ones gives one more ten.' }, { v: newT + 1, why: 'Swap 10 ones for ONE ten counter, so tens go up by 1 only.' }, { v: ones, why: ones + ' is the number of ones counters.' }, { v: newO > 0 ? newO : newT + 2, why: 'That is how many ones are left. We want the number of tens.' }],
      nearby: [1, -1, 2], valid: function(v){ return v >= 0; }, count: 4, hint: '10 ones = 1 ten. Take 10 ones away and put 1 ten in the tens column.',
      explain: ex('Exchanging', ['10 ones = 1 ten.', 'Take away 10 ones: ' + ones + ' − 10 = ' + newO + ' ones left.', 'Tens: ' + t + ' + 1 = <b>' + newT + '</b>. The number is still ' + n + '. ✅']), truth: t + Math.floor(ones / 10), decode: function(){ return countIn(vis, 'c10') + Math.floor(countIn(vis, 'c1') / 10); } });
  }
  function qMake(){
    const n = (function(){ let x; do { x = randInt(120, 890); } while(x % 10 === 0 || Math.floor(x / 100) === Math.floor(x / 10) % 10); return x; })(), d = digits(n), k = randInt(0, 2), nm = COL[k].name.toLowerCase();
    return mcqNum({ prompt: 'To make <b>' + n + '</b> with counters, how many <b>' + nm + '</b> counters do you need?', answer: d[k],
      wrong: [{ v: d[(k + 1) % 3], why: 'That is the digit in another place.' }, { v: d[(k + 2) % 3], why: 'That is the digit in another place.' }, { v: d[k] * COL[k].val, why: 'That is the value, not the number of counters.' }],
      nearby: [1, -1, 2], valid: function(v){ return v >= 0; }, count: 4, hint: 'Look at the digit in the ' + nm + ' place of ' + n + '.',
      explain: ex('Making a number', [n + ' = ' + d[0] + ' hundreds, ' + d[1] + ' tens, ' + d[2] + ' ones.', 'So you need <b>' + d[k] + '</b> ' + nm + ' counters. ✅']), truth: digits(n)[k] });
  }
  /* ---- tier 3 ---- */
  function qTypedRead(){
    const h = randInt(1, 9), t = randInt(0, 9), o = randInt(0, 9), vis = render(h, t, o), n = h * 100 + t * 10 + o;
    return numeric({ prompt: 'Type the number shown by the counters.', visual: vis, answer: n, hint: 'Hundreds, then tens, then ones. An empty column is 0.',
      explain: ex('Reading counters', [h + ' hundreds, ' + t + ' tens, ' + o + ' ones.', h * 100 + ' + ' + t * 10 + ' + ' + o + ' = <b>' + n + '</b>. ✅']), truth: h * 100 + t * 10 + o, decode: function(){ return decode(vis); },
      wrong: function(v){ return v === h + t + o ? 'You counted the counters. Each one has a value: add the VALUES.' : ''; } });
  }
  function qHowManyMore(){
    const h = randInt(2, 7), t = randInt(1, 8), o = randInt(1, 8), vis = render(h, t, o), n = h * 100 + t * 10 + o, add = pick([10, 100, 1]), nm = add === 10 ? 'tens' : add === 100 ? 'hundreds' : 'ones';
    return numeric({ prompt: 'Add <b>1 more ' + nm.slice(0, -1) + ' counter</b> (worth ' + add + ') to the chart. What number is shown now?', visual: vis, answer: n + add, hint: 'Which column changes? The number goes up by ' + add + '.',
      explain: ex('One more counter', ['A ' + nm.slice(0, -1) + ' counter is worth ' + add + '.', n + ' + ' + add + ' = <b>' + (n + add) + '</b>. ✅']), truth: decode(vis) + add, decode: function(){ return decode(vis) + add; } });
  }
  function qWord(){
    const who = pick(NAMES), h = randInt(1, 9), t = randInt(1, 9), o = randInt(1, 9), n = h * 100 + t * 10 + o;
    return numeric({ prompt: who + ' used <b>' + h + '</b> hundreds counters, <b>' + t + '</b> tens counters and <b>' + o + '</b> ones counters. What number did ' + who + ' make? Type it.', answer: n, hint: 'Each hundreds counter is 100, each tens counter is 10 and each ones counter is 1.',
      explain: ex('Counters to a number', [h + ' × 100 = ' + h * 100 + ', ' + t + ' × 10 = ' + t * 10 + ', ' + o + ' × 1 = ' + o + '.', 'Together: <b>' + n + '</b>. ✅']), truth: times(100, h) + times(10, t) + o,
      wrong: function(v){ return v === h + t + o ? 'You added the counters. Add their VALUES.' : ''; } });
  }
  function qExchangeTyped(){
    const t = randInt(12, 25), n = t * 10, hundreds = Math.floor(t / 10), left = t % 10;
    return numeric({ prompt: 'You have <b>' + t + ' tens counters</b>. You swap every group of 10 tens for a hundreds counter. How many <b>hundreds</b> counters do you get? Type the number.', answer: hundreds, hint: '10 tens = 1 hundred. How many groups of 10 tens are in ' + t + '?',
      explain: ex('Exchanging tens for hundreds', ['10 tens = 1 hundred.', t + ' tens: <b>' + hundreds + '</b> group' + (hundreds > 1 ? 's' : '') + ' of 10, with ' + left + ' tens left.', n + ' = ' + hundreds + ' hundred' + (hundreds > 1 ? 's' : '') + ' and ' + left + ' tens. ✅']), truth: (function(){ let g = 0, x = t; while(x >= 10){ x -= 10; g++; } return g; })() });
  }
  const L1 = render(2, 3, 4), L2 = render(1, 0, 6), L3 = render(2, 1, 12);
  registerSkill({
    id: 'number-pv-counters', strand: 'number', name: 'Place value counters', emoji: '🔴', year: 3, order: 12, prereq: [],
    lesson: { title: 'Counters on a place value chart', steps: [
      { say: 'A place value chart has columns: <b>Hundreds, Tens, Ones</b>. A counter in the hundreds column is worth <b>100</b>, in the tens <b>10</b>, in the ones <b>1</b>. This shows 200 + 30 + 4 = <b>234</b>.', vis: { kind: 'counters', args: [2, 3, 4] } },
      { say: 'An <b>empty column is 0</b>. This chart has 1 hundred, 0 tens and 6 ones: that is <b>106</b>. The 0 keeps the 6 in the ones place.', vis: { kind: 'counters', args: [1, 0, 6] },
        quiz: { prompt: 'What number has 3 hundreds, 0 tens and 5 ones?', options: [{ label: '305', ok: true }, { label: '35', ok: false }, { label: '350', ok: false }], right: 'Yes! The 0 holds the tens place.', wrong: '3 hundreds, 0 tens, 5 ones is 305.' } },
      { say: 'When a column has <b>10 counters</b>, swap them for <b>1 counter</b> in the next column to the left. 12 ones can become 1 ten and 2 ones. The number stays the same: 210 + 12 = 222.', vis: { kind: 'counters', args: [2, 1, 12] },
        quiz: { prompt: '10 ones counters can be swapped for how many tens counters?', options: [{ label: '1', ok: true }, { label: '10', ok: false }, { label: '100', ok: false }], right: 'Yes! 10 ones = 1 ten.', wrong: '10 ones is worth 10, which is the same as 1 ten counter.' } }
    ] },
    trick: { title: 'Ten in a column? Swap left!', say: 'Each counter is worth its <b>column</b>: 100, 10 or 1. <b>Empty column = 0.</b> When you have <b>10 counters</b> in a column, swap them for <b>1 counter</b> in the column on the left.', vis: { kind: 'counters', args: [1, 4, 7] }, example: '1 hundred + 4 tens + 7 ones = 100 + 40 + 7 = <b>147</b>' },
    gen: {
      1: function(){ return pick([qRead, qRead, qCountColumn, qValueColumn])(); },
      2: function(){ return pick([qZero, qZero, qExchange, qMake, qRead, qValueColumn])(); },
      3: function(){ return pick([qTypedRead, qTypedRead, qHowManyMore, qWord, qExchangeTyped])(); }
    }
  });
})();
