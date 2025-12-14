"""
Agent Execution Engine (Python Port)
Executes agent configurations with multi-step capabilities
"""

import time
import json
import uuid
from typing import List, Dict, Any, Optional
from pydantic import BaseModel
from .local_llm_service import local_llm_service
from .work_product_manager import work_product_manager, WorkProduct

class AgentStep(BaseModel):
    id: str
    name: str
    capability: Dict[str, Any]
    prompt: str
    inputFrom: Optional[List[str]] = None
    outputFormat: str = 'text'

class AgentConfigContext(BaseModel):
    id: str
    name: str
    description: str
    capabilities: List[Dict[str, Any]]
    steps: List[AgentStep]
    outputFormat: str
    metadata: Optional[Dict[str, Any]] = None

class ExecutionProgress(BaseModel):
    agentId: str
    currentStep: int
    totalSteps: int
    stepName: str
    status: str
    message: str

class AgentExecutionEngine:
    def __init__(self):
        self.progress_callbacks = {}

    async def execute_agent(self, agent_config: Dict[str, Any], input_data: Any, api_key: Optional[str] = None) -> WorkProduct:
        agent = AgentConfigContext(**agent_config)
        start_time = time.time()
        
        context = {
            "input": input_data,
            "stepResults": {},
            "metadata": {
                "startTime": start_time,
                "agentId": agent.id,
                "agentName": agent.name
            }
        }

        try:
            for i, step in enumerate(agent.steps):
                self._update_progress(agent.id, ExecutionProgress(
                    agentId=agent.id,
                    currentStep=i + 1,
                    totalSteps=len(agent.steps),
                    stepName=step.name,
                    status='running',
                    message=f"Executing: {step.name}"
                ))

                result = await self._execute_step(step, context, api_key)
                context["stepResults"][step.id] = result

            work_product = await self._generate_work_product(agent, context, time.time() - start_time)
            
            self._update_progress(agent.id, ExecutionProgress(
                agentId=agent.id,
                currentStep=len(agent.steps),
                totalSteps=len(agent.steps),
                stepName='Complete',
                status='completed',
                message='Agent execution completed successfully'
            ))

            return work_product

        except Exception as e:
            self._update_progress(agent.id, ExecutionProgress(
                agentId=agent.id,
                currentStep=0,
                totalSteps=len(agent.steps),
                stepName='Error',
                status='error',
                message=str(e)
            ))
            raise e

    async def _execute_step(self, step: AgentStep, context: Dict[str, Any], api_key: Optional[str]) -> Any:
        prompt = self._build_enriched_prompt(step, context)
        cap_type = step.capability.get('type')
        
        # Capability handling - mostly just prompt engineering wrappers
        if cap_type == 'research':
            depth = step.capability.get('config', {}).get('depth', 'moderate')
            enhanced = f"You are a research agent. Depth: {depth}.\n\n{prompt}\n\nProvide comprehensive research with sources."
        elif cap_type == 'summarize':
            max_len = step.capability.get('config', {}).get('maxLength', 500)
            enhanced = f"You are a summarization agent. Max length: {max_len} words.\n\n{prompt}\n\nProvide a concise summary."
        elif cap_type == 'analyze':
            enhanced = f"You are an analytical agent.\n\n{prompt}\n\nBreak down the data and provide insights."
        elif cap_type == 'write':
            style = step.capability.get('config', {}).get('format', 'professional')
            enhanced = f"You are a writing agent. Style: {style}.\n\n{prompt}\n\nCreate well-structured content."
        elif cap_type == 'extract':
             enhanced = f"You are a data extraction agent.\n\n{prompt}\n\nExtract information accurately."
        else:
            enhanced = prompt

        return await self._call_llm(enhanced, api_key, step.outputFormat)

    def _build_enriched_prompt(self, step: AgentStep, context: Dict[str, Any]) -> str:
        prompt = step.prompt
        prompt += f"\n\n### Input:\n{json.dumps(context['input'], indent=2)}"
        
        if step.inputFrom:
            prompt += '\n\n### Context from previous steps:'
            for step_id in step.inputFrom:
                res = context["stepResults"].get(step_id)
                if res:
                    val = res if isinstance(res, str) else json.dumps(res, indent=2)
                    prompt += f"\n\n**{step_id}**:\n{val}"
        
        prompt += f"\n\n### Output Format:\nPlease provide your response in {step.outputFormat} format."
        return prompt

    async def _call_llm(self, prompt: str, api_key: Optional[str], output_format: str) -> Any:
        # Re-use local_llm_service logic or call directly?
        # Creating a specific LLM request to utilize stored keys managed by local_llm_service if passed
        # But actually local_llm_service takes options.
        response = await local_llm_service.generate(prompt, {"apiKey": api_key})
        text = response.text
        
        if output_format == 'json':
            try:
                # Basic cleanup
                clean = text.replace('```json', '').replace('```', '').strip()
                return json.loads(clean)
            except:
                return {"raw": text}
        return text

    async def _generate_work_product(self, agent: AgentConfigContext, context: Dict[str, Any], duration: float) -> WorkProduct:
        # Simplification: Just returning the last step or formatted blob
        last_step = agent.steps[-1]
        final_result = context["stepResults"].get(last_step.id)
        
        content = final_result
        if agent.outputFormat == 'markdown':
             content = f"# {agent.name}\n\n{agent.description}\n\n---\n\n"
             for step in agent.steps:
                 res = context["stepResults"].get(step.id)
                 val = res if isinstance(res, str) else json.dumps(res, indent=2)
                 content += f"## {step.name}\n\n{val}\n\n"
        
        product = WorkProduct(
            id=f"wp-{int(time.time()*1000)}",
            type="agent_output",
            content=content,
            metadata={
                "agentId": agent.id,
                "timestamp": time.time(),
                "duration": duration
            },
            created_at=time.time(),
            updated_at=time.time()
        )
        # Assuming WorkProductManager has a save method, but we can return it and let caller save
        return product

    def _update_progress(self, agent_id: str, progress: ExecutionProgress):
        # In a real async server, we might push this to a websocket or store in a status map
        pass

agent_execution_engine = AgentExecutionEngine()
