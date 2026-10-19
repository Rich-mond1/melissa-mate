# Matemagics v4 — skill authoring spec

Audience: **Melissa, 8 years old, UK Year 3** (England National Curriculum), catching up and then moving toward Year 4.
Voice: warm, playful, short sentences, **British English** (colour, centre, metre, “quarter past”). Never patronising, never scary.
Goal: she must **learn** (lesson → trick → practice), not just guess. A parent reads her errors, so every wrong answer needs a *reason*.

## What you deliver
One or more files `src/skills/<your-strand>*.js`. Each file is an IIFE that calls `registerSkill({...})`.
Globals available (same in Node auditor and browser): everything exported by `src/core.js` and `src/visuals.js` (`V`, `K`, `opt`, `mcq`, `mcqNum`, `mcq2`, `numeric`, `shade`, `setclock`, `order`, `ex`, `randInt`, `pick`, `chance`, `shuffle`, `sample`, `pad2`, `plural`, `gcd`, `money`, `numWord`, `fracHTML`, `registerSkill`).
**Do not edit `core.js`, `visuals.js`, `tools/` or other strands’ files.** If you need a new picture type, register it in your own file via `V.extra.<kind> = {render, verify}` (see below).
Read the two reference skills first: `src/skills/time-quarters.js`, `src/skills/fractions-read.js`. Copy their patterns.

## The test you must pass
```
node tools/audit.js --files <your-file-prefix> --n 2500      # loads only core, visuals and YOUR files (other agents work in parallel)
```
exit code 0, “AUDIT PASSED”. Run it often. It checks **every tier of every skill, 2 500 times each**.
You are NOT finished until it passes at `--n 3000` and you have also read 10+ printed sample questions per skill yourself (write a throw-away script that prints prompt, options, correct index, hint, explain) and confirmed the **maths is right and the wording makes sense to an 8-year-old**.

## Skill definition
```js
registerSkill({
  id:'mult-3', strand:'multdiv', name:'The 3 times table', emoji:'3️⃣', year:3 /*2 review,3,4 bridge*/,
  order:312,            // unique within your range; lower = earlier on the map
  prereq:['mult-2-5-10'],
  lesson:{ title, steps:[ {say:'html', vis:{kind,args}, quiz:{prompt, options:[{label,ok}], right, wrong}} ... ] }, // 3-6 steps, >=1 picture, >=1 quiz
  trick:{ title, say:'html', vis:{kind,args}|null, example:'html' },                // a genuinely useful “magic trick” for this skill
  gen:{ 1:function(){...}, 2:function(){...}, 3:function(){...} }                  // each returns ONE question
});
```
* `say` text: ≤ 40 words per step, `<b>` on the key words. Teach with the picture: the first step introduces the idea, the last one has a quiz.
* **Lesson/trick pictures are data**: `vis:{kind:'clock',args:[3,30]}`. The auditor draws it, *decodes the drawing*, and fails if it differs from the numbers you claim. Kinds: `clock digital fractionBar fractionCircle numberLine baseTen array groups dots ruler jug dial barChart pictogram tally coins angle shape2D circle shape3D linePair grid barModel html`. (See `V.render`/`V.verify` at the bottom of `visuals.js` for argument lists; `html` is unverified — use only for pure text/tables.)
* Tiers: **1 = Guided** (small numbers, picture does most of the work, 2-3 options fine, concept first meeting), **2 = Practice** (normal Year 3 level), **3 = Challenge** (harder numbers, Year 4 bridge, interactive types, two-step, “which picture shows…?”).

## Question builders (all return a validated shape)
* `mcq({prompt, visual, correct:opt(key,label), distractors:[opt(key,label,why)], keepOrder:true, count:4|3|2, hint, explain, truth, decode})`
* `mcqNum({prompt, visual, answer, wrong:[{v,why}], fmt, valid, hint, explain, truth, decode})` – numeric options with misconception values first, then nearby fill.
* `mcq2({... correct, other})` – two choices (True/False, Yes/No, Bar A/Bar B).
* `numeric({prompt, visual, answer, unit, hint, explain, truth, decode, wrong:function(v){return 'why'}})` – child types the number (use for tier 2-3 where guessing must be impossible).
* `shade({prompt, den, num, hint, explain})`, `setclock({prompt, hour, minute, step, hint, explain})`, `order({prompt, items:[{key,label}] in CORRECT order, hint, explain, truth})` – interactive.
* `opt(key, label, why)` – `key` is the canonical meaning (use `K.num`, `K.frac`, `K.time`, `K.text`, `K.bool`); two options with the same key are impossible (equal fractions, equal times…). `why` is shown to the child **and the parent** when this wrong option is picked — make it name the misconception (“You added instead of multiplying”).

## The five laws (the old app broke these; the auditor enforces them)
1. **truth is recomputed independently.** `truth:` must come from the raw numbers by a *different expression* than the one that built `correct` (e.g. build `correct` from a lookup, truth by arithmetic). Mismatch = fail.
2. **The picture is decoded.** Pass `decode:function(){ return K.xxx(V.decodeYyy(htmlYouRendered)...) }` so the auditor reads the answer back out of the *drawing’s geometry*. For picture-option questions decode **every** option (see reference) and set `optionsAreVisual = true`.
3. **The correct answer is always present, exactly once, and no distractor can also be right.** Think about equivalent answers (2/4 vs 1/2, 3×4 vs 4×3, 10:00 vs ten o’clock). Use keys.
4. **Distractors are misconceptions first** (order matters with `keepOrder:true`), filler last. Provide enough candidates that de-duplication can never starve the question (deep fallback pool).
5. **Every explanation states the answer** (as digits/words that appear in the option label) and walks through *why* in 3-4 short steps with `<b>` highlights, using a different method than a bare restatement. Every question has a useful **hint** that does not give the answer away.

## Picture decoders available (use them in `decode`)
`V.decodeClock(html)→{h,m}` `V.decodeDigital` `V.decodeFractionBar/Circle(html)→{num,den}` `V.decodeNumberLine(html)→value of first marker` `V.decodeBaseTen→number` `V.decodeArray→{rows,cols,total}` `V.decodeGroups→{groups,per,total}` `V.decodeDots` `V.decodeRuler→length(cm)` `V.decodeJug` `V.decodeDial` `V.decodeBarChart→{label:value}` `V.decodePictogram→{label:value}` `V.decodeTally→n` `V.decodeCoins→pence` `V.decodePolygon→{vertices,sides,rightAngles,equalSides,parallelPairs,allEqual}` `V.decodeAngle→degrees` `V.decodeLinePair→'parallel'|'perpendicular'|'neither'` `V.decodeGrid→{x,y}`. 3D shapes use the hand-checked table `V.FACTS3D`.
Render helpers: `V.clock(h,m,{roman})`, `V.digital(h,m,{h24,ampm})`, `V.fractionBar(n,d)`, `V.fractionCircle(n,d)`, `V.numberLine({min,max,minor,major,marks:[{value,kind:'dot'|'q'}],labels:fn})`, `V.baseTen(h,t,o)`, `V.array(r,c)`, `V.groups(n,per)`, `V.dots(n)`, `V.ruler(lengthCm,{maxCm})`, `V.jug(value,max,{minor,major,unit})`, `V.dial(value,max,{minor,major,unit})`, `V.barChart(items,{scale,axisMax,yTitle})`, `V.pictogram(rows,key)`, `V.tally(n)`, `V.coins([p,...])`, `V.shape2D(name)`, `V.shape3D(name)`, `V.angle(deg)`, `V.linePair(kind,seed)`, `V.grid(max,[x,y])`, `V.barModel(parts,total)`.
New picture kind (rare): `V.extra.myKind = { render:function(a,b){return html}, verify:function(args,html){return '' /*or error text*/} }` and a `decodeMyKind` that reads **geometry/counts**, not the generator’s numbers.

## Content rules
* UK Year 3 National Curriculum scope for Year 3 skills; `year:4` only for bridge skills that are clearly the next step; `year:2` for foundations she may have missed.
* Numbers must be **sensible**: no negative answers, no money below 1p, ages/heights realistic, names from a mixed pool (Ana, Marcus, Sophie, Ivan, Lucy, Diego, Ellen, Tom, Aisha, Kai, Mei, Leo…).
* Word problems: ≤ 25 words, one idea, tier 3 may have two steps. Context = things she likes (animals, space, baking, football, unicorns, pocket money). No brands, no real people, no copyrighted characters.
* Nothing frightening, nothing about weight/dieting/body shape.
* Use `numeric` (typed) for at least one tier-3 generator where guessing from 4 options would hide whether she knows it.
* Each generator should vary its **structure** (not only the numbers): rotate 2-4 question formats per tier.
* No `Math.random` — use `randInt/pick/chance/shuffle` (the auditor seeds them).
* Keep each file self-contained (IIFE), ES2017, no external libs.

## Report back (≤ 25 lines)
Skills delivered (ids), final `node tools/audit.js --files <prefix> --n 3000` output line, any skill you dropped and why, anything a reviewer should double-check (curriculum or maths judgement calls).

## Files, ids, orders (to avoid collisions)
Name every file `<prefix>-<topic>.js` (e.g. `number-place-value.js`). Skill ids are unique across the whole app; prefix them with your strand (`number-…`, `addsub-…`).
`prereq` may name skills from your own strand or the foundation skills: `number-place-value`, `multdiv-2-5-10`, `fractions-read` — nothing else.
Do not `git commit`, do not create files outside `src/skills/` (scratch files go in your scratchpad / `/tmp`).
