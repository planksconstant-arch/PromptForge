import React, { useEffect, useState } from 'react';
import { FluctuatingText } from '../components/ui/FluctuatingText';
import { motion, useScroll, useTransform } from 'framer-motion';

const Home = () => {
    const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
    const { scrollY } = useScroll();
    const y1 = useTransform(scrollY, [0, 500], [0, 200]);
    const y2 = useTransform(scrollY, [0, 500], [0, -150]);

    useEffect(() => {
        const handleMouseMove = (e: MouseEvent) => {
            setMousePosition({
                x: (e.clientX / window.innerWidth) * 20 - 10,
                y: (e.clientY / window.innerHeight) * 20 - 10,
            });
        };
        window.addEventListener('mousemove', handleMouseMove);
        return () => window.removeEventListener('mousemove', handleMouseMove);
    }, []);

    return (
        <div className="min-h-screen bg-black text-white font-mono overflow-x-hidden selection:bg-cyan-500 selection:text-black">
            {/* Nav */}
            <nav className="fixed top-0 w-full z-50 px-8 py-6 flex justify-between items-center backdrop-blur-sm bg-black/20 border-b border-white/5">
                <div className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-cyan-500 rounded-full animate-pulse shadow-[0_0_10px_#06b6d4]" />
                    <FluctuatingText text="PROMPTFORGE" className="text-xl font-bold tracking-widest text-white" />
                </div>
                <div className="flex gap-8 text-xs tracking-widest text-slate-400">
                    <a href="#features" className="hover:text-cyan-400 transition-colors">CAPABILITIES</a>
                    <a href="#about" className="hover:text-purple-400 transition-colors">SYSTEM</a>
                    <a href="/studio" className="text-cyan-400 font-bold border border-cyan-500/50 px-6 py-2 hover:bg-cyan-500/10 transition-all glitch-border">
                        ENTER STUDIO
                    </a>
                </div>
            </nav>

            {/* Hero Section */}
            <section className="relative h-screen flex items-center justify-center overflow-hidden">
                <div
                    className="absolute inset-0 z-0 bg-cover bg-center opacity-60"
                    style={{ backgroundImage: "url('/assets/landing_hero.png')" }}
                />
                <div className="absolute inset-0 z-0 bg-gradient-to-b from-black/20 via-black/60 to-black" />

                <div className="relative z-10 text-center max-w-5xl px-4 mt-[-100px]">
                    <motion.div
                        initial={{ opacity: 0, y: 50 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 1 }}
                        className="mb-6 inline-block"
                    >
                        <div className="px-4 py-1 border border-cyan-500/30 rounded-full bg-cyan-950/30 text-cyan-400 text-[10px] tracking-[0.3em] uppercase mb-4 backdrop-blur-md">
                            Neural Prompt Engineering Architecture v2.0
                        </div>
                    </motion.div>

                    <motion.h1
                        className="text-7xl md:text-9xl font-bold bg-clip-text text-transparent bg-gradient-to-b from-white via-slate-200 to-slate-600 mb-8 tracking-tighter"
                        style={{ x: mousePosition.x * 2, y: mousePosition.y * 2 }}
                    >
                        PROMPT<br />FORGE
                    </motion.h1>

                    <motion.p
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.5, duration: 1 }}
                        className="text-lg md:text-xl text-slate-400 max-w-2xl mx-auto mb-12 leading-relaxed"
                    >
                        Master the latent space. Craft, optimize, and deploy advanced AI agents with <span className="text-cyan-400">precision engineering</span>.
                    </motion.p>

                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.8 }}
                        className="flex justify-center gap-6"
                    >
                        <a href="/studio" className="group relative px-8 py-4 bg-cyan-600 text-white font-bold tracking-widest text-sm overflow-hidden hover:bg-cyan-500 transition-all clip-path-polygon">
                            <span className="relative z-10 flex items-center gap-2">
                                INITIALIZE SYSTEM <span className="group-hover:translate-x-1 transition-transform">→</span>
                            </span>
                            <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300" />
                        </a>
                        <a href="#demo" className="px-8 py-4 border border-white/20 text-white font-bold tracking-widest text-sm hover:bg-white/5 transition-all">
                            VIEW DOCS
                        </a>
                    </motion.div>
                </div>

                {/* Scroll Indicator */}
                <motion.div
                    animate={{ y: [0, 10, 0] }}
                    transition={{ repeat: Infinity, duration: 2 }}
                    className="absolute bottom-10 left-1/2 -translate-x-1/2 text-slate-500 text-[10px] tracking-[0.5em] uppercase"
                >
                    Scroll to Decrypt
                </motion.div>
            </section>

            {/* Features Section */}
            <section id="features" className="py-32 relative z-10 bg-black">
                <div className="container mx-auto px-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-20 items-center">
                        <motion.div style={{ y: y1 }}>
                            <FluctuatingText text="ADVANCED CAPABILITIES" className="text-purple-500 text-sm font-bold tracking-widest mb-4 block" />
                            <h2 className="text-5xl font-bold mb-8 leading-tight">
                                Engineer Intelligence <br />
                                <span className="text-slate-600">Without Limits.</span>
                            </h2>
                            <p className="text-slate-400 mb-8 leading-relaxed">
                                Our proprietary recursive optimization algorithms refine your prompts in real-time. Connect to any LLM provider and orchestrate complex agent behaviors with a visual node-graph builder.
                            </p>

                            <div className="space-y-6">
                                {[
                                    { title: "Recursive Optimization", desc: "Self-improving prompt chains." },
                                    { title: "Multi-Model Negotiation", desc: "Agents debating to find truth." },
                                    { title: "Continuum Memory", desc: "Long-term context retention." }
                                ].map((feature, i) => (
                                    <div key={i} className="flex gap-4 p-4 border border-white/5 hover:border-purple-500/30 transition-colors bg-white/5 hover:bg-purple-900/10">
                                        <div className="text-purple-500 font-mono">0{i + 1}</div>
                                        <div>
                                            <h3 className="font-bold text-sm uppercase tracking-wider mb-1">{feature.title}</h3>
                                            <p className="text-xs text-slate-500">{feature.desc}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </motion.div>

                        <motion.div style={{ y: y2 }} className="relative">
                            <div className="relative z-10 p-2 border border-white/10 bg-black/50 backdrop-blur-xl">
                                <img src="/assets/landing_interface.png" alt="Interface" className="w-full opacity-90" />
                                <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent opacity-50" />
                            </div>
                            <div className="absolute -top-10 -right-10 w-full h-full border border-purple-500/20 z-0" />
                            <div className="absolute -bottom-10 -left-10 w-full h-full border border-cyan-500/20 z-0" />
                        </motion.div>
                    </div>
                </div>
            </section>

            {/* Code Abstract Section */}
            <section className="py-32 relative overflow-hidden">
                <div
                    className="absolute inset-0 z-0 bg-cover bg-center opacity-30"
                    style={{ backgroundImage: "url('/assets/landing_abstract.png')" }}
                />
                <div className="absolute inset-0 bg-black/80 z-10" />

                <div className="container mx-auto px-6 relative z-20 text-center">
                    <h2 className="text-4xl font-bold mb-12 tracking-wider">SYSTEM ARCHITECTURE</h2>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                        <div className="p-8 border border-white/10 bg-black/60 backdrop-blur-sm hover:border-cyan-500/50 transition-all hover:-translate-y-2">
                            <div className="text-4xl mb-4">🔮</div>
                            <h3 className="text-xl font-bold mb-2">Prompt Studio</h3>
                            <p className="text-slate-400 text-sm">Refine and debug prompts with AI assistance.</p>
                        </div>
                        <div className="p-8 border border-white/10 bg-black/60 backdrop-blur-sm hover:border-purple-500/50 transition-all hover:-translate-y-2">
                            <div className="text-4xl mb-4">🛠️</div>
                            <h3 className="text-xl font-bold mb-2">Agent Builder</h3>
                            <p className="text-slate-400 text-sm">Visually construct autonomous agent workflows.</p>
                        </div>
                        <div className="p-8 border border-white/10 bg-black/60 backdrop-blur-sm hover:border-emerald-500/50 transition-all hover:-translate-y-2">
                            <div className="text-4xl mb-4">⚡</div>
                            <h3 className="text-xl font-bold mb-2">Local First</h3>
                            <p className="text-slate-400 text-sm">Your data never leaves your machine unless you want it to.</p>
                        </div>
                    </div>
                </div>
            </section>

            {/* CTA */}
            <section className="py-32 bg-black border-t border-white/10 text-center">
                <h2 className="text-6xl font-bold mb-8 text-white tracking-widest">READY TO BUILD?</h2>
                <a href="/studio" className="inline-block px-12 py-5 bg-white text-black font-bold tracking-widest text-lg hover:bg-cyan-400 hover:scale-105 transition-all">
                    LAUNCH STUDIO
                </a>
            </section>

            <footer className="py-8 border-t border-white/10 text-center text-xs text-slate-600 uppercase tracking-widest">
                © 2025 PROMPTFORGE AI. SYSTEM STATUS: ONLINE.
            </footer>
        </div>
    );
};

export default Home;
