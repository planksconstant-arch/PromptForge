import React, { useState } from 'react';
import Layout from '../components/Layout';

const PromptStudio: React.FC = () => {
    const [input, setInput] = useState('');
    const [useMemory, setUseMemory] = useState(false);
    const [loading, setLoading] = useState(false);
    const [result, setResult] = useState<any>(null);
    const [error, setError] = useState(false);

    const optimizePrompt = async () => {
        if (!input.trim()) return;

        setLoading(true);
        setResult(null);
        setError(false);

        try {
            const res = await fetch('/optimizer/optimize', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    prompt: input,
                    options: { memory: useMemory }
                })
            });

            const data = await res.json();
            setResult(data);
        } catch (e) {
            console.error(e);
            setError(true);
        } finally {
            setLoading(false);
        }
    };

    const copyResult = () => {
        if (result?.prompt) {
            navigator.clipboard.writeText(result.prompt);
        }
    };

    return (
        <Layout activePage="studio">
            <div className="max-w-6xl mx-auto h-[calc(100vh-100px)] flex flex-col">
                <header className="mb-6">
                    <h2 className="text-3xl font-bold text-white">Prompt Studio</h2>
                    <p className="text-slate-400">Refine, Analyze, and Optimize your prompts with AI.</p>
                </header>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 flex-1 overflow-hidden">
                    {/* Input Column */}
                    <div className="glass rounded-2xl p-6 flex flex-col" style={{ background: 'rgba(30, 41, 59, 0.7)', backdropFilter: 'blur(10px)', border: '1px solid rgba(255, 255, 255, 0.1)' }}>
                        <h3 className="text-lg font-semibold mb-4 text-indigo-400">Input Prompt</h3>
                        <textarea
                            className="flex-1 w-full bg-slate-900/50 border border-slate-700 rounded-xl p-4 text-slate-200 focus:ring-2 focus:ring-indigo-500 font-mono text-sm resize-none mb-4"
                            placeholder="Paste your rough prompt here..."
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                        />

                        <div className="flex justify-between items-center bg-slate-800/50 p-3 rounded-lg">
                            <div className="flex items-center space-x-4">
                                <label className="flex items-center space-x-2 text-sm text-slate-300 cursor-pointer">
                                    <input
                                        type="checkbox"
                                        checked={useMemory}
                                        onChange={(e) => setUseMemory(e.target.checked)}
                                        className="rounded text-indigo-500 focus:ring-indigo-500 bg-slate-700 border-slate-600"
                                    />
                                    <span>Use Memory</span>
                                </label>
                            </div>
                            <button
                                onClick={optimizePrompt}
                                disabled={loading}
                                className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-2 rounded-lg font-medium transition-all flex items-center disabled:opacity-50"
                            >
                                {loading ? 'Optimizing...' : '✨ Optimize'}
                            </button>
                        </div>
                    </div>

                    {/* Output Column */}
                    <div className="glass rounded-2xl p-6 flex flex-col bg-slate-900/80" style={{ background: 'rgba(30, 41, 59, 0.7)', backdropFilter: 'blur(10px)', border: '1px solid rgba(255, 255, 255, 0.1)' }}>
                        <h3 className="text-lg font-semibold mb-4 text-green-400">Optimized Result</h3>

                        {/* Loading State */}
                        {loading && (
                            <div className="flex-1 flex flex-col items-center justify-center text-slate-500">
                                <div className="w-12 h-12 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin mb-4"></div>
                                <p>Analyzing structure & intent...</p>
                            </div>
                        )}

                        {/* Empty State */}
                        {!loading && !result && !error && (
                            <div className="flex-1 flex items-center justify-center text-slate-600 text-sm italic">
                                Result will appear here...
                            </div>
                        )}

                        {/* Error State */}
                        {error && (
                            <div className="flex-1 flex items-center justify-center text-red-400 text-sm">
                                Optimization failed. Check network/backend.
                            </div>
                        )}

                        {/* Result State */}
                        {!loading && result && (
                            <div className="flex-1 flex flex-col overflow-y-auto">
                                <div className="bg-indigo-500/10 border border-indigo-500/20 rounded-xl p-4 mb-4">
                                    <h4 className="text-xs font-bold text-indigo-300 uppercase mb-2">Reasoning</h4>
                                    <p className="text-sm text-slate-300 italic">{result.reasoning || "Optimized based on best practices."}</p>
                                </div>

                                <div className="flex-1 relative group">
                                    <textarea
                                        readOnly
                                        value={result.prompt}
                                        className="w-full h-full bg-transparent border-none focus:ring-0 text-slate-100 font-mono text-sm resize-none"
                                    />
                                    <button
                                        onClick={copyResult}
                                        className="absolute top-2 right-2 bg-slate-700 hover:bg-slate-600 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity"
                                    >
                                        Copy
                                    </button>
                                </div>

                                {result.critique && (
                                    <div className="mt-4 pt-4 border-t border-slate-700">
                                        <h4 className="text-xs font-bold text-slate-400 uppercase mb-2">Critique</h4>
                                        <div className="grid grid-cols-3 gap-2 text-center text-xs">
                                            <div className="bg-slate-800 rounded p-2">
                                                <div className="text-slate-500">Clarity</div>
                                                <div className="text-white font-bold text-lg">{result.critique.clarity || '-'}</div>
                                            </div>
                                            <div className="bg-slate-800 rounded p-2">
                                                <div className="text-slate-500">Robustness</div>
                                                <div className="text-white font-bold text-lg">{result.critique.robustness || '-'}</div>
                                            </div>
                                            <div className="bg-slate-800 rounded p-2">
                                                <div className="text-slate-500">Efficiency</div>
                                                <div className="text-white font-bold text-lg">{result.critique.efficiency || '-'}</div>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </Layout>
    );
};

export default PromptStudio;
