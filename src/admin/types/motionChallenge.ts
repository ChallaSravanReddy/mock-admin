// ─── Motion Challenge Types ───────────────────────────────────────────────────
// Motion Challenge = slide coloured squares to create a path for the red ball
// into the black hole within a limited number of moves.

export type CellType =
  | 'empty'       // uncoloured — ball / squares can move here
  | 'ball'        // red ball (the piece the player tries to move into the hole)
  | 'hole'        // black hole (destination)
  | 'blocked'     // cross-marked — immovable, cannot be passed
  | 'colored';    // coloured movable square

export type CellColor =
  | 'red'
  | 'purple'
  | 'dark'
  | 'yellow'
  | 'blue-light'
  | 'blue-dark'
  | 'pink'
  | 'orange';

export interface MotionCell {
  type: CellType;
  color?: CellColor;    // only for 'colored' cells
  id?: string;          // unique id for a movable piece (for 1×2 / 2×1 blocks later)
}

// A grid is rows × cols of MotionCell
export type MotionGrid = MotionCell[][];

export interface MotionChallengeLevel {
  id: string;
  rows: number;          // default 6
  cols: number;          // default 4
  grid: MotionGrid;
  maxMoves: number;      // limited moves the player has
  label?: string;        // e.g. "Level 1"
}

export interface MotionChallengeGame {
  id: string;
  title: string;
  description: string;
  difficulty: 'easy' | 'medium' | 'hard';
  levels: MotionChallengeLevel[];
  timeDurationSeconds: number;    // default 240 (4 minutes)
  scoringRules: {
    correctPoints: number;        // default 4
    wrongPoints: number;          // default -1
  };
  published: boolean;
  createdAt: string;
  updatedAt: string;
  mockTestId?: string;
}

export interface MotionChallengeFormData {
  title: string;
  description: string;
  difficulty: 'easy' | 'medium' | 'hard';
  levels: MotionChallengeLevel[];
  timeDurationSeconds?: number;
  correctPoints?: number;
  wrongPoints?: number;
  mockTestId?: string;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

export const CELL_COLORS: CellColor[] = [
  'red', 'purple', 'dark', 'yellow', 'blue-light', 'blue-dark', 'pink', 'orange',
];

export const COLOR_CSS: Record<CellColor, string> = {
  red: '#dc2626',
  purple: '#7c3aed',
  dark: '#1e293b',
  yellow: '#ca8a04',
  'blue-light': '#38bdf8',
  'blue-dark': '#1d4ed8',
  pink: '#ec4899',
  orange: '#ea580c',
};

export function createEmptyMotionGrid(rows: number, cols: number): MotionGrid {
  return Array.from({ length: rows }, () =>
    Array.from({ length: cols }, () => ({ type: 'empty' as CellType }))
  );
}

export function createDefaultLevel(index: number): MotionChallengeLevel {
  const rows = 6;
  const cols = 4;
  const grid = createEmptyMotionGrid(rows, cols);

  // seed: hole at top-right, ball at bottom-left
  grid[0][cols - 1] = { type: 'hole' };
  grid[rows - 1][0] = { type: 'ball' };

  return {
    id: `level-${index}-${Date.now()}`,
    rows,
    cols,
    grid,
    maxMoves: 10,
    label: `Level ${index + 1}`,
  };
}
