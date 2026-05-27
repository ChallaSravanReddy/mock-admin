import type { GameTypeId } from '../constants/gameTypes';
import type { Question } from './puzzle';
import type { SwithChallengeGame } from './swithChallenge';
import type { GridChallengeGame } from './gridChallenge';
import type { InductiveChallengeGame } from './inductiveChallenge';
import type { MotionChallengeGame } from './motionChallenge';

export type HackathonSource = 'ai' | 'manual';
export type HackathonDifficulty = 'easy' | 'medium' | 'hard';

export interface HackathonQuestionMeta {
  id: string;
  title: string;
  description: string;
  difficulty: HackathonDifficulty;
  source: HackathonSource;
  createdAt: string;
  updatedAt: string;
}

export type HackathonQuestion =
  | (HackathonQuestionMeta & { type: 'puzzle'; payload: Omit<Question, 'id' | 'mockTestId' | 'sequence'> })
  | (HackathonQuestionMeta & { type: 'switch_challenge'; payload: Omit<SwithChallengeGame, 'id' | 'createdAt' | 'updatedAt' | 'published' | 'mockTestId'> })
  | (HackathonQuestionMeta & { type: 'grid_challenge'; payload: Omit<GridChallengeGame, 'id' | 'createdAt' | 'updatedAt' | 'published' | 'mockTestId'> })
  | (HackathonQuestionMeta & { type: 'inductive_challenge'; payload: Omit<InductiveChallengeGame, 'id' | 'createdAt' | 'updatedAt' | 'published' | 'mockTestId'> })
  | (HackathonQuestionMeta & { type: 'motion_challenge'; payload: Omit<MotionChallengeGame, 'id' | 'createdAt' | 'updatedAt' | 'published' | 'mockTestId'> });

export type HackathonQuestionPayload = HackathonQuestion['payload'];
