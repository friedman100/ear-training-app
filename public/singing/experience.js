import {PROGRESS_KEY,loadProgress,completeTarget,nextTarget,solved} from './progression.js?v=singing-stages-2';
import {createPrototype} from '../sing-back/app.js?v=singing-stages-2';
import {createTimedPair} from '../sing-back/timed-pair.js?v=warmup-hold400-v7';
import {WARMUP_TIMING} from '../sing-back/timeline.js?v=warmup-hold400-v7';

export const SINGING_KEY='ear-training-singing-v1';
export function createSingingExperience(env=window){
 const doc=env.document,ids=['single','timed','warmup'];
 const fields={'target-select':[48,60],'timed-root':[48,58],'warmup-root':[48,60]};
 let storage;try{storage=env.localStorage;}catch{}
 let saved={};try{saved=JSON.parse(storage?.getItem(SINGING_KEY)||'{}')||{};}catch{}
 let progress=loadProgress(storage);
 let current=ids.includes(saved.exercise)&&progress.completed===10?saved.exercise:'single';
 function saveProgress(){try{storage?.setItem(PROGRESS_KEY,JSON.stringify(progress));}catch{doc.getElementById('singing-storage-error').hidden=false;}}
 function updateProgress(){
  const count=progress.completed;doc.getElementById('singing-progress-label').textContent=`השלמתם ${count} מתוך 10 צלילים`;
  const bar=doc.getElementById('singing-progress-bar');bar.setAttribute('aria-valuenow',String(count));bar.querySelector('span').style.width=`${count*10}%`;
  doc.getElementById('singing-stage-hint').textContent=count===10?'השלב הושלם. אפשר להמשיך לשלב הבא.':progress.index<5?'חמשת הצלילים הראשונים טבעיים בלבד. אפשר לנסות שוב ללא הגבלה.':'עכשיו משלבים תווים טבעיים, דיאזים ובמולים. אפשר לנסות שוב ללא הגבלה.';
  doc.getElementById('next').disabled=!solved(progress);doc.getElementById('next').hidden=count===10;doc.getElementById('singing-stage-complete').hidden=count!==10;
  doc.querySelectorAll('[data-exercise]').forEach(button=>{const locked=button.dataset.exercise!=='single'&&count<10;button.disabled=locked;button.setAttribute('aria-disabled',String(locked));button.querySelector('small')?.remove();if(locked){const hint=doc.createElement('small');hint.textContent='נפתח אחרי 10 הצלחות';button.append(hint);}});
  doc.getElementById('next-exercise').disabled=count<10;
 }
 function onSingleSuccess(note){const updated=completeTarget(progress,note);if(updated===progress)return;progress=updated;saveProgress();updateProgress();resize();}
 const controllers=[];
 const stopAll=()=>controllers.forEach(controller=>controller.stop());
 controllers.push(createPrototype(env,{onMicStart:stopAll,onSuccess:onSingleSuccess,managedTargets:true,requirePlayback:true}));
 controllers.push(createTimedPair(env,{onActivate:()=>{controllers[0].stop();controllers[2]?.stop();}}));
 controllers.push(createTimedPair(env,{prefix:'warmup-',pattern:[0,2,4,2],...WARMUP_TIMING,onActivate:()=>{controllers[0].stop();controllers[1].stop();}}));
 for(const [id,[min,max]] of Object.entries(fields)){
  if(id==='target-select')continue;const value=saved[id];if(Number.isInteger(value)&&value>=min&&value<=max){doc.getElementById(id).value=String(value);doc.getElementById(id).dispatchEvent(new env.Event('change'));}
 }
 if(['ascending','descending'].includes(saved.direction)){doc.getElementById('timed-direction').value=saved.direction;doc.getElementById('timed-direction').dispatchEvent(new env.Event('change'));}
 function save(){
  const value={exercise:current,direction:doc.getElementById('timed-direction').value};
  for(const id of Object.keys(fields))value[id]=Number(doc.getElementById(id).value);
  try{storage?.setItem(SINGING_KEY,JSON.stringify(value));}catch{}
 }
 function resize(){if(env.parent!==env)env.parent?.postMessage({type:'singing-height',height:Math.ceil(doc.querySelector('main').getBoundingClientRect().height)},env.location.origin);}
 function show(id,focus=false,stop=true){
  if(!ids.includes(id)||id!=='single'&&progress.completed<10)return;if(stop)stopAll();current=id;
  for(const name of ids)doc.getElementById(name+'-exercise').hidden=name!==id;
  doc.querySelectorAll('[data-exercise]').forEach(button=>button.setAttribute('aria-pressed',String(button.dataset.exercise===id)));
  doc.getElementById('previous-exercise').hidden=id==='single';doc.getElementById('next-exercise').hidden=id==='warmup';
  if(focus){const heading=doc.querySelector('#'+id+'-exercise h2');heading.tabIndex=-1;heading.focus({preventScroll:true});}
  save();resize();
 }
 doc.querySelectorAll('[data-exercise]').forEach(button=>button.addEventListener('click',()=>show(button.dataset.exercise,true)));
 doc.getElementById('previous-exercise').addEventListener('click',()=>show(ids[ids.indexOf(current)-1],true));
 doc.getElementById('open-two-notes').addEventListener('click',()=>show('timed',true));
 doc.getElementById('next').addEventListener('click',()=>{const updated=nextTarget(progress);if(updated===progress)return;progress=updated;controllers[0].setTarget(progress.notes[progress.index]);saveProgress();save();updateProgress();controllers[0].play();});
 doc.getElementById('next-exercise').addEventListener('click',()=>show(ids[ids.indexOf(current)+1],true));
 [...Object.keys(fields),'timed-direction'].forEach(id=>doc.getElementById(id).addEventListener('change',save));doc.getElementById('next').addEventListener('click',save);
 env.addEventListener('singing-stop',stopAll);env.addEventListener('pagehide',stopAll);
 env.addEventListener('resize',resize);
 const observer=env.ResizeObserver?new env.ResizeObserver(resize):null;observer?.observe(doc.body);
 env.addEventListener('pagehide',()=>observer?.disconnect());
 if(new URLSearchParams(env.location.search).get('embedded')==='1')doc.body.classList.add('embedded');
 controllers[0].setTarget(progress.notes[progress.index]);updateProgress();saveProgress();show(current,false,false);
 return {stop:stopAll,show};
}
if(typeof window!=='undefined'&&window.document?.documentElement.hasAttribute('data-singing-production'))createSingingExperience(window);
