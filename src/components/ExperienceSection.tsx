import React from 'react';
import { Experience } from '@/types/cv';

interface ExperienceSectionProps {
  experiences: Experience[];
}

const ExperienceItem: React.FC<{ experience: Experience }> = ({ experience }) => {
  const formatDate = (date: string | null | undefined) => {
    if (!date) return 'Present';
    const [year, rawMonth = '01'] = date.split('-');
    const monthNum = parseInt(rawMonth, 10);
    const monthIndex = isNaN(monthNum) ? 0 : Math.min(Math.max(monthNum - 1, 0), 11);
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    return `${monthNames[monthIndex]} ${year}`;
  };

  return (
    <div className="relative pl-8 pb-8 last:pb-0">
      {/* Timeline dot */}
      <div className="absolute left-0 top-2 w-4 h-4 bg-gradient-to-r from-blue-600 to-purple-600 rounded-full border-4 border-white shadow-lg"></div>
      
      {/* Timeline line */}
      <div className="absolute left-2 top-6 w-px h-full bg-gradient-to-b from-blue-200 to-transparent"></div>
      
      <div className="bg-gradient-to-r from-gray-50 to-blue-50 rounded-xl p-6 border border-gray-200 hover:border-blue-300 transition-all duration-200 hover:shadow-md">
        <div className="flex justify-between items-start mb-4">
          <div className="flex-1">
            <h3 className="text-xl font-bold text-gray-900 mb-1">{experience.position}</h3>
            <p className="text-lg font-semibold text-blue-600 mb-2">{experience.company}</p>
          </div>
          <div className="text-right ml-4">
            <div className="bg-white px-3 py-1 rounded-lg border border-gray-200 text-sm font-medium text-gray-700">
              {formatDate(experience.startDate)} - {formatDate(experience.endDate)}
            </div>
            <p className="text-xs text-gray-500 mt-1">{experience.location}</p>
          </div>
        </div>
        
        <ul className="space-y-2 mb-4">
          {experience.description.map((item, index) => (
            <li key={index} className="flex items-start gap-3 text-gray-700">
              <span className="w-2 h-2 bg-blue-500 rounded-full mt-2 flex-shrink-0"></span>
              <span className="leading-relaxed">{item}</span>
            </li>
          ))}
        </ul>
        
        {experience.technologies && (
          <div className="flex flex-wrap gap-2">
            {experience.technologies.map((tech) => (
              <span 
                key={tech} 
                className="px-3 py-1.5 bg-white text-blue-700 text-sm font-medium rounded-lg border border-blue-200 shadow-sm hover:shadow-md transition-shadow duration-200"
              >
                {tech}
              </span>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export const ExperienceSection: React.FC<ExperienceSectionProps> = ({ experiences }) => {
  return (
    <>
      {experiences.map((experience) => (
        <ExperienceItem key={experience.id} experience={experience} />
      ))}
    </>
  );
};