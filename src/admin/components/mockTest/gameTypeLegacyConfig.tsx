import React from 'react';
import { BarChart3, Zap, Grid3x3, Shapes, Move } from 'lucide-react';
import type { GameTypeId } from '../../constants/gameTypes';

/** @deprecated Use GAME_TYPE_CONFIG from constants for new UI; this adds JSX pill styles. */
export const GAME_TYPE_LEGACY_CONFIG = [
  {
    id: 'puzzle' as const,
    label: 'Puzzle Builder',
    icon: <BarChart3 size={15} />,
    color: 'bg-blue-100 text-blue-800 border-blue-200',
    activeColor: 'bg-blue-600 text-white',
  },
  {
    id: 'switch_challenge' as const,
    label: 'Switch Challenge',
    icon: <Zap size={15} />,
    color: 'bg-yellow-100 text-yellow-800 border-yellow-200',
    activeColor: 'bg-yellow-500 text-white',
  },
  {
    id: 'grid_challenge' as const,
    label: 'Grid Challenge',
    icon: <Grid3x3 size={15} />,
    color: 'bg-green-100 text-green-800 border-green-200',
    activeColor: 'bg-green-600 text-white',
  },
  {
    id: 'inductive_challenge' as const,
    label: 'Inductive Challenge',
    icon: <Shapes size={15} />,
    color: 'bg-purple-100 text-purple-800 border-purple-200',
    activeColor: 'bg-purple-600 text-white',
  },
  {
    id: 'motion_challenge' as const,
    label: 'Motion Challenge',
    icon: <Move size={15} />,
    color: 'bg-orange-100 text-orange-800 border-orange-200',
    activeColor: 'bg-orange-500 text-white',
  },
] as const;

export const GameTypePill: React.FC<{ gameType: string; small?: boolean }> = ({
  gameType,
  small,
}) => {
  const cfg = GAME_TYPE_LEGACY_CONFIG.find((g) => g.id === gameType);
  if (!cfg) return null;
  return (
    <span
      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full border text-xs font-medium ${cfg.color} ${small ? 'text-[10px]' : ''}`}
    >
      {cfg.icon} {small ? cfg.label.split(' ')[0] : cfg.label}
    </span>
  );
};

export const GameTypeSelector: React.FC<{
  selected: GameTypeId[];
  onChange: (types: GameTypeId[]) => void;
}> = ({ selected, onChange }) => {
  const toggle = (id: GameTypeId) => {
    onChange(
      selected.includes(id)
        ? selected.filter((s) => s !== id)
        : [...selected, id]
    );
  };

  return (
    <div className="space-y-2">
      <label className="block text-sm font-medium text-gray-700">
        Game Types included in this test
      </label>
      <div className="flex flex-wrap gap-2">
        {GAME_TYPE_LEGACY_CONFIG.map((g) => {
          const active = selected.includes(g.id as GameTypeId);
          return (
            <button
              key={g.id}
              type="button"
              onClick={() => toggle(g.id as GameTypeId)}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-lg border-2 text-sm font-medium transition-all ${
                active
                  ? g.activeColor + ' border-transparent shadow-sm scale-105'
                  : 'border-gray-200 text-gray-600 hover:border-gray-300 hover:bg-gray-50'
              }`}
            >
              {g.icon} {g.label}
              {active && (
                <span className="ml-1 w-4 h-4 rounded-full bg-white/30 flex items-center justify-center text-[10px]">
                  ✓
                </span>
              )}
            </button>
          );
        })}
      </div>
      {selected.length === 0 && (
        <p className="text-xs text-amber-600">Select at least one game type</p>
      )}
    </div>
  );
};
