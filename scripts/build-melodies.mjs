import {build} from 'vite';
import {mkdir,readFile,writeFile,cp} from 'node:fs/promises';
await build({configFile:'vite.melody.config.js'});
await mkdir('dist/melody-lab',{recursive:true});
await writeFile('dist/melody-lab/index.html',(await readFile('dist-melody/melody-lab/index.html','utf8')).replaceAll('../assets/','./assets/'));
await cp('dist-melody/assets','dist/melody-lab/assets',{recursive:true});
await cp('public/audio','dist/melody-lab/audio',{recursive:true});
