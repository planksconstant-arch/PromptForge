"""
Persona Manager (Python Port)
Manages AI personalities and operating modes
"""

from typing import Dict, List, Any
from pydantic import BaseModel

class PersonaProfile(BaseModel):
    mode: str
    name: str
    description: str
    rlWeights: Dict[str, float]
    behaviours: Dict[str, str]
    specialRules: List[str]

class PersonaManager:
    PERSONAS = {
        'business': {
            'mode': 'business',
            'name': 'Business Professional',
            'description': 'Formal, efficient',
            'rlWeights': {'taskPriority': 0.9, 'riskTolerance': 0.4},
            'behaviours': {'emailStyle': 'formal'},
            'specialRules': ['Use proper salutations']
        },
        'friendly': {
            'mode': 'friendly',
            'name': 'Casual Helper',
            'description': 'Relaxed, helpful',
            'rlWeights': {'taskPriority': 0.6, 'riskTolerance': 0.5},
            'behaviours': {'emailStyle': 'casual'},
            'specialRules': ['Use emojis']
        }
    }

    def __init__(self):
        self.current_mode = 'business'

    def switch_mode(self, mode: str):
        if mode in self.PERSONAS:
            self.current_mode = mode
            return True
        return False

    def get_current_profile(self) -> Dict:
        return self.PERSONAS.get(self.current_mode, self.PERSONAS['business'])

    def get_all_personas(self) -> List[Dict]:
        return list(self.PERSONAS.values())

persona_manager = PersonaManager()
