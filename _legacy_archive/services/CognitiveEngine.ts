/**
 * Cognitive Engine (API Client)
 * Connects to Python Backend
 */

const API_URL = 'http://localhost:8000';

export interface PredictedNeed {
    type: 'study' | 'review' | 'practice' | 'break' | 'reminder';
    description: string;
    priority: number;
    timing: number;
    reason: string;
}

export class CognitiveEngine {

    async predictNeeds(context: any): Promise<PredictedNeed[]> {
        try {
            const response = await fetch(`${API_URL}/cognitive/needs`);
            if (!response.ok) return [];
            return await response.json();
        } catch (error) {
            console.error('Predict Needs Error:', error);
            return [];
        }
    }
}

export const cognitiveEngine = new CognitiveEngine();
