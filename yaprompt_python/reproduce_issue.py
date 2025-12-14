
import asyncio
import os
import sys
from dotenv import load_dotenv

# Add current dir to path to import services
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

# Load env variables from parent directory
parent_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
load_dotenv(os.path.join(parent_dir, '.env'))

print(f"Loaded .env from {parent_dir}")
api_key = os.getenv("GEMINI_API_KEY")
if not api_key:
    print("Error: GEMINI_API_KEY not found in .env")
    sys.exit(1)
else:
    print(f"GEMINI_API_KEY found (length: {len(api_key)})")

import google.generativeai as genai

async def test_models():
    genai.configure(api_key=api_key)
    
    print("\nListing available models...")
    try:
        for m in genai.list_models():
            if 'generateContent' in m.supported_generation_methods:
                print(f"Name: {m.name}")
    except Exception as e:
        print(f"ListModels FAILED: {e}")

if __name__ == "__main__":
    asyncio.run(test_models())
