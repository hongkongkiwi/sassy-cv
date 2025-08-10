import { generateText } from 'ai';
import { NextRequest, NextResponse } from 'next/server';
import { getAIModel, AIProvider } from '@/lib/ai-providers';
import { auth } from '@clerk/nextjs/server';
import { rateLimit, sanitizeInput, sanitizeAIPrompt } from '@/lib/security';

const rewriteRateLimit = rateLimit({
  windowMs: 5 * 60 * 1000, // 5 minutes
  maxRequests: 20, // 20 requests per 5 minutes (more lenient for rewrites)
  identifier: async (req) => {
    const { userId } = await auth();
    return userId || req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || 'unknown';
  },
});

export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Apply rate limiting
    const rateLimitResult = await rewriteRateLimit(request);
    if (!rateLimitResult.success) {
      return NextResponse.json(
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
      );
    }

    const body = await request.json();
    const rawData = sanitizeInput(body);
    const { 
      section, 
      content, 
      instructions = '', 
      provider = 'openai',
      tone = 'professional',
      length = 'similar' 
    } = rawData;

    if (!section || !content) {
      return NextResponse.json({ error: 'Section and content are required' }, { status: 400 });
    }
    
    // Validate inputs
    const validSections = ['summary', 'experience', 'project', 'skills', 'education', 'other'];
    const validProviders = ['openai', 'google'];
    const validTones = ['professional', 'casual', 'technical', 'executive'];
    const validLengths = ['shorter', 'similar', 'longer'];
    
    if (!validSections.includes(section)) {
      return NextResponse.json({ error: 'Invalid section type' }, { status: 400 });
    }
    
    if (!validProviders.includes(provider)) {
      return NextResponse.json({ error: 'Invalid AI provider' }, { status: 400 });
    }
    
    if (!validTones.includes(tone)) {
      return NextResponse.json({ error: 'Invalid tone setting' }, { status: 400 });
    }
    
    if (!validLengths.includes(length)) {
      return NextResponse.json({ error: 'Invalid length setting' }, { status: 400 });
    }
    
    // Limit content length to prevent abuse
    const maxContentLength = 5000;
    const contentString = Array.isArray(content) ? content.join(' ') : String(content);
    if (contentString.length > maxContentLength) {
      return NextResponse.json(
        { error: `Content exceeds maximum length of ${maxContentLength} characters` },
        { status: 400 }
      );
    }

    const model = getAIModel(provider as AIProvider);

    let prompt = '';

    switch (section) {
      case 'summary':
        prompt = sanitizeAIPrompt(`
          You are a professional CV writer specializing in software engineering roles. 
          Rewrite the following professional summary to be more compelling and ATS-optimized.
          
          Original summary: "${content}"
          
          Requirements:
          - Tone: ${tone}
          - Length: ${length === 'shorter' ? 'Make it more concise' : length === 'longer' ? 'Expand with more details' : 'Keep similar length'}
          - Focus on technical expertise, leadership, and quantifiable achievements
          - Include relevant keywords for software engineering roles
          - Make it impactful and results-oriented
          
          Additional instructions: ${instructions || 'None'}
          
          Return only the rewritten summary, no explanations.
        `);
        break;

      case 'experience':
        prompt = sanitizeAIPrompt(`
          You are a professional CV writer. Rewrite the following job experience description to be more impactful.
          
          Original description: ${Array.isArray(content) ? content.join(' ') : content}
          
          Requirements:
          - Tone: ${tone}
          - Length: ${length === 'shorter' ? 'Make it more concise' : length === 'longer' ? 'Add more technical details' : 'Keep similar length'}
          - Use action verbs and quantifiable achievements
          - Focus on technical impact and business value
          - Make each point specific and results-oriented
          - Format as bullet points if multiple responsibilities
          
          Additional instructions: ${instructions || 'None'}
          
          Return only the rewritten description(s), no explanations.
        `);
        break;

      case 'project':
        prompt = sanitizeAIPrompt(`
          You are a professional CV writer. Rewrite the following project description to showcase technical skills and impact.
          
          Original description: "${content}"
          
          Requirements:
          - Tone: ${tone}
          - Length: ${length === 'shorter' ? 'Make it more concise' : length === 'longer' ? 'Add more technical details' : 'Keep similar length'}
          - Highlight technical challenges solved
          - Mention technologies used effectively
          - Show measurable impact or results
          - Make it compelling for technical recruiters
          
          Additional instructions: ${instructions || 'None'}
          
          Return only the rewritten project description, no explanations.
        `);
        break;

      case 'skills':
        prompt = sanitizeAIPrompt(`
          You are a professional CV writer. Optimize the following skills section for ATS and recruiter appeal.
          
          Original skills: ${JSON.stringify(content)}
          
          Requirements:
          - Organize skills logically by category
          - Include industry-standard terminology
          - Prioritize in-demand technologies
          - Remove outdated or irrelevant skills
          - Ensure ATS keyword optimization
          
          Additional instructions: ${instructions || 'None'}
          
          Return only the optimized skills structure, no explanations.
        `);
        break;

      default:
        prompt = sanitizeAIPrompt(`
          Rewrite the following CV content to be more professional and impactful:
          
          Original: "${content}"
          
          Requirements:
          - Tone: ${tone}
          - Length: ${length}
          - Make it more compelling and professional
          
          Additional instructions: ${instructions || 'None'}
          
          Return only the rewritten content, no explanations.
        `);
    }

    const { text } = await generateText({
      model,
      prompt,
    });

    return NextResponse.json(
      { rewrittenContent: text.trim() },
      {
        headers: {
          'X-RateLimit-Limit': String(rateLimitResult.limit),
          'X-RateLimit-Remaining': String(rateLimitResult.remaining),
          'X-RateLimit-Reset': String(rateLimitResult.reset),
        }
      }
    );
  } catch (error) {
    // Log error safely without exposing sensitive details
    console.error('Error rewriting section:', error instanceof Error ? error.message : 'Unknown error');
    return NextResponse.json(
      { error: 'Failed to rewrite section' },
      { status: 500 }
    );
  }
}