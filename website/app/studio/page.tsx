'use client'

import React, { useState, useEffect, CSSProperties } from 'react'
import { Sparkles, Zap, ArrowRight, Plus } from 'lucide-react'
import Particles from '../../components/ui/Particles'
import OutputPanel from '../../components/OutputPanel'
import { FullResult } from '../../types'

// Types
interface Agent {
    id: string;
    name: string;
    description: string;
}

export default function StudioPage() {
    const [input, setInput] = useState('')
    const [agents, setAgents] = useState<Agent[]>([])
    const [selectedAgentId, setSelectedAgentId] = useState<string>('')
    const [rawResult, setRawResult] = useState<any>(null)
    const [fullResult, setFullResult] = useState<FullResult | null>(null)
    const [loading, setLoading] = useState(false)
    const [newAgentDesc, setNewAgentDesc] = useState('')
    const [creatingAgent, setCreatingAgent] = useState(false)
    const [error, setError] = useState<string | null>(null)

    const [models, setModels] = useState<{ name: string }[]>([])
    const [selectedModel, setSelectedModel] = useState<string>('')

    useEffect(() => {
        // Load agents
        fetch('http://localhost:8000/agents').then(res => res.json()).then(data => {
            setAgents(data)
            if (data.length > 0) setSelectedAgentId(data[0].id)
        }).catch(() => { })

        // Load models
        fetch('http://localhost:8000/models').then(res => res.json()).then(data => {
            setModels(data)
            const defaultModel = data.find((m: any) => m.name.includes('gemini'))?.name || (data[0]?.name)
            if (defaultModel) setSelectedModel(defaultModel)
        }).catch(() => { })
    }, [])

    // ... (keep existing parseToFullResult)

    const handleExecute = async () => {
        if (!selectedAgentId) return
        setLoading(true)
        setRawResult(null)
        setFullResult(null)
        setError(null)

        try {
            const res = await fetch('http://localhost:8000/execute', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    agent_id: selectedAgentId,
                    input,
                    model: selectedModel
                }),
            })
            const data = await res.json()
            setRawResult(data)

            if (data.detail) {
                setError(data.detail)
            } else {
                const parsed = parseToFullResult(data)
                setFullResult(parsed)
            }
        } catch (e: any) {
            console.error(e)
            setError(e.message || "An unknown error occurred")
        } finally {
            setLoading(false)
        }
    }

    // ...

    <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
        <select
            value={selectedModel}
            onChange={(e) => setSelectedModel(e.target.value)}
            style={{
                background: '#111',
                color: '#00F0FF',
                border: '1px solid #333',
                padding: '8px 16px',
                borderRadius: '8px',
                outline: 'none',
                maxWidth: '200px'
            }}
        >
            {models.map(m => <option key={m.name} value={m.name}>{m.name}</option>)}
        </select>

        <select
            value={selectedAgentId}
            onChange={(e) => setSelectedAgentId(e.target.value)}
            style={{
                background: '#111',
                color: 'white',
                border: '1px solid #333',
                padding: '8px 16px',
                borderRadius: '8px',
                outline: 'none'
            }}
        >
            {agents.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
        </select>
        <div style={{
            padding: '6px 12px',
            borderRadius: '99px',
            background: 'rgba(16, 185, 129, 0.1)',
            border: '1px solid rgba(16, 185, 129, 0.2)',
            color: '#34d399',
            fontSize: '12px',
            display: 'flex',
            alignItems: 'center',
            gap: '6px'
        }}>
            <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#34d399' }} />
            Online
        </div>
    </div>
                </header >

        {/* Main Grid */ }
        < div style = { styles.grid } >

            {/* LEFT PANEL */ }
            < div style = { styles.panel } >
                        <div style={{ padding: '16px', borderBottom: '1px solid rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <Sparkles size={16} color="#00F0FF" />
                            <span style={{ fontWeight: 600 }}>Input Prompt</span>
                        </div>

                        <div style={{ flex: 1, position: 'relative' }}>
                            <textarea
                                value={input}
                                onChange={e => setInput(e.target.value)}
                                placeholder="Enter your prompt to optimize..."
                                style={styles.textarea}
                            />
                        </div>

                        <div style={{ padding: '16px', background: 'rgba(0,0,0,0.3)', borderTop: '1px solid rgba(255,255,255,0.05)', display: 'flex', gap: '12px' }}>
                            <div style={{ flex: 1, position: 'relative', display: 'flex', gap: '8px' }}>
                                <input
                                    value={newAgentDesc}
                                    onChange={e => setNewAgentDesc(e.target.value)}
                                    placeholder="Clone as new agent..."
                                    style={{
                                        width: '100%',
                                        background: 'rgba(255,255,255,0.05)',
                                        border: '1px solid rgba(255,255,255,0.05)',
                                        borderRadius: '8px',
                                        padding: '8px 12px',
                                        color: 'white',
                                        outline: 'none'
                                    }}
                                />
                                <button
                                    onClick={handleCreateAgent}
                                    style={{
                                        background: 'rgba(255,255,255,0.1)',
                                        border: 'none',
                                        borderRadius: '8px',
                                        width: '40px',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        cursor: creatingAgent ? 'wait' : 'pointer'
                                    }}
                                >
                                    <Plus size={16} color="white" />
                                </button>
                            </div>
                            <button
                                onClick={handleExecute}
                                disabled={loading || !input}
                                style={{
                                    background: loading || !input ? '#333' : '#00F0FF',
                                    color: loading || !input ? '#888' : 'black',
                                    border: 'none',
                                    borderRadius: '8px',
                                    padding: '0 24px',
                                    fontWeight: 'bold',
                                    cursor: loading ? 'wait' : 'pointer',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '8px'
                                }}
                            >
                                {loading ? 'Running...' : 'Optimize'}
                                {!loading && <ArrowRight size={16} />}
                            </button>
                        </div>
                    </div >

        {/* RIGHT PANEL - OUTPUT */ }
        < div style = { styles.panel } >
                        <div style={{ padding: '16px', borderBottom: '1px solid rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <Zap size={16} color="#7000FF" />
                                <span style={{ fontWeight: 600 }}>Optimized Result</span>
                            </div>
                        </div>

                        <div style={{ flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
                            <OutputPanel
                                result={fullResult}
                                loading={loading}
                                error={error}
                            />
                        </div>

    {
        rawResult?.metadata && (
            <div style={{ padding: '8px 16px', background: 'rgba(0,0,0,0.5)', fontSize: '11px', color: '#666', borderTop: '1px solid rgba(255,255,255,0.05)', display: 'flex', justifyContent: 'space-between' }}>
                <span>Time: {rawResult.metadata?.executionTime ? Math.round(rawResult.metadata.executionTime) : 0}ms</span>
                <span>Steps: {rawResult.metadata?.stepsCompleted || 0}</span>
            </div>
        )
    }
                    </div >
                </div >
            </div >
        </div >
    )
}
