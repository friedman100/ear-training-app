import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {Window} from 'happy-dom';
import {detectPitch,centsFromTarget,createTracker} from '../public/sing-back/pitch.js';
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
async function setup({secure=true,deny=false}={}){
 const w=new Window({url:'https://example.test/ear-training-app/sing-back/'});
 w.document.write((await readFile('public/sing-back/index.html','utf8')).replace(/<script[^>]*>[\s\S]*?<\/script>/g,''));
 let requests=0,stopped=0,frame,clock=0,signal=tone(130.8128),source;
 const env={document:w.document,isSecureContext:secure,performance:{now:()=>clock},navigator:{mediaDevices:{getUserMedia:async()=>{requests++;if(deny)throw Object.assign(new Error(),{name:'NotAllowedError'});return {getTracks:()=>[{stop(){stopped++;}}]};}}},AudioContext:class{sampleRate=48000;currentTime=0;destination={};resume(){return Promise.resolve();}close(){}createMediaStreamSource(){return {connect(){},disconnect(){}};}createAnalyser(){return {fftSize:4096,getFloatTimeDomainData(array){array.set(signal);}};}decodeAudioData(){return Promise.resolve({});}createBufferSource(){source={connect(){},start(){},stop(){}};return source;}createGain(){return {connect(){},gain:{setValueAtTime(){},linearRampToValueAtTime(){},exponentialRampToValueAtTime(){}}};}},fetch:async()=>({ok:true,arrayBuffer:async()=>new ArrayBuffer(8)}),requestAnimationFrame:fn=>{frame=fn;return 1;},cancelAnimationFrame(){frame=null;},addEventListener(){}};
 createPrototype(env);
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
