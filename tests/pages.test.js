import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile,access,readdir} from 'node:fs/promises';

test('GitHub Pages serves JS, CSS and all piano samples under the repository path',async()=>{
 const html=await readFile('dist/index.html','utf8');
 const assets=[...html.matchAll(/(?:src|href)="([^"]+\.(?:js|css))"/g)].map(m=>m[1]);
 assert.equal(assets.length,2);
 for(const url of assets){
 assert.ok(url.startsWith('/ear-training-app/assets/'));
 await access('dist/'+url.replace('/ear-training-app/',''));
 }
 const bundle=await readFile('dist/assets/'+(await readdir('dist/assets')).find(f=>f.endsWith('.js')),'utf8');
 assert.ok(bundle.includes('/ear-training-app/audio/'));
 for(let note=48;note<=96;note++){
 const served=await readFile(`dist/audio/${note}.mp3`);
 const original=await readFile(`public/audio/${note}.mp3`);
 assert.deepEqual(served,original);
 }
});
