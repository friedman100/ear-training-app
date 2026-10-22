import {BASS_PATTERNS} from './bass.js';
import {BASS_GOAL,makeBassCourse} from './bass-course.js';
import {PROGRESSION_KEY,initialProgression,loadProgression} from './progression.js';
export const PROGRESSION_GUIDED_KEY='ear-training-chord-progression-guided-v1';
export const PROGRESSION_MODE_KEY='ear-training-chord-progression-mode-v1';
export const PROGRESSION_GOAL=BASS_GOAL;
export const newGuidedProgression=()=>({version:1,questions:makeBassCourse(),index:0,completed:0,practice:initialProgression()});
export function loadGuidedProgression(storage){
 try{
 const s=JSON.parse(storage.getItem(PROGRESSION_GUIDED_KEY));
 if(s?.version!==1||!Array.isArray(s.questions)||s.questions.length!==PROGRESSION_GOAL||s.questions.some(q=>!Number.isInteger(q?.patternIndex)||!BASS_PATTERNS[q.patternIndex]||!Number.isInteger(q.key)||q.key<0||q.key>11)||new Set(s.questions.map(q=>`${q.patternIndex}:${q.key}`)).size!==PROGRESSION_GOAL||!Number.isInteger(s.index)||s.index<0||s.index>=PROGRESSION_GOAL||!Number.isInteger(s.completed)||![s.index,s.index+1].includes(s.completed))return newGuidedProgression();
 const practice=loadProgression({getItem:key=>key===PROGRESSION_KEY?JSON.stringify(s.practice):null});
 if(JSON.stringify(practice)!==JSON.stringify(s.practice)||practice.stats.completed!==s.completed)return newGuidedProgression();
 if(practice.current&&JSON.stringify(practice.current.q)!==JSON.stringify(s.questions[s.index]))return newGuidedProgression();
 if((s.completed>s.index)!==!!practice.current?.completed)return newGuidedProgression();
 return {...s,practice};
 }catch{return newGuidedProgression();}
}
export function loadProgressionMode(storage){try{return storage.getItem(PROGRESSION_MODE_KEY)==='free'?'free':'guided';}catch{return 'guided';}}
