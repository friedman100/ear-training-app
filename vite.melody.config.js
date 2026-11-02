import {defineConfig} from 'vite';
export default defineConfig({base:'./',build:{outDir:'dist-melody',rollupOptions:{input:'melody-lab/index.html'}}});
