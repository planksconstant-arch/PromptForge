/**
 * Workflow Generator (API Client)
 * Connects to Python Backend
 */

const API_URL = 'http://localhost:8000';

export const WorkflowGenerator = {
    async generateWorkflow(description: string): Promise<any> {
        const response = await fetch(`${API_URL}/workflow/generate_n8n`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ description })
        });
        return await response.json();
    }
};
