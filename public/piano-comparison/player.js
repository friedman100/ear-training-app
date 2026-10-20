export const DURATION=.8;
export const GAP=.05;
let context;
const cache=new Map();
export async function playComparison(bank,root,interval,onPlaying=()=>{}){
 context??=new AudioContext();await context.resume();
 const midi=[root,root+interval];
 // Prepare both sources before each comparison so loading cannot bias timing.
 await Promise.all(['current','salamander'].flatMap(b=>midi.map(async n=>{
 const key=`${b}-${n}`;if(cache.has(key))return;
 const url=window.PIANO_COMPARISON?.[key]?`data:audio/mpeg;base64,${window.PIANO_COMPARISON[key]}`:`./${key}.mp3`;
 const response=await fetch(url);if(!response.ok)throw new Error('Audio unavailable');
 cache.set(key,await context.decodeAudioData(await response.arrayBuffer()));
 })));
 const when=context.currentTime+.03;
 let finished=false;
 await new Promise(resolve=>{
 midi.forEach((n,i)=>{
 const source=context.createBufferSource();source.buffer=cache.get(`${bank}-${n}`);source.connect(context.destination);
 if(i===1)source.onended=()=>{finished=true;onPlaying(false);resolve();};
 source.start(when+i*(DURATION+GAP));source.stop(when+i*(DURATION+GAP)+DURATION);
 });
 setTimeout(()=>{if(!finished)onPlaying(true);},30);
 });
}
const root=document.querySelector('#register'),interval=document.querySelector('#interval');
const status=document.querySelector('#status');
let busy=false;
function showNotes(){
 const names={48:'C3',51:'E♭3',52:'E3',53:'F3',55:'G3',60:'C4',63:'E♭4',64:'E4',65:'F4',67:'G4',72:'C5',75:'E♭5',76:'E5',77:'F5',79:'G5',84:'C6'};
 document.querySelector('#notes').textContent=`${names[+root.value]} → ${names[+root.value + +interval.value]}`;
}
root.addEventListener('change',showNotes);interval.addEventListener('change',showNotes);showNotes();
document.querySelectorAll('[data-bank]').forEach(button=>button.addEventListener('click',async()=>{
 if(busy)return;busy=true;
 const controls=[...document.querySelectorAll('button,select')];controls.forEach(c=>c.disabled=true);
 const label=button.dataset.bank==='current'?'הפסנתר הנוכחי':'Salamander';
 status.textContent='מכין את שני הפסנתרים להשוואה…';
 try{
 await playComparison(button.dataset.bank,+root.value,+interval.value,playing=>{
 button.classList.toggle('playing',playing);status.textContent=playing?`מנגן: ${label}`:'אפשר להאזין שוב או להשוות לפסנתר השני.';
 });
 }catch{status.textContent='לא הצלחנו להשמיע. נסו שוב בדפדפן Chrome או Edge.';}
 finally{busy=false;controls.forEach(c=>c.disabled=false);button.classList.remove('playing');}
}));
