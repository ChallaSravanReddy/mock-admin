import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { GameTypeId } from '../constants/gameTypes';
import { MAX_QUESTIONS_PER_TOPIC } from '../constants/gameTypes';
import type { HackathonQuestion } from '../types/hackathon';
import { generateHackathonQuestion } from '../lib/hackathonGenerators';

const STORAGE_KEY = 'mock_test_questions_v1';

interface MockTestQuestionsStore {
  byTestId: Record<string, HackathonQuestion[]>;
  getQuestions: (mockTestId: string) => HackathonQuestion[];
  countByType: (mockTestId: string, type: GameTypeId) => number;
  canAdd: (mockTestId: string, type: GameTypeId, count?: number) => { ok: boolean; message?: string };
  addQuestion: (mockTestId: string, question: HackathonQuestion) => { ok: boolean; message?: string };
  addGenerated: (mockTestId: string, type: GameTypeId, count: number) => { ok: boolean; message?: string; added: number };
  updateQuestion: (mockTestId: string, questionId: string, question: HackathonQuestion) => void;
  deleteQuestion: (mockTestId: string, questionId: string) => void;
  setQuestions: (mockTestId: string, questions: HackathonQuestion[]) => void;
  migrateTestId: (fromId: string, toId: string) => void;
  deleteTestQuestions: (mockTestId: string) => void;
}

export const useMockTestQuestionsStore = create<MockTestQuestionsStore>()(
  persist(
    (set, get) => ({
      byTestId: {},

      getQuestions: (mockTestId) => get().byTestId[mockTestId] ?? [],

      countByType: (mockTestId, type) =>
        get().getQuestions(mockTestId).filter((q) => q.type === type).length,

      canAdd: (mockTestId, type, count = 1) => {
        const current = get().countByType(mockTestId, type);
        if (current + count > MAX_QUESTIONS_PER_TOPIC) {
          return {
            ok: false,
            message: `Max ${MAX_QUESTIONS_PER_TOPIC} questions per type in this test (${current} already added).`,
          };
        }
        return { ok: true };
      },

      addQuestion: (mockTestId, question) => {
        const check = get().canAdd(mockTestId, question.type, 1);
        if (!check.ok) return check;
        set((state) => ({
          byTestId: {
            ...state.byTestId,
            [mockTestId]: [
              { ...question, updatedAt: new Date().toISOString() },
              ...(state.byTestId[mockTestId] ?? []),
            ],
          },
        }));
        return { ok: true };
      },

      addGenerated: (mockTestId, type, count) => {
        const check = get().canAdd(mockTestId, type, count);
        if (!check.ok) return { ...check, added: 0 };
        const batch = Array.from({ length: count }, () => generateHackathonQuestion(type, 'ai'));
        set((state) => ({
          byTestId: {
            ...state.byTestId,
            [mockTestId]: [...batch, ...(state.byTestId[mockTestId] ?? [])],
          },
        }));
        return { ok: true, added: count };
      },

      updateQuestion: (mockTestId, questionId, question) => {
        set((state) => ({
          byTestId: {
            ...state.byTestId,
            [mockTestId]: (state.byTestId[mockTestId] ?? []).map((q) =>
              q.id === questionId ? { ...question, id: questionId, updatedAt: new Date().toISOString() } : q
            ),
          },
        }));
      },

      deleteQuestion: (mockTestId, questionId) => {
        set((state) => ({
          byTestId: {
            ...state.byTestId,
            [mockTestId]: (state.byTestId[mockTestId] ?? []).filter((q) => q.id !== questionId),
          },
        }));
      },

      setQuestions: (mockTestId, questions) => {
        set((state) => ({
          byTestId: { ...state.byTestId, [mockTestId]: questions },
        }));
      },

      migrateTestId: (fromId, toId) => {
        set((state) => {
          const questions = state.byTestId[fromId] ?? [];
          const next = { ...state.byTestId };
          if (questions.length) next[toId] = questions;
          delete next[fromId];
          return { byTestId: next };
        });
      },

      deleteTestQuestions: (mockTestId) => {
        set((state) => {
          const next = { ...state.byTestId };
          delete next[mockTestId];
          return { byTestId: next };
        });
      },
    }),
    {
      name: STORAGE_KEY,
      storage: {
        getItem: (name) => {
          const raw = localStorage.getItem(name);
          if (!raw) return null;
          try {
            return JSON.parse(raw);
          } catch {
            localStorage.removeItem(name);
            return null;
          }
        },
        setItem: (name, value) => localStorage.setItem(name, JSON.stringify(value)),
        removeItem: (name) => localStorage.removeItem(name),
      },
    }
  )
);
