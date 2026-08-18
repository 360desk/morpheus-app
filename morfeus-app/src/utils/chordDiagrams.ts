export interface ChordVoicing {
    frets: number[]; // [6th, 5th, 4th, 3rd, 2nd, 1st]
    baseFret: number;
    label?: string;
  }
  
  export const GUITAR_CHORDS_DB: Record<string, ChordVoicing[]> = {
    // === FLAMENKO & CAZ ÖZEL GERİLİM AKORLARI ===
    'E7(b9)': [
      { frets: [0, 2, 0, 1, 0, 1], baseFret: 1, label: 'Flamenko Açık Pozisyon (Karakteristik)' },
      { frets: [-1, 7, 6, 7, 6, -1], baseFret: 6, label: 'Kök 5. Tel (7. Perde)' },
      { frets: [12, -1, 12, 13, 12, -1], baseFret: 12, label: '12. Perde Gerilim Voicing' },
    ],
    'Fmaj7(#11)': [
      { frets: [1, 3, 3, 2, 0, 0], baseFret: 1, label: 'Flamenko Phrygian Açık Tel (#11)' },
      { frets: [-1, 8, 7, 9, 10, -1], baseFret: 7, label: 'Kök 5. Tel (8. Perde)' },
      { frets: [1, -1, 2, 2, 0, 0], baseFret: 1, label: 'Akustik Lirik Basış' },
    ],
    'Dm7': [
      { frets: [-1, -1, 0, 2, 1, 1], baseFret: 1, label: 'Açık Pozisyon' },
      { frets: [-1, 5, 7, 5, 6, 5], baseFret: 5, label: 'Bareli (5. Perde)' },
      { frets: [10, 12, 10, 10, 10, 10], baseFret: 10, label: 'Bareli (10. Perde)' },
    ],
    'Gm7': [
      { frets: [3, 5, 3, 3, 3, 3], baseFret: 3, label: 'Bareli (3. Perde)' },
      { frets: [3, -1, 3, 3, 3, -1], baseFret: 3, label: 'Caz Drop-2' },
      { frets: [-1, 10, 12, 10, 11, 10], baseFret: 10, label: 'Bareli (10. Perde)' },
    ],
    'C7': [
      { frets: [-1, 3, 2, 3, 1, 0], baseFret: 1, label: 'Açık Pozisyon' },
      { frets: [8, 10, 8, 9, 8, 8], baseFret: 8, label: 'Bareli (8. Perde)' },
      { frets: [-1, 3, 5, 3, 5, 3], baseFret: 3, label: 'Bareli (3. Perde)' },
    ],
    'Bb13': [
      { frets: [6, -1, 6, 7, 8, -1], baseFret: 6, label: 'Kök 6. Tel (Klasik Jazz 13)' },
      { frets: [-1, 1, 3, 1, 3, 3], baseFret: 1, label: 'Kök 5. Tel' },
      { frets: [6, 8, 6, 7, 8, 6], baseFret: 6, label: 'Tam Bareli Jazz' },
    ],
    'C13': [
      { frets: [8, -1, 8, 9, 10, -1], baseFret: 8, label: 'Kök 6. Tel (8. Perde)' },
      { frets: [-1, 3, 5, 3, 5, 5], baseFret: 3, label: 'Kök 5. Tel (3. Perde)' },
      { frets: [8, 10, 8, 9, 10, 8], baseFret: 8, label: 'Tam Bareli' },
    ],
    'Dm9': [
      { frets: [-1, 5, 3, 5, 5, 5], baseFret: 5, label: 'Kök 5. Tel (5. Perde Jazz)' },
      { frets: [10, -1, 10, 10, 10, 12], baseFret: 10, label: 'Kök 6. Tel (10. Perde)' },
      { frets: [-1, -1, 0, 2, 1, 0], baseFret: 1, label: 'Açık Pozisyon' },
    ],
    'Am9': [
      { frets: [5, -1, 5, 5, 5, 7], baseFret: 5, label: 'Kök 6. Tel (5. Perde)' },
      { frets: [-1, 0, 2, 4, 1, 0], baseFret: 1, label: 'Açık Pozisyon (Lirik)' },
      { frets: [-1, 12, 10, 12, 12, 12], baseFret: 10, label: 'Üst Oktav (12. Perde)' },
    ],
    'Gm9': [
      { frets: [3, -1, 3, 3, 3, 5], baseFret: 3, label: 'Kök 6. Tel (3. Perde)' },
      { frets: [-1, 10, 8, 10, 10, 10], baseFret: 8, label: 'Kök 5. Tel (10. Perde)' },
      { frets: [3, 5, 3, 3, 3, 5], baseFret: 3, label: 'Tam Bareli' },
    ],
    'Bb9': [
      { frets: [-1, 1, 0, 1, 1, 1], baseFret: 1, label: 'Kök 5. Tel (1. Perde)' },
      { frets: [6, -1, 6, 7, 6, 8], baseFret: 6, label: 'Kök 6. Tel (6. Perde)' },
      { frets: [-1, 1, 3, 1, 1, 1], baseFret: 1, label: 'Klasik Funk / Jazz 9' },
    ],
    'Bbmaj7': [
      { frets: [-1, 1, 3, 2, 3, 1], baseFret: 1, label: 'Kök 5. Tel (1. Perde)' },
      { frets: [6, -1, 7, 7, 6, -1], baseFret: 6, label: 'Kök 6. Tel Jazz Drop-2' },
      { frets: [6, 8, 7, 7, 6, 6], baseFret: 6, label: 'Tam Bareli (6. Perde)' },
    ],
    'Fmaj7': [
      { frets: [1, -1, 2, 2, 1, 0], baseFret: 1, label: 'Açık / Bossanova (1. Perde)' },
      { frets: [-1, 8, 10, 9, 10, 8], baseFret: 8, label: 'Kök 5. Tel (8. Perde)' },
      { frets: [-1, -1, 3, 2, 1, 0], baseFret: 1, label: 'Sade 4 Telli' },
    ],
    'Cmaj9': [
      { frets: [-1, 3, 2, 4, 3, -1], baseFret: 2, label: 'Kök 5. Tel (Modern Voicing)' },
      { frets: [8, -1, 9, 9, 8, -1], baseFret: 8, label: 'Kök 6. Tel Jazz' },
      { frets: [-1, 3, 0, 0, 0, 0], baseFret: 1, label: 'Akustik Açık Çan Tınısı' },
    ],
    'Dm11': [
      { frets: [-1, 5, 3, 5, 6, 3], baseFret: 3, label: 'Kök 5. Tel (5. Perde)' },
      { frets: [10, -1, 10, 10, 8, -1], baseFret: 8, label: 'Kök 6. Tel Jazz Drop' },
      { frets: [-1, -1, 0, 0, 1, 1], baseFret: 1, label: 'Açık Pozisyon' },
    ],
    'Gm11': [
      { frets: [3, -1, 3, 3, 1, -1], baseFret: 1, label: 'Kök 6. Tel (3. Perde)' },
      { frets: [-1, 10, 8, 10, 11, 8], baseFret: 8, label: 'Kök 5. Tel (10. Perde)' },
      { frets: [3, 5, 3, 3, 6, 3], baseFret: 3, label: 'Tam Perde Basış' },
    ],
    'Am6/9': [
      { frets: [5, -1, 4, 5, 5, 7], baseFret: 4, label: 'Bossa & Jazz Özel (5. Perde)' },
      { frets: [-1, 0, 2, 2, 0, 2], baseFret: 1, label: 'Açık Tel Akustik' },
      { frets: [-1, 12, 10, 11, 12, 12], baseFret: 10, label: '12. Perde Voicing' },
    ],
    'Bb7(#11)': [
      { frets: [6, -1, 6, 7, 5, -1], baseFret: 5, label: 'Lydian Dominant (#11)' },
      { frets: [-1, 1, 2, 1, 3, 0], baseFret: 1, label: 'Açık Tel Gerilimi' },
      { frets: [6, 7, 6, 7, 5, 6], baseFret: 5, label: 'Tam Gerilim Jazz' },
    ],
  
    // === TEMEL MAJOR AKORLAR ===
    'C': [
      { frets: [-1, 3, 2, 0, 1, 0], baseFret: 1, label: 'Açık Pozisyon' },
      { frets: [-1, 3, 5, 5, 5, 3], baseFret: 3, label: 'Bareli (3. Perde)' },
      { frets: [8, 10, 10, 9, 8, 8], baseFret: 8, label: 'Bareli (8. Perde)' },
    ],
    'D': [
      { frets: [-1, -1, 0, 2, 3, 2], baseFret: 1, label: 'Açık Pozisyon' },
      { frets: [-1, 5, 7, 7, 7, 5], baseFret: 5, label: 'Bareli (5. Perde)' },
      { frets: [10, 12, 12, 11, 10, 10], baseFret: 10, label: 'Bareli (10. Perde)' },
    ],
    'E': [
      { frets: [0, 2, 2, 1, 0, 0], baseFret: 1, label: 'Açık Pozisyon' },
      { frets: [-1, 7, 9, 9, 9, 7], baseFret: 7, label: 'Bareli (7. Perde)' },
      { frets: [12, 14, 14, 13, 12, 12], baseFret: 12, label: '12. Perde Oktav' },
    ],
    'F': [
      { frets: [1, 3, 3, 2, 1, 1], baseFret: 1, label: 'Bareli (1. Perde)' },
      { frets: [-1, 8, 10, 10, 10, 8], baseFret: 8, label: 'Bareli (8. Perde)' },
      { frets: [-1, -1, 3, 2, 1, 1], baseFret: 1, label: 'Yarım Bareli (Küçük F)' },
    ],
    'G': [
      { frets: [3, 2, 0, 0, 0, 3], baseFret: 1, label: 'Açık Pozisyon' },
      { frets: [3, 5, 5, 4, 3, 3], baseFret: 3, label: 'Bareli (3. Perde)' },
      { frets: [-1, 10, 12, 12, 12, 10], baseFret: 10, label: 'Bareli (10. Perde)' },
    ],
    'A': [
      { frets: [-1, 0, 2, 2, 2, 0], baseFret: 1, label: 'Açık Pozisyon' },
      { frets: [5, 7, 7, 6, 5, 5], baseFret: 5, label: 'Bareli (5. Perde)' },
      { frets: [-1, 12, 14, 14, 14, 12], baseFret: 12, label: 'Bareli (12. Perde)' },
    ],
    'B': [
      { frets: [-1, 2, 4, 4, 4, 2], baseFret: 2, label: 'Bareli (2. Perde)' },
      { frets: [7, 9, 9, 8, 7, 7], baseFret: 7, label: 'Bareli (7. Perde)' },
      { frets: [-1, -1, 4, 4, 4, 2], baseFret: 2, label: 'Sade 4 Telli' },
    ],
    'Bb': [
      { frets: [-1, 1, 3, 3, 3, 1], baseFret: 1, label: 'Bareli (1. Perde)' },
      { frets: [6, 8, 8, 7, 6, 6], baseFret: 6, label: 'Bareli (6. Perde)' },
      { frets: [-1, -1, 3, 3, 3, 1], baseFret: 1, label: 'Sade 4 Telli' },
    ],
  
    // === TEMEL MINOR AKORLAR ===
    'Am': [
      { frets: [-1, 0, 2, 2, 1, 0], baseFret: 1, label: 'Açık Pozisyon' },
      { frets: [5, 7, 7, 5, 5, 5], baseFret: 5, label: 'Bareli (5. Perde)' },
      { frets: [-1, 12, 14, 14, 13, 12], baseFret: 12, label: 'Bareli (12. Perde)' },
    ],
    'Dm': [
      { frets: [-1, -1, 0, 2, 3, 1], baseFret: 1, label: 'Açık Pozisyon' },
      { frets: [-1, 5, 7, 7, 6, 5], baseFret: 5, label: 'Bareli (5. Perde)' },
      { frets: [10, 12, 12, 10, 10, 10], baseFret: 10, label: 'Bareli (10. Perde)' },
    ],
    'Em': [
      { frets: [0, 2, 2, 0, 0, 0], baseFret: 1, label: 'Açık Pozisyon' },
      { frets: [-1, 7, 9, 9, 8, 7], baseFret: 7, label: 'Bareli (7. Perde)' },
      { frets: [12, 14, 14, 12, 12, 12], baseFret: 12, label: '12. Perde Oktav' },
    ],
    'Gm': [
      { frets: [3, 5, 5, 3, 3, 3], baseFret: 3, label: 'Bareli (3. Perde)' },
      { frets: [-1, 10, 12, 12, 11, 10], baseFret: 10, label: 'Bareli (10. Perde)' },
      { frets: [-1, -1, 5, 3, 3, 3], baseFret: 3, label: 'Sade 4 Telli' },
    ],
    'Bm': [
      { frets: [-1, 2, 4, 4, 3, 2], baseFret: 2, label: 'Bareli (2. Perde)' },
      { frets: [7, 9, 9, 7, 7, 7], baseFret: 7, label: 'Bareli (7. Perde)' },
      { frets: [-1, -1, 4, 4, 3, 2], baseFret: 2, label: 'Sade 4 Telli' },
    ],
    'Bbm': [
      { frets: [-1, 1, 3, 3, 2, 1], baseFret: 1, label: 'Bareli (1. Perde)' },
      { frets: [6, 8, 8, 6, 6, 6], baseFret: 6, label: 'Bareli (6. Perde)' },
      { frets: [-1, -1, 3, 3, 2, 1], baseFret: 1, label: 'Sade 4 Telli' },
    ],
    'F#m': [
      { frets: [2, 4, 4, 2, 2, 2], baseFret: 2, label: 'Bareli (2. Perde)' },
      { frets: [-1, 9, 11, 11, 10, 9], baseFret: 9, label: 'Bareli (9. Perde)' },
      { frets: [-1, -1, 4, 2, 2, 2], baseFret: 2, label: 'Sade 4 Telli' },
    ],
  };
  
  export function getChordVoicings(chordName: string): ChordVoicing[] {
    const cleanName = chordName.replace(/[\[\]]/g, '').trim();
    if (GUITAR_CHORDS_DB[cleanName]) {
      return GUITAR_CHORDS_DB[cleanName];
    }
  
    const enharmonicMap: Record<string, string> = {
      'A#': 'Bb', 'A#m': 'Bbm', 'A#7': 'Bb7', 'A#maj7': 'Bbmaj7',
      'C#': 'Db', 'C#m': 'Dbm', 'D#': 'Eb', 'D#m': 'Ebm',
      'F#': 'Gb', 'G#': 'Ab', 'G#m': 'Abm',
    };
  
    const alias = enharmonicMap[cleanName];
    if (alias && GUITAR_CHORDS_DB[alias]) {
      return GUITAR_CHORDS_DB[alias];
    }
  
    // Kök akor bulma (Örn: E7(b9) -> E7 veya Em)
    const rootMatch = cleanName.match(/^([A-G][b#]?)(maj7|m7|7|m)?/);
    if (rootMatch && rootMatch[0] !== cleanName && GUITAR_CHORDS_DB[rootMatch[0]]) {
      return GUITAR_CHORDS_DB[rootMatch[0]];
    }
  
    return [];
  }