// Online play over the same-origin test transport (?sig=local): private room, joining, inputs, snapshots,
// mid-round quick match, host leaving. Run: node tests/online.spec.js [dir containing index.html]
const {chromium}=require('playwright');const http=require('http');const fs=require('fs');const path=require('path');
const dir=path.resolve(process.argv[2]||path.join(__dirname,'..','demo'));
const ok=(c,m)=>{if(!c){console.error('FAIL -',m);process.exitCode=1}else console.log('ok -',m)};
const srv=http.createServer((q,r)=>{const f=path.join(dir,'index.html');r.writeHead(200,{'content-type':'text/html'});r.end(fs.readFileSync(f))}).listen(0);
(async()=>{
 const url=`http://127.0.0.1:${srv.address().port}/?sig=local`;
 const b=await chromium.launch();const ctx=await b.newContext({viewport:{width:1280,height:720}});
 await ctx.addInitScript(()=>{if(!localStorage.getItem('pch_set'))localStorage.setItem('pch_set',JSON.stringify({seen:{biggie:true,tiny:true},crt:'off'}))});
 const errs=[];const page=async(name)=>{const p=await ctx.newPage();p.on('pageerror',e=>errs.push(name+': '+e.message));await p.goto(url);return p};
 const A=await page('A'),Bp=await page('B');
 await A.click('[data-go=mOnline]');await A.fill('#onName','Host');await A.click('#onCreate');
 await A.waitForSelector('#mLobby:not(.hidden)');const code=(await A.textContent('#lbCode')).trim();ok(/^[A-Z]{4}$/.test(code),'host got room code '+code);
 await Bp.click('[data-go=mOnline]');await Bp.fill('#onName','Guest');await Bp.fill('#onCode',code);await Bp.click('#onJoin');
 await Bp.waitForSelector('#mLobby:not(.hidden)',{timeout:10000});await A.waitForTimeout(400);
 ok((await A.textContent('#lbBody')).includes('Guest'),'host lobby lists the guest');
 ok((await Bp.textContent('#lbBody')).includes('Host'),'guest lobby lists the host');
 await A.click('#lbStart');await Bp.waitForTimeout(1500);
 const st=await Bp.evaluate(()=>({running:running,role:role,client:NET.client,buf:NET.buf.length,coins:coins.length,names:tinies.map(t=>t.name)}));
 ok(st.running&&st.client&&st.role==='tiny','guest is in the round as a Tiny');ok(st.buf>3,'guest receives snapshots ('+st.buf+')');
 ok(st.names[0]==='You','guest sees own Tiny first: '+st.names.join(','));
 const sz=await A.evaluate(()=>JSON.stringify(netSnap()).length);console.log('   snapshot bytes:',sz);
 // guest moves right for 1.2 s
 await Bp.waitForTimeout(2500);
 const x0=await A.evaluate(()=>{const t=tinies.find(q=>q.remote);return t&&t.alive?t.x:null});
 await Bp.keyboard.down('d');await Bp.waitForTimeout(1200);await Bp.keyboard.up('d');await Bp.waitForTimeout(300);
 const x1=await A.evaluate(()=>{const t=tinies.find(q=>q.remote);return t&&t.alive?t.x:null});
 ok(x0!==null&&x1!==null&&x1!==x0,'guest input moves its Tiny on the host ('+x0+' → '+x1+')');
 // host drops coins (host is Biggie), guest sees them
 for(let i=0;i<4;i++){await A.mouse.click(640+i*30,300);await A.waitForTimeout(700)}
 const gc=await Bp.evaluate(()=>coins.length),hc=await A.evaluate(()=>coins.length);ok(gc>0&&Math.abs(gc-hc)<=2,'guest sees host coins ('+gc+' vs '+hc+')');
 await Bp.screenshot({path:'/tmp/online_guest.png'});await A.screenshot({path:'/tmp/online_host.png'});
 // force a kill on the host and check gore event on guest
 const before=await Bp.evaluate(()=>bodies.length);
 await A.evaluate(()=>{const t=tinies.find(q=>q.alive);kill(t,'crush',coins[0]||null)});await Bp.waitForTimeout(500);
 ok((await Bp.evaluate(()=>bodies.length))>before,'kill reaches the guest as a ragdoll');
 // quick match: C finds no open room (private), hosts; D joins C mid-round
 const C=await page('C');await C.click('[data-go=mOnline]');await C.fill('#onName','Quick1');await C.click('#onQuick');await C.waitForTimeout(3500);
 ok(await C.evaluate(()=>NET.host&&running),'quick match with no rooms hosts and starts a round');
 const D=await page('D');await D.click('[data-go=mOnline]');await D.fill('#onName','Quick2');await D.click('#onQuick');await D.waitForTimeout(4000);
 const ds=await D.evaluate(()=>({client:NET.client,running:running,code:NET.code}));
 const cc=await C.evaluate(()=>NET.code);
 ok(ds.client&&ds.running&&ds.code===cc,'second quick-matcher joins the running round ('+ds.code+')');
 // round end reaches guest
 await A.evaluate(()=>roundT=0.3);await Bp.waitForTimeout(1200);
 ok(await Bp.evaluate(()=>!document.getElementById('mEnd').classList.contains('hidden')),'round end shows on the guest');
 // host leaves
 await A.click('#again');await A.click('#lbLeave');await Bp.waitForTimeout(800);
 ok(await Bp.evaluate(()=>!NET.on&&!document.getElementById('mOnline').classList.contains('hidden')),'guest is told when the host leaves: '+(await Bp.textContent('#onSt')));

 // guest plays the Biggie: drops coins and tilts through the host
 const E=await page('E'),F=await page('F');
 await E.click('[data-go=mOnline]');await E.click('#onCreate');await E.waitForSelector('#mLobby:not(.hidden)');const code2=(await E.textContent('#lbCode')).trim();
 await F.click('[data-go=mOnline]');await F.fill('#onCode',code2);await F.click('#onJoin');await F.waitForSelector('#mLobby:not(.hidden)');
 await F.click('#lbRoleB');await E.waitForTimeout(400);
 ok((await E.evaluate(()=>NET.players.find(p=>p.id===NET.me.id).role))==='T','host becomes a Tiny when the guest takes the Biggie');
 await E.click('#lbStart');await F.waitForTimeout(3000);
 ok(await F.evaluate(()=>role==='biggie'&&running),'guest plays the Biggie');
 await E.waitForFunction(()=>hand.cd<=0,null,{timeout:15000});const c0=await E.evaluate(()=>cid);await F.mouse.click(500,300);await F.waitForTimeout(600);
 ok((await E.evaluate(()=>cid))>c0,'guest Biggie click drops a coin on the host');
 const t0=await E.evaluate(()=>big.tilts);await F.keyboard.press('z');await F.waitForTimeout(400);
 ok((await E.evaluate(()=>big.tilts))<t0,'guest Biggie tilt reaches the host');
 ok(errs.length===0,'no page errors '+JSON.stringify(errs.slice(0,5)));
 await b.close();srv.close();
})();
