// Six-second rolling pitch trace. Y is cents relative to the target, X is elapsed time.
export function createSingleChart(doc){
 const svg=doc.getElementById('single-pitch-chart'),trace=doc.getElementById('single-pitch-trace'),dot=doc.getElementById('single-pitch-dot');let points=[];
 const y=c=>160-Math.max(-300,Math.min(300,c))*.4;
 function reset(){points=[];trace.setAttribute('d','');dot.setAttribute('hidden','');doc.getElementById('single-chart-target').textContent=doc.getElementById('target-name').textContent;}
 function update(result,time){points=points.filter(p=>time-p.time<=6000);points.push({time,cents:result?.reliable?result.cents:null});let previous=null,d='';for(const p of points){if(p.cents===null){previous=null;continue;}const x=40+(6000-(time-p.time))/6000*500;d+=`${previous&&p.time-previous.time<180?'L':'M'}${x.toFixed(1)},${y(p.cents).toFixed(1)} `;previous=p;}trace.setAttribute('d',d);dot.toggleAttribute('hidden',!result?.reliable);if(result?.reliable){dot.setAttribute('cy',y(result.cents));dot.setAttribute('fill',Math.abs(result.cents)<=40?'#3f8c43':'#ba8745');}svg.setAttribute('aria-label',result?.reliable?`גובה השירה: ${Math.round(result.cents)} סנט ביחס למטרה`:'מקשיב לשירה');}
 return {reset,update};
}
