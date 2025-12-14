"""
Writing Style Engine (Python Port)
Learns user writing style and adapts content
"""

import time
import re
from typing import List, Dict, Any, Optional
from pydantic import BaseModel

class StyleCorrection(BaseModel):
    type: str
    before: str
    after: str
    context: str

class StyleSample(BaseModel):
    original: str
    edited: str
    timestamp: float
    corrections: List[StyleCorrection]

class StyleProfile(BaseModel):
    vocabulary: Dict[str, float] = {}
    sentenceLengthAvg: float = 15.0
    tonePreference: str = 'casual'
    commonPatterns: List[str] = []

class WritingStyleEngine:
    def __init__(self):
        self.samples: List[StyleSample] = []
        self.profile = StyleProfile()

    async def learn_from_correction(self, original: str, edited: str):
        corrections = self._detect_corrections(original, edited)
        sample = StyleSample(
            original=original, 
            edited=edited, 
            timestamp=time.time(), 
            corrections=corrections
        )
        self.samples.append(sample)
        if len(self.samples) > 100: self.samples.pop(0)
        
        self._update_profile(sample)

    def apply_style(self, text: str) -> str:
        # Simple application for now
        styled = text
        
        # Tone
        if self.profile.tonePreference == 'formal':
            styled = styled.replace("gonna", "going to").replace("wanna", "want to")
        
        return styled

    def get_style_summary(self) -> Dict[str, Any]:
        return {
            "tone": self.profile.tonePreference,
            "avgSentenceLength": self.profile.sentenceLengthAvg,
            "sampleCount": len(self.samples)
        }

    def _detect_corrections(self, original: str, edited: str) -> List[StyleCorrection]:
        corrections = []
        # Basic diff logic
        if len(edited) < len(original) * 0.8:
            corrections.append(StyleCorrection(type='brevity', before='long', after='short', context=''))
        return corrections

    def _update_profile(self, sample: StyleSample):
        # Update sentence length
        sentences = re.split(r'[.!?]+', sample.edited)
        avg_len = sum(len(s.split()) for s in sentences if s) / max(1, len(sentences))
        self.profile.sentenceLengthAvg = (self.profile.sentenceLengthAvg * 0.8) + (avg_len * 0.2)
        
            
writing_style_engine = WritingStyleEngine()
