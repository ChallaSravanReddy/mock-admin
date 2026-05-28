import React, { useCallback, useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import { mockTestService } from '../services';
import { useMockTestStore } from '../store';
import { useMockTestQuestionsStore } from '../store/mockTestQuestionsStore';
import type { HackathonQuestion } from '../types/hackathon';
import type { GameTypeId } from '../constants/gameTypes';
import { AssessmentDetailHeader } from '../components/mockTest/AssessmentDetailHeader';
import { AssessmentRoundsPanel } from '../components/mockTest/AssessmentRoundsPanel';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useForm } from 'react-hook-form';
import { GameTypeSelector } from '../components/mockTest/gameTypeLegacyConfig';
import { AddQuestionModal } from '../components/hackathon/AddQuestionModal';

const EMPTY_QUESTIONS: HackathonQuestion[] = [];

interface EditFormData {
  title: string;
  description: string;
  durationMinutes: number;
  category?: string;
  difficulty?: 'easy' | 'medium' | 'hard';
}

export const MockTestDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { mockTests, updateMockTest, deleteMockTest, togglePublishStatus } = useMockTestStore();
  const questions = useMockTestQuestionsStore((s) => (id ? s.byTestId[id] : undefined) ?? EMPTY_QUESTIONS);
  const setQuestions = useMockTestQuestionsStore((s) => s.setQuestions);

  const [test, setTest] = useState(mockTests.find((t) => t.id === id) ?? null);
  const [loading, setLoading] = useState(!test);
  const [editOpen, setEditOpen] = useState(false);
  const [selectedGameTypes, setSelectedGameTypes] = useState<GameTypeId[]>([]);
  const [didImport, setDidImport] = useState(false);
  const [questionModalOpen, setQuestionModalOpen] = useState(false);
  const [editingQuestion, setEditingQuestion] = useState<HackathonQuestion | null>(null);

  const { register, handleSubmit, reset, formState: { errors } } = useForm<EditFormData>();

  useEffect(() => {
    if (!id) return;
    const load = async () => {
      const alreadyHave = Boolean(test && test.id === id);
      if (!alreadyHave) setLoading(true);
      try {
        let t = mockTests.find((x) => x.id === id) ?? test ?? null;
        if (!t) t = await mockTestService.getMockTestById(id);
        if (t) {
          setTest(t);
          setSelectedGameTypes((t.enabledGameTypes ?? []) as GameTypeId[]);
        }
      } finally {
        if (!alreadyHave) setLoading(false);
      }
    };
    load();
  }, [id]); // don't flicker loader when mockTests updates (e.g. question count sync)

  // If this browser has no local stored questions for this test, try importing legacy/Supabase-linked ones
  useEffect(() => {
    if (!id) return;
    if (didImport) return;
    if (questions.length > 0) return;
    const run = async () => {
      try {
        const imported = await mockTestService.getHackathonQuestionsForTest(id);
        if (imported.length > 0) {
          setQuestions(id, imported);
        }
      } finally {
        setDidImport(true);
      }
    };
    run();
  }, [id, didImport, questions.length, setQuestions]);

  const syncQuestionCount = useCallback(
    async (count: number) => {
      if (!test || !id) return;
      if ((test.totalQuestions ?? 0) === count) return;
      updateMockTest(id, { totalQuestions: count });
      try {
        await mockTestService.updateMockTest(id, { totalQuestions: count });
      } catch {
        /* local store is source of truth for counts */
      }
      setTest((prev) => (prev ? { ...prev, totalQuestions: count } : prev));
    },
    [test, id, updateMockTest]
  );

  const handleTogglePublish = async () => {
    if (!id) return;
    await mockTestService.togglePublish(id);
    togglePublishStatus(id);
    setTest((prev) => (prev ? { ...prev, published: !prev.published } : prev));
  };

  const handleDelete = async () => {
    if (!id || !confirm('Delete this assessment and all its questions?')) return;
    await mockTestService.deleteMockTest(id);
    deleteMockTest(id);
    navigate('/admin/mock-tests');
  };

  const openEdit = () => {
    if (!test) return;
    reset({
      title: test.title,
      description: test.description,
      durationMinutes: test.durationMinutes,
      category: test.category,
      difficulty: test.difficulty,
    });
    setSelectedGameTypes((test.enabledGameTypes ?? []) as GameTypeId[]);
    setEditOpen(true);
  };

  const onEditSubmit = async (data: EditFormData) => {
    if (!id || selectedGameTypes.length === 0) {
      alert('Select at least one game type (round)');
      return;
    }
    const payload = {
      ...data,
      enabledGameTypes: selectedGameTypes,
      totalQuestions: questions.length,
      published: test?.published ?? false,
    };
    const updated = await mockTestService.updateMockTest(id, payload);
    updateMockTest(id, updated);
    setTest({ ...updated, totalQuestions: questions.length });
    setEditOpen(false);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <Loader2 className="size-10 animate-spin text-blue-600" />
      </div>
    );
  }

  if (!test || !id) {
    return (
      <div className="text-center py-20">
        <p className="text-gray-500 mb-4">Assessment not found</p>
        <Button onClick={() => navigate('/admin/mock-tests')}>Back to assessments</Button>
      </div>
    );
  }

  const enabledTypes = (test.enabledGameTypes?.length
    ? test.enabledGameTypes
    : selectedGameTypes) as GameTypeId[];

  const openAddQuestions = () => {
    setEditingQuestion(null);
    setQuestionModalOpen(true);
  };

  const openEditQuestion = (q: HackathonQuestion) => {
    setEditingQuestion(q);
    setQuestionModalOpen(true);
  };

  return (
    <div className="max-w-5xl mx-auto space-y-8 pb-12">
      <AssessmentDetailHeader
        test={test}
        questions={questions}
        onEdit={openEdit}
        onDelete={handleDelete}
        onTogglePublish={handleTogglePublish}
        onPreviewExam={() => navigate(`/admin/mock-tests/${id}/view`)}
        onBack={() => navigate('/admin/mock-tests')}
      />

      <AssessmentRoundsPanel
        testId={id}
        enabledTypes={enabledTypes}
        onQuestionsChange={syncQuestionCount}
        onAddQuestions={openAddQuestions}
        onEditQuestion={openEditQuestion}
      />

      <AddQuestionModal
        open={questionModalOpen}
        onOpenChange={(open) => {
          setQuestionModalOpen(open);
          if (!open) setEditingQuestion(null);
        }}
        editQuestion={editingQuestion}
        mockTestId={id}
        allowedTypes={enabledTypes}
        context="mock-test"
      />

      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit assessment</DialogTitle>
            <DialogDescription>Update settings and enabled rounds (game types)</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit(onEditSubmit)} className="space-y-4">
            <div>
              <label className="text-sm font-medium">Title</label>
              <Input {...register('title', { required: true })} className="mt-1" />
            </div>
            <div>
              <label className="text-sm font-medium">Description</label>
              <Input {...register('description', { required: true })} className="mt-1" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium">Duration (minutes)</label>
                <Input type="number" {...register('durationMinutes', { required: true })} className="mt-1" />
              </div>
              <div>
                <label className="text-sm font-medium">Category</label>
                <Input {...register('category')} className="mt-1" />
              </div>
            </div>
            <GameTypeSelector selected={selectedGameTypes} onChange={setSelectedGameTypes} />
            <div className="flex justify-end gap-2 pt-2">
              <Button type="button" variant="outline" onClick={() => setEditOpen(false)}>
                Cancel
              </Button>
              <Button type="submit">Save</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};
