import React, { useState, useEffect, useRef, useCallback } from 'react';
import { GoogleGenAI, LiveSession, LiveServerMessage, Modality } from '@google/genai';
import { LANGUAGES } from './constants';
import { ConversationStatus, Language, TranscriptEntry, AppMode } from './types';
import { decode, decodeAudioData, createBlob } from './utils/audioUtils';
import { saveTranscript } from './utils/localApi';
import LanguageSelector from './components/LanguageSelector';
import TranscriptView from './components/TranscriptView';
import ControlButton from './components/ControlButton';
import OfflineModeManager from './components/OfflineModeManager';
import OfflineTranslator from './components/OfflineTranslator';
import ModeSelector from './components/ModeSelector';
import HistoryView from './components/HistoryView';

const App: React.FC = () => {
  const [status, setStatus] = useState<ConversationStatus>(ConversationStatus.IDLE);
  const [mode, setMode] = useState<AppMode>(AppMode.TRANSLATE);
  const [userLanguage, setUserLanguage] = useState<Language>(LANGUAGES[0]);
  const [peerLanguage, setPeerLanguage] = useState<Language>(LANGUAGES[1]);
  const [transcript, setTranscript] = useState<TranscriptEntry[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [isHistoryVisible, setIsHistoryVisible] = useState(false);
  const [downloadedLanguages, setDownloadedLanguages] = useState<Set<string>>(() => {
    try {
      const saved = localStorage.getItem('downloadedLanguages');
      return saved ? new Set(JSON.parse(saved)) : new Set();
    } catch (e) {
      return new Set();
    }
  });

  const sessionRef = useRef<LiveSession | null>(null);
  const inputAudioContextRef = useRef<AudioContext | null>(null);
  const outputAudioContextRef = useRef<AudioContext | null>(null);
  const scriptProcessorRef = useRef<ScriptProcessorNode | null>(null);
  const mediaStreamSourceRef = useRef<MediaStreamAudioSourceNode | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  
  const currentInputTranscriptionRef = useRef('');
  const currentOutputTranscriptionRef = useRef('');
  const transcriptRef = useRef<TranscriptEntry[]>([]);
  useEffect(() => {
    transcriptRef.current = transcript;
  }, [transcript]);
  
  const nextStartTimeRef = useRef(0);
  const outputSourcesRef = useRef<Set<AudioBufferSourceNode>>(new Set());

  useEffect(() => {
    // Proactively create AudioContexts on component mount for stability.
    // They will be resumed by a user gesture (clicking the start button).
    const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
    if (!inputAudioContextRef.current) {
      inputAudioContextRef.current = new AudioContext({ sampleRate: 16000 });
      inputAudioContextRef.current.suspend();
    }
    if (!outputAudioContextRef.current) {
      outputAudioContextRef.current = new AudioContext({ sampleRate: 24000 });
      outputAudioContextRef.current.suspend();
    }

    return () => {
      inputAudioContextRef.current?.close().catch(console.error);
      outputAudioContextRef.current?.close().catch(console.error);
    };
  }, []);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const stopAudioProcessing = useCallback(() => {
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach(track => track.stop());
      mediaStreamRef.current = null;
    }
    if (scriptProcessorRef.current) {
      scriptProcessorRef.current.disconnect();
      scriptProcessorRef.current = null;
    }
    if (mediaStreamSourceRef.current) {
      mediaStreamSourceRef.current.disconnect();
      mediaStreamSourceRef.current = null;
    }
  }, []);

  const handleStopConversation = useCallback(() => {
    setStatus(ConversationStatus.IDLE);
    if (sessionRef.current) {
      sessionRef.current.close();
      sessionRef.current = null;
    }
    stopAudioProcessing();
    outputSourcesRef.current.forEach(source => source.stop());
    outputSourcesRef.current.clear();
    nextStartTimeRef.current = 0;
  }, [stopAudioProcessing]);

  const handleStopAndSave = () => {
    if (transcriptRef.current.length > 0) {
      saveTranscript(transcriptRef.current)
        .then(() => console.log("Transcript saved successfully."))
        .catch(err => console.error("Failed to save transcript:", err));
    }
    handleStopConversation();
  };

  const handleStartConversation = async () => {
    if (status !== ConversationStatus.IDLE || !isOnline) {
      return;
    }
    
    setError(null);
    setTranscript([]);

    try {
      // 1. Resume AudioContexts on user gesture to prevent browser blocking.
      if (!inputAudioContextRef.current || !outputAudioContextRef.current) {
        throw new Error("Audio contexts not initialized. Please refresh the page.");
      }
      if (inputAudioContextRef.current.state === 'suspended') {
        await inputAudioContextRef.current.resume();
      }
      if (outputAudioContextRef.current.state === 'suspended') {
        await outputAudioContextRef.current.resume();
      }

      // 2. Request microphone access.
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaStreamRef.current = stream;
      
      // 3. Set status to connecting to trigger the useEffect for Gemini connection.
      setStatus(ConversationStatus.CONNECTING);
    } catch (err) {
      console.error(err);
      let errorMessage = "An unknown error occurred while trying to access the microphone.";
      if (err instanceof Error) {
          if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
              errorMessage = "Microphone access was denied. Please enable it in your browser settings to use this feature.";
          } else if (err.name === 'NotFoundError' || err.name === 'DevicesNotFoundError') {
              errorMessage = "No microphone found. Please connect a microphone and try again.";
          } else {
              errorMessage = `Failed to access microphone: ${err.message}`;
          }
      }
      setError(errorMessage);
      setStatus(ConversationStatus.IDLE);
    }
  };

  useEffect(() => {
    // This effect runs only when connecting and after the microphone stream has been acquired.
    if (status !== ConversationStatus.CONNECTING || !isOnline || !mediaStreamRef.current) {
      return;
    }

    let sessionPromise: Promise<LiveSession> | null = null;
    const stream = mediaStreamRef.current; 

    const startConversation = async () => {
      currentInputTranscriptionRef.current = '';
      currentOutputTranscriptionRef.current = '';

      try {
        if (!process.env.API_KEY) {
          throw new Error("API_KEY environment variable not set.");
        }
        const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
        
        const systemInstruction = mode === AppMode.TRANSLATE
          ? `You are a real-time translator. The user is speaking ${userLanguage.name}. Your task is to listen to the user and translate their speech into ${peerLanguage.name}. Only provide the spoken translation, without any additional commentary.`
          : `You are a real-time transcription service. The user is speaking ${userLanguage.name}. Your task is to listen to the user and accurately transcribe their speech into text. Do not translate or add any commentary. Simply provide the transcription.`;

        sessionPromise = ai.live.connect({
          model: 'gemini-2.5-flash-native-audio-preview-09-2025',
          config: {
            responseModalities: [Modality.AUDIO],
            inputAudioTranscription: {},
            outputAudioTranscription: {},
            systemInstruction: systemInstruction,
          },
          callbacks: {
            onopen: () => {
              setStatus(ConversationStatus.ACTIVE);
              
              if (!inputAudioContextRef.current || !stream) {
                console.error("Audio context or media stream is not ready.");
                setError("Failed to initialize audio processor.");
                handleStopConversation();
                return;
              }
              
              mediaStreamSourceRef.current = inputAudioContextRef.current.createMediaStreamSource(stream);
              scriptProcessorRef.current = inputAudioContextRef.current.createScriptProcessor(4096, 1, 1);
              
              scriptProcessorRef.current.onaudioprocess = (audioProcessingEvent) => {
                const inputData = audioProcessingEvent.inputBuffer.getChannelData(0);
                const pcmBlob = createBlob(inputData);
                if (sessionPromise) {
                  sessionPromise.then((session) => {
                    session.sendRealtimeInput({ media: pcmBlob });
                  });
                }
              };
              
              mediaStreamSourceRef.current.connect(scriptProcessorRef.current);
              scriptProcessorRef.current.connect(inputAudioContextRef.current.destination);
            },
            onmessage: async (message: LiveServerMessage) => {
              handleServerMessage(message);
            },
            onclose: () => {
              handleStopConversation();
            },
            onerror: (e) => {
              console.error(e);
              setError("An error occurred during the session. Please try again.");
              handleStopConversation();
            },
          },
        });
        
        sessionRef.current = await sessionPromise;

      } catch (err) {
        console.error(err);
        let errorMessage = `Failed to start session: ${err instanceof Error ? err.message : 'Unknown error'}`;
        setError(errorMessage);
        handleStopConversation();
      }
    };
    
    startConversation();
    
    return () => {
      handleStopConversation();
    };
  }, [status, isOnline, handleStopConversation, peerLanguage.name, userLanguage.name, mode]);
  
  const handleServerMessage = async (message: LiveServerMessage) => {
    if (mode === AppMode.DICTATE) {
      if (message.serverContent?.inputTranscription) {
        const text = message.serverContent.inputTranscription.text;
        currentInputTranscriptionRef.current += text;
        setTranscript(prev => {
          const last = prev[prev.length - 1];
          if (last?.speaker === 'user') {
            return [...prev.slice(0, -1), { ...last, text: currentInputTranscriptionRef.current }];
          }
          return [...prev, { speaker: 'user', text: currentInputTranscriptionRef.current, lang: userLanguage.code }];
        });
      }
      if (message.serverContent?.turnComplete) {
        currentInputTranscriptionRef.current = '';
      }
      // Ignore audio and output transcription in dictate mode
      return;
    }
    
    // Handle translation mode
    if (message.serverContent?.inputTranscription) {
      const text = message.serverContent.inputTranscription.text;
      currentInputTranscriptionRef.current += text;
      setTranscript(prev => {
        const last = prev[prev.length - 1];
        if (last?.speaker === 'user') {
          return [...prev.slice(0, -1), { ...last, text: currentInputTranscriptionRef.current }];
        }
        return [...prev, { speaker: 'user', text: currentInputTranscriptionRef.current, lang: userLanguage.code }];
      });
    } else if (message.serverContent?.outputTranscription) {
      const text = message.serverContent.outputTranscription.text;
      currentOutputTranscriptionRef.current += text;
      setTranscript(prev => {
        const last = prev[prev.length - 1];
        if (last?.speaker === 'peer') {
          return [...prev.slice(0, -1), { ...last, text: currentOutputTranscriptionRef.current }];
        }
        return [...prev, { speaker: 'peer', text: currentOutputTranscriptionRef.current, lang: peerLanguage.code }];
      });
    }

    if (message.serverContent?.turnComplete) {
      currentInputTranscriptionRef.current = '';
      currentOutputTranscriptionRef.current = '';
    }

    const audioData = message.serverContent?.modelTurn?.parts[0]?.inlineData?.data;
    if (audioData && outputAudioContextRef.current) {
        const oac = outputAudioContextRef.current;
        nextStartTimeRef.current = Math.max(nextStartTimeRef.current, oac.currentTime);
        const audioBuffer = await decodeAudioData(decode(audioData), oac, 24000, 1);
        const source = oac.createBufferSource();
        source.buffer = audioBuffer;
        source.connect(oac.destination);

        source.onended = () => {
          outputSourcesRef.current.delete(source);
        };

        source.start(nextStartTimeRef.current);
        nextStartTimeRef.current += audioBuffer.duration;
        outputSourcesRef.current.add(source);
    }
  };
  
  const handleSwapLanguages = () => {
    if (status === ConversationStatus.IDLE) {
      const temp = userLanguage;
      setUserLanguage(peerLanguage);
      setPeerLanguage(temp);
    }
  };
  
  const handleDownloadLanguage = (langCode: string) => {
    const newSet = new Set(downloadedLanguages);
    newSet.add(langCode);
    setDownloadedLanguages(newSet);
    localStorage.setItem('downloadedLanguages', JSON.stringify(Array.from(newSet)));
  };

  return (
    <div className="flex flex-col h-screen bg-gray-900 text-gray-100 font-sans">
      <header className="p-4 border-b border-gray-700 shadow-lg flex justify-between items-center">
        <div className="w-20"></div>
        <div className="text-center">
            <h1 className="text-2xl font-bold text-cyan-400">LinguaConnect AI</h1>
            <p className="text-gray-400">Real-time Voice Translation & Dictation</p>
        </div>
        <div className="w-20 flex justify-end">
            <button 
                onClick={() => setIsHistoryVisible(true)}
                className="px-4 py-2 text-sm font-medium bg-gray-700 text-gray-300 hover:bg-gray-600 rounded-lg transition-colors duration-200"
                aria-label="View conversation history"
            >
                History
            </button>
        </div>
      </header>

      {isHistoryVisible && <HistoryView onClose={() => setIsHistoryVisible(false)} />}

      <main className="flex-1 flex flex-col p-4 overflow-hidden">
        {!isOnline && (
            <div className="bg-yellow-500/20 border border-yellow-500 text-yellow-300 px-4 py-3 rounded-md mb-4 text-center">
                You are offline. Basic phrase translation is available for downloaded languages.
            </div>
        )}
        {(status === ConversationStatus.IDLE || !isOnline) && (
           <div className="flex flex-col items-center justify-center gap-4 my-4">
               <ModeSelector mode={mode} setMode={setMode} disabled={status !== ConversationStatus.IDLE} />
               <div className="flex flex-col md:flex-row items-center justify-center gap-4 mt-2">
                    <LanguageSelector
                        label="Your Language"
                        selectedLanguage={userLanguage}
                        onSelect={setUserLanguage}
                        options={LANGUAGES}
                    />
                    {mode === AppMode.TRANSLATE && (
                        <>
                            <button
                                onClick={handleSwapLanguages}
                                className="p-2 rounded-full bg-gray-700 hover:bg-cyan-500 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                                aria-label="Swap languages"
                                disabled={status !== ConversationStatus.IDLE}
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
                                </svg>
                            </button>
                            <LanguageSelector
                                label="Their Language"
                                selectedLanguage={peerLanguage}
                                onSelect={setPeerLanguage}
                                options={LANGUAGES}
                            />
                        </>
                    )}
                </div>
           </div>
        )}
        
        {error && <div className="bg-red-500/20 border border-red-500 text-red-300 px-4 py-3 rounded-md mb-4 text-center">{error}</div>}

        {isOnline ? (
            <TranscriptView transcript={transcript} status={status} mode={mode} />
        ) : (
            <OfflineTranslator
                userLanguage={userLanguage}
                peerLanguage={peerLanguage}
                downloadedLanguages={downloadedLanguages}
            />
        )}
        
        {status === ConversationStatus.IDLE && isOnline && (
            <OfflineModeManager
                downloadedLanguages={downloadedLanguages}
                onDownload={handleDownloadLanguage}
            />
        )}
      </main>

      <footer className="p-4 flex justify-center items-center border-t border-gray-700">
        <ControlButton status={status} onStart={handleStartConversation} onStop={handleStopAndSave} isOnline={isOnline} />
      </footer>
    </div>
  );
};

export default App;