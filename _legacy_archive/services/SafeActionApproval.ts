/**
 * Safe Action Approval (API Client)
 * Connects to Python Backend
 */

const API_URL = 'http://localhost:8000';

export class SafeActionApproval {

    async requestApproval(type: string, description: string, details: any): Promise<string> {
        try {
            const response = await fetch(`${API_URL}/approval/request`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ type, description, details })
            });
            const data = await response.json();
            return data.id;
        } catch (error) {
            throw new Error("Approval service unavailable");
        }
    }

    async approveAction(actionId: string, method: string): Promise<boolean> {
        try {
            const response = await fetch(`${API_URL}/approval/approve`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action_id: actionId, method })
            });
            const data = await response.json();
            return data.success;
        } catch (error) {
            return false;
        }
    }

    async getPendingActions(): Promise<any[]> {
        try {
            const response = await fetch(`${API_URL}/approval/pending`);
            if (!response.ok) return [];
            return await response.json();
        } catch (error) {
            return [];
        }
    }
}

export const safeActionApproval = new SafeActionApproval();
