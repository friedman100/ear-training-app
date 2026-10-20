import {Window} from 'happy-dom';
import {readFile,readdir} from 'node:fs/promises';
import assert from 'node:assert/strict';
import test from 'node:test';
const asset=(await readdir('dist/assets')).find(f=>f.endsWith('.js'));
const source=await readFile('dist/assets/'+asset,'utf8');
function setup(saved){
 const w=new Window({url:'http://localhost:5173'});w.document.body.innerHTML='<div id="app"></div>';
 if(saved)w.localStorage.setItem('ear-training-v1',saved);
 w.structuredClone=structuredClone;w.playedNotes=0;
 w.AudioContext=class{currentTime=0;destination={};resume(){return Promise.resolve();}decodeAudioData(){return Promise.resolve({});}createBufferSource(){return {connect(){},start(){w.playedNotes++;},stop(){}};}createGain(){return {connect(){},gain:{setValueAtTime(){},linearRampToValueAtTime(){}}};}};
 w.fetch=async()=>({ok:true,arrayBuffer:async()=>new ArrayBuffer(8)});
 w.setTimeout=fn=>{queueMicrotask(fn);return 1;};
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
