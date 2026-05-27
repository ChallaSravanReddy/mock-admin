import type { MotionCell, MotionChallengeLevel, MotionGrid } from '../types/motionChallenge';
import { createDefaultLevel } from '../types/motionChallenge';
import { generateMotionLevelQuick } from './hackathonGenerators';

function parseJsonValue<T>(raw: unknown, fallback: T): T {
  if (raw == null) return fallback;
  if (typeof raw === 'string') {
    try {
      return JSON.parse(raw) as T;
    } catch {
      return fallback;
    }
  }
  return raw as T;
}

function parseGrid(raw: unknown, rows: number, cols: number): MotionGrid {
  const data = parseJsonValue<unknown>(raw, null);
  if (!Array.isArray(data) || data.length === 0) {
    return createDefaultLevel(0).grid;
  }
  return data.map((row) => {
    if (!Array.isArray(row)) return Array.from({ length: cols }, () => ({ type: 'empty' as const }));
    return row.map((cell) => {
      if (!cell || typeof cell !== 'object') return { type: 'empty' as const };
      const c = cell as Record<string, unknown>;
      const type = (c.type ?? c.cell_type ?? 'empty') as MotionCell['type'];
      return {
        type,
        color: c.color as MotionCell['color'],
        id: c.id as string | undefined,
      };
    });
  });
}

function levelHasPlayableGrid(level: MotionChallengeLevel): boolean {
  const grid = level.grid;
  if (!grid?.length) return false;
  let hasBall = false;
  let hasHole = false;
  for (const row of grid) {
    for (const cell of row) {
      if (cell?.type === 'ball') hasBall = true;
      if (cell?.type === 'hole') hasHole = true;
    }
  }
  return hasBall && hasHole;
}

export function normalizeMotionLevel(raw: unknown, index: number): MotionChallengeLevel {
  const lvl = (raw && typeof raw === 'object' ? raw : {}) as Record<string, unknown>;
  const rows = Number(lvl.rows ?? lvl.row_count ?? 6) || 6;
  const cols = Number(lvl.cols ?? lvl.col_count ?? 4) || 4;
  const grid = parseGrid(lvl.grid ?? lvl.grid_data, rows, cols);

  const level: MotionChallengeLevel = {
    id: String(lvl.id ?? `level-${index}`),
    rows,
    cols,
    grid,
    maxMoves: Number(lvl.maxMoves ?? lvl.max_moves ?? 10) || 10,
    label: String(lvl.label ?? `Level ${index + 1}`),
  };

  if (!levelHasPlayableGrid(level)) {
    return generateMotionLevelQuick(index);
  }
  return level;
}

export interface NormalizedMotionQuestion {
  levels: MotionChallengeLevel[];
  timeDurationSeconds: number;
  description: string;
  maxMoves: number;
}

export function normalizeMotionQuestion(q: Record<string, unknown>): NormalizedMotionQuestion {
  const payload = q.payload as Record<string, unknown> | undefined;
  const rawLevels = q.levelsData ?? q.levels ?? payload?.levels;

  let levels: MotionChallengeLevel[] = [];
  if (Array.isArray(rawLevels) && rawLevels.length > 0) {
    levels = rawLevels.map((l, i) => normalizeMotionLevel(l, i));
  } else {
    levels = [generateMotionLevelQuick(0)];
  }

  return {
    levels,
    timeDurationSeconds:
      Number(q.timeDurationSeconds ?? q.time_duration_seconds ?? payload?.timeDurationSeconds) || 240,
    description: String(
      q.description ?? payload?.description ?? 'Guide the red ball into the black hole.'
    ),
    maxMoves: levels[0]?.maxMoves ?? 10,
  };
}

export function motionPayloadFromHackathon<T extends { levels: MotionChallengeLevel[] }>(payload: T): T {
  let levels =
    payload.levels?.length > 0
      ? payload.levels.map((l, i) => normalizeMotionLevel(l, i))
      : [generateMotionLevelQuick(0)];

  return { ...payload, levels } as T;
}
