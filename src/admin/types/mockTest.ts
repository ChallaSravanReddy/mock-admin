export type MockTest = {
  id: string;
  title: string;
  description: string;
  durationMinutes: number;
  totalQuestions: number;
  published: boolean;
  createdAt: string;
  category?: string;
  difficulty?: 'easy' | 'medium' | 'hard';
  enabledGameTypes?: string[];
};

export type CreateMockTestDTO = Omit<MockTest, 'id' | 'createdAt'>;
export type UpdateMockTestDTO = Partial<CreateMockTestDTO>;
