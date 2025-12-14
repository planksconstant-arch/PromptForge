// Options Page Script for API Key Management

document.getElementById('settingsForm').addEventListener('submit', async (e) => {
    e.preventDefault();

    const apiKey = document.getElementById('apiKey').value.trim();
    const statusEl = document.getElementById('status');

    if (!apiKey) {
        showStatus('Please enter an API key', 'error');
        return;
    }

    // Basic validation
    if (!apiKey.startsWith('AIzaSy') || apiKey.length < 30) {
        showStatus('Invalid API key format. Gemini API keys start with "AIzaSy"', 'error');
        return;
    }

    try {
        // Save to Chrome storage
        await chrome.storage.local.set({ GEMINI_API_KEY: apiKey });
        showStatus('✓ Settings saved successfully!', 'success');

        // Clear the input after 2 seconds
        setTimeout(() => {
            document.getElementById('apiKey').value = '';
        }, 2000);
    } catch (error) {
        showStatus('Failed to save settings: ' + error.message, 'error');
    }
});

// Load existing API key on page load (show masked version)
chrome.storage.local.get(['GEMINI_API_KEY'], (result) => {
    if (result.GEMINI_API_KEY) {
        const masked = result.GEMINI_API_KEY.substring(0, 10) + '...' + result.GEMINI_API_KEY.slice(-4);
        document.getElementById('apiKey').placeholder = `Current: ${masked} (enter new to change)`;
    }
});

function showStatus(message, type) {
    const statusEl = document.getElementById('status');
    statusEl.textContent = message;
    statusEl.className = `status ${type}`;
    statusEl.style.display = 'block';

    if (type === 'success') {
        setTimeout(() => {
            statusEl.style.display = 'none';
        }, 3000);
    }
}
