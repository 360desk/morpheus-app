const SCALE_SHARP = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
const SCALE_FLAT  = ['C', 'Db', 'D', 'Eb', 'E', 'F', 'Gb', 'G', 'Ab', 'A', 'Bb', 'B'];

export const ALL_TONES = [
  'C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B',
  'Cm', 'C#m', 'Dm', 'D#m', 'Em', 'Fm', 'F#m', 'Gm', 'G#m', 'Am', 'A#m', 'Bm'
];

export function transposeChord(chord: string, semitones: number): string {
  if (semitones === 0) return chord;

  const match = chord.match(/^([A-G][#b]?)(.*)$/);
  if (!match) return chord;

  const root = match[1];
  const suffix = match[2];

  let index = SCALE_SHARP.indexOf(root);
  if (index === -1) index = SCALE_FLAT.indexOf(root);
  if (index === -1) return chord;

  let newIndex = (index + semitones) % 12;
  if (newIndex < 0) newIndex += 12;

  const preferFlat = root.includes('b');
  const transposedRoot = preferFlat ? SCALE_FLAT[newIndex] : SCALE_SHARP[newIndex];

  return transposedRoot + suffix;
}

export function transposeContent(content: string, semitones: number): string {
  if (semitones === 0) return content;
  const chordRegex = /\[([A-G][#b]?(?:m|maj|min|dim|aug|sus[24]?|[0-9]+)*(?:\/[A-G][#b]?)?)\]/g;
  return content.replace(chordRegex, (_, chord) => `[${transposeChord(chord, semitones)}]`);
}
