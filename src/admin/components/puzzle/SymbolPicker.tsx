import React from 'react';
import { SymbolType, SYMBOLS } from '../../types';
import { Circle, Square, Triangle, Star, X, Pentagon, FileQuestionMark } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface SymbolPickerProps {
  selectedSymbol?: SymbolType;
  onSymbolSelect: (symbol: SymbolType) => void;
  onClearSymbol?: () => void;
}

export const SymbolPicker: React.FC<SymbolPickerProps> = ({
  selectedSymbol,
  onSymbolSelect,
  onClearSymbol,
}) => {
  const renderSymbolIcon = (symbol: Exclude<SymbolType, null>) => {
    const iconProps = { size: 20, strokeWidth: 2 };
    const symbolKey = symbol as string;
    switch (symbolKey) {
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
      case 'question':
        return <FileQuestionMark {...iconProps} />;
      default:
        return null;
    }
  };

  return (
    <div className="flex items-center gap-2">
      {SYMBOLS.map((symbol) => (
        <Button
          key={symbol}
          variant={selectedSymbol === symbol ? 'default' : 'outline'}
          size="sm"
          onClick={() => onSymbolSelect(symbol as SymbolType)}
          className={cn('gap-2', selectedSymbol === symbol && 'ring-2 ring-offset-2 ring-blue-500')}
          title={symbol}
        >
          {renderSymbolIcon(symbol)}
          <span className="capitalize hidden sm:inline">{symbol}</span>
        </Button>
      ))}

      {onClearSymbol && (
        <Button
          variant="outline"
          size="sm"
          onClick={onClearSymbol}
          className="gap-2"
          title="Clear symbol"
        >
          <X size={20} />
          <span className="capitalize hidden sm:inline">Clear</span>
        </Button>
      )}
    </div>
  );
};
