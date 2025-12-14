"""
Workflow Generator (Python Port)
Generates n8n workflows
"""

import json
from typing import Dict, Any

class WorkflowGenerator:
    async def generate_workflow(self, description: str) -> Dict[str, Any]:
        from .local_llm_service import local_llm_service
        
        prompt = f"""
        You are an n8n workflow expert.
        User Request: {description}
        
        Generate a VALID n8n workflow JSON object.
        Structure:
        {{
            "name": "Workflow Name",
            "nodes": [
                {{
                    "parameters": {{...}},
                    "name": "Node Name",
                    "type": "n8n-nodes-base.nodeType",
                    "position": [x, y]
                }}
            ],
            "connections": {{
                "Node Name": {{
                    "main": [[{{"node": "Next Node", "type": "main", "index": 0}}]]
                }}
            }}
        }}
        
        Include at least a Webhook trigger and appropriate processing nodes (LLM, Function, HTTP Request etc).
        For "Research", use Google Gemini Chat node.
        For "Email", use Gmail or Email node.
        
        Provide ONLY the JSON object.
        """
        
        try:
            response = await local_llm_service.generate(prompt, {"model": "gemini-2.0-flash-exp", "provider": "gemini"})
            text = response.text
             
            start = text.find('{')
            end = text.rfind('}') + 1
            if start != -1 and end != -1:
                 return json.loads(text[start:end])
            else:
                 return {"error": "Failed to generate valid JSON", "raw": text}
                 
        except Exception as e:
            return {"error": str(e)}

workflow_generator = WorkflowGenerator()
