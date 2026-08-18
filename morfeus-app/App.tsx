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
  TouchableWithoutFeedback,
} from 'react-native';
import { supabase } from './src/lib/supabase';
import { ALL_TONES, transposeContent, transposeChord, isChordLine, CHORD_REGEX_STR } from './src/utils/chordEngine';
import { getChordVoicings, ChordVoicing } from './src/utils/chordDiagrams';
import { getPianoKeysForChord, PIANO_KEYS_2_OCTAVES } from './src/utils/pianoDiagrams';
import { getBassVoicings, BassVoicing } from './src/utils/bassDiagrams';
import { reharmonizeWithAI, MUSIC_STYLES, MusicStyle } from './src/services/aiArranger';
import TunerModal from './src/components/TunerModal';
import {
  Plus,
  Minus,
  ChevronDown,
  ChevronUp,
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
  Sparkles,
  Key,
  Volume2,
  Bookmark,
  Music2,
  Info,
} from 'lucide-react-native';

interface Song {
  id: string;
  title: string;
  artist: string;
  original_key: string;
  content: string;
  bpm?: number;
  capo?: string;
  rhythm?: string;
  notes?: string;
}

interface Setlist {
  id: string;
  name: string;
  song_ids: string[];
}

type InstrumentType = 'guitar' | 'piano' | 'bass';

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

  // Sahne Bilgi Kartı Görünürlüğü
  const [isNoteCardVisible, setIsNoteCardVisible] = useState(true);

  // Akort Aleti (Tuner) Modal State'i
  const [isTunerOpen, setIsTunerOpen] = useState(false);

  // Enstrüman Tercihi (Gitar, Piyano, Bas Gitar)
  const [selectedInstrument, setSelectedInstrument] = useState<InstrumentType>('guitar');

  // Transpoze & Font
  const [transposeValue, setTransposeValue] = useState(0);
  const [selectedTone, setSelectedTone] = useState<string>('');
  const [isToneModalOpen, setIsToneModalOpen] = useState(false);
  const [fontSize, setFontSize] = useState(15);

  // Akor Şeması Pop-up & Çoklu Pozisyon State'i
  const [inspectedChord, setInspectedChord] = useState<string | null>(null);
  const [chordVoicingIndex, setChordVoicingIndex] = useState<number>(0);

  // AI Aranjör State'leri
  const [geminiApiKey, setGeminiApiKey] = useState<string>(() => {
    if (Platform.OS === 'web' && typeof localStorage !== 'undefined') {
      return localStorage.getItem('morfeus_gemini_api_key') || '';
    }
    return '';
  });
  const [isAiModalOpen, setIsAiModalOpen] = useState(false);
  const [isApiKeyModalOpen, setIsApiKeyModalOpen] = useState(false);
  const [apiKeyInput, setApiKeyInput] = useState('');
  const [isArranging, setIsArranging] = useState(false);
  const [arrangingStatus, setArrangingStatus] = useState('');

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
  const [formCapo, setFormCapo] = useState('Yok');
  const [formRhythm, setFormRhythm] = useState('');
  const [formNotes, setFormNotes] = useState('');
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
    setIsNoteCardVisible(true);
    currentScrollY.current = 0;
    if (Platform.OS === 'web' && typeof document !== 'undefined') {
      const domEl = document.getElementById('stage-scroll-container');
      if (domEl) domEl.scrollTop = 0;
    }
  };

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
    setFormCapo('Yok');
    setFormRhythm('↓ - ↓↑ - ↑↓↑');
    setFormNotes('');
    setFormContent('');
    setIsFormModalOpen(true);
  };

  const handleOpenEditModal = (songItem: Song) => {
    setEditingSongId(songItem.id);
    setFormTitle(songItem.title);
    setFormArtist(songItem.artist);
    setFormOriginalKey(songItem.original_key);
    setFormBpm(songItem.bpm ? songItem.bpm.toString() : '100');
    setFormCapo(songItem.capo || 'Yok');
    setFormRhythm(songItem.rhythm || '');
    setFormNotes(songItem.notes || '');
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
        capo: formCapo.trim(),
        rhythm: formRhythm.trim(),
        notes: formNotes.trim(),
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

  const handleSaveApiKey = () => {
    if (!apiKeyInput.trim()) {
      alert('Lütfen geçerli bir API anahtarı girin.');
      return;
    }
    setGeminiApiKey(apiKeyInput.trim());
    if (Platform.OS === 'web' && typeof localStorage !== 'undefined') {
      localStorage.setItem('morfeus_gemini_api_key', apiKeyInput.trim());
    }
    setIsApiKeyModalOpen(false);
  };

  const handleRunAiArranger = async (style: MusicStyle) => {
    if (!geminiApiKey) {
      setIsApiKeyModalOpen(true);
      return;
    }
    if (!selectedSong) return;

    try {
      setIsArranging(true);
      setArrangingStatus(`${style} armonisi hazırlanıyor...`);

      const result = await reharmonizeWithAI(
        geminiApiKey,
        selectedSong.title,
        selectedSong.artist,
        selectedSong.original_key,
        selectedSong.content,
        style
      );

      setArrangingStatus('Yeni versiyon repertuvara kaydediliyor...');

      const { data, error } = await supabase
        .from('morfeus_songs')
        .insert([
          {
            title: result.newTitle,
            artist: selectedSong.artist,
            original_key: result.newKey,
            bpm: selectedSong.bpm || 100,
            capo: selectedSong.capo || 'Yok',
            rhythm: selectedSong.rhythm || '',
            notes: `${selectedSong.notes || ''} [${style} AI Aranjmanı]`.trim(),
            content: result.newContent,
          },
        ])
        .select();

      if (error) throw error;

      if (data && data.length > 0) {
        const createdSong = data[0];
        setSongs([createdSong, ...songs]);
        setIsAiModalOpen(false);
        handleSelectSong(createdSong);
      }
    } catch (err: any) {
      console.error('AI Aranjör hatası:', err);
      alert(`Armonizasyon sırasında hata: ${err.message || err}`);
    } finally {
      setIsArranging(false);
      setArrangingStatus('');
    }
  };

  const openChordModal = (chordName: string) => {
    setInspectedChord(chordName);
    setChordVoicingIndex(0);
  };

  const renderFormattedContent = (content: string) => {
    const lines = content.split('\n');
    return lines.map((line, lineIdx) => {
      if (isChordLine(line)) {
        const tokens = line.split(/(\s+)/);
        return (
          <Text
            key={lineIdx}
            style={[
              styles.chordOnlyLine,
              { fontSize, lineHeight: fontSize * 1.5 },
            ]}
          >
            {tokens.map((tok, tIdx) => {
              if (!tok.trim()) return tok;
              return (
                <Text
                  key={tIdx}
                  style={styles.clickableChord}
                  onPress={() => openChordModal(tok.trim())}
                >
                  {tok}
                </Text>
              );
            })}
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
              const chordName = part.slice(1, -1);
              return (
                <Text
                  key={partIdx}
                  style={styles.clickableChord}
                  onPress={() => openChordModal(chordName)}
                >
                  {chordName}
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

  // 6 Telli Gitar Klavyeli Şema
  const renderGuitarDiagram = (chordName: string) => {
    const voicings: ChordVoicing[] = getChordVoicings(chordName);
    const strings = ['E', 'A', 'D', 'G', 'B', 'e'];
    const fretsCount = 4;

    if (!voicings || voicings.length === 0) {
      return (
        <View style={styles.diagramFallback}>
          <Text style={styles.fallbackTitle}>{chordName}</Text>
          <Text style={styles.fallbackDesc}>Bu akor için henüz gitar diyagramı eklenmedi.</Text>
        </View>
      );
    }

    const currentVoicing = voicings[chordVoicingIndex] || voicings[0];
    const minFret = currentVoicing.baseFret;

    return (
      <View style={styles.diagramWrapper}>
        <Text style={styles.diagramTitle}>{chordName}</Text>

        <View style={styles.voicingNavBar}>
          <TouchableOpacity
            style={[styles.voicingNavBtn, chordVoicingIndex === 0 && { opacity: 0.3 }]}
            disabled={chordVoicingIndex === 0}
            onPress={() => setChordVoicingIndex((prev) => Math.max(0, prev - 1))}
          >
            <ChevronLeft color="#38BDF8" size={18} />
          </TouchableOpacity>

          <View style={{ alignItems: 'center' }}>
            <Text style={styles.voicingCountText}>
              Gitar Pozisyonu {chordVoicingIndex + 1} / {voicings.length}
            </Text>
            {currentVoicing.label && (
              <Text style={styles.voicingLabelText}>{currentVoicing.label}</Text>
            )}
          </View>

          <TouchableOpacity
            style={[
              styles.voicingNavBtn,
              chordVoicingIndex === voicings.length - 1 && { opacity: 0.3 },
            ]}
            disabled={chordVoicingIndex === voicings.length - 1}
            onPress={() =>
              setChordVoicingIndex((prev) => Math.min(voicings.length - 1, prev + 1))
            }
          >
            <ChevronRight color="#38BDF8" size={18} />
          </TouchableOpacity>
        </View>

        {minFret > 1 && (
          <Text style={styles.fretIndicator}>{minFret}. Perde</Text>
        )}

        <View style={styles.nutRow}>
          {currentVoicing.frets.map((fret, sIdx) => (
            <View key={sIdx} style={styles.nutIndicatorBox}>
              <Text
                style={[
                  styles.nutIndicatorText,
                  fret === -1 && { color: '#EF4444' },
                  fret === 0 && { color: '#10B981' },
                ]}
              >
                {fret === -1 ? '✕' : fret === 0 ? '○' : ''}
              </Text>
            </View>
          ))}
        </View>

        <View style={styles.fretboard}>
          {[...Array(fretsCount)].map((_, fIdx) => {
            const currentFretNum = minFret + fIdx;
            return (
              <View key={fIdx} style={styles.fretRow}>
                {[0, 1, 2, 3, 4, 5].map((sIdx) => {
                  const fingerFret = currentVoicing.frets[sIdx];
                  const hasDot = fingerFret === currentFretNum;

                  return (
                    <View key={sIdx} style={styles.fretStringCell}>
                      <View style={styles.verticalStringLine} />
                      {hasDot && <View style={styles.fingerDot} />}
                    </View>
                  );
                })}
              </View>
            );
          })}
        </View>

        <View style={styles.stringNamesRow}>
          {strings.map((str, idx) => (
            <Text key={idx} style={styles.stringNameText}>
              {str}
            </Text>
          ))}
        </View>
      </View>
    );
  };

  // 4 Telli Bas Gitar Klavyeli Şema
  const renderBassDiagram = (chordName: string) => {
    const voicings: BassVoicing[] = getBassVoicings(chordName);
    const strings = ['E', 'A', 'D', 'G'];
    const fretsCount = 4;

    if (!voicings || voicings.length === 0) {
      return (
        <View style={styles.diagramFallback}>
          <Text style={styles.fallbackTitle}>{chordName}</Text>
          <Text style={styles.fallbackDesc}>Bu akor için bas şeması hazırlanıyor.</Text>
        </View>
      );
    }

    const currentVoicing = voicings[chordVoicingIndex] || voicings[0];
    const minFret = currentVoicing.baseFret;

    return (
      <View style={styles.diagramWrapper}>
        <Text style={styles.diagramTitle}>{chordName}</Text>

        <View style={styles.voicingNavBar}>
          <TouchableOpacity
            style={[styles.voicingNavBtn, chordVoicingIndex === 0 && { opacity: 0.3 }]}
            disabled={chordVoicingIndex === 0}
            onPress={() => setChordVoicingIndex((prev) => Math.max(0, prev - 1))}
          >
            <ChevronLeft color="#38BDF8" size={18} />
          </TouchableOpacity>

          <View style={{ alignItems: 'center' }}>
            <Text style={styles.voicingCountText}>
              Bas Pozisyonu {chordVoicingIndex + 1} / {voicings.length}
            </Text>
            {currentVoicing.label && (
              <Text style={styles.voicingLabelText}>{currentVoicing.label}</Text>
            )}
          </View>

          <TouchableOpacity
            style={[
              styles.voicingNavBtn,
              chordVoicingIndex === voicings.length - 1 && { opacity: 0.3 },
            ]}
            disabled={chordVoicingIndex === voicings.length - 1}
            onPress={() =>
              setChordVoicingIndex((prev) => Math.min(voicings.length - 1, prev + 1))
            }
          >
            <ChevronRight color="#38BDF8" size={18} />
          </TouchableOpacity>
        </View>

        {minFret > 1 && (
          <Text style={styles.fretIndicator}>{minFret}. Perde</Text>
        )}

        <View style={[styles.nutRow, { width: 150 }]}>
          {currentVoicing.frets.map((fret, sIdx) => (
            <View key={sIdx} style={styles.nutIndicatorBox}>
              <Text
                style={[
                  styles.nutIndicatorText,
                  fret === -1 && { color: '#EF4444' },
                  fret === 0 && { color: '#10B981' },
                ]}
              >
                {fret === -1 ? '✕' : fret === 0 ? '○' : ''}
              </Text>
            </View>
          ))}
        </View>

        <View style={[styles.fretboard, { width: 150 }]}>
          {[...Array(fretsCount)].map((_, fIdx) => {
            const currentFretNum = minFret + fIdx;
            return (
              <View key={fIdx} style={styles.fretRow}>
                {[0, 1, 2, 3].map((sIdx) => {
                  const toneObj = currentVoicing.chordTones.find(
                    (t) => t.stringIdx === sIdx && t.fret === currentFretNum
                  );
                  const isRoot = toneObj?.isRoot;

                  return (
                    <View key={sIdx} style={styles.fretStringCell}>
                      <View
                        style={[
                          styles.verticalStringLine,
                          { width: sIdx === 0 ? 3.5 : sIdx === 1 ? 2.8 : sIdx === 2 ? 2.2 : 1.6 },
                        ]}
                      />
                      {toneObj && (
                        <View
                          style={[
                            styles.bassFingerDot,
                            isRoot ? styles.bassRootDot : styles.bassToneDot,
                          ]}
                        >
                          <Text style={styles.bassToneText}>{toneObj.interval}</Text>
                        </View>
                      )}
                    </View>
                  );
                })}
              </View>
            );
          })}
        </View>

        <View style={[styles.stringNamesRow, { width: 150 }]}>
          {strings.map((str, idx) => (
            <Text key={idx} style={styles.stringNameText}>
              {str}
            </Text>
          ))}
        </View>
      </View>
    );
  };

  // Piyano Tuşlu Şema
  const renderPianoDiagram = (chordName: string) => {
    const { activeSemitones, activeNoteNames } = getPianoKeysForChord(chordName);
    const whiteKeys = PIANO_KEYS_2_OCTAVES.filter((k) => !k.isBlack);

    return (
      <View style={styles.diagramWrapper}>
        <Text style={styles.diagramTitle}>{chordName}</Text>

        <View style={styles.pianoNotesList}>
          <Text style={styles.pianoNotesLabel}>Basılan Notalar: </Text>
          <Text style={styles.pianoNotesValue}>{activeNoteNames.join(' - ')}</Text>
        </View>

        <View style={styles.pianoKeyboardContainer}>
          <View style={styles.pianoWhiteKeysRow}>
            {whiteKeys.map((k) => {
              const isActive = activeSemitones.includes(k.semitone);
              return (
                <View
                  key={k.semitone}
                  style={[
                    styles.pianoWhiteKey,
                    isActive && styles.pianoWhiteKeyActive,
                  ]}
                >
                  <Text style={[styles.pianoWhiteKeyLabel, isActive && styles.pianoKeyTextActive]}>
                    {k.note}
                  </Text>
                </View>
              );
            })}
          </View>

          <View style={styles.pianoBlackKeysOverlay} pointerEvents="none">
            {PIANO_KEYS_2_OCTAVES.map((k) => {
              if (!k.isBlack) {
                return <View key={k.semitone} style={styles.pianoBlackKeySpacer} />;
              }

              const isActive = activeSemitones.includes(k.semitone);
              return (
                <View
                  key={k.semitone}
                  style={[
                    styles.pianoBlackKey,
                    isActive && styles.pianoBlackKeyActive,
                  ]}
                >
                  {isActive && <View style={styles.pianoBlackDot} />}
                </View>
              );
            })}
          </View>
        </View>
      </View>
    );
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
                  <TouchableOpacity
                    style={styles.aiActionBtn}
                    onPress={() => setIsAiModalOpen(true)}
                  >
                    <Sparkles color="#F59E0B" size={16} />
                    <Text style={styles.aiActionBtnText}>AI Tarz</Text>
                  </TouchableOpacity>

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
                    <Edit3 color="#94A3B8" size={17} />
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.iconActionBtn}
                    onPress={() => handleDeleteSong(selectedSong.id)}
                  >
                    <Trash2 color="#EF4444" size={17} />
                  </TouchableOpacity>
                </View>
              </View>

              {/* KONTROL BARI (3'LÜ ENSTRÜMAN SEÇİCİ İLE) */}
              <View style={styles.controlBar}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
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

                  {/* 3'lü Enstrüman Switcher */}
                  <View style={styles.instrumentGroup}>
                    <TouchableOpacity
                      style={[
                        styles.instrumentItemBtn,
                        selectedInstrument === 'guitar' && styles.instrumentItemBtnActive,
                      ]}
                      onPress={() => setSelectedInstrument('guitar')}
                    >
                      <Text style={[styles.instrumentEmoji, selectedInstrument === 'guitar' && styles.instrumentEmojiActive]}>
                        🎸 Gitar
                      </Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={[
                        styles.instrumentItemBtn,
                        selectedInstrument === 'piano' && styles.instrumentItemBtnActive,
                      ]}
                      onPress={() => setSelectedInstrument('piano')}
                    >
                      <Text style={[styles.instrumentEmoji, selectedInstrument === 'piano' && styles.instrumentEmojiActive]}>
                        🎹 Piyano
                      </Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={[
                        styles.instrumentItemBtn,
                        selectedInstrument === 'bass' && styles.instrumentItemBtnActive,
                      ]}
                      onPress={() => setSelectedInstrument('bass')}
                    >
                      <Text style={[styles.instrumentEmoji, selectedInstrument === 'bass' && styles.instrumentEmojiActive]}>
                        🎻 Bas
                      </Text>
                    </TouchableOpacity>
                  </View>
                </View>

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

              {/* ŞARKI METNİ & SAHNE BİLGİ ALANI */}
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
                {/* SAHNE DETAY & NOT KARTI (AÇILIR/KAPANIR) */}
                {(selectedSong.capo || selectedSong.rhythm || selectedSong.notes) && (
                  <View style={styles.stageDashboardCard}>
                    <TouchableOpacity
                      style={styles.stageDashboardHeader}
                      onPress={() => setIsNoteCardVisible(!isNoteCardVisible)}
                    >
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                        <Bookmark color="#F59E0B" size={16} />
                        <Text style={styles.stageDashboardTitle}>Sahne Bilgi & Performans Notları</Text>
                      </View>
                      {isNoteCardVisible ? (
                        <ChevronUp color="#94A3B8" size={16} />
                      ) : (
                        <ChevronDown color="#94A3B8" size={16} />
                      )}
                    </TouchableOpacity>

                    {isNoteCardVisible && (
                      <View style={styles.stageDashboardBody}>
                        <View style={styles.stageDetailsRow}>
                          {selectedSong.capo ? (
                            <View style={styles.detailPill}>
                              <Text style={styles.detailPillLabel}>KAPO:</Text>
                              <Text style={styles.detailPillValue}>{selectedSong.capo}</Text>
                            </View>
                          ) : null}

                          {selectedSong.rhythm ? (
                            <View style={styles.detailPill}>
                              <Text style={styles.detailPillLabel}>RİTİM:</Text>
                              <Text style={styles.detailPillValue}>{selectedSong.rhythm}</Text>
                            </View>
                          ) : null}
                        </View>

                        {selectedSong.notes ? (
                          <View style={styles.noteBox}>
                            <Info color="#38BDF8" size={14} style={{ marginTop: 2 }} />
                            <Text style={styles.noteBoxText}>{selectedSong.notes}</Text>
                          </View>
                        ) : null}
                      </View>
                    )}
                  </View>
                )}

                {/* AKORLU ŞARKI METNİ */}
                <ScrollView horizontal={true} showsHorizontalScrollIndicator={false}>
                  <View style={styles.lyricsWrapper}>
                    {renderFormattedContent(transposeContent(selectedSong.content, transposeValue))}
                  </View>
                </ScrollView>
              </ScrollView>

              {/* SAHNE ALT YÜZER BARI */}
              <View style={styles.floatingActionBar}>
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
            /* ANA EKRAN */
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
                    <View style={{ flexDirection: 'row', gap: 8 }}>
                      <TouchableOpacity
                        style={styles.apiKeyBtn}
                        onPress={() => setIsTunerOpen(true)}
                      >
                        <Volume2 color="#38BDF8" size={16} />
                      </TouchableOpacity>

                      <TouchableOpacity
                        style={styles.apiKeyBtn}
                        onPress={() => {
                          setApiKeyInput(geminiApiKey);
                          setIsApiKeyModalOpen(true);
                        }}
                      >
                        <Key color={geminiApiKey ? '#10B981' : '#F59E0B'} size={16} />
                      </TouchableOpacity>

                      <TouchableOpacity
                        style={styles.addBtn}
                        onPress={handleOpenAddModal}
                      >
                        <PlusCircle color="#FFFFFF" size={18} />
                        <Text style={styles.addBtnText}>Şarkı Ekle</Text>
                      </TouchableOpacity>
                    </View>
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
                            {item.capo && item.capo !== 'Yok' && (
                              <Text style={styles.miniCapoTag}>Kapo: {item.capo}</Text>
                            )}
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
                      <ListMusic color="#FFFFFF" size={18} />
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

      {/* DİJİTAL AKORT ALETİ (TUNER) MODALI */}
      <TunerModal visible={isTunerOpen} onClose={() => setIsTunerOpen(false)} />

      {/* AI TARZ ARANJÖR MODALI */}
      <Modal visible={isAiModalOpen} animationType="slide" transparent={true}>
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => !isArranging && setIsAiModalOpen(false)}
        >
          <TouchableWithoutFeedback>
            <View style={styles.aiModalContent}>
              <View style={styles.modalHeader}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                  <Sparkles color="#F59E0B" size={22} />
                  <Text style={styles.modalTitle}>AI Akor Tarz Aranjörü</Text>
                </View>
                {!isArranging && (
                  <TouchableOpacity onPress={() => setIsAiModalOpen(false)}>
                    <X color="#94A3B8" size={22} />
                  </TouchableOpacity>
                )}
              </View>

              <Text style={styles.aiModalDesc}>
                "{selectedSong?.title}" şarkısının akorlarını seçtiğin müzikal stile göre yeniden armonize et.
              </Text>

              {isArranging ? (
                <View style={styles.arrangingLoadingBox}>
                  <ActivityIndicator size="large" color="#F59E0B" />
                  <Text style={styles.arrangingText}>{arrangingStatus}</Text>
                  <Text style={styles.arrangingSubText}>Akorlar ve yürüyüşler baştan yazılıyor...</Text>
                </View>
              ) : (
                <ScrollView style={{ maxHeight: 340 }}>
                  {MUSIC_STYLES.map((style) => (
                    <TouchableOpacity
                      key={style.id}
                      style={styles.styleCard}
                      onPress={() => handleRunAiArranger(style.id)}
                    >
                      <Text style={styles.styleIcon}>{style.icon}</Text>
                      <View style={{ flex: 1 }}>
                        <Text style={styles.styleName}>{style.name}</Text>
                        <Text style={styles.styleDesc}>{style.desc}</Text>
                      </View>
                      <ChevronRight color="#64748B" size={18} />
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              )}
            </View>
          </TouchableWithoutFeedback>
        </TouchableOpacity>
      </Modal>

      {/* GEMINI API KEY MODALI */}
      <Modal visible={isApiKeyModalOpen} animationType="fade" transparent={true}>
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setIsApiKeyModalOpen(false)}
        >
          <TouchableWithoutFeedback>
            <View style={styles.apiKeyModalContent}>
              <View style={styles.modalHeader}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                  <Key color="#38BDF8" size={20} />
                  <Text style={styles.modalTitle}>Google Gemini API Key</Text>
                </View>
                <TouchableOpacity onPress={() => setIsApiKeyModalOpen(false)}>
                  <X color="#94A3B8" size={22} />
                </TouchableOpacity>
              </View>

              <Text style={styles.aiModalDesc}>
                AI Aranjör özelliğini ücretsiz kullanmak için{' '}
                <Text style={{ color: '#38BDF8', fontWeight: 'bold' }}>aistudio.google.com</Text> adresinden
                aldığın ücretsiz API anahtarını buraya yapıştır.
              </Text>

              <TextInput
                style={styles.formInput}
                placeholder="AQ.Ab8..."
                placeholderTextColor="#64748B"
                value={apiKeyInput}
                onChangeText={setApiKeyInput}
                autoCapitalize="none"
              />

              <TouchableOpacity style={styles.saveBtn} onPress={handleSaveApiKey}>
                <Text style={styles.saveBtnText}>Anahtarı Kaydet</Text>
              </TouchableOpacity>
            </View>
          </TouchableWithoutFeedback>
        </TouchableOpacity>
      </Modal>

      {/* 3 ENSTRÜMANLI (GİTAR, PİYANO, BAS GİTAR) AKOR DİYAGRAM MODALI */}
      <Modal visible={!!inspectedChord} animationType="fade" transparent={true}>
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setInspectedChord(null)}
        >
          <TouchableWithoutFeedback>
            <View
              style={[
                styles.chordModalContent,
                selectedInstrument === 'piano' && { maxWidth: 440 },
              ]}
            >
              <View style={styles.modalHeader}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                  <Text style={styles.modalTitle}>
                    {selectedInstrument === 'guitar'
                      ? '🎸 Gitar Akoru'
                      : selectedInstrument === 'bass'
                      ? '🎻 Bas Gitar Akoru'
                      : '🎹 Piyano Akoru'}
                  </Text>
                </View>

                <View style={styles.modalInstrumentSwitchGroup}>
                  <TouchableOpacity
                    style={[
                      styles.modalInstrumentSwitchBtn,
                      selectedInstrument === 'guitar' && styles.modalInstrumentSwitchBtnActive,
                    ]}
                    onPress={() => {
                      setSelectedInstrument('guitar');
                      setChordVoicingIndex(0);
                    }}
                  >
                    <Text style={styles.modalSwitchText}>🎸</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[
                      styles.modalInstrumentSwitchBtn,
                      selectedInstrument === 'piano' && styles.modalInstrumentSwitchBtnActive,
                    ]}
                    onPress={() => {
                      setSelectedInstrument('piano');
                      setChordVoicingIndex(0);
                    }}
                  >
                    <Text style={styles.modalSwitchText}>🎹</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[
                      styles.modalInstrumentSwitchBtn,
                      selectedInstrument === 'bass' && styles.modalInstrumentSwitchBtnActive,
                    ]}
                    onPress={() => {
                      setSelectedInstrument('bass');
                      setChordVoicingIndex(0);
                    }}
                  >
                    <Text style={styles.modalSwitchText}>🎻</Text>
                  </TouchableOpacity>
                </View>

                <TouchableOpacity onPress={() => setInspectedChord(null)}>
                  <X color="#94A3B8" size={22} />
                </TouchableOpacity>
              </View>

              {inspectedChord &&
                (selectedInstrument === 'guitar'
                  ? renderGuitarDiagram(inspectedChord)
                  : selectedInstrument === 'bass'
                  ? renderBassDiagram(inspectedChord)
                  : renderPianoDiagram(inspectedChord))}
            </View>
          </TouchableWithoutFeedback>
        </TouchableOpacity>
      </Modal>

      {/* YENİ SETLIST OLUŞTURMA MODALI */}
      <Modal visible={isSetlistModalOpen} animationType="slide" transparent={true}>
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setIsSetlistModalOpen(false)}
        >
          <TouchableWithoutFeedback>
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
          </TouchableWithoutFeedback>
        </TouchableOpacity>
      </Modal>

      {/* ŞARKI EKLE / DÜZENLE MODALI (KAPO, RİTİM VE NOTLAR ALANLARIYLA) */}
      <Modal visible={isFormModalOpen} animationType="slide" transparent={true}>
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setIsFormModalOpen(false)}
        >
          <TouchableWithoutFeedback>
            <View style={styles.addModalContent}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>
                  {editingSongId ? 'Şarkıyı Düzenle' : 'Yeni Şarkı Ekle'}
                </Text>
                <TouchableOpacity onPress={() => setIsFormModalOpen(false)}>
                  <X color="#94A3B8" size={22} />
                </TouchableOpacity>
              </View>

              <ScrollView style={{ maxHeight: 520 }}>
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

                {/* Ton, BPM, Kapo Satırı */}
                <View style={styles.formRow}>
                  <Text style={styles.formLabel}>Ton:</Text>
                  <TextInput
                    style={[styles.formInput, { width: 55, marginBottom: 0 }]}
                    value={formOriginalKey}
                    onChangeText={setFormOriginalKey}
                    placeholder="Am"
                    placeholderTextColor="#64748B"
                  />

                  <Text style={[styles.formLabel, { marginLeft: 10 }]}>BPM:</Text>
                  <TextInput
                    style={[styles.formInput, { width: 55, marginBottom: 0 }]}
                    value={formBpm}
                    onChangeText={setFormBpm}
                    placeholder="100"
                    keyboardType="numeric"
                    placeholderTextColor="#64748B"
                  />

                  <Text style={[styles.formLabel, { marginLeft: 10 }]}>Kapo:</Text>
                  <TextInput
                    style={[styles.formInput, { flex: 1, marginBottom: 0 }]}
                    value={formCapo}
                    onChangeText={setFormCapo}
                    placeholder="Yok / Kapo 2"
                    placeholderTextColor="#64748B"
                  />
                </View>

                {/* Ritim Şablonu */}
                <TextInput
                  style={styles.formInput}
                  placeholder="Ritim / Arpej Şablonu (Örn: ↓ - ↓↑ - ↑↓↑ / 4/4 Pop)"
                  placeholderTextColor="#64748B"
                  value={formRhythm}
                  onChangeText={setFormRhythm}
                />

                {/* Sahne / Performans Notları */}
                <TextInput
                  style={styles.formInput}
                  placeholder="Sahne / Performans Notu (Örn: İntro piyano, nakaratta solo)"
                  placeholderTextColor="#64748B"
                  value={formNotes}
                  onChangeText={setFormNotes}
                />

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
              </ScrollView>
            </View>
          </TouchableWithoutFeedback>
        </TouchableOpacity>
      </Modal>

      {/* TON SEÇİCİ MODAL */}
      <Modal visible={isToneModalOpen} animationType="fade" transparent={true}>
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setIsToneModalOpen(false)}
        >
          <TouchableWithoutFeedback>
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
          </TouchableWithoutFeedback>
        </TouchableOpacity>
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
  apiKeyBtn: {
    backgroundColor: '#1E293B',
    padding: 9,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#334155',
    justifyContent: 'center',
    alignItems: 'center',
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
  miniCapoTag: {
    fontSize: 11,
    color: '#F59E0B',
    marginTop: 2,
    fontWeight: '600',
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
  aiActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#312E81',
    paddingVertical: 5,
    paddingHorizontal: 9,
    borderRadius: 8,
    gap: 4,
    borderWidth: 1,
    borderColor: '#6366F1',
  },
  aiActionBtnText: {
    color: '#F59E0B',
    fontWeight: 'bold',
    fontSize: 12,
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
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: '#161F30',
    borderBottomWidth: 1,
    borderBottomColor: '#1E293B',
  },
  toneButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1E293B',
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#334155',
    gap: 4,
  },
  toneLabel: {
    fontSize: 11,
    color: '#94A3B8',
    fontWeight: '600',
  },
  toneValue: {
    fontSize: 13,
    fontWeight: 'bold',
    color: '#38BDF8',
  },
  instrumentGroup: {
    flexDirection: 'row',
    backgroundColor: '#0F172A',
    borderRadius: 8,
    padding: 2,
    borderWidth: 1,
    borderColor: '#334155',
    gap: 2,
  },
  instrumentItemBtn: {
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 6,
  },
  instrumentItemBtnActive: {
    backgroundColor: '#1E293B',
  },
  instrumentEmoji: {
    color: '#64748B',
    fontSize: 11,
    fontWeight: 'bold',
  },
  instrumentEmojiActive: {
    color: '#38BDF8',
  },
  fontSizeControls: {
    flexDirection: 'row',
    gap: 6,
  },
  smallIconBtn: {
    backgroundColor: '#1E293B',
    paddingVertical: 5,
    paddingHorizontal: 8,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#334155',
  },
  fontBtnText: {
    color: '#94A3B8',
    fontWeight: 'bold',
    fontSize: 12,
  },
  transposeControls: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  circleBtn: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: '#4F46E5',
    justifyContent: 'center',
    alignItems: 'center',
  },
  transposeBadge: {
    minWidth: 22,
    alignItems: 'center',
  },
  transposeText: {
    fontSize: 13,
    fontWeight: 'bold',
    color: '#F8FAFC',
  },
  scrollArea: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 400,
  },
  stageDashboardCard: {
    backgroundColor: '#161F30',
    borderRadius: 10,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#334155',
    overflow: 'hidden',
  },
  stageDashboardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 14,
    backgroundColor: '#1E293B',
  },
  stageDashboardTitle: {
    color: '#F8FAFC',
    fontSize: 12,
    fontWeight: 'bold',
  },
  stageDashboardBody: {
    padding: 12,
    gap: 10,
  },
  stageDetailsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  detailPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0F172A',
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 6,
    gap: 4,
    borderWidth: 1,
    borderColor: '#334155',
  },
  detailPillLabel: {
    color: '#94A3B8',
    fontSize: 11,
    fontWeight: 'bold',
  },
  detailPillValue: {
    color: '#38BDF8',
    fontSize: 12,
    fontWeight: 'bold',
  },
  noteBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#0F172A',
    padding: 10,
    borderRadius: 6,
    gap: 8,
    borderLeftWidth: 3,
    borderLeftColor: '#38BDF8',
  },
  noteBoxText: {
    flex: 1,
    color: '#CBD5E1',
    fontSize: 12,
    lineHeight: 17,
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
  clickableChord: {
    color: '#F59E0B',
    fontWeight: 'bold',
    cursor: 'pointer',
    textDecorationLine: 'underline',
    textDecorationColor: '#F59E0B44',
  } as any,
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
    backgroundColor: 'rgba(0,0,0,0.75)',
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
  aiModalContent: {
    backgroundColor: '#1E293B',
    borderRadius: 16,
    padding: 24,
    width: '100%',
    maxWidth: 520,
    borderWidth: 1,
    borderColor: '#334155',
  },
  apiKeyModalContent: {
    backgroundColor: '#1E293B',
    borderRadius: 16,
    padding: 24,
    width: '100%',
    maxWidth: 460,
    borderWidth: 1,
    borderColor: '#334155',
  },
  aiModalDesc: {
    color: '#94A3B8',
    fontSize: 13,
    lineHeight: 18,
    marginBottom: 16,
  },
  styleCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    backgroundColor: '#0F172A',
    borderRadius: 10,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#334155',
    gap: 12,
  },
  styleIcon: {
    fontSize: 24,
  },
  styleName: {
    color: '#F8FAFC',
    fontWeight: 'bold',
    fontSize: 15,
  },
  styleDesc: {
    color: '#94A3B8',
    fontSize: 12,
    marginTop: 2,
  },
  arrangingLoadingBox: {
    paddingVertical: 36,
    alignItems: 'center',
    gap: 12,
  },
  arrangingText: {
    color: '#F8FAFC',
    fontWeight: 'bold',
    fontSize: 16,
    marginTop: 6,
  },
  arrangingSubText: {
    color: '#94A3B8',
    fontSize: 13,
  },
  chordModalContent: {
    backgroundColor: '#1E293B',
    borderRadius: 16,
    padding: 20,
    width: '100%',
    maxWidth: 360,
    borderWidth: 1,
    borderColor: '#334155',
    alignItems: 'center',
  },
  modalInstrumentSwitchGroup: {
    flexDirection: 'row',
    backgroundColor: '#0F172A',
    padding: 3,
    borderRadius: 8,
    gap: 4,
    borderWidth: 1,
    borderColor: '#334155',
  },
  modalInstrumentSwitchBtn: {
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 6,
  },
  modalInstrumentSwitchBtnActive: {
    backgroundColor: '#334155',
  },
  modalSwitchText: {
    fontSize: 13,
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
    width: '100%',
  },
  modalTitle: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#F8FAFC',
  },
  closeText: {
    color: '#94A3B8',
    fontSize: 14,
  },
  diagramWrapper: {
    alignItems: 'center',
    width: '100%',
    paddingVertical: 4,
  },
  diagramTitle: {
    fontSize: 26,
    fontWeight: 'bold',
    color: '#F59E0B',
    marginBottom: 6,
  },
  voicingNavBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
    backgroundColor: '#0F172A',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#334155',
  },
  voicingNavBtn: {
    padding: 4,
    backgroundColor: '#1E293B',
    borderRadius: 6,
  },
  voicingCountText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#38BDF8',
  },
  voicingLabelText: {
    fontSize: 11,
    color: '#94A3B8',
    marginTop: 2,
  },
  fretIndicator: {
    fontSize: 13,
    color: '#38BDF8',
    fontWeight: 'bold',
    marginBottom: 6,
  },
  nutRow: {
    flexDirection: 'row',
    width: 180,
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  nutIndicatorBox: {
    width: 24,
    alignItems: 'center',
  },
  nutIndicatorText: {
    fontSize: 13,
    fontWeight: 'bold',
    color: '#64748B',
  },
  fretboard: {
    width: 180,
    borderTopWidth: 4,
    borderTopColor: '#E2E8F0',
    borderBottomWidth: 1,
    borderBottomColor: '#475569',
    backgroundColor: '#0F172A',
    borderRadius: 2,
  },
  fretRow: {
    flexDirection: 'row',
    height: 40,
    borderBottomWidth: 1,
    borderBottomColor: '#334155',
  },
  fretStringCell: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  verticalStringLine: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    width: 1.5,
    backgroundColor: '#64748B',
  },
  fingerDot: {
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: '#F59E0B',
    zIndex: 2,
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  bassFingerDot: {
    width: 22,
    height: 22,
    borderRadius: 11,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 2,
    borderWidth: 1.5,
    borderColor: '#FFFFFF',
  },
  bassRootDot: {
    backgroundColor: '#38BDF8',
  },
  bassToneDot: {
    backgroundColor: '#F59E0B',
  },
  bassToneText: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#0F172A',
  },
  stringNamesRow: {
    flexDirection: 'row',
    width: 180,
    justifyContent: 'space-between',
    marginTop: 8,
  },
  stringNameText: {
    width: 24,
    textAlign: 'center',
    color: '#64748B',
    fontSize: 12,
    fontWeight: 'bold',
  },
  pianoNotesList: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0F172A',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 8,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#334155',
  },
  pianoNotesLabel: {
    color: '#94A3B8',
    fontSize: 12,
  },
  pianoNotesValue: {
    color: '#38BDF8',
    fontSize: 13,
    fontWeight: 'bold',
  },
  pianoKeyboardContainer: {
    width: 360,
    height: 140,
    position: 'relative',
    backgroundColor: '#0F172A',
    borderWidth: 2,
    borderColor: '#334155',
    borderRadius: 8,
    overflow: 'hidden',
  },
  pianoWhiteKeysRow: {
    flexDirection: 'row',
    width: '100%',
    height: '100%',
  },
  pianoWhiteKey: {
    flex: 1,
    backgroundColor: '#F8FAFC',
    borderRightWidth: 1,
    borderRightColor: '#94A3B8',
    justifyContent: 'flex-end',
    alignItems: 'center',
    paddingBottom: 8,
  },
  pianoWhiteKeyActive: {
    backgroundColor: '#F59E0B',
  },
  pianoWhiteKeyLabel: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#334155',
  },
  pianoKeyTextActive: {
    color: '#FFFFFF',
  },
  pianoBlackKeysOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 85,
    flexDirection: 'row',
  },
  pianoBlackKey: {
    flex: 1,
    backgroundColor: '#0F172A',
    marginHorizontal: 1.5,
    borderBottomLeftRadius: 3,
    borderBottomRightRadius: 3,
    borderWidth: 1,
    borderColor: '#334155',
    justifyContent: 'flex-end',
    alignItems: 'center',
    paddingBottom: 6,
    zIndex: 10,
  },
  pianoBlackKeyActive: {
    backgroundColor: '#F59E0B',
    borderColor: '#FCD34D',
  },
  pianoBlackKeySpacer: {
    flex: 1,
  },
  pianoBlackDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#FFFFFF',
  },
  diagramFallback: {
    padding: 20,
    alignItems: 'center',
  },
  fallbackTitle: {
    fontSize: 22,
    color: '#F8FAFC',
    fontWeight: 'bold',
  },
  fallbackDesc: {
    color: '#94A3B8',
    marginTop: 8,
    textAlign: 'center',
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
    fontSize: 13,
    marginRight: 6,
  },
  textArea: {
    height: 160,
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
    marginBottom: 16,
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