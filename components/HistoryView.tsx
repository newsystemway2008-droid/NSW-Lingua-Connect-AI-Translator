import React, { useState, useEffect } from 'react';
import { SavedTranscript } from '../types';
import { getTranscripts, deleteTranscript as apiDeleteTranscript } from '../utils/localApi';

const CloseIcon: React.FC<{ className?: string }> = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
    </svg>
);

const TrashIcon: React.FC<{ className?: string }> = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
    </svg>
);

const BackIcon: React.FC<{ className?: string }> = ({ className }) => (
     <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
    </svg>
);

const HistoryView: React.FC<{ onClose: () => void }> = ({ onClose }) => {
    const [transcripts, setTranscripts] = useState<SavedTranscript[]>([]);
    const [selectedTranscript, setSelectedTranscript] = useState<SavedTranscript | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const loadHistory = async () => {
            try {
                setIsLoading(true);
                setError(null);
                const data = await getTranscripts();
                setTranscripts(data);
            } catch (err) {
                setError("Failed to load conversation history.");
            } finally {
                setIsLoading(false);
            }
        };
        loadHistory();
    }, []);

    const handleDelete = async (id: string, e: React.MouseEvent) => {
        e.stopPropagation(); 
        if (window.confirm("Are you sure you want to delete this conversation?")) {
            try {
                await apiDeleteTranscript(id);
                setTranscripts(prev => prev.filter(t => t.id !== id));
            } catch (err) {
                setError("Failed to delete conversation.");
            }
        }
    };
    
    const formatDate = (isoString: string) => {
        return new Date(isoString).toLocaleString();
    }

    const renderTranscriptList = () => (
        <>
            <h2 className="text-2xl font-bold text-center text-cyan-400 mb-4">Conversation History</h2>
            {isLoading && <p className="text-center text-gray-400">Loading history...</p>}
            {error && <p className="text-center text-red-400">{error}</p>}
            {!isLoading && transcripts.length === 0 && <p className="text-center text-gray-400">No saved conversations found.</p>}
            <ul className="space-y-3 overflow-y-auto max-h-[70vh]">
                {transcripts.map(t => (
                    <li key={t.id} onClick={() => setSelectedTranscript(t)} className="p-3 bg-gray-700 rounded-lg cursor-pointer hover:bg-gray-600 transition-colors duration-200 flex justify-between items-center">
                        <div>
                            <p className="font-semibold">{formatDate(t.timestamp)}</p>
                            <p className="text-sm text-gray-400 truncate max-w-xs">{t.entries[0]?.text || 'Empty conversation'}</p>
                        </div>
                        <button onClick={(e) => handleDelete(t.id, e)} className="p-2 text-red-400 hover:text-red-300 hover:bg-red-500/20 rounded-full">
                            <TrashIcon className="w-5 h-5" />
                        </button>
                    </li>
                ))}
            </ul>
        </>
    );

    const renderDetailView = (transcript: SavedTranscript) => (
        <>
            <div className="flex items-center mb-4">
                <button onClick={() => setSelectedTranscript(null)} className="p-2 text-cyan-400 hover:bg-cyan-500/20 rounded-full mr-4">
                    <BackIcon className="w-6 h-6" />
                </button>
                <h2 className="text-2xl font-bold text-cyan-400">Conversation Details</h2>
            </div>
            <p className="text-center text-gray-400 mb-4">{formatDate(transcript.timestamp)}</p>
            <div className="flex-1 bg-gray-800/50 rounded-lg p-4 overflow-y-auto flex flex-col space-y-4 max-h-[65vh]">
                {transcript.entries.map((entry, index) => (
                    <div key={index} className={`flex flex-col ${entry.speaker === 'user' ? 'items-end' : 'items-start'}`}>
                        <div className={`max-w-xs md:max-w-md lg:max-w-lg px-4 py-2 rounded-xl ${entry.speaker === 'user' ? 'bg-cyan-600 text-white rounded-br-none' : 'bg-gray-700 text-gray-200 rounded-bl-none'}`}>
                            <p className="text-sm">{entry.text}</p>
                            <p className="text-xs text-right opacity-60 mt-1">{entry.speaker === 'user' ? 'You' : 'Translation'}</p>
                        </div>
                    </div>
                ))}
            </div>
        </>
    );

    return (
        <div className="fixed inset-0 bg-black bg-opacity-70 z-50 flex items-center justify-center p-4" onClick={onClose}>
            <div className="bg-gray-800 rounded-xl shadow-2xl w-full max-w-2xl p-6 flex flex-col" onClick={e => e.stopPropagation()}>
                <button onClick={onClose} className="absolute top-4 right-4 text-gray-400 hover:text-white">
                    <CloseIcon className="w-6 h-6"/>
                </button>
                {selectedTranscript ? renderDetailView(selectedTranscript) : renderTranscriptList()}
            </div>
        </div>
    );
};

export default HistoryView;
