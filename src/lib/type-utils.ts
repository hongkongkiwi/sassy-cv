import type { 
  ContactInfoDoc, 
  ExperienceDoc, 
  EducationDoc, 
  ProjectDoc, 
  SkillDoc 
} from '@/types/database';
import type { 
  ContactInfo, 
  Experience, 
  Education, 
  Project, 
  Skill,
  CVData 
} from '@/types/cv';

// Convert database documents to CV types
export function docToContactInfo(doc: ContactInfoDoc): ContactInfo & { summary: string } {
  return {
    name: doc.name,
    title: doc.title,
    email: doc.email,
    phone: doc.phone,
    location: doc.location,
    linkedin: doc.linkedin,
    github: doc.github,
    website: doc.website,
    summary: doc.summary,
  };
}

export function docToExperience(doc: ExperienceDoc): Experience {
  return {
    id: doc._id,
    company: doc.company,
    position: doc.position,
    startDate: doc.startDate,
    endDate: doc.endDate,
    location: doc.location,
    description: doc.description,
    technologies: doc.technologies,
    order: doc.order,
  };
}

export function docToEducation(doc: EducationDoc): Education {
  return {
    id: doc._id,
    institution: doc.institution,
    degree: doc.degree,
    field: doc.field,
    startDate: doc.startDate,
    endDate: doc.endDate,
    location: doc.location,
    description: doc.description,
    order: doc.order,
  };
}

export function docToProject(doc: ProjectDoc): Project {
  return {
    id: doc._id,
    name: doc.name,
    description: doc.description,
    technologies: doc.technologies,
    url: doc.url,
    github: doc.github,
    order: doc.order,
  };
}

export function docToSkill(doc: SkillDoc): Skill {
  return {
    id: doc._id,
    category: doc.category,
    items: doc.items,
    order: doc.order,
  };
}

// Type guards
export function isValidContactInfo(data: unknown): data is ContactInfo {
  if (!data || typeof data !== 'object') return false;
  const contact = data as Record<string, unknown>;
  
  return (
    typeof contact.name === 'string' &&
    typeof contact.title === 'string' &&
    typeof contact.email === 'string' &&
    typeof contact.location === 'string' &&
    (contact.phone === undefined || typeof contact.phone === 'string') &&
    (contact.linkedin === undefined || typeof contact.linkedin === 'string') &&
    (contact.github === undefined || typeof contact.github === 'string') &&
    (contact.website === undefined || typeof contact.website === 'string')
  );
}

export function isValidExperience(data: unknown): data is Experience {
  if (!data || typeof data !== 'object') return false;
  const exp = data as Record<string, unknown>;
  
  return (
    typeof exp.id === 'string' &&
    typeof exp.company === 'string' &&
    typeof exp.position === 'string' &&
    typeof exp.startDate === 'string' &&
    (exp.endDate === undefined || typeof exp.endDate === 'string') &&
    typeof exp.location === 'string' &&
    Array.isArray(exp.description) &&
    exp.description.every((d: unknown) => typeof d === 'string') &&
    (exp.technologies === undefined || 
      (Array.isArray(exp.technologies) && exp.technologies.every((t: unknown) => typeof t === 'string')))
  );
}

export function isValidEducation(data: unknown): data is Education {
  if (!data || typeof data !== 'object') return false;
  const edu = data as Record<string, unknown>;
  
  return (
    typeof edu.id === 'string' &&
    typeof edu.institution === 'string' &&
    typeof edu.degree === 'string' &&
    (edu.field === undefined || typeof edu.field === 'string') &&
    typeof edu.startDate === 'string' &&
    typeof edu.endDate === 'string' &&
    typeof edu.location === 'string' &&
    (edu.description === undefined || typeof edu.description === 'string')
  );
}

export function isValidProject(data: unknown): data is Project {
  if (!data || typeof data !== 'object') return false;
  const proj = data as Record<string, unknown>;
  
  return (
    typeof proj.id === 'string' &&
    typeof proj.name === 'string' &&
    typeof proj.description === 'string' &&
    Array.isArray(proj.technologies) &&
    proj.technologies.every((t: unknown) => typeof t === 'string') &&
    (proj.url === undefined || typeof proj.url === 'string') &&
    (proj.github === undefined || typeof proj.github === 'string')
  );
}

export function isValidSkill(data: unknown): data is Skill {
  if (!data || typeof data !== 'object') return false;
  const skill = data as Record<string, unknown>;
  
  return (
    typeof skill.category === 'string' &&
    Array.isArray(skill.items) &&
    skill.items.every((i: unknown) => typeof i === 'string')
  );
}

export function isValidCVData(data: unknown): data is CVData {
  if (!data || typeof data !== 'object') return false;
  const cv = data as Record<string, unknown>;
  
  return (
    isValidContactInfo(cv.contact) &&
    typeof cv.summary === 'string' &&
    Array.isArray(cv.experience) &&
    cv.experience.every(isValidExperience) &&
    Array.isArray(cv.education) &&
    cv.education.every(isValidEducation) &&
    Array.isArray(cv.projects) &&
    cv.projects.every(isValidProject) &&
    Array.isArray(cv.skills) &&
    cv.skills.every(isValidSkill)
  );
}

// Sort functions
export function sortByOrder<T extends { order?: number }>(items: T[]): T[] {
  return [...items].sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
}

// Safe parsing utilities
export function safeParseJSON<T>(json: string, fallback: T): T {
  try {
    return JSON.parse(json) as T;
  } catch {
    return fallback;
  }
}

// Date formatting utilities
export function formatDate(date: string | undefined): string {
  if (!date) return 'Present';
  
  try {
    const d = new Date(date);
    if (isNaN(d.getTime())) return date;
    return d.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
  } catch {
    return date;
  }
}

export function formatDateRange(startDate: string, endDate?: string): string {
  return `${formatDate(startDate)} - ${formatDate(endDate)}`;
}