import os
import json
import glob
from typing import Dict, Any, List, Optional
from pydantic import BaseModel

class ToolResult(BaseModel):
    success: bool
    data: Any
    error: Optional[str] = None

class BaseTool:
    def __init__(self, name: str, description: str):
        self.name = name
        self.description = description
    
    async def execute(self, action: str, params: Dict[str, Any]) -> ToolResult:
        raise NotImplementedError

class PESInternalTool(BaseTool):
    def __init__(self):
        super().__init__("PES Internal", "Access internal Prompt Studio data")
        self.base_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

    async def execute(self, action: str, params: Dict[str, Any]) -> ToolResult:
        if action == "list_agents":
            agents_dir = os.path.join(self.base_dir, "agents")
            if not os.path.exists(agents_dir): return ToolResult(success=True, data=[])
            files = glob.glob(os.path.join(agents_dir, "*.json"))
            agents = []
            for f in files:
                try:
                    with open(f, 'r') as file: agents.append(json.load(file))
                except: pass
            return ToolResult(success=True, data=agents)
        
        elif action == "read_file":
            path = params.get('path')
            if not path: return ToolResult(success=False, data=None, error="Path required")
            # Security check: limited to project dir
            full_path = os.path.abspath(os.path.join(self.base_dir, path))
            if not full_path.startswith(self.base_dir):
                 return ToolResult(success=False, data=None, error="Access denied")
            
            if os.path.exists(full_path):
                with open(full_path, 'r', encoding='utf-8', errors='ignore') as f:
                    return ToolResult(success=True, data=f.read())
            return ToolResult(success=False, data=None, error="File not found")

        return ToolResult(success=False, data=None, error=f"Unknown action: {action}")

class GitHubTool(BaseTool):
    def __init__(self):
        super().__init__("GitHub", "Interact with GitHub Repositories")

    async def execute(self, action: str, params: Dict[str, Any]) -> ToolResult:
        # Real HTTP calls would go here. Mocking for demo as requested, 
        # but structuring it so it *could* be real.
        if action == "search_repos":
            query = params.get('query')
            return ToolResult(success=True, data=[
                {"name": "promptforge", "stars": 120, "desc": "PromptForge AI Studio"},
                {"name": "agent-framework", "stars": 85, "desc": "Python Agent Lib"}
            ])
        elif action == "get_code":
            return ToolResult(success=True, data="def hello():\n    print('Hello from GitHub')")
            
        return ToolResult(success=False, data=None, error="Unknown GH action")

class ToolRegistry:
    def __init__(self):
        self.tools: Dict[str, BaseTool] = {}
        self.register_tools()

    def register_tools(self):
        self.tools['pes'] = PESInternalTool()
        self.tools['github'] = GitHubTool()
        self.tools['google_drive'] = BaseTool("Google Drive", "Mock GDrive") # Placeholder
        self.tools['slack'] = BaseTool("Slack", "Mock Slack") # Placeholder
        self.tools['postgres'] = BaseTool("Postgres", "Mock DB") # Placeholder

    def get_tool(self, tool_id: str) -> Optional[BaseTool]:
        return self.tools.get(tool_id)

    def get_tool_prompt(self, tool_id: str) -> str:
        tool = self.get_tool(tool_id)
        if not tool: return ""
        
        if tool_id == 'pes':
            return """
TOOL: PES Internal (pes)
ACTIONS:
- list_agents(): List all saved agents
- read_file(path: str): Read a file relative to project root
USAGE: Use this to inspect your own codebase or saved prompts.
"""
        elif tool_id == 'github':
            return """
TOOL: GitHub (github)
ACTIONS:
- search_repos(query: str): Find repos
- get_code(repo: str, path: str): Read code
"""
        return f"TOOL: {tool.name}\nDESCRIPTION: {tool.description}"

tool_registry = ToolRegistry()
