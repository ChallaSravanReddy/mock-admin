import React, { useMemo, useState } from 'react';

import {

  Dialog,

  DialogContent,

  DialogDescription,

  DialogHeader,

  DialogTitle,

} from '@/components/ui/dialog';

import { Button } from '@/components/ui/button';

import { Input } from '@/components/ui/input';

import { Badge } from '@/components/ui/badge';

import { Sparkles, PenLine, ChevronLeft, Loader2 } from 'lucide-react';

import { cn } from '@/lib/utils';

import {

  GAME_TYPE_CONFIG,

  MAX_QUESTIONS_PER_TOPIC,

  getGameTypeConfig,

  type GameTypeId,

} from '../../constants/gameTypes';

import { useHackathonStore } from '../../store/hackathonStore';

import { useMockTestQuestionsStore } from '../../store/mockTestQuestionsStore';

import { createManualTemplate } from '../../lib/hackathonGenerators';

import { ManualQuestionEditor } from './ManualQuestionEditor';

import type { HackathonQuestion } from '../../types/hackathon';



type Step = 'type' | 'mode' | 'ai-count' | 'manual-edit';



interface AddQuestionModalProps {

  open: boolean;

  onOpenChange: (open: boolean) => void;

  editQuestion?: HackathonQuestion | null;

  /** When set, questions are stored on this mock test */

  mockTestId?: string;

  allowedTypes?: GameTypeId[];

  context?: 'hackathon' | 'mock-test';

}



export const AddQuestionModal: React.FC<AddQuestionModalProps> = ({

  open,

  onOpenChange,

  editQuestion,

  mockTestId,

  allowedTypes,

  context = mockTestId ? 'mock-test' : 'hackathon',

}) => {

  const hackathon = useHackathonStore();

  const mockTestQs = useMockTestQuestionsStore();



  const isMockTest = context === 'mock-test' && Boolean(mockTestId);



  const countByType = (type: GameTypeId) =>

    isMockTest ? mockTestQs.countByType(mockTestId!, type) : hackathon.countByType(type);



  const canAdd = (type: GameTypeId, count: number) =>

    isMockTest

      ? mockTestQs.canAdd(mockTestId!, type, count)

      : hackathon.canAdd(type, count);



  const addQuestion = (q: HackathonQuestion) =>

    isMockTest ? mockTestQs.addQuestion(mockTestId!, q) : hackathon.addQuestion(q);



  const updateQuestion = (id: string, q: HackathonQuestion) =>

    isMockTest

      ? mockTestQs.updateQuestion(mockTestId!, id, q)

      : hackathon.updateQuestion(id, q);



  const generateBatch = (type: GameTypeId, count: number) =>

    isMockTest

      ? mockTestQs.addGenerated(mockTestId!, type, count)

      : hackathon.generateBatch(type, count);



  const typeOptions = useMemo(() => {

    const list = allowedTypes?.length

      ? GAME_TYPE_CONFIG.filter((g) => allowedTypes.includes(g.id))

      : GAME_TYPE_CONFIG;

    return list;

  }, [allowedTypes]);



  const [step, setStep] = useState<Step>('type');

  const [selectedType, setSelectedType] = useState<GameTypeId | null>(null);

  const [draft, setDraft] = useState<HackathonQuestion | null>(null);

  const [aiCount, setAiCount] = useState(1);

  const [isGenerating, setIsGenerating] = useState(false);

  const [error, setError] = useState<string | null>(null);



  const isEdit = Boolean(editQuestion);



  const remaining = useMemo(() => {

    if (!selectedType) return MAX_QUESTIONS_PER_TOPIC;

    return MAX_QUESTIONS_PER_TOPIC - countByType(selectedType);

  }, [selectedType, countByType, mockTestId]);



  const reset = () => {

    if (isEdit && editQuestion) {

      setStep('manual-edit');

      setSelectedType(editQuestion.type);

      setDraft(editQuestion);

    } else if (typeOptions.length === 1) {

      setStep('mode');

      setSelectedType(typeOptions[0].id);

      setDraft(null);

    } else {

      setStep('type');

      setSelectedType(null);

      setDraft(null);

    }

    setAiCount(1);

    setError(null);

    setIsGenerating(false);

  };



  React.useEffect(() => {

    if (open) {

      if (editQuestion) {

        setStep('manual-edit');

        setSelectedType(editQuestion.type);

        setDraft(editQuestion);

      } else {

        reset();

      }

    }

  }, [open, editQuestion]);



  const close = () => {

    onOpenChange(false);

    setTimeout(reset, 200);

  };



  const goBack = () => {

    setError(null);

    if (step === 'mode') {

      if (typeOptions.length === 1) close();

      else setStep('type');

    } else if (step === 'ai-count' || step === 'manual-edit') setStep('mode');

  };



  const handleTypeSelect = (type: GameTypeId) => {

    if (countByType(type) >= MAX_QUESTIONS_PER_TOPIC) {

      setError(`This type already has ${MAX_QUESTIONS_PER_TOPIC} questions in this test.`);

      return;

    }

    setSelectedType(type);

    setError(null);

    setStep('mode');

  };



  const handleModeSelect = (mode: 'ai' | 'manual') => {

    if (!selectedType) return;

    setError(null);

    if (mode === 'ai') {

      setAiCount(Math.min(1, remaining));

      setStep('ai-count');

    } else {

      setDraft(createManualTemplate(selectedType));

      setStep('manual-edit');

    }

  };



  const handleAiGenerate = async () => {

    if (!selectedType) return;

    const check = canAdd(selectedType, aiCount);

    if (!check.ok) {

      setError(check.message ?? 'Cannot add more questions');

      return;

    }

    setIsGenerating(true);

    setError(null);

    await new Promise((r) => setTimeout(r, 50));

    // Motion BFS generation can freeze the UI — yield to the browser between items
    let result: { ok: boolean; message?: string; added?: number } = { ok: true };
    if (selectedType === 'motion_challenge' && aiCount > 0) {
      for (let i = 0; i < aiCount; i++) {
        result = generateBatch(selectedType, 1);
        if (!result.ok) break;
        await new Promise((r) => setTimeout(r, 0));
      }
    } else {
      result = generateBatch(selectedType, aiCount);
    }

    setIsGenerating(false);

    if (!result.ok) {

      setError(result.message ?? 'Generation failed');

      return;

    }

    close();

  };



  const handleManualSave = (q: HackathonQuestion) => {

    if (isEdit && editQuestion) {

      updateQuestion(editQuestion.id, q);

      close();

      return;

    }

    const result = addQuestion(q);

    if (!result.ok) {

      setError(result.message ?? 'Could not save');

      return;

    }

    close();

  };



  const cfg = selectedType ? getGameTypeConfig(selectedType) : null;

  const titlePrefix = isMockTest ? 'Test question' : 'Hackathon question';



  return (

    <Dialog open={open} onOpenChange={(v) => (v ? onOpenChange(v) : close())}>

      <DialogContent

        className={cn(

          'gap-0 p-0 overflow-hidden',

          step === 'manual-edit' ? 'sm:max-w-3xl max-h-[92vh]' : 'sm:max-w-2xl'

        )}

      >

        <div className="border-b bg-gradient-to-r from-slate-900 to-slate-800 px-6 py-5 text-white">

          <DialogHeader className="text-left">

            <DialogTitle className="text-xl text-white">

              {isEdit ? `Edit ${titlePrefix}` : `Add ${titlePrefix}`}

            </DialogTitle>

            <DialogDescription className="text-slate-300">

              {step === 'type' && 'Choose challenge type (enabled for this test)'}

              {step === 'mode' && cfg && `${cfg.label} · generate or edit manually`}

              {step === 'ai-count' && `Generate up to ${remaining} more with AI`}

              {step === 'manual-edit' && 'Edit question, grid, and answers below'}

            </DialogDescription>

          </DialogHeader>

        </div>



        <div className="overflow-y-auto max-h-[calc(92vh-120px)] p-6">

          {!isEdit && step !== 'type' && step !== 'manual-edit' && typeOptions.length > 1 && (

            <Button type="button" variant="ghost" size="sm" className="mb-4 -mt-1 gap-1" onClick={goBack}>

              <ChevronLeft className="size-4" /> Back

            </Button>

          )}



          {error && (

            <p className="mb-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">

              {error}

            </p>

          )}



          {step === 'type' && (

            <div className="grid gap-3 sm:grid-cols-2">

              {typeOptions.map((g) => {

                const count = countByType(g.id);

                const full = count >= MAX_QUESTIONS_PER_TOPIC;

                const Icon = g.icon;

                return (

                  <button

                    key={g.id}

                    type="button"

                    disabled={full}

                    onClick={() => handleTypeSelect(g.id)}

                    className={cn(

                      'group relative flex flex-col items-start gap-2 rounded-xl border-2 p-4 text-left transition-all',

                      'hover:border-primary/50 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',

                      full && 'opacity-50 cursor-not-allowed',

                      !full && 'border-border bg-card'

                    )}

                  >

                    <div className={cn('rounded-lg border p-2', g.color)}>

                      <Icon className="size-6" />

                    </div>

                    <div>

                      <p className="font-semibold text-gray-900">{g.shortLabel}</p>

                      <p className="text-xs text-muted-foreground mt-0.5">{g.description}</p>

                    </div>

                    <Badge variant="secondary" className="mt-1">

                      {count}/{MAX_QUESTIONS_PER_TOPIC}

                    </Badge>

                  </button>

                );

              })}

            </div>

          )}



          {step === 'mode' && cfg && (

            <div className="grid gap-4 sm:grid-cols-2">

              <button

                type="button"

                onClick={() => handleModeSelect('ai')}

                className="flex flex-col items-start gap-3 rounded-xl border-2 border-violet-200 bg-gradient-to-br from-violet-50 to-indigo-50 p-5 text-left transition hover:shadow-lg"

              >

                <div className="rounded-full bg-violet-600 p-2.5 text-white">

                  <Sparkles className="size-6" />

                </div>

                <div>

                  <p className="font-semibold text-gray-900">Generate with AI</p>

                  <p className="text-sm text-muted-foreground mt-1">

                    Instantly create 1–{remaining} unique {cfg.shortLabel} questions

                  </p>

                </div>

              </button>

              <button

                type="button"

                onClick={() => handleModeSelect('manual')}

                className="flex flex-col items-start gap-3 rounded-xl border-2 border-slate-200 bg-white p-5 text-left transition hover:shadow-lg hover:border-slate-300"

              >

                <div className="rounded-full bg-slate-800 p-2.5 text-white">

                  <PenLine className="size-6" />

                </div>

                <div>

                  <p className="font-semibold text-gray-900">Build manually</p>

                  <p className="text-sm text-muted-foreground mt-1">

                    Edit grid, options, and correct answers in this dialog

                  </p>

                </div>

              </button>

            </div>

          )}



          {step === 'ai-count' && (

            <div className="space-y-6">

              <div className="rounded-xl border bg-muted/30 p-4">

                <label className="text-sm font-medium">Number of questions</label>

                <div className="mt-3 flex items-center gap-4">

                  <Input

                    type="number"

                    min={1}

                    max={remaining}

                    value={aiCount}

                    onChange={(e) =>

                      setAiCount(Math.min(remaining, Math.max(1, Number(e.target.value) || 1)))

                    }

                    className="w-24"

                  />

                  <input

                    type="range"

                    min={1}

                    max={Math.max(1, remaining)}

                    value={aiCount}

                    onChange={(e) => setAiCount(Number(e.target.value))}

                    className="flex-1"

                  />

                  <span className="text-sm text-muted-foreground whitespace-nowrap">

                    max {remaining}

                  </span>

                </div>

              </div>

              <Button

                type="button"

                className="w-full h-11 gap-2 bg-gradient-to-r from-violet-600 to-indigo-600"

                disabled={isGenerating || remaining < 1}

                onClick={handleAiGenerate}

              >

                {isGenerating ? (

                  <>

                    <Loader2 className="size-4 animate-spin" /> Generating…

                  </>

                ) : (

                  <>

                    <Sparkles className="size-4" />

                    Generate {aiCount} question{aiCount !== 1 ? 's' : ''}

                  </>

                )}

              </Button>

            </div>

          )}



          {step === 'manual-edit' && draft && (

            <ManualQuestionEditor

              question={draft}

              onSave={handleManualSave}

              onCancel={close}

              embeddedInTest={isMockTest}

            />

          )}

        </div>

      </DialogContent>

    </Dialog>

  );

};


