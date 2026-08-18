const SCALE_SHARP = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
const SCALE_FLAT  = ['C', 'Db', 'D', 'Eb', 'E', 'F', 'Gb', 'G', 'Ab', 'A', 'Bb', 'B'];

export const ALL_TONES = [
  'C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B',
  'Cm', 'C#m', 'Dm', 'D#m', 'Em', 'Fm', 'F#m', 'Gm', 'G#m', 'Am', 'A#m', 'Bm'
];

export const CHORD_REGEX_STR = '[A-G][#b]?(?:m|maj|min|dim|aug|sus[24]?|[0-9]+)*(?:\\/[A-G][#b]?)?';

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

// Bir satırın sırf akorlardan oluşup oluşmadığını test eder
export function isChordLine(line: string): boolean {
  const trimmed = line.trim();
  if (!trimmed) return false;
  
  // Boşluklara göre kelimelere böl
  const tokens = trimmed.split(/\s+/);
  const chordRegex = new RegExp(`^${CHORD_REGEX_STR}$`);
  
  // Kelimelerin en az %70'i akor ise o satır akor satırıdır
  const chordMatches = tokens.filter(t => chordRegex.test(t));
  return chordMatches.length > 0 && (chordMatches.length / tokens.length) >= 0.7;
}

export function transposeContent(content: string, semitones: number): string {
  if (semitones === 0) return content;

  // 1. Köşeli parantezli akorları transpoze et: [Am] -> [Bm]
  let result = content.replace(
    new RegExp(`\\[(${CHORD_REGEX_STR})\\]`, 'g'),
    (_, chord) => `[${transposeChord(chord, semitones)}]`
  );

  // 2. Satır satır inceleyip düz akor satırlarını transpoze et
  const lines = result.split('\n');
  const transposedLines = lines.map(line => {
    if (isChordLine(line)) {
      const singleChordRegex = new RegExp(`\\b(${CHORD_REGEX_STR})\\b`, 'g');
      return line.replace(singleChordRegex, (ch) => transposeChord(ch, semitones));
    }
    return line;
  });

  return transposedLines.join('\n');
}