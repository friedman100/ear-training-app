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

test('published singing page resolves shared controllers, styles and piano samples from its project path',async()=>{
 const html=await readFile('dist/singing/index.html','utf8');
 assert.ok(html.includes('data-singing-production'));assert.ok(!html.includes('ניסוי אישי'));assert.ok(html.includes('timed-retry'));
 const page=new URL('https://friedman100.github.io/ear-training-app/singing/');
 for(const match of html.matchAll(/(?:src|href)="([^"#]+\.(?:js|css)(?:\?[^" ]*)?)"/g)){const url=new URL(match[1],page);assert.ok(url.pathname.startsWith('/ear-training-app/'));await access('dist/'+url.pathname.replace('/ear-training-app/',''));}
 for(const path of ['singing/experience.js','sing-back/app.js','sing-back/timed-pair.js','sing-back/timeline.js']){
 const js=await readFile('dist/'+path,'utf8');for(const match of js.matchAll(/from ['"]([^'"]+)['"]/g)){const url=new URL(match[1],new URL(path,'https://example.test/ear-training-app/'));await access('dist/'+url.pathname.replace('/ear-training-app/',''));}
 }
});
