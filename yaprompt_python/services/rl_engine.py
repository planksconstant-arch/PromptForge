"""
RL Engine (Python Port)
Reinforcement Learning for personalization
"""

import time
import json
from typing import Dict, List, Any, Optional

class RLEngine:
    def __init__(self):
        self.action_values = {} # key -> {qValue, visits, ...}
        self.reward_history = []
        self.learning_rate = 0.1
        self.exploration_rate = 0.2
        
    def record_reward(self, action_id: str, value: float, context: str):
        reward = max(-1.0, min(1.0, value))
        self.reward_history.append({
            "actionId": action_id,
            "value": reward,
            "timestamp": time.time(),
            "context": context
        })
        self._update_action_value(action_id, context, reward)
        
    def get_action_value(self, action: str, context: str) -> float:
        key = f"{action}::{context}"
        return self.action_values.get(key, {}).get("qValue", 0.0)
    
    def select_action(self, actions: List[str], context: str) -> str:
        # Epsilon-greedy
        if not actions: return ""
        # In python random is imported
        import random
        if random.random() < self.exploration_rate:
            return random.choice(actions)
            
        # Argmax
        best_action = actions[0]
        best_val = self.get_action_value(best_action, context)
        
        for action in actions[1:]:
            val = self.get_action_value(action, context)
            if val > best_val:
                best_val = val
                best_action = action
                
        return best_action
        
    def _update_action_value(self, action_id: str, context: str, reward: float):
        key = f"{action_id}::{context}"
        current = self.action_values.get(key, {
            "qValue": 0.0,
            "visits": 0
        })
        
        # Simple TD update
        current["qValue"] += self.learning_rate * (reward - current["qValue"])
        current["visits"] += 1
        current["lastUpdate"] = time.time()
        
        self.action_values[key] = current
        
    def get_stats(self) -> Dict[str, Any]:
        count = len(self.reward_history)
        total = sum(r['value'] for r in self.reward_history)
        avg = total / count if count > 0 else 0
        return {
            "totalRewards": total,
            "avgReward": avg,
            "learningRate": self.learning_rate
        }

rl_engine = RLEngine()
