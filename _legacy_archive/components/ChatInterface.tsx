import React, { useState } from 'react';
import { Send, Bot, User } from 'lucide-react';

interface Message {
    id: string;
    role: 'user' | 'assistant';
    content: string;
    timestamp: number;
}

export const ChatInterface: React.FC = () => {
    const [messages, setMessages] = useState<Message[]>([{
        id: 'welcome',
        role: 'assistant',
        content: '👋 Hi! I\'m your Local AI Brain.\n\n💬 Ask me anything\n🤖 Build custom agents\n✨ Optimize prompts\n\nWhat would you like to do?',
        timestamp: Date.now()
    }]);
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const handleSend = async () => {
        if (!input.trim() || isLoading) return;

        const userMessage: Message = {
            id: `msg_${Date.now()}`,
            role: 'user',
            content: input,
            timestamp: Date.now()
        };

        setMessages(prev => [...prev, userMessage]);
        setInput('');
        setIsLoading(true);

        // Simulate response
        setTimeout(() => {
            const assistantMessage: Message = {
                id: `msg_${Date.now()}`,
                role: 'assistant',
                content: 'Chat functionality is ready! Configure your Gemini API key or install Ollama for full functionality.',
                timestamp: Date.now()
            };
            setMessages(prev => [...prev, assistantMessage]);
            setIsLoading(false);
        }, 500);
    };

    return (
        <div className="flex flex-col h-full bg-gradient-to-b from-gray-900 to-gray-800 text-white">
            <div className="flex items-center gap-3 p-4 border-b border-gray-700">
                <div className="w-10 h-10 bg-gradient-to-r from-purple-600 to-blue-600 rounded-full flex items-center justify-center">
                    <Bot className="w-6 h-6" />
                </div>
                <div>
                    <h2 className="font-bold text-lg">Local AI Brain</h2>
                    <p className="text-xs text-gray-400">Powered by Nested Learning</p>
                </div>
            </div>

            <div className="flex-grow overflow-y-auto p-4 space-y-4">
                {messages.map(message => (
                    <div key={message.id} className={`flex gap-3 ${message.role === 'user' ? 'flex-row-reverse' : ''}`}>
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${message.role === 'user' ? 'bg-blue-600' : 'bg-gradient-to-r from-purple-600 to-blue-600'
                            }`}>
                            {message.role === 'user' ? <User className="w-5 h-5" /> : <Bot className="w-5 h-5" />}
                        </div>
                        <div className={`flex-grow max-w-[80%] ${message.role === 'user' ? 'text-right' : ''}`}>
                            <div className={`inline-block p-3 rounded-lg ${message.role === 'user' ? 'bg-blue-600' : 'bg-gray-700'
                                }`}>
                                <div className="whitespace-pre-wrap text-sm">{message.content}</div>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            <div className="p-4 border-t border-gray-700">
                <div className="flex gap-2">
                    <input
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        onKeyPress={(e) => e.key === 'Enter' && handleSend()}
                        placeholder="Ask anything or describe an agent..."
                        className="flex-grow px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-purple-500"
                        disabled={isLoading}
                    />
                    <button
                        onClick={handleSend}
                        disabled={isLoading || !input.trim()}
                        className="px-6 py-3 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 disabled:opacity-50 rounded-lg transition"
                    >
                        <Send className="w-5 h-5" />
                    </button>
                </div>
            </div>
        </div>
    );
};
