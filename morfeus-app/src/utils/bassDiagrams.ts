// 4 Telli Bas Gitar: [E (4. Tel), A (3. Tel), D (2. Tel), G (1. Tel)]
// -1: Çalınmaz (X), 0: Boş Tel (O), >0: Perde Numarası
export interface BassVoicing {
    frets: number[]; // [E, A, D, G]
    baseFret: number;
    label: string;
    chordTones: { stringIdx: number; fret: number; interval: string; isRoot?: boolean }[];
  }
  
  export const BASS_CHORDS_DB: Record<string, BassVoicing[]> = {
    // === MINOR AKORLAR ===
    'Am': [
      {
        frets: [5, -1, -1, 5],
        baseFret: 5,
        label: 'Kök 4. Tel (10\'lu Aralık Akoru)',
        chordTones: [
          { stringIdx: 0, fret: 5, interval: 'R', isRoot: true },   // A
          { stringIdx: 1, fret: 7, interval: '5' },                // E
          { stringIdx: 2, fret: 7, interval: 'R' },                // A
          { stringIdx: 3, fret: 5, interval: 'b3' },               // C
        ],
      },
      {
        frets: [-1, 0, 2, 2],
        baseFret: 1,
        label: 'Açık Tel Pozisyonu',
        chordTones: [
          { stringIdx: 1, fret: 0, interval: 'R', isRoot: true },   // A
          { stringIdx: 2, fret: 2, interval: '5' },                // E
          { stringIdx: 3, fret: 2, interval: 'R' },                // A
        ],
      },
    ],
    'Dm': [
      {
        frets: [-1, 5, -1, 7],
        baseFret: 5,
        label: 'Kök 3. Tel (10\'lu Aralık Akoru)',
        chordTones: [
          { stringIdx: 1, fret: 5, interval: 'R', isRoot: true },   // D
          { stringIdx: 2, fret: 7, interval: '5' },                // A
          { stringIdx: 3, fret: 7, interval: 'b3' },               // F
        ],
      },
      {
        frets: [10, -1, -1, 10],
        baseFret: 10,
        label: '10. Perde Caz Voicing',
        chordTones: [
          { stringIdx: 0, fret: 10, interval: 'R', isRoot: true },  // D
          { stringIdx: 1, fret: 12, interval: '5' },               // A
          { stringIdx: 3, fret: 10, interval: 'b3' },              // F
        ],
      },
    ],
    'Em': [
      {
        frets: [0, 2, 2, 0],
        baseFret: 1,
        label: 'Açık Tel Pozisyonu',
        chordTones: [
          { stringIdx: 0, fret: 0, interval: 'R', isRoot: true },   // E
          { stringIdx: 1, fret: 2, interval: '5' },                // B
          { stringIdx: 2, fret: 2, interval: 'R' },                // E
          { stringIdx: 3, fret: 0, interval: 'b3' },               // G
        ],
      },
      {
        frets: [-1, 7, -1, 9],
        baseFret: 7,
        label: '7. Perde 10\'lu Aralık',
        chordTones: [
          { stringIdx: 1, fret: 7, interval: 'R', isRoot: true },   // E
          { stringIdx: 2, fret: 9, interval: '5' },                // B
          { stringIdx: 3, fret: 9, interval: 'b3' },               // G
        ],
      },
    ],
    'Gm': [
      {
        frets: [3, -1, -1, 3],
        baseFret: 3,
        label: 'Kök 4. Tel (3. Perde 10\'lu)',
        chordTones: [
          { stringIdx: 0, fret: 3, interval: 'R', isRoot: true },   // G
          { stringIdx: 1, fret: 5, interval: '5' },                // D
          { stringIdx: 2, fret: 5, interval: 'R' },                // G
          { stringIdx: 3, fret: 3, interval: 'b3' },               // Bb
        ],
      },
    ],
    'Bm': [
      {
        frets: [7, -1, -1, 7],
        baseFret: 7,
        label: 'Kök 4. Tel (7. Perde 10\'lu)',
        chordTones: [
          { stringIdx: 0, fret: 7, interval: 'R', isRoot: true },   // B
          { stringIdx: 1, fret: 9, interval: '5' },                // F#
          { stringIdx: 3, fret: 7, interval: 'b3' },               // D
        ],
      },
    ],
    'Bbm': [
      {
        frets: [6, -1, -1, 6],
        baseFret: 6,
        label: 'Kök 4. Tel (6. Perde)',
        chordTones: [
          { stringIdx: 0, fret: 6, interval: 'R', isRoot: true },   // Bb
          { stringIdx: 1, fret: 8, interval: '5' },                // F
          { stringIdx: 3, fret: 6, interval: 'b3' },               // Db
        ],
      },
    ],
  
    // === MAJOR AKORLAR ===
    'C': [
      {
        frets: [-1, 3, -1, 5],
        baseFret: 3,
        label: 'Kök 3. Tel (3. Perde 10\'lu)',
        chordTones: [
          { stringIdx: 1, fret: 3, interval: 'R', isRoot: true },   // C
          { stringIdx: 2, fret: 5, interval: '5' },                // G
          { stringIdx: 3, fret: 5, interval: '3' },                // E
        ],
      },
      {
        frets: [8, -1, -1, 9],
        baseFret: 8,
        label: 'Kök 4. Tel (8. Perde)',
        chordTones: [
          { stringIdx: 0, fret: 8, interval: 'R', isRoot: true },   // C
          { stringIdx: 1, fret: 10, interval: '5' },               // G
          { stringIdx: 3, fret: 9, interval: '3' },                // E
        ],
      },
    ],
    'D': [
      {
        frets: [-1, 5, -1, 7],
        baseFret: 5,
        label: 'Kök 3. Tel (5. Perde 10\'lu)',
        chordTones: [
          { stringIdx: 1, fret: 5, interval: 'R', isRoot: true },   // D
          { stringIdx: 2, fret: 7, interval: '5' },                // A
          { stringIdx: 3, fret: 7, interval: '3' },                // F#
        ],
      },
    ],
    'E': [
      {
        frets: [0, 2, 2, 1],
        baseFret: 1,
        label: 'Açık Tel Pozisyonu',
        chordTones: [
          { stringIdx: 0, fret: 0, interval: 'R', isRoot: true },   // E
          { stringIdx: 1, fret: 2, interval: '5' },                // B
          { stringIdx: 2, fret: 2, interval: 'R' },                // E
          { stringIdx: 3, fret: 1, interval: '3' },                // G#
        ],
      },
    ],
    'F': [
      {
        frets: [1, -1, -1, 2],
        baseFret: 1,
        label: 'Kök 4. Tel (1. Perde 10\'lu)',
        chordTones: [
          { stringIdx: 0, fret: 1, interval: 'R', isRoot: true },   // F
          { stringIdx: 1, fret: 3, interval: '5' },                // C
          { stringIdx: 3, fret: 2, interval: '3' },                // A
        ],
      },
      {
        frets: [-1, 8, -1, 10],
        baseFret: 8,
        label: 'Kök 3. Tel (8. Perde)',
        chordTones: [
          { stringIdx: 1, fret: 8, interval: 'R', isRoot: true },   // F
          { stringIdx: 2, fret: 10, interval: '5' },               // C
          { stringIdx: 3, fret: 10, interval: '3' },               // A
        ],
      },
    ],
    'G': [
      {
        frets: [3, -1, -1, 4],
        baseFret: 3,
        label: 'Kök 4. Tel (3. Perde 10\'lu)',
        chordTones: [
          { stringIdx: 0, fret: 3, interval: 'R', isRoot: true },   // G
          { stringIdx: 1, fret: 5, interval: '5' },                // D
          { stringIdx: 3, fret: 4, interval: '3' },                // B
        ],
      },
    ],
    'A': [
      {
        frets: [5, -1, -1, 6],
        baseFret: 5,
        label: 'Kök 4. Tel (5. Perde 10\'lu)',
        chordTones: [
          { stringIdx: 0, fret: 5, interval: 'R', isRoot: true },   // A
          { stringIdx: 1, fret: 7, interval: '5' },                // E
          { stringIdx: 3, fret: 6, interval: '3' },                // C#
        ],
      },
    ],
    'Bb': [
      {
        frets: [6, -1, -1, 7],
        baseFret: 6,
        label: 'Kök 4. Tel (6. Perde 10\'lu)',
        chordTones: [
          { stringIdx: 0, fret: 6, interval: 'R', isRoot: true },   // Bb
          { stringIdx: 1, fret: 8, interval: '5' },                // F
          { stringIdx: 3, fret: 7, interval: '3' },                // D
        ],
      },
      {
        frets: [-1, 1, -1, 3],
        baseFret: 1,
        label: 'Kök 3. Tel (1. Perde)',
        chordTones: [
          { stringIdx: 1, fret: 1, interval: 'R', isRoot: true },   // Bb
          { stringIdx: 2, fret: 3, interval: '5' },                // F
          { stringIdx: 3, fret: 3, interval: '3' },                // D
        ],
      },
    ],
  
    // === 7'Lİ VE JAZZ BAS AKORLARI ===
    'Bb13': [
      {
        frets: [6, -1, 6, 7],
        baseFret: 6,
        label: 'Kök 4. Tel (Caz 7/13 Bas Akoru)',
        chordTones: [
          { stringIdx: 0, fret: 6, interval: 'R', isRoot: true },   // Bb
          { stringIdx: 2, fret: 6, interval: 'b7' },               // Ab
          { stringIdx: 3, fret: 7, interval: '3' },                // D
        ],
      },
    ],
    'Dm7': [
      {
        frets: [-1, 5, 3, 5],
        baseFret: 3,
        label: 'Kök 3. Tel (5. Perde Caz Bas Akoru)',
        chordTones: [
          { stringIdx: 1, fret: 5, interval: 'R', isRoot: true },   // D
          { stringIdx: 2, fret: 3, interval: 'b7' },               // C
          { stringIdx: 3, fret: 5, interval: 'b3' },               // F
        ],
      },
    ],
    'E7(b9)': [
      {
        frets: [0, -1, 0, 1],
        baseFret: 1,
        label: 'Flamenko Açık Pozisyon Bas Akoru',
        chordTones: [
          { stringIdx: 0, fret: 0, interval: 'R', isRoot: true },   // E
          { stringIdx: 2, fret: 0, interval: 'b7' },               // D
          { stringIdx: 3, fret: 1, interval: '3' },                // G#
        ],
      },
    ],
    'Fmaj7(#11)': [
      {
        frets: [1, -1, 2, 2],
        baseFret: 1,
        label: 'Flamenko Phrygian Bas Akoru',
        chordTones: [
          { stringIdx: 0, fret: 1, interval: 'R', isRoot: true },   // F
          { stringIdx: 2, fret: 2, interval: '7' },                // E
          { stringIdx: 3, fret: 2, interval: '3' },                // A
        ],
      },
    ],
  };
  
  export function getBassVoicings(chordName: string): BassVoicing[] {
    const cleanName = chordName.replace(/[\[\]]/g, '').trim();
    if (BASS_CHORDS_DB[cleanName]) {
      return BASS_CHORDS_DB[cleanName];
    }
  
    const enharmonicMap: Record<string, string> = {
      'A#': 'Bb', 'A#m': 'Bbm', 'A#7': 'Bb7',
      'C#': 'Db', 'C#m': 'Dbm', 'D#': 'Eb', 'D#m': 'Ebm',
      'F#': 'Gb', 'G#': 'Ab', 'G#m': 'Abm',
    };
  
    const alias = enharmonicMap[cleanName];
    if (alias && BASS_CHORDS_DB[alias]) {
      return BASS_CHORDS_DB[alias];
    }
  
    const rootMatch = cleanName.match(/^([A-G][b#]?)(maj7|m7|7|m)?/);
    if (rootMatch && rootMatch[0] !== cleanName && BASS_CHORDS_DB[rootMatch[0]]) {
      return BASS_CHORDS_DB[rootMatch[0]];
    }
  
    return [];
  }