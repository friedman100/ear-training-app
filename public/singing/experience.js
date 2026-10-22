import {WARMUP_KEY,loadWarmupProgress,canOpenWarmup,completeWarmup} from './warmup-progression.js?v=singing-modes-6';
import {WARMUP_PATTERNS} from './warmup-patterns.js?v=scale-breath-10';
import {PAIR_KEY,loadPairProgress,completePair,nextPair} from './pair-progression.js?v=singing-modes-6';
import {PROGRESS_KEY,loadProgress,completeTarget,nextTarget,solved} from './progression.js?v=singing-modes-6';
import {createPrototype} from '../sing-back/app.js?v=singing-modes-6';
import {createTimedPair} from '../sing-back/timed-pair.js?v=scale-breath-10';
import {WARMUP_TIMING} from '../sing-back/timeline.js?v=warmup-hold400-v7';

export const SINGING_KEY='ear-training-singing-v1';
export function createSingingExperience(env=window){
 const doc=env.document,$=id=>doc.getElementById(id),ids=['single','timed','warmup'];
 let storage;try{storage=env.localStorage;}catch{}
 let saved={};try{saved=JSON.parse(storage?.getItem(SINGING_KEY)||'{}')||{};}catch{}
 let mode=saved.mode==='free'?'free':'guided';
 let progress=loadProgress(storage),pairProgress=loadPairProgress(storage),warmupProgress=loadWarmupProgress(storage);
 let freeNote=Number.isInteger(saved.freeNote)&&saved.freeNote>=48&&saved.freeNote<=60?saved.freeNote:48;
 let freePattern=Number.isInteger(saved.freePattern)&&saved.freePattern>=0&&saved.freePattern<5?saved.freePattern:0;
 let freePair=saved.freePair;
 if(!Number.isInteger(freePair?.root)||freePair.root<48||freePair.root>58||!['ascending','descending'].includes(freePair?.direction))freePair={root:48,direction:'ascending'};
 const guided=()=>mode==='guided';
 const accessible=id=>!guided()||id==='single'||progress.completed===10&&(id!=='warmup'||pairProgress.completed===4);
 const patternIndex=()=>guided()?warmupProgress.current:freePattern;
 const patternAvailable=index=>index>=0&&index<5&&(!guided()||canOpenWarmup(warmupProgress,index));
 let warmupPattern=WARMUP_PATTERNS[patternIndex()],warmupBusy=false,pairBusy=false;
 let current=ids.includes(saved.exercise)&&accessible(saved.exercise)?saved.exercise:saved.exercise==='warmup'&&progress.completed===10?'timed':'single';
 let guidedExercise=ids.includes(saved.guidedExercise)?saved.guidedExercise:guided()?current:'single';
 let freeExercise=ids.includes(saved.freeExercise)?saved.freeExercise:current;
 function persist(key,value){try{storage?.setItem(key,JSON.stringify(value));}catch{$('singing-storage-error').hidden=false;}}
 function save(){
  persist(SINGING_KEY,{mode,exercise:current,guidedExercise,freeExercise,freeNote,freePair,freePattern,warmupPattern:warmupPattern.id,
   direction:$('timed-direction').value,'target-select':Number($('target-select').value),'timed-root':Number($('timed-root').value),'warmup-root':48});
 }
 function resize(){if(env.parent!==env)env.parent?.postMessage({type:'singing-height',height:Math.ceil(doc.querySelector('main').getBoundingClientRect().height)},env.location.origin);}
 function updateProgress(){
  const count=progress.completed;
  $('singing-progress-label').textContent=`השלמתם ${count} מתוך 10 צלילים`;
  const bar=$('singing-progress-bar');bar.setAttribute('aria-valuenow',String(count));bar.querySelector('span').style.width=`${count*10}%`;
  $('singing-stage-hint').textContent=count===10?'השלב הושלם. אפשר להמשיך לשלב הבא.':progress.index<5?'חמשת הצלילים הראשונים טבעיים בלבד. אפשר לנסות שוב ללא הגבלה.':'עכשיו משלבים תווים טבעיים, דיאזים ובמולים. אפשר לנסות שוב ללא הגבלה.';
  $('next').disabled=guided()&&!solved(progress);$('next').hidden=guided()&&count===10;$('next').textContent=guided()?'הצליל הבא ←':'צליל אחר ←';
  $('singing-stage-complete').hidden=!guided()||count!==10;
  doc.querySelectorAll('[data-exercise]').forEach(button=>{const unavailable=!accessible(button.dataset.exercise);button.disabled=unavailable;button.setAttribute('aria-disabled',String(unavailable));button.querySelector('small')?.remove();if(unavailable){const hint=doc.createElement('small');hint.textContent='בהמשך המסלול';button.append(hint);}});
  const next=ids[ids.indexOf(current)+1];$('next-exercise').disabled=!!next&&!accessible(next);
 }
 function onSingleSuccess(note){if(!guided())return;const updated=completeTarget(progress,note);if(updated===progress)return;progress=updated;persist(PROGRESS_KEY,progress);updateProgress();resize();}
 function updatePairProgress(){
  const count=pairProgress.completed,q=pairProgress.questions[pairProgress.index];
  $('pair-progress-label').textContent=`השלמתם ${count} מתוך 4 זוגות`;
  const bar=$('pair-progress-bar');bar.setAttribute('aria-valuenow',String(count));bar.querySelector('span').style.width=`${count*25}%`;
  $('pair-direction-label').textContent=guided()?`זוג ${pairProgress.index+1} מתוך 4 · ${q.direction==='ascending'?'עלייה':'ירידה'}`:'בחרו כיוון וגובה שנוחים לכם';
  $('next-pair').hidden=!guided()||count===4;$('next-pair').disabled=pairBusy||count<=pairProgress.index;
  $('next-pair').classList.toggle('pair-ready',guided()&&count<4&&count>pairProgress.index&&!pairBusy);
  $('pair-stage-complete').hidden=!guided()||count!==4;
 }
 function onPairSuccess(question){if(!guided())return;const updated=completePair(pairProgress,question);if(updated===pairProgress)return;pairProgress=updated;persist(PAIR_KEY,pairProgress);updatePairProgress();updateProgress();resize();}
 function updateWarmupProgress(){
  const completed=warmupProgress.completed,index=patternIndex();
  $('warmup-progress-label').textContent=`השלמתם ${completed} מתוך 5 תבניות`;
  $('warmup-current-label').textContent=guided()?`תבנית ${index+1} מתוך 5`:'בוחרים תבנית ושרים בקצב שלכם';
  const bar=$('warmup-progress-bar');bar.setAttribute('aria-valuenow',String(completed));bar.querySelector('span').style.width=`${completed*20}%`;
  doc.querySelectorAll('[data-warmup-step]').forEach(button=>{const step=Number(button.dataset.warmupStep),unavailable=!patternAvailable(step);button.disabled=unavailable||warmupBusy;button.setAttribute('aria-current',step===index?'step':'false');button.querySelector('small').textContent=!guided()?(step===index?'בתרגול':'לתרגול'):unavailable?'בהמשך המסלול':step<completed?'✓ הושלם':step===index?'בתרגול':'חדש · התבנית נפתחה';});
  $('next-warmup-pattern').hidden=index===4;$('next-warmup-pattern').disabled=warmupBusy||!patternAvailable(index+1);
  $('warmup-course-complete').hidden=!guided()||completed!==5;
  $('warmup-success-title').textContent='כל הכבוד! שרתם נכון';
  $('warmup-success-detail').textContent=!guided()?'אפשר להמשיך לתרגל או לנסות שוב.':index===4?'השלמתם את תרגילי החימום!':index<completed?'אפשר לעבור לרמה הבאה.':'הצלחתם לשיר נכון.';
 }
 function onWarmupSuccess(){
  if(guided()&&accessible('warmup')&&current==='warmup'){
   const updated=completeWarmup(warmupProgress),opened=updated!==warmupProgress;warmupProgress=updated;
   if(opened)persist(WARMUP_KEY,warmupProgress);updateWarmupProgress();
  }else updateWarmupProgress();
  $('warmup-success').classList.remove('celebrate');void $('warmup-success').offsetWidth;$('warmup-success').classList.add('celebrate');resize();
  const reveal=()=>{if(!$('warmup-success').hidden)$('warmup-success').scrollIntoView?.({behavior:env.matchMedia?.('(prefers-reduced-motion: reduce)')?.matches?'auto':'smooth',block:'center'});};
  // Allow the host page to apply the new embedded height before bringing success into view.
  if(env.setTimeout)env.setTimeout(reveal,150);else reveal();
 }
 const controllers=[],stopAll=()=>controllers.forEach(controller=>controller.stop());
 controllers.push(createPrototype(env,{onMicStart:stopAll,onSuccess:onSingleSuccess,managedTargets:true,requirePlayback:true}));
 controllers.push(createTimedPair(env,{onSuccess:onPairSuccess,onBusyChange:value=>{pairBusy=value;updatePairProgress();},onActivate:()=>{controllers[0].stop();controllers[2]?.stop();}}));
 controllers.push(createTimedPair(env,{prefix:'warmup-',pattern:warmupPattern.offsets,...WARMUP_TIMING,slotMs:warmupPattern.slotMs??WARMUP_TIMING.slotMs,demoMs:warmupPattern.offsets.length*(warmupPattern.slotMs??WARMUP_TIMING.slotMs)+400,onSuccess:onWarmupSuccess,onBusyChange:value=>{warmupBusy=value;updateWarmupProgress();},onActivate:()=>{controllers[0].stop();controllers[1].stop();}}));
 function show(id,focus=false,stop=true){
  if(!ids.includes(id)||!accessible(id))return;if(stop)stopAll();current=id;
  for(const name of ids)$(name+'-exercise').hidden=name!==id;
  doc.querySelectorAll('[data-exercise]').forEach(button=>button.setAttribute('aria-pressed',String(button.dataset.exercise===id)));
  $('previous-exercise').hidden=id==='single';$('next-exercise').hidden=id==='warmup';
  if(focus){const heading=doc.querySelector('#'+id+'-exercise h2');heading.tabIndex=-1;heading.focus({preventScroll:true});}
  if(guided())guidedExercise=id;else freeExercise=id;updateProgress();save();resize();
 }
 function choosePattern(index){
  if(!patternAvailable(index)||warmupBusy)return;const selected=WARMUP_PATTERNS[index];if(!controllers[2].setPattern(selected.offsets,{slotMs:selected.slotMs??WARMUP_TIMING.slotMs}))return;
  if(guided()){warmupProgress={...warmupProgress,current:index};persist(WARMUP_KEY,warmupProgress);}else freePattern=index;
  warmupPattern=selected;$('warmup-hint').textContent=`${(selected.slotMs??WARMUP_TIMING.slotMs)/1000} שניות לכל צליל. מספיקות 0.4 שניות מצטברות באזור הירוק לכל צליל. אפשר לנשום בין הצלילים ולהמשיך.`;$('warmup-pattern-name').textContent=selected.name;updateWarmupProgress();save();resize();
 }
 function applyMode(){
  doc.querySelectorAll('[data-singing-mode]').forEach(button=>button.setAttribute('aria-pressed',String(button.dataset.singingMode===mode)));
  $('singing-mode-note').textContent=guided()?'מתקדמים צעד אחר צעד. כל הצלחה פותחת את הצעד הבא.':'כל התרגילים והתבניות זמינים. התרגול החופשי אינו משנה את ההתקדמות במסלול המודרך.';
  doc.querySelectorAll('.singing-progress').forEach(panel=>panel.hidden=!guided());
  doc.querySelector('label[for="target-select"]').hidden=guided();doc.querySelector('#timed-exercise .timed-options').hidden=guided();
  doc.querySelector('#single-exercise h2').textContent=guided()?'שלב 1 · שומעים תו ושרים בחזרה':'שומעים תו ושרים בחזרה';
  doc.querySelector('#timed-exercise h2').textContent=guided()?'שלב 2 · מתכוננים לשיר רצף':'שרים שני צלילים';
  doc.querySelector('#warmup-exercise h2').textContent=guided()?'שלב 3 · חימום בשירה':'חימום בשירה';
  $('pair-guided-instruction').hidden=!guided();doc.querySelector('[data-exercise="timed"]').textContent=guided()?'2. הכנה לרצף':'2. שני צלילים';
  controllers[0].setTarget(guided()?progress.notes[progress.index]:freeNote);
  controllers[1].setQuestion(guided()?pairProgress.questions[pairProgress.index]:freePair);
  choosePattern(patternIndex());updatePairProgress();updateProgress();
 }
 function setMode(nextMode){
  if(!['guided','free'].includes(nextMode)||nextMode===mode)return;
  if(!guided()){freeNote=Number($('target-select').value);freePair={root:Number($('timed-root').value),direction:$('timed-direction').value};}
  stopAll();mode=nextMode;const desired=guided()?guidedExercise:freeExercise;
  const destination=accessible(desired)?desired:progress.completed===10?'timed':'single';
  applyMode();show(destination,true,false);
 }
 $('warmup-steps').innerHTML=WARMUP_PATTERNS.map((p,i)=>`<button data-warmup-step="${i}" aria-current="false"><span>${i+1}. ${p.name}</span><small></small></button>`).join('');
 doc.querySelectorAll('[data-warmup-step]').forEach(button=>button.addEventListener('click',()=>choosePattern(Number(button.dataset.warmupStep))));
 doc.querySelectorAll('[data-singing-mode]').forEach(button=>button.addEventListener('click',()=>setMode(button.dataset.singingMode)));
 doc.querySelectorAll('[data-exercise]').forEach(button=>button.addEventListener('click',()=>show(button.dataset.exercise,true)));
 $('next-warmup-pattern').addEventListener('click',()=>choosePattern(patternIndex()+1));
 $('previous-exercise').addEventListener('click',()=>show(ids[ids.indexOf(current)-1],true));
 $('next-exercise').addEventListener('click',()=>show(ids[ids.indexOf(current)+1],true));
 $('open-warmup').addEventListener('click',()=>show('warmup',true));$('open-two-notes').addEventListener('click',()=>show('timed',true));
 $('next-pair').addEventListener('click',()=>{if(!guided())return;const updated=nextPair(pairProgress);if(updated===pairProgress||pairBusy)return;if(!controllers[1].setQuestion(updated.questions[updated.index]))return;pairProgress=updated;persist(PAIR_KEY,pairProgress);save();updatePairProgress();});
 $('next').addEventListener('click',()=>{
  if(!guided()){const options=Array.from({length:13},(_,i)=>48+i).filter(n=>n!==freeNote);freeNote=options[Math.floor(Math.random()*options.length)];controllers[0].setTarget(freeNote);save();controllers[0].play();return;}
  const updated=nextTarget(progress);if(updated===progress)return;progress=updated;controllers[0].setTarget(progress.notes[progress.index]);persist(PROGRESS_KEY,progress);save();updateProgress();controllers[0].play();
 });
 $('target-select').addEventListener('change',()=>{if(guided())return;freeNote=Number($('target-select').value);controllers[0].setTarget(freeNote);save();});
 ['timed-root','timed-direction'].forEach(id=>$(id).addEventListener('change',()=>{if(!guided())freePair={root:Number($('timed-root').value),direction:$('timed-direction').value};save();}));
 env.addEventListener('singing-stop',stopAll);env.addEventListener('pagehide',stopAll);env.addEventListener('resize',resize);
 const observer=env.ResizeObserver?new env.ResizeObserver(resize):null;observer?.observe(doc.body);env.addEventListener('pagehide',()=>observer?.disconnect());
 if(new URLSearchParams(env.location.search).get('embedded')==='1')doc.body.classList.add('embedded');
 persist(PROGRESS_KEY,progress);persist(PAIR_KEY,pairProgress);persist(WARMUP_KEY,warmupProgress);applyMode();show(current,false,false);
 return {stop:stopAll,show,setMode};
}
if(typeof window!=='undefined'&&window.document?.documentElement.hasAttribute('data-singing-production'))createSingingExperience(window);
