import React, { useState } from 'react';
import { WorkProduct } from '../services/AgentExecutionEngine';
import { PDFGenerator } from '../services/PDFGenerator';

interface AgentWorkProductsProps {
    products: WorkProduct[];
    onClose?: () => void;
}

export const AgentWorkProducts: React.FC<AgentWorkProductsProps> = ({ products, onClose }) => {
    const [selectedProduct, setSelectedProduct] = useState<WorkProduct | null>(products[0] || null);
    const [viewMode, setViewMode] = useState<'formatted' | 'raw'>('formatted');

    const downloadPDF = (product: WorkProduct) => {
        const content = typeof product.content === 'string' ? product.content : JSON.stringify(product.content, null, 2);

        const doc = PDFGenerator.generateFromMarkdown(content, {
            title: product.title || 'Agent Report',
            author: 'YaPrompt Agent',
            subject: 'Automated Agent Work Product'
        });

        PDFGenerator.download(doc, product.title || 'agent-report');
    };

    const downloadJSON = (product: WorkProduct) => {
        const json = JSON.stringify(product, null, 2);
        const blob = new Blob([json], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${product.title || 'work-product'}.json`;
        a.click();
        URL.revokeObjectURL(url);
    };

    const copyToClipboard = (content: string) => {
        navigator.clipboard.writeText(content);
        // Show toast or notification
        alert('Copied to clipboard!');
    };

    const renderContent = (product: WorkProduct) => {
        const content = product.content;

        if (viewMode === 'raw') {
            return (
                <pre className="text-sm text-gray-300 whitespace-pre-wrap font-mono bg-gray-900 p-4 rounded max-h-[60vh] overflow-y-auto">
                    {typeof content === 'string' ? content : JSON.stringify(content, null, 2)}
                </pre>
            );
        }

        // Formatted view
        if (product.format === 'markdown' && typeof content === 'string') {
            return (
                <div className="prose prose-invert max-w-none">
                    {content.split('\n').map((line, idx) => {
                        // Simple markdown rendering
                        if (line.startsWith('# ')) {
                            return <h1 key={idx} className="text-3xl font-bold text-white mt-6 mb-4">{line.substring(2)}</h1>;
                        } else if (line.startsWith('## ')) {
                            return <h2 key={idx} className="text-2xl font-bold text-purple-300 mt-5 mb-3 border-b border-purple-500/30 pb-2">{line.substring(3)}</h2>;
                        } else if (line.startsWith('### ')) {
                            return <h3 key={idx} className="text-xl font-semibold text-blue-300 mt-4 mb-2">{line.substring(4)}</h3>;
                        } else if (line.startsWith('---')) {
                            return <hr key={idx} className="my-4 border-gray-700" />;
                        } else if (line.startsWith('- ') || line.startsWith('* ')) {
                            return <li key={idx} className="text-gray-300 ml-4">{line.substring(2)}</li>;
                        } else if (line.trim().startsWith('```')) {
                            return <div key={idx} className="bg-gray-900 p-3 rounded my-2 text-sm font-mono text-green-400">{line}</div>;
                        } else if (line.trim()) {
                            return <p key={idx} className="text-gray-300 mb-2 leading-relaxed">{line}</p>;
                        }
                        return <br key={idx} />;
                    })}
                </div>
            );
        } else if (product.format === 'json' || typeof content === 'object') {
            return (
                <div className="bg-gray-900 p-4 rounded">
                    <pre className="text-sm text-green-400 font-mono overflow-x-auto whitespace-pre-wrap">
                        {JSON.stringify(content, null, 2)}
                    </pre>
                </div>
            );
        } else if (product.format === 'html' && typeof content === 'string') {
            return (
                <div
                    className="bg-white p-6 rounded text-gray-900"
                    dangerouslySetInnerHTML={{ __html: content }}
                />
            );
        }

        return (
            <div className="text-gray-300 whitespace-pre-wrap">
                {typeof content === 'string' ? content : JSON.stringify(content, null, 2)}
            </div>
        );
    };

    if (products.length === 0) {
        return (
            <div className="text-center text-gray-500 py-12">
                <div className="text-6xl mb-4">📭</div>
                <div className="text-lg">No work products yet.</div>
                <div className="text-sm mt-2">Agents will create deliverables here.</div>
            </div>
        );
    }

    return (
        <div className="flex gap-4 h-full">
            {/* Product List Sidebar */}
            <div className="w-80 flex-shrink-0 overflow-y-auto space-y-2">
                <div className="text-sm font-semibold text-gray-400 mb-3 px-2">
                    Work Products ({products.length})
                </div>
                {products.map((product) => (
                    <div
                        key={product.id}
                        onClick={() => setSelectedProduct(product)}
                        className={`p-4 rounded-lg cursor-pointer transition-all ${selectedProduct?.id === product.id
                                ? 'bg-gradient-to-r from-purple-900/50 to-blue-900/50 border-2 border-purple-500'
                                : 'bg-gray-800 hover:bg-gray-750 border border-gray-700 hover:border-gray-600'
                            }`}
                    >
                        <div className="flex items-start justify-between mb-2">
                            <div className="flex-1">
                                <h3 className="font-semibold text-white text-sm line-clamp-2">
                                    {product.title}
                                </h3>
                                <div className="text-xs text-gray-400 mt-1">
                                    {product.agentName}
                                </div>
                            </div>
                            <div className={`text-xs px-2 py-1 rounded ${product.format === 'markdown' ? 'bg-blue-900/50 text-blue-300' :
                                    product.format === 'json' ? 'bg-green-900/50 text-green-300' :
                                        product.format === 'pdf' ? 'bg-red-900/50 text-red-300' :
                                            'bg-gray-900/50 text-gray-300'
                                }`}>
                                {product.format.toUpperCase()}
                            </div>
                        </div>
                        <div className="text-xs text-gray-500">
                            {new Date(product.metadata.timestamp).toLocaleString()}
                        </div>
                        {product.metadata.executionTime && (
                            <div className="text-xs text-purple-400 mt-1">
                                ⏱ {(product.metadata.executionTime / 1000).toFixed(1)}s
                            </div>
                        )}
                    </div>
                ))}
            </div>

            {/* Product Viewer */}
            {selectedProduct && (
                <div className="flex-1 flex flex-col bg-gray-800/50 rounded-lg border border-gray-700 overflow-hidden">
                    {/* Header */}
                    <div className="bg-gray-800 border-b border-gray-700 p-4 flex-shrink-0">
                        <div className="flex items-start justify-between mb-3">
                            <div className="flex-1">
                                <h2 className="text-2xl font-bold text-white mb-1">
                                    {selectedProduct.title}
                                </h2>
                                <div className="text-sm text-gray-400">
                                    by <span className="text-purple-400">{selectedProduct.agentName}</span>
                                    {' '} • {' '}
                                    {new Date(selectedProduct.metadata.timestamp).toLocaleDateString()} at{' '}
                                    {new Date(selectedProduct.metadata.timestamp).toLocaleTimeString()}
                                </div>
                            </div>
                            {onClose && (
                                <button
                                    onClick={onClose}
                                    className="text-gray-400 hover:text-white text-2xl ml-4"
                                >
                                    ✕
                                </button>
                            )}
                        </div>

                        {/* Metadata */}
                        <div className="flex items-center gap-4 text-xs text-gray-500 mb-3">
                            <span>Format: <span className="text-purple-400">{selectedProduct.format}</span></span>
                            {selectedProduct.metadata.executionTime && (
                                <span>Execution Time: <span className="text-blue-400">{(selectedProduct.metadata.executionTime / 1000).toFixed(2)}s</span></span>
                            )}
                            {selectedProduct.metadata.stepsCompleted && (
                                <span>Steps: <span className="text-green-400">{selectedProduct.metadata.stepsCompleted}/{selectedProduct.metadata.totalSteps}</span></span>
                            )}
                        </div>

                        {/* Actions */}
                        <div className="flex gap-2">
                            <button
                                onClick={() => setViewMode(viewMode === 'formatted' ? 'raw' : 'formatted')}
                                className="px-3 py-1.5 bg-gray-700 hover:bg-gray-600 text-white rounded text-sm transition flex items-center gap-1"
                            >
                                {viewMode === 'formatted' ? '📝 Raw' : '✨ Formatted'}
                            </button>
                            <button
                                onClick={() => copyToClipboard(typeof selectedProduct.content === 'string' ? selectedProduct.content : JSON.stringify(selectedProduct.content, null, 2))}
                                className="px-3 py-1.5 bg-gray-700 hover:bg-gray-600 text-white rounded text-sm transition flex items-center gap-1"
                            >
                                📋 Copy
                            </button>
                            <button
                                onClick={() => downloadPDF(selectedProduct)}
                                className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded text-sm transition flex items-center gap-1"
                            >
                                📄 PDF
                            </button>
                            <button
                                onClick={() => downloadJSON(selectedProduct)}
                                className="px-3 py-1.5 bg-green-600 hover:bg-green-700 text-white rounded text-sm transition flex items-center gap-1"
                            >
                                💾 JSON
                            </button>
                        </div>
                    </div>

                    {/* Content */}
                    <div className="flex-1 overflow-y-auto p-6">
                        {renderContent(selectedProduct)}
                    </div>
                </div>
            )}
        </div>
    );
};
