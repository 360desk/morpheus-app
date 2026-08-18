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
  TextInput,
} from 'react-native';
import { supabase } from './src/lib/supabase';
import { ALL_TONES, transposeContent, transposeChord, isChordLine, CHORD_REGEX_STR } from './src/utils/chordEngine';
import {
  Plus,
  Minus,
  Music2,
  ChevronDown,
  Search,
  ArrowLeft,
  PlusCircle,
  X,
} from 'lucide-react-native';

interface Song {
  id: string;
  title: string;
  artist: string;
  original_key: string;
  content: string;
  bpm?: number;
}

export default function App() {
  const [songs, setSongs] = useState<Song[]>([]);
  const [selectedSong, setSelectedSong] = useState<Song | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);

  const [transposeValue, setTransposeValue] = useState(0);
  const [selectedTone, setSelectedTone] = useState<string>('');
  const [isToneModalOpen, setIsToneModalOpen] = useState(false);
  const [fontSize, setFontSize] = useState(16);

  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newArtist, setNewArtist] = useState('');
  const [newOriginalKey, setNewOriginalKey] = useState('Am');
  const [newContent, setNewContent] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    fetchSongs();
  }, []);

  const fetchSongs = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('morfeus_songs')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      if (data) setSongs(data);
    } catch (err) {
      console.error('Şarkılar yüklenirken hata:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectSong = (songItem: Song) => {
    setSelectedSong(songItem);
    setSelectedTone(songItem.original_key);
    setTransposeValue(0);
  };

  const handleTranspose = (step: number) => {
    setTransposeValue((prev) => prev + step);
    setSelectedTone((prev) => transposeChord(prev, step));
  };

  const handleSaveSong = async () => {
    if (!newTitle.trim() || !newArtist.trim() || !newContent.trim()) {
      alert('Lütfen şarkı adı, sanatçı ve söz/akor alanlarını doldurun.');
      return;
    }

    try {
      setIsSaving(true);
      const { data, error } = await supabase
        .from('morfeus_songs')
        .insert([
          {
            title: newTitle.trim(),
            artist: newArtist.trim(),
            original_key: newOriginalKey,
            content: newContent,
          },
        ])
        .select();

      if (error) throw error;

      if (data && data.length > 0) {
        setSongs([data[0], ...songs]);
        handleSelectSong(data[0]);
        setIsAddModalOpen(false);
        setNewTitle('');
        setNewArtist('');
        setNewContent('');
      }
    } catch (err) {
      console.error('Kayıt hatası:', err);
      alert('Şarkı kaydedilirken bir hata oluştu.');
    } finally {
      setIsSaving(false);
    }
  };

  // Hem düz akor satırlarını hem de [Am] formatını otomatik tanıyan akıllı render
  const renderFormattedContent = (content: string) => {
    const lines = content.split('\n');
    return lines.map((line, lineIdx) => {
      // 1. Durum: Satır komple akor satırıysa (Düz yapıştırılan şarkılar)
      if (isChordLine(line)) {
        return (
          <Text key={lineIdx} style={[styles.chordOnlyLine, { fontSize, lineHeight: fontSize * 1.6 }]}>
            {line}
          </Text>
        );
      }

      // 2. Durum: Satır içinde [Am] şeklinde gömülü akorlar varsa
      const parts = line.split(new RegExp(`(\\[${CHORD_REGEX_STR}\\])`, 'g'));
      return (
        <Text key={lineIdx} style={[styles.contentLine, { fontSize, lineHeight: fontSize * 1.8 }]}>
          {parts.map((part, partIdx) => {
            const isBracketChord = part.startsWith('[') && part.endsWith(']');
            if (isBracketChord) {
              return (
                <Text key={partIdx} style={styles.chordText}>
                  {part.slice(1, -1)}
                </Text>
              );
            }
            return (
              <Text key={partIdx} style={styles.lyricsText}>
                {part}
              </Text>
            );
          })}
        </Text>
      );
    });
  };

  const filteredSongs = songs.filter(
    (s) =>
      s.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.artist.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" />

      <View style={styles.mainWrapper}>
        <View style={styles.contentCard}>

          {selectedSong ? (
            <>
              <View style={styles.header}>
                <TouchableOpacity
                  style={styles.backBtn}
                  onPress={() => setSelectedSong(null)}
                >
                  <ArrowLeft color="#F8FAFC" size={22} />
                </TouchableOpacity>
                <View style={{ flex: 1, marginHorizontal: 12 }}>
                  <Text style={styles.title} numberOfLines={1}>
                    {selectedSong.title}
                  </Text>
                  <Text style={styles.artist}>{selectedSong.artist}</Text>
                </View>
                <Music2 color="#818CF8" size={24} />
              </View>

              <View style={styles.controlBar}>
                <TouchableOpacity
                  style={styles.toneButton}
                  onPress={() => setIsToneModalOpen(true)}
                  activeOpacity={0.7}
                >
                  <Text style={styles.toneLabel}>TON:</Text>
                  <Text style={styles.toneValue}>
                    {selectedTone || selectedSong.original_key}
                  </Text>
                  <ChevronDown color="#94A3B8" size={14} />
                </TouchableOpacity>

                <View style={styles.fontSizeControls}>
                  <TouchableOpacity
                    style={styles.smallIconBtn}
                    onPress={() => setFontSize((prev) => Math.max(12, prev - 2))}
                  >
                    <Text style={styles.fontBtnText}>A-</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.smallIconBtn}
                    onPress={() => setFontSize((prev) => Math.min(28, prev + 2))}
                  >
                    <Text style={styles.fontBtnText}>A+</Text>
                  </TouchableOpacity>
                </View>

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

              <ScrollView
                style={styles.scrollArea}
                contentContainerStyle={styles.scrollContent}
                showsVerticalScrollIndicator={false}
              >
                {renderFormattedContent(transposeContent(selectedSong.content, transposeValue))}
              </ScrollView>
            </>
          ) : (
            <>
              <View style={styles.listHeader}>
                <View>
                  <Text style={styles.mainTitle}>Morfeus Repertuvar</Text>
                  <Text style={styles.subTitle}>{songs.length} Şarkı Kayıtlı</Text>
                </View>
                <TouchableOpacity
                  style={styles.addBtn}
                  onPress={() => setIsAddModalOpen(true)}
                >
                  <PlusCircle color="#FFFFFF" size={20} />
                  <Text style={styles.addBtnText}>Şarkı Ekle</Text>
                </TouchableOpacity>
              </View>

              <View style={styles.searchBar}>
                <Search color="#64748B" size={18} />
                <TextInput
                  style={styles.searchInput}
                  placeholder="Şarkı veya sanatçı ara..."
                  placeholderTextColor="#64748B"
                  value={searchQuery}
                  onChangeText={setSearchQuery}
                />
              </View>

              {loading ? (
                <View style={styles.center}>
                  <ActivityIndicator size="large" color="#6366F1" />
                </View>
              ) : (
                <ScrollView style={styles.listArea}>
                  {filteredSongs.map((item) => (
                    <TouchableOpacity
                      key={item.id}
                      style={styles.songListItem}
                      onPress={() => handleSelectSong(item)}
                    >
                      <View style={{ flex: 1 }}>
                        <Text style={styles.songListTitle}>{item.title}</Text>
                        <Text style={styles.songListArtist}>{item.artist}</Text>
                      </View>
                      <View style={styles.keyBadge}>
                        <Text style={styles.keyBadgeText}>{item.original_key}</Text>
                      </View>
                    </TouchableOpacity>
                  ))}
                  {filteredSongs.length === 0 && (
                    <Text style={styles.emptyText}>Aranan şarkı bulunamadı.</Text>
                  )}
                </ScrollView>
              )}
            </>
          )}

        </View>
      </View>

      <Modal visible={isAddModalOpen} animationType="slide" transparent={true}>
        <View style={styles.modalOverlay}>
          <View style={styles.addModalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Yeni Şarkı Ekle</Text>
              <TouchableOpacity onPress={() => setIsAddModalOpen(false)}>
                <X color="#94A3B8" size={22} />
              </TouchableOpacity>
            </View>

            <TextInput
              style={styles.formInput}
              placeholder="Şarkı Adı"
              placeholderTextColor="#64748B"
              value={newTitle}
              onChangeText={setNewTitle}
            />

            <TextInput
              style={styles.formInput}
              placeholder="Sanatçı"
              placeholderTextColor="#64748B"
              value={newArtist}
              onChangeText={setNewArtist}
            />

            <View style={styles.formRow}>
              <Text style={styles.formLabel}>Orijinal Ton:</Text>
              <TextInput
                style={[styles.formInput, { width: 80, marginBottom: 0 }]}
                value={newOriginalKey}
                onChangeText={setNewOriginalKey}
                placeholder="Am"
                placeholderTextColor="#64748B"
              />
            </View>

            <TextInput
              style={[styles.formInput, styles.textArea]}
              placeholder="Akorlu şarkı sözlerini kopyalayıp buraya doğrudan yapıştırın..."
              placeholderTextColor="#64748B"
              value={newContent}
              onChangeText={setNewContent}
              multiline
            />

            <TouchableOpacity
              style={[styles.saveBtn, isSaving && { opacity: 0.7 }]}
              onPress={handleSaveSong}
              disabled={isSaving}
            >
              <Text style={styles.saveBtnText}>
                {isSaving ? 'Kaydediliyor...' : 'Repertuvara Kaydet'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      <Modal visible={isToneModalOpen} animationType="fade" transparent={true}>
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
                  onPress={() => {
                    setSelectedTone(tone);
                    setIsToneModalOpen(false);
                  }}
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
    padding: 20,
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
    maxWidth: 720,
    backgroundColor: '#0F172A',
    borderLeftWidth: 1,
    borderRightWidth: 1,
    borderColor: '#1E293B',
  },
  listHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingTop: 24,
    paddingBottom: 16,
  },
  mainTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#F8FAFC',
  },
  subTitle: {
    fontSize: 13,
    color: '#94A3B8',
    marginTop: 2,
  },
  addBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#4F46E5',
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 8,
    gap: 6,
  },
  addBtnText: {
    color: '#FFFFFF',
    fontWeight: '600',
    fontSize: 13,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1E293B',
    marginHorizontal: 24,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 10,
    gap: 10,
    marginBottom: 16,
  },
  searchInput: {
    flex: 1,
    color: '#F8FAFC',
    fontSize: 14,
    outlineStyle: 'none',
  } as any,
  listArea: {
    flex: 1,
    paddingHorizontal: 24,
  },
  songListItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#161F30',
    padding: 16,
    borderRadius: 10,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#1E293B',
  },
  songListTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#F8FAFC',
  },
  songListArtist: {
    fontSize: 13,
    color: '#94A3B8',
    marginTop: 3,
  },
  keyBadge: {
    backgroundColor: '#334155',
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 6,
  },
  keyBadgeText: {
    color: '#38BDF8',
    fontWeight: 'bold',
    fontSize: 13,
  },
  emptyText: {
    color: '#64748B',
    textAlign: 'center',
    marginTop: 40,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 18,
    paddingBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#1E293B',
  },
  backBtn: {
    padding: 4,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#F8FAFC',
  },
  artist: {
    fontSize: 13,
    color: '#94A3B8',
    marginTop: 2,
  },
  controlBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 12,
    backgroundColor: '#161F30',
    borderBottomWidth: 1,
    borderBottomColor: '#1E293B',
  },
  toneButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1E293B',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#334155',
    gap: 6,
  },
  toneLabel: {
    fontSize: 12,
    color: '#94A3B8',
    fontWeight: '600',
  },
  toneValue: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#38BDF8',
  },
  fontSizeControls: {
    flexDirection: 'row',
    gap: 6,
  },
  smallIconBtn: {
    backgroundColor: '#1E293B',
    paddingVertical: 5,
    paddingHorizontal: 10,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#334155',
  },
  fontBtnText: {
    color: '#94A3B8',
    fontWeight: 'bold',
    fontSize: 13,
  },
  transposeControls: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
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
    minWidth: 26,
    alignItems: 'center',
  },
  transposeText: {
    fontSize: 14,
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
  contentLine: {
    fontFamily: 'monospace',
    letterSpacing: 0.5,
  },
  chordOnlyLine: {
    fontFamily: 'monospace',
    letterSpacing: 0.5,
    color: '#F59E0B',
    fontWeight: 'bold',
  },
  chordText: {
    color: '#F59E0B',
    fontWeight: 'bold',
  },
  lyricsText: {
    color: '#E2E8F0',
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
  addModalContent: {
    backgroundColor: '#1E293B',
    borderRadius: 16,
    padding: 20,
    width: '100%',
    maxWidth: 540,
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
  formInput: {
    backgroundColor: '#0F172A',
    borderWidth: 1,
    borderColor: '#334155',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    color: '#F8FAFC',
    fontSize: 14,
    marginBottom: 12,
    outlineStyle: 'none',
  } as any,
  formRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 12,
  },
  formLabel: {
    color: '#94A3B8',
    fontSize: 14,
  },
  textArea: {
    height: 140,
    textAlignVertical: 'top',
    fontFamily: 'monospace',
  },
  saveBtn: {
    backgroundColor: '#4F46E5',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 6,
  },
  saveBtnText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
    fontSize: 15,
  },
  tonesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
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
    fontSize: 13,
    fontWeight: '600',
    color: '#F8FAFC',
  },
  selectedToneGridText: {
    color: '#FFFFFF',
  },
});