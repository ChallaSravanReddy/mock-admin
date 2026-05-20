import {
  GridChallengeGame,
  GridChallengeFormData,
  createDefaultRound,
} from '../types/gridChallenge';
import { supabase } from '../../lib/supabase';
import { mockTestService } from './mockTestService';

// ─── Mock seed data ──────────────────────────────────────────────────────────
const mockGames: GridChallengeGame[] = [
  {
    id: '1',
    title: 'Grid Challenge Demo',
    description: 'Remember the highlighted dot and judge symmetry',
    difficulty: 'medium',
    totalRounds: 3,
    rounds: [createDefaultRound(0), createDefaultRound(1), createDefaultRound(2)],
    scoringRules: { correctPoints: 3, wrongPoints: -1 },
    symmetryDisplayMs: 6000,
    published: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
];

class GridChallengeService {
  public games: GridChallengeGame[] = [...mockGames];

  async getAllGames(): Promise<GridChallengeGame[]> {
    return new Promise((resolve) => setTimeout(() => resolve(this.games), 500));
  }

  async getGameById(id: string): Promise<GridChallengeGame | null> {
    return new Promise((resolve) =>
      setTimeout(() => resolve(this.games.find((g) => g.id === id) || null), 300)
    );
  }

  async createGame(formData: GridChallengeFormData): Promise<GridChallengeGame> {
    try {
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
      if (supabaseUrl && supabaseAnonKey) {
        const correctPoints = formData.correctPoints ?? 3;
        const wrongPoints = formData.wrongPoints ?? -1;
        const symmetryDisplayMs = formData.symmetryDisplayMs ?? 6000;

        const { data: newRow, error } = await supabase
          .from('grid_challenge_games')
          .insert({
            title: formData.title,
            description: formData.description,
            difficulty: formData.difficulty,
            total_rounds: formData.rounds.length,
            symmetry_display_ms: symmetryDisplayMs,
            scoring_correct: correctPoints,
            scoring_wrong: wrongPoints,
            published: true,
          })
          .select()
          .single();

        if (error) throw error;

        // Insert rounds
        for (let i = 0; i < formData.rounds.length; i++) {
          const r = formData.rounds[i];
          const { error: roundError } = await supabase
            .from('grid_challenge_rounds')
            .insert({
              game_id: newRow.id,
              round_order: i,
              dots: r.dotPhase.dots,
              target_dot_id: r.dotPhase.targetDotId,
              highlight_duration_ms: r.dotPhase.highlightDurationMs,
              grid_left: r.symmetryPhase.gridLeft,
              grid_right: r.symmetryPhase.gridRight,
              is_symmetric: r.symmetryPhase.isSymmetric,
              symmetry_label: r.symmetryPhase.label || '',
            });
          if (roundError) throw roundError;
        }

        if (formData.mockTestId) {
          await mockTestService.linkQuestionToTest(formData.mockTestId, 'grid_challenge', newRow.id, 1);
        }

        const newGame: GridChallengeGame = {
          id: newRow.id,
          ...formData,
          totalRounds: formData.rounds.length,
          scoringRules: {
            correctPoints,
            wrongPoints,
          },
          symmetryDisplayMs,
          published: true,
          createdAt: newRow.created_at,
          updatedAt: newRow.updated_at,
        };
        this.games.push(newGame);
        return newGame;
      }
    } catch (err) {
      console.warn('Supabase grid game creation failed, falling back to local:', err);
    }

    return new Promise((resolve) =>
      setTimeout(() => {
        const newGame: GridChallengeGame = {
          id: Date.now().toString(),
          ...formData,
          totalRounds: formData.rounds.length,
          scoringRules: {
            correctPoints: formData.correctPoints ?? 3,
            wrongPoints: formData.wrongPoints ?? -1,
          },
          symmetryDisplayMs: formData.symmetryDisplayMs ?? 6000,
          published: false,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
        this.games.push(newGame);
        resolve(newGame);
      }, 500)
    );
  }

  async updateGame(id: string, formData: GridChallengeFormData): Promise<GridChallengeGame> {
    return new Promise((resolve, reject) =>
      setTimeout(() => {
        const idx = this.games.findIndex((g) => g.id === id);
        if (idx === -1) { reject(new Error('Game not found')); return; }
        const updated: GridChallengeGame = {
          ...this.games[idx],
          ...formData,
          totalRounds: formData.rounds.length,
          scoringRules: {
            correctPoints: formData.correctPoints ?? 3,
            wrongPoints: formData.wrongPoints ?? -1,
          },
          symmetryDisplayMs: formData.symmetryDisplayMs ?? 6000,
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

  async togglePublish(id: string): Promise<GridChallengeGame> {
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

export const gridChallengeService = new GridChallengeService();
