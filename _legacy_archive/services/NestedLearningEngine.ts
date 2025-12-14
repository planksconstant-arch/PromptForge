/**
 * Nested Learning Engine (API Client)
 * Connects to Python Backend
 */

const API_URL = 'http://localhost:8000';

export class NestedLearningEngine {

    async processData(data: any, context?: string): Promise<any[]> {
        try {
            const response = await fetch(`${API_URL}/learning/process?context=${context || ''}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data)
            });
            if (!response.ok) return [];
            return await response.json();
        } catch (error) {
            console.error('Learning Process Error:', error);
            return [];
        }
    }

    async detectPatterns(minConfidence: number = 0.7): Promise<any[]> {
        try {
            const response = await fetch(`${API_URL}/learning/patterns?confidence=${minConfidence}`);
            if (!response.ok) return [];
            return await response.json();
        } catch (error) {
            return [];
        }
    }
}

export const nestedLearningEngine = new NestedLearningEngine();
