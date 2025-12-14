// Seed Demo Agents - runs on extension install/update
export async function seedDemoAgents() {
    return new Promise((resolve) => {
        chrome.storage.local.get(['activeAgents', 'hasSeededDemoAgents'], (result) => {
            // Only seed if user has no agents and hasn't been seeded before
            if (result.activeAgents && result.activeAgents.length > 0) {
                console.log('User already has agents, skipping demo seed');
                resolve(false);
                return;
            }

            if (result.hasSeededDemoAgents) {
                console.log('Demo agents already seeded');
                resolve(false);
                return;
            }

            const demoAgents = [
                {
                    id: `demo-research-${Date.now()}`,
                    name: "Research Assistant",
                    description: "Conducts in-depth research on any topic and creates comprehensive reports",
                    steps: [
                        {
                            name: "Research Topic",
                            capability: { type: "research" },
                            prompt: "Research the topic in depth, gathering key facts and insights",
                            inputFrom: []
                        },
                        {
                            name: "Summarize Findings",
                            capability: { type: "summarize" },
                            prompt: "Create a concise summary of the research findings",
                            inputFrom: ["Research Topic"]
                        },
                        {
                            name: "Write Report",
                            capability: { type: "write" },
                            prompt: "Write a professional research report with introduction, findings, and conclusions",
                            inputFrom: ["Research Topic", "Summarize Findings"]
                        }
                    ],
                    config: {
                        topic: "artificial intelligence trends",
                        outputFormat: "markdown"
                    },
                    createdAt: Date.now(),
                    isDemo: true
                },
                {
                    id: `demo-analyzer-${Date.now() + 1}`,
                    name: "Market Analyzer",
                    description: "Analyzes market trends, compares competitors, and provides strategic insights",
                    steps: [
                        {
                            name: "Analyze Market",
                            capability: { type: "analyze" },
                            prompt: "Analyze current market trends and dynamics",
                            inputFrom: []
                        },
                        {
                            name: "Compare Competitors",
                            capability: { type: "compare" },
                            prompt: "Compare key competitors in the market",
                            inputFrom: ["Analyze Market"]
                        },
                        {
                            name: "Strategic Recommendations",
                            capability: { type: "evaluate" },
                            prompt: "Provide strategic recommendations based on the analysis",
                            inputFrom: ["Analyze Market", "Compare Competitors"]
                        }
                    ],
                    config: {
                        topic: "tech industry",
                        outputFormat: "markdown"
                    },
                    createdAt: Date.now() + 1,
                    isDemo: true
                },
                {
                    id: `demo-writer-${Date.now() + 2}`,
                    name: "Content Writer",
                    description: "Creates polished, professional content from raw ideas",
                    steps: [
                        {
                            name: "Extract Key Ideas",
                            capability: { type: "extract" },
                            prompt: "Extract and organize the main ideas from the input",
                            inputFrom: []
                        },
                        {
                            name: "Write Content",
                            capability: { type: "write" },
                            prompt: "Transform the ideas into engaging, well-structured content",
                            inputFrom: ["Extract Key Ideas"]
                        }
                    ],
                    config: {
                        topic: "productivity tips",
                        outputFormat: "markdown"
                    },
                    createdAt: Date.now() + 2,
                    isDemo: true
                }
            ];

            chrome.storage.local.set({
                activeAgents: demoAgents,
                hasSeededDemoAgents: true,
                agentLogs: [],
                agentOutputs: []
            }, () => {
                console.log('✅ Demo agents seeded successfully!');

                // Show notification
                chrome.notifications.create({
                    type: 'basic',
                    iconUrl: 'icons/icon128.png',
                    title: '🎉 Welcome to Agent Factory!',
                    message: '3 demo agents have been created. They will start producing work products automatically!'
                });

                resolve(true);
            });
        });
    });
}

// Call this when extension is installed
chrome.runtime.onInstalled.addListener(async (details) => {
    if (details.reason === 'install' || details.reason === 'update') {
        await seedDemoAgents();
    }
});
