// src/components/SettingsModal.tsx
"use client";

import React from 'react';

// Define a basic structure for settings we'll implement first
export interface GameSettings {
  allowWords: boolean;
  enableMaxWordLength: boolean;
  maxWordLength: number;
  allowMathProblems: boolean;
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

  const handleAllowWordsChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onSettingsChange({
      ...currentSettings,
      allowWords: e.target.checked,
    });
  };

  const handleEnableMaxWordLengthChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onSettingsChange({
      ...currentSettings,
      enableMaxWordLength: e.target.checked,
    });
  };

  const handleMaxWordLengthChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let value = parseInt(e.target.value, 10);
    if (isNaN(value) || value < 1) value = 1; // Min length 1
    if (value > 15) value = 15; // Max reasonable length for this game
    onSettingsChange({
      ...currentSettings,
      maxWordLength: value,
    });
  };

  const handleAllowAdditionChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onSettingsChange({
      ...currentSettings,
      mathOptions: {
        ...currentSettings.mathOptions,
        allowAddition: e.target.checked,
      }
    });
  };

  const handleAllowSubtractionChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onSettingsChange({
      ...currentSettings,
      mathOptions: {
        ...currentSettings.mathOptions,
        allowSubtraction: e.target.checked,
      }
    });
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
          {/* Allow Words Setting */}
          <div>
            <label htmlFor="allowWords" className="block text-sm font-medium mb-1 flex items-center">
              <input
                type="checkbox"
                id="allowWords"
                checked={currentSettings.allowWords}
                onChange={handleAllowWordsChange}
                className="h-4 w-4 text-orange-600 border-gray-300 rounded focus:ring-orange-500"
              />
              <span className="ml-2">Allow Words</span>
            </label>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 ml-4">
              When enabled, word objects will be included in the game.
            </p>
          </div>

          {/* Max Word Length Setting (sub-setting under Allow Words) - ALWAYS VISIBLE */}
          <div className="ml-6 pl-4">
            <div>
              <label htmlFor="enableMaxWordLength" className="block text-sm font-medium mb-1 flex items-center">
                <input
                  type="checkbox"
                  id="enableMaxWordLength"
                  checked={currentSettings.enableMaxWordLength}
                  onChange={handleEnableMaxWordLengthChange}
                  className="h-4 w-4 text-orange-600 border-gray-300 rounded focus:ring-orange-500"
                  disabled={!currentSettings.allowWords}
                />
                <span className="ml-2">Enable Max Word Length</span>
              </label>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 ml-4">
                When enabled, words will be limited to the specified maximum length.
              </p>
            </div>

            {/* Max Word Length Input (sub-sub-setting) - ALWAYS VISIBLE */}
            <div className="mt-2 ml-4">
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
                max="15"
                className="w-full p-2 border border-slate-300 dark:border-slate-600 rounded-md dark:bg-slate-700 focus:ring-orange-500 focus:border-orange-500"
                disabled={!currentSettings.allowWords || !currentSettings.enableMaxWordLength}
              />
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                Words will be no longer than this many letters.
              </p>
            </div>
          </div>

          {/* Allow Math Problems Setting - ALWAYS VISIBLE */}
          <div>
            <label htmlFor="allowMathProblems" className="block text-sm font-medium mb-1 flex items-center">
              <input
                type="checkbox"
                id="allowMathProblems"
                checked={currentSettings.allowMathProblems}
                onChange={(e) => onSettingsChange({ ...currentSettings, allowMathProblems: e.target.checked })}
                className="h-4 w-4 text-orange-600 border-gray-300 rounded focus:ring-orange-500"
              />
              <span className="ml-2">Allow Math Problems</span>
            </label>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 ml-4">
              When enabled, math problem objects will be included in the game.
            </p>
          </div>

          {/* Math Options (sub-settings under Allow Math Problems) - ALWAYS VISIBLE */}
          <div className="ml-6 pl-4">
            {/* Allow Addition */}
            <div>
              <label htmlFor="allowAddition" className="block text-sm font-medium mb-1 flex items-center">
                <input
                  type="checkbox"
                  id="allowAddition"
                  checked={currentSettings.mathOptions.allowAddition}
                  onChange={handleAllowAdditionChange}
                  className="h-4 w-4 text-orange-600 border-gray-300 rounded focus:ring-orange-500"
                  disabled={!currentSettings.allowMathProblems}
                />
                <span className="ml-2">Allow Addition</span>
              </label>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 ml-4">
                When enabled, addition math problems will be included.
              </p>
            </div>

            {/* Allow Subtraction */}
            <div className="mt-2">
              <label htmlFor="allowSubtraction" className="block text-sm font-medium mb-1 flex items-center">
                <input
                  type="checkbox"
                  id="allowSubtraction"
                  checked={currentSettings.mathOptions.allowSubtraction}
                  onChange={handleAllowSubtractionChange}
                  className="h-4 w-4 text-orange-600 border-gray-300 rounded focus:ring-orange-500"
                  disabled={!currentSettings.allowMathProblems}
                />
                <span className="ml-2">Allow Subtraction</span>
              </label>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 ml-4">
                When enabled, subtraction math problems will be included.
              </p>
            </div>
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