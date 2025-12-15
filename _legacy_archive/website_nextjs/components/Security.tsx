'use client'

import { motion } from 'framer-motion'
import { ShieldCheck, Lock, Eye, Key } from 'lucide-react'

const securityFeatures = [
    {
        icon: ShieldCheck,
        title: 'Biometric Verification',
        description: 'Fingerprint or face unlock required for sensitive actions like payments and bookings.'
    },
    {
        icon: Lock,
        title: '100% Local Processing',
        description: 'All AI processing happens on your device. No data sent to cloud servers.'
    },
    {
        icon: Eye,
        title: 'Full Transparency',
        description: 'Every action requires your explicit approval. Complete audit trail of all operations.'
    },
    {
        icon: Key,
        title: 'Zero Impersonation',
        description: 'AI never impersonates you. All communications disclosed as AI-assisted.'
    }
]

export default function Security() {
    return (
        <section id="security" className="py-32 relative">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                {/* Header */}
                <motion.div
                    className="text-center mb-20"
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.5 }}
                >
                    <div className="inline-flex items-center space-x-2 bg-card border border-accent/30 rounded-full px-4 py-2 mb-6">
                        <ShieldCheck className="w-4 h-4 text-accent" />
                        <span className="text-sm text-gray-300">Security & Privacy First</span>
                    </div>

                    <h2 className="text-4xl sm:text-5xl font-black mb-6">
                        <span className="gradient-text">Zero-Risk</span> by Design
                    </h2>
                    <p className="text-xl text-gray-400 max-w-2xl mx-auto">
                        Your data stays local. Your identity stays protected. Every action requires your approval.
                    </p>
                </motion.div>

                {/* Security Grid */}
                <div className="grid md:grid-cols-2 gap-8 mb-20">
                    {securityFeatures.map((feature, index) => {
                        const Icon = feature.icon
                        return (
                            <motion.div
                                key={index}
                                className="glass rounded-2xl p-8 hover:bg-white/5 transition-all"
                                initial={{ opacity: 0, x: index % 2 === 0 ? -20 : 20 }}
                                whileInView={{ opacity: 1, x: 0 }}
                                viewport={{ once: true }}
                                transition={{ duration: 0.5, delay: index * 0.1 }}
                            >
                                <div className="flex items-start space-x-4">
                                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-accent to-primary flex items-center justify-center flex-shrink-0">
                                        <Icon className="w-6 h-6 text-white" />
                                    </div>
                                    <div>
                                        <h3 className="text-xl font-bold mb-2">{feature.title}</h3>
                                        <p className="text-gray-400">{feature.description}</p>
                                    </div>
                                </div>
                            </motion.div>
                        )
                    })}
                </div>

                {/* Trust Statement */}
                <motion.div
                    className="glass rounded-2xl p-12 text-center max-w-4xl mx-auto"
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.5, delay: 0.4 }}
                >
                    <div className="text-5xl mb-6">🔒</div>
                    <h3 className="text-2xl font-bold mb-4">You're Always in Control</h3>
                    <p className="text-gray-400 mb-6">
                        WorkerAI operates under your supervision. Approve or reject every action before it happens.
                        Payments require biometric + PIN. Bookings expire after 15 minutes. Full transparency, zero surprises.
                    </p>
                    <div className="flex items-center justify-center space-x-8 text-sm text-gray-500">
                        <div>✓ GDPR Compliant</div>
                        <div>✓ No Cloud Sync</div>
                        <div>✓ Open Source (Core)</div>
                    </div>
                </motion.div>
            </div>
        </section>
    )
}
