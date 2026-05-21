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
import { usePuzzleBuilderStore } from '../store';
import { PuzzleGrid, SymbolPicker } from '../components/puzzle';
import { AlertCircle, Save, RotateCcw, Grid3x3, Grid2x2, Plus } from 'lucide-react';
import { useMockTestStore } from '../store';
import { questionService } from '../services';
import { SymbolType } from '../types';

export const PuzzleBuilder: React.FC = () => {
  const {
    gridSize,
    grid,
    missingCell,
    options,
    correctAnswer,
    difficulty,
    setGridSize,
    setCell,
    clearCell,
    clearGrid,
    setMissingCell,
    setOptions,
    setCorrectAnswer,
    setDifficulty,
    validateGrid,
    resetPuzzle,
  } = usePuzzleBuilderStore();

  const { mockTests, updateMockTest } = useMockTestStore();
  const [selectedSymbol, setSelectedSymbol] = useState<SymbolType>(null);
  const [selectedCells, setSelectedCells] = useState<{ row: number; col: number }[]>([]);
  const [validationErrors, setValidationErrors] = useState<string[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const [showDialog, setShowDialog] = useState(false);
  const [selectedMockTest, setSelectedMockTest] = useState('');

  const handleGridSizeChange = (size: number) => {
    setGridSize(size);
    setSelectedCells([]);
  };

  const handleCellClick = (row: number, col: number) => {
    setSelectedCells((current) => {
      const alreadySelected = current.some((cell) => cell.row === row && cell.col === col);
      if (alreadySelected) {
        return current.filter((cell) => !(cell.row === row && cell.col === col));
      }
      return [...current, { row, col }];
    });
  };

  const handleSymbolSelect = (symbol: SymbolType) => {
    setSelectedSymbol(symbol);
    if (selectedCells.length > 0) {
      selectedCells.forEach((cell) => {
        setCell(cell.row, cell.col, symbol);
      });
      setSelectedCells([]);
      setSelectedSymbol(null);
    }
  };

  const handlePlaceSymbol = () => {
    if (selectedCells.length > 0 && selectedSymbol) {
      selectedCells.forEach((cell) => {
        setCell(cell.row, cell.col, selectedSymbol);
      });
    }
  };

  const handleClearCell = () => {
    selectedCells.forEach((cell) => {
      clearCell(cell.row, cell.col);
    });
  };

  const handleSetMissingCell = () => {
    if (selectedCells.length === 1) {
      const cell = selectedCells[0];
      setMissingCell(cell.row, cell.col);
    }
  };

  const handleSetCorrectAnswer = () => {
    if (selectedSymbol && selectedSymbol !== null) {
      setCorrectAnswer(selectedSymbol);
    }
  };

  const handleAddOption = () => {
    if (selectedSymbol && !options.includes(selectedSymbol as any)) {
      setOptions([...options, selectedSymbol as any]);
    }
  };

  const handleRemoveOption = (symbol: any) => {
    setOptions(options.filter((opt) => opt !== symbol));
  };

  const handleClearSelection = () => {
    setSelectedCells([]);
  };

  const handleSave = async () => {
    const validation = validateGrid();
    if (!validation.valid) {
      setValidationErrors(validation.errors);
      return;
    }

    if (!selectedMockTest) {
      alert('Please select a mock test');
      return;
    }

    try {
      setIsSaving(true);
      await questionService.createQuestion({
        gridSize,
        grid,
        missingCell: missingCell!,
        options,
        correctAnswer: correctAnswer!,
        difficulty,
        mockTestId: selectedMockTest,
        sequence: 1,
      });

      // Update mock test totalQuestions in Zustand store
      const test = mockTests.find(t => t.id === selectedMockTest);
      if (test) {
        updateMockTest(selectedMockTest, {
          totalQuestions: (test.totalQuestions ?? 0) + 1,
        });
      }

      alert('Question saved successfully!');
      resetPuzzle();
      setSelectedCells([]);
      setSelectedSymbol(null);
      setShowDialog(false);
      setSelectedMockTest('');
      setValidationErrors([]);
    } catch (error) {
      alert('Failed to save question');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h1 className="text-3xl font-bold text-gray-900">Puzzle Builder</h1>
        <p className="text-gray-600">Create and design matrix puzzle questions</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Grid Editor */}
        <div className="lg:col-span-2 space-y-6">
          {/* Grid Size Selection */}
          <Card>
            <CardHeader>
              <CardTitle>Grid Size</CardTitle>
              <CardDescription>Choose the puzzle grid dimensions</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex gap-3 flex-wrap">
                {[3, 4, 5].map((size) => (
                  <Button
                    key={size}
                    variant={gridSize === size ? 'default' : 'outline'}
                    onClick={() => handleGridSizeChange(size)}
                    className="gap-2"
                  >
                    <Grid3x3 size={16} />
                    {size}x{size}
                  </Button>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Grid Display */}
          <Card>
            <CardHeader>
              <CardTitle>Grid Editor</CardTitle>
              <CardDescription>Click cells to select, use symbol picker to place</CardDescription>
            </CardHeader>
            <CardContent className="flex justify-center py-8">
              <PuzzleGrid
                grid={grid}
                missingCell={missingCell}
                selectedCells={selectedCells}
                onCellClick={handleCellClick}
                isInteractive
              />
            </CardContent>
          </Card>

          {/* Symbol Picker */}
          <Card>
            <CardHeader>
              <CardTitle>Symbol Picker</CardTitle>
              <CardDescription>Select and place symbols in the grid</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <SymbolPicker
                selectedSymbol={selectedSymbol as any}
                onSymbolSelect={handleSymbolSelect}
              />

              <div className="flex gap-2 flex-wrap">
                <Button
                  variant="outline"
                  onClick={handleSetMissingCell}
                  disabled={selectedCells.length !== 1}
                >
                  Mark Missing
                </Button>
                <Button
                  variant="destructive"
                  onClick={clearGrid}
                  className="gap-2"
                >
                  <RotateCcw size={16} />
                  Clear Grid
                </Button>
              </div>
              {selectedCells.length > 0 && (
                <p className="text-sm text-gray-500">
                  Selected {selectedCells.length} cell{selectedCells.length > 1 ? 's' : ''}.
                </p>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Configuration Panel */}
        <div className="space-y-6">
          {/* Validation Status */}
          {validationErrors.length > 0 && (
            <Card className="border-red-200 bg-red-50">
              <CardHeader>
                <CardTitle className="text-red-800 flex items-center gap-2">
                  <AlertCircle size={18} />
                  Validation Errors
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  {validationErrors.map((error, idx) => (
                    <li key={idx} className="text-sm text-red-700">
                      • {error}
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          )}

          {/* Missing Cell Info */}
          <Card>
            <CardHeader>
              <CardTitle>Missing Cell</CardTitle>
            </CardHeader>
            <CardContent>
              {missingCell ? (
                <p className="text-sm text-gray-600">
                  Row {missingCell.row + 1}, Col {missingCell.col + 1}
                </p>
              ) : (
                <p className="text-sm text-gray-400">Not marked</p>
              )}
            </CardContent>
          </Card>

          {/* Correct Answer */}
          <Card>
            <CardHeader>
              <CardTitle>Correct Answer</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <SymbolPicker
                selectedSymbol={correctAnswer}
                onSymbolSelect={handleSymbolSelect}
              />
              <Button
                onClick={handleSetCorrectAnswer}
                disabled={!selectedSymbol}
                className="w-full"
              >
                Set Answer
              </Button>
            </CardContent>
          </Card>

          {/* Options */}
          <Card>
            <CardHeader>
              <CardTitle>Answer Options</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="space-y-2 max-h-40 overflow-y-auto">
                {options.map((opt, idx) => (
                  <div key={idx} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                    <span className="text-sm capitalize font-medium">{opt}</span>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleRemoveOption(opt)}
                      className="text-red-600 hover:text-red-700"
                    >
                      ×
                    </Button>
                  </div>
                ))}
              </div>
              <Button
                onClick={handleAddOption}
                disabled={!selectedSymbol}
                className="w-full gap-2"
                variant="outline"
              >
                <Plus size={16} />
                Add Option
              </Button>
            </CardContent>
          </Card>

          {/* Difficulty */}
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

          {/* Save Button */}
          <Button
            onClick={() => setShowDialog(true)}
            className="w-full gap-2"
            size="lg"
          >
            <Save size={18} />
            Save Question
          </Button>

          <Button
            onClick={resetPuzzle}
            variant="outline"
            className="w-full"
          >
            Reset All
          </Button>
        </div>
      </div>

      {/* Save Dialog */}
      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Save Puzzle Question</DialogTitle>
            <DialogDescription>Select a mock test to add this question</DialogDescription>
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
                    {test.title}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex justify-end gap-3">
              <Button variant="outline" onClick={() => setShowDialog(false)}>
                Cancel
              </Button>
              <Button onClick={handleSave} disabled={isSaving || !selectedMockTest}>
                {isSaving ? 'Saving...' : 'Save Question'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};
