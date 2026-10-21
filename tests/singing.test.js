import {PROGRESS_KEY,NATURALS,newProgress,loadProgress,completeTarget,nextTarget} from '../public/singing/progression.js';
import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {Window} from 'happy-dom';
import {detectPitch,centsFromTarget,createTracker} from '../public/sing-back/pitch.js';
import {createTimedPair} from '../public/sing-back/timed-pair.js';
import {timelinePhase,createTimedRound,WARMUP_TIMING} from '../public/sing-back/timeline.js';
import {createPrototype} from '../public/sing-back/app.js';
function tone(frequency,rate=48000,amplitude=.16){return Float32Array.from({length:4096},(_,i)=>amplitude*(Math.sin(2*Math.PI*frequency*i/rate)+.5*Math.sin(4*Math.PI*frequency*i/rate)+.25*Math.sin(6*Math.PI*frequency*i/rate)));}
const detected=(f)=>({frequency:f,confidence:.98});
test('real waveform pitch detection handles voices and octave-equivalent targets',()=>{
 for(const rate of [44100,48000])for(const freq of [82.4069,130.8128,220,261.6256,440,523.2511,783.9909]){
 const result=detectPitch(tone(freq,rate),rate);assert.ok(result,`${freq}Hz at ${rate}`);assert.ok(Math.abs(1200*Math.log2(result.frequency/freq))<8);
 }
 for(const f of [130.8128,261.6256,523.2511])assert.ok(Math.abs(centsFromTarget(f,48))<.1);
});
test('silence, unpitched noise and weak input produce no pitch feedback',()=>{
 assert.equal(detectPitch(new Float32Array(4096),48000),null);
 let seed=123;const noise=Float32Array.from({length:4096},()=>{seed=(seed*16807)%2147483647;return (seed/2147483647-.5)*.2;});
 assert.equal(detectPitch(noise,48000),null);assert.equal(detectPitch(tone(220,48000,.001),48000),null);
});
test('25-cent tolerance requires sustained accuracy; noisy gaps reset the hold',()=>{
 const tracker=createTracker(),frequency=130.8128*2**(20/1200);let result;
 for(let t=0;t<=700;t+=50)result=tracker.update(detected(frequency),48,t);
 assert.equal(result.success,false);result=tracker.update(detected(frequency),48,750);assert.equal(result.success,true);
 tracker.reset();for(let t=0;t<=400;t+=50)tracker.update(detected(130.8128),48,t);
 assert.equal(tracker.update(null,48,450).reliable,false);
 for(let t=500;t<=1000;t+=50)result=tracker.update(detected(130.8128),48,t);
 assert.equal(result.success,false);
 tracker.reset();for(let t=0;t<=2000;t+=50)result=tracker.update(detected(130.8128*2**(30/1200)),48,t);assert.equal(result.success,false);
});
test('single-frame pitch outliers are smoothed and uncertain detections show listening',()=>{
 const tracker=createTracker();for(let t=0;t<250;t+=50)tracker.update(detected(130.8128),48,t);
 assert.ok(Math.abs(tracker.update(detected(146.83),48,250).cents)<1);
 assert.equal(tracker.update({frequency:130.8128,confidence:.4},48,300).reliable,false);
});
let bootstrapId=0;
async function setup({secure=true,deny=false,timed=false,warmup=false,bootstrap=false,production=false,singingSaved,singingProgress}={}){
 const w=new Window({url:'https://example.test/ear-training-app/sing-back/'});
 w.document.write((await readFile(production?'public/singing/index.html':'public/sing-back/index.html','utf8')).replace(/<script[^>]*>[\s\S]*?<\/script>/g,''));
 if(singingProgress)w.localStorage.setItem(PROGRESS_KEY,JSON.stringify(singingProgress));
 if(singingSaved)w.localStorage.setItem('ear-training-singing-v1',singingSaved);
 w.localStorage.setItem('ear-training-v1','existing-interval-progress');
 const listeners=new Map();
 let requests=0,stopped=0,frame,clock=0,signal=tone(130.8128),source;const played=[];
 const env={document:w.document,Event:w.Event,localStorage:w.localStorage,location:w.location,isSecureContext:secure,performance:{now:()=>clock},navigator:{mediaDevices:{getUserMedia:async()=>{requests++;if(deny)throw Object.assign(new Error(),{name:'NotAllowedError'});return {getTracks:()=>[{stop(){stopped++;}}]};}}},AudioContext:class{sampleRate=48000;get currentTime(){return clock/1000;}destination={};resume(){return Promise.resolve();}close(){}createMediaStreamSource(){return {connect(){},disconnect(){}};}createAnalyser(){return {fftSize:4096,getFloatTimeDomainData(array){array.set(signal);}};}decodeAudioData(){return Promise.resolve({});}createBufferSource(){source={connect(){},start(at){played.push({start:at});},stop(at){if(at!==undefined)played.at(-1).stop=at;}};return source;}createGain(){return {connect(){},gain:{setValueAtTime(){},linearRampToValueAtTime(){},exponentialRampToValueAtTime(){}}};}},fetch:async()=>({ok:true,arrayBuffer:async()=>new ArrayBuffer(8)}),requestAnimationFrame:fn=>{frame=fn;return 1;},cancelAnimationFrame(){frame=null;},addEventListener(name,fn){if(!listeners.has(name))listeners.set(name,[]);listeners.get(name).push(fn);}};env.parent=env;
 if(production){globalThis.window=env;try{await import('../public/singing/experience.js?test='+ ++bootstrapId);}finally{delete globalThis.window;}}else if(bootstrap){globalThis.window=env;try{await import('../public/sing-back/app.js?bootstrap-test='+ ++bootstrapId);}finally{delete globalThis.window;}}else if(warmup)createTimedPair(env,{prefix:'warmup-',pattern:[0,2,4,2],...WARMUP_TIMING});else if(timed)createTimedPair(env);else createPrototype(env);
 return {w,env,played,emit(name){listeners.get(name)?.forEach(fn=>fn());},get requests(){return requests;},get stopped(){return stopped;},tick(time){clock=time;frame?.(time);},finishPiano(){source.onended();},setSignal(value){signal=value;}};
}
const flush=async()=>{for(let i=0;i<30;i++)await Promise.resolve();};
test('mic activates only by user action; live feedback, octave success, retry and stopping work',async()=>{
 const s=await setup(),d=s.w.document;
 assert.equal(s.requests,0);d.querySelector('#mic').click();await flush();assert.equal(s.requests,1);
 for(let t=50;t<=900;t+=50)s.tick(t);
 assert.equal(d.querySelector('#success').hidden,false);
 d.querySelector('#retry').click();assert.equal(d.querySelector('#success').hidden,true);
 s.setSignal(tone(261.6256));for(let t=1000;t<=1900;t+=50)s.tick(t);assert.equal(d.querySelector('#success').hidden,false);
 s.setSignal(new Float32Array(4096));s.tick(1950);assert.equal(d.querySelector('#needle').hidden,true);assert.equal(d.querySelector('#feedback-label').textContent,'מקשיב...');
 d.querySelector('#mic').click();assert.equal(s.stopped,1);await s.w.happyDOM.close();
});
test('piano playback cannot earn success through microphone bleed',async()=>{
 const s=await setup(),d=s.w.document;d.querySelector('#mic').click();await flush();d.querySelector('#play').click();await flush();
 for(let t=50;t<=3000;t+=50)s.tick(t);assert.equal(d.querySelector('#success').hidden,true);
 s.finishPiano();s.tick(3100);assert.equal(d.querySelector('#needle').hidden,true);
 for(let t=3400;t<=4400;t+=50)s.tick(t);assert.equal(d.querySelector('#success').hidden,false);
 await s.w.happyDOM.close();
});
test('permission refusal and insecure hosting show clear errors without analysis',async()=>{
 for(const options of [{secure:false},{deny:true}]){
 const s=await setup(options),d=s.w.document;d.querySelector('#mic').click();await flush();assert.equal(d.querySelector('#error').hidden,false);assert.equal(d.querySelector('#needle').hidden,true);if(options.secure===false)assert.equal(s.requests,0);await s.w.happyDOM.close();
 }
});

test('single-note exercise includes all chromatic notes and accepts a black key in another octave',async()=>{
 const s=await setup(),d=s.w.document;
 assert.equal(d.querySelectorAll('#target-select option').length,13);
 const select=d.querySelector('#target-select');select.value='49';select.dispatchEvent(new s.w.Event('change'));
 assert.equal(d.querySelector('#target-name').textContent,'C♯3 / D♭3');
 assert.ok(d.querySelector('#target-hebrew').textContent.includes('דיאז'));assert.ok(d.querySelector('#target-hebrew').textContent.includes('במול'));
 s.setSignal(tone(277.1826));d.querySelector('#mic').click();await flush();for(let t=50;t<=1000;t+=50)s.tick(t);
 assert.equal(d.querySelector('#success').hidden,false);await s.w.happyDOM.close();
});

test('timeline phases advance by time and never wait for pitch success',()=>{
 assert.equal(timelinePhase(0).phase,'listen');assert.equal(timelinePhase(1900).step,1);
 assert.equal(timelinePhase(4100).phase,'count');assert.equal(timelinePhase(5000).count,2);
 const round=createTimedRound([48,50]);
 for(let t=5800;t<7600;t+=50)round.update(null,t);
 assert.equal(round.update(null,7700).phase.step,1);assert.equal(timelinePhase(9500).phase,'done');
 assert.ok(round.results.every(r=>!r.accurate));
});
test('timed singing retains both targets and traces, scores each slot and supports ascending and descending',async()=>{
 for(const direction of ['ascending','descending']){
 const s=await setup({timed:true}),d=s.w.document;
 assert.equal(s.requests,0);assert.ok(d.querySelector('#timed-start').disabled);
 d.querySelector('#timed-direction').value=direction;d.querySelector('#timed-direction').dispatchEvent(new s.w.Event('change'));
 d.querySelector('#timed-mic').click();await flush();d.querySelector('#timed-start').click();await flush();
 s.tick(300);assert.ok(d.querySelector('#timed-phase').textContent.includes('מקשיבים'));assert.equal(d.querySelector('#timed-trace').childElementCount,0);
 s.tick(4500);assert.ok(d.querySelector('#timed-phase').textContent.includes('1'));
 s.tick(5500);assert.ok(d.querySelector('#timed-phase').textContent.includes('2'));
 const [first,second]=direction==='ascending'?[130.8128,146.8324]:[146.8324,130.8128];
 s.setSignal(tone(first));for(let t=5850;t<=7600;t+=50)s.tick(t);
 assert.ok(d.querySelector('#timed-result0').textContent.includes('מדויק'));
 s.setSignal(tone(second));for(let t=7700;t<=9400;t+=50)s.tick(t);s.tick(9500);
 assert.equal(d.querySelector('#timed-success').hidden,false);assert.ok(d.querySelector('#timed-result1').textContent.includes('מדויק'));
 assert.equal(d.querySelectorAll('#timed-chart rect').length,2);const count=d.querySelector('#timed-trace').childElementCount;assert.ok(count>20);
 s.tick(11000);assert.equal(d.querySelector('#timed-trace').childElementCount,count);
 d.querySelector('#timed-start').click();await flush();assert.equal(d.querySelector('#timed-trace').childElementCount,0);assert.equal(d.querySelector('#timed-success').hidden,true);
 d.querySelector('#timed-mic').click();assert.equal(s.stopped,1);await s.w.happyDOM.close();
 }
});
test('missing first note does not stall or erase the first target',async()=>{
 const s=await setup({timed:true}),d=s.w.document;
 d.querySelector('#timed-mic').click();await flush();d.querySelector('#timed-start').click();await flush();
 s.setSignal(new Float32Array(4096));for(let t=5850;t<=8000;t+=50)s.tick(t);
 assert.ok(d.querySelector('#timed-target1').classList.contains('active'));
 assert.equal(d.querySelectorAll('#timed-chart rect').length,2);
 s.tick(9500);assert.equal(d.querySelector('#timed-success').hidden,true);assert.ok(d.querySelector('#timed-result0').textContent.includes('לא זוהה'));
 await s.w.happyDOM.close();
});

test('timed notes credit accumulated green-dot time despite short detuning and never credit noise or long gaps',()=>{
 const f=130.8128,round=createTimedRound([48,50]);
 for(let time=5800;time<7600;time+=50){const cents=(time-5800)%350<300?20:40;round.update(detected(f*2**(cents/1200)),time);}
 assert.equal(round.results[0].accurate,true);assert.ok(round.results[0].goodMs>=600);
 for(let time=7600;time<9400;time+=50)round.update(null,time);
 assert.equal(round.results[1].accurate,false);assert.equal(round.results[1].goodMs,0);
 const sparse=createTimedRound([48,50]);for(let time=5800;time<6200;time+=50)sparse.update(detected(f),time);
 const before=sparse.results[0].goodMs;sparse.update(detected(f),7000);assert.equal(sparse.results[0].goodMs,before);
});

test('new short warmup is appended below existing exercises and scores all four slower slots independently',async()=>{
 const s=await setup({warmup:true}),d=s.w.document;
 assert.ok(d.querySelector('#single-exercise'));assert.ok(d.querySelector('#timed-exercise'));assert.ok(d.querySelector('#warmup-exercise'));
 assert.ok(d.querySelector('#timed-exercise').compareDocumentPosition(d.querySelector('#warmup-exercise'))&4);
 assert.equal(d.querySelectorAll('#warmup-chart rect').length,4);
 assert.ok(d.querySelector('#warmup-note2').textContent.includes('מי'));assert.ok(d.querySelector('#warmup-note3').textContent.includes('רה'));
 d.querySelector('#warmup-mic').click();await flush();d.querySelector('#warmup-start').click();await flush();
 s.tick(6500);assert.ok(d.querySelector('#warmup-phase').textContent.includes('1'));
 const frequencies=[130.8128,146.8324,164.8138,146.8324];
 for(let time=8250;time<14250;time+=50){s.setSignal(tone(frequencies[Math.floor((time-8250)/1500)]));s.tick(time);}
 s.tick(14300);assert.equal(d.querySelector('#warmup-success').hidden,false);
 for(let i=0;i<4;i++)assert.ok(d.querySelector('#warmup-result'+i).textContent.includes('מדויק'));
 assert.ok(d.querySelector('#warmup-trace').childElementCount>20);await s.w.happyDOM.close();
});
test('short warmup uses its own timing and accuracy threshold without changing the pair exercise',()=>{
 const notes=[48,50,52,50],config={...WARMUP_TIMING};
 assert.equal(config.slotMs,1500);
 assert.equal(timelinePhase(8200+750,true,{...config,noteCount:4}).step,0);
 assert.equal(timelinePhase(8200+1500,true,{...config,noteCount:4}).step,1);
 const round=createTimedRound(notes,config);
 for(let time=8200;time<14200;time+=50){const step=Math.floor((time-8200)/1500);round.update(step===2?null:detected(440*2**((notes[step]-69)/12)),time);}
 assert.equal(round.results.length,4);assert.deepEqual(round.results.map(r=>r.accurate),[true,true,false,true]);
 assert.equal(timelinePhase(14200,true,{...config,noteCount:4}).phase,'done');
 assert.equal(timelinePhase(6400).phase,'sing');
});

 test('actual page bootstrap schedules slow warmup audio and cursor together',async()=>{
 const s=await setup({bootstrap:true}),d=s.w.document;
 d.querySelector('#warmup-demo').click();await flush();
 assert.equal(s.played.length,4);
 for(let i=0;i<4;i++){assert.ok(Math.abs(s.played[i].start-(.05+i*1.5))<1e-8);assert.ok(Math.abs(s.played[i].stop-s.played[i].start-1.8)<1e-8);}
 s.tick(800);assert.ok(d.querySelector('#warmup-target0').classList.contains('active'));assert.ok(Math.abs(+d.querySelector('#warmup-cursor').getAttribute('x1')-90)<1e-8);
 s.tick(1550);assert.ok(d.querySelector('#warmup-target1').classList.contains('active'));
 s.tick(6350);assert.ok(d.querySelector('#warmup-stop').hidden===false);
 s.tick(6500);assert.equal(d.querySelector('#warmup-stop').hidden,true);
 assert.match(await readFile('public/sing-back/index.html','utf8'),/app\.js\?v=warmup-hold400-v7/);
 await s.w.happyDOM.close();
 });

test('warmup retry skips piano, counts in, clears previous results and scores a fresh round',async()=>{
 const s=await setup({bootstrap:true}),d=s.w.document,retry=d.querySelector('#warmup-retry');
 assert.equal(retry.disabled,true);retry.click();await flush();assert.equal(s.requests,0);
 d.querySelector('#warmup-mic').click();await flush();assert.equal(retry.disabled,false);
 retry.click();await flush();assert.equal(s.played.length,0);assert.equal(retry.disabled,true);
 s.tick(100);assert.match(d.querySelector('#warmup-phase').textContent,/מתכוננים/);
 const frequencies=[130.8128,146.8324,164.8138,146.8324];
 for(let t=1850;t<7850;t+=50){s.setSignal(tone(frequencies[Math.floor((t-1850)/1500)]));s.tick(t);}
 s.tick(7900);assert.equal(d.querySelector('#warmup-success').hidden,false);assert.equal(retry.disabled,false);
 retry.click();await flush();assert.equal(d.querySelector('#warmup-success').hidden,true);assert.equal(d.querySelector('#warmup-trace').childElementCount,0);assert.equal(s.played.length,0);
 s.tick(9800);assert.match(d.querySelector('#warmup-result0').textContent,/מתוך/);
 d.querySelector('#warmup-stop').click();assert.equal(retry.disabled,false);
 d.querySelector('#warmup-mic').click();assert.equal(retry.disabled,true);await s.w.happyDOM.close();
});

test('warmup accepts 400ms accumulated accuracy while retaining the 25-cent boundary and pair threshold',()=>{
 assert.equal(WARMUP_TIMING.requiredMs,400);
 const start=WARMUP_TIMING.demoMs+WARMUP_TIMING.countMs;
 const round=createTimedRound([48,50,52,50],WARMUP_TIMING);
 const f=130.8128;
 // Two accurate segments separated by a brief out-of-range wobble.
 for(let t=0;t<=600;t+=50){const cents=t===300?35:20;round.update(detected(f*2**(cents/1200)),start+t);}
 assert.equal(round.results[0].goodMs,400);assert.equal(round.results[0].accurate,true);
 const outside=createTimedRound([48,50,52,50],WARMUP_TIMING);
 for(let t=0;t<=1400;t+=50)outside.update(detected(f*2**(26/1200)),start+t);
 assert.equal(outside.results[0].goodMs,0);assert.equal(outside.results[0].accurate,false);
 const pair=createTimedRound([48,50]);for(let t=5800;t<=6300;t+=50)pair.update(detected(f),t);
 assert.equal(pair.results[0].goodMs,400);assert.equal(pair.results[0].accurate,false);
});

const finishedSinging={version:1,notes:[48,50,52,53,55,57,51,54,59,49],completed:10,index:9};
test('production singing shows one exercise, persists chromatic settings and leaves interval progress untouched',async()=>{
 const s=await setup({production:true,singingProgress:finishedSinging}),d=s.w.document;
 assert.equal(s.requests,0);assert.equal(s.played.length,0);assert.equal(d.querySelector('#single-exercise').hidden,false);assert.equal(d.querySelector('#timed-exercise').hidden,true);assert.equal(d.querySelector('#warmup-exercise').hidden,true);
 d.querySelector('#target-select').value='49';d.querySelector('#target-select').dispatchEvent(new s.w.Event('change'));assert.match(d.querySelector('#target-name').textContent,/C♯3/);
 d.querySelector('[data-exercise="timed"]').click();assert.equal(d.querySelector('#single-exercise').hidden,true);assert.equal(d.querySelector('#timed-exercise').hidden,false);
 d.querySelector('#timed-direction').value='descending';d.querySelector('#timed-direction').dispatchEvent(new s.w.Event('change'));
 d.querySelector('#timed-root').value='51';d.querySelector('#timed-root').dispatchEvent(new s.w.Event('change'));
 const saved=s.w.localStorage.getItem('ear-training-singing-v1');assert.equal(s.w.localStorage.getItem('ear-training-v1'),'existing-interval-progress');
 const again=await setup({production:true,singingSaved:saved,singingProgress:finishedSinging}),a=again.w.document;
 assert.equal(a.querySelector('#timed-exercise').hidden,false);assert.equal(a.querySelector('#target-select').value,'49');assert.equal(a.querySelector('#timed-root').value,'51');assert.equal(a.querySelector('#timed-direction').value,'descending');assert.equal(again.requests,0);
 a.querySelector('#next-exercise').click();assert.equal(a.querySelector('#warmup-exercise').hidden,false);assert.equal(a.querySelector('#next-exercise').hidden,true);a.querySelector('#previous-exercise').click();assert.equal(a.querySelector('#timed-exercise').hidden,false);
 await s.w.happyDOM.close();await again.w.happyDOM.close();
});
test('production exercise changes and exit stop microphone and pending single-note playback',async()=>{
 const s=await setup({production:true,singingProgress:finishedSinging}),d=s.w.document;
 d.querySelector('#mic').click();await flush();assert.equal(s.requests,1);
 let release;s.env.fetch=()=>new Promise(resolve=>{release=()=>resolve({ok:true,arrayBuffer:async()=>new ArrayBuffer(8)});});
 d.querySelector('#play').click();await flush();d.querySelector('[data-exercise="timed"]').click();release();await flush();assert.equal(s.played.length,0);assert.equal(s.stopped,1);
 d.querySelector('#timed-mic').click();await flush();assert.equal(d.querySelector('#timed-retry').disabled,false);
 d.querySelector('#timed-retry').click();await flush();s.tick(1900);assert.match(d.querySelector('#timed-phase').textContent,/עכשיו שרים/);
 s.emit('singing-stop');assert.equal(s.stopped,2);assert.equal(d.querySelector('#timed-retry').disabled,true);assert.equal(d.querySelector('#timed-stop').hidden,true);
 d.querySelector('[data-exercise="single"]').click();assert.equal(d.querySelector('#play').disabled,false);
 await s.w.happyDOM.close();
});
test('production safely restores malformed or out-of-range settings without requesting a microphone',async()=>{
 for(const saved of ['broken JSON',JSON.stringify({exercise:'invalid','target-select':99,'timed-root':47,'warmup-root':61,direction:'invalid'})]){
 const s=await setup({production:true,singingSaved:saved}),d=s.w.document;assert.equal(d.querySelector('#single-exercise').hidden,false);assert.ok(NATURALS.includes(Number(d.querySelector('#target-select').value)));assert.equal(d.querySelector('#timed-root').value,'48');assert.equal(s.requests,0);await s.w.happyDOM.close();
 }
});

test('singing curriculum randomizes five naturals then a guaranteed mix, and completion is idempotent',()=>{
 for(let trial=0;trial<200;trial++){const p=newProgress();assert.equal(p.notes.length,10);assert.ok(p.notes.slice(0,5).every(n=>NATURALS.includes(n)));assert.ok(p.notes.slice(5).some(n=>NATURALS.includes(n)));assert.ok(p.notes.slice(5).some(n=>!NATURALS.includes(n)));}
 let p=newProgress();assert.equal(nextTarget(p),p);assert.equal(completeTarget(p,-1),p);
 for(let i=0;i<10;i++){const note=p.notes[p.index];p=completeTarget(p,note);assert.equal(p.completed,i+1);assert.equal(completeTarget(p,note),p);if(i<9)p=nextTarget(p);}
 assert.equal(p.completed,10);assert.equal(nextTarget(p),p);
 for(const raw of ['broken',JSON.stringify({...p,completed:11}),JSON.stringify({...p,notes:Array(10).fill(49)})]){const restored=loadProgress({getItem:()=>raw});assert.equal(restored.completed,0);assert.ok(NATURALS.includes(restored.notes[0]));}
});
test('guided singing requires listening and ten distinct completed questions, survives retries and refresh, and opens the next stage manually',async()=>{
 let s=await setup({production:true,singingSaved:JSON.stringify({exercise:'warmup','target-select':49})}),d=s.w.document,time=0;
 const progress=()=>JSON.parse(s.w.localStorage.getItem(PROGRESS_KEY));
 assert.equal(d.querySelector('#single-exercise').hidden,false);assert.equal(d.querySelector('[data-exercise="timed"]').disabled,true);assert.equal(d.querySelector('[data-exercise="warmup"]').disabled,true);assert.equal(d.querySelector('#next').disabled,true);assert.equal(d.querySelector('label[for="target-select"]').hidden,true);
 d.querySelector('[data-exercise="timed"]').click();assert.equal(d.querySelector('#single-exercise').hidden,false);
 d.querySelector('#mic').click();await flush();s.setSignal(tone(440*2**((progress().notes[0]-69)/12)));for(let i=0;i<20;i++)s.tick(time+=50);assert.equal(progress().completed,0);
 for(let i=0;i<10;i++){
  const note=progress().notes[progress().index];if(i<5)assert.ok(NATURALS.includes(note));
  if(i===0){d.querySelector('#play').click();await flush();} // Other questions are played by the next button.
  s.finishPiano();s.tick(time+=400);s.setSignal(tone(440*2**((note+1-69)/12)));for(let t=0;t<20;t++)s.tick(time+=50);assert.equal(progress().completed,i);
  s.setSignal(tone(440*2**((note-69)/12)));for(let t=0;t<23;t++)s.tick(time+=50);assert.equal(progress().completed,i+1);assert.equal(d.querySelector('#singing-progress-bar').getAttribute('aria-valuenow'),String(i+1));
  if(i===0){d.querySelector('#retry').click();for(let t=0;t<23;t++)s.tick(time+=50);assert.equal(progress().completed,1);d.querySelector('#play').click();await flush();s.finishPiano();s.tick(time+=400);for(let t=0;t<23;t++)s.tick(time+=50);assert.equal(progress().completed,1);}
  if(i===4){const saved=progress(),preferences=s.w.localStorage.getItem('ear-training-singing-v1');await s.w.happyDOM.close();s=await setup({production:true,singingProgress:saved,singingSaved:preferences});d=s.w.document;time=0;assert.equal(progress().completed,5);assert.equal(d.querySelector('#next').disabled,false);assert.equal(d.querySelector('[data-exercise="timed"]').disabled,true);d.querySelector('#mic').click();await flush();}
  if(i===1){d.querySelector('#play').click();await flush();}
  if(i<9){const played=s.played.length;d.querySelector('#next').click();await flush();assert.equal(s.played.length,played+1);assert.equal(progress().index,i+1);assert.equal(d.querySelector('#next').disabled,true);}
 }
 assert.equal(d.querySelector('#singing-stage-complete').hidden,false);assert.equal(d.querySelector('#single-exercise').hidden,false);assert.equal(d.querySelector('[data-exercise="timed"]').disabled,false);assert.equal(d.querySelector('#next').hidden,true);assert.equal(s.w.localStorage.getItem('ear-training-v1'),'existing-interval-progress');
 d.querySelector('#open-two-notes').click();assert.equal(d.querySelector('#timed-exercise').hidden,false);
 const again=await setup({production:true,singingProgress:progress(),singingSaved:s.w.localStorage.getItem('ear-training-singing-v1')});assert.equal(again.w.document.querySelector('[data-exercise="timed"]').disabled,false);assert.equal(again.w.document.querySelector('#timed-exercise').hidden,false);
 await s.w.happyDOM.close();await again.w.happyDOM.close();
});
