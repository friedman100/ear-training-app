import {createTracker,centsFromTarget} from '../../public/sing-back/pitch.js';
export const CONFIG={tolerance:40,holdMs:500,settleMs:450,confidence:.9};
export const RANGES={low:[48,60],middle:[60,72],high:[72,84]};
export const hz=midi=>440*2**((midi-69)/12);
export const midiFromHz=f=>69+12*Math.log2(f/440);
export const name=midi=>['C','C♯','D','E♭','E','F','F♯','G','A♭','A','B♭','B'][Math.round(midi)%12]+(Math.floor(Math.round(midi)/12)-1);
export function roots(range,interval){const [lo,hi]=RANGES[range];return Array.from({length:hi-lo-interval+1},(_,i)=>lo+i);}
export function newRoot(range,interval,previous,random=Math.random){const options=roots(range,interval).filter(n=>n!==previous);return options[Math.min(options.length-1,Math.floor(random()*options.length))];}
export function createReading(){const trackers={low:createTracker({tolerance:CONFIG.tolerance,holdMs:CONFIG.holdMs}),high:createTracker({tolerance:CONFIG.tolerance,holdMs:CONFIG.holdMs})};return {reset(){Object.values(trackers).forEach(t=>t.reset());},update(detection,low,high,time,focus=null){
 if(!detection||!Number.isFinite(detection.frequency)||detection.frequency<=0){this.reset();return null;}
 const results={low:trackers.low.update(detection,low,time),high:trackers.high.update(detection,high,time)};
 const nearest=focus??(Math.abs(centsFromTarget(detection.frequency,high))<Math.abs(centsFromTarget(detection.frequency,low))?'high':'low'),result=results[nearest];if(!result.reliable)return null;
 const measured=midiFromHz(detection.frequency),target=nearest==='high'?high:low;
 return {midi:measured,frequency:detection.frequency,confidence:detection.confidence,cents:result.cents,nearest,accurate:result.accurate,exact:Math.abs((measured-target)*100)<=CONFIG.tolerance,stable:result.success&&result.accurate,progress:result.progress};
 }};}
