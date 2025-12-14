"""
Browser Automation Engine (Python Port)
Planning and logic for browser interactions
"""

from typing import Dict, Any, List
from pydantic import BaseModel

class BrowserAction(BaseModel):
    id: str
    action: str
    selector: str
    value: str = ""
    description: str

class BrowserAutomation:
    async def plan_sequence(self, goal: str) -> List[BrowserAction]:
        """
        Generates a sequence of browser actions to achieve a goal using LLM.
        """
        from .local_llm_service import local_llm_service
        import json
        
        prompt = f"""
        You are a browser automation expert.
        Goal: {goal}
        
        Generate a JSON list of steps to achieve this goal.
        Each step must be an object with:
        - "id": string (1, 2, 3...)
        - "action": string (one of: type, click, navigate, extract, scroll)
        - "selector": string (CSS selector)
        - "value": string (optional, for typing/navigation)
        - "description": string (human readable)

        Example Output:
        [
            {{"id": "1", "action": "navigate", "value": "https://google.com", "selector": "body", "description": "Go to Google"}},
            {{"id": "2", "action": "type", "selector": "input[name='q']", "value": "search query", "description": "Type search"}}
        ]
        
        Provide ONLY the JSON list.
        """
        
        try:
            response = await local_llm_service.generate(prompt, {"model": "gemini-2.0-flash-exp", "provider": "gemini"})
            text = response.text
            
            # Basic cleanup for JSON
            start = text.find('[')
            end = text.rfind(']') + 1
            if start != -1 and end != -1:
                json_str = text[start:end]
                data = json.loads(json_str)
                return [BrowserAction(**item) for item in data]
            else:
                 print(f"Failed to parse Browser Automation JSON: {text}")
                 return []
                 
        except Exception as e:
            print(f"Browser Automation Error: {e}")
            return []

    def validate_selector(self, selector: str) -> bool:
        # Check if selector is valid CSS/XPath (Mock logic)
        return len(selector) > 2

browser_automation = BrowserAutomation()
