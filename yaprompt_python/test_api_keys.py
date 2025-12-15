import sys
import os
import asyncio
from dotenv import load_dotenv

# Add project root to path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

# Load env
load_dotenv()

from services.local_llm_service import local_llm_service

async def test_keys():
    print("=== Checking API Keys ===")
    
    gemini_key = os.getenv("GEMINI_API_KEY")
    openrouter_key = os.getenv("OPENROUTER_API_KEY")
    
    print(f"GEMINI_API_KEY found: {'Yes' if gemini_key else 'No'}")
    print(f"OPENROUTER_API_KEY found: {'Yes' if openrouter_key else 'No'}")
    
    # Map keys to their likely endpoints for testing
    # Using generic headers/bodies where possible (OpenAI compatible)
    provider_configs = {
        'FALLBACK_DEEPSEEK_KEY': {'url': 'https://api.deepseek.com/chat/completions', 'model': 'deepseek-chat'},
        'FALLBACK_OPENAI_KEY': {'url': 'https://api.openai.com/v1/chat/completions', 'model': 'gpt-3.5-turbo'},
        'FALLBACK_MISTRAL_KEY': {'url': 'https://api.mistral.ai/v1/chat/completions', 'model': 'mistral-tiny'},
        'FALLBACK_KIMI_KEY': {'url': 'https://api.moonshot.cn/v1/chat/completions', 'model': 'moonshot-v1-8k'},
        # Add others as needed, simplified for now
    }
    
    import aiohttp
    
    print("\n--- Testing Fallback Keys ---")
    
    async def test_provider(name, key, url, model):
        headers = {"Authorization": f"Bearer {key}", "Content-Type": "application/json"}
        payload = {
            "model": model, 
            "messages": [{"role": "user", "content": "Hi"}], 
            "max_tokens": 10
        }
        try:
            async with aiohttp.ClientSession() as session:
                async with session.post(url, json=payload, headers=headers) as resp:
                    if resp.status == 200:
                        return True, f"Status 200 OK"
                    else:
                        txt = await resp.text()
                        return False, f"Status {resp.status}: {txt[:100]}"
        except Exception as e:
            return False, str(e)

    found_working = False
    
    for env_var, config in provider_configs.items():
        key_val = os.getenv(env_var)
        if key_val:
            print(f"\nTesting {env_var}...")
            success, msg = await test_provider(env_var, key_val, config['url'], config['model'])
            print(f"Result: {'PASS' if success else 'FAIL'} - {msg}")
            if success: found_working = True
    
    if not openrouter_key and not found_working:
        print("\n[!] No working keys found among verified fallbacks.")
        
        # Check if FALLBACK_OPENAI_KEY looks like an OpenRouter key
        potential_or_key = os.getenv("FALLBACK_OPENAI_KEY")
        if potential_or_key and potential_or_key.startswith("sk-or-v1"):
            print("\n[!] FALLBACK_OPENAI_KEY looks like an OpenRouter key. Testing against OpenRouter...")
            try:
                # Manually test against OpenRouter with this key
                headers = {
                    "Authorization": f"Bearer {potential_or_key}",
                    "Content-Type": "application/json",
                    "HTTP-Referer": "http://localhost:8000"
                }
                payload = {
                    "model": "google/gemini-2.0-flash-exp:free",
                    "messages": [{"role": "user", "content": "Hi"}],
                }
                async with aiohttp.ClientSession() as session:
                    async with session.post("https://openrouter.ai/api/v1/chat/completions", json=payload, headers=headers) as resp:
                         if resp.status == 200:
                             print(f"Result: PASS - OpenRouter Key Valid! Response: {await resp.text()}")
                         else:
                             print(f"Result: FAIL - {resp.status} {await resp.text()}")
            except Exception as e:
                print(f"Result: FAIL - {e}")
        print("\n--- Testing OpenRouter ---")
        try:
            # Force OpenRouter
            resp = await local_llm_service.generate("Hello", options={'provider': 'openrouter', 'model': 'google/gemini-2.0-flash-exp:free'})
            print(f"Success! Response: {resp.text[:50]}...")
        except Exception as e:
            print(f"OpenRouter Failed: {e}")
            
    if gemini_key:
        print("\n--- Testing Gemini ---")
        try:
            # Force Gemini
            resp = await local_llm_service.generate("Hello", options={'provider': 'gemini'})
            print(f"Success! Response: {resp.text[:50]}...")
        except Exception as e:
            print(f"Gemini Failed: {e}")

if __name__ == "__main__":
    asyncio.run(test_keys())
