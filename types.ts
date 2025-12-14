export type Model = 'gemini' | 'claude' | 'gpt' | 'qwen';

export type OptimizationGoal =
  | 'Chain-of-Thought Reasoning'
  | 'Creative Ideation & Brainstorming'
  | 'Factual Precision & Detail'
  | 'Role-Playing & Persona Adoption'
  | 'Code Generation & Explanation';

export interface ModelInfo {
  id: Model;
  name: string;
  description: string;
}

export interface Critique {
  text: string;
  clarity: number;
  robustness: number;
  efficiency: number;
}

export type AppState = 'idle' | 'loading' | 'success' | 'error';

export interface Stage1Result {
  reasoning: string;
  prompt: string;
}

export interface Stage2Result {
  reasoning: string;
  prompt: string;
  critique: Critique | null;
}

export interface FullResult {
  stage1: Stage1Result;
  stage2: Stage2Result;
}
