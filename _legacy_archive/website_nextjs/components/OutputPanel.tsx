import React from 'react';
import { type AppState, type FullResult, type Critique } from '../types';
import { Sparkles, AlertCircle, Network, Brain, Copy, Check, ArrowRight, Bot, Cpu } from 'lucide-react';

const Placeholder: React.FC = () => (
    <div className="flex-grow flex flex-col items-center justify-center text-indigo-500 min-h-[300px]">
        <Network className="w-24 h-24 mb-4" />
        <h2 className="text-xl font-semibold text-slate-300">Prompt Optimization Studio</h2>
        <p className="mt-2 text-center max-w-md text-indigo-400">Configure your parameters on the left and click "Optimize Prompt" to begin.</p>
    </div>
);

const Loader: React.FC<{ message: string }> = ({ message }) => (
    <div className="flex-grow flex flex-col items-center justify-center min-h-[300px]">
        <div className="relative">
            <Brain className="w-16 h-16 text-violet-400 animate-pulse" />
            <div className="absolute inset-0 blur-2xl bg-violet-400/30 animate-pulse"></div>
        </div>
        <h2 className="text-xl font-semibold mt-6 text-slate-300">Executing Hybrid Policy...</h2>
        <p className="mt-2 text-indigo-400 text-center max-w-md">
            {message}
        </p>
    </div>
);

const ErrorDisplay: React.FC<{ message: string | null }> = ({ message }) => (
    <div className="flex-grow flex flex-col items-center justify-center text-indigo-400 min-h-[300px]">
        <AlertCircle className="w-24 h-24 mb-4 text-red-400" />
        <h2 className="text-xl font-semibold text-red-300">Optimization Failed</h2>
        <p className="mt-2 text-indigo-400 text-center max-w-md">{message || "An unknown error occurred."}</p>
    </div>
);

const ScoreBar: React.FC<{ label: string; score: number }> = ({ label, score }) => {
    const width = `${Math.min(Math.max(score, 0), 10) * 10}%`;
    const color = score > 7 ? 'bg-green-500' : score > 4 ? 'bg-yellow-500' : 'bg-red-500';
    return (
        <div>
            <div className="flex justify-between items-center mb-1">
                <span className="text-sm font-medium text-indigo-200">{label}</span>
                <span className="text-sm font-bold text-white">{score}/10</span>
            </div>
            <div className="w-full bg-indigo-700/50 rounded-full h-2">
                <div className={`${color} h-2 rounded-full transition-all duration-500`} style={{ width }}></div>
            </div>
        </div>
    );
};

const CritiqueDisplay: React.FC<{ critique: Critique }> = ({ critique }) => (
    <div>
        <div className="flex items-center space-x-2 mb-2">
            <AlertCircle className="w-5 h-5 text-violet-400" />
            <h2 className="text-lg font-semibold text-white">Final Critique & Reward Score</h2>
        </div>
        <div className="bg-indigo-900/40 rounded-lg p-4 text-sm text-indigo-200 border border-indigo-700/50">
            <div className="space-y-3 mb-4">
                <ScoreBar label="Clarity" score={critique.clarity} />
                <ScoreBar label="Robustness" score={critique.robustness} />
                <ScoreBar label="Efficiency" score={critique.efficiency} />
            </div>
            <div className="border-t border-indigo-700/50 pt-3 whitespace-pre-wrap font-mono text-xs text-indigo-300">
                {critique.text}
            </div>
        </div>
    </div>
);

const ResultDisplay: React.FC<{ result: FullResult }> = ({ result }) => {
    const [copied, setCopied] = React.useState(false);

    const handleCopy = () => {
        if (result?.stage2?.prompt) {
            navigator.clipboard.writeText(result.stage2.prompt).then(() => {
                setCopied(true);
                setTimeout(() => setCopied(false), 2000);
            }).catch(err => {
                console.error('Failed to copy text: ', err);
            });
        }
    };

    // Safety check in case partial result is passed
    if (!result || !result.stage1 || !result.stage2) return null;

    return (
        <div className="flex flex-col space-y-6 animate-in fade-in duration-500">
            {/* Stage 1 Output */}
            <div className="border border-indigo-700/50 rounded-lg p-4 bg-indigo-900/20">
                <div className="flex items-center space-x-2 mb-2 text-indigo-300">
                    <Cpu className="w-5 h-5" />
                    <h3 className="text-md font-semibold">Stage 1: Local RL Agent (Structural Optimization)</h3>
                </div>
                <div className="bg-black/30 rounded-lg p-3 text-xs text-slate-300 h-24 overflow-y-auto font-mono whitespace-pre-wrap custom-scrollbar mb-2 border border-indigo-800/50">
                    <p className="font-bold text-indigo-400 mb-1">REASONING:</p>
                    {result.stage1.reasoning}
                </div>
                <div className="bg-indigo-950/50 rounded-lg p-3 text-xs text-indigo-300 h-28 overflow-y-auto whitespace-pre-wrap border border-indigo-700/50 custom-scrollbar">
                    <p className="font-bold text-indigo-400 mb-1">GENERATED STRUCTURED PROMPT:</p>
                    {result.stage1.prompt}
                </div>
            </div>

            <div className="flex justify-center my-2">
                <ArrowRight className="w-8 h-8 text-indigo-500 animate-pulse" />
            </div>

            {/* Stage 2 Output */}
            <div className="border border-violet-700/50 rounded-lg p-4 bg-violet-900/10">
                <div className="flex items-center space-x-2 mb-2 text-violet-300">
                    <Bot className="w-5 h-5" />
                    <h3 className="text-md font-semibold">Stage 2: Gemini API (Semantic Refinement)</h3>
                </div>
                <div className="bg-black/30 rounded-lg p-3 text-xs text-slate-300 h-24 overflow-y-auto font-mono whitespace-pre-wrap custom-scrollbar mb-2 border border-indigo-800/50">
                    <p className="font-bold text-violet-400 mb-1">REFINEMENT STRATEGY:</p>
                    {result.stage2.reasoning}
                </div>
                <div className="flex justify-between items-center mb-2">
                    <div className="flex items-center space-x-2">
                        <Sparkles className="w-5 h-5 text-violet-400" />
                        <h2 className="text-lg font-semibold text-white">Final Optimized Prompt</h2>
                    </div>
                    <button
                        onClick={handleCopy}
                        className="bg-indigo-700 hover:bg-violet-600 text-slate-200 hover:text-white font-semibold py-1 px-3 rounded-lg transition-all flex items-center space-x-2 text-sm"
                    >
                        {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                        <span>{copied ? 'Copied!' : 'Copy'}</span>
                    </button>
                </div>
                <div className="bg-indigo-950/80 rounded-lg p-4 text-violet-300 flex-grow overflow-y-auto whitespace-pre-wrap border border-violet-500/50 custom-scrollbar shadow-inner" style={{ minHeight: '150px' }}>
                    {result.stage2.prompt}
                </div>
            </div>

            {result.stage2.critique && <CritiqueDisplay critique={result.stage2.critique} />}
        </div>
    );
};

interface OutputPanelProps {
    appState?: AppState; // Optional for compatibility
    result: FullResult | null;
    error?: string | null;
    loading?: boolean;
    loadingMessage?: string;
}

export default function OutputPanel({ appState, result, error, loading, loadingMessage = "Optimizing your prompt..." }: OutputPanelProps) {
    // Determine effective state
    let state: AppState = appState || 'idle';
    if (loading) state = 'loading';
    if (error) state = 'error';
    if (result) state = 'success';

    const renderContent = () => {
        switch (state) {
            case 'loading':
                return <Loader message={loadingMessage} />;
            case 'success':
                return result ? <ResultDisplay result={result} /> : <Placeholder />;
            case 'error':
                return <ErrorDisplay message={error || null} />;
            case 'idle':
            default:
                return <Placeholder />;
        }
    };

    return (
        <div className="h-full flex flex-col font-sans">
            <div className="flex-grow overflow-y-auto custom-scrollbar pr-2">
                {renderContent()}
            </div>
        </div>
    );
};
