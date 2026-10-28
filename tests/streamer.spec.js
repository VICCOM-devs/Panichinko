// Streamer mode test with a mocked Twitch IRC socket. Run: node tests/streamer.spec.js [path/to/index.html]
const {chromium}=require('playwright');const path=require('path');
const file='file://'+path.resolve(process.argv[2]||path.join(__dirname,'..','demo','index.html'));
const assert=(c,m)=>{if(!c){console.error('FAIL:',m);process.exitCode=1}else console.log('ok -',m)};
(async()=>{
 const b=await chromium.launch();const p=await b.newPage({viewport:{width:1280,height:720}});
 const errs=[];p.on('pageerror',e=>errs.push(e.message));p.on('console',m=>{if(m.type()==='error')errs.push(m.text())});
 await p.addInitScript(()=>{window.__sent=[];
   window.WebSocket=class{constructor(u){window.__ws=this;setTimeout(()=>this.onopen&&this.onopen(),20)}
     send(x){window.__sent.push(x);if(x.startsWith('JOIN')){const ch=x.split(' ')[1];setTimeout(()=>this.onmessage({data:':justinfan1!justinfan1@justinfan1.tmi.twitch.tv JOIN '+ch+'\r\n'}),20)}}close(){}};
   localStorage.setItem('pch_set',JSON.stringify({seen:{biggie:true,tiny:true},crt:'off',tw:{on:false,chan:'',mode:'chaos',every:20,len:10,fake:false}}))});
 await p.goto(file);
 await p.click('#btnStream');await p.fill('#twChan','#Test_Chan');await p.press('#twChan','Tab');await p.click('#twGo');await p.waitForTimeout(200);
 const sent=await p.evaluate(()=>window.__sent);
 assert(sent.includes('JOIN #test_chan'),'joins cleaned channel name');
 assert(/Connected/.test(await p.textContent('#twSt')),'shows connected');
 await p.evaluate(()=>window.__ws.onmessage({data:'PING :tmi.twitch.tv\r\n'}));
 assert((await p.evaluate(()=>window.__sent.slice(-1)[0]))==='PONG :tmi.twitch.tv','answers PING');
 await p.click('#mStream [data-go=mMain]');await p.click('[data-go=mRole]');await p.click('#pickBig');
 await p.evaluate(()=>{SM.t=0});await p.waitForTimeout(300);
 assert(await p.evaluate(()=>SM.phase==='open'),'vote opens');
 const say=(u,t)=>p.evaluate(([u,t])=>window.__ws.onmessage({data:`@display-name=${u};user-id=${u} :${u.toLowerCase()}!x@x.tmi.twitch.tv PRIVMSG #test_chan :${t}\r\n`}),[u,t]);
 for(const [u,t] of [['A','2'],['B','!2'],['C','3 lol'],['D','1'],['D','2'],['E','hello 1'],['F','<b>1</b>'],['G','!vote 3']])await say(u,t);
 assert(JSON.stringify(await p.evaluate(()=>smCounts()))==='[0,3,2]','counts votes, last vote wins, ignores noise');
 await p.evaluate(()=>{SM.t=0});await p.waitForTimeout(300);
 assert(await p.evaluate(()=>SM.phase==='result'&&SM.win===1),'majority option wins');
 const fx=await p.evaluate(()=>Object.keys(SMO).filter(k=>{try{SMO[k].run();return false}catch(e){return true}}));
 assert(fx.length===0,'all vote effects run ('+fx.join(',')+')');
 await p.waitForTimeout(500);
 assert(errs.length===0,'no console errors '+JSON.stringify(errs));
 await b.close();
})();
