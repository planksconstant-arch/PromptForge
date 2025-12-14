/**
 * Prompt Auto Optimizer (API Client)
 * Connects to Python Backend
 */

const API_URL = 'http://localhost:8000';

export class PromptAutoOptimizer {

    async optimizePrompt(prompt: string, options: any = {}): Promise<any> {
        const response = await fetch(`${API_URL}/optimizer/optimize`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ prompt, options })
        });
        return await response.json();
    }

    async getPreview(prompt: string): Promise<string> {
        try {
            const result = await this.optimizePrompt(prompt, { goal: 'Quick fix' });
            return result.optimized.substring(0, 100) + '...';
        } catch {
            return 'Preview unavailable';
        }
    }
}

export const promptAutoOptimizer = new PromptAutoOptimizer();
