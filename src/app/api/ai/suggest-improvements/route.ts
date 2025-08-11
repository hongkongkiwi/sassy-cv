import { generateObject } from 'ai';
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getAIModel, AIProvider } from '@/lib/ai-providers';
import { auth } from '@clerk/nextjs/server';
import { handleCors, withCors } from '@/lib/cors';
import { enforce, apiRules } from '@/lib/arcjet';

const SuggestionSchema = z.object({
  suggestions: z.array(z.object({
    type: z.enum(['add', 'improve', 'remove', 'reorder']),
    section: z.string(),
    title: z.string(),
    description: z.string(),
    priority: z.enum(['high', 'medium', 'low']),
    estimatedImpact: z.string(),
    example: z.string().optional()
  }))
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

    const body = await request.json();
    const { cvData, targetRole = 'Software Engineer', provider = 'openai' } = body;

    if (!cvData) {
      return withCors(
        NextResponse.json({ error: 'CV data is required' }, { status: 400 }),
        request
      );
    }

    const model = getAIModel(provider as AIProvider);

    const { object } = await generateObject({
      model,
      schema: SuggestionSchema,
      prompt: `
        You are a senior technical recruiter specializing in ${targetRole} positions. 
        Analyze the CV and provide specific, actionable suggestions for improvement.
        
        CV Data:
        ${JSON.stringify(cvData, null, 2)}
        
        Target Role: ${targetRole}
        
        Provide suggestions in these categories:
        - ADD: New content that should be added (missing skills, experiences, projects)
        - IMPROVE: Existing content that needs enhancement
        - REMOVE: Content that is outdated or irrelevant
        - REORDER: Better organization/prioritization of existing content
        
        Focus on:
        1. Technical skill alignment with ${targetRole} requirements
        2. Industry-relevant keywords and technologies
        3. Quantifiable achievements and impact
        4. ATS optimization
        5. Career progression demonstration
        6. Project showcase optimization
        
        Prioritize suggestions by potential impact on landing interviews.
        Provide specific, actionable advice with examples where helpful.
      `,
    });

    return withCors(
      NextResponse.json(object),
      request
    );
  } catch (error) {
    console.error('Error generating suggestions:', error);
    return withCors(
      NextResponse.json(
        { error: 'Failed to generate suggestions' },
        { status: 500 }
      ),
      request
    );
  }
}

export async function OPTIONS(request: NextRequest) {
  return handleCors(request) || new NextResponse(null, { status: 405 });
}