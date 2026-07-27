/**
 * Security & Data Isolation Utility
 * 1. Local PII Sanitization & Scrubbing (Emails, Phones, SSNs, API Keys, IPs, Passwords)
 * 2. Prompt Injection Neutralization & XML Delimiter Escaping
 */

export interface PIIScrubReport {
  originalText: string;
  cleanText: string;
  totalRedacted: number;
  details: {
    emails: number;
    phones: number;
    apiKeys: number;
    creditCards: number;
    ssns: number;
    ipAddresses: number;
    passwords: number;
  };
}

export interface InjectionCheckResult {
  isSafe: boolean;
  containsInjectionAttempt: boolean;
  neutralizedText: string;
  detectedThreats: string[];
}

// 1. PII Regex Scrubber
export function scrubPIIFromText(text: string): PIIScrubReport {
  if (!text) {
    return {
      originalText: '',
      cleanText: '',
      totalRedacted: 0,
      details: { emails: 0, phones: 0, apiKeys: 0, creditCards: 0, ssns: 0, ipAddresses: 0, passwords: 0 }
    };
  }

  let cleanText = text;

  // Patterns
  const emailRegex = /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}\b/gi;
  const phoneRegex = /\b(?:\+?\d{1,3}[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}\b/g;
  const apiKeyRegex = /(?:sk-[a-zA-Z0-9]{20,}|ghp_[a-zA-Z0-9]{20,}|AIza[0-9A-Za-z-_]{35}|bearer\s+[a-zA-Z0-9._-]{20,})/gi;
  const creditCardRegex = /\b(?:\d[ -]*?){13,16}\b/g;
  const ssnRegex = /\b\d{3}-\d{2}-\d{4}\b/g;
  const ipRegex = /\b(?:[0-9]{1,3}\.){3}[0-9]{1,3}\b/g;
  const passwordRegex = /(?:password|passwd|secret|auth_token)\s*[:=]\s*['"]?([^\s'"]+)['"]?/gi;

  const emailsMatch = text.match(emailRegex) || [];
  const phonesMatch = text.match(phoneRegex) || [];
  const apiKeysMatch = text.match(apiKeyRegex) || [];
  const cardsMatch = text.match(creditCardRegex) || [];
  const ssnsMatch = text.match(ssnRegex) || [];
  const ipsMatch = text.match(ipRegex) || [];
  const passMatch = text.match(passwordRegex) || [];

  cleanText = cleanText
    .replace(emailRegex, '[REDACTED_EMAIL]')
    .replace(phoneRegex, '[REDACTED_PHONE]')
    .replace(apiKeyRegex, '[REDACTED_API_KEY]')
    .replace(ssnRegex, '[REDACTED_SSN]')
    .replace(ipRegex, '[REDACTED_IP]')
    .replace(passwordRegex, 'password: [REDACTED_SECRET]');

  // Additional scrub for potential 16-digit CCs
  cleanText = cleanText.replace(creditCardRegex, (match) => {
    // Only replace if digits count is 13 to 16
    const digits = match.replace(/\D/g, '');
    if (digits.length >= 13 && digits.length <= 16) {
      return '[REDACTED_CARD]';
    }
    return match;
  });

  const totalRedacted =
    emailsMatch.length +
    phonesMatch.length +
    apiKeysMatch.length +
    cardsMatch.length +
    ssnsMatch.length +
    ipsMatch.length +
    passMatch.length;

  return {
    originalText: text,
    cleanText,
    totalRedacted,
    details: {
      emails: emailsMatch.length,
      phones: phonesMatch.length,
      apiKeys: apiKeysMatch.length,
      creditCards: cardsMatch.length,
      ssns: ssnsMatch.length,
      ipAddresses: ipsMatch.length,
      passwords: passMatch.length
    }
  };
}

// 2. Prompt Injection Neutralizer & XML Tag Escaper
export function sanitizePromptInput(input: string): InjectionCheckResult {
  if (!input) {
    return { isSafe: true, containsInjectionAttempt: false, neutralizedText: '', detectedThreats: [] };
  }

  const injectionPatterns = [
    /ignore (?:all )?(?:previous|above|system) (?:instructions|rules|directives)/i,
    /disregard (?:all )?(?:previous|above|system) (?:instructions|rules)/i,
    /you are now (?:DAN|unrestricted|godmode|developer mode)/i,
    /bypass (?:all )?filters/i,
    /print (?:out )?(?:the )?(?:system|raw) prompt/i,
    /show me your (?:system|hidden) (?:instructions|prompt)/i,
    /<\/?[a-z_]+>/i // XML injection tags
  ];

  const detectedThreats: string[] = [];

  for (const pattern of injectionPatterns) {
    if (pattern.test(input)) {
      detectedThreats.push(pattern.source);
    }
  }

  // Escape XML delimiter tags to prevent breaking context boundaries
  let neutralizedText = input
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');

  // Neutralize explicit override instructions
  neutralizedText = neutralizedText
    .replace(/ignore (?:all )?(?:previous|above|system) (?:instructions|rules|directives)/gi, '[NEUTRALIZED_INJECTION_ATTEMPT]')
    .replace(/you are now DAN/gi, '[NEUTRALIZED_ROLEPLAY_OVERRIDE]')
    .replace(/print (?:out )?(?:the )?(?:system|raw) prompt/gi, '[NEUTRALIZED_PROMPT_LEAK_REQUEST]');

  const containsInjectionAttempt = detectedThreats.length > 0;

  return {
    isSafe: !containsInjectionAttempt,
    containsInjectionAttempt,
    neutralizedText,
    detectedThreats
  };
}
