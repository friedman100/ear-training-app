import {ANI_REVIEW} from './ani-approved.js';
const a=[60,60,67,67,69,69,67,65,65,64,64,62,62,60],b=[67,67,65,65,64,64,62,67,67,65,65,64,64,62];
const beats14=[1,1,1,1,1,1,2,1,1,1,1,1,1,2];
// Traditional melody transcription, pitches transposed F major -> G major.
// Source: https://bugeados.com/arduino/robot-navidad-arduino/ (score link and note-duration pairs).
const groups=[[[62],[1]],[[67,67,69,67,66],[1,.5,.5,.5,.5]],[[64,64,64],[1,1,1]],[[69,69,71,69,67],[1,.5,.5,.5,.5]],[[66,62,62],[1,1,1]],[[71,71,72,71,69],[1,.5,.5,.5,.5]],[[67,64,62,62],[1,1,.5,.5]],[[64,69,66],[1,1,1]],[[67],[2]]];
export const MELODIES=[{id:'twinkle',title:'Twinkle Twinkle Little Star',level:'קל מאוד',notes:[...a,...b,...a],beats:[...beats14,...beats14,...beats14],bpm:112,phrases:[7,7,7,7,7,7],source:'https://en.wikipedia.org/wiki/Twinkle,_Twinkle,_Little_Star'}, {id:'we-wish',title:'We Wish You a Merry Christmas',level:'קל',notes:groups.flatMap(g=>g[0]),beats:groups.flatMap(g=>g[1]),bpm:120,phrases:[8,8,9,5],source:'https://bugeados.com/arduino/robot-navidad-arduino/'},...ANI_REVIEW];
export const newRound=m=>({answer:m.notes.map(()=>null),active:0,result:null});
export function check(m,answer){if(answer.length!==m.notes.length||answer.some(n=>!Number.isInteger(n)))throw Error('יש למלא את כל התווים');return answer.map((n,i)=>n===m.notes[i]);}
export function plan(m,notes=m.notes){let time=0;return notes.map((midi,i)=>{const duration=m.beats[i]*60/m.bpm,event={midi,offset:time,duration:duration*(m.gate??.94),release:i===notes.length-1?(m.finalRelease??.12):(m.release??.12)};time+=duration;return event;});}
