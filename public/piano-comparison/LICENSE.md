# Comparison audio sources and modifications

This is a review-only subset, not a replacement for the training piano.

## Salamander

Salamander Grand Piano V3, Yamaha C5, Alexander Holm.
License: Creative Commons Attribution 3.0 Unported.
https://creativecommons.org/licenses/by/3.0/
Original: https://archive.org/details/SalamanderGrandPianoV3
Distribution used: @audio-samples/piano-velocity4 version 1.0.5
https://www.npmjs.com/package/@audio-samples/piano-velocity4
https://registry.npmjs.org/@audio-samples/piano-velocity4/-/piano-velocity4-1.0.5.tgz

The package wrapper has an MIT license; the **audio samples retain CC BY 3.0**.
Only velocity layer 4 is used. Notes not recorded directly are rendered from the
nearest sampled pitch (at most one semitone), using the equal-tempered rate ratio.
This preview does not claim separately measured concert-pitch calibration.

## Existing piano

FluidR3 GM Acoustic Grand Piano, Frank Wen and contributors, CC BY 3.0.
Source: https://github.com/gleitz/midi-js-soundfonts/tree/gh-pages/FluidR3_GM/acoustic_grand_piano-mp3
Original application files are unchanged.

## Processing applied to both sources

Trim to 0.8 seconds, 15 ms linear fade-in and 300 ms linear fade-out.
A single gain per source approximately matches median RMS across the 16 preview
notes to 0.075, while retaining their relative dynamics and limiting peak to 0.88.
Encode to stereo 44.1 kHz MP3, 128 kbit/s. Both sources use the same processing.
Measurements before MP3 encoding are in measurements.json; this is approximate
level matching, not a measured perceptual loudness match.

Playback inserts 50 ms silence between notes. No reverb or EQ is added.
