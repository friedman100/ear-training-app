import {defineConfig} from 'vite';
export default defineConfig({base:'/',build:{outDir:'dist-lab',rollupOptions:{input:'lab/harmonic-separation/index.html'}}});
