import { generateObject } from 'ai';
import { NextRequest } from 'next/server';
import { z } from 'zod';
import { getAIModel, AIProvider } from '@/lib/ai-providers';
import { auth } from '@clerk/nextjs/server';

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

export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { cvData, provider = 'openai' } = body;

    if (!cvData) {
      return Response.json({ error: 'CV data is required' }, { status: 400 });
    }

    const model = getAIModel(provider as AIProvider);

    const { object } = await generateObject({
      model,
      schema: AnalysisSchema,
      prompt: `
        You are a senior technical recruiter and CV expert specializing in software engineering roles. 
        Analyze the following CV data and provide comprehensive feedback.
        
        Focus on:
        1. Technical depth and relevance
        2. Career progression and impact
        3. ATS optimization for software engineering roles
        4. Industry best practices
        5. Quantifiable achievements
        
        CV Data:
        Contact: ${JSON.stringify(cvData.contact)}
        Summary: ${cvData.summary}
        Experience: ${JSON.stringify(cvData.experience)}
        Skills: ${JSON.stringify(cvData.skills)}
        Projects: ${JSON.stringify(cvData.projects)}
        Education: ${JSON.stringify(cvData.education)}
        
        Provide actionable, specific feedback that will help this software engineer improve their CV.
      `,
    });

    return Response.json(object);
  } catch (error) {
    console.error('Error analyzing CV:', error);
    return Response.json(
      { error: 'Failed to analyze CV' },
      { status: 500 }
    );
  }
}