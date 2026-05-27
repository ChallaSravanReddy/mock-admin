import React from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

interface MockTestOption {
  id: string;
  title: string;
}

interface SaveToMockTestDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description: string;
  mockTests: MockTestOption[];
  selectedMockTest: string;
  onSelectedMockTestChange: (id: string) => void;
  onSave: () => void;
  isSaving?: boolean;
  saveLabel?: string;
  focusRingClass?: string;
}

export const SaveToMockTestDialog: React.FC<SaveToMockTestDialogProps> = ({
  open,
  onOpenChange,
  title,
  description,
  mockTests,
  selectedMockTest,
  onSelectedMockTestChange,
  onSave,
  isSaving = false,
  saveLabel = 'Save',
  focusRingClass = 'focus:ring-blue-500',
}) => (
  <Dialog open={open} onOpenChange={onOpenChange}>
    <DialogContent>
      <DialogHeader>
        <DialogTitle>{title}</DialogTitle>
        <DialogDescription>{description}</DialogDescription>
      </DialogHeader>
      <div className="space-y-4">
        <div>
          <label className="text-sm font-medium text-gray-700">Mock Test</label>
          <select
            value={selectedMockTest}
            onChange={(e) => onSelectedMockTestChange(e.target.value)}
            className={`w-full mt-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 ${focusRingClass}`}
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
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={onSave} disabled={isSaving || !selectedMockTest}>
            {isSaving ? 'Saving…' : saveLabel}
          </Button>
        </div>
      </div>
    </DialogContent>
  </Dialog>
);
