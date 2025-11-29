
import React, { useState, useMemo } from 'react';
import { Language } from '../types';
import { OFFLINE_TRANSLATIONS, REVERSE_PHRASE_LOOKUP } from '../data/offline-phrases';
import { useSpeechSynthesis } from '../hooks/useSpeechSynthesis';

interface OfflineTranslatorProps {
  userLanguage: Language;
  peerLanguage: Language;
  downloadedLanguages: Set<string>;
}

const SpeakIcon: React.FC<{className?: string}> = ({className}) => (
    <svg xmlns="http://www.w3.org/2000/svg" className={className} viewBox="0 0 24 24" fill="currentColor">
        <path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z"></path>
    </svg>
);


const OfflineTranslator: React.FC<OfflineTranslatorProps> = ({ userLanguage, peerLanguage, downloadedLanguages }) => {
  const [inputText, setInputText] = useState('');
  const [translatedText, setTranslatedText] = useState('');
  const { speak, isSpeaking } = useSpeechSynthesis();

  const areLangsAvailable = useMemo(() => {
    return downloadedLanguages.has(userLanguage.code) && downloadedLanguages.has(peerLanguage.code);
  }, [downloadedLanguages, userLanguage, peerLanguage]);

  const handleTranslate = (text: string) => {
    setInputText(text);
    if (!text.trim()) {
      setTranslatedText('');
      return;
    }
    
    const phraseKey = REVERSE_PHRASE_LOOKUP[userLanguage.code]?.[text.trim().toLowerCase()];
    if (phraseKey && OFFLINE_TRANSLATIONS[phraseKey]) {
      const translation = OFFLINE_TRANSLATIONS[phraseKey][peerLanguage.code];
      setTranslatedText(translation || 'Translation not found for this phrase.');
    } else {
      setTranslatedText('Translation not found for this phrase.');
    }
  };

  if (!areLangsAvailable) {
    return (
      <div className="flex-1 bg-gray-800/50 rounded-lg p-4 flex items-center justify-center">
        <div className="text-center">
            <h3 className="text-lg font-semibold text-gray-300">Offline Mode</h3>
            <p className="text-gray-400 mt-2">
                To use offline translation, please download the language packs for both <span className="font-bold text-cyan-400">{userLanguage.name}</span> and <span className="font-bold text-cyan-400">{peerLanguage.name}</span> when you are online.
            </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 bg-gray-800/50 rounded-lg p-4 flex flex-col space-y-4">
        <h3 className="text-lg font-semibold text-center text-gray-300">Offline Phrase Translator</h3>
        <div className="flex-1 flex flex-col gap-4">
            <div>
                <label className="block mb-2 text-sm font-medium text-gray-400">Your phrase ({userLanguage.name})</label>
                <input
                    type="text"
                    value={inputText}
                    onChange={(e) => handleTranslate(e.target.value)}
                    placeholder="Type a common phrase..."
                    className="bg-gray-700 border border-gray-600 text-white text-md rounded-lg focus:ring-cyan-500 focus:border-cyan-500 block w-full p-2.5"
                />
            </div>
            <div>
                <label className="block mb-2 text-sm font-medium text-gray-400">Translation ({peerLanguage.name})</label>
                <div className="bg-gray-900/50 p-4 rounded-lg min-h-[50px] flex items-center justify-between">
                    <p className="text-lg text-cyan-300">{translatedText}</p>
                    {translatedText && (
                        <button
                            onClick={() => speak({ text: translatedText, lang: peerLanguage.code })}
                            disabled={isSpeaking}
                            className="p-2 rounded-full bg-cyan-600 hover:bg-cyan-500 disabled:bg-gray-500"
                            aria-label="Speak translation"
                        >
                            <SpeakIcon className="w-5 h-5 text-white" />
                        </button>
                    )}
                </div>
            </div>
        </div>
         <p className="text-xs text-center text-gray-500 mt-auto">Note: Offline mode only supports a limited set of common phrases.</p>
    </div>
  );
};

export default OfflineTranslator;
