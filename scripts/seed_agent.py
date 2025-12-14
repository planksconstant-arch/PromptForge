
import asyncio
import sys
import os
import json
import uuid
import time
from pathlib import Path

# Add project root to path
sys.path.append(os.getcwd())

from yaprompt_python.services.local_agent_orchestrator import local_agent_orchestrator
from yaprompt_python.types import StoredAgent, Workflow, WorkflowNode, WorkflowNodeType, NodeConfig, WorkflowMetadata

async def seed():
    print("Seeding Prompt Optimizer Agent...")
    
    # Check if exists
    agents = await local_agent_orchestrator.get_all_agents()
    existing = next((a for a in agents if a.name == "Prompt Optimizer"), None)
    
    if existing:
        print("Prompt Optimizer already exists.")
        # Optional: Delete and recreate to update logic?
        # await local_agent_orchestrator.delete_agent(existing.id)
        # print("Deleted existing agent.")
        return

    # Define Workflow
    agent_id = f"agent-optimizer-{uuid.uuid4().hex[:8]}"
    
    prompt_template = """You are an Expert Prompt Engineer and AI Researcher.
Your goal is to optimize the user's prompt using a rigorous two-stage process.

Input Prompt: "{{input}}"

Perform the following steps internally, then return the final result in JSON format.

Stage 1: Structural Optimization
- Analyze the user's intent.
- Apply prompt engineering best practices (Expert Persona, CO-STAR, Delimiters, Chain of Thought).
- Create a structured, clear version of the prompt.
- Reasoning: Explain what structural changes were made.

Stage 2: Semantic Refinement
- Take the Stage 1 prompt and refine it for maximum clarity, robustness, and efficiency.
- Anticipate edge cases and potential ambiguities.
- Critique the optimized prompt on Clarity, Robustness, and Efficiency (1-10).
- Reasoning: Explain the semantic refinements.

RETURN ONLY A VALID JSON OBJECT WITH THIS EXACT STRUCTURE:
{
  "stage1": {
    "reasoning": "Explanation of structural changes...",
    "prompt": "The structurally optimized prompt..."
  },
  "stage2": {
    "reasoning": "Explanation of semantic refinements...",
    "prompt": "The final, fully optimized prompt...",
    "critique": {
      "clarity": 9,
      "robustness": 8,
      "efficiency": 9,
      "text": "Detailed critique of the final prompt..."
    }
  }
}"""

    node = WorkflowNode(
        id="optimize_node",
        type=WorkflowNodeType.LLM_CALL,
        name="Optimize Prompt",
        config=NodeConfig(
            prompt=prompt_template,
            temperature=0.7,
            maxTokens=4096
        ),
        position=[0, 0]
    )

    workflow = Workflow(
        id=f"wf-optimizer-{uuid.uuid4().hex[:8]}",
        name="Prompt Optimizer Workflow",
        description="Optimizes prompts using a two-stage process.",
        nodes=[node],
        connections=[],
        startNode="optimize_node",
        metadata=WorkflowMetadata(
            createdAt=int(time.time()*1000),
            lastModified=int(time.time()*1000),
            version="1.0.0"
        )
    )

    agent = StoredAgent(
        id=agent_id,
        name="Prompt Optimizer",
        description="Advanced two-stage prompt optimization (Structure + Semantics)",
        type='workflow',
        workflow=workflow,
        metadata={
            "createdAt": int(time.time()*1000),
            "lastModified": int(time.time()*1000),
            "executionCount": 0,
            "successCount": 0
        }
    )

    await local_agent_orchestrator._save_agent(agent)
    print(f"✅ Created Agent: {agent.name} ({agent.id})")

if __name__ == "__main__":
    asyncio.run(seed())
