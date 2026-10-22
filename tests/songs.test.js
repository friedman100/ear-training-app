import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {SONGS,SONG_KEY,initialSongs,openSongPart,songEntry,newSongRound,submitSong,loadSongs,songAnswerPlan,checkSongBass,validateSongCatalog} from '../src/songs.js';
test('catalog and committed original recording define timed parts with accurate root-position answer playback',async()=>{
 assert.equal(validateSongCatalog(SONGS),true);assert.ok(SONGS.length>=1);const song=SONGS[0];assert.ok(song.duration>=45&&song.duration<=90);
 const mp3=await readFile('public/'+song.audio);assert.ok(mp3.length>500000);assert.ok(mp3.subarray(0,3).toString()==='ID3'||mp3[0]===255);
 for(const part of song.parts){assert.equal(part.chords.length,4);const round=newSongRound(part);round.answer=part.chords.map(c=>36+c.root%12);round.qualities=part.chords.map(c=>c.quality);
 for(const rate of [.5,.75,1]){const {plan,spacing}=songAnswerPlan(song,part,round,'qualities',rate);assert.equal(spacing,60/song.bpm*part.beatsPerChord/rate);part.chords.forEach((chord,i)=>{const events=plan.slice(i*4,i*4+4);assert.deepEqual(events.map(e=>e.midi),[36+chord.root%12,48+chord.root%12,48+chord.root%12+(chord.quality==='major'?4:3),55+chord.root%12]);assert.ok(events.every(e=>e.offset===i*spacing));});}
 assert.equal(checkSongBass(part,round.answer.map(n=>n+12)).count,4);assert.equal(checkSongBass(part,round.answer.map(n=>36+(n-36+2)%12)).count,0);
 }
 const invalid=structuredClone(SONGS);invalid[0].parts[0].end=90;assert.throws(()=>validateSongCatalog(invalid));
});
test('each song part preserves its two-stage answer, retries and completion independently',()=>{
 const song=SONGS[0],[a,b]=song.parts;let s=openSongPart(initialSongs(),song,a),r=songEntry(s,song.id,a.id).round;
 r.answer=[38,43,45,41];s=submitSong(s,song,a);assert.equal(songEntry(s,song.id,a.id).round.stage,'bass');
 songEntry(s,song.id,a.id).round.answer=[48,55,57,53];s=submitSong(s,song,a);r=songEntry(s,song.id,a.id).round;assert.equal(r.stage,'qualities');assert.equal(r.bassAttempts,2);
 r.qualities=['minor','major','minor','major'];s=submitSong(s,song,a);assert.equal(songEntry(s,song.id,a.id).completed,false);songEntry(s,song.id,a.id).round.qualities=['major','major','minor','major'];songEntry(s,song.id,a.id).round.qualityResult=null;s=submitSong(s,song,a);assert.equal(songEntry(s,song.id,a.id).completed,true);assert.equal(submitSong(s,song,a),s);
 s=openSongPart(s,song,b);assert.equal(songEntry(s,song.id,b.id).completed,false);assert.deepEqual(songEntry(s,song.id,b.id).round.answer,[null,null,null,null]);assert.equal(songEntry(s,song.id,a.id).completed,true);
 assert.deepEqual(loadSongs({getItem:key=>key===SONG_KEY?JSON.stringify(s):null}),s);songEntry(s,song.id,a.id).round=newSongRound(a);assert.equal(songEntry(loadSongs({getItem:()=>JSON.stringify(s)}),song.id,a.id).completed,true);
 assert.deepEqual(loadSongs({getItem:()=>'{bad'}),initialSongs());
});
