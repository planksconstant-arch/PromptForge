"""
AI Operating System (Python Port)
Central coordinator for all AI subsystems
"""

import time
from typing import Dict, List, Any
from .teammate_engine import teammate_engine
from .workflow_detector import workflow_detector
from .knowledge_graph import knowledge_graph
from .project_manager import project_manager

class AIOperatingSystem:
    def __init__(self):
        self.start_time = time.time()
        self.is_running = False

    async def initialize(self):
        self.is_running = True
        print("🧠 AI Operating System initialized (Python)")

    async def get_system_status(self) -> Dict[str, Any]:
        return {
            "isActive": self.is_running,
            "uptime": (time.time() - self.start_time) * 1000,
            "activeSubsystems": ["Teammate", "Workflow", "Knowledge", "Projects"],
            "stats": {
                "workflowsLearned": workflow_detector.get_stats().get("learnedWorkflows", 0),
                "knowledgeNodes": knowledge_graph.get_stats().get("totalNodes", 0),
                "projectsManaged": len(project_manager.get_all_projects())
            }
        }

    async def process_command(self, command: str) -> str:
        lower = command.lower()
        if "help" in lower:
            return teammate_engine.provide_help(lower)
        if "status" in lower:
             status = await self.get_system_status()
             return f"System is running. Uptime: {int(status['uptime']/1000)}s"
        return "Command not recognized."

ai_operating_system = AIOperatingSystem()
