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
  ChevronDown,
  ChevronUp,
  Check,
  Wand2,
} from 'lucide-react';
import {
  BuilderPageHeader,
  BuilderValidationAlerts,
  BuilderActionBar,
  GameInfoCard,
  SaveToMockTestDialog,
} from '../components/builder';
import {
  InductiveChallengeQuestion,
  ShapeCell,
  ShapeGrid,
  ShapeType,
  ShapeColor,
  SHAPE_TYPES,
  SHAPE_COLORS,
  createEmptyGrid,
  createDefaultQuestion,
} from '../types/inductiveChallenge';
import { inductiveChallengeService } from '../services/inductiveChallengeService';
import { useMockTestStore } from '../store';

// ─── Shape rendering ──────────────────────────────────────────────────────────

const COLOR_MAP: Record<ShapeColor, string> = {
  green: '#16a34a',
  purple: '#9333ea',
  blue: '#1d4ed8',
  red: '#dc2626',
  orange: '#ea580c',
};

const ShapeIcon: React.FC<{ shape: ShapeType; color: ShapeColor; size?: number }> = ({
  shape,
  color,
  size = 20,
}) => {
  const c = COLOR_MAP[color];
  switch (shape) {
    case 'square':
      return (
        <svg width={size} height={size} viewBox="0 0 20 20">
          <rect x="2" y="2" width="16" height="16" fill={c} />
        </svg>
      );
    case 'circle':
      return (
        <svg width={size} height={size} viewBox="0 0 20 20">
          <circle cx="10" cy="10" r="8" fill={c} />
        </svg>
      );
    case 'triangle':
      return (
        <svg width={size} height={size} viewBox="0 0 20 20">
          <polygon points="10,2 18,18 2,18" fill={c} />
        </svg>
      );
    case 'cross':
      return (
        <svg width={size} height={size} viewBox="0 0 20 20">
          <rect x="8" y="2" width="4" height="16" fill={c} />
          <rect x="2" y="8" width="16" height="4" fill={c} />
        </svg>
      );
  }
};

// ─── ShapePicker ──────────────────────────────────────────────────────────────

interface ShapePickerProps {
  selected: ShapeCell | null;
  onSelect: (cell: ShapeCell | null) => void;
}

const ShapePicker: React.FC<ShapePickerProps> = ({ selected, onSelect }) => {
  const [activeShape, setActiveShape] = useState<ShapeType>(selected?.shape ?? 'square');
  const [activeColor, setActiveColor] = useState<ShapeColor>(selected?.color ?? 'green');

  const handlePick = (shape: ShapeType, color: ShapeColor) => {
    setActiveShape(shape);
    setActiveColor(color);
    onSelect({ shape, color });
  };

  return (
    <div className="space-y-2 p-3 bg-gray-50 rounded-lg border">
      <p className="text-xs font-semibold text-gray-500 uppercase">Shape Picker</p>
      <div className="flex flex-wrap gap-1">
        {SHAPE_TYPES.map((s) =>
          SHAPE_COLORS.map((c) => {
            const isSel = activeShape === s && activeColor === c;
            return (
              <button
                key={`${s}-${c}`}
                title={`${c} ${s}`}
                onClick={() => handlePick(s, c)}
                className={`w-8 h-8 flex items-center justify-center rounded border-2 transition ${
                  isSel ? 'border-blue-600 bg-blue-50 scale-110' : 'border-transparent hover:border-gray-300'
                }`}
              >
                <ShapeIcon shape={s} color={c} size={18} />
              </button>
            );
          })
        )}
      </div>
      <button
        onClick={() => onSelect(null)}
        className="text-xs text-red-500 underline"
      >
        Clear (eraser)
      </button>
      {selected && (
        <div className="flex items-center gap-1 text-xs text-gray-600">
          Active: <ShapeIcon shape={selected.shape} color={selected.color} size={14} />
          <span className="capitalize">{selected.color} {selected.shape}</span>
        </div>
      )}
    </div>
  );
};

// ─── GridEditor ───────────────────────────────────────────────────────────────

interface GridEditorProps {
  grid: ShapeGrid;
  onChange: (grid: ShapeGrid) => void;
  selectedCell: ShapeCell | null;
  label: string;
  size?: number;
}

const GridEditor: React.FC<GridEditorProps> = ({
  grid,
  onChange,
  selectedCell,
  label,
  size = 3,
}) => {
  const handleCellClick = (r: number, c: number) => {
    const clone: ShapeGrid = grid.map((row) => [...row]);
    clone[r][c] = selectedCell ? { ...selectedCell } : null;
    onChange(clone);
  };

  return (
    <div className="flex flex-col items-center gap-2">
      <span className="text-xs font-semibold text-gray-500 uppercase">{label}</span>
      <div
        className="grid gap-1 p-2 bg-white border-2 border-gray-300 rounded"
        style={{ gridTemplateColumns: `repeat(${size}, 1fr)` }}
      >
        {grid.map((row, ri) =>
          row.map((cell, ci) => (
            <button
              key={`${ri}-${ci}`}
              onClick={() => handleCellClick(ri, ci)}
              className="w-12 h-12 border border-gray-200 flex items-center justify-center bg-gray-50 hover:bg-blue-50 rounded transition"
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
        className="text-xs text-red-500"
        onClick={() => onChange(createEmptyGrid(size))}
      >
        Clear grid
      </Button>
    </div>
  );
};

// ─── QuestionEditor ───────────────────────────────────────────────────────────

interface QuestionEditorProps {
  question: InductiveChallengeQuestion;
  index: number;
  onUpdate: (q: InductiveChallengeQuestion) => void;
  onDelete: () => void;
  canDelete: boolean;
}

const QuestionEditor: React.FC<QuestionEditorProps> = ({
  question,
  index,
  onUpdate,
  onDelete,
  canDelete,
}) => {
  const [expanded, setExpanded] = useState(index === 0);
  const [selectedCell, setSelectedCell] = useState<ShapeCell | null>({
    shape: 'square',
    color: 'green',
  });

  const updateExampleGridA = (grid: ShapeGrid) =>
    onUpdate({ ...question, examplePair: { ...question.examplePair, gridA: grid } });

  const updateExampleGridB = (grid: ShapeGrid) =>
    onUpdate({ ...question, examplePair: { ...question.examplePair, gridB: grid } });

  const updateOption = (optId: string, grid: ShapeGrid) =>
    onUpdate({
      ...question,
      options: question.options.map((o) => (o.id === optId ? { ...o, grid } : o)),
    });

  const toggleCorrect = (optId: string) => {
    const alreadyCorrect = question.correctOptionIds.includes(optId);
    const newCorrect = alreadyCorrect
      ? question.correctOptionIds.filter((id) => id !== optId)
      : question.correctOptionIds.length < 2
      ? [...question.correctOptionIds, optId]
      : question.correctOptionIds;
    onUpdate({
      ...question,
      correctOptionIds: newCorrect,
      options: question.options.map((o) => ({
        ...o,
        isCorrect: newCorrect.includes(o.id),
      })),
    });
  };

  const updateRule = (rule: string) => onUpdate({ ...question, rule });

  return (
    <Card className="border-purple-200">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base">Question {index + 1}</CardTitle>
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
        {!expanded && (
          <p className="text-xs text-gray-400">
            Correct: {question.correctOptionIds.join(', ') || 'none set'}
          </p>
        )}
      </CardHeader>

      {expanded && (
        <CardContent className="space-y-6">
          {/* ── Shape picker ── */}
          <ShapePicker selected={selectedCell} onSelect={setSelectedCell} />

          {/* ── Example pair ── */}
          <div>
            <h4 className="text-sm font-semibold text-gray-700 mb-3">
              Example Pair — "These two grids follow a rule"
            </h4>
            <div className="flex gap-6 flex-wrap justify-center py-4 bg-gray-50 rounded-lg border">
              <GridEditor
                grid={question.examplePair.gridA}
                onChange={updateExampleGridA}
                selectedCell={selectedCell}
                label="Grid A (before)"
              />
              <div className="flex items-center text-2xl font-bold text-gray-400">→</div>
              <GridEditor
                grid={question.examplePair.gridB}
                onChange={updateExampleGridB}
                selectedCell={selectedCell}
                label="Grid B (after)"
              />
            </div>
          </div>

          {/* ── Admin rule note ── */}
          <div>
            <label className="block text-sm font-medium mb-1 text-gray-600">
              Rule note (admin only, not shown to player)
            </label>
            <input
              type="text"
              value={question.rule ?? ''}
              onChange={(e) => updateRule(e.target.value)}
              placeholder='e.g. "Colors shift by one position clockwise"'
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
            />
          </div>

          {/* ── Four options ── */}
          <div>
            <h4 className="text-sm font-semibold text-gray-700 mb-1">
              Answer Options — "Which two of these grids follow the same rule?"
            </h4>
            <p className="text-xs text-gray-500 mb-3">
              Click the ✓ button to mark an option as correct (pick exactly 2)
            </p>
            <div className="grid grid-cols-2 gap-4">
              {question.options.map((opt) => {
                const isCorrect = question.correctOptionIds.includes(opt.id);
                return (
                  <div
                    key={opt.id}
                    className={`rounded-lg border-2 p-3 transition ${
                      isCorrect ? 'border-green-500 bg-green-50' : 'border-gray-200'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-bold text-gray-700">Option {opt.id}</span>
                      <button
                        onClick={() => toggleCorrect(opt.id)}
                        className={`flex items-center gap-1 text-xs px-2 py-1 rounded-full border transition ${
                          isCorrect
                            ? 'bg-green-500 text-white border-green-600'
                            : 'border-gray-300 hover:bg-gray-100'
                        }`}
                      >
                        <Check size={12} /> {isCorrect ? 'Correct' : 'Set correct'}
                      </button>
                    </div>
                    <GridEditor
                      grid={opt.grid}
                      onChange={(g) => updateOption(opt.id, g)}
                      selectedCell={selectedCell}
                      label={`Option ${opt.id}`}
                    />
                  </div>
                );
              })}
            </div>
          </div>

          {question.correctOptionIds.length > 0 && (
            <div className="text-sm text-green-700 bg-green-50 px-3 py-2 rounded border border-green-200">
              ✓ Correct options: <strong>{question.correctOptionIds.join(' & ')}</strong>
            </div>
          )}
        </CardContent>
      )}
    </Card>
  );
};

// ─── Main Page ────────────────────────────────────────────────────────────────

export const InductiveChallengeBuilder: React.FC = () => {
  const { mockTests, updateMockTest } = useMockTestStore();

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [difficulty, setDifficulty] = useState<'easy' | 'medium' | 'hard'>('medium');
  const [questions, setQuestions] = useState<InductiveChallengeQuestion[]>([
    createDefaultQuestion(0),
  ]);
  const [correctPoints, setCorrectPoints] = useState(3);
  const [wrongPoints, setWrongPoints] = useState(-1);

  const [validationErrors, setValidationErrors] = useState<string[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const [showDialog, setShowDialog] = useState(false);
  const [selectedMockTest, setSelectedMockTest] = useState('');

  const addQuestion = () => {
    if (questions.length < 10) {
      setQuestions([...questions, createDefaultQuestion(questions.length)]);
    }
  };

  const updateQuestion = useCallback((idx: number, q: InductiveChallengeQuestion) => {
    setQuestions((prev) => prev.map((item, i) => (i === idx ? q : item)));
  }, []);

  const deleteQuestion = (idx: number) => {
    if (questions.length > 1) setQuestions(questions.filter((_, i) => i !== idx));
  };

  const validate = (): boolean => {
    const errors: string[] = [];
    if (!title.trim()) errors.push('Title is required');
    if (!description.trim()) errors.push('Description is required');
    if (questions.length < 1) errors.push('At least 1 question is required');
    questions.forEach((q, i) => {
      if (q.correctOptionIds.length !== 2)
        errors.push(`Question ${i + 1}: mark exactly 2 correct options`);
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
      await inductiveChallengeService.createGame({
        title,
        description,
        difficulty,
        questions,
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

      alert('Inductive Challenge saved successfully!');
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
    const staticRules = [
      {
        name: 'One column is completely uniform in shape and color, while the other two columns contain three distinct shape/color types with exactly two occurrences each.',
        apply: (grid: ShapeGrid) => {
          const shapes: ShapeType[] = ['circle', 'square', 'triangle', 'cross'].sort(() => Math.random() - 0.5) as ShapeType[];
          const colors: ShapeColor[] = ['purple', 'green', 'blue', 'orange'].sort(() => Math.random() - 0.5) as ShapeColor[];
          
          const uniformCol = Math.floor(Math.random() * 3);
          const otherCols = [0, 1, 2].filter(c => c !== uniformCol);
          
          for (let r = 0; r < 3; r++) {
            grid[r][uniformCol] = { shape: shapes[0], color: colors[0] };
          }
          
          const colAShapes: ShapeType[] = [shapes[1], shapes[1], shapes[2]].sort(() => Math.random() - 0.5);
          const colAColors: ShapeColor[] = [colors[1], colors[1], colors[2]].sort(() => Math.random() - 0.5);
          for (let r = 0; r < 3; r++) {
            grid[r][otherCols[0]] = { shape: colAShapes[r], color: colAColors[r] };
          }
          
          const colBShapes: ShapeType[] = [shapes[3], shapes[3], shapes[2]].sort(() => Math.random() - 0.5);
          const colBColors: ShapeColor[] = [colors[3], colors[3], colors[2]].sort(() => Math.random() - 0.5);
          for (let r = 0; r < 3; r++) {
            grid[r][otherCols[1]] = { shape: colBShapes[r], color: colBColors[r] };
          }
        },
        check: (grid: ShapeGrid) => {
          let uniformCol = -1;
          for (let c = 0; c < 3; c++) {
            if (grid[0][c] && grid[1][c] && grid[2][c]) {
              if (
                grid[0][c]!.shape === grid[1][c]!.shape && grid[1][c]!.shape === grid[2][c]!.shape &&
                grid[0][c]!.color === grid[1][c]!.color && grid[1][c]!.color === grid[2][c]!.color
              ) {
                uniformCol = c;
                break;
              }
            }
          }
          if (uniformCol === -1) return false;
          
          const shapeCounts: Record<string, number> = {};
          const colorCounts: Record<string, number> = {};
          for (let r = 0; r < 3; r++) {
            for (let c = 0; c < 3; c++) {
              const item = grid[r][c];
              if (!item) return false;
              shapeCounts[item.shape] = (shapeCounts[item.shape] || 0) + 1;
              colorCounts[item.color] = (colorCounts[item.color] || 0) + 1;
            }
          }
          
          const sc = Object.values(shapeCounts).sort();
          const cc = Object.values(colorCounts).sort();
          return (
            sc.length === 4 && sc[0] === 2 && sc[1] === 2 && sc[2] === 2 && sc[3] === 3 &&
            cc.length === 4 && cc[0] === 2 && cc[1] === 2 && cc[2] === 2 && cc[3] === 3
          );
        },
        break: (grid: ShapeGrid) => {
          const shapes: ShapeType[] = ['circle', 'square', 'triangle', 'cross'];
          const colors: ShapeColor[] = ['purple', 'green', 'blue', 'orange'];
          for (let r = 0; r < 3; r++) {
            for (let c = 0; c < 3; c++) {
              grid[r][c] = { shape: shapes[(r + c) % 4], color: colors[(r + c) % 4] };
            }
          }
        }
      },
      {
        name: 'Each row and column contains exactly one Circle, one Square, and one Triangle, with no duplicates of shapes or colors in any line.',
        apply: (grid: ShapeGrid) => {
          const shapes: ShapeType[] = ['circle', 'square', 'triangle'].sort(() => Math.random() - 0.5) as ShapeType[];
          const colors: ShapeColor[] = ['red', 'blue', 'green'].sort(() => Math.random() - 0.5) as ShapeColor[];
          for (let r = 0; r < 3; r++) {
            for (let c = 0; c < 3; c++) {
              const idx = (r + c) % 3;
              grid[r][c] = { shape: shapes[idx], color: colors[idx] };
            }
          }
        },
        check: (grid: ShapeGrid) => {
          for (let r = 0; r < 3; r++) {
            const rowShapes = new Set<string>();
            const rowColors = new Set<string>();
            for (let c = 0; c < 3; c++) {
              const item = grid[r][c];
              if (!item) return false;
              rowShapes.add(item.shape);
              rowColors.add(item.color);
            }
            if (rowShapes.size !== 3 || rowColors.size !== 3) return false;
          }
          for (let c = 0; c < 3; c++) {
            const colShapes = new Set<string>();
            const colColors = new Set<string>();
            for (let r = 0; r < 3; r++) {
              const item = grid[r][c];
              if (!item) return false;
              colShapes.add(item.shape);
              colColors.add(item.color);
            }
            if (colShapes.size !== 3 || colColors.size !== 3) return false;
          }
          return true;
        },
        break: (grid: ShapeGrid) => {
          const shapes: ShapeType[] = ['circle', 'square', 'triangle'];
          const colors: ShapeColor[] = ['red', 'blue', 'green'];
          for (let r = 0; r < 3; r++) {
            for (let c = 0; c < 3; c++) {
              grid[r][c] = { shape: shapes[c], color: colors[c] };
            }
          }
        }
      },
      {
        name: 'Left and Right columns are identical (symmetrical) in both shape and color, while the center column alternates shapes.',
        apply: (grid: ShapeGrid) => {
          const borderShapes: ShapeType[] = ['circle', 'triangle', 'cross'].sort(() => Math.random() - 0.5) as ShapeType[];
          const borderColors: ShapeColor[] = ['blue', 'orange', 'purple'].sort(() => Math.random() - 0.5) as ShapeColor[];
          const centerShapes: ShapeType[] = ['square', 'circle'].sort(() => Math.random() - 0.5) as ShapeType[];
          
          for (let r = 0; r < 3; r++) {
            grid[r][0] = { shape: borderShapes[r], color: borderColors[r] };
            grid[r][2] = { shape: borderShapes[r], color: borderColors[r] };
            grid[r][1] = { shape: r % 2 === 0 ? centerShapes[0] : centerShapes[1], color: 'green' };
          }
        },
        check: (grid: ShapeGrid) => {
          for (let r = 0; r < 3; r++) {
            if (!grid[r][0] || !grid[r][1] || !grid[r][2]) return false;
            if (grid[r][0]?.shape !== grid[r][2]?.shape || grid[r][0]?.color !== grid[r][2]?.color) return false;
          }
          return (
            grid[0][1]?.shape === grid[2][1]?.shape &&
            grid[0][1]?.shape !== grid[1][1]?.shape
          );
        },
        break: (grid: ShapeGrid) => {
          for (let r = 0; r < 3; r++) {
            grid[r][0] = { shape: 'circle', color: 'blue' };
            grid[r][1] = { shape: 'square', color: 'green' };
            grid[r][2] = { shape: 'triangle', color: 'blue' };
          }
        }
      },
      {
        name: 'All shapes of the same type must share the same color (e.g., all circles are red, all squares are blue).',
        apply: (grid: ShapeGrid) => {
          const shapes: ShapeType[] = ['circle', 'square', 'triangle', 'cross'];
          const colors: ShapeColor[] = ['red', 'blue', 'orange', 'green'];
          
          for (let r = 0; r < 3; r++) {
            for (let c = 0; c < 3; c++) {
              const idx = Math.floor(Math.random() * 4);
              grid[r][c] = { shape: shapes[idx], color: colors[idx] };
            }
          }
        },
        check: (grid: ShapeGrid) => {
          const map: Record<string, string> = {};
          for (let r = 0; r < 3; r++) {
            for (let c = 0; c < 3; c++) {
              const item = grid[r][c];
              if (!item) return false;
              if (!map[item.shape]) {
                map[item.shape] = item.color;
              } else if (map[item.shape] !== item.color) {
                return false;
              }
            }
          }
          return Object.keys(map).length >= 2;
        },
        break: (grid: ShapeGrid) => {
          for (let r = 0; r < 3; r++) {
            for (let c = 0; c < 3; c++) {
              grid[r][c] = { shape: 'circle', color: 'red' };
            }
          }
          grid[0][0] = { shape: 'circle', color: 'blue' };
        }
      },
      {
        name: 'Top-left to bottom-right diagonal cells must be circles, and all other cells must be squares.',
        apply: (grid: ShapeGrid) => {
          const colorDiag: ShapeColor = 'purple';
          const colorOff: ShapeColor = 'green';
          for (let r = 0; r < 3; r++) {
            for (let c = 0; c < 3; c++) {
              grid[r][c] = {
                shape: r === c ? 'circle' : 'square',
                color: r === c ? colorDiag : colorOff
              };
            }
          }
        },
        check: (grid: ShapeGrid) => {
          for (let r = 0; r < 3; r++) {
            for (let c = 0; c < 3; c++) {
              const item = grid[r][c];
              if (!item) return false;
              if (r === c) {
                if (item.shape !== 'circle') return false;
              } else {
                if (item.shape !== 'square') return false;
              }
            }
          }
          return true;
        },
        break: (grid: ShapeGrid) => {
          for (let r = 0; r < 3; r++) {
            for (let c = 0; c < 3; c++) {
              grid[r][c] = { shape: 'square', color: 'green' };
            }
          }
        }
      },
      {
        name: 'The grid contains exactly three circles, three squares, and three triangles.',
        apply: (grid: ShapeGrid) => {
          const list: ShapeType[] = ['triangle', 'triangle', 'triangle', 'square', 'square', 'square', 'circle', 'circle', 'circle']
            .sort(() => Math.random() - 0.5) as ShapeType[];
          for (let r = 0; r < 3; r++) {
            for (let c = 0; c < 3; c++) {
              grid[r][c] = {
                shape: list[r * 3 + c],
                color: SHAPE_COLORS[Math.floor(Math.random() * SHAPE_COLORS.length)]
              };
            }
          }
        },
        check: (grid: ShapeGrid) => {
          let tri = 0, sq = 0, ci = 0;
          for (let r = 0; r < 3; r++) {
            for (let c = 0; c < 3; c++) {
              const sh = grid[r][c]?.shape;
              if (sh === 'triangle') tri++;
              else if (sh === 'square') sq++;
              else if (sh === 'circle') ci++;
            }
          }
          return tri === 3 && sq === 3 && ci === 3;
        },
        break: (grid: ShapeGrid) => {
          for (let r = 0; r < 3; r++) {
            for (let c = 0; c < 3; c++) {
              grid[r][c] = { shape: 'triangle', color: 'red' };
            }
          }
        }
      }
    ];

    const newQuestions: InductiveChallengeQuestion[] = [];
    const numQuestions = 5;

    for (let i = 0; i < numQuestions; i++) {
      const rule = staticRules[Math.floor(Math.random() * staticRules.length)];
      
      const gridA = createEmptyGrid(3);
      rule.apply(gridA);
      
      const gridB = createEmptyGrid(3);
      rule.apply(gridB);
      
      const correct1 = createEmptyGrid(3);
      rule.apply(correct1);
      
      const correct2 = createEmptyGrid(3);
      rule.apply(correct2);
      
      const wrong1 = createEmptyGrid(3);
      rule.break(wrong1);
      
      const wrong2 = createEmptyGrid(3);
      rule.break(wrong2);
      
      const optionsGrids = [correct1, correct2, wrong1, wrong2].sort(() => Math.random() - 0.5);
      
      const options = optionsGrids.map((g, idx) => {
        const id = String.fromCharCode(65 + idx);
        return { id, grid: g, isCorrect: g === correct1 || g === correct2 };
      });
      
      const correctOptionIds = options.filter(o => o.isCorrect).map(o => o.id);

      newQuestions.push({
        id: `question-${Date.now()}-${i}`,
        examplePair: { gridA, gridB },
        options,
        correctOptionIds,
        rule: rule.name,
        displayDurationMs: 30000
      });
    }

    setQuestions(newQuestions);
    setTitle(`Auto Inductive Challenge ${Math.floor(Math.random() * 1000)}`);
    setDescription("Identify the hidden rule in the example pair, and pick the two options that follow it.");
    setValidationErrors([]);
  };

  const resetForm = () => {
    setTitle('');
    setDescription('');
    setDifficulty('medium');
    setQuestions([createDefaultQuestion(0)]);
    setCorrectPoints(3);
    setWrongPoints(-1);
    setValidationErrors([]);
  };

  return (
    <div className="space-y-6">
      <BuilderPageHeader
        title="Inductive Challenge Builder"
        description="Create shape-pattern recognition questions (Recognition)"
      />

      <BuilderValidationAlerts errors={validationErrors} />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-4">
          <GameInfoCard
            title={title}
            description={description}
            onTitleChange={setTitle}
            onDescriptionChange={setDescription}
            titlePlaceholder="e.g. Inductive Challenge Level 1"
            focusRingClass="focus:ring-purple-500"
          />

          {/* Question editors */}
          {questions.map((q, i) => (
            <QuestionEditor
              key={q.id}
              question={q}
              index={i}
              onUpdate={(updated) => updateQuestion(i, updated)}
              onDelete={() => deleteQuestion(i)}
              canDelete={questions.length > 1}
            />
          ))}

          {questions.length < 10 && (
            <Button variant="outline" className="w-full gap-2" onClick={addQuestion}>
              <Plus size={16} /> Add Question
            </Button>
          )}

          <BuilderActionBar
            onAutoGenerate={handleAutoGenerate}
            onReset={resetForm}
            onSave={() => setShowDialog(true)}
          />
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
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
              >
                <option value="easy">Easy</option>
                <option value="medium">Medium</option>
                <option value="hard">Hard</option>
              </select>
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
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">
                  Wrong (use negative)
                </label>
                <input
                  type="number"
                  value={wrongPoints}
                  onChange={(e) => setWrongPoints(Number(e.target.value))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>How to Play</CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-gray-600 space-y-1">
              <p>• Two grids demonstrate the rule</p>
              <p>• 4 option grids are shown</p>
              <p>• Player picks the 2 that follow the same rule</p>
              <p>• Correct → +{correctPoints} pts</p>
              <p>• Wrong → {wrongPoints} pt</p>
              <p>• 30 seconds per level</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Tips</CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-gray-600 space-y-1">
              <p>• Use distinct colors for different shapes</p>
              <p>• Keep the rule simple (rotation, shift, mirror)</p>
              <p>• Mark exactly <strong>2</strong> correct options</p>
              <p>• Add a rule note for your reference</p>
            </CardContent>
          </Card>
        </div>
      </div>

      <SaveToMockTestDialog
        open={showDialog}
        onOpenChange={setShowDialog}
        title="Save Inductive Challenge"
        description="Select a mock test to attach this game to"
        mockTests={mockTests}
        selectedMockTest={selectedMockTest}
        onSelectedMockTestChange={setSelectedMockTest}
        onSave={handleSave}
        isSaving={isSaving}
        focusRingClass="focus:ring-purple-500"
      />
    </div>
  );
};
