import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {Window} from 'happy-dom';
const html=await readFile('demo/piano-comparison.html','utf8');
const scripts=[...html.matchAll(/<script\b[^>]*>([\s\S]*?)<\/script>/g)].map(m=>m[1]);
test('standalone comparison plays matching notes in both pianos, supports replay and leaves progress untouched',async()=>{
 assert.equal(scripts.length,2);assert.equal(/<script[^>]+src=/.test(html),false);
 const w=new Window({url:'file:///Downloads/piano-comparison.html'});
 w.document.write(html.replace(/<script\b[^>]*>[\s\S]*?<\/script>/g,''));
 w.localStorage.setItem('ear-training-v1','unchanged-progress');w.localStorage.setItem('ear-training-session-v1','unchanged-session');
 const sources=[],decoded=[];
 w.AudioContext=class{
 currentTime=10;destination={};resume(){return Promise.resolve();}decodeAudioData(buffer){assert.ok(buffer.byteLength>1000);decoded.push(buffer);return Promise.resolve({});}
 createBufferSource(){const source={connect(){},start(t){this.t=t;},stop(t){this.end=t;queueMicrotask(()=>this.onended?.());}};sources.push(source);return source;}
 };
 w.fetch=async url=>{assert.ok(url.startsWith('data:audio/mpeg;base64,'));return {ok:true,arrayBuffer:async()=>Uint8Array.from(Buffer.from(url.split(',')[1],'base64')).buffer};};
 w.setTimeout=fn=>{queueMicrotask(fn);return 1;};
 scripts.forEach(s=>w.eval(s.replace(/^export /gm,'')));
 const flush=async()=>{for(let i=0;i<100;i++)await Promise.resolve();};
 const d=w.document;
 assert.equal(Object.keys(w.PIANO_COMPARISON).length,32);
 for(const base of [48,60,72])for(const interval of [3,4,5,7,12]){
 d.querySelector('#register').value=String(base);d.querySelector('#interval').value=String(interval);d.querySelector('#interval').dispatchEvent(new w.Event('change'));
 for(const bank of ['current','salamander','salamander']){
 d.querySelector(`[data-bank="${bank}"]`).click();assert.ok(d.querySelector('select').disabled);await flush();
 assert.ok(!d.querySelector('select').disabled);assert.equal(d.querySelector('.playing'),null);
 const [a,b]=sources.slice(-2);assert.ok(Math.abs(a.end-a.t-.8)<1e-9);assert.ok(Math.abs(b.t-a.end-.05)<1e-9);
 }
 }
 assert.equal(sources.length,90);assert.equal(decoded.length,32);
 assert.equal(w.localStorage.getItem('ear-training-v1'),'unchanged-progress');assert.equal(w.localStorage.getItem('ear-training-session-v1'),'unchanged-session');
 await w.happyDOM.close();
});
