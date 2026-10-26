import shanaApproved from './reference-data/shana-approved.json' with {type:'json'};
// Only source-checked melodies can be played. Unresolved choices remain visible, without invented notes.
const verified=(sources,notes)=>({status:'verified',basis:'score-checked',sources,notes});
const fromRecording=(span,notes,{source='user:amir-recording-2026-10-25',sha256='95e83be9a8bf0f0e9fdba2fb4b5e7f21792adf488ca3f21eb89d9ba4af63fe5a'}={})=>({status:'verified',basis:'user-recording',sources:[source],recording:{sha256,span},notes});
const melody=(pitches,beats)=>pitches.map((midi,i)=>({midi,beats:beats[i]}));
const approvedShanaMelody=shanaApproved.notes.map((midi,i)=>{const seconds=i<shanaApproved.notes.length-1?shanaApproved.onsets[i+1]-shanaApproved.onsets[i]:1,beats=Number((seconds*2).toFixed(6));return {midi,beats,gate:shanaApproved.holds[i]/(beats/2),release:shanaApproved.releases[i]};});
export const INTERVAL_REFERENCES=[
 {id:'over-the-rainbow',title:'Somewhere Over the Rainbow',interval:12,bpm:88,
  melody:melody([60,72,71,67,69,71,72,60,69,67],[2,2,1,.5,.5,1,1,2,1,3]).map((note,i)=>({...note,gate:1,release:i===9?.5:.25})),intervalNotes:[0,1],
  verification:verified(['https://www.carvedculture.co.uk/blogs/articles/somewhere-over-the-rainbow-kalimba-tab'],'משפט הפתיחה בלבד, לפי סדר הגבהים בתעתיק האותיות: C4–C5–B4–G4–A4–B4–C5–C4–A4–G4. אוקטבה בין שני הצלילים הראשונים. מקצב הדגמה פדגוגי ב־88 BPM עם דעיכה רכה, ללא העתקת תזמון של ביצוע מסוים.')},
 {id:'eli-eli',title:'אלי אלי — שלא ייגמר לעולם',interval:12,bpm:100,
  melody:melody([57,69,64,65,62,65,64,62,61,62,64,57],[1,3,1,3.5,.5,1,.5,.5,1,.5,.5,2]).map((note,i)=>({...note,gate:1,release:i===11?.6:.2})),intervalNotes:[0,1],
  verification:{status:'verified',basis:'user-recording',sources:['user-provided-reference'],notes:'משפט הפתיחה לפי הדוגמה שסופקה: A3–A4–E4–F4–D4–F4–E4–D4–C♯4–D4–E4–A3. התזמון מיושר בעדינות ל־100 BPM, בערכים 1,3,1,3.5,.5,1,.5,.5,1,.5,.5,2. סיום עם החזקה ודעיכה רכה.'}},
 {id:'take-on-me',title:'Take On Me — a-ha',interval:11,bpm:84,
  melody:melody([57,68,69,57,64,66],[2,2,4,2,2,3]).map((note,i)=>({...note,gate:1,release:i===5?.5:.2})),intervalNotes:[0,1],
  verification:verified(['https://www.pianokeyboardnotes.com/take-on-me-piano.html','https://en.wikipedia.org/wiki/Interval_recognition'],'שני משפטי השירה הראשונים בפזמון בלבד, ללא תשובות קולות הרקע: A3–G♯4–A4, A3–E4–F♯4. גבהים לפי תעתיק הפזמון; הספטימה הגדולה היא בין שני הצלילים הראשונים. תזמון הדגמה בחצי־זמן 84 BPM: 2,2,4 ואז 2,2,3 פעימות, עם סיום מקוצר ודעיכה רכה. זהו עיבוד קצר לפסנתר ולא תעתיק תזמון מדויק של ההקלטה.')},
 {id:'cant-stop',title:"Can't Stop — Red Hot Chili Peppers",interval:10,bpm:82,
  melody:melody([52,62,64,52,52,52,62,64],[.5,.5,.5,.25,.25,.25,.5,.5]).map((note,i)=>({...note,gate:1,release:i===7?.5:.09})),intervalNotes:[0,1],
  verification:verified(['https://www.guitartabs.cc/tabs/r/red_hot_chili_peppers/cant_stop_tab_ver_7.html','https://www.guitarworld.com/lessons/john-frusciante-rhcp-riffs','https://musicscene.com.au/lessons/songs/song-analysis/cant-stop/','https://sonid.app/en/interval/c/minor-seventh'],'רצף מתוקן לפי אמיר: E3–D4–E4–E3–E3–E3–D4–E4. אין E כפול לפני הקפיצה הראשונה. הספטימה הקטנה היא E3–D4, בין הצליל הראשון לשני. נשמרים שלושת צלילי E3 באמצע, כולל שתי שש־עשריות; לפי פירוט ערכי הקצב של אמיר: שתי שמיניות, שמינית ושתי שש־עשריות, ואז סינקופה שש־עשרה–שמינית–שש־עשרה. זמני תחילה בפעימות: 0,0.5,1,1.5,1.75,2,2.25,2.75; התו האחרון מוארך לחצי פעימה עם דעיכה של חצי שנייה לבקשת אמיר; הכניסות והסינקופה נשמרות. קצב הדגמה 82 BPM, מעט איטי יותר מ־91. הפריטות המושתקות אינן מתורגמות לתווים בפסנתר. הגבהים מוצלבים בטאב והחלוקה הותאמה לרצף המשתמש; לא נעשתה מדידת מיקרו־תזמון של הקלטת האולפן.')},
 {id:'nad-ned',title:'נד נד — דניאל סמבורסקי',interval:9,bpm:100,
  melody:melody([60,69,65,60,69,65],[1,1,2,1,1,2]).map((note,i)=>({...note,gate:1,release:i===5?.5:.25})),intervalNotes:[0,1],
  verification:verified(['https://www.mad-in-israel.com/2001/01/02/נדנדה-נד-נד-נתן-סלור/','https://www.dycom-il.com/i/intervals.htm','https://www.zemereshet.co.il/song.asp?id=211'],'פתיחת לחן סמבורסקי בלבד, לא שירו של פוליקר. גובהי שתי החזרות הראשונות מתורגמים מטאב למפוחית C: נשיפה 4 = C4, שאיפה 6 = A4, שאיפה 5 = F4. הסקסטה הגדולה היא C4–A4 בתחילת המשפט. תזמון הדגמה פדגוגי של רבע, רבע וחצי לכל חזרה, בקצב 100; אינו תעתיק קצבי של הקלטת נתן סלור או עיבוד אחר. נשמרת נגינה מחוברת ודעיכה רכה.')},
 {id:'fortunate-son',title:'Fortunate Son — Creedence Clearwater Revival',interval:8,bpm:95,
  melody:melody([59,67,57,65,55,64,55,62],[.5,3.5,.5,3.5,.5,3.5,.5,3.5]).map((note,i)=>({...note,gate:1,release:i===7?.4:.12})),intervalNotes:[0,1],
  verification:verified(['https://www.guitartabcreator.com/tabs/rockstarguitar/fortunate-son-intro','https://www.e-chords.com/tabs/creedence-clearwater-revival/fortunate-son','https://blog.uvm.edu/tgcleary/2023/03/18/the-sixth-sense-major-and-minor-sixths-in-the-improvising-of-thelonious-monk-and-ella-fitzgerald-emulate-assimilate-innovate-part-5/'],'ריף הפתיחה של John Fogerty/CCR, בקו מפורק יחיד: B3–G4, A3–F4, G3–E4, G3–D4. תרגום מטאב בכיוון רגיל: מיתר D בשריגים 9,7,5,5 ומיתר B בשריגים 8,6,5,3. הסקסטות הראשונות קטנות (8 חצאי טונים), השלישית גדולה (9), והרביעית קווינטה (7). קישוטי הסלייד הושמטו כדי שהזוג הראשון יהיה חד משמעי; תזמון לפי הספירה שאמיר הסביר: כל זוג מקבל תיבת 4/4; הצליל הנמוך על 1, הגבוה על ו־של־1 ומוחזק עד סוף התיבה (חצי פעימה ואז 3.5 פעימות). קצב ההדגמה 95 BPM; זו פרשנות לספירת המשתמש ולא תעתיק עצמאי של ההקלטה. אין שימוש בהקלטה מקורית.')},
 {id:'the-simpsons',title:'משפחת סימפסון — The Simpsons',interval:6,bpm:100,
  melody:melody([60,66,67],[1,2,2]).map((note,i)=>({...note,gate:1,release:i===2?.5:.25})),intervalNotes:[0,1],
  verification:verified(['https://jadebultitude.com/augmented-4th/','https://www.ssoar.info/ssoar/bitstream/document/95995/1/95995_1.pdf'],'שלושת צלילי הפתיחה המושרת של Danny Elfman, C4–F♯4–G4, על The–Simp–sons. המקורות מאמתים את שלושת הגבהים ואת הטריטון בין שתי ההברות הראשונות. תזמון הדגמה פדגוגי מתון: פעימה אחת ושני צלילים באורך שתי פעימות, ב־100 BPM, עם החזקה ודעיכה רכה; אינו תעתיק קצבי מדויק של גרסת שידור מסוימת. אין שימוש בנושא האינסטרומנטלי שמתחיל ב־C–E–F♯, ואין הקלטה מקורית.')},
 {id:'jaws',title:'מלתעות — Jaws',interval:1,bpm:100,
  melody:melody([52,53,52,53,52,53,52,53],[.5,.5,.5,.5,.5,.5,.5,.5]).map((note,i)=>({...note,gate:.85,release:i===7?.35:.12})),intervalNotes:[0,1],
  verification:verified(['https://en.wikipedia.org/wiki/Jaws_(soundtrack)','https://app.hoffmanacademy.com/lessons/piano/minor-2nds-major-2nds/video/?cp=0'],'מוטיב הכריש מאת John Williams: חילוף E–F, סקונדה קטנה עולה. הדגמה פדגוגית קצרה של ארבעה זוגות בפסנתר במנעד E3–F3, בשמיניות בקצב אחיד 100. אין טענה לשחזור ההאצה, התזמור או קצב קטע מסוים בפסקול; זוג המרווח זהה לצלילי המוטיב.')},
 {id:'pink-panther',title:'הפנתר הוורוד — The Pink Panther',interval:1,bpm:120,
  melody:melody([63,64,null,66,67,null,63,64,66,67,72,71],[.5,1.5,.5,.5,1.5,.5,.5,.75,.5,.75,.5,.75]).map((note,i)=>({...note,gate:1,release:i===11?.4:.2})),intervalNotes:[0,1],
  verification:verified(['https://github.com/robsoncouto/arduino-songs/blob/master/pinkpanther/pinkpanther.ino'],'הנושא של Henry Mancini, מתחילת המנגינה D♯4–E4 דרך F♯4–G4 ועד C5–B4. גבהים, ערכים מנוקדים והפסקות לפי תעתיק התווים בקוד; הוסרו רק ההפסקות הארוכות שלפני הצליל הראשון. קצב 120; נגינה בפסנתר ודעיכה רכה במקום צליל הזמזם במקור. ההדגמה נעצרת אחרי המשפט הקצר, ללא כל מנגינת ההמשך. הערת הקרדיט השגויה בקוד המקור לא הועתקה.')},
 {id:'hatikvah',title:'התקווה',interval:2,bpm:88,
  melody:melody([62,64,65,67,69,69,70,69,70,74,69],[.5,.5,.5,.5,1,1,.5,.5,.5,.5,2]).map((note,i)=>({...note,gate:1,release:i===10?.5:.25})),intervalNotes:[0,1],
  verification:verified(['https://abcnotation.com/tunePage?a=trillian.mit.edu%2F~jc%2Fmusic%2Fabc%2Fanthem%2FHatikva_Dm%2F0000'],'שתי תיבות הפתיחה ברה מינור, לפי תעתיק ABC של John Chambers: DE FG A2 A2 | BA Bd A4, ביחידת שמינית. הפתיחה מתחילה בקו המלודי של השירה, D4–E4, ללא קדמה אינסטרומנטלית. המקצב נשמר בקצב הדגמה מתון 88; נגינה מחוברת ודעיכה רכה.')},
 {id:'happy-birthday',title:'Happy Birthday',interval:2,bpm:120,
  melody:melody([67,67,69,67,72,71,67,67,69,67,74,72],[.5,.5,1,1,1,2,.5,.5,1,1,1,2]).map((note,i)=>({...note,gate:1,release:i===11?.5:.25})),intervalNotes:[1,2],
  verification:verified(['https://github.com/farvardin/kalimba.sh/blob/587b89925df8dab1ea1d1644fba5ff7636254537/samples/happybirthday.abc'],'שני משפטי הפתיחה בדו מז׳ור מתעתיק ABC: GG A2 G2 | c2 B4 | GG A2 G2 | d2 c4, יחידת שמינית ו־120 רבעים לדקה. שני צלילי G חוזרים בתחילה; הסקונדה הגדולה היא G–A, מהצליל השני לשלישי. החזרות והמקצב נשמרים, עם החזקה מלאה ודעיכה חופפת עדינה.')},
 {id:'smoke-on-the-water',title:'Smoke on the Water — Deep Purple',interval:3,bpm:112,
  melody:melody([67,70,72,null,67,null,70,73,72,67,70,72,70,67],[1,1,1,.5,.5,.5,1,.5,2,1,1,1.5,1,3.5]).map((note,i)=>({...note,gate:.94,release:i===13?.4:.12})),intervalNotes:[0,1],
  verification:verified(['https://exstrom.com/blog/abrazolica/posts/smoke.html'],'ריף הפתיחה, ארבע תיבות לפי קוד ה־ABC במקור (L:1/8), בקו העליון בלבד ובפסנתר: G–B♭–C, עם ההפסקות וה־D♭ במשפט השני. נשמר המקצב מה־ABC, כולל C בשלוש שמיניות בחזרה האחרונה. הגובה הועבר באוקטבה; קצב הדגמה 112. אין דגימה מההקלטה המקורית.')},
 {id:'seven-nation-army',title:'Seven Nation Army — The White Stripes',interval:3,bpm:124,
  melody:melody([64,64,null,67,null,64,null,62,60,59],[1.5,.25,.25,.25,.5,.25,.5,.5,2,2]).map((note,i)=>({...note,gate:1,release:i===9?.4:.08})),intervalNotes:[1,3],
  verification:verified(['https://github.com/Luke100000/ImmersiveMelodies/blob/16c004872866048d11f6d0141ca878bf4fb5a09a/melodies/Seven%20Nation%20Army.abc','https://mrbhss.wordpress.com/2013/09/24/music-performance-task-seven-nation-army/'],'מחזור אחד של הריף: E–E–G–E–D–C–B. זמני התווים וההפסקות מתעתיק ABC (L:1/4) שהועבר מ־G♯ ל־E, עם הצלבת סדר הגבהים במקור ההוראה. ההפסקות הקצרות נשמרות; הטרצה היא מה־E השני ל־G, לא בין שני צלילי הפתיחה הזהים. קצב הדגמה 124.')},
 {id:'oseh-shalom',title:'עושה שלום — נורית הירש',interval:3,bpm:110,
  melody:melody([62,65,69,69,69,69,69,69],[.5,.5,1.5,.5,1,.5,.5,4]).map((note,i)=>({...note,gate:1,release:i===7?.5:.25})),intervalNotes:[0,1],
  verification:verified(['https://github.com/syntithenai/abc2book/blob/db1681da9417cea25072527b9e75fbe7f28186a5/abcresources/jc/allklez/I5:OSEHSHALOM.abc','https://www.ganhalev.org/songs/oseh_shalom/'],'לחן נורית הירש, משפט הפתיחה בלבד לפי תעתיק John Chambers משנת 2006. K:Dm, L:1/8: קדמת D F ואז A3 A A2 AA ו־A4 קשור ל־A4. קשר ההחזקה הוא צליל A אחד באורך ארבע פעימות, בלי התקפה חוזרת. הקפיצה הראשונה D4–F4 היא טרצה קטנה. נגינה מחוברת בקצב הדגמה 110, ללא העתקת עיבוד המקהלה.')},
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
