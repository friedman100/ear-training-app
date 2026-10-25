// Only source-checked melodies can be played. Unresolved choices remain visible, without invented notes.
const verified=(sources,notes)=>({status:'verified',basis:'score-checked',sources,notes});
const fromRecording=(span,notes)=>({status:'verified',basis:'user-recording',sources:['user:amir-recording-2026-10-25'],recording:{sha256:'95e83be9a8bf0f0e9fdba2fb4b5e7f21792adf488ca3f21eb89d9ba4af63fe5a',span},notes});
const melody=(pitches,beats)=>pitches.map((midi,i)=>({midi,beats:beats[i]}));
export const INTERVAL_REFERENCES=[
 {id:'bridal-chorus',title:'Here Comes the Bride — מארש החתונה',interval:5,bpm:84,
  melody:melody([65,70,70,70,65,72,69,70],[1,.75,.25,2,1,.75,.25,2]),intervalNotes:[0,1],
  verification:verified(['https://piano.org/songs/bridal-chorus/?bar=5','https://onlinepianokeyboard.com/songs/here-comes-the-bride'],'משפט המנגינה המזוהה, תיבות 5–8, בסי במול מז׳ור. משקל 2/4: רבע, שמינית מנוקדת ושש־עשרה, ואז חצי. נשמר המקצב המנוקד; קצב הדגמה מתון.')},
 {id:'shana-avra',title:'שנה עברה, שנה באה',interval:5,bpm:120,
  melody:melody([57,62,57,62,61,66,62,66],[.5,1.5,.5,1.5,.5,1.5,.5,1]).map((note,i)=>({...note,gate:i===3?.74:i===1?.78:.88,release:.07})),intervalNotes:[2,3],
  verification:fromRecording([10.05,13.8],'פתיחת המשפט לפי שירת אמיר, בסולם רה מז׳ור, בהעברה באוקטבה לפסנתר. צליל הקדמה הראשון לא יציב והוסדר לפי החזרה היציבה על אותו תא A–D בשניות 11.1–11.4; המרווח המבודד נלקח מהחזרה הזאת. נשמרים משכי הצלילים וההפרדה בין חצאי המשפט; לא מנגנים את המשך המשפט הארוך.')},
 {id:'we-wish',title:'We Wish You a Merry Christmas',interval:5,bpm:120,
  melody:melody([62,67,67,69,67,66,64,64],[1,1,.5,.5,.5,.5,1,1]),intervalNotes:[0,1],
  verification:verified(['https://abcnotation.com/tunePage?a=trillian.mit.edu%2F~jc%2Fmusic%2Fabc%2Fmirror%2Fmindspring.com%2F~thornton.rose%2FWeWishYouAMerryChristmas%2F0001'],'פתיחת המשפט בסול מז׳ור, כולל קדמה D. תעתיק ABC, משקל 3/4 ויחידת רבע; נעצרים בסיום המשפט לפני הקדמה הבאה.')},
 {id:'amazing-grace',title:'Amazing Grace',interval:5,bpm:96,
  melody:melody([62,67,71,67,71,69,67,64,62],[1,2,.5,.5,2,1,2,1,2]),intervalNotes:[0,1],
  verification:verified(['https://abcnotation.com/tunePage?a=colinhume.com%2FABC.txt%2F0030','https://abcnotation.com/tunePage?a=trillian.mit.edu%2F~jc%2Fmusic%2Fabc%2Fmirror%2Fmusicaviva.com%2Fusa%2Famazing-grace-g%2Famazing-grace-g-1%2F0000'],'פתיחת New Britain בסול מז׳ור עם הקדמה D, משקל 3/4 ויחידת רבע; החצאים בתוך הפעמה נשמרים. ללא צליל הקדמה של המשפט הבא.')},
 {id:'royal-fanfare',title:'Royal Fanfare — תרועה מלכותית',interval:7,bpm:180,
  melody:melody([60,60,60,67],[1,.5,.5,3]).map((note,i)=>({...note,gate:i===0?.42:i<3?.62:.95,release:i<3?.04:.12})),intervalNotes:[2,3],
  verification:fromRecording([3.12,4.82],'דו–דו–דו–סול לפי שירת אמיר: הראשון ארוך משני הבאים, שלושה צלילים מופרדים וסיום מוחזק. התזמון וההפסקות תועתקו מההקלטה, והגובה הועבר מדוּגמת D–A ל־C–G כפי שהתבקש. לא מיוחס לגרסה היסטורית מסוימת.')},
 {id:'twinkle',title:'Twinkle Twinkle Little Star',interval:7,bpm:112,
  melody:melody([60,60,67,67,69,69,67],[1,1,1,1,1,1,2]),intervalNotes:[1,2],
  verification:verified(['https://en.wikipedia.org/wiki/Twinkle,_Twinkle,_Little_Star'],'משפט הפתיחה של Ah! vous dirai-je, maman בסולפג׳ דו מז׳ור, ברבעים וחצי מסיים. הקווינטה היא בין הצליל השני לשלישי, אחרי דו החוזר.')},
 {id:'iris-chorus',title:'Iris — Goo Goo Dolls · פזמון',interval:7,bpm:140,
  melody:melody([62,62,69,69,69,69,67,66,62,64],[1,1,1,1,.5,1,.75,.75,.75,1.5]).map((note,i)=>i===9?{...note,release:.65}:note),intervalNotes:[1,2],
  verification:fromRecording([20.28,23.85],'משפט הפזמון המבוקש לפי שירת אמיר: 10 צלילים עם חזרות על D ועל A, הירידה G–F♯ והסיום D–E. קצב ההדגמה והפיסוק מההקלטה; הגובה הועבר באוקטבה והוסדר לתווים בסולם רה מז׳ור. הקווינטה היא בין הצליל השני לשלישי, לא מהבית ולא מהפתיחה האינסטרומנטלית. לפי בקשת אמיר, צליל הסיום מוחזק מעט יותר ודועך במשך 0.65 שניות.')}

];
export const referencesFor=interval=>INTERVAL_REFERENCES.filter(ref=>ref.interval===interval);
export function validateReferences(refs=INTERVAL_REFERENCES){
 if(new Set(refs.map(ref=>ref.id)).size!==refs.length)throw Error('Duplicate reference');
 for(const ref of refs){
 if(!/^[a-z0-9-]+$/.test(ref.id)||!ref.title||!Number.isInteger(ref.interval)||ref.interval<1||ref.interval>12||!['pending','verified'].includes(ref.verification?.status))throw Error('Invalid reference');
 if(ref.verification.status==='pending'){if(!ref.verification.reason||ref.melody.length||ref.intervalNotes.length)throw Error('Unverified reference must not contain playable notes');continue;}
 if(!Number.isFinite(ref.bpm)||ref.bpm<30||ref.bpm>240||!ref.verification.sources?.length||!ref.verification.notes||ref.melody.length<2||ref.melody.some(n=>!Number.isFinite(n.beats)||n.beats<=0||n.gate!==undefined&&(!Number.isFinite(n.gate)||n.gate<=.1||n.gate>1)||n.release!==undefined&&(!Number.isFinite(n.release)||n.release<.03||n.release>1)||n.midi!==null&&(!Number.isInteger(n.midi)||n.midi<48||n.midi>96)))throw Error('Invalid reference melody');
 const [a,b]=ref.intervalNotes;
 if(ref.intervalNotes.length!==2||!Number.isInteger(a)||!Number.isInteger(b)||a<0||b<=a||b>=ref.melody.length||ref.melody[a].midi===null||ref.melody[b].midi-ref.melody[a].midi!==ref.interval)throw Error('Wrong reference interval');
 }return true;
}
export function referencePlan(ref,kind='melody'){
 if(ref.verification.status!=='verified')throw Error('Reference pending verification');
 if(kind==='interval')return ref.intervalNotes.map((index,i)=>({midi:ref.melody[index].midi,offset:i*.85,duration:.8,release:.35}));
 if(kind!=='melody')throw Error('Unknown playback kind');
 let offset=0;return ref.melody.flatMap(note=>{const seconds=note.beats*60/ref.bpm,event={midi:note.midi,offset,duration:seconds*(note.gate??.94),release:note.release??.12};offset+=seconds;return note.midi===null?[]:[event];});
}
validateReferences();
