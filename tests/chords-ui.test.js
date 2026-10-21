import {Window} from 'happy-dom';
import {readFile,readdir} from 'node:fs/promises';
import assert from 'node:assert/strict';
import test from 'node:test';
import {CHORD_KEY,CHORD_SESSION_KEY,chordInitial} from '../src/chords.js';
import {initialState} from '../src/logic.js';
const asset=(await readdir('dist/assets')).find(f=>f.endsWith('.js')),source=await readFile('dist/assets/'+asset,'utf8');
const flush=async()=>{for(let i=0;i<60;i++)await Promise.resolve();};
function setup(saved={}){
 const w=new Window({url:'http://localhost:5173'});w.document.body.innerHTML='<div id="app"></div>';w.structuredClone=structuredClone;w.notes=[];
 for(const [key,value]of Object.entries(saved))w.localStorage.setItem(key,value);
 w.AudioContext=class{currentTime=0;destination={};resume(){return Promise.resolve();}decodeAudioData(){return Promise.resolve({});}createBufferSource(){const note={connect(){},start(t){this.t=t;},stop(){}};w.notes.push(note);return note;}createGain(){return {connect(){},gain:{setValueAtTime(){},linearRampToValueAtTime(){},exponentialRampToValueAtTime(){}}};}};
 w.fetch=async()=>({ok:true,arrayBuffer:async()=>new ArrayBuffer(8)});w.setTimeout=fn=>{queueMicrotask(fn);return 1;};w.eval(source);w.document.querySelector('[data-section="chords"]').click();return w;
}
const session=w=>JSON.parse(w.localStorage.getItem(CHORD_SESSION_KEY));
const current=w=>session(w).current.q;
async function hear(w,broken=false){w.document.querySelector(broken?'#chord-broken':'#chord-listen').click();await flush();}
function choose(w,id){w.document.querySelector(`[data-chord-answer="${id}"]`).click();}
test('guided and free chord summaries count retries once, support refresh, and preserve interval progress',async()=>{
 const interval=JSON.stringify({...initialState(),stage:3});let w=setup({'ear-training-v1':interval}),d=w.document;
 assert.equal(d.querySelectorAll('[data-chord-answer]').length,2);assert.ok(d.querySelector('[data-chord-answer]').disabled);
 await hear(w);assert.deepEqual(w.notes.slice(-3).map(n=>n.t),[.03,.03,.03]);
 const q=current(w);choose(w,q.interval===1?2:1);assert.equal(d.querySelectorAll('.wrong').length,1);assert.equal(d.querySelectorAll('.correct').length,0);assert.equal(session(w).total,0);
 const saved=Object.fromEntries(Object.keys(w.localStorage).map(k=>[k,w.localStorage.getItem(k)]));
 // Explicit keys are used because Storage own property enumeration varies by DOM implementation.
 for(const key of [CHORD_KEY,CHORD_SESSION_KEY,'ear-training-v1'])saved[key]=w.localStorage.getItem(key);
 await w.happyDOM.close();w=setup(saved);d=w.document;assert.equal(current(w).attempts,1);await hear(w,true);assert.deepEqual(w.notes.slice(-3).map(n=>Number(n.t.toFixed(2))),[.03,.88,1.73]);choose(w,current(w).interval);
 assert.equal(session(w).total,1);assert.equal(session(w).correct,0);d.querySelector('#chord-next').click();await flush();choose(w,current(w).interval);assert.equal(session(w).total,2);assert.equal(session(w).correct,1);
 d.querySelector('#chord-free').click();assert.equal(d.querySelectorAll('[data-chord-choice]').length,13);await hear(w);choose(w,current(w).interval);assert.equal(session(w).total,3);assert.equal(session(w).correct,2);
 const history=JSON.parse(w.localStorage.getItem(CHORD_KEY)).history;assert.equal(history.length,2);
 d.querySelector('#chord-end').click();assert.match(d.querySelector('.summary').textContent,/67%/);assert.equal(d.querySelectorAll('tbody tr').length,Object.keys(session(w).intervals).length);
 d.querySelector('#chord-new').click();assert.equal(session(w).total,0);assert.deepEqual(JSON.parse(w.localStorage.getItem(CHORD_KEY)).history,history);assert.equal(w.localStorage.getItem('ear-training-v1'),interval);
 d.querySelector('[data-section="intervals"]').click();assert.equal(d.querySelectorAll('[data-answer]').length,5);
 await w.happyDOM.close();
});
test('guided chord unlock is shown, saved in summary, and survives new session',async()=>{
 const state=chordInitial();state.history=Array.from({length:19},(_,i)=>({interval:1+i%2,correct:true}));const w=setup({[CHORD_KEY]:JSON.stringify(state)}),d=w.document;
 await hear(w);choose(w,current(w).interval);assert.match(d.querySelector('dialog').textContent,/מוקטן/);assert.equal(JSON.parse(w.localStorage.getItem(CHORD_KEY)).stage,1);assert.deepEqual(session(w).unlocked,[3]);
 d.querySelector('#chord-demo').click();await flush();d.querySelector('#chord-continue').click();d.querySelector('#chord-end').click();assert.match(d.querySelector('.summary-unlocks').textContent,/מוקטן/);d.querySelector('#chord-new').click();assert.equal(JSON.parse(w.localStorage.getItem(CHORD_KEY)).stage,1);await w.happyDOM.close();
});
