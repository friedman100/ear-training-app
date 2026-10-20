export const NOTE_DURATION=.6;
export const NOTE_GAP=.05;
let context;
const buffers=new Map();
let sources=[];
export function stop(){sources.forEach(s=>{try{s.stop();}catch{}});sources=[];}
export async function play(start,end){
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
 stop();
 const time=context.currentTime+.03;
 notes.forEach((midi,i)=>{
 const source=context.createBufferSource(),gain=context.createGain(),t=time+i*(NOTE_DURATION+NOTE_GAP);
 source.buffer=buffers.get(midi);source.connect(gain);gain.connect(context.destination);
 gain.gain.setValueAtTime(.8,t);gain.gain.setValueAtTime(.8,t+NOTE_DURATION-.025);gain.gain.linearRampToValueAtTime(0,t+NOTE_DURATION);
 source.start(t);source.stop(t+NOTE_DURATION);sources.push(source);
 });
 await new Promise(resolve=>setTimeout(resolve,1300));
}
