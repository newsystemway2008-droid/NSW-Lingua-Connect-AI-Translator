
import React, { useState } from 'react';
import { LANGUAGES } from '../constants';

interface OfflineModeManagerProps {
  downloadedLanguages: Set<string>;
  onDownload: (langCode: string) => void;
}

const OfflineModeManager: React.FC<OfflineModeManagerProps> = ({ downloadedLanguages, onDownload }) => {
  const [downloading, setDownloading] = useState<Set<string>>(new Set());

  const handleDownloadClick = (langCode: string) => {
    setDownloading(prev => new Set(prev).add(langCode));
    // Simulate download time
    setTimeout(() => {
      onDownload(langCode);
      setDownloading(prev => {
        const newSet = new Set(prev);
        newSet.delete(langCode);
        return newSet;
      });
    }, 1000);
  };

  return (
    <div className="mt-4 p-4 bg-gray-800/50 rounded-lg">
      <h3 className="text-lg font-semibold text-center mb-2 text-gray-300">Offline Language Packs</h3>
      <p className="text-sm text-center text-gray-400 mb-4">Download packs for basic offline phrase translation.</p>
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
        {LANGUAGES.map(lang => {
          const isDownloaded = downloadedLanguages.has(lang.code);
          const isDownloading = downloading.has(lang.code);
          return (
            <div key={lang.code} className="bg-gray-700 p-3 rounded-md flex flex-col items-center justify-between">
              <span className="text-sm font-medium mb-2">{lang.name}</span>
              <button
                onClick={() => handleDownloadClick(lang.code)}
                disabled={isDownloaded || isDownloading}
                className="w-full text-xs px-3 py-1 rounded-md transition-colors duration-200 disabled:opacity-60 disabled:cursor-not-allowed"
                style={{
                    backgroundColor: isDownloaded ? '#10B981' : isDownloading ? '#F59E0B' : '#3B82F6',
                    color: 'white'
                }}
              >
                {isDownloaded ? 'Downloaded' : isDownloading ? 'Downloading...' : 'Download'}
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default OfflineModeManager;
