import React from 'react';
import { SymbolType } from '../../types';
import { Circle, Square, Triangle, Star, Pentagon } from 'lucide-react';
import { cn } from '@/lib/utils';

interface GridCellProps {
  row: number;
  col: number;
  symbol: SymbolType;
  isSelected?: boolean;
  isMissing?: boolean;
  onClick?: () => void;
  isInteractive?: boolean;
}

export const GridCell: React.FC<GridCellProps> = ({
  row,
  col,
  symbol,
  isSelected = false,
  isMissing = false,
  onClick,
  isInteractive = true,
}) => {
  const renderSymbol = (sym: SymbolType) => {
    const iconProps = { size: 32, strokeWidth: 2 };
    switch (sym) {
      case 'circle':
        return <Circle {...iconProps} />;
      case 'square':
        return <Square {...iconProps} />;
      case 'triangle':
        return <Triangle {...iconProps} />;
      case 'star':
        return <Star {...iconProps} />;
      case 'pentagon':
        return <Pentagon {...iconProps} />;
      default:
        return null;
    }
  };

  return (
    <button
      onClick={onClick}
      disabled={!isInteractive}
      className={cn(
        'flex items-center justify-center w-16 h-16 border-2 rounded-lg transition-all duration-200',
        isSelected && 'ring-2 ring-blue-500 ring-offset-2',
        isMissing && 'bg-amber-100 border-amber-300',
        isInteractive && 'cursor-pointer hover:bg-gray-50',
        !isInteractive && 'cursor-default',
        symbol ? 'border-gray-300 bg-white' : 'border-dashed border-gray-300 bg-gray-50'
      )}
      aria-label={`Grid cell ${row}-${col}${symbol ? ` containing ${symbol}` : ''}`}
    >
      {isMissing ? (
        <span className="text-amber-700 text-3xl font-extrabold">?</span>
      ) : symbol ? (
        <div className="text-gray-700">{renderSymbol(symbol)}</div>
      ) : (
        <span className="text-gray-300 text-2xl">+</span>
      )}
    </button>
  );
};
