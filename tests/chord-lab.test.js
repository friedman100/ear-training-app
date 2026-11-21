import {createPitchChart} from '../lab/shared/pitch-chart.js';
import test from 'node:test';import assert from 'node:assert/strict';import {readFile} from 'node:fs/promises';import {Window} from 'happy-dom';
import {newChord,QUALITIES,createChordAttempt} from '../lab/chord-separation/logic.js';import {name,hz,RANGES} from '../lab/harmonic-separation/logic.js';import {detectPitch} from '../public/sing-back/pitch.js';
test('all four triad formulas, random selection and full note range',()=>{
 const expected={major:[0,4,7],minor:[0,3,7],diminished:[0,3,6],augmented:[0,4,8]};
 for(const range of Object.keys(RANGES))for(const type of Object.keys(expected))for(const rng of [()=>0,()=>.99999,Math.random]){
 const c=newChord(range,type,undefined,rng);assert.deepEqual(c.notes.map(n=>n-c.notes[0]),expected[type]);assert.ok(c.notes[0]>=RANGES[range][0]&&c.notes[2]<=RANGES[range][1]);}
 for(const [i,type] of Object.keys(expected).entries())assert.equal(newChord('middle','mixed',undefined,()=>(i+.5)/4).type,type);
});
test('three sequential stable notes, wrong notes, silence, octave equivalence and retries',()=>{for(const type of Object.keys(QUALITIES)){const c=newChord('middle',type),a=createChordAttempt();let time=0;for(let i=0;i<3;i++){for(let k=0;k<20;k++)a.update({frequency:hz(c.notes[(i+1)%3]),confidence:1},c.notes,time+=50);assert.equal(a.matched,false);for(let k=0;k<16;k++)a.update({frequency:hz(c.notes[i]-12),confidence:1},c.notes,time+=50);assert.equal(a.matched,true);assert.equal(a.complete,i===2);if(i<2){assert.equal(a.advance(),true);assert.equal(a.matched,false);}}a.reset();assert.equal(a.index,0);assert.equal(a.matched,false);assert.equal(a.update(null,c.notes,time+=50).reliable,false);}});
test('full page: piano gate, three sung targets, popups, replay, retry, new chord and microphone cleanup',async()=>{
 const w=new Window({url:'https://lab.example/chords/'});w.document.write(await readFile('lab/chord-separation/index.html','utf8'));
 const d=w.document;let signal=new Float32Array(4096),callback,requests=0,stopped=0,plan;
 w.createPitchChart=createPitchChart;w.newChord=newChord;w.QUALITIES=QUALITIES;w.createChordAttempt=createChordAttempt;w.name=name;w.detectPitch=detectPitch;w.stop=()=>{};w.playReferenceSequence=async p=>{plan=p;};w.isSecureContext=true;
 w.requestAnimationFrame=fn=>{callback=fn;return 1;};w.cancelAnimationFrame=()=>{};
 w.AudioContext=class{sampleRate=48000;resume(){return Promise.resolve();}close(){}createMediaStreamSource(){return {connect(){},disconnect(){}};}createAnalyser(){return {fftSize:4096,getFloatTimeDomainData(a){a.set(signal);}};}};
 Object.defineProperty(w.navigator,'mediaDevices',{value:{getUserMedia:async()=>{requests++;return {getTracks:()=>[{stop(){stopped++;}}]};}}});
 w.eval((await readFile('lab/chord-separation/main.js','utf8')).replace(/^import .*;\n/gm,''));const flush=async()=>{for(let i=0;i<20;i++)await Promise.resolve();};
 const sing=(midi,start)=>{signal=Float32Array.from({length:4096},(_,i)=>.2*Math.sin(2*Math.PI*hz(midi)*i/48000));for(let t=start;t<start+1000;t+=50)callback(t);};
 assert.ok(d.querySelector('#single-pitch-chart'));assert.equal(requests,0);d.getElementById('mic').click();await flush();assert.equal(requests,1);
 assert.equal(d.querySelectorAll('#quality option').length,5);
 let notes=[...d.querySelectorAll('#chord-steps strong')].map(e=>e.textContent);
 const midiFor=s=>Array.from({length:72},(_,i)=>i+24).find(n=>name(n)===s);
 sing(midiFor(notes[0]),1000);assert.equal(d.getElementById('matched-dialog').open,false);
 d.getElementById('together').click();await flush();assert.deepEqual([...plan].map(n=>n.offset),[0,0,0]);assert.deepEqual([...plan].map(n=>name(n.midi)),notes);
 for(let i=0;i<3;i++){sing(midiFor(notes[i])-12,3000+i*1200);assert.equal(d.getElementById('matched-dialog').open,true);assert.equal(d.querySelectorAll('#chord-steps .done').length,i+1);assert.ok(d.querySelector('#single-pitch-trace').getAttribute('d'));if(i<2){d.getElementById('matched-next').click();assert.equal(d.querySelector('#single-chart-target').textContent,notes[i+1]);assert.equal(d.querySelector('#single-pitch-trace').getAttribute('d'),'');}}
 assert.match(d.getElementById('matched-title').textContent,/כל האקורד/);d.getElementById('matched-next').click();assert.equal(d.getElementById('matched-dialog').open,false);assert.equal(d.querySelectorAll('#chord-steps .done').length,0);
 d.getElementById('broken').click();await flush();assert.deepEqual([...plan].map(n=>n.offset),[0,1.5,3]);d.getElementById('retry').click();assert.match(d.getElementById('gauge-target').textContent,/הנמוך/);
 d.getElementById('mic').click();assert.ok(stopped>0);assert.equal(d.getElementById('mic-state').textContent,'המיקרופון כבוי');await w.happyDOM.close();
});
