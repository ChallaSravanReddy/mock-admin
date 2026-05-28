# Swith Challenge Game

The Swith Challenge is a symbol ordering puzzle game designed for testing logical thinking. Admins can create custom games with different symbols, difficulty levels, and scoring rules.

## Overview

### Game Mechanics

The game presents:
1. **Input Symbols**: A row of 4 symbols (Circle, Square, Triangle, Cross) in order (1, 2, 3, 4)
2. **Output Symbols**: The same symbols rearranged in a different order
3. **Task**: Players must determine which input position each output symbol came from
4. **Answer Format**: A 4-digit code where each digit represents the input position (e.g., "3142")

### Example

```
Input:    Circle(1)  Square(2)  Triangle(3)  Cross(4)
          
Output:   Triangle   Square     Cross        Circle
Answer:   3          2          4            1
          = 3241
```

## Admin Features

### Creating a Game

1. Navigate to **Admin Panel** → **Swith Challenge**
2. Click **Create New Game**
3. Fill in the following fields:

#### Basic Information
- **Title**: Game name (e.g., "Symbol Order Challenge 1")
- **Description**: Brief description of the game
- **Difficulty**: Easy, Medium, or Hard
- **Time Duration**: 10-60 seconds (recommended: 20-25 seconds)

#### Input Symbols
- Add 4 symbols in order (Circle, Square, Triangle, Cross)
- These appear at the top of the game

#### Output Symbols
- Arrange the same 4 symbols in a different order
- The correct answer code is **automatically calculated**
- Position numbers below show which input position each symbol came from

#### Answer Options
- Enter 4 different numeric codes
- The correct answer is auto-calculated from your symbol arrangement
- Select which option is correct using the "Set as Correct" button

#### Scoring Rules
- **Correct Points**: Default is 3
- **Wrong Points**: Default is -1

### Managing Games

**List View**
- Search games by title or description
- Filter by difficulty level
- Sort by creation date

**Actions**
- **Publish/Unpublish**: Toggle visibility to players
- **Edit**: Modify game configuration
- **Delete**: Remove game permanently

## Player Features

### Playing the Game

1. View input symbols with their position numbers (1, 2, 3, 4)
2. View output symbols in their rearranged order
3. Select the correct 4-digit answer code
4. Submit before time runs out

### Scoring

- **Correct Answer**: +3 points (or custom value)
- **Wrong Answer**: -1 point (or custom value)
- **Time Up**: Treated as wrong answer

### Timer

- Countdown timer shows remaining time
- Color changes when time is running low
- Game auto-submits when time expires

## Technical Details

### File Structure

```
src/admin/
├── types/
│   └── swithChallenge.ts          # Type definitions
├── store/
│   └── swithChallengeStore.ts      # Zustand state management
├── services/
│   └── swithChallengeService.ts    # API service (mock data)
├── Pages/
│   └── SwithChallengeManagement.tsx # Admin management page
└── components/puzzle/
    ├── SymbolDisplay.tsx            # Symbol rendering component
    ├── SwithChallengeBuilder.tsx     # Admin builder UI
    └── SwithChallengePlayer.tsx      # Player game UI
```

### Key Components

#### SymbolDisplay
Renders SVG symbols:
- Circle
- Square
- Triangle
- Cross (Plus sign)

Available sizes: sm, md, lg

#### SwithChallengeBuilder
Admin interface for creating/editing games:
- Symbol arrangement UI
- Option code input
- Answer validation
- Auto-calculation of correct answers

#### SwithChallengePlayer
Player game interface:
- Symbol display
- Timer with visual feedback
- Answer selection
- Result display
- Score calculation

### Data Types

```typescript
interface SwithChallengeGame {
  id: string;
  title: string;
  description: string;
  difficulty: 'easy' | 'medium' | 'hard';
  timeDuration: number; // seconds
  inputSymbols: SymbolCode[]; // [circle, square, triangle, cross]
  outputSymbols: SymbolCode[]; // rearranged order
  correctAnswerCode: string; // e.g., "3142"
  options: string[]; // 4 answer options
  correctOption: string; // which option is correct
  scoringRules: {
    correctPoints: number;
    wrongPoints: number;
  };
  published: boolean;
  createdAt: string;
  updatedAt: string;
}
```

## Best Practices for Game Creation

### Difficulty Progression

**Easy**
- Time: 25 seconds
- Common arrangements
- Simple patterns

**Medium**
- Time: 20 seconds
- Complex arrangements
- Mixed patterns

**Hard**
- Time: 20 seconds
- Very complex arrangements
- Counter-intuitive patterns

### Tips for Admin

1. **Create Variations**: Make multiple games with different symbol arrangements
2. **Test Before Publishing**: Verify the correct answer is accurate
3. **Vary Difficulty**: Include easy, medium, and hard levels
4. **Use Distinct Options**: Make wrong answer options clearly different from correct one
5. **Monitor Performance**: Review player results to adjust difficulty levels

## Usage in Routes

The game is available at `/admin/swith-challenge` and is integrated into the admin panel with:
- Full CRUD operations
- Search and filtering
- Publish/draft status
- Pagination support

## Future Enhancements

- [ ] Analytics dashboard for game performance
- [ ] Leaderboard integration
- [ ] Bulk import/export of games
- [ ] Game templates
- [ ] Performance metrics by difficulty
- [ ] Player statistics tracking
