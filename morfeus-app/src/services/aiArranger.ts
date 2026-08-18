export type MusicStyle = 'Jazz' | 'Flamenco' | 'Arabesk' | 'NeoSoul' | 'LoFi';

export interface StyleOption {
  id: MusicStyle;
  name: string;
  desc: string;
  icon: string;
}

export const MUSIC_STYLES: StyleOption[] = [
  {
    id: 'Jazz',
    name: 'Jazz & Bossa',
    desc: 'ii-V-I yürüyüşleri, 7/9/11 tansiyonları ve tritone geçişleri',
    icon: '🎷',
  },
  {
    id: 'Flamenco',
    name: 'Flamenco',
    desc: 'Phrygian modu, Andalusian kadansı ve açık tel gerilimleri',
    icon: '💃',
  },
  {
    id: 'Arabesk',
    name: 'Arabesk / Makam',
    desc: 'Kürdi ve Hicaz yürüyüşleri, yarım ses inişleri ve askı akorları',
    icon: '🪕',
  },
  {
    id: 'NeoSoul',
    name: 'Neo-Soul / R&B',
    desc: 'Zengin maj9, m11, sus4 geçişleri ve akıcı yürüyüşler',
    icon: '🎸',
  },
  {
    id: 'LoFi',
    name: 'Lo-Fi / Chill',
    desc: 'Sakin, nostaljik 7\'li ve add9 akor kombinasyonları',
    icon: '☕',
  },
];

export async function reharmonizeWithAI(
  apiKey: string,
  title: string,
  artist: string,
  originalKey: string,
  content: string,
  style: MusicStyle
): Promise<{ newTitle: string; newContent: string; newKey: string }> {
  if (!apiKey) {
    throw new Error('Lütfen geçerli bir Gemini API anahtarı girin.');
  }

  const cleanKey = apiKey.trim();

  const prompt = `Sen profesyonel bir müzik prodüktörü, aranjör ve armoni uzmanısın.
Aşağıda verilen şarkının akorlarını müzik teorisine uygun olarak "${style}" tarzına göre yeniden armonize (re-harmonize) edeceksin.

Şarkı Bilgileri:
- Şarkı Adı: ${title}
- Sanatçı: ${artist}
- Orijinal Ton: ${originalKey}

Yeniden Armonizasyon Kuralları (${style} için):
${
  style === 'Jazz'
    ? '- Basit majör/minör akorları 7\'li, 9\'lu, 11\'li, 13\'lü, sus, alt veya dim akorlarına dönüştür. ii-V-I ve tritone substitution yürüyüşleri ekle.'
    : style === 'Flamenco'
    ? '- Phrygian modu, Andalusian kadansı (Am-G-F-E gibi), Fmaj7(#11), E(b9) gibi Flamenko gerilim akorlarını kullan.'
    : style === 'Arabesk'
    ? '- Alaturka Kürdi / Hicaz makamı hissi veren yarım ses inişler, süsleme akorları, askı (sus4) ve çözülme akorları ekle.'
    : style === 'NeoSoul'
    ? '- maj9, m11, 9sus4, add9 gibi modern, akıcı ve tatlı R&B yürüyüşleri kullan.'
    : '- Sade, nostaljik maj7, m7, add9 Lo-Fi akor yürüyüşleri kullan.'
}

KAT'İ KURALLAR:
1. Şarkı sözlerini ASLA değiştirme, hece sırasını bozma.
2. Akorların sözler üzerindeki hizalamasını ve boşluklarını TAM OLARAK KORU.
3. Çıktı olarak SADECE aşağıdaki JSON formatında yanıt ver, başka hiçbir açıklama veya markdown bloğu yazma:
{
  "newTitle": "${title} (${style} Versiyon)",
  "newKey": "${originalKey}",
  "newContent": "Yeniden düzenlenmiş akorlu şarkı metni..."
}

Orijinal Şarkı İçeriği:
${content}`;

  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.6-flash:generateContent`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-goog-api-key': cleanKey,
      },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: {
          temperature: 0.4,
          responseMimeType: 'application/json',
        },
      }),
    }
  );

  if (!response.ok) {
    const errData = await response.json().catch(() => ({}));
    throw new Error(errData.error?.message || `API Hatası (${response.status})`);
  }

  const data = await response.json();
  const rawText = data.candidates?.[0]?.content?.parts?.[0]?.text;

  if (!rawText) {
    throw new Error('Yapay zekadan yanıt alınamadı.');
  }

  const parsed = JSON.parse(rawText);
  return {
    newTitle: parsed.newTitle || `${title} (${style} Versiyon)`,
    newContent: parsed.newContent || content,
    newKey: parsed.newKey || originalKey,
  };
}