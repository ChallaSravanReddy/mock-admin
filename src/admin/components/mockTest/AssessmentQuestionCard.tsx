import React from 'react';
import { GripVertical, Pencil, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { HackathonQuestion } from '../../types/hackathon';
import { getQuestionMarks, getQuestionPreviewText, getQuestionSubDomain } from '../../lib/assessmentQuestionUtils';

interface AssessmentQuestionCardProps {
  question: HackathonQuestion;
  index: number;
  onEdit: () => void;
  onDelete: () => void;
}

export const AssessmentQuestionCard: React.FC<AssessmentQuestionCardProps> = ({
  question,
  index,
  onEdit,
  onDelete,
}) => {
  const marks = getQuestionMarks(question);
  const subDomain = getQuestionSubDomain(question);

  return (
    <div className="flex items-stretch gap-0 rounded-lg border border-gray-200 bg-[#f8f9fb] shadow-sm overflow-hidden">
      <div className="flex items-center justify-center px-2 text-gray-400 border-r border-gray-200 bg-white/60 cursor-grab active:cursor-grabbing">
        <GripVertical className="size-5" />
      </div>

      <div className="flex-1 min-w-0 py-4 px-4">
        <p className="text-[15px] leading-relaxed text-gray-800">
          <span className="font-medium text-gray-500 mr-2">Q{index + 1}.</span>
          {getQuestionPreviewText(question)}
        </p>
        <p className="mt-2 text-sm text-gray-500">
          <span className="font-medium text-gray-600">Marks:</span> {marks}
          <span className="mx-2 text-gray-300">|</span>
          <span className="font-medium text-gray-600">Sub-domain:</span> {subDomain}
        </p>
      </div>

      <div className="flex flex-col items-center justify-center gap-1 px-3 border-l border-gray-200 bg-white/40">
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="text-blue-600 hover:text-blue-700 hover:bg-blue-50"
          onClick={onEdit}
          aria-label="Edit question"
        >
          <Pencil className="size-4" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="text-red-600 hover:text-red-700 hover:bg-red-50"
          onClick={onDelete}
          aria-label="Delete question"
        >
          <Trash2 className="size-4" />
        </Button>
      </div>
    </div>
  );
};
