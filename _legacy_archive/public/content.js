// YapromptController - Main controller for the prompt optimization overlay
class YapromptController {
    constructor() {
        this.activeElement = null;
        this.isAnalyzing = false;
        this.debouncer = null;
        this.init();
    }

    init() {
        this.overlay = new YapromptUI(this);
        this.observeInputs();

        document.addEventListener('click', (e) => {
            if (this.overlay.shadowRoot && !this.overlay.shadowRoot.contains(e.target) && e.target !== this.activeElement) {
                this.overlay.hide();
            }
        });
    }

    observeInputs() {
        const attachEvents = (element) => {
            if (element.dataset.yapromptAttached) return;
            element.dataset.yapromptAttached = "true";

            element.addEventListener('focus', () => this.handleFocus(element));
            element.addEventListener('input', () => this.handleInput(element));
        };

        document.querySelectorAll('textarea, div[contenteditable="true"], input[type="text"]').forEach(attachEvents);

        const observer = new MutationObserver((mutations) => {
            mutations.forEach((mutation) => {
                mutation.addedNodes.forEach((node) => {
                    if (node.nodeType === 1) {
                        if (node.matches && (node.matches('textarea, input[type="text"]') || node.getAttribute('contenteditable') === 'true')) {
                            attachEvents(node);
                        }
                        node.querySelectorAll && node.querySelectorAll('textarea, div[contenteditable="true"], input[type="text"]').forEach(attachEvents);
                    }
                });
            });
        });

        observer.observe(document.body, { childList: true, subtree: true });
    }

    handleFocus(element) {
        this.activeElement = element;
        this.overlay.attachTo(element);
        this.analyzeText(this.getText(element));
    }

    handleInput(element) {
        if (this.debouncer) clearTimeout(this.debouncer);
        this.debouncer = setTimeout(() => {
            this.analyzeText(this.getText(element));
        }, 1000);
    }

    getText(element) {
        return element.value || element.innerText || "";
    }

    async analyzeText(text) {
        if (!text || text.length < 10) {
            this.overlay.setSuggestions([]);
            this.overlay.hide();
            return;
        }

        this.isAnalyzing = true;
        this.overlay.setLoading(true);

        try {
            const response = await chrome.runtime.sendMessage({ action: "analyzePromptStructure", text });
            if (response && response.suggestions) {
                this.overlay.setSuggestions(response.suggestions);
                // Auto-show the popup if there are suggestions
                if (response.suggestions.length > 0) {
                    this.overlay.showWidget();
                }
            }
        } catch (error) {
            console.error("Yaprompt Analysis Error:", error);
        } finally {
            this.isAnalyzing = false;
            this.overlay.setLoading(false);
        }
    }

    applyFix(fix) {
        if (!this.activeElement) return;

        const currentText = this.getText(this.activeElement);
        let newText = currentText;

        if (fix.type === 'replace') {
            newText = currentText.replace(fix.original, fix.replacement);
        } else if (fix.type === 'append') {
            newText = currentText + " " + fix.text;
        } else if (fix.type === 'prepend') {
            newText = fix.text + currentText;
        } else if (fix.type === 'full_optimized') {
            // Complete replacement with AI-optimized text
            newText = fix.text;
        }

        if (this.activeElement.value !== undefined) {
            this.activeElement.value = newText;
        } else {
            this.activeElement.innerText = newText;
        }

        this.activeElement.dispatchEvent(new Event('input', { bubbles: true }));
        this.overlay.showSuccessMessage("✓ Applied!");

        setTimeout(() => this.analyzeText(newText), 500);
    }

    async fullOptimize() {
        const text = this.getText(this.activeElement);
        this.overlay.setLoading(true);
    }

    sendFeedback(isPositive, originalText, optimizedText) {
        chrome.runtime.sendMessage({
            action: "recordFeedback",
            feedback: {
                positive: isPositive,
                original: originalText,
                optimized: optimizedText,
                timestamp: Date.now()
            }
        });
    }

    openFullOptimizer() {
        const text = this.getText(this.activeElement);
        chrome.runtime.sendMessage({ action: "openSidePanel", prompt: text });
    }
}

class YapromptUI {
    constructor(controller) {
        this.controller = controller;
        this.host = document.createElement('div');
        this.host.id = "yaprompt-host";
        this.host.style.position = "absolute";
        this.host.style.zIndex = "2147483647";
        this.host.style.top = "0";
        this.host.style.left = "0";
        this.host.style.pointerEvents = "none"; // Container doesn't block

        this.shadowRoot = this.host.attachShadow({ mode: 'open' });
        document.body.appendChild(this.host);

        this.render();
    }

    render() {
        const style = `
            :host {
                font-family: 'Inter', system-ui, -apple-system, sans-serif;
            }
            .yaprompt-widget {
                position: absolute;
                pointer-events: auto;
                display: none;
                flex-direction: column;
                background: #1e1e2e;
                border: 1px solid #6366f1;
                border-radius: 12px;
                box-shadow: 0 10px 30px rgba(99, 102, 241, 0.4);
                width: 340px;
                max-height: 400px;
                overflow: hidden;
                animation: fadeIn 0.2s ease-out;
            }
            .yaprompt-trigger {
                position: absolute;
                pointer-events: auto;
                width: 36px;
                height: 36px;
                background: linear-gradient(135deg, #6366f1, #8b5cf6);
                border-radius: 50%;
                display: flex;
                align-items: center;
                justify-content: center;
                cursor: pointer;
                box-shadow: 0 4px 12px rgba(99, 102, 241, 0.5);
                transition: all 0.2s;
                z-index: 10;
            }
            .yaprompt-trigger:hover {
                transform: scale(1.1);
                box-shadow: 0 6px 16px rgba(99, 102, 241, 0.6);
            }
            .yaprompt-trigger svg {
                width: 20px;
                height: 20px;
                color: white;
            }
            .badge {
                position: absolute;
                top: -4px;
                right: -4px;
                background: #ef4444;
                color: white;
                font-size: 10px;
                font-weight: bold;
                width: 18px;
                height: 18px;
                border-radius: 50%;
                display: flex;
                align-items: center;
                justify-content: center;
                border: 2px solid #1e1e2e;
                animation: pulse 2s infinite;
            }
            @keyframes pulse {
                0%, 100% { transform: scale(1); }
                50% { transform: scale(1.1); }
            }
            
            .header {
                padding: 14px 16px;
                background: linear-gradient(135deg, #2d2d44, #1e1e2e);
                display: flex;
                justify-content: space-between;
                align-items: center;
                border-bottom: 1px solid #3f3f5f;
            }
            .title {
                display: flex;
                align-items: center;
                gap: 8px;
                color: #e2e8f0;
                font-size: 13px;
                font-weight: 600;
            }
            .close-btn {
                background: transparent;
                border: none;
                color: #94a3b8;
                font-size: 18px;
                cursor: pointer;
                width: 24px;
                height: 24px;
                display: flex;
                align-items: center;
                justify-content: center;
                border-radius: 4px;
                transition: all 0.2s;
            }
            .close-btn:hover {
                background: #3f3f5f;
                color: #e2e8f0;
            }

            .content {
                flex-grow: 1;
                overflow-y: auto;
                padding: 12px;
                max-height: 280px;
            }
            .empty-state {
                color: #94a3b8;
                font-size: 13px;
                text-align: center;
                padding: 24px 16px;
                line-height: 1.5;
            }
            .suggestion-item {
                background: #2d2d44;
                padding: 12px;
                border-radius: 8px;
                margin-bottom: 10px;
                border: 1px solid #3f3f5f;
                transition: all 0.2s;
            }
            .suggestion-item:hover {
                border-color: #6366f1;
                box-shadow: 0 2px 8px rgba(99, 102, 241, 0.2);
            }
            .suggestion-type {
                font-size: 11px;
                font-weight: 600;
                margin-bottom: 6px;
                text-transform: uppercase;
                letter-spacing: 0.5px;
            }
            .type-clarity { color: #3b82f6; }
            .type-missing { color: #ef4444; }
            .type-structure { color: #f59e0b; }
            .type-enhancement { color: #10b981; }
            .type-tone { color: #8b5cf6; }
            .type-constraint { color: #06b6d4; }
            
            .suggestion-text {
                color: #cbd5e1;
                font-size: 12px;
                margin-bottom: 10px;
                line-height: 1.5;
            }
            .apply-btn {
                background: linear-gradient(135deg, #6366f1, #8b5cf6);
                color: white;
                border: none;
                padding: 6px 14px;
                border-radius: 6px;
                font-size: 11px;
                font-weight: 600;
                cursor: pointer;
                transition: all 0.2s;
            }
            .apply-btn:hover {
                transform: translateY(-1px);
                box-shadow: 0 4px 8px rgba(99, 102, 241, 0.3);
            }

            .footer {
                padding: 12px;
                background: #1a1a2e;
                border-top: 1px solid #3f3f5f;
            }
            .optimize-btn {
                background: linear-gradient(135deg, #6366f1, #8b5cf6);
                color: white;
                border: none;
                padding: 10px 16px;
                border-radius: 8px;
                font-size: 12px;
                font-weight: 600;
                cursor: pointer;
                display: flex;
                align-items: center;
                gap: 8px;
                width: 100%;
                justify-content: center;
                transition: all 0.2s;
            }
            .optimize-btn:hover {
                transform: translateY(-2px);
                box-shadow: 0 6px 12px rgba(99, 102, 241, 0.4);
            }
            
            @keyframes fadeIn {
                from { opacity: 0; transform: translateY(8px); }
                to { opacity: 1; transform: translateY(0); }
            }
            
            ::-webkit-scrollbar { width: 6px; }
            ::-webkit-scrollbar-track { background: #1e1e2e; }
            ::-webkit-scrollbar-thumb { background: #4f46e5; border-radius: 3px; }
            ::-webkit-scrollbar-thumb:hover { background: #6366f1; }
        `;

        this.shadowRoot.innerHTML = `
            <style>${style}</style>
            
            <div class="yaprompt-trigger" id="trigger">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                    <circle cx="12" cy="12" r="10"></circle>
                    <path d="M12 16v-4"></path>
                    <path d="M12 8h.01"></path>
                </svg>
                <div class="badge" id="badge" style="display: none;">0</div>
            </div>

            <div class="yaprompt-widget" id="widget">
                <div class="header">
                    <div class="title">
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
                        Prompt Optimizer
                    </div>
                    <button class="close-btn" id="close">✕</button>
                </div>
                
                <div class="content" id="content">
                    <div class="empty-state">
                        Start typing to get prompt engineering tips...
                    </div>
                </div>

                <div class="footer">
                    <button class="optimize-btn" id="full-optimize">
                        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><path d="M12 16v-4"></path><path d="M12 8h.01"></path></svg>
                        Full AI Optimizer
                    </button>
                </div>
            </div>
        `;

        this.trigger = this.shadowRoot.getElementById('trigger');
        this.widget = this.shadowRoot.getElementById('widget');
        this.content = this.shadowRoot.getElementById('content');
        this.badge = this.shadowRoot.getElementById('badge');

        this.trigger.onclick = () => this.toggleWidget();
        this.shadowRoot.getElementById('close').onclick = () => this.hide();
        this.shadowRoot.getElementById('full-optimize').onclick = () => this.controller.fullOptimize();
    }

    attachTo(element) {
        const rect = element.getBoundingClientRect();
        const scrollTop = window.scrollY || document.documentElement.scrollTop;
        const scrollLeft = window.scrollX || document.documentElement.scrollLeft;

        this.trigger.style.display = 'flex';
        this.trigger.style.top = `${rect.bottom + scrollTop - 44}px`;
        this.trigger.style.left = `${rect.right + scrollLeft - 44}px`;

        this.widget.style.top = `${rect.bottom + scrollTop - 420}px`;
        this.widget.style.left = `${rect.right + scrollLeft - 350}px`;

        if (rect.bottom + scrollTop - 420 < 0) {
            this.widget.style.top = `${rect.bottom + scrollTop + 10}px`;
        }
    }

    toggleWidget() {
        this.widget.style.display = this.widget.style.display === 'flex' ? 'none' : 'flex';
    }

    showWidget() {
        this.widget.style.display = 'flex';
    }

    hide() {
        this.widget.style.display = 'none';
    }

    setLoading(isLoading) {
        if (isLoading) {
            this.content.innerHTML = '<div class="empty-state">⚡ Analyzing prompt quality...</div>';
        }
    }

    setSuggestions(suggestions) {
        if (!suggestions || suggestions.length === 0) {
            this.content.innerHTML = '<div class="empty-state">✨ Your prompt looks great!</div>';
            this.badge.style.display = 'none';
            return;
        }

        this.badge.innerText = suggestions.length;
        this.badge.style.display = 'flex';

        this.content.innerHTML = '';
        suggestions.forEach(s => {
            const div = document.createElement('div');
            div.className = 'suggestion-item';
            div.innerHTML = `
                <div class="suggestion-type type-${s.type}">${s.label}</div>
                <div class="suggestion-text">${s.message}</div>
                <button class="apply-btn">Apply Fix ➜</button>
            `;

            div.querySelector('.apply-btn').onclick = () => this.controller.applyFix(s.fix);
            this.content.appendChild(div);
        });
    }

    showOptimizedResult(optimizedText, originalText) {
        this.content.innerHTML = `
            <div style="padding: 16px;">
                <div style="color: #10b981; font-weight: 600; margin-bottom: 12px; display: flex; align-items: center; gap: 8px;">
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <polyline points="20 6 9 17 4 12"></polyline>
                    </svg>
                    AI-Optimized Prompt
                </div>
                
                <div style="background: rgba(99, 102, 241, 0.1); border: 1px solid rgba(99, 102, 241, 0.3); border-radius: 8px; padding: 12px; margin-bottom: 12px; max-height: 200px; overflow-y: auto; color: #e2e8f0; font-size: 13px; line-height: 1.6;">
                    ${optimizedText}
                </div>

                <div style="display: flex; gap: 8px; margin-bottom: 12px;">
                    <button class="apply-btn" style="flex: 1;" id="applyOptimized">✓ Apply Optimized</button>
                    <button class="btn-small btn-view" id="compareBtn">📊 Compare</button>
                </div>

                <div style="color: #94a3b8; font-size: 12px; margin-bottom: 8px;">Was this helpful?</div>
                <div style="display: flex; gap: 8px;">
                    <button class="btn-small" id="thumbsUp" style="flex: 1; background: rgba(16, 185, 129, 0.2); color: #10b981; border: 1px solid rgba(16, 185, 129, 0.3);">
                        👍 Yes
                    </button>
                    <button class="btn-small" id="thumbsDown" style="flex: 1; background: rgba(239, 68, 68, 0.2); color: #ef4444; border: 1px solid rgba(239, 68, 68, 0.3);">
                        👎 No
                    </button>
                </div>

                <div id="comparisonView" style="display: none; margin-top: 16px; padding-top: 16px; border-top: 1px solid rgba(99, 102, 241, 0.2);">
                    <div style="color: #64748b; font-size: 11px; margin-bottom: 8px;">ORIGINAL:</div>
                    <div style="background: rgba(239, 68, 68, 0.1); border: 1px solid rgba(239, 68, 68, 0.2); border-radius: 6px; padding: 10px; margin-bottom: 12px; font-size: 12px; color: #cbd5e1; max-height: 100px; overflow-y: auto;">
                        ${originalText}
                    </div>
                </div>
            </div>
        `;

        // Bind events
        this.content.querySelector('#applyOptimized').onclick = () => {
            this.controller.applyFix({ type: 'full_optimized', text: optimizedText });
        };

        this.content.querySelector('#compareBtn').onclick = () => {
            const comparison = this.content.querySelector('#comparisonView');
            comparison.style.display = comparison.style.display === 'none' ? 'block' : 'none';
        };

        this.content.querySelector('#thumbsUp').onclick = () => {
            this.controller.sendFeedback(true, originalText, optimizedText);
            this.showSuccessMessage("Thanks for your feedback! 🎉");
        };

        this.content.querySelector('#thumbsDown').onclick = () => {
            this.controller.sendFeedback(false, originalText, optimizedText);
            this.showSuccessMessage("Feedback recorded. I'll improve!");
        };
    }

    showError(message) {
        this.content.innerHTML = `
            <div class="empty-state" style="color: #ef4444;">
                ⚠️ ${message}
            </div>
        `;
    }

    showSuccessMessage(message) {
        const tempDiv = document.createElement('div');
        tempDiv.style.cssText = 'position: fixed; top: 20px; left: 50%; transform: translateX(-50%); background: linear-gradient(135deg, #10b981, #059669); color: white; padding: 12px 24px; border-radius: 8px; font-size: 13px; z-index: 2147483647; box-shadow: 0 4px 12px rgba(16, 185, 129, 0.4); font-weight: 600;';
        tempDiv.innerText = message;
        document.body.appendChild(tempDiv);
        setTimeout(() => tempDiv.remove(), 2000);
    }
}

// Initialize
new YapromptController();

// --- Behavior Tracking ---
class BehaviorTracker {
    constructor() {
        this.sessionStart = Date.now();
        this.init();
    }

    init() {
        this.logEvent('page_visit', { title: document.title });

        document.addEventListener('copy', () => {
            const selection = document.getSelection().toString();
            if (selection.length > 5) {
                this.logEvent('copy', { length: selection.length, snippet: selection.substring(0, 50) });
            }
        });

        let maxScroll = 0;
        document.addEventListener('scroll', () => {
            const scrollPct = (window.scrollY / (document.body.scrollHeight - window.innerHeight)) * 100;
            if (scrollPct > maxScroll) {
                maxScroll = scrollPct;
                if (maxScroll > 80 && !this.scrolledDeep) {
                    this.scrolledDeep = true;
                    this.logEvent('deep_read', { scrollDepth: Math.round(maxScroll) });
                }
            }
        });

        document.addEventListener('click', (e) => {
            const link = e.target.closest('a');
            if (link) {
                this.logEvent('navigation_click', { href: link.href, text: link.innerText });
            }
        });
    }

    logEvent(type, data) {
        chrome.runtime.sendMessage({
            action: 'logActivity',
            activity: {
                type,
                url: window.location.href,
                domain: window.location.hostname,
                timestamp: Date.now(),
                data
            }
        });
    }
}

new BehaviorTracker();
