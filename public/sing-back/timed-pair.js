import {detectPitch,centsFromTarget} from './pitch.js?v=slow-warmup-3';
import {createTimedRound,timelinePhase,SLOT_MS,REQUIRED_ACCURATE_MS} from './timeline.js?v=slow-warmup-3';
export function createTimedPair(env=window,{onActivate=()=>{},prefix='timed-',pattern=null,slotMs=SLOT_MS,demoMs=4000,countMs=1800,requiredMs=REQUIRED_ACCURATE_MS}={}){
 const $=id=>env.document.getElementById(prefix+id);
 let context,stream,input,analyser,raf,running=false,pending=false,serial=0,notes=[48,50],origin=0,withSinging=false,round,lastFrame=0;
 const cache=new Map();let sources=[];
 const names=['C','C♯/D♭','D','D♯/E♭','E','F','F♯/G♭','G','G♯/A♭','A','A♯/B♭','B'];
 const credit=r=>`${(Math.min(r.goodMs,requiredMs)/1000).toFixed(2)} מתוך ${(requiredMs/1000).toFixed(2)} שניות מדויקות`;
 const title=m=>names[m%12].split('/').map(n=>n+(Math.floor(m/12)-1)).join(' / ');
 const noteLabel=i=>pattern?`צליל ${i+1}`:`צליל ${i===0?'ראשון':'שני'}`;
 const scale=()=>75/(Math.max(...notes)-Math.min(...notes))/100;
 function ctx(){context??=new (env.AudioContext||env.webkitAudioContext)();return context;}
 function controls(){['demo','root','direction'].forEach(id=>$(id).disabled=running||pending);$('start').disabled=running||!stream;$('stop').hidden=!running;}
 function status(text){if($('phase').textContent!==text)$('phase').textContent=text;}
 function setup(){const low=+$('root').value;notes=pattern?pattern.map(n=>low+n):$('direction').value==='ascending'?[low,low+2]:[low+2,low];for(let i=0;i<notes.length;i++){$('note'+i).textContent=pattern?`${['דו','רה','מי','רה'][i]} · ${title(notes[i])}`:title(notes[i]);$('target'+i).setAttribute('y',String(145-(notes[i]-low)*100*scale()-25*scale()));$('target'+i).setAttribute('height',String(50*scale()));if(pattern){const width=560/notes.length;$('note'+i).setAttribute('x',String(20+width*(i+.5)));$('target'+i).setAttribute('x',String(28+width*i));$('target'+i).setAttribute('width',String(width-16));}$('target'+i).classList.remove('active');$('result'+i).textContent=`${noteLabel(i)} — ממתין`;$('result'+i).className='';}$('trace').replaceChildren();$('cursor').setAttribute('x1','20');$('cursor').setAttribute('x2','20');$('success').hidden=true;status('מוכנים להקשיב?');}
 function cancel(){serial++;running=false;if(raf!==undefined)env.cancelAnimationFrame(raf);sources.forEach(s=>{try{s.stop();}catch{}});sources=[];controls();}
 function stop(){cancel();input?.disconnect();input=null;stream?.getTracks().forEach(t=>t.stop());stream=null;pending=false;$('mic').disabled=false;$('mic').textContent='הפעלת מיקרופון לתיבה';$('mic-state').textContent='המיקרופון כבוי';controls();status('הניסיון נעצר. אפשר להתחיל מחדש.');}
 async function microphone(){
 if(stream){stop();return;}if(pending)return;
 $('error').hidden=true;if(!env.isSecureContext||!env.navigator.mediaDevices?.getUserMedia){$('error').textContent='פתחו את האבטיפוס ב־HTTPS כדי לאפשר מיקרופון.';$('error').hidden=false;return;}
 onActivate();pending=true;const id=++serial;$('mic').disabled=true;controls();
 try{await ctx().resume();const granted=await env.navigator.mediaDevices.getUserMedia({audio:{echoCancellation:true,noiseSuppression:false,autoGainControl:false},video:false});
 if(id!==serial){granted.getTracks().forEach(t=>t.stop());return;}
 stream=granted;input=context.createMediaStreamSource(stream);analyser=context.createAnalyser();analyser.fftSize=4096;input.connect(analyser);pending=false;$('mic').disabled=false;$('mic').textContent='כיבוי מיקרופון לתיבה';$('mic-state').textContent='המיקרופון פעיל';stream.getTracks().forEach(t=>t.onended=()=>{if(stream)stop();});controls();status('המיקרופון מוכן. לחצו ״האזנה ואז שירה״.');
 }catch{stop();$('error').textContent='לא הצלחנו להפעיל מיקרופון. בדקו את הרשאת האתר ונסו שוב.';$('error').hidden=false;}
 }
 function renderFrame(){
 if(!running)return;
 const time=(context.currentTime-origin)*1000;
 const phase=timelinePhase(time,withSinging,{slotMs,demoMs,countMs,noteCount:notes.length});
 if(phase.phase==='done'){
 running=false;controls();
 if(withSinging){round.results.forEach((r,i)=>{$('result'+i).textContent=`${noteLabel(i)} — ${r.accurate?'✓ מדויק':r.readings?'ננסה שוב':'לא זוהה קול יציב'} · ${credit(r)}`;$('result'+i).className=r.accurate?'achieved':'';});const success=round.results.every(r=>r.accurate);$('success').hidden=!success;status(success?(pattern?'יפה! שרתם את כל התבנית.':'יפה! שני הצלילים נשארו מולכם והצלחתם.'):'הניסיון הסתיים. הסתכלו על הקול שלכם ונסו שוב.');}
 else status('זו הדוגמה. הפעילו מיקרופון ולחצו ״האזנה ואז שירה״.');
 $('cursor').setAttribute('x1','580');$('cursor').setAttribute('x2','580');for(let i=0;i<notes.length;i++)$('target'+i).classList.remove('active');return;
 }
 const x=20+560*phase.position;$('cursor').setAttribute('x1',String(x));$('cursor').setAttribute('x2',String(x));
 for(let i=0;i<notes.length;i++)$('target'+i).classList.toggle('active',(phase.phase==='listen'||phase.phase==='sing')&&phase.step===i);
 if(phase.phase==='listen')status('קודם מקשיבים — הסמן מראה איזה צליל מתנגן');
 if(phase.phase==='count')status(`מתכוננים לשיר: ${phase.count}`);
 if(phase.phase==='sing'){
 if(time-lastFrame>=50){lastFrame=time;
 const data=new Float32Array(analyser.fftSize);analyser.getFloatTimeDomainData(data);const detection=detectPitch(data,context.sampleRate);const {result}=round.update(detection,time);
 status(`עכשיו שרים — ${noteLabel(phase.step)}${result?.reliable?'':' · מקשיב...'}`);
 if(detection&&result?.reliable){const low=Math.min(...notes),cents=centsFromTarget(detection.frequency,low),y=Math.max(40,Math.min(180,145-cents*scale()));const dot=env.document.createElementNS('http://www.w3.org/2000/svg','circle');dot.setAttribute('cx',String(x));dot.setAttribute('cy',String(y));dot.setAttribute('r','3');dot.setAttribute('fill',Math.abs(centsFromTarget(detection.frequency,notes[phase.step]))<=25?'#3f8c43':'#b78a4d');$('trace').append(dot);}
 round.results.forEach((r,i)=>{$('result'+i).textContent=`${noteLabel(i)} — ${r.accurate?'✓ מדויק':credit(r)}`;$('result'+i).className=r.accurate?'achieved':'';});
 }
 }
 raf=env.requestAnimationFrame(renderFrame);
 }
 async function start(sing){
 if(running||sing&&!stream)return;onActivate();cancel();running=true;withSinging=sing;setup();controls();$('error').hidden=true;status('מכין את הפסנתר…');const id=serial;
 try{await ctx().resume();await Promise.all(notes.map(async n=>{if(cache.has(n))return;const r=await env.fetch(`../audio/${n}.mp3`);if(!r.ok)throw new Error();cache.set(n,await context.decodeAudioData(await r.arrayBuffer()));}));if(id!==serial)return;
 origin=context.currentTime+.05;round=createTimedRound(notes,{slotMs,demoMs,countMs,requiredMs});lastFrame=0;
 const stretch=pattern?Math.max(1,slotMs/1800):1;
 notes.forEach((note,i)=>{const source=context.createBufferSource(),gain=context.createGain(),at=origin+i*slotMs/1000;source.buffer=cache.get(note);source.connect(gain);gain.connect(context.destination);gain.gain.setValueAtTime(0,at);gain.gain.linearRampToValueAtTime(1,at+.015);gain.gain.setValueAtTime(1,at+(slotMs<1000 ? .2 : .5*stretch));gain.gain.exponentialRampToValueAtTime(.35,at+(slotMs<1000 ? .6 : .8*stretch));gain.gain.exponentialRampToValueAtTime(.0001,at+(slotMs<1000 ? .88 : 2.18*stretch));gain.gain.linearRampToValueAtTime(0,at+(slotMs<1000 ? .9 : 2.2*stretch));source.start(at);source.stop(at+(slotMs<1000 ? .9 : 2.2*stretch));sources.push(source);});
 raf=env.requestAnimationFrame(renderFrame);
 }catch{if(id!==serial)return;cancel();$('error').textContent='לא הצלחנו להשמיע את הפסנתר. נסו שוב.';$('error').hidden=false;}
 }
 $('root').innerHTML=Array.from({length:pattern?13:11},(_,i)=>`<option value="${48+i}">${title(48+i)}</option>`).join('');$('root').value='48';setup();controls();
 $('root').addEventListener('change',setup);$('direction').addEventListener('change',setup);$('demo').addEventListener('click',()=>start(false));$('start').addEventListener('click',()=>start(true));$('mic').addEventListener('click',microphone);$('stop').addEventListener('click',()=>{cancel();status('הניסיון נעצר. אפשר לנסות שוב.');});env.addEventListener('pagehide',()=>{stop();context?.close();context=undefined;});
 return {stop};
}
