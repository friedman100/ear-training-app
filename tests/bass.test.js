import test from 'node:test';
import assert from 'node:assert/strict';
import {BASS_KEY,BASS_PATTERNS,BASS_BEAT,bassChords,bassPlan,bassAnswerPlan,keyboardNotes,makeBassQuestion,checkBass,initialBass,newBassRound,submitBass,finishBass,loadBass} from '../src/bass.js';
test('all curated progressions in every key have matching root basses and identical isolated-bass timing',()=>{
 for(let patternIndex=0;patternIndex<BASS_PATTERNS.length;patternIndex++)for(let key=0;key<12;key++){
 const q={patternIndex,key},chords=bassChords(q),full=bassPlan(q),only=bassPlan(q,true);
 assert.equal(chords.length,4);assert.equal(full.length,16);assert.equal(only.length,4);
 chords.forEach((chord,i)=>{assert.equal(chord.bass+12,chord.notes[0]);assert.deepEqual(chord.notes.map(n=>n-chord.notes[0]),chord.quality==='major'?[0,4,7]:[0,3,7]);assert.ok(keyboardNotes().includes(chord.bass));assert.ok(chord.notes.every(n=>n>=48&&n<=96));assert.equal(only[i].midi,chord.bass);assert.equal(only[i].offset,i*BASS_BEAT);assert.deepEqual(full.filter(n=>n.offset===i*BASS_BEAT).map(n=>n.midi),[chord.bass,...chord.notes]);});
 assert.deepEqual(full.filter(n=>n.midi<48),only);
 const answer=chords.map(c=>c.bass);assert.equal(checkBass(q,answer).count,4);assert.equal(checkBass(q,answer.map(n=>n+12)).count,4);assert.equal(checkBass(q,answer.map(n=>36+(n-36+2)%12)).count,0);
 assert.deepEqual(bassAnswerPlan(answer).map(n=>n.midi),answer);
 }
 assert.deepEqual(bassChords({patternIndex:4,key:0}).map(c=>[c.bass%12,c.quality]),[[0,'major'],[4,'minor'],[9,'minor'],[7,'major']]);
 assert.deepEqual(bassChords({patternIndex:5,key:0}).map(c=>[c.bass%12,c.quality]),[[9,'minor'],[7,'major'],[5,'major'],[4,'major']]);
 assert.deepEqual(bassChords({patternIndex:0,key:0}).map(c=>c.bass%12),[0,7,9,5]);
 assert.deepEqual(bassChords({patternIndex:0,key:2}).map(c=>c.bass%12),[2,9,11,7]);
 const choices=new Set();for(let p=0;p<BASS_PATTERNS.length;p++)for(let k=0;k<12;k++){let index=0;const values=[(p+.1)/BASS_PATTERNS.length,(k+.1)/12];const q=makeBassQuestion(()=>values[index++]);choices.add(`${q.patternIndex}:${q.key}`);}assert.equal(choices.size,72);
 assert.notDeepEqual(makeBassQuestion(()=>0,{patternIndex:0,key:0}),{patternIndex:0,key:0});
});
test('retries, aid usage, reveals and refresh keep accurate first-attempt statistics without duplicate completion',()=>{
 let s=initialBass();s.current=newBassRound({patternIndex:0,key:0});assert.deepEqual(finishBass(s),s);
 s.current.answer=[38,43,45,41];s=submitBass(s);assert.equal(s.current.result.count,3);assert.equal(s.current.firstSuccess,false);
 s.current.answer[0]=48;s.current.usedBassOnly=true;s.current.revealed=true;s=submitBass(s);assert.equal(s.current.result.count,4);assert.equal(s.current.firstSuccess,false);
 const saved=JSON.stringify(s),storage={getItem:key=>key===BASS_KEY?saved:null};s=loadBass(storage);assert.equal(s.current.attempts,2);s=finishBass(s);assert.deepEqual(s.stats,{completed:1,first:0,assisted:1,last:{correct:4,firstSuccess:false,usedBassOnly:true,revealed:true}});assert.deepEqual(finishBass(s),s);
 s.current=newBassRound({patternIndex:1,key:4});s.current.answer=bassChords(s.current.q).map(c=>c.bass);s=submitBass(s);s=finishBass(s);assert.equal(s.stats.first,1);assert.equal(s.stats.completed,2);
 assert.deepEqual(loadBass({getItem:()=>'{bad'}),initialBass());assert.throws(()=>checkBass({patternIndex:0,key:0},[36,null,45,41]));
});

test('guided course balances patterns, varies keys, prevents duplicates and preserves legacy free practice',async()=>{
 const {makeBassCourse,loadGuidedBass,newGuidedBass,BASS_GUIDED_KEY}=await import('../src/bass-course.js');
 for(const rng of [()=>0,()=>.999999,Math.random]){
 const questions=makeBassCourse(rng),counts=BASS_PATTERNS.map((_,id)=>questions.filter(q=>q.patternIndex===id).length);
 assert.equal(questions.length,10);assert.equal(new Set(questions.map(q=>q.key)).size,10);assert.equal(new Set(questions.map(q=>JSON.stringify(q))).size,10);assert.ok(Math.max(...counts)-Math.min(...counts)<=1);assert.ok(counts.every(n=>n>=1));
 }
 const legacy=initialBass();legacy.stats.completed=4;
 const guided=newGuidedBass();guided.practice.current=newBassRound(guided.questions[0]);const storage={getItem:key=>key===BASS_GUIDED_KEY?JSON.stringify(guided):JSON.stringify(legacy)};
 assert.deepEqual(loadGuidedBass(storage),guided);assert.deepEqual(loadBass(storage),legacy);
 const invalid=structuredClone(guided);invalid.completed=3;assert.equal(loadGuidedBass({getItem:()=>JSON.stringify(invalid)}).completed,0);
});
