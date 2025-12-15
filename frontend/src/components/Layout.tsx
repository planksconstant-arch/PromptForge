import React from 'react';

interface LayoutProps {
    children: React.ReactNode;
    activePage: 'dashboard' | 'studio' | 'builder' | 'workflow' | 'negotiation';
}

const Layout: React.FC<LayoutProps> = ({ children, activePage }) => {
    return (
        <div className="min-h-screen flex text-slate-100 bg-[#0f172a]">
            {/* Sidebar */}
            <aside className="w-64 glass border-r border-slate-800 flex-shrink-0 fixed h-full z-10 selection:bg-indigo-500 selection:text-white" style={{ background: 'rgba(30, 41, 59, 0.7)', backdropFilter: 'blur(10px)' }}>
                <div className="p-6">
                    <h1 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-indigo-400 to-cyan-400">
                        YaPrompt
                    </h1>
                    <p className="text-xs text-slate-400 mt-1">AI Engineering Studio</p>
                </div>

                <nav className="mt-6 px-4 space-y-2">
                    <a href="/" className={`block px-4 py-3 rounded-xl hover:bg-slate-800 transition-colors ${activePage === 'dashboard' ? 'bg-slate-800 text-indigo-400' : ''}`}>
                        📊 Dashboard
                    </a>
                    <a href="/studio" className={`block px-4 py-3 rounded-xl hover:bg-slate-800 transition-colors ${activePage === 'studio' ? 'bg-slate-800 text-indigo-400' : ''}`}>
                        🪄 Prompt Studio
                    </a>
                    <a href="/builder" className={`block px-4 py-3 rounded-xl hover:bg-slate-800 transition-colors ${activePage === 'builder' ? 'bg-slate-800 text-indigo-400' : ''}`}>
                        🛠️ Agent Builder
                    </a>
                    <a href="/workflow" className={`block px-4 py-3 rounded-xl hover:bg-slate-800 transition-colors ${activePage === 'workflow' ? 'bg-slate-800 text-indigo-400' : ''}`}>
                        ⚡ Workflows
                    </a>
                    <a href="/negotiation" className={`block px-4 py-3 rounded-xl hover:bg-slate-800 transition-colors ${activePage === 'negotiation' ? 'bg-slate-800 text-indigo-400' : ''}`}>
                        💰 Negotiation
                    </a>
                </nav>
            </aside>

            {/* Main Content */}
            <main className="flex-1 ml-64 p-8">
                {children}
            </main>
        </div>
    );
};

export default Layout;
