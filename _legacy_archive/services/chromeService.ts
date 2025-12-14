import { UserStyle } from '../lib/PromptOptimizer';

export const getUserStyle = async (): Promise<UserStyle | undefined> => {
    if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local) {
        return new Promise((resolve) => {
            chrome.storage.local.get(['userStyle'], (result) => {
                resolve(result.userStyle);
            });
        });
    } else {
        // Mock for local dev
        console.warn('Chrome API not found, using mock data');
        return {
            formality: 0.5,
            verbosity: 0.5,
            complexity: 0.5,
            samples: 10
        };
    }
};
