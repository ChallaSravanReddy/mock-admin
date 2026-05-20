export type SymbolType = 'circle' | 'square' | 'triangle' | 'star' | 'pentagon' | null;

export type Question = {
  id: string;
  gridSize: number;
  grid: SymbolType[][];
  missingCell: {
    row: number;
    col: number;
  };
  options: SymbolType[];
  correctAnswer: SymbolType;
  difficulty: 'easy' | 'medium' | 'hard';
  mockTestId: string;
  sequence: number;
};

export type GridCellType = {
  row: number;
  col: number;
  symbol: SymbolType;
};

export type PuzzleGridState = {
  gridSize: number;
  grid: SymbolType[][];
  missingCell: { row: number; col: number } | null;
  options: SymbolType[];
  correctAnswer: SymbolType | null;
  difficulty: 'easy' | 'medium' | 'hard';
};

export type SymbolName = 'circle' | 'square' | 'triangle' | 'star' | 'pentagon';
export const SYMBOLS: SymbolName[] = ['circle', 'square', 'triangle', 'star', 'pentagon'];
