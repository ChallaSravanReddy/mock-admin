import React from 'react';
import type { MotionChallengeLevel, MotionCell } from '../../types/motionChallenge';
import { COLOR_CSS } from '../../types/motionChallenge';

const MiniCell: React.FC<{ cell: MotionCell; size?: number }> = ({ cell, size = 14 }) => {
  if (cell.type === 'empty') {
    return (
      <div
        className="border border-gray-200 bg-gray-50"
        style={{ width: size, height: size }}
      />
    );
  }
  if (cell.type === 'hole') {
    return (
      <div
        className="border border-gray-300 bg-gray-50 flex items-center justify-center"
        style={{ width: size, height: size }}
      >
        <div
          className="rounded-full bg-slate-900"
          style={{ width: size * 0.55, height: size * 0.55 }}
        />
      </div>
    );
  }
  if (cell.type === 'ball') {
    return (
      <div
        className="border border-gray-300 bg-gray-50 flex items-center justify-center"
        style={{ width: size, height: size }}
      >
        <div
          className="rounded-full bg-red-500"
          style={{ width: size * 0.55, height: size * 0.55 }}
        />
      </div>
    );
  }
  if (cell.type === 'blocked') {
    return (
      <div
        className="border border-gray-400 bg-gray-200 text-[8px] flex items-center justify-center text-gray-600"
        style={{ width: size, height: size }}
      >
        ✕
      </div>
    );
  }
  const bg = cell.color ? COLOR_CSS[cell.color] : '#94a3b8';
  return <div className="border border-gray-400" style={{ width: size, height: size, background: bg }} />;
};

interface MotionLevelPreviewProps {
  level: MotionChallengeLevel;
  index: number;
}

export const MotionLevelPreview: React.FC<MotionLevelPreviewProps> = ({ level, index }) => (
  <div className="rounded-lg border bg-slate-50 p-3 space-y-2">
    <p className="text-xs font-semibold text-gray-700">
      {level.label || `Level ${index + 1}`} · {level.maxMoves} moves max
    </p>
    <div
      className="inline-grid gap-0.5 p-1 bg-gray-100 border border-gray-300 rounded"
      style={{ gridTemplateColumns: `repeat(${level.cols}, 1fr)` }}
    >
      {level.grid.map((row, ri) =>
        row.map((cell, ci) => <MiniCell key={`${ri}-${ci}`} cell={cell} />)
      )}
    </div>
  </div>
);
