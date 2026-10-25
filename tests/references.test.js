import test from 'node:test';
import assert from 'node:assert/strict';
import {INTERVAL_REFERENCES,referencesFor,referencePlan,validateReferences} from '../src/interval-references.js';
const fixtures={
 'bridal-chorus':[[65,70,70,70,65,72,69,70],[1,.75,.25,2,1,.75,.25,2],[0,1]],
 'we-wish':[[62,67,67,69,67,66,64,64],[1,1,.5,.5,.5,.5,1,1],[0,1]],
 'amazing-grace':[[62,67,71,67,71,69,67,64,62],[1,2,.5,.5,2,1,2,1,2],[0,1]],
 'royal-fanfare':[[60,60,60,67],[1,.5,.5,3],[2,3]],
 'shana-avra':[[57,62,57,62,62,66,62,66,62,66,69,69,67,66,67,66,64],[.93,2.59,.86,2.68,.86,2.49,.81,1.46,.77,.77,1.6,1.66,1.65,1.66,.72,.9,2],[2,3]],
 'iris-chorus':[[62,62,69,69,69,69,67,66,62,64],[1,1,1,1,.5,1,.75,.75,.75,1.5],[1,2]],
 'twinkle':[[60,60,67,67,69,69,67],[1,1,1,1,1,1,2],[1,2]]
};
test('approved source phrases retain pitches, rhythm, repeated notes and exact interval positions',()=>{
 assert.equal(validateReferences(),true);assert.equal(INTERVAL_REFERENCES.length,7);assert.equal(referencesFor(5).length,4);assert.equal(referencesFor(7).length,3);assert.deepEqual(referencesFor(4),[]);
 for(const [id,[pitches,beats,indices]]of Object.entries(fixtures)){
 const ref=INTERVAL_REFERENCES.find(r=>r.id===id);assert.deepEqual(ref.melody.map(n=>n.midi),pitches);assert.deepEqual(ref.melody.map(n=>n.beats),beats);assert.deepEqual(ref.intervalNotes,indices);assert.ok(ref.verification.notes);assert.ok(ref.verification.sources.length);
 const plan=referencePlan(ref);let elapsed=0;plan.forEach((event,i)=>{assert.ok(Math.abs(event.offset-elapsed)<1e-9);assert.equal(event.midi,pitches[i]);assert.ok(Math.abs(event.duration-beats[i]*60/ref.bpm*(ref.melody[i].gate??.94))<1e-9);elapsed+=beats[i]*60/ref.bpm;});
 const pair=referencePlan(ref,'interval');assert.deepEqual(pair.map(n=>n.midi),indices.map(i=>pitches[i]));assert.equal(pair[1].midi-pair[0].midi,ref.interval);assert.deepEqual(pair.map(n=>n.offset),[0,.85]);
 }
 const irisPlan=referencePlan(INTERVAL_REFERENCES.find(r=>r.id==='iris-chorus'));assert.ok(irisPlan.at(-1).duration>.6);assert.equal(irisPlan.at(-1).release,.65);assert.ok(irisPlan.slice(0,-1).every(n=>n.release===.12));
 const royal=INTERVAL_REFERENCES.find(r=>r.id==='royal-fanfare');assert.equal(royal.verification.basis,'user-recording');
 const royalPlan=referencePlan(royal);assert.deepEqual(royalPlan.map(n=>n.release),[.1,.1,.1,.35]);assert.ok(royalPlan[0].offset+royalPlan[0].duration+royalPlan[0].release<royalPlan[1].offset);assert.ok(royal.melody[0].beats>royal.melody[1].beats);assert.deepEqual(royalPlan.map(n=>Number(n.offset.toFixed(3))),[0,.333,.5,.667]);
});
test('pending melodies cannot be played and invalid musical data cannot be promoted',()=>{
 const pending={id:'future',title:'Future melody',interval:4,melody:[],intervalNotes:[],verification:{status:'pending',sources:[],reason:'Awaiting a source'}};assert.equal(validateReferences([pending]),true);assert.throws(()=>referencePlan(pending));
 const bad=structuredClone(INTERVAL_REFERENCES);bad[0].melody[1].midi++;assert.throws(()=>validateReferences(bad));
 const badRhythm=structuredClone(INTERVAL_REFERENCES);badRhythm[0].melody[0].beats=0;assert.throws(()=>validateReferences(badRhythm));
 const fabricated=structuredClone(pending);fabricated.melody=[{midi:60,beats:1}];assert.throws(()=>validateReferences([fabricated]));
 const badGate=structuredClone(INTERVAL_REFERENCES);badGate[0].melody[0].gate=2;assert.throws(()=>validateReferences(badGate));
 const rested=structuredClone(INTERVAL_REFERENCES.find(r=>r.id==='twinkle'));rested.melody.push({midi:null,beats:1},{midi:60,beats:1});const plan=referencePlan(rested);assert.equal(plan.length,8);assert.ok(Math.abs(plan.at(-1).offset-9*60/rested.bpm)<1e-9);
});

test('production Shana Tova preserves the approved full piano preview exactly',()=>{
 const ref=INTERVAL_REFERENCES.find(r=>r.id==='shana-avra'),plan=referencePlan(ref);
 const approvedOnsets=[0,.465,1.760,2.190,3.530,3.960,5.205,5.610,6.340,6.725,7.110,7.910,8.740,9.565,10.395,10.755,11.205];
 const approvedHolds=[.34,1.14,.30,1.16,.32,1.15,.365,.657,.346,.347,.72,.747,.742,.747,.324,.405,.85];
 assert.deepEqual(plan.map(n=>Number(n.offset.toFixed(3))),approvedOnsets);assert.equal(ref.verification.recording.sha256,'0dc5a68799cbb10e8083719a16d0e5aafd5a57865e39a660a3f74c887fabc650');
 plan.forEach((n,i)=>{assert.ok(Math.abs(n.duration-approvedHolds[i])<1e-9,`note ${i+1} hold`);assert.equal(n.release,i===16?.35:.12);});
 assert.equal(plan[4].midi,62);assert.deepEqual(plan.slice(10,12).map(n=>n.midi),[69,69]);assert.deepEqual(referencePlan(ref,'interval').map(n=>n.midi),[57,62]);
});
