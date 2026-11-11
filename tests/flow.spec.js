// Flow test (v0.3.0): aimed grappling hook, shelter hatch, hand animation state and progression.
// Run: node tests/flow.spec.js [path/to/index.html]   (needs the window.__pch test hook, so not the dist build)
const {chromium}=require('playwright');const path=require('path');
const file='file://'+path.resolve(process.argv[2]||path.join(__dirname,'..','demo','index.html'));
let fails=0;const ok=(c,msg)=>{if(c)console.log('ok -',msg);else{console.error('FAIL -',msg);fails++;process.exitCode=1}};
(async()=>{const b=await chromium.launch();
 const p=await b.newPage({viewport:{width:1280,height:720}});const errs=[];p.on('pageerror',e=>errs.push(e.message));
 await p.addInitScript(()=>{window.WebSocket=class{constructor(){throw new Error('no network in tests')}};
  if(!localStorage.getItem('pch_set'))localStorage.setItem('pch_set',JSON.stringify({seen:{biggie:true,tiny:true},crt:'off',bigBot:'easy',dropInt:3}))});
 await p.goto(file);await p.click('[data-go=mRole]');await p.click('#pickTiny');await p.waitForTimeout(700);
 // park the Biggie so no coin or tilt disturbs the checks
 const calm=()=>p.evaluate(()=>{const r=__pch.raw();r.hand.cd=99;r.big.tilts=0;r.big.tiltReg=-99;r.coins.length=0;const t=r.tinies[0];t.hp=100;t.inv=5});
 await calm();await p.waitForTimeout(900);
 // put the player on a known peg, aim at the peg above and to the side, and shoot
 const aim=await p.evaluate(()=>{const r=__pch.raw(),t=r.tinies[0],B=r.B;const pegs=B.pegs.filter(q=>!q.off&&!q.vx&&q.y>B.H*0.45&&q.y<B.H*0.7&&q.x>B.W*0.3&&q.x<B.W*0.7);const base=pegs[0];
   t.grapple=null;t.hook=null;t.x=base.x;t.y=base.y-base.r-7.5;t.vx=t.vy=0;t.fallTop=t.y;t.grappleCD=0;
   const up=__pch.anchors().filter(a=>a!==base&&a.y<base.y-30&&Math.hypot(a.x-t.x,a.y-t.y)<B.D*2.6).sort((a,c)=>Math.hypot(a.x-t.x,a.y-t.y)-Math.hypot(c.x-t.x,c.y-t.y))[0];
   return{x:up.x,y:up.y,bx:base.x,by:base.y}});
 await p.waitForTimeout(1000); // let the camera settle on the Tiny
 let s=await p.evaluate(a=>__pch.toScreen(a.x,a.y),aim);
 await p.mouse.move(s.x,s.y);await p.waitForTimeout(80);
 ok(await p.evaluate(()=>__pch.raw().tinies[0].aimHook===true),'mouse aiming switches the player to the aimed hook');
 await p.mouse.down();await p.mouse.up();
 await p.waitForFunction(()=>{const t=__pch.raw().tinies[0];return !!t.grapple||(!t.hook&&t.grappleCD>0)},null,{timeout:2000}).catch(()=>{});
 let st=await p.evaluate(a=>{const t=__pch.raw().tinies[0];return{g:t.grapple?[t.grapple.p.x,t.grapple.p.y]:null,n:t.st.nHook||0,ax:a.x,ay:a.y}},aim);
 ok(st.g&&Math.abs(st.g[0]-st.ax)<1&&Math.abs(st.g[1]-st.ay)<1,'hook sticks to the peg it was aimed at');
 ok(st.n===1,'hook shot is counted');
 await p.waitForTimeout(500);
 ok(await p.evaluate(()=>!!__pch.raw().tinies[0].grapple),'rope holds while swinging');
 // the hook sticks to any surface: here the left wall
 await calm();
 const wall=await p.evaluate(()=>{const r=__pch.raw(),t=r.tinies[0],B=r.B,A=__pch.anchors();
   let y=B.H*0.5;for(let k=0;k<200;k++){const yy=B.H*0.3+k*2;if(A.every(q=>Math.abs(q.y-yy)>q.r+14||q.x>B.D*1.6)){y=yy;break}}
   t.grapple=null;t.hook=null;t.grappleCD=0;t.x=B.D*1.2;t.y=y+3;t.vx=0;t.vy=0;t.fallTop=t.y;t.inv=5;return{ok:__pch.fire(0,-1,0),y}});
 await p.waitForFunction(()=>{const t=__pch.raw().tinies[0];return !!t.grapple||!t.hook},null,{timeout:2000}).catch(()=>{});
 st=await p.evaluate(()=>{const t=__pch.raw().tinies[0],g=t.grapple;return g?{surf:!!g.p.surf,x:g.p.x,y:g.p.y}:null});
 ok(wall.ok&&st&&st.surf&&st.x<12&&Math.abs(st.y-wall.y)<4,'hook sticks to the wall where it hit ('+JSON.stringify(st)+')');
 // hooking the spinner attaches to the hit point, which then turns with the spinner
 await calm();
 const sp=await p.evaluate(()=>{const r=__pch.raw(),t=r.tinies[0],q=r.B.spinners[0];t.grapple=null;t.hook=null;t.grappleCD=0;t.x=q.x+3;t.y=q.y+q.len+40;t.vx=0;t.vy=0;t.fallTop=t.y;t.inv=5;return{ok:__pch.fire(0,0,-1),x:q.x,y:q.y,len:q.len}});
 await p.waitForFunction(()=>{const t=__pch.raw().tinies[0];return !!t.grapple||!t.hook},null,{timeout:2000}).catch(()=>{});
 const a1=await p.evaluate(()=>{const g=__pch.raw().tinies[0].grapple;return g&&g.p.sp?{x:g.p.x,y:g.p.y,d:g.p.d}:null});
 await p.waitForTimeout(250);
 const a2=await p.evaluate(()=>{const g=__pch.raw().tinies[0].grapple;return g&&g.p.sp?{x:g.p.x,y:g.p.y,d:g.p.d}:null});
 ok(sp.ok&&a1&&a1.d<=sp.len+3,'hook sticks to the spinner at the point it hit (d '+(a1&&a1.d.toFixed(1))+')');
 ok(a1&&a2&&Math.hypot(a2.x-a1.x,a2.y-a1.y)>2&&Math.abs(Math.hypot(a2.x-sp.x,a2.y-sp.y)-a1.d)<0.5,'the hook point turns with the spinner and the rope holds');
 // Tinies only spawn in the bottom third
 const lowest=await p.evaluate(()=>{const B=__pch.raw().B;let m=1e9;for(let k=0;k<300;k++)m=Math.min(m,__pch.spawn().y);return{m,lim:B.H*0.67}});
 ok(lowest.m>=lowest.lim,'spawns stay in the bottom third (highest '+lowest.m.toFixed(0)+', limit '+lowest.lim.toFixed(0)+')');
 // shelter: a Tiny inside a sheltered slot can jump out through the hatch and stand on it
 await calm();
 const sh=await p.evaluate(()=>{const r=__pch.raw(),t=r.tinies[0],B=r.B;t.grapple=null;t.hook=null;t.x=B.slotW*2.5;t.y=B.floor-7.5;t.vx=t.vy=0;t.fallTop=t.y;__pch.power(0,'shelter');return{lid:r.lids.length&&r.lids[0].ay,divTop:B.divTop}});
 ok(sh.lid>0,'shelter lid is placed');
 await p.waitForTimeout(250);await calm();
 await p.keyboard.press(' ');
 let top=1e9;for(let k=0;k<14;k++){await p.waitForTimeout(40);top=Math.min(top,await p.evaluate(()=>__pch.raw().tinies[0].y))}
 await p.waitForTimeout(500);
 st=await p.evaluate(()=>{const t=__pch.raw().tinies[0];return{y:t.y,alive:t.alive,gr:t.grounded}});
 ok(st.alive&&top<sh.lid-8,'Tiny jumps out through the shelter (top '+top.toFixed(0)+', lid '+sh.lid+')');
 ok(st.gr&&st.y<sh.lid,'and can stand on the lid afterwards (y '+st.y.toFixed(0)+')');
 await p.keyboard.down('s');await p.waitForTimeout(450);await p.keyboard.up('s');
 st=await p.evaluate(()=>{const t=__pch.raw().tinies[0];return{y:t.y}});
 ok(st.y>sh.lid,'holding S drops back in (y '+st.y.toFixed(0)+')');
 // progression: finishing a round pays XP and fills the end panel
 await p.evaluate(()=>__pch.setRound(0.1));await p.waitForSelector('#mEnd:not(.hidden)',{timeout:4000});
 const pr=await p.evaluate(()=>({xp:__pch.prog().xp,day:__pch.prog().lastDay,ch:__pch.prog().ch.list.length,html:document.getElementById('endProg').textContent,saved:!!localStorage.getItem('pch_prog')}));
 ok(pr.xp>=20&&pr.ch===3&&pr.saved&&/XP/.test(pr.html),'round end pays XP, sets 3 daily challenges and saves ('+pr.xp+' XP)');
 await p.click('#mEnd [data-go=mMain]');await p.click('[data-go=mLocker]');await p.waitForTimeout(300);
 ok(await p.evaluate(()=>document.querySelectorAll('#lkBody [data-hat]').length>5&&document.querySelectorAll('#lkBody [data-coin]:not([disabled])').length>=1),'locker lists hats and coins');
 await p.evaluate(()=>{__pch.prog().xp=99999});await p.click('#mLocker [data-go=mMain]');await p.click('[data-go=mLocker]');await p.click('[data-hat=crown]');
 ok(await p.evaluate(()=>__pch.prog().hat==='crown'),'unlocked hat can be picked');
 // Biggie: hand animation runs and a click still drops a coin
 await p.click('#mLocker [data-go=mMain]');await p.click('[data-go=mRole]');await p.click('#pickBig');await p.waitForTimeout(1500);
 await p.mouse.move(640,200);await p.waitForTimeout(400);await p.mouse.down();await p.mouse.up();await p.waitForTimeout(300);
 ok(await p.evaluate(()=>__pch.state.coins>=1),'Biggie click drops a coin');
 ok(errs.length===0,'no page errors '+JSON.stringify(errs));
 await b.close()})();
