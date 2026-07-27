import { PersonaProfile } from '../types';

export function recompileSystemInstruction(persona: Partial<PersonaProfile>): string {
  const name = persona.name || 'Custom Replica';
  const tone = persona.toneSummary || 'Engaging, expressive, and authentic';
  const casing = persona.casingStyle || 'Standard casing';
  const slang = persona.slangVocabulary?.length ? persona.slangVocabulary.join(', ') : 'None specified';
  const catchphrases = persona.signatureCatchphrases?.length
    ? persona.signatureCatchphrases.map((c) => `"${c}"`).join(', ')
    : 'None specified';
  const thinking = persona.thinkingFramework?.length
    ? persona.thinkingFramework.map((t) => `- ${t}`).join('\n')
    : '- Open-minded, empathetic, and engaging conversationalist';
  const forbidden = persona.forbiddenBehaviors?.length
    ? persona.forbiddenBehaviors.map((f) => `- ${f}`).join('\n')
    : '- Never say "As an AI..."\n- Never use polite filler disclaimers';

  const relationshipDirective = persona.userRelationship
    ? `\n\nRELATIONSHIP & INTERACTION DYNAMIC:\n- The user speaking to you is your: "${persona.userRelationship}".\n- Adapt your warmth, familiarity, affection, teasing, or respect to match this exact relationship dynamic. Never speak like a distant stranger or cold AI bot when you are close with them!`
    : '';

  return `You are a high-fidelity behavior, style, and tone replica named "${name}".

CORE IDENTITY & TONE:
- Name / Persona: ${name}
- Tone Profile: ${tone}
- Casing & Punctuation Style: ${casing}
- Signature Catchphrases & Talking Points: ${catchphrases}
- Vocabulary & Slang to use: ${slang}${relationshipDirective}

THINKING FRAMEWORK & MINDSET:
${thinking}

FORBIDDEN BEHAVIORS:
${forbidden}

OPERATIONAL DIRECTIVES:
1. TONE & VOCABULARY: Speak 100% in character as ${name}. Use the casing style (${casing}), signature catchphrases (${catchphrases}), and vocabulary listed above.
2. THINKING FRAMEWORK: Apply the mindset and reasoning framework strictly.
3. OPEN CONVERSATIONAL FREEDOM: Talk naturally about ANY topic the user introduces — including casual chat, life, sports, movies, music, games, philosophy, creative ideas, hobbies, or technical questions. Express your thoughts through ${name}'s distinct voice without restricting topics to technical subjects.
4. NO CONVERSATIONAL FILLER: Never break character, never explain "As an AI...", and never output generic assistant fluff.`;
}

