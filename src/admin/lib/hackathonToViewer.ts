import type { HackathonQuestion } from '../types/hackathon';
import { inductiveQuestionFromPayload } from './normalizeInductiveQuestion';
import { normalizeSwitchQuestion } from './normalizeSwitchQuestion';
import { normalizeGridQuestion } from './normalizeGridQuestion';
import { normalizeMotionQuestion } from './normalizeMotionQuestion';

/** Convert stored test question → shape expected by MockTestViewer */
export function hackathonToViewerQuestion(q: HackathonQuestion): Record<string, unknown> {
  const base = {
    id: q.id,
    type: q.type,
    title: q.title,
    description: q.description,
    difficulty: q.difficulty,
  };

  switch (q.type) {
    case 'puzzle':
      return {
        ...base,
        prompt: q.description || 'What symbol completes the grid?',
        grid: q.payload.grid,
        missingCell: q.payload.missingCell,
        options: q.payload.options.filter((o) => o !== null),
        correct: q.payload.correctAnswer,
      };
    case 'switch_challenge': {
      const sw = normalizeSwitchQuestion({
        inputSymbols: q.payload.inputSymbols,
        outputSymbols: q.payload.outputSymbols,
        options: q.payload.options,
        correct: q.payload.correctOption,
        timeDuration: q.payload.timeDuration,
        scoringCorrect: q.payload.scoringRules?.correctPoints,
      });
      return {
        ...base,
        inputSymbols: sw.inputSymbols,
        outputSymbols: sw.outputSymbols,
        options: sw.options,
        correct: sw.correct,
        timeDuration: sw.timeDuration,
        scoringCorrect: sw.scoringCorrect,
      };
    }
    case 'grid_challenge': {
      const grid = normalizeGridQuestion({
        roundsData: q.payload.rounds,
        totalRounds: q.payload.totalRounds,
        description: q.description || q.payload.description,
        symmetryDisplayMs: q.payload.symmetryDisplayMs,
        scoringCorrect: q.payload.scoringRules?.correctPoints,
      });
      return {
        ...base,
        rounds: grid.totalRounds,
        roundsData: grid.rounds,
        description: grid.description,
        symmetryDisplayMs: grid.symmetryDisplayMs,
        scoringCorrect: grid.scoringCorrect,
      };
    }
    case 'inductive_challenge': {
      const questions = inductiveQuestionFromPayload(q.payload.questions ?? []);
      return {
        ...base,
        options: ['A', 'B', 'C', 'D'],
        correct: questions[0]?.correctOptionIds ?? [],
        questionsData: questions,
        scoringCorrect: q.payload.scoringRules?.correctPoints,
      };
    }
    case 'motion_challenge': {
      const motion = normalizeMotionQuestion({
        levelsData: q.payload.levels,
        description: q.description || q.payload.description,
        timeDurationSeconds: q.payload.timeDurationSeconds,
      });
      return {
        ...base,
        description: motion.description,
        maxMoves: motion.maxMoves,
        timeDurationSeconds: motion.timeDurationSeconds,
        levelsData: motion.levels,
      };
    }
    default:
      return base;
  }
}
