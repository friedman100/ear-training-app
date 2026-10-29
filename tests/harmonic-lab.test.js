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
 const d=w.document;assert.equal(d.querySelector('#mic-state').textContent,'המיקרופון כבוי');assert.equal(d.querySelector('#selection'),null);assert.equal(d.querySelector('#root'),null);assert.equal(d.querySelectorAll('#target-lines line').length,2);assert.equal(d.querySelectorAll('#interval option').length,6);
 d.querySelector('#focus').value='low';d.querySelector('#focus').dispatchEvent(new w.Event('change'));assert.match(d.querySelector('#gauge-target').textContent,/הנמוך/);d.querySelector('[data-mode="free"]').click();d.querySelector('#focus').value='low';d.querySelector('#focus').dispatchEvent(new w.Event('change'));d.querySelector('#new').click();assert.equal(d.querySelector('#focus').value,'high');assert.match(d.querySelector('#gauge-target').textContent,/הגבוה/);assert.equal(w.localStorage.getItem('ear-training-v1'),'preserved');assert.equal(w.localStorage.length,2);await w.happyDOM.close();
});

import {STAGES,initialCourse,completePair,advanceCourse,pickInterval,stageDone,loadCourse,COURSE_KEY} from '../lab/harmonic-separation/course.js';
test('five stages require both notes once per pair and balanced interval coverage, survive reload',()=>{
 let s=initialCourse();for(let stage=0;stage<5;stage++){assert.equal(s.stage,stage);assert.equal(advanceCourse(s),false);const counts={};
 while(!stageDone(s)){const interval=pickInterval(s,()=>.5);counts[interval]=(counts[interval]||0)+1;s.pair={low:60,interval,achieved:['low'],counted:false};assert.equal(completePair(s),false);s.pair.achieved.push('high');assert.equal(completePair(s),true);assert.equal(completePair(s),false);s=loadCourse({getItem:()=>JSON.stringify(s)});assert.equal(s.pair.counted,true);}
 for(const interval of STAGES[stage].intervals)assert.equal(counts[interval],STAGES[stage].each);assert.equal(advanceCourse(s),stage<4);
 }assert.equal(loadCourse({getItem:()=>'{bad'}).stage,0);
});
