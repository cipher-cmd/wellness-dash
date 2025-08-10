// Simple AI helper using OpenRouter or Groq if keys provided via Vite env

type AIProvider = 'openrouter' | 'groq' | null;

const openRouterKey = import.meta.env.VITE_OPENROUTER_API_KEY as
  | string
  | undefined;
const groqKey = import.meta.env.VITE_GROQ_API_KEY as string | undefined;

function getProvider(): AIProvider {
  if (openRouterKey) return 'openrouter';
  if (groqKey) return 'groq';
  return null;
}

export async function generateMealIdeas(prompt: string): Promise<string> {
  const provider = getProvider();
  if (!provider) {
    // Fallback canned response when no key is configured
    return 'Configure VITE_OPENROUTER_API_KEY or VITE_GROQ_API_KEY to enable AI meal ideas.';
  }

  try {
    if (provider === 'openrouter') {
      const resp = await fetch(
        'https://openrouter.ai/api/v1/chat/completions',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${openRouterKey}`,
            'HTTP-Referer':
              typeof window !== 'undefined'
                ? window.location.origin
                : 'http://localhost',
            'X-Title': 'WellnessDash',
          },
          body: JSON.stringify({
            model: 'openrouter/auto',
            messages: [
              {
                role: 'system',
                content:
                  'You are a helpful nutrition assistant. Keep responses concise with bullet points.',
              },
              { role: 'user', content: prompt },
            ],
            temperature: 0.7,
          }),
        }
      );
      if (!resp.ok) {
        const errText = await resp.text();
        console.error('OpenRouter error', resp.status, errText);
        return 'AI request failed (OpenRouter). Check your key and referrer.';
      }
      const data = await resp.json();
      const text = data?.choices?.[0]?.message?.content?.trim();
      return text || 'No response received.';
    }

    if (provider === 'groq') {
      const resp = await fetch(
        'https://api.groq.com/openai/v1/chat/completions',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${groqKey}`,
          },
          body: JSON.stringify({
            model: 'llama3-8b-8192',
            messages: [
              {
                role: 'system',
                content:
                  'You are a helpful nutrition assistant. Keep responses concise with bullet points.',
              },
              { role: 'user', content: prompt },
            ],
            temperature: 0.7,
          }),
        }
      );
      if (!resp.ok) {
        const errText = await resp.text();
        console.warn(
          'Groq not OK (likely CORS in browser):',
          resp.status,
          errText
        );
        return 'AI request failed (Groq). Use OpenRouter in browser or call Groq server-side.';
      }
      const data = await resp.json();
      const text = data?.choices?.[0]?.message?.content?.trim();
      return text || 'No response received.';
    }

    return 'AI provider not available.';
  } catch (err) {
    console.error('AI request failed', err);
    return 'AI request failed.';
  }
}
