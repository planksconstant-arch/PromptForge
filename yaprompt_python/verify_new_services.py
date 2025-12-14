
import asyncio
import os
import sys

# Ensure we can import modules from parent directory
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from services.browser_automation import browser_automation
from services.workflow_generator import workflow_generator

async def verify_browser_automation():
    print("\n--- Verifying Browser Automation ---")
    goal = "Go to github.com and search for 'python'"
    print(f"Goal: {goal}")
    
    actions = await browser_automation.plan_sequence(goal)
    
    if actions:
        print(f"Success! Generated {len(actions)} actions:")
        for action in actions:
            print(f"- [{action.action}] {action.description} ({action.selector})")
    else:
        print("Failed to generate actions.")

async def verify_workflow_generator():
    print("\n--- Verifying Workflow Generator ---")
    desc = "Create a workflow that triggers on a webhook, uses an LLM to summarize text, and emails the result."
    print(f"Description: {desc}")
    
    workflow = await workflow_generator.generate_workflow(desc)
    
    if workflow and "nodes" in workflow:
        print(f"Success! Generated Workflow: {workflow.get('name')}")
        print(f"Nodes: {len(workflow['nodes'])}")
        for node in workflow['nodes']:
            print(f"- {node['name']} ({node['type']})")
    else:
        print("Failed to generate workflow.")
        print(workflow)

async def main():
    await verify_browser_automation()
    await verify_workflow_generator()

if __name__ == "__main__":
    asyncio.run(main())
