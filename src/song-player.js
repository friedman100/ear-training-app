import {songSource} from './songs.js';
import {createYouTubeMedia} from './youtube-media.js';
export const formatTime=seconds=>{const n=Math.max(0,Math.floor(Number(seconds)||0));return `${Math.floor(n/60)}:${String(n%60).padStart(2,'0')}`;};
export const validLoop=(start,end,duration)=>Number.isFinite(start)&&Number.isFinite(end)&&start>=0&&end>start+.1&&end<=duration;
export function playerMarkup(song){const source=song? songSource(song):null;return `<section class="song-player panel" aria-label="נגן ההקלטה">${source?.type==='youtube'?`<div class="song-youtube"><div id="song-youtube-frame"></div></div><p id="song-youtube-status" role="status"></p><p><button id="song-youtube-retry" class="quiet">טעינת הנגן מחדש</button> · <a href="https://www.youtube.com/watch?v=${source.videoId}" target="_blank" rel="noopener">פתיחה ב־YouTube</a></p><p class="muted">הלופ ב־YouTube עשוי לסטות מעט בנקודת החזרה.</p>`:''}<div class="song-player-top"><button id="song-play" class="play">▶ ניגון</button><button id="song-stop" class="bass-stop">■ עצור</button><label>מהירות<select id="song-rate" dir="ltr"><option value="1">1×</option><option value="0.75">0.75×</option><option value="0.5">0.5×</option></select></label></div><div class="song-seek"><button id="song-back" aria-label="חמש שניות אחורה">−5 שנ׳</button><input id="song-seek" type="range" min="0" max="60" step="0.05" value="0" dir="ltr" aria-label="מיקום בהקלטה"><button id="song-forward" aria-label="חמש שניות קדימה">+5 שנ׳</button></div><p id="song-time" dir="ltr">0:00 / 1:00</p><fieldset class="song-loop"><legend>בחירת קטע ללופ</legend><label>התחלה בשניות<input id="song-loop-start" type="number" min="0" step="0.1" value="0"></label><button id="song-mark-start">התחלה כאן</button><label>סיום בשניות<input id="song-loop-end" type="number" min="0" step="0.1" value="30"></label><button id="song-mark-end">סיום כאן</button><label class="song-loop-toggle"><input id="song-loop-enabled" type="checkbox">השמעה בלופ</label></fieldset><p id="song-loop-error" class="notice" role="alert" hidden></p><p id="song-media-error" class="notice" role="alert" hidden></p></section>`;}
export function createSongPlayer({document,createAudio=()=>document.createElement('audio'),beforePlay=()=>{},requestFrame=fn=>requestAnimationFrame(fn),cancelFrame=id=>cancelAnimationFrame(id)}){
 const audio=createAudio();audio.preload='metadata';let song=null,part=null,start=0,end=0,loop=false,pendingSeek=null,frame=null,active=false,error='';
 const $=id=>document.getElementById('song-'+id);
 const duration=()=>Number.isFinite(audio.duration)&&audio.duration>0?audio.duration:song?.duration??Math.max(0,...(song?.parts??[]).map(part=>part.end));
 function seek(time){const value=Math.max(0,Math.min(duration(),time));try{audio.currentTime=value;pendingSeek=null;}catch{pendingSeek=value;}update();}
 function update(){
 if(!$('play'))return;const total=duration(),current=Number(audio.currentTime)||0;
 $('play').textContent=audio.paused?'▶ ניגון':'Ⅱ השהיה';$('seek').max=String(total);$('seek').value=String(current);$('time').textContent=`${formatTime(current)} / ${formatTime(total)}`;
 $('rate').value=String(audio.playbackRate||1);if(document.activeElement!==$('loop-start'))$('loop-start').value=String(Math.round(start*10)/10);if(document.activeElement!==$('loop-end'))$('loop-end').value=String(Math.round(end*10)/10);$('loop-enabled').checked=loop;
 $('media-error').hidden=!error;$('media-error').textContent=error;
 }
 function checkBoundary(){if(active&&loop&&!audio.paused&&(audio.currentTime>=end||audio.currentTime<start-.08))seek(start);}
 function tick(){frame=null;if(!active||audio.paused)return;checkBoundary();update();frame=requestFrame(tick);}
 function pause(){audio.pause();if(frame!==null)cancelFrame(frame);frame=null;update();}
 async function play(){
 beforePlay();error='';if(loop&&(audio.currentTime<start||audio.currentTime>=end))seek(start);
 try{await audio.play();if(!active){pause();return;}if(frame===null)frame=requestFrame(tick);update();}catch(e){if(e?.name!=='AbortError'){error='לא הצלחנו לנגן את ההקלטה. בדקו חיבור ועוצמת מדיה, ונסו שוב.';update();}}
 }
 function loopInputs(){
 const a=Number($('loop-start').value),b=Number($('loop-end').value);
 const valid=validLoop(a,b,duration());$('loop-error').hidden=valid;$('loop-error').textContent='בחרו סיום מאוחר מההתחלה, בתוך אורך ההקלטה.';
 if(!valid){loop=false;$('loop-enabled').checked=false;return false;}start=a;end=b;loop=$('loop-enabled').checked;checkBoundary();return true;
 }
 audio.addEventListener('loadedmetadata',()=>{if(pendingSeek!==null)seek(pendingSeek);update();});
 audio.addEventListener('timeupdate',()=>{checkBoundary();update();});audio.addEventListener('play',()=>{if(!active){pause();return;}if(frame===null)frame=requestFrame(tick);update();});
 audio.addEventListener('pause',()=>{if(frame!==null)cancelFrame(frame);frame=null;update();});
 audio.addEventListener('ended',()=>{if(active&&loop){seek(start);play();}else update();});
 audio.addEventListener('error',()=>{error='לא ניתן לטעון את ההקלטה כרגע. נסו לרענן את הדף.';update();});
 return {
 setPart(nextSong,nextPart,url){pause();active=true;const changed=song?.id!==nextSong.id;song=nextSong;part=nextPart;start=part.start;end=part.end;loop=false;error='';if(changed){audio.src=url;audio.load();}seek(start);},
 bind(){active=true;const on=(id,fn)=>{if($(id))$(id).onclick=fn;};on('play',()=>audio.paused?play():pause());on('stop',()=>{beforePlay();pause();seek(part.start);});on('back',()=>seek(audio.currentTime-5));on('forward',()=>seek(audio.currentTime+5));
 $('seek').oninput=()=>seek(Number($('seek').value));$('rate').onchange=()=>{const rate=Number($('rate').value);audio.playbackRate=[.5,.75,1].includes(rate)?rate:1;audio.preservesPitch=true;audio.webkitPreservesPitch=true;audio.mozPreservesPitch=true;update();};
 $('loop-start').onchange=loopInputs;$('loop-end').onchange=loopInputs;$('loop-enabled').onchange=loopInputs;
 on('mark-start',()=>{$('loop-start').value=String(Math.round(audio.currentTime*10)/10);if(loopInputs())update();});on('mark-end',()=>{$('loop-end').value=String(Math.round(audio.currentTime*10)/10);if(loopInputs())update();});update();},
 pause,hide(){active=false;pause();},get rate(){return audio.playbackRate||1;},get media(){return audio;}
 };
}

export function createSongMediaPlayer(options){
 const local=createSongPlayer(options),media=createYouTubeMedia({...options,window:options.document.defaultView}),youtube=createSongPlayer({...options,createAudio:()=>media});
 let current=local,source;
 return {setPart(song,part,url){const next=songSource(song);if(current!==(next.type==='youtube'?youtube:local)){current.hide();media.destroy();}source=next;current=next.type==='youtube'?youtube:local;current.setPart(song,part,url);},
 bind(){current.bind();if(current===youtube){const host=options.document.getElementById('songs-recording');if(host&&!host.dataset.mounted){host.dataset.mounted='true';media.mount(source.videoId);}media.refresh();const retry=options.document.getElementById('song-youtube-retry');if(retry)retry.onclick=()=>media.mount(source.videoId);}},
 pause(){current.pause();},hide(){current.hide();media.destroy();},get rate(){return current.rate;}};
}
