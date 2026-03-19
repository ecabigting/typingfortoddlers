// src/components/EmojiNavigator.tsx
"use client";

import { useState, useEffect, useRef, useMemo } from 'react';
import CustomKeyboard from './customKeyboard';

import SettingsModal, { GameSettings } from './SettingsModal';

export type GameObject = {
  id: number;
  objectName: string;
  emoji: string | [number, number, string];
  type: "word" | "math";
};

interface EmojiNavigatorProps {
  initialObjects: GameObject[];
};

// Emoji arrays for math problem visualization
const emojiObjectsArr = [
  "🍎",  // apple
  "🍊",  // orange
  "🍌",  // banana
  "🍇",  // grape
  "🍓",  // strawberry
  "🍉",  // watermelon
  "🥕",  // carrot
  "🥦",  // broccoli
  "🐶",  // dog
  "🐱",  // cat
  "🐰",  // bunny
  "🦁",  // lion
  "🐘",  // elephant
  "🐼",  // panda
  "🦊",  // fox (added to reach 15)
];

const emojiNumbersArr = ["0️⃣", "1️⃣", "2️⃣", "3️⃣", "4️⃣", "5️⃣", "6️⃣", "7️⃣", "8️⃣", "9️⃣"];

// Default settings
const DEFAULT_SETTINGS: GameSettings = {
  allowWords: true,
  enableMaxWordLength: true,
  maxWordLength: 3, // Changed default to 3 as requested
  allowMathProblems: true,
  mathOptions: {
    allowAddition: true,  // Changed to true as requested
    allowSubtraction: true // Changed to true as requested
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
  const [keyboardHeight, setKeyboardHeight] = useState(0);
  const previousKeyboardHeight = useRef<number>(0);
  const keyboardRef = useRef<HTMLDivElement>(null);
  
  // Keyboard should be visible only on touch devices and when settings modal is closed
  const showKeyboard = isTouchDevice && !isSettingsModalOpen;

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
        // Save defaults to localStorage in case of parse error
        localStorage.setItem('emojiGameSettings', JSON.stringify(DEFAULT_SETTINGS));
      }
    } else {
      setSettings(DEFAULT_SETTINGS);
      // Save defaults to localStorage for first-time users
      localStorage.setItem('emojiGameSettings', JSON.stringify(DEFAULT_SETTINGS));
    }
    setIsTouchDevice(typeof window !== 'undefined' && ('ontouchstart' in window || navigator.maxTouchPoints > 0));
  }, []);

  // --- Measure keyboard height for arrow positioning ---
  useEffect(() => {
    const updateKeyboardHeight = () => {
      if (keyboardRef.current) {
        const height = keyboardRef.current.offsetHeight;
        previousKeyboardHeight.current = height; // Store for faster restoration
        setKeyboardHeight(height);
      }
    };
    
    // Only measure if keyboard is shown
    if (showKeyboard) {
      updateKeyboardHeight();
    }
    
    window.addEventListener('resize', updateKeyboardHeight);
    window.addEventListener('orientationchange', updateKeyboardHeight);
    
    return () => {
      window.removeEventListener('resize', updateKeyboardHeight);
      window.removeEventListener('orientationchange', updateKeyboardHeight);
    };
  }, [isTouchDevice, showKeyboard]);

  // --- Manage keyboard height when showing/hiding ---
  useEffect(() => {
    if (!showKeyboard) {
      // Store current height before hiding and reset to 0
      previousKeyboardHeight.current = keyboardHeight;
      setKeyboardHeight(0);
    } else if (previousKeyboardHeight.current > 0) {
      // When showing, use previous height for immediate positioning
      setKeyboardHeight(previousKeyboardHeight.current);
    }
    // The main effect will remeasure actual height after render
  }, [showKeyboard]);

  // --- Function to handle settings changes and save to localStorage 
  const handleSettingsChange = (newSettings: GameSettings) => {
    setSettings(newSettings);
    localStorage.setItem('emojiGameSettings', JSON.stringify(newSettings));
  };

  // Helper function to determine if a game object is a word or math problem
  const isWordObject = (obj: GameObject): boolean => {
    return obj.type === "word";
  };

  // Helper function to determine if a math problem is addition or subtraction
  const getMathProblemType = (obj: GameObject): "addition" | "subtraction" | null => {
    if (!isWordObject(obj)) { // It's a math problem
      const emojiArr = obj.emoji as [number, number, string];
      if (emojiArr[2] === "+") {
        return "addition";
      } else if (emojiArr[2] === "-") {
        return "subtraction";
      }
    }
    return null; // Not a math problem or unknown type
  };

  // --- Effect to filter initialObjects based on settings
  useEffect(() => {

    let filtered = initialObjects;

    // Filter by allowWords and allowMathProblems
    if (!settings.allowWords || !settings.allowMathProblems) {
      filtered = filtered.filter(obj => {
        const isWord = isWordObject(obj);
        // If we don't allow words, exclude word objects
        if (!settings.allowWords && isWord) return false;
        // If we don't allow math problems, exclude math problem objects
        if (!settings.allowMathProblems && !isWord) return false;
        return true;
      });
    }

    // Further filter math problems by type if math problems are allowed
    if (settings.allowMathProblems) {
      filtered = filtered.filter(obj => {
        const isWord = isWordObject(obj);
        // Word objects pass through if we allow words
        if (isWord) {
          return settings.allowWords;
        }
        // For math problems, check the specific type
        const mathType = getMathProblemType(obj);
        if (mathType === 'addition') {
          return settings.mathOptions.allowAddition;
        } else if (mathType === 'subtraction') {
          return settings.mathOptions.allowSubtraction;
        }
        // If we can't determine the type, exclude it by default (conservative approach)
        return false;
      });
    } else {
      // If math problems are not allowed at all, filter out all math problems
      filtered = filtered.filter(obj => isWordObject(obj) && settings.allowWords);
    }

    // Apply maxWordLength filter only to word objects when enabled
    if (settings.enableMaxWordLength && settings.maxWordLength > 0) {
      filtered = filtered.filter(obj => {
        const isWord = isWordObject(obj);
        // Only apply length filter to word objects
        if (isWord) {
          return obj.objectName.length <= settings.maxWordLength;
        }
        // Math problems are not subject to word length filter
        return true;
      });
    }



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

  // Calculate vertical position for arrows (centered in space above keyboard)
  const arrowVerticalPosition = isTouchDevice
    ? `calc((100vh - ${keyboardHeight}px) / 2)`
    : '50%';

  // Stable random emoji for math problems (doesn't change on re-render)
  const mathEmoji = useMemo(() => {
    if (!activeGameObjects[currentIndex] || isWordObject(activeGameObjects[currentIndex])) {
      return null;
    }
    return emojiObjectsArr[Math.floor(Math.random() * emojiObjectsArr.length)];
  }, [activeGameObjects[currentIndex]?.id]);

  return (
    <div
      className={`flex flex-col items-center justify-center min-h-screen w-full 
               space-y-3 sm:space-y-4 md:space-y-6 lg:space-y-8 xl:space-y-10
               px-2 sm:px-4
               pb-4`}>

      {/* Gear Emoji Button (Step 1.5) - ALWAYS VISIBLE */}
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

      {/* Fixed navigation arrows */}
      <button
        onClick={showPreviousEmoji}
        className="fixed z-[60] left-4 md:left-6 lg:left-8 text-2xl sm:text-3xl p-2 sm:p-3 md:p-4 hover:opacity-70 transition-opacity"
        style={{
          top: arrowVerticalPosition,
          transform: 'translateY(-50%)'
        }}
        aria-label="Previous emoji"
      >
        ◀️
      </button>
      <button
        onClick={showNextEmoji}
        className="fixed z-[60] right-4 md:right-6 lg:right-8 text-2xl sm:text-3xl p-2 sm:p-3 md:p-4 hover:opacity-70 transition-opacity"
        style={{
          top: arrowVerticalPosition,
          transform: 'translateY(-50%)'
        }}
        aria-label="Next emoji"
      >
        ▶️
      </button>

      {/* Main Game Content */}
      {(!gameObjects || activeGameObjects.length === 0) ? (
        <p className="text-xl">No game objects to display.</p>
      ) : (
        <>
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
          <div className={`flex items-center justify-center ${isTouchDevice ? '' : ''}`}>
            <div className="flex flex-col items-center">
              {isWordObject(activeGameObjects[currentIndex]) ? (
                // WORD RENDERING
                <div className="text-6xl sm:text-8xl md:text-9xl lg:text-[120px] xl:text-[150px]">{activeGameObjects[currentIndex]?.emoji}</div>
              ) : (
                // MATH PROBLEM VISUALIZATION
                <>
                  {(() => {

                    const mathObj = activeGameObjects[currentIndex];
                    const emojiArr = mathObj?.emoji as [number, number, string];
                    const [num1, num2, operator] = emojiArr;

  return (
                      <div className="flex space-x-2">
                        {/* First number visualization */}
                        <div className="flex flex-col items-center w-[120px] sm:w-[150px]">
                          <div className="text-4xl mb-2">{emojiNumbersArr[num1]}</div>
                          <div className="flex flex-wrap gap-1 justify-center">
                            {Array.from({ length: num1 || 0 }, (_, i) => (
                              <span key={i} className="text-2xl">{mathEmoji}</span>
                            ))}
                          </div>
                        </div>
                        {/* Operator */}
                        <div className="flex flex-col items-center space-x-2">
                          <div className="text-2xl">{operator}</div>
                        </div>
                        {/* Second number visualization */}
                        <div className="flex flex-col items-center w-[120px] sm:w-[150px]">
                          <div className="text-4xl mb-2">{emojiNumbersArr[num2]}</div>
                          <div className="flex flex-wrap gap-1 justify-center">
                            {Array.from({ length: num2 || 0 }, (_, i) => (
                              <span key={i} className="text-2xl">{mathEmoji}</span>
                            ))}
                          </div>
                        </div>
                        {/* Equals sign */}
                        <div className="flex flex-col items-center space-x-2">
                          <div className="text-2xl">=</div>
                        </div>
                        {/* Result visualization (removed) */}
                      </div>
                    );
                  })()}
                </>
              )}
            </div>
          </div>

          {/* Visual Input Boxes */}
          {activeGameObjects.length > 0 && activeGameObjects[currentIndex] && (
            <div className={`flex ${isTouchDevice ? "space-x-0.5 sm:space-x-1" : "space-x-1 sm:space-x-2"} ${isShaking ? 'shake-animation' : ''}`}>
              {activeGameObjects[currentIndex]?.objectName.split("").map((_, index) => {
                let baseClasses = "pt-2 pb-2 w-10 h-12 text-center text-2xl";
                const wordLength = activeGameObjects[currentIndex]?.objectName.length || 0;
                if (wordLength > 10) {
                  baseClasses = "pt-1 pb-1 w-8 h-10 text-center text-xl";
                  if (isTouchDevice) baseClasses += " sm:w-8 sm:h-10 sm:text-xl"; else baseClasses += " sm:w-10 sm:h-12 sm:text-2xl";
                  baseClasses += " md:w-12 md:h-16 md:text-4xl lg:w-16 lg:h-20 lg:text-6xl";
                } else if (wordLength > 7) {
                  baseClasses = "pt-1 pb-1 w-9 h-11 text-center text-xl";
                  if (isTouchDevice) baseClasses += " sm:w-9 sm:h-11 sm:text-xl"; else baseClasses += " sm:w-11 sm:h-14 sm:text-2xl";
                  baseClasses += " md:w-14 md:h-18 md:text-4xl lg:w-18 lg:h-22 lg:text-6xl";
                } else {
                  if (isTouchDevice) baseClasses = "pt-2 pb-2 w-10 h-12 text-center text-2xl sm:w-10 sm:h-12 sm:text-2xl md:w-12 md:h-16 md:h-20 md:h-24 lg:h-20 lg:h-24 lg:h-24 lg:h-7xl";
                  else baseClasses = "pt-2 pb-2 w-10 h-12 text-center text-2xl sm:w-12 sm:h-16 sm:text-3xl md:w-16 md:h-20 md:h-24 lg:h-20 lg:h-24 lg:h-24 lg:h-7xl";
                }

                const isHint = index > 0 && activeGameObjects[currentIndex]?.objectName.length > 0;
                const textColor = "text-white";
                const borderStyle = isHint ? "border-b-0" : "border-b-4 md:border-b-8 border-b-orange-600";

  return (
                  <input
                    key={index} type="text" readOnly maxLength={1} value={guess[index] || ""}
                    ref={(el: HTMLInputElement | null) => { inputRefs.current[index] = el; }}
                    className={`${baseClasses} ${textColor} ${borderStyle}`}
                    aria-label={`Character ${index + 1} of ${activeGameObjects[currentIndex]?.objectName.length} ${isHint ? '(Hint)' : '(Your Guess)'}`}
                    tabIndex={-1}
                  />
                );
              })}
            </div>
          )}

          {/* Conditionally render CustomKeyboard */}
          {showKeyboard && <CustomKeyboard onKeyPress={processInput} ref={keyboardRef} />}
        </>
      )}
    </div >
  );
}
