import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MemoryNode, MemoryService } from '../services/MemoryService';
import { SkillEngine } from '../services/SkillEngine';
import { Brain, Plus, Trash2, Zap } from 'lucide-react';

export const BrainVisualizer: React.FC = () => {
    const [memories, setMemories] = useState<MemoryNode[]>([]);
    const [newMemoryContent, setNewMemoryContent] = useState('');
    const [isAdding, setIsAdding] = useState(false);

    useEffect(() => {
        loadMemories();
    }, []);

    const loadMemories = async () => {
        const data = await MemoryService.getMemories();
        setMemories(data);
    };

    const handleAddMemory = async () => {
        if (!newMemoryContent.trim()) return;

        // Use SkillEngine to parse and learn
        await SkillEngine.learnSkill(newMemoryContent);

        setNewMemoryContent('');
        setIsAdding(false);
        loadMemories();
    };

    const handleDelete = async (id: string) => {
        await MemoryService.deleteMemory(id);
        loadMemories();
    };

    const handleReinforce = async (id: string) => {
        await MemoryService.updateMemoryWeight(id, 0.1);
        loadMemories();
    };

    return (
        <div className="h-full flex flex-col bg-indigo-950/30 rounded-xl border border-indigo-500/20 overflow-hidden relative">
            <div className="p-4 border-b border-white/10 flex justify-between items-center bg-indigo-900/40 backdrop-blur-sm z-10">
                <div className="flex items-center gap-2">
                    <Brain className="w-5 h-5 text-cyan-400" />
                    <h3 className="font-bold text-slate-200">Neural Memory Graph</h3>
                </div>
                <button
                    onClick={() => setIsAdding(!isAdding)}
                    className="p-1.5 hover:bg-white/10 rounded-lg transition-colors text-cyan-400"
                >
                    <Plus className="w-5 h-5" />
                </button>
            </div>

            <div className="relative flex-grow p-4 overflow-hidden">
                {/* Background Grid Effect */}
                <div className="absolute inset-0 opacity-10"
                    style={{ backgroundImage: 'radial-gradient(circle, #6366f1 1px, transparent 1px)', backgroundSize: '20px 20px' }}>
                </div>

                {isAdding && (
                    <motion.div
                        initial={{ opacity: 0, y: -20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="absolute top-4 left-4 right-4 z-20 bg-indigo-900/90 p-4 rounded-xl border border-cyan-500/50 shadow-xl backdrop-blur-md"
                    >
                        <textarea
                            value={newMemoryContent}
                            onChange={(e) => setNewMemoryContent(e.target.value)}
                            placeholder="Teach me a new rule (e.g., 'When I write code, always add comments')..."
                            className="w-full bg-black/20 rounded-lg p-2 text-sm text-white placeholder-indigo-400 focus:outline-none focus:ring-1 focus:ring-cyan-500 mb-3"
                            rows={2}
                        />
                        <div className="flex justify-end gap-2">
                            <button
                                onClick={() => setIsAdding(false)}
                                className="px-3 py-1 text-xs text-slate-400 hover:text-white"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleAddMemory}
                                className="px-3 py-1 bg-cyan-600 hover:bg-cyan-500 text-white text-xs rounded-md font-medium transition-colors"
                            >
                                Implant Memory
                            </button>
                        </div>
                    </motion.div>
                )}

                <div className="flex flex-wrap gap-3 content-start h-full overflow-y-auto custom-scrollbar p-2">
                    <AnimatePresence>
                        {memories.map((memory) => (
                            <motion.div
                                key={memory.id}
                                layout
                                initial={{ scale: 0, opacity: 0 }}
                                animate={{ scale: 1, opacity: 1 }}
                                exit={{ scale: 0, opacity: 0 }}
                                className={`
                  relative group p-3 rounded-xl border backdrop-blur-sm cursor-default transition-all duration-300
                  ${memory.type === 'rule' ? 'bg-indigo-900/40 border-indigo-500/30 hover:border-indigo-400' : ''}
                  ${memory.type === 'style' ? 'bg-purple-900/40 border-purple-500/30 hover:border-purple-400' : ''}
                  ${memory.type === 'fact' ? 'bg-emerald-900/40 border-emerald-500/30 hover:border-emerald-400' : ''}
                `}
                                style={{
                                    boxShadow: `0 0 ${memory.weight * 20}px ${memory.type === 'rule' ? 'rgba(99, 102, 241, 0.2)' :
                                            memory.type === 'style' ? 'rgba(168, 85, 247, 0.2)' :
                                                'rgba(16, 185, 129, 0.2)'
                                        }`
                                }}
                            >
                                <div className="flex justify-between items-start gap-3">
                                    <span className="text-xs font-mono opacity-50 uppercase tracking-wider">{memory.type}</span>
                                    <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <button onClick={() => handleReinforce(memory.id)} className="p-1 hover:bg-white/10 rounded text-yellow-400" title="Reinforce">
                                            <Zap className="w-3 h-3" />
                                        </button>
                                        <button onClick={() => handleDelete(memory.id)} className="p-1 hover:bg-white/10 rounded text-red-400" title="Forget">
                                            <Trash2 className="w-3 h-3" />
                                        </button>
                                    </div>
                                </div>
                                <p className="text-sm text-slate-200 mt-1 font-medium leading-snug">
                                    {memory.content}
                                </p>
                                <div className="mt-2 h-1 w-full bg-black/20 rounded-full overflow-hidden">
                                    <div
                                        className={`h-full ${memory.type === 'rule' ? 'bg-indigo-500' :
                                                memory.type === 'style' ? 'bg-purple-500' :
                                                    'bg-emerald-500'
                                            }`}
                                        style={{ width: `${memory.weight * 100}%` }}
                                    />
                                </div>
                            </motion.div>
                        ))}
                    </AnimatePresence>

                    {memories.length === 0 && (
                        <div className="w-full h-full flex flex-col items-center justify-center text-indigo-400/50">
                            <Brain className="w-12 h-12 mb-2 opacity-20" />
                            <p className="text-sm">Memory Empty</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};
