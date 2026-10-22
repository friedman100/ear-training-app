import test from 'node:test';
import assert from 'node:assert/strict';
import {Window} from 'happy-dom';
import {createSongPlayer,playerMarkup,validLoop,formatTime} from '../src/song-player.js';
test('real-media controls seek, skip, rate, loop and section jump without resetting on interface updates',async()=>{
 const w=new Window();w.document.body.innerHTML=playerMarkup();let frame,before=0;
 class Media extends EventTarget{paused=true;currentTime=0;duration=60;playbackRate=1;play(){this.paused=false;this.dispatchEvent(new Event('play'));return Promise.resolve();}pause(){this.paused=true;this.dispatchEvent(new Event('pause'));}load(){this.dispatchEvent(new Event('loadedmetadata'));}}
 const audio=new Media(),player=createSongPlayer({document:w.document,createAudio:()=>audio,beforePlay:()=>before++,requestFrame:fn=>{frame=fn;return 1;},cancelFrame:()=>{frame=null;}}),click=id=>w.document.getElementById('song-'+id).click(),change=(id,value)=>{const el=w.document.getElementById('song-'+id);el.value=String(value);el.dispatchEvent(new w.Event('change'));};
 player.setPart({id:'one',duration:60},{start:10,end:30},'/recording.mp3');player.bind();assert.equal(audio.currentTime,10);assert.equal(audio.src,'/recording.mp3');click('play');await Promise.resolve();assert.equal(audio.paused,false);assert.equal(before,1);
 click('forward');assert.equal(audio.currentTime,15);click('back');assert.equal(audio.currentTime,10);
 const seek=w.document.getElementById('song-seek');seek.value='22';seek.dispatchEvent(new w.Event('input'));assert.equal(audio.currentTime,22);
 change('rate',.5);assert.equal(audio.playbackRate,.5);assert.equal(audio.preservesPitch,true);change('rate',.75);assert.equal(player.rate,.75);change('rate',1);
 change('loop-start',12);change('loop-end',16);const enabled=w.document.getElementById('song-loop-enabled');enabled.checked=true;enabled.dispatchEvent(new w.Event('change'));audio.currentTime=16.02;frame();assert.equal(audio.currentTime,12);
 w.document.body.innerHTML=playerMarkup();player.bind();assert.equal(audio.currentTime,12);assert.equal(audio.paused,false);assert.equal(w.document.getElementById('song-loop-enabled').checked,true);
 change('loop-end',11);assert.equal(w.document.getElementById('song-loop-error').hidden,false);assert.equal(w.document.getElementById('song-loop-enabled').checked,false);
 audio.currentTime=20;click('mark-start');assert.equal(w.document.getElementById('song-loop-start').value,'20');change('loop-end',25);audio.currentTime=24;click('mark-end');assert.equal(w.document.getElementById('song-loop-end').value,'24');click('stop');assert.equal(audio.currentTime,10);assert.equal(audio.paused,true);
 player.setPart({id:'one',duration:60},{start:30,end:60},'/recording.mp3');player.bind();assert.equal(audio.currentTime,30);click('play');await Promise.resolve();player.hide();assert.equal(audio.paused,true);
 assert.equal(formatTime(65.5),'1:05');assert.equal(validLoop(4,3,60),false);assert.equal(validLoop(0,70,60),false);await w.happyDOM.close();
});
