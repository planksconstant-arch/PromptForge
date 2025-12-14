import { type ModelInfo, type OptimizationGoal } from './types';

export const MODELS: ModelInfo[] = [
  {
    id: 'gemini',
    name: 'Google Gemini',
    description: "Multimodal tasks, complex reasoning.",
  },
  {
    id: 'claude',
    name: 'Anthropic Claude',
    description: 'Safety, ethics, conversational nuance.',
  },
  {
    id: 'gpt',
    name: 'OpenAI GPT-4o',
    description: 'Powerful generalist, deep knowledge.',
  },
  {
    id: 'qwen',
    name: 'Alibaba Qwen',
    description: 'Asian languages & cultural contexts.',
  }
];
export const OPTIMIZATION_GOALS: OptimizationGoal[] = [
  'Chain-of-Thought Reasoning',
  'Creative Ideation & Brainstorming',
  'Factual Precision & Detail',
  'Role-Playing & Persona Adoption',
  'Code Generation & Explanation',
];