/* MEASURE — money: coins and notes, £ and p, adding, change, "enough money?" (all amounts kept in PENCE) */
(function(){
  const NAMES = ['Ana', 'Marcus', 'Sophie', 'Ivan', 'Lucy', 'Diego', 'Ellen', 'Tom', 'Aisha', 'Kai', 'Mei', 'Leo'];
  const ITEMS = ['a bun', 'an apple', 'a pencil', 'a rubber', 'a lolly', 'a comic', 'a sticker book', 'a balloon', 'a postcard', 'a bookmark', 'a keyring', 'a banana', 'a sharpener', 'a cookie'];
  const ITEM_PL = ['buns', 'apples', 'pencils', 'rubbers', 'lollies', 'comics', 'sticker books', 'balloons', 'postcards', 'bookmarks', 'keyrings', 'bananas', 'sharpeners', 'cookies'];

  function mt(p){ return p < 100 ? p + 'p' : '£' + (p % 100 === 0 ? String(p / 100) : (p / 100).toFixed(2)); }   // natural text
  function fp(p){ return '£' + (p / 100).toFixed(2); }                                                           // option label, pounds mode
  function fq(p){ return p + 'p'; }                                                                              // option label, pence mode
  function fmtFor(a){ return a >= 100 ? fp : fq; }
  function sumKey(list){ const c = {}; list.forEach(function(d){ c[d] = (c[d] || 0) + 1; }); return Object.keys(c).reduce(function(t, d){ return t + (+d) * c[d]; }, 0); }  // independent: denomination x how many
  function sum(list){ return list.reduce(function(a, b){ return a + b; }, 0); }
  function desc(list){ return list.slice().sort(function(a, b){ return b - a; }); }

  // a random, tidy way to make `total` from the pool (few coins), largest first
  function coinsFor(total, pool, maxN){
    for(let t = 0; t < 80; t++){
      let rem = total; const out = [];
      while(rem > 0 && out.length <= maxN){
        const ok = pool.filter(function(d){ return d <= rem; });
        const c = chance(0.55) ? Math.max.apply(null, ok) : pick(ok);
        out.push(c); rem -= c;
      }
      if(rem === 0 && out.length <= maxN) return desc(out);
    }
    const out = []; let rem = total;
    pool.slice().sort(function(a, b){ return b - a; }).forEach(function(d){ while(rem >= d){ out.push(d); rem -= d; } });
    return out;
  }
  function phrase(arr){ return arr.length > 1 ? arr.map(mt).join(' + ') + ' = <b>' + mt(sum(arr)) + '</b>' : '<b>' + mt(arr[0]) + '</b>'; }
  function addUp(list){   // explanation lines for adding coins
    const big = list.filter(function(c){ return c >= 100; }), small = list.filter(function(c){ return c < 100; });
    const st = [];
    if(big.length && small.length){
      st.push('Pounds first: ' + phrase(big) + '.');
      st.push('Now the pence: ' + phrase(small) + '.');
    } else if(list.length > 1) {
      st.push('Add them one at a time: ' + phrase(list) + '.');
    } else {
      st.push('There is just one coin, worth <b>' + mt(list[0]) + '</b>.');
    }
    return st;
  }
  function two(){ const a = randInt(0, ITEMS.length - 1); let b = randInt(0, ITEMS.length - 1); while(b === a) b = randInt(0, ITEMS.length - 1); return [ITEMS[a], ITEMS[b]]; }
  // the "count up" way of finding change, as words
  function countUp(price, pay){
    const next = Math.ceil(price / 10) * 10;
    if(price % 100 === 0 || pay - price <= 0) return '';
    const bits = [];
    let cur = price;
    if(next > cur && next < pay){ bits.push(mt(next - cur) + ' to reach ' + mt(next)); cur = next; }
    const nextP = Math.ceil(cur / 100) * 100;
    if(nextP > cur && nextP < pay){ bits.push(mt(nextP - cur) + ' to reach ' + mt(nextP)); cur = nextP; }
    bits.push(mt(pay - cur) + ' to reach ' + mt(pay));
    return 'Count up from ' + mt(price) + ': ' + bits.join(', then ') + '.';
  }

  registerSkill({
    id: 'measure-money', strand: 'measure', name: 'Money: coins, £ and p, change', emoji: '🪙', year: 3, order: 660, prereq: ['number-place-value'],
    lesson: {
      title: 'Coins, pounds and change',
      steps: [
        { say: 'Every coin has a <b>value</b>. To find how much money you have, add up what each coin is <b>worth</b>. Here: 10p + 5p + 2p = <b>17p</b>.', vis: { kind: 'coins', args: [[10, 5, 2]] } },
        { say: 'A pound coin is worth <b>100p</b>. So <b>£1</b> and a 50p coin make 100p + 50p = <b>150p</b>.', vis: { kind: 'coins', args: [[100, 50]] } },
        { say: 'We can write money with a <b>£ sign and a point</b>. 100p + 45p = 145p = <b>£1.45</b>. The numbers after the point are the pence.', vis: { kind: 'coins', args: [[100, 20, 20, 5]] },
          quiz: { prompt: 'How many pence is £1.45?', options: [{ label: '145p', ok: true }, { label: '14p', ok: false }, { label: '1450p', ok: false }], right: 'Yes! £1 is 100p, and 45p more makes 145p.', wrong: 'Think: £1 is 100p, then add the 45p. That is 145p.' } },
        { say: '<b>Change</b> is what the shop gives back. Pay £1 for a 65p lolly? Count up: 65p → 70p is 5p, 70p → £1 is 30p. 5p + 30p = <b>35p</b> change.', vis: { kind: 'coins', args: [[20, 10, 5]] } },
        { say: 'To check if you have <b>enough</b> money, add up your coins, then compare with the price. 70p is <b>not enough</b> for a 75p cookie: you need 5p more.', vis: { kind: 'coins', args: [[50, 20]] },
          quiz: { prompt: 'You have these coins (70p). A balloon costs 60p. Is it enough?', options: [{ label: 'Yes, 70p is more than 60p', ok: true }, { label: 'No, it is not enough', ok: false }], right: 'Yes! 70p is more than 60p, so you have enough.', wrong: '70p is bigger than 60p, so you do have enough.' } }
      ]
    },
    trick: {
      title: 'Count up to give change',
      say: 'Do not take away — <b>count up</b> like a shopkeeper! Start at the price, jump to the next <b>10p</b>, then jump to the next <b>pound</b>. Add the jumps up and that is your change.',
      vis: { kind: 'coins', args: [[20, 10, 5]] },
      example: 'Price 65p, pay £1: 65p → 70p (<b>5p</b>) → £1 (<b>30p</b>). 5p + 30p = <b>35p change</b>'
    },
    gen: {
      1: function(){
        return pick([t1Coins, t1Coins, t1Pounds, t1Which])();
      },
      2: function(){
        return pick([t2Coins, t2Notation, t2Add, t2Change, t2Enough, t2Enough, t2Add, t2Change])();
      },
      3: function(){
        return pick([t3TwoStep, t3Change, t3Notes, t3Which, t3Times, t3Enough, t3TwoStep, t3Change, t3Enough])();
      }
    }
  });

  /* ------------------------------ tier 1 ------------------------------ */
  function t1Coins(){
    const n = randInt(2, 4); let list, total;
    do { list = []; for(let i = 0; i < n; i++) list.push(pick([1, 2, 5, 5, 10, 10, 20, 20])); total = sum(list); } while(total > 60 || total < 6);
    list = desc(list);
    const vis = V.coins(list);
    return mcqNum({
      prompt: 'How much money is this?', visual: vis, answer: total, fmt: fq,
      wrong: [
        { v: n, why: 'You counted the coins. Add up what each coin is WORTH instead.' },
        { v: total - list[0], why: 'It looks like the biggest coin was left out. Add every coin.' },
        { v: total + list[list.length - 1], why: 'One coin was counted twice. Add each coin just once.' }
      ],
      nearby: [10, -10, 5, -5, 1, -1, 2, -2, 20, -20],
      hint: 'Say the value on each coin, then add them one at a time. Start with the biggest.',
      explain: ex('Adding coins', ['Each coin shows its value: ' + list.map(mt).join(', ') + '.'].concat(addUp(list)).concat(['So the money is <b>' + fq(total) + '</b>. ✅'])),
      truth: sumKey(list), decode: function(){ return V.decodeCoins(vis); }
    });
  }
  function t1Pounds(){
    const N = randInt(1, 5);
    return mcqNum({
      prompt: '£' + N + ' is the same as how many pence?', answer: N * 100, fmt: fq,
      wrong: [
        { v: N * 10, why: '£1 is 100p, not 10p. Count in hundreds.' },
        { v: N, why: 'The number of pounds is not the number of pence. Each £1 is 100p.' },
        { v: N * 100 + N, why: 'Do not add the pounds on. Each £1 is exactly 100p.' }
      ],
      nearby: [100, -100, 200, -200, 1000, 10],
      hint: '£1 = 100p. Count in hundreds: 100, 200, …',
      explain: ex('Pounds to pence', ['£1 is the same as <b>100p</b>.', 'So £' + N + ' is ' + Array(N).fill('100p').join(' + ') + '.', 'Counting in hundreds gives <b>' + (N * 100) + 'p</b>. ✅']),
      truth: sumKey(Array(N).fill(100))
    });
  }
  function t1Which(){
    const target = pick([15, 20, 25, 30, 35, 40, 45, 50, 55]);
    const pool = [1, 2, 5, 10, 20];
    const tots = shuffle([target + 5, target - 5, target + 10, target - 10, target + 1, target - 2, target + 2, target + 20].filter(function(t){ return t > 0 && t !== target; }));
    const ds = tots.map(function(t){ const l = coinsFor(t, pool, 5); return opt(K.num(t), V.coins(l), 'That picture adds up to ' + t + 'p, not ' + target + 'p. Add the coins to check.'); });
    const good = coinsFor(target, pool, 5);
    const q = mcq({
      prompt: 'Which coins make ' + target + 'p?', visual: '',
      correct: opt(K.num(target), V.coins(good)), distractors: ds, count: 3,
      hint: 'Add up the coins in each picture. Which one makes exactly ' + target + 'p?',
      explain: ex('Finding ' + target + 'p', ['Add the coins in each picture.', 'The right one is ' + good.map(mt).join(' + ') + '.', 'That makes <b>' + target + 'p</b>. ✅']),
      truth: K.num(sumKey(good))
    });
    q.optionsAreVisual = true;
    q.decodeKey = function(){ for(let i = 0; i < q.options.length; i++) if(K.num(V.decodeCoins(q.options[i].label)) !== q.options[i].key) return 'option ' + i + ' picture does not match its key'; return q.options[q.correct].key; };
    return q;
  }

  /* ------------------------------ tier 2 ------------------------------ */
  function t2Coins(){
    let list, total;
    do {
      list = [];
      for(let i = randInt(1, 2); i > 0; i--) list.push(pick([100, 100, 200]));
      for(let i = randInt(1, 3); i > 0; i--) list.push(pick([5, 10, 20, 50]));
      total = sum(list);
    } while(total > 400);
    list = desc(list);
    const vis = V.coins(list);
    const lowball = list.reduce(function(t, c){ return t + (c >= 100 ? c / 100 : c); }, 0);
    const smalls = sum(list.filter(function(c){ return c < 100; }));
    return mcqNum({
      prompt: 'How much money is this?', visual: vis, answer: total, fmt: fp,
      wrong: [
        { v: lowball, why: 'A £1 coin is worth 100p, not 1p (and a £2 coin is 200p).' },
        { v: smalls, why: 'You left out the pound coins. Add them too.' },
        { v: total - list[list.length - 1], why: 'One coin was missed. Add every coin.' },
        { v: list.length, why: 'You counted the coins. Add what they are WORTH.' }
      ],
      nearby: [10, -10, 50, -50, 5, -5, 20, -20, 100, -100],
      hint: 'Add the pound coins first, then add the pence. Remember £1 = 100p.',
      explain: ex('Adding pounds and pence', addUp(list).concat(['Together: <b>' + fp(total) + '</b>. ✅'])),
      truth: sumKey(list), decode: function(){ return V.decodeCoins(vis); }
    });
  }
  function t2Notation(){
    if(chance(0.5)){ // pence -> pounds notation
      const pounds = randInt(1, 4), pence = randInt(1, 19) * 5, p = pounds * 100 + pence;
      return mcqNum({
        prompt: 'Write ' + p + 'p using the £ sign.', answer: p, fmt: fp,
        wrong: [
          { v: p * 10, why: 'The point goes after the pounds: 100p is £1, so only the last two digits are pence.' },
          { v: pence, why: 'You left out the whole pounds. ' + p + 'p is more than £1.' },
          { v: pounds * 100 + (pence % 10) * 10 + Math.floor(pence / 10), why: 'The digits got swapped. The last two digits are the pence, in the same order.' },
          { v: p * 100, why: 'That is far too many pounds. 100p make just £1.' }
        ],
        nearby: [10, -10, 50, -50, 5, -5, 100, -100],
        hint: '100p = £1. Split ' + p + 'p into whole pounds and the pence that are left.',
        explain: ex('Pence to pounds', [p + 'p = ' + pounds * 100 + 'p + ' + pence + 'p.', pounds * 100 + 'p is <b>£' + pounds + '</b> and the rest is <b>' + pence + 'p</b>.', 'We write the pounds, a point, then the pence: <b>' + fp(p) + '</b>. ✅']),
        truth: pounds * 100 + pence
      });
    }
    const pounds = randInt(1, 5), pence = pick([5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 55, 60, 65, 70, 75, 80, 85, 90, 95]), p = pounds * 100 + pence;
    return mcqNum({
      prompt: '£' + pounds + '.' + pad2(pence) + ' is the same as how many pence?', answer: p, fmt: fq,
      wrong: [
        { v: pence, why: 'You forgot the ' + pounds + ' whole pound(s). Each £1 is 100p.' },
        { v: pounds * 100, why: 'You forgot the ' + pence + ' pence on the end.' },
        { v: p * 10, why: 'Only £1 = 100p. Do not add extra zeros.' },
        { v: pounds * 100 + (pence % 10) * 10 + Math.floor(pence / 10), why: 'The pence digits got swapped.' }
      ],
      nearby: [10, -10, 100, -100, 5, -5, 50, -50],
      hint: 'Turn the pounds into pence (×100) and then add the pence.',
      explain: ex('Pounds to pence', ['£' + pounds + ' is ' + pounds + ' × 100p = <b>' + pounds * 100 + 'p</b>.', 'Now add the ' + pence + 'p on the end: ' + pounds * 100 + 'p + ' + pence + 'p.', 'That is <b>' + p + 'p</b>. ✅']),
      truth: sum([pounds * 100, pence])
    });
  }
  function t2Add(){
    const a = randInt(3, 14) * 5, b = randInt(3, 12) * 5 + (chance(0.4) ? 2 : 0), tot = a + b, it = two(), nm = pick(NAMES);
    const sub = Math.abs(a - b);
    return mcqNum({
      prompt: nm + ' buys ' + it[0] + ' for ' + mt(a) + ' and ' + it[1] + ' for ' + mt(b) + '. How much does ' + nm + ' spend altogether?',
      answer: tot, fmt: fmtFor(tot),
      wrong: [
        { v: sub, why: '"Altogether" means ADD the two prices, not take one away.' },
        { v: tot - 10, why: 'Check the tens: when the pence add to more than 10 you need to carry.' },
        { v: Math.max(a, b), why: 'That is only the dearer item. Add both prices.' },
        { v: tot + 10, why: 'Careful with the carrying. Add the units, then the tens.' }
      ],
      nearby: [5, -5, 20, -20, 10, -10, 1, -1, 30],
      valid: function(v){ return v > 0 && (tot >= 100 || true); },
      hint: 'Add the two prices. Add the pence in the units first, then the tens.',
      explain: ex('Adding two prices', ['Add ' + mt(a) + ' and ' + mt(b) + ', in pence: ' + a + 'p + ' + b + 'p.', 'Tens: ' + Math.floor(a / 10) * 10 + ' + ' + Math.floor(b / 10) * 10 + ' = ' + (Math.floor(a / 10) * 10 + Math.floor(b / 10) * 10) + '. Units: ' + (a % 10) + ' + ' + (b % 10) + ' = ' + (a % 10 + b % 10) + '.', 'Together: ' + tot + 'p' + (tot >= 100 ? ', which is <b>' + fp(tot) + '</b>' : '') + '. So the answer is <b>' + fmtFor(tot)(tot) + '</b>. ✅']),
      truth: (a + 100) + (b - 100)
    });
  }
  function t2Change(){
    const price = randInt(1, 19) * 5, ch = 100 - price, nm = pick(NAMES), it = pick(ITEMS);
    return mcqNum({
      prompt: nm + ' pays with a £1 coin for ' + it + ' that costs ' + price + 'p. How much change does ' + nm + ' get?',
      answer: ch, fmt: fq,
      wrong: [
        { v: price, why: 'That is the price. The change is what is left from £1.' },
        { v: ch + 10, why: 'Close! Check the count-up: the jump to the next ten may be wrong.' },
        { v: ch - 10, why: 'Close! Check the count-up: you may have jumped one ten too far.' },
        { v: 100 + price, why: 'Change means taking away, not adding. £1 = 100p, so take the price away.' }
      ],
      nearby: [5, -5, 20, -20, 15, -15, 25],
      valid: function(v){ return v > 0; },
      hint: 'Count up from ' + price + 'p to 100p. Jump to the next 10p first.',
      explain: ex('Change from £1', [countUp(price, 100) || ('Take ' + price + 'p from 100p.'), '£1 is 100p, and 100p − ' + price + 'p = <b>' + ch + 'p</b>.', 'The change is <b>' + ch + 'p</b>. ✅']),
      truth: 10 * (10 - Math.ceil(price / 10)) + (Math.ceil(price / 10) * 10 - price)
    });
  }
  function t2Enough(){
    const nm = pick(NAMES), it = pick(ITEMS);
    let has, price;
    do {
      has = randInt(8, 36) * 5; price = has + randInt(-6, 6) * 5;
    } while(price < 20 || price === has && chance(0.5));
    const list = coinsFor(has, [5, 10, 20, 50, 100], 6);
    const vis = V.coins(list);
    const enough = has >= price;
    return mcq2({
      prompt: nm + ' has these coins. ' + (it.charAt(0).toUpperCase() + it.slice(1)) + ' costs ' + mt(price) + '. Does ' + nm + ' have enough money?', visual: vis,
      correct: opt(K.bool(enough), enough ? 'Yes' : 'No', ''),
      other: opt(K.bool(!enough), enough ? 'No' : 'Yes', enough ? nm + ' has ' + mt(has) + ', and that is ' + (has === price ? 'exactly the price' : 'more than ' + mt(price)) + '. So there IS enough.' : nm + ' has ' + mt(has) + ' but needs ' + mt(price) + ' — that is ' + mt(price - has) + ' short.'),
      hint: 'First add up all the coins. Then compare that total with the price.',
      explain: ex('Is it enough?', addUp(list).slice(0, 2).concat(['Total: <b>' + mt(has) + '</b>. The price is <b>' + mt(price) + '</b>.', enough ? mt(has) + (has === price ? ' is exactly the price' : ' is more than ' + mt(price)) + ', so the answer is <b>Yes</b>. ✅' : mt(has) + ' is less than ' + mt(price) + ' (' + mt(price - has) + ' short), so the answer is <b>No</b>. ✅'])),
      truth: K.bool(!(price > sumKey(list))), decode: function(){ return K.bool(V.decodeCoins(vis) >= price); }
    });
  }

  /* ------------------------------ tier 3 ------------------------------ */
  function t3TwoStep(){
    const pay = pick([100, 100, 200]);
    let a, b;
    do { a = randInt(5, pay === 100 ? 70 : 140) ; b = randInt(5, pay === 100 ? 60 : 130); if(pay === 100){ a = Math.round(a / 1); } } while(a + b >= pay || a + b < pay - 90 || a === b);
    const nm = pick(NAMES), it = two(), spent = a + b, ch = pay - spent;
    return numeric({
      prompt: nm + ' buys ' + it[0] + ' for ' + mt(a) + ' and ' + it[1] + ' for ' + mt(b) + '. ' + nm + ' pays with ' + (pay === 100 ? 'a £1 coin' : 'a £2 coin') + '. How many pence change does ' + nm + ' get?',
      answer: ch, unit: 'p',
      hint: 'Step 1: add the two prices. Step 2: count up (or take away) from what ' + nm + ' paid.',
      explain: ex('Two steps', ['Spent: ' + a + 'p + ' + b + 'p = <b>' + spent + 'p</b>.', 'Paid: ' + mt(pay) + ' = ' + pay + 'p.', 'Change: ' + pay + 'p − ' + spent + 'p = <b>' + ch + 'p</b>. ✅']),
      truth: (pay - a) - b,
      wrong: function(v){ return v === spent ? 'That is how much was SPENT. Now take it away from ' + pay + 'p to find the change.' : (v === pay - a || v === pay - b) ? 'You took away only one of the two prices.' : ''; }
    });
  }
  function t3Change(){
    const pay = pick([500, 500, 1000]);
    const price = pay === 500 ? randInt(21, 98) * 5 : randInt(21, 189) * 5;
    const ch = pay - price, nm = pick(NAMES), it = pick(['a book', 'a toy rocket', 'a football', 'a puzzle', 'a board game', 'a T-shirt', 'a pencil case', 'a kite']);
    return mcqNum({
      prompt: it.charAt(0).toUpperCase() + it.slice(1) + ' costs ' + mt(price) + '. ' + nm + ' pays with a ' + mt(pay) + ' note. How much change does ' + nm + ' get?',
      answer: ch, fmt: fmtFor(ch),
      wrong: [
        { v: ch + 100, why: 'Careful: you may have given £1 too much. Count up to the next pound, then on to the note.' },
        { v: ch - 100, why: 'Careful: you may have given £1 too little. Check the jump to the next pound.' },
        { v: ch + 10, why: 'Close! Check the first jump (to the next 10p).' },
        { v: ch - 10, why: 'Close! Check the first jump (to the next 10p).' },
        { v: price, why: 'That is the price. Change is what is left from the note.' }
      ],
      nearby: [50, -50, 5, -5, 20, -20],
      valid: function(v){ return v > 0; },
      hint: 'Count up from the price to the next pound, then up to the note. Add the jumps.',
      explain: ex('Change from ' + mt(pay), [countUp(price, pay) || ('Take ' + mt(price) + ' from ' + mt(pay) + '.'), 'Add the jumps up: that gives <b>' + fmtFor(ch)(ch) + '</b>.', 'Check: ' + mt(price) + ' + ' + mt(ch) + ' = ' + mt(pay) + '. ✅']),
      truth: (Math.ceil(price / 100) * 100 - price) + (pay - Math.ceil(price / 100) * 100)
    });
  }
  function t3Notes(){
    let list, total;
    do {
      list = [pick([500, 1000, 1000])];
      for(let i = randInt(1, 2); i > 0; i--) list.push(pick([100, 200, 200, 50, 20]));
      if(chance(0.5)) list.push(pick([5, 10, 20, 50]));
      total = sum(list);
    } while(total > 1500);
    list = desc(list);
    const vis = V.coins(list);
    return mcqNum({
      prompt: 'How much money is this?', visual: vis, answer: total, fmt: fp,
      wrong: [
        { v: total - list[0] + list[0] / 100, why: 'A note is worth many pounds — a ' + mt(list[0]) + ' note is ' + list[0] + 'p, not ' + list[0] / 100 + 'p.' },
        { v: total - list[0], why: 'The note was left out. Add it too!' },
        { v: total - list[list.length - 1], why: 'One coin was missed. Add every coin.' },
        { v: list.length, why: 'You counted the notes and coins. Add what they are WORTH.' }
      ],
      nearby: [100, -100, 50, -50, 10, -10, 200, -200, 500, -500],
      hint: 'Add the note and the pound coins first, then the pence coins.',
      explain: ex('Adding notes and coins', addUp(list).concat(['Together: <b>' + fp(total) + '</b>. ✅'])),
      truth: sumKey(list), decode: function(){ return V.decodeCoins(vis); }
    });
  }
  function t3Which(){
    const pounds = randInt(1, 3), pence = randInt(2, 19) * 5, target = pounds * 100 + pence;
    const swapped = pounds * 100 + (pence % 10) * 10 + Math.floor(pence / 10);
    const cand = [swapped, target + 5, target - 5, target + 50, target - 50, target + 100, target - 100, target + 10, target - 10, target + 20, target - 20]
      .filter(function(t){ return t > 0 && t !== target && t % 5 === 0; });
    const pool = [5, 10, 20, 50, 100, 200];
    const ds = cand.map(function(t){ return opt(K.num(t), V.coins(coinsFor(t, pool, 6)), 'That picture is worth ' + fp(t) + ', not ' + fp(target) + '.'); });
    const good = coinsFor(target, pool, 6);
    const q = mcq({
      prompt: 'Which coins make ' + fp(target) + '?', visual: '',
      correct: opt(K.num(target), V.coins(good)), distractors: ds, count: 3, keepOrder: true,
      hint: 'Write ' + fp(target) + ' as pence first (' + target + 'p). Then add the coins in each picture.',
      explain: ex('Finding ' + fp(target), [fp(target) + ' is ' + target + 'p.', 'The right picture: ' + good.map(mt).join(' + ') + '.', 'That adds to <b>' + fp(target) + '</b>. ✅']),
      truth: K.num(sumKey(good))
    });
    q.optionsAreVisual = true;
    q.decodeKey = function(){ for(let i = 0; i < q.options.length; i++) if(K.num(V.decodeCoins(q.options[i].label)) !== q.options[i].key) return 'option ' + i + ' picture does not match its key'; return q.options[q.correct].key; };
    return q;
  }
  function t3Times(){
    const n = randInt(3, 6), price = pick([15, 20, 25, 30, 35, 40, 45]), k = randInt(0, ITEM_PL.length - 1), nm = pick(NAMES);
    return numeric({
      prompt: nm + ' buys ' + n + ' ' + ITEM_PL[k] + '. Each one costs ' + price + 'p. How many pence do they cost altogether?',
      answer: n * price, unit: 'p',
      hint: 'Add ' + price + 'p again and again ' + n + ' times, or multiply ' + price + ' × ' + n + '.',
      explain: ex('Lots of the same price', [n + ' lots of ' + price + 'p.', price + ' × ' + n + ' = ' + Array(n).fill(price).join(' + ') + '.', 'The total is <b>' + (n * price) + 'p</b>. ✅']),
      truth: Array(n).fill(price).reduce(function(a, b){ return a + b; }, 0),
      wrong: function(v){ return v === price + n ? 'You added the two numbers. Multiply them: ' + n + ' lots of ' + price + 'p.' : ''; }
    });
  }
  function t3Enough(){
    const nm = pick(NAMES), k = randInt(0, ITEM_PL.length - 1), n = randInt(2, 5), price = randInt(3, 19) * 5, tot = n * price;
    let has;
    do { has = tot + randInt(-8, 8) * 5; } while(has < 20 || has > 600);
    const list = coinsFor(has, [5, 10, 20, 50, 100, 200], 7);
    const vis = V.coins(list);
    const enough = has >= tot;
    return mcq2({
      prompt: nm + ' has these coins and wants ' + n + ' ' + ITEM_PL[k] + ' at ' + mt(price) + ' each. Does ' + nm + ' have enough money?', visual: vis,
      correct: opt(K.bool(enough), enough ? 'Yes' : 'No', ''),
      other: opt(K.bool(!enough), enough ? 'No' : 'Yes', enough ? 'The ' + n + ' items cost ' + mt(tot) + ' and ' + nm + ' has ' + mt(has) + '. That is enough.' : 'The ' + n + ' items cost ' + mt(tot) + ' but ' + nm + ' only has ' + mt(has) + '.'),
      hint: 'Two jobs: find the cost of all the items, and add up the coins. Then compare.',
      explain: ex('Two-step: is it enough?', [n + ' × ' + mt(price) + ' = ' + n + ' lots of ' + price + 'p = <b>' + mt(tot) + '</b>.', 'The coins add up to <b>' + mt(has) + '</b>.', enough ? mt(has) + (has === tot ? ' is exactly' : ' is more than') + ' ' + mt(tot) + ', so the answer is <b>Yes</b>. ✅' : mt(has) + ' is less than ' + mt(tot) + ', so the answer is <b>No</b>. ✅']),
      truth: K.bool(!(Array(n).fill(price).reduce(function(a, b){ return a + b; }, 0) > sumKey(list))), decode: function(){ return K.bool(V.decodeCoins(vis) >= tot); }
    });
  }
})();
