"""
Agent Builder Service (Python Port)
Converts natural language descriptions into executable agent configurations.
"""

import json
import uuid
import time
from typing import List, Dict, Optional, Any
from pydantic import BaseModel

# ============================================================================
# TYPE DEFINITIONS
# ============================================================================

class AgentSpec(BaseModel):
    name: str
    description: str
    capabilities: List[str]
    workflow: List[Dict[str, Any]]
    connections: List[Any] = [] # Added for MCP (IDs or objects)
    triggers: Optional[List[Dict[str, Any]]] = []
    examples: Optional[List[str]] = []

class AgentConfig(BaseModel):
    id: str
    name: str
    description: str
    capabilities: List[Dict[str, Any]]
    connections: List[str] = [] # Added connections
    steps: List[Dict[str, Any]]
    outputFormat: str
    metadata: Dict[str, Any]

class BuildResult(BaseModel):
    success: bool
    agent: Optional[AgentConfig] = None
    spec: Optional[AgentSpec] = None
    error: Optional[str] = None
    confidence: float

# ============================================================================
# AGENT BUILDER
# ============================================================================

class AgentBuilder:
    CAPABILITY_MAP = {
        'research': 'research',
        'web search': 'research',
        'google': 'research',
        'summarize': 'summarize',
        'summary': 'summarize',
        'analyze': 'analyze',
        'analysis': 'analyze',
        'write': 'write',
        'generate': 'write',
        'create content': 'write',
        'extract': 'extract',
        'parse': 'extract',
        'transform': 'transform',
        'convert': 'transform',
        'compare': 'compare',
        'evaluate': 'evaluate',
        'assess': 'evaluate'
    }

    async def from_prompt(self, prompt: str, options: Dict[str, Any] = None) -> BuildResult:
        try:
            # Generate Spec
            spec = await self.generate_spec(prompt)
            if not spec:
                return BuildResult(success=False, error="Failed to generate agent specification", confidence=0)

            # Convert to Config
            agent = await self.spec_to_config(spec)

            return BuildResult(success=True, agent=agent, spec=spec, confidence=0.9)

        except Exception as e:
            return BuildResult(success=False, error=str(e), confidence=0)

    async def generate_spec(self, prompt: str) -> Optional[AgentSpec]:
        # Simple heuristic fallback if no LLM connected yet for builder logic
        # In a real system, this would call an LLM to produce JSON
        print(f"Generating spec for: {prompt}")
        
        mock_spec = AgentSpec(
            name="Generated Agent",
            description=f"Agent to handle: {prompt}",
            capabilities=["research", "summarize"],
            workflow=[
                {"step": "Analyze Request", "action": "analyze", "output": "Analysis"},
                {"step": "Execute Task", "action": "write", "output": "Final Result"}
            ],
            connections=[] # Default empty
        )
        return mock_spec

    async def spec_to_config(self, spec: AgentSpec) -> AgentConfig:
        steps = []
        for idx, wf_step in enumerate(spec.workflow):
            capability_type = self.map_capability(wf_step.get("action", ""))
            
            steps.append({
                "id": f"step_{idx + 1}",
                "name": wf_step.get("step", f"Step {idx+1}"),
                "capability": {
                    "type": capability_type,
                    "config": {
                        "depth": "moderate",
                        "format": "json" if "json" in wf_step.get("output", "").lower() else "text"
                    }
                },
                "prompt": self.generate_step_prompt(wf_step, spec),
                "inputFrom": [f"step_{idx}"] if idx > 0 else None,
                "outputFormat": "json" if "json" in wf_step.get("output", "").lower() else "text"
            })

        # Extract connection IDs if they are dicts, otherwise assume strings
        conn_ids = []
        for c in spec.connections:
            if isinstance(c, dict): conn_ids.append(c.get('id', 'unknown'))
            else: conn_ids.append(str(c))

        return AgentConfig(
            id=self.generate_id(),
            name=spec.name,
            description=spec.description,
            capabilities=[{"type": self.map_capability(c)} for c in spec.capabilities],
            connections=conn_ids,
            steps=steps,
            outputFormat="markdown",
            metadata={
                "createdAt": time.time(),
                "lastModified": time.time(),
                "version": "1.0.0"
            }
        )

    def map_capability(self, capability: str) -> str:
        lower = capability.lower()
        for key, value in self.CAPABILITY_MAP.items():
            if key in lower:
                return value
        return 'research'

    def generate_step_prompt(self, wf_step: Dict, spec: AgentSpec) -> str:
        return f"""Task: {wf_step.get('step')}
Context: Part of {spec.name} - {spec.description}
Action: {wf_step.get('action')}
Expected Output: {wf_step.get('output')}
Execute this task thoroughly."""

    def generate_id(self) -> str:
        return f"agent_{int(time.time())}_{str(uuid.uuid4())[:8]}"

agent_builder = AgentBuilder()
