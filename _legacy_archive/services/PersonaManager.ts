/**
 * Persona Manager (API Client)
 * Connects to Python Backend
 */

const API_URL = 'http://localhost:8000';

export class PersonaManager {

    async getCurrentProfile(): Promise<any> {
        try {
            const response = await fetch(`${API_URL}/persona/current`);
            if (!response.ok) throw new Error('Failed to get persona');
            return await response.json();
        } catch (error) {
            console.error('Get Persona Error:', error);
            return { mode: 'business', name: 'Business' }; // Fallback
        }
    }

    async switchMode(mode: string): Promise<boolean> {
        try {
            const response = await fetch(`${API_URL}/persona/switch`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ mode })
            });
            return response.ok;
        } catch (error) {
            return false;
        }
    }

    async getAllPersonas(): Promise<any[]> {
        try {
            const response = await fetch(`${API_URL}/persona/all`);
            if (!response.ok) return [];
            return await response.json();
        } catch (error) {
            return [];
        }
    }
}

export const personaManager = new PersonaManager();
