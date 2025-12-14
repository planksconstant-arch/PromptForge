// Content Script for Yaprompt
// Handles overlay UI, browser automation, and page interactions

// ============================================================================
// AUTO-PROMPT OPTIMIZATION
// ============================================================================

let optimizeButton: HTMLElement | null = null;
let currentTextArea: HTMLTextAreaElement | HTMLInputElement | null = null;
let isOptimizing = false;

// LLM platform detection patterns
const LLM_PATTERNS = {
    chatgpt: {
        hosts: ['chat.openai.com', 'chatgpt.com'],
        selectors: ['textarea[data-id]', '#prompt-textarea', 'textarea.m-0']
    },
    claude: {
        hosts: ['claude.ai'],
        selectors: ['div[contenteditable="true"]', 'textarea']
    },
    gemini: {
        hosts: ['gemini.google.com'],
        selectors: ['div.ql-editor', 'textarea']
    },
    generic: {
        selectors: ['textarea[placeholder*="prompt"]', 'textarea[placeholder*="message"]', 'div[contenteditable="true"][role="textbox"]']
    }
};

function isLLMPlatform(): boolean {
    const hostname = window.location.hostname;
    return Object.values(LLM_PATTERNS).some(pattern =>
        ('hosts' in pattern) && pattern.hosts && pattern.hosts.some(host => hostname.includes(host))
    );
}

function findLLMTextInput(): HTMLTextAreaElement | HTMLInputElement | null {
    const hostname = window.location.hostname;

    for (const [_, pattern] of Object.entries(LLM_PATTERNS)) {
        if (('hosts' in pattern) && pattern.hosts && pattern.hosts.some(host => hostname.includes(host))) {
            for (const selector of pattern.selectors) {
                const element = document.querySelector(selector);
                if (element && (element instanceof HTMLTextAreaElement || element instanceof HTMLInputElement)) {
                    return element;
                }
            }
        }
    }

    for (const selector of LLM_PATTERNS.generic.selectors) {
        const element = document.querySelector(selector);
        if (element && (element instanceof HTMLTextAreaElement || element instanceof HTMLInputElement)) {
            return element;
        }
    }

    return null;
}

function showOptimizeButton(textarea: HTMLTextAreaElement | HTMLInputElement) {
    if (optimizeButton) {
        optimizeButton.remove();
    }

    currentTextArea = textarea;
    optimizeButton = document.createElement('div');
    optimizeButton.id = 'yaprompt-optimize-btn';
    optimizeButton.innerHTML = '<div class="yaprompt-btn-content"><span class="yaprompt-icon">✨</span><span class="yaprompt-text">Optimize</span></div>';

    Object.assign(optimizeButton.style, {
        position: 'absolute', zIndex: '999999', backgroundColor: '#8b5cf6', color: 'white',
        border: 'none', borderRadius: '8px', padding: '8px 16px', fontSize: '14px', fontWeight: '600',
        cursor: 'pointer', boxShadow: '0 4px 6px rgba(0,0,0,0.1)', transition: 'all 0.2s ease',
        fontFamily: '-apple-system, BlinkMacSystemFont, sans-serif', display: 'flex', alignItems: 'center', gap: '6px'
    });

    const rect = textarea.getBoundingClientRect();
    optimizeButton.style.top = `${rect.bottom + window.scrollY + 8}px`;
    optimizeButton.style.left = `${rect.left + window.scrollX}px`;

    optimizeButton.addEventListener('mouseenter', () => {
        optimizeButton!.style.backgroundColor = '#7c3aed';
        optimizeButton!.style.transform = 'translateY(-2px)';
    });

    optimizeButton.addEventListener('mouseleave', () => {
        optimizeButton!.style.backgroundColor = '#8b5cf6';
        optimizeButton!.style.transform = 'translateY(0)';
    });

    optimizeButton.addEventListener('click', () => handleOptimize());
    document.body.appendChild(optimizeButton);
}

function hideOptimizeButton() {
    if (optimizeButton) {
        optimizeButton.remove();
        optimizeButton = null;
    }
}

async function handleOptimize() {
    if (!currentTextArea || isOptimizing) return;

    const originalText = currentTextArea.value;
    if (!originalText.trim() || originalText.length < 5) {
        showNotification('Please enter a prompt first', 'warning');
        return;
    }

    isOptimizing = true;
    if (optimizeButton) {
        optimizeButton.innerHTML = '<div class="yaprompt-btn-content"><span class="yaprompt-icon">⏳</span><span class="yaprompt-text">Optimizing...</span></div>';
    }

    try {
        const response = await chrome.runtime.sendMessage({
            action: 'optimizePromptAuto',
            prompt: originalText
        });

        if (response.success) {
            currentTextArea.value = response.optimized;
            currentTextArea.dispatchEvent(new Event('input', { bubbles: true }));
            currentTextArea.dispatchEvent(new Event('change', { bubbles: true }));
            showNotification('✨ Prompt optimized successfully!', 'success');
        } else {
            showNotification(response.error || 'Optimization failed', 'error');
        }
    } catch (error) {
        console.error('Optimization error:', error);
        showNotification('Failed to optimize prompt', 'error');
    } finally {
        isOptimizing = false;
        if (optimizeButton) {
            optimizeButton.innerHTML = '<div class="yaprompt-btn-content"><span class="yaprompt-icon">✨</span><span class="yaprompt-text">Optimize</span></div>';
        }
    }
}

function showNotification(message: string, type: 'success' | 'error' | 'warning' = 'success') {
    const notification = document.createElement('div');
    notification.textContent = message;
    Object.assign(notification.style, {
        position: 'fixed', top: '20px', right: '20px', zIndex: '1000000',
        backgroundColor: type === 'success' ? '#10b981' : type === 'error' ? '#ef4444' : '#f59e0b',
        color: 'white', padding: '12px 20px', borderRadius: '8px', fontSize: '14px',
        fontWeight: '500', boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
        fontFamily: '-apple-system, BlinkMacSystemFont, sans-serif', animation: 'slide-in 0.3s ease'
    });
    document.body.appendChild(notification);
    setTimeout(() => notification.remove(), 3000);
}

function initAutoOptimization() {
    if (!isLLMPlatform()) return;

    document.addEventListener('focusin', (e) => {
        const target = e.target;
        if (target instanceof HTMLTextAreaElement || target instanceof HTMLInputElement) {
            const llmInput = findLLMTextInput();
            if (llmInput === target && target.value.trim().length > 5) {
                showOptimizeButton(target);
            }
        }
    });

    document.addEventListener('input', (e) => {
        const target = e.target;
        if (target instanceof HTMLTextAreaElement || target instanceof HTMLInputElement) {
            const llmInput = findLLMTextInput();
            if (llmInput === target) {
                if (target.value.trim().length > 5) {
                    showOptimizeButton(target);
                } else {
                    hideOptimizeButton();
                }
            }
        }
    });
}

document.addEventListener('keydown', (e) => {
    if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === 'O') {
        e.preventDefault();
        const llmInput = findLLMTextInput();
        if (llmInput) {
            currentTextArea = llmInput;
            handleOptimize();
        }
    }
});

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initAutoOptimization);
} else {
    initAutoOptimization();
}

// ============================================================================
// PATTERN DETECTION & BROWSER AUTOMATION
// ============================================================================

document.addEventListener('click', (e) => {
    const target = e.target as HTMLElement;
    const targetInfo = target.tagName + (target.id ? `#${target.id}` : '') + (target.className ? `.${target.className.split(' ')[0]}` : '');
    chrome.runtime.sendMessage({ action: 'recordUserAction', eventType: 'click', target: targetInfo });
}, true);

document.addEventListener('submit', (e) => {
    const target = e.target as HTMLElement;
    const targetInfo = 'FORM' + (target.id ? `#${target.id}` : '');
    chrome.runtime.sendMessage({ action: 'recordUserAction', eventType: 'submit', target: targetInfo });
}, true);

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.action === 'getContext') {
        sendResponse({ title: document.title, url: window.location.href });
    } else if (message.action === 'runAgent') {
        console.log('Running agent:', message.agent);
        sendResponse({ success: true });
    } else if (message.action === 'browserAutomation') {
        handleBrowserAutomation(message.request).then(result => sendResponse(result))
            .catch(error => sendResponse({ success: false, error: error.message }));
        return true;
    } else if (message.action === 'getPageInfo') {
        const info = {
            url: window.location.href, title: document.title,
            text: document.body.innerText.substring(0, 5000),
            html: message.includeHtml ? document.documentElement.outerHTML : undefined
        };
        sendResponse(info);
    }
});

async function handleBrowserAutomation(request: any): Promise<any> {
    try {
        switch (request.action) {
            case 'click': return await clickElement(request.selector, request.timeout);
            case 'type': return await typeIntoElement(request.selector, request.value, request.timeout);
            case 'extract': return await extractData(request.selector);
            case 'scroll': return await scrollPage(request.options);
            case 'wait': return await waitForElement(request.selector, request.timeout);
            default: return { success: false, error: `Unknown action: ${request.action}` };
        }
    } catch (error: any) {
        return { success: false, error: error.message };
    }
}

async function clickElement(selector: string, timeout: number = 5000): Promise<any> {
    const element = await waitForElement(selector, timeout);
    if (!element) return { success: false, error: `Element not found: ${selector}` };
    (element as HTMLElement).click();
    return { success: true };
}

async function typeIntoElement(selector: string, value: string, timeout: number = 5000): Promise<any> {
    const element = await waitForElement(selector, timeout);
    if (!element) return { success: false, error: `Element not found: ${selector}` };
    if (element instanceof HTMLInputElement || element instanceof HTMLTextAreaElement) {
        element.value = value;
        element.dispatchEvent(new Event('input', { bubbles: true }));
        element.dispatchEvent(new Event('change', { bubbles: true }));
        return { success: true };
    }
    return { success: false, error: 'Element is not an input or textarea' };
}

async function extractData(selector?: string): Promise<any> {
    if (!selector) {
        return {
            success: true,
            data: {
                text: document.body.innerText, html: document.body.innerHTML,
                title: document.title, url: window.location.href
            }
        };
    }
    const elements = document.querySelectorAll(selector);
    const data = Array.from(elements).map(el => ({ text: el.textContent, html: el.innerHTML, tagName: el.tagName }));
    return { success: true, data };
}

async function scrollPage(options: any): Promise<any> {
    const { direction, amount } = options;
    switch (direction) {
        case 'top': window.scrollTo(0, 0); break;
        case 'bottom': window.scrollTo(0, document.body.scrollHeight); break;
        case 'up': window.scrollBy(0, -(amount || 100)); break;
        case 'down': window.scrollBy(0, amount || 100); break;
    }
    return { success: true };
}

async function waitForElement(selector: string, timeout: number = 5000): Promise<Element | null> {
    const startTime = Date.now();
    while (Date.now() - startTime < timeout) {
        const element = document.querySelector(selector);
        if (element) return element;
        await new Promise(resolve => setTimeout(resolve, 100));
    }
    return null;
}
