import { Question, SymbolType } from '../types';
import { supabase } from '../../lib/supabase';
import { mockTestService } from './mockTestService';

// Mock data
export const questionsData: Question[] = [
  {
    id: '1',
    gridSize: 3,
    grid: [
      ['circle', 'square', 'triangle'],
      ['square', 'triangle', 'circle'],
      ['triangle', 'circle', null],
    ],
    missingCell: { row: 2, col: 2 },
    options: ['circle', 'square', 'triangle', 'star'],
    correctAnswer: 'square',
    difficulty: 'easy',
    mockTestId: '1',
    sequence: 1,
  },
  {
    id: '2',
    gridSize: 4,
    grid: [
      ['circle', 'square', 'triangle', 'star'],
      ['square', 'star', 'circle', 'triangle'],
      ['triangle', 'circle', 'star', 'square'],
      ['star', 'triangle', 'square', null],
    ],
    missingCell: { row: 3, col: 3 },
    options: ['circle', 'square', 'triangle', 'star'],
    correctAnswer: 'circle',
    difficulty: 'hard',
    mockTestId: '2',
    sequence: 1,
  },
];

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export const questionService = {
  // Fetch all questions
  getAllQuestions: async (): Promise<Question[]> => {
    await delay(800);
    return questionsData;
  },

  // Fetch questions by mock test ID
  getQuestionsByMockTestId: async (mockTestId: string): Promise<Question[]> => {
    await delay(600);
    return questionsData.filter((q) => q.mockTestId === mockTestId);
  },

  // Fetch single question
  getQuestionById: async (id: string): Promise<Question | null> => {
    await delay(400);
    return questionsData.find((q) => q.id === id) || null;
  },

  // Create question
  createQuestion: async (data: Omit<Question, 'id'>): Promise<Question> => {
    try {
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
      if (supabaseUrl && supabaseAnonKey) {
        const { data: newRow, error } = await supabase
          .from('puzzle_questions')
          .insert({
            title: `Puzzle Question`,
            description: `A puzzle question with grid size ${data.gridSize}`,
            difficulty: data.difficulty,
            grid_size: data.gridSize,
            grid: data.grid,
            missing_cell: data.missingCell,
            options: data.options.filter((o): o is Exclude<SymbolType, null> => o !== null),
            correct_answer: data.correctAnswer || '',
            published: true,
          })
          .select()
          .single();

        if (error) throw error;

        if (data.mockTestId) {
          await mockTestService.linkQuestionToTest(data.mockTestId, 'puzzle', newRow.id, data.sequence || 1);
        }

        const q: Question = {
          ...data,
          id: newRow.id,
        };
        questionsData.push(q);
        return q;
      }
    } catch (err) {
      console.warn('Supabase question creation failed, falling back to local:', err);
    }

    await delay(600);
    const newQuestion: Question = {
      ...data,
      id: Date.now().toString(),
    };
    questionsData.push(newQuestion);
    return newQuestion;
  },

  // Update question
  updateQuestion: async (id: string, updates: Partial<Question>): Promise<Question> => {
    await delay(500);
    const index = questionsData.findIndex((q) => q.id === id);
    if (index === -1) {
      throw new Error('Question not found');
    }
    const updated = { ...questionsData[index], ...updates };
    questionsData[index] = updated;
    return updated;
  },

  // Delete question
  deleteQuestion: async (id: string): Promise<void> => {
    await delay(400);
    const index = questionsData.findIndex((q) => q.id === id);
    if (index === -1) {
      throw new Error('Question not found');
    }
    questionsData.splice(index, 1);
  },

  // Validate grid
  validateGrid: async (
    grid: SymbolType[][],
    missingCell: { row: number; col: number }
  ): Promise<{ valid: boolean; errors: string[] }> => {
    await delay(300);
    const errors: string[] = [];

    // Check for repeated symbols in rows
    for (let i = 0; i < grid.length; i++) {
      const row = grid[i].filter((s) => s !== null);
      const symbols = new Set(row);
      if (symbols.size !== row.length) {
        errors.push(`Row ${i + 1} has repeated symbols`);
      }
    }

    // Check for repeated symbols in columns
    for (let j = 0; j < grid[0].length; j++) {
      const col = grid.map((row) => row[j]).filter((s) => s !== null);
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
};
