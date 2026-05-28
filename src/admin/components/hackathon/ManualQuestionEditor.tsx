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
import { gridPayloadFromHackathon } from '../../lib/normalizeGridQuestion';
import { motionPayloadFromHackathon } from '../../lib/normalizeMotionQuestion';
import { MotionLevelPreview } from '../motion/MotionLevelPreview';
import { generateMotionLevelQuick } from '../../lib/hackathonGenerators';
import { ReadOnlyShapeGrid } from '../inductive/InductiveGridDisplay';
import { generateInductiveQuestion } from '../../lib/hackathonGenerators';
import { inductiveQuestionFromPayload } from '../../lib/normalizeInductiveQuestion';



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

  return (
    <div className="space-y-4 rounded-xl border p-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-sm font-medium">Grid rounds preview</p>
        <Button type="button" variant="outline" size="sm" onClick={regenAll}>
          Regenerate all rounds
        </Button>
      </div>
      <div>
        <label className="text-sm font-medium">Number of rounds</label>
        <Input
          type="number"
          min={1}
          max={10}
          className="mt-1 w-24"
          value={display.totalRounds}
          onChange={(e) => {
            const n = Math.min(10, Math.max(1, Number(e.target.value) || 1));
            onChange(gridPayloadFromHackathon({ ...display, totalRounds: n }));
          }}
        />
      </div>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {display.rounds.map((r, i) => (
          <GridRoundPreview key={r.id ?? i} round={r} roundIndex={i} />
        ))}
      </div>
    </div>
  );
};



const InductiveManualFields: React.FC<{
  payload: Extract<HackathonQuestion, { type: 'inductive_challenge' }>['payload'];
  onChange: (p: Extract<HackathonQuestion, { type: 'inductive_challenge' }>['payload']) => void;
}> = ({ payload, onChange }) => {
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

  return (
    <div className="space-y-4 rounded-xl border p-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-sm font-medium">Example pair (the rule)</p>
        <Button type="button" variant="outline" size="sm" onClick={regenPattern}>
          New pattern
        </Button>
      </div>
      <div className="flex gap-6 items-center justify-center p-4 bg-gray-50 rounded-lg border">
        <ReadOnlyShapeGrid grid={q0.examplePair.gridA} label="Grid A" />
        <span className="text-xl font-bold text-gray-400">→</span>
        <ReadOnlyShapeGrid grid={q0.examplePair.gridB} label="Grid B" />
      </div>

      <div>
        <p className="text-sm font-medium mb-3">Answer options (pick 2 correct)</p>
        <div className="grid grid-cols-2 gap-3">
          {q0.options.map((opt) => (
            <div
              key={opt.id}
              className={`rounded-lg border-2 p-3 ${
                q0.correctOptionIds.includes(opt.id)
                  ? 'border-green-600 bg-green-50'
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
              <ReadOnlyShapeGrid grid={opt.grid} />
            </div>
          ))}
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


