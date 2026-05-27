import React from 'react';

interface BuilderPageHeaderProps {
  title: string;
  description: string;
}

export const BuilderPageHeader: React.FC<BuilderPageHeaderProps> = ({ title, description }) => (
  <div className="space-y-1">
    <h1 className="text-3xl font-bold text-gray-900">{title}</h1>
    <p className="text-gray-600">{description}</p>
  </div>
);
