import React, { useState, useEffect } from 'react';
import { conversationalAgentBuilder, BuilderState } from '../services/ConversationalAgentBuilder';
import { AgentConfig, CapabilityType } from '../services/AgentExecutionEngine';
import { n8nService } from '../services/n8nService';

interface AgentBuilderProps {
    onClose: () => void;
    onAgentBuilt: (agent: any) => void;
}

type BuildMode = 'magic' | 'template' | 'manual';

export const AgentBuilder: React.FC<AgentBuilderProps> = ({ onClose, onAgentBuilt }) => {
    const [mode, setMode] = useState<BuildMode>('magic');

    // Magic Mode State
    const [magicConversation, setMagicConversation] = useState<BuilderState | null>(null);
    const [magicInput, setMagicInput] = useState('');
    const [magicLoading, setMagicLoading] = useState(false);

    // Template Mode State
    const [templates, setTemplates] = useState<any[]>([]);
    const [selectedTemplate, setSelectedTemplate] = useState<string>('');
    const [topic, setTopic] = useState('');

    // Manual Mode State
    const [manualName, setManualName] = useState('');
    const [manualDescription, setManualDescription] = useState('');
    const [manualCapabilities, setManualCapabilities] = useState<CapabilityType[]>([]);
    const [manualSteps, setManualSteps] = useState<any[]>([]);
    const [manualOutputFormat, setManualOutputFormat] = useState<'markdown' | 'json' | 'html'>('markdown');

    // Common State
    const [apiKey, setApiKey] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        setTemplates(n8nService.getAgentTemplates());
    }, []);

    // ========== Magic Mode Handlers ==========
    const handleMagicStart = async () => {
        if (!magicInput.trim()) {
            setError('Please describe what you want the agent to do');
            return;
        }

        setMagicLoading(true);
        setError(null);

        try {
            const builder = new (await import('../services/ConversationalAgentBuilder')).ConversationalAgentBuilder(apiKey);
            const state = await builder.startConversation(magicInput);
            setMagicConversation(state);
            setMagicInput('');
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to start conversation');
        } finally {
            setMagicLoading(false);
        }
    };

    const handleMagicContinue = async () => {
        if (!magicConversation || !magicInput.trim()) return;

        setMagicLoading(true);
        setError(null);

        try {
            const builder = new (await import('../services/ConversationalAgentBuilder')).ConversationalAgentBuilder(apiKey);
            const updatedState = await builder.continueConversation(magicConversation, magicInput);
            setMagicConversation(updatedState);
            setMagicInput('');

            // If complete, build the agent via LocalAgentOrchestrator
            if (updatedState.phase === 'complete' && updatedState.proposedSpec) {
                const { localAgentOrchestrator } = await import('../services/LocalAgentOrchestrator');
                const agentConfig = builder.convertToAgentConfig(updatedState.proposedSpec);
                const agent = await localAgentOrchestrator.createAgentFromConfig(agentConfig);
                handleAgentCreated(agent);
            }
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to continue conversation');
        } finally {
            setMagicLoading(false);
        }
    };

    // ========== Template Mode Handlers ==========
    const handleTemplateBuild = async () => {
        if (!selectedTemplate || !topic) {
            setError('Please select a template and enter a topic');
            return;
        }

        setLoading(true);
        setError(null);

        try {
            // Use LocalAgentOrchestrator to create REAL agent
            const { localAgentOrchestrator } = await import('../services/LocalAgentOrchestrator');

            const description = `Research the topic: ${topic}. Provide comprehensive analysis and create a detailed report with key findings.`;

            const agent = await localAgentOrchestrator.createAgentFromDescription(
                description,
                `${templates.find(t => t.id === selectedTemplate)?.name} - ${topic}`,
                { apiKey: apiKey || undefined }
            );

            handleAgentCreated(agent);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to build agent');
        } finally {
            setLoading(false);
        }
    };

    // ========== Manual Mode Handlers ==========
    const addManualStep = () => {
        setManualSteps([
            ...manualSteps,
            {
                id: `step${manualSteps.length + 1}`,
                name: '',
                capability: 'research' as CapabilityType,
                prompt: '',
                outputFormat: 'text',
                inputFrom: []
            }
        ]);
    };

    const updateManualStep = (index: number, field: string, value: any) => {
        const updated = [...manualSteps];
        updated[index] = { ...updated[index], [field]: value };
        setManualSteps(updated);
    };

    const removeManualStep = (index: number) => {
        setManualSteps(manualSteps.filter((_, i) => i !== index));
    };

    const handleManualBuild = async () => {
        if (!manualName || !manualDescription || manualSteps.length === 0) {
            setError('Please fill in all required fields and add at least one step');
            return;
        }

        setLoading(true);
        setError(null);

        try {
            const agentConfig: AgentConfig = {
                id: `agent-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
                name: manualName,
                description: manualDescription,
                capabilities: manualCapabilities.map(type => ({ type, config: {} })),
                steps: manualSteps.map(step => ({
                    ...step,
                    capability: { type: step.capability, config: {} }
                })),
                outputFormat: manualOutputFormat,
                metadata: {
                    createdAt: Date.now(),
                    lastModified: Date.now(),
                    version: '1.0.0'
                }
            };

            // Use LocalAgentOrchestrator to create REAL agent
            const { localAgentOrchestrator } = await import('../services/LocalAgentOrchestrator');
            const agent = await localAgentOrchestrator.createAgentFromConfig(agentConfig);

            handleAgentCreated(agent);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to build agent');
        } finally {
            setLoading(false);
        }
    };

    // ========== Common Handlers ==========
    const handleAgentCreated = (agent: any) => {
        onAgentBuilt(agent);
        onClose();
    };

    const toggleCapability = (cap: CapabilityType) => {
        if (manualCapabilities.includes(cap)) {
            setManualCapabilities(manualCapabilities.filter(c => c !== cap));
        } else {
            setManualCapabilities([...manualCapabilities, cap]);
        }
    };

    const availableCapabilities: CapabilityType[] = ['research', 'summarize', 'analyze', 'write', 'extract', 'transform', 'compare', 'evaluate'];

    return (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
            <div className="bg-gray-900 border border-purple-500/30 rounded-xl w-full max-w-4xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">
                <div className="bg-gray-800 px-6 py-4 border-b border-white/10 flex justify-between items-center shrink-0">
                    <h2 className="text-xl font-bold text-white">🛠️ Build New Agent</h2>
                    <button onClick={onClose} className="text-gray-400 hover:text-white text-2xl">✕</button>
                </div>

                <div className="p-6 space-y-6 overflow-y-auto">
                    {/* Mode Selection */}
                    <div className="flex bg-gray-800 p-1 rounded-lg gap-1">
                        <button
                            onClick={() => setMode('magic')}
                            className={`flex-1 py-2 px-3 rounded-md text-sm font-medium transition ${mode === 'magic' ? 'bg-gradient-to-r from-pink-600 to-purple-600 text-white shadow' : 'text-gray-400 hover:text-white'
                                }`}
                        >
                            ✨ Magic AI Builder
                        </button>
                        <button
                            onClick={() => setMode('template')}
                            className={`flex-1 py-2 px-3 rounded-md text-sm font-medium transition ${mode === 'template' ? 'bg-purple-600 text-white shadow' : 'text-gray-400 hover:text-white'
                                }`}
                        >
                            📚 Templates
                        </button>
                        <button
                            onClick={() => setMode('manual')}
                            className={`flex-1 py-2 px-3 rounded-md text-sm font-medium transition ${mode === 'manual' ? 'bg-blue-600 text-white shadow' : 'text-gray-400 hover:text-white'
                                }`}
                        >
                            🔧 Manual Build
                        </button>
                    </div>

                    {/* Magic Mode */}
                    {mode === 'magic' && (
                        <div className="space-y-4 animate-fadeIn">
                            <div className="bg-gradient-to-r from-pink-900/20 to-purple-900/20 border border-pink-500/30 p-4 rounded-lg">
                                <h3 className="text-pink-300 font-semibold mb-2">✨ Conversational Agent Builder</h3>
                                <p className="text-sm text-gray-400 mb-4">
                                    Tell me what you want to automate, and I'll ask you questions to design the perfect agent for you.
                                </p>

                                {!magicConversation ? (
                                    <div>
                                        <textarea
                                            value={magicInput}
                                            onChange={(e) => setMagicInput(e.target.value)}
                                            placeholder="e.g., I want an agent that researches a topic, summarizes key findings, and creates a professional report..."
                                            className="w-full h-32 bg-gray-900/50 border border-gray-700 rounded-lg px-4 py-3 text-white focus:ring-2 focus:ring-pink-500 focus:border-transparent outline-none resize-none"
                                        />
                                        <button
                                            onClick={handleMagicStart}
                                            disabled={magicLoading}
                                            className="mt-3 px-6 py-2 bg-gradient-to-r from-pink-600 to-purple-600 text-white rounded-lg font-semibold hover:shadow-lg transition disabled:opacity-50"
                                        >
                                            {magicLoading ? '⏳ Starting...' : '✨ Start Designing'}
                                        </button>
                                    </div>
                                ) : (
                                    <div>
                                        {/* Conversation History */}
                                        <div className="space-y-3 mb-4 max-h-96 overflow-y-auto">
                                            {magicConversation.conversationHistory.map((msg, idx) => (
                                                <div
                                                    key={idx}
                                                    className={`p-3 rounded-lg ${msg.role === 'user'
                                                        ? 'bg-blue-900/30 border border-blue-500/30 ml-8'
                                                        : 'bg-purple-900/30 border border-purple-500/30 mr-8'
                                                        }`}
                                                >
                                                    <div className="text-xs text-gray-400 mb-1">
                                                        {msg.role === 'user' ? 'You' : 'AI Agent Architect'}
                                                    </div>
                                                    <div className="text-sm text-gray-200 whitespace-pre-wrap">{msg.content}</div>
                                                </div>
                                            ))}
                                        </div>

                                        {/* Phase Indicator */}
                                        <div className="mb-3 text-xs text-gray-400">
                                            Phase: <span className="text-pink-400 font-semibold">{magicConversation.phase}</span>
                                        </div>

                                        {/* Input for continued conversation */}
                                        {magicConversation.phase !== 'complete' && (
                                            <div>
                                                <textarea
                                                    value={magicInput}
                                                    onChange={(e) => setMagicInput(e.target.value)}
                                                    placeholder="Your response..."
                                                    className="w-full h-24 bg-gray-900/50 border border-gray-700 rounded-lg px-4 py-3 text-white focus:ring-2 focus:ring-pink-500 focus:border-transparent outline-none resize-none"
                                                />
                                                <button
                                                    onClick={handleMagicContinue}
                                                    disabled={magicLoading}
                                                    className="mt-2 px-4 py-2 bg-gradient-to-r from-pink-600 to-purple-600 text-white rounded-lg font-semibold hover:shadow-lg transition disabled:opacity-50"
                                                >
                                                    {magicLoading ? '⏳ Processing...' : '→ Send'}
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {/* Template Mode */}
                    {mode === 'template' && (
                        <div className="space-y-4 animate-fadeIn">
                            <div>
                                <label className="block text-sm font-medium text-gray-300 mb-2">Select Agent Template</label>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    {templates.map(template => (
                                        <div
                                            key={template.id}
                                            onClick={() => setSelectedTemplate(template.id)}
                                            className={`p-4 rounded-lg border cursor-pointer transition-all ${selectedTemplate === template.id
                                                ? 'bg-purple-900/50 border-purple-500 ring-1 ring-purple-500'
                                                : 'bg-gray-800 border-gray-700 hover:border-gray-500'
                                                }`}
                                        >
                                            <div className="font-semibold text-white">{template.name}</div>
                                            <div className="text-xs text-gray-400 mt-1">{template.description}</div>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {selectedTemplate && (
                                <div className="animate-fadeIn">
                                    <label className="block text-sm font-medium text-gray-300 mb-1">Research Topic / Goal</label>
                                    <input
                                        type="text"
                                        value={topic}
                                        onChange={(e) => setTopic(e.target.value)}
                                        placeholder="e.g., The Future of Quantum Computing"
                                        className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none"
                                    />
                                </div>
                            )}
                        </div>
                    )}

                    {/* Manual Mode */}
                    {mode === 'manual' && (
                        <div className="space-y-4 animate-fadeIn">
                            <div className="bg-blue-900/20 border border-blue-500/30 p-4 rounded-lg">
                                <h3 className="text-blue-300 font-semibold mb-2">🔧 Advanced Manual Builder</h3>
                                <p className="text-sm text-gray-400">
                                    Build a custom agent from scratch with full control over every aspect.
                                </p>
                            </div>

                            {/* Basic Info */}
                            <div className="grid gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-300 mb-1">Agent Name *</label>
                                    <input
                                        type="text"
                                        value={manualName}
                                        onChange={(e) => setManualName(e.target.value)}
                                        placeholder="e.g., Market Research Agent"
                                        className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white focus:ring-2 focus:ring-blue-500 outline-none"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-300 mb-1">Description *</label>
                                    <textarea
                                        value={manualDescription}
                                        onChange={(e) => setManualDescription(e.target.value)}
                                        placeholder="What does this agent do?"
                                        className="w-full h-20 bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white focus:ring-2 focus:ring-blue-500 outline-none resize-none"
                                    />
                                </div>
                            </div>

                            {/* Capabilities */}
                            <div>
                                <label className="block text-sm font-medium text-gray-300 mb-2">Capabilities (Select All That Apply)</label>
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                                    {availableCapabilities.map(cap => (
                                        <button
                                            key={cap}
                                            onClick={() => toggleCapability(cap)}
                                            className={`px-3 py-2 rounded-lg text-sm font-medium transition ${manualCapabilities.includes(cap)
                                                ? 'bg-blue-600 text-white'
                                                : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
                                                }`}
                                        >
                                            {cap}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Steps */}
                            <div>
                                <div className="flex justify-between items-center mb-2">
                                    <label className="block text-sm font-medium text-gray-300">Workflow Steps *</label>
                                    <button
                                        onClick={addManualStep}
                                        className="px-3 py-1 bg-blue-600 text-white rounded text-sm hover:bg-blue-700 transition"
                                    >
                                        + Add Step
                                    </button>
                                </div>

                                {manualSteps.length === 0 ? (
                                    <div className="text-center py-8 text-gray-500 border border-dashed border-gray-700 rounded-lg">
                                        No steps yet. Click "Add Step" to begin.
                                    </div>
                                ) : (
                                    <div className="space-y-3">
                                        {manualSteps.map((step, idx) => (
                                            <div key={idx} className="bg-gray-800 p-4 rounded-lg border border-gray-700">
                                                <div className="flex justify-between items-center mb-3">
                                                    <span className="text-sm font-semibold text-blue-400">Step {idx + 1}</span>
                                                    <button
                                                        onClick={() => removeManualStep(idx)}
                                                        className="text-red-400 hover:text-red-300 text-sm"
                                                    >
                                                        Remove
                                                    </button>
                                                </div>
                                                <div className="grid gap-3">
                                                    <input
                                                        type="text"
                                                        value={step.name}
                                                        onChange={(e) => updateManualStep(idx, 'name', e.target.value)}
                                                        placeholder="Step name"
                                                        className="w-full bg-gray-900 border border-gray-600 rounded px-3 py-2 text-white text-sm outline-none focus:ring-1 focus:ring-blue-500"
                                                    />
                                                    <select
                                                        value={step.capability}
                                                        onChange={(e) => updateManualStep(idx, 'capability', e.target.value)}
                                                        className="w-full bg-gray-900 border border-gray-600 rounded px-3 py-2 text-white text-sm outline-none focus:ring-1 focus:ring-blue-500"
                                                    >
                                                        {availableCapabilities.map(cap => (
                                                            <option key={cap} value={cap}>{cap}</option>
                                                        ))}
                                                    </select>
                                                    <textarea
                                                        value={step.prompt}
                                                        onChange={(e) => updateManualStep(idx, 'prompt', e.target.value)}
                                                        placeholder="Prompt for this step (use {{input}} for user input)"
                                                        className="w-full h-20 bg-gray-900 border border-gray-600 rounded px-3 py-2 text-white text-sm outline-none focus:ring-1 focus:ring-blue-500 resize-none"
                                                    />
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>

                            {/* Output Format */}
                            <div>
                                <label className="block text-sm font-medium text-gray-300 mb-2">Output Format</label>
                                <div className="flex gap-2">
                                    {(['markdown', 'json', 'html'] as const).map(format => (
                                        <button
                                            key={format}
                                            onClick={() => setManualOutputFormat(format)}
                                            className={`px-4 py-2 rounded-lg text-sm font-medium transition ${manualOutputFormat === format
                                                ? 'bg-blue-600 text-white'
                                                : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
                                                }`}
                                        >
                                            {format.toUpperCase()}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>
                    )}

                    {/* API Key (Common) */}
                    <div>
                        <label className="block text-sm font-medium text-gray-300 mb-1">Gemini API Key (Optional)</label>
                        <input
                            type="password"
                            value={apiKey}
                            onChange={(e) => setApiKey(e.target.value)}
                            placeholder="Leave blank to use global key if set"
                            className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none"
                        />
                        <p className="text-xs text-gray-500 mt-1">Used for the agent's internal LLM calls.</p>
                    </div>

                    {error && (
                        <div className="bg-red-900/50 border border-red-500/50 text-red-200 px-4 py-2 rounded text-sm">
                            {error}
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="bg-gray-800 px-6 py-4 border-t border-white/10 flex justify-end gap-3 shrink-0">
                    <button
                        onClick={onClose}
                        className="px-4 py-2 rounded-lg text-gray-300 hover:bg-gray-700 transition"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={
                            mode === 'template' ? handleTemplateBuild :
                                mode === 'manual' ? handleManualBuild :
                                    () => { } // Magic mode handled separately
                        }
                        disabled={
                            loading ||
                            (mode === 'template' && (!selectedTemplate || !topic)) ||
                            (mode === 'manual' && (!manualName || !manualDescription || manualSteps.length === 0)) ||
                            (mode === 'magic' && (!magicConversation || magicConversation.phase !== 'confirming'))
                        }
                        className={`px-6 py-2 rounded-lg font-semibold shadow-lg transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 ${mode === 'magic' ? 'bg-gradient-to-r from-pink-600 to-purple-600 text-white' :
                            mode === 'template' ? 'bg-gradient-to-r from-purple-600 to-blue-600 text-white' :
                                'bg-gradient-to-r from-blue-600 to-cyan-600 text-white'
                            }`}
                    >
                        {loading ? (
                            <><span className="animate-spin">⏳</span> Building...</>
                        ) : mode === 'magic' ? (
                            '✨ Waiting for conversation...'
                        ) : (
                            `🔨 Build Agent`
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
};
