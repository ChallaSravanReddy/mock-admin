import { AttemptResult, AnalyticsMetrics } from '../types';

// Mock data
export const attemptsData: AttemptResult[] = [
  {
    id: '1',
    userId: 'user1',
    mockTestId: '1',
    mockTestTitle: 'Matrix Reasoning Level 1',
    score: 85,
    totalQuestions: 10,
    correctAnswers: 8,
    accuracy: 80,
    timeTaken: 720,
    attemptedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: '2',
    userId: 'user2',
    mockTestId: '1',
    mockTestTitle: 'Matrix Reasoning Level 1',
    score: 72,
    totalQuestions: 10,
    correctAnswers: 7,
    accuracy: 70,
    timeTaken: 850,
    attemptedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: '3',
    userId: 'user3',
    mockTestId: '2',
    mockTestTitle: 'Advanced Pattern Recognition',
    score: 92,
    totalQuestions: 15,
    correctAnswers: 14,
    accuracy: 93,
    timeTaken: 1500,
    attemptedAt: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: '4',
    userId: 'user1',
    mockTestId: '2',
    mockTestTitle: 'Advanced Pattern Recognition',
    score: 78,
    totalQuestions: 15,
    correctAnswers: 12,
    accuracy: 80,
    timeTaken: 1800,
    attemptedAt: new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: '5',
    userId: 'user4',
    mockTestId: '4',
    mockTestTitle: 'Logical Deduction Test',
    score: 88,
    totalQuestions: 14,
    correctAnswers: 12,
    accuracy: 86,
    timeTaken: 1200,
    attemptedAt: new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString(),
  },
];

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export const analyticsService = {
  // Get analytics metrics
  getAnalyticsMetrics: async (): Promise<AnalyticsMetrics> => {
    await delay(800);
    const totalAttempts = attemptsData.length;
    const averageScore =
      attemptsData.length > 0
        ? Math.round(
            attemptsData.reduce((sum, attempt) => sum + attempt.score, 0) / attemptsData.length
          )
        : 0;

    return {
      totalMockTests: 4,
      totalQuestions: 51,
      totalAttempts,
      averageScore,
      publishedTests: 3,
    };
  },

  // Get all attempts
  getAllAttempts: async (): Promise<AttemptResult[]> => {
    await delay(800);
    return attemptsData;
  },

  // Get attempts for specific mock test
  getAttemptsByMockTestId: async (mockTestId: string): Promise<AttemptResult[]> => {
    await delay(600);
    return attemptsData.filter((attempt) => attempt.mockTestId === mockTestId);
  },

  // Get attempts for specific user
  getAttemptsByUserId: async (userId: string): Promise<AttemptResult[]> => {
    await delay(600);
    return attemptsData.filter((attempt) => attempt.userId === userId);
  },

  // Get single attempt
  getAttemptById: async (id: string): Promise<AttemptResult | null> => {
    await delay(400);
    return attemptsData.find((attempt) => attempt.id === id) || null;
  },

  // Create attempt (simulate test submission)
  createAttempt: async (data: Omit<AttemptResult, 'id' | 'attemptedAt'>): Promise<AttemptResult> => {
    await delay(600);
    const newAttempt: AttemptResult = {
      ...data,
      id: Date.now().toString(),
      attemptedAt: new Date().toISOString(),
    };
    attemptsData.push(newAttempt);
    return newAttempt;
  },
};
