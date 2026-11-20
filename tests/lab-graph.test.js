import test from 'node:test';import assert from 'node:assert/strict';import {Window} from 'happy-dom';import {createPitchChart} from '../lab/shared/pitch-chart.js';
test('shared lab graph maps cents vertically, preserves 40 cent band, zooms smoothly and resets targets',async()=>{
 const w=new Window();w.document.body.innerHTML='<div id="live-chart"></div>';const d=w.document,chart=createPitchChart(d),range=()=>Number(d.querySelector('svg').dataset.rangeCents);
 chart.reset('C4');assert.equal(d.querySelector('#single-chart-target').textContent,'C4');chart.update({reliable:true,cents:200},0);assert.ok(Number(d.querySelector('circle').getAttribute('cy'))<160);assert.match(d.querySelector('#single-chart-direction').textContent,/רדו/);
 chart.update({reliable:true,cents:-200},50);assert.ok(Number(d.querySelector('circle').getAttribute('cy'))>160);assert.match(d.querySelector('#single-chart-direction').textContent,/עלו/);
 for(let t=100;t<1100;t+=50)chart.update({reliable:true,cents:400},t);assert.equal(range(),300);chart.update({reliable:true,cents:400},1100);assert.ok(range()>300&&range()<400);
 for(let t=1150;t<=4000;t+=50)chart.update({reliable:true,cents:400},t);assert.ok(range()>690);const r=range();chart.update(null,4050);assert.equal(range(),r);assert.ok(d.querySelector('circle').hasAttribute('hidden'));assert.equal(d.querySelector('#single-chart-direction').textContent,'מקשיב…');
 for(let t=4100;t<=9000;t+=50)chart.update({reliable:true,cents:0},t);assert.ok(range()<301);assert.equal(d.querySelector('circle').getAttribute('cy'),'160');assert.equal(d.querySelector('circle').getAttribute('fill'),'#3f8c43');
 chart.reset('G4');assert.equal(d.querySelector('#single-pitch-trace').getAttribute('d'),'');assert.equal(d.querySelector('#single-chart-target').textContent,'G4');assert.equal(range(),300);await w.happyDOM.close();
});
