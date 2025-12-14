"""
Cognitive Engine Service (Python Port)
Brain-like cognitive processing for predictive task automation
"""

import time
import uuid
import math
from typing import List, Dict, Optional, Any
from pydantic import BaseModel

# ============================================================================
# TYPE DEFINITIONS
# ============================================================================

class StudyPattern(BaseModel):
    subject: str
    frequency: float # sessions per week
    avgDuration: float # minutes
    preferredTime: str
    performance: float
    lastSession: float

class WeakArea(BaseModel):
    topic: str
    confidence: float
    attempts: int
    successRate: float
    recommendedActions: List[str]

class PredictedNeed(BaseModel):
    type: str # study, review, practice, break, reminder
    description: str
    priority: float # 0-1
    timing: float
    reason: str

class ProgressForecast(BaseModel):
    topic: str
    currentLevel: float
    targetLevel: float
    estimatedCompletion: float
    onTrack: bool
    riskFactors: List[str]

# ============================================================================
# COGNITIVE ENGINE
# ============================================================================

class CognitiveEngine:
    def __init__(self):
        self.study_patterns: Dict[str, StudyPattern] = {}
        self.weak_areas: List[WeakArea] = []
        # TODO: Load state

    async def detect_learning_patterns(self, activities: List[Dict[str, Any]]) -> List[StudyPattern]:
        # Group by subject
        subject_map = {}
        for activity in activities:
            subject = activity.get('subject')
            if not subject: continue
            if subject not in subject_map:
                subject_map[subject] = []
            subject_map[subject].append(activity)

        patterns = []
        now = time.time()

        for subject, acts in subject_map.items():
            durations = [a.get('duration', 0) for a in acts]
            avg_duration = sum(durations) / len(durations) if durations else 0

            # Detect preferred time
            hours = [time.localtime(a.get('timestamp', now) / 1000).tm_hour for a in acts]
            avg_hour = round(sum(hours) / len(hours)) if hours else 12
            preferred_time = self._get_time_of_day(avg_hour)

            # Frequency
            if acts:
                time_span_ms = max(1, acts[-1]['timestamp'] - acts[0]['timestamp'])
                weeks = time_span_ms / (1000 * 60 * 60 * 24 * 7)
                frequency = len(acts) / max(weeks, 0.1)
                last_session = acts[-1]['timestamp']
            else:
                frequency = 0
                last_session = now

            # Performance
            perf_scores = [a.get('performance') for a in acts if a.get('performance') is not None]
            avg_perf = sum(perf_scores) / len(perf_scores) if perf_scores else 0.5

            pattern = StudyPattern(
                subject=subject,
                frequency=frequency,
                avgDuration=avg_duration,
                preferredTime=preferred_time,
                performance=avg_perf,
                lastSession=last_session
            )
            
            patterns.append(pattern)
            self.study_patterns[subject] = pattern

        return patterns

    async def identify_weak_areas(self, assessments: List[Dict[str, Any]]) -> List[WeakArea]:
        topic_map = {}
        for a in assessments:
            topic = a.get('topic')
            if not topic: continue
            if topic not in topic_map: topic_map[topic] = []
            topic_map[topic].append(a)

        self.weak_areas = []

        for topic, scores in topic_map.items():
            avg_score = sum(s.get('score', 0) for s in scores) / len(scores) if scores else 0
            success_count = sum(1 for s in scores if s.get('score', 0) >= 0.7)
            success_rate = success_count / len(scores) if scores else 0

            if avg_score < 0.6 or success_rate < 0.5:
                # Is weak
                recommendations = self._generate_recommendations(topic, avg_score, success_rate)
                
                self.weak_areas.append(WeakArea(
                    topic=topic,
                    confidence=avg_score,
                    attempts=len(scores),
                    successRate=success_rate,
                    recommendedActions=recommendations
                ))

        self.weak_areas.sort(key=lambda x: x.confidence)
        return self.weak_areas

    def predict_needs(self, context: Dict[str, Any]) -> List[PredictedNeed]:
        needs = []
        now = context.get('currentTime', time.time())
        
        # Check study patterns
        for subject, pattern in self.study_patterns.items():
            expected_interval = (7 * 24 * 60 * 60 * 1000) / max(pattern.frequency, 0.1)
            time_since = now - pattern.lastSession
            
            if time_since > expected_interval * 1.2:
                needs.append(PredictedNeed(
                    type='study',
                    description=f'Time to study {subject}',
                    priority=min(1.0, time_since / expected_interval),
                    timing=now,
                    reason=f'You usually study {subject} often'
                ))

        # Check weak areas
        for weak in self.weak_areas[:3]:
            needs.append(PredictedNeed(
                type='review',
                description=f'Review {weak.topic} (weak area)',
                priority=1.0 - weak.confidence,
                timing=now,
                reason=f'Success rate: {weak.successRate:.0%}'
            ))

        needs.sort(key=lambda x: x.priority, reverse=True)
        return needs

    def _get_time_of_day(self, hour: int) -> str:
        if hour < 6: return 'late night'
        if hour < 12: return 'morning'
        if hour < 17: return 'afternoon'
        if hour < 21: return 'evening'
        return 'night'

    def _generate_recommendations(self, topic: str, avg_score: float, success_rate: float) -> List[str]:
        recs = []
        if avg_score < 0.4:
            recs.append(f"Review fundamentals of {topic}")
        elif avg_score < 0.6:
            recs.append(f"Practice problems on {topic}")
        
        recs.append(f"Dedicate 30min focused study to {topic}")
        return recs

cognitive_engine = CognitiveEngine()
