import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Clock, ChevronLeft, ChevronRight, Send, BarChart3, Zap, Grid3x3, Shapes, Move } from 'lucide-react';
import { useMockTestStore } from '../store';
import { mockTestService } from '../services/mockTestService';
import { GAME_TYPE_CONFIG } from './MockTestManagement';
import { ReadOnlyShapeGrid } from '../components/inductive/InductiveGridDisplay';
import { normalizeInductiveQuestions } from '../lib/normalizeInductiveQuestion';
import { normalizeSwitchQuestion } from '../lib/normalizeSwitchQuestion';
import { normalizeGridQuestion } from '../lib/normalizeGridQuestion';
import { normalizeMotionQuestion } from '../lib/normalizeMotionQuestion';
import { SwitchSymbolRow } from '../components/switch/SwitchSymbolRow';
import { generateHackathonQuestion } from '../lib/hackathonGenerators';
import { hackathonToViewerQuestion } from '../lib/hackathonToViewer';

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
    {
      id: 'g1',
      type: 'grid_challenge',
      title: 'Grid Challenge Q1',
      rounds: 3,
      description: 'Remember the highlighted dot position in each round, then answer the symmetry question.',
      roundsData: [
        {
          id: 'r1',
          dotPhase: {
            dots: [
              { id: 'd1', x: 20, y: 25, isTarget: true },
              { id: 'd2', x: 55, y: 40, isTarget: false },
              { id: 'd3', x: 75, y: 70, isTarget: false },
              { id: 'd4', x: 35, y: 80, isTarget: false },
              { id: 'd5', x: 85, y: 20, isTarget: false },
            ],
            targetDotId: 'd1',
            highlightDurationMs: 2000,
          },
          symmetryPhase: {
            id: 's1',
            gridLeft: [
              [true, false, true, false, false],
              [false, true, false, true, false],
              [true, false, false, false, true],
              [false, false, true, false, true],
              [false, true, false, true, false],
            ],
            gridRight: [
              [true, false, true, false, false],
              [false, true, false, true, false],
              [true, false, false, false, true],
              [false, false, true, false, true],
              [false, true, false, true, false],
            ],
            isSymmetric: true,
            label: 'Are they identical?',
          },
        },
      ],
    },
  ],
  inductive_challenge: [
    {
      id: 'i1',
      type: 'inductive_challenge',
      title: 'Inductive Q1',
      description: 'Two grids show a rule. Which two of the four options follow the same rule?',
      correct: [],
      questionsData: [
        {
          id: 'iq1',
          displayDurationMs: 30000,
          correctOptionIds: [],
          examplePair: {
            gridA: [],
            gridB: [],
          },
          options: [
            { id: 'A', isCorrect: false, grid: [] },
            { id: 'B', isCorrect: false, grid: [] },
            { id: 'C', isCorrect: false, grid: [] },
            { id: 'D', isCorrect: false, grid: [] },
          ],
        },
      ],
    },
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

// ─── Shared challenge chrome ─────────────────────────────────────────────────

type QuestionChromeProps = {
  questionNumber?: number;
  totalQuestions?: number;
};

interface ChallengeShellProps {
  title: string;
  questionNumber?: number;
  totalQuestions?: number;
  timeRemaining?: number;
  totalTime?: number;
  children: React.ReactNode;
}

function useCountdown(totalSeconds: number | undefined, onExpire: () => void) {
  const [timeRemaining, setTimeRemaining] = useState<number | undefined>(undefined);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const onExpireRef = useRef(onExpire);
  onExpireRef.current = onExpire;

  const resetTimer = useCallback(() => {
    if (totalSeconds === undefined) return;
    setTimeRemaining(totalSeconds);
  }, [totalSeconds]);

  useEffect(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }

    if (totalSeconds === undefined) {
      setTimeRemaining(undefined);
      return;
    }

    setTimeRemaining(totalSeconds);

    intervalRef.current = setInterval(() => {
      setTimeRemaining((prev) => {
        if (prev === undefined) return prev;
        if (prev <= 1) {
          if (intervalRef.current) clearInterval(intervalRef.current);
          intervalRef.current = null;
          onExpireRef.current();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [totalSeconds]);

  return {
    timeRemaining: totalSeconds === undefined ? undefined : timeRemaining,
    resetTimer,
  };
}

const ChallengeShell: React.FC<ChallengeShellProps> = ({
  title,
  questionNumber,
  totalQuestions,
  timeRemaining,
  totalTime,
  children,
}) => {
  const showTimer =
    timeRemaining !== undefined && totalTime !== undefined && totalTime > 0;
  const barWidth = showTimer ? (timeRemaining / totalTime) * 100 : 0;
  const isLow = showTimer && timeRemaining < 10;

  return (
    <div className="space-y-5">
      {showTimer && (
        <div className="h-1.5 bg-gray-200 rounded-full overflow-hidden">
          <div
            className={`h-full transition-all duration-300 ${isLow ? 'bg-red-500' : 'bg-blue-600'}`}
            style={{ width: `${barWidth}%` }}
          />
        </div>
      )}
      <div className="flex items-start justify-between gap-4">
        <h3 className="text-lg font-bold text-gray-900">{title}</h3>
        {questionNumber !== undefined && totalQuestions !== undefined && (
          <span className="text-sm text-gray-500 whitespace-nowrap">
            Question {questionNumber} of {totalQuestions}
          </span>
        )}
      </div>
      {children}
    </div>
  );
};

const CHALLENGE_POINTS = { correct: 3, wrong: -1 };

// ─── Question Renderers ───────────────────────────────────────────────────────

const PuzzleQuestion: React.FC<{
  q: any;
  answer: string;
  onAnswer: (a: string) => void;
  questionNumber?: number;
  totalQuestions?: number;
}> = ({ q, answer, onAnswer, questionNumber, totalQuestions }) => {
  const [submitted, setSubmitted] = useState(false);
  const numCols = q.grid?.[0]?.length || 3;
  const title = q.prompt || q.description || q.title || 'Choose the missing symbol';

  const isCorrect = submitted && answer === q.correct;
  const points = q.scoringCorrect ?? CHALLENGE_POINTS.correct;

  const handleSubmit = () => {
    if (!answer) return;
    setSubmitted(true);
  };

  return (
    <ChallengeShell
      title={title}
      questionNumber={questionNumber}
      totalQuestions={totalQuestions}
      timeRemaining={undefined}
    >
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
            <button
              key={opt}
              type="button"
              disabled={submitted}
              onClick={() => onAnswer(opt)}
              className={`w-16 h-16 rounded-lg border-2 flex items-center justify-center transition-all ${
                answer === opt
                  ? 'border-blue-600 bg-blue-50 scale-105 shadow'
                  : 'border-gray-300 hover:border-blue-300'
              } disabled:opacity-75`}
            >
              <Symbol name={opt} size={26} />
            </button>
          ))}
        </div>
      </div>
      {!submitted && (
        <Button onClick={handleSubmit} disabled={!answer} className="w-full">
          Submit Answer
        </Button>
      )}
      {submitted && (
        <p className={isCorrect ? 'text-green-600 font-semibold' : 'text-red-500 font-semibold'}>
          {isCorrect ? `Correct! +${points} pts` : 'Incorrect'}
        </p>
      )}
    </ChallengeShell>
  );
};

const SwitchQuestion: React.FC<{
  q: any;
  answer: string;
  onAnswer: (a: string) => void;
  questionNumber?: number;
  totalQuestions?: number;
}> = ({ q, answer, onAnswer, questionNumber, totalQuestions }) => {
  const sw = normalizeSwitchQuestion(q);
  const [submitted, setSubmitted] = useState(false);
  const [timedOut, setTimedOut] = useState(false);
  const totalTime = sw.timeDuration;
  const correctPoints = sw.scoringCorrect ?? CHALLENGE_POINTS.correct;

  const handleTimeout = useCallback(() => {
    setTimedOut(true);
    setSubmitted(true);
  }, []);

  const { timeRemaining } = useCountdown(totalTime, handleTimeout);

  const showFeedback = submitted || timedOut || Boolean(answer);
  const isCorrect = answer === sw.correct && !timedOut;

  const handleSelect = (opt: string) => {
    if (submitted || timedOut) return;
    onAnswer(opt);
    setSubmitted(true);
  };

  return (
    <ChallengeShell
      title={q.title || 'Switch Challenge'}
      questionNumber={questionNumber}
      totalQuestions={totalQuestions}
      timeRemaining={timeRemaining}
      totalTime={totalTime}
    >
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
        <SwitchSymbolRow
          symbols={sw.inputSymbols}
          variant="input"
          label="Input (top row)"
        />
        <SwitchSymbolRow
          symbols={sw.outputSymbols}
          variant="output"
          inputSymbols={sw.inputSymbols}
          label="Output (bottom row)"
        />
      </div>
      <div>
        <p className="text-sm font-medium text-gray-600 mb-2">What is the ordering code?</p>
        <div className="flex gap-3 flex-wrap">
          {sw.options.map((opt: string) => (
            <button
              key={opt}
              type="button"
              disabled={submitted || timedOut}
              onClick={() => handleSelect(opt)}
              className={`px-6 py-3 rounded-lg border-2 text-lg font-bold transition-all ${
                answer === opt
                  ? 'border-blue-600 bg-blue-600 text-white'
                  : 'border-gray-300 hover:border-blue-300'
              } disabled:opacity-75`}
            >
              {opt}
            </button>
          ))}
        </div>
      </div>
      {showFeedback && (
        <p className={isCorrect ? 'text-green-600 font-semibold' : 'text-red-500 font-semibold'}>
          {timedOut
            ? "Time's up — Incorrect"
            : isCorrect
              ? `Correct! +${correctPoints} pts`
              : 'Incorrect'}
        </p>
      )}
    </ChallengeShell>
  );
};

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

const GridChallengeQuestion: React.FC<{
  q: any;
  answer?: any;
  onAnswer?: (a: any) => void;
  questionNumber?: number;
  totalQuestions?: number;
}> = ({ q, answer, onAnswer, questionNumber, totalQuestions }) => {
  const gridNorm = normalizeGridQuestion(q);
  const normalizedRounds = gridNorm.rounds;
  const totalRounds = gridNorm.totalRounds;
  const overallSeconds = totalRounds * 120; // 2 minutes per round

  const [gameState, setGameState] = useState<'idle' | 'dot' | 'symmetry' | 'recall' | 'done'>('idle');
  const [currentRoundIdx, setCurrentRoundIdx] = useState(0);
  const [userAnswers, setUserAnswers] = useState<any[]>([]);
  const [timedOut, setTimedOut] = useState(false);
  const gameStateRef = useRef(gameState);
  gameStateRef.current = gameState;

  const handleOverallTimeout = useCallback(() => {
    // Don't end the game while the dot is being shown — it auto-transitions after 2s
    if (gameStateRef.current === 'dot') return;
    setTimedOut(true);
    setGameState('done');
    if (onAnswer) {
      onAnswer({ completed: false, timedOut: true, rounds: userAnswers });
    }
  }, [onAnswer, userAnswers]);

  const activeOverallSeconds = gameState === 'idle' ? undefined : overallSeconds;
  const { timeRemaining, resetTimer } = useCountdown(activeOverallSeconds, handleOverallTimeout);

  useEffect(() => {
    setGameState(answer ? 'done' : 'idle');
    setCurrentRoundIdx(0);
    setUserAnswers(answer?.rounds || []);
    setTimedOut(false);
  }, [q, answer]);

  // Dot phase: always show highlighted dot for exactly 2 seconds, then go to symmetry
  useEffect(() => {
    let timer: ReturnType<typeof setTimeout> | undefined;
    if (gameState === 'dot') {
      timer = setTimeout(() => {
        setGameState('symmetry');
      }, 2000);
    }
    return () => {
      if (timer) clearTimeout(timer);
    };
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
    setTimedOut(false);
    if (onAnswer) onAnswer(undefined);
    resetTimer();
  };

  const handleSymmetryAnswer = (symAnswer: boolean) => {
    setUserAnswers((prev) => [...prev, { round: currentRoundIdx, symmetryAnswer: symAnswer }]);
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
      setCurrentRoundIdx((prev) => prev + 1);
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

  const shellRoundNumber = gameState === 'idle' ? questionNumber : currentRoundIdx + 1;
  const shellRoundTotal = gameState === 'idle' ? totalQuestions : totalRounds;

  let phaseContent: React.ReactNode = null;

  if (gameState === 'idle') {
    phaseContent = (
      <div className="text-center space-y-6 py-4">
        <div className="w-16 h-16 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-3xl mx-auto shadow">
          🎯
        </div>
        <p className="text-sm text-gray-600 max-w-md mx-auto">{gridNorm.description || q.description}</p>
        <div className="bg-gray-50 rounded-xl p-5 border inline-block text-left text-sm text-gray-700 space-y-2">
          <p>
            • <strong>{normalizedRounds.length} rounds</strong> — interleaved memory and symmetry check
          </p>
          <p>
            • Highlighted dot appears for <strong>{((normalizedRounds[0]?.dotPhase.highlightDurationMs ?? 2000) / 1000).toFixed(1).replace(/\.0$/, '')} seconds</strong>
          </p>
          <p>
            • Overall time limit: <strong>{overallSeconds} seconds</strong>
          </p>
        </div>
        <Button onClick={handleStart} className="px-8 py-6 text-lg font-bold bg-blue-600 hover:bg-blue-700 shadow-md">
          Start Grid Challenge
        </Button>
      </div>
    );
  } else if (gameState === 'dot') {
    phaseContent = (
      <div className="flex flex-col items-center justify-center space-y-6 py-2">
        <div className="text-center space-y-1">
          <span className="text-xs font-bold text-blue-600 uppercase tracking-widest">
            Round {currentRoundIdx + 1} / {normalizedRounds.length}
          </span>
          <p className="text-sm font-medium text-gray-700">Memorize the Highlighted Dot</p>
          <p className="text-sm text-gray-500">Pay attention to the blinking yellow dot</p>
        </div>
        <div className="relative w-80 h-80 bg-slate-900 rounded-2xl border-4 border-slate-800 shadow-xl overflow-hidden flex items-center justify-center">
          {/* Ping animation layer for target dot only */}
          {currentRound.dotPhase.dots.map((dot: any) => {
            const isTarget = dot.id === currentRound.dotPhase.targetDotId;
            if (!isTarget) return null;
            return (
              <div
                key={`ping-${dot.id}`}
                className="absolute w-5 h-5 rounded-full bg-yellow-400/50 animate-ping transform -translate-x-1/2 -translate-y-1/2"
                style={{ left: `${dot.x}%`, top: `${dot.y}%` }}
              />
            );
          })}
          {/* All dots — target is yellow, others are blue */}
          {currentRound.dotPhase.dots.map((dot: any) => {
            const isTarget = dot.id === currentRound.dotPhase.targetDotId;
            return (
              <div
                key={dot.id}
                className={`absolute rounded-full transform -translate-x-1/2 -translate-y-1/2 transition-all ${
                  isTarget
                    ? 'w-5 h-5 bg-yellow-400 shadow-lg shadow-yellow-400/70 ring-2 ring-yellow-300 scale-110'
                    : 'w-4 h-4 bg-blue-400'
                }`}
                style={{ left: `${dot.x}%`, top: `${dot.y}%` }}
              />
            );
          })}
        </div>
      </div>
    );
  } else if (gameState === 'symmetry') {
    phaseContent = (
      <div className="flex flex-col items-center justify-center space-y-6 py-2">
        <div className="text-center space-y-1">
          <span className="text-xs font-bold text-indigo-600 uppercase tracking-widest">
            Round {currentRoundIdx + 1} / {normalizedRounds.length}
          </span>
          <p className="text-sm font-medium text-gray-700">
            {currentRound.symmetryPhase.label || 'Is it Symmetric?'}
          </p>
          <p className="text-sm text-gray-500">Compare the left grid and the right grid</p>
        </div>
        <div className="flex items-center gap-6 p-6 bg-slate-900 rounded-2xl border-4 border-slate-800 shadow-xl">
          <RenderSymmetryGrid grid={currentRound.symmetryPhase.gridLeft} />
          <div className="text-2xl font-bold text-slate-500">|</div>
          <RenderSymmetryGrid grid={currentRound.symmetryPhase.gridRight} />
        </div>
        <div className="flex gap-4 w-full max-w-sm">
          <button
            type="button"
            onClick={() => handleSymmetryAnswer(true)}
            className="flex-1 py-4 bg-green-600 hover:bg-green-700 text-white rounded-xl font-bold shadow transition-all hover:scale-[1.02]"
          >
            Yes (Symmetric)
          </button>
          <button
            type="button"
            onClick={() => handleSymmetryAnswer(false)}
            className="flex-1 py-4 bg-red-600 hover:bg-red-700 text-white rounded-xl font-bold shadow transition-all hover:scale-[1.02]"
          >
            No (Asymmetric)
          </button>
        </div>
      </div>
    );
  } else if (gameState === 'recall') {
    phaseContent = (
      <div className="flex flex-col items-center justify-center space-y-6 py-2">
        <div className="text-center space-y-1">
          <span className="text-xs font-bold text-orange-600 uppercase tracking-widest">
            Round {currentRoundIdx + 1} / {normalizedRounds.length}
          </span>
          <p className="text-sm font-medium text-gray-700">Recall Highlighted Dot</p>
          <p className="text-sm text-gray-500">Click on the dot that was blinking yellow in this round</p>
        </div>
        <div className="relative w-80 h-80 bg-slate-900 rounded-2xl border-4 border-slate-800 shadow-xl overflow-hidden">
          {currentRound.dotPhase.dots.map((dot: any) => (
            <button
              key={dot.id}
              type="button"
              onClick={() => handleRecallDot(dot.id)}
              className="absolute w-6 h-6 rounded-full bg-blue-500/30 hover:bg-blue-400 border border-blue-400 cursor-pointer transition-all transform -translate-x-1/2 -translate-y-1/2 hover:scale-125 flex items-center justify-center"
              style={{ left: `${dot.x}%`, top: `${dot.y}%` }}
            >
              <span className="w-2.5 h-2.5 rounded-full bg-blue-400" />
            </button>
          ))}
        </div>
      </div>
    );
  } else {
    const correctSymmetry = userAnswers.filter(
      (ans, idx) => ans.symmetryAnswer === normalizedRounds[idx]?.symmetryPhase.isSymmetric
    ).length;
    const correctRecall = userAnswers.filter((ans) => ans.recallCorrect).length;

    phaseContent = (
      <div className="text-center space-y-6 py-4">
        <div className="w-16 h-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center text-3xl mx-auto shadow">
          ✓
        </div>
        <p className="text-sm text-gray-500">Your answers for this section are registered locally.</p>
        {timedOut && (
          <p className="text-red-500 font-semibold">Overall time limit reached</p>
        )}
        <div className="max-w-xs mx-auto bg-gray-50 border rounded-xl p-4 text-sm text-left space-y-2">
          <div className="flex justify-between">
            <span>Symmetry answers:</span>
            <strong className="text-green-700">
              {correctSymmetry} / {normalizedRounds.length}
            </strong>
          </div>
          <div className="flex justify-between">
            <span>Recall dot memory:</span>
            <strong className="text-green-700">
              {correctRecall} / {normalizedRounds.length}
            </strong>
          </div>
        </div>
        <Button onClick={handleStart} variant="outline" className="px-6 py-2">
          Restart Section
        </Button>
      </div>
    );
  }

  return (
    <ChallengeShell
      title={q.title || 'Grid Challenge'}
      questionNumber={shellRoundNumber}
      totalQuestions={shellRoundTotal}
      timeRemaining={gameState === 'idle' ? undefined : timeRemaining}
      totalTime={gameState === 'idle' ? undefined : overallSeconds}
    >
      {phaseContent}
    </ChallengeShell>
  );
};

const InductiveQuestion: React.FC<{
  q: any;
  answer: string[];
  onAnswer: (a: string[]) => void;
  questionNumber?: number;
  totalQuestions?: number;
}> = ({ q, answer, onAnswer, questionNumber, totalQuestions }) => {
  const normalizedQuestions = normalizeInductiveQuestions(q);

  const [activeQuestionIdx, setActiveQuestionIdx] = useState(0);
  const [submitted, setSubmitted] = useState(false);
  const [timedOut, setTimedOut] = useState(false);

  if (normalizedQuestions.length === 0) {
    return (
      <div className="text-center py-6 text-gray-500">
        No questions defined in this challenge.
      </div>
    );
  }

  const activeQuestion = normalizedQuestions[activeQuestionIdx];
  const totalSeconds = Math.round((activeQuestion.displayDurationMs ?? 30000) / 1000);
  const correctIds: string[] = activeQuestion.correctOptionIds?.length
    ? activeQuestion.correctOptionIds
    : activeQuestion.options.filter((o: any) => o.isCorrect).map((o: any) => o.id);

  const handleTimeout = useCallback(() => {
    setTimedOut(true);
    setSubmitted(true);
  }, []);

  const { timeRemaining, resetTimer } = useCountdown(totalSeconds, handleTimeout);

  useEffect(() => {
    setSubmitted(false);
    setTimedOut(false);
    resetTimer();
  }, [activeQuestionIdx, q.id, resetTimer]);

  const toggle = (opt: string) => {
    if (submitted || timedOut) return;
    const next = answer.includes(opt)
      ? answer.filter((x) => x !== opt)
      : answer.length < 2
        ? [...answer, opt]
        : answer;
    onAnswer(next);
  };

  const handleSubmit = () => {
    if (answer.length !== 2) return;
    setSubmitted(true);
  };

  const isCorrect =
    !timedOut &&
    answer.length === 2 &&
    correctIds.length === 2 &&
    correctIds.every((id) => answer.includes(id)) &&
    answer.every((id) => correctIds.includes(id));

  const correctPoints = q.scoringCorrect ?? CHALLENGE_POINTS.correct;

  return (
    <ChallengeShell
      title={q.title || 'Inductive Challenge'}
      questionNumber={questionNumber ?? activeQuestionIdx + 1}
      totalQuestions={totalQuestions ?? normalizedQuestions.length}
      timeRemaining={timeRemaining}
      totalTime={totalSeconds}
    >
      {normalizedQuestions.length > 1 && (
        <div className="flex gap-1 flex-wrap">
          {normalizedQuestions.map((_: any, idx: number) => (
            <button
              key={idx}
              type="button"
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

      <p className="text-xs text-gray-500">{q.description || 'Find the rule and choose matching option grids'}</p>

      <div>
        <h4 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3">
          Example Pair (demonstrating the rule)
        </h4>
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
                type="button"
                disabled={submitted || timedOut}
                onClick={() => toggle(opt.id)}
                className={`flex flex-col items-center p-4 rounded-xl border-2 transition-all ${
                  isSelected
                    ? 'border-green-600 bg-green-50 shadow-md scale-[1.02]'
                    : 'border-gray-200 hover:border-gray-300 bg-white hover:bg-gray-50'
                } disabled:opacity-75`}
              >
                <div className="flex justify-between w-full mb-2">
                  <span className="font-bold text-sm text-gray-700">Option {opt.id}</span>
                  {isSelected && (
                    <span className="text-xs font-bold text-green-700 bg-green-200 px-2 py-0.5 rounded-full">
                      ✓ Selected
                    </span>
                  )}
                </div>
                <ReadOnlyShapeGrid grid={opt.grid} />
              </button>
            );
          })}
        </div>
      </div>

      {!submitted && !timedOut && (
        <Button onClick={handleSubmit} disabled={answer.length !== 2} className="w-full">
          Submit Answer
        </Button>
      )}

      {(submitted || timedOut) && (
        <p className={isCorrect ? 'text-green-600 font-semibold' : 'text-red-500 font-semibold'}>
          {timedOut
            ? "Time's up — Incorrect"
            : isCorrect
              ? `Correct! +${correctPoints} pts`
              : 'Incorrect'}
        </p>
      )}
    </ChallengeShell>
  );
};

const MotionQuestion: React.FC<{
  q: any;
  answer?: any;
  onAnswer?: (a: any) => void;
  questionNumber?: number;
  totalQuestions?: number;
}> = ({ q, answer, onAnswer, questionNumber, totalQuestions }) => {
  const motionNorm = normalizeMotionQuestion(q);
  const [activeLevelIdx, setActiveLevelIdx] = useState(0);
  const [timedOut, setTimedOut] = useState(false);
  const totalTime = motionNorm.timeDurationSeconds;

  const handleTimeout = useCallback(() => {
    setTimedOut(true);
  }, []);

  const { timeRemaining } = useCountdown(totalTime, handleTimeout);
  const normalizedLevels = motionNorm.levels;

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
    <ChallengeShell
      title={q.title || activeLevel.label}
      questionNumber={questionNumber ?? activeLevelIdx + 1}
      totalQuestions={totalQuestions ?? normalizedLevels.length}
      timeRemaining={timeRemaining}
      totalTime={totalTime}
    >
      {timedOut && (
        <p className="text-red-500 font-semibold text-sm">Overall time limit reached</p>
      )}
      <div className="flex justify-between items-center bg-gray-50 p-3 rounded-lg border">
        <div className="space-y-0.5">
          <p className="font-bold text-gray-800">{activeLevel.label}</p>
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
    </ChallengeShell>
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
      const normalizedRounds = normalizeGridQuestion(q).rounds;
      const symmetryAllCorrect = a.rounds.every(
        (ans: any, idx: number) =>
          ans.symmetryAnswer === normalizedRounds[idx]?.symmetryPhase?.isSymmetric
      );
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
  const { mockTests, setMockTests } = useMockTestStore();
  const testFromStore = mockTests.find((t) => t.id === id);
  const [test, setTest] = useState(testFromStore ?? null);
  const [loadError, setLoadError] = useState<string | null>(null);

  const [questions, setQuestions] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [current, setCurrent] = useState(0);
  const [answers, setAnswers] = useState<Record<string, any>>({});
  const [submitted, setSubmitted] = useState(false);
  const [timeLeft, setTimeLeft] = useState((test?.durationMinutes ?? 30) * 60);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Round-wise state variables
  const [rounds, setRounds] = useState<any[]>([]);
  const [activeRoundIdx, setActiveRoundIdx] = useState<number | null>(null);
  const [showingRules, setShowingRules] = useState(false);
  const [completedRounds, setCompletedRounds] = useState<Record<string, boolean>>({});

  const formatDate = (iso: string | undefined) => {
    if (!iso) return '—';
    try {
      return new Date(iso).toLocaleDateString('en-GB', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
      });
    } catch {
      return '—';
    }
  };

  const getGameRules = (type: string) => {
    switch (type) {
      case 'puzzle':
        return {
          title: 'Puzzle Reasoning',
          instructions: [
            'You will be shown a grid (3x3 or 4x4) with one cell missing, marked by a question mark (?).',
            'Analyze the symbols and find the underlying logical pattern across the rows and columns.',
            'Select the correct symbol from the given options that completes the grid.',
            'Click "Submit Answer" to save your selection for that question.'
          ]
        };
      case 'switch_challenge':
        return {
          title: 'Switch Challenge',
          instructions: [
            'Observe the top row (Input Symbols) and the bottom row (Output Symbols).',
            'Find the correct digit ordering code (e.g. 3142) that maps the input positions to the output positions.',
            'This is a timed challenge. Select your answer and proceed before the timer runs out!'
          ]
        };
      case 'grid_challenge':
        return {
          title: 'Grid Challenge',
          instructions: [
            'This test consists of multiple interleaved rounds.',
            'Dot Phase: Memorize the position of the blinking yellow dot (shown for 2 seconds).',
            'Symmetry Phase: Answer whether the left and right grids are symmetric (identical).',
            'Recall Phase: Click the exact grid cell where the blinking yellow dot appeared.'
          ]
        };
      case 'inductive_challenge':
        return {
          title: 'Inductive Challenge',
          instructions: [
            'An example pair demonstrating the grid transformation rule is shown at the top.',
            'Study the example pair to find the transformation rule.',
            'Select exactly two options from the choices that follow the same rule.',
            'Click "Submit Answer" to finalize your choice.'
          ]
        };
      case 'motion_challenge':
        return {
          title: 'Motion Challenge',
          instructions: [
            'You must guide the red ball into the black hole.',
            'Click on a colored block or the ball, then click an adjacent empty cell to slide it.',
            'Try to solve the puzzle in as few moves as possible, staying within the maximum allowed moves.',
            'Use "Undo" to reverse your last move, or "Reset" to start the level over.'
          ]
        };
      default:
        return {
          title: 'Game Round',
          instructions: [
            'Solve the questions in this round.',
            'Read the questions carefully and select the correct option.',
            'Click "Next" to continue.'
          ]
        };
    }
  };

  useEffect(() => {
    if (testFromStore) setTest(testFromStore);
  }, [testFromStore]);

  useEffect(() => {
    if (!id) return;
    let active = true;
    const load = async () => {
      setIsLoading(true);
      setLoadError(null);
      try {
        let testMeta = mockTests.find((t) => t.id === id) ?? null;
        if (!testMeta) {
          testMeta = await mockTestService.getMockTestById(id);
          if (testMeta && active) {
            setMockTests([...mockTests.filter((t) => t.id !== id), testMeta]);
          }
        }
        if (active && testMeta) {
          setTest(testMeta);
          setTimeLeft(testMeta.durationMinutes * 60);
        }

        const data = await mockTestService.getQuestionsForTest(id);
        if (!active) return;

        const enabledTypes = (testMeta?.enabledGameTypes && testMeta.enabledGameTypes.length > 0)
          ? (testMeta.enabledGameTypes as string[])
          : Array.from(new Set(data.map((q: any) => q.type)));

        const allPaddedQuestions: any[] = [];
        const roundsList: any[] = [];

        enabledTypes.forEach((type) => {
          const typeQuestions = data.filter((q: any) => q.type === type);
          const padded = [...typeQuestions];
          
          while (padded.length < 5) {
            try {
              const generated = generateHackathonQuestion(type as any, 'manual');
              const viewerQ = hackathonToViewerQuestion(generated);
              padded.push(viewerQ);
            } catch (err) {
              console.error(`Error generating fallback question for ${type}:`, err);
              const fallbackPool = MOCK_QUESTION_BANK[type] || [];
              if (fallbackPool.length > 0) {
                const randomFallback = fallbackPool[Math.floor(Math.random() * fallbackPool.length)];
                padded.push({
                  ...randomFallback,
                  id: `fallback-${type}-${Date.now()}-${Math.random()}`
                });
              } else {
                break;
              }
            }
          }

          allPaddedQuestions.push(...padded);

          const cfg = GAME_TYPE_CONFIG.find((g) => g.id === type);
          roundsList.push({
            type,
            label: cfg ? cfg.label : type,
            questions: padded,
          });
        });

        setQuestions(allPaddedQuestions);
        setRounds(roundsList);
        setCurrent(0);

        if (roundsList.length === 0) {
          setLoadError('No rounds are configured for this mock test.');
        }
      } catch (err) {
        console.error('Error loading test:', err);
        if (active) setLoadError('Failed to load test questions.');
      } finally {
        if (active) setIsLoading(false);
      }
    };
    load();
    return () => {
      active = false;
    };
  }, [id, mockTests, setMockTests]);

  useEffect(() => {
    if (submitted) return;
    timerRef.current = setInterval(() => setTimeLeft(t => {
      if (t <= 1) { clearInterval(timerRef.current!); setSubmitted(true); return 0; }
      return t - 1;
    }), 1000);
    return () => clearInterval(timerRef.current!);
  }, [submitted]);

  if (!isLoading && !test) return (
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

  if (!test) {
    return (
      <div className="flex items-center justify-center h-screen">
        <p className="text-gray-500">Loading test…</p>
      </div>
    );
  }

  if (submitted) return (
    <ScoreScreen questions={questions} answers={answers} testTitle={test.title}
      onRetry={() => {
        setSubmitted(false);
        setAnswers({});
        setCurrent(0);
        setTimeLeft(test.durationMinutes * 60);
        setActiveRoundIdx(null);
        setShowingRules(false);
        setCompletedRounds({});
      }} />
  );

  if (!isLoading && rounds.length === 0) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-50 p-6">
        <div className="max-w-md text-center space-y-4">
          <h2 className="text-xl font-bold text-gray-900">{test?.title ?? 'Mock Test'}</h2>
          <p className="text-gray-600">{loadError ?? 'No questions available for this exam.'}</p>
          <Button onClick={() => navigate('/admin/mock-tests')}>Back to Mock Tests</Button>
        </div>
      </div>
    );
  }

  const activeRound = activeRoundIdx !== null ? rounds[activeRoundIdx] : null;
  const q = activeRound ? activeRound.questions[current] : null;
  const mm = String(Math.floor(timeLeft / 60)).padStart(2, '0');
  const ss = String(timeLeft % 60).padStart(2, '0');
  const progress = activeRound && activeRound.questions.length ? ((current + 1) / activeRound.questions.length) * 100 : 0;

  const setAnswer = (val: any) => {
    if (!q) return;
    setAnswers((prev) => ({ ...prev, [q.id]: val }));
  };

  const renderQuestion = () => {
    if (!activeRound || !q) return <p className="text-gray-400 text-center py-10">No questions in this section.</p>;
    const questionNumber = current + 1;
    const totalQuestionCount = activeRound.questions.length;
    const chrome: QuestionChromeProps = { questionNumber, totalQuestions: totalQuestionCount };
    switch (q.type) {
      case 'puzzle':
        return (
          <PuzzleQuestion
            key={q.id}
            q={q}
            answer={answers[q.id] ?? ''}
            onAnswer={setAnswer}
            {...chrome}
          />
        );
      case 'switch_challenge':
        return (
          <SwitchQuestion
            key={q.id}
            q={q}
            answer={answers[q.id] ?? ''}
            onAnswer={setAnswer}
            {...chrome}
          />
        );
      case 'grid_challenge':
        return (
          <GridChallengeQuestion
            key={q.id}
            q={q}
            answer={answers[q.id]}
            onAnswer={setAnswer}
            {...chrome}
          />
        );
      case 'inductive_challenge':
        return (
          <InductiveQuestion
            key={q.id}
            q={q}
            answer={answers[q.id] ?? []}
            onAnswer={setAnswer}
            {...chrome}
          />
        );
      case 'motion_challenge':
        return (
          <MotionQuestion
            key={q.id}
            q={q}
            answer={answers[q.id]}
            onAnswer={setAnswer}
            {...chrome}
          />
        );
      default:
        return null;
    }
  };

  const startRoundFlow = (idx: number) => {
    setActiveRoundIdx(idx);
    setShowingRules(true);
    setCurrent(0);
  };

  const cfg = q ? GAME_TYPE_CONFIG.find(g => g.id === q.type) : null;
  const activeRoundCfg = activeRound ? GAME_TYPE_CONFIG.find(g => g.id === activeRound.type) : null;
  const rules = activeRound ? getGameRules(activeRound.type) : null;

  // ─── Render Rounds Timeline UI ────────────────────────────────────────────────
  if (activeRoundIdx === null) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col">
        {/* Header / Top bar */}
        <div className="bg-white border-b px-6 py-4 flex items-center justify-between flex-shrink-0 shadow-sm">
          <div>
            <h1 className="font-extrabold text-xl text-slate-800">{test.title}</h1>
            <p className="text-slate-500 text-xs mt-0.5">{rounds.length} rounds · {questions.length} total questions</p>
          </div>
          <div className="flex items-center gap-4">
            <div className={`flex items-center gap-2 font-mono text-lg font-bold px-4 py-2 rounded-xl transition-all ${timeLeft < 120 ? 'bg-red-500 text-white animate-pulse' : 'bg-slate-100 text-slate-700 border'}`}>
              <Clock size={18} /> {mm}:{ss}
            </div>
            <Button
              className="bg-blue-600 hover:bg-blue-700 text-white font-bold px-5 py-2.5 rounded-xl shadow transition-all"
              onClick={() => { if (confirm('Submit the entire test?')) setSubmitted(true); }}
            >
              <Send size={15} className="mr-1.5" /> Submit Assessment
            </Button>
          </div>
        </div>

        {/* Timeline block */}
        <div className="max-w-4xl w-full mx-auto p-8 space-y-6 flex-1">
          <div className="border-b pb-4">
            <h2 className="text-2xl font-bold text-gray-900">Rounds</h2>
            <p className="text-sm text-gray-500">Complete each round to finish the assessment.</p>
          </div>

          <div className="bg-white rounded-2xl border border-gray-200/60 shadow-sm p-8 relative">
            <div className="relative pl-12 space-y-6">
              {/* Vertical timeline line */}
              <div className="absolute left-[15px] top-4 bottom-4 w-[2px] bg-gray-200" />

              {rounds.map((round, idx) => {
                const isCompleted = completedRounds[round.type];
                const roundNum = idx + 1;
                const testDateStr = formatDate(test.createdAt);

                return (
                  <div key={round.type} className="relative flex items-center justify-between group">
                    {/* Circle number */}
                    <div
                      className={`absolute -left-[45px] w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold transition-all z-10 bg-[#8be040] text-white shadow-sm`}
                    >
                      {roundNum}
                    </div>

                    {/* Round Details Card */}
                    <div className="flex-1 ml-4 bg-[#f8f9fa] rounded-2xl p-6 border border-gray-100 flex items-center justify-between transition-all hover:bg-gray-50/80">
                      <div className="space-y-2">
                        <h3 className="font-bold text-gray-900 text-base">{round.label}</h3>
                        <div className="flex gap-x-12 text-xs text-gray-500 font-medium">
                          <span>Start date: {testDateStr}</span>
                          <span>End date: {testDateStr}</span>
                        </div>
                      </div>

                      <div className="flex flex-col items-center gap-1">
                        {isCompleted ? (
                          <>
                            <Button
                              disabled
                              className="bg-[#d2edd2] text-[#4d7d4d] font-bold rounded-full px-6 py-2 text-xs cursor-not-allowed border border-green-200"
                            >
                              Completed
                            </Button>
                            <span className="text-[10px] text-gray-400 font-semibold">Round ended</span>
                          </>
                        ) : (
                          <>
                            <Button
                              onClick={() => startRoundFlow(idx)}
                              className="bg-[#c2f0ad] hover:bg-[#b2e59b] text-[#558245] font-bold rounded-full px-6 py-2 text-xs transition-all border border-[#afd99b]/30 shadow-sm"
                            >
                              Take Test
                            </Button>
                            <span className="text-[10px] text-green-600 font-semibold">Active</span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ─── Render Rules Screen ──────────────────────────────────────────────────────
  if (showingRules && rules && activeRound) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col">
        {/* Header / Top bar */}
        <div className="bg-white border-b px-6 py-4 flex items-center justify-between flex-shrink-0 shadow-sm">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="sm"
              className="text-slate-600 hover:text-slate-900"
              onClick={() => {
                setActiveRoundIdx(null);
                setShowingRules(false);
              }}
            >
              <ChevronLeft size={16} className="mr-1" /> Exit Round
            </Button>
            <div className="h-5 w-[1px] bg-slate-200" />
            <h1 className="font-extrabold text-xl text-slate-800">{test.title}</h1>
          </div>
          <div className={`flex items-center gap-2 font-mono text-lg font-bold px-4 py-2 rounded-xl transition-all ${timeLeft < 120 ? 'bg-red-500 text-white animate-pulse' : 'bg-slate-100 text-slate-700 border'}`}>
            <Clock size={18} /> {mm}:{ss}
          </div>
        </div>

        <div className="flex-1 flex items-center justify-center p-6 bg-slate-50/50">
          <Card className="max-w-xl w-full shadow-lg border border-slate-100 rounded-2xl overflow-hidden bg-white">
            <CardHeader className="bg-slate-900 text-white p-6">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-slate-800 rounded-xl">
                  {activeRoundCfg?.icon}
                </div>
                <div>
                  <span className="text-xs text-slate-400 font-bold uppercase tracking-wider">Round {activeRoundIdx + 1} rules</span>
                  <CardTitle className="text-xl font-extrabold mt-0.5">{rules.title}</CardTitle>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-6 space-y-6">
              <div className="space-y-4">
                <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wide">Instructions:</h3>
                <ul className="space-y-3">
                  {rules.instructions.map((inst, index) => (
                    <li key={index} className="flex items-start gap-2.5 text-sm text-slate-600 leading-relaxed">
                      <span className="w-5 h-5 rounded-full bg-slate-100 text-slate-700 flex items-center justify-center text-xs font-bold mt-0.5 flex-shrink-0">
                        {index + 1}
                      </span>
                      <span>{inst}</span>
                    </li>
                  ))}
                </ul>
              </div>
              
              <div className="bg-amber-50 border border-amber-200/50 rounded-xl p-4 text-xs text-amber-800 flex items-start gap-2.5">
                <Zap size={16} className="mt-0.5 text-amber-600 flex-shrink-0 animate-pulse" />
                <div>
                  <strong className="font-bold">Important Info:</strong>
                  <p className="mt-0.5 leading-relaxed text-amber-700">
                    This round contains <span className="font-semibold">{activeRound.questions.length} questions</span>. Once you start, you can navigate between questions in this round, but you must complete them before finalizing the round.
                  </p>
                </div>
              </div>

              <Button
                onClick={() => setShowingRules(false)}
                className="w-full py-6 text-base font-bold bg-[#8be040] hover:bg-[#7bc835] text-white shadow-md rounded-xl transition-all active:scale-[0.98]"
              >
                Start Round
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  // ─── Render Active Question Flow ──────────────────────────────────────────────
  return (
    <div className="flex flex-col h-screen bg-gray-50">
      {/* Top bar */}
      <div className="bg-slate-900 text-white px-6 py-3 flex items-center justify-between flex-shrink-0">
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="sm"
            className="text-slate-300 hover:text-white"
            onClick={() => {
              if (confirm('Return to Rounds list? Your answers will be saved.')) {
                setActiveRoundIdx(null);
                setShowingRules(false);
                setCurrent(0);
              }
            }}
          >
            <ChevronLeft size={16} className="mr-1" /> Back to Rounds
          </Button>
          <div className="h-5 w-[1px] bg-slate-700" />
          <div>
            <h1 className="font-bold text-lg">{test.title}</h1>
            <p className="text-slate-400 text-xs">{activeRound?.label || 'Active Round'}</p>
          </div>
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
        {/* Left nav - scoped to current round */}
        {activeRound && (
          <div className="w-56 bg-white border-r overflow-y-auto flex-shrink-0 hidden lg:block">
            <div className="p-3 border-b bg-gray-50 flex items-center justify-between">
              <p className="text-xs font-semibold text-gray-500 uppercase">Questions</p>
              <span className="text-[10px] bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded font-mono">
                {activeRound.questions.length} Qs
              </span>
            </div>
            <nav className="p-2 space-y-1">
              {activeRound.questions.map((question: any, i: number) => {
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
                    <span className="truncate text-xs">{qCfg?.label.split(' ')[0] || 'Question'}</span>
                    {answers[question.id] !== undefined && i !== current && <span className="ml-auto text-green-600 text-xs">✓</span>}
                  </button>
                );
              })}
            </nav>
          </div>
        )}

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
                  {activeRound && (
                    <span className="text-xs text-gray-400">Q{current + 1} of {activeRound.questions.length}</span>
                  )}
                </div>
                {q && <h2 className="text-xl font-bold text-gray-900">{q.title}</h2>}
              </div>
            </div>

            {/* Question body */}
            <Card>
              <CardContent className="pt-6">{renderQuestion()}</CardContent>
            </Card>

            {/* Navigation */}
            {activeRound && (
              <div className="flex items-center justify-between">
                <Button variant="outline" disabled={current === 0} onClick={() => setCurrent(c => c - 1)} className="gap-1">
                  <ChevronLeft size={16} /> Previous
                </Button>
                <span className="text-sm text-gray-500">{current + 1} / {activeRound.questions.length}</span>
                {current < activeRound.questions.length - 1 ? (
                  <Button onClick={() => setCurrent(c => c + 1)} className="gap-1">
                    Next <ChevronRight size={16} />
                  </Button>
                ) : (
                  <Button
                    onClick={() => {
                      setCompletedRounds((prev) => ({ ...prev, [activeRound.type]: true }));
                      setActiveRoundIdx(null);
                      setCurrent(0);
                    }}
                    className="gap-1 bg-emerald-600 hover:bg-emerald-700 text-white font-bold"
                  >
                    Finish Round <ChevronRight size={16} />
                  </Button>
                )}
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
};
