export interface PersonaProfile {
  id: string;
  name: string;
  tagline: string;
  avatarIcon?: string;
  toneSummary: string;
  casingStyle: string;
  punctuationStyle: string;
  slangVocabulary: string[];
  directnessScore: number; // 1-100
  formalityScore: number; // 1-100
  empathyScore: number; // 1-100
  thinkingFramework: string[];
  signatureCatchphrases: string[];
  forbiddenBehaviors: string[];
  compiledSystemInstruction: string;
  sampleReferenceData: string;
  testQuestions: string[];
  createdAt: string;
  isPreset?: boolean;
  visibility?: 'public' | 'private';
  userRelationship?: string;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'model';
  content: string;
  timestamp: string;
  fidelityScore?: number;
  fidelityReason?: string;
}

export interface BenchmarkComparison {
  question: string;
  baseResponse: string;
  replicaResponse: string;
  analysis: string;
  fidelityScore: number;
}
