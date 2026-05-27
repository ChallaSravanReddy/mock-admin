import type { GameTypeId } from '../constants/gameTypes';
import { getGameTypeConfig } from '../constants/gameTypes';
import type { HackathonQuestion } from '../types/hackathon';

export interface AssessmentRound {
  roundNumber: number;
  type: GameTypeId;
  label: string;
  shortLabel: string;
  questions: HackathonQuestion[];
}

export function getQuestionMarks(q: HackathonQuestion): number {
  switch (q.type) {
    case 'puzzle':
      return 10;
    case 'switch_challenge':
      return q.payload.scoringRules?.correctPoints ?? 3;
    case 'grid_challenge':
      return q.payload.scoringRules?.correctPoints ?? 3;
    case 'inductive_challenge':
      return q.payload.scoringRules?.correctPoints ?? 3;
    case 'motion_challenge':
      return q.payload.scoringRules?.correctPoints ?? 4;
    default:
      return 10;
  }
}

export function getQuestionPreviewText(q: HackathonQuestion): string {
  const text = (q.description || q.title || '').trim();
  if (text.length > 220) return `${text.slice(0, 217)}…`;
  return text || 'Untitled question';
}

export function getQuestionSubDomain(q: HackathonQuestion): string {
  const cfg = getGameTypeConfig(q.type);
  const diff = q.difficulty ? q.difficulty.charAt(0).toUpperCase() + q.difficulty.slice(1) : '';
  return diff ? `${cfg.shortLabel} · ${diff}` : cfg.shortLabel;
}

export function groupQuestionsIntoRounds(
  questions: HackathonQuestion[],
  enabledTypes: GameTypeId[]
): AssessmentRound[] {
  const order = enabledTypes.length > 0 ? enabledTypes : ([...new Set(questions.map((q) => q.type))] as GameTypeId[]);

  let roundNum = 0;
  return order.map((type) => {
    roundNum += 1;
    const cfg = getGameTypeConfig(type);
    const roundQuestions = questions.filter((q) => q.type === type);
    return {
      roundNumber: roundNum,
      type,
      label: cfg.label,
      shortLabel: cfg.shortLabel,
      questions: roundQuestions,
    };
  });
}

export function computeTotalMarks(questions: HackathonQuestion[]): number {
  return questions.reduce((sum, q) => sum + getQuestionMarks(q), 0);
}

export function formatAssessmentDate(iso: string): string {
  try {
    return new Date(iso).toLocaleDateString('en-GB', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  } catch {
    return '—';
  }
}
