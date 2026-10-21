import {WARMUP_TIMING} from './timeline.js?v=warmup-hold400-v7';
import {createTimedPair} from './timed-pair.js?v=warmup-hold400-v7';
import {detectPitch,createTracker} from './pitch.js?v=warmup-hold400-v7';

export function createPrototype(env=window,{prefix='',pair=false,onMicStart=()=>{}}={}){
 const doc=env.document,$=id=>doc.getElementById(prefix+id);
 const targets=Array.from({length:pair?11:13},(_,i)=>48+i);
 const letters=['C','C♯ / D♭','D','D♯ / E♭','E','F','F♯ / G♭','G','G♯ / A♭','A','A♯ / B♭','B'];
 const hebrew=['דו','דו דיאז / רה במול','רה','רה דיאז / מי במול','מי','פה','פה דיאז / סול במול','סול','סול דיאז / לה במול','לה','לה דיאז / סי במול','סי'];
 const name=n=>[letters[n%12].split(' / ').map(letter=>letter+(Math.floor(n/12)-1)).join(' / '),hebrew[n%12]];
 let step=0,direction='ascending';
 const sequence=()=>!pair?[target]:direction==='ascending'?[target,target+2]:[target+2,target];
 const current=()=>sequence()[step];

 let target=48,context,stream,input,analyser,raf,micActive=false,pending=false,permissionId=0;
 let playing=false,blockedUntil=0,lastFrame=0,lastLabel='',successShown=false;
 const cache=new Map(),tracker=createTracker();
 const now=()=>env.performance.now();
 function audioContext(){const Audio=env.AudioContext||env.webkitAudioContext;if(!Audio)throw new Error('unsupported');context??=new Audio();return context;}
 function label(text){if(lastLabel!==text){$('feedback-label').textContent=text;lastLabel=text;}}
 function clearReading(text='מקשיב...'){$('needle').hidden=true;$('hold').style.width='0%';$('meter').setAttribute('aria-valuetext',text);$('hint').textContent=micActive?'שירו צליל יציב ונוח. גם אוקטבה אחרת מתאימה.':'כשתשירו, המחוון יראה לאן לכוון את הקול.';label(text);}
 function showTarget(){const n=current();$('target-name').textContent=name(n)[0];$('target-hebrew').textContent=name(n)[1];if(pair)$('steps').innerHTML=sequence().map((midi,i)=>`<div class="pair-note ${i<step?'done':i===step?'active':''}"><small>${i<step?'✓':'צליל '+(i+1)}</small><strong dir="ltr">${name(midi)[0]}</strong></div>`).join('');}
 function reset(){step=0;showTarget();tracker.reset();successShown=false;$('success').hidden=true;clearReading(micActive?'מקשיב...':'הקשיבו לצליל ואז הפעילו את המיקרופון');}
 function paint(result){
 if(!result.reliable){clearReading();return;}
 const cents=result.cents,clamped=Math.max(-100,Math.min(100,cents));
 $('needle').hidden=false;$('needle').style.left=`${50+clamped/2}%`;
 $('meter').setAttribute('aria-valuenow',String(Math.round(clamped)));
 const state=Math.abs(cents)<=25?'מדויק — החזיקו את הצליל':cents>0?'גבוה מדי':'נמוך מדי';
 $('meter').setAttribute('aria-valuetext',state);label(state);
 $('hint').textContent=Math.abs(cents)<=25?'אתם באזור הנכון. הישארו על הצליל רגע.':cents>0?'נסו להוריד מעט את הקול.':'נסו להעלות מעט את הקול.';
 $('hold').style.width=`${result.progress*100}%`;
 if(result.success&&!successShown){if(pair&&step===0){step=1;tracker.reset();showTarget();clearReading('מצוין! עכשיו שירו את הצליל השני');return;}successShown=true;$('success').hidden=false;if(pair){$('steps').querySelectorAll('.pair-note').forEach(n=>{n.classList.remove('active');n.classList.add('done');});}}
 }
 function frame(time){
 if(!micActive)return;
 raf=env.requestAnimationFrame(frame);
 if(time-lastFrame<50)return;lastFrame=time;
 if(playing||time<blockedUntil){clearReading(playing?'הקשיבו לפסנתר…':'עוד רגע — תכף אפשר לשיר');return;}
 const data=new Float32Array(analyser.fftSize);analyser.getFloatTimeDomainData(data);
 paint(tracker.update(detectPitch(data,context.sampleRate),current(),time));
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
 onMicStart();
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
 ['play','next','retry','target-select',...(pair?['direction']:[])].forEach(id=>$(id).disabled=true);$('play').textContent='משמיע…';clearReading('הקשיבו לפסנתר…');
 const finish=()=>{playing=false;blockedUntil=now()+350;tracker.reset();['play','next','retry','target-select',...(pair?['direction']:[])].forEach(id=>$(id).disabled=false);$('play').textContent='▶ האזנה חוזרת';clearReading(micActive?'עוד רגע — תכף אפשר לשיר':pair?'הפעילו מיקרופון ושירו את שני הצלילים':'הפעילו מיקרופון ושירו את הצליל');};
 try{
 const ctx=audioContext();await ctx.resume();
 const notes=sequence();
 await Promise.all(notes.map(async midi=>{if(cache.has(midi))return;const response=await env.fetch(`../audio/${midi}.mp3`);if(!response.ok)throw new Error('audio');cache.set(midi,await ctx.decodeAudioData(await response.arrayBuffer()));}));
 const start=ctx.currentTime+.03;
 notes.forEach((midi,i)=>{
 const source=ctx.createBufferSource(),gain=ctx.createGain(),at=start+i*.85;
 source.buffer=cache.get(midi);source.connect(gain);gain.connect(ctx.destination);
 gain.gain.setValueAtTime(0,at);gain.gain.linearRampToValueAtTime(1,at+.015);gain.gain.setValueAtTime(1,at+.5);gain.gain.exponentialRampToValueAtTime(.35,at+.8);gain.gain.exponentialRampToValueAtTime(.0001,at+2.18);gain.gain.linearRampToValueAtTime(0,at+2.2);
 if(i===notes.length-1)source.onended=finish;source.start(at);source.stop(at+2.2);
 });
 }catch{finish();$('error').textContent='לא הצלחנו להשמיע את הפסנתר. בדקו את החיבור ונסו שוב.';$('error').hidden=false;}
 }
 $('mic').addEventListener('click',toggleMic);$('play').addEventListener('click',playTarget);
 $('retry').addEventListener('click',()=>{reset();if(micActive)blockedUntil=0;});
 $('target-select').innerHTML=targets.map(n=>`<option value="${n}">${name(n)[0]} · ${name(n)[1]}</option>`).join('');$('target-select').value=String(target);
 $('target-select').addEventListener('change',()=>{target=Number($('target-select').value);reset();});
 if(pair)$('direction').addEventListener('change',()=>{direction=$('direction').value;reset();});
 $('next').addEventListener('click',()=>{const options=targets.filter(n=>n!==target);target=options[Math.floor(Math.random()*options.length)];$('target-select').value=String(target);$('play').textContent=pair?'▶ האזנה לשני הצלילים':'▶ האזנה לצליל';reset();});
 showTarget();
 env.addEventListener('pagehide',()=>{stopMic();context?.close();context=undefined;});
 // No storage, microphone request or sound is started on page load.
 return {stop:stopMic};
}
if(typeof window!=='undefined'&&window.document?.getElementById('mic')){let single,two,warmup;single=createPrototype(window,{onMicStart:()=>{two?.stop();warmup?.stop();}});if(window.document.getElementById('timed-mic'))two=createTimedPair(window,{onActivate:()=>{single.stop();warmup?.stop();}});if(window.document.getElementById('warmup-mic'))warmup=createTimedPair(window,{prefix:'warmup-',pattern:[0,2,4,2],...WARMUP_TIMING,onActivate:()=>{single.stop();two?.stop();}});}
