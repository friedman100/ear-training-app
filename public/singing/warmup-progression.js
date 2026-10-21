export const WARMUP_KEY='ear-training-singing-warmups-v1';
export function loadWarmupProgress(storage){
 try{const p=JSON.parse(storage?.getItem(WARMUP_KEY)||'null');if(p?.version===1&&Number.isInteger(p.completed)&&p.completed>=0&&p.completed<=5&&Number.isInteger(p.current)&&p.current>=0&&p.current<5&&p.current<=p.completed)return p;}catch{}
 return {version:1,completed:0,current:0};
}
export const canOpenWarmup=(p,index)=>Number.isInteger(index)&&index>=0&&index<5&&index<=p.completed;
export function completeWarmup(p){return p.current===p.completed&&p.completed<5?{...p,completed:p.completed+1}:p;}
