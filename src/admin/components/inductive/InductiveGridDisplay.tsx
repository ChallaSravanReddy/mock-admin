import React from 'react';
import type { ShapeGrid, ShapeCell } from '../../types/inductiveChallenge';
import { createEmptyGrid } from '../../types/inductiveChallenge';

const SHAPE_COLOR_MAP: Record<string, string> = {
  green: '#16a34a',
  purple: '#9333ea',
  blue: '#1d4ed8',
  red: '#dc2626',
  orange: '#ea580c',
};

export const ShapeIcon: React.FC<{ shape: string; color: string; size?: number }> = ({
  shape,
  color,
  size = 20,
}) => {
  const c = SHAPE_COLOR_MAP[color] || '#1d4ed8';
  switch (shape) {
    case 'square':
      return (
        <svg width={size} height={size} viewBox="0 0 20 20" className="inline-block">
          <rect x="2" y="2" width="16" height="16" fill={c} />
        </svg>
      );
    case 'circle':
      return (
        <svg width={size} height={size} viewBox="0 0 20 20" className="inline-block">
          <circle cx="10" cy="10" r="8" fill={c} />
        </svg>
      );
    case 'triangle':
      return (
        <svg width={size} height={size} viewBox="0 0 20 20" className="inline-block">
          <polygon points="10,2 18,18 2,18" fill={c} />
        </svg>
      );
    case 'cross':
      return (
        <svg width={size} height={size} viewBox="0 0 20 20" className="inline-block">
          <rect x="8" y="2" width="4" height="16" fill={c} />
          <rect x="2" y="8" width="16" height="4" fill={c} />
        </svg>
      );
    default:
      return null;
  }
};

/** Parse grid from DB JSON string, snake_case row, or camelCase array */
export function parseShapeGrid(raw: unknown, size = 3): ShapeGrid {
  if (!raw) return createEmptyGrid(size);

  let data = raw;
  if (typeof data === 'string') {
    try {
      data = JSON.parse(data);
    } catch {
      return createEmptyGrid(size);
    }
  }

  if (!Array.isArray(data)) return createEmptyGrid(size);

  return data.map((row) => {
    if (!Array.isArray(row)) return Array(size).fill(null);
    return row.map((cell) => {
      if (!cell || typeof cell !== 'object') return null;
      const c = cell as Record<string, unknown>;
      const shape = (c.shape ?? c.Shape) as string | undefined;
      const color = (c.color ?? c.Color) as string | undefined;
      if (!shape || !color) return null;
      return { shape, color } as ShapeCell;
    });
  });
}

export function gridHasShapes(grid: ShapeGrid | null | undefined): boolean {
  if (!grid?.length) return false;
  return grid.some((row) => row?.some((cell) => cell != null));
}

export const ReadOnlyShapeGrid: React.FC<{ grid: ShapeGrid | unknown; label?: string }> = ({
  grid: rawGrid,
  label,
}) => {
  const grid = parseShapeGrid(rawGrid);

  return (
    <div className="flex flex-col items-center gap-1.5">
      {label && (
        <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">{label}</span>
      )}
      <div
        className="grid gap-1 p-1.5 bg-white border-2 border-gray-200 rounded"
        style={{ gridTemplateColumns: `repeat(${grid[0]?.length || 3}, 1fr)` }}
      >
        {grid.map((row, ri) =>
          row.map((cell, ci) => (
            <div
              key={`${ri}-${ci}`}
              className="w-10 h-10 border border-gray-100 flex items-center justify-center bg-gray-50 rounded"
            >
              {cell && <ShapeIcon shape={cell.shape} color={cell.color} size={18} />}
            </div>
          ))
        )}
      </div>
    </div>
  );
};
