import {createTracker,centsFromTarget} from './pitch.js?v=slow-warmup-3';
export const WARMUP_TIMING=Object.freeze({slotMs:3600,demoMs:15200,countMs:1800,requiredMs:600});
export const SLOT_MS=1800,DEMO_MS=4000,COUNT_MS=1800;
export function timelinePhase(elapsed,withSinging=true,{slotMs=SLOT_MS,demoMs=DEMO_MS,countMs=COUNT_MS,noteCount=2}={}){
 if(elapsed<demoMs)return {phase:'listen',step:Math.min(noteCount-1,Math.floor(Math.max(0,elapsed)/slotMs)),position:Math.min(1,Math.max(0,elapsed)/(noteCount*slotMs))};
 if(!withSinging)return {phase:'done',position:1};
 if(elapsed<demoMs+countMs)return {phase:'count',count:elapsed<demoMs+countMs/2?1:2,position:0};
 const singing=elapsed-demoMs-countMs;
 if(singing>=noteCount*slotMs)return {phase:'done',position:1};
 return {phase:'sing',step:Math.floor(singing/slotMs),position:singing/(noteCount*slotMs)};
}
export const REQUIRED_ACCURATE_MS=600;
export function createTimedRound(notes,{requiredMs=REQUIRED_ACCURATE_MS,...timing}={}){
 const results=notes.map(()=>({accurate:false,readings:0,goodMs:0}));let step=-1,lastTime=null,lastGood=false;const tracker=createTracker();
 return {results,update(detection,time){
 const phase=timelinePhase(time,true,{...timing,noteCount:notes.length});
 if(phase.phase!=='sing')return {phase,result:null};
 if(step!==phase.step){step=phase.step;tracker.reset();lastTime=null;lastGood=false;}
 const result=tracker.update(detection,notes[step],time);
 if(result.reliable)results[step].readings++;
 // Match the green dots exactly; brief deviations pause rather than erase credit.
 const good=result.reliable&&Math.abs(centsFromTarget(detection.frequency,notes[step]))<=25;
 if(good&&lastGood&&lastTime!==null&&time-lastTime<=100)results[step].goodMs+=Math.max(0,time-lastTime);
 lastTime=time;lastGood=good;
 results[step].accurate=results[step].goodMs>=requiredMs;
 result.success=results[step].accurate;result.progress=Math.min(1,results[step].goodMs/requiredMs);
 return {phase,result};
 }};
}
