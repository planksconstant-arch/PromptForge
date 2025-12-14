/**
 * Agent Builder (API Client)
 * Connects to Python Backend for agent construction
 */

import { AgentConfig, AgentStep, AgentCapability } from './AgentExecutionEngine';

const API_URL = 'http://localhost:8000';

export interface AgentSpec {
    name: string;
    description: string;
    capabilities: string[];
    workflow: {
        step: string;
        action: string;
        inputs?: string[];
        output: string;
    }[];
    triggers?: {
        type: 'manual' | 'schedule' | 'event';
        config?: any;
    }[];
    examples?: string[];
}

export interface BuildResult {
    success: boolean;
    agent?: AgentConfig;
    spec?: AgentSpec;
    error?: string;
    confidence: number;
}

export class AgentBuilder {

    /**
     * Build an agent from natural language prompt via Backend API
     */
    async fromPrompt(prompt: string, options?: {
        model?: string;
        validate?: boolean;
    }): Promise<BuildResult> {
        try {
            const response = await fetch(`${API_URL}/agents/create`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    description: prompt,
                    options: options
                })
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.detail || 'Failed to create agent');
            }

            const agent = await response.json();

            return {
                success: true,
                agent,
                confidence: 0.95
            };
        } catch (error) {
            console.error('AgentBuilder API Error:', error);
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Unknown error',
                confidence: 0
            };
        }
    }

    /**
     * Save agent configuration (Client-side proxy)
     */
    async saveAgent(agent: AgentConfig): Promise<void> {
        // For now, we still save to local storage for the extension parts to work easily
        // In full server mode, this might POST to server too
        if (typeof chrome !== 'undefined' && chrome.storage) {
            const result = await chrome.storage.local.get(['agents']);
            const agents = result.agents || [];
            const filtered = agents.filter((a: AgentConfig) => a.id !== agent.id);
            filtered.push(agent);
            await chrome.storage.local.set({ agents: filtered });
        }
    }

    async loadAgents(): Promise<AgentConfig[]> {
        // Try to load from server first, fallback to local
        try {
            const response = await fetch(`${API_URL}/agents`);
            if (response.ok) {
                return await response.json();
            }
        } catch (e) {
            console.warn('Backend unavailable, loading local agents');
        }

        if (typeof chrome !== 'undefined' && chrome.storage) {
            const result = await chrome.storage.local.get(['agents']);
            return result.agents || [];
        }
        return [];
    }
}

export const agentBuilder = new AgentBuilder();
