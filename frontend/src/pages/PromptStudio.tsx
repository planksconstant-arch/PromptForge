import React, { useState } from 'react';
import Layout from '../components/Layout';
import { SpotlightCard } from '../components/ui/SpotlightCard';
import { BorderBeam } from '../components/ui/BorderBeam';
import { TextGenerateEffect } from '../components/ui/TextGenerateEffect';
import { FluctuatingText } from '../components/ui/FluctuatingText';

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
                    <FluctuatingText
                        text="PROMPT STUDIO"
                        className="text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-cyan-400 via-blue-500 to-purple-600 tracking-widest"
                    />
                    <p className="text-slate-400 mt-2 font-mono text-xs tracking-wider">REFINE // ANALYZE // OPTIMIZE</p>
                </header>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 flex-1 overflow-hidden">
                    {/* Input Column */}
                    <SpotlightCard className="flex flex-col p-6 h-full bg-black/60 border border-cyan-500/20 backdrop-blur-md">
                        <div className="mb-4 flex items-center gap-2">
                            <div className="w-2 h-2 bg-cyan-500 animate-pulse" />
                            <FluctuatingText text="INPUT_PROTOCOL" className="text-sm font-bold text-cyan-400 tracking-widest" />
                        </div>

                        <textarea
                            className="flex-1 w-full bg-black/80 border border-cyan-500/20 rounded-none p-4 text-cyan-50 focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 font-mono text-sm resize-none mb-4 transition-all placeholder:text-cyan-900/50"
                            placeholder="> INITIALIZE PROMPT SEQUENCE..."
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                        />

                        <div className="flex justify-between items-center bg-black/80 p-3 border border-cyan-500/20">
                            <div className="flex items-center space-x-4">
                                <label className="flex items-center space-x-2 text-sm text-slate-400 cursor-pointer group hover:text-cyan-400 transition-colors">
                                    <input
                                        type="checkbox"
                                        checked={useMemory}
                                        onChange={(e) => setUseMemory(e.target.checked)}
                                        className="rounded-none text-cyan-500 focus:ring-cyan-500 bg-black border-cyan-500/50 hover:border-cyan-400"
                                    />
                                    <span className="font-mono text-xs uppercase tracking-wider">[ MEMORY_ACCESS ]</span>
                                </label>
                            </div>
                            <button
                                onClick={optimizePrompt}
                                disabled={loading}
                                className="relative overflow-hidden bg-cyan-950/30 hover:bg-cyan-900/50 text-cyan-400 border border-cyan-500/50 px-8 py-2 font-bold transition-all shadow-[0_0_15px_rgba(6,182,212,0.1)] hover:shadow-[0_0_25px_rgba(6,182,212,0.3)] disabled:opacity-50 disabled:shadow-none font-mono text-xs uppercase tracking-widest glitch-border"
                            >
                                {loading ? <FluctuatingText text="PROCESSING..." /> : <FluctuatingText text="EXECUTE" animateOnHover={true} />}
                            </button>
                        </div>
                    </SpotlightCard>

                    {/* Output Column */}
                    <SpotlightCard className="flex flex-col p-6 h-full bg-black/60 border border-purple-500/20 backdrop-blur-md">
                        <div className="mb-4 flex items-center gap-2">
                            <div className="w-2 h-2 bg-purple-500 animate-pulse" />
                            <FluctuatingText text="OUTPUT_STREAM" className="text-sm font-bold text-purple-400 tracking-widest" />
                        </div>

                        {/* Loading State */}
                        {loading && (
                            <div className="flex-1 flex flex-col items-center justify-center text-cyan-500/50 relative">
                                <BorderBeam size={150} duration={2} delay={0} colorFrom="#06b6d4" colorTo="#8b5cf6" />
                                <div className="font-mono text-xs animate-pulse text-cyan-400 tracking-[0.2em] mt-8">
                                    <FluctuatingText text="OPTIMIZING NEURAL PATHWAYS..." />
                                </div>
                            </div>
                        )}

                        {/* Empty State */}
                        {!loading && !result && !error && (
                            <div className="flex-1 flex items-center justify-center text-slate-800 text-xs font-mono uppercase tracking-widest blinking-cursor">
                                _ WAITING FOR INPUT
                            </div>
                        )}

                        {/* Error State */}
                        {error && (
                            <div className="flex-1 flex items-center justify-center text-red-500 text-sm font-mono border border-red-500/50 bg-red-950/20 p-4 glitch-border">
                                <span className="mr-2">⚠</span> SYSTEM_ERROR: OPTIMIZATION_FAILED
                            </div>
                        )}

                        {/* Result State */}
                        {!loading && result && (
                            <div className="flex-1 flex flex-col overflow-y-auto relative scrollbar-track-black scrollbar-thumb-purple-900">
                                <BorderBeam duration={5} size={300} colorFrom="#8b5cf6" colorTo="#06b6d4" />

                                <div className="bg-purple-900/10 border border-purple-500/20 p-4 mb-4 backdrop-blur-sm relative overflow-hidden">
                                    <div className="absolute top-0 left-0 w-1 h-full bg-purple-500/50"></div>
                                    <FluctuatingText text="LOGIC_CORE" className="text-[10px] font-bold text-purple-400 uppercase mb-2 tracking-widest block" />
                                    <p className="text-sm text-purple-200/80 italic font-mono pl-2 border-l border-purple-500/20">{result.reasoning || "Optimized based on best practices."}</p>
                                </div>

                                <div className="flex-1 relative group">
                                    <textarea
                                        readOnly
                                        value={result.prompt}
                                        className="w-full h-full bg-transparent border-none focus:ring-0 text-cyan-50 font-mono text-sm resize-none custom-scrollbar p-0 leading-relaxed"
                                    />
                                    <button
                                        onClick={copyResult}
                                        className="absolute top-2 right-2 bg-black/80 hover:bg-cyan-900/30 text-cyan-400 text-[10px] uppercase tracking-wider px-3 py-1 border border-cyan-500/30 opacity-0 group-hover:opacity-100 transition-opacity"
                                    >
                                        [ COPY_DATA ]
                                    </button>
                                </div>

                                {result.critique && (
                                    <div className="mt-4 pt-4 border-t border-purple-500/20">
                                        <FluctuatingText text="SYSTEM_METRICS" className="text-[10px] font-bold text-slate-500 uppercase mb-2 tracking-widest block" />
                                        <div className="grid grid-cols-3 gap-2 text-center text-xs">
                                            <div className="bg-black/40 p-2 border border-cyan-500/20">
                                                <div className="text-[10px] text-slate-500 uppercase">CLARITY</div>
                                                <div className="text-cyan-400 font-bold text-lg font-mono">{result.critique.clarity || '-'}</div>
                                            </div>
                                            <div className="bg-black/40 p-2 border border-purple-500/20">
                                                <div className="text-[10px] text-slate-500 uppercase">ROBUSTNESS</div>
                                                <div className="text-purple-400 font-bold text-lg font-mono">{result.critique.robustness || '-'}</div>
                                            </div>
                                            <div className="bg-black/40 p-2 border border-emerald-500/20">
                                                <div className="text-[10px] text-slate-500 uppercase">EFFICIENCY</div>
                                                <div className="text-emerald-400 font-bold text-lg font-mono">{result.critique.efficiency || '-'}</div>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}
                    </SpotlightCard>
                </div>
            </div>
        </Layout>
    );
};

export default PromptStudio;
