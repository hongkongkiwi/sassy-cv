import { generateObject } from 'ai';
import { NextRequest } from 'next/server';
import { z } from 'zod';
import { getAIModel, AIProvider } from '@/lib/ai-providers';
import { auth } from '@clerk/nextjs/server';

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
  try {
    const { userId } = await auth();
    if (!userId) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { cvData, targetRole = 'Software Engineer', provider = 'openai' } = body;

    if (!cvData) {
      return Response.json({ error: 'CV data is required' }, { status: 400 });
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

    return Response.json(object);
  } catch (error) {
    console.error('Error generating suggestions:', error);
    return Response.json(
      { error: 'Failed to generate suggestions' },
      { status: 500 }
    );
  }
}