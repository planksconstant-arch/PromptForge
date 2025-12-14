import React from 'react';
import { motion } from 'framer-motion';
import { UserStyle } from '../lib/PromptOptimizer';

interface ScannerProps {
    userStyle: UserStyle | null;
}

export const Scanner: React.FC<ScannerProps> = ({ userStyle }) => {
    if (!userStyle) return null;

    return (
        <div className="relative p-6 bg-black/40 backdrop-blur-md rounded-xl border border-indigo-500/30 overflow-hidden">
            <motion.div
                className="absolute top-0 left-0 w-full h-1 bg-cyan-400 shadow-[0_0_20px_rgba(34,211,238,0.8)]"
                animate={{ top: ['0%', '100%', '0%'] }}
                transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
            />

            <h3 className="text-lg font-bold text-cyan-400 mb-4 flex items-center gap-2">
                <span className="w-2 h-2 bg-cyan-400 rounded-full animate-pulse" />
                USER STYLE MATRIX
            </h3>

            <div className="space-y-4">
                <Metric label="Formality" value={userStyle.formality} color="bg-purple-500" />
                <Metric label="Verbosity" value={userStyle.verbosity} color="bg-emerald-500" />
                <Metric label="Complexity" value={userStyle.complexity} color="bg-rose-500" />
            </div>

            <div className="mt-4 text-xs text-slate-400 font-mono">
                Samples Analyzed: {userStyle.samples}
            </div>
        </div>
    );
};

const Metric = ({ label, value, color }: { label: string, value: number, color: string }) => (
    <div>
        <div className="flex justify-between text-xs mb-1 text-slate-300">
            <span>{label}</span>
            <span>{(value * 100).toFixed(0)}%</span>
        </div>
        <div className="h-2 bg-slate-700 rounded-full overflow-hidden">
            <motion.div
                className={`h-full ${color}`}
                initial={{ width: 0 }}
                animate={{ width: `${value * 100}%` }}
                transition={{ duration: 1, ease: "easeOut" }}
            />
        </div>
    </div>
);
