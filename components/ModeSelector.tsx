
import React from 'react';
import { AppMode } from '../types';

interface ModeSelectorProps {
  mode: AppMode;
  setMode: (mode: AppMode) => void;
  disabled: boolean;
}

const ModeSelector: React.FC<ModeSelectorProps> = ({ mode, setMode, disabled }) => {
  const commonButtonClasses = 'px-4 py-2 text-sm font-medium transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:ring-offset-2 focus:ring-offset-gray-900 disabled:opacity-50 disabled:cursor-not-allowed';
  const activeButtonClasses = 'bg-cyan-600 text-white';
  const inactiveButtonClasses = 'bg-gray-700 text-gray-300 hover:bg-gray-600';

  return (
    <div className="flex justify-center p-1 bg-gray-800 rounded-lg" role="radiogroup">
      <button
        onClick={() => setMode(AppMode.TRANSLATE)}
        disabled={disabled}
        role="radio"
        aria-checked={mode === AppMode.TRANSLATE}
        className={`${commonButtonClasses} rounded-l-md ${mode === AppMode.TRANSLATE ? activeButtonClasses : inactiveButtonClasses}`}
      >
        Translate
      </button>
      <button
        onClick={() => setMode(AppMode.DICTATE)}
        disabled={disabled}
        role="radio"
        aria-checked={mode === AppMode.DICTATE}
        className={`${commonButtonClasses} rounded-r-md ${mode === AppMode.DICTATE ? activeButtonClasses : inactiveButtonClasses}`}
      >
        Dictate
      </button>
    </div>
  );
};

export default ModeSelector;
