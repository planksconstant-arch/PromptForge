import React, { useEffect, useState } from 'react';
import { AgentBuilder } from './AgentBuilder';

interface AgentSuggestion {
    id: string;
    name: string;
    description: string;
    trigger: string;
    confidence: number;
    workflow: any[];
}

export const AgentSuggestions: React.FC = () => {
    const [suggestions, setSuggestions] = useState<AgentSuggestion[]>([]);
    const [selectedSuggestion, setSelectedSuggestion] = useState<AgentSuggestion | null>(null);
    const [showBuilder, setShowBuilder] = useState(false);

    useEffect(() => {
        loadSuggestions();

        // Refresh suggestions every 30 seconds
        const interval = setInterval(loadSuggestions, 30000);
        return () => clearInterval(interval);
    }, []);

    const loadSuggestions = async () => {
        if (typeof chrome !== 'undefined' && chrome.storage) {
            const result = await chrome.storage.local.get(['agentSuggestions']);
            if (result.agentSuggestions) {
                setSuggestions(result.agentSuggestions);
            }
        }
    };

    const handleBuildFromSuggestion = (suggestion: AgentSuggestion) => {
        setSelectedSuggestion(suggestion);
        setShowBuilder(true);
    };

    const handleAgentBuilt = (agent: any) => {
        // Remove suggestion after building
        const updated = suggestions.filter(s => s.id !== selectedSuggestion?.id);
        setSuggestions(updated);

        if (typeof chrome !== 'undefined' && chrome.storage) {
            chrome.storage.local.set({ agentSuggestions: updated });
        }

        setShowBuilder(false);
        setSelectedSuggestion(null);
    };

    const dismissSuggestion = async (id: string) => {
        const updated = suggestions.filter(s => s.id !== id);
        setSuggestions(updated);

        if (typeof chrome !== 'undefined' && chrome.storage) {
            await chrome.storage.local.set({ agentSuggestions: updated });
        }
    };

    if (suggestions.length === 0) {
        return (
            <div className="bg-gradient-to-r from-gray-800/50 to-gray-900/50 border border-gray-700/50 rounded-xl p-6 text-center">
                <div className="text-4xl mb-3">🔍</div>
                <h3 className="text-gray-300 font-semibold mb-2">Learning your patterns...</h3>
                <p className="text-sm text-gray-500">
                    Keep browsing! I'll suggest agents based on your repetitive workflows.
                </p>
            </div>
        );
    }

    return (
        <div className="space-y-4">
            {showBuilder && selectedSuggestion && (
                <AgentBuilder
                    onClose={() => setShowBuilder(false)}
                    onAgentBuilt={handleAgentBuilt}
                />
            )}

            <div className="bg-gradient-to-r from-purple-900/30 to-blue-900/30 border border-purple-500/30 rounded-xl p-4">
                <h3 className="text-lg font-bold text-purple-300 mb-1 flex items-center gap-2">
                    <span>✨</span> Agent Suggestions
                </h3>
                <p className="text-sm text-gray-400">
                    I detected {suggestions.length} workflow pattern{suggestions.length > 1 ? 's' : ''} you might want to automate
                </p>
            </div>

            <div className="space-y-3">
                {suggestions.map(suggestion => (
                    <div
                        key={suggestion.id}
                        className="bg-gray-800/50 border border-gray-700 rounded-xl p-4 hover:border-purple-500/50 transition-all"
                    >
                        <div className="flex items-start justify-between mb-3">
                            <div className="flex-1">
                                <h4 className="font-semibold text-white mb-1">{suggestion.name}</h4>
                                <p className="text-sm text-gray-400">{suggestion.description}</p>
                                <div className="flex items-center gap-2 mt-2">
                                    <span className="text-xs bg-blue-900/30 text-blue-300 px-2 py-1 rounded">
                                        {suggestion.trigger}
                                    </span>
                                    <span className="text-xs bg-green-900/30 text-green-300 px-2 py-1 rounded">
                                        {Math.round(suggestion.confidence * 100)}% confidence
                                    </span>
                                </div>
                            </div>
                            <button
                                onClick={() => dismissSuggestion(suggestion.id)}
                                className="text-gray-500 hover:text-gray-300 text-sm"
                            >
                                ✕
                            </button>
                        </div>

                        <div className="flex gap-2">
                            <button
                                onClick={() => handleBuildFromSuggestion(suggestion)}
                                className="flex-1 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white px-4 py-2 rounded-lg text-sm font-semibold transition shadow-lg shadow-purple-900/20"
                            >
                                🚀 Build This Agent
                            </button>
                            <button
                                onClick={() => dismissSuggestion(suggestion.id)}
                                className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-gray-300 rounded-lg text-sm transition"
                            >
                                Not Now
                            </button>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};
