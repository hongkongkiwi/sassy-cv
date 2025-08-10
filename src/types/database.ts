// Database document types that align with Convex schema
// These types include all database fields including system fields

import { Id } from '../../convex/_generated/dataModel';

export interface ContactInfoDoc {
  _id: Id<'contactInfo'>;
  _creationTime: number;
  name: string;
  title: string;
  email: string;
  phone?: string;
  location: string;
  linkedin?: string;
  github?: string;
  website?: string;
  summary: string;
  userId: string;
}

export interface ExperienceDoc {
  _id: Id<'experiences'>;
  _creationTime: number;
  company: string;
  position: string;
  startDate: string;
  endDate?: string;
  location: string;
  description: string[];
  technologies?: string[];
  order: number;
  userId: string;
}

export interface EducationDoc {
  _id: Id<'education'>;
  _creationTime: number;
  institution: string;
  degree: string;
  field?: string;
  startDate: string;
  endDate: string;
  location: string;
  description?: string;
  order: number;
  userId: string;
}

export interface ProjectDoc {
  _id: Id<'projects'>;
  _creationTime: number;
  name: string;
  description: string;
  technologies: string[];
  url?: string;
  github?: string;
  order: number;
  userId: string;
}

export interface SkillDoc {
  _id: Id<'skills'>;
  _creationTime: number;
  category: string;
  items: string[];
  order: number;
  userId: string;
}

export interface AnalyticsDoc {
  _id: Id<'analytics'>;
  _creationTime: number;
  userId: string;
  event: string;
  timestamp: number;
  visitorId?: string;
  userAgent?: string;
  country?: string;
  city?: string;
  referrer?: string;
  deviceType?: string;
  sessionDuration?: number;
  metadata?: Record<string, unknown>;
}

export interface ThemeDoc {
  _id: Id<'themes'>;
  _creationTime: number;
  name: string;
  displayName: string;
  description: string;
  colors: {
    primary: string;
    secondary: string;
    accent: string;
    background: string;
    text: string;
  };
  fonts: {
    heading: string;
    body: string;
  };
  layout: 'modern' | 'classic' | 'minimal' | 'creative';
  isActive: boolean;
}

export interface UserSettingsDoc {
  _id: Id<'userSettings'>;
  _creationTime: number;
  userId: string;
  selectedTheme?: string;
  analyticsEnabled?: boolean;
  publicViewEnabled?: boolean;
  customDomain?: string;
  seoSettings?: {
    title: string;
    description: string;
    keywords: string[];
  };
}

export interface CoverLetterDoc {
  _id: Id<'coverLetters'>;
  _creationTime: number;
  userId: string;
  title: string;
  content: string;
  jobTitle?: string;
  company?: string;
  isTemplate?: boolean;
  createdAt: number;
  updatedAt: number;
}

export interface LinkedInExperience {
  title: string;
  companyName: string;
  companyUrl?: string;
  startDate: {
    month?: number;
    year: number;
  };
  endDate?: {
    month?: number;
    year: number;
  };
  description?: string;
  location?: string;
}

export interface LinkedInEducation {
  schoolName: string;
  degreeName?: string;
  fieldOfStudy?: string;
  startDate?: {
    year: number;
  };
  endDate?: {
    year: number;
  };
  description?: string;
}

export interface LinkedInImportDoc {
  _id: Id<'linkedinImports'>;
  _creationTime: number;
  userId: string;
  profileData: {
    firstName?: string;
    lastName?: string;
    headline?: string;
    summary?: string;
    location?: string;
    industry?: string;
    profileUrl?: string;
  };
  experiences?: LinkedInExperience[];
  education?: LinkedInEducation[];
  skills?: string[];
  importedAt: number;
  status: 'success' | 'partial' | 'failed';
}