import {Window} from 'happy-dom';
import {readFile,readdir} from 'node:fs/promises';
import assert from 'node:assert/strict';
import test from 'node:test';
import {BASS_KEY,bassChords} from '../src/bass.js';
import {BASS_MODE_KEY} from '../src/bass-course.js';
import {SONG_KEY,SONGS,songEntry} from '../src/songs.js';
import {PROGRESSION_GUIDED_KEY,PROGRESSION_MODE_KEY,newGuidedProgression} from '../src/progression-course.js';
import {initialState} from '../src/logic.js';
const asset=(await readdir('dist/assets')).find(f=>f.endsWith('.js')),source=await readFile('dist/assets/'+asset,'utf8');
const flush=async()=>{for(let i=0;i<60;i++)await Promise.resolve();};
function setup(saved={},controlled=false,guided=false){
 const w=new Window({url:'http://localhost:5173'});w.document.body.innerHTML='<div id="app"></div>';w.structuredClone=structuredClone;w.notes=[];w.stops=0;w.audioTimers=[];
 if(!guided){w.localStorage.setItem(BASS_MODE_KEY,'free');w.localStorage.setItem(PROGRESSION_MODE_KEY,'free');}
 for(const [key,value]of Object.entries(saved))w.localStorage.setItem(key,value);
 w.AudioContext=class{currentTime=0;destination={};resume(){return Promise.resolve();}decodeAudioData(){return Promise.resolve({});}createBufferSource(){const note={connect(){},start(t){this.t=t;},stop(){w.stops++;},playbackRate:{value:1}};w.notes.push(note);return note;}createGain(){return {connect(){},gain:{setValueAtTime(){},linearRampToValueAtTime(){},exponentialRampToValueAtTime(){}}};}};
 const create=w.document.createElement.bind(w.document);
 class Media extends w.EventTarget{paused=true;currentTime=0;duration=60;playbackRate=1;play(){this.paused=false;this.dispatchEvent(new w.Event('play'));return Promise.resolve();}pause(){this.paused=true;this.dispatchEvent(new w.Event('pause'));}load(){this.dispatchEvent(new w.Event('loadedmetadata'));}}
 w.document.createElement=(tag,...args)=>tag==='audio'?(w.songMedia=new Media()):create(tag,...args);
 w.requestAnimationFrame=fn=>{w.mediaFrame=fn;return 1;};w.cancelAnimationFrame=()=>{w.mediaFrame=null;};
 w.fetch=async()=>({ok:true,arrayBuffer:async()=>new ArrayBuffer(8)});w.setTimeout=fn=>{if(controlled)w.audioTimers.push(fn);else queueMicrotask(fn);return 1;};w.eval(source);w.document.querySelector('[data-section="songs"]').click();return w;
}
const state=w=>JSON.parse(w.localStorage.getItem(SONG_KEY));
const click=(w,id)=>w.document.getElementById('songs-'+id).click();
const round=w=>songEntry(state(w),'first-light',state(w).selected.partId).round;
const enter=async(w,notes)=>{for(let i=0;i<notes.length;i++){w.document.querySelector(`[data-song-slot="${i}"]`).click();w.document.querySelector(`[data-song-key="${notes[i]}"]`).click();await flush();click(w,'insert');}};
const choose=(w,qualities)=>qualities.forEach((q,i)=>w.document.querySelector(`[data-song-quality="${i}:${q}"]`).click());
test('song library, real-media controls and both answer stages work with independent per-part progress and saved completion',async()=>{
 const existing={'ear-training-v1':JSON.stringify({...initialState(),stage:2}),'ear-training-bass-v1':'saved-bass','ear-training-chord-progression-v1':'saved-progression'};
 let w=setup(existing),d=w.document;assert.equal(d.querySelectorAll('[data-song-open]').length,1);assert.match(d.querySelector('.song-card').textContent,/צעד ראשון/);d.querySelector('[data-song-open]').click();assert.equal(d.querySelectorAll('[data-song-part]').length,2);assert.equal(w.songMedia.currentTime,0);assert.equal(d.querySelector('[id*="bass-only"]'),null);
 d.querySelector('#song-play').click();await flush();assert.equal(w.songMedia.paused,false);d.querySelector('#song-rate').value='0.5';d.querySelector('#song-rate').dispatchEvent(new w.Event('change'));assert.equal(w.songMedia.preservesPitch,true);assert.equal(w.songMedia.playbackRate,.5);
 const before=w.localStorage.getItem(SONG_KEY);d.querySelector('[data-song-key="36"]').click();await flush();assert.equal(w.songMedia.paused,true);assert.equal(w.localStorage.getItem(SONG_KEY),before);
 await enter(w,[38,43,45,41]);click(w,'bass-answer');await flush();assert.equal(round(w).bassAttempts,0);click(w,'check');assert.equal(round(w).stage,'bass');assert.equal(d.querySelectorAll('.bass-slot.wrong').length,1);assert.equal(d.querySelectorAll('[data-song-quality]').length,0);
 d.querySelector('[data-song-part="chorus"]').click();assert.equal(w.songMedia.currentTime,30);assert.deepEqual(round(w).answer,[null,null,null,null]);d.querySelector('[data-song-part="verse"]').click();assert.equal(w.songMedia.currentTime,0);assert.equal(round(w).bassAttempts,1);assert.deepEqual(round(w).answer,[38,43,45,41]);
 const saved={...existing,[SONG_KEY]:w.localStorage.getItem(SONG_KEY)};await w.happyDOM.close();w=setup(saved);d=w.document;d.querySelector('[data-song-open]').click();assert.equal(round(w).bassAttempts,1);await enter(w,[48,55,57,53]);click(w,'check');assert.equal(round(w).stage,'qualities');assert.equal(d.querySelectorAll('[data-song-quality]').length,8);
 choose(w,['minor','major','minor','major']);click(w,'answer');await flush();assert.equal(round(w).qualityAttempts,0);click(w,'check');assert.equal(d.querySelectorAll('.progression-chord.wrong').length,1);assert.equal(d.querySelectorAll('.progression-chord.correct').length,3);
 choose(w,['major','major','minor','major']);click(w,'check');assert.ok(d.querySelector('#songs-success-dialog').open);assert.equal(songEntry(state(w),'first-light','verse').completed,true);assert.equal(songEntry(state(w),'first-light','chorus').completed,false);click(w,'popup-stay');assert.equal(d.querySelectorAll('.song-success li').length,4);click(w,'review');await flush();assert.equal(round(w).completed,true);
 const done={...existing,[SONG_KEY]:w.localStorage.getItem(SONG_KEY)};await w.happyDOM.close();w=setup(done);d=w.document;assert.match(d.querySelector('.song-card').textContent,/1 הושלמו/);d.querySelector('[data-song-open]').click();assert.ok(d.querySelector('.song-success'));click(w,'retry');assert.equal(round(w).stage,'bass');assert.equal(songEntry(state(w),'first-light','verse').completed,true);
 d.querySelector('#song-play').click();await flush();d.querySelector('[data-section="bass"]').click();assert.equal(w.songMedia.paused,true);assert.ok(d.querySelector('#bass-full'));for(const [key,value]of Object.entries(existing))if(key!=='ear-training-bass-v1')assert.equal(w.localStorage.getItem(key),value);await w.happyDOM.close();
});
