import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Pencil, Trash2, Sparkles, PenLine } from 'lucide-react';
import { cn } from '@/lib/utils';
import { getGameTypeConfig } from '../../constants/gameTypes';
import type { HackathonQuestion } from '../../types/hackathon';

interface HackathonQuestionCardProps {
  question: HackathonQuestion;
  onEdit: () => void;
  onDelete: () => void;
}

export const HackathonQuestionCard: React.FC<HackathonQuestionCardProps> = ({
  question,
  onEdit,
  onDelete,
}) => {
  const cfg = getGameTypeConfig(question.type);
  const Icon = cfg.icon;

  const detail = (() => {
    switch (question.type) {
      case 'puzzle':
        return `${question.payload.gridSize}×${question.payload.gridSize} matrix`;
      case 'switch_challenge':
        return `${question.payload.inputSymbols.length} symbols · ${question.payload.timeDuration}s`;
      case 'grid_challenge':
        return `${question.payload.totalRounds} rounds`;
      case 'inductive_challenge':
        return `${question.payload.questions.length} pattern Q`;
      case 'motion_challenge':
        return `${question.payload.levels.length} levels · ${question.payload.timeDurationSeconds}s`;
    }
  })();

  return (
    <Card className="group overflow-hidden border-0 shadow-sm ring-1 ring-border/60 hover:shadow-md transition-shadow">
      <div className={cn('h-1.5 w-full bg-gradient-to-r', cfg.accent)} />
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="flex gap-3 min-w-0">
            <div className={cn('shrink-0 rounded-lg border p-2', cfg.color)}>
              <Icon className="size-5" />
            </div>
            <div className="min-w-0">
              <p className="font-semibold text-gray-900 truncate">{question.title}</p>
              <p className="text-xs text-muted-foreground line-clamp-2 mt-0.5">
                {question.description}
              </p>
            </div>
          </div>
          <div className="flex shrink-0 gap-1 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
            <Button type="button" variant="ghost" size="icon-sm" onClick={onEdit} aria-label="Edit">
              <Pencil className="size-4" />
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="icon-sm"
              className="text-destructive hover:text-destructive"
              onClick={onDelete}
              aria-label="Delete"
            >
              <Trash2 className="size-4" />
            </Button>
          </div>
        </div>

        <div className="flex flex-wrap gap-1.5 mt-3">
          <Badge variant="outline" className={cfg.color}>
            {cfg.shortLabel}
          </Badge>
          <Badge variant="secondary">{question.difficulty}</Badge>
          <Badge variant="outline" className="gap-1">
            {question.source === 'ai' ? (
              <>
                <Sparkles className="size-3" /> AI
              </>
            ) : (
              <>
                <PenLine className="size-3" /> Manual
              </>
            )}
          </Badge>
          <Badge variant="outline">{detail}</Badge>
        </div>
      </CardContent>
    </Card>
  );
};
