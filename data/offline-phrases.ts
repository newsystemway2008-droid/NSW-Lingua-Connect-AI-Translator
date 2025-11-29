
// Canonical key is the English uppercase word
export const OFFLINE_TRANSLATIONS: Record<string, { [langCode: string]: string }> = {
  "HELLO": {
    "en-US": "Hello", "es-ES": "Hola", "fr-FR": "Bonjour", "de-DE": "Hallo",
    "it-IT": "Ciao", "ja-JP": "こんにちは", "ko-KR": "안녕하세요", "pt-BR": "Olá",
    "ru-RU": "Здравствуйте", "zh-CN": "你好", "hi-IN": "नमस्ते", "ar-SA": "مرحبا", "bn-BD": "হ্যালো",
  },
  "GOODBYE": {
    "en-US": "Goodbye", "es-ES": "Adiós", "fr-FR": "Au revoir", "de-DE": "Auf Wiedersehen",
    "it-IT": "Arrivederci", "ja-JP": "さようなら", "ko-KR": "안녕히 가세요", "pt-BR": "Adeus",
    "ru-RU": "До свидания", "zh-CN": "再见", "hi-IN": "अलविदा", "ar-SA": "وداعا", "bn-BD": "বিদায়",
  },
  "THANK_YOU": {
    "en-US": "Thank you", "es-ES": "Gracias", "fr-FR": "Merci", "de-DE": "Danke",
    "it-IT": "Grazie", "ja-JP": "ありがとう", "ko-KR": "감사합니다", "pt-BR": "Obrigado",
    "ru-RU": "Спасибо", "zh-CN": "谢谢", "hi-IN": "धन्यवाद", "ar-SA": "شكرا", "bn-BD": "ধন্যবাদ",
  },
  "HOW_ARE_YOU": {
    "en-US": "How are you?", "es-ES": "¿Cómo estás?", "fr-FR": "Comment ça va?", "de-DE": "Wie geht es Ihnen?",
    "it-IT": "Come stai?", "ja-JP": "お元気ですか", "ko-KR": "잘 지내세요?", "pt-BR": "Como você está?",
    "ru-RU": "Как дела?", "zh-CN": "你好吗?", "hi-IN": "आप कैसे हैं?", "ar-SA": "كيف حالك؟", "bn-BD": "আপনি কেমন আছেন?",
  },
  "YES": {
    "en-US": "Yes", "es-ES": "Sí", "fr-FR": "Oui", "de-DE": "Ja",
    "it-IT": "Sì", "ja-JP": "はい", "ko-KR": "예", "pt-BR": "Sim",
    "ru-RU": "Да", "zh-CN": "是", "hi-IN": "हाँ", "ar-SA": "نعم", "bn-BD": "হ্যাঁ",
  },
  "NO": {
    "en-US": "No", "es-ES": "No", "fr-FR": "Non", "de-DE": "Nein",
    "it-IT": "No", "ja-JP": "いいえ", "ko-KR": "아니요", "pt-BR": "Não",
    "ru-RU": "Нет", "zh-CN": "不是", "hi-IN": "नहीं", "ar-SA": "لا", "bn-BD": "না",
  },
};

// Generate a reverse lookup table for easier searching
// { "en-US": { "hello": "HELLO" }, "es-ES": { "hola": "HELLO" } }
export const REVERSE_PHRASE_LOOKUP: Record<string, Record<string, string>> = {};

for (const key in OFFLINE_TRANSLATIONS) {
  const translations = OFFLINE_TRANSLATIONS[key];
  for (const langCode in translations) {
    if (!REVERSE_PHRASE_LOOKUP[langCode]) {
      REVERSE_PHRASE_LOOKUP[langCode] = {};
    }
    const phrase = translations[langCode].toLowerCase();
    REVERSE_PHRASE_LOOKUP[langCode][phrase] = key;
  }
}
