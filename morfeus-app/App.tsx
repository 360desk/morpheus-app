import React, { useState, useEffect, useRef } from 'react';
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
  Platform,
} from 'react-native';
import { supabase } from './src/lib/supabase';
import { ALL_TONES, transposeContent, transposeChord, isChordLine, CHORD_REGEX_STR } from './src/utils/chordEngine';
import {
  Plus,
  Minus,
  ChevronDown,
  Search,
  ArrowLeft,
  PlusCircle,
  X,
  Play,
  Pause,
  RotateCcw,
  Edit3,
  Trash2,
  ListMusic,
  ChevronRight,
  ChevronLeft,
  Check,
} from 'lucide-react-native';

interface Song {
  id: string;
  title: string;
  artist: string;
  original_key: string;
  content: string;
  bpm?: number;
}

interface Setlist {
  id: string;
  name: string;
  song_ids: string[];
}

const STAGE_FONT_FAMILY = Platform.select({
  web: 'Arial, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
  default: 'System',
});

export default function App() {
  const [activeTab, setActiveTab] = useState<'songs' | 'setlists'>('songs');
  const [songs, setSongs] = useState<Song[]>([]);
  const [setlists, setSetlists] = useState<Setlist[]>([]);
  const [selectedSong, setSelectedSong] = useState<Song | null>(null);
  const [currentSetlist, setCurrentSetlist] = useState<Setlist | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);

  // Transpoze & Font
  const [transposeValue, setTransposeValue] = useState(0);
  const [selectedTone, setSelectedTone] = useState<string>('');
  const [isToneModalOpen, setIsToneModalOpen] = useState(false);
  const [fontSize, setFontSize] = useState(15);

  // Auto-Scroll
  const [isScrolling, setIsScrolling] = useState(false);
  const [scrollSpeed, setScrollSpeed] = useState(1);
  const scrollRef = useRef<ScrollView>(null);
  const currentScrollY = useRef(0);

  // Metronom
  const [isBeatActive, setIsBeatActive] = useState(false);

  // Şarkı Ekle / Düzenle Modal
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [editingSongId, setEditingSongId] = useState<string | null>(null);
  const [formTitle, setFormTitle] = useState('');
  const [formArtist, setFormArtist] = useState('');
  const [formOriginalKey, setFormOriginalKey] = useState('Am');
  const [formBpm, setFormBpm] = useState('100');
  const [formContent, setFormContent] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  // Setlist Modal State'leri
  const [isSetlistModalOpen, setIsSetlistModalOpen] = useState(false);
  const [newSetlistName, setNewSetlistName] = useState('');
  const [selectedSongIdsForSetlist, setSelectedSongIdsForSetlist] = useState<string[]>([]);
  const [isSavingSetlist, setIsSavingSetlist] = useState(false);

  useEffect(() => {
    fetchInitialData();
  }, []);

  const fetchInitialData = async () => {
    try {
      setLoading(true);
      const [songsRes, setlistsRes] = await Promise.all([
        supabase.from('morfeus_songs').select('*').order('created_at', { ascending: false }),
        supabase.from('morfeus_setlists').select('*').order('created_at', { ascending: false }),
      ]);

      if (songsRes.data) setSongs(songsRes.data);
      if (setlistsRes.data) setSetlists(setlistsRes.data);
    } catch (err) {
      console.error('Veri yükleme hatası:', err);
    } finally {
      setLoading(false);
    }
  };

  // Scroll Motoru
  useEffect(() => {
    let intervalId: any = null;

    if (isScrolling) {
      intervalId = setInterval(() => {
        const step = scrollSpeed === 1 ? 1 : scrollSpeed === 2 ? 2.5 : 5;
        currentScrollY.current += step;

        if (Platform.OS === 'web' && typeof document !== 'undefined') {
          const domEl = document.getElementById('stage-scroll-container');
          if (domEl) domEl.scrollTop = currentScrollY.current;
        } else {
          scrollRef.current?.scrollTo({ y: currentScrollY.current, animated: false });
        }
      }, 25);
    }

    return () => {
      if (intervalId) clearInterval(intervalId);
    };
  }, [isScrolling, scrollSpeed]);

  // Metronom
  useEffect(() => {
    if (!selectedSong?.bpm || selectedSong.bpm <= 0) return;
    const intervalMs = (60 / selectedSong.bpm) * 1000;
    const metronomeInterval = setInterval(() => {
      setIsBeatActive(true);
      setTimeout(() => setIsBeatActive(false), 120);
    }, intervalMs);

    return () => clearInterval(metronomeInterval);
  }, [selectedSong]);

  const handleSelectSong = (songItem: Song, setlistContext: Setlist | null = null) => {
    setSelectedSong(songItem);
    setCurrentSetlist(setlistContext);
    setSelectedTone(songItem.original_key);
    setTransposeValue(0);
    setIsScrolling(false);
    currentScrollY.current = 0;
    if (Platform.OS === 'web' && typeof document !== 'undefined') {
      const domEl = document.getElementById('stage-scroll-container');
      if (domEl) domEl.scrollTop = 0;
    }
  };

  // Setlist Sıradaki / Önceki Şarkı Geçişi
  const handleNavigateSetlist = (direction: 'next' | 'prev') => {
    if (!currentSetlist || !selectedSong) return;
    const currentIndex = currentSetlist.song_ids.indexOf(selectedSong.id);
    if (currentIndex === -1) return;

    const nextIndex = direction === 'next' ? currentIndex + 1 : currentIndex - 1;
    if (nextIndex >= 0 && nextIndex < currentSetlist.song_ids.length) {
      const nextSongId = currentSetlist.song_ids[nextIndex];
      const nextSong = songs.find((s) => s.id === nextSongId);
      if (nextSong) {
        handleSelectSong(nextSong, currentSetlist);
      }
    }
  };

  const handleTranspose = (step: number) => {
    setTransposeValue((prev) => prev + step);
    setSelectedTone((prev) => transposeChord(prev, step));
  };

  const handleOpenAddModal = () => {
    setEditingSongId(null);
    setFormTitle('');
    setFormArtist('');
    setFormOriginalKey('Am');
    setFormBpm('100');
    setFormContent('');
    setIsFormModalOpen(true);
  };

  const handleOpenEditModal = (songItem: Song) => {
    setEditingSongId(songItem.id);
    setFormTitle(songItem.title);
    setFormArtist(songItem.artist);
    setFormOriginalKey(songItem.original_key);
    setFormBpm(songItem.bpm ? songItem.bpm.toString() : '100');
    setFormContent(songItem.content);
    setIsFormModalOpen(true);
  };

  const handleSaveOrUpdateSong = async () => {
    if (!formTitle.trim() || !formArtist.trim() || !formContent.trim()) {
      alert('Lütfen şarkı adı, sanatçı ve söz/akor alanlarını doldurun.');
      return;
    }

    try {
      setIsSaving(true);
      const songPayload = {
        title: formTitle.trim(),
        artist: formArtist.trim(),
        original_key: formOriginalKey,
        bpm: parseInt(formBpm, 10) || 100,
        content: formContent,
      };

      if (editingSongId) {
        const { data, error } = await supabase
          .from('morfeus_songs')
          .update(songPayload)
          .eq('id', editingSongId)
          .select();

        if (error) throw error;
        if (data && data.length > 0) {
          const updatedSong = data[0];
          setSongs(songs.map((s) => (s.id === updatedSong.id ? updatedSong : s)));
          if (selectedSong?.id === updatedSong.id) {
            setSelectedSong(updatedSong);
            setSelectedTone(updatedSong.original_key);
            setTransposeValue(0);
          }
        }
      } else {
        const { data, error } = await supabase
          .from('morfeus_songs')
          .insert([songPayload])
          .select();

        if (error) throw error;
        if (data && data.length > 0) {
          setSongs([data[0], ...songs]);
          handleSelectSong(data[0]);
        }
      }

      setIsFormModalOpen(false);
    } catch (err) {
      console.error('Kayıt hatası:', err);
      alert('İşlem sırasında bir hata oluştu.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteSong = async (songId: string) => {
    const confirmed = window.confirm('Bu şarkıyı repertuvardan tamamen silmek istediğinize emin misiniz?');
    if (!confirmed) return;

    try {
      const { error } = await supabase.from('morfeus_songs').delete().eq('id', songId);
      if (error) throw error;
      setSongs(songs.filter((s) => s.id !== songId));
      if (selectedSong?.id === songId) setSelectedSong(null);
    } catch (err) {
      console.error('Silme hatası:', err);
      alert('Şarkı silinirken bir hata oluştu.');
    }
  };

  // Yeni Setlist Kaydet
  const handleSaveSetlist = async () => {
    if (!newSetlistName.trim() || selectedSongIdsForSetlist.length === 0) {
      alert('Lütfen setlist adı girin ve en az 1 şarkı seçin.');
      return;
    }

    try {
      setIsSavingSetlist(true);
      const { data, error } = await supabase
        .from('morfeus_setlists')
        .insert([
          {
            name: newSetlistName.trim(),
            song_ids: selectedSongIdsForSetlist,
          },
        ])
        .select();

      if (error) throw error;
      if (data && data.length > 0) {
        setSetlists([data[0], ...setlists]);
        setIsSetlistModalOpen(false);
        setNewSetlistName('');
        setSelectedSongIdsForSetlist([]);
      }
    } catch (err) {
      console.error('Setlist kayıt hatası:', err);
      alert('Setlist kaydedilemedi.');
    } finally {
      setIsSavingSetlist(false);
    }
  };

  const handleDeleteSetlist = async (setlistId: string) => {
    const confirmed = window.confirm('Bu konser setlistini silmek istediğinize emin misiniz?');
    if (!confirmed) return;

    try {
      const { error } = await supabase.from('morfeus_setlists').delete().eq('id', setlistId);
      if (error) throw error;
      setSetlists(setlists.filter((s) => s.id !== setlistId));
    } catch (err) {
      console.error('Setlist silme hatası:', err);
      alert('Setlist silinemedi.');
    }
  };

  const renderFormattedContent = (content: string) => {
    const lines = content.split('\n');
    return lines.map((line, lineIdx) => {
      if (isChordLine(line)) {
        return (
          <Text
            key={lineIdx}
            style={[
              styles.chordOnlyLine,
              { fontSize, lineHeight: fontSize * 1.5 },
            ]}
          >
            {line}
          </Text>
        );
      }

      const parts = line.split(new RegExp(`(\\[${CHORD_REGEX_STR}\\])`, 'g'));
      return (
        <Text
          key={lineIdx}
          style={[
            styles.contentLine,
            { fontSize, lineHeight: fontSize * 1.6 },
          ]}
        >
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
              {/* ÜST SAHNE BARI */}
              <View style={styles.header}>
                <TouchableOpacity
                  style={styles.backBtn}
                  onPress={() => {
                    setSelectedSong(null);
                    setCurrentSetlist(null);
                  }}
                >
                  <ArrowLeft color="#F8FAFC" size={22} />
                </TouchableOpacity>
                <View style={{ flex: 1, marginHorizontal: 12 }}>
                  <Text style={styles.title} numberOfLines={1}>
                    {selectedSong.title}
                  </Text>
                  <Text style={styles.artist}>
                    {selectedSong.artist}
                    {currentSetlist ? ` • [${currentSetlist.name}]` : ''}
                  </Text>
                </View>

                <View style={styles.headerActions}>
                  {selectedSong.bpm ? (
                    <View style={styles.bpmContainer}>
                      <View
                        style={[
                          styles.bpmDot,
                          isBeatActive && styles.bpmDotActive,
                        ]}
                      />
                      <Text style={styles.bpmText}>{selectedSong.bpm} BPM</Text>
                    </View>
                  ) : null}

                  <TouchableOpacity
                    style={styles.iconActionBtn}
                    onPress={() => handleOpenEditModal(selectedSong)}
                  >
                    <Edit3 color="#94A3B8" size={18} />
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.iconActionBtn}
                    onPress={() => handleDeleteSong(selectedSong.id)}
                  >
                    <Trash2 color="#EF4444" size={18} />
                  </TouchableOpacity>
                </View>
              </View>

              {/* KONTROL BARI */}
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
                    onPress={() => setFontSize((prev) => Math.max(11, prev - 1))}
                  >
                    <Text style={styles.fontBtnText}>A-</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.smallIconBtn}
                    onPress={() => setFontSize((prev) => Math.min(26, prev + 1))}
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

              {/* ŞARKI METNİ ALANI */}
              <ScrollView
                ref={scrollRef}
                nativeID="stage-scroll-container"
                {...({ id: 'stage-scroll-container' } as any)}
                style={styles.scrollArea}
                contentContainerStyle={styles.scrollContent}
                showsVerticalScrollIndicator={true}
                onScroll={(e) => {
                  if (!isScrolling) {
                    currentScrollY.current = e.nativeEvent.contentOffset.y;
                  }
                }}
                scrollEventThrottle={16}
              >
                <ScrollView horizontal={true} showsHorizontalScrollIndicator={false}>
                  <View style={styles.lyricsWrapper}>
                    {renderFormattedContent(transposeContent(selectedSong.content, transposeValue))}
                  </View>
                </ScrollView>
              </ScrollView>

              {/* SAHNE ALT YÜZER BARI (KAYDIRMA & SETLIST GEÇİŞ) */}
              <View style={styles.floatingActionBar}>
                {/* Varsa Setlist Önceki Şarkı Butonu */}
                {currentSetlist && (
                  <TouchableOpacity
                    style={styles.navSongBtn}
                    onPress={() => handleNavigateSetlist('prev')}
                  >
                    <ChevronLeft color="#FFFFFF" size={20} />
                  </TouchableOpacity>
                )}

                <TouchableOpacity
                  style={[styles.playBtn, isScrolling && styles.playBtnActive]}
                  onPress={() => setIsScrolling(!isScrolling)}
                >
                  {isScrolling ? (
                    <Pause color="#FFFFFF" size={18} />
                  ) : (
                    <Play color="#FFFFFF" size={18} fill="#FFFFFF" />
                  )}
                  <Text style={styles.playBtnText}>
                    {isScrolling ? 'Durdur' : 'Kaydır'}
                  </Text>
                </TouchableOpacity>

                <View style={styles.speedButtonGroup}>
                  {[1, 2, 3].map((spd) => (
                    <TouchableOpacity
                      key={spd}
                      style={[
                        styles.speedBtn,
                        scrollSpeed === spd && styles.speedBtnActive,
                      ]}
                      onPress={() => setScrollSpeed(spd)}
                    >
                      <Text
                        style={[
                          styles.speedBtnText,
                          scrollSpeed === spd && styles.speedBtnTextActive,
                        ]}
                      >
                        {spd}x
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>

                <TouchableOpacity
                  style={styles.resetScrollBtn}
                  onPress={() => {
                    setIsScrolling(false);
                    currentScrollY.current = 0;
                    if (Platform.OS === 'web' && typeof document !== 'undefined') {
                      const domEl = document.getElementById('stage-scroll-container');
                      if (domEl) domEl.scrollTop = 0;
                    } else {
                      scrollRef.current?.scrollTo({ y: 0, animated: true });
                    }
                  }}
                >
                  <RotateCcw color="#94A3B8" size={18} />
                </TouchableOpacity>

                {/* Varsa Setlist Sonraki Şarkı Butonu */}
                {currentSetlist && (
                  <TouchableOpacity
                    style={styles.navSongBtn}
                    onPress={() => handleNavigateSetlist('next')}
                  >
                    <ChevronRight color="#FFFFFF" size={20} />
                  </TouchableOpacity>
                )}
              </View>
            </>
          ) : (
            /* ANA EKRAN (SEKMELER: TÜM ŞARKILAR / SETLISTLER) */
            <>
              <View style={styles.tabBar}>
                <TouchableOpacity
                  style={[styles.tabItem, activeTab === 'songs' && styles.tabItemActive]}
                  onPress={() => setActiveTab('songs')}
                >
                  <Text style={[styles.tabText, activeTab === 'songs' && styles.tabTextActive]}>
                    Tüm Şarkılar ({songs.length})
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.tabItem, activeTab === 'setlists' && styles.tabItemActive]}
                  onPress={() => setActiveTab('setlists')}
                >
                  <Text style={[styles.tabText, activeTab === 'setlists' && styles.tabTextActive]}>
                    Setlistler ({setlists.length})
                  </Text>
                </TouchableOpacity>
              </View>

              {activeTab === 'songs' ? (
                <>
                  <View style={styles.listHeader}>
                    <View>
                      <Text style={styles.mainTitle}>Morfeus Repertuvar</Text>
                      <Text style={styles.subTitle}>{songs.length} Şarkı Kayıtlı</Text>
                    </View>
                    <TouchableOpacity
                      style={styles.addBtn}
                      onPress={handleOpenAddModal}
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

                          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                            <View style={styles.keyBadge}>
                              <Text style={styles.keyBadgeText}>{item.original_key}</Text>
                            </View>

                            <TouchableOpacity
                              style={styles.listRowIconBtn}
                              onPress={(e) => {
                                e.stopPropagation();
                                handleOpenEditModal(item);
                              }}
                            >
                              <Edit3 color="#94A3B8" size={16} />
                            </TouchableOpacity>

                            <TouchableOpacity
                              style={styles.listRowIconBtn}
                              onPress={(e) => {
                                e.stopPropagation();
                                handleDeleteSong(item.id);
                              }}
                            >
                              <Trash2 color="#EF4444" size={16} />
                            </TouchableOpacity>
                          </View>
                        </TouchableOpacity>
                      ))}
                      {filteredSongs.length === 0 && (
                        <Text style={styles.emptyText}>Aranan şarkı bulunamadı.</Text>
                      )}
                    </ScrollView>
                  )}
                </>
              ) : (
                /* SETLISTLER SEKMESİ */
                <>
                  <View style={styles.listHeader}>
                    <View>
                      <Text style={styles.mainTitle}>Konser Setlistleri</Text>
                      <Text style={styles.subTitle}>{setlists.length} Çalma Listesi</Text>
                    </View>
                    <TouchableOpacity
                      style={styles.addBtn}
                      onPress={() => {
                        setNewSetlistName('');
                        setSelectedSongIdsForSetlist([]);
                        setIsSetlistModalOpen(true);
                      }}
                    >
                      <ListMusic color="#FFFFFF" size={20} />
                      <Text style={styles.addBtnText}>Setlist Oluştur</Text>
                    </TouchableOpacity>
                  </View>

                  <ScrollView style={styles.listArea}>
                    {setlists.map((setlist) => (
                      <View key={setlist.id} style={styles.setlistCard}>
                        <View style={styles.setlistCardHeader}>
                          <View>
                            <Text style={styles.setlistTitle}>{setlist.name}</Text>
                            <Text style={styles.setlistCount}>
                              {setlist.song_ids.length} Şarkı
                            </Text>
                          </View>
                          <TouchableOpacity
                            style={styles.listRowIconBtn}
                            onPress={() => handleDeleteSetlist(setlist.id)}
                          >
                            <Trash2 color="#EF4444" size={16} />
                          </TouchableOpacity>
                        </View>

                        {/* Setlist içindeki şarkılar */}
                        <View style={styles.setlistSongList}>
                          {setlist.song_ids.map((sId, index) => {
                            const song = songs.find((s) => s.id === sId);
                            if (!song) return null;
                            return (
                              <TouchableOpacity
                                key={sId}
                                style={styles.setlistSongRow}
                                onPress={() => handleSelectSong(song, setlist)}
                              >
                                <Text style={styles.setlistIndex}>{index + 1}.</Text>
                                <Text style={styles.setlistSongTitle} numberOfLines={1}>
                                  {song.title} - {song.artist}
                                </Text>
                                <View style={styles.miniKeyBadge}>
                                  <Text style={styles.miniKeyText}>{song.original_key}</Text>
                                </View>
                              </TouchableOpacity>
                            );
                          })}
                        </View>
                      </View>
                    ))}
                    {setlists.length === 0 && (
                      <Text style={styles.emptyText}>Henüz oluşturulmuş setlist yok.</Text>
                    )}
                  </ScrollView>
                </>
              )}
            </>
          )}

        </View>
      </View>

      {/* YENİ SETLIST OLUŞTURMA MODALI */}
      <Modal visible={isSetlistModalOpen} animationType="slide" transparent={true}>
        <View style={styles.modalOverlay}>
          <View style={styles.addModalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Yeni Setlist Oluştur</Text>
              <TouchableOpacity onPress={() => setIsSetlistModalOpen(false)}>
                <X color="#94A3B8" size={22} />
              </TouchableOpacity>
            </View>

            <TextInput
              style={styles.formInput}
              placeholder="Setlist Adı (Örn: 1. Set / Akustik Gece)"
              placeholderTextColor="#64748B"
              value={newSetlistName}
              onChangeText={setNewSetlistName}
            />

            <Text style={[styles.formLabel, { marginBottom: 8, marginTop: 4 }]}>
              Listeye Eklenecek Şarkıları Seçin:
            </Text>

            <ScrollView style={{ maxHeight: 260, marginBottom: 16 }}>
              {songs.map((song) => {
                const isSelected = selectedSongIdsForSetlist.includes(song.id);
                return (
                  <TouchableOpacity
                    key={song.id}
                    style={[
                      styles.songSelectItem,
                      isSelected && styles.songSelectItemActive,
                    ]}
                    onPress={() => {
                      if (isSelected) {
                        setSelectedSongIdsForSetlist(
                          selectedSongIdsForSetlist.filter((id) => id !== song.id)
                        );
                      } else {
                        setSelectedSongIdsForSetlist([...selectedSongIdsForSetlist, song.id]);
                      }
                    }}
                  >
                    <Text style={[styles.songSelectTitle, isSelected && { color: '#FFFFFF' }]}>
                      {song.title} ({song.artist})
                    </Text>
                    {isSelected && <Check color="#38BDF8" size={18} />}
                  </TouchableOpacity>
                );
              })}
            </ScrollView>

            <TouchableOpacity
              style={[styles.saveBtn, isSavingSetlist && { opacity: 0.7 }]}
              onPress={handleSaveSetlist}
              disabled={isSavingSetlist}
            >
              <Text style={styles.saveBtnText}>
                {isSavingSetlist ? 'Kaydediliyor...' : 'Setlisti Kaydet'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* ŞARKI EKLE / DÜZENLE MODALI */}
      <Modal visible={isFormModalOpen} animationType="slide" transparent={true}>
        <View style={styles.modalOverlay}>
          <View style={styles.addModalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                {editingSongId ? 'Şarkıyı Düzenle' : 'Yeni Şarkı Ekle'}
              </Text>
              <TouchableOpacity onPress={() => setIsFormModalOpen(false)}>
                <X color="#94A3B8" size={22} />
              </TouchableOpacity>
            </View>

            <TextInput
              style={styles.formInput}
              placeholder="Şarkı Adı"
              placeholderTextColor="#64748B"
              value={formTitle}
              onChangeText={setFormTitle}
            />

            <TextInput
              style={styles.formInput}
              placeholder="Sanatçı"
              placeholderTextColor="#64748B"
              value={formArtist}
              onChangeText={setFormArtist}
            />

            <View style={styles.formRow}>
              <Text style={styles.formLabel}>Ton:</Text>
              <TextInput
                style={[styles.formInput, { width: 70, marginBottom: 0 }]}
                value={formOriginalKey}
                onChangeText={setFormOriginalKey}
                placeholder="Am"
                placeholderTextColor="#64748B"
              />

              <Text style={[styles.formLabel, { marginLeft: 16 }]}>BPM:</Text>
              <TextInput
                style={[styles.formInput, { width: 70, marginBottom: 0 }]}
                value={formBpm}
                onChangeText={setFormBpm}
                placeholder="100"
                keyboardType="numeric"
                placeholderTextColor="#64748B"
              />
            </View>

            <TextInput
              style={[styles.formInput, styles.textArea]}
              placeholder="Akorlu şarkı sözlerini doğrudan buraya yapıştırın..."
              placeholderTextColor="#64748B"
              value={formContent}
              onChangeText={setFormContent}
              multiline
            />

            <TouchableOpacity
              style={[styles.saveBtn, isSaving && { opacity: 0.7 }]}
              onPress={handleSaveOrUpdateSong}
              disabled={isSaving}
            >
              <Text style={styles.saveBtnText}>
                {isSaving
                  ? 'Kaydediliyor...'
                  : editingSongId
                  ? 'Değişiklikleri Kaydet'
                  : 'Repertuvara Kaydet'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* TON SEÇİCİ MODAL */}
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
    maxWidth: 780,
    backgroundColor: '#0F172A',
    borderLeftWidth: 1,
    borderRightWidth: 1,
    borderColor: '#1E293B',
  },
  tabBar: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#1E293B',
    backgroundColor: '#161F30',
  },
  tabItem: {
    flex: 1,
    paddingVertical: 14,
    alignItems: 'center',
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  tabItemActive: {
    borderBottomColor: '#4F46E5',
    backgroundColor: '#0F172A',
  },
  tabText: {
    color: '#94A3B8',
    fontWeight: '600',
    fontSize: 14,
  },
  tabTextActive: {
    color: '#F8FAFC',
    fontWeight: 'bold',
  },
  listHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingTop: 20,
    paddingBottom: 16,
  },
  mainTitle: {
    fontSize: 20,
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
  listRowIconBtn: {
    padding: 6,
    backgroundColor: '#1E293B',
    borderRadius: 6,
  },
  emptyText: {
    color: '#64748B',
    textAlign: 'center',
    marginTop: 40,
  },
  setlistCard: {
    backgroundColor: '#161F30',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#1E293B',
  },
  setlistCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#1E293B',
    paddingBottom: 10,
  },
  setlistTitle: {
    fontSize: 17,
    fontWeight: 'bold',
    color: '#F8FAFC',
  },
  setlistCount: {
    fontSize: 12,
    color: '#94A3B8',
    marginTop: 2,
  },
  setlistSongList: {
    gap: 6,
  },
  setlistSongRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 10,
    backgroundColor: '#0F172A',
    borderRadius: 6,
  },
  setlistIndex: {
    color: '#818CF8',
    fontWeight: 'bold',
    width: 24,
  },
  setlistSongTitle: {
    flex: 1,
    color: '#E2E8F0',
    fontSize: 13,
  },
  miniKeyBadge: {
    backgroundColor: '#1E293B',
    paddingVertical: 2,
    paddingHorizontal: 6,
    borderRadius: 4,
  },
  miniKeyText: {
    color: '#38BDF8',
    fontSize: 11,
    fontWeight: 'bold',
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
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  iconActionBtn: {
    padding: 6,
    backgroundColor: '#1E293B',
    borderRadius: 6,
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
  bpmContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1E293B',
    paddingVertical: 5,
    paddingHorizontal: 10,
    borderRadius: 12,
    gap: 6,
  },
  bpmDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#64748B',
  },
  bpmDotActive: {
    backgroundColor: '#10B981',
    transform: [{ scale: 1.3 }],
  },
  bpmText: {
    color: '#94A3B8',
    fontSize: 12,
    fontWeight: 'bold',
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
    paddingBottom: 400,
  },
  lyricsWrapper: {
    minWidth: '100%',
  },
  contentLine: {
    fontFamily: STAGE_FONT_FAMILY,
    letterSpacing: 0,
    whiteSpace: 'pre',
  } as any,
  chordOnlyLine: {
    fontFamily: STAGE_FONT_FAMILY,
    letterSpacing: 0,
    color: '#F59E0B',
    fontWeight: 'bold',
    whiteSpace: 'pre',
  } as any,
  chordText: {
    color: '#F59E0B',
    fontWeight: 'bold',
    fontFamily: STAGE_FONT_FAMILY,
  },
  lyricsText: {
    color: '#E2E8F0',
    fontFamily: STAGE_FONT_FAMILY,
  },
  floatingActionBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#1E293B',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderTopWidth: 1,
    borderTopColor: '#334155',
  },
  navSongBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#334155',
    justifyContent: 'center',
    alignItems: 'center',
  },
  playBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#10B981',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
    gap: 6,
  },
  playBtnActive: {
    backgroundColor: '#EF4444',
  },
  playBtnText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
    fontSize: 13,
  },
  speedButtonGroup: {
    flexDirection: 'row',
    backgroundColor: '#0F172A',
    borderRadius: 6,
    padding: 3,
    gap: 4,
  },
  speedBtn: {
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 4,
  },
  speedBtnActive: {
    backgroundColor: '#4F46E5',
  },
  speedBtnText: {
    color: '#94A3B8',
    fontSize: 12,
    fontWeight: 'bold',
  },
  speedBtnTextActive: {
    color: '#FFFFFF',
  },
  resetScrollBtn: {
    padding: 8,
    backgroundColor: '#0F172A',
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
    maxWidth: 600,
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
    marginBottom: 12,
  },
  formLabel: {
    color: '#94A3B8',
    fontSize: 14,
    marginRight: 8,
  },
  textArea: {
    height: 180,
    textAlignVertical: 'top',
    fontFamily: STAGE_FONT_FAMILY,
    whiteSpace: 'pre',
  } as any,
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
  songSelectItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 12,
    backgroundColor: '#0F172A',
    borderRadius: 8,
    marginBottom: 6,
    borderWidth: 1,
    borderColor: '#334155',
  },
  songSelectItemActive: {
    backgroundColor: '#312E81',
    borderColor: '#6366F1',
  },
  songSelectTitle: {
    color: '#94A3B8',
    fontSize: 13,
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