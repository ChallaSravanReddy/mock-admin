import {
  BarChart3,
  Zap,
  Grid3x3,
  Shapes,
  Move,
} from 'lucide-react';
export const MAX_QUESTIONS_PER_TOPIC = 20;

export const GAME_TYPE_CONFIG = [
  {
    id: 'puzzle',
    label: 'Puzzle Builder',
    shortLabel: 'Puzzle',
    description: 'Matrix reasoning with a missing symbol',
    icon: BarChart3,
    color: 'bg-blue-500/10 text-blue-700 border-blue-200',
    accent: 'from-blue-600 to-indigo-600',
    ring: 'ring-blue-500',
  },
  {
    id: 'switch_challenge',
    label: 'Switch Challenge',
    shortLabel: 'Switch',
    description: 'Decode symbol ordering codes',
    icon: Zap,
    color: 'bg-amber-500/10 text-amber-800 border-amber-200',
    accent: 'from-amber-500 to-orange-600',
    ring: 'ring-amber-500',
  },
  {
    id: 'grid_challenge',
    label: 'Grid Challenge',
    shortLabel: 'Grid',
    description: 'Dot memory + symmetry rounds',
    icon: Grid3x3,
    color: 'bg-emerald-500/10 text-emerald-800 border-emerald-200',
    accent: 'from-emerald-600 to-teal-600',
    ring: 'ring-emerald-500',
  },
  {
    id: 'inductive_challenge',
    label: 'Inductive Challenge',
    shortLabel: 'Inductive',
    description: 'Pattern rules across shape grids',
    icon: Shapes,
    color: 'bg-violet-500/10 text-violet-800 border-violet-200',
    accent: 'from-violet-600 to-purple-600',
    ring: 'ring-violet-500',
  },
  {
    id: 'motion_challenge',
    label: 'Motion Challenge',
    shortLabel: 'Motion',
    description: 'Slide blocks to reach the hole',
    icon: Move,
    color: 'bg-orange-500/10 text-orange-800 border-orange-200',
    accent: 'from-orange-500 to-rose-600',
    ring: 'ring-orange-500',
  },
] as const;

export type GameTypeId = (typeof GAME_TYPE_CONFIG)[number]['id'];

export function getGameTypeConfig(id: GameTypeId) {
  return GAME_TYPE_CONFIG.find((g) => g.id === id)!;
}
