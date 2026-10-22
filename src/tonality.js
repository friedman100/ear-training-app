import {BASS_PATTERNS,pc} from './bass.js';
// Questions are transpositions of C major / its relative A minor. Choose a standard
// major-key spelling, then keep the diatonic letter for every progression root.
const TONICS=[0,1,1,2,2,3,3,4,5,5,6,6]; // C, Db, D, Eb, E, F, F#, G, Ab, A, Bb, B
const LETTERS=['C','D','E','F','G','A','B'];
const HEBREW=['דו','רה','מי','פה','סול','לה','סי'];
const NATURALS=[0,2,4,5,7,9,11];
export function progressionRootNames(q){
 return BASS_PATTERNS[q.patternIndex].degrees.map(offset=>{
 const degree=NATURALS.indexOf(offset);if(degree<0)throw Error('Root requires an explicit scale degree');
 const letter=(TONICS[q.key]+degree)%7,target=pc(q.key+offset),accidental=((target-NATURALS[letter]+18)%12)-6;
 return {english:LETTERS[letter]+(accidental>0?'♯'.repeat(accidental):'♭'.repeat(-accidental)),hebrew:HEBREW[letter]+(accidental===1?' דיאז':accidental===-1?' במול':''),pitchClass:target};
 });
}
