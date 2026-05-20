import { MockTest } from '../types';
import { supabase } from '../../lib/supabase';

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
    return trySupabase<any[]>(
      async (): Promise<any[]> => {
        const { data: links, error: linksError } = await supabase
          .from('mock_test_questions')
          .select('*')
          .eq('mock_test_id', mockTestId)
          .order('sequence_order', { ascending: true });

        if (linksError) throw linksError;
        if (!links || links.length === 0) return [];

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
              questions.push({
                id: q.id,
                type: 'switch_challenge',
                title: q.title || 'Switch Question',
                inputSymbols: q.input_symbols,
                outputSymbols: q.output_symbols,
                options: q.options,
                correct: q.correct_option,
                difficulty: q.difficulty,
                timeDuration: q.time_duration_sec,
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

              questions.push({
                id: q.id,
                type: 'grid_challenge',
                title: q.title || 'Grid Challenge',
                description: q.description || 'Remember the highlighted dot and judge symmetry',
                rounds: q.total_rounds,
                difficulty: q.difficulty,
                roundsData: rounds || [],
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

              questions.push({
                id: q.id,
                type: 'motion_challenge',
                title: q.title || 'Motion Challenge',
                description: q.description || 'Guide the red ball into the hole',
                maxMoves: levels?.[0]?.max_moves || 10,
                levelsData: levels || [],
              });
            }
          }
        }
        return questions;
      },
      async (): Promise<any[]> => {
        // Dynamic import to prevent circular dependency issues
        const { questionsData } = await import('./questionService');
        const { swithChallengeService } = await import('./swithChallengeService');
        const { gridChallengeService } = await import('./gridChallengeService');
        const { inductiveChallengeService } = await import('./inductiveChallengeService');
        const { motionChallengeService } = await import('./motionChallengeService');

        const localQuestions: any[] = [];

        // 1. Puzzle
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

        // 2. Switch
        const switchGames = (swithChallengeService as any).games?.filter((g: any) => g.mockTestId === mockTestId) || [];
        switchGames.forEach((g: any) => {
          localQuestions.push({
            id: g.id,
            type: 'switch_challenge',
            title: g.title,
            inputSymbols: g.inputSymbols,
            outputSymbols: g.outputSymbols,
            options: g.options,
            correct: g.correctOption,
          });
        });

        // 3. Grid
        const gridGames = (gridChallengeService as any).games?.filter((g: any) => g.mockTestId === mockTestId) || [];
        gridGames.forEach((g: any) => {
          localQuestions.push({
            id: g.id,
            type: 'grid_challenge',
            title: g.title,
            description: g.description,
            rounds: g.totalRounds,
            roundsData: g.rounds,
          });
        });

        // 4. Inductive
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

        // 5. Motion
        const motionGames = (motionChallengeService as any).games?.filter((g: any) => g.mockTestId === mockTestId) || [];
        motionGames.forEach((g: any) => {
          localQuestions.push({
            id: g.id,
            type: 'motion_challenge',
            title: g.title,
            description: g.description,
            maxMoves: g.levels[0]?.maxMoves || 10,
            levelsData: g.levels,
          });
        });

        return localQuestions;
      }
    );
  },
};
