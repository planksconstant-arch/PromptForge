import asyncio
import sys
import os

# Add project root to path
sys.path.append(os.getcwd())

from yaprompt_python.services.local_agent_orchestrator import local_agent_orchestrator
from yaprompt_python.types import AgentConfig, AgentCapability, AgentStep, CapabilityType, AgentMetadata

async def main():
    print("Updating Agent...")
    
    # We overwrite test-agent-1 to be the Optimizer, so the UI picks it up automatically if it's selecting by default/ID
    optimizer_config = AgentConfig(
        id="test-agent-1", 
        name="Prompt Optimizer",
        description="Transforms basic prompts into expert-level instructions.",
        capabilities=[
            AgentCapability(type=CapabilityType.TRANSFORM)
        ],
        steps=[
            AgentStep(
                id="optimize_step",
                name="Optimize",
                capability=AgentCapability(type=CapabilityType.WRITE),
                prompt="""You are a Senior Prompt Engineer. 
Analyze the user's input prompt and rewrite it to be significantly better.
Follow these rules:
1. Use clear, direct language.
2. Define a specific persona (e.g., "Act as a...").
3. Add constraints and output format requirements.
4. IMPROVE IT. Do not just repeat it.
5. Return ONLY the optimized prompt text. Do not include JSON formatting or "Results:" headers.""",
                outputFormat="text"
            )
        ],
        outputFormat="markdown", # Force markdown/text output
        metadata=AgentMetadata(createdAt=0, lastModified=0, version="2.0")
    )

    await local_agent_orchestrator.save_agent(optimizer_config)
    print("SUCCESS: Agent 'test-agent-1' updated to 'Prompt Optimizer'")

if __name__ == "__main__":
    asyncio.run(main())
