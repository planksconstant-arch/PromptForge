import React, { useState, useRef, useEffect } from 'react';
import Layout from '../components/Layout';

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
                    <h2 className="text-3xl font-bold text-white">Agent Builder</h2>
                    <p className="text-slate-400">Design custom AI agents via conversation.</p>
                </header>

                {/* Chat Area */}
                <div
                    ref={chatContainerRef}
                    className="flex-1 glass rounded-2xl p-6 overflow-y-auto space-y-4 mb-6 scroll-smooth"
                    style={{ background: 'rgba(30, 41, 59, 0.7)', backdropFilter: 'blur(10px)', border: '1px solid rgba(255, 255, 255, 0.1)' }}
                >
                    {messages.map((msg, idx) => (
                        <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                            <div className={`max-w-[80%] rounded-2xl px-6 py-4 text-slate-200 ${msg.role === 'user'
                                    ? 'bg-indigo-600 rounded-tr-none'
                                    : 'bg-slate-800 rounded-tl-none'
                                }`}>
                                {msg.text}
                            </div>
                        </div>
                    ))}
                </div>

                {/* Input Area */}
                <div className="flex-shrink-0 relative">
                    <input
                        type="text"
                        className="w-full bg-slate-800/50 border border-slate-700 rounded-xl px-6 py-4 text-white focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all placeholder-slate-500"
                        placeholder="e.g., 'I want a researcher that focuses on medical papers...'"
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        onKeyPress={handleKeyPress}
                    />
                    <button
                        onClick={sendMessage}
                        className="absolute right-2 top-2 bottom-2 bg-indigo-600 hover:bg-indigo-700 text-white px-6 rounded-lg font-medium transition-colors"
                    >
                        Send
                    </button>
                </div>
            </div>
        </Layout>
    );
};

export default AgentBuilder;
