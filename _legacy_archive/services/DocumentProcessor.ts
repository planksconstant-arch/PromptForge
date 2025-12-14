/**
 * Document Processor (API Client)
 * Connects to Python Backend
 */

const API_URL = 'http://localhost:8000';

export class DocumentProcessor {

    async processDocument(file: File): Promise<any> {
        // Note: Full file upload support would require multipart/form-data
        // For now, we assume text extraction happens client side or we send text
        const text = await file.text();

        try {
            const response = await fetch(`${API_URL}/docs/process`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    text: text.slice(0, 50000), // Limit payload
                    name: file.name,
                    format: 'txt'
                })
            });
            return await response.json();
        } catch (error) {
            throw error;
        }
    }
}

export const documentProcessor = new DocumentProcessor();
