# Salamander Grand Piano — training samples

Salamander Grand Piano V3, Yamaha C5, by Alexander Holm.
Audio license: Creative Commons Attribution 3.0 Unported (CC BY 3.0).
https://creativecommons.org/licenses/by/3.0/
Original: https://archive.org/details/SalamanderGrandPianoV3
Source distribution: @audio-samples/piano-velocity4@1.0.5
https://www.npmjs.com/package/@audio-samples/piano-velocity4

The package wrapper's MIT license does not replace the audio's CC BY 3.0 license.

Adaptations: velocity layer 4 only; render C3–C7 from nearest sampled pitch using
an equal-tempered playback-rate ratio (maximum one semitone), resample to 44.1 kHz,
trim to 1.2 seconds, apply the same source-wide gain as the approved audition
(1.9467925623), encode stereo MP3 at 128 kbit/s. The runtime applies a 15 ms attack,
a gentle release from 0.5 seconds through 1.05 seconds. The second note starts
after 0.85 seconds, overlapping the first note's quiet release by 0.2 seconds. The runtime does not apply a
second copy of the audition's envelope or normalize notes independently.

Reproduction: scripts/prepare-salamander.py.
The prior FluidR3 audition remains in public/piano-comparison with its own credits.
