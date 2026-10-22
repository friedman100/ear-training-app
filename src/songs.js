import catalog from './songs/catalog.json' with {type:'json'};
import {pc} from './bass.js';
export const SONGS=catalog;
export const SONG_KEY='ear-training-songs-v1';
export const findSong=id=>SONGS.find(song=>song.id===id);
export const findPart=(song,id)=>song?.parts.find(part=>part.id===id);
export const initialSongs=()=>({version:1,selected:null,songs:{}});
export const newSongRound=part=>({stage:'bass',answer:part.chords.map(()=>null),active:0,bassAttempts:0,bassResult:null,qualities:part.chords.map(()=>null),qualityAttempts:0,qualityResult:null,completed:false});
export function songEntry(state,songId,partId){return state.songs[songId]?.parts[partId];}
export function openSongPart(state,song,part){
 const s=structuredClone(state);s.selected={songId:song.id,partId:part.id};s.songs[song.id]??={parts:{}};
 s.songs[song.id].parts[part.id]??={completed:false,round:newSongRound(part)};return s;
}
export function checkSongBass(part,answer){
 if(answer.length!==part.chords.length||answer.some(n=>!Number.isInteger(n)||n<36||n>59))throw Error('Fill every bass note');
 const matches=part.chords.map((chord,i)=>pc(chord.root)===pc(answer[i]));return {matches,count:matches.filter(Boolean).length};
}
export function checkSongQualities(part,qualities){
 if(qualities.length!==part.chords.length||qualities.some(q=>!['major','minor'].includes(q)))throw Error('Choose every chord type');
 const matches=part.chords.map((chord,i)=>chord.quality===qualities[i]);return {matches,count:matches.filter(Boolean).length};
}
export function submitSong(state,song,part){
 const s=structuredClone(state),entry=songEntry(s,song.id,part.id),r=entry.round;
 if(r.completed)return state;
 if(r.stage==='bass'){r.bassResult=checkSongBass(part,r.answer);r.bassAttempts++;if(r.bassResult.count===part.chords.length)r.stage='qualities';}
 else{r.qualityResult=checkSongQualities(part,r.qualities);r.qualityAttempts++;if(r.qualityResult.count===part.chords.length){r.completed=true;entry.completed=true;}}
 return s;
}
export function songAnswerPlan(song,part,round,kind='qualities',rate=1){
 const spacing=60/song.bpm*part.beatsPerChord/rate;
 const plan=round.answer.flatMap((midi,i)=>{
 if(!Number.isInteger(midi))throw Error('Fill bass notes');
 const bass=36+pc(midi),root=48+pc(midi);
 if(kind==='bass')return [{midi:bass,offset:i*spacing,level:.75}];
 const quality=round.qualities[i];if(!['major','minor'].includes(quality))throw Error('Choose chord types');
 return [{midi:bass,offset:i*spacing,level:.75},...[root,root+(quality==='major'?4:3),root+7].map(midi=>({midi,offset:i*spacing,level:.32}))];
 });return {plan,spacing};
}
export function validateSongCatalog(songs){
 if(!Array.isArray(songs)||!songs.length||new Set(songs.map(s=>s.id)).size!==songs.length)throw Error('Invalid songs');
 for(const song of songs){
 if(!/^[a-z0-9-]+$/.test(song.id)||!song.title||!song.artist||!song.difficulty||!/^songs\/[a-z0-9-]+\.mp3$/.test(song.audio)||!Number.isFinite(song.duration)||song.duration<=0||!Number.isFinite(song.bpm)||song.bpm<=0||!Array.isArray(song.parts)||!song.parts.length||new Set(song.parts.map(p=>p.id)).size!==song.parts.length)throw Error('Invalid song');
 for(const part of song.parts)if(!/^[a-z0-9-]+$/.test(part.id)||!part.name||!Number.isFinite(part.start)||!Number.isFinite(part.end)||part.start<0||part.end<=part.start||part.end>song.duration||!Number.isFinite(part.beatsPerChord)||part.beatsPerChord<=0||!Array.isArray(part.chords)||part.chords.length<2||part.chords.length>12||part.chords.some(c=>!Number.isInteger(c.root)||c.root<36||c.root>84||!['major','minor'].includes(c.quality)||!c.english||!c.hebrew))throw Error('Invalid song part');
 }return true;
}
validateSongCatalog(SONGS);
export function loadSongs(storage){
 try{
 const saved=JSON.parse(storage.getItem(SONG_KEY));if(saved?.version!==1||!saved.songs||typeof saved.songs!=='object'||Array.isArray(saved.songs))return initialSongs();
 const s=initialSongs();
 for(const song of SONGS)for(const part of song.parts){
 const entry=saved.songs[song.id]?.parts?.[part.id];if(!entry)continue;const r=entry.round,n=part.chords.length;
 if(typeof entry.completed!=='boolean'||!r||!['bass','qualities'].includes(r.stage)||!Array.isArray(r.answer)||r.answer.length!==n||r.answer.some(v=>v!==null&&(!Number.isInteger(v)||v<36||v>59))||!Number.isInteger(r.active)||r.active<0||r.active>=n||!Array.isArray(r.qualities)||r.qualities.length!==n||r.qualities.some(v=>v!==null&&!['major','minor'].includes(v))||!['bassAttempts','qualityAttempts'].every(k=>Number.isInteger(r[k])&&r[k]>=0)||typeof r.completed!=='boolean')continue;
 try{
 if(r.bassResult&&JSON.stringify(r.bassResult)!==JSON.stringify(checkSongBass(part,r.answer)))continue;
 if(r.stage==='qualities'&&(!r.bassAttempts||r.bassResult?.count!==n))continue;
 if(r.qualityResult&&(!r.qualityAttempts||JSON.stringify(r.qualityResult)!==JSON.stringify(checkSongQualities(part,r.qualities))))continue;
 if(r.stage==='bass'&&(r.qualityAttempts||r.qualityResult||r.completed||r.qualities.some(v=>v!==null)))continue;
 if(r.completed&&(!entry.completed||r.stage!=='qualities'||r.qualityResult?.count!==n))continue;
 }catch{continue;}
 s.songs[song.id]??={parts:{}};s.songs[song.id].parts[part.id]=entry;
 }
 const song=findSong(saved.selected?.songId);if(findPart(song,saved.selected?.partId))s.selected=saved.selected;
 return s;
 }catch{return initialSongs();}
}
