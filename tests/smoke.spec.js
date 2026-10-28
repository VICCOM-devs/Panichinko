// Smoke test: both roles run 8 s with fake chat and no errors. Run: node tests/smoke.spec.js [path/to/index.html]
const {chromium}=require('playwright');const path=require('path');
const file='file://'+path.resolve(process.argv[2]||path.join(__dirname,'..','demo','index.html'));
(async()=>{const b=await chromium.launch();
 for(const role of ['pickBig','pickTiny']){const p=await b.newPage({viewport:{width:960,height:600}});const errs=[];p.on('pageerror',e=>errs.push(e.message));
  await p.addInitScript(()=>{window.WebSocket=class{constructor(){throw new Error('no network in tests')}};localStorage.setItem('pch_set',JSON.stringify({seen:{biggie:true,tiny:true},crt:'off',tw:{on:true,fake:true,mode:'chaos',every:20,len:10}}))});
  await p.goto(file);await p.click('[data-go=mRole]');await p.click('#'+role);await p.waitForTimeout(8000);
  const vis=await p.evaluate(()=>!document.getElementById('vote').classList.contains('hidden'));
  if(errs.length||!vis){console.error('FAIL',role,errs,vis);process.exitCode=1}else console.log('ok -',role);await p.close()}
 await b.close()})();
