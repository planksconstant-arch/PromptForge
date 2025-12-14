/**
 * Teammate Engine (API Client)
 * Connects to Python Backend
 */

const API_URL = 'http://localhost:8000';

export class TeammateEngine {

    async generateProactiveSuggestions(context: any): Promise<any[]> {
        try {
            const response = await fetch(`${API_URL}/teammate/suggestions`);
            if (!response.ok) return [];
            return await response.json();
        } catch (error) {
            return [];
        }
    }

    async provideHelp(context: string): Promise<string> {
        // Simple client-side fallback or call to OS command
        return "I can help via the AI OS command line.";
    }
}

export const teammateEngine = new TeammateEngine();
