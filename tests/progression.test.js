import test from 'node:test';
import assert from 'node:assert/strict';
import {BASS_PATTERNS,bassChords,bassPlan} from '../src/bass.js';
import {PROGRESSION_KEY,initialProgression,newProgressionRound,progressionPlan,submitProgressionBass,submitProgressionQualities,loadProgression} from '../src/progression.js';
test('all 72 original, isolated and student-built progressions use exact matching root-position voicings and timing',()=>{
 for(let patternIndex=0;patternIndex<BASS_PATTERNS.length;patternIndex++)for(let key=0;key<12;key++){
 const q={patternIndex,key},chords=bassChords(q),qualities=chords.map(c=>c.quality),original=progressionPlan(q);
 assert.deepEqual(original,bassPlan(q));assert.deepEqual(progressionPlan(q,qualities),original);
 for(let i=0;i<4;i++){const single=progressionPlan(q,null,i),events=original.slice(i*4,i*4+4);assert.deepEqual(single,events.map(e=>({...e,offset:0})));assert.deepEqual(single.map(e=>e.midi),[chords[i].bass,...chords[i].notes]);}
 const wrong=[...qualities];wrong[0]=wrong[0]==='major'?'minor':'major';const answer=progressionPlan(q,wrong);assert.notEqual(answer[2].midi,original[2].midi);assert.deepEqual(answer.filter((_,i)=>i!==2),original.filter((_,i)=>i!==2));
 }
});
test('only exact bass pitch classes open quality stage, retries and refresh preserve question and completion counts once',()=>{
 let s=initialProgression();s.current=newProgressionRound({patternIndex:0,key:0});const q=structuredClone(s.current.q);
 assert.equal(submitProgressionQualities(s),s);
 s.current.answer=[38,45,47,43];s=submitProgressionBass(s);assert.equal(s.current.result.count,0);assert.equal(s.current.stage,'bass');
 s.current.answer=[48,55,57,53];s=submitProgressionBass(s);assert.equal(s.current.stage,'qualities');assert.equal(s.current.firstSuccess,false);assert.deepEqual(s.current.q,q);
 s.current.qualities=['minor','major','minor','major'];s=submitProgressionQualities(s);assert.equal(s.current.qualityResult.count,3);assert.equal(s.stats.completed,0);
 const reload=()=>loadProgression({getItem:key=>key===PROGRESSION_KEY?JSON.stringify(s):null});assert.deepEqual(reload(),s);
 s.current.qualities[0]='major';s.current.qualityResult=null;s.current.usedBassOnly=true;s=submitProgressionQualities(s);assert.equal(s.current.completed,true);assert.deepEqual(s.stats,{completed:1,bassFirst:0,qualityFirst:0,assisted:1});assert.equal(submitProgressionQualities(s),s);assert.deepEqual(reload(),s);
 assert.deepEqual(loadProgression({getItem:()=>'{bad'}),initialProgression());
 const corrupt=structuredClone(s);corrupt.current.stage='bass';assert.deepEqual(loadProgression({getItem:()=>JSON.stringify(corrupt)}),initialProgression());
});

test('progression roots use their diatonic spelling in sharp, flat and relative minor keys',async()=>{
 const {progressionRootNames}=await import('../src/tonality.js');
 assert.deepEqual(progressionRootNames({patternIndex:4,key:2}).map(n=>n.english),['D','F♯','B','A']);
 assert.equal(progressionRootNames({patternIndex:4,key:2})[1].hebrew,'פה דיאז');
 assert.deepEqual(progressionRootNames({patternIndex:5,key:2}).map(n=>n.english),['B','A','G','F♯']);
 assert.deepEqual(progressionRootNames({patternIndex:0,key:5}).map(n=>n.english),['F','C','D','B♭']);
 assert.equal(progressionRootNames({patternIndex:0,key:5})[3].hebrew,'סי במול');
 assert.deepEqual(progressionRootNames({patternIndex:4,key:3}).map(n=>n.english),['E♭','G','C','B♭']);
 for(let patternIndex=0;patternIndex<BASS_PATTERNS.length;patternIndex++)for(let key=0;key<12;key++){
 const q={patternIndex,key};progressionRootNames(q).forEach((name,i)=>{assert.equal(name.pitchClass,bassChords(q)[i].bass%12);assert.ok(!name.english.includes('/'));assert.ok(!name.hebrew.includes('/'));});
 }
});
