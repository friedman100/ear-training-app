import test from 'node:test';
import assert from 'node:assert/strict';
import {newSession,completeQuestion,noteUnlocks,loadSession,restoreQuestion} from '../src/session.js';
test('session counts only completed questions and first-attempt success',()=>{
 let s=newSession();s=completeQuestion(s,{interval:5,attempts:2,solved:false});assert.equal(s.total,0);
 for(const [interval,attempts] of [[5,1],[7,1],[5,3],[5,1],[7,1],[7,1]])s=completeQuestion(s,{interval,attempts,solved:true});
 assert.equal(s.total,6);assert.equal(s.correct,5);assert.equal(s.best,3);assert.equal(s.streak,3);
 assert.deepEqual(s.intervals,{5:{total:3,correct:2},7:{total:3,correct:3}});
});
test('unlock list deduplicates and session survives storage roundtrip',()=>{
 let s=noteUnlocks(newSession(),[4,3,4]);assert.deepEqual(s.unlocked,[4,3]);s=completeQuestion(s,{interval:4,attempts:1,solved:true});s.ended=true;
 assert.deepEqual(loadSession({getItem:()=>JSON.stringify(s)}),s);
 assert.deepEqual(loadSession({getItem:()=>null}),newSession());assert.deepEqual(loadSession({getItem:()=>'{bad'}),newSession());
});
test('restoring unfinished question preserves attempts and validates mode and range',()=>{
 const current={mode:'guided',range:'middle',q:{start:60,end:65,interval:5,attempts:1,solved:false}};
 assert.equal(restoreQuestion(current,[5,7],'middle','guided',[60,84]).attempts,1);
 assert.equal(restoreQuestion(current,[5,7],'high','guided',[72,96]),null);
 assert.equal(restoreQuestion(current,[5,7],'middle','free',[60,84]),null);
});
