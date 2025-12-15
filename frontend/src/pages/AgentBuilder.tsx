import React, { useState, useRef, useEffect } from 'react';
import Layout from '../components/Layout';
import { SpotlightCard } from '../components/ui/SpotlightCard';
import { TextGenerateEffect } from '../components/ui/TextGenerateEffect';
import { motion, AnimatePresence } from 'framer-motion';

interface Message {
    role: 'user' | 'assistant';
    text: string;
}

const AgentBuilder: React.FC = () => {
    const [messages, setMessages] = useState<Message[]>([
        { role: 'assistant', text: "Hello! I'm the Agent Architect. Describe the AI agent you want to build." }
    ]);
    const [input, setInput] = useState('');
    const [builderState, setBuilderState] = useState<any>(null);
    const chatContainerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (chatContainerRef.current) {
            chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
        }
    }, [messages]);

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

            const res = await fetch(endpoint, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });
            const data = await res.json();

            setBuilderState(data.state);
            setMessages(prev => [...prev, { role: 'assistant', text: data.message }]);

            if (data.agentConfig) {
                setMessages(prev => [...prev, { role: 'assistant', text: '✨ Agent Configuration Ready!' }]);
            }
        } catch (e) {
            console.error(e);
            setMessages(prev => [...prev, { role: 'assistant', text: '⚠️ Error contacting the architect.' }]);
        }
    };

    const handleKeyPress = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter') sendMessage();
    };

    return (
        <Layout activePage="builder">
            <div className="max-w-4xl mx-auto h-[calc(100vh-100px)] flex flex-col">
                {/* Header */}
                <header className="mb-6 flex-shrink-0">
                    <h2 className="text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-purple-400 via-pink-400 to-red-400">
                        Agent Builder
                    </h2>
                    <p className="text-slate-400 mt-2">Design custom AI agents via conversation.</p>
                </header>

                {/* Chat Area */}
                <SpotlightCard
                    className="flex-1 glass rounded-2xl p-6 overflow-y-auto mb-6 scroll-smooth bg-slate-900/60"
                >
                    <div ref={chatContainerRef} className="space-y-6">
                        <AnimatePresence>
                            {messages.map((msg, idx) => (
                                <motion.div
                                    key={idx}
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ duration: 0.3 }}
                                    className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                                >
                                    <div className={`max-w-[80%] rounded-2xl px-6 py-4 shadow-lg ${msg.role === 'user'
                                            ? 'bg-gradient-to-br from-indigo-600 to-purple-700 rounded-tr-none text-white'
                                            : 'bg-slate-800/80 border border-slate-700 rounded-tl-none text-slate-200'
                                        }`}>
                                        {msg.role === 'assistant' && idx === messages.length - 1 ? (
                                            <TextGenerateEffect words={msg.text} />
                                        ) : (
                                            msg.text
                                        )}
                                    </div>
                                </motion.div>
                            ))}
                        </AnimatePresence>
                    </div>
                </SpotlightCard>

                {/* Input Area */}
                <div className="flex-shrink-0 relative">
                    <input
                        type="text"
                        className="w-full bg-slate-800/50 border border-slate-700 rounded-xl px-6 py-4 text-white focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all placeholder-slate-500 shadow-[0_0_15px_rgba(0,0,0,0.3)]"
                        placeholder="e.g., 'I want a researcher that focuses on medical papers...'"
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        onKeyPress={handleKeyPress}
                    />
                    <button
                        onClick={sendMessage}
                        className="absolute right-2 top-2 bottom-2 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white px-6 rounded-lg font-medium transition-all shadow-lg hover:shadow-indigo-500/25"
                    >
                        Send
                    </button>
                </div>
            </div>
        </Layout>
    );
};

export default AgentBuilder;
