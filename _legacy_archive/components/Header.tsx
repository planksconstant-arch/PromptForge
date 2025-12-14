import React from 'react';
import { Sparkles, Brain, Zap, Copy, Check, AlertCircle, TrendingUp, Cpu, Network, Target } from 'lucide-react';

interface HeaderProps {
  stats: {
    totalOptimizations: number;
    avgClarity: number;
    avgRobustness: number;
  };
}

export const Header: React.FC<HeaderProps> = ({ stats }) => {
  return (
    <header className="bg-indigo-900/70 backdrop-blur-sm border-b border-indigo-700 px-6 py-3">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="relative">
            <Sparkles className="w-8 h-8 text-violet-400" />
            <div className="absolute inset-0 blur-xl bg-violet-400/30"></div>
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white">Yaprompt Studio</h1>
            <p className="text-sm text-indigo-300">AI-Powered Prompt Engineering</p>
          </div>
        </div>
        <div className="flex items-center space-x-6 text-sm">
          <div className="text-center">
            <div className="text-violet-400 font-bold text-lg">{stats.totalOptimizations}</div>
            <div className="text-indigo-400">Optimizations</div>
          </div>
          <div className="text-center">
            <div className="text-green-400 font-bold text-lg">{(stats.avgClarity * 10).toFixed(1)}%</div>
            <div className="text-indigo-400">Avg Clarity</div>
          </div>
          <div className="text-center">
            <div className="text-sky-400 font-bold text-lg">{(stats.avgRobustness * 10).toFixed(1)}%</div>
            <div className="text-indigo-400">Avg Robustness</div>
          </div>
        </div>
      </div>
    </header>
  );
};