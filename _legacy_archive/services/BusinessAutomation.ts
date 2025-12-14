/**
 * Business Automation (API Client)
 * Connects to Python Backend
 */

const API_URL = 'http://localhost:8000';

export class BusinessAutomationService {

    async makeBooking(request: any): Promise<any> {
        const response = await fetch(`${API_URL}/business/booking`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(request)
        });
        return await response.json();
    }

    async generateInvoice(invoice: any): Promise<any> {
        const response = await fetch(`${API_URL}/business/invoice`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(invoice)
        });
        return await response.json();
    }

    // ... other methods would follow similar pattern
}

export const businessAutomation = new BusinessAutomationService();
