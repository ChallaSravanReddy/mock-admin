import React from 'react';
import type { GridChallengeRound } from '../../types/gridChallenge';

const SymmetryMiniGrid: React.FC<{ grid: boolean[][]; label: string }> = ({ grid, label }) => (
  <div className="flex flex-col items-center gap-1">
    <span className="text-[9px] font-bold text-gray-400 uppercase">{label}</span>
    <div className="grid grid-cols-5 gap-0.5 p-1 bg-slate-800 border border-slate-700 rounded">
      {(grid.length ? grid : Array.from({ length: 5 }, () => Array(5).fill(false))).map((row, ri) =>
        row.map((val, ci) => (
          <div
            key={`${ri}-${ci}`}
            className={`w-3 h-3 rounded-sm ${val ? 'bg-indigo-500' : 'bg-slate-700'}`}
          />
        ))
      )}
    </div>
  </div>
);

interface GridRoundPreviewProps {
  round: GridChallengeRound;
  roundIndex: number;
}

export const GridRoundPreview: React.FC<GridRoundPreviewProps> = ({ round, roundIndex }) => (
  <div className="rounded-lg border bg-slate-50 p-3 space-y-3">
    <p className="text-xs font-semibold text-gray-700">Round {roundIndex + 1}</p>
    <div className="flex flex-wrap gap-4 items-start justify-center">
      <div className="flex flex-col items-center gap-1">
        <span className="text-[9px] font-bold text-gray-400 uppercase">Dot memory</span>
        <div className="relative w-36 h-36 bg-slate-900 rounded-lg border-2 border-slate-700 overflow-hidden">
          {round.dotPhase.dots.map((dot) => {
            const isTarget = dot.id === round.dotPhase.targetDotId;
            return (
              <div
                key={dot.id}
                className={`absolute w-2.5 h-2.5 rounded-full -translate-x-1/2 -translate-y-1/2 ${
                  isTarget ? 'bg-yellow-400 ring-2 ring-yellow-400/60' : 'bg-blue-500/80'
                }`}
                style={{ left: `${dot.x}%`, top: `${dot.y}%` }}
              />
            );
          })}
        </div>
      </div>
      <div className="flex items-center gap-2">
        <SymmetryMiniGrid grid={round.symmetryPhase.gridLeft} label="Left" />
        <span className="text-gray-400 text-sm">|</span>
        <SymmetryMiniGrid grid={round.symmetryPhase.gridRight} label="Right" />
      </div>
    </div>
    <p className="text-[10px] text-muted-foreground text-center">
      Symmetric: {round.symmetryPhase.isSymmetric ? 'Yes' : 'No'} · {round.dotPhase.dots.length} dots
    </p>
  </div>
);
