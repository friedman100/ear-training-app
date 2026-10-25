import test from 'node:test';
import assert from 'node:assert/strict';
import {playReferenceSequence,play,stop} from '../src/audio.js';
import {INTERVAL_REFERENCES,referencePlan} from '../src/interval-references.js';
test('reference piano schedules every duration, replaces old sound, and ignores cancelled loads',async()=>{
 const original={window:globalThis.window,AudioContext:globalThis.AudioContext,fetch:globalThis.fetch,setTimeout:globalThis.setTimeout};const sources=[],envelopes=[],delays=[];
 globalThis.window={PIANO_SAMPLES:Object.fromEntries(Array.from({length:49},(_,i)=>[48+i,String(48+i)]))};
 globalThis.fetch=async url=>({ok:true,arrayBuffer:async()=>Uint8Array.of(Number(url.split(',').at(-1))).buffer});
 globalThis.setTimeout=(fn,ms)=>{delays.push(ms);queueMicrotask(fn);return 1;};
 globalThis.AudioContext=class{currentTime=10;destination={};resume(){return Promise.resolve();}decodeAudioData(bytes){return Promise.resolve({midi:new Uint8Array(bytes)[0]});}createBufferSource(){const n={connect(){},playbackRate:{value:1},start(t){this.startTime=t;},stop(t){if(t===undefined)this.cancelled=true;else this.endTime=t;}};sources.push(n);return n;}createGain(){const events=[];envelopes.push(events);return {connect(){},gain:{setValueAtTime:(v,t)=>events.push([v,t]),linearRampToValueAtTime:(v,t)=>events.push([v,t]),exponentialRampToValueAtTime:(v,t)=>events.push([v,t])}};}};
 try{
 await play(60,65);const questionSources=[...sources];const ref=INTERVAL_REFERENCES.find(r=>r.id==='we-wish'),plan=referencePlan(ref);const before=sources.length;await playReferenceSequence(plan);assert.ok(questionSources.every(s=>s.cancelled));
 const melody=sources.slice(before);assert.equal(melody.length,8);melody.forEach((source,i)=>{assert.equal(source.buffer.midi,plan[i].midi);assert.ok(Math.abs(source.startTime-10.03-plan[i].offset)<1e-9);assert.ok(Math.abs(source.endTime-source.startTime-plan[i].duration-plan[i].release)<1e-9);const env=envelopes[before+i];assert.ok(env.every((event,j)=>!j||event[1]>=env[j-1][1]));});
 await playReferenceSequence(referencePlan(ref,'interval'));assert.ok(melody.every(s=>s.cancelled));assert.deepEqual(sources.slice(-2).map(s=>s.buffer.midi),[62,67]);
 const previous=sources.length;let releaseFetch;globalThis.fetch=()=>new Promise(resolve=>{releaseFetch=()=>resolve({ok:true,arrayBuffer:async()=>Uint8Array.of(90).buffer});});
 const pending=playReferenceSequence([{midi:90,offset:0,duration:.4,release:.12}]);for(let i=0;i<10;i++)await Promise.resolve();stop();releaseFetch();await pending;assert.equal(sources.length,previous);
 assert.ok(delays.some(ms=>ms>3000));
 }finally{stop();Object.assign(globalThis,original);}
});
