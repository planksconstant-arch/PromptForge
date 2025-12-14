/**
 * Vision Engine
 * Visual recognition and OCR processing
 * Feature #10: Multi-Modal Local Agent (Part 1)
 */

export interface OCRResult {
    text: string;
    confidence: number;
    boundingBoxes?: Array<{ text: string; x: number; y: number; width: number; height: number }>;
}

export interface ImageAnalysis {
    extractedText: string;
    confidence: number;
    timestamp: number;
    imageData?: string; // base64
}

export class VisionEngine {
    private readonly STORAGE_KEY = 'vision_engine_history';
    private history: ImageAnalysis[] = [];

    constructor() {
        this.loadState();
    }

    /**
     * Extract text from image using OCR
     * Note: Requires Tesseract.js to be loaded
     */
    async extractTextFromImage(imageData: string | Blob | File): Promise<OCRResult> {
        try {
            // Dynamic import of Tesseract (will be installed via package.json)
            // @ts-ignore
            const Tesseract = (window as any).Tesseract || await this.loadTesseract();

            if (!Tesseract) {
                throw new Error('Tesseract.js not loaded. Please install tesseract.js');
            }

            const result = await Tesseract.recognize(imageData, 'eng', {
                logger: (m: any) => console.log(m)
            });

            const ocrResult: OCRResult = {
                text: result.data.text,
                confidence: result.data.confidence / 100,
                boundingBoxes: result.data.words?.map((w: any) => ({
                    text: w.text,
                    x: w.bbox.x0,
                    y: w.bbox.y0,
                    width: w.bbox.x1 - w.bbox.x0,
                    height: w.bbox.y1 - w.bbox.y0
                }))
            };

            // Save to history
            const analysis: ImageAnalysis = {
                extractedText: ocrResult.text,
                confidence: ocrResult.confidence,
                timestamp: Date.now()
            };

            this.history.push(analysis);
            if (this.history.length > 50) this.history.shift();
            await this.saveState();

            return ocrResult;

        } catch (error) {
            console.error('OCR failed:', error);
            return {
                text: '',
                confidence: 0
            };
        }
    }

    /**
     * Capture screenshot and extract text
     */
    async captureAndExtract(): Promise<OCRResult> {
        try {
            // Use chrome.tabs.captureVisibleTab if in extension
            if (typeof chrome !== 'undefined' && chrome.tabs) {
                return new Promise((resolve) => {
                    chrome.tabs.captureVisibleTab({ format: 'png' }, async (dataUrl) => {
                        if (dataUrl) {
                            const result = await this.extractTextFromImage(dataUrl);
                            resolve(result);
                        } else {
                            resolve({ text: '', confidence: 0 });
                        }
                    });
                });
            } else {
                throw new Error('Chrome tabs API not available');
            }
        } catch (error) {
            console.error('Screenshot capture failed:', error);
            return { text: '', confidence: 0 };
        }
    }

    /**
     * Convert image to notes/structured data
     */
    async imageToNotes(imageData: string | Blob): Promise<{
        title: string;
        bullets: string[];
        fullText: string;
    }> {
        const ocr = await this.extractTextFromImage(imageData);

        // Parse the extracted text into structured notes
        const lines = ocr.text.split('\n').filter(l => l.trim());

        // First line is usually the title
        const title = lines[0] || 'Untitled';

        // Detect bullet points
        const bullets: string[] = [];
        let fullText = '';

        for (const line of lines) {
            const trimmed = line.trim();
            if (!trimmed) continue;

            // Check if it's a bullet point
            if (trimmed.match(/^[-*•·]/)) {
                bullets.push(trimmed.replace(/^[-*•·]\s*/, ''));
            } else {
                fullText += trimmed + ' ';
            }
        }

        return {
            title,
            bullets,
            fullText: fullText.trim()
        };
    }

    /**
     * Load Tesseract.js dynamically
     */
    private async loadTesseract(): Promise<any> {
        // This would load from CDN or bundled version
        // For now, return null and rely on it being loaded beforehand
        console.warn('Please ensure Tesseract.js is loaded');
        return null;
    }

    getHistory(): ImageAnalysis[] {
        return this.history;
    }

    private async saveState(): Promise<void> {
        if (typeof chrome !== 'undefined' && chrome.storage) {
            // Don't save image data, too large
            const lightHistory = this.history.map(h => ({
                extractedText: h.extractedText,
                confidence: h.confidence,
                timestamp: h.timestamp
            }));
            await chrome.storage.local.set({ [this.STORAGE_KEY]: lightHistory });
        }
    }

    private async loadState(): Promise<void> {
        if (typeof chrome !== 'undefined' && chrome.storage) {
            const result = await chrome.storage.local.get([this.STORAGE_KEY]);
            this.history = result[this.STORAGE_KEY] || [];
        }
    }
}

export const visionEngine = new VisionEngine();
