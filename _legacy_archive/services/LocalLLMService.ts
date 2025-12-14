/**
 * Local LLM Service (API Client)
 * Connects to Python Backend
 */

const API_URL = 'http://localhost:8000';

export interface LLMResponse {
    text: string;
    provider: string;
    model: string;
    tokensUsed?: number;
    latencyMs: number;
}

export interface ModelInfo {
    name: string;
    size: string;
    modified: string;
    available: boolean;
}

export class LocalLLMService {
    async generate(prompt: string, options: any = {}): Promise<LLMResponse> {
        try {
            const response = await fetch(`${API_URL}/llm/generate`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ prompt, options })
            });

            if (!response.ok) throw new Error('Generate Failed');
            return await response.json();
        } catch (error) {
            console.error('LLM Generate Error:', error);
            // Fallback mock
            return {
                text: "Backend unavailable. Please ensure yaprompt_python is running.",
                provider: "error",
                model: "error",
                latencyMs: 0
            };
        }
    }

    async listModels(): Promise<ModelInfo[]> {
        try {
            const response = await fetch(`${API_URL}/llm/models`);
            if (!response.ok) return [];
            return await response.json();
        } catch (error) {
            return [];
        }
    }
}

export const localLLMService = new LocalLLMService();
