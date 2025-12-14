'use client'

import { motion } from 'framer-motion'
import { Sparkles, ArrowRight } from 'lucide-react'

export default function Hero() {
    return (
        <section className="relative min-h-screen flex items-center justify-center overflow-hidden pt-16">
            {/* Animated background */}
            <div className="absolute inset-0 bg-gradient-to-b from-primary/10 via-transparent to-transparent" />
            <div className="absolute inset-0">
                {[...Array(20)].map((_, i) => (
                    <motion.div
                        key={i}
                        className="absolute w-1 h-1 bg-accent rounded-full"
                        style={{
                            left: `${Math.random() * 100}%`,
                            top: `${Math.random() * 100}%`,
                        }}
                        animate={{
                            opacity: [0, 1, 0],
                            scale: [0, 1, 0],
                        }}
                        transition={{
                            duration: 3,
                            repeat: Infinity,
                            delay: Math.random() * 2,
                        }}
                    />
                ))}
            </div>

            <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
                <div className="text-center">
                    {/* Badge */}
                    <motion.div
                        className="inline-flex items-center space-x-2 bg-card border border-primary/30 rounded-full px-4 py-2 mb-8"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5 }}
                    >
                        <Sparkles className="w-4 h-4 text-accent" />
                        <span className="text-sm text-gray-300">Introducing the first Autonomous Digital Worker</span>
                    </motion.div>

                    {/* Headline */}
                    <motion.h1
                        className="text-5xl sm:text-6xl lg:text-7xl font-black mb-6 leading-tight"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5, delay: 0.1 }}
                    >
                        Your Personal <br />
                        <span className="gradient-text">Digital Worker</span>
                    </motion.h1>

                    {/* Subtitle */}
                    <motion.p
                        className="text-xl sm:text-2xl text-gray-400 mb-12 max-w-3xl mx-auto"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5, delay: 0.2 }}
                    >
                        AI that learns your communication style, automates tasks, negotiates deals,
                        and handles business operations — with strict identity-verified approvals.
                    </motion.p>

                    {/* CTA Buttons */}
                    <motion.div
                        className="flex flex-col sm:flex-row items-center justify-center gap-4"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5, delay: 0.3 }}
                    >
                        <motion.a
                            href="#download"
                            className="group flex items-center space-x-2 bg-primary hover:bg-opacity-90 text-white px-8 py-4 rounded-xl text-lg font-semibold transition-all glow"
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                        >
                            <span>Add to Chrome — Free</span>
                            <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                        </motion.a>

                        <motion.a
                            href="#demo"
                            className="flex items-center space-x-2 glass hover:bg-white/5 text-white px-8 py-4 rounded-xl text-lg font-semibold transition-all"
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                        >
                            <span>Watch Demo</span>
                        </motion.a>
                    </motion.div>

                    {/* Stats */}
                    <motion.div
                        className="mt-16 grid grid-cols-3 gap-8 max-w-2xl mx-auto"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5, delay: 0.4 }}
                    >
                        <div>
                            <div className="text-3xl font-bold text-accent">15-30%</div>
                            <div className="text-sm text-gray-400 mt-1">Avg. Savings</div>
                        </div>
                        <div>
                            <div className="text-3xl font-bold text-primary">40%</div>
                            <div className="text-sm text-gray-400 mt-1">Time Saved</div>
                        </div>
                        <div>
                            <div className="text-3xl font-bold text-accent">100%</div>
                            <div className="text-sm text-gray-400 mt-1">Local & Private</div>
                        </div>
                    </motion.div>

                    {/* Animated mockup placeholder */}
                    <motion.div
                        className="mt-20 relative"
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ duration: 0.8, delay: 0.5 }}
                    >
                        <div className="glass rounded-2xl p-8 max-w-4xl mx-auto">
                            <div className="bg-gradient-to-br from-primary/20 to-accent/20 rounded-xl h-96 flex items-center justify-center relative overflow-hidden">
                                <div className="absolute inset-0 bg-grid-pattern opacity-10" />
                                <div className="relative text-center">
                                    <div className="text-6xl mb-4">🤖</div>
                                    <div className="text-2xl font-bold gradient-text">Your AI Worker in Action</div>
                                    <div className="text-gray-400 mt-2">Automating tasks, negotiations, and workflows</div>
                                </div>
                            </div>
                        </div>
                    </motion.div>
                </div>
            </div>
        </section>
    )
}
