#!/usr/bin/env node
/* TEXT LINT: grammar / punctuation / placeholder checks over EVERY child-visible string
   (hint, explanation, option feedback, typed-answer feedback, lessons, tricks). Uses tools/text-dump.js. Exit 1 on findings. */
const fs=require('fs'),path=require('path'),cp=require('child_process'),os=require('os');
const dir=fs.mkdtempSync(path.join(os.tmpdir(),'txt-'));
cp.execFileSync('node',[path.join(__dirname,'text-dump.js'),dir,'--n','200'],{stdio:'ignore'});
const RULES=[
 ['number 1 + plural noun',/\b1 (?!(?:as|uses|goes|shows|says|adds|takes|gives|makes|needs|leaves|ones|tens|hundreds|thousands|plus|minus|times|has|is|was|equals|means|group|hundred|ten|one|thousand|more|less|bus|class|glass|cross|dress)\b)[a-z]+s\b(?!\s*(?:digit|place))/],
 ['a before vowel',/\ba (?!(?:one|unicorn|use|used|user|uniform|union|unit|universe|once|euro|european)\b)[aeiou][a-z]+/],
 ['an before consonant',/\ban (?!(?:hour|honest|heir)\b)[bcdfgjklmnpqrstvwxz][a-z]+/],
 ['repeated word',/\b([a-z]{2,}) \1\b/],
 ['placeholder leak',/undefined|NaN|\[object|\bnull\b|\{\w+\}|%s/],
 ['double space / space before punctuation',/[A-Za-z0-9]  [A-Za-z]| [,.;:!?](?!\.)\s/],
 ['double punctuation',/[,;:]{2,}|(?<!\.)\.\.(?!\.)|\?\?|!!(?!!)|,\./],
 ['empty list "taller than that: ."',/: \./],
 ['negative number after +',/\+ -\d/],
 ['0 + singular-looking noun',/\b0 (?:pair|group|bar|side|step)\b/],
 ['"= N" statement for sentence (X = k whole)',/\b\d+ = \d+ whole(?!\.)/],
];
const bad=[];let n=0;
fs.readdirSync(dir).forEach(f=>fs.readFileSync(path.join(dir,f),'utf8').split('\n').forEach(l0=>{const l=l0.replace(/^[a-z0-9-]+ :: /,'').replace(/ \|( |$)/g,' ').replace(/ ?[🧠✅❌]/gu,'').replace(/ \? /g,' Q ').replace(/ \?(?=[.,])/g,' Q').replace(/\?\s*$/,'Q').replace(/ \?$/,' Q');n++;RULES.forEach(([name,re])=>{if(re.test(l))bad.push(f.replace('.txt','')+' ['+name+'] '+l0.slice(0,230));});}));
console.log('text-lint: '+n+' distinct texts, '+bad.length+' findings');bad.slice(0,80).forEach(b=>console.log('✗ '+b));
process.exit(bad.length?1:0);
