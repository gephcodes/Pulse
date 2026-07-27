import { PersonaProfile } from '../types';

async function fetchWithRetry(url: string, options: RequestInit, retries = 3, delay = 2000): Promise<Response> {
  for (let i = 0; i < retries; i++) {
    try {
      const res = await fetch(url, options);
      if (res.status === 429 && i < retries - 1) {
        console.warn(`Hit rate limit (429) on ${url}. Retrying in ${delay / 1000}s...`);
        await new Promise((r) => setTimeout(r, delay));
        delay *= 1.5;
        continue;
      }
      return res;
    } catch (err) {
      if (i < retries - 1) {
        await new Promise((r) => setTimeout(r, delay));
        delay *= 1.5;
        continue;
      }
      throw err;
    }
  }
  return fetch(url, options);
}

export async function analyzePersonaFromText(referenceText: string, nameHint?: string): Promise<PersonaProfile> {
  const response = await fetchWithRetry('/api/analyze-persona', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ referenceText, nameHint })
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || 'Failed to analyze reference text.');
  }

  const data = await response.json();
  return data.profile;
}

export async function generatePersonaReply(
  persona: PersonaProfile,
  userMessage: string,
  history: Array<{ role: 'user' | 'model'; content: string }>,
  temperature: number = 0.85
): Promise<{ reply: string; fidelityScore: number; fidelityReason: string }> {
  const response = await fetchWithRetry('/api/chat-persona', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      systemInstruction: persona.compiledSystemInstruction,
      history,
      userMessage,
      temperature,
      userRelationship: persona.userRelationship
    })
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || 'Failed to generate chat response.');
  }

  return response.json();
}

export async function benchmarkPersonaContrast(
  persona: PersonaProfile,
  question: string
): Promise<{
  question: string;
  baseResponse: string;
  replicaResponse: string;
  analysis: string;
  fidelityScore: number;
}> {
  const response = await fetchWithRetry('/api/benchmark-persona', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      systemInstruction: persona.compiledSystemInstruction,
      question
    })
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || 'Failed to benchmark contrast.');
  }

  return response.json();
}

export async function generateGeminiSpeech(text: string, voiceName: string = 'Zephyr'): Promise<string> {
  const response = await fetchWithRetry('/api/tts', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ text, voiceName })
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || 'Failed to synthesize speech.');
  }

  const data = await response.json();
  return `data:audio/mp3;base64,${data.audioBase64}`;
}
