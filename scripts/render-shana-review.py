"""Render review-only piano files from the instrumental demonstration; never edits references.
Requires numpy and ffmpeg. The user's recording is not needed or published.
"""
import json,subprocess
from pathlib import Path
import numpy as np
ROOT=Path(__file__).resolve().parents[1]
OUT=ROOT/'public/previews'
RATE=44100
APPROVED=json.loads((ROOT/'src/reference-data/shana-approved.json').read_text())
NOTES=APPROVED['notes']
ONSETS=APPROVED['onsets']
CACHE={}
def render(name,notes,onsets,holds,releases):
 lead=.12
 end=max(at+hold+release for at,hold,release in zip(onsets,holds,releases))
 mix=np.zeros(round((lead+end+.2)*RATE),dtype=np.float64)
 for midi,at,duration,release in zip(notes,onsets,holds,releases):
  if midi not in CACHE:
   raw=subprocess.check_output(['ffmpeg','-v','error','-i',str(ROOT/f'public/audio/{midi}.mp3'),'-ac','1','-ar',str(RATE),'-f','f32le','-'])
   CACHE[midi]=np.frombuffer(raw,dtype='<f4').astype(np.float64)
  n=round((duration+release)*RATE)
  signal=np.zeros(n);sample=CACHE[midi];signal[:min(n,len(sample))]=sample[:n]
  points=[0,.015,max(.02,duration-.3),duration,duration+release-.02,duration+release]
  levels=[0,.8,.8,.28,.00008,0];env=np.zeros(n)
  for i in range(len(points)-1):
   a=max(0,round(points[i]*RATE));b=min(n,round(points[i+1]*RATE));count=b-a
   if count<=0:continue
   env[a:b]=np.geomspace(levels[i],levels[i+1],count) if i in [2,3] else np.linspace(levels[i],levels[i+1],count)
  index=round((lead+at)*RATE);mix[index:index+n]+=signal*env
 peak=float(np.max(np.abs(mix)))
 if peak>.9:mix*=.9/peak
 path=OUT/name
 subprocess.run(['ffmpeg','-v','error','-y','-f','f32le','-ar',str(RATE),'-ac','1','-i','-','-codec:a','libmp3lame','-b:a','128k',str(path)],input=mix.astype('<f4').tobytes(),check=True)
 print(json.dumps({'file':name,'notes':notes,'onsets':onsets,'seconds':round(len(mix)/RATE,3),'peak':round(peak,3)}))
 return mix
OUT.mkdir(exist_ok=True)
# Review pitches independently of their rhythmic role.
rest=NOTES[6:]
render('shana-continuation-check.mp3',rest,[i*.85 for i in range(len(rest))],[.65]*(len(rest)-1)+[.9],[.15]*(len(rest)-1)+[.35])
# Keep the already approved first-six timing, then follow the remaining measured attacks.
holds=APPROVED['holds']
assert len(holds)==len(NOTES)
render('shana-full-rhythm-review.mp3',NOTES,ONSETS,holds,APPROVED['releases'])
