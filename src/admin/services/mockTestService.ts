import { MockTest } from '../types';
import { supabase } from '../../lib/supabase';
import type { HackathonQuestion } from '../types/hackathon';

const LOCAL_STORAGE_KEY = 'mock_admin_mock_tests';

const loadMockTests = (): MockTest[] => {
  const stored = localStorage.getItem(LOCAL_STORAGE_KEY);
  if (stored) {
    try {
      return JSON.parse(stored);
    } catch {
      // ignore
    }
  }
  return [
    {
      id: '1',
      title: 'Matrix Reasoning Level 1',
      description: 'Basic matrix puzzle questions',
      durationMinutes: 15,
      totalQuestions: 10,
      published: true,
      createdAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
      category: 'Reasoning',
      difficulty: 'easy',
      enabledGameTypes: ['puzzle', 'switch_challenge'],
    },
    {
      id: '2',
      title: 'Advanced Pattern Recognition',
      description: 'Complex pattern and sequence questions',
      durationMinutes: 30,
      totalQuestions: 15,
      published: true,
      createdAt: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000).toISOString(),
      category: 'Pattern',
      difficulty: 'hard',
      enabledGameTypes: ['puzzle', 'switch_challenge', 'grid_challenge'],
    },
  ];
};

export const mockTestsData: MockTest[] = loadMockTests();

const saveMockTests = () => {
  localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(mockTestsData));
};

// Helper to check if we can query the mock_tests table in Supabase
const trySupabase = async <T>(
  operation: () => Promise<T>,
  fallback: () => Promise<T>
): Promise<T> => {
  try {
    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
    const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
    if (!supabaseUrl || !supabaseAnonKey) {
      return await fallback();
    }
    return await operation();
  } catch (error) {
    console.warn('Supabase operation failed, falling back to local storage:', error);
    return await fallback();
  }
};

export const mockTestService = {
  // Fetch all mock tests
  getAllMockTests: async (): Promise<MockTest[]> => {
    return trySupabase<MockTest[]>(
      async (): Promise<MockTest[]> => {
        const { data, error } = await supabase
          .from('mock_tests')
          .select('*')
          .order('created_at', { ascending: false });

        if (error) throw error;
        if (!data) return [];

        return data.map((t: any) => ({
          id: t.id,
          title: t.title,
          description: t.description,
          durationMinutes: t.duration_minutes,
          totalQuestions: t.total_questions,
          published: t.published,
          createdAt: t.created_at,
          category: t.category,
          difficulty: t.difficulty,
          enabledGameTypes: t.enabled_game_types,
        }));
      },
      async (): Promise<MockTest[]> => {
        return mockTestsData;
      }
    );
  },

  // Fetch single mock test
  getMockTestById: async (id: string): Promise<MockTest | null> => {
    return trySupabase<MockTest | null>(
      async (): Promise<MockTest | null> => {
        const { data, error } = await supabase
          .from('mock_tests')
          .select('*')
          .eq('id', id)
          .single();

        if (error) throw error;
        if (!data) return null;

        return {
          id: data.id,
          title: data.title,
          description: data.description,
          durationMinutes: data.duration_minutes,
          totalQuestions: data.total_questions,
          published: data.published,
          createdAt: data.created_at,
          category: data.category,
          difficulty: data.difficulty,
          enabledGameTypes: data.enabled_game_types,
        };
      },
      async (): Promise<MockTest | null> => {
        return mockTestsData.find((test) => test.id === id) || null;
      }
    );
  },

  // Create new mock test
  createMockTest: async (data: Omit<MockTest, 'id' | 'createdAt'>): Promise<MockTest> => {
    return trySupabase<MockTest>(
      async (): Promise<MockTest> => {
        const { data: newRow, error } = await supabase
          .from('mock_tests')
          .insert({
            title: data.title,
            description: data.description,
            duration_minutes: data.durationMinutes,
            total_questions: data.totalQuestions,
            published: data.published,
            category: data.category,
            difficulty: data.difficulty,
            enabled_game_types: data.enabledGameTypes,
          })
          .select()
          .single();

        if (error) throw error;
        return {
          id: newRow.id,
          title: newRow.title,
          description: newRow.description,
          durationMinutes: newRow.duration_minutes,
          totalQuestions: newRow.total_questions,
          published: newRow.published,
          createdAt: newRow.created_at,
          category: newRow.category,
          difficulty: newRow.difficulty,
          enabledGameTypes: newRow.enabled_game_types,
        };
      },
      async (): Promise<MockTest> => {
        const newTest: MockTest = {
          ...data,
          id: Date.now().toString(),
          createdAt: new Date().toISOString(),
        };
        mockTestsData.push(newTest);
        saveMockTests();
        return newTest;
      }
    );
  },

  // Update mock test
  updateMockTest: async (id: string, updates: Partial<MockTest>): Promise<MockTest> => {
    return trySupabase<MockTest>(
      async (): Promise<MockTest> => {
        const mappedUpdates: any = {};
        if (updates.title !== undefined) mappedUpdates.title = updates.title;
        if (updates.description !== undefined) mappedUpdates.description = updates.description;
        if (updates.durationMinutes !== undefined) mappedUpdates.duration_minutes = updates.durationMinutes;
        if (updates.totalQuestions !== undefined) mappedUpdates.total_questions = updates.totalQuestions;
        if (updates.published !== undefined) mappedUpdates.published = updates.published;
        if (updates.category !== undefined) mappedUpdates.category = updates.category;
        if (updates.difficulty !== undefined) mappedUpdates.difficulty = updates.difficulty;
        if (updates.enabledGameTypes !== undefined) mappedUpdates.enabled_game_types = updates.enabledGameTypes;

        const { data: updatedRow, error } = await supabase
          .from('mock_tests')
          .update(mappedUpdates)
          .eq('id', id)
          .select()
          .single();

        if (error) throw error;
        return {
          id: updatedRow.id,
          title: updatedRow.title,
          description: updatedRow.description,
          durationMinutes: updatedRow.duration_minutes,
          totalQuestions: updatedRow.total_questions,
          published: updatedRow.published,
          createdAt: updatedRow.created_at,
          category: updatedRow.category,
          difficulty: updatedRow.difficulty,
          enabledGameTypes: updatedRow.enabled_game_types,
        };
      },
      async (): Promise<MockTest> => {
        const index = mockTestsData.findIndex((test) => test.id === id);
        if (index === -1) {
          throw new Error('Mock test not found');
        }
        const updated = { ...mockTestsData[index], ...updates };
        mockTestsData[index] = updated;
        saveMockTests();
        return updated;
      }
    );
  },

  // Delete mock test
  deleteMockTest: async (id: string): Promise<void> => {
    return trySupabase(
      async () => {
        const { error } = await supabase
          .from('mock_tests')
          .delete()
          .eq('id', id);
        if (error) throw error;
      },
      async () => {
        const index = mockTestsData.findIndex((test) => test.id === id);
        if (index === -1) {
          throw new Error('Mock test not found');
        }
        mockTestsData.splice(index, 1);
        saveMockTests();
      }
    );
  },

  // Toggle publish status
  togglePublish: async (id: string): Promise<MockTest> => {
    return trySupabase<MockTest>(
      async (): Promise<MockTest> => {
        const { data: current, error: fetchError } = await supabase
          .from('mock_tests')
          .select('published')
          .eq('id', id)
          .single();
        if (fetchError) throw fetchError;

        const { data: updatedRow, error: updateError } = await supabase
          .from('mock_tests')
          .update({ published: !current.published })
          .eq('id', id)
          .select()
          .single();

        if (updateError) throw updateError;
        return {
          id: updatedRow.id,
          title: updatedRow.title,
          description: updatedRow.description,
          durationMinutes: updatedRow.duration_minutes,
          totalQuestions: updatedRow.total_questions,
          published: updatedRow.published,
          createdAt: updatedRow.created_at,
          category: updatedRow.category,
          difficulty: updatedRow.difficulty,
          enabledGameTypes: updatedRow.enabled_game_types,
        };
      },
      async (): Promise<MockTest> => {
        const test = mockTestsData.find((t) => t.id === id);
        if (!test) {
          throw new Error('Mock test not found');
        }
        test.published = !test.published;
        saveMockTests();
        return test;
      }
    );
  },

  // Search mock tests
  searchMockTests: async (query: string): Promise<MockTest[]> => {
    return trySupabase<MockTest[]>(
      async (): Promise<MockTest[]> => {
        const { data, error } = await supabase
          .from('mock_tests')
          .select('*')
          .or(`title.ilike.%${query}%,description.ilike.%${query}%`);
        if (error) throw error;
        if (!data) return [];
        return data.map((t: any) => ({
          id: t.id,
          title: t.title,
          description: t.description,
          durationMinutes: t.duration_minutes,
          totalQuestions: t.total_questions,
          published: t.published,
          createdAt: t.created_at,
          category: t.category,
          difficulty: t.difficulty,
          enabledGameTypes: t.enabled_game_types,
        }));
      },
      async (): Promise<MockTest[]> => {
        return mockTestsData.filter(
          (test) =>
            test.title.toLowerCase().includes(query.toLowerCase()) ||
            test.description.toLowerCase().includes(query.toLowerCase())
        );
      }
    );
  },

  // Link a created question/game to a mock test
  linkQuestionToTest: async (
    mockTestId: string,
    gameType: 'puzzle' | 'switch_challenge' | 'grid_challenge' | 'inductive_challenge' | 'motion_challenge',
    questionRefId: string,
    sequenceOrder = 1
  ): Promise<void> => {
    try {
      // 1. Get or create section for mockTestId and gameType
      let { data: section, error: sectionError } = await supabase
        .from('mock_test_sections')
        .select('id')
        .eq('mock_test_id', mockTestId)
        .eq('game_type', gameType)
        .maybeSingle();

      if (sectionError) throw sectionError;

      if (!section) {
        const { data: newSection, error: createSectionError } = await supabase
          .from('mock_test_sections')
          .insert({
            mock_test_id: mockTestId,
            game_type: gameType,
            section_order: 1,
            title: `${gameType.replace('_', ' ').replace(/\b\w/g, c => c.toUpperCase())} Section`,
          })
          .select('id')
          .single();

        if (createSectionError) throw createSectionError;
        section = newSection;
      }

      // Get the next sequence order to avoid UNIQUE (section_id, sequence_order) constraint violations
      const { data: existingQuestions, error: seqError } = await supabase
        .from('mock_test_questions')
        .select('sequence_order')
        .eq('section_id', section!.id);

      let finalSequenceOrder = sequenceOrder;
      if (!seqError && existingQuestions) {
        const usedOrders = new Set(existingQuestions.map(q => q.sequence_order));
        while (usedOrders.has(finalSequenceOrder)) {
          finalSequenceOrder++;
        }
      }

      // 2. Insert mock_test_questions link
      const { error: linkError } = await supabase
        .from('mock_test_questions')
        .insert({
          section_id: section!.id,
          mock_test_id: mockTestId,
          game_type: gameType,
          question_ref_id: questionRefId,
          sequence_order: finalSequenceOrder,
        });

      if (linkError) throw linkError;
    } catch (err) {
      console.error('Error linking question to test in Supabase:', err);
      // Fallback: update local totalQuestions count
      const test = mockTestsData.find((t) => t.id === mockTestId);
      if (test) {
        test.totalQuestions = (test.totalQuestions ?? 0) + 1;
        saveMockTests();
      }
    }
  },

  // Fetch all questions for a mock test
  getQuestionsForTest: async (mockTestId: string): Promise<any[]> => {
    // AI / manual questions added in Mock Test dialog live in local store — check first
    const { useMockTestQuestionsStore } = await import('../store/mockTestQuestionsStore');
    const { hackathonToViewerQuestion } = await import('../lib/hackathonToViewer');
    const stored = useMockTestQuestionsStore.getState().getQuestions(mockTestId);
    if (stored.length > 0) {
      return stored.map((q) => hackathonToViewerQuestion(q));
    }

    return trySupabase<any[]>(
      async (): Promise<any[]> => {
        const { data: links, error: linksError } = await supabase
          .from('mock_test_questions')
          .select('*')
          .eq('mock_test_id', mockTestId)
          .order('sequence_order', { ascending: true });

        if (linksError) throw linksError;
        if (!links || links.length === 0) {
          const again = useMockTestQuestionsStore.getState().getQuestions(mockTestId);
          if (again.length > 0) {
            return again.map((q) => hackathonToViewerQuestion(q));
          }
          return [];
        }

        const questions: any[] = [];

        for (const link of links) {
          const refId = link.question_ref_id;
          if (link.game_type === 'puzzle') {
            const { data: q, error } = await supabase
              .from('puzzle_questions')
              .select('*')
              .eq('id', refId)
              .single();
            if (!error && q) {
              questions.push({
                id: q.id,
                type: 'puzzle',
                title: q.title || 'Puzzle Question',
                prompt: 'What symbol completes the grid?',
                grid: q.grid,
                missingCell: q.missing_cell,
                options: q.options,
                correct: q.correct_answer,
                difficulty: q.difficulty,
              });
            }
          } else if (link.game_type === 'switch_challenge') {
            const { data: q, error } = await supabase
              .from('switch_challenge_games')
              .select('*')
              .eq('id', refId)
              .single();
            if (!error && q) {
              const { normalizeSwitchQuestion } = await import('../lib/normalizeSwitchQuestion');
              const sw = normalizeSwitchQuestion({
                input_symbols: q.input_symbols,
                output_symbols: q.output_symbols,
                options: q.options,
                correct_option: q.correct_option,
                time_duration_sec: q.time_duration_sec,
              });
              questions.push({
                id: q.id,
                type: 'switch_challenge',
                title: q.title || 'Switch Question',
                inputSymbols: sw.inputSymbols,
                outputSymbols: sw.outputSymbols,
                options: sw.options,
                correct: sw.correct,
                difficulty: q.difficulty,
                timeDuration: sw.timeDuration,
              });
            }
          } else if (link.game_type === 'grid_challenge') {
            const { data: q, error } = await supabase
              .from('grid_challenge_games')
              .select('*')
              .eq('id', refId)
              .single();
            if (!error && q) {
              const { data: rounds } = await supabase
                .from('grid_challenge_rounds')
                .select('*')
                .eq('game_id', q.id)
                .order('round_order', { ascending: true });

              const { normalizeGridQuestion } = await import('../lib/normalizeGridQuestion');
              const grid = normalizeGridQuestion({
                roundsData: rounds || [],
                totalRounds: q.total_rounds,
                description: q.description,
              });
              questions.push({
                id: q.id,
                type: 'grid_challenge',
                title: q.title || 'Grid Challenge',
                description: grid.description,
                rounds: grid.totalRounds,
                difficulty: q.difficulty,
                roundsData: grid.rounds,
                symmetryDisplayMs: grid.symmetryDisplayMs,
              });
            }
          } else if (link.game_type === 'inductive_challenge') {
            const { data: q, error } = await supabase
              .from('inductive_challenge_games')
              .select('*')
              .eq('id', refId)
              .single();
            if (!error && q) {
              const { data: qList } = await supabase
                .from('inductive_challenge_questions')
                .select('*')
                .eq('game_id', q.id)
                .order('question_order', { ascending: true });

              questions.push({
                id: q.id,
                type: 'inductive_challenge',
                title: q.title || 'Inductive Challenge',
                description: q.description || 'Find the rule and choose matching option grids',
                options: ['A', 'B', 'C', 'D'],
                correct: qList?.[0]?.correct_option_ids || [],
                questionsData: qList || [],
              });
            }
          } else if (link.game_type === 'motion_challenge') {
            const { data: q, error } = await supabase
              .from('motion_challenge_games')
              .select('*')
              .eq('id', refId)
              .single();
            if (!error && q) {
              const { data: levels } = await supabase
                .from('motion_challenge_levels')
                .select('*')
                .eq('game_id', q.id)
                .order('level_order', { ascending: true });

              const { normalizeMotionQuestion } = await import('../lib/normalizeMotionQuestion');
              const motion = normalizeMotionQuestion({
                levelsData: levels || [],
                description: q.description,
                time_duration_seconds: q.time_duration_seconds,
              });
              questions.push({
                id: q.id,
                type: 'motion_challenge',
                title: q.title || 'Motion Challenge',
                description: motion.description,
                maxMoves: motion.maxMoves,
                timeDurationSeconds: motion.timeDurationSeconds,
                levelsData: motion.levels,
              });
            }
          }
        }
        return questions;
      },
      async (): Promise<any[]> => {
        // Legacy fallback: questions linked via individual builder services
        const { questionsData } = await import('./questionService');
        const { swithChallengeService } = await import('./swithChallengeService');
        const { gridChallengeService } = await import('./gridChallengeService');
        const { inductiveChallengeService } = await import('./inductiveChallengeService');
        const { motionChallengeService } = await import('./motionChallengeService');

        const localQuestions: any[] = [];

        const pQuestions = questionsData.filter((q) => q.mockTestId === mockTestId);
        pQuestions.forEach((q) => {
          localQuestions.push({
            id: q.id,
            type: 'puzzle',
            title: 'Puzzle Question',
            prompt: 'What symbol completes the grid?',
            grid: q.grid,
            missingCell: q.missingCell,
            options: q.options,
            correct: q.correctAnswer,
          });
        });

        const switchGames = (swithChallengeService as any).games?.filter((g: any) => g.mockTestId === mockTestId) || [];
        const { normalizeSwitchQuestion: normalizeSwitch } = await import('../lib/normalizeSwitchQuestion');
        switchGames.forEach((g: any) => {
          const sw = normalizeSwitch({
            inputSymbols: g.inputSymbols,
            outputSymbols: g.outputSymbols,
            options: g.options,
            correct: g.correctOption,
            timeDuration: g.timeDuration,
          });
          localQuestions.push({
            id: g.id,
            type: 'switch_challenge',
            title: g.title,
            inputSymbols: sw.inputSymbols,
            outputSymbols: sw.outputSymbols,
            options: sw.options,
            correct: sw.correct,
            timeDuration: sw.timeDuration,
          });
        });

        const gridGames = (gridChallengeService as any).games?.filter((g: any) => g.mockTestId === mockTestId) || [];
        const { normalizeGridQuestion: normalizeGrid } = await import('../lib/normalizeGridQuestion');
        gridGames.forEach((g: any) => {
          const grid = normalizeGrid({
            roundsData: g.rounds,
            totalRounds: g.totalRounds,
            description: g.description,
            symmetryDisplayMs: g.symmetryDisplayMs,
          });
          localQuestions.push({
            id: g.id,
            type: 'grid_challenge',
            title: g.title,
            description: grid.description,
            rounds: grid.totalRounds,
            roundsData: grid.rounds,
            symmetryDisplayMs: grid.symmetryDisplayMs,
          });
        });

        const inductiveGames = (inductiveChallengeService as any).games?.filter((g: any) => g.mockTestId === mockTestId) || [];
        inductiveGames.forEach((g: any) => {
          localQuestions.push({
            id: g.id,
            type: 'inductive_challenge',
            title: g.title,
            description: g.description,
            options: ['A', 'B', 'C', 'D'],
            correct: g.questions[0]?.correctOptionIds || [],
            questionsData: g.questions,
          });
        });

        const motionGames = (motionChallengeService as any).games?.filter((g: any) => g.mockTestId === mockTestId) || [];
        const { normalizeMotionQuestion: normalizeMotion } = await import('../lib/normalizeMotionQuestion');
        motionGames.forEach((g: any) => {
          const motion = normalizeMotion({
            levelsData: g.levels,
            description: g.description,
            timeDurationSeconds: g.timeDurationSeconds,
          });
          localQuestions.push({
            id: g.id,
            type: 'motion_challenge',
            title: g.title,
            description: motion.description,
            maxMoves: motion.maxMoves,
            timeDurationSeconds: motion.timeDurationSeconds,
            levelsData: motion.levels,
          });
        });

        return localQuestions;
      }
    );
  },

  /**
   * Fetch questions for admin editing (HackathonQuestion shape).
   * If this browser already has local stored questions for the test, those win.
   * Otherwise, attempt to read legacy/Supabase-linked questions and convert them
   * into HackathonQuestion objects so the assessment detail UI can render/edit them.
   */
  getHackathonQuestionsForTest: async (mockTestId: string): Promise<HackathonQuestion[]> => {
    const { useMockTestQuestionsStore } = await import('../store/mockTestQuestionsStore');
    const stored = useMockTestQuestionsStore.getState().getQuestions(mockTestId);
    if (stored.length > 0) return stored;

    return trySupabase<HackathonQuestion[]>(
      async (): Promise<HackathonQuestion[]> => {
        const { data: links, error: linksError } = await supabase
          .from('mock_test_questions')
          .select('*')
          .eq('mock_test_id', mockTestId)
          .order('sequence_order', { ascending: true });

        if (linksError) throw linksError;
        if (!links || links.length === 0) return [];

        const now = new Date().toISOString();
        const result: HackathonQuestion[] = [];

        for (const link of links) {
          const refId = link.question_ref_id;
          if (link.game_type === 'puzzle') {
            const { data: q, error } = await supabase
              .from('puzzle_questions')
              .select('*')
              .eq('id', refId)
              .single();
            if (!error && q) {
              result.push({
                id: q.id,
                type: 'puzzle',
                title: q.title || 'Puzzle Question',
                description: q.prompt || q.description || 'What symbol completes the grid?',
                difficulty: q.difficulty || 'medium',
                source: 'manual',
                createdAt: q.created_at || now,
                updatedAt: q.updated_at || now,
                payload: {
                  gridSize: Array.isArray(q.grid) ? (q.grid[0]?.length ?? 3) : 3,
                  grid: q.grid,
                  missingCell: q.missing_cell,
                  options: q.options,
                  correctAnswer: q.correct_answer,
                  difficulty: q.difficulty || 'medium',
                },
              } as HackathonQuestion);
            }
          } else if (link.game_type === 'switch_challenge') {
            const { data: q, error } = await supabase
              .from('switch_challenge_games')
              .select('*')
              .eq('id', refId)
              .single();
            if (!error && q) {
              const { normalizeSwitchQuestion } = await import('../lib/normalizeSwitchQuestion');
              const sw = normalizeSwitchQuestion({
                input_symbols: q.input_symbols,
                output_symbols: q.output_symbols,
                options: q.options,
                correct_option: q.correct_option,
                time_duration_sec: q.time_duration_sec,
              });
              result.push({
                id: q.id,
                type: 'switch_challenge',
                title: q.title || 'Switch Challenge',
                description: q.description || 'Match the correct sequence mapping from top to bottom.',
                difficulty: q.difficulty || 'medium',
                source: 'manual',
                createdAt: q.created_at || now,
                updatedAt: q.updated_at || now,
                payload: {
                  title: q.title || 'Switch Challenge',
                  description: q.description || 'Match the correct sequence mapping from top to bottom.',
                  difficulty: q.difficulty || 'medium',
                  timeDuration: sw.timeDuration,
                  inputSymbols: sw.inputSymbols,
                  outputSymbols: sw.outputSymbols,
                  correctAnswerCode: sw.correct,
                  options: sw.options,
                  correctOption: sw.correct,
                  scoringRules: { correctPoints: 3, wrongPoints: -1 },
                },
              } as HackathonQuestion);
            }
          } else if (link.game_type === 'grid_challenge') {
            const { data: q, error } = await supabase
              .from('grid_challenge_games')
              .select('*')
              .eq('id', refId)
              .single();
            if (!error && q) {
              const { data: rounds } = await supabase
                .from('grid_challenge_rounds')
                .select('*')
                .eq('game_id', q.id)
                .order('round_order', { ascending: true });

              const { normalizeGridQuestion } = await import('../lib/normalizeGridQuestion');
              const grid = normalizeGridQuestion({
                roundsData: rounds || [],
                totalRounds: q.total_rounds,
                description: q.description,
                symmetryDisplayMs: q.symmetry_display_ms,
              });

              result.push({
                id: q.id,
                type: 'grid_challenge',
                title: q.title || 'Grid Challenge',
                description: grid.description || q.description || 'Grid rounds',
                difficulty: q.difficulty || 'medium',
                source: 'manual',
                createdAt: q.created_at || now,
                updatedAt: q.updated_at || now,
                payload: {
                  title: q.title || 'Grid Challenge',
                  description: grid.description || q.description || 'Grid rounds',
                  difficulty: q.difficulty || 'medium',
                  totalRounds: grid.totalRounds,
                  rounds: grid.rounds,
                  scoringRules: { correctPoints: 3, wrongPoints: -1 },
                  symmetryDisplayMs: grid.symmetryDisplayMs,
                },
              } as HackathonQuestion);
            }
          } else if (link.game_type === 'inductive_challenge') {
            const { data: q, error } = await supabase
              .from('inductive_challenge_games')
              .select('*')
              .eq('id', refId)
              .single();
            if (!error && q) {
              const { data: qList } = await supabase
                .from('inductive_challenge_questions')
                .select('*')
                .eq('game_id', q.id)
                .order('question_order', { ascending: true });

              const { normalizeInductiveQuestions } = await import('../lib/normalizeInductiveQuestion');
              const normalized = normalizeInductiveQuestions({ questionsData: qList || [] });
              const questions = normalized.map((n: any) => ({
                id: n.id,
                examplePair: n.examplePair,
                options: n.options,
                correctOptionIds: n.correctOptionIds,
                rule: n.rule,
                displayDurationMs: n.displayDurationMs,
              }));

              result.push({
                id: q.id,
                type: 'inductive_challenge',
                title: q.title || 'Inductive Challenge',
                description: q.description || 'Find the rule and choose matching option grids',
                difficulty: q.difficulty || 'medium',
                source: 'manual',
                createdAt: q.created_at || now,
                updatedAt: q.updated_at || now,
                payload: {
                  title: q.title || 'Inductive Challenge',
                  description: q.description || 'Find the rule and choose matching option grids',
                  difficulty: q.difficulty || 'medium',
                  questions,
                  scoringRules: { correctPoints: 3, wrongPoints: -1 },
                },
              } as HackathonQuestion);
            }
          } else if (link.game_type === 'motion_challenge') {
            const { data: q, error } = await supabase
              .from('motion_challenge_games')
              .select('*')
              .eq('id', refId)
              .single();
            if (!error && q) {
              const { data: levels } = await supabase
                .from('motion_challenge_levels')
                .select('*')
                .eq('game_id', q.id)
                .order('level_order', { ascending: true });

              const { normalizeMotionQuestion } = await import('../lib/normalizeMotionQuestion');
              const motion = normalizeMotionQuestion({
                levelsData: levels || [],
                description: q.description,
                time_duration_seconds: q.time_duration_seconds,
              });

              result.push({
                id: q.id,
                type: 'motion_challenge',
                title: q.title || 'Motion Challenge',
                description: motion.description || q.description || 'Solve the motion levels',
                difficulty: q.difficulty || 'medium',
                source: 'manual',
                createdAt: q.created_at || now,
                updatedAt: q.updated_at || now,
                payload: {
                  title: q.title || 'Motion Challenge',
                  description: motion.description || q.description || 'Solve the motion levels',
                  difficulty: q.difficulty || 'medium',
                  levels: motion.levels,
                  timeDurationSeconds: motion.timeDurationSeconds,
                  scoringRules: { correctPoints: 4, wrongPoints: -1 },
                },
              } as HackathonQuestion);
            }
          }
        }

        return result;
      },
      async (): Promise<HackathonQuestion[]> => {
        return [];
      }
    );
  },

  upsertHackathonQuestionToSupabase: async (
    mockTestId: string,
    question: HackathonQuestion
  ): Promise<{ ok: boolean; message?: string; saved?: HackathonQuestion }> => {
    const now = new Date().toISOString();

    return trySupabase(
      async () => {
        const baseMeta = {
          title: question.title,
          description: question.description,
          difficulty: question.difficulty,
          published: true,
        };

        const ensureLinked = async (gameType: HackathonQuestion['type'], refId: string) => {
          const { data: existing, error } = await supabase
            .from('mock_test_questions')
            .select('id')
            .eq('mock_test_id', mockTestId)
            .eq('game_type', gameType)
            .eq('question_ref_id', refId)
            .maybeSingle();

          if (!error && existing?.id) return;
          await mockTestService.linkQuestionToTest(mockTestId, gameType, refId, 1);
        };

        if (question.type === 'puzzle') {
          const p = question.payload;
          const { data: row, error } = await supabase
            .from('puzzle_questions')
            .upsert(
              {
                id: question.id,
                ...baseMeta,
                grid_size: p.gridSize,
                grid: p.grid,
                missing_cell: p.missingCell,
                options: (p.options ?? []).filter(Boolean),
                correct_answer: p.correctAnswer ?? '',
              },
              { onConflict: 'id' }
            )
            .select()
            .single();
          if (error) throw error;
          await ensureLinked('puzzle', row.id);
          return {
            ok: true,
            saved: {
              ...question,
              id: row.id,
              createdAt: question.createdAt || row.created_at || now,
              updatedAt: row.updated_at || now,
            },
          };
        }

        if (question.type === 'switch_challenge') {
          const p = question.payload;
          const { data: row, error } = await supabase
            .from('switch_challenge_games')
            .upsert(
              {
                id: question.id,
                ...baseMeta,
                time_duration_sec: p.timeDuration,
                input_symbols: p.inputSymbols,
                output_symbols: p.outputSymbols,
                correct_answer_code: p.correctAnswerCode ?? p.correctOption ?? '',
                options: p.options,
                correct_option: p.correctOption,
                scoring_correct: p.scoringRules?.correctPoints ?? 3,
                scoring_wrong: p.scoringRules?.wrongPoints ?? -1,
              },
              { onConflict: 'id' }
            )
            .select()
            .single();
          if (error) throw error;
          await ensureLinked('switch_challenge', row.id);
          return { ok: true, saved: { ...question, id: row.id, updatedAt: row.updated_at || now } };
        }

        if (question.type === 'grid_challenge') {
          const p = question.payload;
          const { data: row, error } = await supabase
            .from('grid_challenge_games')
            .upsert(
              {
                id: question.id,
                ...baseMeta,
                total_rounds: p.totalRounds ?? p.rounds?.length ?? 1,
                symmetry_display_ms: p.symmetryDisplayMs ?? 6000,
                scoring_correct: p.scoringRules?.correctPoints ?? 3,
                scoring_wrong: p.scoringRules?.wrongPoints ?? -1,
              },
              { onConflict: 'id' }
            )
            .select()
            .single();
          if (error) throw error;

          // Replace rounds
          await supabase.from('grid_challenge_rounds').delete().eq('game_id', row.id);
          for (let i = 0; i < (p.rounds ?? []).length; i++) {
            const r = p.rounds[i] as any;
            await supabase.from('grid_challenge_rounds').insert({
              game_id: row.id,
              round_order: i,
              dots: r.dotPhase?.dots ?? [],
              target_dot_id: r.dotPhase?.targetDotId ?? '',
              highlight_duration_ms: r.dotPhase?.highlightDurationMs ?? 2000,
              grid_left: r.symmetryPhase?.gridLeft ?? [],
              grid_right: r.symmetryPhase?.gridRight ?? [],
              is_symmetric: r.symmetryPhase?.isSymmetric ?? false,
              symmetry_label: r.symmetryPhase?.label ?? '',
            });
          }

          await ensureLinked('grid_challenge', row.id);
          return { ok: true, saved: { ...question, id: row.id, updatedAt: row.updated_at || now } };
        }

        if (question.type === 'inductive_challenge') {
          const p = question.payload as any;
          const displayDurationMs = p.questions?.[0]?.displayDurationMs ?? 30000;

          const { data: row, error } = await supabase
            .from('inductive_challenge_games')
            .upsert(
              {
                id: question.id,
                ...baseMeta,
                display_duration_ms: displayDurationMs,
                scoring_correct: p.scoringRules?.correctPoints ?? 3,
                scoring_wrong: p.scoringRules?.wrongPoints ?? -1,
              },
              { onConflict: 'id' }
            )
            .select()
            .single();
          if (error) throw error;

          await supabase.from('inductive_challenge_questions').delete().eq('game_id', row.id);
          const list = Array.isArray(p.questions) ? p.questions : [];
          for (let i = 0; i < list.length; i++) {
            const iq = list[i];
            const optionA = iq.options?.find((o: any) => o.id === 'A')?.grid ?? [];
            const optionB = iq.options?.find((o: any) => o.id === 'B')?.grid ?? [];
            const optionC = iq.options?.find((o: any) => o.id === 'C')?.grid ?? [];
            const optionD = iq.options?.find((o: any) => o.id === 'D')?.grid ?? [];
            await supabase.from('inductive_challenge_questions').insert({
              game_id: row.id,
              question_order: i,
              grid_a: iq.examplePair?.gridA ?? [],
              grid_b: iq.examplePair?.gridB ?? [],
              option_a: optionA,
              option_b: optionB,
              option_c: optionC,
              option_d: optionD,
              correct_option_ids: iq.correctOptionIds ?? [],
              rule_note: iq.rule ?? '',
            });
          }

          await ensureLinked('inductive_challenge', row.id);
          return { ok: true, saved: { ...question, id: row.id, updatedAt: row.updated_at || now } };
        }

        if (question.type === 'motion_challenge') {
          const p = question.payload as any;
          const { data: row, error } = await supabase
            .from('motion_challenge_games')
            .upsert(
              {
                id: question.id,
                ...baseMeta,
                time_duration_sec: p.timeDurationSeconds ?? 240,
                scoring_correct: p.scoringRules?.correctPoints ?? 4,
                scoring_wrong: p.scoringRules?.wrongPoints ?? -1,
              },
              { onConflict: 'id' }
            )
            .select()
            .single();
          if (error) throw error;

          await supabase.from('motion_challenge_levels').delete().eq('game_id', row.id);
          const levels = Array.isArray(p.levels) ? p.levels : [];
          for (let i = 0; i < levels.length; i++) {
            const lv = levels[i];
            await supabase.from('motion_challenge_levels').insert({
              game_id: row.id,
              level_order: i,
              label: lv.label || `Level ${i + 1}`,
              rows: lv.rows,
              cols: lv.cols,
              grid: lv.grid,
              max_moves: lv.maxMoves,
            });
          }

          await ensureLinked('motion_challenge', row.id);
          return { ok: true, saved: { ...question, id: row.id, updatedAt: row.updated_at || now } };
        }

        return { ok: false, message: 'Unsupported question type' };
      },
      async () => ({ ok: false, message: 'Supabase not configured' })
    );
  },

  deleteHackathonQuestionFromSupabase: async (
    mockTestId: string,
    question: HackathonQuestion
  ): Promise<{ ok: boolean; message?: string }> => {
    return trySupabase<{ ok: boolean; message?: string }>(
      async () => {
        // Unlink from test
        await supabase
          .from('mock_test_questions')
          .delete()
          .eq('mock_test_id', mockTestId)
          .eq('game_type', question.type)
          .eq('question_ref_id', question.id);

        // Delete underlying record (best-effort)
        if (question.type === 'puzzle') {
          await supabase.from('puzzle_questions').delete().eq('id', question.id);
        } else if (question.type === 'switch_challenge') {
          await supabase.from('switch_challenge_games').delete().eq('id', question.id);
        } else if (question.type === 'grid_challenge') {
          await supabase.from('grid_challenge_rounds').delete().eq('game_id', question.id);
          await supabase.from('grid_challenge_games').delete().eq('id', question.id);
        } else if (question.type === 'inductive_challenge') {
          await supabase.from('inductive_challenge_questions').delete().eq('game_id', question.id);
          await supabase.from('inductive_challenge_games').delete().eq('id', question.id);
        } else if (question.type === 'motion_challenge') {
          await supabase.from('motion_challenge_levels').delete().eq('game_id', question.id);
          await supabase.from('motion_challenge_games').delete().eq('id', question.id);
        }

        return { ok: true };
      },
      async () => ({ ok: false, message: 'Supabase not configured' })
    );
  },
};
