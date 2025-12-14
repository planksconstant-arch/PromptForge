"""
Teammate Engine (Python Port)
Digital teammate personality and proactive assistance
"""

import time
import random
from typing import List, Dict, Any, Optional
from pydantic import BaseModel

class TeammatePersonality(BaseModel):
    communicationStyle: str = 'friendly'
    proactiveness: float = 0.7
    helpfulness: float = 0.9
    adaptability: float = 0.8

class ProactiveSuggestion(BaseModel):
    type: str
    message: str
    priority: float
    actionable: bool

class TeammateInteraction(BaseModel):
    timestamp: float
    type: str
    message: str
    userResponse: Optional[str] = None

class TeammateEngine:
    def __init__(self):
        self.personality = TeammatePersonality()
        self.interactions: List[TeammateInteraction] = []
        self.last_suggestion_time = 0
    
    async def generate_proactive_suggestions(self, context: Dict[str, Any]) -> List[ProactiveSuggestion]:
        # Simple logic for now, expanding later
        if time.time() - self.last_suggestion_time < 1800: # 30 mins
            return []
            
        suggestions = []
        # Simulate a suggestion
        if random.random() > 0.7:
             suggestions.append(ProactiveSuggestion(
                 type='reminder',
                 message=self._format_message("Check your deadlines!", 'reminder'),
                 priority=0.8,
                 actionable=True
             ))
        
        self.last_suggestion_time = time.time()
        return suggestions

    def provide_help(self, context_str: str) -> str:
        lower = context_str.lower()
        if 'stuck' in lower:
            return self._format_message("Let's break this down.", 'help')
        return self._format_message("How can I help?", 'help')

    def _format_message(self, content: str, type: str) -> str:
        style = self.personality.communicationStyle
        if style == 'friendly':
            return f"Hey! {content} 😊"
        elif style == 'formal':
            return f"Please note: {content}"
        return content

    async def update_personality(self, updates: Dict[str, Any]):
        current = self.personality.dict()
        current.update(updates)
        self.personality = TeammatePersonality(**current)

teammate_engine = TeammateEngine()
