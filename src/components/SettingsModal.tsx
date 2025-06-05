// src/components/SettingsModal.tsx
"use client";

import React from 'react';

// Define a basic structure for settings we'll implement first
export interface GameSettings {
  maxWordLength: number; // e.g., 5 means words up to 5 letters long
  enableMathProblems: boolean;
  mathOptions: {
    allowAddition: boolean;
    allowSubtraction: boolean;
  }
}

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentSettings: GameSettings;
  onSettingsChange: (newSettings: GameSettings) => void;
}

const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  currentSettings,
  onSettingsChange,
}) => {
  if (!isOpen) {
    return null;
  }

  const handleMaxWordLengthChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let value = parseInt(e.target.value, 10);
    if (isNaN(value) || value < 1) value = 1; // Min length 1
    if (value > 15) value = 15; // Max reasonable length for this game
    onSettingsChange({ ...currentSettings, maxWordLength: value });
  };

  return (
    // Modal Backdrop
    <div
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
      onClick={onClose} // Close modal if backdrop is clicked
    >
      {/* Modal Content */}
      <div
        className="bg-white dark:bg-slate-800 p-6 sm:p-8 rounded-lg shadow-xl w-full max-w-md text-slate-800 dark:text-slate-200"
        onClick={(e) => e.stopPropagation()} // Prevent click inside modal from closing it
      >
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-semibold">Game Settings</h2>
          <button
            onClick={onClose}
            className="text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 text-2xl"
            aria-label="Close settings"
          >
            × {/* Close icon */}
          </button>
        </div>

        {/* Settings Form */}
        <div className="space-y-6">
          {/* Max Word Length Setting */}
          <div>
            <label htmlFor="maxWordLength" className="block text-sm font-medium mb-1">
              Max Word Length (3-15)
            </label>
            <input
              type="number"
              id="maxWordLength"
              name="maxWordLength"
              value={currentSettings.maxWordLength}
              onChange={handleMaxWordLengthChange}
              min="3"
              max="15" // Or a higher practical limit
              className="w-full p-2 border border-slate-300 dark:border-slate-600 rounded-md dark:bg-slate-700 focus:ring-orange-500 focus:border-orange-500"
            />
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              Words will be no longer than this many letters.
            </p>
          </div>

          {/* Placeholder for future settings */}
          <div className="border-t border-slate-200 dark:border-slate-700 pt-4 mt-4">
            <p className="text-sm text-slate-500 dark:text-slate-400">More settings coming soon!</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SettingsModal;
