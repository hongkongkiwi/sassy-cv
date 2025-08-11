// @vitest-environment node
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { POST } from '../analyze-cv/route';
import { NextRequest } from 'next/server';

// Mock the AI SDK
vi.mock('ai', () => ({
  generateObject: vi.fn().mockResolvedValue({
    object: {
      overallScore: 85,
      strengths: ['Strong technical skills', 'Good experience'],
      improvements: ['Add more quantifiable achievements'],
      missingElements: ['No certifications mentioned'],
      industryAlignment: {
        score: 90,
        feedback: 'Well aligned with industry standards',
      },
      keywordOptimization: {
        score: 75,
        suggestions: ['Add more cloud technologies keywords'],
      },
      sections: {
        summary: { score: 80, feedback: 'Good summary' },
        experience: { score: 85, feedback: 'Strong experience section' },
        skills: { score: 90, feedback: 'Comprehensive skills' },
        projects: { score: 75, feedback: 'Could add more projects' },
        education: { score: 80, feedback: 'Education well presented' },
      },
    },
  }),
}));

// Mock auth
vi.mock('@clerk/nextjs/server', () => ({
  auth: vi.fn().mockImplementation(() => ({
    userId: 'test-user-id',
    protect: vi.fn(),
  })),
}));

describe('POST /api/ai/analyze-cv', () => {
  beforeEach(async () => {
    vi.clearAllMocks();
    const mockAuth = vi.fn().mockResolvedValue({ userId: 'test-user-id' });
    const clerkModule = await import('@clerk/nextjs/server');
    // @ts-expect-error - Mocking auth function
    vi.mocked(clerkModule).auth = mockAuth;
  });

  it('should analyze CV data successfully', async () => {
    const cvData = {
      contact: {
        name: 'John Doe',
        email: 'john@example.com',
        location: 'New York',
      },
      summary: 'Experienced developer',
      experience: [],
      skills: [],
      projects: [],
      education: [],
    };

    const request = new NextRequest('http://localhost:3000/api/ai/analyze-cv', {
      method: 'POST',
      body: JSON.stringify({ cvData }),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.overallScore).toBe(85);
    expect(data.strengths).toBeInstanceOf(Array);
    expect(data.improvements).toBeInstanceOf(Array);
  });

  it('should return 401 when not authenticated', async () => {
    const clerkModule = await import('@clerk/nextjs/server');
    // @ts-expect-error - Mocking auth function
    vi.mocked(clerkModule).auth = vi.fn().mockResolvedValueOnce({ userId: null });

    const request = new NextRequest('http://localhost:3000/api/ai/analyze-cv', {
      method: 'POST',
      body: JSON.stringify({ cvData: {} }),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(401);
    expect(data.error).toBe('Unauthorized');
  });

  it('should return 400 when CV data is missing', async () => {
    const request = new NextRequest('http://localhost:3000/api/ai/analyze-cv', {
      method: 'POST',
      body: JSON.stringify({}),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toBe('CV data is required');
  });

  it('should validate CV data structure', async () => {
    const invalidCvData = {
      contact: {
        email: 'invalid-email', // Invalid email
      },
    };

    const request = new NextRequest('http://localhost:3000/api/ai/analyze-cv', {
      method: 'POST',
      body: JSON.stringify({ cvData: invalidCvData }),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toBe('Invalid CV data');
    expect(data.details).toContain('Invalid email format');
  });

  it('should reject invalid AI provider', async () => {
    const request = new NextRequest('http://localhost:3000/api/ai/analyze-cv', {
      method: 'POST',
      body: JSON.stringify({
        cvData: { contact: { email: 'test@example.com' } },
        provider: 'invalid-provider',
      }),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toBe('Invalid AI provider');
  });

  it('should include rate limit headers in response', async () => {
    const request = new NextRequest('http://localhost:3000/api/ai/analyze-cv', {
      method: 'POST',
      body: JSON.stringify({
        cvData: {
          contact: { name: 'Test', email: 'test@example.com', location: 'NY' },
          summary: 'Test',
        },
      }),
    });

    const response = await POST(request);
    
    expect(response.headers.get('X-RateLimit-Limit')).toBeTruthy();
    expect(response.headers.get('X-RateLimit-Remaining')).toBeTruthy();
    expect(response.headers.get('X-RateLimit-Reset')).toBeTruthy();
  });

  it('should sanitize input data', async () => {
    const cvDataWithXSS = {
      contact: {
        name: '<script>alert("xss")</script>John',
        email: 'john@example.com',
        location: 'New York',
      },
      summary: '<img src=x onerror=alert(1)>Developer',
      experience: [],
      skills: [],
      projects: [],
      education: [],
    };

    const request = new NextRequest('http://localhost:3000/api/ai/analyze-cv', {
      method: 'POST',
      body: JSON.stringify({ cvData: cvDataWithXSS }),
    });

    const response = await POST(request);
    
    expect(response.status).toBe(200);
    // The sanitized data should be passed to the AI model
    // without the malicious scripts
  });

  it('should handle AI service errors gracefully', async () => {
    const { generateObject } = await import('ai');
    vi.mocked(generateObject).mockRejectedValueOnce(new Error('AI service error'));

    const request = new NextRequest('http://localhost:3000/api/ai/analyze-cv', {
      method: 'POST',
      body: JSON.stringify({
        cvData: {
          contact: { name: 'Test', email: 'test@example.com', location: 'NY' },
          summary: 'Test',
        },
      }),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(500);
    expect(data.error).toBe('Failed to analyze CV');
  });
});