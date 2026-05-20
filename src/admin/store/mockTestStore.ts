import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import { MockTest, CreateMockTestDTO } from '../types';

interface MockTestStore {
  mockTests: MockTest[];
  selectedTest: MockTest | null;
  isLoading: boolean;
  error: string | null;
  setMockTests: (tests: MockTest[]) => void;
  setSelectedTest: (test: MockTest | null) => void;
  addMockTest: (test: MockTest) => void;
  updateMockTest: (id: string, updates: Partial<MockTest>) => void;
  deleteMockTest: (id: string) => void;
  togglePublishStatus: (id: string) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
}

export const useMockTestStore = create<MockTestStore>()(
  devtools(
    (set) => ({
      mockTests: [],
      selectedTest: null,
      isLoading: false,
      error: null,

      setMockTests: (tests) => set({ mockTests: tests }),

      setSelectedTest: (test) => set({ selectedTest: test }),

      addMockTest: (test) =>
        set((state) => ({
          mockTests: [...state.mockTests, test],
        })),

      updateMockTest: (id, updates) =>
        set((state) => ({
          mockTests: state.mockTests.map((test) =>
            test.id === id ? { ...test, ...updates } : test
          ),
          selectedTest:
            state.selectedTest?.id === id
              ? { ...state.selectedTest, ...updates }
              : state.selectedTest,
        })),

      deleteMockTest: (id) =>
        set((state) => ({
          mockTests: state.mockTests.filter((test) => test.id !== id),
          selectedTest: state.selectedTest?.id === id ? null : state.selectedTest,
        })),

      togglePublishStatus: (id) =>
        set((state) => ({
          mockTests: state.mockTests.map((test) =>
            test.id === id ? { ...test, published: !test.published } : test
          ),
        })),

      setLoading: (loading) => set({ isLoading: loading }),

      setError: (error) => set({ error }),
    }),
    { name: 'MockTestStore' }
  )
);
