/* TOUCH TEST on the iPhone engine (WebKit): taps with NO synthetic click must still work (iOS swallows clicks). Needs: npx playwright install webkit (PLAYWRIGHT_BROWSERS_PATH). */
const { webkit, chromium, devices } = require('playwright');
async function run(name, launch, ctxOpts){
  const b=await launch(); const ctx=await b.newContext(ctxOpts); const p=await ctx.newPage(); const errs=[]; p.on('pageerror',e=>errs.push(e.message));
  await p.goto('file://' + require('path').join(__dirname, '..', 'index.html')); await p.evaluate(()=>localStorage.clear()); await p.reload(); await p.waitForTimeout(500);
  await p.evaluate(()=>{ S.onboardingDone=true; S.placement.started=true; S.placement.done=true; window.__cnt={}; ['strand','go','lquiz','lnext','pick','qnext','playRec','startSess'].forEach(k=>{ const f=ACT[k]; if(f) ACT[k]=function(){ __cnt[k]=(__cnt[k]||0)+1; return f.apply(this,arguments); }; }); go('hub'); }); await p.waitForTimeout(800);
  const tap=async(sel,idx=0)=>{ const r=await p.evaluate(([sel,idx])=>{ const e=document.querySelectorAll(sel)[idx]; if(!e) return null; e.scrollIntoView({block:'center'}); const r=e.getBoundingClientRect(); return [r.left+r.width/2,r.top+r.height/2]; },[sel,idx]); if(!r) return false; await p.waitForTimeout(250); await p.touchscreen.tap(r[0],r[1]); await p.waitForTimeout(500); return true; };
  const st=()=>p.evaluate(()=>scr.name+' cnt='+JSON.stringify(__cnt));
  await p.evaluate(()=>{window.__noGuard=false;});
  await tap('[data-act=strand]'); console.log(name,'tap strand ->',await st());
  await p.evaluate(()=>{ go('lesson',{id:'data-tally-tables',i:0}); }); await p.waitForTimeout(500);
  await tap('[data-act=lnext]'); await tap('[data-act=lnext]'); console.log(name,'lesson 2x next ->',await st(), await p.evaluate(()=>scr.p.i));
  console.log(name,'quiz opts:', await tap('[data-act=lquiz]',0), await p.evaluate(()=>document.getElementById('lfb')&&document.getElementById('lfb').innerText.slice(0,40)));
  await p.evaluate(()=>{ SESS={kind:'practice',skillId:'data-tally-tables',items:[],idx:0,credits:[],by:{},seen:{}}; genQ&&0; const q=genQ('data-tally-tables',1); SESS.q=q; startQ('data-tally-tables',1); }); await p.waitForTimeout(600);
  await tap('[data-act=pick]',0); console.log(name,'question pick ->',await p.evaluate(()=>SESS.tries+' tries, phase '+SESS.phase), JSON.stringify(await p.evaluate(()=>__cnt)));
  console.log(name,'errs',errs); await b.close(); }
(async()=>{ await run('WEBKIT iPhone', ()=>webkit.launch(), {...devices['iPhone 14 Pro Max']});
 await run('CHROMIUM touch', ()=>chromium.launch({executablePath:'/opt/pw-browsers/chromium'}), {viewport:{width:430,height:932},hasTouch:true,isMobile:true}); })();
