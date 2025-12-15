'use client'

import { motion } from 'framer-motion'
import { Download, Chrome } from 'lucide-react'

export default function CTA() {
    return (
        <section id="download" className="py-32 relative overflow-hidden">
            {/* Background gradient */}
            <div className="absolute inset-0 bg-gradient-to-r from-primary/20 via-accent/20 to-primary/20 blur-3xl" />

            <div className="relative max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
                <motion.div
                    className="glass rounded-3xl p-12 text-center"
                    initial={{ opacity: 0, scale: 0.9 }}
                    whileInView={{ opacity: 1, scale: 1 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.7 }}
                >
                    {/* Badge */}
                    <div className="inline-flex items-center space-x-2 bg-card border border-primary/30 rounded-full px-4 py-2 mb-6">
                        <span className="text-sm text-gray-300">✨ Free Forever • No Credit Card</span>
                    </div>

                    {/* Headline */}
                    <h2 className="text-4xl sm:text-5xl font-black mb-6">
                        Start Automating Today
                    </h2>
                    <p className="text-xl text-gray-400 mb-10 max-w-2xl mx-auto">
                        Join thousands of professionals saving 40% of their time with WorkerAI.
                        Install the Chrome extension and get started in under 60 seconds.
                    </p>

                    {/* CTA Buttons */}
                    <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-8">
                        <motion.a
                            href="https://chrome.google.com/webstore"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="group flex items-center space-x-3 bg-primary hover:bg-opacity-90 text-white px-8 py-4 rounded-xl text-lg font-semibold transition-all glow w-full sm:w-auto justify-center"
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                        >
                            <Chrome className="w-6 h-6" />
                            <span>Add to Chrome</span>
                            <Download className="w-5 h-5 group-hover:translate-y-1 transition-transform" />
                        </motion.a>

                        <motion.a
                            href="/pricing"
                            className="flex items-center space-x-2 glass hover:bg-white/5 text-white px-8 py-4 rounded-xl text-lg font-semibold transition-all w-full sm:w-auto justify-center"
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                        >
                            <span>View Pricing</span>
                        </motion.a>
                    </div>

                    {/* Social Proof */}
                    <div className="flex items-center justify-center space-x-8 text-sm text-gray-500">
                        <div className="flex items-center space-x-1">
                            <span className="text-yellow-500">★★★★★</span>
                            <span>4.9/5.0</span>
                        </div>
                        <div>|</div>
                        <div>1,000+ Active Users</div>
                        <div>|</div>
                        <div>$50K+ Saved</div>
                    </div>

                    {/* Features List */}
                    <div className="mt-12 grid sm:grid-cols-3 gap-6 text-sm">
                        <div className="flex items-center justify-center space-x-2">
                            <div className="w-5 h-5 rounded-full bg-accent flex items-center justify-center">
                                <span className="text-background text-xs">✓</span>
                            </div>
                            <span>No credit card required</span>
                        </div>
                        <div className="flex items-center justify-center space-x-2">
                            <div className="w-5 h-5 rounded-full bg-accent flex items-center justify-center">
                                <span className="text-background text-xs">✓</span>
                            </div>
                            <span>Cancel anytime</span>
                        </div>
                        <div className="flex items-center justify-center space-x-2">
                            <div className="w-5 h-5 rounded-full bg-accent flex items-center justify-center">
                                <span className="text-background text-xs">✓</span>
                            </div>
                            <span>Free updates forever</span>
                        </div>
                    </div>
                </motion.div>
            </div>
        </section>
    )
}
