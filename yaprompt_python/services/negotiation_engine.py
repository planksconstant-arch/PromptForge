"""
Negotiation Engine (Python Port)
AI-powered price negotiation logic
"""

import time
import uuid
import random
from typing import List, Dict, Any, Optional
from pydantic import BaseModel

class NegotiationSession(BaseModel):
    id: str
    type: str
    vendor: str
    product: str
    initialPrice: float
    targetPrice: float
    currentPrice: float
    status: str
    rounds: List[Dict[str, Any]]
    startedAt: float
    completedAt: Optional[float] = None
    savings: Optional[float] = 0

class NegotiationEngine:
    def __init__(self):
        self.active_sessions: Dict[str, NegotiationSession] = {}
        self.completed_sessions: List[NegotiationSession] = []

    async def start_negotiation(self, params: Dict[str, Any]) -> NegotiationSession:
        session_id = str(uuid.uuid4())
        initial = params['initialPrice']
        
        session = NegotiationSession(
            id=session_id,
            type=params.get('type', 'price'),
            vendor=params['vendor'],
            product=params['product'],
            initialPrice=initial,
            targetPrice=params['targetPrice'],
            currentPrice=initial,
            status='active',
            rounds=[],
            startedAt=time.time()
        )
        
        # Round 1 logic
        offer = int(initial * 0.75) # Aggressive start
        msg = f"We are looking for a deal. Can you do {offer}?"
        
        session.rounds.append({
            "round": 1,
            "agentOffer": offer,
            "agentMessage": msg,
            "timestamp": time.time()
        })
        session.currentPrice = offer
        self.active_sessions[session_id] = session
        return session

    async def process_vendor_response(self, session_id: str, vendor_price: float, vendor_msg: str) -> Dict[str, Any]:
        session = self.active_sessions.get(session_id)
        if not session:
            raise ValueError("Session not found")

        last_round = session.rounds[-1]
        last_round['vendorResponse'] = {
            "price": vendor_price,
            "message": vendor_msg,
            "timestamp": time.time()
        }
        
        session.currentPrice = vendor_price
        
        # Decide
        if vendor_price <= session.targetPrice:
            session.status = 'success'
            session.completedAt = time.time()
            session.savings = session.initialPrice - vendor_price
            msg = f"Deal! {vendor_price} works."
            del self.active_sessions[session_id]
            self.completed_sessions.append(session)
            return {"counterOffer": vendor_price, "message": msg, "shouldAccept": True}
        
        # Counter
        prev_offer = last_round['agentOffer']
        # Split difference (simple logic)
        counter = int((prev_offer + vendor_price) / 2)
        if counter > session.targetPrice * 1.1:
             counter = session.targetPrice * 1.05 # Cap it
             
        msg = f"How about {counter}? That's our best offer."
        
        session.rounds.append({
            "round": len(session.rounds) + 1,
            "agentOffer": counter,
            "agentMessage": msg,
            "timestamp": time.time()
        })
        session.currentPrice = counter
        return {"counterOffer": counter, "message": msg, "shouldAccept": False}

    def get_stats(self) -> Dict[str, Any]:
        return {
            "totalNegotiations": len(self.completed_sessions),
            "active": len(self.active_sessions)
        }

negotiation_engine = NegotiationEngine()
