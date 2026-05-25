import { MotionGrid } from '../types/motionChallenge';

/**
 * BFS algorithm to calculate the minimum number of moves to solve a Motion Challenge.
 * Assumes a piece (ball or colored block) moves exactly 1 cell at a time.
 * Colored blocks cannot enter the hole.
 * 
 * @param grid The initial puzzle grid
 * @returns Minimum number of moves, or null if unsolvable
 */
export function calculateMinMoves(grid: MotionGrid): number | null {
  const rows = grid.length;
  if (rows === 0) return null;
  const cols = grid[0].length;

  let hole = { r: -1, c: -1 };
  let foundBall = false;

  // Flatten the grid into a string
  const encodeGrid = (g: MotionGrid) => {
    return g
      .map((row) =>
        row
          .map((c) => {
            if (c.type === 'empty' || c.type === 'hole') return '.'; // both act as empty for movement, except hole is goal for ball
            if (c.type === 'blocked') return 'X';
            if (c.type === 'ball') return 'B';
            if (c.type === 'colored') return c.color || 'C';
            return '?';
          })
          .join('')
      )
      .join('|');
  };

  const decodeGrid = (str: string): string[][] => {
    return str.split('|').map((row) => row.split(''));
  };

  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      if (grid[r][c].type === 'ball') {
        foundBall = true;
      }
      if (grid[r][c].type === 'hole') {
        hole = { r, c };
      }
    }
  }

  if (!foundBall || hole.r === -1) return null;

  const initialState = encodeGrid(grid);

  // Queue for BFS
  const queue: { state: string; moves: number }[] = [];
  queue.push({ state: initialState, moves: 0 });

  const visited = new Set<string>();
  visited.add(initialState);

  const dirs = [
    [-1, 0], // up
    [1, 0],  // down
    [0, -1], // left
    [0, 1],  // right
  ];

  while (queue.length > 0) {
    // In a real app, if the BFS gets too deep, we might want to cap it.
    // e.g., if moves > 50, break to avoid crashing the browser.
    const { state, moves } = queue.shift()!;
    if (moves > 50) return null; // Cap at 50 to prevent freezing

    const currentGrid = decodeGrid(state);

    let ballR = -1;
    let ballC = -1;
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        if (currentGrid[r][c] === 'B') {
          ballR = r;
          ballC = c;
        }
      }
    }

    if (ballR === hole.r && ballC === hole.c) {
      return moves;
    }

    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const char = currentGrid[r][c];
        // If it's a movable piece
        if (char !== '.' && char !== 'X' && char !== '?') {
          for (const [dr, dc] of dirs) {
            const nr = r + dr;
            const nc = c + dc;

            if (nr >= 0 && nr < rows && nc >= 0 && nc < cols) {
              if (currentGrid[nr][nc] === '.') {
                // Colored blocks cannot enter the hole
                if (nr === hole.r && nc === hole.c && char !== 'B') {
                  continue;
                }

                // Make move
                const nextGrid = currentGrid.map((row) => [...row]);
                nextGrid[nr][nc] = char;
                nextGrid[r][c] = '.';

                const nextState = nextGrid.map((row) => row.join('')).join('|');

                if (!visited.has(nextState)) {
                  visited.add(nextState);
                  queue.push({ state: nextState, moves: moves + 1 });
                }
              }
            }
          }
        }
      }
    }
  }

  return null;
}
