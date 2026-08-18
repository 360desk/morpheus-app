// Temel ve alternatif nota dizilimleri
export const CHROMATIC_SHARP = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
export const CHROMATIC_FLAT = ['C', 'Db', 'D', 'Eb', 'E', 'F', 'Gb', 'G', 'Ab', 'A', 'Bb', 'B'];

export const ALL_TONES = [
  'C', 'C#', 'Db', 'D', 'D#', 'Eb', 'E', 'F', 'F#', 'Gb', 'G', 'G#', 'Ab', 'A', 'A#', 'Bb', 'B',
  'Cm', 'C#m', 'Dbm', 'Dm', 'D#m', 'Ebm', 'Em', 'Fm', 'F#m', 'Gbm', 'Gm', 'G#m', 'Abm', 'Am', 'A#m', 'Bbm', 'Bm'
];

// Caz, Flamenko ve Makam uzantılarını (Örn: E7(b9), Fmaj7(#11), Bb13, Am6/9) eksiksiz tanıyan Regex
export const CHORD_REGEX_STR = `[A-G][b#]?(?:maj|min|m|M|dim|aug|sus|add)?[0-9]*(?:\\/[0-9]+)?(?:\\([b#]?[0-9]+(?:,[b#]?[0-9]+)*\\))?(?:\\/[A-G][b#]?)?`;

const CHORD_FULL_REGEX = new RegExp(`^${CHORD_REGEX_STR}$`);
const CHORD_GLOBAL_REGEX = new RegExp(`\\b${CHORD_REGEX_STR}\\b`, 'g');

export function normalizeNote(note: string): number {
  let idx = CHROMATIC_SHARP.indexOf(note);
  if (idx === -1) idx = CHROMATIC_FLAT.indexOf(note);
  return idx;
}

export function transposeSingleChordName(chord: string, semitones: number): string {
  if (semitones === 0) return chord;

  const match = chord.match(/^([A-G][b#]?)(.*)$/);
  if (!match) return chord;

  const root = match[1];
  const extension = match[2];

  let rootIndex = normalizeNote(root);
  if (rootIndex === -1) return chord;

  let newIndex = (rootIndex + semitones) % 12;
  if (newIndex < 0) newIndex += 12;

  const preferFlat = root.includes('b') || ['F', 'Bb', 'Eb', 'Ab', 'Db'].includes(root);
  const newRoot = preferFlat ? CHROMATIC_FLAT[newIndex] : CHROMATIC_SHARP[newIndex];

  return newRoot + extension;
}

export function transposeChord(chord: string, semitones: number): string {
  if (chord.includes('/')) {
    const parts = chord.split('/');
    return parts.map(p => transposeSingleChordName(p, semitones)).join('/');
  }
  return transposeSingleChordName(chord, semitones);
}

// Bir satırın akor satırı olup olmadığını katı şekilde tespit eden motor
export function isChordLine(line: string): boolean {
  const trimmed = line.trim();
  if (!trimmed) return false;

  // Parantezli veya özel caz akorlarını da boşluklara göre düzgün bölelim
  const tokens = trimmed.split(/\s+/);
  let chordCount = 0;

  for (const tok of tokens) {
    const cleanTok = tok.replace(/[\[\]]/g, '').trim();
    if (CHORD_FULL_REGEX.test(cleanTok)) {
      chordCount++;
    }
  }

  return chordCount / tokens.length >= 0.5;
}

export function transposeContent(content: string, semitones: number): string {
  if (semitones === 0) return content;

  const lines = content.split('\n');
  const processedLines = lines.map(line => {
    if (isChordLine(line)) {
      return line.replace(CHORD_GLOBAL_REGEX, (match) => {
        return transposeChord(match, semitones);
      });
    }

    return line.replace(new RegExp(`\\[(${CHORD_REGEX_STR})\\]`, 'g'), (_, chordMatch) => {
      return `[${transposeChord(chordMatch, semitones)}]`;
    });
  });

  return processedLines.join('\n');
}