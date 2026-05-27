import { SYMBOLS, type SymbolType } from '../types/puzzle';
import { AVAILABLE_SYMBOLS } from '../types/swithChallenge';
import { createDefaultRound, type GridChallengeRound } from '../types/gridChallenge';
import {
  createDefaultQuestion,
  createEmptyGrid,
  SHAPE_COLORS,
  SHAPE_TYPES,
  type InductiveChallengeQuestion,
  type ShapeGrid,
} from '../types/inductiveChallenge';
import {
  CELL_COLORS,
  createDefaultLevel,
  createEmptyMotionGrid,
  type MotionChallengeLevel,
  type MotionGrid,
} from '../types/motionChallenge';
import { calculateMinMoves } from '../utils/motionEngine';
import type { GameTypeId } from '../constants/gameTypes';
import type { HackathonQuestion, HackathonSource } from '../types/hackathon';

const uid = () => `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
const pickDifficulty = (): 'easy' | 'medium' | 'hard' =>
  (['easy', 'medium', 'hard'] as const)[Math.floor(Math.random() * 3)];

function createEmptyPuzzleGrid(size: number): SymbolType[][] {
  return Array(size)
    .fill(null)
    .map(() => Array(size).fill(null));
}

export function generatePuzzlePayload() {
  const size = 3 + Math.floor(Math.random() * 2);
  const availableSymbols = [...SYMBOLS].slice(0, size).sort(() => Math.random() - 0.5);
  const grid = createEmptyPuzzleGrid(size);
  for (let r = 0; r < size; r++) {
    for (let c = 0; c < size; c++) {
      grid[r][c] = availableSymbols[(r + c) % size];
    }
  }
  const missingRow = Math.floor(Math.random() * size);
  const missingCol = Math.floor(Math.random() * size);
  const correctAnswer = grid[missingRow][missingCol];
  grid[missingRow][missingCol] = null;
  const incorrectOptions = [...SYMBOLS]
    .filter((s) => s !== correctAnswer)
    .sort(() => Math.random() - 0.5)
    .slice(0, 3);
  const options = [correctAnswer, ...incorrectOptions].sort(() => Math.random() - 0.5) as SymbolType[];

  return {
    gridSize: size,
    grid,
    missingCell: { row: missingRow, col: missingCol },
    options,
    correctAnswer,
    difficulty: pickDifficulty(),
  };
}

export function generateSwitchPayload() {
  const symbolCount = 4 + Math.floor(Math.random() * 2);
  const available = [...AVAILABLE_SYMBOLS].sort(() => Math.random() - 0.5);
  const inputSymbols = available.slice(0, symbolCount);
  const outputSymbols = [...inputSymbols].sort(() => Math.random() - 0.5);
  const answerCode = outputSymbols.map((s) => (inputSymbols.indexOf(s) + 1).toString()).join('');
  const options = [answerCode];
  let attempts = 0;
  while (options.length < 4 && attempts < 100) {
    const code = Array.from({ length: symbolCount }, (_, i) => (i + 1).toString())
      .sort(() => Math.random() - 0.5)
      .join('');
    if (!options.includes(code)) options.push(code);
    attempts++;
  }

  return {
    title: `Switch Challenge ${Math.floor(Math.random() * 1000)}`,
    description: 'Match the correct sequence mapping from top to bottom.',
    difficulty: pickDifficulty(),
    timeDuration: 20 + Math.floor(Math.random() * 6),
    inputSymbols,
    outputSymbols,
    options: options.sort(() => Math.random() - 0.5),
    correctOption: answerCode,
    correctAnswerCode: answerCode,
    scoringRules: { correctPoints: 3, wrongPoints: -1 },
  };
}

export function generateGridRound(index: number): GridChallengeRound {
  const numDots = 8 + Math.floor(Math.random() * 8);
  const dots = Array.from({ length: numDots }, (_, d) => ({
    id: `dot-${uid()}-${d}`,
    x: 5 + Math.floor(Math.random() * 90),
    y: 5 + Math.floor(Math.random() * 90),
    isTarget: false,
  }));
  const targetIdx = Math.floor(Math.random() * dots.length);
  dots[targetIdx].isTarget = true;

  const isSymmetric = Math.random() > 0.5;
  const gridLeft = Array.from({ length: 5 }, () => Array(5).fill(false));
  const gridRight = Array.from({ length: 5 }, () => Array(5).fill(false));
  for (let r = 0; r < 5; r++) {
    for (let c = 0; c < 5; c++) {
      if (Math.random() > 0.5) {
        gridLeft[r][c] = true;
        gridRight[r][c] = true;
      }
    }
  }
  if (!isSymmetric) {
    const changes = 1 + Math.floor(Math.random() * 3);
    for (let ch = 0; ch < changes; ch++) {
      const rr = Math.floor(Math.random() * 5);
      const rc = Math.floor(Math.random() * 5);
      gridRight[rr][rc] = !gridRight[rr][rc];
    }
  }

  return {
    id: `round-${index}-${uid()}`,
    dotPhase: { dots, targetDotId: dots[targetIdx].id, highlightDurationMs: 2000 },
    symmetryPhase: {
      id: `sym-${index}`,
      gridLeft,
      gridRight,
      isSymmetric,
      label: isSymmetric ? 'Are they identical?' : 'Are they different?',
    },
  };
}

export function generateGridPayload() {
  const rounds = [0, 1, 2].map(generateGridRound);
  return {
    title: `Grid Challenge ${Math.floor(Math.random() * 1000)}`,
    description: 'Memorize the blinking target dot, then answer the symmetry question.',
    difficulty: pickDifficulty(),
    totalRounds: rounds.length,
    rounds,
    scoringRules: { correctPoints: 3, wrongPoints: -1 },
    symmetryDisplayMs: 6000,
  };
}

export function generateInductiveQuestion(index: number): InductiveChallengeQuestion {
  const gridA = createEmptyGrid();
  const gridB = createEmptyGrid();
  const fill = (grid: ShapeGrid) => {
    const n = 3 + Math.floor(Math.random() * 3);
    let placed = 0;
    while (placed < n) {
      const r = Math.floor(Math.random() * 3);
      const c = Math.floor(Math.random() * 3);
      if (!grid[r][c]) {
        grid[r][c] = {
          shape: SHAPE_TYPES[Math.floor(Math.random() * SHAPE_TYPES.length)],
          color: SHAPE_COLORS[Math.floor(Math.random() * SHAPE_COLORS.length)],
        };
        placed++;
      }
    }
  };
  fill(gridA);
  fill(gridB);

  const options = ['A', 'B', 'C', 'D'].map((id) => {
    const g = createEmptyGrid();
    fill(g);
    return { id, grid: g, isCorrect: id === 'A' || id === 'C' };
  });

  return {
    id: `q-${index}-${uid()}`,
    examplePair: { gridA, gridB },
    options,
    correctOptionIds: ['A', 'C'],
    rule: 'AI-generated pattern rule',
    displayDurationMs: 30000,
  };
}

export function generateInductivePayload() {
  return {
    title: `Inductive Challenge ${Math.floor(Math.random() * 1000)}`,
    description: 'Identify the rule from the example pair and pick two matching options.',
    difficulty: pickDifficulty(),
    questions: [generateInductiveQuestion(0)],
    scoringRules: { correctPoints: 3, wrongPoints: -1 },
  };
}

/** Fast level for mock-test / hackathon UI (no BFS — avoids browser freeze) */
export function generateMotionLevelQuick(index: number): MotionChallengeLevel {
  const level = createDefaultLevel(index);
  const grid: MotionGrid = level.grid.map((row) => row.map((cell) => ({ ...cell })));
  const spots: [number, number][] = [
    [1, 1],
    [2, 2],
    [3, 1],
  ];
  for (const [r, c] of spots) {
    if (grid[r]?.[c]?.type === 'empty') {
      grid[r][c] = {
        type: 'colored',
        color: CELL_COLORS[Math.floor(Math.random() * CELL_COLORS.length)],
      };
    }
  }
  return { ...level, grid, maxMoves: 12 };
}

export function generateMotionLevel(index: number): MotionChallengeLevel {
  const rows = 6;
  const cols = 4;
  for (let attempt = 0; attempt < 20; attempt++) {
    const tempGrid = createEmptyMotionGrid(rows, cols);
    let hr = Math.floor(Math.random() * rows);
    let hc = Math.floor(Math.random() * cols);
    let br = Math.floor(Math.random() * rows);
    let bc = Math.floor(Math.random() * cols);
    while (hr === br && hc === bc) {
      br = Math.floor(Math.random() * rows);
      bc = Math.floor(Math.random() * cols);
    }
    tempGrid[hr][hc] = { type: 'hole' };
    tempGrid[br][bc] = { type: 'ball' };
    for (let i = 0; i < 2 + Math.floor(Math.random() * 4); i++) {
      const r = Math.floor(Math.random() * rows);
      const c = Math.floor(Math.random() * cols);
      if (tempGrid[r][c].type === 'empty') tempGrid[r][c] = { type: 'blocked' };
    }
    for (let i = 0; i < 1 + Math.floor(Math.random() * 3); i++) {
      const r = Math.floor(Math.random() * rows);
      const c = Math.floor(Math.random() * cols);
      if (tempGrid[r][c].type === 'empty') {
        tempGrid[r][c] = {
          type: 'colored',
          color: CELL_COLORS[Math.floor(Math.random() * CELL_COLORS.length)],
        };
      }
    }
    const minMoves = calculateMinMoves(tempGrid);
    if (minMoves !== null) {
      return {
        id: `level-${index}-${uid()}`,
        rows,
        cols,
        grid: tempGrid,
        maxMoves: minMoves,
        label: `Level ${index + 1}`,
      };
    }
  }
  return createDefaultLevel(index);
}

export function generateMotionPayload(options?: { fast?: boolean }) {
  const gen = options?.fast !== false ? generateMotionLevelQuick : generateMotionLevel;
  return {
    title: `Motion Challenge ${Math.floor(Math.random() * 1000)}`,
    description: 'Slide coloured blocks and guide the red ball into the black hole.',
    difficulty: pickDifficulty(),
    levels: [gen(0)],
    timeDurationSeconds: 240,
    scoringRules: { correctPoints: 4, wrongPoints: -1 },
  };
}

export function generateHackathonQuestion(
  type: GameTypeId,
  source: HackathonSource
): HackathonQuestion {
  const now = new Date().toISOString();
  const base = {
    id: uid(),
    source,
    createdAt: now,
    updatedAt: now,
  };

  switch (type) {
    case 'puzzle': {
      const p = generatePuzzlePayload();
      return {
        ...base,
        type: 'puzzle',
        title: `Puzzle ${Math.floor(Math.random() * 1000)}`,
        description: 'Choose the symbol that completes the matrix.',
        difficulty: p.difficulty,
        payload: p,
      };
    }
    case 'switch_challenge': {
      const s = generateSwitchPayload();
      return {
        ...base,
        type: 'switch_challenge',
        title: s.title,
        description: s.description,
        difficulty: s.difficulty,
        payload: s,
      };
    }
    case 'grid_challenge': {
      const g = generateGridPayload();
      return {
        ...base,
        type: 'grid_challenge',
        title: g.title,
        description: g.description,
        difficulty: g.difficulty,
        payload: g,
      };
    }
    case 'inductive_challenge': {
      const i = generateInductivePayload();
      return {
        ...base,
        type: 'inductive_challenge',
        title: i.title,
        description: i.description,
        difficulty: i.difficulty,
        payload: i,
      };
    }
    case 'motion_challenge': {
      const m = generateMotionPayload({ fast: source === 'ai' || source === 'manual' });
      return {
        ...base,
        type: 'motion_challenge',
        title: m.title,
        description: m.description,
        difficulty: m.difficulty,
        payload: m,
      };
    }
  }
}

export function createManualTemplate(type: GameTypeId): HackathonQuestion {
  return generateHackathonQuestion(type, 'manual');
}

export function createDefaultRoundForHackathon(index: number) {
  return createDefaultRound(index);
}
