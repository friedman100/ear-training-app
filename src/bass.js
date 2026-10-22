export const BASS_KEY='ear-training-bass-v1';
export const BASS_BEAT=1.6;
export const NOTE_NAMES=['דו','דו♯ / רה♭','רה','רה♯ / מי♭','מי','פה','פה♯ / סול♭','סול','סול♯ / לה♭','לה','לה♯ / סי♭','סי'];
export const LETTER_NAMES=['C','C♯ / D♭','D','D♯ / E♭','E','F','F♯ / G♭','G','G♯ / A♭','A','A♯ / B♭','B'];
// Common major/minor progressions, transposed through all twelve keys.
// Minor descent uses the major V from harmonic minor. Append entries to preserve saved indices.
export const BASS_PATTERNS=[
 {id:'pop-major',degrees:[0,7,9,5],qualities:['major','major','minor','major']},
 {id:'pop-minor',degrees:[9,5,0,7],qualities:['minor','major','major','major']},
 {id:'cadence',degrees:[0,5,7,0],qualities:['major','major','major','major']},
 {id:'turnaround',degrees:[0,9,2,7],qualities:['major','minor','minor','major']},
 {id:'third-degree',degrees:[0,4,9,7],qualities:['major','minor','minor','major']},
 {id:'minor-descent',degrees:[9,7,5,4],qualities:['minor','major','major','major']}
];
export const pc=midi=>((midi%12)+12)%12;
export const noteName=midi=>NOTE_NAMES[pc(midi)];
export const keyboardNotes=()=>Array.from({length:24},(_,i)=>36+i);
export function makeBassQuestion(rng=Math.random,previous=null){
 let patternIndex=Math.floor(rng()*BASS_PATTERNS.length),key=Math.floor(rng()*12);
 if(previous?.patternIndex===patternIndex&&previous.key===key)key=(key+1)%12;
 return {patternIndex,key};
}
export function bassChords(q){
 const pattern=BASS_PATTERNS[q.patternIndex];
 return pattern.degrees.map((degree,i)=>{
 const root=pc(q.key+degree),bass=36+root,quality=pattern.qualities[i];
 return {bass,quality,notes:[48+root,48+root+(quality==='major'?4:3),48+root+7]};
 });
}
export function bassPlan(q,bassOnly=false){
 return bassChords(q).flatMap((chord,i)=>[
 {midi:chord.bass,offset:i*BASS_BEAT,level:.75},
 ...(!bassOnly?chord.notes.map(midi=>({midi,offset:i*BASS_BEAT,level:.32})):[])
 ]);
}
export const bassAnswerPlan=answer=>answer.map((midi,i)=>({midi,offset:i*BASS_BEAT,level:.75}));
export function checkBass(q,answer){
 if(answer.length!==4||answer.some(n=>!Number.isInteger(n)||n<36||n>59))throw Error('Complete four notes');
 const matches=bassChords(q).map((chord,i)=>pc(chord.bass)===pc(answer[i]));
 return {matches,count:matches.filter(Boolean).length};
}
export const initialBass=()=>({version:1,current:null,stats:{completed:0,first:0,assisted:0,last:null}});
export const newBassRound=q=>({q,answer:[null,null,null,null],active:0,attempts:0,result:null,firstSuccess:false,usedBassOnly:false,revealed:false,recorded:false});
export function submitBass(state){
 const s=structuredClone(state),round=s.current;
 round.result=checkBass(round.q,round.answer);round.attempts++;
 if(round.attempts===1)round.firstSuccess=round.result.count===4;
 return s;
}
// A round enters cumulative statistics once, when the learner leaves it after checking.
export function finishBass(state){
 const s=structuredClone(state),round=s.current;
 if(!round?.attempts||round.recorded)return s;
 round.recorded=true;s.stats.completed++;s.stats.first+=Number(round.firstSuccess);s.stats.assisted+=Number(round.usedBassOnly);
 s.stats.last={correct:round.result.count,firstSuccess:round.firstSuccess,usedBassOnly:round.usedBassOnly,revealed:round.revealed};
 return s;
}
export function loadBass(storage){
 try{
 const s=JSON.parse(storage.getItem(BASS_KEY)),r=s?.current;
 if(s?.version!==1||!s.stats||!['completed','first','assisted'].every(k=>Number.isInteger(s.stats[k])&&s.stats[k]>=0)||s.stats.first>s.stats.completed||s.stats.assisted>s.stats.completed) return initialBass();
 if(s.stats.last!==null&&(!s.stats.last||!Number.isInteger(s.stats.last.correct)||s.stats.last.correct<0||s.stats.last.correct>4||!['firstSuccess','usedBassOnly','revealed'].every(k=>typeof s.stats.last[k]==='boolean')))return initialBass();
 if(r){
 if(!Number.isInteger(r.q?.patternIndex)||!BASS_PATTERNS[r.q.patternIndex]||!Number.isInteger(r.q.key)||r.q.key<0||r.q.key>11||!Array.isArray(r.answer)||r.answer.length!==4||r.answer.some(n=>n!==null&&(!Number.isInteger(n)||n<36||n>59))||!Number.isInteger(r.active)||r.active<0||r.active>3||!Number.isInteger(r.attempts)||r.attempts<0||!['firstSuccess','usedBassOnly','revealed','recorded'].every(k=>typeof r[k]==='boolean'))return initialBass();
 if(r.result){const expected=checkBass(r.q,r.answer);if(JSON.stringify(r.result)!==JSON.stringify(expected)||r.attempts===0)return initialBass();}
 if(!r.attempts&&(r.result||r.revealed||r.recorded||r.firstSuccess))return initialBass();
 }
 return s;
 }catch{return initialBass();}
}
