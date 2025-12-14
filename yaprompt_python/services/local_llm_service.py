"""
Local LLM Service (Python Port)
Unified interface for local and cloud language models
Supports: Ollama, LM Studio, and Gemini (fallback)
"""

import aiohttp
import json
import time
import os
import asyncio
from typing import List, Dict, Optional, Any, Callable, AsyncGenerator
from pydantic import BaseModel
from fastapi import HTTPException

# ============================================================================
# TYPE DEFINITIONS
# ============================================================================

class LocalLLMConfig(BaseModel):
    provider: str = 'auto' # ollama, lmstudio, gemini, auto
    endpoint: str = 'http://localhost:11434'
    model: str = 'llama3.2:3b'
    streaming: bool = True
    temperature: float = 0.7
    maxTokens: int = 2000

class ModelInfo(BaseModel):
    name: str
    size: str
    modified: str
    available: bool

class LLMResponse(BaseModel):
    text: str
    provider: str
    model: str
    tokensUsed: Optional[int] = None
    latencyMs: float

# ============================================================================
# LOCAL LLM SERVICE
# ============================================================================

class LocalLLMService:
    OLLAMA_ENDPOINT = 'http://localhost:11434'
    LMSTUDIO_ENDPOINT = 'http://localhost:1234'
    OPENROUTER_ENDPOINT = 'https://openrouter.ai/api/v1/chat/completions'
    
    def __init__(self):
        self.config = LocalLLMConfig()

    async def detect_providers(self) -> Dict[str, bool]:
        results = {'ollama': False, 'lmstudio': False, 'gemini': False, 'openrouter': False}
        
        # Check Ollama
        try:
            async with aiohttp.ClientSession() as session:
                async with session.get(f"{self.OLLAMA_ENDPOINT}/api/tags", timeout=1) as resp:
                    if resp.status == 200: results['ollama'] = True
        except: pass

        # Check LM Studio
        try:
            async with aiohttp.ClientSession() as session:
                async with session.get(f"{self.LMSTUDIO_ENDPOINT}/v1/models", timeout=1) as resp:
                    if resp.status == 200: results['lmstudio'] = True
        except: pass

        # Check Cloud Keys
        if os.getenv("GEMINI_API_KEY"): results['gemini'] = True
        if os.getenv("OPENROUTER_API_KEY"): results['openrouter'] = True
            
        return results

    async def select_best_provider(self) -> str:
        available = await self.detect_providers()
        # Prioritize Cloud for quality if available, then local
        if available['openrouter']: return 'openrouter'
        if available['gemini']: return 'gemini'
        if available['ollama']: return 'ollama'
        if available['lmstudio']: return 'lmstudio'
        return 'none'

    async def list_models(self) -> List[ModelInfo]:
        provider = self.config.provider
        if provider == 'auto':
            provider = await self.select_best_provider()
            
        models = []
        
        # Always check OpenRouter content if key is present
        if os.getenv("OPENROUTER_API_KEY"):
             try:
                op_models = await self._list_openrouter_models()
                models.extend(op_models)
             except Exception as e:
                 print(f"Failed to list OpenRouter models: {e}")

        # Always check Gemini if key is present
        if os.getenv("GEMINI_API_KEY"):
            models.append(ModelInfo(name='gemini-2.0-flash', size='Cloud', modified='Latest', available=True))

        if provider == 'ollama':
            models.extend(await self._list_ollama_models())
        elif provider == 'lmstudio':
            models.extend(await self._list_lmstudio_models())
            
        return models

    async def _list_openrouter_models(self) -> List[ModelInfo]:
        api_key = os.getenv("OPENROUTER_API_KEY")
        if not api_key: return []
        
        headers = {"Authorization": f"Bearer {api_key}"}
        async with aiohttp.ClientSession() as session:
            async with session.get("https://openrouter.ai/api/v1/models", headers=headers) as resp:
                if resp.status == 200:
                    data = await resp.json()
                    # Filter for popular/good models to avoid spamming the list
                    popular_ids = ['anthropic/claude-3.5-sonnet', 'openai/gpt-4o', 'meta-llama/llama-3.1-70b-instruct', 'google/gemini-flash-1.5', 'gryphe/mythomax-l2-13b', 'mistralai/mistral-large']
                    
                    return [
                        ModelInfo(
                            name=m['id'], 
                            size=str(m.get('context_length', 'Unknown')), 
                            modified='Cloud', 
                            available=True
                        ) 
                        for m in data.get('data', []) 
                        if m['id'] in popular_ids or 'free' in m['id']
                    ]
        return []

    async def generate(self, prompt: str, options: Dict[str, Any] = None) -> LLMResponse:
        start_time = time.time()
        options = options or {}
        
        provider = options.get('provider', self.config.provider)
        if provider == 'auto':
            provider = await self.select_best_provider()

        model = options.get('model', self.config.model)
        system_prompt = options.get('systemPrompt', '')
        temperature = options.get('temperature', self.config.temperature)
        
        text = ""
        tokens_used = 0

        # Auto-detect provider based on model name if it's a known cloud model
        if '/' in model or 'gpt' in model or 'claude' in model:
            provider = 'openrouter'
        elif 'gemini' in model and provider != 'openrouter' and not '/' in model:
            provider = 'gemini'

        try:
            if provider == 'ollama':
                text = await self._generate_ollama(prompt, model, system_prompt, temperature)
            elif provider == 'lmstudio':
                text = await self._generate_lmstudio(prompt, model, system_prompt, temperature)
            elif provider == 'gemini':
                text = await self._generate_gemini(prompt, model, system_prompt, temperature)
            elif provider == 'openrouter':
                text = await self._generate_openrouter(prompt, model, system_prompt, temperature)
            else:
                raise HTTPException(status_code=503, detail="No LLM provider available. Please set GEMINI_API_KEY or OPENROUTER_API_KEY.")
        except Exception as e:
            text = f"Error from {provider}: {str(e)}"
            
        latency = (time.time() - start_time) * 1000
        return LLMResponse(
            text=text,
            provider=provider,
            model=model,
            tokensUsed=tokens_used,
            latencyMs=latency
        )

    # --- Providers ---

    async def _list_ollama_models(self) -> List[ModelInfo]:
        try:
            async with aiohttp.ClientSession() as session:
                async with session.get(f"{self.OLLAMA_ENDPOINT}/api/tags") as resp:
                    data = await resp.json()
                    return [ModelInfo(name=m['name'], size='Local', modified='', available=True) for m in data.get('models', [])]
        except: return []

    async def _list_lmstudio_models(self) -> List[ModelInfo]:
        try:
            async with aiohttp.ClientSession() as session:
                async with session.get(f"{self.LMSTUDIO_ENDPOINT}/v1/models") as resp:
                    data = await resp.json()
                    return [ModelInfo(name=m['id'], size='Unknown', modified='', available=True) for m in data.get('data', [])]
        except: return []

    async def _generate_ollama(self, prompt: str, model: str, system: str, temp: float) -> str:
        url = f"{self.OLLAMA_ENDPOINT}/api/generate"
        payload = {"model": model, "prompt": prompt, "system": system, "temperature": temp, "stream": False}
        async with aiohttp.ClientSession() as session:
            async with session.post(url, json=payload) as resp:
                if resp.status != 200: raise Exception(f"Status {resp.status}")
                return (await resp.json()).get('response', '')

    async def _generate_lmstudio(self, prompt: str, model: str, system: str, temp: float) -> str:
        url = f"{self.LMSTUDIO_ENDPOINT}/v1/chat/completions"
        messages = [{"role": "user", "content": prompt}]
        if system: messages.insert(0, {"role": "system", "content": system})
        payload = {"model": model, "messages": messages, "temperature": temp, "stream": False}
        async with aiohttp.ClientSession() as session:
            async with session.post(url, json=payload) as resp:
                if resp.status != 200: raise Exception(f"Status {resp.status}")
                return (await resp.json())['choices'][0]['message']['content']

    async def _generate_gemini(self, prompt: str, model: str, system: str, temp: float) -> str:
        import google.generativeai as genai
        api_key = os.getenv("GEMINI_API_KEY")
        if not api_key: raise Exception("Missing GEMINI_API_KEY")
        genai.configure(api_key=api_key)
        
        # Fallback list for Gemini models
        # Fallback list for Gemini models - Updated to available models
        models_to_try = ['gemini-2.0-flash', 'gemini-2.0-flash-exp', 'gemini-flash-latest', 'gemini-pro-latest']
        # If specific model requested and valid, put it first
        if model and 'gemini' in model and model not in models_to_try:
            models_to_try.insert(0, model)
            
        last_error = None
        for m in models_to_try:
            try:
                g_model = genai.GenerativeModel(m)
                response = await asyncio.to_thread(g_model.generate_content, prompt)
                return response.text
            except Exception as e:
                last_error = e
                continue # Try next model
        
        raise last_error

    async def _generate_openrouter(self, prompt: str, model: str, system: str, temp: float) -> str:
        api_key = os.getenv("OPENROUTER_API_KEY")
        if not api_key: raise Exception("Missing OPENROUTER_API_KEY")
        
        # Default to a free/cheap model if generic 'model' passed
        target_model = model
        if not model or model == 'llama3.2:3b': 
            target_model = "google/gemini-2.0-flash-exp:free" 
            
        headers = {
            "Authorization": f"Bearer {api_key}",
            "Content-Type": "application/json",
            "HTTP-Referer": "http://localhost:8000",
            "X-Title": "YaPrompt Studio"
        }
        messages = [{"role": "user", "content": prompt}]
        if system: messages.insert(0, {"role": "system", "content": system})
        
        payload = {
            "model": target_model,
            "messages": messages,
            "temperature": temp
        }
        
        async with aiohttp.ClientSession() as session:
            async with session.post(self.OPENROUTER_ENDPOINT, json=payload, headers=headers) as resp:
                if resp.status != 200:
                    err_text = await resp.text()
                    raise Exception(f"OpenRouter Error {resp.status}: {err_text}")
                data = await resp.json()
                return data['choices'][0]['message']['content']

local_llm_service = LocalLLMService()
