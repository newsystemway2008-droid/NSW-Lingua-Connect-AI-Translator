
import { useState, useEffect, useCallback } from 'react';

let voices: SpeechSynthesisVoice[] = [];

const populateVoices = () => {
    voices = window.speechSynthesis.getVoices();
};

// Populate voices initially and on change
if (typeof window !== 'undefined' && window.speechSynthesis) {
    populateVoices();
    if (window.speechSynthesis.onvoiceschanged !== undefined) {
        window.speechSynthesis.onvoiceschanged = populateVoices;
    }
}


export const useSpeechSynthesis = () => {
  const [isSpeaking, setIsSpeaking] = useState(false);

  const speak = useCallback(({ text, lang }: { text: string; lang: string }) => {
    if (!text || typeof window === 'undefined' || !window.speechSynthesis) return;

    const utterance = new SpeechSynthesisUtterance(text);
    
    // Find the best voice for the requested language
    const voice = voices.find(v => v.lang === lang) || voices.find(v => v.lang.startsWith(lang.split('-')[0]));
    if (voice) {
      utterance.voice = voice;
    }
    utterance.lang = lang;
    
    utterance.onstart = () => setIsSpeaking(true);
    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);
    
    window.speechSynthesis.speak(utterance);
  }, []);

  useEffect(() => {
      // Cleanup: cancel any ongoing speech when the component unmounts
      return () => {
          if (typeof window !== 'undefined' && window.speechSynthesis) {
              window.speechSynthesis.cancel();
          }
      };
  }, []);

  return { speak, isSpeaking };
};
