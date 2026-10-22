import {BASS_GUIDED_KEY,BASS_MODE_KEY,BASS_GOAL,loadGuidedBass,loadBassMode} from './bass-course.js';
import {BASS_KEY,bassChords,bassPlan,bassAnswerPlan,keyboardNotes,noteName,LETTER_NAMES,pc,loadBass,makeBassQuestion,newBassRound,submitBass,finishBass} from './bass.js';
import {playBassSequence,stop} from './audio.js';
export function createBassScreen({app,storage,navigation,bindNavigation}){
 let freeState=loadBass(storage),guided=loadGuidedBass(storage),mode=loadBassMode(storage);
 let state=mode==='guided'?guided.practice:freeState,visible=false,token=0,busy=false,playing=false,beat=-1,heard=false,notice='',keyboardScroll=0,previewNote=null;
 const button=(id,text,cls='',disabled=false)=>`<button id="bass-${id}" class="${cls}" ${disabled?'disabled':''}>${text}</button>`;
 const on=(id,fn)=>document.getElementById(`bass-${id}`)?.addEventListener('click',fn);
 function save(){if(mode==='guided')guided.practice=state;else freeState=state;try{storage.setItem(BASS_MODE_KEY,mode);if(mode==='guided')storage.setItem(BASS_GUIDED_KEY,JSON.stringify(guided));else storage.setItem(BASS_KEY,JSON.stringify(state));}catch{notice='לא ניתן לשמור בדפדפן הזה. אפשר להמשיך לתרגל.';}}
 function cancel(){token++;stop();busy=false;playing=false;beat=-1;}
 function next(){
 cancel();previewNote=null;
 if(mode==='guided'){
 if(state.current){if(state.current.result?.count!==4||guided.index>=BASS_GOAL-1)return;guided.index++;}
 state.current=newBassRound(guided.questions[guided.index]);
 }else{const previous=state.current?.q;state=finishBass(state);state.current=newBassRound(makeBassQuestion(Math.random,previous));}
 heard=false;save();render();
 }
 function changeMode(value){if(value===mode)return;cancel();save();mode=value;state=mode==='guided'?guided.practice:freeState;previewNote=null;heard=false;save();render();}
 async function listen(kind='full',note=null){
 cancel();busy=true;const request=token;const round=state.current;
 const plan=kind==='key'?[{midi:note,offset:0,level:.75}]:kind==='answer'?bassAnswerPlan(round.answer):bassPlan(round.q,kind==='bass');
 render();
 try{
 await playBassSequence(plan,value=>{if(request!==token||!visible)return;playing=value;if(value&&(kind==='full'||kind==='bass')){heard=true;if(kind==='bass'&&!state.current.usedBassOnly){state.current.usedBassOnly=true;if(state.current.recorded){state.stats.assisted++;if(state.stats.last)state.stats.last.usedBassOnly=true;}save();}}render();},index=>{if(request===token&&visible&&kind!=='key'){beat=index;render();}});
 }catch{if(request===token)notice='לא הצלחנו להשמיע. בדקו את עוצמת המדיה ונסו שוב.';}
 finally{if(request===token&&visible){busy=false;playing=false;beat=-1;render();}}
 }
 function render(){
 if(!visible)return;if(!state.current){next();return;}
 const previousKeyboard=document.querySelector('.bass-keyboard-scroll');if(previousKeyboard)keyboardScroll=previousKeyboard.scrollLeft;
 const r=state.current,filled=r.answer.every(Number.isInteger),result=r.result,solved=mode==='guided'&&result?.count===4,complete=mode==='guided'&&guided.completed===BASS_GOAL;
 app.innerHTML=`<header><a class="brand" href="./"><span class="brand-icon">♫</span><span>המסלול להוצאת מוזיקה משמיעה<small>האקדמיה לגיטרה של אמיר פרידמן</small></span></a></header>${navigation()}<main class="bass-screen"><div class="intro"><h1>הוצאת בס משמיעה</h1><p class="exercise-instruction">הקשיבו למהלך האקורדים. נסו לשמוע ולשיר את צלילי הבס, ואז מצאו את ארבעת הצלילים באמצעות הגיטרה או המקלדת.</p></div>
 <nav aria-label="מצב תרגול בס">${button('guided','מסלול מודרך',mode==='guided'?'selected':'')}${button('free','תרגול חופשי',mode==='free'?'selected':'')}</nav>
 ${mode==='guided'?`<section class="bass-course-progress" aria-label="התקדמות במסלול הבס"><div><strong>פתרתם ${guided.completed} מתוך ${BASS_GOAL} מהלכים</strong><span>אפשר להיעזר בבס בלבד ולתקן כמה שצריך. ההתקדמות נשמרת.</span></div><div class="track" role="progressbar" aria-label="מהלכים פתורים" aria-valuemin="0" aria-valuemax="${BASS_GOAL}" aria-valuenow="${guided.completed}"><i style="width:${100*guided.completed/BASS_GOAL}%"></i></div></section>`:'<p class="bass-free-note">תרגול חופשי ללא הגבלה. ההתקדמות במסלול המודרך נשמרת בנפרד.</p>'}
 ${complete?`<section class="panel bass-course-success" role="status"><h2>כל הכבוד! השלמתם את מסלול הוצאת הבס משמיעה</h2><p>פתרתם את כל עשרת המהלכים. אפשר להמשיך לתרגל בקצב שלכם.</p>${button('continue-free','ממשיכים לתרגול חופשי','next')}</section>`:''}
 <section class="panel bass-practice ${playing?'is-playing':''}"><div class="card-top"><span class="badge">ארבעה אקורדים · ארבעה צלילי בס</span><span class="muted">פסנתר · בקצב שלכם</span></div>
 <div class="bass-beats" aria-label="מיקום במהלך">${[0,1,2,3].map(i=>`<span class="${beat===i?'active':''}">${i+1}</span>`).join('')}</div>
 <div class="bass-listen-actions">${button('full',busy&&playing?'▶ השמע מהתחלה':'▶ השמע מהלך מלא','play')}${button('stop','<span aria-hidden="true">■</span> עצור השמעה','bass-stop',!busy)}${button('only','השמע בס בלבד','bass-secondary')}</div>
 <p class="bass-help">לחיצה על קליד משמיעה אותו בלבד. מצאתם את הצליל? לחצו על „הכנס למשבצת”. אפשר לחפש גם בגיטרה. אותו צליל באוקטבה אחרת מתקבל.</p>
 <div class="bass-slots" aria-label="ארבעת צלילי הבס — לפי סדר ההשמעה">${r.answer.map((midi,i)=>`<button data-bass-slot="${i}" aria-pressed="${r.active===i}" aria-label="צליל ${i+1}${midi===null?'':`, ${noteName(midi)}`}" class="bass-slot ${r.active===i?'active':''} ${result?(result.matches[i]?'correct':'wrong'):''}"><small>צליל ${i+1}</small><strong>${midi===null?'?':noteName(midi)}</strong>${midi===null?'':`<span lang="en" dir="ltr">${LETTER_NAMES[pc(midi)]}</span>`}${result?`<span>${result.matches[i]?'✓ נכון':'× נסו שוב'}</span>`:''}</button>`).join('')}</div>
 <p class="bass-slot-hint" role="status">${solved?'כל ארבעת הצלילים נכונים! אפשר להמשיך.':result?'אפשר לבחור משבצת ולתקן את הצליל.':`הקשיבו לקלידים וחפשו את צליל ${r.active+1}. לחצו על משבצת כדי לתקן אותה.`}</p>
 <div class="bass-keyboard-scroll"><div class="bass-keyboard" role="group" aria-label="מקלדת לחיפוש צלילי בס">${keyboardNotes().map((midi,i)=>{const black=[1,3,6,8,10].includes(pc(midi)),whiteBefore=keyboardNotes().slice(0,i).filter(n=>![1,3,6,8,10].includes(pc(n))).length;return `<button data-bass-key="${midi}" aria-pressed="${previewNote===midi}" class="bass-key ${previewNote===midi?'previewed':''} ${black?'black':'white'}" style="--position:${black?whiteBefore-.32:whiteBefore}" aria-label="${noteName(midi)}, אוקטבה ${Math.floor(midi/12)-1}"><span lang="en" dir="ltr">${LETTER_NAMES[pc(midi)].split(' / ')[0]}</span><small>${Math.floor(midi/12)-1}</small></button>`;}).join('')}</div></div>
 <p class="bass-keyboard-hint">המקלדת ניתנת לגלילה לצדדים במסך צר.</p>
 <div class="bass-preview-actions"><p role="status">${previewNote===null?'אפשר לשמוע כמה קלידים שרוצים לפני שבוחרים תשובה.':`הצליל שבחרתם להאזנה: <strong>${noteName(previewNote)}</strong> <span lang="en" dir="ltr">${LETTER_NAMES[pc(previewNote)]}</span>`}</p>${button('insert',`הכנס למשבצת ${r.active+1}`,'bass-secondary',previewNote===null||solved)}</div>
 <div class="bass-answer-actions">${button('answer','▶ השמע את התשובה שלי','bass-secondary',!filled)}${button('check','בדוק תשובה','next',!filled||!heard||solved)}</div>
 ${!heard?'<p class="bass-slot-hint">האזינו למהלך לפני בדיקת התשובה.</p>':''}
 <div class="bass-feedback" role="status">${result?`<h2>${result.count===4?'כל הכבוד! זיהיתם את כל צלילי הבס.':`זיהיתם ${result.count} מתוך 4 צלילים`}</h2><p>${r.firstSuccess?'הצלחתם בניסיון הראשון.':'לא הושלם נכון בניסיון הראשון.'} · ${r.usedBassOnly?'נעזרתם בהשמעת בס בלבד.':'לא נעזרתם בהשמעת בס בלבד.'}</p>`:''}</div>
 ${r.attempts?`<div class="bass-review-actions">${button('reveal',r.revealed?'הפתרון מוצג':'הצג פתרון מלא','quiet',r.revealed)}${!complete?button('next',mode==='guided'?'→ המהלך הבא':'→ התרגיל הבא','next',mode==='guided'?!solved:!result):''}</div>`:''}
 ${r.revealed?`<section class="bass-solution"><h3>צלילי הבס במהלך</h3><ol>${bassChords(r.q).map(c=>`<li>${noteName(c.bass)} <span lang="en" dir="ltr">${LETTER_NAMES[pc(c.bass)]}</span></li>`).join('')}</ol></section>`:''}
 </section><section class="stats bass-stats" aria-label="התרגול שלכם"><div><strong>${state.stats.completed}</strong><span>מהלכים שהשלמתם</span></div><div><strong>${state.stats.first}</strong><span>הצלחות מלאות בניסיון הראשון</span></div><div><strong>${state.stats.assisted}</strong><span>מהלכים עם עזרת בס בלבד</span></div></section>${state.stats.last?`<p class="bass-last">במהלך הקודם: ${state.stats.last.correct} מתוך 4 נכונים · ${state.stats.last.firstSuccess?'הצלחה בניסיון הראשון':'לא הושלם נכון בניסיון הראשון'} · ${state.stats.last.usedBassOnly?'עם עזרת בס בלבד':'בלי עזרת בס בלבד'}</p>`:''}<p class="save-note">◈ התשובות והנתונים נשמרים בדפדפן, בנפרד משאר התרגילים</p>${notice?`<p class="notice" role="alert">${notice}</p>`:''}</main><p class="piano-credit">פסנתר: Salamander Grand Piano V3 · Alexander Holm · <a href="https://creativecommons.org/licenses/by/3.0/">CC BY 3.0</a></p>`;
 const keyboard=document.querySelector('.bass-keyboard-scroll');keyboard.scrollLeft=keyboardScroll;
 bindNavigation();on('guided',()=>changeMode('guided'));on('free',()=>changeMode('free'));on('continue-free',()=>changeMode('free'));on('full',()=>listen());on('only',()=>listen('bass'));on('stop',()=>{cancel();render();});on('answer',()=>{if(filled)listen('answer');});
 on('check',()=>{if(!filled||!heard||solved)return;state=submitBass(state);if(mode==='guided'&&state.current.result.count===4){guided.completed=Math.max(guided.completed,guided.index+1);state=finishBass(state);}save();render();});
 on('reveal',()=>{if(!r.attempts)return;r.revealed=true;save();render();});on('next',()=>{if(mode==='guided'?solved:!!r.result)next();});
 document.querySelectorAll('[data-bass-slot]').forEach(b=>b.onclick=()=>{r.active=Number(b.dataset.bassSlot);previewNote=null;save();render();});
 on('insert',()=>{if(previewNote===null||solved)return;r.answer[r.active]=previewNote;r.active=Math.min(3,r.active+1);r.result=null;previewNote=null;save();render();});
 document.querySelectorAll('[data-bass-key]').forEach(b=>b.onclick=()=>{previewNote=Number(b.dataset.bassKey);listen('key',previewNote);});
 }
 return {show(){visible=true;render();},hide(){visible=false;cancel();}};
}
