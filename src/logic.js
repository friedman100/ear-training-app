import {PLAYBACK_TYPES} from './playback-plan.js';
export const ENGLISH_INTERVALS = [null,'Minor 2nd','Major 2nd','Minor 3rd','Major 3rd','Perfect 4th','Tritone','Perfect 5th','Minor 6th','Major 6th','Minor 7th','Major 7th','Octave'];
export const INTERVALS = [null,'סקונדה קטנה','סקונדה גדולה','טרצה קטנה','טרצה גדולה','קוורטה זכה','טריטון','קווינטה זכה','סקסטה קטנה','סקסטה גדולה','ספטימה קטנה','ספטימה גדולה','אוקטבה'];
export const STAGES = [[5,7],[5,7,4],[5,7,4,3],[5,7,4,3,2],[5,7,4,3,2,1],[5,7,4,3,2,1,6],[5,7,4,3,2,1,6,9],[5,7,4,3,2,1,6,9,8],[5,7,4,3,2,1,6,9,8,11],[5,7,4,3,2,1,6,9,8,11,10],[5,7,4,3,2,1,6,9,8,11,10,12]];
export const RANGES = {low:[48,72],middle:[60,84],high:[72,96]};
export const windowSize = stage => Math.max(20, STAGES[stage].length * 4);
export const initialState = () => ({version:1,stage:0,partAComplete:false,complete:false,history:[],stats:{guided:{total:0,correct:0,streak:0},free:{total:0,correct:0,streak:0}},range:'middle',playbackType:'ascending',mode:'guided',selected:[5,7],pending:null});
export function question(active,range,history=[],rng=Math.random){
 if(!active.length) throw new Error('Select an interval');
 // Always sample the least represented interval: every active interval is covered.
 const counts=active.map(id=>history.filter(h=>h.interval===id).length);
 const min=Math.min(...counts), pool=active.filter((_,i)=>counts[i]===min);
 const interval=pool[Math.floor(rng()*pool.length)];
 const [low,high]=RANGES[range];
 const start=low+Math.floor(rng()*(high-low-interval+1));
 return {interval,start,end:start+interval,attempts:0,solved:false};
}
export function answer(q,id){
 if(q.solved) return {q,first:false,correct:true,ignored:true};
 return {q:{...q,attempts:q.attempts+1,solved:id===q.interval},first:q.attempts===0,correct:id===q.interval,ignored:false};
}
export function record(state,q,correct){
 const s=structuredClone(state),stats=s.stats[s.mode];
 stats.total++; stats.correct+=Number(correct); stats.streak=correct?stats.streak+1:0;
 if(s.mode==='free') return s;
 const n=windowSize(s.stage);
 s.history=[...s.history,{interval:q.interval,correct}].slice(-n);
 if(s.pending || s.complete || s.partAComplete && s.stage===4) return s;
 const covered=STAGES[s.stage].every(id=>s.history.filter(h=>h.interval===id).length>=2);
 if(s.history.length===n && covered && s.history.filter(h=>h.correct).length/n>=.8){
 if(s.stage===4){s.partAComplete=true;s.pending='partB';}
 else if(s.stage===10){s.complete=true;s.pending='complete';}
 else {s.stage++;s.history=[];s.pending=STAGES[s.stage].at(-1);}
 }
 return s;
}
export function load(storage){
 try {const s=JSON.parse(storage.getItem('ear-training-v1'));const base=initialState();
 if(!s || s.version!==1 || !Number.isInteger(s.stage)||s.stage<0||s.stage>10) return base;
 if(!RANGES[s.range]||!['guided','free'].includes(s.mode)||!Array.isArray(s.selected)||!s.selected.length||s.selected.some(n=>!Number.isInteger(n)||n<1||n>12)||!Array.isArray(s.history)) return base;
 if(!['guided','free'].every(m=>s.stats?.[m] && ['total','correct','streak'].every(k=>Number.isInteger(s.stats[m][k])&&s.stats[m][k]>=0))) return base;
 return {...base,...s,playbackType:Object.hasOwn(PLAYBACK_TYPES,s.playbackType)?s.playbackType:'ascending'};
 }catch{return initialState();}
}
