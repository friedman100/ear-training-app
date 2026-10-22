import {BASS_PATTERNS,initialBass,loadBass,BASS_KEY} from './bass.js';
export const BASS_GUIDED_KEY='ear-training-bass-guided-v1';
export const BASS_MODE_KEY='ear-training-bass-mode-v1';
export const BASS_GOAL=10;
const validQuestion=q=>Number.isInteger(q?.patternIndex)&&q.patternIndex>=0&&q.patternIndex<BASS_PATTERNS.length&&Number.isInteger(q.key)&&q.key>=0&&q.key<12;
// Balance the six patterns and use ten different transpositions, without repeated combinations.
export function makeBassCourse(rng=Math.random){
 const questions=[],counts=BASS_PATTERNS.map(()=>0),keys=Array.from({length:12},(_,i)=>i);
 for(let i=0;i<BASS_GOAL;i++){
 const minimum=Math.min(...counts),patterns=counts.flatMap((count,index)=>count===minimum?[index]:[]);
 const patternIndex=patterns[Math.floor(rng()*patterns.length)],key=keys.splice(Math.floor(rng()*keys.length),1)[0];
 questions.push({patternIndex,key});counts[patternIndex]++;
 }
 return questions;
}
export const newGuidedBass=()=>({version:1,questions:makeBassCourse(),index:0,completed:0,practice:initialBass()});
export function loadGuidedBass(storage){
 try{
 const s=JSON.parse(storage.getItem(BASS_GUIDED_KEY));
 if(s?.version!==1||!Array.isArray(s.questions)||s.questions.length!==BASS_GOAL||!s.questions.every(validQuestion)||new Set(s.questions.map(q=>`${q.patternIndex}:${q.key}`)).size!==BASS_GOAL||!Number.isInteger(s.index)||s.index<0||s.index>=BASS_GOAL||!Number.isInteger(s.completed)||![s.index,s.index+1].includes(s.completed))return newGuidedBass();
 const practice=loadBass({getItem:key=>key===BASS_KEY?JSON.stringify(s.practice):null});
 if(JSON.stringify(practice)!==JSON.stringify(s.practice))return newGuidedBass();
 if(practice.current&&JSON.stringify(practice.current.q)!==JSON.stringify(s.questions[s.index]))return newGuidedBass();
 if(s.completed>s.index&&practice.current?.result?.count!==4)return newGuidedBass();
 return {...s,practice};
 }catch{return newGuidedBass();}
}
export function loadBassMode(storage){try{return storage.getItem(BASS_MODE_KEY)==='free'?'free':'guided';}catch{return 'guided';}}
