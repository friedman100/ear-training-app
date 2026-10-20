import test from 'node:test';
import assert from 'node:assert/strict';
import {INTERVALS,STAGES,RANGES,windowSize,initialState,question,answer,record,load} from '../src/logic.js';
import {NOTE_DURATION,NOTE_GAP} from '../src/audio.js';
test('curriculum is cumulative and follows the requested order',()=>{
 assert.deepEqual(STAGES.map(s=>s.at(-1)),[7,4,3,2,1,6,9,8,11,10,12]);
 assert.deepEqual(STAGES[0],[5,7]);
 STAGES.slice(1).forEach((s,i)=>assert.deepEqual(s.slice(0,-1),STAGES[i]));
 assert.equal(new Set(STAGES[10]).size,12);assert.equal(INTERVALS.length,13);
});
test('all intervals remain ascending and inside each selected range at both boundaries',()=>{
 for(const range of Object.keys(RANGES))for(let id=1;id<=12;id++)for(const r of [0,.5,.999999]){
 const q=question([id],range,[],()=>r);assert.equal(q.end-q.start,id);assert.ok(q.start>=RANGES[range][0]);assert.ok(q.end<=RANGES[range][1]);}
});
test('scheduler covers every active interval before repeating',()=>{
 const active=STAGES[10],history=[];for(let i=0;i<12;i++){let q=question(active,'middle',history);history.push({interval:q.interval});}assert.equal(new Set(history.map(x=>x.interval)).size,12);
});
test('wrong guesses allow retry and success locks the question',()=>{
 let q=question([5],'middle');let a=answer(q,7);assert.equal(a.first,true);assert.equal(a.correct,false);assert.equal(a.q.solved,false);
 a=answer(a.q,5);assert.equal(a.first,false);assert.equal(a.q.solved,true);assert.equal(answer(a.q,7).ignored,true);
});
function feed(s,count,correctAt=()=>true){for(let i=0;i<count;i++){const q=question(STAGES[s.stage],s.range,s.history);s=record(s,q,correctAt(i));}return s;}
test('unlock requires a full window and at least 80% first attempt accuracy',()=>{
 let s=feed(initialState(),19);assert.equal(s.stage,0);s=feed(s,1);assert.equal(s.stage,1);assert.equal(s.pending,4);assert.equal(s.history.length,0);
 s=feed(initialState(),20,i=>i<15);assert.equal(s.stage,0);
 s=feed(initialState(),20,i=>i<16);assert.equal(s.stage,1);
});
test('window expands with curriculum; missing coverage blocks advancement',()=>{
 assert.equal(windowSize(0),20);assert.equal(windowSize(10),48);
 let s=initialState();for(let i=0;i<25;i++)s=record(s,{interval:5},true);assert.equal(s.stage,0);
});
test('part A completion never advances automatically',()=>{
 let s=initialState();s.stage=4;s=feed(s,windowSize(4));assert.equal(s.stage,4);assert.equal(s.partAComplete,true);assert.equal(s.pending,'partB');s.pending=null;s=feed(s,40);assert.equal(s.stage,4);
});
test('final stage completes without running past curriculum',()=>{
 let s=initialState();s.stage=10;s=feed(s,48);assert.equal(s.stage,10);assert.equal(s.complete,true);
});
test('free practice has separate stats and cannot advance guided progress',()=>{
 let s=initialState();s.mode='free';s=feed(s,25);assert.equal(s.stage,0);assert.equal(s.history.length,0);assert.equal(s.stats.guided.total,0);assert.equal(s.stats.free.total,25);
});
test('first attempt failure resets streak',()=>{
 let s=record(initialState(),{interval:5},true);s=record(s,{interval:7},false);assert.deepEqual(s.stats.guided,{total:2,correct:1,streak:0});
});
test('storage round trips and safely recovers from bad data',()=>{
 let s=initialState();s.range='high';assert.deepEqual(load({getItem:()=>JSON.stringify(s)}),s);
 for(const value of ['bad','null','{}',JSON.stringify({...s,selected:[]}),JSON.stringify({...s,stage:99})])assert.deepEqual(load({getItem:()=>value}),initialState());
});
test('audio timing matches requested note length and silence',()=>{assert.equal(NOTE_DURATION,.6);assert.equal(NOTE_GAP,.05);});
