import {Window} from 'happy-dom';
import {readFile,readdir} from 'node:fs/promises';
import assert from 'node:assert/strict';
import test from 'node:test';
import {BASS_KEY,bassChords} from '../src/bass.js';
import {BASS_MODE_KEY} from '../src/bass-course.js';
import {PROGRESSION_KEY,initialProgression,newProgressionRound,submitProgressionBass} from '../src/progression.js';
import {PROGRESSION_GUIDED_KEY,PROGRESSION_MODE_KEY,newGuidedProgression} from '../src/progression-course.js';
import {initialState} from '../src/logic.js';
const asset=(await readdir('dist/assets')).find(f=>f.endsWith('.js')),source=await readFile('dist/assets/'+asset,'utf8');
const flush=async()=>{for(let i=0;i<60;i++)await Promise.resolve();};
function setup(saved={},controlled=false,guided=false){
 const w=new Window({url:'http://localhost:5173'});w.document.body.innerHTML='<div id="app"></div>';w.structuredClone=structuredClone;w.notes=[];w.stops=0;w.audioTimers=[];
 if(!guided){w.localStorage.setItem(BASS_MODE_KEY,'free');w.localStorage.setItem(PROGRESSION_MODE_KEY,'free');}
 for(const [key,value]of Object.entries(saved))w.localStorage.setItem(key,value);
 w.AudioContext=class{currentTime=0;destination={};resume(){return Promise.resolve();}decodeAudioData(){return Promise.resolve({});}createBufferSource(){const note={connect(){},start(t){this.t=t;},stop(){w.stops++;},playbackRate:{value:1}};w.notes.push(note);return note;}createGain(){return {connect(){},gain:{setValueAtTime(){},linearRampToValueAtTime(){},exponentialRampToValueAtTime(){}}};}};
 w.fetch=async()=>({ok:true,arrayBuffer:async()=>new ArrayBuffer(8)});w.setTimeout=fn=>{if(controlled)w.audioTimers.push(fn);else queueMicrotask(fn);return 1;};w.eval(source);w.document.querySelector('[data-section="progression"]').click();return w;
}
const stored=w=>JSON.parse(w.localStorage.getItem(PROGRESSION_KEY));
const click=(w,id)=>w.document.getElementById('progression-'+id).click();
const enter=async(w,notes)=>{for(let i=0;i<4;i++){w.document.querySelector(`[data-progression-slot="${i}"]`).click();w.document.querySelector(`[data-progression-key="${notes[i]}"]`).click();await flush();click(w,'insert');}};
const choose=(w,qualities)=>qualities.forEach((q,i)=>w.document.querySelector(`[data-progression-quality="${i}:${q}"]`).click());
test('new exercise completes both stages with retries, audition, original and built playback, restoration and independent saves',async()=>{
 const legacy=JSON.stringify({version:1,current:null,stats:{completed:3,first:1,assisted:2,last:null}}),saved={[BASS_KEY]:legacy,'ear-training-v1':JSON.stringify({...initialState(),stage:3})};
 let w=setup(saved),d=w.document;
 assert.ok(d.querySelector('#progression-full'));assert.equal(d.querySelectorAll('[data-progression-quality]').length,0);assert.equal(d.querySelectorAll('[data-progression-key]').length,24);assert.ok(d.querySelector('#progression-check-bass').disabled);
 const before=w.localStorage.getItem(PROGRESSION_KEY);d.querySelector('[data-progression-key="36"]').click();await flush();assert.equal(w.localStorage.getItem(PROGRESSION_KEY),before);
 click(w,'full');await flush();const full=w.notes.slice(-16);assert.equal(full.length,16);
 const q=stored(w).current.q,chords=bassChords(q),notes=chords.map(c=>c.bass),wrong=[...notes];wrong[0]=36+(wrong[0]-36+1)%12;
 await enter(w,wrong);click(w,'bass-answer');await flush();assert.equal(stored(w).current.attempts,0);click(w,'check-bass');assert.equal(stored(w).current.stage,'bass');assert.equal(d.querySelectorAll('.bass-slot.wrong').length,1);assert.equal(d.querySelectorAll('[data-progression-quality]').length,0);
 const reloadSaved={...saved,[PROGRESSION_KEY]:w.localStorage.getItem(PROGRESSION_KEY)};await w.happyDOM.close();w=setup(reloadSaved);d=w.document;assert.equal(stored(w).current.attempts,1);
 click(w,'bass');await flush();assert.equal(w.notes.length,4);await enter(w,notes.map(n=>n+12));click(w,'check-bass');assert.equal(stored(w).current.stage,'qualities');assert.deepEqual(stored(w).current.q,q);assert.equal(d.querySelectorAll('[data-progression-key]').length,0);assert.equal(d.querySelectorAll('[data-progression-quality]').length,8);assert.ok(d.querySelector('#progression-check-quality').disabled);
 for(let i=0;i<4;i++){const before=w.notes.length;click(w,'chord-'+i);await flush();assert.equal(w.notes.length-before,4);assert.ok(w.notes.slice(-4).every(n=>n.t===.03));}assert.equal(stored(w).current.qualityAttempts,0);
 const qualities=chords.map(c=>c.quality),wrongQualities=[...qualities];wrongQualities[0]=qualities[0]==='major'?'minor':'major';choose(w,wrongQualities);click(w,'answer');await flush();assert.equal(stored(w).current.qualityAttempts,0);click(w,'check-quality');assert.equal(d.querySelectorAll('.progression-chord.wrong').length,1);assert.equal(d.querySelectorAll('.progression-chord.correct').length,3);assert.equal(d.querySelector('.progression-success'),null);
 const restored={...saved,[PROGRESSION_KEY]:w.localStorage.getItem(PROGRESSION_KEY)};await w.happyDOM.close();w=setup(restored);d=w.document;assert.equal(stored(w).current.stage,'qualities');assert.equal(stored(w).current.qualityAttempts,1);assert.deepEqual(stored(w).current.q,q);
 choose(w,qualities);click(w,'answer');await flush();const onsets=w.notes.slice(-16).filter(n=>n.playbackRate.value===.5).map(n=>Number(n.t.toFixed(2)));assert.deepEqual(onsets,[.03,1.63,3.23,4.83]);click(w,'check-quality');assert.equal(stored(w).stats.completed,1);assert.equal(stored(w).stats.assisted,1);assert.equal(d.querySelectorAll('.progression-success li').length,4);click(w,'success-play');await flush();assert.equal(stored(w).stats.completed,1);click(w,'new');assert.equal(stored(w).current.stage,'bass');assert.deepEqual(stored(w).current.answer,[null,null,null,null]);assert.notDeepEqual(stored(w).current.q,q);
 assert.equal(w.localStorage.getItem(BASS_KEY),legacy);assert.equal(w.localStorage.getItem('ear-training-v1'),saved['ear-training-v1']);d.querySelector('[data-section="bass"]').click();assert.ok(d.querySelector('#bass-full'));d.querySelector('[data-section="progression"]').click();assert.equal(stored(w).stats.completed,1);await w.happyDOM.close();
});
test('leaving or stopping the exercise cancels pending audio without changing its answers',async()=>{
 const w=setup({},true),d=w.document;click(w,'full');await flush();assert.equal(w.notes.length,16);const before=stored(w),stops=w.stops;click(w,'stop');assert.equal(w.stops,stops+16);w.audioTimers.forEach(fn=>fn());await flush();assert.deepEqual(stored(w),before);assert.ok(d.querySelector('#progression-stop').disabled);
 click(w,'full');d.querySelector('[data-section="intervals"]').click();await flush();assert.ok(d.querySelector('#listen'));await w.happyDOM.close();
});

test('saved D-major progression shows F sharp minor consistently after bass and in completed solution',async()=>{
 let s=initialProgression();s.current=newProgressionRound({patternIndex:4,key:2});s.current.answer=bassChords(s.current.q).map(c=>c.bass);s=submitProgressionBass(s);
 const w=setup({[PROGRESSION_KEY]:JSON.stringify(s)}),d=w.document;
 assert.match(d.querySelectorAll('.progression-chord h3')[1].textContent,/פה דיאז/);assert.equal(d.querySelectorAll('.progression-chord h3 [lang="en"]')[1].textContent,'F♯');
 choose(w,['major','minor','minor','major']);click(w,'check-quality');const result=d.querySelector('.progression-success').textContent;assert.match(result,/F♯m/);assert.match(result,/פה דיאז מינור/);assert.ok(!result.includes('G♭'));assert.ok(!result.includes('/'));await w.happyDOM.close();
});

const course=w=>JSON.parse(w.localStorage.getItem(PROGRESSION_GUIDED_KEY));
test('guided progression counts ten complete two-stage rounds, persists through reload, and keeps free practice separate',async()=>{
 const legacy=initialProgression();legacy.stats={completed:2,bassFirst:1,qualityFirst:1,assisted:1};const legacySaved=JSON.stringify(legacy);
 let w=setup({[PROGRESSION_KEY]:legacySaved},false,true),d=w.document;
 assert.equal(d.querySelector('#progression-guided').className,'selected');assert.equal(d.querySelector('[role="progressbar"]').getAttribute('aria-valuenow'),'0');
 for(let i=0;i<10;i++){
 assert.equal(course(w).index,i);assert.equal(course(w).completed,i);click(w,'bass');await flush();const chords=bassChords(course(w).practice.current.q),notes=chords.map(c=>c.bass);
 if(i===0){const wrong=[...notes];wrong[0]=36+(wrong[0]-36+1)%12;await enter(w,wrong);click(w,'check-bass');assert.equal(course(w).completed,0);}
 await enter(w,notes);click(w,'check-bass');assert.equal(course(w).completed,i);assert.equal(d.querySelectorAll('[data-progression-quality]').length,8);
 assert.equal(d.querySelector('[data-progression-quality="0:major"] .interval-english').textContent,'Major');assert.equal(d.querySelector('[data-progression-quality="0:minor"] .interval-english').textContent,'Minor');
 const qualities=chords.map(c=>c.quality);
 if(i===0){const wrong=[...qualities];wrong[0]=wrong[0]==='major'?'minor':'major';choose(w,wrong);click(w,'check-quality');assert.equal(course(w).completed,0);assert.equal(d.querySelector('#progression-new'),null);}
 choose(w,qualities);click(w,'check-quality');assert.equal(course(w).completed,i+1);assert.equal(course(w).practice.stats.completed,i+1);assert.equal(d.querySelector('[role="progressbar"]').getAttribute('aria-valuenow'),String(i+1));click(w,'success-play');await flush();assert.equal(course(w).completed,i+1);
 if(i===4){
 const saved={[PROGRESSION_KEY]:w.localStorage.getItem(PROGRESSION_KEY),[PROGRESSION_GUIDED_KEY]:w.localStorage.getItem(PROGRESSION_GUIDED_KEY),[PROGRESSION_MODE_KEY]:'guided'};await w.happyDOM.close();w=setup(saved,false,true);d=w.document;assert.equal(course(w).completed,5);assert.ok(d.querySelector('.progression-success'));
 click(w,'free');assert.equal(d.querySelector('[role="progressbar"]'),null);assert.equal(stored(w).stats.completed,2);const guidedSaved=w.localStorage.getItem(PROGRESSION_GUIDED_KEY);click(w,'full');await flush();const chord=bassChords(stored(w).current.q);await enter(w,chord.map(c=>c.bass));click(w,'check-bass');choose(w,chord.map(c=>c.quality));click(w,'check-quality');assert.equal(stored(w).stats.completed,3);assert.equal(w.localStorage.getItem(PROGRESSION_GUIDED_KEY),guidedSaved);click(w,'guided');assert.equal(course(w).completed,5);
 }
 if(i<9){if(i===4)click(w,'new');else{assert.ok(d.querySelector('#progression-success-dialog').open);click(w,'popup-next');}}
 }
 assert.ok(d.querySelector('.bass-course-success'));assert.equal(d.querySelector('#progression-new'),null);assert.equal(course(w).practice.stats.bassFirst,9);assert.equal(course(w).practice.stats.qualityFirst,9);assert.equal(course(w).practice.stats.assisted,10);assert.equal(stored(w).stats.completed,3);
 assert.match(d.querySelector('#progression-popup-title').textContent,/השלמתם/);click(w,'popup-next');assert.equal(d.querySelector('#progression-free').className,'selected');click(w,'guided');assert.ok(d.querySelector('.bass-course-success'));await w.happyDOM.close();
});

test('success popup offers next immediately, can be dismissed for listening, and never opens after a wrong answer',async()=>{
 let s=initialProgression();s.current=newProgressionRound({patternIndex:0,key:0});s.current.answer=bassChords(s.current.q).map(c=>c.bass);s=submitProgressionBass(s);
 const w=setup({[PROGRESSION_KEY]:JSON.stringify(s)}),d=w.document;
 choose(w,['minor','major','minor','major']);click(w,'check-quality');assert.equal(d.querySelector('#progression-success-dialog'),null);
 choose(w,['major','major','minor','major']);click(w,'check-quality');assert.ok(d.querySelector('#progression-success-dialog').open);assert.equal(d.activeElement.id,'progression-popup-next');assert.match(d.querySelector('#progression-popup-next').textContent,/מהלך חדש/);
 click(w,'popup-stay');assert.equal(d.querySelector('#progression-success-dialog'),null);assert.equal(stored(w).stats.completed,1);click(w,'answer');await flush();assert.equal(d.querySelector('#progression-success-dialog'),null);
 click(w,'new');click(w,'full');await flush();const chords=bassChords(stored(w).current.q);await enter(w,chords.map(c=>c.bass));click(w,'check-bass');choose(w,chords.map(c=>c.quality));click(w,'check-quality');assert.ok(d.querySelector('#progression-success-dialog').open);click(w,'popup-next');assert.equal(stored(w).current.stage,'bass');assert.equal(stored(w).stats.completed,2);assert.equal(d.querySelector('#progression-success-dialog'),null);await w.happyDOM.close();
});
