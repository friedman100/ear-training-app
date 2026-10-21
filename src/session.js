export const SESSION_KEY='ear-training-session-v1';
export const newSession=()=>({version:1,total:0,correct:0,streak:0,best:0,intervals:{},unlocked:[],ended:false,current:null});
export function completeQuestion(session,q){
 if(!q.solved)return session;
 const s=structuredClone(session),first=q.attempts===1;
 s.total++;s.correct+=Number(first);s.streak=first?s.streak+1:0;s.best=Math.max(s.best,s.streak);
 const row=s.intervals[q.interval]??={total:0,correct:0};row.total++;row.correct+=Number(first);
 return s;
}
export function noteUnlocks(session,ids){
 return {...session,unlocked:[...new Set([...session.unlocked,...ids])]};
}
export function loadSession(storage,key=SESSION_KEY,maxId=12){
 try{
 const s=JSON.parse(storage.getItem(key));
 if(!s||s.version!==1||typeof s.ended!=='boolean'||!['total','correct','streak','best'].every(k=>Number.isInteger(s[k])&&s[k]>=0)||s.correct>s.total||s.streak>s.best||s.best>s.correct||!s.intervals||typeof s.intervals!=='object'||Array.isArray(s.intervals)||!Array.isArray(s.unlocked)||s.unlocked.some(id=>!Number.isInteger(id)||id<1||id>maxId))return newSession();
 let total=0,correct=0;
 for(const [id,row] of Object.entries(s.intervals)){
 if(!Number.isInteger(+id)||+id<1||+id>maxId||!Number.isInteger(row?.total)||row.total<1||!Number.isInteger(row.correct)||row.correct<0||row.correct>row.total)return newSession();
 total+=row.total;correct+=row.correct;
 }
 if(total!==s.total||correct!==s.correct)return newSession();
 return s;
 }catch{return newSession();}
}
export function restoreQuestion(current,active,range,mode,bounds){
 const q=current?.q;
 if(current?.mode!==mode||current?.range!==range||!q||!active.includes(q.interval)||!Number.isInteger(q.start)||!Number.isInteger(q.end)||q.start<bounds[0]||q.end>bounds[1]||q.end-q.start!==q.interval||!Number.isInteger(q.attempts)||q.attempts<0||typeof q.solved!=='boolean'||q.solved&&q.attempts<1)return null;
 return {...q};
}
