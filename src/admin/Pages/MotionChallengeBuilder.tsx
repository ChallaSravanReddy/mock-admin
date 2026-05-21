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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  AlertCircle,
  Save,
  RotateCcw,
  Plus,
  Trash2,
  ChevronDown,
  ChevronUp,
  Circle,
  Square,
  X,
  Crosshair,
  Disc,
} from 'lucide-react';
import {
  MotionGrid,
  MotionCell,
  CellType,
  CellColor,
  CELL_COLORS,
  COLOR_CSS,
  createEmptyMotionGrid,
  createDefaultLevel,
  MotionChallengeLevel,
} from '../types/motionChallenge';
import { motionChallengeService } from '../services/motionChallengeService';
import { useMockTestStore } from '../store';

// ─── Cell Renderer ────────────────────────────────────────────────────────────

const CellView: React.FC<{
  cell: MotionCell;
  onClick?: () => void;
  size?: number;
}> = ({ cell, onClick, size = 48 }) => {
  const base =
    'flex items-center justify-center border border-gray-300 cursor-pointer select-none transition-all hover:opacity-80';

  if (cell.type === 'empty') {
    return (
      <div
        className={`${base} bg-gray-100`}
        style={{ width: size, height: size }}
        onClick={onClick}
        title="Empty"
      />
    );
  }

  if (cell.type === 'blocked') {
    return (
      <div
        className={`${base} bg-gray-200`}
        style={{ width: size, height: size }}
        onClick={onClick}
        title="Blocked (cross)"
      >
        {/* X cross drawn with SVG */}
        <svg width={size * 0.55} height={size * 0.55} viewBox="0 0 20 20">
          <line x1="2" y1="2" x2="18" y2="18" stroke="#6b7280" strokeWidth="3" strokeLinecap="round" />
          <line x1="18" y1="2" x2="2" y2="18" stroke="#6b7280" strokeWidth="3" strokeLinecap="round" />
        </svg>
      </div>
    );
  }

  if (cell.type === 'hole') {
    return (
      <div
        className={`${base} bg-gray-100`}
        style={{ width: size, height: size }}
        onClick={onClick}
        title="Black hole"
      >
        <div
          className="rounded-full"
          style={{
            width: size * 0.58,
            height: size * 0.58,
            background: '#0f172a',
            boxShadow: 'inset 0 2px 6px rgba(0,0,0,0.6)',
          }}
        />
      </div>
    );
  }

  if (cell.type === 'ball') {
    return (
      <div
        className={`${base} bg-gray-100`}
        style={{ width: size, height: size }}
        onClick={onClick}
        title="Red ball"
      >
        <div
          className="rounded-full"
          style={{
            width: size * 0.62,
            height: size * 0.62,
            background: 'radial-gradient(circle at 35% 35%, #f87171, #dc2626)',
            boxShadow: '0 2px 6px rgba(220,38,38,0.5)',
          }}
        />
      </div>
    );
  }

  // colored square
  const bg = cell.color ? COLOR_CSS[cell.color] : '#94a3b8';
  return (
    <div
      className={`${base}`}
      style={{ width: size, height: size, background: bg }}
      onClick={onClick}
      title={`Colored: ${cell.color}`}
    />
  );
};

// ─── Cell Type & Color Toolbar ────────────────────────────────────────────────

type PaintMode =
  | { type: 'empty' }
  | { type: 'ball' }
  | { type: 'hole' }
  | { type: 'blocked' }
  | { type: 'colored'; color: CellColor };

const Toolbar: React.FC<{
  active: PaintMode;
  onSelect: (m: PaintMode) => void;
}> = ({ active, onSelect }) => {
  const isActive = (m: PaintMode) => {
    if (m.type !== active.type) return false;
    if (m.type === 'colored' && active.type === 'colored') return m.color === active.color;
    return true;
  };

  const btnCls = (m: PaintMode) =>
    `flex items-center gap-1 px-3 py-1.5 rounded border text-xs font-medium transition ${
      isActive(m)
        ? 'bg-blue-600 text-white border-blue-700 shadow'
        : 'border-gray-300 hover:bg-gray-100'
    }`;

  return (
    <div className="space-y-2 p-3 bg-gray-50 rounded-lg border">
      <p className="text-xs font-semibold text-gray-500 uppercase">Paint Brush</p>
      <div className="flex flex-wrap gap-2">
        <button className={btnCls({ type: 'empty' })} onClick={() => onSelect({ type: 'empty' })}>
          <Square size={13} /> Empty
        </button>
        <button className={btnCls({ type: 'ball' })} onClick={() => onSelect({ type: 'ball' })}>
          <Circle size={13} className="text-red-500" /> Ball
        </button>
        <button className={btnCls({ type: 'hole' })} onClick={() => onSelect({ type: 'hole' })}>
          <Disc size={13} /> Hole
        </button>
        <button className={btnCls({ type: 'blocked' })} onClick={() => onSelect({ type: 'blocked' })}>
          <X size={13} /> Blocked ✕
        </button>
      </div>
      <div className="flex flex-wrap gap-1 mt-1">
        {CELL_COLORS.map((c) => (
          <button
            key={c}
            title={`Colored: ${c}`}
            onClick={() => onSelect({ type: 'colored', color: c })}
            className={`w-8 h-8 rounded border-2 transition ${
              isActive({ type: 'colored', color: c })
                ? 'border-blue-600 scale-110 shadow-lg'
                : 'border-gray-200 hover:border-gray-400'
            }`}
            style={{ background: COLOR_CSS[c] }}
          />
        ))}
      </div>
      <div className="text-xs text-gray-500 mt-1">
        Active:{' '}
        <strong>
          {active.type === 'colored' ? `colored (${active.color})` : active.type}
        </strong>
        . Click a grid cell to paint.
      </div>
    </div>
  );
};

// ─── GridCanvas ───────────────────────────────────────────────────────────────

interface GridCanvasProps {
  grid: MotionGrid;
  paintMode: PaintMode;
  onChange: (grid: MotionGrid) => void;
}

const GridCanvas: React.FC<GridCanvasProps> = ({ grid, paintMode, onChange }) => {
  const paint = (r: number, c: number) => {
    const clone = grid.map((row) => row.map((cell) => ({ ...cell })));
    
    // Enforce single ball and single hole constraint
    if (paintMode.type === 'ball' || paintMode.type === 'hole') {
      clone.forEach((row, ri) => {
        row.forEach((cell, ci) => {
          if (cell.type === paintMode.type) {
            clone[ri][ci] = { type: 'empty' };
          }
        });
      });
    }

    if (paintMode.type === 'colored') {
      clone[r][c] = { type: 'colored', color: paintMode.color };
    } else {
      clone[r][c] = { type: paintMode.type };
    }
    onChange(clone);
  };

  return (
    <div className="inline-block border-2 border-gray-400 rounded overflow-hidden">
      {grid.map((row, ri) => (
        <div key={ri} className="flex">
          {row.map((cell, ci) => (
            <CellView key={ci} cell={cell} onClick={() => paint(ri, ci)} size={46} />
          ))}
        </div>
      ))}
    </div>
  );
};

// ─── LevelEditor ──────────────────────────────────────────────────────────────

interface LevelEditorProps {
  level: MotionChallengeLevel;
  index: number;
  onUpdate: (l: MotionChallengeLevel) => void;
  onDelete: () => void;
  canDelete: boolean;
}

const LevelEditor: React.FC<LevelEditorProps> = ({
  level,
  index,
  onUpdate,
  onDelete,
  canDelete,
}) => {
  const [expanded, setExpanded] = useState(index === 0);
  const [paintMode, setPaintMode] = useState<PaintMode>({ type: 'empty' });

  const updateGrid = (grid: MotionGrid) => onUpdate({ ...level, grid });
  const updateRows = (rows: number) => {
    const newGrid = createEmptyMotionGrid(rows, level.cols);
    // copy existing
    level.grid.forEach((row, ri) => {
      if (ri < rows) row.forEach((cell, ci) => { if (ci < level.cols) newGrid[ri][ci] = { ...cell }; });
    });
    onUpdate({ ...level, rows, grid: newGrid });
  };
  const updateCols = (cols: number) => {
    const newGrid = createEmptyMotionGrid(level.rows, cols);
    level.grid.forEach((row, ri) => {
      row.forEach((cell, ci) => { if (ci < cols) newGrid[ri][ci] = { ...cell }; });
    });
    onUpdate({ ...level, cols, grid: newGrid });
  };

  // count special cells
  const balls = level.grid.flat().filter((c) => c.type === 'ball').length;
  const holes = level.grid.flat().filter((c) => c.type === 'hole').length;

  return (
    <Card className="border-orange-200">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base flex items-center gap-2">
            Level {index + 1}
            {(balls !== 1 || holes !== 1) && (
              <span className="text-xs text-amber-600 font-normal">
                ⚠ need 1 ball + 1 hole
              </span>
            )}
          </CardTitle>
          <div className="flex gap-2">
            {canDelete && (
              <Button variant="ghost" size="sm" className="text-red-600" onClick={onDelete}>
                <Trash2 size={15} />
              </Button>
            )}
            <Button variant="ghost" size="sm" onClick={() => setExpanded(!expanded)}>
              {expanded ? <ChevronUp size={15} /> : <ChevronDown size={15} />}
            </Button>
          </div>
        </div>
      </CardHeader>

      {expanded && (
        <CardContent className="space-y-4">
          {/* Label + maxMoves */}
          <div className="flex gap-4 flex-wrap">
            <div className="flex-1 min-w-[160px]">
              <label className="block text-xs font-medium text-gray-600 mb-1">
                Level Label
              </label>
              <input
                type="text"
                value={level.label ?? ''}
                onChange={(e) => onUpdate({ ...level, label: e.target.value })}
                className="w-full px-2 py-1.5 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">
                Max Moves
              </label>
              <input
                type="number"
                min={1}
                max={50}
                value={level.maxMoves}
                onChange={(e) => onUpdate({ ...level, maxMoves: Number(e.target.value) })}
                className="w-24 px-2 py-1.5 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">
                Rows
              </label>
              <input
                type="number"
                min={3}
                max={10}
                value={level.rows}
                onChange={(e) => updateRows(Number(e.target.value))}
                className="w-20 px-2 py-1.5 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">
                Cols
              </label>
              <input
                type="number"
                min={3}
                max={8}
                value={level.cols}
                onChange={(e) => updateCols(Number(e.target.value))}
                className="w-20 px-2 py-1.5 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
              />
            </div>
          </div>

          {/* Toolbar */}
          <Toolbar active={paintMode} onSelect={setPaintMode} />

          {/* Grid */}
          <div className="overflow-x-auto">
            <GridCanvas grid={level.grid} paintMode={paintMode} onChange={updateGrid} />
          </div>

          {/* Quick actions */}
          <div className="flex gap-2 flex-wrap text-sm">
            <Button
              size="sm"
              variant="outline"
              onClick={() => onUpdate({ ...level, grid: createEmptyMotionGrid(level.rows, level.cols) })}
            >
              Clear grid
            </Button>
            <p className="text-xs text-gray-500 self-center ml-auto">
              {balls} ball · {holes} hole · {level.grid.flat().filter((c) => c.type === 'colored').length} coloured
              · {level.grid.flat().filter((c) => c.type === 'blocked').length} blocked
            </p>
          </div>

          {/* Legend */}
          <div className="flex flex-wrap gap-3 text-xs text-gray-500 border-t pt-3">
            <span className="flex items-center gap-1">
              <span className="inline-block w-4 h-4 rounded-full bg-red-500" /> Red Ball
            </span>
            <span className="flex items-center gap-1">
              <span className="inline-block w-4 h-4 rounded-full bg-slate-900" /> Black Hole
            </span>
            <span className="flex items-center gap-1">
              <span className="inline-block w-4 h-4 bg-gray-200 border border-gray-300 rounded" />
              Blocked ✕
            </span>
            <span className="flex items-center gap-1">
              <span className="inline-block w-4 h-4 bg-gray-100 border border-gray-300 rounded" />
              Empty
            </span>
            <span className="flex items-center gap-1">
              <span className="inline-block w-4 h-4 rounded" style={{ background: COLOR_CSS['purple'] }} />
              Coloured squares
            </span>
          </div>
        </CardContent>
      )}
    </Card>
  );
};

// ─── Main Page ────────────────────────────────────────────────────────────────

export const MotionChallengeBuilder: React.FC = () => {
  const { mockTests, updateMockTest } = useMockTestStore();

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [difficulty, setDifficulty] = useState<'easy' | 'medium' | 'hard'>('medium');
  const [levels, setLevels] = useState<MotionChallengeLevel[]>([
    createDefaultLevel(0),
    createDefaultLevel(1),
  ]);
  const [timeDurationSeconds, setTimeDurationSeconds] = useState(240);
  const [correctPoints, setCorrectPoints] = useState(4);
  const [wrongPoints, setWrongPoints] = useState(-1);

  const [validationErrors, setValidationErrors] = useState<string[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const [showDialog, setShowDialog] = useState(false);
  const [selectedMockTest, setSelectedMockTest] = useState('');

  const addLevel = () => {
    if (levels.length < 20) {
      setLevels([...levels, createDefaultLevel(levels.length)]);
    }
  };

  const updateLevel = useCallback((idx: number, level: MotionChallengeLevel) => {
    setLevels((prev) => prev.map((l, i) => (i === idx ? level : l)));
  }, []);

  const deleteLevel = (idx: number) => {
    if (levels.length > 1) setLevels(levels.filter((_, i) => i !== idx));
  };

  const validate = (): boolean => {
    const errors: string[] = [];
    if (!title.trim()) errors.push('Title is required');
    if (!description.trim()) errors.push('Description is required');
    if (levels.length < 1) errors.push('At least 1 level is required');
    levels.forEach((l, i) => {
      const balls = l.grid.flat().filter((c) => c.type === 'ball').length;
      const holes = l.grid.flat().filter((c) => c.type === 'hole').length;
      if (balls !== 1) errors.push(`Level ${i + 1}: must have exactly 1 red ball`);
      if (holes !== 1) errors.push(`Level ${i + 1}: must have exactly 1 black hole`);
      if (l.maxMoves < 1) errors.push(`Level ${i + 1}: max moves must be ≥ 1`);
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
      await motionChallengeService.createGame({
        title,
        description,
        difficulty,
        levels,
        timeDurationSeconds,
        correctPoints,
        wrongPoints,
        mockTestId: selectedMockTest,
      });

      // Update mock test totalQuestions in Zustand store
      const test = mockTests.find((t) => t.id === selectedMockTest);
      if (test) {
        updateMockTest(selectedMockTest, {
          totalQuestions: (test.totalQuestions ?? 0) + 1,
        });
      }

      alert('Motion Challenge saved successfully!');
      resetForm();
      setShowDialog(false);
      setSelectedMockTest('');
    } catch {
      alert('Failed to save game');
    } finally {
      setIsSaving(false);
    }
  };

  const resetForm = () => {
    setTitle('');
    setDescription('');
    setDifficulty('medium');
    setLevels([createDefaultLevel(0), createDefaultLevel(1)]);
    setTimeDurationSeconds(240);
    setCorrectPoints(4);
    setWrongPoints(-1);
    setValidationErrors([]);
  };

  const minutes = Math.floor(timeDurationSeconds / 60);
  const seconds = timeDurationSeconds % 60;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="space-y-1">
        <h1 className="text-3xl font-bold text-gray-900">Motion Challenge Builder</h1>
        <p className="text-gray-600">
          Design grid-sliding puzzles — move the red ball into the black hole
          (Imagination · Decision Making · Time Management)
        </p>
      </div>

      {/* Validation */}
      {validationErrors.length > 0 && (
        <Card className="border-red-400 bg-red-50">
          <CardContent className="pt-5">
            <div className="flex gap-3">
              <AlertCircle className="text-red-500 h-5 w-5 flex-shrink-0 mt-0.5" />
              <ul className="text-sm text-red-700 space-y-0.5">
                {validationErrors.map((e, i) => (
                  <li key={i}>• {e}</li>
                ))}
              </ul>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* ── Left: levels ── */}
        <div className="lg:col-span-2 space-y-4">
          {/* Game info */}
          <Card>
            <CardHeader>
              <CardTitle>Game Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Title</label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Motion Challenge Level 1"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-400"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Description</label>
                <textarea
                  rows={2}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Describe the challenge…"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-400 resize-none"
                />
              </div>
            </CardContent>
          </Card>

          {/* Level editors */}
          {levels.map((l, i) => (
            <LevelEditor
              key={l.id}
              level={l}
              index={i}
              onUpdate={(updated) => updateLevel(i, updated)}
              onDelete={() => deleteLevel(i)}
              canDelete={levels.length > 1}
            />
          ))}

          {levels.length < 20 && (
            <Button variant="outline" className="w-full gap-2" onClick={addLevel}>
              <Plus size={16} /> Add Level
            </Button>
          )}

          <Button
            onClick={() => setShowDialog(true)}
            className="w-full gap-2 h-10"
            size="lg"
          >
            <Save size={18} /> Save Game
          </Button>
          <Button onClick={resetForm} variant="outline" className="w-full">
            <RotateCcw size={16} className="mr-2" /> Reset All
          </Button>
        </div>

        {/* ── Right: settings ── */}
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Difficulty</CardTitle>
            </CardHeader>
            <CardContent>
              <select
                value={difficulty}
                onChange={(e) => setDifficulty(e.target.value as any)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-400"
              >
                <option value="easy">Easy</option>
                <option value="medium">Medium</option>
                <option value="hard">Hard</option>
              </select>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Time Limit</CardTitle>
              <CardDescription>
                Current: {minutes}m {seconds > 0 ? `${seconds}s` : ''}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <input
                type="number"
                min={60}
                max={900}
                step={30}
                value={timeDurationSeconds}
                onChange={(e) => setTimeDurationSeconds(Number(e.target.value))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-400"
              />
              <p className="text-xs text-gray-400 mt-1">seconds (default 240 = 4 min)</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Scoring</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <label className="block text-sm font-medium mb-1">Correct (+pts)</label>
                <input
                  type="number"
                  value={correctPoints}
                  onChange={(e) => setCorrectPoints(Number(e.target.value))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-400"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Wrong (use negative)</label>
                <input
                  type="number"
                  value={wrongPoints}
                  onChange={(e) => setWrongPoints(Number(e.target.value))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-400"
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>How to Play</CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-gray-600 space-y-1">
              <p>• Move coloured squares H/V into empty cells</p>
              <p>• Cross-marked squares cannot move</p>
              <p>• Move the red ball into the black hole</p>
              <p>• Each move counts (ball + coloured squares)</p>
              <p>• Complete within move limit & time</p>
              <p>• Correct → +{correctPoints} marks</p>
              <p>• Wrong → {wrongPoints} mark</p>
              <p>• Time limit: {minutes}m {seconds > 0 ? `${seconds}s` : ''}</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Cell Types Guide</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {[
                { label: 'Empty', desc: 'Ball/squares can move here', color: 'bg-gray-100 border border-gray-300' },
                { label: 'Red Ball', desc: 'The piece to guide to hole', color: 'bg-red-500' },
                { label: 'Black Hole', desc: 'The destination', color: 'bg-slate-900' },
                { label: 'Blocked ✕', desc: 'Cannot be moved', color: 'bg-gray-300' },
                { label: 'Coloured', desc: 'Movable obstacles', color: 'bg-purple-600' },
              ].map(({ label, desc, color }) => (
                <div key={label} className="flex items-center gap-2 text-xs">
                  <span className={`inline-block w-5 h-5 rounded flex-shrink-0 ${color}`} />
                  <span><strong>{label}</strong> — {desc}</span>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Save Dialog */}
      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Save Motion Challenge</DialogTitle>
            <DialogDescription>
              Select a mock test to attach this game to
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium text-gray-700">Mock Test</label>
              <select
                value={selectedMockTest}
                onChange={(e) => setSelectedMockTest(e.target.value)}
                className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-400"
              >
                <option value="">-- Select a test --</option>
                {mockTests.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.title}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex gap-2 justify-end">
              <Button variant="outline" onClick={() => setShowDialog(false)}>
                Cancel
              </Button>
              <Button onClick={handleSave} disabled={isSaving || !selectedMockTest}>
                {isSaving ? 'Saving…' : 'Save'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};
