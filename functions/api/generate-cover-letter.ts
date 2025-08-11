export const onRequestPost: PagesFunction = async ({ request, env }) => {
  try {
    const { cvData, jobDescription, company, position, provider = 'openai' } = await request.json();
    if (!cvData || !jobDescription) {
      return new Response(JSON.stringify({ error: 'CV data and job description are required' }), { status: 400 });
    }

    const prompt = `You are a professional cover letter writer. Generate a compelling, personalized cover letter. Use contact info, recent experience and skills. Keep to 3-4 paragraphs, end with a strong closing. Job description follows.\nCV: ${JSON.stringify(cvData)}\nCompany: ${company || 'The Company'}\nPosition: ${position || 'The Position'}\nJob Description: ${jobDescription}`;

    if (provider === 'openai') {
      const apiKey = env.OPENAI_API_KEY as string | undefined;
      if (!apiKey) return new Response(JSON.stringify({ error: 'OPENAI_API_KEY not configured' }), { status: 500 });
      const resp = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST', headers: { 'Authorization': `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ model: 'gpt-4o-mini', messages: [ { role: 'user', content: prompt } ], temperature: 0.7 })
      });
      const data = await resp.json();
      const text = data?.choices?.[0]?.message?.content || '';
      return new Response(JSON.stringify({ coverLetter: text }), { status: 200, headers: { 'Content-Type': 'application/json' } });
    } else {
      const apiKey = env.GOOGLE_GENERATIVE_AI_API_KEY as string | undefined;
      if (!apiKey) return new Response(JSON.stringify({ error: 'GOOGLE_GENERATIVE_AI_API_KEY not configured' }), { status: 500 });
      const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent`;
      const resp = await fetch(geminiUrl, {
        method: 'POST', headers: { 'Content-Type': 'application/json', 'x-goog-api-key': apiKey },
        body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] })
      });
      const data = await resp.json();
      const text = data?.candidates?.[0]?.content?.parts?.[0]?.text || '';
      return new Response(JSON.stringify({ coverLetter: text }), { status: 200, headers: { 'Content-Type': 'application/json' } });
    }
  } catch (err) {
    return new Response(JSON.stringify({ error: 'Failed to generate cover letter' }), { status: 500 });
  }
};
