export const NOTE_DURATION=.8;
export const NOTE_GAP=.05;
export const RELEASE_TAIL=.35;
export const PLAYBACK_DURATION_MS=Math.round((2*NOTE_DURATION+NOTE_GAP+RELEASE_TAIL+.05)*1000);
let context;
const buffers=new Map();
let sources=[];
let generation=0;
export function stop(){generation++;sources.forEach(s=>{try{s.stop();}catch{}});sources=[];}
export async function play(start,end,onPlaybackChange=()=>{}){
 stop();const request=generation;
 context??=new AudioContext();
 await context.resume();
 const notes=[start,end];
 await Promise.all(notes.map(async midi=>{
 if(buffers.has(midi))return;
 const url=window.PIANO_SAMPLES?.[midi] ? `data:audio/mpeg;base64,${window.PIANO_SAMPLES[midi]}` : `${import.meta.env.BASE_URL}audio/${midi}.mp3`;
 const response=await fetch(url);
 if(!response.ok)throw new Error('Audio unavailable');
 buffers.set(midi,await context.decodeAudioData(await response.arrayBuffer()));
 }));
 if(request!==generation)return;
 const time=context.currentTime+.03;
 notes.forEach((midi,i)=>{
 const source=context.createBufferSource(),gain=context.createGain(),t=time+i*(NOTE_DURATION+NOTE_GAP);
 source.buffer=buffers.get(midi);source.connect(gain);gain.connect(context.destination);
 // Preserve the recorded piano's natural decay; soften its attack and release.
 gain.gain.setValueAtTime(0,t);
 gain.gain.linearRampToValueAtTime(1,t+.015);
 gain.gain.setValueAtTime(1,t+NOTE_DURATION-.3);
 gain.gain.linearRampToValueAtTime(.18,t+NOTE_DURATION);
 gain.gain.linearRampToValueAtTime(0,t+NOTE_DURATION+RELEASE_TAIL);
 if(i===1)source.onended=()=>{if(request===generation)onPlaybackChange(false);};
 source.start(t);source.stop(t+NOTE_DURATION+RELEASE_TAIL);sources.push(source);
 });
 setTimeout(()=>{if(request===generation)onPlaybackChange(true);},30);
 await new Promise(resolve=>setTimeout(resolve,PLAYBACK_DURATION_MS));
}
