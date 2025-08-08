import React from 'react';
import { Education } from '@/types/cv';

interface EducationSectionProps {
  education: Education[];
}

const EducationItem: React.FC<{ education: Education }> = ({ education }) => {
  const formatDate = (date: string) => {
    const [year, month] = date.split('-');
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    return `${monthNames[parseInt(month) - 1]} ${year}`;
  };

  return (
    <div className="mb-4 last:mb-0">
      <div className="flex justify-between items-start mb-2">
        <div>
          <h3 className="text-lg font-semibold text-gray-800">
            {education.degree}{education.field && ` in ${education.field}`}
          </h3>
          <p className="text-blue-600 font-medium">{education.institution}</p>
        </div>
        <div className="text-right text-sm text-gray-500">
          <p>{formatDate(education.startDate)} - {formatDate(education.endDate)}</p>
          <p>{education.location}</p>
        </div>
      </div>
      
      {education.description && (
        <p className="text-gray-700">{education.description}</p>
      )}
    </div>
  );
};

export const EducationSection: React.FC<EducationSectionProps> = ({ education }) => {
  return (
    <>
      {education.map((edu) => (
        <EducationItem key={edu.id} education={edu} />
      ))}
    </>
  );
};