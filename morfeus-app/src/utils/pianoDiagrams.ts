// Piyano tuş yapısı (2 Oktav: C'den B'ye)
export interface PianoKey {
    note: string;
    isBlack: boolean;
    semitone: number; // 0 (C) .. 23 (B2)
  }
  
  export const PIANO_OCTAVE_NOTES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
  
  export const PIANO_KEYS_2_OCTAVES: PianoKey[] = [
    // 1. Oktav (0-11)
    { note: 'C', isBlack: false, semitone: 0 },
    { note: 'C#', isBlack: true, semitone: 1 },
    { note: 'D', isBlack: false, semitone: 2 },
    { note: 'D#', isBlack: true, semitone: 3 },
    { note: 'E', isBlack: false, semitone: 4 },
    { note: 'F', isBlack: false, semitone: 5 },
    { note: 'F#', isBlack: true, semitone: 6 },
    { note: 'G', isBlack: false, semitone: 7 },
    { note: 'G#', isBlack: true, semitone: 8 },
    { note: 'A', isBlack: false, semitone: 9 },
    { note: 'A#', isBlack: true, semitone: 10 },
    { note: 'B', isBlack: false, semitone: 11 },
  
    // 2. Oktav (12-23)
    { note: 'C', isBlack: false, semitone: 12 },
    { note: 'C#', isBlack: true, semitone: 13 },
    { note: 'D', isBlack: false, semitone: 14 },
    { note: 'D#', isBlack: true, semitone: 15 },
    { note: 'E', isBlack: false, semitone: 16 },
    { note: 'F', isBlack: false, semitone: 17 },
    { note: 'F#', isBlack: true, semitone: 18 },
    { note: 'G', isBlack: false, semitone: 19 },
    { note: 'G#', isBlack: true, semitone: 20 },
    { note: 'A', isBlack: false, semitone: 21 },
    { note: 'A#', isBlack: true, semitone: 22 },
    { note: 'B', isBlack: false, semitone: 23 },
  ];
  
  const NOTE_SEMITONES: Record<string, number> = {
    'C': 0, 'C#': 1, 'Db': 1,
    'D': 2, 'D#': 3, 'Eb': 3,
    'E': 4,
    'F': 5, 'F#': 6, 'Gb': 6,
    'G': 7, 'G#': 8, 'Ab': 8,
    'A': 9, 'A#': 10, 'Bb': 10,
    'B': 11,
  };
  
  // Akor uzantılarına göre aralıklar (yarı ton farkları)
  const CHORD_INTERVALS: Record<string, number[]> = {
    '': [0, 4, 7],               // Major
    'm': [0, 3, 7],              // Minor
    '7': [0, 4, 7, 10],          // Dom 7
    'm7': [0, 3, 7, 10],         // Min 7
    'maj7': [0, 4, 7, 11],       // Maj 7
    '9': [0, 4, 7, 10, 14],      // Dom 9
    'm9': [0, 3, 7, 10, 14],     // Min 9
    'maj9': [0, 4, 7, 11, 14],   // Maj 9
    '11': [0, 4, 7, 10, 14, 17], // Dom 11
    'm11': [0, 3, 7, 10, 14, 17],// Min 11
    '13': [0, 4, 7, 10, 14, 21], // Dom 13
    '6/9': [0, 4, 7, 9, 14],     // 6/9
    'm6/9': [0, 3, 7, 9, 14],    // Min 6/9
    '7(b9)': [0, 4, 7, 10, 13],  // 7(b9)
    'maj7(#11)': [0, 4, 7, 11, 18], // maj7(#11)
    'sus4': [0, 5, 7],           // Sus4
    'dim': [0, 3, 6],            // Dim
  };
  
  export function getPianoKeysForChord(chordName: string): { activeSemitones: number[]; activeNoteNames: string[] } {
    const clean = chordName.replace(/[\[\]]/g, '').trim();
    const match = clean.match(/^([A-G][b#]?)(.*)$/);
  
    if (!match) {
      return { activeSemitones: [0, 4, 7], activeNoteNames: ['C', 'E', 'G'] };
    }
  
    const rootNote = match[1];
    let extension = match[2] || '';
  
    const rootSemitone = NOTE_SEMITONES[rootNote] ?? 0;
    let intervals = CHORD_INTERVALS[extension];
  
    if (!intervals) {
      if (extension.startsWith('m') && !extension.startsWith('maj')) {
        intervals = CHORD_INTERVALS['m'];
      } else if (extension.includes('maj7')) {
        intervals = CHORD_INTERVALS['maj7'];
      } else if (extension.includes('7')) {
        intervals = CHORD_INTERVALS['7'];
      } else {
        intervals = CHORD_INTERVALS[''];
      }
    }
  
    // 2 oktavlık aralık içinde aktif tuşları ve isimleri hesapla
    const activeSemitones: number[] = [];
    const activeNoteNames: string[] = [];
  
    for (const interval of intervals) {
      const rawVal = rootSemitone + interval;
      const boundedVal = rawVal % 24;
      const noteName = PIANO_OCTAVE_NOTES[boundedVal % 12];
  
      if (!activeSemitones.includes(boundedVal)) {
        activeSemitones.push(boundedVal);
        activeNoteNames.push(noteName);
      }
    }
  
    return { activeSemitones, activeNoteNames };
  }