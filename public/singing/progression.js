export const PROGRESS_KEY='ear-training-singing-progress-v1';
export const NATURALS=[48,50,52,53,55,57,59,60];
export const CHROMATIC=Array.from({length:13},(_,i)=>48+i);
const black=CHROMATIC.filter(n=>!NATURALS.includes(n));
const shuffle=(items,random)=>{const result=[...items];for(let i=result.length-1;i>0;i--){const j=Math.floor(random()*(i+1));[result[i],result[j]]=[result[j],result[i]];}return result;};
export function newProgress(random=Math.random){
 // Use distinct pitch classes at the start; the second half always includes both colors.
 const first=shuffle(NATURALS.filter(n=>n!==60),random).slice(0,5);
 const blackCount=random()<.5?2:3;
 const mixed=shuffle([...shuffle(black,random).slice(0,blackCount),...shuffle(NATURALS.filter(n=>n!==first.at(-1)&&n!==60),random).slice(0,5-blackCount)],random);
 return {version:1,notes:[...first,...mixed],completed:0,index:0};
}
export function loadProgress(storage,random=Math.random){
 try{const p=JSON.parse(storage?.getItem(PROGRESS_KEY)||'null');
  if(p?.version===1&&Array.isArray(p.notes)&&p.notes.length===10&&p.notes.every(n=>Number.isInteger(n)&&CHROMATIC.includes(n))&&p.notes.slice(0,5).every(n=>NATURALS.includes(n))&&p.notes.slice(5).some(n=>NATURALS.includes(n))&&p.notes.slice(5).some(n=>black.includes(n))&&Number.isInteger(p.completed)&&p.completed>=0&&p.completed<=10&&Number.isInteger(p.index)&&p.index>=0&&p.index<10&&(p.completed===p.index||p.completed===p.index+1))return p;
 }catch{}
 return newProgress(random);
}
export const solved=p=>p.completed>p.index;
export function completeTarget(p,note){if(p.completed>=10||solved(p)||p.notes[p.index]!==note)return p;return {...p,completed:p.completed+1};}
export function nextTarget(p){if(!solved(p)||p.completed>=10)return p;return {...p,index:p.index+1};}
