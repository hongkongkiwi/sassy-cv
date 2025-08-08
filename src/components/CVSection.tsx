import React from 'react';

interface CVSectionProps {
  title: string;
  children: React.ReactNode;
  className?: string;
}

export const CVSection: React.FC<CVSectionProps> = ({ title, children, className = '' }) => {
  return (
    <section className={`${className}`}>
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-2 flex items-center gap-3">
          <div className="h-1 w-8 bg-gradient-to-r from-blue-600 to-purple-600 rounded-full"></div>
          {title}
        </h2>
        <div className="h-px bg-gradient-to-r from-gray-300 via-gray-200 to-transparent"></div>
      </div>
      <div className="space-y-6">
        {children}
      </div>
    </section>
  );
};