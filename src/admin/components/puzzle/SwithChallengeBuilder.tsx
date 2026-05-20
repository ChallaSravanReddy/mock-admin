import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { AlertCircle, Save, RotateCcw } from 'lucide-react';
import { AVAILABLE_SYMBOLS, SymbolCode, SwithChallengeGame } from '../../types/swithChallenge';
import { SymbolDisplay } from './SymbolDisplay';

interface SwithChallengeBuilderProps {
  game?: SwithChallengeGame | null;
  onSave: (gameData: {
    title: string;
    description: string;
    difficulty: 'easy' | 'medium' | 'hard';
    timeDuration: number;
    inputSymbols: SymbolCode[];
    outputSymbols: SymbolCode[];
    options: string[];
    correctOption: string;
    correctPoints: number;
    wrongPoints: number;
  }) => void;
  onCancel: () => void;
}

export const SwithChallengeBuilder: React.FC<SwithChallengeBuilderProps> = ({
  game,
  onSave,
  onCancel,
}) => {
  const [title, setTitle] = useState(game?.title || '');
  const [description, setDescription] = useState(game?.description || '');
  const [difficulty, setDifficulty] = useState<'easy' | 'medium' | 'hard'>(
    game?.difficulty || 'medium'
  );
  const [timeDuration, setTimeDuration] = useState(game?.timeDuration || 20);
  const [inputSymbols, setInputSymbols] = useState<SymbolCode[]>(
    game?.inputSymbols || ['circle', 'square', 'triangle', 'cross']
  );
  const [outputSymbols, setOutputSymbols] = useState<SymbolCode[]>(
    game?.outputSymbols || ['triangle', 'square', 'cross', 'circle']
  );
  const [options, setOptions] = useState<string[]>(game?.options || ['', '', '', '']);
  const [correctOption, setCorrectOption] = useState(game?.correctOption || '');
  const [correctPoints, setCorrectPoints] = useState(game?.scoringRules.correctPoints || 3);
  const [wrongPoints, setWrongPoints] = useState(game?.scoringRules.wrongPoints || -1);
  const [errors, setErrors] = useState<string[]>([]);

  // Auto-calculate correct answer code based on input and output
  const calculateAnswerCode = () => {
    const code = outputSymbols
      .map((symbol) => (inputSymbols.indexOf(symbol) + 1).toString())
      .join('');
    return code;
  };

  const handleAddInputSymbol = (symbol: SymbolCode) => {
    if (inputSymbols.length < 4) {
      setInputSymbols([...inputSymbols, symbol]);
    }
  };

  const handleRemoveInputSymbol = (index: number) => {
    setInputSymbols(inputSymbols.filter((_, i) => i !== index));
  };

  const handleAddOutputSymbol = (symbol: SymbolCode) => {
    if (outputSymbols.length < 4) {
      setOutputSymbols([...outputSymbols, symbol]);
    }
  };

  const handleRemoveOutputSymbol = (index: number) => {
    setOutputSymbols(outputSymbols.filter((_, i) => i !== index));
  };

  const handleUpdateOption = (index: number, value: string) => {
    const newOptions = [...options];
    newOptions[index] = value;
    setOptions(newOptions);
  };

  const validate = (): boolean => {
    const newErrors: string[] = [];

    if (!title.trim()) newErrors.push('Title is required');
    if (!description.trim()) newErrors.push('Description is required');
    if (inputSymbols.length < 4 || inputSymbols.length > 8) newErrors.push('Must have 4 to 8 input symbols');
    if (outputSymbols.length < 4 || outputSymbols.length > 8) newErrors.push('Must have 4 to 8 output symbols');
    if (options.some((opt) => !opt.trim())) newErrors.push('All options must be filled');
    if (!correctOption) newErrors.push('Correct option must be selected');
    if (timeDuration < 10 || timeDuration > 60) newErrors.push('Time duration must be between 10 and 60 seconds');

    setErrors(newErrors);
    return newErrors.length === 0;
  };

  const handleSave = () => {
    if (validate()) {
      onSave({
        title,
        description,
        difficulty,
        timeDuration,
        inputSymbols,
        outputSymbols,
        options,
        correctOption,
        correctPoints,
        wrongPoints,
      });
    }
  };

  const handleReset = () => {
    if (game) {
      setTitle(game.title);
      setDescription(game.description);
      setDifficulty(game.difficulty);
      setTimeDuration(game.timeDuration);
      setInputSymbols(game.inputSymbols);
      setOutputSymbols(game.outputSymbols);
      setOptions(game.options);
      setCorrectOption(game.correctOption);
      setCorrectPoints(game.scoringRules.correctPoints);
      setWrongPoints(game.scoringRules.wrongPoints);
    } else {
      setTitle('');
      setDescription('');
      setDifficulty('medium');
      setTimeDuration(20);
      setInputSymbols(['circle', 'square', 'triangle', 'cross']);
      setOutputSymbols(['triangle', 'square', 'cross', 'circle']);
      setOptions(['', '', '', '']);
      setCorrectOption('');
      setCorrectPoints(3);
      setWrongPoints(-1);
    }
    setErrors([]);
  };

  return (
    <div className="space-y-6">
      {/* Errors */}
      {errors.length > 0 && (
        <Card className="border-red-500 bg-red-50">
          <CardContent className="pt-6">
            <div className="flex gap-2">
              <AlertCircle className="h-5 w-5 text-red-500 flex-shrink-0" />
              <div className="text-sm text-red-700">
                {errors.map((error, i) => (
                  <div key={i}>{error}</div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Basic Info */}
      <Card>
        <CardHeader>
          <CardTitle>Basic Information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Title</label>
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g., Symbol Order Challenge 1"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Description</label>
            <Input
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe the challenge..."
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Difficulty</label>
              <select
                value={difficulty}
                onChange={(e) => setDifficulty(e.target.value as any)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
              >
                <option value="easy">Easy</option>
                <option value="medium">Medium</option>
                <option value="hard">Hard</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Time Duration (seconds)</label>
              <Input
                type="number"
                value={timeDuration}
                onChange={(e) => setTimeDuration(Number(e.target.value))}
                min="10"
                max="60"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Input Symbols */}
      <Card>
        <CardHeader>
          <CardTitle>Input Symbols (Top Row)</CardTitle>
          <CardDescription>Add 4-8 symbols for input</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2 flex-wrap mb-4">
            {inputSymbols.map((symbol, idx) => (
              <div key={idx} className="relative">
                <div className="p-3 border-2 border-blue-400 rounded-lg bg-white">
                  <SymbolDisplay symbol={symbol} size="md" />
                </div>
                {inputSymbols.length > 4 && (
                  <button
                    onClick={() => handleRemoveInputSymbol(idx)}
                    className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-6 h-6 text-xs font-bold hover:bg-red-600"
                  >
                    ×
                  </button>
                )}
                <div className="text-center text-xs font-semibold mt-1">{idx + 1}</div>
              </div>
            ))}
          </div>

          {inputSymbols.length < 8 && (
            <div className="border-t pt-4">
              <label className="block text-sm font-medium mb-2">Add More Shapes</label>
              <div className="flex gap-2 flex-wrap">
                {AVAILABLE_SYMBOLS.filter((s) => !inputSymbols.includes(s)).map((symbol) => (
                  <button
                    key={symbol}
                    onClick={() => handleAddInputSymbol(symbol)}
                    className="p-3 border-2 border-dashed border-blue-300 rounded-lg hover:bg-blue-50 transition"
                  >
                    <SymbolDisplay symbol={symbol} size="md" />
                  </button>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Output Symbols */}
      <Card>
        <CardHeader>
          <CardTitle>Output Symbols (Bottom Row)</CardTitle>
          <CardDescription>
            Arrange symbols in the output order. Must match input symbol count (4-8).
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2 flex-wrap mb-4">
            {outputSymbols.map((symbol, idx) => (
              <div key={idx} className="relative">
                <div className="p-3 border-2 border-green-400 rounded-lg bg-white">
                  <SymbolDisplay symbol={symbol} size="md" />
                </div>
                {outputSymbols.length > 4 && (
                  <button
                    onClick={() => handleRemoveOutputSymbol(idx)}
                    className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-6 h-6 text-xs font-bold hover:bg-red-600"
                  >
                    ×
                  </button>
                )}
                <div className="text-center text-xs font-semibold mt-1">
                  {inputSymbols.indexOf(symbol) + 1}
                </div>
              </div>
            ))}
          </div>

          {outputSymbols.length < inputSymbols.length && outputSymbols.length < 8 && (
            <div className="border-t pt-4">
              <label className="block text-sm font-medium mb-2">Add More Shapes</label>
              <div className="flex gap-2 flex-wrap">
                {AVAILABLE_SYMBOLS.filter((s) => !outputSymbols.includes(s)).map((symbol) => (
                  <button
                    key={symbol}
                    onClick={() => handleAddOutputSymbol(symbol)}
                    className="p-3 border-2 border-dashed border-green-300 rounded-lg hover:bg-green-50 transition"
                  >
                    <SymbolDisplay symbol={symbol} size="md" />
                  </button>
                ))}
              </div>
            </div>
          )}

          {outputSymbols.length >= 4 && (
            <div className="bg-blue-50 p-3 rounded text-sm border border-blue-200">
              <strong className="text-blue-900">Calculated Answer Code:</strong> 
              <span className="text-lg font-bold text-blue-900 ml-2">{calculateAnswerCode()}</span>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Answer Options */}
      <Card>
        <CardHeader>
          <CardTitle>Answer Options</CardTitle>
          <CardDescription>
            Enter 4 different answer codes. One should be the correct answer.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {options.map((option, idx) => (
            <div key={idx}>
              <label className="block text-sm font-medium mb-1">Option {idx + 1}</label>
              <Input
                value={option}
                onChange={(e) => handleUpdateOption(idx, e.target.value)}
                placeholder="e.g., 3142"
                maxLength={4}
              />
              <button
                onClick={() => {
                  if (option) {
                    setCorrectOption(option);
                  }
                }}
                className={`mt-2 text-sm px-3 py-1 rounded border ${
                  correctOption === option
                    ? 'bg-green-500 text-white border-green-600'
                    : 'border-gray-300 hover:bg-gray-100'
                }`}
              >
                {correctOption === option ? '✓ Correct Answer' : 'Set as Correct'}
              </button>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Scoring Rules */}
      <Card>
        <CardHeader>
          <CardTitle>Scoring Rules</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Points for Correct Answer</label>
              <Input
                type="number"
                value={correctPoints}
                onChange={(e) => setCorrectPoints(Number(e.target.value))}
                min="0"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Points for Wrong Answer</label>
              <Input
                type="number"
                value={wrongPoints}
                onChange={(e) => setWrongPoints(Number(e.target.value))}
                max="0"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Actions */}
      <div className="flex gap-2 justify-end">
        <Button variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button variant="outline" onClick={handleReset}>
          <RotateCcw className="w-4 h-4 mr-2" />
          Reset
        </Button>
        <Button onClick={handleSave}>
          <Save className="w-4 h-4 mr-2" />
          {game ? 'Update Game' : 'Create Game'}
        </Button>
      </div>
    </div>
  );
};
