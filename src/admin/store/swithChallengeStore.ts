import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import { SwithChallengeGame } from '../types/swithChallenge';

interface SwithChallengeStore {
  games: SwithChallengeGame[];
  isLoading: boolean;
  error: string | null;
  setGames: (games: SwithChallengeGame[]) => void;
  addGame: (game: SwithChallengeGame) => void;
  updateGame: (id: string, game: SwithChallengeGame) => void;
  deleteGame: (id: string) => void;
  togglePublishStatus: (id: string) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
}

export const useSwithChallengeStore = create<SwithChallengeStore>()(
  devtools(
    (set) => ({
      games: [],
      isLoading: false,
      error: null,

      setGames: (games) => set({ games }),

      addGame: (game) =>
        set((state) => ({
          games: [...state.games, game],
        })),

      updateGame: (id, game) =>
        set((state) => ({
          games: state.games.map((g) => (g.id === id ? game : g)),
        })),

      deleteGame: (id) =>
        set((state) => ({
          games: state.games.filter((g) => g.id !== id),
        })),

      togglePublishStatus: (id) =>
        set((state) => ({
          games: state.games.map((g) =>
            g.id === id ? { ...g, published: !g.published } : g
          ),
        })),

      setLoading: (loading) => set({ isLoading: loading }),

      setError: (error) => set({ error }),
    }),
    {
      name: 'swith-challenge-store',
    }
  )
);
