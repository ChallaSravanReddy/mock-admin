export type SymbolCode = 'circle' | 'square' | 'triangle' | 'cross' | 'star' | 'pentagon' | 'hexagon' | 'diamond';

export interface SwithChallengeGame {
  id: string;
  title: string;
  description: string;
  difficulty: 'easy' | 'medium' | 'hard';
  timeDuration: number; // in seconds (20 or 25)
  inputSymbols: SymbolCode[]; // Order matters (4-8 symbols)
  outputSymbols: SymbolCode[]; // Order matters
  correctAnswerCode: string; // e.g., "3142" - which input position each output symbol is from
  options: string[]; // e.g., ["2413", "3142", "4321", "1432"]
  correctOption: string; // which option is correct
  scoringRules: {
    correctPoints: number;
    wrongPoints: number; // negative
  };
  published: boolean;
  createdAt: string;
  updatedAt: string;
  mockTestId?: string;
}

export interface SwithChallengeGameFormData {
  title: string;
  description: string;
  difficulty: 'easy' | 'medium' | 'hard';
  timeDuration: number;
  inputSymbols: SymbolCode[];
  outputSymbols: SymbolCode[];
  options: string[];
  correctOption: string;
  correctPoints?: number;
  wrongPoints?: number;
  mockTestId?: string;
}

export interface SwithChallengeQuestion {
  id: string;
  gameId: string;
  userId: string;
  selectedAnswer: string | null;
  isCorrect: boolean;
  pointsEarned: number;
  timeTaken: number;
  answeredAt: string;
}

export const AVAILABLE_SYMBOLS: SymbolCode[] = ['circle', 'square', 'triangle', 'cross', 'star', 'pentagon', 'hexagon', 'diamond'];
