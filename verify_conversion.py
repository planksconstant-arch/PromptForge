import asyncio
import os
import sys
from yaprompt_python.services.local_agent_orchestrator import local_agent_orchestrator
from yaprompt_python.services.work_product_manager import work_product_manager
from yaprompt_python.types import AgentConfig, AgentCapability, AgentStep, CapabilityType, AgentMetadata
from yaprompt_python.config import Config

# Ensure we can import the package
sys.path.append(os.getcwd())

async def main():
    print("=== Yaprompt Python Conversion Verification ===")
    
    # 1. Test Configuration
    print(f"\n[1] Checking Configuration...")
    print(f"Data Dir: {Config.DATA_DIR}")
    print(f"API Key Present: {'Yes' if Config.GEMINI_API_KEY else 'No'}")
    
    # 2. Storage & Agent Creation (Config Based)
    print(f"\n[2] Testing Agent Creation (Config)...")
    agent_config = AgentConfig(
        id="test-agent-1",
        name="Test Summarizer",
        description="A simple test agent",
        capabilities=[
            AgentCapability(type=CapabilityType.SUMMARIZE)
        ],
        steps=[
            AgentStep(
                id="step1",
                name="Summarize Input",
                capability=AgentCapability(type=CapabilityType.SUMMARIZE),
                prompt="Summarize this text",
                outputFormat="text"
            )
        ],
        outputFormat="json",
        metadata=AgentMetadata(createdAt=0, lastModified=0, version="1.0")
    )
    
    try:
        stored_agent = await local_agent_orchestrator.create_agent_from_config(agent_config)
        print(f"[OK] Agent created: {stored_agent.name} ({stored_agent.id})")
        
        # Verify retrieval
        retrieved = await local_agent_orchestrator.get_agent(stored_agent.id)
        if retrieved and retrieved.id == stored_agent.id:
            print("[OK] Agent retrieved successfully from storage")
        else:
            print("[FAIL] Agent retrieval failed")
            
    except Exception as e:
        print(f"[FAIL] Error creating agent: {e}")

    # 3. Workflow Planning (Generative)
    if Config.GEMINI_API_KEY:
        print(f"\n[3] Testing Workflow Planning (LLM)...")
        try:
            stored_workflow_agent = await local_agent_orchestrator.create_agent_from_description(
                "Create a workflow that takes a URL, fetches the content, and summarizes it."
            )
            print(f"[OK] Workflow Agent created: {stored_workflow_agent.name}")
            print(f"   Nodes: {len(stored_workflow_agent.workflow.nodes)}")
            for node in stored_workflow_agent.workflow.nodes:
                print(f"   - {node.type}: {node.name}")
                
        except Exception as e:
            print(f"[FAIL] Error planning workflow: {e}")
    else:
        print("\n[3] Skipping Workflow Planning (No API Key)")

    # 4. Work Product Manager
    print(f"\n[4] Testing Work Product Manager...")
    products = await work_product_manager.get_all_work_products()
    print(f"[OK] Found {len(products)} existing work products")

    print("\n=== Verification Complete ===")

if __name__ == "__main__":
    asyncio.run(main())
