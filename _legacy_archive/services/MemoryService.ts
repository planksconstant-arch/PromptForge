export interface MemoryNode {
    id: string;
    type: 'rule' | 'style' | 'fact';
    content: string;
    weight: number; // 0.0 to 1.0
    createdAt: number;
}

export const MemoryService = {
    async getMemories(): Promise<MemoryNode[]> {
        if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local) {
            return new Promise((resolve) => {
                chrome.storage.local.get(['memories'], (result) => {
                    resolve((result.memories as MemoryNode[]) || []);
                });
            });
        } else {
            // Mock data for local dev
            const mockMemories: MemoryNode[] = [
                { id: '1', type: 'rule', content: 'Always use bullet points for lists', weight: 0.8, createdAt: Date.now() },
                { id: '2', type: 'style', content: 'Prefer concise, direct language', weight: 0.6, createdAt: Date.now() },
                { id: '3', type: 'fact', content: 'User is a React developer', weight: 0.9, createdAt: Date.now() },
            ];
            return Promise.resolve(mockMemories);
        }
    },

    async addMemory(memory: Omit<MemoryNode, 'id' | 'createdAt'>): Promise<MemoryNode> {
        const newMemory: MemoryNode = {
            ...memory,
            id: crypto.randomUUID(),
            createdAt: Date.now(),
        };

        if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local) {
            const currentMemories = await this.getMemories();
            const updatedMemories = [...currentMemories, newMemory];
            await chrome.storage.local.set({ memories: updatedMemories });
        } else {
            console.log('Mock: Added memory', newMemory);
        }

        return newMemory;
    },

    async updateMemoryWeight(id: string, delta: number): Promise<void> {
        if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local) {
            const memories = await this.getMemories();
            const updated = memories.map(m =>
                m.id === id ? { ...m, weight: Math.min(1, Math.max(0, m.weight + delta)) } : m
            );
            await chrome.storage.local.set({ memories: updated });
        }
    },

    async deleteMemory(id: string): Promise<void> {
        if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local) {
            const memories = await this.getMemories();
            const updated = memories.filter(m => m.id !== id);
            await chrome.storage.local.set({ memories: updated });
        }
    }
};
