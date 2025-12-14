/**
 * PDF Generator (API Client)
 * Connects to Python Backend
 */

const API_URL = 'http://localhost:8000';

export class PDFGenerator {
    static async generateFromMarkdown(content: string, options: any = {}): Promise<any> {
        // Return a dummy object or byte array compatible with client expectation?
        // JS version returned a jsPDF object. This breaks compatibility if we return base64.
        // We might need to handle the display logic here or simplify the contract.
        // For now, allow downloading via a helper.

        try {
            const response = await fetch(`${API_URL}/pdf/generate`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ content, options })
            });
            const data = await response.json();

            // Create a fake jsPDF-like object for minimal compat or just return data
            return {
                save: (filename: string) => {
                    // Trigger download in browser
                    const link = document.createElement('a');
                    link.href = `data:application/pdf;base64,${data.pdf_base64}`;
                    link.download = filename;
                    link.click();
                }
            };
        } catch (e) {
            console.error("PDF Gen failed", e);
            throw e;
        }
    }
}
