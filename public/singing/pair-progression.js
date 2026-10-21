export const PAIR_KEY='ear-training-singing-pairs-v1';
export function newPairProgress(random=Math.random){
 const roots=[48,50,53,55];
 for(let i=roots.length-1;i>0;i--){const j=Math.floor(random()*(i+1));[roots[i],roots[j]]=[roots[j],roots[i]];}
 return {version:1,questions:roots.map((root,i)=>({root,direction:i<2?'ascending':'descending'})),index:0,completed:0};
}
export function loadPairProgress(storage){
 try{const p=JSON.parse(storage?.getItem(PAIR_KEY)||'null');
 if(p?.version===1&&Array.isArray(p.questions)&&p.questions.length===4&&p.questions.every((q,i)=>Number.isInteger(q.root)&&q.root>=48&&q.root<=58&&q.direction===(i<2?'ascending':'descending'))&&Number.isInteger(p.index)&&p.index>=0&&p.index<4&&Number.isInteger(p.completed)&&p.completed>=0&&p.completed<=4&&(p.completed===p.index||p.completed===p.index+1))return p;
 }catch{}
 return newPairProgress();
}
export function completePair(p,question){const q=p.questions[p.index];if(p.completed===4||p.completed>p.index||q.root!==question.root||q.direction!==question.direction)return p;return {...p,completed:p.completed+1};}
export function nextPair(p){return p.completed>p.index&&p.completed<4?{...p,index:p.index+1}:p;}
