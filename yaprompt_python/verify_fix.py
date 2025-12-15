import sys
import os
import asyncio

# Add the project root to the python path
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from yaprompt_python.services.conversational_agent_builder import conversational_agent_builder

async def main():
    try:
        print("Starting conversation...")
        # This calls process_message which calls _call_llm which uses asyncio
        result = await conversational_agent_builder.start_conversation("I want a research agent")
        print("Conversation started successfully.")
        print(f"Response: {result.conversationHistory[-1].content}")
    except NameError as e:
        print(f"Caught expected NameError: {e}")
    except Exception as e:
        print(f"Caught unexpected exception: {e}")

if __name__ == "__main__":
    asyncio.run(main())
