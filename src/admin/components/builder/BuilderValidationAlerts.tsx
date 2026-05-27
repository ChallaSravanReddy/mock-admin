import React from 'react';
import { AlertCircle } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';

interface BuilderValidationAlertsProps {
  errors: string[];
}

export const BuilderValidationAlerts: React.FC<BuilderValidationAlertsProps> = ({ errors }) => {
  if (errors.length === 0) return null;

  return (
    <Card className="border-red-400 bg-red-50">
      <CardContent className="pt-5">
        <div className="flex gap-3">
          <AlertCircle className="text-red-500 h-5 w-5 flex-shrink-0 mt-0.5" />
          <ul className="text-sm text-red-700 space-y-0.5">
            {errors.map((e, i) => (
              <li key={i}>• {e}</li>
            ))}
          </ul>
        </div>
      </CardContent>
    </Card>
  );
};
