/**
 * Negotiation Engine (API Client)
 * Connects to Python Backend
 */

const API_URL = 'http://localhost:8000';

export class NegotiationEngine {

    async startNegotiation(params: any): Promise<any> {
        const response = await fetch(`${API_URL}/negotiation/start`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(params)
        });
        return await response.json();
    }

    async processVendorResponse(sessionId: string, price: number, message: string): Promise<any> {
        const response = await fetch(`${API_URL}/negotiation/response`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ sessionId, price, message })
        });
        return await response.json();
    }

    async getStats(): Promise<any> {
        try {
            const response = await fetch(`${API_URL}/negotiation/stats`);
            return await response.json();
        } catch {
            return {};
        }
    }
}

export const negotiationEngine = new NegotiationEngine();
