import re
import google.generativeai as genai
from typing import Optional
from ..types import ModelType, OptimizationGoal, Stage2Result, Critique
from ..config import Config

def get_optimizer_system_prompt() -> str:
    return """You are a world-class Prompt Engineer acting as a "Refinement Specialist" in a hybrid AI optimization system. You will receive a prompt that has already been structured by a local, client-side Reinforcement Learning agent. Your goal is to take this structured but potentially generic prompt and elevate it to a world-class, production-ready prompt through deep semantic enhancement.

You MUST follow a strict three-stage process:

1.  **Reasoning Stage (<think>):**
    *   **Analyze Structured Prompt:** Briefly evaluate the incoming prompt from the local agent. Acknowledge its structure and identify its strengths and, more importantly, its weaknesses (e.g., generic phrasing, lack of specific examples, potential ambiguities).
    *   **Incorporate Context:** Analyze the "Original User Prompt" and any "Personalization Context" provided. Your primary value is to weave this specific context into the structured prompt.
    *   **Formulate Refinement Strategy:** Articulate a clear plan for improvement. Do not just repeat the input. Explain *what specific changes* you will make and *why* they will improve the prompt's performance for the target model. For example: "I will replace the generic placeholder '[example]' with a concrete, domain-specific example drawn from the user's prompt. I will also add a negative constraint to prevent common failure modes like..."

2.  **Generation Stage (<answer>):**
    *   **Execute Refinements:** Generate the final, refined, and ready-to-use prompt. This prompt must be a direct implementation of your refinement strategy. It should be a complete, standalone prompt.

3.  **Critique Stage (<critique>):**
    *   **Evaluate Final Output:** Critically evaluate your *own refined prompt*.
    *   **Assign Reward Score:** Provide a numeric "reward" score (out of 10) for the following criteria. Be realistic. The scores MUST be on separate lines in the format "Metric: X/10".
        *   Clarity: How easy is it for the target LLM to understand the prompt's intent?
        *   Robustness: How well does the prompt handle potential edge cases or misinterpretations?
        *   Efficiency: How direct and concise is the prompt in achieving the goal?
    *   **Provide Rationale:** Briefly explain your scores and suggest one potential area for future improvement.

Your entire output MUST be only the <think> block, followed immediately by the <answer> block, and then the <critique> block."""

def get_user_query_for_optimizer(
    structured_prompt: str,
    original_user_prompt: str,
    target_model: ModelType,
    goal: OptimizationGoal,
    user_resources: str,
    current_skills: str,
    time_commitment: str
) -> str:
    query = f"""**Original User Prompt:**
```
{original_user_prompt}
```

**Structured Prompt from Local RL Agent:**
```
{structured_prompt}
```

**Target Model Profile:**
- Model Name: {target_model.upper()}

**Primary Optimization Goal:**
- Maximize: {goal}"""

    has_personalization = user_resources.strip() or current_skills.strip() or time_commitment.strip()

    if has_personalization:
        query += "\n\n**Personalization Context:**"
        if user_resources.strip():
            query += f"\n- User Resources: {user_resources.strip()}"
        if current_skills.strip():
            query += f"\n- Current Skills: {current_skills.strip()}"
        if time_commitment.strip():
            query += f"\n- Time Commitment: {time_commitment.strip()}"

    return query

def parse_score(text: str, metric: str) -> float:
    regex = re.compile(f"{metric}:?\\s*(\\d+\\.?\\d*)\\s*/\\s*10", re.IGNORECASE)
    match = regex.search(text)
    return float(match.group(1)) if match else 0.0

def parse_optimizer_response(text: str) -> Stage2Result:
    think_match = re.search(r"<think>([\s\S]*?)<\/think>", text)
    answer_match = re.search(r"<answer>([\s\S]*?)<\/answer>", text)
    critique_match = re.search(r"<critique>([\s\S]*?)<\/critique>", text)

    reasoning = think_match.group(1).strip() if think_match else "The model did not provide a structured reasoning trace."
    prompt = answer_match.group(1).strip() if answer_match else text

    critique = None
    if critique_match:
        critique_text = critique_match.group(1).strip()
        critique = Critique(
            text=critique_text,
            clarity=parse_score(critique_text, 'Clarity'),
            robustness=parse_score(critique_text, 'Robustness'),
            efficiency=parse_score(critique_text, 'Efficiency')
        )

    if not think_match or not answer_match:
        print("Warning: Model response did not follow the expected <think>/<answer> format.")
        # Fallback if XML tags are missing, assume full text is prompt or reasoning?
        # The TS code sets prompt=text and provides a warning reasoning.
        if not think_match:
             reasoning = "The model's response was not in the expected format. The full response is shown below."
    
    return Stage2Result(reasoning=reasoning, prompt=prompt, critique=critique)

async def optimize_prompt(
    structured_prompt: str,
    original_user_prompt: str,
    model: ModelType,
    goal: OptimizationGoal,
    user_resources: str,
    current_skills: str,
    time_commitment: str,
    api_key: Optional[str] = None
) -> Stage2Result:
    
    # Use provided key or config key
    key = api_key or Config.GEMINI_API_KEY
    if not key:
        raise ValueError("API key not configured. Please set GEMINI_API_KEY environment variable or pass it explicitly.")

    genai.configure(api_key=key)
    
    # Use flash model as in TS
    gemini_model = genai.GenerativeModel(
        model_name='gemini-2.0-flash-exp', # Updated to 2.0 per TS code
        system_instruction=get_optimizer_system_prompt()
    )

    user_query = get_user_query_for_optimizer(
        structured_prompt, 
        original_user_prompt, 
        model, 
        goal, 
        user_resources, 
        current_skills, 
        time_commitment
    )

    try:
        response = gemini_model.generate_content(user_query)
        text = response.text
        if not text:
             raise ValueError("The optimizer returned an empty response.")
        
        return parse_optimizer_response(text)
        
    except Exception as e:
        print(f"Error calling Gemini API: {e}")
        raise e
