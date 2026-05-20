import React from 'react';
import { SymbolType } from '../../types';
import { GridCell } from './GridCell';
import { cn } from '@/lib/utils';

interface PuzzleGridProps {
  grid: SymbolType[][];
  missingCell?: { row: number; col: number } | null;
  selectedCells?: { row: number; col: number }[];
  onCellClick?: (row: number, col: number) => void;
  isInteractive?: boolean;
}

export const PuzzleGrid: React.FC<PuzzleGridProps> = ({
  grid,
  missingCell,
  selectedCells,
  onCellClick,
  isInteractive = true,
}) => {
  const gridSize = grid.length;

  return (
    <div
      className="flex flex-col gap-2 p-6 bg-white rounded-lg border border-gray-200"
      style={{
        display: 'inline-flex',
      }}
    >
      {grid.map((row, rowIndex) => (
        <div key={rowIndex} className="flex gap-2">
          {row.map((symbol, colIndex) => {
            const isMissing = missingCell?.row === rowIndex && missingCell?.col === colIndex;
            const isSelected = selectedCells?.some(
              (cell) => cell.row === rowIndex && cell.col === colIndex
            );

            return (
              <GridCell
                key={`${rowIndex}-${colIndex}`}
                row={rowIndex}
                col={colIndex}
                symbol={symbol}
                isSelected={isSelected}
                isMissing={isMissing}
                onClick={() => onCellClick?.(rowIndex, colIndex)}
                isInteractive={isInteractive}
              />
            );
          })}
        </div>
      ))}
    </div>
  );
};
