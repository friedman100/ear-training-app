import test from 'node:test';
import assert from 'node:assert/strict';
import {CONFIG,roots,newRoot,hz,createReading} from '../lab/harmonic-separation/logic.js';
import {detectPitch} from '../public/sing-back/pitch.js';
import {readFile,readdir} from 'node:fs/promises';
import {Window} from 'happy-dom';
test('all allowed intervals fit every range and new pairs change root',()=>{
 for(const range of ['low','middle','high'])for(const interval of [1,2,3,4,5,7]){const options=roots(range,interval);assert.ok(options.every(n=>n+interval<=options[0]+12));for(const n of options)assert.notEqual(newRoot(range,interval,n,()=>.5),n);}
});
test('40 cents and 500ms stability distinguish low/high and actual octave without silent correction',()=>{
 for(const cents of [-41,-39,0,39,41])for(const target of [60,65])for(const octave of [-12,0,12]){const tracker=createReading();let r;for(let time=0;time<=800;time+=50)r=tracker.update({frequency:hz(target+octave+cents/100),confidence:.99},60,65,time);assert.equal(r.stable,Math.abs(cents)<=40);assert.ok(Math.abs(r.midi-(target+octave+cents/100))<.001);if(r.stable)assert.equal(r.exact,octave===0);}
 const tracker=createReading();let r;for(let t=0;t<=400;t+=50)r=tracker.update({frequency:hz(65),confidence:1},60,65,t);assert.equal(r.stable,false);assert.equal(tracker.update(null,60,65,450),null);for(let t=500;t<=950;t+=50)r=tracker.update({frequency:hz(65),confidence:1},60,65,t);assert.equal(r.stable,false);assert.equal(tracker.update({frequency:hz(65),confidence:.5},60,65,1000),null);
});
test('shared pitch detector measures actual waveform and rejects silence',()=>{
 const input=Float32Array.from({length:4096},(_,i)=>.2*Math.sin(2*Math.PI*261.6256*i/48000));const d=detectPitch(input,48000);assert.ok(Math.abs(d.frequency-261.6256)<1);assert.equal(detectPitch(new Float32Array(4096),48000),null);assert.equal(CONFIG.holdMs,500);
});
test('isolated built page has manual steps, all helpers, no microphone on load or progress storage',async()=>{
 const w=new Window({url:'https://lab.example/lab/harmonic-separation/'});w.document.write((await readFile('dist-lab/lab/harmonic-separation/index.html','utf8')).replace(/<script[^>]*>[\s\S]*?<\/script>/g,''));w.localStorage.setItem('ear-training-v1','preserved');
 w.eval(await readFile('dist-lab/assets/'+(await readdir('dist-lab/assets')).find(n=>n.endsWith('.js')),'utf8'));
 const d=w.document;assert.equal(d.querySelector('#mic-state').textContent,'המיקרופון כבוי');assert.equal(d.querySelectorAll('[data-step]').length,3);assert.equal(d.querySelectorAll('#target-lines line').length,2);assert.equal(d.querySelectorAll('#interval option').length,6);
 d.querySelector('#advance').click();assert.match(d.querySelector('#instruction').textContent,/הנמוך/);d.querySelector('[data-mode="free"]').click();assert.equal(d.querySelector('#guided').hidden,true);d.querySelector('#selection').value='manual';d.querySelector('#selection').dispatchEvent(new w.Event('change'));assert.equal(d.querySelector('#root-label').hidden,false);assert.equal(w.localStorage.getItem('ear-training-v1'),'preserved');assert.equal(w.localStorage.length,1);await w.happyDOM.close();
});
