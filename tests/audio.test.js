import test from 'node:test';
import assert from 'node:assert/strict';
import {play,NOTE_DURATION,NOTE_GAP,PLAYBACK_DURATION_MS} from '../src/audio.js';
test('sampled piano is softened on initial and repeated playback with no note overlap',async()=>{
 const original={AudioContext:globalThis.AudioContext,window:globalThis.window,fetch:globalThis.fetch,setTimeout:globalThis.setTimeout};
 const notes=[],envelopes=[],delays=[];
 globalThis.window={PIANO_SAMPLES:{60:'sample',67:'sample',72:'sample',76:'sample'}};
 globalThis.fetch=async()=>({ok:true,arrayBuffer:async()=>new ArrayBuffer(8)});
 globalThis.setTimeout=(fn,ms)=>{delays.push(ms);queueMicrotask(fn);return 1;};
 globalThis.AudioContext=class{
 currentTime=10;destination={};resume(){return Promise.resolve();}decodeAudioData(){return Promise.resolve({});}
 createBufferSource(){const note={connect(){},start(t){this.startTime=t;},stop(t){if(t!==undefined)this.stopTime=t;}};notes.push(note);return note;}
 createGain(){const events=[];envelopes.push(events);return {connect(){},gain:{setValueAtTime(v,t){events.push({type:'set',v,t});},linearRampToValueAtTime(v,t){events.push({type:'ramp',v,t});}}};}
 };
 try{
 for(const pair of [[60,67],[60,67],[72,76]]){
 await play(...pair);
 const [first,second]=notes.slice(-2);
 assert.ok(Math.abs(first.stopTime-first.startTime-NOTE_DURATION)<1e-9);
 assert.ok(Math.abs(second.startTime-first.stopTime-NOTE_GAP)<1e-9);
 for(const envelope of envelopes.slice(-2)){
 assert.equal(envelope[0].v,0);
 assert.ok(envelope[1].t>envelope[0].t&&envelope[1].t-envelope[0].t<.03);
 assert.ok(envelope[1].v<.8&&envelope[1].v>.4);
 assert.equal(envelope.at(-1).v,0);
 assert.ok(envelope.at(-1).t-envelope.at(-2).t>=.29);
 }
 assert.ok(10+PLAYBACK_DURATION_MS/1000>=second.stopTime);
 }
 assert.equal(notes.length,6);assert.ok(delays.includes(PLAYBACK_DURATION_MS));
 }finally{Object.assign(globalThis,original);}
});
