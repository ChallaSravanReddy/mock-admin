import { SwithChallengeGame, SwithChallengeGameFormData } from '../types/swithChallenge';
import { supabase } from '../../lib/supabase';
import { mockTestService } from './mockTestService';

// Mock data for development
const mockGames: SwithChallengeGame[] = [
  {
    id: '1',
    title: 'Basic Symbol Order',
    description: 'Learn to identify symbol ordering patterns',
    difficulty: 'easy',
    timeDuration: 25,
    inputSymbols: ['circle', 'square', 'triangle', 'cross'],
    outputSymbols: ['triangle', 'square', 'cross', 'circle'],
    correctAnswerCode: '3142',
    options: ['2413', '3142', '4321', '1432'],
    correctOption: '3142',
    scoringRules: {
      correctPoints: 3,
      wrongPoints: -1,
    },
    published: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
];

class SwithChallengeService {
  public games: SwithChallengeGame[] = [...mockGames];

  async getAllGames(): Promise<SwithChallengeGame[]> {
    return new Promise((resolve) => {
      setTimeout(() => resolve(this.games), 500);
    });
  }

  async getGameById(id: string): Promise<SwithChallengeGame | null> {
    return new Promise((resolve) => {
      setTimeout(() => {
        const game = this.games.find((g) => g.id === id);
        resolve(game || null);
      }, 300);
    });
  }

  async createGame(formData: SwithChallengeGameFormData): Promise<SwithChallengeGame> {
    try {
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
      if (supabaseUrl && supabaseAnonKey) {
        const correctPoints = formData.correctPoints || 3;
        const wrongPoints = formData.wrongPoints || -1;
        const ansCode = formData.options.find(o => o === formData.correctOption) || '';

        const { data: newRow, error } = await supabase
          .from('switch_challenge_games')
          .insert({
            title: formData.title,
            description: formData.description,
            difficulty: formData.difficulty,
            time_duration_sec: formData.timeDuration,
            input_symbols: formData.inputSymbols,
            output_symbols: formData.outputSymbols,
            correct_answer_code: ansCode,
            options: formData.options,
            correct_option: formData.correctOption,
            scoring_correct: correctPoints,
            scoring_wrong: wrongPoints,
            published: true,
          })
          .select()
          .single();

        if (error) throw error;

        if (formData.mockTestId) {
          await mockTestService.linkQuestionToTest(formData.mockTestId, 'switch_challenge', newRow.id, 1);
        }

        const newGame: SwithChallengeGame = {
          id: newRow.id,
          ...formData,
          scoringRules: {
            correctPoints,
            wrongPoints,
          },
          correctAnswerCode: ansCode,
          published: true,
          createdAt: newRow.created_at,
          updatedAt: newRow.updated_at,
        };
        this.games.push(newGame);
        return newGame;
      }
    } catch (err) {
      console.warn('Supabase switch game creation failed, falling back to local:', err);
    }

    return new Promise((resolve) => {
      setTimeout(() => {
        const correctPoints = formData.correctPoints || 3;
        const wrongPoints = formData.wrongPoints || -1;
        const newGame: SwithChallengeGame = {
          id: Date.now().toString(),
          ...formData,
          scoringRules: {
            correctPoints,
            wrongPoints,
          },
          correctAnswerCode: formData.options.find(o => o === formData.correctOption) || '',
          published: false,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
        this.games.push(newGame);
        resolve(newGame);
      }, 500);
    });
  }

  async updateGame(id: string, formData: SwithChallengeGameFormData): Promise<SwithChallengeGame> {
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        const index = this.games.findIndex((g) => g.id === id);
        if (index === -1) {
          reject(new Error('Game not found'));
          return;
        }

        const correctPoints = formData.correctPoints || 3;
        const wrongPoints = formData.wrongPoints || -1;
        const updatedGame: SwithChallengeGame = {
          ...this.games[index],
          ...formData,
          scoringRules: {
            correctPoints,
            wrongPoints,
          },
          correctAnswerCode: formData.options.find(o => o === formData.correctOption) || '',
          updatedAt: new Date().toISOString(),
        };
        this.games[index] = updatedGame;
        resolve(updatedGame);
      }, 500);
    });
  }

  async deleteGame(id: string): Promise<void> {
    return new Promise((resolve) => {
      setTimeout(() => {
        this.games = this.games.filter((g) => g.id !== id);
        resolve();
      }, 300);
    });
  }

  async togglePublish(id: string): Promise<SwithChallengeGame> {
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        const game = this.games.find((g) => g.id === id);
        if (!game) {
          reject(new Error('Game not found'));
          return;
        }

        game.published = !game.published;
        game.updatedAt = new Date().toISOString();
        resolve(game);
      }, 300);
    });
  }

  // Utility function to generate correct answer code based on input and output
  generateAnswerCode(inputSymbols: string[], outputSymbols: string[]): string {
    return outputSymbols
      .map((symbol) => (inputSymbols.indexOf(symbol) + 1).toString())
      .join('');
  }

  // Utility function to verify if an answer code is correct
  verifyAnswer(
    inputSymbols: string[],
    outputSymbols: string[],
    answerCode: string
  ): boolean {
    const correctCode = this.generateAnswerCode(inputSymbols, outputSymbols);
    return answerCode === correctCode;
  }
}

export const swithChallengeService = new SwithChallengeService();
