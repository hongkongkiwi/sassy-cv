import React from 'react';
import { Skill } from '@/types/cv';

interface SkillsSectionProps {
  skills: Skill[];
}

export const SkillsSection: React.FC<SkillsSectionProps> = ({ skills }) => {
  const skillIcons = {
    'Languages': '💻',
    'Frontend': '🎨',
    'Backend': '⚡',
    'Database': '📊',
    'Cloud & DevOps': '☁️',
    'Tools': '🔧',
    'Mobile': '📱',
    'AI/ML': '🤖',
    'Testing': '🧪',
    'Other': '🛠️'
  };

  const getIcon = (category: string) => {
    const key = Object.keys(skillIcons).find(k => 
      category.toLowerCase().includes(k.toLowerCase())
    );
    return key ? skillIcons[key as keyof typeof skillIcons] : skillIcons.Other;
  };

  return (
    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
      {skills.map((skillCategory) => (
        <div 
          key={skillCategory.category} 
          className="bg-gradient-to-br from-white to-gray-50 p-6 rounded-xl border border-gray-200 hover:border-blue-300 hover:shadow-lg transition-all duration-200 group"
        >
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-500 rounded-lg flex items-center justify-center text-white text-lg group-hover:scale-110 transition-transform duration-200">
              {getIcon(skillCategory.category)}
            </div>
            <h3 className="font-bold text-gray-900 text-lg">{skillCategory.category}</h3>
          </div>
          
          <div className="flex flex-wrap gap-2">
            {skillCategory.items.map((skill, index) => (
              <span 
                key={skill} 
                className="px-3 py-2 bg-white text-gray-700 text-sm font-medium rounded-lg border border-gray-200 shadow-sm hover:shadow-md hover:border-blue-300 transition-all duration-200 transform hover:-translate-y-0.5"
                style={{ 
                  animationDelay: `${index * 50}ms`,
                  animation: 'fadeInUp 0.6s ease-out forwards'
                }}
              >
                {skill}
              </span>
            ))}
          </div>
        </div>
      ))}
      
      <style jsx>{`
        @keyframes fadeInUp {
          from {
            opacity: 0;
            transform: translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
    </div>
  );
};