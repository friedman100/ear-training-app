// Six-second rolling trace; only the display scale changes, never pitch scoring.
export function createSingleChart(doc){
 const svg=doc.getElementById('single-pitch-chart'),trace=doc.getElementById('single-pitch-trace'),dot=doc.getElementById('single-pitch-dot');
 const band=doc.getElementById('single-chart-band'),direction=doc.getElementById('single-chart-direction'),scaleLabel=doc.getElementById('single-chart-scale');
 let points=[],range=300,targetRange=300,lastTime=null,farSince=null,nearSince=null;
 const y=c=>160-Math.max(-range,Math.min(range,c))*120/range;
 function reset(){points=[];range=targetRange=300;lastTime=farSince=nearSince=null;trace.setAttribute('d','');dot.setAttribute('hidden','');doc.getElementById('single-chart-target').textContent=doc.getElementById('target-name').textContent;paintScale();if(direction)direction.textContent='שירו ונסו להישאר באזור הירוק';}
 function paintScale(){if(band){const half=40*120/range;band.setAttribute('y',160-half);band.setAttribute('height',half*2);}if(scaleLabel)scaleLabel.textContent=targetRange===300?'תצוגה קרובה למטרה':'תצוגה רחבה — חזרו לכיוון האזור הירוק';svg.setAttribute('data-range-cents',range.toFixed(1));}
 function update(result,time){
 const dt=lastTime===null?0:Math.max(0,Math.min(100,time-lastTime));
 if(lastTime!==null&&time-lastTime>180)farSince=nearSince=null;
 lastTime=time;
 if(result?.reliable){
  const distance=Math.abs(result.cents);
  if(distance>255){nearSince=null;if(farSince===null)farSince=time;if(time-farSince>=1000)targetRange=700;}
  else if(distance<=120){farSince=null;if(nearSince===null)nearSince=time;if(time-nearSince>=2000)targetRange=300;}
  else farSince=nearSince=null;
  range+=(targetRange-range)*(1-Math.exp(-dt/450));
  if(Math.abs(range-targetRange)<.2)range=targetRange;
  if(direction)direction.textContent=distance<=40?'אתם באזור הירוק — המשיכו להחזיק את הצליל':result.cents>0?'גבוה מדי — רדו בגובה הצליל':'נמוך מדי — עלו בגובה הצליל';
 }else{farSince=nearSince=null;if(direction)direction.textContent='מקשיב…';}
 paintScale();points=points.filter(p=>time-p.time<=6000);points.push({time,cents:result?.reliable?result.cents:null});let previous=null,d='';
 for(const p of points){if(p.cents===null){previous=null;continue;}const x=40+(6000-(time-p.time))/6000*500;d+=`${previous&&p.time-previous.time<180?'L':'M'}${x.toFixed(1)},${y(p.cents).toFixed(1)} `;previous=p;}
 trace.setAttribute('d',d);dot.toggleAttribute('hidden',!result?.reliable);if(result?.reliable){dot.setAttribute('cy',y(result.cents));dot.setAttribute('fill',Math.abs(result.cents)<=40?'#3f8c43':'#ba8745');}svg.setAttribute('aria-label',result?.reliable?`גובה השירה: ${Math.round(result.cents)} סנט ביחס למטרה`:'מקשיב לשירה');
 }
 return {reset,update};
}
