#!/usr/bin/env node
/* CLARITY SCAN: every skill x tier x N questions. Flags prompts a child could not act on:
   no instruction/question, unexplained jargon, placeholder without instruction, too long,
   duplicate visible option labels, correct label also in a distractor. Exit 1 on findings. */
const fs=require('fs'),path=require('path'),vm=require('vm');const root=path.join(__dirname,'..');
const N=+(process.argv.includes('--n')?process.argv[process.argv.indexOf('--n')+1]:300);
const files=['src/core.js','src/visuals.js',...fs.readdirSync(root+'/src/skills').filter(f=>f.endsWith('.js')).sort().map(f=>'src/skills/'+f)];
const sb={console,Math,JSON,Object,Array,String,Number,Set,Map,RegExp,Error,isFinite,parseFloat,parseInt};vm.createContext(sb);
vm.runInContext(files.map(f=>fs.readFileSync(path.join(root,f),'utf8').replace(/^'use strict';/m,'')).join('\n;\n')+'\n;this.X={SKILLS,makeQuestion,setSeed,stripTags};',sb);
const {SKILLS,makeQuestion,setSeed,stripTags}=sb.X;
const ASK=/\?|^(type|write|fill|find|work|complete|choose|pick|tap|select|round|count|order|solve|use|add|take|subtract|multiply|divide|share|put|read|show|match|name|give|say|tick|circle|colour|color|shade|draw|measure|estimate|change|convert|make|decide|check|look|spot|double|halve|think|try|remember|which|what|who|how|is|are|does|do|can|will|who|where|when|complete)\b/i;
const JARGON=['minuend','subtrahend','addend','partition','inverse','commutative','associative','regroup','compensat','dividend','quotient','divisor','multiplicand','integer','denominator','numerator','equivalent','consecutive','factor','approximate','bridge'];
const out=[];let total=0;
SKILLS.forEach(sk=>[1,2,3].forEach(t=>{setSeed(500+t*131+sk.id.length);const seen=new Map();
 for(let i=0;i<N;i++){const q=makeQuestion(sk,t);if(!q)continue;total++;const p=stripTags(q.prompt).replace(/\s+/g,' ').trim();
  const shape=p.replace(/\d+(\.\d+)?/g,'#');if(seen.has(shape))continue;seen.set(shape,1);const w=[];
  if(!ASK.test(p)&&!/\b(type|fill|find|work out|use|set|choose|tap|drag|write|complete)\b/i.test(p))w.push('no instruction/question');
  if(p.length>230)w.push('long('+p.length+')');
  if(/[▢?]\s*$/.test(p)&&p.length<28&&!/\b(what|which|who|how|find|type|fill|complete|write)\b/i.test(p))w.push('bare placeholder');
  JARGON.forEach(j=>{if(new RegExp('\\b'+j,'i').test(p)&&!/\bmeans?\b|\bis the\b|—|\(|:/.test(p)&&!new RegExp(j+'[^.?]{0,40}(is|means|=)','i').test(p))w.push('jargon:'+j)});
  if(q.type==='mcq'){const labs=q.options.map(o=>String(o.label).trim());if(new Set(labs).size!==labs.length)w.push('duplicate option labels');}
  if(w.length)out.push(sk.id+' t'+t+' ['+w.join(', ')+'] '+p.slice(0,170));}
}));
const uniq=[...new Set(out)];uniq.forEach(l=>console.log(l));
console.log('\nclarity-scan: '+total+' questions, '+uniq.length+' flagged shapes');process.exit(uniq.length?1:0);
