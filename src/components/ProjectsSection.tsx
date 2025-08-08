import React from 'react';
import { Project } from '@/types/cv';

interface ProjectsSectionProps {
  projects: Project[];
}

const ProjectItem: React.FC<{ project: Project }> = ({ project }) => {
  return (
    <div className="mb-6 last:mb-0 bg-gray-50 p-4 rounded-lg">
      <div className="flex justify-between items-start mb-2">
        <h3 className="text-lg font-semibold text-gray-800">{project.name}</h3>
        <div className="flex gap-2">
          {project.url && (
            <a 
              href={project.url} 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-blue-600 hover:text-blue-800 text-sm"
            >
              🔗 Live
            </a>
          )}
          {project.github && (
            <a 
              href={project.github} 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-gray-600 hover:text-gray-800 text-sm"
            >
              ⚡ Code
            </a>
          )}
        </div>
      </div>
      
      <p className="text-gray-700 mb-3">{project.description}</p>
      
      <div className="flex flex-wrap gap-2">
        {project.technologies.map((tech) => (
          <span 
            key={tech} 
            className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full"
          >
            {tech}
          </span>
        ))}
      </div>
    </div>
  );
};

export const ProjectsSection: React.FC<ProjectsSectionProps> = ({ projects }) => {
  return (
    <>
      {projects.map((project) => (
        <ProjectItem key={project.id} project={project} />
      ))}
    </>
  );
};