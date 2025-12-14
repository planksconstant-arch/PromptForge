import { MemoryNode } from './MemoryService';

export interface ActionEvent {
    type: 'click' | 'type' | 'navigation';
    target?: string;
    value?: string;
    url: string;
    timestamp: number;
}

export interface AgentSuggestion {
    id: string;
    name: string;
    description: string;
    trigger: string;
    confidence: number;
    workflow: ActionEvent[];
}

export const HistoryService = {
    async recordAction(event: ActionEvent): Promise<void> {
        if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local) {
            const history = await this.getHistory();
            history.push(event);
            // Keep only last 100 actions
            const trimmed = history.slice(-100);
            await chrome.storage.local.set({ actionHistory: trimmed });
        }
    },

    async getHistory(limit?: number): Promise<ActionEvent[]> {
        if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local) {
            return new Promise((resolve) => {
                chrome.storage.local.get(['actionHistory'], (result) => {
                    const history = (result.actionHistory as ActionEvent[]) || [];
                    resolve(limit ? history.slice(-limit) : history);
                });
            });
        }
        return [];
    },

    async clearHistory(): Promise<void> {
        if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local) {
            await chrome.storage.local.set({ actionHistory: [] });
        }
    },

    async analyzePatterns(): Promise<AgentSuggestion[]> {
        const history = await this.getHistory();
        if (history.length < 5) return [];

        const suggestions: AgentSuggestion[] = [];

        // 1. Simple Sequence Detection (N-gram)
        // Look for repeated sequences of 3+ actions
        const actionSignatures = history.map(h => `${h.type}:${h.target || h.url}`);

        // Naive implementation: Check for the exact same sequence appearing twice
        // In a real system, we'd use a suffix tree or more advanced clustering

        for (let i = 0; i < actionSignatures.length - 2; i++) {
            const sequence = actionSignatures.slice(i, i + 3).join('|');

            // Check if this sequence appears again later
            let count = 1;
            for (let j = i + 3; j < actionSignatures.length - 2; j++) {
                const compare = actionSignatures.slice(j, j + 3).join('|');
                if (sequence === compare) {
                    count++;
                }
            }

            if (count >= 2) { // Found a pattern!
                // Extract the workflow
                const workflow = history.slice(i, i + 3);
                const targetUrl = new URL(workflow[0].url);

                suggestions.push({
                    id: crypto.randomUUID(),
                    name: `Auto-${targetUrl.hostname} Task`,
                    description: `I noticed you perform this sequence on ${targetUrl.hostname} frequently.`,
                    trigger: `When I visit ${targetUrl.hostname}`,
                    confidence: 0.8,
                    workflow: workflow
                });

                // Skip ahead to avoid overlapping matches for the same pattern
                i += 2;
            }
        }

        // Deduplicate suggestions
        const uniqueSuggestions = suggestions.filter((v, i, a) => a.findIndex(t => t.name === v.name) === i);

        return uniqueSuggestions;
    },

    async buildAndDeployAgent(suggestion: AgentSuggestion): Promise<MemoryNode> {
        // Convert the raw workflow into a structured Skill/Memory
        // In a real system, this would compile to a robust script.
        // Here, we store the raw workflow to be replayed by the WorkflowEngine.

        const memoryContent = JSON.stringify({
            type: 'workflow',
            steps: suggestion.workflow
        });

        // We'll use the MemoryService to store this "Agent"
        // We might need to import MemoryService here or pass it in.
        // For now, assuming we can use the chrome.storage directly or import it.
        // To avoid circular deps, we'll just return the object to be saved by the caller.

        return {
            id: crypto.randomUUID(),
            type: 'rule', // Using 'rule' as a catch-all for now
            content: `[AGENT] ${suggestion.name}: ${memoryContent}`,
            weight: 1.0,
            createdAt: Date.now()
        };
    }
};
