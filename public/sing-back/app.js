import {detectPitch,createTracker} from './pitch.js';

export function createPrototype(env=window){
 const doc=env.document,$=id=>doc.getElementById(id);
 const targets=[48,50,52,53,55,57,59,60],names={48:['C3','דו'],50:['D3','רה'],52:['E3','מי'],53:['F3','פה'],55:['G3','סול'],57:['A3','לה'],59:['B3','סי'],60:['C4','דו']};
 let target=48,context,stream,input,analyser,raf,micActive=false,pending=false,permissionId=0;
 let playing=false,blockedUntil=0,lastFrame=0,lastLabel='',successShown=false;
 const cache=new Map(),tracker=createTracker();
 const now=()=>env.performance.now();
 function audioContext(){const Audio=env.AudioContext||env.webkitAudioContext;if(!Audio)throw new Error('unsupported');context??=new Audio();return context;}
 function label(text){if(lastLabel!==text){$('feedback-label').textContent=text;lastLabel=text;}}
 function clearReading(text='מקשיב...'){$('needle').hidden=true;$('hold').style.width='0%';$('meter').setAttribute('aria-valuetext',text);$('hint').textContent=micActive?'שירו צליל יציב ונוח. גם אוקטבה אחרת מתאימה.':'כשתשירו, המחוון יראה לאן לכוון את הקול.';label(text);}
 function reset(){tracker.reset();successShown=false;$('success').hidden=true;clearReading(micActive?'מקשיב...':'הקשיבו לצליל ואז הפעילו את המיקרופון');}
 function paint(result){
 if(!result.reliable){clearReading();return;}
 const cents=result.cents,clamped=Math.max(-100,Math.min(100,cents));
 $('needle').hidden=false;$('needle').style.left=`${50+clamped/2}%`;
 $('meter').setAttribute('aria-valuenow',String(Math.round(clamped)));
 const state=Math.abs(cents)<=25?'מדויק — החזיקו את הצליל':cents>0?'גבוה מדי':'נמוך מדי';
 $('meter').setAttribute('aria-valuetext',state);label(state);
 $('hint').textContent=Math.abs(cents)<=25?'אתם באזור הנכון. הישארו על הצליל רגע.':cents>0?'נסו להוריד מעט את הקול.':'נסו להעלות מעט את הקול.';
 $('hold').style.width=`${result.progress*100}%`;
 if(result.success&&!successShown){successShown=true;$('success').hidden=false;}
 }
 function frame(time){
 if(!micActive)return;
 raf=env.requestAnimationFrame(frame);
 if(time-lastFrame<50)return;lastFrame=time;
 if(playing||time<blockedUntil){clearReading(playing?'הקשיבו לפסנתר…':'עוד רגע — תכף אפשר לשיר');return;}
 const data=new Float32Array(analyser.fftSize);analyser.getFloatTimeDomainData(data);
 paint(tracker.update(detectPitch(data,context.sampleRate),target,time));
 }
 function stopMic(){
 permissionId++;micActive=false;pending=false;
 if(raf!==undefined)env.cancelAnimationFrame(raf);
 input?.disconnect();input=null;analyser=null;
 stream?.getTracks().forEach(track=>track.stop());stream=null;
 $('mic').disabled=false;$('mic').textContent='♩ הפעלת מיקרופון';$('mic-state').textContent='המיקרופון כבוי';
 tracker.reset();clearReading('המיקרופון כבוי');
 }
 async function toggleMic(){
 if(micActive){stopMic();return;}
 if(pending)return;
 $('error').hidden=true;
 if(!env.isSecureContext||!env.navigator.mediaDevices?.getUserMedia){$('error').textContent='המיקרופון דורש פתיחה דרך קישור HTTPS בדפדפן תומך. פתחו את כתובת האבטיפוס באתר, ולא קובץ מקומי.';$('error').hidden=false;return;}
 pending=true;const request=++permissionId;$('mic').disabled=true;$('mic-state').textContent='ממתין לאישור שלכם…';
 try{
 const ctx=audioContext();await ctx.resume();
 const granted=await env.navigator.mediaDevices.getUserMedia({audio:{echoCancellation:true,noiseSuppression:false,autoGainControl:false},video:false});
 if(request!==permissionId){granted.getTracks().forEach(t=>t.stop());return;}
 stream=granted;input=ctx.createMediaStreamSource(stream);analyser=ctx.createAnalyser();analyser.fftSize=4096;input.connect(analyser);
 micActive=true;pending=false;lastFrame=0;reset();
 stream.getTracks().forEach(track=>{track.onended=()=>{if(micActive)stopMic();};});
 $('mic').disabled=false;$('mic').textContent='כיבוי מיקרופון';$('mic-state').textContent='המיקרופון פעיל';raf=env.requestAnimationFrame(frame);
 }catch(error){
 if(request!==permissionId)return;
 stopMic();$('error').textContent=error.name==='NotAllowedError'?'לא ניתנה הרשאה למיקרופון. אפשר לאפשר גישה דרך סמל ההרשאות ליד כתובת האתר ולנסות שוב.':error.name==='NotFoundError'?'לא נמצא מיקרופון. חברו מיקרופון ונסו שוב.':error.name==='NotReadableError'?'המיקרופון אינו זמין כרגע. בדקו שאפליקציה אחרת אינה משתמשת בו ונסו שוב.':'לא הצלחנו להפעיל את המיקרופון. נסו ב־Chrome או Safari מעודכן.';$('error').hidden=false;
 }
 }
 async function playTarget(){
 if(playing)return;
 playing=true;blockedUntil=Infinity;reset();$('error').hidden=true;
 ['play','next','retry'].forEach(id=>$(id).disabled=true);$('play').textContent='משמיע…';clearReading('הקשיבו לפסנתר…');
 const finish=()=>{playing=false;blockedUntil=now()+350;tracker.reset();['play','next','retry'].forEach(id=>$(id).disabled=false);$('play').textContent='▶ האזנה חוזרת';clearReading(micActive?'עוד רגע — תכף אפשר לשיר':'הפעילו מיקרופון ושירו את הצליל');};
 try{
 const ctx=audioContext();await ctx.resume();
 if(!cache.has(target)){const response=await env.fetch(`../audio/${target}.mp3`);if(!response.ok)throw new Error('audio');cache.set(target,await ctx.decodeAudioData(await response.arrayBuffer()));}
 const source=ctx.createBufferSource(),gain=ctx.createGain(),start=ctx.currentTime+.03;
 source.buffer=cache.get(target);source.connect(gain);gain.connect(ctx.destination);
 gain.gain.setValueAtTime(0,start);gain.gain.linearRampToValueAtTime(1,start+.015);gain.gain.setValueAtTime(1,start+.5);gain.gain.exponentialRampToValueAtTime(.35,start+.8);gain.gain.exponentialRampToValueAtTime(.0001,start+2.18);gain.gain.linearRampToValueAtTime(0,start+2.2);
 source.onended=finish;source.start(start);source.stop(start+2.2);
 }catch{finish();$('error').textContent='לא הצלחנו להשמיע את הפסנתר. בדקו את החיבור ונסו שוב.';$('error').hidden=false;}
 }
 $('mic').addEventListener('click',toggleMic);$('play').addEventListener('click',playTarget);
 $('retry').addEventListener('click',()=>{reset();if(micActive)blockedUntil=0;});
 $('next').addEventListener('click',()=>{const options=targets.filter(n=>n!==target);target=options[Math.floor(Math.random()*options.length)];$('target-name').textContent=names[target][0];$('target-hebrew').textContent=names[target][1];$('play').textContent='▶ האזנה לצליל';reset();});
 env.addEventListener('pagehide',()=>{stopMic();context?.close();context=undefined;});
 // No storage, microphone request or sound is started on page load.
 return {stop:stopMic};
}
if(typeof window!=='undefined'&&window.document?.getElementById('mic'))createPrototype(window);
