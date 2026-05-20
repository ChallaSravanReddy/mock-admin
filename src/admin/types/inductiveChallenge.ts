// ─── Inductive Challenge Types ───────────────────────────────────────────────
// Inductive Challenge = pattern recognition with coloured shapes in grids

export type ShapeType = 'square' | 'circle' | 'triangle' | 'cross';
export type ShapeColor = 'green' | 'purple' | 'blue' | 'red' | 'orange';

export interface ShapeCell {
  shape: ShapeType;
  color: ShapeColor;
}

// A 3x3 grid of shape cells
export type ShapeGrid = (ShapeCell | null)[][];

export interface InductiveExamplePair {
  gridA: ShapeGrid; // first grid (before transformation)
  gridB: ShapeGrid; // second grid (after transformation, follows rule)
}

export interface InductiveOption {
  id: string; // e.g. 'A', 'B', 'C', 'D'
  grid: ShapeGrid;
  isCorrect: boolean;
}

export interface InductiveChallengeQuestion {
  id: string;
  examplePair: InductiveExamplePair; // the two grids that demonstrate the rule
  options: InductiveOption[]; // four answer grids (pick two that follow same rule)
  correctOptionIds: string[]; // two correct option IDs
  rule?: string; // admin note describing the rule (not shown to player)
  displayDurationMs: number; // default 30000 (30 sec)
}

export interface InductiveChallengeGame {
  id: string;
  title: string;
  description: string;
  difficulty: 'easy' | 'medium' | 'hard';
  questions: InductiveChallengeQuestion[];
  scoringRules: {
    correctPoints: number; // default 3
    wrongPoints: number; // default -1
  };
  published: boolean;
  createdAt: string;
  updatedAt: string;
  mockTestId?: string;
}

export interface InductiveChallengeFormData {
  title: string;
  description: string;
  difficulty: 'easy' | 'medium' | 'hard';
  questions: InductiveChallengeQuestion[];
  correctPoints?: number;
  wrongPoints?: number;
  mockTestId?: string;
}

// ─── Constants ───────────────────────────────────────────────────────────────

export const SHAPE_TYPES: ShapeType[] = ['square', 'circle', 'triangle', 'cross'];
export const SHAPE_COLORS: ShapeColor[] = ['green', 'purple', 'blue', 'red', 'orange'];

export function createEmptyGrid(size = 3): ShapeGrid {
  return Array.from({ length: size }, () => Array(size).fill(null));
}

export function createDefaultQuestion(index: number): InductiveChallengeQuestion {
  return {
    id: `q-${index}`,
    examplePair: {
      gridA: createEmptyGrid(),
      gridB: createEmptyGrid(),
    },
    options: [
      { id: 'A', grid: createEmptyGrid(), isCorrect: false },
      { id: 'B', grid: createEmptyGrid(), isCorrect: false },
      { id: 'C', grid: createEmptyGrid(), isCorrect: false },
      { id: 'D', grid: createEmptyGrid(), isCorrect: false },
    ],
    correctOptionIds: [],
    rule: '',
    displayDurationMs: 30000,
  };
}
