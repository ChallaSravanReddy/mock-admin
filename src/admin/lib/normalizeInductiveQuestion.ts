import { parseShapeGrid, gridHasShapes } from '../components/inductive/InductiveGridDisplay';
import { generateInductiveQuestion } from './hackathonGenerators';
import type { InductiveChallengeQuestion } from '../types/inductiveChallenge';

export interface NormalizedInductiveItem {
  id: string;
  examplePair: { gridA: ReturnType<typeof parseShapeGrid>; gridB: ReturnType<typeof parseShapeGrid> };
  options: Array<{ id: string; grid: ReturnType<typeof parseShapeGrid>; isCorrect: boolean }>;
  correctOptionIds: string[];
  displayDurationMs: number;
  rule: string;
}

function normalizeOne(qd: Record<string, unknown>, fallbackCorrect: string[]): NormalizedInductiveItem {
  const exampleRaw = qd.examplePair ?? qd.example_pair;
  let gridA: ReturnType<typeof parseShapeGrid> = [];
  let gridB: ReturnType<typeof parseShapeGrid> = [];

  if (exampleRaw && typeof exampleRaw === 'object' && !Array.isArray(exampleRaw)) {
    const ep = exampleRaw as Record<string, unknown>;
    gridA = parseShapeGrid(ep.gridA ?? ep.grid_a);
    gridB = parseShapeGrid(ep.gridB ?? ep.grid_b);
  } else {
    gridA = parseShapeGrid(qd.grid_a ?? qd.gridA);
    gridB = parseShapeGrid(qd.grid_b ?? qd.gridB);
  }

  let options: NormalizedInductiveItem['options'];
  if (Array.isArray(qd.options) && qd.options.length > 0) {
    options = (qd.options as Array<Record<string, unknown>>).map((o) => ({
      id: String(o.id ?? '?'),
      grid: parseShapeGrid(o.grid),
      isCorrect: Boolean(o.isCorrect ?? o.is_correct),
    }));
  } else {
    options = [
      { id: 'A', grid: parseShapeGrid(qd.option_a), isCorrect: false },
      { id: 'B', grid: parseShapeGrid(qd.option_b), isCorrect: false },
      { id: 'C', grid: parseShapeGrid(qd.option_c), isCorrect: false },
      { id: 'D', grid: parseShapeGrid(qd.option_d), isCorrect: false },
    ];
  }

  const correctOptionIds = (
    (qd.correctOptionIds as string[] | undefined) ??
    (qd.correct_option_ids as string[] | undefined) ??
    fallbackCorrect
  ).filter(Boolean);

  if (!gridHasShapes(gridA) || !gridHasShapes(gridB)) {
    const sample = generateInductiveQuestion(0);
    if (!gridHasShapes(gridA)) gridA = sample.examplePair.gridA;
    if (!gridHasShapes(gridB)) gridB = sample.examplePair.gridB;
  }

  options = options.map((o) => ({
    ...o,
    grid: gridHasShapes(o.grid) ? o.grid : sampleOptionGrid(o.id, options),
    isCorrect: correctOptionIds.includes(o.id) || o.isCorrect,
  }));

  return {
    id: String(qd.id ?? `qd-${Math.random().toString(36).slice(2, 9)}`),
    examplePair: { gridA, gridB },
    options,
    correctOptionIds:
      correctOptionIds.length > 0
        ? correctOptionIds
        : options.filter((o) => o.isCorrect).map((o) => o.id),
    displayDurationMs:
      (qd.displayDurationMs as number | undefined) ??
      (qd.display_duration_ms as number | undefined) ??
      30000,
    rule: String(qd.rule ?? qd.rule_note ?? ''),
  };
}

function sampleOptionGrid(
  id: string,
  options: NormalizedInductiveItem['options']
): ReturnType<typeof parseShapeGrid> {
  const sample = generateInductiveQuestion(0);
  const match = sample.options.find((o) => o.id === id);
  if (match) return match.grid;
  const idx = ['A', 'B', 'C', 'D'].indexOf(id);
  return sample.options[idx >= 0 ? idx : 0]?.grid ?? parseShapeGrid(null);
}

/** Normalize viewer question payload → playable inductive items */
export function normalizeInductiveQuestions(q: Record<string, unknown>): NormalizedInductiveItem[] {
  const fallbackCorrect = Array.isArray(q.correct) ? (q.correct as string[]) : [];
  const rawList =
    (q.questionsData as unknown[]) ??
    (q.questions as unknown[]) ??
    (q.payload as Record<string, unknown> | undefined)?.questions;

  if (Array.isArray(rawList) && rawList.length > 0) {
    return rawList.map((item) =>
      normalizeOne(item as Record<string, unknown>, fallbackCorrect)
    );
  }

  if (q.examplePair || q.example_pair || q.grid_a || q.gridA) {
    return [normalizeOne(q as Record<string, unknown>, fallbackCorrect)];
  }

  return [normalizeOne({}, fallbackCorrect)];
}

export function inductiveQuestionFromPayload(
  questions: InductiveChallengeQuestion[]
): InductiveChallengeQuestion[] {
  return questions.map((qd) => {
    const n = normalizeOne(qd as unknown as Record<string, unknown>, qd.correctOptionIds ?? []);
    return {
      ...qd,
      id: qd.id || n.id,
      examplePair: n.examplePair,
      options: n.options.map((o) => ({
        id: o.id,
        grid: o.grid,
        isCorrect: n.correctOptionIds.includes(o.id),
      })),
      correctOptionIds: n.correctOptionIds,
      displayDurationMs: n.displayDurationMs,
      rule: n.rule || qd.rule,
    };
  });
}
