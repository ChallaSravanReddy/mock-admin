import type { DotPosition, GridChallengeRound } from '../types/gridChallenge';
import { EMPTY_5X5 } from '../types/gridChallenge';
import { generateGridPayload, generateGridRound } from './hackathonGenerators';

export interface NormalizedGridQuestion {
  rounds: GridChallengeRound[];
  totalRounds: number;
  description: string;
  symmetryDisplayMs: number;
  scoringCorrect?: number;
}

function parseJsonValue<T>(raw: unknown, fallback: T): T {
  if (raw == null) return fallback;
  if (typeof raw === 'string') {
    const trimmed = raw.trim();
    if (!trimmed) return fallback;
    try {
      return JSON.parse(trimmed) as T;
    } catch {
      return fallback;
    }
  }
  return raw as T;
}

function parseBoolGrid(raw: unknown): boolean[][] {
  const data = parseJsonValue<unknown>(raw, null);
  if (!Array.isArray(data) || data.length === 0) return EMPTY_5X5();
  return data.map((row) => {
    if (!Array.isArray(row)) return Array(5).fill(false);
    return row.map((cell) => Boolean(cell));
  });
}

function parseDots(raw: unknown): DotPosition[] {
  const data = parseJsonValue<unknown[]>(raw, []);
  if (!Array.isArray(data)) return [];
  return data.map((item, i) => {
    const d = item as Record<string, unknown>;
    return {
      id: String(d.id ?? `dot-${i}`),
      x: clampPercent(Number(d.x ?? 50)),
      y: clampPercent(Number(d.y ?? 50)),
      isTarget: Boolean(d.isTarget ?? d.is_target),
    };
  });
}

function clampPercent(n: number): number {
  if (Number.isNaN(n)) return 50;
  return Math.max(2, Math.min(98, Math.round(n)));
}

function roundHasPlayableData(round: GridChallengeRound): boolean {
  const hasDots = round.dotPhase.dots.length >= 3;
  const hasTarget = round.dotPhase.dots.some((d) => d.id === round.dotPhase.targetDotId);
  const gridFilled = (grid: boolean[][]) =>
    grid.some((row) => row.some((cell) => cell));
  const hasSymmetry =
    gridFilled(round.symmetryPhase.gridLeft) || gridFilled(round.symmetryPhase.gridRight);
  return hasDots && hasTarget && hasSymmetry;
}

export function normalizeGridRound(raw: unknown, index: number): GridChallengeRound {
  const r = (raw && typeof raw === 'object' ? raw : {}) as Record<string, unknown>;

  const dotPhaseRaw = r.dotPhase ?? r.dot_phase;
  const symRaw = r.symmetryPhase ?? r.symmetry_phase;

  let dots: DotPosition[] = [];
  let targetDotId = '';
  let highlightDurationMs = 2000;

  if (dotPhaseRaw && typeof dotPhaseRaw === 'object') {
    const dp = dotPhaseRaw as Record<string, unknown>;
    dots = parseDots(dp.dots);
    targetDotId = String(dp.targetDotId ?? dp.target_dot_id ?? '');
    highlightDurationMs = Number(dp.highlightDurationMs ?? dp.highlight_duration_ms ?? 2000);
  } else {
    dots = parseDots(r.dots);
    targetDotId = String(r.target_dot_id ?? r.targetDotId ?? '');
    highlightDurationMs = Number(r.highlight_duration_ms ?? r.highlightDurationMs ?? 2000);
  }

  if (!targetDotId || !dots.some((d) => d.id === targetDotId)) {
    const target = dots.find((d) => d.isTarget) ?? dots[0];
    if (target) {
      targetDotId = target.id;
      dots = dots.map((d) => ({ ...d, isTarget: d.id === targetDotId }));
    }
  }

  let gridLeft = EMPTY_5X5();
  let gridRight = EMPTY_5X5();
  let isSymmetric = false;
  let label = 'Is it Symmetric?';
  let symId = `sym-${index}`;

  if (symRaw && typeof symRaw === 'object') {
    const sp = symRaw as Record<string, unknown>;
    gridLeft = parseBoolGrid(sp.gridLeft ?? sp.grid_left);
    gridRight = parseBoolGrid(sp.gridRight ?? sp.grid_right);
    isSymmetric = Boolean(sp.isSymmetric ?? sp.is_symmetric);
    label = String(sp.label ?? sp.symmetry_label ?? label);
    symId = String(sp.id ?? symId);
  } else {
    gridLeft = parseBoolGrid(r.grid_left ?? r.gridLeft);
    gridRight = parseBoolGrid(r.grid_right ?? r.gridRight);
    isSymmetric = Boolean(r.is_symmetric ?? r.isSymmetric);
    label = String(r.symmetry_label ?? r.label ?? label);
  }

  const round: GridChallengeRound = {
    id: String(r.id ?? `round-${index}`),
    dotPhase: {
      dots,
      targetDotId,
      highlightDurationMs: Math.max(1000, highlightDurationMs || 2000),
    },
    symmetryPhase: {
      id: symId,
      gridLeft,
      gridRight,
      isSymmetric,
      label,
    },
  };

  if (!roundHasPlayableData(round)) {
    return generateGridRound(index);
  }

  return round;
}

export function normalizeGridQuestion(q: Record<string, unknown>): NormalizedGridQuestion {
  const payload = q.payload as Record<string, unknown> | undefined;

  const rawRounds = q.roundsData ?? q.rounds_data ?? payload?.rounds ?? q.rounds;

  let rounds: GridChallengeRound[] = [];

  if (Array.isArray(rawRounds) && rawRounds.length > 0 && typeof rawRounds[0] === 'object') {
    rounds = rawRounds.map((r, i) => normalizeGridRound(r, i));
  } else {
    const count =
      (q.rounds as number | undefined) ??
      (q.totalRounds as number | undefined) ??
      (payload?.totalRounds as number | undefined) ??
      3;
    const n = typeof count === 'number' && count > 0 && count <= 10 ? count : 3;
    rounds = Array.from({ length: n }, (_, i) => generateGridRound(i));
  }

  const description = String(
    q.description ??
      payload?.description ??
      'Memorize the blinking target dot, then answer the symmetry question.'
  );

  return {
    rounds,
    totalRounds: rounds.length,
    description,
    symmetryDisplayMs:
      (q.symmetryDisplayMs as number | undefined) ??
      (payload?.symmetryDisplayMs as number | undefined) ??
      6000,
    scoringCorrect:
      (q.scoringCorrect as number | undefined) ??
      (payload?.scoringRules as { correctPoints?: number } | undefined)?.correctPoints,
  };
}

/** Ensure hackathon payload has full round data before save */
export function gridPayloadFromHackathon<T extends { totalRounds: number; rounds: GridChallengeRound[] }>(
  payload: T
): T {
  const rounds =
    payload.rounds?.length > 0
      ? payload.rounds.map((r, i) => normalizeGridRound(r, i))
      : generateGridPayload().rounds;

  let normalized = rounds;
  while (normalized.length < payload.totalRounds) {
    normalized = [...normalized, generateGridRound(normalized.length)];
  }
  if (normalized.length > payload.totalRounds) {
    normalized = normalized.slice(0, payload.totalRounds);
  }

  return { ...payload, rounds: normalized, totalRounds: normalized.length } as T;
}
