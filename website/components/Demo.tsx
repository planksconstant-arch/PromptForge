'use client'

import { motion } from 'framer-motion'
import { Play } from 'lucide-react'

export default function Demo() {
    return (
        <section id="demo" className="py-32 relative bg-gradient-to-b from-transparent via-primary/5 to-transparent">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                {/* Section Header */}
                <motion.div
                    className="text-center mb-16"
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.5 }}
                >
                    <h2 className="text-4xl sm:text-5xl font-black mb-6">
                        See It In <span className="gradient-text">Action</span>
                    </h2>
                    <p className="text-xl text-gray-400 max-w-2xl mx-auto">
                        Watch how WorkerAI negotiates deals, automates bookings, and handles business operations autonomously.
                    </p>
                </motion.div>

                {/* Demo Video Container */}
                <motion.div
                    className="max-w-5xl mx-auto"
                    initial={{ opacity: 0, y: 40 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.7 }}
                >
                    <div className="glass rounded-2xl p-8 group cursor-pointer hover:scale-105 transition-transform duration-300">
                        <div className="relative bg-gradient-to-br from-primary/20 to-accent/20 rounded-xl aspect-video flex items-center justify-center overflow-hidden">
                            {/* Play button */}
                            <motion.div
                                className="absolute inset-0 bg-black/40 flex items-center justify-center group-hover:bg-black/30 transition-colors"
                                whileHover={{ scale: 1.1 }}
                            >
                                <div className="w-20 h-20 rounded-full bg-primary flex items-center justify-center shadow-2xl group-hover:scale-110 transition-transform">
                                    <Play className="w-10 h-10 text-white ml-1" fill="currentColor" />
                                </div>
                            </motion.div>

                            {/* Placeholder content */}
                            <div className="absolute inset-0 bg-grid-pattern opacity-10" />
                            <div className="relative text-center p-12">
                                <div className="text-6xl mb-4">🎬</div>
                                <div className="text-2xl font-bold">Watch Demo Video</div>
                                <div className="text-gray-400 mt-2">See negotiation, booking & automation in action</div>
                            </div>
                        </div>
                    </div>
                </motion.div>

                {/* Use Case Examples */}
                <motion.div
                    className="mt-20 grid md:grid-cols-3 gap-8"
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.5, delay: 0.3 }}
                >
                    {[
                        {
                            icon: '💰',
                            title: 'Price Negotiation',
                            desc: 'AI bargains with vendor, saves ₹2,200 (22%) on bulk order'
                        },
                        {
                            icon: '📅',
                            title: 'Auto Booking',
                            desc: 'Books restaurant table with biometric approval in 30 seconds'
                        },
                        {
                            icon: '📧',
                            title: 'Smart Outreach',
                            desc: 'Drafts personalized sales email in your exact writing style'
                        }
                    ].map((example, index) => (
                        <div key={index} className="glass rounded-xl p-6 text-center">
                            <div className="text-4xl mb-3">{example.icon}</div>
                            <h4 className="font-bold text-lg mb-2">{example.title}</h4>
                            <p className="text-gray-400 text-sm">{example.desc}</p>
                        </div>
                    ))}
                </motion.div>
            </div>
        </section>
    )
}
