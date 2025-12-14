/**
 * Work Product Manager (API Client)
 * Connects to Python Backend
 */

const API_URL = 'http://localhost:8000';

export class WorkProductManager {

    async getRecent(limit: number = 20): Promise<any[]> {
        try {
            const response = await fetch(`${API_URL}/work-products`);
            if (!response.ok) return [];
            return await response.json();
        } catch (error) {
            return [];
        }
    }

    async getWorkProduct(id: string): Promise<any> {
        try {
            const response = await fetch(`${API_URL}/work-products/${id}`);
            if (!response.ok) return null;
            return await response.json();
        } catch (error) {
            return null;
        }
    }
}

export const workProductManager = new WorkProductManager();
