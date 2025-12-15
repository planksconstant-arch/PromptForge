import React, { useState, useRef, useEffect } from 'react';
import Layout from '../components/Layout';
import { SpotlightCard } from '../components/ui/SpotlightCard';
import { TextGenerateEffect } from '../components/ui/TextGenerateEffect';
import { motion, AnimatePresence } from 'framer-motion';
import { FluctuatingText } from '../components/ui/FluctuatingText';

interface Message {
    role: 'user' | 'assistant';
    text: string;
}

interface AppConnection {
    id: string;
    name: string;
    icon: string;
    connected: boolean;
    description: string;
}

const AVAILABLE_APPS: AppConnection[] = [
    { id: 'google_drive', name: 'Google Drive', icon: '📁', connected: false, description: 'Access docs & sheets' },
    { id: 'slack', name: 'Slack', icon: '💬', connected: false, description: 'Send notifications' },
    { id: 'github', name: 'GitHub', icon: '🐙', connected: false, description: 'Read/Write code' },
    { id: 'postgres', name: 'PostgreSQL', icon: '🐘', connected: false, description: 'Query databases' },
    { id: 'pes', name: 'PES Internal', icon: '🧠', connected: true, description: 'Prompt Studio Data' },
];

const AgentBuilder: React.FC = () => {
    const [messages, setMessages] = useState<Message[]>([
        { role: 'assistant', text: "Hello! I'm the Agent Architect. Describe the AI agent you want to build." }
    ]);
    const [input, setInput] = useState('');
    const [builderState, setBuilderState] = useState<any>(null);
    const [agentConfig, setAgentConfig] = useState<any>(null);
    const [apps, setApps] = useState<AppConnection[]>(AVAILABLE_APPS);
    const [deployStatus, setDeployStatus] = useState<'idle' | 'deploying' | 'deployed' | 'error'>('idle');
    const [deployPath, setDeployPath] = useState('');

    const chatContainerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (chatContainerRef.current) {
            chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
        }
    }, [messages]);

    const toggleApp = (id: string) => {
        setApps(prev => prev.map(app =>
            app.id === id ? { ...app, connected: !app.connected } : app
        ));
    };

    const sendMessage = async () => {
        if (!input.trim()) return;

        const userMsg = input.trim();
        setMessages(prev => [...prev, { role: 'user', text: userMsg }]);
        setInput('');

        try {
            const endpoint = builderState ? '/builder/continue' : '/builder/start';
            const payload = builderState
                ? { state: builderState, message: userMsg }
                : { description: userMsg };

            // Proxy to Python Backend
            const res = await fetch(endpoint, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });
            const data = await res.json();

            setBuilderState(data.state);
            setMessages(prev => [...prev, { role: 'assistant', text: data.message }]);

            if (data.agentConfig) {
                setAgentConfig(data.agentConfig);
                setMessages(prev => [...prev, { role: 'assistant', text: '✨ Agent Spec Generated! Review the "Connect Apps" panel on the right, then click Deploy.' }]);
            }
        } catch (e) {
            console.error(e);
            setMessages(prev => [...prev, { role: 'assistant', text: '⚠️ Error contacting the architect. Is the backend running?' }]);
        }
    };

    const handleDeploy = async () => {
        if (!agentConfig) return;
        setDeployStatus('deploying');

        // Add selected connections to config
        const finalConfig = {
            ...agentConfig,
            connections: apps.filter(a => a.connected).map(a => a.id)
        };

        try {
            const res = await fetch('/builder/deploy', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ agentConfig: finalConfig })
            });
            const data = await res.json();

            if (data.success) {
                setDeployStatus('deployed');
                setDeployPath(data.message);
                setMessages(prev => [...prev, { role: 'assistant', text: `🚀 Agent Deployed Successfully!\n${data.message}` }]);
            } else {
                setDeployStatus('error');
            }
        } catch (e) {
            console.error(e);
            setDeployStatus('error');
        }
    };

    const handleKeyPress = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter') sendMessage();
    };

    return (
        <Layout activePage="builder">
            <div className="max-w-7xl mx-auto h-[calc(100vh-100px)] flex gap-6">

                {/* LEFT: Chat Area */}
                <div className="flex-1 flex flex-col">
                    <header className="mb-6 flex-shrink-0">
                        <FluctuatingText
                            text="AGENT BUILDER"
                            className="text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-cyan-400 via-blue-500 to-purple-600 tracking-widest block"
                        />
                        <p className="text-slate-500 mt-2 font-mono text-xs tracking-[0.3em] uppercase">DESIGN // CONNECT // DEPLOY</p>
                    </header>

                    <SpotlightCard className="flex-1 flex flex-col p-0 overflow-hidden bg-black/60 border border-cyan-500/20 backdrop-blur-md">
                        <div ref={chatContainerRef} className="flex-1 overflow-y-auto p-6 space-y-4 custom-scrollbar bg-black/20">
                            {messages.map((msg, idx) => (
                                <motion.div
                                    key={idx}
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                                >
                                    <div className={`max-w-[80%] p-4 ${msg.role === 'user'
                                        ? 'bg-cyan-950/40 border border-cyan-500/30 text-cyan-50 rounded-none border-r-2 border-r-cyan-400'
                                        : 'bg-black/60 border border-purple-500/20 text-slate-200 rounded-none border-l-2 border-l-purple-500'
                                        }`}>
                                        <div className="text-[10px] uppercase tracking-widest mb-1 opacity-50 flex items-center gap-2">
                                            {msg.role === 'user' ? 'USER_INPUT' : 'SYSTEM_RESPONSE'}
                                            {msg.role === 'assistant' && <div className="w-1 h-1 bg-purple-500 animate-pulse" />}
                                        </div>
                                        {msg.role === 'assistant' ? (
                                            <div className="prose prose-invert prose-sm font-mono leading-relaxed">
                                                <TextGenerateEffect words={msg.text} />
                                            </div>
                                        ) : (
                                            <div className="font-mono">{msg.text}</div>
                                        )}
                                    </div>
                                </motion.div>
                            ))}
                        </div>

                        <div className="p-4 bg-black/80 border-t border-cyan-500/20">
                            <div className="relative">
                                <input
                                    type="text"
                                    value={input}
                                    onChange={(e) => setInput(e.target.value)}
                                    onKeyPress={handleKeyPress}
                                    placeholder="> Describe directive..."
                                    className="w-full bg-black/50 border border-cyan-500/20 py-4 px-6 pr-12 text-cyan-50 focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 outline-none transition-all placeholder:text-slate-700 font-mono"
                                />
                                <button
                                    onClick={sendMessage}
                                    className="absolute right-2 top-2 p-2 text-cyan-500 hover:text-cyan-300 transition-colors border border-transparent hover:border-cyan-500/30 bg-cyan-900/10"
                                >
                                    ⏎
                                </button>
                            </div>
                        </div>
                    </SpotlightCard>
                </div>

                {/* RIGHT: Connect & Deploy */}
                <div className="w-80 flex flex-col gap-6">
                    <SpotlightCard className="flex-1 p-6 flex flex-col bg-black/60 border border-purple-500/20 backdrop-blur-md">
                        <FluctuatingText text="NEURAL_INTEGRATIONS" className="text-xs font-bold mb-4 text-purple-400 uppercase tracking-widest block" />

                        <div className="space-y-3 flex-1 overflow-y-auto custom-scrollbar">
                            {apps.map(app => (
                                <div
                                    key={app.id}
                                    onClick={() => toggleApp(app.id)}
                                    className={`p-3 border cursor-pointer transition-all hover:translate-x-1 flex items-center gap-3 group ${app.connected
                                        ? 'bg-purple-950/20 border-purple-500/50'
                                        : 'bg-black/40 border-slate-800 hover:border-purple-500/30'
                                        }`}
                                >
                                    <div className="text-xl group-hover:scale-110 transition-transform">{app.icon}</div>
                                    <div className="flex-1">
                                        <div className={`font-bold text-xs font-mono uppercase ${app.connected ? 'text-purple-300' : 'text-slate-500 group-hover:text-purple-400'}`}>
                                            {app.name}
                                        </div>
                                        <div className="text-[9px] text-slate-600 uppercase tracking-wide">{app.description}</div>
                                    </div>
                                    <div className={`w-1.5 h-1.5 ${app.connected ? 'bg-purple-400 shadow-[0_0_5px_#a855f7]' : 'bg-slate-800'}`} />
                                </div>
                            ))}
                        </div>

                        <button
                            onClick={handleDeploy}
                            disabled={!agentConfig || deployStatus === 'deploying'}
                            className={`w-full mt-6 py-3 font-bold uppercase tracking-widest text-xs transition-all border glitch-border ${agentConfig
                                ? 'bg-cyan-950/50 border-cyan-500/50 text-cyan-400 hover:bg-cyan-900/50'
                                : 'bg-black/40 border-slate-800 text-slate-700 cursor-not-allowed'
                                }`}
                        >
                            {deployStatus === 'deploying' ? <FluctuatingText text="INITIALIZING..." /> :
                                deployStatus === 'deployed' ? <FluctuatingText text="SYSTEM ACTIVE" /> :
                                    <FluctuatingText text="DEPLOY MODULE" animateOnHover={true} />}
                        </button>

                        {deployStatus === 'deployed' && (
                            <div className="mt-4 p-3 bg-green-950/30 border border-green-500/30 text-[10px] text-green-400 font-mono break-all">
                                &gt; {deployPath}
                            </div>
                        )}
                        {deployStatus === 'error' && (
                            <div className="mt-4 p-3 bg-red-950/30 border border-red-500/30 text-[10px] text-red-400 font-mono">
                                &gt; ERROR: DEPLOYMENT_FAILED
                            </div>
                        )}
                    </SpotlightCard>
                </div>

            </div>
        </Layout>
    );
};

export default AgentBuilder;
