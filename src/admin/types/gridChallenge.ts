// ─── Grid Challenge Types ───────────────────────────────────────────────────
// Grid Challenge = dot memory phase + symmetry-check phase interleaved

export interface DotPosition {
  id: string;
  x: number; // percentage 0-100
  y: number; // percentage 0-100
  isTarget: boolean; // the dot the player must remember in this round
}

export interface GridRow {
  cells: boolean[]; // true = filled square, false = empty dot
}

export interface SymmetryQuestion {
  id: string;
  gridLeft: boolean[][]; // 5x5 grid (true = filled)
  gridRight: boolean[][]; // 5x5 grid
  isSymmetric: boolean; // correct answer
  label?: string; // e.g. "Rotated but identical?"
}

export interface GridChallengeRound {
  id: string;
  dotPhase: {
    dots: DotPosition[]; // scattered dot positions
    targetDotId: string; // which dot blinks (must be remembered)
    highlightDurationMs: number; // how long the dot blinks (default 2000)
  };
  symmetryPhase: SymmetryQuestion;
}

export interface GridChallengeGame {
  id: string;
  title: string;
  description: string;
  difficulty: 'easy' | 'medium' | 'hard';
  totalRounds: number; // usually 3
  rounds: GridChallengeRound[];
  scoringRules: {
    correctPoints: number; // default 3
    wrongPoints: number; // default -1
  };
  symmetryDisplayMs: number; // how long symmetry patterns show (default 6000)
  published: boolean;
  createdAt: string;
  updatedAt: string;
  mockTestId?: string;
}

export interface GridChallengeFormData {
  title: string;
  description: string;
  difficulty: 'easy' | 'medium' | 'hard';
  totalRounds: number;
  rounds: GridChallengeRound[];
  correctPoints?: number;
  wrongPoints?: number;
  symmetryDisplayMs?: number;
  mockTestId?: string;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

export const EMPTY_5X5 = (): boolean[][] =>
  Array.from({ length: 5 }, () => Array(5).fill(false));

export function createDefaultRound(index: number): GridChallengeRound {
  const dots: DotPosition[] = Array.from({ length: 20 }, (_, i) => ({
    id: `dot-${i}`,
    x: 5 + Math.round(Math.random() * 88),
    y: 5 + Math.round(Math.random() * 88),
    isTarget: false,
  }));
  dots[0].isTarget = true;

  return {
    id: `round-${index}`,
    dotPhase: {
      dots,
      targetDotId: dots[0].id,
      highlightDurationMs: 2000,
    },
    symmetryPhase: {
      id: `sym-${index}`,
      gridLeft: EMPTY_5X5(),
      gridRight: EMPTY_5X5(),
      isSymmetric: false,
      label: 'Is it Symmetric?',
    },
  };
}
