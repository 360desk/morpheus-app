import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  ScrollView,
  Modal,
  SafeAreaView,
  StatusBar,
  ActivityIndicator,
} from 'react-native';
import { supabase } from './src/lib/supabase';
import { ALL_TONES, transposeContent, transposeChord } from './src/utils/chordEngine';
import { Plus, Minus, Music2, ChevronDown } from 'lucide-react-native';

interface Song {
  id: string;
  title: string;
  artist: string;
  original_key: string;
  content: string;
  bpm?: number;
}

export default function App() {
  const [song, setSong] = useState<Song | null>(null);
  const [loading, setLoading] = useState(true);
  
  const [transposeValue, setTransposeValue] = useState(0);
  const [selectedTone, setSelectedTone] = useState<string>('');
  const [isToneModalOpen, setIsToneModalOpen] = useState(false);

  useEffect(() => {
    fetchSong();
  }, []);

  const fetchSong = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('morfeus_songs')
        .select('*')
        .limit(1)
        .single();

      if (error) throw error;

      if (data) {
        setSong(data);
        setSelectedTone(data.original_key);
      }
    } catch (err) {
      console.error('Şarkı yüklenirken hata:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleTranspose = (step: number) => {
    setTransposeValue((prev) => prev + step);
    setSelectedTone((prev) => transposeChord(prev, step));
  };

  const handleSelectTone = (tone: string) => {
    setSelectedTone(tone);
    setIsToneModalOpen(false);
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#6366F1" />
        <Text style={styles.loadingText}>Şarkı Yükleniyor...</Text>
      </View>
    );
  }

  if (!song) {
    return (
      <View style={styles.center}>
        <Text style={styles.errorText}>Şarkı bulunamadı. Supabase tablosunu kontrol edin.</Text>
      </View>
    );
  }

  const currentContent = transposeContent(song.content, transposeValue);

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" />

      {/* Ekranı Merkezleyen Ana Konteyner */}
      <View style={styles.mainWrapper}>
        <View style={styles.contentCard}>

          {/* Üst Bar: Başlık, Sanatçı & İkon */}
          <View style={styles.header}>
            <View>
              <Text style={styles.title}>{song.title}</Text>
              <Text style={styles.artist}>{song.artist}</Text>
            </View>
            <Music2 color="#818CF8" size={26} />
          </View>

          {/* Kontrol Paneli: TON & Transpoze Butonları */}
          <View style={styles.controlBar}>
            <TouchableOpacity
              style={styles.toneButton}
              onPress={() => setIsToneModalOpen(true)}
              activeOpacity={0.7}
            >
              <Text style={styles.toneLabel}>TON:</Text>
              <Text style={styles.toneValue}>{selectedTone || song.original_key}</Text>
              <ChevronDown color="#94A3B8" size={16} />
            </TouchableOpacity>

            <View style={styles.transposeControls}>
              <TouchableOpacity
                style={styles.circleBtn}
                onPress={() => handleTranspose(-1)}
              >
                <Minus color="#FFFFFF" size={16} />
              </TouchableOpacity>

              <View style={styles.transposeBadge}>
                <Text style={styles.transposeText}>
                  {transposeValue > 0 ? `+${transposeValue}` : transposeValue}
                </Text>
              </View>

              <TouchableOpacity
                style={styles.circleBtn}
                onPress={() => handleTranspose(1)}
              >
                <Plus color="#FFFFFF" size={16} />
              </TouchableOpacity>
            </View>
          </View>

          {/* Şarkı Sözleri ve Akor Alanı */}
          <ScrollView 
            style={styles.scrollArea} 
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
          >
            <Text style={styles.contentText}>{currentContent}</Text>
          </ScrollView>

        </View>
      </View>

      {/* Alttan Açılan Ton Seçici Modal */}
      <Modal
        visible={isToneModalOpen}
        animationType="fade"
        transparent={true}
        onRequestClose={() => setIsToneModalOpen(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Ton Seçin</Text>
              <TouchableOpacity onPress={() => setIsToneModalOpen(false)}>
                <Text style={styles.closeText}>Kapat</Text>
              </TouchableOpacity>
            </View>

            <ScrollView contentContainerStyle={styles.tonesGrid}>
              {ALL_TONES.map((tone) => (
                <TouchableOpacity
                  key={tone}
                  style={[
                    styles.toneGridItem,
                    selectedTone === tone && styles.selectedToneGridItem,
                  ]}
                  onPress={() => handleSelectTone(tone)}
                >
                  <Text
                    style={[
                      styles.toneGridText,
                      selectedTone === tone && styles.selectedToneGridText,
                    ]}
                  >
                    {tone}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#090D16',
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#090D16',
  },
  loadingText: {
    color: '#94A3B8',
    marginTop: 12,
  },
  errorText: {
    color: '#EF4444',
    textAlign: 'center',
    paddingHorizontal: 20,
  },
  mainWrapper: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
  },
  contentCard: {
    flex: 1,
    width: '100%',
    maxWidth: 720, // Tablet ve masaüstünde ortalanmış ideal sahne genişliği
    backgroundColor: '#0F172A',
    borderLeftWidth: 1,
    borderRightWidth: 1,
    borderColor: '#1E293B',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingTop: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#1E293B',
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#F8FAFC',
  },
  artist: {
    fontSize: 14,
    color: '#94A3B8',
    marginTop: 4,
  },
  controlBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 14,
    backgroundColor: '#161F30',
    borderBottomWidth: 1,
    borderBottomColor: '#1E293B',
  },
  toneButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1E293B',
    paddingVertical: 6,
    paddingHorizontal: 14,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#334155',
    gap: 8,
  },
  toneLabel: {
    fontSize: 12,
    color: '#94A3B8',
    fontWeight: '600',
  },
  toneValue: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#38BDF8',
  },
  transposeControls: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  circleBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#4F46E5',
    justifyContent: 'center',
    alignItems: 'center',
  },
  transposeBadge: {
    minWidth: 28,
    alignItems: 'center',
  },
  transposeText: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#F8FAFC',
  },
  scrollArea: {
    flex: 1,
  },
  scrollContent: {
    padding: 24,
    paddingBottom: 60,
  },
  contentText: {
    fontFamily: 'monospace',
    fontSize: 16,
    lineHeight: 30,
    color: '#E2E8F0',
    letterSpacing: 0.5,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    backgroundColor: '#1E293B',
    borderRadius: 16,
    padding: 20,
    width: '100%',
    maxWidth: 480,
    maxHeight: '70%',
    borderWidth: 1,
    borderColor: '#334155',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 17,
    fontWeight: 'bold',
    color: '#F8FAFC',
  },
  closeText: {
    color: '#94A3B8',
    fontSize: 14,
  },
  tonesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    justifyContent: 'center',
  },
  toneGridItem: {
    width: '21%',
    paddingVertical: 12,
    backgroundColor: '#0F172A',
    borderRadius: 8,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#334155',
  },
  selectedToneGridItem: {
    backgroundColor: '#4F46E5',
    borderColor: '#6366F1',
  },
  toneGridText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#F8FAFC',
  },
  selectedToneGridText: {
    color: '#FFFFFF',
  },
});