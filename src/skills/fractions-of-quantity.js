/* frac-of-quantity — unit and non-unit fractions of a quantity (1/4 of 12, 3/4 of 20).
   Registers V.extra.fracGroups: d equal groups of `per` counters with the first `hl` groups highlighted (gold),
   plus a decoder that reads the groups, the counters per group and the highlighted groups from the drawing. */
(function(){
  function F(n, d){ return fracHTML(n, d); }
  const INK = 'var(--vis-ink,#1B1B2F)', BLUE = 'var(--vis-a,#4F8FE8)', GOLD = 'var(--vis-warm,#F2C94C)', SOFTBG = 'var(--vis-soft,#EEF1FB)', PURP = 'var(--vis-b,#9B51E0)';

  function groupsRender(d, per, hl){
    const gw = 16 + Math.min(per, 5) * 20, gh = 16 + Math.ceil(per / 5) * 20, gap = 12;
    const perRow = Math.max(1, Math.floor(320 / (gw + gap)));
    let s = '';
    for(let g = 0; g < d; g++){
      const gx = 6 + (g % perRow) * (gw + gap), gy = 6 + Math.floor(g / perRow) * (gh + gap), on = g < hl;
      s += '<rect class="fgrp' + (on ? ' hl' : '') + '" x="' + gx + '" y="' + gy + '" width="' + gw + '" height="' + gh + '" rx="12" fill="' + (on ? '#FFF3C4' : SOFTBG) + '" stroke="' + (on ? INK : PURP) + '" stroke-width="' + (on ? 3.5 : 2.5) + '"' + (on ? '' : ' stroke-dasharray="5 4"') + '/>';
      for(let k = 0; k < per; k++) s += '<circle class="fdot" cx="' + (gx + 18 + (k % 5) * 20) + '" cy="' + (gy + 18 + Math.floor(k / 5) * 20) + '" r="7.5" fill="' + (on ? GOLD : BLUE) + '" stroke="' + INK + '" stroke-width="1.3"/>';
    }
    const cols = Math.min(perRow, d), rows = Math.ceil(d / perRow);
    const w = cols * (gw + gap) + 6, h = rows * (gh + gap) + 6;
    return '<svg viewBox="0 0 ' + w + ' ' + h + '" width="' + Math.min(w, 340) + '" role="img" style="max-width:100%;height:auto;display:block;margin:0 auto" xmlns="http://www.w3.org/2000/svg">' + s + '</svg>';
  }
  V.decodeFracGroups = function(html){
    const g = html.match(/<rect[^>]*class="fgrp( hl)?"/g) || [];
    const dots = (html.match(/<circle[^>]*class="fdot"/g) || []).length;
    return { groups: g.length, hl: g.filter(function(t){ return / hl"/.test(t); }).length, per: g.length ? dots / g.length : 0, total: dots };
  };
  V.extra.fracGroups = {
    render: groupsRender,
    verify: function(a, html){ const r = V.decodeFracGroups(html); return (r.groups === a[0] && r.per === a[1] && r.hl === a[2]) ? '' : 'fracGroups draws ' + r.groups + ' groups of ' + r.per + ' with ' + r.hl + ' highlighted'; }
  };

  const THINGS = ['stickers', 'marbles', 'shells', 'sweets', 'football cards', 'buttons', 'stars', 'beads', 'seeds', 'pencils', 'flowers', 'stamps'];
  const NAMES = ['Ana', 'Marcus', 'Sophie', 'Ivan', 'Lucy', 'Diego', 'Ellen', 'Tom', 'Aisha', 'Kai', 'Mei', 'Leo'];
  function two(){ const a = pick(NAMES); let b = pick(NAMES); while(b === a) b = pick(NAMES); return [a, b]; }

  function explainOf(n, d, per, total, ans){
    return ex(n + '/' + d + ' of ' + total, [
      'The bottom number is <b>' + d + '</b>, so share ' + total + ' into ' + d + ' equal groups: ' + total + ' ÷ ' + d + ' = <b>' + per + '</b> in each group.',
      n === 1 ? 'The top number is <b>1</b>, so take just 1 group: <b>' + per + '</b>.' : 'The top number is <b>' + n + '</b>, so take ' + n + ' groups: ' + n + ' × ' + per + ' = <b>' + ans + '</b>.',
      n + '/' + d + ' of ' + total + ' is <b>' + ans + '</b>. ✅'
    ]);
  }
  function wrongsNum(n, d, per, total){
    const w = [];
    if(n > 1) w.push({ v: per, why: 'You found 1/' + d + ' of ' + total + ' (' + per + '). The top number is ' + n + ', so now multiply by ' + n + '.' });
    w.push({ v: d, why: 'That is the bottom number. Share ' + total + ' into ' + d + ' groups and count what is in the groups you take.' });
    w.push({ v: total, why: 'That is the whole amount. A fraction of it is smaller.' });
    if(n > 1) w.push({ v: n, why: 'That is the top number. You need to share first, then take ' + n + ' groups.' });
    w.push({ v: (d - n) * per, why: 'That is the part you did NOT take. Count the groups you take: ' + n + '.' });
    w.push({ v: n * per + per, why: 'That is one group too many. Take exactly ' + n + (n === 1 ? ' group.' : ' groups.') });
    return w;
  }
  function numQ(prompt, vis, n, d, per, decode){
    const total = d * per, ans = n * per;
    return mcqNum({
      prompt: prompt, visual: vis, answer: ans, wrong: wrongsNum(n, d, per, total),
      nearby: [1, -1, 2, -2, 3, -3, 4, 5],
      hint: 'Share ' + total + ' into ' + d + ' equal groups (÷ ' + d + '). Then take ' + n + (n === 1 ? ' group.' : ' groups.'),
      explain: explainOf(n, d, per, total, ans),
      truth: (total * n) / d, decode: decode
    });
  }
  function typedQ(prompt, vis, n, d, per, decode){
    const total = d * per, ans = n * per;
    return numeric({
      prompt: prompt, visual: vis || '', answer: ans,
      hint: 'First find 1/' + d + ': share into ' + d + ' equal groups (÷ ' + d + '). Then multiply by the top number.',
      explain: explainOf(n, d, per, total, ans),
      truth: (total * n) / d, decode: decode,
      wrong: function(v){
        if(n > 1 && v === per) return 'You found 1/' + d + ' (' + per + '). Now multiply by the top number ' + n + '.';
        if(v === d) return 'That is the bottom number. Divide ' + total + ' by it instead.';
        if(v === total) return 'That is the whole amount. A fraction of it is smaller.';
        if(v === (d - n) * per) return 'That is the part left over. Count the groups you take.';
        return '';
      }
    });
  }

  function pictureQ(n, d, per, tier){
    const total = d * per;
    const vis = groupsRender(d, per, n);
    const dec = function(){ const r = V.decodeFracGroups(vis); return r.hl * r.per; };
    const t = pick(THINGS);
    const prompts = [
      'The ' + total + ' counters are in ' + d + ' equal groups. ' + n + (n === 1 ? ' group is' : ' groups are') + ' gold. What is ' + F(n, d) + ' of ' + total + '?',
      'What is ' + F(n, d) + ' of ' + total + '? Look at the ' + d + ' equal groups. The gold ones show ' + F(n, d) + '.'
    ];
    return numQ(pick(prompts), vis, n, d, per, dec);
  }

  function wordQ(n, d, per, typed, withPic){
    const total = d * per, nm = two(), t = pick(THINGS);
    const forms = [
      nm[0] + ' has ' + total + ' ' + t + '. ' + nm[0] + ' gives ' + F(n, d) + ' of them to ' + nm[1] + '. How many does ' + nm[1] + ' get?',
      'A box holds ' + total + ' ' + t + '. ' + F(n, d) + ' of them are red. How many are red?',
      nm[0] + ' collects ' + total + ' ' + t + '. ' + F(n, d) + ' of them are shiny. How many are shiny?'
    ];
    const vis = withPic ? groupsRender(d, per, n) : '';
    const dec = withPic ? function(){ const r = V.decodeFracGroups(vis); return r.hl * r.per; } : undefined;
    const prompt = pick(forms);
    return typed ? typedQ(prompt, vis, n, d, per, dec) : numQ(prompt, vis, n, d, per, dec);
  }

  function leftQ(){ // two steps: how many are NOT ...
    const d = pick([3, 4, 5, 6, 8]), n = randInt(1, d - 1), per = randInt(2, 8), total = d * per, nm = pick(NAMES), t = pick(THINGS);
    const ans = (d - n) * per, taken = n * per;
    const form = pick([
      nm + ' has ' + total + ' ' + t + '. ' + nm + ' uses ' + F(n, d) + ' of them. How many are left?',
      'A bag has ' + total + ' ' + t + '. ' + F(n, d) + ' of them are blue. How many are NOT blue?'
    ]);
    return numeric({
      prompt: form, answer: ans,
      hint: 'Step 1: find ' + n + '/' + d + ' of ' + total + '. Step 2: take that away from ' + total + '.',
      explain: ex('Two steps', [
        'Share ' + total + ' into ' + d + ' equal groups: ' + total + ' ÷ ' + d + ' = <b>' + per + '</b> in each group.',
        n + '/' + d + ' of ' + total + ' is ' + n + ' × ' + per + ' = <b>' + taken + '</b>.',
        total + ' − ' + taken + ' = <b>' + ans + '</b> are left. ✅'
      ]),
      truth: total - (total * n) / d,
      wrong: function(v){ return v === taken ? 'That is the part that was used. The question asks how many are LEFT.' : v === per && n > 1 ? 'That is only 1/' + d + '. Find ' + n + '/' + d + ' first, then take it away.' : ''; }
    });
  }

  function reverseQ(){ // 1/d of a number is per. What is the number?
    const d = pick([2, 3, 4, 5, 6, 10]), per = randInt(2, 9), total = d * per;
    return numeric({
      prompt: F(1, d) + ' of a number is ' + per + '. What is the number?',
      answer: total,
      hint: 'The number was shared into ' + d + ' equal groups, and one group is ' + per + '. How many are there in all ' + d + ' groups?',
      explain: ex('Working backwards', ['One group (1/' + d + ') is <b>' + per + '</b>.', 'There are ' + d + ' equal groups, so multiply: ' + d + ' × ' + per + ' = <b>' + total + '</b>.', 'Check: ' + total + ' ÷ ' + d + ' = ' + per + '. The number is <b>' + total + '</b>. ✅']),
      truth: per * d,
      wrong: function(v){ return v === per ? 'That is the answer to the fraction, not the whole number. Multiply by ' + d + '.' : v === per + d ? 'You added. Remember ' + d + ' equal groups of ' + per + ' means multiply.' : ''; }
    });
  }

  registerSkill({
    id: 'frac-of-quantity', strand: 'fractions', name: 'Fractions of amounts', emoji: '🧮', year: 3, order: 440, prereq: ['frac-nonunit', 'multdiv-2-5-10', 'multdiv-3', 'multdiv-4'],
    lesson: {
      title: 'A fraction of a number',
      steps: [
        { say: 'To find a fraction of a number, <b>share</b> it into equal groups. 12 counters shared into <b>4</b> equal groups gives <b>3</b> in each. One group is 1/4, so <b>1/4 of 12 = 3</b>.', vis: { kind: 'fracGroups', args: [4, 3, 1] } },
        { say: 'The <b>bottom</b> number tells you how many equal groups to make. The <b>top</b> number tells you how many groups to take. Here: 2 groups, take 1.', vis: { kind: 'fracGroups', args: [2, 5, 1] },
          quiz: { prompt: 'What is 1/2 of 10?', options: [{ label: '5', ok: true }, { label: '2', ok: false }, { label: '10', ok: false }], right: 'Yes! 10 shared into 2 groups is 5 in each. 1/2 of 10 = 5.', wrong: 'Share 10 into 2 equal groups: 5 in each group. Take 1 group, so 1/2 of 10 = 5.' } },
        { say: 'What about <b>3/4 of 12</b>? Share 12 into 4 groups of 3, then take <b>3 groups</b>. 3 groups of 3 is 9. So <b>3/4 of 12 = 9</b>.', vis: { kind: 'fracGroups', args: [4, 3, 3] },
          quiz: { prompt: 'What is 3/4 of 12?', options: [{ label: '9', ok: true }, { label: '3', ok: false }, { label: '4', ok: false }], right: 'Yes! 3 groups × 3 = 9.', wrong: 'Each group has 3 and we take 3 groups: 3 × 3 = 9. Not just one group!' } },
        { say: 'Two jobs: <b>1)</b> divide by the bottom number, <b>2)</b> multiply by the top number. For 2/5 of 10: 10 ÷ 5 = 2, then 2 × 2 = <b>4</b>.', vis: { kind: 'fracGroups', args: [5, 2, 2] },
          quiz: { prompt: 'What is 2/5 of 10?', options: [{ label: '4', ok: true }, { label: '2', ok: false }, { label: '5', ok: false }], right: 'Yes! 10 ÷ 5 = 2 and 2 × 2 = 4.', wrong: '10 ÷ 5 = 2 in each group, then take 2 groups: 2 × 2 = 4.' } }
      ]
    },
    trick: {
      title: 'Bottom shares, top takes',
      say: 'The <b>bottom</b> number <b>shares</b> (divide). The <b>top</b> number <b>takes</b> (multiply). Do the sharing first, then the taking. Never answer with the bottom number itself!',
      vis: { kind: 'fracGroups', args: [5, 4, 3] },
      example: '3/5 of 20 → 20 ÷ 5 = 4 → 4 × 3 = <b>12</b>'
    },
    gen: {
      1: function(){
        const d = pick([2, 3, 4]), per = randInt(2, 5);
        if(chance(0.7)) return pictureQ(1, d, per, 1);
        return wordQ(1, d, per, false, true);
      },
      2: function(){
        const r = randInt(0, 4);
        if(r <= 1){ const d = pick([2, 3, 4, 5]), n = pick([1, 1, 2, 3].filter(function(x){ return x < d; })), per = randInt(2, 6); return pictureQ(n, d, per, 2); }
        const d = pick([2, 3, 4, 5, 6, 8]), n = r === 2 ? 1 : randInt(1, d - 1), per = randInt(2, 8);
        return wordQ(n, d, per, false, chance(0.4) && d <= 5 && per <= 6);
      },
      3: function(){
        const r = randInt(0, 5);
        if(r === 0) return leftQ();
        if(r === 1) return reverseQ();
        const d = pick([3, 4, 5, 6, 8, 10]), n = randInt(1, d - 1), per = randInt(2, 10);
        if(r === 2){ return typedQ('What is ' + F(n, d) + ' of ' + (d * per) + '?', '', n, d, per); }
        if(r === 3 && d <= 5 && per <= 6) return typedQ('What is ' + F(n, d) + ' of ' + (d * per) + '?', groupsRender(d, per, n), n, d, per, function(){ const g = V.decodeFracGroups(groupsRender(d, per, n)); return g.hl * g.per; });
        return wordQ(n, d, per, true, false);
      }
    }
  });
})();
