export const onRequestPost: PagesFunction = async ({ request, env }) => {
  try {
    const { cvData, provider = 'openai' } = await request.json();
    if (!cvData) {
      return new Response(JSON.stringify({ error: 'CV data is required' }), { status: 400 });
    }

    // Compose prompt
    const prompt = `You are a senior technical recruiter and CV expert specializing in software engineering roles. 
Analyze the CV and return a concise JSON object with the following keys:
{
  "overallScore": number 0-100,
  "strengths": string[],
  "improvements": string[],
  "missingElements": string[],
  "industryAlignment": { "score": number 0-100, "feedback": string },
  "keywordOptimization": { "score": number 0-100, "suggestions": string[] },
  "sections": {
    "summary": { "score": number 0-100, "feedback": string },
    "experience": { "score": number 0-100, "feedback": string },
    "skills": { "score": number 0-100, "feedback": string },
    "projects": { "score": number 0-100, "feedback": string },
    "education": { "score": number 0-100, "feedback": string }
  }
}
Only return JSON, no prose.
CV Data: ${JSON.stringify(cvData, null, 2)}
`;

    const useOpenAI = provider === 'openai';

    if (useOpenAI) {
      const apiKey = env.OPENAI_API_KEY as string | undefined;
      if (!apiKey) return new Response(JSON.stringify({ error: 'OPENAI_API_KEY not configured' }), { status: 500 });

      const resp = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          model: 'gpt-4o-mini',
          messages: [
            { role: 'system', content: 'You output strict JSON only.' },
            { role: 'user', content: prompt }
          ],
          temperature: 0.2
        })
      });

      const data = await resp.json();
      const text = data?.choices?.[0]?.message?.content || '{}';
      return new Response(text, { status: 200, headers: { 'Content-Type': 'application/json' } });
    } else {
      const apiKey = env.GOOGLE_GENERATIVE_AI_API_KEY as string | undefined;
      if (!apiKey) return new Response(JSON.stringify({ error: 'GOOGLE_GENERATIVE_AI_API_KEY not configured' }), { status: 500 });

      const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`;
      const resp = await fetch(geminiUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: `You output strict JSON only.\n${prompt}` }] }]
        })
      });
      const data = await resp.json();
      const text = data?.candidates?.[0]?.content?.parts?.[0]?.text || '{}';
      return new Response(text, { status: 200, headers: { 'Content-Type': 'application/json' } });
    }
  } catch (err) {
    return new Response(JSON.stringify({ error: 'Failed to analyze CV' }), { status: 500 });
  }
};
