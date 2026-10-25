import test from 'node:test';
import assert from 'node:assert/strict';
import {Window} from 'happy-dom';
import {readFile,readdir} from 'node:fs/promises';
import {initialState} from '../src/logic.js';
import {newSession,SESSION_KEY} from '../src/session.js';
const file=(await readdir('dist/assets')).find(f=>f.endsWith('.js')),source=await readFile('dist/assets/'+file,'utf8');
const flush=async()=>{for(let i=0;i<80;i++)await Promise.resolve();};
function setup({state=initialState(),session=null,introDone=true,controlled=false}={}){
 const w=new Window({url:'http://localhost:5173'});w.document.body.innerHTML='<div id="app"></div>';w.structuredClone=structuredClone;w.notes=[];w.timers=[];
 w.localStorage.setItem('ear-training-v1',JSON.stringify(state));if(session)w.localStorage.setItem(SESSION_KEY,JSON.stringify(session));if(introDone)w.localStorage.setItem('ear-training-reference-intro-v1','done');
 w.AudioContext=class{currentTime=0;destination={};resume(){return Promise.resolve();}decodeAudioData(bytes){return Promise.resolve({midi:new Uint8Array(bytes)[0]});}createBufferSource(){const n={connect(){},playbackRate:{value:1},start(t){this.time=t;},stop(t){if(t===undefined)this.cancelled=true;}};w.notes.push(n);return n;}createGain(){return {connect(){},gain:{setValueAtTime(){},linearRampToValueAtTime(){},exponentialRampToValueAtTime(){}}};}};
 w.fetch=async url=>({ok:true,arrayBuffer:async()=>Uint8Array.of(Number(url.match(/(\d+)\.mp3/)[1])).buffer});w.setTimeout=(fn,ms)=>{if(controlled)w.timers.push({fn,ms});else queueMicrotask(fn);return 1;};
 w.eval(source);w.document.querySelector('[data-section="intervals"]').click();return w;
}
const playRef=(w,id,kind='melody',scope='#reference-drawer')=>w.document.querySelector(`${scope} [data-reference="${id}"][data-reference-kind="${kind}"]`).click();
const sessionOf=w=>JSON.parse(w.localStorage.getItem(SESSION_KEY));
test('new learner introduction shows both starting intervals once and auditions do not answer the question',async()=>{
 const w=setup({introDone:false}),d=w.document;assert.ok(d.querySelector('#reference-intro').open);assert.equal(d.querySelectorAll('#reference-intro .reference-card').length,7);
 const saved=w.localStorage.getItem(SESSION_KEY);d.querySelector('[data-intro-interval="5"]').click();await flush();assert.deepEqual(w.notes.slice(-2).map(n=>n.buffer.midi),[60,65]);assert.ok(d.querySelector('[data-answer]').disabled);assert.equal(w.localStorage.getItem(SESSION_KEY),saved);
 playRef(w,'twinkle','melody','#reference-intro');await flush();assert.deepEqual(w.notes.slice(-7).map(n=>n.buffer.midi),[60,60,67,67,69,69,67]);assert.equal(w.localStorage.getItem(SESSION_KEY),saved);
 d.querySelector('#reference-intro-continue').click();assert.equal(d.querySelector('#reference-intro'),null);assert.equal(w.localStorage.getItem('ear-training-reference-intro-v1'),'done');d.querySelector('#listen').click();await flush();assert.equal(d.querySelector('#reference-intro'),null);assert.ok(!d.querySelector('[data-answer]').disabled);
 const restored=setup({session:sessionOf(w)});assert.equal(restored.document.querySelector('#reference-intro'),null);await restored.happyDOM.close();await w.happyDOM.close();
});
test('library and help reuse all references without revealing or changing a wrong current answer',async()=>{
 const state=initialState();state.mode='free';const session=newSession();session.current={q:{interval:5,start:60,end:65,attempts:1,solved:false},mode:'free',range:'middle',wrong:[7]};
 const w=setup({state,session}),d=w.document;d.querySelector('#listen').click();await flush();const savedState=w.localStorage.getItem('ear-training-v1'),savedSession=w.localStorage.getItem(SESSION_KEY);
 const library=d.querySelector('#reference-library');library.open=true;playRef(w,'bridal-chorus','interval','#reference-library');await flush();assert.ok(d.querySelector('#reference-library').open);assert.deepEqual(w.notes.slice(-2).map(n=>n.buffer.midi),[65,70]);
 d.querySelector('#my-references').click();assert.ok(d.querySelector('#reference-drawer').open);assert.equal(d.querySelectorAll('#reference-drawer .reference-group').length,2);assert.equal(d.querySelectorAll('#reference-drawer .reference-card').length,7);assert.equal(d.querySelectorAll('#reference-drawer [data-reference]:disabled').length,4);
 playRef(w,'royal-fanfare');await flush();assert.deepEqual(w.notes.slice(-4).map(n=>n.buffer.midi),[60,60,60,67]);playRef(w,'twinkle','interval');await flush();assert.deepEqual(w.notes.slice(-2).map(n=>n.buffer.midi),[60,67]);
 assert.equal(w.localStorage.getItem('ear-training-v1'),savedState);assert.equal(w.localStorage.getItem(SESSION_KEY),savedSession);d.querySelector('#close-references').click();assert.equal(d.querySelector('#reference-drawer'),null);assert.ok(d.querySelector('[data-answer="7"]').classList.contains('wrong'));assert.equal(d.querySelector('.answer.correct'),null);
 d.querySelector('[data-answer="5"]').click();assert.equal(sessionOf(w).total,1);assert.equal(sessionOf(w).correct,0);const solved=w.localStorage.getItem(SESSION_KEY);d.querySelector('#my-references').click();playRef(w,'amazing-grace');await flush();d.querySelector('#close-references').click();assert.equal(w.localStorage.getItem(SESSION_KEY),solved);assert.ok(d.querySelector('.answer.correct'));assert.ok(d.querySelector('#next'));await w.happyDOM.close();
});
test('reference help cancels a playing question and a second reference cancels the first without stale ready callbacks',async()=>{
 const w=setup({controlled:true}),d=w.document;d.querySelector('#listen').click();await flush();const question=w.notes.slice(-2);assert.ok(d.querySelector('[data-answer]').disabled);const saved=w.localStorage.getItem(SESSION_KEY);
 d.querySelector('#my-references').click();assert.ok(question.every(n=>n.cancelled));playRef(w,'we-wish');await flush();const melody=w.notes.slice(-8);playRef(w,'royal-fanfare');await flush();assert.ok(melody.every(n=>n.cancelled));const royal=w.notes.slice(-4);d.querySelector('#close-references').click();assert.ok(royal.every(n=>n.cancelled));
 for(const timer of [...w.timers])timer.fn();await flush();assert.ok(d.querySelector('[data-answer]').disabled);assert.equal(w.localStorage.getItem(SESSION_KEY),saved);assert.equal(d.querySelector('.is-playing'),null);assert.equal(d.querySelector('#reference-drawer'),null);
 d.querySelector('#my-references').click();playRef(w,'twinkle');await flush();const last=w.notes.slice(-7);d.querySelector('[data-section="chords"]').click();assert.ok(last.every(n=>n.cancelled));for(const timer of [...w.timers])timer.fn();await flush();assert.ok(d.querySelector('#chord-listen'));await w.happyDOM.close();
});
test('existing unlock introductions automatically include only the new interval references and omit empty groups',async()=>{
 for(const id of [5,7,4]){const state=initialState();state.stage=1;state.pending=id;const w=setup({state}),d=w.document,dialog=d.querySelector('dialog[open]');assert.ok(dialog);assert.ok(d.querySelector('#demo'));assert.equal(dialog.querySelectorAll('.reference-card').length,id===5?4:id===7?3:0);if(id===4)assert.equal(dialog.querySelector('.reference-introduction'),null);d.querySelector('#continue').click();assert.equal(JSON.parse(w.localStorage.getItem('ear-training-v1')).pending,null);assert.equal(JSON.parse(w.localStorage.getItem('ear-training-v1')).stage,1);await w.happyDOM.close();}
});
