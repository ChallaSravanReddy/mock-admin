import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface GameInfoCardProps {
  title: string;
  description: string;
  onTitleChange: (value: string) => void;
  onDescriptionChange: (value: string) => void;
  titlePlaceholder?: string;
  descriptionPlaceholder?: string;
  focusRingClass?: string;
}

export const GameInfoCard: React.FC<GameInfoCardProps> = ({
  title,
  description,
  onTitleChange,
  onDescriptionChange,
  titlePlaceholder = 'e.g. Challenge Level 1',
  descriptionPlaceholder = 'Describe the challenge…',
  focusRingClass = 'focus:ring-blue-500',
}) => (
  <Card>
    <CardHeader>
      <CardTitle>Game Information</CardTitle>
    </CardHeader>
    <CardContent className="space-y-4">
      <div>
        <label className="block text-sm font-medium mb-1">Title</label>
        <input
          type="text"
          value={title}
          onChange={(e) => onTitleChange(e.target.value)}
          placeholder={titlePlaceholder}
          className={`w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 ${focusRingClass}`}
        />
      </div>
      <div>
        <label className="block text-sm font-medium mb-1">Description</label>
        <textarea
          rows={2}
          value={description}
          onChange={(e) => onDescriptionChange(e.target.value)}
          placeholder={descriptionPlaceholder}
          className={`w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 resize-none ${focusRingClass}`}
        />
      </div>
    </CardContent>
  </Card>
);
