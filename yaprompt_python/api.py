from fastapi import FastAPI, HTTPException, Body
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Optional, Any, Dict

# Existing imports
from .services.local_agent_orchestrator import local_agent_orchestrator, ExecutionRequest
from .services.work_product_manager import work_product_manager
from .services.workflow_planner import PlanningOptions, workflow_planner
from .services.agent_builder import agent_builder
from .services.continuum_memory_system import continuum_memory_system
from .services.project_manager import project_manager, Project
from .services.cognitive_engine import cognitive_engine, PredictedNeed
from .types import StoredAgent, WorkProduct, AgentConfig
from .services.local_llm_service import local_llm_service, LLMResponse
from .services.nested_learning_engine import nested_learning_engine
from .services.knowledge_graph import knowledge_graph
from .services.local_workflow_engine import local_workflow_engine
from .services.conversational_agent_builder import conversational_agent_builder
from .services.writing_style_engine import writing_style_engine
from .services.persona_manager import persona_manager
from .services.ai_operating_system import ai_operating_system
from .services.teammate_engine import teammate_engine
from .services.safe_action_approval import safe_action_approval
from .services.workflow_detector import workflow_detector
from .services.document_processor import document_processor
from .services.agent_execution_engine import agent_execution_engine
from .services.negotiation_engine import negotiation_engine
from .services.business_automation import business_automation
from .services.prompt_auto_optimizer import prompt_auto_optimizer
from .services.rl_engine import rl_engine
from .services.workflow_generator import workflow_generator
from .services.pdf_generator import pdf_generator
from .services.browser_automation import browser_automation
from .types import Workflow, WorkflowExecutionResult

app = FastAPI(title="YaPrompt AI Studio API")

# Allow CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# === Request Models ===

class CreateAgentRequest(BaseModel):
    description: str
    name: Optional[str] = None
    options: Optional[Dict[str, Any]] = {}

class ExecuteAgentRequest(BaseModel):
    agent_id: str
    input: Any
    api_key: Optional[str] = None

class MemoryStoreRequest(BaseModel):
    data: Any
    surpriseScore: float = 0.5
    metadata: Optional[Dict[str, Any]] = None

class ProjectCreateRequest(BaseModel):
    goal: str
    deadline: Optional[float] = None

class LLMGenerateRequest(BaseModel):
    prompt: str
    options: Optional[Dict[str, Any]] = {}

class KnowledgeNodeCreateRequest(BaseModel):
    type: str
    label: str
    description: str
    confidence: float = 1.0
    source: str = "user"
    metadata: Dict[str, Any] = {}

class WorkflowPlanRequest(BaseModel):
    description: str
    options: Optional[Dict[str, Any]] = {}

class WorkflowExecuteRequest(BaseModel):
    workflow: Dict[str, Any]
    input: Any
    api_key: Optional[str] = None

class BuilderStartRequest(BaseModel):
    description: str

class BuilderContinueRequest(BaseModel):
    state: Dict[str, Any]
    message: str

class WriteStyleLearnRequest(BaseModel):
    original: str
    edited: str

class PersonaSwitchRequest(BaseModel):
    mode: str

class OSCommandRequest(BaseModel):
    command: str

class ApprovalRequest(BaseModel):
    type: str
    description: str
    details: Dict[str, Any]

class ApprovalActionRequest(BaseModel):
    action_id: str
    method: str

class DocProcessRequest(BaseModel):
    text: str
    name: str
    format: str

# === Endpoints ===

# Removed JSON root to allow Frontend UI to take precedence.
# @app.get("/")
# async def root():
#     return {"status": "ok", ...}

# --- Agent Management ---

@app.post("/agents/create")
async def create_agent(request: CreateAgentRequest):
    try:
        result = await agent_builder.from_prompt(request.description)
        if not result.success:
            options = PlanningOptions() 
            agent = await local_agent_orchestrator.create_agent_from_description(
                description=request.description,
                name=request.name,
                options=options
            )
            return agent
        return result.agent
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/agents")
async def list_agents():
    return await local_agent_orchestrator.get_all_agents()

@app.get("/agents/{agent_id}")
async def get_agent(agent_id: str):
    agent = await local_agent_orchestrator.get_agent(agent_id)
    if not agent:
        raise HTTPException(status_code=404, detail="Agent not found")
    return agent

@app.post("/execute")
async def execute_agent(request: ExecuteAgentRequest):
    try:
        req = ExecutionRequest(
            agent_id=request.agent_id,
            input_data=request.input,
            api_key=request.api_key
        )
        result = await local_agent_orchestrator.execute_agent(req)
        if not result.success:
            raise HTTPException(status_code=500, detail=result.error)
        return result.work_product
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# --- Memory System ---

@app.post("/memory/store")
async def store_memory(request: MemoryStoreRequest):
    try:
        mid = await continuum_memory_system.store_memory(
            data=request.data,
            surprise_score=request.surpriseScore,
            metadata=request.metadata
        )
        return {"id": mid, "status": "stored"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/memory/retrieve")
async def retrieve_memory(query: str, limit: int = 10):
    return await continuum_memory_system.retrieve(query, limit=limit)

# --- Project Manager ---

@app.post("/projects/create")
async def create_project(request: ProjectCreateRequest):
    try:
        result = await project_manager.create_project(request.goal, request.deadline)
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/projects")
async def list_projects():
    return project_manager.get_all_projects()

@app.get("/projects/{project_id}")
async def get_project(project_id: str):
    project = project_manager.get_project(project_id)
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    return project

# --- Cognitive Engine ---

@app.get("/cognitive/needs")
async def predict_needs():
    context = {"currentTime": 0} 
    return cognitive_engine.predict_needs(context)

# --- LLM Service ---

@app.post("/llm/generate")
async def llm_generate(request: LLMGenerateRequest):
    return await local_llm_service.generate(request.prompt, request.options)

@app.get("/llm/models")
async def llm_models():
    return await local_llm_service.list_models()

# --- Nested Learning ---

@app.post("/learning/process")
async def learning_process(data: Any = Body(...), context: str = None):
    return await nested_learning_engine.process_data(data, context)

@app.get("/learning/patterns")
async def learning_patterns(confidence: float = 0.7):
    return await nested_learning_engine.detect_patterns(confidence)

# --- Knowledge Graph ---

@app.post("/knowledge/nodes")
async def create_knowledge_node(node: KnowledgeNodeCreateRequest):
    return await knowledge_graph.add_node(node.dict())

@app.get("/knowledge/search")
async def search_knowledge(q: str, limit: int = 20):
    return knowledge_graph.search(q, limit)

@app.get("/knowledge/stats")
async def knowledge_stats():
    return knowledge_graph.get_stats()

# --- Workflow Engine ---

@app.post("/workflow/plan")
async def plan_workflow(request: WorkflowPlanRequest):
    try:
        return await workflow_planner.plan_workflow(request.description)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/workflow/execute")
async def execute_workflow(request: WorkflowExecuteRequest):
    try:
        workflow = Workflow(**request.workflow) 
        result = await local_workflow_engine.execute_workflow(
            workflow=workflow,
            input_data=request.input,
            api_key=request.api_key
        )
        return result
    except Exception as e:
         raise HTTPException(status_code=500, detail=str(e))

# --- Conversational Builder ---

@app.post("/builder/start")
async def builder_start(request: BuilderStartRequest):
    return await conversational_agent_builder.start_conversation(request.description)

@app.post("/builder/continue")
async def builder_continue(request: BuilderContinueRequest):
    return await conversational_agent_builder.continue_conversation(request.state, request.message)

# --- Writing Style ---

@app.post("/style/learn")
async def style_learn(request: WriteStyleLearnRequest):
    await writing_style_engine.learn_from_correction(request.original, request.edited)
    return {"status": "learned"}

@app.get("/style/summary")
async def style_summary():
    return writing_style_engine.get_style_summary()

# --- Persona Manager ---

@app.get("/persona/current")
async def get_current_persona():
    return persona_manager.get_current_profile()

@app.post("/persona/switch")
async def switch_persona(request: PersonaSwitchRequest):
    success = persona_manager.switch_mode(request.mode)
    if not success:
        raise HTTPException(status_code=400, detail="Invalid mode")
    return {"success": True, "mode": request.mode}

@app.get("/persona/all")
async def list_personas():
    return persona_manager.get_all_personas()

# --- Work Products ---

@app.get("/work-products")
async def list_work_products():
    return await work_product_manager.get_recent(20)

@app.get("/work-products/{product_id}")
async def get_work_product(product_id: str):
    product = await work_product_manager.get_work_product(product_id)
    if not product:
        raise HTTPException(status_code=404, detail="Work product not found")
    return product

# === NEW: Batch 3 Endpoints ===

# --- AI OS ---
@app.get("/os/status")
async def os_status():
    return await ai_operating_system.get_system_status()

@app.post("/os/command")
async def os_command(request: OSCommandRequest):
    return {"response": await ai_operating_system.process_command(request.command)}

# --- Teammate Engine ---
@app.get("/teammate/suggestions")
async def teammate_suggestions():
    return await teammate_engine.generate_proactive_suggestions({})

# --- Safe Action Approval ---
@app.post("/approval/request")
async def approval_request(request: ApprovalRequest):
    return {"id": await safe_action_approval.request_approval(request.type, request.description, request.details)}

@app.post("/approval/approve")
async def approval_approve(request: ApprovalActionRequest):
    success = await safe_action_approval.approve_action(request.action_id, request.method)
    return {"success": success}

@app.get("/approval/pending")
async def approval_pending():
    return safe_action_approval.get_pending_actions()

# --- Workflow Detector ---
@app.post("/detector/analyze")
async def detector_analyze(history: List[Dict[str, Any]]):
    return await workflow_detector.analyze_history(history)

# --- Document Processor ---
@app.post("/docs/process")
async def doc_process(request: DocProcessRequest):
    return await document_processor.process_text(request.text, request.name, request.format)

# --- Agent Execution Engine ---
@app.post("/agent/execute")
async def agent_execute_full(request: Dict[str, Any]):
    # Expects agentConfig and input. Can be more typed in future.
    return await agent_execution_engine.execute_agent(request['agentConfig'], request['input'], request.get('apiKey'))

# --- Negotiation Engine ---
@app.post("/negotiation/start")
async def negotiation_start(params: Dict[str, Any]):
    return await negotiation_engine.start_negotiation(params)

@app.post("/negotiation/response")
async def negotiation_response(data: Dict[str, Any]):
    return await negotiation_engine.process_vendor_response(data['sessionId'], data['price'], data['message'])

@app.get("/negotiation/stats")
async def negotiation_stats():
    return negotiation_engine.get_stats()

# --- Business Automation ---
@app.post("/business/booking")
async def business_booking(request: Dict[str, Any]):
    return await business_automation.make_booking(request)

@app.post("/business/invoice")
async def business_invoice(invoice: Dict[str, Any]):
    return await business_automation.generate_invoice(invoice)

# --- Browser Automation ---
@app.post("/browser/plan")
def browser_plan(data: Dict[str, str]):
    return browser_automation.plan_sequence(data['goal'])

@app.post("/rl/reward")
async def rl_reward(data: Dict[str, Any]):
    rl_engine.record_reward(data['actionId'], data['value'], data['context'])
    return {"status": "ok"}

@app.post("/rl/select")
async def rl_select(data: Dict[str, Any]):
    return {"action": rl_engine.select_action(data['actions'], data['context'])}

@app.get("/rl/stats")
async def rl_stats():
    return rl_engine.get_stats()

# --- Workflow Generator ---
@app.post("/workflow/generate_n8n")
async def workflow_generate_n8n(data: Dict[str, Any]):
    return await workflow_generator.generate_workflow(data['description'])

# --- PDF Generator ---
@app.post("/pdf/generate")
async def pdf_generate(data: Dict[str, Any]):
    content = pdf_generator.generate_from_markdown(data['content'], data.get('options', {}))
    return {"pdf_base64": content}

# --- Prompt Optimizer ---
@app.post("/optimizer/optimize")
async def optimize_prompt_endpoint(data: Dict[str, Any]):
    return await prompt_auto_optimizer.optimize_prompt(data['prompt'], data.get('options', {}))

# --- Frontend Serving (Template Engine) ---

from fastapi.templating import Jinja2Templates
from fastapi.requests import Request
from fastapi.staticfiles import StaticFiles
import os

# Create directories if not exist (handled by agent tool previously)
templates_dir = os.path.join(os.path.dirname(__file__), "templates")
static_dir = os.path.join(os.path.dirname(__file__), "static")
if not os.path.exists(static_dir):
    os.makedirs(static_dir)
templates = Jinja2Templates(directory=templates_dir)

# Mount Static
app.mount("/static", StaticFiles(directory=static_dir), name="static")

@app.get("/", include_in_schema=False)
async def dashboard_page(request: Request):
    # Fetch Data
    status = await ai_operating_system.get_system_status()
    stats = rl_engine.get_stats()
    suggestions = await teammate_engine.generate_proactive_suggestions({})
    
    return templates.TemplateResponse("dashboard.html", {
        "request": request,
        "page": "dashboard",
        "status": status,
        "stats": stats,
        "suggestions": suggestions
    })

@app.get("/studio", include_in_schema=False)
async def studio_page(request: Request):
    return templates.TemplateResponse("prompt_studio.html", {
        "request": request,
        "page": "studio"
    })

@app.get("/builder", include_in_schema=False)
async def builder_page(request: Request):
    return templates.TemplateResponse("builder.html", {
        "request": request,
        "page": "builder"
    })

# --- Builder API Endpoints (Helper wrappers for Frontend) ---
@app.post("/builder/start")
async def builder_start(data: Dict[str, str]):
    res = await conversational_agent_builder.start_conversation(data['description'])
    return {"message": res.message, "state": res.state, "agentConfig": res.agentConfig}

@app.post("/builder/continue")
async def builder_continue(data: Dict[str, Any]):
    res = await conversational_agent_builder.continue_conversation(data['state'], data['message'])
    return {"message": res.message, "state": res.state, "agentConfig": res.agentConfig}
