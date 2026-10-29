export const CONFIG={tolerance:40,holdMs:500,settleMs:450,confidence:.9};
export const RANGES={low:[48,60],middle:[60,72],high:[72,84]};
export const hz=midi=>440*2**((midi-69)/12);
export const midiFromHz=f=>69+12*Math.log2(f/440);
export const name=midi=>['C','C♯','D','E♭','E','F','F♯','G','A♭','A','B♭','B'][Math.round(midi)%12]+(Math.floor(Math.round(midi)/12)-1);
export function roots(range,interval){const [lo,hi]=RANGES[range];return Array.from({length:hi-lo-interval+1},(_,i)=>lo+i);}
export function newRoot(range,interval,previous,random=Math.random){const options=roots(range,interval).filter(n=>n!==previous);return options[Math.min(options.length-1,Math.floor(random()*options.length))];}
const distance=(midi,target)=>((midi-target+6)%12+12)%12*100-600;
export function createReading(){let history=[],since=null,last=null,key=null;return {reset(){history=[];since=null;last=null;key=null;},update(detection,low,high,time){
 if(!detection||detection.confidence<CONFIG.confidence||!Number.isFinite(detection.frequency)||detection.frequency<=0){this.reset();return null;}
 if(last!==null&&time-last>180)this.reset();last=time;
 const raw=midiFromHz(detection.frequency);history.push(raw);if(history.length>5)history.shift();if(history.length<3)return null;
 const measured=[...history].sort((a,b)=>a-b)[Math.floor(history.length/2)];
 const nearest=Math.abs(distance(measured,high))<Math.abs(distance(measured,low))?'high':'low',target=nearest==='high'?high:low;
 const accurate=Math.abs(distance(measured,target))<=CONFIG.tolerance&&Math.abs(distance(raw,target))<=CONFIG.tolerance;
 if(!accurate){since=null;key=null;}else if(key!==nearest){key=nearest;since=time;}
 return {midi:measured,frequency:hz(measured),confidence:detection.confidence,cents:distance(measured,target),nearest,accurate,exact:Math.abs((measured-target)*100)<=CONFIG.tolerance,stable:accurate&&time-since>=CONFIG.holdMs};
 }};}
