"""Reproducible original demo. Requires Python/numpy and ffmpeg; not needed to run the app."""
import json, subprocess
from pathlib import Path
import numpy as np
ROOT = Path(__file__).resolve().parents[1]
song = json.loads((ROOT/'src/songs/catalog.json').read_text())[0]
RATE = 22050
mix = np.zeros((round(song['duration']*RATE), 2), dtype=np.float64)
cache = {}
rng = np.random.default_rng(1729)
def piano(midi):
    sample = midi+12 if midi < 48 else midi
    if sample not in cache:
        data = subprocess.check_output(['ffmpeg','-v','error','-i',str(ROOT/f'public/audio/{sample}.mp3'),'-f','f32le','-ac','1','-ar',str(RATE),'-'])
        cache[sample] = np.frombuffer(data, dtype='<f4').astype(np.float64)
    data = cache[sample]
    if midi < 48:
        data = np.interp(np.arange(0,len(data)-1,.5), np.arange(len(data)), data)
    return data
def add(data, at, gain, pan=0):
    index = round(at*RATE)
    length = min(len(data),len(mix)-index)
    if length <= 0: return
    mix[index:index+length,0] += data[:length]*gain*np.sqrt((1-pan)/2)
    mix[index:index+length,1] += data[:length]*gain*np.sqrt((1+pan)/2)
def note(midi, at, duration, gain, pan=0):
    data = piano(midi)[:round((duration+.18)*RATE)].copy()
    release = min(round(.18*RATE),len(data))
    data[-release:] *= np.linspace(1,0,release)**2
    add(data,at,gain,pan)
beat = 60/song['bpm']
for part in song['parts']:
    chord_seconds = part['beatsPerChord']*beat
    for bar, at in enumerate(np.arange(part['start'],part['end'],chord_seconds)):
        chord = part['chords'][bar%len(part['chords'])]
        root, third = chord['root'], 4 if chord['quality']=='major' else 3
        notes = [root+12,root+12+third,root+19]
        for offset,gain in [(0,.7),(2*beat,.26)]:
            for i,midi in enumerate(notes): note(midi,at+offset,chord_seconds-offset-.12,gain,(i-1)*.3)
        for offset in [0,2*beat]: note(36+root%12,at+offset,2*beat-.08,1.1)
        # Quiet broken upper voicing adds motion without obscuring root basses.
        for i in range(4): note(notes[i%3]+12,at+(i+.5)*beat,.38,.12 if part['id']=='verse' else .2,.35)
for i,at in enumerate(np.arange(0,song['duration'],beat/2)):
    t = np.arange(round(.09*RATE))/RATE
    hat = rng.normal(0,1,len(t))*np.exp(-t*65)
    hat = np.r_[0,np.diff(hat)]*.022
    add(hat,at,1,.3)
    if i%4==0:
        t=np.arange(round(.3*RATE))/RATE
        kick=np.sin(2*np.pi*(48*t+50*(1-np.exp(-t*28))/28))*np.exp(-t*14)*.24
        add(kick,at,1)
    elif i%4==2:
        t=np.arange(round(.16*RATE))/RATE
        snare=(rng.normal(0,1,len(t))*.07+np.sin(2*np.pi*175*t)*.05)*np.exp(-t*24)
        add(snare,at,1,-.15)
fade=round(.18*RATE)
mix[:round(.008*RATE)] *= np.linspace(0,1,round(.008*RATE))[:,None]
mix[-fade:] *= np.linspace(1,0,fade)[:,None]**2
mix *= .87/max(.0001,np.max(np.abs(mix)))
output=ROOT/'public'/song['audio']
output.parent.mkdir(parents=True,exist_ok=True)
subprocess.run(['ffmpeg','-y','-v','error','-f','f32le','-ar',str(RATE),'-ac','2','-i','-','-codec:a','libmp3lame','-b:a','160k',str(output)],input=mix.astype('<f4').tobytes(),check=True)
print(f'Created {output.name}: {song["duration"]} seconds, peak {np.max(np.abs(mix)):.2f}')
