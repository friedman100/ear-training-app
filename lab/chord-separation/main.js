import {detectPitch} from '../../public/sing-back/pitch.js';
import {playReferenceSequence,stop} from '../../src/audio.js';
import {name} from '../harmonic-separation/logic.js';
import {QUALITIES,newChord,createChordAttempt} from './logic.js';
const $=id=>document.getElementById(id),attempt=createChordAttempt(),positions=['הנמוך','האמצעי','הגבוה'];
let chord,heard=false,mic=false,pending=false,permission=0,context,stream,input,analyser,raf,lastFrame=0,playing=false,blocked=0,playId=0;
function reading(text='מקשיב…'){$('feedback').textContent=text;$('needle').hidden=true;$('hold').style.width='0%';$('note').textContent='—';$('meter').setAttribute('aria-valuenow','0');}
function draw(){
 $('gauge-target').textContent=attempt.complete?'כל הכבוד! שרתם את שלושת הצלילים':`עכשיו שרים את הצליל ${positions[attempt.index]}`;
 $('chord-name').textContent=`${name(chord.notes[0])} · ${QUALITIES[chord.type].label}`;
 $('chord-steps').innerHTML=chord.notes.map((n,i)=>`<li class="${i<attempt.index||i===attempt.index&&attempt.matched?'done':i===attempt.index?'active':''}" ${i===attempt.index?'aria-current="step"':''}><span>${i+1}. ${positions[i]}</span><strong>${name(n)}</strong>${i<attempt.index||i===attempt.index&&attempt.matched?'✓':''}</li>`).join('');
}
function closeDialog(){if($('matched-dialog').open)$('matched-dialog').close();}
function cancelAudio(){playId++;stop();playing=false;blocked=0;attempt.clearReading();$('play-state').textContent=heard?'מוכנים לשיר':'הקשיבו לאקורד לפני השירה';}
function choose(){cancelAudio();closeDialog();chord=newChord($('range').value,$('quality').value,chord?.notes[0]);heard=false;attempt.reset();reading('הקשיבו לאקורד לפני השירה');draw();}
async function play(kind){
 cancelAudio();closeDialog();const id=playId;playing=true;blocked=Infinity;reading('הקשיבו לפסנתר…');$('error').textContent='';$('play-state').textContent='מנגן — זיהוי השירה מושהה';
 const notes=kind==='single'?[chord.notes[attempt.index]]:chord.notes;
 try{await playReferenceSequence(notes.map((midi,i)=>({midi,offset:kind==='broken'?i*1.5:0,duration:2,release:.5,level:notes.length===3&&kind==='together'?.38:.65})));if(id===playId)heard=true;}
 catch{if(id===playId)$('error').textContent='לא ניתן להשמיע פסנתר. בדקו חיבור ונסו שוב.';}
 finally{if(id===playId){playing=false;blocked=performance.now()+450;attempt.clearReading();$('play-state').textContent='הצליל דועך — עוד רגע שרים';}}
}
function success(){draw();$('feedback').textContent='✓ שרתם נכון את הצליל '+positions[attempt.index];$('matched-title').textContent=attempt.complete?'מעולה! שרתם את כל האקורד':'כל הכבוד! שרתם נכון';$('matched-detail').textContent=attempt.complete?'הצלחתם לשיר את שלושת הצלילים, מהנמוך לגבוה.':`עכשיו שרים את הצליל ${positions[attempt.index+1]}.`;$('matched-next').textContent=attempt.complete?'לאקורד הבא ←':`לצליל ${positions[attempt.index+1]} ←`;$('matched-dialog').showModal();$('matched-next').focus();}
function tick(time){
 if(!mic)return;raf=requestAnimationFrame(tick);if(time-lastFrame<50)return;lastFrame=time;
 if($('matched-dialog').open||attempt.matched)return;
 if(playing||time<blocked){attempt.clearReading();return;}
 if(!heard){attempt.clearReading();reading('הקשיבו לאקורד לפני השירה');return;}
 $('play-state').textContent='מקשיב לשירה';const data=new Float32Array(analyser.fftSize);analyser.getFloatTimeDomainData(data);
 const detection=detectPitch(data,context.sampleRate),r=attempt.update(detection,chord.notes,time);
 if(!r?.reliable){reading();return;}
 $('needle').hidden=false;$('needle').style.left=`${50+Math.max(-100,Math.min(100,r.cents))/2}%`;$('hold').style.width=`${r.progress*100}%`;$('meter').setAttribute('aria-valuenow',String(Math.round(Math.max(-100,Math.min(100,r.cents)))));
 $('feedback').textContent=r.accurate?'מדויק — החזיקו את הצליל':r.cents>0?'גבוה מדי — רדו מעט בגובה הצליל':'נמוך מדי — עלו מעט בגובה הצליל';$('note').textContent=name(69+12*Math.log2(detection.frequency/440));if(attempt.matched)success();
}
function stopMic(){permission++;pending=false;mic=false;cancelAnimationFrame(raf);input?.disconnect();stream?.getTracks().forEach(t=>t.stop());stream=input=analyser=null;context?.close();context=null;attempt.clearReading();$('mic').disabled=false;$('mic').textContent='הפעלת מיקרופון';$('mic-state').textContent='המיקרופון כבוי';if(!attempt.matched)reading('המיקרופון כבוי');}
$('mic').onclick=async()=>{
 if(mic){stopMic();return;}if(pending)return;$('error').textContent='';
 if(!isSecureContext||!navigator.mediaDevices?.getUserMedia){$('error').textContent='המיקרופון דורש HTTPS או localhost בדפדפן תומך.';return;}
 const id=++permission;pending=true;$('mic').disabled=true;$('mic-state').textContent='ממתין לאישור שלכם';
 try{context=new(window.AudioContext||window.webkitAudioContext)();await context.resume();const granted=await navigator.mediaDevices.getUserMedia({audio:{echoCancellation:true,noiseSuppression:false,autoGainControl:false},video:false});if(id!==permission){granted.getTracks().forEach(t=>t.stop());return;}stream=granted;input=context.createMediaStreamSource(stream);analyser=context.createAnalyser();analyser.fftSize=4096;input.connect(analyser);mic=true;pending=false;lastFrame=0;attempt.clearReading();$('mic').disabled=false;$('mic').textContent='כיבוי מיקרופון';$('mic-state').textContent='המיקרופון פעיל';stream.getTracks().forEach(t=>t.onended=()=>{if(mic)stopMic();});raf=requestAnimationFrame(tick);}
 catch(e){stopMic();$('error').textContent=e.name==='NotAllowedError'?'לא ניתנה הרשאת מיקרופון. אפשר לשנות הרשאות ליד כתובת האתר ולנסות שוב.':'לא ניתן להפעיל את המיקרופון. בדקו חיבור ונסו שוב.';}
};
$('matched-next').onclick=()=>{closeDialog();if(attempt.complete)choose();else{attempt.advance();reading();draw();}};
$('matched-dialog').addEventListener('cancel',e=>{e.preventDefault();$('matched-next').click();});
for(const kind of ['together','single','broken'])$(kind).onclick=()=>play(kind);
$('stop-audio').onclick=()=>{cancelAudio();reading();};$('new').onclick=choose;
$('retry').onclick=()=>{cancelAudio();closeDialog();attempt.reset();reading();draw();};
for(const key of ['range','quality'])$(key).onchange=choose;
addEventListener('pagehide',()=>{cancelAudio();stopMic();});choose();
