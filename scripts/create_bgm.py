"""Original 16-bar looping instrumental, '星めぐりの小径'. No samples used."""
from pathlib import Path
import numpy as np
import wave,subprocess
RATE=32000
BEAT=60/88
DURATION=64*BEAT
N=round(DURATION*RATE)
mix=np.zeros((N,2),dtype=np.float64)

def note(midi,beat,length,volume,kind,pan=0):
    f=440*2**((midi-69)/12)
    duration=length*BEAT+0.55
    t=np.arange(round(duration*RATE))/RATE
    attack=1-np.exp(-t/(0.012 if kind=='bell' else .04))
    release=np.minimum(1,np.maximum(0,(duration-t)/.15))
    env=attack*np.exp(-t/(length*BEAT*.65+.13))*release
    if kind=='bell':
        signal=np.sin(2*np.pi*f*t)+.23*np.sin(2*np.pi*f*2*t)*np.exp(-3*t)+.08*np.sin(2*np.pi*f*3*t)*np.exp(-6*t)
    elif kind=='bass': signal=np.sin(2*np.pi*f*t)+.12*np.sin(4*np.pi*f*t)
    else: signal=np.sin(2*np.pi*f*t)+.18*np.sin(4*np.pi*f*t)
    signal*=env*volume
    idx=(round(beat*BEAT*RATE)+np.arange(len(t)))%N
    np.add.at(mix[:,0],idx,signal*np.sqrt((1-pan)/2))
    np.add.at(mix[:,1],idx,signal*np.sqrt((1+pan)/2))

chords=[(50,[62,65,69,72]),(46,[62,65,70,74]),(53,[60,65,69,72]),(48,[60,64,67,74])]*4
melody=[
 [77,81,79,76,74,None,76,72], [74,77,81,None,79,77,74,None],
 [72,77,79,81,None,79,77,76], [74,76,79,None,76,72,74,None],
 [81,84,81,79,77,None,76,74], [77,81,82,None,81,77,74,None],
 [79,81,84,81,79,77,None,76], [79,76,74,None,72,76,74,None],
 [74,None,77,81,79,77,76,None], [74,77,81,82,None,81,77,74],
 [72,76,77,None,81,79,77,None], [76,79,81,79,76,None,74,72],
 [77,81,84,None,81,79,77,74], [74,77,81,None,82,81,77,None],
 [79,81,77,76,72,None,76,77], [79,76,74,None,72,76,73,None]]
for bar,(root,chord) in enumerate(chords):
    for offset in [0,2]:note(root,bar*4+offset,1.7,.14,'bass')
    for i in range(8):note(chord[[0,2,1,3,2,1,3,1][i]],bar*4+i*.5,.65,.035,'soft',(-.35 if i%2 else .35))
    for i,pitch in enumerate(melody[bar]):
        if pitch is not None:note(pitch,bar*4+i*.5,.8 if i%2 else .55,.055,'bell',.12)
# Circular delay: tails flow across the loop seam.
wet=mix.copy()
for seconds,gain in [(0.17,.12),(.31,.08),(.47,.04)]:wet+=np.roll(mix,round(seconds*RATE),axis=0)*gain
wet*=.65/max(np.max(np.abs(wet)),.001)
assert np.isfinite(wet).all() and np.max(np.abs(wet))<.7
root=Path(__file__).resolve().parents[1]
temp=Path('/workspace/scratch/48f4d5173f2c/bgm-master.wav')
with wave.open(str(temp),'wb') as w:
    w.setnchannels(2);w.setsampwidth(2);w.setframerate(RATE);w.writeframes((wet*32767).astype('<i2').tobytes())
subprocess.run(['ffmpeg','-hide_banner','-loglevel','error','-y','-i',str(temp),'-codec:a','libmp3lame','-b:a','128k','-metadata','title=星めぐりの小径','-metadata','comment=Original synthesized composition for Amida puzzle',str(root/'dist/audio/starlit-path.mp3')],check=True)
print(f'BGM: {DURATION:.2f}s; stereo; peak {np.max(np.abs(wet)):.3f}; RMS {np.sqrt(np.mean(wet**2)):.3f}')
