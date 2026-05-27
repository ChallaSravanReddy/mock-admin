import React from 'react';
import { SymbolDisplay } from '../puzzle/SymbolDisplay';
import type { SymbolCode } from '../../types/swithChallenge';

interface SwitchSymbolRowProps {
  symbols: SymbolCode[];
  variant: 'input' | 'output';
  inputSymbols?: SymbolCode[];
  label: string;
}

export const SwitchSymbolRow: React.FC<SwitchSymbolRowProps> = ({
  symbols,
  variant,
  inputSymbols,
  label,
}) => {
  const isInput = variant === 'input';
  const boxClass = isInput
    ? 'bg-blue-50 border-blue-200'
    : 'bg-green-50 border-green-200';
  const indexClass = isInput ? 'text-gray-900' : 'text-green-700';

  if (!symbols.length) {
    return (
      <div>
        <p className="text-xs font-semibold text-gray-500 uppercase mb-2">{label}</p>
        <p className="text-sm text-muted-foreground rounded-lg border border-dashed p-4">
          No symbols configured
        </p>
      </div>
    );
  }

  return (
    <div>
      <p className="text-xs font-semibold text-gray-500 uppercase mb-2">{label}</p>
      <div className={`flex flex-wrap gap-3 p-3 rounded-lg border ${boxClass}`}>
        {symbols.map((symbol, i) => (
          <div key={`${symbol}-${i}`} className="flex flex-col items-center gap-1 min-w-[3rem]">
            <SymbolDisplay symbol={symbol} size="md" />
            <span className={`text-xs font-bold ${indexClass}`}>
              {isInput ? i + 1 : (inputSymbols?.indexOf(symbol) ?? -1) + 1}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};
