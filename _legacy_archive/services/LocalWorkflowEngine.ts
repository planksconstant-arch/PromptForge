/**
 * Local Workflow Engine (API Client)
 * Connects to Python Backend
 */

const API_URL = 'http://localhost:8000';

export interface WorkflowExecutionResult {
    executionId: string;
    status: 'success' | 'error' | 'partial';
    output: any;
    executionTime: number;
    nodesExecuted: number;
    totalNodes: number;
    error?: string;
    nodeResults: Map<string, any>;
}

export class LocalWorkflowEngine {

    async executeWorkflow(workflow: any, input: any, apiKey?: string): Promise<WorkflowExecutionResult> {
        try {
            const response = await fetch(`${API_URL}/workflow/execute`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    workflow,
                    input,
                    api_key: apiKey
                })
            });

            if (!response.ok) {
                const err = await response.json();
                throw new Error(err.detail || 'Execution Failed');
            }
            return await response.json();
        } catch (error) {
            console.error('Workflow Execution Error:', error);
            throw error;
        }
    }
}

export const localWorkflowEngine = new LocalWorkflowEngine();
