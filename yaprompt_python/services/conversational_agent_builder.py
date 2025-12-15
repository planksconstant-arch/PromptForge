"""
Conversational Agent Builder (Python Port)
Builds automation agents through natural language conversation
"""

import time
import json
import uuid
import asyncio
from typing import List, Dict, Any, Optional
from pydantic import BaseModel
import google.generativeai as genai
from ..config import Config

# ============================================================================
# TYPE DEFINITIONS
# ============================================================================

class ConversationMessage(BaseModel):
    role: str # user, assistant, system
    content: str
    timestamp: float

class AgentSpec(BaseModel):
    name: str = "New Agent"
    description: str = ""
    capabilities: List[str] = []
    connections: List[Dict[str, Any]] = [] # For MCP/App connections
    steps: List[Dict[str, Any]] = []
    outputFormat: str = "markdown"

class BuilderState(BaseModel):
    phase: str # initial, clarifying, designing, confirming, complete
    conversationHistory: List[ConversationMessage]
    collectedInfo: Dict[str, Any] = {}
    proposedSpec: Optional[AgentSpec] = None

# ============================================================================
# CONVERSATIONAL AGENT BUILDER
# ============================================================================

class ConversationalAgentBuilder:
    def __init__(self):
        # We now rely on local_llm_service for keys and providers
        pass
    
    async def start_conversation(self, user_description: str) -> BuilderState:
        state = BuilderState(
            phase='initial',
            conversationHistory=[ConversationMessage(role='user', content=user_description, timestamp=time.time())],
            collectedInfo={'userGoal': user_description}
        )
        return await self.process_message(state, user_description)

    async def continue_conversation(self, state_dict: Dict[str, Any], user_message: str) -> BuilderState:
        # Reconstruct state from dict
        state = BuilderState(**state_dict)
        state.conversationHistory.append(ConversationMessage(
            role='user', 
            content=user_message, 
            timestamp=time.time()
        ))
        return await self.process_message(state, user_message)

    async def process_message(self, state: BuilderState, user_message: str) -> BuilderState:
        # Check providers via service
        from .local_llm_service import local_llm_service
        
        system_prompt = self._build_system_prompt(state)
        context = self._build_conversation_context(state)
        full_prompt = f"Context: {context}\n\nProvide response:"
        
        try:
            # Use auto mode - local_llm_service will prioritize OpenRouter/Gemini if keys exist
            response = await local_llm_service.generate(
                prompt=full_prompt, 
                options={
                    'systemPrompt': system_prompt,
                    'provider': 'auto',
                    'temperature': 0.7
                }
            )
            
            response_text = response.text
            
            # Update state based on LLM response
            self._update_state_from_response(state, response_text)
            
            state.conversationHistory.append(ConversationMessage(
                role='assistant',
                content=response_text,
                timestamp=time.time()
            ))
            
            return state
        except Exception as e:
            print(f"Builder LLM Error: {e}")
            state.conversationHistory.append(ConversationMessage(role='assistant', content=f"Error: {str(e)}", timestamp=time.time()))
            return state

    def _build_system_prompt(self, state: BuilderState) -> str:
        base = f"""You are an expert AI Agent Architect. Phase: {state.phase.upper()}
        1. INITIAL: Understand goal, ask clarifying qs.
        2. CLARIFYING: Gather details (inputs/outputs).
        3. DESIGNING: Propose JSON spec.
        4. CONFIRMING: Get approval.
        5. COMPLETE: Finalize.
        """
        
        if state.phase == 'initial':
            return base + "\nAsk 2-3 questions. End with 'NEXT_PHASE: clarifying' if ready."
        elif state.phase == 'clarifying':
            return base + "\nGather missing info. End with 'NEXT_PHASE: designing' when ready."
        elif state.phase == 'designing':
            return base + "\nPropose design. Output JSON block with spec. End with 'NEXT_PHASE: confirming'."
        elif state.phase == 'confirming':
            return base + "\nAsk for approval. If yes, end with 'NEXT_PHASE: complete'."
        else:
            return base + "\nFinalize."

    def _build_conversation_context(self, state: BuilderState) -> str:
        history = "\n".join([f"{m.role.upper()}: {m.content}" for m in state.conversationHistory[-5:]])
        info = json.dumps(state.collectedInfo, indent=2)
        return f"History:\n{history}\n\nInfo:\n{info}"

    def _update_state_from_response(self, state: BuilderState, response: str):
        if "NEXT_PHASE: clarifying" in response: state.phase = 'clarifying'
        elif "NEXT_PHASE: designing" in response: state.phase = 'designing'
        elif "NEXT_PHASE: confirming" in response: 
            state.phase = 'confirming'
            spec = self._extract_json(response)
            if spec: state.proposedSpec = AgentSpec(**spec)
        elif "NEXT_PHASE: complete" in response: state.phase = 'complete'

    def _extract_json(self, text: str) -> Optional[Dict]:
        try:
            start = text.find('```json')
            if start == -1: start = text.find('{')
            else: start += 7
            
            end = text.rfind('```')
            if end == -1: end = text.rfind('}') + 1
            
            if start != -1 and end != -1:
                json_str = text[start:end].strip()
                return json.loads(json_str)
        except: pass
        return None

conversational_agent_builder = ConversationalAgentBuilder()
