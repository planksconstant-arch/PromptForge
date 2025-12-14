import React, { useEffect, useState } from 'react';
import { AgentBuilder } from './AgentBuilder';
import { AgentSuggestions } from './AgentSuggestions';
import { AgentWorkProducts } from './AgentWorkProducts';
import { WorkProduct } from '../services/AgentExecutionEngine';

export const AgentDashboard: React.FC = () => {
    const [agents, setAgents] = useState<any[]>([]);
    const [logs, setLogs] = useState<any[]>([]);
    const [workProducts, setWorkProducts] = useState<WorkProduct[]>([]);
    const [selectedAgent, setSelectedAgent] = useState<string | null>(null);
    const [activeTab, setActiveTab] = useState<'overview' | 'logs' | 'products'>('products');
    const [showBuilder, setShowBuilder] = useState(false);

    useEffect(() => {
        const fetchData = () => {
            if (typeof chrome !== 'undefined' && chrome.storage) {
                chrome.storage.local.get(['activeAgents', 'agentLogs', 'agentOutputs'], (result) => {
                    if (result.activeAgents) setAgents(result.activeAgents);
                    if (result.agentLogs) setLogs(result.agentLogs);
                    if (result.agentOutputs) setWorkProducts(result.agentOutputs);
                });
            }
        };

        fetchData();
        const interval = setInterval(fetchData, 2000);
        return () => clearInterval(interval);
    }, []);

    const handleAgentBuilt = (newAgent: any) => {
        const updatedAgents = [...agents, newAgent];
        setAgents(updatedAgents);
        if (typeof chrome !== 'undefined' && chrome.storage) {
            chrome.storage.local.set({ activeAgents: updatedAgents });
        }
    };

    const deleteAgent = (agentId: string) => {
        const updatedAgents = agents.filter(a => a.id !== agentId);
        setAgents(updatedAgents);
        if (typeof chrome !== 'undefined' && chrome.storage) {
            chrome.storage.local.set({ activeAgents: updatedAgents });
        }
    };

    const filteredLogs = selectedAgent
        ? logs.filter(log => log.agentId === selectedAgent)
        : logs;

    const filteredProducts = selectedAgent
        ? workProducts.filter(product => product.agentId === selectedAgent)
        : workProducts;

    const getAgentStatus = (agent: any) => {
        const recentLogs = logs.filter(l => l.agentId === agent.id).slice(-3);
        const lastLog = recentLogs[recentLogs.length - 1];

        if (!lastLog) return { status: 'idle', color: 'gray' };

        const timeSinceLog = Date.now() - lastLog.timestamp;
        if (timeSinceLog < 30000) {
            if (lastLog.type === 'error') return { status: 'error', color: 'red' };
            if (lastLog.message.includes('Running') || lastLog.message.includes('Executing')) {
                return { status: 'running', color: 'green' };
            }
            if (lastLog.message.includes('completed')) return { status: 'completed', color: 'blue' };
        }

        return { status: 'idle', color: 'gray' };
    };

    return (
        <div className="h-full flex flex-col p-4 bg-gray-900 text-white relative">
            {showBuilder && (
                <AgentBuilder
                    onClose={() => setShowBuilder(false)}
                    onAgentBuilt={handleAgentBuilt}
                />
            )}

            {/* Header */}
            <div className="mb-6">
                <div className="flex items-center justify-between mb-4">
                    <div>
                        <h1 className="text-3xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
                            🤖 Agent Factory
                        </h1>
                        <p className="text-gray-400 text-sm mt-1">Build, manage, and deploy intelligent automation agents</p>
                    </div>
                    <button
                        onClick={() => setShowBuilder(true)}
                        className="px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white rounded-lg font-semibold transition shadow-lg shadow-purple-900/30 flex items-center gap-2"
                    >
                        <span className="text-xl">+</span> Build New Agent
                    </button>
                </div>

                {/* Suggestions */}
                <AgentSuggestions />
            </div>

            {/* Stats */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                <div className="bg-gray-800 rounded-lg p-4 border border-purple-500/20">
                    <div className="text-gray-400 text-sm">Total Agents</div>
                    <div className="text-3xl font-bold text-purple-400 mt-1">{agents.length}</div>
                </div>
                <div className="bg-gray-800 rounded-lg p-4 border border-blue-500/20">
                    <div className="text-gray-400 text-sm">Work Products</div>
                    <div className="text-3xl font-bold text-blue-400 mt-1">{workProducts.length}</div>
                </div>
                <div className="bg-gray-800 rounded-lg p-4 border border-green-500/20">
                    <div className="text-gray-400 text-sm">Active Now</div>
                    <div className="text-3xl font-bold text-green-400 mt-1">
                        {agents.filter(a => getAgentStatus(a).status === 'running').length}
                    </div>
                </div>
                <div className="bg-gray-800 rounded-lg p-4 border border-pink-500/20">
                    <div className="text-gray-400 text-sm">Completed Today</div>
                    <div className="text-3xl font-bold text-pink-400 mt-1">
                        {workProducts.filter(p => Date.now() - p.metadata.timestamp < 86400000).length}
                    </div>
                </div>
            </div>

            {agents.length === 0 ? (
                <div className="flex-1 flex items-center justify-center text-center text-gray-500">
                    <div>
                        <div className="text-6xl mb-4 animate-pulse">🤖</div>
                        <div className="text-xl mb-2">No agents deployed yet</div>
                        <div className="text-sm mb-6">Click "Build New Agent" to create your first intelligent automation agent!</div>
                        <button
                            onClick={() => setShowBuilder(true)}
                            className="px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg font-semibold hover:shadow-lg transition inline-flex items-center gap-2"
                        >
                            <span className="text-xl">+</span> Get Started
                        </button>
                    </div>
                </div>
            ) : (
                <div className="flex gap-4 flex-grow overflow-hidden">
                    {/* Agent List Sidebar */}
                    <div className="w-80 flex-shrink-0 space-y-2 overflow-y-auto">
                        <div className="flex items-center justify-between mb-3 px-2">
                            <div className="text-sm font-semibold text-gray-400">
                                My Agents ({agents.length})
                            </div>
                            <button
                                onClick={() => setSelectedAgent(null)}
                                className="text-xs text-purple-400 hover:text-purple-300"
                            >
                                Show All
                            </button>
                        </div>

                        {agents.map((agent) => {
                            const status = getAgentStatus(agent);
                            const agentProducts = workProducts.filter(p => p.agentId === agent.id);

                            return (
                                <div
                                    key={agent.id}
                                    className={`p-4 rounded-lg cursor-pointer transition-all ${selectedAgent === agent.id
                                            ? 'bg-gradient-to-r from-purple-900/50 to-pink-900/50 border-2 border-purple-500'
                                            : 'bg-gray-800 hover:bg-gray-750 border border-gray-700 hover:border-gray-600'
                                        }`}
                                >
                                    <div className="flex items-start justify-between mb-2">
                                        <div className="flex-1" onClick={() => setSelectedAgent(agent.id)}>
                                            <h3 className="font-semibold text-white text-sm line-clamp-1">
                                                {agent.name || agent.agentName}
                                            </h3>
                                            <div className="text-xs text-gray-400 mt-1 line-clamp-2">
                                                {agent.description}
                                            </div>
                                        </div>
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                if (confirm(`Delete ${agent.name || agent.agentName}?`)) {
                                                    deleteAgent(agent.id);
                                                }
                                            }}
                                            className="text-red-400 hover:text-red-300 text-xs ml-2"
                                        >
                                            ✕
                                        </button>
                                    </div>

                                    {/* Agent Status */}
                                    <div className="flex items-center justify-between mt-3 text-xs">
                                        <div className="flex items-center gap-2">
                                            <span className={`w-2 h-2 rounded-full ${status.status === 'running' ? 'bg-green-400 animate-pulse' :
                                                    status.status === 'error' ? 'bg-red-400' :
                                                        status.status === 'completed' ? 'bg-blue-400' :
                                                            'bg-gray-400'
                                                }`} />
                                            <span className="text-gray-400">{status.status}</span>
                                        </div>
                                        <div className="text-purple-400">
                                            📄 {agentProducts.length}
                                        </div>
                                    </div>

                                    {/* Agent Type Badge */}
                                    {agent.steps && agent.steps.length > 0 && (
                                        <div className="mt-2">
                                            <span className="text-xs px-2 py-1 bg-gradient-to-r from-purple-900/50 to-pink-900/50 text-purple-300 rounded">
                                                Advanced • {agent.steps.length} steps
                                            </span>
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>

                    {/* Main Content Area */}
                    <div className="flex-1 flex flex-col overflow-hidden">
                        {/* Tab Navigation */}
                        <div className="flex gap-2 mb-4">
                            <button
                                onClick={() => setActiveTab('products')}
                                className={`px-4 py-2 rounded-lg transition-all font-medium ${activeTab === 'products'
                                        ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-lg'
                                        : 'bg-gray-800 text-gray-400 hover:bg-gray-700 hover:text-white'
                                    }`}
                            >
                                📄 Work Products ({filteredProducts.length})
                            </button>
                            <button
                                onClick={() => setActiveTab('logs')}
                                className={`px-4 py-2 rounded-lg transition-all font-medium ${activeTab === 'logs'
                                        ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-lg'
                                        : 'bg-gray-800 text-gray-400 hover:bg-gray-700 hover:text-white'
                                    }`}
                            >
                                📊 Execution Logs
                            </button>
                            <button
                                onClick={() => setActiveTab('overview')}
                                className={`px-4 py-2 rounded-lg transition-all font-medium ${activeTab === 'overview'
                                        ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-lg'
                                        : 'bg-gray-800 text-gray-400 hover:bg-gray-700 hover:text-white'
                                    }`}
                            >
                                📈 Overview
                            </button>
                        </div>

                        {/* Tab Content */}
                        <div className="flex-1 overflow-hidden">
                            {activeTab === 'products' && (
                                <AgentWorkProducts products={filteredProducts} />
                            )}

                            {activeTab === 'logs' && (
                                <div className="h-full bg-black rounded-lg p-4 overflow-y-auto font-mono text-sm">
                                    <div className="mb-3 text-gray-400">
                                        {selectedAgent
                                            ? `Logs for ${agents.find(a => a.id === selectedAgent)?.name || 'agent'}`
                                            : 'All Agent Logs'}
                                    </div>
                                    {filteredLogs.length === 0 ? (
                                        <div className="text-gray-600">No logs yet...</div>
                                    ) : (
                                        filteredLogs.slice(-100).reverse().map((log: any, i: number) => (
                                            <div key={i} className={`mb-1 ${log.type === 'error' ? 'text-red-400' :
                                                    log.type === 'success' ? 'text-green-400' :
                                                        'text-blue-400'
                                                }`}>
                                                <span className="text-gray-600">[{new Date(log.timestamp).toLocaleTimeString()}]</span> {log.message}
                                            </div>
                                        ))
                                    )}
                                </div>
                            )}

                            {activeTab === 'overview' && (
                                <div className="h-full bg-gray-800/50 rounded-lg p-6 overflow-y-auto">
                                    <h2 className="text-xl font-bold mb-4">Agent Overview</h2>
                                    {selectedAgent ? (
                                        <div>
                                            {(() => {
                                                const agent = agents.find(a => a.id === selectedAgent);
                                                if (!agent) return <div>Agent not found</div>;

                                                return (
                                                    <div className="space-y-4">
                                                        <div>
                                                            <h3 className="text-2xl font-bold text-purple-400">{agent.name || agent.agentName}</h3>
                                                            <p className="text-gray-400 mt-2">{agent.description}</p>
                                                        </div>

                                                        {agent.steps && agent.steps.length > 0 && (
                                                            <div>
                                                                <h4 className="text-lg font-semibold mb-3">Workflow Steps</h4>
                                                                <div className="space-y-2">
                                                                    {agent.steps.map((step: any, idx: number) => (
                                                                        <div key={idx} className="bg-gray-900 p-3 rounded border border-gray-700">
                                                                            <div className="flex items-center gap-2 mb-1">
                                                                                <span className="text-purple-400 font-semibold">Step {idx + 1}:</span>
                                                                                <span className="text-white">{step.name}</span>
                                                                            </div>
                                                                            <div className="text-xs text-gray-500">
                                                                                Capability: <span className="text-blue-400">{step.capability.type || step.capability}</span>
                                                                            </div>
                                                                        </div>
                                                                    ))}
                                                                </div>
                                                            </div>
                                                        )}

                                                        <div>
                                                            <h4 className="text-lg font-semibold mb-2">Statistics</h4>
                                                            <div className="grid grid-cols-2 gap-3">
                                                                <div className="bg-gray-900 p-3 rounded">
                                                                    <div className="text-gray-400 text-sm">Total Executions</div>
                                                                    <div className="text-2xl font-bold text-green-400">
                                                                        {workProducts.filter(p => p.agentId === selectedAgent).length}
                                                                    </div>
                                                                </div>
                                                                <div className="bg-gray-900 p-3 rounded">
                                                                    <div className="text-gray-400 text-sm">Success Rate</div>
                                                                    <div className="text-2xl font-bold text-blue-400">
                                                                        {(() => {
                                                                            const total = logs.filter(l => l.agentId === selectedAgent).length;
                                                                            const success = logs.filter(l => l.agentId === selectedAgent && l.type === 'success').length;
                                                                            return total > 0 ? `${Math.round((success / total) * 100)}%` : 'N/A';
                                                                        })()}
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>
                                                );
                                            })()}
                                        </div>
                                    ) : (
                                        <div className="text-center text-gray-500 py-12">
                                            Select an agent to view its overview
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
