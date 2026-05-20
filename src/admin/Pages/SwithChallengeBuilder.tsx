import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { AlertCircle, Save, RotateCcw, Plus, Trash2, Check } from 'lucide-react';
import { AVAILABLE_SYMBOLS, SymbolCode } from '../types/swithChallenge';
import { SymbolDisplay } from '../components/puzzle/SymbolDisplay';
import { useMockTestStore } from '../store';
import { swithChallengeService } from '../services';

export const SwithChallengeBuilder: React.FC = () => {
  const { mockTests, updateMockTest } = useMockTestStore();

  // Input Symbols (Top)
  const [inputSymbols, setInputSymbols] = useState<SymbolCode[]>([
    'circle',
    'square',
    'triangle',
    'cross',
  ]);
  const [selectedInputIndex, setSelectedInputIndex] = useState<number | null>(null);

  // Output Symbols (Bottom)
  const [outputSymbols, setOutputSymbols] = useState<SymbolCode[]>([
    'triangle',
    'square',
    'cross',
    'circle',
  ]);
  const [selectedOutputIndex, setSelectedOutputIndex] = useState<number | null>(null);

  // Answer Options
  const [options, setOptions] = useState<string[]>(['3142', '2413', '4321', '1432']);
  const [correctOption, setCorrectOption] = useState('3142');

  // Game Settings
  const [difficulty, setDifficulty] = useState<'easy' | 'medium' | 'hard'>('medium');
  const [timeDuration, setTimeDuration] = useState(20);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');

  // UI State
  const [validationErrors, setValidationErrors] = useState<string[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const [showDialog, setShowDialog] = useState(false);
  const [selectedMockTest, setSelectedMockTest] = useState('');

  // Auto-calculate answer code
  const calculateAnswerCode = () => {
    return outputSymbols
      .map((symbol) => (inputSymbols.indexOf(symbol) + 1).toString())
      .join('');
  };

  const handleInputSymbolSelect = (index: number) => {
    setSelectedInputIndex(selectedInputIndex === index ? null : index);
  };

  const handleOutputSymbolSelect = (index: number) => {
    setSelectedOutputIndex(selectedOutputIndex === index ? null : index);
  };

  const handleSwapInputSymbols = (symbol: SymbolCode) => {
    if (selectedInputIndex !== null) {
      const newSymbols = [...inputSymbols];
      newSymbols[selectedInputIndex] = symbol;
      setInputSymbols(newSymbols);
      setSelectedInputIndex(null);
    }
  };

  const handleSwapOutputSymbols = (symbol: SymbolCode) => {
    if (selectedOutputIndex !== null) {
      const newSymbols = [...outputSymbols];
      newSymbols[selectedOutputIndex] = symbol;
      setOutputSymbols(newSymbols);
      setSelectedOutputIndex(null);
    }
  };

  const handleRemoveInputSymbol = (index: number) => {
    const newSymbols = inputSymbols.filter((_, i) => i !== index);
    setInputSymbols(newSymbols);
    setSelectedInputIndex(null);
  };

  const handleRemoveOutputSymbol = (index: number) => {
    const newSymbols = outputSymbols.filter((_, i) => i !== index);
    setOutputSymbols(newSymbols);
    setSelectedOutputIndex(null);
  };

  const handleUpdateOption = (index: number, value: string) => {
    const newOptions = [...options];
    newOptions[index] = value;
    setOptions(newOptions);
  };

  const handleRemoveOption = (index: number) => {
    const newOptions = options.filter((_, i) => i !== index);
    setOptions(newOptions);
    if (correctOption === options[index]) {
      setCorrectOption('');
    }
  };

  const handleAddOption = () => {
    if (options.length < 6) {
      setOptions([...options, '']);
    }
  };

  const validate = (): boolean => {
    const errors: string[] = [];

    if (!title.trim()) errors.push('Title is required');
    if (!description.trim()) errors.push('Description is required');
    if (inputSymbols.length < 4 || inputSymbols.length > 8) errors.push('Must have 4 to 8 input symbols');
    if (outputSymbols.length < 4 || outputSymbols.length > 8) errors.push('Must have 4 to 8 output symbols');
    if (options.some((opt) => !opt.trim())) errors.push('All options must be filled');
    if (!correctOption) errors.push('Correct option must be selected');
    if (timeDuration < 10 || timeDuration > 60)
      errors.push('Time duration must be between 10 and 60 seconds');

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
      await swithChallengeService.createGame({
        title,
        description,
        difficulty,
        timeDuration,
        inputSymbols,
        outputSymbols,
        options,
        correctOption,
        mockTestId: selectedMockTest,
      });

      // Update mock test totalQuestions in Zustand store
      const test = mockTests.find((t) => t.id === selectedMockTest);
      if (test) {
        updateMockTest(selectedMockTest, {
          totalQuestions: (test.totalQuestions ?? 0) + 1,
        });
      }

      alert('Game saved successfully!');
      resetForm();
      setShowDialog(false);
      setSelectedMockTest('');
    } catch (error) {
      alert('Failed to save game');
    } finally {
      setIsSaving(false);
    }
  };

  const resetForm = () => {
    setInputSymbols(['circle', 'square', 'triangle', 'cross']);
    setOutputSymbols(['triangle', 'square', 'cross', 'circle']);
    setOptions(['3142', '2413', '4321', '1432']);
    setCorrectOption('3142');
    setTitle('');
    setDescription('');
    setDifficulty('medium');
    setTimeDuration(20);
    setSelectedInputIndex(null);
    setSelectedOutputIndex(null);
    setValidationErrors([]);
  };

  const availableSymbols = AVAILABLE_SYMBOLS.filter(
    (s) => !inputSymbols.includes(s) || selectedInputIndex !== null
  );

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h1 className="text-3xl font-bold text-gray-900">Swith Challenge Builder</h1>
        <p className="text-gray-600">Create symbol ordering puzzle games</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Editor */}
        <div className="lg:col-span-2 space-y-6">
          {/* Validation Errors */}
          {validationErrors.length > 0 && (
            <Card className="border-red-500 bg-red-50">
              <CardContent className="pt-6">
                <div className="flex gap-3">
                  <AlertCircle className="h-5 w-5 text-red-500 flex-shrink-0 mt-0.5" />
                  <div className="text-sm text-red-700 space-y-1">
                    {validationErrors.map((error, i) => (
                      <div key={i}>{error}</div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Game Info */}
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
                  placeholder="e.g., Symbol Order Challenge 1"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Description</label>
                <input
                  type="text"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Describe the challenge..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </CardContent>
          </Card>

          {/* Input Symbols (Top Row) */}
          <Card>
            <CardHeader>
              <CardTitle>Input Symbols (Top Row)</CardTitle>
              <CardDescription>Add 4-8 symbols for input</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-3 flex-wrap justify-start">
                {inputSymbols.map((symbol, idx) => (
                  <button
                    key={idx}
                    onClick={() => handleInputSymbolSelect(idx)}
                    className={`p-3 rounded-lg border-2 transition ${
                      selectedInputIndex === idx
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-blue-300 hover:border-blue-400'
                    }`}
                  >
                    <div className="mb-2">
                      <SymbolDisplay symbol={symbol} size="lg" />
                    </div>
                    <div className="text-center font-bold text-sm">{idx + 1}</div>
                    {inputSymbols.length > 4 && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleRemoveInputSymbol(idx);
                        }}
                        className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-5 h-5 text-xs font-bold hover:bg-red-600"
                      >
                        ×
                      </button>
                    )}
                  </button>
                ))}
              </div>

              <div className="border-t pt-4 space-y-3">
                {selectedInputIndex !== null && inputSymbols.length > 0 && (
                  <div>
                    <label className="block text-sm font-medium mb-2">Change Selected Symbol</label>
                    <div className="flex gap-2 flex-wrap">
                      {AVAILABLE_SYMBOLS.map((symbol) => (
                        <button
                          key={symbol}
                          onClick={() => handleSwapInputSymbols(symbol)}
                          className="p-2 border-2 border-gray-300 rounded hover:bg-gray-100"
                        >
                          <SymbolDisplay symbol={symbol} size="md" />
                        </button>
                      ))}
                    </div>
                  </div>
                )}
                {inputSymbols.length < 8 && (
                  <div>
                    <label className="block text-sm font-medium mb-2">Add More Shapes</label>
                    <div className="flex gap-2 flex-wrap">
                      {AVAILABLE_SYMBOLS.filter((s) => !inputSymbols.includes(s)).map((symbol) => (
                        <button
                          key={symbol}
                          onClick={() => setInputSymbols([...inputSymbols, symbol])}
                          className="p-2 border-2 border-dashed border-blue-300 rounded hover:bg-blue-50 transition"
                        >
                          <SymbolDisplay symbol={symbol} size="md" />
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Output Symbols (Bottom Row) */}
          <Card>
            <CardHeader>
              <CardTitle>Output Symbols (Bottom Row)</CardTitle>
              <CardDescription>Rearranged order (must match input symbol count)</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-3 flex-wrap justify-start">
                {outputSymbols.map((symbol, idx) => {
                  const inputIndex = inputSymbols.indexOf(symbol);
                  return (
                    <button
                      key={idx}
                      onClick={() => handleOutputSymbolSelect(idx)}
                      className={`p-3 rounded-lg border-2 transition relative ${
                        selectedOutputIndex === idx
                          ? 'border-green-500 bg-green-50'
                          : 'border-green-300 hover:border-green-400'
                      }`}
                    >
                      <div className="mb-2">
                        <SymbolDisplay symbol={symbol} size="lg" />
                      </div>
                      <div className="text-center font-bold text-sm text-gray-600">
                        {inputIndex + 1}
                      </div>
                      {outputSymbols.length > 4 && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleRemoveOutputSymbol(idx);
                          }}
                          className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-5 h-5 text-xs font-bold hover:bg-red-600"
                        >
                          ×
                        </button>
                      )}
                    </button>
                  );
                })}
              </div>

              <div className="border-t pt-4 space-y-3">
                {selectedOutputIndex !== null && outputSymbols.length > 0 && (
                  <div>
                    <label className="block text-sm font-medium mb-2">Change Selected Symbol</label>
                    <div className="flex gap-2 flex-wrap">
                      {AVAILABLE_SYMBOLS.map((symbol) => (
                        <button
                          key={symbol}
                          onClick={() => handleSwapOutputSymbols(symbol)}
                          className="p-2 border-2 border-gray-300 rounded hover:bg-gray-100"
                        >
                          <SymbolDisplay symbol={symbol} size="md" />
                        </button>
                      ))}
                    </div>
                  </div>
                )}
                {outputSymbols.length < inputSymbols.length && outputSymbols.length < 8 && (
                  <div>
                    <label className="block text-sm font-medium mb-2">Add More Shapes</label>
                    <div className="flex gap-2 flex-wrap">
                      {AVAILABLE_SYMBOLS.filter((s) => !outputSymbols.includes(s)).map((symbol) => (
                        <button
                          key={symbol}
                          onClick={() => setOutputSymbols([...outputSymbols, symbol])}
                          className="p-2 border-2 border-dashed border-green-300 rounded hover:bg-green-50 transition"
                        >
                          <SymbolDisplay symbol={symbol} size="md" />
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {outputSymbols.length >= 4 && (
                <div className="bg-green-50 p-3 rounded border border-green-200">
                  <div className="text-sm font-medium text-green-900">
                    Answer Code: <span className="text-2xl font-bold">{calculateAnswerCode()}</span>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Answer Options */}
          <Card>
            <CardHeader>
              <CardTitle>Answer Options</CardTitle>
              <CardDescription>Create 4 different answer codes</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {options.map((option, idx) => (
                <div key={idx} className="flex gap-2">
                  <input
                    type="text"
                    value={option}
                    onChange={(e) => handleUpdateOption(idx, e.target.value)}
                    placeholder="e.g., 3142"
                    maxLength={4}
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <Button
                    variant={correctOption === option ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setCorrectOption(option)}
                    className="gap-1"
                  >
                    <Check size={16} />
                    {correctOption === option ? 'Correct' : 'Set'}
                  </Button>
                  {options.length > 2 && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleRemoveOption(idx)}
                      className="text-red-600 hover:text-red-700"
                    >
                      <Trash2 size={16} />
                    </Button>
                  )}
                </div>
              ))}
              {options.length < 6 && (
                <Button
                  onClick={handleAddOption}
                  variant="outline"
                  className="w-full gap-2"
                >
                  <Plus size={16} />
                  Add Option
                </Button>
              )}
            </CardContent>
          </Card>

          {/* Difficulty & Settings */}
          <Card>
            <CardHeader>
              <CardTitle>Settings</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">Difficulty</label>
                <select
                  value={difficulty}
                  onChange={(e) => setDifficulty(e.target.value as any)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="easy">Easy</option>
                  <option value="medium">Medium</option>
                  <option value="hard">Hard</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">
                  Time Duration (seconds)
                </label>
                <input
                  type="number"
                  value={timeDuration}
                  onChange={(e) => setTimeDuration(Number(e.target.value))}
                  min="10"
                  max="60"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </CardContent>
          </Card>

          {/* Action Buttons */}
          <Button onClick={() => setShowDialog(true)} className="w-full gap-2 h-10" size="lg">
            <Save size={18} />
            Save Game
          </Button>

          <Button onClick={resetForm} variant="outline" className="w-full">
            Reset All
          </Button>
        </div>
      </div>

      {/* Save Dialog */}
      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Save Swith Challenge</DialogTitle>
            <DialogDescription>
              Select a mock test to add this game question
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium text-gray-700">Mock Test</label>
              <select
                value={selectedMockTest}
                onChange={(e) => setSelectedMockTest(e.target.value)}
                className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">-- Select a test --</option>
                {mockTests.map((test) => (
                  <option key={test.id} value={test.id}>
                    {test.title} ({test.totalQuestions} questions)
                  </option>
                ))}
              </select>
            </div>

            <div className="flex gap-2 justify-end">
              <Button variant="outline" onClick={() => setShowDialog(false)}>
                Cancel
              </Button>
              <Button
                onClick={handleSave}
                disabled={isSaving || !selectedMockTest}
              >
                {isSaving ? 'Saving...' : 'Save'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};
