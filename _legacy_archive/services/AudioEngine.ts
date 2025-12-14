/**
 * Audio Engine
 * Audio processing and transcription
 * Feature #10: Multi-Modal Local Agent (Part 2)
 */

export interface Transcription {
    text: string;
    confidence: number;
    timestamp: number;
    duration: number; // seconds
}

export interface LectureSummary {
    title: string;
    keyPoints: string[];
    fullTranscript: string;
    duration: number;
    topics: string[];
}

export class AudioEngine {
    private readonly STORAGE_KEY = 'audio_engine_history';
    private transcriptions: Transcription[] = [];
    private recognition: any = null;

    constructor() {
        this.loadState();
        this.initializeSpeechRecognition();
    }

    /**
     * Initialize Web Speech API
     */
    private initializeSpeechRecognition(): void {
        if (typeof window !== 'undefined') {
            // @ts-ignore
            const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
            if (SpeechRecognition) {
                this.recognition = new SpeechRecognition();
                this.recognition.continuous = true;
                this.recognition.interimResults = true;
                this.recognition.lang = 'en-US';
            }
        }
    }

    /**
     * Transcribe audio in real-time
     */
    async transcribeRealtime(onResult: (interim: string, final: string) => void): Promise<void> {
        return new Promise((resolve, reject) => {
            if (!this.recognition) {
                reject(new Error('Speech recognition not supported'));
                return;
            }

            let finalTranscript = '';
            const startTime = Date.now();

            this.recognition.onresult = (event: any) => {
                let interimTranscript = '';

                for (let i = event.resultIndex; i < event.results.length; i++) {
                    const transcript = event.results[i][0].transcript;
                    if (event.results[i].isFinal) {
                        finalTranscript += transcript + ' ';
                    } else {
                        interimTranscript += transcript;
                    }
                }

                onResult(interimTranscript, finalTranscript);
            };

            this.recognition.onerror = (event: any) => {
                console.error('Speech recognition error:', event.error);
                reject(event.error);
            };

            this.recognition.onend = async () => {
                const duration = (Date.now() - startTime) / 1000;

                // Save transcription
                const transcription: Transcription = {
                    text: finalTranscript.trim(),
                    confidence: 0.8, // Web Speech API doesn't provide confidence
                    timestamp: Date.now(),
                    duration
                };

                this.transcriptions.push(transcription);
                if (this.transcriptions.length > 50) this.transcriptions.shift();
                await this.saveState();

                resolve();
            };

            this.recognition.start();
        });
    }

    /**
     * Stop real-time transcription
     */
    stopTranscription(): void {
        if (this.recognition) {
            this.recognition.stop();
        }
    }

    /**
     * Convert lecture audio to structured summary
     */
    async lectureToSummary(audioTranscript: string, duration: number): Promise<LectureSummary> {
        // Split into segments
        const sentences = audioTranscript.split(/[.!?]+/).filter(s => s.trim());

        // Extract title (first significant sentence)
        const title = sentences.find(s => s.length > 10)?.trim() || 'Untitled Lecture';

        // Extract key points (longer sentences or sentences with emphasis words)
        const emphasisWords = ['important', 'key', 'remember', 'note', 'crucial', 'essential'];
        const keyPoints: string[] = [];

        for (const sentence of sentences) {
            const lower = sentence.toLowerCase();
            const hasEmphasis = emphasisWords.some(word => lower.includes(word));
            const isSignificant = sentence.split(/\s+/).length > 8;

            if (hasEmphasis || isSignificant) {
                keyPoints.push(sentence.trim());
            }
        }

        // Limit to top 7 key points
        const topKeyPoints = keyPoints.slice(0, 7);

        // Extract topics (simple keyword extraction)
        const topics = this.extractTopics(audioTranscript);

        return {
            title: title.slice(0, 100),
            keyPoints: topKeyPoints,
            fullTranscript: audioTranscript,
            duration,
            topics
        };
    }

    /**
     * Extract topics from transcripts
     */
    private extractTopics(text: string): string[] {
        const words = text.toLowerCase().split(/\s+/);
        const wordFreq = new Map<string, number>();

        // Count word frequency
        for (const word of words) {
            // Skip short words and common words
            if (word.length < 4) continue;
            if (this.isCommonWord(word)) continue;

            wordFreq.set(word, (wordFreq.get(word) || 0) + 1);
        }

        // Get top 5 most frequent words as topics
        return Array.from(wordFreq.entries())
            .sort((a, b) => b[1] - a[1])
            .slice(0, 5)
            .map(([word]) => word);
    }

    /**
     * Check if word is too common to be a topic
     */
    private isCommonWord(word: string): boolean {
        const commonWords = new Set([
            'this', 'that', 'these', 'those', 'them', 'their', 'there',
            'what', 'when', 'where', 'which', 'while', 'with', 'will',
            'would', 'could', 'should', 'have', 'been', 'were', 'was',
            'from', 'into', 'through', 'about', 'after', 'before',
            'going', 'know', 'think', 'want', 'need', 'like', 'really'
        ]);

        return commonWords.has(word);
    }

    /**
     * Voice command processing
     */
    async processVoiceCommand(onCommand: (command: string) => void): Promise<void> {
        await this.transcribeRealtime((interim, final) => {
            if (final) {
                // Check if it's a command
                const command = this.parseCommand(final);
                if (command) {
                    onCommand(command);
                }
            }
        });
    }

    /**
     * Parse text as a command
     */
    private parseCommand(text: string): string | null {
        const lower = text.toLowerCase().trim();

        // Command patterns
        if (lower.startsWith('open ')) return lower;
        if (lower.startsWith('show ')) return lower;
        if (lower.startsWith('create ')) return lower;
        if (lower.startsWith('search ')) return lower;
        if (lower.includes('summary')) return 'summarize';
        if (lower.includes('help')) return 'help';

        return null;
    }

    getTranscriptions(): Transcription[] {
        return this.transcriptions;
    }

    private async saveState(): Promise<void> {
        if (typeof chrome !== 'undefined' && chrome.storage) {
            await chrome.storage.local.set({ [this.STORAGE_KEY]: this.transcriptions });
        }
    }

    private async loadState(): Promise<void> {
        if (typeof chrome !== 'undefined' && chrome.storage) {
            const result = await chrome.storage.local.get([this.STORAGE_KEY]);
            this.transcriptions = result[this.STORAGE_KEY] || [];
        }
    }
}

export const audioEngine = new AudioEngine();
