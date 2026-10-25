import test from 'node:test';
import assert from 'node:assert/strict';
import {INTERVAL_REFERENCES,referencesFor,referencePlan,validateReferences} from '../src/interval-references.js';
const fixtures={
 'bridal-chorus':[[65,70,70,70,65,72,69,70],[1,.75,.25,2,1,.75,.25,2],[0,1]],
 'we-wish':[[62,67,67,69,67,66,64,64],[1,1,.5,.5,.5,.5,1,1],[0,1]],
 'amazing-grace':[[62,67,71,67,71,69,67,64,62],[1,2,.5,.5,2,1,2,1,2],[0,1]],
 'royal-fanfare':[[60,60,60,67],[.5,.5,.5,2],[2,3]],
 'twinkle':[[60,60,67,67,69,69,67],[1,1,1,1,1,1,2],[1,2]]
};
test('approved source phrases retain pitches, rhythm, repeated notes and exact interval positions',()=>{
 assert.equal(validateReferences(),true);assert.equal(INTERVAL_REFERENCES.length,7);assert.equal(referencesFor(5).length,4);assert.equal(referencesFor(7).length,3);assert.deepEqual(referencesFor(4),[]);
 for(const [id,[pitches,beats,indices]]of Object.entries(fixtures)){
 const ref=INTERVAL_REFERENCES.find(r=>r.id===id);assert.deepEqual(ref.melody.map(n=>n.midi),pitches);assert.deepEqual(ref.melody.map(n=>n.beats),beats);assert.deepEqual(ref.intervalNotes,indices);assert.ok(ref.verification.notes);assert.ok(ref.verification.sources.length);
 const plan=referencePlan(ref);let elapsed=0;plan.forEach((event,i)=>{assert.ok(Math.abs(event.offset-elapsed)<1e-9);assert.equal(event.midi,pitches[i]);assert.ok(Math.abs(event.duration-beats[i]*60/ref.bpm*.94)<1e-9);elapsed+=beats[i]*60/ref.bpm;});
 const pair=referencePlan(ref,'interval');assert.deepEqual(pair.map(n=>n.midi),indices.map(i=>pitches[i]));assert.equal(pair[1].midi-pair[0].midi,ref.interval);assert.deepEqual(pair.map(n=>n.offset),[0,.85]);
 }
 const royal=INTERVAL_REFERENCES.find(r=>r.id==='royal-fanfare');assert.equal(royal.verification.basis,'user-defined');
});
test('pending melodies cannot be played and invalid musical data cannot be promoted',()=>{
 for(const id of ['iris-chorus','shana-avra']){const ref=INTERVAL_REFERENCES.find(r=>r.id===id);assert.equal(ref.verification.status,'pending');assert.deepEqual(ref.melody,[]);assert.throws(()=>referencePlan(ref));}
 const bad=structuredClone(INTERVAL_REFERENCES);bad[0].melody[1].midi++;assert.throws(()=>validateReferences(bad));
 const badRhythm=structuredClone(INTERVAL_REFERENCES);badRhythm[0].melody[0].beats=0;assert.throws(()=>validateReferences(badRhythm));
 const fabricated=structuredClone(INTERVAL_REFERENCES);fabricated.find(r=>r.id==='iris-chorus').melody=[{midi:60,beats:1}];assert.throws(()=>validateReferences(fabricated));
 const rested=structuredClone(INTERVAL_REFERENCES.find(r=>r.id==='twinkle'));rested.melody.push({midi:null,beats:1},{midi:60,beats:1});const plan=referencePlan(rested);assert.equal(plan.length,8);assert.ok(Math.abs(plan.at(-1).offset-9*60/rested.bpm)<1e-9);
});
