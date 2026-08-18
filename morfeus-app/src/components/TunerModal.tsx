import React, { useState, useEffect, useRef } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, Modal } from 'react-native';
import { autoCorrelate, frequencyToNoteData, TunerResult } from '../utils/audioTuner';
import { X, Mic, MicOff } from 'lucide-react-native';

interface TunerModalProps {
  visible: boolean;
  onClose: () => void;
}

type TunerInstrument = 'guitar' | 'bass' | 'chromatic';

const INSTRUMENT_STRINGS = {
  guitar: [
    { name: 'E2', note: 'E', octave: 2, freq: 82.4 },
    { name: 'A2', note: 'A', octave: 2, freq: 110.0 },
    { name: 'D3', note: 'D', octave: 3, freq: 146.8 },
    { name: 'G3', note: 'G', octave: 3, freq: 196.0 },
    { name: 'B3', note: 'B', octave: 3, freq: 246.9 },
    { name: 'E4', note: 'E', octave: 4, freq: 329.6 },
  ],
  bass: [
    { name: 'E1', note: 'E', octave: 1, freq: 41.2 },
    { name: 'A1', note: 'A', octave: 1, freq: 55.0 },
    { name: 'D2', note: 'D', octave: 2, freq: 73.4 },
    { name: 'G2', note: 'G', octave: 2, freq: 98.0 },
  ],
  chromatic: [],
};

export default function TunerModal({ visible, onClose }: TunerModalProps) {
  const [instrument, setInstrument] = useState<TunerInstrument>('guitar');
  const [isListening, setIsListening] = useState(false);
  const [tunerData, setTunerData] = useState<TunerResult | null>(null);
  const [statusMessage, setStatusMessage] = useState('Teli tınlatın...');

  const audioCtxRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const reqAnimRef = useRef<number | null>(null);

  const startListening = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;

      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      const audioCtx = new AudioContextClass();
      audioCtxRef.current = audioCtx;

      const analyser = audioCtx.createAnalyser();
      analyser.fftSize = 4096; // Bas sesleri daha net yakalayabilmek için çözünürlüğü artırdık
      analyserRef.current = analyser;

      const source = audioCtx.createMediaStreamSource(stream);
      source.connect(analyser);

      setIsListening(true);
      setStatusMessage('Dinleniyor...');
      updatePitch();
    } catch (err) {
      console.error('Mikrofon erişim hatası:', err);
      setStatusMessage('Mikrofona erişilemedi.');
    }
  };

  const stopListening = () => {
    if (reqAnimRef.current) cancelAnimationFrame(reqAnimRef.current);
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
    }
    if (audioCtxRef.current) {
      audioCtxRef.current.close();
    }
    setIsListening(false);
    setTunerData(null);
    setStatusMessage('Durduruldu');
  };

  const updatePitch = () => {
    if (!analyserRef.current || !audioCtxRef.current) return;

    const buffer = new Float32Array(analyserRef.current.fftSize);
    analyserRef.current.getFloatTimeDomainData(buffer);
    const freq = autoCorrelate(buffer, audioCtxRef.current.sampleRate);

    // Bas gitar (30Hz) ile tiz elektro gitar (1200Hz) aralığını kapsar
    if (freq !== -1 && freq >= 30 && freq <= 1200) {
      const data = frequencyToNoteData(freq);
      setTunerData(data);
    }

    reqAnimRef.current = requestAnimationFrame(updatePitch);
  };

  useEffect(() => {
    if (visible) {
      startListening();
    } else {
      stopListening();
    }
    return () => stopListening();
  }, [visible]);

  const cents = tunerData ? Math.max(-50, Math.min(50, tunerData.cents)) : 0;
  const inTune = tunerData?.inTune;
  const targetStrings = INSTRUMENT_STRINGS[instrument];

  return (
    <Modal visible={visible} animationType="slide" transparent={true}>
      <View style={styles.overlay}>
        <View style={styles.container}>
          <View style={styles.header}>
            <Text style={styles.title}>Dijital Akort Aleti</Text>
            <TouchableOpacity
              onPress={() => {
                stopListening();
                onClose();
              }}
            >
              <X color="#94A3B8" size={22} />
            </TouchableOpacity>
          </View>

          {/* Enstrüman Seçim Sekmeleri */}
          <View style={styles.instrumentTabGroup}>
            <TouchableOpacity
              style={[styles.instrumentTab, instrument === 'guitar' && styles.instrumentTabActive]}
              onPress={() => setInstrument('guitar')}
            >
              <Text style={[styles.instrumentTabText, instrument === 'guitar' && styles.instrumentTabTextActive]}>
                🎸 Gitar (6 Tel)
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.instrumentTab, instrument === 'bass' && styles.instrumentTabActive]}
              onPress={() => setInstrument('bass')}
            >
              <Text style={[styles.instrumentTabText, instrument === 'bass' && styles.instrumentTabTextActive]}>
                🎻 Bas (4 Tel)
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.instrumentTab, instrument === 'chromatic' && styles.instrumentTabActive]}
              onPress={() => setInstrument('chromatic')}
            >
              <Text style={[styles.instrumentTabText, instrument === 'chromatic' && styles.instrumentTabTextActive]}>
                🎵 Kromatik
              </Text>
            </TouchableOpacity>
          </View>

          {/* Hedef Tel Rozetleri (Gitar ve Bas Modu İçin) */}
          {targetStrings.length > 0 && (
            <View style={styles.stringsRow}>
              {targetStrings.map((str) => {
                const isCurrent =
                  tunerData?.note === str.note &&
                  (tunerData?.octave === str.octave || Math.abs((tunerData?.octave || 0) - str.octave) <= 1);

                return (
                  <View
                    key={str.name}
                    style={[styles.stringBadge, isCurrent && styles.stringBadgeActive]}
                  >
                    <Text
                      style={[
                        styles.stringBadgeText,
                        isCurrent && styles.stringBadgeTextActive,
                      ]}
                    >
                      {str.name}
                    </Text>
                  </View>
                );
              })}
            </View>
          )}

          {/* Kadran ve İbre Göstergesi */}
          <View style={styles.dialContainer}>
            <View style={styles.meterScale}>
              <Text style={styles.meterText}>-50 (Pes / Flat)</Text>
              <Text style={[styles.meterText, { color: '#10B981' }]}>TAM (In Tune)</Text>
              <Text style={styles.meterText}>+50 (Tiz / Sharp)</Text>
            </View>

            <View style={styles.meterBarBackground}>
              <View style={styles.centerTargetLine} />
              <View
                style={[
                  styles.meterNeedle,
                  {
                    left: `${((cents + 50) / 100) * 100}%`,
                    backgroundColor: inTune ? '#10B981' : '#F59E0B',
                  },
                ]}
              />
            </View>

            {/* Büyük Nota Dairesi */}
            <View
              style={[
                styles.noteCircle,
                inTune && styles.noteCircleInTune,
              ]}
            >
              <Text style={[styles.noteText, inTune && styles.noteTextInTune]}>
                {tunerData ? tunerData.note : '--'}
              </Text>
              {tunerData?.octave !== undefined && (
                <Text style={styles.octaveText}>{tunerData.octave}</Text>
              )}
            </View>

            {/* Frekans ve Detay */}
            <Text style={[styles.hzText, inTune && { color: '#10B981' }]}>
              {tunerData
                ? `${tunerData.frequency} Hz (${tunerData.cents > 0 ? '+' : ''}${tunerData.cents} Cent)`
                : statusMessage}
            </Text>
          </View>

          {/* Kontrol Butonu */}
          <TouchableOpacity
            style={[styles.listenBtn, isListening && styles.listenBtnActive]}
            onPress={isListening ? stopListening : startListening}
          >
            {isListening ? (
              <>
                <MicOff color="#FFFFFF" size={18} />
                <Text style={styles.listenBtnText}>Mikrofonu Durdur</Text>
              </>
            ) : (
              <>
                <Mic color="#FFFFFF" size={18} />
                <Text style={styles.listenBtnText}>Dinlemeyi Başlat</Text>
              </>
            )}
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.8)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  container: {
    backgroundColor: '#1E293B',
    borderRadius: 16,
    padding: 24,
    width: '100%',
    maxWidth: 460,
    borderWidth: 1,
    borderColor: '#334155',
    alignItems: 'center',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '100%',
    marginBottom: 16,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#F8FAFC',
  },
  instrumentTabGroup: {
    flexDirection: 'row',
    backgroundColor: '#0F172A',
    borderRadius: 10,
    padding: 3,
    width: '100%',
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#334155',
    gap: 4,
  },
  instrumentTab: {
    flex: 1,
    paddingVertical: 8,
    alignItems: 'center',
    borderRadius: 8,
  },
  instrumentTabActive: {
    backgroundColor: '#4F46E5',
  },
  instrumentTabText: {
    color: '#94A3B8',
    fontSize: 12,
    fontWeight: '600',
  },
  instrumentTabTextActive: {
    color: '#FFFFFF',
    fontWeight: 'bold',
  },
  stringsRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 20,
    flexWrap: 'wrap',
    justifyContent: 'center',
  },
  stringBadge: {
    paddingVertical: 6,
    paddingHorizontal: 10,
    backgroundColor: '#0F172A',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#334155',
  },
  stringBadgeActive: {
    backgroundColor: '#312E81',
    borderColor: '#6366F1',
  },
  stringBadgeText: {
    color: '#64748B',
    fontWeight: 'bold',
    fontSize: 12,
  },
  stringBadgeTextActive: {
    color: '#38BDF8',
  },
  dialContainer: {
    alignItems: 'center',
    width: '100%',
    marginBottom: 20,
  },
  meterScale: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    paddingHorizontal: 4,
    marginBottom: 6,
  },
  meterText: {
    fontSize: 11,
    color: '#64748B',
    fontWeight: '600',
  },
  meterBarBackground: {
    width: '100%',
    height: 12,
    backgroundColor: '#0F172A',
    borderRadius: 6,
    position: 'relative',
    overflow: 'visible',
    borderWidth: 1,
    borderColor: '#334155',
    marginBottom: 20,
  },
  centerTargetLine: {
    position: 'absolute',
    left: '50%',
    top: -4,
    bottom: -4,
    width: 2,
    backgroundColor: '#10B981',
  },
  meterNeedle: {
    position: 'absolute',
    top: -5,
    width: 8,
    height: 20,
    borderRadius: 4,
    marginLeft: -4,
  },
  noteCircle: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: '#0F172A',
    borderWidth: 3,
    borderColor: '#334155',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
    position: 'relative',
  },
  noteCircleInTune: {
    borderColor: '#10B981',
    backgroundColor: '#064E3B22',
  },
  noteText: {
    fontSize: 40,
    fontWeight: 'bold',
    color: '#F8FAFC',
  },
  noteTextInTune: {
    color: '#10B981',
  },
  octaveText: {
    position: 'absolute',
    right: 20,
    bottom: 20,
    fontSize: 13,
    color: '#94A3B8',
    fontWeight: 'bold',
  },
  hzText: {
    fontSize: 13,
    color: '#94A3B8',
    fontWeight: '600',
  },
  listenBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#4F46E5',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 10,
    gap: 8,
  },
  listenBtnActive: {
    backgroundColor: '#EF4444',
  },
  listenBtnText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
    fontSize: 13,
  },
});