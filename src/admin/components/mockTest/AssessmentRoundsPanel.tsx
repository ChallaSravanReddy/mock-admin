import React, { useMemo, useState } from 'react';
import { Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { GameTypeId } from '../../constants/gameTypes';
import { getGameTypeConfig } from '../../constants/gameTypes';
import { useMockTestQuestionsStore } from '../../store/mockTestQuestionsStore';
import { groupQuestionsIntoRounds } from '../../lib/assessmentQuestionUtils';
import { AssessmentQuestionCard } from './AssessmentQuestionCard';
import { AddQuestionModal } from '../hackathon/AddQuestionModal';
import type { HackathonQuestion } from '../../types/hackathon';

interface AssessmentRoundsPanelProps {
  testId: string;
  enabledTypes: GameTypeId[];
  onQuestionsChange?: (count: number) => void;
}

export const AssessmentRoundsPanel: React.FC<AssessmentRoundsPanelProps> = ({
  testId,
  enabledTypes,
  onQuestionsChange,
}) => {
  const questions = useMockTestQuestionsStore((s) => s.byTestId[testId] ?? []);
  const deleteQuestion = useMockTestQuestionsStore((s) => s.deleteQuestion);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<HackathonQuestion | null>(null);

  const rounds = useMemo(
    () => groupQuestionsIntoRounds(questions, enabledTypes),
    [questions, enabledTypes]
  );

  React.useEffect(() => {
    onQuestionsChange?.(questions.length);
  }, [questions.length, onQuestionsChange]);

  const openAdd = () => {
    setEditing(null);
    setModalOpen(true);
  };

  const openEdit = (q: HackathonQuestion) => {
    setEditing(q);
    setModalOpen(true);
  };

  const handleDelete = (q: HackathonQuestion) => {
    if (confirm('Remove this question from the assessment?')) {
      deleteQuestion(testId, q.id);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-gray-200 pb-3">
        <h2 className="text-lg font-semibold text-gray-900">Questions</h2>
        <Button
          type="button"
          className="bg-red-600 hover:bg-red-700 text-white gap-1.5"
          disabled={enabledTypes.length === 0}
          onClick={openAdd}
        >
          <Plus className="size-4" />
          Add Questions
        </Button>
      </div>

      {enabledTypes.length === 0 && (
        <p className="text-sm text-amber-700 bg-amber-50 border border-amber-200 rounded-lg p-4">
          No game types enabled for this assessment. Edit the assessment and select at least one round type.
        </p>
      )}

      {enabledTypes.length > 0 && questions.length === 0 && (
        <div className="rounded-lg border border-dashed border-gray-300 bg-gray-50 py-12 text-center text-gray-500">
          No questions yet. Click <strong className="text-gray-700">+ Add Questions</strong> to generate or
          create questions for each round.
        </div>
      )}

      {rounds.map((round) => {
        const cfg = getGameTypeConfig(round.type);
        const Icon = cfg.icon;
        return (
          <section key={round.type} className="space-y-3">
            <div className="flex flex-wrap items-center gap-2">
              <span
                className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md border text-xs font-semibold ${cfg.color}`}
              >
                <Icon className="size-3.5" />
                Round {round.roundNumber}
              </span>
              <span className="text-sm font-medium text-gray-700">{round.label}</span>
              <span className="text-xs text-gray-400">
                ({round.questions.length} question{round.questions.length !== 1 ? 's' : ''})
              </span>
            </div>

            {round.questions.length === 0 ? (
              <p className="text-sm text-gray-400 italic pl-1">No questions in this round yet.</p>
            ) : (
              <div className="space-y-3">
                {round.questions.map((q, i) => (
                  <AssessmentQuestionCard
                    key={q.id}
                    question={q}
                    index={i}
                    onEdit={() => openEdit(q)}
                    onDelete={() => handleDelete(q)}
                  />
                ))}
              </div>
            )}
          </section>
        );
      })}

      <AddQuestionModal
        open={modalOpen}
        onOpenChange={(open) => {
          setModalOpen(open);
          if (!open) setEditing(null);
        }}
        editQuestion={editing}
        mockTestId={testId}
        allowedTypes={enabledTypes}
        context="mock-test"
      />
    </div>
  );
};
