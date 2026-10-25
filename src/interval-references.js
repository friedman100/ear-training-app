// Only source-checked melodies can be played. Unresolved choices remain visible, without invented notes.
const verified=(sources,notes)=>({status:'verified',basis:'score-checked',sources,notes});
const pending=reason=>({status:'pending',sources:[],reason});
const melody=(pitches,beats)=>pitches.map((midi,i)=>({midi,beats:beats[i]}));
export const INTERVAL_REFERENCES=[
 {id:'bridal-chorus',title:'Here Comes the Bride — מארש החתונה',interval:5,bpm:84,
  melody:melody([65,70,70,70,65,72,69,70],[1,.75,.25,2,1,.75,.25,2]),intervalNotes:[0,1],
  verification:verified(['https://piano.org/songs/bridal-chorus/?bar=5','https://onlinepianokeyboard.com/songs/here-comes-the-bride'],'משפט המנגינה המזוהה, תיבות 5–8, בסי במול מז׳ור. משקל 2/4: רבע, שמינית מנוקדת ושש־עשרה, ואז חצי. נשמר המקצב המנוקד; קצב הדגמה מתון.')},
 {id:'shana-avra',title:'שנה עברה, שנה באה',interval:5,melody:[],intervalNotes:[],
  verification:pending('נדרש אימות של התווים והמקצב בגרסה המבוקשת; השיר המוכר מופיע גם בשם „שנה טובה” ו„שנה הלכה, שנה באה”.')},
 {id:'we-wish',title:'We Wish You a Merry Christmas',interval:5,bpm:120,
  melody:melody([62,67,67,69,67,66,64,64],[1,1,.5,.5,.5,.5,1,1]),intervalNotes:[0,1],
  verification:verified(['https://abcnotation.com/tunePage?a=trillian.mit.edu%2F~jc%2Fmusic%2Fabc%2Fmirror%2Fmindspring.com%2F~thornton.rose%2FWeWishYouAMerryChristmas%2F0001'],'פתיחת המשפט בסול מז׳ור, כולל קדמה D. תעתיק ABC, משקל 3/4 ויחידת רבע; נעצרים בסיום המשפט לפני הקדמה הבאה.')},
 {id:'amazing-grace',title:'Amazing Grace',interval:5,bpm:96,
  melody:melody([62,67,71,67,71,69,67,64,62],[1,2,.5,.5,2,1,2,1,2]),intervalNotes:[0,1],
  verification:verified(['https://abcnotation.com/tunePage?a=colinhume.com%2FABC.txt%2F0030','https://abcnotation.com/tunePage?a=trillian.mit.edu%2F~jc%2Fmusic%2Fabc%2Fmirror%2Fmusicaviva.com%2Fusa%2Famazing-grace-g%2Famazing-grace-g-1%2F0000'],'פתיחת New Britain בסול מז׳ור עם הקדמה D, משקל 3/4 ויחידת רבע; החצאים בתוך הפעמה נשמרים. ללא צליל הקדמה של המשפט הבא.')},
 {id:'royal-fanfare',title:'Royal Fanfare — תרועה מלכותית',interval:7,bpm:112,
  melody:melody([60,60,60,67],[.5,.5,.5,2]),intervalNotes:[2,3],
  verification:{status:'verified',basis:'user-defined',sources:['user:amir-friedman'],notes:'דו–דו–דו–סול לפי הגדרת אמיר. שלושה צלילים קצרים וסול ארוך בקצב הדגמה; לא מיוחס לגרסה היסטורית מסוימת.'}},
 {id:'twinkle',title:'Twinkle Twinkle Little Star',interval:7,bpm:112,
  melody:melody([60,60,67,67,69,69,67],[1,1,1,1,1,1,2]),intervalNotes:[1,2],
  verification:verified(['https://en.wikipedia.org/wiki/Twinkle,_Twinkle,_Little_Star'],'משפט הפתיחה של Ah! vous dirai-je, maman בסולפג׳ דו מז׳ור, ברבעים וחצי מסיים. הקווינטה היא בין הצליל השני לשלישי, אחרי דו החוזר.')},
 {id:'iris-chorus',title:'Iris — Goo Goo Dolls · פזמון',interval:7,melody:[],intervalNotes:[],
  verification:pending('נמצא תעתיק מלודי חלקי של הפזמון, אך לא אומתו יחד התווים, המקצב והפיסוק של המשפט המבוקש. נדרש תעתיק קצבי מאומת.')}
];
export const referencesFor=interval=>INTERVAL_REFERENCES.filter(ref=>ref.interval===interval);
export function validateReferences(refs=INTERVAL_REFERENCES){
 if(new Set(refs.map(ref=>ref.id)).size!==refs.length)throw Error('Duplicate reference');
 for(const ref of refs){
 if(!/^[a-z0-9-]+$/.test(ref.id)||!ref.title||!Number.isInteger(ref.interval)||ref.interval<1||ref.interval>12||!['pending','verified'].includes(ref.verification?.status))throw Error('Invalid reference');
 if(ref.verification.status==='pending'){if(!ref.verification.reason||ref.melody.length||ref.intervalNotes.length)throw Error('Unverified reference must not contain playable notes');continue;}
 if(!Number.isFinite(ref.bpm)||ref.bpm<30||ref.bpm>240||!ref.verification.sources?.length||!ref.verification.notes||ref.melody.length<2||ref.melody.some(n=>!Number.isFinite(n.beats)||n.beats<=0||n.midi!==null&&(!Number.isInteger(n.midi)||n.midi<48||n.midi>96)))throw Error('Invalid reference melody');
 const [a,b]=ref.intervalNotes;
 if(ref.intervalNotes.length!==2||!Number.isInteger(a)||!Number.isInteger(b)||a<0||b<=a||b>=ref.melody.length||ref.melody[a].midi===null||ref.melody[b].midi-ref.melody[a].midi!==ref.interval)throw Error('Wrong reference interval');
 }return true;
}
export function referencePlan(ref,kind='melody'){
 if(ref.verification.status!=='verified')throw Error('Reference pending verification');
 if(kind==='interval')return ref.intervalNotes.map((index,i)=>({midi:ref.melody[index].midi,offset:i*.85,duration:.8,release:.35}));
 if(kind!=='melody')throw Error('Unknown playback kind');
 let offset=0;return ref.melody.flatMap(note=>{const seconds=note.beats*60/ref.bpm,event={midi:note.midi,offset,duration:seconds*.94,release:.12};offset+=seconds;return note.midi===null?[]:[event];});
}
validateReferences();
