import { describe, it, expect } from 'vitest';
import {
  isValidContactInfo,
  isValidExperience,
  isValidEducation,
  isValidProject,
  isValidSkill,
  isValidCVData,
  sortByOrder,
  safeParseJSON,
  formatDate,
  formatDateRange,
} from '../type-utils';

describe('Type Utilities', () => {
  describe('Type Guards', () => {
    describe('isValidContactInfo', () => {
      it('should validate correct contact info', () => {
        const valid = {
          name: 'John Doe',
          title: 'Developer',
          email: 'john@example.com',
          location: 'New York',
        };
        expect(isValidContactInfo(valid)).toBe(true);
      });

      it('should validate with optional fields', () => {
        const valid = {
          name: 'John Doe',
          title: 'Developer',
          email: 'john@example.com',
          location: 'New York',
          phone: '+1234567890',
          linkedin: 'linkedin.com/in/john',
          github: 'github.com/john',
          website: 'john.dev',
        };
        expect(isValidContactInfo(valid)).toBe(true);
      });

      it('should reject missing required fields', () => {
        const invalid = {
          name: 'John Doe',
          // missing title, email, location
        };
        expect(isValidContactInfo(invalid)).toBe(false);
      });

      it('should reject incorrect types', () => {
        const invalid = {
          name: 123, // should be string
          title: 'Developer',
          email: 'john@example.com',
          location: 'New York',
        };
        expect(isValidContactInfo(invalid)).toBe(false);
      });
    });

    describe('isValidExperience', () => {
      it('should validate correct experience', () => {
        const valid = {
          id: '1',
          company: 'Tech Corp',
          position: 'Senior Developer',
          startDate: '2020-01-01',
          location: 'Remote',
          description: ['Built features', 'Led team'],
        };
        expect(isValidExperience(valid)).toBe(true);
      });

      it('should validate with optional fields', () => {
        const valid = {
          id: '1',
          company: 'Tech Corp',
          position: 'Developer',
          startDate: '2020-01-01',
          endDate: '2023-01-01',
          location: 'Remote',
          description: ['Built features'],
          technologies: ['React', 'Node.js'],
        };
        expect(isValidExperience(valid)).toBe(true);
      });

      it('should reject invalid description array', () => {
        const invalid = {
          id: '1',
          company: 'Tech Corp',
          position: 'Developer',
          startDate: '2020-01-01',
          location: 'Remote',
          description: 'Not an array', // should be array
        };
        expect(isValidExperience(invalid)).toBe(false);
      });

      it('should reject non-string items in arrays', () => {
        const invalid = {
          id: '1',
          company: 'Tech Corp',
          position: 'Developer',
          startDate: '2020-01-01',
          location: 'Remote',
          description: ['Valid', 123], // contains non-string
        };
        expect(isValidExperience(invalid)).toBe(false);
      });
    });

    describe('isValidProject', () => {
      it('should validate correct project', () => {
        const valid = {
          id: '1',
          name: 'Cool Project',
          description: 'A cool project',
          technologies: ['React', 'TypeScript'],
        };
        expect(isValidProject(valid)).toBe(true);
      });

      it('should reject empty technologies array', () => {
        const valid = {
          id: '1',
          name: 'Cool Project',
          description: 'A cool project',
          technologies: [],
        };
        expect(isValidProject(valid)).toBe(true); // Empty array is valid
      });

      it('should reject missing required fields', () => {
        const invalid = {
          id: '1',
          name: 'Cool Project',
          // missing description and technologies
        };
        expect(isValidProject(invalid)).toBe(false);
      });
    });

    describe('isValidSkill', () => {
      it('should validate correct skill', () => {
        const valid = {
          category: 'Frontend',
          items: ['React', 'Vue', 'Angular'],
        };
        expect(isValidSkill(valid)).toBe(true);
      });

      it('should validate empty items array', () => {
        const valid = {
          category: 'Backend',
          items: [],
        };
        expect(isValidSkill(valid)).toBe(true);
      });

      it('should reject non-array items', () => {
        const invalid = {
          category: 'Frontend',
          items: 'Not an array',
        };
        expect(isValidSkill(invalid)).toBe(false);
      });
    });

    describe('isValidCVData', () => {
      it('should validate complete CV data', () => {
        const valid = {
          contact: {
            name: 'John Doe',
            title: 'Developer',
            email: 'john@example.com',
            location: 'New York',
          },
          summary: 'Experienced developer',
          experience: [
            {
              id: '1',
              company: 'Tech Corp',
              position: 'Developer',
              startDate: '2020-01-01',
              location: 'Remote',
              description: ['Built features'],
            },
          ],
          education: [
            {
              id: '1',
              institution: 'University',
              degree: 'BS',
              startDate: '2016',
              endDate: '2020',
              location: 'City',
            },
          ],
          projects: [
            {
              id: '1',
              name: 'Project',
              description: 'Description',
              technologies: ['React'],
            },
          ],
          skills: [
            {
              category: 'Frontend',
              items: ['React'],
            },
          ],
        };
        expect(isValidCVData(valid)).toBe(true);
      });

      it('should reject invalid nested data', () => {
        const invalid = {
          contact: {
            name: 'John Doe',
            // missing required fields
          },
          summary: 'Summary',
          experience: [],
          education: [],
          projects: [],
          skills: [],
        };
        expect(isValidCVData(invalid)).toBe(false);
      });
    });
  });

  describe('Utility Functions', () => {
    describe('sortByOrder', () => {
      it('should sort items by order field', () => {
        const items = [
          { name: 'C', order: 3 },
          { name: 'A', order: 1 },
          { name: 'B', order: 2 },
        ];
        
        const sorted = sortByOrder(items);
        expect(sorted[0]?.name).toBe('A');
        expect(sorted[1]?.name).toBe('B');
        expect(sorted[2]?.name).toBe('C');
      });

      it('should handle missing order fields', () => {
        const items = [
          { name: 'B', order: 2 },
          { name: 'A' }, // no order
          { name: 'C', order: 1 },
        ];
        
        const sorted = sortByOrder(items);
        expect(sorted[0]?.name).toBe('A'); // undefined order = 0
        expect(sorted[1]?.name).toBe('C');
        expect(sorted[2]?.name).toBe('B');
      });

      it('should not mutate original array', () => {
        const items = [
          { name: 'B', order: 2 },
          { name: 'A', order: 1 },
        ];
        const original = [...items];
        
        sortByOrder(items);
        expect(items).toEqual(original);
      });
    });

    describe('safeParseJSON', () => {
      it('should parse valid JSON', () => {
        const json = '{"name": "John", "age": 30}';
        const result = safeParseJSON(json, {});
        expect(result).toEqual({ name: 'John', age: 30 });
      });

      it('should return fallback for invalid JSON', () => {
        const invalid = 'not json';
        const fallback = { default: true };
        const result = safeParseJSON(invalid, fallback);
        expect(result).toEqual(fallback);
      });

      it('should handle empty strings', () => {
        const result = safeParseJSON('', null);
        expect(result).toBe(null);
      });
    });

    describe('formatDate', () => {
      it('should format valid dates', () => {
        const result = formatDate('2023-01-15');
        expect(result).toContain('Jan');
        expect(result).toContain('2023');
      });

      it('should return "Present" for undefined', () => {
        const result = formatDate(undefined);
        expect(result).toBe('Present');
      });

      it('should return original string for invalid dates', () => {
        const result = formatDate('invalid-date');
        expect(result).toBe('invalid-date');
      });

      it('should handle ISO date strings', () => {
        const result = formatDate('2023-01-15T00:00:00.000Z');
        expect(result).toContain('2023');
      });
    });

    describe('formatDateRange', () => {
      it('should format date range with end date', () => {
        const result = formatDateRange('2020-01-01', '2023-12-31');
        expect(result).toContain(' - ');
        expect(result).toContain('2020');
        expect(result).toContain('2023');
      });

      it('should format ongoing date range', () => {
        const result = formatDateRange('2020-01-01');
        expect(result).toContain(' - Present');
      });

      it('should handle invalid dates gracefully', () => {
        const result = formatDateRange('invalid', 'also-invalid');
        expect(result).toBe('invalid - also-invalid');
      });
    });
  });
});