import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
    title: 'WorkerAI - Your Personal Autonomous Digital Worker',
    description: 'AI-powered digital worker that learns your style, automates tasks, negotiates deals, and handles business operations with zero-risk approval gates.',
    keywords: ['AI assistant', 'digital worker', 'task automation', 'AI negotiation', 'business automation', 'Chrome extension'],
    openGraph: {
        title: 'WorkerAI - Personal Autonomous Digital Worker',
        description: 'Automate tasks, communication, and workflows adapted to your style.',
        type: 'website',
    },
}

export default function RootLayout({
    children,
}: {
    children: React.ReactNode
}) {
    return (
        <html lang="en">
            <body>{children}</body>
        </html>
    )
}
