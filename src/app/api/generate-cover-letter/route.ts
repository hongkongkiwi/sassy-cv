import { NextRequest, NextResponse } from 'next/server';
import { openai } from '@ai-sdk/openai';
import { google } from '@ai-sdk/google';
import { generateText } from 'ai';
import { auth } from '@clerk/nextjs/server';
import { rateLimit, sanitizeInput, sanitizeAIPrompt } from '@/lib/security';
import { handleCors, withCors } from '@/lib/cors';
import { enforce, apiRules } from '@/lib/arcjet';

const coverLetterRateLimit = rateLimit({
  windowMs: 5 * 60 * 1000, // 5 minutes
  maxRequests: 5, // 5 requests per 5 minutes (cover letters are more expensive)
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
    const ajDecision = await enforce(request, apiRules({ requestsPerMinute: 10 }));
    if (!ajDecision.ok) {
      return withCors(NextResponse.json({ error: 'Request blocked' }, { status: 403 }), request);
    }

    // Check authentication
    const { userId } = await auth();
    if (!userId) {
      return withCors(NextResponse.json({ error: 'Unauthorized' }, { status: 401 }), request);
    }

    // Apply rate limiting
    const rateLimitResult = await coverLetterRateLimit(request);
    if (!rateLimitResult.success) {
      return withCors(NextResponse.json(
        { 
          error: 'Rate limit exceeded. Please try again later.',
          retryAfter: rateLimitResult.retryAfter 
        }, 
        { status: 429 }
      ), request);
    }

    const body = await request.json();
    const { cvData, jobDescription, company, position, provider = 'openai' } = body;

    // Sanitize inputs
    const sanitizedJobDescription = sanitizeInput(jobDescription);
    const sanitizedCompany = sanitizeInput(company);
    const sanitizedPosition = sanitizeInput(position);

    if (!cvData || !jobDescription) {
      return withCors(NextResponse.json({ error: 'CV data and job description are required' }, { status: 400 }), request);
    }

    // Choose AI provider
    const model = provider === 'google' ? google('gemini-1.5-flash') : openai('gpt-4o-mini');

    // Sanitize and prepare the prompt
    const promptData = {
      name: sanitizeInput(cvData.contactInfo?.name || 'Your Name'),
      title: sanitizeInput(cvData.contactInfo?.title || 'Professional'),
      summary: sanitizeInput(cvData.contactInfo?.summary || ''),
      email: sanitizeInput(cvData.contactInfo?.email || 'email@example.com'),
      phone: sanitizeInput(cvData.contactInfo?.phone || ''),
      location: sanitizeInput(cvData.contactInfo?.location || ''),
    };

    const prompt = sanitizeAIPrompt(`You are a professional cover letter writer. Generate a compelling, personalized cover letter based on the following information:

**CV Data:**
Name: ${promptData.name}
Title: ${promptData.title}
Summary: ${promptData.summary}
Email: ${promptData.email}
Phone: ${promptData.phone}
Location: ${promptData.location}

**Recent Experience:**
${cvData.experiences?.slice(0, 3).map((exp: any, index: number) => 
  `${index + 1}. ${sanitizeInput(exp.position)} at ${sanitizeInput(exp.company)} (${sanitizeInput(exp.startDate)} - ${sanitizeInput(exp.endDate || 'Present')})
  ${sanitizeInput(exp.description?.[0] || '')}`
).join('\n') || 'No experience data provided'}

**Skills:**
${cvData.skills?.map((skill: any) => `${sanitizeInput(skill.category)}: ${skill.items.map((item: string) => sanitizeInput(item)).join(', ')}`).join('\n') || 'No skills data provided'}

**Job Information:**
Company: ${sanitizedCompany || 'The Company'}
Position: ${sanitizedPosition || 'The Position'}

**Job Description:**
${sanitizedJobDescription}

**Instructions:**
1. Write a professional cover letter that is engaging and specific to this role
2. Highlight relevant experience and skills that match the job requirements
3. Show enthusiasm for the company and position
4. Keep it concise (3-4 paragraphs)
5. Use a professional but personable tone
6. Include specific examples from the CV that demonstrate qualifications
7. Address the hiring manager professionally (use "Dear Hiring Manager" if no name provided)
8. End with a strong call to action

**Format:**
- Include proper business letter formatting
- Use the person's contact information as the header
- Include the date
- Address to the company
- Professional closing

Generate only the cover letter content without any additional commentary or explanations.`);

    const { text } = await generateText({
      model,
      prompt,
      temperature: 0.7,
    });

    return withCors(NextResponse.json({ coverLetter: text }), request);
  } catch (error: any) {
    console.error('Cover letter generation error:', error);
    
    if (error?.message?.includes('API key')) {
      return withCors(NextResponse.json(
        { error: 'AI service configuration error. Please check API keys.' },
        { status: 500 }
      ), request);
    }
    
    return withCors(NextResponse.json(
      { error: 'Failed to generate cover letter. Please try again.' },
      { status: 500 }
    ), request);
  }
}

export async function GET(request: NextRequest) {
  return withCors(NextResponse.json({ message: 'Cover Letter Generator API' }), request);
}

export async function OPTIONS(request: NextRequest) {
  return handleCors(request) || new NextResponse(null, { status: 200 });
}