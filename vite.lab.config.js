import {defineConfig} from 'vite';
export default defineConfig({base:'/',build:{outDir:'dist-lab',rollupOptions:{input:{intervals:'lab/harmonic-separation/index.html',chords:'lab/chord-separation/index.html'}}}});
