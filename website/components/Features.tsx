'use client'

import { motion } from 'framer-motion'
import { Brain, Shield, TrendingUp, Users, Zap, Workflow } from 'lucide-react'

const features = [
    {
        icon: Brain,
        title: 'RL-Based Personalization',
        description: 'Learns your communication style, preferences, and decision patterns through reinforcement learning.',
        color: 'from-blue-500 to-cyan-500',
    },
    {
        icon: Shield,
        title: 'Safe Action Approval',
        description: 'Zero-risk gates with biometric verification for payments, bookings, and sensitive operations.',
        color: 'from-green-500 to-emerald-500',
    },
    {
        icon: TrendingUp,
        title: 'AI Negotiation Engine',
        description: 'Automatically bargain prices with vendors and suppliers. Save 15-30% on average.',
        color: 'from-purple-500 to-pink-500',
    },
    {
        icon: Users,
        title: 'Multi-Persona Modes',
        description: '6 switchable personalities: Business, Negotiator, Friendly, Strict, Research, Finance.',
        color: 'from-orange-500 to-red-500',
    },
    {
        icon: Zap,
        title: 'Autonomous Workflows',
        description: 'Detects patterns in your actions and creates automation automatically.',
        color: 'from-yellow-500 to-orange-500',
    },
    {
        icon: Workflow,
        title: 'Business Automation',
        description: 'Make bookings, generate invoices, communicate with vendors, schedule follow-ups.',
        color: 'from-indigo-500 to-purple-500',
    },
]

export default function Features() {
    return (
        <section id="features" className="py-32 relative">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                {/* Section Header */}
                <motion.div
                    className="text-center mb-20"
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.5 }}
                >
                    <h2 className="text-4xl sm:text-5xl font-black mb-6">
                        <span className="gradient-text">Revolutionary Features</span>
                    </h2>
                    <p className="text-xl text-gray-400 max-w-2xl mx-auto">
                        Built with features no other AI assistant has. This is the future of autonomous digital work.
                    </p>
                </motion.div>

                {/* Features Grid */}
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {features.map((feature, index) => {
                        const Icon = feature.icon
                        return (
                            <motion.div
                                key={index}
                                className="glass rounded-2xl p-8 hover:bg-white/5 transition-all group cursor-pointer"
                                initial={{ opacity: 0, y: 20 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true }}
                                transition={{ duration: 0.5, delay: index * 0.1 }}
                                whileHover={{ scale: 1.05 }}
                            >
                                {/* Icon */}
                                <div className={`w-14 h-14 rounded-xl bg-gradient-to-br ${feature.color} flex items-center justify-center mb-6 group-hover:animate-float`}>
                                    <Icon className="w-7 h-7 text-white" />
                                </div>

                                {/* Content */}
                                <h3 className="text-2xl font-bold mb-4">{feature.title}</h3>
                                <p className="text-gray-400">{feature.description}</p>
                            </motion.div>
                        )
                    })}
                </div>

                {/* Bottom CTA */}
                <motion.div
                    className="mt-20 text-center"
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.5, delay: 0.6 }}
                >
                    <p className="text-gray-400 mb-4">Ready to streamline your workflow?</p>
                    <motion.a
                        href="#download"
                        className="inline-block bg-accent hover:bg-accent/90 text-background px-8 py-3 rounded-lg font-semibold transition-all glow-accent"
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                    >
                        Get Started Free
                    </motion.a>
                </motion.div>
            </div>
        </section>
    )
}
