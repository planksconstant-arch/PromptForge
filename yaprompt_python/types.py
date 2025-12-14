from typing import List, Dict, Any, Optional, Union, Literal
from enum import Enum
from pydantic import BaseModel, Field

# ============================================================================
# SHARED TYPES (from types.ts)
# ============================================================================

class ModelType(str, Enum):
    GEMINI = 'gemini'
    CLAUDE = 'claude'
    GPT = 'gpt'
    QWEN = 'qwen'

class OptimizationGoal(str, Enum):
    COT = 'Chain-of-Thought Reasoning'
    CREATIVE = 'Creative Ideation & Brainstorming'
    FACTUAL = 'Factual Precision & Detail'
    ROLEPLAY = 'Role-Playing & Persona Adoption'
    CODE = 'Code Generation & Explanation'

class Critique(BaseModel):
    text: str
    clarity: float
    robustness: float
    efficiency: float

class Stage1Result(BaseModel):
    reasoning: str
    prompt: str

class Stage2Result(BaseModel):
    reasoning: str
    prompt: str
    critique: Optional[Critique] = None

class FullResult(BaseModel):
    stage1: Stage1Result
    stage2: Stage2Result

# ============================================================================
# AGENT EXECUTION ENGINE TYPES (from AgentExecutionEngine.ts)
# ============================================================================

class CapabilityType(str, Enum):
    RESEARCH = 'research'
    SUMMARIZE = 'summarize'
    ANALYZE = 'analyze'
    WRITE = 'write'
    EXTRACT = 'extract'
    TRANSFORM = 'transform'
    COMPARE = 'compare'
    EVALUATE = 'evaluate'

class AgentCapabilityConfig(BaseModel):
    depth: Optional[Literal['shallow', 'moderate', 'deep']] = None
    format: Optional[str] = None
    maxLength: Optional[int] = None
    sources: Optional[List[str]] = None
    model_config = {'extra': 'allow'} # Allow arbitrary keys

class AgentCapability(BaseModel):
    type: CapabilityType
    config: Optional[AgentCapabilityConfig] = None

class AgentStep(BaseModel):
    id: str
    name: str
    capability: AgentCapability
    prompt: str
    inputFrom: Optional[List[str]] = None
    outputFormat: Literal['text', 'json', 'markdown', 'html']

class AgentMetadata(BaseModel):
    createdAt: int
    lastModified: int
    version: str

class AgentConfig(BaseModel):
    id: str
    name: str
    description: str
    capabilities: List[AgentCapability]
    steps: List[AgentStep]
    outputFormat: Literal['markdown', 'pdf', 'json', 'html']
    metadata: Optional[AgentMetadata] = None

class WorkProductMetadata(BaseModel):
    executionTime: float
    stepsCompleted: int
    totalSteps: int
    timestamp: int
    inputSummary: Optional[str] = None
    model_config = {'extra': 'allow'}

class WorkProduct(BaseModel):
    id: str
    agentId: str
    agentName: str
    title: str
    format: Literal['markdown', 'pdf', 'json', 'html', 'text']
    content: Any
    metadata: WorkProductMetadata

class ExecutionContext(BaseModel):
    input: Any
    stepResults: Dict[str, Any]
    metadata: Dict[str, Any]

class ExecutionProgress(BaseModel):
    agentId: Optional[str] = None
    executionId: Optional[str] = None # Unified field for both engines
    currentStep: Optional[int] = None
    currentNode: Optional[str] = None # For workflow engine
    totalSteps: Optional[int] = None # Alias for totalNodes if needed
    totalNodes: Optional[int] = None
    stepName: Optional[str] = None
    status: Literal['running', 'completed', 'error']
    message: Optional[str] = None
    nodesExecuted: Optional[int] = None 

# ============================================================================
# LOCAL WORKFLOW ENGINE TYPES (from LocalWorkflowEngine.ts)
# ============================================================================

class WorkflowNodeType(str, Enum):
    LLM_CALL = 'llm_call'
    HTTP_REQUEST = 'http_request'
    TRANSFORM_DATA = 'transform_data'
    EXTRACT_DATA = 'extract_data'
    BROWSER_ACTION = 'browser_action'
    CONDITIONAL = 'conditional'
    LOOP = 'loop'
    STORAGE_READ = 'storage_read'
    STORAGE_WRITE = 'storage_write'

class NodeConfig(BaseModel):
    prompt: Optional[str] = None
    model: Optional[str] = None
    temperature: Optional[float] = None
    maxTokens: Optional[int] = None
    url: Optional[str] = None
    method: Optional[Literal['GET', 'POST', 'PUT', 'DELETE']] = None
    headers: Optional[Dict[str, str]] = None
    body: Optional[Any] = None
    transformScript: Optional[str] = None
    mapping: Optional[Dict[str, str]] = None
    fields: Optional[List[str]] = None
    jsonPath: Optional[str] = None
    action: Optional[Literal['click', 'type', 'extract', 'navigate', 'screenshot']] = None
    selector: Optional[str] = None
    value: Optional[str] = None
    condition: Optional[str] = None
    trueNode: Optional[str] = None
    falseNode: Optional[str] = None
    items: Optional[str] = None
    loopNode: Optional[str] = None
    key: Optional[str] = None
    data: Optional[Any] = None
    inputMapping: Optional[Dict[str, str]] = None
    model_config = {'extra': 'allow'}

class WorkflowNode(BaseModel):
    id: str
    type: WorkflowNodeType
    name: str
    config: NodeConfig
    position: Optional[List[float]] = None # [x, y]

class WorkflowConnection(BaseModel):
    from_: str = Field(..., alias='from')
    to: str
    condition: Optional[str] = None

class WorkflowMetadata(BaseModel):
    createdAt: int
    lastModified: int
    version: str
    model_config = {'extra': 'allow'}

class Workflow(BaseModel):
    id: str
    name: str
    description: str
    nodes: List[WorkflowNode]
    connections: List[WorkflowConnection]
    startNode: str
    metadata: Optional[WorkflowMetadata] = None

class WorkflowExecutionContext(BaseModel):
    workflowId: str
    executionId: str
    input: Any
    nodeOutputs: Dict[str, Any]
    variables: Dict[str, Any]
    startTime: int
    apiKey: Optional[str] = None

class WorkflowExecutionResult(BaseModel):
    executionId: str
    status: Literal['success', 'error', 'partial']
    output: Any
    executionTime: float
    nodesExecuted: int
    totalNodes: int
    error: Optional[str] = None
    nodeResults: Dict[str, Any]

# ============================================================================
# LOCAL AGENT ORCHESTRATOR TYPES (from LocalAgentOrchestrator.ts)
# ============================================================================

class StoredAgentMetadata(BaseModel):
    createdAt: int
    lastModified: int
    lastExecuted: Optional[int] = None
    executionCount: int
    successCount: int
    averageExecutionTime: Optional[float] = None

class StoredAgent(BaseModel):
    id: str
    name: str
    description: str
    type: Literal['workflow', 'config']
    workflow: Optional[Workflow] = None
    config: Optional[AgentConfig] = None
    metadata: StoredAgentMetadata
