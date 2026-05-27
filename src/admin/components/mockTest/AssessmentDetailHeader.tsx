import React from 'react';
import { Link } from 'react-router-dom';
import {
  Settings,
  Trash2,
  Eye,
  EyeOff,
  ExternalLink,
  Shield,
  Upload,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { MockTest } from '../../types';
import {
  computeTotalMarks,
  formatAssessmentDate,
} from '../../lib/assessmentQuestionUtils';
import type { HackathonQuestion } from '../../types/hackathon';

interface AssessmentDetailHeaderProps {
  test: MockTest;
  questions: HackathonQuestion[];
  onEdit: () => void;
  onDelete: () => void;
  onTogglePublish: () => void;
  onPreviewExam: () => void;
}

export const AssessmentDetailHeader: React.FC<AssessmentDetailHeaderProps> = ({
  test,
  questions,
  onEdit,
  onDelete,
  onTogglePublish,
  onPreviewExam,
}) => {
  const totalMarks = computeTotalMarks(questions);
  const startDate = formatAssessmentDate(test.createdAt);
  const endDate = formatAssessmentDate(
    new Date(new Date(test.createdAt).getTime() + 7 * 24 * 60 * 60 * 1000).toISOString()
  );

  return (
    <div className="space-y-4 border-b border-gray-200 pb-6">
      <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
        <div className="space-y-3 min-w-0">
          <div className="flex flex-wrap items-baseline gap-2">
            <h1 className="text-2xl font-bold text-gray-900">{test.title}</h1>
            <button
              type="button"
              className="text-sm text-blue-600 hover:underline"
              onClick={() => {}}
            >
              0 submissions
            </button>
          </div>

          <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-sm text-gray-600">
            <span className="flex items-center gap-2">
              <span className="font-medium text-gray-700">Status:</span>
              <span
                className={`inline-flex px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                  test.published
                    ? 'bg-green-100 text-green-800 border border-green-200'
                    : 'bg-gray-100 text-gray-600 border border-gray-200'
                }`}
              >
                {test.published ? 'published' : 'draft'}
              </span>
            </span>
            <span>
              <span className="font-medium text-gray-700">Total Marks:</span> {totalMarks}
            </span>
          </div>

          <div className="flex flex-wrap gap-x-6 gap-y-1 text-sm text-gray-600">
            <span>
              <span className="font-medium text-gray-700">Start Date:</span> {startDate}
            </span>
            <span>
              <span className="font-medium text-gray-700">End Date:</span> {endDate}
            </span>
          </div>

          <div className="flex flex-wrap gap-x-6 gap-y-1 text-sm text-gray-600">
            <span>
              <span className="font-medium text-gray-700">Duration:</span> {test.durationMinutes} min
            </span>
            <span>
              <span className="font-medium text-gray-700">Questions:</span> {questions.length}
            </span>
            {test.category && (
              <span>
                <span className="font-medium text-gray-700">Category:</span> {test.category}
              </span>
            )}
          </div>

          {test.description && (
            <p className="text-sm text-gray-500 max-w-3xl">{test.description}</p>
          )}
        </div>

        <div className="flex flex-wrap gap-2 shrink-0">
          <Button
            type="button"
            variant="outline"
            className="bg-amber-400 hover:bg-amber-500 text-gray-900 border-amber-500 gap-1.5"
            disabled
            title="Coming soon"
          >
            <Upload className="size-4" />
            Bulk Upload Questions
          </Button>
          <Button
            type="button"
            className={
              test.published
                ? 'bg-green-600 hover:bg-green-700 text-white gap-1.5'
                : 'bg-gray-600 hover:bg-gray-700 text-white gap-1.5'
            }
            onClick={onTogglePublish}
          >
            {test.published ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
            {test.published ? 'Unpublish' : 'Publish'}
          </Button>
          <Button
            type="button"
            variant="outline"
            className="border-teal-600 text-teal-700 hover:bg-teal-50 gap-1.5"
            disabled
            title="Coming soon"
          >
            <Shield className="size-4" />
            Proctoring Analysis
          </Button>
          <Button type="button" variant="outline" className="gap-1.5" onClick={onEdit}>
            <Settings className="size-4" />
            Edit
          </Button>
          <Button
            type="button"
            variant="outline"
            className="text-red-600 border-red-200 hover:bg-red-50 gap-1.5"
            onClick={onDelete}
          >
            <Trash2 className="size-4" />
            Delete
          </Button>
          <Button type="button" variant="secondary" className="gap-1.5" onClick={onPreviewExam}>
            <ExternalLink className="size-4" />
            Preview exam
          </Button>
        </div>
      </div>

      <Link to="/admin/mock-tests" className="text-sm text-gray-500 hover:text-gray-800">
        ← Back to all assessments
      </Link>
    </div>
  );
};
