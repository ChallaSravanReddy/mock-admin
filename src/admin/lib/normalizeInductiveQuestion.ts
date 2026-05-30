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

export function areGridsIdentical(g1: ReturnType<typeof parseShapeGrid>, g2: ReturnType<typeof parseShapeGrid>): boolean {
  for (let r = 0; r < 3; r++) {
    for (let c = 0; c < 3; c++) {
      const cell1 = g1[r]?.[c];
      const cell2 = g2[r]?.[c];
      if (!cell1 && !cell2) continue;
      if (!cell1 || !cell2) return false;
      if (cell1.shape !== cell2.shape || cell1.color !== cell2.color) return false;
    }
  }
  return true;
}

export function isInductiveQuestionCorrupt(qd: Record<string, unknown>): boolean {
  if (!qd || typeof qd !== 'object' || Object.keys(qd).length === 0) {
    return true;
  }

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

  if (!gridHasShapes(gridA) || !gridHasShapes(gridB)) {
    return true;
  }

  let optionsList: Array<{ id: string; grid: ReturnType<typeof parseShapeGrid> }> = [];
  if (Array.isArray(qd.options) && qd.options.length > 0) {
    optionsList = (qd.options as Array<Record<string, unknown>>).map((o) => ({
      id: String(o.id ?? '?'),
      grid: parseShapeGrid(o.grid),
    }));
  } else {
    optionsList = [
      { id: 'A', grid: parseShapeGrid(qd.option_a) },
      { id: 'B', grid: parseShapeGrid(qd.option_b) },
      { id: 'C', grid: parseShapeGrid(qd.option_c) },
      { id: 'D', grid: parseShapeGrid(qd.option_d) },
    ];
  }

  if (optionsList.length !== 4) {
    return true;
  }

  for (const opt of optionsList) {
    if (!gridHasShapes(opt.grid)) {
      return true;
    }
  }

  for (let i = 0; i < optionsList.length; i++) {
    for (let j = i + 1; j < optionsList.length; j++) {
      if (areGridsIdentical(optionsList[i].grid, optionsList[j].grid)) {
        return true;
      }
    }
  }

  const correctOptionIds = (
    (qd.correctOptionIds as string[] | undefined) ??
    (qd.correct_option_ids as string[] | undefined) ??
    (Array.isArray(qd.correct) ? (qd.correct as string[]) : [])
  ).filter(Boolean);

  if (correctOptionIds.length !== 2) {
    return true;
  }

  return false;
}

function normalizeOne(qd: Record<string, unknown>, fallbackCorrect: string[]): NormalizedInductiveItem {
  const isCorrupt = isInductiveQuestionCorrupt(qd);

  let sampleQuestion: InductiveChallengeQuestion | null = null;
  const getSample = () => {
    if (!sampleQuestion) {
      sampleQuestion = generateInductiveQuestion(0);
    }
    return sampleQuestion;
  };

  const exampleRaw = qd.examplePair ?? qd.example_pair;
  let gridA: ReturnType<typeof parseShapeGrid> = [];
  let gridB: ReturnType<typeof parseShapeGrid> = [];

  if (!isCorrupt && exampleRaw && typeof exampleRaw === 'object' && !Array.isArray(exampleRaw)) {
    const ep = exampleRaw as Record<string, unknown>;
    gridA = parseShapeGrid(ep.gridA ?? ep.grid_a);
    gridB = parseShapeGrid(ep.gridB ?? ep.grid_b);
  } else if (!isCorrupt) {
    gridA = parseShapeGrid(qd.grid_a ?? qd.gridA);
    gridB = parseShapeGrid(qd.grid_b ?? qd.gridB);
  }

  let options: NormalizedInductiveItem['options'];
  if (!isCorrupt && Array.isArray(qd.options) && qd.options.length > 0) {
    options = (qd.options as Array<Record<string, unknown>>).map((o) => ({
      id: String(o.id ?? '?'),
      grid: parseShapeGrid(o.grid),
      isCorrect: Boolean(o.isCorrect ?? o.is_correct),
    }));
  } else if (!isCorrupt) {
    options = [
      { id: 'A', grid: parseShapeGrid(qd.option_a), isCorrect: false },
      { id: 'B', grid: parseShapeGrid(qd.option_b), isCorrect: false },
      { id: 'C', grid: parseShapeGrid(qd.option_c), isCorrect: false },
      { id: 'D', grid: parseShapeGrid(qd.option_d), isCorrect: false },
    ];
  } else {
    const sample = getSample();
    gridA = sample.examplePair.gridA;
    gridB = sample.examplePair.gridB;
    options = sample.options.map((o) => ({
      id: o.id,
      grid: o.grid,
      isCorrect: o.isCorrect,
    }));
  }

  const correctOptionIds = isCorrupt
    ? getSample().correctOptionIds
    : (
        (qd.correctOptionIds as string[] | undefined) ??
        (qd.correct_option_ids as string[] | undefined) ??
        fallbackCorrect
      ).filter(Boolean);

  options = options.map((o) => {
    const gridToUse = gridHasShapes(o.grid)
      ? o.grid
      : (() => {
          const sample = getSample();
          const match = sample.options.find((so) => so.id === o.id);
          if (match) return match.grid;
          const idx = ['A', 'B', 'C', 'D'].indexOf(o.id);
          return sample.options[idx >= 0 ? idx : 0]?.grid ?? parseShapeGrid(null);
        })();
    return {
      ...o,
      grid: gridToUse,
      isCorrect: correctOptionIds.includes(o.id) || o.isCorrect,
    };
  });

  const finalCorrectOptionIds = isCorrupt
    ? getSample().correctOptionIds
    : correctOptionIds.length > 0
      ? correctOptionIds
      : options.filter((o) => o.isCorrect).map((o) => o.id);

  return {
    id: String(qd.id ?? `qd-${Math.random().toString(36).slice(2, 9)}`),
    examplePair: { gridA, gridB },
    options: options.map((o) => ({ ...o, isCorrect: finalCorrectOptionIds.includes(o.id) })),
    correctOptionIds: finalCorrectOptionIds,
    displayDurationMs:
      (qd.displayDurationMs as number | undefined) ??
      (qd.display_duration_ms as number | undefined) ??
      30000,
    rule: String(qd.rule ?? qd.rule_note ?? (sampleQuestion ? (sampleQuestion as any).rule : '')),
  };
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
