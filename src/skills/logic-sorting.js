/* LOGIC 2 — Sorting and classifying. Odd/even, multiples of 2/5/10, odd one out (exactly one item fails/passes the
   rule — checked on every item), Carroll diagrams as HTML tables (layout rule-checked and re-read from the HTML),
   shape sorting (decoded from the drawn polygons). */
(function(){
  const INK = 'var(--vis-ink,#1B1B2F)';
  function attr(tag, name){ const m = new RegExp(' ' + name + '="([^"]*)"').exec(tag); return m ? m[1] : null; }
  function cap(s){ return s.charAt(0).toUpperCase() + s.slice(1); }

  /* ------------------------------------------------------------ the rule library */
  const R = {
    even: { label: 'even', comp: 'odd', fn: function(n){ return n % 2 === 0; }, how: 'Even numbers end in 0, 2, 4, 6 or 8.' },
    odd: { label: 'odd', comp: 'even', fn: function(n){ return n % 2 === 1; }, how: 'Odd numbers end in 1, 3, 5, 7 or 9.' },
    m5: { label: 'a multiple of 5', comp: 'nm5', fn: function(n){ return n % 5 === 0; }, how: 'Multiples of 5 end in 0 or 5.' },
    nm5: { label: 'not a multiple of 5', comp: 'm5', fn: function(n){ return n % 5 !== 0; }, how: 'Multiples of 5 end in 0 or 5.' },
    m10: { label: 'a multiple of 10', comp: 'nm10', fn: function(n){ return n % 10 === 0; }, how: 'Multiples of 10 end in 0.' },
    nm10: { label: 'not a multiple of 10', comp: 'm10', fn: function(n){ return n % 10 !== 0; }, how: 'Multiples of 10 end in 0.' },
    m3: { label: 'in the 3 times table', comp: 'nm3', fn: function(n){ return n % 3 === 0; }, how: 'Count in 3s to check: 3, 6, 9, 12, 15, 18, 21, 24, 27, 30, 33, 36.' },
    nm3: { label: 'not in the 3 times table', comp: 'm3', fn: function(n){ return n % 3 !== 0; }, how: 'Count in 3s to check: 3, 6, 9, 12, 15, 18, 21, 24, 27, 30, 33, 36.' },
    m4: { label: 'in the 4 times table', comp: 'nm4', fn: function(n){ return n % 4 === 0; }, how: 'Count in 4s to check: 4, 8, 12, 16, 20, 24, 28, 32, 36, 40, 44, 48.' },
    nm4: { label: 'not in the 4 times table', comp: 'm4', fn: function(n){ return n % 4 !== 0; }, how: 'Count in 4s to check: 4, 8, 12, 16, 20, 24, 28, 32, 36, 40, 44, 48.' },
    gt50: { label: 'more than 50', comp: 'le50', fn: function(n){ return n > 50; }, how: 'Is it bigger than 50? 51 is, 50 is not.' },
    le50: { label: '50 or less', comp: 'gt50', fn: function(n){ return n <= 50; }, how: 'Is it bigger than 50? 51 is, 50 is not.' }
  };
  const AXES = { par: ['even', 'odd'], m5: ['m5', 'nm5'], m10: ['m10', 'nm10'], big: ['gt50', 'le50'] };
  const AXPAIRS = [['par', 'm5'], ['par', 'big'], ['m5', 'big'], ['m10', 'big']];
  function sat(id, n){ return R[id].fn(n); }
  function failWhy(n, id){ return n + ' is ' + R[R[id].comp].label + ', so it does not go under "' + cap(R[id].label) + '".'; }
  function asks(n, id){ return 'Is ' + n + ' ' + R[id].label + '? ' + (sat(id, n) ? 'Yes ✅' : 'No ❌'); }

  /* ------------------------------------------------------------ pictures: number cards */
  function cardsHTML(nums){
    return '<div class="ncards" style="display:flex;flex-wrap:wrap;gap:8px;justify-content:center">' + nums.map(function(n, i){
      return '<span class="ncd" style="min-width:48px;padding:8px 8px;text-align:center;font:900 22px system-ui;border:3px solid ' + INK + ';border-radius:10px;background:' + ['#CFE1FF', '#E6D4FF', '#FFF3C4'][i % 3] + ';color:' + INK + '">' + n + '</span>';
    }).join('') + '</div>';
  }
  function decodeCards(html){ const re = /<span class="ncd"[^>]*>(\d+)<\/span>/g, o = []; let m; while((m = re.exec(html))) o.push(parseInt(m[1], 10)); return o; }
  V.extra.lgCards = {
    render: function(nums){ return cardsHTML(nums); },
    verify: function(args, html){ return JSON.stringify(decodeCards(html)) === JSON.stringify(args[0]) ? '' : 'cards mismatch'; }
  };

  /* ------------------------------------------------------------ pictures: Carroll diagram (HTML table)
     cols: [ruleA, ruleB]; rows: [ruleC, ruleD] or null (one-row table). cells[r+'|'+c] = numbers. hole: cell key | null. card: number | null */
  function carrollHTML(o){
    const cs = o.cols, rs = o.rows;
    const tdStyle = 'border:3px solid ' + INK + ';padding:8px 6px;text-align:center;min-width:104px;height:54px;background:#fff';
    const thStyle = 'border:3px solid ' + INK + ';padding:6px 6px;background:#EEF1FB;font-weight:900;font-size:15px';
    let s = '';
    if(o.card !== undefined && o.card !== null) s += '<div style="text-align:center;margin-bottom:8px;font-weight:800;color:' + INK + '">The new number is <span class="cardn" style="display:inline-block;min-width:48px;padding:6px 10px;border:3px solid ' + INK + ';border-radius:10px;background:#FFF3C4;font:900 22px system-ui">' + o.card + '</span></div>';
    s += '<table class="carroll" style="border-collapse:collapse;margin:0 auto;color:' + INK + '"><tr><th style="' + thStyle + ';border-color:transparent;background:transparent"></th>';
    cs.forEach(function(c){ s += '<th class="ch" data-rule="' + c + '" style="' + thStyle + '">' + cap(R[c].label) + '</th>'; });
    s += '</tr>';
    (rs || ['']).forEach(function(r){
      s += '<tr>' + (r ? '<th class="rh" data-rule="' + r + '" style="' + thStyle + '">' + cap(R[r].label) + '</th>' : '<th class="rh" data-rule="" style="' + thStyle + ';border-color:transparent;background:transparent"></th>');
      cs.forEach(function(c){
        const key = r + '|' + c, nums = o.cells[key] || [];
        s += '<td class="cc" data-r="' + r + '" data-c="' + c + '" style="' + tdStyle + '">';
        if(o.hole === key) s += '<span class="cn hole" style="font:900 24px system-ui;color:#EB5757">?</span>';
        else s += nums.map(function(n){ return '<span class="cn" style="display:inline-block;margin:2px 5px;font:800 20px system-ui">' + n + '</span>'; }).join('');
        s += '</td>';
      });
      s += '</tr>';
    });
    return s + '</table>';
  }
  function parseCarroll(html){
    const out = { cells: [], card: null };
    const cm = /<span class="cardn"[^>]*>(\d+)<\/span>/.exec(html); if(cm) out.card = parseInt(cm[1], 10);
    const re = /<td class="cc" data-r="(\w*)" data-c="(\w+)"[^>]*>([\s\S]*?)<\/td>/g; let m;
    while((m = re.exec(html))){
      const nums = [], hole = /class="cn hole"/.test(m[3]); const nr = /<span class="cn"[^>]*>(\d+)<\/span>/g; let k;
      while((k = nr.exec(m[3]))) nums.push(parseInt(k[1], 10));
      out.cells.push({ r: m[1], c: m[2], nums: nums, hole: hole });
    }
    return out;
  }
  function inCell(cell, n){ return (cell.r === '' || sat(cell.r, n)) && sat(cell.c, n); }
  function cellKey(r, c){ return r + '|' + c; }
  function cellText(r, c){ return r ? cap(R[r].label) + ' and ' + R[c].label : cap(R[c].label); }
  /* rule-check of the whole layout: every number sits in a cell whose rules it satisfies */
  V.extra.lgCarroll = {
    render: function(o){ return carrollHTML(o); },
    verify: function(args, html){ const p = parseCarroll(html); for(let i = 0; i < p.cells.length; i++) for(let j = 0; j < p.cells[i].nums.length; j++) if(!inCell(p.cells[i], p.cells[i].nums[j])) return 'number ' + p.cells[i].nums[j] + ' is in the wrong box'; return ''; }
  };

  /* ------------------------------------------------------------ numbers helpers */
  function range(a, b){ const o = []; for(let i = a; i <= b; i++) o.push(i); return o; }
  function pool(max, f){ return range(1, max).filter(f); }

  /* "Which of these is [not] <rule>?"  — evaluates the rule on every option */
  function listQ(o){
    for(let tries = 0; tries < 60; tries++){
      const id = pick(o.rules), rule = R[id], max = Math.min(o.max, rule.max || 99);
      const S = pool(max, function(n){ return sat(id, n); }), F = pool(max, function(n){ return !sat(id, n); });
      const form = o.form || pick(['not', 'is']);
      let nums, target;
      if(form === 'not'){ const f = pick(F); nums = sample(S, 3).concat([f]); target = f; }
      else { const s = pick(S); nums = sample(F, 3).concat([s]); target = s; }
      nums = shuffle(nums);
      if(new Set(nums).size !== 4) continue;
      // independent check on EVERY item
      const passing = nums.filter(function(n){ return sat(id, n); });
      if(form === 'not' ? (passing.length !== 3) : (passing.length !== 1)) continue;
      const vis = cardsHTML(nums);
      const label = rule.label.replace(/^a multiple/, 'a multiple');
      const prompt = form === 'not' ? 'Which of these numbers is NOT ' + label + '?' : 'Which of these numbers is ' + label + '?';
      const lines = nums.map(function(n){ return asks(n, id); });
      const q = mcq({
        prompt: prompt, visual: vis, count: o.count || 4,
        correct: opt(K.num(target), String(target)),
        distractors: nums.filter(function(n){ return n !== target; }).map(function(n){
          return opt(K.num(n), String(n), form === 'not' ? n + ' IS ' + label + ', so it belongs with the others. Look for the one that does not.' : n + ' is ' + R[rule.comp].label + ', not ' + label + '. ' + rule.how);
        }),
        hint: rule.how + ' Test every number.',
        explain: ex('Testing every number', [rule.how].concat(lines).concat(['So the answer is <b>' + target + '</b>. ✅'])),
        truth: K.num(form === 'not' ? nums.filter(function(n){ return !sat(id, n); })[0] : passing[0]),
        decode: function(){
          const got = decodeCards(vis); const pass = got.filter(function(n){ return rule.fn(n); }), fail = got.filter(function(n){ return !rule.fn(n); });
          return K.num(form === 'not' ? (fail.length === 1 ? fail[0] : -1) : (pass.length === 1 ? pass[0] : -1));
        }
      });
      return q;
    }
    throw new Error('listQ failed');
  }
  R.m3.max = 36; R.nm3.max = 99; R.m4.max = 48;

  /* Is it odd or even?  (dots in two columns: a leftover dot means odd) */
  function dotsParityQ(){
    const n = randInt(3, 19), vis = V.dots(n, { cols: 2 });
    const ans = n % 2 === 0 ? 'even' : 'odd';
    return mcq2({
      prompt: 'Is the number of dots odd or even?', visual: vis,
      correct: opt(K.text(ans), cap(ans)), other: opt(K.text(ans === 'even' ? 'odd' : 'even'), cap(ans === 'even' ? 'odd' : 'even'), ans === 'even' ? 'Every dot has a partner, so nothing is left over. That means EVEN.' : 'One dot has no partner. A number with one left over is ODD.'),
      hint: 'Look at the dots in two columns. Does every dot have a partner next to it?',
      explain: ex('Pairing up', [
        'The dots are in <b>pairs</b> (two columns). There are <b>' + n + '</b> dots.',
        n % 2 === 0 ? 'Every dot has a partner. Nothing is left over.' : 'One dot is left on its own with no partner.',
        'The answer is <b>' + cap(ans) + '</b>: ' + n + ' is ' + ans + '. ✅'
      ]),
      truth: K.text(n % 2 === 0 ? 'even' : 'odd'),
      decode: function(){ const c = V.decodeDots(vis); return K.text(c % 2 === 0 ? 'even' : 'odd'); }
    });
  }

  /* ------------------------------------------------------------ Carroll question builders */
  function makeLayout(o){ // o: {oneD, axes?, per, max}
    const pr = o.oneD ? null : pick(AXPAIRS);
    const colAx = o.oneD ? (o.ax || 'par') : pr[0], rowAx = o.oneD ? null : pr[1];
    const cols = AXES[colAx], rows = rowAx ? AXES[rowAx] : null;
    if(rows && chance(0.5)){ /* swap names of the two sets so row/column vary */ }
    const cells = {}, all = [];
    (rows || ['']).forEach(function(r){ cols.forEach(function(c){
      const cand = pool(o.max, function(n){ return (r === '' || sat(r, n)) && sat(c, n); });
      if(cand.length < o.per + 2) throw new Error('layout too small');
      cells[cellKey(r, c)] = sample(cand, o.per);
    }); });
    return { cols: cols, rows: rows, cells: cells, rowList: rows || [''] };
  }
  function carrollWhereQ(o){
    for(let tries = 0; tries < 60; tries++){
      let L; try { L = makeLayout(o); } catch(e){ continue; }
      const tr = pick(L.rowList), tc = pick(L.cols), tkey = cellKey(tr, tc);
      const cand = pool(o.max, function(n){ return (tr === '' || sat(tr, n)) && sat(tc, n) && L.cells[tkey].indexOf(n) < 0; });
      if(!cand.length) continue;
      const x = pick(cand);
      // exactly one cell accepts x
      let homes = 0; L.rowList.forEach(function(r){ L.cols.forEach(function(c){ if((r === '' || sat(r, x)) && sat(c, x)) homes++; }); });
      if(homes !== 1) continue;
      const vis = carrollHTML({ cols: L.cols, rows: L.rows, cells: L.cells, card: x });
      const ds = []; L.rowList.forEach(function(r){ L.cols.forEach(function(c){
        if(cellKey(r, c) === tkey) return;
        const why = (r !== '' && !sat(r, x) ? failWhy(x, r) + ' ' : '') + (!sat(c, x) ? failWhy(x, c) : '');
        ds.push(opt(cellKey(r, c), cellText(r, c), why || 'Check both headings.'));
      }); });
      const steps = [];
      L.cols.forEach(function(c){ steps.push(asks(x, c)); });
      if(L.rows) L.rows.forEach(function(r){ steps.push(asks(x, r)); });
      const q = mcq({
        prompt: 'Which box does the new number go in?', visual: vis, count: Math.min(4, 1 + ds.length),
        correct: opt(tkey, cellText(tr, tc)), distractors: ds, keepOrder: false,
        hint: 'Check the number against each heading, one at a time. It must match the heading across the top AND the one down the side.',
        explain: ex('Testing ' + x + ' against the headings', steps.concat(['So ' + x + ' goes in the box: <b>' + cellText(tr, tc) + '</b>. ✅'])),
        truth: tkey,
        decode: function(){
          const p = parseCarroll(vis), hits = p.cells.filter(function(cl){ return inCell(cl, p.card); });
          return hits.length === 1 ? cellKey(hits[0].r, hits[0].c) : 'none';
        }
      });
      return q;
    }
    throw new Error('carrollWhereQ failed');
  }
  function carrollWrongQ(o){
    for(let tries = 0; tries < 80; tries++){
      let L; try { L = makeLayout(o); } catch(e){ continue; }
      const keys = []; L.rowList.forEach(function(r){ L.cols.forEach(function(c){ keys.push([r, c]); }); });
      const homeI = randInt(0, keys.length - 1), srcI = pick(range(0, keys.length - 1).filter(function(i){ return i !== homeI; }));
      const home = keys[homeI], src = keys[srcI];
      const intruder = pick(L.cells[cellKey(src[0], src[1])]);
      const cells = {}; Object.keys(L.cells).forEach(function(k){ cells[k] = L.cells[k].slice(); });
      cells[cellKey(src[0], src[1])] = cells[cellKey(src[0], src[1])].filter(function(n){ return n !== intruder; });
      cells[cellKey(home[0], home[1])].push(intruder);
      cells[cellKey(home[0], home[1])] = shuffle(cells[cellKey(home[0], home[1])]);
      // every number is tested on its own cell: exactly one fails
      const fails = []; L.rowList.forEach(function(r){ L.cols.forEach(function(c){ cells[cellKey(r, c)].forEach(function(n){ if(!((r === '' || sat(r, n)) && sat(c, n))) fails.push(n); }); }); });
      if(fails.length !== 1 || fails[0] !== intruder) continue;
      const vis = carrollHTML({ cols: L.cols, rows: L.rows, cells: cells });
      const others = []; L.rowList.forEach(function(r){ L.cols.forEach(function(c){ if(cellKey(r, c) !== cellKey(home[0], home[1]) ) cells[cellKey(r, c)].forEach(function(n){ others.push({ n: n, r: r, c: c }); }); }); });
      const homeNums = cells[cellKey(home[0], home[1])].filter(function(n){ return n !== intruder; });
      const pickOthers = sample(homeNums.concat(others.map(function(x){ return x.n; })), 6);
      const ds = pickOthers.map(function(n){ return opt(K.num(n), String(n), n + ' fits the headings of its box. Check the other numbers.'); });
      const why = (home[0] !== '' && !sat(home[0], intruder) ? failWhy(intruder, home[0]) + ' ' : '') + (!sat(home[1], intruder) ? failWhy(intruder, home[1]) : '');
      const q = mcq({
        prompt: 'One number is in the wrong box. Which one is it?', visual: vis, count: 4,
        correct: opt(K.num(intruder), String(intruder)), distractors: ds,
        hint: 'Take each number and check it against the headings of its box. Find the one that does not match.',
        explain: ex('Checking every number', [
          'Look at the box <b>' + cellText(home[0], home[1]) + '</b>.',
          asks(intruder, home[1]) + (home[0] !== '' ? '   ' + asks(intruder, home[0]) : ''),
          why,
          'So <b>' + intruder + '</b> is in the wrong box. ✅'
        ].filter(function(x){ return x; })),
        truth: K.num(intruder),
        decode: function(){
          const p = parseCarroll(vis), bad = [];
          p.cells.forEach(function(cl){ cl.nums.forEach(function(n){ if(!inCell(cl, n)) bad.push(n); }); });
          return bad.length === 1 ? K.num(bad[0]) : 'none';
        }
      });
      return q;
    }
    throw new Error('carrollWrongQ failed');
  }
  function carrollHoleQ(o){
    for(let tries = 0; tries < 80; tries++){
      let L; try { L = makeLayout(o); } catch(e){ continue; }
      const hr = pick(L.rowList), hc = pick(L.cols), hkey = cellKey(hr, hc);
      const taken = {}; Object.keys(L.cells).forEach(function(k){ L.cells[k].forEach(function(n){ taken[n] = 1; }); });
      const good = pool(o.max, function(n){ return !taken[n] && (hr === '' || sat(hr, n)) && sat(hc, n); });
      if(!good.length) continue;
      const ans = pick(good);
      // distractors: one fails only the column rule, one fails only the row rule, one fails both (when two rules exist)
      const ds = [];
      function add(n, why){ if(n !== undefined && !taken[n] && n !== ans && ds.every(function(d){ return d.key !== K.num(n); })) ds.push(opt(K.num(n), String(n), why(n))); }
      const passRow = function(n){ return hr === '' || sat(hr, n); };
      add(pick(pool(o.max, function(n){ return !taken[n] && passRow(n) && !sat(hc, n); }).concat([undefined])), function(n){ return failWhy(n, hc); });
      if(hr !== '') add(pick(pool(o.max, function(n){ return !taken[n] && !sat(hr, n) && sat(hc, n); }).concat([undefined])), function(n){ return failWhy(n, hr); });
      add(pick(pool(o.max, function(n){ return !taken[n] && !passRow(n) && !sat(hc, n); }).concat([undefined])), function(n){ return n + ' matches neither heading.'; });
      pool(o.max, function(n){ return !taken[n] && !((passRow(n)) && sat(hc, n)); }).forEach(function(n){ if(ds.length < 3 && chance(0.2)) add(n, function(m){ return m + ' does not match both headings.'; }); });
      shuffle(pool(o.max, function(n){ return !taken[n] && !(passRow(n) && sat(hc, n)); })).forEach(function(n){ if(ds.length < 3) add(n, function(m){ return m + ' does not match both headings.'; }); });
      if(ds.length < 3) continue;
      const optNums = [ans].concat(ds.map(function(d){ return parseInt(d.label, 10); }));
      if(optNums.filter(function(n){ return passRow(n) && sat(hc, n); }).length !== 1) continue;
      const vis = carrollHTML({ cols: L.cols, rows: L.rows, cells: L.cells, hole: hkey });
      const q = mcq({
        prompt: 'Which number could go in the empty box with the ? in it?', visual: vis, count: 4,
        correct: opt(K.num(ans), String(ans)), distractors: ds, keepOrder: false,
        hint: 'Read the heading across the top' + (hr !== '' ? ' and the heading down the side' : '') + ' for the empty box. The number must match ' + (hr !== '' ? 'both' : 'it') + '.',
        explain: ex('Which number fits?', [
          'The empty box is headed <b>' + cellText(hr, hc) + '</b>.',
          optNums.map(function(n){ return n + (passRow(n) && sat(hc, n) ? ' ✅' : ' ❌'); }).join(' &nbsp; '),
          'Only <b>' + ans + '</b> matches ' + (hr !== '' ? 'both headings' : 'the heading') + '.'
        ]),
        truth: K.num(ans),
        decode: function(){
          const p = parseCarroll(vis), hole = p.cells.filter(function(c){ return c.hole; })[0];
          const fit = q.options.filter(function(op){ return inCell(hole, parseInt(op.label, 10)); });
          return fit.length === 1 ? fit[0].key : 'none';
        }
      });
      return q;
    }
    throw new Error('carrollHoleQ failed');
  }

  /* one new number into a one-row two-box sorting table (odd/even, multiples) */
  function twoBoxQ(o){
    const ax = pick(o.axes), cols = AXES[ax];
    const cells = {}, taken = {};
    cols.forEach(function(c){ cells['|' + c] = sample(pool(o.max, function(n){ return sat(c, n); }), o.per); cells['|' + c].forEach(function(n){ taken[n] = 1; }); });
    const x = pick(pool(o.max, function(n){ return !taken[n]; })), home = cols.filter(function(c){ return sat(c, x); });
    const vis = carrollHTML({ cols: cols, rows: null, cells: cells, card: x });
    return mcq2({
      prompt: 'Which box does the new number go in?', visual: vis,
      correct: opt('|' + home[0], cap(R[home[0]].label)), other: opt('|' + cols.filter(function(c){ return c !== home[0]; })[0], cap(R[cols.filter(function(c){ return c !== home[0]; })[0]].label), failWhy(x, cols.filter(function(c){ return c !== home[0]; })[0]) + ' ' + R[home[0]].how),
      hint: R[cols[0]].how,
      explain: ex('Sorting ' + x, [R[cols[0]].how, asks(x, cols[0]), 'So ' + x + ' goes in the <b>' + cap(R[home[0]].label) + '</b> box. ✅']),
      truth: '|' + (R[cols[0]].fn(x) ? cols[0] : cols[1]),
      decode: function(){ const p = parseCarroll(vis), hit = p.cells.filter(function(cl){ return inCell(cl, p.card); }); return hit.length === 1 ? '|' + hit[0].c : 'none'; }
    });
  }

  /* two rules at once: exactly one option passes both */
  function bothRulesQ(){
    for(let tries = 0; tries < 80; tries++){
      const pr = pick(AXPAIRS), a = pick(AXES[pr[0]]), b = pick(AXES[pr[1]]);
      const both = pool(99, function(n){ return sat(a, n) && sat(b, n); }), onlyA = pool(99, function(n){ return sat(a, n) && !sat(b, n); }), onlyB = pool(99, function(n){ return !sat(a, n) && sat(b, n); }), none = pool(99, function(n){ return !sat(a, n) && !sat(b, n); });
      if(!both.length) continue;
      const ans = pick(both), nums = [ans, pick(onlyA), pick(onlyB), pick(none)];
      if(new Set(nums).size !== 4) continue;
      if(nums.filter(function(n){ return sat(a, n) && sat(b, n); }).length !== 1) continue;
      const vis = cardsHTML(shuffle(nums));
      return mcq({
        prompt: 'Which number is ' + R[a].label + ' AND ' + R[b].label + '?', visual: vis, count: 4,
        correct: opt(K.num(ans), String(ans)),
        distractors: nums.slice(1).map(function(n){ return opt(K.num(n), String(n), n + (sat(a, n) ? ' is ' + R[a].label + ' but it is ' + R[R[b].comp].label + '.' : (sat(b, n) ? ' is ' + R[b].label + ' but it is ' + R[R[a].comp].label + '.' : ' is neither of those things.'))); }),
        hint: 'A number must pass BOTH tests. Test each number twice: once for each rule.',
        explain: ex('Two tests for every number', nums.map(function(n){ return n + ': ' + (sat(a, n) ? '✅' : '❌') + ' ' + R[a].label + ', ' + (sat(b, n) ? '✅' : '❌') + ' ' + R[b].label; }).concat(['Only <b>' + ans + '</b> passes both tests. ✅'])),
        truth: K.num(ans),
        decode: function(){ const got = decodeCards(vis).filter(function(n){ return R[a].fn(n) && R[b].fn(n); }); return got.length === 1 ? K.num(got[0]) : 'none'; }
      });
    }
    throw new Error('bothRulesQ failed');
  }

  /* how many of these numbers are ...? (typed) */
  function countQ(){
    for(let tries = 0; tries < 60; tries++){
      const id = pick(['even', 'odd', 'm5', 'm10', 'gt50', 'm4', 'm3']), rule = R[id], max = rule.max || 99;
      const nums = sample(range(1, max), 7);
      const cnt = nums.filter(function(n){ return sat(id, n); }).length;
      if(cnt < 2 || cnt > 5) continue;
      const vis = cardsHTML(nums);
      return numeric({
        prompt: 'How many of these numbers are ' + rule.label + '?', visual: vis, answer: cnt,
        hint: rule.how + ' Go through the cards one by one and keep count.',
        explain: ex('Testing every card', [rule.how, nums.map(function(n){ return n + (sat(id, n) ? ' ✅' : ' ❌'); }).join(' &nbsp; '), 'There are <b>' + cnt + '</b> ticks, so the answer is ' + cnt + '. ✅']),
        truth: nums.reduce(function(t, n){ return t + (n % 1 === 0 && rule.fn(n) ? 1 : 0); }, 0),
        decode: function(){ return decodeCards(vis).filter(function(n){ return rule.fn(n); }).length; },
        wrong: function(v){ return v === 7 - cnt ? 'That counts the numbers that are NOT ' + rule.label + '. Count the ones that are.' : ''; }
      });
    }
    throw new Error('countQ failed');
  }

  /* ------------------------------------------------------------ shape sorting */
  const SINFO = {
    square: { s: 4, ra: true, eq: true, nm: 'square' }, rectangle: { s: 4, ra: true, eq: false, nm: 'rectangle' },
    parallelogram: { s: 4, ra: false, eq: false, nm: 'parallelogram' },
    trapezium: { s: 4, ra: false, eq: false, nm: 'trapezium' }, kite: { s: 4, ra: false, eq: false, nm: 'kite' },
    triangle_equilateral: { s: 3, ra: false, eq: true, nm: 'equal-sided triangle' }, triangle_right: { s: 3, ra: true, eq: false, nm: 'right-angled triangle' },
    triangle_isosceles: { s: 3, ra: false, eq: false, nm: 'pointy triangle' }, triangle_scalene: { s: 3, ra: false, eq: false, nm: 'lopsided triangle' },
    pentagon: { s: 5, ra: false, eq: true, nm: 'pentagon' }, hexagon: { s: 6, ra: false, eq: true, nm: 'hexagon' }, octagon: { s: 8, ra: false, eq: true, nm: 'octagon' }
  };
  const SRULES = {
    four: { label: 'has 4 sides', fact: function(i){ return i.s === 4; }, dec: function(d){ return d.vertices === 4; }, why: function(i){ return 'It has ' + i.s + ' sides.'; }, pool: Object.keys(SINFO) },
    right: { label: 'has a right angle (a square corner)', fact: function(i){ return i.ra; }, dec: function(d){ return d.rightAngles > 0; }, why: function(i){ return 'It has no square corner.'; }, pool: Object.keys(SINFO) },
    equal: { label: 'has all its sides the same length', fact: function(i){ return i.eq; }, dec: function(d){ return d.allEqual; }, why: function(i){ return 'Its sides are not all the same length.'; }, pool: Object.keys(SINFO).filter(function(k){ return k !== 'triangle_isosceles' && k !== 'triangle_scalene'; }) }
  };
  function shapeQ(o){
    for(let tries = 0; tries < 80; tries++){
      const id = pick(o.rules), rule = SRULES[id], names = rule.pool.filter(function(n){ return !o.avoid || o.avoid.indexOf(n) < 0; });
      const yes = names.filter(function(n){ return rule.fact(SINFO[n]); }), no = names.filter(function(n){ return !rule.fact(SINFO[n]); });
      const form = pick(['not', 'is']);
      let set, target;
      if(form === 'not'){ if(yes.length < 3) continue; target = pick(no); set = sample(yes, 3).concat([target]); }
      else { if(yes.length < 1) continue; target = pick(yes); set = sample(no, 3).concat([target]); }
      // do the two shapes with same facts look alike? make sure all four look different (distinct names always)
      const pass = set.filter(function(n){ return rule.fact(SINFO[n]); });
      if(form === 'not' ? pass.length !== 3 : pass.length !== 1) continue;
      const prompt = form === 'not' ? 'Which shape does NOT have this property: it ' + rule.label + '?' : 'Which shape ' + rule.label.replace(/^has /, 'has ') + '?';
      const optsList = shuffle(set);
      const q = mcq({
        prompt: form === 'not' ? 'Three of these shapes ' + rule.label.replace(/^has/, 'have') + '. Which shape does NOT?' : 'Which of these shapes ' + rule.label + '?',
        visual: '', count: 4,
        correct: opt(K.text(target), V.shape2D(target, { width: 112 })),
        distractors: optsList.filter(function(n){ return n !== target; }).map(function(n){ return opt(K.text(n), V.shape2D(n, { width: 112 }), form === 'not' ? 'The ' + SINFO[n].nm + ' DOES ' + rule.label.replace(/^has/, 'have') + '. Look for the one that does not.' : 'The ' + SINFO[n].nm + ' does not match. ' + rule.why(SINFO[n])); }),
        hint: id === 'four' ? 'Count the sides of each shape. Touch each straight line as you count.' : (id === 'right' ? 'A right angle is a square corner, like the corner of a book.' : 'Compare the lengths of the sides of each shape. Are they all the same?'),
        explain: ex('Checking each shape', set.map(function(n){ return 'The ' + SINFO[n].nm + (id === 'four' ? ' has ' + SINFO[n].s + ' sides' : (id === 'right' ? (SINFO[n].ra ? ' has a right angle' : ' has no right angle') : (SINFO[n].eq ? ' has all sides equal' : ' has sides of different lengths'))) + (rule.fact(SINFO[n]) ? ' ✅' : ' ❌'); }).concat(['The one that ' + (form === 'not' ? 'does not' : 'does') + ' is the <b>' + SINFO[target].nm + '</b>. ✅'])),
        truth: K.text(set.filter(function(n){ return form === 'not' ? !rule.fact(SINFO[n]) : rule.fact(SINFO[n]); })[0])
      });
      q.optionsAreVisual = true;
      q.decodeKey = function(){
        const hits = [];
        for(let i = 0; i < q.options.length; i++){
          const d = V.decodePolygon(q.options[i].label);
          if(!d) return 'option ' + i + ' has no polygon';
          if(K.text(Object.keys(SINFO).filter(function(k){ return K.text(k) === q.options[i].key; })[0]) !== q.options[i].key) return 'bad key';
          const ok = rule.dec(d);
          if(form === 'not' ? !ok : ok) hits.push(q.options[i].key);
        }
        return hits.length === 1 ? hits[0] : 'none or many: ' + hits.length;
      };
      return q;
    }
    throw new Error('shapeQ failed');
  }

  /* ------------------------------------------------------------ the skill */
  registerSkill({
    id: 'logic-sorting', strand: 'logic', name: 'Sorting and odd one out', emoji: '🧺', year: 3, order: 920, prereq: ['logic-patterns', 'multdiv-2-5-10'],
    lesson: {
      title: 'Sorting with rules',
      steps: [
        { say: 'To <b>sort</b> things, we use a <b>rule</b>. A number is <b>even</b> if you can put every dot into a pair. 8 dots make 4 pairs, with none left over. So <b>8 is even</b>.', vis: { kind: 'dots', args: [8, { cols: 2 }] } },
        { say: 'This number has one dot left on its own. A number with one left over is <b>odd</b>. 7 dots make 3 pairs and 1 spare. So <b>7 is odd</b>.', vis: { kind: 'dots', args: [7, { cols: 2 }] },
          quiz: { prompt: 'Look at the dots: 9 dots in pairs. Is 9 odd or even?', options: [{ label: 'Odd', ok: true }, { label: 'Even', ok: false }], right: 'Yes! 9 makes 4 pairs and 1 left over, so it is odd.', wrong: '9 dots make 4 pairs with 1 left over. A number with one left over is odd.' } },
        { say: 'Check the <b>last digit</b>. <b>Multiples of 5</b> end in <b>0 or 5</b>. <b>Multiples of 10</b> end in <b>0</b>. All of these are multiples of 5, but only 10, 20 and 30 are multiples of 10.', vis: { kind: 'lgCards', args: [[5, 10, 15, 20, 25, 30]] } },
        { say: 'A <b>Carroll diagram</b> sorts with two rules at once. 12 is even <b>and</b> not a multiple of 5, so it goes in the top-right box. Every number must match both its headings.', vis: { kind: 'lgCarroll', args: [{ cols: ['m5', 'nm5'], rows: ['even', 'odd'], cells: { 'even|m5': [10, 20], 'even|nm5': [12, 18], 'odd|m5': [15, 25], 'odd|nm5': [7, 21] } }] },
          quiz: { prompt: 'Which box does 35 go in?', options: [{ label: 'Odd and a multiple of 5', ok: true }, { label: 'Even and a multiple of 5', ok: false }, { label: 'Odd and not a multiple of 5', ok: false }], right: 'Yes! 35 is odd and it ends in 5.', wrong: '35 ends in 5, so it is a multiple of 5. It ends in an odd digit, so it is odd.' } },
        { say: 'In an <b>odd one out</b> puzzle, test <b>every</b> number with the rule. Which of 20, 30, 45, 50 is not a multiple of 10? Only <b>45</b> fails, because it does not end in 0.', vis: { kind: 'lgCards', args: [[20, 30, 45, 50]] } }
      ]
    },
    trick: {
      title: 'Last digit tells you',
      say: 'Look only at the <b>last digit</b>. <b>0, 2, 4, 6, 8</b> means even. <b>1, 3, 5, 7, 9</b> means odd. <b>0 or 5</b> means a multiple of 5. <b>0</b> means a multiple of 10. For a Carroll diagram, test the number against the heading on top, then the heading on the side.',
      vis: { kind: 'lgCards', args: [[14, 35, 40, 27]] },
      example: '<b>35</b> ends in 5 → odd and a multiple of 5. <b>40</b> ends in 0 → even, multiple of 5 and multiple of 10.'
    },
    gen: {
      1: function(){
        const f = randInt(0, 3);
        if(f === 0) return dotsParityQ();
        if(f === 1) return listQ({ rules: ['even', 'odd'], max: 30, form: 'is', count: 3 });
        if(f === 2) return twoBoxQ({ axes: ['par', 'm5', 'm10'], max: 30, per: 3 });
        return listQ({ rules: ['even', 'odd', 'm10', 'm5'], max: 40, form: 'not', count: 4 });
      },
      2: function(){
        const f = randInt(0, 5);
        if(f === 0) return carrollWhereQ({ max: 70, per: 2 });
        if(f === 1) return carrollWrongQ({ max: 70, per: 3 });
        if(f === 2) return listQ({ rules: ['m5', 'm10', 'even', 'odd', 'm3', 'm4'], max: 60 });
        if(f === 3) return shapeQ({ rules: ['four', 'right'], avoid: ['kite', 'trapezium', 'parallelogram'] });
        if(f === 4) return twoBoxQ({ axes: ['par', 'm5', 'm10', 'big'], max: 99, per: 3 });
        return listQ({ rules: ['even', 'odd', 'm5', 'm10'], max: 99 });
      },
      3: function(){
        const f = randInt(0, 5);
        if(f === 0) return carrollHoleQ({ max: 99, per: 2 });
        if(f === 1) return bothRulesQ();
        if(f === 2) return countQ();
        if(f === 3) return carrollWrongQ({ max: 99, per: 3 });
        if(f === 4) return shapeQ({ rules: ['four', 'right', 'equal'] });
        return carrollWhereQ({ max: 99, per: 3 });
      }
    }
  });
})();
