'use client'

import { motion } from 'framer-motion'
import { Download } from 'lucide-react'

export default function Navbar() {
    return (
        <motion.nav
            className="fixed top-0 w-full z-50 glass"
            initial={{ y: -100 }}
            animate={{ y: 0 }}
            transition={{ duration: 0.5 }}
        >
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex items-center justify-between h-16">
                    {/* Logo */}
                    <div className="flex items-center space-x-2">
                        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary to-accent flex items-center justify-center">
                            <span className="text-white font-bold text-lg">W</span>
                        </div>
                        <span className="text-xl font-bold gradient-text">WorkerAI</span>
                    </div>

                    {/* Nav Links */}
                    <div className="hidden md:flex items-center space-x-8">
                        <a href="#features" className="text-gray-300 hover:text-white transition-colors">
                            Features
                        </a>
                        <a href="#demo" className="text-gray-300 hover:text-white transition-colors">
                            Demo
                        </a>
                        <a href="#security" className="text-gray-300 hover:text-white transition-colors">
                            Security
                        </a>
                        <a href="/pricing" className="text-gray-300 hover:text-white transition-colors">
                            Pricing
                        </a>
                    </div>

                    {/* CTA Button */}
                    <div className="flex items-center space-x-4">
                        <a href="/studio" className="hidden md:flex items-center space-x-1 text-primary hover:text-white transition-colors font-semibold">
                            <span>Launch Studio</span>
                        </a>
                        <motion.a
                            href="#download"
                            className="flex items-center space-x-2 bg-primary hover:bg-opacity-80 text-white px-4 py-2 rounded-lg transition-all glow"
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                        >
                            <Download className="w-4 h-4" />
                            <span className="hidden sm:inline">Add to Chrome</span>
                            <span className="sm:hidden">Install</span>
                        </motion.a>
                    </div>
                </div>
            </div>
        </motion.nav>
    )
}
