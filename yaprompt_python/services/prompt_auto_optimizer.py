"""
Prompt Auto Optimizer (Python Port)
Intelligent prompt improvement logic
"""

from typing import Dict, Any
import json
from .local_llm_service import local_llm_service

class PromptAutoOptimizer:
    async def optimize_prompt(self, original_prompt: str, options: Dict[str, Any] = {}) -> Dict[str, Any]:
        # Stage 1: Heuristic / Rule based (Simulated RL Logic)
        stage1 = original_prompt
        if len(original_prompt) < 20:
             stage1 = original_prompt + " Please be detailed and comprehensive."
        
        # Stage 2: LLM Refinement
        goal = options.get('goal', 'Clarity and Structure')
        memory_context = ""
        if options.get('memory'):
            memory_context = "Use knowledge of user preferences."

        meta_prompt = f"""
        You are a world-class Prompt Engineer.
        Your task is to OPTIMIZE the User Prompt below.
        
        GOAL: {goal}
        CONTEXT: {memory_context}
        
        Input Prompt: "{stage1}"
        
        Return a JSON object with:
        - "reasoning": Brief explanation of changes.
        - "prompt": The fully optimized prompt text.
        - "critique": Object with scores (1-10) for "clarity", "robustness", "efficiency".
        
        JSON ONLY. No markdown.
        """
        
        response = await local_llm_service.generate(meta_prompt, {})
        text = response.text.replace('```json', '').replace('```', '').strip()
        
        try:
            return json.loads(text)
        except:
            # Fallback if LLM fails to return JSON
            return {
                "reasoning": "Standard optimization applied (LLM JSON parse failed).",
                "prompt": text,
                "critique": {"clarity": 8, "robustness": 7, "efficiency": 8}
            }

prompt_auto_optimizer = PromptAutoOptimizer()
