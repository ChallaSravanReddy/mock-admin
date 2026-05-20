import {
  MotionChallengeGame,
  MotionChallengeFormData,
  createDefaultLevel,
} from '../types/motionChallenge';
import { supabase } from '../../lib/supabase';
import { mockTestService } from './mockTestService';

const mockGames: MotionChallengeGame[] = [
  {
    id: '1',
    title: 'Motion Challenge Demo',
    description: 'Move the red ball into the black hole within the move limit',
    difficulty: 'medium',
    levels: [createDefaultLevel(0), createDefaultLevel(1)],
    timeDurationSeconds: 240,
    scoringRules: { correctPoints: 4, wrongPoints: -1 },
    published: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
];

class MotionChallengeService {
  public games: MotionChallengeGame[] = [...mockGames];

  async getAllGames(): Promise<MotionChallengeGame[]> {
    return new Promise((resolve) => setTimeout(() => resolve(this.games), 500));
  }

  async getGameById(id: string): Promise<MotionChallengeGame | null> {
    return new Promise((resolve) =>
      setTimeout(() => resolve(this.games.find((g) => g.id === id) || null), 300)
    );
  }

  async createGame(formData: MotionChallengeFormData): Promise<MotionChallengeGame> {
    try {
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
      if (supabaseUrl && supabaseAnonKey) {
        const correctPoints = formData.correctPoints ?? 4;
        const wrongPoints = formData.wrongPoints ?? -1;
        const timeDurationSeconds = formData.timeDurationSeconds ?? 240;

        const { data: newRow, error } = await supabase
          .from('motion_challenge_games')
          .insert({
            title: formData.title,
            description: formData.description,
            difficulty: formData.difficulty,
            time_duration_sec: timeDurationSeconds,
            scoring_correct: correctPoints,
            scoring_wrong: wrongPoints,
            published: true,
          })
          .select()
          .single();

        if (error) throw error;

        // Insert levels
        for (let i = 0; i < formData.levels.length; i++) {
          const lvl = formData.levels[i];
          const { error: lvlError } = await supabase
            .from('motion_challenge_levels')
            .insert({
              game_id: newRow.id,
              level_order: i,
              label: lvl.label || `Level ${i + 1}`,
              rows: lvl.rows,
              cols: lvl.cols,
              grid: lvl.grid,
              max_moves: lvl.maxMoves,
            });
          if (lvlError) throw lvlError;
        }

        if (formData.mockTestId) {
          await mockTestService.linkQuestionToTest(formData.mockTestId, 'motion_challenge', newRow.id, 1);
        }

        const newGame: MotionChallengeGame = {
          id: newRow.id,
          ...formData,
          timeDurationSeconds,
          scoringRules: {
            correctPoints,
            wrongPoints,
          },
          published: true,
          createdAt: newRow.created_at,
          updatedAt: newRow.updated_at,
        };
        this.games.push(newGame);
        return newGame;
      }
    } catch (err) {
      console.warn('Supabase motion game creation failed, falling back to local:', err);
    }

    return new Promise((resolve) =>
      setTimeout(() => {
        const newGame: MotionChallengeGame = {
          id: Date.now().toString(),
          ...formData,
          timeDurationSeconds: formData.timeDurationSeconds ?? 240,
          scoringRules: {
            correctPoints: formData.correctPoints ?? 4,
            wrongPoints: formData.wrongPoints ?? -1,
          },
          published: false,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
        this.games.push(newGame);
        resolve(newGame);
      }, 500)
    );
  }

  async updateGame(
    id: string,
    formData: MotionChallengeFormData
  ): Promise<MotionChallengeGame> {
    return new Promise((resolve, reject) =>
      setTimeout(() => {
        const idx = this.games.findIndex((g) => g.id === id);
        if (idx === -1) { reject(new Error('Game not found')); return; }
        const updated: MotionChallengeGame = {
          ...this.games[idx],
          ...formData,
          timeDurationSeconds: formData.timeDurationSeconds ?? 240,
          scoringRules: {
            correctPoints: formData.correctPoints ?? 4,
            wrongPoints: formData.wrongPoints ?? -1,
          },
          updatedAt: new Date().toISOString(),
        };
        this.games[idx] = updated;
        resolve(updated);
      }, 500)
    );
  }

  async deleteGame(id: string): Promise<void> {
    return new Promise((resolve) =>
      setTimeout(() => {
        this.games = this.games.filter((g) => g.id !== id);
        resolve();
      }, 300)
    );
  }

  async togglePublish(id: string): Promise<MotionChallengeGame> {
    return new Promise((resolve, reject) =>
      setTimeout(() => {
        const game = this.games.find((g) => g.id === id);
        if (!game) { reject(new Error('Game not found')); return; }
        game.published = !game.published;
        game.updatedAt = new Date().toISOString();
        resolve(game);
      }, 300)
    );
  }
}

export const motionChallengeService = new MotionChallengeService();
