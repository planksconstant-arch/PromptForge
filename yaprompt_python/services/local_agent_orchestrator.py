import time
import uuid
import asyncio
from typing import List, Optional, Any, Dict, Union, Literal
from pydantic import ValidationError

from ..types import (
    StoredAgent, AgentConfig, WorkProduct, Workflow, StoredAgentMetadata,
    WorkflowExecutionContext
)
from ..config import Config
from ..utils.storage import storage
from .agent_execution_engine import agent_execution_engine
from .local_workflow_engine import local_workflow_engine
from .workflow_planner import workflow_planner, PlanningOptions
from .work_product_manager import work_product_manager

class ExecutionResult:
    def __init__(self, success: bool, work_product: Optional[WorkProduct] = None, error: Optional[str] = None):
        self.success = success
        self.work_product = work_product
        self.error = error

class ExecutionRequest:
    def __init__(self, agent_id: str, input_data: Any, strategy: str = 'auto', api_key: Optional[str] = None):
        self.agent_id = agent_id
        self.input_data = input_data
        self.strategy = strategy
        self.api_key = api_key

class LocalAgentOrchestrator:
    AGENTS_STORAGE_KEY = 'local_agents'

    def __init__(self):
        pass

    # ========== AGENT MANAGEMENT ==========

    async def create_agent_from_description(
        self,
        description: str,
        name: Optional[str] = None,
        options: PlanningOptions = PlanningOptions()
    ) -> StoredAgent:
        plan = await workflow_planner.plan_workflow(description, options)
        
        agent = StoredAgent(
            id=f"agent-{int(time.time()*1000)}-{uuid.uuid4().hex[:9]}",
            name=name or plan.workflow.name,
            description=plan.workflow.description,
            type='workflow',
            workflow=plan.workflow,
            metadata=StoredAgentMetadata(
                createdAt=int(time.time()*1000),
                lastModified=int(time.time()*1000),
                executionCount=0,
                successCount=0
            )
        )
        
        await self._save_agent(agent)
        return agent

    async def create_agent_from_config(self, config: AgentConfig) -> StoredAgent:
        agent = StoredAgent(
            id=config.id,
            name=config.name,
            description=config.description,
            type='config',
            config=config,
            metadata=StoredAgentMetadata(
                createdAt=int(time.time()*1000),
                lastModified=int(time.time()*1000),
                executionCount=0,
                successCount=0
            )
        )
        
        await self._save_agent(agent)
        return agent

    async def get_agent(self, agent_id: str) -> Optional[StoredAgent]:
        agents = await self.get_all_agents()
        return next((a for a in agents if a.id == agent_id), None)

    async def get_all_agents(self) -> List[StoredAgent]:
        data = await storage.get(self.AGENTS_STORAGE_KEY)
        agents_data = data.get(self.AGENTS_STORAGE_KEY) or []
        
        # Deserialize
        agents = []
        for d in agents_data:
            try:
                agents.append(StoredAgent(**d))
            except ValidationError as e:
                print(f"Failed to load agent {d.get('id')}: {e}")
                
        return agents

    async def update_agent(self, agent_id: str, updates: Dict[str, Any]) -> Optional[StoredAgent]:
        agents = await self.get_all_agents()
        index = next((i for i, a in enumerate(agents) if a.id == agent_id), -1)
        
        if index == -1:
            return None
            
        current = agents[index]
        updated_data = current.model_dump()
        updated_data.update(updates)
        updated_data['metadata']['lastModified'] = int(time.time()*1000)
        
        updated_agent = StoredAgent(**updated_data)
        agents[index] = updated_agent
        
        await self._save_all_agents(agents)
        return updated_agent

    async def delete_agent(self, agent_id: str) -> bool:
        agents = await self.get_all_agents()
        filtered = [a for a in agents if a.id != agent_id]
        
        if len(filtered) < len(agents):
            await self._save_all_agents(filtered)
            return True
        return False

    # ========== AGENT EXECUTION ==========

    async def execute_agent(self, request: ExecutionRequest) -> ExecutionResult:
        agent = await self.get_agent(request.agent_id)
        if not agent:
            return ExecutionResult(False, error='Agent not found')

        try:
            work_product = None
            strategy = request.strategy
            if strategy == 'auto':
                if agent.type == 'workflow':
                    work_product = await self._execute_via_workflow(agent, request.input_data, request.api_key)
                else:
                    work_product = await self._execute_via_config(agent, request.input_data, request.api_key)
            elif strategy == 'workflow':
                 work_product = await self._execute_via_workflow(agent, request.input_data, request.api_key)
            else:
                 work_product = await self._execute_via_config(agent, request.input_data, request.api_key)

            # Save work product
            await work_product_manager.save_work_product(work_product)

            # Update stats
            ts = work_product.metadata.timestamp
            duration = (time.time() * 1000) - ts if ts else 0 # simple approximation, or use executionTime
            await self._update_agent_stats(agent.id, True, work_product.metadata.executionTime)

            return ExecutionResult(True, work_product)

        except Exception as e:
            await self._update_agent_stats(agent.id, False, 0)
            return ExecutionResult(False, error=str(e))

    async def _execute_via_workflow(self, agent: StoredAgent, input_data: Any, api_key: Optional[str]) -> WorkProduct:
        if not agent.workflow:
            raise ValueError('Agent does not have a workflow')
            
        result = await local_workflow_engine.execute_workflow(agent.workflow, input_data, api_key)
        
        if result.status == 'error':
             raise Exception(result.error or 'Workflow execution failed')

        # Convert to WorkProduct
        # Workflow execution returns WorkflowExecutionResult, need to wrap in WorkProduct
        wp_metadata = {
            "executionTime": result.executionTime,
            "stepsCompleted": result.nodesExecuted,
            "totalSteps": result.totalNodes,
            "timestamp": int(time.time()*1000),
            "executionId": result.executionId,
            "strategy": 'workflow'
        }
        
        return WorkProduct(
            id=f"wp-{int(time.time()*1000)}-{uuid.uuid4().hex[:9]}",
            agentId=agent.id,
            agentName=agent.name,
            title=f"{agent.name} - {time.ctime()}",
            format='json',
            content=result.output,
            metadata=wp_metadata
        )

    async def _execute_via_config(self, agent: StoredAgent, input_data: Any, api_key: Optional[str]) -> WorkProduct:
        if not agent.config:
            raise ValueError('Agent does not have a config')
            
        return await agent_execution_engine.execute_agent(agent.config, input_data, api_key)

    async def _update_agent_stats(self, agent_id: str, success: bool, execution_time: float):
        agent = await self.get_agent(agent_id)
        if not agent:
            return

        meta = agent.metadata
        new_count = meta.executionCount + 1
        new_success = meta.successCount + (1 if success else 0)
        current_avg = meta.averageExecutionTime or 0
        new_avg = ((current_avg * meta.executionCount) + execution_time) / new_count

        await self.update_agent(agent_id, {
            "metadata": {
                **meta.model_dump(),
                "lastExecuted": int(time.time()*1000),
                "executionCount": new_count,
                "successCount": new_success,
                "averageExecutionTime": new_avg
            }
        })

    async def _save_agent(self, agent: StoredAgent):
        agents = await self.get_all_agents()
        index = next((i for i, a in enumerate(agents) if a.id == agent.id), -1)
        
        if index != -1:
            agents[index] = agent
        else:
            agents.append(agent)
            
        await self._save_all_agents(agents)

    async def _save_all_agents(self, agents: List[StoredAgent]):
        data = [a.model_dump() for a in agents]
        await storage.set({self.AGENTS_STORAGE_KEY: data})

local_agent_orchestrator = LocalAgentOrchestrator()
