// src/components/EmojiNavigator.tsx

"use client";

import { useState, useEffect, useRef } from 'react';

type GameObject = {
  id: number;
  objectName: string;
  emoji: string;
};

interface EmojiNavigatorProps {
  initialObjects: GameObject[];
}

export default function EmojiNavigator({ initialObjects }: EmojiNavigatorProps) {
  const [gameObjects, setGameObjects] = useState<GameObject[]>(initialObjects);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [guess, setGuess] = useState<string[]>([]);
  const [isShaking, setIsShaking] = useState(false);
  const [showCorrectFeedback, setShowCorrectFeedback] = useState(false);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  // Effect for handling global key presses
  useEffect(() => {
    if (isShaking || showCorrectFeedback) return;

    const handleGlobalKeyDown = (event: globalThis.KeyboardEvent) => {
      if (isShaking || showCorrectFeedback) return;

      const currentWordLength = gameObjects[currentIndex]?.objectName.length || 0;
      if (currentWordLength === 0) return; // No word, nothing to guess

      if (event.key.length === 1 && event.key.match(/[a-z0-9]/i)) {
        const pressedChar = event.key.toLowerCase();
        setGuess(prevGuess => {
          // User can only fill the first letter (index 0) if it's currently empty
          if (prevGuess[0] === "") {
            const newGuess = [...prevGuess];
            newGuess[0] = pressedChar;
            return newGuess;
          }
          return prevGuess; // First letter already filled, or no empty slot (should only be index 0)
        });
        event.preventDefault();
      } else if (event.key === "Backspace") {
        setGuess(prevGuess => {
          // User can only clear the first letter (index 0) if it's filled
          if (prevGuess[0] !== "") {
            const newGuess = [...prevGuess];
            newGuess[0] = ""; // Clear only the first letter
            return newGuess;
          }
          return prevGuess; // First letter already empty
        });
        event.preventDefault();
      }
      else if (event.key === "ArrowLeft") {
        showPreviousEmoji(); // Call your existing function to show the previous emoji
        event.preventDefault(); // Prevent default browser scroll or other arrow key actions
      } else if (event.key === "ArrowRight") {
        showNextEmoji(); // Call your existing function to show the next emoji
        event.preventDefault(); // Prevent default browser scroll or other arrow key actions
      }
    };

    window.addEventListener('keydown', handleGlobalKeyDown);
    return () => {
      window.removeEventListener('keydown', handleGlobalKeyDown);
    };
  }, [isShaking, showCorrectFeedback, gameObjects, currentIndex]);

  // useEffect for init/resetting guess when current game object changes
  useEffect(() => {
    setGameObjects(initialObjects);
    let currentObjectName = "";

    if (initialObjects.length > 0 && initialObjects[currentIndex]) {
      currentObjectName = initialObjects[currentIndex].objectName;
    }

    // Initialize guess array with new hint logic
    const newGuessArray = Array(currentObjectName.length).fill("");
    if (currentObjectName.length > 0) {
      newGuessArray[0] = ""; // First letter is blank for user input
      for (let i = 1; i < currentObjectName.length; i++) {
        newGuessArray[i] = currentObjectName[i].toLowerCase(); // Rest are hints
      }
    }
    setGuess(newGuessArray);

    inputRefs.current = Array(currentObjectName.length).fill(null);
    setIsShaking(false);
    setShowCorrectFeedback(false);
  }, [initialObjects, currentIndex]);

  // useEffect for Guess Checking
  useEffect(() => {
    if (showCorrectFeedback || isShaking) return;

    const currentObject = gameObjects[currentIndex];
    if (currentObject && guess.length > 0 && guess.length === currentObject.objectName.length) {
      // The guess is complete if the first letter (user input) is filled.
      // The rest are hints, so they are always "filled" from the start.
      const isPlayerInputComplete = guess[0] !== "";

      if (isPlayerInputComplete) {
        // Construct the guessed word. The objectName's first char + rest of guess (which are hints)
        // OR ensure the full objectName is used for comparison
        const guessedWord = (guess[0] + currentObject.objectName.substring(1)).toLowerCase();
        const correctWord = currentObject.objectName.toLowerCase();

        if (guessedWord === correctWord) {
          setShowCorrectFeedback(true);
          setTimeout(() => {
            showNextEmoji();
          }, 3000);
        } else {
          setIsShaking(true);
          setTimeout(() => {
            setIsShaking(false);
            // When clearing for incorrect guess, only clear the first letter (user input)
            if (gameObjects[currentIndex]) {
              const currentObjName = gameObjects[currentIndex].objectName;
              const newGuessWithHints = Array(currentObjName.length).fill("");
              if (currentObjName.length > 0) {
                newGuessWithHints[0] = ""; // User's part is cleared
                for (let i = 1; i < currentObjName.length; i++) {
                  newGuessWithHints[i] = currentObjName[i].toLowerCase(); // Hints remain
                }
              }
              setGuess(newGuessWithHints);
            }
          }, 3000);
        }
      }
    }
  }, [guess, gameObjects, currentIndex, showCorrectFeedback, isShaking]);


  const showNextEmoji = () => {
    if (isShaking || showCorrectFeedback) return;
    if (gameObjects.length === 0) return;
    const nextIndex = (currentIndex + 1) % gameObjects.length;
    setCurrentIndex(nextIndex);
  };

  const showPreviousEmoji = () => {
    if (isShaking || showCorrectFeedback) return;
    if (gameObjects.length === 0) return;
    const prevIndex = (currentIndex - 1 + gameObjects.length) % gameObjects.length;
    setCurrentIndex(prevIndex);
  };


  if (!gameObjects || gameObjects.length === 0) {
    return <p className="text-xl">No game objects to display.</p>;
  }

  const currentObject = gameObjects[currentIndex];
  if (!currentObject) {
    return <p className="text-xl">Loading object...</p>;
  }

  return (
    <div className="flex flex-col items-center justify-center space-y-12">
      {showCorrectFeedback && (
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
      )}

      <div className="flex items-center justify-center space-x-8">
        <button
          onClick={showPreviousEmoji}
          className="text-3xl p-4 hover:opacity-70 transition-opacity"
          aria-label="Previous emoji"
          disabled={gameObjects.length <= 1 || isShaking || showCorrectFeedback}
        >
          ◀️
        </button>
        <div className="text-[150px]">
          {currentObject.emoji}
        </div>
        <button
          onClick={showNextEmoji}
          className="text-3xl p-4 hover:opacity-70 transition-opacity"
          aria-label="Next emoji"
          disabled={gameObjects.length <= 1 || isShaking || showCorrectFeedback}
        >
          ▶️
        </button>
      </div>

      <div className={`flex space-x-2 ${isShaking ? 'shake-animation' : ''}`}>
        {currentObject.objectName.split("").map((_, index) => {
          const baseClasses = "pb-10 pt-10 w-20 h-32 md:w-24 md:pt-12 md:pb-12 md:h-34 text-center text-7xl md:text-9xl";

          // Styling for the first letter (user input) vs. hints (rest of the letters)
          const isHint = index > 0 && currentObject.objectName.length > 0;

          {/* const textColor = isHint */ }
          {/*   ? "text-slate-400 dark:text-slate-500" // Dimmer color for hints */ }
          {/*   : "text-slate-700 dark:text-slate-200"; // Regular color for user input */ }
          {/* const textColor = "text-white" */ }
          const borderStyle = isHint
            ? "border-b-0" // No bottom border for hints
            : "border-b-8 border-b-orange-600"; // Bottom border for user input (first letter)

          return (
            <input
              key={index}
              type="text"
              readOnly
              maxLength={1}
              value={guess[index] || ""}
              ref={(el: HTMLInputElement | null) => { inputRefs.current[index] = el; }}
              className={`${baseClasses} ${borderStyle}`}
              aria-label={`Character ${index + 1} of ${currentObject.objectName.length} ${isHint ? '(Hint)' : '(Your Guess)'}`}
              tabIndex={-1}
            />
          );
        })}
      </div>
    </div>
  );
}
