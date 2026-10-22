import {CHORDS} from './chords.js';
import {PROGRESSION_GUIDED_KEY,PROGRESSION_MODE_KEY,PROGRESSION_GOAL,loadGuidedProgression,loadProgressionMode} from './progression-course.js';
import {progressionRootNames} from './tonality.js';
import {PROGRESSION_KEY,loadProgression,newProgressionRound,nextProgression,submitProgressionBass,submitProgressionQualities,progressionPlan} from './progression.js';
import {bassPlan,bassAnswerPlan,bassChords,noteName,LETTER_NAMES,pc} from './bass.js';
import {renderBassKeyboard} from './bass-keyboard.js';
import {playBassSequence,stop} from './audio.js';
export function createProgressionScreen({app,storage,navigation,bindNavigation}){
 let freeState=loadProgression(storage),guided=loadGuidedProgression(storage),mode=loadProgressionMode(storage);
 let state=mode==='guided'?guided.practice:freeState,visible=false,token=0,busy=false,playing=false,heard=false,beat=-1,preview=null,scroll=0,notice='',successOpen=false;
 const button=(id,text,cls='',disabled=false)=>`<button id="progression-${id}" class="${cls}" ${disabled?'disabled':''}>${text}</button>`;
 const on=(id,fn)=>document.getElementById('progression-'+id)?.addEventListener('click',fn);
 function save(){if(mode==='guided')guided.practice=state;else freeState=state;try{storage.setItem(PROGRESSION_MODE_KEY,mode);if(mode==='guided')storage.setItem(PROGRESSION_GUIDED_KEY,JSON.stringify(guided));else storage.setItem(PROGRESSION_KEY,JSON.stringify(state));}catch{notice='לא ניתן לשמור בדפדפן הזה. אפשר להמשיך לתרגל.';}}
 function cancel(){token++;stop();busy=false;playing=false;beat=-1;}
 function next(){
 successOpen=false;cancel();
 if(mode==='guided'){
 if(state.current){if(!state.current.completed||guided.index>=PROGRESSION_GOAL-1)return;guided.index++;}
 state.current=newProgressionRound(guided.questions[guided.index]);
 }else state.current=nextProgression(state.current?.q);
 heard=false;preview=null;save();render();
 }
 function changeMode(value){if(value===mode)return;successOpen=false;cancel();save();mode=value;state=mode==='guided'?guided.practice:freeState;heard=false;preview=null;save();render();}
 function advance(){next();document.querySelector('.progression-stages')?.scrollIntoView?.({block:'start',behavior:'smooth'});}
 function dismissSuccess(){successOpen=false;render();document.getElementById('progression-answer')?.focus({preventScroll:true});}
 async function listen(kind='full',value=null){
 cancel();busy=true;const request=token,r=state.current;
 const plan=kind==='key'?[{midi:value,offset:0,level:.75}]:kind==='bass'?bassPlan(r.q,true):kind==='bass-answer'?bassAnswerPlan(r.answer):kind==='chord'?progressionPlan(r.q,null,value):kind==='answer'?progressionPlan(r.q,r.qualities):progressionPlan(r.q);
 render();
 try{await playBassSequence(plan,isPlaying=>{if(request!==token||!visible)return;playing=isPlaying;
 if(isPlaying&&(kind==='full'||kind==='bass')){heard=true;if(kind==='bass'&&!state.current.usedBassOnly){state.current.usedBassOnly=true;if(state.current.completed)state.stats.assisted++;save();}}render();},index=>{if(request===token&&visible&&kind!=='key'){beat=kind==='chord'?value:index;render();}});
 }catch{if(request===token)notice='לא הצלחנו להשמיע. בדקו את עוצמת המדיה ונסו שוב.';}
 finally{if(request===token&&visible){busy=false;playing=false;beat=-1;render();}}
 }
 function render(){
 if(!visible)return;if(!state.current){next();return;}
 const old=document.querySelector('.bass-keyboard-scroll');if(old)scroll=old.scrollLeft;
 const r=state.current,bassStage=r.stage==='bass',filled=r.answer.every(Number.isInteger),chosen=r.qualities.every(v=>v!==null),rootNames=progressionRootNames(r.q),courseComplete=mode==='guided'&&guided.completed===PROGRESSION_GOAL;
 app.innerHTML=`<header><a class="brand" href="./"><span class="brand-icon">♫</span><span>המסלול להוצאת מוזיקה משמיעה<small>האקדמיה לגיטרה של אמיר פרידמן</small></span></a></header>${navigation()}<main class="bass-screen progression-screen"><div class="intro"><span class="eyebrow">רמה 1</span><h1>הוצאת מהלך אקורדים משמיעה</h1><p class="exercise-instruction">קודם מוצאים את ארבעת צלילי הבס, ואז מזהים אילו אקורדים הם מז׳ור ואילו מינור.</p></div>
 <nav aria-label="מצב תרגול הוצאת מהלך אקורדים">${button('guided','מסלול מודרך',mode==='guided'?'selected':'')}${button('free','תרגול חופשי',mode==='free'?'selected':'')}</nav>
 ${mode==='guided'?`<section class="bass-course-progress" aria-label="התקדמות בהוצאת מהלכי אקורדים"><div><strong>פתרתם ${guided.completed} מתוך ${PROGRESSION_GOAL} מהלכים</strong><span>כל מהלך נספר אחרי מציאת הבס וזיהוי כל ארבעת האקורדים. אפשר להיעזר ולתקן.</span></div><div class="track" role="progressbar" aria-label="מהלכים פתורים" aria-valuemin="0" aria-valuemax="${PROGRESSION_GOAL}" aria-valuenow="${guided.completed}"><i style="width:${100*guided.completed/PROGRESSION_GOAL}%"></i></div></section>`:'<p class="bass-free-note">תרגול חופשי ללא הגבלה. ההתקדמות במסלול המודרך נשמרת בנפרד.</p>'}
 ${courseComplete?`<section class="panel bass-course-success" role="status"><h2>כל הכבוד! השלמתם את מסלול הוצאת מהלך האקורדים משמיעה</h2><p>פתרתם את כל עשרת המהלכים, מהבס ועד סוגי האקורדים. אפשר להמשיך לתרגל בחופשיות.</p>${button('continue-free','ממשיכים לתרגול חופשי','next')}</section>`:''}
 <ol class="progression-stages" aria-label="שלבי התרגיל"><li ${bassStage?'aria-current="step"':''}>${bassStage?'1.':'✓'} הוצאת הבס</li><li ${!bassStage?'aria-current="step"':''}>2. זיהוי האקורדים</li></ol>
 <section class="panel bass-practice"><div class="card-top"><span class="badge">${bassStage?'שלב א׳ · מציאת הבס':'שלב ב׳ · מז׳ור או מינור'}</span><span class="muted">אותו מהלך · ארבעה אקורדים</span></div>
 <div class="bass-beats" aria-label="מיקום במהלך">${[0,1,2,3].map(i=>`<span class="${beat===i?'active':''}">${i+1}</span>`).join('')}</div>
 <div class="bass-listen-actions">${button('full','▶ השמע מהלך מלא','play')}${button('stop','<span aria-hidden="true">■</span> עצור השמעה','bass-stop',!busy)}${button('bass','השמע בס בלבד','bass-secondary')}</div>
 ${bassStage?`<h2>מצאו את ארבעת צלילי הבס</h2><p class="bass-help">הקשיבו ונסו לשיר את הבס. לחיצה על קליד משמיעה אותו בלבד; „הכנס למשבצת” שומר את הבחירה. אפשר לחפש גם בגיטרה.</p>
 <div class="bass-slots" aria-label="צלילי הבס לפי הסדר">${r.answer.map((midi,i)=>`<button data-progression-slot="${i}" aria-pressed="${r.active===i}" class="bass-slot ${r.active===i?'active':''} ${r.result?(r.result.matches[i]?'correct':'wrong'):''}"><small>צליל ${i+1}</small><strong>${midi===null?'?':noteName(midi)}</strong>${midi===null?'':`<span lang="en" dir="ltr">${LETTER_NAMES[pc(midi)]}</span>`}${r.result?`<span>${r.result.matches[i]?'✓ נכון':'× נסו שוב'}</span>`:''}</button>`).join('')}</div>
 <p class="bass-slot-hint">חפשו את צליל ${r.active+1}. אפשר לבחור משבצת כדי לתקן. אוקטבה אחרת של אותו צליל מתקבלת.</p>${renderBassKeyboard(preview,'data-progression-key')}
 <div class="bass-preview-actions"><p role="status">${preview===null?'אפשר להקשיב לכמה קלידים שרוצים לפני שבוחרים.':`הצליל להאזנה: ${noteName(preview)}`}</p>${button('insert',`הכנס למשבצת ${r.active+1}`,'bass-secondary',preview===null)}</div>
 <div class="bass-answer-actions">${button('bass-answer','▶ השמע את רצף הבס שלי','bass-secondary',!filled)}${button('check-bass','בדוק תשובה','next',!filled||!heard)}</div><div class="bass-feedback" role="status">${r.result?`זיהיתם ${r.result.count} מתוך 4 צלילים. אפשר לתקן ולבדוק שוב.`:heard?'':'האזינו למהלך לפני בדיקת התשובה.'}</div>`:
 `<h2>${r.completed?'כל הכבוד! הוצאתם את המהלך נכון':'הבס נכון! עכשיו זהו את סוגי האקורדים'}</h2><p class="bass-help">הקשיבו למהלך או לכל אקורד בנפרד. בחרו מז׳ור או מינור לכל צליל בס, והשוו את המהלך שלכם למקור.</p>
 <div class="progression-chords">${r.answer.map((midi,i)=>`<section class="progression-chord ${r.qualityResult?(r.qualityResult.matches[i]?'correct':'wrong'):''}"><span class="muted">אקורד ${i+1}</span><h3>${rootNames[i].hebrew} <span dir="ltr" lang="en">${rootNames[i].english}</span></h3>${button('chord-'+i,`▶ השמע אקורד ${i+1}`,'bass-secondary')}
 <div class="progression-quality" role="group" aria-label="סוג אקורד ${i+1}">${[['major','מז׳ור',CHORDS[1].symbol],['minor','מינור',CHORDS[2].symbol]].map(([value,label,english])=>`<button data-progression-quality="${i}:${value}" aria-pressed="${r.qualities[i]===value}" ${r.completed?'disabled':''}>${label}<small class="interval-english" lang="en" dir="ltr">${english}</small></button>`).join('')}</div>${r.qualityResult?`<p>${r.qualityResult.matches[i]?'✓ נכון':'× נסו שוב'}</p>`:''}</section>`).join('')}</div>
 <div class="bass-answer-actions">${button('answer','▶ השמע את המהלך שלי','bass-secondary',!chosen)}${button('check-quality','בדוק תשובה','next',!chosen||r.completed)}</div><div class="bass-feedback" role="status">${r.qualityResult?`זיהיתם ${r.qualityResult.count} מתוך 4 אקורדים${r.completed?'.':'. אפשר לתקן ולנסות שוב.'}`:''}</div>
 ${r.completed?`<section class="bass-solution progression-success"><h3>זה המהלך שהוצאתם</h3><ol>${bassChords(r.q).map((c,i)=>`<li><strong lang="en" dir="ltr">${rootNames[i].english}${c.quality==='minor'?'m':''}</strong><span>${rootNames[i].hebrew} ${c.quality==='major'?'מז׳ור':'מינור'}</span><small lang="en" dir="ltr">${c.quality==='major'?CHORDS[1].symbol:CHORDS[2].symbol}</small></li>`).join('')}</ol>${button('success-play','▶ השמע את המהלך','bass-secondary')}${!courseComplete?button('new',mode==='guided'?'המהלך הבא →':'מהלך חדש →','next'):''}</section>`:''}`}
 </section><section class="stats bass-stats" aria-label="ההצלחה שלכם בתרגיל"><div><strong>${state.stats.completed}</strong><span>מהלכים שהוצאתם במלואם</span></div><div><strong>${state.stats.bassFirst}</strong><span>בס נכון בהגשה הראשונה</span></div><div><strong>${state.stats.qualityFirst}</strong><span>סוגי אקורדים נכונים בהגשה הראשונה</span></div></section><p class="save-note">◈ המקום והתשובות נשמרים בדפדפן, בנפרד מתרגיל הבס</p>${notice?`<p class="notice" role="alert">${notice}</p>`:''}</main><p class="piano-credit">פסנתר: Salamander Grand Piano V3 · Alexander Holm · <a href="https://creativecommons.org/licenses/by/3.0/">CC BY 3.0</a></p>${successOpen&&r.completed?`<dialog id="progression-success-dialog" class="progression-success-dialog" aria-labelledby="progression-popup-title" aria-describedby="progression-popup-description"><span class="progression-success-icon" aria-hidden="true">✓</span><h2 id="progression-popup-title">${courseComplete?'כל הכבוד! השלמתם את המסלול':'כל הכבוד! הוצאתם את המהלך נכון'}</h2><p id="progression-popup-description">${courseComplete?'פתרתם את כל עשרת המהלכים. אפשר להמשיך לתרגול חופשי.':mode==='guided'?`פתרתם ${guided.completed} מתוך ${PROGRESSION_GOAL} מהלכים. מוכנים למהלך הבא?`:'זיהיתם נכון את הבס ואת כל ארבעת האקורדים.'}</p>${button('popup-next',courseComplete?'ממשיכים לתרגול חופשי':mode==='guided'?'המהלך הבא →':'מהלך חדש →','next')}${button('popup-stay','להישאר ולהאזין למהלך','quiet')}</dialog>`:''}`;
 const keyboard=document.querySelector('.bass-keyboard-scroll');if(keyboard)keyboard.scrollLeft=scroll;
 bindNavigation();on('guided',()=>changeMode('guided'));on('free',()=>changeMode('free'));on('continue-free',()=>changeMode('free'));on('full',()=>listen());on('bass',()=>listen('bass'));on('stop',()=>{cancel();render();});
 on('bass-answer',()=>{if(filled&&bassStage)listen('bass-answer');});on('answer',()=>{if(chosen&&!bassStage)listen('answer');});on('success-play',()=>listen());on('new',()=>{if(r.completed)advance();});
 on('check-bass',()=>{if(!bassStage||!heard||!filled)return;state=submitProgressionBass(state);preview=null;save();render();});
 on('check-quality',()=>{if(bassStage||!chosen||r.completed)return;state=submitProgressionQualities(state);successOpen=state.current.completed;if(mode==='guided'&&state.current.completed)guided.completed=Math.max(guided.completed,guided.index+1);save();render();});
 document.querySelectorAll('[data-progression-slot]').forEach(b=>b.onclick=()=>{if(!bassStage)return;r.active=Number(b.dataset.progressionSlot);preview=null;save();render();});
 document.querySelectorAll('[data-progression-key]').forEach(b=>b.onclick=()=>{preview=Number(b.dataset.progressionKey);listen('key',preview);});
 on('insert',()=>{if(!bassStage||preview===null)return;r.answer[r.active]=preview;r.active=Math.min(3,r.active+1);r.result=null;preview=null;save();render();});
 document.querySelectorAll('[data-progression-quality]').forEach(b=>b.onclick=()=>{if(bassStage||r.completed)return;const [index,value]=b.dataset.progressionQuality.split(':');r.qualities[Number(index)]=value;r.qualityResult=null;save();render();});
 if(!bassStage)for(let i=0;i<4;i++)on('chord-'+i,()=>listen('chord',i));
 on('popup-next',()=>{if(courseComplete)changeMode('free');else advance();});on('popup-stay',dismissSuccess);
 const dialog=document.getElementById('progression-success-dialog');if(dialog){dialog.addEventListener('cancel',event=>{event.preventDefault();dismissSuccess();});dialog.showModal();document.getElementById('progression-popup-next')?.focus();}
 }
 return {show(){visible=true;render();},hide(){visible=false;successOpen=false;cancel();}};
}
