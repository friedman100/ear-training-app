import test from 'node:test';
import assert from 'node:assert/strict';
import {CHORDS,CHORD_STAGES,chordInitial,chordQuestion,chordWindow,recordChord,loadChords,loadChordSession,CHORD_KEY,CHORD_SESSION_KEY,restoreChord,answer,newSession,completeQuestion} from '../src/chords.js';
import {chordPlan} from '../src/audio.js';
import {load,initialState} from '../src/logic.js';
test('all thirteen chord qualities have exact root-position formulas and both playback orders',()=>{
 const formulas=[[0,4,7],[0,3,7],[0,3,6],[0,4,8],[0,2,7],[0,5,7],[0,4,7,10],[0,4,7,11],[0,3,7,10],[0,3,6,10],[0,4,8,10],[0,3,7,11],[0,3,6,9]];
 assert.deepEqual(CHORDS.slice(1).map(c=>c.tones),formulas);
 for(let id=1;id<=13;id++)for(const value of [0,.5,.999999]){
 const q=chordQuestion([id],[],()=>value);assert.deepEqual(q.notes,formulas[id-1].map(n=>q.root+n));assert.ok(q.notes.every(n=>n>=48&&n<=96));
 assert.deepEqual(chordPlan(q.notes).map(n=>n.offset),q.notes.map(()=>0));
 assert.deepEqual(chordPlan(q.notes,true).map(n=>Number(n.offset.toFixed(2))),q.notes.map((_,i)=>Number((i*.85).toFixed(2))));
 assert.deepEqual(chordPlan(q.notes,true).map(n=>n.midi),q.notes);
 }
 assert.equal(chordQuestion([1],[],()=>0).root,48);assert.equal(chordQuestion([1],[],()=>.99999).root,71);
});
test('every guided stage needs full balanced window and 80 percent, ending safely',()=>{
 for(let stage=0;stage<12;stage++){
 let s={...chordInitial(),stage},ids=CHORD_STAGES[stage],n=chordWindow(stage);
 for(let i=0;i<n-1;i++)s=recordChord(s,{interval:ids[i%ids.length]},i<Math.ceil(n*.8));
 assert.equal(s.stage,stage);assert.equal(s.pending,null);
 s=recordChord(s,{interval:ids[(n-1)%ids.length]},false);
 assert.equal(s.stage,Math.min(11,stage+1));assert.equal(s.complete,stage===11);
 }
 let s=chordInitial();for(let i=0;i<20;i++)s=recordChord(s,{interval:1},true);assert.equal(s.stage,0);
 s=chordInitial();for(let i=0;i<20;i++)s=recordChord(s,{interval:1+i%2},i<15);assert.equal(s.stage,0);
 const free={...s,mode:'free'};assert.deepEqual(recordChord(free,{interval:13},true),free);
});
test('completion, retries, session restore, and chord saves remain independent of intervals',()=>{
 let q=chordQuestion([2]),session=newSession();assert.equal(completeQuestion(session,q),session);
 q=answer(q,1).q;q=answer(q,2).q;session=completeQuestion(session,q);assert.equal(session.total,1);assert.equal(session.correct,0);assert.equal(session.best,0);
 session=completeQuestion(session,answer(chordQuestion([13]),13).q);assert.equal(session.total,2);assert.equal(session.correct,1);assert.deepEqual(session.intervals[13],{total:1,correct:1});
 const intervalState=initialState();intervalState.stage=3;
 const values=new Map([['ear-training-v1',JSON.stringify(intervalState)],[CHORD_KEY,JSON.stringify(chordInitial())],[CHORD_SESSION_KEY,JSON.stringify(session)]]),storage={getItem:key=>values.get(key)};
 assert.equal(load(storage).stage,3);assert.equal(loadChords(storage).stage,0);assert.deepEqual(loadChordSession(storage),session);
 const s=chordInitial();assert.deepEqual(restoreChord({q,mode:'guided'},s),q);assert.equal(restoreChord({q:{...q,notes:[60,65,69]},mode:'guided'},s),null);
});
