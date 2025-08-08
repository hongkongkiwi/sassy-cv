import { NextRequest, NextResponse } from 'next/server';
import { openai } from '@ai-sdk/openai';
import { google } from '@ai-sdk/google';
import { generateText } from 'ai';

export async function POST(request: NextRequest) {
  try {
    const { cvData, jobDescription, company, position, provider = 'openai' } = await request.json();

    if (!cvData || !jobDescription) {
      return NextResponse.json({ error: 'CV data and job description are required' }, { status: 400 });
    }

    // Choose AI provider
    const model = provider === 'google' ? google('gemini-1.5-flash') : openai('gpt-4o-mini');

    const prompt = `You are a professional cover letter writer. Generate a compelling, personalized cover letter based on the following information:

**CV Data:**
Name: ${cvData.contactInfo?.name || 'Your Name'}
Title: ${cvData.contactInfo?.title || 'Professional'}
Summary: ${cvData.contactInfo?.summary || ''}
Email: ${cvData.contactInfo?.email || 'email@example.com'}
Phone: ${cvData.contactInfo?.phone || ''}
Location: ${cvData.contactInfo?.location || ''}

**Recent Experience:**
${cvData.experiences?.slice(0, 3).map((exp: any, index: number) => 
  `${index + 1}. ${exp.position} at ${exp.company} (${exp.startDate} - ${exp.endDate || 'Present'})
  ${exp.description?.[0] || ''}`
).join('\n') || 'No experience data provided'}

**Skills:**
${cvData.skills?.map((skill: any) => `${skill.category}: ${skill.items.join(', ')}`).join('\n') || 'No skills data provided'}

**Job Information:**
Company: ${company || 'The Company'}
Position: ${position || 'The Position'}

**Job Description:**
${jobDescription}

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

Generate only the cover letter content without any additional commentary or explanations.`;

    const { text } = await generateText({
      model,
      prompt,
      temperature: 0.7,
    });

    return NextResponse.json({ coverLetter: text });
  } catch (error: any) {
    console.error('Cover letter generation error:', error);
    
    if (error?.message?.includes('API key')) {
      return NextResponse.json(
        { error: 'AI service configuration error. Please check API keys.' },
        { status: 500 }
      );
    }
    
    return NextResponse.json(
      { error: 'Failed to generate cover letter. Please try again.' },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json({ message: 'Cover Letter Generator API' });
}