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

      if (event.key.length === 1 && event.key.match(/[a-z]/i)) {
        const pressedChar = event.key.toLowerCase();
        setGuess(prevGuess => {
          // Determine the actual first empty slot for user input,
          // considering the hint at index 0.
          let activeIndex = -1;
          for (let i = 0; i < prevGuess.length; i++) {
            if (prevGuess[i] === "") {
              // If it's the first slot (index 0) and it's supposed to be a hint
              // and the word has more than one character, this isn't the active slot for user input.
              // User should start typing from index 1.
              // However, if word is 1 char long, index 0 is the only slot.
              // This logic means user can't overwrite the hint if word > 1 char.
              if (i === 0 && currentWordLength > 1) continue; // Skip index 0 if it's a hint for a multi-char word

              activeIndex = i;
              break;
            }
          }

          // If the word is 1 char long, and it's already filled (by the hint), do nothing.
          if (currentWordLength === 1 && prevGuess[0] !== "" && activeIndex === -1) {
            return prevGuess;
          }


          if (activeIndex !== -1) {
            const newGuess = [...prevGuess];
            newGuess[activeIndex] = pressedChar;
            return newGuess;
          }
          return prevGuess;
        });
        event.preventDefault();
      } else if (event.key === "Backspace") {
        setGuess(prevGuess => {
          let indexToClear = -1;
          // Find the last filled character that is NOT the hint at index 0
          // (unless the word is only 1 character long, in which case nothing happens).
          for (let i = prevGuess.length - 1; i >= 1; i--) { // Start checking from index 1 backwards
            if (prevGuess[i] !== "") {
              indexToClear = i;
              break;
            }
          }

          if (indexToClear !== -1) { // If a user-typed character (index >= 1) is found
            const newGuess = [...prevGuess];
            newGuess[indexToClear] = "";
            return newGuess;
          }
          return prevGuess; // No user-typed character to delete
        });
        event.preventDefault();
      }
    };

    window.addEventListener('keydown', handleGlobalKeyDown);
    return () => {
      window.removeEventListener('keydown', handleGlobalKeyDown);
    };
    // Add gameObjects and currentIndex because currentWordLength is derived from them
  }, [isShaking, showCorrectFeedback, gameObjects, currentIndex]);

  // useEffect for init/resetting guess when current game object changes
  useEffect(() => {
    setGameObjects(initialObjects); // This might be redundant if initialObjects never changes post-mount
    let currentObjectName = "";
    let firstLetter = "";

    if (initialObjects.length > 0 && initialObjects[currentIndex]) {
      currentObjectName = initialObjects[currentIndex].objectName;
      if (currentObjectName.length > 0) {
        firstLetter = currentObjectName[0].toLowerCase(); // Get the first letter for the hint
      }
    }

    // Initialize guess array
    const newGuessArray = Array(currentObjectName.length).fill("");
    if (currentObjectName.length > 0) {
      newGuessArray[0] = firstLetter; // Set the first letter as a hint
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
    // Ensure guess array is initialized for the current word length
    if (currentObject && guess.length > 0 && guess.length === currentObject.objectName.length) {
      const isGuessComplete = guess.every(char => char !== "");

      if (isGuessComplete) {
        const guessedWord = guess.join('').toLowerCase();
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
            // When clearing for incorrect guess, reinstate the hint
            if (gameObjects[currentIndex]) {
              const currentObjName = gameObjects[currentIndex].objectName;
              const newGuessWithHint = Array(currentObjName.length).fill("");
              if (currentObjName.length > 0) {
                newGuessWithHint[0] = currentObjName[0].toLowerCase();
              }
              setGuess(newGuessWithHint);
            }
          }, 500);
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
          // Define common base classes for all input elements
          const baseClasses = "pb-10 pt-10 w-20 h-32 md:w-24 md:pt-12 md:pb-12 md:h-34 text-center text-7xl md:text-9xl";

          // Define text color classes - now the same for hint and user input
          const textColor = "text-slate-700 dark:text-slate-200"; // Assuming this is the desired uniform color

          // Define border classes: no bottom border for the hint, regular border for others
          const borderStyle = (index === 0 && currentObject.objectName.length > 0)
            ? "border-b-0" // No bottom border for the hint
            : "border-b-8 border-b-orange-600"; // Bottom border for user-typed characters

          return (
            <input
              key={index} // Unique key for each input element
              type="text" // Input type
              readOnly // Input is not directly editable by user
              maxLength={1} // Allow only a single character
              value={guess[index] || ""} // Controlled component, value from 'guess' state
              ref={(el: HTMLInputElement | null) => { inputRefs.current[index] = el; }} // Ref for potential direct manipulation (though not primary interaction)
              className={`${baseClasses} ${textColor} ${borderStyle}`} // Dynamically assembled Tailwind classes
              aria-label={`Character ${index + 1} of ${currentObject.objectName.length} ${index === 0 && currentObject.objectName.length > 0 ? '(Hint)' : ''}`} // Accessibility label
              tabIndex={-1} // Remove from tab order as it's not directly interactive
            />
          );
        })}
      </div>
    </div>
  );
}
