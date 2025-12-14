/**
 * AI Operating System (API Client)
 * Connects to Python Backend
 */

const API_URL = 'http://localhost:8000';

export class AIOperatingSystem {

    async getSystemStatus(): Promise<any> {
        try {
            const response = await fetch(`${API_URL}/os/status`);
            if (!response.ok) return { isActive: false };
            return await response.json();
        } catch (error) {
            return { isActive: false };
        }
    }

    async processCommand(command: string): Promise<string> {
        try {
            const response = await fetch(`${API_URL}/os/command`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ command })
            });

            if (!response.ok) return "Error processing command.";
            const data = await response.json();
            return data.response;
        } catch (error) {
            return "Failed to connect to AI OS.";
        }
    }

    async initialize() {
        console.log("AI OS Client Initialized against Python Backend");
    }
}

export const aiOS = new AIOperatingSystem();
