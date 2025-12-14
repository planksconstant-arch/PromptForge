/**
 * Agent Execution Engine (API Client)
 * Connects to Python Backend
 */

const API_URL = 'http://localhost:8000';

export interface ExecutionProgress {
    agentId: string;
    currentStep: number;
    totalSteps: number;
    stepName: string;
    status: 'running' | 'completed' | 'error';
    message?: string;
}

export class AgentExecutionEngine {
    private progressCallbacks: Map<string, (progress: ExecutionProgress) => void> = new Map();

    async executeAgent(agentConfig: any, input: any, apiKey?: string): Promise<any> {
        try {
            // Emulate start progress
            this.updateProgress(agentConfig.id, {
                agentId: agentConfig.id,
                currentStep: 0,
                totalSteps: agentConfig.steps.length,
                stepName: 'Initializing',
                status: 'running',
                message: 'Starting execution on Python backend...'
            });

            const response = await fetch(`${API_URL}/agent/execute`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ agentConfig, input, apiKey })
            });

            if (!response.ok) throw new Error("Execution failed");

            const result = await response.json();

            this.updateProgress(agentConfig.id, {
                agentId: agentConfig.id,
                currentStep: agentConfig.steps.length,
                totalSteps: agentConfig.steps.length,
                stepName: 'Complete',
                status: 'completed',
                message: 'Finished'
            });

            return result;
        } catch (error) {
            this.updateProgress(agentConfig.id, {
                agentId: agentConfig.id,
                currentStep: 0,
                totalSteps: agentConfig.steps.length,
                stepName: 'Error',
                status: 'error',
                message: String(error)
            });
            throw error;
        }
    }

    onProgress(agentId: string, callback: (progress: ExecutionProgress) => void): void {
        this.progressCallbacks.set(agentId, callback);
    }

    private updateProgress(agentId: string, progress: ExecutionProgress): void {
        const callback = this.progressCallbacks.get(agentId);
        if (callback) callback(progress);
    }
}

export const agentExecutionEngine = new AgentExecutionEngine();
