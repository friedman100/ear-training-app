import {createTracker,centsFromTarget} from './pitch.js';
export const SLOT_MS=1800,DEMO_MS=4000,COUNT_MS=1800;
export function timelinePhase(elapsed,withSinging=true){
 if(elapsed<DEMO_MS)return {phase:'listen',step:Math.min(1,Math.floor(Math.max(0,elapsed)/SLOT_MS)),position:Math.min(1,Math.max(0,elapsed)/(2*SLOT_MS))};
 if(!withSinging)return {phase:'done',position:1};
 if(elapsed<DEMO_MS+COUNT_MS)return {phase:'count',count:elapsed<DEMO_MS+COUNT_MS/2?1:2,position:0};
 const singing=elapsed-DEMO_MS-COUNT_MS;
 if(singing>=2*SLOT_MS)return {phase:'done',position:1};
 return {phase:'sing',step:Math.floor(singing/SLOT_MS),position:singing/(2*SLOT_MS)};
}
export const REQUIRED_ACCURATE_MS=600;
export function createTimedRound(notes){
 const results=notes.map(()=>({accurate:false,readings:0,goodMs:0}));let step=-1,lastTime=null,lastGood=false;const tracker=createTracker();
 return {results,update(detection,time){
 const phase=timelinePhase(time);
 if(phase.phase!=='sing')return {phase,result:null};
 if(step!==phase.step){step=phase.step;tracker.reset();lastTime=null;lastGood=false;}
 const result=tracker.update(detection,notes[step],time);
 if(result.reliable)results[step].readings++;
 // Match the green dots exactly; brief deviations pause rather than erase credit.
 const good=result.reliable&&Math.abs(centsFromTarget(detection.frequency,notes[step]))<=25;
 if(good&&lastGood&&lastTime!==null&&time-lastTime<=100)results[step].goodMs+=Math.max(0,time-lastTime);
 lastTime=time;lastGood=good;
 results[step].accurate=results[step].goodMs>=REQUIRED_ACCURATE_MS;
 result.success=results[step].accurate;result.progress=Math.min(1,results[step].goodMs/REQUIRED_ACCURATE_MS);
 return {phase,result};
 }};
}
