import os
from pathlib import Path
from dotenv import load_dotenv

# Load environment variables from .env or .env.local
env_path = Path('.') / '.env'
if not env_path.exists():
    env_path = Path('.') / '.env.local'

load_dotenv(dotenv_path=env_path)

class Config:
    GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")
    
    # Fallback Keys
    FALLBACK_KEYS = {
        'deepseek': os.getenv('FALLBACK_DEEPSEEK_KEY'),
        'kimi': os.getenv('FALLBACK_KIMI_KEY'),
        'qwen': os.getenv('FALLBACK_QWEN_KEY'),
        'openai': os.getenv('FALLBACK_OPENAI_KEY'),
        'mistral': os.getenv('FALLBACK_MISTRAL_KEY'),
        'meta': os.getenv('FALLBACK_META_KEY'),
        'venice': os.getenv('FALLBACK_VENICE_KEY'),
        'nvidia': os.getenv('FALLBACK_NVIDIA_KEY'),
        'googlegema': os.getenv('FALLBACK_GOOGLEGEMA_KEY'),
        'microsoft': os.getenv('FALLBACK_MICROSOFT_KEY'),
        'qwencode': os.getenv('FALLBACK_QWENCODE_KEY'),
        'tencent': os.getenv('FALLBACK_TENCENT_KEY'),
        'generic': os.getenv('FALLBACK_GENERIC_KEY'),
    }
    
    # Storage paths
    DATA_DIR = Path.home() / '.yaprompt_data'
    AGENTS_FILE = DATA_DIR / 'agents.json'
    WORK_PRODUCTS_DIR = DATA_DIR / 'work_products'
    
    @classmethod
    def ensure_dirs(cls):
        cls.DATA_DIR.mkdir(parents=True, exist_ok=True)
        cls.WORK_PRODUCTS_DIR.mkdir(parents=True, exist_ok=True)

Config.ensure_dirs()
