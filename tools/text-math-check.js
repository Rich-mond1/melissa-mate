#!/usr/bin/env node
/* TEXT MATH CHECK: every arithmetic statement "a op b (op c)* = d" written in ANY child-visible text
   (prompt, hint, explanation, option feedback, typed-answer feedback, lessons, tricks) must be TRUE.
   node tools/text-math-check.js [--n 400]. Exit 1 on any false statement. */
const fs=require('fs'),path=require('path'),vm=require('vm');const root=path.join(__dirname,'..');
const N=+(process.argv.includes('--n')?process.argv[process.argv.indexOf('--n')+1]:400);
const files=['src/core.js','src/visuals.js',...fs.readdirSync(root+'/src/skills').filter(f=>f.endsWith('.js')).sort().map(f=>'src/skills/'+f)];
const sb={console,Math,JSON,Object,Array,String,Number,Set,Map,RegExp,Error,isFinite,parseFloat,parseInt};vm.createContext(sb);
vm.runInContext(files.map(f=>fs.readFileSync(path.join(root,f),'utf8').replace(/^'use strict';/m,'')).join('\n;\n')+'\n;this.X={SKILLS,makeQuestion,setSeed,stripTags};',sb);
const {SKILLS,makeQuestion,setSeed,stripTags}=sb.X;
const clean=s=>stripTags(String(s||'').replace(/<br\s*\/?>/gi,' ').replace(/<\/div>/gi,' | ')).replace(/,(?=\d{3}\b)/g,'').replace(/[▢□?]|_{2,}/g,'§').replace(/\+\s*[-−](\d)/g,'- $1').replace(/\s+/g,' ');
const EXPR='£?\\d+(?:\\.\\d+)?(?:\\s*[+−×÷*x-]\\s*£?\\d+(?:\\.\\d+)?)*';
const RE=new RegExp('(?<!\\b(?:of|[Dd]ouble|[Hh]alf|[Hh]alve|and|Add|add|than|from)\\s)(?<![\\d./£§]|[+−×÷*x-]\\s)('+EXPR+'(?:\\s*=\\s*'+EXPR+')+)(?!\\d|\\.\\d|/|\\s*(?:/|⁄))','g');
function ev(expr){const t=expr.replace(/£/g,'').replace(/\s+/g,'').match(/\d+(?:\.\d+)?|[+−×÷*x-]/g);let terms=[],ops=[];let cur=+t[0];let i=1;let sum=0,sign=1;
  while(i<t.length){const o=t[i],n=+t[i+1];if(o==='×'||o==='*'||o==='x')cur*=n;else if(o==='÷')cur/=n;else{sum+=sign*cur;sign=(o==='+')?1:-1;cur=n;}i+=2;}
  return sum+sign*cur;}
const bad=new Map();let checked=0,total=0;
function scan(where,text){const s=clean(text);let m;RE.lastIndex=0;while((m=RE.exec(s))){const after=s.slice(m.index+m[1].length,m.index+m[1].length+14),ctx=s.slice(Math.max(0,m.index-90),m.index+m[1].length+60);if(/^\s*(remainder|ten|hundred|thousand|one\b)/i.test(after)||/plus (the )?(carried|carry)/i.test(ctx)||/take away|odd one out|not true|wrong one|is wrong|mistake|should be|one more|cannot|can.t be|not the same|Can we swap|NOT equal|is not equal/.test(ctx))continue;const parts=m[1].split('=');if(/^£\d+$/.test(parts[0].trim())&&parts.length===2&&/^\d+$/.test(parts[1].trim()))continue;if(parts.some(p=>/[x]/.test(p)&&!/\d\s*x\s*\d/.test(p)))continue;checked++;const vals=parts.map(ev);if(vals.some(v=>Math.abs(v-vals[0])>1e-9)){const k=where+' :: '+m[1].trim()+'  (values '+vals.map(v=>Math.round(v*1e6)/1e6).join(' | ')+')';if(!bad.has(k))bad.set(k,s.slice(Math.max(0,m.index-60),m.index+m[1].length+30));}}}
SKILLS.forEach(sk=>{
  (sk.lesson&&sk.lesson.steps||[]).forEach((st,i)=>{scan(sk.id+' lesson'+(i+1),st.say);if(st.quiz){scan(sk.id+' lessonquiz',st.quiz.prompt+' '+st.quiz.right+' '+st.quiz.wrong);}});
  if(sk.trick)scan(sk.id+' trick',sk.trick.say+' '+sk.trick.example);
  [1,2,3].forEach(t=>{setSeed(77+t);for(let i=0;i<N;i++){const q=makeQuestion(sk,t);if(!q)continue;total++;
    scan(sk.id+' hint',q.hint);scan(sk.id+' explain',q.explain);
    (q.options||[]).forEach(o=>scan(sk.id+' why',o.why));
    if(q.wrongWhy&&q.type!=='mcq'){const a=parseFloat(String(q.correctKey).slice(2));if(isFinite(a))[a+1,a-1,a+2,a-2,a+10,a-10,a*2,a+5,0,a*10,a+100].forEach(v=>{try{scan(sk.id+' wrong',q.wrongWhy('n:'+v));}catch(e){}});}
  }});
});
console.log('questions',total,'arithmetic statements checked',checked,'false:',bad.size);
[...bad].slice(0,60).forEach(([k,c])=>console.log('✗',k,'\n    …'+c));
process.exit(bad.size?1:0);
