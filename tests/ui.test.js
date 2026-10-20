import {Window} from 'happy-dom';
import {readFile,readdir} from 'node:fs/promises';
import assert from 'node:assert/strict';
import test from 'node:test';
const asset=(await readdir('dist/assets')).find(f=>f.endsWith('.js'));
const source=await readFile('dist/assets/'+asset,'utf8');
function setup(saved){
 const w=new Window({url:'http://localhost:5173'});w.document.body.innerHTML='<div id="app"></div>';
 if(saved)w.localStorage.setItem('ear-training-v1',saved);
 w.structuredClone=structuredClone;
 w.AudioContext=class{currentTime=0;destination={};resume(){return Promise.resolve();}decodeAudioData(){return Promise.resolve({});}createBufferSource(){return {connect(){},start(){},stop(){}};}createGain(){return {connect(){},gain:{setValueAtTime(){},linearRampToValueAtTime(){}}};}};
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
 d.querySelector('#next').click();assert.equal(d.querySelector('#next'),null);assert.equal(d.querySelector('.correct'),null);
 await w.happyDOM.close();
});
test('free selection, minimum one interval, settings and persisted reload',async()=>{
 const w=setup(),d=w.document;d.querySelector('#free').click();
 assert.equal(d.querySelectorAll('input:checked').length,2);
 d.querySelector('input:checked').click();assert.equal(d.querySelectorAll('input:checked').length,1);
 d.querySelector('input:checked').click();assert.equal(d.querySelectorAll('input:checked').length,1);
 d.querySelector('#settings').click();d.querySelector('[data-range="high"]').click();d.querySelector('#close-settings').click();
 const saved=w.localStorage.getItem('ear-training-v1');assert.equal(stored(w).range,'high');assert.equal(stored(w).stats.guided.total,0);
 const reloaded=setup(saved);assert.equal(reloaded.document.querySelector('#free').className,'selected');assert.equal(reloaded.document.querySelectorAll('input:checked').length,1);
 await w.happyDOM.close();await reloaded.happyDOM.close();
});
