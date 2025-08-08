import { generateText } from 'ai';
import { NextRequest } from 'next/server';
import { getAIModel, AIProvider } from '@/lib/ai-providers';
import { auth } from '@clerk/nextjs/server';

export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { 
      section, 
      content, 
      instructions = '', 
      provider = 'openai',
      tone = 'professional',
      length = 'similar' 
    } = body;

    if (!section || !content) {
      return Response.json({ error: 'Section and content are required' }, { status: 400 });
    }

    const model = getAIModel(provider as AIProvider);

    let prompt = '';

    switch (section) {
      case 'summary':
        prompt = `
          You are a professional CV writer specializing in software engineering roles. 
          Rewrite the following professional summary to be more compelling and ATS-optimized.
          
          Original summary: "${content}"
          
          Requirements:
          - Tone: ${tone}
          - Length: ${length === 'shorter' ? 'Make it more concise' : length === 'longer' ? 'Expand with more details' : 'Keep similar length'}
          - Focus on technical expertise, leadership, and quantifiable achievements
          - Include relevant keywords for software engineering roles
          - Make it impactful and results-oriented
          
          Additional instructions: ${instructions}
          
          Return only the rewritten summary, no explanations.
        `;
        break;

      case 'experience':
        prompt = `
          You are a professional CV writer. Rewrite the following job experience description to be more impactful.
          
          Original description: ${Array.isArray(content) ? content.join(' ') : content}
          
          Requirements:
          - Tone: ${tone}
          - Length: ${length === 'shorter' ? 'Make it more concise' : length === 'longer' ? 'Add more technical details' : 'Keep similar length'}
          - Use action verbs and quantifiable achievements
          - Focus on technical impact and business value
          - Make each point specific and results-oriented
          - Format as bullet points if multiple responsibilities
          
          Additional instructions: ${instructions}
          
          Return only the rewritten description(s), no explanations.
        `;
        break;

      case 'project':
        prompt = `
          You are a professional CV writer. Rewrite the following project description to showcase technical skills and impact.
          
          Original description: "${content}"
          
          Requirements:
          - Tone: ${tone}
          - Length: ${length === 'shorter' ? 'Make it more concise' : length === 'longer' ? 'Add more technical details' : 'Keep similar length'}
          - Highlight technical challenges solved
          - Mention technologies used effectively
          - Show measurable impact or results
          - Make it compelling for technical recruiters
          
          Additional instructions: ${instructions}
          
          Return only the rewritten project description, no explanations.
        `;
        break;

      case 'skills':
        prompt = `
          You are a professional CV writer. Optimize the following skills section for ATS and recruiter appeal.
          
          Original skills: ${JSON.stringify(content)}
          
          Requirements:
          - Organize skills logically by category
          - Include industry-standard terminology
          - Prioritize in-demand technologies
          - Remove outdated or irrelevant skills
          - Ensure ATS keyword optimization
          
          Additional instructions: ${instructions}
          
          Return only the optimized skills structure, no explanations.
        `;
        break;

      default:
        prompt = `
          Rewrite the following CV content to be more professional and impactful:
          
          Original: "${content}"
          
          Requirements:
          - Tone: ${tone}
          - Length: ${length}
          - Make it more compelling and professional
          
          Additional instructions: ${instructions}
          
          Return only the rewritten content, no explanations.
        `;
    }

    const { text } = await generateText({
      model,
      prompt,
    });

    return Response.json({ rewrittenContent: text.trim() });
  } catch (error) {
    console.error('Error rewriting section:', error);
    return Response.json(
      { error: 'Failed to rewrite section' },
      { status: 500 }
    );
  }
}