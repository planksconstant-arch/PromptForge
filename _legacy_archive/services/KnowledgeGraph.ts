/**
 * Knowledge Graph (API Client)
 * Connects to Python Backend
 */

const API_URL = 'http://localhost:8000';

export class KnowledgeGraph {

    async addNode(node: any): Promise<any> {
        try {
            const response = await fetch(`${API_URL}/knowledge/nodes`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(node)
            });
            return await response.json();
        } catch (error) {
            console.error('Add Node Error:', error);
            return null;
        }
    }

    async search(term: string, limit: number = 20): Promise<any[]> {
        try {
            const response = await fetch(`${API_URL}/knowledge/search?q=${term}&limit=${limit}`);
            if (!response.ok) return [];
            return await response.json();
        } catch (error) {
            return [];
        }
    }

    async getStats(): Promise<any> {
        try {
            const response = await fetch(`${API_URL}/knowledge/stats`);
            if (!response.ok) return {};
            return await response.json();
        } catch (error) {
            return {};
        }
    }
}

export const knowledgeGraph = new KnowledgeGraph();
