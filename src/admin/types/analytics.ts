export type AnalyticsMetrics = {
  totalMockTests: number;
  totalQuestions: number;
  totalAttempts: number;
  averageScore: number;
  publishedTests: number;
};

export type AttemptResult = {
  id: string;
  userId: string;
  mockTestId: string;
  mockTestTitle: string;
  score: number;
  totalQuestions: number;
  correctAnswers: number;
  accuracy: number;
  timeTaken: number;
  attemptedAt: string;
};
