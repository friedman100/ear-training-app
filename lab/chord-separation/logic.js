import {createTracker} from '../../public/sing-back/pitch.js';
import {newRoot} from '../harmonic-separation/logic.js';
export const QUALITIES={major:{label:'מז׳ור · Major',offsets:[0,4,7]},minor:{label:'מינור · Minor',offsets:[0,3,7]},diminished:{label:'מוקטן · Diminished',offsets:[0,3,6]},augmented:{label:'מוגדל · Augmented',offsets:[0,4,8]}};
export function newChord(range='middle',quality='major-minor',previous,random=Math.random){
 const types=Object.keys(QUALITIES);
 const pool=quality==='major-minor'?['major','minor']:types;
 const type=['mixed','major-minor'].includes(quality)?pool[Math.min(pool.length-1,Math.floor(random()*pool.length))]:quality;
 if(!QUALITIES[type])throw new Error('Unknown chord');
 const root=newRoot(range,QUALITIES[type].offsets.at(-1),previous,random);return {type,notes:QUALITIES[type].offsets.map(n=>root+n)};
}
export function createChordAttempt(){
 const tracker=createTracker({tolerance:40,holdMs:500});let index=0,matched=false;
 return {get index(){return index;},get matched(){return matched;},get complete(){return index===2&&matched;},reset(){index=0;matched=false;tracker.reset();},clearReading(){tracker.reset();},
 update(detection,notes,time){if(matched)return null;const result=tracker.update(detection,notes[index],time);if(result.reliable&&result.accurate&&result.success)matched=true;return result;},
 advance(){if(!matched||index===2)return false;index++;matched=false;tracker.reset();return true;}};
}
