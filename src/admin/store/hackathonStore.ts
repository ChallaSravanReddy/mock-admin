import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { GameTypeId } from '../constants/gameTypes';
import { MAX_QUESTIONS_PER_TOPIC } from '../constants/gameTypes';
import type { HackathonQuestion } from '../types/hackathon';
import { generateHackathonQuestion } from '../lib/hackathonGenerators';

const STORAGE_KEY = 'hackathon_studio_questions';

interface HackathonStore {
  questions: HackathonQuestion[];
  countByType: (type: GameTypeId) => number;
  canAdd: (type: GameTypeId, count?: number) => { ok: boolean; message?: string };
  addQuestion: (question: HackathonQuestion) => { ok: boolean; message?: string };
  addQuestions: (questions: HackathonQuestion[]) => { ok: boolean; message?: string; added: number };
  generateBatch: (type: GameTypeId, count: number) => { ok: boolean; message?: string; added: number };
  updateQuestion: (id: string, question: HackathonQuestion) => void;
  deleteQuestion: (id: string) => void;
  clearAll: () => void;
}

export const useHackathonStore = create<HackathonStore>()(
  persist(
    (set, get) => ({
      questions: [],

      countByType: (type) => get().questions.filter((q) => q.type === type).length,

      canAdd: (type, count = 1) => {
        const current = get().countByType(type);
        if (current + count > MAX_QUESTIONS_PER_TOPIC) {
          return {
            ok: false,
            message: `Maximum ${MAX_QUESTIONS_PER_TOPIC} questions per challenge type. You have ${current}, can add ${MAX_QUESTIONS_PER_TOPIC - current} more.`,
          };
        }
        return { ok: true };
      },

      addQuestion: (question) => {
        const check = get().canAdd(question.type, 1);
        if (!check.ok) return check;
        set((state) => ({
          questions: [{ ...question, updatedAt: new Date().toISOString() }, ...state.questions],
        }));
        return { ok: true };
      },

      addQuestions: (newQuestions) => {
        if (newQuestions.length === 0) return { ok: true, added: 0 };
        const type = newQuestions[0].type;
        const check = get().canAdd(type, newQuestions.length);
        if (!check.ok) return { ...check, added: 0 };
        set((state) => ({
          questions: [
            ...newQuestions.map((q) => ({ ...q, updatedAt: new Date().toISOString() })),
            ...state.questions,
          ],
        }));
        return { ok: true, added: newQuestions.length };
      },

      generateBatch: (type, count) => {
        const check = get().canAdd(type, count);
        if (!check.ok) return { ...check, added: 0 };
        const batch = Array.from({ length: count }, () => generateHackathonQuestion(type, 'ai'));
        set((state) => ({
          questions: [...batch, ...state.questions],
        }));
        return { ok: true, added: count };
      },

      updateQuestion: (id, question) => {
        set((state) => ({
          questions: state.questions.map((q) =>
            q.id === id ? { ...question, id, updatedAt: new Date().toISOString() } : q
          ),
        }));
      },

      deleteQuestion: (id) => {
        set((state) => ({
          questions: state.questions.filter((q) => q.id !== id),
        }));
      },

      clearAll: () => set({ questions: [] }),
    }),
    { name: STORAGE_KEY }
  )
);
