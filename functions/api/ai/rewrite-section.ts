export const onRequestPost: PagesFunction = async ({ request, env }) => {
  try {
    const body = await request.json();
    const { section, content, instructions = '', provider = 'openai', tone = 'professional', length = 'similar' } = body;
    if (!section || !content) return new Response(JSON.stringify({ error: 'Section and content are required' }), { status: 400 });

    const prompt = `Rewrite the ${section} content. Requirements: tone=${tone}, length=${length}. ${instructions}\nOriginal: ${Array.isArray(content) ? content.join(' ') : content}. Return only the rewritten text.`;

    if (provider === 'openai') {
      const apiKey = env.OPENAI_API_KEY as string | undefined;
      if (!apiKey) return new Response(JSON.stringify({ error: 'OPENAI_API_KEY not configured' }), { status: 500 });
      const resp = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: 'gpt-4o-mini',
          messages: [
            { role: 'system', content: 'Return only the rewritten text.' },
            { role: 'user', content: prompt }
          ],
          temperature: 0.7
        })
      });
      const data = await resp.json();
      const text = data?.choices?.[0]?.message?.content || '';
      return new Response(JSON.stringify({ rewrittenContent: text.trim() }), { status: 200, headers: { 'Content-Type': 'application/json' } });
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
      return new Response(JSON.stringify({ rewrittenContent: text.trim() }), { status: 200, headers: { 'Content-Type': 'application/json' } });
    }
  } catch (err) {
    return new Response(JSON.stringify({ error: 'Failed to rewrite content' }), { status: 500 });
  }
};
