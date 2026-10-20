"""Prepare review-only clips. Source: @audio-samples/piano-velocity4@1.0.5.
Extract its audio files into work/piano-comparison/source before running.
Requires ffmpeg and Python's standard library. Does not alter training assets.
"""
import array, json, math, pathlib, re, statistics, subprocess
root=pathlib.Path('work/piano-comparison/source')
out=pathlib.Path('public/piano-comparison');out.mkdir(exist_ok=True)
notes=sorted({base+interval for base in [48,60,72] for interval in [0,3,4,5,7,12]})
source_notes={}
for p in root.glob('*.ogg'):
 m=re.fullmatch(r'([A-G]#?)(\d)v4',p.stem)
 if m:
  pitch={'C':0,'D#':3,'F#':6,'A':9}[m[1]]+12*(int(m[2])+1)
  source_notes[pitch]=p
clips={}
for bank in ['current','salamander']:
 clips[bank]={}
 for note in notes:
  src=pathlib.Path(f'public/audio/{note}.mp3') if bank=='current' else source_notes[min(source_notes,key=lambda n:abs(n-note))]
  filters=[]
  if bank=='salamander':
   original=min(source_notes,key=lambda n:abs(n-note))
   info=json.loads(subprocess.check_output(['ffprobe','-v','error','-show_entries','stream=sample_rate','-of','json',str(src)]))
   rate=int(info['streams'][0]['sample_rate']);filters+=[f'asetrate={rate*2**((note-original)/12):.8f}','aresample=44100']
  filters+=['atrim=duration=0.8','asetpts=PTS-STARTPTS','afade=t=in:st=0:d=0.015','afade=t=out:st=0.5:d=0.3']
  raw=subprocess.check_output(['ffmpeg','-v','error','-i',str(src),'-af',','.join(filters),'-ar','44100','-ac','2','-f','f32le','-'])
  data=array.array('f');data.frombytes(raw);clips[bank][note]=data
# One gain per source: approximate equal RMS, retain dynamics between notes.
meta={'duration':.8,'gap':.05,'velocityLayer':4,'notes':notes,'banks':{}}
for bank,items in clips.items():
 rms=[math.sqrt(sum(v*v for v in d)/len(d)) for d in items.values()]
 peak=max(max(abs(v) for v in d) for d in items.values())
 gain=min(.075/statistics.median(rms),.88/peak)
 meta['banks'][bank]={'gain':gain,'medianRms':statistics.median(rms)*gain,'peak':peak*gain}
 for note,data in items.items():
  scaled=array.array('f',(v*gain for v in data))
  subprocess.run(['ffmpeg','-v','error','-y','-f','f32le','-ar','44100','-ac','2','-i','-','-c:a','libmp3lame','-b:a','128k',str(out/f'{bank}-{note}.mp3')],input=scaled.tobytes(),check=True)
(out/'measurements.json').write_text(json.dumps(meta,indent=2)+'\n')
print(json.dumps(meta,indent=2))
