#!/usr/bin/env node
/* TEXT DUMP: every distinct child-visible string, by category, with numbers/names collapsed to shapes.
   node tools/text-dump.js [outdir] [--n 150]  -> hint.txt explain.txt why.txt wrong.txt lesson.txt trick.txt */
const fs=require('fs'),path=require('path'),vm=require('vm');const root=path.join(__dirname,'..');
const out=process.argv[2]&&!process.argv[2].startsWith('--')?process.argv[2]:'/tmp/txt';const N=+(process.argv.includes('--n')?process.argv[process.argv.indexOf('--n')+1]:150);
fs.mkdirSync(out,{recursive:true});
const files=['src/core.js','src/visuals.js',...fs.readdirSync(root+'/src/skills').filter(f=>f.endsWith('.js')).sort().map(f=>'src/skills/'+f)];
const sb={console,Math,JSON,Object,Array,String,Number,Set,Map,RegExp,Error,isFinite,parseFloat,parseInt};vm.createContext(sb);
vm.runInContext(files.map(f=>fs.readFileSync(path.join(root,f),'utf8').replace(/^'use strict';/m,'')).join('\n;\n')+'\n;this.X={SKILLS,makeQuestion,setSeed,stripTags};',sb);
const {SKILLS,makeQuestion,setSeed,stripTags}=sb.X;
const clean=s=>stripTags(String(s||'').replace(/<br\s*\/?>/gi,' ').replace(/<\/div>/gi,' | ')).replace(/\s+/g,' ').trim();
const shape=s=>s.replace(/\d+(\.\d+)?/g,'#').replace(/\b(Ana|Marcus|Sophie|Ivan|Lucy|Diego|Ellen|Tom|Aisha|Kai|Mei|Leo)\b/g,'NAME');
const cats={hint:new Map(),explain:new Map(),why:new Map(),wrong:new Map(),lesson:new Map(),trick:new Map()};
const add=(c,sk,t)=>{if(!t)return;const k=sk+'|'+shape(t);if(!cats[c].has(k))cats[c].set(k,sk+' :: '+t);};
SKILLS.forEach(sk=>{
  (sk.lesson&&sk.lesson.steps||[]).forEach((st,i)=>{add('lesson',sk.id,'step'+(i+1)+': '+clean(st.say));if(st.quiz){add('lesson',sk.id,'  quiz: '+clean(st.quiz.prompt)+' ['+st.quiz.options.map(o=>(o.ok?'*':'')+clean(o.label)).join(' / ')+'] right: '+clean(st.quiz.right)+' wrong: '+clean(st.quiz.wrong));}});
  if(sk.trick)add('trick',sk.id,clean(sk.trick.title)+': '+clean(sk.trick.say)+' EX: '+clean(sk.trick.example));
  [1,2,3].forEach(t=>{setSeed(31+t);for(let i=0;i<N;i++){const q=makeQuestion(sk,t);if(!q)continue;
    add('hint',sk.id,clean(q.hint));add('explain',sk.id,clean(q.explain));
    (q.options||[]).forEach(o=>add('why',sk.id,clean(o.why)));
    if(q.wrongWhy&&q.type!=='mcq'){const a=parseFloat(String(q.correctKey).slice(2));if(isFinite(a))[1,-1,2,-2,10,-10,100,a*2,a+5,0,a*10].forEach(d=>{const v=(d===a*2||d===a+5||d===0||d===a*10)?d:a+d;if(!isFinite(v))return;try{add('wrong',sk.id,clean(q.wrongWhy('n:'+v)));}catch(e){}});}
  }});
});
Object.keys(cats).forEach(c=>{fs.writeFileSync(path.join(out,c+'.txt'),[...cats[c].values()].join('\n'));console.log(c,cats[c].size);});
