/**
 * Conversational Agent Builder (API Client)
 * Connects to Python Backend
 */

const API_URL = 'http://localhost:8000';

export interface BuilderState {
    phase: string;
    conversationHistory: any[];
    collectedInfo: any;
    proposedSpec?: any;
}

export class ConversationalAgentBuilder {

    async startConversation(description: string): Promise<BuilderState> {
        try {
            const response = await fetch(`${API_URL}/builder/start`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ description })
            });

            if (!response.ok) throw new Error('Failed to start conversation');
            return await response.json();
        } catch (error) {
            console.error('Builder Start Error:', error);
            throw error;
        }
    }

    async continueConversation(state: BuilderState, message: string): Promise<BuilderState> {
        try {
            const response = await fetch(`${API_URL}/builder/continue`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ state, message })
            });

            if (!response.ok) throw new Error('Failed to continue conversation');
            return await response.json();
        } catch (error) {
            console.error('Builder Continue Error:', error);
            throw error;
        }
    }
}

export const conversationalAgentBuilder = new ConversationalAgentBuilder();
