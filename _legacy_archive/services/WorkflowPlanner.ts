/**
 * Workflow Planner (API Client)
 * Connects to Python Backend
 */

const API_URL = 'http://localhost:8000';

export interface WorkflowPlan {
    workflow: any;
    reasoning: string;
    estimatedDuration: number;
    complexity: 'simple' | 'moderate' | 'complex';
    requiredCapabilities: string[];
}

export class WorkflowPlanner {

    async planWorkflow(description: string, options: any = {}): Promise<WorkflowPlan> {
        try {
            const response = await fetch(`${API_URL}/workflow/plan`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    description,
                    options
                })
            });

            if (!response.ok) {
                const err = await response.json();
                throw new Error(err.detail || 'Planning Failed');
            }
            return await response.json();
        } catch (error) {
            console.error('Workflow Planning Error:', error);
            // Return fallback
            return {
                workflow: { id: 'error', nodes: [], connections: [], startNode: '' },
                reasoning: 'Failed to connect to backend planner',
                estimatedDuration: 0,
                complexity: 'simple',
                requiredCapabilities: []
            };
        }
    }
}

export const workflowPlanner = new WorkflowPlanner();
