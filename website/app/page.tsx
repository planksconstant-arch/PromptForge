'use client'

import React from 'react'
import { motion } from 'framer-motion'
import { ArrowRight, Zap, Shield, Cpu } from 'lucide-react'
import Particles from '../components/ui/Particles'
import GradientText from '../components/ui/GradientText'
import SpotlightCard from '../components/ui/SpotlightCard'
import TrueFocus from '../components/ui/TrueFocus'

export default function LandingPage() {

    const styles = {
        container: {
            minHeight: '100vh',
            backgroundColor: '#050505',
            color: 'white',
            overflowX: 'hidden' as const,
            fontFamily: 'Inter, sans-serif'
        },
        hero: {
            position: 'relative' as const,
            minHeight: '90vh',
            display: 'flex',
            flexDirection: 'column' as const,
            alignItems: 'center',
            justifyContent: 'center',
            textAlign: 'center' as const,
            padding: '20px',
        },
        button: {
            background: 'linear-gradient(90deg, #00F0FF, #7000FF)',
            color: 'white',
            padding: '16px 48px',
            borderRadius: '12px',
            fontSize: '18px',
            fontWeight: 'bold',
            border: 'none',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            transition: 'transform 0.2s',
            boxShadow: '0 0 30px rgba(0, 240, 255, 0.4)'
        }
    }

    const features = [
        {
            icon: <Zap size={24} color="#00F0FF" />,
            title: "Zero-Latency Engineering",
            desc: "Refine raw ideas into high-precision prompts instantly. No API lag, no waiting."
        },
        {
            icon: <Cpu size={24} color="#7000FF" />,
            title: "Autonomous Agents",
            desc: "Spins up local worker swarms to handle complex research and data extraction tasks."
        },
        {
            icon: <Shield size={24} color="#00F0FF" />,
            title: "Air-Gapped Privacy",
            desc: "Your intellectual property never leaves localhost. Enterprise-grade security by default."
        }
    ]

    return (
        <div style={styles.container}>
            {/* Background */}
            <div style={{ position: 'fixed', inset: 0, zIndex: 0 }}>
                <Particles quantity={150} ease={50} refresh />
                <div style={{ position: 'absolute', top: '-20%', left: '50%', transform: 'translateX(-50%)', width: '80vw', height: '80vh', background: 'radial-gradient(circle, rgba(112,0,255,0.15), transparent 70%)', filter: 'blur(100px)' }} />
            </div>

            <main style={{ position: 'relative', zIndex: 10 }}>

                {/* HERO SECTION */}
                <section style={styles.hero}>
                    <motion.div
                        initial={{ opacity: 0, y: -20 }}
                        animate={{ opacity: 1, y: 0 }}
                        style={{ marginBottom: '32px', display: 'flex', alignItems: 'center', gap: '12px', padding: '8px 16px', background: 'rgba(255,255,255,0.05)', borderRadius: '99px', border: '1px solid rgba(255,255,255,0.1)' }}
                    >
                        <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#00F0FF', boxShadow: '0 0 10px #00F0FF', animation: 'pulse 2s infinite' }}></span>
                        <span style={{ fontSize: '12px', color: '#ccc', letterSpacing: '1px', textTransform: 'uppercase' }}>System Online v1.0</span>
                    </motion.div>

                    <div style={{ marginBottom: '40px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '10px' }}>
                        <h1 style={{ fontSize: 'clamp(40px, 8vw, 80px)', fontWeight: 800, lineHeight: 1.1, margin: 0 }}>
                            Build with <GradientText colors={["#00F0FF", "#7000FF", "#00F0FF"]}>Superhuman</GradientText>
                        </h1>
                        <div style={{ marginTop: '10px' }}>
                            <TrueFocus
                                sentence="Speed Precision Control"
                                manualMode={false}
                                blurAmount={5}
                                borderColor="#00F0FF"
                                animationDuration={0.8}
                            />
                        </div>
                    </div>

                    <motion.p
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.5 }}
                        style={{ fontSize: 'clamp(18px, 4vw, 22px)', color: '#888', maxWidth: '650px', marginBottom: '48px', lineHeight: 1.6 }}
                    >
                        The local command center for prompt engineering. Orchestrate autonomous AI agents without compromising your privacy.
                    </motion.p>

                    <a href="/studio" style={{ textDecoration: 'none' }}>
                        <motion.button
                            style={styles.button}
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ delay: 0.6 }}
                        >
                            Launch Studio <ArrowRight size={20} />
                        </motion.button>
                    </a>

                    {/* Hero Visual */}
                    <motion.div
                        initial={{ opacity: 0, y: 50 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.8, duration: 0.8 }}
                        style={{ marginTop: '120px', width: '100%', maxWidth: '1000px', padding: '0 20px' }}
                    >
                        <div style={{
                            display: 'grid',
                            gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
                            gap: '24px'
                        }}>
                            {features.map((f, i) => (
                                <SpotlightCard key={i} className="bg-black/40 border-white/5 p-8 rounded-2xl flex flex-col gap-4 text-left group hover:border-white/10 transition-colors">
                                    <div style={{
                                        padding: '14px',
                                        background: 'rgba(255,255,255,0.03)',
                                        borderRadius: '14px',
                                        width: 'fit-content',
                                        border: '1px solid rgba(255,255,255,0.05)'
                                    }}>
                                        {f.icon}
                                    </div>
                                    <h3 style={{ fontSize: '22px', fontWeight: 'bold', color: 'white', letterSpacing: '-0.5px' }}>{f.title}</h3>
                                    <p style={{ color: '#888', lineHeight: 1.6, fontSize: '15px' }}>{f.desc}</p>
                                </SpotlightCard>
                            ))}
                        </div>
                    </motion.div>
                </section>

                <footer style={{ padding: '60px 20px', textAlign: 'center', color: '#444', borderTop: '1px solid rgba(255,255,255,0.05)' }}>
                    <p style={{ fontSize: '14px' }}>© 2024 YaPrompt Studio. <span style={{ color: '#666' }}>Local First Architecture.</span></p>
                </footer>
            </main>
        </div>
    )
}
