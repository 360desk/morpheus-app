// Temel nota frekans tablosu ve aralıkları
export interface TunerResult {
    note: string;
    octave: number;
    frequency: number;
    targetFrequency: number;
    cents: number; // -50 ile +50 arası sapma
    inTune: boolean;
  }
  
  const NOTE_STRINGS = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
  
  export function frequencyToNoteData(freq: number): TunerResult {
    const noteNum = 12 * (Math.log(freq / 440) / Math.log(2));
    const roundedNoteNum = Math.round(noteNum) + 69;
    const note = NOTE_STRINGS[roundedNoteNum % 12];
    const octave = Math.floor(roundedNoteNum / 12) - 1;
    const targetFrequency = 440 * Math.pow(2, (roundedNoteNum - 69) / 12);
    const cents = Math.floor(1200 * (Math.log(freq / targetFrequency) / Math.log(2)));
  
    return {
      note,
      octave,
      frequency: Math.round(freq * 10) / 10,
      targetFrequency: Math.round(targetFrequency * 10) / 10,
      cents,
      inTune: Math.abs(cents) <= 4,
    };
  }
  
  // Otokorelasyon (Pitch Detection) Algoritması
  export function autoCorrelate(buffer: Float32Array, sampleRate: number): number {
    let size = buffer.length;
    let rms = 0;
  
    for (let i = 0; i < size; i++) {
      const val = buffer[i];
      rms += val * val;
    }
    rms = Math.sqrt(rms / size);
  
    // Ortam dip gürültüsü eşiği
    if (rms < 0.015) {
      return -1;
    }
  
    let r1 = 0;
    let r2 = size - 1;
    const thres = 0.2;
  
    for (let i = 0; i < size / 2; i++) {
      if (Math.abs(buffer[i]) < thres) {
        r1 = i;
        break;
      }
    }
  
    for (let i = 1; i < size / 2; i++) {
      if (Math.abs(buffer[size - i]) < thres) {
        r2 = size - i;
        break;
      }
    }
  
    const trimmedBuffer = buffer.slice(r1, r2);
    size = trimmedBuffer.length;
  
    const c = new Array(size).fill(0);
    for (let i = 0; i < size; i++) {
      for (let j = 0; j < size - i; j++) {
        c[i] = c[i] + trimmedBuffer[j] * trimmedBuffer[j + i];
      }
    }
  
    let d = 0;
    while (c[d] > c[d + 1]) d++;
    let maxval = -1;
    let maxpos = -1;
  
    for (let i = d; i < size; i++) {
      if (c[i] > maxval) {
        maxval = c[i];
        maxpos = i;
      }
    }
  
    let T0 = maxpos;
    const x1 = c[T0 - 1];
    const x2 = c[T0];
    const x3 = c[T0 + 1];
  
    const a = (x1 + x3 - 2 * x2) / 2;
    const b = (x3 - x1) / 2;
    if (a) T0 = T0 - b / (2 * a);
  
    return sampleRate / T0;
  }