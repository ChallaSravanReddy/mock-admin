// Simple in-memory + localStorage store for games and mock tests

const GAMES_KEY = 'gc_admin_games';
const TESTS_KEY = 'gc_admin_tests';

export function getGames() {
  try {
    return JSON.parse(localStorage.getItem(GAMES_KEY) || '[]');
  } catch { return []; }
}

export function saveGame(game) {
  const games = getGames();
  const idx = games.findIndex(g => g.id === game.id);
  if (idx >= 0) games[idx] = game;
  else games.unshift(game);
  localStorage.setItem(GAMES_KEY, JSON.stringify(games));
  return game;
}

export function deleteGame(id) {
  const games = getGames().filter(g => g.id !== id);
  localStorage.setItem(GAMES_KEY, JSON.stringify(games));
}

export function getGame(id) {
  return getGames().find(g => g.id === id) || null;
}

export function getMockTests() {
  try {
    return JSON.parse(localStorage.getItem(TESTS_KEY) || '[]');
  } catch { return []; }
}

export function saveMockTest(test) {
  const tests = getMockTests();
  const idx = tests.findIndex(t => t.id === test.id);
  if (idx >= 0) tests[idx] = test;
  else tests.unshift(test);
  localStorage.setItem(TESTS_KEY, JSON.stringify(tests));
  return test;
}

export function deleteMockTest(id) {
  const tests = getMockTests().filter(t => t.id !== id);
  localStorage.setItem(TESTS_KEY, JSON.stringify(tests));
}

export function getMockTest(id) {
  return getMockTests().find(t => t.id === id) || null;
}

export function generateId() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
}

export function createDefaultGame() {
  return {
    id: generateId(),
    title: '',
    description: '',
    category: 'memory',
    difficulty: 'medium',
    status: 'draft',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    // Dot phase config
    dotPhase: {
      totalDots: 24,
      highlightDuration: 2000,  // ms
      dotAreaWidth: 100,
      dotAreaHeight: 60,
      rounds: 3,
    },
    // Symmetry phase config
    symmetryPhase: {
      gridSize: 5,          // NxN grid
      displayDuration: 6000, // ms
      patternType: 'rotated', // rotated | mirrored | random
      rounds: 3,
    },
    // Scoring
    scoring: {
      correctPoints: 3,
      wrongPenalty: 1,
      timeBonus: false,
      timeBonusSeconds: 0,
    },
    // Instructions override
    customInstructions: '',
    tags: [],
  };
}

export function createDefaultMockTest() {
  return {
    id: generateId(),
    title: '',
    description: '',
    status: 'draft',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    timeLimit: 30, // minutes
    games: [],    // array of game ids
    passingScore: 60,
    instructions: '',
    publishedAt: null,
  };
}
