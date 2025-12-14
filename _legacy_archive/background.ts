// Background Service Worker for Agent Activity Monitoring
import { workflowDetector } from './services/WorkflowDetector';
import { HistoryService, ActionEvent } from './services/HistoryService';

// Track current tab activity
let currentActivity: ActionEvent[] = [];
let activityCheckInterval: any = null;

// Initialize monitoring on install
chrome.runtime.onInstalled.addListener(() => {
    console.log('Agent Factory Background Service initialized');
    startActivityMonitoring();
});

// Start monitoring user activity
function startActivityMonitoring() {
    // Monitor tab navigation
    chrome.tabs.onUpdated.addListener(async (tabId, changeInfo, tab) => {
        if (changeInfo.status === 'complete' && tab.url) {
            const event: ActionEvent = {
                type: 'navigation',
                url: tab.url,
                timestamp: Date.now(),
                target: tab.title || ''
            };

            await HistoryService.recordAction(event);
            currentActivity.push(event);

            // Analyze patterns periodically
            await analyzeAndSuggest();
        }
    });

    // Monitor clicks and form submissions via content script messages
    chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
        if (message.action === 'recordUserAction') {
            const event: ActionEvent = {
                type: message.eventType,
                url: sender.tab?.url || '',
                timestamp: Date.now(),
                target: message.target
            };

            HistoryService.recordAction(event);
            currentActivity.push(event);
        }
    });

    // Check for suggestions every 30 seconds
    activityCheckInterval = setInterval(async () => {
        await analyzeAndSuggest();
    }, 30000);
}

// Analyze patterns and create suggestions
async function analyzeAndSuggest() {
    try {
        const history = await HistoryService.getHistory(50); // Last 50 actions
        const patterns = await workflowDetector.analyzeHistory(history);

        if (patterns.length > 0) {
            const suggestions = await workflowDetector.suggestWorkflowAutomation();

            if (suggestions.length > 0) {
                // Store suggestions
                await chrome.storage.local.set({ agentSuggestions: suggestions });

                // Show notification
                chrome.notifications.create({
                    type: 'basic',
                    iconUrl: 'icons/icon128.png',
                    title: 'Agent Suggestion Available',
                    message: `I detected ${suggestions.length} workflow pattern(s) that could be automated. Check your Agent Dashboard!`,
                    priority: 1
                });
            }
        }
    } catch (error) {
        console.error('Error analyzing patterns:', error);
    }
}

// Handle agent execution requests
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.action === 'executeAgent') {
        executeAgent(message.agentId, message.context).then(result => {
            sendResponse(result);
        });
        return true; // Keep channel open for async response
    }

    if (message.action === 'openAgentDashboard') {
        // Open the extension popup or a new tab
        chrome.action.openPopup();
        sendResponse({ status: 'opened' });
    }

    // Handle auto-prompt optimization
    if (message.action === 'optimizePromptAuto') {
        handleAutoOptimization(message.prompt).then(result => {
            sendResponse(result);
        });
        return true; // Keep channel open for async response
    }
});

// Execute an agent using the new LocalAgentOrchestrator
async function executeAgent(agentId: string, context: any) {
    try {
        // Log execution start
        const log = {
            agentId,
            message: `Executing agent: ${agentId}`,
            timestamp: Date.now()
        };

        const logs = await chrome.storage.local.get(['agentLogs']);
        const currentLogs = (logs.agentLogs as any[]) || [];
        await chrome.storage.local.set({ agentLogs: [...currentLogs, log] });

        // Use the NEW LocalAgentOrchestrator for REAL execution
        const { localAgentOrchestrator } = await import('./services/LocalAgentOrchestrator');

        const result = await localAgentOrchestrator.executeAgent({
            agentId,
            input: context,
            strategy: 'auto'
        });

        // Show notification with actual work product
        if (result.success && result.workProduct) {
            chrome.notifications.create({
                type: 'basic',
                iconUrl: 'icons/icon128.png',
                title: 'Work Product Ready ✅',
                message: `${result.workProduct.title} - Click to view`,
                priority: 2
            });

            // Log completion
            const completionLog = {
                agentId,
                message: `Agent completed successfully! Work product: ${result.workProduct.id}`,
                timestamp: Date.now(),
                workProductId: result.workProduct.id
            };

            const updatedLogs = await chrome.storage.local.get(['agentLogs']);
            await chrome.storage.local.set({
                agentLogs: [...((updatedLogs.agentLogs as any[]) || []), completionLog]
            });

            return { status: 'success', result: result.workProduct };
        } else {
            throw new Error(result.error || 'Unknown error');
        }

    } catch (error) {
        console.error('Agent execution failed:', error);

        // Show error notification
        chrome.notifications.create({
            type: 'basic',
            iconUrl: 'icons/icon128.png',
            title: 'Agent Execution Failed ❌',
            message: error instanceof Error ? error.message : 'Unknown error',
            priority: 2
        });

        return { status: 'error', error: String(error) };
    }
}

// Handle auto prompt optimization
async function handleAutoOptimization(prompt: string) {
    try {
        const { promptAutoOptimizer } = await import('./services/PromptAutoOptimizer');

        const result = await promptAutoOptimizer.optimizePrompt(prompt, {
            goal: 'Chain-of-Thought Reasoning',
            model: 'chatgpt'
        });

        return {
            success: true,
            optimized: result.optimized,
            improvements: result.improvements
        };
    } catch (error) {
        console.error('Auto-optimization failed:', error);
        return {
            success: false,
            error: error instanceof Error ? error.message : 'Optimization failed'
        };
    }
}

// Clean up on unload
chrome.runtime.onSuspend.addListener(() => {
    if (activityCheckInterval) {
        clearInterval(activityCheckInterval);
    }
});
