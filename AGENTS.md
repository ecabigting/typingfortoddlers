# typingfortoddlers - Project Documentation

## Overview
`typingfortoddlers` is an educational typing game designed for toddlers to learn keyboard skills through emoji-based object recognition. The game presents emojis representing objects (animals, food, vehicles, etc.) and math problems, and children type the corresponding word or solution.

## Key Features
- **Emoji-Based Learning**: Uses visual emojis to represent words and math problems
- **Interactive Typing**: Children type using physical or on-screen keyboard
- **Immediate Feedback**: Visual celebrations for correct answers, shake animation for incorrect
- **Customizable Settings**: Hierarchical checkbox system to filter content:
  - Allow Words (master toggle)
    - Enable Max Word Length (sub-setting)
      - Max Word Length (input, active when both above checked)
  - Allow Math Problems (master toggle)
    - Allow Addition (sub-setting)
    - Allow Subtraction (sub-setting)
- **Persistence**: All settings saved to browser localStorage
- **Responsive Design**: Works on desktop and touch devices (on-screen keyboard appears on touch)
- **Accessibility**: ARIA labels, proper tab indices, and visual feedback

## File Structure
```
typingfortoddlers/
├── src/
│   ├── app/
│   │   ├── layout.tsx      # Root layout with fonts and metadata
│   │   └── page.tsx        # Home page - loads and shuffles game objects
│   ├── components/
│   │   ├── emojiNavigator.tsx    # Main game component (handles game state, input, filtering)
│   │   ├── customKeyboard.tsx    # On-screen keyboard for touch devices
│   │   └── SettingsModal.tsx     # Settings UI with hierarchical checkboxes
│   └── game-object.json    # Game data: 200+ objects with id, objectName, emoji
├── public/                 # Static assets (empty in this project)
├── .gitignore
├── next.config.ts
├── package.json
├── postcss.config.mjs
├── README.md
├── tsconfig.json
└── AGENTS.md               # This file
```

## How to Run
1. Install dependencies: `npm install`
2. Start development server: `npm run dev`
3. Build for production: `npm run build`
4. Start production server: `npm run start`

## Important Implementation Details

### State Management
- Uses React hooks (`useState`, `useEffect`) for all state management
- Game state includes: settings, game objects, active filtered objects, current index, user guess, feedback states

### Settings Persistence
- Settings loaded from localStorage on app initialization (`emojiGameSettings` key)
- If no saved settings, DEFAULT_SETTINGS are used AND saved to localStorage
- All settings changes immediately update localStorage via `handleSettingsChange`

### Filtering Logic (in emojiNavigator.tsx)
1. **Word vs Math Detection**:
   - `isWordObject()`: Returns true for actual words (non-digit-only or no math symbols)
   - Math problems: digit-only objectName AND emoji contains +, -, or =

2. **Three-Stage Filtering**:
   - Stage 1: Filter by master toggles (allowWords, allowMathProblems)
   - Stage 2: If math allowed, filter by type (allowAddition, allowSubtraction)
   - Stage 3: If word length enabled, apply maxWordLength filter ONLY to word objects

3. **Helper Functions**:
   - `isWordObject(obj)`: Determines if object is word or math problem
   - `getMathProblemType(obj)`: Returns 'addition', 'subtraction', or null

### UI Components
- **EmojiNavigator**: Main game loop
  - Handles keyboard input (physical and on-screen)
  - Manages game state and feedback
  - Renders emoji, navigation buttons, input boxes
  - Conditionally renders CustomKeyboard on touch devices
- **CustomKeyboard**: Touch-optimized keyboard (a-z, 0-9, backspace)
- **SettingsModal**: Hierarchical settings UI with disabled states for sub-settings

### Visual Feedback
- Correct answer: Star animation + "Correct!" text animation
- Incorrect answer: Input box shake animation + reset to hints
- Touch detection: Shows on-screen keyboard when touch device detected

### Responsive Design
- Uses Tailwind CSS for responsive layouts
- Adjusts spacing and sizing based on word length and screen size
- Different layouts for desktop vs touch devices

## Known Issues / TODOs
- [ ] Math problem filtering could be enhanced to detect specific math types more robustly
- [ ] Add sound effects for feedback
- [ ] Add difficulty levels or progression system
- [ ] Add more math problem types (multiplication, division)
- [ ] Add option to show/hide hints
- [ ] Add scoring or streak tracking

## Design Decisions
1. **Always-Visible Settings Gear**: The gear button (top-right) remains visible even when no game objects match filters, ensuring users can always adjust settings.
2. **Hierarchical Settings**: Sub-settings are visually indented and disabled when parents unchecked to prevent confusion.
3. **Default Settings**: Chosen to provide immediate gameplay experience with simple 3-letter words and both math types enabled.
4. **LocalStorage Strategy**: Settings saved immediately on change and loaded on startup with fallback to defaults.
5. **Feedback Timing**: Correct answers show celebration for 3 seconds before advancing; incorrect answers show shake for 0.5 seconds before reset.

## Data Format (game-object.json)
Each object has:
- `id`: Unique numeric identifier
- `objectName`: String representing the word or math problem (e.g., "apple", "0️⃣ + 1️⃣ =")
- `emoji`: String emoji representation

## Browser Support
- Modern browsers with localStorage support
- Touch events supported on mobile/tablets
- Keyboard events work on all devices with physical or on-screen keyboard

## Next Agent Notes
When working on this project:
1. Always check localStorage key: 'emojiGameSettings'
2. Settings object shape: {allowWords, enableMaxWordLength, maxWordLength, allowMathProblems, mathOptions: {allowAddition, allowSubtraction}}
3. Filtering happens in the useEffect with [initialObjects, settings] dependency
4. The gear button is intentionally rendered outside the conditional game content to ensure visibility
5. Touch detection uses: ('ontouchstart' in window || navigator.maxTouchPoints > 0)