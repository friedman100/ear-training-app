import {CHORDS,CHORD_STAGES,CHORD_KEY,CHORD_SESSION_KEY,chordWindow,chordActive,chordQuestion,recordChord,loadChords,loadChordSession,restoreChord,answer,newSession,completeQuestion,noteUnlocks} from './chords.js';
import {playChord,stop} from './audio.js';

// Independent exercise controller; navigation and the sampled piano are shared with intervals.
export function createChordScreen({app,storage,navigation,bindNavigation}){
 let state=loadChords(storage),session=loadChordSession(storage),q=restoreChord(session.current,state);
 let wrong=q&&Array.isArray(session.current?.wrong)?session.current.wrong.filter(id=>chordActive(state).includes(id)):[];
 let heard=false,busy=false,playing=false,notice='',generation=0,visible=false;
 const label=id=>`${CHORDS[id].name}<small class="interval-english" lang="en" dir="ltr">${CHORDS[id].symbol}</small>`;
 const button=(id,text,cls='')=>`<button id="chord-${id}" class="${cls}">${text}</button>`;
 const header=()=>`<header><a class="brand" href="./"><span class="brand-icon">♫</span><span>המסלול להוצאת מוזיקה משמיעה<small>האקדמיה לגיטרה של אמיר פרידמן</small></span></a></header>${navigation()}`;
 function save(){session.current={q,mode:state.mode,wrong};try{storage.setItem(CHORD_KEY,JSON.stringify(state));storage.setItem(CHORD_SESSION_KEY,JSON.stringify(session));}catch{notice='לא ניתן לשמור בדפדפן הזה. אפשר להמשיך לתרגל.';}}
 function cancel(){generation++;stop();busy=false;playing=false;}
 function next(){cancel();q=chordQuestion(chordActive(state),state.mode==='guided'?state.history:[]);wrong=[];heard=false;save();}
 async function listen(broken=false,demo=false){
 if(busy)return;busy=true;const request=generation;render();
 const notes=demo?CHORDS[state.pending].tones.map(n=>60+n):q.notes;
 try{await playChord(notes,broken,value=>{if(request===generation&&visible){playing=value;render();}},()=>{if(request===generation&&visible&&!demo){heard=true;render();}});}
 catch{if(request===generation)notice='לא הצלחנו להשמיע. בדקו את עוצמת הקול ונסו שוב.';}
 finally{if(request===generation&&visible){busy=false;playing=false;render();}}
 }
 const on=(id,fn)=>document.getElementById(`chord-${id}`)?.addEventListener('click',fn);
 function render(){
 if(!visible)return;
 if(session.ended){summary();return;}
 if(!q)next();
 const ids=chordActive(state),target=Math.ceil(chordWindow(state.stage)*.8),value=Math.min(target,state.history.filter(row=>row.correct).length);
 app.innerHTML=`${header()}<main class="chord-screen"><div class="intro"><h1>זיהוי אקורדים משמיעה</h1><p>מקשיבים לצבע של האקורד ומזהים את הסוג שלו. אין צורך לזהות את תו השורש.</p></div>
 <nav aria-label="מצב תרגול אקורדים">${button('guided','מסלול מודרך',state.mode==='guided'?'selected':'')}${button('free','תרגול חופשי',state.mode==='free'?'selected':'')}</nav>
 <div class="layout"><section class="practice panel ${playing?'is-playing':''}"><div class="card-top"><span class="badge">${state.mode==='guided'?`שלב ${state.stage+1} מתוך 12`:'בקצב שלכם'}</span><span class="muted">פסנתר · אקורד במצב יסודי</span></div>
 <div class="session-counter" role="status"><span><strong>${session.correct} מתוך ${session.total} נכונים</strong><small>בניסיון הראשון</small></span></div>
 <div class="sound-art" aria-hidden="true">${'<span></span>'.repeat(9)}</div><h2>איזה אקורד מנוגן פה?</h2><p class="exercise-instruction">הקשיבו לאקורד ובחרו את סוג האקורד</p>
 <div class="practice-actions">${button('listen',busy?(playing?'◌ משמיע…':'◌ מכין צלילים…'):heard?'▶ האזנה חוזרת':'▶ האזנה לאקורד','play')}${q.solved?button('next','→ האקורד הבא','next'):''}</div>
 ${button('broken','השמע מפורק','chord-broken')}<div class="listen-hint">אפשר להקשיב שוב, כמה שרוצים</div>
 <div class="answers">${[...ids].sort((a,b)=>a-b).map(id=>`<button data-chord-answer="${id}" class="answer ${wrong.includes(id)?'wrong':''} ${q.solved&&id===q.interval?'correct':''}" ${!heard||q.solved?'disabled':''}>${label(id)}${q.solved&&id===q.interval?' ✓':''}</button>`).join('')}</div>
 <div class="feedback" role="status">${q.solved?'יפה מאוד! זיהיתם את האקורד.':wrong.length?'עוד ניסיון — הקשיבו שוב ובחרו תשובה אחרת.':heard?'קחו את הזמן. האוזן לומדת בכל ניסיון.':'לחצו על האזנה כדי להתחיל.'}</div>
 ${state.mode==='guided'?`<section class="unlock-progress" aria-label="התקדמות לאקורד הבא">${state.complete?'<p class="success-text">כל סוגי האקורדים פתוחים. ממשיכים לתרגל!</p>':`<div class="progress-label"><span>${state.stage===11?'לקראת השלמת המסלול':`ברמה הבאה יצטרף לתרגול גם ${CHORDS[CHORD_STAGES[state.stage+1].at(-1)].name}`}</span><b dir="ltr">${value} / ${target}</b></div><div class="track" role="progressbar" aria-label="התקדמות לאקורד הבא" aria-valuemin="0" aria-valuemax="${target}" aria-valuenow="${value}"><i style="width:${100*value/target}%"></i></div>`}</section>`:''}
 <div class="practice-end">${button('end','סיום תרגול','end-session')}</div></section><aside><section class="panel progress"><div class="section-title"><span class="tiny-icon">↗</span><h3>${state.mode==='guided'?'המסלול שלכם':'בוחרים מה לתרגל'}</h3></div>
 ${state.mode==='guided'?`<p>כל סוג חדש מצטרף לאקורדים שכבר למדתם.</p><div class="steps">${CHORD_STAGES.map((stage,i)=>`<div class="step ${i===state.stage?'current':''} ${i<state.stage?'done':''}"><span class="step-number">${i<state.stage?'✓':i+1}</span><span>${i===0?'מז׳ור ומינור':label(stage.at(-1))}</span><span class="step-status">${i===state.stage?'בתרגול':''}</span></div>`).join('')}</div>`:`<p>בחרו סוג אחד או יותר. ההתקדמות במסלול המודרך נשמרת בנפרד.</p><div class="choices">${CHORDS.slice(1).map((_,i)=>`<label><input type="checkbox" data-chord-choice="${i+1}" ${state.selected.includes(i+1)?'checked':''}><span>${label(i+1)}</span></label>`).join('')}</div>`}</section></aside></div>
 <p class="save-note">◈ התרגול וההתקדמות באקורדים נשמרים בנפרד מהמרווחים</p>${notice?`<p class="notice" role="alert">${notice}</p>`:''}</main><p class="piano-credit">פסנתר: Salamander Grand Piano V3 · Alexander Holm · <a href="https://creativecommons.org/licenses/by/3.0/">CC BY 3.0</a></p>
 ${state.mode==='guided'&&state.pending?`<dialog aria-labelledby="chord-unlock-title"><span class="eyebrow">כל הכבוד!</span><h2 id="chord-unlock-title">${state.pending==='complete'?'השלמתם את המסלול!':`סוג אקורד חדש נפתח: ${CHORDS[state.pending].name}`}</h2>${state.pending==='complete'?'<p>כל סוגי האקורדים פתוחים. אפשר להמשיך לתרגל ללא הגבלה.</p>':`<p>הקשיבו לאקורד החדש לפני שממשיכים. הוא מצטרף לכל הסוגים שכבר למדתם.</p>${button('demo',busy?'משמיע…':'▶ האזנה לאקורד החדש','play')}`}${button('continue','ממשיכים לתרגל','next')}</dialog>`:''}`;
 bindNavigation();
 on('listen',()=>listen());on('broken',()=>listen(true));on('next',()=>{next();render();listen();});on('end',()=>{cancel();session.ended=true;save();render();});
 for(const mode of ['guided','free'])on(mode,()=>{if(mode===state.mode)return;state.mode=mode;next();render();});
 document.querySelectorAll('[data-chord-answer]').forEach(b=>b.onclick=()=>{
 if(!heard)return;const result=answer(q,Number(b.dataset.chordAnswer));if(result.ignored)return;
 if(result.q.solved&&!q.sessionRecorded){session=completeQuestion(session,result.q);result.q.sessionRecorded=true;}
 if(result.first){const previous=state.stage;state=recordChord(state,q,result.correct);if(state.stage>previous)session=noteUnlocks(session,[CHORD_STAGES[state.stage].at(-1)]);}
 q=result.q;if(!result.correct&&!wrong.includes(Number(b.dataset.chordAnswer)))wrong.push(Number(b.dataset.chordAnswer));save();render();
 });
 document.querySelectorAll('[data-chord-choice]').forEach(b=>b.onchange=()=>{const id=Number(b.dataset.chordChoice);if(!b.checked&&state.selected.length===1){b.checked=true;notice='יש לבחור לפחות סוג אקורד אחד.';render();return;}state.selected=b.checked?[...state.selected,id]:state.selected.filter(n=>n!==id);next();render();});
 on('demo',()=>listen(false,true));on('continue',()=>{cancel();state.pending=null;save();render();});
 const dialog=document.querySelector('dialog');if(dialog){dialog.addEventListener('cancel',e=>e.preventDefault());dialog.showModal();}
 }
 function summary(){
 app.innerHTML=`${header()}<main class="summary chord-screen"><span class="eyebrow">זיהוי אקורדים</span><h1>סיכום התרגול שלכם</h1><p>הנתונים מתייחסים לתרגול הנוכחי בלבד, במסלול המודרך ובמצב החופשי.</p>
 ${session.total?`<section class="stats summary-stats"><div><strong>${session.total}</strong><span>אקורדים שהשלמתם</span></div><div><strong>${Math.round(100*session.correct/session.total)}%</strong><span>הצלחה בניסיון הראשון</span></div><div><strong>${session.best}</strong><span>רצף ההצלחות המרבי בניסיון הראשון</span></div></section><section class="panel summary-details"><h2>ההצלחה שלכם בכל סוג אקורד</h2><div class="summary-table"><table><thead><tr><th>סוג אקורד</th><th>הצלחה בניסיון הראשון</th><th>הצלחות מתוך שאלות</th></tr></thead><tbody>${Object.entries(session.intervals).sort(([a],[b])=>a-b).map(([id,row])=>`<tr><th scope="row">${label(id)}</th><td>${Math.round(100*row.correct/row.total)}%</td><td>${row.correct} מתוך ${row.total}</td></tr>`).join('')}</tbody></table></div></section>`:'<section class="panel empty-summary"><h2>עדיין לא השלמתם שאלה בתרגול הזה</h2><p>שאלה נספרת אחרי שמזהים נכון את האקורד, גם אם נדרשו כמה ניסיונות.</p></section>'}
 <section class="panel summary-unlocks"><h2>סוגי אקורדים חדשים שנפתחו</h2>${session.unlocked.length?`<ul>${session.unlocked.map(id=>`<li>${label(id)}</li>`).join('')}</ul>`:'<p>לא נפתחו סוגי אקורדים חדשים במהלך התרגול הזה.</p>'}</section><p class="fine">שאלות שלא הושלמו אינן נכללות בסיכום. ההתקדמות וההגדרות שלכם שמורות.</p>${button('new','תרגול חדש','next')}</main>`;
 bindNavigation();on('new',()=>{session=newSession();next();render();});
 }
 return {show(){visible=true;render();},hide(){visible=false;cancel();}};
}
