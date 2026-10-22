import {BASS_PATTERNS,bassChords,bassPlan,checkBass,makeBassQuestion,newBassRound} from './bass.js';
export const PROGRESSION_KEY='ear-training-chord-progression-v1';
export const newProgressionRound=q=>({...newBassRound(q),stage:'bass',qualities:[null,null,null,null],qualityAttempts:0,qualityResult:null,qualityFirst:false,completed:false});
export const initialProgression=()=>({version:1,current:null,stats:{completed:0,bassFirst:0,qualityFirst:0,assisted:0}});
export function checkQualities(q,qualities){
 if(qualities.length!==4||qualities.some(v=>!['major','minor'].includes(v)))throw Error('Choose four qualities');
 const matches=bassChords(q).map((chord,i)=>chord.quality===qualities[i]);return {matches,count:matches.filter(Boolean).length};
}
export function submitProgressionBass(state){
 const s=structuredClone(state),r=s.current;if(r.stage!=='bass')return state;
 r.result=checkBass(r.q,r.answer);r.attempts++;if(r.attempts===1)r.firstSuccess=r.result.count===4;
 if(r.result.count===4)r.stage='qualities';return s;
}
export function submitProgressionQualities(state){
 const s=structuredClone(state),r=s.current;if(r.stage!=='qualities'||r.completed)return state;
 r.qualityResult=checkQualities(r.q,r.qualities);r.qualityAttempts++;if(r.qualityAttempts===1)r.qualityFirst=r.qualityResult.count===4;
 if(r.qualityResult.count===4){r.completed=true;s.stats.completed++;s.stats.bassFirst+=Number(r.firstSuccess);s.stats.qualityFirst+=Number(r.qualityFirst);s.stats.assisted+=Number(r.usedBassOnly);}
 return s;
}
export function progressionPlan(q,qualities=null,index=null){
 let plan;
 if(!qualities)plan=bassPlan(q);
 else{
 if(qualities.length!==4||qualities.some(v=>!['major','minor'].includes(v)))throw Error('Choose four qualities');
 plan=bassPlan(q).map((event,i)=>i%4===2?{...event,midi:bassChords(q)[Math.floor(i/4)].notes[0]+(qualities[Math.floor(i/4)]==='major'?4:3)}:event);
 }
 if(index===null)return plan;
 if(!Number.isInteger(index)||index<0||index>3)throw Error('Invalid chord index');
 const offset=plan[index*4].offset;return plan.slice(index*4,index*4+4).map(event=>({...event,offset:event.offset-offset}));
}
export function nextProgression(previous=null){return newProgressionRound(makeBassQuestion(Math.random,previous));}
export function loadProgression(storage){
 try{
 const s=JSON.parse(storage.getItem(PROGRESSION_KEY)),r=s?.current;
 if(s?.version!==1||!s.stats||!['completed','bassFirst','qualityFirst','assisted'].every(k=>Number.isInteger(s.stats[k])&&s.stats[k]>=0)||['bassFirst','qualityFirst','assisted'].some(k=>s.stats[k]>s.stats.completed))return initialProgression();
 if(r){
 if(!Number.isInteger(r.q?.patternIndex)||!BASS_PATTERNS[r.q.patternIndex]||!Number.isInteger(r.q.key)||r.q.key<0||r.q.key>11||!['bass','qualities'].includes(r.stage)||!Array.isArray(r.answer)||r.answer.length!==4||r.answer.some(n=>n!==null&&(!Number.isInteger(n)||n<36||n>59))||!Number.isInteger(r.active)||r.active<0||r.active>3||!Number.isInteger(r.attempts)||r.attempts<0||!Number.isInteger(r.qualityAttempts)||r.qualityAttempts<0||!['firstSuccess','usedBassOnly','qualityFirst','completed'].every(k=>typeof r[k]==='boolean')||!Array.isArray(r.qualities)||r.qualities.length!==4||r.qualities.some(v=>v!==null&&!['major','minor'].includes(v)))return initialProgression();
 if(r.result&&JSON.stringify(r.result)!==JSON.stringify(checkBass(r.q,r.answer)))return initialProgression();
 if(r.stage==='qualities'&&(!r.attempts||r.result?.count!==4))return initialProgression();
 if(r.qualityResult&&(!r.qualityAttempts||JSON.stringify(r.qualityResult)!==JSON.stringify(checkQualities(r.q,r.qualities))))return initialProgression();
 if(r.stage==='bass'&&(r.qualityAttempts||r.qualityResult||r.completed||r.qualities.some(v=>v!==null)))return initialProgression();
 if(r.completed&&(r.stage!=='qualities'||r.qualityResult?.count!==4||s.stats.completed<1))return initialProgression();
 }
 return s;
 }catch{return initialProgression();}
}
