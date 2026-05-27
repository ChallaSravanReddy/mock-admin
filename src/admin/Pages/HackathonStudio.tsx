import React, { useMemo, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Plus, Search, Trophy, Trash2, Filter } from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  GAME_TYPE_CONFIG,
  MAX_QUESTIONS_PER_TOPIC,
  getGameTypeConfig,
  type GameTypeId,
} from '../constants/gameTypes';
import { useHackathonStore } from '../store/hackathonStore';
import { AddQuestionModal } from '../components/hackathon/AddQuestionModal';
import { groupQuestionsIntoRounds } from '../lib/assessmentQuestionUtils';
import { AssessmentQuestionCard } from '../components/mockTest/AssessmentQuestionCard';
import type { HackathonQuestion } from '../types/hackathon';

export const HackathonStudio: React.FC = () => {
  const { questions, countByType, deleteQuestion, clearAll } = useHackathonStore();
  const [search, setSearch] = useState('');
  const [filterType, setFilterType] = useState<GameTypeId | 'all'>('all');
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<HackathonQuestion | null>(null);

  const filtered = useMemo(() => {
    return questions.filter((q) => {
      if (filterType !== 'all' && q.type !== filterType) return false;
      if (!search.trim()) return true;
      const s = search.toLowerCase();
      return (
        q.title.toLowerCase().includes(s) ||
        q.description.toLowerCase().includes(s) ||
        q.type.includes(s)
      );
    });
  }, [questions, filterType, search]);

  const enabledTypes = useMemo(() => GAME_TYPE_CONFIG.map((g) => g.id), []);

  const rounds = useMemo(() => {
    return groupQuestionsIntoRounds(filtered, enabledTypes);
  }, [filtered, enabledTypes]);

  const totalByType = GAME_TYPE_CONFIG.map((g) => ({
    ...g,
    count: countByType(g.id),
  }));

  const openCreate = () => {
    setEditing(null);
    setModalOpen(true);
  };

  const openEdit = (q: HackathonQuestion) => {
    setEditing(q);
    setModalOpen(true);
  };

  const handleDelete = (q: HackathonQuestion) => {
    if (confirm(`Delete "${q.title}"?`)) deleteQuestion(q.id);
  };

  return (
    <div className="space-y-8 pb-12">
      {/* Hero */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-slate-900 via-indigo-950 to-violet-900 px-6 py-10 text-white shadow-xl sm:px-10">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_rgba(255,255,255,0.12),_transparent_50%)]" />
        <div className="relative flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div className="space-y-3 max-w-xl">
            <div className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-xs font-medium backdrop-blur">
              <Trophy className="size-3.5" /> Hackathon aptitude bank
            </div>
            <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
              Gamified aptitude questions
            </h1>
            <p className="text-slate-300 text-sm sm:text-base">
              Build a mixed question set for your hackathon — puzzle, switch, grid, inductive, and
              motion challenges. Up to {MAX_QUESTIONS_PER_TOPIC} per topic. Generate with AI or
              craft manually.
            </p>
          </div>
          <Button
            size="lg"
            onClick={openCreate}
            className="shrink-0 h-12 gap-2 bg-white text-slate-900 hover:bg-slate-100 shadow-lg"
          >
            <Plus className="size-5" />
            Create question
          </Button>
        </div>
      </div>

      {/* Topic quotas */}
      <div className="grid gap-3 grid-cols-2 sm:grid-cols-3 lg:grid-cols-5">
        {totalByType.map((g) => {
          const Icon = g.icon;
          const pct = (g.count / MAX_QUESTIONS_PER_TOPIC) * 100;
          return (
            <button
              key={g.id}
              type="button"
              onClick={() => setFilterType(filterType === g.id ? 'all' : g.id)}
              className={cn(
                'rounded-xl border bg-card p-4 text-left transition-all hover:shadow-md',
                filterType === g.id && 'ring-2 ring-primary border-primary'
              )}
            >
              <div className="flex items-center justify-between mb-2">
                <Icon className="size-4 text-muted-foreground" />
                <span className="text-xs font-medium text-muted-foreground">
                  {g.count}/{MAX_QUESTIONS_PER_TOPIC}
                </span>
              </div>
              <p className="text-sm font-semibold">{g.shortLabel}</p>
              <div className="mt-2 h-1.5 rounded-full bg-muted overflow-hidden">
                <div
                  className={cn('h-full rounded-full bg-gradient-to-r transition-all', g.accent)}
                  style={{ width: `${pct}%` }}
                />
              </div>
            </button>
          );
        })}
      </div>

      {/* Toolbar */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
          <Input
            placeholder="Search questions…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <div className="flex items-center gap-2">
          <Filter className="size-4 text-muted-foreground" />
          {filterType !== 'all' && (
            <Badge variant="secondary" className="cursor-pointer" onClick={() => setFilterType('all')}>
              Clear filter ×
            </Badge>
          )}
          {questions.length > 0 && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="text-destructive"
              onClick={() => {
                if (confirm('Delete all hackathon questions?')) clearAll();
              }}
            >
              <Trash2 className="size-4 mr-1" /> Clear all
            </Button>
          )}
        </div>
      </div>

      {/* Question grid */}
      {filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed bg-muted/20 py-20 px-6 text-center">
          <div className="rounded-full bg-muted p-4 mb-4">
            <Trophy className="size-10 text-muted-foreground" />
          </div>
          <h2 className="text-lg font-semibold text-gray-900">No questions yet</h2>
          <p className="text-sm text-muted-foreground mt-1 max-w-sm">
            {questions.length === 0
              ? 'Create your first gamified aptitude question to populate the hackathon bank.'
              : 'No questions match your search or filter.'}
          </p>
          {questions.length === 0 && (
            <Button className="mt-6 gap-2" onClick={openCreate}>
              <Plus className="size-4" /> Create question
            </Button>
          )}
        </div>
      ) : (
        <div className="space-y-6">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-gray-200 pb-3">
            <h2 className="text-lg font-semibold text-gray-900">Questions</h2>
            <Button
              type="button"
              className="bg-red-600 hover:bg-red-700 text-white gap-1.5"
              onClick={openCreate}
            >
              <Plus className="size-4" />
              Add Questions
            </Button>
          </div>

          {rounds.map((round) => (
            <section key={round.type} className="space-y-3">
              {(() => {
                const cfg = getGameTypeConfig(round.type);
                const Icon = cfg.icon;
                return (
              <div className="flex flex-wrap items-center gap-2">
                <span
                  className={cn(
                    'inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md border text-xs font-semibold',
                    cfg.color
                  )}
                >
                  <Icon className="size-3.5" />
                  Round {round.roundNumber}
                </span>
                <span className="text-sm font-medium text-gray-700">{round.label}</span>
                <span className="text-xs text-gray-400">
                  ({round.questions.length} question{round.questions.length !== 1 ? 's' : ''})
                </span>
              </div>
                );
              })()}

              {round.questions.length === 0 ? (
                <p className="text-sm text-gray-400 italic pl-1">No questions in this round yet.</p>
              ) : (
                <div className="space-y-2">
                  {round.questions.map((q, idx) => (
                    <AssessmentQuestionCard
                      key={q.id}
                      question={q}
                      index={idx}
                      onEdit={() => openEdit(q)}
                      onDelete={() => handleDelete(q)}
                    />
                  ))}
                </div>
              )}
            </section>
          ))}
        </div>
      )}

      <p className="text-center text-xs text-muted-foreground">
        {questions.length} total question{questions.length !== 1 ? 's' : ''} in hackathon bank
        · stored locally in this browser
      </p>

      <AddQuestionModal
        open={modalOpen}
        onOpenChange={setModalOpen}
        editQuestion={editing}
      />
    </div>
  );
};
