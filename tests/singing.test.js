import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {Window} from 'happy-dom';
import {detectPitch,centsFromTarget,createTracker} from '../public/sing-back/pitch.js';
import {createTimedPair} from '../public/sing-back/timed-pair.js';
import {timelinePhase,createTimedRound} from '../public/sing-back/timeline.js';
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
async function setup({secure=true,deny=false,timed=false,warmup=false}={}){
 const w=new Window({url:'https://example.test/ear-training-app/sing-back/'});
 w.document.write((await readFile('public/sing-back/index.html','utf8')).replace(/<script[^>]*>[\s\S]*?<\/script>/g,''));
 let requests=0,stopped=0,frame,clock=0,signal=tone(130.8128),source;
 const env={document:w.document,isSecureContext:secure,performance:{now:()=>clock},navigator:{mediaDevices:{getUserMedia:async()=>{requests++;if(deny)throw Object.assign(new Error(),{name:'NotAllowedError'});return {getTracks:()=>[{stop(){stopped++;}}]};}}},AudioContext:class{sampleRate=48000;get currentTime(){return clock/1000;}destination={};resume(){return Promise.resolve();}close(){}createMediaStreamSource(){return {connect(){},disconnect(){}};}createAnalyser(){return {fftSize:4096,getFloatTimeDomainData(array){array.set(signal);}};}decodeAudioData(){return Promise.resolve({});}createBufferSource(){source={connect(){},start(){},stop(){}};return source;}createGain(){return {connect(){},gain:{setValueAtTime(){},linearRampToValueAtTime(){},exponentialRampToValueAtTime(){}}};}},fetch:async()=>({ok:true,arrayBuffer:async()=>new ArrayBuffer(8)}),requestAnimationFrame:fn=>{frame=fn;return 1;},cancelAnimationFrame(){frame=null;},addEventListener(){}};
 if(warmup)createTimedPair(env,{prefix:'warmup-',pattern:[0,2,4,2],slotMs:600,demoMs:2800,countMs:1200,requiredMs:200});else if(timed)createTimedPair(env);else createPrototype(env);
 return {w,env,get requests(){return requests;},get stopped(){return stopped;},tick(time){clock=time;frame?.(time);},finishPiano(){source.onended();},setSignal(value){signal=value;}};
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

test('new short warmup is appended below existing exercises and scores all four fast slots independently',async()=>{
 const s=await setup({warmup:true}),d=s.w.document;
 assert.ok(d.querySelector('#single-exercise'));assert.ok(d.querySelector('#timed-exercise'));assert.ok(d.querySelector('#warmup-exercise'));
 assert.ok(d.querySelector('#timed-exercise').compareDocumentPosition(d.querySelector('#warmup-exercise'))&4);
 assert.equal(d.querySelectorAll('#warmup-chart rect').length,4);
 assert.ok(d.querySelector('#warmup-note2').textContent.includes('מי'));assert.ok(d.querySelector('#warmup-note3').textContent.includes('רה'));
 d.querySelector('#warmup-mic').click();await flush();d.querySelector('#warmup-start').click();await flush();
 s.tick(2900);assert.ok(d.querySelector('#warmup-phase').textContent.includes('1'));
 const frequencies=[130.8128,146.8324,164.8138,146.8324];
 for(let time=4050;time<6450;time+=50){s.setSignal(tone(frequencies[Math.floor((time-4050)/600)]));s.tick(time);}
 s.tick(6500);assert.equal(d.querySelector('#warmup-success').hidden,false);
 for(let i=0;i<4;i++)assert.ok(d.querySelector('#warmup-result'+i).textContent.includes('מדויק'));
 assert.ok(d.querySelector('#warmup-trace').childElementCount>20);await s.w.happyDOM.close();
});
test('short warmup uses its own timing and accuracy threshold without changing the pair exercise',()=>{
 const notes=[48,50,52,50],config={slotMs:600,demoMs:2800,countMs:1200,requiredMs:200};
 const round=createTimedRound(notes,config);
 for(let time=4000;time<6400;time+=50){const step=Math.floor((time-4000)/600);round.update(step===2?null:detected(440*2**((notes[step]-69)/12)),time);}
 assert.equal(round.results.length,4);assert.deepEqual(round.results.map(r=>r.accurate),[true,true,false,true]);
 assert.equal(timelinePhase(6400,true,{...config,noteCount:4}).phase,'done');
 assert.equal(timelinePhase(6400).phase,'sing');
});
