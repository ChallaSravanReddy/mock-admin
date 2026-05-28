import React, { useState } from 'react';

import { Button } from '@/components/ui/button';

import { Input } from '@/components/ui/input';

import { Textarea } from '@/components/ui/textarea';

import {

  Select,

  SelectContent,

  SelectItem,

  SelectTrigger,

  SelectValue,

} from '@/components/ui/select';

import { Wand2 } from 'lucide-react';

import type { HackathonQuestion } from '../../types/hackathon';

import { getGameTypeConfig } from '../../constants/gameTypes';

import { generateHackathonQuestion } from '../../lib/hackathonGenerators';

import { PuzzleGrid, SymbolPicker } from '../puzzle';

import { SYMBOLS, type SymbolType } from '../../types/puzzle';

import { AVAILABLE_SYMBOLS, type SymbolCode } from '../../types/swithChallenge';
import { SwitchSymbolRow } from '../switch/SwitchSymbolRow';
import { normalizeSwitchQuestion } from '../../lib/normalizeSwitchQuestion';
import { generateSwitchPayload } from '../../lib/hackathonGenerators';
import { GridRoundPreview } from '../grid/GridRoundPreview';
import {
  EMPTY_5X5,
  createDefaultRound,
  type DotPosition,
  type SymmetryQuestion,
  type GridChallengeRound,
} from '../../types/gridChallenge';
import { Plus, Trash2, ChevronDown, ChevronUp, Circle, Grid3x3 } from 'lucide-react';
import { gridPayloadFromHackathon } from '../../lib/normalizeGridQuestion';
import { motionPayloadFromHackathon } from '../../lib/normalizeMotionQuestion';
import { MotionLevelPreview } from '../motion/MotionLevelPreview';
import { generateMotionLevelQuick } from '../../lib/hackathonGenerators';
import { ReadOnlyShapeGrid, ShapeIcon } from '../inductive/InductiveGridDisplay';
import { generateInductiveQuestion } from '../../lib/hackathonGenerators';
import { inductiveQuestionFromPayload } from '../../lib/normalizeInductiveQuestion';
import {
  SHAPE_TYPES,
  SHAPE_COLORS,
  createEmptyGrid,
  type ShapeCell,
  type ShapeGrid,
  type ShapeType,
  type ShapeColor,
} from '../../types/inductiveChallenge';



interface ManualQuestionEditorProps {

  question: HackathonQuestion;

  onSave: (question: HackathonQuestion) => void;

  onCancel: () => void;

  /** Hide full-page builder link when editing inside mock test dialog */

  embeddedInTest?: boolean;

}



export const ManualQuestionEditor: React.FC<ManualQuestionEditorProps> = ({

  question: initial,

  onSave,

  onCancel,

  embeddedInTest = false,

}) => {

  const [question, setQuestion] = useState<HackathonQuestion>(initial);

  const cfg = getGameTypeConfig(question.type);



  const updateMeta = (patch: Partial<Pick<HackathonQuestion, 'title' | 'description' | 'difficulty'>>) => {

    setQuestion((q) => ({ ...q, ...patch }));

  };



  const regenWithAi = () => {

    const fresh = generateHackathonQuestion(question.type, 'ai');

    setQuestion({ ...fresh, id: question.id, source: question.source });

  };



  const handleSave = () => {

    if (!question.title.trim()) {

      alert('Title is required');

      return;

    }

    onSave(question);

  };



  return (

    <div className="space-y-5">

      <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border bg-muted/40 p-4">

        <div className="flex items-center gap-3">

          <div className={`rounded-lg border p-2 ${cfg.color}`}>

            <cfg.icon className="size-5" />

          </div>

          <div>

            <p className="font-semibold text-gray-900">{cfg.label}</p>

            <p className="text-xs text-muted-foreground">

              {question.source === 'ai' ? 'Auto-generated' : 'Hand-crafted'} · edit answers below

            </p>

          </div>

        </div>

        <Button type="button" variant="outline" size="sm" className="gap-1" onClick={regenWithAi}>
          <Wand2 className="size-4" /> Auto-generate again

        </Button>

      </div>



      <div className="grid gap-4 sm:grid-cols-2">

        <div>

          <label className="text-sm font-medium">Title</label>

          <Input

            value={question.title}

            onChange={(e) => updateMeta({ title: e.target.value })}

            className="mt-1"

          />

        </div>

        <div>

          <label className="text-sm font-medium">Difficulty</label>

          <Select

            value={question.difficulty}

            onValueChange={(v) => updateMeta({ difficulty: v as HackathonQuestion['difficulty'] })}

          >

            <SelectTrigger className="mt-1 w-full">

              <SelectValue />

            </SelectTrigger>

            <SelectContent>

              <SelectItem value="easy">Easy</SelectItem>

              <SelectItem value="medium">Medium</SelectItem>

              <SelectItem value="hard">Hard</SelectItem>

            </SelectContent>

          </Select>

        </div>

      </div>



      <div>

        <label className="text-sm font-medium">Description / prompt</label>

        <Textarea

          rows={2}

          value={question.description}

          onChange={(e) => updateMeta({ description: e.target.value })}

          className="mt-1 resize-none"

        />

      </div>



      {question.type === 'puzzle' && (

        <PuzzleManualFields

          payload={question.payload}

          onChange={(payload) => setQuestion({ ...question, payload })}

        />

      )}



      {question.type === 'switch_challenge' && (

        <SwitchManualFields

          payload={question.payload}

          onChange={(payload) => setQuestion({ ...question, payload })}

        />

      )}



      {question.type === 'grid_challenge' && (

        <GridManualFields

          payload={question.payload}

          onChange={(payload) => setQuestion({ ...question, payload })}

        />

      )}



      {question.type === 'inductive_challenge' && (

        <InductiveManualFields

          payload={question.payload}

          onChange={(payload) => setQuestion({ ...question, payload })}

        />

      )}



      {question.type === 'motion_challenge' && (

        <MotionManualFields

          payload={question.payload}

          onChange={(payload) => setQuestion({ ...question, payload })}

        />

      )}



      <div className="flex justify-end gap-2 pt-2 border-t">

        <Button type="button" variant="outline" onClick={onCancel}>

          Cancel

        </Button>

        <Button type="button" onClick={handleSave}>

          Save question

        </Button>

      </div>

    </div>

  );

};



const PuzzleManualFields: React.FC<{

  payload: Extract<HackathonQuestion, { type: 'puzzle' }>['payload'];

  onChange: (p: Extract<HackathonQuestion, { type: 'puzzle' }>['payload']) => void;

}> = ({ payload, onChange }) => {

  const [selectedSymbol, setSelectedSymbol] = useState<SymbolType>(null);

  const [pickingMissing, setPickingMissing] = useState(false);



  const setCorrect = (sym: SymbolType) => {

    onChange({ ...payload, correctAnswer: sym });

  };



  const updateOption = (index: number, sym: SymbolType) => {

    const options = [...payload.options];

    options[index] = sym;

    onChange({ ...payload, options });

  };



  return (

    <div className="space-y-4 rounded-xl border p-4">

      <p className="text-sm font-medium">Matrix grid</p>

      <div className="flex flex-wrap gap-2">

        <Button

          type="button"

          variant={pickingMissing ? 'default' : 'outline'}

          size="sm"

          onClick={() => setPickingMissing((v) => !v)}

        >

          {pickingMissing ? 'Click a cell for missing slot…' : 'Set missing cell'}

        </Button>

        <Button

          type="button"

          variant="outline"

          size="sm"

          onClick={() => {

            const fresh = generateHackathonQuestion('puzzle', 'ai');

            if (fresh.type === 'puzzle') onChange(fresh.payload);

          }}

        >

          Auto-fill grid

        </Button>

      </div>

      <div className="flex justify-center">

        <PuzzleGrid

          grid={payload.grid}

          missingCell={payload.missingCell}

          onCellClick={(row, col) => {

            if (pickingMissing) {

              const prev = payload.grid[payload.missingCell.row]?.[payload.missingCell.col];

              const grid = payload.grid.map((r) => [...r]);

              grid[payload.missingCell.row][payload.missingCell.col] = prev ?? null;

              grid[row][col] = null;

              onChange({

                ...payload,

                grid,

                missingCell: { row, col },

                correctAnswer: prev ?? payload.correctAnswer,

              });

              setPickingMissing(false);

              return;

            }

            if (selectedSymbol) {

              const grid = payload.grid.map((r) => [...r]);

              grid[row][col] = selectedSymbol;

              onChange({ ...payload, grid });

            }

          }}

          isInteractive

        />

      </div>

      <SymbolPicker selectedSymbol={selectedSymbol} onSymbolSelect={setSelectedSymbol} />



      <div className="space-y-2 border-t pt-4">

        <p className="text-sm font-medium">Answer options</p>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">

          {payload.options.map((opt, i) => (

            <div key={i} className="space-y-1">

              <label className="text-xs text-muted-foreground">Option {i + 1}</label>

              <Select

                value={opt ?? ''}

                onValueChange={(v) => updateOption(i, v as SymbolType)}

              >

                <SelectTrigger>

                  <SelectValue placeholder="Symbol" />

                </SelectTrigger>

                <SelectContent>

                  {SYMBOLS.map((s) => (

                    <SelectItem key={s} value={s}>

                      {s}

                    </SelectItem>

                  ))}

                </SelectContent>

              </Select>

            </div>

          ))}

        </div>

        <div>

          <label className="text-sm font-medium">Correct answer</label>

          <Select

            value={payload.correctAnswer ?? ''}

            onValueChange={(v) => setCorrect(v as SymbolType)}

          >

            <SelectTrigger className="mt-1 w-full max-w-xs">

              <SelectValue placeholder="Pick correct symbol" />

            </SelectTrigger>

            <SelectContent>

              {SYMBOLS.map((s) => (

                <SelectItem key={s} value={s}>

                  {s}

                </SelectItem>

              ))}

            </SelectContent>

          </Select>

        </div>

      </div>

    </div>

  );

};



const SwitchManualFields: React.FC<{
  payload: Extract<HackathonQuestion, { type: 'switch_challenge' }>['payload'];
  onChange: (p: Extract<HackathonQuestion, { type: 'switch_challenge' }>['payload']) => void;
}> = ({ payload, onChange }) => {
  React.useEffect(() => {
    const sw = normalizeSwitchQuestion(payload as unknown as Record<string, unknown>);
    if (
      payload.inputSymbols.length < 4 ||
      payload.outputSymbols.length < 4 ||
      payload.inputSymbols.length !== payload.outputSymbols.length
    ) {
      onChange({
        ...payload,
        inputSymbols: sw.inputSymbols,
        outputSymbols: sw.outputSymbols,
        options: sw.options,
        correctOption: sw.correct,
        correctAnswerCode: sw.correct,
      });
    }
  }, []);

  const sw = normalizeSwitchQuestion(payload as unknown as Record<string, unknown>);
  const displayPayload = {
    ...payload,
    inputSymbols: sw.inputSymbols,
    outputSymbols: sw.outputSymbols,
    options: sw.options,
    correctOption: sw.correct,
  };

  const updateSymbols = (field: 'inputSymbols' | 'outputSymbols', text: string) => {
    const parts = text
      .split(/[,;\s]+/)
      .map((s) => s.trim().toLowerCase())
      .filter(Boolean);
    const symbols = parts.filter((p): p is SymbolCode =>
      AVAILABLE_SYMBOLS.includes(p as SymbolCode)
    );
    if (symbols.length) onChange({ ...displayPayload, [field]: symbols });
  };

  const regenSymbols = () => {
    const fresh = generateSwitchPayload();
    onChange({ ...payload, ...fresh });
  };

  const updateOption = (index: number, value: string) => {
    const options = [...displayPayload.options];
    options[index] = value;
    onChange({ ...displayPayload, options });
  };

  const addOption = () => {
    if (displayPayload.options.length >= 6) return;
    onChange({ ...displayPayload, options: [...displayPayload.options, '1234'] });
  };

  return (
    <div className="space-y-4 rounded-xl border p-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-sm font-medium">Symbol rows</p>
        <Button type="button" variant="outline" size="sm" onClick={regenSymbols}>
          New symbol set
        </Button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <SwitchSymbolRow
          symbols={displayPayload.inputSymbols}
          variant="input"
          label="Input (top row)"
        />
        <SwitchSymbolRow
          symbols={displayPayload.outputSymbols}
          variant="output"
          inputSymbols={displayPayload.inputSymbols}
          label="Output (bottom row)"
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="text-sm font-medium">Input symbols (comma-separated)</label>
          <Input
            className="mt-1 font-mono text-sm"
            value={displayPayload.inputSymbols.join(', ')}
            onChange={(e) => updateSymbols('inputSymbols', e.target.value)}
          />
        </div>
        <div>
          <label className="text-sm font-medium">Output symbols (comma-separated)</label>
          <Input
            className="mt-1 font-mono text-sm"
            value={displayPayload.outputSymbols.join(', ')}
            onChange={(e) => updateSymbols('outputSymbols', e.target.value)}
          />
        </div>
      </div>



      <div>

        <label className="text-sm font-medium">Time limit (seconds)</label>

        <Input

          type="number"

          min={5}

          className="mt-1 w-28"

          value={displayPayload.timeDuration}

          onChange={(e) =>

            onChange({ ...displayPayload, timeDuration: Math.max(5, Number(e.target.value) || 20) })

          }

        />

      </div>



      <div className="space-y-2">

        <div className="flex items-center justify-between">

          <label className="text-sm font-medium">Answer codes (options)</label>

          <Button type="button" variant="outline" size="sm" onClick={addOption}>

            + Option

          </Button>

        </div>

        {displayPayload.options.map((opt, i) => (

          <div key={i} className="flex items-center gap-2">

            <span className="text-xs text-muted-foreground w-16">Option {i + 1}</span>

            <Input

              className="font-mono"

              value={opt}

              onChange={(e) => updateOption(i, e.target.value)}

            />

          </div>

        ))}

      </div>



      <div>

        <label className="text-sm font-medium">Correct answer code</label>

        <Select

          value={displayPayload.correctOption}

          onValueChange={(v) =>
            onChange({ ...displayPayload, correctOption: v, correctAnswerCode: v })
          }

        >

          <SelectTrigger className="mt-1 w-full max-w-xs font-mono">

            <SelectValue />

          </SelectTrigger>

          <SelectContent>

            {displayPayload.options.map((o) => (

              <SelectItem key={o} value={o}>

                {o}

              </SelectItem>

            ))}

          </SelectContent>

        </Select>

      </div>

    </div>

  );

};



const clamp = (v: number, min: number, max: number) => Math.max(min, Math.min(max, v));

interface LocalDotCanvasProps {
  dots: DotPosition[];
  targetDotId: string;
  onDotsChange: (dots: DotPosition[]) => void;
  onTargetChange: (id: string) => void;
}

const LocalDotCanvas: React.FC<LocalDotCanvasProps> = ({
  dots,
  targetDotId,
  onDotsChange,
  onTargetChange,
}) => {
  const handleAddDot = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = clamp(Math.round(((e.clientX - rect.left) / rect.width) * 100), 2, 98);
    const y = clamp(Math.round(((e.clientY - rect.top) / rect.height) * 100), 2, 98);
    const newDot: DotPosition = {
      id: `dot-${Date.now()}`,
      x,
      y,
      isTarget: false,
    };
    onDotsChange([...dots, newDot]);
  };

  const handleRemoveDot = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    onDotsChange(dots.filter((d) => d.id !== id));
    if (targetDotId === id) onTargetChange('');
  };

  const handleSetTarget = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    onTargetChange(id);
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2 text-xs text-gray-505">
        <span>• Click canvas to add dot</span>
        <span>• Right-click dot to set as target (blinks)</span>
        <span>• Middle-click to remove</span>
      </div>
      <div
        className="relative w-full bg-gray-100 border-2 border-dashed border-gray-300 rounded-lg cursor-crosshair"
        style={{ height: 220 }}
        onClick={handleAddDot}
      >
        {dots.map((dot) => {
          const isTarget = dot.id === targetDotId;
          return (
            <div
              key={dot.id}
              title={isTarget ? 'Target (blinks)' : 'Right-click → set target'}
              className={`absolute -translate-x-1/2 -translate-y-1/2 rounded-full border-2 cursor-pointer transition-all ${
                isTarget
                  ? 'bg-green-500 border-green-700 w-5 h-5 shadow-lg shadow-green-300 z-10'
                  : 'bg-gray-400 border-gray-500 w-4 h-4 hover:bg-gray-500'
              }`}
              style={{ left: `${dot.x}%`, top: `${dot.y}%` }}
              onClick={(e) => e.stopPropagation()}
              onContextMenu={(e) => {
                e.preventDefault();
                handleSetTarget(dot.id, e);
              }}
              onAuxClick={(e) => {
                if (e.button === 1) handleRemoveDot(dot.id, e);
              }}
            />
          );
        })}
        {dots.length === 0 && (
          <div className="absolute inset-0 flex items-center justify-center text-gray-400 text-sm pointer-events-none">
            Click to place dots
          </div>
        )}
      </div>
      <div className="flex items-center gap-3 text-sm">
        <span className="flex items-center gap-1">
          <span className="inline-block w-4 h-4 rounded-full bg-gray-400 border border-gray-500" />
          Normal dot
        </span>
        <span className="flex items-center gap-1">
          <span className="inline-block w-5 h-5 rounded-full bg-green-500 border border-green-700" />
          Target dot (blinks)
        </span>
        <span className="text-gray-400 ml-auto">{dots.length} dots</span>
      </div>
      <div className="flex gap-2 flex-wrap">
        <Button
          size="sm"
          variant="outline"
          type="button"
          onClick={(e) => {
            e.preventDefault();
            const newDots: DotPosition[] = Array.from({ length: 20 }, (_, i) => ({
              id: `dot-${Date.now()}-${i}`,
              x: 5 + Math.round(Math.random() * 88),
              y: 5 + Math.round(Math.random() * 88),
              isTarget: false,
            }));
            onDotsChange(newDots);
            onTargetChange(newDots[0].id);
          }}
        >
          Auto-scatter 20 dots
        </Button>
        <Button
          size="sm"
          variant="outline"
          type="button"
          className="text-red-600 hover:text-red-700"
          onClick={(e) => {
            e.preventDefault();
            onDotsChange([]);
            onTargetChange('');
          }}
        >
          Clear all
        </Button>
      </div>

      {dots.length > 0 && (
        <div className="bg-gray-50 p-2.5 rounded-md border text-xs space-y-2 mt-2">
          <span className="font-semibold text-gray-700 block">Fine-tune dot coordinates (X / Y in %)</span>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2 max-h-40 overflow-y-auto pr-1">
            {dots.map((dot, idx) => {
              const isTarget = dot.id === targetDotId;
              return (
                <div key={dot.id} className="flex items-center justify-between bg-white p-1.5 rounded border">
                  <span className="font-medium text-gray-500 w-10">Dot {idx + 1}</span>
                  <div className="flex items-center gap-1">
                    <span className="text-[10px] text-gray-400">X</span>
                    <input
                      type="number"
                      min={0}
                      max={100}
                      value={dot.x}
                      onChange={(e) => {
                        const val = clamp(Number(e.target.value) || 0, 0, 100);
                        onDotsChange(dots.map(d => d.id === dot.id ? { ...d, x: val } : d));
                      }}
                      className="w-9 border rounded px-0.5 py-0.5 text-center focus:ring-1 focus:ring-blue-400"
                    />
                    <span className="text-[10px] text-gray-400">Y</span>
                    <input
                      type="number"
                      min={0}
                      max={100}
                      value={dot.y}
                      onChange={(e) => {
                        const val = clamp(Number(e.target.value) || 0, 0, 100);
                        onDotsChange(dots.map(d => d.id === dot.id ? { ...d, y: val } : d));
                      }}
                      className="w-9 border rounded px-0.5 py-0.5 text-center focus:ring-1 focus:ring-blue-400"
                    />
                  </div>
                  <div className="flex items-center gap-2">
                    <label className="flex items-center gap-1 cursor-pointer">
                      <input
                        type="radio"
                        name={`localTargetDot-${targetDotId || 'none'}`}
                        checked={isTarget}
                        onChange={() => onTargetChange(dot.id)}
                        className="cursor-pointer"
                        title="Set as target"
                      />
                      <span className="text-[9px] text-gray-400">Target</span>
                    </label>
                    <button
                      type="button"
                      onClick={(e) => handleRemoveDot(dot.id, e)}
                      className="text-red-500 hover:text-red-700 font-bold px-1 ml-1"
                      title="Delete dot"
                    >
                      ×
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

interface LocalSymmetryEditorProps {
  left: boolean[][];
  right: boolean[][];
  isSymmetric: boolean;
  label: string;
  onLeftChange: (grid: boolean[][]) => void;
  onRightChange: (grid: boolean[][]) => void;
  onIsSymmetricChange: (v: boolean) => void;
  onLabelChange: (v: string) => void;
}

const LocalSymmetryEditor: React.FC<LocalSymmetryEditorProps> = ({
  left,
  right,
  isSymmetric,
  label,
  onLeftChange,
  onRightChange,
  onIsSymmetricChange,
  onLabelChange,
}) => {
  const toggleCell = (
    grid: boolean[][],
    onChange: (g: boolean[][]) => void,
    r: number,
    c: number
  ) => {
    const clone = grid.map((row) => [...row]);
    clone[r][c] = !clone[r][c];
    onChange(clone);
  };

  const SymmetryGridEditor = ({
    grid,
    onChange,
    label: gridLabel,
  }: {
    grid: boolean[][];
    onChange: (g: boolean[][]) => void;
    label: string;
  }) => (
    <div className="flex flex-col items-center gap-2">
      <span className="text-xs font-semibold text-gray-500 uppercase">{gridLabel}</span>
      <div
        className="grid gap-0.5 bg-gray-200 p-1 rounded"
        style={{ gridTemplateColumns: `repeat(${grid[0]?.length ?? 5}, 1fr)` }}
      >
        {grid.map((row, ri) =>
          row.map((cell, ci) => (
            <button
              key={`${ri}-${ci}`}
              type="button"
              onClick={() => toggleCell(grid, onChange, ri, ci)}
              className={`w-7 h-7 border border-gray-300 transition-colors ${
                cell ? 'bg-gray-700' : 'bg-white hover:bg-gray-100'
              }`}
            />
          ))
        )}
      </div>
      <div className="flex gap-1">
        <Button
          size="sm"
          variant="ghost"
          type="button"
          className="text-xs"
          onClick={() => onChange(EMPTY_5X5())}
        >
          Clear
        </Button>
        <Button
          size="sm"
          variant="ghost"
          type="button"
          className="text-xs"
          onClick={() => {
            const filled = Array.from({ length: 5 }, () => Array(5).fill(true));
            onChange(filled);
          }}
        >
          Fill
        </Button>
      </div>
    </div>
  );

  return (
    <div className="space-y-3">
      <div>
        <label className="block text-xs font-medium text-gray-600 mb-1">Question Label</label>
        <input
          type="text"
          value={label}
          onChange={(e) => onLabelChange(e.target.value)}
          placeholder='e.g. "Rotated but identical?"'
          className="w-full px-3 py-1.5 border border-gray-300 rounded text-sm focus:outline-none focus:ring-1 focus:ring-blue-400"
        />
      </div>

      <div className="flex gap-6 flex-wrap justify-center py-4 bg-gray-50 rounded-lg border">
        <SymmetryGridEditor grid={left} onChange={onLeftChange} label="Left Grid" />
        <div className="flex items-center text-gray-400 font-bold text-xl">vs</div>
        <SymmetryGridEditor grid={right} onChange={onRightChange} label="Right Grid" />
      </div>

      <div className="flex flex-wrap gap-1.5 justify-center py-2 bg-gray-55 border-x border-b rounded-b-lg -mt-4 px-4 text-[11px]">
        <Button
          type="button"
          size="sm"
          variant="outline"
          className="text-[10px] h-7 px-2"
          onClick={() => {
            onRightChange(left.map(row => [...row]));
          }}
        >
          Copy Left → Right
        </Button>
        <Button
          type="button"
          size="sm"
          variant="outline"
          className="text-[10px] h-7 px-2"
          onClick={() => {
            const reflected = left.map(row => [...row].reverse());
            onRightChange(reflected);
          }}
        >
          Reflect Horiz.
        </Button>
        <Button
          type="button"
          size="sm"
          variant="outline"
          className="text-[10px] h-7 px-2"
          onClick={() => {
            const reflected = Array.from({ length: 5 }, (_, r) =>
              Array.from({ length: 5 }, (_, c) => left[4 - r][c])
            );
            onRightChange(reflected);
          }}
        >
          Reflect Vert.
        </Button>
        <Button
          type="button"
          size="sm"
          variant="outline"
          className="text-[10px] h-7 px-2"
          onClick={() => {
            onLeftChange(left.map(row => row.map(v => !v)));
          }}
        >
          Invert L
        </Button>
        <Button
          type="button"
          size="sm"
          variant="outline"
          className="text-[10px] h-7 px-2"
          onClick={() => {
            onRightChange(right.map(row => row.map(v => !v)));
          }}
        >
          Invert R
        </Button>
      </div>

      <div>
        <label className="block text-xs font-medium text-gray-600 mb-1">Correct Answer</label>
        <div className="flex gap-3">
          <button
            type="button"
            onClick={() => onIsSymmetricChange(true)}
            className={`px-4 py-1.5 rounded border font-semibold text-xs transition ${
              isSymmetric
                ? 'bg-green-600 text-white border-green-700 shadow-sm'
                : 'bg-white border-gray-300 hover:bg-gray-50'
            }`}
          >
            Yes (Symmetric)
          </button>
          <button
            type="button"
            onClick={() => onIsSymmetricChange(false)}
            className={`px-4 py-1.5 rounded border font-semibold text-xs transition ${
              !isSymmetric
                ? 'bg-red-600 text-white border-red-700 shadow-sm'
                : 'bg-white border-gray-300 hover:bg-gray-50'
            }`}
          >
            No (Not Symmetric)
          </button>
        </div>
      </div>
    </div>
  );
};

interface LocalRoundEditorProps {
  round: GridChallengeRound;
  index: number;
  onUpdate: (round: GridChallengeRound) => void;
  onDelete: () => void;
  canDelete: boolean;
}

const LocalRoundEditor: React.FC<LocalRoundEditorProps> = ({
  round,
  index,
  onUpdate,
  onDelete,
  canDelete,
}) => {
  const [expanded, setExpanded] = useState(index === 0);

  const updateDots = (dots: DotPosition[]) =>
    onUpdate({ ...round, dotPhase: { ...round.dotPhase, dots } });

  const updateTarget = (id: string) =>
    onUpdate({ ...round, dotPhase: { ...round.dotPhase, targetDotId: id } });

  const updateHighlightMs = (ms: number) =>
    onUpdate({ ...round, dotPhase: { ...round.dotPhase, highlightDurationMs: ms } });

  const updateSymmetry = (patch: Partial<SymmetryQuestion>) =>
    onUpdate({ ...round, symmetryPhase: { ...round.symmetryPhase, ...patch } });

  return (
    <div className="border border-blue-200 rounded-lg overflow-hidden bg-white shadow-sm">
      <div className="flex items-center justify-between bg-blue-50/50 px-4 py-2 border-b border-blue-100">
        <span className="font-semibold text-sm text-blue-900">Round {index + 1}</span>
        <div className="flex items-center gap-2">
          {canDelete && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="text-red-500 hover:text-red-600 hover:bg-red-50 p-1 h-7"
              onClick={onDelete}
            >
              <Trash2 size={14} />
            </Button>
          )}
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="p-1 h-7 text-gray-500"
            onClick={() => setExpanded(!expanded)}
          >
            {expanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
          </Button>
        </div>
      </div>

      {expanded && (
        <div className="p-4 space-y-6">
          <div>
            <h4 className="text-xs font-semibold text-gray-705 mb-2 flex items-center gap-1">
              <Circle size={12} /> Dot Phase — place dots, select target
            </h4>
            <LocalDotCanvas
              dots={round.dotPhase.dots}
              targetDotId={round.dotPhase.targetDotId}
              onDotsChange={updateDots}
              onTargetChange={updateTarget}
            />
            <div className="mt-3">
              <label className="block text-xs font-medium text-gray-600 mb-1">
                Highlight duration (ms)
              </label>
              <input
                type="number"
                min={500}
                max={10000}
                step={500}
                value={round.dotPhase.highlightDurationMs}
                onChange={(e) => updateHighlightMs(Number(e.target.value) || 2000)}
                className="w-32 px-2 py-1 border border-gray-300 rounded text-xs focus:outline-none focus:ring-1 focus:ring-blue-400"
              />
            </div>
          </div>

          <hr className="border-gray-150" />

          <div>
            <h4 className="text-xs font-semibold text-gray-750 mb-2 flex items-center gap-1">
              <Grid3x3 size={12} /> Symmetry Phase — draw grids
            </h4>
            <LocalSymmetryEditor
              left={round.symmetryPhase.gridLeft}
              right={round.symmetryPhase.gridRight}
              isSymmetric={round.symmetryPhase.isSymmetric}
              label={round.symmetryPhase.label ?? ''}
              onLeftChange={(g) => updateSymmetry({ gridLeft: g })}
              onRightChange={(g) => updateSymmetry({ gridRight: g })}
              onIsSymmetricChange={(v) => updateSymmetry({ isSymmetric: v })}
              onLabelChange={(v) => updateSymmetry({ label: v })}
            />
          </div>
        </div>
      )}
    </div>
  );
};

const GridManualFields: React.FC<{
  payload: Extract<HackathonQuestion, { type: 'grid_challenge' }>['payload'];
  onChange: (p: Extract<HackathonQuestion, { type: 'grid_challenge' }>['payload']) => void;
}> = ({ payload, onChange }) => {
  React.useEffect(() => {
    const fixed = gridPayloadFromHackathon(payload);
    if (fixed.rounds.length !== payload.rounds.length || !payload.rounds[0]?.dotPhase?.dots?.length) {
      onChange(fixed);
    }
  }, []);

  const display = gridPayloadFromHackathon(payload);

  const regenAll = () => {
    const fresh = generateHackathonQuestion('grid_challenge', 'ai');
    if (fresh.type === 'grid_challenge') onChange(fresh.payload);
  };

  const updateRound = (idx: number, round: GridChallengeRound) => {
    const updatedRounds = display.rounds.map((r, i) => (i === idx ? round : r));
    onChange({
      ...display,
      rounds: updatedRounds,
    });
  };

  const deleteRound = (idx: number) => {
    if (display.rounds.length > 1) {
      const updatedRounds = display.rounds.filter((_, i) => i !== idx);
      onChange({
        ...display,
        rounds: updatedRounds,
        totalRounds: updatedRounds.length,
      });
    }
  };

  const addRound = () => {
    if (display.rounds.length < 6) {
      const updatedRounds = [...display.rounds, createDefaultRound(display.rounds.length)];
      onChange({
        ...display,
        rounds: updatedRounds,
        totalRounds: updatedRounds.length,
      });
    }
  };

  return (
    <div className="space-y-4 rounded-xl border p-4 bg-white shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-sm font-semibold text-gray-700">Manually configure Grid Challenge rounds</p>
        <Button type="button" variant="outline" size="sm" onClick={regenAll}>
          Randomize rounds
        </Button>
      </div>

      <div className="space-y-3">
        {display.rounds.map((r, i) => (
          <LocalRoundEditor
            key={r.id || `r-${i}`}
            round={r}
            index={i}
            onUpdate={(updated) => updateRound(i, updated)}
            onDelete={() => deleteRound(i)}
            canDelete={display.rounds.length > 1}
          />
        ))}
      </div>

      {display.rounds.length < 6 && (
        <Button type="button" variant="outline" className="w-full gap-2 border-dashed" onClick={addRound}>
          <Plus size={16} /> Add Round
        </Button>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
        <div>
          <label className="block text-xs font-semibold text-gray-600 mb-1">
            Symmetry Display Duration (ms)
          </label>
          <input
            type="number"
            min={1000}
            max={30000}
            step={1000}
            value={display.symmetryDisplayMs ?? 6000}
            onChange={(e) => {
              const ms = Math.max(1000, Number(e.target.value) || 6000);
              onChange({
                ...display,
                symmetryDisplayMs: ms,
              });
            }}
            className="w-full px-3 py-1.5 border border-gray-300 rounded text-sm focus:outline-none focus:ring-1 focus:ring-blue-400"
          />
        </div>
        <div>
          <label className="block text-xs font-semibold text-gray-600 mb-1">
            Total Rounds Count
          </label>
          <input
            type="number"
            disabled
            value={display.totalRounds}
            className="w-full px-3 py-1.5 border border-gray-200 bg-gray-50 rounded text-sm text-gray-500 cursor-not-allowed"
          />
        </div>
      </div>
    </div>
  );
};



const ShapePicker: React.FC<{
  selected: ShapeCell | null;
  onSelect: (cell: ShapeCell | null) => void;
}> = ({ selected, onSelect }) => {
  const [activeShape, setActiveShape] = useState<ShapeType>(selected?.shape ?? 'square');
  const [activeColor, setActiveColor] = useState<ShapeColor>(selected?.color ?? 'green');

  const handlePick = (shape: ShapeType, color: ShapeColor) => {
    setActiveShape(shape);
    setActiveColor(color);
    onSelect({ shape, color });
  };

  return (
    <div className="space-y-2 p-3 bg-gray-50 rounded-lg border w-full">
      <p className="text-xs font-semibold text-gray-500 uppercase">Shape Picker (click grid cells to apply active brush)</p>
      <div className="flex flex-wrap gap-1.5">
        {SHAPE_TYPES.map((s) =>
          SHAPE_COLORS.map((c) => {
            const isSel = selected && selected.shape === s && selected.color === c;
            return (
              <button
                type="button"
                key={`${s}-${c}`}
                title={`${c} ${s}`}
                onClick={() => handlePick(s, c)}
                className={`w-9 h-9 flex items-center justify-center rounded border-2 transition ${
                  isSel ? 'border-blue-600 bg-blue-50 scale-110 shadow-sm' : 'border-transparent hover:border-gray-200 bg-white'
                }`}
              >
                <ShapeIcon shape={s} color={c} size={18} />
              </button>
            );
          })
        )}
      </div>
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={() => onSelect(null)}
          className={`text-xs px-2.5 py-1 rounded border transition ${
            selected === null
              ? 'border-red-600 bg-red-50 text-red-600 font-semibold shadow-sm'
              : 'border-gray-300 text-red-500 hover:bg-gray-50 bg-white'
          }`}
        >
          Clear brush (eraser)
        </button>
        {selected && (
          <div className="flex items-center gap-1.5 text-xs text-gray-600 font-medium">
            <span>Active:</span>
            <ShapeIcon shape={selected.shape} color={selected.color} size={14} />
            <span className="capitalize">{selected.color} {selected.shape}</span>
          </div>
        )}
      </div>
    </div>
  );
};

const InteractiveGridEditor: React.FC<{
  grid: ShapeGrid;
  onChange: (grid: ShapeGrid) => void;
  selectedCell: ShapeCell | null;
  label: string;
  size?: number;
}> = ({ grid, onChange, selectedCell, label, size = 3 }) => {
  const handleCellClick = (r: number, c: number) => {
    const clone: ShapeGrid = grid.map((row) => [...row]);
    clone[r][c] = selectedCell ? { ...selectedCell } : null;
    onChange(clone);
  };

  return (
    <div className="flex flex-col items-center gap-2 bg-white p-3 rounded-lg border border-gray-150 shadow-sm">
      <span className="text-xs font-semibold text-gray-500 uppercase">{label}</span>
      <div
        className="grid gap-1 p-2 bg-gray-50 border border-gray-200 rounded"
        style={{ gridTemplateColumns: `repeat(${size}, 1fr)` }}
      >
        {grid.map((row, ri) =>
          row.map((cell, ci) => (
            <button
              key={`${ri}-${ci}`}
              type="button"
              onClick={() => handleCellClick(ri, ci)}
              className="w-12 h-12 border border-gray-200 flex items-center justify-center bg-white hover:bg-blue-50 rounded transition-all focus:outline-none"
              title={cell ? `${cell.color} ${cell.shape}` : 'Empty'}
            >
              {cell && <ShapeIcon shape={cell.shape} color={cell.color} size={22} />}
            </button>
          ))
        )}
      </div>
      <Button
        size="sm"
        variant="ghost"
        type="button"
        className="text-xs text-red-500 hover:text-red-600 hover:bg-red-50"
        onClick={() => onChange(createEmptyGrid(size))}
      >
        Clear grid
      </Button>
    </div>
  );
};

const InductiveManualFields: React.FC<{
  payload: Extract<HackathonQuestion, { type: 'inductive_challenge' }>['payload'];
  onChange: (p: Extract<HackathonQuestion, { type: 'inductive_challenge' }>['payload']) => void;
}> = ({ payload, onChange }) => {
  const [selectedCell, setSelectedCell] = useState<ShapeCell | null>({
    shape: 'square',
    color: 'green',
  });

  React.useEffect(() => {
    if (!payload.questions?.length) {
      onChange({ ...payload, questions: [generateInductiveQuestion(0)] });
    }
  }, [payload.questions?.length]);

  const questions =
    payload.questions.length > 0
      ? inductiveQuestionFromPayload(payload.questions)
      : [generateInductiveQuestion(0)];

  const q0 = questions[0];

  const updateQ0 = (patch: Partial<typeof q0>) => {
    onChange({
      ...payload,
      questions: [{ ...q0, ...patch }, ...payload.questions.slice(1)],
    });
  };

  const toggleCorrect = (id: string) => {
    const ids = q0.correctOptionIds.includes(id)
      ? q0.correctOptionIds.filter((x) => x !== id)
      : q0.correctOptionIds.length < 2
        ? [...q0.correctOptionIds, id]
        : q0.correctOptionIds;
    updateQ0({
      correctOptionIds: ids,
      options: q0.options.map((o) => ({ ...o, isCorrect: ids.includes(o.id) })),
    });
  };

  const regenPattern = () => {
    const fresh = generateInductiveQuestion(0);
    onChange({ ...payload, questions: [fresh] });
  };

  const updateExampleGridA = (grid: ShapeGrid) => {
    updateQ0({
      examplePair: {
        ...q0.examplePair,
        gridA: grid,
      },
    });
  };

  const updateExampleGridB = (grid: ShapeGrid) => {
    updateQ0({
      examplePair: {
        ...q0.examplePair,
        gridB: grid,
      },
    });
  };

  const updateOptionGrid = (optionId: string, grid: ShapeGrid) => {
    updateQ0({
      options: q0.options.map((o) => (o.id === optionId ? { ...o, grid } : o)),
    });
  };

  return (
    <div className="space-y-4 rounded-xl border p-4 bg-white shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-sm font-semibold text-gray-700">Manually design Inductive grids</p>
        <Button type="button" variant="outline" size="sm" onClick={regenPattern}>
          Randomize grids
        </Button>
      </div>

      <ShapePicker selected={selectedCell} onSelect={setSelectedCell} />

      <div className="space-y-2">
        <p className="text-sm font-medium text-gray-700">Example pair (demonstrates the transformation rule)</p>
        <div className="flex gap-6 items-center justify-center p-4 bg-gray-50 rounded-lg border">
          <InteractiveGridEditor
            grid={q0.examplePair.gridA}
            onChange={updateExampleGridA}
            selectedCell={selectedCell}
            label="Grid A"
          />
          <span className="text-xl font-bold text-gray-400">→</span>
          <InteractiveGridEditor
            grid={q0.examplePair.gridB}
            onChange={updateExampleGridB}
            selectedCell={selectedCell}
            label="Grid B"
          />
        </div>
      </div>

      <div>
        <p className="text-sm font-medium mb-3 text-gray-700">Answer options (pick exactly 2 correct options that match the rule)</p>
        <div className="grid grid-cols-2 gap-4">
          {q0.options.map((opt) => (
            <div
              key={opt.id}
              className={`rounded-lg border-2 p-3 transition ${
                q0.correctOptionIds.includes(opt.id)
                  ? 'border-green-600 bg-green-50/50'
                  : 'border-gray-200'
              }`}
            >
              <div className="flex justify-between items-center mb-2">
                <span className="font-semibold text-sm">Option {opt.id}</span>
                <Button
                  type="button"
                  size="sm"
                  variant={q0.correctOptionIds.includes(opt.id) ? 'default' : 'outline'}
                  onClick={() => toggleCorrect(opt.id)}
                >
                  {q0.correctOptionIds.includes(opt.id) ? 'Correct ✓' : 'Mark correct'}
                </Button>
              </div>
              <div className="flex justify-center">
                <InteractiveGridEditor
                  grid={opt.grid}
                  onChange={(g) => updateOptionGrid(opt.id, g)}
                  selectedCell={selectedCell}
                  label={`Grid ${opt.id}`}
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700">Display duration (seconds)</label>
          <Input
            type="number"
            min={5}
            max={300}
            className="mt-1 w-full"
            value={Math.round((q0.displayDurationMs ?? 30000) / 1000)}
            onChange={(e) => {
              const sec = Math.max(5, Number(e.target.value) || 30);
              updateQ0({ displayDurationMs: sec * 1000 });
            }}
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">Pattern/Rule note (admin eyes only)</label>
          <Textarea
            className="mt-1 h-9 resize-none"
            placeholder="e.g. Total shapes in Grid B must equal Grid A"
            value={q0.rule || ''}
            onChange={(e) => updateQ0({ rule: e.target.value })}
          />
        </div>
      </div>
    </div>
  );
};



const MotionManualFields: React.FC<{

  payload: Extract<HackathonQuestion, { type: 'motion_challenge' }>['payload'];

  onChange: (p: Extract<HackathonQuestion, { type: 'motion_challenge' }>['payload']) => void;

}> = ({ payload, onChange }) => {
  React.useEffect(() => {
    if (!payload.levels?.length || !payload.levels[0]?.grid?.length) {
      onChange(motionPayloadFromHackathon({ ...payload, timeDurationSeconds: payload.timeDurationSeconds ?? 240 }));
    }
  }, []);

  const display = motionPayloadFromHackathon(payload);

  return (
  <div className="space-y-3 rounded-xl border p-4">

    <div className="grid gap-4 sm:grid-cols-2">

      <div>

        <label className="text-sm font-medium">Levels</label>

        <Input

          type="number"

          min={1}

          max={5}

          className="mt-1 w-24"

          value={display.levels.length}

          onChange={(e) => {

            const n = Math.min(5, Math.max(1, Number(e.target.value) || 1));

            const levels = [...display.levels];

            while (levels.length < n) {

              const fresh = generateHackathonQuestion('motion_challenge', 'ai');

              if (fresh.type === 'motion_challenge' && fresh.payload.levels[0]) {

                levels.push({
                  ...fresh.payload.levels[0],
                  id: `level-${levels.length + 1}`,
                  label: `Level ${levels.length + 1}`,
                });

              }

            }

            onChange({ ...display, levels: levels.slice(0, n) });

          }}

        />

      </div>

      <div>

        <label className="text-sm font-medium">Time limit (seconds)</label>

        <Input

          type="number"

          min={30}

          className="mt-1 w-28"

          value={display.timeDurationSeconds ?? 240}

          onChange={(e) =>

            onChange({

              ...display,

              timeDurationSeconds: Math.max(30, Number(e.target.value) || 240),

            })

          }

        />

      </div>

    </div>

    <div className="grid gap-3 sm:grid-cols-2">
      {display.levels.map((lv, i) => (
        <MotionLevelPreview key={lv.id ?? i} level={lv} index={i} />
      ))}
    </div>

  </div>
  );
};


