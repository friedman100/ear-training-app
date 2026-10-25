// YIN-style normalized difference detection; waveform periodicity, not volume.
export function detectPitch(input,sampleRate){
 const step=sampleRate>32000?2:1,rate=sampleRate/step;
 const x=new Float32Array(Math.floor(input.length/step));let mean=0;
 for(let i=0;i<x.length;i++){x[i]=step===2?(input[2*i]+input[2*i+1])/2:input[i];mean+=x[i];}
 mean/=x.length;let energy=0;
 for(let i=0;i<x.length;i++){x[i]-=mean;energy+=x[i]*x[i];}
 const rms=Math.sqrt(energy/x.length);if(rms<.008)return null;
 const min=Math.floor(rate/1000),max=Math.min(Math.ceil(rate/65),Math.floor(x.length/2)-1);
 const size=x.length-max,diff=new Float32Array(max+1);let sum=0;
 for(let lag=1;lag<=max;lag++){
 let value=0;for(let i=0;i<size;i++){const delta=x[i]-x[i+lag];value+=delta*delta;}
 sum+=value;diff[lag]=sum?value*lag/sum:1;
 }
 let lag=-1;
 for(let i=Math.max(2,min);i<max;i++)if(diff[i]<.12){while(i+1<=max&&diff[i+1]<diff[i])i++;lag=i;break;}
 if(lag<0||diff[lag]>.12)return null;
 const a=diff[lag-1],b=diff[lag],c=diff[lag+1]??b;
 const denominator=a-2*b+c,offset=denominator?Math.max(-1,Math.min(1,(a-c)/(2*denominator))):0;
 const frequency=rate/(lag+offset);
 if(frequency<65||frequency>1000)return null;
 return {frequency,confidence:1-b,rms};
}
export function centsFromTarget(frequency,targetMidi){
 const midi=69+12*Math.log2(frequency/440);
 return ((midi-targetMidi+6)%12+12)%12*100-600;
}
export function createTracker({tolerance=40,holdMs=650}={}){
 let history=[],stableSince=null,lastTime=null,success=false;
 return {
 reset(){history=[];stableSince=null;lastTime=null;success=false;},
 update(detection,target,time){
 if(lastTime!==null&&time-lastTime>180){history=[];stableSince=null;}
 lastTime=time;
 if(!detection||detection.confidence<.88){history=[];stableSince=null;return {reliable:false,success,progress:0};}
 const raw=centsFromTarget(detection.frequency,target);
 history.push(raw);if(history.length>5)history.shift();
 if(history.length<3){stableSince=null;return {reliable:false,success,progress:0};}
 const sorted=[...history].sort((a,b)=>a-b),cents=sorted[Math.floor(sorted.length/2)];
 const accurate=Math.abs(cents)<=tolerance&&Math.abs(raw)<=tolerance;
 if(!accurate)stableSince=null;else if(stableSince===null)stableSince=time;
 const progress=stableSince===null?0:Math.min(1,(time-stableSince)/holdMs);
 if(progress>=1)success=true;
 return {reliable:true,cents,accurate,progress,success};
 }
 };
}
