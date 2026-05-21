import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import { SymbolType, PuzzleGridState } from '../types';

interface PuzzleBuilderStore extends PuzzleGridState {
  setGridSize: (size: number) => void;
  setCell: (row: number, col: number, symbol: SymbolType) => void;
  clearCell: (row: number, col: number) => void;
  clearGrid: () => void;
  setMissingCell: (row: number, col: number) => void;
  setOptions: (options: SymbolType[]) => void;
  setCorrectAnswer: (symbol: SymbolType) => void;
  setDifficulty: (difficulty: 'easy' | 'medium' | 'hard') => void;
  validateGrid: () => { valid: boolean; errors: string[] };
  resetPuzzle: () => void;
}

const createEmptyGrid = (size: number): SymbolType[][] => {
  return Array(size)
    .fill(null)
    .map(() => Array(size).fill(null));
};

const initialState: PuzzleGridState = {
  gridSize: 3,
  grid: createEmptyGrid(3),
  missingCell: null,
  options: ['circle', 'square', 'triangle', 'star'],
  correctAnswer: null,
  difficulty: 'medium',
};

export const usePuzzleBuilderStore = create<PuzzleBuilderStore>()(
  devtools(
    (set, get) => ({
      ...initialState,

      setGridSize: (size) =>
        set({
          gridSize: size,
          grid: createEmptyGrid(size),
          missingCell: null,
        }),

      setCell: (row, col, symbol) =>
        set((state) => {
          const newGrid = state.grid.map((r) => [...r]);
          newGrid[row][col] = symbol;
          return { grid: newGrid };
        }),

      clearCell: (row, col) =>
        set((state) => {
          const newGrid = state.grid.map((r) => [...r]);
          newGrid[row][col] = null;
          return { grid: newGrid };
        }),

      clearGrid: () =>
        set({
          grid: createEmptyGrid(get().gridSize),
          missingCell: null,
        }),

      setMissingCell: (row, col) =>
        set({
          missingCell: { row, col },
        }),

      setOptions: (options) => set({ options }),

      setCorrectAnswer: (symbol) => set({ correctAnswer: symbol }),

      setDifficulty: (difficulty) => set({ difficulty }),

      validateGrid: () => {
        const state = get();
        const errors: string[] = [];

        // Check if missing cell is set
        if (!state.missingCell) {
          errors.push('Missing cell must be marked');
        }

        // Check if correct answer is set
        if (!state.correctAnswer) {
          errors.push('Correct answer must be selected');
        }

        // Check for repeated symbols in rows
        for (let i = 0; i < state.gridSize; i++) {
          const row = state.grid[i].filter((s) => s !== null);
          const symbols = new Set(row);
          if (symbols.size !== row.length) {
            errors.push(`Row ${i + 1} has repeated symbols`);
          }
        }

        // Check for repeated symbols in columns
        for (let j = 0; j < state.gridSize; j++) {
          const col = state.grid.map((row) => row[j]).filter((s) => s !== null);
          const symbols = new Set(col);
          if (symbols.size !== col.length) {
            errors.push(`Column ${j + 1} has repeated symbols`);
          }
        }

        return {
          valid: errors.length === 0,
          errors,
        };
      },

      resetPuzzle: () => set(initialState),
    }),
    { name: 'PuzzleBuilderStore' }
  )
);
