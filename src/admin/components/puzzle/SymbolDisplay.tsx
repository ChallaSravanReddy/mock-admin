import React from 'react';
import { SymbolCode } from '../../types/swithChallenge';

interface SymbolDisplayProps {
  symbol: SymbolCode;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export const SymbolDisplay: React.FC<SymbolDisplayProps> = ({
  symbol,
  size = 'md',
  className = '',
}) => {
  const sizeMap = {
    sm: 'w-8 h-8',
    md: 'w-12 h-12',
    lg: 'w-16 h-16',
  };

  const renderSymbol = () => {
    switch (symbol) {
      case 'circle':
        return (
          <svg
            viewBox="0 0 100 100"
            className={`${sizeMap[size]} ${className}`}
            style={{ fill: 'currentColor' }}
          >
            <circle cx="50" cy="50" r="45" />
          </svg>
        );
      case 'square':
        return (
          <svg
            viewBox="0 0 100 100"
            className={`${sizeMap[size]} ${className}`}
            style={{ fill: 'currentColor' }}
          >
            <rect x="10" y="10" width="80" height="80" />
          </svg>
        );
      case 'triangle':
        return (
          <svg
            viewBox="0 0 100 100"
            className={`${sizeMap[size]} ${className}`}
            style={{ fill: 'currentColor' }}
          >
            <polygon points="50,10 90,90 10,90" />
          </svg>
        );
      case 'cross':
        return (
          <svg
            viewBox="0 0 100 100"
            className={`${sizeMap[size]} ${className}`}
            style={{ fill: 'currentColor' }}
          >
            <rect x="40" y="10" width="20" height="80" />
            <rect x="10" y="40" width="80" height="20" />
          </svg>
        );
      case 'star':
        return (
          <svg
            viewBox="0 0 100 100"
            className={`${sizeMap[size]} ${className}`}
            style={{ fill: 'currentColor' }}
          >
            <polygon points="50,10 61,40 93,40 67,62 78,92 50,70 22,92 33,62 7,40 39,40" />
          </svg>
        );
      case 'pentagon':
        return (
          <svg
            viewBox="0 0 100 100"
            className={`${sizeMap[size]} ${className}`}
            style={{ fill: 'currentColor' }}
          >
            <polygon points="50,10 90,35 72,85 28,85 10,35" />
          </svg>
        );
      case 'hexagon':
        return (
          <svg
            viewBox="0 0 100 100"
            className={`${sizeMap[size]} ${className}`}
            style={{ fill: 'currentColor' }}
          >
            <polygon points="30,15 70,15 90,50 70,85 30,85 10,50" />
          </svg>
        );
      case 'diamond':
        return (
          <svg
            viewBox="0 0 100 100"
            className={`${sizeMap[size]} ${className}`}
            style={{ fill: 'currentColor' }}
          >
            <polygon points="50,10 90,50 50,90 10,50" />
          </svg>
        );
      default:
        return null;
    }
  };

  return (
    <div className="flex items-center justify-center text-lime-500">
      {renderSymbol()}
    </div>
  );
};
