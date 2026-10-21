import test from 'node:test';
import assert from 'node:assert/strict';
import {playChord,play,NOTE_DURATION,NOTE_GAP,RELEASE_TAIL,PLAYBACK_DURATION_MS} from '../src/audio.js';
test('sampled piano is softened on initial and repeated playback with a gentle overlapping release',async()=>{
 const original={AudioContext:globalThis.AudioContext,window:globalThis.window,fetch:globalThis.fetch,setTimeout:globalThis.setTimeout};
 const notes=[],envelopes=[],delays=[];
 globalThis.window={PIANO_SAMPLES:{60:'sample',67:'sample',72:'sample',76:'sample'}};
 globalThis.fetch=async()=>({ok:true,arrayBuffer:async()=>new ArrayBuffer(8)});
 globalThis.setTimeout=(fn,ms)=>{delays.push(ms);queueMicrotask(fn);return 1;};
 globalThis.AudioContext=class{
 currentTime=10;destination={};resume(){return Promise.resolve();}decodeAudioData(){return Promise.resolve({});}
 createBufferSource(){const note={connect(){},start(t){this.startTime=t;},stop(t){if(t!==undefined)this.stopTime=t;}};notes.push(note);return note;}
 createGain(){const events=[];envelopes.push(events);return {connect(){},gain:{setValueAtTime(v,t){events.push({type:'set',v,t});},linearRampToValueAtTime(v,t){events.push({type:'ramp',v,t});},exponentialRampToValueAtTime(v,t){events.push({type:'exponential',v,t});}}};}
 };
 try{
 for(const pair of [[60,67],[60,67],[72,76]]){
 await play(...pair);
 const [first,second]=notes.slice(-2);
 assert.ok(Math.abs(first.stopTime-first.startTime-NOTE_DURATION-RELEASE_TAIL)<1e-9);
 assert.ok(Math.abs(second.startTime-first.startTime-(NOTE_DURATION+NOTE_GAP))<1e-9);
 assert.ok(Math.abs(first.stopTime-second.startTime-(RELEASE_TAIL-NOTE_GAP))<1e-9);
 assert.ok(first.stopTime>second.startTime);
 for(const envelope of envelopes.slice(-2)){
 assert.equal(envelope[0].v,0);
 assert.ok(envelope[1].t>envelope[0].t&&envelope[1].t-envelope[0].t<.03);
 assert.equal(envelope[1].v,1); // Samples carry the audition's calibrated level.
 assert.equal(envelope.at(-1).v,0);
 assert.equal(envelope.at(-2).type,'exponential');
 assert.equal(envelope.at(-2).v,.0001);
 assert.ok(Math.abs(envelope.at(-1).t-envelope.at(-2).t-.02)<1e-9);
 assert.ok(envelope.at(-2).t-envelope[2].t>1.5);
 }
 assert.ok(10+PLAYBACK_DURATION_MS/1000>=second.stopTime);
 }
 assert.equal(notes.length,6);assert.ok(delays.includes(PLAYBACK_DURATION_MS));
 for(const type of ['descending','upDown','harmonic']){
 const count=type==='upDown'?4:2;const before=notes.length;let ready=false;
 await play(60,67,()=>{},()=>{ready=true;},type);
 assert.ok(ready);assert.equal(notes.length-before,count);
 const played=notes.slice(-count),levels=envelopes.slice(-count);
 const offsets=played.map(note=>Number((note.startTime-played[0].startTime).toFixed(2)));
 assert.deepEqual(offsets,type==='harmonic'?[0,0]:Array.from({length:count},(_,i)=>i*.85));
 assert.ok(delays.at(-1)/1000+10>=played.at(-1).stopTime);
 assert.equal(levels[0][1].v,type==='harmonic'?.7:1);
 }
 for(const tones of [[60,67,72],[60,67,72,76]])for(const broken of [false,true]){
 const before=notes.length;await playChord(tones,broken);const played=notes.slice(before);assert.equal(played.length,tones.length);
 played.forEach((note,i)=>assert.ok(Math.abs(note.startTime-played[0].startTime-(broken?i*.85:0))<1e-9));
 assert.equal(envelopes.at(-1)[1].v,broken?1:1/Math.sqrt(tones.length));
 }
 }finally{Object.assign(globalThis,original);}
});
