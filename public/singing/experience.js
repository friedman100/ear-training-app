import {createPrototype} from '../sing-back/app.js?v=singing-release-1';
import {createTimedPair} from '../sing-back/timed-pair.js?v=warmup-hold400-v7';
import {WARMUP_TIMING} from '../sing-back/timeline.js?v=warmup-hold400-v7';

export const SINGING_KEY='ear-training-singing-v1';
export function createSingingExperience(env=window){
 const doc=env.document,ids=['single','timed','warmup'];
 const fields={'target-select':[48,60],'timed-root':[48,58],'warmup-root':[48,60]};
 let storage;try{storage=env.localStorage;}catch{}
 let saved={};try{saved=JSON.parse(storage?.getItem(SINGING_KEY)||'{}')||{};}catch{}
 let current=ids.includes(saved.exercise)?saved.exercise:'single';
 const controllers=[];
 const stopAll=()=>controllers.forEach(controller=>controller.stop());
 controllers.push(createPrototype(env,{onMicStart:stopAll}));
 controllers.push(createTimedPair(env,{onActivate:()=>{controllers[0].stop();controllers[2]?.stop();}}));
 controllers.push(createTimedPair(env,{prefix:'warmup-',pattern:[0,2,4,2],...WARMUP_TIMING,onActivate:()=>{controllers[0].stop();controllers[1].stop();}}));
 for(const [id,[min,max]] of Object.entries(fields)){
  const value=saved[id];if(Number.isInteger(value)&&value>=min&&value<=max){doc.getElementById(id).value=String(value);doc.getElementById(id).dispatchEvent(new env.Event('change'));}
 }
 if(['ascending','descending'].includes(saved.direction)){doc.getElementById('timed-direction').value=saved.direction;doc.getElementById('timed-direction').dispatchEvent(new env.Event('change'));}
 function save(){
  const value={exercise:current,direction:doc.getElementById('timed-direction').value};
  for(const id of Object.keys(fields))value[id]=Number(doc.getElementById(id).value);
  try{storage?.setItem(SINGING_KEY,JSON.stringify(value));}catch{}
 }
 function resize(){if(env.parent!==env)env.parent?.postMessage({type:'singing-height',height:Math.ceil(doc.querySelector('main').getBoundingClientRect().height)},env.location.origin);}
 function show(id,focus=false,stop=true){
  if(!ids.includes(id))return;if(stop)stopAll();current=id;
  for(const name of ids)doc.getElementById(name+'-exercise').hidden=name!==id;
  doc.querySelectorAll('[data-exercise]').forEach(button=>button.setAttribute('aria-pressed',String(button.dataset.exercise===id)));
  doc.getElementById('previous-exercise').hidden=id==='single';doc.getElementById('next-exercise').hidden=id==='warmup';
  if(focus){const heading=doc.querySelector('#'+id+'-exercise h2');heading.tabIndex=-1;heading.focus({preventScroll:true});}
  save();resize();
 }
 doc.querySelectorAll('[data-exercise]').forEach(button=>button.addEventListener('click',()=>show(button.dataset.exercise,true)));
 doc.getElementById('previous-exercise').addEventListener('click',()=>show(ids[ids.indexOf(current)-1],true));
 doc.getElementById('next-exercise').addEventListener('click',()=>show(ids[ids.indexOf(current)+1],true));
 [...Object.keys(fields),'timed-direction'].forEach(id=>doc.getElementById(id).addEventListener('change',save));doc.getElementById('next').addEventListener('click',save);
 env.addEventListener('singing-stop',stopAll);env.addEventListener('pagehide',stopAll);
 env.addEventListener('resize',resize);
 const observer=env.ResizeObserver?new env.ResizeObserver(resize):null;observer?.observe(doc.body);
 env.addEventListener('pagehide',()=>observer?.disconnect());
 if(new URLSearchParams(env.location.search).get('embedded')==='1')doc.body.classList.add('embedded');
 show(current,false,false);
 return {stop:stopAll,show};
}
if(typeof window!=='undefined'&&window.document?.documentElement.hasAttribute('data-singing-production'))createSingingExperience(window);
