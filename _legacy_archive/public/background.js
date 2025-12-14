// Background Service Worker & Agent Architect

// --- Initialization ---
chrome.runtime.onInstalled.addListener(() => {
  chrome.storage.local.get(['userStyle'], (result) => {
    if (!result.userStyle) {
      chrome.storage.local.set({
        userStyle: {
          formality: 0.5, verbosity: 0.5, complexity: 0.5, samples: 0
        }
      });
    }
  });

  chrome.contextMenus.create({
    id: "scan-style",
    title: "Scan Text for Style Analysis",
    contexts: ["selection"]
  });

  chrome.sidePanel.setPanelBehavior({ openPanelOnActionClick: true })
    .catch((error) => console.error(error));

  chrome.notifications.create({
    type: 'basic',
    iconUrl: 'icons/icon128.png',
    title: 'Yaprompt Active',
    message: 'I am now observing your workflows to suggest automation agents.'
  });
});

// --- Command Handling ---
chrome.commands.onCommand.addListener((command) => {
  if (command === "optimize-prompt") {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (tabs[0]?.id) {
        chrome.sidePanel.open({ tabId: tabs[0].id });
      }
    });
  } else if (command === "scan-selection") {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (tabs[0]?.id) {
        chrome.tabs.sendMessage(tabs[0].id, { action: "scanSelection" });
      }
    });
  } else if (command === "open-dashboard") {
    chrome.tabs.create({ url: chrome.runtime.getURL('agents.html') });
  }
});

// --- Context Menu Handling ---
chrome.contextMenus.onClicked.addListener((info, tab) => {
  if (info.menuItemId === "scan-style" && info.selectionText) {
    analyzeAndTrain(info.selectionText);
    chrome.notifications.create({
      type: 'basic',
      iconUrl: 'icons/icon48.png',
      title: 'Style Scanned',
      message: 'Text analyzed and learning model updated!'
    });
  }
});

// --- Message Handling ---
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === "analyzeText") {
    analyzeAndTrain(request.text);
    sendResponse({ status: "success" });
  } else if (request.action === "openSidePanel") {
    if (sender.tab) {
      chrome.sidePanel.open({ tabId: sender.tab.id });
      chrome.storage.local.set({ pendingPrompt: request.prompt });
    }
  } else if (request.action === "openAgentDashboard") {
    chrome.tabs.create({ url: chrome.runtime.getURL('agents.html') });
  } else if (request.action === "logAction") {
    logLegacyAction(request.data);
  } else if (request.action === "optimizationComplete") {
    showSuccessBadge();
  } else if (request.action === "analyzePromptStructure") {
    const suggestions = analyzePromptHeuristics(request.text);
    sendResponse({ suggestions });
  } else if (request.action === "logActivity") {
    bufferActivity(request.activity);
  } else if (request.action === "fullOptimizePrompt") {
    // Handle async
    fullOptimizePrompt(request.text).then(result => {
      sendResponse(result);
    });
    return true; // Keep channel open for async response
  } else if (request.action === "recordFeedback") {
    recordUserFeedback(request.feedback);
    sendResponse({ status: "recorded" });
  }
});

// --- Agent Architect: Pattern Recognition Engine ---

const ACTIVITY_BUFFER = [];
const BUFFER_LIMIT = 5; // Trigger after 5 activities for easier testing

// Notification throttling to prevent spam
const NOTIFICATION_THROTTLE = {
  lastNotificationTime: 0,
  MIN_INTERVAL: 60000, // Minimum 1 minute between notifications
  notifiedWorkProducts: new Set(), // Track which work products we've already notified about

  canNotify() {
    const now = Date.now();
    return (now - this.lastNotificationTime) >= this.MIN_INTERVAL;
  },

  markNotified(workProductId) {
    this.lastNotificationTime = Date.now();
    this.notifiedWorkProducts.add(workProductId);
  },

  hasBeenNotified(workProductId) {
    return this.notifiedWorkProducts.has(workProductId);
  }
};

function bufferActivity(activity) {
  ACTIVITY_BUFFER.push(activity);
  if (ACTIVITY_BUFFER.length > 200) ACTIVITY_BUFFER.shift();
  if (ACTIVITY_BUFFER.length % BUFFER_LIMIT === 0) {
    analyzeBehaviorPatterns();
  }
}

async function analyzeBehaviorPatterns() {
  const result = await chrome.storage.local.get(['GEMINI_API_KEY', 'activeAgents']);
  const apiKey = result.GEMINI_API_KEY;
  const existingAgents = result.activeAgents || [];

  // Always suggest agents if user has less than 3
  if (existingAgents.length < 3) {
    const commonAgents = [
      {
        foundPattern: true,
        agentName: "Research Assistant",
        description: "automatically summarizing articles and research papers you read",
        trigger: "When you visit educational or news sites",
        workflow: ["Extract main content", "Generate summary", "Store key points"]
      },
      {
        foundPattern: true,
        agentName: "Learning Path Creator",
        description: "organizing learning resources based on topics you're interested in",
        trigger: "When you search for tutorials or courses",
        workflow: ["Track topics", "Find related resources", "Create study plan"]
      },
      {
        foundPattern: true,
        agentName: "Productivity Coach",
        description: "tracking your browsing patterns and suggesting better workflows",
        trigger: "Throughout your browsing session",
        workflow: ["Monitor activity", "Identify time sinks", "Suggest improvements"]
      }
    ];

    const suggestion = commonAgents[existingAgents.length];
    chrome.notifications.create('agent-suggestion-' + Date.now(), {
      type: 'basic',
      iconUrl: 'icons/icon128.png',
      title: '💡 Smart Agent Suggestion',
      message: `I noticed you're ${suggestion.description}. Want me to build "${suggestion.agentName}"?`,
      buttons: [{ title: "Build Agent" }, { title: "Later" }],
      requireInteraction: true
    });
    chrome.storage.local.set({ pendingAgentSuggestion: suggestion });
    return;
  }

  if (!apiKey) return;

  const recentLogs = ACTIVITY_BUFFER.slice(-BUFFER_LIMIT);
  const contextString = JSON.stringify(recentLogs.map(l => ({
    type: l.type,
    domain: l.domain,
    details: l.data,
    time: new Date(l.timestamp).toLocaleTimeString()
  })));

  const prompt = `
    You are an AI Agent Architect. Analyze this user's recent browsing activity log to identify repetitive workflows or problems.
    Activity Log: ${contextString}
    Available Skills: search_web(query), extract_content(url), summarize_pdf(url), upload_to_model(content), find_answers(question, context)
    Task: If you see a pattern, propose an Automation Agent.
    Output JSON only: { "foundPattern": boolean, "agentName": "Name", "description": "Desc", "trigger": "When...", "workflow": ["Step 1"] }
  `;

  try {
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] })
    });

    const data = await response.json();
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text;

    if (text) {
      const cleanJson = text.replace(/```json|```/g, '').trim();
      const suggestion = JSON.parse(cleanJson);

      if (suggestion.foundPattern) {
        chrome.notifications.create('agent-suggestion-' + Date.now(), {
          type: 'basic',
          iconUrl: 'icons/icon128.png',
          title: '✨ New Agent Suggestion',
          message: `I noticed you're ${suggestion.description}. Shall I build the "${suggestion.agentName}"?`,
          buttons: [{ title: "Build Agent" }, { title: "Ignore" }],
          requireInteraction: true
        });
        chrome.storage.local.set({ pendingAgentSuggestion: suggestion });
      }
    }
  } catch (e) {
    console.error("Architect Error:", e);
  }
}

// Handle Notification Clicks (Agent Building)
chrome.notifications.onButtonClicked.addListener((notificationId, buttonIndex) => {
  if (buttonIndex === 0) { // "Build Agent"
    buildAndDeployAgent();
  }
});

// Also handle clicking the notification itself
chrome.notifications.onClicked.addListener((notificationId) => {
  if (notificationId.startsWith('agent-suggestion')) {
    buildAndDeployAgent();
  }
});

async function buildAndDeployAgent() {
  chrome.storage.local.get(['pendingAgentSuggestion', 'activeAgents', 'agentOutputs'], async (result) => {
    const agent = result.pendingAgentSuggestion;
    if (agent) {
      // 1. Try to build via n8n
      let workflowId = `local-${Date.now()}`;
      try {
        const response = await fetch('http://localhost:5678/webhook/build-agent', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            action: 'build',
            description: agent.description,
            prompt: `Create an agent named ${agent.agentName} that does: ${agent.description}`,
            timestamp: Date.now()
          })
        });
        if (response.ok) {
          const data = await response.json();
          workflowId = data.workflowId || workflowId;
          console.log("n8n Build Success:", workflowId);
        }
      } catch (e) {
        console.error("n8n Build Failed, using local fallback", e);
      }

      const newAgent = {
        ...agent,
        id: workflowId, // Use n8n workflow ID if available
        status: 'running',
        lastRun: Date.now()
      };
      const agents = result.activeAgents || [];
      agents.push(newAgent);

      // Create a sample output
      const outputs = result.agentOutputs || [];
      const sampleOutput = {
        id: Date.now().toString() + '-sample',
        agentId: newAgent.id,
        agentName: newAgent.agentName,
        type: 'study_guide',
        title: `Welcome Output from ${newAgent.agentName}`,
        content: {
          concepts: [
            { term: 'Agent Deployed', definition: `${newAgent.agentName} is now active and monitoring your workflow!` }
          ],
          questions: [
            { question: 'What will this agent do?', answer: newAgent.description }
          ]
        },
        timestamp: Date.now()
      };
      outputs.push(sampleOutput);

      chrome.storage.local.set({ activeAgents: agents, agentOutputs: outputs, pendingAgentSuggestion: null });

      chrome.notifications.create({
        type: 'basic',
        iconUrl: 'icons/icon128.png',
        title: 'Agent Deployed! 🚀',
        message: `${agent.agentName} is now active. Opening agent dashboard...`
      });

      // Open the dedicated agents dashboard
      chrome.tabs.create({ url: chrome.runtime.getURL('agents.html') });
    }
  });
}

// --- Advanced Agent Execution Engine (AgentExecutionEngine Integration) ---
setInterval(() => {
  chrome.storage.local.get(['activeAgents', 'agentLogs', 'agentOutputs', 'GEMINI_API_KEY'], async (result) => {
    const agents = result.activeAgents || [];
    let logs = result.agentLogs || [];
    let outputs = result.agentOutputs || [];
    const apiKey = result.GEMINI_API_KEY;

    if (agents.length === 0) return;

    // Pick an agent to run
    const agent = agents[Math.floor(Math.random() * agents.length)];

    // Skip if this agent has run recently (within last 10 minutes)
    const AGENT_COOLDOWN = 10 * 60 * 1000; // 10 minutes
    if (agent.lastRun && (Date.now() - agent.lastRun) < AGENT_COOLDOWN) {
      console.log(`Agent ${agent.agentName || agent.name} is on cooldown, skipping...`);
      return;
    }

    // Update lastRun timestamp
    agent.lastRun = Date.now();
    chrome.storage.local.set({ activeAgents: agents });


    // 1. Log start
    logs.push({
      agentId: agent.id,
      timestamp: Date.now(),
      message: `Starting agent execution: ${agent.agentName || agent.name}`,
      type: 'info'
    });

    // 2. Check if this is a new-style agent with steps (from new builder)
    const isAdvancedAgent = agent.steps && agent.steps.length > 0;

    if (isAdvancedAgent) {
      // Use AgentExecutionEngine for advanced agents
      try {
        // Dynamically import the execution engine
        const { agentExecutionEngine } = await import(chrome.runtime.getURL('dist/services/AgentExecutionEngine.js'));

        logs.push({
          agentId: agent.id,
          timestamp: Date.now(),
          message: `Running advanced agent with ${agent.steps.length} steps...`,
          type: 'info'
        });

        // Execute the agent
        const workProduct = await agentExecutionEngine.executeAgent(
          agent,
          { topic: agent.config?.topic || agent.description },
          apiKey || agent.config?.apiKey
        );

        // Save the work product
        outputs.push(workProduct);

        logs.push({
          agentId: agent.id,
          timestamp: Date.now(),
          message: `✅ Agent completed successfully! Generated: ${workProduct.title}`,
          type: 'success'
        });

        // Notify user - only if throttle allows and this is a new work product
        if (NOTIFICATION_THROTTLE.canNotify() && !NOTIFICATION_THROTTLE.hasBeenNotified(workProduct.id)) {
          chrome.notifications.create({
            type: 'basic',
            iconUrl: 'icons/icon128.png',
            title: '🚀 Agent Complete!',
            message: `${agent.name} created: ${workProduct.title}`
          });
          NOTIFICATION_THROTTLE.markNotified(workProduct.id);
        }

      } catch (error) {
        console.error('Advanced agent execution failed:', error);
        logs.push({
          agentId: agent.id,
          timestamp: Date.now(),
          message: `❌ Error: ${error.message || 'Unknown error'}`,
          type: 'error'
        });
      }
    } else {
      // Fallback for legacy agents - try n8n first
      let n8nSuccess = false;
      try {
        const response = await fetch('http://localhost:5678/webhook/execute-agent', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            agentId: agent.id,
            agentName: agent.agentName || agent.name,
            context: { topic: agent.config?.topic || agent.description },
            timestamp: Date.now()
          })
        });

        if (response.ok) {
          const data = await response.json();
          n8nSuccess = true;

          logs.push({
            agentId: agent.id,
            timestamp: Date.now(),
            message: `n8n workflow completed successfully.`,
            type: 'success'
          });

          // Save Output as WorkProduct format
          const newOutput = {
            id: `wp-${Date.now()}`,
            agentId: agent.id,
            agentName: agent.agentName || agent.name,
            title: data.title || `Output from ${agent.agentName || agent.name}`,
            format: 'json',
            content: data.content || data,
            metadata: {
              executionTime: 0,
              stepsCompleted: 1,
              totalSteps: 1,
              timestamp: Date.now()
            }
          };

          outputs.push(newOutput);

          // Only notify if throttle allows and this is a new work product
          if (NOTIFICATION_THROTTLE.canNotify() && !NOTIFICATION_THROTTLE.hasBeenNotified(newOutput.id)) {
            chrome.notifications.create({
              type: 'basic',
              iconUrl: 'icons/icon128.png',
              title: 'Agent Finished 🚀',
              message: `New data available from ${agent.agentName || agent.name}`
            });
            NOTIFICATION_THROTTLE.markNotified(newOutput.id);
          }
        }
      } catch (e) {
        console.log("n8n connection failed, using LLM fallback", e);
      }

      // LLM Fallback if n8n failed and API key available
      if (!n8nSuccess && apiKey) {
        try {
          const prompt = `You are executing the agent "${agent.agentName || agent.name}".
Description: ${agent.description}
Topic/Input: ${agent.config?.topic || 'General task'}

Generate a comprehensive work product in markdown format. Include:
1. Executive Summary
2. Main Content/Analysis
3. Key Findings or Results
4. Conclusions

Be thorough and professional.`;

          const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              contents: [{ parts: [{ text: prompt }] }],
              generationConfig: { temperature: 0.7, maxOutputTokens: 2048 }
            })
          });

          const data = await response.json();
          const generatedContent = data.candidates?.[0]?.content?.parts?.[0]?.text;

          if (generatedContent) {
            const workProduct = {
              id: `wp-${Date.now()}`,
              agentId: agent.id,
              agentName: agent.agentName || agent.name,
              title: `${agent.agentName || agent.name} Report`,
              format: 'markdown',
              content: generatedContent,
              metadata: {
                executionTime: 0,
                stepsCompleted: 1,
                totalSteps: 1,
                timestamp: Date.now()
              }
            };

            outputs.push(workProduct);

            logs.push({
              agentId: agent.id,
              timestamp: Date.now(),
              message: `✅ Generated work product via LLM`,
              type: 'success'
            });

            // Only notify if throttle allows and this is a new work product
            if (NOTIFICATION_THROTTLE.canNotify() && !NOTIFICATION_THROTTLE.hasBeenNotified(workProduct.id)) {
              chrome.notifications.create({
                type: 'basic',
                iconUrl: 'icons/icon128.png',
                title: 'Work Product Ready 📄',
                message: `${agent.agentName || agent.name} completed its task`
              });
              NOTIFICATION_THROTTLE.markNotified(workProduct.id);
            }
          }
        } catch (e) {
          console.error('LLM execution failed:', e);
          logs.push({
            agentId: agent.id,
            timestamp: Date.now(),
            message: `❌ Execution failed: ${e.message}`,
            type: 'error'
          });
        }
      }
    }

    // Trim logs/outputs
    if (logs.length > 100) logs.shift();
    if (outputs.length > 50) outputs.shift();

    chrome.storage.local.set({ agentLogs: logs, agentOutputs: outputs });
  });
}, 300000); // Run every 5 minutes (reduced from 10 seconds to prevent spam)

// --- Helper Functions ---
function showSuccessBadge() {
  chrome.action.setBadgeText({ text: "✓" });
  chrome.action.setBadgeBackgroundColor({ color: "#10b981" });
  setTimeout(() => chrome.action.setBadgeText({ text: "" }), 3000);
}

function logLegacyAction(data) {
  chrome.storage.local.get(['actionHistory'], (result) => {
    const history = result.actionHistory || [];
    history.push(data);
    if (history.length > 1000) history.shift();
    chrome.storage.local.set({ actionHistory: history });
  });
}

function analyzePromptHeuristics(text) {
  const suggestions = [];
  const lowerText = text.toLowerCase();
  const wordCount = text.split(/\s+/).length;

  // 1. Missing Persona/Role
  if (!lowerText.includes("act as") && !lowerText.includes("you are") && !lowerText.includes("role:")) {
    suggestions.push({
      type: "missing",
      label: "Missing Persona",
      message: "Adding a specific role helps the AI understand the perspective to adopt.",
      fix: { type: "prepend", text: "Act as an expert. " }
    });
  }

  // 2. Vague Language
  const vagueTerms = ["something", "stuff", "things", "good", "nice", "better"];
  vagueTerms.forEach(term => {
    if (lowerText.includes(term)) {
      const replacements = {
        "something": "a detailed example",
        "stuff": "specific items",
        "things": "elements",
        "good": "high-quality",
        "nice": "professional",
        "better": "more effective"
      };
      suggestions.push({
        type: "clarity",
        label: "Vague Language",
        message: `"${term}" is too vague. Be more specific.`,
        fix: { type: "replace", original: term, replacement: replacements[term] }
      });
    }
  });

  // 3. Missing Context
  if (wordCount < 15 && !lowerText.includes("context:") && !lowerText.includes("background:")) {
    suggestions.push({
      type: "missing",
      label: "Needs Context",
      message: "Short prompts often lack context. Add background information.",
      fix: { type: "append", text: " Context: [Add relevant background here]" }
    });
  }

  // 4. Missing Output Format
  if (!lowerText.includes("format") && !lowerText.includes("structure") && !lowerText.includes("list") && !lowerText.includes("table")) {
    suggestions.push({
      type: "structure",
      label: "Specify Format",
      message: "Specify the desired output format for better results.",
      fix: { type: "append", text: " Format your response as a clear, structured list." }
    });
  }

  // 5. Missing Examples
  if (wordCount > 30 && !lowerText.includes("example") && !lowerText.includes("like") && !lowerText.includes("such as")) {
    suggestions.push({
      type: "enhancement",
      label: "Add Examples",
      message: "Providing examples helps clarify your expectations.",
      fix: { type: "append", text: " For example: [Add a concrete example]" }
    });
  }

  // 6. Imperative tone
  if (lowerText.startsWith("write") || lowerText.startsWith("create") || lowerText.startsWith("make")) {
    suggestions.push({
      type: "tone",
      label: "Be More Specific",
      message: "Instead of commanding, describe what you need in detail.",
      fix: { type: "prepend", text: "Please " }
    });
  }

  // 7. Missing Constraints
  if (wordCount > 20 && !lowerText.includes("max") && !lowerText.includes("limit") && !lowerText.includes("words") && !lowerText.includes("length")) {
    suggestions.push({
      type: "constraint",
      label: "Set Constraints",
      message: "Specify length or other constraints for more controlled output.",
      fix: { type: "append", text: " Keep it under 300 words." }
    });
  }

  return suggestions.slice(0, 4); // Limit to top 4 suggestions
}

// --- Full AI Optimization with RL ---
async function fullOptimizePrompt(text) {
  const result = await chrome.storage.local.get(['GEMINI_API_KEY', 'userStyle', 'feedbackHistory']);
  const apiKey = result.GEMINI_API_KEY;

  if (!apiKey) {
    return { error: "API Key not configured. Please add it in extension settings." };
  }

  // Get user style preferences from RL feedback
  const userStyle = result.userStyle || { formality: 0.5, verbosity: 0.5, complexity: 0.5 };
  const feedbackHistory = result.feedbackHistory || [];

  // Analyze feedback to adjust style
  let styleHints = "";
  if (feedbackHistory.length > 0) {
    const recentFeedback = feedbackHistory.slice(-10);
    const positiveCount = recentFeedback.filter(f => f.positive).length;
    const negativeCount = recentFeedback.length - positiveCount;

    if (positiveCount > negativeCount) {
      styleHints = "Continue with the current optimization style - user prefers it.";
    } else {
      styleHints = "User prefers different style. Be more direct, concise, and specific.";
    }
  }

  const optimizationPrompt = `You are an expert prompt engineer. Optimize this AI prompt to be:
- Clear and specific
- Well-structured
- Include proper context
- Define expected output format
- Add relevant constraints

User's writing style preferences:
- Formality: ${userStyle.formality > 0.5 ? 'formal' : 'casual'}
- Verbosity: ${userStyle.verbosity > 0.5 ? 'detailed' : 'concise'}
- Complexity: ${userStyle.complexity > 0.5 ? 'technical' : 'simple'}

${styleHints}

Original prompt:
"${text}"

Return ONLY the optimized prompt, no explanations or meta-commentary.`;

  try {
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: optimizationPrompt }] }],
        generationConfig: {
          temperature: 0.7,
          maxOutputTokens: 500
        }
      })
    });

    const data = await response.json();
    const optimizedText = data.candidates?.[0]?.content?.parts?.[0]?.text?.trim();

    if (optimizedText) {
      return { optimizedText };
    } else {
      return { error: "Failed to generate optimization" };
    }
  } catch (error) {
    console.error("Optimization Error:", error);
    return { error: "Network error. Please try again." };
  }
}

// --- RL Feedback Storage ---
function recordUserFeedback(feedback) {
  chrome.storage.local.get(['feedbackHistory', 'userStyle'], (result) => {
    let history = result.feedbackHistory || [];
    let userStyle = result.userStyle || { formality: 0.5, verbosity: 0.5, complexity: 0.5 };

    // Add feedback to history
    history.push(feedback);
    if (history.length > 100) history.shift(); // Keep last 100

    // Update user style based on feedback
    if (feedback.positive) {
      // Analyze what worked and reinforce it
      const optimizedLength = feedback.optimized.split(' ').length;
      const originalLength = feedback.original.split(' ').length;

      if (optimizedLength > originalLength * 1.5) {
        userStyle.verbosity = Math.min(1, userStyle.verbosity + 0.1);
      } else if (optimizedLength < originalLength * 0.8) {
        userStyle.verbosity = Math.max(0, userStyle.verbosity - 0.1);
      }

      // Check formality (presence of formal words)
      if (feedback.optimized.includes('please') || feedback.optimized.includes('kindly')) {
        userStyle.formality = Math.min(1, userStyle.formality + 0.1);
      }
    } else {
      // User didn't like it - adjust opposite direction
      userStyle.verbosity = Math.max(0, Math.min(1, 1 - userStyle.verbosity));
    }

    chrome.storage.local.set({ feedbackHistory: history, userStyle });
    console.log("RL Feedback recorded. Updated user style:", userStyle);
  });
}

function analyzeAndTrain(text) { console.log("Analyzing style:", text.length); }
