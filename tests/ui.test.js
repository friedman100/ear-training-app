import {Window} from 'happy-dom';
import {readFile,readdir} from 'node:fs/promises';
import assert from 'node:assert/strict';
import test from 'node:test';
const asset=(await readdir('dist/assets')).find(f=>f.endsWith('.js'));
const source=await readFile('dist/assets/'+asset,'utf8');
function setup(saved,controlled=false,sessionSaved){
 const w=new Window({url:'http://localhost:5173'});w.document.body.innerHTML='<div id="app"></div>';
 if(sessionSaved)w.localStorage.setItem('ear-training-session-v1',sessionSaved);
 if(saved)w.localStorage.setItem('ear-training-v1',saved);
 w.structuredClone=structuredClone;w.playedNotes=0;w.audioSources=[];w.audioTimers=[];
 w.AudioContext=class{currentTime=0;destination={};resume(){return Promise.resolve();}decodeAudioData(){return Promise.resolve({});}createBufferSource(){const source={connect(){},start(){w.playedNotes++;},stop(){}};w.audioSources.push(source);return source;}createGain(){return {connect(){},gain:{setValueAtTime(){},linearRampToValueAtTime(){}}};}};
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

test('guided progress shows first-attempt successes, target and remaining window requirements',async()=>{
 const {initialState}=await import('../src/logic.js');
 const state=initialState();state.history=Array.from({length:10},(_,i)=>({interval:i%2?5:7,correct:i<8}));
 const w=setup(JSON.stringify(state)),d=w.document;
 const bar=d.querySelector('[role="progressbar"]');assert.equal(bar.getAttribute('aria-valuenow'),'8');assert.equal(bar.getAttribute('aria-valuemax'),'16');
 assert.ok(d.querySelector('.unlock-progress').textContent.includes('טרצה גדולה'));
 assert.ok(d.querySelector('.progress-status').textContent.includes('עוד 8'));
 assert.ok(d.querySelector('.progress-status').textContent.includes('נותרו 10'));
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
 w.audioTimers.find(t=>t.ms===1300).fn();await flush();
 assert.ok(!d.querySelector('[data-answer]').disabled);
 d.querySelector('#listen').click();await flush();assert.equal(w.playedNotes,4);
 w.audioTimers.filter(t=>t.ms===1300).at(-1).fn();await flush();
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
