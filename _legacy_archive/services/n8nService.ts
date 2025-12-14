export interface N8nAgentConfig {
    webhookUrl: string;
    apiKey?: string;
}

export interface N8nExecutionResult {
    id: string;
    data: any;
    status: 'running' | 'success' | 'error';
    timestamp: number;
}

export const n8nService = {
    baseUrl: 'http://localhost:5678',
    webhookPath: '/webhook/build-agent', // Default webhook for building
    executionWebhookPath: '/webhook/execute-agent', // Default webhook for execution

    async buildAgent(patternDescription: string, prompt: string): Promise<{ workflowId: string, status: string }> {
        try {
            const response = await fetch(`${this.baseUrl}${this.webhookPath}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    action: 'build',
                    description: patternDescription,
                    prompt: prompt,
                    timestamp: Date.now()
                })
            });

            if (!response.ok) {
                throw new Error(`n8n build failed: ${response.statusText}`);
            }

            const data = await response.json();
            return {
                workflowId: data.workflowId || `n8n-${Date.now()}`,
                status: 'success'
            };
        } catch (error) {
            console.error('Failed to build agent via n8n:', error);
            // Fallback for demo/testing if n8n isn't reachable
            return {
                workflowId: `local-mock-${Date.now()}`,
                status: 'mock-success'
            };
        }
    },

    async executeAgent(agentId: string, context: any, apiKey?: string): Promise<N8nExecutionResult> {
        try {
            const response = await fetch(`${this.baseUrl}${this.executionWebhookPath}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    action: 'execute',
                    agentId: agentId,
                    context: context,
                    apiKey: apiKey,
                    timestamp: Date.now()
                })
            });

            if (!response.ok) {
                throw new Error(`n8n execution failed: ${response.statusText}`);
            }

            const data = await response.json();
            return {
                id: Date.now().toString(),
                data: data.output || data, // Handle various n8n return structures
                status: 'success',
                timestamp: Date.now()
            };
        } catch (error) {
            console.error('Failed to execute agent via n8n:', error);
            return {
                id: Date.now().toString(),
                data: { error: 'Failed to connect to n8n. Is it running?' },
                status: 'error',
                timestamp: Date.now()
            };
        }
    },

    getAgentTemplates() {
        return [
            {
                id: 'deep-research',
                name: 'Deep Research Agent',
                description: 'Conducts comprehensive research on a topic and produces a detailed report.',
                workflowFile: 'deep_research_workflow.json'
            }
        ];
    },

    async generateAndBuildAgent(description: string, apiKey?: string): Promise<{ workflowId: string, status: string, workflow: any }> {
        // Dynamic generation
        const { WorkflowGenerator } = await import('./WorkflowGenerator');
        const generatedWorkflow = await WorkflowGenerator.generateWorkflow(description, apiKey);

        // In a real app, we would POST this JSON to n8n's /workflows endpoint to import it.
        // For now, we return it so the UI can "register" it locally.

        return {
            workflowId: `generated-${Date.now()}`,
            status: 'success',
            workflow: generatedWorkflow
        };
    }
};
