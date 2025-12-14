import time
import json
import uuid
import re
import asyncio
import aiohttp
from typing import Dict, Any, List, Optional, Callable, Union
import google.generativeai as genai

from ..types import (
    Workflow, WorkflowNode, WorkflowExecutionContext, WorkflowExecutionResult,
    ExecutionProgress, WorkflowNodeType, NodeConfig
)
from ..config import Config
from ..utils.storage import storage

class LocalWorkflowEngine:
    def __init__(self):
        self.progress_callbacks: Dict[str, Callable[[ExecutionProgress], None]] = {}

    async def execute_workflow(
        self,
        workflow: Workflow,
        input_data: Any,
        api_key: Optional[str] = None,
        on_progress: Optional[Callable[[ExecutionProgress], None]] = None
    ) -> WorkflowExecutionResult:
        execution_id = f"exec-{int(time.time()*1000)}-{uuid.uuid4().hex[:9]}"
        
        context = WorkflowExecutionContext(
            workflowId=workflow.id,
            executionId=execution_id,
            input=input_data,
            nodeOutputs={},
            variables={},
            startTime=int(time.time() * 1000),
            apiKey=api_key
        )

        if on_progress:
            self.progress_callbacks[execution_id] = on_progress

        try:
            # Find start node
            start_node = next((n for n in workflow.nodes if n.id == workflow.startNode), None)
            if not start_node:
                raise ValueError(f"Start node \"{workflow.startNode}\" not found")

            # Execute
            await self._execute_node(start_node, workflow, context)

            # Get final output
            final_output = self._get_final_output(workflow, context)

            duration = (time.time() * 1000) - context.startTime
            
            result = WorkflowExecutionResult(
                executionId=execution_id,
                status='success',
                output=final_output,
                executionTime=duration,
                nodesExecuted=len(context.nodeOutputs),
                totalNodes=len(workflow.nodes),
                nodeResults=context.nodeOutputs
            )

            self._update_progress(execution_id, ExecutionProgress(
                executionId=execution_id,
                currentNode='complete',
                nodesExecuted=len(context.nodeOutputs),
                totalNodes=len(workflow.nodes),
                status='completed',
                message='Workflow completed successfully'
            ))

            return result

        except Exception as error:
            duration = (time.time() * 1000) - context.startTime
            self._update_progress(execution_id, ExecutionProgress(
                executionId=execution_id,
                currentNode='error',
                nodesExecuted=len(context.nodeOutputs),
                totalNodes=len(workflow.nodes),
                status='error',
                message=str(error)
            ))

            return WorkflowExecutionResult(
                executionId=execution_id,
                status='error',
                output=None,
                executionTime=duration,
                nodesExecuted=len(context.nodeOutputs),
                totalNodes=len(workflow.nodes),
                error=str(error),
                nodeResults=context.nodeOutputs
            )
        finally:
            if execution_id in self.progress_callbacks:
                del self.progress_callbacks[execution_id]

    async def _execute_node(
        self,
        node: WorkflowNode,
        workflow: Workflow,
        context: WorkflowExecutionContext
    ) -> Any:
        # Skip if already executed
        if node.id in context.nodeOutputs:
            return context.nodeOutputs[node.id]

        self._update_progress(context.executionId, ExecutionProgress(
            executionId=context.executionId,
            currentNode=node.name,
            nodesExecuted=len(context.nodeOutputs),
            totalNodes=len(workflow.nodes),
            status='running',
            message=f"Executing: {node.name}"
        ))

        node_input = self._prepare_node_input(node, context)
        
        output = None
        
        if node.type == WorkflowNodeType.LLM_CALL:
            output = await self._execute_llm_call(node, node_input, context)
        elif node.type == WorkflowNodeType.HTTP_REQUEST:
            output = await self._execute_http_request(node, node_input, context)
        elif node.type == WorkflowNodeType.TRANSFORM_DATA:
            output = await self._execute_transform(node, node_input, context)
        elif node.type == WorkflowNodeType.EXTRACT_DATA:
            output = await self._execute_extract(node, node_input, context)
        elif node.type == WorkflowNodeType.BROWSER_ACTION:
            output = await self._execute_browser_action(node, node_input, context)
        elif node.type == WorkflowNodeType.STORAGE_READ:
            output = await self._execute_storage_read(node, node_input, context)
        elif node.type == WorkflowNodeType.STORAGE_WRITE:
            output = await self._execute_storage_write(node, node_input, context)
        elif node.type == WorkflowNodeType.CONDITIONAL:
            output = await self._execute_conditional(node, node_input, workflow, context)
            if output is not None and not isinstance(output, dict):
                 # Result from executed branch
                 pass # return output? The TS code returns output of branch execution
            return output 
        elif node.type == WorkflowNodeType.LOOP:
            output = await self._execute_loop(node, node_input, workflow, context)
        else:
            raise ValueError(f"Unknown node type: {node.type}")

        context.nodeOutputs[node.id] = output

        # Execute next nodes
        next_connections = [c for c in workflow.connections if c.from_ == node.id]
        for conn in next_connections:
            next_node = next((n for n in workflow.nodes if n.id == conn.to), None)
            if next_node:
                await self._execute_node(next_node, workflow, context)

        return output

    def _prepare_node_input(self, node: WorkflowNode, context: WorkflowExecutionContext) -> Any:
        input_data = context.input.copy() if isinstance(context.input, dict) else {'input': context.input}

        if node.config.inputMapping:
            for key, source_path in node.config.inputMapping.items():
                input_data[key] = self._resolve_data_path(source_path, context)

        input_data['$nodes'] = context.nodeOutputs
        input_data['$variables'] = context.variables
        return input_data

    def _resolve_data_path(self, path: str, context: WorkflowExecutionContext) -> Any:
        if path.startswith('$nodes.'):
            parts = path[7:].split('.')
            node_id = parts[0]
            node_output = context.nodeOutputs.get(node_id)
            if node_output is None:
                return None
            return self._get_nested_value(node_output, parts[1:]) if len(parts) > 1 else node_output
        elif path.startswith('$variables.'):
            var_name = path[11:]
            return context.variables.get(var_name)
        elif path.startswith('$input.'):
            parts = path[7:].split('.')
            return self._get_nested_value(context.input, parts)
        return path

    def _get_nested_value(self, obj: Any, path: List[str]) -> Any:
        current = obj
        for key in path:
            if isinstance(current, dict):
                 current = current.get(key)
            elif isinstance(current, list) and key.isdigit():
                 try:
                     current = current[int(key)]
                 except IndexError:
                     return None
            else:
                 return getattr(current, key, None)
            
            if current is None:
                return None
        return current

    def _interpolate_string(self, template: str, data: Any) -> str:
        # Regex to find {{ ... }}
        def replace_match(match):
            path = match.group(1).strip()
            value = self._get_nested_value(data, path.split('.'))
            return str(value) if value is not None else match.group(0)
        
        return re.sub(r'\{\{([^}]+)\}\}', replace_match, template)

    def _interpolate_object(self, obj: Any, data: Any) -> Any:
        if isinstance(obj, str):
            return self._interpolate_string(obj, data)
        elif isinstance(obj, list):
            return [self._interpolate_object(item, data) for item in obj]
        elif isinstance(obj, dict):
            return {k: self._interpolate_object(v, data) for k, v in obj.items()}
        return obj

    async def _execute_llm_call(self, node: WorkflowNode, input_data: Any, context: WorkflowExecutionContext) -> Any:
        prompt = self._interpolate_string(node.config.prompt or '', input_data)
        
        # Primary: Try Gemini
        try:
            api_key = context.apiKey or Config.GEMINI_API_KEY
            if not api_key:
                raise ValueError("API key required for LLM calls")

            genai.configure(api_key=api_key)
            model_name = 'gemini-2.0-flash-exp'
            
            gen_config = {
                "temperature": node.config.temperature or 0.7,
                "maxWorkflowTokens": node.config.maxTokens or 2048
            }
            
            model = genai.GenerativeModel(model_name)
            response = model.generate_content(prompt, generation_config=genai.types.GenerationConfig(
                temperature=gen_config['temperature'],
                max_output_tokens=gen_config['maxWorkflowTokens']
            ))
            
            return {"text": response.text, "raw": str(response)}
            
        except Exception as e:
            # Check for Fallbacks
            error_str = str(e)
            if "429" in error_str or "quota" in error_str.lower() or "resource exhausted" in error_str.lower():
                print(f"Gemini quota exceeded. Attempting fallbacks...")
                fallback_result = await self._try_fallback_providers(prompt, node.config)
                if fallback_result:
                    return fallback_result
            
            # If no fallback succeeded or not a quota error
            raise e

    async def _try_fallback_providers(self, prompt: str, config: NodeConfig) -> Optional[Dict[str, Any]]:
        # List of providers and their default models/direct-urls
        # name -> (Direct URL, Direct Model, OpenRouter Model)
        providers_map = {
            'deepseek': ('https://api.deepseek.com/v1/chat/completions', 'deepseek-chat', 'deepseek/deepseek-chat'),
            'kimi': ('https://api.moonshot.cn/v1/chat/completions', 'moonshot-v1-8k', 'moonshotai/moonshot-v1-8k'),
            'qwen': ('https://dashscope.aliyuncs.com/compatible-mode/v1/chat/completions', 'qwen-plus', 'qwen/qwen-plus'),
            'openai': ('https://api.openai.com/v1/chat/completions', 'gpt-4o-mini', 'openai/gpt-4o-mini'),
            'mistral': ('https://api.mistral.ai/v1/chat/completions', 'mistral-small-latest', 'mistralai/mistral-small'),
            'meta': ('https://api.meta.com/v1/chat/completions', 'llama-3-70b', 'meta-llama/llama-3-70b-instruct'), # Hypothetical direct
            'venice': ('https://api.venice.ai/api/v1/chat/completions', 'venice-v1', 'venice/venice-v1'), # Hypothetical
            'nvidia': ('https://integrate.api.nvidia.com/v1/chat/completions', 'nvidia/llama3-chatqa-1.5-70b', 'nvidia/llama-3.1-nemotron-70b-instruct'),
        }

        # Order to try
        try_order = ['deepseek', 'kimi', 'qwen', 'openai', 'mistral', 'meta', 'venice', 'nvidia']

        for name in try_order:
            key = Config.FALLBACK_KEYS.get(name)
            if not key:
                continue

            # Determine URL and Model based on key type
            url, model = self._resolve_provider_config(name, key, providers_map)
            
            print(f"Trying fallback: {name} (URL: {url}, Model: {model})...")
            try:
                result = await self._call_openai_compatible(url, key, model, prompt, config)
                if result:
                    print(f"Fallback {name} succeeded.")
                    return result
            except Exception as e:
                print(f"Fallback {name} failed: {e}")

        return None

    def _resolve_provider_config(self, name: str, key: str, providers_map: Dict) -> tuple[str, str]:
        defaults = providers_map.get(name)
        if not defaults:
            # Generic fallback
            return 'https://openrouter.ai/api/v1/chat/completions', 'openai/gpt-3.5-turbo' # fallback

        direct_url, direct_model, or_model = defaults
        
        # Check if it's an OpenRouter Key
        if key.startswith('sk-or-v1'):
            return 'https://openrouter.ai/api/v1/chat/completions', or_model
        
        return direct_url, direct_model

    async def _call_openai_compatible(self, url: str, key: str, model: str, prompt: str, config: NodeConfig) -> Dict[str, Any]:
        headers = {
            "Content-Type": "application/json",
            "Authorization": f"Bearer {key}"
        }
        
        # Add HTTP Referer/Title for OpenRouter consistency
        if 'openrouter.ai' in url:
             headers['HTTP-Referer'] = 'http://localhost:3000'
             headers['X-Title'] = 'Yaprompt Studio'
        
        payload = {
            "model": model,
            "messages": [{"role": "user", "content": prompt}],
            "temperature": config.temperature or 0.7,
            "max_tokens": config.maxTokens or 2048
        }
        
        async with aiohttp.ClientSession() as session:
            async with session.post(url, headers=headers, json=payload, timeout=60) as response:
                if response.status != 200:
                    text = await response.text()
                    raise Exception(f"HTTP {response.status}: {text}")
                    
                data = await response.json()
                # Handle OpenRouter structure vs Direct
                if 'choices' in data:
                    content = data['choices'][0]['message']['content']
                    return {"text": content, "raw": data}
                else: 
                     raise Exception(f"Unexpected response format: {data}")


    async def _execute_http_request(self, node: WorkflowNode, input_data: Any, context: WorkflowExecutionContext) -> Any:
        url = self._interpolate_string(node.config.url or '', input_data)
        method = node.config.method or 'GET'
        headers = node.config.headers or {}
        body = None
        if node.config.body:
             body = self._interpolate_object(node.config.body, input_data)

        async with aiohttp.ClientSession() as session:
            async with session.request(method, url, headers=headers, json=body) as response:
                content_type = response.headers.get('Content-Type', '')
                if 'application/json' in content_type:
                    data = await response.json()
                else:
                    data = await response.text()
                
                return {
                    "status": response.status,
                    "statusText": response.reason,
                    "headers": dict(response.headers),
                    "data": data
                }

    async def _execute_transform(self, node: WorkflowNode, input_data: Any, context: WorkflowExecutionContext) -> Any:
        if node.config.transformScript:
            # Danger: Executing arbitrary code
            # In a real local app this is somewhat acceptable if source is trusted
            # Using a restricted local scope
            
            script = node.config.transformScript
            # Wrap in a function to allow return
            # But exec doesn't return. 
            # We can define a function and call it.
            
            local_scope = {'input': input_data, 'context': {'variables': context.variables}}
            exec_str = f"def transform(input, context):\n  {script}\nresult = transform(input, context)"
            try:
                exec(exec_str, {}, local_scope)
                return local_scope.get('result')
            except Exception as e:
                raise ValueError(f"Transform script execution failed: {e}")
                
        elif node.config.mapping:
            result = {}
            for target_field, source_path in node.config.mapping.items():
                result[target_field] = self._resolve_data_path(source_path, context)
            return result
        
        return input_data

    async def _execute_extract(self, node: WorkflowNode, input_data: Any, context: WorkflowExecutionContext) -> Any:
        if node.config.fields:
            result = {}
            for field in node.config.fields:
                result[field] = input_data.get(field)
            return result
        return input_data

    async def _execute_browser_action(self, node: WorkflowNode, input_data: Any, context: WorkflowExecutionContext) -> Any:
        return {"success": True, "message": "Browser automation (Python placeholder)"}

    async def _execute_storage_read(self, node: WorkflowNode, input_data: Any, context: WorkflowExecutionContext) -> Any:
        key = node.config.key or 'data'
        result = await storage.get(key)
        return result.get(key)

    async def _execute_storage_write(self, node: WorkflowNode, input_data: Any, context: WorkflowExecutionContext) -> Any:
        key = node.config.key or 'data'
        data = node.config.data or input_data
        await storage.set({key: data})
        return {"success": True, "key": key, "data": data}

    async def _execute_conditional(self, node: WorkflowNode, input_data: Any, workflow: Workflow, context: WorkflowExecutionContext) -> Any:
        condition = node.config.condition or 'True'
        
        # Evaluate condition
        local_scope = {'input': input_data, 'context': {'variables': context.variables}}
        try:
             # simple eval
             is_true = eval(condition, {}, local_scope)
        except Exception:
             is_true = False
             
        next_node_id = node.config.trueNode if is_true else node.config.falseNode
        if next_node_id:
            next_node = next((n for n in workflow.nodes if n.id == next_node_id), None)
            if next_node:
                return await self._execute_node(next_node, workflow, context)
        
        return {"condition": is_true}

    async def _execute_loop(self, node: WorkflowNode, input_data: Any, workflow: Workflow, context: WorkflowExecutionContext) -> Any:
        items_path = node.config.items or '$input'
        items = self._resolve_data_path(items_path, context)
        
        if not isinstance(items, list):
            raise ValueError("Loop node requires an array of items")

        results = []
        if node.config.loopNode:
            loop_node = next((n for n in workflow.nodes if n.id == node.config.loopNode), None)
            if loop_node:
                for item in items:
                    # Create a new context? Or just update input? 
                    # TS creates loopContext with input: item. 
                    loop_context = context.model_copy()
                    loop_context.input = item
                    
                    res = await self._execute_node(loop_node, workflow, loop_context)
                    results.append(res)
        
        return results

    def _get_final_output(self, workflow: Workflow, context: WorkflowExecutionContext) -> Any:
        # Last executed node
        if context.nodeOutputs:
             return list(context.nodeOutputs.values())[-1]
        return None

    def _update_progress(self, execution_id: str, progress: ExecutionProgress):
        if execution_id in self.progress_callbacks:
            self.progress_callbacks[execution_id](progress)

local_workflow_engine = LocalWorkflowEngine()
