
import asyncio
import os
import sys
from dotenv import load_dotenv

# Add current dir to path to import services
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

# Load env variables from parent directory
parent_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
load_dotenv(os.path.join(parent_dir, '.env'))

from services.local_llm_service import local_llm_service

async def verify():
    print("Verifying LocalLLMService with Gemini...")
    # Force provider to gemini
    try:
        response = await local_llm_service.generate(
            prompt="Hello, explicitly confirm you are working.",
            options={"provider": "gemini"}
        )
        print(f"Response: {response}")
        if "Error from gemini" in response.text:
             print("FAILURE: Service returned error.")
        else:
             print("SUCCESS: Service returned content.")
    except Exception as e:
        print(f"CRITICAL FAILURE: {e}")

if __name__ == "__main__":
    asyncio.run(verify())
