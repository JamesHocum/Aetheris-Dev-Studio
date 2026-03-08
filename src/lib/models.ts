export interface AIModel {
  id: string;
  name: string;
  provider: string;
  description: string;
  features: string[];
  tier: 'flagship' | 'balanced' | 'fast' | 'economy' | 'creative';
}

export const AI_MODELS: AIModel[] = [
  // Google Gemini Family
  {
    id: 'google/gemini-2.5-pro',
    name: 'Gemini 2.5 Pro',
    provider: 'Google',
    description: 'Top-tier reasoning with multimodal + big context',
    features: ['Vision', '128K Context', 'Complex Reasoning'],
    tier: 'flagship',
  },
  {
    id: 'google/gemini-3.1-pro-preview',
    name: 'Gemini 3.1 Pro Preview',
    provider: 'Google',
    description: 'Next-gen reasoning model preview',
    features: ['Latest Gen', 'Advanced Reasoning', 'Preview'],
    tier: 'flagship',
  },
  {
    id: 'google/gemini-3-flash-preview',
    name: 'Gemini 3 Flash Preview',
    provider: 'Google',
    description: 'Fast next-gen balanced speed & capability',
    features: ['Next Gen', 'Fast', 'Balanced'],
    tier: 'balanced',
  },
  {
    id: 'google/gemini-2.5-flash',
    name: 'Gemini 2.5 Flash',
    provider: 'Google',
    description: 'Balanced cost, latency, and multimodal reasoning',
    features: ['Fast', 'Multimodal', 'Cost-Effective'],
    tier: 'balanced',
  },
  {
    id: 'google/gemini-2.5-flash-lite',
    name: 'Gemini 2.5 Flash Lite',
    provider: 'Google',
    description: 'Fastest & cheapest for simple workloads',
    features: ['Fastest', 'Cheapest', 'Simple Tasks'],
    tier: 'economy',
  },
  {
    id: 'google/gemini-3-pro-image-preview',
    name: 'Gemini 3 Pro Image',
    provider: 'Google',
    description: 'Next-gen image generation model',
    features: ['Image Gen', 'Next Gen', 'Creative'],
    tier: 'creative',
  },
  // OpenAI Family
  {
    id: 'openai/gpt-5',
    name: 'GPT-5',
    provider: 'OpenAI',
    description: 'Powerful all-rounder with exceptional accuracy',
    features: ['Long Context', 'Multimodal', 'Top Reasoning'],
    tier: 'flagship',
  },
  {
    id: 'openai/gpt-5.2',
    name: 'GPT-5.2',
    provider: 'OpenAI',
    description: 'Latest with enhanced reasoning capabilities',
    features: ['Latest', 'Enhanced Reasoning', 'Complex Tasks'],
    tier: 'flagship',
  },
  {
    id: 'openai/gpt-5-mini',
    name: 'GPT-5 Mini',
    provider: 'OpenAI',
    description: 'Strong performance at lower cost & latency',
    features: ['Low Latency', 'Affordable', 'Reliable'],
    tier: 'balanced',
  },
  {
    id: 'openai/gpt-5-nano',
    name: 'GPT-5 Nano',
    provider: 'OpenAI',
    description: 'Speed & cost optimized for high-volume tasks',
    features: ['Fastest', 'Budget', 'High Volume'],
    tier: 'economy',
  },
];

export const DEFAULT_MODEL = 'google/gemini-3-flash-preview';

export function getModelById(id: string): AIModel | undefined {
  return AI_MODELS.find(m => m.id === id);
}

export function getModelsByTier(tier: AIModel['tier']): AIModel[] {
  return AI_MODELS.filter(m => m.tier === tier);
}
