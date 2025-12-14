/**
 * RL Engine (API Client)
 * Connects to Python Backend
 */

const API_URL = 'http://localhost:8000';

export class RLEngine {

    async recordReward(actionId: string, value: number, context: string): Promise<void> {
        await fetch(`${API_URL}/rl/reward`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ actionId, value, context })
        });
    }

    async applyPositiveReward(actionId: string, context: string): Promise<void> {
        await this.recordReward(actionId, 1.0, context);
    }

    async applyNegativeReward(actionId: string, context: string): Promise<void> {
        await this.recordReward(actionId, -0.5, context);
    }

    async selectAction(actions: string[], context: string): Promise<string> {
        const response = await fetch(`${API_URL}/rl/select`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ actions, context })
        });
        const data = await response.json();
        return data.action;
    }

    async getStats(): Promise<any> {
        try {
            const response = await fetch(`${API_URL}/rl/stats`);
            return await response.json();
        } catch {
            return {};
        }
    }
}

export const rlEngine = new RLEngine();
