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
  type ShapeType,
  type ShapeColor,
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
  const staticRules = [
    {
      name: 'One column is completely uniform in shape and color, while the other two columns contain three distinct shape/color types with exactly two occurrences each.',
      apply: (grid: ShapeGrid) => {
        const shapes: ShapeType[] = ['circle', 'square', 'triangle', 'cross'].sort(() => Math.random() - 0.5) as ShapeType[];
        const colors: ShapeColor[] = ['purple', 'green', 'blue', 'orange'].sort(() => Math.random() - 0.5) as ShapeColor[];
        
        const uniformCol = Math.floor(Math.random() * 3);
        const otherCols = [0, 1, 2].filter(c => c !== uniformCol);
        
        for (let r = 0; r < 3; r++) {
          grid[r][uniformCol] = { shape: shapes[0], color: colors[0] };
        }
        
        const colAShapes: ShapeType[] = [shapes[1], shapes[1], shapes[2]].sort(() => Math.random() - 0.5);
        const colAColors: ShapeColor[] = [colors[1], colors[1], colors[2]].sort(() => Math.random() - 0.5);
        for (let r = 0; r < 3; r++) {
          grid[r][otherCols[0]] = { shape: colAShapes[r], color: colAColors[r] };
        }
        
        const colBShapes: ShapeType[] = [shapes[3], shapes[3], shapes[2]].sort(() => Math.random() - 0.5);
        const colBColors: ShapeColor[] = [colors[3], colors[3], colors[2]].sort(() => Math.random() - 0.5);
        for (let r = 0; r < 3; r++) {
          grid[r][otherCols[1]] = { shape: colBShapes[r], color: colBColors[r] };
        }
      },
      check: (grid: ShapeGrid) => {
        let uniformCol = -1;
        for (let c = 0; c < 3; c++) {
          if (grid[0][c] && grid[1][c] && grid[2][c]) {
            if (
              grid[0][c]!.shape === grid[1][c]!.shape && grid[1][c]!.shape === grid[2][c]!.shape &&
              grid[0][c]!.color === grid[1][c]!.color && grid[1][c]!.color === grid[2][c]!.color
            ) {
              uniformCol = c;
              break;
            }
          }
        }
        if (uniformCol === -1) return false;
        
        const shapeCounts: Record<string, number> = {};
        const colorCounts: Record<string, number> = {};
        for (let r = 0; r < 3; r++) {
          for (let c = 0; c < 3; c++) {
            const item = grid[r][c];
            if (!item) return false;
            shapeCounts[item.shape] = (shapeCounts[item.shape] || 0) + 1;
            colorCounts[item.color] = (colorCounts[item.color] || 0) + 1;
          }
        }
        
        const sc = Object.values(shapeCounts).sort();
        const cc = Object.values(colorCounts).sort();
        return (
          sc.length === 4 && sc[0] === 2 && sc[1] === 2 && sc[2] === 2 && sc[3] === 3 &&
          cc.length === 4 && cc[0] === 2 && cc[1] === 2 && cc[2] === 2 && cc[3] === 3
        );
      },
      break: (grid: ShapeGrid) => {
        const shapes: ShapeType[] = ['circle', 'square', 'triangle', 'cross'];
        const colors: ShapeColor[] = ['purple', 'green', 'blue', 'orange'];
        for (let r = 0; r < 3; r++) {
          for (let c = 0; c < 3; c++) {
            grid[r][c] = { shape: shapes[(r + c) % 4], color: colors[(r + c) % 4] };
          }
        }
      }
    },
    {
      name: 'Each row and column contains exactly one Circle, one Square, and one Triangle, with no duplicates of shapes or colors in any line.',
      apply: (grid: ShapeGrid) => {
        const shapes: ShapeType[] = ['circle', 'square', 'triangle'].sort(() => Math.random() - 0.5) as ShapeType[];
        const colors: ShapeColor[] = ['red', 'blue', 'green'].sort(() => Math.random() - 0.5) as ShapeColor[];
        for (let r = 0; r < 3; r++) {
          for (let c = 0; c < 3; c++) {
            const idx = (r + c) % 3;
            grid[r][c] = { shape: shapes[idx], color: colors[idx] };
          }
        }
      },
      check: (grid: ShapeGrid) => {
        for (let r = 0; r < 3; r++) {
          const rowShapes = new Set<string>();
          const rowColors = new Set<string>();
          for (let c = 0; c < 3; c++) {
            const item = grid[r][c];
            if (!item) return false;
            rowShapes.add(item.shape);
            rowColors.add(item.color);
          }
          if (rowShapes.size !== 3 || rowColors.size !== 3) return false;
        }
        for (let c = 0; c < 3; c++) {
          const colShapes = new Set<string>();
          const colColors = new Set<string>();
          for (let r = 0; r < 3; r++) {
            const item = grid[r][c];
            if (!item) return false;
            colShapes.add(item.shape);
            colColors.add(item.color);
          }
          if (colShapes.size !== 3 || colColors.size !== 3) return false;
        }
        return true;
      },
      break: (grid: ShapeGrid) => {
        const shapes: ShapeType[] = ['circle', 'square', 'triangle'];
        const colors: ShapeColor[] = ['red', 'blue', 'green'];
        for (let r = 0; r < 3; r++) {
          for (let c = 0; c < 3; c++) {
            grid[r][c] = { shape: shapes[c], color: colors[c] };
          }
        }
      }
    },
    {
      name: 'Left and Right columns are identical (symmetrical) in both shape and color, while the center column alternates shapes.',
      apply: (grid: ShapeGrid) => {
        const borderShapes: ShapeType[] = ['circle', 'triangle', 'cross'].sort(() => Math.random() - 0.5) as ShapeType[];
        const borderColors: ShapeColor[] = ['blue', 'orange', 'purple'].sort(() => Math.random() - 0.5) as ShapeColor[];
        const centerShapes: ShapeType[] = ['square', 'circle'].sort(() => Math.random() - 0.5) as ShapeType[];
        
        for (let r = 0; r < 3; r++) {
          grid[r][0] = { shape: borderShapes[r], color: borderColors[r] };
          grid[r][2] = { shape: borderShapes[r], color: borderColors[r] };
          grid[r][1] = { shape: r % 2 === 0 ? centerShapes[0] : centerShapes[1], color: 'green' };
        }
      },
      check: (grid: ShapeGrid) => {
        for (let r = 0; r < 3; r++) {
          if (!grid[r][0] || !grid[r][1] || !grid[r][2]) return false;
          if (grid[r][0]?.shape !== grid[r][2]?.shape || grid[r][0]?.color !== grid[r][2]?.color) return false;
        }
        return (
          grid[0][1]?.shape === grid[2][1]?.shape &&
          grid[0][1]?.shape !== grid[1][1]?.shape
        );
      },
      break: (grid: ShapeGrid) => {
        for (let r = 0; r < 3; r++) {
          grid[r][0] = { shape: 'circle', color: 'blue' };
          grid[r][1] = { shape: 'square', color: 'green' };
          grid[r][2] = { shape: 'triangle', color: 'blue' };
        }
      }
    },
    {
      name: 'All shapes of the same type must share the same color (e.g., all circles are red, all squares are blue).',
      apply: (grid: ShapeGrid) => {
        const shapes: ShapeType[] = ['circle', 'square', 'triangle', 'cross'];
        const colors: ShapeColor[] = ['red', 'blue', 'orange', 'green'];
        
        for (let r = 0; r < 3; r++) {
          for (let c = 0; c < 3; c++) {
            const idx = Math.floor(Math.random() * 4);
            grid[r][c] = { shape: shapes[idx], color: colors[idx] };
          }
        }
      },
      check: (grid: ShapeGrid) => {
        const map: Record<string, string> = {};
        for (let r = 0; r < 3; r++) {
          for (let c = 0; c < 3; c++) {
            const item = grid[r][c];
            if (!item) return false;
            if (!map[item.shape]) {
              map[item.shape] = item.color;
            } else if (map[item.shape] !== item.color) {
              return false;
            }
          }
        }
        return Object.keys(map).length >= 2;
      },
      break: (grid: ShapeGrid) => {
        for (let r = 0; r < 3; r++) {
          for (let c = 0; c < 3; c++) {
            grid[r][c] = { shape: 'circle', color: 'red' };
          }
        }
        grid[0][0] = { shape: 'circle', color: 'blue' };
      }
    },
    {
      name: 'Top-left to bottom-right diagonal cells must be circles, and all other cells must be squares.',
      apply: (grid: ShapeGrid) => {
        const colorDiag: ShapeColor = 'purple';
        const colorOff: ShapeColor = 'green';
        for (let r = 0; r < 3; r++) {
          for (let c = 0; c < 3; c++) {
            grid[r][c] = {
              shape: r === c ? 'circle' : 'square',
              color: r === c ? colorDiag : colorOff
            };
          }
        }
      },
      check: (grid: ShapeGrid) => {
        for (let r = 0; r < 3; r++) {
          for (let c = 0; c < 3; c++) {
            const item = grid[r][c];
            if (!item) return false;
            if (r === c) {
              if (item.shape !== 'circle') return false;
            } else {
              if (item.shape !== 'square') return false;
            }
          }
        }
        return true;
      },
      break: (grid: ShapeGrid) => {
        for (let r = 0; r < 3; r++) {
          for (let c = 0; c < 3; c++) {
            grid[r][c] = { shape: 'square', color: 'green' };
          }
        }
      }
    },
    {
      name: 'The grid contains exactly three circles, three squares, and three triangles.',
      apply: (grid: ShapeGrid) => {
        const list: ShapeType[] = ['triangle', 'triangle', 'triangle', 'square', 'square', 'square', 'circle', 'circle', 'circle']
          .sort(() => Math.random() - 0.5) as ShapeType[];
        for (let r = 0; r < 3; r++) {
          for (let c = 0; c < 3; c++) {
            grid[r][c] = {
              shape: list[r * 3 + c],
              color: SHAPE_COLORS[Math.floor(Math.random() * SHAPE_COLORS.length)]
            };
          }
        }
      },
      check: (grid: ShapeGrid) => {
        let tri = 0, sq = 0, ci = 0;
        for (let r = 0; r < 3; r++) {
          for (let c = 0; c < 3; c++) {
            const sh = grid[r][c]?.shape;
            if (sh === 'triangle') tri++;
            else if (sh === 'square') sq++;
            else if (sh === 'circle') ci++;
          }
        }
        return tri === 3 && sq === 3 && ci === 3;
      },
      break: (grid: ShapeGrid) => {
        for (let r = 0; r < 3; r++) {
          for (let c = 0; c < 3; c++) {
            grid[r][c] = { shape: 'triangle', color: 'red' };
          }
        }
      }
    }
  ];

  const rule = staticRules[Math.floor(Math.random() * staticRules.length)];

  const gridA = createEmptyGrid();
  rule.apply(gridA);

  const gridB = createEmptyGrid();
  rule.apply(gridB);

  const correct1 = createEmptyGrid();
  rule.apply(correct1);

  const correct2 = createEmptyGrid();
  rule.apply(correct2);

  const wrong1 = createEmptyGrid();
  rule.break(wrong1);

  const wrong2 = createEmptyGrid();
  rule.break(wrong2);

  const optionsGrids = [correct1, correct2, wrong1, wrong2].sort(() => Math.random() - 0.5);

  const options = optionsGrids.map((g, idx) => {
    const id = String.fromCharCode(65 + idx);
    return { id, grid: g, isCorrect: g === correct1 || g === correct2 };
  });

  const correctOptionIds = options.filter(o => o.isCorrect).map(o => o.id);

  return {
    id: `q-${index}-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
    examplePair: { gridA, gridB },
    options,
    correctOptionIds,
    rule: rule.name,
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
