/**
 * Continuum Memory System (API Client)
 * Connects to Python Backend for memory operations
 */

const API_URL = 'http://localhost:8000';

export interface Memory {
    id: string;
    data: any;
    surpriseScore: number;
    embedding?: number[];
    metadata: {
        timestamp: number;
        level?: number;
        context?: string;
        accessCount: number;
        lastAccessed: number;
        [key: string]: any;
    };
    compressed?: boolean;
    parentId?: string;
}

export interface RetrievalOptions {
    limit?: number;
    minSurprise?: number;
    maxAge?: number;
    level?: number;
    context?: string;
}

export class ContinuumMemorySystem {

    async store(data: any, surpriseScore: number, metadata?: Partial<Memory['metadata']>): Promise<string> {
        try {
            const response = await fetch(`${API_URL}/memory/store`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    data,
                    surpriseScore,
                    metadata
                })
            });

            if (!response.ok) throw new Error('Failed to store memory');
            const result = await response.json();
            return result.id;
        } catch (error) {
            console.error('Memory Store Error:', error);
            return `local_${Date.now()}`; # Fallback ID
        }
    }

    async retrieve(query: any, options: RetrievalOptions = {}): Promise<Memory[]> {
        try {
            const queryStr = typeof query === 'string' ? query : JSON.stringify(query);
            const params = new URLSearchParams({
                query: queryStr,
                limit: (options.limit || 10).toString()
            });

            const response = await fetch(`${API_URL}/memory/retrieve?${params.toString()}`);
            if (!response.ok) return [];

            return await response.json();
        } catch (error) {
            console.error('Memory Retrieval Error:', error);
            return [];
        }
    }

    async consolidate(): Promise<void> {
        // No-op client side, handled by server
    }
}

export const continuumMemorySystem = new ContinuumMemorySystem();
