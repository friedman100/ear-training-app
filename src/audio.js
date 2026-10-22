import {playbackPlan} from './playback-plan.js';
export const NOTE_DURATION=.8;
export const NOTE_GAP=.05;
export const RELEASE_TAIL=1.4;
export const PLAYBACK_DURATION_MS=Math.round((2*NOTE_DURATION+NOTE_GAP+RELEASE_TAIL+.05)*1000);
let context;
const buffers=new Map();
let sources=[];
let generation=0;
export function stop(){generation++;sources.forEach(s=>{try{s.stop();}catch{}});sources=[];}
export async function play(start,end,onPlaybackChange=()=>{},onSecondNote=()=>{},type='ascending'){
 return playPlan(playbackPlan(start,end,type,NOTE_DURATION+NOTE_GAP),onPlaybackChange,onSecondNote,type==='harmonic'?.7:1);
}
export function chordPlan(notes,broken=false){return notes.map((midi,i)=>({midi,offset:broken?i*(NOTE_DURATION+NOTE_GAP):0}));}
export function playChord(notes,broken=false,onPlaybackChange=()=>{},onReady=()=>{}){
 return playPlan(chordPlan(notes,broken),onPlaybackChange,onReady,broken?1:1/Math.sqrt(notes.length));
}
export function playBassSequence(plan,onPlaybackChange=()=>{},onBeat=()=>{}){
 return playPlan(plan,onPlaybackChange,()=>{},1,{duration:1.3,release:.35,onBeat});
}
export function playSongSequence(plan,spacing,onPlaybackChange=()=>{}){
 return playPlan(plan,onPlaybackChange,()=>{},1,{duration:Math.max(.4,spacing-.3),release:.35});
}
async function playPlan(plan,onPlaybackChange,onReady,level,{duration=NOTE_DURATION,release=RELEASE_TAIL,onBeat}={}){
 stop();const request=generation;
 context??=new AudioContext();
 await context.resume();
 const sampleMidi=midi=>midi<48?midi+12:midi;
 const notes=[...new Set(plan.map(note=>sampleMidi(note.midi)))];
 await Promise.all(notes.map(async midi=>{
 if(buffers.has(midi))return;
 const url=window.PIANO_SAMPLES?.[midi] ? `data:audio/mpeg;base64,${window.PIANO_SAMPLES[midi]}` : `${import.meta.env.BASE_URL}audio/${midi}.mp3`;
 const response=await fetch(url);
 if(!response.ok)throw new Error('Audio unavailable');
 buffers.set(midi,await context.decodeAudioData(await response.arrayBuffer()));
 }));
 if(request!==generation)return;
 const time=context.currentTime+.03;
 plan.forEach(({midi,offset},i)=>{
 const source=context.createBufferSource(),gain=context.createGain(),t=time+offset;
 source.buffer=buffers.get(sampleMidi(midi));
 if(midi<48)source.playbackRate.value=.5;
 const noteLevel=plan[i].level??level;
 source.connect(gain);gain.connect(context.destination);
 // Preserve the recorded piano's natural decay; soften its attack and release.
 gain.gain.setValueAtTime(0,t);
 gain.gain.linearRampToValueAtTime(noteLevel,t+.015);
 gain.gain.setValueAtTime(noteLevel,t+duration-.3);
 // Exponential release falls to -80 dB before the final silent stop.
 gain.gain.exponentialRampToValueAtTime(.35*noteLevel,t+duration);
 gain.gain.exponentialRampToValueAtTime(.0001*noteLevel,t+duration+release-.02);
 gain.gain.linearRampToValueAtTime(0,t+duration+release);
 if(i===plan.length-1)source.onended=()=>{if(request===generation)onPlaybackChange(false);};
 source.start(t);source.stop(t+duration+release);sources.push(source);
 });
 if(onBeat)[...new Set(plan.map(note=>note.offset))].forEach((offset,i)=>setTimeout(()=>{if(request===generation)onBeat(i);},Math.round((.03+offset)*1000)));
 setTimeout(()=>{if(request===generation)onPlaybackChange(true);},30);
 setTimeout(()=>{if(request===generation)onReady();},Math.round((.03+(plan[1]?.offset??0))*1000));
 await new Promise(resolve=>setTimeout(resolve,Math.round((plan.at(-1).offset+duration+release+.05)*1000)));
}
