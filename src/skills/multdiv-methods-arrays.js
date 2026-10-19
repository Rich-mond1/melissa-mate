/* multdiv-arrays-groups — equal groups, arrays, repeated addition, commutativity, rows x columns. */
(function(){
  function rep(per, times){ return new Array(times).fill(per).join(' + '); }
  function sent(g, p, t){ return g + ' × ' + p + ' = ' + t; }
  function aKey(r, c){ return 'a:' + r + 'x' + c; }
  function addTerms(per, times){ let s = 0; for(let i = 0; i < times; i++) s += per; return s; }

  /* distractor number sentences for a picture of g groups of p (groups first) */
  function sentDs(g, p){
    const t = g * p, o = [];
    o.push(opt(K.text(g + ' + ' + p + ' = ' + (g + p)), g + ' + ' + p + ' = ' + (g + p), 'That adds the two numbers. “' + g + ' groups of ' + p + '” is multiplying: ' + g + ' × ' + p + '.'));
    o.push(opt(K.text(sent(g, p, t + p)), sent(g, p, t + p), 'The × sentence is right but the total is one group too big. ' + g + ' groups of ' + p + ' is ' + t + '.'));
    o.push(opt(K.text(sent(g, p, t - p)), sent(g, p, t - p), 'The × sentence is right but the total is one group too small. ' + g + ' groups of ' + p + ' is ' + t + '.'));
    if(g !== p){
      o.push(opt(K.text(sent(p, p, p * p)), sent(p, p, p * p), 'That uses ' + p + ' twice. Say the number of groups (' + g + ') first, then how many in each (' + p + ').'));
      o.push(opt(K.text(sent(g, g, g * g)), sent(g, g, g * g), 'That uses ' + g + ' twice. There are ' + g + ' groups with ' + p + ' in each.'));
    }
    o.push(opt(K.text(sent(g + 1, p, (g + 1) * p)), sent(g + 1, p, (g + 1) * p), 'There are ' + g + ' groups, not ' + (g + 1) + '. Count the rings again.'));
    o.push(opt(K.text(g + ' + ' + p + ' = ' + t), g + ' + ' + p + ' = ' + t, 'Adding ' + g + ' and ' + p + ' makes ' + (g + p) + ', not ' + t + '. Use × for equal groups.'));
    return o;
  }

  function sentenceQ(g, p, count){
    const vis = V.groups(g, p), t = g * p, label = sent(g, p, t);
    return mcq({
      prompt: 'Which multiplication matches the picture? Say the groups first, then how many in each.', visual: vis,
      correct: opt(K.text(label), label), distractors: sentDs(g, p), keepOrder: true, count: count,
      hint: 'Count the rings (groups) first. Then count the dots inside ONE ring. Multiply those two numbers.',
      explain: ex('Writing the multiplication', [
        'There are <b>' + g + '</b> groups (rings).',
        'Each group has <b>' + p + '</b> dots.',
        'So we write <b>' + label + '</b> — ' + rep(p, g) + ' = ' + t + '. ✅'
      ]),
      truth: K.text(g + ' × ' + p + ' = ' + addTerms(p, g)),
      decode: function(){ const d = V.decodeGroups(vis); return K.text(d.groups + ' × ' + d.per + ' = ' + d.total); }
    });
  }

  function arrayAsk(r, c, ask, tierSpread){
    const vis = V.array(r, c), t = r * c;
    let ans, prompt, wr, hint, steps, key;
    if(ask === 'rows'){
      ans = c === r ? r : r; prompt = 'How many ROWS are in this array?';
      wr = [{ v: c, why: 'That is how many dots are in each row (the columns). Rows go ACROSS: count the lines of dots, from top to bottom.' }, { v: t, why: 'That is the total number of dots. We want the number of rows.' }, { v: r + c, why: 'That adds rows and columns. Just count the rows.' }];
      hint = 'A row goes across, like seats in a row. Count how many lines of dots there are from top to bottom.';
      steps = ['Rows go <b>across</b> (side to side).', 'Counting the lines of dots from top to bottom gives <b>' + r + '</b> rows.', 'So there are <b>' + r + '</b> rows. ✅'];
    } else if(ask === 'each'){
      ans = c; prompt = 'How many dots are in EACH row?';
      wr = [{ v: r, why: 'That is the number of rows. Count the dots along ONE row instead.' }, { v: t, why: 'That is all the dots. We want just one row.' }, { v: r + c, why: 'That adds rows and columns. Count along one row.' }];
      hint = 'Put your finger on one row and count the dots along it, left to right.';
      steps = ['Look at just <b>one row</b>.', 'Counting along it gives <b>' + c + '</b> dots.', 'Every row is the same, so each row has <b>' + c + '</b> dots. ✅'];
    } else if(ask === 'cols'){
      ans = c; prompt = 'How many COLUMNS are in this array?';
      wr = [{ v: r, why: 'That is the number of rows. Columns go DOWN: count how many dots are in one row, across.' }, { v: t, why: 'That is the total number of dots.' }, { v: r + c, why: 'That adds rows and columns.' }];
      hint = 'A column goes up and down, like a pillar. Count the pillars from left to right.';
      steps = ['Columns go <b>down</b> (like pillars).', 'Counting the pillars from left to right gives <b>' + c + '</b>.', 'So there are <b>' + c + '</b> columns. ✅'];
    } else {
      ans = t; prompt = 'How many dots are there altogether?';
      wr = [{ v: r + c, why: 'You added rows and columns. Add the rows instead: ' + rep(c, r) + ', or multiply ' + r + ' × ' + c + '.' }, { v: t - c, why: 'That is one row too few.' }, { v: t + c, why: 'That is one row too many.' }];
      hint = 'There are ' + r + ' equal rows. Add the dots in each row, or use multiplying.';
      steps = ['There are <b>' + r + '</b> rows with <b>' + c + '</b> dots in each.', rep(c, r) + ' = <b>' + t + '</b>, which is ' + r + ' × ' + c + '.', 'So there are <b>' + t + '</b> dots altogether. ✅'];
    }
    const dec = { rows: function(d){ return d.rows; }, each: function(d){ return d.cols; }, cols: function(d){ return d.cols; }, total: function(d){ return d.total; } }[ask];
    const tr = { rows: function(){ let n = 0; for(let i = 0; i < r; i++) n++; return n; }, each: function(){ return t / r; }, cols: function(){ return t / r; }, total: function(){ return addTerms(c, r); } }[ask];
    return mcqNum({
      prompt: prompt, visual: vis, answer: ans, wrong: wr, valid: function(v){ return v >= 1; },
      hint: hint, explain: ex('Reading the array', steps), truth: tr(), decode: function(){ return dec(V.decodeArray(vis)); }
    });
  }

  registerSkill({
    id: 'multdiv-arrays-groups', strand: 'multdiv', name: 'Groups, arrays & multiplying', emoji: '🔴', year: 3, order: 370, prereq: ['multdiv-2-5-10'],
    lesson: {
      title: 'Equal groups and arrays',
      steps: [
        { say: '<b>Equal groups</b> means the same number in every group. Here are <b>3 groups</b> with <b>4</b> dots in each group.', vis: { kind: 'groups', args: [3, 4] },
          quiz: { prompt: 'How many dots are in each group?', options: [{ label: '3', ok: false }, { label: '4', ok: true }, { label: '12', ok: false }], right: 'Yes! Each group has 4 dots. There are 3 groups.', wrong: 'Look inside ONE ring and count: there are 4 dots in each group (3 is how many groups).' } },
        { say: 'We can add up the groups: <b>4 groups of 3</b> is <b>3 + 3 + 3 + 3 = 12</b>. Adding the same number again and again is <b>repeated addition</b>. We write it as <b>4 × 3 = 12</b>.', vis: { kind: 'groups', args: [4, 3] },
          quiz: { prompt: 'This picture has 4 groups with 3 dots in each. Which repeated addition matches it?', options: [{ label: '3 + 3 + 3 + 3', ok: true }, { label: '4 + 4 + 4', ok: false }, { label: '4 + 3', ok: false }], right: 'Yes! Four groups, and each one is worth 3.', wrong: 'Write the size of one group (3) once for each group. There are 4 groups, so 3 + 3 + 3 + 3.' } },
        { say: 'An <b>array</b> is dots in neat <b>rows</b> and <b>columns</b>. Rows go <b>across</b>. This array has <b>3 rows</b> of <b>5</b>: 5 + 5 + 5 = 15, so <b>3 × 5 = 15</b>.', vis: { kind: 'array', args: [3, 5] },
          quiz: { prompt: 'Which multiplication matches 3 rows of 5?', options: [{ label: '3 × 5 = 15', ok: true }, { label: '3 + 5 = 8', ok: false }, { label: '3 × 5 = 8', ok: false }], right: 'Yes! 3 rows of 5 is 3 × 5 = 15.', wrong: 'Rows of 5, three times: that is multiplying. 3 × 5 = 15 (not 3 + 5).' } },
        { say: 'Turn the array on its side. Now it is <b>5 rows of 3</b>. It is still <b>15 dots</b>! So <b>3 × 5 = 5 × 3</b>. You can multiply in <b>any order</b>.', vis: { kind: 'array', args: [5, 3] },
          quiz: { prompt: 'We know 3 × 5 = 15. What is 5 × 3?', options: [{ label: '8', ok: false }, { label: '15', ok: true }, { label: '53', ok: false }], right: 'Yes! Swapping the numbers gives the same answer: 15.', wrong: 'It is the same array turned on its side, so the answer is still 15.' } },
        { say: 'Careful with <b>rows and columns</b>! Rows go <b>across</b> and columns go <b>down</b>. This array has <b>4 rows</b> and <b>6 columns</b>, so <b>6 dots in each row</b>. 4 × 6 = 24.', vis: { kind: 'array', args: [4, 6] },
          quiz: { prompt: 'How many dots are in EACH row of this array?', options: [{ label: '4', ok: false }, { label: '6', ok: true }, { label: '24', ok: false }], right: 'Yes! Count along one row: 6 dots.', wrong: 'Count along ONE row (across): 6 dots. The 4 is how many rows there are.' } },
        { say: 'Your turn! Here are <b>5 groups</b> of <b>2</b>. Add them: <b>2 + 2 + 2 + 2 + 2</b>, or multiply: <b>5 × 2</b>.', vis: { kind: 'groups', args: [5, 2] },
          quiz: { prompt: 'How many dots are there altogether?', options: [{ label: '7', ok: false }, { label: '10', ok: true }, { label: '52', ok: false }], right: 'Yes! 5 × 2 = 10.', wrong: 'Add the groups: 2 + 2 + 2 + 2 + 2 = 10. (Do not add 5 + 2.)' } }
      ]
    },
    trick: {
      title: 'Flip it round!',
      say: 'Multiplying works in <b>any order</b>. If one way looks hard, <b>flip it</b>! <b>2 × 8</b> is the same as <b>8 × 2</b>. Start with the <b>bigger number</b> and count on in jumps of the smaller one.',
      vis: { kind: 'array', args: [2, 8] },
      example: '2 rows of 8 = 8 rows of 2 → 2 × 8 = 8 × 2 = <b>16</b>. (Rows go across, columns go down.)'
    },
    gen: {
      1: function(){
        const f = randInt(1, 6);
        if(f === 1){ // total from a groups picture
          const g = randInt(2, 4), p = pick([2, 3, 4, 5]), vis = V.groups(g, p), tot = g * p;
          return mcqNum({
            prompt: 'How many dots are there altogether?', visual: vis, answer: tot,
            wrong: [{ v: g + p, why: 'You added ' + g + ' + ' + p + '. Add up ALL the groups: ' + rep(p, g) + '.' }, { v: p, why: 'That is only ONE group. Add up all ' + g + ' groups.' }, { v: tot - p, why: 'That is one group too few. Count the rings again.' }, { v: tot + p, why: 'That is one group too many. Count the rings again.' }],
            valid: function(v){ return v >= 1; },
            hint: 'Count the groups, then count the dots in ONE group. Add that number again for every group.',
            explain: ex('Counting equal groups', ['There are <b>' + g + '</b> groups with <b>' + p + '</b> dots in each.', rep(p, g) + ' = <b>' + tot + '</b>.', 'There are <b>' + tot + '</b> dots altogether. ✅']),
            truth: addTerms(p, g), decode: function(){ return V.decodeGroups(vis).total; }
          });
        }
        if(f === 2){ // choose the repeated addition
          const g = randInt(2, 4), p = pick([2, 3, 4, 5]), vis = V.groups(g, p), label = rep(p, g);
          const ds = [
            opt(K.text(rep(g, p)), rep(g, p), 'That adds ' + g + ', ' + p + ' times. It is the wrong way round: each group has ' + p + ', and there are ' + g + ' groups.'),
            opt(K.text(rep(p, g + 1)), rep(p, g + 1), 'That has one group too many. Count the rings: there are ' + g + '.'),
            opt(K.text(g + ' + ' + p), g + ' + ' + p, 'That only adds the number of groups and the size of a group once. Write the size of ONE group for each group.'),
            opt(K.text(rep(p, g + 2)), rep(p, g + 2), 'That has too many groups. Count the rings again.'),
            opt(K.text(rep(p + 1, g)), rep(p + 1, g), 'That has ' + (p + 1) + ' in each group, but each ring has ' + p + ' dots.')
          ];
          if(g >= 3) ds.splice(2, 0, opt(K.text(rep(p, g - 1)), rep(p, g - 1), 'That is one group too few. Count the rings again.'));
          return mcq({
            prompt: 'Each ring is a group. Which repeated addition adds up the groups?', visual: vis,
            correct: opt(K.text(label), label), distractors: ds, keepOrder: true, count: 4,
            hint: 'How many dots in ONE ring? Write that number once for every ring.',
            explain: ex('Repeated addition', ['There are <b>' + g + '</b> rings, each with <b>' + p + '</b> dots.', 'So write ' + p + ' once for each ring: <b>' + label + '</b>.', 'That adds up to ' + (g * p) + '. ✅']),
            truth: K.text(Array.from({ length: g }, function(){ return p; }).join(' + ')),
            decode: function(){ const d = V.decodeGroups(vis); return K.text(rep(d.per, d.groups)); }
          });
        }
        if(f === 3){ // rows / each row / total on a small array
          const r = randInt(2, 4), c = randInt(2, 5);
          return arrayAsk(r, c, pick(['rows', 'each', 'total']));
        }
        if(f === 4){ // equal groups? yes / no
          const k = randInt(3, 4), per = pick([2, 3, 4, 5, 6]), eq = chance(0.5), who = pick(['Ana', 'Marcus', 'Sophie', 'Ivan', 'Lucy', 'Kai']);
          const L = new Array(k).fill(per);
          if(!eq){ const i = randInt(0, k - 1); L[i] = per + pick([1, 2]); }
          const listTxt = L.slice(0, k - 1).join(', ') + ' and ' + L[k - 1];
          const yes = 'Yes', no = 'No';
          return mcq2({
            prompt: who + ' puts sweets on ' + k + ' plates: ' + listTxt + '. Are these equal groups?',
            correct: opt(K.bool(eq), eq ? yes : no), other: opt(K.bool(!eq), eq ? no : yes, eq ? 'Every plate has ' + per + ', so they ARE equal groups.' : 'Look again: the plates have ' + listTxt + '. Equal groups all have the SAME number.'),
            hint: 'Equal groups have the same number in every group. Compare all the plates.',
            explain: ex('Are they equal?', ['The plates have ' + listTxt + ' sweets.', eq ? 'Every plate has the same number, <b>' + per + '</b>.' : 'The numbers are not all the same.', 'The answer is <b>' + (eq ? yes : no) + '</b>' + (eq ? ': they are equal groups. ✅' : ': they are not equal groups. ✅')]),
            truth: K.bool(new Set(L).size === 1)
          });
        }
        if(f === 5){ return sentenceQ(randInt(2, 4), pick([2, 3, 4, 5]), 3); }
        // f === 6: array total with repeated addition prompt
        const r = randInt(2, 4), c = pick([2, 3, 4, 5]);
        return arrayAsk(r, c, 'total');
      },
      2: function(){
        const f = randInt(1, 6);
        if(f === 1){ return sentenceQ(randInt(2, 6), pick([2, 3, 4, 5, 6]), 4); }
        if(f === 2){ // same answer by swapping
          const a = pick([2, 3, 4, 5, 6, 7, 8]); let b = pick([2, 3, 4, 5, 6, 7, 8]); if(b === a) b = a === 8 ? 3 : a + 1;
          const p = a * b;
          const all = [{ l: b + ' × ' + a, v: b * a }];
          const cands = [
            { l: a + ' + ' + b, v: a + b, why: 'That adds. It is a different number. Swapping a MULTIPLICATION gives ' + b + ' × ' + a + '.' },
            { l: a + ' × ' + (b + 1), v: a * (b + 1), why: 'That has one more group of ' + a + '. It is bigger than ' + a + ' × ' + b + '.' },
            { l: (a + 1) + ' × ' + b, v: (a + 1) * b, why: 'Changing ' + a + ' to ' + (a + 1) + ' changes the answer. Swap the two numbers instead.' },
            { l: a + ' × ' + (b - 1), v: a * (b - 1), why: 'That has one group fewer. Swap the numbers, do not change them.' },
            { l: b + ' × ' + (a + 1), v: b * (a + 1), why: 'Changing a number changes the answer. Just swap them.' },
            { l: a + ' × ' + a, v: a * a, why: 'That uses ' + a + ' twice. Swap means ' + b + ' × ' + a + '.' },
            { l: b + ' × ' + b, v: b * b, why: 'That uses ' + b + ' twice. Swap means ' + b + ' × ' + a + '.' }
          ].filter(function(x){ return x.v !== p; });
          cands.forEach(function(x){ all.push(x); });
          const truthList = all.filter(function(x){ return x.v === a * b; });
          const label = b + ' × ' + a;
          return mcq({
            prompt: 'Which has the same answer as ' + a + ' × ' + b + '?',
            correct: opt(K.text(label), label), distractors: cands.map(function(x){ return opt(K.text(x.l), x.l, x.why); }), keepOrder: true, count: 4,
            hint: 'Multiplying can be done in any order. What happens if you swap the two numbers?',
            explain: ex('Swapping the numbers', [a + ' × ' + b + ' = <b>' + p + '</b>.', 'Swap them: <b>' + label + '</b> is also <b>' + p + '</b> — the same array turned on its side.', 'The other choices make different answers. ✅']),
            truth: K.text(truthList.length === 1 ? truthList[0].l : 'bad')
          });
        }
        if(f === 3){ // array rows / each row / columns / total (rows != columns)
          const r = randInt(2, 6); let c = randInt(3, 8); if(c === r) c = r + 1;
          return arrayAsk(r, c, pick(['rows', 'each', 'cols', 'total']));
        }
        if(f === 4){ // missing factor with commutativity
          const a = pick([3, 4, 5, 6, 7, 8]); let b = pick([2, 3, 4, 5, 6, 7, 8, 9]); if(b === a) b = a + 1;
          return mcqNum({
            prompt: 'Fill the gap: ' + a + ' × ? = ' + b + ' × ' + a, answer: b,
            wrong: [{ v: a, why: 'That is the number already on the left. Look at the right side: ' + b + ' × ' + a + '. The gap must be ' + b + '.' }, { v: a * b, why: 'That is the answer to the multiplication, not the missing number.' }, { v: a + b, why: 'You added. The two sides use the same two numbers, just swapped.' }],
            valid: function(v){ return v >= 1; },
            hint: 'Both sides use the same two numbers. One side is ' + a + ' × ?, the other is ' + b + ' × ' + a + '. Swap them.',
            explain: ex('Swapping', [b + ' × ' + a + ' is the same as ' + a + ' × ' + b + '.', 'So ' + a + ' × ? = ' + a + ' × ' + b + '.', 'The missing number is <b>' + b + '</b>. ✅']),
            truth: (b * a) / a
          });
        }
        if(f === 5){ // count the terms
          const n = pick([2, 3, 4, 5, 6, 8]), k = randInt(3, 6);
          const exp = rep(n, k);
          return mcqNum({
            prompt: exp + ' = ? × ' + n + '. What number goes in the gap?', answer: k,
            wrong: [{ v: k - 1, why: 'You counted the + signs. Count the ' + n + 's instead: there is one more ' + n + ' than there are + signs.' }, { v: n, why: 'That is the number being added. We want HOW MANY times it is added.' }, { v: k * n, why: 'That is the total. We want how many ' + n + 's there are.' }, { v: k + 1, why: 'That is one too many. Count the ' + n + 's again.' }],
            valid: function(v){ return v >= 1; },
            hint: 'Count how many times the number ' + n + ' appears in the addition (not the + signs).',
            explain: ex('Repeated addition to multiplying', ['The number <b>' + n + '</b> is added <b>' + k + '</b> times.', exp + ' = <b>' + k + '</b> × ' + n + '.', 'The answer for the gap is <b>' + k + '</b>. ✅']),
            truth: exp.split(' + ').length
          });
        }
        // f === 6: true or false about swapping
        const kind = pick(['mul', 'add', 'div', 'sub']); let a, b, label, val, why;
        if(kind === 'mul'){ a = pick([3, 4, 5, 6, 7, 8, 9]); b = pick([2, 3, 4, 5, 6, 7, 8]); if(a === b) b = 2; label = a + ' × ' + b + ' = ' + b + ' × ' + a; val = (a * b === b * a); why = 'Multiplying can be swapped: ' + a + ' × ' + b + ' = ' + a * b + ' and ' + b + ' × ' + a + ' = ' + a * b + '.'; }
        else if(kind === 'add'){ a = randInt(3, 9); b = randInt(10, 19); label = a + ' + ' + b + ' = ' + b + ' + ' + a; val = (a + b === b + a); why = 'Adding can be swapped too: both sides make ' + (a + b) + '.'; }
        else if(kind === 'div'){ const d = pick([2, 3, 4, 5]), q = pick([3, 4, 5, 6]); a = d * q; b = d; label = a + ' ÷ ' + b + ' = ' + b + ' ÷ ' + a; val = (a / b === b / a); why = 'Dividing cannot be swapped. ' + a + ' ÷ ' + b + ' = ' + q + ', but ' + b + ' ÷ ' + a + ' is not ' + q + '.'; }
        else { a = randInt(6, 9); b = randInt(2, 5); label = a + ' − ' + b + ' = ' + b + ' − ' + a; val = (a - b === b - a); why = 'Subtracting cannot be swapped. ' + a + ' − ' + b + ' = ' + (a - b) + ', but you cannot take ' + a + ' away from ' + b + '.'; }
        const T = 'True', F = 'False';
        return mcq2({
          prompt: 'True or false? ' + label,
          correct: opt(K.bool(val), val ? T : F), other: opt(K.bool(!val), val ? F : T, val ? 'The two sides do match: ' + why : 'The two sides do NOT match. ' + why),
          hint: 'Try working out each side. Do you get the same answer both ways?',
          explain: ex('Can we swap?', [label + '.', why, 'So the answer is <b>' + (val ? T : F) + '</b>. ✅']),
          truth: K.bool(kind === 'mul' || kind === 'add')
        });
      },
      3: function(){
        const f = randInt(1, 7);
        if(f === 7){ return sentenceQ(randInt(3, 6), pick([3, 4, 5, 6, 7, 8]), 4); }
        if(f === 1){ // typed array total
          const r = randInt(3, 6), c = randInt(4, 9), vis = V.array(r, c), t = r * c;
          return numeric({
            prompt: 'How many dots are in this array altogether?', visual: vis, answer: t,
            hint: 'Count one row, then add the same row again for every row. Or multiply rows × dots in each row.',
            explain: ex('Total of an array', ['There are <b>' + r + '</b> rows with <b>' + c + '</b> dots in each row.', rep(c, r) + ' = <b>' + t + '</b>, which is ' + r + ' × ' + c + '.', 'There are <b>' + t + '</b> dots altogether. ✅']),
            truth: addTerms(c, r), decode: function(){ return V.decodeArray(vis).total; },
            wrong: function(v){ return v === r + c ? 'You added rows and columns. Multiply them (or add ' + c + ', ' + r + ' times).' : (v === t - c || v === t + c ? 'Close! That is one row out. Count the rows again.' : ''); }
          });
        }
        if(f === 2){ // typed swap
          if(chance(0.5)){
            const a = randInt(3, 9); let b = randInt(3, 9); if(b === a) b = a === 9 ? 4 : a + 1;
            return numeric({
              prompt: a + ' × ' + b + ' = ' + b + ' × ?', answer: a,
              hint: 'The two sides use the same two numbers, swapped. What is missing on the right?',
              explain: ex('Swapping', [a + ' × ' + b + ' and ' + b + ' × ' + a + ' make the same array.', 'So ' + a + ' × ' + b + ' = ' + b + ' × ' + a + '.', 'The missing number is <b>' + a + '</b>. ✅']),
              truth: (a * b) / b, wrong: function(v){ return v === b ? 'That is the number already there. The missing one is the other number in the sum.' : (v === a * b ? 'That is the answer to the multiplication. We want the missing number.' : ''); }
            });
          }
          const a = pick([3, 4, 6, 7, 8, 9]); let b = pick([4, 5, 6, 7, 8, 9]); if(b === a) b = a === 9 ? 5 : a + 1;
          const t = a * b;
          return numeric({
            prompt: 'You know that ' + a + ' × ' + b + ' = ' + t + '. What is ' + b + ' × ' + a + '?', answer: t,
            hint: 'Turn the array on its side. How many dots now?',
            explain: ex('Swapping', ['Turning the array on its side changes the rows to columns.', 'The number of dots stays the same.', 'So ' + b + ' × ' + a + ' = <b>' + t + '</b>. ✅']),
            truth: b * a, wrong: function(v){ return v === a + b ? 'You added. Swapping a multiplication does not change the answer.' : ''; }
          });
        }
        if(f === 3){ // which sentence is true
          const a = pick([3, 4, 5, 6, 7, 8, 9]); let b = pick([3, 4, 5, 6, 7, 8, 9]); if(b === a) b = a === 9 ? 4 : a + 1;
          const d = pick([2, 3, 4, 5]), q = pick([2, 3, 4, 5, 6]), big = Math.max(a, b), small = Math.min(a, b);
          const cands = [
            { l: a + ' × ' + b + ' = ' + b + ' × ' + a, ok: function(){ return a * b === b * a; }, why: '' },
            { l: (d * q) + ' ÷ ' + d + ' = ' + d + ' ÷ ' + (d * q), ok: function(){ return (d * q) / d === d / (d * q); }, why: 'Dividing cannot be swapped: ' + (d * q) + ' ÷ ' + d + ' = ' + q + ' but ' + d + ' ÷ ' + (d * q) + ' is not ' + q + '.' },
            { l: big + ' − ' + small + ' = ' + small + ' − ' + big, ok: function(){ return big - small === small - big; }, why: 'Subtracting cannot be swapped: ' + big + ' − ' + small + ' = ' + (big - small) + ', but you cannot take ' + big + ' from ' + small + '.' },
            { l: a + ' × ' + b + ' = ' + b + ' × ' + (a + 1), ok: function(){ return a * b === b * (a + 1); }, why: 'Changing a number changes the answer. ' + b + ' × ' + (a + 1) + ' = ' + b * (a + 1) + ', not ' + a * b + '.' }
          ];
          const trueOnes = cands.filter(function(x){ return x.ok(); });
          const label = cands[0].l;
          return mcq({
            prompt: 'Which number sentence is true?',
            correct: opt(K.text(label), label), distractors: cands.slice(1).map(function(x){ return opt(K.text(x.l), x.l, x.why); }), keepOrder: true, count: 4,
            hint: 'Work out both sides of each sentence. Only one pair matches. Which operation can be swapped?',
            explain: ex('Which one can swap?', ['Only multiplying (and adding) can be swapped.', '<b>' + label + '</b> is true: both sides make ' + a * b + '.', 'Dividing and subtracting give different answers when swapped. ✅']),
            truth: K.text(trueOnes.length === 1 ? trueOnes[0].l : 'bad')
          });
        }
        if(f === 4){ // typed: dots in each row (rows != cols)
          const r = randInt(2, 5); let c = randInt(3, 9); if(c === r) c = r + 1;
          const vis = V.array(r, c);
          return numeric({
            prompt: 'How many dots are in EACH row?', visual: vis, answer: c,
            hint: 'Rows go across. Put your finger at the start of one row and count along it.',
            explain: ex('Rows and columns', ['Rows go <b>across</b>, columns go <b>down</b>.', 'Counting along one row gives <b>' + c + '</b> dots.', 'There are ' + r + ' rows, but each row has <b>' + c + '</b>. ✅']),
            truth: (r * c) / r, decode: function(){ return V.decodeArray(vis).cols; },
            wrong: function(v){ return v === r ? 'That is the number of ROWS. Count along one row for the dots in each row.' : (v === r * c ? 'That is all the dots. We want the dots in one row.' : ''); }
          });
        }
        if(f === 5){ // picture options: which array shows R rows of C?
          const r = randInt(2, 5); let c = randInt(3, 6); if(c === r) c = r + 1;
          const used = {}; used[aKey(r, c)] = 1;
          const pool = [[c, r, 'That array has ' + c + ' rows of ' + r + ': the rows and columns are swapped. We need ' + r + ' rows of ' + c + '.'], [r, c + 1, 'That array has ' + r + ' rows but ' + (c + 1) + ' dots in each row.'], [r + 1, c, 'That array has ' + (r + 1) + ' rows, one too many.'], [r, c - 1, 'That array has only ' + (c - 1) + ' dots in each row.'], [r - 1, c, 'That array has only ' + (r - 1) + ' rows.']];
          const ds = [];
          pool.forEach(function(x){ if(x[0] >= 1 && x[1] >= 1 && !used[aKey(x[0], x[1])]){ used[aKey(x[0], x[1])] = 1; ds.push(opt(aKey(x[0], x[1]), V.array(x[0], x[1]), x[2])); } });
          const total = r * c;
          const q = mcq({
            prompt: 'Which array shows ' + r + ' rows of ' + c + '? (Rows go across.)', visual: '',
            correct: opt(aKey(r, c), V.array(r, c)), distractors: ds, keepOrder: true, count: 3,
            hint: 'Rows go across. Count the rows, then count how many dots are in one row.',
            explain: ex('Finding ' + r + ' rows of ' + c, [r + ' rows of ' + c + ' means ' + r + ' lines going across with ' + c + ' dots in each.', 'That makes ' + total + ' dots.', 'Only one picture has ' + r + ' rows with ' + c + ' dots in each row. ✅']),
            truth: aKey(total / c, total / r)
          });
          q.optionsAreVisual = true;
          q.decodeKey = function(){ for(let i = 0; i < q.options.length; i++){ const d = V.decodeArray(q.options[i].label); if(aKey(d.rows, d.cols) !== q.options[i].key) return 'option ' + i + ' picture does not match its key'; } return q.options[q.correct].key; };
          return q;
        }
        // f === 6: add one more row
        const r = randInt(2, 5), c = randInt(3, 8), vis = V.array(r, c), t = (r + 1) * c;
        return numeric({
          prompt: 'This array has some rows. Ivan adds ONE more row of the same size. How many dots are there now?', visual: vis, answer: t,
          hint: 'First count the rows and the dots in one row. Then there is one more row.',
          explain: ex('One more row', ['The array has <b>' + r + '</b> rows of <b>' + c + '</b>.', 'One more row makes <b>' + (r + 1) + '</b> rows of ' + c + '.', (r + 1) + ' × ' + c + ' = <b>' + t + '</b>. ✅']),
          truth: r * c + c, decode: function(){ const d = V.decodeArray(vis); return (d.rows + 1) * d.cols; },
          wrong: function(v){ return v === r * c ? 'That is the array before Ivan adds the new row. Add one more row of ' + c + '.' : (v === r * c + 1 ? 'Ivan adds a whole ROW of ' + c + ', not one dot.' : ''); }
        });
      }
    }
  });
})();
