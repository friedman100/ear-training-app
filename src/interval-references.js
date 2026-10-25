import shanaApproved from './reference-data/shana-approved.json' with {type:'json'};
// Only source-checked melodies can be played. Unresolved choices remain visible, without invented notes.
const verified=(sources,notes)=>({status:'verified',basis:'score-checked',sources,notes});
const fromRecording=(span,notes,{source='user:amir-recording-2026-10-25',sha256='95e83be9a8bf0f0e9fdba2fb4b5e7f21792adf488ca3f21eb89d9ba4af63fe5a'}={})=>({status:'verified',basis:'user-recording',sources:[source],recording:{sha256,span},notes});
const melody=(pitches,beats)=>pitches.map((midi,i)=>({midi,beats:beats[i]}));
const approvedShanaMelody=shanaApproved.notes.map((midi,i)=>{const seconds=i<shanaApproved.notes.length-1?shanaApproved.onsets[i+1]-shanaApproved.onsets[i]:1,beats=Number((seconds*2).toFixed(6));return {midi,beats,gate:shanaApproved.holds[i]/(beats/2),release:shanaApproved.releases[i]};});
export const INTERVAL_REFERENCES=[
 {id:'vivaldi-spring',title:'אביב — ויוואלדי · Spring',interval:4,bpm:96,
  melody:melody([64,68,68,68,66,64,71,71,69,68,68,68,66,64,71],[.5,.5,.5,.5,.25,.25,1.5,.25,.25,.5,.5,.5,.25,.25,1.5]).map((note,i)=>i===14?{...note,release:.35}:note),intervalNotes:[0,1],
  verification:verified(['https://www.mutopiaproject.org/ftp/VivaldiA/O8/spring/spring-lys/spring1a.ly'],'פתיחת הפרק הראשון, שני מוטיבי הפתיחה בלבד, מקדמת E עד B המוחזק השני, ללא משפט ההמשך. תעתיק LilyPond של Mutopia: E–G♯ בפתיחה, שמיניות ושש־עשריות ו־B ברבע מנוקד. קו הכינור הועבר באוקטבה למנעד פסנתר נוח; המקצב נשמר, בקצב הדגמה 96. המקור: A. Vivaldi, עימוד Mutopia, CC BY-SA 3.0.')},
 {id:'when-the-saints',title:'When the Saints Go Marching In',interval:4,bpm:140,
  melody:melody([60,64,65,67,60,64,65,67],[1,1,1,5,1,1,1,5]).map((note,i)=>({...note,gate:1,release:i===7?.5:.32})),intervalNotes:[0,1],
  verification:verified(['https://de.wikibooks.org/wiki/Gitarre:_Notenlesen_-_F_G_und_Fis','https://www.thepianonotes.com/when-the-saints-go-marching-in-traditional-easy-letter-notes/'],'שני משפטי הפתיחה בדו מז׳ור. תעתיק ABC ב־Wikibooks: קדמה c e f ברבעים, g4 קשור ל־g ברבע לפני הקדמה הבאה. לכן ההחזקה היא חמש פעימות, ולא חמישה צלילי G נפרדים. הועבר באוקטבה למטה; משפט שני מסיים באותה החזקה. לפי בקשת אמיר, קצב ההדגמה 140, החזקה מלאה ודעיכה חופפת עדינה בין צלילים.')},
 {id:'pizmon-layakinton',title:'פזמון ליקינטון',interval:4,bpm:100,
  melody:melody([65,69,72,69,67,65,62,65,67,67,69,65],[1,1,1,1,1,1,1,1,1,.5,.5,2]).map((note,i)=>({...note,gate:1,release:i===11?.5:.32})),intervalNotes:[0,1],
  verification:verified(['https://github.com/rwmpelstilzchen/ukulele/blob/master/muzika%C4%B5oj/jakinton/jakinton.ly'],'לחן רבקה גוילי. שלוש תיבות הפתיחה לפי תעתיק LilyPond: פה–לה–דו–לה, סול–פה–רה–פה, סול–סול–לה–פה. משקל 4/4, רבעים, שתי שמיניות וחצי מסיים. הועבר למנעד F4–C5; הקפיצה הראשונה F4–A4 היא טרצה גדולה עולה. קצב הדגמה מתון 100. לפי בקשת אמיר, החזקה מלאה ודעיכה חופפת עדינה ללא שינוי בזמני תחילת הצלילים.')},
 {id:'bridal-chorus',title:'Here Comes the Bride — מארש החתונה',interval:5,bpm:84,
  melody:melody([65,70,70,70,65,72,69,70],[1,.75,.25,2,1,.75,.25,2]),intervalNotes:[0,1],
  verification:verified(['https://piano.org/songs/bridal-chorus/?bar=5','https://onlinepianokeyboard.com/songs/here-comes-the-bride'],'משפט המנגינה המזוהה, תיבות 5–8, בסי במול מז׳ור. משקל 2/4: רבע, שמינית מנוקדת ושש־עשרה, ואז חצי. נשמר המקצב המנוקד; קצב הדגמה מתון.')},
 {id:'shana-avra',title:'שנה עברה, שנה באה',interval:5,bpm:120,
  melody:approvedShanaMelody,intervalNotes:[2,3],
  verification:fromRecording([.565,12.7],'גרסת הפסנתר המלאה שאמיר אישר בדף הבדיקה, כולל המקצב מההקלטה של הכלי. 17 צלילים: הצליל החמישי הוא D4 ושתי חזרות על A4 בהמשך, ללא G4 נוסף ביניהן. גובהי הצלילים, זמני תחילתם, ההחזקה והדעיכה זהים לנתוני דוגמת ההשמעה שאושרה. bpm=120 משמש יחידת המרה לנתוני תזמון, לא שינוי מהירות. הקוורטה המבודדת היא A3–D4 בצלילים 3–4.',{source:'user:amir-instrument-recording-2026-10-25',sha256:'0dc5a68799cbb10e8083719a16d0e5aafd5a57865e39a660a3f74c887fabc650'})},
 {id:'we-wish',title:'We Wish You a Merry Christmas',interval:5,bpm:120,
  melody:melody([62,67,67,69,67,66,64,64],[1,1,.5,.5,.5,.5,1,1]),intervalNotes:[0,1],
  verification:verified(['https://abcnotation.com/tunePage?a=trillian.mit.edu%2F~jc%2Fmusic%2Fabc%2Fmirror%2Fmindspring.com%2F~thornton.rose%2FWeWishYouAMerryChristmas%2F0001'],'פתיחת המשפט בסול מז׳ור, כולל קדמה D. תעתיק ABC, משקל 3/4 ויחידת רבע; נעצרים בסיום המשפט לפני הקדמה הבאה.')},
 {id:'amazing-grace',title:'Amazing Grace',interval:5,bpm:96,
  melody:melody([62,67,71,67,71,69,67,64,62],[1,2,.5,.5,2,1,2,1,2]),intervalNotes:[0,1],
  verification:verified(['https://abcnotation.com/tunePage?a=colinhume.com%2FABC.txt%2F0030','https://abcnotation.com/tunePage?a=trillian.mit.edu%2F~jc%2Fmusic%2Fabc%2Fmirror%2Fmusicaviva.com%2Fusa%2Famazing-grace-g%2Famazing-grace-g-1%2F0000'],'פתיחת New Britain בסול מז׳ור עם הקדמה D, משקל 3/4 ויחידת רבע; החצאים בתוך הפעמה נשמרים. ללא צליל הקדמה של המשפט הבא.')},
 {id:'royal-fanfare',title:'Royal Fanfare — תרועה מלכותית',interval:7,bpm:180,
  melody:melody([60,60,60,67],[1,.5,.5,3]).map((note,i)=>({...note,gate:i===0?.5:i<3?.7:.95,release:i<3?.1:.35})),intervalNotes:[2,3],
  verification:fromRecording([3.12,4.82],'דו–דו–דו–סול לפי שירת אמיר: הראשון ארוך משני הבאים, שלושה צלילים מופרדים וסיום מוחזק. התזמון וההפסקות תועתקו מההקלטה, והגובה הועבר מדוּגמת D–A ל־C–G כפי שהתבקש. לא מיוחס לגרסה היסטורית מסוימת. לפי בקשת אמיר, קוצרו מעט ההפסקות ונוספה דעיכה רכה יותר, בלי לשנות את זמני תחילת הצלילים.')},
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
