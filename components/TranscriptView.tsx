import React, { useRef, useEffect } from 'react';
import { TranscriptEntry, ConversationStatus, AppMode } from '../types';

interface TranscriptViewProps {
  transcript: TranscriptEntry[];
  status: ConversationStatus;
  mode: AppMode;
}

const TranscriptView: React.FC<TranscriptViewProps> = ({ transcript, status, mode }) => {
  const endOfMessagesRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    endOfMessagesRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [transcript]);

  const getStatusMessage = () => {
    switch (status) {
      case ConversationStatus.CONNECTING:
        return "Microphone ready. Connecting to service...";
      case ConversationStatus.IDLE:
        return mode === AppMode.TRANSLATE 
            ? "Press the microphone to start the conversation." 
            : "Press the microphone to start dictation.";
      case ConversationStatus.ACTIVE:
          if(transcript.length === 0) return "Microphone is active. Start speaking now.";
          return null;
      default:
        return null;
    }
  };

  const statusMessage = getStatusMessage();

  return (
    <div className="flex-1 bg-gray-800/50 rounded-lg p-4 overflow-y-auto flex flex-col space-y-4">
      {transcript.length === 0 && statusMessage && (
        <div className="flex-1 flex items-center justify-center">
          <p className="text-gray-400 text-center">{statusMessage}</p>
        </div>
      )}
      {transcript.map((entry, index) => (
        <div
          key={index}
          className={`flex flex-col ${entry.speaker === 'user' ? 'items-end' : 'items-start'}`}
        >
          <div
            className={`max-w-xs md:max-w-md lg:max-w-lg px-4 py-2 rounded-xl ${
              entry.speaker === 'user'
                ? 'bg-cyan-600 text-white rounded-br-none'
                : 'bg-gray-700 text-gray-200 rounded-bl-none'
            }`}
          >
            <p className="text-sm">{entry.text}</p>
            <p className="text-xs text-right opacity-60 mt-1">{entry.speaker === 'user' ? 'You' : 'Translation'}</p>
          </div>
        </div>
      ))}
      <div ref={endOfMessagesRef} />
    </div>
  );
};

export default TranscriptView;