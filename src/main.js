import './style.css';
import {INTERVALS,STAGES,windowSize,initialState,question,answer,record,load} from './logic.js';
import {play,stop} from './audio.js';
let storage;try{storage=localStorage;}catch{storage={getItem:()=>null,setItem:()=>{throw new Error('Storage unavailable');}};}
let state=load(storage),q,heard=false,busy=false,wrong=[],notice='',settings=false,token=0;
const app=document.querySelector('#app');
const active=()=>state.mode==='guided'?STAGES[state.stage]:state.selected;
function save(){try{storage.setItem('ear-training-v1',JSON.stringify(state));}catch{notice='לא ניתן לשמור בדפדפן הזה. התרגול זמין, אך ההתקדמות לא תישמר.';}}
function next(){token++;stop();busy=false;heard=false;wrong=[];q=question(active(),state.range,state.mode==='guided'?state.history:[]);render();}
async function listen(a=q.start,b=q.end){if(busy)return;busy=true;const t=token;render();try{await play(a,b);if(t===token)heard=true;}catch{notice='לא הצלחנו להשמיע. בדקו את עוצמת הקול ונסו שוב.';}finally{if(t===token){busy=false;render();}}}
const button=(id,label,cls='')=>`<button id="${id}" class="${cls}">${label}</button>`;
function render(){
 const stats=state.stats[state.mode], pct=stats.total?Math.round(100*stats.correct/stats.total):0;
 const n=windowSize(state.stage),stagePct=Math.min(100,100*state.history.length/n);
 app.innerHTML=`<header><a class="brand" href="./"><span class="brand-icon">♫</span><span>אוזן מוזיקלית<small>האקדמיה לגיטרה</small></span></a>${button('settings','⚙ <span>הגדרות</span>','quiet')}</header>
 <main><div class="intro"><span class="eyebrow">מקשיבים. מזהים. מתקדמים.</span><h1>כל מרווח מתחיל בהקשבה.</h1><p>כמה דקות של תרגול, צעד גדול לאוזן המוזיקלית שלכם.</p></div>
 <nav aria-label="מצב תרגול">${button('guided','מסלול מודרך',state.mode==='guided'?'selected':'')}${button('free','תרגול חופשי',state.mode==='free'?'selected':'')}</nav>
 <div class="layout"><section class="practice panel"><div class="card-top"><span class="badge">${state.mode==='guided'?`חלק ${state.stage<5?'א׳':'ב׳'} · שלב ${state.stage+1}`:'בקצב שלכם'}</span><span class="muted">פסנתר · מרווח עולה</span></div>
 <div class="sound-art" aria-hidden="true"><span></span><span></span><span></span><span></span><span></span><span></span><span></span><span></span><span></span></div>
 <h2>איזה מרווח שמעתם?</h2><p class="muted">הקשיבו לשני הצלילים ובחרו את המרווח ביניהם.</p>
 ${button('listen',busy?'◌ &nbsp; משמיע…':heard?'▶ &nbsp; האזנה חוזרת':'▶ &nbsp; האזנה למרווח','play')}
 <div class="listen-hint">אפשר להקשיב שוב, כמה שרוצים</div>
 <div class="answers">${[...active()].sort((a,b)=>a-b).map(id=>`<button data-answer="${id}" ${!heard||busy||q.solved?'disabled':''} class="answer ${wrong.includes(id)?'wrong':''} ${q.solved&&id===q.interval?'correct':''}">${INTERVALS[id]}${q.solved&&id===q.interval?' ✓':wrong.includes(id)?' ×':''}</button>`).join('')}</div>
 <div class="feedback" role="status">${q.solved?'יפה מאוד! זיהיתם את המרווח.':wrong.length?'עוד ניסיון — הקשיבו שוב ונסו תשובה אחרת.':heard?'קחו את הזמן. האוזן לומדת בכל ניסיון.':'לחצו על האזנה כדי להתחיל.'}</div>
 ${q.solved?button('next','המרווח הבא ←','next'):''}
 </section><aside><section class="panel progress"><div class="section-title"><span class="tiny-icon">↗</span><h3>${state.mode==='guided'?'המסלול שלכם':'בוחרים מה לתרגל'}</h3></div>
 ${state.mode==='guided'?`<p>מתקדמים צעד־צעד, בונים ביטחון.</p><div class="steps">${STAGES.map((s,i)=>`<div class="step ${i===state.stage?'current':''} ${i<state.stage?'done':''}"><span class="step-number">${i<state.stage?'✓':i+1}</span><span>${i===0?'קוורטה וקווינטה זכות':INTERVALS[s.at(-1)]}${i===5?'<small>תחילת חלק ב׳</small>':''}</span><span class="step-status">${i===state.stage?'בתרגול':i>state.stage?'·':''}</span></div>`).join('')}</div><div class="progress-label"><span>חלון התקדמות</span><b>${state.history.length} / ${n}</b></div><div class="track"><i style="width:${stagePct}%"></i></div><p class="fine">מרווח חדש נפתח ב־80% הצלחה בניסיון הראשון, בחלון מלא המכסה את כל המרווחים הפעילים.</p>${state.partAComplete&&state.stage===4?button('partB','חלק א׳ הושלם! מעבר לחלק ב׳','next'):''}${state.complete?'<p class="success-text">כל המרווחים פתוחים. ממשיכים לתרגל!</p>':''}`:
 `<p>בחרו מרווח אחד או יותר. ההתקדמות במסלול המודרך נשמרת בנפרד.</p><div class="choices">${INTERVALS.slice(1).map((name,i)=>`<label><input type="checkbox" value="${i+1}" ${state.selected.includes(i+1)?'checked':''}>${name}</label>`).join('')}</div>`}</section></aside></div>
 <section class="stats" aria-label="מדדי הצלחה"><div><span class="stat-icon">⚡</span><strong>${stats.streak}</strong><span>רצף הצלחות בניסיון הראשון</span></div><div><span class="stat-icon">◎</span><strong>${pct}<small>%</small></strong><span>הצלחה בניסיון הראשון</span></div><div><span class="stat-icon">♫</span><strong>${stats.total}</strong><span>שאלות שתרגלתם במצב הזה</span></div></section>
 <p class="save-note">◈ ההתקדמות נשמרת אוטומטית בדפדפן הזה</p>${notice?`<p role="alert" class="notice">${notice}</p>`:''}</main><footer>קצת בכל יום. מוזיקה לכל החיים.<span>האקדמיה לגיטרה · פיתוח שמיעה</span></footer>
 ${settings?`<dialog aria-labelledby="settings-title"><h2 id="settings-title">הגדרות צליל</h2><p>בחרו את המנעד הנוח לכם. שני הצלילים תמיד בתוכו.</p><div class="ranges">${[['low','נמוך','C3–C5'],['middle','אמצעי','C4–C6'],['high','גבוה','C5–C7']].map(([id,name,notes])=>`<button data-range="${id}" class="${state.range===id?'selected':''}">${name}<small dir="ltr">${notes}</small></button>`).join('')}</div>${button('close-settings','חזרה לתרגול','next')}</dialog>`:''}
 ${state.mode==='guided'&&state.pending?`<dialog aria-labelledby="unlock-title"><span class="eyebrow">כל הכבוד!</span><h2 id="unlock-title">${typeof state.pending==='number'?`מרווח חדש נפתח: ${INTERVALS[state.pending]}`:state.pending==='partB'?'השלמתם את חלק א׳!':'השלמתם את המסלול!'}</h2><p>${typeof state.pending==='number'?'הקשיבו למרווח החדש לפני שממשיכים. הוא מצטרף לכל המרווחים שכבר למדתם.':state.pending==='partB'?'אפשר להמשיך לתרגל כאן, או להתקדם לחלק ב׳ ולהכיר את הטריטון.':'כל המרווחים עד אוקטבה פתוחים. התרגול ממשיך ללא הגבלה.'}</p>${typeof state.pending==='number'?button('demo',busy?'משמיע…':'▶ האזנה למרווח החדש','play'):''}${state.pending==='partB'?button('partB','אני מוכן/ה לחלק ב׳','next'):''}${button('continue',state.pending==='partB'?'להמשיך לתרגל בחלק א׳':'ממשיכים לתרגל','quiet')}</dialog>`:''}`;
 bind();
 const dialogs=document.querySelectorAll("dialog");const dialog=dialogs[dialogs.length-1];if(dialog){dialog.addEventListener("cancel",e=>e.preventDefault());dialog.showModal();}
}
function bind(){
 const on=(id,fn)=>document.getElementById(id)?.addEventListener('click',fn);
 on('listen',()=>listen());on('next',next);on('settings',()=>{settings=true;render();});on('close-settings',()=>{settings=false;render();});
 ['guided','free'].forEach(mode=>on(mode,()=>{state.mode=mode;save();next();}));
 document.querySelectorAll('[data-answer]').forEach(b=>b.onclick=()=>{
 const id=Number(b.dataset.answer);const result=answer(q,id);if(result.ignored||!heard||busy)return;
 if(result.first)state=record(state,q,result.correct);
 q=result.q;if(!result.correct&&!wrong.includes(id))wrong.push(id);save();render();
 });
 document.querySelectorAll('[data-range]').forEach(b=>b.onclick=()=>{state.range=b.dataset.range;save();next();});
 document.querySelectorAll('input[type=checkbox]').forEach(b=>b.onchange=()=>{
 const id=Number(b.value);if(!b.checked&&state.selected.length===1){b.checked=true;notice='יש לבחור לפחות מרווח אחד.';render();return;}
 state.selected=b.checked?[...state.selected,id]:state.selected.filter(n=>n!==id);save();next();
 });
 on('demo',()=>{const start={low:48,middle:60,high:72}[state.range];listen(start,start+state.pending);});
 on('continue',()=>{state.pending=null;save();render();});
 on('partB',()=>{state.stage=5;state.history=[];state.pending=6;save();next();});
}
next();
