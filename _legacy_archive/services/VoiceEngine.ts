/**
 * Voice Engine
 * Voice-driven productivity interface
 * Feature #11: Voice for Productivity
 */

export interface VoiceBriefing {
    type: 'daily' | 'task_update' | 'deadline' | 'summary';
    content: string;
    timestamp: number;
}

export interface VoiceSettings {
    enabled: boolean;
    voice: string; // voice name
    rate: number; // speech rate
    pitch: number;
    volume: number;
}

export class VoiceEngine {
    private synthesis: SpeechSynthesis | null = null;
    private readonly STORAGE_KEY = 'voice_engine_settings';
    private settings: VoiceSettings = {
        enabled: true,
        voice: 'default',
        rate: 1.0,
        pitch: 1.0,
        volume: 1.0
    };

    constructor() {
        this.initializeSynthesis();
        this.loadSettings();
    }

    private initializeSynthesis(): void {
        if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
            this.synthesis = window.speechSynthesis;
        }
    }

    /**
     * Speak text with current settings
     */
    async speak(text: string): Promise<void> {
        if (!this.synthesis || !this.settings.enabled) {
            return;
        }

        return new Promise((resolve, reject) => {
            const utterance = new SpeechSynthesisUtterance(text);

            // Apply settings
            utterance.rate = this.settings.rate;
            utterance.pitch = this.settings.pitch;
            utterance.volume = this.settings.volume;

            // Set voice if specified
            if (this.settings.voice !== 'default') {
                const voices = this.synthesis!.getVoices();
                const selectedVoice = voices.find(v => v.name === this.settings.voice);
                if (selectedVoice) {
                    utterance.voice = selectedVoice;
                }
            }

            utterance.onend = () => resolve();
            utterance.onerror = (error) => reject(error);

            this.synthesis!.speak(utterance);
        });
    }

    /**
     * Generate and speak daily briefing
     */
    async speakDailyBriefing(briefing: {
        tasks: Array<{ title: string; priority: string }>;
        deadlines: Array<{ task: string; daysRemaining: number }>;
        studyGoals: Array<{ subject: string; minutes: number }>;
        weakAreas: string[];
    }): Promise<void> {
        let text = "Good morning! Here's your daily briefing. \n\n";

        if (briefing.tasks.length > 0) {
            text += `You have ${briefing.tasks.length} tasks today. `;
            const highPriority = briefing.tasks.filter(t => t.priority === 'high' || t.priority === 'critical');
            if (highPriority.length > 0) {
                text += `${highPriority.length} are high priority: `;
                text += highPriority.slice(0, 3).map(t => t.title).join(', ') + ". ";
            }
        }

        if (briefing.deadlines.length > 0) {
            text += "\n\nUpcoming deadlines: ";
            for (const dl of briefing.deadlines.slice(0, 3)) {
                text += `${dl.task} in ${dl.daysRemaining} days. `;
            }
        }

        if (briefing.studyGoals.length > 0) {
            text += "\n\nStudy plan: ";
            for (const goal of briefing.studyGoals) {
                text += `${goal.minutes} minutes on ${goal.subject}. `;
            }
        }

        if (briefing.weakAreas.length > 0) {
            text += `\n\nFocus areas: ${briefing.weakAreas.slice(0, 2).join(' and ')}.`;
        }

        text += "\n\nLet's have a productive day!";

        await this.speak(text);
    }

    /**
     * Speak task updates
     */
    async speakTaskUpdate(update: {
        completed: string[];
        started: string[];
        remaining: number;
    }): Promise<void> {
        let text = '';

        if (update.completed.length > 0) {
            text += `Great job! You've completed ${update.completed.length} task${update.completed.length > 1 ? 's' : ''}: `;
            text += update.completed.slice(0, 2).join(' and ') + '. ';
        }

        if (update.started.length > 0) {
            text += `Now working on: ${update.started[0]}. `;
        }

        if (update.remaining > 0) {
            text += `You have ${update.remaining} task${update.remaining > 1 ? 's' : ''} remaining.`;
        }

        if (text) {
            await this.speak(text);
        }
    }

    /**
     * Speak deadline reminders
     */
    async speakDeadlineReminder(deadline: {
        task: string;
        daysRemaining: number;
        priority: string;
    }): Promise<void> {
        let text = '';

        if (deadline.daysRemaining === 0) {
            text = `Reminder: ${deadline.task} is due today!`;
        } else if (deadline.daysRemaining === 1) {
            text = `Reminder: ${deadline.task} is due tomorrow.`;
        } else {
            text = `Reminder: ${deadline.task} is due in ${deadline.daysRemaining} days.`;
        }

        if (deadline.priority === 'high' || deadline.priority === 'critical') {
            text += ' This is a high priority item.';
        }

        await this.speak(text);
    }

    /**
     * Speak summary
     */
    async speakSummary(summary: {
        title: string;
        content: string;
        type: 'document' | 'research' | 'progress';
    }): Promise<void> {
        let text = `Here's your ${summary.type} summary: ${summary.title}. \n\n`;

        // Simplify content for speech
        text += this.simplifyForSpeech(summary.content);

        await this.speak(text);
    }

    /**
     * Get available voices
     */
    getAvailableVoices(): SpeechSynthesisVoice[] {
        if (!this.synthesis) return [];
        return this.synthesis.getVoices();
    }

    /**
     * Update voice settings
     */
    async updateSettings(settings: Partial<VoiceSettings>): Promise<void> {
        this.settings = { ...this.settings, ...settings };
        await this.saveSettings();
    }

    /**
     * Stop speaking
     */
    stop(): void {
        this.synthesis?.cancel();
    }

    /**
     * Pause speaking
     */
    pause(): void {
        this.synthesis?.pause();
    }

    /**
     * Resume speaking
     */
    resume(): void {
        this.synthesis?.resume();
    }

    /**
     * Check if currently speaking
     */
    isSpeaking(): boolean {
        return this.synthesis?.speaking || false;
    }

    private simplifyForSpeech(text: string): string {
        // Remove markdown formatting
        let simplified = text
            .replace(/[#*_`]/g, '')
            .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1'); // Remove links but keep text

        // Limit length
        if (simplified.length > 500) {
            simplified = simplified.slice(0, 500) + '... ';
        }

        return simplified;
    }

    getSettings(): VoiceSettings {
        return { ...this.settings };
    }

    private async saveSettings(): Promise<void> {
        if (typeof chrome !== 'undefined' && chrome.storage) {
            await chrome.storage.local.set({ [this.STORAGE_KEY]: this.settings });
        }
    }

    private async loadSettings(): Promise<void> {
        if (typeof chrome !== 'undefined' && chrome.storage) {
            const result = await chrome.storage.local.get([this.STORAGE_KEY]);
            if (result[this.STORAGE_KEY]) {
                this.settings = result[this.STORAGE_KEY] as VoiceSettings;
            }
        }
    }
}

export const voiceEngine = new VoiceEngine();
