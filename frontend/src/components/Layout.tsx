import React from 'react';
import { AnimatedGrid } from './ui/AnimatedGrid';
import { FluctuatingText } from './ui/FluctuatingText';

interface LayoutProps {
    children: React.ReactNode;
    activePage: 'dashboard' | 'studio' | 'builder' | 'workflow' | 'negotiation';
}

const Layout: React.FC<LayoutProps> = ({ children, activePage }) => {
    return (
        <div className="min-h-screen flex text-foreground bg-transparent relative overflow-hidden">
            <AnimatedGrid />

            {/* Sidebar */}
            <aside className="w-64 border-r border-white/10 flex-shrink-0 fixed h-full z-10 selection:bg-cyan-500 selection:text-black" style={{ background: 'rgba(5, 5, 10, 0.6)', backdropFilter: 'blur(10px)' }}>
                <div className="p-6">
                    <h1 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-indigo-400 to-cyan-400">
                        PromptForge
                    </h1>
                    <p className="text-xs text-slate-400 mt-1">AI Engineering Studio</p>
                </div>

                <div className="mt-6 px-4 space-y-2">
                    <a href="/dashboard" className={`group block px-4 py-3 rounded-xl hover:bg-white/5 transition-all duration-300 border border-transparent ${activePage === 'dashboard' ? 'bg-white/5 text-cyan-400 border-cyan-500/30 shadow-[0_0_10px_rgba(6,182,212,0.1)]' : 'text-slate-400'}`}>
                        <div className="flex items-center gap-3">
                            <FluctuatingText text="DASHBOARD" className="tracking-widest" animateOnHover={true} />
                        </div>
                    </a>
                    <a href="/studio" className={`group block px-4 py-3 rounded-xl hover:bg-white/5 transition-all duration-300 border border-transparent ${activePage === 'studio' ? 'bg-white/5 text-cyan-400 border-cyan-500/30 shadow-[0_0_10px_rgba(6,182,212,0.1)]' : 'text-slate-400'}`}>
                        <div className="flex items-center gap-3">
                            <FluctuatingText text="PROMPT STUDIO" className="tracking-widest" animateOnHover={true} />
                        </div>
                    </a>
                    <a href="/builder" className={`group block px-4 py-3 rounded-xl hover:bg-white/5 transition-all duration-300 border border-transparent ${activePage === 'builder' ? 'bg-white/5 text-cyan-400 border-cyan-500/30 shadow-[0_0_10px_rgba(6,182,212,0.1)]' : 'text-slate-400'}`}>
                        <div className="flex items-center gap-3">
                            <FluctuatingText text="AGENT BUILDER" className="tracking-widest" animateOnHover={true} />
                        </div>
                    </a>
                    <a href="/workflow" className={`group block px-4 py-3 rounded-xl hover:bg-white/5 transition-all duration-300 border border-transparent ${activePage === 'workflow' ? 'bg-white/5 text-cyan-400 border-cyan-500/30 shadow-[0_0_10px_rgba(6,182,212,0.1)]' : 'text-slate-400'}`}>
                        <div className="flex items-center gap-3">
                            <FluctuatingText text="WORKFLOWS" className="tracking-widest" animateOnHover={true} />
                        </div>
                    </a>
                    <a href="/negotiation" className={`group block px-4 py-3 rounded-xl hover:bg-white/5 transition-all duration-300 border border-transparent ${activePage === 'negotiation' ? 'bg-white/5 text-cyan-400 border-cyan-500/30 shadow-[0_0_10px_rgba(6,182,212,0.1)]' : 'text-slate-400'}`}>
                        <div className="flex items-center gap-3">
                            <FluctuatingText text="NEGOTIATION" className="tracking-widest" animateOnHover={true} />
                        </div>
                    </a>
                </div>
            </aside>

            {/* Main Content */}
            <main className="flex-1 ml-64 p-8">
                {children}
            </main>
        </div>
    );
};

export default Layout;
