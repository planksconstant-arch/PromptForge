/**
 * Workflow Detector (API Client)
 * Connects to Python Backend
 */

const API_URL = 'http://localhost:8000';

export class WorkflowDetector {

    async analyzeHistory(history: any[]): Promise<any[]> {
        try {
            const response = await fetch(`${API_URL}/detector/analyze`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(history)
            });
            return await response.json();
        } catch (error) {
            return [];
        }
    }
}

export const workflowDetector = new WorkflowDetector();
