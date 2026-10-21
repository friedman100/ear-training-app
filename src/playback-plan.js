export const PLAYBACK_TYPES={ascending:'עלייה',descending:'ירידה',upDown:'עלייה ואז ירידה',harmonic:'הרמוני'};
export function playbackPlan(low,high,type='ascending',spacing=.85){
 if(!Object.hasOwn(PLAYBACK_TYPES,type))throw new Error('Unknown playback type');
 if(type==='harmonic')return [{midi:low,offset:0},{midi:high,offset:0}];
 const notes=type==='descending'?[high,low]:type==='upDown'?[low,high,high,low]:[low,high];
 return notes.map((midi,i)=>({midi,offset:i*spacing}));
}
