import test from 'node:test';
import assert from 'node:assert/strict';
import {INTERVAL_REFERENCES,referencesFor,referencePlan,validateReferences} from '../src/interval-references.js';
const fixtures={
 'smoke-on-the-water':[[67,70,72,null,67,null,70,73,72,67,70,72,70,67],[1,1,1,.5,.5,.5,1,.5,2,1,1,1.5,1,3.5],[0,1]],
 'seven-nation-army':[[64,64,null,67,null,64,null,62,60,59],[1.5,.25,.25,.25,.5,.25,.5,.5,2,2],[1,3]],
 'oseh-shalom':[[62,65,69,69,69,69,69,69],[.5,.5,1.5,.5,1,.5,.5,4],[0,1]],
 'vivaldi-spring':[[64,68,68,68,66,64,71,71,69,68,68,68,66,64,71],[.5,.5,.5,.5,.25,.25,1.5,.25,.25,.5,.5,.5,.25,.25,1.5],[0,1]],
 'when-the-saints':[[60,64,65,67,60,64,65,67],[1,1,1,5,1,1,1,5],[0,1]],
 'pizmon-layakinton':[[65,69,72,69,67,65,62,65,67,67,69,65],[1,1,1,1,1,1,1,1,1,.5,.5,2],[0,1]],
 'bridal-chorus':[[65,70,70,70,65,72,69,70],[1,.75,.25,2,1,.75,.25,2],[0,1]],
 'we-wish':[[62,67,67,69,67,66,64,64],[1,1,.5,.5,.5,.5,1,1],[0,1]],
 'amazing-grace':[[62,67,71,67,71,69,67,64,62],[1,2,.5,.5,2,1,2,1,2],[0,1]],
 'royal-fanfare':[[60,60,60,67],[1,.5,.5,3],[2,3]],
 'shana-avra':[[57,62,57,62,62,66,62,66,62,66,69,69,67,66,67,66,64],[.93,2.59,.86,2.68,.86,2.49,.81,1.46,.77,.77,1.6,1.66,1.65,1.66,.72,.9,2],[2,3]],
 'iris-chorus':[[62,62,69,69,69,69,67,66,62,64],[1,1,1,1,.5,1,.75,.75,.75,1.5],[1,2]],
 'twinkle':[[60,60,67,67,69,69,67],[1,1,1,1,1,1,2],[1,2]]
};
test('approved source phrases retain pitches, rhythm, repeated notes and exact interval positions',()=>{
 assert.equal(validateReferences(),true);assert.equal(INTERVAL_REFERENCES.length,13);assert.equal(referencesFor(5).length,4);assert.equal(referencesFor(7).length,3);assert.equal(referencesFor(4).length,3);assert.equal(referencesFor(3).length,3);
 for(const [id,[pitches,beats,indices]]of Object.entries(fixtures)){
 const ref=INTERVAL_REFERENCES.find(r=>r.id===id);assert.deepEqual(ref.melody.map(n=>n.midi),pitches);assert.deepEqual(ref.melody.map(n=>n.beats),beats);assert.deepEqual(ref.intervalNotes,indices);assert.ok(ref.verification.notes);assert.ok(ref.verification.sources.length);
 const plan=referencePlan(ref);let elapsed=0,eventIndex=0;ref.melody.forEach((note,i)=>{if(note.midi!==null){const event=plan[eventIndex++];assert.ok(Math.abs(event.offset-elapsed)<1e-9);assert.equal(event.midi,pitches[i]);assert.ok(Math.abs(event.duration-beats[i]*60/ref.bpm*(note.gate??.94))<1e-9);}elapsed+=beats[i]*60/ref.bpm;});assert.equal(plan.length,eventIndex);
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

test('major third phrasing is shorter and slower for Spring and connected for the songs',()=>{
 const spring=referencesFor(4).find(r=>r.id==='vivaldi-spring');assert.equal(spring.bpm,96);assert.equal(spring.melody.length,15);assert.equal(spring.melody.at(-1).midi,71);
 for(const [id,bpm] of [['when-the-saints',140],['pizmon-layakinton',100]]){
  const ref=referencesFor(4).find(r=>r.id===id),plan=referencePlan(ref);assert.equal(ref.bpm,bpm);
  plan.slice(0,-1).forEach((n,i)=>{assert.ok(Math.abs(n.offset+n.duration-plan[i+1].offset)<1e-9);assert.equal(n.release,.32);assert.ok(n.offset+n.duration+n.release>plan[i+1].offset);});assert.equal(plan.at(-1).release,.5);
 }
});

test('minor thirds preserve riff rests, repeated openings and the tied Oseh Shalom ending',()=>{
 const seven=referencesFor(3).find(r=>r.id==='seven-nation-army'),plan=referencePlan(seven);
 assert.deepEqual(plan.map(n=>n.midi),[64,64,67,64,62,60,59]);assert.deepEqual(referencePlan(seven,'interval').map(n=>n.midi),[64,67]);
 assert.deepEqual(plan.map(n=>Number((n.offset*seven.bpm/60).toFixed(3))),[0,1.5,2,2.75,3.5,4,6]);
 const oseh=referencesFor(3).find(r=>r.id==='oseh-shalom');assert.equal(oseh.melody.at(-1).beats,4);assert.equal(referencePlan(oseh).length,8);
 const smoke=referencesFor(3).find(r=>r.id==='smoke-on-the-water');assert.equal(smoke.melody.filter(n=>n.midi===null).length,2);assert.equal(smoke.melody.reduce((s,n)=>s+n.beats,0),16);
});
