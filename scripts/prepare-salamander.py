"""Prepare all 49 training pitches from Salamander V3 velocity layer 4.
Extract @audio-samples/piano-velocity4@1.0.5 audio files into
work/piano-comparison/source first. Requires ffmpeg; uses no Python dependencies.
The existing runtime envelope provides the attack/release (not baked in twice).
"""
import array,json,pathlib,re,subprocess
source=pathlib.Path('work/piano-comparison/source')
out=pathlib.Path('public/audio');source_notes={}
for p in source.glob('*.ogg'):
 m=re.fullmatch(r'([A-G]#?)(\d)v4',p.stem)
 if m:source_notes[{'C':0,'D#':3,'F#':6,'A':9}[m[1]]+12*(int(m[2])+1)]=p
assert source_notes,'Missing Salamander source audio'
# Keep the source-wide level chosen for the audition, not per-note normalization.
gain=json.loads(pathlib.Path('public/piano-comparison/measurements.json').read_text())['banks']['salamander']['gain']
max_peak=0
for note in range(48,97):
 original=min(source_notes,key=lambda n:abs(n-note));src=source_notes[original]
 info=json.loads(subprocess.check_output(['ffprobe','-v','error','-show_entries','stream=sample_rate','-of','json',str(src)]))
 rate=int(info['streams'][0]['sample_rate'])
 filters=f'asetrate={rate*2**((note-original)/12):.8f},aresample=44100,atrim=duration=1.2,asetpts=PTS-STARTPTS'
 raw=subprocess.check_output(['ffmpeg','-v','error','-i',str(src),'-af',filters,'-ar','44100','-ac','2','-f','f32le','-'])
 data=array.array('f');data.frombytes(raw);scaled=array.array('f',(v*gain for v in data))
 peak=max(abs(v) for v in scaled);assert peak<.95,(note,peak)
 max_peak=max(max_peak,peak)
 subprocess.run(['ffmpeg','-v','error','-y','-f','f32le','-ar','44100','-ac','2','-i','-','-c:a','libmp3lame','-b:a','128k',str(out/f'{note}.mp3')],input=scaled.tobytes(),check=True)
print(f'Prepared 49 Salamander pitches. Source gain={gain:.6f}; maximum uncompressed peak={max_peak:.3f}')
