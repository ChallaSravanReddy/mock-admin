import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { SwithChallengeGame } from '../../types/swithChallenge';
import { SymbolDisplay } from './SymbolDisplay';

interface SwithChallengePlayerProps {
  game: SwithChallengeGame;
  onComplete: (result: {
    selectedAnswer: string;
    isCorrect: boolean;
    pointsEarned: number;
    timeTaken: number;
  }) => void;
}

export const SwithChallengePlayer: React.FC<SwithChallengePlayerProps> = ({ game, onComplete }) => {
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [timeLeft, setTimeLeft] = useState(game.timeDuration);
  const [isTimeUp, setIsTimeUp] = useState(false);
  const [isAnswered, setIsAnswered] = useState(false);
  const [startTime] = useState(Date.now());

  // Timer effect
  useEffect(() => {
    if (isAnswered || isTimeUp) return;

    const interval = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          setIsTimeUp(true);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [isAnswered, isTimeUp]);

  const handleSelectAnswer = (answer: string) => {
    if (isAnswered || isTimeUp) return;
    setSelectedAnswer(answer);
  };

  const handleSubmit = () => {
    if (!selectedAnswer) return;

    const isCorrect = selectedAnswer === game.correctOption;
    const pointsEarned = isCorrect
      ? game.scoringRules.correctPoints
      : game.scoringRules.wrongPoints;
    const timeTaken = game.timeDuration - timeLeft;

    setIsAnswered(true);
    onComplete({
      selectedAnswer,
      isCorrect,
      pointsEarned,
      timeTaken,
    });
  };

  const handleTimeUp = () => {
    setIsAnswered(true);
    const pointsEarned = game.scoringRules.wrongPoints;
    onComplete({
      selectedAnswer: '',
      isCorrect: false,
      pointsEarned,
      timeTaken: game.timeDuration,
    });
  };

  // Auto submit when time is up
  useEffect(() => {
    if (isTimeUp && !isAnswered) {
      handleTimeUp();
    }
  }, [isTimeUp, isAnswered]);

  const timePercentage = (timeLeft / game.timeDuration) * 100;
  const timeWarning = timeLeft <= 5;

  return (
    <div className="space-y-6">
      {/* Header with Timer */}
      <Card className={timeWarning ? 'border-red-500 bg-red-50' : ''}>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>{game.title}</CardTitle>
              <p className="text-sm text-gray-600 mt-1">{game.description}</p>
            </div>
            <div className="text-right">
              <div className="text-3xl font-bold text-lime-500">{timeLeft}s</div>
              <div className="text-xs text-gray-500">Time Remaining</div>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {/* Progress Bar */}
          <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
            <div
              className={`h-full transition-all ${
                timeWarning
                  ? 'bg-red-500'
                  : timePercentage > 50
                    ? 'bg-lime-500'
                    : 'bg-yellow-500'
              }`}
              style={{ width: `${timePercentage}%` }}
            />
          </div>
        </CardContent>
      </Card>

      {/* Difficulty Badge */}
      <div className="flex gap-2">
        <Badge
          className={
            game.difficulty === 'easy'
              ? 'bg-green-100 text-green-800'
              : game.difficulty === 'medium'
                ? 'bg-yellow-100 text-yellow-800'
                : 'bg-red-100 text-red-800'
          }
        >
          {game.difficulty.toUpperCase()}
        </Badge>
        <Badge variant="outline">
          +{game.scoringRules.correctPoints} correct | {game.scoringRules.wrongPoints} wrong
        </Badge>
      </div>

      {/* Input Symbols */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Input Code (Top)</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex justify-around items-end gap-4">
            {game.inputSymbols.map((symbol, idx) => (
              <div key={idx} className="text-center">
                <div className="bg-blue-50 p-4 rounded-lg mb-2 border-2 border-blue-300">
                  <SymbolDisplay symbol={symbol} size="lg" />
                </div>
                <div className="font-bold text-lg text-gray-700">{idx + 1}</div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Output Symbols */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Output Code (Bottom)</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex justify-around items-end gap-4">
            {game.outputSymbols.map((symbol, idx) => (
              <div key={idx} className="text-center">
                <div className="bg-green-50 p-4 rounded-lg mb-2 border-2 border-green-300">
                  <SymbolDisplay symbol={symbol} size="lg" />
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Instructions */}
      <Card className="bg-blue-50 border-blue-200">
        <CardContent className="pt-6">
          <h3 className="font-semibold text-blue-900 mb-2">How to Play</h3>
          <p className="text-sm text-blue-800">
            Looking at the input symbols (1, 2, 3, 4) and the output symbols, determine which
            input position each output symbol came from. Select your answer from the options
            below.
          </p>
        </CardContent>
      </Card>

      {/* Answer Options */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Select Your Answer</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-3 mb-4">
            {game.options.map((option) => (
              <button
                key={option}
                onClick={() => handleSelectAnswer(option)}
                disabled={isAnswered || isTimeUp}
                className={`p-4 rounded-lg border-2 transition font-bold text-lg ${
                  selectedAnswer === option
                    ? 'border-lime-500 bg-lime-50 text-lime-700'
                    : isAnswered && option === game.correctOption
                      ? 'border-green-500 bg-green-50 text-green-700'
                      : isAnswered && selectedAnswer === option && selectedAnswer !== game.correctOption
                        ? 'border-red-500 bg-red-50 text-red-700'
                        : 'border-gray-300 hover:border-gray-400 hover:bg-gray-50 text-gray-700'
                } disabled:opacity-75 disabled:cursor-not-allowed`}
              >
                {option}
              </button>
            ))}
          </div>

          {/* Result Message */}
          {isAnswered && (
            <div
              className={`p-4 rounded-lg mb-4 ${
                selectedAnswer === game.correctOption
                  ? 'bg-green-50 border border-green-200'
                  : 'bg-red-50 border border-red-200'
              }`}
            >
              <div className="font-semibold mb-1">
                {selectedAnswer === game.correctOption ? '✓ Correct!' : '✗ Incorrect'}
              </div>
              <div className="text-sm">
                {selectedAnswer === game.correctOption
                  ? `You earned +${game.scoringRules.correctPoints} points!`
                  : `The correct answer was ${game.correctOption}. You earned ${game.scoringRules.wrongPoints} points.`}
              </div>
            </div>
          )}

          {isTimeUp && !isAnswered && (
            <div className="p-4 rounded-lg mb-4 bg-orange-50 border border-orange-200">
              <div className="font-semibold mb-1">⏰ Time's Up!</div>
              <div className="text-sm">
                The correct answer was {game.correctOption}. You earned{' '}
                {game.scoringRules.wrongPoints} points.
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Submit Button */}
      {!isAnswered && !isTimeUp && (
        <Button
          onClick={handleSubmit}
          disabled={!selectedAnswer}
          size="lg"
          className="w-full"
        >
          Submit Answer
        </Button>
      )}

      {(isAnswered || isTimeUp) && (
        <Button
          onClick={() => window.history.back()}
          variant="outline"
          size="lg"
          className="w-full"
        >
          Back
        </Button>
      )}
    </div>
  );
};
