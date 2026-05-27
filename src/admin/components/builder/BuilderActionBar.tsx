import React from 'react';
import { Save, RotateCcw, Wand2 } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface BuilderActionBarProps {
  onSave: () => void;
  onReset: () => void;
  onAutoGenerate?: () => void;
  saveLabel?: string;
  autoGenerateLabel?: string;
  showAutoGenerate?: boolean;
}

export const BuilderActionBar: React.FC<BuilderActionBarProps> = ({
  onSave,
  onReset,
  onAutoGenerate,
  saveLabel = 'Save Game',
  autoGenerateLabel = 'Auto Generate Challenge',
  showAutoGenerate = true,
}) => (
  <div className="space-y-2 pt-2 border-t border-gray-200">
    {showAutoGenerate && onAutoGenerate && (
      <Button
        type="button"
        onClick={onAutoGenerate}
        variant="outline"
        className="w-full gap-2 h-10 border-blue-300 text-blue-800 hover:bg-blue-50"
      >
        <Wand2 size={18} />
        {autoGenerateLabel}
      </Button>
    )}
    <Button type="button" onClick={onReset} variant="outline" className="w-full gap-2 h-10">
      <RotateCcw size={16} />
      Reset All
    </Button>
    <Button type="button" onClick={onSave} className="w-full gap-2 h-11" size="lg">
      <Save size={18} />
      {saveLabel}
    </Button>
  </div>
);
