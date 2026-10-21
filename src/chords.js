// Quality IDs are stable storage identifiers. Semitone formulas are root-position voicings.
import {answer} from './logic.js';
import {newSession,loadSession,completeQuestion,noteUnlocks} from './session.js';
export {answer,newSession,completeQuestion,noteUnlocks};
export const CHORD_KEY='ear-training-chords-v1';
export const CHORD_SESSION_KEY='ear-training-chords-session-v1';
export const CHORDS=[null,
 {name:'מז׳ור',symbol:'Major',tones:[0,4,7]},
 {name:'מינור',symbol:'Minor',tones:[0,3,7]},
 {name:'מוקטן',symbol:'dim',tones:[0,3,6]},
 {name:'מוגדל',symbol:'aug',tones:[0,4,8]},
 {name:'סאס 2',symbol:'Sus2',tones:[0,2,7]},
 {name:'סאס 4',symbol:'Sus4',tones:[0,5,7]},
 {name:'דומיננט 7',symbol:'7',tones:[0,4,7,10]},
 {name:'מייג׳ור 7',symbol:'Maj7',tones:[0,4,7,11]},
 {name:'מינור 7',symbol:'m7',tones:[0,3,7,10]},
 {name:'חצי מוקטן',symbol:'m7♭5',tones:[0,3,6,10]},
 {name:'דומיננט 7 עם קווינטה מוגדלת',symbol:'7♯5',tones:[0,4,8,10]},
 {name:'מינור־מייג׳ור 7',symbol:'mMaj7',tones:[0,3,7,11]},
 {name:'מוקטן 7',symbol:'dim7',tones:[0,3,6,9]}
];
export const CHORD_STAGES=Array.from({length:12},(_,i)=>Array.from({length:i+2},(_,j)=>j+1));
export const chordWindow=stage=>Math.max(20,CHORD_STAGES[stage].length*4);
export const chordInitial=()=>({version:1,stage:0,history:[],complete:false,pending:null,mode:'guided',selected:[1,2]});
export const chordActive=s=>s.mode==='guided'?CHORD_STAGES[s.stage]:s.selected;
export function chordQuestion(active,history=[],rng=Math.random){
 if(!active.length||active.some(id=>!CHORDS[id]))throw Error('Choose a chord quality');
 const counts=active.map(id=>history.filter(row=>row.interval===id).length),minimum=Math.min(...counts);
 const pool=active.filter((_,i)=>counts[i]===minimum),interval=pool[Math.floor(rng()*pool.length)];
 // C3–B4 roots; every complete chord fits in the existing C3–C7 sample bank.
 const root=48+Math.floor(rng()*24);
 return {interval,root,notes:CHORDS[interval].tones.map(n=>root+n),attempts:0,solved:false};
}
export function recordChord(state,q,correct){
 const s=structuredClone(state);if(s.mode==='free')return s;
 const size=chordWindow(s.stage);s.history=[...s.history,{interval:q.interval,correct}].slice(-size);
 if(s.complete||s.pending)return s;
 const covered=CHORD_STAGES[s.stage].every(id=>s.history.filter(row=>row.interval===id).length>=2);
 if(s.history.length===size&&covered&&s.history.filter(row=>row.correct).length/size>=.8){
 if(s.stage===11){s.complete=true;s.pending='complete';}
 else{s.stage++;s.history=[];s.pending=CHORD_STAGES[s.stage].at(-1);}
 }
 return s;
}
export function loadChords(storage){
 try{const s=JSON.parse(storage.getItem(CHORD_KEY));
 if(!s||s.version!==1||!Number.isInteger(s.stage)||s.stage<0||s.stage>11||!['guided','free'].includes(s.mode)||!Array.isArray(s.selected)||!s.selected.length||s.selected.some(id=>!Number.isInteger(id)||!CHORDS[id])||!Array.isArray(s.history)||s.history.some(row=>!CHORDS[row.interval]||typeof row.correct!=='boolean')||typeof s.complete!=='boolean'||!(s.pending===null||s.pending==='complete'||Number.isInteger(s.pending)&&CHORDS[s.pending]))return chordInitial();
 return {...chordInitial(),...s};}catch{return chordInitial();}
}
export const loadChordSession=storage=>loadSession(storage,CHORD_SESSION_KEY,13);
export function restoreChord(current,state){
 const q=current?.q;
 if(current?.mode!==state.mode||!q||!chordActive(state).includes(q.interval)||!Number.isInteger(q.root)||q.root<48||q.root>71||!Array.isArray(q.notes)||JSON.stringify(q.notes)!==JSON.stringify(CHORDS[q.interval].tones.map(n=>q.root+n))||!Number.isInteger(q.attempts)||q.attempts<0||typeof q.solved!=='boolean'||q.solved&&q.attempts<1)return null;
 return {...q};
}
