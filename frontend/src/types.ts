export type LLMModel = 'Utama' | 'claude-3-5-sonnet' | 'gpt-4o' | 'gpt-4o-mini';

export type AppLanguage = 'id' | 'en';

export type AppPhase = 'hero' | 'clarification' | 'bento';

export interface PRDSections {
  summary: string;
  features: string;
  tech: string;
  design: string;
  prompts: string;
}

export type SectionKey = keyof PRDSections;

export interface ColorSwatch {
  name: string;
  hex: string;
}

export interface PRDHistoryItem {
  id: string;
  createdAt: number;
  idea: string;
  model: LLMModel;
  sections: PRDSections;
}

export interface ClarificationTurn {
  question: string;
  answer: string;
}

export type QuestionCategory = 'workflow' | 'tech_stack' | 'design';

export interface NextQuestion {
  category?: QuestionCategory;
  question: string;
  suggestedOptions: string[];
}

export interface DesignInspiration {
  urlReference?: string;
  imagePreviewUrl?: string;
  extractedColors: string[];
}

export interface ClarifyInterviewResponse {
  readinessScore: number;
  isSufficient: boolean;
  aiObservation: string;
  nextQuestion?: NextQuestion;
}

export interface StreamMeta {
  provider: string;
  requestedModel: string;
  effectiveModel: string;
}


