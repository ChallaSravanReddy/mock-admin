import React, { useState, useCallback } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Plus,
  Trash2,
  Eye,
  Circle,
  Grid3x3,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import {
  BuilderPageHeader,
  BuilderValidationAlerts,
  BuilderActionBar,
  GameInfoCard,
  SaveToMockTestDialog,
} from '../components/builder';
import {
  GridChallengeRound,
  DotPosition,
  SymmetryQuestion,
  createDefaultRound,
  EMPTY_5X5,
} from '../types/gridChallenge';
import { gridChallengeService } from '../services/gridChallengeService';
import { useMockTestStore } from '../store';

// ─── Mini helpers ─────────────────────────────────────────────────────────────

const clamp = (v: number, min: number, max: number) => Math.max(min, Math.min(max, v));

// ─── DotCanvas ───────────────────────────────────────────────────────────────
// Interactive canvas for placing/moving dots
interface DotCanvasProps {
  dots: DotPosition[];
  targetDotId: string;
  onDotsChange: (dots: DotPosition[]) => void;
  onTargetChange: (id: string) => void;
}

const DotCanvas: React.FC<DotCanvasProps> = ({
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
      <div className="flex items-center gap-2 text-xs text-gray-500">
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
          onClick={(e) => {
            e.preventDefault();
            // Scatter 20 random dots
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
    </div>
  );
};

// ─── SymmetryEditor ───────────────────────────────────────────────────────────
interface SymmetryEditorProps {
  left: boolean[][];
  right: boolean[][];
  isSymmetric: boolean;
  label: string;
  onLeftChange: (grid: boolean[][]) => void;
  onRightChange: (grid: boolean[][]) => void;
  onIsSymmetricChange: (v: boolean) => void;
  onLabelChange: (v: string) => void;
}

const SymmetryEditor: React.FC<SymmetryEditorProps> = ({
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

  const GridEditor = ({
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
        className="grid gap-0.5"
        style={{ gridTemplateColumns: `repeat(${grid[0]?.length ?? 5}, 1fr)` }}
      >
        {grid.map((row, ri) =>
          row.map((cell, ci) => (
            <button
              key={`${ri}-${ci}`}
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
          className="text-xs"
          onClick={() => onChange(EMPTY_5X5())}
        >
          Clear
        </Button>
        <Button
          size="sm"
          variant="ghost"
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
        <label className="block text-sm font-medium mb-1">Question Label</label>
        <input
          type="text"
          value={label}
          onChange={(e) => onLabelChange(e.target.value)}
          placeholder='e.g. "Rotated but identical?"'
          className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      <div className="flex gap-6 flex-wrap justify-center py-4 bg-gray-50 rounded-lg border">
        <GridEditor grid={left} onChange={onLeftChange} label="Left Grid" />
        <div className="flex items-center text-gray-400 font-bold text-xl">vs</div>
        <GridEditor grid={right} onChange={onRightChange} label="Right Grid" />
      </div>

      <div>
        <label className="block text-sm font-medium mb-1">Correct Answer</label>
        <div className="flex gap-3">
          <button
            onClick={() => onIsSymmetricChange(true)}
            className={`px-6 py-2 rounded-lg border-2 font-medium text-sm transition ${
              isSymmetric
                ? 'bg-green-600 text-white border-green-700'
                : 'border-gray-300 hover:bg-gray-50'
            }`}
          >
            Yes (Symmetric)
          </button>
          <button
            onClick={() => onIsSymmetricChange(false)}
            className={`px-6 py-2 rounded-lg border-2 font-medium text-sm transition ${
              !isSymmetric
                ? 'bg-red-600 text-white border-red-700'
                : 'border-gray-300 hover:bg-gray-50'
            }`}
          >
            No (Not Symmetric)
          </button>
        </div>
      </div>
    </div>
  );
};

// ─── RoundEditor ──────────────────────────────────────────────────────────────
interface RoundEditorProps {
  round: GridChallengeRound;
  index: number;
  onUpdate: (round: GridChallengeRound) => void;
  onDelete: () => void;
  canDelete: boolean;
}

const RoundEditor: React.FC<RoundEditorProps> = ({
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
    <Card className="border-blue-200">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base">Round {index + 1}</CardTitle>
          <div className="flex gap-2">
            {canDelete && (
              <Button
                variant="ghost"
                size="sm"
                className="text-red-600 hover:text-red-700"
                onClick={onDelete}
              >
                <Trash2 size={15} />
              </Button>
            )}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setExpanded(!expanded)}
            >
              {expanded ? <ChevronUp size={15} /> : <ChevronDown size={15} />}
            </Button>
          </div>
        </div>
      </CardHeader>

      {expanded && (
        <CardContent className="space-y-6">
          {/* ── Dot Phase ── */}
          <div>
            <h4 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-1">
              <Circle size={14} /> Dot Phase — place dots, right-click to set target
            </h4>
            <DotCanvas
              dots={round.dotPhase.dots}
              targetDotId={round.dotPhase.targetDotId}
              onDotsChange={updateDots}
              onTargetChange={updateTarget}
            />
            <div className="mt-3">
              <label className="block text-xs font-medium text-gray-600 mb-1">
                Highlight duration (ms) — how long target blinks
              </label>
              <input
                type="number"
                min={500}
                max={10000}
                step={500}
                value={round.dotPhase.highlightDurationMs}
                onChange={(e) => updateHighlightMs(Number(e.target.value))}
                className="w-32 px-2 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          <hr />

          {/* ── Symmetry Phase ── */}
          <div>
            <h4 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-1">
              <Grid3x3 size={14} /> Symmetry Phase — draw the two 5×5 patterns
            </h4>
            <SymmetryEditor
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
        </CardContent>
      )}
    </Card>
  );
};

// ─── Main Page ────────────────────────────────────────────────────────────────
export const GridChallengeBuilder: React.FC = () => {
  const { mockTests, updateMockTest } = useMockTestStore();

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [difficulty, setDifficulty] = useState<'easy' | 'medium' | 'hard'>('medium');
  const [rounds, setRounds] = useState<GridChallengeRound[]>([
    createDefaultRound(0),
    createDefaultRound(1),
    createDefaultRound(2),
  ]);
  const [correctPoints, setCorrectPoints] = useState(3);
  const [wrongPoints, setWrongPoints] = useState(-1);
  const [symmetryDisplayMs, setSymmetryDisplayMs] = useState(6000);
  const [highlightMs, setHighlightMs] = useState(2000);

  const [validationErrors, setValidationErrors] = useState<string[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const [showDialog, setShowDialog] = useState(false);
  const [selectedMockTest, setSelectedMockTest] = useState('');

  const addRound = () => {
    if (rounds.length < 6) {
      setRounds([...rounds, createDefaultRound(rounds.length)]);
    }
  };

  const updateRound = useCallback(
    (idx: number, round: GridChallengeRound) => {
      setRounds((prev) => prev.map((r, i) => (i === idx ? round : r)));
    },
    []
  );

  const deleteRound = (idx: number) => {
    if (rounds.length > 1) {
      setRounds(rounds.filter((_, i) => i !== idx));
    }
  };

  const validate = (): boolean => {
    const errors: string[] = [];
    if (!title.trim()) errors.push('Title is required');
    if (!description.trim()) errors.push('Description is required');
    if (rounds.length < 1) errors.push('At least 1 round is required');
    rounds.forEach((r, i) => {
      if (r.dotPhase.dots.length < 5)
        errors.push(`Round ${i + 1}: add at least 5 dots`);
      if (!r.dotPhase.targetDotId)
        errors.push(`Round ${i + 1}: set a target dot (right-click a dot)`);
    });
    setValidationErrors(errors);
    return errors.length === 0;
  };

  const handleSave = async () => {
    if (!validate()) return;
    if (!selectedMockTest) {
      alert('Please select a mock test');
      return;
    }

    try {
      setIsSaving(true);
      await gridChallengeService.createGame({
        title,
        description,
        difficulty,
        totalRounds: rounds.length,
        rounds,
        correctPoints,
        wrongPoints,
        symmetryDisplayMs,
        mockTestId: selectedMockTest,
      });

      // Update mock test totalQuestions in Zustand store
      const test = mockTests.find((t) => t.id === selectedMockTest);
      if (test) {
        updateMockTest(selectedMockTest, {
          totalQuestions: (test.totalQuestions ?? 0) + 1,
        });
      }

      alert('Grid Challenge saved successfully!');
      resetForm();
      setShowDialog(false);
      setSelectedMockTest('');
    } catch {
      alert('Failed to save game');
    } finally {
      setIsSaving(false);
    }
  };

  const handleAutoGenerate = () => {
    const numRounds = 3;
    const newRounds: GridChallengeRound[] = [];
    
    for (let i = 0; i < numRounds; i++) {
      const numDots = 8 + Math.floor(Math.random() * 8); // 8 to 15 dots
      const dots: DotPosition[] = [];
      for (let d = 0; d < numDots; d++) {
        dots.push({
          id: `dot-${Date.now()}-${i}-${d}`,
          x: 5 + Math.floor(Math.random() * 90),
          y: 5 + Math.floor(Math.random() * 90),
          isTarget: false,
        });
      }
      const targetIdx = Math.floor(Math.random() * dots.length);
      dots[targetIdx].isTarget = true;
      const targetDotId = dots[targetIdx].id;

      const isSymmetric = Math.random() > 0.5;
      const leftGrid = Array.from({ length: 5 }, () => Array(5).fill(false));
      const rightGrid = Array.from({ length: 5 }, () => Array(5).fill(false));
      
      for (let r = 0; r < 5; r++) {
        for (let c = 0; c < 5; c++) {
          if (Math.random() > 0.5) {
            leftGrid[r][c] = true;
            rightGrid[r][c] = true;
          }
        }
      }
      
      if (!isSymmetric) {
        const changes = 1 + Math.floor(Math.random() * 3);
        for (let ch = 0; ch < changes; ch++) {
          const rr = Math.floor(Math.random() * 5);
          const rc = Math.floor(Math.random() * 5);
          rightGrid[rr][rc] = !rightGrid[rr][rc];
        }
      }

      newRounds.push({
        id: `round-${Date.now()}-${i}`,
        dotPhase: { dots, targetDotId, highlightDurationMs: 2000 },
        symmetryPhase: {
          id: `sym-${Date.now()}-${i}`,
          gridLeft: leftGrid,
          gridRight: rightGrid,
          isSymmetric,
          label: isSymmetric ? "Are they identical?" : "Are they different?",
        },
      });
    }
    
    setRounds(newRounds);
    setTitle(`Auto Grid Challenge ${Math.floor(Math.random() * 1000)}`);
    setDescription("Memorize the blinking target dot, then answer the symmetry question.");
    setValidationErrors([]);
  };

  const resetForm = () => {
    setTitle('');
    setDescription('');
    setDifficulty('medium');
    setRounds([createDefaultRound(0), createDefaultRound(1), createDefaultRound(2)]);
    setCorrectPoints(3);
    setWrongPoints(-1);
    setSymmetryDisplayMs(6000);
    setValidationErrors([]);
  };

  return (
    <div className="space-y-6">
      <BuilderPageHeader
        title="Grid Challenge Builder"
        description="Create dot-memory + symmetry-check rounds (Power of Attention & Memory)"
      />

      <BuilderValidationAlerts errors={validationErrors} />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-4">
          <GameInfoCard
            title={title}
            description={description}
            onTitleChange={setTitle}
            onDescriptionChange={setDescription}
            titlePlaceholder="e.g. Grid Challenge Level 1"
          />

          {/* Rounds */}
          <div className="space-y-3">
            {rounds.map((r, i) => (
              <RoundEditor
                key={r.id}
                round={r}
                index={i}
                onUpdate={(updated) => updateRound(i, updated)}
                onDelete={() => deleteRound(i)}
                canDelete={rounds.length > 1}
              />
            ))}
          </div>

          {rounds.length < 6 && (
            <Button variant="outline" className="w-full gap-2" onClick={addRound}>
              <Plus size={16} /> Add Round
            </Button>
          )}

          <BuilderActionBar
            onAutoGenerate={handleAutoGenerate}
            onReset={resetForm}
            onSave={() => setShowDialog(true)}
          />
        </div>

        {/* ── Right column: settings ── */}
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Difficulty</CardTitle>
            </CardHeader>
            <CardContent>
              <select
                value={difficulty}
                onChange={(e) => setDifficulty(e.target.value as any)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="easy">Easy</option>
                <option value="medium">Medium</option>
                <option value="hard">Hard</option>
              </select>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Timing</CardTitle>
              <CardDescription>Duration settings</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">
                  Symmetry display (ms)
                </label>
                <input
                  type="number"
                  min={1000}
                  max={30000}
                  step={1000}
                  value={symmetryDisplayMs}
                  onChange={(e) => setSymmetryDisplayMs(Number(e.target.value))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Default 6000 ms (6 seconds)
                </p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Scoring</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <label className="block text-sm font-medium mb-1">
                  Correct (+pts)
                </label>
                <input
                  type="number"
                  value={correctPoints}
                  onChange={(e) => setCorrectPoints(Number(e.target.value))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">
                  Wrong (pts, use negative)
                </label>
                <input
                  type="number"
                  value={wrongPoints}
                  onChange={(e) => setWrongPoints(Number(e.target.value))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>How to Play</CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-gray-600 space-y-1">
              <p>• Correct answer → +{correctPoints} pts</p>
              <p>• Wrong answer → {wrongPoints} pt</p>
              <p>• Target dot blinks for {highlightMs / 1000}s</p>
              <p>• Symmetry patterns show for {symmetryDisplayMs / 1000}s</p>
              <p>• 3 rounds total (default)</p>
            </CardContent>
          </Card>
        </div>
      </div>

      <SaveToMockTestDialog
        open={showDialog}
        onOpenChange={setShowDialog}
        title="Save Grid Challenge"
        description="Select a mock test to attach this game to"
        mockTests={mockTests}
        selectedMockTest={selectedMockTest}
        onSelectedMockTestChange={setSelectedMockTest}
        onSave={handleSave}
        isSaving={isSaving}
      />
    </div>
  );
};
