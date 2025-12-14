/// <reference types="chrome" />
import React, { useState, useRef, useEffect } from 'react';
import { Header } from './components/Header';
import { ConfigPanel } from './components/ConfigPanel';
import { OutputPanel } from './components/OutputPanel';
import { Scanner } from './components/Scanner';
import { BrainVisualizer } from './components/BrainVisualizer';
import { optimizePrompt } from './services/geminiService';
import { PromptOptimizer, UserStyle } from './lib/PromptOptimizer';
import { getUserStyle } from './services/chromeService';
import { MemoryService } from './services/MemoryService';
import { SkillEngine } from './services/SkillEngine';
import type { Model, OptimizationGoal, FullResult, AppState } from './types';


import { AgentDashboard } from './components/AgentDashboard';
import { ChatInterface } from './components/ChatInterface';

export default function App() {
  const [activeTab, setActiveTab] = useState<'chat' | 'studio' | 'agents'>('chat');
  const [appState, setAppState] = useState<AppState>('idle');
  const [result, setResult] = useState<FullResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loadingMessage, setLoadingMessage] = useState('');

  const optimizerRef = useRef(new PromptOptimizer());

  // Config State
  const [userInput, setUserInput] = useState('');
  const [selectedModel, setSelectedModel] = useState<Model | null>(null);
  const [optimizationGoal, setOptimizationGoal] = useState<OptimizationGoal>('Chain-of-Thought Reasoning');

  // Personalization State
  const [userResources, setUserResources] = useState('');
  const [currentSkills, setCurrentSkills] = useState('');
  const [timeCommitment, setTimeCommitment] = useState('');

  // RL / User Style State
  const [userStyle, setUserStyle] = useState<UserStyle | null>(null);

  // Stats
  const [stats, setStats] = useState({
    totalOptimizations: 0,
    avgClarity: 0,
    avgRobustness: 0,
  });

  // API Key State
  const [hasApiKey, setHasApiKey] = useState(false);
  const [checkingApiKey, setCheckingApiKey] = useState(true);

  // Context State
  const [pageContext, setPageContext] = useState<{ title: string; url: string } | null>(null);

  useEffect(() => {
    const fetchStyle = async () => {
      const style = await getUserStyle();
      if (style) setUserStyle(style);
    };
    fetchStyle();

    // Check for API key
    const checkApiKey = async () => {
      if (typeof chrome !== 'undefined' && chrome.storage) {
        const result = await chrome.storage.local.get(['GEMINI_API_KEY']);
        setHasApiKey(!!result.GEMINI_API_KEY);
      }
      setCheckingApiKey(false);
    };
    checkApiKey();

    // Fetch Context
    if (typeof chrome !== 'undefined' && chrome.tabs && chrome.tabs.query) {
      chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        if (tabs[0]?.id) {
          chrome.tabs.sendMessage(tabs[0].id, { action: "getContext" }, (response) => {
            if (response) {
              setPageContext(response);
            }
          });
        }
      });
    }
  }, []);

  const handleOptimize = async () => {
    if (!userInput.trim()) {
      alert('Please enter a prompt to optimize.');
      return;
    }

    // 0. Check for Skill Execution
    const parsedRule = SkillEngine.parse(userInput);
    if (parsedRule && parsedRule.type === 'action' && parsedRule.actionDetails) {
      setLoadingMessage(`Executing Skill: ${parsedRule.action}...`);
      setAppState('loading');

      if (typeof chrome !== 'undefined' && chrome.tabs && chrome.tabs.query) {
        chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
          if (tabs[0]?.id) {
            chrome.tabs.sendMessage(tabs[0].id, {
              action: "executeAction",
              details: parsedRule.actionDetails
            }, (response) => {
              if (response && response.status === 'success') {
                setAppState('success');
                setResult({
                  stage1: { reasoning: 'Skill Executed Successfully', prompt: response.message },
                  stage2: { optimizedPrompt: response.message, explanation: 'Action performed on page.' }
                });
              } else {
                setError(response?.message || "Failed to execute action.");
                setAppState('error');
              }
              setLoadingMessage('');
            });
          }
        });
      }
      return; // Stop here if it was an action
    }

    if (!selectedModel) {
      alert('Please select a target model.');
      return;
    }

    setAppState('loading');
    setError(null);
    setResult(null);

    try {
      // Fetch memories
      const memories = await MemoryService.getMemories();

      // Stage 1: Local RL Optimization
      setLoadingMessage('Stage 1: Accessing Neural Memory & Applying Template...');

      // Inject Context into Prompt if available
      let finalPrompt = userInput;
      if (pageContext) {
        finalPrompt = `Context: User is viewing "${pageContext.title}" (${pageContext.url}).\n\n${userInput}`;
      }

      const stage1Result = await optimizerRef.current.optimize({
        prompt: finalPrompt,
        model: selectedModel,
        goal: optimizationGoal,
        userStyle: userStyle || undefined,
        memories: memories
      });

      // Stage 2: Gemini API Refinement
      setLoadingMessage('Stage 2: Refining with generative AI...');
      const stage2Result = await optimizePrompt(
        stage1Result.prompt, // Pass the structured prompt to the API
        userInput,
        selectedModel,
        optimizationGoal,
        userResources,
        currentSkills,
        timeCommitment
      );

      setResult({ stage1: stage1Result, stage2: stage2Result });
      setAppState('success');

      // Update stats based on final critique
      if (stage2Result.critique) {
        setStats(prev => {
          const newTotal = prev.totalOptimizations + 1;
          const newClarity = (prev.avgClarity * prev.totalOptimizations + stage2Result.critique.clarity) / newTotal;
          const newRobustness = (prev.avgRobustness * prev.totalOptimizations + stage2Result.critique.robustness) / newTotal;
          return {
            totalOptimizations: newTotal,
            avgClarity: newClarity,
            avgRobustness: newRobustness,
          };
        });
      }

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "An unknown error occurred.";
      setError(errorMessage);
      setAppState('error');
      console.error('Optimization failed:', err);
    } finally {
      setLoadingMessage('');
    }
  };

  const openAgentDashboard = () => {
    chrome.runtime.sendMessage({ action: 'openAgentDashboard' });
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 via-purple-900 to-blue-900 text-white overflow-hidden relative flex flex-col">
      {/* API Key Warning */}
      {!hasApiKey && !checkingApiKey && (
        <div className="bg-red-900/50 border-l-4 border-red-500 p-4 m-4 rounded">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
              <span>Gemini API Key not configured. Features will be limited.</span>
            </div>
            <button
              onClick={() => chrome.runtime.openOptionsPage()}
              className="px-4 py-2 bg-red-600 hover:bg-red-700 rounded transition"
            >
              Open Settings
            </button>
          </div>
        </div>
      )}

      {/* Navigation Tabs */}
      <div className="flex border-b border-purple-500/30 px-4 pt-4 gap-4">
        <button
          onClick={() => setActiveTab('chat')}
          className={`px-6 py-3 rounded-t-lg transition ${activeTab === 'chat'
            ? 'bg-purple-700 text-white'
            : 'text-gray-400 hover:text-white'
            }`}
        >
          💬 Chat
        </button>
        <button
          onClick={() => setActiveTab('studio')}
          className={`px-6 py-3 rounded-t-lg transition ${activeTab === 'studio'
            ? 'bg-purple-700 text-white'
            : 'text-gray-400 hover:text-white'
            }`}
        >
          🎨 Prompt Studio
        </button>
        <button
          onClick={() => setActiveTab('agents')}
          className={`px-6 py-3 rounded-t-lg transition ${activeTab === 'agents'
            ? 'bg-purple-700 text-white'
            : 'text-gray-400 hover:text-white'
            }`}
        >
          🤖 My Agents
        </button>
        <button
          onClick={openAgentDashboard}
          className="ml-auto px-6 py-3 rounded-t-lg bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 transition"
        >
          🌐 Open Agent Dashboard
        </button>
      </div>

      {!checkingApiKey && !hasApiKey && (
        <div className="bg-amber-900/50 border-b border-amber-500/30 px-4 py-3 text-sm text-amber-200 flex items-center justify-between">
          <span>⚠️ API key not configured. Please set your Gemini API key to use the optimizer.</span>
          <button
            onClick={() => chrome?.runtime?.openOptionsPage?.()}
            className="bg-amber-500 hover:bg-amber-600 text-black px-3 py-1 rounded font-semibold text-xs"
          >
            Open Settings
          </button>
        </div>
      )}

      {activeTab === 'chat' ? (
        <div className="flex-grow overflow-hidden">
          <ChatInterface />
        </div>
      ) : activeTab === 'agents' ? (
        <div className="flex-grow overflow-hidden">
          <AgentDashboard />
        </div>
      ) : (
        <>
          {pageContext && (
            <div className="bg-indigo-900/50 border-b border-white/5 px-4 py-2 text-xs text-indigo-300 flex items-center gap-2 truncate">
              <span className="font-bold text-cyan-400">ACTIVE CONTEXT:</span>
              <span className="truncate">{pageContext.title}</span>
            </div>
          )}

          <div className="flex flex-grow h-[calc(100vh-110px)] overflow-hidden flex-col md:flex-row">
            <div className="w-full md:w-1/3 md:min-w-[450px] overflow-y-auto border-r border-white/10 p-4 flex flex-col gap-4">
              <div className="h-64 shrink-0">
                <BrainVisualizer />
              </div>
              <Scanner userStyle={userStyle} />
              <ConfigPanel
                userInput={userInput}
                setUserInput={setUserInput}
                selectedModel={selectedModel}
                setSelectedModel={setSelectedModel}
                optimizationGoal={optimizationGoal}
                setOptimizationGoal={setOptimizationGoal}
                userResources={userResources}
                setUserResources={setUserResources}
                currentSkills={currentSkills}
                setCurrentSkills={setCurrentSkills}
                timeCommitment={timeCommitment}
                setTimeCommitment={setTimeCommitment}
                onOptimize={handleOptimize}
                isLoading={appState === 'loading'}
              />
            </div>

            <div className="flex-grow overflow-y-auto">
              <OutputPanel
                appState={appState}
                result={result}
                error={error}
                loadingMessage={loadingMessage}
              />
            </div>
          </div>
        </>
      )}
    </div>
  );
}