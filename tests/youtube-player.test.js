import test from 'node:test';
import assert from 'node:assert/strict';
import {Window} from 'happy-dom';
import {createYouTubeMedia,youtubeError,loadYouTube} from '../src/youtube-media.js';
import {createSongPlayer,playerMarkup} from '../src/song-player.js';
import {SONGS,validateSongCatalog,songSource} from '../src/songs.js';
test('YouTube uses official API, queued section start, supported rates, controls, loop and cleanup',async()=>{
 const w=new Window({url:'https://example.org/ear-training-app/'}),song={...structuredClone(SONGS[0]),id:'youtube-test',source:{type:'youtube',videoId:'kKTyqRlBNJI'}};delete song.audio;
 assert.equal(validateSongCatalog([song]),true);assert.equal(songSource(SONGS[0]).type,'audio');assert.throws(()=>validateSongCatalog([{...song,source:{type:'youtube',videoId:'invalid'}}]));
 w.document.body.innerHTML=playerMarkup(song);let instance,settings,stopped=0,frame;
 class Player {constructor(id,options){settings=options;instance=this;this.time=0;this.rate=1;this.destroyed=false;}cueVideoById(value){this.cue=value;this.time=value.startSeconds;}getDuration(){return 180;}getCurrentTime(){return this.time;}getAvailablePlaybackRates(){return [1,.5];}getPlaybackRate(){return this.rate;}setPlaybackRate(rate){this.rate=rate;settings.events.onPlaybackRateChange();}seekTo(time){this.time=time;settings.events.onStateChange({data:1});}playVideo(){settings.events.onStateChange({data:1});}pauseVideo(){settings.events.onStateChange({data:2});}destroy(){this.destroyed=true;}}
 const media=createYouTubeMedia({window:w,document:w.document,loadAPI:async()=>({Player}),beforePlay:()=>stopped++});
 const controller=createSongPlayer({document:w.document,createAudio:()=>media,requestFrame:fn=>{frame=fn;return 1;},cancelFrame:()=>{frame=null;}});
 controller.setPart(song,{start:12,end:24},'');controller.bind();await media.mount(song.source.videoId);settings.events.onReady();assert.equal(instance.cue.startSeconds,12);assert.equal(settings.playerVars.controls,1);assert.equal(settings.playerVars.origin,'https://example.org');assert.equal(w.document.querySelector('option[value="0.75"]').disabled,true);
 controller.bind();w.document.getElementById('song-play').click();await Promise.resolve();assert.equal(media.paused,false);assert.equal(stopped,1,'rebinding does not add duplicate handlers');
 w.document.getElementById('song-forward').click();assert.equal(instance.time,17);
 const rate=w.document.getElementById('song-rate');rate.value='.5';rate.value='0.5';rate.onchange();assert.equal(media.playbackRate,.5);assert.equal(rate.value,'0.5');
 const loop=w.document.getElementById('song-loop-enabled');loop.checked=true;loop.onchange();media.currentTime=24.1;frame();assert.equal(instance.time,12);
 controller.setPart(song,{start:30,end:45},'');assert.equal(instance.time,30);assert.equal(instance.cue.startSeconds,30);assert.equal(media.paused,true);controller.bind();w.document.getElementById('song-play').click();await Promise.resolve();assert.equal(media.paused,false);controller.pause();
 settings.events.onAutoplayBlocked();assert.match(w.document.getElementById('song-youtube-status').textContent,/בתוך סרטון/);
 settings.events.onError({data:150});assert.match(w.document.getElementById('song-youtube-status').textContent,/אינו מאפשר/);assert.equal(media.ready,false);
 media.destroy();assert.equal(instance.destroyed,true);assert.match(youtubeError(153),/כתובת האתר/);assert.match(youtubeError(100),/אינו זמין/);assert.match(youtubeError(999),/במדינה/);await w.happyDOM.close();
});
test('API loader failure is visible and retry creates a fresh official request',async()=>{
 const w={};let script;const document={createElement:()=>({remove(){}}),head:{append(value){script=value;}}};
 const first=loadYouTube(w,document);assert.equal(script.src,'https://www.youtube.com/iframe_api');script.onerror();await assert.rejects(first,/לא ניתן לטעון/);
 const retry=loadYouTube(w,document);w.YT={Player:class{}};w.onYouTubeIframeAPIReady();assert.equal(await retry,w.YT);
});
test('local file fails clearly without loading YouTube and hiding cancels late initialization',async()=>{
 const w=new Window({url:'file:///tmp/app.html'});w.document.body.innerHTML=playerMarkup({...SONGS[0],source:{type:'youtube',videoId:'kKTyqRlBNJI'}});let calls=0;
 const media=createYouTubeMedia({window:w,document:w.document,loadAPI:()=>{calls++;}});await media.mount('kKTyqRlBNJI');assert.equal(calls,0);assert.match(w.document.getElementById('song-youtube-status').textContent,/כקובץ מקומי/);media.destroy();await w.happyDOM.close();
});
