import React, { useMemo, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Plus, ListChecks } from 'lucide-react';
import type { GameTypeId } from '../../constants/gameTypes';
import { getGameTypeConfig } from '../../constants/gameTypes';
import { useMockTestQuestionsStore } from '../../store/mockTestQuestionsStore';
import { HackathonQuestionCard } from '../hackathon/HackathonQuestionCard';
import { AddQuestionModal } from '../hackathon/AddQuestionModal';
import type { HackathonQuestion } from '../../types/hackathon';

interface TestQuestionsSectionProps {
  testId: string;
  allowedTypes: GameTypeId[];
}

export const TestQuestionsSection: React.FC<TestQuestionsSectionProps> = ({
  testId,
  allowedTypes,
}) => {
  const { getQuestions, deleteQuestion } = useMockTestQuestionsStore();
  const questions = getQuestions(testId);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<HackathonQuestion | null>(null);

  const byType = useMemo(() => {
    const map: Partial<Record<GameTypeId, number>> = {};
    for (const q of questions) {
      map[q.type] = (map[q.type] ?? 0) + 1;
    }
    return map;
  }, [questions]);

  const canAdd = allowedTypes.length > 0;

  const openAdd = () => {
    setEditing(null);
    setModalOpen(true);
  };

  const openEdit = (q: HackathonQuestion) => {
    setEditing(q);
    setModalOpen(true);
  };

  return (
    <div className="border-t pt-5 space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h3 className="text-sm font-semibold text-gray-900 flex items-center gap-2">
            <ListChecks className="size-4" />
            Questions in this test
          </h3>
          <p className="text-xs text-muted-foreground mt-0.5">
            Add and edit questions here — answers are editable in the modal.
          </p>
        </div>
        <Button
          type="button"
          size="sm"
          className="gap-1.5"
          disabled={!canAdd}
          onClick={openAdd}
        >
          <Plus className="size-4" />
          Add question
        </Button>
      </div>

      {allowedTypes.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {allowedTypes.map((id) => {
            const cfg = getGameTypeConfig(id);
            const Icon = cfg.icon;
            return (
              <Badge key={id} variant="outline" className={cfg.color}>
                <Icon className="size-3 mr-1" />
                {cfg.shortLabel}: {byType[id] ?? 0}
              </Badge>
            );
          })}
        </div>
      )}

      {questions.length === 0 ? (
        <div className="rounded-lg border border-dashed bg-muted/30 px-4 py-8 text-center text-sm text-muted-foreground">
          No questions yet. Click <strong>Add question</strong> to create or generate one.
        </div>
      ) : (
        <div className="grid gap-3 max-h-64 overflow-y-auto pr-1">
          {questions.map((q) => (
            <HackathonQuestionCard
              key={q.id}
              question={q}
              onEdit={() => openEdit(q)}
              onDelete={() => {
                if (confirm('Remove this question from the test?')) {
                  deleteQuestion(testId, q.id);
                }
              }}
            />
          ))}
        </div>
      )}

      <AddQuestionModal
        open={modalOpen}
        onOpenChange={(open) => {
          setModalOpen(open);
          if (!open) setEditing(null);
        }}
        editQuestion={editing}
        mockTestId={testId}
        allowedTypes={allowedTypes}
        context="mock-test"
      />
    </div>
  );

};
