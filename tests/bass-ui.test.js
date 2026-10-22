import {Window} from 'happy-dom';
import {readFile,readdir} from 'node:fs/promises';
import assert from 'node:assert/strict';
import test from 'node:test';
import {BASS_KEY,bassChords} from '../src/bass.js';
import {initialState} from '../src/logic.js';
const asset=(await readdir('dist/assets')).find(f=>f.endsWith('.js')),source=await readFile('dist/assets/'+asset,'utf8');
const flush=async()=>{for(let i=0;i<60;i++)await Promise.resolve();};
function setup(saved={},controlled=false){
 const w=new Window({url:'http://localhost:5173'});w.document.body.innerHTML='<div id="app"></div>';w.structuredClone=structuredClone;w.notes=[];w.stops=0;w.audioTimers=[];
 for(const [key,value]of Object.entries(saved))w.localStorage.setItem(key,value);
 w.AudioContext=class{currentTime=0;destination={};resume(){return Promise.resolve();}decodeAudioData(){return Promise.resolve({});}createBufferSource(){const note={connect(){},start(t){this.t=t;},stop(){w.stops++;},playbackRate:{value:1}};w.notes.push(note);return note;}createGain(){return {connect(){},gain:{setValueAtTime(){},linearRampToValueAtTime(){},exponentialRampToValueAtTime(){}}};}};
 w.fetch=async()=>({ok:true,arrayBuffer:async()=>new ArrayBuffer(8)});w.setTimeout=fn=>{if(controlled)w.audioTimers.push(fn);else queueMicrotask(fn);return 1;};w.eval(source);w.document.querySelector('[data-section="bass"]').click();return w;
}
const state=w=>JSON.parse(w.localStorage.getItem(BASS_KEY));
const click=(w,id)=>w.document.getElementById('bass-'+id).click();
const enter=async(w,notes)=>{for(let i=0;i<4;i++){w.document.querySelector(`[data-bass-slot="${i}"]`).click();w.document.querySelector(`[data-bass-key="${notes[i]}"]`).click();await flush();click(w,'insert');}};
test('bass exercise supports hidden solution, exact notes, fixes, replay, refresh, aid and next without changing other exercises',async()=>{
 const existing={'ear-training-v1':JSON.stringify({...initialState(),stage:3}),'ear-training-chords-v1':JSON.stringify({version:1,stage:2,history:[],complete:false,pending:null,mode:'guided',selected:[1,2]})};
 let w=setup(existing),d=w.document;
 assert.equal(d.querySelectorAll('[data-bass-slot]').length,4);assert.equal(d.querySelectorAll('[data-bass-key]').length,24);assert.equal(d.querySelector('.bass-solution'),null);assert.equal(d.querySelector('#bass-reveal'),null);assert.ok(d.querySelector('#bass-check').disabled);
 d.querySelector('.bass-keyboard-scroll').scrollLeft=140;d.querySelector('[data-bass-slot="1"]').click();assert.equal(d.querySelector('.bass-keyboard-scroll').scrollLeft,140);
 click(w,'full');await flush();const full=w.notes.slice(-16);assert.equal(full.length,16);assert.deepEqual(full.filter(n=>n.playbackRate.value===.5).map(n=>Number(n.t.toFixed(2))),[.03,1.63,3.23,4.83]);
 const answer=bassChords(state(w).current.q).map(c=>c.bass),wrong=[...answer];wrong[0]=36+(wrong[0]-36+1)%12;await enter(w,wrong);click(w,'answer');await flush();assert.equal(state(w).current.attempts,0);click(w,'check');assert.equal(state(w).current.result.count,3);assert.equal(d.querySelectorAll('.bass-slot.wrong').length,1);assert.equal(d.querySelectorAll('.bass-slot.correct').length,3);assert.equal(d.querySelector('.bass-solution'),null);
 const saved={...existing,[BASS_KEY]:w.localStorage.getItem(BASS_KEY)};await w.happyDOM.close();w=setup(saved);d=w.document;assert.equal(state(w).current.attempts,1);assert.equal(d.querySelectorAll('.bass-slot.correct').length,3);
 click(w,'only');await flush();assert.equal(state(w).current.usedBassOnly,true);assert.equal(w.notes.length,4);assert.deepEqual(w.notes.map(n=>Number(n.t.toFixed(2))),[.03,1.63,3.23,4.83]);
 await enter(w,answer.map(n=>n+12));click(w,'check');assert.equal(state(w).current.result.count,4);assert.equal(state(w).current.firstSuccess,false);click(w,'reveal');assert.equal(d.querySelectorAll('.bass-solution li').length,4);click(w,'next');assert.equal(state(w).stats.completed,1);assert.equal(state(w).stats.assisted,1);assert.equal(state(w).stats.first,0);assert.deepEqual(state(w).current.answer,[null,null,null,null]);assert.equal(d.querySelector('.bass-solution'),null);
 for(const [key,value]of Object.entries(existing))assert.equal(w.localStorage.getItem(key),value);
 d.querySelector('[data-section="chords"]').click();assert.ok(d.querySelector('#chord-listen'));d.querySelector('[data-section="bass"]').click();assert.equal(state(w).stats.completed,1);d.querySelector('[data-section="intervals"]').click();assert.ok(d.querySelector('#listen'));await w.happyDOM.close();
});
test('navigation cancels bass audio and cannot start late audio after departure',async()=>{
 const w=setup(),d=w.document;click(w,'full');d.querySelector('[data-section="chords"]').click();await flush();assert.equal(w.notes.length,0);assert.ok(d.querySelector('#chord-listen'));await w.happyDOM.close();
});

test('auditioning piano keys leaves answers, active slot, results and attempts unchanged until explicit insertion',async()=>{
 const w=setup(),d=w.document,before=w.localStorage.getItem(BASS_KEY);
 assert.ok(d.querySelector('#bass-insert').disabled);
 for(const note of [36,37,43,48]){d.querySelector('[data-bass-key="'+note+'"]').click();await flush();assert.equal(w.localStorage.getItem(BASS_KEY),before);assert.equal(d.querySelector('[data-bass-slot="0"]').getAttribute('aria-pressed'),'true');}
 assert.equal(w.notes.length,4);assert.equal(d.querySelector('[data-bass-key="48"]').getAttribute('aria-pressed'),'true');
 click(w,'insert');assert.deepEqual(state(w).current.answer,[48,null,null,null]);assert.equal(state(w).current.active,1);assert.equal(state(w).current.attempts,0);assert.ok(d.querySelector('#bass-insert').disabled);
 click(w,'full');await flush();await enter(w,bassChords(state(w).current.q).map(c=>c.bass));click(w,'check');const checked=w.localStorage.getItem(BASS_KEY);d.querySelector('[data-bass-key="38"]').click();await flush();assert.equal(w.localStorage.getItem(BASS_KEY),checked);assert.equal(d.querySelectorAll('.bass-slot.correct').length,4);await w.happyDOM.close();
});

test('stop button stays beside playback controls and stops every scheduled note without changing answers',async()=>{
 const w=setup({},true),d=w.document,before=w.localStorage.getItem(BASS_KEY);
 assert.ok(d.querySelector('#bass-stop').disabled);assert.equal(d.querySelector('#bass-stop').parentElement,d.querySelector('#bass-full').parentElement);
 click(w,'full');await flush();assert.equal(w.notes.length,16);assert.equal(d.querySelector('#bass-stop').disabled,false);
 const stops=w.stops;click(w,'stop');assert.equal(w.stops,stops+16);assert.ok(d.querySelector('#bass-stop').disabled);assert.equal(w.localStorage.getItem(BASS_KEY),before);
 w.audioTimers.forEach(fn=>fn());await flush();assert.ok(d.querySelector('#bass-stop').disabled);assert.equal(d.querySelectorAll('.bass-beats .active').length,0);await w.happyDOM.close();
});
