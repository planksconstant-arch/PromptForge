"""
Conversational Agent Builder (Python Port)
Builds automation agents through natural language conversation
"""

import time
import json
import uuid
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
        self.api_key = Config.GEMINI_API_KEY
    
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
        if not self.api_key:
             # Mock response if no key
             state.conversationHistory.append(ConversationMessage(role='assistant', content="API Key missing on backend.", timestamp=time.time()))
             return state

        system_prompt = self._build_system_prompt(state)
        context = self._build_conversation_context(state)
        
        try:
            response_text = await self._call_llm(system_prompt, context)
            
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

    async def _call_llm(self, system: str, context: str) -> str:
        genai.configure(api_key=self.api_key)
        model = genai.GenerativeModel('gemini-2.0-flash-exp')
        chat = model.start_chat()
        response = await asyncio.to_thread(
            chat.send_message, 
            f"System: {system}\n\nContext: {context}\n\nProvide response:"
        )
        return response.text

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
