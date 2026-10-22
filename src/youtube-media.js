// Official IFrame API only. No audio extraction or media downloads.
let apiPromise;
export function loadYouTube(window,document){
 if(window.YT?.Player)return Promise.resolve(window.YT);
 if(apiPromise)return apiPromise;
 apiPromise=new Promise((resolve,reject)=>{
 const script=document.createElement('script');let timer;
 const previous=window.onYouTubeIframeAPIReady;
 const fail=()=>{clearTimeout(timer);script.remove();apiPromise=null;reject(Error('לא ניתן לטעון את YouTube. בדקו חיבור או חסימת תוכן ונסו שוב.'));};
 window.onYouTubeIframeAPIReady=()=>{clearTimeout(timer);try{previous?.();}finally{resolve(window.YT);}};
 script.src='https://www.youtube.com/iframe_api';script.onerror=fail;timer=setTimeout(fail,15000);document.head.append(script);
 });return apiPromise;
}
export const youtubeError=code=>({2:'מזהה הסרטון אינו תקין.',5:'הדפדפן לא הצליח לנגן את הסרטון.',100:'הסרטון הוסר, פרטי או אינו זמין.',101:'בעל הסרטון אינו מאפשר הטמעה באתרים.',150:'בעל הסרטון אינו מאפשר הטמעה באתרים.',153:'YouTube לא זיהה את האתר. פתחו את האפליקציה בכתובת האתר, ולא כקובץ מקומי.'}[code]||'הסרטון אינו זמין כרגע. ייתכן שהוא מוגבל במדינה שלכם.');
export function createYouTubeMedia({window,document,loadAPI=()=>loadYouTube(window,document),beforePlay=()=>{}}){
 const events=new EventTarget();let player,ready=false,position=0,length=0,rate=1,paused=true,generation=0,timer,readyTimer,videoId,active=false,error='';
 const emit=type=>events.dispatchEvent(new Event(type));
 function status(message){error=message;const el=document.getElementById('song-youtube-status');if(el)el.textContent=message;}
 function rates(){const select=document.getElementById('song-rate');if(!select)return;const available=ready?(player.getAvailablePlaybackRates?.()||[1]):[];for(const option of select.options)option.disabled=!available.includes(Number(option.value));select.disabled=!ready;if(ready&&available.length===1)status('הסרטון הזה תומך במהירות רגילה בלבד.');}
 function fail(message){ready=false;paused=true;clearInterval(timer);clearTimeout(readyTimer);status(message);emit('pause');rates();}
 function destroy(){generation++;active=false;ready=false;paused=true;clearInterval(timer);clearTimeout(readyTimer);player?.destroy();player=null;length=0;rate=1;}
 async function mount(id){
 destroy();active=true;videoId=id;const request=generation;status('טוען את נגן YouTube…');rates();
 try{
 if(window.location.protocol==='file:')throw Error(youtubeError(153));
 const YT=await loadAPI();if(!active||request!==generation)return;
 readyTimer=setTimeout(()=>fail('הנגן לא נטען. נסו שוב או פתחו את הסרטון ב־YouTube.'),15000);
 player=new YT.Player('song-youtube-frame',{videoId:id,width:'100%',height:'100%',playerVars:{controls:1,playsinline:1,autoplay:0,origin:window.location.origin},events:{
 onReady:()=>{if(!active||request!==generation)return;clearTimeout(readyTimer);ready=true;status('');player.cueVideoById({videoId:id,startSeconds:position});length=player.getDuration()||length;rate=player.getPlaybackRate()||1;rates();emit('loadedmetadata');timer=setInterval(()=>{if(!ready)return;position=player.getCurrentTime()||0;length=player.getDuration()||length;emit('timeupdate');},100);},
 onStateChange:event=>{if(!ready||!active||request!==generation)return;paused=event.data!==1;if(event.data===1){beforePlay();emit('play');}else if(event.data===0)emit('ended');else emit('pause');},
 onPlaybackRateChange:()=>{if(!active||request!==generation)return;rate=player.getPlaybackRate()||1;const select=document.getElementById('song-rate');if(select&&![...select.options].some(option=>Number(option.value)===rate)){const option=document.createElement('option');option.value=String(rate);option.textContent=rate+'×';select.append(option);}emit('timeupdate');},
 onAutoplayBlocked:()=>{if(active&&request===generation)status('לחצו על כפתור הניגון בתוך סרטון YouTube כדי להתחיל.');},
 onError:event=>{if(active&&request===generation)fail(youtubeError(event.data));}
 }});
 }catch(e){if(active&&request===generation)fail(e.message);}
 }
 return {addEventListener:(...args)=>events.addEventListener(...args),load(){},mount,destroy,
 get ready(){return ready;},get src(){return videoId;},set src(value){videoId=value;},
 get currentTime(){return position;},set currentTime(value){position=value;if(ready)player.seekTo(value,true);},
 get duration(){return length;},get paused(){return paused;},get playbackRate(){return rate;},set playbackRate(value){if(ready&&(player.getAvailablePlaybackRates()||[1]).includes(value))player.setPlaybackRate(value);},
 async play(){if(!ready)throw Error(error||'הנגן עדיין נטען');player.playVideo();},pause(){paused=true;if(ready)player.pauseVideo();},
 refresh(){rates();if(error)status(error);}
 };
}
