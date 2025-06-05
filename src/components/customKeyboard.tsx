// src/components/CustomKeyboard.tsx
"use client";

import React from 'react';

interface CustomKeyboardProps {
  onKeyPress: (key: string) => void; // Callback for when a key is pressed
}

const CustomKeyboard: React.FC<CustomKeyboardProps> = ({ onKeyPress }) => {
  // Define key layouts
  const numRow = "1234567890".split("");
  const row1 = "qwertyuiop".split("");
  const row2 = "asdfghjkl".split("");
  const row3 = "zxcvbnm".split("");

  const renderKey = (key: string) => (
    <button
      key={key}
      onClick={() => onKeyPress(key)}
      // Basic styling for keys - make them large and touch-friendly
      // Adjust padding, margin, font-size, background, etc., as needed for your design
      className="m-1 p-2 sm:p-3 md:p-4 bg-slate-200 dark:bg-slate-700 rounded-md text-lg sm:text-xl md:text-2xl font-semibold hover:bg-slate-300 dark:hover:bg-slate-600 focus:outline-none focus:ring-2 focus:ring-orange-500 active:bg-slate-400 dark:active:bg-slate-500 min-w-[30px] sm:min-w-[40px] flex-grow basis-0 text-center"
    >
      {key.toUpperCase()}
    </button>
  );

  return (
    // Keyboard container
    // Fixed at the bottom, full width, with some padding
    <div className="fixed bottom-0 left-0 right-0 bg-slate-100 dark:bg-slate-800 p-2 sm:p-3 shadow-lg">
      <div className="max-w-xl mx-auto flex flex-col space-y-1">
        {/* Number Row - optional, you specified 1-9, I included 0 for completeness */}
        <div className="flex justify-center">
          {numRow.map(renderKey)}
        </div>
        {/* Letter Rows */}
        <div className="flex justify-center w-full">
          {row1.map(renderKey)}
        </div>
        <div className="flex justify-center w-full">
          {row2.map(renderKey)}
        </div>
        <div className="flex justify-center w-full">
          {/* Consider adding a small spacer for offset rows if desired */}
          {/* <div className="w-[5%]"></div>  Example spacer */}
          {row3.map(renderKey)}
          {/* Backspace Key */}
          <button
            onClick={() => onKeyPress("Backspace")}
            className="m-1 p-2 sm:p-3 md:p-4 bg-slate-300 dark:bg-slate-600 rounded-md text-lg sm:text-xl md:text-2xl font-semibold hover:bg-slate-400 dark:hover:bg-slate-500 focus:outline-none focus:ring-2 focus:ring-orange-500 active:bg-slate-500 dark:active:bg-slate-400 min-w-[50px] sm:min-w-[70px] flex-grow-[1.5] basis-0 text-center"
          >
            ⌫ {/* Backspace symbol */}
          </button>
        </div>
      </div>
    </div>
  );
};

export default CustomKeyboard;
