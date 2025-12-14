import json
import time
import re
from typing import Dict, Any, List, Optional, Union
import google.generativeai as genai

from ..types import (
    Workflow, WorkflowNode, WorkflowConnection, WorkflowNodeType,
    NodeConfig, WorkflowMetadata
)
from ..config import Config

class WorkflowPlan:
    def __init__(
        self,
        workflow: Workflow,
        reasoning: str,
        estimatedDuration: int,
        complexity: str,
        requiredCapabilities: List[str]
    ):
        self.workflow = workflow
        self.reasoning = reasoning
        self.estimatedDuration = estimatedDuration
        self.complexity = complexity
        self.requiredCapabilities = requiredCapabilities

class PlanningOptions:
    def __init__(
        self,
        api_key: Optional[str] = None,
        optimize_for: Optional[str] = None,
        max_steps: Optional[int] = None,
        allow_browser_automation: Optional[bool] = None,
        allow_external_apis: Optional[bool] = None
    ):
        self.api_key = api_key
        self.optimize_for = optimize_for
        self.max_steps = max_steps
        self.allow_browser_automation = allow_browser_automation
        self.allow_external_apis = allow_external_apis

class WorkflowPlanner:
    PLANNING_SYSTEM_PROMPT = """You are an expert workflow architect. Your task is to design executable workflows that accomplish user goals.

Available Workflow Node Types:
- llm_call: Call an LLM with a prompt to generate text, analyze, summarize, etc.
- http_request: Make HTTP API calls to fetch or send data
- transform_data: Transform/filter/map data using JavaScript
- extract_data: Extract specific fields from data
- browser_action: Interact with web pages (click, type, extract, navigate)
- conditional: Branch based on conditions
- loop: Iterate over arrays of data
- storage_read: Read data from local storage
- storage_write: Write data to local storage

Your Response Format:
Return ONLY a valid JSON object with this structure:
{
  "name": "Workflow Name",
  "description": "What this workflow does",
  "reasoning": "Explanation of the workflow design strategy",
  "complexity": "simple|moderate|complex",
  "estimatedDuration": <seconds>,
  "nodes": [
    {
      "id": "node1",
      "type": "llm_call|http_request|...",
      "name": "Human-readable step name",
      "config": {
        // Node-specific configuration
      }
    }
  ],
  "connections": [
    { "from": "node1", "to": "node2" }
  ],
  "startNode": "node1"
}"""

    async def plan_workflow(
        self,
        description: str,
        options: PlanningOptions = PlanningOptions()
    ) -> WorkflowPlan:
        api_key = options.api_key or Config.GEMINI_API_KEY
        if not api_key:
            raise ValueError("API key required for workflow planning")

        constraints = self._build_constraints(options)
        user_prompt = f"""
Task Description: "{description}"

{constraints}

Design an optimal workflow to accomplish this task. Consider:
1. What steps are needed?
2. What data flows between steps?
3. How to handle potential failures?
4. What's the most efficient sequence?

Return the workflow design as JSON."""

        response = await self._call_llm(user_prompt, api_key)
        workflow_data = self._parse_workflow_response(response)
        workflow = self._build_workflow(workflow_data)

        return WorkflowPlan(
            workflow=workflow,
            reasoning=workflow_data.get('reasoning', 'Workflow designed to accomplish the specified task'),
            estimatedDuration=workflow_data.get('estimatedDuration', 30),
            complexity=workflow_data.get('complexity', 'moderate'),
            requiredCapabilities=self._extract_capabilities(workflow)
        )

    async def optimize_workflow(
        self,
        workflow: Workflow,
        goal: str,
        api_key: Optional[str] = None
    ) -> WorkflowPlan:
        key = api_key or Config.GEMINI_API_KEY
        if not key:
            raise ValueError("API key required for workflow optimization")

        # Basic workflow rep for LLM
        wf_json = {
            "name": workflow.name,
            "description": workflow.description,
            "nodes": [{"id": n.id, "type": n.type, "name": n.name} for n in workflow.nodes],
            "connections": [{"from": c.from_, "to": c.to} for c in workflow.connections]
        }

        prompt = f"""
You are optimizing a workflow for {goal}.

Current Workflow:
{json.dumps(wf_json, indent=2)}

Optimization Goal: {goal}
- If speed: minimize steps and dependencies, use parallel execution where possible
- If accuracy: add validation steps, use higher quality models, add error checking
- If cost: minimize LLM calls, use caching, batch operations

Provide an optimized version of this workflow as JSON."""

        response = await self._call_llm(prompt, key)
        workflow_data = self._parse_workflow_response(response)
        optimized_workflow = self._build_workflow(workflow_data)

        return WorkflowPlan(
            workflow=optimized_workflow,
            reasoning=workflow_data.get('reasoning', f"Optimized for {goal}"),
            estimatedDuration=workflow_data.get('estimatedDuration', 30),
            complexity=workflow_data.get('complexity', 'moderate'),
            requiredCapabilities=self._extract_capabilities(optimized_workflow)
        )

    async def _call_llm(self, prompt: str, api_key: str) -> str:
        genai.configure(api_key=api_key)
        model = genai.GenerativeModel(
            'gemini-2.0-flash-exp',
            system_instruction=self.PLANNING_SYSTEM_PROMPT
        )
        
        response = model.generate_content(prompt, generation_config=genai.types.GenerationConfig(
            temperature=0.7,
            max_output_tokens=4096
        ))
        
        if not response.text:
            raise ValueError("No response from LLM")
            
        return response.text

    def _parse_workflow_response(self, response: str) -> Any:
        try:
            return json.loads(self._extract_json(response))
        except json.JSONDecodeError:
            print(f"Failed to parse: {response}")
            raise Exception("Invalid workflow response from LLM")

    def _extract_json(self, text: str) -> str:
        json_match = re.search(r'```json\s*\n([\s\S]*?)\n```', text) or \
                     re.search(r'```\s*\n([\s\S]*?)\n```', text)
        if json_match:
            return json_match.group(1).strip()
            
        object_match = re.search(r'\{[\s\S]*\}', text)
        if object_match:
            return object_match.group(0)
            
        return text.strip()

    def _build_workflow(self, data: Any) -> Workflow:
        # Convert raw dict to Pydantic model
        # Need to handle node configs
        nodes = []
        for n in data.get('nodes', []):
            nodes.append(WorkflowNode(
                id=n['id'],
                type=WorkflowNodeType(n['type']),
                name=n['name'],
                config=NodeConfig(**n.get('config', {})),
                position=n.get('position', [0, 0])
            ))
            
        connections = []
        for c in data.get('connections', []):
            connections.append(WorkflowConnection(
                from_=c['from'],
                to=c['to'],
                condition=c.get('condition')
            ))
            
        return Workflow(
            id=f"wf-{int(time.time()*1000)}-{uuid.uuid4().hex[:9]}",
            name=data.get('name', 'Generated Workflow'),
            description=data.get('description', ''),
            nodes=nodes,
            connections=connections,
            startNode=data.get('startNode') or (nodes[0].id if nodes else 'start'),
            metadata=WorkflowMetadata(
                createdAt=int(time.time() * 1000),
                lastModified=int(time.time() * 1000),
                version='1.0.0'
            )
        )

    def _build_constraints(self, options: PlanningOptions) -> str:
        constraints = []
        if options.max_steps:
            constraints.append(f"- Maximum {options.max_steps} workflow steps")
        if options.optimize_for:
            constraints.append(f"- Optimize for {options.optimize_for}")
        if options.allow_browser_automation is False:
            constraints.append("- Do NOT use browser_action nodes")
        if options.allow_external_apis is False:
            constraints.append("- Do NOT use http_request nodes")
            
        return "Constraints:\n" + "\n".join(constraints) if constraints else ""

    def _extract_capabilities(self, workflow: Workflow) -> List[str]:
        capabilities = set()
        for node in workflow.nodes:
            if node.type == WorkflowNodeType.LLM_CALL:
                capabilities.add('AI/LLM Processing')
            elif node.type == WorkflowNodeType.HTTP_REQUEST:
                capabilities.add('External API Access')
            elif node.type == WorkflowNodeType.BROWSER_ACTION:
                capabilities.add('Browser Automation')
            elif node.type in [WorkflowNodeType.STORAGE_READ, WorkflowNodeType.STORAGE_WRITE]:
                capabilities.add('Local Storage')
            elif node.type == WorkflowNodeType.TRANSFORM_DATA:
                capabilities.add('Data Transformation')
        return list(capabilities)

workflow_planner = WorkflowPlanner()
