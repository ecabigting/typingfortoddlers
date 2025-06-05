// src/components/EmojiNavigator.tsx
"use client";

import { useState, useEffect, useRef } from 'react';
import CustomKeyboard from './customKeyboard';

import SettingsModal, { GameSettings } from './SettingsModal';

type GameObject = {
  id: number;
  objectName: string;
  emoji: string;
};

interface EmojiNavigatorProps {
  initialObjects: GameObject[];
}

// Default settings
const DEFAULT_SETTINGS: GameSettings = {
  maxWordLength: 8, // Default max word length
  enableMathProblems: true,
  mathOptions: {
    allowAddition: false,
    allowSubtraction: false
  },
};

export default function EmojiNavigator({ initialObjects }: EmojiNavigatorProps) {
  const [settings, setSettings] = useState<GameSettings>(DEFAULT_SETTINGS);
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);

  const [gameObjects, setGameObjects] = useState<GameObject[]>(initialObjects);
  const [activeGameObjects, setActiveGameObjects] = useState<GameObject[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [guess, setGuess] = useState<string[]>([]);
  const [isShaking, setIsShaking] = useState(false);
  const [showCorrectFeedback, setShowCorrectFeedback] = useState(false);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);
  const [isTouchDevice, setIsTouchDevice] = useState(false);

  // --- Load settings from localStorage on mount (Step 1.2) ---
  useEffect(() => {
    const savedSettings = localStorage.getItem('emojiGameSettings'); // Use a unique key
    if (savedSettings) {
      try {
        const parsedSettings = JSON.parse(savedSettings);
        // Merge with defaults to ensure all keys are present if new settings are added later
        setSettings(prev => ({ ...DEFAULT_SETTINGS, ...parsedSettings }));
      } catch (error) {
        console.error("Error parsing saved settings:", error);
        setSettings(DEFAULT_SETTINGS);
      }
    } else {
      setSettings(DEFAULT_SETTINGS);
    }
    setIsTouchDevice(typeof window !== 'undefined' && ('ontouchstart' in window || navigator.maxTouchPoints > 0));
  }, []);

  // --- Function to handle settings changes and save to localStorage 
  const handleSettingsChange = (newSettings: GameSettings) => {
    setSettings(newSettings);
    localStorage.setItem('emojiGameSettings', JSON.stringify(newSettings));
  };

  // --- Effect to filter initialObjects based on settings
  useEffect(() => {
    let filtered = initialObjects;

    // Apply maxWordLength filter
    // Assuming 0 or a very large number in settings means "any length"
    if (settings.maxWordLength > 3 && settings.maxWordLength <= 15) { // Use the max from your input
      filtered = filtered.filter(obj => obj.objectName.length <= settings.maxWordLength);
    }
    // TODO: Add other filters here as settings are implemented (math, missing letters type)

    setActiveGameObjects(filtered);
    setCurrentIndex(0); // Reset to the first word of the new filtered list
    // Note: The guess reset for the new word will be handled by the next useEffect
  }, [initialObjects, settings]);


  // Centralized input processing logic
  const processInput = (key: string) => {
    if (isShaking || showCorrectFeedback || isSettingsModalOpen) return;

    const currentWordLength = activeGameObjects[currentIndex]?.objectName.length || 0;
    if (currentWordLength === 0) return;

    if (key.length === 1 && key.match(/[a-z0-9]/i)) { // Allow numbers too from custom OSK
      const pressedChar = key.toLowerCase();
      setGuess(prevGuess => {
        if (prevGuess[0] === "") {
          const newGuess = [...prevGuess];
          newGuess[0] = pressedChar;
          return newGuess;
        }
        return prevGuess;
      });
    } else if (key === "Backspace") {
      setGuess(prevGuess => {
        if (prevGuess[0] !== "") {
          const newGuess = [...prevGuess];
          newGuess[0] = "";
          return newGuess;
        }
        return prevGuess;
      });
    } else if (key === "ArrowLeft") {
      showPreviousEmoji();
    } else if (key === "ArrowRight") {
      showNextEmoji();
    }
  };

  // Effect for handling global key presses (physical keyboard)
  useEffect(() => {
    const handleGlobalKeyDown = (event: globalThis.KeyboardEvent) => {
      // Only process if it's not a touch device or if the OSK is not the primary input method intended for this event
      // For simplicity, we let both physical and custom OSK call processInput.
      // We preventDefault for physical keyboard to avoid double input if OSK also somehow triggers.
      processInput(event.key);
      if (["ArrowLeft", "ArrowRight", "Backspace"].includes(event.key) || (event.key.length === 1 && event.key.match(/[a-z0-9]/i))) {
        event.preventDefault();
      }
    };

    // Only add global key listener if not a touch device (or based on your preference)
    // For now, let's keep it for all, as physical keyboards can be connected to tablets
    window.addEventListener('keydown', handleGlobalKeyDown);
    return () => {
      window.removeEventListener('keydown', handleGlobalKeyDown);
    };
    // Dependencies updated to include processInput if it were not stable (it is via its own deps)
    // Key dependencies are the states that control its execution conditions.
  }, [isShaking, showCorrectFeedback, isSettingsModalOpen, activeGameObjects, currentIndex]); // processInput itself doesn't need to be a dep if its constituent parts are

  // useEffect for init/resetting guess - uses activeGameObjects
  useEffect(() => {
    let currentObjectName = "";
    if (activeGameObjects.length > 0 && activeGameObjects[currentIndex]) {
      currentObjectName = activeGameObjects[currentIndex].objectName;
    }
    const newGuessArray = Array(currentObjectName.length).fill("");
    if (currentObjectName.length > 0) {
      newGuessArray[0] = "";
      for (let i = 1; i < currentObjectName.length; i++) {
        newGuessArray[i] = currentObjectName[i].toLowerCase();
      }
    }
    setGuess(newGuessArray);
    inputRefs.current = Array(currentObjectName.length).fill(null);
    setIsShaking(false);
    setShowCorrectFeedback(false);
  }, [activeGameObjects, currentIndex]); // Depends on activeGameObjects

  // useEffect for Guess Checking
  useEffect(() => {
    if (showCorrectFeedback || isShaking || isSettingsModalOpen) return;
    const currentObject = activeGameObjects[currentIndex];
    if (currentObject && guess.length > 0 && guess.length === currentObject.objectName.length) {
      const isPlayerInputComplete = guess[0] !== "";
      if (isPlayerInputComplete) {
        const guessedWord = (guess[0] + currentObject.objectName.substring(1)).toLowerCase();
        const correctWord = currentObject.objectName.toLowerCase();
        if (guessedWord === correctWord) {
          setShowCorrectFeedback(true);
          setTimeout(() => { showNextEmoji(); }, 3000);
        } else {
          setIsShaking(true);
          setTimeout(() => {
            setIsShaking(false);
            if (activeGameObjects[currentIndex]) { // Check activeGameObjects
              const currentObjName = activeGameObjects[currentIndex].objectName;
              const newGuessWithHints = Array(currentObjName.length).fill("");
              if (currentObjName.length > 0) {
                newGuessWithHints[0] = "";
                for (let i = 1; i < currentObjName.length; i++) {
                  newGuessWithHints[i] = currentObjName[i].toLowerCase();
                }
              }
              setGuess(newGuessWithHints);
            }
          }, 500);
        }
      }
    }
  }, [guess, activeGameObjects, currentIndex, showCorrectFeedback, isShaking, isSettingsModalOpen]);

  const showNextEmoji = () => {
    if (isShaking || showCorrectFeedback || isSettingsModalOpen) return;
    if (activeGameObjects.length === 0) return;
    const nextIndex = (currentIndex + 1) % activeGameObjects.length;
    setCurrentIndex(nextIndex);
  };

  const showPreviousEmoji = () => {
    if (isShaking || showCorrectFeedback || isSettingsModalOpen) return;
    if (activeGameObjects.length === 0) return;
    const prevIndex = (currentIndex - 1 + activeGameObjects.length + activeGameObjects.length) % activeGameObjects.length; // Ensure positive for modulo
    setCurrentIndex(prevIndex);
  };

  if (!gameObjects || activeGameObjects.length === 0) {
    return <p className="text-xl">No game objects to display.</p>;
  }

  const currentObject = activeGameObjects[currentIndex];
  if (!currentObject) {
    return <p className="text-xl">Loading object...</p>;
  }

  // Determine dynamic spacing for input boxes based on word length
  const wordLength = currentObject.objectName.length;
  let inputContainerSpacingClasses = "space-x-1 sm:space-x-2"; // Default for shorter words

  // Define thresholds and corresponding spacing classes
  // These are examples, adjust them based on your visual testing and desired fit.
  if (wordLength > 10) { // For very long words (e.g., > 10 letters)
    inputContainerSpacingClasses = "space-x-0.5"; // Minimal spacing
  } else if (wordLength > 7) { // For long words (e.g., 8-10 letters)
    inputContainerSpacingClasses = "space-x-1"; // Slightly reduced spacing
  }
  // Shorter words (<= 7 letters) will use the default "space-x-1 sm:space-x-2"

  // Wait until isTouchDevice is determined before rendering the main UI
  // or calculating padding based on it.
  if (isTouchDevice === null && typeof window !== 'undefined') {
    return <p className="text-xl fixed top-0 left-0 bg-black text-white p-2 z-[9999]">Checking device type...</p>;
  }

  // useEffect(() => {
  //   // Detect if it's a touch device on component mount
  //   const touchCheck = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
  //   setIsTouchDevice(touchCheck);
  // }, []);

  // Determine dynamic layout classes 
  let mainContainerJustifyClass = "justify-center"; // Default for desktop
  let emojiBlockMarginTopClass = ""; // No specific margin-top for desktop by default
  // Default vertical spacing between content blocks for desktop
  let mainContainerSpaceYClass = "space-y-3 sm:space-y-4 md:space-y-6 lg:space-y-8 xl:space-y-10";

  if (isTouchDevice === true) { // Explicitly check for true after determination
    mainContainerJustifyClass = "justify-start"; // Align content to top on touch devices
    // Apply margin-top to the emoji block to push it down by a quarter of the screen height
    emojiBlockMarginTopClass = "mt-[25vh]"; // Adjust 25vh (25% of viewport height) as needed
  }

  return (
    <div
      className={`flex flex-col items-center ${mainContainerJustifyClass} min-h-screen w-full 
                 ${mainContainerSpaceYClass} 
                 px-2 sm:px-4  /* Added some horizontal padding for screen edges */
                 pb-4`}>

      {/* Gear Emoji Button (Step 1.5) */}
      <button
        onClick={() => setIsSettingsModalOpen(true)}
        className="fixed top-4 right-4 p-3 text-slate-600 dark:text-slate-300 hover:text-orange-500 z-[60]" // Ensure it's above modal backdrop if modal has one
        aria-label="Open settings"
      >
        <span className="text-3xl sm:text-4xl">⚙️</span> {/* Gear Emoji */}
      </button>

      {/* Settings Modal (Step 1.5) */}
      {isSettingsModalOpen && (
        <SettingsModal
          isOpen={isSettingsModalOpen}
          onClose={() => setIsSettingsModalOpen(false)}
          currentSettings={settings}
          onSettingsChange={handleSettingsChange}
        />
      )}

      {
        showCorrectFeedback && (
          <div className="correct-feedback-container">
            <div
              className="star-animation"
              style={{ textShadow: '2px 2px 8px rgba(0,0,0,0.5)' }}
            >
              ⭐
            </div>
            <div className="correct-text-animation text-3xl bg-white p-10 rounded-2xl shadow-2xl dark:bg-slate-800 dark:text-white">
              Correct!
            </div>
          </div>
        )
      }

      {/* Emoji and Navigation */}
      <div className={`flex items-center justify-center space-x-2 sm:space-x-4 md:space-x-8 ${isTouchDevice ? emojiBlockMarginTopClass : ''}`}>
        <button onClick={showPreviousEmoji} className="text-2xl sm:text-3xl p-2 sm:p-3 md:p-4 hover:opacity-70 transition-opacity" aria-label="Previous emoji" disabled={activeGameObjects.length <= 1 || isShaking || showCorrectFeedback}>◀️</button>
        <div className="text-6xl sm:text-8xl md:text-9xl lg:text-[120px] xl:text-[150px]">{currentObject.emoji}</div>
        <button onClick={showNextEmoji} className="text-2xl sm:text-3xl p-2 sm:p-3 md:p-4 hover:opacity-70 transition-opacity" aria-label="Next emoji" disabled={activeGameObjects.length <= 1 || isShaking || showCorrectFeedback}>▶️</button>
      </div>

      {/* Visual Input Boxes */}
      <div className={`flex ${isTouchDevice ? "space-x-0.5 sm:space-x-1" : "space-x-1 sm:space-x-2"} ${isShaking ? 'shake-animation' : ''}`}>
        {currentObject.objectName.split("").map((_, index) => {
          let baseClasses = "pt-2 pb-2 w-10 h-12 text-center text-2xl";
          if (wordLength > 10) {
            baseClasses = "pt-1 pb-1 w-8 h-10 text-center text-xl";
            if (isTouchDevice) baseClasses += " sm:w-8 sm:h-10 sm:text-xl"; else baseClasses += " sm:w-10 sm:h-12 sm:text-2xl";
            baseClasses += " md:w-12 md:h-16 md:text-4xl lg:w-16 lg:h-20 lg:text-6xl";
          } else if (wordLength > 7) {
            baseClasses = "pt-1 pb-1 w-9 h-11 text-center text-xl";
            if (isTouchDevice) baseClasses += " sm:w-9 sm:h-11 sm:text-xl"; else baseClasses += " sm:w-11 sm:h-14 sm:text-2xl";
            baseClasses += " md:w-14 md:h-18 md:text-4xl lg:w-18 lg:h-22 lg:text-6xl";
          } else {
            if (isTouchDevice) baseClasses = "pt-2 pb-2 w-10 h-12 text-center text-2xl sm:w-10 sm:h-12 sm:text-2xl md:w-12 md:h-16 md:text-4xl lg:w-16 lg:h-20 lg:text-5xl";
            else baseClasses = "pt-2 pb-2 w-10 h-12 text-center text-2xl sm:w-12 sm:h-16 sm:text-3xl md:w-16 md:h-20 md:text-5xl lg:w-20 lg:h-24 lg:text-7xl";
          }

          const isHint = index > 0 && currentObject.objectName.length > 0;
          const textColor = "text-white";
          const borderStyle = isHint ? "border-b-0" : "border-b-4 md:border-b-8 border-b-orange-600";

          return (
            <input
              key={index} type="text" readOnly maxLength={1} value={guess[index] || ""}
              ref={(el: HTMLInputElement | null) => { inputRefs.current[index] = el; }}
              className={`${baseClasses} ${textColor} ${borderStyle}`}
              aria-label={`Character ${index + 1} of ${currentObject.objectName.length} ${isHint ? '(Hint)' : '(Your Guess)'}`}
              tabIndex={-1}
            />
          );
        })}
      </div>

      {/* Conditionally render CustomKeyboard */}
      {isTouchDevice && <CustomKeyboard onKeyPress={processInput} />}
    </div >
  );
}
