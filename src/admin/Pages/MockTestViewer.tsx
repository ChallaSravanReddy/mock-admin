import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Clock, ChevronLeft, ChevronRight, Send, BarChart3, Zap, Grid3x3, Shapes, Move } from 'lucide-react';
import { useMockTestStore } from '../store';
import { mockTestService } from '../services/mockTestService';
import { GAME_TYPE_CONFIG } from './MockTestManagement';

// ─── Mock question bank (placeholder — replace with Supabase queries) ─────────
const MOCK_QUESTION_BANK: Record<string, any[]> = {
  puzzle: [
    { id: 'p1', type: 'puzzle', title: 'Puzzle Q1', prompt: 'What symbol completes the 3×3 grid?', grid: [['circle','square','triangle'],['cross','circle','square'],['triangle',null,'circle']], options: ['cross','star','pentagon','diamond'], correct: 'cross' },
    { id: 'p2', type: 'puzzle', title: 'Puzzle Q2', prompt: 'Find the missing symbol in row 2.', grid: [['square','triangle','cross'],['circle',null,'triangle'],['cross','square','circle']], options: ['circle','square','triangle','cross'], correct: 'square' },
  ],
  switch_challenge: [
    { id: 's1', type: 'switch_challenge', title: 'Switch Q1', inputSymbols: ['circle','square','triangle','cross'], outputSymbols: ['triangle','square','cross','circle'], options: ['3142','2413','4321','1432'], correct: '3142' },
  ],
  grid_challenge: [
    { id: 'g1', type: 'grid_challenge', title: 'Grid Challenge Q1', rounds: 3, description: 'Remember the highlighted dot position in each round, then answer the symmetry question.' },
  ],
  inductive_challenge: [
    { id: 'i1', type: 'inductive_challenge', title: 'Inductive Q1', description: 'Two grids show a rule. Which two of the four options follow the same rule?', options: ['A','B','C','D'], correct: ['A','C'] },
  ],
  motion_challenge: [
    { id: 'm1', type: 'motion_challenge', title: 'Motion Challenge Q1', description: 'Move the red ball into the black hole within 10 moves.', maxMoves: 10 },
  ],
};

// ─── Symbol SVG renderer ──────────────────────────────────────────────────────
const Symbol: React.FC<{ name: string; size?: number }> = ({ name, size = 28 }) => {
  const map: Record<string, string> = {
    circle: '🔵', square: '🟦', triangle: '🔺', cross: '✚', star: '⭐',
    pentagon: '⬠', diamond: '🔷', hexagon: '⬡',
  };
  return <span style={{ fontSize: size }}>{map[name] ?? '?'}</span>;
};

// ─── Question Renderers ───────────────────────────────────────────────────────

const PuzzleQuestion: React.FC<{ q: any; answer: string; onAnswer: (a: string) => void }> = ({ q, answer, onAnswer }) => {
  const numCols = q.grid?.[0]?.length || 3;
  return (
    <div className="space-y-5">
      <p className="text-gray-700 font-medium">{q.prompt}</p>
      <div className="flex justify-center">
        <div className="inline-grid gap-1" style={{ gridTemplateColumns: `repeat(${numCols}, 64px)` }}>
          {q.grid.map((row: any[], ri: number) =>
            row.map((cell: string | null, ci: number) => {
              const isMissing = q.missingCell && q.missingCell.row === ri && q.missingCell.col === ci;
              return (
                <div
                  key={`${ri}-${ci}`}
                  className={`w-16 h-16 flex items-center justify-center border-2 rounded ${
                    isMissing
                      ? 'bg-amber-50 border-amber-300'
                      : 'bg-gray-50 border-gray-200'
                  }`}
                >
                  {isMissing ? (
                    <span className="text-amber-700 font-extrabold text-3xl">?</span>
                  ) : cell ? (
                    <Symbol name={cell} size={26} />
                  ) : null}
                </div>
              );
            })
          )}
        </div>
      </div>
      <div>
        <p className="text-sm font-medium text-gray-600 mb-2">Choose the missing symbol:</p>
        <div className="flex gap-3 flex-wrap">
          {q.options.map((opt: string) => (
            <button key={opt} onClick={() => onAnswer(opt)}
              className={`w-16 h-16 rounded-lg border-2 flex items-center justify-center transition-all ${answer === opt ? 'border-blue-600 bg-blue-50 scale-105 shadow' : 'border-gray-300 hover:border-blue-300'}`}>
              <Symbol name={opt} size={26} />
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

const SwitchQuestion: React.FC<{ q: any; answer: string; onAnswer: (a: string) => void }> = ({ q, answer, onAnswer }) => (
  <div className="space-y-5">
    <div className="grid grid-cols-2 gap-6">
      <div>
        <p className="text-xs font-semibold text-gray-500 uppercase mb-2">Input (top row)</p>
        <div className="flex gap-2 p-3 bg-blue-50 rounded-lg border border-blue-200">
          {q.inputSymbols.map((s: string, i: number) => (
            <div key={i} className="flex flex-col items-center gap-1">
              <Symbol name={s} size={26} /><span className="text-xs font-bold">{i+1}</span>
            </div>
          ))}
        </div>
      </div>
      <div>
        <p className="text-xs font-semibold text-gray-500 uppercase mb-2">Output (bottom row)</p>
        <div className="flex gap-2 p-3 bg-green-50 rounded-lg border border-green-200">
          {q.outputSymbols.map((s: string, i: number) => (
            <div key={i} className="flex flex-col items-center gap-1">
              <Symbol name={s} size={26} /><span className="text-xs font-bold text-green-700">{q.inputSymbols.indexOf(s)+1}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
    <div>
      <p className="text-sm font-medium text-gray-600 mb-2">What is the ordering code?</p>
      <div className="flex gap-3 flex-wrap">
        {q.options.map((opt: string) => (
          <button key={opt} onClick={() => onAnswer(opt)}
            className={`px-6 py-3 rounded-lg border-2 text-lg font-bold transition-all ${answer === opt ? 'border-blue-600 bg-blue-600 text-white' : 'border-gray-300 hover:border-blue-300'}`}>
            {opt}
          </button>
        ))}
      </div>
    </div>
  </div>
);

// ─── Interactive Game Renderers ──────────────────────────────────────────────

const COLOR_CSS = {
  red: '#dc2626',
  purple: '#7c3aed',
  dark: '#1e293b',
  yellow: '#ca8a04',
  'blue-light': '#38bdf8',
  'blue-dark': '#1d4ed8',
  pink: '#ec4899',
  orange: '#ea580c',
};

const SHAPE_COLOR_MAP: Record<string, string> = {
  green: '#16a34a',
  purple: '#9333ea',
  blue: '#1d4ed8',
  red: '#dc2626',
  orange: '#ea580c',
};

const ShapeIcon: React.FC<{ shape: string; color: string; size?: number }> = ({
  shape,
  color,
  size = 20,
}) => {
  const c = SHAPE_COLOR_MAP[color] || '#1d4ed8';
  switch (shape) {
    case 'square':
      return (
        <svg width={size} height={size} viewBox="0 0 20 20" className="inline-block">
          <rect x="2" y="2" width="16" height="16" fill={c} />
        </svg>
      );
    case 'circle':
      return (
        <svg width={size} height={size} viewBox="0 0 20 20" className="inline-block">
          <circle cx="10" cy="10" r="8" fill={c} />
        </svg>
      );
    case 'triangle':
      return (
        <svg width={size} height={size} viewBox="0 0 20 20" className="inline-block">
          <polygon points="10,2 18,18 2,18" fill={c} />
        </svg>
      );
    case 'cross':
      return (
        <svg width={size} height={size} viewBox="0 0 20 20" className="inline-block">
          <rect x="8" y="2" width="4" height="16" fill={c} />
          <rect x="2" y="8" width="16" height="4" fill={c} />
        </svg>
      );
    default:
      return null;
  }
};

const ReadOnlyShapeGrid: React.FC<{ grid: any[][]; label?: string }> = ({ grid, label }) => {
  if (!grid || !Array.isArray(grid)) return null;
  return (
    <div className="flex flex-col items-center gap-1.5">
      {label && <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">{label}</span>}
      <div
        className="grid gap-1 p-1.5 bg-white border-2 border-gray-200 rounded"
        style={{ gridTemplateColumns: `repeat(${grid[0]?.length || 3}, 1fr)` }}
      >
        {grid.map((row, ri) =>
          row.map((cell, ci) => (
            <div
              key={`${ri}-${ci}`}
              className="w-10 h-10 border border-gray-100 flex items-center justify-center bg-gray-50 rounded"
            >
              {cell && <ShapeIcon shape={cell.shape} color={cell.color} size={18} />}
            </div>
          ))
        )}
      </div>
    </div>
  );
};

const CellView: React.FC<{
  cell: any;
  onClick?: () => void;
  isSelected?: boolean;
  isTargetMove?: boolean;
  size?: number;
}> = ({ cell, onClick, isSelected = false, isTargetMove = false, size = 32 }) => {
  const base = 'flex items-center justify-center border select-none transition-all relative cursor-pointer';

  const overlay = (
    <>
      {isSelected && (
        <div className="absolute inset-0 border-2 border-blue-500 bg-blue-500/10 animate-pulse rounded-sm" />
      )}
      {isTargetMove && (
        <div className="absolute inset-0 border-2 border-dashed border-green-500 bg-green-500/10 hover:bg-green-500/20 rounded-sm flex items-center justify-center">
          <span className="text-green-600 font-bold text-lg">+</span>
        </div>
      )}
    </>
  );

  if (!cell) return null;

  if (cell.type === 'empty') {
    return (
      <div className={`${base} bg-gray-50 border-gray-200 hover:bg-gray-100`} style={{ width: size, height: size }} onClick={onClick}>
        {overlay}
      </div>
    );
  }

  if (cell.type === 'blocked') {
    return (
      <div className={`${base} bg-gray-200 border-gray-300`} style={{ width: size, height: size }}>
        <svg width={size * 0.55} height={size * 0.55} viewBox="0 0 20 20">
          <line x1="2" y1="2" x2="18" y2="18" stroke="#6b7280" strokeWidth="3" strokeLinecap="round" />
          <line x1="18" y1="2" x2="2" y2="18" stroke="#6b7280" strokeWidth="3" strokeLinecap="round" />
        </svg>
      </div>
    );
  }

  if (cell.type === 'hole') {
    return (
      <div className={`${base} bg-gray-50 border-gray-200`} style={{ width: size, height: size }} onClick={onClick}>
        <div
          className="rounded-full relative"
          style={{
            width: size * 0.58,
            height: size * 0.58,
            background: '#0f172a',
            boxShadow: 'inset 0 2px 6px rgba(0,0,0,0.6)',
          }}
        />
        {overlay}
      </div>
    );
  }

  if (cell.type === 'ball') {
    return (
      <div className={`${base} bg-gray-50 border-gray-200`} style={{ width: size, height: size }} onClick={onClick}>
        <div
          className="rounded-full"
          style={{
            width: size * 0.62,
            height: size * 0.62,
            background: 'radial-gradient(circle at 35% 35%, #f87171, #dc2626)',
            boxShadow: '0 2px 6px rgba(220,38,38,0.5)',
          }}
        />
        {overlay}
      </div>
    );
  }

  const bg = cell.color ? COLOR_CSS[cell.color as keyof typeof COLOR_CSS] : '#94a3b8';
  return (
    <div
      className={`${base} border-gray-300`}
      style={{ width: size, height: size, background: bg }}
      onClick={onClick}
    >
      {overlay}
    </div>
  );
};

const RenderSymmetryGrid: React.FC<{ grid: boolean[][] }> = ({ grid }) => {
  if (!grid || !Array.isArray(grid)) return null;
  return (
    <div className="grid grid-cols-5 gap-1 p-2 bg-slate-800 border border-slate-700 rounded w-44 h-44">
      {grid.map((row, ri) =>
        row.map((val, ci) => (
          <div
            key={`${ri}-${ci}`}
            className={`w-7 h-7 rounded border transition-all ${
              val ? 'bg-indigo-500 border-indigo-400 shadow shadow-indigo-500/50' : 'bg-slate-700 border-slate-600'
            }`}
          />
        ))
      )}
    </div>
  );
};

const GridChallengeQuestion: React.FC<{ q: any; answer?: any; onAnswer?: (a: any) => void }> = ({ q, answer, onAnswer }) => {
  const rounds = q.roundsData || [];
  const normalizedRounds = rounds.map((r: any, index: number) => ({
    id: r.id || `rnd-${index}`,
    dotPhase: r.dotPhase || {
      dots: r.dots || [],
      targetDotId: r.target_dot_id || '',
      highlightDurationMs: r.highlight_duration_ms || 2000,
    },
    symmetryPhase: r.symmetryPhase || {
      gridLeft: r.grid_left || [],
      gridRight: r.grid_right || [],
      isSymmetric: r.is_symmetric !== undefined ? r.is_symmetric : false,
      label: r.symmetry_label || 'Is it Symmetric?',
    }
  }));

  const [gameState, setGameState] = useState<'idle' | 'dot' | 'symmetry' | 'recall' | 'done'>('idle');
  const [currentRoundIdx, setCurrentRoundIdx] = useState(0);
  const [userAnswers, setUserAnswers] = useState<any[]>([]);

  useEffect(() => {
    setGameState(answer ? 'done' : 'idle');
    setCurrentRoundIdx(0);
    setUserAnswers(answer?.rounds || []);
  }, [q, answer]);

  useEffect(() => {
    let timer: any;
    if (gameState === 'dot') {
      const duration = normalizedRounds[currentRoundIdx]?.dotPhase.highlightDurationMs || 2000;
      timer = setTimeout(() => {
        setGameState('symmetry');
      }, duration);
    }
    return () => clearTimeout(timer);
  }, [gameState, currentRoundIdx]);

  if (normalizedRounds.length === 0) {
    return (
      <div className="text-center py-6 text-gray-500">
        No rounds defined in this challenge.
      </div>
    );
  }

  const currentRound = normalizedRounds[currentRoundIdx];

  const handleStart = () => {
    setGameState('dot');
    setCurrentRoundIdx(0);
    setUserAnswers([]);
    if (onAnswer) onAnswer(undefined);
  };

  const handleSymmetryAnswer = (answer: boolean) => {
    setUserAnswers(prev => [...prev, { round: currentRoundIdx, symmetryAnswer: answer }]);
    setGameState('recall');
  };

  const handleRecallDot = (dotId: string) => {
    const isCorrect = dotId === currentRound.dotPhase.targetDotId;
    const updated = [...userAnswers];
    if (updated[updated.length - 1]) {
      updated[updated.length - 1].recallCorrect = isCorrect;
    }
    setUserAnswers(updated);

    if (currentRoundIdx + 1 < normalizedRounds.length) {
      setCurrentRoundIdx(prev => prev + 1);
      setGameState('dot');
    } else {
      setGameState('done');
      if (onAnswer) {
        onAnswer({
          completed: true,
          rounds: updated,
        });
      }
    }
  };

  if (gameState === 'idle') {
    return (
      <div className="text-center space-y-6 py-8">
        <div className="w-16 h-16 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-3xl mx-auto shadow">🎯</div>
        <div className="max-w-md mx-auto space-y-2">
          <h3 className="text-lg font-bold text-gray-900">{q.title}</h3>
          <p className="text-sm text-gray-600">{q.description}</p>
        </div>
        <div className="bg-gray-50 rounded-xl p-5 border inline-block text-left text-sm text-gray-700 space-y-2">
          <p>• <strong>{normalizedRounds.length} rounds</strong> — interleaved memory and symmetry check</p>
          <p>• Highlighted dot appears for <strong>2 seconds</strong></p>
          <p>• Symmetry patterns shown for <strong>6 seconds</strong></p>
        </div>
        <div>
          <Button onClick={handleStart} className="px-8 py-6 text-lg font-bold bg-blue-600 hover:bg-blue-700 shadow-md">
            Start Grid Challenge
          </Button>
        </div>
      </div>
    );
  }

  if (gameState === 'dot') {
    return (
      <div className="flex flex-col items-center justify-center space-y-6 py-6">
        <div className="text-center space-y-1">
          <span className="text-xs font-bold text-blue-600 uppercase tracking-widest">Round {currentRoundIdx + 1} / {normalizedRounds.length}</span>
          <h3 className="text-xl font-bold text-gray-900">Memorize the Highlighted Dot</h3>
          <p className="text-sm text-gray-500">Pay attention to the blinking yellow dot</p>
        </div>

        <div className="relative w-80 h-80 bg-slate-900 rounded-2xl border-4 border-slate-800 shadow-xl overflow-hidden flex items-center justify-center">
          {currentRound.dotPhase.dots.map((dot: any) => {
            const isTarget = dot.id === currentRound.dotPhase.targetDotId;
            return (
              <div
                key={dot.id}
                className={`absolute w-4 h-4 rounded-full transition-all transform -translate-x-1/2 -translate-y-1/2 ${
                  isTarget
                    ? 'bg-yellow-400 ring-8 ring-yellow-400/30 scale-125 animate-ping'
                    : 'bg-blue-500/85'
                }`}
                style={{ left: `${dot.x}%`, top: `${dot.y}%` }}
              />
            );
          })}
          {currentRound.dotPhase.dots.map((dot: any) => {
            const isTarget = dot.id === currentRound.dotPhase.targetDotId;
            return (
              <div
                key={`actual-${dot.id}`}
                className={`absolute w-4 h-4 rounded-full transition-all transform -translate-x-1/2 -translate-y-1/2 ${
                  isTarget
                    ? 'bg-yellow-400 ring-4 ring-yellow-400/50 scale-125 shadow-lg shadow-yellow-400'
                    : 'bg-blue-500'
                }`}
                style={{ left: `${dot.x}%`, top: `${dot.y}%` }}
              />
            );
          })}
        </div>
      </div>
    );
  }

  if (gameState === 'symmetry') {
    return (
      <div className="flex flex-col items-center justify-center space-y-6 py-6">
        <div className="text-center space-y-1">
          <span className="text-xs font-bold text-indigo-600 uppercase tracking-widest">Round {currentRoundIdx + 1} / {normalizedRounds.length}</span>
          <h3 className="text-xl font-bold text-gray-900">{currentRound.symmetryPhase.label || 'Is it Symmetric?'}</h3>
          <p className="text-sm text-gray-500">Compare the left grid and the right grid</p>
        </div>

        <div className="flex items-center gap-6 p-6 bg-slate-900 rounded-2xl border-4 border-slate-800 shadow-xl">
          <RenderSymmetryGrid grid={currentRound.symmetryPhase.gridLeft} />
          <div className="text-2xl font-bold text-slate-500">|</div>
          <RenderSymmetryGrid grid={currentRound.symmetryPhase.gridRight} />
        </div>

        <div className="flex gap-4 w-full max-w-sm">
          <button
            onClick={() => handleSymmetryAnswer(true)}
            className="flex-1 py-4 bg-green-600 hover:bg-green-700 text-white rounded-xl font-bold shadow transition-all hover:scale-[1.02]"
          >
            Yes (Symmetric)
          </button>
          <button
            onClick={() => handleSymmetryAnswer(false)}
            className="flex-1 py-4 bg-red-600 hover:bg-red-700 text-white rounded-xl font-bold shadow transition-all hover:scale-[1.02]"
          >
            No (Asymmetric)
          </button>
        </div>
      </div>
    );
  }

  if (gameState === 'recall') {
    return (
      <div className="flex flex-col items-center justify-center space-y-6 py-6">
        <div className="text-center space-y-1">
          <span className="text-xs font-bold text-orange-600 uppercase tracking-widest">Round {currentRoundIdx + 1} / {normalizedRounds.length}</span>
          <h3 className="text-xl font-bold text-gray-900">Recall Highlighted Dot</h3>
          <p className="text-sm text-gray-500">Click on the dot that was blinking yellow in this round</p>
        </div>

        <div className="relative w-80 h-80 bg-slate-900 rounded-2xl border-4 border-slate-800 shadow-xl overflow-hidden">
          {currentRound.dotPhase.dots.map((dot: any) => {
            return (
              <button
                key={dot.id}
                onClick={() => handleRecallDot(dot.id)}
                className="absolute w-6 h-6 rounded-full bg-blue-500/30 hover:bg-blue-400 border border-blue-400 cursor-pointer transition-all transform -translate-x-1/2 -translate-y-1/2 hover:scale-125 flex items-center justify-center"
                style={{ left: `${dot.x}%`, top: `${dot.y}%` }}
              >
                <span className="w-2.5 h-2.5 rounded-full bg-blue-400" />
              </button>
            );
          })}
        </div>
      </div>
    );
  }

  const correctSymmetry = userAnswers.filter((ans, idx) => ans.symmetryAnswer === normalizedRounds[idx]?.symmetryPhase.isSymmetric).length;
  const correctRecall = userAnswers.filter(ans => ans.recallCorrect).length;

  return (
    <div className="text-center space-y-6 py-8">
      <div className="w-16 h-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center text-3xl mx-auto shadow">✓</div>
      <div className="max-w-md mx-auto space-y-2">
        <h3 className="text-xl font-bold text-gray-900">Grid Challenge Complete</h3>
        <p className="text-sm text-gray-500">Your answers for this section are registered locally.</p>
      </div>

      <div className="max-w-xs mx-auto bg-gray-50 border rounded-xl p-4 text-sm text-left space-y-2">
        <div className="flex justify-between">
          <span>Symmetry answers:</span>
          <strong className="text-green-700">{correctSymmetry} / {normalizedRounds.length}</strong>
        </div>
        <div className="flex justify-between">
          <span>Recall dot memory:</span>
          <strong className="text-green-700">{correctRecall} / {normalizedRounds.length}</strong>
        </div>
      </div>

      <div>
        <Button onClick={handleStart} variant="outline" className="px-6 py-2">
          Restart Section
        </Button>
      </div>
    </div>
  );
};

const InductiveQuestion: React.FC<{ q: any; answer: string[]; onAnswer: (a: string[]) => void }> = ({ q, answer, onAnswer }) => {
  const questions = q.questionsData || [];
  const normalizedQuestions = questions.map((qd: any, index: number) => ({
    id: qd.id || `qd-${index}`,
    examplePair: qd.examplePair || {
      gridA: qd.grid_a || [],
      gridB: qd.grid_b || [],
    },
    options: qd.options || [
      { id: 'A', grid: qd.option_a || [] },
      { id: 'B', grid: qd.option_b || [] },
      { id: 'C', grid: qd.option_c || [] },
      { id: 'D', grid: qd.option_d || [] },
    ],
    correctOptionIds: qd.correctOptionIds || qd.correct_option_ids || [],
    rule: qd.rule || qd.rule_note || '',
  }));

  const [activeQuestionIdx, setActiveQuestionIdx] = useState(0);

  if (normalizedQuestions.length === 0) {
    return (
      <div className="text-center py-6 text-gray-500">
        No questions defined in this challenge.
      </div>
    );
  }

  const activeQuestion = normalizedQuestions[activeQuestionIdx];

  const toggle = (opt: string) => {
    const next = answer.includes(opt) ? answer.filter(x => x !== opt) : answer.length < 2 ? [...answer, opt] : answer;
    onAnswer(next);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center bg-gray-50 p-3 rounded-lg border">
        <div>
          <h3 className="font-bold text-gray-800">Question {activeQuestionIdx + 1} of {normalizedQuestions.length}</h3>
          <p className="text-xs text-gray-500">{q.description || 'Find the rule and choose matching option grids'}</p>
        </div>
        {normalizedQuestions.length > 1 && (
          <div className="flex gap-1">
            {normalizedQuestions.map((_: any, idx: number) => (
              <button
                key={idx}
                onClick={() => setActiveQuestionIdx(idx)}
                className={`px-3 py-1.5 rounded text-xs font-semibold border ${
                  activeQuestionIdx === idx
                    ? 'bg-blue-600 border-blue-600 text-white shadow'
                    : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'
                }`}
              >
                Q {idx + 1}
              </button>
            ))}
          </div>
        )}
      </div>

      <div>
        <h4 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3">Example Pair (demonstrating the rule)</h4>
        <div className="flex gap-6 items-center justify-center p-6 bg-gray-50 rounded-xl border border-gray-200">
          <ReadOnlyShapeGrid grid={activeQuestion.examplePair.gridA} label="Grid A" />
          <div className="text-2xl font-bold text-gray-400">→</div>
          <ReadOnlyShapeGrid grid={activeQuestion.examplePair.gridB} label="Grid B" />
        </div>
      </div>

      <div>
        <p className="text-sm font-medium text-gray-600 mb-3">Pick 2 options that follow the same rule:</p>
        <div className="grid grid-cols-2 gap-4">
          {activeQuestion.options.map((opt: any) => {
            const isSelected = answer.includes(opt.id);
            return (
              <button
                key={opt.id}
                onClick={() => toggle(opt.id)}
                className={`flex flex-col items-center p-4 rounded-xl border-2 transition-all ${
                  isSelected
                    ? 'border-green-600 bg-green-50 shadow-md scale-[1.02]'
                    : 'border-gray-200 hover:border-gray-300 bg-white hover:bg-gray-50'
                }`}
              >
                <div className="flex justify-between w-full mb-2">
                  <span className="font-bold text-sm text-gray-700">Option {opt.id}</span>
                  {isSelected && <span className="text-xs font-bold text-green-700 bg-green-200 px-2 py-0.5 rounded-full">✓ Selected</span>}
                </div>
                <ReadOnlyShapeGrid grid={opt.grid} />
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};

const MotionQuestion: React.FC<{ q: any; answer?: any; onAnswer?: (a: any) => void }> = ({ q, answer, onAnswer }) => {
  const [activeLevelIdx, setActiveLevelIdx] = useState(0);
  const levels = q.levelsData || [];
  const normalizedLevels: Array<{
    id: string;
    rows: number;
    cols: number;
    grid: any[];
    maxMoves: number;
    label: string;
  }> = levels.map((lvl: any, index: number) => ({
    id: String(lvl.id || `lvl-${index}`),
    rows: lvl.rows || 6,
    cols: lvl.cols || 4,
    grid: lvl.grid || [],
    maxMoves: lvl.maxMoves || lvl.max_moves || 10,
    label: lvl.label || `Level ${index + 1}`,
  }));

  const [solvedLevels, setSolvedLevels] = useState<Record<string, { solved: boolean; moves: number }>>(
    answer?.solvedLevels || {}
  );

  useEffect(() => {
    setActiveLevelIdx(0);
    setSolvedLevels(answer?.solvedLevels || {});
  }, [q, answer]);

  if (normalizedLevels.length === 0) {
    return (
      <div className="text-center py-6 text-gray-500">
        No levels defined in this challenge.
      </div>
    );
  }

  const activeLevel = normalizedLevels[activeLevelIdx];

  // Game state
  const [grid, setGrid] = useState<any[][]>([]);
  const [movesCount, setMovesCount] = useState(0);
  const [selectedCell, setSelectedCell] = useState<{ row: number; col: number } | null>(null);
  const [isSolved, setIsSolved] = useState(false);
  const [history, setHistory] = useState<any[][][]>([]);

  // Initialize level
  useEffect(() => {
    if (activeLevel) {
      const levelSolvedInfo = solvedLevels[activeLevel.id];
      if (levelSolvedInfo?.solved) {
        setIsSolved(true);
        setMovesCount(levelSolvedInfo.moves);
        setSelectedCell(null);
        setHistory([]);
        // Draw the ball in the hole for visual correctness
        const clone = JSON.parse(JSON.stringify(activeLevel.grid));
        let ballRow = -1, ballCol = -1;
        let holeRow = -1, holeCol = -1;
        for (let r = 0; r < clone.length; r++) {
          for (let c = 0; c < clone[r].length; c++) {
            if (clone[r][c]?.type === 'ball') {
              ballRow = r;
              ballCol = c;
            }
            if (clone[r][c]?.type === 'hole') {
              holeRow = r;
              holeCol = c;
            }
          }
        }
        if (ballRow !== -1 && holeRow !== -1) {
          clone[holeRow][holeCol] = { type: 'ball' };
          clone[ballRow][ballCol] = { type: 'empty' };
        }
        setGrid(clone);
      } else {
        const clone = JSON.parse(JSON.stringify(activeLevel.grid));
        setGrid(clone);
        setMovesCount(0);
        setSelectedCell(null);
        setIsSolved(false);
        setHistory([]);
      }
    }
  }, [activeLevelIdx, q]);

  const handleCellClick = (r: number, c: number) => {
    if (isSolved) return;

    const clickedCell = grid[r]?.[c];
    if (!clickedCell) return;

    if (selectedCell) {
      const { row: sr, col: sc } = selectedCell;
      const isAdjacent = Math.abs(r - sr) + Math.abs(c - sc) === 1;

      if (isAdjacent) {
        const sourcePiece = grid[sr][sc];
        const canMoveToEmpty = clickedCell.type === 'empty';
        const canBallMoveToHole = sourcePiece.type === 'ball' && clickedCell.type === 'hole';

        if (canMoveToEmpty || canBallMoveToHole) {
          // Push current state to history for Undo
          setHistory(prev => [...prev, JSON.parse(JSON.stringify(grid))]);

          const newGrid = JSON.parse(JSON.stringify(grid));
          
          if (canBallMoveToHole) {
            setIsSolved(true);
            const levelId = String(activeLevel.id);
            const updatedSolved: Record<string, { solved: boolean; moves: number }> = {
              ...solvedLevels,
              [levelId]: { solved: true, moves: movesCount + 1 }
            };
            setSolvedLevels(updatedSolved);

            const allSolved = normalizedLevels.every((lvl) => updatedSolved[lvl.id]?.solved);

            if (onAnswer) {
              onAnswer({
                solvedLevels: updatedSolved,
                isCompleted: allSolved,
              });
            }
          }

          // Move piece
          newGrid[r][c] = sourcePiece;
          newGrid[sr][sc] = { type: 'empty' };

          setGrid(newGrid);
          setMovesCount(prev => prev + 1);
          setSelectedCell(null);
          return;
        }
      }

      // If clicked on another movable cell, switch selection
      if (clickedCell.type === 'ball' || clickedCell.type === 'colored') {
        setSelectedCell({ row: r, col: c });
      } else {
        setSelectedCell(null);
      }
    } else {
      // Select cell if it's movable
      if (clickedCell.type === 'ball' || clickedCell.type === 'colored') {
        setSelectedCell({ row: r, col: c });
      }
    }
  };

  const handleUndo = () => {
    if (history.length === 0) return;
    const prevGrid = history[history.length - 1];
    setGrid(prevGrid);
    setHistory(prev => prev.slice(0, -1));
    setMovesCount(prev => Math.max(0, prev - 1));
    setIsSolved(false);
    setSelectedCell(null);
  };

  const handleReset = () => {
    const clone = JSON.parse(JSON.stringify(activeLevel.grid));
    setGrid(clone);
    setMovesCount(0);
    setSelectedCell(null);
    setIsSolved(false);
    setHistory([]);

    const updatedSolved: Record<string, { solved: boolean; moves: number }> = { ...solvedLevels };
    delete updatedSolved[String(activeLevel.id)];
    setSolvedLevels(updatedSolved);

    if (onAnswer) {
      const allSolved = normalizedLevels.every((lvl) => updatedSolved[lvl.id]?.solved);
      if (Object.keys(updatedSolved).length === 0) {
        onAnswer(undefined);
      } else {
        onAnswer({
          solvedLevels: updatedSolved,
          isCompleted: allSolved,
        });
      }
    }
  };

  // Get valid moves for highlighted visual guides
  const getAdjacentEmptyCoords = () => {
    if (!selectedCell) return [];
    const { row: sr, col: sc } = selectedCell;
    const sourcePiece = grid[sr]?.[sc];
    if (!sourcePiece) return [];

    const directions = [
      { r: sr - 1, c: sc },
      { r: sr + 1, c: sc },
      { r: sr, c: sc - 1 },
      { r: sr, c: sc + 1 },
    ];

    return directions.filter(d => {
      const target = grid[d.r]?.[d.c];
      if (!target) return false;
      if (target.type === 'empty') return true;
      if (sourcePiece.type === 'ball' && target.type === 'hole') return true;
      return false;
    });
  };

  const validMoves = getAdjacentEmptyCoords();

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center bg-gray-50 p-3 rounded-lg border">
        <div className="space-y-0.5">
          <h3 className="font-bold text-gray-800">{activeLevel.label}</h3>
          <div className="flex gap-2 items-center text-xs font-semibold">
            <span className={movesCount > activeLevel.maxMoves ? 'text-red-600 animate-pulse' : 'text-gray-600'}>
              Moves: {movesCount} / {activeLevel.maxMoves}
            </span>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={handleUndo} disabled={history.length === 0}>
            Undo
          </Button>
          <Button variant="outline" size="sm" onClick={handleReset}>
            Reset
          </Button>
          {normalizedLevels.length > 1 && (
            <div className="flex gap-1 border-l pl-2 ml-1">
              {normalizedLevels.map((_: any, idx: number) => (
                <button
                  key={idx}
                  onClick={() => setActiveLevelIdx(idx)}
                  className={`px-2.5 py-1 rounded text-xs font-semibold border ${
                    activeLevelIdx === idx
                      ? 'bg-blue-600 border-blue-600 text-white shadow'
                      : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  Lvl {idx + 1}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {isSolved && (
        <div className="bg-green-50 border border-green-200 text-green-800 text-sm font-semibold rounded-lg p-3 text-center animate-bounce shadow-sm">
          🎉 Level Solved! Well done.
        </div>
      )}

      {movesCount >= activeLevel.maxMoves && !isSolved && (
        <div className="bg-red-50 border border-red-200 text-red-800 text-sm font-semibold rounded-lg p-3 text-center shadow-sm">
          ⚠️ Out of moves! Click Reset to try again.
        </div>
      )}

      <div className="flex flex-col items-center justify-center p-6 bg-white border border-gray-200 rounded-xl shadow-inner min-h-[300px]">
        {grid && Array.isArray(grid) && grid.length > 0 ? (
          <div
            className="inline-grid gap-1 p-2 bg-gray-100 border border-gray-300 rounded shadow"
            style={{ gridTemplateColumns: `repeat(${activeLevel.cols}, 1fr)` }}
          >
            {grid.map((row: any[], ri: number) =>
              row.map((cell: any, ci: number) => {
                const isSelected = selectedCell?.row === ri && selectedCell?.col === ci;
                const isTarget = validMoves.some(d => d.r === ri && d.c === ci);
                return (
                  <CellView
                    key={`${ri}-${ci}`}
                    cell={cell}
                    size={42}
                    onClick={() => handleCellClick(ri, ci)}
                    isSelected={isSelected}
                    isTargetMove={isTarget}
                  />
                );
              })
            )}
          </div>
        ) : (
          <div className="text-gray-400 text-sm">Grid not configured</div>
        )}
      </div>
      <p className="text-xs text-gray-400 text-center italic">Interactive game view — connect to game engine to play</p>
    </div>
  );
};

// ─── Score Screen ─────────────────────────────────────────────────────────────
const ScoreScreen: React.FC<{ questions: any[]; answers: Record<string, any>; testTitle: string; onRetry: () => void }> = ({ questions, answers, testTitle, onRetry }) => {
  let correct = 0;
  questions.forEach(q => {
    const a = answers[q.id];
    if (q.type === 'puzzle' && a === q.correct) correct++;
    if (q.type === 'switch_challenge' && a === q.correct) correct++;
    if (q.type === 'inductive_challenge' && Array.isArray(a) && a.length === 2 && q.correct.every((c: string) => a.includes(c))) correct++;
    if (q.type === 'grid_challenge' && a && Array.isArray(a.rounds)) {
      const rounds = q.roundsData || [];
      const normalizedRounds = rounds.map((r: any) => ({
        isSymmetric: r.symmetryPhase?.isSymmetric !== undefined
          ? r.symmetryPhase.isSymmetric
          : r.is_symmetric !== undefined
          ? r.is_symmetric
          : false,
      }));
      const symmetryAllCorrect = a.rounds.every((ans: any, idx: number) => ans.symmetryAnswer === normalizedRounds[idx]?.isSymmetric);
      const recallAllCorrect = a.rounds.every((ans: any) => ans.recallCorrect);
      if (symmetryAllCorrect && recallAllCorrect && a.rounds.length === normalizedRounds.length) {
        correct++;
      }
    }
    if (q.type === 'motion_challenge' && a && a.isCompleted) {
      correct++;
    }
  });
  const pct = questions.length ? Math.round((correct / questions.length) * 100) : 0;
  const byType = GAME_TYPE_CONFIG.map(cfg => ({
    ...cfg,
    total: questions.filter(q => q.type === cfg.id).length,
  })).filter(x => x.total > 0);

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
      <div className="max-w-lg w-full space-y-6">
        <div className="text-center space-y-2">
          <div className="text-6xl font-black text-blue-600">{pct}%</div>
          <h2 className="text-2xl font-bold text-gray-900">{testTitle}</h2>
          <p className="text-gray-500">{correct} / {questions.length} questions correct</p>
        </div>
        <Card>
          <CardHeader><CardTitle>Breakdown by Game Type</CardTitle></CardHeader>
          <CardContent className="space-y-2">
            {byType.map(cfg => (
              <div key={cfg.id} className="flex items-center justify-between">
                <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium border ${cfg.color}`}>
                  {cfg.icon} {cfg.label}
                </span>
                <span className="text-sm text-gray-600">{cfg.total} question{cfg.total !== 1 ? 's' : ''}</span>
              </div>
            ))}
          </CardContent>
        </Card>
        <div className="flex gap-3">
          <Button variant="outline" className="flex-1" onClick={onRetry}>Retry Test</Button>
          <Button className="flex-1" onClick={() => window.history.back()}>Back to Tests</Button>
        </div>
      </div>
    </div>
  );
};

// ─── Main Viewer ──────────────────────────────────────────────────────────────
export const MockTestViewer: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { mockTests } = useMockTestStore();
  const test = mockTests.find(t => t.id === id);

  const [questions, setQuestions] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [current, setCurrent] = useState(0);
  const [answers, setAnswers] = useState<Record<string, any>>({});
  const [submitted, setSubmitted] = useState(false);
  const [timeLeft, setTimeLeft] = useState((test?.durationMinutes ?? 30) * 60);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (!id) return;
    let active = true;
    const fetchQuestions = async () => {
      setIsLoading(true);
      try {
        const data = await mockTestService.getQuestionsForTest(id);
        if (active) {
          const enabledTypes = ((test as any)?.enabledGameTypes ?? []) as string[];
          const filtered = data.filter((q) => enabledTypes.includes(q.type));
          setQuestions(filtered);
        }
      } catch (err) {
        console.error('Error fetching questions for test:', err);
      } finally {
        if (active) setIsLoading(false);
      }
    };
    fetchQuestions();
    return () => {
      active = false;
    };
  }, [id, test]);

  useEffect(() => {
    if (submitted) return;
    timerRef.current = setInterval(() => setTimeLeft(t => {
      if (t <= 1) { clearInterval(timerRef.current!); setSubmitted(true); return 0; }
      return t - 1;
    }), 1000);
    return () => clearInterval(timerRef.current!);
  }, [submitted]);

  if (!test) return (
    <div className="flex items-center justify-center h-screen">
      <div className="text-center">
        <p className="text-gray-500 mb-4">Test not found</p>
        <Button onClick={() => navigate('/admin/mock-tests')}>Back to Tests</Button>
      </div>
    </div>
  );

  if (isLoading) return (
    <div className="flex items-center justify-center h-screen bg-gray-50">
      <div className="text-center space-y-4">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
        <p className="text-gray-500 font-medium">Loading test questions...</p>
      </div>
    </div>
  );

  if (submitted) return (
    <ScoreScreen questions={questions} answers={answers} testTitle={test.title}
      onRetry={() => { setSubmitted(false); setAnswers({}); setCurrent(0); setTimeLeft(test.durationMinutes * 60); }} />
  );

  const q = questions[current];
  const mm = String(Math.floor(timeLeft / 60)).padStart(2, '0');
  const ss = String(timeLeft % 60).padStart(2, '0');
  const progress = ((current + 1) / questions.length) * 100;

  const setAnswer = (val: any) => setAnswers(prev => ({ ...prev, [q.id]: val }));

  const renderQuestion = () => {
    if (!q) return <p className="text-gray-400 text-center py-10">No questions in this section.</p>;
    switch (q.type) {
      case 'puzzle': return <PuzzleQuestion q={q} answer={answers[q.id] ?? ''} onAnswer={setAnswer} />;
      case 'switch_challenge': return <SwitchQuestion q={q} answer={answers[q.id] ?? ''} onAnswer={setAnswer} />;
      case 'grid_challenge': return <GridChallengeQuestion q={q} answer={answers[q.id]} onAnswer={setAnswer} />;
      case 'inductive_challenge': return <InductiveQuestion q={q} answer={answers[q.id] ?? []} onAnswer={setAnswer} />;
      case 'motion_challenge': return <MotionQuestion q={q} answer={answers[q.id]} onAnswer={setAnswer} />;
      default: return null;
    }
  };

  const cfg = q ? GAME_TYPE_CONFIG.find(g => g.id === q.type) : null;

  return (
    <div className="flex flex-col h-screen bg-gray-50">
      {/* Top bar */}
      <div className="bg-slate-900 text-white px-6 py-3 flex items-center justify-between flex-shrink-0">
        <div>
          <h1 className="font-bold text-lg">{test.title}</h1>
          <p className="text-slate-400 text-xs">{questions.length} questions</p>
        </div>
        <div className={`flex items-center gap-2 font-mono text-xl font-bold px-4 py-2 rounded-lg ${timeLeft < 120 ? 'bg-red-600 animate-pulse' : 'bg-slate-700'}`}>
          <Clock size={18} /> {mm}:{ss}
        </div>
        <Button variant="outline" size="sm" className="text-white border-slate-600 hover:bg-slate-700"
          onClick={() => { if (confirm('Submit test?')) setSubmitted(true); }}>
          <Send size={15} className="mr-1" /> Submit
        </Button>
      </div>

      {/* Progress bar */}
      <div className="h-1.5 bg-gray-200">
        <div className="h-full bg-blue-500 transition-all duration-300" style={{ width: `${progress}%` }} />
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* Left nav */}
        <div className="w-56 bg-white border-r overflow-y-auto flex-shrink-0 hidden lg:block">
          <div className="p-3 border-b bg-gray-50">
            <p className="text-xs font-semibold text-gray-500 uppercase">Questions</p>
          </div>
          <nav className="p-2 space-y-1">
            {questions.map((question, i) => {
              const qCfg = GAME_TYPE_CONFIG.find(g => g.id === question.type);
              return (
                <button key={question.id} onClick={() => setCurrent(i)}
                  className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-all ${
                    i === current ? 'bg-blue-600 text-white' :
                    answers[question.id] !== undefined ? 'bg-green-50 text-green-800 border border-green-200' :
                    'text-gray-600 hover:bg-gray-100'
                  }`}>
                  <span className="w-5 h-5 rounded-full border flex items-center justify-center text-xs font-bold flex-shrink-0">
                    {i + 1}
                  </span>
                  <span className="truncate text-xs">{qCfg?.label.split(' ')[0]}</span>
                  {answers[question.id] !== undefined && i !== current && <span className="ml-auto text-green-600 text-xs">✓</span>}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Main question area */}
        <main className="flex-1 overflow-y-auto p-6">
          <div className="max-w-2xl mx-auto space-y-5">
            {/* Question header */}
            <div className="flex items-start justify-between">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  {cfg && (
                    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full border text-xs font-medium ${cfg.color}`}>
                      {cfg.icon} {cfg.label}
                    </span>
                  )}
                  <span className="text-xs text-gray-400">Q{current + 1} of {questions.length}</span>
                </div>
                {q && <h2 className="text-xl font-bold text-gray-900">{q.title}</h2>}
              </div>
            </div>

            {/* Question body */}
            <Card>
              <CardContent className="pt-6">{renderQuestion()}</CardContent>
            </Card>

            {/* Navigation */}
            <div className="flex items-center justify-between">
              <Button variant="outline" disabled={current === 0} onClick={() => setCurrent(c => c - 1)} className="gap-1">
                <ChevronLeft size={16} /> Previous
              </Button>
              <span className="text-sm text-gray-500">{current + 1} / {questions.length}</span>
              {current < questions.length - 1 ? (
                <Button onClick={() => setCurrent(c => c + 1)} className="gap-1">
                  Next <ChevronRight size={16} />
                </Button>
              ) : (
                <Button onClick={() => setSubmitted(true)} className="gap-1 bg-green-600 hover:bg-green-700">
                  <Send size={16} /> Submit Test
                </Button>
              )}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};
