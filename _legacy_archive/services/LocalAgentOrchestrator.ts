/**
 * Local Agent Orchestrator
 * Central controller for managing agent lifecycle, execution routing, and work products
 */

import { AgentConfig, AgentExecutionEngine, agentExecutionEngine, WorkProduct } from './AgentExecutionEngine';
import { LocalWorkflowEngine, localWorkflowEngine, Workflow } from './LocalWorkflowEngine';
import { WorkflowPlanner, workflowPlanner, PlanningOptions } from './WorkflowPlanner';
import { WorkProductManager, workProductManager } from './WorkProductManager';

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

export type ExecutionStrategy = 'workflow' | 'direct' | 'auto';

export interface StoredAgent {
    id: string;
    name: string;
    description: string;
    type: 'workflow' | 'config';  // workflow-based or config-based (AgentExecutionEngine)
    workflow?: Workflow;
    config?: AgentConfig;
    metadata: {
        createdAt: number;
        lastModified: number;
        lastExecuted?: number;
        executionCount: number;
        successCount: number;
        averageExecutionTime?: number;
    };
}

export interface ExecutionRequest {
    agentId: string;
    input: any;
    strategy?: ExecutionStrategy;
    apiKey?: string;
}

export interface ExecutionResult {
    success: boolean;
    workProduct?: WorkProduct;
    error?: string;
}

// ============================================================================
// LOCAL AGENT ORCHESTRATOR
// ============================================================================

export class LocalAgentOrchestrator {
    private readonly AGENTS_STORAGE_KEY = 'local_agents';
    private workflowEngine: LocalWorkflowEngine;
    private executionEngine: AgentExecutionEngine;
    private planner: WorkflowPlanner;
    private workProductManager: WorkProductManager;

    constructor() {
        this.workflowEngine = localWorkflowEngine;
        this.executionEngine = agentExecutionEngine;
        this.planner = workflowPlanner;
        this.workProductManager = workProductManager;
    }

    // ========== AGENT MANAGEMENT ==========

    /**
     * Create a new agent from natural language description
     */
    async createAgentFromDescription(
        description: string,
        name?: string,
        options?: PlanningOptions
    ): Promise<StoredAgent> {
        // Use workflow planner to generate workflow
        const plan = await this.planner.planWorkflow(description, options);

        const agent: StoredAgent = {
            id: `agent-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            name: name || plan.workflow.name,
            description: plan.workflow.description,
            type: 'workflow',
            workflow: plan.workflow,
            metadata: {
                createdAt: Date.now(),
                lastModified: Date.now(),
                executionCount: 0,
                successCount: 0
            }
        };

        await this.saveAgent(agent);
        return agent;
    }

    /**
     * Create agent from AgentConfig
     */
    async createAgentFromConfig(config: AgentConfig): Promise<StoredAgent> {
        const agent: StoredAgent = {
            id: config.id,
            name: config.name,
            description: config.description,
            type: 'config',
            config,
            metadata: {
                createdAt: Date.now(),
                lastModified: Date.now(),
                executionCount: 0,
                successCount: 0
            }
        };

        await this.saveAgent(agent);
        return agent;
    }

    /**
     * Get agent by ID
     */
    async getAgent(id: string): Promise<StoredAgent | null> {
        const agents = await this.getAllAgents();
        return agents.find(a => a.id === id) || null;
    }

    /**
     * Get all agents
     */
    async getAllAgents(): Promise<StoredAgent[]> {
        if (typeof chrome !== 'undefined' && chrome.storage) {
            const result = await chrome.storage.local.get([this.AGENTS_STORAGE_KEY]);
            return result[this.AGENTS_STORAGE_KEY] || [];
        }
        return [];
    }

    /**
     * Update agent
     */
    async updateAgent(id: string, updates: Partial<StoredAgent>): Promise<StoredAgent | null> {
        const agents = await this.getAllAgents();
        const index = agents.findIndex(a => a.id === id);

        if (index === -1) return null;

        agents[index] = {
            ...agents[index],
            ...updates,
            metadata: {
                ...agents[index].metadata,
                lastModified: Date.now()
            }
        };

        await this.saveAllAgents(agents);
        return agents[index];
    }

    /**
     * Delete agent
     */
    async deleteAgent(id: string): Promise<boolean> {
        const agents = await this.getAllAgents();
        const filtered = agents.filter(a => a.id !== id);

        if (filtered.length < agents.length) {
            await this.saveAllAgents(filtered);
            return true;
        }

        return false;
    }

    // ========== AGENT EXECUTION ==========

    /**
     * Execute an agent
     */
    async executeAgent(request: ExecutionRequest): Promise<ExecutionResult> {
        const agent = await this.getAgent(request.agentId);
        if (!agent) {
            return { success: false, error: 'Agent not found' };
        }

        try {
            const strategy = request.strategy || 'auto';
            let workProduct: WorkProduct;

            // Determine execution strategy
            if (strategy === 'auto') {
                // Auto-select based on agent type
                if (agent.type === 'workflow') {
                    workProduct = await this.executeViaWorkflow(agent, request.input, request.apiKey);
                } else {
                    workProduct = await this.executeViaConfig(agent, request.input, request.apiKey);
                }
            } else if (strategy === 'workflow') {
                workProduct = await this.executeViaWorkflow(agent, request.input, request.apiKey);
            } else {
                workProduct = await this.executeViaConfig(agent, request.input, request.apiKey);
            }

            // Save work product
            await this.workProductManager.saveWorkProduct(workProduct);

            // Update agent statistics
            await this.updateAgentStats(agent.id, true, Date.now() - workProduct.metadata.timestamp);

            return { success: true, workProduct };

        } catch (error) {
            // Update agent statistics (failure)
            await this.updateAgentStats(agent.id, false, 0);

            return {
                success: false,
                error: error instanceof Error ? error.message : String(error)
            };
        }
    }

    /**
     * Execute via workflow engine
     */
    private async executeViaWorkflow(
        agent: StoredAgent,
        input: any,
        apiKey?: string
    ): Promise<WorkProduct> {
        if (!agent.workflow) {
            throw new Error('Agent does not have a workflow');
        }

        const startTime = Date.now();
        const result = await this.workflowEngine.executeWorkflow(agent.workflow, input, apiKey);

        const workProduct: WorkProduct = {
            id: `wp-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            agentId: agent.id,
            agentName: agent.name,
            title: `${agent.name} - ${new Date().toLocaleString()}`,
            format: 'json',
            content: result.output,
            metadata: {
                executionTime: result.executionTime,
                stepsCompleted: result.nodesExecuted,
                totalSteps: result.totalNodes,
                timestamp: startTime,
                executionId: result.executionId,
                strategy: 'workflow'
            }
        };

        return workProduct;
    }

    /**
     * Execute via AgentExecutionEngine
     */
    private async executeViaConfig(
        agent: StoredAgent,
        input: any,
        apiKey?: string
    ): Promise<WorkProduct> {
        if (!agent.config) {
            throw new Error('Agent does not have a config');
        }

        const workProduct = await this.executionEngine.executeAgent(agent.config, input, apiKey);
        return workProduct;
    }

    /**
     * Update agent execution statistics
     */
    private async updateAgentStats(
        agentId: string,
        success: boolean,
        executionTime: number
    ): Promise<void> {
        const agent = await this.getAgent(agentId);
        if (!agent) return;

        const newExecutionCount = agent.metadata.executionCount + 1;
        const newSuccessCount = agent.metadata.successCount + (success ? 1 : 0);

        // Calculate new average execution time
        const currentAvg = agent.metadata.averageExecutionTime || 0;
        const newAvg = ((currentAvg * agent.metadata.executionCount) + executionTime) / newExecutionCount;

        await this.updateAgent(agentId, {
            metadata: {
                ...agent.metadata,
                lastExecuted: Date.now(),
                executionCount: newExecutionCount,
                successCount: newSuccessCount,
                averageExecutionTime: newAvg
            }
        });
    }

    // ========== WORK PRODUCT ACCESS ==========

    /**
     * Get work products for an agent
     */
    async getAgentWorkProducts(agentId: string): Promise<WorkProduct[]> {
        return this.workProductManager.getByAgent(agentId);
    }

    /**
     * Get recent work products
     */
    async getRecentWorkProducts(limit: number = 10): Promise<WorkProduct[]> {
        return this.workProductManager.getRecent(limit);
    }

    /**
     * Export work product
     */
    async exportWorkProduct(id: string, format?: 'original' | 'json' | 'txt'): Promise<Blob | null> {
        return this.workProductManager.exportWorkProduct(id, format);
    }

    /**
     * Download work product
     */
    async downloadWorkProduct(id: string, filename?: string): Promise<void> {
        return this.workProductManager.downloadWorkProduct(id, filename);
    }

    // ========== AGENT OPTIMIZATION ==========

    /**
     * Optimize an agent based on execution history
     */
    async optimizeAgent(agentId: string, goal: 'speed' | 'accuracy' | 'cost'): Promise<StoredAgent | null> {
        const agent = await this.getAgent(agentId);
        if (!agent || agent.type !== 'workflow' || !agent.workflow) {
            return null;
        }

        // Get execution history
        const workProducts = await this.getAgentWorkProducts(agentId);
        const executionResults = workProducts.map(wp => ({
            status: 'success',
            executionTime: wp.metadata.executionTime,
            nodesExecuted: wp.metadata.stepsCompleted
        }));

        // Use planner to optimize
        const optimized = await this.planner.optimizeWorkflow(agent.workflow, goal);

        // Update agent with optimized workflow
        return this.updateAgent(agentId, {
            workflow: optimized.workflow,
            description: `${agent.description} (Optimized for ${goal})`
        });
    }

    // ========== STORAGE ==========

    /**
     * Save a single agent
     */
    private async saveAgent(agent: StoredAgent): Promise<void> {
        const agents = await this.getAllAgents();
        const index = agents.findIndex(a => a.id === agent.id);

        if (index !== -1) {
            agents[index] = agent;
        } else {
            agents.push(agent);
        }

        await this.saveAllAgents(agents);
    }

    /**
     * Save all agents
     */
    private async saveAllAgents(agents: StoredAgent[]): Promise<void> {
        if (typeof chrome !== 'undefined' && chrome.storage) {
            await chrome.storage.local.set({ [this.AGENTS_STORAGE_KEY]: agents });
        }
    }
}

// Export singleton instance
export const localAgentOrchestrator = new LocalAgentOrchestrator();
