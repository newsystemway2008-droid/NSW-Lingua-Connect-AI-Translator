
import React from 'react';
import { ConversationStatus } from '../types';

interface ControlButtonProps {
  status: ConversationStatus;
  onStart: () => void;
  onStop: () => void;
  isOnline: boolean;
}

const MicrophoneIcon: React.FC<{className?: string}> = ({className}) => (
    <svg xmlns="http://www.w3.org/2000/svg" className={className} viewBox="0 0 24 24" fill="currentColor">
        <path d="M12 14c1.66 0 2.99-1.34 2.99-3L15 5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3z"></path>
        <path d="M17 11h-1c0 2.76-2.24 5-5 5s-5-2.24-5-5H5c0 3.53 2.61 6.43 6 6.92V21h2v-3.08c3.39-.49 6-3.39 6-6.92z"></path>
    </svg>
);

const StopIcon: React.FC<{className?: string}> = ({className}) => (
     <svg xmlns="http://www.w3.org/2000/svg" className={className} viewBox="0 0 24 24" fill="currentColor">
        <path d="M6 6h12v12H6z"></path>
    </svg>
);


const ControlButton: React.FC<ControlButtonProps> = ({ status, onStart, onStop, isOnline }) => {
    const isIdle = status === ConversationStatus.IDLE;
    const isConnecting = status === ConversationStatus.CONNECTING;
    const isActive = status === ConversationStatus.ACTIVE;

    const baseClasses = "rounded-full flex items-center justify-center transition-all duration-300 ease-in-out shadow-lg";
    const sizeClasses = "w-20 h-20";

    if (isIdle) {
        return (
            <button
                onClick={onStart}
                disabled={!isOnline}
                className={`${baseClasses} ${sizeClasses} ${!isOnline ? 'bg-gray-600 cursor-not-allowed' : 'bg-cyan-500 hover:bg-cyan-400'} text-white`}
                aria-label={isOnline ? "Start conversation" : "Conversation unavailable offline"}
            >
                <MicrophoneIcon className="w-10 h-10" />
            </button>
        );
    }
    
    if (isConnecting) {
        return (
            <div
                className={`${baseClasses} ${sizeClasses} bg-yellow-500 text-white animate-pulse`}
                aria-label="Connecting..."
            >
                 <svg className="animate-spin h-10 w-10 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
            </div>
        )
    }

    if (isActive) {
        return (
            <button
                onClick={onStop}
                className={`${baseClasses} ${sizeClasses} bg-red-600 hover:bg-red-500 text-white relative`}
                aria-label="Stop conversation"
            >
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                <StopIcon className="w-8 h-8 relative"/>
            </button>
        );
    }

    return null;
};

export default ControlButton;
