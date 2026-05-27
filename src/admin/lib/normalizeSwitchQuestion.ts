import { AVAILABLE_SYMBOLS, type SymbolCode } from '../types/swithChallenge';
import { generateSwitchPayload } from './hackathonGenerators';

export interface NormalizedSwitchQuestion {
  inputSymbols: SymbolCode[];
  outputSymbols: SymbolCode[];
  options: string[];
  correct: string;
  timeDuration: number;
  scoringCorrect?: number;
}

function parseSymbolArray(raw: unknown): SymbolCode[] {
  if (raw == null) return [];

  let data: unknown = raw;
  if (typeof data === 'string') {
    const trimmed = data.trim();
    if (!trimmed) return [];
    try {
      data = JSON.parse(trimmed);
    } catch {
      return trimmed
        .split(/[,;\s]+/)
        .map((s) => s.trim().toLowerCase())
        .filter((s): s is SymbolCode =>
          AVAILABLE_SYMBOLS.includes(s as SymbolCode)
        );
    }
  }

  if (!Array.isArray(data)) return [];

  return data
    .map((item) => {
      if (typeof item === 'string') return item.toLowerCase().trim();
      if (item && typeof item === 'object' && 'symbol' in item) {
        return String((item as { symbol: string }).symbol).toLowerCase().trim();
      }
      return '';
    })
    .filter((s): s is SymbolCode => AVAILABLE_SYMBOLS.includes(s as SymbolCode));
}

function parseOptions(raw: unknown): string[] {
  if (raw == null) return [];
  if (typeof raw === 'string') {
    try {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) return parsed.map(String);
    } catch {
      return raw.split(/[,;\s]+/).filter(Boolean);
    }
  }
  if (Array.isArray(raw)) return raw.map(String);
  return [];
}

/** Normalize viewer / API switch question → playable shape with symbols */
export function normalizeSwitchQuestion(q: Record<string, unknown>): NormalizedSwitchQuestion {
  const payload = q.payload as Record<string, unknown> | undefined;

  let inputSymbols = parseSymbolArray(
    q.inputSymbols ?? q.input_symbols ?? payload?.inputSymbols ?? payload?.input_symbols
  );
  let outputSymbols = parseSymbolArray(
    q.outputSymbols ?? q.output_symbols ?? payload?.outputSymbols ?? payload?.output_symbols
  );

  let options = parseOptions(q.options ?? payload?.options);
  let correct = String(
    q.correct ??
      q.correctOption ??
      q.correct_option ??
      payload?.correctOption ??
      payload?.correct_option ??
      ''
  );

  const timeDuration =
    (q.timeDuration as number | undefined) ??
    (q.time_duration_sec as number | undefined) ??
    (payload?.timeDuration as number | undefined) ??
    20;

  if (
    inputSymbols.length < 4 ||
    outputSymbols.length < 4 ||
    inputSymbols.length !== outputSymbols.length
  ) {
    const sample = generateSwitchPayload();
    if (inputSymbols.length < 4) inputSymbols = sample.inputSymbols;
    if (outputSymbols.length < 4 || outputSymbols.length !== inputSymbols.length) {
      outputSymbols = sample.outputSymbols.slice(0, inputSymbols.length);
      if (outputSymbols.length !== inputSymbols.length) {
        outputSymbols = [...inputSymbols].sort(() => Math.random() - 0.5);
      }
    }
    if (options.length < 2) options = sample.options;
    if (!correct || !options.includes(correct)) {
      correct = sample.correctOption;
    }
  }

  if (!correct && options.length) {
    correct = options[0];
  }

  return {
    inputSymbols,
    outputSymbols,
    options,
    correct,
    timeDuration,
    scoringCorrect:
      (q.scoringCorrect as number | undefined) ??
      (payload?.scoringRules as { correctPoints?: number } | undefined)?.correctPoints,
  };
}
