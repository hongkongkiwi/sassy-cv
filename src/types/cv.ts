export interface ContactInfo {
  name: string;
  title: string;
  email: string;
  phone?: string;
  location: string;
  linkedin?: string;
  github?: string;
  website?: string;
}

export interface Experience {
  id: string;
  company: string;
  position: string;
  startDate: string;
  endDate?: string; // Made optional to align with schema
  location: string;
  description: string[];
  technologies?: string[];
  order?: number; // Added for sorting
}

export interface Education {
  id: string;
  institution: string;
  degree: string;
  field?: string;
  startDate: string;
  endDate: string;
  location: string;
  description?: string;
  order?: number; // Added for sorting
}

export interface Project {
  id: string;
  name: string;
  description: string;
  technologies: string[];
  url?: string;
  github?: string;
  order?: number; // Added for sorting
}

export interface Skill {
  id?: string; // Optional ID for database operations
  category: string;
  items: string[];
  order?: number; // Added for sorting
}

export interface CVData {
  contact: ContactInfo;
  summary: string;
  experience: Experience[];
  education: Education[];
  projects: Project[];
  skills: Skill[];
}