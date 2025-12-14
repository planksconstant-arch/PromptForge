/**
 * Writing Style Engine (API Client)
 * Connects to Python Backend
 */

const API_URL = 'http://localhost:8000';

export class WritingStyleEngine {

    async learnFromCorrection(original: string, edited: string): Promise<void> {
        try {
            await fetch(`${API_URL}/style/learn`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ original, edited })
            });
        } catch (error) {
            console.error('Style Learn Error:', error);
        }
    }

    async getStyleSummary(): Promise<any> {
        try {
            const response = await fetch(`${API_URL}/style/summary`);
            if (!response.ok) return {};
            return await response.json();
        } catch (error) {
            return {};
        }
    }
}

export const writingStyleEngine = new WritingStyleEngine();
