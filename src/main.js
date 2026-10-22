import {createProgressionScreen} from './progression-screen.js';
import {createBassScreen} from './bass-screen.js';
import {createChordScreen} from './chord-screen.js';
import {PLAYBACK_TYPES} from './playback-plan.js';
import './style.css';
import {RANGES,ENGLISH_INTERVALS,INTERVALS,STAGES,windowSize,initialState,question,answer,record,load} from './logic.js';
import {SESSION_KEY,newSession,completeQuestion,noteUnlocks,loadSession,restoreQuestion} from './session.js';
import {play,stop} from './audio.js';
let storage;try{storage=localStorage;}catch{storage={getItem:()=>null,setItem:()=>{throw new Error('Storage unavailable');}};}
let state=load(storage),q,heard=false,busy=false,playing=false,wrong=[],notice='',settings=false,token=0;
let session=loadSession(storage);
const app=document.querySelector('#app');
let section=location.protocol==='file:'?'intervals':'singing';
const pathNavigation=()=>`<nav class="path-navigation" aria-label="בחירת מסלול"><button data-section="singing" aria-pressed="${section==='singing'}">1. לשמוע ולשיר</button><button data-section="intervals" aria-pressed="${section==='intervals'}">2. לשיר ולזהות מרווחים</button><button data-section="chords" aria-pressed="${section==='chords'}">3. זיהוי אקורדים</button><button data-section="bass" aria-pressed="${section==='bass'}">4. הוצאת בס משמיעה</button><button data-section="progression" aria-pressed="${section==='progression'}">5. הוצאת מהלך אקורדים משמיעה</button></nav>`;
function bindPathNavigation(){document.querySelectorAll('[data-section]').forEach(button=>button.onclick=()=>{
 if(button.dataset.section===section)return;
 const frame=document.getElementById('singing-frame');
 try{if(frame?.contentWindow)frame.contentWindow.dispatchEvent(new Event('singing-stop'));}catch{}
 progression.hide();bass.hide();chords.hide();token++;stop();busy=false;playing=false;settings=false;section=button.dataset.section;render();
});}
const chords=createChordScreen({app,storage,navigation:pathNavigation,bindNavigation:bindPathNavigation});
const bass=createBassScreen({app,storage,navigation:pathNavigation,bindNavigation:bindPathNavigation});
const progression=createProgressionScreen({app,storage,navigation:pathNavigation,bindNavigation:bindPathNavigation});
function renderSinging(){
 app.innerHTML=`<header><a class="brand" href="./"><span class="brand-icon">♫</span><span>המסלול להוצאת מוזיקה משמיעה<small>האקדמיה לגיטרה של אמיר פרידמן</small></span></a></header>${pathNavigation()}<main class="singing-main">${location.protocol==='file:'?'<section class="panel"><h1>לשמוע ולשיר</h1><p>לתרגול עם מיקרופון, פתחו את האפליקציה באתר המאובטח.</p><a href="https://friedman100.github.io/ear-training-app/singing/">פתיחת תרגול השירה באתר</a></section>':`<iframe id="singing-frame" src="${import.meta.env.BASE_URL}singing/index.html?embedded=1&v=scale-breath-10" title="לשמוע ולשיר — תרגול שירה" allow="microphone" loading="eager"></iframe>`}</main>`;
 bindPathNavigation();
}
window.addEventListener('message',event=>{
 const frame=document.getElementById('singing-frame');
 if(!frame||event.source!==frame.contentWindow||event.origin!==location.origin||event.data?.type!=='singing-height')return;
 const height=Number(event.data.height);if(Number.isFinite(height))frame.style.height=`${Math.max(700,Math.min(2400,height+8))}px`;
});
const active=()=>state.mode==='guided'?STAGES[state.stage]:state.selected;
function saveSession(){session.current={q,mode:state.mode,range:state.range,wrong};try{storage.setItem(SESSION_KEY,JSON.stringify(session));}catch{notice='לא ניתן לשמור את התרגול בדפדפן הזה.';}}
function save(){saveSession();try{storage.setItem('ear-training-v1',JSON.stringify(state));}catch{notice='לא ניתן לשמור בדפדפן הזה. התרגול זמין, אך ההתקדמות לא תישמר.';}}
function next(){token++;stop();busy=false;playing=false;heard=false;wrong=[];q=question(active(),state.range,state.mode==='guided'?state.history:[]);saveSession();render();}
async function listen(a=q.start,b=q.end){if(busy)return;busy=true;const t=token;render();try{await play(a,b,value=>{if(t===token){playing=value;render();}},()=>{if(t===token){heard=true;render();}},state.playbackType);if(t===token)heard=true;}catch{notice='לא הצלחנו להשמיע. בדקו את עוצמת הקול ונסו שוב.';}finally{if(t===token){busy=false;playing=false;render();}}}
const button=(id,label,cls='')=>`<button id="${id}" class="${cls}">${label}</button>`;
function render(){
 if(section==='progression'){progression.show();return;}
 if(section==='bass'){bass.show();return;}
 if(section==='chords'){chords.show();return;}
 if(section==='singing'){renderSinging();return;}
 if(session.ended){renderSummary();return;}
 const stats=state.stats[state.mode], pct=stats.total?Math.round(100*stats.correct/stats.total):0;
 const n=windowSize(state.stage),target=Math.ceil(n*.8),correctCount=state.history.filter(h=>h.correct).length;
 const progressValue=Math.min(correctCount,target),stagePct=100*progressValue/target;
 const goal=state.stage===10?'השלמת המסלול':`ברמה הבאה - ${STAGES[state.stage+1].at(-1)===6?'יצטרף':'תצטרף'} לתרגול גם ${INTERVALS[STAGES[state.stage+1].at(-1)]}`;
 const finished=state.complete || state.partAComplete&&state.stage===4;
 app.innerHTML=`<header><a class="brand" href="./"><span class="brand-icon">♫</span><span>המסלול להוצאת מוזיקה משמיעה<small>האקדמיה לגיטרה של אמיר פרידמן</small></span></a>${button('settings','⚙ <span>הגדרות</span>','quiet')}</header>${pathNavigation()}
 <main><div class="intro"><h1>לשיר ולזהות מרווחים - זה הבסיס הכי חזק לשמיעה שלכם</h1><p>(גם 80% זה כבר מצב טוב מאוד למיומנות העיקרית שאתם מפתחים פה)</p></div>
 <nav aria-label="מצב תרגול">${button('guided','מסלול מודרך',state.mode==='guided'?'selected':'')}${button('free','תרגול חופשי',state.mode==='free'?'selected':'')}</nav>
 <div class="layout"><section class="practice panel ${playing?'is-playing':''}"><div class="card-top"><span class="badge">${state.mode==='guided'?`חלק ${state.stage<5?'א׳':'ב׳'} · שלב ${state.stage+1}`:'בקצב שלכם'}</span><span class="muted">פסנתר · ${PLAYBACK_TYPES[state.playbackType]}</span></div>
 <div class="session-counter" role="status" aria-label="הצלחות בתרגול הנוכחי"><span><strong>${session.correct} מתוך ${session.total} נכונים</strong><small>בניסיון הראשון</small></span></div>

 <div class="sound-art" aria-hidden="true"><span></span><span></span><span></span><span></span><span></span><span></span><span></span><span></span><span></span></div>
 <h2>איזה מרווח מנוגן פה?</h2><p class="exercise-instruction">הקשיבו לשני הצלילים, שירו אותם ובחרו את התשובה</p>
 <div class="practice-actions">${button('listen',busy?(playing?'◌ &nbsp; משמיע…':'◌ &nbsp; מכין צלילים…'):heard?'▶ &nbsp; האזנה חוזרת':'▶ &nbsp; האזנה למרווח','play')}${q.solved?button('next','<span aria-hidden="true">→</span><span>המרווח הבא</span>','next'):''}</div>
 <div class="listen-hint">אפשר להקשיב שוב, כמה שרוצים</div>

 <div class="answers">${[...active()].sort((a,b)=>a-b).map(id=>`<button data-answer="${id}" ${!heard||q.solved?'disabled':''} class="answer ${wrong.includes(id)?'wrong':''} ${q.solved&&id===q.interval?'correct':''}">${INTERVALS[id]}${q.solved&&id===q.interval?' ✓':wrong.includes(id)?' ×':''}<small class="interval-english" lang="en" dir="ltr">${ENGLISH_INTERVALS[id]}</small></button>`).join('')}</div>
 <div class="feedback" role="status">${q.solved?'יפה מאוד! זיהיתם את המרווח.':wrong.length?'עוד ניסיון — הקשיבו שוב ונסו תשובה אחרת.':heard?'קחו את הזמן. האוזן לומדת בכל ניסיון.':'לחצו על האזנה כדי להתחיל.'}</div>
 ${state.mode==='guided'?`<section class="unlock-progress" aria-label="התקדמות למרווח הבא">${finished?`<p class="success-text">${state.complete?'המסלול הושלם!':'חלק א׳ הושלם — אפשר לעבור לחלק ב׳.'}</p>`:`<div class="progress-label"><span>${goal}</span><b dir="ltr">${progressValue} / ${target}</b></div><div class="track" role="progressbar" aria-label="תשובות נכונות לקראת השלב הבא" aria-valuemin="0" aria-valuemax="${target}" aria-valuenow="${progressValue}" aria-valuetext="${correctCount} תשובות נכונות מתוך יעד של ${target}"><i style="width:${stagePct}%"></i></div>`}</section>`:''}
 <div class="practice-end">${button('end-session','סיום תרגול','end-session')}</div>
 </section><aside><div class="range-setting"><label for="piano-range">⚙ מנעד הפסנתר</label><select id="piano-range" aria-describedby="range-position">${[['low','נמוך'],['middle','אמצעי'],['high','גבוה']].map(([id,name])=>`<option value="${id}" ${state.range===id?'selected':''}>${name}</option>`).join('')}</select><span id="range-position" dir="ltr" title="טווח התווים במקלדת">${{low:'C3–C5',middle:'C4–C6',high:'C5–C7'}[state.range]}</span></div><div class="range-setting playback-setting"><label for="playback-type">אופן ההשמעה</label><select id="playback-type">${Object.entries(PLAYBACK_TYPES).map(([id,label])=>`<option value="${id}" ${state.playbackType===id?'selected':''}>${label}</option>`).join('')}</select></div><section class="panel progress"><div class="section-title"><span class="tiny-icon">↗</span><h3>${state.mode==='guided'?'המסלול שלכם':'בוחרים מה לתרגל'}</h3></div>
 ${state.mode==='guided'?`<p>מתקדמים צעד־צעד, בונים ביטחון.</p><div class="steps">${STAGES.map((s,i)=>`<div class="step ${i===state.stage?'current':''} ${i<state.stage?'done':''}"><span class="step-number">${i<state.stage?'✓':i+1}</span><span>${i===0?'קוורטה וקווינטה זכות':INTERVALS[s.at(-1)]}<small class="interval-english" lang="en" dir="ltr">${i===0?'Perfect 4th / Perfect 5th':ENGLISH_INTERVALS[s.at(-1)]}</small>${i===5?'<small>תחילת חלק ב׳</small>':''}</span><span class="step-status">${i===state.stage?'בתרגול':i>state.stage?'·':''}</span></div>`).join('')}</div>${state.partAComplete&&state.stage===4?button('partB','חלק א׳ הושלם! מעבר לחלק ב׳','next'):''}${state.complete?'<p class="success-text">כל המרווחים פתוחים. ממשיכים לתרגל!</p>':''}`:
 `<p>בחרו מרווח אחד או יותר. ההתקדמות במסלול המודרך נשמרת בנפרד.</p><div class="choices">${INTERVALS.slice(1).map((name,i)=>`<label><input type="checkbox" value="${i+1}" ${state.selected.includes(i+1)?'checked':''}><span>${name}<small class="interval-english" lang="en" dir="ltr">${ENGLISH_INTERVALS[i+1]}</small></span></label>`).join('')}</div>`}</section></aside></div>
 <section class="stats" aria-label="מדדי הצלחה"><div><span class="stat-icon">⚡</span><strong>${stats.streak}</strong><span>רצף הצלחות בניסיון הראשון</span></div><div><span class="stat-icon">◎</span><strong>${pct}<small>%</small></strong><span>הצלחה בניסיון הראשון</span></div><div><span class="stat-icon">♫</span><strong>${stats.total}</strong><span>שאלות שתרגלתם במצב הזה</span></div></section>
 <p class="save-note">◈ ההתקדמות נשמרת אוטומטית בדפדפן הזה</p>${notice?`<p role="alert" class="notice">${notice}</p>`:''}</main><footer>תזכרו - לשיר זה המפתח של שמיעה טובה<span>האקדמיה לגיטרה של אמיר פרידמן - המסלול להוצאת מוזיקה משמיעה</span></footer><p class="piano-credit">פסנתר: Salamander Grand Piano V3 · Alexander Holm · <a href="https://creativecommons.org/licenses/by/3.0/" target="_blank" rel="noopener noreferrer">CC BY 3.0</a></p>
 ${settings?`<dialog aria-labelledby="settings-title"><h2 id="settings-title">הגדרות צליל</h2><p>בחרו את המנעד הנוח לכם. שני הצלילים תמיד בתוכו.</p><div class="ranges">${[['low','נמוך','C3–C5'],['middle','אמצעי','C4–C6'],['high','גבוה','C5–C7']].map(([id,name,notes])=>`<button data-range="${id}" class="${state.range===id?'selected':''}">${name}<small dir="ltr">${notes}</small></button>`).join('')}</div>${button('close-settings','חזרה לתרגול','next')}</dialog>`:''}
 ${state.mode==='guided'&&state.pending?`<dialog aria-labelledby="unlock-title"><span class="eyebrow">כל הכבוד!</span><h2 id="unlock-title">${typeof state.pending==='number'?`מרווח חדש נפתח: ${INTERVALS[state.pending]}`:state.pending==='partB'?'השלמתם את חלק א׳!':'השלמתם את המסלול!'}</h2>${typeof state.pending==='number'?`<small class="interval-english" lang="en" dir="ltr">${ENGLISH_INTERVALS[state.pending]}</small>`:''}<p>${typeof state.pending==='number'?'הקשיבו למרווח החדש לפני שממשיכים. הוא מצטרף לכל המרווחים שכבר למדתם.':state.pending==='partB'?'אפשר להמשיך לתרגל כאן, או להתקדם לחלק ב׳ ולהכיר את הטריטון.':'כל המרווחים עד אוקטבה פתוחים. התרגול ממשיך ללא הגבלה.'}</p>${typeof state.pending==='number'?button('demo',busy?'משמיע…':'▶ האזנה למרווח החדש','play'):''}${state.pending==='partB'?button('partB','אני מוכן/ה לחלק ב׳','next'):''}${button('continue',state.pending==='partB'?'להמשיך לתרגל בחלק א׳':'ממשיכים לתרגל','quiet')}</dialog>`:''}`;
 bind();
 const dialogs=document.querySelectorAll("dialog");const dialog=dialogs[dialogs.length-1];if(dialog){dialog.addEventListener("cancel",e=>e.preventDefault());dialog.showModal();}
}
function bind(){
 bindPathNavigation();
 const on=(id,fn)=>document.getElementById(id)?.addEventListener('click',fn);
 on('end-session',()=>{token++;stop();busy=false;playing=false;settings=false;session.ended=true;saveSession();render();});
 on('listen',()=>listen());on('next',()=>{next();listen();});on('settings',()=>{settings=true;render();});on('close-settings',()=>{settings=false;render();});
 ['guided','free'].forEach(mode=>on(mode,()=>{state.mode=mode;save();next();}));
 document.querySelectorAll('[data-answer]').forEach(b=>b.onclick=()=>{
 const id=Number(b.dataset.answer);const result=answer(q,id);if(result.ignored||!heard)return;
 // Persist completion independently of guided progression and its unlock dialogs.
 if(result.q.solved&&!q.sessionRecorded){session=completeQuestion(session,result.q);result.q.sessionRecorded=true;q=result.q;saveSession();}
 if(result.first){const previous=state.stage;state=record(state,q,result.correct);if(state.mode==='guided'&&state.stage>previous)session=noteUnlocks(session,STAGES[state.stage].filter(id=>!STAGES[previous].includes(id)));}
 q=result.q;if(!result.correct&&!wrong.includes(id))wrong.push(id);save();render();
 });
 const playbackSelect=document.getElementById('playback-type');if(playbackSelect){playbackSelect.value=state.playbackType;playbackSelect.onchange=()=>{if(state.playbackType===playbackSelect.value)return;state.playbackType=playbackSelect.value;save();next();};}
 const rangeSelect=document.getElementById('piano-range');if(rangeSelect)rangeSelect.value=state.range;if(rangeSelect)rangeSelect.onchange=()=>{if(state.range===rangeSelect.value)return;state.range=rangeSelect.value;save();next();};
 document.querySelectorAll('[data-range]').forEach(b=>b.onclick=()=>{if(state.range===b.dataset.range)return;state.range=b.dataset.range;save();next();});
 document.querySelectorAll('input[type=checkbox]').forEach(b=>b.onchange=()=>{
 const id=Number(b.value);if(!b.checked&&state.selected.length===1){b.checked=true;notice='יש לבחור לפחות מרווח אחד.';render();return;}
 state.selected=b.checked?[...state.selected,id]:state.selected.filter(n=>n!==id);save();next();
 });
 on('demo',()=>{const start={low:48,middle:60,high:72}[state.range];listen(start,start+state.pending);});
 on('continue',()=>{state.pending=null;save();render();});
 on('partB',()=>{session=noteUnlocks(session,[6]);state.stage=5;state.history=[];state.pending=6;save();next();});
}
q=restoreQuestion(session.current,active(),state.range,state.mode,RANGES[state.range]);
// Recover a completed current question from earlier files with an empty session summary.
if(q?.solved&&session.total===0&&!q.sessionRecorded){session=completeQuestion(session,q);q.sessionRecorded=true;saveSession();}
if(session.ended)render();
else if(q){wrong=Array.isArray(session.current.wrong)?session.current.wrong.filter(id=>active().includes(id)):[];render();}
else next();

function renderSummary(){
 const pct=session.total?Math.round(100*session.correct/session.total):0;
 app.innerHTML=`<header><span class="brand"><span class="brand-icon">♫</span><span>המסלול להוצאת מוזיקה משמיעה<small>האקדמיה לגיטרה של אמיר פרידמן</small></span></span></header>${pathNavigation()}<main class="summary"><span class="eyebrow">זמן להסתכל על ההתקדמות</span><h1>סיכום התרגול שלכם</h1><p>הנתונים מתייחסים לתרגול הנוכחי בלבד, במסלול המודרך ובמצב החופשי.</p>
 ${session.total?`<section class="stats summary-stats" aria-label="סיכום התרגול"><div><strong>${session.total}</strong><span>מרווחים שהשלמתם</span></div><div><strong>${pct}<small>%</small></strong><span>הצלחה בניסיון הראשון</span></div><div><strong>${session.best}</strong><span>רצף ההצלחות המרבי בניסיון הראשון</span></div></section><section class="panel summary-details"><h2>ההצלחה שלכם בכל מרווח</h2><div class="summary-table"><table><thead><tr><th scope="col">מרווח</th><th scope="col">הצלחה בניסיון הראשון</th><th scope="col">הצלחות מתוך שאלות</th></tr></thead><tbody>${Object.entries(session.intervals).sort(([a],[b])=>a-b).map(([id,row])=>`<tr><th scope="row">${INTERVALS[id]}<small class="interval-english" lang="en" dir="ltr">${ENGLISH_INTERVALS[id]}</small></th><td>${Math.round(100*row.correct/row.total)}%</td><td>${row.correct} מתוך ${row.total}</td></tr>`).join('')}</tbody></table></div></section>`:`<section class="panel empty-summary" role="status"><h2>עדיין לא השלמתם שאלה בתרגול הזה</h2><p>שאלה נספרת רק אחרי שמזהים נכון את המרווח, גם אם נדרשו כמה ניסיונות. אפשר להתחיל תרגול חדש כשנוח לכם.</p></section>`}
 <section class="panel summary-unlocks"><h2>מרווחים חדשים שנפתחו</h2>${session.unlocked.length?`<ul>${session.unlocked.map(id=>`<li>${INTERVALS[id]} <span class="interval-english" lang="en" dir="ltr">${ENGLISH_INTERVALS[id]}</span></li>`).join('')}</ul>`:'<p>לא נפתחו מרווחים חדשים במסלול המודרך במהלך התרגול הזה.</p>'}</section><p class="fine">שאלות שלא הושלמו אינן נכללות בסיכום. ההתקדמות במסלול וההגדרות שלכם שמורות.</p>${button('new-session','תרגול חדש','next')} ${notice?`<p role="alert">${notice}</p>`:''}</main>`;
 bindPathNavigation();
 document.getElementById('new-session').onclick=()=>{session=newSession();next();};
}
