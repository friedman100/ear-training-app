import {SONGS,SONG_KEY,findSong,findPart,loadSongs,openSongPart,songEntry,newSongRound,submitSong,songAnswerPlan,songSource} from './songs.js';
import {renderBassKeyboard} from './bass-keyboard.js';
import {noteName} from './bass.js';
import {CHORDS} from './chords.js';
import {playSongSequence,stop} from './audio.js';
import {createSongMediaPlayer,playerMarkup,formatTime} from './song-player.js';
export function createSongScreen({app,storage,navigation,bindNavigation}){
 let state=loadSongs(storage),visible=false,view='library',loaded='',token=0,busy=false,preview=null,scroll=0,notice='',successOpen=false;
 const $=id=>document.getElementById('songs-'+id),button=(id,label,cls='',disabled=false)=>`<button id="songs-${id}" class="${cls}" ${disabled?'disabled':''}>${label}</button>`;
 const on=(id,fn)=>$(id)?.addEventListener('click',fn);
 const player=createSongMediaPlayer({document,beforePlay:()=>{cancelPreview();if($('preview-stop'))$('preview-stop').disabled=true;}});
 const header=()=>`<header><a class="brand" href="./"><span class="brand-icon">♫</span><span>המסלול להוצאת מוזיקה משמיעה<small>האקדמיה לגיטרה של אמיר פרידמן</small></span></a></header>${navigation()}`;
 function save(){try{storage.setItem(SONG_KEY,JSON.stringify(state));}catch{notice='לא ניתן לשמור בדפדפן הזה. אפשר להמשיך לתרגל.';}}
 function cancelPreview(){token++;stop();busy=false;}
 function library(){cancelPreview();player.hide();view='library';successOpen=false;render();}
 function open(song,part){cancelPreview();player.pause();state=openSongPart(state,song,part);loaded='';view='practice';preview=null;successOpen=false;save();render();}
 async function audition(kind='qualities',midi=null){
 const song=findSong(state.selected.songId),part=findPart(song,state.selected.partId),r=songEntry(state,song.id,part.id).round;
 cancelPreview();player.pause();busy=true;const request=token;
 const {plan,spacing}=kind==='key'?{plan:[{midi,offset:0,level:.75}],spacing:1.6}:songAnswerPlan(song,part,r,kind,player.rate);
 render();try{await playSongSequence(plan,spacing);}catch{if(request===token)notice='לא הצלחנו להשמיע את הפסנתר. נסו שוב.';}
 finally{if(request===token&&visible){busy=false;render();}}
 }
 function renderPractice(html){
 const recording=document.getElementById('songs-recording');
 const template=document.createElement('template');template.innerHTML=html;
 if(!recording||recording.dataset.song!==template.content.querySelector('#songs-recording')?.dataset.song){player.hide();app.innerHTML=html;return;}
 const nextMain=template.content.querySelector('main'),main=recording.parentElement;
 for(const child of [...main.childNodes])if(child!==recording)child.remove();
 let after=false;for(const child of [...nextMain.childNodes]){if(child.id==='songs-recording'){after=true;continue;}if(after)main.append(child);else main.insertBefore(child,recording);}
 app.querySelector('dialog')?.remove();const dialog=template.content.querySelector('dialog');if(dialog)app.append(dialog);
 }
 function render(){
 if(!visible)return;
 if(view==='library'){
 app.innerHTML=`${header()}<main class="song-library"><div class="intro"><span class="eyebrow">רמה 1 · שלב 6</span><h1>הוצאת שירים משמיעה</h1><p class="exercise-instruction">מקשיבים להקלטה, מוצאים את הבס ומזהים את האקורדים — חלק אחר חלק.</p></div><div class="song-cards">${SONGS.map(song=>{const done=song.parts.filter(p=>songEntry(state,song.id,p.id)?.completed).length;return `<article class="panel song-card"><span class="badge">${song.difficulty}</span><h2>${song.title}</h2><p>${song.artist}</p><p>${song.description}</p><p class="song-card-meta">${song.duration?formatTime(song.duration):'YouTube'} · ${song.parts.length} חלקים · ${done} הושלמו</p><button data-song-open="${song.id}" class="next">${done?'חזרה לתרגול':'פתיחת השיר'} →</button></article>`;}).join('')}</div><p class="save-note">◈ ההתקדמות נשמרת בנפרד לכל שיר ולכל חלק</p></main>`;
 bindNavigation();document.querySelectorAll('[data-song-open]').forEach(b=>b.onclick=()=>{const song=findSong(b.dataset.songOpen),part=state.selected?.songId===song.id?findPart(song,state.selected.partId):null;open(song,part??song.parts[0]);});return;
 }
 const song=findSong(state.selected?.songId),part=findPart(song,state.selected?.partId);if(!song||!part){library();return;}
 const old=document.querySelector('.bass-keyboard-scroll');if(old)scroll=old.scrollLeft;
 const entry=songEntry(state,song.id,part.id),r=entry.round,bassStage=r.stage==='bass',filled=r.answer.every(Number.isInteger),chosen=r.qualities.every(v=>v!==null),n=part.chords.length;
 renderPractice(`${header()}<main class="bass-screen song-screen"><div class="intro"><span class="eyebrow">רמה 1 · שלב 6</span><h1>${song.title}</h1><p>${song.artist} · ${song.difficulty}</p>${button('library','→ ספריית השירים','quiet')}</div><div class="song-parts" role="group" aria-label="בחירת חלק בשיר">${song.parts.map(p=>`<button data-song-part="${p.id}" aria-pressed="${p.id===part.id}">${p.name}<small><span dir="ltr">${formatTime(p.start)}–${formatTime(p.end)}</span>${songEntry(state,song.id,p.id)?.completed?' · ✓ הושלם':''}</small></button>`).join('')}</div>
 <div id="songs-recording" data-song="${song.id}">${playerMarkup(song)}</div><p class="song-arrangement-note">${part.name}: מצאו את המהלך בן ${n} האקורדים שחוזר בקטע. אפשר להאט, לסמן לופ ולחפש בגיטרה או במקלדת.${!song.bpm?' הדגמת התשובה בפסנתר היא בקצב קבוע להשוואת הצלילים.':''}</p>
 <ol class="progression-stages"><li ${bassStage?'aria-current="step"':''}>${bassStage?'1.':'✓'} הוצאת הבס</li><li ${!bassStage?'aria-current="step"':''}>2. זיהוי האקורדים</li></ol>
 <section class="panel bass-practice"><h2>${bassStage?'מצאו את צלילי הבס בהקלטה':r.completed?'כל הכבוד! הוצאתם את החלק נכון':'הבס נכון! עכשיו זהו מז׳ור או מינור'}</h2>
 ${bassStage?`<p class="bass-help">האזינו להקלטה ונסו לשיר את הבס. לחיצה על קליד משמיעה אותו בלבד. „הכנס למשבצת” שומר את הבחירה. אותו צליל באוקטבה אחרת מתקבל.</p><div class="bass-slots" style="--song-notes:${n}" aria-label="רצף צלילי הבס">${r.answer.map((midi,i)=>`<button data-song-slot="${i}" aria-pressed="${r.active===i}" class="bass-slot ${r.active===i?'active':''} ${r.bassResult?(r.bassResult.matches[i]?'correct':'wrong'):''}"><small>צליל ${i+1}</small><strong>${midi===null?'?':noteName(midi)}</strong>${r.bassResult?`<span>${r.bassResult.matches[i]?'✓ נכון':'× נסו שוב'}</span>`:''}</button>`).join('')}</div>${renderBassKeyboard(preview,'data-song-key')}<div class="bass-preview-actions"><p role="status">${preview===null?'אפשר להקשיב לכמה קלידים שרוצים לפני שבוחרים.':`הצליל להאזנה: ${noteName(preview)}`}</p>${button('insert',`הכנס למשבצת ${r.active+1}`,'bass-secondary',preview===null)}</div><div class="bass-answer-actions">${button('bass-answer','▶ השמע את רצף הבס שלי','bass-secondary',!filled)}${button('check','בדוק תשובה','next',!filled)}</div><div role="status" class="bass-feedback">${r.bassResult?`זיהיתם ${r.bassResult.count} מתוך ${n} צלילים. אפשר לתקן ולנסות שוב.`:''}</div>`:
 `<p class="bass-help">בחרו את סוג האקורד ליד כל בס שמצאתם. השמיעו את המהלך שלכם והשוו להקלטה.</p><div class="progression-chords">${part.chords.map((chord,i)=>`<section class="progression-chord ${r.qualityResult?(r.qualityResult.matches[i]?'correct':'wrong'):''}"><span class="muted">אקורד ${i+1}</span><h3>${chord.hebrew}<span lang="en" dir="ltr">${chord.english}</span></h3><div class="progression-quality" role="group" aria-label="סוג אקורד ${i+1}">${[['major','מז׳ור',CHORDS[1].symbol],['minor','מינור',CHORDS[2].symbol]].map(([value,label,en])=>`<button data-song-quality="${i}:${value}" aria-pressed="${r.qualities[i]===value}" ${r.completed?'disabled':''}>${label}<small class="interval-english" lang="en" dir="ltr">${en}</small></button>`).join('')}</div>${r.qualityResult?`<p>${r.qualityResult.matches[i]?'✓ נכון':'× נסו שוב'}</p>`:''}</section>`).join('')}</div><div class="bass-answer-actions">${button('answer','▶ השמע את המהלך שלי','bass-secondary',!chosen)}${button('check','בדוק תשובה','next',!chosen||r.completed)}</div><div role="status" class="bass-feedback">${r.qualityResult?`זיהיתם ${r.qualityResult.count} מתוך ${n} אקורדים.`:''}</div>`}
 ${button('preview-stop','■ עצור את צלילי התשובה','bass-stop',!busy)}
 ${r.completed?`<section class="bass-solution song-success"><h3>המהלך שהוצאתם ב${part.name}</h3><ol>${part.chords.map(c=>`<li><strong lang="en" dir="ltr">${c.english}${c.quality==='minor'?'m':''}</strong><span>${c.hebrew} ${c.quality==='minor'?'מינור':'מז׳ור'}</span></li>`).join('')}</ol>${button('review','▶ השמע את המהלך','bass-secondary')}${button('retry','תרגול מחדש של החלק','quiet')}${button('back','לספריית השירים','next')}</section>`:''}</section><p class="save-note">◈ התשובות וההשלמה נשמרות לשיר ולחלק הזה בלבד</p>${notice?`<p role="alert" class="notice">${notice}</p>`:''}</main><p class="piano-credit">${songSource(song).type==='audio'?'הקלטת דוגמה מקורית · ':''}פסנתר לתשובות: Salamander Grand Piano V3 · Alexander Holm · <a href="https://creativecommons.org/licenses/by/3.0/" target="_blank" rel="noopener noreferrer">CC BY 3.0</a></p>
 ${successOpen&&songSource(song).type!=='youtube'?`<dialog id="songs-success-dialog" class="progression-success-dialog" aria-labelledby="songs-success-title"><span class="progression-success-icon" aria-hidden="true">✓</span><h2 id="songs-success-title">כל הכבוד! הוצאתם את ${part.name}</h2><p>השלמת החלק נשמרה. אפשר להמשיך להאזין ולתרגל, או לחזור לספרייה.</p>${button('popup-library','לספריית השירים','next')}${button('popup-stay','להישאר ולהאזין','quiet')}</dialog>`:''}`);
 bindNavigation();const key=song.id+':'+part.id;if(loaded!==key){const base=location.protocol==='file:'?'https://friedman100.github.io/ear-training-app/':import.meta.env.BASE_URL;player.setPart(song,part,base+songSource(song).src);loaded=key;}player.bind();const keyboard=document.querySelector('.bass-keyboard-scroll');if(keyboard)keyboard.scrollLeft=scroll;
 on('library',library);on('back',library);on('popup-library',library);on('popup-stay',()=>{successOpen=false;render();});
 document.querySelectorAll('[data-song-part]').forEach(b=>b.onclick=()=>open(song,findPart(song,b.dataset.songPart)));
 document.querySelectorAll('[data-song-slot]').forEach(b=>b.onclick=()=>{if(!bassStage)return;r.active=Number(b.dataset.songSlot);preview=null;save();render();});
 document.querySelectorAll('[data-song-key]').forEach(b=>b.onclick=()=>{preview=Number(b.dataset.songKey);audition('key',preview);});
 on('insert',()=>{if(!bassStage||preview===null)return;r.answer[r.active]=preview;r.active=Math.min(n-1,r.active+1);r.bassResult=null;preview=null;save();render();});
 document.querySelectorAll('[data-song-quality]').forEach(b=>b.onclick=()=>{if(bassStage||r.completed)return;const [index,value]=b.dataset.songQuality.split(':');r.qualities[Number(index)]=value;r.qualityResult=null;save();render();});
 on('bass-answer',()=>{if(filled)audition('bass');});on('answer',()=>{if(chosen)audition();});on('review',()=>audition());on('preview-stop',()=>{cancelPreview();render();});
 on('check',()=>{if(r.completed||!(bassStage?filled:chosen))return;state=submitSong(state,song,part);successOpen=songEntry(state,song.id,part.id).round.completed;save();render();});
 on('retry',()=>{cancelPreview();entry.round=newSongRound(part);preview=null;successOpen=false;save();render();});
 const dialog=$('success-dialog');if(dialog){dialog.addEventListener('cancel',event=>{event.preventDefault();successOpen=false;render();});dialog.showModal();}
 }
 return {show(){visible=true;render();},hide(){visible=false;successOpen=false;cancelPreview();player.hide();}};
}
