"""
Business Automation (Python Port)
Business logic orchestration
"""

import time
import uuid
from typing import Dict, Any
from .safe_action_approval import safe_action_approval
from .negotiation_engine import negotiation_engine
from .persona_manager import persona_manager

class BusinessAutomation:
    async def make_booking(self, request: Dict[str, Any]) -> Dict[str, Any]:
        # Request approval
        details = request.get('details', {})
        desc = f"Book {request.get('type')} at {details.get('name')}"
        
        approval_id = await safe_action_approval.request_approval(
            'booking_confirm',
            desc,
            details
        )
        
        # In a real backend, we can't 'await' user interaction synchronously like this
        # unless we block. The TS version was await waitForApproval which subscribes to changes.
        # Here we just return the approval ID and say "pending user approval".
        
        return {
            "success": True,
            "status": "pending_approval",
            "approvalId": approval_id,
            "message": "Booking requires approval."
        }

    async def generate_invoice(self, invoice: Dict[str, Any]) -> Dict[str, Any]:
        inv_id = f"INV-{int(time.time())}"
        total = sum(item['quantity'] * item['rate'] for item in invoice.get('items', []))
        
        full_invoice = invoice.copy()
        full_invoice.update({"id": inv_id, "total": total, "status": "draft"})
        
        approval_id = await safe_action_approval.request_approval(
            'document_share',
            f"Send invoice {inv_id} for {total}",
            {"invoice": full_invoice}
        )
        
        return {
            "success": True, 
            "invoice": full_invoice, 
            "approvalId": approval_id
        }

    async def negotiate_bulk_order(self, params: Dict[str, Any]) -> Dict[str, Any]:
        persona_manager.switch_mode('negotiator')
        
        qty = params['quantity']
        total_initial = params['quotedPricePerUnit'] * qty
        total_target = params['targetPricePerUnit'] * qty
        
        session = await negotiation_engine.start_negotiation({
            "vendor": params['vendor'],
            "product": f"{params['product']} ({qty} units)",
            "initialPrice": total_initial,
            "targetPrice": total_target,
            "type": "bulk_order"
        })
        
        return {
            "success": True,
            "sessionId": session.id,
            "initialOffer": session.currentPrice
        }

business_automation = BusinessAutomation()
