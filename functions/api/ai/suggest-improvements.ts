export const onRequestPost: PagesFunction = async ({ request, env }) => {
  try {
    const { cvData, targetRole = 'Software Engineer', provider = 'openai' } = await request.json();
    if (!cvData) {
      return new Response(JSON.stringify({ error: 'CV data is required' }), { status: 400 });
    }

    const prompt = `You are a senior technical recruiter specializing in ${targetRole} positions. 
Analyze the CV and provide specific, actionable suggestions for improvement in JSON only with key "suggestions" which is an array of {type, section, title, description, priority, estimatedImpact, example?}.
CV Data: ${JSON.stringify(cvData, null, 2)}`;

    if (provider === 'openai') {
      const apiKey = env.OPENAI_API_KEY as string | undefined;
      if (!apiKey) return new Response(JSON.stringify({ error: 'OPENAI_API_KEY not configured' }), { status: 500 });
      const resp = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST', headers: { 'Authorization': `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: 'gpt-4o-mini',
          messages: [
            { role: 'system', content: 'Output strict JSON only.' },
            { role: 'user', content: prompt }
          ],
          temperature: 0.2
        })
      });
      const data = await resp.json();
      const text = data?.choices?.[0]?.message?.content || '{"suggestions":[]}';
      return new Response(text, { status: 200, headers: { 'Content-Type': 'application/json' } });
    } else {
      const apiKey = env.GOOGLE_GENERATIVE_AI_API_KEY as string | undefined;
      if (!apiKey) return new Response(JSON.stringify({ error: 'GOOGLE_GENERATIVE_AI_API_KEY not configured' }), { status: 500 });
      const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`;
      const resp = await fetch(geminiUrl, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contents: [{ parts: [{ text: `Output strict JSON only.\n${prompt}` }] }] })
      });
      const data = await resp.json();
      const text = data?.candidates?.[0]?.content?.parts?.[0]?.text || '{"suggestions":[]}';
      return new Response(text, { status: 200, headers: { 'Content-Type': 'application/json' } });
    }
  } catch (err) {
    return new Response(JSON.stringify({ error: 'Failed to generate suggestions' }), { status: 500 });
  }
};
