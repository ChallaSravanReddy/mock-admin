import {
  InductiveChallengeGame,
  InductiveChallengeFormData,
  createDefaultQuestion,
} from '../types/inductiveChallenge';
import { supabase } from '../../lib/supabase';
import { mockTestService } from './mockTestService';

// ─── Mock seed data ──────────────────────────────────────────────────────────
const mockGames: InductiveChallengeGame[] = [
  {
    id: '1',
    title: 'Inductive Challenge Demo',
    description: 'Find the pattern rule between two grids and match it',
    difficulty: 'medium',
    questions: [createDefaultQuestion(0)],
    scoringRules: { correctPoints: 3, wrongPoints: -1 },
    published: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
];

class InductiveChallengeService {
  public games: InductiveChallengeGame[] = [...mockGames];

  async getAllGames(): Promise<InductiveChallengeGame[]> {
    return new Promise((resolve) => setTimeout(() => resolve(this.games), 500));
  }

  async getGameById(id: string): Promise<InductiveChallengeGame | null> {
    return new Promise((resolve) =>
      setTimeout(() => resolve(this.games.find((g) => g.id === id) || null), 300)
    );
  }

  async createGame(formData: InductiveChallengeFormData): Promise<InductiveChallengeGame> {
    try {
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
      if (supabaseUrl && supabaseAnonKey) {
        const correctPoints = formData.correctPoints ?? 3;
        const wrongPoints = formData.wrongPoints ?? -1;
        const displayDurationMs = formData.questions[0]?.displayDurationMs ?? 30000;

        const { data: newRow, error } = await supabase
          .from('inductive_challenge_games')
          .insert({
            title: formData.title,
            description: formData.description,
            difficulty: formData.difficulty,
            display_duration_ms: displayDurationMs,
            scoring_correct: correctPoints,
            scoring_wrong: wrongPoints,
            published: true,
          })
          .select()
          .single();

        if (error) throw error;

        // Insert questions
        for (let i = 0; i < formData.questions.length; i++) {
          const q = formData.questions[i];
          const optionA = q.options.find(o => o.id === 'A')?.grid || [];
          const optionB = q.options.find(o => o.id === 'B')?.grid || [];
          const optionC = q.options.find(o => o.id === 'C')?.grid || [];
          const optionD = q.options.find(o => o.id === 'D')?.grid || [];

          const { error: questError } = await supabase
            .from('inductive_challenge_questions')
            .insert({
              game_id: newRow.id,
              question_order: i,
              grid_a: q.examplePair.gridA,
              grid_b: q.examplePair.gridB,
              option_a: optionA,
              option_b: optionB,
              option_c: optionC,
              option_d: optionD,
              correct_option_ids: q.correctOptionIds,
              rule_note: q.rule || '',
            });
          if (questError) throw questError;
        }

        if (formData.mockTestId) {
          await mockTestService.linkQuestionToTest(formData.mockTestId, 'inductive_challenge', newRow.id, 1);
        }

        const newGame: InductiveChallengeGame = {
          id: newRow.id,
          ...formData,
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
      console.warn('Supabase inductive game creation failed, falling back to local:', err);
    }

    return new Promise((resolve) =>
      setTimeout(() => {
        const newGame: InductiveChallengeGame = {
          id: Date.now().toString(),
          ...formData,
          scoringRules: {
            correctPoints: formData.correctPoints ?? 3,
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
    formData: InductiveChallengeFormData
  ): Promise<InductiveChallengeGame> {
    return new Promise((resolve, reject) =>
      setTimeout(() => {
        const idx = this.games.findIndex((g) => g.id === id);
        if (idx === -1) { reject(new Error('Game not found')); return; }
        const updated: InductiveChallengeGame = {
          ...this.games[idx],
          ...formData,
          scoringRules: {
            correctPoints: formData.correctPoints ?? 3,
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

  async togglePublish(id: string): Promise<InductiveChallengeGame> {
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

export const inductiveChallengeService = new InductiveChallengeService();
