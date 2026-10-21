import {Window} from 'happy-dom';
import {readFile,readdir} from 'node:fs/promises';
import assert from 'node:assert/strict';
import test from 'node:test';
import {PLAYBACK_DURATION_MS} from '../src/audio.js';
const asset=(await readdir('dist/assets')).find(f=>f.endsWith('.js'));
const source=await readFile('dist/assets/'+asset,'utf8');
function setup(saved,controlled=false,sessionSaved){
 const w=new Window({url:'http://localhost:5173'});w.document.body.innerHTML='<div id="app"></div>';
 if(sessionSaved)w.localStorage.setItem('ear-training-session-v1',sessionSaved);
 if(saved)w.localStorage.setItem('ear-training-v1',saved);
 w.structuredClone=structuredClone;w.playedNotes=0;w.audioSources=[];w.audioTimers=[];
 w.AudioContext=class{currentTime=0;destination={};resume(){return Promise.resolve();}decodeAudioData(){return Promise.resolve({});}createBufferSource(){const source={connect(){},start(t){w.playedNotes++;this.startTime=t;},stop(){}};w.audioSources.push(source);return source;}createGain(){return {connect(){},gain:{setValueAtTime(){},linearRampToValueAtTime(){},exponentialRampToValueAtTime(){}}};}};
 w.fetch=async()=>({ok:true,arrayBuffer:async()=>new ArrayBuffer(8)});
 w.setTimeout=(fn,ms)=>{if(controlled)w.audioTimers.push({fn,ms});else queueMicrotask(fn);return 1;};
 w.eval(source);return w;
}
const flush=async()=>{for(let i=0;i<50;i++)await Promise.resolve();};
const stored=w=>JSON.parse(w.localStorage.getItem('ear-training-v1'));
test('complete exercise, unlimited replays, one first-attempt result per question',async()=>{
 const w=setup();let d=w.document;
 assert.equal(d.documentElement.lang,'');assert.equal(d.querySelectorAll('[data-answer]').length,2);
 assert.ok([...d.querySelectorAll('[data-answer]')].every(b=>b.disabled));
 d.querySelector('#listen').click();await flush();assert.ok(!d.querySelector('[data-answer]').disabled,d.body.textContent);
 d.querySelector('#listen').click();await flush();assert.equal(stored(w),null);
 d.querySelector('[data-answer]').click();let wrong=!!d.querySelector('.wrong');
 if(wrong){assert.equal(d.querySelector('.correct'),null);assert.equal(d.querySelector('#next'),null);d.querySelectorAll('[data-answer]')[1].click();}
 assert.ok(d.querySelector('.correct'));assert.ok(d.querySelector('#next'));
 assert.equal(d.querySelector('#next').parentElement,d.querySelector('#listen').parentElement);
 assert.ok(d.querySelector('.practice-actions').compareDocumentPosition(d.querySelector('.answers')) & 4);
 assert.equal(stored(w).stats.guided.total,1);assert.equal(stored(w).stats.guided.correct,wrong?0:1);
 const beforeNext=w.playedNotes;d.querySelector('#next').click();await flush();assert.equal(w.playedNotes,beforeNext+2);assert.ok(!d.querySelector('[data-answer]').disabled);assert.equal(d.querySelector('#next'),null);assert.equal(d.querySelector('.correct'),null);
 await w.happyDOM.close();
});
test('free selection, minimum one interval, settings and persisted reload',async()=>{
 const w=setup(),d=w.document;d.querySelector('#free').click();
 assert.equal(d.querySelectorAll('input:checked').length,2);
 d.querySelector('input:checked').click();assert.equal(d.querySelectorAll('input:checked').length,1);
 d.querySelector('input:checked').click();assert.equal(d.querySelectorAll('input:checked').length,1);
 d.querySelector('#settings').click();d.querySelector('[data-range="high"]').click();d.querySelector('#close-settings').click();
 assert.ok(d.querySelector('aside #piano-range'));assert.equal(d.querySelector('.practice #piano-range'),null);
 d.querySelector('#piano-range').value='low';d.querySelector('#piano-range').dispatchEvent(new w.Event('change'));assert.equal(stored(w).range,'low');
 d.querySelector('#piano-range').value='high';d.querySelector('#piano-range').dispatchEvent(new w.Event('change'));
 const saved=w.localStorage.getItem('ear-training-v1');assert.equal(stored(w).range,'high');assert.equal(stored(w).stats.guided.total,0);
 const reloaded=setup(saved);assert.equal(reloaded.document.querySelector('#free').className,'selected');assert.equal(reloaded.document.querySelectorAll('input:checked').length,1);
 await w.happyDOM.close();await reloaded.happyDOM.close();
});

test('compact guided progress retains counts below the exercise without explanatory clutter',async()=>{
 const {initialState}=await import('../src/logic.js');
 const state=initialState();state.history=Array.from({length:10},(_,i)=>({interval:i%2?5:7,correct:i<8}));
 const w=setup(JSON.stringify(state)),d=w.document;
 const bar=d.querySelector('[role="progressbar"]');assert.equal(bar.getAttribute('aria-valuenow'),'8');assert.equal(bar.getAttribute('aria-valuemax'),'16');
 assert.ok(d.querySelector('.unlock-progress').textContent.includes('טרצה גדולה'));
 assert.equal(d.querySelector('.progress-status'),null);
 assert.equal(d.querySelector('.unlock-progress .fine'),null);
 assert.ok(d.querySelector('.answers').compareDocumentPosition(bar)&4);
 d.querySelector('#free').click();assert.equal(d.querySelector('[role="progressbar"]'),null);
 await w.happyDOM.close();
});

test('playback feedback follows scheduled start and final note end, and replay remains available',async()=>{
 const w=setup(undefined,true),d=w.document;
 d.querySelector('#listen').click();
 assert.equal(d.querySelector('.is-playing'),null);
 await flush();
 assert.equal(d.querySelector('.is-playing'),null);
 w.audioTimers.find(t=>t.ms===30).fn();
 assert.ok(d.querySelector('.practice.is-playing'));
 w.audioSources.at(-1).onended();
 assert.equal(d.querySelector('.is-playing'),null);
 w.audioTimers.find(t=>t.ms===PLAYBACK_DURATION_MS).fn();await flush();
 assert.ok(!d.querySelector('[data-answer]').disabled);
 d.querySelector('#listen').click();await flush();assert.equal(w.playedNotes,4);
 w.audioTimers.filter(t=>t.ms===PLAYBACK_DURATION_MS).at(-1).fn();await flush();
 await w.happyDOM.close();
});
test('free answer buttons retain ascending semitone order between questions',async()=>{
 const {initialState}=await import('../src/logic.js');const s=initialState();s.mode='free';s.selected=[12,7,1,5,3,2,4,6,8,9,10,11];
 const w=setup(JSON.stringify(s)),d=w.document;
 const ids=()=>[...d.querySelectorAll('[data-answer]')].map(b=>Number(b.dataset.answer));
 assert.deepEqual(ids(),Array.from({length:12},(_,i)=>i+1));
 d.querySelector('#listen').click();await flush();
 for(const id of ids()){const b=d.querySelector(`[data-answer="${id}"]`);if(b.disabled)break;b.click();}
 d.querySelector('#next').click();await flush();
 assert.deepEqual(ids(),Array.from({length:12},(_,i)=>i+1));
 assert.equal(JSON.parse(w.localStorage.getItem('ear-training-v1')).stats.guided.total,0);
 await w.happyDOM.close();
});

test('session summary counts solved questions once, excludes retries and restores unfinished attempts after refresh',async()=>{
 const w=setup(),d=w.document;
 const session=win=>JSON.parse(win.localStorage.getItem('ear-training-session-v1'));
 d.querySelector('#listen').click();await flush();d.querySelector('#listen').click();await flush();
 const correctId=session(w).current.q.interval,wrongId=correctId===5?7:5;
 d.querySelector(`[data-answer="${wrongId}"]`).click();
 assert.equal(session(w).total,0);
 const reloaded=setup(w.localStorage.getItem('ear-training-v1'),false,w.localStorage.getItem('ear-training-session-v1'));
 const r=reloaded.document;
 assert.equal(session(reloaded).current.q.attempts,1);
 r.querySelector('#listen').click();await flush();r.querySelector(`[data-answer="${correctId}"]`).click();
 assert.equal(session(reloaded).total,1);assert.equal(session(reloaded).correct,0);
 r.querySelector(`[data-answer="${correctId}"]`).click();assert.equal(session(reloaded).total,1);
 r.querySelector('#next').click();await flush();
 r.querySelector(`[data-answer="${session(reloaded).current.q.interval}"]`).click();
 assert.equal(session(reloaded).total,2);assert.equal(session(reloaded).correct,1);assert.equal(session(reloaded).best,1);
 r.querySelector('#next').click();await flush();
 const pending=session(reloaded).current.q.interval;
 r.querySelector(`[data-answer="${pending===5?7:5}"]`).click();
 const progress=reloaded.localStorage.getItem('ear-training-v1');
 r.querySelector('#end-session').click();assert.equal(session(reloaded).total,2);
 assert.ok(r.querySelector('.summary-stats').textContent.includes('50%'));
 assert.equal(r.querySelectorAll('tbody tr').length,2);
 const summaryReload=setup(progress,false,reloaded.localStorage.getItem('ear-training-session-v1'));
 assert.ok(summaryReload.document.querySelector('.summary'));assert.equal(summaryReload.document.querySelector('#listen'),null);
 summaryReload.document.querySelector('#new-session').click();
 assert.equal(session(summaryReload).total,0);assert.equal(session(summaryReload).ended,false);
 assert.equal(summaryReload.localStorage.getItem('ear-training-v1'),progress);
 assert.ok(summaryReload.document.querySelector('#listen'));
 for(const win of [w,reloaded,summaryReload])await win.happyDOM.close();
});
test('empty summary avoids misleading percentages and new unlocks survive into summary',async()=>{
 const w=setup();w.document.querySelector('#end-session').click();assert.ok(w.document.querySelector('.empty-summary'));assert.equal(w.document.querySelector('.summary-stats'),null);await w.happyDOM.close();
 const {initialState}=await import('../src/logic.js');const s=initialState();s.history=Array.from({length:19},(_,i)=>({interval:i%2?5:7,correct:true}));s.range='high';
 const unlocked=setup(JSON.stringify(s)),d=unlocked.document;
 d.querySelector('#listen').click();await flush();
 const q=JSON.parse(unlocked.localStorage.getItem('ear-training-session-v1')).current.q;
 d.querySelector(`[data-answer="${q.interval}"]`).click();assert.ok(d.querySelector('#continue'));
 d.querySelector('#continue').click();d.querySelector('#end-session').click();
 assert.ok(d.querySelector('.summary-unlocks').textContent.includes('טרצה גדולה'));
 d.querySelector('#new-session').click();
 const after=stored(unlocked);assert.equal(after.stage,1);assert.equal(after.range,'high');assert.deepEqual(after.selected,[5,7]);
 assert.deepEqual(JSON.parse(unlocked.localStorage.getItem('ear-training-session-v1')).unlocked,[]);
 await unlocked.happyDOM.close();
});

test('guided and free sessions show identical completed-question summaries and bottom finish control',async()=>{
 const {initialState}=await import('../src/logic.js');
 for(const mode of ['guided','free']){
 const state=initialState();state.mode=mode;
 const w=setup(JSON.stringify(state)),d=w.document;
 const button=d.querySelector('#end-session'),answers=d.querySelector('.answers');
 assert.ok(button.closest('.practice-end'));
 assert.ok(answers.compareDocumentPosition(button)&4);
 assert.equal(d.querySelector('.card-top #end-session'),null);
 for(let i=0;i<4;i++){
 if(i===0)d.querySelector('#listen').click();else d.querySelector('#next').click();
 await flush();
 const id=JSON.parse(w.localStorage.getItem('ear-training-session-v1')).current.q.interval;
 if(i===1){d.querySelector(`[data-answer="${id===5?7:5}"]`).click();d.querySelector('#listen').click();await flush();}
 d.querySelector(`[data-answer="${id}"]`).click();
 }
 const before=stored(w);d.querySelector('#end-session').click();
 const session=JSON.parse(w.localStorage.getItem('ear-training-session-v1'));
 assert.equal(session.total,4);assert.equal(session.correct,3);assert.equal(session.best,2);
 assert.ok(d.querySelector('.summary-stats').textContent.includes('75%'));
 assert.equal(d.querySelectorAll('tbody tr').length,Object.keys(session.intervals).length);
 assert.equal(d.querySelector('.empty-summary'),null);
 assert.deepEqual(stored(w),before);
 await w.happyDOM.close();
 }
});
test('recovers a completed guided question from an empty older session without touching progression',async()=>{
 const {initialState}=await import('../src/logic.js');const {newSession}=await import('../src/session.js');
 const state=initialState();state.stage=2;state.range='middle';
 const session=newSession();session.ended=true;session.current={mode:'guided',range:'middle',wrong:[],q:{interval:5,start:60,end:65,attempts:2,solved:true}};
 const saved=JSON.stringify(state),w=setup(saved,false,JSON.stringify(session));
 assert.equal(w.localStorage.getItem('ear-training-v1'),saved);
 const recovered=JSON.parse(w.localStorage.getItem('ear-training-session-v1'));
 assert.equal(recovered.total,1);assert.equal(recovered.correct,0);
 assert.ok(w.document.querySelector('tbody').textContent.includes('0 מתוך 1'));
 const again=setup(saved,false,JSON.stringify(recovered));
 assert.equal(JSON.parse(again.localStorage.getItem('ear-training-session-v1')).total,1);
 await w.happyDOM.close();await again.happyDOM.close();
});

test('answers unlock at the second note while the release continues',async()=>{
 const w=setup(undefined,true),d=w.document;
 d.querySelector('#listen').click();await flush();
 assert.ok(d.querySelector('[data-answer]').disabled);
 w.audioTimers.find(t=>t.ms===30).fn();
 assert.ok(d.querySelector('[data-answer]').disabled);
 w.audioTimers.find(t=>t.ms===880).fn();
 assert.ok(!d.querySelector('[data-answer]').disabled);
 assert.ok(d.querySelector('.is-playing'));
 const id=JSON.parse(w.localStorage.getItem('ear-training-session-v1')).current.q.interval;
 d.querySelector(`[data-answer="${id}"]`).click();
 assert.ok(d.querySelector('.correct'));assert.ok(d.querySelector('.is-playing'));
 assert.equal(JSON.parse(w.localStorage.getItem('ear-training-session-v1')).total,1);
 w.audioSources.at(-1).onended();w.audioTimers.find(t=>t.ms===PLAYBACK_DURATION_MS).fn();await flush();
 assert.ok(d.querySelector('#next'));await w.happyDOM.close();
});

test('live session counter shows completed first-attempt successes and resets for new practice',async()=>{
 const w=setup(),d=w.document;
 assert.ok(d.querySelector('.session-counter').textContent.includes('0 מתוך 0 נכונים'));
 d.querySelector('#listen').click();await flush();
 const id=JSON.parse(w.localStorage.getItem('ear-training-session-v1')).current.q.interval;
 d.querySelector(`[data-answer="${id===5?7:5}"]`).click();
 assert.ok(d.querySelector('.session-counter').textContent.includes('0 מתוך 0 נכונים'));
 d.querySelector(`[data-answer="${id}"]`).click();
 assert.ok(d.querySelector('.session-counter').textContent.includes('0 מתוך 1 נכונים'));
 d.querySelector('#next').click();await flush();
 const nextId=JSON.parse(w.localStorage.getItem('ear-training-session-v1')).current.q.interval;
 d.querySelector(`[data-answer="${nextId}"]`).click();
 assert.ok(d.querySelector('.session-counter').textContent.includes('1 מתוך 2 נכונים'));
 assert.equal(d.querySelector('.counter-streak'),null);
 d.querySelector('#end-session').click();d.querySelector('#new-session').click();
 assert.ok(d.querySelector('.session-counter').textContent.includes('0 מתוך 0 נכונים'));
 await w.happyDOM.close();
});

test('four playback modes work in guided and free practice and survive reload without clearing progress',async()=>{
 const {initialState}=await import('../src/logic.js');
 const saved=initialState();saved.stage=2;saved.stats.guided.total=24;
 const w=setup(JSON.stringify(saved)),d=w.document;
 assert.equal(d.querySelectorAll('#playback-type option').length,4);
 for(const mode of ['guided','free']){
 d.querySelector(`#${mode}`).click();
 for(const type of ['ascending','descending','upDown','harmonic']){
 d.querySelector('#playback-type').value=type;d.querySelector('#playback-type').dispatchEvent(new w.Event('change'));
 const before=w.playedNotes;d.querySelector('#listen').click();await flush();
 const count=type==='upDown'?4:2;assert.equal(w.playedNotes-before,count);
 if(type==='harmonic')assert.equal(w.audioSources.at(-1).startTime,w.audioSources.at(-2).startTime);
 assert.ok(!d.querySelector('[data-answer]').disabled);
 }
 }
 const data=stored(w);assert.equal(data.playbackType,'harmonic');assert.equal(data.stage,2);assert.equal(data.stats.guided.total,24);
 const reloaded=setup(w.localStorage.getItem('ear-training-v1'),false,w.localStorage.getItem('ear-training-session-v1'));
 assert.equal(reloaded.document.querySelector('#playback-type').value,'harmonic');
 await w.happyDOM.close();await reloaded.happyDOM.close();
});
