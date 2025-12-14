import React from 'react';
import { Settings, Sliders, Clock, Sparkles, Zap } from 'lucide-react';
import { VoiceInput } from './VoiceInput';

interface ConfigPanelProps {
  userInput: string;
  setUserInput: (input: string) => void;
  selectedModel: string;
  setSelectedModel: (model: string) => void;
  optimizationGoal: string;
  setOptimizationGoal: (goal: string) => void;
  userResources: string;
  setUserResources: (resources: string) => void;
  currentSkills: string;
  setCurrentSkills: (skills: string) => void;
  timeCommitment: string;
  setTimeCommitment: (time: string) => void;
  onOptimize: () => void;
  isLoading: boolean;
}

export const ConfigPanel: React.FC<ConfigPanelProps> = ({
  userInput,
  setUserInput,
  selectedModel,
  setSelectedModel,
  optimizationGoal,
  setOptimizationGoal,
  userResources,
  setUserResources,
  currentSkills,
  setCurrentSkills,
  timeCommitment,
  setTimeCommitment,
  onOptimize,
  isLoading,
}) => {

  const handleVoiceTranscript = (text: string) => {
    setUserInput(userInput ? `${userInput} ${text}` : text);
  };

  return (
    <aside className="w-full bg-indigo-900/50 rounded-xl border border-indigo-700/50 p-5 flex flex-col gap-6 shadow-lg backdrop-blur-sm">

      {/* Input Section */}
      <div className="flex flex-col gap-2">
        <div className="flex justify-between items-center">
          <label className="text-sm font-semibold text-indigo-300 uppercase tracking-wider">
            Your Prompt / Request
          </label>
          <VoiceInput onTranscript={handleVoiceTranscript} />
        </div>
        <textarea
          value={userInput}
          onChange={(e) => setUserInput(e.target.value)}
          placeholder="Describe what you want to achieve..."
          className="w-full h-32 bg-black/20 border border-indigo-500/30 rounded-lg p-3 text-slate-200 placeholder-indigo-400/50 focus:outline-none focus:ring-2 focus:ring-cyan-500 resize-none transition-all"
        />
      </div>

      {/* Model Selection */}
      <div className="flex flex-col gap-2">
        <label className="text-sm font-semibold text-indigo-300 uppercase tracking-wider flex items-center gap-2">
          <Zap className="w-4 h-4" /> Target Model
        </label>
        <select
          value={selectedModel}
          onChange={(e) => setSelectedModel(e.target.value)}
          className="bg-black/20 border border-indigo-500/30 rounded-lg p-2 text-slate-200 focus:outline-none focus:ring-2 focus:ring-cyan-500"
        >
          <option value="">Select a model...</option>
          <option value="gpt-4">GPT-4</option>
          <option value="gpt-3.5-turbo">GPT-3.5 Turbo</option>
          <option value="claude-3-opus">Claude 3 Opus</option>
          <option value="claude-3-sonnet">Claude 3 Sonnet</option>
          <option value="gemini-pro">Gemini Pro</option>
          <option value="llama-3">Llama 3</option>
        </select>
      </div>

      {/* Optimization Goal */}
      <div className="flex flex-col gap-2">
        <label className="text-sm font-semibold text-indigo-300 uppercase tracking-wider flex items-center gap-2">
          <Sparkles className="w-4 h-4" /> Optimization Goal
        </label>
        <select
          value={optimizationGoal}
          onChange={(e) => setOptimizationGoal(e.target.value)}
          className="bg-black/20 border border-indigo-500/30 rounded-lg p-2 text-slate-200 focus:outline-none focus:ring-2 focus:ring-cyan-500"
        >
          <option value="clarity">Maximize Clarity</option>
          <option value="creativity">Maximize Creativity</option>
          <option value="precision">Maximize Precision</option>
          <option value="step-by-step">Step-by-Step Reasoning</option>
          <option value="role-play">Role-Play Immersion</option>
        </select>
      </div>

      {/* Personalization (Collapsible or Compact) */}
      <div className="space-y-4 border-t border-white/10 pt-4">
        <div className="flex items-center gap-2 text-indigo-300">
          <Settings className="w-4 h-4" />
          <span className="text-sm font-semibold uppercase tracking-wider">Context & Constraints</span>
        </div>

        <div className="grid grid-cols-1 gap-3">
          <input
            type="text"
            value={userResources}
            onChange={(e) => setUserResources(e.target.value)}
            placeholder="Available Resources (e.g., 'Access to PDF, Python')"
            className="bg-black/20 border border-indigo-500/30 rounded-lg p-2 text-sm text-slate-200 focus:outline-none focus:ring-1 focus:ring-cyan-500"
          />
          <input
            type="text"
            value={currentSkills}
            onChange={(e) => setCurrentSkills(e.target.value)}
            placeholder="Your Skill Level (e.g., 'Beginner in Python')"
            className="bg-black/20 border border-indigo-500/30 rounded-lg p-2 text-sm text-slate-200 focus:outline-none focus:ring-1 focus:ring-cyan-500"
          />
          <input
            type="text"
            value={timeCommitment}
            onChange={(e) => setTimeCommitment(e.target.value)}
            placeholder="Time Constraint (e.g., '1 hour')"
            className="bg-black/20 border border-indigo-500/30 rounded-lg p-2 text-sm text-slate-200 focus:outline-none focus:ring-1 focus:ring-cyan-500"
          />
        </div>
      </div>

      <button
        onClick={onOptimize}
        disabled={isLoading}
        className={`
          mt-auto w-full py-3 rounded-xl font-bold text-white shadow-lg transition-all duration-300
          ${isLoading
            ? 'bg-indigo-700 cursor-not-allowed opacity-70'
            : 'bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 hover:shadow-cyan-500/25 hover:-translate-y-0.5'
          }
        `}
      >
        {isLoading ? (
          <span className="flex items-center justify-center gap-2">
            <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            Optimizing...
          </span>
        ) : (
          'Optimize Prompt'
        )}
      </button>
    </aside>
  );
};