import { generateObject } from 'ai';
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getAIModel, AIProvider } from '@/lib/ai-providers';
import { auth } from '@clerk/nextjs/server';
import { rateLimit, sanitizeInput, validateCVData, sanitizeAIPrompt } from '@/lib/security';
import { handleCors, withCors } from '@/lib/cors';
import { enforce, apiRules } from '@/lib/arcjet';

const AnalysisSchema = z.object({
  overallScore: z.number().min(0).max(100).describe('Overall CV score out of 100'),
  strengths: z.array(z.string()).describe('List of CV strengths'),
  improvements: z.array(z.string()).describe('Specific areas for improvement'),
  missingElements: z.array(z.string()).describe('Important elements missing from the CV'),
  industryAlignment: z.object({
    score: z.number().min(0).max(100),
    feedback: z.string()
  }).describe('How well the CV aligns with software engineering industry standards'),
  keywordOptimization: z.object({
    score: z.number().min(0).max(100),
    suggestions: z.array(z.string())
  }).describe('ATS keyword optimization analysis'),
  sections: z.object({
    summary: z.object({ score: z.number().min(0).max(100), feedback: z.string() }),
    experience: z.object({ score: z.number().min(0).max(100), feedback: z.string() }),
    skills: z.object({ score: z.number().min(0).max(100), feedback: z.string() }),
    projects: z.object({ score: z.number().min(0).max(100), feedback: z.string() }),
    education: z.object({ score: z.number().min(0).max(100), feedback: z.string() })
  }).describe('Individual section analysis')
});

const aiRateLimit = rateLimit({
  windowMs: 5 * 60 * 1000, // 5 minutes
  maxRequests: 10, // 10 requests per 5 minutes
  endpoint: 'ai-analyze-cv',
  identifier: async (req) => {
    const { userId } = await auth();
    return userId || req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || 'unknown';
  },
});

export async function POST(request: NextRequest) {
  // Handle CORS preflight
  const corsResponse = handleCors(request);
  if (corsResponse) return corsResponse;

  try {
    // Arcjet protection
    const ajDecision = await enforce(request, apiRules({ requestsPerMinute: 30 }));
    if (!ajDecision.ok) {
      return withCors(
        NextResponse.json({ error: 'Request blocked' }, { status: 403 }),
        request
      );
    }

    const { userId } = await auth();
    if (!userId) {
      return withCors(
        NextResponse.json({ error: 'Unauthorized' }, { status: 401 }),
        request
      );
    }

    // Apply rate limiting
    const rateLimitResult = await aiRateLimit(request);
    if (!rateLimitResult.success) {
      return withCors(
        NextResponse.json(
          { 
            error: 'Too many requests', 
            retryAfter: rateLimitResult.reset 
          }, 
          { 
            status: 429,
            headers: {
              'X-RateLimit-Limit': String(rateLimitResult.limit),
              'X-RateLimit-Remaining': String(rateLimitResult.remaining),
              'X-RateLimit-Reset': String(rateLimitResult.reset),
            }
          }
        ),
        request
      );
    }

    const body = await request.json();
    const { cvData: rawCvData, provider = 'openai' } = body;
    
    // Sanitize input data
    const cvData = sanitizeInput(rawCvData);

    if (!cvData) {
      return withCors(
        NextResponse.json({ error: 'CV data is required' }, { status: 400 }),
        request
      );
    }
    
    // Validate CV data structure and content
    const validation = validateCVData(cvData);
    if (!validation.valid) {
      return withCors(
        NextResponse.json(
          { error: 'Invalid CV data', details: validation.errors },
          { status: 400 }
        ),
        request
      );
    }
    
    // Validate provider
    const validProviders = ['openai', 'google'];
    if (!validProviders.includes(provider)) {
      return withCors(
        NextResponse.json(
          { error: 'Invalid AI provider' },
          { status: 400 }
        ),
        request
      );
    }

    const model = getAIModel(provider as AIProvider);

    const { object } = await generateObject({
      model,
      schema: AnalysisSchema,
      prompt: sanitizeAIPrompt(`
        You are a senior technical recruiter and CV expert specializing in software engineering roles. 
        Analyze the following CV data and provide comprehensive feedback.
        
        Focus on:
        1. Technical depth and relevance
        2. Career progression and impact
        3. ATS optimization for software engineering roles
        4. Industry best practices
        5. Quantifiable achievements
        
        CV Data:
        Contact: ${JSON.stringify(cvData.contact || {})}
        Summary: ${cvData.summary || 'Not provided'}
        Experience: ${JSON.stringify(cvData.experience || [])}
        Skills: ${JSON.stringify(cvData.skills || [])}
        Projects: ${JSON.stringify(cvData.projects || [])}
        Education: ${JSON.stringify(cvData.education || [])}
        
        Provide actionable, specific feedback that will help this software engineer improve their CV.
      `),
    });

    return withCors(
      NextResponse.json(object, {
        headers: {
          'X-RateLimit-Limit': String(rateLimitResult.limit),
          'X-RateLimit-Remaining': String(rateLimitResult.remaining),
          'X-RateLimit-Reset': String(rateLimitResult.reset),
        }
      }),
      request
    );
  } catch (error) {
    // Log error safely without exposing sensitive details
    console.error('Error analyzing CV:', error instanceof Error ? error.message : 'Unknown error');
    return withCors(
      NextResponse.json(
        { error: 'Failed to analyze CV' },
        { status: 500 }
      ),
      request
    );
  }
}

export async function OPTIONS(request: NextRequest) {
  return handleCors(request) || new NextResponse(null, { status: 405 });
}